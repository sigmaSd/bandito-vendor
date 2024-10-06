import { PARTIAL_SEARCH_PARAM } from "../constants.ts";
export const knownMethods = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "DELETE",
  "OPTIONS",
  "PATCH"
];
export function defaultOtherHandler(_req) {
  return new Response(null, {
    status: 404
  });
}
export function defaultErrorHandler(_req, ctx) {
  console.error(ctx.error);
  return new Response(null, {
    status: 500
  });
}
export function defaultUnknownMethodHandler(_req, _ctx, knownMethods) {
  return new Response(null, {
    status: 405,
    headers: {
      Accept: knownMethods.join(", ")
    }
  });
}
export const IS_PATTERN = /[*:{}+?()]/;
function processRoutes(processedRoutes, routes, destination) {
  for (const [path, def] of Object.entries(routes)){
    const pattern = destination === "static" || !IS_PATTERN.test(path) ? path : new URLPattern({
      pathname: path
    });
    const entry = {
      baseRoute: def.baseRoute,
      pattern,
      originalPattern: path,
      methods: {},
      default: undefined,
      destination
    };
    for (const [method, handler] of Object.entries(def.methods)){
      if (method === "default") {
        entry.default = handler;
      } else if (knownMethods.includes(method)) {
        entry.methods[method] = handler;
      }
    }
    processedRoutes.push(entry);
  }
}
export function getParamsAndRoute({ internalRoutes, staticRoutes, routes }) {
  const processedRoutes = [];
  processRoutes(processedRoutes, internalRoutes, "internal");
  processRoutes(processedRoutes, staticRoutes, "static");
  processRoutes(processedRoutes, routes, "route");
  const statics = new Map();
  return (url)=>{
    const isPartial = url.searchParams.has(PARTIAL_SEARCH_PARAM);
    const pathname = url.pathname;
    const cached = statics.get(pathname);
    if (cached !== undefined) {
      cached.isPartial = isPartial;
      return cached;
    }
    for(let i = 0; i < processedRoutes.length; i++){
      const route = processedRoutes[i];
      if (route === null) continue;
      // Static routes where the full pattern contains no dynamic
      // parts and must be an exact match. We use that for static
      // files.
      if (typeof route.pattern === "string") {
        if (route.pattern === pathname) {
          processedRoutes[i] = null;
          const res = {
            route: route,
            params: {},
            isPartial
          };
          statics.set(route.pattern, res);
          return res;
        }
        continue;
      }
      const res = route.pattern.exec(url);
      if (res !== null) {
        return {
          route: route,
          params: res.pathname.groups,
          isPartial
        };
      }
    }
    return {
      route: undefined,
      params: {},
      isPartial
    };
  };
}
export function router({ otherHandler, unknownMethodHandler }) {
  unknownMethodHandler ??= defaultUnknownMethodHandler;
  return (req, ctx, route)=>{
    if (route) {
      // If not overridden, HEAD requests should be handled as GET requests but without the body.
      if (req.method === "HEAD" && !route.methods["HEAD"]) {
        req = new Request(req.url, {
          method: "GET",
          headers: req.headers
        });
      }
      for (const [method, handler] of Object.entries(route.methods)){
        if (req.method === method) {
          return {
            destination: route.destination,
            handler: ()=>handler(req, ctx)
          };
        }
      }
      if (route.default) {
        return {
          destination: route.destination,
          handler: ()=>route.default(req, ctx)
        };
      } else {
        return {
          destination: route.destination,
          handler: ()=>unknownMethodHandler(req, ctx, Object.keys(route.methods))
        };
      }
    }
    return {
      destination: "notFound",
      handler: ()=>otherHandler(req, ctx)
    };
  };
}
export function withBase(src, base) {
  if (base !== undefined && src.startsWith("/") && !src.startsWith(base)) {
    return base + src;
  }
  return src;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9yb3V0ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUEFSVElBTF9TRUFSQ0hfUEFSQU0gfSBmcm9tIFwiLi4vY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyBCYXNlUm91dGUsIEZyZXNoQ29udGV4dCB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbmV4cG9ydCB0eXBlIEhhbmRsZXI8VCA9IFJlY29yZDxzdHJpbmcsIHVua25vd24+PiA9IChcbiAgcmVxOiBSZXF1ZXN0LFxuICBjdHg6IEZyZXNoQ29udGV4dDxUPixcbikgPT4gUmVzcG9uc2UgfCBQcm9taXNlPFJlc3BvbnNlPjtcblxuZXhwb3J0IHR5cGUgRmluYWxIYW5kbGVyID0gKFxuICByZXE6IFJlcXVlc3QsXG4gIGN0eDogRnJlc2hDb250ZXh0LFxuICByb3V0ZT86IEludGVybmFsUm91dGUsXG4pID0+IHtcbiAgZGVzdGluYXRpb246IERlc3RpbmF0aW9uS2luZDtcbiAgaGFuZGxlcjogKCkgPT4gUmVzcG9uc2UgfCBQcm9taXNlPFJlc3BvbnNlPjtcbn07XG5cbmV4cG9ydCB0eXBlIEVycm9ySGFuZGxlcjxUID0gUmVjb3JkPHN0cmluZywgdW5rbm93bj4+ID0gKFxuICByZXE6IFJlcXVlc3QsXG4gIGN0eDogRnJlc2hDb250ZXh0PFQ+LFxuICBlcnI6IHVua25vd24sXG4pID0+IFJlc3BvbnNlIHwgUHJvbWlzZTxSZXNwb25zZT47XG5cbnR5cGUgVW5rbm93bk1ldGhvZEhhbmRsZXIgPSAoXG4gIHJlcTogUmVxdWVzdCxcbiAgY3R4OiBGcmVzaENvbnRleHQsXG4gIGtub3duTWV0aG9kczogS25vd25NZXRob2RbXSxcbikgPT4gUmVzcG9uc2UgfCBQcm9taXNlPFJlc3BvbnNlPjtcblxuZXhwb3J0IHR5cGUgTWF0Y2hIYW5kbGVyID0gKFxuICByZXE6IFJlcXVlc3QsXG4gIGN0eDogRnJlc2hDb250ZXh0LFxuKSA9PiBSZXNwb25zZSB8IFByb21pc2U8UmVzcG9uc2U+O1xuXG5leHBvcnQgaW50ZXJmYWNlIFJvdXRlcyB7XG4gIFtrZXk6IHN0cmluZ106IHtcbiAgICBiYXNlUm91dGU6IEJhc2VSb3V0ZTtcbiAgICBtZXRob2RzOiB7XG4gICAgICBbSyBpbiBLbm93bk1ldGhvZCB8IFwiZGVmYXVsdFwiXT86IE1hdGNoSGFuZGxlcjtcbiAgICB9O1xuICB9O1xufVxuXG5leHBvcnQgdHlwZSBEZXN0aW5hdGlvbktpbmQgPSBcImludGVybmFsXCIgfCBcInN0YXRpY1wiIHwgXCJyb3V0ZVwiIHwgXCJub3RGb3VuZFwiO1xuXG5leHBvcnQgdHlwZSBJbnRlcm5hbFJvdXRlID0ge1xuICBiYXNlUm91dGU6IEJhc2VSb3V0ZTtcbiAgb3JpZ2luYWxQYXR0ZXJuOiBzdHJpbmc7XG4gIHBhdHRlcm46IFVSTFBhdHRlcm4gfCBzdHJpbmc7XG4gIG1ldGhvZHM6IHsgW0sgaW4gS25vd25NZXRob2RdPzogTWF0Y2hIYW5kbGVyIH07XG4gIGRlZmF1bHQ/OiBNYXRjaEhhbmRsZXI7XG4gIGRlc3RpbmF0aW9uOiBEZXN0aW5hdGlvbktpbmQ7XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIFJvdXRlck9wdGlvbnMge1xuICBpbnRlcm5hbFJvdXRlczogUm91dGVzO1xuICBzdGF0aWNSb3V0ZXM6IFJvdXRlcztcbiAgcm91dGVzOiBSb3V0ZXM7XG4gIG90aGVySGFuZGxlcjogSGFuZGxlcjtcbiAgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXI7XG4gIHVua25vd25NZXRob2RIYW5kbGVyPzogVW5rbm93bk1ldGhvZEhhbmRsZXI7XG59XG5cbmV4cG9ydCB0eXBlIEtub3duTWV0aG9kID0gdHlwZW9mIGtub3duTWV0aG9kc1tudW1iZXJdO1xuXG5leHBvcnQgY29uc3Qga25vd25NZXRob2RzID0gW1xuICBcIkdFVFwiLFxuICBcIkhFQURcIixcbiAgXCJQT1NUXCIsXG4gIFwiUFVUXCIsXG4gIFwiREVMRVRFXCIsXG4gIFwiT1BUSU9OU1wiLFxuICBcIlBBVENIXCIsXG5dIGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdE90aGVySGFuZGxlcihfcmVxOiBSZXF1ZXN0KTogUmVzcG9uc2Uge1xuICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtcbiAgICBzdGF0dXM6IDQwNCxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0RXJyb3JIYW5kbGVyKFxuICBfcmVxOiBSZXF1ZXN0LFxuICBjdHg6IEZyZXNoQ29udGV4dCxcbik6IFJlc3BvbnNlIHtcbiAgY29uc29sZS5lcnJvcihjdHguZXJyb3IpO1xuXG4gIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwge1xuICAgIHN0YXR1czogNTAwLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmF1bHRVbmtub3duTWV0aG9kSGFuZGxlcihcbiAgX3JlcTogUmVxdWVzdCxcbiAgX2N0eDogRnJlc2hDb250ZXh0LFxuICBrbm93bk1ldGhvZHM6IEtub3duTWV0aG9kW10sXG4pOiBSZXNwb25zZSB7XG4gIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwge1xuICAgIHN0YXR1czogNDA1LFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIEFjY2VwdDoga25vd25NZXRob2RzLmpvaW4oXCIsIFwiKSxcbiAgICB9LFxuICB9KTtcbn1cblxuZXhwb3J0IGNvbnN0IElTX1BBVFRFUk4gPSAvWyo6e30rPygpXS87XG5cbmZ1bmN0aW9uIHByb2Nlc3NSb3V0ZXMoXG4gIHByb2Nlc3NlZFJvdXRlczogQXJyYXk8SW50ZXJuYWxSb3V0ZSB8IG51bGw+LFxuICByb3V0ZXM6IFJvdXRlcyxcbiAgZGVzdGluYXRpb246IERlc3RpbmF0aW9uS2luZCxcbikge1xuICBmb3IgKGNvbnN0IFtwYXRoLCBkZWZdIG9mIE9iamVjdC5lbnRyaWVzKHJvdXRlcykpIHtcbiAgICBjb25zdCBwYXR0ZXJuID0gZGVzdGluYXRpb24gPT09IFwic3RhdGljXCIgfHwgIUlTX1BBVFRFUk4udGVzdChwYXRoKVxuICAgICAgPyBwYXRoXG4gICAgICA6IG5ldyBVUkxQYXR0ZXJuKHsgcGF0aG5hbWU6IHBhdGggfSk7XG5cbiAgICBjb25zdCBlbnRyeTogSW50ZXJuYWxSb3V0ZSA9IHtcbiAgICAgIGJhc2VSb3V0ZTogZGVmLmJhc2VSb3V0ZSxcbiAgICAgIHBhdHRlcm4sXG4gICAgICBvcmlnaW5hbFBhdHRlcm46IHBhdGgsXG4gICAgICBtZXRob2RzOiB7fSxcbiAgICAgIGRlZmF1bHQ6IHVuZGVmaW5lZCxcbiAgICAgIGRlc3RpbmF0aW9uLFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IFttZXRob2QsIGhhbmRsZXJdIG9mIE9iamVjdC5lbnRyaWVzKGRlZi5tZXRob2RzKSkge1xuICAgICAgaWYgKG1ldGhvZCA9PT0gXCJkZWZhdWx0XCIpIHtcbiAgICAgICAgZW50cnkuZGVmYXVsdCA9IGhhbmRsZXI7XG4gICAgICB9IGVsc2UgaWYgKGtub3duTWV0aG9kcy5pbmNsdWRlcyhtZXRob2QgYXMgS25vd25NZXRob2QpKSB7XG4gICAgICAgIGVudHJ5Lm1ldGhvZHNbbWV0aG9kIGFzIEtub3duTWV0aG9kXSA9IGhhbmRsZXI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvY2Vzc2VkUm91dGVzLnB1c2goZW50cnkpO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGVSZXN1bHQge1xuICByb3V0ZTogSW50ZXJuYWxSb3V0ZSB8IHVuZGVmaW5lZDtcbiAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBpc1BhcnRpYWw6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJhbXNBbmRSb3V0ZShcbiAge1xuICAgIGludGVybmFsUm91dGVzLFxuICAgIHN0YXRpY1JvdXRlcyxcbiAgICByb3V0ZXMsXG4gIH06IFJvdXRlck9wdGlvbnMsXG4pOiAoXG4gIHVybDogVVJMLFxuKSA9PiBSb3V0ZVJlc3VsdCB7XG4gIGNvbnN0IHByb2Nlc3NlZFJvdXRlczogQXJyYXk8SW50ZXJuYWxSb3V0ZSB8IG51bGw+ID0gW107XG4gIHByb2Nlc3NSb3V0ZXMocHJvY2Vzc2VkUm91dGVzLCBpbnRlcm5hbFJvdXRlcywgXCJpbnRlcm5hbFwiKTtcbiAgcHJvY2Vzc1JvdXRlcyhwcm9jZXNzZWRSb3V0ZXMsIHN0YXRpY1JvdXRlcywgXCJzdGF0aWNcIik7XG4gIHByb2Nlc3NSb3V0ZXMocHJvY2Vzc2VkUm91dGVzLCByb3V0ZXMsIFwicm91dGVcIik7XG5cbiAgY29uc3Qgc3RhdGljcyA9IG5ldyBNYXA8c3RyaW5nLCBSb3V0ZVJlc3VsdD4oKTtcblxuICByZXR1cm4gKHVybDogVVJMKSA9PiB7XG4gICAgY29uc3QgaXNQYXJ0aWFsID0gdXJsLnNlYXJjaFBhcmFtcy5oYXMoUEFSVElBTF9TRUFSQ0hfUEFSQU0pO1xuICAgIGNvbnN0IHBhdGhuYW1lID0gdXJsLnBhdGhuYW1lO1xuXG4gICAgY29uc3QgY2FjaGVkID0gc3RhdGljcy5nZXQocGF0aG5hbWUpO1xuICAgIGlmIChjYWNoZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY2FjaGVkLmlzUGFydGlhbCA9IGlzUGFydGlhbDtcbiAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9jZXNzZWRSb3V0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJvdXRlID0gcHJvY2Vzc2VkUm91dGVzW2ldO1xuICAgICAgaWYgKHJvdXRlID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgLy8gU3RhdGljIHJvdXRlcyB3aGVyZSB0aGUgZnVsbCBwYXR0ZXJuIGNvbnRhaW5zIG5vIGR5bmFtaWNcbiAgICAgIC8vIHBhcnRzIGFuZCBtdXN0IGJlIGFuIGV4YWN0IG1hdGNoLiBXZSB1c2UgdGhhdCBmb3Igc3RhdGljXG4gICAgICAvLyBmaWxlcy5cbiAgICAgIGlmICh0eXBlb2Ygcm91dGUucGF0dGVybiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBpZiAocm91dGUucGF0dGVybiA9PT0gcGF0aG5hbWUpIHtcbiAgICAgICAgICBwcm9jZXNzZWRSb3V0ZXNbaV0gPSBudWxsO1xuICAgICAgICAgIGNvbnN0IHJlcyA9IHsgcm91dGU6IHJvdXRlLCBwYXJhbXM6IHt9LCBpc1BhcnRpYWwgfTtcbiAgICAgICAgICBzdGF0aWNzLnNldChyb3V0ZS5wYXR0ZXJuLCByZXMpO1xuICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzID0gcm91dGUucGF0dGVybi5leGVjKHVybCk7XG5cbiAgICAgIGlmIChyZXMgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByb3V0ZTogcm91dGUsXG4gICAgICAgICAgcGFyYW1zOiByZXMucGF0aG5hbWUuZ3JvdXBzLFxuICAgICAgICAgIGlzUGFydGlhbCxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHJvdXRlOiB1bmRlZmluZWQsXG4gICAgICBwYXJhbXM6IHt9LFxuICAgICAgaXNQYXJ0aWFsLFxuICAgIH07XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZXIoXG4gIHtcbiAgICBvdGhlckhhbmRsZXIsXG4gICAgdW5rbm93bk1ldGhvZEhhbmRsZXIsXG4gIH06IFJvdXRlck9wdGlvbnMsXG4pOiBGaW5hbEhhbmRsZXIge1xuICB1bmtub3duTWV0aG9kSGFuZGxlciA/Pz0gZGVmYXVsdFVua25vd25NZXRob2RIYW5kbGVyO1xuXG4gIHJldHVybiAocmVxLCBjdHgsIHJvdXRlKSA9PiB7XG4gICAgaWYgKHJvdXRlKSB7XG4gICAgICAvLyBJZiBub3Qgb3ZlcnJpZGRlbiwgSEVBRCByZXF1ZXN0cyBzaG91bGQgYmUgaGFuZGxlZCBhcyBHRVQgcmVxdWVzdHMgYnV0IHdpdGhvdXQgdGhlIGJvZHkuXG4gICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJIRUFEXCIgJiYgIXJvdXRlLm1ldGhvZHNbXCJIRUFEXCJdKSB7XG4gICAgICAgIHJlcSA9IG5ldyBSZXF1ZXN0KHJlcS51cmwsIHsgbWV0aG9kOiBcIkdFVFwiLCBoZWFkZXJzOiByZXEuaGVhZGVycyB9KTtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBbbWV0aG9kLCBoYW5kbGVyXSBvZiBPYmplY3QuZW50cmllcyhyb3V0ZS5tZXRob2RzKSkge1xuICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gbWV0aG9kKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uOiByb3V0ZS5kZXN0aW5hdGlvbixcbiAgICAgICAgICAgIGhhbmRsZXI6ICgpID0+IGhhbmRsZXIocmVxLCBjdHgpLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHJvdXRlLmRlZmF1bHQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcm91dGUuZGVzdGluYXRpb24sXG4gICAgICAgICAgaGFuZGxlcjogKCkgPT4gcm91dGUuZGVmYXVsdCEocmVxLCBjdHgpLFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcm91dGUuZGVzdGluYXRpb24sXG4gICAgICAgICAgaGFuZGxlcjogKCkgPT5cbiAgICAgICAgICAgIHVua25vd25NZXRob2RIYW5kbGVyIShcbiAgICAgICAgICAgICAgcmVxLFxuICAgICAgICAgICAgICBjdHgsXG4gICAgICAgICAgICAgIE9iamVjdC5rZXlzKHJvdXRlLm1ldGhvZHMpIGFzIEtub3duTWV0aG9kW10sXG4gICAgICAgICAgICApLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBkZXN0aW5hdGlvbjogXCJub3RGb3VuZFwiLFxuICAgICAgaGFuZGxlcjogKCkgPT4gb3RoZXJIYW5kbGVyIShyZXEsIGN0eCksXG4gICAgfTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdpdGhCYXNlKHNyYzogc3RyaW5nLCBiYXNlPzogc3RyaW5nKSB7XG4gIGlmIChiYXNlICE9PSB1bmRlZmluZWQgJiYgc3JjLnN0YXJ0c1dpdGgoXCIvXCIpICYmICFzcmMuc3RhcnRzV2l0aChiYXNlKSkge1xuICAgIHJldHVybiBiYXNlICsgc3JjO1xuICB9XG4gIHJldHVybiBzcmM7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxvQkFBb0IsUUFBUSxrQkFBa0I7QUFpRXZELE9BQU8sTUFBTSxlQUFlO0VBQzFCO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0NBQ0QsQ0FBVTtBQUVYLE9BQU8sU0FBUyxvQkFBb0IsSUFBYTtFQUMvQyxPQUFPLElBQUksU0FBUyxNQUFNO0lBQ3hCLFFBQVE7RUFDVjtBQUNGO0FBRUEsT0FBTyxTQUFTLG9CQUNkLElBQWEsRUFDYixHQUFpQjtFQUVqQixRQUFRLEtBQUssQ0FBQyxJQUFJLEtBQUs7RUFFdkIsT0FBTyxJQUFJLFNBQVMsTUFBTTtJQUN4QixRQUFRO0VBQ1Y7QUFDRjtBQUVBLE9BQU8sU0FBUyw0QkFDZCxJQUFhLEVBQ2IsSUFBa0IsRUFDbEIsWUFBMkI7RUFFM0IsT0FBTyxJQUFJLFNBQVMsTUFBTTtJQUN4QixRQUFRO0lBQ1IsU0FBUztNQUNQLFFBQVEsYUFBYSxJQUFJLENBQUM7SUFDNUI7RUFDRjtBQUNGO0FBRUEsT0FBTyxNQUFNLGFBQWEsYUFBYTtBQUV2QyxTQUFTLGNBQ1AsZUFBNEMsRUFDNUMsTUFBYyxFQUNkLFdBQTRCO0VBRTVCLEtBQUssTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLE9BQU8sT0FBTyxDQUFDLFFBQVM7SUFDaEQsTUFBTSxVQUFVLGdCQUFnQixZQUFZLENBQUMsV0FBVyxJQUFJLENBQUMsUUFDekQsT0FDQSxJQUFJLFdBQVc7TUFBRSxVQUFVO0lBQUs7SUFFcEMsTUFBTSxRQUF1QjtNQUMzQixX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
// denoCacheMetadata=10614100408355656646,7929028619505300643