/**
 * Plug is a drop in extension for using remote dynamic libraries in deno. It
 * automatically handles caching and loading with minimal overhead. It can
 * automatically create the URL for your cross-operating-system, cross-architecture
 * libraries if you so wish using a simple configuration which deviates from
 * the standard URL/string path input.
 *
 * @example
 * ```ts
 * import { dlopen } from "@denosaurs/plug";
 *
 * // Drop-in replacement for `Deno.dlopen` which fetches the following depending
 * // on operating system:
 * // * darwin: "https://example.com/some/path/libexample.dylib"
 * // * windows: "https://example.com/some/path/example.dll"
 * // * linux: "https://example.com/some/path/libexample.so"
 * const library = await dlopen("https://example.com/some/path/", {
 *   noop: { parameters: [], result: "void" },
 * });
 *
 * library.symbols.noop();
 * ```
 *
 * @example
 * ```ts
 * import { dlopen, FetchOptions } from "@denosaurs/plug";
 *
 * // If you want plug to guess your binary names
 * const options: FetchOptions = {
 *   name: "example",
 *   url: "https://example.com/some/path/",
 *   // Becomes:
 *   // darwin: "https://example.com/some/path/libexample.dylib"
 *   // windows: "https://example.com/some/path/example.dll"
 *   // linux: "https://example.com/some/path/libexample.so"
 * };
 *
 * const library = await dlopen(options, {
 *   noop: { parameters: [], result: "void" },
 * });
 *
 * library.symbols.noop();
 * ```
 *
 * @example
 * ```ts
 * import { dlopen, FetchOptions } from "@denosaurs/plug";
 *
 * // Also you can specify the path for certain architecture
 * const options: FetchOptions = {
 *   name: "example",
 *   url: {
 *     darwin: {
 *       aarch64: `https://example.com/some/path/libexample.aarch64.dylib`,
 *       x86_64: `https://example.com/some/path/libexample.x86_64.dylib`,
 *     },
 *     windows: `https://example.com/some/path/example.dll`,
 *     linux: `https://example.com/some/path/libexample.so`,
 *   },
 * };
 *
 * await dlopen(options, {});
 * ```
 *
 * @example
 * ```ts
 * import { dlopen, FetchOptions } from "@denosaurs/plug";
 *
 * // Or even configure plug to automatically guess the binary names for you,
 * // even when there are special rules for naming on specific architectures
 * const options: FetchOptions = {
 *   name: "test",
 *   url: "https://example.com/some/path/",
 *   suffixes: {
 *     darwin: {
 *       aarch64: ".aarch64",
 *       x86_64: ".x86_64",
 *     },
 *   },
 *   // Becomes:
 *   // darwin-aarch64: "https://example.com/some/path/libexample.aarch64.dylib"
 *   // darwin-x86_64: "https://example.com/some/path/libexample.x86_64.dylib"
 * };
 *
 * await dlopen(options, {});
 * ```
 *
 * @module
 */ import { download } from "./download.ts";
export { download } from "./download.ts";
/**
 * Opens a dynamic library and registers symbols, compatible with
 * {@link Deno.dlopen} yet with extended functionality allowing you to use
 * remote (or local) binaries, automatically building the binary name and
 * controlling the caching policy.
 *
 * @example
 * ```ts
 * import { dlopen, FetchOptions } from "@denosaurs/plug";
 *
 * // Configure plug to automatically guess the binary names for you, even when
 * // there for example are special rules for naming on specific architectures
 * const options: FetchOptions = {
 *   name: "test",
 *   url: "https://example.com/some/path/",
 *   suffixes: {
 *     darwin: {
 *       aarch64: ".aarch64",
 *       x86_64: ".x86_64",
 *     },
 *   },
 *   // Becomes:
 *   // darwin-aarch64: "https://example.com/some/path/libexample.aarch64.dylib"
 *   // darwin-x86_64: "https://example.com/some/path/libexample.x86_64.dylib"
 * };
 *
 * await dlopen(options, {});
 * ```
 *
 * @param options See {@link FetchOptions}
 * @param symbols A record extending {@link Deno.ForeignLibraryInterface}
 * @returns An opened {@link Deno.DynamicLibrary}
 */ export async function dlopen(options, symbols) {
  if (Deno.dlopen === undefined) {
    throw new Error("`--unstable-ffi` is required");
  }
  // deno-lint-ignore no-explicit-any
  return Deno.dlopen(await download(options), symbols);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BkZW5vc2F1cnMvcGx1Zy8xLjAuNi9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQbHVnIGlzIGEgZHJvcCBpbiBleHRlbnNpb24gZm9yIHVzaW5nIHJlbW90ZSBkeW5hbWljIGxpYnJhcmllcyBpbiBkZW5vLiBJdFxuICogYXV0b21hdGljYWxseSBoYW5kbGVzIGNhY2hpbmcgYW5kIGxvYWRpbmcgd2l0aCBtaW5pbWFsIG92ZXJoZWFkLiBJdCBjYW5cbiAqIGF1dG9tYXRpY2FsbHkgY3JlYXRlIHRoZSBVUkwgZm9yIHlvdXIgY3Jvc3Mtb3BlcmF0aW5nLXN5c3RlbSwgY3Jvc3MtYXJjaGl0ZWN0dXJlXG4gKiBsaWJyYXJpZXMgaWYgeW91IHNvIHdpc2ggdXNpbmcgYSBzaW1wbGUgY29uZmlndXJhdGlvbiB3aGljaCBkZXZpYXRlcyBmcm9tXG4gKiB0aGUgc3RhbmRhcmQgVVJML3N0cmluZyBwYXRoIGlucHV0LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZGxvcGVuIH0gZnJvbSBcIkBkZW5vc2F1cnMvcGx1Z1wiO1xuICpcbiAqIC8vIERyb3AtaW4gcmVwbGFjZW1lbnQgZm9yIGBEZW5vLmRsb3BlbmAgd2hpY2ggZmV0Y2hlcyB0aGUgZm9sbG93aW5nIGRlcGVuZGluZ1xuICogLy8gb24gb3BlcmF0aW5nIHN5c3RlbTpcbiAqIC8vICogZGFyd2luOiBcImh0dHBzOi8vZXhhbXBsZS5jb20vc29tZS9wYXRoL2xpYmV4YW1wbGUuZHlsaWJcIlxuICogLy8gKiB3aW5kb3dzOiBcImh0dHBzOi8vZXhhbXBsZS5jb20vc29tZS9wYXRoL2V4YW1wbGUuZGxsXCJcbiAqIC8vICogbGludXg6IFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9zb21lL3BhdGgvbGliZXhhbXBsZS5zb1wiXG4gKiBjb25zdCBsaWJyYXJ5ID0gYXdhaXQgZGxvcGVuKFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9zb21lL3BhdGgvXCIsIHtcbiAqICAgbm9vcDogeyBwYXJhbWV0ZXJzOiBbXSwgcmVzdWx0OiBcInZvaWRcIiB9LFxuICogfSk7XG4gKlxuICogbGlicmFyeS5zeW1ib2xzLm5vb3AoKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZGxvcGVuLCBGZXRjaE9wdGlvbnMgfSBmcm9tIFwiQGRlbm9zYXVycy9wbHVnXCI7XG4gKlxuICogLy8gSWYgeW91IHdhbnQgcGx1ZyB0byBndWVzcyB5b3VyIGJpbmFyeSBuYW1lc1xuICogY29uc3Qgb3B0aW9uczogRmV0Y2hPcHRpb25zID0ge1xuICogICBuYW1lOiBcImV4YW1wbGVcIixcbiAqICAgdXJsOiBcImh0dHBzOi8vZXhhbXBsZS5jb20vc29tZS9wYXRoL1wiLFxuICogICAvLyBCZWNvbWVzOlxuICogICAvLyBkYXJ3aW46IFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9zb21lL3BhdGgvbGliZXhhbXBsZS5keWxpYlwiXG4gKiAgIC8vIHdpbmRvd3M6IFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9zb21lL3BhdGgvZXhhbXBsZS5kbGxcIlxuICogICAvLyBsaW51eDogXCJodHRwczovL2V4YW1wbGUuY29tL3NvbWUvcGF0aC9saWJleGFtcGxlLnNvXCJcbiAqIH07XG4gKlxuICogY29uc3QgbGlicmFyeSA9IGF3YWl0IGRsb3BlbihvcHRpb25zLCB7XG4gKiAgIG5vb3A6IHsgcGFyYW1ldGVyczogW10sIHJlc3VsdDogXCJ2b2lkXCIgfSxcbiAqIH0pO1xuICpcbiAqIGxpYnJhcnkuc3ltYm9scy5ub29wKCk7XG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGRsb3BlbiwgRmV0Y2hPcHRpb25zIH0gZnJvbSBcIkBkZW5vc2F1cnMvcGx1Z1wiO1xuICpcbiAqIC8vIEFsc28geW91IGNhbiBzcGVjaWZ5IHRoZSBwYXRoIGZvciBjZXJ0YWluIGFyY2hpdGVjdHVyZVxuICogY29uc3Qgb3B0aW9uczogRmV0Y2hPcHRpb25zID0ge1xuICogICBuYW1lOiBcImV4YW1wbGVcIixcbiAqICAgdXJsOiB7XG4gKiAgICAgZGFyd2luOiB7XG4gKiAgICAgICBhYXJjaDY0OiBgaHR0cHM6Ly9leGFtcGxlLmNvbS9zb21lL3BhdGgvbGliZXhhbXBsZS5hYXJjaDY0LmR5bGliYCxcbiAqICAgICAgIHg4Nl82NDogYGh0dHBzOi8vZXhhbXBsZS5jb20vc29tZS9wYXRoL2xpYmV4YW1wbGUueDg2XzY0LmR5bGliYCxcbiAqICAgICB9LFxuICogICAgIHdpbmRvd3M6IGBodHRwczovL2V4YW1wbGUuY29tL3NvbWUvcGF0aC9leGFtcGxlLmRsbGAsXG4gKiAgICAgbGludXg6IGBodHRwczovL2V4YW1wbGUuY29tL3NvbWUvcGF0aC9saWJleGFtcGxlLnNvYCxcbiAqICAgfSxcbiAqIH07XG4gKlxuICogYXdhaXQgZGxvcGVuKG9wdGlvbnMsIHt9KTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZGxvcGVuLCBGZXRjaE9wdGlvbnMgfSBmcm9tIFwiQGRlbm9zYXVycy9wbHVnXCI7XG4gKlxuICogLy8gT3IgZXZlbiBjb25maWd1cmUgcGx1ZyB0byBhdXRvbWF0aWNhbGx5IGd1ZXNzIHRoZSBiaW5hcnkgbmFtZXMgZm9yIHlvdSxcbiAqIC8vIGV2ZW4gd2hlbiB0aGVyZSBhcmUgc3BlY2lhbCBydWxlcyBmb3IgbmFtaW5nIG9uIHNwZWNpZmljIGFyY2hpdGVjdHVyZXNcbiAqIGNvbnN0IG9wdGlvbnM6IEZldGNoT3B0aW9ucyA9IHtcbiAqICAgbmFtZTogXCJ0ZXN0XCIsXG4gKiAgIHVybDogXCJodHRwczovL2V4YW1wbGUuY29tL3NvbWUvcGF0aC9cIixcbiAqICAgc3VmZml4ZXM6IHtcbiAqICAgICBkYXJ3aW46IHtcbiAqICAgICAgIGFhcmNoNjQ6IFwiLmFhcmNoNjRcIixcbiAqICAgICAgIHg4Nl82NDogXCIueDg2XzY0XCIsXG4gKiAgICAgfSxcbiAqICAgfSxcbiAqICAgLy8gQmVjb21lczpcbiAqICAgLy8gZGFyd2luLWFhcmNoNjQ6IFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9zb21lL3BhdGgvbGliZXhhbXBsZS5hYXJjaDY0LmR5bGliXCJcbiAqICAgLy8gZGFyd2luLXg4Nl82NDogXCJodHRwczovL2V4YW1wbGUuY29tL3NvbWUvcGF0aC9saWJleGFtcGxlLng4Nl82NC5keWxpYlwiXG4gKiB9O1xuICpcbiAqIGF3YWl0IGRsb3BlbihvcHRpb25zLCB7fSk7XG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuaW1wb3J0IHsgZG93bmxvYWQgfSBmcm9tIFwiLi9kb3dubG9hZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBGZXRjaE9wdGlvbnMgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG5leHBvcnQgdHlwZSB7XG4gIEFyY2hSZWNvcmQsXG4gIENhY2hlTG9jYXRpb24sXG4gIENhY2hlT3B0aW9ucyxcbiAgQ2FjaGVTZXR0aW5nLFxuICBDcm9zc09wdGlvbnMsXG4gIEZldGNoT3B0aW9ucyxcbiAgTmFtZWRPcHRpb25zLFxuICBOZXN0ZWRDcm9zc1JlY29yZCxcbiAgT3NSZWNvcmQsXG4gIFVSTE9wdGlvbnMsXG59IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5leHBvcnQgeyBkb3dubG9hZCB9IGZyb20gXCIuL2Rvd25sb2FkLnRzXCI7XG5cbi8qIE1hZ2ljIHR5cGVzIGZyb20gZGVubyB3aGljaCBoZWxwIGltcGxlbWVudCBiZXR0ZXIgRkZJIHR5cGUgY2hlY2tpbmcgKi9cbnR5cGUgQ2FzdDxBLCBCPiA9IEEgZXh0ZW5kcyBCID8gQSA6IEI7XG50eXBlIENvbnN0PFQ+ID0gQ2FzdDxcbiAgVCxcbiAgfCAoVCBleHRlbmRzIHN0cmluZyB8IG51bWJlciB8IGJpZ2ludCB8IGJvb2xlYW4gPyBUIDogbmV2ZXIpXG4gIHwgeyBbSyBpbiBrZXlvZiBUXTogQ29uc3Q8VFtLXT4gfVxuICB8IFtdXG4+O1xuXG4vKipcbiAqIE9wZW5zIGEgZHluYW1pYyBsaWJyYXJ5IGFuZCByZWdpc3RlcnMgc3ltYm9scywgY29tcGF0aWJsZSB3aXRoXG4gKiB7QGxpbmsgRGVuby5kbG9wZW59IHlldCB3aXRoIGV4dGVuZGVkIGZ1bmN0aW9uYWxpdHkgYWxsb3dpbmcgeW91IHRvIHVzZVxuICogcmVtb3RlIChvciBsb2NhbCkgYmluYXJpZXMsIGF1dG9tYXRpY2FsbHkgYnVpbGRpbmcgdGhlIGJpbmFyeSBuYW1lIGFuZFxuICogY29udHJvbGxpbmcgdGhlIGNhY2hpbmcgcG9saWN5LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZGxvcGVuLCBGZXRjaE9wdGlvbnMgfSBmcm9tIFwiQGRlbm9zYXVycy9wbHVnXCI7XG4gKlxuICogLy8gQ29uZmlndXJlIHBsdWcgdG8gYXV0b21hdGljYWxseSBndWVzcyB0aGUgYmluYXJ5IG5hbWVzIGZvciB5b3UsIGV2ZW4gd2hlblxuICogLy8gdGhlcmUgZm9yIGV4YW1wbGUgYXJlIHNwZWNpYWwgcnVsZXMgZm9yIG5hbWluZyBvbiBzcGVjaWZpYyBhcmNoaXRlY3R1cmVzXG4gKiBjb25zdCBvcHRpb25zOiBGZXRjaE9wdGlvbnMgPSB7XG4gKiAgIG5hbWU6IFwidGVzdFwiLFxuICogICB1cmw6IFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9zb21lL3BhdGgvXCIsXG4gKiAgIHN1ZmZpeGVzOiB7XG4gKiAgICAgZGFyd2luOiB7XG4gKiAgICAgICBhYXJjaDY0OiBcIi5hYXJjaDY0XCIsXG4gKiAgICAgICB4ODZfNjQ6IFwiLng4Nl82NFwiLFxuICogICAgIH0sXG4gKiAgIH0sXG4gKiAgIC8vIEJlY29tZXM6XG4gKiAgIC8vIGRhcndpbi1hYXJjaDY0OiBcImh0dHBzOi8vZXhhbXBsZS5jb20vc29tZS9wYXRoL2xpYmV4YW1wbGUuYWFyY2g2NC5keWxpYlwiXG4gKiAgIC8vIGRhcndpbi14ODZfNjQ6IFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9zb21lL3BhdGgvbGliZXhhbXBsZS54ODZfNjQuZHlsaWJcIlxuICogfTtcbiAqXG4gKiBhd2FpdCBkbG9wZW4ob3B0aW9ucywge30pO1xuICogYGBgXG4gKlxuICogQHBhcmFtIG9wdGlvbnMgU2VlIHtAbGluayBGZXRjaE9wdGlvbnN9XG4gKiBAcGFyYW0gc3ltYm9scyBBIHJlY29yZCBleHRlbmRpbmcge0BsaW5rIERlbm8uRm9yZWlnbkxpYnJhcnlJbnRlcmZhY2V9XG4gKiBAcmV0dXJucyBBbiBvcGVuZWQge0BsaW5rIERlbm8uRHluYW1pY0xpYnJhcnl9XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkbG9wZW48UyBleHRlbmRzIERlbm8uRm9yZWlnbkxpYnJhcnlJbnRlcmZhY2U+KFxuICBvcHRpb25zOiBGZXRjaE9wdGlvbnMsXG4gIHN5bWJvbHM6IENvbnN0PFM+LFxuKTogUHJvbWlzZTxEZW5vLkR5bmFtaWNMaWJyYXJ5PFM+PiB7XG4gIGlmIChEZW5vLmRsb3BlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYC0tdW5zdGFibGUtZmZpYCBpcyByZXF1aXJlZFwiKTtcbiAgfVxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICByZXR1cm4gRGVuby5kbG9wZW48Uz4oYXdhaXQgZG93bmxvYWQob3B0aW9ucyksIHN5bWJvbHMgYXMgYW55KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXdGQyxHQUVELFNBQVMsUUFBUSxRQUFRLGdCQUFnQjtBQWV6QyxTQUFTLFFBQVEsUUFBUSxnQkFBZ0I7QUFXekM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBZ0NDLEdBQ0QsT0FBTyxlQUFlLE9BQ3BCLE9BQXFCLEVBQ3JCLE9BQWlCO0VBRWpCLElBQUksS0FBSyxNQUFNLEtBQUssV0FBVztJQUM3QixNQUFNLElBQUksTUFBTTtFQUNsQjtFQUNBLG1DQUFtQztFQUNuQyxPQUFPLEtBQUssTUFBTSxDQUFJLE1BQU0sU0FBUyxVQUFVO0FBQ2pEIn0=
// denoCacheMetadata=5061724085980009963,7594092507675956671