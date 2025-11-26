// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
/**
 * @deprecated (will be removed in 0.215.0) Use {@linkcode SEPARATOR} from {@link https://deno.land/std/path/constants.ts} instead.
 */ export const SEP = isWindows ? "\\" : "/";
/**
 * @deprecated (will be removed in 0.215.0) Use {@linkcode SEPARATOR_PATTERN} from {@link https://deno.land/std/path/constants.ts} instead.
 */ export const SEP_PATTERN = isWindows ? /[\\/]+/ : /\/+/;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8wLjIxMy4xL3NlcGFyYXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi9fb3MudHNcIjtcblxuLyoqXG4gKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGluIDAuMjE1LjApIFVzZSB7QGxpbmtjb2RlIFNFUEFSQVRPUn0gZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL3BhdGgvY29uc3RhbnRzLnRzfSBpbnN0ZWFkLlxuICovXG5leHBvcnQgY29uc3QgU0VQOiBcIi9cIiB8IFwiXFxcXFwiID0gaXNXaW5kb3dzID8gXCJcXFxcXCIgOiBcIi9cIjtcbi8qKlxuICogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBpbiAwLjIxNS4wKSBVc2Uge0BsaW5rY29kZSBTRVBBUkFUT1JfUEFUVEVSTn0gZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL3BhdGgvY29uc3RhbnRzLnRzfSBpbnN0ZWFkLlxuICovXG5leHBvcnQgY29uc3QgU0VQX1BBVFRFUk46IFJlZ0V4cCA9IGlzV2luZG93cyA/IC9bXFxcXC9dKy8gOiAvXFwvKy87XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBRXJDOztDQUVDLEdBQ0QsT0FBTyxNQUFNLE1BQWtCLFlBQVksT0FBTyxJQUFJO0FBQ3REOztDQUVDLEdBQ0QsT0FBTyxNQUFNLGNBQXNCLFlBQVksV0FBVyxNQUFNIn0=
// denoCacheMetadata=16660604465623408964,17973628743422704427