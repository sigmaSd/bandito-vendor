/**
 * This file contains useful utility functions used by plug.
 *
 * @module
 */ import { isAbsolute, join, normalize, resolve, toFileUrl } from "jsr:@std/path@^1";
import { encodeHex } from "jsr:@std/encoding@^1/hex";
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
    case "android":
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BkZW5vc2F1cnMvcGx1Zy8xLjEuMC91dGlsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHVzZWZ1bCB1dGlsaXR5IGZ1bmN0aW9ucyB1c2VkIGJ5IHBsdWcuXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCB7IGlzQWJzb2x1dGUsIGpvaW4sIG5vcm1hbGl6ZSwgcmVzb2x2ZSwgdG9GaWxlVXJsIH0gZnJvbSBcImpzcjpAc3RkL3BhdGhAXjFcIjtcbmltcG9ydCB7IGVuY29kZUhleCB9IGZyb20gXCJqc3I6QHN0ZC9lbmNvZGluZ0BeMS9oZXhcIjtcblxuY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuXG5mdW5jdGlvbiBiYXNlVXJsVG9GaWxlbmFtZSh1cmw6IFVSTCk6IHN0cmluZyB7XG4gIGNvbnN0IG91dCA9IFtdO1xuICBjb25zdCBwcm90b2NvbCA9IHVybC5wcm90b2NvbC5yZXBsYWNlKFwiOlwiLCBcIlwiKTtcbiAgb3V0LnB1c2gocHJvdG9jb2wpO1xuXG4gIHN3aXRjaCAocHJvdG9jb2wpIHtcbiAgICBjYXNlIFwiaHR0cFwiOlxuICAgIGNhc2UgXCJodHRwc1wiOiB7XG4gICAgICBjb25zdCBob3N0ID0gdXJsLmhvc3RuYW1lO1xuICAgICAgY29uc3QgaG9zdFBvcnQgPSB1cmwucG9ydDtcbiAgICAgIG91dC5wdXNoKGhvc3RQb3J0ID8gYCR7aG9zdH1fUE9SVCR7aG9zdFBvcnR9YCA6IGhvc3QpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJmaWxlXCI6XG4gICAgY2FzZSBcImRhdGFcIjpcbiAgICBjYXNlIFwiYmxvYlwiOlxuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIGBEb24ndCBrbm93IGhvdyB0byBjcmVhdGUgY2FjaGUgbmFtZSBmb3IgcHJvdG9jb2w6ICR7cHJvdG9jb2x9YCxcbiAgICAgICk7XG4gIH1cblxuICByZXR1cm4gam9pbiguLi5vdXQpO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgYSBzdHJpbmcgaW50byBhIFVSTC5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9VUkwodXJsOiBzdHJpbmcpOiBVUkwge1xuICAvLyBkZW5vLWZtdC1pZ25vcmVcbiAgcmV0dXJuIHVybC5zdGFydHNXaXRoKFwiZmlsZTovL1wiKSB8fFxuICAgIHVybC5zdGFydHNXaXRoKFwiaHR0cDovL1wiKSB8fFxuICAgIHVybC5zdGFydHNXaXRoKFwiaHR0cHM6Ly9cIilcbiAgICA/IG5ldyBVUkwodXJsKVxuICAgIDogdG9GaWxlVXJsKHJlc29sdmUodXJsKSk7XG59XG5cbi8qKlxuICogU0hBLTI1NiBoYXNoZXMgYSBzdHJpbmcuIFVzZWQgaW50ZXJuYWxseSB0byBoYXNoIFVSTHMgZm9yIGNhY2hlIGZpbGVuYW1lcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFzaCh2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIGVuY29kZUhleChcbiAgICBuZXcgVWludDhBcnJheShcbiAgICAgIGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KFwiU0hBLTI1NlwiLCBlbmNvZGVyLmVuY29kZSh2YWx1ZSkpLFxuICAgICksXG4gICk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBhIFVSTCBpbnRvIGEgZmlsZW5hbWUgZm9yIHRoZSBjYWNoZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXJsVG9GaWxlbmFtZSh1cmw6IFVSTCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGNhY2hlRmlsZW5hbWUgPSBiYXNlVXJsVG9GaWxlbmFtZSh1cmwpO1xuICBjb25zdCBoYXNoZWRGaWxlbmFtZSA9IGF3YWl0IGhhc2godXJsLnBhdGhuYW1lICsgdXJsLnNlYXJjaCk7XG4gIHJldHVybiBqb2luKGNhY2hlRmlsZW5hbWUsIGhhc2hlZEZpbGVuYW1lKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYSBmaWxlIGV4aXN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaXNGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGF0cyA9IGF3YWl0IERlbm8ubHN0YXQoZmlsZVBhdGgpO1xuICAgIHJldHVybiBzdGF0cy5pc0ZpbGU7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuLy8gVGhlIHJlc3Qgb2YgaXMgYmFzZWQgb24gY29kZSBmcm9tIGRlbm9sYW5kL2Rlbm9fY2FjaGUgYnkgdGhlIERlbm8gYXV0aG9yc1xuLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuLyoqXG4gKiBAcmV0dXJucyBUaGUgaG9tZSBkaXJlY3Rvcnkgb2YgdGhlIHVzZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBob21lRGlyKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHN3aXRjaCAoRGVuby5idWlsZC5vcykge1xuICAgIGNhc2UgXCJ3aW5kb3dzXCI6XG4gICAgICByZXR1cm4gRGVuby5lbnYuZ2V0KFwiVVNFUlBST0ZJTEVcIik7XG4gICAgY2FzZSBcImxpbnV4XCI6XG4gICAgY2FzZSBcImRhcndpblwiOlxuICAgIGNhc2UgXCJmcmVlYnNkXCI6XG4gICAgY2FzZSBcIm5ldGJzZFwiOlxuICAgIGNhc2UgXCJhaXhcIjpcbiAgICBjYXNlIFwic29sYXJpc1wiOlxuICAgIGNhc2UgXCJpbGx1bW9zXCI6XG4gICAgY2FzZSBcImFuZHJvaWRcIjpcbiAgICAgIHJldHVybiBEZW5vLmVudi5nZXQoXCJIT01FXCIpO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBFcnJvcihcInVucmVhY2hhYmxlXCIpO1xuICB9XG59XG5cbi8qKlxuICogQHJldHVybnMgVGhlIGNhY2hlIGRpcmVjdG9yeSBvZiB0aGUgdXNlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhY2hlRGlyKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGlmIChEZW5vLmJ1aWxkLm9zID09PSBcImRhcndpblwiKSB7XG4gICAgY29uc3QgaG9tZSA9IGhvbWVEaXIoKTtcbiAgICBpZiAoaG9tZSkge1xuICAgICAgcmV0dXJuIGpvaW4oaG9tZSwgXCJMaWJyYXJ5L0NhY2hlc1wiKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCIpIHtcbiAgICByZXR1cm4gRGVuby5lbnYuZ2V0KFwiTE9DQUxBUFBEQVRBXCIpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNhY2hlSG9tZSA9IERlbm8uZW52LmdldChcIlhER19DQUNIRV9IT01FXCIpO1xuICAgIGlmIChjYWNoZUhvbWUpIHtcbiAgICAgIHJldHVybiBjYWNoZUhvbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGhvbWUgPSBob21lRGlyKCk7XG4gICAgICBpZiAoaG9tZSkge1xuICAgICAgICByZXR1cm4gam9pbihob21lLCBcIi5jYWNoZVwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcmV0dXJucyBUaGUgY2FjaGUgZGlyZWN0b3J5IGZvciBEZW5vLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVub0NhY2hlRGlyKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IGRkID0gRGVuby5lbnYuZ2V0KFwiREVOT19ESVJcIik7XG4gIGxldCByb290O1xuICBpZiAoZGQpIHtcbiAgICByb290ID0gbm9ybWFsaXplKGlzQWJzb2x1dGUoZGQpID8gZGQgOiBqb2luKERlbm8uY3dkKCksIGRkKSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgY2QgPSBjYWNoZURpcigpO1xuICAgIGlmIChjZCkge1xuICAgICAgcm9vdCA9IGpvaW4oY2QsIFwiZGVub1wiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaGQgPSBob21lRGlyKCk7XG4gICAgICBpZiAoaGQpIHtcbiAgICAgICAgcm9vdCA9IGpvaW4oaGQsIFwiLmRlbm9cIik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJvb3Q7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Q0FJQyxHQUVELFNBQVMsVUFBVSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsUUFBUSxtQkFBbUI7QUFDbkYsU0FBUyxTQUFTLFFBQVEsMkJBQTJCO0FBRXJELE1BQU0sVUFBVSxJQUFJO0FBRXBCLFNBQVMsa0JBQWtCLEdBQVE7RUFDakMsTUFBTSxNQUFNLEVBQUU7RUFDZCxNQUFNLFdBQVcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUs7RUFDM0MsSUFBSSxJQUFJLENBQUM7RUFFVCxPQUFRO0lBQ04sS0FBSztJQUNMLEtBQUs7TUFBUztRQUNaLE1BQU0sT0FBTyxJQUFJLFFBQVE7UUFDekIsTUFBTSxXQUFXLElBQUksSUFBSTtRQUN6QixJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxLQUFLLEVBQUUsVUFBVSxHQUFHO1FBQ2hEO01BQ0Y7SUFDQSxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7TUFDSDtJQUNGO01BQ0UsTUFBTSxJQUFJLFVBQ1IsQ0FBQyxrREFBa0QsRUFBRSxVQUFVO0VBRXJFO0VBRUEsT0FBTyxRQUFRO0FBQ2pCO0FBRUE7Ozs7Q0FJQyxHQUNELE9BQU8sU0FBUyxZQUFZLEdBQVc7RUFDckMsa0JBQWtCO0VBQ2xCLE9BQU8sSUFBSSxVQUFVLENBQUMsY0FDcEIsSUFBSSxVQUFVLENBQUMsY0FDZixJQUFJLFVBQVUsQ0FBQyxjQUNiLElBQUksSUFBSSxPQUNSLFVBQVUsUUFBUTtBQUN4QjtBQUVBOzs7O0NBSUMsR0FDRCxPQUFPLGVBQWUsS0FBSyxLQUFhO0VBQ3RDLE9BQU8sVUFDTCxJQUFJLFdBQ0YsTUFBTSxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxRQUFRLE1BQU0sQ0FBQztBQUczRDtBQUVBOzs7O0NBSUMsR0FDRCxPQUFPLGVBQWUsY0FBYyxHQUFRO0VBQzFDLE1BQU0sZ0JBQWdCLGtCQUFrQjtFQUN4QyxNQUFNLGlCQUFpQixNQUFNLEtBQUssSUFBSSxRQUFRLEdBQUcsSUFBSSxNQUFNO0VBQzNELE9BQU8sS0FBSyxlQUFlO0FBQzdCO0FBRUE7Ozs7Q0FJQyxHQUNELE9BQU8sZUFBZSxPQUFPLFFBQWdCO0VBQzNDLElBQUk7SUFDRixNQUFNLFFBQVEsTUFBTSxLQUFLLEtBQUssQ0FBQztJQUMvQixPQUFPLE1BQU0sTUFBTTtFQUNyQixFQUFFLE9BQU8sS0FBSztJQUNaLElBQUksZUFBZSxLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUU7TUFDdkMsT0FBTztJQUNUO0lBQ0EsTUFBTTtFQUNSO0FBQ0Y7QUFFQSw0RUFBNEU7QUFDNUUsMEVBQTBFO0FBRTFFOztDQUVDLEdBQ0QsT0FBTyxTQUFTO0VBQ2QsT0FBUSxLQUFLLEtBQUssQ0FBQyxFQUFFO0lBQ25CLEtBQUs7TUFDSCxPQUFPLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQztJQUN0QixLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztNQUNILE9BQU8sS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDO0lBQ3RCO01BQ0UsTUFBTSxNQUFNO0VBQ2hCO0FBQ0Y7QUFFQTs7Q0FFQyxHQUNELE9BQU8sU0FBUztFQUNkLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRSxLQUFLLFVBQVU7SUFDOUIsTUFBTSxPQUFPO0lBQ2IsSUFBSSxNQUFNO01BQ1IsT0FBTyxLQUFLLE1BQU07SUFDcEI7RUFDRixPQUFPLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRSxLQUFLLFdBQVc7SUFDdEMsT0FBTyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUM7RUFDdEIsT0FBTztJQUNMLE1BQU0sWUFBWSxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUM7SUFDL0IsSUFBSSxXQUFXO01BQ2IsT0FBTztJQUNULE9BQU87TUFDTCxNQUFNLE9BQU87TUFDYixJQUFJLE1BQU07UUFDUixPQUFPLEtBQUssTUFBTTtNQUNwQjtJQUNGO0VBQ0Y7QUFDRjtBQUVBOztDQUVDLEdBQ0QsT0FBTyxTQUFTO0VBQ2QsTUFBTSxLQUFLLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQztFQUN4QixJQUFJO0VBQ0osSUFBSSxJQUFJO0lBQ04sT0FBTyxVQUFVLFdBQVcsTUFBTSxLQUFLLEtBQUssS0FBSyxHQUFHLElBQUk7RUFDMUQsT0FBTztJQUNMLE1BQU0sS0FBSztJQUNYLElBQUksSUFBSTtNQUNOLE9BQU8sS0FBSyxJQUFJO0lBQ2xCLE9BQU87TUFDTCxNQUFNLEtBQUs7TUFDWCxJQUFJLElBQUk7UUFDTixPQUFPLEtBQUssSUFBSTtNQUNsQjtJQUNGO0VBQ0Y7RUFFQSxPQUFPO0FBQ1QifQ==
// denoCacheMetadata=13237922657231230765,11487913841731566697