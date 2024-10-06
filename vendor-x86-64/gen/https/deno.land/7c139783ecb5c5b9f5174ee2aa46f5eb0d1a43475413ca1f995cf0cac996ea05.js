// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { CAN_NOT_DISPLAY } from "./_constants.ts";
import { equal } from "./equal.ts";
import { AssertionError } from "./assertion_error.ts";
/**
 * Make an assertion that `actual` and `expected` are not equal, deeply.
 * If not then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the same type.
 *
 * @example
 * ```ts
 * import { assertNotEquals } from "https://deno.land/std@$STD_VERSION/assert/assert_not_equals.ts";
 *
 * assertNotEquals(1, 2); // Doesn't throw
 * assertNotEquals(1, 1); // Throws
 * ```
 */ export function assertNotEquals(actual, expected, msg) {
  if (!equal(actual, expected)) {
    return;
  }
  let actualString;
  let expectedString;
  try {
    actualString = String(actual);
  } catch  {
    actualString = CAN_NOT_DISPLAY;
  }
  try {
    expectedString = String(expected);
  } catch  {
    expectedString = CAN_NOT_DISPLAY;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  throw new AssertionError(`Expected actual: ${actualString} not to be: ${expectedString}${msgSuffix}`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL2Fzc2VydC9hc3NlcnRfbm90X2VxdWFscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBDQU5fTk9UX0RJU1BMQVkgfSBmcm9tIFwiLi9fY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyBlcXVhbCB9IGZyb20gXCIuL2VxdWFsLnRzXCI7XG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCIuL2Fzc2VydGlvbl9lcnJvci50c1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIG5vdCBlcXVhbCwgZGVlcGx5LlxuICogSWYgbm90IHRoZW4gdGhyb3cuXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGUgc2FtZSB0eXBlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0Tm90RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYXNzZXJ0L2Fzc2VydF9ub3RfZXF1YWxzLnRzXCI7XG4gKlxuICogYXNzZXJ0Tm90RXF1YWxzKDEsIDIpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnROb3RFcXVhbHMoMSwgMSk7IC8vIFRocm93c1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RFcXVhbHM8VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnPzogc3RyaW5nKSB7XG4gIGlmICghZXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IGFjdHVhbFN0cmluZzogc3RyaW5nO1xuICBsZXQgZXhwZWN0ZWRTdHJpbmc6IHN0cmluZztcbiAgdHJ5IHtcbiAgICBhY3R1YWxTdHJpbmcgPSBTdHJpbmcoYWN0dWFsKTtcbiAgfSBjYXRjaCB7XG4gICAgYWN0dWFsU3RyaW5nID0gQ0FOX05PVF9ESVNQTEFZO1xuICB9XG4gIHRyeSB7XG4gICAgZXhwZWN0ZWRTdHJpbmcgPSBTdHJpbmcoZXhwZWN0ZWQpO1xuICB9IGNhdGNoIHtcbiAgICBleHBlY3RlZFN0cmluZyA9IENBTl9OT1RfRElTUExBWTtcbiAgfVxuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICBgRXhwZWN0ZWQgYWN0dWFsOiAke2FjdHVhbFN0cmluZ30gbm90IHRvIGJlOiAke2V4cGVjdGVkU3RyaW5nfSR7bXNnU3VmZml4fWAsXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFLFNBQVMsZUFBZSxRQUFRLGtCQUFrQjtBQUNsRCxTQUFTLEtBQUssUUFBUSxhQUFhO0FBQ25DLFNBQVMsY0FBYyxRQUFRLHVCQUF1QjtBQUV0RDs7Ozs7Ozs7Ozs7OztDQWFDLEdBQ0QsT0FBTyxTQUFTLGdCQUFtQixNQUFTLEVBQUUsUUFBVyxFQUFFLEdBQVk7RUFDckUsSUFBSSxDQUFDLE1BQU0sUUFBUSxXQUFXO0lBQzVCO0VBQ0Y7RUFDQSxJQUFJO0VBQ0osSUFBSTtFQUNKLElBQUk7SUFDRixlQUFlLE9BQU87RUFDeEIsRUFBRSxPQUFNO0lBQ04sZUFBZTtFQUNqQjtFQUNBLElBQUk7SUFDRixpQkFBaUIsT0FBTztFQUMxQixFQUFFLE9BQU07SUFDTixpQkFBaUI7RUFDbkI7RUFDQSxNQUFNLFlBQVksTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRztFQUNyQyxNQUFNLElBQUksZUFDUixDQUFDLGlCQUFpQixFQUFFLGFBQWEsWUFBWSxFQUFFLGVBQWUsRUFBRSxVQUFVLENBQUM7QUFFL0UifQ==
// denoCacheMetadata=11933861383728413247,13352798767509963927