// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { getFileInfoType } from "./_get_file_info_type.ts";
/**
 * Asynchronously ensures that the directory exists. If the directory structure
 * does not exist, it is created. Like `mkdir -p`.
 *
 * Requires the `--allow-read` and `--allow-write` flag.
 *
 * @param dir The path of the directory to ensure, as a string or URL.
 * @returns A promise that resolves once the directory exists.
 *
 * @example
 * ```ts
 * import { ensureDir } from "@std/fs/ensure-dir";
 *
 * await ensureDir("./bar");
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
 * Synchronously ensures that the directory exists. If the directory structure
 * does not exist, it is created. Like `mkdir -p`.
 *
 * Requires the `--allow-read` and `--allow-write` flag.
 *
 * @param dir The path of the directory to ensure, as a string or URL.
 * @returns A void value that returns once the directory exists.
 *
 * @example
 * ```ts
 * import { ensureDir } from "@std/fs/ensure-dir";
 *
 * await ensureDir("./bar");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvZnMvMC4yMjEuMC9lbnN1cmVfZGlyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBnZXRGaWxlSW5mb1R5cGUgfSBmcm9tIFwiLi9fZ2V0X2ZpbGVfaW5mb190eXBlLnRzXCI7XG5cbi8qKlxuICogQXN5bmNocm9ub3VzbHkgZW5zdXJlcyB0aGF0IHRoZSBkaXJlY3RvcnkgZXhpc3RzLiBJZiB0aGUgZGlyZWN0b3J5IHN0cnVjdHVyZVxuICogZG9lcyBub3QgZXhpc3QsIGl0IGlzIGNyZWF0ZWQuIExpa2UgYG1rZGlyIC1wYC5cbiAqXG4gKiBSZXF1aXJlcyB0aGUgYC0tYWxsb3ctcmVhZGAgYW5kIGAtLWFsbG93LXdyaXRlYCBmbGFnLlxuICpcbiAqIEBwYXJhbSBkaXIgVGhlIHBhdGggb2YgdGhlIGRpcmVjdG9yeSB0byBlbnN1cmUsIGFzIGEgc3RyaW5nIG9yIFVSTC5cbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIG9uY2UgdGhlIGRpcmVjdG9yeSBleGlzdHMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBlbnN1cmVEaXIgfSBmcm9tIFwiQHN0ZC9mcy9lbnN1cmUtZGlyXCI7XG4gKlxuICogYXdhaXQgZW5zdXJlRGlyKFwiLi9iYXJcIik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZURpcihkaXI6IHN0cmluZyB8IFVSTCkge1xuICB0cnkge1xuICAgIGNvbnN0IGZpbGVJbmZvID0gYXdhaXQgRGVuby5sc3RhdChkaXIpO1xuICAgIGlmICghZmlsZUluZm8uaXNEaXJlY3RvcnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEVuc3VyZSBwYXRoIGV4aXN0cywgZXhwZWN0ZWQgJ2RpcicsIGdvdCAnJHtcbiAgICAgICAgICBnZXRGaWxlSW5mb1R5cGUoZmlsZUluZm8pXG4gICAgICAgIH0nYCxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpKSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG5cbiAgLy8gVGhlIGRpciBkb2Vzbid0IGV4aXN0LiBDcmVhdGUgaXQuXG4gIC8vIFRoaXMgY2FuIGJlIHJhY3kuIFNvIHdlIGNhdGNoIEFscmVhZHlFeGlzdHMgYW5kIGNoZWNrIGxzdGF0IGFnYWluLlxuICB0cnkge1xuICAgIGF3YWl0IERlbm8ubWtkaXIoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuQWxyZWFkeUV4aXN0cykpIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IERlbm8ubHN0YXQoZGlyKTtcbiAgICBpZiAoIWZpbGVJbmZvLmlzRGlyZWN0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBFbnN1cmUgcGF0aCBleGlzdHMsIGV4cGVjdGVkICdkaXInLCBnb3QgJyR7XG4gICAgICAgICAgZ2V0RmlsZUluZm9UeXBlKGZpbGVJbmZvKVxuICAgICAgICB9J2AsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgZW5zdXJlcyB0aGF0IHRoZSBkaXJlY3RvcnkgZXhpc3RzLiBJZiB0aGUgZGlyZWN0b3J5IHN0cnVjdHVyZVxuICogZG9lcyBub3QgZXhpc3QsIGl0IGlzIGNyZWF0ZWQuIExpa2UgYG1rZGlyIC1wYC5cbiAqXG4gKiBSZXF1aXJlcyB0aGUgYC0tYWxsb3ctcmVhZGAgYW5kIGAtLWFsbG93LXdyaXRlYCBmbGFnLlxuICpcbiAqIEBwYXJhbSBkaXIgVGhlIHBhdGggb2YgdGhlIGRpcmVjdG9yeSB0byBlbnN1cmUsIGFzIGEgc3RyaW5nIG9yIFVSTC5cbiAqIEByZXR1cm5zIEEgdm9pZCB2YWx1ZSB0aGF0IHJldHVybnMgb25jZSB0aGUgZGlyZWN0b3J5IGV4aXN0cy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGVuc3VyZURpciB9IGZyb20gXCJAc3RkL2ZzL2Vuc3VyZS1kaXJcIjtcbiAqXG4gKiBhd2FpdCBlbnN1cmVEaXIoXCIuL2JhclwiKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlRGlyU3luYyhkaXI6IHN0cmluZyB8IFVSTCkge1xuICB0cnkge1xuICAgIGNvbnN0IGZpbGVJbmZvID0gRGVuby5sc3RhdFN5bmMoZGlyKTtcbiAgICBpZiAoIWZpbGVJbmZvLmlzRGlyZWN0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBFbnN1cmUgcGF0aCBleGlzdHMsIGV4cGVjdGVkICdkaXInLCBnb3QgJyR7XG4gICAgICAgICAgZ2V0RmlsZUluZm9UeXBlKGZpbGVJbmZvKVxuICAgICAgICB9J2AsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmICghKGVyciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSkge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoZSBkaXIgZG9lc24ndCBleGlzdC4gQ3JlYXRlIGl0LlxuICAvLyBUaGlzIGNhbiBiZSByYWN5LiBTbyB3ZSBjYXRjaCBBbHJlYWR5RXhpc3RzIGFuZCBjaGVjayBsc3RhdCBhZ2Fpbi5cbiAgdHJ5IHtcbiAgICBEZW5vLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5BbHJlYWR5RXhpc3RzKSkge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGVJbmZvID0gRGVuby5sc3RhdFN5bmMoZGlyKTtcbiAgICBpZiAoIWZpbGVJbmZvLmlzRGlyZWN0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBFbnN1cmUgcGF0aCBleGlzdHMsIGV4cGVjdGVkICdkaXInLCBnb3QgJyR7XG4gICAgICAgICAgZ2V0RmlsZUluZm9UeXBlKGZpbGVJbmZvKVxuICAgICAgICB9J2AsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxTQUFTLGVBQWUsUUFBUSwyQkFBMkI7QUFFM0Q7Ozs7Ozs7Ozs7Ozs7OztDQWVDLEdBQ0QsT0FBTyxlQUFlLFVBQVUsR0FBaUI7RUFDL0MsSUFBSTtJQUNGLE1BQU0sV0FBVyxNQUFNLEtBQUssS0FBSyxDQUFDO0lBQ2xDLElBQUksQ0FBQyxTQUFTLFdBQVcsRUFBRTtNQUN6QixNQUFNLElBQUksTUFDUixDQUFDLHlDQUF5QyxFQUN4QyxnQkFBZ0IsVUFDakIsQ0FBQyxDQUFDO0lBRVA7SUFDQTtFQUNGLEVBQUUsT0FBTyxLQUFLO0lBQ1osSUFBSSxDQUFDLENBQUMsZUFBZSxLQUFLLE1BQU0sQ0FBQyxRQUFRLEdBQUc7TUFDMUMsTUFBTTtJQUNSO0VBQ0Y7RUFFQSxvQ0FBb0M7RUFDcEMscUVBQXFFO0VBQ3JFLElBQUk7SUFDRixNQUFNLEtBQUssS0FBSyxDQUFDLEtBQUs7TUFBRSxXQUFXO0lBQUs7RUFDMUMsRUFBRSxPQUFPLEtBQUs7SUFDWixJQUFJLENBQUMsQ0FBQyxlQUFlLEtBQUssTUFBTSxDQUFDLGFBQWEsR0FBRztNQUMvQyxNQUFNO0lBQ1I7SUFFQSxNQUFNLFdBQVcsTUFBTSxLQUFLLEtBQUssQ0FBQztJQUNsQyxJQUFJLENBQUMsU0FBUyxXQUFXLEVBQUU7TUFDekIsTUFBTSxJQUFJLE1BQ1IsQ0FBQyx5Q0FBeUMsRUFDeEMsZ0JBQWdCLFVBQ2pCLENBQUMsQ0FBQztJQUVQO0VBQ0Y7QUFDRjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxjQUFjLEdBQWlCO0VBQzdDLElBQUk7SUFDRixNQUFNLFdBQVcsS0FBSyxTQUFTLENBQUM7SUFDaEMsSUFBSSxDQUFDLFNBQVMsV0FBVyxFQUFFO01BQ3pCLE1BQU0sSUFBSSxNQUNSLENBQUMseUNBQXlDLEVBQ3hDLGdCQUFnQixVQUNqQixDQUFDLENBQUM7SUFFUDtJQUNBO0VBQ0YsRUFBRSxPQUFPLEtBQUs7SUFDWixJQUFJLENBQUMsQ0FBQyxlQUFlLEtBQUssTUFBTSxDQUFDLFFBQVEsR0FBRztNQUMxQyxNQUFNO0lBQ1I7RUFDRjtFQUVBLG9DQUFvQztFQUNwQyxxRUFBcUU7RUFDckUsSUFBSTtJQUNGLEtBQUssU0FBUyxDQUFDLEtBQUs7TUFBRSxXQUFXO0lBQUs7RUFDeEMsRUFBRSxPQUFPLEtBQUs7SUFDWixJQUFJLENBQUMsQ0FBQyxlQUFlLEtBQUssTUFBTSxDQUFDLGFBQWEsR0FBRztNQUMvQyxNQUFNO0lBQ1I7SUFFQSxNQUFNLFdBQVcsS0FBSyxTQUFTLENBQUM7SUFDaEMsSUFBSSxDQUFDLFNBQVMsV0FBVyxFQUFFO01BQ3pCLE1BQU0sSUFBSSxNQUNSLENBQUMseUNBQXlDLEVBQ3hDLGdCQUFnQixVQUNqQixDQUFDLENBQUM7SUFFUDtFQUNGO0FBQ0YifQ==
// denoCacheMetadata=17512615864734837431,14808948803531287473