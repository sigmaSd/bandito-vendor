// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assertPath } from "./assert_path.ts";
export function stripSuffix(name, suffix) {
  if (suffix.length >= name.length) {
    return name;
  }
  const lenDiff = name.length - suffix.length;
  for(let i = suffix.length - 1; i >= 0; --i){
    if (name.charCodeAt(lenDiff + i) !== suffix.charCodeAt(i)) {
      return name;
    }
  }
  return name.slice(0, -suffix.length);
}
export function lastPathSegment(path, isSep, start = 0) {
  let matchedNonSeparator = false;
  let end = path.length;
  for(let i = path.length - 1; i >= start; --i){
    if (isSep(path.charCodeAt(i))) {
      if (matchedNonSeparator) {
        start = i + 1;
        break;
      }
    } else if (!matchedNonSeparator) {
      matchedNonSeparator = true;
      end = i + 1;
    }
  }
  return path.slice(start, end);
}
export function assertArgs(path, suffix) {
  assertPath(path);
  if (path.length === 0) return path;
  if (typeof suffix !== "string") {
    throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL3BhdGgvX2NvbW1vbi9iYXNlbmFtZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBhc3NlcnRQYXRoIH0gZnJvbSBcIi4vYXNzZXJ0X3BhdGgudHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwU3VmZml4KG5hbWU6IHN0cmluZywgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoc3VmZml4Lmxlbmd0aCA+PSBuYW1lLmxlbmd0aCkge1xuICAgIHJldHVybiBuYW1lO1xuICB9XG5cbiAgY29uc3QgbGVuRGlmZiA9IG5hbWUubGVuZ3RoIC0gc3VmZml4Lmxlbmd0aDtcblxuICBmb3IgKGxldCBpID0gc3VmZml4Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgaWYgKG5hbWUuY2hhckNvZGVBdChsZW5EaWZmICsgaSkgIT09IHN1ZmZpeC5jaGFyQ29kZUF0KGkpKSB7XG4gICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZS5zbGljZSgwLCAtc3VmZml4Lmxlbmd0aCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsYXN0UGF0aFNlZ21lbnQoXG4gIHBhdGg6IHN0cmluZyxcbiAgaXNTZXA6IChjaGFyOiBudW1iZXIpID0+IGJvb2xlYW4sXG4gIHN0YXJ0ID0gMCxcbik6IHN0cmluZyB7XG4gIGxldCBtYXRjaGVkTm9uU2VwYXJhdG9yID0gZmFsc2U7XG4gIGxldCBlbmQgPSBwYXRoLmxlbmd0aDtcblxuICBmb3IgKGxldCBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IHN0YXJ0OyAtLWkpIHtcbiAgICBpZiAoaXNTZXAocGF0aC5jaGFyQ29kZUF0KGkpKSkge1xuICAgICAgaWYgKG1hdGNoZWROb25TZXBhcmF0b3IpIHtcbiAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghbWF0Y2hlZE5vblNlcGFyYXRvcikge1xuICAgICAgbWF0Y2hlZE5vblNlcGFyYXRvciA9IHRydWU7XG4gICAgICBlbmQgPSBpICsgMTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGF0aC5zbGljZShzdGFydCwgZW5kKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFyZ3MocGF0aDogc3RyaW5nLCBzdWZmaXg6IHN0cmluZykge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiBwYXRoO1xuICBpZiAodHlwZW9mIHN1ZmZpeCAhPT0gXCJzdHJpbmdcIikge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICBgU3VmZml4IG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICR7SlNPTi5zdHJpbmdpZnkoc3VmZml4KX1gLFxuICAgICk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsVUFBVSxRQUFRLG1CQUFtQjtBQUU5QyxPQUFPLFNBQVMsWUFBWSxJQUFZLEVBQUUsTUFBYztFQUN0RCxJQUFJLE9BQU8sTUFBTSxJQUFJLEtBQUssTUFBTSxFQUFFO0lBQ2hDLE9BQU87RUFDVDtFQUVBLE1BQU0sVUFBVSxLQUFLLE1BQU0sR0FBRyxPQUFPLE1BQU07RUFFM0MsSUFBSyxJQUFJLElBQUksT0FBTyxNQUFNLEdBQUcsR0FBRyxLQUFLLEdBQUcsRUFBRSxFQUFHO0lBQzNDLElBQUksS0FBSyxVQUFVLENBQUMsVUFBVSxPQUFPLE9BQU8sVUFBVSxDQUFDLElBQUk7TUFDekQsT0FBTztJQUNUO0VBQ0Y7RUFFQSxPQUFPLEtBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLE1BQU07QUFDckM7QUFFQSxPQUFPLFNBQVMsZ0JBQ2QsSUFBWSxFQUNaLEtBQWdDLEVBQ2hDLFFBQVEsQ0FBQztFQUVULElBQUksc0JBQXNCO0VBQzFCLElBQUksTUFBTSxLQUFLLE1BQU07RUFFckIsSUFBSyxJQUFJLElBQUksS0FBSyxNQUFNLEdBQUcsR0FBRyxLQUFLLE9BQU8sRUFBRSxFQUFHO0lBQzdDLElBQUksTUFBTSxLQUFLLFVBQVUsQ0FBQyxLQUFLO01BQzdCLElBQUkscUJBQXFCO1FBQ3ZCLFFBQVEsSUFBSTtRQUNaO01BQ0Y7SUFDRixPQUFPLElBQUksQ0FBQyxxQkFBcUI7TUFDL0Isc0JBQXNCO01BQ3RCLE1BQU0sSUFBSTtJQUNaO0VBQ0Y7RUFFQSxPQUFPLEtBQUssS0FBSyxDQUFDLE9BQU87QUFDM0I7QUFFQSxPQUFPLFNBQVMsV0FBVyxJQUFZLEVBQUUsTUFBYztFQUNyRCxXQUFXO0VBQ1gsSUFBSSxLQUFLLE1BQU0sS0FBSyxHQUFHLE9BQU87RUFDOUIsSUFBSSxPQUFPLFdBQVcsVUFBVTtJQUM5QixNQUFNLElBQUksVUFDUixDQUFDLGtDQUFrQyxFQUFFLEtBQUssU0FBUyxDQUFDLFFBQVEsQ0FBQztFQUVqRTtBQUNGIn0=
// denoCacheMetadata=12729991443993474805,675202301983150981