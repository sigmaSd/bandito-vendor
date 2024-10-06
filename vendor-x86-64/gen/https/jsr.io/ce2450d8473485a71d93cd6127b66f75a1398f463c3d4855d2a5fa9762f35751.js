// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { _format, assertArg } from "./../_common/format.ts";
/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */ export function format(pathObject) {
  assertArg(pathObject);
  return _format("\\", pathObject);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL3dpbmRvd3MvZm9ybWF0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IF9mb3JtYXQsIGFzc2VydEFyZyB9IGZyb20gXCIuLy4uL19jb21tb24vZm9ybWF0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IEZvcm1hdElucHV0UGF0aE9iamVjdCB9IGZyb20gXCIuLy4uL19pbnRlcmZhY2UudHNcIjtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHBhdGggZnJvbSBgRm9ybWF0SW5wdXRQYXRoT2JqZWN0YCBvYmplY3QuXG4gKiBAcGFyYW0gcGF0aE9iamVjdCB3aXRoIHBhdGhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdChwYXRoT2JqZWN0OiBGb3JtYXRJbnB1dFBhdGhPYmplY3QpOiBzdHJpbmcge1xuICBhc3NlcnRBcmcocGF0aE9iamVjdCk7XG4gIHJldHVybiBfZm9ybWF0KFwiXFxcXFwiLCBwYXRoT2JqZWN0KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsT0FBTyxFQUFFLFNBQVMsUUFBUSx5QkFBeUI7QUFHNUQ7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sVUFBaUM7RUFDdEQsVUFBVTtFQUNWLE9BQU8sUUFBUSxNQUFNO0FBQ3ZCIn0=
// denoCacheMetadata=4032890395906854380,8689846925047847138