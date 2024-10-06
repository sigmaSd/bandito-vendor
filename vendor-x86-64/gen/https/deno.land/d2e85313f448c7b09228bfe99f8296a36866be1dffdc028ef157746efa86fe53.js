import { Fragment, h, isValidElement, options as preactOptions } from "preact";
import { assetHashingHook } from "../../runtime/utils.ts";
import { Partial } from "../../runtime/Partial.tsx";
import { join, renderToString, SEPARATOR } from "../deps.ts";
import { CLIENT_NAV_ATTR, DATA_KEY_ATTR, LOADING_ATTR, PartialMode } from "../../constants.ts";
import { setActiveUrl } from "../../runtime/active_url.ts";
import { withBase } from "../router.ts";
var HookType;
// See: https://github.com/preactjs/preact/blob/7748dcb83cedd02e37b3713634e35b97b26028fd/src/internal.d.ts#L3C1-L16
(function(HookType) {
  HookType[HookType["useState"] = 1] = "useState";
  HookType[HookType["useReducer"] = 2] = "useReducer";
  HookType[HookType["useEffect"] = 3] = "useEffect";
  HookType[HookType["useLayoutEffect"] = 4] = "useLayoutEffect";
  HookType[HookType["useRef"] = 5] = "useRef";
  HookType[HookType["useImperativeHandle"] = 6] = "useImperativeHandle";
  HookType[HookType["useMemo"] = 7] = "useMemo";
  HookType[HookType["useCallback"] = 8] = "useCallback";
  HookType[HookType["useContext"] = 9] = "useContext";
  HookType[HookType["useErrorBoundary"] = 10] = "useErrorBoundary";
  // Not a real hook, but the devtools treat is as such
  HookType[HookType["useDebugvalue"] = 11] = "useDebugvalue";
})(HookType || (HookType = {}));
const options = preactOptions;
// Enable error boundaries in Preact.
options.errorBoundaries = true;
// Set up a preact option hook to track when vnode with custom functions are
// created.
let current = null;
// Keep track of which component rendered which vnode. This allows us
// to detect when an island is rendered within another instead of being
// passed as children.
let ownerStack = [];
// Keep track of all available islands
const islandByComponent = new Map();
export function setAllIslands(islands) {
  for(let i = 0; i < islands.length; i++){
    const island = islands[i];
    islandByComponent.set(island.component, island);
  }
}
export function setRenderState(state) {
  if (current) current.clearTmpState();
  current = state;
  ownerStack = state?.ownerStack ?? [];
}
// Check if an older version of `preact-render-to-string` is used
const supportsUnstableComments = renderToString(h(Fragment, {
  // @ts-ignore unstable features not supported in types
  UNSTABLE_comment: "foo"
})) !== "";
if (!supportsUnstableComments) {
  console.warn("⚠️  Found old version of 'preact-render-to-string'. Please upgrade it to >=6.1.0");
}
/**
 *  Wrap a node with comment markers in the HTML
 */ function wrapWithMarker(vnode, markerText) {
  // Newer versions of preact-render-to-string allow you to render comments
  if (supportsUnstableComments) {
    return h(Fragment, null, h(Fragment, {
      // @ts-ignore unstable property is not typed
      UNSTABLE_comment: markerText
    }), vnode, h(Fragment, {
      // @ts-ignore unstable property is not typed
      UNSTABLE_comment: "/" + markerText
    }));
  } else {
    return h(`!--${markerText}--`, null, vnode);
  }
}
/**
 * Whenever a slot (=jsx children) is rendered, remove this from the slot
 * tracking Set. After everything was rendered we'll know which slots
 * weren't and can send them down to the client
 */ function SlotTracker(props) {
  current?.slots.delete(props.id);
  // deno-lint-ignore no-explicit-any
  return props.children;
}
/**
 * Copy props but exclude children
 */ function excludeChildren(props) {
  const out = {};
  for(const k in props){
    if (k !== "children") out[k] = props[k];
  }
  return out;
}
/**
 * Check if the current component was rendered in an island
 */ function hasIslandOwner(current, vnode) {
  let tmpVNode = vnode;
  let owner;
  while((owner = current.owners.get(tmpVNode)) !== undefined){
    if (islandByComponent.has(owner.type)) {
      return true;
    }
    tmpVNode = owner;
  }
  return false;
}
function encodePartialMode(mode) {
  if (mode === "replace") return PartialMode.REPLACE;
  else if (mode === "append") return PartialMode.APPEND;
  else if (mode === "prepend") return PartialMode.PREPEND;
  throw new Error(`Unknown partial mode "${mode}"`);
}
const patched = new WeakSet();
const oldVNodeHook = options.vnode;
const oldDiff = options.__b;
const oldDiffed = options.diffed;
const oldRender = options.__r;
const oldHook = options.__h;
options.vnode = (vnode)=>{
  assetHashingHook(vnode);
  // Work around `preact/debug` string event handler error which
  // errors when an event handler gets a string. This makes sense
  // on the client where this is a common vector for XSS. On the
  // server when the string was not created through concatenation
  // it is fine. Internally, `preact/debug` only checks for the
  // lowercase variant.
  if (typeof vnode.type === "string") {
    const props = vnode.props;
    for(const key in props){
      const value = props[key];
      if (key.startsWith("on") && typeof value === "string") {
        delete props[key];
        props["ON" + key.slice(2)] = value;
      }
    }
    // Don't do key preservation for nodes in <head>.
    if (vnode.key && vnode.type !== "meta" && vnode.type !== "title" && vnode.type !== "style" && vnode.type !== "script" && vnode.type !== "link") {
      props[DATA_KEY_ATTR] = vnode.key;
    }
    if (props[LOADING_ATTR]) {
      // Avoid automatic signals unwrapping
      props[LOADING_ATTR] = {
        value: props[LOADING_ATTR]
      };
    }
    if (typeof props[CLIENT_NAV_ATTR] === "boolean") {
      props[CLIENT_NAV_ATTR] = props[CLIENT_NAV_ATTR] ? "true" : "false";
    }
    if (typeof props.href === "string") {
      props.href = withBase(props.href, current?.basePath);
    }
    if (typeof props.src === "string") {
      props.src = withBase(props.src, current?.basePath);
    }
    srcsetRewrite: if (typeof props.srcset === "string") {
      // Bail out on complex syntax that's too complicated for now
      if (props.srcset.includes("(")) break srcsetRewrite;
      const parts = props.srcset.split(",");
      const out = [];
      for (const part of parts){
        const trimmed = part.trimStart();
        if (trimmed === "") break srcsetRewrite;
        let urlEnd = trimmed.indexOf(" ");
        if (urlEnd === -1) urlEnd = trimmed.length;
        const leadingWhitespace = part.length - trimmed.length;
        const leading = part.substring(0, leadingWhitespace);
        const url = trimmed.substring(0, urlEnd);
        const trailing = trimmed.substring(urlEnd);
        if (url.startsWith("/") && current?.basePath) {
          const joinedPath = join("/", current.basePath, url).replaceAll(SEPARATOR, "/");
          out.push(leading + joinedPath + trailing);
        } else {
          out.push(part);
        }
      }
      props.srcset = out.join(",");
    }
  } else if (current && typeof vnode.type === "function" && vnode.type !== Fragment && ownerStack.length > 0) {
    current.owners.set(vnode, ownerStack[ownerStack.length - 1]);
  }
  if (oldVNodeHook) oldVNodeHook(vnode);
};
options.__b = (vnode)=>{
  // Add CSP nonce to inline script tags
  if (typeof vnode.type === "string" && vnode.type === "script") {
    if (!vnode.props.nonce) {
      vnode.props.nonce = current.getNonce();
    }
  }
  if (current && current.renderingUserTemplate) {
    // Internally rendering happens in two phases. This is done so
    // that the `<Head>` component works. When we do the first render
    // we cache all attributes on `<html>`, `<head>` + its children, and
    // `<body>`. When doing so, we'll replace the tags with a Fragment node
    // so that they don't end up in the rendered HTML. Effectively this
    // means we'll only serialize the contents of `<body>`.
    //
    // After that render is finished we know all additional
    // meta tags that were inserted via `<Head>` and all islands that
    // we can add as preloads. Then we do a second render of the outer
    // HTML tags with the updated value and merge in the HTML generate by
    // the first render into `<body>` directly.
    if (typeof vnode.type === "string") {
      if (vnode.type === "html") {
        current.renderedHtmlTag = true;
        current.docHtml = excludeChildren(vnode.props);
        vnode.type = Fragment;
      } else if (vnode.type === "head") {
        current.docHead = excludeChildren(vnode.props);
        current.headChildren = true;
        vnode.type = Fragment;
        vnode.props = {
          __freshHead: true,
          children: vnode.props.children
        };
      } else if (vnode.type === "body") {
        current.docBody = excludeChildren(vnode.props);
        vnode.type = Fragment;
      } else if (current.headChildren) {
        if (vnode.type === "title") {
          current.docTitle = h("title", vnode.props);
          vnode.props = {
            children: null
          };
        } else {
          current.docHeadNodes.push({
            type: vnode.type,
            props: vnode.props
          });
        }
        vnode.type = Fragment;
        vnode.props = {
          children: null
        };
      } else if (LOADING_ATTR in vnode.props) {
        current.islandProps.push({
          [LOADING_ATTR]: vnode.props[LOADING_ATTR]
        });
        vnode.props[LOADING_ATTR] = current.islandProps.length - 1;
      } else if (vnode.type === "a") {
        setActiveUrl(vnode, current.url.pathname);
      }
    } else if (typeof vnode.type === "function") {
      // Detect island vnodes and wrap them with a marker
      const island = islandByComponent.get(vnode.type);
      patchIsland: if (vnode.type !== Fragment && island && !patched.has(vnode)) {
        current.islandDepth++;
        // Check if an island is rendered inside another island, not just
        // passed as a child.In that case we treat it like a normal
        // Component. Example:
        //   function Island() {
        //     return <OtherIsland />
        //   }
        if (hasIslandOwner(current, vnode)) {
          break patchIsland;
        }
        // At this point we know that we need to patch the island. Mark the
        // island in that we have already patched it.
        const originalType = vnode.type;
        patched.add(vnode);
        vnode.type = (props)=>{
          if (!current) return null;
          const { encounteredIslands, islandProps, slots } = current;
          encounteredIslands.add(island);
          // Only passing children JSX to islands is supported for now
          const id = islandProps.length;
          if ("children" in props) {
            let children = props.children;
            // Guard against passing objects as children to JSX
            if (typeof children === "function" || children !== null && typeof children === "object" && !Array.isArray(children) && !isValidElement(children)) {
              const name = originalType.displayName || originalType.name || "Anonymous";
              throw new Error(`Invalid JSX child passed to island <${name} />. To resolve this error, pass the data as a standard prop instead.`);
            }
            const markerText = `frsh-slot-${island.id}:${id}:children`;
            // @ts-ignore nonono
            props.children = wrapWithMarker(children, markerText);
            slots.set(markerText, children);
            children = props.children;
            // deno-lint-ignore no-explicit-any
            props.children = h(SlotTracker, {
              id: markerText
            }, children);
          }
          const child = h(originalType, props);
          patched.add(child);
          islandProps.push(props);
          return wrapWithMarker(child, `frsh-${island.id}:${islandProps.length - 1}:${vnode.key ?? ""}`);
        };
      // deno-lint-ignore no-explicit-any
      } else if (vnode.type === Partial) {
        current.partialCount++;
        current.partialDepth++;
        if (hasIslandOwner(current, vnode)) {
          throw new Error(`<Partial> components cannot be used inside islands.`);
        }
        const name = vnode.props.name;
        if (current.encounteredPartials.has(name)) {
          current.error = new Error(`Duplicate partial name "${name}" found. The partial name prop is expected to be unique among partial components.`);
        }
        current.encounteredPartials.add(name);
        const mode = encodePartialMode(// deno-lint-ignore no-explicit-any
        vnode.props.mode ?? "replace");
        vnode.props.children = wrapWithMarker(vnode.props.children, `frsh-partial:${name}:${mode}:${vnode.key ?? ""}`);
      } else if (vnode.key && (current.islandDepth > 0 || current.partialDepth > 0)) {
        const child = h(vnode.type, vnode.props);
        vnode.type = Fragment;
        vnode.props = {
          children: wrapWithMarker(child, `frsh-key:${vnode.key}`)
        };
      }
    }
  }
  oldDiff?.(vnode);
};
options.__r = (vnode)=>{
  if (typeof vnode.type === "function" && vnode.type !== Fragment) {
    ownerStack.push(vnode);
  }
  oldRender?.(vnode);
};
options.diffed = (vnode)=>{
  if (typeof vnode.type === "function") {
    if (vnode.type !== Fragment) {
      if (current) {
        if (islandByComponent.has(vnode.type)) {
          current.islandDepth--;
        } else if (vnode.type === Partial) {
          current.partialDepth--;
        }
      }
      ownerStack.pop();
    } else if (vnode.props.__freshHead) {
      if (current) {
        current.headChildren = false;
      }
    }
  }
  oldDiffed?.(vnode);
};
options.__h = (component, idx, type)=>{
  // deno-lint-ignore no-explicit-any
  const vnode = component.__v;
  // Warn when using stateful hooks outside of islands
  if (// Only error for stateful hooks for now.
  (type === HookType.useState || type === HookType.useReducer) && current && !islandByComponent.has(vnode.type) && !hasIslandOwner(current, vnode) && !current.error) {
    const name = HookType[type];
    const message = `Hook "${name}" cannot be used outside of an island component.`;
    const hint = type === HookType.useState ? `\n\nInstead, use the "useSignal" hook to share state across islands.` : "";
    // Don't throw here because that messes up internal Preact state
    current.error = new Error(message + hint);
  }
  oldHook?.(component, idx, type);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9yZW5kZXJpbmcvcHJlYWN0X2hvb2tzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENvbXBvbmVudCxcbiAgdHlwZSBDb21wb25lbnRDaGlsZHJlbixcbiAgQ29tcG9uZW50VHlwZSxcbiAgRnJhZ21lbnQsXG4gIGgsXG4gIGlzVmFsaWRFbGVtZW50LFxuICB0eXBlIE9wdGlvbnMgYXMgUHJlYWN0T3B0aW9ucyxcbiAgb3B0aW9ucyBhcyBwcmVhY3RPcHRpb25zLFxuICB0eXBlIFZOb2RlLFxufSBmcm9tIFwicHJlYWN0XCI7XG5pbXBvcnQgeyBhc3NldEhhc2hpbmdIb29rIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWUvdXRpbHMudHNcIjtcbmltcG9ydCB7IFBhcnRpYWwsIFBhcnRpYWxQcm9wcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lL1BhcnRpYWwudHN4XCI7XG5pbXBvcnQgeyBqb2luLCByZW5kZXJUb1N0cmluZywgU0VQQVJBVE9SIH0gZnJvbSBcIi4uL2RlcHMudHNcIjtcbmltcG9ydCB7IFJlbmRlclN0YXRlIH0gZnJvbSBcIi4vc3RhdGUudHNcIjtcbmltcG9ydCB7IElzbGFuZCB9IGZyb20gXCIuLi90eXBlcy50c1wiO1xuaW1wb3J0IHtcbiAgQ0xJRU5UX05BVl9BVFRSLFxuICBEQVRBX0tFWV9BVFRSLFxuICBMT0FESU5HX0FUVFIsXG4gIFBhcnRpYWxNb2RlLFxufSBmcm9tIFwiLi4vLi4vY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyBzZXRBY3RpdmVVcmwgfSBmcm9tIFwiLi4vLi4vcnVudGltZS9hY3RpdmVfdXJsLnRzXCI7XG5pbXBvcnQgeyB3aXRoQmFzZSB9IGZyb20gXCIuLi9yb3V0ZXIudHNcIjtcblxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vcHJlYWN0anMvcHJlYWN0L2Jsb2IvNzc0OGRjYjgzY2VkZDAyZTM3YjM3MTM2MzRlMzViOTdiMjYwMjhmZC9zcmMvaW50ZXJuYWwuZC50cyNMM0MxLUwxNlxuZW51bSBIb29rVHlwZSB7XG4gIHVzZVN0YXRlID0gMSxcbiAgdXNlUmVkdWNlciA9IDIsXG4gIHVzZUVmZmVjdCA9IDMsXG4gIHVzZUxheW91dEVmZmVjdCA9IDQsXG4gIHVzZVJlZiA9IDUsXG4gIHVzZUltcGVyYXRpdmVIYW5kbGUgPSA2LFxuICB1c2VNZW1vID0gNyxcbiAgdXNlQ2FsbGJhY2sgPSA4LFxuICB1c2VDb250ZXh0ID0gOSxcbiAgdXNlRXJyb3JCb3VuZGFyeSA9IDEwLFxuICAvLyBOb3QgYSByZWFsIGhvb2ssIGJ1dCB0aGUgZGV2dG9vbHMgdHJlYXQgaXMgYXMgc3VjaFxuICB1c2VEZWJ1Z3ZhbHVlID0gMTEsXG59XG5cbi8vIFRoZXNlIGhvb2tzIGFyZSBsb25nIHN0YWJsZSwgYnV0IHdoZW4gd2Ugb3JpZ2luYWxseSBhZGRlZCB0aGVtIHdlXG4vLyB3ZXJlbid0IHN1cmUgaWYgdGhleSBzaG91bGQgYmUgcHVibGljLlxuaW50ZXJmYWNlIEFkdmFuY2VkUHJlYWN0T3B0aW9ucyBleHRlbmRzIFByZWFjdE9wdGlvbnMge1xuICAvKiogQXR0YWNoIGEgaG9vayB0aGF0IGlzIGludm9rZWQgYWZ0ZXIgYSB0cmVlIHdhcyBtb3VudGVkIG9yIHdhcyB1cGRhdGVkLiAqL1xuICBfX2M/KHZub2RlOiBWTm9kZSwgY29tbWl0UXVldWU6IENvbXBvbmVudFtdKTogdm9pZDtcbiAgLyoqIEF0dGFjaCBhIGhvb2sgdGhhdCBpcyBpbnZva2VkIGJlZm9yZSBhIHZub2RlIGhhcyByZW5kZXJlZC4gKi9cbiAgX19yPyh2bm9kZTogVk5vZGUpOiB2b2lkO1xuICBlcnJvckJvdW5kYXJpZXM/OiBib29sZWFuO1xuICAvKiogYmVmb3JlIGRpZmYgaG9vayAqL1xuICBfX2I/KHZub2RlOiBWTm9kZSk6IHZvaWQ7XG4gIC8qKiBBdHRhY2ggYSBob29rIHRoYXQgaXMgaW52b2tlZCBiZWZvcmUgYSBob29rJ3Mgc3RhdGUgaXMgcXVlcmllZC4gKi9cbiAgX19oPyhjb21wb25lbnQ6IENvbXBvbmVudCwgaW5kZXg6IG51bWJlciwgdHlwZTogSG9va1R5cGUpOiB2b2lkO1xufVxuY29uc3Qgb3B0aW9ucyA9IHByZWFjdE9wdGlvbnMgYXMgQWR2YW5jZWRQcmVhY3RPcHRpb25zO1xuXG4vLyBFbmFibGUgZXJyb3IgYm91bmRhcmllcyBpbiBQcmVhY3QuXG5vcHRpb25zLmVycm9yQm91bmRhcmllcyA9IHRydWU7XG5cbi8vIFNldCB1cCBhIHByZWFjdCBvcHRpb24gaG9vayB0byB0cmFjayB3aGVuIHZub2RlIHdpdGggY3VzdG9tIGZ1bmN0aW9ucyBhcmVcbi8vIGNyZWF0ZWQuXG5sZXQgY3VycmVudDogUmVuZGVyU3RhdGUgfCBudWxsID0gbnVsbDtcbi8vIEtlZXAgdHJhY2sgb2Ygd2hpY2ggY29tcG9uZW50IHJlbmRlcmVkIHdoaWNoIHZub2RlLiBUaGlzIGFsbG93cyB1c1xuLy8gdG8gZGV0ZWN0IHdoZW4gYW4gaXNsYW5kIGlzIHJlbmRlcmVkIHdpdGhpbiBhbm90aGVyIGluc3RlYWQgb2YgYmVpbmdcbi8vIHBhc3NlZCBhcyBjaGlsZHJlbi5cbmxldCBvd25lclN0YWNrOiBWTm9kZVtdID0gW107XG4vLyBLZWVwIHRyYWNrIG9mIGFsbCBhdmFpbGFibGUgaXNsYW5kc1xuY29uc3QgaXNsYW5kQnlDb21wb25lbnQgPSBuZXcgTWFwPENvbXBvbmVudFR5cGUsIElzbGFuZD4oKTtcbmV4cG9ydCBmdW5jdGlvbiBzZXRBbGxJc2xhbmRzKGlzbGFuZHM6IElzbGFuZFtdKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaXNsYW5kcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGlzbGFuZCA9IGlzbGFuZHNbaV07XG4gICAgaXNsYW5kQnlDb21wb25lbnQuc2V0KGlzbGFuZC5jb21wb25lbnQsIGlzbGFuZCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFJlbmRlclN0YXRlKHN0YXRlOiBSZW5kZXJTdGF0ZSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGN1cnJlbnQpIGN1cnJlbnQuY2xlYXJUbXBTdGF0ZSgpO1xuICBjdXJyZW50ID0gc3RhdGU7XG4gIG93bmVyU3RhY2sgPSBzdGF0ZT8ub3duZXJTdGFjayA/PyBbXTtcbn1cblxuLy8gQ2hlY2sgaWYgYW4gb2xkZXIgdmVyc2lvbiBvZiBgcHJlYWN0LXJlbmRlci10by1zdHJpbmdgIGlzIHVzZWRcbmNvbnN0IHN1cHBvcnRzVW5zdGFibGVDb21tZW50cyA9IHJlbmRlclRvU3RyaW5nKGgoRnJhZ21lbnQsIHtcbiAgLy8gQHRzLWlnbm9yZSB1bnN0YWJsZSBmZWF0dXJlcyBub3Qgc3VwcG9ydGVkIGluIHR5cGVzXG4gIFVOU1RBQkxFX2NvbW1lbnQ6IFwiZm9vXCIsXG59KSBhcyBWTm9kZSkgIT09IFwiXCI7XG5cbmlmICghc3VwcG9ydHNVbnN0YWJsZUNvbW1lbnRzKSB7XG4gIGNvbnNvbGUud2FybihcbiAgICBcIuKaoO+4jyAgRm91bmQgb2xkIHZlcnNpb24gb2YgJ3ByZWFjdC1yZW5kZXItdG8tc3RyaW5nJy4gUGxlYXNlIHVwZ3JhZGUgaXQgdG8gPj02LjEuMFwiLFxuICApO1xufVxuXG4vKipcbiAqICBXcmFwIGEgbm9kZSB3aXRoIGNvbW1lbnQgbWFya2VycyBpbiB0aGUgSFRNTFxuICovXG5mdW5jdGlvbiB3cmFwV2l0aE1hcmtlcih2bm9kZTogQ29tcG9uZW50Q2hpbGRyZW4sIG1hcmtlclRleHQ6IHN0cmluZykge1xuICAvLyBOZXdlciB2ZXJzaW9ucyBvZiBwcmVhY3QtcmVuZGVyLXRvLXN0cmluZyBhbGxvdyB5b3UgdG8gcmVuZGVyIGNvbW1lbnRzXG4gIGlmIChzdXBwb3J0c1Vuc3RhYmxlQ29tbWVudHMpIHtcbiAgICByZXR1cm4gaChcbiAgICAgIEZyYWdtZW50LFxuICAgICAgbnVsbCxcbiAgICAgIGgoRnJhZ21lbnQsIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSB1bnN0YWJsZSBwcm9wZXJ0eSBpcyBub3QgdHlwZWRcbiAgICAgICAgVU5TVEFCTEVfY29tbWVudDogbWFya2VyVGV4dCxcbiAgICAgIH0pLFxuICAgICAgdm5vZGUsXG4gICAgICBoKEZyYWdtZW50LCB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgdW5zdGFibGUgcHJvcGVydHkgaXMgbm90IHR5cGVkXG4gICAgICAgIFVOU1RBQkxFX2NvbW1lbnQ6IFwiL1wiICsgbWFya2VyVGV4dCxcbiAgICAgIH0pLFxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGgoXG4gICAgICBgIS0tJHttYXJrZXJUZXh0fS0tYCxcbiAgICAgIG51bGwsXG4gICAgICB2bm9kZSxcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogV2hlbmV2ZXIgYSBzbG90ICg9anN4IGNoaWxkcmVuKSBpcyByZW5kZXJlZCwgcmVtb3ZlIHRoaXMgZnJvbSB0aGUgc2xvdFxuICogdHJhY2tpbmcgU2V0LiBBZnRlciBldmVyeXRoaW5nIHdhcyByZW5kZXJlZCB3ZSdsbCBrbm93IHdoaWNoIHNsb3RzXG4gKiB3ZXJlbid0IGFuZCBjYW4gc2VuZCB0aGVtIGRvd24gdG8gdGhlIGNsaWVudFxuICovXG5mdW5jdGlvbiBTbG90VHJhY2tlcihcbiAgcHJvcHM6IHsgaWQ6IHN0cmluZzsgY2hpbGRyZW4/OiBDb21wb25lbnRDaGlsZHJlbiB9LFxuKTogVk5vZGUge1xuICBjdXJyZW50Py5zbG90cy5kZWxldGUocHJvcHMuaWQpO1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICByZXR1cm4gcHJvcHMuY2hpbGRyZW4gYXMgYW55O1xufVxuXG4vKipcbiAqIENvcHkgcHJvcHMgYnV0IGV4Y2x1ZGUgY2hpbGRyZW5cbiAqL1xuZnVuY3Rpb24gZXhjbHVkZUNoaWxkcmVuKHByb3BzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGZvciAoY29uc3QgayBpbiBwcm9wcykge1xuICAgIGlmIChrICE9PSBcImNoaWxkcmVuXCIpIG91dFtrXSA9IHByb3BzW2tdO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGN1cnJlbnQgY29tcG9uZW50IHdhcyByZW5kZXJlZCBpbiBhbiBpc2xhbmRcbiAqL1xuZnVuY3Rpb24gaGFzSXNsYW5kT3duZXIoY3VycmVudDogUmVuZGVyU3RhdGUsIHZub2RlOiBWTm9kZSk6IGJvb2xlYW4ge1xuICBsZXQgdG1wVk5vZGUgPSB2bm9kZTtcbiAgbGV0IG93bmVyO1xuICB3aGlsZSAoKG93bmVyID0gY3VycmVudC5vd25lcnMuZ2V0KHRtcFZOb2RlKSkgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChpc2xhbmRCeUNvbXBvbmVudC5oYXMob3duZXIudHlwZSBhcyBDb21wb25lbnRUeXBlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHRtcFZOb2RlID0gb3duZXI7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGVuY29kZVBhcnRpYWxNb2RlKG1vZGU6IFBhcnRpYWxQcm9wc1tcIm1vZGVcIl0pOiBQYXJ0aWFsTW9kZSB7XG4gIGlmIChtb2RlID09PSBcInJlcGxhY2VcIikgcmV0dXJuIFBhcnRpYWxNb2RlLlJFUExBQ0U7XG4gIGVsc2UgaWYgKG1vZGUgPT09IFwiYXBwZW5kXCIpIHJldHVybiBQYXJ0aWFsTW9kZS5BUFBFTkQ7XG4gIGVsc2UgaWYgKG1vZGUgPT09IFwicHJlcGVuZFwiKSByZXR1cm4gUGFydGlhbE1vZGUuUFJFUEVORDtcbiAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHBhcnRpYWwgbW9kZSBcIiR7bW9kZX1cImApO1xufVxuXG5jb25zdCBwYXRjaGVkID0gbmV3IFdlYWtTZXQ8Vk5vZGU+KCk7XG5cbmNvbnN0IG9sZFZOb2RlSG9vayA9IG9wdGlvbnMudm5vZGU7XG5jb25zdCBvbGREaWZmID0gb3B0aW9ucy5fX2I7XG5jb25zdCBvbGREaWZmZWQgPSBvcHRpb25zLmRpZmZlZDtcbmNvbnN0IG9sZFJlbmRlciA9IG9wdGlvbnMuX19yO1xuY29uc3Qgb2xkSG9vayA9IG9wdGlvbnMuX19oO1xuXG5vcHRpb25zLnZub2RlID0gKHZub2RlKSA9PiB7XG4gIGFzc2V0SGFzaGluZ0hvb2sodm5vZGUpO1xuXG4gIC8vIFdvcmsgYXJvdW5kIGBwcmVhY3QvZGVidWdgIHN0cmluZyBldmVudCBoYW5kbGVyIGVycm9yIHdoaWNoXG4gIC8vIGVycm9ycyB3aGVuIGFuIGV2ZW50IGhhbmRsZXIgZ2V0cyBhIHN0cmluZy4gVGhpcyBtYWtlcyBzZW5zZVxuICAvLyBvbiB0aGUgY2xpZW50IHdoZXJlIHRoaXMgaXMgYSBjb21tb24gdmVjdG9yIGZvciBYU1MuIE9uIHRoZVxuICAvLyBzZXJ2ZXIgd2hlbiB0aGUgc3RyaW5nIHdhcyBub3QgY3JlYXRlZCB0aHJvdWdoIGNvbmNhdGVuYXRpb25cbiAgLy8gaXQgaXMgZmluZS4gSW50ZXJuYWxseSwgYHByZWFjdC9kZWJ1Z2Agb25seSBjaGVja3MgZm9yIHRoZVxuICAvLyBsb3dlcmNhc2UgdmFyaWFudC5cbiAgaWYgKHR5cGVvZiB2bm9kZS50eXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgcHJvcHMgPSB2bm9kZS5wcm9wcyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wcykge1xuICAgICAgY29uc3QgdmFsdWUgPSBwcm9wc1trZXldO1xuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKFwib25cIikgJiYgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGRlbGV0ZSBwcm9wc1trZXldO1xuICAgICAgICBwcm9wc1tcIk9OXCIgKyBrZXkuc2xpY2UoMildID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIERvbid0IGRvIGtleSBwcmVzZXJ2YXRpb24gZm9yIG5vZGVzIGluIDxoZWFkPi5cbiAgICBpZiAoXG4gICAgICB2bm9kZS5rZXkgJiYgdm5vZGUudHlwZSAhPT0gXCJtZXRhXCIgJiYgdm5vZGUudHlwZSAhPT0gXCJ0aXRsZVwiICYmXG4gICAgICB2bm9kZS50eXBlICE9PSBcInN0eWxlXCIgJiYgdm5vZGUudHlwZSAhPT0gXCJzY3JpcHRcIiAmJiB2bm9kZS50eXBlICE9PSBcImxpbmtcIlxuICAgICkge1xuICAgICAgcHJvcHNbREFUQV9LRVlfQVRUUl0gPSB2bm9kZS5rZXk7XG4gICAgfVxuXG4gICAgaWYgKHByb3BzW0xPQURJTkdfQVRUUl0pIHtcbiAgICAgIC8vIEF2b2lkIGF1dG9tYXRpYyBzaWduYWxzIHVud3JhcHBpbmdcbiAgICAgIHByb3BzW0xPQURJTkdfQVRUUl0gPSB7IHZhbHVlOiBwcm9wc1tMT0FESU5HX0FUVFJdIH07XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBwcm9wc1tDTElFTlRfTkFWX0FUVFJdID09PSBcImJvb2xlYW5cIikge1xuICAgICAgcHJvcHNbQ0xJRU5UX05BVl9BVFRSXSA9IHByb3BzW0NMSUVOVF9OQVZfQVRUUl0gPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHByb3BzLmhyZWYgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHByb3BzLmhyZWYgPSB3aXRoQmFzZShwcm9wcy5ocmVmLCBjdXJyZW50Py5iYXNlUGF0aCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBwcm9wcy5zcmMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHByb3BzLnNyYyA9IHdpdGhCYXNlKHByb3BzLnNyYywgY3VycmVudD8uYmFzZVBhdGgpO1xuICAgIH1cblxuICAgIHNyY3NldFJld3JpdGU6XG4gICAgaWYgKHR5cGVvZiBwcm9wcy5zcmNzZXQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIC8vIEJhaWwgb3V0IG9uIGNvbXBsZXggc3ludGF4IHRoYXQncyB0b28gY29tcGxpY2F0ZWQgZm9yIG5vd1xuICAgICAgaWYgKHByb3BzLnNyY3NldC5pbmNsdWRlcyhcIihcIikpIGJyZWFrIHNyY3NldFJld3JpdGU7XG5cbiAgICAgIGNvbnN0IHBhcnRzID0gcHJvcHMuc3Jjc2V0LnNwbGl0KFwiLFwiKTtcbiAgICAgIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuICAgICAgICBjb25zdCB0cmltbWVkID0gcGFydC50cmltU3RhcnQoKTtcbiAgICAgICAgaWYgKHRyaW1tZWQgPT09IFwiXCIpIGJyZWFrIHNyY3NldFJld3JpdGU7XG5cbiAgICAgICAgbGV0IHVybEVuZCA9IHRyaW1tZWQuaW5kZXhPZihcIiBcIik7XG4gICAgICAgIGlmICh1cmxFbmQgPT09IC0xKSB1cmxFbmQgPSB0cmltbWVkLmxlbmd0aDtcblxuICAgICAgICBjb25zdCBsZWFkaW5nV2hpdGVzcGFjZSA9IHBhcnQubGVuZ3RoIC0gdHJpbW1lZC5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGxlYWRpbmcgPSBwYXJ0LnN1YnN0cmluZygwLCBsZWFkaW5nV2hpdGVzcGFjZSk7XG4gICAgICAgIGNvbnN0IHVybCA9IHRyaW1tZWQuc3Vic3RyaW5nKDAsIHVybEVuZCk7XG4gICAgICAgIGNvbnN0IHRyYWlsaW5nID0gdHJpbW1lZC5zdWJzdHJpbmcodXJsRW5kKTtcblxuICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoXCIvXCIpICYmIGN1cnJlbnQ/LmJhc2VQYXRoKSB7XG4gICAgICAgICAgY29uc3Qgam9pbmVkUGF0aCA9IGpvaW4oXCIvXCIsIGN1cnJlbnQuYmFzZVBhdGgsIHVybCkucmVwbGFjZUFsbChcbiAgICAgICAgICAgIFNFUEFSQVRPUixcbiAgICAgICAgICAgIFwiL1wiLFxuICAgICAgICAgICk7XG4gICAgICAgICAgb3V0LnB1c2gobGVhZGluZyArIGpvaW5lZFBhdGggKyB0cmFpbGluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3V0LnB1c2gocGFydCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHByb3BzLnNyY3NldCA9IG91dC5qb2luKFwiLFwiKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoXG4gICAgY3VycmVudCAmJiB0eXBlb2Ygdm5vZGUudHlwZSA9PT0gXCJmdW5jdGlvblwiICYmIHZub2RlLnR5cGUgIT09IEZyYWdtZW50ICYmXG4gICAgb3duZXJTdGFjay5sZW5ndGggPiAwXG4gICkge1xuICAgIGN1cnJlbnQub3duZXJzLnNldCh2bm9kZSwgb3duZXJTdGFja1tvd25lclN0YWNrLmxlbmd0aCAtIDFdKTtcbiAgfVxuXG4gIGlmIChvbGRWTm9kZUhvb2spIG9sZFZOb2RlSG9vayh2bm9kZSk7XG59O1xuXG5vcHRpb25zLl9fYiA9ICh2bm9kZTogVk5vZGU8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+KSA9PiB7XG4gIC8vIEFkZCBDU1Agbm9uY2UgdG8gaW5saW5lIHNjcmlwdCB0YWdzXG4gIGlmICh0eXBlb2Ygdm5vZGUudHlwZSA9PT0gXCJzdHJpbmdcIiAmJiB2bm9kZS50eXBlID09PSBcInNjcmlwdFwiKSB7XG4gICAgaWYgKCF2bm9kZS5wcm9wcy5ub25jZSkge1xuICAgICAgdm5vZGUucHJvcHMubm9uY2UgPSBjdXJyZW50IS5nZXROb25jZSgpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChcbiAgICBjdXJyZW50ICYmIGN1cnJlbnQucmVuZGVyaW5nVXNlclRlbXBsYXRlXG4gICkge1xuICAgIC8vIEludGVybmFsbHkgcmVuZGVyaW5nIGhhcHBlbnMgaW4gdHdvIHBoYXNlcy4gVGhpcyBpcyBkb25lIHNvXG4gICAgLy8gdGhhdCB0aGUgYDxIZWFkPmAgY29tcG9uZW50IHdvcmtzLiBXaGVuIHdlIGRvIHRoZSBmaXJzdCByZW5kZXJcbiAgICAvLyB3ZSBjYWNoZSBhbGwgYXR0cmlidXRlcyBvbiBgPGh0bWw+YCwgYDxoZWFkPmAgKyBpdHMgY2hpbGRyZW4sIGFuZFxuICAgIC8vIGA8Ym9keT5gLiBXaGVuIGRvaW5nIHNvLCB3ZSdsbCByZXBsYWNlIHRoZSB0YWdzIHdpdGggYSBGcmFnbWVudCBub2RlXG4gICAgLy8gc28gdGhhdCB0aGV5IGRvbid0IGVuZCB1cCBpbiB0aGUgcmVuZGVyZWQgSFRNTC4gRWZmZWN0aXZlbHkgdGhpc1xuICAgIC8vIG1lYW5zIHdlJ2xsIG9ubHkgc2VyaWFsaXplIHRoZSBjb250ZW50cyBvZiBgPGJvZHk+YC5cbiAgICAvL1xuICAgIC8vIEFmdGVyIHRoYXQgcmVuZGVyIGlzIGZpbmlzaGVkIHdlIGtub3cgYWxsIGFkZGl0aW9uYWxcbiAgICAvLyBtZXRhIHRhZ3MgdGhhdCB3ZXJlIGluc2VydGVkIHZpYSBgPEhlYWQ+YCBhbmQgYWxsIGlzbGFuZHMgdGhhdFxuICAgIC8vIHdlIGNhbiBhZGQgYXMgcHJlbG9hZHMuIFRoZW4gd2UgZG8gYSBzZWNvbmQgcmVuZGVyIG9mIHRoZSBvdXRlclxuICAgIC8vIEhUTUwgdGFncyB3aXRoIHRoZSB1cGRhdGVkIHZhbHVlIGFuZCBtZXJnZSBpbiB0aGUgSFRNTCBnZW5lcmF0ZSBieVxuICAgIC8vIHRoZSBmaXJzdCByZW5kZXIgaW50byBgPGJvZHk+YCBkaXJlY3RseS5cbiAgICBpZiAoXG4gICAgICB0eXBlb2Ygdm5vZGUudHlwZSA9PT0gXCJzdHJpbmdcIlxuICAgICkge1xuICAgICAgaWYgKHZub2RlLnR5cGUgPT09IFwiaHRtbFwiKSB7XG4gICAgICAgIGN1cnJlbnQucmVuZGVyZWRIdG1sVGFnID0gdHJ1ZTtcbiAgICAgICAgY3VycmVudC5kb2NIdG1sID0gZXhjbHVkZUNoaWxkcmVuKHZub2RlLnByb3BzKTtcbiAgICAgICAgdm5vZGUudHlwZSA9IEZyYWdtZW50O1xuICAgICAgfSBlbHNlIGlmICh2bm9kZS50eXBlID09PSBcImhlYWRcIikge1xuICAgICAgICBjdXJyZW50LmRvY0hlYWQgPSBleGNsdWRlQ2hpbGRyZW4odm5vZGUucHJvcHMpO1xuICAgICAgICBjdXJyZW50LmhlYWRDaGlsZHJlbiA9IHRydWU7XG4gICAgICAgIHZub2RlLnR5cGUgPSBGcmFnbWVudDtcbiAgICAgICAgdm5vZGUucHJvcHMgPSB7XG4gICAgICAgICAgX19mcmVzaEhlYWQ6IHRydWUsXG4gICAgICAgICAgY2hpbGRyZW46IHZub2RlLnByb3BzLmNoaWxkcmVuLFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIGlmICh2bm9kZS50eXBlID09PSBcImJvZHlcIikge1xuICAgICAgICBjdXJyZW50LmRvY0JvZHkgPSBleGNsdWRlQ2hpbGRyZW4odm5vZGUucHJvcHMpO1xuICAgICAgICB2bm9kZS50eXBlID0gRnJhZ21lbnQ7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnQuaGVhZENoaWxkcmVuKSB7XG4gICAgICAgIGlmICh2bm9kZS50eXBlID09PSBcInRpdGxlXCIpIHtcbiAgICAgICAgICBjdXJyZW50LmRvY1RpdGxlID0gaChcInRpdGxlXCIsIHZub2RlLnByb3BzKTtcbiAgICAgICAgICB2bm9kZS5wcm9wcyA9IHsgY2hpbGRyZW46IG51bGwgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdXJyZW50LmRvY0hlYWROb2Rlcy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6IHZub2RlLnR5cGUsXG4gICAgICAgICAgICBwcm9wczogdm5vZGUucHJvcHMsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdm5vZGUudHlwZSA9IEZyYWdtZW50O1xuICAgICAgICB2bm9kZS5wcm9wcyA9IHsgY2hpbGRyZW46IG51bGwgfTtcbiAgICAgIH0gZWxzZSBpZiAoTE9BRElOR19BVFRSIGluIHZub2RlLnByb3BzKSB7XG4gICAgICAgIGN1cnJlbnQuaXNsYW5kUHJvcHMucHVzaCh7XG4gICAgICAgICAgW0xPQURJTkdfQVRUUl06IHZub2RlLnByb3BzW0xPQURJTkdfQVRUUl0sXG4gICAgICAgIH0pO1xuICAgICAgICB2bm9kZS5wcm9wc1tMT0FESU5HX0FUVFJdID0gY3VycmVudC5pc2xhbmRQcm9wcy5sZW5ndGggLSAxO1xuICAgICAgfSBlbHNlIGlmICh2bm9kZS50eXBlID09PSBcImFcIikge1xuICAgICAgICBzZXRBY3RpdmVVcmwodm5vZGUsIGN1cnJlbnQudXJsLnBhdGhuYW1lKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2bm9kZS50eXBlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIC8vIERldGVjdCBpc2xhbmQgdm5vZGVzIGFuZCB3cmFwIHRoZW0gd2l0aCBhIG1hcmtlclxuICAgICAgY29uc3QgaXNsYW5kID0gaXNsYW5kQnlDb21wb25lbnQuZ2V0KHZub2RlLnR5cGUpO1xuICAgICAgcGF0Y2hJc2xhbmQ6XG4gICAgICBpZiAoXG4gICAgICAgIHZub2RlLnR5cGUgIT09IEZyYWdtZW50ICYmXG4gICAgICAgIGlzbGFuZCAmJlxuICAgICAgICAhcGF0Y2hlZC5oYXModm5vZGUpXG4gICAgICApIHtcbiAgICAgICAgY3VycmVudC5pc2xhbmREZXB0aCsrO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIGFuIGlzbGFuZCBpcyByZW5kZXJlZCBpbnNpZGUgYW5vdGhlciBpc2xhbmQsIG5vdCBqdXN0XG4gICAgICAgIC8vIHBhc3NlZCBhcyBhIGNoaWxkLkluIHRoYXQgY2FzZSB3ZSB0cmVhdCBpdCBsaWtlIGEgbm9ybWFsXG4gICAgICAgIC8vIENvbXBvbmVudC4gRXhhbXBsZTpcbiAgICAgICAgLy8gICBmdW5jdGlvbiBJc2xhbmQoKSB7XG4gICAgICAgIC8vICAgICByZXR1cm4gPE90aGVySXNsYW5kIC8+XG4gICAgICAgIC8vICAgfVxuICAgICAgICBpZiAoaGFzSXNsYW5kT3duZXIoY3VycmVudCwgdm5vZGUpKSB7XG4gICAgICAgICAgYnJlYWsgcGF0Y2hJc2xhbmQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIGtub3cgdGhhdCB3ZSBuZWVkIHRvIHBhdGNoIHRoZSBpc2xhbmQuIE1hcmsgdGhlXG4gICAgICAgIC8vIGlzbGFuZCBpbiB0aGF0IHdlIGhhdmUgYWxyZWFkeSBwYXRjaGVkIGl0LlxuICAgICAgICBjb25zdCBvcmlnaW5hbFR5cGUgPSB2bm9kZS50eXBlO1xuICAgICAgICBwYXRjaGVkLmFkZCh2bm9kZSk7XG5cbiAgICAgICAgdm5vZGUudHlwZSA9IChwcm9wcykgPT4ge1xuICAgICAgICAgIGlmICghY3VycmVudCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICBjb25zdCB7IGVuY291bnRlcmVkSXNsYW5kcywgaXNsYW5kUHJvcHMsIHNsb3RzIH0gPSBjdXJyZW50O1xuICAgICAgICAgIGVuY291bnRlcmVkSXNsYW5kcy5hZGQoaXNsYW5kKTtcblxuICAgICAgICAgIC8vIE9ubHkgcGFzc2luZyBjaGlsZHJlbiBKU1ggdG8gaXNsYW5kcyBpcyBzdXBwb3J0ZWQgZm9yIG5vd1xuICAgICAgICAgIGNvbnN0IGlkID0gaXNsYW5kUHJvcHMubGVuZ3RoO1xuICAgICAgICAgIGlmIChcImNoaWxkcmVuXCIgaW4gcHJvcHMpIHtcbiAgICAgICAgICAgIGxldCBjaGlsZHJlbiA9IHByb3BzLmNoaWxkcmVuO1xuXG4gICAgICAgICAgICAvLyBHdWFyZCBhZ2FpbnN0IHBhc3Npbmcgb2JqZWN0cyBhcyBjaGlsZHJlbiB0byBKU1hcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdHlwZW9mIGNoaWxkcmVuID09PSBcImZ1bmN0aW9uXCIgfHwgKFxuICAgICAgICAgICAgICAgIGNoaWxkcmVuICE9PSBudWxsICYmIHR5cGVvZiBjaGlsZHJlbiA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICAgICAgICAgICFBcnJheS5pc0FycmF5KGNoaWxkcmVuKSAmJlxuICAgICAgICAgICAgICAgICFpc1ZhbGlkRWxlbWVudChjaGlsZHJlbilcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBvcmlnaW5hbFR5cGUuZGlzcGxheU5hbWUgfHwgb3JpZ2luYWxUeXBlLm5hbWUgfHxcbiAgICAgICAgICAgICAgICBcIkFub255bW91c1wiO1xuXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBgSW52YWxpZCBKU1ggY2hpbGQgcGFzc2VkIHRvIGlzbGFuZCA8JHtuYW1lfSAvPi4gVG8gcmVzb2x2ZSB0aGlzIGVycm9yLCBwYXNzIHRoZSBkYXRhIGFzIGEgc3RhbmRhcmQgcHJvcCBpbnN0ZWFkLmAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1hcmtlclRleHQgPSBgZnJzaC1zbG90LSR7aXNsYW5kLmlkfToke2lkfTpjaGlsZHJlbmA7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIG5vbm9ub1xuICAgICAgICAgICAgcHJvcHMuY2hpbGRyZW4gPSB3cmFwV2l0aE1hcmtlcihcbiAgICAgICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgICAgICAgIG1hcmtlclRleHQsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgc2xvdHMuc2V0KG1hcmtlclRleHQsIGNoaWxkcmVuKTtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gcHJvcHMuY2hpbGRyZW47XG4gICAgICAgICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgICAgICAgKHByb3BzIGFzIGFueSkuY2hpbGRyZW4gPSBoKFxuICAgICAgICAgICAgICBTbG90VHJhY2tlcixcbiAgICAgICAgICAgICAgeyBpZDogbWFya2VyVGV4dCB9LFxuICAgICAgICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgY2hpbGQgPSBoKG9yaWdpbmFsVHlwZSwgcHJvcHMpIGFzIFZOb2RlO1xuICAgICAgICAgIHBhdGNoZWQuYWRkKGNoaWxkKTtcbiAgICAgICAgICBpc2xhbmRQcm9wcy5wdXNoKHByb3BzKTtcblxuICAgICAgICAgIHJldHVybiB3cmFwV2l0aE1hcmtlcihcbiAgICAgICAgICAgIGNoaWxkLFxuICAgICAgICAgICAgYGZyc2gtJHtpc2xhbmQuaWR9OiR7aXNsYW5kUHJvcHMubGVuZ3RoIC0gMX06JHt2bm9kZS5rZXkgPz8gXCJcIn1gLFxuICAgICAgICAgICk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICB9IGVsc2UgaWYgKHZub2RlLnR5cGUgPT09IChQYXJ0aWFsIGFzIGFueSkpIHtcbiAgICAgICAgY3VycmVudC5wYXJ0aWFsQ291bnQrKztcbiAgICAgICAgY3VycmVudC5wYXJ0aWFsRGVwdGgrKztcbiAgICAgICAgaWYgKGhhc0lzbGFuZE93bmVyKGN1cnJlbnQsIHZub2RlKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGA8UGFydGlhbD4gY29tcG9uZW50cyBjYW5ub3QgYmUgdXNlZCBpbnNpZGUgaXNsYW5kcy5gLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmFtZSA9IHZub2RlLnByb3BzLm5hbWUgYXMgc3RyaW5nO1xuICAgICAgICBpZiAoY3VycmVudC5lbmNvdW50ZXJlZFBhcnRpYWxzLmhhcyhuYW1lKSkge1xuICAgICAgICAgIGN1cnJlbnQuZXJyb3IgPSBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgRHVwbGljYXRlIHBhcnRpYWwgbmFtZSBcIiR7bmFtZX1cIiBmb3VuZC4gVGhlIHBhcnRpYWwgbmFtZSBwcm9wIGlzIGV4cGVjdGVkIHRvIGJlIHVuaXF1ZSBhbW9uZyBwYXJ0aWFsIGNvbXBvbmVudHMuYCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnQuZW5jb3VudGVyZWRQYXJ0aWFscy5hZGQobmFtZSk7XG5cbiAgICAgICAgY29uc3QgbW9kZSA9IGVuY29kZVBhcnRpYWxNb2RlKFxuICAgICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgICAgKHZub2RlLnByb3BzIGFzIGFueSkubW9kZSA/PyBcInJlcGxhY2VcIixcbiAgICAgICAgKTtcbiAgICAgICAgdm5vZGUucHJvcHMuY2hpbGRyZW4gPSB3cmFwV2l0aE1hcmtlcihcbiAgICAgICAgICB2bm9kZS5wcm9wcy5jaGlsZHJlbixcbiAgICAgICAgICBgZnJzaC1wYXJ0aWFsOiR7bmFtZX06JHttb2RlfToke3Zub2RlLmtleSA/PyBcIlwifWAsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICB2bm9kZS5rZXkgJiYgKGN1cnJlbnQuaXNsYW5kRGVwdGggPiAwIHx8IGN1cnJlbnQucGFydGlhbERlcHRoID4gMClcbiAgICAgICkge1xuICAgICAgICBjb25zdCBjaGlsZCA9IGgodm5vZGUudHlwZSwgdm5vZGUucHJvcHMpO1xuICAgICAgICB2bm9kZS50eXBlID0gRnJhZ21lbnQ7XG4gICAgICAgIHZub2RlLnByb3BzID0ge1xuICAgICAgICAgIGNoaWxkcmVuOiB3cmFwV2l0aE1hcmtlcihjaGlsZCwgYGZyc2gta2V5OiR7dm5vZGUua2V5fWApLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBvbGREaWZmPy4odm5vZGUpO1xufTtcbm9wdGlvbnMuX19yID0gKHZub2RlKSA9PiB7XG4gIGlmIChcbiAgICB0eXBlb2Ygdm5vZGUudHlwZSA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgdm5vZGUudHlwZSAhPT0gRnJhZ21lbnRcbiAgKSB7XG4gICAgb3duZXJTdGFjay5wdXNoKHZub2RlKTtcbiAgfVxuICBvbGRSZW5kZXI/Lih2bm9kZSk7XG59O1xub3B0aW9ucy5kaWZmZWQgPSAodm5vZGU6IFZOb2RlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PikgPT4ge1xuICBpZiAodHlwZW9mIHZub2RlLnR5cGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGlmICh2bm9kZS50eXBlICE9PSBGcmFnbWVudCkge1xuICAgICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgICAgaWYgKGlzbGFuZEJ5Q29tcG9uZW50Lmhhcyh2bm9kZS50eXBlKSkge1xuICAgICAgICAgIGN1cnJlbnQuaXNsYW5kRGVwdGgtLTtcbiAgICAgICAgfSBlbHNlIGlmICh2bm9kZS50eXBlID09PSBQYXJ0aWFsIGFzIENvbXBvbmVudFR5cGUpIHtcbiAgICAgICAgICBjdXJyZW50LnBhcnRpYWxEZXB0aC0tO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG93bmVyU3RhY2sucG9wKCk7XG4gICAgfSBlbHNlIGlmICh2bm9kZS5wcm9wcy5fX2ZyZXNoSGVhZCkge1xuICAgICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgICAgY3VycmVudC5oZWFkQ2hpbGRyZW4gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgb2xkRGlmZmVkPy4odm5vZGUpO1xufTtcblxub3B0aW9ucy5fX2ggPSAoY29tcG9uZW50LCBpZHgsIHR5cGUpID0+IHtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3Qgdm5vZGUgPSAoY29tcG9uZW50IGFzIGFueSkuX192O1xuICAvLyBXYXJuIHdoZW4gdXNpbmcgc3RhdGVmdWwgaG9va3Mgb3V0c2lkZSBvZiBpc2xhbmRzXG4gIGlmIChcbiAgICAvLyBPbmx5IGVycm9yIGZvciBzdGF0ZWZ1bCBob29rcyBmb3Igbm93LlxuICAgICh0eXBlID09PSBIb29rVHlwZS51c2VTdGF0ZSB8fCB0eXBlID09PSBIb29rVHlwZS51c2VSZWR1Y2VyKSAmJiBjdXJyZW50ICYmXG4gICAgIWlzbGFuZEJ5Q29tcG9uZW50Lmhhcyh2bm9kZS50eXBlKSAmJiAhaGFzSXNsYW5kT3duZXIoY3VycmVudCwgdm5vZGUpICYmXG4gICAgIWN1cnJlbnQuZXJyb3JcbiAgKSB7XG4gICAgY29uc3QgbmFtZSA9IEhvb2tUeXBlW3R5cGVdO1xuICAgIGNvbnN0IG1lc3NhZ2UgPVxuICAgICAgYEhvb2sgXCIke25hbWV9XCIgY2Fubm90IGJlIHVzZWQgb3V0c2lkZSBvZiBhbiBpc2xhbmQgY29tcG9uZW50LmA7XG4gICAgY29uc3QgaGludCA9IHR5cGUgPT09IEhvb2tUeXBlLnVzZVN0YXRlXG4gICAgICA/IGBcXG5cXG5JbnN0ZWFkLCB1c2UgdGhlIFwidXNlU2lnbmFsXCIgaG9vayB0byBzaGFyZSBzdGF0ZSBhY3Jvc3MgaXNsYW5kcy5gXG4gICAgICA6IFwiXCI7XG5cbiAgICAvLyBEb24ndCB0aHJvdyBoZXJlIGJlY2F1c2UgdGhhdCBtZXNzZXMgdXAgaW50ZXJuYWwgUHJlYWN0IHN0YXRlXG4gICAgY3VycmVudC5lcnJvciA9IG5ldyBFcnJvcihtZXNzYWdlICsgaGludCk7XG4gIH1cbiAgb2xkSG9vaz8uKGNvbXBvbmVudCwgaWR4LCB0eXBlKTtcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FJRSxRQUFRLEVBQ1IsQ0FBQyxFQUNELGNBQWMsRUFFZCxXQUFXLGFBQWEsUUFFbkIsU0FBUztBQUNoQixTQUFTLGdCQUFnQixRQUFRLHlCQUF5QjtBQUMxRCxTQUFTLE9BQU8sUUFBc0IsNEJBQTRCO0FBQ2xFLFNBQVMsSUFBSSxFQUFFLGNBQWMsRUFBRSxTQUFTLFFBQVEsYUFBYTtBQUc3RCxTQUNFLGVBQWUsRUFDZixhQUFhLEVBQ2IsWUFBWSxFQUNaLFdBQVcsUUFDTixxQkFBcUI7QUFDNUIsU0FBUyxZQUFZLFFBQVEsOEJBQThCO0FBQzNELFNBQVMsUUFBUSxRQUFRLGVBQWU7O0FBRXhDLG1IQUFtSDtVQUM5Rzs7Ozs7Ozs7Ozs7RUFXSCxxREFBcUQ7O0dBWGxELGFBQUE7QUE0QkwsTUFBTSxVQUFVO0FBRWhCLHFDQUFxQztBQUNyQyxRQUFRLGVBQWUsR0FBRztBQUUxQiw0RUFBNEU7QUFDNUUsV0FBVztBQUNYLElBQUksVUFBOEI7QUFDbEMscUVBQXFFO0FBQ3JFLHVFQUF1RTtBQUN2RSxzQkFBc0I7QUFDdEIsSUFBSSxhQUFzQixFQUFFO0FBQzVCLHNDQUFzQztBQUN0QyxNQUFNLG9CQUFvQixJQUFJO0FBQzlCLE9BQU8sU0FBUyxjQUFjLE9BQWlCO0VBQzdDLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxRQUFRLE1BQU0sRUFBRSxJQUFLO0lBQ3ZDLE1BQU0s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
// denoCacheMetadata=10327639070577087101,16093272666659675591