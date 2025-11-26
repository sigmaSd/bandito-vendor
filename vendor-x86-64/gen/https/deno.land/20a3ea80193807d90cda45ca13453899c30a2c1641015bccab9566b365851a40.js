import { BUILD_ID } from "./build_id.ts";
export const INTERNAL_PREFIX = "/_frsh";
export const ASSET_CACHE_BUST_KEY = "__frsh_c";
/**
 * Returns true when the current runtime is the browser and false otherwise. This is used for guard runtime-dependent code.
 * Shorthand for the following:
 * `typeof document !== "undefined"`
 *
 * @example
 * ```
 *  if (IS_BROWSER) {
 *    alert('This is running in the browser!');
 *  } else {
 *    console.log('This code is running on the server, no access to window or alert');
 *  }
 * ```
 *
 * Without this guard, alert pauses the server until return is pressed in the console.
 */ export const IS_BROWSER = typeof document !== "undefined";
/**
 * Create a "locked" asset path. This differs from a plain path in that it is
 * specific to the current version of the application, and as such can be safely
 * served with a very long cache lifetime (1 year).
 */ export function asset(path) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  try {
    const url = new URL(path, "https://freshassetcache.local");
    if (url.protocol !== "https:" || url.host !== "freshassetcache.local" || url.searchParams.has(ASSET_CACHE_BUST_KEY)) {
      return path;
    }
    url.searchParams.set(ASSET_CACHE_BUST_KEY, BUILD_ID);
    return url.pathname + url.search + url.hash;
  } catch (err) {
    console.warn(`Failed to create asset() URL, falling back to regular path ('${path}'):`, err);
    return path;
  }
}
/** Apply the `asset` function to urls in a `srcset` attribute. */ export function assetSrcSet(srcset) {
  if (srcset.includes("(")) return srcset; // Bail if the srcset contains complicated syntax.
  const parts = srcset.split(",");
  const constructed = [];
  for (const part of parts){
    const trimmed = part.trimStart();
    const leadingWhitespace = part.length - trimmed.length;
    if (trimmed === "") return srcset; // Bail if the srcset is malformed.
    let urlEnd = trimmed.indexOf(" ");
    if (urlEnd === -1) urlEnd = trimmed.length;
    const leading = part.substring(0, leadingWhitespace);
    const url = trimmed.substring(0, urlEnd);
    const trailing = trimmed.substring(urlEnd);
    constructed.push(leading + asset(url) + trailing);
  }
  return constructed.join(",");
}
export function assetHashingHook(vnode) {
  if (vnode.type === "img" || vnode.type === "source") {
    const { props } = vnode;
    if (props["data-fresh-disable-lock"]) return;
    if (typeof props.src === "string") {
      props.src = asset(props.src);
    }
    if (typeof props.srcset === "string") {
      props.srcset = assetSrcSet(props.srcset);
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3J1bnRpbWUvdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVk5vZGUgfSBmcm9tIFwicHJlYWN0XCI7XG5pbXBvcnQgeyBCVUlMRF9JRCB9IGZyb20gXCIuL2J1aWxkX2lkLnRzXCI7XG5cbmV4cG9ydCBjb25zdCBJTlRFUk5BTF9QUkVGSVggPSBcIi9fZnJzaFwiO1xuZXhwb3J0IGNvbnN0IEFTU0VUX0NBQ0hFX0JVU1RfS0VZID0gXCJfX2Zyc2hfY1wiO1xuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSBjdXJyZW50IHJ1bnRpbWUgaXMgdGhlIGJyb3dzZXIgYW5kIGZhbHNlIG90aGVyd2lzZS4gVGhpcyBpcyB1c2VkIGZvciBndWFyZCBydW50aW1lLWRlcGVuZGVudCBjb2RlLlxuICogU2hvcnRoYW5kIGZvciB0aGUgZm9sbG93aW5nOlxuICogYHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcImBcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgXG4gKiAgaWYgKElTX0JST1dTRVIpIHtcbiAqICAgIGFsZXJ0KCdUaGlzIGlzIHJ1bm5pbmcgaW4gdGhlIGJyb3dzZXIhJyk7XG4gKiAgfSBlbHNlIHtcbiAqICAgIGNvbnNvbGUubG9nKCdUaGlzIGNvZGUgaXMgcnVubmluZyBvbiB0aGUgc2VydmVyLCBubyBhY2Nlc3MgdG8gd2luZG93IG9yIGFsZXJ0Jyk7XG4gKiAgfVxuICogYGBgXG4gKlxuICogV2l0aG91dCB0aGlzIGd1YXJkLCBhbGVydCBwYXVzZXMgdGhlIHNlcnZlciB1bnRpbCByZXR1cm4gaXMgcHJlc3NlZCBpbiB0aGUgY29uc29sZS5cbiAqL1xuZXhwb3J0IGNvbnN0IElTX0JST1dTRVIgPSB0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCI7XG5cbi8qKlxuICogQ3JlYXRlIGEgXCJsb2NrZWRcIiBhc3NldCBwYXRoLiBUaGlzIGRpZmZlcnMgZnJvbSBhIHBsYWluIHBhdGggaW4gdGhhdCBpdCBpc1xuICogc3BlY2lmaWMgdG8gdGhlIGN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgYXBwbGljYXRpb24sIGFuZCBhcyBzdWNoIGNhbiBiZSBzYWZlbHlcbiAqIHNlcnZlZCB3aXRoIGEgdmVyeSBsb25nIGNhY2hlIGxpZmV0aW1lICgxIHllYXIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXQocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFwYXRoLnN0YXJ0c1dpdGgoXCIvXCIpIHx8IHBhdGguc3RhcnRzV2l0aChcIi8vXCIpKSByZXR1cm4gcGF0aDtcbiAgdHJ5IHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHBhdGgsIFwiaHR0cHM6Ly9mcmVzaGFzc2V0Y2FjaGUubG9jYWxcIik7XG4gICAgaWYgKFxuICAgICAgdXJsLnByb3RvY29sICE9PSBcImh0dHBzOlwiIHx8IHVybC5ob3N0ICE9PSBcImZyZXNoYXNzZXRjYWNoZS5sb2NhbFwiIHx8XG4gICAgICB1cmwuc2VhcmNoUGFyYW1zLmhhcyhBU1NFVF9DQUNIRV9CVVNUX0tFWSlcbiAgICApIHtcbiAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cbiAgICB1cmwuc2VhcmNoUGFyYW1zLnNldChBU1NFVF9DQUNIRV9CVVNUX0tFWSwgQlVJTERfSUQpO1xuICAgIHJldHVybiB1cmwucGF0aG5hbWUgKyB1cmwuc2VhcmNoICsgdXJsLmhhc2g7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgIGBGYWlsZWQgdG8gY3JlYXRlIGFzc2V0KCkgVVJMLCBmYWxsaW5nIGJhY2sgdG8gcmVndWxhciBwYXRoICgnJHtwYXRofScpOmAsXG4gICAgICBlcnIsXG4gICAgKTtcbiAgICByZXR1cm4gcGF0aDtcbiAgfVxufVxuXG4vKiogQXBwbHkgdGhlIGBhc3NldGAgZnVuY3Rpb24gdG8gdXJscyBpbiBhIGBzcmNzZXRgIGF0dHJpYnV0ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NldFNyY1NldChzcmNzZXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChzcmNzZXQuaW5jbHVkZXMoXCIoXCIpKSByZXR1cm4gc3Jjc2V0OyAvLyBCYWlsIGlmIHRoZSBzcmNzZXQgY29udGFpbnMgY29tcGxpY2F0ZWQgc3ludGF4LlxuICBjb25zdCBwYXJ0cyA9IHNyY3NldC5zcGxpdChcIixcIik7XG4gIGNvbnN0IGNvbnN0cnVjdGVkID0gW107XG4gIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuICAgIGNvbnN0IHRyaW1tZWQgPSBwYXJ0LnRyaW1TdGFydCgpO1xuICAgIGNvbnN0IGxlYWRpbmdXaGl0ZXNwYWNlID0gcGFydC5sZW5ndGggLSB0cmltbWVkLmxlbmd0aDtcbiAgICBpZiAodHJpbW1lZCA9PT0gXCJcIikgcmV0dXJuIHNyY3NldDsgLy8gQmFpbCBpZiB0aGUgc3Jjc2V0IGlzIG1hbGZvcm1lZC5cbiAgICBsZXQgdXJsRW5kID0gdHJpbW1lZC5pbmRleE9mKFwiIFwiKTtcbiAgICBpZiAodXJsRW5kID09PSAtMSkgdXJsRW5kID0gdHJpbW1lZC5sZW5ndGg7XG4gICAgY29uc3QgbGVhZGluZyA9IHBhcnQuc3Vic3RyaW5nKDAsIGxlYWRpbmdXaGl0ZXNwYWNlKTtcbiAgICBjb25zdCB1cmwgPSB0cmltbWVkLnN1YnN0cmluZygwLCB1cmxFbmQpO1xuICAgIGNvbnN0IHRyYWlsaW5nID0gdHJpbW1lZC5zdWJzdHJpbmcodXJsRW5kKTtcbiAgICBjb25zdHJ1Y3RlZC5wdXNoKGxlYWRpbmcgKyBhc3NldCh1cmwpICsgdHJhaWxpbmcpO1xuICB9XG4gIHJldHVybiBjb25zdHJ1Y3RlZC5qb2luKFwiLFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2V0SGFzaGluZ0hvb2soXG4gIHZub2RlOiBWTm9kZTx7XG4gICAgc3JjPzogc3RyaW5nO1xuICAgIHNyY3NldD86IHN0cmluZztcbiAgICBbXCJkYXRhLWZyZXNoLWRpc2FibGUtbG9ja1wiXT86IGJvb2xlYW47XG4gIH0+LFxuKSB7XG4gIGlmICh2bm9kZS50eXBlID09PSBcImltZ1wiIHx8IHZub2RlLnR5cGUgPT09IFwic291cmNlXCIpIHtcbiAgICBjb25zdCB7IHByb3BzIH0gPSB2bm9kZTtcbiAgICBpZiAocHJvcHNbXCJkYXRhLWZyZXNoLWRpc2FibGUtbG9ja1wiXSkgcmV0dXJuO1xuICAgIGlmICh0eXBlb2YgcHJvcHMuc3JjID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwcm9wcy5zcmMgPSBhc3NldChwcm9wcy5zcmMpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHByb3BzLnNyY3NldCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcHJvcHMuc3Jjc2V0ID0gYXNzZXRTcmNTZXQocHJvcHMuc3Jjc2V0KTtcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLFFBQVEsUUFBUSxnQkFBZ0I7QUFFekMsT0FBTyxNQUFNLGtCQUFrQixTQUFTO0FBQ3hDLE9BQU8sTUFBTSx1QkFBdUIsV0FBVztBQUUvQzs7Ozs7Ozs7Ozs7Ozs7O0NBZUMsR0FDRCxPQUFPLE1BQU0sYUFBYSxPQUFPLGFBQWEsWUFBWTtBQUUxRDs7OztDQUlDLEdBQ0QsT0FBTyxTQUFTLE1BQU0sSUFBWTtFQUNoQyxJQUFJLENBQUMsS0FBSyxVQUFVLENBQUMsUUFBUSxLQUFLLFVBQVUsQ0FBQyxPQUFPLE9BQU87RUFDM0QsSUFBSTtJQUNGLE1BQU0sTUFBTSxJQUFJLElBQUksTUFBTTtJQUMxQixJQUNFLElBQUksUUFBUSxLQUFLLFlBQVksSUFBSSxJQUFJLEtBQUssMkJBQzFDLElBQUksWUFBWSxDQUFDLEdBQUcsQ0FBQyx1QkFDckI7TUFDQSxPQUFPO0lBQ1Q7SUFDQSxJQUFJLFlBQVksQ0FBQyxHQUFHLENBQUMsc0JBQXNCO0lBQzNDLE9BQU8sSUFBSSxRQUFRLEdBQUcsSUFBSSxNQUFNLEdBQUcsSUFBSSxJQUFJO0VBQzdDLEVBQUUsT0FBTyxLQUFLO0lBQ1osUUFBUSxJQUFJLENBQ1YsQ0FBQyw2REFBNkQsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUN6RTtJQUVGLE9BQU87RUFDVDtBQUNGO0FBRUEsZ0VBQWdFLEdBQ2hFLE9BQU8sU0FBUyxZQUFZLE1BQWM7RUFDeEMsSUFBSSxPQUFPLFFBQVEsQ0FBQyxNQUFNLE9BQU8sUUFBUSxrREFBa0Q7RUFDM0YsTUFBTSxRQUFRLE9BQU8sS0FBSyxDQUFDO0VBQzNCLE1BQU0sY0FBYyxFQUFFO0VBQ3RCLEtBQUssTUFBTSxRQUFRLE1BQU87SUFDeEIsTUFBTSxVQUFVLEtBQUssU0FBUztJQUM5QixNQUFNLG9CQUFvQixLQUFLLE1BQU0sR0FBRyxRQUFRLE1BQU07SUFDdEQsSUFBSSxZQUFZLElBQUksT0FBTyxRQUFRLG1DQUFtQztJQUN0RSxJQUFJLFNBQVMsUUFBUSxPQUFPLENBQUM7SUFDN0IsSUFBSSxXQUFXLENBQUMsR0FBRyxTQUFTLFFBQVEsTUFBTTtJQUMxQyxNQUFNLFVBQVUsS0FBSyxTQUFTLENBQUMsR0FBRztJQUNsQyxNQUFNLE1BQU0sUUFBUSxTQUFTLENBQUMsR0FBRztJQUNqQyxNQUFNLFdBQVcsUUFBUSxTQUFTLENBQUM7SUFDbkMsWUFBWSxJQUFJLENBQUMsVUFBVSxNQUFNLE9BQU87RUFDMUM7RUFDQSxPQUFPLFlBQVksSUFBSSxDQUFDO0FBQzFCO0FBRUEsT0FBTyxTQUFTLGlCQUNkLEtBSUU7RUFFRixJQUFJLE1BQU0sSUFBSSxLQUFLLFNBQVMsTUFBTSxJQUFJLEtBQUssVUFBVTtJQUNuRCxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUc7SUFDbEIsSUFBSSxLQUFLLENBQUMsMEJBQTBCLEVBQUU7SUFDdEMsSUFBSSxPQUFPLE1BQU0sR0FBRyxLQUFLLFVBQVU7TUFDakMsTUFBTSxHQUFHLEdBQUcsTUFBTSxNQUFNLEdBQUc7SUFDN0I7SUFDQSxJQUFJLE9BQU8sTUFBTSxNQUFNLEtBQUssVUFBVTtNQUNwQyxNQUFNLE1BQU0sR0FBRyxZQUFZLE1BQU0sTUFBTTtJQUN6QztFQUNGO0FBQ0YifQ==
// denoCacheMetadata=3826767443162654341,11295261344124870400