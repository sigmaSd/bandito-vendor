// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
/**
 * Get a human readable file type string.
 *
 * @param fileInfo A FileInfo describes a file and is returned by `stat`,
 *                 `lstat`
 */ export function getFileInfoType(fileInfo) {
  return fileInfo.isFile ? "file" : fileInfo.isDirectory ? "dir" : fileInfo.isSymlink ? "symlink" : undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZnMvMC4yMjEuMC9fZ2V0X2ZpbGVfaW5mb190eXBlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgdGhlIEJyb3dzZXJpZnkgYXV0aG9ycy4gTUlUIExpY2Vuc2UuXG5cbmV4cG9ydCB0eXBlIFBhdGhUeXBlID0gXCJmaWxlXCIgfCBcImRpclwiIHwgXCJzeW1saW5rXCI7XG5cbi8qKlxuICogR2V0IGEgaHVtYW4gcmVhZGFibGUgZmlsZSB0eXBlIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gZmlsZUluZm8gQSBGaWxlSW5mbyBkZXNjcmliZXMgYSBmaWxlIGFuZCBpcyByZXR1cm5lZCBieSBgc3RhdGAsXG4gKiAgICAgICAgICAgICAgICAgYGxzdGF0YFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmlsZUluZm9UeXBlKGZpbGVJbmZvOiBEZW5vLkZpbGVJbmZvKTogUGF0aFR5cGUgfCB1bmRlZmluZWQge1xuICByZXR1cm4gZmlsZUluZm8uaXNGaWxlXG4gICAgPyBcImZpbGVcIlxuICAgIDogZmlsZUluZm8uaXNEaXJlY3RvcnlcbiAgICA/IFwiZGlyXCJcbiAgICA6IGZpbGVJbmZvLmlzU3ltbGlua1xuICAgID8gXCJzeW1saW5rXCJcbiAgICA6IHVuZGVmaW5lZDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsaURBQWlEO0FBSWpEOzs7OztDQUtDLEdBQ0QsT0FBTyxTQUFTLGdCQUFnQixRQUF1QjtFQUNyRCxPQUFPLFNBQVMsTUFBTSxHQUNsQixTQUNBLFNBQVMsV0FBVyxHQUNwQixRQUNBLFNBQVMsU0FBUyxHQUNsQixZQUNBO0FBQ04ifQ==
// denoCacheMetadata=5442710860443937147,5836708987057769056