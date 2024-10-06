// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// This module is browser compatible.
/**
 * Utilities for working with OS-specific file paths.
 *
 * Functions from this module will automatically switch to support the path style
 * of the current OS, either `windows` for Microsoft Windows, or `posix` for
 * every other operating system, eg. Linux, MacOS, BSD etc.
 *
 * To use functions for a specific path style regardless of the current OS
 * import the modules from the platform sub directory instead.
 *
 * Example, for `posix`:
 *
 * ```ts
 * import { fromFileUrl } from "@std/path/posix/from_file_url";
 * const p = fromFileUrl("file:///home/foo");
 * console.log(p); // "/home/foo"
 * ```
 *
 * or, for `windows`:
 *
 * ```ts
 * import { fromFileUrl } from "@std/path/windows/from_file_url";
 * const p = fromFileUrl("file:///home/foo");
 * console.log(p); // "\\home\\foo"
 * ```
 *
 * This module is browser compatible.
 *
 * @module
 */ import * as _windows from "./windows/mod.ts";
import * as _posix from "./posix/mod.ts";
import { DELIMITER, SEPARATOR } from "./constants.ts";
/** @deprecated (will be removed after 1.0.0) Import from {@link https://deno.land/std/path/windows/mod.ts} instead. */ export const win32 = _windows;
/** @deprecated (will be removed after 1.0.0) Import from {@link https://deno.land/std/posix/mod.ts} instead. */ export const posix = _posix;
/**
 * @deprecated (will be removed in 0.215.0) Use {@linkcode SEPARATOR} instead.
 */ export const sep = SEPARATOR;
/**
 * @deprecated (will be removed in 0.215.0) Use {@linkcode DELIMITER} instead.
 */ export const delimiter = DELIMITER;
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
export * from "./_interface.ts";
export * from "./glob_to_regexp.ts";
export * from "./is_glob.ts";
export * from "./join_globs.ts";
export * from "./normalize_glob.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IHRoZSBCcm93c2VyaWZ5IGF1dGhvcnMuIE1JVCBMaWNlbnNlLlxuLy8gUG9ydGVkIG1vc3RseSBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93c2VyaWZ5L3BhdGgtYnJvd3NlcmlmeS9cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBVdGlsaXRpZXMgZm9yIHdvcmtpbmcgd2l0aCBPUy1zcGVjaWZpYyBmaWxlIHBhdGhzLlxuICpcbiAqIEZ1bmN0aW9ucyBmcm9tIHRoaXMgbW9kdWxlIHdpbGwgYXV0b21hdGljYWxseSBzd2l0Y2ggdG8gc3VwcG9ydCB0aGUgcGF0aCBzdHlsZVxuICogb2YgdGhlIGN1cnJlbnQgT1MsIGVpdGhlciBgd2luZG93c2AgZm9yIE1pY3Jvc29mdCBXaW5kb3dzLCBvciBgcG9zaXhgIGZvclxuICogZXZlcnkgb3RoZXIgb3BlcmF0aW5nIHN5c3RlbSwgZWcuIExpbnV4LCBNYWNPUywgQlNEIGV0Yy5cbiAqXG4gKiBUbyB1c2UgZnVuY3Rpb25zIGZvciBhIHNwZWNpZmljIHBhdGggc3R5bGUgcmVnYXJkbGVzcyBvZiB0aGUgY3VycmVudCBPU1xuICogaW1wb3J0IHRoZSBtb2R1bGVzIGZyb20gdGhlIHBsYXRmb3JtIHN1YiBkaXJlY3RvcnkgaW5zdGVhZC5cbiAqXG4gKiBFeGFtcGxlLCBmb3IgYHBvc2l4YDpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZnJvbUZpbGVVcmwgfSBmcm9tIFwiQHN0ZC9wYXRoL3Bvc2l4L2Zyb21fZmlsZV91cmxcIjtcbiAqIGNvbnN0IHAgPSBmcm9tRmlsZVVybChcImZpbGU6Ly8vaG9tZS9mb29cIik7XG4gKiBjb25zb2xlLmxvZyhwKTsgLy8gXCIvaG9tZS9mb29cIlxuICogYGBgXG4gKlxuICogb3IsIGZvciBgd2luZG93c2A6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGZyb21GaWxlVXJsIH0gZnJvbSBcIkBzdGQvcGF0aC93aW5kb3dzL2Zyb21fZmlsZV91cmxcIjtcbiAqIGNvbnN0IHAgPSBmcm9tRmlsZVVybChcImZpbGU6Ly8vaG9tZS9mb29cIik7XG4gKiBjb25zb2xlLmxvZyhwKTsgLy8gXCJcXFxcaG9tZVxcXFxmb29cIlxuICogYGBgXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgKiBhcyBfd2luZG93cyBmcm9tIFwiLi93aW5kb3dzL21vZC50c1wiO1xuaW1wb3J0ICogYXMgX3Bvc2l4IGZyb20gXCIuL3Bvc2l4L21vZC50c1wiO1xuaW1wb3J0IHsgREVMSU1JVEVSLCBTRVBBUkFUT1IgfSBmcm9tIFwiLi9jb25zdGFudHMudHNcIjtcblxuLyoqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMS4wLjApIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvcGF0aC93aW5kb3dzL21vZC50c30gaW5zdGVhZC4gKi9cbmV4cG9ydCBjb25zdCB3aW4zMjogdHlwZW9mIF93aW5kb3dzID0gX3dpbmRvd3M7XG5cbi8qKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGFmdGVyIDEuMC4wKSBJbXBvcnQgZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL3Bvc2l4L21vZC50c30gaW5zdGVhZC4gKi9cbmV4cG9ydCBjb25zdCBwb3NpeDogdHlwZW9mIF9wb3NpeCA9IF9wb3NpeDtcblxuLyoqXG4gKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGluIDAuMjE1LjApIFVzZSB7QGxpbmtjb2RlIFNFUEFSQVRPUn0gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHNlcCA9IFNFUEFSQVRPUjtcblxuLyoqXG4gKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGluIDAuMjE1LjApIFVzZSB7QGxpbmtjb2RlIERFTElNSVRFUn0gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGNvbnN0IGRlbGltaXRlciA9IERFTElNSVRFUjtcblxuZXhwb3J0ICogZnJvbSBcIi4vYmFzZW5hbWUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2NvbnN0YW50cy50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZGlybmFtZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZXh0bmFtZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZm9ybWF0LnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9mcm9tX2ZpbGVfdXJsLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9pc19hYnNvbHV0ZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vam9pbi50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vbm9ybWFsaXplLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9wYXJzZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVsYXRpdmUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3Jlc29sdmUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3RvX2ZpbGVfdXJsLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi90b19uYW1lc3BhY2VkX3BhdGgudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2NvbW1vbi50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vc2VwYXJhdG9yLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9faW50ZXJmYWNlLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9nbG9iX3RvX3JlZ2V4cC50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vaXNfZ2xvYi50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vam9pbl9nbG9icy50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vbm9ybWFsaXplX2dsb2IudHNcIjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsaURBQWlEO0FBQ2pELG9FQUFvRTtBQUNwRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNkJDLEdBRUQsWUFBWSxjQUFjLG1CQUFtQjtBQUM3QyxZQUFZLFlBQVksaUJBQWlCO0FBQ3pDLFNBQVMsU0FBUyxFQUFFLFNBQVMsUUFBUSxpQkFBaUI7QUFFdEQscUhBQXFILEdBQ3JILE9BQU8sTUFBTSxRQUF5QixTQUFTO0FBRS9DLDhHQUE4RyxHQUM5RyxPQUFPLE1BQU0sUUFBdUIsT0FBTztBQUUzQzs7Q0FFQyxHQUNELE9BQU8sTUFBTSxNQUFNLFVBQVU7QUFFN0I7O0NBRUMsR0FDRCxPQUFPLE1BQU0sWUFBWSxVQUFVO0FBRW5DLGNBQWMsZ0JBQWdCO0FBQzlCLGNBQWMsaUJBQWlCO0FBQy9CLGNBQWMsZUFBZTtBQUM3QixjQUFjLGVBQWU7QUFDN0IsY0FBYyxjQUFjO0FBQzVCLGNBQWMscUJBQXFCO0FBQ25DLGNBQWMsbUJBQW1CO0FBQ2pDLGNBQWMsWUFBWTtBQUMxQixjQUFjLGlCQUFpQjtBQUMvQixjQUFjLGFBQWE7QUFDM0IsY0FBYyxnQkFBZ0I7QUFDOUIsY0FBYyxlQUFlO0FBQzdCLGNBQWMsbUJBQW1CO0FBQ2pDLGNBQWMsMEJBQTBCO0FBQ3hDLGNBQWMsY0FBYztBQUM1QixjQUFjLGlCQUFpQjtBQUMvQixjQUFjLGtCQUFrQjtBQUNoQyxjQUFjLHNCQUFzQjtBQUNwQyxjQUFjLGVBQWU7QUFDN0IsY0FBYyxrQkFBa0I7QUFDaEMsY0FBYyxzQkFBc0IifQ==
// denoCacheMetadata=16395086940476969168,11878185410144884021