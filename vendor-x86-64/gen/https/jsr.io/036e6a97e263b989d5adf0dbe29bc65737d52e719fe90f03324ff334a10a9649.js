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
 * @deprecated (will be removed in 0.215.0) Use {@linkcode SEPARATOR} from {@link https://deno.land/std/path/windows/constants.ts} instead.
 */ export const sep = "\\";
/**
 * @deprecated (will be removed in 0.215.0) Use {@linkcode DELIMITER} from {@link https://deno.land/std/path/windows/constants.ts} instead.
 */ export const delimiter = ";";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL3dpbmRvd3MvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgdGhlIEJyb3dzZXJpZnkgYXV0aG9ycy4gTUlUIExpY2Vuc2UuXG4vLyBQb3J0ZWQgbW9zdGx5IGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Jyb3dzZXJpZnkvcGF0aC1icm93c2VyaWZ5L1xuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIE9TLXNwZWNpZmljIGZpbGUgcGF0aHMuXG4gKlxuICogQ29kZXMgaW4gdGhlIGV4YW1wbGVzIHVzZXMgUE9TSVggcGF0aCBidXQgaXQgYXV0b21hdGljYWxseSB1c2UgV2luZG93cyBwYXRoXG4gKiBvbiBXaW5kb3dzLiBVc2UgbWV0aG9kcyB1bmRlciBgcG9zaXhgIG9yIGB3aW4zMmAgb2JqZWN0IGluc3RlYWQgdG8gaGFuZGxlIG5vblxuICogcGxhdGZvcm0gc3BlY2lmaWMgcGF0aCBsaWtlOlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHBvc2l4LCB3aW4zMiB9IGZyb20gXCJAc3RkL3BhdGhcIjtcbiAqIGNvbnN0IHAxID0gcG9zaXguZnJvbUZpbGVVcmwoXCJmaWxlOi8vL2hvbWUvZm9vXCIpO1xuICogY29uc3QgcDIgPSB3aW4zMi5mcm9tRmlsZVVybChcImZpbGU6Ly8vaG9tZS9mb29cIik7XG4gKiBjb25zb2xlLmxvZyhwMSk7IC8vIFwiL2hvbWUvZm9vXCJcbiAqIGNvbnNvbGUubG9nKHAyKTsgLy8gXCJcXFxcaG9tZVxcXFxmb29cIlxuICogYGBgXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG4vKipcbiAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgaW4gMC4yMTUuMCkgVXNlIHtAbGlua2NvZGUgU0VQQVJBVE9SfSBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvcGF0aC93aW5kb3dzL2NvbnN0YW50cy50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHNlcCA9IFwiXFxcXFwiO1xuXG4vKipcbiAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgaW4gMC4yMTUuMCkgVXNlIHtAbGlua2NvZGUgREVMSU1JVEVSfSBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvcGF0aC93aW5kb3dzL2NvbnN0YW50cy50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGNvbnN0IGRlbGltaXRlciA9IFwiO1wiO1xuXG5leHBvcnQgKiBmcm9tIFwiLi9iYXNlbmFtZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vY29uc3RhbnRzLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9kaXJuYW1lLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9leHRuYW1lLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9mb3JtYXQudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2Zyb21fZmlsZV91cmwudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2lzX2Fic29sdXRlLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9qb2luLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9ub3JtYWxpemUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3BhcnNlLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9yZWxhdGl2ZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVzb2x2ZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vdG9fZmlsZV91cmwudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3RvX25hbWVzcGFjZWRfcGF0aC50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vY29tbW9uLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9zZXBhcmF0b3IudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuLy4uL19pbnRlcmZhY2UudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2dsb2JfdG9fcmVnZXhwLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9pc19nbG9iLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9qb2luX2dsb2JzLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9ub3JtYWxpemVfZ2xvYi50c1wiO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxpREFBaUQ7QUFDakQsb0VBQW9FO0FBQ3BFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpQkMsR0FFRDs7Q0FFQyxHQUNELE9BQU8sTUFBTSxNQUFNLEtBQUs7QUFFeEI7O0NBRUMsR0FDRCxPQUFPLE1BQU0sWUFBWSxJQUFJO0FBRTdCLGNBQWMsZ0JBQWdCO0FBQzlCLGNBQWMsaUJBQWlCO0FBQy9CLGNBQWMsZUFBZTtBQUM3QixjQUFjLGVBQWU7QUFDN0IsY0FBYyxjQUFjO0FBQzVCLGNBQWMscUJBQXFCO0FBQ25DLGNBQWMsbUJBQW1CO0FBQ2pDLGNBQWMsWUFBWTtBQUMxQixjQUFjLGlCQUFpQjtBQUMvQixjQUFjLGFBQWE7QUFDM0IsY0FBYyxnQkFBZ0I7QUFDOUIsY0FBYyxlQUFlO0FBQzdCLGNBQWMsbUJBQW1CO0FBQ2pDLGNBQWMsMEJBQTBCO0FBQ3hDLGNBQWMsY0FBYztBQUM1QixjQUFjLGlCQUFpQjtBQUMvQixjQUFjLHFCQUFxQjtBQUNuQyxjQUFjLHNCQUFzQjtBQUNwQyxjQUFjLGVBQWU7QUFDN0IsY0FBYyxrQkFBa0I7QUFDaEMsY0FBYyxzQkFBc0IifQ==
// denoCacheMetadata=10089536377381586784,7065337866497892258