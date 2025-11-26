import { denoPlugins, fromFileUrl, regexpEscape, relative } from "./deps.ts";
let esbuild;
export async function initializeEsbuild() {
  esbuild = // deno-lint-ignore no-deprecated-deno-api
  Deno.run === undefined || Deno.env.get("FRESH_ESBUILD_LOADER") === "portable" ? await import("https://deno.land/x/esbuild@v0.20.2/wasm.js") : await import("https://deno.land/x/esbuild@v0.20.2/mod.js");
  const esbuildWasmURL = new URL("./esbuild_v0.20.2.wasm", import.meta.url).href;
  // deno-lint-ignore no-deprecated-deno-api
  if (Deno.run === undefined) {
    await esbuild.initialize({
      wasmURL: esbuildWasmURL,
      worker: false
    });
  } else {
    await esbuild.initialize({});
  }
  return esbuild;
}
export class EsbuildBuilder {
  #options;
  constructor(options){
    this.#options = options;
  }
  async build() {
    const opts = this.#options;
    // Lazily initialize esbuild
    const esbuild = await initializeEsbuild();
    try {
      const absWorkingDir = opts.absoluteWorkingDir;
      // In dev-mode we skip identifier minification to be able to show proper
      // component names in Preact DevTools instead of single characters.
      const minifyOptions = opts.dev ? {
        minifyIdentifiers: false,
        minifySyntax: true,
        minifyWhitespace: true
      } : {
        minify: true
      };
      const bundle = await esbuild.build({
        entryPoints: opts.entrypoints,
        platform: "browser",
        target: this.#options.target,
        format: "esm",
        bundle: true,
        splitting: true,
        treeShaking: true,
        sourcemap: opts.dev ? "linked" : false,
        ...minifyOptions,
        jsx: opts.jsx === "react" ? "transform" : opts.jsx === "react-native" || opts.jsx === "preserve" ? "preserve" : !opts.jsxImportSource ? "transform" : "automatic",
        jsxImportSource: opts.jsxImportSource ?? "preact",
        absWorkingDir,
        outdir: ".",
        write: false,
        metafile: true,
        plugins: [
          devClientUrlPlugin(opts.basePath),
          buildIdPlugin(opts.buildID),
          ...denoPlugins({
            configPath: opts.configPath
          })
        ]
      });
      const files = new Map();
      const dependencies = new Map();
      if (bundle.outputFiles) {
        for (const file of bundle.outputFiles){
          const path = relative(absWorkingDir, file.path);
          files.set(path, file.contents);
        }
      }
      files.set("metafile.json", new TextEncoder().encode(JSON.stringify(bundle.metafile)));
      if (bundle.metafile) {
        const metaOutputs = new Map(Object.entries(bundle.metafile.outputs));
        for (const [path, entry] of metaOutputs.entries()){
          const imports = entry.imports.filter(({ kind })=>kind === "import-statement").map(({ path })=>path);
          dependencies.set(path, imports);
        }
      }
      return new EsbuildSnapshot(files, dependencies);
    } finally{
      await esbuild.stop();
    }
  }
}
function devClientUrlPlugin(basePath) {
  return {
    name: "dev-client-url",
    setup (build) {
      build.onLoad({
        filter: /client\.ts$/,
        namespace: "file"
      }, async (args)=>{
        // Load the original script
        const contents = await Deno.readTextFile(args.path);
        // Replace the URL
        const modifiedContents = contents.replace("/_frsh/alive", `${basePath}/_frsh/alive`);
        return {
          contents: modifiedContents,
          loader: "ts"
        };
      });
    }
  };
}
function buildIdPlugin(buildId) {
  const file = import.meta.resolve("../runtime/build_id.ts");
  const url = new URL(file);
  let options;
  if (url.protocol === "file:") {
    const path = fromFileUrl(url);
    const filter = new RegExp(`^${regexpEscape(path)}$`);
    options = {
      filter,
      namespace: "file"
    };
  } else {
    const namespace = url.protocol.slice(0, -1);
    const path = url.href.slice(namespace.length + 1);
    const filter = new RegExp(`^${regexpEscape(path)}$`);
    options = {
      filter,
      namespace
    };
  }
  return {
    name: "fresh-build-id",
    setup (build) {
      build.onLoad(options, ()=>({
          contents: `export const BUILD_ID = "${buildId}";`
        }));
    }
  };
}
export class EsbuildSnapshot {
  #files;
  #dependencies;
  constructor(files, dependencies){
    this.#files = files;
    this.#dependencies = dependencies;
  }
  get paths() {
    return Array.from(this.#files.keys());
  }
  read(path) {
    return this.#files.get(path) ?? null;
  }
  dependencies(path) {
    return this.#dependencies.get(path) ?? [];
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL2J1aWxkL2VzYnVpbGQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgdHlwZSBCdWlsZE9wdGlvbnMsXG4gIHR5cGUgT25Mb2FkT3B0aW9ucyxcbiAgdHlwZSBQbHVnaW4sXG59IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L2VzYnVpbGRAdjAuMjAuMi9tb2QuanNcIjtcbmltcG9ydCB7IGRlbm9QbHVnaW5zLCBmcm9tRmlsZVVybCwgcmVnZXhwRXNjYXBlLCByZWxhdGl2ZSB9IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IEJ1aWxkZXIsIEJ1aWxkU25hcHNob3QgfSBmcm9tIFwiLi9tb2QudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBFc2J1aWxkQnVpbGRlck9wdGlvbnMge1xuICAvKiogVGhlIGJ1aWxkIElELiAqL1xuICBidWlsZElEOiBzdHJpbmc7XG4gIC8qKiBUaGUgZW50cnlwb2ludHMsIG1hcHBlZCBmcm9tIG5hbWUgdG8gVVJMLiAqL1xuICBlbnRyeXBvaW50czogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgaXMgYSBkZXYgYnVpbGQuICovXG4gIGRldjogYm9vbGVhbjtcbiAgLyoqIFRoZSBwYXRoIHRvIHRoZSBkZW5vLmpzb24gLyBkZW5vLmpzb25jIGNvbmZpZyBmaWxlLiAqL1xuICBjb25maWdQYXRoOiBzdHJpbmc7XG4gIC8qKiBUaGUgSlNYIGNvbmZpZ3VyYXRpb24uICovXG4gIGpzeD86IHN0cmluZztcbiAganN4SW1wb3J0U291cmNlPzogc3RyaW5nO1xuICB0YXJnZXQ6IHN0cmluZyB8IHN0cmluZ1tdO1xuICBhYnNvbHV0ZVdvcmtpbmdEaXI6IHN0cmluZztcbiAgYmFzZVBhdGg/OiBzdHJpbmc7XG59XG5cbmxldCBlc2J1aWxkOiB0eXBlb2YgaW1wb3J0KFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9lc2J1aWxkQHYwLjIwLjIvbW9kLmpzXCIpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZUVzYnVpbGQoKSB7XG4gIGVzYnVpbGQgPVxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZGVwcmVjYXRlZC1kZW5vLWFwaVxuICAgIERlbm8ucnVuID09PSB1bmRlZmluZWQgfHxcbiAgICAgIERlbm8uZW52LmdldChcIkZSRVNIX0VTQlVJTERfTE9BREVSXCIpID09PSBcInBvcnRhYmxlXCJcbiAgICAgID8gYXdhaXQgaW1wb3J0KFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9lc2J1aWxkQHYwLjIwLjIvd2FzbS5qc1wiKVxuICAgICAgOiBhd2FpdCBpbXBvcnQoXCJodHRwczovL2Rlbm8ubGFuZC94L2VzYnVpbGRAdjAuMjAuMi9tb2QuanNcIik7XG4gIGNvbnN0IGVzYnVpbGRXYXNtVVJMID1cbiAgICBuZXcgVVJMKFwiLi9lc2J1aWxkX3YwLjIwLjIud2FzbVwiLCBpbXBvcnQubWV0YS51cmwpLmhyZWY7XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1kZXByZWNhdGVkLWRlbm8tYXBpXG4gIGlmIChEZW5vLnJ1biA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYXdhaXQgZXNidWlsZC5pbml0aWFsaXplKHtcbiAgICAgIHdhc21VUkw6IGVzYnVpbGRXYXNtVVJMLFxuICAgICAgd29ya2VyOiBmYWxzZSxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBhd2FpdCBlc2J1aWxkLmluaXRpYWxpemUoe30pO1xuICB9XG4gIHJldHVybiBlc2J1aWxkO1xufVxuXG5leHBvcnQgY2xhc3MgRXNidWlsZEJ1aWxkZXIgaW1wbGVtZW50cyBCdWlsZGVyIHtcbiAgI29wdGlvbnM6IEVzYnVpbGRCdWlsZGVyT3B0aW9ucztcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBFc2J1aWxkQnVpbGRlck9wdGlvbnMpIHtcbiAgICB0aGlzLiNvcHRpb25zID0gb3B0aW9ucztcbiAgfVxuXG4gIGFzeW5jIGJ1aWxkKCk6IFByb21pc2U8RXNidWlsZFNuYXBzaG90PiB7XG4gICAgY29uc3Qgb3B0cyA9IHRoaXMuI29wdGlvbnM7XG5cbiAgICAvLyBMYXppbHkgaW5pdGlhbGl6ZSBlc2J1aWxkXG4gICAgY29uc3QgZXNidWlsZCA9IGF3YWl0IGluaXRpYWxpemVFc2J1aWxkKCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgYWJzV29ya2luZ0RpciA9IG9wdHMuYWJzb2x1dGVXb3JraW5nRGlyO1xuXG4gICAgICAvLyBJbiBkZXYtbW9kZSB3ZSBza2lwIGlkZW50aWZpZXIgbWluaWZpY2F0aW9uIHRvIGJlIGFibGUgdG8gc2hvdyBwcm9wZXJcbiAgICAgIC8vIGNvbXBvbmVudCBuYW1lcyBpbiBQcmVhY3QgRGV2VG9vbHMgaW5zdGVhZCBvZiBzaW5nbGUgY2hhcmFjdGVycy5cbiAgICAgIGNvbnN0IG1pbmlmeU9wdGlvbnM6IFBhcnRpYWw8QnVpbGRPcHRpb25zPiA9IG9wdHMuZGV2XG4gICAgICAgID8ge1xuICAgICAgICAgIG1pbmlmeUlkZW50aWZpZXJzOiBmYWxzZSxcbiAgICAgICAgICBtaW5pZnlTeW50YXg6IHRydWUsXG4gICAgICAgICAgbWluaWZ5V2hpdGVzcGFjZTogdHJ1ZSxcbiAgICAgICAgfVxuICAgICAgICA6IHsgbWluaWZ5OiB0cnVlIH07XG5cbiAgICAgIGNvbnN0IGJ1bmRsZSA9IGF3YWl0IGVzYnVpbGQuYnVpbGQoe1xuICAgICAgICBlbnRyeVBvaW50czogb3B0cy5lbnRyeXBvaW50cyxcblxuICAgICAgICBwbGF0Zm9ybTogXCJicm93c2VyXCIsXG4gICAgICAgIHRhcmdldDogdGhpcy4jb3B0aW9ucy50YXJnZXQsXG5cbiAgICAgICAgZm9ybWF0OiBcImVzbVwiLFxuICAgICAgICBidW5kbGU6IHRydWUsXG4gICAgICAgIHNwbGl0dGluZzogdHJ1ZSxcbiAgICAgICAgdHJlZVNoYWtpbmc6IHRydWUsXG4gICAgICAgIHNvdXJjZW1hcDogb3B0cy5kZXYgPyBcImxpbmtlZFwiIDogZmFsc2UsXG4gICAgICAgIC4uLm1pbmlmeU9wdGlvbnMsXG5cbiAgICAgICAganN4OiBvcHRzLmpzeCA9PT0gXCJyZWFjdFwiXG4gICAgICAgICAgPyBcInRyYW5zZm9ybVwiXG4gICAgICAgICAgOiBvcHRzLmpzeCA9PT0gXCJyZWFjdC1uYXRpdmVcIiB8fCBvcHRzLmpzeCA9PT0gXCJwcmVzZXJ2ZVwiXG4gICAgICAgICAgPyBcInByZXNlcnZlXCJcbiAgICAgICAgICA6ICFvcHRzLmpzeEltcG9ydFNvdXJjZVxuICAgICAgICAgID8gXCJ0cmFuc2Zvcm1cIlxuICAgICAgICAgIDogXCJhdXRvbWF0aWNcIixcbiAgICAgICAganN4SW1wb3J0U291cmNlOiBvcHRzLmpzeEltcG9ydFNvdXJjZSA/PyBcInByZWFjdFwiLFxuXG4gICAgICAgIGFic1dvcmtpbmdEaXIsXG4gICAgICAgIG91dGRpcjogXCIuXCIsXG4gICAgICAgIHdyaXRlOiBmYWxzZSxcbiAgICAgICAgbWV0YWZpbGU6IHRydWUsXG5cbiAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgIGRldkNsaWVudFVybFBsdWdpbihvcHRzLmJhc2VQYXRoKSxcbiAgICAgICAgICBidWlsZElkUGx1Z2luKG9wdHMuYnVpbGRJRCksXG4gICAgICAgICAgLi4uZGVub1BsdWdpbnMoeyBjb25maWdQYXRoOiBvcHRzLmNvbmZpZ1BhdGggfSksXG4gICAgICAgIF0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZmlsZXMgPSBuZXcgTWFwPHN0cmluZywgVWludDhBcnJheT4oKTtcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmdbXT4oKTtcblxuICAgICAgaWYgKGJ1bmRsZS5vdXRwdXRGaWxlcykge1xuICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgYnVuZGxlLm91dHB1dEZpbGVzKSB7XG4gICAgICAgICAgY29uc3QgcGF0aCA9IHJlbGF0aXZlKGFic1dvcmtpbmdEaXIsIGZpbGUucGF0aCk7XG4gICAgICAgICAgZmlsZXMuc2V0KHBhdGgsIGZpbGUuY29udGVudHMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZpbGVzLnNldChcbiAgICAgICAgXCJtZXRhZmlsZS5qc29uXCIsXG4gICAgICAgIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShKU09OLnN0cmluZ2lmeShidW5kbGUubWV0YWZpbGUpKSxcbiAgICAgICk7XG5cbiAgICAgIGlmIChidW5kbGUubWV0YWZpbGUpIHtcbiAgICAgICAgY29uc3QgbWV0YU91dHB1dHMgPSBuZXcgTWFwKE9iamVjdC5lbnRyaWVzKGJ1bmRsZS5tZXRhZmlsZS5vdXRwdXRzKSk7XG5cbiAgICAgICAgZm9yIChjb25zdCBbcGF0aCwgZW50cnldIG9mIG1ldGFPdXRwdXRzLmVudHJpZXMoKSkge1xuICAgICAgICAgIGNvbnN0IGltcG9ydHMgPSBlbnRyeS5pbXBvcnRzXG4gICAgICAgICAgICAuZmlsdGVyKCh7IGtpbmQgfSkgPT4ga2luZCA9PT0gXCJpbXBvcnQtc3RhdGVtZW50XCIpXG4gICAgICAgICAgICAubWFwKCh7IHBhdGggfSkgPT4gcGF0aCk7XG4gICAgICAgICAgZGVwZW5kZW5jaWVzLnNldChwYXRoLCBpbXBvcnRzKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IEVzYnVpbGRTbmFwc2hvdChmaWxlcywgZGVwZW5kZW5jaWVzKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXdhaXQgZXNidWlsZC5zdG9wKCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRldkNsaWVudFVybFBsdWdpbihiYXNlUGF0aD86IHN0cmluZyk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJkZXYtY2xpZW50LXVybFwiLFxuICAgIHNldHVwKGJ1aWxkKSB7XG4gICAgICBidWlsZC5vbkxvYWQoXG4gICAgICAgIHsgZmlsdGVyOiAvY2xpZW50XFwudHMkLywgbmFtZXNwYWNlOiBcImZpbGVcIiB9LFxuICAgICAgICBhc3luYyAoYXJncykgPT4ge1xuICAgICAgICAgIC8vIExvYWQgdGhlIG9yaWdpbmFsIHNjcmlwdFxuICAgICAgICAgIGNvbnN0IGNvbnRlbnRzID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoYXJncy5wYXRoKTtcblxuICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIFVSTFxuICAgICAgICAgIGNvbnN0IG1vZGlmaWVkQ29udGVudHMgPSBjb250ZW50cy5yZXBsYWNlKFxuICAgICAgICAgICAgXCIvX2Zyc2gvYWxpdmVcIixcbiAgICAgICAgICAgIGAke2Jhc2VQYXRofS9fZnJzaC9hbGl2ZWAsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb250ZW50czogbW9kaWZpZWRDb250ZW50cyxcbiAgICAgICAgICAgIGxvYWRlcjogXCJ0c1wiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkSWRQbHVnaW4oYnVpbGRJZDogc3RyaW5nKTogUGx1Z2luIHtcbiAgY29uc3QgZmlsZSA9IGltcG9ydC5tZXRhLnJlc29sdmUoXCIuLi9ydW50aW1lL2J1aWxkX2lkLnRzXCIpO1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKGZpbGUpO1xuICBsZXQgb3B0aW9uczogT25Mb2FkT3B0aW9ucztcbiAgaWYgKHVybC5wcm90b2NvbCA9PT0gXCJmaWxlOlwiKSB7XG4gICAgY29uc3QgcGF0aCA9IGZyb21GaWxlVXJsKHVybCk7XG4gICAgY29uc3QgZmlsdGVyID0gbmV3IFJlZ0V4cChgXiR7cmVnZXhwRXNjYXBlKHBhdGgpfSRgKTtcbiAgICBvcHRpb25zID0geyBmaWx0ZXIsIG5hbWVzcGFjZTogXCJmaWxlXCIgfTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBuYW1lc3BhY2UgPSB1cmwucHJvdG9jb2wuc2xpY2UoMCwgLTEpO1xuICAgIGNvbnN0IHBhdGggPSB1cmwuaHJlZi5zbGljZShuYW1lc3BhY2UubGVuZ3RoICsgMSk7XG4gICAgY29uc3QgZmlsdGVyID0gbmV3IFJlZ0V4cChgXiR7cmVnZXhwRXNjYXBlKHBhdGgpfSRgKTtcbiAgICBvcHRpb25zID0geyBmaWx0ZXIsIG5hbWVzcGFjZSB9O1xuICB9XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJmcmVzaC1idWlsZC1pZFwiLFxuICAgIHNldHVwKGJ1aWxkKSB7XG4gICAgICBidWlsZC5vbkxvYWQoXG4gICAgICAgIG9wdGlvbnMsXG4gICAgICAgICgpID0+ICh7IGNvbnRlbnRzOiBgZXhwb3J0IGNvbnN0IEJVSUxEX0lEID0gXCIke2J1aWxkSWR9XCI7YCB9KSxcbiAgICAgICk7XG4gICAgfSxcbiAgfTtcbn1cblxuZXhwb3J0IGNsYXNzIEVzYnVpbGRTbmFwc2hvdCBpbXBsZW1lbnRzIEJ1aWxkU25hcHNob3Qge1xuICAjZmlsZXM6IE1hcDxzdHJpbmcsIFVpbnQ4QXJyYXk+O1xuICAjZGVwZW5kZW5jaWVzOiBNYXA8c3RyaW5nLCBzdHJpbmdbXT47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZmlsZXM6IE1hcDxzdHJpbmcsIFVpbnQ4QXJyYXk+LFxuICAgIGRlcGVuZGVuY2llczogTWFwPHN0cmluZywgc3RyaW5nW10+LFxuICApIHtcbiAgICB0aGlzLiNmaWxlcyA9IGZpbGVzO1xuICAgIHRoaXMuI2RlcGVuZGVuY2llcyA9IGRlcGVuZGVuY2llcztcbiAgfVxuXG4gIGdldCBwYXRocygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy4jZmlsZXMua2V5cygpKTtcbiAgfVxuXG4gIHJlYWQocGF0aDogc3RyaW5nKTogVWludDhBcnJheSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiNmaWxlcy5nZXQocGF0aCkgPz8gbnVsbDtcbiAgfVxuXG4gIGRlcGVuZGVuY2llcyhwYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMuI2RlcGVuZGVuY2llcy5nZXQocGF0aCkgPz8gW107XG4gIH1c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
// denoCacheMetadata=6356415057945988595,15413193506136511824