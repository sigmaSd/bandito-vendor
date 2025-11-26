// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { getFileInfoType } from "./_get_file_info_type.ts";
/**
 * Ensures that the directory exists.
 * If the directory structure does not exist, it is created. Like mkdir -p.
 * Requires the `--allow-read` and `--allow-write` flag.
 *
 * @example
 * ```ts
 * import { ensureDir } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * ensureDir("./bar"); // returns a promise
 * ```
 */ export async function ensureDir(dir) {
  try {
    const fileInfo = await Deno.lstat(dir);
    if (!fileInfo.isDirectory) {
      throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
    }
    return;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }
  // The dir doesn't exist. Create it.
  // This can be racy. So we catch AlreadyExists and check lstat again.
  try {
    await Deno.mkdir(dir, {
      recursive: true
    });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
    const fileInfo = await Deno.lstat(dir);
    if (!fileInfo.isDirectory) {
      throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
    }
  }
}
/**
 * Ensures that the directory exists.
 * If the directory structure does not exist, it is created. Like mkdir -p.
 * Requires the `--allow-read` and `--allow-write` flag.
 *
 * @example
 * ```ts
 * import { ensureDirSync } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * ensureDirSync("./ensureDirSync"); // void
 * ```
 */ export function ensureDirSync(dir) {
  try {
    const fileInfo = Deno.lstatSync(dir);
    if (!fileInfo.isDirectory) {
      throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
    }
    return;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }
  // The dir doesn't exist. Create it.
  // This can be racy. So we catch AlreadyExists and check lstat again.
  try {
    Deno.mkdirSync(dir, {
      recursive: true
    });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
    const fileInfo = Deno.lstatSync(dir);
    if (!fileInfo.isDirectory) {
      throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL2ZzL2Vuc3VyZV9kaXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IGdldEZpbGVJbmZvVHlwZSB9IGZyb20gXCIuL19nZXRfZmlsZV9pbmZvX3R5cGUudHNcIjtcblxuLyoqXG4gKiBFbnN1cmVzIHRoYXQgdGhlIGRpcmVjdG9yeSBleGlzdHMuXG4gKiBJZiB0aGUgZGlyZWN0b3J5IHN0cnVjdHVyZSBkb2VzIG5vdCBleGlzdCwgaXQgaXMgY3JlYXRlZC4gTGlrZSBta2RpciAtcC5cbiAqIFJlcXVpcmVzIHRoZSBgLS1hbGxvdy1yZWFkYCBhbmQgYC0tYWxsb3ctd3JpdGVgIGZsYWcuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBlbnN1cmVEaXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9mcy9tb2QudHNcIjtcbiAqXG4gKiBlbnN1cmVEaXIoXCIuL2JhclwiKTsgLy8gcmV0dXJucyBhIHByb21pc2VcbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlRGlyKGRpcjogc3RyaW5nIHwgVVJMKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgZmlsZUluZm8gPSBhd2FpdCBEZW5vLmxzdGF0KGRpcik7XG4gICAgaWYgKCFmaWxlSW5mby5pc0RpcmVjdG9yeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRW5zdXJlIHBhdGggZXhpc3RzLCBleHBlY3RlZCAnZGlyJywgZ290ICcke1xuICAgICAgICAgIGdldEZpbGVJbmZvVHlwZShmaWxlSW5mbylcbiAgICAgICAgfSdgLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkpIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cblxuICAvLyBUaGUgZGlyIGRvZXNuJ3QgZXhpc3QuIENyZWF0ZSBpdC5cbiAgLy8gVGhpcyBjYW4gYmUgcmFjeS4gU28gd2UgY2F0Y2ggQWxyZWFkeUV4aXN0cyBhbmQgY2hlY2sgbHN0YXQgYWdhaW4uXG4gIHRyeSB7XG4gICAgYXdhaXQgRGVuby5ta2RpcihkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5BbHJlYWR5RXhpc3RzKSkge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGVJbmZvID0gYXdhaXQgRGVuby5sc3RhdChkaXIpO1xuICAgIGlmICghZmlsZUluZm8uaXNEaXJlY3RvcnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEVuc3VyZSBwYXRoIGV4aXN0cywgZXhwZWN0ZWQgJ2RpcicsIGdvdCAnJHtcbiAgICAgICAgICBnZXRGaWxlSW5mb1R5cGUoZmlsZUluZm8pXG4gICAgICAgIH0nYCxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRW5zdXJlcyB0aGF0IHRoZSBkaXJlY3RvcnkgZXhpc3RzLlxuICogSWYgdGhlIGRpcmVjdG9yeSBzdHJ1Y3R1cmUgZG9lcyBub3QgZXhpc3QsIGl0IGlzIGNyZWF0ZWQuIExpa2UgbWtkaXIgLXAuXG4gKiBSZXF1aXJlcyB0aGUgYC0tYWxsb3ctcmVhZGAgYW5kIGAtLWFsbG93LXdyaXRlYCBmbGFnLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZW5zdXJlRGlyU3luYyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZzL21vZC50c1wiO1xuICpcbiAqIGVuc3VyZURpclN5bmMoXCIuL2Vuc3VyZURpclN5bmNcIik7IC8vIHZvaWRcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlRGlyU3luYyhkaXI6IHN0cmluZyB8IFVSTCkge1xuICB0cnkge1xuICAgIGNvbnN0IGZpbGVJbmZvID0gRGVuby5sc3RhdFN5bmMoZGlyKTtcbiAgICBpZiAoIWZpbGVJbmZvLmlzRGlyZWN0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBFbnN1cmUgcGF0aCBleGlzdHMsIGV4cGVjdGVkICdkaXInLCBnb3QgJyR7XG4gICAgICAgICAgZ2V0RmlsZUluZm9UeXBlKGZpbGVJbmZvKVxuICAgICAgICB9J2AsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmICghKGVyciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSkge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoZSBkaXIgZG9lc24ndCBleGlzdC4gQ3JlYXRlIGl0LlxuICAvLyBUaGlzIGNhbiBiZSByYWN5LiBTbyB3ZSBjYXRjaCBBbHJlYWR5RXhpc3RzIGFuZCBjaGVjayBsc3RhdCBhZ2Fpbi5cbiAgdHJ5IHtcbiAgICBEZW5vLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5BbHJlYWR5RXhpc3RzKSkge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGVJbmZvID0gRGVuby5sc3RhdFN5bmMoZGlyKTtcbiAgICBpZiAoIWZpbGVJbmZvLmlzRGlyZWN0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBFbnN1cmUgcGF0aCBleGlzdHMsIGV4cGVjdGVkICdkaXInLCBnb3QgJyR7XG4gICAgICAgICAgZ2V0RmlsZUluZm9UeXBlKGZpbGVJbmZvKVxuICAgICAgICB9J2AsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxTQUFTLGVBQWUsUUFBUSwyQkFBMkI7QUFFM0Q7Ozs7Ozs7Ozs7O0NBV0MsR0FDRCxPQUFPLGVBQWUsVUFBVSxHQUFpQjtFQUMvQyxJQUFJO0lBQ0YsTUFBTSxXQUFXLE1BQU0sS0FBSyxLQUFLLENBQUM7SUFDbEMsSUFBSSxDQUFDLFNBQVMsV0FBVyxFQUFFO01BQ3pCLE1BQU0sSUFBSSxNQUNSLENBQUMseUNBQXlDLEVBQ3hDLGdCQUFnQixVQUNqQixDQUFDLENBQUM7SUFFUDtJQUNBO0VBQ0YsRUFBRSxPQUFPLEtBQUs7SUFDWixJQUFJLENBQUMsQ0FBQyxlQUFlLEtBQUssTUFBTSxDQUFDLFFBQVEsR0FBRztNQUMxQyxNQUFNO0lBQ1I7RUFDRjtFQUVBLG9DQUFvQztFQUNwQyxxRUFBcUU7RUFDckUsSUFBSTtJQUNGLE1BQU0sS0FBSyxLQUFLLENBQUMsS0FBSztNQUFFLFdBQVc7SUFBSztFQUMxQyxFQUFFLE9BQU8sS0FBSztJQUNaLElBQUksQ0FBQyxDQUFDLGVBQWUsS0FBSyxNQUFNLENBQUMsYUFBYSxHQUFHO01BQy9DLE1BQU07SUFDUjtJQUVBLE1BQU0sV0FBVyxNQUFNLEtBQUssS0FBSyxDQUFDO0lBQ2xDLElBQUksQ0FBQyxTQUFTLFdBQVcsRUFBRTtNQUN6QixNQUFNLElBQUksTUFDUixDQUFDLHlDQUF5QyxFQUN4QyxnQkFBZ0IsVUFDakIsQ0FBQyxDQUFDO0lBRVA7RUFDRjtBQUNGO0FBRUE7Ozs7Ozs7Ozs7O0NBV0MsR0FDRCxPQUFPLFNBQVMsY0FBYyxHQUFpQjtFQUM3QyxJQUFJO0lBQ0YsTUFBTSxXQUFXLEtBQUssU0FBUyxDQUFDO0lBQ2hDLElBQUksQ0FBQyxTQUFTLFdBQVcsRUFBRTtNQUN6QixNQUFNLElBQUksTUFDUixDQUFDLHlDQUF5QyxFQUN4QyxnQkFBZ0IsVUFDakIsQ0FBQyxDQUFDO0lBRVA7SUFDQTtFQUNGLEVBQUUsT0FBTyxLQUFLO0lBQ1osSUFBSSxDQUFDLENBQUMsZUFBZSxLQUFLLE1BQU0sQ0FBQyxRQUFRLEdBQUc7TUFDMUMsTUFBTTtJQUNSO0VBQ0Y7RUFFQSxvQ0FBb0M7RUFDcEMscUVBQXFFO0VBQ3JFLElBQUk7SUFDRixLQUFLLFNBQVMsQ0FBQyxLQUFLO01BQUUsV0FBVztJQUFLO0VBQ3hDLEVBQUUsT0FBTyxLQUFLO0lBQ1osSUFBSSxDQUFDLENBQUMsZUFBZSxLQUFLLE1BQU0sQ0FBQyxhQUFhLEdBQUc7TUFDL0MsTUFBTTtJQUNSO0lBRUEsTUFBTSxXQUFXLEtBQUssU0FBUyxDQUFDO0lBQ2hDLElBQUksQ0FBQyxTQUFTLFdBQVcsRUFBRTtNQUN6QixNQUFNLElBQUksTUFDUixDQUFDLHlDQUF5QyxFQUN4QyxnQkFBZ0IsVUFDakIsQ0FBQyxDQUFDO0lBRVA7RUFDRjtBQUNGIn0=
// denoCacheMetadata=6759768461820257043,3186409588580494067