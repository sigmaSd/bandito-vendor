// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { isAbsolute as posixIsAbsolute } from "./posix/is_absolute.ts";
import { isAbsolute as windowsIsAbsolute } from "./windows/is_absolute.ts";
/**
 * Verifies whether provided path is absolute
 * @param path to be verified as absolute
 */ export function isAbsolute(path) {
  return isWindows ? windowsIsAbsolute(path) : posixIsAbsolute(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL2lzX2Fic29sdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuL19vcy50c1wiO1xuaW1wb3J0IHsgaXNBYnNvbHV0ZSBhcyBwb3NpeElzQWJzb2x1dGUgfSBmcm9tIFwiLi9wb3NpeC9pc19hYnNvbHV0ZS50c1wiO1xuaW1wb3J0IHsgaXNBYnNvbHV0ZSBhcyB3aW5kb3dzSXNBYnNvbHV0ZSB9IGZyb20gXCIuL3dpbmRvd3MvaXNfYWJzb2x1dGUudHNcIjtcblxuLyoqXG4gKiBWZXJpZmllcyB3aGV0aGVyIHByb3ZpZGVkIHBhdGggaXMgYWJzb2x1dGVcbiAqIEBwYXJhbSBwYXRoIHRvIGJlIHZlcmlmaWVkIGFzIGFic29sdXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0Fic29sdXRlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNXaW5kb3dzID8gd2luZG93c0lzQWJzb2x1dGUocGF0aCkgOiBwb3NpeElzQWJzb2x1dGUocGF0aCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsY0FBYyxlQUFlLFFBQVEseUJBQXlCO0FBQ3ZFLFNBQVMsY0FBYyxpQkFBaUIsUUFBUSwyQkFBMkI7QUFFM0U7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLFdBQVcsSUFBWTtFQUNyQyxPQUFPLFlBQVksa0JBQWtCLFFBQVEsZ0JBQWdCO0FBQy9EIn0=
// denoCacheMetadata=627895655804573502,2907761123984848139