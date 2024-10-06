// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { encodeWhitespace } from "./../_common/to_file_url.ts";
import { isAbsolute } from "./is_absolute.ts";
/**
 * Converts a path string to a file URL.
 *
 * ```ts
 * import { toFileUrl } from "@std/path/posix/to_file_url";
 *
 * toFileUrl("/home/foo"); // new URL("file:///home/foo")
 * ```
 * @param path to convert to file URL
 */ export function toFileUrl(path) {
  if (!isAbsolute(path)) {
    throw new TypeError("Must be an absolute path.");
  }
  const url = new URL("file:///");
  url.pathname = encodeWhitespace(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
  return url;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL3Bvc2l4L3RvX2ZpbGVfdXJsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGVuY29kZVdoaXRlc3BhY2UgfSBmcm9tIFwiLi8uLi9fY29tbW9uL3RvX2ZpbGVfdXJsLnRzXCI7XG5pbXBvcnQgeyBpc0Fic29sdXRlIH0gZnJvbSBcIi4vaXNfYWJzb2x1dGUudHNcIjtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIHBhdGggc3RyaW5nIHRvIGEgZmlsZSBVUkwuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHRvRmlsZVVybCB9IGZyb20gXCJAc3RkL3BhdGgvcG9zaXgvdG9fZmlsZV91cmxcIjtcbiAqXG4gKiB0b0ZpbGVVcmwoXCIvaG9tZS9mb29cIik7IC8vIG5ldyBVUkwoXCJmaWxlOi8vL2hvbWUvZm9vXCIpXG4gKiBgYGBcbiAqIEBwYXJhbSBwYXRoIHRvIGNvbnZlcnQgdG8gZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRmlsZVVybChwYXRoOiBzdHJpbmcpOiBVUkwge1xuICBpZiAoIWlzQWJzb2x1dGUocGF0aCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTXVzdCBiZSBhbiBhYnNvbHV0ZSBwYXRoLlwiKTtcbiAgfVxuXG4gIGNvbnN0IHVybCA9IG5ldyBVUkwoXCJmaWxlOi8vL1wiKTtcbiAgdXJsLnBhdGhuYW1lID0gZW5jb2RlV2hpdGVzcGFjZShcbiAgICBwYXRoLnJlcGxhY2UoLyUvZywgXCIlMjVcIikucmVwbGFjZSgvXFxcXC9nLCBcIiU1Q1wiKSxcbiAgKTtcbiAgcmV0dXJuIHVybDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsZ0JBQWdCLFFBQVEsOEJBQThCO0FBQy9ELFNBQVMsVUFBVSxRQUFRLG1CQUFtQjtBQUU5Qzs7Ozs7Ozs7O0NBU0MsR0FDRCxPQUFPLFNBQVMsVUFBVSxJQUFZO0VBQ3BDLElBQUksQ0FBQyxXQUFXLE9BQU87SUFDckIsTUFBTSxJQUFJLFVBQVU7RUFDdEI7RUFFQSxNQUFNLE1BQU0sSUFBSSxJQUFJO0VBQ3BCLElBQUksUUFBUSxHQUFHLGlCQUNiLEtBQUssT0FBTyxDQUFDLE1BQU0sT0FBTyxPQUFPLENBQUMsT0FBTztFQUUzQyxPQUFPO0FBQ1QifQ==
// denoCacheMetadata=11352608843055604651,11268175631575505210