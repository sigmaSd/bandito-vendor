// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assertPath } from "../_common/assert_path.ts";
import { isPosixPathSeparator } from "./_util.ts";
/**
 * Verifies whether provided path is absolute
 * @param path to be verified as absolute
 */ export function isAbsolute(path) {
  assertPath(path);
  return path.length > 0 && isPosixPathSeparator(path.charCodeAt(0));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL3BhdGgvcG9zaXgvaXNfYWJzb2x1dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgYXNzZXJ0UGF0aCB9IGZyb20gXCIuLi9fY29tbW9uL2Fzc2VydF9wYXRoLnRzXCI7XG5pbXBvcnQgeyBpc1Bvc2l4UGF0aFNlcGFyYXRvciB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5cbi8qKlxuICogVmVyaWZpZXMgd2hldGhlciBwcm92aWRlZCBwYXRoIGlzIGFic29sdXRlXG4gKiBAcGFyYW0gcGF0aCB0byBiZSB2ZXJpZmllZCBhcyBhYnNvbHV0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNBYnNvbHV0ZShwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgcmV0dXJuIHBhdGgubGVuZ3RoID4gMCAmJiBpc1Bvc2l4UGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMCkpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxVQUFVLFFBQVEsNEJBQTRCO0FBQ3ZELFNBQVMsb0JBQW9CLFFBQVEsYUFBYTtBQUVsRDs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsV0FBVyxJQUFZO0VBQ3JDLFdBQVc7RUFDWCxPQUFPLEtBQUssTUFBTSxHQUFHLEtBQUsscUJBQXFCLEtBQUssVUFBVSxDQUFDO0FBQ2pFIn0=
// denoCacheMetadata=1511793629847441143,6020830604776463264