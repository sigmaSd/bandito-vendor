import { toFileUrl } from "jsr:@std/path@0.213";
import { resolveImportMap, resolveModuleSpecifier } from "../vendor/x/importmap/mod.ts";
import { expandEmbeddedImportMap, isNodeModulesResolution, readDenoConfig, urlToEsbuildResolution } from "./shared.ts";
/**
 * The Deno resolver plugin performs relative->absolute specifier resolution
 * and import map resolution.
 *
 * If using the {@link denoLoaderPlugin}, this plugin must be used before the
 * loader plugin.
 */ export function denoResolverPlugin(options = {}) {
  return {
    name: "deno-resolver",
    setup (build) {
      let importMap = null;
      const externalRegexps = (build.initialOptions.external ?? []).map((external)=>{
        const regexp = new RegExp("^" + external.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&").replace(/\*/g, ".*") + "$");
        return regexp;
      });
      build.onStart(async function onStart() {
        let importMapURL;
        // If no import map URL is specified, and a config is specified, we try
        // to get an import map from the config.
        if (options.importMapURL === undefined && options.configPath !== undefined) {
          const config = await readDenoConfig(options.configPath);
          // If `imports` or `scopes` are specified, use the config file as the
          // import map directly.
          if (config.imports !== undefined || config.scopes !== undefined) {
            const configImportMap = {
              imports: config.imports,
              scopes: config.scopes
            };
            expandEmbeddedImportMap(configImportMap);
            importMap = resolveImportMap(configImportMap, toFileUrl(options.configPath));
          } else if (config.importMap !== undefined) {
            // Otherwise, use the import map URL specified in the config file
            importMapURL = new URL(config.importMap, toFileUrl(options.configPath)).href;
          }
        } else if (options.importMapURL !== undefined) {
          importMapURL = options.importMapURL;
        }
        // If we have an import map URL, fetch it and parse it.
        if (importMapURL) {
          const resp = await fetch(importMapURL);
          const data = await resp.json();
          importMap = resolveImportMap(data, new URL(resp.url));
        }
      });
      build.onResolve({
        filter: /.*/
      }, async function onResolve(args) {
        // Pass through any node_modules internal resolution.
        if (isNodeModulesResolution(args)) {
          return undefined;
        }
        // The first pass resolver performs synchronous resolution. This
        // includes relative to absolute specifier resolution and import map
        // resolution.
        // We have to first determine the referrer URL to use when resolving
        // the specifier. This is either the importer URL, or the resolveDir
        // URL if the importer is not specified (ie if the specifier is at the
        // root).
        let referrer;
        if (args.importer !== "") {
          if (args.namespace === "") {
            throw new Error("[assert] namespace is empty");
          }
          referrer = new URL(`${args.namespace}:${args.importer}`);
        } else if (args.resolveDir !== "") {
          referrer = new URL(`${toFileUrl(args.resolveDir).href}/`);
        } else {
          return undefined;
        }
        // We can then resolve the specifier relative to the referrer URL. If
        // an import map is specified, we use that to resolve the specifier.
        let resolved;
        if (importMap !== null) {
          const res = resolveModuleSpecifier(args.path, importMap, new URL(referrer));
          resolved = new URL(res);
        } else {
          resolved = new URL(args.path, referrer);
        }
        for (const externalRegexp of externalRegexps){
          if (externalRegexp.test(resolved.href)) {
            return {
              path: resolved.href,
              external: true
            };
          }
        }
        // Now pass the resolved specifier back into the resolver, for a second
        // pass. Now plugins can perform any resolution they want on the fully
        // resolved specifier.
        const { path, namespace } = urlToEsbuildResolution(resolved);
        const res = await build.resolve(path, {
          namespace,
          kind: args.kind
        });
        return res;
      });
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BsdWNhL2VzYnVpbGQtZGVuby1sb2FkZXIvMC4xMC4zL3NyYy9wbHVnaW5fZGVub19yZXNvbHZlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSAqIGFzIGVzYnVpbGQgZnJvbSBcIi4vZXNidWlsZF90eXBlcy50c1wiO1xuaW1wb3J0IHsgdG9GaWxlVXJsIH0gZnJvbSBcImpzcjpAc3RkL3BhdGhAMC4yMTNcIjtcbmltcG9ydCB7XG4gIEltcG9ydE1hcCxcbiAgcmVzb2x2ZUltcG9ydE1hcCxcbiAgcmVzb2x2ZU1vZHVsZVNwZWNpZmllcixcbn0gZnJvbSBcIi4uL3ZlbmRvci94L2ltcG9ydG1hcC9tb2QudHNcIjtcbmltcG9ydCB7IFNjb3BlcywgU3BlY2lmaWVyTWFwIH0gZnJvbSBcIi4uL3ZlbmRvci94L2ltcG9ydG1hcC9fdXRpbC50c1wiO1xuaW1wb3J0IHtcbiAgZXhwYW5kRW1iZWRkZWRJbXBvcnRNYXAsXG4gIGlzTm9kZU1vZHVsZXNSZXNvbHV0aW9uLFxuICByZWFkRGVub0NvbmZpZyxcbiAgdXJsVG9Fc2J1aWxkUmVzb2x1dGlvbixcbn0gZnJvbSBcIi4vc2hhcmVkLnRzXCI7XG5leHBvcnQgdHlwZSB7IEltcG9ydE1hcCwgU2NvcGVzLCBTcGVjaWZpZXJNYXAgfTtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSB7QGxpbmsgZGVub1Jlc29sdmVyUGx1Z2lufS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVub1Jlc29sdmVyUGx1Z2luT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBTcGVjaWZ5IHRoZSBwYXRoIHRvIGEgZGVuby5qc29uIGNvbmZpZyBmaWxlIHRvIHVzZS4gVGhpcyBpcyBlcXVpdmFsZW50IHRvXG4gICAqIHRoZSBgLS1jb25maWdgIGZsYWcgdG8gdGhlIERlbm8gZXhlY3V0YWJsZS4gVGhpcyBwYXRoIG11c3QgYmUgYWJzb2x1dGUuXG4gICAqL1xuICBjb25maWdQYXRoPzogc3RyaW5nO1xuICAvKipcbiAgICogU3BlY2lmeSBhIFVSTCB0byBhbiBpbXBvcnQgbWFwIGZpbGUgdG8gdXNlIHdoZW4gcmVzb2x2aW5nIGltcG9ydFxuICAgKiBzcGVjaWZpZXJzLiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gdGhlIGAtLWltcG9ydC1tYXBgIGZsYWcgdG8gdGhlIERlbm9cbiAgICogZXhlY3V0YWJsZS4gVGhpcyBVUkwgbWF5IGJlIHJlbW90ZSBvciBhIGxvY2FsIGZpbGUgVVJMLlxuICAgKlxuICAgKiBJZiB0aGlzIG9wdGlvbiBpcyBub3Qgc3BlY2lmaWVkLCB0aGUgZGVuby5qc29uIGNvbmZpZyBmaWxlIGlzIGNvbnN1bHRlZCB0b1xuICAgKiBkZXRlcm1pbmUgd2hhdCBpbXBvcnQgbWFwIHRvIHVzZSwgaWYgYW55LlxuICAgKi9cbiAgaW1wb3J0TWFwVVJMPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIFRoZSBEZW5vIHJlc29sdmVyIHBsdWdpbiBwZXJmb3JtcyByZWxhdGl2ZS0+YWJzb2x1dGUgc3BlY2lmaWVyIHJlc29sdXRpb25cbiAqIGFuZCBpbXBvcnQgbWFwIHJlc29sdXRpb24uXG4gKlxuICogSWYgdXNpbmcgdGhlIHtAbGluayBkZW5vTG9hZGVyUGx1Z2lufSwgdGhpcyBwbHVnaW4gbXVzdCBiZSB1c2VkIGJlZm9yZSB0aGVcbiAqIGxvYWRlciBwbHVnaW4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZW5vUmVzb2x2ZXJQbHVnaW4oXG4gIG9wdGlvbnM6IERlbm9SZXNvbHZlclBsdWdpbk9wdGlvbnMgPSB7fSxcbik6IGVzYnVpbGQuUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcImRlbm8tcmVzb2x2ZXJcIixcbiAgICBzZXR1cChidWlsZCkge1xuICAgICAgbGV0IGltcG9ydE1hcDogSW1wb3J0TWFwIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGNvbnN0IGV4dGVybmFsUmVnZXhwczogUmVnRXhwW10gPSAoYnVpbGQuaW5pdGlhbE9wdGlvbnMuZXh0ZXJuYWwgPz8gW10pXG4gICAgICAgIC5tYXAoKGV4dGVybmFsKSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVnZXhwID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAgIFwiXlwiICsgZXh0ZXJuYWwucmVwbGFjZSgvWy0vXFxcXF4kKz8uKCl8W1xcXXt9XS9nLCBcIlxcXFwkJlwiKS5yZXBsYWNlKFxuICAgICAgICAgICAgICAvXFwqL2csXG4gICAgICAgICAgICAgIFwiLipcIixcbiAgICAgICAgICAgICkgKyBcIiRcIixcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybiByZWdleHA7XG4gICAgICAgIH0pO1xuXG4gICAgICBidWlsZC5vblN0YXJ0KGFzeW5jIGZ1bmN0aW9uIG9uU3RhcnQoKSB7XG4gICAgICAgIGxldCBpbXBvcnRNYXBVUkw6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgICAgICAvLyBJZiBubyBpbXBvcnQgbWFwIFVSTCBpcyBzcGVjaWZpZWQsIGFuZCBhIGNvbmZpZyBpcyBzcGVjaWZpZWQsIHdlIHRyeVxuICAgICAgICAvLyB0byBnZXQgYW4gaW1wb3J0IG1hcCBmcm9tIHRoZSBjb25maWcuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBvcHRpb25zLmltcG9ydE1hcFVSTCA9PT0gdW5kZWZpbmVkICYmIG9wdGlvbnMuY29uZmlnUGF0aCAhPT0gdW5kZWZpbmVkXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IHJlYWREZW5vQ29uZmlnKG9wdGlvbnMuY29uZmlnUGF0aCk7XG4gICAgICAgICAgLy8gSWYgYGltcG9ydHNgIG9yIGBzY29wZXNgIGFyZSBzcGVjaWZpZWQsIHVzZSB0aGUgY29uZmlnIGZpbGUgYXMgdGhlXG4gICAgICAgICAgLy8gaW1wb3J0IG1hcCBkaXJlY3RseS5cbiAgICAgICAgICBpZiAoY29uZmlnLmltcG9ydHMgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuc2NvcGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ0ltcG9ydE1hcCA9IHtcbiAgICAgICAgICAgICAgaW1wb3J0czogY29uZmlnLmltcG9ydHMsXG4gICAgICAgICAgICAgIHNjb3BlczogY29uZmlnLnNjb3BlcyxcbiAgICAgICAgICAgIH0gYXMgSW1wb3J0TWFwO1xuICAgICAgICAgICAgZXhwYW5kRW1iZWRkZWRJbXBvcnRNYXAoY29uZmlnSW1wb3J0TWFwKTtcbiAgICAgICAgICAgIGltcG9ydE1hcCA9IHJlc29sdmVJbXBvcnRNYXAoXG4gICAgICAgICAgICAgIGNvbmZpZ0ltcG9ydE1hcCxcbiAgICAgICAgICAgICAgdG9GaWxlVXJsKG9wdGlvbnMuY29uZmlnUGF0aCksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmltcG9ydE1hcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBPdGhlcndpc2UsIHVzZSB0aGUgaW1wb3J0IG1hcCBVUkwgc3BlY2lmaWVkIGluIHRoZSBjb25maWcgZmlsZVxuICAgICAgICAgICAgaW1wb3J0TWFwVVJMID1cbiAgICAgICAgICAgICAgbmV3IFVSTChjb25maWcuaW1wb3J0TWFwLCB0b0ZpbGVVcmwob3B0aW9ucy5jb25maWdQYXRoKSkuaHJlZjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pbXBvcnRNYXBVUkwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGltcG9ydE1hcFVSTCA9IG9wdGlvbnMuaW1wb3J0TWFwVVJMO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhbiBpbXBvcnQgbWFwIFVSTCwgZmV0Y2ggaXQgYW5kIHBhcnNlIGl0LlxuICAgICAgICBpZiAoaW1wb3J0TWFwVVJMKSB7XG4gICAgICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoKGltcG9ydE1hcFVSTCk7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3AuanNvbigpO1xuICAgICAgICAgIGltcG9ydE1hcCA9IHJlc29sdmVJbXBvcnRNYXAoZGF0YSwgbmV3IFVSTChyZXNwLnVybCkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgYnVpbGQub25SZXNvbHZlKHsgZmlsdGVyOiAvLiovIH0sIGFzeW5jIGZ1bmN0aW9uIG9uUmVzb2x2ZShhcmdzKSB7XG4gICAgICAgIC8vIFBhc3MgdGhyb3VnaCBhbnkgbm9kZV9tb2R1bGVzIGludGVybmFsIHJlc29sdXRpb24uXG4gICAgICAgIGlmIChpc05vZGVNb2R1bGVzUmVzb2x1dGlvbihhcmdzKSkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgZmlyc3QgcGFzcyByZXNvbHZlciBwZXJmb3JtcyBzeW5jaHJvbm91cyByZXNvbHV0aW9uLiBUaGlzXG4gICAgICAgIC8vIGluY2x1ZGVzIHJlbGF0aXZlIHRvIGFic29sdXRlIHNwZWNpZmllciByZXNvbHV0aW9uIGFuZCBpbXBvcnQgbWFwXG4gICAgICAgIC8vIHJlc29sdXRpb24uXG5cbiAgICAgICAgLy8gV2UgaGF2ZSB0byBmaXJzdCBkZXRlcm1pbmUgdGhlIHJlZmVycmVyIFVSTCB0byB1c2Ugd2hlbiByZXNvbHZpbmdcbiAgICAgICAgLy8gdGhlIHNwZWNpZmllci4gVGhpcyBpcyBlaXRoZXIgdGhlIGltcG9ydGVyIFVSTCwgb3IgdGhlIHJlc29sdmVEaXJcbiAgICAgICAgLy8gVVJMIGlmIHRoZSBpbXBvcnRlciBpcyBub3Qgc3BlY2lmaWVkIChpZSBpZiB0aGUgc3BlY2lmaWVyIGlzIGF0IHRoZVxuICAgICAgICAvLyByb290KS5cbiAgICAgICAgbGV0IHJlZmVycmVyOiBVUkw7XG4gICAgICAgIGlmIChhcmdzLmltcG9ydGVyICE9PSBcIlwiKSB7XG4gICAgICAgICAgaWYgKGFyZ3MubmFtZXNwYWNlID09PSBcIlwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJbYXNzZXJ0XSBuYW1lc3BhY2UgaXMgZW1wdHlcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZmVycmVyID0gbmV3IFVSTChgJHthcmdzLm5hbWVzcGFjZX06JHthcmdzLmltcG9ydGVyfWApO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3MucmVzb2x2ZURpciAhPT0gXCJcIikge1xuICAgICAgICAgIHJlZmVycmVyID0gbmV3IFVSTChgJHt0b0ZpbGVVcmwoYXJncy5yZXNvbHZlRGlyKS5ocmVmfS9gKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgY2FuIHRoZW4gcmVzb2x2ZSB0aGUgc3BlY2lmaWVyIHJlbGF0aXZlIHRvIHRoZSByZWZlcnJlciBVUkwuIElmXG4gICAgICAgIC8vIGFuIGltcG9ydCBtYXAgaXMgc3BlY2lmaWVkLCB3ZSB1c2UgdGhhdCB0byByZXNvbHZlIHRoZSBzcGVjaWZpZXIuXG4gICAgICAgIGxldCByZXNvbHZlZDogVVJMO1xuICAgICAgICBpZiAoaW1wb3J0TWFwICE9PSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgcmVzID0gcmVzb2x2ZU1vZHVsZVNwZWNpZmllcihcbiAgICAgICAgICAgIGFyZ3MucGF0aCxcbiAgICAgICAgICAgIGltcG9ydE1hcCxcbiAgICAgICAgICAgIG5ldyBVUkwocmVmZXJyZXIpLFxuICAgICAgICAgICk7XG4gICAgICAgICAgcmVzb2x2ZWQgPSBuZXcgVVJMKHJlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzb2x2ZWQgPSBuZXcgVVJMKGFyZ3MucGF0aCwgcmVmZXJyZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBleHRlcm5hbFJlZ2V4cCBvZiBleHRlcm5hbFJlZ2V4cHMpIHtcbiAgICAgICAgICBpZiAoZXh0ZXJuYWxSZWdleHAudGVzdChyZXNvbHZlZC5ocmVmKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgcGF0aDogcmVzb2x2ZWQuaHJlZixcbiAgICAgICAgICAgICAgZXh0ZXJuYWw6IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdyBwYXNzIHRoZSByZXNvbHZlZCBzcGVjaWZpZXIgYmFjayBpbnRvIHRoZSByZXNvbHZlciwgZm9yIGEgc2Vjb25kXG4gICAgICAgIC8vIHBhc3MuIE5vdyBwbHVnaW5zIGNhbiBwZXJmb3JtIGFueSByZXNvbHV0aW9uIHRoZXkgd2FudCBvbiB0aGUgZnVsbHlcbiAgICAgICAgLy8gcmVzb2x2ZWQgc3BlY2lmaWVyLlxuICAgICAgICBjb25zdCB7IHBhdGgsIG5hbWVzcGFjZSB9ID0gdXJsVG9Fc2J1aWxkUmVzb2x1dGlvbihyZXNvbHZlZCk7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGJ1aWxkLnJlc29sdmUocGF0aCwge1xuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBraW5kOiBhcmdzLmtpbmQsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLFNBQVMsUUFBUSxzQkFBc0I7QUFDaEQsU0FFRSxnQkFBZ0IsRUFDaEIsc0JBQXNCLFFBQ2pCLCtCQUErQjtBQUV0QyxTQUNFLHVCQUF1QixFQUN2Qix1QkFBdUIsRUFDdkIsY0FBYyxFQUNkLHNCQUFzQixRQUNqQixjQUFjO0FBcUJyQjs7Ozs7O0NBTUMsR0FDRCxPQUFPLFNBQVMsbUJBQ2QsVUFBcUMsQ0FBQyxDQUFDO0VBRXZDLE9BQU87SUFDTCxNQUFNO0lBQ04sT0FBTSxLQUFLO01BQ1QsSUFBSSxZQUE4QjtNQUVsQyxNQUFNLGtCQUE0QixDQUFDLE1BQU0sY0FBYyxDQUFDLFFBQVEsSUFBSSxFQUFFLEVBQ25FLEdBQUcsQ0FBQyxDQUFDO1FBQ0osTUFBTSxTQUFTLElBQUksT0FDakIsTUFBTSxTQUFTLE9BQU8sQ0FBQyx3QkFBd0Is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
// denoCacheMetadata=4733105481229037019,13165838786386726085