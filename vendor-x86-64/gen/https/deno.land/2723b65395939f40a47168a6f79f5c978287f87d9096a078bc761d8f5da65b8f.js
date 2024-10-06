import { h } from "preact";
import { NONE, UNSAFE_INLINE } from "../runtime/csp.ts";
import { RenderState } from "./rendering/state.ts";
import { renderHtml, renderOuterDocument } from "./rendering/template.tsx";
import { renderFreshTags } from "./rendering/fresh_tags.tsx";
import { DEV_ERROR_OVERLAY_URL } from "./constants.ts";
import { colors } from "./deps.ts";
import { withBase } from "./router.ts";
export const DEFAULT_RENDER_FN = (_ctx, render)=>{
  render();
};
export class RenderContext {
  #id;
  #state = new Map();
  #styles = [];
  #url;
  #route;
  #lang;
  constructor(id, url, route, lang){
    this.#id = id;
    this.#url = url;
    this.#route = route;
    this.#lang = lang;
  }
  /** A unique ID for this logical JIT render. */ get id() {
    return this.#id;
  }
  /**
   * State that is persisted between multiple renders with the same render
   * context. This is useful because one logical JIT render could have multiple
   * preact render passes due to suspense.
   */ get state() {
    return this.#state;
  }
  /**
   * All of the CSS style rules that should be inlined into the document.
   * Adding to this list across multiple renders is supported (even across
   * suspense!). The CSS rules will always be inserted on the client in the
   * order specified here.
   */ get styles() {
    return this.#styles;
  }
  /** The URL of the page being rendered. */ get url() {
    return this.#url;
  }
  /** The route matcher (e.g. /blog/:id) that the request matched for this page
   * to be rendered. */ get route() {
    return this.#route;
  }
  /** The language of the page being rendered. Defaults to "en". */ get lang() {
    return this.#lang;
  }
  set lang(lang) {
    this.#lang = lang;
  }
}
function defaultCsp() {
  return {
    directives: {
      defaultSrc: [
        NONE
      ],
      styleSrc: [
        UNSAFE_INLINE
      ]
    },
    reportOnly: false
  };
}
export function checkAsyncComponent(component) {
  return typeof component === "function" && component.constructor.name === "AsyncFunction";
}
/**
 * This function renders out a page. Rendering is synchronous and non streaming.
 * Suspense boundaries are not supported.
 */ export async function render(opts) {
  const component = opts.route.component;
  // Only inherit layouts up to the nearest root layout.
  // Note that the route itself can act as the root layout.
  let layouts = opts.layouts;
  if (opts.route.inheritLayouts) {
    let rootIdx = 0;
    let layoutIdx = opts.layouts.length;
    while(layoutIdx--){
      if (!opts.layouts[layoutIdx].inheritLayouts) {
        rootIdx = layoutIdx;
        break;
      }
    }
    layouts = opts.layouts.slice(rootIdx);
  } else {
    layouts = [];
  }
  const { params, data, state, error, url, basePath } = opts.context;
  const props = {
    basePath,
    config: opts.context.config,
    destination: opts.context.destination,
    isPartial: opts.context.isPartial,
    params,
    error,
    codeFrame: opts.context.codeFrame,
    remoteAddr: opts.context.remoteAddr,
    localAddr: opts.context.localAddr,
    Component: ()=>null,
    pattern: opts.context.pattern,
    url,
    route: opts.context.route,
    data,
    state
  };
  const csp = opts.route.csp ? defaultCsp() : undefined;
  if (csp) {
    // Clear the csp
    const newCsp = defaultCsp();
    csp.directives = newCsp.directives;
    csp.reportOnly = newCsp.reportOnly;
  }
  const ctx = new RenderContext(crypto.randomUUID(), url, opts.route.pattern, opts.lang ?? "en");
  const context = opts.context;
  // Prepare render order
  // deno-lint-ignore no-explicit-any
  const renderStack = [];
  // Check if appLayout is enabled
  if (opts.route.appWrapper && layouts.every((layout)=>layout.appWrapper)) {
    renderStack.push(opts.app.default);
  }
  for(let i = 0; i < layouts.length; i++){
    renderStack.push(layouts[i].component);
  }
  renderStack.push(component);
  // Build the final stack of component functions
  const componentStack = new Array(renderStack.length).fill(null);
  for(let i = 0; i < renderStack.length; i++){
    const fn = renderStack[i];
    if (!fn) continue;
    if (checkAsyncComponent(fn)) {
      // Don't pass <Component /> when it's the route component
      const isRouteComponent = fn === component;
      const componentCtx = isRouteComponent ? context : {
        ...context,
        Component () {
          return h(componentStack[i + 1], props);
        }
      };
      // deno-lint-ignore no-explicit-any
      const res = await fn(opts.request, componentCtx);
      // Bail out of rendering if we returned a response
      if (res instanceof Response) {
        return res;
      }
      const componentFn = ()=>res;
      // Set displayName to make debugging easier
      // deno-lint-ignore no-explicit-any
      componentFn.displayName = fn.displayName || fn.name;
      componentStack[i] = componentFn;
    } else {
      componentStack[i] = ()=>{
        return h(fn, {
          ...props,
          Component () {
            return h(componentStack[i + 1], null);
          }
        });
      };
    }
  }
  // CAREFUL: Rendering is synchronous internally and all state
  // should be managed through the `RenderState` instance. That
  // ensures that each render request is associated with the same
  // data.
  const renderState = new RenderState(crypto.randomUUID(), {
    url,
    route: opts.route.pattern,
    data,
    state,
    params,
    basePath
  }, componentStack, csp, error);
  let bodyHtml = null;
  const syncPlugins = opts.plugins.filter((p)=>p.render);
  const renderResults = [];
  function renderSync() {
    const plugin = syncPlugins.shift();
    if (plugin) {
      const res = plugin.render({
        render: renderSync
      });
      if (res === undefined) {
        throw new Error(`${plugin?.name}'s render hook did not return a PluginRenderResult object.`);
      }
      renderResults.push([
        plugin,
        res
      ]);
      if (res.htmlText !== undefined) {
        bodyHtml = res.htmlText;
      }
    } else {
      bodyHtml = renderHtml(renderState);
    }
    if (bodyHtml === null) {
      throw new Error(`The 'render' function was not called by ${plugin?.name}'s render hook.`);
    }
    return {
      htmlText: bodyHtml,
      requiresHydration: renderState.encounteredIslands.size > 0
    };
  }
  const asyncPlugins = opts.plugins.filter((p)=>p.renderAsync);
  let asyncRenderResponse;
  async function renderAsync() {
    const plugin = asyncPlugins.shift();
    if (plugin) {
      const res = await plugin.renderAsync({
        renderAsync
      });
      if (res === undefined) {
        throw new Error(`${plugin?.name}'s async render hook did not return a PluginRenderResult object.`);
      }
      renderResults.push([
        plugin,
        res
      ]);
      if (bodyHtml === null) {
        throw new Error(`The 'renderAsync' function was not called by ${plugin?.name}'s async render hook.`);
      }
      if (res.htmlText !== undefined) {
        bodyHtml = res.htmlText;
      }
    } else {
      await opts.renderFn(ctx, ()=>renderSync().htmlText);
      if (bodyHtml === null) {
        throw new Error(`The 'render' function was not called by the legacy async render hook.`);
      }
    }
    return {
      htmlText: bodyHtml,
      requiresHydration: renderState.encounteredIslands.size > 0
    };
  }
  await renderAsync();
  if (renderState.error !== null) {
    throw renderState.error;
  }
  const idx = renderState.headVNodes.findIndex((vnode)=>vnode !== null && typeof vnode === "object" && "type" in vnode && props !== null && vnode.type === "title");
  if (idx !== -1) {
    renderState.docTitle = renderState.headVNodes[idx];
    renderState.headVNodes.splice(idx, 1);
  }
  if (asyncRenderResponse !== undefined) {
    return asyncRenderResponse;
  }
  // Includes everything inside `<body>`
  bodyHtml = bodyHtml;
  // Create Fresh script + style tags
  const result = renderFreshTags(renderState, {
    bodyHtml,
    imports: opts.imports,
    csp,
    dependenciesFn: opts.dependenciesFn,
    styles: ctx.styles,
    pluginRenderResults: renderResults,
    basePath
  });
  // Append error overlay in dev mode
  if (opts.context.config.dev) {
    const devErrorUrl = withBase(DEV_ERROR_OVERLAY_URL, basePath);
    if (error !== undefined && url.pathname !== devErrorUrl) {
      const url = new URL(devErrorUrl, "https://localhost/");
      if (error instanceof Error) {
        let message = error.message;
        const idx = message.indexOf("\n");
        if (idx > -1) message = message.slice(0, idx);
        url.searchParams.append("message", message);
        if (error.stack) {
          const stack = colors.stripAnsiCode(error.stack);
          url.searchParams.append("stack", stack);
        }
      } else {
        url.searchParams.append("message", String(error));
      }
      if (opts.codeFrame) {
        const codeFrame = colors.stripAnsiCode(opts.codeFrame);
        url.searchParams.append("code-frame", codeFrame);
      }
      result.bodyHtml += `<iframe id="fresh-error-overlay" src="${url.pathname}?${url.searchParams.toString()}" style="unset: all; position: fixed; top: 0; left: 0; z-index: 99999; width: 100%; height: 100%; border: none;"></iframe>`;
    }
  }
  // Render outer document up to `<body>`
  const html = renderOuterDocument(renderState, {
    bodyHtml: result.bodyHtml,
    preloads: [
      ...result.preloadSet
    ],
    moduleScripts: result.moduleScripts,
    lang: ctx.lang
  });
  return [
    html,
    renderState.renderUuid,
    csp
  ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9yZW5kZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaCwgVk5vZGUgfSBmcm9tIFwicHJlYWN0XCI7XG5pbXBvcnQge1xuICBBcHBNb2R1bGUsXG4gIEFzeW5jTGF5b3V0LFxuICBBc3luY1JvdXRlLFxuICBFcnJvclBhZ2UsXG4gIEZyZXNoQ29udGV4dCxcbiAgTGF5b3V0Um91dGUsXG4gIFBhZ2VQcm9wcyxcbiAgUGx1Z2luLFxuICBQbHVnaW5SZW5kZXJGdW5jdGlvblJlc3VsdCxcbiAgUGx1Z2luUmVuZGVyUmVzdWx0LFxuICBSZW5kZXJGdW5jdGlvbixcbiAgUm91dGUsXG4gIFVua25vd25QYWdlLFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgTk9ORSwgVU5TQUZFX0lOTElORSB9IGZyb20gXCIuLi9ydW50aW1lL2NzcC50c1wiO1xuaW1wb3J0IHsgQ29udGVudFNlY3VyaXR5UG9saWN5IH0gZnJvbSBcIi4uL3J1bnRpbWUvY3NwLnRzXCI7XG5pbXBvcnQgeyBSZW5kZXJTdGF0ZSB9IGZyb20gXCIuL3JlbmRlcmluZy9zdGF0ZS50c1wiO1xuaW1wb3J0IHsgcmVuZGVySHRtbCwgcmVuZGVyT3V0ZXJEb2N1bWVudCB9IGZyb20gXCIuL3JlbmRlcmluZy90ZW1wbGF0ZS50c3hcIjtcbmltcG9ydCB7IHJlbmRlckZyZXNoVGFncyB9IGZyb20gXCIuL3JlbmRlcmluZy9mcmVzaF90YWdzLnRzeFwiO1xuaW1wb3J0IHsgREVWX0VSUk9SX09WRVJMQVlfVVJMIH0gZnJvbSBcIi4vY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyB3aXRoQmFzZSB9IGZyb20gXCIuL3JvdXRlci50c1wiO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9SRU5ERVJfRk46IFJlbmRlckZ1bmN0aW9uID0gKF9jdHgsIHJlbmRlcikgPT4ge1xuICByZW5kZXIoKTtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyT3B0aW9uczxEYXRhPiB7XG4gIHJlcXVlc3Q6IFJlcXVlc3Q7XG4gIGNvbnRleHQ6IEZyZXNoQ29udGV4dDtcbiAgcm91dGU6IFJvdXRlPERhdGE+IHwgVW5rbm93blBhZ2UgfCBFcnJvclBhZ2U7XG4gIHBsdWdpbnM6IFBsdWdpbltdO1xuICBhcHA6IEFwcE1vZHVsZTtcbiAgbGF5b3V0czogTGF5b3V0Um91dGVbXTtcbiAgaW1wb3J0czogc3RyaW5nW107XG4gIGRlcGVuZGVuY2llc0ZuOiAocGF0aDogc3RyaW5nKSA9PiBzdHJpbmdbXTtcbiAgcmVuZGVyRm46IFJlbmRlckZ1bmN0aW9uO1xuICBjb2RlRnJhbWU/OiBzdHJpbmc7XG4gIGxhbmc/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIElubmVyUmVuZGVyRnVuY3Rpb24gPSAoKSA9PiBzdHJpbmc7XG5cbmV4cG9ydCBjbGFzcyBSZW5kZXJDb250ZXh0IHtcbiAgI2lkOiBzdHJpbmc7XG4gICNzdGF0ZTogTWFwPHN0cmluZywgdW5rbm93bj4gPSBuZXcgTWFwKCk7XG4gICNzdHlsZXM6IHN0cmluZ1tdID0gW107XG4gICN1cmw6IFVSTDtcbiAgI3JvdXRlOiBzdHJpbmc7XG4gICNsYW5nOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoaWQ6IHN0cmluZywgdXJsOiBVUkwsIHJvdXRlOiBzdHJpbmcsIGxhbmc6IHN0cmluZykge1xuICAgIHRoaXMuI2lkID0gaWQ7XG4gICAgdGhpcy4jdXJsID0gdXJsO1xuICAgIHRoaXMuI3JvdXRlID0gcm91dGU7XG4gICAgdGhpcy4jbGFuZyA9IGxhbmc7XG4gIH1cblxuICAvKiogQSB1bmlxdWUgSUQgZm9yIHRoaXMgbG9naWNhbCBKSVQgcmVuZGVyLiAqL1xuICBnZXQgaWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jaWQ7XG4gIH1cblxuICAvKipcbiAgICogU3RhdGUgdGhhdCBpcyBwZXJzaXN0ZWQgYmV0d2VlbiBtdWx0aXBsZSByZW5kZXJzIHdpdGggdGhlIHNhbWUgcmVuZGVyXG4gICAqIGNvbnRleHQuIFRoaXMgaXMgdXNlZnVsIGJlY2F1c2Ugb25lIGxvZ2ljYWwgSklUIHJlbmRlciBjb3VsZCBoYXZlIG11bHRpcGxlXG4gICAqIHByZWFjdCByZW5kZXIgcGFzc2VzIGR1ZSB0byBzdXNwZW5zZS5cbiAgICovXG4gIGdldCBzdGF0ZSgpOiBNYXA8c3RyaW5nLCB1bmtub3duPiB7XG4gICAgcmV0dXJuIHRoaXMuI3N0YXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbCBvZiB0aGUgQ1NTIHN0eWxlIHJ1bGVzIHRoYXQgc2hvdWxkIGJlIGlubGluZWQgaW50byB0aGUgZG9jdW1lbnQuXG4gICAqIEFkZGluZyB0byB0aGlzIGxpc3QgYWNyb3NzIG11bHRpcGxlIHJlbmRlcnMgaXMgc3VwcG9ydGVkIChldmVuIGFjcm9zc1xuICAgKiBzdXNwZW5zZSEpLiBUaGUgQ1NTIHJ1bGVzIHdpbGwgYWx3YXlzIGJlIGluc2VydGVkIG9uIHRoZSBjbGllbnQgaW4gdGhlXG4gICAqIG9yZGVyIHNwZWNpZmllZCBoZXJlLlxuICAgKi9cbiAgZ2V0IHN0eWxlcygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMuI3N0eWxlcztcbiAgfVxuXG4gIC8qKiBUaGUgVVJMIG9mIHRoZSBwYWdlIGJlaW5nIHJlbmRlcmVkLiAqL1xuICBnZXQgdXJsKCk6IFVSTCB7XG4gICAgcmV0dXJuIHRoaXMuI3VybDtcbiAgfVxuXG4gIC8qKiBUaGUgcm91dGUgbWF0Y2hlciAoZS5nLiAvYmxvZy86aWQpIHRoYXQgdGhlIHJlcXVlc3QgbWF0Y2hlZCBmb3IgdGhpcyBwYWdlXG4gICAqIHRvIGJlIHJlbmRlcmVkLiAqL1xuICBnZXQgcm91dGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jcm91dGU7XG4gIH1cblxuICAvKiogVGhlIGxhbmd1YWdlIG9mIHRoZSBwYWdlIGJlaW5nIHJlbmRlcmVkLiBEZWZhdWx0cyB0byBcImVuXCIuICovXG4gIGdldCBsYW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2xhbmc7XG4gIH1cbiAgc2V0IGxhbmcobGFuZzogc3RyaW5nKSB7XG4gICAgdGhpcy4jbGFuZyA9IGxhbmc7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVmYXVsdENzcCgpIHtcbiAgcmV0dXJuIHtcbiAgICBkaXJlY3RpdmVzOiB7IGRlZmF1bHRTcmM6IFtOT05FXSwgc3R5bGVTcmM6IFtVTlNBRkVfSU5MSU5FXSB9LFxuICAgIHJlcG9ydE9ubHk6IGZhbHNlLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBc3luY0NvbXBvbmVudDxUPihcbiAgY29tcG9uZW50OiB1bmtub3duLFxuKTogY29tcG9uZW50IGlzIEFzeW5jUm91dGU8VD4gfCBBc3luY0xheW91dDxUPiB7XG4gIHJldHVybiB0eXBlb2YgY29tcG9uZW50ID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICBjb21wb25lbnQuY29uc3RydWN0b3IubmFtZSA9PT0gXCJBc3luY0Z1bmN0aW9uXCI7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZW5kZXJzIG91dCBhIHBhZ2UuIFJlbmRlcmluZyBpcyBzeW5jaHJvbm91cyBhbmQgbm9uIHN0cmVhbWluZy5cbiAqIFN1c3BlbnNlIGJvdW5kYXJpZXMgYXJlIG5vdCBzdXBwb3J0ZWQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXI8RGF0YT4oXG4gIG9wdHM6IFJlbmRlck9wdGlvbnM8RGF0YT4sXG4pOiBQcm9taXNlPFtzdHJpbmcsIHN0cmluZywgQ29udGVudFNlY3VyaXR5UG9saWN5IHwgdW5kZWZpbmVkXSB8IFJlc3BvbnNlPiB7XG4gIGNvbnN0IGNvbXBvbmVudCA9IG9wdHMucm91dGUuY29tcG9uZW50O1xuXG4gIC8vIE9ubHkgaW5oZXJpdCBsYXlvdXRzIHVwIHRvIHRoZSBuZWFyZXN0IHJvb3QgbGF5b3V0LlxuICAvLyBOb3RlIHRoYXQgdGhlIHJvdXRlIGl0c2VsZiBjYW4gYWN0IGFzIHRoZSByb290IGxheW91dC5cbiAgbGV0IGxheW91dHMgPSBvcHRzLmxheW91dHM7XG4gIGlmIChvcHRzLnJvdXRlLmluaGVyaXRMYXlvdXRzKSB7XG4gICAgbGV0IHJvb3RJZHggPSAwO1xuICAgIGxldCBsYXlvdXRJZHggPSBvcHRzLmxheW91dHMubGVuZ3RoO1xuICAgIHdoaWxlIChsYXlvdXRJZHgtLSkge1xuICAgICAgaWYgKCFvcHRzLmxheW91dHNbbGF5b3V0SWR4XS5pbmhlcml0TGF5b3V0cykge1xuICAgICAgICByb290SWR4ID0gbGF5b3V0SWR4O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgbGF5b3V0cyA9IG9wdHMubGF5b3V0cy5zbGljZShyb290SWR4KTtcbiAgfSBlbHNlIHtcbiAgICBsYXlvdXRzID0gW107XG4gIH1cblxuICBjb25zdCB7IHBhcmFtcywgZGF0YSwgc3RhdGUsIGVycm9yLCB1cmwsIGJhc2VQYXRoIH0gPSBvcHRzLmNvbnRleHQ7XG5cbiAgY29uc3QgcHJvcHM6IFBhZ2VQcm9wcyA9IHtcbiAgICBiYXNlUGF0aCxcbiAgICBjb25maWc6IG9wdHMuY29udGV4dC5jb25maWcsXG4gICAgZGVzdGluYXRpb246IG9wdHMuY29udGV4dC5kZXN0aW5hdGlvbixcbiAgICBpc1BhcnRpYWw6IG9wdHMuY29udGV4dC5pc1BhcnRpYWwsXG4gICAgcGFyYW1zLFxuICAgIGVycm9yLFxuICAgIGNvZGVGcmFtZTogb3B0cy5jb250ZXh0LmNvZGVGcmFtZSxcbiAgICByZW1vdGVBZGRyOiBvcHRzLmNvbnRleHQucmVtb3RlQWRkcixcbiAgICBsb2NhbEFkZHI6IG9wdHMuY29udGV4dC5sb2NhbEFkZHIsXG4gICAgQ29tcG9uZW50OiAoKSA9PiBudWxsLFxuICAgIHBhdHRlcm46IG9wdHMuY29udGV4dC5wYXR0ZXJuLFxuICAgIHVybCxcbiAgICByb3V0ZTogb3B0cy5jb250ZXh0LnJvdXRlLFxuICAgIGRhdGEsXG4gICAgc3RhdGUsXG4gIH07XG5cbiAgY29uc3QgY3NwOiBDb250ZW50U2VjdXJpdHlQb2xpY3kgfCB1bmRlZmluZWQgPSBvcHRzLnJvdXRlLmNzcFxuICAgID8gZGVmYXVsdENzcCgpXG4gICAgOiB1bmRlZmluZWQ7XG4gIGlmIChjc3ApIHtcbiAgICAvLyBDbGVhciB0aGUgY3NwXG4gICAgY29uc3QgbmV3Q3NwID0gZGVmYXVsdENzcCgpO1xuICAgIGNzcC5kaXJlY3RpdmVzID0gbmV3Q3NwLmRpcmVjdGl2ZXM7XG4gICAgY3NwLnJlcG9ydE9ubHkgPSBuZXdDc3AucmVwb3J0T25seTtcbiAgfVxuXG4gIGNvbnN0IGN0eCA9IG5ldyBSZW5kZXJDb250ZXh0KFxuICAgIGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgdXJsLFxuICAgIG9wdHMucm91dGUucGF0dGVybixcbiAgICBvcHRzLmxhbmcgPz8gXCJlblwiLFxuICApO1xuXG4gIGNvbnN0IGNvbnRleHQgPSBvcHRzLmNvbnRleHQ7XG5cbiAgLy8gUHJlcGFyZSByZW5kZXIgb3JkZXJcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3QgcmVuZGVyU3RhY2s6IGFueVtdID0gW107XG4gIC8vIENoZWNrIGlmIGFwcExheW91dCBpcyBlbmFibGVkXG4gIGlmIChcbiAgICBvcHRzLnJvdXRlLmFwcFdyYXBwZXIgJiZcbiAgICBsYXlvdXRzLmV2ZXJ5KChsYXlvdXQpID0+IGxheW91dC5hcHBXcmFwcGVyKVxuICApIHtcbiAgICByZW5kZXJTdGFjay5wdXNoKG9wdHMuYXBwLmRlZmF1bHQpO1xuICB9XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5b3V0cy5sZW5ndGg7IGkrKykge1xuICAgIHJlbmRlclN0YWNrLnB1c2gobGF5b3V0c1tpXS5jb21wb25lbnQpO1xuICB9XG4gIHJlbmRlclN0YWNrLnB1c2goY29tcG9uZW50KTtcblxuICAvLyBCdWlsZCB0aGUgZmluYWwgc3RhY2sgb2YgY29tcG9uZW50IGZ1bmN0aW9uc1xuICBjb25zdCBjb21wb25lbnRTdGFjayA9IG5ldyBBcnJheShyZW5kZXJTdGFjay5sZW5ndGgpLmZpbGwobnVsbCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcmVuZGVyU3RhY2subGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBmbiA9IHJlbmRlclN0YWNrW2ldO1xuICAgIGlmICghZm4pIGNvbnRpbnVlO1xuXG4gICAgaWYgKGNoZWNrQXN5bmNDb21wb25lbnQoZm4pKSB7XG4gICAgICAvLyBEb24ndCBwYXNzIDxDb21wb25lbnQgLz4gd2hlbiBpdCdzIHRoZSByb3V0ZSBjb21wb25lbnRcbiAgICAgIGNvbnN0IGlzUm91dGVDb21wb25lbnQgPSBmbiA9PT0gY29tcG9uZW50O1xuICAgICAgY29uc3QgY29tcG9uZW50Q3R4ID0gaXNSb3V0ZUNvbXBvbmVudCA/IGNvbnRleHQgOiB7XG4gICAgICAgIC4uLmNvbnRleHQsXG4gICAgICAgIENvbXBvbmVudCgpIHtcbiAgICAgICAgICByZXR1cm4gaChjb21wb25lbnRTdGFja1tpICsgMV0sIHByb3BzKTtcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZm4ob3B0cy5yZXF1ZXN0LCBjb21wb25lbnRDdHggYXMgYW55KTtcblxuICAgICAgLy8gQmFpbCBvdXQgb2YgcmVuZGVyaW5nIGlmIHdlIHJldHVybmVkIGEgcmVzcG9uc2VcbiAgICAgIGlmIChyZXMgaW5zdGFuY2VvZiBSZXNwb25zZSkge1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb21wb25lbnRGbiA9ICgpID0+IHJlcztcbiAgICAgIC8vIFNldCBkaXNwbGF5TmFtZSB0byBtYWtlIGRlYnVnZ2luZyBlYXNpZXJcbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICBjb21wb25lbnRGbi5kaXNwbGF5TmFtZSA9IChmbiBhcyBhbnkpLmRpc3BsYXlOYW1lIHx8IGZuLm5hbWU7XG4gICAgICBjb21wb25lbnRTdGFja1tpXSA9IGNvbXBvbmVudEZuO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb21wb25lbnRTdGFja1tpXSA9ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGgoZm4sIHtcbiAgICAgICAgICAuLi5wcm9wcyxcbiAgICAgICAgICBDb21wb25lbnQoKSB7XG4gICAgICAgICAgICByZXR1cm4gaChjb21wb25lbnRTdGFja1tpICsgMV0sIG51bGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgICAgfSBhcyBhbnkpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvLyBDQVJFRlVMOiBSZW5kZXJpbmcgaXMgc3luY2hyb25vdXMgaW50ZXJuYWxseSBhbmQgYWxsIHN0YXRlXG4gIC8vIHNob3VsZCBiZSBtYW5hZ2VkIHRocm91Z2ggdGhlIGBSZW5kZXJTdGF0ZWAgaW5zdGFuY2UuIFRoYXRcbiAgLy8gZW5zdXJlcyB0aGF0IGVhY2ggcmVuZGVyIHJlcXVlc3QgaXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBzYW1lXG4gIC8vIGRhdGEuXG4gIGNvbnN0IHJlbmRlclN0YXRlID0gbmV3IFJlbmRlclN0YXRlKFxuICAgIGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAge1xuICAgICAgdXJsLFxuICAgICAgcm91dGU6IG9wdHMucm91dGUucGF0dGVybixcbiAgICAgIGRhdGEsXG4gICAgICBzdGF0ZSxcbiAgICAgIHBhcmFtcyxcbiAgICAgIGJhc2VQYXRoLFxuICAgIH0sXG4gICAgY29tcG9uZW50U3RhY2ssXG4gICAgY3NwLFxuICAgIGVycm9yLFxuICApO1xuXG4gIGxldCBib2R5SHRtbDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3Qgc3luY1BsdWdpbnMgPSBvcHRzLnBsdWdpbnMuZmlsdGVyKChwKSA9PiBwLnJlbmRlcik7XG5cbiAgY29uc3QgcmVuZGVyUmVzdWx0czogW1BsdWdpbiwgUGx1Z2luUmVuZGVyUmVzdWx0XVtdID0gW107XG5cbiAgZnVuY3Rpb24gcmVuZGVyU3luYygpOiBQbHVnaW5SZW5kZXJGdW5jdGlvblJlc3VsdCB7XG4gICAgY29uc3QgcGx1Z2luID0gc3luY1BsdWdpbnMuc2hpZnQoKTtcbiAgICBpZiAocGx1Z2luKSB7XG4gICAgICBjb25zdCByZXMgPSBwbHVnaW4ucmVuZGVyISh7IHJlbmRlcjogcmVuZGVyU3luYyB9KTtcbiAgICAgIGlmIChyZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYCR7cGx1Z2luPy5uYW1lfSdzIHJlbmRlciBob29rIGRpZCBub3QgcmV0dXJuIGEgUGx1Z2luUmVuZGVyUmVzdWx0IG9iamVjdC5gLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmVuZGVyUmVzdWx0cy5wdXNoKFtwbHVnaW4sIHJlc10pO1xuXG4gICAgICBpZiAocmVzLmh0bWxUZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYm9keUh0bWwgPSByZXMuaHRtbFRleHQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGJvZHlIdG1sID0gcmVuZGVySHRtbChyZW5kZXJTdGF0ZSk7XG4gICAgfVxuICAgIGlmIChib2R5SHRtbCA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgVGhlICdyZW5kZXInIGZ1bmN0aW9uIHdhcyBub3QgY2FsbGVkIGJ5ICR7cGx1Z2luPy5uYW1lfSdzIHJlbmRlciBob29rLmAsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgaHRtbFRleHQ6IGJvZHlIdG1sLFxuICAgICAgcmVxdWlyZXNIeWRyYXRpb246IHJlbmRlclN0YXRlLmVuY291bnRlcmVkSXNsYW5kcy5zaXplID4gMCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgYXN5bmNQbHVnaW5zID0gb3B0cy5wbHVnaW5zLmZpbHRlcigocCkgPT4gcC5yZW5kZXJBc3luYyk7XG5cbiAgbGV0IGFzeW5jUmVuZGVyUmVzcG9uc2U6IFJlc3BvbnNlIHwgdW5kZWZpbmVkO1xuICBhc3luYyBmdW5jdGlvbiByZW5kZXJBc3luYygpOiBQcm9taXNlPFBsdWdpblJlbmRlckZ1bmN0aW9uUmVzdWx0PiB7XG4gICAgY29uc3QgcGx1Z2luID0gYXN5bmNQbHVnaW5zLnNoaWZ0KCk7XG4gICAgaWYgKHBsdWdpbikge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcGx1Z2luLnJlbmRlckFzeW5jISh7IHJlbmRlckFzeW5jIH0pO1xuICAgICAgaWYgKHJlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgJHtwbHVnaW4/Lm5hbWV9J3MgYXN5bmMgcmVuZGVyIGhvb2sgZGlkIG5vdCByZXR1cm4gYSBQbHVnaW5SZW5kZXJSZXN1bHQgb2JqZWN0LmAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZW5kZXJSZXN1bHRzLnB1c2goW3BsdWdpbiwgcmVzXSk7XG4gICAgICBpZiAoYm9keUh0bWwgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBUaGUgJ3JlbmRlckFzeW5jJyBmdW5jdGlvbiB3YXMgbm90IGNhbGxlZCBieSAke3BsdWdpbj8ubmFtZX0ncyBhc3luYyByZW5kZXIgaG9vay5gLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzLmh0bWxUZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYm9keUh0bWwgPSByZXMuaHRtbFRleHQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IG9wdHMucmVuZGVyRm4oY3R4LCAoKSA9PiByZW5kZXJTeW5jKCkuaHRtbFRleHQpO1xuXG4gICAgICBpZiAoYm9keUh0bWwgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBUaGUgJ3JlbmRlcicgZnVuY3Rpb24gd2FzIG5vdCBjYWxsZWQgYnkgdGhlIGxlZ2FjeSBhc3luYyByZW5kZXIgaG9vay5gLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgaHRtbFRleHQ6IGJvZHlIdG1sLFxuICAgICAgcmVxdWlyZXNIeWRyYXRpb246IHJlbmRlclN0YXRlLmVuY291bnRlcmVkSXNsYW5kcy5zaXplID4gMCxcbiAgICB9O1xuICB9XG5cbiAgYXdhaXQgcmVuZGVyQXN5bmMoKTtcbiAgaWYgKHJlbmRlclN0YXRlLmVycm9yICE9PSBudWxsKSB7XG4gICAgdGhyb3cgcmVuZGVyU3RhdGUuZXJyb3I7XG4gIH1cblxuICBjb25zdCBpZHggPSByZW5kZXJTdGF0ZS5oZWFkVk5vZGVzLmZpbmRJbmRleCgodm5vZGUpID0+XG4gICAgdm5vZGUgIT09IG51bGwgJiYgdHlwZW9mIHZub2RlID09PSBcIm9iamVjdFwiICYmIFwidHlwZVwiIGluIHZub2RlICYmXG4gICAgcHJvcHMgIT09IG51bGwgJiYgdm5vZGUudHlwZSA9PT0gXCJ0aXRsZVwiXG4gICk7XG4gIGlmIChpZHggIT09IC0xKSB7XG4gICAgcmVuZGVyU3RhdGUuZG9jVGl0bGUgPSByZW5kZXJTdGF0ZS5oZWFkVk5vZGVzW2lkeF0gYXMgVk5vZGU8XG4gICAgICB7IGNoaWxkcmVuOiBzdHJpbmcgfVxuICAgID47XG4gICAgcmVuZGVyU3RhdGUuaGVhZFZOb2Rlcy5zcGxpY2UoaWR4LCAxKTtcbiAgfVxuXG4gIGlmIChhc3luY1JlbmRlclJlc3BvbnNlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gYXN5bmNSZW5kZXJSZXNwb25zZTtcbiAgfVxuXG4gIC8vIEluY2x1ZGVzIGV2ZXJ5dGhpbmcgaW5zaWRlIGA8Ym9keT5gXG4gIGJvZHlIdG1sID0gYm9keUh0bWwgYXMgdW5rbm93biBhcyBzdHJpbmc7XG5cbiAgLy8gQ3JlYXRlIEZyZXNoIHNjcmlwdCArIHN0eWxlIHRhZ3NcbiAgY29uc3QgcmVzdWx0ID0gcmVuZGVyRnJlc2hUYWdzKHJlbmRlclN0YXRlLCB7XG4gICAgYm9keUh0bWwsXG4gICAgaW1wb3J0czogb3B0cy5pbXBvcnRzLFxuICAgIGNzcCxcbiAgICBkZXBlbmRlbmNpZXNGbjogb3B0cy5kZXBlbmRlbmNpZXNGbixcbiAgICBzdHlsZXM6IGN0eC5zdHlsZXMsXG4gICAgcGx1Z2luUmVuZGVyUmVzdWx0czogcmVuZGVyUmVzdWx0cyxcbiAgICBiYXNlUGF0aCxcbiAgfSk7XG5cbiAgLy8gQXBwZW5kIGVycm9yIG92ZXJsYXkgaW4gZGV2IG1vZGVcbiAgaWYgKG9wdHMuY29udGV4dC5jb25maWcuZGV2KSB7XG4gICAgY29uc3QgZGV2RXJyb3JVcmwgPSB3aXRoQmFzZShERVZfRVJST1JfT1ZFUkxBWV9VUkwsIGJhc2VQYXRoKTtcbiAgICBpZiAoZXJyb3IgIT09IHVuZGVmaW5lZCAmJiB1cmwucGF0aG5hbWUgIT09IGRldkVycm9yVXJsKSB7XG4gICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGRldkVycm9yVXJsLCBcImh0dHBzOi8vbG9jYWxob3N0L1wiKTtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIGxldCBtZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgY29uc3QgaWR4ID0gbWVzc2FnZS5pbmRleE9mKFwiXFxuXCIpO1xuICAgICAgICBpZiAoaWR4ID4gLTEpIG1lc3NhZ2UgPSBtZXNzYWdlLnNsaWNlKDAsIGlkeCk7XG4gICAgICAgIHVybC5zZWFyY2hQYXJhbXMuYXBwZW5kKFwibWVzc2FnZVwiLCBtZXNzYWdlKTtcbiAgICAgICAgaWYgKGVycm9yLnN0YWNrKSB7XG4gICAgICAgICAgY29uc3Qgc3RhY2sgPSBjb2xvcnMuc3RyaXBBbnNpQ29kZShlcnJvci5zdGFjayk7XG4gICAgICAgICAgdXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoXCJzdGFja1wiLCBzdGFjayk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybC5zZWFyY2hQYXJhbXMuYXBwZW5kKFwibWVzc2FnZVwiLCBTdHJpbmcoZXJyb3IpKTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRzLmNvZGVGcmFtZSkge1xuICAgICAgICBjb25zdCBjb2RlRnJhbWUgPSBjb2xvcnMuc3RyaXBBbnNpQ29kZShvcHRzLmNvZGVGcmFtZSk7XG4gICAgICAgIHVybC5zZWFyY2hQYXJhbXMuYXBwZW5kKFwiY29kZS1mcmFtZVwiLCBjb2RlRnJhbWUpO1xuICAgICAgfVxuXG4gICAgICByZXN1bHQuYm9keUh0bWwgKz1cbiAgICAgICAgYDxpZnJhbWUgaWQ9XCJmcmVzaC1lcnJvci1vdmVybGF5XCIgc3JjPVwiJHt1cmwucGF0aG5hbWV9PyR7dXJsLnNlYXJjaFBhcmFtcy50b1N0cmluZygpfVwiIHN0eWxlPVwidW5zZXQ6IGFsbDsgcG9zaXRpb246IGZpeGVkOyB0b3A6IDA7IGxlZnQ6IDA7IHotaW5kZXg6IDk5OTk5OyB3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBib3JkZXI6IG5vbmU7XCI+PC9pZnJhbWU+YDtcbiAgICB9XG4gIH1cblxuICAvLyBSZW5kZXIgb3V0ZXIgZG9jdW1lbnQgdXAgdG8gYDxib2R5PmBcbiAgY29uc3QgaHRtbCA9IHJlbmRlck91dGVyRG9jdW1lbnQocmVuZGVyU3RhdGUsIHtcbiAgICBib2R5SHRtbDogcmVzdWx0LmJvZHlIdG1sLFxuICAgIHByZWxvYWRzOiBbLi4ucmVzdWx0LnByZWxvYWRTZXRdLFxuICAgIG1vZHVsZVNjcmlwdHM6IHJlc3VsdC5tb2R1bGVTY3JpcHRzLFxuICAgIGxhbmc6IGN0eC5sYW5nLFxuICB9KTtcbiAgcmV0dXJuIFtodG1sLCByZW5kZXJTdGF0ZS5yZW5kZXJVdWlkLCBjc3BdO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsQ0FBQyxRQUFlLFNBQVM7QUFnQmxDLFNBQVMsSUFBSSxFQUFFLGFBQWEsUUFBUSxvQkFB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
// denoCacheMetadata=18421367104954100703,4266036183156176894