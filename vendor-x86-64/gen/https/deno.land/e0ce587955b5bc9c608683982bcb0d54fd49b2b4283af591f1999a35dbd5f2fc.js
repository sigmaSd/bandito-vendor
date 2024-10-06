import { bundleAssetUrl } from "../constants.ts";
import { htmlEscapeJsonString } from "../htmlescape.ts";
import { serialize } from "../serializer.ts";
import { nonce } from "../../runtime/csp.ts";
import { h } from "preact";
export function renderFreshTags(renderState, opts) {
  const { isPartial } = renderState;
  if (opts.csp) {
    opts.csp.directives.scriptSrc = [
      ...opts.csp.directives.scriptSrc ?? [],
      nonce(renderState.getNonce())
    ];
  }
  const moduleScripts = [];
  for (const url of opts.imports){
    moduleScripts.push([
      url,
      renderState.getNonce()
    ]);
  }
  const preloadSet = new Set();
  function addImport(path) {
    const url = opts.basePath + bundleAssetUrl(`/${path}`);
    if (!isPartial) {
      preloadSet.add(url);
      for (const depPath of opts.dependenciesFn(path)){
        const url = bundleAssetUrl(`/${depPath}`);
        preloadSet.add(url);
      }
    }
    return url;
  }
  const state = [
    renderState.islandProps,
    []
  ];
  const styleTags = [];
  const linkTags = [];
  const pluginScripts = [];
  for (const [plugin, res] of opts.pluginRenderResults){
    for (const hydrate of res.scripts ?? []){
      const i = state[1].push(hydrate.state) - 1;
      pluginScripts.push([
        plugin.name,
        hydrate.entrypoint,
        i
      ]);
    }
    styleTags.splice(styleTags.length, 0, ...res.styles ?? []);
    linkTags.splice(linkTags.length, 0, ...res.links ?? []);
  }
  // The inline script that will hydrate the page.
  let script = "";
  // Serialize the state into the <script id="__FRSH_STATE-<uuid>"> tag and generate the
  // inline script to deserialize it. This script starts by deserializing the
  // state in the tag. This potentially requires importing @preact/signals.
  let hasSignals = false;
  let requiresDeserializer = false;
  if (state[0].length > 0 || state[1].length > 0) {
    // Careful: This must be unique per render to avoid injected content
    // via `dangerouslySetInnerHTML` being able to overwrite our state.
    const stateId = `__FRSH_STATE_${renderState.renderUuid}`;
    const res = serialize(state);
    const escapedState = htmlEscapeJsonString(res.serialized);
    opts.bodyHtml += `<script id="${stateId}" type="application/json" nonce="${renderState.getNonce()}">${escapedState}</script>`;
    hasSignals = res.hasSignals;
    requiresDeserializer = res.requiresDeserializer;
    if (res.requiresDeserializer) {
      const url = addImport("deserializer.js");
      script += `import { deserialize } from "${url}";`;
    }
    if (res.hasSignals) {
      const url = addImport("signals.js");
      script += `import { signal } from "${url}";`;
    }
    script += `const ST = document.getElementById("${stateId}").textContent;`;
    script += `const STATE = `;
    if (res.requiresDeserializer) {
      if (res.hasSignals) {
        script += `deserialize(ST, signal);`;
      } else {
        script += `deserialize(ST);`;
      }
    } else {
      script += `JSON.parse(ST).v;`;
    }
  }
  // Then it imports all plugin scripts and executes them (with their respective
  // state).
  if (pluginScripts.length > 0) {
    // Use `reportError` if available, otherwise throw in a different event
    // loop tick to avoid halting the current script.
    script += `function runPlugin(fn,args){try{fn(args)}catch(err){setTimeout(() => {throw err})}}`;
  }
  for (const [pluginName, entrypoint, i] of pluginScripts){
    const url = addImport(`plugin-${pluginName}-${entrypoint}.js`);
    script += `import p${i} from "${url}";runPlugin(p${i},STATE[1][${i}]);`;
  }
  const needsMainScript = renderState.encounteredIslands.size > 0 || renderState.partialCount > 0;
  if (needsMainScript) {
    // Load the main.js script
    const url = addImport("main.js");
    script += `import { revive } from "${url}";`;
  }
  // Finally, it loads all island scripts and hydrates the islands using the
  // reviver from the "main" script.
  let islandRegistry = "";
  const islandMapping = {};
  if (renderState.encounteredIslands.size > 0) {
    // Prepare the inline script that loads and revives the islands
    for (const island of renderState.encounteredIslands){
      const url = addImport(`island-${island.name}.js`);
      script += island.exportName === "default" ? `import ${island.name}_${island.exportName} from "${url}";` : `import { ${island.exportName} as ${island.name}_${island.exportName} } from "${url}";`;
      islandRegistry += `${island.id}:${island.name}_${island.exportName},`;
      islandMapping[island.id] = {
        export: island.exportName,
        url
      };
    }
  }
  // Always revive to detect partials
  if (needsMainScript) {
    script += `const propsArr = typeof STATE !== "undefined" ? STATE[0] : [];`;
    script += `revive({${islandRegistry}}, propsArr);`;
  }
  // Append the inline script.
  if (isPartial && Object.keys(islandMapping).length > 0) {
    const escapedData = htmlEscapeJsonString(JSON.stringify({
      islands: islandMapping,
      signals: hasSignals ? addImport("signals.js") : null,
      deserializer: requiresDeserializer ? addImport("deserializer.js") : null
    }));
    const nonce = renderState.csp ? ` nonce="${renderState.getNonce()}"` : "";
    opts.bodyHtml += `<script id="__FRSH_PARTIAL_DATA_${renderState.renderUuid}" type="application/json"${nonce}>${escapedData}</script>`;
  }
  if (script !== "") {
    opts.bodyHtml += `<script type="module" nonce="${renderState.getNonce()}">${script}</script>`;
  }
  if (opts.styles.length > 0) {
    const node = h("style", {
      id: "__FRSH_STYLE",
      dangerouslySetInnerHTML: {
        __html: opts.styles.join("\n")
      }
    });
    renderState.headVNodes.splice(0, 0, node);
  }
  for (const style of styleTags){
    const node = h("style", {
      id: style.id,
      media: style.media,
      dangerouslySetInnerHTML: {
        __html: style.cssText
      }
    });
    renderState.headVNodes.splice(0, 0, node);
  }
  for (const link of linkTags){
    const node = h("link", link);
    renderState.headVNodes.splice(0, 0, node);
  }
  return {
    bodyHtml: opts.bodyHtml,
    preloadSet,
    moduleScripts
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZnJlc2hAMS42Ljgvc3JjL3NlcnZlci9yZW5kZXJpbmcvZnJlc2hfdGFncy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYnVuZGxlQXNzZXRVcmwgfSBmcm9tIFwiLi4vY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyBSZW5kZXJTdGF0ZSB9IGZyb20gXCIuL3N0YXRlLnRzXCI7XG5pbXBvcnQgeyBodG1sRXNjYXBlSnNvblN0cmluZyB9IGZyb20gXCIuLi9odG1sZXNjYXBlLnRzXCI7XG5pbXBvcnQgeyBzZXJpYWxpemUgfSBmcm9tIFwiLi4vc2VyaWFsaXplci50c1wiO1xuaW1wb3J0IHtcbiAgUGx1Z2luLFxuICBQbHVnaW5SZW5kZXJMaW5rLFxuICBQbHVnaW5SZW5kZXJSZXN1bHQsXG4gIFBsdWdpblJlbmRlclN0eWxlVGFnLFxufSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IENvbnRlbnRTZWN1cml0eVBvbGljeSwgbm9uY2UgfSBmcm9tIFwiLi4vLi4vcnVudGltZS9jc3AudHNcIjtcbmltcG9ydCB7IGggfSBmcm9tIFwicHJlYWN0XCI7XG5cbmV4cG9ydCB0eXBlIFNlcmlhbGl6ZWRTdGF0ZSA9IFtpc2xhbmRzOiB1bmtub3duW10sIHBsdWdpbnM6IHVua25vd25bXV07XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJGcmVzaFRhZ3MoXG4gIHJlbmRlclN0YXRlOiBSZW5kZXJTdGF0ZSxcbiAgb3B0czoge1xuICAgIGJvZHlIdG1sOiBzdHJpbmc7XG4gICAgY3NwPzogQ29udGVudFNlY3VyaXR5UG9saWN5O1xuICAgIGltcG9ydHM6IHN0cmluZ1tdO1xuICAgIHJhbmRvbU5vbmNlPzogc3RyaW5nO1xuICAgIGRlcGVuZGVuY2llc0ZuOiAocGF0aDogc3RyaW5nKSA9PiBzdHJpbmdbXTtcbiAgICBzdHlsZXM6IHN0cmluZ1tdO1xuICAgIHBsdWdpblJlbmRlclJlc3VsdHM6IFtQbHVnaW4sIFBsdWdpblJlbmRlclJlc3VsdF1bXTtcbiAgICBiYXNlUGF0aDogc3RyaW5nO1xuICB9LFxuKSB7XG4gIGNvbnN0IHsgaXNQYXJ0aWFsIH0gPSByZW5kZXJTdGF0ZTtcblxuICBpZiAob3B0cy5jc3ApIHtcbiAgICBvcHRzLmNzcC5kaXJlY3RpdmVzLnNjcmlwdFNyYyA9IFtcbiAgICAgIC4uLm9wdHMuY3NwLmRpcmVjdGl2ZXMuc2NyaXB0U3JjID8/IFtdLFxuICAgICAgbm9uY2UocmVuZGVyU3RhdGUuZ2V0Tm9uY2UoKSksXG4gICAgXTtcbiAgfVxuXG4gIGNvbnN0IG1vZHVsZVNjcmlwdHM6IFtzdHJpbmcsIHN0cmluZ11bXSA9IFtdO1xuICBmb3IgKGNvbnN0IHVybCBvZiBvcHRzLmltcG9ydHMpIHtcbiAgICBtb2R1bGVTY3JpcHRzLnB1c2goW3VybCwgcmVuZGVyU3RhdGUuZ2V0Tm9uY2UoKV0pO1xuICB9XG5cbiAgY29uc3QgcHJlbG9hZFNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmdW5jdGlvbiBhZGRJbXBvcnQocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCB1cmwgPSBvcHRzLmJhc2VQYXRoICsgYnVuZGxlQXNzZXRVcmwoYC8ke3BhdGh9YCk7XG4gICAgaWYgKCFpc1BhcnRpYWwpIHtcbiAgICAgIHByZWxvYWRTZXQuYWRkKHVybCk7XG4gICAgICBmb3IgKGNvbnN0IGRlcFBhdGggb2Ygb3B0cy5kZXBlbmRlbmNpZXNGbihwYXRoKSkge1xuICAgICAgICBjb25zdCB1cmwgPSBidW5kbGVBc3NldFVybChgLyR7ZGVwUGF0aH1gKTtcbiAgICAgICAgcHJlbG9hZFNldC5hZGQodXJsKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVybDtcbiAgfVxuXG4gIGNvbnN0IHN0YXRlOiBTZXJpYWxpemVkU3RhdGUgPSBbXG4gICAgcmVuZGVyU3RhdGUuaXNsYW5kUHJvcHMsXG4gICAgW10sXG4gIF07XG4gIGNvbnN0IHN0eWxlVGFnczogUGx1Z2luUmVuZGVyU3R5bGVUYWdbXSA9IFtdO1xuICBjb25zdCBsaW5rVGFnczogUGx1Z2luUmVuZGVyTGlua1tdID0gW107XG4gIGNvbnN0IHBsdWdpblNjcmlwdHM6IFtzdHJpbmcsIHN0cmluZywgbnVtYmVyXVtdID0gW107XG5cbiAgZm9yIChjb25zdCBbcGx1Z2luLCByZXNdIG9mIG9wdHMucGx1Z2luUmVuZGVyUmVzdWx0cykge1xuICAgIGZvciAoY29uc3QgaHlkcmF0ZSBvZiByZXMuc2NyaXB0cyA/PyBbXSkge1xuICAgICAgY29uc3QgaSA9IHN0YXRlWzFdLnB1c2goaHlkcmF0ZS5zdGF0ZSkgLSAxO1xuICAgICAgcGx1Z2luU2NyaXB0cy5wdXNoKFtwbHVnaW4ubmFtZSwgaHlkcmF0ZS5lbnRyeXBvaW50LCBpXSk7XG4gICAgfVxuICAgIHN0eWxlVGFncy5zcGxpY2Uoc3R5bGVUYWdzLmxlbmd0aCwgMCwgLi4ucmVzLnN0eWxlcyA/PyBbXSk7XG4gICAgbGlua1RhZ3Muc3BsaWNlKGxpbmtUYWdzLmxlbmd0aCwgMCwgLi4ucmVzLmxpbmtzID8/IFtdKTtcbiAgfVxuXG4gIC8vIFRoZSBpbmxpbmUgc2NyaXB0IHRoYXQgd2lsbCBoeWRyYXRlIHRoZSBwYWdlLlxuICBsZXQgc2NyaXB0ID0gXCJcIjtcblxuICAvLyBTZXJpYWxpemUgdGhlIHN0YXRlIGludG8gdGhlIDxzY3JpcHQgaWQ9XCJfX0ZSU0hfU1RBVEUtPHV1aWQ+XCI+IHRhZyBhbmQgZ2VuZXJhdGUgdGhlXG4gIC8vIGlubGluZSBzY3JpcHQgdG8gZGVzZXJpYWxpemUgaXQuIFRoaXMgc2NyaXB0IHN0YXJ0cyBieSBkZXNlcmlhbGl6aW5nIHRoZVxuICAvLyBzdGF0ZSBpbiB0aGUgdGFnLiBUaGlzIHBvdGVudGlhbGx5IHJlcXVpcmVzIGltcG9ydGluZyBAcHJlYWN0L3NpZ25hbHMuXG4gIGxldCBoYXNTaWduYWxzID0gZmFsc2U7XG4gIGxldCByZXF1aXJlc0Rlc2VyaWFsaXplciA9IGZhbHNlO1xuICBpZiAoc3RhdGVbMF0ubGVuZ3RoID4gMCB8fCBzdGF0ZVsxXS5sZW5ndGggPiAwKSB7XG4gICAgLy8gQ2FyZWZ1bDogVGhpcyBtdXN0IGJlIHVuaXF1ZSBwZXIgcmVuZGVyIHRvIGF2b2lkIGluamVjdGVkIGNvbnRlbnRcbiAgICAvLyB2aWEgYGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MYCBiZWluZyBhYmxlIHRvIG92ZXJ3cml0ZSBvdXIgc3RhdGUuXG4gICAgY29uc3Qgc3RhdGVJZCA9IGBfX0ZSU0hfU1RBVEVfJHtyZW5kZXJTdGF0ZS5yZW5kZXJVdWlkfWA7XG5cbiAgICBjb25zdCByZXMgPSBzZXJpYWxpemUoc3RhdGUpO1xuICAgIGNvbnN0IGVzY2FwZWRTdGF0ZSA9IGh0bWxFc2NhcGVKc29uU3RyaW5nKHJlcy5zZXJpYWxpemVkKTtcbiAgICBvcHRzLmJvZHlIdG1sICs9XG4gICAgICBgPHNjcmlwdCBpZD1cIiR7c3RhdGVJZH1cIiB0eXBlPVwiYXBwbGljYXRpb24vanNvblwiIG5vbmNlPVwiJHtyZW5kZXJTdGF0ZS5nZXROb25jZSgpfVwiPiR7ZXNjYXBlZFN0YXRlfTwvc2NyaXB0PmA7XG5cbiAgICBoYXNTaWduYWxzID0gcmVzLmhhc1NpZ25hbHM7XG4gICAgcmVxdWlyZXNEZXNlcmlhbGl6ZXIgPSByZXMucmVxdWlyZXNEZXNlcmlhbGl6ZXI7XG5cbiAgICBpZiAocmVzLnJlcXVpcmVzRGVzZXJpYWxpemVyKSB7XG4gICAgICBjb25zdCB1cmwgPSBhZGRJbXBvcnQoXCJkZXNlcmlhbGl6ZXIuanNcIik7XG4gICAgICBzY3JpcHQgKz0gYGltcG9ydCB7IGRlc2VyaWFsaXplIH0gZnJvbSBcIiR7dXJsfVwiO2A7XG4gICAgfVxuICAgIGlmIChyZXMuaGFzU2lnbmFscykge1xuICAgICAgY29uc3QgdXJsID0gYWRkSW1wb3J0KFwic2lnbmFscy5qc1wiKTtcbiAgICAgIHNjcmlwdCArPSBgaW1wb3J0IHsgc2lnbmFsIH0gZnJvbSBcIiR7dXJsfVwiO2A7XG4gICAgfVxuICAgIHNjcmlwdCArPSBgY29uc3QgU1QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIiR7c3RhdGVJZH1cIikudGV4dENvbnRlbnQ7YDtcbiAgICBzY3JpcHQgKz0gYGNvbnN0IFNUQVRFID0gYDtcbiAgICBpZiAocmVzLnJlcXVpcmVzRGVzZXJpYWxpemVyKSB7XG4gICAgICBpZiAocmVzLmhhc1NpZ25hbHMpIHtcbiAgICAgICAgc2NyaXB0ICs9IGBkZXNlcmlhbGl6ZShTVCwgc2lnbmFsKTtgO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NyaXB0ICs9IGBkZXNlcmlhbGl6ZShTVCk7YDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2NyaXB0ICs9IGBKU09OLnBhcnNlKFNUKS52O2A7XG4gICAgfVxuICB9XG5cbiAgLy8gVGhlbiBpdCBpbXBvcnRzIGFsbCBwbHVnaW4gc2NyaXB0cyBhbmQgZXhlY3V0ZXMgdGhlbSAod2l0aCB0aGVpciByZXNwZWN0aXZlXG4gIC8vIHN0YXRlKS5cbiAgaWYgKHBsdWdpblNjcmlwdHMubGVuZ3RoID4gMCkge1xuICAgIC8vIFVzZSBgcmVwb3J0RXJyb3JgIGlmIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIHRocm93IGluIGEgZGlmZmVyZW50IGV2ZW50XG4gICAgLy8gbG9vcCB0aWNrIHRvIGF2b2lkIGhhbHRpbmcgdGhlIGN1cnJlbnQgc2NyaXB0LlxuICAgIHNjcmlwdCArPVxuICAgICAgYGZ1bmN0aW9uIHJ1blBsdWdpbihmbixhcmdzKXt0cnl7Zm4oYXJncyl9Y2F0Y2goZXJyKXtzZXRUaW1lb3V0KCgpID0+IHt0aHJvdyBlcnJ9KX19YDtcbiAgfVxuICBmb3IgKGNvbnN0IFtwbHVnaW5OYW1lLCBlbnRyeXBvaW50LCBpXSBvZiBwbHVnaW5TY3JpcHRzKSB7XG4gICAgY29uc3QgdXJsID0gYWRkSW1wb3J0KGBwbHVnaW4tJHtwbHVnaW5OYW1lfS0ke2VudHJ5cG9pbnR9LmpzYCk7XG4gICAgc2NyaXB0ICs9IGBpbXBvcnQgcCR7aX0gZnJvbSBcIiR7dXJsfVwiO3J1blBsdWdpbihwJHtpfSxTVEFURVsxXVske2l9XSk7YDtcbiAgfVxuXG4gIGNvbnN0IG5lZWRzTWFpblNjcmlwdCA9IHJlbmRlclN0YXRlLmVuY291bnRlcmVkSXNsYW5kcy5zaXplID4gMCB8fFxuICAgIHJlbmRlclN0YXRlLnBhcnRpYWxDb3VudCA+IDA7XG4gIGlmIChuZWVkc01haW5TY3JpcHQpIHtcbiAgICAvLyBMb2FkIHRoZSBtYWluLmpzIHNjcmlwdFxuICAgIGNvbnN0IHVybCA9IGFkZEltcG9ydChcIm1haW4uanNcIik7XG4gICAgc2NyaXB0ICs9IGBpbXBvcnQgeyByZXZpdmUgfSBmcm9tIFwiJHt1cmx9XCI7YDtcbiAgfVxuXG4gIC8vIEZpbmFsbHksIGl0IGxvYWRzIGFsbCBpc2xhbmQgc2NyaXB0cyBhbmQgaHlkcmF0ZXMgdGhlIGlzbGFuZHMgdXNpbmcgdGhlXG4gIC8vIHJldml2ZXIgZnJvbSB0aGUgXCJtYWluXCIgc2NyaXB0LlxuICBsZXQgaXNsYW5kUmVnaXN0cnkgPSBcIlwiO1xuICBjb25zdCBpc2xhbmRNYXBwaW5nOiBSZWNvcmQ8c3RyaW5nLCB7IHVybDogc3RyaW5nOyBleHBvcnQ6IHN0cmluZyB9PiA9IHt9O1xuICBpZiAocmVuZGVyU3RhdGUuZW5jb3VudGVyZWRJc2xhbmRzLnNpemUgPiAwKSB7XG4gICAgLy8gUHJlcGFyZSB0aGUgaW5saW5lIHNjcmlwdCB0aGF0IGxvYWRzIGFuZCByZXZpdmVzIHRoZSBpc2xhbmRzXG4gICAgZm9yIChjb25zdCBpc2xhbmQgb2YgcmVuZGVyU3RhdGUuZW5jb3VudGVyZWRJc2xhbmRzKSB7XG4gICAgICBjb25zdCB1cmwgPSBhZGRJbXBvcnQoYGlzbGFuZC0ke2lzbGFuZC5uYW1lfS5qc2ApO1xuICAgICAgc2NyaXB0ICs9IGlzbGFuZC5leHBvcnROYW1lID09PSBcImRlZmF1bHRcIlxuICAgICAgICA/IGBpbXBvcnQgJHtpc2xhbmQubmFtZX1fJHtpc2xhbmQuZXhwb3J0TmFtZX0gZnJvbSBcIiR7dXJsfVwiO2BcbiAgICAgICAgOiBgaW1wb3J0IHsgJHtpc2xhbmQuZXhwb3J0TmFtZX0gYXMgJHtpc2xhbmQubmFtZX1fJHtpc2xhbmQuZXhwb3J0TmFtZX0gfSBmcm9tIFwiJHt1cmx9XCI7YDtcbiAgICAgIGlzbGFuZFJlZ2lzdHJ5ICs9IGAke2lzbGFuZC5pZH06JHtpc2xhbmQubmFtZX1fJHtpc2xhbmQuZXhwb3J0TmFtZX0sYDtcbiAgICAgIGlzbGFuZE1hcHBpbmdbaXNsYW5kLmlkXSA9IHtcbiAgICAgICAgZXhwb3J0OiBpc2xhbmQuZXhwb3J0TmFtZSxcbiAgICAgICAgdXJsLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvLyBBbHdheXMgcmV2aXZlIHRvIGRldGVjdCBwYXJ0aWFsc1xuICBpZiAobmVlZHNNYWluU2NyaXB0KSB7XG4gICAgc2NyaXB0ICs9IGBjb25zdCBwcm9wc0FyciA9IHR5cGVvZiBTVEFURSAhPT0gXCJ1bmRlZmluZWRcIiA/IFNUQVRFWzBdIDogW107YDtcbiAgICBzY3JpcHQgKz0gYHJldml2ZSh7JHtpc2xhbmRSZWdpc3RyeX19LCBwcm9wc0Fycik7YDtcbiAgfVxuXG4gIC8vIEFwcGVuZCB0aGUgaW5saW5lIHNjcmlwdC5cbiAgaWYgKGlzUGFydGlhbCAmJiBPYmplY3Qua2V5cyhpc2xhbmRNYXBwaW5nKS5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgZXNjYXBlZERhdGEgPSBodG1sRXNjYXBlSnNvblN0cmluZyhcbiAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgaXNsYW5kczogaXNsYW5kTWFwcGluZyxcbiAgICAgICAgc2lnbmFsczogaGFzU2lnbmFscyA/IGFkZEltcG9ydChcInNpZ25hbHMuanNcIikgOiBudWxsLFxuICAgICAgICBkZXNlcmlhbGl6ZXI6IHJlcXVpcmVzRGVzZXJpYWxpemVyXG4gICAgICAgICAgPyBhZGRJbXBvcnQoXCJkZXNlcmlhbGl6ZXIuanNcIilcbiAgICAgICAgICA6IG51bGwsXG4gICAgICB9KSxcbiAgICApO1xuICAgIGNvbnN0IG5vbmNlID0gcmVuZGVyU3RhdGUuY3NwID8gYCBub25jZT1cIiR7cmVuZGVyU3RhdGUuZ2V0Tm9uY2UoKX1cImAgOiBcIlwiO1xuICAgIG9wdHMuYm9keUh0bWwgKz1cbiAgICAgIGA8c2NyaXB0IGlkPVwiX19GUlNIX1BBUlRJQUxfREFUQV8ke3JlbmRlclN0YXRlLnJlbmRlclV1aWR9XCIgdHlwZT1cImFwcGxpY2F0aW9uL2pzb25cIiR7bm9uY2V9PiR7ZXNjYXBlZERhdGF9PC9zY3JpcHQ+YDtcbiAgfVxuICBpZiAoc2NyaXB0ICE9PSBcIlwiKSB7XG4gICAgb3B0cy5ib2R5SHRtbCArPVxuICAgICAgYDxzY3JpcHQgdHlwZT1cIm1vZHVsZVwiIG5vbmNlPVwiJHtyZW5kZXJTdGF0ZS5nZXROb25jZSgpfVwiPiR7c2NyaXB0fTwvc2NyaXB0PmA7XG4gIH1cblxuICBpZiAob3B0cy5zdHlsZXMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IG5vZGUgPSBoKFwic3R5bGVcIiwge1xuICAgICAgaWQ6IFwiX19GUlNIX1NUWUxFXCIsXG4gICAgICBkYW5nZXJvdXNseVNldElubmVySFRNTDogeyBfX2h0bWw6IG9wdHMuc3R5bGVzLmpvaW4oXCJcXG5cIikgfSxcbiAgICB9KTtcblxuICAgIHJlbmRlclN0YXRlLmhlYWRWTm9kZXMuc3BsaWNlKDAsIDAsIG5vZGUpO1xuICB9XG5cbiAgZm9yIChjb25zdCBzdHlsZSBvZiBzdHlsZVRhZ3MpIHtcbiAgICBjb25zdCBub2RlID0gaChcInN0eWxlXCIsIHtcbiAgICAgIGlkOiBzdHlsZS5pZCxcbiAgICAgIG1lZGlhOiBzdHlsZS5tZWRpYSxcbiAgICAgIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MOiB7IF9faHRtbDogc3R5bGUuY3NzVGV4dCB9LFxuICAgIH0pO1xuICAgIHJlbmRlclN0YXRlLmhlYWRWTm9kZXMuc3BsaWNlKDAsIDAsIG5vZGUpO1xuICB9XG5cbiAgZm9yIChjb25zdCBsaW5rIG9mIGxpbmtUYWdzKSB7XG4gICAgY29uc3Qgbm9kZSA9IGgoXCJsaW5rXCIsIGxpbmspO1xuICAgIHJlbmRlclN0YXRlLmhlYWRWTm9kZXMuc3BsaWNlKDAsIDAsIG5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIHsgYm9keUh0bWw6IG9wdHMuYm9keUh0bWwsIHByZWxvYWRTZXQsIG1vZHVsZVNjcmlwdHMgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLGNBQWMsUUFBUSxrQkFBa0I7QUFFakQsU0FBUyxvQkFBb0IsUUFBUSxtQkFBbUI7QUFDeEQsU0FBUyxTQUFTLFFBQVEsbUJBQW1CO0FBTzdDLFNBQWdDLEtBQUssUUFBUSx1QkFBdUI7QUFDcEUsU0FBUyxDQUFDLFFBQVEsU0FBUztBQUkzQixPQUFPLFNBQVMsZ0JBQ2QsV0FBd0IsRUFDeEIsSUFTQztFQUVELE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRztFQUV0QixJQUFJLEtBQUssR0FBRyxFQUFFO0lBQ1osS0FBSyxHQUFHLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRztTQUMzQixLQUFLLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxJQUFJLEVBQUU7TUFDdEMsTUFBTSxZQUFZLFFBQVE7S0FDM0I7RUFDSDtFQUVBLE1BQU0sZ0JBQW9DLEVBQUU7RUFDNUMsS0FBSyxNQUFNLE9BQU8sS0FBSyxPQUFPLENBQUU7SUFDOUIsY0FBYyxJQUFJLENBQUM7TUFBQztNQUFLLFlBQVksUUFBUTtLQUFHO0VBQ2xEO0VBRUEsTUFBTSxhQUFhLElBQUk7RUFDdkIsU0FBUyxVQUFVLElBQVk7SUFDN0IsTUFBTSxNQUFNLEtBQUssUUFBUSxHQUFHLGVBQWUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDO0lBQ3JELElBQUksQ0FBQyxXQUFXO01BQ2QsV0FBVyxHQUFHLENBQUM7TUFDZixLQUFLLE1BQU0sV0FBVyxLQUFLLGNBQWMsQ0FBQyxNQUFPO1FBQy9DLE1BQU0sTUFBTSxlQUFlLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQztRQUN4QyxXQUFXLEdBQUcsQ0FBQztNQUNqQjtJQUNGO0lBQ0EsT0FBTztFQUNUO0VBRUEsTUFBTSxRQUF5QjtJQUM3QixZQUFZ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
// denoCacheMetadata=8806212178855264580,13161436981410089819