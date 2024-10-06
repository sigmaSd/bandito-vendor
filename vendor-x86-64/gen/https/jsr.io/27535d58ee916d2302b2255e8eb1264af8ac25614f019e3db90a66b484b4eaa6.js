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
 * } from "@std/encoding/hex";
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
 * import { encodeHex } from "@std/encoding/hex";
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
 * import { decodeHex } from "@std/encoding/hex";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZW5jb2RpbmcvMC4yMjEuMC9oZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMDkgVGhlIEdvIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvbWFzdGVyL0xJQ0VOU0Vcbi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUG9ydCBvZiB0aGUgR29cbiAqIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvZ28xLjEyLjUvc3JjL2VuY29kaW5nL2hleC9oZXguZ28gfCBlbmNvZGluZy9oZXh9XG4gKiBsaWJyYXJ5LlxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIGRlY29kZUhleCxcbiAqICAgZW5jb2RlSGV4LFxuICogfSBmcm9tIFwiQHN0ZC9lbmNvZGluZy9oZXhcIjtcbiAqXG4gKiBjb25zdCBiaW5hcnkgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJhYmNcIik7XG4gKiBjb25zdCBlbmNvZGVkID0gZW5jb2RlSGV4KGJpbmFyeSk7XG4gKiBjb25zb2xlLmxvZyhlbmNvZGVkKTtcbiAqIC8vID0+IFwiNjE2MjYzXCJcbiAqXG4gKiBjb25zb2xlLmxvZyhkZWNvZGVIZXgoZW5jb2RlZCkpO1xuICogLy8gPT4gVWludDhBcnJheSgzKSBbIDk3LCA5OCwgOTkgXVxuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCB7IHZhbGlkYXRlQmluYXJ5TGlrZSB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5cbmNvbnN0IGhleFRhYmxlID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiMDEyMzQ1Njc4OWFiY2RlZlwiKTtcbmNvbnN0IHRleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5jb25zdCB0ZXh0RGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuXG5mdW5jdGlvbiBlcnJJbnZhbGlkQnl0ZShieXRlOiBudW1iZXIpIHtcbiAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoYEludmFsaWQgYnl0ZSAnJHtTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGUpfSdgKTtcbn1cblxuZnVuY3Rpb24gZXJyTGVuZ3RoKCkge1xuICByZXR1cm4gbmV3IFJhbmdlRXJyb3IoXCJPZGQgbGVuZ3RoIGhleCBzdHJpbmdcIik7XG59XG5cbi8qKiBDb252ZXJ0cyBhIGhleCBjaGFyYWN0ZXIgaW50byBpdHMgdmFsdWUuICovXG5mdW5jdGlvbiBmcm9tSGV4Q2hhcihieXRlOiBudW1iZXIpOiBudW1iZXIge1xuICAvLyAnMCcgPD0gYnl0ZSAmJiBieXRlIDw9ICc5J1xuICBpZiAoNDggPD0gYnl0ZSAmJiBieXRlIDw9IDU3KSByZXR1cm4gYnl0ZSAtIDQ4O1xuICAvLyAnYScgPD0gYnl0ZSAmJiBieXRlIDw9ICdmJ1xuICBpZiAoOTcgPD0gYnl0ZSAmJiBieXRlIDw9IDEwMikgcmV0dXJuIGJ5dGUgLSA5NyArIDEwO1xuICAvLyAnQScgPD0gYnl0ZSAmJiBieXRlIDw9ICdGJ1xuICBpZiAoNjUgPD0gYnl0ZSAmJiBieXRlIDw9IDcwKSByZXR1cm4gYnl0ZSAtIDY1ICsgMTA7XG5cbiAgdGhyb3cgZXJySW52YWxpZEJ5dGUoYnl0ZSk7XG59XG5cbi8qKlxuICogQ29udmVydHMgZGF0YSBpbnRvIGEgaGV4LWVuY29kZWQgc3RyaW5nLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZW5jb2RlSGV4IH0gZnJvbSBcIkBzdGQvZW5jb2RpbmcvaGV4XCI7XG4gKlxuICogZW5jb2RlSGV4KFwiYWJjXCIpOyAvLyBcIjYxNjI2M1wiXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZUhleChzcmM6IHN0cmluZyB8IFVpbnQ4QXJyYXkgfCBBcnJheUJ1ZmZlcik6IHN0cmluZyB7XG4gIGNvbnN0IHU4ID0gdmFsaWRhdGVCaW5hcnlMaWtlKHNyYyk7XG5cbiAgY29uc3QgZHN0ID0gbmV3IFVpbnQ4QXJyYXkodTgubGVuZ3RoICogMik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZHN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdiA9IHU4W2ldITtcbiAgICBkc3RbaSAqIDJdID0gaGV4VGFibGVbdiA+PiA0XSE7XG4gICAgZHN0W2kgKiAyICsgMV0gPSBoZXhUYWJsZVt2ICYgMHgwZl0hO1xuICB9XG4gIHJldHVybiB0ZXh0RGVjb2Rlci5kZWNvZGUoZHN0KTtcbn1cblxuLyoqXG4gKiBEZWNvZGVzIHRoZSBnaXZlbiBoZXgtZW5jb2RlZCBzdHJpbmcuIElmIHRoZSBpbnB1dCBpcyBtYWxmb3JtZWQsIGFuIGVycm9yIGlzXG4gKiB0aHJvd24uXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBkZWNvZGVIZXggfSBmcm9tIFwiQHN0ZC9lbmNvZGluZy9oZXhcIjtcbiAqXG4gKiBkZWNvZGVIZXgoXCI2MTYyNjNcIik7IC8vIFVpbnQ4QXJyYXkoMykgWyA5NywgOTgsIDk5IF1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlSGV4KHNyYzogc3RyaW5nKTogVWludDhBcnJheSB7XG4gIGNvbnN0IHU4ID0gdGV4dEVuY29kZXIuZW5jb2RlKHNyYyk7XG4gIGNvbnN0IGRzdCA9IG5ldyBVaW50OEFycmF5KHU4Lmxlbmd0aCAvIDIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRzdC5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGEgPSBmcm9tSGV4Q2hhcih1OFtpICogMl0hKTtcbiAgICBjb25zdCBiID0gZnJvbUhleENoYXIodThbaSAqIDIgKyAxXSEpO1xuICAgIGRzdFtpXSA9IChhIDw8IDQpIHwgYjtcbiAgfVxuXG4gIGlmICh1OC5sZW5ndGggJSAyID09PSAxKSB7XG4gICAgLy8gQ2hlY2sgZm9yIGludmFsaWQgY2hhciBiZWZvcmUgcmVwb3J0aW5nIGJhZCBsZW5ndGgsXG4gICAgLy8gc2luY2UgdGhlIGludmFsaWQgY2hhciAoaWYgcHJlc2VudCkgaXMgYW4gZWFybGllciBwcm9ibGVtLlxuICAgIGZyb21IZXhDaGFyKHU4W2RzdC5sZW5ndGggKiAyXSEpO1xuICAgIHRocm93IGVyckxlbmd0aCgpO1xuICB9XG5cbiAgcmV0dXJuIGRzdDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFDdEQsbURBQW1EO0FBQ25ELDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXdCQyxHQUVELFNBQVMsa0JBQWtCLFFBQVEsYUFBYTtBQUVoRCxNQUFNLFdBQVcsSUFBSSxjQUFjLE1BQU0sQ0FBQztBQUMxQyxNQUFNLGNBQWMsSUFBSTtBQUN4QixNQUFNLGNBQWMsSUFBSTtBQUV4QixTQUFTLGVBQWUsSUFBWTtFQUNsQyxPQUFPLElBQUksVUFBVSxDQUFDLGNBQWMsRUFBRSxPQUFPLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNwRTtBQUVBLFNBQVM7RUFDUCxPQUFPLElBQUksV0FBVztBQUN4QjtBQUVBLDZDQUE2QyxHQUM3QyxTQUFTLFlBQVksSUFBWTtFQUMvQiw2QkFBNkI7RUFDN0IsSUFBSSxNQUFNLFFBQVEsUUFBUSxJQUFJLE9BQU8sT0FBTztFQUM1Qyw2QkFBNkI7RUFDN0IsSUFBSSxNQUFNLFFBQVEsUUFBUSxLQUFLLE9BQU8sT0FBTyxLQUFLO0VBQ2xELDZCQUE2QjtFQUM3QixJQUFJLE1BQU0sUUFBUSxRQUFRLElBQUksT0FBTyxPQUFPLEtBQUs7RUFFakQsTUFBTSxlQUFlO0FBQ3ZCO0FBRUE7Ozs7Ozs7OztDQVNDLEdBQ0QsT0FBTyxTQUFTLFVBQVUsR0FBc0M7RUFDOUQsTUFBTSxLQUFLLG1CQUFtQjtFQUU5QixNQUFNLE1BQU0sSUFBSSxXQUFXLEdBQUcsTUFBTSxHQUFHO0VBQ3ZDLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLE1BQU0sRUFBRSxJQUFLO0lBQ25DLE1BQU0sSUFBSSxFQUFFLENBQUMsRUFBRTtJQUNmLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFO0lBQzdCLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxJQUFJLEtBQUs7RUFDckM7RUFDQSxPQUFPLFlBQVksTUFBTSxDQUFDO0FBQzVCO0FBRUE7Ozs7Ozs7Ozs7Q0FVQyxHQUNELE9BQU8sU0FBUyxVQUFVLEdBQVc7RUFDbkMsTUFBTSxLQUFLLFlBQVksTUFBTSxDQUFDO0VBQzlCLE1BQU0sTUFBTSxJQUFJLFdBQVcsR0FBRyxNQUFNLEdBQUc7RUFDdkMsSUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksTUFBTSxFQUFFLElBQUs7SUFDbkMsTUFBTSxJQUFJLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRTtJQUMvQixNQUFNLElBQUksWUFBWSxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUU7SUFDbkMsR0FBRyxDQUFDLEVBQUUsR0FBRyxBQUFDLEtBQUssSUFBSztFQUN0QjtFQUVBLElBQUksR0FBRyxNQUFNLEdBQUcsTUFBTSxHQUFHO0lBQ3ZCLHNEQUFzRDtJQUN0RCw2REFBNkQ7SUFDN0QsWUFBWSxFQUFFLENBQUMsSUFBSSxNQUFNLEdBQUcsRUFBRTtJQUM5QixNQUFNO0VBQ1I7RUFFQSxPQUFPO0FBQ1QifQ==
// denoCacheMetadata=3961162396805035570,3221698350304111786