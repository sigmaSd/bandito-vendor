import { h } from "preact";
import * as router from "./router.ts";
import DefaultErrorHandler from "./default_error_page.tsx";
import { basename, contentType, dirname, extname, join, SEPARATOR, toFileUrl, walk } from "./deps.ts";
import { BUILD_ID } from "./build_id.ts";
import { toBaseRoute } from "./compose.ts";
import { stringToIdentifier } from "./init_safe_deps.ts";
export const ROOT_BASE_ROUTE = toBaseRoute("/");
const DEFAULT_APP = {
  default: ({ Component })=>h(Component, {})
};
const DEFAULT_NOT_FOUND = {
  baseRoute: toBaseRoute("/"),
  pattern: "",
  url: "",
  name: "_404",
  handler: (req)=>router.defaultOtherHandler(req),
  csp: false,
  appWrapper: true,
  inheritLayouts: true
};
const DEFAULT_ERROR = {
  baseRoute: toBaseRoute("/"),
  pattern: "",
  url: "",
  name: "_500",
  component: DefaultErrorHandler,
  handler: (_req, ctx)=>ctx.render(),
  csp: false,
  appWrapper: true,
  inheritLayouts: true
};
/**
 * Extract all routes, and prepare them into the `Page` structure.
 */ export async function extractRoutes(state) {
  const { config, manifest } = state;
  // Get the manifest' base URL.
  const baseUrl = new URL("./", manifest.baseUrl).href;
  const routes = [];
  const islands = [];
  const middlewares = [];
  let app = DEFAULT_APP;
  const layouts = [];
  let notFound = DEFAULT_NOT_FOUND;
  let error = DEFAULT_ERROR;
  const allRoutes = [
    ...Object.entries(manifest.routes),
    ...config.plugins ? getMiddlewareRoutesFromPlugins(config.plugins) : [],
    ...config.plugins ? getRoutesFromPlugins(config.plugins) : []
  ];
  // Presort all routes so that we only need to sort once
  allRoutes.sort((a, b)=>sortRoutePaths(a[0], b[0]));
  for (const [self, module] of allRoutes){
    const url = new URL(self, baseUrl).href;
    if (!url.startsWith(baseUrl + "routes")) {
      throw new TypeError("Page is not a child of the basepath.");
    }
    const path = url.substring(baseUrl.length + "routes".length);
    let baseRoute = path.substring(1, path.length - extname(path).length);
    baseRoute = join(state.config.basePath.slice(1), baseRoute).replaceAll(SEPARATOR, "/");
    const name = baseRoute.replace(/\//g, "-");
    const isLayout = path.endsWith("/_layout.tsx") || path.endsWith("/_layout.ts") || path.endsWith("/_layout.jsx") || path.endsWith("/_layout.js");
    const isMiddleware = path.endsWith("/_middleware.tsx") || path.endsWith("/_middleware.ts") || path.endsWith("/_middleware.jsx") || path.endsWith("/_middleware.js");
    if (!path.startsWith("/_") && !isLayout && !isMiddleware) {
      const { default: component, config } = module;
      let pattern = pathToPattern(baseRoute);
      if (config?.routeOverride) {
        pattern = String(config.routeOverride);
      }
      let { handler } = module;
      if (!handler && "handlers" in module) {
        throw new Error(`Found named export "handlers" in ${self} instead of "handler". Did you mean "handler"?`);
      }
      handler ??= {};
      if (component && typeof handler === "object" && handler.GET === undefined) {
        handler.GET = (_req, { render })=>render();
      }
      if (typeof handler === "object" && handler.GET !== undefined && handler.HEAD === undefined) {
        const GET = handler.GET;
        handler.HEAD = async (req, ctx)=>{
          const resp = await GET(req, ctx);
          resp.body?.cancel();
          return new Response(null, {
            headers: resp.headers,
            status: resp.status,
            statusText: resp.statusText
          });
        };
      }
      const route = {
        baseRoute: toBaseRoute(baseRoute),
        pattern,
        url,
        name,
        component,
        handler,
        csp: Boolean(config?.csp ?? false),
        appWrapper: !config?.skipAppWrapper,
        inheritLayouts: !config?.skipInheritedLayouts
      };
      routes.push(route);
    } else if (isMiddleware) {
      middlewares.push({
        baseRoute: toBaseRoute(baseRoute),
        module: module
      });
    } else if (path === "/_app.tsx" || path === "/_app.ts" || path === "/_app.jsx" || path === "/_app.js") {
      app = module;
    } else if (isLayout) {
      const mod = module;
      const config = mod.config;
      layouts.push({
        baseRoute: toBaseRoute(baseRoute),
        handler: mod.handler,
        component: mod.default,
        appWrapper: !config?.skipAppWrapper,
        inheritLayouts: !config?.skipInheritedLayouts
      });
    } else if (path === "/_404.tsx" || path === "/_404.ts" || path === "/_404.jsx" || path === "/_404.js") {
      const { default: component, config } = module;
      let { handler } = module;
      if (component && handler === undefined) {
        handler = (_req, { render })=>render();
      }
      notFound = {
        baseRoute: ROOT_BASE_ROUTE,
        pattern: pathToPattern(baseRoute),
        url,
        name,
        component,
        handler: handler ?? ((req)=>router.defaultOtherHandler(req)),
        csp: Boolean(config?.csp ?? false),
        appWrapper: !config?.skipAppWrapper,
        inheritLayouts: !config?.skipInheritedLayouts
      };
    } else if (path === "/_500.tsx" || path === "/_500.ts" || path === "/_500.jsx" || path === "/_500.js") {
      const { default: component, config: routeConfig } = module;
      let { handler } = module;
      if (component && handler === undefined) {
        handler = (_req, { render })=>render();
      }
      error = {
        baseRoute: toBaseRoute("/"),
        pattern: pathToPattern(baseRoute),
        url,
        name,
        component,
        handler: handler ?? router.defaultErrorHandler,
        csp: Boolean(routeConfig?.csp ?? false),
        appWrapper: !routeConfig?.skipAppWrapper,
        inheritLayouts: !routeConfig?.skipInheritedLayouts
      };
    }
  }
  const processedIslands = [];
  for (const plugin of config.plugins || []){
    if (!plugin.islands) continue;
    const base = dirname(plugin.islands.baseLocation);
    for (const specifier of plugin.islands.paths){
      const full = join(base, specifier);
      const module = await import(full);
      const name = sanitizeIslandName(basename(full, extname(full)));
      processedIslands.push({
        name,
        path: full,
        module
      });
    }
  }
  for (const [self, module] of Object.entries(manifest.islands)){
    const url = new URL(self, baseUrl).href;
    if (!url.startsWith(baseUrl)) {
      throw new TypeError("Island is not a child of the basepath.");
    }
    let path = url.substring(baseUrl.length);
    if (path.startsWith("islands")) {
      path = path.slice("islands".length + 1);
    }
    const baseRoute = path.substring(0, path.length - extname(path).length);
    processedIslands.push({
      name: sanitizeIslandName(baseRoute),
      path: url,
      module
    });
  }
  for (const processedIsland of processedIslands){
    for (const [exportName, exportedFunction] of Object.entries(processedIsland.module)){
      if (typeof exportedFunction !== "function") continue;
      const name = processedIsland.name.toLowerCase();
      const id = `${name}_${exportName.toLowerCase()}`;
      islands.push({
        id,
        name,
        url: processedIsland.path,
        // deno-lint-ignore no-explicit-any
        component: exportedFunction,
        exportName
      });
    }
  }
  const staticFiles = [];
  try {
    const staticDirs = [
      config.staticDir
    ];
    // Only fall through to files in /_fresh/static when not in dev
    if (state.loadSnapshot) {
      const outDirStatic = join(config.build.outDir, "static");
      staticDirs.push(outDirStatic);
    }
    for (const staticDir of staticDirs){
      const staticDirUrl = toFileUrl(staticDir);
      const entries = walk(staticDir, {
        includeFiles: true,
        includeDirs: false,
        followSymlinks: false
      });
      const encoder = new TextEncoder();
      for await (const entry of entries){
        const localUrl = toFileUrl(entry.path);
        const path = localUrl.href.substring(staticDirUrl.href.length);
        const stat = await Deno.stat(localUrl);
        const type = contentType(extname(path)) ?? "application/octet-stream";
        const etag = await crypto.subtle.digest("SHA-1", encoder.encode(BUILD_ID + path)).then((hash)=>Array.from(new Uint8Array(hash)).map((byte)=>byte.toString(16).padStart(2, "0")).join(""));
        const staticFile = {
          localUrl,
          path: join(state.config.basePath, path),
          size: stat.size,
          contentType: type,
          etag
        };
        staticFiles.push(staticFile);
      }
    }
  } catch (err) {
    if (err.cause instanceof Deno.errors.NotFound) {
    // Do nothing.
    } else {
      throw err;
    }
  }
  return {
    app,
    error,
    islands,
    layouts,
    middlewares,
    notFound,
    routes,
    staticFiles
  };
}
const APP_REG = /_app\.[tj]sx?$/;
/**
 * Sort route paths where special Fresh files like `_app`,
 * `_layout` and `_middleware` are sorted in front.
 */ export function sortRoutePaths(a, b) {
  // The `_app` route should always be the first
  if (APP_REG.test(a)) return -1;
  else if (APP_REG.test(b)) return 1;
  let segmentIdx = 0;
  const aLen = a.length;
  const bLen = b.length;
  const maxLen = aLen > bLen ? aLen : bLen;
  for(let i = 0; i < maxLen; i++){
    const charA = a.charAt(i);
    const charB = b.charAt(i);
    const nextA = i + 1 < aLen ? a.charAt(i + 1) : "";
    const nextB = i + 1 < bLen ? b.charAt(i + 1) : "";
    if (charA === "/" || charB === "/") {
      segmentIdx = i;
      // If the other path doesn't close the segment
      // then we don't need to continue
      if (charA !== "/") return -1;
      if (charB !== "/") return 1;
      continue;
    }
    if (i === segmentIdx + 1) {
      const scoreA = getRoutePathScore(charA, nextA);
      const scoreB = getRoutePathScore(charB, nextB);
      if (scoreA === scoreB) continue;
      return scoreA > scoreB ? -1 : 1;
    }
  }
  return 0;
}
/**
 * Assign a score based on the first two characters of a path segment.
 * The goal is to sort `_middleware` and `_layout` in front of everything
 * and `[` or `[...` last respectively.
 */ function getRoutePathScore(char, nextChar) {
  if (char === "_") {
    if (nextChar === "m") return 4;
    return 3;
  } else if (char === "[") {
    if (nextChar === ".") {
      return 0;
    }
    return 1;
  }
  return 2;
}
/**
 * Transform a filesystem URL path to a `path-to-regex` style matcher. */ export function pathToPattern(path) {
  const parts = path.split("/");
  if (parts[parts.length - 1] === "index") {
    if (parts.length === 1) {
      return "/";
    }
    parts.pop();
  }
  let route = "";
  for(let i = 0; i < parts.length; i++){
    const part = parts[i];
    // Case: /[...foo].tsx
    if (part.startsWith("[...") && part.endsWith("]")) {
      route += `/:${part.slice(4, part.length - 1)}*`;
      continue;
    }
    // Route groups like /foo/(bar) should not be included in URL
    // matching. They are transparent and need to be removed here.
    // Case: /foo/(bar) -> /foo
    // Case: /foo/(bar)/bob -> /foo/bob
    // Case: /(foo)/bar -> /bar
    if (part.startsWith("(") && part.endsWith(")")) {
      continue;
    }
    // Disallow neighbouring params like `/[id][bar].tsx` because
    // it's ambiguous where the `id` param ends and `bar` begins.
    if (part.includes("][")) {
      throw new SyntaxError(`Invalid route pattern: "${path}". A parameter cannot be followed by another parameter without any characters in between.`);
    }
    // Case: /[[id]].tsx
    // Case: /[id].tsx
    // Case: /[id]@[bar].tsx
    // Case: /[id]-asdf.tsx
    // Case: /[id]-asdf[bar].tsx
    // Case: /asdf[bar].tsx
    let pattern = "";
    let groupOpen = 0;
    let optional = false;
    for(let j = 0; j < part.length; j++){
      const char = part[j];
      if (char === "[") {
        if (part[j + 1] === "[") {
          // Disallow optional dynamic params like `foo-[[bar]]`
          if (part[j - 1] !== "/" && !!part[j - 1]) {
            throw new SyntaxError(`Invalid route pattern: "${path}". An optional parameter needs to be a full segment.`);
          }
          groupOpen++;
          optional = true;
          pattern += "{/";
          j++;
        }
        pattern += ":";
        groupOpen++;
      } else if (char === "]") {
        if (part[j + 1] === "]") {
          // Disallow optional dynamic params like `[[foo]]-bar`
          if (part[j + 2] !== "/" && !!part[j + 2]) {
            throw new SyntaxError(`Invalid route pattern: "${path}". An optional parameter needs to be a full segment.`);
          }
          groupOpen--;
          pattern += "}?";
          j++;
        }
        if (--groupOpen < 0) {
          throw new SyntaxError(`Invalid route pattern: "${path}"`);
        }
      } else {
        pattern += char;
      }
    }
    route += (optional ? "" : "/") + pattern;
  }
  // Case: /(group)/index.tsx
  if (route === "") {
    route = "/";
  }
  return route;
}
function toPascalCase(text) {
  return text.replace(/(^\w|-\w)/g, (substring)=>substring.replace(/-/, "").toUpperCase());
}
function sanitizeIslandName(name) {
  const fileName = stringToIdentifier(name);
  return toPascalCase(fileName);
}
function formatMiddlewarePath(path) {
  const prefix = !path.startsWith("/") ? "/" : "";
  const suffix = !path.endsWith("/") ? "/" : "";
  return prefix + path + suffix;
}
function getMiddlewareRoutesFromPlugins(plugins) {
  const middlewares = plugins.flatMap((plugin)=>plugin.middlewares ?? []);
  const mws = {};
  for(let i = 0; i < middlewares.length; i++){
    const mw = middlewares[i];
    const handler = mw.middleware.handler;
    const key = `./routes${formatMiddlewarePath(mw.path)}_middleware.ts`;
    if (!mws[key]) mws[key] = [
      key,
      {
        handler: []
      }
    ];
    mws[key][1].handler.push(...Array.isArray(handler) ? handler : [
      handler
    ]);
  }
  return Object.values(mws);
}
function formatRoutePath(path) {
  return path.startsWith("/") ? path : "/" + path;
}
function getRoutesFromPlugins(plugins) {
  return plugins.flatMap((plugin)=>plugin.routes ?? []).map((route)=>{
    return [
      `./routes${formatRoutePath(route.path)}.ts`,
      {
        // deno-lint-ignore no-explicit-any
        default: route.component,
        handler: route.handler
      }
    ];
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9mc19leHRyYWN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudFR5cGUsIGggfSBmcm9tIFwicHJlYWN0XCI7XG5pbXBvcnQge1xuICBBcHBNb2R1bGUsXG4gIEVycm9yUGFnZSxcbiAgRXJyb3JQYWdlTW9kdWxlLFxuICBJbnRlcm5hbEZyZXNoU3RhdGUsXG4gIElzbGFuZCxcbiAgSXNsYW5kTW9kdWxlLFxuICBMYXlvdXRNb2R1bGUsXG4gIExheW91dFJvdXRlLFxuICBNaWRkbGV3YXJlSGFuZGxlcixcbiAgTWlkZGxld2FyZU1vZHVsZSxcbiAgTWlkZGxld2FyZVJvdXRlLFxuICBQbHVnaW4sXG4gIFJvdXRlLFxuICBSb3V0ZU1vZHVsZSxcbiAgU3RhdGljRmlsZSxcbiAgVW5rbm93blBhZ2UsXG4gIFVua25vd25QYWdlTW9kdWxlLFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuaW1wb3J0ICogYXMgcm91dGVyIGZyb20gXCIuL3JvdXRlci50c1wiO1xuaW1wb3J0IERlZmF1bHRFcnJvckhhbmRsZXIgZnJvbSBcIi4vZGVmYXVsdF9lcnJvcl9wYWdlLnRzeFwiO1xuaW1wb3J0IHtcbiAgYmFzZW5hbWUsXG4gIGNvbnRlbnRUeXBlLFxuICBkaXJuYW1lLFxuICBleHRuYW1lLFxuICBqb2luLFxuICBTRVBBUkFUT1IsXG4gIHRvRmlsZVVybCxcbiAgd2Fsayxcbn0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgQlVJTERfSUQgfSBmcm9tIFwiLi9idWlsZF9pZC50c1wiO1xuaW1wb3J0IHsgdG9CYXNlUm91dGUgfSBmcm9tIFwiLi9jb21wb3NlLnRzXCI7XG5pbXBvcnQgeyBzdHJpbmdUb0lkZW50aWZpZXIgfSBmcm9tIFwiLi9pbml0X3NhZmVfZGVwcy50c1wiO1xuXG5leHBvcnQgY29uc3QgUk9PVF9CQVNFX1JPVVRFID0gdG9CYXNlUm91dGUoXCIvXCIpO1xuXG5jb25zdCBERUZBVUxUX0FQUDogQXBwTW9kdWxlID0ge1xuICBkZWZhdWx0OiAoeyBDb21wb25lbnQgfTogeyBDb21wb25lbnQ6IENvbXBvbmVudFR5cGUgfSkgPT4gaChDb21wb25lbnQsIHt9KSxcbn07XG5cbmNvbnN0IERFRkFVTFRfTk9UX0ZPVU5EOiBVbmtub3duUGFnZSA9IHtcbiAgYmFzZVJvdXRlOiB0b0Jhc2VSb3V0ZShcIi9cIiksXG4gIHBhdHRlcm46IFwiXCIsXG4gIHVybDogXCJcIixcbiAgbmFtZTogXCJfNDA0XCIsXG4gIGhhbmRsZXI6IChyZXEpID0+IHJvdXRlci5kZWZhdWx0T3RoZXJIYW5kbGVyKHJlcSksXG4gIGNzcDogZmFsc2UsXG4gIGFwcFdyYXBwZXI6IHRydWUsXG4gIGluaGVyaXRMYXlvdXRzOiB0cnVlLFxufTtcblxuY29uc3QgREVGQVVMVF9FUlJPUjogRXJyb3JQYWdlID0ge1xuICBiYXNlUm91dGU6IHRvQmFzZVJvdXRlKFwiL1wiKSxcbiAgcGF0dGVybjogXCJcIixcbiAgdXJsOiBcIlwiLFxuICBuYW1lOiBcIl81MDBcIixcbiAgY29tcG9uZW50OiBEZWZhdWx0RXJyb3JIYW5kbGVyLFxuICBoYW5kbGVyOiAoX3JlcSwgY3R4KSA9PiBjdHgucmVuZGVyKCksXG4gIGNzcDogZmFsc2UsXG4gIGFwcFdyYXBwZXI6IHRydWUsXG4gIGluaGVyaXRMYXlvdXRzOiB0cnVlLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBGc0V4dHJhY3RSZXN1bHQge1xuICBhcHA6IEFwcE1vZHVsZTtcbiAgbGF5b3V0czogTGF5b3V0Um91dGVbXTtcbiAgbm90Rm91bmQ6IFVua25vd25QYWdlO1xuICBlcnJvcjogRXJyb3JQYWdlO1xuICBtaWRkbGV3YXJlczogTWlkZGxld2FyZVJvdXRlW107XG4gIGlzbGFuZHM6IElzbGFuZFtdO1xuICByb3V0ZXM6IFJvdXRlW107XG4gIHN0YXRpY0ZpbGVzOiBTdGF0aWNGaWxlW107XG59XG5cbi8qKlxuICogRXh0cmFjdCBhbGwgcm91dGVzLCBhbmQgcHJlcGFyZSB0aGVtIGludG8gdGhlIGBQYWdlYCBzdHJ1Y3R1cmUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHRyYWN0Um91dGVzKFxuICBzdGF0ZTogSW50ZXJuYWxGcmVzaFN0YXRlLFxuKTogUHJvbWlzZTxGc0V4dHJhY3RSZXN1bHQ+IHtcbiAgY29uc3QgeyBjb25maWcsIG1hbmlmZXN0IH0gPSBzdGF0ZTtcblxuICAvLyBHZXQgdGhlIG1hbmlmZXN0JyBiYXNlIFVSTC5cbiAgY29uc3QgYmFzZVVybCA9IG5ldyBVUkwoXCIuL1wiLCBtYW5pZmVzdC5iYXNlVXJsKS5ocmVmO1xuXG4gIGNvbnN0IHJvdXRlczogUm91dGVbXSA9IFtdO1xuICBjb25zdCBpc2xhbmRzOiBJc2xhbmRbXSA9IFtdO1xuICBjb25zdCBtaWRkbGV3YXJlczogTWlkZGxld2FyZVJvdXRlW10gPSBbXTtcbiAgbGV0IGFwcDogQXBwTW9kdWxlID0gREVGQVVMVF9BUFA7XG4gIGNvbnN0IGxheW91dHM6IExheW91dFJvdXRlW10gPSBbXTtcbiAgbGV0IG5vdEZvdW5kOiBVbmtub3duUGFnZSA9IERFRkFVTFRfTk9UX0ZPVU5EO1xuICBsZXQgZXJyb3I6IEVycm9yUGFnZSA9IERFRkFVTFRfRVJST1I7XG4gIGNvbnN0IGFsbFJvdXRlcyA9IFtcbiAgICAuLi5PYmplY3QuZW50cmllcyhtYW5pZmVzdC5yb3V0ZXMpLFxuICAgIC4uLihjb25maWcucGx1Z2lucyA/IGdldE1pZGRsZXdhcmVSb3V0ZXNGcm9tUGx1Z2lucyhjb25maWcucGx1Z2lucykgOiBbXSksXG4gICAgLi4uKGNvbmZpZy5wbHVnaW5zID8gZ2V0Um91dGVzRnJvbVBsdWdpbnMoY29uZmlnLnBsdWdpbnMpIDogW10pLFxuICBdO1xuXG4gIC8vIFByZXNvcnQgYWxsIHJvdXRlcyBzbyB0aGF0IHdlIG9ubHkgbmVlZCB0byBzb3J0IG9uY2VcbiAgYWxsUm91dGVzLnNvcnQoKGEsIGIpID0+IHNvcnRSb3V0ZVBhdGhzKGFbMF0sIGJbMF0pKTtcblxuICBmb3IgKFxuICAgIGNvbnN0IFtzZWxmLCBtb2R1bGVdIG9mIGFsbFJvdXRlc1xuICApIHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHNlbGYsIGJhc2VVcmwpLmhyZWY7XG4gICAgaWYgKCF1cmwuc3RhcnRzV2l0aChiYXNlVXJsICsgXCJyb3V0ZXNcIikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQYWdlIGlzIG5vdCBhIGNoaWxkIG9mIHRoZSBiYXNlcGF0aC5cIik7XG4gICAgfVxuICAgIGNvbnN0IHBhdGggPSB1cmwuc3Vic3RyaW5nKGJhc2VVcmwubGVuZ3RoICsgXCJyb3V0ZXNcIi5sZW5ndGgpO1xuICAgIGxldCBiYXNlUm91dGUgPSBwYXRoLnN1YnN0cmluZygxLCBwYXRoLmxlbmd0aCAtIGV4dG5hbWUocGF0aCkubGVuZ3RoKTtcbiAgICBiYXNlUm91dGUgPSBqb2luKHN0YXRlLmNvbmZpZy5iYXNlUGF0aC5zbGljZSgxKSwgYmFzZVJvdXRlKS5yZXBsYWNlQWxsKFxuICAgICAgU0VQQVJBVE9SLFxuICAgICAgXCIvXCIsXG4gICAgKTtcbiAgICBjb25zdCBuYW1lID0gYmFzZVJvdXRlLnJlcGxhY2UoL1xcLy9nLCBcIi1cIik7XG4gICAgY29uc3QgaXNMYXlvdXQgPSBwYXRoLmVuZHNXaXRoKFwiL19sYXlvdXQudHN4XCIpIHx8XG4gICAgICBwYXRoLmVuZHNXaXRoKFwiL19sYXlvdXQudHNcIikgfHwgcGF0aC5lbmRzV2l0aChcIi9fbGF5b3V0LmpzeFwiKSB8fFxuICAgICAgcGF0aC5lbmRzV2l0aChcIi9fbGF5b3V0LmpzXCIpO1xuICAgIGNvbnN0IGlzTWlkZGxld2FyZSA9IHBhdGguZW5kc1dpdGgoXCIvX21pZGRsZXdhcmUudHN4XCIpIHx8XG4gICAgICBwYXRoLmVuZHNXaXRoKFwiL19taWRkbGV3YXJlLnRzXCIpIHx8IHBhdGguZW5kc1dpdGgoXCIvX21pZGRsZXdhcmUuanN4XCIpIHx8XG4gICAgICBwYXRoLmVuZHNXaXRoKFwiL19taWRkbGV3YXJlLmpzXCIpO1xuICAgIGlmIChcbiAgICAgICFwYXRoLnN0YXJ0c1dpdGgoXCIvX1wiKSAmJiAhaXNMYXlvdXQgJiYgIWlzTWlkZGxld2FyZVxuICAgICkge1xuICAgICAgY29uc3QgeyBkZWZhdWx0OiBjb21wb25lbnQsIGNvbmZpZyB9ID0gbW9kdWxlIGFzIFJvdXRlTW9kdWxlO1xuICAgICAgbGV0IHBhdHRlcm4gPSBwYXRoVG9QYXR0ZXJuKGJhc2VSb3V0ZSk7XG4gICAgICBpZiAoY29uZmlnPy5yb3V0ZU92ZXJyaWRlKSB7XG4gICAgICAgIHBhdHRlcm4gPSBTdHJpbmcoY29uZmlnLnJvdXRlT3ZlcnJpZGUpO1xuICAgICAgfVxuICAgICAgbGV0IHsgaGFuZGxlciB9ID0gbW9kdWxlIGFzIFJvdXRlTW9kdWxlO1xuICAgICAgaWYgKCFoYW5kbGVyICYmIFwiaGFuZGxlcnNcIiBpbiBtb2R1bGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBGb3VuZCBuYW1lZCBleHBvcnQgXCJoYW5kbGVyc1wiIGluICR7c2VsZn0gaW5zdGVhZCBvZiBcImhhbmRsZXJcIi4gRGlkIHlvdSBtZWFuIFwiaGFuZGxlclwiP2AsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBoYW5kbGVyID8/PSB7fTtcbiAgICAgIGlmIChcbiAgICAgICAgY29tcG9uZW50ICYmIHR5cGVvZiBoYW5kbGVyID09PSBcIm9iamVjdFwiICYmIGhhbmRsZXIuR0VUID09PSB1bmRlZmluZWRcbiAgICAgICkge1xuICAgICAgICBoYW5kbGVyLkdFVCA9IChfcmVxLCB7IHJlbmRlciB9KSA9PiByZW5kZXIoKTtcbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIGhhbmRsZXIgPT09IFwib2JqZWN0XCIgJiYgaGFuZGxlci5HRVQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICBoYW5kbGVyLkhFQUQgPT09IHVuZGVmaW5lZFxuICAgICAgKSB7XG4gICAgICAgIGNvbnN0IEdFVCA9IGhhbmRsZXIuR0VUO1xuICAgICAgICBoYW5kbGVyLkhFQUQgPSBhc3luYyAocmVxLCBjdHgpID0+IHtcbiAgICAgICAgICBjb25zdCByZXNwID0gYXdhaXQgR0VUKHJlcSwgY3R4KTtcbiAgICAgICAgICByZXNwLmJvZHk/LmNhbmNlbCgpO1xuICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwge1xuICAgICAgICAgICAgaGVhZGVyczogcmVzcC5oZWFkZXJzLFxuICAgICAgICAgICAgc3RhdHVzOiByZXNwLnN0YXR1cyxcbiAgICAgICAgICAgIHN0YXR1c1RleHQ6IHJlc3Auc3RhdHVzVGV4dCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJvdXRlOiBSb3V0ZSA9IHtcbiAgICAgICAgYmFzZVJvdXRlOiB0b0Jhc2VSb3V0ZShiYXNlUm91dGUpLFxuICAgICAgICBwYXR0ZXJuLFxuICAgICAgICB1cmwsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNvbXBvbmVudCxcbiAgICAgICAgaGFuZGxlcixcbiAgICAgICAgY3NwOiBCb29sZWFuKGNvbmZpZz8uY3NwID8/IGZhbHNlKSxcbiAgICAgICAgYXBwV3JhcHBlcjogIWNvbmZpZz8uc2tpcEFwcFdyYXBwZXIsXG4gICAgICAgIGluaGVyaXRMYXlvdXRzOiAhY29uZmlnPy5za2lwSW5oZXJpdGVkTGF5b3V0cyxcbiAgICAgIH07XG4gICAgICByb3V0ZXMucHVzaChyb3V0ZSk7XG4gICAgfSBlbHNlIGlmIChpc01pZGRsZXdhcmUpIHtcbiAgICAgIG1pZGRsZXdhcmVzLnB1c2goe1xuICAgICAgICBiYXNlUm91dGU6IHRvQmFzZVJvdXRlKGJhc2VSb3V0ZSksXG4gICAgICAgIG1vZHVsZTogbW9kdWxlIGFzIE1pZGRsZXdhcmVNb2R1bGUsXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgcGF0aCA9PT0gXCIvX2FwcC50c3hcIiB8fCBwYXRoID09PSBcIi9fYXBwLnRzXCIgfHxcbiAgICAgIHBhdGggPT09IFwiL19hcHAuanN4XCIgfHwgcGF0aCA9PT0gXCIvX2FwcC5qc1wiXG4gICAgKSB7XG4gICAgICBhcHAgPSBtb2R1bGUgYXMgQXBwTW9kdWxlO1xuICAgIH0gZWxzZSBpZiAoaXNMYXlvdXQpIHtcbiAgICAgIGNvbnN0IG1vZCA9IG1vZHVsZSBhcyBMYXlvdXRNb2R1bGU7XG4gICAgICBjb25zdCBjb25maWcgPSBtb2QuY29uZmlnO1xuICAgICAgbGF5b3V0cy5wdXNoKHtcbiAgICAgICAgYmFzZVJvdXRlOiB0b0Jhc2VSb3V0ZShiYXNlUm91dGUpLFxuICAgICAgICBoYW5kbGVyOiBtb2QuaGFuZGxlcixcbiAgICAgICAgY29tcG9uZW50OiBtb2QuZGVmYXVsdCxcbiAgICAgICAgYXBwV3JhcHBlcjogIWNvbmZpZz8uc2tpcEFwcFdyYXBwZXIsXG4gICAgICAgIGluaGVyaXRMYXlvdXRzOiAhY29uZmlnPy5za2lwSW5oZXJpdGVkTGF5b3V0cyxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBwYXRoID09PSBcIi9fNDA0LnRzeFwiIHx8IHBhdGggPT09IFwiL180MDQudHNcIiB8fFxuICAgICAgcGF0aCA9PT0gXCIvXzQwNC5qc3hcIiB8fCBwYXRoID09PSBcIi9fNDA0LmpzXCJcbiAgICApIHtcbiAgICAgIGNvbnN0IHsgZGVmYXVsdDogY29tcG9uZW50LCBjb25maWcgfSA9IG1vZHVsZSBhcyBVbmtub3duUGFnZU1vZHVsZTtcbiAgICAgIGxldCB7IGhhbmRsZXIgfSA9IG1vZHVsZSBhcyBVbmtub3duUGFnZU1vZHVsZTtcbiAgICAgIGlmIChjb21wb25lbnQgJiYgaGFuZGxlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGhhbmRsZXIgPSAoX3JlcSwgeyByZW5kZXIgfSkgPT4gcmVuZGVyKCk7XG4gICAgICB9XG5cbiAgICAgIG5vdEZvdW5kID0ge1xuICAgICAgICBiYXNlUm91dGU6IFJPT1RfQkFTRV9ST1VURSxcbiAgICAgICAgcGF0dGVybjogcGF0aFRvUGF0dGVybihiYXNlUm91dGUpLFxuICAgICAgICB1cmwsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNvbXBvbmVudCxcbiAgICAgICAgaGFuZGxlcjogaGFuZGxlciA/PyAoKHJlcSkgPT4gcm91dGVyLmRlZmF1bHRPdGhlckhhbmRsZXIocmVxKSksXG4gICAgICAgIGNzcDogQm9vbGVhbihjb25maWc/LmNzcCA/PyBmYWxzZSksXG4gICAgICAgIGFwcFdyYXBwZXI6ICFjb25maWc/LnNraXBBcHBXcmFwcGVyLFxuICAgICAgICBpbmhlcml0TGF5b3V0czogIWNvbmZpZz8uc2tpcEluaGVyaXRlZExheW91dHMsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBwYXRoID09PSBcIi9fNTAwLnRzeFwiIHx8IHBhdGggPT09IFwiL181MDAudHNcIiB8fFxuICAgICAgcGF0aCA9PT0gXCIvXzUwMC5qc3hcIiB8fCBwYXRoID09PSBcIi9fNTAwLmpzXCJcbiAgICApIHtcbiAgICAgIGNvbnN0IHsgZGVmYXVsdDogY29tcG9uZW50LCBjb25maWc6IHJvdXRlQ29uZmlnIH0gPVxuICAgICAgICBtb2R1bGUgYXMgRXJyb3JQYWdlTW9kdWxlO1xuICAgICAgbGV0IHsgaGFuZGxlciB9ID0gbW9kdWxlIGFzIEVycm9yUGFnZU1vZHVsZTtcbiAgICAgIGlmIChjb21wb25lbnQgJiYgaGFuZGxlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGhhbmRsZXIgPSAoX3JlcSwgeyByZW5kZXIgfSkgPT4gcmVuZGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGVycm9yID0ge1xuICAgICAgICBiYXNlUm91dGU6IHRvQmFzZVJvdXRlKFwiL1wiKSxcbiAgICAgICAgcGF0dGVybjogcGF0aFRvUGF0dGVybihiYXNlUm91dGUpLFxuICAgICAgICB1cmwsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNvbXBvbmVudCxcbiAgICAgICAgaGFuZGxlcjogaGFuZGxlciA/PyByb3V0ZXIuZGVmYXVsdEVycm9ySGFuZGxlcixcbiAgICAgICAgY3NwOiBCb29sZWFuKHJvdXRlQ29uZmlnPy5jc3AgPz8gZmFsc2UpLFxuICAgICAgICBhcHBXcmFwcGVyOiAhcm91dGVDb25maWc/LnNraXBBcHBXcmFwcGVyLFxuICAgICAgICBpbmhlcml0TGF5b3V0czogIXJvdXRlQ29uZmlnPy5za2lwSW5oZXJpdGVkTGF5b3V0cyxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcHJvY2Vzc2VkSXNsYW5kczoge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBwYXRoOiBzdHJpbmc7XG4gICAgbW9kdWxlOiBJc2xhbmRNb2R1bGU7XG4gIH1bXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zIHx8IFtdKSB7XG4gICAgaWYgKCFwbHVnaW4uaXNsYW5kcykgY29udGludWU7XG4gICAgY29uc3QgYmFzZSA9IGRpcm5hbWUocGx1Z2luLmlzbGFuZHMuYmFzZUxvY2F0aW9uKTtcblxuICAgIGZvciAoY29uc3Qgc3BlY2lmaWVyIG9mIHBsdWdpbi5pc2xhbmRzLnBhdGhzKSB7XG4gICAgICBjb25zdCBmdWxsID0gam9pbihiYXNlLCBzcGVjaWZpZXIpO1xuICAgICAgY29uc3QgbW9kdWxlID0gYXdhaXQgaW1wb3J0KGZ1bGwpO1xuICAgICAgY29uc3QgbmFtZSA9IHNhbml0aXplSXNsYW5kTmFtZShiYXNlbmFtZShmdWxsLCBleHRuYW1lKGZ1bGwpKSk7XG4gICAgICBwcm9jZXNzZWRJc2xhbmRzLnB1c2goe1xuICAgICAgICBuYW1lLFxuICAgICAgICBwYXRoOiBmdWxsLFxuICAgICAgICBtb2R1bGUsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IFtzZWxmLCBtb2R1bGVdIG9mIE9iamVjdC5lbnRyaWVzKG1hbmlmZXN0LmlzbGFuZHMpKSB7XG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChzZWxmLCBiYXNlVXJsKS5ocmVmO1xuICAgIGlmICghdXJsLnN0YXJ0c1dpdGgoYmFzZVVybCkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJc2xhbmQgaXMgbm90IGEgY2hpbGQgb2YgdGhlIGJhc2VwYXRoLlwiKTtcbiAgICB9XG4gICAgbGV0IHBhdGggPSB1cmwuc3Vic3RyaW5nKGJhc2VVcmwubGVuZ3RoKTtcbiAgICBpZiAocGF0aC5zdGFydHNXaXRoKFwiaXNsYW5kc1wiKSkge1xuICAgICAgcGF0aCA9IHBhdGguc2xpY2UoXCJpc2xhbmRzXCIubGVuZ3RoICsgMSk7XG4gICAgfVxuICAgIGNvbnN0IGJhc2VSb3V0ZSA9IHBhdGguc3Vic3RyaW5nKDAsIHBhdGgubGVuZ3RoIC0gZXh0bmFtZShwYXRoKS5sZW5ndGgpO1xuXG4gICAgcHJvY2Vzc2VkSXNsYW5kcy5wdXNoKHtcbiAgICAgIG5hbWU6IHNhbml0aXplSXNsYW5kTmFtZShiYXNlUm91dGUpLFxuICAgICAgcGF0aDogdXJsLFxuICAgICAgbW9kdWxlLFxuICAgIH0pO1xuICB9XG5cbiAgZm9yIChjb25zdCBwcm9jZXNzZWRJc2xhbmQgb2YgcHJvY2Vzc2VkSXNsYW5kcykge1xuICAgIGZvciAoXG4gICAgICBjb25zdCBbZXhwb3J0TmFtZSwgZXhwb3J0ZWRGdW5jdGlvbl0gb2YgT2JqZWN0LmVudHJpZXMoXG4gICAgICAgIHByb2Nlc3NlZElzbGFuZC5tb2R1bGUsXG4gICAgICApXG4gICAgKSB7XG4gICAgICBpZiAodHlwZW9mIGV4cG9ydGVkRnVuY3Rpb24gIT09IFwiZnVuY3Rpb25cIikgY29udGludWU7XG4gICAgICBjb25zdCBuYW1lID0gcHJvY2Vzc2VkSXNsYW5kLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IGlkID0gYCR7bmFtZX1fJHtleHBvcnROYW1lLnRvTG93ZXJDYXNlKCl9YDtcbiAgICAgIGlzbGFuZHMucHVzaCh7XG4gICAgICAgIGlkLFxuICAgICAgICBuYW1lLFxuICAgICAgICB1cmw6IHByb2Nlc3NlZElzbGFuZC5wYXRoLFxuICAgICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgICBjb21wb25lbnQ6IGV4cG9ydGVkRnVuY3Rpb24gYXMgQ29tcG9uZW50VHlwZTxhbnk+LFxuICAgICAgICBleHBvcnROYW1lLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc3RhdGljRmlsZXM6IFN0YXRpY0ZpbGVbXSA9IFtdO1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXRpY0RpcnMgPSBbY29uZmlnLnN0YXRpY0Rpcl07XG5cbiAgICAvLyBPbmx5IGZhbGwgdGhyb3VnaCB0byBmaWxlcyBpbiAvX2ZyZXNoL3N0YXRpYyB3aGVuIG5vdCBpbiBkZXZcbiAgICBpZiAoc3RhdGUubG9hZFNuYXBzaG90KSB7XG4gICAgICBjb25zdCBvdXREaXJTdGF0aWMgPSBqb2luKGNvbmZpZy5idWlsZC5vdXREaXIsIFwic3RhdGljXCIpO1xuICAgICAgc3RhdGljRGlycy5wdXNoKG91dERpclN0YXRpYyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzdGF0aWNEaXIgb2Ygc3RhdGljRGlycykge1xuICAgICAgY29uc3Qgc3RhdGljRGlyVXJsID0gdG9GaWxlVXJsKHN0YXRpY0Rpcik7XG4gICAgICBjb25zdCBlbnRyaWVzID0gd2FsayhzdGF0aWNEaXIsIHtcbiAgICAgICAgaW5jbHVkZUZpbGVzOiB0cnVlLFxuICAgICAgICBpbmNsdWRlRGlyczogZmFsc2UsXG4gICAgICAgIGZvbGxvd1N5bWxpbmtzOiBmYWxzZSxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgZm9yIGF3YWl0IChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGNvbnN0IGxvY2FsVXJsID0gdG9GaWxlVXJsKGVudHJ5LnBhdGgpO1xuICAgICAgICBjb25zdCBwYXRoID0gbG9jYWxVcmwuaHJlZi5zdWJzdHJpbmcoc3RhdGljRGlyVXJsLmhyZWYubGVuZ3RoKTtcbiAgICAgICAgY29uc3Qgc3RhdCA9IGF3YWl0IERlbm8uc3RhdChsb2NhbFVybCk7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBjb250ZW50VHlwZShleHRuYW1lKHBhdGgpKSA/P1xuICAgICAgICAgIFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCI7XG4gICAgICAgIGNvbnN0IGV0YWcgPSBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChcbiAgICAgICAgICBcIlNIQS0xXCIsXG4gICAgICAgICAgZW5jb2Rlci5lbmNvZGUoQlVJTERfSUQgKyBwYXRoKSxcbiAgICAgICAgKS50aGVuKChoYXNoKSA9PlxuICAgICAgICAgIEFycmF5LmZyb20obmV3IFVpbnQ4QXJyYXkoaGFzaCkpXG4gICAgICAgICAgICAubWFwKChieXRlKSA9PiBieXRlLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikpXG4gICAgICAgICAgICAuam9pbihcIlwiKVxuICAgICAgICApO1xuICAgICAgICBjb25zdCBzdGF0aWNGaWxlOiBTdGF0aWNGaWxlID0ge1xuICAgICAgICAgIGxvY2FsVXJsLFxuICAgICAgICAgIHBhdGg6IGpvaW4oc3RhdGUuY29uZmlnLmJhc2VQYXRoLCBwYXRoKSxcbiAgICAgICAgICBzaXplOiBzdGF0LnNpemUsXG4gICAgICAgICAgY29udGVudFR5cGU6IHR5cGUsXG4gICAgICAgICAgZXRhZyxcbiAgICAgICAgfTtcbiAgICAgICAgc3RhdGljRmlsZXMucHVzaChzdGF0aWNGaWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY2F1c2UgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgLy8gRG8gbm90aGluZy5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYXBwLFxuICAgIGVycm9yLFxuICAgIGlzbGFuZHMsXG4gICAgbGF5b3V0cyxcbiAgICBtaWRkbGV3YXJlcyxcbiAgICBub3RGb3VuZCxcbiAgICByb3V0ZXMsXG4gICAgc3RhdGljRmlsZXMsXG4gIH07XG59XG5cbmNvbnN0IEFQUF9SRUcgPSAvX2FwcFxcLlt0al1zeD8kLztcblxuLyoqXG4gKiBTb3J0IHJvdXRlIHBhdGhzIHdoZXJlIHNwZWNpYWwgRnJlc2ggZmlsZXMgbGlrZSBgX2FwcGAsXG4gKiBgX2xheW91dGAgYW5kIGBfbWlkZGxld2FyZWAgYXJlIHNvcnRlZCBpbiBmcm9udC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNvcnRSb3V0ZVBhdGhzKGE6IHN0cmluZywgYjogc3RyaW5nKSB7XG4gIC8vIFRoZSBgX2FwcGAgcm91dGUgc2hvdWxkIGFsd2F5cyBiZSB0aGUgZmlyc3RcbiAgaWYgKEFQUF9SRUcudGVzdChhKSkgcmV0dXJuIC0xO1xuICBlbHNlIGlmIChBUFBfUkVHLnRlc3QoYikpIHJldHVybiAxO1xuXG4gIGxldCBzZWdtZW50SWR4ID0gMDtcbiAgY29uc3QgYUxlbiA9IGEubGVuZ3RoO1xuICBjb25zdCBiTGVuID0gYi5sZW5ndGg7XG4gIGNvbnN0IG1heExlbiA9IGFMZW4gPiBiTGVuID8gYUxlbiA6IGJMZW47XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4TGVuOyBpKyspIHtcbiAgICBjb25zdCBjaGFyQSA9IGEuY2hhckF0KGkpO1xuICAgIGNvbnN0IGNoYXJCID0gYi5jaGFyQXQoaSk7XG4gICAgY29uc3QgbmV4dEEgPSBpICsgMSA8IGFMZW4gPyBhLmNoYXJBdChpICsgMSkgOiBcIlwiO1xuICAgIGNvbnN0IG5leHRCID0gaSArIDEgPCBiTGVuID8gYi5jaGFyQXQoaSArIDEpIDogXCJcIjtcblxuICAgIGlmIChjaGFyQSA9PT0gXCIvXCIgfHwgY2hhckIgPT09IFwiL1wiKSB7XG4gICAgICBzZWdtZW50SWR4ID0gaTtcbiAgICAgIC8vIElmIHRoZSBvdGhlciBwYXRoIGRvZXNuJ3QgY2xvc2UgdGhlIHNlZ21lbnRcbiAgICAgIC8vIHRoZW4gd2UgZG9uJ3QgbmVlZCB0byBjb250aW51ZVxuICAgICAgaWYgKGNoYXJBICE9PSBcIi9cIikgcmV0dXJuIC0xO1xuICAgICAgaWYgKGNoYXJCICE9PSBcIi9cIikgcmV0dXJuIDE7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoaSA9PT0gc2VnbWVudElkeCArIDEpIHtcbiAgICAgIGNvbnN0IHNjb3JlQSA9IGdldFJvdXRlUGF0aFNjb3JlKGNoYXJBLCBuZXh0QSk7XG4gICAgICBjb25zdCBzY29yZUIgPSBnZXRSb3V0ZVBhdGhTY29yZShjaGFyQiwgbmV4dEIpO1xuICAgICAgaWYgKHNjb3JlQSA9PT0gc2NvcmVCKSBjb250aW51ZTtcbiAgICAgIHJldHVybiBzY29yZUEgPiBzY29yZUIgPyAtMSA6IDE7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIDA7XG59XG5cbi8qKlxuICogQXNzaWduIGEgc2NvcmUgYmFzZWQgb24gdGhlIGZpcnN0IHR3byBjaGFyYWN0ZXJzIG9mIGEgcGF0aCBzZWdtZW50LlxuICogVGhlIGdvYWwgaXMgdG8gc29ydCBgX21pZGRsZXdhcmVgIGFuZCBgX2xheW91dGAgaW4gZnJvbnQgb2YgZXZlcnl0aGluZ1xuICogYW5kIGBbYCBvciBgWy4uLmAgbGFzdCByZXNwZWN0aXZlbHkuXG4gKi9cbmZ1bmN0aW9uIGdldFJvdXRlUGF0aFNjb3JlKGNoYXI6IHN0cmluZywgbmV4dENoYXI6IHN0cmluZyk6IG51bWJlciB7XG4gIGlmIChjaGFyID09PSBcIl9cIikge1xuICAgIGlmIChuZXh0Q2hhciA9PT0gXCJtXCIpIHJldHVybiA0O1xuICAgIHJldHVybiAzO1xuICB9IGVsc2UgaWYgKGNoYXIgPT09IFwiW1wiKSB7XG4gICAgaWYgKG5leHRDaGFyID09PSBcIi5cIikge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAyO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybSBhIGZpbGVzeXN0ZW0gVVJMIHBhdGggdG8gYSBgcGF0aC10by1yZWdleGAgc3R5bGUgbWF0Y2hlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXRoVG9QYXR0ZXJuKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzID0gcGF0aC5zcGxpdChcIi9cIik7XG4gIGlmIChwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXSA9PT0gXCJpbmRleFwiKSB7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIFwiL1wiO1xuICAgIH1cbiAgICBwYXJ0cy5wb3AoKTtcbiAgfVxuXG4gIGxldCByb3V0ZSA9IFwiXCI7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1tpXTtcblxuICAgIC8vIENhc2U6IC9bLi4uZm9vXS50c3hcbiAgICBpZiAocGFydC5zdGFydHNXaXRoKFwiWy4uLlwiKSAmJiBwYXJ0LmVuZHNXaXRoKFwiXVwiKSkge1xuICAgICAgcm91dGUgKz0gYC86JHtwYXJ0LnNsaWNlKDQsIHBhcnQubGVuZ3RoIC0gMSl9KmA7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBSb3V0ZSBncm91cHMgbGlrZSAvZm9vLyhiYXIpIHNob3VsZCBub3QgYmUgaW5jbHVkZWQgaW4gVVJMXG4gICAgLy8gbWF0Y2hpbmcuIFRoZXkgYXJlIHRyYW5zcGFyZW50IGFuZCBuZWVkIHRvIGJlIHJlbW92ZWQgaGVyZS5cbiAgICAvLyBDYXNlOiAvZm9vLyhiYXIpIC0+IC9mb29cbiAgICAvLyBDYXNlOiAvZm9vLyhiYXIpL2JvYiAtPiAvZm9vL2JvYlxuICAgIC8vIENhc2U6IC8oZm9vKS9iYXIgLT4gL2JhclxuICAgIGlmIChwYXJ0LnN0YXJ0c1dpdGgoXCIoXCIpICYmIHBhcnQuZW5kc1dpdGgoXCIpXCIpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBEaXNhbGxvdyBuZWlnaGJvdXJpbmcgcGFyYW1zIGxpa2UgYC9baWRdW2Jhcl0udHN4YCBiZWNhdXNlXG4gICAgLy8gaXQncyBhbWJpZ3VvdXMgd2hlcmUgdGhlIGBpZGAgcGFyYW0gZW5kcyBhbmQgYGJhcmAgYmVnaW5zLlxuICAgIGlmIChwYXJ0LmluY2x1ZGVzKFwiXVtcIikpIHtcbiAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgICAgYEludmFsaWQgcm91dGUgcGF0dGVybjogXCIke3BhdGh9XCIuIEEgcGFyYW1ldGVyIGNhbm5vdCBiZSBmb2xsb3dlZCBieSBhbm90aGVyIHBhcmFtZXRlciB3aXRob3V0IGFueSBjaGFyYWN0ZXJzIGluIGJldHdlZW4uYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ2FzZTogL1tbaWRdXS50c3hcbiAgICAvLyBDYXNlOiAvW2lkXS50c3hcbiAgICAvLyBDYXNlOiAvW2lkXUBbYmFyXS50c3hcbiAgICAvLyBDYXNlOiAvW2lkXS1hc2RmLnRzeFxuICAgIC8vIENhc2U6IC9baWRdLWFzZGZbYmFyXS50c3hcbiAgICAvLyBDYXNlOiAvYXNkZltiYXJdLnRzeFxuICAgIGxldCBwYXR0ZXJuID0gXCJcIjtcbiAgICBsZXQgZ3JvdXBPcGVuID0gMDtcbiAgICBsZXQgb3B0aW9uYWwgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnQubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IGNoYXIgPSBwYXJ0W2pdO1xuICAgICAgaWYgKGNoYXIgPT09IFwiW1wiKSB7XG4gICAgICAgIGlmIChwYXJ0W2ogKyAxXSA9PT0gXCJbXCIpIHtcbiAgICAgICAgICAvLyBEaXNhbGxvdyBvcHRpb25hbCBkeW5hbWljIHBhcmFtcyBsaWtlIGBmb28tW1tiYXJdXWBcbiAgICAgICAgICBpZiAocGFydFtqIC0gMV0gIT09IFwiL1wiICYmICEhcGFydFtqIC0gMV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgICAgICAgICAgYEludmFsaWQgcm91dGUgcGF0dGVybjogXCIke3BhdGh9XCIuIEFuIG9wdGlvbmFsIHBhcmFtZXRlciBuZWVkcyB0byBiZSBhIGZ1bGwgc2VnbWVudC5gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ3JvdXBPcGVuKys7XG4gICAgICAgICAgb3B0aW9uYWwgPSB0cnVlO1xuICAgICAgICAgIHBhdHRlcm4gKz0gXCJ7L1wiO1xuICAgICAgICAgIGorKztcbiAgICAgICAgfVxuICAgICAgICBwYXR0ZXJuICs9IFwiOlwiO1xuICAgICAgICBncm91cE9wZW4rKztcbiAgICAgIH0gZWxzZSBpZiAoY2hhciA9PT0gXCJdXCIpIHtcbiAgICAgICAgaWYgKHBhcnRbaiArIDFdID09PSBcIl1cIikge1xuICAgICAgICAgIC8vIERpc2FsbG93IG9wdGlvbmFsIGR5bmFtaWMgcGFyYW1zIGxpa2UgYFtbZm9vXV0tYmFyYFxuICAgICAgICAgIGlmIChwYXJ0W2ogKyAyXSAhPT0gXCIvXCIgJiYgISFwYXJ0W2ogKyAyXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgICAgICAgICBgSW52YWxpZCByb3V0ZSBwYXR0ZXJuOiBcIiR7cGF0aH1cIi4gQW4gb3B0aW9uYWwgcGFyYW1ldGVyIG5lZWRzIHRvIGJlIGEgZnVsbCBzZWdtZW50LmAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBncm91cE9wZW4tLTtcbiAgICAgICAgICBwYXR0ZXJuICs9IFwifT9cIjtcbiAgICAgICAgICBqKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKC0tZ3JvdXBPcGVuIDwgMCkge1xuICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihgSW52YWxpZCByb3V0ZSBwYXR0ZXJuOiBcIiR7cGF0aH1cImApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXR0ZXJuICs9IGNoYXI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcm91dGUgKz0gKG9wdGlvbmFsID8gXCJcIiA6IFwiL1wiKSArIHBhdHRlcm47XG4gIH1cblxuICAvLyBDYXNlOiAvKGdyb3VwKS9pbmRleC50c3hcbiAgaWYgKHJvdXRlID09PSBcIlwiKSB7XG4gICAgcm91dGUgPSBcIi9cIjtcbiAgfVxuXG4gIHJldHVybiByb3V0ZTtcbn1cblxuZnVuY3Rpb24gdG9QYXNjYWxDYXNlKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UoXG4gICAgLyheXFx3fC1cXHcpL2csXG4gICAgKHN1YnN0cmluZykgPT4gc3Vic3RyaW5nLnJlcGxhY2UoLy0vLCBcIlwiKS50b1VwcGVyQ2FzZSgpLFxuICApO1xufVxuXG5mdW5jdGlvbiBzYW5pdGl6ZUlzbGFuZE5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZmlsZU5hbWUgPSBzdHJpbmdUb0lkZW50aWZpZXIobmFtZSk7XG4gIHJldHVybiB0b1Bhc2NhbENhc2UoZmlsZU5hbWUpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRNaWRkbGV3YXJlUGF0aChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwcmVmaXggPSAhcGF0aC5zdGFydHNXaXRoKFwiL1wiKSA/IFwiL1wiIDogXCJcIjtcbiAgY29uc3Qgc3VmZml4ID0gIXBhdGguZW5kc1dpdGgoXCIvXCIpID8gXCIvXCIgOiBcIlwiO1xuICByZXR1cm4gcHJlZml4ICsgcGF0aCArIHN1ZmZpeDtcbn1cblxuZnVuY3Rpb24gZ2V0TWlkZGxld2FyZVJvdXRlc0Zyb21QbHVnaW5zKFxuICBwbHVnaW5zOiBQbHVnaW5bXSxcbik6IFtzdHJpbmcsIE1pZGRsZXdhcmVNb2R1bGVdW10ge1xuICBjb25zdCBtaWRkbGV3YXJlcyA9IHBsdWdpbnMuZmxhdE1hcCgocGx1Z2luKSA9PiBwbHVnaW4ubWlkZGxld2FyZXMgPz8gW10pO1xuXG4gIGNvbnN0IG13czogUmVjb3JkPFxuICAgIHN0cmluZyxcbiAgICBbc3RyaW5nLCB7IGhhbmRsZXI6IE1pZGRsZXdhcmVIYW5kbGVyW10gfV1cbiAgPiA9IHt9O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1pZGRsZXdhcmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgbXcgPSBtaWRkbGV3YXJlc1tpXTtcbiAgICBjb25zdCBoYW5kbGVyID0gbXcubWlkZGxld2FyZS5oYW5kbGVyO1xuICAgIGNvbnN0IGtleSA9IGAuL3JvdXRlcyR7Zm9ybWF0TWlkZGxld2FyZVBhdGgobXcucGF0aCl9X21pZGRsZXdhcmUudHNgO1xuICAgIGlmICghbXdzW2tleV0pIG13c1trZXldID0gW2tleSwgeyBoYW5kbGVyOiBbXSB9XTtcbiAgICBtd3Nba2V5XVsxXS5oYW5kbGVyLnB1c2goLi4uQXJyYXkuaXNBcnJheShoYW5kbGVyKSA/IGhhbmRsZXIgOiBbaGFuZGxlcl0pO1xuICB9XG5cbiAgcmV0dXJuIE9iamVjdC52YWx1ZXMobXdzKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0Um91dGVQYXRoKHBhdGg6IHN0cmluZykge1xuICByZXR1cm4gcGF0aC5zdGFydHNXaXRoKFwiL1wiKSA/IHBhdGggOiBcIi9cIiArIHBhdGg7XG59XG5cbmZ1bmN0aW9uIGdldFJvdXRlc0Zyb21QbHVnaW5zKHBsdWdpbnM6IFBsdWdpbltdKTogW3N0cmluZywgUm91dGVNb2R1bGVdW10ge1xuICByZXR1cm4gcGx1Z2lucy5mbGF0TWFwKChwbHVnaW4pID0+IHBsdWdpbi5yb3V0ZXMgPz8gW10pXG4gICAgLm1hcCgocm91dGUpID0+IHtcbiAgICAgIHJldHVybiBbYC4vcm91dGVzJHtmb3JtYXRSb3V0ZVBhdGgocm91dGUucGF0aCl9LnRzYCwge1xuICAgICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgICBkZWZhdWx0OiByb3V0ZS5jb21wb25lbnQgYXMgYW55LFxuICAgICAgICBoYW5kbGVyOiByb3V0ZS5oYW5kbGVyLFxuICAgICAgfV07XG4gICAgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBd0IsQ0FBQyxRQUFRLFNBQVM7QUFvQjFDLFlB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
// denoCacheMetadata=15695673990262416652,773349219795277034