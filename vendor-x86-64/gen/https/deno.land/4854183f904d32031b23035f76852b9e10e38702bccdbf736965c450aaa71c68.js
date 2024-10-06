// This file includes dependencies that are safe to use even
// when the user has no `deno.json` in their project folder.
// This commonly occurs when the user is bootstrapping a new
// project.
export { isIdentifierChar, isIdentifierStart } from "https://esm.sh/@babel/helper-validator-identifier@7.22.20";
import { isIdentifierChar, isIdentifierStart } from "https://esm.sh/@babel/helper-validator-identifier@7.22.20";
export function stringToIdentifier(str) {
  let ident = "";
  for(let i = 0; i < str.length; i++){
    const char = str.charCodeAt(i);
    if (i === 0 && !isIdentifierStart(char)) {
      ident += "_";
      if (isIdentifierChar(char)) {
        ident += str[i];
      }
    } else if (!isIdentifierChar(char)) {
      if (ident[ident.length - 1] !== "_") {
        ident += "_";
      }
    } else if (ident[ident.length - 1] !== "_" || str[i] !== "_") {
      ident += str[i];
    }
  }
  return ident;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9pbml0X3NhZmVfZGVwcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGlzIGZpbGUgaW5jbHVkZXMgZGVwZW5kZW5jaWVzIHRoYXQgYXJlIHNhZmUgdG8gdXNlIGV2ZW5cbi8vIHdoZW4gdGhlIHVzZXIgaGFzIG5vIGBkZW5vLmpzb25gIGluIHRoZWlyIHByb2plY3QgZm9sZGVyLlxuLy8gVGhpcyBjb21tb25seSBvY2N1cnMgd2hlbiB0aGUgdXNlciBpcyBib290c3RyYXBwaW5nIGEgbmV3XG4vLyBwcm9qZWN0LlxuXG5leHBvcnQge1xuICBpc0lkZW50aWZpZXJDaGFyLFxuICBpc0lkZW50aWZpZXJTdGFydCxcbn0gZnJvbSBcImh0dHBzOi8vZXNtLnNoL0BiYWJlbC9oZWxwZXItdmFsaWRhdG9yLWlkZW50aWZpZXJANy4yMi4yMFwiO1xuaW1wb3J0IHtcbiAgaXNJZGVudGlmaWVyQ2hhcixcbiAgaXNJZGVudGlmaWVyU3RhcnQsXG59IGZyb20gXCJodHRwczovL2VzbS5zaC9AYmFiZWwvaGVscGVyLXZhbGlkYXRvci1pZGVudGlmaWVyQDcuMjIuMjBcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvSWRlbnRpZmllcihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBpZGVudCA9IFwiXCI7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hhciA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChpID09PSAwICYmICFpc0lkZW50aWZpZXJTdGFydChjaGFyKSkge1xuICAgICAgaWRlbnQgKz0gXCJfXCI7XG4gICAgICBpZiAoaXNJZGVudGlmaWVyQ2hhcihjaGFyKSkge1xuICAgICAgICBpZGVudCArPSBzdHJbaV07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghaXNJZGVudGlmaWVyQ2hhcihjaGFyKSkge1xuICAgICAgaWYgKGlkZW50W2lkZW50Lmxlbmd0aCAtIDFdICE9PSBcIl9cIikge1xuICAgICAgICBpZGVudCArPSBcIl9cIjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlkZW50W2lkZW50Lmxlbmd0aCAtIDFdICE9PSBcIl9cIiB8fCBzdHJbaV0gIT09IFwiX1wiKSB7XG4gICAgICBpZGVudCArPSBzdHJbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGlkZW50O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDREQUE0RDtBQUM1RCw0REFBNEQ7QUFDNUQsNERBQTREO0FBQzVELFdBQVc7QUFFWCxTQUNFLGdCQUFnQixFQUNoQixpQkFBaUIsUUFDWiw0REFBNEQ7QUFDbkUsU0FDRSxnQkFBZ0IsRUFDaEIsaUJBQWlCLFFBQ1osNERBQTREO0FBRW5FLE9BQU8sU0FBUyxtQkFBbUIsR0FBVztFQUM1QyxJQUFJLFFBQVE7RUFDWixJQUFLLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxNQUFNLEVBQUUsSUFBSztJQUNuQyxNQUFNLE9BQU8sSUFBSSxVQUFVLENBQUM7SUFDNUIsSUFBSSxNQUFNLEtBQUssQ0FBQyxrQkFBa0IsT0FBTztNQUN2QyxTQUFTO01BQ1QsSUFBSSxpQkFBaUIsT0FBTztRQUMxQixTQUFTLEdBQUcsQ0FBQyxFQUFFO01BQ2pCO0lBQ0YsT0FBTyxJQUFJLENBQUMsaUJBQWlCLE9BQU87TUFDbEMsSUFBSSxLQUFLLENBQUMsTUFBTSxNQUFNLEdBQUcsRUFBRSxLQUFLLEtBQUs7UUFDbkMsU0FBUztNQUNYO0lBQ0YsT0FBTyxJQUFJLEtBQUssQ0FBQyxNQUFNLE1BQU0sR0FBRyxFQUFFLEtBQUssT0FBTyxHQUFHLENBQUMsRUFBRSxLQUFLLEtBQUs7TUFDNUQsU0FBUyxHQUFHLENBQUMsRUFBRTtJQUNqQjtFQUNGO0VBRUEsT0FBTztBQUNUIn0=
// denoCacheMetadata=10764571591958221771,18026132239557078785