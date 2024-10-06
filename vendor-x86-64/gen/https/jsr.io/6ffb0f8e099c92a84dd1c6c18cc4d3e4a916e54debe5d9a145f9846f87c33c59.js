/**
 * This module contains the common types used in plug.
 *
 * @module
 */ import { dirname, extname, fromFileUrl, join, normalize, resolve } from "jsr:@std/path@^0.221.0";
import { ensureDir } from "jsr:@std/fs@^0.221.0";
import { green } from "jsr:@std/fmt@^0.221.0/colors";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BkZW5vc2F1cnMvcGx1Zy8xLjAuNi9kb3dubG9hZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgbW9kdWxlIGNvbnRhaW5zIHRoZSBjb21tb24gdHlwZXMgdXNlZCBpbiBwbHVnLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQge1xuICBkaXJuYW1lLFxuICBleHRuYW1lLFxuICBmcm9tRmlsZVVybCxcbiAgam9pbixcbiAgbm9ybWFsaXplLFxuICByZXNvbHZlLFxufSBmcm9tIFwianNyOkBzdGQvcGF0aEBeMC4yMjEuMFwiO1xuaW1wb3J0IHsgZW5zdXJlRGlyIH0gZnJvbSBcImpzcjpAc3RkL2ZzQF4wLjIyMS4wXCI7XG5pbXBvcnQgeyBncmVlbiB9IGZyb20gXCJqc3I6QHN0ZC9mbXRAXjAuMjIxLjAvY29sb3JzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFyY2hSZWNvcmQsXG4gIENhY2hlTG9jYXRpb24sXG4gIEZldGNoT3B0aW9ucyxcbiAgTmVzdGVkQ3Jvc3NSZWNvcmQsXG4gIE9zUmVjb3JkLFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuaW1wb3J0IHtcbiAgY2FjaGVEaXIsXG4gIGRlbm9DYWNoZURpcixcbiAgaXNGaWxlLFxuICBzdHJpbmdUb1VSTCxcbiAgdXJsVG9GaWxlbmFtZSxcbn0gZnJvbSBcIi4vdXRpbC50c1wiO1xuXG4vKipcbiAqIEEgbGlzdCBvZiBhbGwgcG9zc2libGUgc3lzdGVtIGFyY2hpdGVjdHVyZXMuXG4gKlxuICogVGhpcyBzaG91bGQgbWF0Y2ggdGhlIHtAbGluayBEZW5vLmJ1aWxkLmFyY2h9IHR5cGUuXG4gKi9cbmV4cG9ydCBjb25zdCBBTExfQVJDSFM6ICh0eXBlb2YgRGVuby5idWlsZC5hcmNoKVtdID0gW1xuICBcIng4Nl82NFwiLFxuICBcImFhcmNoNjRcIixcbl07XG5cbi8qKlxuICogQSBsaXN0IG9mIGFsbCBwb3NzaWJsZSBzeXN0ZW0gb3BlcmF0aW5nIHN5c3RlbXMuXG4gKlxuICogVGhpcyBzaG91bGQgbWF0Y2ggdGhlIHtAbGluayBEZW5vLmJ1aWxkLm9zfSB0eXBlLlxuICovXG5leHBvcnQgY29uc3QgQUxMX09TUzogKHR5cGVvZiBEZW5vLmJ1aWxkLm9zKVtdID0gW1xuICBcImRhcndpblwiLFxuICBcImxpbnV4XCIsXG4gIFwiYW5kcm9pZFwiLFxuICBcIndpbmRvd3NcIixcbiAgXCJmcmVlYnNkXCIsXG4gIFwibmV0YnNkXCIsXG4gIFwiYWl4XCIsXG4gIFwic29sYXJpc1wiLFxuICBcImlsbHVtb3NcIixcbl07XG5cbi8qKlxuICogVGhlIGRlZmF1bHQgZmlsZSBleHRlbnNpb25zIGZvciBkeW5hbWljIGxpYnJhcmllcyBpbiB0aGUgZGlmZmVyZW50IG9wZXJhdGluZ1xuICogc3lzdGVtcy5cbiAqL1xuZXhwb3J0IGNvbnN0IGRlZmF1bHRFeHRlbnNpb25zOiBPc1JlY29yZDxzdHJpbmc+ID0ge1xuICBkYXJ3aW46IFwiZHlsaWJcIixcbiAgbGludXg6IFwic29cIixcbiAgd2luZG93czogXCJkbGxcIixcbiAgZnJlZWJzZDogXCJzb1wiLFxuICBuZXRic2Q6IFwic29cIixcbiAgYWl4OiBcInNvXCIsXG4gIHNvbGFyaXM6IFwic29cIixcbiAgaWxsdW1vczogXCJzb1wiLFxuICBhbmRyb2lkOiBcInNvXCIsXG59O1xuXG4vKipcbiAqIFRoZSBkZWZhdWx0IGZpbGUgcHJlZml4ZXMgZm9yIGR5bmFtaWMgbGlicmFyaWVzIGluIHRoZSBkaWZmZXJlbnQgb3BlcmF0aW5nXG4gKiBzeXN0ZW1zLlxuICovXG5leHBvcnQgY29uc3QgZGVmYXVsdFByZWZpeGVzOiBPc1JlY29yZDxzdHJpbmc+ID0ge1xuICBkYXJ3aW46IFwibGliXCIsXG4gIGxpbnV4OiBcImxpYlwiLFxuICBuZXRic2Q6IFwibGliXCIsXG4gIGZyZWVic2Q6IFwibGliXCIsXG4gIGFpeDogXCJsaWJcIixcbiAgc29sYXJpczogXCJsaWJcIixcbiAgaWxsdW1vczogXCJsaWJcIixcbiAgd2luZG93czogXCJcIixcbiAgYW5kcm9pZDogXCJsaWJcIixcbn07XG5cbmZ1bmN0aW9uIGdldENyb3NzT3B0aW9uPFQ+KHJlY29yZD86IE5lc3RlZENyb3NzUmVjb3JkPFQ+KTogVCB8IHVuZGVmaW5lZCB7XG4gIGlmIChyZWNvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChBTExfT1NTLnNvbWUoKG9zKSA9PiBvcyBpbiByZWNvcmQpKSB7XG4gICAgY29uc3Qgc3VicmVjb3JkID0gKHJlY29yZCBhcyBPc1JlY29yZDxUPilbRGVuby5idWlsZC5vc107XG5cbiAgICBpZiAoXG4gICAgICBzdWJyZWNvcmQgJiZcbiAgICAgIHR5cGVvZiBzdWJyZWNvcmQgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgIEFMTF9BUkNIUy5zb21lKChhcmNoKSA9PiBhcmNoIGluIHN1YnJlY29yZClcbiAgICApIHtcbiAgICAgIHJldHVybiAoc3VicmVjb3JkIGFzIEFyY2hSZWNvcmQ8VD4pW0Rlbm8uYnVpbGQuYXJjaF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdWJyZWNvcmQgYXMgVDtcbiAgICB9XG4gIH1cblxuICBpZiAoQUxMX0FSQ0hTLnNvbWUoKGFyY2gpID0+IGFyY2ggaW4gcmVjb3JkKSkge1xuICAgIGNvbnN0IHN1YnJlY29yZCA9IChyZWNvcmQgYXMgQXJjaFJlY29yZDxUPilbRGVuby5idWlsZC5hcmNoXTtcblxuICAgIGlmIChcbiAgICAgIHN1YnJlY29yZCAmJlxuICAgICAgdHlwZW9mIHN1YnJlY29yZCA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgQUxMX09TUy5zb21lKChvcykgPT4gb3MgaW4gc3VicmVjb3JkKVxuICAgICkge1xuICAgICAgcmV0dXJuIChzdWJyZWNvcmQgYXMgT3NSZWNvcmQ8VD4pW0Rlbm8uYnVpbGQub3NdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3VicmVjb3JkIGFzIFQ7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGNyb3NzLXBsYXRmb3JtIHVybCBmb3IgdGhlIHNwZWNpZmllZCBvcHRpb25zXG4gKlxuICogQHBhcmFtIG9wdGlvbnMgU2VlIHtAbGluayBGZXRjaE9wdGlvbnN9XG4gKiBAcmV0dXJucyBBIGZ1bGx5IHNwZWNpZmllZCB1cmwgdG8gdGhlIHNwZWNpZmllZCBmaWxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEb3dubG9hZFVSTChvcHRpb25zOiBGZXRjaE9wdGlvbnMpOiBVUkwge1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwic3RyaW5nXCIgfHwgb3B0aW9ucyBpbnN0YW5jZW9mIFVSTCkge1xuICAgIG9wdGlvbnMgPSB7IHVybDogb3B0aW9ucyB9O1xuICB9XG5cbiAgLy8gSW5pdGlhbGl6ZSBkZWZhdWx0IG9wdGlvbnNcbiAgb3B0aW9ucy5leHRlbnNpb25zID8/PSBkZWZhdWx0RXh0ZW5zaW9ucztcbiAgb3B0aW9ucy5wcmVmaXhlcyA/Pz0gZGVmYXVsdFByZWZpeGVzO1xuXG4gIC8vIENsZWFuIGV4dGVuc2lvbnMgdG8gbm90IGNvbnRhaW4gYSBsZWFkaW5nIGRvdFxuICBmb3IgKGNvbnN0IGtleSBpbiBvcHRpb25zLmV4dGVuc2lvbnMpIHtcbiAgICBjb25zdCBvcyA9IGtleSBhcyB0eXBlb2YgRGVuby5idWlsZC5vcztcbiAgICBpZiAob3B0aW9ucy5leHRlbnNpb25zW29zXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBvcHRpb25zLmV4dGVuc2lvbnNbb3NdID0gb3B0aW9ucy5leHRlbnNpb25zW29zXS5yZXBsYWNlKC9cXC4/KC4rKS8sIFwiJDFcIik7XG4gICAgfVxuICB9XG5cbiAgLy8gR2V0IHRoZSBvcy1zcGVjaWZpYyB1cmxcbiAgbGV0IHVybDogVVJMO1xuICBpZiAob3B0aW9ucy51cmwgaW5zdGFuY2VvZiBVUkwpIHtcbiAgICB1cmwgPSBvcHRpb25zLnVybDtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucy51cmwgPT09IFwic3RyaW5nXCIpIHtcbiAgICB1cmwgPSBzdHJpbmdUb1VSTChvcHRpb25zLnVybCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdG1wVXJsID0gZ2V0Q3Jvc3NPcHRpb24ob3B0aW9ucy51cmwpO1xuICAgIGlmICh0bXBVcmwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgYEFuIFVSTCBmb3IgdGhlIFwiJHtEZW5vLmJ1aWxkLm9zfS0ke0Rlbm8uYnVpbGQuYXJjaH1cIiB0YXJnZXQgd2FzIG5vdCBwcm92aWRlZC5gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRtcFVybCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdXJsID0gc3RyaW5nVG9VUkwodG1wVXJsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXJsID0gdG1wVXJsO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFzc2VtYmxlIGF1dG9tYXRpYyBjcm9zcy1wbGF0Zm9ybSBuYW1lZCB1cmxzIGhlcmVcbiAgaWYgKFxuICAgIFwibmFtZVwiIGluIG9wdGlvbnMgJiZcbiAgICAhT2JqZWN0LnZhbHVlcyhvcHRpb25zLmV4dGVuc2lvbnMpLmluY2x1ZGVzKGV4dG5hbWUodXJsLnBhdGhuYW1lKSlcbiAgKSB7XG4gICAgaWYgKCF1cmwucGF0aG5hbWUuZW5kc1dpdGgoXCIvXCIpKSB7XG4gICAgICB1cmwucGF0aG5hbWUgPSBgJHt1cmwucGF0aG5hbWV9L2A7XG4gICAgfVxuXG4gICAgY29uc3QgcHJlZml4ID0gZ2V0Q3Jvc3NPcHRpb24ob3B0aW9ucy5wcmVmaXhlcykgPz8gXCJcIjtcbiAgICBjb25zdCBzdWZmaXggPSBnZXRDcm9zc09wdGlvbihvcHRpb25zLnN1ZmZpeGVzKSA/PyBcIlwiO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IG9wdGlvbnMuZXh0ZW5zaW9uc1tEZW5vLmJ1aWxkLm9zXTtcblxuICAgIGlmIChvcHRpb25zLm5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgYEV4cGVjdGVkIHRoZSBcIm5hbWVcIiBwcm9wZXJ0eSBmb3IgYW4gYXV0b21hdGljYWxseSBhc3NlbWJsZWQgVVJMLmAsXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGVuYW1lID0gYCR7cHJlZml4fSR7b3B0aW9ucy5uYW1lfSR7c3VmZml4fS4ke2V4dGVuc2lvbn1gO1xuXG4gICAgdXJsID0gbmV3IFVSTChmaWxlbmFtZSwgdXJsKTtcbiAgfVxuXG4gIHJldHVybiB1cmw7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBwYXRoIHRvIHRoZSBjYWNoZSBsb2NhdGlvbiBhbG9uZyB3aXRoIGVuc3VyaW5nIGl0cyBleGlzdGFuY2VcbiAqXG4gKiBAcGFyYW0gbG9jYXRpb24gU2VlIHRoZSB7QGxpbmsgQ2FjaGVMb2NhdGlvbn0gdHlwZVxuICogQHJldHVybnMgVGhlIGNhY2hlIGxvY2F0aW9uIHBhdGhcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZUNhY2hlTG9jYXRpb24oXG4gIGxvY2F0aW9uOiBDYWNoZUxvY2F0aW9uID0gXCJkZW5vXCIsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBpZiAobG9jYXRpb24gPT09IFwiZGVub1wiKSB7XG4gICAgY29uc3QgZGlyID0gZGVub0NhY2hlRGlyKCk7XG5cbiAgICBpZiAoZGlyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJDb3VsZCBub3QgZ2V0IHRoZSBkZW5vIGNhY2hlIGRpcmVjdG9yeSwgdHJ5IHVzaW5nIGFub3RoZXIgQ2FjaGVMb2NhdGlvbiBpbiB0aGUgcGx1ZyBvcHRpb25zLlwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBsb2NhdGlvbiA9IGpvaW4oZGlyLCBcInBsdWdcIik7XG4gIH0gZWxzZSBpZiAobG9jYXRpb24gPT09IFwiY2FjaGVcIikge1xuICAgIGNvbnN0IGRpciA9IGNhY2hlRGlyKCk7XG5cbiAgICBpZiAoZGlyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJDb3VsZCBub3QgZ2V0IHRoZSBjYWNoZSBkaXJlY3RvcnksIHRyeSB1c2luZyBhbm90aGVyIENhY2hlTG9jYXRpb24gaW4gdGhlIHBsdWcgb3B0aW9ucy5cIixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbG9jYXRpb24gPSBqb2luKGRpciwgXCJwbHVnXCIpO1xuICB9IGVsc2UgaWYgKGxvY2F0aW9uID09PSBcImN3ZFwiKSB7XG4gICAgbG9jYXRpb24gPSBqb2luKERlbm8uY3dkKCksIFwicGx1Z1wiKTtcbiAgfSBlbHNlIGlmIChsb2NhdGlvbiA9PT0gXCJ0bXBcIikge1xuICAgIGxvY2F0aW9uID0gYXdhaXQgRGVuby5tYWtlVGVtcERpcih7IHByZWZpeDogXCJwbHVnXCIgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGxvY2F0aW9uID09PSBcInN0cmluZ1wiICYmIGxvY2F0aW9uLnN0YXJ0c1dpdGgoXCJmaWxlOi8vXCIpKSB7XG4gICAgbG9jYXRpb24gPSBmcm9tRmlsZVVybChsb2NhdGlvbik7XG4gIH0gZWxzZSBpZiAobG9jYXRpb24gaW5zdGFuY2VvZiBVUkwpIHtcbiAgICBpZiAobG9jYXRpb24/LnByb3RvY29sICE9PSBcImZpbGU6XCIpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwiQ2Fubm90IHVzZSBhbnkgb3RoZXIgcHJvdG9jb2wgdGhhbiBmaWxlOi8vIGZvciBhbiBVUkwgY2FjaGUgbG9jYXRpb24uXCIsXG4gICAgICApO1xuICAgIH1cblxuICAgIGxvY2F0aW9uID0gZnJvbUZpbGVVcmwobG9jYXRpb24pO1xuICB9XG5cbiAgbG9jYXRpb24gPSByZXNvbHZlKG5vcm1hbGl6ZShsb2NhdGlvbikpO1xuXG4gIGF3YWl0IGVuc3VyZURpcihsb2NhdGlvbik7XG5cbiAgcmV0dXJuIGxvY2F0aW9uO1xufVxuXG4vKipcbiAqIERvd25sb2FkcyBhIGZpbGUgdXNpbmcgdGhlIHNwZWNpZmllZCB7QGxpbmsgRmV0Y2hPcHRpb25zfVxuICpcbiAqIEBwYXJhbSBvcHRpb25zIFNlZSB7QGxpbmsgRmV0Y2hPcHRpb25zfVxuICogQHJldHVybnMgVGhlIHBhdGggdG8gdGhlIGRvd25sb2FkZWQgZmlsZSBpbiBpdHMgY2FjaGVkIGxvY2F0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZChvcHRpb25zOiBGZXRjaE9wdGlvbnMpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBsb2NhdGlvbiA9XG4gICAgKHR5cGVvZiBvcHRpb25zID09PSBcIm9iamVjdFwiICYmIFwibG9jYXRpb25cIiBpbiBvcHRpb25zXG4gICAgICA/IG9wdGlvbnMubG9jYXRpb25cbiAgICAgIDogdW5kZWZpbmVkKSA/PyBcImRlbm9cIjtcbiAgY29uc3Qgc2V0dGluZyA9XG4gICAgKHR5cGVvZiBvcHRpb25zID09PSBcIm9iamVjdFwiICYmIFwiY2FjaGVcIiBpbiBvcHRpb25zXG4gICAgICA/IG9wdGlvbnMuY2FjaGVcbiAgICAgIDogdW5kZWZpbmVkKSA/PyBcInVzZVwiO1xuICBjb25zdCB1cmwgPSBjcmVhdGVEb3dubG9hZFVSTChvcHRpb25zKTtcbiAgY29uc3QgZGlyZWN0b3J5ID0gYXdhaXQgZW5zdXJlQ2FjaGVMb2NhdGlvbihsb2NhdGlvbik7XG4gIGNvbnN0IGNhY2hlQmFzZVBhdGggPSBqb2luKGRpcmVjdG9yeSwgYXdhaXQgdXJsVG9GaWxlbmFtZSh1cmwpKTtcbiAgY29uc3QgY2FjaGVGaWxlUGF0aCA9IGAke2NhY2hlQmFzZVBhdGh9JHtleHRuYW1lKHVybC5wYXRobmFtZSl9YDtcbiAgY29uc3QgY2FjaGVNZXRhUGF0aCA9IGAke2NhY2hlQmFzZVBhdGh9Lm1ldGFkYXRhLmpzb25gO1xuICBjb25zdCBjYWNoZWQgPSBzZXR0aW5nID09PSBcInVzZVwiXG4gICAgPyBhd2FpdCBpc0ZpbGUoY2FjaGVGaWxlUGF0aClcbiAgICA6IHNldHRpbmcgPT09IFwib25seVwiIHx8IHNldHRpbmcgIT09IFwicmVsb2FkQWxsXCI7XG5cbiAgYXdhaXQgZW5zdXJlRGlyKGRpcm5hbWUoY2FjaGVCYXNlUGF0aCkpO1xuXG4gIGlmICghY2FjaGVkKSB7XG4gICAgY29uc3QgbWV0YSA9IHsgdXJsIH07XG4gICAgc3dpdGNoICh1cmwucHJvdG9jb2wpIHtcbiAgICAgIGNhc2UgXCJodHRwOlwiOlxuICAgICAgY2FzZSBcImh0dHBzOlwiOiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke2dyZWVuKFwiRG93bmxvYWRpbmdcIil9ICR7dXJsfWApO1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybC50b1N0cmluZygpKTtcblxuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaW5kICR7dXJsfWApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuSHR0cChcbiAgICAgICAgICAgICAgYCR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgRGVuby53cml0ZUZpbGUoXG4gICAgICAgICAgY2FjaGVGaWxlUGF0aCxcbiAgICAgICAgICBuZXcgVWludDhBcnJheShhd2FpdCByZXNwb25zZS5hcnJheUJ1ZmZlcigpKSxcbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgXCJmaWxlOlwiOiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke2dyZWVuKFwiQ29weWluZ1wiKX0gJHt1cmx9YCk7XG4gICAgICAgIGF3YWl0IERlbm8uY29weUZpbGUoZnJvbUZpbGVVcmwodXJsKSwgY2FjaGVGaWxlUGF0aCk7XG4gICAgICAgIGlmIChEZW5vLmJ1aWxkLm9zICE9PSBcIndpbmRvd3NcIikge1xuICAgICAgICAgIGF3YWl0IERlbm8uY2htb2QoY2FjaGVGaWxlUGF0aCwgMG82NDQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgYENhbm5vdCBmZXRjaCB0byBjYWNoZSB1c2luZyB0aGUgXCIke3VybC5wcm90b2NvbH1cIiBwcm90b2NvbGAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShjYWNoZU1ldGFQYXRoLCBKU09OLnN0cmluZ2lmeShtZXRhKSk7XG4gIH1cblxuICBpZiAoIShhd2FpdCBpc0ZpbGUoY2FjaGVGaWxlUGF0aCkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZmluZCBcIiR7dXJsfVwiIGluIGNhY2hlLmApO1xuICB9XG5cbiAgcmV0dXJuIGNhY2hlRmlsZVBhdGg7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Q0FJQyxHQUVELFNBQ0UsT0FBTyxFQUNQLE9BQU8sRUFDUCxXQUFXLEVBQ1gsSUFBSSxFQUNKLFNBQVMsRUFDVCxPQUFPLFFBQ0YseUJBQXlCO0FBQ2hDLFNBQVMsU0FBUyxRQUFRLHVCQUF1QjtBQUNqRCxTQUFTLEtBQUssUUFBUSwrQkFBK0I7QUFRckQsU0FDRSxRQUFRLEVBQ1IsWUFBWSxFQUNaLE1BQU0sRUFDTixXQUFXLEVBQ1gsYUFBYSxRQUNSLFlBQVk7QUFFbkI7Ozs7Q0FJQyxHQUNELE9BQU8sTUFBTSxZQUF3QztFQUNuRDtFQUNBO0NBQ0QsQ0FBQztBQUVGOzs7O0NBSUMsR0FDRCxPQUFPLE1BQU0sVUFBb0M7RUFDL0M7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0NBQ0QsQ0FBQztB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
// denoCacheMetadata=3990568527552502662,15922196767562661864