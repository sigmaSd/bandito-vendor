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
  for(let i = 0; i <= path.length; ++i){
    if (i < path.length) code = path.charCodeAt(i);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIyMS4wL19jb21tb24vbm9ybWFsaXplX3N0cmluZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IHRoZSBCcm93c2VyaWZ5IGF1dGhvcnMuIE1JVCBMaWNlbnNlLlxuLy8gUG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Jyb3dzZXJpZnkvcGF0aC1icm93c2VyaWZ5L1xuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBDSEFSX0RPVCwgQ0hBUl9GT1JXQVJEX1NMQVNIIH0gZnJvbSBcIi4vY29uc3RhbnRzLnRzXCI7XG5cbi8vIFJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCB3aXRoIGRpcmVjdG9yeSBuYW1lc1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN0cmluZyhcbiAgcGF0aDogc3RyaW5nLFxuICBhbGxvd0Fib3ZlUm9vdDogYm9vbGVhbixcbiAgc2VwYXJhdG9yOiBzdHJpbmcsXG4gIGlzUGF0aFNlcGFyYXRvcjogKGNvZGU6IG51bWJlcikgPT4gYm9vbGVhbixcbik6IHN0cmluZyB7XG4gIGxldCByZXMgPSBcIlwiO1xuICBsZXQgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICBsZXQgbGFzdFNsYXNoID0gLTE7XG4gIGxldCBkb3RzID0gMDtcbiAgbGV0IGNvZGU6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPD0gcGF0aC5sZW5ndGg7ICsraSkge1xuICAgIGlmIChpIDwgcGF0aC5sZW5ndGgpIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoaSk7XG4gICAgZWxzZSBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUhKSkgYnJlYWs7XG4gICAgZWxzZSBjb2RlID0gQ0hBUl9GT1JXQVJEX1NMQVNIO1xuXG4gICAgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlISkpIHtcbiAgICAgIGlmIChsYXN0U2xhc2ggPT09IGkgLSAxIHx8IGRvdHMgPT09IDEpIHtcbiAgICAgICAgLy8gTk9PUFxuICAgICAgfSBlbHNlIGlmIChsYXN0U2xhc2ggIT09IGkgLSAxICYmIGRvdHMgPT09IDIpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHJlcy5sZW5ndGggPCAyIHx8XG4gICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggIT09IDIgfHxcbiAgICAgICAgICByZXMuY2hhckNvZGVBdChyZXMubGVuZ3RoIC0gMSkgIT09IENIQVJfRE9UIHx8XG4gICAgICAgICAgcmVzLmNoYXJDb2RlQXQocmVzLmxlbmd0aCAtIDIpICE9PSBDSEFSX0RPVFxuICAgICAgICApIHtcbiAgICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RTbGFzaEluZGV4ID0gcmVzLmxhc3RJbmRleE9mKHNlcGFyYXRvcik7XG4gICAgICAgICAgICBpZiAobGFzdFNsYXNoSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgIHJlcyA9IFwiXCI7XG4gICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlcyA9IHJlcy5zbGljZSgwLCBsYXN0U2xhc2hJbmRleCk7XG4gICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gcmVzLmxlbmd0aCAtIDEgLSByZXMubGFzdEluZGV4T2Yoc2VwYXJhdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICAgICAgICBkb3RzID0gMDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAocmVzLmxlbmd0aCA9PT0gMiB8fCByZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXMgPSBcIlwiO1xuICAgICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICAgICAgICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgICAgICAgIGRvdHMgPSAwO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgICAgICAgIGlmIChyZXMubGVuZ3RoID4gMCkgcmVzICs9IGAke3NlcGFyYXRvcn0uLmA7XG4gICAgICAgICAgZWxzZSByZXMgPSBcIi4uXCI7XG4gICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAyO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDApIHJlcyArPSBzZXBhcmF0b3IgKyBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xuICAgICAgICBlbHNlIHJlcyA9IHBhdGguc2xpY2UobGFzdFNsYXNoICsgMSwgaSk7XG4gICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gaSAtIGxhc3RTbGFzaCAtIDE7XG4gICAgICB9XG4gICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgZG90cyA9IDA7XG4gICAgfSBlbHNlIGlmIChjb2RlID09PSBDSEFSX0RPVCAmJiBkb3RzICE9PSAtMSkge1xuICAgICAgKytkb3RzO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb3RzID0gLTE7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXM7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLGlEQUFpRDtBQUNqRCw2REFBNkQ7QUFDN0QscUNBQXFDO0FBRXJDLFNBQVMsUUFBUSxFQUFFLGtCQUFrQixRQUFRLGlCQUFpQjtBQUU5RCw0REFBNEQ7QUFDNUQsT0FBTyxTQUFTLGdCQUNkLElBQVksRUFDWixjQUF1QixFQUN2QixTQUFpQixFQUNqQixlQUEwQztFQUUxQyxJQUFJLE1BQU07RUFDVixJQUFJLG9CQUFvQjtFQUN4QixJQUFJLFlBQVksQ0FBQztFQUNqQixJQUFJLE9BQU87RUFDWCxJQUFJO0VBQ0osSUFBSyxJQUFJLElBQUksR0FBRyxLQUFLLEtBQUssTUFBTSxFQUFFLEVBQUUsRUFBRztJQUNyQyxJQUFJLElBQUksS0FBSyxNQUFNLEVBQUUsT0FBTyxLQUFLLFVBQVUsQ0FBQztTQUN2QyxJQUFJLGdCQUFnQixPQUFRO1NBQzVCLE9BQU87SUFFWixJQUFJLGdCQUFnQixPQUFRO01BQzFCLElBQUksY0FBYyxJQUFJLEtBQUssU0FBUyxHQUFHO01BQ3JDLE9BQU87TUFDVCxPQUFPLElBQUksY0FBYyxJQUFJLEtBQUssU0FBUyxHQUFHO1FBQzVDLElBQ0UsSUFBSSxNQUFNLEdBQUcsS0FDYixzQkFBc0IsS0FDdEIsSUFBSSxVQUFVLENBQUMsSUFBSSxNQUFNLEdBQUcsT0FBTyxZQUNuQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLE1BQU0sR0FBRyxPQUFPLFVBQ25DO1VBQ0EsSUFBSSxJQUFJLE1BQU0sR0FBRyxHQUFHO1lBQ2xCLE1BQU0saUJBQWlCLElBQUksV0FBVyxDQUFDO1lBQ3ZDLElBQUksbUJBQW1CLENBQUMsR0FBRztjQUN6QixNQUFNO2NBQ04sb0JBQW9CO1lBQ3RCLE9BQU87Y0FDTCxNQUFNLElBQUksS0FBSyxDQUFDLEdBQUc7Y0FDbkIsb0JBQW9CLElBQUksTUFBTSxHQUFHLElBQUksSUFBSSxXQUFXLENBQUM7WUFDdkQ7WUFDQSxZQUFZO1lBQ1osT0FBTztZQUNQO1VBQ0YsT0FBTyxJQUFJLElBQUksTUFBTSxLQUFLLEtBQUssSUFBSSxNQUFNLEtBQUssR0FBRztZQUMvQyxNQUFNO1lBQ04sb0JBQW9CO1lBQ3BCLFlBQVk7WUFDWixPQUFPO1lBQ1A7VUFDRjtRQUNGO1FBQ0EsSUFBSSxnQkFBZ0I7VUFDbEIsSUFBSSxJQUFJLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDO2VBQ3RDLE1BQU07VUFDWCxvQkFBb0I7UUFDdEI7TUFDRixPQUFPO1FBQ0wsSUFBSSxJQUFJLE1BQU0sR0FBRyxHQUFHLE9BQU8sWUFBWSxLQUFLLEtBQUssQ0FBQyxZQUFZLEdBQUc7YUFDNUQsTUFBTSxLQUFLLEtBQUssQ0FBQyxZQUFZLEdBQUc7UUFDckMsb0JBQW9CLElBQUksWUFBWTtNQUN0QztNQUNBLFlBQVk7TUFDWixPQUFPO0lBQ1QsT0FBTyxJQUFJLFNBQVMsWUFBWSxTQUFTLENBQUMsR0FBRztNQUMzQyxFQUFFO0lBQ0osT0FBTztNQUNMLE9BQU8sQ0FBQztJQUNWO0VBQ0Y7RUFDQSxPQUFPO0FBQ1QifQ==
// denoCacheMetadata=16867040799147762784,1815089987834397628