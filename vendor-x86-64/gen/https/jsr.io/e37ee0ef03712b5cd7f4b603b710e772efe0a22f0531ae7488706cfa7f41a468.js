// Copyright 2009 The Go Authors. All rights reserved.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Port of the Go
 * {@link https://github.com/golang/go/blob/go1.12.5/src/encoding/hex/hex.go | encoding/hex}
 * library.
 *
 * ```ts
 * import {
 *   decodeHex,
 *   encodeHex,
 * } from "@std/encoding/hex";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeHex("abc"), "616263");
 *
 * assertEquals(
 *   decodeHex("616263"),
 *   new TextEncoder().encode("abc"),
 * );
 * ```
 *
 * @module
 */ import { calcSizeHex, decode, encode } from "./_common16.ts";
import { detach } from "./_common_detach.ts";
const alphabet = new TextEncoder().encode("0123456789abcdef");
const rAlphabet = new Uint8Array(128).fill(16); // alphabet.length
alphabet.forEach((byte, i)=>rAlphabet[byte] = i);
new TextEncoder().encode("ABCDEF").forEach((byte, i)=>rAlphabet[byte] = i + 10);
/**
 * Converts data into a hex-encoded string.
 *
 * @param src The data to encode.
 *
 * @returns The hex-encoded string.
 *
 * @example Usage
 * ```ts
 * import { encodeHex } from "@std/encoding/hex";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeHex("abc"), "616263");
 * ```
 */ export function encodeHex(src) {
  if (typeof src === "string") {
    src = new TextEncoder().encode(src);
  } else if (src instanceof ArrayBuffer) src = new Uint8Array(src).slice();
  else src = src.slice();
  const [output, i] = detach(src, calcSizeHex(src.length));
  encode(output, i, 0, alphabet);
  return new TextDecoder().decode(output);
}
/**
 * Decodes the given hex-encoded string. If the input is malformed, an error is
 * thrown.
 *
 * @param src The hex-encoded string to decode.
 *
 * @returns The decoded data.
 *
 * @example Usage
 * ```ts
 * import { decodeHex } from "@std/encoding/hex";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   decodeHex("616263"),
 *   new TextEncoder().encode("abc"),
 * );
 * ```
 */ export function decodeHex(src) {
  const output = new TextEncoder().encode(src);
  // deno-lint-ignore no-explicit-any
  return new Uint8Array(output.buffer.transfer(decode(output, 0, 0, rAlphabet)));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZW5jb2RpbmcvMS4wLjEwL2hleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAwOSBUaGUgR28gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9tYXN0ZXIvTElDRU5TRVxuLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBQb3J0IG9mIHRoZSBHb1xuICoge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9nbzEuMTIuNS9zcmMvZW5jb2RpbmcvaGV4L2hleC5nbyB8IGVuY29kaW5nL2hleH1cbiAqIGxpYnJhcnkuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIGRlY29kZUhleCxcbiAqICAgZW5jb2RlSGV4LFxuICogfSBmcm9tIFwiQHN0ZC9lbmNvZGluZy9oZXhcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyhlbmNvZGVIZXgoXCJhYmNcIiksIFwiNjE2MjYzXCIpO1xuICpcbiAqIGFzc2VydEVxdWFscyhcbiAqICAgZGVjb2RlSGV4KFwiNjE2MjYzXCIpLFxuICogICBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJhYmNcIiksXG4gKiApO1xuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCB7IGNhbGNTaXplSGV4LCBkZWNvZGUsIGVuY29kZSB9IGZyb20gXCIuL19jb21tb24xNi50c1wiO1xuaW1wb3J0IHsgZGV0YWNoIH0gZnJvbSBcIi4vX2NvbW1vbl9kZXRhY2gudHNcIjtcbmltcG9ydCB0eXBlIHsgVWludDhBcnJheV8gfSBmcm9tIFwiLi9fdHlwZXMudHNcIjtcbmV4cG9ydCB0eXBlIHsgVWludDhBcnJheV8gfTtcblxuY29uc3QgYWxwaGFiZXQgPSBuZXcgVGV4dEVuY29kZXIoKVxuICAuZW5jb2RlKFwiMDEyMzQ1Njc4OWFiY2RlZlwiKTtcbmNvbnN0IHJBbHBoYWJldCA9IG5ldyBVaW50OEFycmF5KDEyOCkuZmlsbCgxNik7IC8vIGFscGhhYmV0Lmxlbmd0aFxuYWxwaGFiZXQuZm9yRWFjaCgoYnl0ZSwgaSkgPT4gckFscGhhYmV0W2J5dGVdID0gaSk7XG5uZXcgVGV4dEVuY29kZXIoKVxuICAuZW5jb2RlKFwiQUJDREVGXCIpXG4gIC5mb3JFYWNoKChieXRlLCBpKSA9PiByQWxwaGFiZXRbYnl0ZV0gPSBpICsgMTApO1xuXG4vKipcbiAqIENvbnZlcnRzIGRhdGEgaW50byBhIGhleC1lbmNvZGVkIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gc3JjIFRoZSBkYXRhIHRvIGVuY29kZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgaGV4LWVuY29kZWQgc3RyaW5nLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZW5jb2RlSGV4IH0gZnJvbSBcIkBzdGQvZW5jb2RpbmcvaGV4XCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoZW5jb2RlSGV4KFwiYWJjXCIpLCBcIjYxNjI2M1wiKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlSGV4KHNyYzogc3RyaW5nIHwgVWludDhBcnJheSB8IEFycmF5QnVmZmVyKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBzcmMgPT09IFwic3RyaW5nXCIpIHtcbiAgICBzcmMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoc3JjKSBhcyBVaW50OEFycmF5XztcbiAgfSBlbHNlIGlmIChzcmMgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikgc3JjID0gbmV3IFVpbnQ4QXJyYXkoc3JjKS5zbGljZSgpO1xuICBlbHNlIHNyYyA9IHNyYy5zbGljZSgpO1xuICBjb25zdCBbb3V0cHV0LCBpXSA9IGRldGFjaChcbiAgICBzcmMgYXMgVWludDhBcnJheV8sXG4gICAgY2FsY1NpemVIZXgoKHNyYyBhcyBVaW50OEFycmF5XykubGVuZ3RoKSxcbiAgKTtcbiAgZW5jb2RlKG91dHB1dCwgaSwgMCwgYWxwaGFiZXQpO1xuICByZXR1cm4gbmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKG91dHB1dCk7XG59XG5cbi8qKlxuICogRGVjb2RlcyB0aGUgZ2l2ZW4gaGV4LWVuY29kZWQgc3RyaW5nLiBJZiB0aGUgaW5wdXQgaXMgbWFsZm9ybWVkLCBhbiBlcnJvciBpc1xuICogdGhyb3duLlxuICpcbiAqIEBwYXJhbSBzcmMgVGhlIGhleC1lbmNvZGVkIHN0cmluZyB0byBkZWNvZGUuXG4gKlxuICogQHJldHVybnMgVGhlIGRlY29kZWQgZGF0YS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGRlY29kZUhleCB9IGZyb20gXCJAc3RkL2VuY29kaW5nL2hleFwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBkZWNvZGVIZXgoXCI2MTYyNjNcIiksXG4gKiAgIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcImFiY1wiKSxcbiAqICk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUhleChzcmM6IHN0cmluZyk6IFVpbnQ4QXJyYXlfIHtcbiAgY29uc3Qgb3V0cHV0ID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHNyYykgYXMgVWludDhBcnJheV87XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIHJldHVybiBuZXcgVWludDhBcnJheSgob3V0cHV0LmJ1ZmZlciBhcyBhbnkpXG4gICAgLnRyYW5zZmVyKGRlY29kZShvdXRwdXQsIDAsIDAsIHJBbHBoYWJldCkpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFDdEQsbURBQW1EO0FBQ25ELHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXFCQyxHQUVELFNBQVMsV0FBVyxFQUFFLE1BQU0sRUFBRSxNQUFNLFFBQVEsaUJBQWlCO0FBQzdELFNBQVMsTUFBTSxRQUFRLHNCQUFzQjtBQUk3QyxNQUFNLFdBQVcsSUFBSSxjQUNsQixNQUFNLENBQUM7QUFDVixNQUFNLFlBQVksSUFBSSxXQUFXLEtBQUssSUFBSSxDQUFDLEtBQUssa0JBQWtCO0FBQ2xFLFNBQVMsT0FBTyxDQUFDLENBQUMsTUFBTSxJQUFNLFNBQVMsQ0FBQyxLQUFLLEdBQUc7QUFDaEQsSUFBSSxjQUNELE1BQU0sQ0FBQyxVQUNQLE9BQU8sQ0FBQyxDQUFDLE1BQU0sSUFBTSxTQUFTLENBQUMsS0FBSyxHQUFHLElBQUk7QUFFOUM7Ozs7Ozs7Ozs7Ozs7O0NBY0MsR0FDRCxPQUFPLFNBQVMsVUFBVSxHQUFzQztFQUM5RCxJQUFJLE9BQU8sUUFBUSxVQUFVO0lBQzNCLE1BQU0sSUFBSSxjQUFjLE1BQU0sQ0FBQztFQUNqQyxPQUFPLElBQUksZUFBZSxhQUFhLE1BQU0sSUFBSSxXQUFXLEtBQUssS0FBSztPQUNqRSxNQUFNLElBQUksS0FBSztFQUNwQixNQUFNLENBQUMsUUFBUSxFQUFFLEdBQUcsT0FDbEIsS0FDQSxZQUFZLEFBQUMsSUFBb0IsTUFBTTtFQUV6QyxPQUFPLFFBQVEsR0FBRyxHQUFHO0VBQ3JCLE9BQU8sSUFBSSxjQUFjLE1BQU0sQ0FBQztBQUNsQztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FrQkMsR0FDRCxPQUFPLFNBQVMsVUFBVSxHQUFXO0VBQ25DLE1BQU0sU0FBUyxJQUFJLGNBQWMsTUFBTSxDQUFDO0VBQ3hDLG1DQUFtQztFQUNuQyxPQUFPLElBQUksV0FBVyxBQUFDLE9BQU8sTUFBTSxDQUNqQyxRQUFRLENBQUMsT0FBTyxRQUFRLEdBQUcsR0FBRztBQUNuQyJ9
// denoCacheMetadata=17493141362662048391,13026862323930757597