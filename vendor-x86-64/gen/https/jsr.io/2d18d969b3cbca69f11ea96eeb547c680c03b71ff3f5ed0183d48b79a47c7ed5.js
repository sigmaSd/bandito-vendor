export async function rootInfo() {
  if (!tmpDir) tmpDir = Deno.makeTempDirSync();
  const opts = {
    args: [
      "info",
      "--json",
      "--no-config",
      "--no-lock"
    ],
    cwd: tmpDir,
    env: {
      DENO_NO_PACKAGE_JSON: "true"
    },
    stdout: "piped",
    stderr: "inherit"
  };
  const output = await new Deno.Command(Deno.execPath(), opts).output();
  if (!output.success) {
    throw new Error(`Failed to call 'deno info'`);
  }
  const txt = new TextDecoder().decode(output.stdout);
  return JSON.parse(txt);
}
let tmpDir;
async function info(specifier, options) {
  const opts = {
    args: [
      "info",
      "--json"
    ],
    cwd: undefined,
    env: {
      DENO_NO_PACKAGE_JSON: "true"
    },
    stdout: "piped",
    stderr: "inherit"
  };
  if (typeof options.config === "string") {
    opts.args.push("--config", options.config);
  } else {
    opts.args.push("--no-config");
  }
  if (options.importMap) {
    opts.args.push("--import-map", options.importMap);
  }
  if (typeof options.lock === "string") {
    opts.args.push("--lock", options.lock);
  } else if (!options.cwd) {
    opts.args.push("--no-lock");
  }
  if (options.nodeModulesDir) {
    opts.args.push("--node-modules-dir");
  }
  if (options.cwd) {
    opts.cwd = options.cwd;
  } else {
    if (!tmpDir) tmpDir = Deno.makeTempDirSync();
    opts.cwd = tmpDir;
  }
  opts.args.push(specifier);
  const output = await new Deno.Command(Deno.execPath(), opts).output();
  if (!output.success) {
    throw new Error(`Failed to call 'deno info' on '${specifier}'`);
  }
  const txt = new TextDecoder().decode(output.stdout);
  return JSON.parse(txt);
}
export class InfoCache {
  #options;
  #pending = null;
  #modules = new Map();
  #redirects = new Map();
  #npmPackages = new Map();
  constructor(options = {}){
    this.#options = options;
  }
  async get(specifier) {
    let entry = this.#getCached(specifier);
    if (entry !== undefined) return entry;
    await this.#queueLoad(specifier);
    entry = this.#getCached(specifier);
    if (entry === undefined) {
      throw new Error(`Unreachable: '${specifier}' loaded but not reachable`);
    }
    return entry;
  }
  getNpmPackage(id) {
    return this.#npmPackages.get(id);
  }
  #resolve(specifier) {
    return this.#redirects.get(specifier) ?? specifier;
  }
  #getCached(specifier) {
    specifier = this.#resolve(specifier);
    return this.#modules.get(specifier);
  }
  async #queueLoad(specifier) {
    while(true){
      if (this.#pending === null) {
        this.#pending = {
          specifiers: new Set([
            specifier
          ]),
          done: (async ()=>{
            await new Promise((r)=>setTimeout(r, 5));
            const specifiers = this.#pending.specifiers;
            this.#pending.specifiers = null;
            await this.#load([
              ...specifiers
            ]);
            this.#pending = null;
          })()
        };
        await this.#pending.done;
        return;
      } else if (this.#pending.specifiers !== null) {
        this.#pending.specifiers.add(specifier);
        await this.#pending.done;
        return;
      } else {
        await this.#pending.done;
      }
    }
  }
  async #load(specifiers) {
    await this.#populate(specifiers);
    for (let specifier of specifiers){
      specifier = this.#resolve(specifier);
      const entry = this.#modules.get(specifier);
      if (entry === undefined && specifier.startsWith("npm:")) {
        // we hit https://github.com/denoland/deno/issues/18043, so we have to
        // perform another load to get the actual data of the redirected specifier
        await this.#populate([
          specifier
        ]);
      }
    }
  }
  async #populate(specifiers) {
    let specifier;
    if (specifiers.length === 1) {
      specifier = specifiers[0];
    } else {
      specifier = `data:application/javascript,${encodeURIComponent(specifiers.map((s)=>`import ${JSON.stringify(s)};`).join(""))}`;
    }
    const { modules, redirects, npmPackages } = await info(specifier, this.#options);
    for (const module of modules){
      if (specifiers.length !== 1 && module.specifier === specifier) continue;
      this.#modules.set(module.specifier, module);
    }
    for (const [from, to] of Object.entries(redirects)){
      this.#redirects.set(from, to);
    }
    for (const [id, npmPackage] of Object.entries(npmPackages)){
      this.#npmPackages.set(id, npmPackage);
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BsdWNhL2VzYnVpbGQtZGVuby1sb2FkZXIvMC4xMC4zL3NyYy9kZW5vLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBpbnRlcmZhY2UgUm9vdEluZm9PdXRwdXQge1xuICBkZW5vRGlyOiBzdHJpbmc7XG4gIG5wbUNhY2hlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByb290SW5mbygpOiBQcm9taXNlPFJvb3RJbmZvT3V0cHV0PiB7XG4gIGlmICghdG1wRGlyKSB0bXBEaXIgPSBEZW5vLm1ha2VUZW1wRGlyU3luYygpO1xuICBjb25zdCBvcHRzID0ge1xuICAgIGFyZ3M6IFtcImluZm9cIiwgXCItLWpzb25cIiwgXCItLW5vLWNvbmZpZ1wiLCBcIi0tbm8tbG9ja1wiXSxcbiAgICBjd2Q6IHRtcERpcixcbiAgICBlbnY6IHsgREVOT19OT19QQUNLQUdFX0pTT046IFwidHJ1ZVwiIH0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbiAgICBzdGRvdXQ6IFwicGlwZWRcIixcbiAgICBzdGRlcnI6IFwiaW5oZXJpdFwiLFxuICB9O1xuXG4gIGNvbnN0IG91dHB1dCA9IGF3YWl0IG5ldyBEZW5vLkNvbW1hbmQoXG4gICAgRGVuby5leGVjUGF0aCgpLFxuICAgIG9wdHMgYXMgRGVuby5Db21tYW5kT3B0aW9ucyxcbiAgKS5vdXRwdXQoKTtcbiAgaWYgKCFvdXRwdXQuc3VjY2Vzcykge1xuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGNhbGwgJ2Rlbm8gaW5mbydgKTtcbiAgfVxuICBjb25zdCB0eHQgPSBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUob3V0cHV0LnN0ZG91dCk7XG4gIHJldHVybiBKU09OLnBhcnNlKHR4dCk7XG59XG5cbi8vIExpZnRlZCBmcm9tIGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9kZW5vbGFuZC9kZW5vX2dyYXBoLzg5YWZmZTQzYzlkM2Q1YzkxNjVjODA4OTY4N2MxMDdkNTNlZDhmZTEvbGliL21lZGlhX3R5cGUudHNcbmV4cG9ydCB0eXBlIE1lZGlhVHlwZSA9XG4gIHwgXCJKYXZhU2NyaXB0XCJcbiAgfCBcIk1qc1wiXG4gIHwgXCJDanNcIlxuICB8IFwiSlNYXCJcbiAgfCBcIlR5cGVTY3JpcHRcIlxuICB8IFwiTXRzXCJcbiAgfCBcIkN0c1wiXG4gIHwgXCJEdHNcIlxuICB8IFwiRG10c1wiXG4gIHwgXCJEY3RzXCJcbiAgfCBcIlRTWFwiXG4gIHwgXCJKc29uXCJcbiAgfCBcIldhc21cIlxuICB8IFwiVHNCdWlsZEluZm9cIlxuICB8IFwiU291cmNlTWFwXCJcbiAgfCBcIlVua25vd25cIjtcblxuaW50ZXJmYWNlIEluZm9PdXRwdXQge1xuICByb290czogc3RyaW5nW107XG4gIG1vZHVsZXM6IE1vZHVsZUVudHJ5W107XG4gIHJlZGlyZWN0czogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgbnBtUGFja2FnZXM6IFJlY29yZDxzdHJpbmcsIE5wbVBhY2thZ2U+O1xufVxuXG5leHBvcnQgdHlwZSBNb2R1bGVFbnRyeSA9XG4gIHwgTW9kdWxlRW50cnlFcnJvclxuICB8IE1vZHVsZUVudHJ5RXNtXG4gIHwgTW9kdWxlRW50cnlKc29uXG4gIHwgTW9kdWxlRW50cnlOcG1cbiAgfCBNb2R1bGVFbnRyeU5vZGU7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9kdWxlRW50cnlCYXNlIHtcbiAgc3BlY2lmaWVyOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9kdWxlRW50cnlFcnJvciBleHRlbmRzIE1vZHVsZUVudHJ5QmFzZSB7XG4gIGVycm9yOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9kdWxlRW50cnlFc20gZXh0ZW5kcyBNb2R1bGVFbnRyeUJhc2Uge1xuICBraW5kOiBcImVzbVwiO1xuICBsb2NhbDogc3RyaW5nIHwgbnVsbDtcbiAgZW1pdDogc3RyaW5nIHwgbnVsbDtcbiAgbWFwOiBzdHJpbmcgfCBudWxsO1xuICBtZWRpYVR5cGU6IE1lZGlhVHlwZTtcbiAgc2l6ZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1vZHVsZUVudHJ5SnNvbiBleHRlbmRzIE1vZHVsZUVudHJ5QmFzZSB7XG4gIGtpbmQ6IFwiYXNzZXJ0ZWRcIiB8IFwianNvblwiO1xuICBsb2NhbDogc3RyaW5nIHwgbnVsbDtcbiAgbWVkaWFUeXBlOiBNZWRpYVR5cGU7XG4gIHNpemU6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNb2R1bGVFbnRyeU5wbSBleHRlbmRzIE1vZHVsZUVudHJ5QmFzZSB7XG4gIGtpbmQ6IFwibnBtXCI7XG4gIG5wbVBhY2thZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNb2R1bGVFbnRyeU5vZGUgZXh0ZW5kcyBNb2R1bGVFbnRyeUJhc2Uge1xuICBraW5kOiBcIm5vZGVcIjtcbiAgbW9kdWxlTmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5wbVBhY2thZ2Uge1xuICBuYW1lOiBzdHJpbmc7XG4gIHZlcnNpb246IHN0cmluZztcbiAgZGVwZW5kZW5jaWVzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmZvT3B0aW9ucyB7XG4gIGN3ZD86IHN0cmluZztcbiAgY29uZmlnPzogc3RyaW5nO1xuICBpbXBvcnRNYXA/OiBzdHJpbmc7XG4gIGxvY2s/OiBzdHJpbmc7XG4gIG5vZGVNb2R1bGVzRGlyPzogYm9vbGVhbjtcbn1cblxubGV0IHRtcERpcjogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG5hc3luYyBmdW5jdGlvbiBpbmZvKFxuICBzcGVjaWZpZXI6IHN0cmluZyxcbiAgb3B0aW9uczogSW5mb09wdGlvbnMsXG4pOiBQcm9taXNlPEluZm9PdXRwdXQ+IHtcbiAgY29uc3Qgb3B0cyA9IHtcbiAgICBhcmdzOiBbXCJpbmZvXCIsIFwiLS1qc29uXCJdLFxuICAgIGN3ZDogdW5kZWZpbmVkIGFzIHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICBlbnY6IHsgREVOT19OT19QQUNLQUdFX0pTT046IFwidHJ1ZVwiIH0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbiAgICBzdGRvdXQ6IFwicGlwZWRcIixcbiAgICBzdGRlcnI6IFwiaW5oZXJpdFwiLFxuICB9O1xuICBpZiAodHlwZW9mIG9wdGlvbnMuY29uZmlnID09PSBcInN0cmluZ1wiKSB7XG4gICAgb3B0cy5hcmdzLnB1c2goXCItLWNvbmZpZ1wiLCBvcHRpb25zLmNvbmZpZyk7XG4gIH0gZWxzZSB7XG4gICAgb3B0cy5hcmdzLnB1c2goXCItLW5vLWNvbmZpZ1wiKTtcbiAgfVxuICBpZiAob3B0aW9ucy5pbXBvcnRNYXApIHtcbiAgICBvcHRzLmFyZ3MucHVzaChcIi0taW1wb3J0LW1hcFwiLCBvcHRpb25zLmltcG9ydE1hcCk7XG4gIH1cbiAgaWYgKHR5cGVvZiBvcHRpb25zLmxvY2sgPT09IFwic3RyaW5nXCIpIHtcbiAgICBvcHRzLmFyZ3MucHVzaChcIi0tbG9ja1wiLCBvcHRpb25zLmxvY2spO1xuICB9IGVsc2UgaWYgKCFvcHRpb25zLmN3ZCkge1xuICAgIG9wdHMuYXJncy5wdXNoKFwiLS1uby1sb2NrXCIpO1xuICB9XG4gIGlmIChvcHRpb25zLm5vZGVNb2R1bGVzRGlyKSB7XG4gICAgb3B0cy5hcmdzLnB1c2goXCItLW5vZGUtbW9kdWxlcy1kaXJcIik7XG4gIH1cbiAgaWYgKG9wdGlvbnMuY3dkKSB7XG4gICAgb3B0cy5jd2QgPSBvcHRpb25zLmN3ZDtcbiAgfSBlbHNlIHtcbiAgICBpZiAoIXRtcERpcikgdG1wRGlyID0gRGVuby5tYWtlVGVtcERpclN5bmMoKTtcbiAgICBvcHRzLmN3ZCA9IHRtcERpcjtcbiAgfVxuXG4gIG9wdHMuYXJncy5wdXNoKHNwZWNpZmllcik7XG5cbiAgY29uc3Qgb3V0cHV0ID0gYXdhaXQgbmV3IERlbm8uQ29tbWFuZChcbiAgICBEZW5vLmV4ZWNQYXRoKCksXG4gICAgb3B0cyBhcyBEZW5vLkNvbW1hbmRPcHRpb25zLFxuICApLm91dHB1dCgpO1xuICBpZiAoIW91dHB1dC5zdWNjZXNzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY2FsbCAnZGVubyBpbmZvJyBvbiAnJHtzcGVjaWZpZXJ9J2ApO1xuICB9XG4gIGNvbnN0IHR4dCA9IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShvdXRwdXQuc3Rkb3V0KTtcbiAgcmV0dXJuIEpTT04ucGFyc2UodHh0KTtcbn1cblxuZXhwb3J0IGNsYXNzIEluZm9DYWNoZSB7XG4gICNvcHRpb25zOiBJbmZvT3B0aW9ucztcblxuICAjcGVuZGluZzogeyBkb25lOiBQcm9taXNlPHZvaWQ+OyBzcGVjaWZpZXJzOiBTZXQ8c3RyaW5nPiB8IG51bGwgfSB8IG51bGwgPVxuICAgIG51bGw7XG5cbiAgI21vZHVsZXM6IE1hcDxzdHJpbmcsIE1vZHVsZUVudHJ5PiA9IG5ldyBNYXAoKTtcbiAgI3JlZGlyZWN0czogTWFwPHN0cmluZywgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgI25wbVBhY2thZ2VzOiBNYXA8c3RyaW5nLCBOcG1QYWNrYWdlPiA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBJbmZvT3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy4jb3B0aW9ucyA9IG9wdGlvbnM7XG4gIH1cblxuICBhc3luYyBnZXQoc3BlY2lmaWVyOiBzdHJpbmcpOiBQcm9taXNlPE1vZHVsZUVudHJ5PiB7XG4gICAgbGV0IGVudHJ5ID0gdGhpcy4jZ2V0Q2FjaGVkKHNwZWNpZmllcik7XG4gICAgaWYgKGVudHJ5ICE9PSB1bmRlZmluZWQpIHJldHVybiBlbnRyeTtcblxuICAgIGF3YWl0IHRoaXMuI3F1ZXVlTG9hZChzcGVjaWZpZXIpO1xuXG4gICAgZW50cnkgPSB0aGlzLiNnZXRDYWNoZWQoc3BlY2lmaWVyKTtcbiAgICBpZiAoZW50cnkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnJlYWNoYWJsZTogJyR7c3BlY2lmaWVyfScgbG9hZGVkIGJ1dCBub3QgcmVhY2hhYmxlYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVudHJ5O1xuICB9XG5cbiAgZ2V0TnBtUGFja2FnZShpZDogc3RyaW5nKTogTnBtUGFja2FnZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI25wbVBhY2thZ2VzLmdldChpZCk7XG4gIH1cblxuICAjcmVzb2x2ZShzcGVjaWZpZXI6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI3JlZGlyZWN0cy5nZXQoc3BlY2lmaWVyKSA/PyBzcGVjaWZpZXI7XG4gIH1cblxuICAjZ2V0Q2FjaGVkKHNwZWNpZmllcjogc3RyaW5nKTogTW9kdWxlRW50cnkgfCB1bmRlZmluZWQge1xuICAgIHNwZWNpZmllciA9IHRoaXMuI3Jlc29sdmUoc3BlY2lmaWVyKTtcbiAgICByZXR1cm4gdGhpcy4jbW9kdWxlcy5nZXQoc3BlY2lmaWVyKTtcbiAgfVxuXG4gIGFzeW5jICNxdWV1ZUxvYWQoc3BlY2lmaWVyOiBzdHJpbmcpIHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKHRoaXMuI3BlbmRpbmcgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy4jcGVuZGluZyA9IHtcbiAgICAgICAgICBzcGVjaWZpZXJzOiBuZXcgU2V0KFtzcGVjaWZpZXJdKSxcbiAgICAgICAgICBkb25lOiAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgNSkpO1xuICAgICAgICAgICAgY29uc3Qgc3BlY2lmaWVycyA9IHRoaXMuI3BlbmRpbmchLnNwZWNpZmllcnMhO1xuICAgICAgICAgICAgdGhpcy4jcGVuZGluZyEuc3BlY2lmaWVycyA9IG51bGw7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLiNsb2FkKFsuLi5zcGVjaWZpZXJzXSk7XG4gICAgICAgICAgICB0aGlzLiNwZW5kaW5nID0gbnVsbDtcbiAgICAgICAgICB9KSgpLFxuICAgICAgICB9O1xuICAgICAgICBhd2FpdCB0aGlzLiNwZW5kaW5nLmRvbmU7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy4jcGVuZGluZy5zcGVjaWZpZXJzICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuI3BlbmRpbmcuc3BlY2lmaWVycy5hZGQoc3BlY2lmaWVyKTtcbiAgICAgICAgYXdhaXQgdGhpcy4jcGVuZGluZy5kb25lO1xuICAgICAgICByZXR1cm47XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLiNwZW5kaW5nLmRvbmU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgI2xvYWQoc3BlY2lmaWVyczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLiNwb3B1bGF0ZShzcGVjaWZpZXJzKTtcbiAgICBmb3IgKGxldCBzcGVjaWZpZXIgb2Ygc3BlY2lmaWVycykge1xuICAgICAgc3BlY2lmaWVyID0gdGhpcy4jcmVzb2x2ZShzcGVjaWZpZXIpO1xuICAgICAgY29uc3QgZW50cnkgPSB0aGlzLiNtb2R1bGVzLmdldChzcGVjaWZpZXIpO1xuICAgICAgaWYgKGVudHJ5ID09PSB1bmRlZmluZWQgJiYgc3BlY2lmaWVyLnN0YXJ0c1dpdGgoXCJucG06XCIpKSB7XG4gICAgICAgIC8vIHdlIGhpdCBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvZGVuby9pc3N1ZXMvMTgwNDMsIHNvIHdlIGhhdmUgdG9cbiAgICAgICAgLy8gcGVyZm9ybSBhbm90aGVyIGxvYWQgdG8gZ2V0IHRoZSBhY3R1YWwgZGF0YSBvZiB0aGUgcmVkaXJlY3RlZCBzcGVjaWZpZXJcbiAgICAgICAgYXdhaXQgdGhpcy4jcG9wdWxhdGUoW3NwZWNpZmllcl0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jICNwb3B1bGF0ZShzcGVjaWZpZXJzOiBzdHJpbmdbXSkge1xuICAgIGxldCBzcGVjaWZpZXI7XG4gICAgaWYgKHNwZWNpZmllcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICBzcGVjaWZpZXIgPSBzcGVjaWZpZXJzWzBdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzcGVjaWZpZXIgPSBgZGF0YTphcHBsaWNhdGlvbi9qYXZhc2NyaXB0LCR7XG4gICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChcbiAgICAgICAgICBzcGVjaWZpZXJzLm1hcCgocykgPT4gYGltcG9ydCAke0pTT04uc3RyaW5naWZ5KHMpfTtgKS5qb2luKFwiXCIpLFxuICAgICAgICApXG4gICAgICB9YDtcbiAgICB9XG4gICAgY29uc3QgeyBtb2R1bGVzLCByZWRpcmVjdHMsIG5wbVBhY2thZ2VzIH0gPSBhd2FpdCBpbmZvKFxuICAgICAgc3BlY2lmaWVyLFxuICAgICAgdGhpcy4jb3B0aW9ucyxcbiAgICApO1xuICAgIGZvciAoY29uc3QgbW9kdWxlIG9mIG1vZHVsZXMpIHtcbiAgICAgIGlmIChzcGVjaWZpZXJzLmxlbmd0aCAhPT0gMSAmJiBtb2R1bGUuc3BlY2lmaWVyID09PSBzcGVjaWZpZXIpIGNvbnRpbnVlO1xuICAgICAgdGhpcy4jbW9kdWxlcy5zZXQobW9kdWxlLnNwZWNpZmllciwgbW9kdWxlKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBbZnJvbSwgdG9dIG9mIE9iamVjdC5lbnRyaWVzKHJlZGlyZWN0cykpIHtcbiAgICAgIHRoaXMuI3JlZGlyZWN0cy5zZXQoZnJvbSwgdG8pO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFtpZCwgbnBtUGFja2FnZV0gb2YgT2JqZWN0LmVudHJpZXMobnBtUGFja2FnZXMpKSB7XG4gICAgICB0aGlzLiNucG1QYWNrYWdlcy5zZXQoaWQsIG5wbVBhY2thZ2UpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvY2tmaWxlIHtcbiAgdmVyc2lvbjogc3RyaW5nO1xuICBwYWNrYWdlcz86IHsgc3BlY2lmaWVycz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLQSxPQUFPLGVBQWU7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
// denoCacheMetadata=4506411055714240709,3630332778459332293