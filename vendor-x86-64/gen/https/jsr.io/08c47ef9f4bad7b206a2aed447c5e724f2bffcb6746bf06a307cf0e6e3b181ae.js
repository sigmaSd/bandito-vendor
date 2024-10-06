// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { _common } from "../_common/common.ts";
import { SEPARATOR } from "./constants.ts";
/** Determines the common path from a set of paths, using an optional separator,
 * which defaults to the OS default separator.
 *
 * ```ts
 *       import { common } from "@std/path";
 *       const p = common([
 *         "./deno/std/path/mod.ts",
 *         "./deno/std/fs/mod.ts",
 *       ]);
 *       console.log(p); // "./deno/std/"
 * ```
 */ export function common(paths, sep = SEPARATOR) {
  return _common(paths, sep);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIyMS4wL3dpbmRvd3MvY29tbW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IF9jb21tb24gfSBmcm9tIFwiLi4vX2NvbW1vbi9jb21tb24udHNcIjtcbmltcG9ydCB7IFNFUEFSQVRPUiB9IGZyb20gXCIuL2NvbnN0YW50cy50c1wiO1xuXG4vKiogRGV0ZXJtaW5lcyB0aGUgY29tbW9uIHBhdGggZnJvbSBhIHNldCBvZiBwYXRocywgdXNpbmcgYW4gb3B0aW9uYWwgc2VwYXJhdG9yLFxuICogd2hpY2ggZGVmYXVsdHMgdG8gdGhlIE9TIGRlZmF1bHQgc2VwYXJhdG9yLlxuICpcbiAqIGBgYHRzXG4gKiAgICAgICBpbXBvcnQgeyBjb21tb24gfSBmcm9tIFwiQHN0ZC9wYXRoXCI7XG4gKiAgICAgICBjb25zdCBwID0gY29tbW9uKFtcbiAqICAgICAgICAgXCIuL2Rlbm8vc3RkL3BhdGgvbW9kLnRzXCIsXG4gKiAgICAgICAgIFwiLi9kZW5vL3N0ZC9mcy9tb2QudHNcIixcbiAqICAgICAgIF0pO1xuICogICAgICAgY29uc29sZS5sb2cocCk7IC8vIFwiLi9kZW5vL3N0ZC9cIlxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21tb24oXG4gIHBhdGhzOiBzdHJpbmdbXSxcbiAgc2VwOiBzdHJpbmcgPSBTRVBBUkFUT1IsXG4pOiBzdHJpbmcge1xuICByZXR1cm4gX2NvbW1vbihwYXRocywgc2VwKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsT0FBTyxRQUFRLHVCQUF1QjtBQUMvQyxTQUFTLFNBQVMsUUFBUSxpQkFBaUI7QUFFM0M7Ozs7Ozs7Ozs7O0NBV0MsR0FDRCxPQUFPLFNBQVMsT0FDZCxLQUFlLEVBQ2YsTUFBYyxTQUFTO0VBRXZCLE9BQU8sUUFBUSxPQUFPO0FBQ3hCIn0=
// denoCacheMetadata=2218831606207042157,1419384773874199370