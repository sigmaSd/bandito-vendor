import { dirname, join } from "jsr:@std/path@0.213";
import { NativeLoader } from "./loader_native.ts";
import { PortableLoader } from "./loader_portable.ts";
import { isInNodeModules } from "./shared.ts";
import { esbuildResolutionToURL, isNodeModulesResolution, readDenoConfig, urlToEsbuildResolution } from "./shared.ts";
const LOADERS = [
  "native",
  "portable"
];
/** The default loader to use. */ export const DEFAULT_LOADER = await Deno.permissions.query({
  name: "run"
}).then((res)=>res.state !== "granted") ? "portable" : "native";
const BUILTIN_NODE_MODULES = new Set([
  "assert",
  "assert/strict",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "dns/promises",
  "domain",
  "events",
  "fs",
  "fs/promises",
  "http",
  "http2",
  "https",
  "module",
  "net",
  "os",
  "path",
  "path/posix",
  "path/win32",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "repl",
  "readline",
  "stream",
  "stream/consumers",
  "stream/promises",
  "stream/web",
  "string_decoder",
  "sys",
  "test",
  "timers",
  "timers/promises",
  "tls",
  "tty",
  "url",
  "util",
  "util/types",
  "v8",
  "vm",
  "worker_threads",
  "zlib"
]);
/**
 * The Deno loader plugin for esbuild. This plugin will load fully qualified
 * `file`, `http`, `https`, and `data` URLs.
 *
 * **Note** that this plugin does not do relative->absolute specifier
 * resolution, or import map resolution. You must use the `denoResolverPlugin`
 * _before_ the `denoLoaderPlugin` to do that.
 *
 * This plugin can be backed by two different loaders, the `native` loader and
 * the `portable` loader.
 *
 * ### Native Loader
 *
 * The native loader shells out to the Deno executable under the hood to load
 * files. Requires `--allow-read` and `--allow-run`. In this mode the download
 * cache is shared with the Deno executable. This mode respects deno.lock,
 * DENO_DIR, DENO_AUTH_TOKENS, and all similar loading configuration. Files are
 * cached on disk in the same Deno cache as the Deno executable, and will not be
 * re-downloaded on subsequent builds.
 *
 * NPM specifiers can be used in the native loader without requiring a local
 * `node_modules` directory. NPM packages are resolved, downloaded, cached, and
 * loaded in the same way as the Deno executable does.
 *
 * JSR specifiers can be used without restrictions in the native loader. To
 * ensure dependencies are de-duplicated correctly, it is recommended to use a
 * lockfile.
 *
 * ### Portable Loader
 *
 * The portable loader does module downloading and caching with only Web APIs.
 * Requires `--allow-read` and/or `--allow-net`. This mode does not respect
 * deno.lock, DENO_DIR, DENO_AUTH_TOKENS, or any other loading configuration. It
 * does not cache downloaded files. It will re-download files on every build.
 *
 * NPM specifiers can be used in the portable loader, but require a local
 * `node_modules` directory. The `node_modules` directory must be created prior
 * using Deno's `--node-modules-dir` flag.
 *
 * JSR specifiers require a lockfile to be present to resolve.
 */ export function denoLoaderPlugin(options = {}) {
  const loader = options.loader ?? DEFAULT_LOADER;
  if (LOADERS.indexOf(loader) === -1) {
    throw new Error(`Invalid loader: ${loader}`);
  }
  return {
    name: "deno-loader",
    setup (build) {
      const cwd = build.initialOptions.absWorkingDir ?? Deno.cwd();
      let nodeModulesDir = null;
      if (options.nodeModulesDir) {
        nodeModulesDir = join(cwd, "node_modules");
      }
      let loaderImpl;
      const packageIdByNodeModules = new Map();
      build.onStart(async function onStart() {
        packageIdByNodeModules.clear();
        switch(loader){
          case "native":
            loaderImpl = new NativeLoader({
              infoOptions: {
                cwd,
                config: options.configPath,
                importMap: options.importMapURL,
                lock: options.lockPath,
                nodeModulesDir: options.nodeModulesDir
              }
            });
            break;
          case "portable":
            {
              let lockPath = options.lockPath;
              if (lockPath === undefined && options.configPath !== undefined) {
                const config = await readDenoConfig(options.configPath);
                if (typeof config.lock === "string") {
                  lockPath = join(dirname(options.configPath), config.lock);
                } else if (config.lock !== false) {
                  lockPath = join(dirname(options.configPath), "deno.lock");
                }
              }
              loaderImpl = new PortableLoader({
                lock: lockPath
              });
            }
        }
      });
      async function onResolve(args) {
        if (isNodeModulesResolution(args)) {
          if (BUILTIN_NODE_MODULES.has(args.path) || BUILTIN_NODE_MODULES.has("node:" + args.path)) {
            return {
              path: args.path,
              external: true
            };
          }
          if (nodeModulesDir) {
            return undefined;
          } else if (loaderImpl.nodeModulesDirForPackage && loaderImpl.packageIdFromNameInPackage) {
            let parentPackageId;
            let path = args.importer;
            while(true){
              const packageId = packageIdByNodeModules.get(path);
              if (packageId) {
                parentPackageId = packageId;
                break;
              }
              const pathBefore = path;
              path = dirname(path);
              if (path === pathBefore) break;
            }
            if (!parentPackageId) {
              throw new Error(`Could not find package ID for importer: ${args.importer}`);
            }
            if (args.path.startsWith(".")) {
              return undefined;
            } else {
              let packageName;
              let pathParts;
              if (args.path.startsWith("@")) {
                const [scope, name, ...rest] = args.path.split("/");
                packageName = `${scope}/${name}`;
                pathParts = rest;
              } else {
                const [name, ...rest] = args.path.split("/");
                packageName = name;
                pathParts = rest;
              }
              const packageId = loaderImpl.packageIdFromNameInPackage(packageName, parentPackageId);
              const id = packageId ?? parentPackageId;
              const resolveDir = await loaderImpl.nodeModulesDirForPackage(id);
              packageIdByNodeModules.set(resolveDir, id);
              const path = [
                packageName,
                ...pathParts
              ].join("/");
              return await build.resolve(path, {
                kind: args.kind,
                resolveDir,
                importer: args.importer
              });
            }
          } else {
            throw new Error(`To use "npm:" specifiers, you must specify "nodeModulesDir: true", or use "loader: native".`);
          }
        }
        const specifier = esbuildResolutionToURL(args);
        // Once we have an absolute path, let the loader resolver figure out
        // what to do with it.
        const res = await loaderImpl.resolve(specifier);
        switch(res.kind){
          case "esm":
            {
              const { specifier } = res;
              return urlToEsbuildResolution(specifier);
            }
          case "npm":
            {
              let resolveDir;
              if (nodeModulesDir) {
                resolveDir = nodeModulesDir;
              } else if (loaderImpl.nodeModulesDirForPackage) {
                resolveDir = await loaderImpl.nodeModulesDirForPackage(res.packageId);
                packageIdByNodeModules.set(resolveDir, res.packageId);
              } else {
                throw new Error(`To use "npm:" specifiers, you must specify "nodeModulesDir: true", or use "loader: native".`);
              }
              const path = `${res.packageName}${res.path ?? ""}`;
              return await build.resolve(path, {
                kind: args.kind,
                resolveDir,
                importer: args.importer
              });
            }
          case "node":
            {
              return {
                path: res.path,
                external: true
              };
            }
        }
      }
      build.onResolve({
        filter: /.*/,
        namespace: "file"
      }, onResolve);
      build.onResolve({
        filter: /.*/,
        namespace: "http"
      }, onResolve);
      build.onResolve({
        filter: /.*/,
        namespace: "https"
      }, onResolve);
      build.onResolve({
        filter: /.*/,
        namespace: "data"
      }, onResolve);
      build.onResolve({
        filter: /.*/,
        namespace: "npm"
      }, onResolve);
      build.onResolve({
        filter: /.*/,
        namespace: "jsr"
      }, onResolve);
      build.onResolve({
        filter: /.*/,
        namespace: "node"
      }, onResolve);
      function onLoad(args) {
        if (args.namespace === "file" && isInNodeModules(args.path)) {
          // inside node_modules, just let esbuild do it's thing
          return undefined;
        }
        const specifier = esbuildResolutionToURL(args);
        return loaderImpl.loadEsm(specifier);
      }
      // TODO(lucacasonato): once https://github.com/evanw/esbuild/pull/2968 is fixed, remove the catch all "file" handler
      build.onLoad({
        filter: /.*/,
        namespace: "file"
      }, onLoad);
      build.onLoad({
        filter: /.*/,
        namespace: "http"
      }, onLoad);
      build.onLoad({
        filter: /.*/,
        namespace: "https"
      }, onLoad);
      build.onLoad({
        filter: /.*/,
        namespace: "data"
      }, onLoad);
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BsdWNhL2VzYnVpbGQtZGVuby1sb2FkZXIvMC4xMC4zL3NyYy9wbHVnaW5fZGVub19sb2FkZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgKiBhcyBlc2J1aWxkIGZyb20gXCIuL2VzYnVpbGRfdHlwZXMudHNcIjtcbmltcG9ydCB7IGRpcm5hbWUsIGpvaW4gfSBmcm9tIFwianNyOkBzdGQvcGF0aEAwLjIxM1wiO1xuaW1wb3J0IHsgTmF0aXZlTG9hZGVyIH0gZnJvbSBcIi4vbG9hZGVyX25hdGl2ZS50c1wiO1xuaW1wb3J0IHsgUG9ydGFibGVMb2FkZXIgfSBmcm9tIFwiLi9sb2FkZXJfcG9ydGFibGUudHNcIjtcbmltcG9ydCB7IGlzSW5Ob2RlTW9kdWxlcyB9IGZyb20gXCIuL3NoYXJlZC50c1wiO1xuaW1wb3J0IHtcbiAgZXNidWlsZFJlc29sdXRpb25Ub1VSTCxcbiAgaXNOb2RlTW9kdWxlc1Jlc29sdXRpb24sXG4gIExvYWRlcixcbiAgcmVhZERlbm9Db25maWcsXG4gIHVybFRvRXNidWlsZFJlc29sdXRpb24sXG59IGZyb20gXCIuL3NoYXJlZC50c1wiO1xuXG4vKiogT3B0aW9ucyBmb3IgdGhlIHtAbGluayBkZW5vTG9hZGVyUGx1Z2lufS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVub0xvYWRlclBsdWdpbk9wdGlvbnMge1xuICAvKipcbiAgICogU3BlY2lmeSB3aGljaCBsb2FkZXIgdG8gdXNlLiBCeSBkZWZhdWx0IHRoaXMgd2lsbCB1c2UgdGhlIGBuYXRpdmVgIGxvYWRlcixcbiAgICogdW5sZXNzIHRoZSBgLS1hbGxvdy1ydW5gIHBlcm1pc3Npb24gaGFzIG5vdCBiZWVuIGdpdmVuLlxuICAgKlxuICAgKiBTZWUge0BsaW5rIGRlbm9Mb2FkZXJQbHVnaW59IGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIHRoZSBkaWZmZXJlbnQgbG9hZGVycy5cbiAgICovXG4gIGxvYWRlcj86IFwibmF0aXZlXCIgfCBcInBvcnRhYmxlXCI7XG5cbiAgLyoqXG4gICAqIFNwZWNpZnkgdGhlIHBhdGggdG8gYSBkZW5vLmpzb24gY29uZmlnIGZpbGUgdG8gdXNlLiBUaGlzIGlzIGVxdWl2YWxlbnQgdG9cbiAgICogdGhlIGAtLWNvbmZpZ2AgZmxhZyB0byB0aGUgRGVubyBleGVjdXRhYmxlLiBUaGlzIHBhdGggbXVzdCBiZSBhYnNvbHV0ZS5cbiAgICpcbiAgICogTk9URTogSW1wb3J0IG1hcHMgaW4gdGhlIGNvbmZpZyBmaWxlIGFyZSBub3QgdXNlZCB0byBpbmZvcm0gcmVzb2x1dGlvbiwgYXNcbiAgICogdGhpcyBoYXMgYWxyZWFkeSBiZWVuIGRvbmUgYnkgdGhlIGBkZW5vUmVzb2x2ZXJQbHVnaW5gLiBUaGlzIG9wdGlvbiBpcyBvbmx5XG4gICAqIHVzZWQgd2hlbiBzcGVjaWZ5aW5nIGBsb2FkZXI6IFwibmF0aXZlXCJgIHRvIG1vcmUgZWZmaWNpZW50bHkgbG9hZCBtb2R1bGVzXG4gICAqIGZyb20gdGhlIGNhY2hlLiBXaGVuIHNwZWNpZnlpbmcgYGxvYWRlcjogXCJuYXRpdmVcImAsIHRoaXMgb3B0aW9uIG11c3QgYmUgaW5cbiAgICogc3luYyB3aXRoIHRoZSBgY29uZmlnUGF0aGAgb3B0aW9uIGZvciBgZGVub1Jlc29sdmVyUGx1Z2luYC5cbiAgICovXG4gIGNvbmZpZ1BhdGg/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBTcGVjaWZ5IGEgVVJMIHRvIGFuIGltcG9ydCBtYXAgZmlsZSB0byB1c2Ugd2hlbiByZXNvbHZpbmcgaW1wb3J0XG4gICAqIHNwZWNpZmllcnMuIFRoaXMgaXMgZXF1aXZhbGVudCB0byB0aGUgYC0taW1wb3J0LW1hcGAgZmxhZyB0byB0aGUgRGVub1xuICAgKiBleGVjdXRhYmxlLiBUaGlzIFVSTCBtYXkgYmUgcmVtb3RlIG9yIGEgbG9jYWwgZmlsZSBVUkwuXG4gICAqXG4gICAqIElmIHRoaXMgb3B0aW9uIGlzIG5vdCBzcGVjaWZpZWQsIHRoZSBkZW5vLmpzb24gY29uZmlnIGZpbGUgaXMgY29uc3VsdGVkIHRvXG4gICAqIGRldGVybWluZSB3aGF0IGltcG9ydCBtYXAgdG8gdXNlLCBpZiBhbnkuXG4gICAqXG4gICAqIE5PVEU6IEltcG9ydCBtYXBzIGluIHRoZSBjb25maWcgZmlsZSBhcmUgbm90IHVzZWQgdG8gaW5mb3JtIHJlc29sdXRpb24sIGFzXG4gICAqIHRoaXMgaGFzIGFscmVhZHkgYmVlbiBkb25lIGJ5IHRoZSBgZGVub1Jlc29sdmVyUGx1Z2luYC4gVGhpcyBvcHRpb24gaXMgb25seVxuICAgKiB1c2VkIHdoZW4gc3BlY2lmeWluZyBgbG9hZGVyOiBcIm5hdGl2ZVwiYCB0byBtb3JlIGVmZmljaWVudGx5IGxvYWQgbW9kdWxlc1xuICAgKiBmcm9tIHRoZSBjYWNoZS4gV2hlbiBzcGVjaWZ5aW5nIGBsb2FkZXI6IFwibmF0aXZlXCJgLCB0aGlzIG9wdGlvbiBtdXN0IGJlIGluXG4gICAqIHN5bmMgd2l0aCB0aGUgYGltcG9ydE1hcFVSTGAgb3B0aW9uIGZvciBgZGVub1Jlc29sdmVyUGx1Z2luYC5cbiAgICovXG4gIGltcG9ydE1hcFVSTD86IHN0cmluZztcbiAgLyoqXG4gICAqIFNwZWNpZnkgdGhlIHBhdGggdG8gYSBsb2NrIGZpbGUgdG8gdXNlLiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gdGhlIGAtLWxvY2tgXG4gICAqIGZsYWcgdG8gdGhlIERlbm8gZXhlY3V0YWJsZS4gVGhpcyBwYXRoIG11c3QgYmUgYWJzb2x1dGUuXG4gICAqXG4gICAqIElmIHRoaXMgb3B0aW9uIGlzIG5vdCBzcGVjaWZpZWQsIHRoZSBkZW5vLmpzb24gY29uZmlnIGZpbGUgaXMgY29uc3VsdGVkIHRvXG4gICAqIGRldGVybWluZSB3aGF0IGltcG9ydCBtYXAgdG8gdXNlLCBpZiBhbnkuXG4gICAqXG4gICAqIEEgbG9ja2ZpbGUgbXVzdCBiZSBwcmVzZW50IHRvIHJlc29sdmUgYGpzcjpgIHNwZWNpZmllcnMgd2l0aCB0aGUgYHBvcnRhYmxlYFxuICAgKiBsb2FkZXIuIFdoZW4gdXNpbmcgdGhlIGBuYXRpdmVgIGxvYWRlciwgYSBsb2NrZmlsZSBpcyBub3QgcmVxdWlyZWQsIGJ1dCB0b1xuICAgKiBlbnN1cmUgZGVwZW5kZW5jaWVzIGFyZSBkZS1kdXBsaWNhdGVkIGNvcnJlY3RseSwgaXQgaXMgcmVjb21tZW5kZWQgdG8gdXNlIGFcbiAgICogbG9ja2ZpbGUuXG4gICAqXG4gICAqIE5PVEU6IHdoZW4gdXNpbmcgYGxvYWRlcjogXCJwb3J0YWJsZVwiYCwgaW50ZWdyaXR5IGNoZWNrcyBhcmUgbm90IHBlcmZvcm1lZFxuICAgKiBmb3IgRVNNIG1vZHVsZXMuXG4gICAqL1xuICBsb2NrUGF0aD86IHN0cmluZztcbiAgLyoqXG4gICAqIFNwZWNpZnkgd2hldGhlciB0byBnZW5lcmF0ZSBhbmQgdXNlIGEgbG9jYWwgYG5vZGVfbW9kdWxlc2AgZGlyZWN0b3J5IHdoZW5cbiAgICogdXNpbmcgdGhlIGBuYXRpdmVgIGxvYWRlci4gVGhpcyBpcyBlcXVpdmFsZW50IHRvIHRoZSBgLS1ub2RlLW1vZHVsZXMtZGlyYFxuICAgKiBmbGFnIHRvIHRoZSBEZW5vIGV4ZWN1dGFibGUuXG4gICAqXG4gICAqIFRoaXMgb3B0aW9uIGlzIGlnbm9yZWQgd2hlbiB1c2luZyB0aGUgYHBvcnRhYmxlYCBsb2FkZXIsIGFzIHRoZSBwb3J0YWJsZVxuICAgKiBsb2FkZXIgYWx3YXlzIHVzZXMgYSBsb2NhbCBgbm9kZV9tb2R1bGVzYCBkaXJlY3RvcnkuXG4gICAqL1xuICBub2RlTW9kdWxlc0Rpcj86IGJvb2xlYW47XG59XG5cbmNvbnN0IExPQURFUlMgPSBbXCJuYXRpdmVcIiwgXCJwb3J0YWJsZVwiXSBhcyBjb25zdDtcblxuLyoqIFRoZSBkZWZhdWx0IGxvYWRlciB0byB1c2UuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9MT0FERVI6IFwibmF0aXZlXCIgfCBcInBvcnRhYmxlXCIgPVxuICBhd2FpdCBEZW5vLnBlcm1pc3Npb25zLnF1ZXJ5KHsgbmFtZTogXCJydW5cIiB9KVxuICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLnN0YXRlICE9PSBcImdyYW50ZWRcIilcbiAgICA/IFwicG9ydGFibGVcIlxuICAgIDogXCJuYXRpdmVcIjtcblxuY29uc3QgQlVJTFRJTl9OT0RFX01PRFVMRVMgPSBuZXcgU2V0KFtcbiAgXCJhc3NlcnRcIixcbiAgXCJhc3NlcnQvc3RyaWN0XCIsXG4gIFwiYXN5bmNfaG9va3NcIixcbiAgXCJidWZmZXJcIixcbiAgXCJjaGlsZF9wcm9jZXNzXCIsXG4gIFwiY2x1c3RlclwiLFxuICBcImNvbnNvbGVcIixcbiAgXCJjb25zdGFudHNcIixcbiAgXCJjcnlwdG9cIixcbiAgXCJkZ3JhbVwiLFxuICBcImRpYWdub3N0aWNzX2NoYW5uZWxcIixcbiAgXCJkbnNcIixcbiAgXCJkbnMvcHJvbWlzZXNcIixcbiAgXCJkb21haW5cIixcbiAgXCJldmVudHNcIixcbiAgXCJmc1wiLFxuICBcImZzL3Byb21pc2VzXCIsXG4gIFwiaHR0cFwiLFxuICBcImh0dHAyXCIsXG4gIFwiaHR0cHNcIixcbiAgXCJtb2R1bGVcIixcbiAgXCJuZXRcIixcbiAgXCJvc1wiLFxuICBcInBhdGhcIixcbiAgXCJwYXRoL3Bvc2l4XCIsXG4gIFwicGF0aC93aW4zMlwiLFxuICBcInBlcmZfaG9va3NcIixcbiAgXCJwcm9jZXNzXCIsXG4gIFwicHVueWNvZGVcIixcbiAgXCJxdWVyeXN0cmluZ1wiLFxuICBcInJlcGxcIixcbiAgXCJyZWFkbGluZVwiLFxuICBcInN0cmVhbVwiLFxuICBcInN0cmVhbS9jb25zdW1lcnNcIixcbiAgXCJzdHJlYW0vcHJvbWlzZXNcIixcbiAgXCJzdHJlYW0vd2ViXCIsXG4gIFwic3RyaW5nX2RlY29kZXJcIixcbiAgXCJzeXNcIixcbiAgXCJ0ZXN0XCIsXG4gIFwidGltZXJzXCIsXG4gIFwidGltZXJzL3Byb21pc2VzXCIsXG4gIFwidGxzXCIsXG4gIFwidHR5XCIsXG4gIFwidXJsXCIsXG4gIFwidXRpbFwiLFxuICBcInV0aWwvdHlwZXNcIixcbiAgXCJ2OFwiLFxuICBcInZtXCIsXG4gIFwid29ya2VyX3RocmVhZHNcIixcbiAgXCJ6bGliXCIsXG5dKTtcblxuLyoqXG4gKiBUaGUgRGVubyBsb2FkZXIgcGx1Z2luIGZvciBlc2J1aWxkLiBUaGlzIHBsdWdpbiB3aWxsIGxvYWQgZnVsbHkgcXVhbGlmaWVkXG4gKiBgZmlsZWAsIGBodHRwYCwgYGh0dHBzYCwgYW5kIGBkYXRhYCBVUkxzLlxuICpcbiAqICoqTm90ZSoqIHRoYXQgdGhpcyBwbHVnaW4gZG9lcyBub3QgZG8gcmVsYXRpdmUtPmFic29sdXRlIHNwZWNpZmllclxuICogcmVzb2x1dGlvbiwgb3IgaW1wb3J0IG1hcCByZXNvbHV0aW9uLiBZb3UgbXVzdCB1c2UgdGhlIGBkZW5vUmVzb2x2ZXJQbHVnaW5gXG4gKiBfYmVmb3JlXyB0aGUgYGRlbm9Mb2FkZXJQbHVnaW5gIHRvIGRvIHRoYXQuXG4gKlxuICogVGhpcyBwbHVnaW4gY2FuIGJlIGJhY2tlZCBieSB0d28gZGlmZmVyZW50IGxvYWRlcnMsIHRoZSBgbmF0aXZlYCBsb2FkZXIgYW5kXG4gKiB0aGUgYHBvcnRhYmxlYCBsb2FkZXIuXG4gKlxuICogIyMjIE5hdGl2ZSBMb2FkZXJcbiAqXG4gKiBUaGUgbmF0aXZlIGxvYWRlciBzaGVsbHMgb3V0IHRvIHRoZSBEZW5vIGV4ZWN1dGFibGUgdW5kZXIgdGhlIGhvb2QgdG8gbG9hZFxuICogZmlsZXMuIFJlcXVpcmVzIGAtLWFsbG93LXJlYWRgIGFuZCBgLS1hbGxvdy1ydW5gLiBJbiB0aGlzIG1vZGUgdGhlIGRvd25sb2FkXG4gKiBjYWNoZSBpcyBzaGFyZWQgd2l0aCB0aGUgRGVubyBleGVjdXRhYmxlLiBUaGlzIG1vZGUgcmVzcGVjdHMgZGVuby5sb2NrLFxuICogREVOT19ESVIsIERFTk9fQVVUSF9UT0tFTlMsIGFuZCBhbGwgc2ltaWxhciBsb2FkaW5nIGNvbmZpZ3VyYXRpb24uIEZpbGVzIGFyZVxuICogY2FjaGVkIG9uIGRpc2sgaW4gdGhlIHNhbWUgRGVubyBjYWNoZSBhcyB0aGUgRGVubyBleGVjdXRhYmxlLCBhbmQgd2lsbCBub3QgYmVcbiAqIHJlLWRvd25sb2FkZWQgb24gc3Vic2VxdWVudCBidWlsZHMuXG4gKlxuICogTlBNIHNwZWNpZmllcnMgY2FuIGJlIHVzZWQgaW4gdGhlIG5hdGl2ZSBsb2FkZXIgd2l0aG91dCByZXF1aXJpbmcgYSBsb2NhbFxuICogYG5vZGVfbW9kdWxlc2AgZGlyZWN0b3J5LiBOUE0gcGFja2FnZXMgYXJlIHJlc29sdmVkLCBkb3dubG9hZGVkLCBjYWNoZWQsIGFuZFxuICogbG9hZGVkIGluIHRoZSBzYW1lIHdheSBhcyB0aGUgRGVubyBleGVjdXRhYmxlIGRvZXMuXG4gKlxuICogSlNSIHNwZWNpZmllcnMgY2FuIGJlIHVzZWQgd2l0aG91dCByZXN0cmljdGlvbnMgaW4gdGhlIG5hdGl2ZSBsb2FkZXIuIFRvXG4gKiBlbnN1cmUgZGVwZW5kZW5jaWVzIGFyZSBkZS1kdXBsaWNhdGVkIGNvcnJlY3RseSwgaXQgaXMgcmVjb21tZW5kZWQgdG8gdXNlIGFcbiAqIGxvY2tmaWxlLlxuICpcbiAqICMjIyBQb3J0YWJsZSBMb2FkZXJcbiAqXG4gKiBUaGUgcG9ydGFibGUgbG9hZGVyIGRvZXMgbW9kdWxlIGRvd25sb2FkaW5nIGFuZCBjYWNoaW5nIHdpdGggb25seSBXZWIgQVBJcy5cbiAqIFJlcXVpcmVzIGAtLWFsbG93LXJlYWRgIGFuZC9vciBgLS1hbGxvdy1uZXRgLiBUaGlzIG1vZGUgZG9lcyBub3QgcmVzcGVjdFxuICogZGVuby5sb2NrLCBERU5PX0RJUiwgREVOT19BVVRIX1RPS0VOUywgb3IgYW55IG90aGVyIGxvYWRpbmcgY29uZmlndXJhdGlvbi4gSXRcbiAqIGRvZXMgbm90IGNhY2hlIGRvd25sb2FkZWQgZmlsZXMuIEl0IHdpbGwgcmUtZG93bmxvYWQgZmlsZXMgb24gZXZlcnkgYnVpbGQuXG4gKlxuICogTlBNIHNwZWNpZmllcnMgY2FuIGJlIHVzZWQgaW4gdGhlIHBvcnRhYmxlIGxvYWRlciwgYnV0IHJlcXVpcmUgYSBsb2NhbFxuICogYG5vZGVfbW9kdWxlc2AgZGlyZWN0b3J5LiBUaGUgYG5vZGVfbW9kdWxlc2AgZGlyZWN0b3J5IG11c3QgYmUgY3JlYXRlZCBwcmlvclxuICogdXNpbmcgRGVubydzIGAtLW5vZGUtbW9kdWxlcy1kaXJgIGZsYWcuXG4gKlxuICogSlNSIHNwZWNpZmllcnMgcmVxdWlyZSBhIGxvY2tmaWxlIHRvIGJlIHByZXNlbnQgdG8gcmVzb2x2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlbm9Mb2FkZXJQbHVnaW4oXG4gIG9wdGlvbnM6IERlbm9Mb2FkZXJQbHVnaW5PcHRpb25zID0ge30sXG4pOiBlc2J1aWxkLlBsdWdpbiB7XG4gIGNvbnN0IGxvYWRlciA9IG9wdGlvbnMubG9hZGVyID8/IERFRkFVTFRfTE9BREVSO1xuICBpZiAoTE9BREVSUy5pbmRleE9mKGxvYWRlcikgPT09IC0xKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGxvYWRlcjogJHtsb2FkZXJ9YCk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcImRlbm8tbG9hZGVyXCIsXG4gICAgc2V0dXAoYnVpbGQpIHtcbiAgICAgIGNvbnN0IGN3ZCA9IGJ1aWxkLmluaXRpYWxPcHRpb25zLmFic1dvcmtpbmdEaXIgPz8gRGVuby5jd2QoKTtcblxuICAgICAgbGV0IG5vZGVNb2R1bGVzRGlyOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgIGlmIChvcHRpb25zLm5vZGVNb2R1bGVzRGlyKSB7XG4gICAgICAgIG5vZGVNb2R1bGVzRGlyID0gam9pbihjd2QsIFwibm9kZV9tb2R1bGVzXCIpO1xuICAgICAgfVxuXG4gICAgICBsZXQgbG9hZGVySW1wbDogTG9hZGVyO1xuXG4gICAgICBjb25zdCBwYWNrYWdlSWRCeU5vZGVNb2R1bGVzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICAgICAgYnVpbGQub25TdGFydChhc3luYyBmdW5jdGlvbiBvblN0YXJ0KCkge1xuICAgICAgICBwYWNrYWdlSWRCeU5vZGVNb2R1bGVzLmNsZWFyKCk7XG4gICAgICAgIHN3aXRjaCAobG9hZGVyKSB7XG4gICAgICAgICAgY2FzZSBcIm5hdGl2ZVwiOlxuICAgICAgICAgICAgbG9hZGVySW1wbCA9IG5ldyBOYXRpdmVMb2FkZXIoe1xuICAgICAgICAgICAgICBpbmZvT3B0aW9uczoge1xuICAgICAgICAgICAgICAgIGN3ZCxcbiAgICAgICAgICAgICAgICBjb25maWc6IG9wdGlvbnMuY29uZmlnUGF0aCxcbiAgICAgICAgICAgICAgICBpbXBvcnRNYXA6IG9wdGlvbnMuaW1wb3J0TWFwVVJMLFxuICAgICAgICAgICAgICAgIGxvY2s6IG9wdGlvbnMubG9ja1BhdGgsXG4gICAgICAgICAgICAgICAgbm9kZU1vZHVsZXNEaXI6IG9wdGlvbnMubm9kZU1vZHVsZXNEaXIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJwb3J0YWJsZVwiOiB7XG4gICAgICAgICAgICBsZXQgbG9ja1BhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IG9wdGlvbnMubG9ja1BhdGg7XG4gICAgICAgICAgICBpZiAobG9ja1BhdGggPT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmNvbmZpZ1BhdGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBjb25zdCBjb25maWcgPSBhd2FpdCByZWFkRGVub0NvbmZpZyhvcHRpb25zLmNvbmZpZ1BhdGgpO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5sb2NrID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgbG9ja1BhdGggPSBqb2luKGRpcm5hbWUob3B0aW9ucy5jb25maWdQYXRoKSwgY29uZmlnLmxvY2spO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbmZpZy5sb2NrICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGxvY2tQYXRoID0gam9pbihkaXJuYW1lKG9wdGlvbnMuY29uZmlnUGF0aCksIFwiZGVuby5sb2NrXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2FkZXJJbXBsID0gbmV3IFBvcnRhYmxlTG9hZGVyKHtcbiAgICAgICAgICAgICAgbG9jazogbG9ja1BhdGgsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBhc3luYyBmdW5jdGlvbiBvblJlc29sdmUoXG4gICAgICAgIGFyZ3M6IGVzYnVpbGQuT25SZXNvbHZlQXJncyxcbiAgICAgICk6IFByb21pc2U8ZXNidWlsZC5PblJlc29sdmVSZXN1bHQgfCB1bmRlZmluZWQ+IHtcbiAgICAgICAgaWYgKGlzTm9kZU1vZHVsZXNSZXNvbHV0aW9uKGFyZ3MpKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgQlVJTFRJTl9OT0RFX01PRFVMRVMuaGFzKGFyZ3MucGF0aCkgfHxcbiAgICAgICAgICAgIEJVSUxUSU5fTk9ERV9NT0RVTEVTLmhhcyhcIm5vZGU6XCIgKyBhcmdzLnBhdGgpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBwYXRoOiBhcmdzLnBhdGgsXG4gICAgICAgICAgICAgIGV4dGVybmFsOiB0cnVlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5vZGVNb2R1bGVzRGlyKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBsb2FkZXJJbXBsLm5vZGVNb2R1bGVzRGlyRm9yUGFja2FnZSAmJlxuICAgICAgICAgICAgbG9hZGVySW1wbC5wYWNrYWdlSWRGcm9tTmFtZUluUGFja2FnZVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgbGV0IHBhcmVudFBhY2thZ2VJZDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHBhdGggPSBhcmdzLmltcG9ydGVyO1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgY29uc3QgcGFja2FnZUlkID0gcGFja2FnZUlkQnlOb2RlTW9kdWxlcy5nZXQocGF0aCk7XG4gICAgICAgICAgICAgIGlmIChwYWNrYWdlSWQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRQYWNrYWdlSWQgPSBwYWNrYWdlSWQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc3QgcGF0aEJlZm9yZSA9IHBhdGg7XG4gICAgICAgICAgICAgIHBhdGggPSBkaXJuYW1lKHBhdGgpO1xuICAgICAgICAgICAgICBpZiAocGF0aCA9PT0gcGF0aEJlZm9yZSkgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXBhcmVudFBhY2thZ2VJZCkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgYENvdWxkIG5vdCBmaW5kIHBhY2thZ2UgSUQgZm9yIGltcG9ydGVyOiAke2FyZ3MuaW1wb3J0ZXJ9YCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhcmdzLnBhdGguc3RhcnRzV2l0aChcIi5cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxldCBwYWNrYWdlTmFtZTogc3RyaW5nO1xuICAgICAgICAgICAgICBsZXQgcGF0aFBhcnRzOiBzdHJpbmdbXTtcbiAgICAgICAgICAgICAgaWYgKGFyZ3MucGF0aC5zdGFydHNXaXRoKFwiQFwiKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IFtzY29wZSwgbmFtZSwgLi4ucmVzdF0gPSBhcmdzLnBhdGguc3BsaXQoXCIvXCIpO1xuICAgICAgICAgICAgICAgIHBhY2thZ2VOYW1lID0gYCR7c2NvcGV9LyR7bmFtZX1gO1xuICAgICAgICAgICAgICAgIHBhdGhQYXJ0cyA9IHJlc3Q7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW25hbWUsIC4uLnJlc3RdID0gYXJncy5wYXRoLnNwbGl0KFwiL1wiKTtcbiAgICAgICAgICAgICAgICBwYWNrYWdlTmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgcGF0aFBhcnRzID0gcmVzdDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zdCBwYWNrYWdlSWQgPSBsb2FkZXJJbXBsLnBhY2thZ2VJZEZyb21OYW1lSW5QYWNrYWdlKFxuICAgICAgICAgICAgICAgIHBhY2thZ2VOYW1lLFxuICAgICAgICAgICAgICAgIHBhcmVudFBhY2thZ2VJZCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgY29uc3QgaWQgPSBwYWNrYWdlSWQgPz8gcGFyZW50UGFja2FnZUlkO1xuICAgICAgICAgICAgICBjb25zdCByZXNvbHZlRGlyID0gYXdhaXQgbG9hZGVySW1wbC5ub2RlTW9kdWxlc0RpckZvclBhY2thZ2UoaWQpO1xuICAgICAgICAgICAgICBwYWNrYWdlSWRCeU5vZGVNb2R1bGVzLnNldChyZXNvbHZlRGlyLCBpZCk7XG4gICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBbcGFja2FnZU5hbWUsIC4uLnBhdGhQYXJ0c10uam9pbihcIi9cIik7XG4gICAgICAgICAgICAgIHJldHVybiBhd2FpdCBidWlsZC5yZXNvbHZlKHBhdGgsIHtcbiAgICAgICAgICAgICAgICBraW5kOiBhcmdzLmtpbmQsXG4gICAgICAgICAgICAgICAgcmVzb2x2ZURpcixcbiAgICAgICAgICAgICAgICBpbXBvcnRlcjogYXJncy5pbXBvcnRlcixcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgYFRvIHVzZSBcIm5wbTpcIiBzcGVjaWZpZXJzLCB5b3UgbXVzdCBzcGVjaWZ5IFwibm9kZU1vZHVsZXNEaXI6IHRydWVcIiwgb3IgdXNlIFwibG9hZGVyOiBuYXRpdmVcIi5gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3BlY2lmaWVyID0gZXNidWlsZFJlc29sdXRpb25Ub1VSTChhcmdzKTtcblxuICAgICAgICAvLyBPbmNlIHdlIGhhdmUgYW4gYWJzb2x1dGUgcGF0aCwgbGV0IHRoZSBsb2FkZXIgcmVzb2x2ZXIgZmlndXJlIG91dFxuICAgICAgICAvLyB3aGF0IHRvIGRvIHdpdGggaXQuXG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGxvYWRlckltcGwucmVzb2x2ZShzcGVjaWZpZXIpO1xuXG4gICAgICAgIHN3aXRjaCAocmVzLmtpbmQpIHtcbiAgICAgICAgICBjYXNlIFwiZXNtXCI6IHtcbiAgICAgICAgICAgIGNvbnN0IHsgc3BlY2lmaWVyIH0gPSByZXM7XG4gICAgICAgICAgICByZXR1cm4gdXJsVG9Fc2J1aWxkUmVzb2x1dGlvbihzcGVjaWZpZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIFwibnBtXCI6IHtcbiAgICAgICAgICAgIGxldCByZXNvbHZlRGlyOiBzdHJpbmc7XG4gICAgICAgICAgICBpZiAobm9kZU1vZHVsZXNEaXIpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZURpciA9IG5vZGVNb2R1bGVzRGlyO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsb2FkZXJJbXBsLm5vZGVNb2R1bGVzRGlyRm9yUGFja2FnZSkge1xuICAgICAgICAgICAgICByZXNvbHZlRGlyID0gYXdhaXQgbG9hZGVySW1wbC5ub2RlTW9kdWxlc0RpckZvclBhY2thZ2UoXG4gICAgICAgICAgICAgICAgcmVzLnBhY2thZ2VJZCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgcGFja2FnZUlkQnlOb2RlTW9kdWxlcy5zZXQocmVzb2x2ZURpciwgcmVzLnBhY2thZ2VJZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgYFRvIHVzZSBcIm5wbTpcIiBzcGVjaWZpZXJzLCB5b3UgbXVzdCBzcGVjaWZ5IFwibm9kZU1vZHVsZXNEaXI6IHRydWVcIiwgb3IgdXNlIFwibG9hZGVyOiBuYXRpdmVcIi5gLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGAke3Jlcy5wYWNrYWdlTmFtZX0ke3Jlcy5wYXRoID8/IFwiXCJ9YDtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBidWlsZC5yZXNvbHZlKHBhdGgsIHtcbiAgICAgICAgICAgICAga2luZDogYXJncy5raW5kLFxuICAgICAgICAgICAgICByZXNvbHZlRGlyLFxuICAgICAgICAgICAgICBpbXBvcnRlcjogYXJncy5pbXBvcnRlcixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIFwibm9kZVwiOiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBwYXRoOiByZXMucGF0aCxcbiAgICAgICAgICAgICAgZXh0ZXJuYWw6IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnVpbGQub25SZXNvbHZlKHsgZmlsdGVyOiAvLiovLCBuYW1lc3BhY2U6IFwiZmlsZVwiIH0sIG9uUmVzb2x2ZSk7XG4gICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC8uKi8sIG5hbWVzcGFjZTogXCJodHRwXCIgfSwgb25SZXNvbHZlKTtcbiAgICAgIGJ1aWxkLm9uUmVzb2x2ZSh7IGZpbHRlcjogLy4qLywgbmFtZXNwYWNlOiBcImh0dHBzXCIgfSwgb25SZXNvbHZlKTtcbiAgICAgIGJ1aWxkLm9uUmVzb2x2ZSh7IGZpbHRlcjogLy4qLywgbmFtZXNwYWNlOiBcImRhdGFcIiB9LCBvblJlc29sdmUpO1xuICAgICAgYnVpbGQub25SZXNvbHZlKHsgZmlsdGVyOiAvLiovLCBuYW1lc3BhY2U6IFwibnBtXCIgfSwgb25SZXNvbHZlKTtcbiAgICAgIGJ1aWxkLm9uUmVzb2x2ZSh7IGZpbHRlcjogLy4qLywgbmFtZXNwYWNlOiBcImpzclwiIH0sIG9uUmVzb2x2ZSk7XG4gICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC8uKi8sIG5hbWVzcGFjZTogXCJub2RlXCIgfSwgb25SZXNvbHZlKTtcblxuICAgICAgZnVuY3Rpb24gb25Mb2FkKFxuICAgICAgICBhcmdzOiBlc2J1aWxkLk9uTG9hZEFyZ3MsXG4gICAgICApOiBQcm9taXNlPGVzYnVpbGQuT25Mb2FkUmVzdWx0IHwgbnVsbD4gfCB1bmRlZmluZWQge1xuICAgICAgICBpZiAoYXJncy5uYW1lc3BhY2UgPT09IFwiZmlsZVwiICYmIGlzSW5Ob2RlTW9kdWxlcyhhcmdzLnBhdGgpKSB7XG4gICAgICAgICAgLy8gaW5zaWRlIG5vZGVfbW9kdWxlcywganVzdCBsZXQgZXNidWlsZCBkbyBpdCdzIHRoaW5nXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzcGVjaWZpZXIgPSBlc2J1aWxkUmVzb2x1dGlvblRvVVJMKGFyZ3MpO1xuICAgICAgICByZXR1cm4gbG9hZGVySW1wbC5sb2FkRXNtKHNwZWNpZmllcik7XG4gICAgICB9XG4gICAgICAvLyBUT0RPKGx1Y2FjYXNvbmF0byk6IG9uY2UgaHR0cHM6Ly9naXRodWIuY29tL2V2YW53L2VzYnVpbGQvcHVsbC8yOTY4IGlzIGZpeGVkLCByZW1vdmUgdGhlIGNhdGNoIGFsbCBcImZpbGVcIiBoYW5kbGVyXG4gICAgICBidWlsZC5vbkxvYWQoeyBmaWx0ZXI6IC8uKi8sIG5hbWVzcGFjZTogXCJmaWxlXCIgfSwgb25Mb2FkKTtcbiAgICAgIGJ1aWxkLm9uTG9hZCh7IGZpbHRlcjogLy4qLywgbmFtZXNwYWNlOiBcImh0dHBcIiB9LCBvbkxvYWQpO1xuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvLiovLCBuYW1lc3BhY2U6IFwiaHR0cHNcIiB9LCBvbkxvYWQpO1xuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvLiovLCBuYW1lc3BhY2U6IFwiZGF0YVwiIH0sIG9uTG9hZCk7XG4gICAgfSxcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLE9BQU8sRUFBRSxJQUFJLFFBQVEsc0JBQXNCO0FBQ3BELFNBQVMsWUFBWSxRQUFRLHFCQUFxQjtBQUNsRCxTQUFTLGNBQWMsUUFBUSx1QkFBdUI7QUFDdEQsU0FBUyxlQUFlLFFBQVEsY0FBYztBQUM5QyxTQUNFLHNCQUFzQixFQUN0Qix1QkFBdUIsRUFFdkIsY0FBYyxFQUNkLHNCQUFzQixRQUNqQixjQUFjO0FBaUVyQixNQUFNLFVBQVU7RUFBQztFQUFVO0NBQVc7QUFFdEMsK0JBQStCLEdBQy9CLE9BQU8sTUFBTSxpQkFDWCxNQUFNLEtBQUssV0FBVyxDQUFDLEtBQUssQ0FBQztFQUFFLE1BQU07QUFBTSxHQUN0QyxJQUFJLENBQUMsQ0FBQyxNQUFRLElBQUksS0FBSyxLQUFLLGFBQzdCLGFBQ0EsU0FBUztBQUVmLE1BQU0sdUJBQXVCLElBQUksSUFBSTtFQUNuQztFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0NBQ0Q7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXdDQyxHQUNELE9BQU8sU0FBUyxpQkFDZCxVQUFtQyxD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
// denoCacheMetadata=8170947636661662228,9600390294028576840