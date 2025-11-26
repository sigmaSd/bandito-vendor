// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Documentation and interface for walk were adapted from Go
// https://golang.org/pkg/path/filepath/#Walk
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
import { join } from "../path/join.ts";
import { normalize } from "../path/normalize.ts";
import { toPathString } from "./_to_path_string.ts";
import { createWalkEntry, createWalkEntrySync } from "./_create_walk_entry.ts";
/** Error thrown in {@linkcode walk} or {@linkcode walkSync} during iteration. */ export class WalkError extends Error {
  /** File path of the root that's being walked. */ root;
  /** Constructs a new instance. */ constructor(cause, root){
    super(`${cause instanceof Error ? cause.message : cause} for path "${root}"`);
    this.cause = cause;
    this.name = "WalkError";
    this.root = root;
  }
}
function include(path, exts, match, skip) {
  if (exts && !exts.some((ext)=>path.endsWith(ext))) {
    return false;
  }
  if (match && !match.some((pattern)=>!!path.match(pattern))) {
    return false;
  }
  if (skip && skip.some((pattern)=>!!path.match(pattern))) {
    return false;
  }
  return true;
}
function wrapErrorWithPath(err, root) {
  if (err instanceof WalkError) return err;
  return new WalkError(err, root);
}
/**
 * Walks the file tree rooted at root, yielding each file or directory in the
 * tree filtered according to the given options.
 *
 * @example
 * ```ts
 * import { walk } from "https://deno.land/std@$STD_VERSION/fs/walk.ts";
 * import { assert } from "https://deno.land/std@$STD_VERSION/assert/assert.ts";
 *
 * for await (const entry of walk(".")) {
 *   console.log(entry.path);
 *   assert(entry.isFile);
 * }
 * ```
 */ export async function* walk(root, { maxDepth = Infinity, includeFiles = true, includeDirs = true, includeSymlinks = true, followSymlinks = false, canonicalize = true, exts = undefined, match = undefined, skip = undefined } = {}) {
  if (maxDepth < 0) {
    return;
  }
  root = toPathString(root);
  if (includeDirs && include(root, exts, match, skip)) {
    yield await createWalkEntry(root);
  }
  if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
    return;
  }
  try {
    for await (const entry of Deno.readDir(root)){
      let path = join(root, entry.name);
      let { isSymlink, isDirectory } = entry;
      if (isSymlink) {
        if (!followSymlinks) {
          if (includeSymlinks && include(path, exts, match, skip)) {
            yield {
              path,
              ...entry
            };
          }
          continue;
        }
        const realPath = await Deno.realPath(path);
        if (canonicalize) {
          path = realPath;
        }
        // Caveat emptor: don't assume |path| is not a symlink. realpath()
        // resolves symlinks but another process can replace the file system
        // entity with a different type of entity before we call lstat().
        ({ isSymlink, isDirectory } = await Deno.lstat(realPath));
      }
      if (isSymlink || isDirectory) {
        yield* walk(path, {
          maxDepth: maxDepth - 1,
          includeFiles,
          includeDirs,
          includeSymlinks,
          followSymlinks,
          exts,
          match,
          skip
        });
      } else if (includeFiles && include(path, exts, match, skip)) {
        yield {
          path,
          ...entry
        };
      }
    }
  } catch (err) {
    throw wrapErrorWithPath(err, normalize(root));
  }
}
/** Same as {@linkcode walk} but uses synchronous ops */ export function* walkSync(root, { maxDepth = Infinity, includeFiles = true, includeDirs = true, includeSymlinks = true, followSymlinks = false, canonicalize = true, exts = undefined, match = undefined, skip = undefined } = {}) {
  root = toPathString(root);
  if (maxDepth < 0) {
    return;
  }
  if (includeDirs && include(root, exts, match, skip)) {
    yield createWalkEntrySync(root);
  }
  if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
    return;
  }
  let entries;
  try {
    entries = Deno.readDirSync(root);
  } catch (err) {
    throw wrapErrorWithPath(err, normalize(root));
  }
  for (const entry of entries){
    let path = join(root, entry.name);
    let { isSymlink, isDirectory } = entry;
    if (isSymlink) {
      if (!followSymlinks) {
        if (includeSymlinks && include(path, exts, match, skip)) {
          yield {
            path,
            ...entry
          };
        }
        continue;
      }
      const realPath = Deno.realPathSync(path);
      if (canonicalize) {
        path = realPath;
      }
      // Caveat emptor: don't assume |path| is not a symlink. realpath()
      // resolves symlinks but another process can replace the file system
      // entity with a different type of entity before we call lstat().
      ({ isSymlink, isDirectory } = Deno.lstatSync(realPath));
    }
    if (isSymlink || isDirectory) {
      yield* walkSync(path, {
        maxDepth: maxDepth - 1,
        includeFiles,
        includeDirs,
        includeSymlinks,
        followSymlinks,
        exts,
        match,
        skip
      });
    } else if (includeFiles && include(path, exts, match, skip)) {
      yield {
        path,
        ...entry
      };
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL2ZzL3dhbGsudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIERvY3VtZW50YXRpb24gYW5kIGludGVyZmFjZSBmb3Igd2FsayB3ZXJlIGFkYXB0ZWQgZnJvbSBHb1xuLy8gaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9wYXRoL2ZpbGVwYXRoLyNXYWxrXG4vLyBDb3B5cmlnaHQgMjAwOSBUaGUgR28gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gQlNEIGxpY2Vuc2UuXG5pbXBvcnQgeyBqb2luIH0gZnJvbSBcIi4uL3BhdGgvam9pbi50c1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSBcIi4uL3BhdGgvbm9ybWFsaXplLnRzXCI7XG5pbXBvcnQgeyB0b1BhdGhTdHJpbmcgfSBmcm9tIFwiLi9fdG9fcGF0aF9zdHJpbmcudHNcIjtcbmltcG9ydCB7XG4gIGNyZWF0ZVdhbGtFbnRyeSxcbiAgY3JlYXRlV2Fsa0VudHJ5U3luYyxcbiAgdHlwZSBXYWxrRW50cnksXG59IGZyb20gXCIuL19jcmVhdGVfd2Fsa19lbnRyeS50c1wiO1xuXG4vKiogRXJyb3IgdGhyb3duIGluIHtAbGlua2NvZGUgd2Fsa30gb3Ige0BsaW5rY29kZSB3YWxrU3luY30gZHVyaW5nIGl0ZXJhdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBXYWxrRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBGaWxlIHBhdGggb2YgdGhlIHJvb3QgdGhhdCdzIGJlaW5nIHdhbGtlZC4gKi9cbiAgcm9vdDogc3RyaW5nO1xuXG4gIC8qKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlLiAqL1xuICBjb25zdHJ1Y3RvcihjYXVzZTogdW5rbm93biwgcm9vdDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBgJHtjYXVzZSBpbnN0YW5jZW9mIEVycm9yID8gY2F1c2UubWVzc2FnZSA6IGNhdXNlfSBmb3IgcGF0aCBcIiR7cm9vdH1cImAsXG4gICAgKTtcbiAgICB0aGlzLmNhdXNlID0gY2F1c2U7XG4gICAgdGhpcy5uYW1lID0gXCJXYWxrRXJyb3JcIjtcbiAgICB0aGlzLnJvb3QgPSByb290O1xuICB9XG59XG5cbmZ1bmN0aW9uIGluY2x1ZGUoXG4gIHBhdGg6IHN0cmluZyxcbiAgZXh0cz86IHN0cmluZ1tdLFxuICBtYXRjaD86IFJlZ0V4cFtdLFxuICBza2lwPzogUmVnRXhwW10sXG4pOiBib29sZWFuIHtcbiAgaWYgKGV4dHMgJiYgIWV4dHMuc29tZSgoZXh0KTogYm9vbGVhbiA9PiBwYXRoLmVuZHNXaXRoKGV4dCkpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChtYXRjaCAmJiAhbWF0Y2guc29tZSgocGF0dGVybik6IGJvb2xlYW4gPT4gISFwYXRoLm1hdGNoKHBhdHRlcm4pKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoc2tpcCAmJiBza2lwLnNvbWUoKHBhdHRlcm4pOiBib29sZWFuID0+ICEhcGF0aC5tYXRjaChwYXR0ZXJuKSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHdyYXBFcnJvcldpdGhQYXRoKGVycjogdW5rbm93biwgcm9vdDogc3RyaW5nKSB7XG4gIGlmIChlcnIgaW5zdGFuY2VvZiBXYWxrRXJyb3IpIHJldHVybiBlcnI7XG4gIHJldHVybiBuZXcgV2Fsa0Vycm9yKGVyciwgcm9vdCk7XG59XG5cbi8qKiBPcHRpb25zIGZvciB7QGxpbmtjb2RlIHdhbGt9IGFuZCB7QGxpbmtjb2RlIHdhbGtTeW5jfS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgV2Fsa09wdGlvbnMge1xuICAvKipcbiAgICogVGhlIG1heGltdW0gZGVwdGggb2YgdGhlIGZpbGUgdHJlZSB0byBiZSB3YWxrZWQgcmVjdXJzaXZlbHkuXG4gICAqIEBkZWZhdWx0IHtJbmZpbml0eX1cbiAgICovXG4gIG1heERlcHRoPzogbnVtYmVyO1xuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgZmlsZSBlbnRyaWVzIHNob3VsZCBiZSBpbmNsdWRlZCBvciBub3QuXG4gICAqIEBkZWZhdWx0IHt0cnVlfVxuICAgKi9cbiAgaW5jbHVkZUZpbGVzPzogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGV0aGVyIGRpcmVjdG9yeSBlbnRyaWVzIHNob3VsZCBiZSBpbmNsdWRlZCBvciBub3QuXG4gICAqIEBkZWZhdWx0IHt0cnVlfVxuICAgKi9cbiAgaW5jbHVkZURpcnM/OiBib29sZWFuO1xuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgc3ltbGluayBlbnRyaWVzIHNob3VsZCBiZSBpbmNsdWRlZCBvciBub3QuXG4gICAqIFRoaXMgb3B0aW9uIGlzIG1lYW5pbmdmdWwgb25seSBpZiBgZm9sbG93U3ltbGlua3NgIGlzIHNldCB0byBgZmFsc2VgLlxuICAgKiBAZGVmYXVsdCB7dHJ1ZX1cbiAgICovXG4gIGluY2x1ZGVTeW1saW5rcz86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciBzeW1saW5rcyBzaG91bGQgYmUgcmVzb2x2ZWQgb3Igbm90LlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqL1xuICBmb2xsb3dTeW1saW5rcz86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgZm9sbG93ZWQgc3ltbGluaydzIHBhdGggc2hvdWxkIGJlIGNhbm9uaWNhbGl6ZWQuXG4gICAqIFRoaXMgb3B0aW9uIHdvcmtzIG9ubHkgaWYgYGZvbGxvd1N5bWxpbmtzYCBpcyBub3QgYGZhbHNlYC5cbiAgICogQGRlZmF1bHQge3RydWV9XG4gICAqL1xuICBjYW5vbmljYWxpemU/OiBib29sZWFuO1xuICAvKipcbiAgICogTGlzdCBvZiBmaWxlIGV4dGVuc2lvbnMgdXNlZCB0byBmaWx0ZXIgZW50cmllcy5cbiAgICogSWYgc3BlY2lmaWVkLCBlbnRyaWVzIHdpdGhvdXQgdGhlIGZpbGUgZXh0ZW5zaW9uIHNwZWNpZmllZCBieSB0aGlzIG9wdGlvbiBhcmUgZXhjbHVkZWQuXG4gICAqIEBkZWZhdWx0IHt1bmRlZmluZWR9XG4gICAqL1xuICBleHRzPzogc3RyaW5nW107XG4gIC8qKlxuICAgKiBMaXN0IG9mIHJlZ3VsYXIgZXhwcmVzc2lvbiBwYXR0ZXJucyB1c2VkIHRvIGZpbHRlciBlbnRyaWVzLlxuICAgKiBJZiBzcGVjaWZpZWQsIGVudHJpZXMgdGhhdCBkbyBub3QgbWF0Y2ggdGhlIHBhdHRlcm5zIHNwZWNpZmllZCBieSB0aGlzIG9wdGlvbiBhcmUgZXhjbHVkZWQuXG4gICAqIEBkZWZhdWx0IHt1bmRlZmluZWR9XG4gICAqL1xuICBtYXRjaD86IFJlZ0V4cFtdO1xuICAvKipcbiAgICogTGlzdCBvZiByZWd1bGFyIGV4cHJlc3Npb24gcGF0dGVybnMgdXNlZCB0byBmaWx0ZXIgZW50cmllcy5cbiAgICogSWYgc3BlY2lmaWVkLCBlbnRyaWVzIG1hdGNoaW5nIHRoZSBwYXR0ZXJucyBzcGVjaWZpZWQgYnkgdGhpcyBvcHRpb24gYXJlIGV4Y2x1ZGVkLlxuICAgKiBAZGVmYXVsdCB7dW5kZWZpbmVkfVxuICAgKi9cbiAgc2tpcD86IFJlZ0V4cFtdO1xufVxuZXhwb3J0IHR5cGUgeyBXYWxrRW50cnkgfTtcblxuLyoqXG4gKiBXYWxrcyB0aGUgZmlsZSB0cmVlIHJvb3RlZCBhdCByb290LCB5aWVsZGluZyBlYWNoIGZpbGUgb3IgZGlyZWN0b3J5IGluIHRoZVxuICogdHJlZSBmaWx0ZXJlZCBhY2NvcmRpbmcgdG8gdGhlIGdpdmVuIG9wdGlvbnMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB3YWxrIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZnMvd2Fsay50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYXNzZXJ0L2Fzc2VydC50c1wiO1xuICpcbiAqIGZvciBhd2FpdCAoY29uc3QgZW50cnkgb2Ygd2FsayhcIi5cIikpIHtcbiAqICAgY29uc29sZS5sb2coZW50cnkucGF0aCk7XG4gKiAgIGFzc2VydChlbnRyeS5pc0ZpbGUpO1xuICogfVxuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogd2FsayhcbiAgcm9vdDogc3RyaW5nIHwgVVJMLFxuICB7XG4gICAgbWF4RGVwdGggPSBJbmZpbml0eSxcbiAgICBpbmNsdWRlRmlsZXMgPSB0cnVlLFxuICAgIGluY2x1ZGVEaXJzID0gdHJ1ZSxcbiAgICBpbmNsdWRlU3ltbGlua3MgPSB0cnVlLFxuICAgIGZvbGxvd1N5bWxpbmtzID0gZmFsc2UsXG4gICAgY2Fub25pY2FsaXplID0gdHJ1ZSxcbiAgICBleHRzID0gdW5kZWZpbmVkLFxuICAgIG1hdGNoID0gdW5kZWZpbmVkLFxuICAgIHNraXAgPSB1bmRlZmluZWQsXG4gIH06IFdhbGtPcHRpb25zID0ge30sXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8V2Fsa0VudHJ5PiB7XG4gIGlmIChtYXhEZXB0aCA8IDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcm9vdCA9IHRvUGF0aFN0cmluZyhyb290KTtcbiAgaWYgKGluY2x1ZGVEaXJzICYmIGluY2x1ZGUocm9vdCwgZXh0cywgbWF0Y2gsIHNraXApKSB7XG4gICAgeWllbGQgYXdhaXQgY3JlYXRlV2Fsa0VudHJ5KHJvb3QpO1xuICB9XG4gIGlmIChtYXhEZXB0aCA8IDEgfHwgIWluY2x1ZGUocm9vdCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHNraXApKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgZm9yIGF3YWl0IChjb25zdCBlbnRyeSBvZiBEZW5vLnJlYWREaXIocm9vdCkpIHtcbiAgICAgIGxldCBwYXRoID0gam9pbihyb290LCBlbnRyeS5uYW1lKTtcblxuICAgICAgbGV0IHsgaXNTeW1saW5rLCBpc0RpcmVjdG9yeSB9ID0gZW50cnk7XG5cbiAgICAgIGlmIChpc1N5bWxpbmspIHtcbiAgICAgICAgaWYgKCFmb2xsb3dTeW1saW5rcykge1xuICAgICAgICAgIGlmIChpbmNsdWRlU3ltbGlua3MgJiYgaW5jbHVkZShwYXRoLCBleHRzLCBtYXRjaCwgc2tpcCkpIHtcbiAgICAgICAgICAgIHlpZWxkIHsgcGF0aCwgLi4uZW50cnkgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVhbFBhdGggPSBhd2FpdCBEZW5vLnJlYWxQYXRoKHBhdGgpO1xuICAgICAgICBpZiAoY2Fub25pY2FsaXplKSB7XG4gICAgICAgICAgcGF0aCA9IHJlYWxQYXRoO1xuICAgICAgICB9XG4gICAgICAgIC8vIENhdmVhdCBlbXB0b3I6IGRvbid0IGFzc3VtZSB8cGF0aHwgaXMgbm90IGEgc3ltbGluay4gcmVhbHBhdGgoKVxuICAgICAgICAvLyByZXNvbHZlcyBzeW1saW5rcyBidXQgYW5vdGhlciBwcm9jZXNzIGNhbiByZXBsYWNlIHRoZSBmaWxlIHN5c3RlbVxuICAgICAgICAvLyBlbnRpdHkgd2l0aCBhIGRpZmZlcmVudCB0eXBlIG9mIGVudGl0eSBiZWZvcmUgd2UgY2FsbCBsc3RhdCgpLlxuICAgICAgICAoeyBpc1N5bWxpbmssIGlzRGlyZWN0b3J5IH0gPSBhd2FpdCBEZW5vLmxzdGF0KHJlYWxQYXRoKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1N5bWxpbmsgfHwgaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgeWllbGQqIHdhbGsocGF0aCwge1xuICAgICAgICAgIG1heERlcHRoOiBtYXhEZXB0aCAtIDEsXG4gICAgICAgICAgaW5jbHVkZUZpbGVzLFxuICAgICAgICAgIGluY2x1ZGVEaXJzLFxuICAgICAgICAgIGluY2x1ZGVTeW1saW5rcyxcbiAgICAgICAgICBmb2xsb3dTeW1saW5rcyxcbiAgICAgICAgICBleHRzLFxuICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgIHNraXAsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChpbmNsdWRlRmlsZXMgJiYgaW5jbHVkZShwYXRoLCBleHRzLCBtYXRjaCwgc2tpcCkpIHtcbiAgICAgICAgeWllbGQgeyBwYXRoLCAuLi5lbnRyeSB9O1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgd3JhcEVycm9yV2l0aFBhdGgoZXJyLCBub3JtYWxpemUocm9vdCkpO1xuICB9XG59XG5cbi8qKiBTYW1lIGFzIHtAbGlua2NvZGUgd2Fsa30gYnV0IHVzZXMgc3luY2hyb25vdXMgb3BzICovXG5leHBvcnQgZnVuY3Rpb24qIHdhbGtTeW5jKFxuICByb290OiBzdHJpbmcgfCBVUkwsXG4gIHtcbiAgICBtYXhEZXB0aCA9IEluZmluaXR5LFxuICAgIGluY2x1ZGVGaWxlcyA9IHRydWUsXG4gICAgaW5jbHVkZURpcnMgPSB0cnVlLFxuICAgIGluY2x1ZGVTeW1saW5rcyA9IHRydWUsXG4gICAgZm9sbG93U3ltbGlua3MgPSBmYWxzZSxcbiAgICBjYW5vbmljYWxpemUgPSB0cnVlLFxuICAgIGV4dHMgPSB1bmRlZmluZWQsXG4gICAgbWF0Y2ggPSB1bmRlZmluZWQsXG4gICAgc2tpcCA9IHVuZGVmaW5lZCxcbiAgfTogV2Fsa09wdGlvbnMgPSB7fSxcbik6IEl0ZXJhYmxlSXRlcmF0b3I8V2Fsa0VudHJ5PiB7XG4gIHJvb3QgPSB0b1BhdGhTdHJpbmcocm9vdCk7XG4gIGlmIChtYXhEZXB0aCA8IDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGluY2x1ZGVEaXJzICYmIGluY2x1ZGUocm9vdCwgZXh0cywgbWF0Y2gsIHNraXApKSB7XG4gICAgeWllbGQgY3JlYXRlV2Fsa0VudHJ5U3luYyhyb290KTtcbiAgfVxuICBpZiAobWF4RGVwdGggPCAxIHx8ICFpbmNsdWRlKHJvb3QsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBza2lwKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgZW50cmllcztcbiAgdHJ5IHtcbiAgICBlbnRyaWVzID0gRGVuby5yZWFkRGlyU3luYyhyb290KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgd3JhcEVycm9yV2l0aFBhdGgoZXJyLCBub3JtYWxpemUocm9vdCkpO1xuICB9XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgIGxldCBwYXRoID0gam9pbihyb290LCBlbnRyeS5uYW1lKTtcblxuICAgIGxldCB7IGlzU3ltbGluaywgaXNEaXJlY3RvcnkgfSA9IGVudHJ5O1xuXG4gICAgaWYgKGlzU3ltbGluaykge1xuICAgICAgaWYgKCFmb2xsb3dTeW1saW5rcykge1xuICAgICAgICBpZiAoaW5jbHVkZVN5bWxpbmtzICYmIGluY2x1ZGUocGF0aCwgZXh0cywgbWF0Y2gsIHNraXApKSB7XG4gICAgICAgICAgeWllbGQgeyBwYXRoLCAuLi5lbnRyeSB9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVhbFBhdGggPSBEZW5vLnJlYWxQYXRoU3luYyhwYXRoKTtcbiAgICAgIGlmIChjYW5vbmljYWxpemUpIHtcbiAgICAgICAgcGF0aCA9IHJlYWxQYXRoO1xuICAgICAgfVxuICAgICAgLy8gQ2F2ZWF0IGVtcHRvcjogZG9uJ3QgYXNzdW1lIHxwYXRofCBpcyBub3QgYSBzeW1saW5rLiByZWFscGF0aCgpXG4gICAgICAvLyByZXNvbHZlcyBzeW1saW5rcyBidXQgYW5vdGhlciBwcm9jZXNzIGNhbiByZXBsYWNlIHRoZSBmaWxlIHN5c3RlbVxuICAgICAgLy8gZW50aXR5IHdpdGggYSBkaWZmZXJlbnQgdHlwZSBvZiBlbnRpdHkgYmVmb3JlIHdlIGNhbGwgbHN0YXQoKS5cbiAgICAgICh7IGlzU3ltbGluaywgaXNEaXJlY3RvcnkgfSA9IERlbm8ubHN0YXRTeW5jKHJlYWxQYXRoKSk7XG4gICAgfVxuXG4gICAgaWYgKGlzU3ltbGluayB8fCBpc0RpcmVjdG9yeSkge1xuICAgICAgeWllbGQqIHdhbGtTeW5jKHBhdGgsIHtcbiAgICAgICAgbWF4RGVwdGg6IG1heERlcHRoIC0gMSxcbiAgICAgICAgaW5jbHVkZUZpbGVzLFxuICAgICAgICBpbmNsdWRlRGlycyxcbiAgICAgICAgaW5jbHVkZVN5bWxpbmtzLFxuICAgICAgICBmb2xsb3dTeW1saW5rcyxcbiAgICAgICAgZXh0cyxcbiAgICAgICAgbWF0Y2gsXG4gICAgICAgIHNraXAsXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGluY2x1ZGVGaWxlcyAmJiBpbmNsdWRlKHBhdGgsIGV4dHMsIG1hdGNoLCBza2lwKSkge1xuICAgICAgeWllbGQgeyBwYXRoLCAuLi5lbnRyeSB9O1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSw0REFBNEQ7QUFDNUQsNkNBQTZDO0FBQzdDLG1FQUFtRTtBQUNuRSxTQUFTLElBQUksUUFBUSxrQkFBa0I7QUFDdkMsU0FBUyxTQUFTLFFBQVEsdUJBQXVCO0FBQ2pELFNBQVMsWUFBWSxRQUFRLHVCQUF1QjtBQUNwRCxTQUNFLGVBQWUsRUFDZixtQkFBbUIsUUFFZCwwQkFBMEI7QUFFakMsK0VBQStFLEdBQy9FLE9BQU8sTUFBTSxrQkFBa0I7RUFDN0IsK0NBQStDLEdBQy9DLEtBQWE7RUFFYiwrQkFBK0IsR0FDL0IsWUFBWSxLQUFjLEVBQUUsSUFBWSxDQUFFO0lBQ3hDLEtBQUssQ0FDSCxHQUFHLGlCQUFpQixRQUFRLE1BQU0sT0FBTyxHQUFHLE1BQU0sV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXhFLElBQUksQ0FBQyxLQUFLLEdBQUc7SUFDYixJQUFJLENBQUMsSUFBSSxHQUFHO0lBQ1osSUFBSSxDQUFDLElBQUksR0FBRztFQUNkO0FBQ0Y7QUFFQSxTQUFTLFFBQ1AsSUFBWSxFQUNaLElBQWUsRUFDZixLQUFnQixFQUNoQixJQUFlO0VBRWYsSUFB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
// denoCacheMetadata=9957014115758618479,1877938386131564445