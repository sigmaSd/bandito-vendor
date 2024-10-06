// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isIterator, isToken, needsEncoding } from "./_util.ts";
/** Serializes the media type and the optional parameters as a media type
 * conforming to RFC 2045 and RFC 2616.
 *
 * The type and parameter names are written in lower-case.
 *
 * When any of the arguments results in a standard violation then the return
 * value will be an empty string (`""`).
 *
 * @example
 * ```ts
 * import { formatMediaType } from "https://deno.land/std@$STD_VERSION/media_types/format_media_type.ts";
 *
 * formatMediaType("text/plain", { charset: "UTF-8" }); // "text/plain; charset=UTF-8"
 * ```
 */ export function formatMediaType(type, param) {
  let b = "";
  const [major = "", sub] = type.split("/");
  if (!sub) {
    if (!isToken(type)) {
      return "";
    }
    b += type.toLowerCase();
  } else {
    if (!isToken(major) || !isToken(sub)) {
      return "";
    }
    b += `${major.toLowerCase()}/${sub.toLowerCase()}`;
  }
  if (param) {
    param = isIterator(param) ? Object.fromEntries(param) : param;
    const attrs = Object.keys(param);
    attrs.sort();
    for (const attribute of attrs){
      if (!isToken(attribute)) {
        return "";
      }
      const value = param[attribute];
      b += `; ${attribute.toLowerCase()}`;
      const needEnc = needsEncoding(value);
      if (needEnc) {
        b += "*";
      }
      b += "=";
      if (needEnc) {
        b += `utf-8''${encodeURIComponent(value)}`;
        continue;
      }
      if (isToken(value)) {
        b += value;
        continue;
      }
      b += `"${value.replace(/["\\]/gi, (m)=>`\\${m}`)}"`;
    }
  }
  return b;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL21lZGlhX3R5cGVzL2Zvcm1hdF9tZWRpYV90eXBlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGlzSXRlcmF0b3IsIGlzVG9rZW4sIG5lZWRzRW5jb2RpbmcgfSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG4vKiogU2VyaWFsaXplcyB0aGUgbWVkaWEgdHlwZSBhbmQgdGhlIG9wdGlvbmFsIHBhcmFtZXRlcnMgYXMgYSBtZWRpYSB0eXBlXG4gKiBjb25mb3JtaW5nIHRvIFJGQyAyMDQ1IGFuZCBSRkMgMjYxNi5cbiAqXG4gKiBUaGUgdHlwZSBhbmQgcGFyYW1ldGVyIG5hbWVzIGFyZSB3cml0dGVuIGluIGxvd2VyLWNhc2UuXG4gKlxuICogV2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyByZXN1bHRzIGluIGEgc3RhbmRhcmQgdmlvbGF0aW9uIHRoZW4gdGhlIHJldHVyblxuICogdmFsdWUgd2lsbCBiZSBhbiBlbXB0eSBzdHJpbmcgKGBcIlwiYCkuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBmb3JtYXRNZWRpYVR5cGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9tZWRpYV90eXBlcy9mb3JtYXRfbWVkaWFfdHlwZS50c1wiO1xuICpcbiAqIGZvcm1hdE1lZGlhVHlwZShcInRleHQvcGxhaW5cIiwgeyBjaGFyc2V0OiBcIlVURi04XCIgfSk7IC8vIFwidGV4dC9wbGFpbjsgY2hhcnNldD1VVEYtOFwiXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE1lZGlhVHlwZShcbiAgdHlwZTogc3RyaW5nLFxuICBwYXJhbT86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCBJdGVyYWJsZTxbc3RyaW5nLCBzdHJpbmddPixcbik6IHN0cmluZyB7XG4gIGxldCBiID0gXCJcIjtcbiAgY29uc3QgW21ham9yID0gXCJcIiwgc3ViXSA9IHR5cGUuc3BsaXQoXCIvXCIpO1xuICBpZiAoIXN1Yikge1xuICAgIGlmICghaXNUb2tlbih0eXBlKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGIgKz0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuICB9IGVsc2Uge1xuICAgIGlmICghaXNUb2tlbihtYWpvcikgfHwgIWlzVG9rZW4oc3ViKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGIgKz0gYCR7bWFqb3IudG9Mb3dlckNhc2UoKX0vJHtzdWIudG9Mb3dlckNhc2UoKX1gO1xuICB9XG5cbiAgaWYgKHBhcmFtKSB7XG4gICAgcGFyYW0gPSBpc0l0ZXJhdG9yKHBhcmFtKSA/IE9iamVjdC5mcm9tRW50cmllcyhwYXJhbSkgOiBwYXJhbTtcbiAgICBjb25zdCBhdHRycyA9IE9iamVjdC5rZXlzKHBhcmFtKTtcbiAgICBhdHRycy5zb3J0KCk7XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBhdHRycykge1xuICAgICAgaWYgKCFpc1Rva2VuKGF0dHJpYnV0ZSkpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9XG4gICAgICBjb25zdCB2YWx1ZSA9IHBhcmFtW2F0dHJpYnV0ZV0hO1xuICAgICAgYiArPSBgOyAke2F0dHJpYnV0ZS50b0xvd2VyQ2FzZSgpfWA7XG5cbiAgICAgIGNvbnN0IG5lZWRFbmMgPSBuZWVkc0VuY29kaW5nKHZhbHVlKTtcbiAgICAgIGlmIChuZWVkRW5jKSB7XG4gICAgICAgIGIgKz0gXCIqXCI7XG4gICAgICB9XG4gICAgICBiICs9IFwiPVwiO1xuXG4gICAgICBpZiAobmVlZEVuYykge1xuICAgICAgICBiICs9IGB1dGYtOCcnJHtlbmNvZGVVUklDb21wb25lbnQodmFsdWUpfWA7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNUb2tlbih2YWx1ZSkpIHtcbiAgICAgICAgYiArPSB2YWx1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBiICs9IGBcIiR7dmFsdWUucmVwbGFjZSgvW1wiXFxcXF0vZ2ksIChtKSA9PiBgXFxcXCR7bX1gKX1cImA7XG4gICAgfVxuICB9XG4gIHJldHVybiBiO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxVQUFVLEVBQUUsT0FBTyxFQUFFLGFBQWEsUUFBUSxhQUFhO0FBRWhFOzs7Ozs7Ozs7Ozs7OztDQWNDLEdBQ0QsT0FBTyxTQUFTLGdCQUNkLElBQVksRUFDWixLQUEyRDtFQUUzRCxJQUFJLElBQUk7RUFDUixNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxHQUFHLEtBQUssS0FBSyxDQUFDO0VBQ3JDLElBQUksQ0FBQyxLQUFLO0lBQ1IsSUFBSSxDQUFDLFFBQVEsT0FBTztNQUNsQixPQUFPO0lBQ1Q7SUFDQSxLQUFLLEtBQUssV0FBVztFQUN2QixPQUFPO0lBQ0wsSUFBSSxDQUFDLFFBQVEsVUFBVSxDQUFDLFFBQVEsTUFBTTtNQUNwQyxPQUFPO0lBQ1Q7SUFDQSxLQUFLLENBQUMsRUFBRSxNQUFNLFdBQVcsR0FBRyxDQUFDLEVBQUUsSUFBSSxXQUFXLEdBQUcsQ0FBQztFQUNwRDtFQUVBLElBQUksT0FBTztJQUNULFFBQVEsV0FBVyxTQUFTLE9BQU8sV0FBVyxDQUFDLFNBQVM7SUFDeEQsTUFBTSxRQUFRLE9BQU8sSUFBSSxDQUFDO0lBQzFCLE1BQU0sSUFBSTtJQUVWLEtBQUssTUFBTSxhQUFhLE1BQU87TUFDN0IsSUFBSSxDQUFDLFFBQVEsWUFBWTtRQUN2QixPQUFPO01BQ1Q7TUFDQSxNQUFNLFFBQVEsS0FBSyxDQUFDLFVBQVU7TUFDOUIsS0FBSyxDQUFDLEVBQUUsRUFBRSxVQUFVLFdBQVcsR0FBRyxDQUFDO01BRW5DLE1BQU0sVUFBVSxjQUFjO01BQzlCLElBQUksU0FBUztRQUNYLEtBQUs7TUFDUDtNQUNBLEtBQUs7TUFFTCxJQUFJLFNBQVM7UUFDWCxLQUFLLENBQUMsT0FBTyxFQUFFLG1CQUFtQixPQUFPLENBQUM7UUFDMUM7TUFDRjtNQUVBLElBQUksUUFBUSxRQUFRO1FBQ2xCLEtBQUs7UUFDTDtNQUNGO01BQ0EsS0FBSyxDQUFDLENBQUMsRUFBRSxNQUFNLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdkQ7RUFDRjtFQUNBLE9BQU87QUFDVCJ9
// denoCacheMetadata=16681380819762779159,7391106373328901055