import { encodeCString, instances, lib } from "./ffi.ts";
/** Window size hints */ export const SizeHint = {
  /** Width and height are default size */ NONE: 0,
  /** Width and height are minimum bounds */ MIN: 1,
  /** Width and height are maximum bounds */ MAX: 2,
  /** Window size can not be changed by a user */ FIXED: 3
};
/**
 * An instance of a webview window.
 *
 * ## Examples
 *
 * ### Local
 *
 * ```ts
 * import { Webview } from "../mod.ts";
 *
 * const html = `
 *   <html>
 *   <body>
 *     <h1>Hello from deno v${Deno.version.deno}</h1>
 *   </body>
 *   </html>
 * `;
 *
 * const webview = new Webview();
 *
 * webview.navigate(`data:text/html,${encodeURIComponent(html)}`);
 * webview.run();
 * ```
 *
 * ### Remote
 *
 * ```ts
 * import { Webview } from "../mod.ts";
 *
 * const webview = new Webview();
 * webview.navigate("https://deno.land/");
 * webview.run();
 * ```
 */ export class Webview {
  #handle = null;
  #callbacks = new Map();
  /** **UNSAFE**: Highly unsafe API, beware!
   *
   * An unsafe pointer to the webview
   */ get unsafeHandle() {
    return this.#handle;
  }
  /** **UNSAFE**: Highly unsafe API, beware!
   *
   * An unsafe pointer to the webviews platform specific native window handle.
   * When using GTK backend the pointer is `GtkWindow` pointer, when using Cocoa
   * backend the pointer is `NSWindow` pointer, when using Win32 backend the
   * pointer is `HWND` pointer.
   */ get unsafeWindowHandle() {
    return lib.symbols.webview_get_window(this.#handle);
  }
  /**
   * Sets the native window size
   *
   * ## Example
   *
   * ```ts
   * import { Webview, SizeHint } from "../mod.ts";
   *
   * const webview = new Webview();
   * webview.navigate("https://deno.land/");
   *
   * // Change from the default size to a small fixed window
   * webview.size = {
   *   width: 200,
   *   height: 200,
   *   hint: SizeHint.FIXED
   * };
   *
   * webview.run();
   * ```
   */ set size({ width, height, hint }) {
    lib.symbols.webview_set_size(this.#handle, width, height, hint);
  }
  /**
   * Sets the native window title
   *
   * ## Example
   *
   * ```ts
   * import { Webview } from "../mod.ts";
   *
   * const webview = new Webview();
   * webview.navigate("https://deno.land/");
   *
   * // Set the window title to "Hello world!"
   * webview.title = "Hello world!";
   *
   * webview.run();
   * ```
   */ set title(title) {
    lib.symbols.webview_set_title(this.#handle, encodeCString(title));
  }
  constructor(debugOrHandle = false, size = {
    width: 1024,
    height: 768,
    hint: SizeHint.NONE
  }, window = null){
    this.#handle = typeof debugOrHandle === "bigint" || typeof debugOrHandle === "number" ? debugOrHandle : lib.symbols.webview_create(Number(debugOrHandle), window);
    if (size !== undefined) {
      this.size = size;
    }
    // Push this instance to the global instances list to automatically destroy
    instances.push(this);
  }
  /**
   * Destroys the webview and closes the window along with freeing all internal
   * resources.
   */ destroy() {
    for (const callback of Object.keys(this.#callbacks)){
      this.unbind(callback);
    }
    lib.symbols.webview_terminate(this.#handle);
    lib.symbols.webview_destroy(this.#handle);
    this.#handle = null;
  }
  /**
   * Navigates webview to the given URL. URL may be a data URI, i.e.
   * `"data:text/html,<html>...</html>"`. It is often ok not to url-encodeCString it
   * properly, webview will re-encodeCString it for you.
   */ navigate(url) {
    lib.symbols.webview_navigate(this.#handle, encodeCString(url instanceof URL ? url.toString() : url));
  }
  /**
   * Runs the main event loop until it's terminated. After this function exits
   * the webview is automatically destroyed.
   */ run() {
    lib.symbols.webview_run(this.#handle);
    this.destroy();
  }
  /**
   * Binds a callback so that it will appear in the webview with the given name
   * as a global async JavaScript function. Callback receives a seq and req value.
   * The seq parameter is an identifier for using {@link Webview.return} to
   * return a value while the req parameter is a string of an JSON array representing
   * the arguments passed from the JavaScript function call.
   *
   * @param name The name of the bound function
   * @param callback A callback which takes two strings as parameters: `seq`
   * and `req` and the passed {@link arg} pointer
   * @param arg A pointer which is going to be passed to the callback once called
   */ bindRaw(name, callback, arg = null) {
    const callbackResource = new Deno.UnsafeCallback({
      parameters: [
        "pointer",
        "pointer",
        "pointer"
      ],
      result: "void"
    }, (seqPtr, reqPtr, arg)=>{
      const seq = seqPtr ? new Deno.UnsafePointerView(seqPtr).getCString() : "";
      const req = reqPtr ? new Deno.UnsafePointerView(reqPtr).getCString() : "";
      callback(seq, req, arg);
    });
    this.#callbacks.set(name, callbackResource);
    lib.symbols.webview_bind(this.#handle, encodeCString(name), callbackResource.pointer, arg);
  }
  /**
   * Binds a callback so that it will appear in the webview with the given name
   * as a global async JavaScript function. Callback arguments are automatically
   * converted from json to as closely as possible match the arguments in the
   * webview context and the callback automatically converts and returns the
   * return value to the webview.
   *
   * @param name The name of the bound function
   * @param callback A callback which is passed the arguments as called from the
   * webview JavaScript environment and optionally returns a value to the
   * webview JavaScript caller
   *
   * ## Example
   * ```ts
   * import { Webview } from "../mod.ts";
   *
   * const html = `
   *   <html>
   *   <body>
   *     <h1>Hello from deno v${Deno.version.deno}</h1>
   *     <button onclick="press('I was pressed!', 123, new Date()).then(log);">
   *       Press me!
   *     </button>
   *   </body>
   *   </html>
   * `;
   *
   * const webview = new Webview();
   *
   * webview.navigate(`data:text/html,${encodeURIComponent(html)}`);
   *
   * let counter = 0;
   * // Create and bind `press` to the webview javascript instance.
   * // This functions in addition to logging its parameters also returns
   * // a value from deno land to webview land.
   * webview.bind("press", (a, b, c) => {
   *   console.log(a, b, c);
   *
   *   return { times: counter++ };
   * });
   *
   * // Bind the `log` function in the webview to the parent instances `console.log`
   * webview.bind("log", (...args) => console.log(...args));
   *
   * webview.run();
   * ```
   */ bind(name, // deno-lint-ignore no-explicit-any
  callback) {
    this.bindRaw(name, (seq, req)=>{
      const args = JSON.parse(req);
      let result;
      let success;
      try {
        result = callback(...args);
        success = true;
      } catch (err) {
        result = err;
        success = false;
      }
      if (result instanceof Promise) {
        result.then((result)=>this.return(seq, success ? 0 : 1, JSON.stringify(result)));
      } else {
        this.return(seq, success ? 0 : 1, JSON.stringify(result));
      }
    });
  }
  /**
   * Unbinds a previously bound function freeing its resource and removing it
   * from the webview JavaScript context.
   *
   * @param name The name of the bound function
   */ unbind(name) {
    lib.symbols.webview_unbind(this.#handle, encodeCString(name));
    this.#callbacks.get(name)?.close();
    this.#callbacks.delete(name);
  }
  /**
   * Returns a value to the webview JavaScript environment.
   *
   * @param seq The request pointer as provided by the {@link Webview.bindRaw}
   * callback
   * @param status If status is zero the result is expected to be a valid JSON
   * result value otherwise the result is an error JSON object
   * @param result The stringified JSON response
   */ return(seq, status, result) {
    lib.symbols.webview_return(this.#handle, encodeCString(seq), status, encodeCString(result));
  }
  /**
   * Evaluates arbitrary JavaScript code. Evaluation happens asynchronously,
   * also the result of the expression is ignored. Use
   * {@link Webview.bind bindings} if you want to receive notifications about
   * the results of the evaluation.
   */ eval(source) {
    lib.symbols.webview_eval(this.#handle, encodeCString(source));
  }
  /**
   * Injects JavaScript code at the initialization of the new page. Every time
   * the webview will open a the new page - this initialization code will be
   * executed. It is guaranteed that code is executed before window.onload.
   */ init(source) {
    lib.symbols.webview_init(this.#handle, encodeCString(source));
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0B3ZWJ2aWV3L3dlYnZpZXcvMC45LjAvc3JjL3dlYnZpZXcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZW5jb2RlQ1N0cmluZywgaW5zdGFuY2VzLCBsaWIgfSBmcm9tIFwiLi9mZmkudHNcIjtcblxuLyoqIFdpbmRvdyBzaXplIGhpbnRzICovXG5leHBvcnQgdHlwZSBTaXplSGludCA9IHR5cGVvZiBTaXplSGludFtrZXlvZiB0eXBlb2YgU2l6ZUhpbnRdO1xuXG4vKiogV2luZG93IHNpemUgaGludHMgKi9cbmV4cG9ydCBjb25zdCBTaXplSGludCA9IHtcbiAgLyoqIFdpZHRoIGFuZCBoZWlnaHQgYXJlIGRlZmF1bHQgc2l6ZSAqL1xuICBOT05FOiAwLFxuICAvKiogV2lkdGggYW5kIGhlaWdodCBhcmUgbWluaW11bSBib3VuZHMgKi9cbiAgTUlOOiAxLFxuICAvKiogV2lkdGggYW5kIGhlaWdodCBhcmUgbWF4aW11bSBib3VuZHMgKi9cbiAgTUFYOiAyLFxuICAvKiogV2luZG93IHNpemUgY2FuIG5vdCBiZSBjaGFuZ2VkIGJ5IGEgdXNlciAqL1xuICBGSVhFRDogMyxcbn0gYXMgY29uc3Q7XG5cbi8qKiBXaW5kb3cgc2l6ZSAqL1xuZXhwb3J0IGludGVyZmFjZSBTaXplIHtcbiAgLyoqIFRoZSB3aWR0aCBvZiB0aGUgd2luZG93ICovXG4gIHdpZHRoOiBudW1iZXI7XG4gIC8qKiBUaGUgaGVpZ2h0IG9mIHRoZSB3aW5kb3cgKi9cbiAgaGVpZ2h0OiBudW1iZXI7XG4gIC8qKiBUaGUgd2luZG93IHNpemUgaGludCAqL1xuICBoaW50OiBTaXplSGludDtcbn1cblxuLyoqXG4gKiBBbiBpbnN0YW5jZSBvZiBhIHdlYnZpZXcgd2luZG93LlxuICpcbiAqICMjIEV4YW1wbGVzXG4gKlxuICogIyMjIExvY2FsXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IFdlYnZpZXcgfSBmcm9tIFwiLi4vbW9kLnRzXCI7XG4gKlxuICogY29uc3QgaHRtbCA9IGBcbiAqICAgPGh0bWw+XG4gKiAgIDxib2R5PlxuICogICAgIDxoMT5IZWxsbyBmcm9tIGRlbm8gdiR7RGVuby52ZXJzaW9uLmRlbm99PC9oMT5cbiAqICAgPC9ib2R5PlxuICogICA8L2h0bWw+XG4gKiBgO1xuICpcbiAqIGNvbnN0IHdlYnZpZXcgPSBuZXcgV2VidmlldygpO1xuICpcbiAqIHdlYnZpZXcubmF2aWdhdGUoYGRhdGE6dGV4dC9odG1sLCR7ZW5jb2RlVVJJQ29tcG9uZW50KGh0bWwpfWApO1xuICogd2Vidmlldy5ydW4oKTtcbiAqIGBgYFxuICpcbiAqICMjIyBSZW1vdGVcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgV2VidmlldyB9IGZyb20gXCIuLi9tb2QudHNcIjtcbiAqXG4gKiBjb25zdCB3ZWJ2aWV3ID0gbmV3IFdlYnZpZXcoKTtcbiAqIHdlYnZpZXcubmF2aWdhdGUoXCJodHRwczovL2Rlbm8ubGFuZC9cIik7XG4gKiB3ZWJ2aWV3LnJ1bigpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJ2aWV3IHtcbiAgI2hhbmRsZTogRGVuby5Qb2ludGVyVmFsdWUgPSBudWxsO1xuICAjY2FsbGJhY2tzOiBNYXA8XG4gICAgc3RyaW5nLFxuICAgIERlbm8uVW5zYWZlQ2FsbGJhY2s8e1xuICAgICAgcGFyYW1ldGVyczogcmVhZG9ubHkgXCJwb2ludGVyXCJbXTtcbiAgICAgIHJlc3VsdDogXCJ2b2lkXCI7XG4gICAgfT5cbiAgPiA9IG5ldyBNYXAoKTtcblxuICAvKiogKipVTlNBRkUqKjogSGlnaGx5IHVuc2FmZSBBUEksIGJld2FyZSFcbiAgICpcbiAgICogQW4gdW5zYWZlIHBvaW50ZXIgdG8gdGhlIHdlYnZpZXdcbiAgICovXG4gIGdldCB1bnNhZmVIYW5kbGUoKTogRGVuby5Qb2ludGVyVmFsdWUge1xuICAgIHJldHVybiB0aGlzLiNoYW5kbGU7XG4gIH1cblxuICAvKiogKipVTlNBRkUqKjogSGlnaGx5IHVuc2FmZSBBUEksIGJld2FyZSFcbiAgICpcbiAgICogQW4gdW5zYWZlIHBvaW50ZXIgdG8gdGhlIHdlYnZpZXdzIHBsYXRmb3JtIHNwZWNpZmljIG5hdGl2ZSB3aW5kb3cgaGFuZGxlLlxuICAgKiBXaGVuIHVzaW5nIEdUSyBiYWNrZW5kIHRoZSBwb2ludGVyIGlzIGBHdGtXaW5kb3dgIHBvaW50ZXIsIHdoZW4gdXNpbmcgQ29jb2FcbiAgICogYmFja2VuZCB0aGUgcG9pbnRlciBpcyBgTlNXaW5kb3dgIHBvaW50ZXIsIHdoZW4gdXNpbmcgV2luMzIgYmFja2VuZCB0aGVcbiAgICogcG9pbnRlciBpcyBgSFdORGAgcG9pbnRlci5cbiAgICovXG4gIGdldCB1bnNhZmVXaW5kb3dIYW5kbGUoKTogRGVuby5Qb2ludGVyVmFsdWUge1xuICAgIHJldHVybiBsaWIuc3ltYm9scy53ZWJ2aWV3X2dldF93aW5kb3codGhpcy4jaGFuZGxlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBuYXRpdmUgd2luZG93IHNpemVcbiAgICpcbiAgICogIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBXZWJ2aWV3LCBTaXplSGludCB9IGZyb20gXCIuLi9tb2QudHNcIjtcbiAgICpcbiAgICogY29uc3Qgd2VidmlldyA9IG5ldyBXZWJ2aWV3KCk7XG4gICAqIHdlYnZpZXcubmF2aWdhdGUoXCJodHRwczovL2Rlbm8ubGFuZC9cIik7XG4gICAqXG4gICAqIC8vIENoYW5nZSBmcm9tIHRoZSBkZWZhdWx0IHNpemUgdG8gYSBzbWFsbCBmaXhlZCB3aW5kb3dcbiAgICogd2Vidmlldy5zaXplID0ge1xuICAgKiAgIHdpZHRoOiAyMDAsXG4gICAqICAgaGVpZ2h0OiAyMDAsXG4gICAqICAgaGludDogU2l6ZUhpbnQuRklYRURcbiAgICogfTtcbiAgICpcbiAgICogd2Vidmlldy5ydW4oKTtcbiAgICogYGBgXG4gICAqL1xuICBzZXQgc2l6ZShcbiAgICB7IHdpZHRoLCBoZWlnaHQsIGhpbnQgfTogU2l6ZSxcbiAgKSB7XG4gICAgbGliLnN5bWJvbHMud2Vidmlld19zZXRfc2l6ZSh0aGlzLiNoYW5kbGUsIHdpZHRoLCBoZWlnaHQsIGhpbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG5hdGl2ZSB3aW5kb3cgdGl0bGVcbiAgICpcbiAgICogIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBXZWJ2aWV3IH0gZnJvbSBcIi4uL21vZC50c1wiO1xuICAgKlxuICAgKiBjb25zdCB3ZWJ2aWV3ID0gbmV3IFdlYnZpZXcoKTtcbiAgICogd2Vidmlldy5uYXZpZ2F0ZShcImh0dHBzOi8vZGVuby5sYW5kL1wiKTtcbiAgICpcbiAgICogLy8gU2V0IHRoZSB3aW5kb3cgdGl0bGUgdG8gXCJIZWxsbyB3b3JsZCFcIlxuICAgKiB3ZWJ2aWV3LnRpdGxlID0gXCJIZWxsbyB3b3JsZCFcIjtcbiAgICpcbiAgICogd2Vidmlldy5ydW4oKTtcbiAgICogYGBgXG4gICAqL1xuICBzZXQgdGl0bGUodGl0bGU6IHN0cmluZykge1xuICAgIGxpYi5zeW1ib2xzLndlYnZpZXdfc2V0X3RpdGxlKHRoaXMuI2hhbmRsZSwgZW5jb2RlQ1N0cmluZyh0aXRsZSkpO1xuICB9XG5cbiAgLyoqICoqVU5TQUZFKio6IEhpZ2hseSB1bnNhZmUgQVBJLCBiZXdhcmUhXG4gICAqXG4gICAqIENyZWF0ZXMgYSBuZXcgd2VidmlldyBpbnN0YW5jZSBmcm9tIGEgd2VidmlldyBoYW5kbGUuXG4gICAqXG4gICAqIEBwYXJhbSBoYW5kbGUgQSBwcmV2aW91c2x5IGNyZWF0ZWQgd2VidmlldyBpbnN0YW5jZXMgaGFuZGxlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihoYW5kbGU6IERlbm8uUG9pbnRlclZhbHVlKTtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgd2VidmlldyBpbnN0YW5jZS5cbiAgICpcbiAgICogIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBXZWJ2aWV3LCBTaXplSGludCB9IGZyb20gXCIuLi9tb2QudHNcIjtcbiAgICpcbiAgICogLy8gQ3JlYXRlIGEgbmV3IHdlYnZpZXcgYW5kIGNoYW5nZSBmcm9tIHRoZSBkZWZhdWx0IHNpemUgdG8gYSBzbWFsbCBmaXhlZCB3aW5kb3dcbiAgICogY29uc3Qgd2VidmlldyA9IG5ldyBXZWJ2aWV3KHRydWUsIHtcbiAgICogICB3aWR0aDogMjAwLFxuICAgKiAgIGhlaWdodDogMjAwLFxuICAgKiAgIGhpbnQ6IFNpemVIaW50LkZJWEVEXG4gICAqIH0pO1xuICAgKlxuICAgKiB3ZWJ2aWV3Lm5hdmlnYXRlKFwiaHR0cHM6Ly9kZW5vLmxhbmQvXCIpO1xuICAgKiB3ZWJ2aWV3LnJ1bigpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGRlYnVnIERlZmF1bHRzIHRvIGZhbHNlLCB3aGVuIHRydWUgZGV2ZWxvcGVyIHRvb2xzIGFyZSBlbmFibGVkXG4gICAqIGZvciBzdXBwb3J0ZWQgcGxhdGZvcm1zXG4gICAqIEBwYXJhbSBzaXplIFRoZSB3aW5kb3cgc2l6ZSwgZGVmYXVsdCB0byAxMDI0eDc2OCB3aXRoIG5vIHNpemUgaGludC4gU2V0XG4gICAqIHRoaXMgdG8gdW5kZWZpbmVkIGlmIHlvdSBkbyBub3Qgd2FudCB0byBhdXRvbWF0aWNhbGx5IHJlc2l6ZSB0aGUgd2luZG93LlxuICAgKiBUaGlzIG1heSBjYXVzZSBpc3N1ZXMgZm9yIE1hY09TIHdoZXJlIHRoZSB3aW5kb3cgaXMgaW52aXNpYmxlIHVudGlsXG4gICAqIHJlc2l6ZWQuXG4gICAqIEBwYXJhbSB3aW5kb3cgKipVTlNBRkUqKjogSGlnaGx5IHVuc2FmZSBBUEksIGJld2FyZSEgQW4gdW5zYWZlIHBvaW50ZXIgdG9cbiAgICogdGhlIHBsYXRmb3JtcyBzcGVjaWZpYyBuYXRpdmUgd2luZG93IGhhbmRsZS4gSWYgbnVsbCBvciB1bmRlZmluZWQgYSBuZXdcbiAgICogd2luZG93IGlzIGNyZWF0ZWQuIElmIGl0J3Mgbm9uLW51bGwgLSB0aGVuIGNoaWxkIFdlYlZpZXcgaXMgZW1iZWRkZWQgaW50b1xuICAgKiB0aGUgZ2l2ZW4gcGFyZW50IHdpbmRvdy4gT3RoZXJ3aXNlIGEgbmV3IHdpbmRvdyBpcyBjcmVhdGVkLiBEZXBlbmRpbmcgb25cbiAgICogdGhlIHBsYXRmb3JtLCBhIGBHdGtXaW5kb3dgLCBgTlNXaW5kb3dgIG9yIGBIV05EYCBwb2ludGVyIGNhbiBiZSBwYXNzZWRcbiAgICogaGVyZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGRlYnVnPzogYm9vbGVhbixcbiAgICBzaXplPzogU2l6ZSxcbiAgICB3aW5kb3c/OiBEZW5vLlBvaW50ZXJWYWx1ZSB8IG51bGwsXG4gICk7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGRlYnVnT3JIYW5kbGU6IGJvb2xlYW4gfCBEZW5vLlBvaW50ZXJWYWx1ZSA9IGZhbHNlLFxuICAgIHNpemU6IFNpemUgfCB1bmRlZmluZWQgPSB7IHdpZHRoOiAxMDI0LCBoZWlnaHQ6IDc2OCwgaGludDogU2l6ZUhpbnQuTk9ORSB9LFxuICAgIHdpbmRvdzogRGVuby5Qb2ludGVyVmFsdWUgfCBudWxsID0gbnVsbCxcbiAgKSB7XG4gICAgdGhpcy4jaGFuZGxlID1cbiAgICAgIHR5cGVvZiBkZWJ1Z09ySGFuZGxlID09PSBcImJpZ2ludFwiIHx8IHR5cGVvZiBkZWJ1Z09ySGFuZGxlID09PSBcIm51bWJlclwiXG4gICAgICAgID8gZGVidWdPckhhbmRsZVxuICAgICAgICA6IGxpYi5zeW1ib2xzLndlYnZpZXdfY3JlYXRlKFxuICAgICAgICAgIE51bWJlcihkZWJ1Z09ySGFuZGxlKSxcbiAgICAgICAgICB3aW5kb3csXG4gICAgICAgICk7XG5cbiAgICBpZiAoc2l6ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnNpemUgPSBzaXplO1xuICAgIH1cblxuICAgIC8vIFB1c2ggdGhpcyBpbnN0YW5jZSB0byB0aGUgZ2xvYmFsIGluc3RhbmNlcyBsaXN0IHRvIGF1dG9tYXRpY2FsbHkgZGVzdHJveVxuICAgIGluc3RhbmNlcy5wdXNoKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSB3ZWJ2aWV3IGFuZCBjbG9zZXMgdGhlIHdpbmRvdyBhbG9uZyB3aXRoIGZyZWVpbmcgYWxsIGludGVybmFsXG4gICAqIHJlc291cmNlcy5cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBPYmplY3Qua2V5cyh0aGlzLiNjYWxsYmFja3MpKSB7XG4gICAgICB0aGlzLnVuYmluZChjYWxsYmFjayk7XG4gICAgfVxuICAgIGxpYi5zeW1ib2xzLndlYnZpZXdfdGVybWluYXRlKHRoaXMuI2hhbmRsZSk7XG4gICAgbGliLnN5bWJvbHMud2Vidmlld19kZXN0cm95KHRoaXMuI2hhbmRsZSk7XG4gICAgdGhpcy4jaGFuZGxlID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBOYXZpZ2F0ZXMgd2VidmlldyB0byB0aGUgZ2l2ZW4gVVJMLiBVUkwgbWF5IGJlIGEgZGF0YSBVUkksIGkuZS5cbiAgICogYFwiZGF0YTp0ZXh0L2h0bWwsPGh0bWw+Li4uPC9odG1sPlwiYC4gSXQgaXMgb2Z0ZW4gb2sgbm90IHRvIHVybC1lbmNvZGVDU3RyaW5nIGl0XG4gICAqIHByb3Blcmx5LCB3ZWJ2aWV3IHdpbGwgcmUtZW5jb2RlQ1N0cmluZyBpdCBmb3IgeW91LlxuICAgKi9cbiAgbmF2aWdhdGUodXJsOiBVUkwgfCBzdHJpbmcpIHtcbiAgICBsaWIuc3ltYm9scy53ZWJ2aWV3X25hdmlnYXRlKFxuICAgICAgdGhpcy4jaGFuZGxlLFxuICAgICAgZW5jb2RlQ1N0cmluZyh1cmwgaW5zdGFuY2VvZiBVUkwgPyB1cmwudG9TdHJpbmcoKSA6IHVybCksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIHRoZSBtYWluIGV2ZW50IGxvb3AgdW50aWwgaXQncyB0ZXJtaW5hdGVkLiBBZnRlciB0aGlzIGZ1bmN0aW9uIGV4aXRzXG4gICAqIHRoZSB3ZWJ2aWV3IGlzIGF1dG9tYXRpY2FsbHkgZGVzdHJveWVkLlxuICAgKi9cbiAgcnVuKCk6IHZvaWQge1xuICAgIGxpYi5zeW1ib2xzLndlYnZpZXdfcnVuKHRoaXMuI2hhbmRsZSk7XG4gICAgdGhpcy5kZXN0cm95KCk7XG4gIH1cblxuICAvKipcbiAgICogQmluZHMgYSBjYWxsYmFjayBzbyB0aGF0IGl0IHdpbGwgYXBwZWFyIGluIHRoZSB3ZWJ2aWV3IHdpdGggdGhlIGdpdmVuIG5hbWVcbiAgICogYXMgYSBnbG9iYWwgYXN5bmMgSmF2YVNjcmlwdCBmdW5jdGlvbi4gQ2FsbGJhY2sgcmVjZWl2ZXMgYSBzZXEgYW5kIHJlcSB2YWx1ZS5cbiAgICogVGhlIHNlcSBwYXJhbWV0ZXIgaXMgYW4gaWRlbnRpZmllciBmb3IgdXNpbmcge0BsaW5rIFdlYnZpZXcucmV0dXJufSB0b1xuICAgKiByZXR1cm4gYSB2YWx1ZSB3aGlsZSB0aGUgcmVxIHBhcmFtZXRlciBpcyBhIHN0cmluZyBvZiBhbiBKU09OIGFycmF5IHJlcHJlc2VudGluZ1xuICAgKiB0aGUgYXJndW1lbnRzIHBhc3NlZCBmcm9tIHRoZSBKYXZhU2NyaXB0IGZ1bmN0aW9uIGNhbGwuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBib3VuZCBmdW5jdGlvblxuICAgKiBAcGFyYW0gY2FsbGJhY2sgQSBjYWxsYmFjayB3aGljaCB0YWtlcyB0d28gc3RyaW5ncyBhcyBwYXJhbWV0ZXJzOiBgc2VxYFxuICAgKiBhbmQgYHJlcWAgYW5kIHRoZSBwYXNzZWQge0BsaW5rIGFyZ30gcG9pbnRlclxuICAgKiBAcGFyYW0gYXJnIEEgcG9pbnRlciB3aGljaCBpcyBnb2luZyB0byBiZSBwYXNzZWQgdG8gdGhlIGNhbGxiYWNrIG9uY2UgY2FsbGVkXG4gICAqL1xuICBiaW5kUmF3KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBjYWxsYmFjazogKFxuICAgICAgc2VxOiBzdHJpbmcsXG4gICAgICByZXE6IHN0cmluZyxcbiAgICAgIGFyZzogRGVuby5Qb2ludGVyVmFsdWUgfCBudWxsLFxuICAgICkgPT4gdm9pZCxcbiAgICBhcmc6IERlbm8uUG9pbnRlclZhbHVlIHwgbnVsbCA9IG51bGwsXG4gICkge1xuICAgIGNvbnN0IGNhbGxiYWNrUmVzb3VyY2UgPSBuZXcgRGVuby5VbnNhZmVDYWxsYmFjayhcbiAgICAgIHtcbiAgICAgICAgcGFyYW1ldGVyczogW1wicG9pbnRlclwiLCBcInBvaW50ZXJcIiwgXCJwb2ludGVyXCJdLFxuICAgICAgICByZXN1bHQ6IFwidm9pZFwiLFxuICAgICAgfSxcbiAgICAgIChcbiAgICAgICAgc2VxUHRyOiBEZW5vLlBvaW50ZXJWYWx1ZSxcbiAgICAgICAgcmVxUHRyOiBEZW5vLlBvaW50ZXJWYWx1ZSxcbiAgICAgICAgYXJnOiBEZW5vLlBvaW50ZXJWYWx1ZSB8IG51bGwsXG4gICAgICApID0+IHtcbiAgICAgICAgY29uc3Qgc2VxID0gc2VxUHRyXG4gICAgICAgICAgPyBuZXcgRGVuby5VbnNhZmVQb2ludGVyVmlldyhzZXFQdHIpLmdldENTdHJpbmcoKVxuICAgICAgICAgIDogXCJcIjtcbiAgICAgICAgY29uc3QgcmVxID0gcmVxUHRyXG4gICAgICAgICAgPyBuZXcgRGVuby5VbnNhZmVQb2ludGVyVmlldyhyZXFQdHIpLmdldENTdHJpbmcoKVxuICAgICAgICAgIDogXCJcIjtcbiAgICAgICAgY2FsbGJhY2soc2VxLCByZXEsIGFyZyk7XG4gICAgICB9LFxuICAgICk7XG4gICAgdGhpcy4jY2FsbGJhY2tzLnNldChuYW1lLCBjYWxsYmFja1Jlc291cmNlKTtcbiAgICBsaWIuc3ltYm9scy53ZWJ2aWV3X2JpbmQoXG4gICAgICB0aGlzLiNoYW5kbGUsXG4gICAgICBlbmNvZGVDU3RyaW5nKG5hbWUpLFxuICAgICAgY2FsbGJhY2tSZXNvdXJjZS5wb2ludGVyLFxuICAgICAgYXJnLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQmluZHMgYSBjYWxsYmFjayBzbyB0aGF0IGl0IHdpbGwgYXBwZWFyIGluIHRoZSB3ZWJ2aWV3IHdpdGggdGhlIGdpdmVuIG5hbWVcbiAgICogYXMgYSBnbG9iYWwgYXN5bmMgSmF2YVNjcmlwdCBmdW5jdGlvbi4gQ2FsbGJhY2sgYXJndW1lbnRzIGFyZSBhdXRvbWF0aWNhbGx5XG4gICAqIGNvbnZlcnRlZCBmcm9tIGpzb24gdG8gYXMgY2xvc2VseSBhcyBwb3NzaWJsZSBtYXRjaCB0aGUgYXJndW1lbnRzIGluIHRoZVxuICAgKiB3ZWJ2aWV3IGNvbnRleHQgYW5kIHRoZSBjYWxsYmFjayBhdXRvbWF0aWNhbGx5IGNvbnZlcnRzIGFuZCByZXR1cm5zIHRoZVxuICAgKiByZXR1cm4gdmFsdWUgdG8gdGhlIHdlYnZpZXcuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBib3VuZCBmdW5jdGlvblxuICAgKiBAcGFyYW0gY2FsbGJhY2sgQSBjYWxsYmFjayB3aGljaCBpcyBwYXNzZWQgdGhlIGFyZ3VtZW50cyBhcyBjYWxsZWQgZnJvbSB0aGVcbiAgICogd2VidmlldyBKYXZhU2NyaXB0IGVudmlyb25tZW50IGFuZCBvcHRpb25hbGx5IHJldHVybnMgYSB2YWx1ZSB0byB0aGVcbiAgICogd2VidmlldyBKYXZhU2NyaXB0IGNhbGxlclxuICAgKlxuICAgKiAjIyBFeGFtcGxlXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7IFdlYnZpZXcgfSBmcm9tIFwiLi4vbW9kLnRzXCI7XG4gICAqXG4gICAqIGNvbnN0IGh0bWwgPSBgXG4gICAqICAgPGh0bWw+XG4gICAqICAgPGJvZHk+XG4gICAqICAgICA8aDE+SGVsbG8gZnJvbSBkZW5vIHYke0Rlbm8udmVyc2lvbi5kZW5vfTwvaDE+XG4gICAqICAgICA8YnV0dG9uIG9uY2xpY2s9XCJwcmVzcygnSSB3YXMgcHJlc3NlZCEnLCAxMjMsIG5ldyBEYXRlKCkpLnRoZW4obG9nKTtcIj5cbiAgICogICAgICAgUHJlc3MgbWUhXG4gICAqICAgICA8L2J1dHRvbj5cbiAgICogICA8L2JvZHk+XG4gICAqICAgPC9odG1sPlxuICAgKiBgO1xuICAgKlxuICAgKiBjb25zdCB3ZWJ2aWV3ID0gbmV3IFdlYnZpZXcoKTtcbiAgICpcbiAgICogd2Vidmlldy5uYXZpZ2F0ZShgZGF0YTp0ZXh0L2h0bWwsJHtlbmNvZGVVUklDb21wb25lbnQoaHRtbCl9YCk7XG4gICAqXG4gICAqIGxldCBjb3VudGVyID0gMDtcbiAgICogLy8gQ3JlYXRlIGFuZCBiaW5kIGBwcmVzc2AgdG8gdGhlIHdlYnZpZXcgamF2YXNjcmlwdCBpbnN0YW5jZS5cbiAgICogLy8gVGhpcyBmdW5jdGlvbnMgaW4gYWRkaXRpb24gdG8gbG9nZ2luZyBpdHMgcGFyYW1ldGVycyBhbHNvIHJldHVybnNcbiAgICogLy8gYSB2YWx1ZSBmcm9tIGRlbm8gbGFuZCB0byB3ZWJ2aWV3IGxhbmQuXG4gICAqIHdlYnZpZXcuYmluZChcInByZXNzXCIsIChhLCBiLCBjKSA9PiB7XG4gICAqICAgY29uc29sZS5sb2coYSwgYiwgYyk7XG4gICAqXG4gICAqICAgcmV0dXJuIHsgdGltZXM6IGNvdW50ZXIrKyB9O1xuICAgKiB9KTtcbiAgICpcbiAgICogLy8gQmluZCB0aGUgYGxvZ2AgZnVuY3Rpb24gaW4gdGhlIHdlYnZpZXcgdG8gdGhlIHBhcmVudCBpbnN0YW5jZXMgYGNvbnNvbGUubG9nYFxuICAgKiB3ZWJ2aWV3LmJpbmQoXCJsb2dcIiwgKC4uLmFyZ3MpID0+IGNvbnNvbGUubG9nKC4uLmFyZ3MpKTtcbiAgICpcbiAgICogd2Vidmlldy5ydW4oKTtcbiAgICogYGBgXG4gICAqL1xuICBiaW5kKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGNhbGxiYWNrOiAoLi4uYXJnczogYW55KSA9PiBhbnksXG4gICkge1xuICAgIHRoaXMuYmluZFJhdyhuYW1lLCAoc2VxLCByZXEpID0+IHtcbiAgICAgIGNvbnN0IGFyZ3MgPSBKU09OLnBhcnNlKHJlcSk7XG4gICAgICBsZXQgcmVzdWx0O1xuICAgICAgbGV0IHN1Y2Nlc3M6IGJvb2xlYW47XG4gICAgICB0cnkge1xuICAgICAgICByZXN1bHQgPSBjYWxsYmFjayguLi5hcmdzKTtcbiAgICAgICAgc3VjY2VzcyA9IHRydWU7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVzdWx0ID0gZXJyO1xuICAgICAgICBzdWNjZXNzID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAocmVzdWx0IGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXN1bHQudGhlbigocmVzdWx0KSA9PlxuICAgICAgICAgIHRoaXMucmV0dXJuKHNlcSwgc3VjY2VzcyA/IDAgOiAxLCBKU09OLnN0cmluZ2lmeShyZXN1bHQpKVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXR1cm4oc2VxLCBzdWNjZXNzID8gMCA6IDEsIEpTT04uc3RyaW5naWZ5KHJlc3VsdCkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuYmluZHMgYSBwcmV2aW91c2x5IGJvdW5kIGZ1bmN0aW9uIGZyZWVpbmcgaXRzIHJlc291cmNlIGFuZCByZW1vdmluZyBpdFxuICAgKiBmcm9tIHRoZSB3ZWJ2aWV3IEphdmFTY3JpcHQgY29udGV4dC5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGJvdW5kIGZ1bmN0aW9uXG4gICAqL1xuICB1bmJpbmQobmFtZTogc3RyaW5nKSB7XG4gICAgbGliLnN5bWJvbHMud2Vidmlld191bmJpbmQodGhpcy4jaGFuZGxlLCBlbmNvZGVDU3RyaW5nKG5hbWUpKTtcbiAgICB0aGlzLiNjYWxsYmFja3MuZ2V0KG5hbWUpPy5jbG9zZSgpO1xuICAgIHRoaXMuI2NhbGxiYWNrcy5kZWxldGUobmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHZhbHVlIHRvIHRoZSB3ZWJ2aWV3IEphdmFTY3JpcHQgZW52aXJvbm1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSBzZXEgVGhlIHJlcXVlc3QgcG9pbnRlciBhcyBwcm92aWRlZCBieSB0aGUge0BsaW5rIFdlYnZpZXcuYmluZFJhd31cbiAgICogY2FsbGJhY2tcbiAgICogQHBhcmFtIHN0YXR1cyBJZiBzdGF0dXMgaXMgemVybyB0aGUgcmVzdWx0IGlzIGV4cGVjdGVkIHRvIGJlIGEgdmFsaWQgSlNPTlxuICAgKiByZXN1bHQgdmFsdWUgb3RoZXJ3aXNlIHRoZSByZXN1bHQgaXMgYW4gZXJyb3IgSlNPTiBvYmplY3RcbiAgICogQHBhcmFtIHJlc3VsdCBUaGUgc3RyaW5naWZpZWQgSlNPTiByZXNwb25zZVxuICAgKi9cbiAgcmV0dXJuKHNlcTogc3RyaW5nLCBzdGF0dXM6IG51bWJlciwgcmVzdWx0OiBzdHJpbmcpIHtcbiAgICBsaWIuc3ltYm9scy53ZWJ2aWV3X3JldHVybihcbiAgICAgIHRoaXMuI2hhbmRsZSxcbiAgICAgIGVuY29kZUNTdHJpbmcoc2VxKSxcbiAgICAgIHN0YXR1cyxcbiAgICAgIGVuY29kZUNTdHJpbmcocmVzdWx0KSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2YWx1YXRlcyBhcmJpdHJhcnkgSmF2YVNjcmlwdCBjb2RlLiBFdmFsdWF0aW9uIGhhcHBlbnMgYXN5bmNocm9ub3VzbHksXG4gICAqIGFsc28gdGhlIHJlc3VsdCBvZiB0aGUgZXhwcmVzc2lvbiBpcyBpZ25vcmVkLiBVc2VcbiAgICoge0BsaW5rIFdlYnZpZXcuYmluZCBiaW5kaW5nc30gaWYgeW91IHdhbnQgdG8gcmVjZWl2ZSBub3RpZmljYXRpb25zIGFib3V0XG4gICAqIHRoZSByZXN1bHRzIG9mIHRoZSBldmFsdWF0aW9uLlxuICAgKi9cbiAgZXZhbChzb3VyY2U6IHN0cmluZykge1xuICAgIGxpYi5zeW1ib2xzLndlYnZpZXdfZXZhbCh0aGlzLiNoYW5kbGUsIGVuY29kZUNTdHJpbmcoc291cmNlKSk7XG4gIH1cblxuICAvKipcbiAgICogSW5qZWN0cyBKYXZhU2NyaXB0IGNvZGUgYXQgdGhlIGluaXRpYWxpemF0aW9uIG9mIHRoZSBuZXcgcGFnZS4gRXZlcnkgdGltZVxuICAgKiB0aGUgd2VidmlldyB3aWxsIG9wZW4gYSB0aGUgbmV3IHBhZ2UgLSB0aGlzIGluaXRpYWxpemF0aW9uIGNvZGUgd2lsbCBiZVxuICAgKiBleGVjdXRlZC4gSXQgaXMgZ3VhcmFudGVlZCB0aGF0IGNvZGUgaXMgZXhlY3V0ZWQgYmVmb3JlIHdpbmRvdy5vbmxvYWQuXG4gICAqL1xuICBpbml0KHNvdXJjZTogc3RyaW5nKSB7XG4gICAgbGliLnN5bWJvbHMud2Vidmlld19pbml0KHRoaXMuI2hhbmRsZSwgZW5jb2RlQ1N0cmluZyhzb3VyY2UpKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsYUFBYSxFQUFFLFNBQVMsRUFBRSxHQUFHLFFBQVEsV0FBVztBQUt6RCxzQkFBc0IsR0FDdEIsT0FBTyxNQUFNLFdBQVc7RUFDdEIsc0NBQXNDLEdBQ3RDLE1BQU07RUFDTix3Q0FBd0MsR0FDeEMsS0FBSztFQUNMLHdDQUF3QyxHQUN4QyxLQUFLO0VBQ0wsNkNBQTZDLEdBQzdDLE9BQU87QUFDVCxFQUFXO0FBWVg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWlDQyxHQUNELE9BQU8sTUFBTTtFQUNYLENBQUEsTUFBTyxHQUFzQixLQUFLO0VBQ2xDLENBQUEsU0FBVSxHQU1OLElBQUksTUFBTTtFQUVkOzs7R0FHQyxHQUNELElBQUksZUFBa0M7SUFDcEMsT0FBTyxJQUFJLENBQUMsQ0FBQSxNQUFPO0VBQ3JCO0VBRUE7Ozs7OztHQU1DLEdBQ0QsSUFBSSxxQkFBd0M7SUFDMUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQSxNQUFPO0VBQ3BEO0VBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0JDLEdBQ0QsSUFBSSxLQUNGLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQVEsRUFDN0I7SUFDQSxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQSxNQUFPLEVBQUUsT0FBTyxR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
// denoCacheMetadata=2748166294026644397,10288938777710224089