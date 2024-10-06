import manifest from "./../deno.json" with {
  type: "json"
};
import { dlopen, download } from "jsr:@denosaurs/plug@^1.0.5";
const version = manifest.version;
const cache = Deno.env.get("PLUGIN_URL") === undefined ? "use" : "reloadAll";
const url = Deno.env.get("PLUGIN_URL") ?? `https://github.com/webview/webview_deno/releases/download/${version}/`;
const encoder = new TextEncoder();
/**
 * Encodes a string to a null terminated string
 *
 * @param value The intput string
 * @returns A null terminated `Uint8Array` of the input string
 */ export function encodeCString(value) {
  return encoder.encode(value + "\0");
}
/**
 * Checks for the existence of `./WebView2Loader.dll` for running on Windows.
 *
 * @returns true if it exists, false if it doesn't
 */ async function checkForWebView2Loader() {
  return await Deno.stat("./WebView2Loader.dll").then(()=>true, (e)=>e instanceof Deno.errors.NotFound ? false : true);
}
// make sure we don't preload twice
let preloaded = false;
/**
 * All active webview instances. This is internally used for automatically
 * destroying all instances once {@link unload} is called.
 */ export const instances = [];
/**
 * Loads the `./WebView2Loader.dll` for running on Windows. Removes old version
 * if it already existed, and only runs once. Should be run on the main thread
 * so that the `unload` gets hooked in properly, otherwise make sure `unload`
 * gets called during the `window.onunload` event (after all windows are
 * closed).
 *
 * Does not need to be run on non-windows platforms, but that is subject to change.
 */ export async function preload() {
  if (preloaded) return;
  if (Deno.build.os === "windows") {
    if (await checkForWebView2Loader()) {
      await Deno.remove("./WebView2Loader.dll");
    }
    const webview2loader = await download({
      url: `${url}/WebView2Loader.dll`,
      cache
    });
    await Deno.copyFile(webview2loader, "./WebView2Loader.dll");
    self.addEventListener("unload", unload);
  }
  preloaded = true;
}
/**
 * Unload the library and destroy all webview instances. Should only be run
 * once all windows are closed. If `preload` was called in the main thread,
 * this will automatically be called during the `window.onunload` event;
 * otherwise, you may have to call this manually.
 */ export function unload() {
  for (const instance of instances){
    instance.destroy();
  }
  lib.close();
  if (Deno.build.os === "windows") {
    Deno.removeSync("./WebView2Loader.dll");
  }
}
// Automatically run the preload if we're on windows and on the main thread.
if (Deno.build.os === "windows") {
  if (self["window"]) {
    await preload();
  } else if (!await checkForWebView2Loader()) {
    throw new Error("WebView2Loader.dll does not exist! Make sure to run preload() from the main thread.");
  }
}
export const lib = await dlopen({
  name: "webview",
  url,
  cache,
  suffixes: {
    darwin: `.${Deno.build.arch}`
  }
}, {
  "webview_create": {
    parameters: [
      "i32",
      "pointer"
    ],
    result: "pointer"
  },
  "webview_destroy": {
    parameters: [
      "pointer"
    ],
    result: "void"
  },
  "webview_run": {
    parameters: [
      "pointer"
    ],
    result: "void"
  },
  "webview_terminate": {
    parameters: [
      "pointer"
    ],
    result: "void"
  },
  // "webview_dispatch": {
  //   parameters: ["pointer", { function: { parameters: ["pointer", "pointer"], result: "void" } }, "pointer"],
  //   result: "void",
  // },
  "webview_get_window": {
    parameters: [
      "pointer"
    ],
    result: "pointer"
  },
  "webview_set_title": {
    parameters: [
      "pointer",
      "buffer"
    ],
    result: "void"
  },
  "webview_set_size": {
    parameters: [
      "pointer",
      "i32",
      "i32",
      "i32"
    ],
    result: "void"
  },
  "webview_navigate": {
    parameters: [
      "pointer",
      "buffer"
    ],
    result: "void"
  },
  "webview_set_html": {
    parameters: [
      "pointer",
      "pointer"
    ],
    result: "void"
  },
  "webview_init": {
    parameters: [
      "pointer",
      "buffer"
    ],
    result: "void"
  },
  "webview_eval": {
    parameters: [
      "pointer",
      "buffer"
    ],
    result: "void"
  },
  "webview_bind": {
    parameters: [
      "pointer",
      "buffer",
      "function",
      "pointer"
    ],
    result: "void"
  },
  "webview_unbind": {
    parameters: [
      "pointer",
      "buffer"
    ],
    result: "void"
  },
  "webview_return": {
    parameters: [
      "pointer",
      "buffer",
      "i32",
      "buffer"
    ],
    result: "void"
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0B3ZWJ2aWV3L3dlYnZpZXcvMC44LjAvc3JjL2ZmaS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbWFuaWZlc3QgZnJvbSBcIi4vLi4vZGVuby5qc29uXCIgd2l0aCB7IHR5cGU6IFwianNvblwiIH07XG5cbmltcG9ydCB7IGRsb3BlbiwgZG93bmxvYWQgfSBmcm9tIFwianNyOkBkZW5vc2F1cnMvcGx1Z0BeMS4wLjVcIjtcbmltcG9ydCB7IFdlYnZpZXcgfSBmcm9tIFwiLi93ZWJ2aWV3LnRzXCI7XG5cbmNvbnN0IHZlcnNpb24gPSBtYW5pZmVzdC52ZXJzaW9uO1xuY29uc3QgY2FjaGUgPSBEZW5vLmVudi5nZXQoXCJQTFVHSU5fVVJMXCIpID09PSB1bmRlZmluZWQgPyBcInVzZVwiIDogXCJyZWxvYWRBbGxcIjtcbmNvbnN0IHVybCA9IERlbm8uZW52LmdldChcIlBMVUdJTl9VUkxcIikgPz9cbiAgYGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJ2aWV3L3dlYnZpZXdfZGVuby9yZWxlYXNlcy9kb3dubG9hZC8ke3ZlcnNpb259L2A7XG5cbmNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcblxuLyoqXG4gKiBFbmNvZGVzIGEgc3RyaW5nIHRvIGEgbnVsbCB0ZXJtaW5hdGVkIHN0cmluZ1xuICpcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgaW50cHV0IHN0cmluZ1xuICogQHJldHVybnMgQSBudWxsIHRlcm1pbmF0ZWQgYFVpbnQ4QXJyYXlgIG9mIHRoZSBpbnB1dCBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZUNTdHJpbmcodmFsdWU6IHN0cmluZykge1xuICByZXR1cm4gZW5jb2Rlci5lbmNvZGUodmFsdWUgKyBcIlxcMFwiKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgZm9yIHRoZSBleGlzdGVuY2Ugb2YgYC4vV2ViVmlldzJMb2FkZXIuZGxsYCBmb3IgcnVubmluZyBvbiBXaW5kb3dzLlxuICpcbiAqIEByZXR1cm5zIHRydWUgaWYgaXQgZXhpc3RzLCBmYWxzZSBpZiBpdCBkb2Vzbid0XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrRm9yV2ViVmlldzJMb2FkZXIoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHJldHVybiBhd2FpdCBEZW5vLnN0YXQoXCIuL1dlYlZpZXcyTG9hZGVyLmRsbFwiKS50aGVuKFxuICAgICgpID0+IHRydWUsXG4gICAgKGUpID0+IGUgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCA/IGZhbHNlIDogdHJ1ZSxcbiAgKTtcbn1cblxuLy8gbWFrZSBzdXJlIHdlIGRvbid0IHByZWxvYWQgdHdpY2VcbmxldCBwcmVsb2FkZWQgPSBmYWxzZTtcblxuLyoqXG4gKiBBbGwgYWN0aXZlIHdlYnZpZXcgaW5zdGFuY2VzLiBUaGlzIGlzIGludGVybmFsbHkgdXNlZCBmb3IgYXV0b21hdGljYWxseVxuICogZGVzdHJveWluZyBhbGwgaW5zdGFuY2VzIG9uY2Uge0BsaW5rIHVubG9hZH0gaXMgY2FsbGVkLlxuICovXG5leHBvcnQgY29uc3QgaW5zdGFuY2VzOiBXZWJ2aWV3W10gPSBbXTtcblxuLyoqXG4gKiBMb2FkcyB0aGUgYC4vV2ViVmlldzJMb2FkZXIuZGxsYCBmb3IgcnVubmluZyBvbiBXaW5kb3dzLiBSZW1vdmVzIG9sZCB2ZXJzaW9uXG4gKiBpZiBpdCBhbHJlYWR5IGV4aXN0ZWQsIGFuZCBvbmx5IHJ1bnMgb25jZS4gU2hvdWxkIGJlIHJ1biBvbiB0aGUgbWFpbiB0aHJlYWRcbiAqIHNvIHRoYXQgdGhlIGB1bmxvYWRgIGdldHMgaG9va2VkIGluIHByb3Blcmx5LCBvdGhlcndpc2UgbWFrZSBzdXJlIGB1bmxvYWRgXG4gKiBnZXRzIGNhbGxlZCBkdXJpbmcgdGhlIGB3aW5kb3cub251bmxvYWRgIGV2ZW50IChhZnRlciBhbGwgd2luZG93cyBhcmVcbiAqIGNsb3NlZCkuXG4gKlxuICogRG9lcyBub3QgbmVlZCB0byBiZSBydW4gb24gbm9uLXdpbmRvd3MgcGxhdGZvcm1zLCBidXQgdGhhdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByZWxvYWQoKSB7XG4gIGlmIChwcmVsb2FkZWQpIHJldHVybjtcblxuICBpZiAoRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCIpIHtcbiAgICBpZiAoYXdhaXQgY2hlY2tGb3JXZWJWaWV3MkxvYWRlcigpKSB7XG4gICAgICBhd2FpdCBEZW5vLnJlbW92ZShcIi4vV2ViVmlldzJMb2FkZXIuZGxsXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHdlYnZpZXcybG9hZGVyID0gYXdhaXQgZG93bmxvYWQoe1xuICAgICAgdXJsOiBgJHt1cmx9L1dlYlZpZXcyTG9hZGVyLmRsbGAsXG4gICAgICBjYWNoZSxcbiAgICB9KTtcbiAgICBhd2FpdCBEZW5vLmNvcHlGaWxlKHdlYnZpZXcybG9hZGVyLCBcIi4vV2ViVmlldzJMb2FkZXIuZGxsXCIpO1xuXG4gICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKFwidW5sb2FkXCIsIHVubG9hZCk7XG4gIH1cblxuICBwcmVsb2FkZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIFVubG9hZCB0aGUgbGlicmFyeSBhbmQgZGVzdHJveSBhbGwgd2VidmlldyBpbnN0YW5jZXMuIFNob3VsZCBvbmx5IGJlIHJ1blxuICogb25jZSBhbGwgd2luZG93cyBhcmUgY2xvc2VkLiBJZiBgcHJlbG9hZGAgd2FzIGNhbGxlZCBpbiB0aGUgbWFpbiB0aHJlYWQsXG4gKiB0aGlzIHdpbGwgYXV0b21hdGljYWxseSBiZSBjYWxsZWQgZHVyaW5nIHRoZSBgd2luZG93Lm9udW5sb2FkYCBldmVudDtcbiAqIG90aGVyd2lzZSwgeW91IG1heSBoYXZlIHRvIGNhbGwgdGhpcyBtYW51YWxseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVubG9hZCgpIHtcbiAgZm9yIChjb25zdCBpbnN0YW5jZSBvZiBpbnN0YW5jZXMpIHtcbiAgICBpbnN0YW5jZS5kZXN0cm95KCk7XG4gIH1cbiAgbGliLmNsb3NlKCk7XG4gIGlmIChEZW5vLmJ1aWxkLm9zID09PSBcIndpbmRvd3NcIikge1xuICAgIERlbm8ucmVtb3ZlU3luYyhcIi4vV2ViVmlldzJMb2FkZXIuZGxsXCIpO1xuICB9XG59XG5cbi8vIEF1dG9tYXRpY2FsbHkgcnVuIHRoZSBwcmVsb2FkIGlmIHdlJ3JlIG9uIHdpbmRvd3MgYW5kIG9uIHRoZSBtYWluIHRocmVhZC5cbmlmIChEZW5vLmJ1aWxkLm9zID09PSBcIndpbmRvd3NcIikge1xuICBpZiAoKHNlbGYgYXMgbmV2ZXIpW1wid2luZG93XCJdKSB7XG4gICAgYXdhaXQgcHJlbG9hZCgpO1xuICB9IGVsc2UgaWYgKCFhd2FpdCBjaGVja0ZvcldlYlZpZXcyTG9hZGVyKCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBcIldlYlZpZXcyTG9hZGVyLmRsbCBkb2VzIG5vdCBleGlzdCEgTWFrZSBzdXJlIHRvIHJ1biBwcmVsb2FkKCkgZnJvbSB0aGUgbWFpbiB0aHJlYWQuXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgbGliID0gYXdhaXQgZGxvcGVuKFxuICB7XG4gICAgbmFtZTogXCJ3ZWJ2aWV3XCIsXG4gICAgdXJsLFxuICAgIGNhY2hlLFxuICAgIHN1ZmZpeGVzOiB7XG4gICAgICBkYXJ3aW46IGAuJHtEZW5vLmJ1aWxkLmFyY2h9YCxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgXCJ3ZWJ2aWV3X2NyZWF0ZVwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJpMzJcIiwgXCJwb2ludGVyXCJdLFxuICAgICAgcmVzdWx0OiBcInBvaW50ZXJcIixcbiAgICB9LFxuICAgIFwid2Vidmlld19kZXN0cm95XCI6IHtcbiAgICAgIHBhcmFtZXRlcnM6IFtcInBvaW50ZXJcIl0sXG4gICAgICByZXN1bHQ6IFwidm9pZFwiLFxuICAgIH0sXG4gICAgXCJ3ZWJ2aWV3X3J1blwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICAgIFwid2Vidmlld190ZXJtaW5hdGVcIjoge1xuICAgICAgcGFyYW1ldGVyczogW1wicG9pbnRlclwiXSxcbiAgICAgIHJlc3VsdDogXCJ2b2lkXCIsXG4gICAgfSxcbiAgICAvLyBcIndlYnZpZXdfZGlzcGF0Y2hcIjoge1xuICAgIC8vICAgcGFyYW1ldGVyczogW1wicG9pbnRlclwiLCB7IGZ1bmN0aW9uOiB7IHBhcmFtZXRlcnM6IFtcInBvaW50ZXJcIiwgXCJwb2ludGVyXCJdLCByZXN1bHQ6IFwidm9pZFwiIH0gfSwgXCJwb2ludGVyXCJdLFxuICAgIC8vICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICAvLyB9LFxuICAgIFwid2Vidmlld19nZXRfd2luZG93XCI6IHtcbiAgICAgIHBhcmFtZXRlcnM6IFtcInBvaW50ZXJcIl0sXG4gICAgICByZXN1bHQ6IFwicG9pbnRlclwiLFxuICAgIH0sXG4gICAgXCJ3ZWJ2aWV3X3NldF90aXRsZVwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwiYnVmZmVyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICAgIFwid2Vidmlld19zZXRfc2l6ZVwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICAgIFwid2Vidmlld19uYXZpZ2F0ZVwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwiYnVmZmVyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICAgIFwid2Vidmlld19zZXRfaHRtbFwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwicG9pbnRlclwiXSxcbiAgICAgIHJlc3VsdDogXCJ2b2lkXCIsXG4gICAgfSxcbiAgICBcIndlYnZpZXdfaW5pdFwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwiYnVmZmVyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICAgIFwid2Vidmlld19ldmFsXCI6IHtcbiAgICAgIHBhcmFtZXRlcnM6IFtcInBvaW50ZXJcIiwgXCJidWZmZXJcIl0sXG4gICAgICByZXN1bHQ6IFwidm9pZFwiLFxuICAgIH0sXG4gICAgXCJ3ZWJ2aWV3X2JpbmRcIjoge1xuICAgICAgcGFyYW1ldGVyczogW1wicG9pbnRlclwiLCBcImJ1ZmZlclwiLCBcImZ1bmN0aW9uXCIsIFwicG9pbnRlclwiXSxcbiAgICAgIHJlc3VsdDogXCJ2b2lkXCIsXG4gICAgfSxcbiAgICBcIndlYnZpZXdfdW5iaW5kXCI6IHtcbiAgICAgIHBhcmFtZXRlcnM6IFtcInBvaW50ZXJcIiwgXCJidWZmZXJcIl0sXG4gICAgICByZXN1bHQ6IFwidm9pZFwiLFxuICAgIH0sXG4gICAgXCJ3ZWJ2aWV3X3JldHVyblwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwiYnVmZmVyXCIsIFwiaTMyXCIsIFwiYnVmZmVyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICB9IGFzIGNvbnN0LFxuKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLGNBQWMsc0JBQXNCO0VBQUUsTUFBTTtBQUFPLEVBQUU7QUFFNUQsU0FBUyxNQUFNLEVBQUUsUUFBUSxRQUFRLDZCQUE2QjtBQUc5RCxNQUFNLFVBQVUsU0FBUyxPQUFPO0FBQ2hDLE1BQU0sUUFBUSxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLFlBQVksUUFBUTtBQUNqRSxNQUFNLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLGlCQUN2QixDQUFDLDBEQUEwRCxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBRXpFLE1BQU0sVUFBVSxJQUFJO0FBRXBCOzs7OztDQUtDLEdBQ0QsT0FBTyxTQUFTLGNBQWMsS0FBYTtFQUN6QyxPQUFP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
// denoCacheMetadata=1489437649371386593,4510464963927429211