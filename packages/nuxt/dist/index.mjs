import { dirname, resolve, basename, extname, relative, normalize, isAbsolute, join } from 'pathe';
import { createHooks } from 'hookable';
import { useNuxt, resolveFiles, defineNuxtModule, addPlugin, addVitePlugin, addWebpackPlugin, addTemplate, findPath, isIgnored, resolveAlias, addPluginTemplate, logger, resolvePath, nuxtCtx, addComponent, tryResolveModule, installModule, loadNuxtConfig, templateUtils, normalizeTemplate, compileTemplate, normalizePlugin, importModule } from '@nuxt/kit';
import escapeRE from 'escape-string-regexp';
import { existsSync, statSync, promises } from 'node:fs';
import { genArrayFromRaw, genSafeVariableName, genImport, genDynamicImport, genObjectFromRawEntries, genString, genExport } from 'knitwork';
import { encodePath, parseURL, parseQuery, withQuery, joinURL, withTrailingSlash } from 'ufo';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { kebabCase, upperFirst, splitByCase, pascalCase } from 'scule';
import { createUnplugin } from 'unplugin';
import { findStaticImports, findExports } from 'mlly';
import MagicString from 'magic-string';
import defu from 'defu';
import { globby } from 'globby';
import { hyphenate } from '@vue/shared';
import { defineUnimportPreset, createUnimport, toImports, scanDirExports } from 'unimport';
import { createRequire } from 'node:module';
import { createTransformer } from 'unctx/transform';
import { stripLiteral } from 'strip-literal';
import { createNitro, scanHandlers, writeTypes, build as build$1, prepare, copyPublicAssets, prerender, createDevServer } from 'nitropack';
import fsExtra from 'fs-extra';
import { dynamicEventHandler, toEventHandler } from 'h3';
import chokidar from 'chokidar';
import { debounce } from 'perfect-debounce';
import { generateTypes, resolveSchema } from 'untyped';

let _distDir = dirname(fileURLToPath(import.meta.url));
if (_distDir.endsWith("chunks")) {
  _distDir = dirname(_distDir);
}
const distDir = _distDir;
const pkgDir = resolve(distDir, "..");
resolve(distDir, "runtime");

function getNameFromPath(path) {
  return kebabCase(basename(path).replace(extname(path), "")).replace(/["']/g, "");
}
function uniqueBy(arr, key) {
  const res = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of arr) {
    if (seen.has(item[key])) {
      continue;
    }
    seen.add(item[key]);
    res.push(item);
  }
  return res;
}
function hasSuffix(path, suffix) {
  return basename(path).replace(extname(path), "").endsWith(suffix);
}

async function resolvePagesRoutes() {
  const nuxt = useNuxt();
  const pagesDirs = nuxt.options._layers.map(
    (layer) => resolve(layer.config.srcDir, layer.config.dir?.pages || "pages")
  );
  const allRoutes = (await Promise.all(
    pagesDirs.map(async (dir) => {
      const files = await resolveFiles(dir, `**/*{${nuxt.options.extensions.join(",")}}`);
      files.sort();
      return generateRoutesFromFiles(files, dir);
    })
  )).flat();
  return uniqueBy(allRoutes, "path");
}
function generateRoutesFromFiles(files, pagesDir) {
  const routes = [];
  for (const file of files) {
    const segments = relative(pagesDir, file).replace(new RegExp(`${escapeRE(extname(file))}$`), "").split("/");
    const route = {
      name: "",
      path: "",
      file,
      children: []
    };
    let parent = routes;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const tokens = parseSegment(segment);
      const segmentName = tokens.map(({ value }) => value).join("");
      const isSingleSegment = segments.length === 1;
      route.name += (route.name && "-") + segmentName;
      const child = parent.find((parentRoute) => parentRoute.name === route.name);
      if (child) {
        parent = child.children;
        route.path = "";
      } else if (segmentName === "404" && isSingleSegment) {
        route.path += "/:catchAll(.*)*";
      } else if (segmentName === "index" && !route.path) {
        route.path += "/";
      } else if (segmentName !== "index") {
        route.path += getRoutePath(tokens);
      }
    }
    parent.push(route);
  }
  return prepareRoutes(routes);
}
function getRoutePath(tokens) {
  return tokens.reduce((path, token) => {
    return path + (token.type === 2 /* optional */ ? `:${token.value}?` : token.type === 1 /* dynamic */ ? `:${token.value}` : token.type === 3 /* catchall */ ? `:${token.value}(.*)*` : encodePath(token.value));
  }, "/");
}
const PARAM_CHAR_RE = /[\w\d_.]/;
function parseSegment(segment) {
  let state = 0 /* initial */;
  let i = 0;
  let buffer = "";
  const tokens = [];
  function consumeBuffer() {
    if (!buffer) {
      return;
    }
    if (state === 0 /* initial */) {
      throw new Error("wrong state");
    }
    tokens.push({
      type: state === 1 /* static */ ? 0 /* static */ : state === 2 /* dynamic */ ? 1 /* dynamic */ : state === 3 /* optional */ ? 2 /* optional */ : 3 /* catchall */,
      value: buffer
    });
    buffer = "";
  }
  while (i < segment.length) {
    const c = segment[i];
    switch (state) {
      case 0 /* initial */:
        buffer = "";
        if (c === "[") {
          state = 2 /* dynamic */;
        } else {
          i--;
          state = 1 /* static */;
        }
        break;
      case 1 /* static */:
        if (c === "[") {
          consumeBuffer();
          state = 2 /* dynamic */;
        } else {
          buffer += c;
        }
        break;
      case 4 /* catchall */:
      case 2 /* dynamic */:
      case 3 /* optional */:
        if (buffer === "...") {
          buffer = "";
          state = 4 /* catchall */;
        }
        if (c === "[" && state === 2 /* dynamic */) {
          state = 3 /* optional */;
        }
        if (c === "]" && (state !== 3 /* optional */ || buffer[buffer.length - 1] === "]")) {
          if (!buffer) {
            throw new Error("Empty param");
          } else {
            consumeBuffer();
          }
          state = 0 /* initial */;
        } else if (PARAM_CHAR_RE.test(c)) {
          buffer += c;
        } else ;
        break;
    }
    i++;
  }
  if (state === 2 /* dynamic */) {
    throw new Error(`Unfinished param "${buffer}"`);
  }
  consumeBuffer();
  return tokens;
}
function prepareRoutes(routes, parent) {
  for (const route of routes) {
    if (route.name) {
      route.name = route.name.replace(/-index$/, "");
    }
    if (parent && route.path.startsWith("/")) {
      route.path = route.path.slice(1);
    }
    if (route.children.length) {
      route.children = prepareRoutes(route.children, route);
    }
    if (route.children.find((childRoute) => childRoute.path === "")) {
      delete route.name;
    }
  }
  return routes;
}
function normalizeRoutes(routes, metaImports = /* @__PURE__ */ new Set()) {
  return {
    imports: metaImports,
    routes: genArrayFromRaw(routes.map((route) => {
      const file = normalize(route.file);
      const metaImportName = genSafeVariableName(file) + "Meta";
      metaImports.add(genImport(`${file}?macro=true`, [{ name: "meta", as: metaImportName }]));
      return {
        ...Object.fromEntries(Object.entries(route).map(([key, value]) => [key, JSON.stringify(value)])),
        children: route.children ? normalizeRoutes(route.children, metaImports).routes : [],
        meta: route.meta ? `{...(${metaImportName} || {}), ...${JSON.stringify(route.meta)}}` : metaImportName,
        alias: `${metaImportName}?.alias || []`,
        component: genDynamicImport(file)
      };
    }))
  };
}

const TransformMacroPlugin = createUnplugin((options) => {
  return {
    name: "nuxt:pages-macros-transform",
    enforce: "post",
    transformInclude(id) {
      if (!id || id.startsWith("\0")) {
        return;
      }
      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      return pathname.endsWith(".vue") || !!parseQuery(search).macro;
    },
    transform(code, id) {
      const s = new MagicString(code);
      const { search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      function result() {
        if (s.hasChanged()) {
          return { code: s.toString(), map: options.sourcemap && s.generateMap({ source: id, includeContent: true }) };
        }
      }
      for (const macro in options.macros) {
        const match = code.match(new RegExp(`\\b${macro}\\s*\\(\\s*`));
        if (match?.[0]) {
          s.overwrite(match.index, match.index + match[0].length, `/*#__PURE__*/ false && ${match[0]}`);
        }
      }
      if (!parseQuery(search).macro) {
        return result();
      }
      const scriptImport = findStaticImports(code).find((i) => parseQuery(i.specifier.replace("?macro=true", "")).type === "script");
      if (scriptImport) {
        const url = isAbsolute(scriptImport.specifier) ? pathToFileURL(scriptImport.specifier).href : scriptImport.specifier;
        const parsed = parseURL(decodeURIComponent(url).replace("?macro=true", ""));
        const specifier = withQuery(parsed.pathname, { macro: "true", ...parseQuery(parsed.search) });
        s.overwrite(0, code.length, `export { meta } from "${specifier}"`);
        return result();
      }
      const currentExports = findExports(code);
      for (const match of currentExports) {
        if (match.type !== "default") {
          continue;
        }
        if (match.specifier && match._type === "named") {
          s.overwrite(match.start, match.end, `export {${Object.values(options.macros).join(", ")}} from "${match.specifier}"`);
          return result();
        } else if (!options.dev) {
          s.overwrite(match.start, match.end, "/*#__PURE__*/ false &&");
          s.append("\nexport default {}");
        }
      }
      for (const macro in options.macros) {
        if (currentExports.some((e) => e.name === options.macros[macro])) {
          continue;
        }
        const { 0: match, index = 0 } = code.match(new RegExp(`\\b${macro}\\s*\\(\\s*`)) || {};
        const macroContent = match ? extractObject(code.slice(index + match.length)) : "undefined";
        s.append(`
export const ${options.macros[macro]} = ${macroContent}`);
      }
      return result();
    }
  };
});
const starts = {
  "{": "}",
  "[": "]",
  "(": ")",
  "<": ">",
  '"': '"',
  "'": "'"
};
const QUOTE_RE = /["']/;
function extractObject(code) {
  code = code.replace(/^\s*\/\/.*$/gm, "");
  const stack = [];
  let result = "";
  do {
    if (stack[0] === code[0] && result.slice(-1) !== "\\") {
      stack.shift();
    } else if (code[0] in starts && !QUOTE_RE.test(stack[0])) {
      stack.unshift(starts[code[0]]);
    }
    result += code[0];
    code = code.slice(1);
  } while (stack.length && code.length);
  return result;
}

const pagesModule = defineNuxtModule({
  meta: {
    name: "pages"
  },
  setup(_options, nuxt) {
    const pagesDirs = nuxt.options._layers.map(
      (layer) => resolve(layer.config.srcDir, layer.config.dir?.pages || "pages")
    );
    if (nuxt.options.pages === false || nuxt.options.pages !== true && !pagesDirs.some((dir) => existsSync(dir))) {
      addPlugin(resolve(distDir, "app/plugins/router"));
      return;
    }
    const runtimeDir = resolve(distDir, "pages/runtime");
    nuxt.hook("prepare:types", ({ references }) => {
      references.push({ types: "vue-router" });
    });
    nuxt.hook("builder:watch", async (event, path) => {
      const dirs = [
        nuxt.options.dir.pages,
        nuxt.options.dir.layouts,
        nuxt.options.dir.middleware
      ].filter(Boolean);
      const pathPattern = new RegExp(`(^|\\/)(${dirs.map(escapeRE).join("|")})/`);
      if (event !== "change" && path.match(pathPattern)) {
        await nuxt.callHook("builder:generateApp");
      }
    });
    nuxt.hook("app:resolve", (app) => {
      if (app.mainComponent.includes("@nuxt/ui-templates")) {
        app.mainComponent = resolve(runtimeDir, "app.vue");
      }
    });
    if (!nuxt.options.dev && nuxt.options._generate) {
      const prerenderRoutes = /* @__PURE__ */ new Set();
      nuxt.hook("modules:done", () => {
        nuxt.hook("pages:extend", (pages) => {
          prerenderRoutes.clear();
          const processPages = (pages2, currentPath = "/") => {
            for (const page of pages2) {
              if (page.path.includes(":")) {
                continue;
              }
              const route = joinURL(currentPath, page.path);
              prerenderRoutes.add(route);
              if (page.children) {
                processPages(page.children, route);
              }
            }
          };
          processPages(pages);
        });
      });
      nuxt.hook("nitro:build:before", (nitro) => {
        for (const route of nitro.options.prerender.routes || []) {
          prerenderRoutes.add(route);
        }
        nitro.options.prerender.routes = Array.from(prerenderRoutes);
      });
    }
    nuxt.hook("autoImports:extend", (autoImports) => {
      autoImports.push(
        { name: "definePageMeta", as: "definePageMeta", from: resolve(runtimeDir, "composables") },
        { name: "useLink", as: "useLink", from: "vue-router" }
      );
    });
    const macroOptions = {
      dev: nuxt.options.dev,
      sourcemap: nuxt.options.sourcemap,
      macros: {
        definePageMeta: "meta"
      }
    };
    addVitePlugin(TransformMacroPlugin.vite(macroOptions));
    addWebpackPlugin(TransformMacroPlugin.webpack(macroOptions));
    addPlugin(resolve(runtimeDir, "router"));
    addTemplate({
      filename: "routes.mjs",
      async getContents() {
        const pages = await resolvePagesRoutes();
        await nuxt.callHook("pages:extend", pages);
        const { routes, imports } = normalizeRoutes(pages);
        return [...imports, `export default ${routes}`].join("\n");
      }
    });
    addTemplate({
      filename: "router.options.mjs",
      getContents: async () => {
        const routerOptionsFiles = (await Promise.all(nuxt.options._layers.map(
          async (layer) => await findPath(resolve(layer.config.srcDir, "app/router.options"))
        ))).filter(Boolean);
        const configRouterOptions = genObjectFromRawEntries(Object.entries(nuxt.options.router.options).map(([key, value]) => [key, genString(value)]));
        return [
          ...routerOptionsFiles.map((file, index) => genImport(file, `routerOptions${index}`)),
          `const configRouterOptions = ${configRouterOptions}`,
          "export default {",
          "...configRouterOptions,",
          ...routerOptionsFiles.map((_, index) => `...routerOptions${index},`).reverse(),
          "}"
        ].join("\n");
      }
    });
    addTemplate({
      filename: "types/middleware.d.ts",
      getContents: ({ app }) => {
        const composablesFile = resolve(runtimeDir, "composables");
        const namedMiddleware = app.middleware.filter((mw) => !mw.global);
        return [
          "import type { NavigationGuard } from 'vue-router'",
          `export type MiddlewareKey = ${namedMiddleware.map((mw) => genString(mw.name)).join(" | ") || "string"}`,
          `declare module ${genString(composablesFile)} {`,
          "  interface PageMeta {",
          "    middleware?: MiddlewareKey | NavigationGuard | Array<MiddlewareKey | NavigationGuard>",
          "  }",
          "}"
        ].join("\n");
      }
    });
    addTemplate({
      filename: "types/layouts.d.ts",
      getContents: ({ app }) => {
        const composablesFile = resolve(runtimeDir, "composables");
        return [
          "import { ComputedRef, Ref } from 'vue'",
          `export type LayoutKey = ${Object.keys(app.layouts).map((name) => genString(name)).join(" | ") || "string"}`,
          `declare module ${genString(composablesFile)} {`,
          "  interface PageMeta {",
          "    layout?: false | LayoutKey | Ref<LayoutKey> | ComputedRef<LayoutKey>",
          "  }",
          "}"
        ].join("\n");
      }
    });
    nuxt.hook("prepare:types", ({ references }) => {
      references.push({ path: resolve(nuxt.options.buildDir, "types/middleware.d.ts") });
      references.push({ path: resolve(nuxt.options.buildDir, "types/layouts.d.ts") });
    });
  }
});

const metaModule = defineNuxtModule({
  meta: {
    name: "meta"
  },
  defaults: {
    charset: "utf-8",
    viewport: "width=device-width, initial-scale=1"
  },
  setup(options, nuxt) {
    const runtimeDir = nuxt.options.alias["#head"] || resolve(distDir, "head/runtime");
    nuxt.options.build.transpile.push("@vueuse/head");
    nuxt.options.alias["#head"] = runtimeDir;
    const globalMeta = defu(nuxt.options.app.head, {
      charset: options.charset,
      viewport: options.viewport
    });
    addTemplate({
      filename: "meta.config.mjs",
      getContents: () => "export default " + JSON.stringify({ globalMeta })
    });
    addPlugin({ src: resolve(runtimeDir, "plugin") });
    addPlugin({ src: resolve(runtimeDir, "lib/vueuse-head.plugin") });
  }
});

const createImportMagicComments = (options) => {
  const { chunkName, prefetch, preload } = options;
  return [
    `webpackChunkName: "${chunkName}"`,
    prefetch === true || typeof prefetch === "number" ? `webpackPrefetch: ${prefetch}` : false,
    preload === true || typeof preload === "number" ? `webpackPreload: ${preload}` : false
  ].filter(Boolean).join(", ");
};
const componentsPluginTemplate = {
  filename: "components.plugin.mjs",
  getContents({ options }) {
    return `import { defineAsyncComponent } from 'vue'
import { defineNuxtPlugin } from '#app'

const components = ${genObjectFromRawEntries(options.components.filter((c) => c.global === true).map((c) => {
      const exp = c.export === "default" ? "c.default || c" : `c['${c.export}']`;
      const comment = createImportMagicComments(c);
      return [c.pascalName, `defineAsyncComponent(${genDynamicImport(c.filePath, { comment })}.then(c => ${exp}))`];
    }))}

export default defineNuxtPlugin(nuxtApp => {
  for (const name in components) {
    nuxtApp.vueApp.component(name, components[name])
    nuxtApp.vueApp.component('Lazy' + name, components[name])
  }
})
`;
  }
};
const componentsTemplate = {
  filename: "components.mjs",
  getContents({ options }) {
    return [
      "import { defineAsyncComponent } from 'vue'",
      ...options.components.flatMap((c) => {
        const exp = c.export === "default" ? "c.default || c" : `c['${c.export}']`;
        const comment = createImportMagicComments(c);
        const nameWithSuffix = `${c.pascalName}${c.mode !== "all" ? upperFirst(c.mode) : ""}`;
        return [
          genExport(c.filePath, [{ name: c.export, as: nameWithSuffix }]),
          `export const Lazy${nameWithSuffix} = defineAsyncComponent(${genDynamicImport(c.filePath, { comment })}.then(c => ${exp}))`
        ];
      }),
      `export const componentNames = ${JSON.stringify(options.components.map((c) => c.pascalName))}`
    ].join("\n");
  }
};
const componentsTypeTemplate = {
  filename: "components.d.ts",
  getContents: ({ options }) => `// Generated by components discovery
declare module 'vue' {
  export interface GlobalComponents {
${options.components.map((c) => `    '${c.pascalName}': typeof ${genDynamicImport(isAbsolute(c.filePath) ? relative(options.buildDir, c.filePath) : c.filePath, { wrapper: false })}['${c.export}']`).join(",\n")}
${options.components.map((c) => `    'Lazy${c.pascalName}': typeof ${genDynamicImport(isAbsolute(c.filePath) ? relative(options.buildDir, c.filePath) : c.filePath, { wrapper: false })}['${c.export}']`).join(",\n")}
  }
}
${options.components.map((c) => `export const ${c.pascalName}${c.mode !== "all" ? upperFirst(c.mode) : ""}: typeof ${genDynamicImport(isAbsolute(c.filePath) ? relative(options.buildDir, c.filePath) : c.filePath, { wrapper: false })}['${c.export}']`).join("\n")}
${options.components.map((c) => `export const Lazy${c.pascalName}${c.mode !== "all" ? upperFirst(c.mode) : ""}: typeof ${genDynamicImport(isAbsolute(c.filePath) ? relative(options.buildDir, c.filePath) : c.filePath, { wrapper: false })}['${c.export}']`).join("\n")}
export const componentNames: string[]
`
};

async function scanComponents(dirs, srcDir) {
  const components = [];
  const filePaths = /* @__PURE__ */ new Set();
  const scannedPaths = [];
  for (const dir of dirs) {
    const resolvedNames = /* @__PURE__ */ new Map();
    const files = (await globby(dir.pattern, { cwd: dir.path, ignore: dir.ignore })).sort();
    for (const _file of files) {
      const filePath = join(dir.path, _file);
      if (scannedPaths.find((d) => filePath.startsWith(withTrailingSlash(d))) || isIgnored(filePath)) {
        continue;
      }
      if (filePaths.has(filePath)) {
        continue;
      }
      filePaths.add(filePath);
      const prefixParts = [].concat(
        dir.prefix ? splitByCase(dir.prefix) : [],
        dir.pathPrefix !== false ? splitByCase(relative(dir.path, dirname(filePath))) : []
      );
      let fileName = basename(filePath, extname(filePath));
      const mode = fileName.match(/(?<=\.)(client|server)$/)?.[0] || "all";
      fileName = fileName.replace(/\.(client|server)$/, "");
      if (fileName.toLowerCase() === "index") {
        fileName = dir.pathPrefix === false ? basename(dirname(filePath)) : "";
      }
      const fileNameParts = splitByCase(fileName);
      const componentNameParts = [];
      while (prefixParts.length && (prefixParts[0] || "").toLowerCase() !== (fileNameParts[0] || "").toLowerCase()) {
        componentNameParts.push(prefixParts.shift());
      }
      const componentName = pascalCase(componentNameParts) + pascalCase(fileNameParts);
      const suffix = mode !== "all" ? `-${mode}` : "";
      if (resolvedNames.has(componentName + suffix) || resolvedNames.has(componentName)) {
        console.warn(
          `Two component files resolving to the same name \`${componentName}\`:

 - ${filePath}
 - ${resolvedNames.get(componentName)}`
        );
        continue;
      }
      resolvedNames.set(componentName + suffix, filePath);
      const pascalName = pascalCase(componentName).replace(/["']/g, "");
      const kebabName = hyphenate(componentName);
      const shortPath = relative(srcDir, filePath);
      const chunkName = "components/" + kebabName + suffix;
      let component = {
        filePath,
        pascalName,
        kebabName,
        chunkName,
        shortPath,
        export: "default",
        global: dir.global,
        prefetch: Boolean(dir.prefetch),
        preload: Boolean(dir.preload),
        mode
      };
      if (typeof dir.extendComponent === "function") {
        component = await dir.extendComponent(component) || component;
      }
      if (!components.some((c) => c.pascalName === component.pascalName && ["all", component.mode].includes(c.mode))) {
        components.push(component);
      }
    }
    scannedPaths.push(dir.path);
  }
  return components;
}

function isVueTemplate(id) {
  if (id.endsWith(".vue")) {
    return true;
  }
  const { search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
  if (!search) {
    return false;
  }
  const query = parseQuery(search);
  if (query.macro) {
    return true;
  }
  if (!("vue" in query) || query.type === "style") {
    return false;
  }
  return true;
}
const loaderPlugin = createUnplugin((options) => {
  const exclude = options.transform?.exclude || [];
  const include = options.transform?.include || [];
  return {
    name: "nuxt:components-loader",
    enforce: "post",
    transformInclude(id) {
      if (exclude.some((pattern) => id.match(pattern))) {
        return false;
      }
      if (include.some((pattern) => id.match(pattern))) {
        return true;
      }
      return isVueTemplate(id);
    },
    transform(code, id) {
      const components = options.getComponents();
      let num = 0;
      const imports = /* @__PURE__ */ new Set();
      const map = /* @__PURE__ */ new Map();
      const s = new MagicString(code);
      s.replace(/(?<=[ (])_?resolveComponent\(\s*["'](lazy-|Lazy)?([^'"]*?)["'][\s,]*\)/g, (full, lazy, name) => {
        const component = findComponent(components, name, options.mode);
        if (component) {
          const identifier = map.get(component) || `__nuxt_component_${num++}`;
          map.set(component, identifier);
          const isClientOnly = component.mode === "client";
          if (isClientOnly) {
            imports.add(genImport("#app/components/client-only", [{ name: "createClientOnly" }]));
          }
          if (lazy) {
            imports.add(genImport("vue", [{ name: "defineAsyncComponent", as: "__defineAsyncComponent" }]));
            imports.add(`const ${identifier}_lazy = __defineAsyncComponent(${genDynamicImport(component.filePath)})`);
            return isClientOnly ? `createClientOnly(${identifier}_lazy)` : `${identifier}_lazy`;
          } else {
            imports.add(genImport(component.filePath, [{ name: component.export, as: identifier }]));
            return isClientOnly ? `createClientOnly(${identifier})` : identifier;
          }
        }
        return full;
      });
      if (imports.size) {
        s.prepend([...imports, ""].join("\n"));
      }
      if (s.hasChanged()) {
        return {
          code: s.toString(),
          map: options.sourcemap && s.generateMap({ source: id, includeContent: true })
        };
      }
    }
  };
});
function findComponent(components, name, mode) {
  const id = pascalCase(name).replace(/["']/g, "");
  const component = components.find((component2) => id === component2.pascalName && ["all", mode, void 0].includes(component2.mode));
  if (!component && components.some((component2) => id === component2.pascalName)) {
    return components.find((component2) => component2.pascalName === "ServerPlaceholder");
  }
  return component;
}

const TreeShakeTemplatePlugin = createUnplugin((options) => {
  const regexpMap = /* @__PURE__ */ new WeakMap();
  return {
    name: "nuxt:tree-shake-template",
    enforce: "pre",
    transformInclude(id) {
      const { pathname } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      return pathname.endsWith(".vue");
    },
    transform(code, id) {
      const components = options.getComponents();
      if (!regexpMap.has(components)) {
        const clientOnlyComponents = components.filter((c) => c.mode === "client" && !components.some((other) => other.mode !== "client" && other.pascalName === c.pascalName)).map((c) => `${c.pascalName}|${c.kebabName}`).concat("ClientOnly|client-only").map((component) => `<(${component})[^>]*>[\\s\\S]*?<\\/(${component})>`);
        regexpMap.set(components, new RegExp(`(${clientOnlyComponents.join("|")})`, "g"));
      }
      const COMPONENTS_RE = regexpMap.get(components);
      const s = new MagicString(code);
      s.replace(COMPONENTS_RE, (r) => r.replace(/<([^ >]*)[ >][\s\S]*$/, "<$1 />"));
      if (s.hasChanged()) {
        return {
          code: s.toString(),
          map: options.sourcemap && s.generateMap({ source: id, includeContent: true })
        };
      }
    }
  };
});

const isPureObjectOrString = (val) => !Array.isArray(val) && typeof val === "object" || typeof val === "string";
const isDirectory = (p) => {
  try {
    return statSync(p).isDirectory();
  } catch (_e) {
    return false;
  }
};
function compareDirByPathLength({ path: pathA }, { path: pathB }) {
  return pathB.split(/[\\/]/).filter(Boolean).length - pathA.split(/[\\/]/).filter(Boolean).length;
}
const componentsModule = defineNuxtModule({
  meta: {
    name: "components",
    configKey: "components"
  },
  defaults: {
    dirs: []
  },
  setup(componentOptions, nuxt) {
    let componentDirs = [];
    const components = [];
    const normalizeDirs = (dir, cwd) => {
      if (Array.isArray(dir)) {
        return dir.map((dir2) => normalizeDirs(dir2, cwd)).flat().sort(compareDirByPathLength);
      }
      if (dir === true || dir === void 0) {
        return [{ path: resolve(cwd, "components") }];
      }
      if (typeof dir === "string") {
        return {
          path: resolve(cwd, resolveAlias(dir))
        };
      }
      if (!dir) {
        return [];
      }
      const dirs = (dir.dirs || [dir]).map((dir2) => typeof dir2 === "string" ? { path: dir2 } : dir2).filter((_dir) => _dir.path);
      return dirs.map((_dir) => ({
        ..._dir,
        path: resolve(cwd, resolveAlias(_dir.path))
      }));
    };
    nuxt.hook("app:resolve", async () => {
      const allDirs = nuxt.options._layers.map((layer) => normalizeDirs(layer.config.components, layer.config.srcDir)).flat();
      await nuxt.callHook("components:dirs", allDirs);
      componentDirs = allDirs.filter(isPureObjectOrString).map((dir) => {
        const dirOptions = typeof dir === "object" ? dir : { path: dir };
        const dirPath = resolveAlias(dirOptions.path);
        const transpile = typeof dirOptions.transpile === "boolean" ? dirOptions.transpile : "auto";
        const extensions = (dirOptions.extensions || nuxt.options.extensions).map((e) => e.replace(/^\./g, ""));
        dirOptions.level = Number(dirOptions.level || 0);
        const present = isDirectory(dirPath);
        if (!present && basename(dirOptions.path) !== "components") {
          console.warn("Components directory not found: `" + dirPath + "`");
        }
        return {
          global: componentOptions.global,
          ...dirOptions,
          enabled: true,
          path: dirPath,
          extensions,
          pattern: dirOptions.pattern || `**/*.{${extensions.join(",")},}`,
          ignore: [
            "**/*{M,.m,-m}ixin.{js,ts,jsx,tsx}",
            "**/*.d.ts",
            ...dirOptions.ignore || []
          ],
          transpile: transpile === "auto" ? dirPath.includes("node_modules") : transpile
        };
      }).filter((d) => d.enabled);
      nuxt.options.build.transpile.push(...componentDirs.filter((dir) => dir.transpile).map((dir) => dir.path));
    });
    const options = { components, buildDir: nuxt.options.buildDir };
    addTemplate({
      ...componentsTypeTemplate,
      options
    });
    addPluginTemplate({
      ...componentsPluginTemplate,
      options
    });
    nuxt.options.alias["#components"] = resolve(nuxt.options.buildDir, componentsTemplate.filename);
    addTemplate({
      ...componentsTemplate,
      options
    });
    nuxt.hook("app:templates", async () => {
      options.components = await scanComponents(componentDirs, nuxt.options.srcDir);
      await nuxt.callHook("components:extend", options.components);
    });
    nuxt.hook("prepare:types", ({ references }) => {
      references.push({ path: resolve(nuxt.options.buildDir, "components.d.ts") });
    });
    nuxt.hook("builder:watch", async (event, path) => {
      if (!["add", "unlink"].includes(event)) {
        return;
      }
      const fPath = resolve(nuxt.options.rootDir, path);
      if (componentDirs.find((dir) => fPath.startsWith(dir.path))) {
        await nuxt.callHook("builder:generateApp");
      }
    });
    const getComponents = () => options.components;
    nuxt.hook("vite:extendConfig", (config, { isClient }) => {
      config.plugins = config.plugins || [];
      config.plugins.push(loaderPlugin.vite({
        sourcemap: nuxt.options.sourcemap,
        getComponents,
        mode: isClient ? "client" : "server"
      }));
      if (nuxt.options.experimental.treeshakeClientOnly) {
        config.plugins.push(TreeShakeTemplatePlugin.vite({ sourcemap: nuxt.options.sourcemap, getComponents }));
      }
    });
    nuxt.hook("webpack:config", (configs) => {
      configs.forEach((config) => {
        config.plugins = config.plugins || [];
        config.plugins.push(loaderPlugin.webpack({
          sourcemap: nuxt.options.sourcemap,
          getComponents,
          mode: config.name === "client" ? "client" : "server"
        }));
        if (nuxt.options.experimental.treeshakeClientOnly) {
          config.plugins.push(TreeShakeTemplatePlugin.webpack({ sourcemap: nuxt.options.sourcemap, getComponents }));
        }
      });
    });
  }
});

const TransformPlugin = createUnplugin(({ ctx, options, sourcemap }) => {
  return {
    name: "nuxt:auto-imports-transform",
    enforce: "post",
    transformInclude(id) {
      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      const query = parseQuery(search);
      if (options.transform?.include?.some((pattern) => id.match(pattern))) {
        return true;
      }
      if (options.transform?.exclude?.some((pattern) => id.match(pattern))) {
        return false;
      }
      if (id.endsWith(".vue") || "macro" in query || "vue" in query && (query.type === "template" || query.type === "script" || "setup" in query)) {
        return true;
      }
      if (pathname.match(/\.((c|m)?j|t)sx?$/g)) {
        return true;
      }
    },
    async transform(code, id) {
      id = normalize(id);
      const isNodeModule = id.match(/[\\/]node_modules[\\/]/) && !options.transform?.include?.some((pattern) => id.match(pattern));
      if (isNodeModule && !code.match(/(['"])#imports\1/)) {
        return;
      }
      const { s } = await ctx.injectImports(code, id, { autoImport: !isNodeModule });
      if (s.hasChanged()) {
        return {
          code: s.toString(),
          map: sourcemap && s.generateMap({ source: id, includeContent: true })
        };
      }
    }
  };
});

const commonPresets = [
  defineUnimportPreset({
    from: "#head",
    imports: [
      "useHead",
      "useMeta"
    ]
  }),
  defineUnimportPreset({
    from: "vue-demi",
    imports: [
      "isVue2",
      "isVue3"
    ]
  })
];
const appPreset = defineUnimportPreset({
  from: "#app",
  imports: [
    "useAsyncData",
    "useLazyAsyncData",
    "refreshNuxtData",
    "defineNuxtComponent",
    "useNuxtApp",
    "defineNuxtPlugin",
    "useRuntimeConfig",
    "useState",
    "useFetch",
    "useLazyFetch",
    "useCookie",
    "useRequestHeaders",
    "useRequestEvent",
    "useRouter",
    "useRoute",
    "useActiveRoute",
    "defineNuxtRouteMiddleware",
    "navigateTo",
    "abortNavigation",
    "addRouteMiddleware",
    "throwError",
    "showError",
    "clearError",
    "isNuxtError",
    "useError",
    "createError",
    "defineNuxtLink"
  ]
});
const vuePreset = defineUnimportPreset({
  from: "vue",
  imports: [
    "withCtx",
    "withDirectives",
    "withKeys",
    "withMemo",
    "withModifiers",
    "withScopeId",
    "onActivated",
    "onBeforeMount",
    "onBeforeUnmount",
    "onBeforeUpdate",
    "onDeactivated",
    "onErrorCaptured",
    "onMounted",
    "onRenderTracked",
    "onRenderTriggered",
    "onServerPrefetch",
    "onUnmounted",
    "onUpdated",
    "computed",
    "customRef",
    "isProxy",
    "isReactive",
    "isReadonly",
    "isRef",
    "markRaw",
    "proxyRefs",
    "reactive",
    "readonly",
    "ref",
    "shallowReactive",
    "shallowReadonly",
    "shallowRef",
    "toRaw",
    "toRef",
    "toRefs",
    "triggerRef",
    "unref",
    "watch",
    "watchEffect",
    "isShallow",
    "effect",
    "effectScope",
    "getCurrentScope",
    "onScopeDispose",
    "defineComponent",
    "defineAsyncComponent",
    "resolveComponent",
    "getCurrentInstance",
    "h",
    "inject",
    "nextTick",
    "provide",
    "useAttrs",
    "useCssModule",
    "useCssVars",
    "useSlots",
    "useTransitionState"
  ]
});
const defaultPresets = [
  ...commonPresets,
  appPreset,
  vuePreset
];

const autoImportsModule = defineNuxtModule({
  meta: {
    name: "auto-imports",
    configKey: "autoImports"
  },
  defaults: {
    presets: defaultPresets,
    global: false,
    imports: [],
    dirs: [],
    transform: {
      include: [],
      exclude: void 0
    }
  },
  async setup(options, nuxt) {
    await nuxt.callHook("autoImports:sources", options.presets);
    options.presets.forEach((i) => {
      if (typeof i !== "string" && i.names && !i.imports) {
        i.imports = i.names;
        logger.warn("auto-imports: presets.names is deprecated, use presets.imports instead");
      }
    });
    const ctx = createUnimport({
      presets: options.presets,
      imports: options.imports,
      virtualImports: ["#imports"],
      addons: {
        vueTemplate: true
      }
    });
    let composablesDirs = [];
    for (const layer of nuxt.options._layers) {
      composablesDirs.push(resolve(layer.config.srcDir, "composables"));
      for (const dir of layer.config.autoImports?.dirs ?? []) {
        composablesDirs.push(resolve(layer.config.srcDir, dir));
      }
    }
    await nuxt.callHook("autoImports:dirs", composablesDirs);
    composablesDirs = composablesDirs.map((dir) => normalize(dir));
    addTemplate({
      filename: "imports.mjs",
      getContents: () => ctx.toExports() + '\nif (process.dev) { console.warn("[nuxt] `#imports` should be transformed with real imports. There seems to be something wrong with the auto-imports plugin.") }'
    });
    nuxt.options.alias["#imports"] = join(nuxt.options.buildDir, "imports");
    if (nuxt.options.dev && options.global) {
      addPluginTemplate({
        filename: "auto-imports.mjs",
        getContents: () => {
          const imports = ctx.getImports();
          const importStatement = toImports(imports);
          const globalThisSet = imports.map((i) => `globalThis.${i.as} = ${i.as};`).join("\n");
          return `${importStatement}

${globalThisSet}

export default () => {};`;
        }
      });
    } else {
      addVitePlugin(TransformPlugin.vite({ ctx, options, sourcemap: nuxt.options.sourcemap }));
      addWebpackPlugin(TransformPlugin.webpack({ ctx, options, sourcemap: nuxt.options.sourcemap }));
    }
    const regenerateAutoImports = async () => {
      ctx.clearDynamicImports();
      await ctx.modifyDynamicImports(async (imports) => {
        imports.push(...await scanDirExports(composablesDirs));
        await nuxt.callHook("autoImports:extend", imports);
      });
    };
    await regenerateAutoImports();
    addDeclarationTemplates(ctx);
    nuxt.hook("prepare:types", ({ references }) => {
      references.push({ path: resolve(nuxt.options.buildDir, "types/auto-imports.d.ts") });
      references.push({ path: resolve(nuxt.options.buildDir, "imports.d.ts") });
    });
    nuxt.hook("builder:watch", async (_, path) => {
      const _resolved = resolve(nuxt.options.srcDir, path);
      if (composablesDirs.find((dir) => _resolved.startsWith(dir))) {
        await nuxt.callHook("builder:generateApp");
      }
    });
    nuxt.hook("builder:generateApp", async () => {
      await regenerateAutoImports();
    });
  }
});
function addDeclarationTemplates(ctx) {
  const nuxt = useNuxt();
  const stripExtension = (path) => path.replace(/\.[a-z]+$/, "");
  const resolved = {};
  const r = ({ from }) => {
    if (resolved[from]) {
      return resolved[from];
    }
    let path = resolveAlias(from);
    if (isAbsolute(path)) {
      path = relative(join(nuxt.options.buildDir, "types"), path);
    }
    path = stripExtension(path);
    resolved[from] = path;
    return path;
  };
  addTemplate({
    filename: "imports.d.ts",
    getContents: () => ctx.toExports(nuxt.options.buildDir)
  });
  addTemplate({
    filename: "types/auto-imports.d.ts",
    getContents: () => "// Generated by auto imports\n" + ctx.generateTypeDeclarations({ resolvePath: r })
  });
}

const version = "3.0.0-rc.6";

const _require = createRequire(import.meta.url);
const vueAppPatterns = (nuxt) => [
  [/^(nuxt3|nuxt)$/, "`nuxt3`/`nuxt` cannot be imported directly. Instead, import runtime Nuxt composables from `#app` or `#imports`."],
  [/nuxt\.config/, "Importing directly from a `nuxt.config` file is not allowed. Instead, use runtime config or a module."],
  [/(^|node_modules\/)@vue\/composition-api/],
  ...nuxt.options.modules.filter((m) => typeof m === "string").map((m) => [new RegExp(`^${escapeRE(m)}$`), "Importing directly from module entry points is not allowed."]),
  ...[/(^|node_modules\/)@nuxt\/kit/, /^nitropack/].map((i) => [i, "This module cannot be imported in the Vue part of your app."]),
  [new RegExp(escapeRE(resolve(nuxt.options.srcDir, nuxt.options.dir.server || "server")) + "\\/(api|routes|middleware|plugins)\\/"), "Importing from server is not allowed in the Vue part of your app."]
];
const ImportProtectionPlugin = createUnplugin(function(options) {
  const cache = {};
  const importersToExclude = options?.exclude || [];
  return {
    name: "nuxt:import-protection",
    enforce: "pre",
    resolveId(id, importer) {
      if (importersToExclude.some((p) => typeof p === "string" ? importer === p : p.test(importer))) {
        return;
      }
      const invalidImports = options.patterns.filter(([pattern]) => pattern instanceof RegExp ? pattern.test(id) : pattern === id);
      let matched;
      for (const match of invalidImports) {
        cache[id] = cache[id] || /* @__PURE__ */ new Map();
        const [pattern, warning] = match;
        if (cache[id].has(pattern)) {
          continue;
        }
        const relativeImporter = isAbsolute(importer) ? relative(options.rootDir, importer) : importer;
        logger.error(warning || "Invalid import", `[importing \`${id}\` from \`${relativeImporter}\`]`);
        cache[id].set(pattern, true);
        matched = true;
      }
      if (matched) {
        return _require.resolve("unenv/runtime/mock/proxy");
      }
      return null;
    }
  };
});

const UnctxTransformPlugin = (nuxt) => {
  const transformer = createTransformer({
    asyncFunctions: ["defineNuxtPlugin", "defineNuxtRouteMiddleware"]
  });
  let app;
  nuxt.hook("app:resolve", (_app) => {
    app = _app;
  });
  return createUnplugin((options = {}) => ({
    name: "unctx:transfrom",
    enforce: "post",
    transformInclude(id) {
      return Boolean(app?.plugins.find((i) => i.src === id) || app.middleware.find((m) => m.path === id));
    },
    transform(code, id) {
      const result = transformer.transform(code);
      if (result) {
        return {
          code: result.code,
          map: options.sourcemap && result.magicString.generateMap({ source: id, includeContent: true })
        };
      }
    }
  }));
};

const TreeShakePlugin = createUnplugin((options) => {
  const COMPOSABLE_RE = new RegExp(`($\\s+)(${options.treeShake.join("|")})(?=\\()`, "gm");
  return {
    name: "nuxt:server-treeshake:transfrom",
    enforce: "post",
    transformInclude(id) {
      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      const { type } = parseQuery(search);
      if (pathname.endsWith(".vue") && (type === "script" || !search)) {
        return true;
      }
      if (pathname.match(/\.((c|m)?j|t)sx?$/g)) {
        return true;
      }
    },
    transform(code, id) {
      if (!code.match(COMPOSABLE_RE)) {
        return;
      }
      const s = new MagicString(code);
      const strippedCode = stripLiteral(code);
      for (const match of strippedCode.matchAll(COMPOSABLE_RE) || []) {
        s.overwrite(match.index, match.index + match[0].length, `${match[1]} /*#__PURE__*/ false && ${match[2]}`);
      }
      if (s.hasChanged()) {
        return {
          code: s.toString(),
          map: options.sourcemap && s.generateMap({ source: id, includeContent: true })
        };
      }
    }
  };
});

const addModuleTranspiles = (opts = {}) => {
  const nuxt = useNuxt();
  const modules = [
    ...opts.additionalModules || [],
    ...nuxt.options.buildModules,
    ...nuxt.options.modules,
    ...nuxt.options._modules
  ].map((m) => typeof m === "string" ? m : Array.isArray(m) ? m[0] : m.src).filter((m) => typeof m === "string").map((m) => m.split("node_modules/").pop());
  nuxt.options.build.transpile = nuxt.options.build.transpile.map((m) => typeof m === "string" ? m.split("node_modules/").pop() : m);
  function isTranspilePresent(mod) {
    return nuxt.options.build.transpile.some((t) => !(t instanceof Function) && (t instanceof RegExp ? t.test(mod) : new RegExp(t).test(mod)));
  }
  for (const module of modules) {
    if (!isTranspilePresent(module)) {
      nuxt.options.build.transpile.push(module);
    }
  }
};

async function initNitro(nuxt) {
  const { handlers, devHandlers } = await resolveHandlers(nuxt);
  const _nitroConfig = nuxt.options.nitro || {};
  const nitroConfig = defu(_nitroConfig, {
    rootDir: nuxt.options.rootDir,
    srcDir: join(nuxt.options.srcDir, "server"),
    dev: nuxt.options.dev,
    preset: nuxt.options.dev ? "nitro-dev" : void 0,
    buildDir: nuxt.options.buildDir,
    scanDirs: nuxt.options._layers.map((layer) => join(layer.config.srcDir, "server")),
    renderer: resolve(distDir, "core/runtime/nitro/renderer"),
    errorHandler: resolve(distDir, "core/runtime/nitro/error"),
    nodeModulesDirs: nuxt.options.modulesDir,
    handlers,
    devHandlers: [],
    baseURL: nuxt.options.app.baseURL,
    virtual: {},
    runtimeConfig: {
      ...nuxt.options.runtimeConfig,
      nitro: {
        envPrefix: "NUXT_",
        ...nuxt.options.runtimeConfig.nitro
      }
    },
    typescript: {
      generateTsConfig: false
    },
    publicAssets: [
      { dir: resolve(nuxt.options.buildDir, "dist/client") },
      ...nuxt.options._layers.map((layer) => join(layer.config.srcDir, layer.config.dir?.public || "public")).filter((dir) => existsSync(dir)).map((dir) => ({ dir }))
    ],
    prerender: {
      crawlLinks: nuxt.options._generate ? nuxt.options.generate.crawler : false,
      routes: [].concat(nuxt.options._generate ? ["/", ...nuxt.options.generate.routes] : []).concat(nuxt.options.ssr === false ? ["/", "/200", "/404"] : [])
    },
    sourcemap: nuxt.options.sourcemap,
    externals: {
      inline: [
        ...nuxt.options.dev ? [] : [
          ...nuxt.options.experimental.externalVue ? [] : ["vue", "@vue/"],
          "@nuxt/",
          nuxt.options.buildDir
        ],
        "nuxt/dist",
        "nuxt3/dist"
      ]
    },
    alias: {
      ...nuxt.options.experimental.externalVue ? {} : {
        "vue/compiler-sfc": "vue/compiler-sfc",
        "vue/server-renderer": "vue/server-renderer",
        vue: await resolvePath(`vue/dist/vue.cjs${nuxt.options.dev ? "" : ".prod"}.js`)
      },
      "estree-walker": "unenv/runtime/mock/proxy",
      "@babel/parser": "unenv/runtime/mock/proxy",
      "@vue/compiler-core": "unenv/runtime/mock/proxy",
      "@vue/compiler-dom": "unenv/runtime/mock/proxy",
      "@vue/compiler-ssr": "unenv/runtime/mock/proxy",
      "@vue/devtools-api": "unenv/runtime/mock/proxy-cjs",
      "#paths": resolve(distDir, "core/runtime/nitro/paths"),
      ...nuxt.options.alias
    },
    replace: {
      "process.env.NUXT_NO_SSR": nuxt.options.ssr === false,
      "process.dev": nuxt.options.dev
    },
    rollupConfig: {
      plugins: []
    }
  });
  if (!nuxt.options.ssr) {
    nitroConfig.virtual["#build/dist/server/server.mjs"] = "export default () => {}";
  }
  nitroConfig.rollupConfig.plugins.push(ImportProtectionPlugin.rollup({
    rootDir: nuxt.options.rootDir,
    patterns: [
      ...["#app", /^#build(\/|$)/].map((p) => [p, "Vue app aliases are not allowed in server routes."])
    ],
    exclude: [/core[\\/]runtime[\\/]nitro[\\/]renderer/]
  }));
  await nuxt.callHook("nitro:config", nitroConfig);
  const nitro = await createNitro(nitroConfig);
  await nuxt.callHook("nitro:init", nitro);
  nitro.vfs = nuxt.vfs = nitro.vfs || nuxt.vfs || {};
  nuxt.hook("close", () => nitro.hooks.callHook("close"));
  const devMidlewareHandler = dynamicEventHandler();
  nitro.options.devHandlers.unshift({ handler: devMidlewareHandler });
  nitro.options.devHandlers.push(...devHandlers);
  nitro.options.handlers.unshift({
    route: "/__nuxt_error",
    lazy: true,
    handler: resolve(distDir, "core/runtime/nitro/renderer")
  });
  nuxt.hook("prepare:types", async (opts) => {
    if (!nuxt.options.dev) {
      await scanHandlers(nitro);
      await writeTypes(nitro);
    }
    opts.references.push({ path: resolve(nuxt.options.buildDir, "types/nitro.d.ts") });
  });
  nuxt.hook("build:done", async () => {
    await nuxt.callHook("nitro:build:before", nitro);
    if (nuxt.options.dev) {
      await build$1(nitro);
    } else {
      await prepare(nitro);
      await copyPublicAssets(nitro);
      await prerender(nitro);
      if (!nuxt.options._generate) {
        await build$1(nitro);
      } else {
        const distDir2 = resolve(nuxt.options.rootDir, "dist");
        if (!existsSync(distDir2)) {
          await promises.symlink(nitro.options.output.publicDir, distDir2, "junction").catch(() => {
          });
        }
      }
    }
  });
  if (nuxt.options.dev) {
    nuxt.hook("build:compile", ({ compiler }) => {
      compiler.outputFileSystem = { ...fsExtra, join };
    });
    nuxt.hook("server:devMiddleware", (m) => {
      devMidlewareHandler.set(toEventHandler(m));
    });
    nuxt.server = createDevServer(nitro);
    nuxt.hook("build:resources", () => {
      nuxt.server.reload();
    });
    const waitUntilCompile = new Promise((resolve2) => nitro.hooks.hook("compiled", () => resolve2()));
    nuxt.hook("build:done", () => waitUntilCompile);
  }
}
async function resolveHandlers(nuxt) {
  const handlers = [...nuxt.options.serverHandlers];
  const devHandlers = [...nuxt.options.devServerHandlers];
  for (let m of nuxt.options.serverMiddleware) {
    if (typeof m === "string" || typeof m === "function") {
      m = { handler: m };
    }
    const route = m.path || m.route || "/";
    const handler = m.handler || m.handle;
    if (typeof handler !== "string" || typeof route !== "string") {
      devHandlers.push({ route, handler });
    } else {
      delete m.handler;
      delete m.path;
      handlers.push({
        ...m,
        route,
        middleware: true,
        handler: await resolvePath(handler)
      });
    }
  }
  return {
    handlers,
    devHandlers
  };
}

function createNuxt(options) {
  const hooks = createHooks();
  const nuxt = {
    _version: version,
    options,
    hooks,
    callHook: hooks.callHook,
    addHooks: hooks.addHooks,
    hook: hooks.hook,
    ready: () => initNuxt(nuxt),
    close: () => Promise.resolve(hooks.callHook("close", nuxt)),
    vfs: {}
  };
  return nuxt;
}
async function initNuxt(nuxt) {
  nuxt.hooks.addHooks(nuxt.options.hooks);
  nuxtCtx.set(nuxt);
  nuxt.hook("close", () => nuxtCtx.unset());
  nuxt.hook("prepare:types", (opts) => {
    opts.references.push({ types: "nuxt" });
    opts.references.push({ path: resolve(nuxt.options.buildDir, "types/plugins.d.ts") });
    if (nuxt.options.typescript.shim) {
      opts.references.push({ path: resolve(nuxt.options.buildDir, "types/vue-shim.d.ts") });
    }
    opts.references.push({ path: resolve(nuxt.options.buildDir, "types/schema.d.ts") });
  });
  const config = {
    rootDir: nuxt.options.rootDir,
    patterns: vueAppPatterns(nuxt)
  };
  addVitePlugin(ImportProtectionPlugin.vite(config));
  addWebpackPlugin(ImportProtectionPlugin.webpack(config));
  addVitePlugin(UnctxTransformPlugin(nuxt).vite({ sourcemap: nuxt.options.sourcemap }));
  addWebpackPlugin(UnctxTransformPlugin(nuxt).webpack({ sourcemap: nuxt.options.sourcemap }));
  if (!nuxt.options.dev) {
    const removeFromServer = ["onBeforeMount", "onMounted", "onBeforeUpdate", "onRenderTracked", "onRenderTriggered", "onActivated", "onDeactivated", "onBeforeUnmount"];
    const removeFromClient = ["onServerPrefetch", "onRenderTracked", "onRenderTriggered"];
    addVitePlugin(TreeShakePlugin.vite({ sourcemap: nuxt.options.sourcemap, treeShake: removeFromServer }), { client: false });
    addVitePlugin(TreeShakePlugin.vite({ sourcemap: nuxt.options.sourcemap, treeShake: removeFromClient }), { server: false });
    addWebpackPlugin(TreeShakePlugin.webpack({ sourcemap: nuxt.options.sourcemap, treeShake: removeFromServer }), { client: false });
    addWebpackPlugin(TreeShakePlugin.webpack({ sourcemap: nuxt.options.sourcemap, treeShake: removeFromClient }), { server: false });
  }
  nuxt.options.build.transpile.push(
    ...nuxt.options._layers.filter((i) => i.cwd && i.cwd.includes("node_modules")).map((i) => i.cwd)
  );
  await nuxt.callHook("modules:before", { nuxt });
  const modulesToInstall = [
    ...nuxt.options.buildModules,
    ...nuxt.options.modules,
    ...nuxt.options._modules
  ];
  addComponent({
    name: "NuxtWelcome",
    filePath: tryResolveModule("@nuxt/ui-templates/templates/welcome.vue")
  });
  addComponent({
    name: "NuxtLayout",
    filePath: resolve(nuxt.options.appDir, "components/layout")
  });
  addComponent({
    name: "NuxtErrorBoundary",
    filePath: resolve(nuxt.options.appDir, "components/nuxt-error-boundary")
  });
  addComponent({
    name: "ClientOnly",
    filePath: resolve(nuxt.options.appDir, "components/client-only")
  });
  addComponent({
    name: "ServerPlaceholder",
    filePath: resolve(nuxt.options.appDir, "components/server-placeholder")
  });
  addComponent({
    name: "NuxtLink",
    filePath: resolve(nuxt.options.appDir, "components/nuxt-link")
  });
  addComponent({
    name: "NuxtLoadingIndicator",
    filePath: resolve(nuxt.options.appDir, "components/nuxt-loading-indicator")
  });
  for (const m of modulesToInstall) {
    if (Array.isArray(m)) {
      await installModule(m[0], m[1]);
    } else {
      await installModule(m, {});
    }
  }
  await nuxt.callHook("modules:done", { nuxt });
  nuxt.options.build.transpile = nuxt.options.build.transpile.map((t) => typeof t === "string" ? normalize(t) : t);
  addModuleTranspiles();
  await initNitro(nuxt);
  await nuxt.callHook("ready", nuxt);
}
async function loadNuxt(opts) {
  const options = await loadNuxtConfig(opts);
  options.appDir = options.alias["#app"] = resolve(distDir, "app");
  options._majorVersion = 3;
  options._modules.push(pagesModule, metaModule, componentsModule);
  options._modules.push([autoImportsModule, {
    transform: {
      include: options._layers.filter((i) => i.cwd && i.cwd.includes("node_modules")).map((i) => new RegExp(`(^|\\/)${escapeRE(i.cwd.split("node_modules/").pop())}(\\/|$)(?!node_modules\\/)`))
    }
  }]);
  options.modulesDir.push(resolve(pkgDir, "node_modules"));
  options.build.transpile.push("@nuxt/ui-templates");
  options.alias["vue-demi"] = resolve(options.appDir, "compat/vue-demi");
  options.alias["@vue/composition-api"] = resolve(options.appDir, "compat/capi");
  if (options.telemetry !== false && !process.env.NUXT_TELEMETRY_DISABLED) {
    options._modules.push("@nuxt/telemetry");
  }
  const nuxt = createNuxt(options);
  if (opts.ready !== false) {
    await nuxt.ready();
  }
  return nuxt;
}
function defineNuxtConfig(config) {
  return config;
}

const vueShim = {
  filename: "types/vue-shim.d.ts",
  getContents: () => [
    "declare module '*.vue' {",
    "  import { DefineComponent } from '@vue/runtime-core'",
    "  const component: DefineComponent<{}, {}, any>",
    "  export default component",
    "}"
  ].join("\n")
};
const appComponentTemplate = {
  filename: "app-component.mjs",
  getContents: (ctx) => genExport(ctx.app.mainComponent, ["default"])
};
const rootComponentTemplate = {
  filename: "root-component.mjs",
  getContents: (ctx) => genExport(ctx.app.rootComponent, ["default"])
};
const errorComponentTemplate = {
  filename: "error-component.mjs",
  getContents: (ctx) => genExport(ctx.app.errorComponent, ["default"])
};
const cssTemplate = {
  filename: "css.mjs",
  getContents: (ctx) => ctx.nuxt.options.css.map((i) => genImport(i)).join("\n")
};
const clientPluginTemplate = {
  filename: "plugins/client.mjs",
  getContents(ctx) {
    const clientPlugins = ctx.app.plugins.filter((p) => !p.mode || p.mode !== "server");
    const rootDir = ctx.nuxt.options.rootDir;
    const { imports, exports } = templateUtils.importSources(clientPlugins.map((p) => p.src), rootDir);
    return [
      ...imports,
      `export default ${genArrayFromRaw(exports)}`
    ].join("\n");
  }
};
const serverPluginTemplate = {
  filename: "plugins/server.mjs",
  getContents(ctx) {
    const serverPlugins = ctx.app.plugins.filter((p) => !p.mode || p.mode !== "client");
    const rootDir = ctx.nuxt.options.rootDir;
    const { imports, exports } = templateUtils.importSources(serverPlugins.map((p) => p.src), rootDir);
    return [
      "import preload from '#app/plugins/preload.server'",
      ...imports,
      `export default ${genArrayFromRaw([
        "preload",
        ...exports
      ])}`
    ].join("\n");
  }
};
const pluginsDeclaration = {
  filename: "types/plugins.d.ts",
  getContents: (ctx) => {
    const EXTENSION_RE = new RegExp(`(?<=\\w)(${ctx.nuxt.options.extensions.map((e) => escapeRE(e)).join("|")})$`, "g");
    const tsImports = ctx.app.plugins.map((p) => (isAbsolute(p.src) ? relative(join(ctx.nuxt.options.buildDir, "types"), p.src) : p.src).replace(EXTENSION_RE, ""));
    return `// Generated by Nuxt'
import type { Plugin } from '#app'

type Decorate<T extends Record<string, any>> = { [K in keyof T as K extends string ? \`$\${K}\` : never]: T[K] }

type InjectionType<A extends Plugin> = A extends Plugin<infer T> ? Decorate<T> : unknown

type NuxtAppInjections = 
  ${tsImports.map((p) => `InjectionType<typeof ${genDynamicImport(p, { wrapper: false })}.default>`).join(" &\n  ")}

declare module '#app' {
  interface NuxtApp extends NuxtAppInjections { }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties extends NuxtAppInjections { }
}

export { }
`;
  }
};
const adHocModules = ["router", "pages", "auto-imports", "meta", "components"];
const schemaTemplate = {
  filename: "types/schema.d.ts",
  getContents: ({ nuxt }) => {
    const moduleInfo = nuxt.options._installedModules.map((m) => ({
      ...m.meta || {},
      importName: m.entryPath || m.meta?.name
    })).filter((m) => m.configKey && m.name && !adHocModules.includes(m.name));
    return [
      "import { NuxtModule } from '@nuxt/schema'",
      "declare module '@nuxt/schema' {",
      "  interface NuxtConfig {",
      ...moduleInfo.filter(Boolean).map(
        (meta) => `    [${genString(meta.configKey)}]?: typeof ${genDynamicImport(meta.importName, { wrapper: false })}.default extends NuxtModule<infer O> ? Partial<O> : Record<string, any>`
      ),
      "  }",
      generateTypes(
        resolveSchema(Object.fromEntries(Object.entries(nuxt.options.runtimeConfig).filter(([key]) => key !== "public"))),
        {
          interfaceName: "RuntimeConfig",
          addExport: false,
          addDefaults: false,
          allowExtraKeys: false,
          indentation: 2
        }
      ),
      generateTypes(
        resolveSchema(nuxt.options.runtimeConfig.public),
        {
          interfaceName: "PublicRuntimeConfig",
          addExport: false,
          addDefaults: false,
          allowExtraKeys: false,
          indentation: 2
        }
      ),
      "}"
    ].join("\n");
  }
};
const layoutTemplate = {
  filename: "layouts.mjs",
  getContents({ app }) {
    const layoutsObject = genObjectFromRawEntries(Object.values(app.layouts).map(({ name, file }) => {
      return [name, `defineAsyncComponent(${genDynamicImport(file)})`];
    }));
    return [
      "import { defineAsyncComponent } from 'vue'",
      `export default ${layoutsObject}`
    ].join("\n");
  }
};
const middlewareTemplate = {
  filename: "middleware.mjs",
  getContents({ app }) {
    const globalMiddleware = app.middleware.filter((mw) => mw.global);
    const namedMiddleware = app.middleware.filter((mw) => !mw.global);
    const namedMiddlewareObject = genObjectFromRawEntries(namedMiddleware.map((mw) => [mw.name, genDynamicImport(mw.path)]));
    return [
      ...globalMiddleware.map((mw) => genImport(mw.path, genSafeVariableName(mw.name))),
      `export const globalMiddleware = ${genArrayFromRaw(globalMiddleware.map((mw) => genSafeVariableName(mw.name)))}`,
      `export const namedMiddleware = ${namedMiddlewareObject}`
    ].join("\n");
  }
};
const clientConfigTemplate = {
  filename: "nitro.client.mjs",
  getContents: () => `
export const useRuntimeConfig = () => window?.__NUXT__?.config || {}
`
};
const publicPathTemplate = {
  filename: "paths.mjs",
  getContents({ nuxt }) {
    return [
      "import { joinURL } from 'ufo'",
      !nuxt.options.dev && "import { useRuntimeConfig } from '#internal/nitro'",
      nuxt.options.dev ? `const appConfig = ${JSON.stringify(nuxt.options.app)}` : "const appConfig = useRuntimeConfig().app",
      "export const baseURL = () => appConfig.baseURL",
      "export const buildAssetsDir = () => appConfig.buildAssetsDir",
      "export const buildAssetsURL = (...path) => joinURL(publicAssetsURL(), buildAssetsDir(), ...path)",
      "export const publicAssetsURL = (...path) => {",
      "  const publicBase = appConfig.cdnURL || appConfig.baseURL",
      "  return path.length ? joinURL(publicBase, ...path) : publicBase",
      "}",
      "globalThis.__buildAssetsURL = buildAssetsURL",
      "globalThis.__publicAssetsURL = publicAssetsURL"
    ].filter(Boolean).join("\n");
  }
};

const defaultTemplates = {
  __proto__: null,
  vueShim: vueShim,
  appComponentTemplate: appComponentTemplate,
  rootComponentTemplate: rootComponentTemplate,
  errorComponentTemplate: errorComponentTemplate,
  cssTemplate: cssTemplate,
  clientPluginTemplate: clientPluginTemplate,
  serverPluginTemplate: serverPluginTemplate,
  pluginsDeclaration: pluginsDeclaration,
  schemaTemplate: schemaTemplate,
  layoutTemplate: layoutTemplate,
  middlewareTemplate: middlewareTemplate,
  clientConfigTemplate: clientConfigTemplate,
  publicPathTemplate: publicPathTemplate
};

function createApp(nuxt, options = {}) {
  return defu(options, {
    dir: nuxt.options.srcDir,
    extensions: nuxt.options.extensions,
    plugins: [],
    templates: []
  });
}
async function generateApp(nuxt, app) {
  await resolveApp(nuxt, app);
  app.templates = Object.values(defaultTemplates).concat(nuxt.options.build.templates);
  await nuxt.callHook("app:templates", app);
  app.templates = app.templates.map((tmpl) => normalizeTemplate(tmpl));
  const templateContext = { utils: templateUtils, nuxt, app };
  await Promise.all(app.templates.map(async (template) => {
    const contents = await compileTemplate(template, templateContext);
    const fullPath = template.dst || resolve(nuxt.options.buildDir, template.filename);
    nuxt.vfs[fullPath] = contents;
    const aliasPath = "#build/" + template.filename.replace(/\.\w+$/, "");
    nuxt.vfs[aliasPath] = contents;
    if (process.platform === "win32") {
      nuxt.vfs[fullPath.replace(/\//g, "\\")] = contents;
    }
    if (template.write) {
      await promises.mkdir(dirname(fullPath), { recursive: true });
      await promises.writeFile(fullPath, contents, "utf8");
    }
  }));
  await nuxt.callHook("app:templatesGenerated", app);
}
async function resolveApp(nuxt, app) {
  if (!app.mainComponent) {
    app.mainComponent = await findPath(["~/App", "~/app"]);
  }
  if (!app.mainComponent) {
    app.mainComponent = tryResolveModule("@nuxt/ui-templates/templates/welcome.vue");
  }
  if (!app.rootComponent) {
    app.rootComponent = await findPath(["~/app.root", resolve(nuxt.options.appDir, "components/nuxt-root.vue")]);
  }
  if (!app.errorComponent) {
    app.errorComponent = await findPath(["~/error"]) || resolve(nuxt.options.appDir, "components/nuxt-error-page.vue");
  }
  app.layouts = {};
  for (const config of nuxt.options._layers.map((layer) => layer.config)) {
    const layoutFiles = await resolveFiles(config.srcDir, `${config.dir?.layouts || "layouts"}/*{${nuxt.options.extensions.join(",")}}`);
    for (const file of layoutFiles) {
      const name = getNameFromPath(file);
      app.layouts[name] = app.layouts[name] || { name, file };
    }
  }
  app.middleware = [];
  for (const config of nuxt.options._layers.map((layer) => layer.config)) {
    const middlewareFiles = await resolveFiles(config.srcDir, `${config.dir?.middleware || "middleware"}/*{${nuxt.options.extensions.join(",")}}`);
    app.middleware.push(...middlewareFiles.map((file) => {
      const name = getNameFromPath(file);
      return { name, path: file, global: hasSuffix(file, ".global") };
    }));
  }
  app.middleware = uniqueBy(app.middleware, "name");
  app.plugins = [
    ...nuxt.options.plugins.map(normalizePlugin)
  ];
  for (const config of nuxt.options._layers.map((layer) => layer.config)) {
    app.plugins.push(...[
      ...config.plugins || [],
      ...await resolveFiles(config.srcDir, [
        "plugins/*.{ts,js,mjs,cjs,mts,cts}",
        "plugins/*/index.*{ts,js,mjs,cjs,mts,cts}"
      ])
    ].map((plugin) => normalizePlugin(plugin)));
  }
  app.plugins = uniqueBy(app.plugins, "src");
  await nuxt.callHook("app:resolve", app);
}

async function build(nuxt) {
  const app = createApp(nuxt);
  const generateApp$1 = debounce(() => generateApp(nuxt, app), void 0, { leading: true });
  await generateApp$1();
  if (nuxt.options.dev) {
    watch(nuxt);
    nuxt.hook("builder:watch", async (event, path) => {
      if (event !== "change" && /^(app\.|error\.|plugins\/|middleware\/|layouts\/)/i.test(path)) {
        if (path.startsWith("app")) {
          app.mainComponent = null;
        }
        if (path.startsWith("error")) {
          app.errorComponent = null;
        }
        await generateApp$1();
      }
    });
    nuxt.hook("builder:generateApp", generateApp$1);
  }
  await nuxt.callHook("build:before", { nuxt }, nuxt.options.build);
  if (!nuxt.options._prepare) {
    await bundle(nuxt);
    await nuxt.callHook("build:done", { nuxt });
  }
  if (!nuxt.options.dev) {
    await nuxt.callHook("close", nuxt);
  }
}
function watch(nuxt) {
  const watcher = chokidar.watch(nuxt.options._layers.map((i) => i.config.srcDir), {
    ...nuxt.options.watchers.chokidar,
    cwd: nuxt.options.srcDir,
    ignoreInitial: true,
    ignored: [
      isIgnored,
      ".nuxt",
      "node_modules"
    ]
  });
  watcher.on("all", (event, path) => nuxt.callHook("builder:watch", event, normalize(path)));
  nuxt.hook("close", () => watcher.close());
  return watcher;
}
async function bundle(nuxt) {
  try {
    const { bundle: bundle2 } = typeof nuxt.options.builder === "string" ? await importModule(nuxt.options.builder, { paths: nuxt.options.rootDir }) : nuxt.options.builder;
    return bundle2(nuxt);
  } catch (error) {
    await nuxt.callHook("build:error", error);
    if (error.toString().includes("Cannot find module '@nuxt/webpack-builder'")) {
      throw new Error([
        "Could not load `@nuxt/webpack-builder`. You may need to add it to your project dependencies, following the steps in `https://github.com/nuxt/framework/pull/2812`."
      ].join("\n"));
    }
    throw error;
  }
}

export { build, createNuxt, defineNuxtConfig, loadNuxt };