// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
// This module is browser compatible.
import { CHAR_DOT, CHAR_FORWARD_SLASH } from "./constants.ts";
// Resolves . and .. elements in a path with directory names
export function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code;
  for(let i = 0, len = path.length; i <= len; ++i){
    if (i < len) code = path.charCodeAt(i);
    else if (isPathSeparator(code)) break;
    else code = CHAR_FORWARD_SLASH;
    if (isPathSeparator(code)) {
      if (lastSlash === i - 1 || dots === 1) {
      // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== CHAR_DOT || res.charCodeAt(res.length - 2) !== CHAR_DOT) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i;
            dots = 0;
            continue;
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) res += `${separator}..`;
          else res = "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
        else res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL3BhdGgvX2NvbW1vbi9ub3JtYWxpemVfc3RyaW5nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgdGhlIEJyb3dzZXJpZnkgYXV0aG9ycy4gTUlUIExpY2Vuc2UuXG4vLyBQb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vYnJvd3NlcmlmeS9wYXRoLWJyb3dzZXJpZnkvXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IENIQVJfRE9ULCBDSEFSX0ZPUldBUkRfU0xBU0ggfSBmcm9tIFwiLi9jb25zdGFudHMudHNcIjtcblxuLy8gUmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIHdpdGggZGlyZWN0b3J5IG5hbWVzXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3RyaW5nKFxuICBwYXRoOiBzdHJpbmcsXG4gIGFsbG93QWJvdmVSb290OiBib29sZWFuLFxuICBzZXBhcmF0b3I6IHN0cmluZyxcbiAgaXNQYXRoU2VwYXJhdG9yOiAoY29kZTogbnVtYmVyKSA9PiBib29sZWFuLFxuKTogc3RyaW5nIHtcbiAgbGV0IHJlcyA9IFwiXCI7XG4gIGxldCBsYXN0U2VnbWVudExlbmd0aCA9IDA7XG4gIGxldCBsYXN0U2xhc2ggPSAtMTtcbiAgbGV0IGRvdHMgPSAwO1xuICBsZXQgY29kZTogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICBmb3IgKGxldCBpID0gMCwgbGVuID0gcGF0aC5sZW5ndGg7IGkgPD0gbGVuOyArK2kpIHtcbiAgICBpZiAoaSA8IGxlbikgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBlbHNlIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSEpKSBicmVhaztcbiAgICBlbHNlIGNvZGUgPSBDSEFSX0ZPUldBUkRfU0xBU0g7XG5cbiAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUhKSkge1xuICAgICAgaWYgKGxhc3RTbGFzaCA9PT0gaSAtIDEgfHwgZG90cyA9PT0gMSkge1xuICAgICAgICAvLyBOT09QXG4gICAgICB9IGVsc2UgaWYgKGxhc3RTbGFzaCAhPT0gaSAtIDEgJiYgZG90cyA9PT0gMikge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgcmVzLmxlbmd0aCA8IDIgfHxcbiAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCAhPT0gMiB8fFxuICAgICAgICAgIHJlcy5jaGFyQ29kZUF0KHJlcy5sZW5ndGggLSAxKSAhPT0gQ0hBUl9ET1QgfHxcbiAgICAgICAgICByZXMuY2hhckNvZGVBdChyZXMubGVuZ3RoIC0gMikgIT09IENIQVJfRE9UXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChyZXMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgY29uc3QgbGFzdFNsYXNoSW5kZXggPSByZXMubGFzdEluZGV4T2Yoc2VwYXJhdG9yKTtcbiAgICAgICAgICAgIGlmIChsYXN0U2xhc2hJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgcmVzID0gXCJcIjtcbiAgICAgICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzID0gcmVzLnNsaWNlKDAsIGxhc3RTbGFzaEluZGV4KTtcbiAgICAgICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSByZXMubGVuZ3RoIC0gMSAtIHJlcy5sYXN0SW5kZXhPZihzZXBhcmF0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgICAgICAgIGRvdHMgPSAwO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChyZXMubGVuZ3RoID09PSAyIHx8IHJlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJlcyA9IFwiXCI7XG4gICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDA7XG4gICAgICAgICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgICAgICAgZG90cyA9IDA7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAwKSByZXMgKz0gYCR7c2VwYXJhdG9yfS4uYDtcbiAgICAgICAgICBlbHNlIHJlcyA9IFwiLi5cIjtcbiAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDI7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChyZXMubGVuZ3RoID4gMCkgcmVzICs9IHNlcGFyYXRvciArIHBhdGguc2xpY2UobGFzdFNsYXNoICsgMSwgaSk7XG4gICAgICAgIGVsc2UgcmVzID0gcGF0aC5zbGljZShsYXN0U2xhc2ggKyAxLCBpKTtcbiAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSBpIC0gbGFzdFNsYXNoIC0gMTtcbiAgICAgIH1cbiAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICBkb3RzID0gMDtcbiAgICB9IGVsc2UgaWYgKGNvZGUgPT09IENIQVJfRE9UICYmIGRvdHMgIT09IC0xKSB7XG4gICAgICArK2RvdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvdHMgPSAtMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsaURBQWlEO0FBQ2pELDZEQUE2RDtBQUM3RCxxQ0FBcUM7QUFFckMsU0FBUyxRQUFRLEVBQUUsa0JBQWtCLFFBQVEsaUJBQWlCO0FBRTlELDREQUE0RDtBQUM1RCxPQUFPLFNBQVMsZ0JBQ2QsSUFBWSxFQUNaLGNBQXVCLEVBQ3ZCLFNBQWlCLEVBQ2pCLGVBQTBDO0VBRTFDLElBQUksTUFBTTtFQUNWLElBQUksb0JBQW9CO0VBQ3hCLElBQUksWUFBWSxDQUFDO0VBQ2pCLElBQUksT0FBTztFQUNYLElBQUk7RUFDSixJQUFLLElBQUksSUFBSSxHQUFHLE1BQU0sS0FBSyxNQUFNLEVBQUUsS0FBSyxLQUFLLEVBQUUsRUFBRztJQUNoRCxJQUFJLElBQUksS0FBSyxPQUFPLEtBQUssVUFBVSxDQUFDO1NBQy9CLElBQUksZ0JBQWdCLE9BQVE7U0FDNUIsT0FBTztJQUVaLElBQUksZ0JBQWdCLE9BQVE7TUFDMUIsSUFBSSxjQUFjLElBQUksS0FBSyxTQUFTLEdBQUc7TUFDckMsT0FBTztNQUNULE9BQU8sSUFBSSxjQUFjLElBQUksS0FBSyxTQUFTLEdBQUc7UUFDNUMsSUFDRSxJQUFJLE1BQU0sR0FBRyxLQUNiLHNCQUFzQixLQUN0QixJQUFJLFVBQVUsQ0FBQyxJQUFJLE1BQU0sR0FBRyxPQUFPLFlBQ25DLElBQUksVUFBVSxDQUFDLElBQUksTUFBTSxHQUFHLE9BQU8sVUFDbkM7VUFDQSxJQUFJLElBQUksTUFBTSxHQUFHLEdBQUc7WUFDbEIsTUFBTSxpQkFBaUIsSUFBSSxXQUFXLENBQUM7WUFDdkMsSUFBSSxtQkFBbUIsQ0FBQyxHQUFHO2NBQ3pCLE1BQU07Y0FDTixvQkFBb0I7WUFDdEIsT0FBTztjQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRztjQUNuQixvQkFBb0IsSUFBSSxNQUFNLEdBQUcsSUFBSSxJQUFJLFdBQVcsQ0FBQztZQUN2RDtZQUNBLFlBQVk7WUFDWixPQUFPO1lBQ1A7VUFDRixPQUFPLElBQUksSUFBSSxNQUFNLEtBQUssS0FBSyxJQUFJLE1BQU0sS0FBSyxHQUFHO1lBQy9DLE1BQU07WUFDTixvQkFBb0I7WUFDcEIsWUFBWTtZQUNaLE9BQU87WUFDUDtVQUNGO1FBQ0Y7UUFDQSxJQUFJLGdCQUFnQjtVQUNsQixJQUFJLElBQUksTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUM7ZUFDdEMsTUFBTTtVQUNYLG9CQUFvQjtRQUN0QjtNQUNGLE9BQU87UUFDTCxJQUFJLElBQUksTUFBTSxHQUFHLEdBQUcsT0FBTyxZQUFZLEtBQUssS0FBSyxDQUFDLFlBQVksR0FBRzthQUM1RCxNQUFNLEtBQUssS0FBSyxDQUFDLFlBQVksR0FBRztRQUNyQyxvQkFBb0IsSUFBSSxZQUFZO01BQ3RDO01BQ0EsWUFBWTtNQUNaLE9BQU87SUFDVCxPQUFPLElBQUksU0FBUyxZQUFZLFNBQVMsQ0FBQyxHQUFHO01BQzNDLEVBQUU7SUFDSixPQUFPO01BQ0wsT0FBTyxDQUFDO0lBQ1Y7RUFDRjtFQUNBLE9BQU87QUFDVCJ9
// denoCacheMetadata=4300479300040513977,6341676486248516197