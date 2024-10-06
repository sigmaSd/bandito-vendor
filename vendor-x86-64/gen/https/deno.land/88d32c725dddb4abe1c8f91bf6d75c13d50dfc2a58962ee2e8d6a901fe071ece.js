import { SEPARATOR } from "./deps.ts";
import { withBase } from "./router.ts";
export const ROOT_BASE_ROUTE = toBaseRoute("/");
export function toBaseRoute(input) {
  input = input.replaceAll(SEPARATOR, "/");
  if (input.endsWith("_layout")) {
    input = input.slice(0, -"_layout".length);
  } else if (input.endsWith("_middleware")) {
    input = input.slice(0, -"_middleware".length);
  } else if (input.endsWith("index")) {
    input = input.slice(0, -"index".length);
  }
  if (input.endsWith("/")) {
    input = input.slice(0, -1);
  }
  const suffix = !input.startsWith("/") ? "/" : "";
  return suffix + input;
}
export function selectSharedRoutes(curBaseRoute, items) {
  const selected = [];
  for (const item of items){
    const { baseRoute } = item;
    const res = curBaseRoute === baseRoute || curBaseRoute.startsWith(baseRoute.length > 1 ? baseRoute + "/" : baseRoute);
    if (res) {
      selected.push(item);
    }
  }
  return selected;
}
/**
 * Identify which middlewares should be applied for a request,
 * chain them and return a handler response
 */ export function composeMiddlewares(middlewares, errorHandler, paramsAndRoute, renderNotFound, basePath) {
  return (req, ctx, inner)=>{
    const handlers = [];
    const paramsAndRouteResult = paramsAndRoute(ctx.url);
    ctx.params = paramsAndRouteResult.params;
    // identify middlewares to apply, if any.
    // middlewares should be already sorted from deepest to shallow layer
    const mws = selectSharedRoutes(paramsAndRouteResult.route?.baseRoute ?? toBaseRoute(withBase(ROOT_BASE_ROUTE, basePath)), middlewares);
    if (paramsAndRouteResult.route) {
      ctx.route = paramsAndRouteResult.route.originalPattern;
    }
    ctx.next = ()=>{
      const handler = handlers.shift();
      try {
        // As the `handler` can be either sync or async, depending on the user's code,
        // the current shape of our wrapper, that is `() => handler(req, middlewareCtx)`,
        // doesn't guarantee that all possible errors will be captured.
        // `Promise.resolve` accept the value that should be returned to the promise
        // chain, however, if that value is produced by the external function call,
        // the possible `Error`, will *not* be caught by any `.catch()` attached to that chain.
        // Because of that, we need to make sure that the produced value is pushed
        // through the pipeline only if function was called successfully, and handle
        // the error case manually, by returning the `Error` as rejected promise.
        return Promise.resolve(handler());
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          return renderNotFound(req, ctx);
        }
        return Promise.reject(e);
      }
    };
    for (const { module } of mws){
      if (module.handler instanceof Array) {
        for (const handler of module.handler){
          handlers.push(()=>handler(req, ctx));
        }
      } else {
        const handler = module.handler;
        handlers.push(()=>handler(req, ctx));
      }
    }
    const { destination, handler } = inner(req, ctx, paramsAndRouteResult.route);
    handlers.push(handler);
    ctx.destination = destination;
    return ctx.next().catch((e)=>errorHandler(req, ctx, e));
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9jb21wb3NlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNFUEFSQVRPUiB9IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IEVycm9ySGFuZGxlciwgRmluYWxIYW5kbGVyLCBSb3V0ZVJlc3VsdCwgd2l0aEJhc2UgfSBmcm9tIFwiLi9yb3V0ZXIudHNcIjtcbmltcG9ydCB7XG4gIEJhc2VSb3V0ZSxcbiAgRnJlc2hDb250ZXh0LFxuICBNaWRkbGV3YXJlUm91dGUsXG4gIFVua25vd25SZW5kZXJGdW5jdGlvbixcbn0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxuZXhwb3J0IGNvbnN0IFJPT1RfQkFTRV9ST1VURSA9IHRvQmFzZVJvdXRlKFwiL1wiKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRvQmFzZVJvdXRlKGlucHV0OiBzdHJpbmcpOiBCYXNlUm91dGUge1xuICBpbnB1dCA9IGlucHV0LnJlcGxhY2VBbGwoU0VQQVJBVE9SLCBcIi9cIik7XG5cbiAgaWYgKGlucHV0LmVuZHNXaXRoKFwiX2xheW91dFwiKSkge1xuICAgIGlucHV0ID0gaW5wdXQuc2xpY2UoMCwgLVwiX2xheW91dFwiLmxlbmd0aCk7XG4gIH0gZWxzZSBpZiAoaW5wdXQuZW5kc1dpdGgoXCJfbWlkZGxld2FyZVwiKSkge1xuICAgIGlucHV0ID0gaW5wdXQuc2xpY2UoMCwgLVwiX21pZGRsZXdhcmVcIi5sZW5ndGgpO1xuICB9IGVsc2UgaWYgKGlucHV0LmVuZHNXaXRoKFwiaW5kZXhcIikpIHtcbiAgICBpbnB1dCA9IGlucHV0LnNsaWNlKDAsIC1cImluZGV4XCIubGVuZ3RoKTtcbiAgfVxuXG4gIGlmIChpbnB1dC5lbmRzV2l0aChcIi9cIikpIHtcbiAgICBpbnB1dCA9IGlucHV0LnNsaWNlKDAsIC0xKTtcbiAgfVxuXG4gIGNvbnN0IHN1ZmZpeCA9ICFpbnB1dC5zdGFydHNXaXRoKFwiL1wiKSA/IFwiL1wiIDogXCJcIjtcbiAgcmV0dXJuIChzdWZmaXggKyBpbnB1dCkgYXMgQmFzZVJvdXRlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0U2hhcmVkUm91dGVzPFQgZXh0ZW5kcyB7IGJhc2VSb3V0ZTogQmFzZVJvdXRlIH0+KFxuICBjdXJCYXNlUm91dGU6IEJhc2VSb3V0ZSxcbiAgaXRlbXM6IFRbXSxcbik6IFRbXSB7XG4gIGNvbnN0IHNlbGVjdGVkOiBUW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICBjb25zdCB7IGJhc2VSb3V0ZSB9ID0gaXRlbTtcbiAgICBjb25zdCByZXMgPSBjdXJCYXNlUm91dGUgPT09IGJhc2VSb3V0ZSB8fFxuICAgICAgY3VyQmFzZVJvdXRlLnN0YXJ0c1dpdGgoXG4gICAgICAgIGJhc2VSb3V0ZS5sZW5ndGggPiAxID8gYmFzZVJvdXRlICsgXCIvXCIgOiBiYXNlUm91dGUsXG4gICAgICApO1xuICAgIGlmIChyZXMpIHtcbiAgICAgIHNlbGVjdGVkLnB1c2goaXRlbSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG4vKipcbiAqIElkZW50aWZ5IHdoaWNoIG1pZGRsZXdhcmVzIHNob3VsZCBiZSBhcHBsaWVkIGZvciBhIHJlcXVlc3QsXG4gKiBjaGFpbiB0aGVtIGFuZCByZXR1cm4gYSBoYW5kbGVyIHJlc3BvbnNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb3NlTWlkZGxld2FyZXMoXG4gIG1pZGRsZXdhcmVzOiBNaWRkbGV3YXJlUm91dGVbXSxcbiAgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXIsXG4gIHBhcmFtc0FuZFJvdXRlOiAoXG4gICAgdXJsOiBVUkwsXG4gICkgPT4gUm91dGVSZXN1bHQsXG4gIHJlbmRlck5vdEZvdW5kOiBVbmtub3duUmVuZGVyRnVuY3Rpb24sXG4gIGJhc2VQYXRoOiBzdHJpbmcsXG4pIHtcbiAgcmV0dXJuIChcbiAgICByZXE6IFJlcXVlc3QsXG4gICAgY3R4OiBGcmVzaENvbnRleHQsXG4gICAgaW5uZXI6IEZpbmFsSGFuZGxlcixcbiAgKSA9PiB7XG4gICAgY29uc3QgaGFuZGxlcnM6ICgoKSA9PiBSZXNwb25zZSB8IFByb21pc2U8UmVzcG9uc2U+KVtdID0gW107XG4gICAgY29uc3QgcGFyYW1zQW5kUm91dGVSZXN1bHQgPSBwYXJhbXNBbmRSb3V0ZShjdHgudXJsKTtcbiAgICBjdHgucGFyYW1zID0gcGFyYW1zQW5kUm91dGVSZXN1bHQucGFyYW1zO1xuXG4gICAgLy8gaWRlbnRpZnkgbWlkZGxld2FyZXMgdG8gYXBwbHksIGlmIGFueS5cbiAgICAvLyBtaWRkbGV3YXJlcyBzaG91bGQgYmUgYWxyZWFkeSBzb3J0ZWQgZnJvbSBkZWVwZXN0IHRvIHNoYWxsb3cgbGF5ZXJcbiAgICBjb25zdCBtd3MgPSBzZWxlY3RTaGFyZWRSb3V0ZXMoXG4gICAgICBwYXJhbXNBbmRSb3V0ZVJlc3VsdC5yb3V0ZT8uYmFzZVJvdXRlID8/XG4gICAgICAgIHRvQmFzZVJvdXRlKHdpdGhCYXNlKFJPT1RfQkFTRV9ST1VURSwgYmFzZVBhdGgpKSxcbiAgICAgIG1pZGRsZXdhcmVzLFxuICAgICk7XG5cbiAgICBpZiAocGFyYW1zQW5kUm91dGVSZXN1bHQucm91dGUpIHtcbiAgICAgIGN0eC5yb3V0ZSA9IHBhcmFtc0FuZFJvdXRlUmVzdWx0LnJvdXRlLm9yaWdpbmFsUGF0dGVybjtcbiAgICB9XG5cbiAgICBjdHgubmV4dCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGhhbmRsZXIgPSBoYW5kbGVycy5zaGlmdCgpITtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIEFzIHRoZSBgaGFuZGxlcmAgY2FuIGJlIGVpdGhlciBzeW5jIG9yIGFzeW5jLCBkZXBlbmRpbmcgb24gdGhlIHVzZXIncyBjb2RlLFxuICAgICAgICAvLyB0aGUgY3VycmVudCBzaGFwZSBvZiBvdXIgd3JhcHBlciwgdGhhdCBpcyBgKCkgPT4gaGFuZGxlcihyZXEsIG1pZGRsZXdhcmVDdHgpYCxcbiAgICAgICAgLy8gZG9lc24ndCBndWFyYW50ZWUgdGhhdCBhbGwgcG9zc2libGUgZXJyb3JzIHdpbGwgYmUgY2FwdHVyZWQuXG4gICAgICAgIC8vIGBQcm9taXNlLnJlc29sdmVgIGFjY2VwdCB0aGUgdmFsdWUgdGhhdCBzaG91bGQgYmUgcmV0dXJuZWQgdG8gdGhlIHByb21pc2VcbiAgICAgICAgLy8gY2hhaW4sIGhvd2V2ZXIsIGlmIHRoYXQgdmFsdWUgaXMgcHJvZHVjZWQgYnkgdGhlIGV4dGVybmFsIGZ1bmN0aW9uIGNhbGwsXG4gICAgICAgIC8vIHRoZSBwb3NzaWJsZSBgRXJyb3JgLCB3aWxsICpub3QqIGJlIGNhdWdodCBieSBhbnkgYC5jYXRjaCgpYCBhdHRhY2hlZCB0byB0aGF0IGNoYWluLlxuICAgICAgICAvLyBCZWNhdXNlIG9mIHRoYXQsIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHByb2R1Y2VkIHZhbHVlIGlzIHB1c2hlZFxuICAgICAgICAvLyB0aHJvdWdoIHRoZSBwaXBlbGluZSBvbmx5IGlmIGZ1bmN0aW9uIHdhcyBjYWxsZWQgc3VjY2Vzc2Z1bGx5LCBhbmQgaGFuZGxlXG4gICAgICAgIC8vIHRoZSBlcnJvciBjYXNlIG1hbnVhbGx5LCBieSByZXR1cm5pbmcgdGhlIGBFcnJvcmAgYXMgcmVqZWN0ZWQgcHJvbWlzZS5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShoYW5kbGVyKCkpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG4gICAgICAgICAgcmV0dXJuIHJlbmRlck5vdEZvdW5kKHJlcSwgY3R4KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgeyBtb2R1bGUgfSBvZiBtd3MpIHtcbiAgICAgIGlmIChtb2R1bGUuaGFuZGxlciBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBtb2R1bGUuaGFuZGxlcikge1xuICAgICAgICAgIGhhbmRsZXJzLnB1c2goKCkgPT4gaGFuZGxlcihyZXEsIGN0eCkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBoYW5kbGVyID0gbW9kdWxlLmhhbmRsZXI7XG4gICAgICAgIGhhbmRsZXJzLnB1c2goKCkgPT4gaGFuZGxlcihyZXEsIGN0eCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHsgZGVzdGluYXRpb24sIGhhbmRsZXIgfSA9IGlubmVyKFxuICAgICAgcmVxLFxuICAgICAgY3R4LFxuICAgICAgcGFyYW1zQW5kUm91dGVSZXN1bHQucm91dGUsXG4gICAgKTtcbiAgICBoYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuICAgIGN0eC5kZXN0aW5hdGlvbiA9IGRlc3RpbmF0aW9uO1xuICAgIHJldHVybiBjdHgubmV4dCgpLmNhdGNoKChlKSA9PiBlcnJvckhhbmRsZXIocmVxLCBjdHgsIGUpKTtcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLFNBQVMsUUFBUSxZQUFZO0FBQ3RDLFNBQWtELFFBQVEsUUFBUSxjQUFjO0FBUWhGLE9BQU8sTUFBTSxrQkFBa0IsWUFBWSxLQUFLO0FBRWhELE9BQU8sU0FBUyxZQUFZLEtBQWE7RUFDdkMsUUFBUSxNQUFNLFVBQVUsQ0FBQyxXQUFXO0VBRXBDLElBQUksTUFBTSxRQUFRLENBQUMsWUFBWTtJQUM3QixRQUFRLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLE1BQU07RUFDMUMsT0FBTyxJQUFJLE1BQU0sUUFBUSxDQUFDLGdCQUFnQjtJQUN4QyxRQUFRLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxjQUFjLE1BQU07RUFDOUMsT0FBTyxJQUFJLE1BQU0sUUFBUSxDQUFDLFVBQVU7SUFDbEMsUUFBUSxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxNQUFNO0VBQ3hD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
// denoCacheMetadata=14330054499063964038,11014860821172558515