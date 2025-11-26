// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { BytesList } from "../bytes/bytes_list.ts";
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
/** @deprecated Use TextLineStream instead, as it can handle empty lines.
 *
 * Transform a stream into a stream where each chunk is divided by a newline,
 * be it `\n` or `\r\n`.
 *
 * ```ts
 * import { LineStream } from "./delimiter.ts";
 * const res = await fetch("https://example.com");
 * const lines = res.body!.pipeThrough(new LineStream());
 * ```
 */ export class LineStream extends TransformStream {
  #bufs = new BytesList();
  #prevHadCR = false;
  constructor(){
    super({
      transform: (chunk, controller)=>{
        this.#handle(chunk, controller);
      },
      flush: (controller)=>{
        controller.enqueue(this.#mergeBufs(false));
      }
    });
  }
  #handle(chunk, controller) {
    const lfIndex = chunk.indexOf(LF);
    if (this.#prevHadCR) {
      this.#prevHadCR = false;
      if (lfIndex === 0) {
        controller.enqueue(this.#mergeBufs(true));
        this.#handle(chunk.subarray(1), controller);
        return;
      }
    }
    if (lfIndex === -1) {
      if (chunk.at(-1) === CR) {
        this.#prevHadCR = true;
      }
      this.#bufs.add(chunk);
    } else {
      let crOrLfIndex = lfIndex;
      if (chunk[lfIndex - 1] === CR) {
        crOrLfIndex--;
      }
      this.#bufs.add(chunk.subarray(0, crOrLfIndex));
      controller.enqueue(this.#mergeBufs(false));
      this.#handle(chunk.subarray(lfIndex + 1), controller);
    }
  }
  #mergeBufs(prevHadCR) {
    const mergeBuf = this.#bufs.concat();
    this.#bufs = new BytesList();
    if (prevHadCR) {
      return mergeBuf.subarray(0, -1);
    } else {
      return mergeBuf;
    }
  }
}
/** Transform a stream into a stream where each chunk is divided by a newline,
 * be it `\n`, `\r`, or `\r\n`.
 *
 * ```ts
 * import { TextLineStream } from "./delimiter.ts";
 * const res = await fetch("https://example.com");
 * const lines = res.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new TextLineStream());
 * ```
 */ export class TextLineStream extends TransformStream {
  #buf = "";
  #prevHadCR = false;
  constructor(){
    super({
      transform: (chunk, controller)=>{
        this.#handle(chunk, controller);
      },
      flush: (controller)=>{
        controller.enqueue(this.#getBuf(this.#prevHadCR));
        if (this.#prevHadCR) {
          controller.enqueue("");
        }
      }
    });
  }
  #handle(chunk, controller) {
    const lfIndex = chunk.indexOf("\n");
    const crIndex = chunk.indexOf("\r");
    if (this.#prevHadCR) {
      this.#prevHadCR = false;
      controller.enqueue(this.#getBuf(true));
      if (lfIndex === 0) {
        this.#handle(chunk.slice(1), controller);
        return;
      }
    }
    if (lfIndex === -1 && crIndex === -1) {
      this.#buf += chunk;
    } else if (lfIndex === -1 && crIndex !== -1) {
      if (crIndex === chunk.length - 1) {
        this.#buf += chunk;
        this.#prevHadCR = true;
      } else {
        this.#mergeHandle(chunk, crIndex, crIndex, controller);
      }
    } else if (lfIndex !== -1 && crIndex === -1) {
      this.#mergeHandle(chunk, lfIndex, lfIndex, controller);
    } else {
      if (lfIndex - 1 === crIndex) {
        this.#mergeHandle(chunk, crIndex, lfIndex, controller);
      } else if (crIndex < lfIndex) {
        this.#mergeHandle(chunk, crIndex, crIndex, controller);
      } else {
        this.#mergeHandle(chunk, lfIndex, lfIndex, controller);
      }
    }
  }
  #mergeHandle(chunk, prevChunkEndIndex, newChunkStartIndex, controller) {
    this.#buf += chunk.slice(0, prevChunkEndIndex);
    controller.enqueue(this.#getBuf(false));
    this.#handle(chunk.slice(newChunkStartIndex + 1), controller);
  }
  #getBuf(prevHadCR) {
    const buf = this.#buf;
    this.#buf = "";
    if (prevHadCR) {
      return buf.slice(0, -1);
    } else {
      return buf;
    }
  }
}
/** Transform a stream into a stream where each chunk is divided by a given delimiter.
 *
 * ```ts
 * import { DelimiterStream } from "./delimiter.ts";
 * const res = await fetch("https://example.com");
 * const parts = res.body!
 *   .pipeThrough(new DelimiterStream(new TextEncoder().encode("foo")))
 *   .pipeThrough(new TextDecoderStream());
 * ```
 */ export class DelimiterStream extends TransformStream {
  #bufs = new BytesList();
  #delimiter;
  #inspectIndex = 0;
  #matchIndex = 0;
  #delimLen;
  #delimLPS;
  constructor(delimiter){
    super({
      transform: (chunk, controller)=>{
        this.#handle(chunk, controller);
      },
      flush: (controller)=>{
        controller.enqueue(this.#bufs.concat());
      }
    });
    this.#delimiter = delimiter;
    this.#delimLen = delimiter.length;
    this.#delimLPS = createLPS(delimiter);
  }
  #handle(chunk, controller) {
    this.#bufs.add(chunk);
    let localIndex = 0;
    while(this.#inspectIndex < this.#bufs.size()){
      if (chunk[localIndex] === this.#delimiter[this.#matchIndex]) {
        this.#inspectIndex++;
        localIndex++;
        this.#matchIndex++;
        if (this.#matchIndex === this.#delimLen) {
          // Full match
          const matchEnd = this.#inspectIndex - this.#delimLen;
          const readyBytes = this.#bufs.slice(0, matchEnd);
          controller.enqueue(readyBytes);
          // Reset match, different from KMP.
          this.#bufs.shift(this.#inspectIndex);
          this.#inspectIndex = 0;
          this.#matchIndex = 0;
        }
      } else {
        if (this.#matchIndex === 0) {
          this.#inspectIndex++;
          localIndex++;
        } else {
          this.#matchIndex = this.#delimLPS[this.#matchIndex - 1];
        }
      }
    }
  }
}
/** Transform a stream into a stream where each chunk is divided by a given delimiter.
 *
 * ```ts
 * import { TextDelimiterStream } from "./delimiter.ts";
 * const res = await fetch("https://example.com");
 * const parts = res.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new TextDelimiterStream("foo"));
 * ```
 */ export class TextDelimiterStream extends TransformStream {
  #buf = "";
  #delimiter;
  #inspectIndex = 0;
  #matchIndex = 0;
  #delimLPS;
  constructor(delimiter){
    super({
      transform: (chunk, controller)=>{
        this.#handle(chunk, controller);
      },
      flush: (controller)=>{
        controller.enqueue(this.#buf);
      }
    });
    this.#delimiter = delimiter;
    this.#delimLPS = createLPS(new TextEncoder().encode(delimiter));
  }
  #handle(chunk, controller) {
    this.#buf += chunk;
    let localIndex = 0;
    while(this.#inspectIndex < this.#buf.length){
      if (chunk[localIndex] === this.#delimiter[this.#matchIndex]) {
        this.#inspectIndex++;
        localIndex++;
        this.#matchIndex++;
        if (this.#matchIndex === this.#delimiter.length) {
          // Full match
          const matchEnd = this.#inspectIndex - this.#delimiter.length;
          const readyString = this.#buf.slice(0, matchEnd);
          controller.enqueue(readyString);
          // Reset match, different from KMP.
          this.#buf = this.#buf.slice(this.#inspectIndex);
          this.#inspectIndex = 0;
          this.#matchIndex = 0;
        }
      } else {
        if (this.#matchIndex === 0) {
          this.#inspectIndex++;
          localIndex++;
        } else {
          this.#matchIndex = this.#delimLPS[this.#matchIndex - 1];
        }
      }
    }
  }
}
/** Generate longest proper prefix which is also suffix array. */ function createLPS(pat) {
  const lps = new Uint8Array(pat.length);
  lps[0] = 0;
  let prefixEnd = 0;
  let i = 1;
  while(i < lps.length){
    if (pat[i] == pat[prefixEnd]) {
      prefixEnd++;
      lps[i] = prefixEnd;
      i++;
    } else if (prefixEnd === 0) {
      lps[i] = 0;
      i++;
    } else {
      prefixEnd = lps[prefixEnd - 1];
    }
  }
  return lps;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE0MS4wL3N0cmVhbXMvZGVsaW1pdGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IEJ5dGVzTGlzdCB9IGZyb20gXCIuLi9ieXRlcy9ieXRlc19saXN0LnRzXCI7XG5cbmNvbnN0IENSID0gXCJcXHJcIi5jaGFyQ29kZUF0KDApO1xuY29uc3QgTEYgPSBcIlxcblwiLmNoYXJDb2RlQXQoMCk7XG5cbi8qKiBAZGVwcmVjYXRlZCBVc2UgVGV4dExpbmVTdHJlYW0gaW5zdGVhZCwgYXMgaXQgY2FuIGhhbmRsZSBlbXB0eSBsaW5lcy5cbiAqXG4gKiBUcmFuc2Zvcm0gYSBzdHJlYW0gaW50byBhIHN0cmVhbSB3aGVyZSBlYWNoIGNodW5rIGlzIGRpdmlkZWQgYnkgYSBuZXdsaW5lLFxuICogYmUgaXQgYFxcbmAgb3IgYFxcclxcbmAuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IExpbmVTdHJlYW0gfSBmcm9tIFwiLi9kZWxpbWl0ZXIudHNcIjtcbiAqIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9leGFtcGxlLmNvbVwiKTtcbiAqIGNvbnN0IGxpbmVzID0gcmVzLmJvZHkhLnBpcGVUaHJvdWdoKG5ldyBMaW5lU3RyZWFtKCkpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBMaW5lU3RyZWFtIGV4dGVuZHMgVHJhbnNmb3JtU3RyZWFtPFVpbnQ4QXJyYXksIFVpbnQ4QXJyYXk+IHtcbiAgI2J1ZnMgPSBuZXcgQnl0ZXNMaXN0KCk7XG4gICNwcmV2SGFkQ1IgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih7XG4gICAgICB0cmFuc2Zvcm06IChjaHVuaywgY29udHJvbGxlcikgPT4ge1xuICAgICAgICB0aGlzLiNoYW5kbGUoY2h1bmssIGNvbnRyb2xsZXIpO1xuICAgICAgfSxcbiAgICAgIGZsdXNoOiAoY29udHJvbGxlcikgPT4ge1xuICAgICAgICBjb250cm9sbGVyLmVucXVldWUodGhpcy4jbWVyZ2VCdWZzKGZhbHNlKSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgI2hhbmRsZShcbiAgICBjaHVuazogVWludDhBcnJheSxcbiAgICBjb250cm9sbGVyOiBUcmFuc2Zvcm1TdHJlYW1EZWZhdWx0Q29udHJvbGxlcjxVaW50OEFycmF5PixcbiAgKSB7XG4gICAgY29uc3QgbGZJbmRleCA9IGNodW5rLmluZGV4T2YoTEYpO1xuXG4gICAgaWYgKHRoaXMuI3ByZXZIYWRDUikge1xuICAgICAgdGhpcy4jcHJldkhhZENSID0gZmFsc2U7XG4gICAgICBpZiAobGZJbmRleCA9PT0gMCkge1xuICAgICAgICBjb250cm9sbGVyLmVucXVldWUodGhpcy4jbWVyZ2VCdWZzKHRydWUpKTtcbiAgICAgICAgdGhpcy4jaGFuZGxlKGNodW5rLnN1YmFycmF5KDEpLCBjb250cm9sbGVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsZkluZGV4ID09PSAtMSkge1xuICAgICAgaWYgKGNodW5rLmF0KC0xKSA9PT0gQ1IpIHtcbiAgICAgICAgdGhpcy4jcHJldkhhZENSID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI2J1ZnMuYWRkKGNodW5rKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGNyT3JMZkluZGV4ID0gbGZJbmRleDtcbiAgICAgIGlmIChjaHVua1tsZkluZGV4IC0gMV0gPT09IENSKSB7XG4gICAgICAgIGNyT3JMZkluZGV4LS07XG4gICAgICB9XG4gICAgICB0aGlzLiNidWZzLmFkZChjaHVuay5zdWJhcnJheSgwLCBjck9yTGZJbmRleCkpO1xuICAgICAgY29udHJvbGxlci5lbnF1ZXVlKHRoaXMuI21lcmdlQnVmcyhmYWxzZSkpO1xuICAgICAgdGhpcy4jaGFuZGxlKGNodW5rLnN1YmFycmF5KGxmSW5kZXggKyAxKSwgY29udHJvbGxlcik7XG4gICAgfVxuICB9XG5cbiAgI21lcmdlQnVmcyhwcmV2SGFkQ1I6IGJvb2xlYW4pOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCBtZXJnZUJ1ZiA9IHRoaXMuI2J1ZnMuY29uY2F0KCk7XG4gICAgdGhpcy4jYnVmcyA9IG5ldyBCeXRlc0xpc3QoKTtcblxuICAgIGlmIChwcmV2SGFkQ1IpIHtcbiAgICAgIHJldHVybiBtZXJnZUJ1Zi5zdWJhcnJheSgwLCAtMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtZXJnZUJ1ZjtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFRyYW5zZm9ybSBhIHN0cmVhbSBpbnRvIGEgc3RyZWFtIHdoZXJlIGVhY2ggY2h1bmsgaXMgZGl2aWRlZCBieSBhIG5ld2xpbmUsXG4gKiBiZSBpdCBgXFxuYCwgYFxccmAsIG9yIGBcXHJcXG5gLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBUZXh0TGluZVN0cmVhbSB9IGZyb20gXCIuL2RlbGltaXRlci50c1wiO1xuICogY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2V4YW1wbGUuY29tXCIpO1xuICogY29uc3QgbGluZXMgPSByZXMuYm9keSFcbiAqICAgLnBpcGVUaHJvdWdoKG5ldyBUZXh0RGVjb2RlclN0cmVhbSgpKVxuICogICAucGlwZVRocm91Z2gobmV3IFRleHRMaW5lU3RyZWFtKCkpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBUZXh0TGluZVN0cmVhbSBleHRlbmRzIFRyYW5zZm9ybVN0cmVhbTxzdHJpbmcsIHN0cmluZz4ge1xuICAjYnVmID0gXCJcIjtcbiAgI3ByZXZIYWRDUiA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKHtcbiAgICAgIHRyYW5zZm9ybTogKGNodW5rLCBjb250cm9sbGVyKSA9PiB7XG4gICAgICAgIHRoaXMuI2hhbmRsZShjaHVuaywgY29udHJvbGxlcik7XG4gICAgICB9LFxuICAgICAgZmx1c2g6IChjb250cm9sbGVyKSA9PiB7XG4gICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZSh0aGlzLiNnZXRCdWYodGhpcy4jcHJldkhhZENSKSk7XG4gICAgICAgIGlmICh0aGlzLiNwcmV2SGFkQ1IpIHtcbiAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoXCJcIik7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAjaGFuZGxlKFxuICAgIGNodW5rOiBzdHJpbmcsXG4gICAgY29udHJvbGxlcjogVHJhbnNmb3JtU3RyZWFtRGVmYXVsdENvbnRyb2xsZXI8c3RyaW5nPixcbiAgKSB7XG4gICAgY29uc3QgbGZJbmRleCA9IGNodW5rLmluZGV4T2YoXCJcXG5cIik7XG4gICAgY29uc3QgY3JJbmRleCA9IGNodW5rLmluZGV4T2YoXCJcXHJcIik7XG5cbiAgICBpZiAodGhpcy4jcHJldkhhZENSKSB7XG4gICAgICB0aGlzLiNwcmV2SGFkQ1IgPSBmYWxzZTtcbiAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZSh0aGlzLiNnZXRCdWYodHJ1ZSkpO1xuICAgICAgaWYgKGxmSW5kZXggPT09IDApIHtcbiAgICAgICAgdGhpcy4jaGFuZGxlKGNodW5rLnNsaWNlKDEpLCBjb250cm9sbGVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsZkluZGV4ID09PSAtMSAmJiBjckluZGV4ID09PSAtMSkgeyAvLyBuZWl0aGVyIFxcbiBub3IgXFxyXG4gICAgICB0aGlzLiNidWYgKz0gY2h1bms7XG4gICAgfSBlbHNlIGlmIChsZkluZGV4ID09PSAtMSAmJiBjckluZGV4ICE9PSAtMSkgeyAvLyBub3QgXFxuIGJ1dCBcXHJcbiAgICAgIGlmIChjckluZGV4ID09PSAoY2h1bmsubGVuZ3RoIC0gMSkpIHsgLy8gXFxyIGlzIGxhc3QgY2hhcmFjdGVyXG4gICAgICAgIHRoaXMuI2J1ZiArPSBjaHVuaztcbiAgICAgICAgdGhpcy4jcHJldkhhZENSID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuI21lcmdlSGFuZGxlKGNodW5rLCBjckluZGV4LCBjckluZGV4LCBjb250cm9sbGVyKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGxmSW5kZXggIT09IC0xICYmIGNySW5kZXggPT09IC0xKSB7IC8vIFxcbiBidXQgbm90IFxcclxuICAgICAgdGhpcy4jbWVyZ2VIYW5kbGUoY2h1bmssIGxmSW5kZXgsIGxmSW5kZXgsIGNvbnRyb2xsZXIpO1xuICAgIH0gZWxzZSB7IC8vIFxcbiBhbmQgXFxyXG4gICAgICBpZiAoKGxmSW5kZXggLSAxKSA9PT0gY3JJbmRleCkgeyAvLyBcXHJcXG5cbiAgICAgICAgdGhpcy4jbWVyZ2VIYW5kbGUoY2h1bmssIGNySW5kZXgsIGxmSW5kZXgsIGNvbnRyb2xsZXIpO1xuICAgICAgfSBlbHNlIGlmIChjckluZGV4IDwgbGZJbmRleCkgeyAvLyBcXHIgZmlyc3RcbiAgICAgICAgdGhpcy4jbWVyZ2VIYW5kbGUoY2h1bmssIGNySW5kZXgsIGNySW5kZXgsIGNvbnRyb2xsZXIpO1xuICAgICAgfSBlbHNlIHsgLy8gXFxuIGZpcnN0XG4gICAgICAgIHRoaXMuI21lcmdlSGFuZGxlKGNodW5rLCBsZkluZGV4LCBsZkluZGV4LCBjb250cm9sbGVyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAjbWVyZ2VIYW5kbGUoXG4gICAgY2h1bms6IHN0cmluZyxcbiAgICBwcmV2Q2h1bmtFbmRJbmRleDogbnVtYmVyLFxuICAgIG5ld0NodW5rU3RhcnRJbmRleDogbnVtYmVyLFxuICAgIGNvbnRyb2xsZXI6IFRyYW5zZm9ybVN0cmVhbURlZmF1bHRDb250cm9sbGVyPHN0cmluZz4sXG4gICkge1xuICAgIHRoaXMuI2J1ZiArPSBjaHVuay5zbGljZSgwLCBwcmV2Q2h1bmtFbmRJbmRleCk7XG4gICAgY29udHJvbGxlci5lbnF1ZXVlKHRoaXMuI2dldEJ1ZihmYWxzZSkpO1xuICAgIHRoaXMuI2hhbmRsZShjaHVuay5zbGljZShuZXdDaHVua1N0YXJ0SW5kZXggKyAxKSwgY29udHJvbGxlcik7XG4gIH1cblxuICAjZ2V0QnVmKHByZXZIYWRDUjogYm9vbGVhbik6IHN0cmluZyB7XG4gICAgY29uc3QgYnVmID0gdGhpcy4jYnVmO1xuICAgIHRoaXMuI2J1ZiA9IFwiXCI7XG5cbiAgICBpZiAocHJldkhhZENSKSB7XG4gICAgICByZXR1cm4gYnVmLnNsaWNlKDAsIC0xKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1ZjtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFRyYW5zZm9ybSBhIHN0cmVhbSBpbnRvIGEgc3RyZWFtIHdoZXJlIGVhY2ggY2h1bmsgaXMgZGl2aWRlZCBieSBhIGdpdmVuIGRlbGltaXRlci5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgRGVsaW1pdGVyU3RyZWFtIH0gZnJvbSBcIi4vZGVsaW1pdGVyLnRzXCI7XG4gKiBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vZXhhbXBsZS5jb21cIik7XG4gKiBjb25zdCBwYXJ0cyA9IHJlcy5ib2R5IVxuICogICAucGlwZVRocm91Z2gobmV3IERlbGltaXRlclN0cmVhbShuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJmb29cIikpKVxuICogICAucGlwZVRocm91Z2gobmV3IFRleHREZWNvZGVyU3RyZWFtKCkpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWxpbWl0ZXJTdHJlYW0gZXh0ZW5kcyBUcmFuc2Zvcm1TdHJlYW08VWludDhBcnJheSwgVWludDhBcnJheT4ge1xuICAjYnVmcyA9IG5ldyBCeXRlc0xpc3QoKTtcbiAgI2RlbGltaXRlcjogVWludDhBcnJheTtcbiAgI2luc3BlY3RJbmRleCA9IDA7XG4gICNtYXRjaEluZGV4ID0gMDtcbiAgI2RlbGltTGVuOiBudW1iZXI7XG4gICNkZWxpbUxQUzogVWludDhBcnJheTtcblxuICBjb25zdHJ1Y3RvcihkZWxpbWl0ZXI6IFVpbnQ4QXJyYXkpIHtcbiAgICBzdXBlcih7XG4gICAgICB0cmFuc2Zvcm06IChjaHVuaywgY29udHJvbGxlcikgPT4ge1xuICAgICAgICB0aGlzLiNoYW5kbGUoY2h1bmssIGNvbnRyb2xsZXIpO1xuICAgICAgfSxcbiAgICAgIGZsdXNoOiAoY29udHJvbGxlcikgPT4ge1xuICAgICAgICBjb250cm9sbGVyLmVucXVldWUodGhpcy4jYnVmcy5jb25jYXQoKSk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy4jZGVsaW1pdGVyID0gZGVsaW1pdGVyO1xuICAgIHRoaXMuI2RlbGltTGVuID0gZGVsaW1pdGVyLmxlbmd0aDtcbiAgICB0aGlzLiNkZWxpbUxQUyA9IGNyZWF0ZUxQUyhkZWxpbWl0ZXIpO1xuICB9XG5cbiAgI2hhbmRsZShcbiAgICBjaHVuazogVWludDhBcnJheSxcbiAgICBjb250cm9sbGVyOiBUcmFuc2Zvcm1TdHJlYW1EZWZhdWx0Q29udHJvbGxlcjxVaW50OEFycmF5PixcbiAgKSB7XG4gICAgdGhpcy4jYnVmcy5hZGQoY2h1bmspO1xuICAgIGxldCBsb2NhbEluZGV4ID0gMDtcbiAgICB3aGlsZSAodGhpcy4jaW5zcGVjdEluZGV4IDwgdGhpcy4jYnVmcy5zaXplKCkpIHtcbiAgICAgIGlmIChjaHVua1tsb2NhbEluZGV4XSA9PT0gdGhpcy4jZGVsaW1pdGVyW3RoaXMuI21hdGNoSW5kZXhdKSB7XG4gICAgICAgIHRoaXMuI2luc3BlY3RJbmRleCsrO1xuICAgICAgICBsb2NhbEluZGV4Kys7XG4gICAgICAgIHRoaXMuI21hdGNoSW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuI21hdGNoSW5kZXggPT09IHRoaXMuI2RlbGltTGVuKSB7XG4gICAgICAgICAgLy8gRnVsbCBtYXRjaFxuICAgICAgICAgIGNvbnN0IG1hdGNoRW5kID0gdGhpcy4jaW5zcGVjdEluZGV4IC0gdGhpcy4jZGVsaW1MZW47XG4gICAgICAgICAgY29uc3QgcmVhZHlCeXRlcyA9IHRoaXMuI2J1ZnMuc2xpY2UoMCwgbWF0Y2hFbmQpO1xuICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShyZWFkeUJ5dGVzKTtcbiAgICAgICAgICAvLyBSZXNldCBtYXRjaCwgZGlmZmVyZW50IGZyb20gS01QLlxuICAgICAgICAgIHRoaXMuI2J1ZnMuc2hpZnQodGhpcy4jaW5zcGVjdEluZGV4KTtcbiAgICAgICAgICB0aGlzLiNpbnNwZWN0SW5kZXggPSAwO1xuICAgICAgICAgIHRoaXMuI21hdGNoSW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy4jbWF0Y2hJbmRleCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuI2luc3BlY3RJbmRleCsrO1xuICAgICAgICAgIGxvY2FsSW5kZXgrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiNtYXRjaEluZGV4ID0gdGhpcy4jZGVsaW1MUFNbdGhpcy4jbWF0Y2hJbmRleCAtIDFdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBUcmFuc2Zvcm0gYSBzdHJlYW0gaW50byBhIHN0cmVhbSB3aGVyZSBlYWNoIGNodW5rIGlzIGRpdmlkZWQgYnkgYSBnaXZlbiBkZWxpbWl0ZXIuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IFRleHREZWxpbWl0ZXJTdHJlYW0gfSBmcm9tIFwiLi9kZWxpbWl0ZXIudHNcIjtcbiAqIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9leGFtcGxlLmNvbVwiKTtcbiAqIGNvbnN0IHBhcnRzID0gcmVzLmJvZHkhXG4gKiAgIC5waXBlVGhyb3VnaChuZXcgVGV4dERlY29kZXJTdHJlYW0oKSlcbiAqICAgLnBpcGVUaHJvdWdoKG5ldyBUZXh0RGVsaW1pdGVyU3RyZWFtKFwiZm9vXCIpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgVGV4dERlbGltaXRlclN0cmVhbSBleHRlbmRzIFRyYW5zZm9ybVN0cmVhbTxzdHJpbmcsIHN0cmluZz4ge1xuICAjYnVmID0gXCJcIjtcbiAgI2RlbGltaXRlcjogc3RyaW5nO1xuICAjaW5zcGVjdEluZGV4ID0gMDtcbiAgI21hdGNoSW5kZXggPSAwO1xuICAjZGVsaW1MUFM6IFVpbnQ4QXJyYXk7XG5cbiAgY29uc3RydWN0b3IoZGVsaW1pdGVyOiBzdHJpbmcpIHtcbiAgICBzdXBlcih7XG4gICAgICB0cmFuc2Zvcm06IChjaHVuaywgY29udHJvbGxlcikgPT4ge1xuICAgICAgICB0aGlzLiNoYW5kbGUoY2h1bmssIGNvbnRyb2xsZXIpO1xuICAgICAgfSxcbiAgICAgIGZsdXNoOiAoY29udHJvbGxlcikgPT4ge1xuICAgICAgICBjb250cm9sbGVyLmVucXVldWUodGhpcy4jYnVmKTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLiNkZWxpbWl0ZXIgPSBkZWxpbWl0ZXI7XG4gICAgdGhpcy4jZGVsaW1MUFMgPSBjcmVhdGVMUFMobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKGRlbGltaXRlcikpO1xuICB9XG5cbiAgI2hhbmRsZShcbiAgICBjaHVuazogc3RyaW5nLFxuICAgIGNvbnRyb2xsZXI6IFRyYW5zZm9ybVN0cmVhbURlZmF1bHRDb250cm9sbGVyPHN0cmluZz4sXG4gICkge1xuICAgIHRoaXMuI2J1ZiArPSBjaHVuaztcbiAgICBsZXQgbG9jYWxJbmRleCA9IDA7XG4gICAgd2hpbGUgKHRoaXMuI2luc3BlY3RJbmRleCA8IHRoaXMuI2J1Zi5sZW5ndGgpIHtcbiAgICAgIGlmIChjaHVua1tsb2NhbEluZGV4XSA9PT0gdGhpcy4jZGVsaW1pdGVyW3RoaXMuI21hdGNoSW5kZXhdKSB7XG4gICAgICAgIHRoaXMuI2luc3BlY3RJbmRleCsrO1xuICAgICAgICBsb2NhbEluZGV4Kys7XG4gICAgICAgIHRoaXMuI21hdGNoSW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuI21hdGNoSW5kZXggPT09IHRoaXMuI2RlbGltaXRlci5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBGdWxsIG1hdGNoXG4gICAgICAgICAgY29uc3QgbWF0Y2hFbmQgPSB0aGlzLiNpbnNwZWN0SW5kZXggLSB0aGlzLiNkZWxpbWl0ZXIubGVuZ3RoO1xuICAgICAgICAgIGNvbnN0IHJlYWR5U3RyaW5nID0gdGhpcy4jYnVmLnNsaWNlKDAsIG1hdGNoRW5kKTtcbiAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUocmVhZHlTdHJpbmcpO1xuICAgICAgICAgIC8vIFJlc2V0IG1hdGNoLCBkaWZmZXJlbnQgZnJvbSBLTVAuXG4gICAgICAgICAgdGhpcy4jYnVmID0gdGhpcy4jYnVmLnNsaWNlKHRoaXMuI2luc3BlY3RJbmRleCk7XG4gICAgICAgICAgdGhpcy4jaW5zcGVjdEluZGV4ID0gMDtcbiAgICAgICAgICB0aGlzLiNtYXRjaEluZGV4ID0gMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuI21hdGNoSW5kZXggPT09IDApIHtcbiAgICAgICAgICB0aGlzLiNpbnNwZWN0SW5kZXgrKztcbiAgICAgICAgICBsb2NhbEluZGV4Kys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4jbWF0Y2hJbmRleCA9IHRoaXMuI2RlbGltTFBTW3RoaXMuI21hdGNoSW5kZXggLSAxXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogR2VuZXJhdGUgbG9uZ2VzdCBwcm9wZXIgcHJlZml4IHdoaWNoIGlzIGFsc28gc3VmZml4IGFycmF5LiAqL1xuZnVuY3Rpb24gY3JlYXRlTFBTKHBhdDogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBscHMgPSBuZXcgVWludDhBcnJheShwYXQubGVuZ3RoKTtcbiAgbHBzWzBdID0gMDtcbiAgbGV0IHByZWZpeEVuZCA9IDA7XG4gIGxldCBpID0gMTtcbiAgd2hpbGUgKGkgPCBscHMubGVuZ3RoKSB7XG4gICAgaWYgKHBhdFtpXSA9PSBwYXRbcHJlZml4RW5kXSkge1xuICAgICAgcHJlZml4RW5kKys7XG4gICAgICBscHNbaV0gPSBwcmVmaXhFbmQ7XG4gICAgICBpKys7XG4gICAgfSBlbHNlIGlmIChwcmVmaXhFbmQgPT09IDApIHtcbiAgICAgIGxwc1tpXSA9IDA7XG4gICAgICBpKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZWZpeEVuZCA9IGxwc1twcmVmaXhFbmQgLSAxXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGxwcztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsU0FBUyxRQUFRLHlCQUF5QjtBQUVuRCxNQUFNLEtBQUssS0FBSyxVQUFVLENBQUM7QUFDM0IsTUFBTSxLQUFLLEtBQUssVUFBVSxDQUFDO0FBRTNCOzs7Ozs7Ozs7O0NBVUMsR0FDRCxPQUFPLE1BQU0sbUJBQW1CO0VBQzlCLENBQUEsSUFBSyxHQUFHLElBQUksWUFBWTtFQUN4QixDQUFBLFNBQVUsR0FBRyxNQUFNO0VBRW5CLGFBQWM7SUFDWixLQUFLLENBQUM7TUFDSixXQUFXLENBQUMsT0FBTztRQUNqQixJQUFJLENBQUMsQ0FBQSxNQUFPLENBQUMsT0FBTztNQUN0QjtNQUNBLE9BQU8sQ0FBQztRQUNOLFdBQVcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBLFNBQVUsQ0FBQztNQUNyQztJQUNGO0VBQ0Y7RUFFQSxDQUFBLE1BQU8sQ0FDTCxLQUFpQixFQUNqQixVQUF3RDtJQUV4RCxNQUFNLFVBQVUsTUFBTSxPQUFPLENBQUM7SUFFOUIsSUFBSSxJQUFJLENBQUMsQ0FBQSxTQUFVLEVBQUU7TUFDbkIsSUFBSSxDQUFDLENBQUEsU0FBVSxHQUFHO01BQ2xCLElBQUksWUFBWSxHQUFHO1FBQ2pCLFdBQVcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBLFNBQVUsQ0FBQztRQUNuQyxJQUFJLENBQUMsQ0FBQSxNQUFPLENBQUMsTUFBTSxRQUFRLENBQUMsSUFBSTtRQUNoQztNQUNGO0lBQ0Y7SUFFQSxJQUFJLFlBQVks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
// denoCacheMetadata=1587428248270235415,11173849419018302005