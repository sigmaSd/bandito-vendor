// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * {@linkcode parse} function for parsing
 * {@link https://code.visualstudio.com/docs/languages/json#_json-with-comments | JSONC}
 * (JSON with Comments) strings.
 *
 * This module is browser compatible.
 *
 * @module
 */ import { assert } from "jsr:/@std/assert@^0.213.1/assert";
/**
 * Converts a JSON with Comments (JSONC) string into an object.
 * If a syntax error is found, throw a {@linkcode SyntaxError}.
 *
 * @example
 * ```ts
 * import { parse } from "@std/jsonc";
 *
 * console.log(parse('{"foo": "bar", } // comment')); // { foo: "bar" }
 * console.log(parse('{"foo": "bar", } /* comment *\/')); // { foo: "bar" }
 * console.log(parse('{"foo": "bar" } // comment', {
 *   allowTrailingComma: false,
 * })); // { foo: "bar" }
 * ```
 *
 * @param text A valid JSONC string.
 */ export function parse(text, { allowTrailingComma = true } = {}) {
  if (new.target) {
    throw new TypeError("parse is not a constructor");
  }
  return new JSONCParser(text, {
    allowTrailingComma
  }).parse();
}
const originalJSONParse = globalThis.JSON.parse;
// First tokenize and then parse the token.
class JSONCParser {
  #whitespace = new Set(" \t\r\n");
  #numberEndToken = new Set([
    ..."[]{}:,/",
    ...this.#whitespace
  ]);
  #text;
  #length;
  #tokenized;
  #options;
  constructor(text, options){
    this.#text = `${text}`;
    this.#length = this.#text.length;
    this.#tokenized = this.#tokenize();
    this.#options = options;
  }
  parse() {
    const token = this.#getNext();
    const res = this.#parseJsonValue(token);
    // make sure all characters have been read
    const { done, value } = this.#tokenized.next();
    if (!done) {
      throw new SyntaxError(buildErrorMessage(value));
    }
    return res;
  }
  /** Read the next token. If the token is read to the end, it throws a SyntaxError. */ #getNext() {
    const { done, value } = this.#tokenized.next();
    if (done) {
      throw new SyntaxError("Unexpected end of JSONC input");
    }
    return value;
  }
  /** Split the JSONC string into token units. Whitespace and comments are skipped. */ *#tokenize() {
    for(let i = 0; i < this.#length; i++){
      // skip whitespace
      if (this.#whitespace.has(this.#text[i])) {
        continue;
      }
      // skip multi line comment (`/*...*/`)
      if (this.#text[i] === "/" && this.#text[i + 1] === "*") {
        i += 2;
        let hasEndOfComment = false;
        for(; i < this.#length; i++){
          if (this.#text[i] === "*" && this.#text[i + 1] === "/") {
            hasEndOfComment = true;
            break;
          }
        }
        if (!hasEndOfComment) {
          throw new SyntaxError("Unexpected end of JSONC input");
        }
        i++;
        continue;
      }
      // skip single line comment (`//...`)
      if (this.#text[i] === "/" && this.#text[i + 1] === "/") {
        i += 2;
        for(; i < this.#length; i++){
          if (this.#text[i] === "\n" || this.#text[i] === "\r") {
            break;
          }
        }
        continue;
      }
      switch(this.#text[i]){
        case "{":
          yield {
            type: "BeginObject",
            position: i
          };
          break;
        case "}":
          yield {
            type: "EndObject",
            position: i
          };
          break;
        case "[":
          yield {
            type: "BeginArray",
            position: i
          };
          break;
        case "]":
          yield {
            type: "EndArray",
            position: i
          };
          break;
        case ":":
          yield {
            type: "NameSeparator",
            position: i
          };
          break;
        case ",":
          yield {
            type: "ValueSeparator",
            position: i
          };
          break;
        case '"':
          {
            const startIndex = i;
            // Need to handle consecutive backslashes correctly
            // '"\\""' => '"'
            // '"\\\\"' => '\\'
            // '"\\\\\\""' => '\\"'
            // '"\\\\\\\\"' => '\\\\'
            let shouldEscapeNext = false;
            i++;
            for(; i < this.#length; i++){
              if (this.#text[i] === '"' && !shouldEscapeNext) {
                break;
              }
              shouldEscapeNext = this.#text[i] === "\\" && !shouldEscapeNext;
            }
            yield {
              type: "String",
              sourceText: this.#text.substring(startIndex, i + 1),
              position: startIndex
            };
            break;
          }
        default:
          {
            const startIndex = i;
            for(; i < this.#length; i++){
              if (this.#numberEndToken.has(this.#text[i])) {
                break;
              }
            }
            i--;
            yield {
              type: "NullOrTrueOrFalseOrNumber",
              sourceText: this.#text.substring(startIndex, i + 1),
              position: startIndex
            };
          }
      }
    }
  }
  #parseJsonValue(value) {
    switch(value.type){
      case "BeginObject":
        return this.#parseObject();
      case "BeginArray":
        return this.#parseArray();
      case "NullOrTrueOrFalseOrNumber":
        return this.#parseNullOrTrueOrFalseOrNumber(value);
      case "String":
        return this.#parseString(value);
      default:
        throw new SyntaxError(buildErrorMessage(value));
    }
  }
  #parseObject() {
    const target = {};
    //   ┌─token1
    // { }
    //      ┌─────────────token1
    //      │   ┌─────────token2
    //      │   │   ┌─────token3
    //      │   │   │   ┌─token4
    //  { "key" : value }
    //      ┌───────────────token1
    //      │   ┌───────────token2
    //      │   │   ┌───────token3
    //      │   │   │   ┌───token4
    //      │   │   │   │ ┌─token1
    //  { "key" : value , }
    //      ┌─────────────────────────────token1
    //      │   ┌─────────────────────────token2
    //      │   │   ┌─────────────────────token3
    //      │   │   │   ┌─────────────────token4
    //      │   │   │   │   ┌─────────────token1
    //      │   │   │   │   │   ┌─────────token2
    //      │   │   │   │   │   │   ┌─────token3
    //      │   │   │   │   │   │   │   ┌─token4
    //  { "key" : value , "key" : value }
    for(let isFirst = true;; isFirst = false){
      const token1 = this.#getNext();
      if ((isFirst || this.#options.allowTrailingComma) && token1.type === "EndObject") {
        return target;
      }
      if (token1.type !== "String") {
        throw new SyntaxError(buildErrorMessage(token1));
      }
      const key = this.#parseString(token1);
      const token2 = this.#getNext();
      if (token2.type !== "NameSeparator") {
        throw new SyntaxError(buildErrorMessage(token2));
      }
      const token3 = this.#getNext();
      Object.defineProperty(target, key, {
        value: this.#parseJsonValue(token3),
        writable: true,
        enumerable: true,
        configurable: true
      });
      const token4 = this.#getNext();
      if (token4.type === "EndObject") {
        return target;
      }
      if (token4.type !== "ValueSeparator") {
        throw new SyntaxError(buildErrorMessage(token4));
      }
    }
  }
  #parseArray() {
    const target = [];
    //   ┌─token1
    // [ ]
    //      ┌─────────────token1
    //      │   ┌─────────token2
    //  [ value ]
    //      ┌───────token1
    //      │   ┌───token2
    //      │   │ ┌─token1
    //  [ value , ]
    //      ┌─────────────token1
    //      │   ┌─────────token2
    //      │   │   ┌─────token1
    //      │   │   │   ┌─token2
    //  [ value , value ]
    for(let isFirst = true;; isFirst = false){
      const token1 = this.#getNext();
      if ((isFirst || this.#options.allowTrailingComma) && token1.type === "EndArray") {
        return target;
      }
      target.push(this.#parseJsonValue(token1));
      const token2 = this.#getNext();
      if (token2.type === "EndArray") {
        return target;
      }
      if (token2.type !== "ValueSeparator") {
        throw new SyntaxError(buildErrorMessage(token2));
      }
    }
  }
  #parseString(value) {
    let parsed;
    try {
      // Use JSON.parse to handle `\u0000` etc. correctly.
      parsed = originalJSONParse(value.sourceText);
    } catch  {
      throw new SyntaxError(buildErrorMessage(value));
    }
    assert(typeof parsed === "string");
    return parsed;
  }
  #parseNullOrTrueOrFalseOrNumber(value) {
    if (value.sourceText === "null") {
      return null;
    }
    if (value.sourceText === "true") {
      return true;
    }
    if (value.sourceText === "false") {
      return false;
    }
    let parsed;
    try {
      // Use JSON.parse to handle `+100`, `Infinity` etc. correctly.
      parsed = originalJSONParse(value.sourceText);
    } catch  {
      throw new SyntaxError(buildErrorMessage(value));
    }
    assert(typeof parsed === "number");
    return parsed;
  }
}
function buildErrorMessage({ type, sourceText, position }) {
  let token = "";
  switch(type){
    case "BeginObject":
      token = "{";
      break;
    case "EndObject":
      token = "}";
      break;
    case "BeginArray":
      token = "[";
      break;
    case "EndArray":
      token = "]";
      break;
    case "NameSeparator":
      token = ":";
      break;
    case "ValueSeparator":
      token = ",";
      break;
    case "NullOrTrueOrFalseOrNumber":
    case "String":
      // Truncate the string so that it is within 30 lengths.
      token = 30 < sourceText.length ? `${sourceText.slice(0, 30)}...` : sourceText;
      break;
    default:
      throw new Error("unreachable");
  }
  return `Unexpected token ${token} in JSONC at position ${position}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvanNvbmMvMC4yMTMuMS9wYXJzZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIHtAbGlua2NvZGUgcGFyc2V9IGZ1bmN0aW9uIGZvciBwYXJzaW5nXG4gKiB7QGxpbmsgaHR0cHM6Ly9jb2RlLnZpc3VhbHN0dWRpby5jb20vZG9jcy9sYW5ndWFnZXMvanNvbiNfanNvbi13aXRoLWNvbW1lbnRzIHwgSlNPTkN9XG4gKiAoSlNPTiB3aXRoIENvbW1lbnRzKSBzdHJpbmdzLlxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcImpzcjovQHN0ZC9hc3NlcnRAXjAuMjEzLjEvYXNzZXJ0XCI7XG5cbmltcG9ydCB0eXBlIHsgSnNvblZhbHVlIH0gZnJvbSBcImpzcjovQHN0ZC9qc29uQF4wLjIxMy4xL2NvbW1vblwiO1xuZXhwb3J0IHR5cGUgeyBKc29uVmFsdWUgfSBmcm9tIFwianNyOi9Ac3RkL2pzb25AXjAuMjEzLjEvY29tbW9uXCI7XG5cbi8qKiBPcHRpb25zIGZvciB7QGxpbmtjb2RlIHBhcnNlfS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VPcHRpb25zIHtcbiAgLyoqIEFsbG93IHRyYWlsaW5nIGNvbW1hcyBhdCB0aGUgZW5kIG9mIGFycmF5cyBhbmQgb2JqZWN0cy5cbiAgICpcbiAgICogQGRlZmF1bHQge3RydWV9XG4gICAqL1xuICBhbGxvd1RyYWlsaW5nQ29tbWE/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgSlNPTiB3aXRoIENvbW1lbnRzIChKU09OQykgc3RyaW5nIGludG8gYW4gb2JqZWN0LlxuICogSWYgYSBzeW50YXggZXJyb3IgaXMgZm91bmQsIHRocm93IGEge0BsaW5rY29kZSBTeW50YXhFcnJvcn0uXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZSB9IGZyb20gXCJAc3RkL2pzb25jXCI7XG4gKlxuICogY29uc29sZS5sb2cocGFyc2UoJ3tcImZvb1wiOiBcImJhclwiLCB9IC8vIGNvbW1lbnQnKSk7IC8vIHsgZm9vOiBcImJhclwiIH1cbiAqIGNvbnNvbGUubG9nKHBhcnNlKCd7XCJmb29cIjogXCJiYXJcIiwgfSAvKiBjb21tZW50ICpcXC8nKSk7IC8vIHsgZm9vOiBcImJhclwiIH1cbiAqIGNvbnNvbGUubG9nKHBhcnNlKCd7XCJmb29cIjogXCJiYXJcIiB9IC8vIGNvbW1lbnQnLCB7XG4gKiAgIGFsbG93VHJhaWxpbmdDb21tYTogZmFsc2UsXG4gKiB9KSk7IC8vIHsgZm9vOiBcImJhclwiIH1cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB0ZXh0IEEgdmFsaWQgSlNPTkMgc3RyaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UoXG4gIHRleHQ6IHN0cmluZyxcbiAgeyBhbGxvd1RyYWlsaW5nQ29tbWEgPSB0cnVlIH06IFBhcnNlT3B0aW9ucyA9IHt9LFxuKTogSnNvblZhbHVlIHtcbiAgaWYgKG5ldy50YXJnZXQpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwicGFyc2UgaXMgbm90IGEgY29uc3RydWN0b3JcIik7XG4gIH1cbiAgcmV0dXJuIG5ldyBKU09OQ1BhcnNlcih0ZXh0LCB7IGFsbG93VHJhaWxpbmdDb21tYSB9KS5wYXJzZSgpO1xufVxuXG50eXBlIFRva2VuVHlwZSA9XG4gIHwgXCJCZWdpbk9iamVjdFwiXG4gIHwgXCJFbmRPYmplY3RcIlxuICB8IFwiQmVnaW5BcnJheVwiXG4gIHwgXCJFbmRBcnJheVwiXG4gIHwgXCJOYW1lU2VwYXJhdG9yXCJcbiAgfCBcIlZhbHVlU2VwYXJhdG9yXCJcbiAgfCBcIk51bGxPclRydWVPckZhbHNlT3JOdW1iZXJcIlxuICB8IFwiU3RyaW5nXCI7XG5cbnR5cGUgVG9rZW4gPSB7XG4gIHR5cGU6IEV4Y2x1ZGU8XG4gICAgVG9rZW5UeXBlLFxuICAgIFwiU3RyaW5nXCIgfCBcIk51bGxPclRydWVPckZhbHNlT3JOdW1iZXJcIlxuICA+O1xuICBzb3VyY2VUZXh0PzogdW5kZWZpbmVkO1xuICBwb3NpdGlvbjogbnVtYmVyO1xufSB8IHtcbiAgdHlwZTogXCJTdHJpbmdcIjtcbiAgc291cmNlVGV4dDogc3RyaW5nO1xuICBwb3NpdGlvbjogbnVtYmVyO1xufSB8IHtcbiAgdHlwZTogXCJOdWxsT3JUcnVlT3JGYWxzZU9yTnVtYmVyXCI7XG4gIHNvdXJjZVRleHQ6IHN0cmluZztcbiAgcG9zaXRpb246IG51bWJlcjtcbn07XG5cbmNvbnN0IG9yaWdpbmFsSlNPTlBhcnNlID0gZ2xvYmFsVGhpcy5KU09OLnBhcnNlO1xuXG4vLyBGaXJzdCB0b2tlbml6ZSBhbmQgdGhlbiBwYXJzZSB0aGUgdG9rZW4uXG5jbGFzcyBKU09OQ1BhcnNlciB7XG4gIHJlYWRvbmx5ICN3aGl0ZXNwYWNlID0gbmV3IFNldChcIiBcXHRcXHJcXG5cIik7XG4gIHJlYWRvbmx5ICNudW1iZXJFbmRUb2tlbiA9IG5ldyBTZXQoWy4uLlwiW117fTosL1wiLCAuLi50aGlzLiN3aGl0ZXNwYWNlXSk7XG4gICN0ZXh0OiBzdHJpbmc7XG4gICNsZW5ndGg6IG51bWJlcjtcbiAgI3Rva2VuaXplZDogR2VuZXJhdG9yPFRva2VuLCB2b2lkPjtcbiAgI29wdGlvbnM6IFBhcnNlT3B0aW9ucztcbiAgY29uc3RydWN0b3IodGV4dDogc3RyaW5nLCBvcHRpb25zOiBQYXJzZU9wdGlvbnMpIHtcbiAgICB0aGlzLiN0ZXh0ID0gYCR7dGV4dH1gO1xuICAgIHRoaXMuI2xlbmd0aCA9IHRoaXMuI3RleHQubGVuZ3RoO1xuICAgIHRoaXMuI3Rva2VuaXplZCA9IHRoaXMuI3Rva2VuaXplKCk7XG4gICAgdGhpcy4jb3B0aW9ucyA9IG9wdGlvbnM7XG4gIH1cbiAgcGFyc2UoKTogSnNvblZhbHVlIHtcbiAgICBjb25zdCB0b2tlbiA9IHRoaXMuI2dldE5leHQoKTtcbiAgICBjb25zdCByZXMgPSB0aGlzLiNwYXJzZUpzb25WYWx1ZSh0b2tlbik7XG5cbiAgICAvLyBtYWtlIHN1cmUgYWxsIGNoYXJhY3RlcnMgaGF2ZSBiZWVuIHJlYWRcbiAgICBjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSB0aGlzLiN0b2tlbml6ZWQubmV4dCgpO1xuICAgIGlmICghZG9uZSkge1xuICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKGJ1aWxkRXJyb3JNZXNzYWdlKHZhbHVlKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICAvKiogUmVhZCB0aGUgbmV4dCB0b2tlbi4gSWYgdGhlIHRva2VuIGlzIHJlYWQgdG8gdGhlIGVuZCwgaXQgdGhyb3dzIGEgU3ludGF4RXJyb3IuICovXG4gICNnZXROZXh0KCk6IFRva2VuIHtcbiAgICBjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSB0aGlzLiN0b2tlbml6ZWQubmV4dCgpO1xuICAgIGlmIChkb25lKSB7XG4gICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJVbmV4cGVjdGVkIGVuZCBvZiBKU09OQyBpbnB1dFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIC8qKiBTcGxpdCB0aGUgSlNPTkMgc3RyaW5nIGludG8gdG9rZW4gdW5pdHMuIFdoaXRlc3BhY2UgYW5kIGNvbW1lbnRzIGFyZSBza2lwcGVkLiAqL1xuICAqI3Rva2VuaXplKCk6IEdlbmVyYXRvcjxUb2tlbiwgdm9pZD4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy4jbGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIHNraXAgd2hpdGVzcGFjZVxuICAgICAgaWYgKHRoaXMuI3doaXRlc3BhY2UuaGFzKHRoaXMuI3RleHRbaV0hKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gc2tpcCBtdWx0aSBsaW5lIGNvbW1lbnQgKGAvKi4uLiovYClcbiAgICAgIGlmICh0aGlzLiN0ZXh0W2ldID09PSBcIi9cIiAmJiB0aGlzLiN0ZXh0W2kgKyAxXSA9PT0gXCIqXCIpIHtcbiAgICAgICAgaSArPSAyO1xuICAgICAgICBsZXQgaGFzRW5kT2ZDb21tZW50ID0gZmFsc2U7XG4gICAgICAgIGZvciAoOyBpIDwgdGhpcy4jbGVuZ3RoOyBpKyspIHsgLy8gcmVhZCB1bnRpbCBmaW5kIGAqL2BcbiAgICAgICAgICBpZiAodGhpcy4jdGV4dFtpXSA9PT0gXCIqXCIgJiYgdGhpcy4jdGV4dFtpICsgMV0gPT09IFwiL1wiKSB7XG4gICAgICAgICAgICBoYXNFbmRPZkNvbW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaGFzRW5kT2ZDb21tZW50KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiVW5leHBlY3RlZCBlbmQgb2YgSlNPTkMgaW5wdXRcIik7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gc2tpcCBzaW5nbGUgbGluZSBjb21tZW50IChgLy8uLi5gKVxuICAgICAgaWYgKHRoaXMuI3RleHRbaV0gPT09IFwiL1wiICYmIHRoaXMuI3RleHRbaSArIDFdID09PSBcIi9cIikge1xuICAgICAgICBpICs9IDI7XG4gICAgICAgIGZvciAoOyBpIDwgdGhpcy4jbGVuZ3RoOyBpKyspIHsgLy8gcmVhZCB1bnRpbCBmaW5kIGBcXG5gIG9yIGBcXHJgXG4gICAgICAgICAgaWYgKHRoaXMuI3RleHRbaV0gPT09IFwiXFxuXCIgfHwgdGhpcy4jdGV4dFtpXSA9PT0gXCJcXHJcIikge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKHRoaXMuI3RleHRbaV0pIHtcbiAgICAgICAgY2FzZSBcIntcIjpcbiAgICAgICAgICB5aWVsZCB7IHR5cGU6IFwiQmVnaW5PYmplY3RcIiwgcG9zaXRpb246IGkgfTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIn1cIjpcbiAgICAgICAgICB5aWVsZCB7IHR5cGU6IFwiRW5kT2JqZWN0XCIsIHBvc2l0aW9uOiBpIH07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJbXCI6XG4gICAgICAgICAgeWllbGQgeyB0eXBlOiBcIkJlZ2luQXJyYXlcIiwgcG9zaXRpb246IGkgfTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIl1cIjpcbiAgICAgICAgICB5aWVsZCB7IHR5cGU6IFwiRW5kQXJyYXlcIiwgcG9zaXRpb246IGkgfTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIjpcIjpcbiAgICAgICAgICB5aWVsZCB7IHR5cGU6IFwiTmFtZVNlcGFyYXRvclwiLCBwb3NpdGlvbjogaSB9O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiLFwiOlxuICAgICAgICAgIHlpZWxkIHsgdHlwZTogXCJWYWx1ZVNlcGFyYXRvclwiLCBwb3NpdGlvbjogaSB9O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdcIic6IHsgLy8gcGFyc2Ugc3RyaW5nIHRva2VuXG4gICAgICAgICAgY29uc3Qgc3RhcnRJbmRleCA9IGk7XG4gICAgICAgICAgLy8gTmVlZCB0byBoYW5kbGUgY29uc2VjdXRpdmUgYmFja3NsYXNoZXMgY29ycmVjdGx5XG4gICAgICAgICAgLy8gJ1wiXFxcXFwiXCInID0+ICdcIidcbiAgICAgICAgICAvLyAnXCJcXFxcXFxcXFwiJyA9PiAnXFxcXCdcbiAgICAgICAgICAvLyAnXCJcXFxcXFxcXFxcXFxcIlwiJyA9PiAnXFxcXFwiJ1xuICAgICAgICAgIC8vICdcIlxcXFxcXFxcXFxcXFxcXFxcIicgPT4gJ1xcXFxcXFxcJ1xuICAgICAgICAgIGxldCBzaG91bGRFc2NhcGVOZXh0ID0gZmFsc2U7XG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGZvciAoOyBpIDwgdGhpcy4jbGVuZ3RoOyBpKyspIHsgLy8gcmVhZCB1bnRpbCBmaW5kIGBcImBcbiAgICAgICAgICAgIGlmICh0aGlzLiN0ZXh0W2ldID09PSAnXCInICYmICFzaG91bGRFc2NhcGVOZXh0KSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2hvdWxkRXNjYXBlTmV4dCA9IHRoaXMuI3RleHRbaV0gPT09IFwiXFxcXFwiICYmICFzaG91bGRFc2NhcGVOZXh0O1xuICAgICAgICAgIH1cbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICB0eXBlOiBcIlN0cmluZ1wiLFxuICAgICAgICAgICAgc291cmNlVGV4dDogdGhpcy4jdGV4dC5zdWJzdHJpbmcoc3RhcnRJbmRleCwgaSArIDEpLFxuICAgICAgICAgICAgcG9zaXRpb246IHN0YXJ0SW5kZXgsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OiB7IC8vIHBhcnNlIG51bGwsIHRydWUsIGZhbHNlIG9yIG51bWJlciB0b2tlblxuICAgICAgICAgIGNvbnN0IHN0YXJ0SW5kZXggPSBpO1xuICAgICAgICAgIGZvciAoOyBpIDwgdGhpcy4jbGVuZ3RoOyBpKyspIHsgLy8gcmVhZCB1bnRpbCBmaW5kIG51bWJlckVuZFRva2VuXG4gICAgICAgICAgICBpZiAodGhpcy4jbnVtYmVyRW5kVG9rZW4uaGFzKHRoaXMuI3RleHRbaV0hKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaS0tO1xuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIHR5cGU6IFwiTnVsbE9yVHJ1ZU9yRmFsc2VPck51bWJlclwiLFxuICAgICAgICAgICAgc291cmNlVGV4dDogdGhpcy4jdGV4dC5zdWJzdHJpbmcoc3RhcnRJbmRleCwgaSArIDEpLFxuICAgICAgICAgICAgcG9zaXRpb246IHN0YXJ0SW5kZXgsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICAjcGFyc2VKc29uVmFsdWUodmFsdWU6IFRva2VuKTogSnNvblZhbHVlIHtcbiAgICBzd2l0Y2ggKHZhbHVlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJCZWdpbk9iamVjdFwiOlxuICAgICAgICByZXR1cm4gdGhpcy4jcGFyc2VPYmplY3QoKTtcbiAgICAgIGNhc2UgXCJCZWdpbkFycmF5XCI6XG4gICAgICAgIHJldHVybiB0aGlzLiNwYXJzZUFycmF5KCk7XG4gICAgICBjYXNlIFwiTnVsbE9yVHJ1ZU9yRmFsc2VPck51bWJlclwiOlxuICAgICAgICByZXR1cm4gdGhpcy4jcGFyc2VOdWxsT3JUcnVlT3JGYWxzZU9yTnVtYmVyKHZhbHVlKTtcbiAgICAgIGNhc2UgXCJTdHJpbmdcIjpcbiAgICAgICAgcmV0dXJuIHRoaXMuI3BhcnNlU3RyaW5nKHZhbHVlKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihidWlsZEVycm9yTWVzc2FnZSh2YWx1ZSkpO1xuICAgIH1cbiAgfVxuICAjcGFyc2VPYmplY3QoKTogeyBba2V5OiBzdHJpbmddOiBKc29uVmFsdWUgfCB1bmRlZmluZWQgfSB7XG4gICAgY29uc3QgdGFyZ2V0OiB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB8IHVuZGVmaW5lZCB9ID0ge307XG4gICAgLy8gICDilIzilIB0b2tlbjFcbiAgICAvLyB7IH1cbiAgICAvLyAgICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgHRva2VuMVxuICAgIC8vICAgICAg4pSCICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAdG9rZW4yXG4gICAgLy8gICAgICDilIIgICDilIIgICDilIzilIDilIDilIDilIDilIB0b2tlbjNcbiAgICAvLyAgICAgIOKUgiAgIOKUgiAgIOKUgiAgIOKUjOKUgHRva2VuNFxuICAgIC8vICB7IFwia2V5XCIgOiB2YWx1ZSB9XG4gICAgLy8gICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIB0b2tlbjFcbiAgICAvLyAgICAgIOKUgiAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgHRva2VuMlxuICAgIC8vICAgICAg4pSCICAg4pSCICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSAdG9rZW4zXG4gICAgLy8gICAgICDilIIgICDilIIgICDilIIgICDilIzilIDilIDilIB0b2tlbjRcbiAgICAvLyAgICAgIOKUgiAgIOKUgiAgIOKUgiAgIOKUgiDilIzilIB0b2tlbjFcbiAgICAvLyAgeyBcImtleVwiIDogdmFsdWUgLCB9XG4gICAgLy8gICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIB0b2tlbjFcbiAgICAvLyAgICAgIOKUgiAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgHRva2VuMlxuICAgIC8vICAgICAg4pSCICAg4pSCICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAdG9rZW4zXG4gICAgLy8gICAgICDilIIgICDilIIgICDilIIgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIB0b2tlbjRcbiAgICAvLyAgICAgIOKUgiAgIOKUgiAgIOKUgiAgIOKUgiAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgHRva2VuMVxuICAgIC8vICAgICAg4pSCICAg4pSCICAg4pSCICAg4pSCICAg4pSCICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAdG9rZW4yXG4gICAgLy8gICAgICDilIIgICDilIIgICDilIIgICDilIIgICDilIIgICDilIIgICDilIzilIDilIDilIDilIDilIB0b2tlbjNcbiAgICAvLyAgICAgIOKUgiAgIOKUgiAgIOKUgiAgIOKUgiAgIOKUgiAgIOKUgiAgIOKUgiAgIOKUjOKUgHRva2VuNFxuICAgIC8vICB7IFwia2V5XCIgOiB2YWx1ZSAsIFwia2V5XCIgOiB2YWx1ZSB9XG4gICAgZm9yIChsZXQgaXNGaXJzdCA9IHRydWU7OyBpc0ZpcnN0ID0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IHRva2VuMSA9IHRoaXMuI2dldE5leHQoKTtcbiAgICAgIGlmIChcbiAgICAgICAgKGlzRmlyc3QgfHwgdGhpcy4jb3B0aW9ucy5hbGxvd1RyYWlsaW5nQ29tbWEpICYmXG4gICAgICAgIHRva2VuMS50eXBlID09PSBcIkVuZE9iamVjdFwiXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICAgIH1cbiAgICAgIGlmICh0b2tlbjEudHlwZSAhPT0gXCJTdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoYnVpbGRFcnJvck1lc3NhZ2UodG9rZW4xKSk7XG4gICAgICB9XG4gICAgICBjb25zdCBrZXkgPSB0aGlzLiNwYXJzZVN0cmluZyh0b2tlbjEpO1xuXG4gICAgICBjb25zdCB0b2tlbjIgPSB0aGlzLiNnZXROZXh0KCk7XG4gICAgICBpZiAodG9rZW4yLnR5cGUgIT09IFwiTmFtZVNlcGFyYXRvclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihidWlsZEVycm9yTWVzc2FnZSh0b2tlbjIpKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdG9rZW4zID0gdGhpcy4jZ2V0TmV4dCgpO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCB7XG4gICAgICAgIHZhbHVlOiB0aGlzLiNwYXJzZUpzb25WYWx1ZSh0b2tlbjMpLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHRva2VuNCA9IHRoaXMuI2dldE5leHQoKTtcbiAgICAgIGlmICh0b2tlbjQudHlwZSA9PT0gXCJFbmRPYmplY3RcIikge1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgfVxuICAgICAgaWYgKHRva2VuNC50eXBlICE9PSBcIlZhbHVlU2VwYXJhdG9yXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKGJ1aWxkRXJyb3JNZXNzYWdlKHRva2VuNCkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAjcGFyc2VBcnJheSgpOiBKc29uVmFsdWVbXSB7XG4gICAgY29uc3QgdGFyZ2V0OiBKc29uVmFsdWVbXSA9IFtdO1xuICAgIC8vICAg4pSM4pSAdG9rZW4xXG4gICAgLy8gWyBdXG4gICAgLy8gICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIB0b2tlbjFcbiAgICAvLyAgICAgIOKUgiAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgHRva2VuMlxuICAgIC8vICBbIHZhbHVlIF1cbiAgICAvLyAgICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgHRva2VuMVxuICAgIC8vICAgICAg4pSCICAg4pSM4pSA4pSA4pSAdG9rZW4yXG4gICAgLy8gICAgICDilIIgICDilIIg4pSM4pSAdG9rZW4xXG4gICAgLy8gIFsgdmFsdWUgLCBdXG4gICAgLy8gICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIB0b2tlbjFcbiAgICAvLyAgICAgIOKUgiAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgHRva2VuMlxuICAgIC8vICAgICAg4pSCICAg4pSCICAg4pSM4pSA4pSA4pSA4pSA4pSAdG9rZW4xXG4gICAgLy8gICAgICDilIIgICDilIIgICDilIIgICDilIzilIB0b2tlbjJcbiAgICAvLyAgWyB2YWx1ZSAsIHZhbHVlIF1cbiAgICBmb3IgKGxldCBpc0ZpcnN0ID0gdHJ1ZTs7IGlzRmlyc3QgPSBmYWxzZSkge1xuICAgICAgY29uc3QgdG9rZW4xID0gdGhpcy4jZ2V0TmV4dCgpO1xuICAgICAgaWYgKFxuICAgICAgICAoaXNGaXJzdCB8fCB0aGlzLiNvcHRpb25zLmFsbG93VHJhaWxpbmdDb21tYSkgJiZcbiAgICAgICAgdG9rZW4xLnR5cGUgPT09IFwiRW5kQXJyYXlcIlxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgICB9XG4gICAgICB0YXJnZXQucHVzaCh0aGlzLiNwYXJzZUpzb25WYWx1ZSh0b2tlbjEpKTtcblxuICAgICAgY29uc3QgdG9rZW4yID0gdGhpcy4jZ2V0TmV4dCgpO1xuICAgICAgaWYgKHRva2VuMi50eXBlID09PSBcIkVuZEFycmF5XCIpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICAgIH1cbiAgICAgIGlmICh0b2tlbjIudHlwZSAhPT0gXCJWYWx1ZVNlcGFyYXRvclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihidWlsZEVycm9yTWVzc2FnZSh0b2tlbjIpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgI3BhcnNlU3RyaW5nKHZhbHVlOiB7XG4gICAgdHlwZTogXCJTdHJpbmdcIjtcbiAgICBzb3VyY2VUZXh0OiBzdHJpbmc7XG4gICAgcG9zaXRpb246IG51bWJlcjtcbiAgfSk6IHN0cmluZyB7XG4gICAgbGV0IHBhcnNlZDtcbiAgICB0cnkge1xuICAgICAgLy8gVXNlIEpTT04ucGFyc2UgdG8gaGFuZGxlIGBcXHUwMDAwYCBldGMuIGNvcnJlY3RseS5cbiAgICAgIHBhcnNlZCA9IG9yaWdpbmFsSlNPTlBhcnNlKHZhbHVlLnNvdXJjZVRleHQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKGJ1aWxkRXJyb3JNZXNzYWdlKHZhbHVlKSk7XG4gICAgfVxuICAgIGFzc2VydCh0eXBlb2YgcGFyc2VkID09PSBcInN0cmluZ1wiKTtcbiAgICByZXR1cm4gcGFyc2VkO1xuICB9XG4gICNwYXJzZU51bGxPclRydWVPckZhbHNlT3JOdW1iZXIodmFsdWU6IHtcbiAgICB0eXBlOiBcIk51bGxPclRydWVPckZhbHNlT3JOdW1iZXJcIjtcbiAgICBzb3VyY2VUZXh0OiBzdHJpbmc7XG4gICAgcG9zaXRpb246IG51bWJlcjtcbiAgfSk6IG51bGwgfCBib29sZWFuIHwgbnVtYmVyIHtcbiAgICBpZiAodmFsdWUuc291cmNlVGV4dCA9PT0gXCJudWxsXCIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodmFsdWUuc291cmNlVGV4dCA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodmFsdWUuc291cmNlVGV4dCA9PT0gXCJmYWxzZVwiKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGxldCBwYXJzZWQ7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFVzZSBKU09OLnBhcnNlIHRvIGhhbmRsZSBgKzEwMGAsIGBJbmZpbml0eWAgZXRjLiBjb3JyZWN0bHkuXG4gICAgICBwYXJzZWQgPSBvcmlnaW5hbEpTT05QYXJzZSh2YWx1ZS5zb3VyY2VUZXh0KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihidWlsZEVycm9yTWVzc2FnZSh2YWx1ZSkpO1xuICAgIH1cbiAgICBhc3NlcnQodHlwZW9mIHBhcnNlZCA9PT0gXCJudW1iZXJcIik7XG4gICAgcmV0dXJuIHBhcnNlZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBidWlsZEVycm9yTWVzc2FnZSh7IHR5cGUsIHNvdXJjZVRleHQsIHBvc2l0aW9uIH06IFRva2VuKTogc3RyaW5nIHtcbiAgbGV0IHRva2VuID0gXCJcIjtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBcIkJlZ2luT2JqZWN0XCI6XG4gICAgICB0b2tlbiA9IFwie1wiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcIkVuZE9iamVjdFwiOlxuICAgICAgdG9rZW4gPSBcIn1cIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJCZWdpbkFycmF5XCI6XG4gICAgICB0b2tlbiA9IFwiW1wiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcIkVuZEFycmF5XCI6XG4gICAgICB0b2tlbiA9IFwiXVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcIk5hbWVTZXBhcmF0b3JcIjpcbiAgICAgIHRva2VuID0gXCI6XCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiVmFsdWVTZXBhcmF0b3JcIjpcbiAgICAgIHRva2VuID0gXCIsXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiTnVsbE9yVHJ1ZU9yRmFsc2VPck51bWJlclwiOlxuICAgIGNhc2UgXCJTdHJpbmdcIjpcbiAgICAgIC8vIFRydW5jYXRlIHRoZSBzdHJpbmcgc28gdGhhdCBpdCBpcyB3aXRoaW4gMzAgbGVuZ3Rocy5cbiAgICAgIHRva2VuID0gMzAgPCBzb3VyY2VUZXh0Lmxlbmd0aFxuICAgICAgICA/IGAke3NvdXJjZVRleHQuc2xpY2UoMCwgMzApfS4uLmBcbiAgICAgICAgOiBzb3VyY2VUZXh0O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInVucmVhY2hhYmxlXCIpO1xuICB9XG4gIHJldHVybiBgVW5leHBlY3RlZCB0b2tlbiAke3Rva2VufSBpbiBKU09OQyBhdCBwb3NpdGlvbiAke3Bvc2l0aW9ufWA7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Q0FRQyxHQUVELFNBQVMs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
// denoCacheMetadata=14284374211008230635,17742743415909820097