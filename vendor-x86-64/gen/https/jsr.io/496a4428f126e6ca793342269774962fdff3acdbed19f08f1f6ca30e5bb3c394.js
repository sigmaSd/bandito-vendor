// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { encodeWhitespace } from "./../_common/to_file_url.ts";
import { isAbsolute } from "./is_absolute.ts";
/**
 * Converts a path string to a file URL.
 *
 * ```ts
 * import { toFileUrl } from "@std/path/windows/to_file_url";
 *
 * toFileUrl("\\home\\foo"); // new URL("file:///home/foo")
 * toFileUrl("C:\\Users\\foo"); // new URL("file:///C:/Users/foo")
 * toFileUrl("\\\\127.0.0.1\\home\\foo"); // new URL("file://127.0.0.1/home/foo")
 * ```
 * @param path to convert to file URL
 */ export function toFileUrl(path) {
  if (!isAbsolute(path)) {
    throw new TypeError("Must be an absolute path.");
  }
  const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
  const url = new URL("file:///");
  url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
  if (hostname !== undefined && hostname !== "localhost") {
    url.hostname = hostname;
    if (!url.hostname) {
      throw new TypeError("Invalid hostname.");
    }
  }
  return url;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL3dpbmRvd3MvdG9fZmlsZV91cmwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgZW5jb2RlV2hpdGVzcGFjZSB9IGZyb20gXCIuLy4uL19jb21tb24vdG9fZmlsZV91cmwudHNcIjtcbmltcG9ydCB7IGlzQWJzb2x1dGUgfSBmcm9tIFwiLi9pc19hYnNvbHV0ZS50c1wiO1xuXG4vKipcbiAqIENvbnZlcnRzIGEgcGF0aCBzdHJpbmcgdG8gYSBmaWxlIFVSTC5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdG9GaWxlVXJsIH0gZnJvbSBcIkBzdGQvcGF0aC93aW5kb3dzL3RvX2ZpbGVfdXJsXCI7XG4gKlxuICogdG9GaWxlVXJsKFwiXFxcXGhvbWVcXFxcZm9vXCIpOyAvLyBuZXcgVVJMKFwiZmlsZTovLy9ob21lL2Zvb1wiKVxuICogdG9GaWxlVXJsKFwiQzpcXFxcVXNlcnNcXFxcZm9vXCIpOyAvLyBuZXcgVVJMKFwiZmlsZTovLy9DOi9Vc2Vycy9mb29cIilcbiAqIHRvRmlsZVVybChcIlxcXFxcXFxcMTI3LjAuMC4xXFxcXGhvbWVcXFxcZm9vXCIpOyAvLyBuZXcgVVJMKFwiZmlsZTovLzEyNy4wLjAuMS9ob21lL2Zvb1wiKVxuICogYGBgXG4gKiBAcGFyYW0gcGF0aCB0byBjb252ZXJ0IHRvIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0ZpbGVVcmwocGF0aDogc3RyaW5nKTogVVJMIHtcbiAgaWYgKCFpc0Fic29sdXRlKHBhdGgpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk11c3QgYmUgYW4gYWJzb2x1dGUgcGF0aC5cIik7XG4gIH1cblxuICBjb25zdCBbLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gcGF0aC5tYXRjaChcbiAgICAvXig/OlsvXFxcXF17Mn0oW14vXFxcXF0rKSg/PVsvXFxcXF0oPzpbXi9cXFxcXXwkKSkpPyguKikvLFxuICApITtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChcImZpbGU6Ly8vXCIpO1xuICB1cmwucGF0aG5hbWUgPSBlbmNvZGVXaGl0ZXNwYWNlKHBhdGhuYW1lLnJlcGxhY2UoLyUvZywgXCIlMjVcIikpO1xuICBpZiAoaG9zdG5hbWUgIT09IHVuZGVmaW5lZCAmJiBob3N0bmFtZSAhPT0gXCJsb2NhbGhvc3RcIikge1xuICAgIHVybC5ob3N0bmFtZSA9IGhvc3RuYW1lO1xuICAgIGlmICghdXJsLmhvc3RuYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBob3N0bmFtZS5cIik7XG4gICAgfVxuICB9XG4gIHJldHVybiB1cmw7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLGdCQUFnQixRQUFRLDhCQUE4QjtBQUMvRCxTQUFTLFVBQVUsUUFBUSxtQkFBbUI7QUFFOUM7Ozs7Ozs7Ozs7O0NBV0MsR0FDRCxPQUFPLFNBQVMsVUFBVSxJQUFZO0VBQ3BDLElBQUksQ0FBQyxXQUFXLE9BQU87SUFDckIsTUFBTSxJQUFJLFVBQVU7RUFDdEI7RUFFQSxNQUFNLEdBQUcsVUFBVSxTQUFTLEdBQUcsS0FBSyxLQUFLLENBQ3ZDO0VBRUYsTUFBTSxNQUFNLElBQUksSUFBSTtFQUNwQixJQUFJLFFBQVEsR0FBRyxpQkFBaUIsU0FBUyxPQUFPLENBQUMsTUFBTTtFQUN2RCxJQUFJLGFBQWEsYUFBYSxhQUFhLGFBQWE7SUFDdEQsSUFBSSxRQUFRLEdBQUc7SUFDZixJQUFJLENBQUMsSUFBSSxRQUFRLEVBQUU7TUFDakIsTUFBTSxJQUFJLFVBQVU7SUFDdEI7RUFDRjtFQUNBLE9BQU87QUFDVCJ9
// denoCacheMetadata=17661725146890981220,9684086538624589125