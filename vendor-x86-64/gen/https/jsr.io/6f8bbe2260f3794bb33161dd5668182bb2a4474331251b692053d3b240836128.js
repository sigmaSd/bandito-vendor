/**
 * This module contains the common types used in plug.
 *
 * @module
 */ import { dirname, extname, fromFileUrl, join, normalize, resolve } from "jsr:@std/path@^1";
import { ensureDir } from "jsr:@std/fs@^1";
import { green } from "jsr:@std/fmt@^1/colors";
import { cacheDir, denoCacheDir, isFile, stringToURL, urlToFilename } from "./util.ts";
/**
 * A list of all possible system architectures.
 *
 * This should match the {@link Deno.build.arch} type.
 */ export const ALL_ARCHS = [
  "x86_64",
  "aarch64"
];
/**
 * A list of all possible system operating systems.
 *
 * This should match the {@link Deno.build.os} type.
 */ export const ALL_OSS = [
  "darwin",
  "linux",
  "android",
  "windows",
  "freebsd",
  "netbsd",
  "aix",
  "solaris",
  "illumos"
];
/**
 * The default file extensions for dynamic libraries in the different operating
 * systems.
 */ export const defaultExtensions = {
  darwin: "dylib",
  linux: "so",
  windows: "dll",
  freebsd: "so",
  netbsd: "so",
  aix: "so",
  solaris: "so",
  illumos: "so",
  android: "so"
};
/**
 * The default file prefixes for dynamic libraries in the different operating
 * systems.
 */ export const defaultPrefixes = {
  darwin: "lib",
  linux: "lib",
  netbsd: "lib",
  freebsd: "lib",
  aix: "lib",
  solaris: "lib",
  illumos: "lib",
  windows: "",
  android: "lib"
};
function getCrossOption(record) {
  if (record === undefined) {
    return;
  }
  if (ALL_OSS.some((os)=>os in record)) {
    const subrecord = record[Deno.build.os];
    if (subrecord && typeof subrecord === "object" && ALL_ARCHS.some((arch)=>arch in subrecord)) {
      return subrecord[Deno.build.arch];
    } else {
      return subrecord;
    }
  }
  if (ALL_ARCHS.some((arch)=>arch in record)) {
    const subrecord = record[Deno.build.arch];
    if (subrecord && typeof subrecord === "object" && ALL_OSS.some((os)=>os in subrecord)) {
      return subrecord[Deno.build.os];
    } else {
      return subrecord;
    }
  }
}
/**
 * Creates a cross-platform url for the specified options
 *
 * @param options See {@link FetchOptions}
 * @returns A fully specified url to the specified file
 */ export function createDownloadURL(options) {
  if (typeof options === "string" || options instanceof URL) {
    options = {
      url: options
    };
  }
  // Initialize default options
  options.extensions ??= defaultExtensions;
  options.prefixes ??= defaultPrefixes;
  // Clean extensions to not contain a leading dot
  for(const key in options.extensions){
    const os = key;
    if (options.extensions[os] !== undefined) {
      options.extensions[os] = options.extensions[os].replace(/\.?(.+)/, "$1");
    }
  }
  // Get the os-specific url
  let url;
  if (options.url instanceof URL) {
    url = options.url;
  } else if (typeof options.url === "string") {
    url = stringToURL(options.url);
  } else {
    const tmpUrl = getCrossOption(options.url);
    if (tmpUrl === undefined) {
      throw new TypeError(`An URL for the "${Deno.build.os}-${Deno.build.arch}" target was not provided.`);
    }
    if (typeof tmpUrl === "string") {
      url = stringToURL(tmpUrl);
    } else {
      url = tmpUrl;
    }
  }
  // Assemble automatic cross-platform named urls here
  if ("name" in options && !Object.values(options.extensions).includes(extname(url.pathname))) {
    if (!url.pathname.endsWith("/")) {
      url.pathname = `${url.pathname}/`;
    }
    const prefix = getCrossOption(options.prefixes) ?? "";
    const suffix = getCrossOption(options.suffixes) ?? "";
    const extension = options.extensions[Deno.build.os];
    if (options.name === undefined) {
      throw new TypeError(`Expected the "name" property for an automatically assembled URL.`);
    }
    const filename = `${prefix}${options.name}${suffix}.${extension}`;
    url = new URL(filename, url);
  }
  return url;
}
/**
 * Return the path to the cache location along with ensuring its existance
 *
 * @param location See the {@link CacheLocation} type
 * @returns The cache location path
 */ export async function ensureCacheLocation(location = "deno") {
  if (location === "deno") {
    const dir = denoCacheDir();
    if (dir === undefined) {
      throw new Error("Could not get the deno cache directory, try using another CacheLocation in the plug options.");
    }
    location = join(dir, "plug");
  } else if (location === "cache") {
    const dir = cacheDir();
    if (dir === undefined) {
      throw new Error("Could not get the cache directory, try using another CacheLocation in the plug options.");
    }
    location = join(dir, "plug");
  } else if (location === "cwd") {
    location = join(Deno.cwd(), "plug");
  } else if (location === "tmp") {
    location = await Deno.makeTempDir({
      prefix: "plug"
    });
  } else if (typeof location === "string" && location.startsWith("file://")) {
    location = fromFileUrl(location);
  } else if (location instanceof URL) {
    if (location?.protocol !== "file:") {
      throw new TypeError("Cannot use any other protocol than file:// for an URL cache location.");
    }
    location = fromFileUrl(location);
  }
  location = resolve(normalize(location));
  await ensureDir(location);
  return location;
}
/**
 * Downloads a file using the specified {@link FetchOptions}
 *
 * @param options See {@link FetchOptions}
 * @returns The path to the downloaded file in its cached location
 */ export async function download(options) {
  const location = (typeof options === "object" && "location" in options ? options.location : undefined) ?? "deno";
  const setting = (typeof options === "object" && "cache" in options ? options.cache : undefined) ?? "use";
  const url = createDownloadURL(options);
  const directory = await ensureCacheLocation(location);
  const cacheBasePath = join(directory, await urlToFilename(url));
  const cacheFilePath = `${cacheBasePath}${extname(url.pathname)}`;
  const cacheMetaPath = `${cacheBasePath}.metadata.json`;
  const cached = setting === "use" ? await isFile(cacheFilePath) : setting === "only" || setting !== "reloadAll";
  await ensureDir(dirname(cacheBasePath));
  if (!cached) {
    const meta = {
      url
    };
    switch(url.protocol){
      case "http:":
      case "https:":
        {
          console.log(`${green("Downloading")} ${url}`);
          const response = await fetch(url.toString());
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(`Could not find ${url}`);
            } else {
              throw new Deno.errors.Http(`${response.status} ${response.statusText}`);
            }
          }
          await Deno.writeFile(cacheFilePath, new Uint8Array(await response.arrayBuffer()));
          break;
        }
      case "file:":
        {
          console.log(`${green("Copying")} ${url}`);
          await Deno.copyFile(fromFileUrl(url), cacheFilePath);
          if (Deno.build.os !== "windows") {
            await Deno.chmod(cacheFilePath, 0o644);
          }
          break;
        }
      default:
        {
          throw new TypeError(`Cannot fetch to cache using the "${url.protocol}" protocol`);
        }
    }
    await Deno.writeTextFile(cacheMetaPath, JSON.stringify(meta));
  }
  if (!await isFile(cacheFilePath)) {
    throw new Error(`Could not find "${url}" in cache.`);
  }
  return cacheFilePath;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BkZW5vc2F1cnMvcGx1Zy8xLjEuMC9kb3dubG9hZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgbW9kdWxlIGNvbnRhaW5zIHRoZSBjb21tb24gdHlwZXMgdXNlZCBpbiBwbHVnLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQge1xuICBkaXJuYW1lLFxuICBleHRuYW1lLFxuICBmcm9tRmlsZVVybCxcbiAgam9pbixcbiAgbm9ybWFsaXplLFxuICByZXNvbHZlLFxufSBmcm9tIFwianNyOkBzdGQvcGF0aEBeMVwiO1xuaW1wb3J0IHsgZW5zdXJlRGlyIH0gZnJvbSBcImpzcjpAc3RkL2ZzQF4xXCI7XG5pbXBvcnQgeyBncmVlbiB9IGZyb20gXCJqc3I6QHN0ZC9mbXRAXjEvY29sb3JzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFyY2hSZWNvcmQsXG4gIENhY2hlTG9jYXRpb24sXG4gIEZldGNoT3B0aW9ucyxcbiAgTmVzdGVkQ3Jvc3NSZWNvcmQsXG4gIE9zUmVjb3JkLFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuaW1wb3J0IHtcbiAgY2FjaGVEaXIsXG4gIGRlbm9DYWNoZURpcixcbiAgaXNGaWxlLFxuICBzdHJpbmdUb1VSTCxcbiAgdXJsVG9GaWxlbmFtZSxcbn0gZnJvbSBcIi4vdXRpbC50c1wiO1xuXG4vKipcbiAqIEEgbGlzdCBvZiBhbGwgcG9zc2libGUgc3lzdGVtIGFyY2hpdGVjdHVyZXMuXG4gKlxuICogVGhpcyBzaG91bGQgbWF0Y2ggdGhlIHtAbGluayBEZW5vLmJ1aWxkLmFyY2h9IHR5cGUuXG4gKi9cbmV4cG9ydCBjb25zdCBBTExfQVJDSFM6ICh0eXBlb2YgRGVuby5idWlsZC5hcmNoKVtdID0gW1wieDg2XzY0XCIsIFwiYWFyY2g2NFwiXTtcblxuLyoqXG4gKiBBIGxpc3Qgb2YgYWxsIHBvc3NpYmxlIHN5c3RlbSBvcGVyYXRpbmcgc3lzdGVtcy5cbiAqXG4gKiBUaGlzIHNob3VsZCBtYXRjaCB0aGUge0BsaW5rIERlbm8uYnVpbGQub3N9IHR5cGUuXG4gKi9cbmV4cG9ydCBjb25zdCBBTExfT1NTOiAodHlwZW9mIERlbm8uYnVpbGQub3MpW10gPSBbXG4gIFwiZGFyd2luXCIsXG4gIFwibGludXhcIixcbiAgXCJhbmRyb2lkXCIsXG4gIFwid2luZG93c1wiLFxuICBcImZyZWVic2RcIixcbiAgXCJuZXRic2RcIixcbiAgXCJhaXhcIixcbiAgXCJzb2xhcmlzXCIsXG4gIFwiaWxsdW1vc1wiLFxuXTtcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBmaWxlIGV4dGVuc2lvbnMgZm9yIGR5bmFtaWMgbGlicmFyaWVzIGluIHRoZSBkaWZmZXJlbnQgb3BlcmF0aW5nXG4gKiBzeXN0ZW1zLlxuICovXG5leHBvcnQgY29uc3QgZGVmYXVsdEV4dGVuc2lvbnM6IE9zUmVjb3JkPHN0cmluZz4gPSB7XG4gIGRhcndpbjogXCJkeWxpYlwiLFxuICBsaW51eDogXCJzb1wiLFxuICB3aW5kb3dzOiBcImRsbFwiLFxuICBmcmVlYnNkOiBcInNvXCIsXG4gIG5ldGJzZDogXCJzb1wiLFxuICBhaXg6IFwic29cIixcbiAgc29sYXJpczogXCJzb1wiLFxuICBpbGx1bW9zOiBcInNvXCIsXG4gIGFuZHJvaWQ6IFwic29cIixcbn07XG5cbi8qKlxuICogVGhlIGRlZmF1bHQgZmlsZSBwcmVmaXhlcyBmb3IgZHluYW1pYyBsaWJyYXJpZXMgaW4gdGhlIGRpZmZlcmVudCBvcGVyYXRpbmdcbiAqIHN5c3RlbXMuXG4gKi9cbmV4cG9ydCBjb25zdCBkZWZhdWx0UHJlZml4ZXM6IE9zUmVjb3JkPHN0cmluZz4gPSB7XG4gIGRhcndpbjogXCJsaWJcIixcbiAgbGludXg6IFwibGliXCIsXG4gIG5ldGJzZDogXCJsaWJcIixcbiAgZnJlZWJzZDogXCJsaWJcIixcbiAgYWl4OiBcImxpYlwiLFxuICBzb2xhcmlzOiBcImxpYlwiLFxuICBpbGx1bW9zOiBcImxpYlwiLFxuICB3aW5kb3dzOiBcIlwiLFxuICBhbmRyb2lkOiBcImxpYlwiLFxufTtcblxuZnVuY3Rpb24gZ2V0Q3Jvc3NPcHRpb248VD4ocmVjb3JkPzogTmVzdGVkQ3Jvc3NSZWNvcmQ8VD4pOiBUIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHJlY29yZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKEFMTF9PU1Muc29tZSgob3MpID0+IG9zIGluIHJlY29yZCkpIHtcbiAgICBjb25zdCBzdWJyZWNvcmQgPSAocmVjb3JkIGFzIE9zUmVjb3JkPFQ+KVtEZW5vLmJ1aWxkLm9zXTtcblxuICAgIGlmIChcbiAgICAgIHN1YnJlY29yZCAmJlxuICAgICAgdHlwZW9mIHN1YnJlY29yZCA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgQUxMX0FSQ0hTLnNvbWUoKGFyY2gpID0+IGFyY2ggaW4gc3VicmVjb3JkKVxuICAgICkge1xuICAgICAgcmV0dXJuIChzdWJyZWNvcmQgYXMgQXJjaFJlY29yZDxUPilbRGVuby5idWlsZC5hcmNoXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN1YnJlY29yZCBhcyBUO1xuICAgIH1cbiAgfVxuXG4gIGlmIChBTExfQVJDSFMuc29tZSgoYXJjaCkgPT4gYXJjaCBpbiByZWNvcmQpKSB7XG4gICAgY29uc3Qgc3VicmVjb3JkID0gKHJlY29yZCBhcyBBcmNoUmVjb3JkPFQ+KVtEZW5vLmJ1aWxkLmFyY2hdO1xuXG4gICAgaWYgKFxuICAgICAgc3VicmVjb3JkICYmXG4gICAgICB0eXBlb2Ygc3VicmVjb3JkID09PSBcIm9iamVjdFwiICYmXG4gICAgICBBTExfT1NTLnNvbWUoKG9zKSA9PiBvcyBpbiBzdWJyZWNvcmQpXG4gICAgKSB7XG4gICAgICByZXR1cm4gKHN1YnJlY29yZCBhcyBPc1JlY29yZDxUPilbRGVuby5idWlsZC5vc107XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdWJyZWNvcmQgYXMgVDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgY3Jvc3MtcGxhdGZvcm0gdXJsIGZvciB0aGUgc3BlY2lmaWVkIG9wdGlvbnNcbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBTZWUge0BsaW5rIEZldGNoT3B0aW9uc31cbiAqIEByZXR1cm5zIEEgZnVsbHkgc3BlY2lmaWVkIHVybCB0byB0aGUgc3BlY2lmaWVkIGZpbGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURvd25sb2FkVVJMKG9wdGlvbnM6IEZldGNoT3B0aW9ucyk6IFVSTCB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJzdHJpbmdcIiB8fCBvcHRpb25zIGluc3RhbmNlb2YgVVJMKSB7XG4gICAgb3B0aW9ucyA9IHsgdXJsOiBvcHRpb25zIH07XG4gIH1cblxuICAvLyBJbml0aWFsaXplIGRlZmF1bHQgb3B0aW9uc1xuICBvcHRpb25zLmV4dGVuc2lvbnMgPz89IGRlZmF1bHRFeHRlbnNpb25zO1xuICBvcHRpb25zLnByZWZpeGVzID8/PSBkZWZhdWx0UHJlZml4ZXM7XG5cbiAgLy8gQ2xlYW4gZXh0ZW5zaW9ucyB0byBub3QgY29udGFpbiBhIGxlYWRpbmcgZG90XG4gIGZvciAoY29uc3Qga2V5IGluIG9wdGlvbnMuZXh0ZW5zaW9ucykge1xuICAgIGNvbnN0IG9zID0ga2V5IGFzIHR5cGVvZiBEZW5vLmJ1aWxkLm9zO1xuICAgIGlmIChvcHRpb25zLmV4dGVuc2lvbnNbb3NdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG9wdGlvbnMuZXh0ZW5zaW9uc1tvc10gPSBvcHRpb25zLmV4dGVuc2lvbnNbb3NdLnJlcGxhY2UoL1xcLj8oLispLywgXCIkMVwiKTtcbiAgICB9XG4gIH1cblxuICAvLyBHZXQgdGhlIG9zLXNwZWNpZmljIHVybFxuICBsZXQgdXJsOiBVUkw7XG4gIGlmIChvcHRpb25zLnVybCBpbnN0YW5jZW9mIFVSTCkge1xuICAgIHVybCA9IG9wdGlvbnMudXJsO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLnVybCA9PT0gXCJzdHJpbmdcIikge1xuICAgIHVybCA9IHN0cmluZ1RvVVJMKG9wdGlvbnMudXJsKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0bXBVcmwgPSBnZXRDcm9zc09wdGlvbihvcHRpb25zLnVybCk7XG4gICAgaWYgKHRtcFVybCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBgQW4gVVJMIGZvciB0aGUgXCIke0Rlbm8uYnVpbGQub3N9LSR7RGVuby5idWlsZC5hcmNofVwiIHRhcmdldCB3YXMgbm90IHByb3ZpZGVkLmAsXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdG1wVXJsID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB1cmwgPSBzdHJpbmdUb1VSTCh0bXBVcmwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cmwgPSB0bXBVcmw7XG4gICAgfVxuICB9XG5cbiAgLy8gQXNzZW1ibGUgYXV0b21hdGljIGNyb3NzLXBsYXRmb3JtIG5hbWVkIHVybHMgaGVyZVxuICBpZiAoXG4gICAgXCJuYW1lXCIgaW4gb3B0aW9ucyAmJlxuICAgICFPYmplY3QudmFsdWVzKG9wdGlvbnMuZXh0ZW5zaW9ucykuaW5jbHVkZXMoZXh0bmFtZSh1cmwucGF0aG5hbWUpKVxuICApIHtcbiAgICBpZiAoIXVybC5wYXRobmFtZS5lbmRzV2l0aChcIi9cIikpIHtcbiAgICAgIHVybC5wYXRobmFtZSA9IGAke3VybC5wYXRobmFtZX0vYDtcbiAgICB9XG5cbiAgICBjb25zdCBwcmVmaXggPSBnZXRDcm9zc09wdGlvbihvcHRpb25zLnByZWZpeGVzKSA/PyBcIlwiO1xuICAgIGNvbnN0IHN1ZmZpeCA9IGdldENyb3NzT3B0aW9uKG9wdGlvbnMuc3VmZml4ZXMpID8/IFwiXCI7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gb3B0aW9ucy5leHRlbnNpb25zW0Rlbm8uYnVpbGQub3NdO1xuXG4gICAgaWYgKG9wdGlvbnMubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBgRXhwZWN0ZWQgdGhlIFwibmFtZVwiIHByb3BlcnR5IGZvciBhbiBhdXRvbWF0aWNhbGx5IGFzc2VtYmxlZCBVUkwuYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZW5hbWUgPSBgJHtwcmVmaXh9JHtvcHRpb25zLm5hbWV9JHtzdWZmaXh9LiR7ZXh0ZW5zaW9ufWA7XG5cbiAgICB1cmwgPSBuZXcgVVJMKGZpbGVuYW1lLCB1cmwpO1xuICB9XG5cbiAgcmV0dXJuIHVybDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIHBhdGggdG8gdGhlIGNhY2hlIGxvY2F0aW9uIGFsb25nIHdpdGggZW5zdXJpbmcgaXRzIGV4aXN0YW5jZVxuICpcbiAqIEBwYXJhbSBsb2NhdGlvbiBTZWUgdGhlIHtAbGluayBDYWNoZUxvY2F0aW9ufSB0eXBlXG4gKiBAcmV0dXJucyBUaGUgY2FjaGUgbG9jYXRpb24gcGF0aFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlQ2FjaGVMb2NhdGlvbihcbiAgbG9jYXRpb246IENhY2hlTG9jYXRpb24gPSBcImRlbm9cIixcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGlmIChsb2NhdGlvbiA9PT0gXCJkZW5vXCIpIHtcbiAgICBjb25zdCBkaXIgPSBkZW5vQ2FjaGVEaXIoKTtcblxuICAgIGlmIChkaXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIkNvdWxkIG5vdCBnZXQgdGhlIGRlbm8gY2FjaGUgZGlyZWN0b3J5LCB0cnkgdXNpbmcgYW5vdGhlciBDYWNoZUxvY2F0aW9uIGluIHRoZSBwbHVnIG9wdGlvbnMuXCIsXG4gICAgICApO1xuICAgIH1cblxuICAgIGxvY2F0aW9uID0gam9pbihkaXIsIFwicGx1Z1wiKTtcbiAgfSBlbHNlIGlmIChsb2NhdGlvbiA9PT0gXCJjYWNoZVwiKSB7XG4gICAgY29uc3QgZGlyID0gY2FjaGVEaXIoKTtcblxuICAgIGlmIChkaXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIkNvdWxkIG5vdCBnZXQgdGhlIGNhY2hlIGRpcmVjdG9yeSwgdHJ5IHVzaW5nIGFub3RoZXIgQ2FjaGVMb2NhdGlvbiBpbiB0aGUgcGx1ZyBvcHRpb25zLlwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBsb2NhdGlvbiA9IGpvaW4oZGlyLCBcInBsdWdcIik7XG4gIH0gZWxzZSBpZiAobG9jYXRpb24gPT09IFwiY3dkXCIpIHtcbiAgICBsb2NhdGlvbiA9IGpvaW4oRGVuby5jd2QoKSwgXCJwbHVnXCIpO1xuICB9IGVsc2UgaWYgKGxvY2F0aW9uID09PSBcInRtcFwiKSB7XG4gICAgbG9jYXRpb24gPSBhd2FpdCBEZW5vLm1ha2VUZW1wRGlyKHsgcHJlZml4OiBcInBsdWdcIiB9KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbG9jYXRpb24gPT09IFwic3RyaW5nXCIgJiYgbG9jYXRpb24uc3RhcnRzV2l0aChcImZpbGU6Ly9cIikpIHtcbiAgICBsb2NhdGlvbiA9IGZyb21GaWxlVXJsKGxvY2F0aW9uKTtcbiAgfSBlbHNlIGlmIChsb2NhdGlvbiBpbnN0YW5jZW9mIFVSTCkge1xuICAgIGlmIChsb2NhdGlvbj8ucHJvdG9jb2wgIT09IFwiZmlsZTpcIikge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgXCJDYW5ub3QgdXNlIGFueSBvdGhlciBwcm90b2NvbCB0aGFuIGZpbGU6Ly8gZm9yIGFuIFVSTCBjYWNoZSBsb2NhdGlvbi5cIixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbG9jYXRpb24gPSBmcm9tRmlsZVVybChsb2NhdGlvbik7XG4gIH1cblxuICBsb2NhdGlvbiA9IHJlc29sdmUobm9ybWFsaXplKGxvY2F0aW9uKSk7XG5cbiAgYXdhaXQgZW5zdXJlRGlyKGxvY2F0aW9uKTtcblxuICByZXR1cm4gbG9jYXRpb247XG59XG5cbi8qKlxuICogRG93bmxvYWRzIGEgZmlsZSB1c2luZyB0aGUgc3BlY2lmaWVkIHtAbGluayBGZXRjaE9wdGlvbnN9XG4gKlxuICogQHBhcmFtIG9wdGlvbnMgU2VlIHtAbGluayBGZXRjaE9wdGlvbnN9XG4gKiBAcmV0dXJucyBUaGUgcGF0aCB0byB0aGUgZG93bmxvYWRlZCBmaWxlIGluIGl0cyBjYWNoZWQgbG9jYXRpb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkKG9wdGlvbnM6IEZldGNoT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGxvY2F0aW9uID1cbiAgICAodHlwZW9mIG9wdGlvbnMgPT09IFwib2JqZWN0XCIgJiYgXCJsb2NhdGlvblwiIGluIG9wdGlvbnNcbiAgICAgID8gb3B0aW9ucy5sb2NhdGlvblxuICAgICAgOiB1bmRlZmluZWQpID8/IFwiZGVub1wiO1xuICBjb25zdCBzZXR0aW5nID1cbiAgICAodHlwZW9mIG9wdGlvbnMgPT09IFwib2JqZWN0XCIgJiYgXCJjYWNoZVwiIGluIG9wdGlvbnNcbiAgICAgID8gb3B0aW9ucy5jYWNoZVxuICAgICAgOiB1bmRlZmluZWQpID8/IFwidXNlXCI7XG4gIGNvbnN0IHVybCA9IGNyZWF0ZURvd25sb2FkVVJMKG9wdGlvbnMpO1xuICBjb25zdCBkaXJlY3RvcnkgPSBhd2FpdCBlbnN1cmVDYWNoZUxvY2F0aW9uKGxvY2F0aW9uKTtcbiAgY29uc3QgY2FjaGVCYXNlUGF0aCA9IGpvaW4oZGlyZWN0b3J5LCBhd2FpdCB1cmxUb0ZpbGVuYW1lKHVybCkpO1xuICBjb25zdCBjYWNoZUZpbGVQYXRoID0gYCR7Y2FjaGVCYXNlUGF0aH0ke2V4dG5hbWUodXJsLnBhdGhuYW1lKX1gO1xuICBjb25zdCBjYWNoZU1ldGFQYXRoID0gYCR7Y2FjaGVCYXNlUGF0aH0ubWV0YWRhdGEuanNvbmA7XG4gIGNvbnN0IGNhY2hlZCA9IHNldHRpbmcgPT09IFwidXNlXCJcbiAgICA/IGF3YWl0IGlzRmlsZShjYWNoZUZpbGVQYXRoKVxuICAgIDogc2V0dGluZyA9PT0gXCJvbmx5XCIgfHwgc2V0dGluZyAhPT0gXCJyZWxvYWRBbGxcIjtcblxuICBhd2FpdCBlbnN1cmVEaXIoZGlybmFtZShjYWNoZUJhc2VQYXRoKSk7XG5cbiAgaWYgKCFjYWNoZWQpIHtcbiAgICBjb25zdCBtZXRhID0geyB1cmwgfTtcbiAgICBzd2l0Y2ggKHVybC5wcm90b2NvbCkge1xuICAgICAgY2FzZSBcImh0dHA6XCI6XG4gICAgICBjYXNlIFwiaHR0cHM6XCI6IHtcbiAgICAgICAgY29uc29sZS5sb2coYCR7Z3JlZW4oXCJEb3dubG9hZGluZ1wiKX0gJHt1cmx9YCk7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLnRvU3RyaW5nKCkpO1xuXG4gICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGZpbmQgJHt1cmx9YCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5IdHRwKFxuICAgICAgICAgICAgICBgJHtyZXNwb25zZS5zdGF0dXN9ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBEZW5vLndyaXRlRmlsZShcbiAgICAgICAgICBjYWNoZUZpbGVQYXRoLFxuICAgICAgICAgIG5ldyBVaW50OEFycmF5KGF3YWl0IHJlc3BvbnNlLmFycmF5QnVmZmVyKCkpLFxuICAgICAgICApO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSBcImZpbGU6XCI6IHtcbiAgICAgICAgY29uc29sZS5sb2coYCR7Z3JlZW4oXCJDb3B5aW5nXCIpfSAke3VybH1gKTtcbiAgICAgICAgYXdhaXQgRGVuby5jb3B5RmlsZShmcm9tRmlsZVVybCh1cmwpLCBjYWNoZUZpbGVQYXRoKTtcbiAgICAgICAgaWYgKERlbm8uYnVpbGQub3MgIT09IFwid2luZG93c1wiKSB7XG4gICAgICAgICAgYXdhaXQgRGVuby5jaG1vZChjYWNoZUZpbGVQYXRoLCAwbzY0NCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICBgQ2Fubm90IGZldGNoIHRvIGNhY2hlIHVzaW5nIHRoZSBcIiR7dXJsLnByb3RvY29sfVwiIHByb3RvY29sYCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKGNhY2hlTWV0YVBhdGgsIEpTT04uc3RyaW5naWZ5KG1ldGEpKTtcbiAgfVxuXG4gIGlmICghKGF3YWl0IGlzRmlsZShjYWNoZUZpbGVQYXRoKSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaW5kIFwiJHt1cmx9XCIgaW4gY2FjaGUuYCk7XG4gIH1cblxuICByZXR1cm4gY2FjaGVGaWxlUGF0aDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztDQUlDLEdBRUQsU0FDRSxPQUFPLEVBQ1AsT0FBTyxFQUNQLFdBQVcsRUFDWCxJQUFJLEVBQ0osU0FBUyxFQUNULE9BQU8sUUFDRixtQkFBbUI7QUFDMUIsU0FBUyxTQUFTLFFBQVEsaUJBQWlCO0FBQzNDLFNBQVMsS0FBSyxRQUFRLHlCQUF5QjtBQVEvQyxTQUNFLFFBQVEsRUFDUixZQUFZLEVBQ1osTUFBTSxFQUNOLFdBQVcsRUFDWCxhQUFhLFFBQ1IsWUFBWTtBQUVuQjs7OztDQUlDLEdBQ0QsT0FBTyxNQUFNLFlBQXdDO0VBQUM7RUFBVTtDQUFVLENBQUM7QUFFM0U7Ozs7Q0FJQyxHQUNELE9BQU8sTUFBTSxVQUFvQztFQUMvQztFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7Q0FDRCxDQUFDO0FBRUY7OztDQUdDLEdBQ0QsT0FBTyxNQUFNLG9C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
// denoCacheMetadata=10508672446585598139,2773937680730035797