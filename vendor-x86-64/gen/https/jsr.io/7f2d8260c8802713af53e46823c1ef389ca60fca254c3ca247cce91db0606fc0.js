// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { format as posixFormat } from "./posix/format.ts";
import { format as windowsFormat } from "./windows/format.ts";
/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */ export function format(pathObject) {
  return isWindows ? windowsFormat(pathObject) : posixFormat(pathObject);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL2Zvcm1hdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi9fb3MudHNcIjtcbmltcG9ydCB7IGZvcm1hdCBhcyBwb3NpeEZvcm1hdCB9IGZyb20gXCIuL3Bvc2l4L2Zvcm1hdC50c1wiO1xuaW1wb3J0IHsgZm9ybWF0IGFzIHdpbmRvd3NGb3JtYXQgfSBmcm9tIFwiLi93aW5kb3dzL2Zvcm1hdC50c1wiO1xuaW1wb3J0IHsgRm9ybWF0SW5wdXRQYXRoT2JqZWN0IH0gZnJvbSBcIi4vX2ludGVyZmFjZS50c1wiO1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgcGF0aCBmcm9tIGBGb3JtYXRJbnB1dFBhdGhPYmplY3RgIG9iamVjdC5cbiAqIEBwYXJhbSBwYXRoT2JqZWN0IHdpdGggcGF0aFxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0KHBhdGhPYmplY3Q6IEZvcm1hdElucHV0UGF0aE9iamVjdCk6IHN0cmluZyB7XG4gIHJldHVybiBpc1dpbmRvd3MgPyB3aW5kb3dzRm9ybWF0KHBhdGhPYmplY3QpIDogcG9zaXhGb3JtYXQocGF0aE9iamVjdCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsVUFBVSxXQUFXLFFBQVEsb0JBQW9CO0FBQzFELFNBQVMsVUFBVSxhQUFhLFFBQVEsc0JBQXNCO0FBRzlEOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxPQUFPLFVBQWlDO0VBQ3RELE9BQU8sWUFBWSxjQUFjLGNBQWMsWUFBWTtBQUM3RCJ9
// denoCacheMetadata=967320444095819136,9959760040422263410