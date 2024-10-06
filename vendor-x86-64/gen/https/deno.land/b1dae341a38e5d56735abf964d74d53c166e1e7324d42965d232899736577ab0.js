import { DATA_ANCESTOR, DATA_CURRENT } from "../constants.ts";
export var UrlMatchKind;
(function(UrlMatchKind) {
  UrlMatchKind[UrlMatchKind["None"] = 0] = "None";
  UrlMatchKind[UrlMatchKind["Ancestor"] = 1] = "Ancestor";
  UrlMatchKind[UrlMatchKind["Current"] = 2] = "Current";
})(UrlMatchKind || (UrlMatchKind = {}));
export function matchesUrl(current, needle) {
  let href = new URL(needle, "http://localhost").pathname;
  if (href !== "/" && href.endsWith("/")) {
    href = href.slice(0, -1);
  }
  if (current !== "/" && current.endsWith("/")) {
    current = current.slice(0, -1);
  }
  if (current === href) {
    return 2;
  } else if (current.startsWith(href + "/") || href === "/") {
    return 1;
  }
  return 0;
}
/**
 * Mark active or ancestor link
 * Note: This function is used both on the server and the client
 */ export function setActiveUrl(vnode, pathname) {
  const props = vnode.props;
  const hrefProp = props.href;
  if (typeof hrefProp === "string" && hrefProp.startsWith("/")) {
    const match = matchesUrl(pathname, hrefProp);
    if (match === 2) {
      props[DATA_CURRENT] = "true";
      props["aria-current"] = "page";
    } else if (match === 1) {
      props[DATA_ANCESTOR] = "true";
      props["aria-current"] = "true";
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3J1bnRpbWUvYWN0aXZlX3VybC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBWTm9kZSB9IGZyb20gXCJwcmVhY3RcIjtcbmltcG9ydCB7IERBVEFfQU5DRVNUT1IsIERBVEFfQ1VSUkVOVCB9IGZyb20gXCIuLi9jb25zdGFudHMudHNcIjtcblxuZXhwb3J0IGNvbnN0IGVudW0gVXJsTWF0Y2hLaW5kIHtcbiAgTm9uZSxcbiAgQW5jZXN0b3IsXG4gIEN1cnJlbnQsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGVzVXJsKGN1cnJlbnQ6IHN0cmluZywgbmVlZGxlOiBzdHJpbmcpOiBVcmxNYXRjaEtpbmQge1xuICBsZXQgaHJlZiA9IG5ldyBVUkwobmVlZGxlLCBcImh0dHA6Ly9sb2NhbGhvc3RcIikucGF0aG5hbWU7XG4gIGlmIChocmVmICE9PSBcIi9cIiAmJiBocmVmLmVuZHNXaXRoKFwiL1wiKSkge1xuICAgIGhyZWYgPSBocmVmLnNsaWNlKDAsIC0xKTtcbiAgfVxuXG4gIGlmIChjdXJyZW50ICE9PSBcIi9cIiAmJiBjdXJyZW50LmVuZHNXaXRoKFwiL1wiKSkge1xuICAgIGN1cnJlbnQgPSBjdXJyZW50LnNsaWNlKDAsIC0xKTtcbiAgfVxuXG4gIGlmIChjdXJyZW50ID09PSBocmVmKSB7XG4gICAgcmV0dXJuIFVybE1hdGNoS2luZC5DdXJyZW50O1xuICB9IGVsc2UgaWYgKGN1cnJlbnQuc3RhcnRzV2l0aChocmVmICsgXCIvXCIpIHx8IGhyZWYgPT09IFwiL1wiKSB7XG4gICAgcmV0dXJuIFVybE1hdGNoS2luZC5BbmNlc3RvcjtcbiAgfVxuXG4gIHJldHVybiBVcmxNYXRjaEtpbmQuTm9uZTtcbn1cblxuLyoqXG4gKiBNYXJrIGFjdGl2ZSBvciBhbmNlc3RvciBsaW5rXG4gKiBOb3RlOiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgYm90aCBvbiB0aGUgc2VydmVyIGFuZCB0aGUgY2xpZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRBY3RpdmVVcmwodm5vZGU6IFZOb2RlLCBwYXRobmFtZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHByb3BzID0gdm5vZGUucHJvcHMgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gIGNvbnN0IGhyZWZQcm9wID0gcHJvcHMuaHJlZjtcbiAgaWYgKHR5cGVvZiBocmVmUHJvcCA9PT0gXCJzdHJpbmdcIiAmJiBocmVmUHJvcC5zdGFydHNXaXRoKFwiL1wiKSkge1xuICAgIGNvbnN0IG1hdGNoID0gbWF0Y2hlc1VybChwYXRobmFtZSwgaHJlZlByb3ApO1xuICAgIGlmIChtYXRjaCA9PT0gVXJsTWF0Y2hLaW5kLkN1cnJlbnQpIHtcbiAgICAgIHByb3BzW0RBVEFfQ1VSUkVOVF0gPSBcInRydWVcIjtcbiAgICAgIHByb3BzW1wiYXJpYS1jdXJyZW50XCJdID0gXCJwYWdlXCI7XG4gICAgfSBlbHNlIGlmIChtYXRjaCA9PT0gVXJsTWF0Y2hLaW5kLkFuY2VzdG9yKSB7XG4gICAgICBwcm9wc1tEQVRBX0FOQ0VTVE9SXSA9IFwidHJ1ZVwiO1xuICAgICAgcHJvcHNbXCJhcmlhLWN1cnJlbnRcIl0gPSBcInRydWVcIjtcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLGFBQWEsRUFBRSxZQUFZLFFBQVEsa0JBQWtCOztVQUU1Qzs7OztHQUFBLGlCQUFBO0FBTWxCLE9BQU8sU0FBUyxXQUFXLE9BQWUsRUFBRSxNQUFjO0VBQ3hELElBQUksT0FBTyxJQUFJLElBQUksUUFBUSxvQkFBb0IsUUFBUTtFQUN2RCxJQUFJLFNBQVMsT0FBTyxLQUFLLFFBQVEsQ0FBQyxNQUFNO0lBQ3RDLE9BQU8sS0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDO0VBQ3hCO0VBRUEsSUFBSSxZQUFZLE9BQU8sUUFBUSxRQUFRLENBQUMsTUFBTTtJQUM1QyxVQUFVLFFBQVEsS0FBSyxDQUFDLEdBQUcsQ0FBQztFQUM5QjtFQUVBLElBQUksWUFBWSxNQUFNO0lBQ3BCO0VBQ0YsT0FBTyxJQUFJLFFBQVEsVUFBVSxDQUFDLE9BQU8sUUFBUSxTQUFTLEtBQUs7SUFDekQ7RUFDRjtFQUVBO0FBQ0Y7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsYUFBYSxLQUFZLEVBQUUsUUFBZ0I7RUFDekQsTUFBTSxRQUFRLE1BQU0sS0FBSztFQUN6QixNQUFNLFdBQVcsTUFBTSxJQUFJO0VBQzNCLElBQUksT0FBTyxhQUFhLFlBQVksU0FBUyxVQUFVLENBQUMsTUFBTTtJQUM1RCxNQUFNLFFBQVEsV0FBVyxVQUFVO0lBQ25DLElBQUksYUFBZ0M7TUFDbEMsS0FBSyxDQUFDLGFBQWEsR0FBRztNQUN0QixLQUFLLENBQUMsZUFBZSxHQUFHO0lBQzFCLE9BQU8sSUFBSSxhQUFpQztNQUMxQyxLQUFLLENBQUMsY0FBYyxHQUFHO01BQ3ZCLEtBQUssQ0FBQyxlQUFlLEdBQUc7SUFDMUI7RUFDRjtBQUNGIn0=
// denoCacheMetadata=17725789265761230848,11673701872038090747