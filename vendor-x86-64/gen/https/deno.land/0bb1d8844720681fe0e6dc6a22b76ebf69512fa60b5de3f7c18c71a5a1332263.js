// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { types } from "./_db.ts";
/**
 * Returns the media type associated with the file extension. Values are
 * normalized to lower case and matched irrespective of a leading `.`.
 *
 * When `extension` has no associated type, the function returns `undefined`.
 *
 * @example
 * ```ts
 * import { typeByExtension } from "https://deno.land/std@$STD_VERSION/media_types/type_by_extension.ts";
 *
 * typeByExtension("js"); // "application/json"
 * typeByExtension(".HTML"); // "text/html"
 * typeByExtension("foo"); // undefined
 * typeByExtension("file.json"); // undefined
 * ```
 */ export function typeByExtension(extension) {
  extension = extension.startsWith(".") ? extension.slice(1) : extension;
  // @ts-ignore workaround around denoland/dnt#148
  return types.get(extension.toLowerCase());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL21lZGlhX3R5cGVzL3R5cGVfYnlfZXh0ZW5zaW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IHR5cGVzIH0gZnJvbSBcIi4vX2RiLnRzXCI7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWVkaWEgdHlwZSBhc3NvY2lhdGVkIHdpdGggdGhlIGZpbGUgZXh0ZW5zaW9uLiBWYWx1ZXMgYXJlXG4gKiBub3JtYWxpemVkIHRvIGxvd2VyIGNhc2UgYW5kIG1hdGNoZWQgaXJyZXNwZWN0aXZlIG9mIGEgbGVhZGluZyBgLmAuXG4gKlxuICogV2hlbiBgZXh0ZW5zaW9uYCBoYXMgbm8gYXNzb2NpYXRlZCB0eXBlLCB0aGUgZnVuY3Rpb24gcmV0dXJucyBgdW5kZWZpbmVkYC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHR5cGVCeUV4dGVuc2lvbiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL21lZGlhX3R5cGVzL3R5cGVfYnlfZXh0ZW5zaW9uLnRzXCI7XG4gKlxuICogdHlwZUJ5RXh0ZW5zaW9uKFwianNcIik7IC8vIFwiYXBwbGljYXRpb24vanNvblwiXG4gKiB0eXBlQnlFeHRlbnNpb24oXCIuSFRNTFwiKTsgLy8gXCJ0ZXh0L2h0bWxcIlxuICogdHlwZUJ5RXh0ZW5zaW9uKFwiZm9vXCIpOyAvLyB1bmRlZmluZWRcbiAqIHR5cGVCeUV4dGVuc2lvbihcImZpbGUuanNvblwiKTsgLy8gdW5kZWZpbmVkXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHR5cGVCeUV4dGVuc2lvbihleHRlbnNpb246IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGV4dGVuc2lvbiA9IGV4dGVuc2lvbi5zdGFydHNXaXRoKFwiLlwiKSA/IGV4dGVuc2lvbi5zbGljZSgxKSA6IGV4dGVuc2lvbjtcbiAgLy8gQHRzLWlnbm9yZSB3b3JrYXJvdW5kIGFyb3VuZCBkZW5vbGFuZC9kbnQjMTQ4XG4gIHJldHVybiB0eXBlcy5nZXQoZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxLQUFLLFFBQVEsV0FBVztBQUVqQzs7Ozs7Ozs7Ozs7Ozs7O0NBZUMsR0FDRCxPQUFPLFNBQVMsZ0JBQWdCLFNBQWlCO0VBQy9DLFlBQVksVUFBVSxVQUFVLENBQUMsT0FBTyxVQUFVLEtBQUssQ0FBQyxLQUFLO0VBQzdELGdEQUFnRDtFQUNoRCxPQUFPLE1BQU0sR0FBRyxDQUFDLFVBQVUsV0FBVztBQUN4QyJ9
// denoCacheMetadata=17614524847961197815,9041048432755891421