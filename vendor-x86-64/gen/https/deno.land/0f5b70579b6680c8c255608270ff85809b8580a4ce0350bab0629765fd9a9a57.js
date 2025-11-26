import { dirname, fromFileUrl, isAbsolute, join, JSONC } from "./deps.ts";
import { DEFAULT_RENDER_FN } from "./render.ts";
export async function readDenoConfig(directory) {
  let dir = directory;
  while(true){
    for (const name of [
      "deno.json",
      "deno.jsonc"
    ]){
      const path = join(dir, name);
      try {
        const file = await Deno.readTextFile(path);
        if (name.endsWith(".jsonc")) {
          return {
            config: JSONC.parse(file),
            path
          };
        } else {
          return {
            config: JSON.parse(file),
            path
          };
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(`Could not find a deno.json file in the current directory or any parent directory.`);
    }
    dir = parent;
  }
}
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export async function getInternalFreshState(manifest, config) {
  const base = dirname(fromFileUrl(manifest.baseUrl));
  const { config: denoJson, path: denoJsonPath } = await readDenoConfig(base);
  if (typeof denoJson.importMap !== "string" && !isObject(denoJson.imports)) {
    throw new Error("deno.json must contain an 'importMap' or 'imports' property.");
  }
  const isLegacyDev = Deno.env.get("__FRSH_LEGACY_DEV") === "true";
  /**
   * assume a basePath is declared like this:
   * basePath: "/foo/bar"
   * it must start with a slash, and not have a trailing slash
   */ let basePath = "";
  if (config.router?.basePath) {
    basePath = config.router?.basePath;
    if (!basePath.startsWith("/")) {
      throw new TypeError(`"basePath" option must start with "/". Received: "${basePath}"`);
    }
    if (basePath.endsWith("/")) {
      throw new TypeError(`"basePath" option must not end with "/". Received: "${basePath}"`);
    }
  }
  const internalConfig = {
    dev: isLegacyDev || Boolean(config.dev),
    build: {
      outDir: config.build?.outDir ? parseFileOrUrl(config.build.outDir, base) : join(base, "_fresh"),
      target: config.build?.target ?? [
        "chrome99",
        "firefox99",
        "safari15"
      ]
    },
    plugins: config.plugins ?? [],
    staticDir: config.staticDir ? parseFileOrUrl(config.staticDir, base) : join(base, "static"),
    render: config.render ?? DEFAULT_RENDER_FN,
    router: config.router,
    server: config.server ?? {},
    basePath
  };
  if (config.cert) {
    internalConfig.server.cert = config.cert;
  }
  if (config.hostname) {
    internalConfig.server.hostname = config.hostname;
  }
  if (config.key) {
    internalConfig.server.key = config.key;
  }
  if (config.onError) {
    internalConfig.server.onError = config.onError;
  }
  if (config.onListen) {
    internalConfig.server.onListen = config.onListen;
  }
  if (config.port) {
    internalConfig.server.port = config.port;
  }
  if (config.reusePort) {
    internalConfig.server.reusePort = config.reusePort;
  }
  if (config.signal) {
    internalConfig.server.signal = config.signal;
  }
  return {
    config: internalConfig,
    manifest,
    loadSnapshot: !isLegacyDev && !config.dev,
    didLoadSnapshot: false,
    denoJsonPath,
    denoJson,
    build: false
  };
}
function parseFileOrUrl(input, base) {
  if (input.startsWith("file://")) {
    return fromFileUrl(input);
  } else if (!isAbsolute(input)) {
    return join(base, input);
  }
  return input;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9jb25maWcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGlybmFtZSwgZnJvbUZpbGVVcmwsIGlzQWJzb2x1dGUsIGpvaW4sIEpTT05DIH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgRnJvbU1hbmlmZXN0Q29uZmlnLCBNYW5pZmVzdCB9IGZyb20gXCIuL21vZC50c1wiO1xuaW1wb3J0IHsgREVGQVVMVF9SRU5ERVJfRk4gfSBmcm9tIFwiLi9yZW5kZXIudHNcIjtcbmltcG9ydCB7XG4gIERlbm9Db25maWcsXG4gIEludGVybmFsRnJlc2hTdGF0ZSxcbiAgUmVzb2x2ZWRGcmVzaENvbmZpZyxcbn0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWREZW5vQ29uZmlnKFxuICBkaXJlY3Rvcnk6IHN0cmluZyxcbik6IFByb21pc2U8eyBjb25maWc6IERlbm9Db25maWc7IHBhdGg6IHN0cmluZyB9PiB7XG4gIGxldCBkaXIgPSBkaXJlY3Rvcnk7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIFtcImRlbm8uanNvblwiLCBcImRlbm8uanNvbmNcIl0pIHtcbiAgICAgIGNvbnN0IHBhdGggPSBqb2luKGRpciwgbmFtZSk7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUocGF0aCk7XG4gICAgICAgIGlmIChuYW1lLmVuZHNXaXRoKFwiLmpzb25jXCIpKSB7XG4gICAgICAgICAgcmV0dXJuIHsgY29uZmlnOiBKU09OQy5wYXJzZShmaWxlKSBhcyBEZW5vQ29uZmlnLCBwYXRoIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHsgY29uZmlnOiBKU09OLnBhcnNlKGZpbGUpLCBwYXRoIH07XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkpIHtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gZGlybmFtZShkaXIpO1xuICAgIGlmIChwYXJlbnQgPT09IGRpcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQ291bGQgbm90IGZpbmQgYSBkZW5vLmpzb24gZmlsZSBpbiB0aGUgY3VycmVudCBkaXJlY3Rvcnkgb3IgYW55IHBhcmVudCBkaXJlY3RvcnkuYCxcbiAgICAgICk7XG4gICAgfVxuICAgIGRpciA9IHBhcmVudDtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZTogdW5rbm93bikge1xuICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmXG4gICAgIUFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0SW50ZXJuYWxGcmVzaFN0YXRlKFxuICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gIGNvbmZpZzogRnJvbU1hbmlmZXN0Q29uZmlnLFxuKTogUHJvbWlzZTxJbnRlcm5hbEZyZXNoU3RhdGU+IHtcbiAgY29uc3QgYmFzZSA9IGRpcm5hbWUoZnJvbUZpbGVVcmwobWFuaWZlc3QuYmFzZVVybCkpO1xuICBjb25zdCB7IGNvbmZpZzogZGVub0pzb24sIHBhdGg6IGRlbm9Kc29uUGF0aCB9ID0gYXdhaXQgcmVhZERlbm9Db25maWcoYmFzZSk7XG5cbiAgaWYgKHR5cGVvZiBkZW5vSnNvbi5pbXBvcnRNYXAgIT09IFwic3RyaW5nXCIgJiYgIWlzT2JqZWN0KGRlbm9Kc29uLmltcG9ydHMpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgXCJkZW5vLmpzb24gbXVzdCBjb250YWluIGFuICdpbXBvcnRNYXAnIG9yICdpbXBvcnRzJyBwcm9wZXJ0eS5cIixcbiAgICApO1xuICB9XG5cbiAgY29uc3QgaXNMZWdhY3lEZXYgPSBEZW5vLmVudi5nZXQoXCJfX0ZSU0hfTEVHQUNZX0RFVlwiKSA9PT0gXCJ0cnVlXCI7XG5cbiAgLyoqXG4gICAqIGFzc3VtZSBhIGJhc2VQYXRoIGlzIGRlY2xhcmVkIGxpa2UgdGhpczpcbiAgICogYmFzZVBhdGg6IFwiL2Zvby9iYXJcIlxuICAgKiBpdCBtdXN0IHN0YXJ0IHdpdGggYSBzbGFzaCwgYW5kIG5vdCBoYXZlIGEgdHJhaWxpbmcgc2xhc2hcbiAgICovXG5cbiAgbGV0IGJhc2VQYXRoID0gXCJcIjtcbiAgaWYgKGNvbmZpZy5yb3V0ZXI/LmJhc2VQYXRoKSB7XG4gICAgYmFzZVBhdGggPSBjb25maWcucm91dGVyPy5iYXNlUGF0aDtcbiAgICBpZiAoIWJhc2VQYXRoLnN0YXJ0c1dpdGgoXCIvXCIpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBgXCJiYXNlUGF0aFwiIG9wdGlvbiBtdXN0IHN0YXJ0IHdpdGggXCIvXCIuIFJlY2VpdmVkOiBcIiR7YmFzZVBhdGh9XCJgLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGJhc2VQYXRoLmVuZHNXaXRoKFwiL1wiKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgYFwiYmFzZVBhdGhcIiBvcHRpb24gbXVzdCBub3QgZW5kIHdpdGggXCIvXCIuIFJlY2VpdmVkOiBcIiR7YmFzZVBhdGh9XCJgLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBpbnRlcm5hbENvbmZpZzogUmVzb2x2ZWRGcmVzaENvbmZpZyA9IHtcbiAgICBkZXY6IGlzTGVnYWN5RGV2IHx8IEJvb2xlYW4oY29uZmlnLmRldiksXG4gICAgYnVpbGQ6IHtcbiAgICAgIG91dERpcjogY29uZmlnLmJ1aWxkPy5vdXREaXJcbiAgICAgICAgPyBwYXJzZUZpbGVPclVybChjb25maWcuYnVpbGQub3V0RGlyLCBiYXNlKVxuICAgICAgICA6IGpvaW4oYmFzZSwgXCJfZnJlc2hcIiksXG4gICAgICB0YXJnZXQ6IGNvbmZpZy5idWlsZD8udGFyZ2V0ID8/IFtcImNocm9tZTk5XCIsIFwiZmlyZWZveDk5XCIsIFwic2FmYXJpMTVcIl0sXG4gICAgfSxcbiAgICBwbHVnaW5zOiBjb25maWcucGx1Z2lucyA/PyBbXSxcbiAgICBzdGF0aWNEaXI6IGNvbmZpZy5zdGF0aWNEaXJcbiAgICAgID8gcGFyc2VGaWxlT3JVcmwoY29uZmlnLnN0YXRpY0RpciwgYmFzZSlcbiAgICAgIDogam9pbihiYXNlLCBcInN0YXRpY1wiKSxcbiAgICByZW5kZXI6IGNvbmZpZy5yZW5kZXIgPz8gREVGQVVMVF9SRU5ERVJfRk4sXG4gICAgcm91dGVyOiBjb25maWcucm91dGVyLFxuICAgIHNlcnZlcjogY29uZmlnLnNlcnZlciA/PyB7fSxcbiAgICBiYXNlUGF0aCxcbiAgfTtcblxuICBpZiAoY29uZmlnLmNlcnQpIHtcbiAgICBpbnRlcm5hbENvbmZpZy5zZXJ2ZXIuY2VydCA9IGNvbmZpZy5jZXJ0O1xuICB9XG4gIGlmIChjb25maWcuaG9zdG5hbWUpIHtcbiAgICBpbnRlcm5hbENvbmZpZy5zZXJ2ZXIuaG9zdG5hbWUgPSBjb25maWcuaG9zdG5hbWU7XG4gIH1cbiAgaWYgKGNvbmZpZy5rZXkpIHtcbiAgICBpbnRlcm5hbENvbmZpZy5zZXJ2ZXIua2V5ID0gY29uZmlnLmtleTtcbiAgfVxuICBpZiAoY29uZmlnLm9uRXJyb3IpIHtcbiAgICBpbnRlcm5hbENvbmZpZy5zZXJ2ZXIub25FcnJvciA9IGNvbmZpZy5vbkVycm9yO1xuICB9XG4gIGlmIChjb25maWcub25MaXN0ZW4pIHtcbiAgICBpbnRlcm5hbENvbmZpZy5zZXJ2ZXIub25MaXN0ZW4gPSBjb25maWcub25MaXN0ZW47XG4gIH1cbiAgaWYgKGNvbmZpZy5wb3J0KSB7XG4gICAgaW50ZXJuYWxDb25maWcuc2VydmVyLnBvcnQgPSBjb25maWcucG9ydDtcbiAgfVxuICBpZiAoY29uZmlnLnJldXNlUG9ydCkge1xuICAgIGludGVybmFsQ29uZmlnLnNlcnZlci5yZXVzZVBvcnQgPSBjb25maWcucmV1c2VQb3J0O1xuICB9XG4gIGlmIChjb25maWcuc2lnbmFsKSB7XG4gICAgaW50ZXJuYWxDb25maWcuc2VydmVyLnNpZ25hbCA9IGNvbmZpZy5zaWduYWw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNvbmZpZzogaW50ZXJuYWxDb25maWcsXG4gICAgbWFuaWZlc3QsXG4gICAgbG9hZFNuYXBzaG90OiAhaXNMZWdhY3lEZXYgJiYgIWNvbmZpZy5kZXYsXG4gICAgZGlkTG9hZFNuYXBzaG90OiBmYWxzZSxcbiAgICBkZW5vSnNvblBhdGgsXG4gICAgZGVub0pzb24sXG4gICAgYnVpbGQ6IGZhbHNlLFxuICB9O1xufVxuXG5mdW5jdGlvbiBwYXJzZUZpbGVPclVybChpbnB1dDogc3RyaW5nLCBiYXNlOiBzdHJpbmcpIHtcbiAgaWYgKGlucHV0LnN0YXJ0c1dpdGgoXCJmaWxlOi8vXCIpKSB7XG4gICAgcmV0dXJuIGZyb21GaWxlVXJsKGlucHV0KTtcbiAgfSBlbHNlIGlmICghaXNBYnNvbHV0ZShpbnB1dCkpIHtcbiAgICByZXR1cm4gam9pbihiYXNlLCBpbnB1dCk7XG4gIH1cblxuICByZXR1cm4gaW5wdXQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxPQUFPLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxRQUFRLFlBQVk7QUFFMUUsU0FBUyxpQkFBaUIsUUFBUSxjQUFjO0FBT2hELE9BQU8sZUFBZSxlQUNwQixTQUFpQjtFQUVqQixJQUFJLE1BQU07RUFDVixNQUFPLEtBQU07SUFDWCxLQUFLLE1BQU0sUUFBUTtNQUFDO01BQWE7S0FBYSxDQUFFO01BQzlDLE1BQU0sT0FBTyxLQUFLLEtBQUs7TUFDdkIsSUFBSTtRQUNGLE1BQU0sT0FBTyxNQUFNLEtBQUssWUFBWSxDQUFDO1FBQ3JDLElBQUksS0FBSyxRQUFRLENBQUMs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
// denoCacheMetadata=6428565963064292808,2674069451112946322