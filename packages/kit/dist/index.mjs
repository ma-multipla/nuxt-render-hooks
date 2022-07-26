import { parse, basename, resolve, relative, join, normalize, isAbsolute, dirname } from 'pathe';
import { existsSync, readFileSync, promises } from 'node:fs';
import hash$1 from 'hash-sum';
import { getContext } from 'unctx';
import { kebabCase, pascalCase } from 'scule';
import satisfies from 'semver/functions/satisfies.js';
import consola from 'consola';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { globby } from 'globby';
import { interopDefault } from 'mlly';
import jiti from 'jiti';
import ignore from 'ignore';
import defu from 'defu';
import { applyDefaults } from 'untyped';
import lodashTemplate from 'lodash.template';
import { genSafeVariableName, genDynamicImport, genImport } from 'knitwork';
import { loadConfig } from 'c12';
import { NuxtConfigSchema } from '@nuxt/schema';
import { resolvePackageJSON, readPackageJSON } from 'pkg-types';

function chainFn(base, fn) {
  if (typeof fn !== "function") {
    return base;
  }
  return function(...args) {
    if (typeof base !== "function") {
      return fn.apply(this, args);
    }
    let baseResult = base.apply(this, args);
    if (baseResult === void 0) {
      [baseResult] = args;
    }
    const fnResult = fn.call(
      this,
      baseResult,
      ...Array.prototype.slice.call(args, 1)
    );
    if (fnResult === void 0) {
      return baseResult;
    }
    return fnResult;
  };
}

const nuxtCtx = getContext("nuxt");
function useNuxt() {
  const instance = nuxtCtx.use();
  if (!instance) {
    throw new Error("Nuxt instance is unavailable!");
  }
  return instance;
}
function tryUseNuxt() {
  return nuxtCtx.use();
}

function addTemplate(_template) {
  const nuxt = useNuxt();
  const template = normalizeTemplate(_template);
  nuxt.options.build.templates = nuxt.options.build.templates.filter((p) => normalizeTemplate(p).filename !== template.filename);
  nuxt.options.build.templates.push(template);
  return template;
}
function normalizeTemplate(template) {
  if (!template) {
    throw new Error("Invalid template: " + JSON.stringify(template));
  }
  if (typeof template === "string") {
    template = { src: template };
  } else {
    template = { ...template };
  }
  if (template.src) {
    if (!existsSync(template.src)) {
      throw new Error("Template not found: " + template.src);
    }
    if (!template.filename) {
      const srcPath = parse(template.src);
      template.filename = template.fileName || `${basename(srcPath.dir)}.${srcPath.name}.${hash$1(template.src)}${srcPath.ext}`;
    }
  }
  if (!template.src && !template.getContents) {
    throw new Error("Invalid template. Either getContents or src options should be provided: " + JSON.stringify(template));
  }
  if (!template.filename) {
    throw new Error("Invalid template. Either filename should be provided: " + JSON.stringify(template));
  }
  if (template.filename.endsWith(".d.ts")) {
    template.write = true;
  }
  if (!template.dst) {
    const nuxt = useNuxt();
    template.dst = resolve(nuxt.options.buildDir, template.filename);
  }
  return template;
}

async function checkNuxtCompatibility(constraints, nuxt = useNuxt()) {
  const issues = [];
  if (constraints.nuxt) {
    const nuxtVersion = getNuxtVersion(nuxt);
    const nuxtSemanticVersion = nuxtVersion.split("-").shift();
    if (!satisfies(nuxtSemanticVersion, constraints.nuxt)) {
      issues.push({
        name: "nuxt",
        message: `Nuxt version \`${constraints.nuxt}\` is required but currently using \`${nuxtVersion}\``
      });
    }
  }
  if (isNuxt2(nuxt)) {
    const bridgeRequirement = constraints.bridge;
    const hasBridge = !!nuxt.options.bridge;
    if (bridgeRequirement === true && !hasBridge) {
      issues.push({
        name: "bridge",
        message: "Nuxt bridge is required"
      });
    } else if (bridgeRequirement === false && hasBridge) {
      issues.push({
        name: "bridge",
        message: "Nuxt bridge is not supported"
      });
    }
  }
  await nuxt.callHook("kit:compatibility", constraints, issues);
  issues.toString = () => issues.map((issue) => ` - [${issue.name}] ${issue.message}`).join("\n");
  return issues;
}
async function assertNuxtCompatibility(constraints, nuxt = useNuxt()) {
  const issues = await checkNuxtCompatibility(constraints, nuxt);
  if (issues.length) {
    throw new Error("Nuxt compatibility issues found:\n" + issues.toString());
  }
  return true;
}
async function hasNuxtCompatibility(constraints, nuxt = useNuxt()) {
  const issues = await checkNuxtCompatibility(constraints, nuxt);
  return !issues.length;
}
function isNuxt2(nuxt = useNuxt()) {
  return getNuxtVersion(nuxt).startsWith("2.");
}
function isNuxt3(nuxt = useNuxt()) {
  return getNuxtVersion(nuxt).startsWith("3.");
}
function getNuxtVersion(nuxt = useNuxt()) {
  const version = (nuxt?._version || nuxt?.version || nuxt?.constructor?.version || "").replace(/^v/g, "");
  if (!version) {
    throw new Error("Cannot determine nuxt version! Is current instance passed?");
  }
  return version;
}

const logger = consola;
function useLogger(scope) {
  return scope ? logger.withScope(scope) : logger;
}

function addLayout(tmpl, name) {
  const nuxt = useNuxt();
  const { filename, src } = addTemplate(tmpl);
  const layoutName = kebabCase(name || parse(tmpl.filename).name).replace(/["']/g, "");
  if (isNuxt2(nuxt)) {
    const layout = nuxt.options.layouts[layoutName];
    if (layout) {
      return logger.warn(
        `Not overriding \`${layoutName}\` (provided by \`${layout}\`) with \`${src || filename}\`.`
      );
    }
    nuxt.options.layouts[layoutName] = `./${filename}`;
    if (name === "error") {
      this.addErrorLayout(filename);
    }
    return;
  }
  nuxt.hook("app:templates", (app) => {
    if (layoutName in app.layouts) {
      const relativePath = relative(nuxt.options.srcDir, app.layouts[layoutName].file);
      return logger.warn(
        `Not overriding \`${layoutName}\` (provided by \`~/${relativePath}\`) with \`${src || filename}\`.`
      );
    }
    app.layouts[layoutName] = {
      file: join("#build", filename),
      name: layoutName
    };
  });
}

function normalizeHandlerMethod(handler) {
  const [, method = void 0] = handler.handler.match(/\.(get|head|patch|post|put|delete|connect|options|trace)(\.\w+)*$/) || [];
  return {
    method,
    ...handler
  };
}
function addServerMiddleware(middleware) {
  useNuxt().options.serverMiddleware.push(middleware);
}
function addServerHandler(handler) {
  useNuxt().options.serverHandlers.push(normalizeHandlerMethod(handler));
}
function addDevServerHandler(handler) {
  useNuxt().options.devServerHandlers.push(handler);
}

const _require = jiti(process.cwd(), { interopDefault: true });
function isNodeModules(id) {
  return /[/\\]node_modules[/\\]/.test(id);
}
function clearRequireCache(id) {
  if (isNodeModules(id)) {
    return;
  }
  const entry = getRequireCacheItem(id);
  if (!entry) {
    delete _require.cache[id];
    return;
  }
  if (entry.parent) {
    entry.parent.children = entry.parent.children.filter((e) => e.id !== id);
  }
  for (const child of entry.children) {
    clearRequireCache(child.id);
  }
  delete _require.cache[id];
}
function scanRequireTree(id, files = /* @__PURE__ */ new Set()) {
  if (isNodeModules(id) || files.has(id)) {
    return files;
  }
  const entry = getRequireCacheItem(id);
  if (!entry) {
    files.add(id);
    return files;
  }
  files.add(entry.id);
  for (const child of entry.children) {
    scanRequireTree(child.id, files);
  }
  return files;
}
function getRequireCacheItem(id) {
  try {
    return _require.cache[id];
  } catch (e) {
  }
}
function requireModulePkg(id, opts = {}) {
  return requireModule(join(id, "package.json"), opts);
}
function resolveModule(id, opts = {}) {
  return normalize(_require.resolve(id, {
    paths: [].concat(
      global.__NUXT_PREPATHS__,
      opts.paths,
      process.cwd(),
      global.__NUXT_PATHS__
    ).filter(Boolean)
  }));
}
function tryResolveModule(path, opts = {}) {
  try {
    return resolveModule(path, opts);
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") {
      throw error;
    }
  }
  return null;
}
function requireModule(id, opts = {}) {
  const resolvedPath = resolveModule(id, opts);
  if (opts.clearCache && !isNodeModules(id)) {
    clearRequireCache(resolvedPath);
  }
  const requiredModule = _require(resolvedPath);
  return requiredModule;
}
function importModule(id, opts = {}) {
  const resolvedPath = resolveModule(id, opts);
  if (opts.interopDefault !== false) {
    return import(pathToFileURL(resolvedPath).href).then(interopDefault);
  }
  return import(pathToFileURL(resolvedPath).href);
}
function tryImportModule(id, opts = {}) {
  try {
    return importModule(id, opts).catch(() => void 0);
  } catch {
  }
}
function tryRequireModule(id, opts = {}) {
  try {
    return requireModule(id, opts);
  } catch (e) {
  }
}

function isIgnored(pathname) {
  const nuxt = tryUseNuxt();
  if (!nuxt) {
    return null;
  }
  if (!nuxt._ignore) {
    nuxt._ignore = ignore(nuxt.options.ignoreOptions);
    nuxt._ignore.add(nuxt.options.ignore);
    const nuxtignoreFile = join(nuxt.options.rootDir, ".nuxtignore");
    if (existsSync(nuxtignoreFile)) {
      nuxt._ignore.add(readFileSync(nuxtignoreFile, "utf-8"));
    }
  }
  const relativePath = relative(nuxt.options.rootDir, pathname);
  if (relativePath.startsWith("..")) {
    return false;
  }
  return relativePath && nuxt._ignore.ignores(relativePath);
}

async function resolvePath(path, opts = {}) {
  const _path = path;
  path = normalize(path);
  if (isAbsolute(path) && existsSync(path)) {
    return path;
  }
  const nuxt = useNuxt();
  const cwd = opts.cwd || (nuxt ? nuxt.options.rootDir : process.cwd());
  const extensions = opts.extensions || (nuxt ? nuxt.options.extensions : [".ts", ".mjs", ".cjs", ".json"]);
  const modulesDir = nuxt ? nuxt.options.modulesDir : [];
  path = resolveAlias(path);
  if (!isAbsolute(path)) {
    path = resolve(cwd, path);
  }
  let isDirectory = false;
  if (existsSync(path)) {
    isDirectory = (await promises.lstat(path)).isDirectory();
    if (!isDirectory) {
      return path;
    }
  }
  for (const ext of extensions) {
    const pathWithExt = path + ext;
    if (existsSync(pathWithExt)) {
      return pathWithExt;
    }
    const pathWithIndex = join(path, "index" + ext);
    if (isDirectory && existsSync(pathWithIndex)) {
      return pathWithIndex;
    }
  }
  const resolveModulePath = tryResolveModule(_path, { paths: [cwd, ...modulesDir] });
  if (resolveModulePath) {
    return resolveModulePath;
  }
  return path;
}
async function findPath(paths, opts, pathType = "file") {
  if (!Array.isArray(paths)) {
    paths = [paths];
  }
  for (const path of paths) {
    const rPath = await resolvePath(path, opts);
    if (await existsSensitive(rPath)) {
      const isDirectory = (await promises.lstat(rPath)).isDirectory();
      if (!pathType || pathType === "file" && !isDirectory || pathType === "dir" && isDirectory) {
        return rPath;
      }
    }
  }
  return null;
}
function resolveAlias(path, alias) {
  if (!alias) {
    alias = tryUseNuxt()?.options.alias || {};
  }
  for (const key in alias) {
    if (key === "@" && !path.startsWith("@/")) {
      continue;
    }
    if (path.startsWith(key)) {
      path = alias[key] + path.slice(key.length);
    }
  }
  return path;
}
function createResolver(base) {
  if (!base) {
    throw new Error("`base` argument is missing for createResolver(base)!");
  }
  base = base.toString();
  if (base.startsWith("file://")) {
    base = dirname(fileURLToPath(base));
  }
  return {
    resolve: (...path) => resolve(base, ...path),
    resolvePath: (path, opts) => resolvePath(path, { cwd: base, ...opts })
  };
}
async function existsSensitive(path) {
  if (!existsSync(path)) {
    return false;
  }
  const dirFiles = await promises.readdir(dirname(path));
  return dirFiles.includes(basename(path));
}
async function resolveFiles(path, pattern) {
  const files = await globby(pattern, { cwd: path, followSymbolicLinks: true });
  return files.map((p) => resolve(path, p)).filter((p) => !isIgnored(p)).sort();
}

function normalizePlugin(plugin) {
  if (typeof plugin === "string") {
    plugin = { src: plugin };
  } else {
    plugin = { ...plugin };
  }
  if (!plugin.src) {
    throw new Error("Invalid plugin. src option is required: " + JSON.stringify(plugin));
  }
  plugin.src = normalize(resolveAlias(plugin.src));
  if (plugin.ssr) {
    plugin.mode = "server";
  }
  if (!plugin.mode) {
    const [, mode = "all"] = plugin.src.match(/\.(server|client)(\.\w+)*$/) || [];
    plugin.mode = mode;
  }
  return plugin;
}
function addPlugin(_plugin, opts = {}) {
  const nuxt = useNuxt();
  const plugin = normalizePlugin(_plugin);
  nuxt.options.plugins = nuxt.options.plugins.filter((p) => normalizePlugin(p).src !== plugin.src);
  nuxt.options.plugins[opts.append ? "push" : "unshift"](plugin);
  return plugin;
}
function addPluginTemplate(plugin, opts = {}) {
  const normalizedPlugin = typeof plugin === "string" ? { src: plugin } : { ...plugin, src: addTemplate(plugin).dst };
  return addPlugin(normalizedPlugin, opts);
}

async function installModule(moduleToInstall, _inlineOptions, _nuxt) {
  const nuxt = useNuxt();
  const { nuxtModule, inlineOptions } = await normalizeModule(moduleToInstall, _inlineOptions);
  await nuxtModule.call(useModuleContainer(), inlineOptions, nuxt);
  nuxt.options._installedModules = nuxt.options._installedModules || [];
  nuxt.options._installedModules.push({
    meta: await nuxtModule.getMeta?.(),
    entryPath: typeof moduleToInstall === "string" ? resolveAlias(moduleToInstall) : void 0
  });
}
async function normalizeModule(nuxtModule, inlineOptions) {
  const nuxt = useNuxt();
  if (nuxtModule?._version || nuxtModule?.version || nuxtModule?.constructor?.version || "") {
    [nuxtModule, inlineOptions] = [inlineOptions, {}];
    console.warn(new Error("`installModule` is being called with old signature!"));
  }
  if (typeof nuxtModule === "string") {
    const _src = resolveModule(resolveAlias(nuxtModule), { paths: nuxt.options.modulesDir });
    const isESM = _src.endsWith(".mjs");
    nuxtModule = isESM ? await importModule(_src) : requireModule(_src);
  }
  if (typeof nuxtModule !== "function") {
    throw new TypeError("Nuxt module should be a function: " + nuxtModule);
  }
  return { nuxtModule, inlineOptions };
}

const MODULE_CONTAINER_KEY = "__module_container__";
function useModuleContainer(nuxt = useNuxt()) {
  if (nuxt[MODULE_CONTAINER_KEY]) {
    return nuxt[MODULE_CONTAINER_KEY];
  }
  async function requireModule(moduleOpts) {
    let src, inlineOptions;
    if (typeof moduleOpts === "string") {
      src = moduleOpts;
    } else if (Array.isArray(moduleOpts)) {
      [src, inlineOptions] = moduleOpts;
    } else if (typeof moduleOpts === "object") {
      if (moduleOpts.src || moduleOpts.handler) {
        src = moduleOpts.src || moduleOpts.handler;
        inlineOptions = moduleOpts.options;
      } else {
        src = moduleOpts;
      }
    } else {
      src = moduleOpts;
    }
    await installModule(src, inlineOptions);
  }
  nuxt[MODULE_CONTAINER_KEY] = {
    nuxt,
    options: nuxt.options,
    ready() {
      return Promise.resolve();
    },
    addVendor() {
    },
    requireModule,
    addModule: requireModule,
    addServerMiddleware,
    addTemplate(template) {
      if (typeof template === "string") {
        template = { src: template };
      }
      if (template.write === void 0) {
        template.write = true;
      }
      return addTemplate(template);
    },
    addPlugin(pluginTemplate) {
      return addPluginTemplate(pluginTemplate);
    },
    addLayout(tmpl, name) {
      return addLayout(tmpl, name);
    },
    addErrorLayout(dst) {
      const relativeBuildDir = relative(nuxt.options.rootDir, nuxt.options.buildDir);
      nuxt.options.ErrorPage = `~/${relativeBuildDir}/${dst}`;
    },
    extendBuild(fn) {
      nuxt.options.build.extend = chainFn(nuxt.options.build.extend, fn);
      if (!isNuxt2(nuxt)) {
        console.warn("[kit] [compat] Using `extendBuild` in Nuxt 3 has no effect. Instead call extendWebpackConfig and extendViteConfig.");
      }
    },
    extendRoutes(fn) {
      if (isNuxt2(nuxt)) {
        nuxt.options.router.extendRoutes = chainFn(nuxt.options.router.extendRoutes, fn);
      } else {
        nuxt.hook("pages:extend", async (pages, ...args) => {
          const maybeRoutes = await fn(pages, ...args);
          if (maybeRoutes) {
            console.warn("[kit] [compat] Using `extendRoutes` in Nuxt 3 needs to directly modify first argument instead of returning updated routes. Skipping extended routes.");
          }
        });
      }
    }
  };
  return nuxt[MODULE_CONTAINER_KEY];
}

const defaults = {
  ignoreUnknown: false,
  respectType: false,
  respectFunctionNames: false,
  respectFunctionProperties: false,
  unorderedObjects: true,
  unorderedArrays: false,
  unorderedSets: false
};
function objectHash(object, options = {}) {
  options = { ...defaults, ...options };
  const hasher = createHasher(options);
  hasher.dispatch(object);
  return hasher.toString();
}
function createHasher(options) {
  const buff = [];
  let context = [];
  const write = (str) => {
    buff.push(str);
  };
  return {
    toString() {
      return buff.join("");
    },
    getContext() {
      return context;
    },
    dispatch(value) {
      if (options.replacer) {
        value = options.replacer(value);
      }
      const type = value === null ? "null" : typeof value;
      return this["_" + type](value);
    },
    _object(object) {
      const pattern = /\[object (.*)\]/i;
      const objString = Object.prototype.toString.call(object);
      const _objType = pattern.exec(objString);
      const objType = _objType ? _objType[1].toLowerCase() : "unknown:[" + objString.toLowerCase() + "]";
      let objectNumber = null;
      if ((objectNumber = context.indexOf(object)) >= 0) {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      } else {
        context.push(object);
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        write("buffer:");
        return write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this["_" + objType]) {
          this["_" + objType](object);
        } else if (options.ignoreUnknown) {
          return write("[" + objType + "]");
        } else {
          throw new Error('Unknown object type "' + objType + '"');
        }
      } else {
        let keys = Object.keys(object);
        if (options.unorderedObjects) {
          keys = keys.sort();
        }
        if (options.respectType !== false && !isNativeFunction(object)) {
          keys.splice(0, 0, "prototype", "__proto__", "letructor");
        }
        if (options.excludeKeys) {
          keys = keys.filter(function(key) {
            return !options.excludeKeys(key);
          });
        }
        write("object:" + keys.length + ":");
        return keys.forEach((key) => {
          this.dispatch(key);
          write(":");
          if (!options.excludeValues) {
            this.dispatch(object[key]);
          }
          write(",");
        });
      }
    },
    _array(arr, unordered) {
      unordered = typeof unordered !== "undefined" ? unordered : options.unorderedArrays !== false;
      write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        return arr.forEach((entry) => {
          return this.dispatch(entry);
        });
      }
      const contextAdditions = [];
      const entries = arr.map((entry) => {
        const hasher = createHasher(options);
        hasher.dispatch(entry);
        contextAdditions.push(hasher.getContext());
        return hasher.toString();
      });
      context = context.concat(contextAdditions);
      entries.sort();
      return this._array(entries, false);
    },
    _date(date) {
      return write("date:" + date.toJSON());
    },
    _symbol(sym) {
      return write("symbol:" + sym.toString());
    },
    _error(err) {
      return write("error:" + err.toString());
    },
    _boolean(bool) {
      return write("bool:" + bool.toString());
    },
    _string(string) {
      write("string:" + string.length + ":");
      write(string.toString());
    },
    _function(fn) {
      write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
      if (options.respectFunctionNames !== false) {
        this.dispatch("function-name:" + String(fn.name));
      }
      if (options.respectFunctionProperties) {
        this._object(fn);
      }
    },
    _number(number) {
      return write("number:" + number.toString());
    },
    _xml(xml) {
      return write("xml:" + xml.toString());
    },
    _null() {
      return write("Null");
    },
    _undefined() {
      return write("Undefined");
    },
    _regexp(regex) {
      return write("regex:" + regex.toString());
    },
    _uint8array(arr) {
      write("uint8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _uint8clampedarray(arr) {
      write("uint8clampedarray:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _int8array(arr) {
      write("int8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _uint16array(arr) {
      write("uint16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _int16array(arr) {
      write("int16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _uint32array(arr) {
      write("uint32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _int32array(arr) {
      write("int32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _float32array(arr) {
      write("float32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _float64array(arr) {
      write("float64array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    _arraybuffer(arr) {
      write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    },
    _url(url) {
      return write("url:" + url.toString());
    },
    _map(map) {
      write("map:");
      const arr = Array.from(map);
      return this._array(arr, options.unorderedSets !== false);
    },
    _set(set) {
      write("set:");
      const arr = Array.from(set);
      return this._array(arr, options.unorderedSets !== false);
    },
    _file(file) {
      write("file:");
      return this.dispatch([file.name, file.size, file.type, file.lastModfied]);
    },
    _blob() {
      if (options.ignoreUnknown) {
        return write("[blob]");
      }
      throw new Error('Hashing Blob objects is currently not supported\nUse "options.replacer" or "options.ignoreUnknown"\n');
    },
    _domwindow() {
      return write("domwindow");
    },
    _bigint(number) {
      return write("bigint:" + number.toString());
    },
    _process() {
      return write("process");
    },
    _timer() {
      return write("timer");
    },
    _pipe() {
      return write("pipe");
    },
    _tcp() {
      return write("tcp");
    },
    _udp() {
      return write("udp");
    },
    _tty() {
      return write("tty");
    },
    _statwatcher() {
      return write("statwatcher");
    },
    _securecontext() {
      return write("securecontext");
    },
    _connection() {
      return write("connection");
    },
    _zlib() {
      return write("zlib");
    },
    _context() {
      return write("context");
    },
    _nodescript() {
      return write("nodescript");
    },
    _httpparser() {
      return write("httpparser");
    },
    _dataview() {
      return write("dataview");
    },
    _signal() {
      return write("signal");
    },
    _fsevent() {
      return write("fsevent");
    },
    _tlswrap() {
      return write("tlswrap");
    }
  };
}
function isNativeFunction(f) {
  if (typeof f !== "function") {
    return false;
  }
  const exp = /^function\s+\w*\s*\(\s*\)\s*{\s+\[native code\]\s+}$/i;
  return exp.exec(Function.prototype.toString.call(f)) != null;
}

class WordArray {
  constructor(words, sigBytes) {
    words = this.words = words || [];
    if (sigBytes !== void 0) {
      this.sigBytes = sigBytes;
    } else {
      this.sigBytes = words.length * 4;
    }
  }
  toString(encoder) {
    return (encoder || Hex).stringify(this);
  }
  concat(wordArray) {
    this.clamp();
    if (this.sigBytes % 4) {
      for (let i = 0; i < wordArray.sigBytes; i++) {
        const thatByte = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
        this.words[this.sigBytes + i >>> 2] |= thatByte << 24 - (this.sigBytes + i) % 4 * 8;
      }
    } else {
      for (let j = 0; j < wordArray.sigBytes; j += 4) {
        this.words[this.sigBytes + j >>> 2] = wordArray.words[j >>> 2];
      }
    }
    this.sigBytes += wordArray.sigBytes;
    return this;
  }
  clamp() {
    this.words[this.sigBytes >>> 2] &= 4294967295 << 32 - this.sigBytes % 4 * 8;
    this.words.length = Math.ceil(this.sigBytes / 4);
  }
  clone() {
    return new WordArray(this.words.slice(0));
  }
}
const Hex = {
  stringify(wordArray) {
    const hexChars = [];
    for (let i = 0; i < wordArray.sigBytes; i++) {
      const bite = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      hexChars.push((bite >>> 4).toString(16));
      hexChars.push((bite & 15).toString(16));
    }
    return hexChars.join("");
  }
};
const Base64 = {
  stringify(wordArray) {
    const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const base64Chars = [];
    for (let i = 0; i < wordArray.sigBytes; i += 3) {
      const byte1 = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      const byte2 = wordArray.words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
      const byte3 = wordArray.words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
      const triplet = byte1 << 16 | byte2 << 8 | byte3;
      for (let j = 0; j < 4 && i * 8 + j * 6 < wordArray.sigBytes * 8; j++) {
        base64Chars.push(keyStr.charAt(triplet >>> 6 * (3 - j) & 63));
      }
    }
    return base64Chars.join("");
  }
};
const Latin1 = {
  parse(latin1Str) {
    const latin1StrLength = latin1Str.length;
    const words = [];
    for (let i = 0; i < latin1StrLength; i++) {
      words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
    }
    return new WordArray(words, latin1StrLength);
  }
};
const Utf8 = {
  parse(utf8Str) {
    return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
  }
};
class BufferedBlockAlgorithm {
  constructor() {
    this._minBufferSize = 0;
    this.blockSize = 512 / 32;
    this.reset();
  }
  reset() {
    this._data = new WordArray();
    this._nDataBytes = 0;
  }
  _append(data) {
    if (typeof data === "string") {
      data = Utf8.parse(data);
    }
    this._data.concat(data);
    this._nDataBytes += data.sigBytes;
  }
  _doProcessBlock(_dataWords, _offset) {
  }
  _process(doFlush) {
    let processedWords;
    let nBlocksReady = this._data.sigBytes / (this.blockSize * 4);
    if (doFlush) {
      nBlocksReady = Math.ceil(nBlocksReady);
    } else {
      nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
    }
    const nWordsReady = nBlocksReady * this.blockSize;
    const nBytesReady = Math.min(nWordsReady * 4, this._data.sigBytes);
    if (nWordsReady) {
      for (let offset = 0; offset < nWordsReady; offset += this.blockSize) {
        this._doProcessBlock(this._data.words, offset);
      }
      processedWords = this._data.words.splice(0, nWordsReady);
      this._data.sigBytes -= nBytesReady;
    }
    return new WordArray(processedWords, nBytesReady);
  }
}
class Hasher extends BufferedBlockAlgorithm {
  update(messageUpdate) {
    this._append(messageUpdate);
    this._process();
    return this;
  }
  finalize(messageUpdate) {
    if (messageUpdate) {
      this._append(messageUpdate);
    }
  }
}

const H = [1779033703, -1150833019, 1013904242, -1521486534, 1359893119, -1694144372, 528734635, 1541459225];
const K = [1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993, -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987, 1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885, -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872, -1866530822, -1538233109, -1090935817, -965641998];
const W = [];
class SHA256 extends Hasher {
  constructor() {
    super();
    this.reset();
  }
  reset() {
    super.reset();
    this._hash = new WordArray(H.slice(0));
  }
  _doProcessBlock(M, offset) {
    const H2 = this._hash.words;
    let a = H2[0];
    let b = H2[1];
    let c = H2[2];
    let d = H2[3];
    let e = H2[4];
    let f = H2[5];
    let g = H2[6];
    let h = H2[7];
    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        W[i] = M[offset + i] | 0;
      } else {
        const gamma0x = W[i - 15];
        const gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
        const gamma1x = W[i - 2];
        const gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
        W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
      }
      const ch = e & f ^ ~e & g;
      const maj = a & b ^ a & c ^ b & c;
      const sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
      const sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
      const t1 = h + sigma1 + ch + K[i] + W[i];
      const t2 = sigma0 + maj;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    H2[0] = H2[0] + a | 0;
    H2[1] = H2[1] + b | 0;
    H2[2] = H2[2] + c | 0;
    H2[3] = H2[3] + d | 0;
    H2[4] = H2[4] + e | 0;
    H2[5] = H2[5] + f | 0;
    H2[6] = H2[6] + g | 0;
    H2[7] = H2[7] + h | 0;
  }
  finalize(messageUpdate) {
    super.finalize(messageUpdate);
    const nBitsTotal = this._nDataBytes * 8;
    const nBitsLeft = this._data.sigBytes * 8;
    this._data.words[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(nBitsTotal / 4294967296);
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
    this._data.sigBytes = this._data.words.length * 4;
    this._process();
    return this._hash;
  }
}
function sha256base64(message) {
  return new SHA256().finalize(message).toString(Base64);
}

function hash(object, options = {}) {
  const hashed = typeof object === "string" ? object : objectHash(object, options);
  return sha256base64(hashed).substr(0, 10);
}

async function compileTemplate(template, ctx) {
  const data = { ...ctx, options: template.options };
  if (template.src) {
    try {
      const srcContents = await promises.readFile(template.src, "utf-8");
      return lodashTemplate(srcContents, {})(data);
    } catch (err) {
      console.error("Error compiling template: ", template);
      throw err;
    }
  }
  if (template.getContents) {
    return template.getContents(data);
  }
  throw new Error("Invalid template: " + JSON.stringify(template));
}
const serialize = (data) => JSON.stringify(data, null, 2).replace(/"{(.+)}"(?=,?$)/gm, (r) => JSON.parse(r).replace(/^{(.*)}$/, "$1"));
const importSources = (sources, root, { lazy = false } = {}) => {
  if (!Array.isArray(sources)) {
    sources = [sources];
  }
  const exports = [];
  const imports = [];
  for (const src of sources) {
    const path = relative(root, src);
    const variable = genSafeVariableName(path).replace(/_(45|46|47)/g, "_") + "_" + hash(path);
    exports.push(variable);
    imports.push(
      lazy ? `const ${variable} = ${genDynamicImport(src, { comment: `webpackChunkName: ${JSON.stringify(src)}` })}` : genImport(src, variable)
    );
  }
  return {
    exports,
    imports
  };
};
const templateUtils = { serialize, importName: genSafeVariableName, importSources };

function defineNuxtModule(definition) {
  if (typeof definition === "function") {
    definition = definition(useNuxt());
    logger.warn("Module definition as function is deprecated and will be removed in the future versions", definition);
  }
  if (!definition.meta) {
    definition.meta = {};
  }
  if (!definition.meta.configKey) {
    definition.meta.name = definition.meta.name || definition.name;
    definition.meta.configKey = definition.configKey || definition.meta.name;
  }
  function getOptions(inlineOptions, nuxt = useNuxt()) {
    const configKey = definition.meta.configKey || definition.meta.name;
    const _defaults = definition.defaults instanceof Function ? definition.defaults(nuxt) : definition.defaults;
    let _options = defu(inlineOptions, nuxt.options[configKey], _defaults);
    if (definition.schema) {
      _options = applyDefaults(definition.schema, _options);
    }
    return Promise.resolve(_options);
  }
  async function normalizedModule(inlineOptions, nuxt) {
    if (!nuxt) {
      nuxt = tryUseNuxt() || this.nuxt;
    }
    const uniqueKey = definition.meta.name || definition.meta.configKey;
    if (uniqueKey) {
      nuxt.options._requiredModules = nuxt.options._requiredModules || {};
      if (nuxt.options._requiredModules[uniqueKey]) {
        return;
      }
      nuxt.options._requiredModules[uniqueKey] = true;
    }
    if (definition.meta.compatibility) {
      const issues = await checkNuxtCompatibility(definition.meta.compatibility, nuxt);
      if (issues.length) {
        logger.warn(`Module \`${definition.meta.name}\` is disabled due to incompatibility issues:
${issues.toString()}`);
        return;
      }
    }
    nuxt2Shims(nuxt);
    const _options = await getOptions(inlineOptions, nuxt);
    if (definition.hooks) {
      nuxt.hooks.addHooks(definition.hooks);
    }
    await definition.setup?.call(null, _options, nuxt);
  }
  normalizedModule.getMeta = () => Promise.resolve(definition.meta);
  normalizedModule.getOptions = getOptions;
  return normalizedModule;
}
const NUXT2_SHIMS_KEY = "__nuxt2_shims_key__";
function nuxt2Shims(nuxt) {
  if (!isNuxt2(nuxt) || nuxt[NUXT2_SHIMS_KEY]) {
    return;
  }
  nuxt[NUXT2_SHIMS_KEY] = true;
  nuxt.hooks = nuxt;
  if (!nuxtCtx.use()) {
    nuxtCtx.set(nuxt);
    nuxt.hook("close", () => nuxtCtx.unset());
  }
  let virtualTemplates;
  nuxt.hook("builder:prepared", (_builder, buildOptions) => {
    virtualTemplates = buildOptions.templates.filter((t) => t.getContents);
    for (const template of virtualTemplates) {
      buildOptions.templates.splice(buildOptions.templates.indexOf(template), 1);
    }
  });
  nuxt.hook("build:templates", async (templates) => {
    const context = {
      nuxt,
      utils: templateUtils,
      app: {
        dir: nuxt.options.srcDir,
        extensions: nuxt.options.extensions,
        plugins: nuxt.options.plugins,
        templates: [
          ...templates.templatesFiles,
          ...virtualTemplates
        ],
        templateVars: templates.templateVars
      }
    };
    for await (const template of virtualTemplates) {
      const contents = await compileTemplate({ ...template, src: "" }, context);
      await promises.mkdir(dirname(template.dst), { recursive: true });
      await promises.writeFile(template.dst, contents);
    }
  });
}

async function loadNuxtConfig(opts) {
  const { config: nuxtConfig, configFile, layers, cwd } = await loadConfig({
    name: "nuxt",
    configFile: "nuxt.config",
    rcFile: ".nuxtrc",
    dotenv: true,
    globalRc: true,
    ...opts
  });
  nuxtConfig.rootDir = nuxtConfig.rootDir || cwd;
  nuxtConfig._nuxtConfigFile = configFile;
  nuxtConfig._nuxtConfigFiles = [configFile];
  for (const layer of layers) {
    layer.config.rootDir = layer.config.rootDir ?? layer.cwd;
    layer.config.srcDir = resolve(layer.config.rootDir, layer.config.srcDir);
  }
  nuxtConfig._layers = layers.filter((layer) => layer.configFile && !layer.configFile.endsWith(".nuxtrc"));
  return applyDefaults(NuxtConfigSchema, nuxtConfig);
}

async function loadNuxt(opts) {
  opts.cwd = opts.cwd || opts.rootDir;
  opts.overrides = opts.overrides || opts.config || {};
  const resolveOpts = { paths: opts.cwd };
  opts.overrides.dev = !!opts.dev;
  const nearestNuxtPkg = await Promise.all(["nuxt3", "nuxt", "nuxt-edge"].map((pkg2) => resolvePackageJSON(pkg2, { url: opts.cwd }).catch(() => null))).then((r) => r.filter(Boolean).sort((a, b) => b.length - a.length)[0]);
  if (!nearestNuxtPkg) {
    throw new Error(`Cannot find any nuxt version from ${opts.cwd}`);
  }
  const pkg = await readPackageJSON(nearestNuxtPkg);
  const majorVersion = parseInt((pkg.version || "").split(".")[0]);
  if (majorVersion === 3) {
    const { loadNuxt: loadNuxt3 } = await importModule(pkg._name || pkg.name, resolveOpts);
    const nuxt2 = await loadNuxt3(opts);
    return nuxt2;
  }
  const { loadNuxt: loadNuxt2 } = await tryImportModule("nuxt-edge", resolveOpts) || await importModule("nuxt", resolveOpts);
  const nuxt = await loadNuxt2({
    rootDir: opts.cwd,
    for: opts.dev ? "dev" : "build",
    configOverrides: opts.overrides,
    ready: opts.ready,
    envConfig: opts.dotenv
  });
  return nuxt;
}
async function buildNuxt(nuxt) {
  const resolveOpts = { paths: nuxt.options.rootDir };
  if (nuxt.options._majorVersion === 3) {
    const { build: build2 } = await tryImportModule("nuxt3", resolveOpts) || await importModule("nuxt", resolveOpts);
    return build2(nuxt);
  }
  const { build } = await tryImportModule("nuxt-edge", resolveOpts) || await importModule("nuxt", resolveOpts);
  return build(nuxt);
}

function addAutoImport(imports) {
  assertNuxtCompatibility({ bridge: true });
  useNuxt().hook("autoImports:extend", (autoImports) => {
    autoImports.push(...Array.isArray(imports) ? imports : [imports]);
  });
}
function addAutoImportDir(_autoImportDirs) {
  assertNuxtCompatibility({ bridge: true });
  useNuxt().hook("autoImports:dirs", (autoImportDirs) => {
    for (const dir of Array.isArray(_autoImportDirs) ? _autoImportDirs : [_autoImportDirs]) {
      autoImportDirs.push(dir);
    }
  });
}

function extendWebpackConfig(fn, options = {}) {
  const nuxt = useNuxt();
  if (options.dev === false && nuxt.options.dev) {
    return;
  }
  if (options.build === false && nuxt.options.build) {
    return;
  }
  nuxt.hook("webpack:config", (configs) => {
    if (options.server !== false) {
      const config = configs.find((i) => i.name === "server");
      if (config) {
        fn(config);
      }
    }
    if (options.client !== false) {
      const config = configs.find((i) => i.name === "client");
      if (config) {
        fn(config);
      }
    }
    if (options.modern !== false) {
      const config = configs.find((i) => i.name === "modern");
      if (config) {
        fn(config);
      }
    }
  });
}
function extendViteConfig(fn, options = {}) {
  const nuxt = useNuxt();
  if (options.dev === false && nuxt.options.dev) {
    return;
  }
  if (options.build === false && nuxt.options.build) {
    return;
  }
  if (options.server !== false && options.client !== false) {
    return nuxt.hook("vite:extend", ({ config }) => fn(config));
  }
  nuxt.hook("vite:extendConfig", (config, { isClient, isServer }) => {
    if (options.server !== false && isServer) {
      return fn(config);
    }
    if (options.client !== false && isClient) {
      return fn(config);
    }
  });
}
function addWebpackPlugin(plugin, options) {
  extendWebpackConfig((config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(plugin);
  }, options);
}
function addVitePlugin(plugin, options) {
  extendViteConfig((config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(plugin);
  }, options);
}

async function addComponentsDir(dir) {
  const nuxt = useNuxt();
  await assertNuxtCompatibility({ nuxt: ">=2.13" }, nuxt);
  nuxt.options.components = nuxt.options.components || [];
  nuxt.hook("components:dirs", (dirs) => {
    dirs.push(dir);
  });
}
async function addComponent(opts) {
  const nuxt = useNuxt();
  await assertNuxtCompatibility({ nuxt: ">=2.13" }, nuxt);
  nuxt.options.components = nuxt.options.components || [];
  const component = {
    export: opts.export || "default",
    chunkName: "components/" + kebabCase(opts.name),
    global: opts.global ?? false,
    kebabName: kebabCase(opts.name || ""),
    pascalName: pascalCase(opts.name || ""),
    prefetch: false,
    preload: false,
    mode: "all",
    shortPath: opts.filePath,
    async: false,
    level: 0,
    asyncImport: `${genDynamicImport(opts.filePath)}.then(r => r['${opts.export || "default"}'])`,
    import: `require(${JSON.stringify(opts.filePath)})['${opts.export || "default"}']`,
    ...opts
  };
  nuxt.hook("components:extend", (components) => {
    const existingComponent = components.find((c) => (c.pascalName === component.pascalName || c.kebabName === component.kebabName) && c.mode === component.mode);
    if (existingComponent) {
      const name = existingComponent.pascalName || existingComponent.kebabName;
      console.warn(`Overriding ${name} component.`);
      Object.assign(existingComponent, component);
    } else {
      components.push(component);
    }
  });
}

function extendPages(cb) {
  const nuxt = useNuxt();
  if (isNuxt2(nuxt)) {
    nuxt.hook("build:extendRoutes", cb);
  } else {
    nuxt.hook("pages:extend", cb);
  }
}

export { addAutoImport, addAutoImportDir, addComponent, addComponentsDir, addDevServerHandler, addLayout, addPlugin, addPluginTemplate, addServerHandler, addServerMiddleware, addTemplate, addVitePlugin, addWebpackPlugin, assertNuxtCompatibility, buildNuxt, checkNuxtCompatibility, clearRequireCache, compileTemplate, createResolver, defineNuxtModule, extendPages, extendViteConfig, extendWebpackConfig, findPath, getNuxtVersion, getRequireCacheItem, hasNuxtCompatibility, importModule, installModule, isIgnored, isNodeModules, isNuxt2, isNuxt3, loadNuxt, loadNuxtConfig, logger, normalizePlugin, normalizeTemplate, nuxtCtx, requireModule, requireModulePkg, resolveAlias, resolveFiles, resolveModule, resolvePath, scanRequireTree, templateUtils, tryImportModule, tryRequireModule, tryResolveModule, tryUseNuxt, useLogger, useModuleContainer, useNuxt };
