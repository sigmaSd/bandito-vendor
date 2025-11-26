// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export function _common(paths, sep) {
  const [first = "", ...remaining] = paths;
  if (first === "" || remaining.length === 0) {
    return first.substring(0, first.lastIndexOf(sep) + 1);
  }
  const parts = first.split(sep);
  let endOfPrefix = parts.length;
  for (const path of remaining){
    const compare = path.split(sep);
    for(let i = 0; i < endOfPrefix; i++){
      if (compare[i] !== parts[i]) {
        endOfPrefix = i;
      }
    }
    if (endOfPrefix === 0) {
      return "";
    }
  }
  const prefix = parts.slice(0, endOfPrefix).join(sep);
  return prefix.endsWith(sep) ? prefix : `${prefix}${sep}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL19jb21tb24vY29tbW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmV4cG9ydCBmdW5jdGlvbiBfY29tbW9uKHBhdGhzOiBzdHJpbmdbXSwgc2VwOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBbZmlyc3QgPSBcIlwiLCAuLi5yZW1haW5pbmddID0gcGF0aHM7XG4gIGlmIChmaXJzdCA9PT0gXCJcIiB8fCByZW1haW5pbmcubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGZpcnN0LnN1YnN0cmluZygwLCBmaXJzdC5sYXN0SW5kZXhPZihzZXApICsgMSk7XG4gIH1cbiAgY29uc3QgcGFydHMgPSBmaXJzdC5zcGxpdChzZXApO1xuXG4gIGxldCBlbmRPZlByZWZpeCA9IHBhcnRzLmxlbmd0aDtcbiAgZm9yIChjb25zdCBwYXRoIG9mIHJlbWFpbmluZykge1xuICAgIGNvbnN0IGNvbXBhcmUgPSBwYXRoLnNwbGl0KHNlcCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmRPZlByZWZpeDsgaSsrKSB7XG4gICAgICBpZiAoY29tcGFyZVtpXSAhPT0gcGFydHNbaV0pIHtcbiAgICAgICAgZW5kT2ZQcmVmaXggPSBpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbmRPZlByZWZpeCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICB9XG4gIGNvbnN0IHByZWZpeCA9IHBhcnRzLnNsaWNlKDAsIGVuZE9mUHJlZml4KS5qb2luKHNlcCk7XG4gIHJldHVybiBwcmVmaXguZW5kc1dpdGgoc2VwKSA/IHByZWZpeCA6IGAke3ByZWZpeH0ke3NlcH1gO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsT0FBTyxTQUFTLFFBQVEsS0FBZSxFQUFFLEdBQVc7RUFDbEQsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsVUFBVSxHQUFHO0VBQ25DLElBQUksVUFBVSxNQUFNLFVBQVUsTUFBTSxLQUFLLEdBQUc7SUFDMUMsT0FBTyxNQUFNLFNBQVMsQ0FBQyxHQUFHLE1BQU0sV0FBVyxDQUFDLE9BQU87RUFDckQ7RUFDQSxNQUFNLFFBQVEsTUFBTSxLQUFLLENBQUM7RUFFMUIsSUFBSSxjQUFjLE1BQU0sTUFBTTtFQUM5QixLQUFLLE1BQU0sUUFBUSxVQUFXO0lBQzVCLE1BQU0sVUFBVSxLQUFLLEtBQUssQ0FBQztJQUMzQixJQUFLLElBQUksSUFBSSxHQUFHLElBQUksYUFBYSxJQUFLO01BQ3BDLElBQUksT0FBTyxDQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsRUFBRSxFQUFFO1FBQzNCLGNBQWM7TUFDaEI7SUFDRjtJQUVBLElBQUksZ0JBQWdCLEdBQUc7TUFDckIsT0FBTztJQUNUO0VBQ0Y7RUFDQSxNQUFNLFNBQVMsTUFBTSxLQUFLLENBQUMsR0FBRyxhQUFhLElBQUksQ0FBQztFQUNoRCxPQUFPLE9BQU8sUUFBUSxDQUFDLE9BQU8sU0FBUyxHQUFHLFNBQVMsS0FBSztBQUMxRCJ9
// denoCacheMetadata=4744417717296057049,9216742587776827471