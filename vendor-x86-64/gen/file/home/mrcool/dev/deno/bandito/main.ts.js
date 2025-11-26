/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";
const port = Number.parseInt(Deno.env.get("PORT") || "3425");
await start(manifest, {
  port,
  plugins: [
    twindPlugin(twindConfig)
  ]
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9tcmNvb2wvZGV2L2Rlbm8vYmFuZGl0by9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIG5vLWRlZmF1bHQtbGliPVwidHJ1ZVwiIC8+XG4vLy8gPHJlZmVyZW5jZSBsaWI9XCJkb21cIiAvPlxuLy8vIDxyZWZlcmVuY2UgbGliPVwiZG9tLml0ZXJhYmxlXCIgLz5cbi8vLyA8cmVmZXJlbmNlIGxpYj1cImRvbS5hc3luY2l0ZXJhYmxlXCIgLz5cbi8vLyA8cmVmZXJlbmNlIGxpYj1cImRlbm8ubnNcIiAvPlxuXG5pbXBvcnQgeyBzdGFydCB9IGZyb20gXCIkZnJlc2gvc2VydmVyLnRzXCI7XG5pbXBvcnQgbWFuaWZlc3QgZnJvbSBcIi4vZnJlc2guZ2VuLnRzXCI7XG5cbmltcG9ydCB0d2luZFBsdWdpbiBmcm9tIFwiJGZyZXNoL3BsdWdpbnMvdHdpbmQudHNcIjtcbmltcG9ydCB0d2luZENvbmZpZyBmcm9tIFwiLi90d2luZC5jb25maWcudHNcIjtcblxuY29uc3QgcG9ydCA9IE51bWJlci5wYXJzZUludChEZW5vLmVudi5nZXQoXCJQT1JUXCIpIHx8IFwiMzQyNVwiKTtcbmF3YWl0IHN0YXJ0KG1hbmlmZXN0LCB7XG4gIHBvcnQsXG4gIHBsdWdpbnM6IFt0d2luZFBsdWdpbih0d2luZENvbmZpZyldLFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsdUNBQXVDO0FBQ3ZDLDJCQUEyQjtBQUMzQixvQ0FBb0M7QUFDcEMseUNBQXlDO0FBQ3pDLCtCQUErQjtBQUUvQixTQUFTLEtBQUssUUFBUSxtQkFBbUI7QUFDekMsT0FBTyxjQUFjLGlCQUFpQjtBQUV0QyxPQUFPLGlCQUFpQiwwQkFBMEI7QUFDbEQsT0FBTyxpQkFBaUIsb0JBQW9CO0FBRTVDLE1BQU0sT0FBTyxPQUFPLFFBQVEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVztBQUNyRCxNQUFNLE1BQU0sVUFBVTtFQUNwQjtFQUNBLFNBQVM7SUFBQyxZQUFZO0dBQWE7QUFDckMifQ==
// denoCacheMetadata=14850062023926546171,6658571392978854524