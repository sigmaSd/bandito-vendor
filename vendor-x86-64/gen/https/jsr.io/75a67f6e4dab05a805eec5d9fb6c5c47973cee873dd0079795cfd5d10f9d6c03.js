/**
 * Webview is a tiny cross-platform library to make web-based GUIs for desktop
 * applications.
 *
 * @example
 * ```
 * import { Webview } from "@webview/webview";
 *
 * const html = `
 *   <html>
 *   <body>
 *     <h1>Hello from deno v${Deno.version.deno}</h1>
 *   </body>
 *   </html>
 * `;
 *
 * const webview = new Webview();
 *
 * webview.navigate(`data:text/html,${encodeURIComponent(html)}`);
 * webview.run();
 * ```
 *
 * @module
 */ export * from "./src/webview.ts";
export { preload, unload } from "./src/ffi.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0B3ZWJ2aWV3L3dlYnZpZXcvMC44LjAvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogV2VidmlldyBpcyBhIHRpbnkgY3Jvc3MtcGxhdGZvcm0gbGlicmFyeSB0byBtYWtlIHdlYi1iYXNlZCBHVUlzIGZvciBkZXNrdG9wXG4gKiBhcHBsaWNhdGlvbnMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYFxuICogaW1wb3J0IHsgV2VidmlldyB9IGZyb20gXCJAd2Vidmlldy93ZWJ2aWV3XCI7XG4gKlxuICogY29uc3QgaHRtbCA9IGBcbiAqICAgPGh0bWw+XG4gKiAgIDxib2R5PlxuICogICAgIDxoMT5IZWxsbyBmcm9tIGRlbm8gdiR7RGVuby52ZXJzaW9uLmRlbm99PC9oMT5cbiAqICAgPC9ib2R5PlxuICogICA8L2h0bWw+XG4gKiBgO1xuICpcbiAqIGNvbnN0IHdlYnZpZXcgPSBuZXcgV2VidmlldygpO1xuICpcbiAqIHdlYnZpZXcubmF2aWdhdGUoYGRhdGE6dGV4dC9odG1sLCR7ZW5jb2RlVVJJQ29tcG9uZW50KGh0bWwpfWApO1xuICogd2Vidmlldy5ydW4oKTtcbiAqIGBgYFxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5leHBvcnQgKiBmcm9tIFwiLi9zcmMvd2Vidmlldy50c1wiO1xuZXhwb3J0IHsgcHJlbG9hZCwgdW5sb2FkIH0gZnJvbSBcIi4vc3JjL2ZmaS50c1wiO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXVCQyxHQUVELGNBQWMsbUJBQW1CO0FBQ2pDLFNBQVMsT0FBTyxFQUFFLE1BQU0sUUFBUSxlQUFlIn0=
// denoCacheMetadata=4958723885049273655,10140276813516516784