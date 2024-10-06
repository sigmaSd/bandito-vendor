// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { normalizeGlob as posixNormalizeGlob } from "./posix/normalize_glob.ts";
import { normalizeGlob as windowsNormalizeGlob } from "./windows/normalize_glob.ts";
/** Like normalize(), but doesn't collapse "**\/.." when `globstar` is true. */ export function normalizeGlob(glob, options = {}) {
  return isWindows ? windowsNormalizeGlob(glob, options) : posixNormalizeGlob(glob, options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL25vcm1hbGl6ZV9nbG9iLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB0eXBlIHsgR2xvYk9wdGlvbnMgfSBmcm9tIFwiLi9fY29tbW9uL2dsb2JfdG9fcmVnX2V4cC50c1wiO1xuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgeyBub3JtYWxpemVHbG9iIGFzIHBvc2l4Tm9ybWFsaXplR2xvYiB9IGZyb20gXCIuL3Bvc2l4L25vcm1hbGl6ZV9nbG9iLnRzXCI7XG5pbXBvcnQge1xuICBub3JtYWxpemVHbG9iIGFzIHdpbmRvd3NOb3JtYWxpemVHbG9iLFxufSBmcm9tIFwiLi93aW5kb3dzL25vcm1hbGl6ZV9nbG9iLnRzXCI7XG5cbi8qKiBMaWtlIG5vcm1hbGl6ZSgpLCBidXQgZG9lc24ndCBjb2xsYXBzZSBcIioqXFwvLi5cIiB3aGVuIGBnbG9ic3RhcmAgaXMgdHJ1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVHbG9iKFxuICBnbG9iOiBzdHJpbmcsXG4gIG9wdGlvbnM6IEdsb2JPcHRpb25zID0ge30sXG4pOiBzdHJpbmcge1xuICByZXR1cm4gaXNXaW5kb3dzXG4gICAgPyB3aW5kb3dzTm9ybWFsaXplR2xvYihnbG9iLCBvcHRpb25zKVxuICAgIDogcG9zaXhOb3JtYWxpemVHbG9iKGdsb2IsIG9wdGlvbnMpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFHckMsU0FBUyxTQUFTLFFBQVEsV0FBVztBQUNyQyxTQUFTLGlCQUFpQixrQkFBa0IsUUFBUSw0QkFBNEI7QUFDaEYsU0FDRSxpQkFBaUIsb0JBQW9CLFFBQ2hDLDhCQUE4QjtBQUVyQyw2RUFBNkUsR0FDN0UsT0FBTyxTQUFTLGNBQ2QsSUFBWSxFQUNaLFVBQXVCLENBQUMsQ0FBQztFQUV6QixPQUFPLFlBQ0gscUJBQXFCLE1BQU0sV0FDM0IsbUJBQW1CLE1BQU07QUFDL0IifQ==
// denoCacheMetadata=8878461608007888901,10414622610497928472