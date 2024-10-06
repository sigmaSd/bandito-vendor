// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assertArg } from "./../_common/dirname.ts";
import { stripTrailingSeparators } from "./../_common/strip_trailing_separators.ts";
import { isPosixPathSeparator } from "./_util.ts";
/**
 * Return the directory path of a `path`.
 * @param path - path to extract the directory from.
 */ export function dirname(path) {
  assertArg(path);
  let end = -1;
  let matchedNonSeparator = false;
  for(let i = path.length - 1; i >= 1; --i){
    if (isPosixPathSeparator(path.charCodeAt(i))) {
      if (matchedNonSeparator) {
        end = i;
        break;
      }
    } else {
      matchedNonSeparator = true;
    }
  }
  // No matches. Fallback based on provided path:
  //
  // - leading slashes paths
  //     "/foo" => "/"
  //     "///foo" => "/"
  // - no slash path
  //     "foo" => "."
  if (end === -1) {
    return isPosixPathSeparator(path.charCodeAt(0)) ? "/" : ".";
  }
  return stripTrailingSeparators(path.slice(0, end), isPosixPathSeparator);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL3Bvc2l4L2Rpcm5hbWUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgYXNzZXJ0QXJnIH0gZnJvbSBcIi4vLi4vX2NvbW1vbi9kaXJuYW1lLnRzXCI7XG5pbXBvcnQgeyBzdHJpcFRyYWlsaW5nU2VwYXJhdG9ycyB9IGZyb20gXCIuLy4uL19jb21tb24vc3RyaXBfdHJhaWxpbmdfc2VwYXJhdG9ycy50c1wiO1xuaW1wb3J0IHsgaXNQb3NpeFBhdGhTZXBhcmF0b3IgfSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG4vKipcbiAqIFJldHVybiB0aGUgZGlyZWN0b3J5IHBhdGggb2YgYSBgcGF0aGAuXG4gKiBAcGFyYW0gcGF0aCAtIHBhdGggdG8gZXh0cmFjdCB0aGUgZGlyZWN0b3J5IGZyb20uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJuYW1lKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGFzc2VydEFyZyhwYXRoKTtcblxuICBsZXQgZW5kID0gLTE7XG4gIGxldCBtYXRjaGVkTm9uU2VwYXJhdG9yID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkpIHtcbiAgICBpZiAoaXNQb3NpeFBhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGkpKSkge1xuICAgICAgaWYgKG1hdGNoZWROb25TZXBhcmF0b3IpIHtcbiAgICAgICAgZW5kID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hdGNoZWROb25TZXBhcmF0b3IgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIE5vIG1hdGNoZXMuIEZhbGxiYWNrIGJhc2VkIG9uIHByb3ZpZGVkIHBhdGg6XG4gIC8vXG4gIC8vIC0gbGVhZGluZyBzbGFzaGVzIHBhdGhzXG4gIC8vICAgICBcIi9mb29cIiA9PiBcIi9cIlxuICAvLyAgICAgXCIvLy9mb29cIiA9PiBcIi9cIlxuICAvLyAtIG5vIHNsYXNoIHBhdGhcbiAgLy8gICAgIFwiZm9vXCIgPT4gXCIuXCJcbiAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICByZXR1cm4gaXNQb3NpeFBhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDApKSA/IFwiL1wiIDogXCIuXCI7XG4gIH1cblxuICByZXR1cm4gc3RyaXBUcmFpbGluZ1NlcGFyYXRvcnMoXG4gICAgcGF0aC5zbGljZSgwLCBlbmQpLFxuICAgIGlzUG9zaXhQYXRoU2VwYXJhdG9yLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxTQUFTLFFBQVEsMEJBQTBCO0FBQ3BELFNBQVMsdUJBQXVCLFFBQVEsNENBQTRDO0FBQ3BGLFNBQVMsb0JBQW9CLFFBQVEsYUFBYTtBQUVsRDs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsUUFBUSxJQUFZO0VBQ2xDLFVBQVU7RUFFVixJQUFJLE1BQU0sQ0FBQztFQUNYLElBQUksc0JBQXNCO0VBRTFCLElBQUssSUFBSSxJQUFJLEtBQUssTUFBTSxHQUFHLEdBQUcsS0FBSyxHQUFHLEVBQUUsRUFBRztJQUN6QyxJQUFJLHFCQUFxQixLQUFLLFVBQVUsQ0FBQyxLQUFLO01BQzVDLElBQUkscUJBQXFCO1FBQ3ZCLE1BQU07UUFDTjtNQUNGO0lBQ0YsT0FBTztNQUNMLHNCQUFzQjtJQUN4QjtFQUNGO0VBRUEsK0NBQStDO0VBQy9DLEVBQUU7RUFDRiwwQkFBMEI7RUFDMUIsb0JBQW9CO0VBQ3BCLHNCQUFzQjtFQUN0QixrQkFBa0I7RUFDbEIsbUJBQW1CO0VBQ25CLElBQUksUUFBUSxDQUFDLEdBQUc7SUFDZCxPQUFPLHFCQUFxQixLQUFLLFVBQVUsQ0FBQyxNQUFNLE1BQU07RUFDMUQ7RUFFQSxPQUFPLHdCQUNMLEtBQUssS0FBSyxDQUFDLEdBQUcsTUFDZDtBQUVKIn0=
// denoCacheMetadata=12522203712793804936,11243320392216831953