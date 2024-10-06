// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { dirname as posixDirname } from "./posix/dirname.ts";
import { dirname as windowsDirname } from "./windows/dirname.ts";
/**
 * Return the directory path of a `path`.
 * @param path - path to extract the directory from.
 */ export function dirname(path) {
  return isWindows ? windowsDirname(path) : posixDirname(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL3BhdGgvZGlybmFtZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi9fb3MudHNcIjtcbmltcG9ydCB7IGRpcm5hbWUgYXMgcG9zaXhEaXJuYW1lIH0gZnJvbSBcIi4vcG9zaXgvZGlybmFtZS50c1wiO1xuaW1wb3J0IHsgZGlybmFtZSBhcyB3aW5kb3dzRGlybmFtZSB9IGZyb20gXCIuL3dpbmRvd3MvZGlybmFtZS50c1wiO1xuXG4vKipcbiAqIFJldHVybiB0aGUgZGlyZWN0b3J5IHBhdGggb2YgYSBgcGF0aGAuXG4gKiBAcGFyYW0gcGF0aCAtIHBhdGggdG8gZXh0cmFjdCB0aGUgZGlyZWN0b3J5IGZyb20uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJuYW1lKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpc1dpbmRvd3MgPyB3aW5kb3dzRGlybmFtZShwYXRoKSA6IHBvc2l4RGlybmFtZShwYXRoKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsU0FBUyxRQUFRLFdBQVc7QUFDckMsU0FBUyxXQUFXLFlBQVksUUFBUSxxQkFBcUI7QUFDN0QsU0FBUyxXQUFXLGNBQWMsUUFBUSx1QkFBdUI7QUFFakU7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLFFBQVEsSUFBWTtFQUNsQyxPQUFPLFlBQVksZUFBZSxRQUFRLGFBQWE7QUFDekQifQ==
// denoCacheMetadata=15341299607046550970,10485765057129004260