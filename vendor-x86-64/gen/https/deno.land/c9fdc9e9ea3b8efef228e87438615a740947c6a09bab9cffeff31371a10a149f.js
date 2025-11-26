// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { consumeMediaParam, decode2331Encoding } from "./_util.ts";
/**
 * Parses the media type and any optional parameters, per
 * {@link https://datatracker.ietf.org/doc/html/rfc1521 | RFC 1521}. Media
 * types are the values in `Content-Type` and `Content-Disposition` headers. On
 * success the function returns a tuple where the first element is the media
 * type and the second element is the optional parameters or `undefined` if
 * there are none.
 *
 * The function will throw if the parsed value is invalid.
 *
 * The returned media type will be normalized to be lower case, and returned
 * params keys will be normalized to lower case, but preserves the casing of
 * the value.
 *
 * @example
 * ```ts
 * import { parseMediaType } from "https://deno.land/std@$STD_VERSION/media_types/parse_media_type.ts";
 *
 * parseMediaType("application/JSON"); // ["application/json", undefined]
 * parseMediaType("text/html; charset=UTF-8"); // ["text/html", { charset: "UTF-8" }]
 * ```
 */ export function parseMediaType(v) {
  const [base] = v.split(";");
  const mediaType = base.toLowerCase().trim();
  const params = {};
  // Map of base parameter name -> parameter name -> value
  // for parameters containing a '*' character.
  const continuation = new Map();
  v = v.slice(base.length);
  while(v.length){
    v = v.trimStart();
    if (v.length === 0) {
      break;
    }
    const [key, value, rest] = consumeMediaParam(v);
    if (!key) {
      if (rest.trim() === ";") {
        break;
      }
      throw new TypeError("Invalid media parameter.");
    }
    let pmap = params;
    const [baseName, rest2] = key.split("*");
    if (baseName && rest2 !== undefined) {
      if (!continuation.has(baseName)) {
        continuation.set(baseName, {});
      }
      pmap = continuation.get(baseName);
    }
    if (key in pmap) {
      throw new TypeError("Duplicate key parsed.");
    }
    pmap[key] = value;
    v = rest;
  }
  // Stitch together any continuations or things with stars
  // (i.e. RFC 2231 things with stars: "foo*0" or "foo*")
  let str = "";
  for (const [key, pieceMap] of continuation){
    const singlePartKey = `${key}*`;
    const v = pieceMap[singlePartKey];
    if (v) {
      const decv = decode2331Encoding(v);
      if (decv) {
        params[key] = decv;
      }
      continue;
    }
    str = "";
    let valid = false;
    for(let n = 0;; n++){
      const simplePart = `${key}*${n}`;
      let v = pieceMap[simplePart];
      if (v) {
        valid = true;
        str += v;
        continue;
      }
      const encodedPart = `${simplePart}*`;
      v = pieceMap[encodedPart];
      if (!v) {
        break;
      }
      valid = true;
      if (n === 0) {
        const decv = decode2331Encoding(v);
        if (decv) {
          str += decv;
        }
      } else {
        const decv = decodeURI(v);
        str += decv;
      }
    }
    if (valid) {
      params[key] = str;
    }
  }
  return Object.keys(params).length ? [
    mediaType,
    params
  ] : [
    mediaType,
    undefined
  ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL21lZGlhX3R5cGVzL3BhcnNlX21lZGlhX3R5cGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgY29uc3VtZU1lZGlhUGFyYW0sIGRlY29kZTIzMzFFbmNvZGluZyB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5cbi8qKlxuICogUGFyc2VzIHRoZSBtZWRpYSB0eXBlIGFuZCBhbnkgb3B0aW9uYWwgcGFyYW1ldGVycywgcGVyXG4gKiB7QGxpbmsgaHR0cHM6Ly9kYXRhdHJhY2tlci5pZXRmLm9yZy9kb2MvaHRtbC9yZmMxNTIxIHwgUkZDIDE1MjF9LiBNZWRpYVxuICogdHlwZXMgYXJlIHRoZSB2YWx1ZXMgaW4gYENvbnRlbnQtVHlwZWAgYW5kIGBDb250ZW50LURpc3Bvc2l0aW9uYCBoZWFkZXJzLiBPblxuICogc3VjY2VzcyB0aGUgZnVuY3Rpb24gcmV0dXJucyBhIHR1cGxlIHdoZXJlIHRoZSBmaXJzdCBlbGVtZW50IGlzIHRoZSBtZWRpYVxuICogdHlwZSBhbmQgdGhlIHNlY29uZCBlbGVtZW50IGlzIHRoZSBvcHRpb25hbCBwYXJhbWV0ZXJzIG9yIGB1bmRlZmluZWRgIGlmXG4gKiB0aGVyZSBhcmUgbm9uZS5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gd2lsbCB0aHJvdyBpZiB0aGUgcGFyc2VkIHZhbHVlIGlzIGludmFsaWQuXG4gKlxuICogVGhlIHJldHVybmVkIG1lZGlhIHR5cGUgd2lsbCBiZSBub3JtYWxpemVkIHRvIGJlIGxvd2VyIGNhc2UsIGFuZCByZXR1cm5lZFxuICogcGFyYW1zIGtleXMgd2lsbCBiZSBub3JtYWxpemVkIHRvIGxvd2VyIGNhc2UsIGJ1dCBwcmVzZXJ2ZXMgdGhlIGNhc2luZyBvZlxuICogdGhlIHZhbHVlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcGFyc2VNZWRpYVR5cGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9tZWRpYV90eXBlcy9wYXJzZV9tZWRpYV90eXBlLnRzXCI7XG4gKlxuICogcGFyc2VNZWRpYVR5cGUoXCJhcHBsaWNhdGlvbi9KU09OXCIpOyAvLyBbXCJhcHBsaWNhdGlvbi9qc29uXCIsIHVuZGVmaW5lZF1cbiAqIHBhcnNlTWVkaWFUeXBlKFwidGV4dC9odG1sOyBjaGFyc2V0PVVURi04XCIpOyAvLyBbXCJ0ZXh0L2h0bWxcIiwgeyBjaGFyc2V0OiBcIlVURi04XCIgfV1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VNZWRpYVR5cGUoXG4gIHY6IHN0cmluZyxcbik6IFttZWRpYVR5cGU6IHN0cmluZywgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgdW5kZWZpbmVkXSB7XG4gIGNvbnN0IFtiYXNlXSA9IHYuc3BsaXQoXCI7XCIpIGFzIFtzdHJpbmddO1xuICBjb25zdCBtZWRpYVR5cGUgPSBiYXNlLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gIGNvbnN0IHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAvLyBNYXAgb2YgYmFzZSBwYXJhbWV0ZXIgbmFtZSAtPiBwYXJhbWV0ZXIgbmFtZSAtPiB2YWx1ZVxuICAvLyBmb3IgcGFyYW1ldGVycyBjb250YWluaW5nIGEgJyonIGNoYXJhY3Rlci5cbiAgY29uc3QgY29udGludWF0aW9uID0gbmV3IE1hcDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHN0cmluZz4+KCk7XG5cbiAgdiA9IHYuc2xpY2UoYmFzZS5sZW5ndGgpO1xuICB3aGlsZSAodi5sZW5ndGgpIHtcbiAgICB2ID0gdi50cmltU3RhcnQoKTtcbiAgICBpZiAodi5sZW5ndGggPT09IDApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjb25zdCBba2V5LCB2YWx1ZSwgcmVzdF0gPSBjb25zdW1lTWVkaWFQYXJhbSh2KTtcbiAgICBpZiAoIWtleSkge1xuICAgICAgaWYgKHJlc3QudHJpbSgpID09PSBcIjtcIikge1xuICAgICAgICAvLyBpZ25vcmUgdHJhaWxpbmcgc2VtaWNvbG9uc1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIG1lZGlhIHBhcmFtZXRlci5cIik7XG4gICAgfVxuXG4gICAgbGV0IHBtYXAgPSBwYXJhbXM7XG4gICAgY29uc3QgW2Jhc2VOYW1lLCByZXN0Ml0gPSBrZXkuc3BsaXQoXCIqXCIpO1xuICAgIGlmIChiYXNlTmFtZSAmJiByZXN0MiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoIWNvbnRpbnVhdGlvbi5oYXMoYmFzZU5hbWUpKSB7XG4gICAgICAgIGNvbnRpbnVhdGlvbi5zZXQoYmFzZU5hbWUsIHt9KTtcbiAgICAgIH1cbiAgICAgIHBtYXAgPSBjb250aW51YXRpb24uZ2V0KGJhc2VOYW1lKSE7XG4gICAgfVxuICAgIGlmIChrZXkgaW4gcG1hcCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkR1cGxpY2F0ZSBrZXkgcGFyc2VkLlwiKTtcbiAgICB9XG4gICAgcG1hcFtrZXldID0gdmFsdWU7XG4gICAgdiA9IHJlc3Q7XG4gIH1cblxuICAvLyBTdGl0Y2ggdG9nZXRoZXIgYW55IGNvbnRpbnVhdGlvbnMgb3IgdGhpbmdzIHdpdGggc3RhcnNcbiAgLy8gKGkuZS4gUkZDIDIyMzEgdGhpbmdzIHdpdGggc3RhcnM6IFwiZm9vKjBcIiBvciBcImZvbypcIilcbiAgbGV0IHN0ciA9IFwiXCI7XG4gIGZvciAoY29uc3QgW2tleSwgcGllY2VNYXBdIG9mIGNvbnRpbnVhdGlvbikge1xuICAgIGNvbnN0IHNpbmdsZVBhcnRLZXkgPSBgJHtrZXl9KmA7XG4gICAgY29uc3QgdiA9IHBpZWNlTWFwW3NpbmdsZVBhcnRLZXldO1xuICAgIGlmICh2KSB7XG4gICAgICBjb25zdCBkZWN2ID0gZGVjb2RlMjMzMUVuY29kaW5nKHYpO1xuICAgICAgaWYgKGRlY3YpIHtcbiAgICAgICAgcGFyYW1zW2tleV0gPSBkZWN2O1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgc3RyID0gXCJcIjtcbiAgICBsZXQgdmFsaWQgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBuID0gMDs7IG4rKykge1xuICAgICAgY29uc3Qgc2ltcGxlUGFydCA9IGAke2tleX0qJHtufWA7XG4gICAgICBsZXQgdiA9IHBpZWNlTWFwW3NpbXBsZVBhcnRdO1xuICAgICAgaWYgKHYpIHtcbiAgICAgICAgdmFsaWQgPSB0cnVlO1xuICAgICAgICBzdHIgKz0gdjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBlbmNvZGVkUGFydCA9IGAke3NpbXBsZVBhcnR9KmA7XG4gICAgICB2ID0gcGllY2VNYXBbZW5jb2RlZFBhcnRdO1xuICAgICAgaWYgKCF2KSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdmFsaWQgPSB0cnVlO1xuICAgICAgaWYgKG4gPT09IDApIHtcbiAgICAgICAgY29uc3QgZGVjdiA9IGRlY29kZTIzMzFFbmNvZGluZyh2KTtcbiAgICAgICAgaWYgKGRlY3YpIHtcbiAgICAgICAgICBzdHIgKz0gZGVjdjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZGVjdiA9IGRlY29kZVVSSSh2KTtcbiAgICAgICAgc3RyICs9IGRlY3Y7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh2YWxpZCkge1xuICAgICAgcGFyYW1zW2tleV0gPSBzdHI7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKHBhcmFtcykubGVuZ3RoXG4gICAgPyBbbWVkaWFUeXBlLCBwYXJhbXNdXG4gICAgOiBbbWVkaWFUeXBlLCB1bmRlZmluZWRdO1xufVxu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
// denoCacheMetadata=5668506204464306249,8738154964790122083