// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Contains the {@linkcode STATUS_CODE} object which contains standard HTTP
 * status codes and provides several type guards for handling status codes
 * with type safety.
 *
 * @example
 * ```ts
 * import {
 *   STATUS_CODE,
 *   STATUS_TEXT,
 * } from "https://deno.land/std@$STD_VERSION/http/status.ts";
 *
 * console.log(STATUS_CODE.NotFound); // Returns 404
 * console.log(STATUS_TEXT[STATUS_CODE.NotFound]); // Returns "Not Found"
 * ```
 *
 * @example
 * ```ts
 * import { isErrorStatus } from "https://deno.land/std@$STD_VERSION/http/status.ts";
 *
 * const res = await fetch("https://example.com/");
 *
 * if (isErrorStatus(res.status)) {
 *   // error handling here...
 * }
 * ```
 *
 * @module
 */ export const STATUS_CODE = {
  /** RFC 7231, 6.2.1 */ Continue: 100,
  /** RFC 7231, 6.2.2 */ SwitchingProtocols: 101,
  /** RFC 2518, 10.1 */ Processing: 102,
  /** RFC 8297 **/ EarlyHints: 103,
  /** RFC 7231, 6.3.1 */ OK: 200,
  /** RFC 7231, 6.3.2 */ Created: 201,
  /** RFC 7231, 6.3.3 */ Accepted: 202,
  /** RFC 7231, 6.3.4 */ NonAuthoritativeInfo: 203,
  /** RFC 7231, 6.3.5 */ NoContent: 204,
  /** RFC 7231, 6.3.6 */ ResetContent: 205,
  /** RFC 7233, 4.1 */ PartialContent: 206,
  /** RFC 4918, 11.1 */ MultiStatus: 207,
  /** RFC 5842, 7.1 */ AlreadyReported: 208,
  /** RFC 3229, 10.4.1 */ IMUsed: 226,
  /** RFC 7231, 6.4.1 */ MultipleChoices: 300,
  /** RFC 7231, 6.4.2 */ MovedPermanently: 301,
  /** RFC 7231, 6.4.3 */ Found: 302,
  /** RFC 7231, 6.4.4 */ SeeOther: 303,
  /** RFC 7232, 4.1 */ NotModified: 304,
  /** RFC 7231, 6.4.5 */ UseProxy: 305,
  /** RFC 7231, 6.4.7 */ TemporaryRedirect: 307,
  /** RFC 7538, 3 */ PermanentRedirect: 308,
  /** RFC 7231, 6.5.1 */ BadRequest: 400,
  /** RFC 7235, 3.1 */ Unauthorized: 401,
  /** RFC 7231, 6.5.2 */ PaymentRequired: 402,
  /** RFC 7231, 6.5.3 */ Forbidden: 403,
  /** RFC 7231, 6.5.4 */ NotFound: 404,
  /** RFC 7231, 6.5.5 */ MethodNotAllowed: 405,
  /** RFC 7231, 6.5.6 */ NotAcceptable: 406,
  /** RFC 7235, 3.2 */ ProxyAuthRequired: 407,
  /** RFC 7231, 6.5.7 */ RequestTimeout: 408,
  /** RFC 7231, 6.5.8 */ Conflict: 409,
  /** RFC 7231, 6.5.9 */ Gone: 410,
  /** RFC 7231, 6.5.10 */ LengthRequired: 411,
  /** RFC 7232, 4.2 */ PreconditionFailed: 412,
  /** RFC 7231, 6.5.11 */ ContentTooLarge: 413,
  /** RFC 7231, 6.5.12 */ URITooLong: 414,
  /** RFC 7231, 6.5.13 */ UnsupportedMediaType: 415,
  /** RFC 7233, 4.4 */ RangeNotSatisfiable: 416,
  /** RFC 7231, 6.5.14 */ ExpectationFailed: 417,
  /** RFC 7168, 2.3.3 */ Teapot: 418,
  /** RFC 7540, 9.1.2 */ MisdirectedRequest: 421,
  /** RFC 4918, 11.2 */ UnprocessableEntity: 422,
  /** RFC 4918, 11.3 */ Locked: 423,
  /** RFC 4918, 11.4 */ FailedDependency: 424,
  /** RFC 8470, 5.2 */ TooEarly: 425,
  /** RFC 7231, 6.5.15 */ UpgradeRequired: 426,
  /** RFC 6585, 3 */ PreconditionRequired: 428,
  /** RFC 6585, 4 */ TooManyRequests: 429,
  /** RFC 6585, 5 */ RequestHeaderFieldsTooLarge: 431,
  /** RFC 7725, 3 */ UnavailableForLegalReasons: 451,
  /** RFC 7231, 6.6.1 */ InternalServerError: 500,
  /** RFC 7231, 6.6.2 */ NotImplemented: 501,
  /** RFC 7231, 6.6.3 */ BadGateway: 502,
  /** RFC 7231, 6.6.4 */ ServiceUnavailable: 503,
  /** RFC 7231, 6.6.5 */ GatewayTimeout: 504,
  /** RFC 7231, 6.6.6 */ HTTPVersionNotSupported: 505,
  /** RFC 2295, 8.1 */ VariantAlsoNegotiates: 506,
  /** RFC 4918, 11.5 */ InsufficientStorage: 507,
  /** RFC 5842, 7.2 */ LoopDetected: 508,
  /** RFC 2774, 7 */ NotExtended: 510,
  /** RFC 6585, 6 */ NetworkAuthenticationRequired: 511
};
/** A record of all the status codes text. */ export const STATUS_TEXT = {
  [STATUS_CODE.Accepted]: "Accepted",
  [STATUS_CODE.AlreadyReported]: "Already Reported",
  [STATUS_CODE.BadGateway]: "Bad Gateway",
  [STATUS_CODE.BadRequest]: "Bad Request",
  [STATUS_CODE.Conflict]: "Conflict",
  [STATUS_CODE.Continue]: "Continue",
  [STATUS_CODE.Created]: "Created",
  [STATUS_CODE.EarlyHints]: "Early Hints",
  [STATUS_CODE.ExpectationFailed]: "Expectation Failed",
  [STATUS_CODE.FailedDependency]: "Failed Dependency",
  [STATUS_CODE.Forbidden]: "Forbidden",
  [STATUS_CODE.Found]: "Found",
  [STATUS_CODE.GatewayTimeout]: "Gateway Timeout",
  [STATUS_CODE.Gone]: "Gone",
  [STATUS_CODE.HTTPVersionNotSupported]: "HTTP Version Not Supported",
  [STATUS_CODE.IMUsed]: "IM Used",
  [STATUS_CODE.InsufficientStorage]: "Insufficient Storage",
  [STATUS_CODE.InternalServerError]: "Internal Server Error",
  [STATUS_CODE.LengthRequired]: "Length Required",
  [STATUS_CODE.Locked]: "Locked",
  [STATUS_CODE.LoopDetected]: "Loop Detected",
  [STATUS_CODE.MethodNotAllowed]: "Method Not Allowed",
  [STATUS_CODE.MisdirectedRequest]: "Misdirected Request",
  [STATUS_CODE.MovedPermanently]: "Moved Permanently",
  [STATUS_CODE.MultiStatus]: "Multi Status",
  [STATUS_CODE.MultipleChoices]: "Multiple Choices",
  [STATUS_CODE.NetworkAuthenticationRequired]: "Network Authentication Required",
  [STATUS_CODE.NoContent]: "No Content",
  [STATUS_CODE.NonAuthoritativeInfo]: "Non Authoritative Info",
  [STATUS_CODE.NotAcceptable]: "Not Acceptable",
  [STATUS_CODE.NotExtended]: "Not Extended",
  [STATUS_CODE.NotFound]: "Not Found",
  [STATUS_CODE.NotImplemented]: "Not Implemented",
  [STATUS_CODE.NotModified]: "Not Modified",
  [STATUS_CODE.OK]: "OK",
  [STATUS_CODE.PartialContent]: "Partial Content",
  [STATUS_CODE.PaymentRequired]: "Payment Required",
  [STATUS_CODE.PermanentRedirect]: "Permanent Redirect",
  [STATUS_CODE.PreconditionFailed]: "Precondition Failed",
  [STATUS_CODE.PreconditionRequired]: "Precondition Required",
  [STATUS_CODE.Processing]: "Processing",
  [STATUS_CODE.ProxyAuthRequired]: "Proxy Auth Required",
  [STATUS_CODE.ContentTooLarge]: "Content Too Large",
  [STATUS_CODE.RequestHeaderFieldsTooLarge]: "Request Header Fields Too Large",
  [STATUS_CODE.RequestTimeout]: "Request Timeout",
  [STATUS_CODE.URITooLong]: "URI Too Long",
  [STATUS_CODE.RangeNotSatisfiable]: "Range Not Satisfiable",
  [STATUS_CODE.ResetContent]: "Reset Content",
  [STATUS_CODE.SeeOther]: "See Other",
  [STATUS_CODE.ServiceUnavailable]: "Service Unavailable",
  [STATUS_CODE.SwitchingProtocols]: "Switching Protocols",
  [STATUS_CODE.Teapot]: "I'm a teapot",
  [STATUS_CODE.TemporaryRedirect]: "Temporary Redirect",
  [STATUS_CODE.TooEarly]: "Too Early",
  [STATUS_CODE.TooManyRequests]: "Too Many Requests",
  [STATUS_CODE.Unauthorized]: "Unauthorized",
  [STATUS_CODE.UnavailableForLegalReasons]: "Unavailable For Legal Reasons",
  [STATUS_CODE.UnprocessableEntity]: "Unprocessable Entity",
  [STATUS_CODE.UnsupportedMediaType]: "Unsupported Media Type",
  [STATUS_CODE.UpgradeRequired]: "Upgrade Required",
  [STATUS_CODE.UseProxy]: "Use Proxy",
  [STATUS_CODE.VariantAlsoNegotiates]: "Variant Also Negotiates"
};
/** Returns whether the provided number is a valid HTTP status code. */ export function isStatus(status) {
  return Object.values(STATUS_CODE).includes(status);
}
/** A type guard that determines if the status code is informational. */ export function isInformationalStatus(status) {
  return isStatus(status) && status >= 100 && status < 200;
}
/** A type guard that determines if the status code is successful. */ export function isSuccessfulStatus(status) {
  return isStatus(status) && status >= 200 && status < 300;
}
/** A type guard that determines if the status code is a redirection. */ export function isRedirectStatus(status) {
  return isStatus(status) && status >= 300 && status < 400;
}
/** A type guard that determines if the status code is a client error. */ export function isClientErrorStatus(status) {
  return isStatus(status) && status >= 400 && status < 500;
}
/** A type guard that determines if the status code is a server error. */ export function isServerErrorStatus(status) {
  return isStatus(status) && status >= 500 && status < 600;
}
/** A type guard that determines if the status code is an error. */ export function isErrorStatus(status) {
  return isStatus(status) && status >= 400 && status < 600;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL2h0dHAvc3RhdHVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogQ29udGFpbnMgdGhlIHtAbGlua2NvZGUgU1RBVFVTX0NPREV9IG9iamVjdCB3aGljaCBjb250YWlucyBzdGFuZGFyZCBIVFRQXG4gKiBzdGF0dXMgY29kZXMgYW5kIHByb3ZpZGVzIHNldmVyYWwgdHlwZSBndWFyZHMgZm9yIGhhbmRsaW5nIHN0YXR1cyBjb2Rlc1xuICogd2l0aCB0eXBlIHNhZmV0eS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIFNUQVRVU19DT0RFLFxuICogICBTVEFUVVNfVEVYVCxcbiAqIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9zdGF0dXMudHNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhTVEFUVVNfQ09ERS5Ob3RGb3VuZCk7IC8vIFJldHVybnMgNDA0XG4gKiBjb25zb2xlLmxvZyhTVEFUVVNfVEVYVFtTVEFUVVNfQ09ERS5Ob3RGb3VuZF0pOyAvLyBSZXR1cm5zIFwiTm90IEZvdW5kXCJcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaXNFcnJvclN0YXR1cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0dHAvc3RhdHVzLnRzXCI7XG4gKlxuICogY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2V4YW1wbGUuY29tL1wiKTtcbiAqXG4gKiBpZiAoaXNFcnJvclN0YXR1cyhyZXMuc3RhdHVzKSkge1xuICogICAvLyBlcnJvciBoYW5kbGluZyBoZXJlLi4uXG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuZXhwb3J0IGNvbnN0IFNUQVRVU19DT0RFID0ge1xuICAvKiogUkZDIDcyMzEsIDYuMi4xICovXG4gIENvbnRpbnVlOiAxMDAsXG4gIC8qKiBSRkMgNzIzMSwgNi4yLjIgKi9cbiAgU3dpdGNoaW5nUHJvdG9jb2xzOiAxMDEsXG4gIC8qKiBSRkMgMjUxOCwgMTAuMSAqL1xuICBQcm9jZXNzaW5nOiAxMDIsXG4gIC8qKiBSRkMgODI5NyAqKi9cbiAgRWFybHlIaW50czogMTAzLFxuXG4gIC8qKiBSRkMgNzIzMSwgNi4zLjEgKi9cbiAgT0s6IDIwMCxcbiAgLyoqIFJGQyA3MjMxLCA2LjMuMiAqL1xuICBDcmVhdGVkOiAyMDEsXG4gIC8qKiBSRkMgNzIzMSwgNi4zLjMgKi9cbiAgQWNjZXB0ZWQ6IDIwMixcbiAgLyoqIFJGQyA3MjMxLCA2LjMuNCAqL1xuICBOb25BdXRob3JpdGF0aXZlSW5mbzogMjAzLFxuICAvKiogUkZDIDcyMzEsIDYuMy41ICovXG4gIE5vQ29udGVudDogMjA0LFxuICAvKiogUkZDIDcyMzEsIDYuMy42ICovXG4gIFJlc2V0Q29udGVudDogMjA1LFxuICAvKiogUkZDIDcyMzMsIDQuMSAqL1xuICBQYXJ0aWFsQ29udGVudDogMjA2LFxuICAvKiogUkZDIDQ5MTgsIDExLjEgKi9cbiAgTXVsdGlTdGF0dXM6IDIwNyxcbiAgLyoqIFJGQyA1ODQyLCA3LjEgKi9cbiAgQWxyZWFkeVJlcG9ydGVkOiAyMDgsXG4gIC8qKiBSRkMgMzIyOSwgMTAuNC4xICovXG4gIElNVXNlZDogMjI2LFxuXG4gIC8qKiBSRkMgNzIzMSwgNi40LjEgKi9cbiAgTXVsdGlwbGVDaG9pY2VzOiAzMDAsXG4gIC8qKiBSRkMgNzIzMSwgNi40LjIgKi9cbiAgTW92ZWRQZXJtYW5lbnRseTogMzAxLFxuICAvKiogUkZDIDcyMzEsIDYuNC4zICovXG4gIEZvdW5kOiAzMDIsXG4gIC8qKiBSRkMgNzIzMSwgNi40LjQgKi9cbiAgU2VlT3RoZXI6IDMwMyxcbiAgLyoqIFJGQyA3MjMyLCA0LjEgKi9cbiAgTm90TW9kaWZpZWQ6IDMwNCxcbiAgLyoqIFJGQyA3MjMxLCA2LjQuNSAqL1xuICBVc2VQcm94eTogMzA1LFxuICAvKiogUkZDIDcyMzEsIDYuNC43ICovXG4gIFRlbXBvcmFyeVJlZGlyZWN0OiAzMDcsXG4gIC8qKiBSRkMgNzUzOCwgMyAqL1xuICBQZXJtYW5lbnRSZWRpcmVjdDogMzA4LFxuXG4gIC8qKiBSRkMgNzIzMSwgNi41LjEgKi9cbiAgQmFkUmVxdWVzdDogNDAwLFxuICAvKiogUkZDIDcyMzUsIDMuMSAqL1xuICBVbmF1dGhvcml6ZWQ6IDQwMSxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuMiAqL1xuICBQYXltZW50UmVxdWlyZWQ6IDQwMixcbiAgLyoqIFJGQyA3MjMxLCA2LjUuMyAqL1xuICBGb3JiaWRkZW46IDQwMyxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuNCAqL1xuICBOb3RGb3VuZDogNDA0LFxuICAvKiogUkZDIDcyMzEsIDYuNS41ICovXG4gIE1ldGhvZE5vdEFsbG93ZWQ6IDQwNSxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuNiAqL1xuICBOb3RBY2NlcHRhYmxlOiA0MDYsXG4gIC8qKiBSRkMgNzIzNSwgMy4yICovXG4gIFByb3h5QXV0aFJlcXVpcmVkOiA0MDcsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjcgKi9cbiAgUmVxdWVzdFRpbWVvdXQ6IDQwOCxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuOCAqL1xuICBDb25mbGljdDogNDA5LFxuICAvKiogUkZDIDcyMzEsIDYuNS45ICovXG4gIEdvbmU6IDQxMCxcbiAgLyoqIFJGQyA3MjMxLCA2LjUuMTAgKi9cbiAgTGVuZ3RoUmVxdWlyZWQ6IDQxMSxcbiAgLyoqIFJGQyA3MjMyLCA0LjIgKi9cbiAgUHJlY29uZGl0aW9uRmFpbGVkOiA0MTIsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjExICovXG4gIENvbnRlbnRUb29MYXJnZTogNDEzLFxuICAvKiogUkZDIDcyMzEsIDYuNS4xMiAqL1xuICBVUklUb29Mb25nOiA0MTQsXG4gIC8qKiBSRkMgNzIzMSwgNi41LjEzICovXG4gIFVuc3VwcG9ydGVkTWVkaWFUeXBlOiA0MTUsXG4gIC8qKiBSRkMgNzIzMywgNC40ICovXG4gIFJhbmdlTm90U2F0aXNmaWFibGU6IDQxNixcbiAgLyoqIFJGQyA3MjMxLCA2LjUuMTQgKi9cbiAgRXhwZWN0YXRpb25GYWlsZWQ6IDQxNyxcbiAgLyoqIFJGQyA3MTY4LCAyLjMuMyAqL1xuICBUZWFwb3Q6IDQxOCxcbiAgLyoqIFJGQyA3NTQwLCA5LjEuMiAqL1xuICBNaXNkaXJlY3RlZFJlcXVlc3Q6IDQyMSxcbiAgLyoqIFJGQyA0OTE4LCAxMS4yICovXG4gIFVucHJvY2Vzc2FibGVFbnRpdHk6IDQyMixcbiAgLyoqIFJGQyA0OTE4LCAxMS4zICovXG4gIExvY2tlZDogNDIzLFxuICAvKiogUkZDIDQ5MTgsIDExLjQgKi9cbiAgRmFpbGVkRGVwZW5kZW5jeTogNDI0LFxuICAvKiogUkZDIDg0NzAsIDUuMiAqL1xuICBUb29FYXJseTogNDI1LFxuICAvKiogUkZDIDcyMzEsIDYuNS4xNSAqL1xuICBVcGdyYWRlUmVxdWlyZWQ6IDQyNixcbiAgLyoqIFJGQyA2NTg1LCAzICovXG4gIFByZWNvbmRpdGlvblJlcXVpcmVkOiA0MjgsXG4gIC8qKiBSRkMgNjU4NSwgNCAqL1xuICBUb29NYW55UmVxdWVzdHM6IDQyOSxcbiAgLyoqIFJGQyA2NTg1LCA1ICovXG4gIFJlcXVlc3RIZWFkZXJGaWVsZHNUb29MYXJnZTogNDMxLFxuICAvKiogUkZDIDc3MjUsIDMgKi9cbiAgVW5hdmFpbGFibGVGb3JMZWdhbFJlYXNvbnM6IDQ1MSxcblxuICAvKiogUkZDIDcyMzEsIDYuNi4xICovXG4gIEludGVybmFsU2VydmVyRXJyb3I6IDUwMCxcbiAgLyoqIFJGQyA3MjMxLCA2LjYuMiAqL1xuICBOb3RJbXBsZW1lbnRlZDogNTAxLFxuICAvKiogUkZDIDcyMzEsIDYuNi4zICovXG4gIEJhZEdhdGV3YXk6IDUwMixcbiAgLyoqIFJGQyA3MjMxLCA2LjYuNCAqL1xuICBTZXJ2aWNlVW5hdmFpbGFibGU6IDUwMyxcbiAgLyoqIFJGQyA3MjMxLCA2LjYuNSAqL1xuICBHYXRld2F5VGltZW91dDogNTA0LFxuICAvKiogUkZDIDcyMzEsIDYuNi42ICovXG4gIEhUVFBWZXJzaW9uTm90U3VwcG9ydGVkOiA1MDUsXG4gIC8qKiBSRkMgMjI5NSwgOC4xICovXG4gIFZhcmlhbnRBbHNvTmVnb3RpYXRlczogNTA2LFxuICAvKiogUkZDIDQ5MTgsIDExLjUgKi9cbiAgSW5zdWZmaWNpZW50U3RvcmFnZTogNTA3LFxuICAvKiogUkZDIDU4NDIsIDcuMiAqL1xuICBMb29wRGV0ZWN0ZWQ6IDUwOCxcbiAgLyoqIFJGQyAyNzc0LCA3ICovXG4gIE5vdEV4dGVuZGVkOiA1MTAsXG4gIC8qKiBSRkMgNjU4NSwgNiAqL1xuICBOZXR3b3JrQXV0aGVudGljYXRpb25SZXF1aXJlZDogNTExLFxufSBhcyBjb25zdDtcblxuLyoqIEFuIEhUVFAgc3RhdHVzIGNvZGUuICovXG5leHBvcnQgdHlwZSBTdGF0dXNDb2RlID0gdHlwZW9mIFNUQVRVU19DT0RFW2tleW9mIHR5cGVvZiBTVEFUVVNfQ09ERV07XG5cbi8qKiBBIHJlY29yZCBvZiBhbGwgdGhlIHN0YXR1cyBjb2RlcyB0ZXh0LiAqL1xuZXhwb3J0IGNvbnN0IFNUQVRVU19URVhUID0ge1xuICBbU1RBVFVTX0NPREUuQWNjZXB0ZWRdOiBcIkFjY2VwdGVkXCIsXG4gIFtTVEFUVVNfQ09ERS5BbHJlYWR5UmVwb3J0ZWRdOiBcIkFscmVhZHkgUmVwb3J0ZWRcIixcbiAgW1NUQVRVU19DT0RFLkJhZEdhdGV3YXldOiBcIkJhZCBHYXRld2F5XCIsXG4gIFtTVEFUVVNfQ09ERS5CYWRSZXF1ZXN0XTogXCJCYWQgUmVxdWVzdFwiLFxuICBbU1RBVFVTX0NPREUuQ29uZmxpY3RdOiBcIkNvbmZsaWN0XCIsXG4gIFtTVEFUVVNfQ09ERS5Db250aW51ZV06IFwiQ29udGludWVcIixcbiAgW1NUQVRVU19DT0RFLkNyZWF0ZWRdOiBcIkNyZWF0ZWRcIixcbiAgW1NUQVRVU19DT0RFLkVhcmx5SGludHNdOiBcIkVhcmx5IEhpbnRzXCIsXG4gIFtTVEFUVVNfQ09ERS5FeHBlY3RhdGlvbkZhaWxlZF06IFwiRXhwZWN0YXRpb24gRmFpbGVkXCIsXG4gIFtTVEFUVVNfQ09ERS5GYWlsZWREZXBlbmRlbmN5XTogXCJGYWlsZWQgRGVwZW5kZW5jeVwiLFxuICBbU1RBVFVTX0NPREUuRm9yYmlkZGVuXTogXCJGb3JiaWRkZW5cIixcbiAgW1NUQVRVU19DT0RFLkZvdW5kXTogXCJGb3VuZFwiLFxuICBbU1RBVFVTX0NPREUuR2F0ZXdheVRpbWVvdXRdOiBcIkdhdGV3YXkgVGltZW91dFwiLFxuICBbU1RBVFVTX0NPREUuR29uZV06IFwiR29uZVwiLFxuICBbU1RBVFVTX0NPREUuSFRUUFZlcnNpb25Ob3RTdXBwb3J0ZWRdOiBcIkhUVFAgVmVyc2lvbiBOb3QgU3VwcG9ydGVkXCIsXG4gIFtTVEFUVVNfQ09ERS5JTVVzZWRdOiBcIklNIFVzZWRcIixcbiAgW1NUQVRVU19DT0RFLkluc3VmZmljaWVudFN0b3JhZ2VdOiBcIkluc3VmZmljaWVudCBTdG9yYWdlXCIsXG4gIFtTVEFUVVNfQ09ERS5JbnRlcm5hbFNlcnZlckVycm9yXTogXCJJbnRlcm5hbCBTZXJ2ZXIgRXJyb3JcIixcbiAgW1NUQVRVU19DT0RFLkxlbmd0aFJlcXVpcmVkXTogXCJMZW5ndGggUmVxdWlyZWRcIixcbiAgW1NUQVRVU19DT0RFLkxvY2tlZF06IFwiTG9ja2VkXCIsXG4gIFtTVEFUVVNfQ09ERS5Mb29wRGV0ZWN0ZWRdOiBcIkxvb3AgRGV0ZWN0ZWRcIixcbiAgW1NUQVRVU19DT0RFLk1ldGhvZE5vdEFsbG93ZWRdOiBcIk1ldGhvZCBOb3QgQWxsb3dlZFwiLFxuICBbU1RBVFVTX0NPREUuTWlzZGlyZWN0ZWRSZXF1ZXN0XTogXCJNaXNkaXJlY3RlZCBSZXF1ZXN0XCIsXG4gIFtTVEFUVVNfQ09ERS5Nb3ZlZFBlcm1hbmVudGx5XTogXCJNb3ZlZCBQZXJtYW5lbnRseVwiLFxuICBbU1RBVFVTX0NPREUuTXVsdGlTdGF0dXNdOiBcIk11bHRpIFN0YXR1c1wiLFxuICBbU1RBVFVTX0NPREUuTXVsdGlwbGVDaG9pY2VzXTogXCJNdWx0aXBsZSBDaG9pY2VzXCIsXG4gIFtTVEFUVVNfQ09ERS5OZXR3b3JrQXV0aGVudGljYXRpb25SZXF1aXJlZF06XG4gICAgXCJOZXR3b3JrIEF1dGhlbnRpY2F0aW9uIFJlcXVpcmVkXCIsXG4gIFtTVEFUVVNfQ09ERS5Ob0NvbnRlbnRdOiBcIk5vIENvbnRlbnRcIixcbiAgW1NUQVRVU19DT0RFLk5vbkF1dGhvcml0YXRpdmVJbmZvXTogXCJOb24gQXV0aG9yaXRhdGl2ZSBJbmZvXCIsXG4gIFtTVEFUVVNfQ09ERS5Ob3RBY2NlcHRhYmxlXTogXCJOb3QgQWNjZXB0YWJsZVwiLFxuICBbU1RBVFVTX0NPREUuTm90RXh0ZW5kZWRdOiBcIk5vdCBFeHRlbmRlZFwiLFxuICBbU1RBVFVTX0NPREUuTm90Rm91bmRdOiBcIk5vdCBGb3VuZFwiLFxuICBbU1RBVFVTX0NPREUuTm90SW1wbGVtZW50ZWRdOiBcIk5vdCBJbXBsZW1lbnRlZFwiLFxuICBbU1RBVFVTX0NPREUuTm90TW9kaWZpZWRdOiBcIk5vdCBNb2RpZmllZFwiLFxuICBbU1RBVFVTX0NPREUuT0tdOiBcIk9LXCIsXG4gIFtTVEFUVVNfQ09ERS5QYXJ0aWFsQ29udGVudF06IFwiUGFydGlhbCBDb250ZW50XCIsXG4gIFtTVEFUVVNfQ09ERS5QYXltZW50UmVxdWlyZWRdOiBcIlBheW1lbnQgUmVxdWlyZWRcIixcbiAgW1NUQVRVU19DT0RFLlBlcm1hbmVudFJlZGlyZWN0XTogXCJQZXJtYW5lbnQgUmVkaXJlY3RcIixcbiAgW1NUQVRVU19DT0RFLlByZWNvbmRpdGlvbkZhaWxlZF06IFwiUHJlY29uZGl0aW9uIEZhaWxlZFwiLFxuICBbU1RBVFVTX0NPREUuUHJlY29uZGl0aW9uUmVxdWlyZWRdOiBcIlByZWNvbmRpdGlvbiBSZXF1aXJlZFwiLFxuICBbU1RBVFVTX0NPREUuUHJvY2Vzc2luZ106IFwiUHJvY2Vzc2luZ1wiLFxuICBbU1RBVFVTX0NPREUuUHJveHlBdXRoUmVxdWlyZWRdOiBcIlByb3h5IEF1dGggUmVxdWlyZWRcIixcbiAgW1NUQVRVU19DT0RFLkNvbnRlbnRUb29MYXJnZV06IFwiQ29udGVudCBUb28gTGFyZ2VcIixcbiAgW1NUQVRVU19DT0RFLlJlcXVlc3RIZWFkZXJGaWVsZHNUb29MYXJnZV06IFwiUmVxdWVzdCBIZWFkZXIgRmllbGRzIFRvbyBMYXJnZVwiLFxuICBbU1RBVFVTX0NPREUuUmVxdWVzdFRpbWVvdXRdOiBcIlJlcXVlc3QgVGltZW91dFwiLFxuICBbU1RBVFVTX0NPREUuVVJJVG9vTG9uZ106IFwiVVJJIFRvbyBMb25nXCIsXG4gIFtTVEFUVVNfQ09ERS5SYW5nZU5vdFNhdGlzZmlhYmxlXTogXCJSYW5nZSBOb3QgU2F0aXNmaWFibGVcIixcbiAgW1NUQVRVU19DT0RFLlJlc2V0Q29udGVudF06IFwiUmVzZXQgQ29udGVudFwiLFxuICBbU1RBVFVTX0NPREUuU2VlT3RoZXJdOiBcIlNlZSBPdGhlclwiLFxuICBbU1RBVFVTX0NPREUuU2VydmljZVVuYXZhaWxhYmxlXTogXCJTZXJ2aWNlIFVuYXZhaWxhYmxlXCIsXG4gIFtTVEFUVVNfQ09ERS5Td2l0Y2hpbmdQcm90b2NvbHNdOiBcIlN3aXRjaGluZyBQcm90b2NvbHNcIixcbiAgW1NUQVRVU19DT0RFLlRlYXBvdF06IFwiSSdtIGEgdGVhcG90XCIsXG4gIFtTVEFUVVNfQ09ERS5UZW1wb3JhcnlSZWRpcmVjdF06IFwiVGVtcG9yYXJ5IFJlZGlyZWN0XCIsXG4gIFtTVEFUVVNfQ09ERS5Ub29FYXJseV06IFwiVG9vIEVhcmx5XCIsXG4gIFtTVEFUVVNfQ09ERS5Ub29NYW55UmVxdWVzdHNdOiBcIlRvbyBNYW55IFJlcXVlc3RzXCIsXG4gIFtTVEFUVVNfQ09ERS5VbmF1dGhvcml6ZWRdOiBcIlVuYXV0aG9yaXplZFwiLFxuICBbU1RBVFVTX0NPREUuVW5hdmFpbGFibGVGb3JMZWdhbFJlYXNvbnNdOiBcIlVuYXZhaWxhYmxlIEZvciBMZWdhbCBSZWFzb25zXCIsXG4gIFtTVEFUVVNfQ09ERS5VbnByb2Nlc3NhYmxlRW50aXR5XTogXCJVbnByb2Nlc3NhYmxlIEVudGl0eVwiLFxuICBbU1RBVFVTX0NPREUuVW5zdXBwb3J0ZWRNZWRpYVR5cGVdOiBcIlVuc3VwcG9ydGVkIE1lZGlhIFR5cGVcIixcbiAgW1NUQVRVU19DT0RFLlVwZ3JhZGVSZXF1aXJlZF06IFwiVXBncmFkZSBSZXF1aXJlZFwiLFxuICBbU1RBVFVTX0NPREUuVXNlUHJveHldOiBcIlVzZSBQcm94eVwiLFxuICBbU1RBVFVTX0NPREUuVmFyaWFudEFsc29OZWdvdGlhdGVzXTogXCJWYXJpYW50IEFsc28gTmVnb3RpYXRlc1wiLFxufSBhcyBjb25zdDtcblxuLyoqIEFuIEhUVFAgc3RhdHVzIHRleHQuICovXG5leHBvcnQgdHlwZSBTdGF0dXNUZXh0ID0gdHlwZW9mIFNUQVRVU19URVhUW2tleW9mIHR5cGVvZiBTVEFUVVNfVEVYVF07XG5cbi8qKiBBbiBIVFRQIHN0YXR1cyB0aGF0IGlzIGEgaW5mb3JtYXRpb25hbCAoMVhYKS4gKi9cbmV4cG9ydCB0eXBlIEluZm9ybWF0aW9uYWxTdGF0dXMgPVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Db250aW51ZVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Td2l0Y2hpbmdQcm90b2NvbHNcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuUHJvY2Vzc2luZ1xuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5FYXJseUhpbnRzO1xuXG4vKiogQW4gSFRUUCBzdGF0dXMgdGhhdCBpcyBhIHN1Y2Nlc3MgKDJYWCkuICovXG5leHBvcnQgdHlwZSBTdWNjZXNzZnVsU3RhdHVzID1cbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuT0tcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuQ3JlYXRlZFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5BY2NlcHRlZFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Ob25BdXRob3JpdGF0aXZlSW5mb1xuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Ob0NvbnRlbnRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuUmVzZXRDb250ZW50XG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlBhcnRpYWxDb250ZW50XG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLk11bHRpU3RhdHVzXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkFscmVhZHlSZXBvcnRlZFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5JTVVzZWQ7XG5cbi8qKiBBbiBIVFRQIHN0YXR1cyB0aGF0IGlzIGEgcmVkaXJlY3QgKDNYWCkuICovXG5leHBvcnQgdHlwZSBSZWRpcmVjdFN0YXR1cyA9XG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLk11bHRpcGxlQ2hvaWNlcyAvLyAzMDBcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuTW92ZWRQZXJtYW5lbnRseSAvLyAzMDFcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuRm91bmQgLy8gMzAyXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlNlZU90aGVyIC8vIDMwM1xuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Vc2VQcm94eSAvLyAzMDUgLSBERVBSRUNBVEVEXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlRlbXBvcmFyeVJlZGlyZWN0IC8vIDMwN1xuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5QZXJtYW5lbnRSZWRpcmVjdDsgLy8gMzA4XG5cbi8qKiBBbiBIVFRQIHN0YXR1cyB0aGF0IGlzIGEgY2xpZW50IGVycm9yICg0WFgpLiAqL1xuZXhwb3J0IHR5cGUgQ2xpZW50RXJyb3JTdGF0dXMgPVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5CYWRSZXF1ZXN0XG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlVuYXV0aG9yaXplZFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5QYXltZW50UmVxdWlyZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuRm9yYmlkZGVuXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLk5vdEZvdW5kXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLk1ldGhvZE5vdEFsbG93ZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuTm90QWNjZXB0YWJsZVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Qcm94eUF1dGhSZXF1aXJlZFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5SZXF1ZXN0VGltZW91dFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Db25mbGljdFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Hb25lXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkxlbmd0aFJlcXVpcmVkXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlByZWNvbmRpdGlvbkZhaWxlZFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Db250ZW50VG9vTGFyZ2VcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuVVJJVG9vTG9uZ1xuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5VbnN1cHBvcnRlZE1lZGlhVHlwZVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5SYW5nZU5vdFNhdGlzZmlhYmxlXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkV4cGVjdGF0aW9uRmFpbGVkXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlRlYXBvdFxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5NaXNkaXJlY3RlZFJlcXVlc3RcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuVW5wcm9jZXNzYWJsZUVudGl0eVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5Mb2NrZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuRmFpbGVkRGVwZW5kZW5jeVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5VcGdyYWRlUmVxdWlyZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuUHJlY29uZGl0aW9uUmVxdWlyZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuVG9vTWFueVJlcXVlc3RzXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLlJlcXVlc3RIZWFkZXJGaWVsZHNUb29MYXJnZVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5VbmF2YWlsYWJsZUZvckxlZ2FsUmVhc29ucztcblxuLyoqIEFuIEhUVFAgc3RhdHVzIHRoYXQgaXMgYSBzZXJ2ZXIgZXJyb3IgKDVYWCkuICovXG5leHBvcnQgdHlwZSBTZXJ2ZXJFcnJvclN0YXR1cyA9XG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkludGVybmFsU2VydmVyRXJyb3JcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuTm90SW1wbGVtZW50ZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuQmFkR2F0ZXdheVxuICB8IHR5cGVvZiBTVEFUVVNfQ09ERS5TZXJ2aWNlVW5hdmFpbGFibGVcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuR2F0ZXdheVRpbWVvdXRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuSFRUUFZlcnNpb25Ob3RTdXBwb3J0ZWRcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuVmFyaWFudEFsc29OZWdvdGlhdGVzXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLkluc3VmZmljaWVudFN0b3JhZ2VcbiAgfCB0eXBlb2YgU1RBVFVTX0NPREUuTG9vcERldGVjdGVkXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLk5vdEV4dGVuZGVkXG4gIHwgdHlwZW9mIFNUQVRVU19DT0RFLk5ldHdvcmtBdXRoZW50aWNhdGlvblJlcXVpcmVkO1xuXG4vKiogQW4gSFRUUCBzdGF0dXMgdGhhdCBpcyBhbiBlcnJvciAoNFhYIGFuZCA1WFgpLiAqL1xuZXhwb3J0IHR5cGUgRXJyb3JTdGF0dXMgPSBDbGllbnRFcnJvclN0YXR1cyB8IFNlcnZlckVycm9yU3RhdHVzO1xuXG4vKiogUmV0dXJucyB3aGV0aGVyIHRoZSBwcm92aWRlZCBudW1iZXIgaXMgYSB2YWxpZCBIVFRQIHN0YXR1cyBjb2RlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3RhdHVzKHN0YXR1czogbnVtYmVyKTogc3RhdHVzIGlzIFN0YXR1c0NvZGUge1xuICByZXR1cm4gT2JqZWN0LnZhbHVlcyhTVEFUVVNfQ09ERSkuaW5jbHVkZXMoc3RhdHVzIGFzIFN0YXR1c0NvZGUpO1xufVxuXG4vKiogQSB0eXBlIGd1YXJkIHRoYXQgZGV0ZXJtaW5lcyBpZiB0aGUgc3RhdHVzIGNvZGUgaXMgaW5mb3JtYXRpb25hbC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0luZm9ybWF0aW9uYWxTdGF0dXMoXG4gIHN0YXR1czogbnVtYmVyLFxuKTogc3RhdHVzIGlzIEluZm9ybWF0aW9uYWxTdGF0dXMge1xuICByZXR1cm4gaXNTdGF0dXMoc3RhdHVzKSAmJiBzdGF0dXMgPj0gMTAwICYmIHN0YXR1cyA8IDIwMDtcbn1cblxuLyoqIEEgdHlwZSBndWFyZCB0aGF0IGRldGVybWluZXMgaWYgdGhlIHN0YXR1cyBjb2RlIGlzIHN1Y2Nlc3NmdWwuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTdWNjZXNzZnVsU3RhdHVzKFxuICBzdGF0dXM6IG51bWJlcixcbik6IHN0YXR1cyBpcyBTdWNjZXNzZnVsU3RhdHVzIHtcbiAgcmV0dXJuIGlzU3RhdHVzKHN0YXR1cykgJiYgc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCAzMDA7XG59XG5cbi8qKiBBIHR5cGUgZ3VhcmQgdGhhdCBkZXRlcm1pbmVzIGlmIHRoZSBzdGF0dXMgY29kZSBpcyBhIHJlZGlyZWN0aW9uLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUmVkaXJlY3RTdGF0dXMoc3RhdHVzOiBudW1iZXIpOiBzdGF0dXMgaXMgUmVkaXJlY3RTdGF0dXMge1xuICByZXR1cm4gaXNTdGF0dXMoc3RhdHVzKSAmJiBzdGF0dXMgPj0gMzAwICYmIHN0YXR1cyA8IDQwMDtcbn1cblxuLyoqIEEgdHlwZSBndWFyZCB0aGF0IGRldGVybWluZXMgaWYgdGhlIHN0YXR1cyBjb2RlIGlzIGEgY2xpZW50IGVycm9yLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQ2xpZW50RXJyb3JTdGF0dXMoXG4gIHN0YXR1czogbnVtYmVyLFxuKTogc3RhdHVzIGlzIENsaWVudEVycm9yU3RhdHVzIHtcbiAgcmV0dXJuIGlzU3RhdHVzKHN0YXR1cykgJiYgc3RhdHVzID49IDQwMCAmJiBzdGF0dXMgPCA1MDA7XG59XG5cbi8qKiBBIHR5cGUgZ3VhcmQgdGhhdCBkZXRlcm1pbmVzIGlmIHRoZSBzdGF0dXMgY29kZSBpcyBhIHNlcnZlciBlcnJvci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NlcnZlckVycm9yU3RhdHVzKFxuICBzdGF0dXM6IG51bWJlcixcbik6IHN0YXR1cyBpcyBTZXJ2ZXJFcnJvclN0YXR1cyB7XG4gIHJldHVybiBpc1N0YXR1cyhzdGF0dXMpICYmIHN0YXR1cyA+PSA1MDAgJiYgc3RhdHVzIDwgNjAwO1xufVxuXG4vKiogQSB0eXBlIGd1YXJkIHRoYXQgZGV0ZXJtaW5lcyBpZiB0aGUgc3RhdHVzIGNvZGUgaXMgYW4gZXJyb3IuICovXG5leHBvcnQgZnVuY3Rpb24gaXNFcnJvclN0YXR1cyhzdGF0dXM6IG51bWJlcik6IHN0YXR1cyBpcyBFcnJvclN0YXR1cyB7XG4gIHJldHVybiBpc1N0YXR1cyhzdGF0dXMpICYmIHN0YXR1cyA+PSA0MDAgJiYgc3RhdHVzIDwgNjAwO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E0QkMsR0FFRCxPQUFPLE1BQU0sY0FBYztFQUN6QixvQkFBb0IsR0FDcEIsVUFBVTtFQUNWLG9CQUFvQixHQUNwQixvQkFBb0I7RUFDcEIsbUJBQW1CLEdBQ25CLFlBQVk7RUFDWixjQUFjLEdBQ2QsWUFBWTtFQUVaLG9CQUFvQixHQUNwQixJQUFJO0VBQ0osb0JBQW9CLEdBQ3BCLFNBQVM7RUFDVCxvQkFBb0IsR0FDcEIsVUFBVTtFQUNWLG9CQUFvQixHQUNwQixzQkFBc0I7RUFDdEIsb0JBQW9CLEdBQ3BCLFdBQVc7RUFDWCxvQkFBb0IsR0FDcEIsY0FBYztFQUNkLGtCQUFrQixHQUNsQixnQkFBZ0I7RUFDaEIsbUJBQW1CLEdBQ25CLGFBQWE7RUFDYixrQkFBa0IsR0FDbEIsaUJBQWlCO0VBQ2pCLHFCQUFxQixHQUNyQixRQUFRO0VBRVIsb0JBQW9CLEdBQ3BCLGlCQUFpQjtFQUNqQixvQkFBb0IsR0FDcEIsa0JBQWtCO0VBQ2xCLG9CQUFvQixHQUNwQixPQUFPO0VBQ1Asb0JBQW9CLEdBQ3BCLFVBQVU7RUFDVixrQkFBa0IsR0FDbEIsYUFBYTtFQUNiLG9CQUFvQixHQUNwQixVQUFVO0VBQ1Ysb0JBQW9CLEdBQ3BCLG1CQUFtQjtFQUNuQixnQkFBZ0IsR0FDaEIsbUJBQW1CO0VBRW5CLG9CQUFvQixHQUNwQixZQUFZO0VBQ1osa0JBQWtCLEdBQ2xCLGNBQWM7RUFDZCxvQkFBb0IsR0FDcEIsaUJBQWlCO0VBQ2pCLG9CQUFvQixHQUNwQixXQUFXO0VBQ1gsb0JBQW9CLEdBQ3BCLFVBQVU7RUFDVixvQkFBb0IsR0FDcEIsa0JBQWtCO0VBQ2xCLG9CQUFvQixHQUNwQixlQUFlO0VBQ2Ysa0JBQWtCLEdBQ2xCLG1CQUFtQjtFQUNuQixvQkFBb0IsR0FDcEIsZ0JBQWdCO0VBQ2hCLG9CQUFvQixHQUNwQixVQUFVO0VBQ1Ysb0JBQW9CLEdBQ3BCLE1BQU07RUFDTixxQkFBcUIsR0FDckIsZ0JBQWdCO0VBQ2hCLGtCQUFrQixHQUNsQixvQkFBb0I7RUFDcEIscUJBQXFCLEdBQ3JCLGlCQUFpQjtFQUNqQixxQkFBcUIsR0FDckIsWUFBWTtFQUNaLHFCQUFxQixHQUNyQixzQkFBc0I7RUFDdEIsa0JBQWtCLEdBQ2xCLHFCQUFxQjtFQUNyQixxQkFBcUIsR0FDckIsbUJBQW1CO0VBQ25CLG9CQUFvQixHQUNwQixRQUFRO0VBQ1Isb0JBQW9CLEdBQ3BCLG9CQUFvQjtFQUNwQixtQkFBbUIsR0FDbkIscUJBQXFCO0VBQ3JCLG1CQUFtQixHQUNuQixRQUFRO0VBQ1IsbUJBQW1CLEdBQ25CLGtCQUFrQjtFQUNsQixrQkFBa0IsR0FDbEIsVUFBVTtFQUNWLHFCQUFxQixHQUNyQixpQkFBaUI7RUFDakIsZ0JBQWdCLEdBQ2hCLHNCQUFzQjtFQUN0QixnQkFBZ0IsR0FDaEIsaUJBQWlCO0VBQ2pCLGdCQUFnQixHQUNoQiw2QkFBNkI7RUFDN0IsZ0JBQWdCLEdBQ2hCLDRCQUE0QjtFQUU1QixvQkFBb0IsR0FDcEIscUJBQXFCO0VBQ3JCLG9CQUFvQixHQUNwQixnQkFBZ0I7RUFDaEIsb0JBQW9CLEdBQ3BCLFlBQVk7RUFDWixvQkFBb0IsR0FDcEIsb0JBQW9CO0VBQ3BCLG9CQUFvQixHQUNwQixnQkFBZ0I7RUFDaEIsb0JBQW9CLEdBQ3BCLHlCQUF5QjtFQUN6QixrQkFBa0IsR0FDbEIsdUJBQXVCO0VBQ3ZCLG1CQUFtQixHQUNuQixxQkFBcUI7RUFDckIsa0JBQWtCLEdBQ2xCLGNBQWM7RUFDZCxnQkFBZ0IsR0FDaEIsYUFBYTtFQUNiLGdCQUFnQixHQUNoQiwrQkFBK0I7QUFDakMsRUFBVztBQUtYLDJDQUEyQyxHQUMzQyxPQUFPLE1BQU0sY0FBYztFQUN6QixDQUFDLFlBQVksUUFBUSxDQUFDLEVBQUU7RUFDeEIsQ0FBQyxZQUFZLGVBQWUsQ0FBQyxFQUFFO0VBQy9CLENBQUMsWUFBWSxVQUFVLENBQUMsRUFBRTtFQUMxQixDQUFDLFlBQVksVUFBVSxDQUFDLEVBQUU7RUFDMUIsQ0FBQyxZQUFZLFFBQVEsQ0FBQyxFQUFFO0VBQ3hCLENBQUMsWUFBWSxRQUFRLENBQUMsRUFBRTtFQUN4QixDQUFDLFlBQVksT0FBTyxDQUFDLEVBQUU7RUFDdkIsQ0FBQyxZQUFZLFVBQVUsQ0FBQyxFQUFFO0VBQzFCLENBQUMsWUFBWSxpQkFBaUIsQ0FBQyxFQUFFO0VBQ2pDLENBQUMsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO0VBQ2hDLENBQUMsWUFBWSxTQUFTLENBQUMsRUFBRTtFQUN6QixDQUFDLFlBQVksS0FBSyxDQUFDLEVBQUU7RUFDckIsQ0FBQyxZQUFZLGNBQWMsQ0FBQyxFQUFFO0VBQzlCLENBQUMsWUFBWSxJQUFJLENBQUMsRUFBRTtFQUNwQixDQUFDLFlBQVksdUJBQXVCLENBQUMsRUFBRTtFQUN2QyxDQUFDLFlBQVksTUFBTSxDQUFDLEVBQUU7RUFDdEIsQ0FBQyxZQUFZLG1CQUFtQixDQUFDLEVBQUU7RUFDbkMsQ0FBQyxZQUFZLG1CQUFtQixDQUFDLEVBQUU7RUFDbkMsQ0FBQyxZQUFZLGNBQWMsQ0FBQyxFQUFFO0VBQzlCLENBQUMsWUFBWSxNQUFNLENBQUMsRUFBRTtFQUN0QixDQUFDLFlBQVksWUFBWSxDQUFDLEVBQUU7RUFDNUIsQ0FBQyxZQUFZLGdCQUFnQixDQUFDLEVBQUU7RUFDaEMsQ0FBQyxZQUFZLGtCQUFrQixDQUFDLEVBQUU7RUFDbEMsQ0FBQyxZQUFZLGdCQUFnQixDQUFDLEVBQUU7RUFDaEMsQ0FBQyxZQUFZLFdBQVcsQ0FBQyxFQUFFO0VBQzNCLENBQUMsWUFBWSxlQUFlLENBQUMsRUFBRTtFQUMvQixDQUFDLFlBQVksNkJBQTZCLENBQUMsRUFDekM7RUFDRixDQUFDLFlBQVksU0FBUyxDQUFDLEVBQUU7RUFDekIsQ0FBQyxZQUFZLG9CQUFvQixDQUFDLEVBQUU7RUFDcEMsQ0FBQyxZQUFZLGFBQWEsQ0FBQyxFQUFFO0VBQzdCLENBQUMsWUFBWSxXQUFXLENBQUMsRUFBRTtFQUMzQixDQUFDLFlBQVksUUFBUSxDQUFDLEVBQUU7RUFDeEIsQ0FBQyxZQUFZLGNBQWMsQ0FBQyxFQUFFO0VBQzlCLENBQUMsWUFBWSxXQUFXLENBQUMsRUFBRTtFQUMzQixDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUU7RUFDbEIsQ0FBQyxZQUFZLGNBQWMsQ0FBQyxFQUFFO0VBQzlCLENBQUMsWUFBWSxlQUFlLENBQUMsRUFBRTtFQUMvQixDQUFDLFlBQVksaUJBQWlCLENBQUMsRUFBRTtFQUNqQyxDQUFDLFlBQVksa0JBQWtCLENBQUMsRUFBRTtFQUNsQyxDQUFDLFlBQVksb0JBQW9CLENBQUMsRUFBRTtFQUNwQyxDQUFDLFlBQVksVUFBVSxDQUFDLEVBQUU7RUFDMUIsQ0FBQyxZQUFZLGlCQUFpQixDQUFDLEVBQUU7RUFDakMsQ0FBQyxZQUFZLGVBQWUsQ0FBQyxFQUFFO0VBQy9CLENBQUMsWUFBWSwyQkFBMkIsQ0FBQyxFQUFFO0VBQzNDLENBQUMsWUFBWSxjQUFjLENBQUMsRUFBRTtFQUM5QixDQUFDLFlBQVksVUFBVSxDQUFDLEVBQUU7RUFDMUIsQ0FBQyxZQUFZLG1CQUFtQixDQUFDLEVBQUU7RUFDbkMsQ0FBQyxZQUFZLFlBQVksQ0FBQyxFQUFFO0VBQzVCLENBQUMsWUFBWSxRQUFRLENBQUMsRUFBRTtFQUN4QixDQUFDLFlBQVksa0JBQWtCLENBQUMsRUFBRTtFQUNsQyxDQUFDLFlBQVksa0JBQWtCLENBQUMsRUFBRTtFQUNsQyxDQUFDLFlBQVksTUFBTSxDQUFDLEVBQUU7RUFDdEIsQ0FBQyxZQUFZLGlCQUFpQixDQUFDLEVBQUU7RUFDakMsQ0FBQyxZQUFZLFFBQVEsQ0FBQyxFQUFFO0VBQ3hCLENBQUMsWUFBWSxlQUFlLENBQUMsRUFBRTtFQUMvQixDQUFDLFlBQVksWUFBWSxDQUFDLEVBQUU7RUFDNUIsQ0FBQyxZQUFZLDBCQUEwQixDQUFDLEVBQUU7RUFDMUMsQ0FBQyxZQUFZLG1CQUFtQixDQUFDLEVBQUU7RUFDbkMsQ0FBQyxZQUFZLG9CQUFvQixDQUFDLEVBQUU7RUFDcEMsQ0FBQyxZQUFZLGVBQWUsQ0FBQyxFQUFFO0VBQy9CLENBQUMsWUFBWSxRQUFRLENBQUMsRUFBRTtFQUN4QixDQUFDLFlBQVkscUJBQXFCLENBQUMsRUFBRTtBQUN2QyxFQUFXO0FBbUZYLHFFQUFxRSxHQUNyRSxPQUFPLFNBQVMsU0FBUyxNQUFjO0VBQ3JDLE9BQU8sT0FBTyxNQUFNLENBQUMsYUFBYSxRQUFRLENBQUM7QUFDN0M7QUFFQSxzRUFBc0UsR0FDdEUsT0FBTyxTQUFTLHNCQUNkLE1BQWM7RUFFZCxPQUFPLFNBQVMsV0FBVyxVQUFVLE9BQU8sU0FBUztBQUN2RDtBQUVBLG1FQUFtRSxHQUNuRSxPQUFPLFNBQVMsbUJBQ2QsTUFBYztFQUVkLE9BQU8sU0FBUyxXQUFXLFVBQVUsT0FBTyxTQUFTO0FBQ3ZEO0FBRUEsc0VBQXNFLEdBQ3RFLE9BQU8sU0FBUyxpQkFBaUIsTUFBYztFQUM3QyxPQUFPLFNBQVMsV0FBVyxVQUFVLE9BQU8sU0FBUztBQUN2RDtBQUVBLHVFQUF1RSxHQUN2RSxPQUFPLFNBQVMsb0JBQ2QsTUFBYztFQUVkLE9BQU8sU0FBUyxXQUFXLFVBQVUsT0FBTyxTQUFTO0FBQ3ZEO0FBRUEsdUVBQXVFLEdBQ3ZFLE9BQU8sU0FBUyxvQkFDZCxNQUFjO0VBRWQsT0FBTyxTQUFTLFdBQVcsVUFBVSxPQUFPLFNBQVM7QUFDdkQ7QUFFQSxpRUFBaUUsR0FDakUsT0FBTyxTQUFTLGNBQWMsTUFBYztFQUMxQyxPQUFPLFNBQVMsV0FBVyxVQUFVLE9BQU8sU0FBUztBQUN2RCJ9
// denoCacheMetadata=7507224161300818902,1437573560359763606