import { dirname, fromFileUrl, join } from "jsr:@std/path@0.213";
import { encodeBase32 } from "jsr:@std/encoding@0.213/base32";
import * as deno from "./deno.ts";
import { rootInfo } from "./deno.ts";
import { mapContentType, mediaTypeToLoader, parseNpmSpecifier } from "./shared.ts";
let ROOT_INFO_OUTPUT;
export class NativeLoader {
  #infoCache;
  #linkDirCache = new Map();
  constructor(options){
    this.#infoCache = new deno.InfoCache(options.infoOptions);
  }
  async resolve(specifier) {
    const entry = await this.#infoCache.get(specifier.href);
    if ("error" in entry) throw new Error(entry.error);
    if (entry.kind === "npm") {
      // TODO(lucacasonato): remove parsing once https://github.com/denoland/deno/issues/18043 is resolved
      const parsed = parseNpmSpecifier(new URL(entry.specifier));
      return {
        kind: "npm",
        packageId: entry.npmPackage,
        packageName: parsed.name,
        path: parsed.path ?? ""
      };
    } else if (entry.kind === "node") {
      return {
        kind: "node",
        path: entry.specifier
      };
    }
    return {
      kind: "esm",
      specifier: new URL(entry.specifier)
    };
  }
  async loadEsm(specifier) {
    if (specifier.protocol === "data:") {
      const resp = await fetch(specifier);
      const contents = new Uint8Array(await resp.arrayBuffer());
      const contentType = resp.headers.get("content-type");
      const mediaType = mapContentType(specifier, contentType);
      const loader = mediaTypeToLoader(mediaType);
      return {
        contents,
        loader
      };
    }
    const entry = await this.#infoCache.get(specifier.href);
    if ("error" in entry) throw new Error(entry.error);
    if (!("local" in entry)) {
      throw new Error("[unreachable] Not an ESM module.");
    }
    if (!entry.local) throw new Error("Module not downloaded yet.");
    const loader = mediaTypeToLoader(entry.mediaType);
    const contents = await Deno.readFile(entry.local);
    const res = {
      contents,
      loader
    };
    if (specifier.protocol === "file:") {
      res.watchFiles = [
        fromFileUrl(specifier)
      ];
    }
    return res;
  }
  async nodeModulesDirForPackage(npmPackageId) {
    const npmPackage = this.#infoCache.getNpmPackage(npmPackageId);
    if (!npmPackage) throw new Error("NPM package not found.");
    let linkDir = this.#linkDirCache.get(npmPackageId);
    if (!linkDir) {
      linkDir = await this.#nodeModulesDirForPackageInner(npmPackageId, npmPackage);
      this.#linkDirCache.set(npmPackageId, linkDir);
    }
    return linkDir;
  }
  async #nodeModulesDirForPackageInner(npmPackageId, npmPackage) {
    let name = npmPackage.name;
    if (name.toLowerCase() !== name) {
      name = `_${encodeBase32(new TextEncoder().encode(name))}`;
    }
    if (ROOT_INFO_OUTPUT === undefined) {
      ROOT_INFO_OUTPUT = rootInfo();
    }
    if (ROOT_INFO_OUTPUT instanceof Promise) {
      ROOT_INFO_OUTPUT = await ROOT_INFO_OUTPUT;
    }
    const { denoDir, npmCache } = ROOT_INFO_OUTPUT;
    const packageDir = join(npmCache, "registry.npmjs.org", name, npmPackage.version);
    const linkDir = join(denoDir, "deno_esbuild", npmPackageId, "node_modules", name);
    const linkDirParent = dirname(linkDir);
    const tmpDirParent = join(denoDir, "deno_esbuild_tmp");
    // check if the package is already linked, if so, return the link and skip
    // a bunch of work
    try {
      await Deno.stat(linkDir);
      this.#linkDirCache.set(npmPackageId, linkDir);
      return linkDir;
    } catch  {
    // directory does not yet exist
    }
    // create a temporary directory, recursively hardlink the package contents
    // into it, and then rename it to the final location
    await Deno.mkdir(tmpDirParent, {
      recursive: true
    });
    const tmpDir = await Deno.makeTempDir({
      dir: tmpDirParent
    });
    await linkRecursive(packageDir, tmpDir);
    try {
      await Deno.mkdir(linkDirParent, {
        recursive: true
      });
      await Deno.rename(tmpDir, linkDir);
    } catch (err) {
      // the directory may already have been created by someone else - check if so
      try {
        await Deno.stat(linkDir);
      } catch  {
        throw err;
      }
    }
    return linkDir;
  }
  packageIdFromNameInPackage(name, parentPackageId) {
    const parentPackage = this.#infoCache.getNpmPackage(parentPackageId);
    if (!parentPackage) throw new Error("NPM package not found.");
    if (parentPackage.name === name) return parentPackageId;
    for (const dep of parentPackage.dependencies){
      const depPackage = this.#infoCache.getNpmPackage(dep);
      if (!depPackage) throw new Error("NPM package not found.");
      if (depPackage.name === name) return dep;
    }
    return null;
  }
}
async function linkRecursive(from, to) {
  const fromStat = await Deno.stat(from);
  if (fromStat.isDirectory) {
    await Deno.mkdir(to, {
      recursive: true
    });
    for await (const entry of Deno.readDir(from)){
      await linkRecursive(join(from, entry.name), join(to, entry.name));
    }
  } else {
    await Deno.link(from, to);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BsdWNhL2VzYnVpbGQtZGVuby1sb2FkZXIvMC4xMC4zL3NyYy9sb2FkZXJfbmF0aXZlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlICogYXMgZXNidWlsZCBmcm9tIFwiLi9lc2J1aWxkX3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBkaXJuYW1lLCBmcm9tRmlsZVVybCwgam9pbiB9IGZyb20gXCJqc3I6QHN0ZC9wYXRoQDAuMjEzXCI7XG5pbXBvcnQgeyBlbmNvZGVCYXNlMzIgfSBmcm9tIFwianNyOkBzdGQvZW5jb2RpbmdAMC4yMTMvYmFzZTMyXCI7XG5pbXBvcnQgKiBhcyBkZW5vIGZyb20gXCIuL2Rlbm8udHNcIjtcbmltcG9ydCB7IHJvb3RJbmZvLCBSb290SW5mb091dHB1dCB9IGZyb20gXCIuL2Rlbm8udHNcIjtcbmltcG9ydCB7XG4gIExvYWRlcixcbiAgTG9hZGVyUmVzb2x1dGlvbixcbiAgbWFwQ29udGVudFR5cGUsXG4gIG1lZGlhVHlwZVRvTG9hZGVyLFxuICBwYXJzZU5wbVNwZWNpZmllcixcbn0gZnJvbSBcIi4vc2hhcmVkLnRzXCI7XG5cbmxldCBST09UX0lORk9fT1VUUFVUOiBQcm9taXNlPFJvb3RJbmZvT3V0cHV0PiB8IFJvb3RJbmZvT3V0cHV0IHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgaW50ZXJmYWNlIE5hdGl2ZUxvYWRlck9wdGlvbnMge1xuICBpbmZvT3B0aW9ucz86IGRlbm8uSW5mb09wdGlvbnM7XG59XG5cbmV4cG9ydCBjbGFzcyBOYXRpdmVMb2FkZXIgaW1wbGVtZW50cyBMb2FkZXIge1xuICAjaW5mb0NhY2hlOiBkZW5vLkluZm9DYWNoZTtcbiAgI2xpbmtEaXJDYWNoZTogTWFwPHN0cmluZywgc3RyaW5nPiA9IG5ldyBNYXAoKTsgLy8gbWFwcGluZyBmcm9tIHBhY2thZ2UgaWQgLT4gbGluayBkaXJcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBOYXRpdmVMb2FkZXJPcHRpb25zKSB7XG4gICAgdGhpcy4jaW5mb0NhY2hlID0gbmV3IGRlbm8uSW5mb0NhY2hlKG9wdGlvbnMuaW5mb09wdGlvbnMpO1xuICB9XG5cbiAgYXN5bmMgcmVzb2x2ZShzcGVjaWZpZXI6IFVSTCk6IFByb21pc2U8TG9hZGVyUmVzb2x1dGlvbj4ge1xuICAgIGNvbnN0IGVudHJ5ID0gYXdhaXQgdGhpcy4jaW5mb0NhY2hlLmdldChzcGVjaWZpZXIuaHJlZik7XG4gICAgaWYgKFwiZXJyb3JcIiBpbiBlbnRyeSkgdGhyb3cgbmV3IEVycm9yKGVudHJ5LmVycm9yKTtcblxuICAgIGlmIChlbnRyeS5raW5kID09PSBcIm5wbVwiKSB7XG4gICAgICAvLyBUT0RPKGx1Y2FjYXNvbmF0byk6IHJlbW92ZSBwYXJzaW5nIG9uY2UgaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL2Rlbm8vaXNzdWVzLzE4MDQzIGlzIHJlc29sdmVkXG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZU5wbVNwZWNpZmllcihuZXcgVVJMKGVudHJ5LnNwZWNpZmllcikpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAga2luZDogXCJucG1cIixcbiAgICAgICAgcGFja2FnZUlkOiBlbnRyeS5ucG1QYWNrYWdlLFxuICAgICAgICBwYWNrYWdlTmFtZTogcGFyc2VkLm5hbWUsXG4gICAgICAgIHBhdGg6IHBhcnNlZC5wYXRoID8/IFwiXCIsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoZW50cnkua2luZCA9PT0gXCJub2RlXCIpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGtpbmQ6IFwibm9kZVwiLFxuICAgICAgICBwYXRoOiBlbnRyeS5zcGVjaWZpZXIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7IGtpbmQ6IFwiZXNtXCIsIHNwZWNpZmllcjogbmV3IFVSTChlbnRyeS5zcGVjaWZpZXIpIH07XG4gIH1cblxuICBhc3luYyBsb2FkRXNtKHNwZWNpZmllcjogVVJMKTogUHJvbWlzZTxlc2J1aWxkLk9uTG9hZFJlc3VsdD4ge1xuICAgIGlmIChzcGVjaWZpZXIucHJvdG9jb2wgPT09IFwiZGF0YTpcIikge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoKHNwZWNpZmllcik7XG4gICAgICBjb25zdCBjb250ZW50cyA9IG5ldyBVaW50OEFycmF5KGF3YWl0IHJlc3AuYXJyYXlCdWZmZXIoKSk7XG4gICAgICBjb25zdCBjb250ZW50VHlwZSA9IHJlc3AuaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIik7XG4gICAgICBjb25zdCBtZWRpYVR5cGUgPSBtYXBDb250ZW50VHlwZShzcGVjaWZpZXIsIGNvbnRlbnRUeXBlKTtcbiAgICAgIGNvbnN0IGxvYWRlciA9IG1lZGlhVHlwZVRvTG9hZGVyKG1lZGlhVHlwZSk7XG4gICAgICByZXR1cm4geyBjb250ZW50cywgbG9hZGVyIH07XG4gICAgfVxuICAgIGNvbnN0IGVudHJ5ID0gYXdhaXQgdGhpcy4jaW5mb0NhY2hlLmdldChzcGVjaWZpZXIuaHJlZik7XG4gICAgaWYgKFwiZXJyb3JcIiBpbiBlbnRyeSkgdGhyb3cgbmV3IEVycm9yKGVudHJ5LmVycm9yKTtcblxuICAgIGlmICghKFwibG9jYWxcIiBpbiBlbnRyeSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlt1bnJlYWNoYWJsZV0gTm90IGFuIEVTTSBtb2R1bGUuXCIpO1xuICAgIH1cbiAgICBpZiAoIWVudHJ5LmxvY2FsKSB0aHJvdyBuZXcgRXJyb3IoXCJNb2R1bGUgbm90IGRvd25sb2FkZWQgeWV0LlwiKTtcbiAgICBjb25zdCBsb2FkZXIgPSBtZWRpYVR5cGVUb0xvYWRlcihlbnRyeS5tZWRpYVR5cGUpO1xuXG4gICAgY29uc3QgY29udGVudHMgPSBhd2FpdCBEZW5vLnJlYWRGaWxlKGVudHJ5LmxvY2FsKTtcbiAgICBjb25zdCByZXM6IGVzYnVpbGQuT25Mb2FkUmVzdWx0ID0geyBjb250ZW50cywgbG9hZGVyIH07XG4gICAgaWYgKHNwZWNpZmllci5wcm90b2NvbCA9PT0gXCJmaWxlOlwiKSB7XG4gICAgICByZXMud2F0Y2hGaWxlcyA9IFtmcm9tRmlsZVVybChzcGVjaWZpZXIpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIGFzeW5jIG5vZGVNb2R1bGVzRGlyRm9yUGFja2FnZShucG1QYWNrYWdlSWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgbnBtUGFja2FnZSA9IHRoaXMuI2luZm9DYWNoZS5nZXROcG1QYWNrYWdlKG5wbVBhY2thZ2VJZCk7XG4gICAgaWYgKCFucG1QYWNrYWdlKSB0aHJvdyBuZXcgRXJyb3IoXCJOUE0gcGFja2FnZSBub3QgZm91bmQuXCIpO1xuXG4gICAgbGV0IGxpbmtEaXIgPSB0aGlzLiNsaW5rRGlyQ2FjaGUuZ2V0KG5wbVBhY2thZ2VJZCk7XG4gICAgaWYgKCFsaW5rRGlyKSB7XG4gICAgICBsaW5rRGlyID0gYXdhaXQgdGhpcy4jbm9kZU1vZHVsZXNEaXJGb3JQYWNrYWdlSW5uZXIoXG4gICAgICAgIG5wbVBhY2thZ2VJZCxcbiAgICAgICAgbnBtUGFja2FnZSxcbiAgICAgICk7XG4gICAgICB0aGlzLiNsaW5rRGlyQ2FjaGUuc2V0KG5wbVBhY2thZ2VJZCwgbGlua0Rpcik7XG4gICAgfVxuICAgIHJldHVybiBsaW5rRGlyO1xuICB9XG5cbiAgYXN5bmMgI25vZGVNb2R1bGVzRGlyRm9yUGFja2FnZUlubmVyKFxuICAgIG5wbVBhY2thZ2VJZDogc3RyaW5nLFxuICAgIG5wbVBhY2thZ2U6IGRlbm8uTnBtUGFja2FnZSxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgbmFtZSA9IG5wbVBhY2thZ2UubmFtZTtcbiAgICBpZiAobmFtZS50b0xvd2VyQ2FzZSgpICE9PSBuYW1lKSB7XG4gICAgICBuYW1lID0gYF8ke2VuY29kZUJhc2UzMihuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUobmFtZSkpfWA7XG4gICAgfVxuICAgIGlmIChST09UX0lORk9fT1VUUFVUID09PSB1bmRlZmluZWQpIHtcbiAgICAgIFJPT1RfSU5GT19PVVRQVVQgPSByb290SW5mbygpO1xuICAgIH1cbiAgICBpZiAoUk9PVF9JTkZPX09VVFBVVCBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgIFJPT1RfSU5GT19PVVRQVVQgPSBhd2FpdCBST09UX0lORk9fT1VUUFVUO1xuICAgIH1cbiAgICBjb25zdCB7IGRlbm9EaXIsIG5wbUNhY2hlIH0gPSBST09UX0lORk9fT1VUUFVUO1xuICAgIGNvbnN0IHBhY2thZ2VEaXIgPSBqb2luKFxuICAgICAgbnBtQ2FjaGUsXG4gICAgICBcInJlZ2lzdHJ5Lm5wbWpzLm9yZ1wiLFxuICAgICAgbmFtZSxcbiAgICAgIG5wbVBhY2thZ2UudmVyc2lvbixcbiAgICApO1xuICAgIGNvbnN0IGxpbmtEaXIgPSBqb2luKFxuICAgICAgZGVub0RpcixcbiAgICAgIFwiZGVub19lc2J1aWxkXCIsXG4gICAgICBucG1QYWNrYWdlSWQsXG4gICAgICBcIm5vZGVfbW9kdWxlc1wiLFxuICAgICAgbmFtZSxcbiAgICApO1xuICAgIGNvbnN0IGxpbmtEaXJQYXJlbnQgPSBkaXJuYW1lKGxpbmtEaXIpO1xuICAgIGNvbnN0IHRtcERpclBhcmVudCA9IGpvaW4oZGVub0RpciwgXCJkZW5vX2VzYnVpbGRfdG1wXCIpO1xuXG4gICAgLy8gY2hlY2sgaWYgdGhlIHBhY2thZ2UgaXMgYWxyZWFkeSBsaW5rZWQsIGlmIHNvLCByZXR1cm4gdGhlIGxpbmsgYW5kIHNraXBcbiAgICAvLyBhIGJ1bmNoIG9mIHdvcmtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgRGVuby5zdGF0KGxpbmtEaXIpO1xuICAgICAgdGhpcy4jbGlua0RpckNhY2hlLnNldChucG1QYWNrYWdlSWQsIGxpbmtEaXIpO1xuICAgICAgcmV0dXJuIGxpbmtEaXI7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBkaXJlY3RvcnkgZG9lcyBub3QgeWV0IGV4aXN0XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIGEgdGVtcG9yYXJ5IGRpcmVjdG9yeSwgcmVjdXJzaXZlbHkgaGFyZGxpbmsgdGhlIHBhY2thZ2UgY29udGVudHNcbiAgICAvLyBpbnRvIGl0LCBhbmQgdGhlbiByZW5hbWUgaXQgdG8gdGhlIGZpbmFsIGxvY2F0aW9uXG4gICAgYXdhaXQgRGVuby5ta2Rpcih0bXBEaXJQYXJlbnQsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGNvbnN0IHRtcERpciA9IGF3YWl0IERlbm8ubWFrZVRlbXBEaXIoeyBkaXI6IHRtcERpclBhcmVudCB9KTtcbiAgICBhd2FpdCBsaW5rUmVjdXJzaXZlKHBhY2thZ2VEaXIsIHRtcERpcik7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IERlbm8ubWtkaXIobGlua0RpclBhcmVudCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICBhd2FpdCBEZW5vLnJlbmFtZSh0bXBEaXIsIGxpbmtEaXIpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gdGhlIGRpcmVjdG9yeSBtYXkgYWxyZWFkeSBoYXZlIGJlZW4gY3JlYXRlZCBieSBzb21lb25lIGVsc2UgLSBjaGVjayBpZiBzb1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgRGVuby5zdGF0KGxpbmtEaXIpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGlua0RpcjtcbiAgfVxuXG4gIHBhY2thZ2VJZEZyb21OYW1lSW5QYWNrYWdlKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwYXJlbnRQYWNrYWdlSWQ6IHN0cmluZyxcbiAgKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgcGFyZW50UGFja2FnZSA9IHRoaXMuI2luZm9DYWNoZS5nZXROcG1QYWNrYWdlKHBhcmVudFBhY2thZ2VJZCk7XG4gICAgaWYgKCFwYXJlbnRQYWNrYWdlKSB0aHJvdyBuZXcgRXJyb3IoXCJOUE0gcGFja2FnZSBub3QgZm91bmQuXCIpO1xuICAgIGlmIChwYXJlbnRQYWNrYWdlLm5hbWUgPT09IG5hbWUpIHJldHVybiBwYXJlbnRQYWNrYWdlSWQ7XG4gICAgZm9yIChjb25zdCBkZXAgb2YgcGFyZW50UGFja2FnZS5kZXBlbmRlbmNpZXMpIHtcbiAgICAgIGNvbnN0IGRlcFBhY2thZ2UgPSB0aGlzLiNpbmZvQ2FjaGUuZ2V0TnBtUGFja2FnZShkZXApO1xuICAgICAgaWYgKCFkZXBQYWNrYWdlKSB0aHJvdyBuZXcgRXJyb3IoXCJOUE0gcGFja2FnZSBub3QgZm91bmQuXCIpO1xuICAgICAgaWYgKGRlcFBhY2thZ2UubmFtZSA9PT0gbmFtZSkgcmV0dXJuIGRlcDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbGlua1JlY3Vyc2l2ZShmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpIHtcbiAgY29uc3QgZnJvbVN0YXQgPSBhd2FpdCBEZW5vLnN0YXQoZnJvbSk7XG4gIGlmIChmcm9tU3RhdC5pc0RpcmVjdG9yeSkge1xuICAgIGF3YWl0IERlbm8ubWtkaXIodG8sIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZvciBhd2FpdCAoY29uc3QgZW50cnkgb2YgRGVuby5yZWFkRGlyKGZyb20pKSB7XG4gICAgICBhd2FpdCBsaW5rUmVjdXJzaXZlKGpvaW4oZnJvbSwgZW50cnkubmFtZSksIGpvaW4odG8sIGVudHJ5Lm5hbWUpKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYXdhaXQgRGVuby5saW5rKGZyb20sIHRvKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLFFBQVEsc0JBQXNCO0FBQ2pFLFNBQVMsWUFBWSxRQUFRLGlDQUFpQztBQUM5RCxZQUFZLFVBQVUsWUFBWTtBQUNsQyxTQUFTLFFBQVEsUUFBd0IsWUFBWTtBQUNyRCxTQUdFLGNBQWMsRUFDZCxpQkFBaUIsRUFDakIsaUJBQWlCLFFBQ1osY0FBYztBQUVyQixJQUFJO0FBTUosT0FBTyxNQUFNO0VBQ1gsQ0FBQSxTQUFV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
// denoCacheMetadata=17858476432894469871,14673297337105380616