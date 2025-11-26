import { fromFileUrl } from "jsr:@std/path@0.213";
import { mapContentType, mediaTypeToLoader, parseJsrSpecifier, parseNpmSpecifier } from "./shared.ts";
const JSR_REGISTRY_URL = Deno.env.get("DENO_REGISTRY_URL") ?? "https://jsr.io";
async function readLockfile(path) {
  try {
    const data = await Deno.readTextFile(path);
    return JSON.parse(data);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return null;
    }
    throw err;
  }
}
export class PortableLoader {
  #options;
  #fetchOngoing = new Map();
  #lockfile;
  #fetchModules = new Map();
  #fetchRedirects = new Map();
  constructor(options){
    this.#options = options;
  }
  async resolve(specifier) {
    switch(specifier.protocol){
      case "file:":
        {
          return {
            kind: "esm",
            specifier
          };
        }
      case "http:":
      case "https:":
      case "data:":
        {
          const module = await this.#loadRemote(specifier.href);
          return {
            kind: "esm",
            specifier: new URL(module.specifier)
          };
        }
      case "npm:":
        {
          const npmSpecifier = parseNpmSpecifier(specifier);
          return {
            kind: "npm",
            packageId: "",
            packageName: npmSpecifier.name,
            path: npmSpecifier.path ?? ""
          };
        }
      case "node:":
        {
          return {
            kind: "node",
            path: specifier.pathname
          };
        }
      case "jsr:":
        {
          const resolvedSpecifier = await this.#resolveJsrSpecifier(specifier);
          return {
            kind: "esm",
            specifier: resolvedSpecifier
          };
        }
      default:
        throw new Error(`Unsupported scheme: '${specifier.protocol}'`);
    }
  }
  async #resolveJsrSpecifier(specifier) {
    // parse the JSR specifier.
    const jsrSpecifier = parseJsrSpecifier(specifier);
    // Attempt to load the lockfile.
    if (this.#lockfile === undefined) {
      this.#lockfile = typeof this.#options.lock === "string" ? readLockfile(this.#options.lock) : null;
    }
    if (this.#lockfile instanceof Promise) {
      this.#lockfile = await this.#lockfile;
    }
    if (this.#lockfile === null) {
      throw new Error("jsr: specifiers are not supported in the portable loader without a lockfile");
    }
    const lockfile = this.#lockfile;
    if (lockfile.version !== "3") {
      throw new Error("Unsupported lockfile version: " + lockfile.version);
    }
    // Look up the package + constraint in the lockfile.
    const id = `jsr:${jsrSpecifier.name}${jsrSpecifier.version ? `@${jsrSpecifier.version}` : ""}`;
    const lockfileEntry = lockfile.packages?.specifiers?.[id];
    if (!lockfileEntry) {
      throw new Error(`Specifier not found in lockfile: ${id}`);
    }
    const lockfileEntryParsed = parseJsrSpecifier(new URL(lockfileEntry));
    // Load the JSR manifest to find the export path.
    const manifestUrl = new URL(`./${lockfileEntryParsed.name}/${lockfileEntryParsed.version}_meta.json`, JSR_REGISTRY_URL);
    const manifest = await this.#loadRemote(manifestUrl.href);
    if (manifest.mediaType !== "Json") {
      throw new Error(`Expected JSON media type for JSR manifest, got: ${manifest.mediaType}`);
    }
    const manifestData = new TextDecoder().decode(manifest.data);
    const manifestJson = JSON.parse(manifestData);
    // Look up the export path in the manifest.
    const exportEntry = `.${jsrSpecifier.path ?? ""}`;
    const exportPath = manifestJson.exports[exportEntry];
    if (!exportPath) {
      throw new Error(`Package '${lockfileEntry}' has no export named '${exportEntry}'`);
    }
    // Return the resolved URL.
    return new URL(`./${lockfileEntryParsed.name}/${lockfileEntryParsed.version}/${exportPath}`, JSR_REGISTRY_URL);
  }
  async loadEsm(url) {
    let module;
    switch(url.protocol){
      case "file:":
        {
          module = await this.#loadLocal(url);
          break;
        }
      case "http:":
      case "https:":
      case "data:":
        {
          module = await this.#loadRemote(url.href);
          break;
        }
      default:
        throw new Error("[unreachable] unsupported esm scheme " + url.protocol);
    }
    const loader = mediaTypeToLoader(module.mediaType);
    const res = {
      contents: module.data,
      loader
    };
    if (url.protocol === "file:") {
      res.watchFiles = [
        fromFileUrl(module.specifier)
      ];
    }
    return res;
  }
  #resolveRemote(specifier) {
    return this.#fetchRedirects.get(specifier) ?? specifier;
  }
  async #loadRemote(specifier) {
    for(let i = 0; i < 10; i++){
      specifier = this.#resolveRemote(specifier);
      const module = this.#fetchModules.get(specifier);
      if (module) return module;
      let promise = this.#fetchOngoing.get(specifier);
      if (!promise) {
        promise = this.#fetch(specifier);
        this.#fetchOngoing.set(specifier, promise);
      }
      await promise;
    }
    throw new Error("Too many redirects. Last one: " + specifier);
  }
  async #fetch(specifier) {
    const resp = await fetch(specifier, {
      redirect: "manual"
    });
    if (resp.status < 200 && resp.status >= 400) {
      throw new Error(`Encountered status code ${resp.status} while fetching ${specifier}.`);
    }
    if (resp.status >= 300 && resp.status < 400) {
      await resp.body?.cancel();
      const location = resp.headers.get("location");
      if (!location) {
        throw new Error(`Redirected without location header while fetching ${specifier}.`);
      }
      const url = new URL(location, specifier);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error(`Redirected to unsupported protocol '${url.protocol}' while fetching ${specifier}.`);
      }
      this.#fetchRedirects.set(specifier, url.href);
      return;
    }
    const contentType = resp.headers.get("content-type");
    const mediaType = mapContentType(new URL(specifier), contentType);
    const data = new Uint8Array(await resp.arrayBuffer());
    this.#fetchModules.set(specifier, {
      specifier,
      mediaType,
      data
    });
  }
  async #loadLocal(specifier) {
    const path = fromFileUrl(specifier);
    const mediaType = mapContentType(specifier, null);
    const data = await Deno.readFile(path);
    return {
      specifier: specifier.href,
      mediaType,
      data
    };
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BsdWNhL2VzYnVpbGQtZGVuby1sb2FkZXIvMC4xMC4zL3NyYy9sb2FkZXJfcG9ydGFibGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgKiBhcyBlc2J1aWxkIGZyb20gXCIuL2VzYnVpbGRfdHlwZXMudHNcIjtcbmltcG9ydCB7IGZyb21GaWxlVXJsIH0gZnJvbSBcImpzcjpAc3RkL3BhdGhAMC4yMTNcIjtcbmltcG9ydCAqIGFzIGRlbm8gZnJvbSBcIi4vZGVuby50c1wiO1xuaW1wb3J0IHtcbiAgTG9hZGVyLFxuICBMb2FkZXJSZXNvbHV0aW9uLFxuICBtYXBDb250ZW50VHlwZSxcbiAgbWVkaWFUeXBlVG9Mb2FkZXIsXG4gIHBhcnNlSnNyU3BlY2lmaWVyLFxuICBwYXJzZU5wbVNwZWNpZmllcixcbn0gZnJvbSBcIi4vc2hhcmVkLnRzXCI7XG5cbmludGVyZmFjZSBNb2R1bGUge1xuICBzcGVjaWZpZXI6IHN0cmluZztcbiAgbWVkaWFUeXBlOiBkZW5vLk1lZGlhVHlwZTtcbiAgZGF0YTogVWludDhBcnJheTtcbn1cblxuY29uc3QgSlNSX1JFR0lTVFJZX1VSTCA9IERlbm8uZW52LmdldChcIkRFTk9fUkVHSVNUUllfVVJMXCIpID8/IFwiaHR0cHM6Ly9qc3IuaW9cIjtcblxuYXN5bmMgZnVuY3Rpb24gcmVhZExvY2tmaWxlKHBhdGg6IHN0cmluZyk6IFByb21pc2U8ZGVuby5Mb2NrZmlsZSB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUocGF0aCk7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5pbnRlcmZhY2UgUG9ydGFibGVMb2FkZXJPcHRpb25zIHtcbiAgbG9jaz86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFBvcnRhYmxlTG9hZGVyIGltcGxlbWVudHMgTG9hZGVyIHtcbiAgI29wdGlvbnM6IFBvcnRhYmxlTG9hZGVyT3B0aW9ucztcbiAgI2ZldGNoT25nb2luZyA9IG5ldyBNYXA8c3RyaW5nLCBQcm9taXNlPHZvaWQ+PigpO1xuICAjbG9ja2ZpbGU6IFByb21pc2U8ZGVuby5Mb2NrZmlsZSB8IG51bGw+IHwgZGVuby5Mb2NrZmlsZSB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgI2ZldGNoTW9kdWxlcyA9IG5ldyBNYXA8c3RyaW5nLCBNb2R1bGU+KCk7XG4gICNmZXRjaFJlZGlyZWN0cyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogUG9ydGFibGVMb2FkZXJPcHRpb25zKSB7XG4gICAgdGhpcy4jb3B0aW9ucyA9IG9wdGlvbnM7XG4gIH1cblxuICBhc3luYyByZXNvbHZlKHNwZWNpZmllcjogVVJMKTogUHJvbWlzZTxMb2FkZXJSZXNvbHV0aW9uPiB7XG4gICAgc3dpdGNoIChzcGVjaWZpZXIucHJvdG9jb2wpIHtcbiAgICAgIGNhc2UgXCJmaWxlOlwiOiB7XG4gICAgICAgIHJldHVybiB7IGtpbmQ6IFwiZXNtXCIsIHNwZWNpZmllciB9O1xuICAgICAgfVxuICAgICAgY2FzZSBcImh0dHA6XCI6XG4gICAgICBjYXNlIFwiaHR0cHM6XCI6XG4gICAgICBjYXNlIFwiZGF0YTpcIjoge1xuICAgICAgICBjb25zdCBtb2R1bGUgPSBhd2FpdCB0aGlzLiNsb2FkUmVtb3RlKHNwZWNpZmllci5ocmVmKTtcbiAgICAgICAgcmV0dXJuIHsga2luZDogXCJlc21cIiwgc3BlY2lmaWVyOiBuZXcgVVJMKG1vZHVsZS5zcGVjaWZpZXIpIH07XG4gICAgICB9XG4gICAgICBjYXNlIFwibnBtOlwiOiB7XG4gICAgICAgIGNvbnN0IG5wbVNwZWNpZmllciA9IHBhcnNlTnBtU3BlY2lmaWVyKHNwZWNpZmllcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAga2luZDogXCJucG1cIixcbiAgICAgICAgICBwYWNrYWdlSWQ6IFwiXCIsXG4gICAgICAgICAgcGFja2FnZU5hbWU6IG5wbVNwZWNpZmllci5uYW1lLFxuICAgICAgICAgIHBhdGg6IG5wbVNwZWNpZmllci5wYXRoID8/IFwiXCIsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjYXNlIFwibm9kZTpcIjoge1xuICAgICAgICByZXR1cm4geyBraW5kOiBcIm5vZGVcIiwgcGF0aDogc3BlY2lmaWVyLnBhdGhuYW1lIH07XG4gICAgICB9XG4gICAgICBjYXNlIFwianNyOlwiOiB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkU3BlY2lmaWVyID0gYXdhaXQgdGhpcy4jcmVzb2x2ZUpzclNwZWNpZmllcihzcGVjaWZpZXIpO1xuICAgICAgICByZXR1cm4geyBraW5kOiBcImVzbVwiLCBzcGVjaWZpZXI6IHJlc29sdmVkU3BlY2lmaWVyIH07XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHNjaGVtZTogJyR7c3BlY2lmaWVyLnByb3RvY29sfSdgKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyAjcmVzb2x2ZUpzclNwZWNpZmllcihzcGVjaWZpZXI6IFVSTCk6IFByb21pc2U8VVJMPiB7XG4gICAgLy8gcGFyc2UgdGhlIEpTUiBzcGVjaWZpZXIuXG4gICAgY29uc3QganNyU3BlY2lmaWVyID0gcGFyc2VKc3JTcGVjaWZpZXIoc3BlY2lmaWVyKTtcblxuICAgIC8vIEF0dGVtcHQgdG8gbG9hZCB0aGUgbG9ja2ZpbGUuXG4gICAgaWYgKHRoaXMuI2xvY2tmaWxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuI2xvY2tmaWxlID0gdHlwZW9mIHRoaXMuI29wdGlvbnMubG9jayA9PT0gXCJzdHJpbmdcIlxuICAgICAgICA/IHJlYWRMb2NrZmlsZSh0aGlzLiNvcHRpb25zLmxvY2spXG4gICAgICAgIDogbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMuI2xvY2tmaWxlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgdGhpcy4jbG9ja2ZpbGUgPSBhd2FpdCB0aGlzLiNsb2NrZmlsZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuI2xvY2tmaWxlID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwianNyOiBzcGVjaWZpZXJzIGFyZSBub3Qgc3VwcG9ydGVkIGluIHRoZSBwb3J0YWJsZSBsb2FkZXIgd2l0aG91dCBhIGxvY2tmaWxlXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBsb2NrZmlsZSA9IHRoaXMuI2xvY2tmaWxlO1xuICAgIGlmIChsb2NrZmlsZS52ZXJzaW9uICE9PSBcIjNcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIlVuc3VwcG9ydGVkIGxvY2tmaWxlIHZlcnNpb246IFwiICsgbG9ja2ZpbGUudmVyc2lvbixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gTG9vayB1cCB0aGUgcGFja2FnZSArIGNvbnN0cmFpbnQgaW4gdGhlIGxvY2tmaWxlLlxuICAgIGNvbnN0IGlkID0gYGpzcjoke2pzclNwZWNpZmllci5uYW1lfSR7XG4gICAgICBqc3JTcGVjaWZpZXIudmVyc2lvbiA/IGBAJHtqc3JTcGVjaWZpZXIudmVyc2lvbn1gIDogXCJcIlxuICAgIH1gO1xuICAgIGNvbnN0IGxvY2tmaWxlRW50cnkgPSBsb2NrZmlsZS5wYWNrYWdlcz8uc3BlY2lmaWVycz8uW2lkXTtcbiAgICBpZiAoIWxvY2tmaWxlRW50cnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU3BlY2lmaWVyIG5vdCBmb3VuZCBpbiBsb2NrZmlsZTogJHtpZH1gKTtcbiAgICB9XG4gICAgY29uc3QgbG9ja2ZpbGVFbnRyeVBhcnNlZCA9IHBhcnNlSnNyU3BlY2lmaWVyKG5ldyBVUkwobG9ja2ZpbGVFbnRyeSkpO1xuXG4gICAgLy8gTG9hZCB0aGUgSlNSIG1hbmlmZXN0IHRvIGZpbmQgdGhlIGV4cG9ydCBwYXRoLlxuICAgIGNvbnN0IG1hbmlmZXN0VXJsID0gbmV3IFVSTChcbiAgICAgIGAuLyR7bG9ja2ZpbGVFbnRyeVBhcnNlZC5uYW1lfS8ke2xvY2tmaWxlRW50cnlQYXJzZWRcbiAgICAgICAgLnZlcnNpb24hfV9tZXRhLmpzb25gLFxuICAgICAgSlNSX1JFR0lTVFJZX1VSTCxcbiAgICApO1xuICAgIGNvbnN0IG1hbmlmZXN0ID0gYXdhaXQgdGhpcy4jbG9hZFJlbW90ZShtYW5pZmVzdFVybC5ocmVmKTtcbiAgICBpZiAobWFuaWZlc3QubWVkaWFUeXBlICE9PSBcIkpzb25cIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRXhwZWN0ZWQgSlNPTiBtZWRpYSB0eXBlIGZvciBKU1IgbWFuaWZlc3QsIGdvdDogJHttYW5pZmVzdC5tZWRpYVR5cGV9YCxcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IG1hbmlmZXN0RGF0YSA9IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShtYW5pZmVzdC5kYXRhKTtcbiAgICBjb25zdCBtYW5pZmVzdEpzb24gPSBKU09OLnBhcnNlKG1hbmlmZXN0RGF0YSk7XG5cbiAgICAvLyBMb29rIHVwIHRoZSBleHBvcnQgcGF0aCBpbiB0aGUgbWFuaWZlc3QuXG4gICAgY29uc3QgZXhwb3J0RW50cnkgPSBgLiR7anNyU3BlY2lmaWVyLnBhdGggPz8gXCJcIn1gO1xuICAgIGNvbnN0IGV4cG9ydFBhdGggPSBtYW5pZmVzdEpzb24uZXhwb3J0c1tleHBvcnRFbnRyeV07XG4gICAgaWYgKCFleHBvcnRQYXRoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBQYWNrYWdlICcke2xvY2tmaWxlRW50cnl9JyBoYXMgbm8gZXhwb3J0IG5hbWVkICcke2V4cG9ydEVudHJ5fSdgLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIHJlc29sdmVkIFVSTC5cbiAgICByZXR1cm4gbmV3IFVSTChcbiAgICAgIGAuLyR7bG9ja2ZpbGVFbnRyeVBhcnNlZC5uYW1lfS8ke2xvY2tmaWxlRW50cnlQYXJzZWRcbiAgICAgICAgLnZlcnNpb24hfS8ke2V4cG9ydFBhdGh9YCxcbiAgICAgIEpTUl9SRUdJU1RSWV9VUkwsXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRFc20odXJsOiBVUkwpOiBQcm9taXNlPGVzYnVpbGQuT25Mb2FkUmVzdWx0PiB7XG4gICAgbGV0IG1vZHVsZTogTW9kdWxlO1xuICAgIHN3aXRjaCAodXJsLnByb3RvY29sKSB7XG4gICAgICBjYXNlIFwiZmlsZTpcIjoge1xuICAgICAgICBtb2R1bGUgPSBhd2FpdCB0aGlzLiNsb2FkTG9jYWwodXJsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiaHR0cDpcIjpcbiAgICAgIGNhc2UgXCJodHRwczpcIjpcbiAgICAgIGNhc2UgXCJkYXRhOlwiOiB7XG4gICAgICAgIG1vZHVsZSA9IGF3YWl0IHRoaXMuI2xvYWRSZW1vdGUodXJsLmhyZWYpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlt1bnJlYWNoYWJsZV0gdW5zdXBwb3J0ZWQgZXNtIHNjaGVtZSBcIiArIHVybC5wcm90b2NvbCk7XG4gICAgfVxuXG4gICAgY29uc3QgbG9hZGVyID0gbWVkaWFUeXBlVG9Mb2FkZXIobW9kdWxlLm1lZGlhVHlwZSk7XG5cbiAgICBjb25zdCByZXM6IGVzYnVpbGQuT25Mb2FkUmVzdWx0ID0geyBjb250ZW50czogbW9kdWxlLmRhdGEsIGxvYWRlciB9O1xuICAgIGlmICh1cmwucHJvdG9jb2wgPT09IFwiZmlsZTpcIikge1xuICAgICAgcmVzLndhdGNoRmlsZXMgPSBbZnJvbUZpbGVVcmwobW9kdWxlLnNwZWNpZmllcildO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgI3Jlc29sdmVSZW1vdGUoc3BlY2lmaWVyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNmZXRjaFJlZGlyZWN0cy5nZXQoc3BlY2lmaWVyKSA/PyBzcGVjaWZpZXI7XG4gIH1cblxuICBhc3luYyAjbG9hZFJlbW90ZShzcGVjaWZpZXI6IHN0cmluZyk6IFByb21pc2U8TW9kdWxlPiB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICBzcGVjaWZpZXIgPSB0aGlzLiNyZXNvbHZlUmVtb3RlKHNwZWNpZmllcik7XG4gICAgICBjb25zdCBtb2R1bGUgPSB0aGlzLiNmZXRjaE1vZHVsZXMuZ2V0KHNwZWNpZmllcik7XG4gICAgICBpZiAobW9kdWxlKSByZXR1cm4gbW9kdWxlO1xuXG4gICAgICBsZXQgcHJvbWlzZSA9IHRoaXMuI2ZldGNoT25nb2luZy5nZXQoc3BlY2lmaWVyKTtcbiAgICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgICBwcm9taXNlID0gdGhpcy4jZmV0Y2goc3BlY2lmaWVyKTtcbiAgICAgICAgdGhpcy4jZmV0Y2hPbmdvaW5nLnNldChzcGVjaWZpZXIsIHByb21pc2UpO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBwcm9taXNlO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcIlRvbyBtYW55IHJlZGlyZWN0cy4gTGFzdCBvbmU6IFwiICsgc3BlY2lmaWVyKTtcbiAgfVxuXG4gIGFzeW5jICNmZXRjaChzcGVjaWZpZXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBmZXRjaChzcGVjaWZpZXIsIHtcbiAgICAgIHJlZGlyZWN0OiBcIm1hbnVhbFwiLFxuICAgIH0pO1xuICAgIGlmIChyZXNwLnN0YXR1cyA8IDIwMCAmJiByZXNwLnN0YXR1cyA+PSA0MDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEVuY291bnRlcmVkIHN0YXR1cyBjb2RlICR7cmVzcC5zdGF0dXN9IHdoaWxlIGZldGNoaW5nICR7c3BlY2lmaWVyfS5gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAocmVzcC5zdGF0dXMgPj0gMzAwICYmIHJlc3Auc3RhdHVzIDwgNDAwKSB7XG4gICAgICBhd2FpdCByZXNwLmJvZHk/LmNhbmNlbCgpO1xuICAgICAgY29uc3QgbG9jYXRpb24gPSByZXNwLmhlYWRlcnMuZ2V0KFwibG9jYXRpb25cIik7XG4gICAgICBpZiAoIWxvY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgUmVkaXJlY3RlZCB3aXRob3V0IGxvY2F0aW9uIGhlYWRlciB3aGlsZSBmZXRjaGluZyAke3NwZWNpZmllcn0uYCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChsb2NhdGlvbiwgc3BlY2lmaWVyKTtcbiAgICAgIGlmICh1cmwucHJvdG9jb2wgIT09IFwiaHR0cHM6XCIgJiYgdXJsLnByb3RvY29sICE9PSBcImh0dHA6XCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBSZWRpcmVjdGVkIHRvIHVuc3VwcG9ydGVkIHByb3RvY29sICcke3VybC5wcm90b2NvbH0nIHdoaWxlIGZldGNoaW5nICR7c3BlY2lmaWVyfS5gLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICB0aGlzLiNmZXRjaFJlZGlyZWN0cy5zZXQoc3BlY2lmaWVyLCB1cmwuaHJlZik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29udGVudFR5cGUgPSByZXNwLmhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpO1xuICAgIGNvbnN0IG1lZGlhVHlwZSA9IG1hcENvbnRlbnRUeXBlKG5ldyBVUkwoc3BlY2lmaWVyKSwgY29udGVudFR5cGUpO1xuXG4gICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IHJlc3AuYXJyYXlCdWZmZXIoKSk7XG4gICAgdGhpcy4jZmV0Y2hNb2R1bGVzLnNldChzcGVjaWZpZXIsIHtcbiAgICAgIHNwZWNpZmllcixcbiAgICAgIG1lZGlhVHlwZSxcbiAgICAgIGRhdGEsXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyAjbG9hZExvY2FsKHNwZWNpZmllcjogVVJMKTogUHJvbWlzZTxNb2R1bGU+IHtcbiAgICBjb25zdCBwYXRoID0gZnJvbUZpbGVVcmwoc3BlY2lmaWVyKTtcblxuICAgIGNvbnN0IG1lZGlhVHlwZSA9IG1hcENvbnRlbnRUeXBlKHNwZWNpZmllciwgbnVsbCk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IERlbm8ucmVhZEZpbGUocGF0aCk7XG5cbiAgICByZXR1cm4geyBzcGVjaWZpZXI6IHNwZWNpZmllci5ocmVmLCBtZWRpYVR5cGUsIGRhdGEgfTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsV0FBVyxRQUFRLHNCQUFzQjtBQUVsRCxTQUdFLGNBQWMsRUFDZCxpQkFBaUIsRUFDakIsaUJBQWlCLEVBQ2pCLGlCQUFpQixRQUNaLGNBQWM7QUFRckIsTUFBTSxtQkFBbUIsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLHdCQUF3QjtBQUU5RCxlQUFlLGFBQWEsSUFBWTtFQUN0QyxJQUFJO0lBQ0YsTUFBTSxPQUFPLE1BQU0sS0FBSyxZQUFZLENBQUM7SUFDckMsT0FBTyxLQUFLLEtBQUssQ0FBQztFQUNwQixFQUFFLE9BQU8sS0FBSztJQUNaLElBQUksZUFBZSxLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUU7TUFDdkMsT0FBTztJQUNUO0lBQ0EsTUFBTTtFQUNSO0FBQ0Y7QUFNQSxPQUFPLE1BQU07RUFDWCxDQUFBLE9BQVEsQ0FBd0I7RUFDaEMsQ0FBQSxZQUFhLEdBQUcsSUFBSSxNQUE2QjtFQUNqRCxDQUFBLFFBQVMsQ0FBbUU7RUFFNUUsQ0FBQSxZQUFhLEdBQUcsSUFBSSxNQUFzQjtFQUMxQyxDQUFBLGNBQWUsR0FBRyxJQUFJLE1BQXNCO0VBRTVDLFlBQVksT0FBOEIs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
// denoCacheMetadata=11819840438658399428,3923515630729934898