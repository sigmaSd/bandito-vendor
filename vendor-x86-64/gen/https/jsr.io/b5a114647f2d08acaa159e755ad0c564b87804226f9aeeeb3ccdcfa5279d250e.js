import { extname, fromFileUrl, SEPARATOR, toFileUrl } from "jsr:@std/path@0.213";
import * as JSONC from "jsr:@std/jsonc@0.213";
export function mediaTypeToLoader(mediaType) {
  switch(mediaType){
    case "JavaScript":
    case "Mjs":
      return "js";
    case "JSX":
      return "jsx";
    case "TypeScript":
    case "Mts":
      return "ts";
    case "TSX":
      return "tsx";
    case "Json":
      return "json";
    default:
      throw new Error(`Unhandled media type ${mediaType}.`);
  }
}
/**
 * Turn a URL into an {@link EsbuildResolution} by splitting the URL into a
 * namespace and path.
 *
 * For file URLs, the path returned is a file path not a URL path representing a
 * file.
 */ export function urlToEsbuildResolution(url) {
  if (url.protocol === "file:") {
    return {
      path: fromFileUrl(url),
      namespace: "file"
    };
  }
  const namespace = url.protocol.slice(0, -1);
  const path = url.href.slice(namespace.length + 1);
  return {
    path,
    namespace
  };
}
/**
 * Turn an {@link EsbuildResolution} into a URL by joining the namespace and
 * path into a URL string.
 *
 * For file URLs, the path is interpreted as a file path not as a URL path
 * representing a file.
 */ export function esbuildResolutionToURL(specifier) {
  if (specifier.namespace === "file") {
    return toFileUrl(specifier.path);
  }
  return new URL(`${specifier.namespace}:${specifier.path}`);
}
export async function readDenoConfig(path) {
  const file = await Deno.readTextFile(path);
  const res = JSONC.parse(file);
  if (typeof res !== "object" || res === null || Array.isArray(res)) {
    throw new Error(`Deno config at ${path} must be an object`);
  }
  if ("imports" in res && (typeof res.imports !== "object" || res.imports === null || Array.isArray(res.imports))) {
    throw new Error(`Deno config at ${path} has invalid "imports" key`);
  }
  if ("scopes" in res && (typeof res.scopes !== "object" || res.scopes === null || Array.isArray(res.scopes))) {
    throw new Error(`Deno config at ${path} has invalid "scopes" key`);
  }
  if ("lock" in res && typeof res.lock !== "boolean" && typeof res.lock !== "string") {
    throw new Error(`Deno config at ${path} has invalid "lock" key`);
  }
  if ("importMap" in res && typeof res.importMap !== "string") {
    throw new Error(`Deno config at ${path} has invalid "importMap" key`);
  }
  return res;
}
export function mapContentType(specifier, contentType) {
  if (contentType !== null) {
    const contentTypes = contentType.split(";");
    const mediaType = contentTypes[0].toLowerCase();
    switch(mediaType){
      case "application/typescript":
      case "text/typescript":
      case "video/vnd.dlna.mpeg-tts":
      case "video/mp2t":
      case "application/x-typescript":
        return mapJsLikeExtension(specifier, "TypeScript");
      case "application/javascript":
      case "text/javascript":
      case "application/ecmascript":
      case "text/ecmascript":
      case "application/x-javascript":
      case "application/node":
        return mapJsLikeExtension(specifier, "JavaScript");
      case "text/jsx":
        return "JSX";
      case "text/tsx":
        return "TSX";
      case "application/json":
      case "text/json":
        return "Json";
      case "application/wasm":
        return "Wasm";
      case "text/plain":
      case "application/octet-stream":
        return mediaTypeFromSpecifier(specifier);
      default:
        return "Unknown";
    }
  } else {
    return mediaTypeFromSpecifier(specifier);
  }
}
function mapJsLikeExtension(specifier, defaultType) {
  const path = specifier.pathname;
  switch(extname(path)){
    case ".jsx":
      return "JSX";
    case ".mjs":
      return "Mjs";
    case ".cjs":
      return "Cjs";
    case ".tsx":
      return "TSX";
    case ".ts":
      if (path.endsWith(".d.ts")) {
        return "Dts";
      } else {
        return defaultType;
      }
    case ".mts":
      {
        if (path.endsWith(".d.mts")) {
          return "Dmts";
        } else {
          return defaultType == "JavaScript" ? "Mjs" : "Mts";
        }
      }
    case ".cts":
      {
        if (path.endsWith(".d.cts")) {
          return "Dcts";
        } else {
          return defaultType == "JavaScript" ? "Cjs" : "Cts";
        }
      }
    default:
      return defaultType;
  }
}
function mediaTypeFromSpecifier(specifier) {
  const path = specifier.pathname;
  switch(extname(path)){
    case "":
      if (path.endsWith("/.tsbuildinfo")) {
        return "TsBuildInfo";
      } else {
        return "Unknown";
      }
    case ".ts":
      if (path.endsWith(".d.ts")) {
        return "Dts";
      } else {
        return "TypeScript";
      }
    case ".mts":
      if (path.endsWith(".d.mts")) {
        return "Dmts";
      } else {
        return "Mts";
      }
    case ".cts":
      if (path.endsWith(".d.cts")) {
        return "Dcts";
      } else {
        return "Cts";
      }
    case ".tsx":
      return "TSX";
    case ".js":
      return "JavaScript";
    case ".jsx":
      return "JSX";
    case ".mjs":
      return "Mjs";
    case ".cjs":
      return "Cjs";
    case ".json":
      return "Json";
    case ".wasm":
      return "Wasm";
    case ".tsbuildinfo":
      return "TsBuildInfo";
    case ".map":
      return "SourceMap";
    default:
      return "Unknown";
  }
}
export function parseNpmSpecifier(specifier) {
  if (specifier.protocol !== "npm:") throw new Error("Invalid npm specifier");
  const path = specifier.pathname;
  const startIndex = path[0] === "/" ? 1 : 0;
  let pathStartIndex;
  let versionStartIndex;
  if (path[startIndex] === "@") {
    const firstSlash = path.indexOf("/", startIndex);
    if (firstSlash === -1) {
      throw new Error(`Invalid npm specifier: ${specifier}`);
    }
    pathStartIndex = path.indexOf("/", firstSlash + 1);
    versionStartIndex = path.indexOf("@", firstSlash + 1);
  } else {
    pathStartIndex = path.indexOf("/", startIndex);
    versionStartIndex = path.indexOf("@", startIndex);
  }
  if (pathStartIndex === -1) pathStartIndex = path.length;
  if (versionStartIndex === -1) versionStartIndex = path.length;
  if (versionStartIndex > pathStartIndex) {
    versionStartIndex = pathStartIndex;
  }
  if (startIndex === versionStartIndex) {
    throw new Error(`Invalid npm specifier: ${specifier}`);
  }
  return {
    name: path.slice(startIndex, versionStartIndex),
    version: versionStartIndex === pathStartIndex ? null : path.slice(versionStartIndex + 1, pathStartIndex),
    path: pathStartIndex === path.length ? null : path.slice(pathStartIndex)
  };
}
export function parseJsrSpecifier(specifier) {
  if (specifier.protocol !== "jsr:") throw new Error("Invalid jsr specifier");
  const path = specifier.pathname;
  const startIndex = path[0] === "/" ? 1 : 0;
  if (path[startIndex] !== "@") {
    throw new Error(`Invalid jsr specifier: ${specifier}`);
  }
  const firstSlash = path.indexOf("/", startIndex);
  if (firstSlash === -1) {
    throw new Error(`Invalid jsr specifier: ${specifier}`);
  }
  let pathStartIndex = path.indexOf("/", firstSlash + 1);
  let versionStartIndex = path.indexOf("@", firstSlash + 1);
  if (pathStartIndex === -1) pathStartIndex = path.length;
  if (versionStartIndex === -1) versionStartIndex = path.length;
  if (versionStartIndex > pathStartIndex) {
    versionStartIndex = pathStartIndex;
  }
  if (startIndex === versionStartIndex) {
    throw new Error(`Invalid jsr specifier: ${specifier}`);
  }
  return {
    name: path.slice(startIndex, versionStartIndex),
    version: versionStartIndex === pathStartIndex ? null : path.slice(versionStartIndex + 1, pathStartIndex),
    path: pathStartIndex === path.length ? null : path.slice(pathStartIndex)
  };
}
// For all pairs in `imports` where the specifier does not end in a /, and the
// target starts with `jsr:` or `npm:`, and no entry exists for `${specifier}/`,
// add an entry for `${specifier}/` pointing to the target with a / appended,
// and a `/` appended to the scheme, if none is present there.
export function expandEmbeddedImportMap(importMap) {
  if (importMap.imports !== undefined) {
    const newImports = [];
    for (const [specifier, target] of Object.entries(importMap.imports)){
      newImports.push([
        specifier,
        target
      ]);
      if (!specifier.endsWith("/") && target && (target.startsWith("jsr:") || target.startsWith("npm:")) && !importMap.imports[specifier + "/"]) {
        const newSpecifier = specifier + "/";
        const newTarget = target.slice(0, 4) + "/" + target.slice(target[4] === "/" ? 5 : 4) + "/";
        newImports.push([
          newSpecifier,
          newTarget
        ]);
      }
    }
    importMap.imports = Object.fromEntries(newImports);
  }
}
const SLASH_NODE_MODULES_SLASH = `${SEPARATOR}node_modules${SEPARATOR}`;
const SLASH_NODE_MODULES = `${SEPARATOR}node_modules`;
export function isInNodeModules(path) {
  return path.includes(SLASH_NODE_MODULES_SLASH) || path.endsWith(SLASH_NODE_MODULES);
}
export function isNodeModulesResolution(args) {
  return (args.namespace === "" || args.namespace === "file") && (isInNodeModules(args.resolveDir) || isInNodeModules(args.path) || isInNodeModules(args.importer));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BsdWNhL2VzYnVpbGQtZGVuby1sb2FkZXIvMC4xMC4zL3NyYy9zaGFyZWQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXh0bmFtZSwgZnJvbUZpbGVVcmwsIFNFUEFSQVRPUiwgdG9GaWxlVXJsIH0gZnJvbSBcImpzcjpAc3RkL3BhdGhAMC4yMTNcIjtcbmltcG9ydCAqIGFzIEpTT05DIGZyb20gXCJqc3I6QHN0ZC9qc29uY0AwLjIxM1wiO1xuaW1wb3J0IHsgSW1wb3J0TWFwIH0gZnJvbSBcIi4uL3ZlbmRvci94L2ltcG9ydG1hcC9tb2QudHNcIjtcbmltcG9ydCB7IE1lZGlhVHlwZSB9IGZyb20gXCIuL2Rlbm8udHNcIjtcbmltcG9ydCB0eXBlICogYXMgZXNidWlsZCBmcm9tIFwiLi9lc2J1aWxkX3R5cGVzLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9hZGVyIHtcbiAgcmVzb2x2ZShzcGVjaWZpZXI6IFVSTCk6IFByb21pc2U8TG9hZGVyUmVzb2x1dGlvbj47XG4gIGxvYWRFc20oc3BlY2lmaWVyOiBVUkwpOiBQcm9taXNlPGVzYnVpbGQuT25Mb2FkUmVzdWx0PjtcblxuICBwYWNrYWdlSWRGcm9tTmFtZUluUGFja2FnZT8oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHBhcmVudFBhY2thZ2VJZDogc3RyaW5nLFxuICApOiBzdHJpbmcgfCBudWxsO1xuICBub2RlTW9kdWxlc0RpckZvclBhY2thZ2U/KG5wbVBhY2thZ2VJZD86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcbn1cblxuZXhwb3J0IHR5cGUgTG9hZGVyUmVzb2x1dGlvbiA9XG4gIHwgTG9hZGVyUmVzb2x1dGlvbkVzbVxuICB8IExvYWRlclJlc29sdXRpb25OcG1cbiAgfCBMb2FkZXJSZXNvbHV0aW9uTm9kZTtcblxuZXhwb3J0IGludGVyZmFjZSBMb2FkZXJSZXNvbHV0aW9uRXNtIHtcbiAga2luZDogXCJlc21cIjtcbiAgc3BlY2lmaWVyOiBVUkw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9hZGVyUmVzb2x1dGlvbk5wbSB7XG4gIGtpbmQ6IFwibnBtXCI7XG4gIHBhY2thZ2VJZDogc3RyaW5nO1xuICBwYWNrYWdlTmFtZTogc3RyaW5nO1xuICBwYXRoOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9hZGVyUmVzb2x1dGlvbk5vZGUge1xuICBraW5kOiBcIm5vZGVcIjtcbiAgcGF0aDogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVkaWFUeXBlVG9Mb2FkZXIobWVkaWFUeXBlOiBNZWRpYVR5cGUpOiBlc2J1aWxkLkxvYWRlciB7XG4gIHN3aXRjaCAobWVkaWFUeXBlKSB7XG4gICAgY2FzZSBcIkphdmFTY3JpcHRcIjpcbiAgICBjYXNlIFwiTWpzXCI6XG4gICAgICByZXR1cm4gXCJqc1wiO1xuICAgIGNhc2UgXCJKU1hcIjpcbiAgICAgIHJldHVybiBcImpzeFwiO1xuICAgIGNhc2UgXCJUeXBlU2NyaXB0XCI6XG4gICAgY2FzZSBcIk10c1wiOlxuICAgICAgcmV0dXJuIFwidHNcIjtcbiAgICBjYXNlIFwiVFNYXCI6XG4gICAgICByZXR1cm4gXCJ0c3hcIjtcbiAgICBjYXNlIFwiSnNvblwiOlxuICAgICAgcmV0dXJuIFwianNvblwiO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuaGFuZGxlZCBtZWRpYSB0eXBlICR7bWVkaWFUeXBlfS5gKTtcbiAgfVxufVxuXG4vKiogRXNidWlsZCdzIHJlcHJlc2VudGF0aW9uIG9mIGEgbW9kdWxlIHNwZWNpZmllci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXNidWlsZFJlc29sdXRpb24ge1xuICAvKiogVGhlIG5hbWVzcGFjZSwgbGlrZSBgZmlsZWAsIGBodHRwc2AsIG9yIGBucG1gLiAqL1xuICBuYW1lc3BhY2U6IHN0cmluZztcbiAgLyoqIFRoZSBwYXRoLiBXaGVuIHRoZSBuYW1lc3BhY2UgaXMgYGZpbGVgLCB0aGlzIGlzIGEgZmlsZSBwYXRoLiBPdGhlcndpc2VcbiAgICogdGhpcyBpcyBldmVyeXRoaW5nIGluIGEgVVJMIHdpdGggdGhlIG5hbWVzcGFjZSBhcyB0aGUgc2NoZW1lLCBhZnRlciB0aGVcbiAgICogYDpgIG9mIHRoZSBzY2hlbWUuICovXG4gIHBhdGg6IHN0cmluZztcbn1cblxuLyoqXG4gKiBUdXJuIGEgVVJMIGludG8gYW4ge0BsaW5rIEVzYnVpbGRSZXNvbHV0aW9ufSBieSBzcGxpdHRpbmcgdGhlIFVSTCBpbnRvIGFcbiAqIG5hbWVzcGFjZSBhbmQgcGF0aC5cbiAqXG4gKiBGb3IgZmlsZSBVUkxzLCB0aGUgcGF0aCByZXR1cm5lZCBpcyBhIGZpbGUgcGF0aCBub3QgYSBVUkwgcGF0aCByZXByZXNlbnRpbmcgYVxuICogZmlsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVybFRvRXNidWlsZFJlc29sdXRpb24odXJsOiBVUkwpOiBFc2J1aWxkUmVzb2x1dGlvbiB7XG4gIGlmICh1cmwucHJvdG9jb2wgPT09IFwiZmlsZTpcIikge1xuICAgIHJldHVybiB7IHBhdGg6IGZyb21GaWxlVXJsKHVybCksIG5hbWVzcGFjZTogXCJmaWxlXCIgfTtcbiAgfVxuXG4gIGNvbnN0IG5hbWVzcGFjZSA9IHVybC5wcm90b2NvbC5zbGljZSgwLCAtMSk7XG4gIGNvbnN0IHBhdGggPSB1cmwuaHJlZi5zbGljZShuYW1lc3BhY2UubGVuZ3RoICsgMSk7XG4gIHJldHVybiB7IHBhdGgsIG5hbWVzcGFjZSB9O1xufVxuXG4vKipcbiAqIFR1cm4gYW4ge0BsaW5rIEVzYnVpbGRSZXNvbHV0aW9ufSBpbnRvIGEgVVJMIGJ5IGpvaW5pbmcgdGhlIG5hbWVzcGFjZSBhbmRcbiAqIHBhdGggaW50byBhIFVSTCBzdHJpbmcuXG4gKlxuICogRm9yIGZpbGUgVVJMcywgdGhlIHBhdGggaXMgaW50ZXJwcmV0ZWQgYXMgYSBmaWxlIHBhdGggbm90IGFzIGEgVVJMIHBhdGhcbiAqIHJlcHJlc2VudGluZyBhIGZpbGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc2J1aWxkUmVzb2x1dGlvblRvVVJMKHNwZWNpZmllcjogRXNidWlsZFJlc29sdXRpb24pOiBVUkwge1xuICBpZiAoc3BlY2lmaWVyLm5hbWVzcGFjZSA9PT0gXCJmaWxlXCIpIHtcbiAgICByZXR1cm4gdG9GaWxlVXJsKHNwZWNpZmllci5wYXRoKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgVVJMKGAke3NwZWNpZmllci5uYW1lc3BhY2V9OiR7c3BlY2lmaWVyLnBhdGh9YCk7XG59XG5cbmludGVyZmFjZSBEZW5vQ29uZmlnIHtcbiAgaW1wb3J0cz86IHVua25vd247XG4gIHNjb3Blcz86IHVua25vd247XG4gIGxvY2s/OiBib29sZWFuIHwgc3RyaW5nO1xuICBpbXBvcnRNYXA/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkRGVub0NvbmZpZyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPERlbm9Db25maWc+IHtcbiAgY29uc3QgZmlsZSA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKHBhdGgpO1xuICBjb25zdCByZXMgPSBKU09OQy5wYXJzZShmaWxlKTtcbiAgaWYgKHR5cGVvZiByZXMgIT09IFwib2JqZWN0XCIgfHwgcmVzID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkocmVzKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRGVubyBjb25maWcgYXQgJHtwYXRofSBtdXN0IGJlIGFuIG9iamVjdGApO1xuICB9XG4gIGlmIChcbiAgICBcImltcG9ydHNcIiBpbiByZXMgJiZcbiAgICAodHlwZW9mIHJlcy5pbXBvcnRzICE9PSBcIm9iamVjdFwiIHx8IHJlcy5pbXBvcnRzID09PSBudWxsIHx8XG4gICAgICBBcnJheS5pc0FycmF5KHJlcy5pbXBvcnRzKSlcbiAgKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBEZW5vIGNvbmZpZyBhdCAke3BhdGh9IGhhcyBpbnZhbGlkIFwiaW1wb3J0c1wiIGtleWApO1xuICB9XG4gIGlmIChcbiAgICBcInNjb3Blc1wiIGluIHJlcyAmJlxuICAgICh0eXBlb2YgcmVzLnNjb3BlcyAhPT0gXCJvYmplY3RcIiB8fCByZXMuc2NvcGVzID09PSBudWxsIHx8XG4gICAgICBBcnJheS5pc0FycmF5KHJlcy5zY29wZXMpKVxuICApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYERlbm8gY29uZmlnIGF0ICR7cGF0aH0gaGFzIGludmFsaWQgXCJzY29wZXNcIiBrZXlgKTtcbiAgfVxuICBpZiAoXG4gICAgXCJsb2NrXCIgaW4gcmVzICYmXG4gICAgdHlwZW9mIHJlcy5sb2NrICE9PSBcImJvb2xlYW5cIiAmJiB0eXBlb2YgcmVzLmxvY2sgIT09IFwic3RyaW5nXCJcbiAgKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBEZW5vIGNvbmZpZyBhdCAke3BhdGh9IGhhcyBpbnZhbGlkIFwibG9ja1wiIGtleWApO1xuICB9XG4gIGlmIChcImltcG9ydE1hcFwiIGluIHJlcyAmJiB0eXBlb2YgcmVzLmltcG9ydE1hcCAhPT0gXCJzdHJpbmdcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihgRGVubyBjb25maWcgYXQgJHtwYXRofSBoYXMgaW52YWxpZCBcImltcG9ydE1hcFwiIGtleWApO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBDb250ZW50VHlwZShcbiAgc3BlY2lmaWVyOiBVUkwsXG4gIGNvbnRlbnRUeXBlOiBzdHJpbmcgfCBudWxsLFxuKTogTWVkaWFUeXBlIHtcbiAgaWYgKGNvbnRlbnRUeXBlICE9PSBudWxsKSB7XG4gICAgY29uc3QgY29udGVudFR5cGVzID0gY29udGVudFR5cGUuc3BsaXQoXCI7XCIpO1xuICAgIGNvbnN0IG1lZGlhVHlwZSA9IGNvbnRlbnRUeXBlc1swXS50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCAobWVkaWFUeXBlKSB7XG4gICAgICBjYXNlIFwiYXBwbGljYXRpb24vdHlwZXNjcmlwdFwiOlxuICAgICAgY2FzZSBcInRleHQvdHlwZXNjcmlwdFwiOlxuICAgICAgY2FzZSBcInZpZGVvL3ZuZC5kbG5hLm1wZWctdHRzXCI6XG4gICAgICBjYXNlIFwidmlkZW8vbXAydFwiOlxuICAgICAgY2FzZSBcImFwcGxpY2F0aW9uL3gtdHlwZXNjcmlwdFwiOlxuICAgICAgICByZXR1cm4gbWFwSnNMaWtlRXh0ZW5zaW9uKHNwZWNpZmllciwgXCJUeXBlU2NyaXB0XCIpO1xuICAgICAgY2FzZSBcImFwcGxpY2F0aW9uL2phdmFzY3JpcHRcIjpcbiAgICAgIGNhc2UgXCJ0ZXh0L2phdmFzY3JpcHRcIjpcbiAgICAgIGNhc2UgXCJhcHBsaWNhdGlvbi9lY21hc2NyaXB0XCI6XG4gICAgICBjYXNlIFwidGV4dC9lY21hc2NyaXB0XCI6XG4gICAgICBjYXNlIFwiYXBwbGljYXRpb24veC1qYXZhc2NyaXB0XCI6XG4gICAgICBjYXNlIFwiYXBwbGljYXRpb24vbm9kZVwiOlxuICAgICAgICByZXR1cm4gbWFwSnNMaWtlRXh0ZW5zaW9uKHNwZWNpZmllciwgXCJKYXZhU2NyaXB0XCIpO1xuICAgICAgY2FzZSBcInRleHQvanN4XCI6XG4gICAgICAgIHJldHVybiBcIkpTWFwiO1xuICAgICAgY2FzZSBcInRleHQvdHN4XCI6XG4gICAgICAgIHJldHVybiBcIlRTWFwiO1xuICAgICAgY2FzZSBcImFwcGxpY2F0aW9uL2pzb25cIjpcbiAgICAgIGNhc2UgXCJ0ZXh0L2pzb25cIjpcbiAgICAgICAgcmV0dXJuIFwiSnNvblwiO1xuICAgICAgY2FzZSBcImFwcGxpY2F0aW9uL3dhc21cIjpcbiAgICAgICAgcmV0dXJuIFwiV2FzbVwiO1xuICAgICAgY2FzZSBcInRleHQvcGxhaW5cIjpcbiAgICAgIGNhc2UgXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjpcbiAgICAgICAgcmV0dXJuIG1lZGlhVHlwZUZyb21TcGVjaWZpZXIoc3BlY2lmaWVyKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBcIlVua25vd25cIjtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG1lZGlhVHlwZUZyb21TcGVjaWZpZXIoc3BlY2lmaWVyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXBKc0xpa2VFeHRlbnNpb24oXG4gIHNwZWNpZmllcjogVVJMLFxuICBkZWZhdWx0VHlwZTogTWVkaWFUeXBlLFxuKTogTWVkaWFUeXBlIHtcbiAgY29uc3QgcGF0aCA9IHNwZWNpZmllci5wYXRobmFtZTtcbiAgc3dpdGNoIChleHRuYW1lKHBhdGgpKSB7XG4gICAgY2FzZSBcIi5qc3hcIjpcbiAgICAgIHJldHVybiBcIkpTWFwiO1xuICAgIGNhc2UgXCIubWpzXCI6XG4gICAgICByZXR1cm4gXCJNanNcIjtcbiAgICBjYXNlIFwiLmNqc1wiOlxuICAgICAgcmV0dXJuIFwiQ2pzXCI7XG4gICAgY2FzZSBcIi50c3hcIjpcbiAgICAgIHJldHVybiBcIlRTWFwiO1xuICAgIGNhc2UgXCIudHNcIjpcbiAgICAgIGlmIChwYXRoLmVuZHNXaXRoKFwiLmQudHNcIikpIHtcbiAgICAgICAgcmV0dXJuIFwiRHRzXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFR5cGU7XG4gICAgICB9XG4gICAgY2FzZSBcIi5tdHNcIjoge1xuICAgICAgaWYgKHBhdGguZW5kc1dpdGgoXCIuZC5tdHNcIikpIHtcbiAgICAgICAgcmV0dXJuIFwiRG10c1wiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRUeXBlID09IFwiSmF2YVNjcmlwdFwiID8gXCJNanNcIiA6IFwiTXRzXCI7XG4gICAgICB9XG4gICAgfVxuICAgIGNhc2UgXCIuY3RzXCI6IHtcbiAgICAgIGlmIChwYXRoLmVuZHNXaXRoKFwiLmQuY3RzXCIpKSB7XG4gICAgICAgIHJldHVybiBcIkRjdHNcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VHlwZSA9PSBcIkphdmFTY3JpcHRcIiA/IFwiQ2pzXCIgOiBcIkN0c1wiO1xuICAgICAgfVxuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGRlZmF1bHRUeXBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1lZGlhVHlwZUZyb21TcGVjaWZpZXIoc3BlY2lmaWVyOiBVUkwpOiBNZWRpYVR5cGUge1xuICBjb25zdCBwYXRoID0gc3BlY2lmaWVyLnBhdGhuYW1lO1xuICBzd2l0Y2ggKGV4dG5hbWUocGF0aCkpIHtcbiAgICBjYXNlIFwiXCI6XG4gICAgICBpZiAocGF0aC5lbmRzV2l0aChcIi8udHNidWlsZGluZm9cIikpIHtcbiAgICAgICAgcmV0dXJuIFwiVHNCdWlsZEluZm9cIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBcIlVua25vd25cIjtcbiAgICAgIH1cbiAgICBjYXNlIFwiLnRzXCI6XG4gICAgICBpZiAocGF0aC5lbmRzV2l0aChcIi5kLnRzXCIpKSB7XG4gICAgICAgIHJldHVybiBcIkR0c1wiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFwiVHlwZVNjcmlwdFwiO1xuICAgICAgfVxuICAgIGNhc2UgXCIubXRzXCI6XG4gICAgICBpZiAocGF0aC5lbmRzV2l0aChcIi5kLm10c1wiKSkge1xuICAgICAgICByZXR1cm4gXCJEbXRzXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXCJNdHNcIjtcbiAgICAgIH1cbiAgICBjYXNlIFwiLmN0c1wiOlxuICAgICAgaWYgKHBhdGguZW5kc1dpdGgoXCIuZC5jdHNcIikpIHtcbiAgICAgICAgcmV0dXJuIFwiRGN0c1wiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFwiQ3RzXCI7XG4gICAgICB9XG4gICAgY2FzZSBcIi50c3hcIjpcbiAgICAgIHJldHVybiBcIlRTWFwiO1xuICAgIGNhc2UgXCIuanNcIjpcbiAgICAgIHJldHVybiBcIkphdmFTY3JpcHRcIjtcbiAgICBjYXNlIFwiLmpzeFwiOlxuICAgICAgcmV0dXJuIFwiSlNYXCI7XG4gICAgY2FzZSBcIi5tanNcIjpcbiAgICAgIHJldHVybiBcIk1qc1wiO1xuICAgIGNhc2UgXCIuY2pzXCI6XG4gICAgICByZXR1cm4gXCJDanNcIjtcbiAgICBjYXNlIFwiLmpzb25cIjpcbiAgICAgIHJldHVybiBcIkpzb25cIjtcbiAgICBjYXNlIFwiLndhc21cIjpcbiAgICAgIHJldHVybiBcIldhc21cIjtcbiAgICBjYXNlIFwiLnRzYnVpbGRpbmZvXCI6XG4gICAgICByZXR1cm4gXCJUc0J1aWxkSW5mb1wiO1xuICAgIGNhc2UgXCIubWFwXCI6XG4gICAgICByZXR1cm4gXCJTb3VyY2VNYXBcIjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIFwiVW5rbm93blwiO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTnBtU3BlY2lmaWVyIHtcbiAgbmFtZTogc3RyaW5nO1xuICB2ZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xuICBwYXRoOiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VOcG1TcGVjaWZpZXIoc3BlY2lmaWVyOiBVUkwpOiBOcG1TcGVjaWZpZXIge1xuICBpZiAoc3BlY2lmaWVyLnByb3RvY29sICE9PSBcIm5wbTpcIikgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBucG0gc3BlY2lmaWVyXCIpO1xuICBjb25zdCBwYXRoID0gc3BlY2lmaWVyLnBhdGhuYW1lO1xuICBjb25zdCBzdGFydEluZGV4ID0gcGF0aFswXSA9PT0gXCIvXCIgPyAxIDogMDtcbiAgbGV0IHBhdGhTdGFydEluZGV4O1xuICBsZXQgdmVyc2lvblN0YXJ0SW5kZXg7XG4gIGlmIChwYXRoW3N0YXJ0SW5kZXhdID09PSBcIkBcIikge1xuICAgIGNvbnN0IGZpcnN0U2xhc2ggPSBwYXRoLmluZGV4T2YoXCIvXCIsIHN0YXJ0SW5kZXgpO1xuICAgIGlmIChmaXJzdFNsYXNoID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG5wbSBzcGVjaWZpZXI6ICR7c3BlY2lmaWVyfWApO1xuICAgIH1cbiAgICBwYXRoU3RhcnRJbmRleCA9IHBhdGguaW5kZXhPZihcIi9cIiwgZmlyc3RTbGFzaCArIDEpO1xuICAgIHZlcnNpb25TdGFydEluZGV4ID0gcGF0aC5pbmRleE9mKFwiQFwiLCBmaXJzdFNsYXNoICsgMSk7XG4gIH0gZWxzZSB7XG4gICAgcGF0aFN0YXJ0SW5kZXggPSBwYXRoLmluZGV4T2YoXCIvXCIsIHN0YXJ0SW5kZXgpO1xuICAgIHZlcnNpb25TdGFydEluZGV4ID0gcGF0aC5pbmRleE9mKFwiQFwiLCBzdGFydEluZGV4KTtcbiAgfVxuXG4gIGlmIChwYXRoU3RhcnRJbmRleCA9PT0gLTEpIHBhdGhTdGFydEluZGV4ID0gcGF0aC5sZW5ndGg7XG4gIGlmICh2ZXJzaW9uU3RhcnRJbmRleCA9PT0gLTEpIHZlcnNpb25TdGFydEluZGV4ID0gcGF0aC5sZW5ndGg7XG5cbiAgaWYgKHZlcnNpb25TdGFydEluZGV4ID4gcGF0aFN0YXJ0SW5kZXgpIHtcbiAgICB2ZXJzaW9uU3RhcnRJbmRleCA9IHBhdGhTdGFydEluZGV4O1xuICB9XG5cbiAgaWYgKHN0YXJ0SW5kZXggPT09IHZlcnNpb25TdGFydEluZGV4KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG5wbSBzcGVjaWZpZXI6ICR7c3BlY2lmaWVyfWApO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBwYXRoLnNsaWNlKHN0YXJ0SW5kZXgsIHZlcnNpb25TdGFydEluZGV4KSxcbiAgICB2ZXJzaW9uOiB2ZXJzaW9uU3RhcnRJbmRleCA9PT0gcGF0aFN0YXJ0SW5kZXhcbiAgICAgID8gbnVsbFxuICAgICAgOiBwYXRoLnNsaWNlKHZlcnNpb25TdGFydEluZGV4ICsgMSwgcGF0aFN0YXJ0SW5kZXgpLFxuICAgIHBhdGg6IHBhdGhTdGFydEluZGV4ID09PSBwYXRoLmxlbmd0aCA/IG51bGwgOiBwYXRoLnNsaWNlKHBhdGhTdGFydEluZGV4KSxcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBKc3JTcGVjaWZpZXIge1xuICBuYW1lOiBzdHJpbmc7XG4gIHZlcnNpb246IHN0cmluZyB8IG51bGw7XG4gIHBhdGg6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUpzclNwZWNpZmllcihzcGVjaWZpZXI6IFVSTCk6IEpzclNwZWNpZmllciB7XG4gIGlmIChzcGVjaWZpZXIucHJvdG9jb2wgIT09IFwianNyOlwiKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGpzciBzcGVjaWZpZXJcIik7XG4gIGNvbnN0IHBhdGggPSBzcGVjaWZpZXIucGF0aG5hbWU7XG4gIGNvbnN0IHN0YXJ0SW5kZXggPSBwYXRoWzBdID09PSBcIi9cIiA/IDEgOiAwO1xuICBpZiAocGF0aFtzdGFydEluZGV4XSAhPT0gXCJAXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQganNyIHNwZWNpZmllcjogJHtzcGVjaWZpZXJ9YCk7XG4gIH1cbiAgY29uc3QgZmlyc3RTbGFzaCA9IHBhdGguaW5kZXhPZihcIi9cIiwgc3RhcnRJbmRleCk7XG4gIGlmIChmaXJzdFNsYXNoID09PSAtMSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBqc3Igc3BlY2lmaWVyOiAke3NwZWNpZmllcn1gKTtcbiAgfVxuICBsZXQgcGF0aFN0YXJ0SW5kZXggPSBwYXRoLmluZGV4T2YoXCIvXCIsIGZpcnN0U2xhc2ggKyAxKTtcbiAgbGV0IHZlcnNpb25TdGFydEluZGV4ID0gcGF0aC5pbmRleE9mKFwiQFwiLCBmaXJzdFNsYXNoICsgMSk7XG5cbiAgaWYgKHBhdGhTdGFydEluZGV4ID09PSAtMSkgcGF0aFN0YXJ0SW5kZXggPSBwYXRoLmxlbmd0aDtcbiAgaWYgKHZlcnNpb25TdGFydEluZGV4ID09PSAtMSkgdmVyc2lvblN0YXJ0SW5kZXggPSBwYXRoLmxlbmd0aDtcblxuICBpZiAodmVyc2lvblN0YXJ0SW5kZXggPiBwYXRoU3RhcnRJbmRleCkge1xuICAgIHZlcnNpb25TdGFydEluZGV4ID0gcGF0aFN0YXJ0SW5kZXg7XG4gIH1cblxuICBpZiAoc3RhcnRJbmRleCA9PT0gdmVyc2lvblN0YXJ0SW5kZXgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQganNyIHNwZWNpZmllcjogJHtzcGVjaWZpZXJ9YCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG5hbWU6IHBhdGguc2xpY2Uoc3RhcnRJbmRleCwgdmVyc2lvblN0YXJ0SW5kZXgpLFxuICAgIHZlcnNpb246IHZlcnNpb25TdGFydEluZGV4ID09PSBwYXRoU3RhcnRJbmRleFxuICAgICAgPyBudWxsXG4gICAgICA6IHBhdGguc2xpY2UodmVyc2lvblN0YXJ0SW5kZXggKyAxLCBwYXRoU3RhcnRJbmRleCksXG4gICAgcGF0aDogcGF0aFN0YXJ0SW5kZXggPT09IHBhdGgubGVuZ3RoID8gbnVsbCA6IHBhdGguc2xpY2UocGF0aFN0YXJ0SW5kZXgpLFxuICB9O1xufVxuXG4vLyBGb3IgYWxsIHBhaXJzIGluIGBpbXBvcnRzYCB3aGVyZSB0aGUgc3BlY2lmaWVyIGRvZXMgbm90IGVuZCBpbiBhIC8sIGFuZCB0aGVcbi8vIHRhcmdldCBzdGFydHMgd2l0aCBganNyOmAgb3IgYG5wbTpgLCBhbmQgbm8gZW50cnkgZXhpc3RzIGZvciBgJHtzcGVjaWZpZXJ9L2AsXG4vLyBhZGQgYW4gZW50cnkgZm9yIGAke3NwZWNpZmllcn0vYCBwb2ludGluZyB0byB0aGUgdGFyZ2V0IHdpdGggYSAvIGFwcGVuZGVkLFxuLy8gYW5kIGEgYC9gIGFwcGVuZGVkIHRvIHRoZSBzY2hlbWUsIGlmIG5vbmUgaXMgcHJlc2VudCB0aGVyZS5cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRFbWJlZGRlZEltcG9ydE1hcChpbXBvcnRNYXA6IEltcG9ydE1hcCkge1xuICBpZiAoaW1wb3J0TWFwLmltcG9ydHMgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IG5ld0ltcG9ydHM6IFtzdHJpbmcsIHN0cmluZyB8IG51bGxdW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtzcGVjaWZpZXIsIHRhcmdldF0gb2YgT2JqZWN0LmVudHJpZXMoaW1wb3J0TWFwLmltcG9ydHMpKSB7XG4gICAgICBuZXdJbXBvcnRzLnB1c2goW3NwZWNpZmllciwgdGFyZ2V0XSk7XG4gICAgICBpZiAoXG4gICAgICAgICFzcGVjaWZpZXIuZW5kc1dpdGgoXCIvXCIpICYmIHRhcmdldCAmJlxuICAgICAgICAodGFyZ2V0LnN0YXJ0c1dpdGgoXCJqc3I6XCIpIHx8IHRhcmdldC5zdGFydHNXaXRoKFwibnBtOlwiKSkgJiZcbiAgICAgICAgIWltcG9ydE1hcC5pbXBvcnRzW3NwZWNpZmllciArIFwiL1wiXVxuICAgICAgKSB7XG4gICAgICAgIGNvbnN0IG5ld1NwZWNpZmllciA9IHNwZWNpZmllciArIFwiL1wiO1xuICAgICAgICBjb25zdCBuZXdUYXJnZXQgPSB0YXJnZXQuc2xpY2UoMCwgNCkgKyBcIi9cIiArXG4gICAgICAgICAgdGFyZ2V0LnNsaWNlKHRhcmdldFs0XSA9PT0gXCIvXCIgPyA1IDogNCkgKyBcIi9cIjtcbiAgICAgICAgbmV3SW1wb3J0cy5wdXNoKFtuZXdTcGVjaWZpZXIsIG5ld1RhcmdldF0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpbXBvcnRNYXAuaW1wb3J0cyA9IE9iamVjdC5mcm9tRW50cmllcyhuZXdJbXBvcnRzKTtcbiAgfVxufVxuXG5jb25zdCBTTEFTSF9OT0RFX01PRFVMRVNfU0xBU0ggPSBgJHtTRVBBUkFUT1J9bm9kZV9tb2R1bGVzJHtTRVBBUkFUT1J9YDtcbmNvbnN0IFNMQVNIX05PREVfTU9EVUxFUyA9IGAke1NFUEFSQVRPUn1ub2RlX21vZHVsZXNgO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNJbk5vZGVNb2R1bGVzKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gcGF0aC5pbmNsdWRlcyhTTEFTSF9OT0RFX01PRFVMRVNfU0xBU0gpIHx8XG4gICAgcGF0aC5lbmRzV2l0aChTTEFTSF9OT0RFX01PRFVMRVMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlTW9kdWxlc1Jlc29sdXRpb24oYXJnczogZXNidWlsZC5PblJlc29sdmVBcmdzKSB7XG4gIHJldHVybiAoXG4gICAgKGFyZ3MubmFtZXNwYWNlID09PSBcIlwiIHx8IGFyZ3MubmFtZXNwYWNlID09PSBcImZpbGVcIikgJiZcbiAgICAoaXNJbk5vZGVNb2R1bGVzKGFyZ3MucmVzb2x2ZURpcikgfHwgaXNJbk5vZGVNb2R1bGVzKGFyZ3MucGF0aCkgfHxcbiAgICAgIGlzSW5Ob2RlTW9kdWxlcyhhcmdzLmltcG9ydGVyKSlcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLE9BQU8sRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFNBQVMsUUFBUSxzQkFBc0I7QUFDakYsWUFBWSxXQUFXLHVCQUF1QjtBQXNDOUMsT0FBTyxTQUFTLGtCQUFrQixTQUFvQjtFQUNwRCxPQUFRO0lBQ04sS0FBSztJQUNMLEtBQUs7TUFDSCxPQUFPO0lBQ1QsS0FBSztNQUNILE9BQU87SUFDVCxLQUFLO0lBQ0wsS0FBSztNQUNILE9BQU87SUFDVCxLQUFLO01BQ0gsT0FBTztJQUNULEtBQUs7TUFDSCxPQUFPO0lBQ1Q7TUFDRSxNQUFNLElBQUksTUFBTSxDQUFDLHFCQUFxQixFQUFFLFVBQVUsQ0FBQyxDQUFDO0VBQ3hEO0FBQ0Y7QUFZQTs7Ozs7O0NBTUMsR0FDRCxPQUFPLFNBQVMsdUJBQXVCLEdBQVE7RUFDN0MsSUFBSSxJQUFJLFFBQVEsS0FBSyxTQUFTO0lBQzVCLE9BQU87TUFBRSxNQUFNLFlBQVk7TUFBTSxXQUFXO0lBQU87RUFDckQ7RUFFQSxNQUFNLFlBQVksSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztFQUN6QyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsTUFBTSxHQUFHO0VBQy9DLE9BQU87SUFBRTtJQUFNO0VBQVU7QUFDM0I7QUFFQTs7Ozs7O0NBTUMsR0FDRCxPQUFPLFNBQVMsdUJBQXVCLFNBQTRCO0VBQ2pFLElBQUksVUFBVSxTQUFTLEtBQUssUUFBUTtJQUNsQyxPQUFPLFVBQVUsVUFB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
// denoCacheMetadata=9207816644842273446,10345691217020042652