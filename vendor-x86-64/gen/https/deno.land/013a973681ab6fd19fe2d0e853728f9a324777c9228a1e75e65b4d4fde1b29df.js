// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
import { basename } from "../path/basename.ts";
import { normalize } from "../path/normalize.ts";
import { toPathString } from "./_to_path_string.ts";
/** Create {@linkcode WalkEntry} for the `path` synchronously. */ export function createWalkEntrySync(path) {
  path = toPathString(path);
  path = normalize(path);
  const name = basename(path);
  const info = Deno.statSync(path);
  return {
    path,
    name,
    isFile: info.isFile,
    isDirectory: info.isDirectory,
    isSymlink: info.isSymlink
  };
}
/** Create {@linkcode WalkEntry} for the `path` asynchronously. */ export async function createWalkEntry(path) {
  path = toPathString(path);
  path = normalize(path);
  const name = basename(path);
  const info = await Deno.stat(path);
  return {
    path,
    name,
    isFile: info.isFile,
    isDirectory: info.isDirectory,
    isSymlink: info.isSymlink
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL2ZzL19jcmVhdGVfd2Fsa19lbnRyeS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IHRoZSBCcm93c2VyaWZ5IGF1dGhvcnMuIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBiYXNlbmFtZSB9IGZyb20gXCIuLi9wYXRoL2Jhc2VuYW1lLnRzXCI7XG5pbXBvcnQgeyBub3JtYWxpemUgfSBmcm9tIFwiLi4vcGF0aC9ub3JtYWxpemUudHNcIjtcbmltcG9ydCB7IHRvUGF0aFN0cmluZyB9IGZyb20gXCIuL190b19wYXRoX3N0cmluZy50c1wiO1xuXG4vKipcbiAqIFdhbGsgZW50cnkgZm9yIHtAbGlua2NvZGUgd2Fsa30sIHtAbGlua2NvZGUgd2Fsa1N5bmN9LFxuICoge0BsaW5rY29kZSBleHBhbmRHbG9ifSBhbmQge0BsaW5rY29kZSBleHBhbmRHbG9iU3luY30uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgV2Fsa0VudHJ5IGV4dGVuZHMgRGVuby5EaXJFbnRyeSB7XG4gIC8qKiBGdWxsIHBhdGggb2YgdGhlIGVudHJ5LiAqL1xuICBwYXRoOiBzdHJpbmc7XG59XG5cbi8qKiBDcmVhdGUge0BsaW5rY29kZSBXYWxrRW50cnl9IGZvciB0aGUgYHBhdGhgIHN5bmNocm9ub3VzbHkuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlV2Fsa0VudHJ5U3luYyhwYXRoOiBzdHJpbmcgfCBVUkwpOiBXYWxrRW50cnkge1xuICBwYXRoID0gdG9QYXRoU3RyaW5nKHBhdGgpO1xuICBwYXRoID0gbm9ybWFsaXplKHBhdGgpO1xuICBjb25zdCBuYW1lID0gYmFzZW5hbWUocGF0aCk7XG4gIGNvbnN0IGluZm8gPSBEZW5vLnN0YXRTeW5jKHBhdGgpO1xuICByZXR1cm4ge1xuICAgIHBhdGgsXG4gICAgbmFtZSxcbiAgICBpc0ZpbGU6IGluZm8uaXNGaWxlLFxuICAgIGlzRGlyZWN0b3J5OiBpbmZvLmlzRGlyZWN0b3J5LFxuICAgIGlzU3ltbGluazogaW5mby5pc1N5bWxpbmssXG4gIH07XG59XG5cbi8qKiBDcmVhdGUge0BsaW5rY29kZSBXYWxrRW50cnl9IGZvciB0aGUgYHBhdGhgIGFzeW5jaHJvbm91c2x5LiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVdhbGtFbnRyeShwYXRoOiBzdHJpbmcgfCBVUkwpOiBQcm9taXNlPFdhbGtFbnRyeT4ge1xuICBwYXRoID0gdG9QYXRoU3RyaW5nKHBhdGgpO1xuICBwYXRoID0gbm9ybWFsaXplKHBhdGgpO1xuICBjb25zdCBuYW1lID0gYmFzZW5hbWUocGF0aCk7XG4gIGNvbnN0IGluZm8gPSBhd2FpdCBEZW5vLnN0YXQocGF0aCk7XG4gIHJldHVybiB7XG4gICAgcGF0aCxcbiAgICBuYW1lLFxuICAgIGlzRmlsZTogaW5mby5pc0ZpbGUsXG4gICAgaXNEaXJlY3Rvcnk6IGluZm8uaXNEaXJlY3RvcnksXG4gICAgaXNTeW1saW5rOiBpbmZvLmlzU3ltbGluayxcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsaURBQWlEO0FBRWpELFNBQVMsUUFBUSxRQUFRLHNCQUFzQjtBQUMvQyxTQUFTLFNBQVMsUUFBUSx1QkFBdUI7QUFDakQsU0FBUyxZQUFZLFFBQVEsdUJBQXVCO0FBV3BELCtEQUErRCxHQUMvRCxPQUFPLFNBQVMsb0JBQW9CLElBQWtCO0VBQ3BELE9BQU8sYUFBYTtFQUNwQixPQUFPLFVBQVU7RUFDakIsTUFBTSxPQUFPLFNBQVM7RUFDdEIsTUFBTSxPQUFPLEtBQUssUUFBUSxDQUFDO0VBQzNCLE9BQU87SUFDTDtJQUNBO0lBQ0EsUUFBUSxLQUFLLE1BQU07SUFDbkIsYUFBYSxLQUFLLFdBQVc7SUFDN0IsV0FBVyxLQUFLLFNBQVM7RUFDM0I7QUFDRjtBQUVBLGdFQUFnRSxHQUNoRSxPQUFPLGVBQWUsZ0JBQWdCLElBQWtCO0VBQ3RELE9BQU8sYUFBYTtFQUNwQixPQUFPLFVBQVU7RUFDakIsTUFBTSxPQUFPLFNBQVM7RUFDdEIsTUFBTSxPQUFPLE1BQU0sS0FBSyxJQUFJLENBQUM7RUFDN0IsT0FBTztJQUNMO0lBQ0E7SUFDQSxRQUFRLEtBQUssTUFBTTtJQUNuQixhQUFhLEtBQUssV0FBVztJQUM3QixXQUFXLEtBQUssU0FBUztFQUMzQjtBQUNGIn0=
// denoCacheMetadata=6141613552707920644,2604019121072497150