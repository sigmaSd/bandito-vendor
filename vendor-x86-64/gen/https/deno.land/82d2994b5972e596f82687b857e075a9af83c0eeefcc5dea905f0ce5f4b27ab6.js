// Copyright 2009 The Go Authors. All rights reserved.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Port of the Go
 * {@link https://github.com/golang/go/blob/go1.12.5/src/encoding/hex/hex.go | encoding/hex}
 * library.
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts
 * import {
 *   decodeHex,
 *   encodeHex,
 * } from "https://deno.land/std@$STD_VERSION/encoding/hex.ts";
 *
 * const binary = new TextEncoder().encode("abc");
 * const encoded = encodeHex(binary);
 * console.log(encoded);
 * // => "616263"
 *
 * console.log(decodeHex(encoded));
 * // => Uint8Array(3) [ 97, 98, 99 ]
 * ```
 *
 * @module
 */ import { validateBinaryLike } from "./_util.ts";
const hexTable = new TextEncoder().encode("0123456789abcdef");
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
function errInvalidByte(byte) {
  return new TypeError(`Invalid byte '${String.fromCharCode(byte)}'`);
}
function errLength() {
  return new RangeError("Odd length hex string");
}
/** Converts a hex character into its value. */ function fromHexChar(byte) {
  // '0' <= byte && byte <= '9'
  if (48 <= byte && byte <= 57) return byte - 48;
  // 'a' <= byte && byte <= 'f'
  if (97 <= byte && byte <= 102) return byte - 97 + 10;
  // 'A' <= byte && byte <= 'F'
  if (65 <= byte && byte <= 70) return byte - 65 + 10;
  throw errInvalidByte(byte);
}
/**
 * Converts data into a hex-encoded string.
 *
 * @example
 * ```ts
 * import { encodeHex } from "https://deno.land/std@$STD_VERSION/encoding/hex.ts";
 *
 * encodeHex("abc"); // "616263"
 * ```
 */ export function encodeHex(src) {
  const u8 = validateBinaryLike(src);
  const dst = new Uint8Array(u8.length * 2);
  for(let i = 0; i < dst.length; i++){
    const v = u8[i];
    dst[i * 2] = hexTable[v >> 4];
    dst[i * 2 + 1] = hexTable[v & 0x0f];
  }
  return textDecoder.decode(dst);
}
/**
 * Decodes the given hex-encoded string. If the input is malformed, an error is
 * thrown.
 *
 * @example
 * ```ts
 * import { decodeHex } from "https://deno.land/std@$STD_VERSION/encoding/hex.ts";
 *
 * decodeHex("616263"); // Uint8Array(3) [ 97, 98, 99 ]
 * ```
 */ export function decodeHex(src) {
  const u8 = textEncoder.encode(src);
  const dst = new Uint8Array(u8.length / 2);
  for(let i = 0; i < dst.length; i++){
    const a = fromHexChar(u8[i * 2]);
    const b = fromHexChar(u8[i * 2 + 1]);
    dst[i] = a << 4 | b;
  }
  if (u8.length % 2 === 1) {
    // Check for invalid char before reporting bad length,
    // since the invalid char (if present) is an earlier problem.
    fromHexChar(u8[dst.length * 2]);
    throw errLength();
  }
  return dst;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL2VuY29kaW5nL2hleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAwOSBUaGUgR28gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9tYXN0ZXIvTElDRU5TRVxuLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBQb3J0IG9mIHRoZSBHb1xuICoge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9nbzEuMTIuNS9zcmMvZW5jb2RpbmcvaGV4L2hleC5nbyB8IGVuY29kaW5nL2hleH1cbiAqIGxpYnJhcnkuXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHtcbiAqICAgZGVjb2RlSGV4LFxuICogICBlbmNvZGVIZXgsXG4gKiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2VuY29kaW5nL2hleC50c1wiO1xuICpcbiAqIGNvbnN0IGJpbmFyeSA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcImFiY1wiKTtcbiAqIGNvbnN0IGVuY29kZWQgPSBlbmNvZGVIZXgoYmluYXJ5KTtcbiAqIGNvbnNvbGUubG9nKGVuY29kZWQpO1xuICogLy8gPT4gXCI2MTYyNjNcIlxuICpcbiAqIGNvbnNvbGUubG9nKGRlY29kZUhleChlbmNvZGVkKSk7XG4gKiAvLyA9PiBVaW50OEFycmF5KDMpIFsgOTcsIDk4LCA5OSBdXG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuaW1wb3J0IHsgdmFsaWRhdGVCaW5hcnlMaWtlIH0gZnJvbSBcIi4vX3V0aWwudHNcIjtcblxuY29uc3QgaGV4VGFibGUgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCIwMTIzNDU2Nzg5YWJjZGVmXCIpO1xuY29uc3QgdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbmNvbnN0IHRleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5cbmZ1bmN0aW9uIGVyckludmFsaWRCeXRlKGJ5dGU6IG51bWJlcikge1xuICByZXR1cm4gbmV3IFR5cGVFcnJvcihgSW52YWxpZCBieXRlICcke1N0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZSl9J2ApO1xufVxuXG5mdW5jdGlvbiBlcnJMZW5ndGgoKSB7XG4gIHJldHVybiBuZXcgUmFuZ2VFcnJvcihcIk9kZCBsZW5ndGggaGV4IHN0cmluZ1wiKTtcbn1cblxuLyoqIENvbnZlcnRzIGEgaGV4IGNoYXJhY3RlciBpbnRvIGl0cyB2YWx1ZS4gKi9cbmZ1bmN0aW9uIGZyb21IZXhDaGFyKGJ5dGU6IG51bWJlcik6IG51bWJlciB7XG4gIC8vICcwJyA8PSBieXRlICYmIGJ5dGUgPD0gJzknXG4gIGlmICg0OCA8PSBieXRlICYmIGJ5dGUgPD0gNTcpIHJldHVybiBieXRlIC0gNDg7XG4gIC8vICdhJyA8PSBieXRlICYmIGJ5dGUgPD0gJ2YnXG4gIGlmICg5NyA8PSBieXRlICYmIGJ5dGUgPD0gMTAyKSByZXR1cm4gYnl0ZSAtIDk3ICsgMTA7XG4gIC8vICdBJyA8PSBieXRlICYmIGJ5dGUgPD0gJ0YnXG4gIGlmICg2NSA8PSBieXRlICYmIGJ5dGUgPD0gNzApIHJldHVybiBieXRlIC0gNjUgKyAxMDtcblxuICB0aHJvdyBlcnJJbnZhbGlkQnl0ZShieXRlKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBkYXRhIGludG8gYSBoZXgtZW5jb2RlZCBzdHJpbmcuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBlbmNvZGVIZXggfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9lbmNvZGluZy9oZXgudHNcIjtcbiAqXG4gKiBlbmNvZGVIZXgoXCJhYmNcIik7IC8vIFwiNjE2MjYzXCJcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlSGV4KHNyYzogc3RyaW5nIHwgVWludDhBcnJheSB8IEFycmF5QnVmZmVyKTogc3RyaW5nIHtcbiAgY29uc3QgdTggPSB2YWxpZGF0ZUJpbmFyeUxpa2Uoc3JjKTtcblxuICBjb25zdCBkc3QgPSBuZXcgVWludDhBcnJheSh1OC5sZW5ndGggKiAyKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkc3QubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2ID0gdThbaV07XG4gICAgZHN0W2kgKiAyXSA9IGhleFRhYmxlW3YgPj4gNF07XG4gICAgZHN0W2kgKiAyICsgMV0gPSBoZXhUYWJsZVt2ICYgMHgwZl07XG4gIH1cbiAgcmV0dXJuIHRleHREZWNvZGVyLmRlY29kZShkc3QpO1xufVxuXG4vKipcbiAqIERlY29kZXMgdGhlIGdpdmVuIGhleC1lbmNvZGVkIHN0cmluZy4gSWYgdGhlIGlucHV0IGlzIG1hbGZvcm1lZCwgYW4gZXJyb3IgaXNcbiAqIHRocm93bi5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGRlY29kZUhleCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2VuY29kaW5nL2hleC50c1wiO1xuICpcbiAqIGRlY29kZUhleChcIjYxNjI2M1wiKTsgLy8gVWludDhBcnJheSgzKSBbIDk3LCA5OCwgOTkgXVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVIZXgoc3JjOiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgdTggPSB0ZXh0RW5jb2Rlci5lbmNvZGUoc3JjKTtcbiAgY29uc3QgZHN0ID0gbmV3IFVpbnQ4QXJyYXkodTgubGVuZ3RoIC8gMik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZHN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYSA9IGZyb21IZXhDaGFyKHU4W2kgKiAyXSk7XG4gICAgY29uc3QgYiA9IGZyb21IZXhDaGFyKHU4W2kgKiAyICsgMV0pO1xuICAgIGRzdFtpXSA9IChhIDw8IDQpIHwgYjtcbiAgfVxuXG4gIGlmICh1OC5sZW5ndGggJSAyID09PSAxKSB7XG4gICAgLy8gQ2hlY2sgZm9yIGludmFsaWQgY2hhciBiZWZvcmUgcmVwb3J0aW5nIGJhZCBsZW5ndGgsXG4gICAgLy8gc2luY2UgdGhlIGludmFsaWQgY2hhciAoaWYgcHJlc2VudCkgaXMgYW4gZWFybGllciBwcm9ibGVtLlxuICAgIGZyb21IZXhDaGFyKHU4W2RzdC5sZW5ndGggKiAyXSk7XG4gICAgdGhyb3cgZXJyTGVuZ3RoKCk7XG4gIH1cblxuICByZXR1cm4gZHN0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUN0RCxtREFBbUQ7QUFDbkQsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBd0JDLEdBRUQsU0FBUyxrQkFBa0IsUUFBUSxhQUFhO0FBRWhELE1BQU0sV0FBVyxJQUFJLGNBQWMsTUFBTSxDQUFDO0FBQzFDLE1BQU0sY0FBYyxJQUFJO0FBQ3hCLE1BQU0sY0FBYyxJQUFJO0FBRXhCLFNBQVMsZUFBZSxJQUFZO0VBQ2xDLE9BQU8sSUFBSSxVQUFVLENBQUMsY0FBYyxFQUFFLE9BQU8sWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BFO0FBRUEsU0FBUztFQUNQLE9BQU8sSUFBSSxXQUFXO0FBQ3hCO0FBRUEsNkNBQTZDLEdBQzdDLFNBQVMsWUFBWSxJQUFZO0VBQy9CLDZCQUE2QjtFQUM3QixJQUFJLE1BQU0sUUFBUSxRQUFRLElBQUksT0FBTyxPQUFPO0VBQzVDLDZCQUE2QjtFQUM3QixJQUFJLE1BQU0sUUFBUSxRQUFRLEtBQUssT0FBTyxPQUFPLEtBQUs7RUFDbEQsNkJBQTZCO0VBQzdCLElBQUksTUFBTSxRQUFRLFFBQVEsSUFBSSxPQUFPLE9BQU8sS0FBSztFQUVqRCxNQUFNLGVBQWU7QUFDdkI7QUFFQTs7Ozs7Ozs7O0NBU0MsR0FDRCxPQUFPLFNBQVMsVUFBVSxHQUFzQztFQUM5RCxNQUFNLEtBQUssbUJBQW1CO0VBRTlCLE1BQU0sTUFBTSxJQUFJLFdBQVcsR0FBRyxNQUFNLEdBQUc7RUFDdkMsSUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksTUFBTSxFQUFFLElBQUs7SUFDbkMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxFQUFFO0lBQ2YsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUU7SUFDN0IsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLElBQUksS0FBSztFQUNyQztFQUNBLE9BQU8sWUFBWSxNQUFNLENBQUM7QUFDNUI7QUFFQTs7Ozs7Ozs7OztDQVVDLEdBQ0QsT0FBTyxTQUFTLFVBQVUsR0FBVztFQUNuQyxNQUFNLEtBQUssWUFBWSxNQUFNLENBQUM7RUFDOUIsTUFBTSxNQUFNLElBQUksV0FBVyxHQUFHLE1BQU0sR0FBRztFQUN2QyxJQUFLLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxNQUFNLEVBQUUsSUFBSztJQUNuQyxNQUFNLElBQUksWUFBWSxFQUFFLENBQUMsSUFBSSxFQUFFO0lBQy9CLE1BQU0sSUFBSSxZQUFZLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRTtJQUNuQyxHQUFHLENBQUMsRUFBRSxHQUFHLEFBQUMsS0FBSyxJQUFLO0VBQ3RCO0VBRUEsSUFBSSxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUc7SUFDdkIsc0RBQXNEO0lBQ3RELDZEQUE2RDtJQUM3RCxZQUFZLEVBQUUsQ0FBQyxJQUFJLE1BQU0sR0FBRyxFQUFFO0lBQzlCLE1BQU07RUFDUjtFQUVBLE9BQU87QUFDVCJ9
// denoCacheMetadata=15977539618024751487,4823627288809740952