// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { _format, assertArg } from "../_common/format.ts";
/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */ export function format(pathObject) {
  assertArg(pathObject);
  return _format("/", pathObject);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIyMS4wL3Bvc2l4L2Zvcm1hdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBfZm9ybWF0LCBhc3NlcnRBcmcgfSBmcm9tIFwiLi4vX2NvbW1vbi9mb3JtYXQudHNcIjtcbmltcG9ydCB0eXBlIHsgRm9ybWF0SW5wdXRQYXRoT2JqZWN0IH0gZnJvbSBcIi4uL19pbnRlcmZhY2UudHNcIjtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHBhdGggZnJvbSBgRm9ybWF0SW5wdXRQYXRoT2JqZWN0YCBvYmplY3QuXG4gKiBAcGFyYW0gcGF0aE9iamVjdCB3aXRoIHBhdGhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdChwYXRoT2JqZWN0OiBGb3JtYXRJbnB1dFBhdGhPYmplY3QpOiBzdHJpbmcge1xuICBhc3NlcnRBcmcocGF0aE9iamVjdCk7XG4gIHJldHVybiBfZm9ybWF0KFwiL1wiLCBwYXRoT2JqZWN0KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsT0FBTyxFQUFFLFNBQVMsUUFBUSx1QkFBdUI7QUFHMUQ7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sVUFBaUM7RUFDdEQsVUFBVTtFQUNWLE9BQU8sUUFBUSxLQUFLO0FBQ3RCIn0=
// denoCacheMetadata=2214131255660937669,17851034452308408697