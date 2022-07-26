import * as vite from 'vite';
import { resolve, join, dirname, isAbsolute, normalize, relative } from 'pathe';
import { logger, isIgnored, resolveModule, requireModule } from '@nuxt/kit';
import replace from '@rollup/plugin-replace';
import { resolvePath, sanitizeFilePath } from 'mlly';
import vuePlugin from '@vitejs/plugin-vue';
import viteJsxPlugin from '@vitejs/plugin-vue-jsx';
import { getPort } from 'get-port-please';
import { joinURL, withTrailingSlash, withoutLeadingSlash, withLeadingSlash, parseURL } from 'ufo';
import escapeRE from 'escape-string-regexp';
import { transform } from 'esbuild';
import { visualizer } from 'rollup-plugin-visualizer';
import fse from 'fs-extra';
import { existsSync } from 'node:fs';
import { hash } from 'ohash';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createApp, defineEventHandler, defineLazyEventHandler, createError } from 'h3';
import { ViteNodeServer } from 'vite-node/server';
import { statSync } from 'fs';
import { debounce } from 'perfect-debounce';
import { builtinModules } from 'node:module';
import { ExternalsDefaults, isExternal as isExternal$1 } from 'externality';
import { genObjectFromRawEntries, genDynamicImport } from 'knitwork';
import { createUnplugin } from 'unplugin';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';

function cacheDirPlugin(rootDir, name) {
  const optimizeCacheDir = resolve(rootDir, "node_modules/.cache/vite", name);
  return {
    name: "nuxt:cache-dir",
    configResolved(resolvedConfig) {
      resolvedConfig.optimizeCacheDir = optimizeCacheDir;
    }
  };
}

function analyzePlugin(ctx) {
  return [
    {
      name: "nuxt:analyze-minify",
      async generateBundle(_opts, outputBundle) {
        for (const [_bundleId, bundle] of Object.entries(outputBundle)) {
          if (bundle.type !== "chunk") {
            continue;
          }
          const originalEntries = Object.entries(bundle.modules);
          const minifiedEntries = await Promise.all(originalEntries.map(async ([moduleId, module]) => {
            const { code } = await transform(module.code || "", { minify: true });
            return [moduleId, { ...module, code }];
          }));
          bundle.modules = Object.fromEntries(minifiedEntries);
        }
        return null;
      }
    },
    visualizer({
      ...ctx.nuxt.options.build.analyze,
      filename: ctx.nuxt.options.build.analyze.filename.replace("{name}", "client"),
      title: "Client bundle stats",
      gzipSize: true
    })
  ];
}

const wpfs = {
  ...fse,
  join
};

async function writeManifest(ctx, extraEntries = []) {
  const clientDist = resolve(ctx.nuxt.options.buildDir, "dist/client");
  const serverDist = resolve(ctx.nuxt.options.buildDir, "dist/server");
  const entries = [
    "@vite/client",
    "entry.mjs",
    ...extraEntries
  ];
  const devClientManifest = {
    publicPath: joinURL(ctx.nuxt.options.app.baseURL, ctx.nuxt.options.app.buildAssetsDir),
    all: entries,
    initial: entries,
    async: [],
    modules: {}
  };
  const clientManifest = ctx.nuxt.options.dev ? devClientManifest : await fse.readJSON(resolve(clientDist, "manifest.json"));
  const buildAssetsDir = withTrailingSlash(withoutLeadingSlash(ctx.nuxt.options.app.buildAssetsDir));
  const BASE_RE = new RegExp(`^${escapeRE(buildAssetsDir)}`);
  for (const key in clientManifest) {
    if (clientManifest[key].file) {
      clientManifest[key].file = clientManifest[key].file.replace(BASE_RE, "");
    }
    for (const item of ["css", "assets"]) {
      if (clientManifest[key][item]) {
        clientManifest[key][item] = clientManifest[key][item].map((i) => i.replace(BASE_RE, ""));
      }
    }
  }
  await fse.mkdirp(serverDist);
  await fse.writeFile(resolve(serverDist, "client.manifest.json"), JSON.stringify(clientManifest, null, 2), "utf8");
  await fse.writeFile(resolve(serverDist, "client.manifest.mjs"), "export default " + JSON.stringify(clientManifest, null, 2), "utf8");
}

function uniq(arr) {
  return Array.from(new Set(arr));
}
const IS_CSS_RE = /\.(?:css|scss|sass|postcss|less|stylus|styl)(\?[^.]+)?$/;
function isCSS(file) {
  return IS_CSS_RE.test(file);
}
function hashId(id) {
  return "$id_" + hash(id);
}

function devStyleSSRPlugin(options) {
  return {
    name: "nuxt:dev-style-ssr",
    apply: "serve",
    enforce: "post",
    transform(code, id) {
      if (!isCSS(id) || !code.includes("import.meta.hot")) {
        return;
      }
      let moduleId = id;
      if (moduleId.startsWith(options.rootDir)) {
        moduleId = moduleId.slice(options.rootDir.length);
      }
      const selector = joinURL(options.buildAssetsURL, moduleId);
      return code + `
document.querySelectorAll(\`link[href="${selector}"]\`).forEach(i=>i.remove())`;
    }
  };
}

const distDir = dirname(fileURLToPath(import.meta.url));
resolve(distDir, "..");

function viteNodePlugin(ctx) {
  return {
    name: "nuxt:vite-node-server",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use("/__nuxt_vite_node__", createViteNodeMiddleware(ctx));
    }
  };
}
function getManifest(server) {
  const ids = Array.from(server.moduleGraph.urlToModuleMap.keys()).filter((i) => isCSS(i));
  const entries = [
    "@vite/client",
    "entry.mjs",
    ...ids.map((i) => i.slice(1))
  ];
  return {
    publicPath: "",
    all: entries,
    initial: entries,
    async: [],
    modules: {}
  };
}
function createViteNodeMiddleware(ctx) {
  const app = createApp();
  app.use("/manifest", defineEventHandler(() => {
    const manifest = getManifest(ctx.ssrServer);
    return manifest;
  }));
  app.use("/module", defineLazyEventHandler(() => {
    const node = new ViteNodeServer(ctx.ssrServer, {
      deps: {
        inline: [
          /\/(nuxt|nuxt3)\//,
          /^#/,
          ...ctx.nuxt.options.build.transpile
        ]
      },
      transformMode: {
        ssr: [/.*/],
        web: []
      }
    });
    return async (event) => {
      const moduleId = decodeURI(event.req.url).substring(1);
      if (moduleId === "/") {
        throw createError({ statusCode: 400 });
      }
      const module = await node.fetchModule(moduleId);
      return module;
    };
  }));
  return app.nodeHandler;
}
async function prepareDevServerEntry(ctx) {
  let entryPath = resolve(ctx.nuxt.options.appDir, "entry.async.mjs");
  if (!fse.existsSync(entryPath)) {
    entryPath = resolve(ctx.nuxt.options.appDir, "entry.async");
  }
  const host = ctx.nuxt.options.server.host || "localhost";
  const port = ctx.nuxt.options.server.port || "3000";
  const protocol = ctx.nuxt.options.server.https ? "https" : "http";
  const viteNodeServerOptions = {
    baseURL: `${protocol}://${host}:${port}/__nuxt_vite_node__`,
    rootDir: ctx.nuxt.options.rootDir,
    entryPath,
    base: ctx.ssrServer.config.base || "/_nuxt/"
  };
  process.env.NUXT_VITE_NODE_OPTIONS = JSON.stringify(viteNodeServerOptions);
  const serverResolvedPath = resolve(distDir, "runtime/vite-node.mjs");
  const manifestResolvedPath = resolve(distDir, "runtime/client.manifest.mjs");
  await fse.writeFile(
    resolve(ctx.nuxt.options.buildDir, "dist/server/server.mjs"),
    `export { default } from ${JSON.stringify(pathToFileURL(serverResolvedPath).href)}`
  );
  await fse.writeFile(
    resolve(ctx.nuxt.options.buildDir, "dist/server/client.manifest.mjs"),
    `export { default } from ${JSON.stringify(pathToFileURL(manifestResolvedPath).href)}`
  );
}

async function buildClient(ctx) {
  const hmrPortDefault = 24678;
  const hmrPort = await getPort({
    port: hmrPortDefault,
    ports: Array.from({ length: 20 }, (_, i) => hmrPortDefault + 1 + i)
  });
  const clientConfig = vite.mergeConfig(ctx.config, {
    experimental: {
      renderBuiltUrl: (filename, { type, hostType }) => {
        if (hostType !== "js" || type === "asset") {
          return { relative: true };
        }
        return { runtime: `globalThis.__publicAssetsURL(${JSON.stringify(filename)})` };
      }
    },
    define: {
      "process.server": false,
      "process.client": true,
      "module.hot": false
    },
    resolve: {
      alias: {
        "#build/plugins": resolve(ctx.nuxt.options.buildDir, "plugins/client"),
        "#internal/nitro": resolve(ctx.nuxt.options.buildDir, "nitro.client.mjs")
      }
    },
    build: {
      rollupOptions: {
        output: {
          assetFileNames: ctx.nuxt.options.dev ? void 0 : withoutLeadingSlash(join(ctx.nuxt.options.app.buildAssetsDir, "[name].[hash].[ext]")),
          chunkFileNames: ctx.nuxt.options.dev ? void 0 : withoutLeadingSlash(join(ctx.nuxt.options.app.buildAssetsDir, "[name].[hash].mjs")),
          entryFileNames: ctx.nuxt.options.dev ? "entry.mjs" : withoutLeadingSlash(join(ctx.nuxt.options.app.buildAssetsDir, "[name].[hash].mjs"))
        }
      },
      manifest: true,
      outDir: resolve(ctx.nuxt.options.buildDir, "dist/client")
    },
    plugins: [
      cacheDirPlugin(ctx.nuxt.options.rootDir, "client"),
      vuePlugin(ctx.config.vue),
      viteJsxPlugin(),
      devStyleSSRPlugin({
        rootDir: ctx.nuxt.options.rootDir,
        buildAssetsURL: joinURL(ctx.nuxt.options.app.baseURL, ctx.nuxt.options.app.buildAssetsDir)
      }),
      viteNodePlugin(ctx)
    ],
    appType: "custom",
    server: {
      hmr: {
        protocol: "ws",
        clientPort: hmrPort,
        port: hmrPort
      },
      middlewareMode: true
    }
  });
  if (!ctx.nuxt.options.dev) {
    clientConfig.server.hmr = false;
  }
  if (ctx.nuxt.options.build.analyze) {
    clientConfig.plugins.push(...analyzePlugin(ctx));
  }
  await ctx.nuxt.callHook("vite:extendConfig", clientConfig, { isClient: true, isServer: false });
  if (ctx.nuxt.options.dev) {
    const viteServer = await vite.createServer(clientConfig);
    ctx.clientServer = viteServer;
    await ctx.nuxt.callHook("vite:serverCreated", viteServer, { isClient: true, isServer: false });
    const baseURL = joinURL(ctx.nuxt.options.app.baseURL.replace(/^\./, "") || "/", ctx.nuxt.options.app.buildAssetsDir);
    const BASE_RE = new RegExp(`^${escapeRE(withTrailingSlash(withLeadingSlash(baseURL)))}`);
    const viteMiddleware = (req, res, next) => {
      const originalURL = req.url;
      req.url = req.url.replace(BASE_RE, "/");
      viteServer.middlewares.handle(req, res, (err) => {
        req.url = originalURL;
        next(err);
      });
    };
    await ctx.nuxt.callHook("server:devMiddleware", viteMiddleware);
    ctx.nuxt.hook("close", async () => {
      await viteServer.close();
    });
  } else {
    const start = Date.now();
    await vite.build(clientConfig);
    await ctx.nuxt.callHook("build:resources", wpfs);
    logger.info(`Client built in ${Date.now() - start}ms`);
  }
  await writeManifest(ctx);
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var ParseOptions;
(function (ParseOptions) {
    ParseOptions.DEFAULT = {
        allowTrailingComma: false
    };
})(ParseOptions || (ParseOptions = {}));

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __assign = (/home/mklaproth/Projects/nuxt-render-hooks/packages/vite && /home/mklaproth/Projects/nuxt-render-hooks/packages/vite.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

const defaultFindOptions = {
  startingFrom: ".",
  rootPattern: /^node_modules$/,
  test: (filePath) => {
    try {
      if (statSync(filePath).isFile()) {
        return true;
      }
    } catch {
    }
    return null;
  }
};
async function findNearestFile(filename, _options = {}) {
  const options = { ...defaultFindOptions, ..._options };
  const basePath = resolve(options.startingFrom);
  const leadingSlash = basePath[0] === "/";
  const segments = basePath.split("/").filter(Boolean);
  if (leadingSlash) {
    segments[0] = "/" + segments[0];
  }
  let root = segments.findIndex((r) => r.match(options.rootPattern));
  if (root === -1)
    root = 0;
  for (let i = segments.length; i > root; i--) {
    const filePath = join(...segments.slice(0, i), filename);
    if (await options.test(filePath)) {
      return filePath;
    }
  }
  throw new Error(`Cannot find matching ${filename} in ${options.startingFrom} or parent directories`);
}
async function resolveTSConfig(id = process.cwd(), opts = {}) {
  const resolvedPath = isAbsolute(id) ? id : await resolvePath(id, opts);
  return findNearestFile("tsconfig.json", { startingFrom: resolvedPath, ...opts });
}

function isExternal(opts, id) {
  const ssrConfig = opts.viteServer.config.ssr;
  const externalOpts = {
    inline: [
      /virtual:/,
      /\.ts$/,
      ...ExternalsDefaults.inline,
      ...ssrConfig.noExternal
    ],
    external: [
      ...ssrConfig.external,
      /node_modules/
    ],
    resolve: {
      type: "module",
      extensions: [".ts", ".js", ".json", ".vue", ".mjs", ".jsx", ".tsx", ".wasm"]
    }
  };
  return isExternal$1(id, opts.viteServer.config.root, externalOpts);
}
async function transformRequest(opts, id) {
  if (id && id.startsWith("/@id/__x00__")) {
    id = "\0" + id.slice("/@id/__x00__".length);
  }
  if (id && id.startsWith("/@id/")) {
    id = id.slice("/@id/".length);
  }
  if (id && id.startsWith("/@fs/")) {
    id = id.slice("/@fs".length);
    if (id.match(/^\/\w:/)) {
      id = id.slice(1);
    }
  } else if (id.startsWith("/") && !/\/app\/entry(|.mjs)$/.test(id)) {
    const resolvedPath = resolve(opts.viteServer.config.root, "." + id);
    if (existsSync(resolvedPath)) {
      id = resolvedPath;
    }
  }
  const withoutVersionQuery = id.replace(/\?v=\w+$/, "");
  if (await isExternal(opts, withoutVersionQuery)) {
    const path = builtinModules.includes(withoutVersionQuery.split("node:").pop()) ? withoutVersionQuery : isAbsolute(withoutVersionQuery) ? pathToFileURL(withoutVersionQuery).href : withoutVersionQuery;
    return {
      code: `(global, module, _, exports, importMeta, ssrImport, ssrDynamicImport, ssrExportAll) =>
${genDynamicImport(path, { wrapper: false })}
  .then(r => {
    if (r.default && r.default.__esModule)
      r = r.default
    exports.default = r.default
    ssrExportAll(r)
  })
  .catch(e => {
    console.error(e)
    throw new Error(${JSON.stringify(`[vite dev] Error loading external "${id}".`)})
  })`,
      deps: [],
      dynamicDeps: []
    };
  }
  const res = await opts.viteServer.transformRequest(id, { ssr: true }).catch((err) => {
    console.warn(`[SSR] Error transforming ${id}:`, err);
  }) || { code: "", map: {}, deps: [], dynamicDeps: [] };
  const code = `async function (global, module, exports, __vite_ssr_exports__, __vite_ssr_import_meta__, __vite_ssr_import__, __vite_ssr_dynamic_import__, __vite_ssr_exportAll__) {
${res.code || "/* empty */"};
}`;
  return { code, deps: res.deps || [], dynamicDeps: res.dynamicDeps || [] };
}
async function transformRequestRecursive(opts, id, parent = "<entry>", chunks = {}) {
  if (chunks[id]) {
    chunks[id].parents.push(parent);
    return;
  }
  const res = await transformRequest(opts, id);
  const deps = uniq([...res.deps, ...res.dynamicDeps]);
  chunks[id] = {
    id,
    code: res.code,
    deps,
    parents: [parent]
  };
  for (const dep of deps) {
    await transformRequestRecursive(opts, dep, id, chunks);
  }
  return Object.values(chunks);
}
async function bundleRequest(opts, entryURL) {
  const chunks = await transformRequestRecursive(opts, entryURL);
  const listIds = (ids) => ids.map((id) => `// - ${id} (${hashId(id)})`).join("\n");
  const chunksCode = chunks.map((chunk) => `
// --------------------
// Request: ${chunk.id}
// Parents: 
${listIds(chunk.parents)}
// Dependencies: 
${listIds(chunk.deps)}
// --------------------
const ${hashId(chunk.id + "-" + chunk.code)} = ${chunk.code}
`).join("\n");
  const manifestCode = `const __modules__ = ${genObjectFromRawEntries(chunks.map((chunk) => [chunk.id, hashId(chunk.id + "-" + chunk.code)]))}`;
  const ssrModuleLoader = `
const __pendingModules__ = new Map()
const __pendingImports__ = new Map()
const __ssrContext__ = { global: globalThis }

function __ssrLoadModule__(url, urlStack = []) {
  const pendingModule = __pendingModules__.get(url)
  if (pendingModule) { return pendingModule }
  const modulePromise = __instantiateModule__(url, urlStack)
  __pendingModules__.set(url, modulePromise)
  modulePromise.catch(() => { __pendingModules__.delete(url) })
         .finally(() => { __pendingModules__.delete(url) })
  return modulePromise
}

async function __instantiateModule__(url, urlStack) {
  const mod = __modules__[url]
  if (mod.stubModule) { return mod.stubModule }
  const stubModule = { [Symbol.toStringTag]: 'Module' }
  Object.defineProperty(stubModule, '__esModule', { value: true })
  mod.stubModule = stubModule
  // https://vitejs.dev/guide/api-hmr.html
  const importMeta = { url, hot: { accept() {}, prune() {}, dispose() {}, invalidate() {}, decline() {}, on() {} } }
  urlStack = urlStack.concat(url)
  const isCircular = url => urlStack.includes(url)
  const pendingDeps = []
  const ssrImport = async (dep) => {
    // TODO: Handle externals if dep[0] !== '.' | '/'
    if (!isCircular(dep) && !__pendingImports__.get(dep)?.some(isCircular)) {
      pendingDeps.push(dep)
      if (pendingDeps.length === 1) {
        __pendingImports__.set(url, pendingDeps)
      }
      await __ssrLoadModule__(dep, urlStack)
      if (pendingDeps.length === 1) {
        __pendingImports__.delete(url)
      } else {
        pendingDeps.splice(pendingDeps.indexOf(dep), 1)
      }
    }
    return __modules__[dep].stubModule
  }
  function ssrDynamicImport (dep) {
    // TODO: Handle dynamic import starting with . relative to url
    return ssrImport(dep)
  }

  function ssrExportAll(sourceModule) {
    for (const key in sourceModule) {
      if (key !== 'default') {
        try {
          Object.defineProperty(stubModule, key, {
            enumerable: true,
            configurable: true,
            get() { return sourceModule[key] }
          })
        } catch (_err) { }
      }
    }
  }

  const cjsModule = {
    get exports () {
      return stubModule.default
    },
    set exports (v) {
      stubModule.default = v
    },
  }

  await mod(
    __ssrContext__.global,
    cjsModule,
    stubModule.default,
    stubModule,
    importMeta,
    ssrImport,
    ssrDynamicImport,
    ssrExportAll
  )

  return stubModule
}
`;
  const code = [
    chunksCode,
    manifestCode,
    ssrModuleLoader,
    `export default await __ssrLoadModule__(${JSON.stringify(entryURL)})`
  ].join("\n\n");
  return {
    code,
    ids: chunks.map((i) => i.id)
  };
}

async function buildServer(ctx) {
  const _resolve = (id) => resolveModule(id, { paths: ctx.nuxt.options.modulesDir });
  const serverConfig = vite.mergeConfig(ctx.config, {
    base: ctx.nuxt.options.dev ? joinURL(ctx.nuxt.options.app.baseURL.replace(/^\.\//, "/") || "/", ctx.nuxt.options.app.buildAssetsDir) : void 0,
    experimental: {
      renderBuiltUrl: (filename, { type, hostType }) => {
        if (hostType !== "js") {
          return { relative: true };
        }
        if (type === "public") {
          return { runtime: `globalThis.__publicAssetsURL(${JSON.stringify(filename)})` };
        }
        if (type === "asset") {
          const relativeFilename = filename.replace(withTrailingSlash(withoutLeadingSlash(ctx.nuxt.options.app.buildAssetsDir)), "");
          return { runtime: `globalThis.__buildAssetsURL(${JSON.stringify(relativeFilename)})` };
        }
      }
    },
    define: {
      "process.server": true,
      "process.client": false,
      "typeof window": '"undefined"',
      "typeof document": '"undefined"',
      "typeof navigator": '"undefined"',
      "typeof location": '"undefined"',
      "typeof XMLHttpRequest": '"undefined"'
    },
    resolve: {
      alias: {
        "#build/plugins": resolve(ctx.nuxt.options.buildDir, "plugins/server"),
        ...ctx.nuxt.options.experimental.externalVue || ctx.nuxt.options.dev ? {} : {
          "@vue/reactivity": _resolve(`@vue/reactivity/dist/reactivity.cjs${ctx.nuxt.options.dev ? "" : ".prod"}.js`),
          "@vue/shared": _resolve(`@vue/shared/dist/shared.cjs${ctx.nuxt.options.dev ? "" : ".prod"}.js`),
          "vue-router": _resolve(`vue-router/dist/vue-router.cjs${ctx.nuxt.options.dev ? "" : ".prod"}.js`),
          "vue/server-renderer": _resolve("vue/server-renderer"),
          "vue/compiler-sfc": _resolve("vue/compiler-sfc"),
          vue: _resolve(`vue/dist/vue.cjs${ctx.nuxt.options.dev ? "" : ".prod"}.js`)
        }
      }
    },
    ssr: {
      external: ctx.nuxt.options.experimental.externalVue ? ["#internal/nitro", "#internal/nitro/utils", "vue", "vue-router"] : ["#internal/nitro", "#internal/nitro/utils"],
      noExternal: [
        ...ctx.nuxt.options.build.transpile,
        /\/esm\/.*\.js$/,
        /\.(es|esm|esm-browser|esm-bundler).js$/,
        "/__vue-jsx",
        "#app",
        /(nuxt|nuxt3)\/(dist|src|app)/,
        /@nuxt\/nitro\/(dist|src)/
      ]
    },
    build: {
      outDir: resolve(ctx.nuxt.options.buildDir, "dist/server"),
      ssr: ctx.nuxt.options.ssr ?? true,
      rollupOptions: {
        external: ["#internal/nitro", ...ctx.nuxt.options.experimental.externalVue ? ["vue", "vue-router"] : []],
        output: {
          entryFileNames: "server.mjs",
          preferConst: true,
          inlineDynamicImports: false,
          format: "module"
        },
        onwarn(warning, rollupWarn) {
          if (!["UNUSED_EXTERNAL_IMPORT"].includes(warning.code)) {
            rollupWarn(warning);
          }
        }
      }
    },
    server: {
      preTransformRequests: false
    },
    plugins: [
      cacheDirPlugin(ctx.nuxt.options.rootDir, "server"),
      vuePlugin(ctx.config.vue),
      viteJsxPlugin()
    ]
  });
  if (ctx.nuxt.options.typescript.typeCheck === true || ctx.nuxt.options.typescript.typeCheck === "build" && !ctx.nuxt.options.dev) {
    const checker = await import('vite-plugin-checker').then((r) => r.default);
    serverConfig.plugins.push(checker({
      vueTsc: {
        tsconfigPath: await resolveTSConfig(ctx.nuxt.options.rootDir)
      }
    }));
  }
  await ctx.nuxt.callHook("vite:extendConfig", serverConfig, { isClient: false, isServer: true });
  const onBuild = () => ctx.nuxt.callHook("build:resources", wpfs);
  if (!ctx.nuxt.options.dev) {
    const start = Date.now();
    logger.info("Building server...");
    await vite.build(serverConfig);
    await onBuild();
    logger.success(`Server built in ${Date.now() - start}ms`);
    return;
  }
  if (!ctx.nuxt.options.ssr) {
    await onBuild();
    return;
  }
  const viteServer = await vite.createServer(serverConfig);
  ctx.ssrServer = viteServer;
  await ctx.nuxt.callHook("vite:serverCreated", viteServer, { isClient: false, isServer: true });
  ctx.nuxt.hook("close", () => viteServer.close());
  await viteServer.pluginContainer.buildStart({});
  if (ctx.nuxt.options.experimental.viteNode) {
    logger.info("Vite server using experimental `vite-node`...");
    await prepareDevServerEntry(ctx);
  } else {
    const _doBuild = async () => {
      const start = Date.now();
      const { code, ids } = await bundleRequest({ viteServer }, resolve(ctx.nuxt.options.appDir, "entry"));
      await fse.writeFile(resolve(ctx.nuxt.options.buildDir, "dist/server/server.mjs"), code, "utf-8");
      await writeManifest(ctx, ids.filter(isCSS).map((i) => i.slice(1)));
      const time = Date.now() - start;
      logger.success(`Vite server built in ${time}ms`);
      await onBuild();
    };
    const doBuild = debounce(_doBuild);
    await _doBuild();
    viteServer.watcher.on("all", (_event, file) => {
      file = normalize(file);
      if (file.indexOf(ctx.nuxt.options.buildDir) === 0 || isIgnored(file)) {
        return;
      }
      doBuild();
    });
    ctx.nuxt.hook("app:templatesGenerated", () => doBuild());
  }
}

const PREFIX = "virtual:nuxt:";
function virtual(vfs) {
  const extensions = ["", ".ts", ".vue", ".mjs", ".cjs", ".js", ".json"];
  const resolveWithExt = (id) => {
    for (const ext of extensions) {
      const rId = id + ext;
      if (rId in vfs) {
        return rId;
      }
    }
    return null;
  };
  return {
    name: "virtual",
    resolveId(id, importer) {
      if (process.platform === "win32" && isAbsolute(id)) {
        id = resolve(id);
      }
      const resolvedId = resolveWithExt(id);
      if (resolvedId) {
        return PREFIX + resolvedId;
      }
      if (importer && !isAbsolute(id)) {
        const importerNoPrefix = importer.startsWith(PREFIX) ? importer.slice(PREFIX.length) : importer;
        const importedDir = dirname(importerNoPrefix);
        const resolved = resolveWithExt(join(importedDir, id));
        if (resolved) {
          return PREFIX + resolved;
        }
      }
      return null;
    },
    load(id) {
      if (!id.startsWith(PREFIX)) {
        return null;
      }
      const idNoPrefix = id.slice(PREFIX.length);
      if (idNoPrefix in vfs) {
        return {
          code: vfs[idNoPrefix],
          map: null
        };
      }
    }
  };
}

async function warmupViteServer(server, entries) {
  const warmedUrls = /* @__PURE__ */ new Set();
  const warmup = async (url) => {
    if (warmedUrls.has(url)) {
      return;
    }
    warmedUrls.add(url);
    try {
      await server.transformRequest(url);
    } catch (e) {
      logger.debug("Warmup for %s failed with: %s", url, e);
    }
    const mod = await server.moduleGraph.getModuleByUrl(url);
    const deps = Array.from(mod?.importedModules || []);
    await Promise.all(deps.map((m) => warmup(m.url.replace("/@id/__x00__", "\0"))));
  };
  await Promise.all(entries.map((entry) => warmup(entry)));
}

function resolveCSSOptions(nuxt) {
  const css = {
    postcss: {
      plugins: []
    }
  };
  const lastPlugins = ["autoprefixer", "cssnano"];
  css.postcss.plugins = Object.entries(nuxt.options.postcss.plugins).sort((a, b) => lastPlugins.indexOf(a[0]) - lastPlugins.indexOf(b[0])).filter(([, opts]) => opts).map(([name, opts]) => {
    const plugin = requireModule(name, {
      paths: [
        ...nuxt.options.modulesDir,
        distDir
      ]
    });
    return plugin(opts);
  });
  return css;
}

const keyedFunctions = [
  "useState",
  "useFetch",
  "useAsyncData",
  "useLazyAsyncData",
  "useLazyFetch"
];
const KEYED_FUNCTIONS_RE = new RegExp(`(${keyedFunctions.join("|")})`);
const composableKeysPlugin = createUnplugin((options = {}) => {
  return {
    name: "nuxt:composable-keys",
    enforce: "post",
    transform(code, id) {
      const { pathname } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      if (!pathname.match(/\.(m?[jt]sx?|vue)/)) {
        return;
      }
      if (!KEYED_FUNCTIONS_RE.test(code)) {
        return;
      }
      const { 0: script = code, index: codeIndex = 0 } = code.match(/(?<=<script[^>]*>)[\S\s.]*?(?=<\/script>)/) || [];
      const s = new MagicString(code);
      const relativeID = isAbsolute(id) ? relative(options.rootDir, id) : id;
      walk(this.parse(script, {
        sourceType: "module",
        ecmaVersion: "latest"
      }), {
        enter(node) {
          if (node.type !== "CallExpression" || node.callee.type !== "Identifier") {
            return;
          }
          if (keyedFunctions.includes(node.callee.name) && node.arguments.length < 4) {
            const end = node.end;
            s.appendLeft(
              codeIndex + end - 1,
              (node.arguments.length ? ", " : "") + "'$" + hash(`${relativeID}-${codeIndex + end}`) + "'"
            );
          }
        }
      });
      if (s.hasChanged()) {
        return {
          code: s.toString(),
          map: options.sourcemap && s.generateMap({ source: id, includeContent: true })
        };
      }
    }
  };
});

async function bundle(nuxt) {
  const ctx = {
    nuxt,
    config: vite.mergeConfig(
      {
        resolve: {
          alias: {
            ...nuxt.options.alias,
            "#app": nuxt.options.appDir,
            "#build/plugins": "",
            "#build": nuxt.options.buildDir,
            "/entry.mjs": resolve(nuxt.options.appDir, nuxt.options.experimental.asyncEntry ? "entry.async" : "entry"),
            "web-streams-polyfill/ponyfill/es2018": "unenv/runtime/mock/empty",
            "abort-controller": "unenv/runtime/mock/empty"
          }
        },
        optimizeDeps: {
          entries: [
            resolve(nuxt.options.appDir, "entry.ts")
          ],
          include: ["vue"]
        },
        css: resolveCSSOptions(nuxt),
        build: {
          rollupOptions: {
            output: { sanitizeFileName: sanitizeFilePath },
            input: resolve(nuxt.options.appDir, "entry")
          },
          watch: {
            exclude: nuxt.options.ignore
          }
        },
        plugins: [
          composableKeysPlugin.vite({ sourcemap: nuxt.options.sourcemap, rootDir: nuxt.options.rootDir }),
          replace({
            ...Object.fromEntries([";", "(", "{", "}", " ", "	", "\n"].map((d) => [`${d}global.`, `${d}globalThis.`])),
            preventAssignment: true
          }),
          virtual(nuxt.vfs)
        ],
        vue: {
          reactivityTransform: nuxt.options.experimental.reactivityTransform
        },
        server: {
          watch: { ignored: isIgnored },
          fs: {
            allow: [
              nuxt.options.appDir
            ]
          }
        }
      },
      nuxt.options.vite
    )
  };
  if (!nuxt.options.dev) {
    ctx.config.server.watch = void 0;
    ctx.config.build.watch = void 0;
  }
  await nuxt.callHook("vite:extend", ctx);
  nuxt.hook("vite:serverCreated", (server, env) => {
    ctx.nuxt.hook("app:templatesGenerated", () => {
      for (const [id, mod] of server.moduleGraph.idToModuleMap) {
        if (id.startsWith("virtual:")) {
          server.moduleGraph.invalidateModule(mod);
        }
      }
    });
    const start = Date.now();
    warmupViteServer(server, ["/entry.mjs"]).then(() => logger.info(`Vite ${env.isClient ? "client" : "server"} warmed up in ${Date.now() - start}ms`)).catch(logger.error);
  });
  await buildClient(ctx);
  await buildServer(ctx);
}

export { bundle };
