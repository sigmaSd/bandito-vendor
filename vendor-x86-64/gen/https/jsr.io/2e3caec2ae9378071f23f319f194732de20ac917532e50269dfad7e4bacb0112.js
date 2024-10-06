// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
// on npm.
/**
 * String formatters and utilities for dealing with ANSI color codes.
 *
 * This module is browser compatible.
 *
 * This module supports `NO_COLOR` environmental variable disabling any coloring
 * if `NO_COLOR` is set.
 *
 * @example
 * ```ts
 * import {
 *   bgBlue,
 *   bgRgb24,
 *   bgRgb8,
 *   bold,
 *   italic,
 *   red,
 *   rgb24,
 *   rgb8,
 * } from "@std/fmt/colors";
 *
 * console.log(bgBlue(italic(red(bold("Hello, World!")))));
 *
 * // also supports 8bit colors
 *
 * console.log(rgb8("Hello, World!", 42));
 *
 * console.log(bgRgb8("Hello, World!", 42));
 *
 * // and 24bit rgb
 *
 * console.log(rgb24("Hello, World!", {
 *   r: 41,
 *   g: 42,
 *   b: 43,
 * }));
 *
 * console.log(bgRgb24("Hello, World!", {
 *   r: 41,
 *   g: 42,
 *   b: 43,
 * }));
 * ```
 *
 * @module
 */ // deno-lint-ignore no-explicit-any
const { Deno } = globalThis;
const noColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : false;
let enabled = !noColor;
/**
 * Set changing text color to enabled or disabled
 * @param value
 */ export function setColorEnabled(value) {
  if (Deno?.noColor) {
    return;
  }
  enabled = value;
}
/** Get whether text color change is enabled or disabled. */ export function getColorEnabled() {
  return enabled;
}
/**
 * Builds color code
 * @param open
 * @param close
 */ function code(open, close) {
  return {
    open: `\x1b[${open.join(";")}m`,
    close: `\x1b[${close}m`,
    regexp: new RegExp(`\\x1b\\[${close}m`, "g")
  };
}
/**
 * Applies color and background based on color code and its associated text
 * @param str text to apply color settings to
 * @param code color code to apply
 */ function run(str, code) {
  return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
/**
 * Reset the text modified.
 * @param str text to reset
 */ export function reset(str) {
  return run(str, code([
    0
  ], 0));
}
/**
 * Make the text bold.
 * @param str text to make bold
 */ export function bold(str) {
  return run(str, code([
    1
  ], 22));
}
/**
 * The text emits only a small amount of light.
 * @param str text to dim
 *
 * Warning: Not all terminal emulators support `dim`.
 * For compatibility across all terminals, use {@linkcode gray} or {@linkcode brightBlack} instead.
 */ export function dim(str) {
  return run(str, code([
    2
  ], 22));
}
/**
 * Make the text italic.
 * @param str text to make italic
 */ export function italic(str) {
  return run(str, code([
    3
  ], 23));
}
/**
 * Make the text underline.
 * @param str text to underline
 */ export function underline(str) {
  return run(str, code([
    4
  ], 24));
}
/**
 * Invert background color and text color.
 * @param str text to invert its color
 */ export function inverse(str) {
  return run(str, code([
    7
  ], 27));
}
/**
 * Make the text hidden.
 * @param str text to hide
 */ export function hidden(str) {
  return run(str, code([
    8
  ], 28));
}
/**
 * Put horizontal line through the center of the text.
 * @param str text to strike through
 */ export function strikethrough(str) {
  return run(str, code([
    9
  ], 29));
}
/**
 * Set text color to black.
 * @param str text to make black
 */ export function black(str) {
  return run(str, code([
    30
  ], 39));
}
/**
 * Set text color to red.
 * @param str text to make red
 */ export function red(str) {
  return run(str, code([
    31
  ], 39));
}
/**
 * Set text color to green.
 * @param str text to make green
 */ export function green(str) {
  return run(str, code([
    32
  ], 39));
}
/**
 * Set text color to yellow.
 * @param str text to make yellow
 */ export function yellow(str) {
  return run(str, code([
    33
  ], 39));
}
/**
 * Set text color to blue.
 * @param str text to make blue
 */ export function blue(str) {
  return run(str, code([
    34
  ], 39));
}
/**
 * Set text color to magenta.
 * @param str text to make magenta
 */ export function magenta(str) {
  return run(str, code([
    35
  ], 39));
}
/**
 * Set text color to cyan.
 * @param str text to make cyan
 */ export function cyan(str) {
  return run(str, code([
    36
  ], 39));
}
/**
 * Set text color to white.
 * @param str text to make white
 */ export function white(str) {
  return run(str, code([
    37
  ], 39));
}
/**
 * Set text color to gray.
 * @param str text to make gray
 */ export function gray(str) {
  return brightBlack(str);
}
/**
 * Set text color to bright black.
 * @param str text to make bright-black
 */ export function brightBlack(str) {
  return run(str, code([
    90
  ], 39));
}
/**
 * Set text color to bright red.
 * @param str text to make bright-red
 */ export function brightRed(str) {
  return run(str, code([
    91
  ], 39));
}
/**
 * Set text color to bright green.
 * @param str text to make bright-green
 */ export function brightGreen(str) {
  return run(str, code([
    92
  ], 39));
}
/**
 * Set text color to bright yellow.
 * @param str text to make bright-yellow
 */ export function brightYellow(str) {
  return run(str, code([
    93
  ], 39));
}
/**
 * Set text color to bright blue.
 * @param str text to make bright-blue
 */ export function brightBlue(str) {
  return run(str, code([
    94
  ], 39));
}
/**
 * Set text color to bright magenta.
 * @param str text to make bright-magenta
 */ export function brightMagenta(str) {
  return run(str, code([
    95
  ], 39));
}
/**
 * Set text color to bright cyan.
 * @param str text to make bright-cyan
 */ export function brightCyan(str) {
  return run(str, code([
    96
  ], 39));
}
/**
 * Set text color to bright white.
 * @param str text to make bright-white
 */ export function brightWhite(str) {
  return run(str, code([
    97
  ], 39));
}
/**
 * Set background color to black.
 * @param str text to make its background black
 */ export function bgBlack(str) {
  return run(str, code([
    40
  ], 49));
}
/**
 * Set background color to red.
 * @param str text to make its background red
 */ export function bgRed(str) {
  return run(str, code([
    41
  ], 49));
}
/**
 * Set background color to green.
 * @param str text to make its background green
 */ export function bgGreen(str) {
  return run(str, code([
    42
  ], 49));
}
/**
 * Set background color to yellow.
 * @param str text to make its background yellow
 */ export function bgYellow(str) {
  return run(str, code([
    43
  ], 49));
}
/**
 * Set background color to blue.
 * @param str text to make its background blue
 */ export function bgBlue(str) {
  return run(str, code([
    44
  ], 49));
}
/**
 *  Set background color to magenta.
 * @param str text to make its background magenta
 */ export function bgMagenta(str) {
  return run(str, code([
    45
  ], 49));
}
/**
 * Set background color to cyan.
 * @param str text to make its background cyan
 */ export function bgCyan(str) {
  return run(str, code([
    46
  ], 49));
}
/**
 * Set background color to white.
 * @param str text to make its background white
 */ export function bgWhite(str) {
  return run(str, code([
    47
  ], 49));
}
/**
 * Set background color to bright black.
 * @param str text to make its background bright-black
 */ export function bgBrightBlack(str) {
  return run(str, code([
    100
  ], 49));
}
/**
 * Set background color to bright red.
 * @param str text to make its background bright-red
 */ export function bgBrightRed(str) {
  return run(str, code([
    101
  ], 49));
}
/**
 * Set background color to bright green.
 * @param str text to make its background bright-green
 */ export function bgBrightGreen(str) {
  return run(str, code([
    102
  ], 49));
}
/**
 * Set background color to bright yellow.
 * @param str text to make its background bright-yellow
 */ export function bgBrightYellow(str) {
  return run(str, code([
    103
  ], 49));
}
/**
 * Set background color to bright blue.
 * @param str text to make its background bright-blue
 */ export function bgBrightBlue(str) {
  return run(str, code([
    104
  ], 49));
}
/**
 * Set background color to bright magenta.
 * @param str text to make its background bright-magenta
 */ export function bgBrightMagenta(str) {
  return run(str, code([
    105
  ], 49));
}
/**
 * Set background color to bright cyan.
 * @param str text to make its background bright-cyan
 */ export function bgBrightCyan(str) {
  return run(str, code([
    106
  ], 49));
}
/**
 * Set background color to bright white.
 * @param str text to make its background bright-white
 */ export function bgBrightWhite(str) {
  return run(str, code([
    107
  ], 49));
}
/* Special Color Sequences */ /**
 * Clam and truncate color codes
 * @param n
 * @param max number to truncate to
 * @param min number to truncate from
 */ function clampAndTruncate(n, max = 255, min = 0) {
  return Math.trunc(Math.max(Math.min(n, max), min));
}
/**
 * Set text color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit colors to
 * @param color code
 */ export function rgb8(str, color) {
  return run(str, code([
    38,
    5,
    clampAndTruncate(color)
  ], 39));
}
/**
 * Set background color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit background colors to
 * @param color code
 */ export function bgRgb8(str, color) {
  return run(str, code([
    48,
    5,
    clampAndTruncate(color)
  ], 49));
}
/**
 * Set text color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 * import { rgb24 } from "@std/fmt/colors";
 *
 * rgb24("foo", 0xff00ff);
 * rgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */ export function rgb24(str, color) {
  if (typeof color === "number") {
    return run(str, code([
      38,
      2,
      color >> 16 & 0xff,
      color >> 8 & 0xff,
      color & 0xff
    ], 39));
  }
  return run(str, code([
    38,
    2,
    clampAndTruncate(color.r),
    clampAndTruncate(color.g),
    clampAndTruncate(color.b)
  ], 39));
}
/**
 * Set background color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 * import { bgRgb24 } from "@std/fmt/colors";
 *
 * bgRgb24("foo", 0xff00ff);
 * bgRgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */ export function bgRgb24(str, color) {
  if (typeof color === "number") {
    return run(str, code([
      48,
      2,
      color >> 16 & 0xff,
      color >> 8 & 0xff,
      color & 0xff
    ], 49));
  }
  return run(str, code([
    48,
    2,
    clampAndTruncate(color.r),
    clampAndTruncate(color.g),
    clampAndTruncate(color.b)
  ], 49));
}
// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new RegExp([
  "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
  "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))"
].join("|"), "g");
/**
 * Remove ANSI escape codes from the string.
 * @param string to remove ANSI escape codes from
 *
 *  @deprecated (will be removed in 1.0.0) Use {@linkcode stripAnsiCode} instead.
 */ export function stripColor(string) {
  return stripAnsiCode(string);
}
/**
 * Remove ANSI escape codes from the string.
 *
 * @param string to remove ANSI escape codes from
 */ export function stripAnsiCode(string) {
  return string.replace(ANSI_PATTERN, "");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZm10LzAuMjIxLjAvY29sb3JzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG4vLyBBIG1vZHVsZSB0byBwcmludCBBTlNJIHRlcm1pbmFsIGNvbG9ycy4gSW5zcGlyZWQgYnkgY2hhbGssIGtsZXVyLCBhbmQgY29sb3JzXG4vLyBvbiBucG0uXG5cbi8qKlxuICogU3RyaW5nIGZvcm1hdHRlcnMgYW5kIHV0aWxpdGllcyBmb3IgZGVhbGluZyB3aXRoIEFOU0kgY29sb3IgY29kZXMuXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuICpcbiAqIFRoaXMgbW9kdWxlIHN1cHBvcnRzIGBOT19DT0xPUmAgZW52aXJvbm1lbnRhbCB2YXJpYWJsZSBkaXNhYmxpbmcgYW55IGNvbG9yaW5nXG4gKiBpZiBgTk9fQ09MT1JgIGlzIHNldC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIGJnQmx1ZSxcbiAqICAgYmdSZ2IyNCxcbiAqICAgYmdSZ2I4LFxuICogICBib2xkLFxuICogICBpdGFsaWMsXG4gKiAgIHJlZCxcbiAqICAgcmdiMjQsXG4gKiAgIHJnYjgsXG4gKiB9IGZyb20gXCJAc3RkL2ZtdC9jb2xvcnNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhiZ0JsdWUoaXRhbGljKHJlZChib2xkKFwiSGVsbG8sIFdvcmxkIVwiKSkpKSk7XG4gKlxuICogLy8gYWxzbyBzdXBwb3J0cyA4Yml0IGNvbG9yc1xuICpcbiAqIGNvbnNvbGUubG9nKHJnYjgoXCJIZWxsbywgV29ybGQhXCIsIDQyKSk7XG4gKlxuICogY29uc29sZS5sb2coYmdSZ2I4KFwiSGVsbG8sIFdvcmxkIVwiLCA0MikpO1xuICpcbiAqIC8vIGFuZCAyNGJpdCByZ2JcbiAqXG4gKiBjb25zb2xlLmxvZyhyZ2IyNChcIkhlbGxvLCBXb3JsZCFcIiwge1xuICogICByOiA0MSxcbiAqICAgZzogNDIsXG4gKiAgIGI6IDQzLFxuICogfSkpO1xuICpcbiAqIGNvbnNvbGUubG9nKGJnUmdiMjQoXCJIZWxsbywgV29ybGQhXCIsIHtcbiAqICAgcjogNDEsXG4gKiAgIGc6IDQyLFxuICogICBiOiA0MyxcbiAqIH0pKTtcbiAqIGBgYFxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuY29uc3QgeyBEZW5vIH0gPSBnbG9iYWxUaGlzIGFzIGFueTtcbmNvbnN0IG5vQ29sb3IgPSB0eXBlb2YgRGVubz8ubm9Db2xvciA9PT0gXCJib29sZWFuXCJcbiAgPyBEZW5vLm5vQ29sb3IgYXMgYm9vbGVhblxuICA6IGZhbHNlO1xuXG5pbnRlcmZhY2UgQ29kZSB7XG4gIG9wZW46IHN0cmluZztcbiAgY2xvc2U6IHN0cmluZztcbiAgcmVnZXhwOiBSZWdFeHA7XG59XG5cbi8qKiBSR0IgOC1iaXRzIHBlciBjaGFubmVsLiBFYWNoIGluIHJhbmdlIGAwLT4yNTVgIG9yIGAweDAwLT4weGZmYCAqL1xuZXhwb3J0IGludGVyZmFjZSBSZ2Ige1xuICAvKiogUmVkIGNvbXBvbmVudCB2YWx1ZSAqL1xuICByOiBudW1iZXI7XG4gIC8qKiBHcmVlbiBjb21wb25lbnQgdmFsdWUgKi9cbiAgZzogbnVtYmVyO1xuICAvKiogQmx1ZSBjb21wb25lbnQgdmFsdWUgKi9cbiAgYjogbnVtYmVyO1xufVxuXG5sZXQgZW5hYmxlZCA9ICFub0NvbG9yO1xuXG4vKipcbiAqIFNldCBjaGFuZ2luZyB0ZXh0IGNvbG9yIHRvIGVuYWJsZWQgb3IgZGlzYWJsZWRcbiAqIEBwYXJhbSB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29sb3JFbmFibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gIGlmIChEZW5vPy5ub0NvbG9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZW5hYmxlZCA9IHZhbHVlO1xufVxuXG4vKiogR2V0IHdoZXRoZXIgdGV4dCBjb2xvciBjaGFuZ2UgaXMgZW5hYmxlZCBvciBkaXNhYmxlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb2xvckVuYWJsZWQoKTogYm9vbGVhbiB7XG4gIHJldHVybiBlbmFibGVkO1xufVxuXG4vKipcbiAqIEJ1aWxkcyBjb2xvciBjb2RlXG4gKiBAcGFyYW0gb3BlblxuICogQHBhcmFtIGNsb3NlXG4gKi9cbmZ1bmN0aW9uIGNvZGUob3BlbjogbnVtYmVyW10sIGNsb3NlOiBudW1iZXIpOiBDb2RlIHtcbiAgcmV0dXJuIHtcbiAgICBvcGVuOiBgXFx4MWJbJHtvcGVuLmpvaW4oXCI7XCIpfW1gLFxuICAgIGNsb3NlOiBgXFx4MWJbJHtjbG9zZX1tYCxcbiAgICByZWdleHA6IG5ldyBSZWdFeHAoYFxcXFx4MWJcXFxcWyR7Y2xvc2V9bWAsIFwiZ1wiKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGNvbG9yIGFuZCBiYWNrZ3JvdW5kIGJhc2VkIG9uIGNvbG9yIGNvZGUgYW5kIGl0cyBhc3NvY2lhdGVkIHRleHRcbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBhcHBseSBjb2xvciBzZXR0aW5ncyB0b1xuICogQHBhcmFtIGNvZGUgY29sb3IgY29kZSB0byBhcHBseVxuICovXG5mdW5jdGlvbiBydW4oc3RyOiBzdHJpbmcsIGNvZGU6IENvZGUpOiBzdHJpbmcge1xuICByZXR1cm4gZW5hYmxlZFxuICAgID8gYCR7Y29kZS5vcGVufSR7c3RyLnJlcGxhY2UoY29kZS5yZWdleHAsIGNvZGUub3Blbil9JHtjb2RlLmNsb3NlfWBcbiAgICA6IHN0cjtcbn1cblxuLyoqXG4gKiBSZXNldCB0aGUgdGV4dCBtb2RpZmllZC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byByZXNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMF0sIDApKTtcbn1cblxuLyoqXG4gKiBNYWtlIHRoZSB0ZXh0IGJvbGQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBib2xkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBib2xkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzFdLCAyMikpO1xufVxuXG4vKipcbiAqIFRoZSB0ZXh0IGVtaXRzIG9ubHkgYSBzbWFsbCBhbW91bnQgb2YgbGlnaHQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gZGltXG4gKlxuICogV2FybmluZzogTm90IGFsbCB0ZXJtaW5hbCBlbXVsYXRvcnMgc3VwcG9ydCBgZGltYC5cbiAqIEZvciBjb21wYXRpYmlsaXR5IGFjcm9zcyBhbGwgdGVybWluYWxzLCB1c2Uge0BsaW5rY29kZSBncmF5fSBvciB7QGxpbmtjb2RlIGJyaWdodEJsYWNrfSBpbnN0ZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGltKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzJdLCAyMikpO1xufVxuXG4vKipcbiAqIE1ha2UgdGhlIHRleHQgaXRhbGljLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRhbGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpdGFsaWMoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbM10sIDIzKSk7XG59XG5cbi8qKlxuICogTWFrZSB0aGUgdGV4dCB1bmRlcmxpbmUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gdW5kZXJsaW5lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bmRlcmxpbmUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNF0sIDI0KSk7XG59XG5cbi8qKlxuICogSW52ZXJ0IGJhY2tncm91bmQgY29sb3IgYW5kIHRleHQgY29sb3IuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gaW52ZXJ0IGl0cyBjb2xvclxuICovXG5leHBvcnQgZnVuY3Rpb24gaW52ZXJzZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs3XSwgMjcpKTtcbn1cblxuLyoqXG4gKiBNYWtlIHRoZSB0ZXh0IGhpZGRlbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBoaWRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoaWRkZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOF0sIDI4KSk7XG59XG5cbi8qKlxuICogUHV0IGhvcml6b250YWwgbGluZSB0aHJvdWdoIHRoZSBjZW50ZXIgb2YgdGhlIHRleHQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gc3RyaWtlIHRocm91Z2hcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmlrZXRocm91Z2goc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOV0sIDI5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYmxhY2suXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBibGFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmxhY2soc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzBdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIHJlZC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIHJlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMxXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBncmVlbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGdyZWVuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBncmVlbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszMl0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8geWVsbG93LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgeWVsbG93XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB5ZWxsb3coc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzNdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJsdWUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBibHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibHVlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM0XSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBtYWdlbnRhLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgbWFnZW50YVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFnZW50YShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszNV0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gY3lhbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGN5YW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGN5YW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzZdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIHdoaXRlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2Ugd2hpdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdoaXRlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM3XSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBncmF5LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgZ3JheVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JheShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBicmlnaHRCbGFjayhzdHIpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCBibGFjay5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC1ibGFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0QmxhY2soc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTBdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCByZWQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQtcmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRSZWQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTFdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCBncmVlbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC1ncmVlblxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0R3JlZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTJdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCB5ZWxsb3cuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQteWVsbG93XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRZZWxsb3coc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTNdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCBibHVlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LWJsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodEJsdWUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTRdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCBtYWdlbnRhLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LW1hZ2VudGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodE1hZ2VudGEoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTVdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCBjeWFuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LWN5YW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodEN5YW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTZdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCB3aGl0ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC13aGl0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0V2hpdGUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTddLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJsYWNrLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYmxhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQmxhY2soc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDBdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIHJlZC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIHJlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdSZWQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDFdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGdyZWVuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgZ3JlZW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnR3JlZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDJdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIHllbGxvdy5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIHllbGxvd1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmdZZWxsb3coc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDNdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJsdWUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBibHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JsdWUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDRdLCA0OSkpO1xufVxuXG4vKipcbiAqICBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBtYWdlbnRhLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgbWFnZW50YVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdNYWdlbnRhKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ1XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBjeWFuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgY3lhblxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdDeWFuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ2XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byB3aGl0ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIHdoaXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1doaXRlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ3XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgYmxhY2suXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtYmxhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0QmxhY2soc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTAwXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgcmVkLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LXJlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRSZWQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTAxXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgZ3JlZW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtZ3JlZW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0R3JlZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTAyXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgeWVsbG93LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LXllbGxvd1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRZZWxsb3coc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTAzXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgYmx1ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC1ibHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodEJsdWUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTA0XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgbWFnZW50YS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC1tYWdlbnRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodE1hZ2VudGEoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTA1XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgY3lhbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC1jeWFuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodEN5YW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTA2XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgd2hpdGUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtd2hpdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0V2hpdGUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTA3XSwgNDkpKTtcbn1cblxuLyogU3BlY2lhbCBDb2xvciBTZXF1ZW5jZXMgKi9cblxuLyoqXG4gKiBDbGFtIGFuZCB0cnVuY2F0ZSBjb2xvciBjb2Rlc1xuICogQHBhcmFtIG5cbiAqIEBwYXJhbSBtYXggbnVtYmVyIHRvIHRydW5jYXRlIHRvXG4gKiBAcGFyYW0gbWluIG51bWJlciB0byB0cnVuY2F0ZSBmcm9tXG4gKi9cbmZ1bmN0aW9uIGNsYW1wQW5kVHJ1bmNhdGUobjogbnVtYmVyLCBtYXggPSAyNTUsIG1pbiA9IDApOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC50cnVuYyhNYXRoLm1heChNYXRoLm1pbihuLCBtYXgpLCBtaW4pKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB1c2luZyBwYWxldHRlZCA4Yml0IGNvbG9ycy5cbiAqIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjOC1iaXRcbiAqIEBwYXJhbSBzdHIgdGV4dCBjb2xvciB0byBhcHBseSBwYWxldHRlZCA4Yml0IGNvbG9ycyB0b1xuICogQHBhcmFtIGNvbG9yIGNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJnYjgoc3RyOiBzdHJpbmcsIGNvbG9yOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzgsIDUsIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IpXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB1c2luZyBwYWxldHRlZCA4Yml0IGNvbG9ycy5cbiAqIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjOC1iaXRcbiAqIEBwYXJhbSBzdHIgdGV4dCBjb2xvciB0byBhcHBseSBwYWxldHRlZCA4Yml0IGJhY2tncm91bmQgY29sb3JzIHRvXG4gKiBAcGFyYW0gY29sb3IgY29kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdSZ2I4KHN0cjogc3RyaW5nLCBjb2xvcjogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ4LCA1LCBjbGFtcEFuZFRydW5jYXRlKGNvbG9yKV0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdXNpbmcgMjRiaXQgcmdiLlxuICogYGNvbG9yYCBjYW4gYmUgYSBudW1iZXIgaW4gcmFuZ2UgYDB4MDAwMDAwYCB0byBgMHhmZmZmZmZgIG9yXG4gKiBhbiBgUmdiYC5cbiAqXG4gKiBUbyBwcm9kdWNlIHRoZSBjb2xvciBtYWdlbnRhOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyByZ2IyNCB9IGZyb20gXCJAc3RkL2ZtdC9jb2xvcnNcIjtcbiAqXG4gKiByZ2IyNChcImZvb1wiLCAweGZmMDBmZik7XG4gKiByZ2IyNChcImZvb1wiLCB7cjogMjU1LCBnOiAwLCBiOiAyNTV9KTtcbiAqIGBgYFxuICogQHBhcmFtIHN0ciB0ZXh0IGNvbG9yIHRvIGFwcGx5IDI0Yml0IHJnYiB0b1xuICogQHBhcmFtIGNvbG9yIGNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJnYjI0KHN0cjogc3RyaW5nLCBjb2xvcjogbnVtYmVyIHwgUmdiKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBjb2xvciA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBydW4oXG4gICAgICBzdHIsXG4gICAgICBjb2RlKFxuICAgICAgICBbMzgsIDIsIChjb2xvciA+PiAxNikgJiAweGZmLCAoY29sb3IgPj4gOCkgJiAweGZmLCBjb2xvciAmIDB4ZmZdLFxuICAgICAgICAzOSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuICByZXR1cm4gcnVuKFxuICAgIHN0cixcbiAgICBjb2RlKFxuICAgICAgW1xuICAgICAgICAzOCxcbiAgICAgICAgMixcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5yKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5nKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5iKSxcbiAgICAgIF0sXG4gICAgICAzOSxcbiAgICApLFxuICApO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHVzaW5nIDI0Yml0IHJnYi5cbiAqIGBjb2xvcmAgY2FuIGJlIGEgbnVtYmVyIGluIHJhbmdlIGAweDAwMDAwMGAgdG8gYDB4ZmZmZmZmYCBvclxuICogYW4gYFJnYmAuXG4gKlxuICogVG8gcHJvZHVjZSB0aGUgY29sb3IgbWFnZW50YTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYmdSZ2IyNCB9IGZyb20gXCJAc3RkL2ZtdC9jb2xvcnNcIjtcbiAqXG4gKiBiZ1JnYjI0KFwiZm9vXCIsIDB4ZmYwMGZmKTtcbiAqIGJnUmdiMjQoXCJmb29cIiwge3I6IDI1NSwgZzogMCwgYjogMjU1fSk7XG4gKiBgYGBcbiAqIEBwYXJhbSBzdHIgdGV4dCBjb2xvciB0byBhcHBseSAyNGJpdCByZ2IgdG9cbiAqIEBwYXJhbSBjb2xvciBjb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1JnYjI0KHN0cjogc3RyaW5nLCBjb2xvcjogbnVtYmVyIHwgUmdiKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBjb2xvciA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBydW4oXG4gICAgICBzdHIsXG4gICAgICBjb2RlKFxuICAgICAgICBbNDgsIDIsIChjb2xvciA+PiAxNikgJiAweGZmLCAoY29sb3IgPj4gOCkgJiAweGZmLCBjb2xvciAmIDB4ZmZdLFxuICAgICAgICA0OSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuICByZXR1cm4gcnVuKFxuICAgIHN0cixcbiAgICBjb2RlKFxuICAgICAgW1xuICAgICAgICA0OCxcbiAgICAgICAgMixcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5yKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5nKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5iKSxcbiAgICAgIF0sXG4gICAgICA0OSxcbiAgICApLFxuICApO1xufVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vY2hhbGsvYW5zaS1yZWdleC9ibG9iLzAyZmE4OTNkNjE5ZDNkYTg1NDExYWNjOGZkNGUyZWVhMGU5NWE5ZDkvaW5kZXguanNcbmNvbnN0IEFOU0lfUEFUVEVSTiA9IG5ldyBSZWdFeHAoXG4gIFtcbiAgICBcIltcXFxcdTAwMUJcXFxcdTAwOUJdW1tcXFxcXSgpIzs/XSooPzooPzooPzooPzo7Wy1hLXpBLVpcXFxcZFxcXFwvIyYuOj0/JUB+X10rKSp8W2EtekEtWlxcXFxkXSsoPzo7Wy1hLXpBLVpcXFxcZFxcXFwvIyYuOj0/JUB+X10qKSopP1xcXFx1MDAwNylcIixcbiAgICBcIig/Oig/OlxcXFxkezEsNH0oPzo7XFxcXGR7MCw0fSkqKT9bXFxcXGRBLVBSLVRYWmNmLW5xLXV5PT48fl0pKVwiLFxuICBdLmpvaW4oXCJ8XCIpLFxuICBcImdcIixcbik7XG5cbi8qKlxuICogUmVtb3ZlIEFOU0kgZXNjYXBlIGNvZGVzIGZyb20gdGhlIHN0cmluZy5cbiAqIEBwYXJhbSBzdHJpbmcgdG8gcmVtb3ZlIEFOU0kgZXNjYXBlIGNvZGVzIGZyb21cbiAqXG4gKiAgQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMCkgVXNlIHtAbGlua2NvZGUgc3RyaXBBbnNpQ29kZX0gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwQ29sb3Ioc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyaXBBbnNpQ29kZShzdHJpbmcpO1xufVxuXG4vKipcbiAqIFJlbW92ZSBBTlNJIGVzY2FwZSBjb2RlcyBmcm9tIHRoZSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHN0cmluZyB0byByZW1vdmUgQU5TSSBlc2NhcGUgY29kZXMgZnJvbVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaXBBbnNpQ29kZShzdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHJpbmcucmVwbGFjZShBTlNJX1BBVFRFUk4sIFwiXCIpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFDckMsK0VBQStFO0FBQy9FLFVBQVU7QUFFVjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNkNDLEdBRUQsbUNBQW1DO0FBQ25DLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRztBQUNqQixNQUFNLFVBQVUsT0FBTyxNQUFNLFlBQVksWUFDckMsS0FBSyxPQUFPLEdBQ1o7QUFrQkosSUFBSSxVQUFVLENBQUM7QUFFZjs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsZ0JBQWdCLEtBQWM7RUFDNUMsSUFBSSxNQUFNLFNBQVM7SUFDakI7RUFDRjtFQUVBLFVBQVU7QUFDWjtBQUVBLDBEQUEwRCxHQUMxRCxPQUFPLFNBQVM7RUFDZCxPQUFPO0FBQ1Q7QUFFQTs7OztDQUlDLEdBQ0QsU0FBUyxLQUFLLElBQWMsRUFBRSxLQUFhO0VBQ3pDLE9BQU87SUFDTCxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDdkIsUUFBUSxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRTtFQUMxQztBQUNGO0FBRUE7Ozs7Q0FJQyxHQUNELFNBQVMsSUFBSSxHQUFXLEVBQUUsSUFBVTtFQUNsQyxPQUFPLFVBQ0gsQ0FBQyxFQUFFLEtBQUssSUFBSSxDQUFDLEVBQUUsSUFBSSxPQUFPLENBQUMsS0FBSyxNQUFNLEVBQUUsS0FBSyxJQUFJLEVBQUUsRUFBRSxLQUFLLEtBQUssQ0FBQyxDQUFDLEdBQ2pFO0FBQ047QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsTUFBTSxHQUFXO0VBQy9CLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFFLEVBQUU7QUFDNUI7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsS0FBSyxHQUFXO0VBQzlCLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFFLEVBQUU7QUFDNUI7QUFFQTs7Ozs7O0NBTUMsR0FDRCxPQUFPLFNBQVMsSUFBSSxHQUFXO0VBQzdCLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFFLEVBQUU7QUFDNUI7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsT0FBTyxHQUFXO0VBQ2hDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFFLEVBQUU7QUFDNUI7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsVUFBVSxHQUFXO0VBQ25DLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFFLEVBQUU7QUFDNUI7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsUUFBUSxHQUFXO0VBQ2pDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFFLEVBQUU7QUFDNUI7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsT0FBTyxHQUFXO0VBQ2hDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFFLEVBQUU7QUFDNUI7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsY0FBYyxHQUFXO0VBQ3ZDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFFLEVBQUU7QUFDNUI7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsTUFBTSxHQUFXO0VBQy9CLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsSUFBSSxHQUFXO0VBQzdCLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsTUFBTSxHQUFXO0VBQy9CLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsT0FBTyxHQUFXO0VBQ2hDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsS0FBSyxHQUFXO0VBQzlCLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsUUFBUSxHQUFXO0VBQ2pDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsS0FBSyxHQUFXO0VBQzlCLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsTUFBTSxHQUFXO0VBQy9CLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsS0FBSyxHQUFXO0VBQzlCLE9BQU8sWUFBWTtBQUNyQjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxZQUFZLEdBQVc7RUFDckMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxVQUFVLEdBQVc7RUFDbkMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxZQUFZLEdBQVc7RUFDckMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxhQUFhLEdBQVc7RUFDdEMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxXQUFXLEdBQVc7RUFDcEMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxjQUFjLEdBQVc7RUFDdkMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxXQUFXLEdBQVc7RUFDcEMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxZQUFZLEdBQVc7RUFDckMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxRQUFRLEdBQVc7RUFDakMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxNQUFNLEdBQVc7RUFDL0IsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxRQUFRLEdBQVc7RUFDakMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxTQUFTLEdBQVc7RUFDbEMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxPQUFPLEdBQVc7RUFDaEMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxVQUFVLEdBQVc7RUFDbkMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxPQUFPLEdBQVc7RUFDaEMsT0FBTyxJQUFJLEtBQUssS0FBSztJQUFDO0dBQUcsRUFBRTtBQUM3QjtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxRQUFRLEdBQVc7RUFDakMsT0FBTyxJ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
// denoCacheMetadata=11190634589186380305,12789580657865793108