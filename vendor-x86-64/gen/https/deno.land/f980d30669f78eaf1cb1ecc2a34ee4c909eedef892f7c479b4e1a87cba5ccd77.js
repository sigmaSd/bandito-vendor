// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { dirname } from "../path/dirname.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { getFileInfoType } from "./_get_file_info_type.ts";
import { toPathString } from "./_to_path_string.ts";
/**
 * Ensures that the file exists.
 * If the file that is requested to be created is in directories that do not
 * exist.
 * these directories are created. If the file already exists,
 * it is NOTMODIFIED.
 * Requires the `--allow-read` and `--allow-write` flag.
 *
 * @example
 * ```ts
 * import { ensureFile } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * ensureFile("./folder/targetFile.dat"); // returns promise
 * ```
 */ export async function ensureFile(filePath) {
  try {
    // if file exists
    const stat = await Deno.lstat(filePath);
    if (!stat.isFile) {
      throw new Error(`Ensure path exists, expected 'file', got '${getFileInfoType(stat)}'`);
    }
  } catch (err) {
    // if file not exists
    if (err instanceof Deno.errors.NotFound) {
      // ensure dir exists
      await ensureDir(dirname(toPathString(filePath)));
      // create file
      await Deno.writeFile(filePath, new Uint8Array());
      return;
    }
    throw err;
  }
}
/**
 * Ensures that the file exists.
 * If the file that is requested to be created is in directories that do not
 * exist,
 * these directories are created. If the file already exists,
 * it is NOT MODIFIED.
 * Requires the `--allow-read` and `--allow-write` flag.
 *
 * @example
 * ```ts
 * import { ensureFileSync } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * ensureFileSync("./folder/targetFile.dat"); // void
 * ```
 */ export function ensureFileSync(filePath) {
  try {
    // if file exists
    const stat = Deno.lstatSync(filePath);
    if (!stat.isFile) {
      throw new Error(`Ensure path exists, expected 'file', got '${getFileInfoType(stat)}'`);
    }
  } catch (err) {
    // if file not exists
    if (err instanceof Deno.errors.NotFound) {
      // ensure dir exists
      ensureDirSync(dirname(toPathString(filePath)));
      // create file
      Deno.writeFileSync(filePath, new Uint8Array());
      return;
    }
    throw err;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL2ZzL2Vuc3VyZV9maWxlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSBcIi4uL3BhdGgvZGlybmFtZS50c1wiO1xuaW1wb3J0IHsgZW5zdXJlRGlyLCBlbnN1cmVEaXJTeW5jIH0gZnJvbSBcIi4vZW5zdXJlX2Rpci50c1wiO1xuaW1wb3J0IHsgZ2V0RmlsZUluZm9UeXBlIH0gZnJvbSBcIi4vX2dldF9maWxlX2luZm9fdHlwZS50c1wiO1xuaW1wb3J0IHsgdG9QYXRoU3RyaW5nIH0gZnJvbSBcIi4vX3RvX3BhdGhfc3RyaW5nLnRzXCI7XG5cbi8qKlxuICogRW5zdXJlcyB0aGF0IHRoZSBmaWxlIGV4aXN0cy5cbiAqIElmIHRoZSBmaWxlIHRoYXQgaXMgcmVxdWVzdGVkIHRvIGJlIGNyZWF0ZWQgaXMgaW4gZGlyZWN0b3JpZXMgdGhhdCBkbyBub3RcbiAqIGV4aXN0LlxuICogdGhlc2UgZGlyZWN0b3JpZXMgYXJlIGNyZWF0ZWQuIElmIHRoZSBmaWxlIGFscmVhZHkgZXhpc3RzLFxuICogaXQgaXMgTk9UTU9ESUZJRUQuXG4gKiBSZXF1aXJlcyB0aGUgYC0tYWxsb3ctcmVhZGAgYW5kIGAtLWFsbG93LXdyaXRlYCBmbGFnLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZW5zdXJlRmlsZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZzL21vZC50c1wiO1xuICpcbiAqIGVuc3VyZUZpbGUoXCIuL2ZvbGRlci90YXJnZXRGaWxlLmRhdFwiKTsgLy8gcmV0dXJucyBwcm9taXNlXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZUZpbGUoZmlsZVBhdGg6IHN0cmluZyB8IFVSTCk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIC8vIGlmIGZpbGUgZXhpc3RzXG4gICAgY29uc3Qgc3RhdCA9IGF3YWl0IERlbm8ubHN0YXQoZmlsZVBhdGgpO1xuICAgIGlmICghc3RhdC5pc0ZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEVuc3VyZSBwYXRoIGV4aXN0cywgZXhwZWN0ZWQgJ2ZpbGUnLCBnb3QgJyR7Z2V0RmlsZUluZm9UeXBlKHN0YXQpfSdgLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIGlmIGZpbGUgbm90IGV4aXN0c1xuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgLy8gZW5zdXJlIGRpciBleGlzdHNcbiAgICAgIGF3YWl0IGVuc3VyZURpcihkaXJuYW1lKHRvUGF0aFN0cmluZyhmaWxlUGF0aCkpKTtcbiAgICAgIC8vIGNyZWF0ZSBmaWxlXG4gICAgICBhd2FpdCBEZW5vLndyaXRlRmlsZShmaWxlUGF0aCwgbmV3IFVpbnQ4QXJyYXkoKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbi8qKlxuICogRW5zdXJlcyB0aGF0IHRoZSBmaWxlIGV4aXN0cy5cbiAqIElmIHRoZSBmaWxlIHRoYXQgaXMgcmVxdWVzdGVkIHRvIGJlIGNyZWF0ZWQgaXMgaW4gZGlyZWN0b3JpZXMgdGhhdCBkbyBub3RcbiAqIGV4aXN0LFxuICogdGhlc2UgZGlyZWN0b3JpZXMgYXJlIGNyZWF0ZWQuIElmIHRoZSBmaWxlIGFscmVhZHkgZXhpc3RzLFxuICogaXQgaXMgTk9UIE1PRElGSUVELlxuICogUmVxdWlyZXMgdGhlIGAtLWFsbG93LXJlYWRgIGFuZCBgLS1hbGxvdy13cml0ZWAgZmxhZy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGVuc3VyZUZpbGVTeW5jIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZnMvbW9kLnRzXCI7XG4gKlxuICogZW5zdXJlRmlsZVN5bmMoXCIuL2ZvbGRlci90YXJnZXRGaWxlLmRhdFwiKTsgLy8gdm9pZFxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnN1cmVGaWxlU3luYyhmaWxlUGF0aDogc3RyaW5nIHwgVVJMKTogdm9pZCB7XG4gIHRyeSB7XG4gICAgLy8gaWYgZmlsZSBleGlzdHNcbiAgICBjb25zdCBzdGF0ID0gRGVuby5sc3RhdFN5bmMoZmlsZVBhdGgpO1xuICAgIGlmICghc3RhdC5pc0ZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEVuc3VyZSBwYXRoIGV4aXN0cywgZXhwZWN0ZWQgJ2ZpbGUnLCBnb3QgJyR7Z2V0RmlsZUluZm9UeXBlKHN0YXQpfSdgLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIGlmIGZpbGUgbm90IGV4aXN0c1xuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgLy8gZW5zdXJlIGRpciBleGlzdHNcbiAgICAgIGVuc3VyZURpclN5bmMoZGlybmFtZSh0b1BhdGhTdHJpbmcoZmlsZVBhdGgpKSk7XG4gICAgICAvLyBjcmVhdGUgZmlsZVxuICAgICAgRGVuby53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCBuZXcgVWludDhBcnJheSgpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLFNBQVMsT0FBTyxRQUFRLHFCQUFxQjtBQUM3QyxTQUFTLFNBQVMsRUFBRSxhQUFhLFFBQVEsa0JBQWtCO0FBQzNELFNBQVMsZUFBZSxRQUFRLDJCQUEyQjtBQUMzRCxTQUFTLFlBQVksUUFBUSx1QkFBdUI7QUFFcEQ7Ozs7Ozs7Ozs7Ozs7O0NBY0MsR0FDRCxPQUFPLGVBQWUsV0FBVyxRQUFzQjtFQUNyRCxJQUFJO0lBQ0YsaUJBQWlCO0lBQ2pCLE1BQU0sT0FBTyxNQUFNLEtBQUssS0FBSyxDQUFDO0lBQzlCLElBQUksQ0FBQyxLQUFLLE1BQU0sRUFBRTtNQUNoQixNQUFNLElBQUksTUFDUixDQUFDLDBDQUEwQyxFQUFFLGdCQUFnQixNQUFNLENBQUMsQ0FBQztJQUV6RTtFQUNGLEVBQUUsT0FBTyxLQUFLO0lBQ1oscUJBQXFCO0lBQ3JCLElBQUksZUFBZSxLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUU7TUFDdkMsb0JBQW9CO01BQ3BCLE1BQU0sVUFBVSxRQUFRLGFBQWE7TUFDckMsY0FBYztNQUNkLE1BQU0sS0FBSyxTQUFTLENBQUMsVUFBVSxJQUFJO01BQ25DO0lBQ0Y7SUFFQSxNQUFNO0VBQ1I7QUFDRjtBQUVBOzs7Ozs7Ozs7Ozs7OztDQWNDLEdBQ0QsT0FBTyxTQUFTLGVBQWUsUUFBc0I7RUFDbkQsSUFBSTtJQUNGLGlCQUFpQjtJQUNqQixNQUFNLE9BQU8sS0FBSyxTQUFTLENBQUM7SUFDNUIsSUFBSSxDQUFDLEtBQUssTUFBTSxFQUFFO01BQ2hCLE1BQU0sSUFBSSxNQUNSLENBQUMsMENBQTBDLEVBQUUsZ0JBQWdCLE1BQU0sQ0FBQyxDQUFDO0lBRXpFO0VBQ0YsRUFBRSxPQUFPLEtBQUs7SUFDWixxQkFBcUI7SUFDckIsSUFBSSxlQUFlLEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRTtNQUN2QyxvQkFBb0I7TUFDcEIsY0FBYyxRQUFRLGFBQWE7TUFDbkMsY0FBYztNQUNkLEtBQUssYUFBYSxDQUFDLFVBQVUsSUFBSTtNQUNqQztJQUNGO0lBQ0EsTUFBTTtFQUNSO0FBQ0YifQ==
// denoCacheMetadata=2815813115469376799,13096265034943447930