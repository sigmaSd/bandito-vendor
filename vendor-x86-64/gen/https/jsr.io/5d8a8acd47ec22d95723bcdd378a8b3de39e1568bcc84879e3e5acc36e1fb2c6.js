/**
 * This file contains useful utility functions used by plug.
 *
 * @module
 */ import { isAbsolute, join, normalize, resolve, toFileUrl } from "jsr:@std/path@^0.221.0";
import { encodeHex } from "jsr:@std/encoding@^0.221.0/hex";
const encoder = new TextEncoder();
function baseUrlToFilename(url) {
  const out = [];
  const protocol = url.protocol.replace(":", "");
  out.push(protocol);
  switch(protocol){
    case "http":
    case "https":
      {
        const host = url.hostname;
        const hostPort = url.port;
        out.push(hostPort ? `${host}_PORT${hostPort}` : host);
        break;
      }
    case "file":
    case "data":
    case "blob":
      break;
    default:
      throw new TypeError(`Don't know how to create cache name for protocol: ${protocol}`);
  }
  return join(...out);
}
/**
 * Transforms a string into a URL.
 *
 * @private
 */ export function stringToURL(url) {
  // deno-fmt-ignore
  return url.startsWith("file://") || url.startsWith("http://") || url.startsWith("https://") ? new URL(url) : toFileUrl(resolve(url));
}
/**
 * SHA-256 hashes a string. Used internally to hash URLs for cache filenames.
 *
 * @private
 */ export async function hash(value) {
  return encodeHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}
/**
 * Transforms a URL into a filename for the cache.
 *
 * @private
 */ export async function urlToFilename(url) {
  const cacheFilename = baseUrlToFilename(url);
  const hashedFilename = await hash(url.pathname + url.search);
  return join(cacheFilename, hashedFilename);
}
/**
 * Checks if a file exists.
 *
 * @private
 */ export async function isFile(filePath) {
  try {
    const stats = await Deno.lstat(filePath);
    return stats.isFile;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return false;
    }
    throw err;
  }
}
// The rest of is based on code from denoland/deno_cache by the Deno authors
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * @returns The home directory of the user.
 */ export function homeDir() {
  switch(Deno.build.os){
    case "windows":
      return Deno.env.get("USERPROFILE");
    case "linux":
    case "darwin":
    case "freebsd":
    case "netbsd":
    case "aix":
    case "solaris":
    case "illumos":
      return Deno.env.get("HOME");
    default:
      throw Error("unreachable");
  }
}
/**
 * @returns The cache directory of the user.
 */ export function cacheDir() {
  if (Deno.build.os === "darwin") {
    const home = homeDir();
    if (home) {
      return join(home, "Library/Caches");
    }
  } else if (Deno.build.os === "windows") {
    return Deno.env.get("LOCALAPPDATA");
  } else {
    const cacheHome = Deno.env.get("XDG_CACHE_HOME");
    if (cacheHome) {
      return cacheHome;
    } else {
      const home = homeDir();
      if (home) {
        return join(home, ".cache");
      }
    }
  }
}
/**
 * @returns The cache directory for Deno.
 */ export function denoCacheDir() {
  const dd = Deno.env.get("DENO_DIR");
  let root;
  if (dd) {
    root = normalize(isAbsolute(dd) ? dd : join(Deno.cwd(), dd));
  } else {
    const cd = cacheDir();
    if (cd) {
      root = join(cd, "deno");
    } else {
      const hd = homeDir();
      if (hd) {
        root = join(hd, ".deno");
      }
    }
  }
  return root;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BkZW5vc2F1cnMvcGx1Zy8xLjAuNi91dGlsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHVzZWZ1bCB1dGlsaXR5IGZ1bmN0aW9ucyB1c2VkIGJ5IHBsdWcuXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCB7IGlzQWJzb2x1dGUsIGpvaW4sIG5vcm1hbGl6ZSwgcmVzb2x2ZSwgdG9GaWxlVXJsIH0gZnJvbSBcImpzcjpAc3RkL3BhdGhAXjAuMjIxLjBcIjtcbmltcG9ydCB7IGVuY29kZUhleCB9IGZyb20gXCJqc3I6QHN0ZC9lbmNvZGluZ0BeMC4yMjEuMC9oZXhcIjtcblxuY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuXG5mdW5jdGlvbiBiYXNlVXJsVG9GaWxlbmFtZSh1cmw6IFVSTCk6IHN0cmluZyB7XG4gIGNvbnN0IG91dCA9IFtdO1xuICBjb25zdCBwcm90b2NvbCA9IHVybC5wcm90b2NvbC5yZXBsYWNlKFwiOlwiLCBcIlwiKTtcbiAgb3V0LnB1c2gocHJvdG9jb2wpO1xuXG4gIHN3aXRjaCAocHJvdG9jb2wpIHtcbiAgICBjYXNlIFwiaHR0cFwiOlxuICAgIGNhc2UgXCJodHRwc1wiOiB7XG4gICAgICBjb25zdCBob3N0ID0gdXJsLmhvc3RuYW1lO1xuICAgICAgY29uc3QgaG9zdFBvcnQgPSB1cmwucG9ydDtcbiAgICAgIG91dC5wdXNoKGhvc3RQb3J0ID8gYCR7aG9zdH1fUE9SVCR7aG9zdFBvcnR9YCA6IGhvc3QpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJmaWxlXCI6XG4gICAgY2FzZSBcImRhdGFcIjpcbiAgICBjYXNlIFwiYmxvYlwiOlxuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIGBEb24ndCBrbm93IGhvdyB0byBjcmVhdGUgY2FjaGUgbmFtZSBmb3IgcHJvdG9jb2w6ICR7cHJvdG9jb2x9YCxcbiAgICAgICk7XG4gIH1cblxuICByZXR1cm4gam9pbiguLi5vdXQpO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgYSBzdHJpbmcgaW50byBhIFVSTC5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9VUkwodXJsOiBzdHJpbmcpOiBVUkwge1xuICAvLyBkZW5vLWZtdC1pZ25vcmVcbiAgcmV0dXJuIHVybC5zdGFydHNXaXRoKFwiZmlsZTovL1wiKVxuICAgICAgfHwgdXJsLnN0YXJ0c1dpdGgoXCJodHRwOi8vXCIpXG4gICAgICB8fCB1cmwuc3RhcnRzV2l0aChcImh0dHBzOi8vXCIpXG4gICAgPyBuZXcgVVJMKHVybClcbiAgICA6IHRvRmlsZVVybChyZXNvbHZlKHVybCkpO1xufVxuXG4vKipcbiAqIFNIQS0yNTYgaGFzaGVzIGEgc3RyaW5nLiBVc2VkIGludGVybmFsbHkgdG8gaGFzaCBVUkxzIGZvciBjYWNoZSBmaWxlbmFtZXMuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhc2godmFsdWU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBlbmNvZGVIZXgoXG4gICAgbmV3IFVpbnQ4QXJyYXkoXG4gICAgICBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChcIlNIQS0yNTZcIiwgZW5jb2Rlci5lbmNvZGUodmFsdWUpKSxcbiAgICApLFxuICApO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgYSBVUkwgaW50byBhIGZpbGVuYW1lIGZvciB0aGUgY2FjaGUuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVybFRvRmlsZW5hbWUodXJsOiBVUkwpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBjYWNoZUZpbGVuYW1lID0gYmFzZVVybFRvRmlsZW5hbWUodXJsKTtcbiAgY29uc3QgaGFzaGVkRmlsZW5hbWUgPSBhd2FpdCBoYXNoKHVybC5wYXRobmFtZSArIHVybC5zZWFyY2gpO1xuICByZXR1cm4gam9pbihjYWNoZUZpbGVuYW1lLCBoYXNoZWRGaWxlbmFtZSk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZmlsZSBleGlzdHMuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzRmlsZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBEZW5vLmxzdGF0KGZpbGVQYXRoKTtcbiAgICByZXR1cm4gc3RhdHMuaXNGaWxlO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbi8vIFRoZSByZXN0IG9mIGlzIGJhc2VkIG9uIGNvZGUgZnJvbSBkZW5vbGFuZC9kZW5vX2NhY2hlIGJ5IHRoZSBEZW5vIGF1dGhvcnNcbi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8qKlxuICogQHJldHVybnMgVGhlIGhvbWUgZGlyZWN0b3J5IG9mIHRoZSB1c2VyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaG9tZURpcigpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBzd2l0Y2ggKERlbm8uYnVpbGQub3MpIHtcbiAgICBjYXNlIFwid2luZG93c1wiOlxuICAgICAgcmV0dXJuIERlbm8uZW52LmdldChcIlVTRVJQUk9GSUxFXCIpO1xuICAgIGNhc2UgXCJsaW51eFwiOlxuICAgIGNhc2UgXCJkYXJ3aW5cIjpcbiAgICBjYXNlIFwiZnJlZWJzZFwiOlxuICAgIGNhc2UgXCJuZXRic2RcIjpcbiAgICBjYXNlIFwiYWl4XCI6XG4gICAgY2FzZSBcInNvbGFyaXNcIjpcbiAgICBjYXNlIFwiaWxsdW1vc1wiOlxuICAgICAgcmV0dXJuIERlbm8uZW52LmdldChcIkhPTUVcIik7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IEVycm9yKFwidW5yZWFjaGFibGVcIik7XG4gIH1cbn1cblxuLyoqXG4gKiBAcmV0dXJucyBUaGUgY2FjaGUgZGlyZWN0b3J5IG9mIHRoZSB1c2VyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FjaGVEaXIoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKERlbm8uYnVpbGQub3MgPT09IFwiZGFyd2luXCIpIHtcbiAgICBjb25zdCBob21lID0gaG9tZURpcigpO1xuICAgIGlmIChob21lKSB7XG4gICAgICByZXR1cm4gam9pbihob21lLCBcIkxpYnJhcnkvQ2FjaGVzXCIpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChEZW5vLmJ1aWxkLm9zID09PSBcIndpbmRvd3NcIikge1xuICAgIHJldHVybiBEZW5vLmVudi5nZXQoXCJMT0NBTEFQUERBVEFcIik7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgY2FjaGVIb21lID0gRGVuby5lbnYuZ2V0KFwiWERHX0NBQ0hFX0hPTUVcIik7XG4gICAgaWYgKGNhY2hlSG9tZSkge1xuICAgICAgcmV0dXJuIGNhY2hlSG9tZTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaG9tZSA9IGhvbWVEaXIoKTtcbiAgICAgIGlmIChob21lKSB7XG4gICAgICAgIHJldHVybiBqb2luKGhvbWUsIFwiLmNhY2hlXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEByZXR1cm5zIFRoZSBjYWNoZSBkaXJlY3RvcnkgZm9yIERlbm8uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZW5vQ2FjaGVEaXIoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgZGQgPSBEZW5vLmVudi5nZXQoXCJERU5PX0RJUlwiKTtcbiAgbGV0IHJvb3Q7XG4gIGlmIChkZCkge1xuICAgIHJvb3QgPSBub3JtYWxpemUoaXNBYnNvbHV0ZShkZCkgPyBkZCA6IGpvaW4oRGVuby5jd2QoKSwgZGQpKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjZCA9IGNhY2hlRGlyKCk7XG4gICAgaWYgKGNkKSB7XG4gICAgICByb290ID0gam9pbihjZCwgXCJkZW5vXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBoZCA9IGhvbWVEaXIoKTtcbiAgICAgIGlmIChoZCkge1xuICAgICAgICByb290ID0gam9pbihoZCwgXCIuZGVub1wiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcm9vdDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztDQUlDLEdBRUQsU0FBUyxVQUFVLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsU0FBUyxRQUFRLHlCQUF5QjtBQUN6RixTQUFTLFNBQVMsUUFBUSxpQ0FBaUM7QUFFM0QsTUFBTSxVQUFVLElBQUk7QUFFcEIsU0FBUyxrQkFBa0IsR0FBUTtFQUNqQyxNQUFNLE1BQU0sRUFBRTtFQUNkLE1BQU0sV0FBVyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSztFQUMzQyxJQUFJLElBQUksQ0FBQztFQUVULE9BQVE7SUFDTixLQUFLO0lBQ0wsS0FBSztNQUFTO1FBQ1osTUFBTSxPQUFPLElBQUksUUFBUTtRQUN6QixNQUFNLFdBQVcsSUFBSSxJQUFJO1FBQ3pCLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEtBQUssS0FBSyxFQUFFLFNBQVMsQ0FBQyxHQUFHO1FBQ2hEO01BQ0Y7SUFDQSxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7TUFDSDtJQUNGO01BQ0UsTUFBTSxJQUFJLFVBQ1IsQ0FBQyxrREFBa0QsRUFBRSxTQUFTLENBQUM7RUFFckU7RUFFQSxPQUFPLFFBQVE7QUFDakI7QUFFQTs7OztDQUlDLEdBQ0QsT0FBTyxTQUFTLFlBQVksR0FBVztFQUNyQyxrQkFBa0I7RUFDbEIsT0FBTyxJQUFJLFVBQVUsQ0FBQyxjQUNmLElBQUksVUFBVSxDQUFDLGNBQ2YsSUFBSSxVQUFVLENBQUMsY0FDbEIsSUFBSSxJQUFJLE9BQ1IsVUFBVSxRQUFRO0FBQ3hCO0FBRUE7Ozs7Q0FJQyxHQUNELE9BQU8sZUFBZSxLQUFLLEtBQWE7RUFDdEMsT0FBTyxVQUNMLElBQUksV0FDRixNQUFNLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLFFBQVEsTUFBTSxDQUFDO0FBRzNEO0FBRUE7Ozs7Q0FJQyxHQUNELE9BQU8sZUFBZSxjQUFjLEdBQVE7RUFDMUMsTUFBTSxnQkFBZ0Isa0JBQWtCO0VBQ3hDLE1BQU0saUJBQWlCLE1BQU0sS0FBSyxJQUFJLFFBQVEsR0FBRyxJQUFJLE1BQU07RUFDM0QsT0FBTyxLQUFLLGVBQWU7QUFDN0I7QUFFQTs7OztDQUlDLEdBQ0QsT0FBTyxlQUFlLE9BQU8sUUFBZ0I7RUFDM0MsSUFBSTtJQUNGLE1BQU0sUUFBUSxNQUFNLEtBQUssS0FBSyxDQUFDO0lBQy9CLE9BQU8sTUFBTSxNQUFNO0VBQ3JCLEVBQUUsT0FBTyxLQUFLO0lBQ1osSUFBSSxlQUFlLEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRTtNQUN2QyxPQUFPO0lBQ1Q7SUFDQSxNQUFNO0VBQ1I7QUFDRjtBQUVBLDRFQUE0RTtBQUM1RSwwRUFBMEU7QUFFMUU7O0NBRUMsR0FDRCxPQUFPLFNBQVM7RUFDZCxPQUFRLEtBQUssS0FBSyxDQUFDLEVBQUU7SUFDbkIsS0FBSztNQUNILE9BQU8sS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDO0lBQ3RCLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7TUFDSCxPQUFPLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQztJQUN0QjtNQUNFLE1BQU0sTUFBTTtFQUNoQjtBQUNGO0FBRUE7O0NBRUMsR0FDRCxPQUFPLFNBQVM7RUFDZCxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUUsS0FBSyxVQUFVO0lBQzlCLE1BQU0sT0FBTztJQUNiLElBQUksTUFBTTtNQUNSLE9BQU8sS0FBSyxNQUFNO0lBQ3BCO0VBQ0YsT0FBTyxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUUsS0FBSyxXQUFXO0lBQ3RDLE9BQU8sS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDO0VBQ3RCLE9BQU87SUFDTCxNQUFNLFlBQVksS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDO0lBQy9CLElBQUksV0FBVztNQUNiLE9BQU87SUFDVCxPQUFPO01BQ0wsTUFBTSxPQUFPO01BQ2IsSUFBSSxNQUFNO1FBQ1IsT0FBTyxLQUFLLE1BQU07TUFDcEI7SUFDRjtFQUNGO0FBQ0Y7QUFFQTs7Q0FFQyxHQUNELE9BQU8sU0FBUztFQUNkLE1BQU0sS0FBSyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUM7RUFDeEIsSUFBSTtFQUNKLElBQUksSUFBSTtJQUNOLE9BQU8sVUFBVSxXQUFXLE1BQU0sS0FBSyxLQUFLLEtBQUssR0FBRyxJQUFJO0VBQzFELE9BQU87SUFDTCxNQUFNLEtBQUs7SUFDWCxJQUFJLElBQUk7TUFDTixPQUFPLEtBQUssSUFBSTtJQUNsQixPQUFPO01BQ0wsTUFBTSxLQUFLO01BQ1gsSUFBSSxJQUFJO1FBQ04sT0FBTyxLQUFLLElBQUk7TUFDbEI7SUFDRjtFQUNGO0VBRUEsT0FBTztBQUNUIn0=
// denoCacheMetadata=11481190442063907403,10119149941495665825