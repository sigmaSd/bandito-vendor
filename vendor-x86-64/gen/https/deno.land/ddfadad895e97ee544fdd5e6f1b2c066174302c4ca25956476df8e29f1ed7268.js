import { contentType, extname, SEPARATOR, STATUS_CODE } from "./deps.ts";
import * as router from "./router.ts";
import { ALIVE_URL, DEV_CLIENT_URL, DEV_ERROR_OVERLAY_URL, JS_PREFIX } from "./constants.ts";
import { BUILD_ID, DENO_DEPLOYMENT_ID } from "./build_id.ts";
import { render as internalRender } from "./render.ts";
import { SELF } from "../runtime/csp.ts";
import { ASSET_CACHE_BUST_KEY, INTERNAL_PREFIX } from "../runtime/utils.ts";
import { EsbuildBuilder } from "../build/mod.ts";
import { setAllIslands } from "./rendering/preact_hooks.ts";
import { getCodeFrame } from "./code_frame.ts";
import { getInternalFreshState } from "./config.ts";
import { composeMiddlewares, ROOT_BASE_ROUTE, selectSharedRoutes, toBaseRoute } from "./compose.ts";
import { extractRoutes } from "./fs_extract.ts";
import { loadAotSnapshot } from "../build/aot_snapshot.ts";
import { ErrorOverlay } from "./error_overlay.tsx";
import { withBase } from "./router.ts";
import { PARTIAL_SEARCH_PARAM } from "../constants.ts";
import TailwindErrorPage from "./tailwind_aot_error_page.tsx";
const DEFAULT_CONN_INFO = {
  localAddr: {
    transport: "tcp",
    hostname: "localhost",
    port: 8080
  },
  remoteAddr: {
    transport: "tcp",
    hostname: "localhost",
    port: 1234
  }
};
// deno-lint-ignore no-explicit-any
const NOOP_COMPONENT = ()=>null;
const NOOP_NEXT = ()=>Promise.resolve(new Response(null, {
    status: 500
  }));
export async function getServerContext(state) {
  const { config, denoJson, denoJsonPath: configPath } = state;
  if (config.dev) {
    // Ensure that debugging hooks are set up for SSR rendering
    await import("preact/debug");
  }
  // Plugins are already instantiated in build mode
  if (!state.build) {
    await Promise.all(config.plugins.map((plugin)=>plugin.configResolved?.(state.config)));
  }
  const extractResult = await extractRoutes(state);
  // Restore snapshot if available
  let snapshot = null;
  if (state.loadSnapshot) {
    const loadedSnapshot = await loadAotSnapshot(config);
    if (loadedSnapshot !== null) {
      snapshot = loadedSnapshot;
      state.didLoadSnapshot = true;
    }
  }
  const finalSnapshot = snapshot ?? new EsbuildBuilder({
    buildID: BUILD_ID,
    entrypoints: collectEntrypoints(config.dev, extractResult.islands, config.plugins),
    configPath,
    dev: config.dev,
    jsx: denoJson.compilerOptions?.jsx,
    jsxImportSource: denoJson.compilerOptions?.jsxImportSource,
    target: state.config.build.target,
    absoluteWorkingDir: Deno.cwd(),
    basePath: state.config.basePath
  });
  return new ServerContext(state, extractResult, finalSnapshot);
}
export class ServerContext {
  #renderFn;
  #plugins;
  #builder;
  #state;
  #extractResult;
  #dev;
  #revision = 0;
  constructor(state, extractResult, snapshot){
    this.#state = state;
    this.#extractResult = extractResult;
    this.#renderFn = state.config.render;
    this.#plugins = state.config.plugins;
    this.#dev = state.config.dev;
    this.#builder = snapshot;
  }
  /**
   * Process the manifest into individual components and pages.
   */ static async fromManifest(manifest, config) {
    const configWithDefaults = await getInternalFreshState(manifest, config);
    return getServerContext(configWithDefaults);
  }
  /**
   * This functions returns a request handler that handles all routes required
   * by Fresh, including static files.
   */ handler() {
    const basePath = this.#state.config.basePath;
    const renderNotFound = createRenderNotFound(this.#extractResult, this.#dev, this.#plugins, this.#renderFn, this.#maybeBuildSnapshot());
    const handlers = this.#handlers(renderNotFound);
    const inner = router.router(handlers);
    const withMiddlewares = composeMiddlewares(this.#extractResult.middlewares, handlers.errorHandler, router.getParamsAndRoute(handlers), renderNotFound, basePath);
    const trailingSlashEnabled = this.#state.config.router?.trailingSlash;
    const isDev = this.#dev;
    if (this.#dev) {
      this.#revision = Date.now();
    }
    // deno-lint-ignore no-this-alias
    const _self = this;
    return async function handler(req, connInfo = DEFAULT_CONN_INFO) {
      const url = new URL(req.url);
      // Syntactically having double slashes in the pathname is valid per
      // spec, but there is no behavior defined for that. Practically all
      // servers normalize the pathname of a URL to not include double
      // forward slashes.
      url.pathname = url.pathname.replaceAll(/\/+/g, "/");
      const aliveUrl = basePath + ALIVE_URL;
      if (isDev) {
        // Live reload: Send updates to browser
        if (url.pathname === aliveUrl) {
          if (req.headers.get("upgrade") !== "websocket") {
            return new Response(null, {
              status: 501
            });
          }
          // TODO: When a change is made the Deno server restarts,
          // so for now the WebSocket connection is only used for
          // the client to know when the server is back up. Once we
          // have HMR we'll actively start sending messages back
          // and forth.
          const { response, socket } = Deno.upgradeWebSocket(req);
          socket.addEventListener("open", ()=>{
            socket.send(JSON.stringify({
              type: "initial-state",
              revision: _self.#revision
            }));
          });
          return response;
        } else if (url.pathname === withBase(DEV_CLIENT_URL, basePath) || url.pathname === withBase(`${DEV_CLIENT_URL}.map`, basePath)) {
          const bundlePath = url.pathname.endsWith(".map") ? "fresh_dev_client.js.map" : "fresh_dev_client.js";
          return _self.#bundleAssetRoute(bundlePath);
        }
      }
      // Redirect requests that end with a trailing slash to their non-trailing
      // slash counterpart.
      // Ex: /about/ -> /about
      if (url.pathname.length > 1 && url.pathname.endsWith("/") && !trailingSlashEnabled) {
        // Remove trailing slashes
        const path = url.pathname.replace(/\/+$/, "");
        const location = `${path}${url.search}`;
        return new Response(null, {
          status: STATUS_CODE.TemporaryRedirect,
          headers: {
            location
          }
        });
      } else if (trailingSlashEnabled && !url.pathname.endsWith("/")) {
        // If the last element of the path has a "." it's a file
        const isFile = url.pathname.split("/").at(-1)?.includes(".");
        // If the path uses the internal prefix, don't redirect it
        const isInternal = url.pathname.startsWith(INTERNAL_PREFIX);
        if (!isFile && !isInternal) {
          url.pathname += "/";
          return Response.redirect(url, STATUS_CODE.PermanentRedirect);
        }
      }
      // Redirect to base path if not present in url
      if (basePath && !url.pathname.startsWith(basePath)) {
        const to = new URL(basePath + url.pathname, url.origin);
        return Response.redirect(to, 302);
      }
      const ctx = {
        url,
        params: {},
        config: _self.#state.config,
        basePath: _self.#state.config.basePath,
        localAddr: connInfo.localAddr,
        remoteAddr: connInfo.remoteAddr,
        state: {},
        isPartial: url.searchParams.has(PARTIAL_SEARCH_PARAM),
        destination: "route",
        error: undefined,
        codeFrame: undefined,
        Component: NOOP_COMPONENT,
        next: NOOP_NEXT,
        render: NOOP_NEXT,
        renderNotFound: async (data)=>{
          ctx.data = data;
          return await renderNotFound(req, ctx);
        },
        route: "",
        get pattern () {
          return ctx.route;
        },
        data: undefined
      };
      return await withMiddlewares(req, ctx, inner);
    };
  }
  #maybeBuildSnapshot() {
    if ("build" in this.#builder || this.#builder instanceof Promise) {
      return null;
    }
    return this.#builder;
  }
  async buildSnapshot() {
    if ("build" in this.#builder) {
      const builder = this.#builder;
      this.#builder = builder.build();
      try {
        const snapshot = await this.#builder;
        this.#builder = snapshot;
      } catch (err) {
        this.#builder = builder;
        throw err;
      }
    }
    return this.#builder;
  }
  /**
   * This function returns all routes required by Fresh as an extended
   * path-to-regex, to handler mapping.
   */ #handlers(renderNotFound) {
    const internalRoutes = {};
    const staticRoutes = {};
    let routes = {};
    const assetRoute = withBase(`${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}/:path*`, this.#state.config.basePath);
    internalRoutes[assetRoute] = {
      baseRoute: toBaseRoute(assetRoute),
      methods: {
        default: (_req, ctx)=>this.#bundleAssetRoute(ctx.params.path)
      }
    };
    // Add the static file routes.
    // each files has 2 static routes:
    // - one serving the file at its location without a "cache bursting" mechanism
    // - one containing the BUILD_ID in the path that can be cached
    for (const { localUrl, path, size, contentType, etag } of this.#extractResult.staticFiles){
      staticRoutes[path.replaceAll(SEPARATOR, "/")] = {
        baseRoute: toBaseRoute(path),
        methods: {
          "HEAD": this.#staticFileHandler(localUrl, size, contentType, etag),
          "GET": this.#staticFileHandler(localUrl, size, contentType, etag)
        }
      };
    }
    // Tell renderer about all globally available islands
    setAllIslands(this.#extractResult.islands);
    const dependenciesFn = (path)=>{
      const snapshot = this.#maybeBuildSnapshot();
      return snapshot?.dependencies(path) ?? [];
    };
    const genRender = (route, status)=>{
      const imports = [];
      if (this.#dev) imports.push(this.#state.config.basePath + DEV_CLIENT_URL);
      return (req, ctx, error, codeFrame)=>{
        return async (data, options)=>{
          if (route.component === undefined) {
            throw new Error("This page does not have a component to render.");
          }
          const layouts = selectSharedRoutes(route.baseRoute, this.#extractResult.layouts);
          ctx.error = error;
          ctx.data = data;
          const resp = await internalRender({
            request: req,
            context: ctx,
            route,
            plugins: this.#plugins,
            app: this.#extractResult.app,
            layouts,
            imports,
            dependenciesFn,
            renderFn: this.#renderFn,
            codeFrame
          });
          if (resp instanceof Response) {
            return resp;
          }
          return sendResponse(resp, {
            status: options?.status ?? status,
            statusText: options?.statusText,
            headers: options?.headers,
            isDev: this.#dev
          });
        };
      };
    };
    for (const route of this.#extractResult.routes){
      if (this.#state.config.router?.trailingSlash && route.pattern != "/") {
        route.pattern += "/";
      }
      const createRender = genRender(route, STATUS_CODE.OK);
      if (typeof route.handler === "function") {
        routes[route.pattern] = {
          baseRoute: route.baseRoute,
          methods: {
            default: (req, ctx)=>{
              ctx.render = createRender(req, ctx);
              return route.handler(req, ctx);
            }
          }
        };
      } else {
        routes[route.pattern] = {
          baseRoute: route.baseRoute,
          methods: {}
        };
        for (const [method, handler] of Object.entries(route.handler)){
          routes[route.pattern].methods[method] = (req, ctx)=>{
            ctx.render = createRender(req, ctx);
            return handler(req, ctx);
          };
        }
      }
    }
    let otherHandler = (req, ctx)=>{
      ctx.render = (data)=>{
        ctx.data = data;
        return renderNotFound(req, ctx);
      };
      return this.#extractResult.notFound.handler(req, ctx);
    };
    const errorHandlerRender = genRender(this.#extractResult.error, STATUS_CODE.InternalServerError);
    const errorHandler = async (req, ctx, error)=>{
      console.error("%cAn error occurred during route handling or page rendering.", "color:red");
      let codeFrame;
      if (this.#dev && error instanceof Error) {
        codeFrame = await getCodeFrame(error);
        if (codeFrame) {
          console.error();
          console.error(codeFrame);
        }
      }
      console.error(error);
      ctx.error = error;
      ctx.render = errorHandlerRender(req, ctx, error, codeFrame);
      return this.#extractResult.error.handler(req, ctx);
    };
    if (this.#dev) {
      const devErrorUrl = withBase(DEV_ERROR_OVERLAY_URL, this.#state.config.basePath);
      const baseRoute = toBaseRoute(devErrorUrl);
      internalRoutes[devErrorUrl] = {
        baseRoute,
        methods: {
          default: async (req, ctx)=>{
            const resp = await internalRender({
              request: req,
              context: ctx,
              route: {
                component: ErrorOverlay,
                inheritLayouts: false,
                appWrapper: false,
                csp: false,
                url: req.url,
                name: "error overlay route",
                handler: (_req, ctx)=>ctx.render(),
                baseRoute,
                pattern: baseRoute
              },
              plugins: this.#plugins,
              app: this.#extractResult.app,
              layouts: [],
              imports: [],
              dependenciesFn: ()=>[],
              renderFn: this.#renderFn,
              codeFrame: undefined
            });
            if (resp instanceof Response) {
              return resp;
            }
            return sendResponse(resp, {
              status: 200,
              isDev: this.#dev,
              statusText: undefined,
              headers: undefined
            });
          }
        }
      };
    }
    // This page is shown when the user uses the tailwindcss plugin and
    // hasn't configured AOT builds.
    if (!this.#state.config.dev && this.#state.loadSnapshot && !this.#state.didLoadSnapshot && this.#state.config.plugins.some((plugin)=>plugin.name === "tailwind")) {
      if (DENO_DEPLOYMENT_ID !== undefined) {
        // Don't fail hard here and instead rewrite all routes to a special
        // error route. Otherwise the first user experience of deploying a
        // Fresh project would be pretty disruptive
        console.error("%cError: Ahead of time builds not configured but required by the tailwindcss plugin.\nTo resolve this error, set up ahead of time builds: https://fresh.deno.dev/docs/concepts/ahead-of-time-builds", "color: red");
        console.log();
        // Clear all routes so that everything redirects to the tailwind
        // error page.
        routes = {};
        const freshErrorPage = genRender({
          appWrapper: false,
          inheritLayouts: false,
          component: TailwindErrorPage,
          csp: false,
          name: "tailwind_error_route",
          pattern: "*",
          url: "",
          baseRoute: toBaseRoute("*"),
          handler: (_req, ctx)=>ctx.render()
        }, STATUS_CODE.InternalServerError);
        otherHandler = (req, ctx)=>{
          const render = freshErrorPage(req, ctx);
          return render();
        };
      } else {
        // Not on Deno Deploy. The user likely forgot to run `deno task build`
        console.warn('%cNo pre-compiled tailwind styles found.\n\nDid you forget to run "deno task build" prior to starting the production server?', "color: yellow");
      }
    }
    return {
      internalRoutes,
      staticRoutes,
      routes,
      otherHandler,
      errorHandler
    };
  }
  #staticFileHandler(localUrl, size, contentType, etag) {
    return async (req)=>{
      const url = new URL(req.url);
      const key = url.searchParams.get(ASSET_CACHE_BUST_KEY);
      if (key !== null && BUILD_ID !== key) {
        url.searchParams.delete(ASSET_CACHE_BUST_KEY);
        const location = url.pathname + url.search;
        return new Response(null, {
          status: 307,
          headers: {
            location
          }
        });
      }
      const headers = new Headers({
        "content-type": contentType,
        etag,
        vary: "If-None-Match"
      });
      if (key !== null) {
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
      }
      const ifNoneMatch = req.headers.get("if-none-match");
      if (ifNoneMatch === etag || ifNoneMatch === "W/" + etag) {
        return new Response(null, {
          status: 304,
          headers
        });
      } else if (req.method === "HEAD") {
        headers.set("content-length", String(size));
        return new Response(null, {
          status: 200,
          headers
        });
      } else {
        const file = await Deno.open(localUrl);
        headers.set("content-length", String(size));
        return new Response(file.readable, {
          headers
        });
      }
    };
  }
  async #bundleAssetRoute(filePath) {
    const snapshot = await this.buildSnapshot();
    const contents = await snapshot.read(filePath);
    if (!contents) return new Response(null, {
      status: 404
    });
    const headers = {
      "Cache-Control": this.#dev ? "no-cache, no-store, max-age=0, must-revalidate" : "public, max-age=604800, immutable"
    };
    const type = contentType(extname(filePath));
    if (type) headers["Content-Type"] = type;
    return new Response(contents, {
      status: 200,
      headers
    });
  }
}
const createRenderNotFound = (extractResult, dev, plugins, renderFunction, buildSnapshot)=>{
  const dependenciesFn = (path)=>{
    const snapshot = buildSnapshot;
    return snapshot?.dependencies(path) ?? [];
  };
  return async (req, ctx)=>{
    const notFound = extractResult.notFound;
    if (!notFound.component) {
      return sendResponse([
        "Not found.",
        "",
        undefined
      ], {
        status: STATUS_CODE.NotFound,
        isDev: dev,
        statusText: undefined,
        headers: undefined
      });
    }
    const layouts = selectSharedRoutes(ROOT_BASE_ROUTE, extractResult.layouts);
    const imports = [];
    const resp = await internalRender({
      request: req,
      context: ctx,
      route: notFound,
      plugins: plugins,
      app: extractResult.app,
      layouts,
      imports,
      dependenciesFn,
      renderFn: renderFunction
    });
    if (resp instanceof Response) {
      return resp;
    }
    return sendResponse(resp, {
      status: STATUS_CODE.NotFound,
      isDev: dev,
      statusText: undefined,
      headers: undefined
    });
  };
};
// Normalize a path for use in a URL. Returns null if the path is unparsable.
export function normalizeURLPath(path) {
  try {
    const pathUrl = new URL("file:///");
    pathUrl.pathname = path;
    return pathUrl.pathname;
  } catch  {
    return null;
  }
}
function serializeCSPDirectives(csp) {
  return Object.entries(csp).filter(([_key, value])=>value !== undefined).map(([k, v])=>{
    // Turn camel case into snake case.
    const key = k.replace(/[A-Z]/g, (m)=>`-${m.toLowerCase()}`);
    const value = Array.isArray(v) ? v.join(" ") : v;
    return `${key} ${value}`;
  }).join("; ");
}
function collectEntrypoints(dev, islands, plugins) {
  const entrypointBase = "../runtime/entrypoints";
  const entryPoints = {
    main: dev ? import.meta.resolve(`${entrypointBase}/main_dev.ts`) : import.meta.resolve(`${entrypointBase}/main.ts`),
    deserializer: import.meta.resolve(`${entrypointBase}/deserializer.ts`)
  };
  if (dev) {
    entryPoints.fresh_dev_client = import.meta.resolve(`${entrypointBase}/client.ts`);
  }
  try {
    import.meta.resolve("@preact/signals");
    entryPoints.signals = import.meta.resolve(`${entrypointBase}/signals.ts`);
  } catch  {
  // @preact/signals is not in the import map
  }
  for (const island of islands){
    entryPoints[`island-${island.name}`] = island.url;
  }
  for (const plugin of plugins){
    for (const [name, url] of Object.entries(plugin.entrypoints ?? {})){
      entryPoints[`plugin-${plugin.name}-${name}`] = url;
    }
  }
  return entryPoints;
}
function sendResponse(resp, options) {
  const [body, uuid, csp] = resp;
  const headers = new Headers({
    "content-type": "text/html; charset=utf-8",
    "x-fresh-uuid": uuid
  });
  if (csp) {
    if (options.isDev) {
      csp.directives.connectSrc = [
        ...csp.directives.connectSrc ?? [],
        SELF
      ];
    }
    const directive = serializeCSPDirectives(csp.directives);
    if (csp.reportOnly) {
      headers.set("content-security-policy-report-only", directive);
    } else {
      headers.set("content-security-policy", directive);
    }
  }
  if (options.headers) {
    if (Array.isArray(options.headers)) {
      for (const [key, value] of options.headers){
        headers.append(key, value);
      }
    } else if (options.headers instanceof Headers) {
      options.headers.forEach((value, key)=>{
        headers.append(key, value);
      });
    } else {
      for (const [key, value] of Object.entries(options.headers)){
        headers.append(key, value);
      }
    }
  }
  return new Response(body, {
    status: options.status,
    statusText: options.statusText,
    headers
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9jb250ZXh0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbnRlbnRUeXBlLCBleHRuYW1lLCBTRVBBUkFUT1IsIFNUQVRVU19DT0RFIH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0ICogYXMgcm91dGVyIGZyb20gXCIuL3JvdXRlci50c1wiO1xuaW1wb3J0IHsgRnJlc2hDb25maWcsIEZyZXNoQ29udGV4dCwgTWFuaWZlc3QgfSBmcm9tIFwiLi9tb2QudHNcIjtcbmltcG9ydCB7XG4gIEFMSVZFX1VSTCxcbiAgREVWX0NMSUVOVF9VUkwsXG4gIERFVl9FUlJPUl9PVkVSTEFZX1VSTCxcbiAgSlNfUFJFRklYLFxufSBmcm9tIFwiLi9jb25zdGFudHMudHNcIjtcbmltcG9ydCB7IEJVSUxEX0lELCBERU5PX0RFUExPWU1FTlRfSUQgfSBmcm9tIFwiLi9idWlsZF9pZC50c1wiO1xuXG5pbXBvcnQge1xuICBFcnJvclBhZ2UsXG4gIEhhbmRsZXIsXG4gIEludGVybmFsRnJlc2hTdGF0ZSxcbiAgSXNsYW5kLFxuICBQbHVnaW4sXG4gIFJlbmRlckZ1bmN0aW9uLFxuICBSZW5kZXJPcHRpb25zLFxuICBSb3V0ZSxcbiAgU2VydmVIYW5kbGVySW5mbyxcbiAgVW5rbm93blBhZ2UsXG4gIFVua25vd25SZW5kZXJGdW5jdGlvbixcbn0gZnJvbSBcIi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IHJlbmRlciBhcyBpbnRlcm5hbFJlbmRlciB9IGZyb20gXCIuL3JlbmRlci50c1wiO1xuaW1wb3J0IHtcbiAgQ29udGVudFNlY3VyaXR5UG9saWN5LFxuICBDb250ZW50U2VjdXJpdHlQb2xpY3lEaXJlY3RpdmVzLFxuICBTRUxGLFxufSBmcm9tIFwiLi4vcnVudGltZS9jc3AudHNcIjtcbmltcG9ydCB7IEFTU0VUX0NBQ0hFX0JVU1RfS0VZLCBJTlRFUk5BTF9QUkVGSVggfSBmcm9tIFwiLi4vcnVudGltZS91dGlscy50c1wiO1xuaW1wb3J0IHsgQnVpbGRlciwgQnVpbGRTbmFwc2hvdCwgRXNidWlsZEJ1aWxkZXIgfSBmcm9tIFwiLi4vYnVpbGQvbW9kLnRzXCI7XG5pbXBvcnQgeyBzZXRBbGxJc2xhbmRzIH0gZnJvbSBcIi4vcmVuZGVyaW5nL3ByZWFjdF9ob29rcy50c1wiO1xuaW1wb3J0IHsgZ2V0Q29kZUZyYW1lIH0gZnJvbSBcIi4vY29kZV9mcmFtZS50c1wiO1xuaW1wb3J0IHsgZ2V0SW50ZXJuYWxGcmVzaFN0YXRlIH0gZnJvbSBcIi4vY29uZmlnLnRzXCI7XG5pbXBvcnQge1xuICBjb21wb3NlTWlkZGxld2FyZXMsXG4gIFJPT1RfQkFTRV9ST1VURSxcbiAgc2VsZWN0U2hhcmVkUm91dGVzLFxuICB0b0Jhc2VSb3V0ZSxcbn0gZnJvbSBcIi4vY29tcG9zZS50c1wiO1xuaW1wb3J0IHsgZXh0cmFjdFJvdXRlcywgRnNFeHRyYWN0UmVzdWx0IH0gZnJvbSBcIi4vZnNfZXh0cmFjdC50c1wiO1xuaW1wb3J0IHsgbG9hZEFvdFNuYXBzaG90IH0gZnJvbSBcIi4uL2J1aWxkL2FvdF9zbmFwc2hvdC50c1wiO1xuaW1wb3J0IHsgRXJyb3JPdmVybGF5IH0gZnJvbSBcIi4vZXJyb3Jfb3ZlcmxheS50c3hcIjtcbmltcG9ydCB7IHdpdGhCYXNlIH0gZnJvbSBcIi4vcm91dGVyLnRzXCI7XG5pbXBvcnQgeyBQQVJUSUFMX1NFQVJDSF9QQVJBTSB9IGZyb20gXCIuLi9jb25zdGFudHMudHNcIjtcbmltcG9ydCBUYWlsd2luZEVycm9yUGFnZSBmcm9tIFwiLi90YWlsd2luZF9hb3RfZXJyb3JfcGFnZS50c3hcIjtcblxuY29uc3QgREVGQVVMVF9DT05OX0lORk86IFNlcnZlSGFuZGxlckluZm8gPSB7XG4gIGxvY2FsQWRkcjogeyB0cmFuc3BvcnQ6IFwidGNwXCIsIGhvc3RuYW1lOiBcImxvY2FsaG9zdFwiLCBwb3J0OiA4MDgwIH0sXG4gIHJlbW90ZUFkZHI6IHsgdHJhbnNwb3J0OiBcInRjcFwiLCBob3N0bmFtZTogXCJsb2NhbGhvc3RcIiwgcG9ydDogMTIzNCB9LFxufTtcblxuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmNvbnN0IE5PT1BfQ09NUE9ORU5UID0gKCkgPT4gbnVsbCBhcyBhbnk7XG5jb25zdCBOT09QX05FWFQgPSAoKSA9PiBQcm9taXNlLnJlc29sdmUobmV3IFJlc3BvbnNlKG51bGwsIHsgc3RhdHVzOiA1MDAgfSkpO1xuXG4vKipcbiAqIEBkZXByZWNhdGVkIFVzZSB7QGxpbmtjb2RlIEZyb21NYW5pZmVzdENvbmZpZ30gaW5zdGVhZFxuICovXG5leHBvcnQgdHlwZSBGcm9tTWFuaWZlc3RPcHRpb25zID0gRnJvbU1hbmlmZXN0Q29uZmlnO1xuXG5leHBvcnQgdHlwZSBGcm9tTWFuaWZlc3RDb25maWcgPSBGcmVzaENvbmZpZyAmIHtcbiAgZGV2PzogYm9vbGVhbjtcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTZXJ2ZXJDb250ZXh0KHN0YXRlOiBJbnRlcm5hbEZyZXNoU3RhdGUpIHtcbiAgY29uc3QgeyBjb25maWcsIGRlbm9Kc29uLCBkZW5vSnNvblBhdGg6IGNvbmZpZ1BhdGggfSA9IHN0YXRlO1xuXG4gIGlmIChjb25maWcuZGV2KSB7XG4gICAgLy8gRW5zdXJlIHRoYXQgZGVidWdnaW5nIGhvb2tzIGFyZSBzZXQgdXAgZm9yIFNTUiByZW5kZXJpbmdcbiAgICBhd2FpdCBpbXBvcnQoXCJwcmVhY3QvZGVidWdcIik7XG4gIH1cblxuICAvLyBQbHVnaW5zIGFyZSBhbHJlYWR5IGluc3RhbnRpYXRlZCBpbiBidWlsZCBtb2RlXG4gIGlmICghc3RhdGUuYnVpbGQpIHtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgIGNvbmZpZy5wbHVnaW5zLm1hcCgocGx1Z2luKSA9PiBwbHVnaW4uY29uZmlnUmVzb2x2ZWQ/LihzdGF0ZS5jb25maWcpKSxcbiAgICApO1xuICB9XG5cbiAgY29uc3QgZXh0cmFjdFJlc3VsdCA9IGF3YWl0IGV4dHJhY3RSb3V0ZXMoc3RhdGUpO1xuXG4gIC8vIFJlc3RvcmUgc25hcHNob3QgaWYgYXZhaWxhYmxlXG4gIGxldCBzbmFwc2hvdDogQnVpbGRlciB8IEJ1aWxkU25hcHNob3QgfCBQcm9taXNlPEJ1aWxkU25hcHNob3Q+IHwgbnVsbCA9IG51bGw7XG4gIGlmIChzdGF0ZS5sb2FkU25hcHNob3QpIHtcbiAgICBjb25zdCBsb2FkZWRTbmFwc2hvdCA9IGF3YWl0IGxvYWRBb3RTbmFwc2hvdChjb25maWcpO1xuICAgIGlmIChsb2FkZWRTbmFwc2hvdCAhPT0gbnVsbCkge1xuICAgICAgc25hcHNob3QgPSBsb2FkZWRTbmFwc2hvdDtcbiAgICAgIHN0YXRlLmRpZExvYWRTbmFwc2hvdCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZmluYWxTbmFwc2hvdCA9IHNuYXBzaG90ID8/IG5ldyBFc2J1aWxkQnVpbGRlcih7XG4gICAgYnVpbGRJRDogQlVJTERfSUQsXG4gICAgZW50cnlwb2ludHM6IGNvbGxlY3RFbnRyeXBvaW50cyhcbiAgICAgIGNvbmZpZy5kZXYsXG4gICAgICBleHRyYWN0UmVzdWx0LmlzbGFuZHMsXG4gICAgICBjb25maWcucGx1Z2lucyxcbiAgICApLFxuICAgIGNvbmZpZ1BhdGgsXG4gICAgZGV2OiBjb25maWcuZGV2LFxuICAgIGpzeDogZGVub0pzb24uY29tcGlsZXJPcHRpb25zPy5qc3gsXG4gICAganN4SW1wb3J0U291cmNlOiBkZW5vSnNvbi5jb21waWxlck9wdGlvbnM/LmpzeEltcG9ydFNvdXJjZSxcbiAgICB0YXJnZXQ6IHN0YXRlLmNvbmZpZy5idWlsZC50YXJnZXQsXG4gICAgYWJzb2x1dGVXb3JraW5nRGlyOiBEZW5vLmN3ZCgpLFxuICAgIGJhc2VQYXRoOiBzdGF0ZS5jb25maWcuYmFzZVBhdGgsXG4gIH0pO1xuXG4gIHJldHVybiBuZXcgU2VydmVyQ29udGV4dChcbiAgICBzdGF0ZSxcbiAgICBleHRyYWN0UmVzdWx0LFxuICAgIGZpbmFsU25hcHNob3QsXG4gICk7XG59XG5cbmV4cG9ydCBjbGFzcyBTZXJ2ZXJDb250ZXh0IHtcbiAgI3JlbmRlckZuOiBSZW5kZXJGdW5jdGlvbjtcbiAgI3BsdWdpbnM6IFBsdWdpbltdO1xuICAjYnVpbGRlcjogQnVpbGRlciB8IFByb21pc2U8QnVpbGRTbmFwc2hvdD4gfCBCdWlsZFNuYXBzaG90O1xuICAjc3RhdGU6IEludGVybmFsRnJlc2hTdGF0ZTtcbiAgI2V4dHJhY3RSZXN1bHQ6IEZzRXh0cmFjdFJlc3VsdDtcbiAgI2RldjogYm9vbGVhbjtcbiAgI3JldmlzaW9uID0gMDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBzdGF0ZTogSW50ZXJuYWxGcmVzaFN0YXRlLFxuICAgIGV4dHJhY3RSZXN1bHQ6IEZzRXh0cmFjdFJlc3VsdCxcbiAgICBzbmFwc2hvdDogQnVpbGRlciB8IEJ1aWxkU25hcHNob3QgfCBQcm9taXNlPEJ1aWxkU25hcHNob3Q+LFxuICApIHtcbiAgICB0aGlzLiNzdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMuI2V4dHJhY3RSZXN1bHQgPSBleHRyYWN0UmVzdWx0O1xuICAgIHRoaXMuI3JlbmRlckZuID0gc3RhdGUuY29uZmlnLnJlbmRlcjtcbiAgICB0aGlzLiNwbHVnaW5zID0gc3RhdGUuY29uZmlnLnBsdWdpbnM7XG4gICAgdGhpcy4jZGV2ID0gc3RhdGUuY29uZmlnLmRldjtcbiAgICB0aGlzLiNidWlsZGVyID0gc25hcHNob3Q7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2VzcyB0aGUgbWFuaWZlc3QgaW50byBpbmRpdmlkdWFsIGNvbXBvbmVudHMgYW5kIHBhZ2VzLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGZyb21NYW5pZmVzdChcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgY29uZmlnOiBGcm9tTWFuaWZlc3RDb25maWcsXG4gICk6IFByb21pc2U8U2VydmVyQ29udGV4dD4ge1xuICAgIGNvbnN0IGNvbmZpZ1dpdGhEZWZhdWx0cyA9IGF3YWl0IGdldEludGVybmFsRnJlc2hTdGF0ZShcbiAgICAgIG1hbmlmZXN0LFxuICAgICAgY29uZmlnLFxuICAgICk7XG4gICAgcmV0dXJuIGdldFNlcnZlckNvbnRleHQoY29uZmlnV2l0aERlZmF1bHRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGZ1bmN0aW9ucyByZXR1cm5zIGEgcmVxdWVzdCBoYW5kbGVyIHRoYXQgaGFuZGxlcyBhbGwgcm91dGVzIHJlcXVpcmVkXG4gICAqIGJ5IEZyZXNoLCBpbmNsdWRpbmcgc3RhdGljIGZpbGVzLlxuICAgKi9cbiAgaGFuZGxlcigpOiAocmVxOiBSZXF1ZXN0LCBjb25uSW5mbz86IFNlcnZlSGFuZGxlckluZm8pID0+IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHRoaXMuI3N0YXRlLmNvbmZpZy5iYXNlUGF0aDtcbiAgICBjb25zdCByZW5kZXJOb3RGb3VuZCA9IGNyZWF0ZVJlbmRlck5vdEZvdW5kKFxuICAgICAgdGhpcy4jZXh0cmFjdFJlc3VsdCxcbiAgICAgIHRoaXMuI2RldixcbiAgICAgIHRoaXMuI3BsdWdpbnMsXG4gICAgICB0aGlzLiNyZW5kZXJGbixcbiAgICAgIHRoaXMuI21heWJlQnVpbGRTbmFwc2hvdCgpLFxuICAgICk7XG4gICAgY29uc3QgaGFuZGxlcnMgPSB0aGlzLiNoYW5kbGVycyhyZW5kZXJOb3RGb3VuZCk7XG4gICAgY29uc3QgaW5uZXIgPSByb3V0ZXIucm91dGVyKGhhbmRsZXJzKTtcbiAgICBjb25zdCB3aXRoTWlkZGxld2FyZXMgPSBjb21wb3NlTWlkZGxld2FyZXMoXG4gICAgICB0aGlzLiNleHRyYWN0UmVzdWx0Lm1pZGRsZXdhcmVzLFxuICAgICAgaGFuZGxlcnMuZXJyb3JIYW5kbGVyLFxuICAgICAgcm91dGVyLmdldFBhcmFtc0FuZFJvdXRlKGhhbmRsZXJzKSxcbiAgICAgIHJlbmRlck5vdEZvdW5kLFxuICAgICAgYmFzZVBhdGgsXG4gICAgKTtcbiAgICBjb25zdCB0cmFpbGluZ1NsYXNoRW5hYmxlZCA9IHRoaXMuI3N0YXRlLmNvbmZpZy5yb3V0ZXI/LnRyYWlsaW5nU2xhc2g7XG4gICAgY29uc3QgaXNEZXYgPSB0aGlzLiNkZXY7XG5cbiAgICBpZiAodGhpcy4jZGV2KSB7XG4gICAgICB0aGlzLiNyZXZpc2lvbiA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby10aGlzLWFsaWFzXG4gICAgY29uc3QgX3NlbGYgPSB0aGlzO1xuXG4gICAgcmV0dXJuIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoXG4gICAgICByZXE6IFJlcXVlc3QsXG4gICAgICBjb25uSW5mbzogU2VydmVIYW5kbGVySW5mbyA9IERFRkFVTFRfQ09OTl9JTkZPLFxuICAgICkge1xuICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsKTtcbiAgICAgIC8vIFN5bnRhY3RpY2FsbHkgaGF2aW5nIGRvdWJsZSBzbGFzaGVzIGluIHRoZSBwYXRobmFtZSBpcyB2YWxpZCBwZXJcbiAgICAgIC8vIHNwZWMsIGJ1dCB0aGVyZSBpcyBubyBiZWhhdmlvciBkZWZpbmVkIGZvciB0aGF0LiBQcmFjdGljYWxseSBhbGxcbiAgICAgIC8vIHNlcnZlcnMgbm9ybWFsaXplIHRoZSBwYXRobmFtZSBvZiBhIFVSTCB0byBub3QgaW5jbHVkZSBkb3VibGVcbiAgICAgIC8vIGZvcndhcmQgc2xhc2hlcy5cbiAgICAgIHVybC5wYXRobmFtZSA9IHVybC5wYXRobmFtZS5yZXBsYWNlQWxsKC9cXC8rL2csIFwiL1wiKTtcblxuICAgICAgY29uc3QgYWxpdmVVcmwgPSBiYXNlUGF0aCArIEFMSVZFX1VSTDtcblxuICAgICAgaWYgKGlzRGV2KSB7XG4gICAgICAgIC8vIExpdmUgcmVsb2FkOiBTZW5kIHVwZGF0ZXMgdG8gYnJvd3NlclxuICAgICAgICBpZiAodXJsLnBhdGhuYW1lID09PSBhbGl2ZVVybCkge1xuICAgICAgICAgIGlmIChyZXEuaGVhZGVycy5nZXQoXCJ1cGdyYWRlXCIpICE9PSBcIndlYnNvY2tldFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHsgc3RhdHVzOiA1MDEgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVE9ETzogV2hlbiBhIGNoYW5nZSBpcyBtYWRlIHRoZSBEZW5vIHNlcnZlciByZXN0YXJ0cyxcbiAgICAgICAgICAvLyBzbyBmb3Igbm93IHRoZSBXZWJTb2NrZXQgY29ubmVjdGlvbiBpcyBvbmx5IHVzZWQgZm9yXG4gICAgICAgICAgLy8gdGhlIGNsaWVudCB0byBrbm93IHdoZW4gdGhlIHNlcnZlciBpcyBiYWNrIHVwLiBPbmNlIHdlXG4gICAgICAgICAgLy8gaGF2ZSBITVIgd2UnbGwgYWN0aXZlbHkgc3RhcnQgc2VuZGluZyBtZXNzYWdlcyBiYWNrXG4gICAgICAgICAgLy8gYW5kIGZvcnRoLlxuICAgICAgICAgIGNvbnN0IHsgcmVzcG9uc2UsIHNvY2tldCB9ID0gRGVuby51cGdyYWRlV2ViU29ja2V0KHJlcSk7XG5cbiAgICAgICAgICBzb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgKCkgPT4ge1xuICAgICAgICAgICAgc29ja2V0LnNlbmQoXG4gICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImluaXRpYWwtc3RhdGVcIixcbiAgICAgICAgICAgICAgICByZXZpc2lvbjogX3NlbGYuI3JldmlzaW9uLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgdXJsLnBhdGhuYW1lID09PSB3aXRoQmFzZShERVZfQ0xJRU5UX1VSTCwgYmFzZVBhdGgpIHx8XG4gICAgICAgICAgdXJsLnBhdGhuYW1lID09PSB3aXRoQmFzZShgJHtERVZfQ0xJRU5UX1VSTH0ubWFwYCwgYmFzZVBhdGgpXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnN0IGJ1bmRsZVBhdGggPSAodXJsLnBhdGhuYW1lLmVuZHNXaXRoKFwiLm1hcFwiKSlcbiAgICAgICAgICAgID8gXCJmcmVzaF9kZXZfY2xpZW50LmpzLm1hcFwiXG4gICAgICAgICAgICA6IFwiZnJlc2hfZGV2X2NsaWVudC5qc1wiO1xuXG4gICAgICAgICAgcmV0dXJuIF9zZWxmLiNidW5kbGVBc3NldFJvdXRlKGJ1bmRsZVBhdGgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZGlyZWN0IHJlcXVlc3RzIHRoYXQgZW5kIHdpdGggYSB0cmFpbGluZyBzbGFzaCB0byB0aGVpciBub24tdHJhaWxpbmdcbiAgICAgIC8vIHNsYXNoIGNvdW50ZXJwYXJ0LlxuICAgICAgLy8gRXg6IC9hYm91dC8gLT4gL2Fib3V0XG4gICAgICBpZiAoXG4gICAgICAgIHVybC5wYXRobmFtZS5sZW5ndGggPiAxICYmIHVybC5wYXRobmFtZS5lbmRzV2l0aChcIi9cIikgJiZcbiAgICAgICAgIXRyYWlsaW5nU2xhc2hFbmFibGVkXG4gICAgICApIHtcbiAgICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHNsYXNoZXNcbiAgICAgICAgY29uc3QgcGF0aCA9IHVybC5wYXRobmFtZS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IGAke3BhdGh9JHt1cmwuc2VhcmNofWA7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwge1xuICAgICAgICAgIHN0YXR1czogU1RBVFVTX0NPREUuVGVtcG9yYXJ5UmVkaXJlY3QsXG4gICAgICAgICAgaGVhZGVyczogeyBsb2NhdGlvbiB9LFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAodHJhaWxpbmdTbGFzaEVuYWJsZWQgJiYgIXVybC5wYXRobmFtZS5lbmRzV2l0aChcIi9cIikpIHtcbiAgICAgICAgLy8gSWYgdGhlIGxhc3QgZWxlbWVudCBvZiB0aGUgcGF0aCBoYXMgYSBcIi5cIiBpdCdzIGEgZmlsZVxuICAgICAgICBjb25zdCBpc0ZpbGUgPSB1cmwucGF0aG5hbWUuc3BsaXQoXCIvXCIpLmF0KC0xKT8uaW5jbHVkZXMoXCIuXCIpO1xuXG4gICAgICAgIC8vIElmIHRoZSBwYXRoIHVzZXMgdGhlIGludGVybmFsIHByZWZpeCwgZG9uJ3QgcmVkaXJlY3QgaXRcbiAgICAgICAgY29uc3QgaXNJbnRlcm5hbCA9IHVybC5wYXRobmFtZS5zdGFydHNXaXRoKElOVEVSTkFMX1BSRUZJWCk7XG5cbiAgICAgICAgaWYgKCFpc0ZpbGUgJiYgIWlzSW50ZXJuYWwpIHtcbiAgICAgICAgICB1cmwucGF0aG5hbWUgKz0gXCIvXCI7XG4gICAgICAgICAgcmV0dXJuIFJlc3BvbnNlLnJlZGlyZWN0KHVybCwgU1RBVFVTX0NPREUuUGVybWFuZW50UmVkaXJlY3QpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZGlyZWN0IHRvIGJhc2UgcGF0aCBpZiBub3QgcHJlc2VudCBpbiB1cmxcbiAgICAgIGlmIChiYXNlUGF0aCAmJiAhdXJsLnBhdGhuYW1lLnN0YXJ0c1dpdGgoYmFzZVBhdGgpKSB7XG4gICAgICAgIGNvbnN0IHRvID0gbmV3IFVSTChiYXNlUGF0aCArIHVybC5wYXRobmFtZSwgdXJsLm9yaWdpbik7XG4gICAgICAgIHJldHVybiBSZXNwb25zZS5yZWRpcmVjdCh0bywgMzAyKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3R4OiBGcmVzaENvbnRleHQgPSB7XG4gICAgICAgIHVybCxcbiAgICAgICAgcGFyYW1zOiB7fSxcbiAgICAgICAgY29uZmlnOiBfc2VsZi4jc3RhdGUuY29uZmlnLFxuICAgICAgICBiYXNlUGF0aDogX3NlbGYuI3N0YXRlLmNvbmZpZy5iYXNlUGF0aCxcbiAgICAgICAgbG9jYWxBZGRyOiBjb25uSW5mby5sb2NhbEFkZHIsXG4gICAgICAgIHJlbW90ZUFkZHI6IGNvbm5JbmZvLnJlbW90ZUFkZHIsXG4gICAgICAgIHN0YXRlOiB7fSxcbiAgICAgICAgaXNQYXJ0aWFsOiB1cmwuc2VhcmNoUGFyYW1zLmhhcyhQQVJUSUFMX1NFQVJDSF9QQVJBTSksXG4gICAgICAgIGRlc3RpbmF0aW9uOiBcInJvdXRlXCIsXG4gICAgICAgIGVycm9yOiB1bmRlZmluZWQsXG4gICAgICAgIGNvZGVGcmFtZTogdW5kZWZpbmVkLFxuICAgICAgICBDb21wb25lbnQ6IE5PT1BfQ09NUE9ORU5ULFxuICAgICAgICBuZXh0OiBOT09QX05FWFQsXG4gICAgICAgIHJlbmRlcjogTk9PUF9ORVhULFxuICAgICAgICByZW5kZXJOb3RGb3VuZDogYXN5bmMgKGRhdGEpID0+IHtcbiAgICAgICAgICBjdHguZGF0YSA9IGRhdGE7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHJlbmRlck5vdEZvdW5kKHJlcSwgY3R4KTtcbiAgICAgICAgfSxcbiAgICAgICAgcm91dGU6IFwiXCIsXG4gICAgICAgIGdldCBwYXR0ZXJuKCkge1xuICAgICAgICAgIHJldHVybiBjdHgucm91dGU7XG4gICAgICAgIH0sXG4gICAgICAgIGRhdGE6IHVuZGVmaW5lZCxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBhd2FpdCB3aXRoTWlkZGxld2FyZXMocmVxLCBjdHgsIGlubmVyKTtcbiAgICB9O1xuICB9XG5cbiAgI21heWJlQnVpbGRTbmFwc2hvdCgpOiBCdWlsZFNuYXBzaG90IHwgbnVsbCB7XG4gICAgaWYgKFwiYnVpbGRcIiBpbiB0aGlzLiNidWlsZGVyIHx8IHRoaXMuI2J1aWxkZXIgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI2J1aWxkZXI7XG4gIH1cblxuICBhc3luYyBidWlsZFNuYXBzaG90KCkge1xuICAgIGlmIChcImJ1aWxkXCIgaW4gdGhpcy4jYnVpbGRlcikge1xuICAgICAgY29uc3QgYnVpbGRlciA9IHRoaXMuI2J1aWxkZXI7XG4gICAgICB0aGlzLiNidWlsZGVyID0gYnVpbGRlci5idWlsZCgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc25hcHNob3QgPSBhd2FpdCB0aGlzLiNidWlsZGVyO1xuICAgICAgICB0aGlzLiNidWlsZGVyID0gc25hcHNob3Q7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhpcy4jYnVpbGRlciA9IGJ1aWxkZXI7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI2J1aWxkZXI7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIGFsbCByb3V0ZXMgcmVxdWlyZWQgYnkgRnJlc2ggYXMgYW4gZXh0ZW5kZWRcbiAgICogcGF0aC10by1yZWdleCwgdG8gaGFuZGxlciBtYXBwaW5nLlxuICAgKi9cbiAgI2hhbmRsZXJzKFxuICAgIHJlbmRlck5vdEZvdW5kOiBVbmtub3duUmVuZGVyRnVuY3Rpb24sXG4gICk6IHtcbiAgICBpbnRlcm5hbFJvdXRlczogcm91dGVyLlJvdXRlcztcbiAgICBzdGF0aWNSb3V0ZXM6IHJvdXRlci5Sb3V0ZXM7XG4gICAgcm91dGVzOiByb3V0ZXIuUm91dGVzO1xuXG4gICAgb3RoZXJIYW5kbGVyOiByb3V0ZXIuSGFuZGxlcjtcbiAgICBlcnJvckhhbmRsZXI6IHJvdXRlci5FcnJvckhhbmRsZXI7XG4gIH0ge1xuICAgIGNvbnN0IGludGVybmFsUm91dGVzOiByb3V0ZXIuUm91dGVzID0ge307XG4gICAgY29uc3Qgc3RhdGljUm91dGVzOiByb3V0ZXIuUm91dGVzID0ge307XG4gICAgbGV0IHJvdXRlczogcm91dGVyLlJvdXRlcyA9IHt9O1xuXG4gICAgY29uc3QgYXNzZXRSb3V0ZSA9IHdpdGhCYXNlKFxuICAgICAgYCR7SU5URVJOQUxfUFJFRklYfSR7SlNfUFJFRklYfS8ke0JVSUxEX0lEfS86cGF0aCpgLFxuICAgICAgdGhpcy4jc3RhdGUuY29uZmlnLmJhc2VQYXRoLFxuICAgICk7XG4gICAgaW50ZXJuYWxSb3V0ZXNbYXNzZXRSb3V0ZV0gPSB7XG4gICAgICBiYXNlUm91dGU6IHRvQmFzZVJvdXRlKGFzc2V0Um91dGUpLFxuICAgICAgbWV0aG9kczoge1xuICAgICAgICBkZWZhdWx0OiAoX3JlcSwgY3R4KSA9PiB0aGlzLiNidW5kbGVBc3NldFJvdXRlKGN0eC5wYXJhbXMucGF0aCksXG4gICAgICB9LFxuICAgIH07XG5cbiAgICAvLyBBZGQgdGhlIHN0YXRpYyBmaWxlIHJvdXRlcy5cbiAgICAvLyBlYWNoIGZpbGVzIGhhcyAyIHN0YXRpYyByb3V0ZXM6XG4gICAgLy8gLSBvbmUgc2VydmluZyB0aGUgZmlsZSBhdCBpdHMgbG9jYXRpb24gd2l0aG91dCBhIFwiY2FjaGUgYnVyc3RpbmdcIiBtZWNoYW5pc21cbiAgICAvLyAtIG9uZSBjb250YWluaW5nIHRoZSBCVUlMRF9JRCBpbiB0aGUgcGF0aCB0aGF0IGNhbiBiZSBjYWNoZWRcbiAgICBmb3IgKFxuICAgICAgY29uc3QgeyBsb2NhbFVybCwgcGF0aCwgc2l6ZSwgY29udGVudFR5cGUsIGV0YWcgfSBvZiB0aGlzLiNleHRyYWN0UmVzdWx0XG4gICAgICAgIC5zdGF0aWNGaWxlc1xuICAgICkge1xuICAgICAgc3RhdGljUm91dGVzW3BhdGgucmVwbGFjZUFsbChTRVBBUkFUT1IsIFwiL1wiKV0gPSB7XG4gICAgICAgIGJhc2VSb3V0ZTogdG9CYXNlUm91dGUocGF0aCksXG4gICAgICAgIG1ldGhvZHM6IHtcbiAgICAgICAgICBcIkhFQURcIjogdGhpcy4jc3RhdGljRmlsZUhhbmRsZXIoXG4gICAgICAgICAgICBsb2NhbFVybCxcbiAgICAgICAgICAgIHNpemUsXG4gICAgICAgICAgICBjb250ZW50VHlwZSxcbiAgICAgICAgICAgIGV0YWcsXG4gICAgICAgICAgKSxcbiAgICAgICAgICBcIkdFVFwiOiB0aGlzLiNzdGF0aWNGaWxlSGFuZGxlcihcbiAgICAgICAgICAgIGxvY2FsVXJsLFxuICAgICAgICAgICAgc2l6ZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlLFxuICAgICAgICAgICAgZXRhZyxcbiAgICAgICAgICApLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBUZWxsIHJlbmRlcmVyIGFib3V0IGFsbCBnbG9iYWxseSBhdmFpbGFibGUgaXNsYW5kc1xuICAgIHNldEFsbElzbGFuZHModGhpcy4jZXh0cmFjdFJlc3VsdC5pc2xhbmRzKTtcblxuICAgIGNvbnN0IGRlcGVuZGVuY2llc0ZuID0gKHBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3Qgc25hcHNob3QgPSB0aGlzLiNtYXliZUJ1aWxkU25hcHNob3QoKTtcbiAgICAgIHJldHVybiBzbmFwc2hvdD8uZGVwZW5kZW5jaWVzKHBhdGgpID8/IFtdO1xuICAgIH07XG5cbiAgICBjb25zdCBnZW5SZW5kZXIgPSA8RGF0YSA9IHVuZGVmaW5lZD4oXG4gICAgICByb3V0ZTogUm91dGU8RGF0YT4gfCBVbmtub3duUGFnZSB8IEVycm9yUGFnZSxcbiAgICAgIHN0YXR1czogbnVtYmVyLFxuICAgICkgPT4ge1xuICAgICAgY29uc3QgaW1wb3J0czogc3RyaW5nW10gPSBbXTtcbiAgICAgIGlmICh0aGlzLiNkZXYpIGltcG9ydHMucHVzaCh0aGlzLiNzdGF0ZS5jb25maWcuYmFzZVBhdGggKyBERVZfQ0xJRU5UX1VSTCk7XG4gICAgICByZXR1cm4gKFxuICAgICAgICByZXE6IFJlcXVlc3QsXG4gICAgICAgIGN0eDogRnJlc2hDb250ZXh0LFxuICAgICAgICBlcnJvcj86IHVua25vd24sXG4gICAgICAgIGNvZGVGcmFtZT86IHN0cmluZyxcbiAgICAgICkgPT4ge1xuICAgICAgICByZXR1cm4gYXN5bmMgKGRhdGE/OiBEYXRhLCBvcHRpb25zPzogUmVuZGVyT3B0aW9ucykgPT4ge1xuICAgICAgICAgIGlmIChyb3V0ZS5jb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBwYWdlIGRvZXMgbm90IGhhdmUgYSBjb21wb25lbnQgdG8gcmVuZGVyLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgbGF5b3V0cyA9IHNlbGVjdFNoYXJlZFJvdXRlcyhcbiAgICAgICAgICAgIHJvdXRlLmJhc2VSb3V0ZSxcbiAgICAgICAgICAgIHRoaXMuI2V4dHJhY3RSZXN1bHQubGF5b3V0cyxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY3R4LmVycm9yID0gZXJyb3I7XG4gICAgICAgICAgY3R4LmRhdGEgPSBkYXRhO1xuICAgICAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBpbnRlcm5hbFJlbmRlcih7XG4gICAgICAgICAgICByZXF1ZXN0OiByZXEsXG4gICAgICAgICAgICBjb250ZXh0OiBjdHgsXG4gICAgICAgICAgICByb3V0ZSxcbiAgICAgICAgICAgIHBsdWdpbnM6IHRoaXMuI3BsdWdpbnMsXG4gICAgICAgICAgICBhcHA6IHRoaXMuI2V4dHJhY3RSZXN1bHQuYXBwLFxuICAgICAgICAgICAgbGF5b3V0cyxcbiAgICAgICAgICAgIGltcG9ydHMsXG4gICAgICAgICAgICBkZXBlbmRlbmNpZXNGbixcbiAgICAgICAgICAgIHJlbmRlckZuOiB0aGlzLiNyZW5kZXJGbixcbiAgICAgICAgICAgIGNvZGVGcmFtZSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChyZXNwIGluc3RhbmNlb2YgUmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzcCwge1xuICAgICAgICAgICAgc3RhdHVzOiBvcHRpb25zPy5zdGF0dXMgPz8gc3RhdHVzLFxuICAgICAgICAgICAgc3RhdHVzVGV4dDogb3B0aW9ucz8uc3RhdHVzVGV4dCxcbiAgICAgICAgICAgIGhlYWRlcnM6IG9wdGlvbnM/LmhlYWRlcnMsXG4gICAgICAgICAgICBpc0RldjogdGhpcy4jZGV2LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCByb3V0ZSBvZiB0aGlzLiNleHRyYWN0UmVzdWx0LnJvdXRlcykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLiNzdGF0ZS5jb25maWcucm91dGVyPy50cmFpbGluZ1NsYXNoICYmIHJvdXRlLnBhdHRlcm4gIT0gXCIvXCJcbiAgICAgICkge1xuICAgICAgICByb3V0ZS5wYXR0ZXJuICs9IFwiL1wiO1xuICAgICAgfVxuICAgICAgY29uc3QgY3JlYXRlUmVuZGVyID0gZ2VuUmVuZGVyKHJvdXRlLCBTVEFUVVNfQ09ERS5PSyk7XG4gICAgICBpZiAodHlwZW9mIHJvdXRlLmhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByb3V0ZXNbcm91dGUucGF0dGVybl0gPSB7XG4gICAgICAgICAgYmFzZVJvdXRlOiByb3V0ZS5iYXNlUm91dGUsXG4gICAgICAgICAgbWV0aG9kczoge1xuICAgICAgICAgICAgZGVmYXVsdDogKHJlcSwgY3R4KSA9PiB7XG4gICAgICAgICAgICAgIGN0eC5yZW5kZXIgPSBjcmVhdGVSZW5kZXIocmVxLCBjdHgpO1xuICAgICAgICAgICAgICByZXR1cm4gKHJvdXRlLmhhbmRsZXIgYXMgSGFuZGxlcikocmVxLCBjdHgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm91dGVzW3JvdXRlLnBhdHRlcm5dID0ge1xuICAgICAgICAgIGJhc2VSb3V0ZTogcm91dGUuYmFzZVJvdXRlLFxuICAgICAgICAgIG1ldGhvZHM6IHt9LFxuICAgICAgICB9O1xuICAgICAgICBmb3IgKGNvbnN0IFttZXRob2QsIGhhbmRsZXJdIG9mIE9iamVjdC5lbnRyaWVzKHJvdXRlLmhhbmRsZXIpKSB7XG4gICAgICAgICAgcm91dGVzW3JvdXRlLnBhdHRlcm5dLm1ldGhvZHNbbWV0aG9kIGFzIHJvdXRlci5Lbm93bk1ldGhvZF0gPSAoXG4gICAgICAgICAgICByZXEsXG4gICAgICAgICAgICBjdHgsXG4gICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICBjdHgucmVuZGVyID0gY3JlYXRlUmVuZGVyKHJlcSwgY3R4KTtcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVyKHJlcSwgY3R4KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IG90aGVySGFuZGxlcjogcm91dGVyLkhhbmRsZXIgPSAocmVxLCBjdHgpID0+IHtcbiAgICAgIGN0eC5yZW5kZXIgPSAoZGF0YSkgPT4ge1xuICAgICAgICBjdHguZGF0YSA9IGRhdGE7XG4gICAgICAgIHJldHVybiByZW5kZXJOb3RGb3VuZChyZXEsIGN0eCk7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIHRoaXMuI2V4dHJhY3RSZXN1bHQubm90Rm91bmQuaGFuZGxlcihyZXEsIGN0eCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGVycm9ySGFuZGxlclJlbmRlciA9IGdlblJlbmRlcihcbiAgICAgIHRoaXMuI2V4dHJhY3RSZXN1bHQuZXJyb3IsXG4gICAgICBTVEFUVVNfQ09ERS5JbnRlcm5hbFNlcnZlckVycm9yLFxuICAgICk7XG4gICAgY29uc3QgZXJyb3JIYW5kbGVyOiByb3V0ZXIuRXJyb3JIYW5kbGVyID0gYXN5bmMgKFxuICAgICAgcmVxLFxuICAgICAgY3R4LFxuICAgICAgZXJyb3IsXG4gICAgKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICBcIiVjQW4gZXJyb3Igb2NjdXJyZWQgZHVyaW5nIHJvdXRlIGhhbmRsaW5nIG9yIHBhZ2UgcmVuZGVyaW5nLlwiLFxuICAgICAgICBcImNvbG9yOnJlZFwiLFxuICAgICAgKTtcbiAgICAgIGxldCBjb2RlRnJhbWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGlmICh0aGlzLiNkZXYgJiYgZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICBjb2RlRnJhbWUgPSBhd2FpdCBnZXRDb2RlRnJhbWUoZXJyb3IpO1xuXG4gICAgICAgIGlmIChjb2RlRnJhbWUpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihjb2RlRnJhbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcblxuICAgICAgY3R4LmVycm9yID0gZXJyb3I7XG4gICAgICBjdHgucmVuZGVyID0gZXJyb3JIYW5kbGVyUmVuZGVyKHJlcSwgY3R4LCBlcnJvciwgY29kZUZyYW1lKTtcbiAgICAgIHJldHVybiB0aGlzLiNleHRyYWN0UmVzdWx0LmVycm9yLmhhbmRsZXIocmVxLCBjdHgpO1xuICAgIH07XG5cbiAgICBpZiAodGhpcy4jZGV2KSB7XG4gICAgICBjb25zdCBkZXZFcnJvclVybCA9IHdpdGhCYXNlKFxuICAgICAgICBERVZfRVJST1JfT1ZFUkxBWV9VUkwsXG4gICAgICAgIHRoaXMuI3N0YXRlLmNvbmZpZy5iYXNlUGF0aCxcbiAgICAgICk7XG4gICAgICBjb25zdCBiYXNlUm91dGUgPSB0b0Jhc2VSb3V0ZShkZXZFcnJvclVybCk7XG4gICAgICBpbnRlcm5hbFJvdXRlc1tkZXZFcnJvclVybF0gPSB7XG4gICAgICAgIGJhc2VSb3V0ZSxcbiAgICAgICAgbWV0aG9kczoge1xuICAgICAgICAgIGRlZmF1bHQ6IGFzeW5jIChyZXEsIGN0eCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGludGVybmFsUmVuZGVyKHtcbiAgICAgICAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICAgICAgICBjb250ZXh0OiBjdHgsXG4gICAgICAgICAgICAgIHJvdXRlOiB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiBFcnJvck92ZXJsYXksXG4gICAgICAgICAgICAgICAgaW5oZXJpdExheW91dHM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGFwcFdyYXBwZXI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNzcDogZmFsc2UsXG4gICAgICAgICAgICAgICAgdXJsOiByZXEudXJsLFxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZXJyb3Igb3ZlcmxheSByb3V0ZVwiLFxuICAgICAgICAgICAgICAgIGhhbmRsZXI6IChfcmVxOiBSZXF1ZXN0LCBjdHg6IEZyZXNoQ29udGV4dCkgPT4gY3R4LnJlbmRlcigpLFxuICAgICAgICAgICAgICAgIGJhc2VSb3V0ZSxcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiBiYXNlUm91dGUsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHBsdWdpbnM6IHRoaXMuI3BsdWdpbnMsXG4gICAgICAgICAgICAgIGFwcDogdGhpcy4jZXh0cmFjdFJlc3VsdC5hcHAsXG4gICAgICAgICAgICAgIGxheW91dHM6IFtdLFxuICAgICAgICAgICAgICBpbXBvcnRzOiBbXSxcbiAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzRm46ICgpID0+IFtdLFxuICAgICAgICAgICAgICByZW5kZXJGbjogdGhpcy4jcmVuZGVyRm4sXG4gICAgICAgICAgICAgIGNvZGVGcmFtZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXNwIGluc3RhbmNlb2YgUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3A7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzcCwge1xuICAgICAgICAgICAgICBzdGF0dXM6IDIwMCxcbiAgICAgICAgICAgICAgaXNEZXY6IHRoaXMuI2RldixcbiAgICAgICAgICAgICAgc3RhdHVzVGV4dDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIHBhZ2UgaXMgc2hvd24gd2hlbiB0aGUgdXNlciB1c2VzIHRoZSB0YWlsd2luZGNzcyBwbHVnaW4gYW5kXG4gICAgLy8gaGFzbid0IGNvbmZpZ3VyZWQgQU9UIGJ1aWxkcy5cbiAgICBpZiAoXG4gICAgICAhdGhpcy4jc3RhdGUuY29uZmlnLmRldiAmJlxuICAgICAgdGhpcy4jc3RhdGUubG9hZFNuYXBzaG90ICYmICF0aGlzLiNzdGF0ZS5kaWRMb2FkU25hcHNob3QgJiZcbiAgICAgIHRoaXMuI3N0YXRlLmNvbmZpZy5wbHVnaW5zLnNvbWUoKHBsdWdpbikgPT4gcGx1Z2luLm5hbWUgPT09IFwidGFpbHdpbmRcIilcbiAgICApIHtcbiAgICAgIGlmIChERU5PX0RFUExPWU1FTlRfSUQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBEb24ndCBmYWlsIGhhcmQgaGVyZSBhbmQgaW5zdGVhZCByZXdyaXRlIGFsbCByb3V0ZXMgdG8gYSBzcGVjaWFsXG4gICAgICAgIC8vIGVycm9yIHJvdXRlLiBPdGhlcndpc2UgdGhlIGZpcnN0IHVzZXIgZXhwZXJpZW5jZSBvZiBkZXBsb3lpbmcgYVxuICAgICAgICAvLyBGcmVzaCBwcm9qZWN0IHdvdWxkIGJlIHByZXR0eSBkaXNydXB0aXZlXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgXCIlY0Vycm9yOiBBaGVhZCBvZiB0aW1lIGJ1aWxkcyBub3QgY29uZmlndXJlZCBidXQgcmVxdWlyZWQgYnkgdGhlIHRhaWx3aW5kY3NzIHBsdWdpbi5cXG5UbyByZXNvbHZlIHRoaXMgZXJyb3IsIHNldCB1cCBhaGVhZCBvZiB0aW1lIGJ1aWxkczogaHR0cHM6Ly9mcmVzaC5kZW5vLmRldi9kb2NzL2NvbmNlcHRzL2FoZWFkLW9mLXRpbWUtYnVpbGRzXCIsXG4gICAgICAgICAgXCJjb2xvcjogcmVkXCIsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUubG9nKCk7XG5cbiAgICAgICAgLy8gQ2xlYXIgYWxsIHJvdXRlcyBzbyB0aGF0IGV2ZXJ5dGhpbmcgcmVkaXJlY3RzIHRvIHRoZSB0YWlsd2luZFxuICAgICAgICAvLyBlcnJvciBwYWdlLlxuICAgICAgICByb3V0ZXMgPSB7fTtcblxuICAgICAgICBjb25zdCBmcmVzaEVycm9yUGFnZSA9IGdlblJlbmRlcih7XG4gICAgICAgICAgYXBwV3JhcHBlcjogZmFsc2UsXG4gICAgICAgICAgaW5oZXJpdExheW91dHM6IGZhbHNlLFxuICAgICAgICAgIGNvbXBvbmVudDogVGFpbHdpbmRFcnJvclBhZ2UsXG4gICAgICAgICAgY3NwOiBmYWxzZSxcbiAgICAgICAgICBuYW1lOiBcInRhaWx3aW5kX2Vycm9yX3JvdXRlXCIsXG4gICAgICAgICAgcGF0dGVybjogXCIqXCIsXG4gICAgICAgICAgdXJsOiBcIlwiLFxuICAgICAgICAgIGJhc2VSb3V0ZTogdG9CYXNlUm91dGUoXCIqXCIpLFxuICAgICAgICAgIGhhbmRsZXI6IChfcmVxOiBSZXF1ZXN0LCBjdHg6IEZyZXNoQ29udGV4dCkgPT4gY3R4LnJlbmRlcigpLFxuICAgICAgICB9LCBTVEFUVVNfQ09ERS5JbnRlcm5hbFNlcnZlckVycm9yKTtcbiAgICAgICAgb3RoZXJIYW5kbGVyID0gKHJlcSwgY3R4KSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVuZGVyID0gZnJlc2hFcnJvclBhZ2UocmVxLCBjdHgpO1xuICAgICAgICAgIHJldHVybiByZW5kZXIoKTtcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE5vdCBvbiBEZW5vIERlcGxveS4gVGhlIHVzZXIgbGlrZWx5IGZvcmdvdCB0byBydW4gYGRlbm8gdGFzayBidWlsZGBcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICclY05vIHByZS1jb21waWxlZCB0YWlsd2luZCBzdHlsZXMgZm91bmQuXFxuXFxuRGlkIHlvdSBmb3JnZXQgdG8gcnVuIFwiZGVubyB0YXNrIGJ1aWxkXCIgcHJpb3IgdG8gc3RhcnRpbmcgdGhlIHByb2R1Y3Rpb24gc2VydmVyPycsXG4gICAgICAgICAgXCJjb2xvcjogeWVsbG93XCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgaW50ZXJuYWxSb3V0ZXMsIHN0YXRpY1JvdXRlcywgcm91dGVzLCBvdGhlckhhbmRsZXIsIGVycm9ySGFuZGxlciB9O1xuICB9XG5cbiAgI3N0YXRpY0ZpbGVIYW5kbGVyKFxuICAgIGxvY2FsVXJsOiBVUkwsXG4gICAgc2l6ZTogbnVtYmVyLFxuICAgIGNvbnRlbnRUeXBlOiBzdHJpbmcsXG4gICAgZXRhZzogc3RyaW5nLFxuICApOiByb3V0ZXIuTWF0Y2hIYW5kbGVyIHtcbiAgICByZXR1cm4gYXN5bmMgKHJlcTogUmVxdWVzdCkgPT4ge1xuICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsKTtcbiAgICAgIGNvbnN0IGtleSA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KEFTU0VUX0NBQ0hFX0JVU1RfS0VZKTtcbiAgICAgIGlmIChrZXkgIT09IG51bGwgJiYgQlVJTERfSUQgIT09IGtleSkge1xuICAgICAgICB1cmwuc2VhcmNoUGFyYW1zLmRlbGV0ZShBU1NFVF9DQUNIRV9CVVNUX0tFWSk7XG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gdXJsLnBhdGhuYW1lICsgdXJsLnNlYXJjaDtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7XG4gICAgICAgICAgc3RhdHVzOiAzMDcsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgbG9jYXRpb24sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoe1xuICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBjb250ZW50VHlwZSxcbiAgICAgICAgZXRhZyxcbiAgICAgICAgdmFyeTogXCJJZi1Ob25lLU1hdGNoXCIsXG4gICAgICB9KTtcbiAgICAgIGlmIChrZXkgIT09IG51bGwpIHtcbiAgICAgICAgaGVhZGVycy5zZXQoXCJDYWNoZS1Db250cm9sXCIsIFwicHVibGljLCBtYXgtYWdlPTMxNTM2MDAwLCBpbW11dGFibGVcIik7XG4gICAgICB9XG4gICAgICBjb25zdCBpZk5vbmVNYXRjaCA9IHJlcS5oZWFkZXJzLmdldChcImlmLW5vbmUtbWF0Y2hcIik7XG4gICAgICBpZiAoaWZOb25lTWF0Y2ggPT09IGV0YWcgfHwgaWZOb25lTWF0Y2ggPT09IFwiVy9cIiArIGV0YWcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7IHN0YXR1czogMzA0LCBoZWFkZXJzIH0pO1xuICAgICAgfSBlbHNlIGlmIChyZXEubWV0aG9kID09PSBcIkhFQURcIikge1xuICAgICAgICBoZWFkZXJzLnNldChcImNvbnRlbnQtbGVuZ3RoXCIsIFN0cmluZyhzaXplKSk7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwgeyBzdGF0dXM6IDIwMCwgaGVhZGVycyB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4obG9jYWxVcmwpO1xuICAgICAgICBoZWFkZXJzLnNldChcImNvbnRlbnQtbGVuZ3RoXCIsIFN0cmluZyhzaXplKSk7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoZmlsZS5yZWFkYWJsZSwgeyBoZWFkZXJzIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBhc3luYyAjYnVuZGxlQXNzZXRSb3V0ZShmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3Qgc25hcHNob3QgPSBhd2FpdCB0aGlzLmJ1aWxkU25hcHNob3QoKTtcbiAgICBjb25zdCBjb250ZW50cyA9IGF3YWl0IHNuYXBzaG90LnJlYWQoZmlsZVBhdGgpO1xuICAgIGlmICghY29udGVudHMpIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwgeyBzdGF0dXM6IDQwNCB9KTtcblxuICAgIGNvbnN0IGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICBcIkNhY2hlLUNvbnRyb2xcIjogdGhpcy4jZGV2XG4gICAgICAgID8gXCJuby1jYWNoZSwgbm8tc3RvcmUsIG1heC1hZ2U9MCwgbXVzdC1yZXZhbGlkYXRlXCJcbiAgICAgICAgOiBcInB1YmxpYywgbWF4LWFnZT02MDQ4MDAsIGltbXV0YWJsZVwiLFxuICAgIH07XG5cbiAgICBjb25zdCB0eXBlID0gY29udGVudFR5cGUoZXh0bmFtZShmaWxlUGF0aCkpO1xuICAgIGlmICh0eXBlKSBoZWFkZXJzW1wiQ29udGVudC1UeXBlXCJdID0gdHlwZTtcblxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoY29udGVudHMsIHtcbiAgICAgIHN0YXR1czogMjAwLFxuICAgICAgaGVhZGVycyxcbiAgICB9KTtcbiAgfVxufVxuXG5jb25zdCBjcmVhdGVSZW5kZXJOb3RGb3VuZCA9IChcbiAgZXh0cmFjdFJlc3VsdDogRnNFeHRyYWN0UmVzdWx0LFxuICBkZXY6IGJvb2xlYW4sXG4gIHBsdWdpbnM6IFBsdWdpbjxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj5bXSxcbiAgcmVuZGVyRnVuY3Rpb246IFJlbmRlckZ1bmN0aW9uLFxuICBidWlsZFNuYXBzaG90OiBCdWlsZFNuYXBzaG90IHwgbnVsbCxcbik6IFVua25vd25SZW5kZXJGdW5jdGlvbiA9PiB7XG4gIGNvbnN0IGRlcGVuZGVuY2llc0ZuID0gKHBhdGg6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHNuYXBzaG90ID0gYnVpbGRTbmFwc2hvdDtcbiAgICByZXR1cm4gc25hcHNob3Q/LmRlcGVuZGVuY2llcyhwYXRoKSA/PyBbXTtcbiAgfTtcblxuICByZXR1cm4gYXN5bmMgKHJlcSwgY3R4KSA9PiB7XG4gICAgY29uc3Qgbm90Rm91bmQgPSBleHRyYWN0UmVzdWx0Lm5vdEZvdW5kO1xuICAgIGlmICghbm90Rm91bmQuY29tcG9uZW50KSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKFtcIk5vdCBmb3VuZC5cIiwgXCJcIiwgdW5kZWZpbmVkXSwge1xuICAgICAgICBzdGF0dXM6IFNUQVRVU19DT0RFLk5vdEZvdW5kLFxuICAgICAgICBpc0RldjogZGV2LFxuICAgICAgICBzdGF0dXNUZXh0OiB1bmRlZmluZWQsXG4gICAgICAgIGhlYWRlcnM6IHVuZGVmaW5lZCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGxheW91dHMgPSBzZWxlY3RTaGFyZWRSb3V0ZXMoXG4gICAgICBST09UX0JBU0VfUk9VVEUsXG4gICAgICBleHRyYWN0UmVzdWx0LmxheW91dHMsXG4gICAgKTtcblxuICAgIGNvbnN0IGltcG9ydHM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGludGVybmFsUmVuZGVyKHtcbiAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgIGNvbnRleHQ6IGN0eCxcbiAgICAgIHJvdXRlOiBub3RGb3VuZCxcbiAgICAgIHBsdWdpbnM6IHBsdWdpbnMsXG4gICAgICBhcHA6IGV4dHJhY3RSZXN1bHQuYXBwLFxuICAgICAgbGF5b3V0cyxcbiAgICAgIGltcG9ydHMsXG4gICAgICBkZXBlbmRlbmNpZXNGbixcbiAgICAgIHJlbmRlckZuOiByZW5kZXJGdW5jdGlvbixcbiAgICB9KTtcblxuICAgIGlmIChyZXNwIGluc3RhbmNlb2YgUmVzcG9uc2UpIHtcbiAgICAgIHJldHVybiByZXNwO1xuICAgIH1cblxuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzcCwge1xuICAgICAgc3RhdHVzOiBTVEFUVVNfQ09ERS5Ob3RGb3VuZCxcbiAgICAgIGlzRGV2OiBkZXYsXG4gICAgICBzdGF0dXNUZXh0OiB1bmRlZmluZWQsXG4gICAgICBoZWFkZXJzOiB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH07XG59O1xuXG4vLyBOb3JtYWxpemUgYSBwYXRoIGZvciB1c2UgaW4gYSBVUkwuIFJldHVybnMgbnVsbCBpZiB0aGUgcGF0aCBpcyB1bnBhcnNhYmxlLlxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVVSTFBhdGgocGF0aDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGF0aFVybCA9IG5ldyBVUkwoXCJmaWxlOi8vL1wiKTtcbiAgICBwYXRoVXJsLnBhdGhuYW1lID0gcGF0aDtcbiAgICByZXR1cm4gcGF0aFVybC5wYXRobmFtZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VyaWFsaXplQ1NQRGlyZWN0aXZlcyhjc3A6IENvbnRlbnRTZWN1cml0eVBvbGljeURpcmVjdGl2ZXMpOiBzdHJpbmcge1xuICByZXR1cm4gT2JqZWN0LmVudHJpZXMoY3NwKVxuICAgIC5maWx0ZXIoKFtfa2V5LCB2YWx1ZV0pID0+IHZhbHVlICE9PSB1bmRlZmluZWQpXG4gICAgLm1hcCgoW2ssIHZdOiBbc3RyaW5nLCBzdHJpbmcgfCBzdHJpbmdbXV0pID0+IHtcbiAgICAgIC8vIFR1cm4gY2FtZWwgY2FzZSBpbnRvIHNuYWtlIGNhc2UuXG4gICAgICBjb25zdCBrZXkgPSBrLnJlcGxhY2UoL1tBLVpdL2csIChtKSA9PiBgLSR7bS50b0xvd2VyQ2FzZSgpfWApO1xuICAgICAgY29uc3QgdmFsdWUgPSBBcnJheS5pc0FycmF5KHYpID8gdi5qb2luKFwiIFwiKSA6IHY7XG4gICAgICByZXR1cm4gYCR7a2V5fSAke3ZhbHVlfWA7XG4gICAgfSlcbiAgICAuam9pbihcIjsgXCIpO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0RW50cnlwb2ludHMoXG4gIGRldjogYm9vbGVhbixcbiAgaXNsYW5kczogSXNsYW5kW10sXG4gIHBsdWdpbnM6IFBsdWdpbltdLFxuKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIGNvbnN0IGVudHJ5cG9pbnRCYXNlID0gXCIuLi9ydW50aW1lL2VudHJ5cG9pbnRzXCI7XG4gIGNvbnN0IGVudHJ5UG9pbnRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgIG1haW46IGRldlxuICAgICAgPyBpbXBvcnQubWV0YS5yZXNvbHZlKGAke2VudHJ5cG9pbnRCYXNlfS9tYWluX2Rldi50c2ApXG4gICAgICA6IGltcG9ydC5tZXRhLnJlc29sdmUoYCR7ZW50cnlwb2ludEJhc2V9L21haW4udHNgKSxcbiAgICBkZXNlcmlhbGl6ZXI6IGltcG9ydC5tZXRhLnJlc29sdmUoYCR7ZW50cnlwb2ludEJhc2V9L2Rlc2VyaWFsaXplci50c2ApLFxuICB9O1xuXG4gIGlmIChkZXYpIHtcbiAgICBlbnRyeVBvaW50cy5mcmVzaF9kZXZfY2xpZW50ID0gaW1wb3J0Lm1ldGEucmVzb2x2ZShcbiAgICAgIGAke2VudHJ5cG9pbnRCYXNlfS9jbGllbnQudHNgLFxuICAgICk7XG4gIH1cblxuICB0cnkge1xuICAgIGltcG9ydC5tZXRhLnJlc29sdmUoXCJAcHJlYWN0L3NpZ25hbHNcIik7XG4gICAgZW50cnlQb2ludHMuc2lnbmFscyA9IGltcG9ydC5tZXRhLnJlc29sdmUoYCR7ZW50cnlwb2ludEJhc2V9L3NpZ25hbHMudHNgKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gQHByZWFjdC9zaWduYWxzIGlzIG5vdCBpbiB0aGUgaW1wb3J0IG1hcFxuICB9XG5cbiAgZm9yIChjb25zdCBpc2xhbmQgb2YgaXNsYW5kcykge1xuICAgIGVudHJ5UG9pbnRzW2Bpc2xhbmQtJHtpc2xhbmQubmFtZX1gXSA9IGlzbGFuZC51cmw7XG4gIH1cblxuICBmb3IgKGNvbnN0IHBsdWdpbiBvZiBwbHVnaW5zKSB7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgdXJsXSBvZiBPYmplY3QuZW50cmllcyhwbHVnaW4uZW50cnlwb2ludHMgPz8ge30pKSB7XG4gICAgICBlbnRyeVBvaW50c1tgcGx1Z2luLSR7cGx1Z2luLm5hbWV9LSR7bmFtZX1gXSA9IHVybDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZW50cnlQb2ludHM7XG59XG5cbmZ1bmN0aW9uIHNlbmRSZXNwb25zZShcbiAgcmVzcDogW3N0cmluZywgc3RyaW5nLCBDb250ZW50U2VjdXJpdHlQb2xpY3kgfCB1bmRlZmluZWRdLFxuICBvcHRpb25zOiB7XG4gICAgc3RhdHVzOiBudW1iZXI7XG4gICAgc3RhdHVzVGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIGhlYWRlcnM/OiBIZWFkZXJzSW5pdDtcbiAgICBpc0RldjogYm9vbGVhbjtcbiAgfSxcbikge1xuICBjb25zdCBbYm9keSwgdXVpZCwgY3NwXSA9IHJlc3A7XG4gIGNvbnN0IGhlYWRlcnM6IEhlYWRlcnMgPSBuZXcgSGVhZGVycyh7XG4gICAgXCJjb250ZW50LXR5cGVcIjogXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLThcIixcbiAgICBcIngtZnJlc2gtdXVpZFwiOiB1dWlkLFxuICB9KTtcblxuICBpZiAoY3NwKSB7XG4gICAgaWYgKG9wdGlvbnMuaXNEZXYpIHtcbiAgICAgIGNzcC5kaXJlY3RpdmVzLmNvbm5lY3RTcmMgPSBbXG4gICAgICAgIC4uLihjc3AuZGlyZWN0aXZlcy5jb25uZWN0U3JjID8/IFtdKSxcbiAgICAgICAgU0VMRixcbiAgICAgIF07XG4gICAgfVxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHNlcmlhbGl6ZUNTUERpcmVjdGl2ZXMoY3NwLmRpcmVjdGl2ZXMpO1xuICAgIGlmIChjc3AucmVwb3J0T25seSkge1xuICAgICAgaGVhZGVycy5zZXQoXCJjb250ZW50LXNlY3VyaXR5LXBvbGljeS1yZXBvcnQtb25seVwiLCBkaXJlY3RpdmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWFkZXJzLnNldChcImNvbnRlbnQtc2VjdXJpdHktcG9saWN5XCIsIGRpcmVjdGl2ZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG9wdGlvbnMuaGVhZGVycykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMuaGVhZGVycykpIHtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIG9wdGlvbnMuaGVhZGVycykge1xuICAgICAgICBoZWFkZXJzLmFwcGVuZChrZXksIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgIG9wdGlvbnMuaGVhZGVycy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgIGhlYWRlcnMuYXBwZW5kKGtleSwgdmFsdWUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKG9wdGlvbnMuaGVhZGVycykpIHtcbiAgICAgICAgaGVhZGVycy5hcHBlbmQoa2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5LCB7XG4gICAgc3RhdHVzOiBvcHRpb25zLnN0YXR1cyxcbiAgICBzdGF0dXNUZXh0OiBvcHRpb25zLnN0YXR1c1RleHQsXG4gICAgaGVhZGVycyxcbiAgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxXQUFXLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxXQUFXLFFBQVEsWUFBWTtBQUN6RSxZQUFZLFlBQVksY0FBYztBQUV0QyxTQUNFLFNBQVMsRUFDVCxjQUFjLEVBQ2QscUJBQXFCLEVBQ3JCLFNBQVMsUUFDSixpQkFBaUI7QUFDeEIsU0FBUyxRQUFRLEVBQUUsa0JBQWtCLFFBQVEsZ0JBQWdCO0FBZTdELFNBQVMsVUFBVSxjQUFjLFFBQVEsY0FBYztBQUN2RCxTQUdFLElBQUksUUFDQyxvQkFBb0I7QUFDM0IsU0FBUyxvQkFBb0IsRUFBRSxlQUFlLFFBQVEsc0JBQXNCO0FBQzVFLFNBQWlDLGNBQWMsUUFBUSxrQkFBa0I7QUFDekUsU0FBUyxhQUFhLFFBQVEsOEJBQThCO0FBQzVELFNBQVMsWUFBWSxRQUFRLGtCQUFrQjtBQUMvQyxTQUFTLHFCQUFxQixRQUFRLGNBQWM7QUFDcEQsU0FDRSxrQkFBa0IsRUFDbEIsZUFBZSxFQUNmLGtCQUFrQixFQUNsQixXQUFXLFFBQ04sZUFBZTtBQUN0QixTQUFTLGFBQWEsUUFBeUIsa0JBQWtCO0FBQ2pFLFNBQVMsZUFBZSxRQUFRLDJCQUEyQjtBQUMzRCxTQUFTLFlBQVksUUFBUSxzQkFBc0I7QUFDbkQsU0FBUyxRQUFRLFFBQVEsY0FB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
// denoCacheMetadata=14739122164884925604,2845415926957259121