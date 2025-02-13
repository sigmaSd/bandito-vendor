// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assertArgs, lastPathSegment, stripSuffix } from "./../_common/basename.ts";
import { stripTrailingSeparators } from "./../_common/strip_trailing_separators.ts";
import { isPosixPathSeparator } from "./_util.ts";
/**
 * Return the last portion of a `path`.
 * Trailing directory separators are ignored, and optional suffix is removed.
 *
 * @param path - path to extract the name from.
 * @param [suffix] - suffix to remove from extracted name.
 */ export function basename(path, suffix = "") {
  assertArgs(path, suffix);
  const lastSegment = lastPathSegment(path, isPosixPathSeparator);
  const strippedSegment = stripTrailingSeparators(lastSegment, isPosixPathSeparator);
  return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL3Bvc2l4L2Jhc2VuYW1lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7XG4gIGFzc2VydEFyZ3MsXG4gIGxhc3RQYXRoU2VnbWVudCxcbiAgc3RyaXBTdWZmaXgsXG59IGZyb20gXCIuLy4uL19jb21tb24vYmFzZW5hbWUudHNcIjtcbmltcG9ydCB7IHN0cmlwVHJhaWxpbmdTZXBhcmF0b3JzIH0gZnJvbSBcIi4vLi4vX2NvbW1vbi9zdHJpcF90cmFpbGluZ19zZXBhcmF0b3JzLnRzXCI7XG5pbXBvcnQgeyBpc1Bvc2l4UGF0aFNlcGFyYXRvciB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsYXN0IHBvcnRpb24gb2YgYSBgcGF0aGAuXG4gKiBUcmFpbGluZyBkaXJlY3Rvcnkgc2VwYXJhdG9ycyBhcmUgaWdub3JlZCwgYW5kIG9wdGlvbmFsIHN1ZmZpeCBpcyByZW1vdmVkLlxuICpcbiAqIEBwYXJhbSBwYXRoIC0gcGF0aCB0byBleHRyYWN0IHRoZSBuYW1lIGZyb20uXG4gKiBAcGFyYW0gW3N1ZmZpeF0gLSBzdWZmaXggdG8gcmVtb3ZlIGZyb20gZXh0cmFjdGVkIG5hbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlbmFtZShwYXRoOiBzdHJpbmcsIHN1ZmZpeCA9IFwiXCIpOiBzdHJpbmcge1xuICBhc3NlcnRBcmdzKHBhdGgsIHN1ZmZpeCk7XG5cbiAgY29uc3QgbGFzdFNlZ21lbnQgPSBsYXN0UGF0aFNlZ21lbnQocGF0aCwgaXNQb3NpeFBhdGhTZXBhcmF0b3IpO1xuICBjb25zdCBzdHJpcHBlZFNlZ21lbnQgPSBzdHJpcFRyYWlsaW5nU2VwYXJhdG9ycyhcbiAgICBsYXN0U2VnbWVudCxcbiAgICBpc1Bvc2l4UGF0aFNlcGFyYXRvcixcbiAgKTtcbiAgcmV0dXJuIHN1ZmZpeCA/IHN0cmlwU3VmZml4KHN0cmlwcGVkU2VnbWVudCwgc3VmZml4KSA6IHN0cmlwcGVkU2VnbWVudDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQ0UsVUFBVSxFQUNWLGVBQWUsRUFDZixXQUFXLFFBQ04sMkJBQTJCO0FBQ2xDLFNBQVMsdUJBQXVCLFFBQVEsNENBQTRDO0FBQ3BGLFNBQVMsb0JBQW9CLFFBQVEsYUFBYTtBQUVsRDs7Ozs7O0NBTUMsR0FDRCxPQUFPLFNBQVMsU0FBUyxJQUFZLEVBQUUsU0FBUyxFQUFFO0VBQ2hELFdBQVcsTUFBTTtFQUVqQixNQUFNLGNBQWMsZ0JBQWdCLE1BQU07RUFDMUMsTUFBTSxrQkFBa0Isd0JBQ3RCLGFBQ0E7RUFFRixPQUFPLFNBQVMsWUFBWSxpQkFBaUIsVUFBVTtBQUN6RCJ9
// denoCacheMetadata=14564973804048707532,15478393439748196154