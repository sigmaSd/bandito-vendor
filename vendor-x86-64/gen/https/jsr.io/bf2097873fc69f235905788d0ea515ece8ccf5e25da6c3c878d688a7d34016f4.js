// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { CHAR_BACKWARD_SLASH } from "./../_common/constants.ts";
import { resolve } from "./resolve.ts";
import { assertArgs } from "./../_common/relative.ts";
/**
 * Return the relative path from `from` to `to` based on current working directory.
 *
 * An example in windws, for instance:
 *  from = 'C:\\orandea\\test\\aaa'
 *  to = 'C:\\orandea\\impl\\bbb'
 * The output of the function should be: '..\\..\\impl\\bbb'
 *
 * @param from path in current working directory
 * @param to path in current working directory
 */ export function relative(from, to) {
  assertArgs(from, to);
  const fromOrig = resolve(from);
  const toOrig = resolve(to);
  if (fromOrig === toOrig) return "";
  from = fromOrig.toLowerCase();
  to = toOrig.toLowerCase();
  if (from === to) return "";
  // Trim any leading backslashes
  let fromStart = 0;
  let fromEnd = from.length;
  for(; fromStart < fromEnd; ++fromStart){
    if (from.charCodeAt(fromStart) !== CHAR_BACKWARD_SLASH) break;
  }
  // Trim trailing backslashes (applicable to UNC paths only)
  for(; fromEnd - 1 > fromStart; --fromEnd){
    if (from.charCodeAt(fromEnd - 1) !== CHAR_BACKWARD_SLASH) break;
  }
  const fromLen = fromEnd - fromStart;
  // Trim any leading backslashes
  let toStart = 0;
  let toEnd = to.length;
  for(; toStart < toEnd; ++toStart){
    if (to.charCodeAt(toStart) !== CHAR_BACKWARD_SLASH) break;
  }
  // Trim trailing backslashes (applicable to UNC paths only)
  for(; toEnd - 1 > toStart; --toEnd){
    if (to.charCodeAt(toEnd - 1) !== CHAR_BACKWARD_SLASH) break;
  }
  const toLen = toEnd - toStart;
  // Compare paths to find the longest common path from root
  const length = fromLen < toLen ? fromLen : toLen;
  let lastCommonSep = -1;
  let i = 0;
  for(; i <= length; ++i){
    if (i === length) {
      if (toLen > length) {
        if (to.charCodeAt(toStart + i) === CHAR_BACKWARD_SLASH) {
          // We get here if `from` is the exact base path for `to`.
          // For example: from='C:\\foo\\bar'; to='C:\\foo\\bar\\baz'
          return toOrig.slice(toStart + i + 1);
        } else if (i === 2) {
          // We get here if `from` is the device root.
          // For example: from='C:\\'; to='C:\\foo'
          return toOrig.slice(toStart + i);
        }
      }
      if (fromLen > length) {
        if (from.charCodeAt(fromStart + i) === CHAR_BACKWARD_SLASH) {
          // We get here if `to` is the exact base path for `from`.
          // For example: from='C:\\foo\\bar'; to='C:\\foo'
          lastCommonSep = i;
        } else if (i === 2) {
          // We get here if `to` is the device root.
          // For example: from='C:\\foo\\bar'; to='C:\\'
          lastCommonSep = 3;
        }
      }
      break;
    }
    const fromCode = from.charCodeAt(fromStart + i);
    const toCode = to.charCodeAt(toStart + i);
    if (fromCode !== toCode) break;
    else if (fromCode === CHAR_BACKWARD_SLASH) lastCommonSep = i;
  }
  // We found a mismatch before the first common path separator was seen, so
  // return the original `to`.
  if (i !== length && lastCommonSep === -1) {
    return toOrig;
  }
  let out = "";
  if (lastCommonSep === -1) lastCommonSep = 0;
  // Generate the relative path based on the path difference between `to` and
  // `from`
  for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
    if (i === fromEnd || from.charCodeAt(i) === CHAR_BACKWARD_SLASH) {
      if (out.length === 0) out += "..";
      else out += "\\..";
    }
  }
  // Lastly, append the rest of the destination (`to`) path that comes after
  // the common path parts
  if (out.length > 0) {
    return out + toOrig.slice(toStart + lastCommonSep, toEnd);
  } else {
    toStart += lastCommonSep;
    if (toOrig.charCodeAt(toStart) === CHAR_BACKWARD_SLASH) ++toStart;
    return toOrig.slice(toStart, toEnd);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL3dpbmRvd3MvcmVsYXRpdmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgQ0hBUl9CQUNLV0FSRF9TTEFTSCB9IGZyb20gXCIuLy4uL19jb21tb24vY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcIi4vcmVzb2x2ZS50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0QXJncyB9IGZyb20gXCIuLy4uL19jb21tb24vcmVsYXRpdmUudHNcIjtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIHJlbGF0aXZlIHBhdGggZnJvbSBgZnJvbWAgdG8gYHRvYCBiYXNlZCBvbiBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5LlxuICpcbiAqIEFuIGV4YW1wbGUgaW4gd2luZHdzLCBmb3IgaW5zdGFuY2U6XG4gKiAgZnJvbSA9ICdDOlxcXFxvcmFuZGVhXFxcXHRlc3RcXFxcYWFhJ1xuICogIHRvID0gJ0M6XFxcXG9yYW5kZWFcXFxcaW1wbFxcXFxiYmInXG4gKiBUaGUgb3V0cHV0IG9mIHRoZSBmdW5jdGlvbiBzaG91bGQgYmU6ICcuLlxcXFwuLlxcXFxpbXBsXFxcXGJiYidcbiAqXG4gKiBAcGFyYW0gZnJvbSBwYXRoIGluIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnlcbiAqIEBwYXJhbSB0byBwYXRoIGluIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbGF0aXZlKGZyb206IHN0cmluZywgdG86IHN0cmluZyk6IHN0cmluZyB7XG4gIGFzc2VydEFyZ3MoZnJvbSwgdG8pO1xuXG4gIGNvbnN0IGZyb21PcmlnID0gcmVzb2x2ZShmcm9tKTtcbiAgY29uc3QgdG9PcmlnID0gcmVzb2x2ZSh0byk7XG5cbiAgaWYgKGZyb21PcmlnID09PSB0b09yaWcpIHJldHVybiBcIlwiO1xuXG4gIGZyb20gPSBmcm9tT3JpZy50b0xvd2VyQ2FzZSgpO1xuICB0byA9IHRvT3JpZy50b0xvd2VyQ2FzZSgpO1xuXG4gIGlmIChmcm9tID09PSB0bykgcmV0dXJuIFwiXCI7XG5cbiAgLy8gVHJpbSBhbnkgbGVhZGluZyBiYWNrc2xhc2hlc1xuICBsZXQgZnJvbVN0YXJ0ID0gMDtcbiAgbGV0IGZyb21FbmQgPSBmcm9tLmxlbmd0aDtcbiAgZm9yICg7IGZyb21TdGFydCA8IGZyb21FbmQ7ICsrZnJvbVN0YXJ0KSB7XG4gICAgaWYgKGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICAvLyBUcmltIHRyYWlsaW5nIGJhY2tzbGFzaGVzIChhcHBsaWNhYmxlIHRvIFVOQyBwYXRocyBvbmx5KVxuICBmb3IgKDsgZnJvbUVuZCAtIDEgPiBmcm9tU3RhcnQ7IC0tZnJvbUVuZCkge1xuICAgIGlmIChmcm9tLmNoYXJDb2RlQXQoZnJvbUVuZCAtIDEpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICBjb25zdCBmcm9tTGVuID0gZnJvbUVuZCAtIGZyb21TdGFydDtcblxuICAvLyBUcmltIGFueSBsZWFkaW5nIGJhY2tzbGFzaGVzXG4gIGxldCB0b1N0YXJ0ID0gMDtcbiAgbGV0IHRvRW5kID0gdG8ubGVuZ3RoO1xuICBmb3IgKDsgdG9TdGFydCA8IHRvRW5kOyArK3RvU3RhcnQpIHtcbiAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0KSAhPT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkgYnJlYWs7XG4gIH1cbiAgLy8gVHJpbSB0cmFpbGluZyBiYWNrc2xhc2hlcyAoYXBwbGljYWJsZSB0byBVTkMgcGF0aHMgb25seSlcbiAgZm9yICg7IHRvRW5kIC0gMSA+IHRvU3RhcnQ7IC0tdG9FbmQpIHtcbiAgICBpZiAodG8uY2hhckNvZGVBdCh0b0VuZCAtIDEpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICBjb25zdCB0b0xlbiA9IHRvRW5kIC0gdG9TdGFydDtcblxuICAvLyBDb21wYXJlIHBhdGhzIHRvIGZpbmQgdGhlIGxvbmdlc3QgY29tbW9uIHBhdGggZnJvbSByb290XG4gIGNvbnN0IGxlbmd0aCA9IGZyb21MZW4gPCB0b0xlbiA/IGZyb21MZW4gOiB0b0xlbjtcbiAgbGV0IGxhc3RDb21tb25TZXAgPSAtMTtcbiAgbGV0IGkgPSAwO1xuICBmb3IgKDsgaSA8PSBsZW5ndGg7ICsraSkge1xuICAgIGlmIChpID09PSBsZW5ndGgpIHtcbiAgICAgIGlmICh0b0xlbiA+IGxlbmd0aCkge1xuICAgICAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0ICsgaSkgPT09IENIQVJfQkFDS1dBUkRfU0xBU0gpIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgZnJvbWAgaXMgdGhlIGV4YWN0IGJhc2UgcGF0aCBmb3IgYHRvYC5cbiAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nQzpcXFxcZm9vXFxcXGJhcic7IHRvPSdDOlxcXFxmb29cXFxcYmFyXFxcXGJheidcbiAgICAgICAgICByZXR1cm4gdG9PcmlnLnNsaWNlKHRvU3RhcnQgKyBpICsgMSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMikge1xuICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGBmcm9tYCBpcyB0aGUgZGV2aWNlIHJvb3QuXG4gICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209J0M6XFxcXCc7IHRvPSdDOlxcXFxmb28nXG4gICAgICAgICAgcmV0dXJuIHRvT3JpZy5zbGljZSh0b1N0YXJ0ICsgaSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmcm9tTGVuID4gbGVuZ3RoKSB7XG4gICAgICAgIGlmIChmcm9tLmNoYXJDb2RlQXQoZnJvbVN0YXJ0ICsgaSkgPT09IENIQVJfQkFDS1dBUkRfU0xBU0gpIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgdG9gIGlzIHRoZSBleGFjdCBiYXNlIHBhdGggZm9yIGBmcm9tYC5cbiAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nQzpcXFxcZm9vXFxcXGJhcic7IHRvPSdDOlxcXFxmb28nXG4gICAgICAgICAgbGFzdENvbW1vblNlcCA9IGk7XG4gICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMikge1xuICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGB0b2AgaXMgdGhlIGRldmljZSByb290LlxuICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPSdDOlxcXFxmb29cXFxcYmFyJzsgdG89J0M6XFxcXCdcbiAgICAgICAgICBsYXN0Q29tbW9uU2VwID0gMztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IGZyb21Db2RlID0gZnJvbS5jaGFyQ29kZUF0KGZyb21TdGFydCArIGkpO1xuICAgIGNvbnN0IHRvQ29kZSA9IHRvLmNoYXJDb2RlQXQodG9TdGFydCArIGkpO1xuICAgIGlmIChmcm9tQ29kZSAhPT0gdG9Db2RlKSBicmVhaztcbiAgICBlbHNlIGlmIChmcm9tQ29kZSA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkgbGFzdENvbW1vblNlcCA9IGk7XG4gIH1cblxuICAvLyBXZSBmb3VuZCBhIG1pc21hdGNoIGJlZm9yZSB0aGUgZmlyc3QgY29tbW9uIHBhdGggc2VwYXJhdG9yIHdhcyBzZWVuLCBzb1xuICAvLyByZXR1cm4gdGhlIG9yaWdpbmFsIGB0b2AuXG4gIGlmIChpICE9PSBsZW5ndGggJiYgbGFzdENvbW1vblNlcCA9PT0gLTEpIHtcbiAgICByZXR1cm4gdG9PcmlnO1xuICB9XG5cbiAgbGV0IG91dCA9IFwiXCI7XG4gIGlmIChsYXN0Q29tbW9uU2VwID09PSAtMSkgbGFzdENvbW1vblNlcCA9IDA7XG4gIC8vIEdlbmVyYXRlIHRoZSByZWxhdGl2ZSBwYXRoIGJhc2VkIG9uIHRoZSBwYXRoIGRpZmZlcmVuY2UgYmV0d2VlbiBgdG9gIGFuZFxuICAvLyBgZnJvbWBcbiAgZm9yIChpID0gZnJvbVN0YXJ0ICsgbGFzdENvbW1vblNlcCArIDE7IGkgPD0gZnJvbUVuZDsgKytpKSB7XG4gICAgaWYgKGkgPT09IGZyb21FbmQgfHwgZnJvbS5jaGFyQ29kZUF0KGkpID09PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSB7XG4gICAgICBpZiAob3V0Lmxlbmd0aCA9PT0gMCkgb3V0ICs9IFwiLi5cIjtcbiAgICAgIGVsc2Ugb3V0ICs9IFwiXFxcXC4uXCI7XG4gICAgfVxuICB9XG5cbiAgLy8gTGFzdGx5LCBhcHBlbmQgdGhlIHJlc3Qgb2YgdGhlIGRlc3RpbmF0aW9uIChgdG9gKSBwYXRoIHRoYXQgY29tZXMgYWZ0ZXJcbiAgLy8gdGhlIGNvbW1vbiBwYXRoIHBhcnRzXG4gIGlmIChvdXQubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBvdXQgKyB0b09yaWcuc2xpY2UodG9TdGFydCArIGxhc3RDb21tb25TZXAsIHRvRW5kKTtcbiAgfSBlbHNlIHtcbiAgICB0b1N0YXJ0ICs9IGxhc3RDb21tb25TZXA7XG4gICAgaWYgKHRvT3JpZy5jaGFyQ29kZUF0KHRvU3RhcnQpID09PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSArK3RvU3RhcnQ7XG4gICAgcmV0dXJuIHRvT3JpZy5zbGljZSh0b1N0YXJ0LCB0b0VuZCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsbUJBQW1CLFFBQVEsNEJBQTRCO0FBQ2hFLFNBQVMsT0FBTyxRQUFRLGVBQWU7QUFDdkMsU0FBUyxVQUFVLFFBQVEsMkJBQTJCO0FBRXREOzs7Ozs7Ozs7O0NBVUMsR0FDRCxPQUFPLFNBQVMsU0FBUyxJQUFZLEVBQUUsRUFBVTtFQUMvQyxXQUFXLE1BQU07RUFFakIsTUFBTSxXQUFXLFFBQVE7RUFDekIsTUFBTSxT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
// denoCacheMetadata=13000046062919616138,10923061801920012436