// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export function _format(sep, pathObject) {
  const dir = pathObject.dir || pathObject.root;
  const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
  if (!dir) return base;
  if (base === sep) return dir;
  if (dir === pathObject.root) return dir + base;
  return dir + sep + base;
}
export function assertArg(pathObject) {
  if (pathObject === null || typeof pathObject !== "object") {
    throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL19jb21tb24vZm9ybWF0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB0eXBlIHsgRm9ybWF0SW5wdXRQYXRoT2JqZWN0IH0gZnJvbSBcIi4uL19pbnRlcmZhY2UudHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIF9mb3JtYXQoXG4gIHNlcDogc3RyaW5nLFxuICBwYXRoT2JqZWN0OiBGb3JtYXRJbnB1dFBhdGhPYmplY3QsXG4pOiBzdHJpbmcge1xuICBjb25zdCBkaXI6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHBhdGhPYmplY3QuZGlyIHx8IHBhdGhPYmplY3Qucm9vdDtcbiAgY29uc3QgYmFzZTogc3RyaW5nID0gcGF0aE9iamVjdC5iYXNlIHx8XG4gICAgKHBhdGhPYmplY3QubmFtZSB8fCBcIlwiKSArIChwYXRoT2JqZWN0LmV4dCB8fCBcIlwiKTtcbiAgaWYgKCFkaXIpIHJldHVybiBiYXNlO1xuICBpZiAoYmFzZSA9PT0gc2VwKSByZXR1cm4gZGlyO1xuICBpZiAoZGlyID09PSBwYXRoT2JqZWN0LnJvb3QpIHJldHVybiBkaXIgKyBiYXNlO1xuICByZXR1cm4gZGlyICsgc2VwICsgYmFzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFyZyhwYXRoT2JqZWN0OiBGb3JtYXRJbnB1dFBhdGhPYmplY3QpIHtcbiAgaWYgKHBhdGhPYmplY3QgPT09IG51bGwgfHwgdHlwZW9mIHBhdGhPYmplY3QgIT09IFwib2JqZWN0XCIpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgYFRoZSBcInBhdGhPYmplY3RcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICR7dHlwZW9mIHBhdGhPYmplY3R9YCxcbiAgICApO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUlyQyxPQUFPLFNBQVMsUUFDZCxHQUFXLEVBQ1gsVUFBaUM7RUFFakMsTUFBTSxNQUEwQixXQUFXLEdBQUcsSUFBSSxXQUFXLElBQUk7RUFDakUsTUFBTSxPQUFlLFdBQVcsSUFBSSxJQUNsQyxDQUFDLFdBQVcsSUFBSSxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLEVBQUU7RUFDakQsSUFBSSxDQUFDLEtBQUssT0FBTztFQUNqQixJQUFJLFNBQVMsS0FBSyxPQUFPO0VBQ3pCLElBQUksUUFBUSxXQUFXLElBQUksRUFBRSxPQUFPLE1BQU07RUFDMUMsT0FBTyxNQUFNLE1BQU07QUFDckI7QUFFQSxPQUFPLFNBQVMsVUFBVSxVQUFpQztFQUN6RCxJQUFJLGVBQWUsUUFBUSxPQUFPLGVBQWUsVUFBVTtJQUN6RCxNQUFNLElBQUksVUFDUixDQUFDLGdFQUFnRSxFQUFFLE9BQU8sV0FBVyxDQUFDO0VBRTFGO0FBQ0YifQ==
// denoCacheMetadata=17287677551826657921,9272412344293977180