// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * A parsed path object generated by path.parse() or consumed by path.format().
 *
 * @example
 * ```ts
 * import { parse } from "@std/path";
 *
 * const parsedPathObj = parse("c:\\path\\dir\\index.html");
 * parsedPathObj.root; // "c:\\"
 * parsedPathObj.dir; // "c:\\path\\dir"
 * parsedPathObj.base; // "index.html"
 * parsedPathObj.ext; // ".html"
 * parsedPathObj.name; // "index"
 * ```
 */ 
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIyMS4wL19pbnRlcmZhY2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBBIHBhcnNlZCBwYXRoIG9iamVjdCBnZW5lcmF0ZWQgYnkgcGF0aC5wYXJzZSgpIG9yIGNvbnN1bWVkIGJ5IHBhdGguZm9ybWF0KCkuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZSB9IGZyb20gXCJAc3RkL3BhdGhcIjtcbiAqXG4gKiBjb25zdCBwYXJzZWRQYXRoT2JqID0gcGFyc2UoXCJjOlxcXFxwYXRoXFxcXGRpclxcXFxpbmRleC5odG1sXCIpO1xuICogcGFyc2VkUGF0aE9iai5yb290OyAvLyBcImM6XFxcXFwiXG4gKiBwYXJzZWRQYXRoT2JqLmRpcjsgLy8gXCJjOlxcXFxwYXRoXFxcXGRpclwiXG4gKiBwYXJzZWRQYXRoT2JqLmJhc2U7IC8vIFwiaW5kZXguaHRtbFwiXG4gKiBwYXJzZWRQYXRoT2JqLmV4dDsgLy8gXCIuaHRtbFwiXG4gKiBwYXJzZWRQYXRoT2JqLm5hbWU7IC8vIFwiaW5kZXhcIlxuICogYGBgXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VkUGF0aCB7XG4gIC8qKlxuICAgKiBUaGUgcm9vdCBvZiB0aGUgcGF0aCBzdWNoIGFzICcvJyBvciAnYzpcXCdcbiAgICovXG4gIHJvb3Q6IHN0cmluZztcbiAgLyoqXG4gICAqIFRoZSBmdWxsIGRpcmVjdG9yeSBwYXRoIG9mIHRoZSBwYXJlbnQgc3VjaCBhcyAnL2hvbWUvdXNlci9kaXInIG9yICdjOlxccGF0aFxcZGlyJ1xuICAgKi9cbiAgZGlyOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBUaGUgZmlsZSBuYW1lIGluY2x1ZGluZyBleHRlbnNpb24gKGlmIGFueSkgc3VjaCBhcyAnaW5kZXguaHRtbCdcbiAgICovXG4gIGJhc2U6IHN0cmluZztcbiAgLyoqXG4gICAqIFRoZSBmaWxlIGV4dGVuc2lvbiAoaWYgYW55KSBzdWNoIGFzICcuaHRtbCdcbiAgICovXG4gIGV4dDogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIGZpbGUgbmFtZSB3aXRob3V0IGV4dGVuc2lvbiAoaWYgYW55KSBzdWNoIGFzICdpbmRleCdcbiAgICovXG4gIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgRm9ybWF0SW5wdXRQYXRoT2JqZWN0ID0gUGFydGlhbDxQYXJzZWRQYXRoPjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7OztDQWNDLEdBQ0QifQ==
// denoCacheMetadata=17523981440654769064,15883078751977296595