// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
export const DELIMITER = isWindows ? ";" : ":";
export const SEPARATOR = isWindows ? "\\" : "/";
export const SEPARATOR_PATTERN = isWindows ? /[\\/]+/ : /\/+/;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIyMS4wL2NvbnN0YW50cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5cbmV4cG9ydCBjb25zdCBERUxJTUlURVIgPSBpc1dpbmRvd3MgPyBcIjtcIiBhcyBjb25zdCA6IFwiOlwiIGFzIGNvbnN0O1xuZXhwb3J0IGNvbnN0IFNFUEFSQVRPUiA9IGlzV2luZG93cyA/IFwiXFxcXFwiIGFzIGNvbnN0IDogXCIvXCIgYXMgY29uc3Q7XG5leHBvcnQgY29uc3QgU0VQQVJBVE9SX1BBVFRFUk4gPSBpc1dpbmRvd3MgPyAvW1xcXFwvXSsvIDogL1xcLysvO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFDckMsU0FBUyxTQUFTLFFBQVEsV0FBVztBQUVyQyxPQUFPLE1BQU0sWUFBWSxZQUFZLE1BQWUsSUFBYTtBQUNqRSxPQUFPLE1BQU0sWUFBWSxZQUFZLE9BQWdCLElBQWE7QUFDbEUsT0FBTyxNQUFNLG9CQUFvQixZQUFZLFdBQVcsTUFBTSJ9
// denoCacheMetadata=10471231633127073546,11822087765367467484