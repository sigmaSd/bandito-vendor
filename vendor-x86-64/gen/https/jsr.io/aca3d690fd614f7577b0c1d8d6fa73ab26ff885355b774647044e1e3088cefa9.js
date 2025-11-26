import manifest from "../deno.json" with {
  type: "json"
};
import { dlopen, download } from "jsr:@denosaurs/plug@^1.0";
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
  if (!await checkForWebView2Loader()) {
    if (self === globalThis) {
      await preload();
    } else {
      throw new Error("WebView2Loader.dll does not exist! Make sure to run preload() from the main thread.");
    }
  }
}
export const lib = await dlopen({
  name: "webview",
  url,
  cache,
  suffixes: {
    linux: `.${Deno.build.arch}`,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0B3ZWJ2aWV3L3dlYnZpZXcvMC45LjAvc3JjL2ZmaS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbWFuaWZlc3QgZnJvbSBcIi4uL2Rlbm8uanNvblwiIHdpdGggeyB0eXBlOiBcImpzb25cIiB9O1xuXG5pbXBvcnQgeyBkbG9wZW4sIGRvd25sb2FkIH0gZnJvbSBcImpzcjpAZGVub3NhdXJzL3BsdWdAXjEuMFwiO1xuaW1wb3J0IHR5cGUgeyBXZWJ2aWV3IH0gZnJvbSBcIi4vd2Vidmlldy50c1wiO1xuXG5jb25zdCB2ZXJzaW9uID0gbWFuaWZlc3QudmVyc2lvbjtcbmNvbnN0IGNhY2hlID0gRGVuby5lbnYuZ2V0KFwiUExVR0lOX1VSTFwiKSA9PT0gdW5kZWZpbmVkID8gXCJ1c2VcIiA6IFwicmVsb2FkQWxsXCI7XG5jb25zdCB1cmwgPSBEZW5vLmVudi5nZXQoXCJQTFVHSU5fVVJMXCIpID8/XG4gIGBodHRwczovL2dpdGh1Yi5jb20vd2Vidmlldy93ZWJ2aWV3X2Rlbm8vcmVsZWFzZXMvZG93bmxvYWQvJHt2ZXJzaW9ufS9gO1xuXG5jb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5cbi8qKlxuICogRW5jb2RlcyBhIHN0cmluZyB0byBhIG51bGwgdGVybWluYXRlZCBzdHJpbmdcbiAqXG4gKiBAcGFyYW0gdmFsdWUgVGhlIGludHB1dCBzdHJpbmdcbiAqIEByZXR1cm5zIEEgbnVsbCB0ZXJtaW5hdGVkIGBVaW50OEFycmF5YCBvZiB0aGUgaW5wdXQgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVDU3RyaW5nKHZhbHVlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIGVuY29kZXIuZW5jb2RlKHZhbHVlICsgXCJcXDBcIik7XG59XG5cbi8qKlxuICogQ2hlY2tzIGZvciB0aGUgZXhpc3RlbmNlIG9mIGAuL1dlYlZpZXcyTG9hZGVyLmRsbGAgZm9yIHJ1bm5pbmcgb24gV2luZG93cy5cbiAqXG4gKiBAcmV0dXJucyB0cnVlIGlmIGl0IGV4aXN0cywgZmFsc2UgaWYgaXQgZG9lc24ndFxuICovXG5hc3luYyBmdW5jdGlvbiBjaGVja0ZvcldlYlZpZXcyTG9hZGVyKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICByZXR1cm4gYXdhaXQgRGVuby5zdGF0KFwiLi9XZWJWaWV3MkxvYWRlci5kbGxcIikudGhlbihcbiAgICAoKSA9PiB0cnVlLFxuICAgIChlKSA9PiBlIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQgPyBmYWxzZSA6IHRydWUsXG4gICk7XG59XG5cbi8vIG1ha2Ugc3VyZSB3ZSBkb24ndCBwcmVsb2FkIHR3aWNlXG5sZXQgcHJlbG9hZGVkID0gZmFsc2U7XG5cbi8qKlxuICogQWxsIGFjdGl2ZSB3ZWJ2aWV3IGluc3RhbmNlcy4gVGhpcyBpcyBpbnRlcm5hbGx5IHVzZWQgZm9yIGF1dG9tYXRpY2FsbHlcbiAqIGRlc3Ryb3lpbmcgYWxsIGluc3RhbmNlcyBvbmNlIHtAbGluayB1bmxvYWR9IGlzIGNhbGxlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IGluc3RhbmNlczogV2Vidmlld1tdID0gW107XG5cbi8qKlxuICogTG9hZHMgdGhlIGAuL1dlYlZpZXcyTG9hZGVyLmRsbGAgZm9yIHJ1bm5pbmcgb24gV2luZG93cy4gUmVtb3ZlcyBvbGQgdmVyc2lvblxuICogaWYgaXQgYWxyZWFkeSBleGlzdGVkLCBhbmQgb25seSBydW5zIG9uY2UuIFNob3VsZCBiZSBydW4gb24gdGhlIG1haW4gdGhyZWFkXG4gKiBzbyB0aGF0IHRoZSBgdW5sb2FkYCBnZXRzIGhvb2tlZCBpbiBwcm9wZXJseSwgb3RoZXJ3aXNlIG1ha2Ugc3VyZSBgdW5sb2FkYFxuICogZ2V0cyBjYWxsZWQgZHVyaW5nIHRoZSBgd2luZG93Lm9udW5sb2FkYCBldmVudCAoYWZ0ZXIgYWxsIHdpbmRvd3MgYXJlXG4gKiBjbG9zZWQpLlxuICpcbiAqIERvZXMgbm90IG5lZWQgdG8gYmUgcnVuIG9uIG5vbi13aW5kb3dzIHBsYXRmb3JtcywgYnV0IHRoYXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcmVsb2FkKCkge1xuICBpZiAocHJlbG9hZGVkKSByZXR1cm47XG5cbiAgaWYgKERlbm8uYnVpbGQub3MgPT09IFwid2luZG93c1wiKSB7XG4gICAgaWYgKGF3YWl0IGNoZWNrRm9yV2ViVmlldzJMb2FkZXIoKSkge1xuICAgICAgYXdhaXQgRGVuby5yZW1vdmUoXCIuL1dlYlZpZXcyTG9hZGVyLmRsbFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB3ZWJ2aWV3MmxvYWRlciA9IGF3YWl0IGRvd25sb2FkKHtcbiAgICAgIHVybDogYCR7dXJsfS9XZWJWaWV3MkxvYWRlci5kbGxgLFxuICAgICAgY2FjaGUsXG4gICAgfSk7XG4gICAgYXdhaXQgRGVuby5jb3B5RmlsZSh3ZWJ2aWV3MmxvYWRlciwgXCIuL1dlYlZpZXcyTG9hZGVyLmRsbFwiKTtcblxuICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcihcInVubG9hZFwiLCB1bmxvYWQpO1xuICB9XG5cbiAgcHJlbG9hZGVkID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBVbmxvYWQgdGhlIGxpYnJhcnkgYW5kIGRlc3Ryb3kgYWxsIHdlYnZpZXcgaW5zdGFuY2VzLiBTaG91bGQgb25seSBiZSBydW5cbiAqIG9uY2UgYWxsIHdpbmRvd3MgYXJlIGNsb3NlZC4gSWYgYHByZWxvYWRgIHdhcyBjYWxsZWQgaW4gdGhlIG1haW4gdGhyZWFkLFxuICogdGhpcyB3aWxsIGF1dG9tYXRpY2FsbHkgYmUgY2FsbGVkIGR1cmluZyB0aGUgYHdpbmRvdy5vbnVubG9hZGAgZXZlbnQ7XG4gKiBvdGhlcndpc2UsIHlvdSBtYXkgaGF2ZSB0byBjYWxsIHRoaXMgbWFudWFsbHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bmxvYWQoKSB7XG4gIGZvciAoY29uc3QgaW5zdGFuY2Ugb2YgaW5zdGFuY2VzKSB7XG4gICAgaW5zdGFuY2UuZGVzdHJveSgpO1xuICB9XG4gIGxpYi5jbG9zZSgpO1xuICBpZiAoRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCIpIHtcbiAgICBEZW5vLnJlbW92ZVN5bmMoXCIuL1dlYlZpZXcyTG9hZGVyLmRsbFwiKTtcbiAgfVxufVxuXG4vLyBBdXRvbWF0aWNhbGx5IHJ1biB0aGUgcHJlbG9hZCBpZiB3ZSdyZSBvbiB3aW5kb3dzIGFuZCBvbiB0aGUgbWFpbiB0aHJlYWQuXG5pZiAoRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCIpIHtcbiAgaWYgKCFhd2FpdCBjaGVja0ZvcldlYlZpZXcyTG9hZGVyKCkpIHtcbiAgICBpZiAoc2VsZiA9PT0gZ2xvYmFsVGhpcykge1xuICAgICAgYXdhaXQgcHJlbG9hZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiV2ViVmlldzJMb2FkZXIuZGxsIGRvZXMgbm90IGV4aXN0ISBNYWtlIHN1cmUgdG8gcnVuIHByZWxvYWQoKSBmcm9tIHRoZSBtYWluIHRocmVhZC5cIixcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBsaWIgPSBhd2FpdCBkbG9wZW4oXG4gIHtcbiAgICBuYW1lOiBcIndlYnZpZXdcIixcbiAgICB1cmwsXG4gICAgY2FjaGUsXG4gICAgc3VmZml4ZXM6IHtcbiAgICAgIGxpbnV4OiBgLiR7RGVuby5idWlsZC5hcmNofWAsXG4gICAgICBkYXJ3aW46IGAuJHtEZW5vLmJ1aWxkLmFyY2h9YCxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgXCJ3ZWJ2aWV3X2NyZWF0ZVwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJpMzJcIiwgXCJwb2ludGVyXCJdLFxuICAgICAgcmVzdWx0OiBcInBvaW50ZXJcIixcbiAgICB9LFxuICAgIFwid2Vidmlld19kZXN0cm95XCI6IHtcbiAgICAgIHBhcmFtZXRlcnM6IFtcInBvaW50ZXJcIl0sXG4gICAgICByZXN1bHQ6IFwidm9pZFwiLFxuICAgIH0sXG4gICAgXCJ3ZWJ2aWV3X3J1blwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICAgIFwid2Vidmlld190ZXJtaW5hdGVcIjoge1xuICAgICAgcGFyYW1ldGVyczogW1wicG9pbnRlclwiXSxcbiAgICAgIHJlc3VsdDogXCJ2b2lkXCIsXG4gICAgfSxcbiAgICAvLyBcIndlYnZpZXdfZGlzcGF0Y2hcIjoge1xuICAgIC8vICAgcGFyYW1ldGVyczogW1wicG9pbnRlclwiLCB7IGZ1bmN0aW9uOiB7IHBhcmFtZXRlcnM6IFtcInBvaW50ZXJcIiwgXCJwb2ludGVyXCJdLCByZXN1bHQ6IFwidm9pZFwiIH0gfSwgXCJwb2ludGVyXCJdLFxuICAgIC8vICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICAvLyB9LFxuICAgIFwid2Vidmlld19nZXRfd2luZG93XCI6IHtcbiAgICAgIHBhcmFtZXRlcnM6IFtcInBvaW50ZXJcIl0sXG4gICAgICByZXN1bHQ6IFwicG9pbnRlclwiLFxuICAgIH0sXG4gICAgXCJ3ZWJ2aWV3X3NldF90aXRsZVwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwiYnVmZmVyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICAgIFwid2Vidmlld19zZXRfc2l6ZVwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICAgIFwid2Vidmlld19uYXZpZ2F0ZVwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwiYnVmZmVyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICAgIFwid2Vidmlld19zZXRfaHRtbFwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwicG9pbnRlclwiXSxcbiAgICAgIHJlc3VsdDogXCJ2b2lkXCIsXG4gICAgfSxcbiAgICBcIndlYnZpZXdfaW5pdFwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwiYnVmZmVyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICAgIFwid2Vidmlld19ldmFsXCI6IHtcbiAgICAgIHBhcmFtZXRlcnM6IFtcInBvaW50ZXJcIiwgXCJidWZmZXJcIl0sXG4gICAgICByZXN1bHQ6IFwidm9pZFwiLFxuICAgIH0sXG4gICAgXCJ3ZWJ2aWV3X2JpbmRcIjoge1xuICAgICAgcGFyYW1ldGVyczogW1wicG9pbnRlclwiLCBcImJ1ZmZlclwiLCBcImZ1bmN0aW9uXCIsIFwicG9pbnRlclwiXSxcbiAgICAgIHJlc3VsdDogXCJ2b2lkXCIsXG4gICAgfSxcbiAgICBcIndlYnZpZXdfdW5iaW5kXCI6IHtcbiAgICAgIHBhcmFtZXRlcnM6IFtcInBvaW50ZXJcIiwgXCJidWZmZXJcIl0sXG4gICAgICByZXN1bHQ6IFwidm9pZFwiLFxuICAgIH0sXG4gICAgXCJ3ZWJ2aWV3X3JldHVyblwiOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbXCJwb2ludGVyXCIsIFwiYnVmZmVyXCIsIFwiaTMyXCIsIFwiYnVmZmVyXCJdLFxuICAgICAgcmVzdWx0OiBcInZvaWRcIixcbiAgICB9LFxuICB9IGFzIGNvbnN0LFxuKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLGNBQWMsb0JBQW9CO0VBQUUsTUFBTTtBQUFPLEVBQUU7QUFFMUQsU0FBUyxNQUFNLEVBQUUsUUFBUSxRQUFRLDJCQUEyQjtBQUc1RCxNQUFNLFVBQVUsU0FBUyxPQUFPO0FBQ2hDLE1BQU0sUUFBUSxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLFlBQVksUUFBUTtBQUNqRSxNQUFNLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLGlCQUN2QixDQUFDLDBEQUEwRCxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBRXpFLE1BQU0sVUFBVSxJ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
// denoCacheMetadata=17381509259454201661,16640686015110655676