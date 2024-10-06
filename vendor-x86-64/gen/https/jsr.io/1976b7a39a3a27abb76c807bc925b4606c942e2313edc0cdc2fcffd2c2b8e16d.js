// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { CHAR_BACKWARD_SLASH, CHAR_COLON, CHAR_DOT, CHAR_QUESTION_MARK } from "./../_common/constants.ts";
import { isWindowsDeviceRoot } from "./_util.ts";
import { resolve } from "./resolve.ts";
/**
 * Resolves path to a namespace path
 * @param path to resolve to namespace
 */ export function toNamespacedPath(path) {
  // Note: this will *probably* throw somewhere.
  if (typeof path !== "string") return path;
  if (path.length === 0) return "";
  const resolvedPath = resolve(path);
  if (resolvedPath.length >= 3) {
    if (resolvedPath.charCodeAt(0) === CHAR_BACKWARD_SLASH) {
      // Possible UNC root
      if (resolvedPath.charCodeAt(1) === CHAR_BACKWARD_SLASH) {
        const code = resolvedPath.charCodeAt(2);
        if (code !== CHAR_QUESTION_MARK && code !== CHAR_DOT) {
          // Matched non-long UNC root, convert the path to a long UNC path
          return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
        }
      }
    } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
      // Possible device root
      if (resolvedPath.charCodeAt(1) === CHAR_COLON && resolvedPath.charCodeAt(2) === CHAR_BACKWARD_SLASH) {
        // Matched device root, convert the path to a long UNC path
        return `\\\\?\\${resolvedPath}`;
      }
    }
  }
  return path;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL3dpbmRvd3MvdG9fbmFtZXNwYWNlZF9wYXRoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7XG4gIENIQVJfQkFDS1dBUkRfU0xBU0gsXG4gIENIQVJfQ09MT04sXG4gIENIQVJfRE9ULFxuICBDSEFSX1FVRVNUSU9OX01BUkssXG59IGZyb20gXCIuLy4uL19jb21tb24vY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyBpc1dpbmRvd3NEZXZpY2VSb290IH0gZnJvbSBcIi4vX3V0aWwudHNcIjtcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwiLi9yZXNvbHZlLnRzXCI7XG5cbi8qKlxuICogUmVzb2x2ZXMgcGF0aCB0byBhIG5hbWVzcGFjZSBwYXRoXG4gKiBAcGFyYW0gcGF0aCB0byByZXNvbHZlIHRvIG5hbWVzcGFjZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9OYW1lc3BhY2VkUGF0aChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyBOb3RlOiB0aGlzIHdpbGwgKnByb2JhYmx5KiB0aHJvdyBzb21ld2hlcmUuXG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIHBhdGg7XG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwiXCI7XG5cbiAgY29uc3QgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZShwYXRoKTtcblxuICBpZiAocmVzb2x2ZWRQYXRoLmxlbmd0aCA+PSAzKSB7XG4gICAgaWYgKHJlc29sdmVkUGF0aC5jaGFyQ29kZUF0KDApID09PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSB7XG4gICAgICAvLyBQb3NzaWJsZSBVTkMgcm9vdFxuXG4gICAgICBpZiAocmVzb2x2ZWRQYXRoLmNoYXJDb2RlQXQoMSkgPT09IENIQVJfQkFDS1dBUkRfU0xBU0gpIHtcbiAgICAgICAgY29uc3QgY29kZSA9IHJlc29sdmVkUGF0aC5jaGFyQ29kZUF0KDIpO1xuICAgICAgICBpZiAoY29kZSAhPT0gQ0hBUl9RVUVTVElPTl9NQVJLICYmIGNvZGUgIT09IENIQVJfRE9UKSB7XG4gICAgICAgICAgLy8gTWF0Y2hlZCBub24tbG9uZyBVTkMgcm9vdCwgY29udmVydCB0aGUgcGF0aCB0byBhIGxvbmcgVU5DIHBhdGhcbiAgICAgICAgICByZXR1cm4gYFxcXFxcXFxcP1xcXFxVTkNcXFxcJHtyZXNvbHZlZFBhdGguc2xpY2UoMil9YDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNXaW5kb3dzRGV2aWNlUm9vdChyZXNvbHZlZFBhdGguY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgIC8vIFBvc3NpYmxlIGRldmljZSByb290XG5cbiAgICAgIGlmIChcbiAgICAgICAgcmVzb2x2ZWRQYXRoLmNoYXJDb2RlQXQoMSkgPT09IENIQVJfQ09MT04gJiZcbiAgICAgICAgcmVzb2x2ZWRQYXRoLmNoYXJDb2RlQXQoMikgPT09IENIQVJfQkFDS1dBUkRfU0xBU0hcbiAgICAgICkge1xuICAgICAgICAvLyBNYXRjaGVkIGRldmljZSByb290LCBjb252ZXJ0IHRoZSBwYXRoIHRvIGEgbG9uZyBVTkMgcGF0aFxuICAgICAgICByZXR1cm4gYFxcXFxcXFxcP1xcXFwke3Jlc29sdmVkUGF0aH1gO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXRoO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FDRSxtQkFBbUIsRUFDbkIsVUFBVSxFQUNWLFFBQVEsRUFDUixrQkFBa0IsUUFDYiw0QkFBNEI7QUFDbkMsU0FBUyxtQkFBbUIsUUFBUSxhQUFhO0FBQ2pELFNBQVMsT0FBTyxRQUFRLGVBQWU7QUFFdkM7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLGlCQUFpQixJQUFZO0VBQzNDLDhDQUE4QztFQUM5QyxJQUFJLE9BQU8sU0FBUyxVQUFVLE9BQU87RUFDckMsSUFBSSxLQUFLLE1BQU0sS0FBSyxHQUFHLE9BQU87RUFFOUIsTUFBTSxlQUFlLFFBQVE7RUFFN0IsSUFBSSxhQUFhLE1BQU0sSUFBSSxHQUFHO0lBQzVCLElBQUksYUFBYSxVQUFVLENBQUMsT0FBTyxxQkFBcUI7TUFDdEQsb0JBQW9CO01BRXBCLElBQUksYUFBYSxVQUFVLENBQUMsT0FBTyxxQkFBcUI7UUFDdEQsTUFBTSxPQUFPLGFBQWEsVUFBVSxDQUFDO1FBQ3JDLElBQUksU0FBUyxzQkFBc0IsU0FBUyxVQUFVO1VBQ3BELGlFQUFpRTtVQUNqRSxPQUFPLENBQUMsWUFBWSxFQUFFLGFBQWEsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUMvQztNQUNGO0lBQ0YsT0FBTyxJQUFJLG9CQUFvQixhQUFhLFVBQVUsQ0FBQyxLQUFLO01BQzFELHVCQUF1QjtNQUV2QixJQUNFLGFBQWEsVUFBVSxDQUFDLE9BQU8sY0FDL0IsYUFBYSxVQUFVLENBQUMsT0FBTyxxQkFDL0I7UUFDQSwyREFBMkQ7UUFDM0QsT0FBTyxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUM7TUFDakM7SUFDRjtFQUNGO0VBRUEsT0FBTztBQUNUIn0=
// denoCacheMetadata=1142348909016826009,4022294572695940511