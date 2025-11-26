// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// This module is browser compatible.
/**
 * Utilities for working with OS-specific file paths.
 *
 * Codes in the examples uses POSIX path but it automatically use Windows path
 * on Windows. Use methods under `posix` or `win32` object instead to handle non
 * platform specific path like:
 * ```ts
 * import { posix, win32 } from "@std/path";
 * const p1 = posix.fromFileUrl("file:///home/foo");
 * const p2 = win32.fromFileUrl("file:///home/foo");
 * console.log(p1); // "/home/foo"
 * console.log(p2); // "\\home\\foo"
 * ```
 *
 * This module is browser compatible.
 *
 * @module
 */ /**
 * @deprecated (will be removed in 0.215.0) Use {@linkcode SEPARATOR} from {@link https://deno.land/std/path/posix/constants.ts} instead.
 */ export const sep = "/";
/**
 * @deprecated (will be removed in 0.215.0) Use {@linkcode DELIMITER} from {@link https://deno.land/std/path/posix/constants.ts} instead.
 */ export const delimiter = "/";
export * from "./basename.ts";
export * from "./constants.ts";
export * from "./dirname.ts";
export * from "./extname.ts";
export * from "./format.ts";
export * from "./from_file_url.ts";
export * from "./is_absolute.ts";
export * from "./join.ts";
export * from "./normalize.ts";
export * from "./parse.ts";
export * from "./relative.ts";
export * from "./resolve.ts";
export * from "./to_file_url.ts";
export * from "./to_namespaced_path.ts";
export * from "./common.ts";
export * from "./separator.ts";
export * from "./../_interface.ts";
export * from "./glob_to_regexp.ts";
export * from "./is_glob.ts";
export * from "./join_globs.ts";
export * from "./normalize_glob.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL3Bvc2l4L21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IHRoZSBCcm93c2VyaWZ5IGF1dGhvcnMuIE1JVCBMaWNlbnNlLlxuLy8gUG9ydGVkIG1vc3RseSBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93c2VyaWZ5L3BhdGgtYnJvd3NlcmlmeS9cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBVdGlsaXRpZXMgZm9yIHdvcmtpbmcgd2l0aCBPUy1zcGVjaWZpYyBmaWxlIHBhdGhzLlxuICpcbiAqIENvZGVzIGluIHRoZSBleGFtcGxlcyB1c2VzIFBPU0lYIHBhdGggYnV0IGl0IGF1dG9tYXRpY2FsbHkgdXNlIFdpbmRvd3MgcGF0aFxuICogb24gV2luZG93cy4gVXNlIG1ldGhvZHMgdW5kZXIgYHBvc2l4YCBvciBgd2luMzJgIG9iamVjdCBpbnN0ZWFkIHRvIGhhbmRsZSBub25cbiAqIHBsYXRmb3JtIHNwZWNpZmljIHBhdGggbGlrZTpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwb3NpeCwgd2luMzIgfSBmcm9tIFwiQHN0ZC9wYXRoXCI7XG4gKiBjb25zdCBwMSA9IHBvc2l4LmZyb21GaWxlVXJsKFwiZmlsZTovLy9ob21lL2Zvb1wiKTtcbiAqIGNvbnN0IHAyID0gd2luMzIuZnJvbUZpbGVVcmwoXCJmaWxlOi8vL2hvbWUvZm9vXCIpO1xuICogY29uc29sZS5sb2cocDEpOyAvLyBcIi9ob21lL2Zvb1wiXG4gKiBjb25zb2xlLmxvZyhwMik7IC8vIFwiXFxcXGhvbWVcXFxcZm9vXCJcbiAqIGBgYFxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGluIDAuMjE1LjApIFVzZSB7QGxpbmtjb2RlIFNFUEFSQVRPUn0gZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL3BhdGgvcG9zaXgvY29uc3RhbnRzLnRzfSBpbnN0ZWFkLlxuICovXG5leHBvcnQgY29uc3Qgc2VwID0gXCIvXCI7XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBpbiAwLjIxNS4wKSBVc2Uge0BsaW5rY29kZSBERUxJTUlURVJ9IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoL3Bvc2l4L2NvbnN0YW50cy50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGNvbnN0IGRlbGltaXRlciA9IFwiL1wiO1xuXG5leHBvcnQgKiBmcm9tIFwiLi9iYXNlbmFtZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vY29uc3RhbnRzLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9kaXJuYW1lLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9leHRuYW1lLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9mb3JtYXQudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2Zyb21fZmlsZV91cmwudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2lzX2Fic29sdXRlLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9qb2luLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9ub3JtYWxpemUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3BhcnNlLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9yZWxhdGl2ZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVzb2x2ZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vdG9fZmlsZV91cmwudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3RvX25hbWVzcGFjZWRfcGF0aC50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vY29tbW9uLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9zZXBhcmF0b3IudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuLy4uL19pbnRlcmZhY2UudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2dsb2JfdG9fcmVnZXhwLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9pc19nbG9iLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9qb2luX2dsb2JzLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9ub3JtYWxpemVfZ2xvYi50c1wiO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxpREFBaUQ7QUFDakQsb0VBQW9FO0FBQ3BFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpQkMsR0FFRDs7Q0FFQyxHQUNELE9BQU8sTUFBTSxNQUFNLElBQUk7QUFFdkI7O0NBRUMsR0FDRCxPQUFPLE1BQU0sWUFBWSxJQUFJO0FBRTdCLGNBQWMsZ0JBQWdCO0FBQzlCLGNBQWMsaUJBQWlCO0FBQy9CLGNBQWMsZUFBZTtBQUM3QixjQUFjLGVBQWU7QUFDN0IsY0FBYyxjQUFjO0FBQzVCLGNBQWMscUJBQXFCO0FBQ25DLGNBQWMsbUJBQW1CO0FBQ2pDLGNBQWMsWUFBWTtBQUMxQixjQUFjLGlCQUFpQjtBQUMvQixjQUFjLGFBQWE7QUFDM0IsY0FBYyxnQkFBZ0I7QUFDOUIsY0FBYyxlQUFlO0FBQzdCLGNBQWMsbUJBQW1CO0FBQ2pDLGNBQWMsMEJBQTBCO0FBQ3hDLGNBQWMsY0FBYztBQUM1QixjQUFjLGlCQUFpQjtBQUMvQixjQUFjLHFCQUFxQjtBQUNuQyxjQUFjLHNCQUFzQjtBQUNwQyxjQUFjLGVBQWU7QUFDN0IsY0FBYyxrQkFBa0I7QUFDaEMsY0FBYyxzQkFBc0IifQ==
// denoCacheMetadata=5293476296905691340,4225640702103589261