/**
 * This module contains a serializer for island props. The serializer is capable
 * of serializing the following:
 *
 * - `null`
 * - `boolean`
 * - `number`
 * - `bigint`
 * - `string`
 * - `array`
 * - `object` (no prototypes)
 * - `Uint8Array`
 * - `Signal` from `@preact/signals`
 *
 * Circular references are supported and objects with the same reference are
 * serialized only once.
 *
 * The corresponding deserializer is in `src/runtime/deserializer.ts`.
 */ import { isValidElement } from "preact";
import { KEY } from "../runtime/deserializer.ts";
// deno-lint-ignore no-explicit-any
function isSignal(x) {
  return x !== null && typeof x === "object" && typeof x.peek === "function" && "value" in x;
}
// deno-lint-ignore no-explicit-any
function isVNode(x) {
  return x !== null && typeof x === "object" && "type" in x && "ref" in x && "__k" in x && isValidElement(x);
}
export function serialize(data) {
  let requiresDeserializer = false;
  let hasSignals = false;
  const seen = new Map();
  const references = new Map();
  const keyStack = [];
  const parentStack = [];
  let earlyReturn = false;
  const toSerialize = {
    v: data,
    get r () {
      earlyReturn = true;
      if (references.size > 0) {
        const refs = [];
        for (const [targetPath, refPaths] of references){
          refs.push([
            targetPath,
            ...refPaths
          ]);
        }
        return refs;
      }
      return undefined;
    }
  };
  function replacer(key, value) {
    if (value === toSerialize || earlyReturn) {
      return value;
    }
    // Bypass signal's `.toJSON` method because we want to serialize
    // the signal itself including the signal's value and not just
    // the value. This is needed because `JSON.stringify` always
    // calls `.toJSON` automatically if available.
    // deno-lint-ignore no-explicit-any
    if (key !== null && isSignal(this[key])) {
      // deno-lint-ignore no-explicit-any
      value = this[key];
    }
    // For some object types, the path in the object graph from root is not the
    // same between the serialized representation, and deserialized objects. For
    // these cases, we have to change the contents of the key stack to match the
    // deserialized object.
    if (typeof this === "object" && this !== null && KEY in this) {
      if (this[KEY] === "s" && key === "v") key = "value"; // signals
      if (this[KEY] === "l" && key === "v") key = null; // literals (magic key object)
    }
    if (this !== toSerialize) {
      const parentIndex = parentStack.indexOf(this);
      parentStack.splice(parentIndex + 1);
      keyStack.splice(parentIndex);
      keyStack.push(key);
    // the parent is pushed before return
    }
    if (typeof value === "object" && value !== null) {
      const path = seen.get(value);
      const currentPath = [
        ...keyStack
      ];
      if (path !== undefined) {
        requiresDeserializer = true;
        const referenceArr = references.get(path);
        if (referenceArr === undefined) {
          references.set(path, [
            currentPath
          ]);
        } else {
          referenceArr.push(currentPath);
        }
        return 0;
      } else if (isVNode(value)) {
        requiresDeserializer = true;
        // No need to serialize JSX as we pick that up from
        // the rendered HTML in the browser.
        const res = null;
        parentStack.push(res);
        return res;
      } else {
        seen.set(value, currentPath);
      }
    }
    if (isSignal(value)) {
      requiresDeserializer = true;
      hasSignals = true;
      const res = {
        [KEY]: "s",
        v: value.peek()
      };
      parentStack.push(res);
      return res;
    } else if (typeof value === "bigint") {
      requiresDeserializer = true;
      const res = {
        [KEY]: "b",
        d: value.toString()
      };
      parentStack.push(res);
      return res;
    } else if (value instanceof Uint8Array) {
      requiresDeserializer = true;
      const res = {
        [KEY]: "u8a",
        d: b64encode(value)
      };
      parentStack.push(res);
      return res;
    } else if (typeof value === "object" && value && KEY in value) {
      requiresDeserializer = true;
      // deno-lint-ignore no-explicit-any
      const v = {
        ...value
      };
      const k = v[KEY];
      delete v[KEY];
      const res = {
        [KEY]: "l",
        k,
        v
      };
      parentStack.push(res);
      return res;
    } else {
      parentStack.push(value);
      return value;
    }
  }
  const serialized = JSON.stringify(toSerialize, replacer);
  return {
    serialized,
    requiresDeserializer,
    hasSignals
  };
}
// deno-fmt-ignore
const base64abc = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "+",
  "/"
];
/**
 * CREDIT: https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
 * Encodes a given Uint8Array, ArrayBuffer or string into RFC4648 base64 representation
 */ export function b64encode(buffer) {
  const uint8 = new Uint8Array(buffer);
  let result = "", i;
  const l = uint8.length;
  for(i = 2; i < l; i += 3){
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
    result += base64abc[(uint8[i - 1] & 0x0f) << 2 | uint8[i] >> 6];
    result += base64abc[uint8[i] & 0x3f];
  }
  if (i === l + 1) {
    // 1 octet yet to write
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[(uint8[i - 2] & 0x03) << 4];
    result += "==";
  }
  if (i === l) {
    // 2 octets yet to write
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
    result += base64abc[(uint8[i - 1] & 0x0f) << 2];
    result += "=";
  }
  return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9zZXJpYWxpemVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBtb2R1bGUgY29udGFpbnMgYSBzZXJpYWxpemVyIGZvciBpc2xhbmQgcHJvcHMuIFRoZSBzZXJpYWxpemVyIGlzIGNhcGFibGVcbiAqIG9mIHNlcmlhbGl6aW5nIHRoZSBmb2xsb3dpbmc6XG4gKlxuICogLSBgbnVsbGBcbiAqIC0gYGJvb2xlYW5gXG4gKiAtIGBudW1iZXJgXG4gKiAtIGBiaWdpbnRgXG4gKiAtIGBzdHJpbmdgXG4gKiAtIGBhcnJheWBcbiAqIC0gYG9iamVjdGAgKG5vIHByb3RvdHlwZXMpXG4gKiAtIGBVaW50OEFycmF5YFxuICogLSBgU2lnbmFsYCBmcm9tIGBAcHJlYWN0L3NpZ25hbHNgXG4gKlxuICogQ2lyY3VsYXIgcmVmZXJlbmNlcyBhcmUgc3VwcG9ydGVkIGFuZCBvYmplY3RzIHdpdGggdGhlIHNhbWUgcmVmZXJlbmNlIGFyZVxuICogc2VyaWFsaXplZCBvbmx5IG9uY2UuXG4gKlxuICogVGhlIGNvcnJlc3BvbmRpbmcgZGVzZXJpYWxpemVyIGlzIGluIGBzcmMvcnVudGltZS9kZXNlcmlhbGl6ZXIudHNgLlxuICovXG5pbXBvcnQgeyBpc1ZhbGlkRWxlbWVudCwgVk5vZGUgfSBmcm9tIFwicHJlYWN0XCI7XG5pbXBvcnQgeyBLRVkgfSBmcm9tIFwiLi4vcnVudGltZS9kZXNlcmlhbGl6ZXIudHNcIjtcblxuaW50ZXJmYWNlIFNlcmlhbGl6ZVJlc3VsdCB7XG4gIC8qKiBUaGUgc3RyaW5nIHNlcmlhbGl6YXRpb24uICovXG4gIHNlcmlhbGl6ZWQ6IHN0cmluZztcbiAgLyoqIElmIHRoZSBkZXNlcmlhbGl6ZXIgaXMgcmVxdWlyZWQgdG8gZGVzZXJpYWxpemUgdGhpcyBzdHJpbmcuIElmIHRoaXMgaXNcbiAgICogYGZhbHNlYCB0aGUgc2VyaWFsaXplZCBzdHJpbmcgY2FuIGJlIGRlc2VyaWFsaXplZCB3aXRoIGBKU09OLnBhcnNlYC4gKi9cbiAgcmVxdWlyZXNEZXNlcmlhbGl6ZXI6IGJvb2xlYW47XG4gIC8qKiBJZiB0aGUgc2VyaWFsaXphdGlvbiBjb250YWlucyBzZXJpYWxpemVkIHNpZ25hbHMuIElmIHRoaXMgaXMgYHRydWVgIHRoZVxuICAgKiBkZXNlcmlhbGl6ZXIgbXVzdCBiZSBwYXNzZWQgYSBmYWN0b3J5IGZ1bmN0aW9ucyBmb3Igc2lnbmFscy4gKi9cbiAgaGFzU2lnbmFsczogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIFNpZ25hbCB7XG4gIHBlZWsoKTogdW5rbm93bjtcbiAgdmFsdWU6IHVua25vd247XG59XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5mdW5jdGlvbiBpc1NpZ25hbCh4OiBhbnkpOiB4IGlzIFNpZ25hbCB7XG4gIHJldHVybiAoXG4gICAgeCAhPT0gbnVsbCAmJlxuICAgIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmXG4gICAgdHlwZW9mIHgucGVlayA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgXCJ2YWx1ZVwiIGluIHhcbiAgKTtcbn1cblxuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmZ1bmN0aW9uIGlzVk5vZGUoeDogYW55KTogeCBpcyBWTm9kZSB7XG4gIHJldHVybiB4ICE9PSBudWxsICYmIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIFwidHlwZVwiIGluIHggJiYgXCJyZWZcIiBpbiB4ICYmXG4gICAgXCJfX2tcIiBpbiB4ICYmXG4gICAgaXNWYWxpZEVsZW1lbnQoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemUoZGF0YTogdW5rbm93bik6IFNlcmlhbGl6ZVJlc3VsdCB7XG4gIGxldCByZXF1aXJlc0Rlc2VyaWFsaXplciA9IGZhbHNlO1xuICBsZXQgaGFzU2lnbmFscyA9IGZhbHNlO1xuICBjb25zdCBzZWVuID0gbmV3IE1hcDx1bmtub3duLCAoc3RyaW5nIHwgbnVsbClbXT4oKTtcbiAgY29uc3QgcmVmZXJlbmNlcyA9IG5ldyBNYXA8KHN0cmluZyB8IG51bGwpW10sIChzdHJpbmcgfCBudWxsKVtdW10+KCk7XG5cbiAgY29uc3Qga2V5U3RhY2s6IChzdHJpbmcgfCBudWxsKVtdID0gW107XG4gIGNvbnN0IHBhcmVudFN0YWNrOiB1bmtub3duW10gPSBbXTtcblxuICBsZXQgZWFybHlSZXR1cm4gPSBmYWxzZTtcblxuICBjb25zdCB0b1NlcmlhbGl6ZSA9IHtcbiAgICB2OiBkYXRhLFxuICAgIGdldCByKCkge1xuICAgICAgZWFybHlSZXR1cm4gPSB0cnVlO1xuICAgICAgaWYgKHJlZmVyZW5jZXMuc2l6ZSA+IDApIHtcbiAgICAgICAgY29uc3QgcmVmcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IFt0YXJnZXRQYXRoLCByZWZQYXRoc10gb2YgcmVmZXJlbmNlcykge1xuICAgICAgICAgIHJlZnMucHVzaChbdGFyZ2V0UGF0aCwgLi4ucmVmUGF0aHNdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVmcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSxcbiAgfTtcblxuICBmdW5jdGlvbiByZXBsYWNlcihcbiAgICB0aGlzOiB1bmtub3duLFxuICAgIGtleTogc3RyaW5nIHwgbnVsbCxcbiAgICB2YWx1ZTogdW5rbm93bixcbiAgKTogdW5rbm93biB7XG4gICAgaWYgKHZhbHVlID09PSB0b1NlcmlhbGl6ZSB8fCBlYXJseVJldHVybikge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8vIEJ5cGFzcyBzaWduYWwncyBgLnRvSlNPTmAgbWV0aG9kIGJlY2F1c2Ugd2Ugd2FudCB0byBzZXJpYWxpemVcbiAgICAvLyB0aGUgc2lnbmFsIGl0c2VsZiBpbmNsdWRpbmcgdGhlIHNpZ25hbCdzIHZhbHVlIGFuZCBub3QganVzdFxuICAgIC8vIHRoZSB2YWx1ZS4gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSBgSlNPTi5zdHJpbmdpZnlgIGFsd2F5c1xuICAgIC8vIGNhbGxzIGAudG9KU09OYCBhdXRvbWF0aWNhbGx5IGlmIGF2YWlsYWJsZS5cbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGlmIChrZXkgIT09IG51bGwgJiYgaXNTaWduYWwoKHRoaXMgYXMgYW55KVtrZXldKSkge1xuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgIHZhbHVlID0gKHRoaXMgYXMgYW55KVtrZXldO1xuICAgIH1cblxuICAgIC8vIEZvciBzb21lIG9iamVjdCB0eXBlcywgdGhlIHBhdGggaW4gdGhlIG9iamVjdCBncmFwaCBmcm9tIHJvb3QgaXMgbm90IHRoZVxuICAgIC8vIHNhbWUgYmV0d2VlbiB0aGUgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiwgYW5kIGRlc2VyaWFsaXplZCBvYmplY3RzLiBGb3JcbiAgICAvLyB0aGVzZSBjYXNlcywgd2UgaGF2ZSB0byBjaGFuZ2UgdGhlIGNvbnRlbnRzIG9mIHRoZSBrZXkgc3RhY2sgdG8gbWF0Y2ggdGhlXG4gICAgLy8gZGVzZXJpYWxpemVkIG9iamVjdC5cbiAgICBpZiAodHlwZW9mIHRoaXMgPT09IFwib2JqZWN0XCIgJiYgdGhpcyAhPT0gbnVsbCAmJiBLRVkgaW4gdGhpcykge1xuICAgICAgaWYgKHRoaXNbS0VZXSA9PT0gXCJzXCIgJiYga2V5ID09PSBcInZcIikga2V5ID0gXCJ2YWx1ZVwiOyAvLyBzaWduYWxzXG4gICAgICBpZiAodGhpc1tLRVldID09PSBcImxcIiAmJiBrZXkgPT09IFwidlwiKSBrZXkgPSBudWxsOyAvLyBsaXRlcmFscyAobWFnaWMga2V5IG9iamVjdClcbiAgICB9XG5cbiAgICBpZiAodGhpcyAhPT0gdG9TZXJpYWxpemUpIHtcbiAgICAgIGNvbnN0IHBhcmVudEluZGV4ID0gcGFyZW50U3RhY2suaW5kZXhPZih0aGlzKTtcbiAgICAgIHBhcmVudFN0YWNrLnNwbGljZShwYXJlbnRJbmRleCArIDEpO1xuICAgICAga2V5U3RhY2suc3BsaWNlKHBhcmVudEluZGV4KTtcbiAgICAgIGtleVN0YWNrLnB1c2goa2V5KTtcbiAgICAgIC8vIHRoZSBwYXJlbnQgaXMgcHVzaGVkIGJlZm9yZSByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBwYXRoID0gc2Vlbi5nZXQodmFsdWUpO1xuICAgICAgY29uc3QgY3VycmVudFBhdGggPSBbLi4ua2V5U3RhY2tdO1xuICAgICAgaWYgKHBhdGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXF1aXJlc0Rlc2VyaWFsaXplciA9IHRydWU7XG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZUFyciA9IHJlZmVyZW5jZXMuZ2V0KHBhdGgpO1xuICAgICAgICBpZiAocmVmZXJlbmNlQXJyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZWZlcmVuY2VzLnNldChwYXRoLCBbY3VycmVudFBhdGhdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWZlcmVuY2VBcnIucHVzaChjdXJyZW50UGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9IGVsc2UgaWYgKGlzVk5vZGUodmFsdWUpKSB7XG4gICAgICAgIHJlcXVpcmVzRGVzZXJpYWxpemVyID0gdHJ1ZTtcbiAgICAgICAgLy8gTm8gbmVlZCB0byBzZXJpYWxpemUgSlNYIGFzIHdlIHBpY2sgdGhhdCB1cCBmcm9tXG4gICAgICAgIC8vIHRoZSByZW5kZXJlZCBIVE1MIGluIHRoZSBicm93c2VyLlxuICAgICAgICBjb25zdCByZXMgPSBudWxsO1xuICAgICAgICBwYXJlbnRTdGFjay5wdXNoKHJlcyk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWVuLnNldCh2YWx1ZSwgY3VycmVudFBhdGgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpc1NpZ25hbCh2YWx1ZSkpIHtcbiAgICAgIHJlcXVpcmVzRGVzZXJpYWxpemVyID0gdHJ1ZTtcbiAgICAgIGhhc1NpZ25hbHMgPSB0cnVlO1xuICAgICAgY29uc3QgcmVzID0geyBbS0VZXTogXCJzXCIsIHY6IHZhbHVlLnBlZWsoKSB9O1xuICAgICAgcGFyZW50U3RhY2sucHVzaChyZXMpO1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJiaWdpbnRcIikge1xuICAgICAgcmVxdWlyZXNEZXNlcmlhbGl6ZXIgPSB0cnVlO1xuICAgICAgY29uc3QgcmVzID0geyBbS0VZXTogXCJiXCIsIGQ6IHZhbHVlLnRvU3RyaW5nKCkgfTtcbiAgICAgIHBhcmVudFN0YWNrLnB1c2gocmVzKTtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgIHJlcXVpcmVzRGVzZXJpYWxpemVyID0gdHJ1ZTtcbiAgICAgIGNvbnN0IHJlcyA9IHsgW0tFWV06IFwidThhXCIsIGQ6IGI2NGVuY29kZSh2YWx1ZSkgfTtcbiAgICAgIHBhcmVudFN0YWNrLnB1c2gocmVzKTtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgJiYgS0VZIGluIHZhbHVlKSB7XG4gICAgICByZXF1aXJlc0Rlc2VyaWFsaXplciA9IHRydWU7XG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgY29uc3QgdjogYW55ID0geyAuLi52YWx1ZSB9O1xuICAgICAgY29uc3QgayA9IHZbS0VZXTtcbiAgICAgIGRlbGV0ZSB2W0tFWV07XG4gICAgICBjb25zdCByZXMgPSB7IFtLRVldOiBcImxcIiwgaywgdiB9O1xuICAgICAgcGFyZW50U3RhY2sucHVzaChyZXMpO1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyZW50U3RhY2sucHVzaCh2YWx1ZSk7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2VyaWFsaXplZCA9IEpTT04uc3RyaW5naWZ5KHRvU2VyaWFsaXplLCByZXBsYWNlcik7XG4gIHJldHVybiB7IHNlcmlhbGl6ZWQsIHJlcXVpcmVzRGVzZXJpYWxpemVyLCBoYXNTaWduYWxzIH07XG59XG5cbi8vIGRlbm8tZm10LWlnbm9yZVxuY29uc3QgYmFzZTY0YWJjID0gW1xuICBcIkFcIiwgXCJCXCIsIFwiQ1wiLCBcIkRcIiwgXCJFXCIsIFwiRlwiLCBcIkdcIiwgXCJIXCIsIFwiSVwiLCBcIkpcIiwgXCJLXCIsIFwiTFwiLCBcIk1cIiwgXCJOXCIsIFwiT1wiLFxuICBcIlBcIiwgXCJRXCIsIFwiUlwiLCBcIlNcIiwgXCJUXCIsIFwiVVwiLCBcIlZcIiwgXCJXXCIsIFwiWFwiLCBcIllcIiwgXCJaXCIsIFwiYVwiLCBcImJcIiwgXCJjXCIsIFwiZFwiLFxuICBcImVcIiwgXCJmXCIsIFwiZ1wiLCBcImhcIiwgXCJpXCIsIFwialwiLCBcImtcIiwgXCJsXCIsIFwibVwiLCBcIm5cIiwgXCJvXCIsIFwicFwiLCBcInFcIiwgXCJyXCIsIFwic1wiLFxuICBcInRcIiwgXCJ1XCIsIFwidlwiLCBcIndcIiwgXCJ4XCIsIFwieVwiLCBcInpcIiwgXCIwXCIsIFwiMVwiLCBcIjJcIiwgXCIzXCIsIFwiNFwiLCBcIjVcIiwgXCI2XCIsIFwiN1wiLFxuICBcIjhcIiwgXCI5XCIsIFwiK1wiLCBcIi9cIixcbl07XG5cbi8qKlxuICogQ1JFRElUOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9lbmVwb21ueWFzY2hpaC83MmM0MjNmNzI3ZDM5NWVlYWEwOTY5NzA1ODIzODcyN1xuICogRW5jb2RlcyBhIGdpdmVuIFVpbnQ4QXJyYXksIEFycmF5QnVmZmVyIG9yIHN0cmluZyBpbnRvIFJGQzQ2NDggYmFzZTY0IHJlcHJlc2VudGF0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiNjRlbmNvZGUoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IHN0cmluZyB7XG4gIGNvbnN0IHVpbnQ4ID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgbGV0IHJlc3VsdCA9IFwiXCIsXG4gICAgaTtcbiAgY29uc3QgbCA9IHVpbnQ4Lmxlbmd0aDtcbiAgZm9yIChpID0gMjsgaSA8IGw7IGkgKz0gMykge1xuICAgIHJlc3VsdCArPSBiYXNlNjRhYmNbdWludDhbaSAtIDJdID4+IDJdO1xuICAgIHJlc3VsdCArPSBiYXNlNjRhYmNbKCh1aW50OFtpIC0gMl0gJiAweDAzKSA8PCA0KSB8ICh1aW50OFtpIC0gMV0gPj4gNCldO1xuICAgIHJlc3VsdCArPSBiYXNlNjRhYmNbKCh1aW50OFtpIC0gMV0gJiAweDBmKSA8PCAyKSB8ICh1aW50OFtpXSA+PiA2KV07XG4gICAgcmVzdWx0ICs9IGJhc2U2NGFiY1t1aW50OFtpXSAmIDB4M2ZdO1xuICB9XG4gIGlmIChpID09PSBsICsgMSkge1xuICAgIC8vIDEgb2N0ZXQgeWV0IHRvIHdyaXRlXG4gICAgcmVzdWx0ICs9IGJhc2U2NGFiY1t1aW50OFtpIC0gMl0gPj4gMl07XG4gICAgcmVzdWx0ICs9IGJhc2U2NGFiY1sodWludDhbaSAtIDJdICYgMHgwMykgPDwgNF07XG4gICAgcmVzdWx0ICs9IFwiPT1cIjtcbiAgfVxuICBpZiAoaSA9PT0gbCkge1xuICAgIC8vIDIgb2N0ZXRzIHlldCB0byB3cml0ZVxuICAgIHJlc3VsdCArPSBiYXNlNjRhYmNbdWludDhbaSAtIDJdID4+IDJdO1xuICAgIHJlc3VsdCArPSBiYXNlNjRhYmNbKCh1aW50OFtpIC0gMl0gJiAweDAzKSA8PCA0KSB8ICh1aW50OFtpIC0gMV0gPj4gNCldO1xuICAgIHJlc3VsdCArPSBiYXNlNjRhYmNbKHVpbnQ4W2kgLSAxXSAmIDB4MGYpIDw8IDJdO1xuICAgIHJlc3VsdCArPSBcIj1cIjtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxu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
// denoCacheMetadata=7808170845240093145,11352048215991331726