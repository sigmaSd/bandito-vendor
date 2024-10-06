// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { parse as posixParse } from "./posix/parse.ts";
import { parse as windowsParse } from "./windows/parse.ts";
/**
 * Return a `ParsedPath` object of the `path`. Use `format` to reverse the result.
 *
 * @example
 * ```ts
 * import { parse } from "@std/path";
 *
 * const parsedPathObj = parse("/path/to/dir/script.ts");
 * parsedPathObj.root; // "/"
 * parsedPathObj.dir; // "/path/to/dir"
 * parsedPathObj.base; // "script.ts"
 * parsedPathObj.ext; // ".ts"
 * parsedPathObj.name; // "script"
 * ```
 * @param path to process
 */ export function parse(path) {
  return isWindows ? windowsParse(path) : posixParse(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIyMS4wL3BhcnNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuL19vcy50c1wiO1xuaW1wb3J0IHR5cGUgeyBQYXJzZWRQYXRoIH0gZnJvbSBcIi4vX2ludGVyZmFjZS50c1wiO1xuaW1wb3J0IHsgcGFyc2UgYXMgcG9zaXhQYXJzZSB9IGZyb20gXCIuL3Bvc2l4L3BhcnNlLnRzXCI7XG5pbXBvcnQgeyBwYXJzZSBhcyB3aW5kb3dzUGFyc2UgfSBmcm9tIFwiLi93aW5kb3dzL3BhcnNlLnRzXCI7XG5cbi8qKlxuICogUmV0dXJuIGEgYFBhcnNlZFBhdGhgIG9iamVjdCBvZiB0aGUgYHBhdGhgLiBVc2UgYGZvcm1hdGAgdG8gcmV2ZXJzZSB0aGUgcmVzdWx0LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiQHN0ZC9wYXRoXCI7XG4gKlxuICogY29uc3QgcGFyc2VkUGF0aE9iaiA9IHBhcnNlKFwiL3BhdGgvdG8vZGlyL3NjcmlwdC50c1wiKTtcbiAqIHBhcnNlZFBhdGhPYmoucm9vdDsgLy8gXCIvXCJcbiAqIHBhcnNlZFBhdGhPYmouZGlyOyAvLyBcIi9wYXRoL3RvL2RpclwiXG4gKiBwYXJzZWRQYXRoT2JqLmJhc2U7IC8vIFwic2NyaXB0LnRzXCJcbiAqIHBhcnNlZFBhdGhPYmouZXh0OyAvLyBcIi50c1wiXG4gKiBwYXJzZWRQYXRoT2JqLm5hbWU7IC8vIFwic2NyaXB0XCJcbiAqIGBgYFxuICogQHBhcmFtIHBhdGggdG8gcHJvY2Vzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UocGF0aDogc3RyaW5nKTogUGFyc2VkUGF0aCB7XG4gIHJldHVybiBpc1dpbmRvd3MgPyB3aW5kb3dzUGFyc2UocGF0aCkgOiBwb3NpeFBhcnNlKHBhdGgpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxTQUFTLFFBQVEsV0FBVztBQUVyQyxTQUFTLFNBQVMsVUFBVSxRQUFRLG1CQUFtQjtBQUN2RCxTQUFTLFNBQVMsWUFBWSxRQUFRLHFCQUFxQjtBQUUzRDs7Ozs7Ozs7Ozs7Ozs7O0NBZUMsR0FDRCxPQUFPLFNBQVMsTUFBTSxJQUFZO0VBQ2hDLE9BQU8sWUFBWSxhQUFhLFFBQVEsV0FBVztBQUNyRCJ9
// denoCacheMetadata=14513346339758975120,11855894808713226596