import pify from 'pify';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import { parseURL, joinURL } from 'ufo';
import { useNuxt, logger, requireModule } from '@nuxt/kit';
import { pathToFileURL } from 'node:url';
import { createUnplugin } from 'unplugin';
import { isAbsolute, relative, join, resolve, normalize, dirname } from 'pathe';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import { hash } from 'ohash';
import { createFsFromVolume, Volume } from 'memfs';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import querystring from 'node:querystring';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { cloneDeep, defaults as defaults$1, merge, uniq } from 'lodash-es';
import TimeFixPlugin from 'time-fix-plugin';
import WebpackBar from 'webpackbar';
import FriendlyErrorsWebpackPlugin from '@nuxt/friendly-errors-webpack-plugin';
import escapeRegExp from 'escape-string-regexp';
import esbuildLoader from 'esbuild-loader';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { createCommonJS } from 'mlly';
import VueLoaderPlugin from 'vue-loader/dist/pluginWebpack5.js';
import hash$1 from 'hash-sum';
import fse from 'fs-extra';
import ForkTSCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

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

const defaults = {
  globalPublicPath: "__webpack_public_path__",
  sourcemap: true
};
const DynamicBasePlugin = createUnplugin((options = {}) => {
  options = { ...defaults, ...options };
  return {
    name: "nuxt:dynamic-base-path",
    enforce: "post",
    transform(code, id) {
      if (!id.includes("paths.mjs") || !code.includes("const appConfig = ")) {
        return;
      }
      const s = new MagicString(code);
      s.append(`${options.globalPublicPath} = buildAssetsURL();
`);
      return {
        code: s.toString(),
        map: options.sourcemap && s.generateMap({ source: id, includeContent: true })
      };
    }
  };
});

function createMFS() {
  const fs = createFsFromVolume(new Volume());
  const _fs = { ...fs };
  _fs.join = join;
  _fs.exists = (p) => Promise.resolve(_fs.existsSync(p));
  _fs.readFile = pify(_fs.readFile);
  return _fs;
}

function registerVirtualModules() {
  const nuxt = useNuxt();
  const virtualModules = new VirtualModulesPlugin(nuxt.vfs);
  const writeFiles = () => {
    for (const filePath in nuxt.vfs) {
      virtualModules.writeModule(filePath, nuxt.vfs[filePath]);
    }
  };
  nuxt.hook("build:compile", ({ compiler }) => {
    if (compiler.name === "server") {
      writeFiles();
    }
  });
  nuxt.hook("app:templatesGenerated", writeFiles);
  nuxt.hook("webpack:config", (configs) => configs.forEach((config) => {
    config.plugins.push(virtualModules);
  }));
}

function createWebpackConfigContext(nuxt) {
  return {
    nuxt,
    options: nuxt.options,
    config: {},
    name: "base",
    isDev: nuxt.options.dev,
    isServer: false,
    isClient: false,
    alias: {},
    transpile: []
  };
}
function applyPresets(ctx, presets) {
  if (!Array.isArray(presets)) {
    presets = [presets];
  }
  for (const preset of presets) {
    if (Array.isArray(preset)) {
      preset[0](ctx, preset[1]);
    } else {
      preset(ctx);
    }
  }
}
function fileName(ctx, key) {
  const { options } = ctx;
  let fileName2 = options.webpack.filenames[key];
  if (typeof fileName2 === "function") {
    fileName2 = fileName2(ctx);
  }
  if (typeof fileName2 === "string" && options.dev) {
    const hash = /\[(chunkhash|contenthash|hash)(?::(\d+))?]/.exec(fileName2);
    if (hash) {
      logger.warn(`Notice: Please do not use ${hash[1]} in dev mode to prevent memory leak`);
    }
  }
  return fileName2;
}
function getWebpackConfig(ctx) {
  const { options, config } = ctx;
  const builder = {};
  const loaders = [];
  const { extend } = options.build;
  if (typeof extend === "function") {
    const extendedConfig = extend.call(
      builder,
      config,
      { loaders, ...ctx }
    ) || config;
    const pragma = /@|#/;
    const { devtool } = extendedConfig;
    if (typeof devtool === "string" && pragma.test(devtool)) {
      extendedConfig.devtool = devtool.replace(pragma, "");
      logger.warn(`devtool has been normalized to ${extendedConfig.devtool} as webpack documented value`);
    }
    return extendedConfig;
  }
  return cloneDeep(config);
}

function assets(ctx) {
  ctx.config.module.rules.push(
    {
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [{
        loader: "url-loader",
        options: {
          ...ctx.options.webpack.loaders.imgUrl,
          name: fileName(ctx, "img")
        }
      }]
    },
    {
      test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
      use: [{
        loader: "url-loader",
        options: {
          ...ctx.options.webpack.loaders.fontUrl,
          name: fileName(ctx, "font")
        }
      }]
    },
    {
      test: /\.(webm|mp4|ogv)$/i,
      use: [{
        loader: "file-loader",
        options: {
          ...ctx.options.webpack.loaders.file,
          name: fileName(ctx, "video")
        }
      }]
    }
  );
}

class WarningIgnorePlugin {
  constructor(filter) {
    this.filter = filter;
  }
  apply(compiler) {
    compiler.hooks.done.tap("warnfix-plugin", (stats) => {
      stats.compilation.warnings = stats.compilation.warnings.filter(this.filter);
    });
  }
}

function base(ctx) {
  applyPresets(ctx, [
    baseAlias,
    baseConfig,
    basePlugins,
    baseResolve,
    baseTranspile
  ]);
}
function baseConfig(ctx) {
  const { options } = ctx;
  ctx.config = {
    name: ctx.name,
    entry: { app: [resolve(options.appDir, options.experimental.asyncEntry ? "entry.async" : "entry")] },
    module: { rules: [] },
    plugins: [],
    externals: [],
    optimization: {
      ...options.webpack.optimization,
      minimizer: []
    },
    experiments: {},
    mode: ctx.isDev ? "development" : "production",
    cache: getCache(ctx),
    output: getOutput(ctx),
    stats: "none",
    ...ctx.config
  };
}
function basePlugins(ctx) {
  const { config, options, nuxt } = ctx;
  if (options.dev) {
    config.plugins.push(new TimeFixPlugin());
  }
  config.plugins.push(...options.webpack.plugins || []);
  config.plugins.push(new WarningIgnorePlugin(getWarningIgnoreFilter(ctx)));
  config.plugins.push(new webpack.DefinePlugin(getEnv(ctx)));
  if (ctx.isServer || ctx.isDev && !options.build.quiet && options.webpack.friendlyErrors) {
    ctx.config.plugins.push(
      new FriendlyErrorsWebpackPlugin({
        clearConsole: false,
        reporter: "consola",
        logLevel: "ERROR"
      })
    );
  }
  if (nuxt.options.webpack.profile) {
    const colors = {
      client: "green",
      server: "orange",
      modern: "blue"
    };
    config.plugins.push(new WebpackBar({
      name: ctx.name,
      color: colors[ctx.name],
      reporters: ["stats"],
      stats: !ctx.isDev,
      reporter: {
        change: (_, { shortPath }) => {
          if (!ctx.isServer) {
            nuxt.callHook("bundler:change", shortPath);
          }
        },
        done: ({ state }) => {
          if (state.hasErrors) {
            nuxt.callHook("bundler:error");
          } else {
            logger.success(`${state.name} ${state.message}`);
          }
        },
        allDone: () => {
          nuxt.callHook("bundler:done");
        },
        progress({ statesArray }) {
          nuxt.callHook("bundler:progress", statesArray);
        }
      }
    }));
  }
}
function baseAlias(ctx) {
  const { options } = ctx;
  ctx.alias = {
    "#app": options.appDir,
    "#build/plugins": resolve(options.buildDir, "plugins", ctx.isClient ? "client" : "server"),
    "#build": options.buildDir,
    ...options.alias,
    ...ctx.alias
  };
  if (ctx.isClient) {
    ctx.alias["#internal/nitro"] = resolve(ctx.nuxt.options.buildDir, "nitro.client.mjs");
  }
}
function baseResolve(ctx) {
  const { options, config } = ctx;
  const webpackModulesDir = ["node_modules"].concat(options.modulesDir);
  config.resolve = {
    extensions: [".wasm", ".mjs", ".js", ".ts", ".json", ".vue", ".jsx", ".tsx"],
    alias: ctx.alias,
    modules: webpackModulesDir,
    fullySpecified: false,
    ...config.resolve
  };
  config.resolveLoader = {
    modules: webpackModulesDir,
    ...config.resolveLoader
  };
}
function baseTranspile(ctx) {
  const { options } = ctx;
  const transpile = [
    /\.vue\.js/i,
    /consola\/src/,
    /vue-demi/
  ];
  for (let pattern of options.build.transpile) {
    if (typeof pattern === "function") {
      pattern = pattern(ctx);
    }
    if (typeof pattern === "string") {
      transpile.push(new RegExp(escapeRegExp(normalize(pattern))));
    } else if (pattern instanceof RegExp) {
      transpile.push(pattern);
    }
  }
  ctx.transpile = [...transpile, ...ctx.transpile];
}
function getCache(ctx) {
  const { options } = ctx;
  if (!options.dev) {
    return false;
  }
}
function getOutput(ctx) {
  const { options } = ctx;
  return {
    path: resolve(options.buildDir, "dist", ctx.isServer ? "server" : joinURL("client", options.app.buildAssetsDir)),
    filename: fileName(ctx, "app"),
    chunkFilename: fileName(ctx, "chunk"),
    publicPath: joinURL(options.app.baseURL, options.app.buildAssetsDir)
  };
}
function getWarningIgnoreFilter(ctx) {
  const { options } = ctx;
  const filters = [
    (warn) => warn.name === "ModuleDependencyWarning" && warn.message.includes("export 'default'") && warn.message.includes("nuxt_plugin_"),
    ...options.webpack.warningIgnoreFilters || []
  ];
  return (warn) => !filters.some((ignoreFilter) => ignoreFilter(warn));
}
function getEnv(ctx) {
  const { options } = ctx;
  const _env = {
    "process.env.NODE_ENV": JSON.stringify(ctx.config.mode),
    "process.mode": JSON.stringify(ctx.config.mode),
    "process.dev": options.dev,
    "process.static": options.target === "static",
    "process.target": JSON.stringify(options.target),
    "process.env.VUE_ENV": JSON.stringify(ctx.name),
    "process.browser": ctx.isClient,
    "process.client": ctx.isClient,
    "process.server": ctx.isServer
  };
  if (options.webpack.aggressiveCodeRemoval) {
    _env["typeof process"] = JSON.stringify(ctx.isServer ? "object" : "undefined");
    _env["typeof window"] = _env["typeof document"] = JSON.stringify(!ctx.isServer ? "object" : "undefined");
  }
  Object.entries(options.env).forEach(([key, value]) => {
    const isNative = ["boolean", "number"].includes(typeof value);
    _env["process.env." + key] = isNative ? value : JSON.stringify(value);
  });
  return _env;
}

function esbuild(ctx) {
  const { config } = ctx;
  const target = ctx.isServer ? "es2019" : "chrome85";
  config.optimization.minimizer.push(new esbuildLoader.ESBuildMinifyPlugin());
  config.module.rules.push(
    {
      test: /\.m?[jt]s$/i,
      loader: "esbuild-loader",
      exclude: (file) => {
        file = file.split("node_modules", 2)[1];
        if (!file) {
          return false;
        }
        return !ctx.transpile.some((module) => module.test(file));
      },
      resolve: {
        fullySpecified: false
      },
      options: {
        loader: "ts",
        target
      }
    },
    {
      test: /\.m?[jt]sx$/,
      loader: "esbuild-loader",
      options: {
        loader: "tsx",
        target
      }
    }
  );
}

function pug(ctx) {
  ctx.config.module.rules.push({
    test: /\.pug$/i,
    oneOf: [
      {
        resourceQuery: /^\?vue/i,
        use: [{
          loader: "pug-plain-loader",
          options: ctx.options.webpack.loaders.pugPlain
        }]
      },
      {
        use: [
          "raw-loader",
          {
            loader: "pug-plain-loader",
            options: ctx.options.webpack.loaders.pugPlain
          }
        ]
      }
    ]
  });
}

const isPureObject = (obj) => obj !== null && !Array.isArray(obj) && typeof obj === "object";
const orderPresets = {
  cssnanoLast(names) {
    const nanoIndex = names.indexOf("cssnano");
    if (nanoIndex !== names.length - 1) {
      names.push(names.splice(nanoIndex, 1)[0]);
    }
    return names;
  },
  autoprefixerLast(names) {
    const nanoIndex = names.indexOf("autoprefixer");
    if (nanoIndex !== names.length - 1) {
      names.push(names.splice(nanoIndex, 1)[0]);
    }
    return names;
  },
  autoprefixerAndCssnanoLast(names) {
    return orderPresets.cssnanoLast(orderPresets.autoprefixerLast(names));
  }
};
const getPostcssConfig = (nuxt) => {
  function defaultConfig() {
    return {
      sourceMap: nuxt.options.webpack.cssSourceMap,
      plugins: nuxt.options.postcss.plugins,
      order: "autoprefixerAndCssnanoLast"
    };
  }
  function sortPlugins({ plugins, order }) {
    const names = Object.keys(plugins);
    if (typeof order === "string") {
      order = orderPresets[order];
    }
    return typeof order === "function" ? order(names, orderPresets) : order || names;
  }
  function loadPlugins(config) {
    if (!isPureObject(config.plugins)) {
      return;
    }
    const cjs = createCommonJS(import.meta.url);
    config.plugins = sortPlugins(config).map((pluginName) => {
      const pluginFn = requireModule(pluginName, { paths: [cjs.__dirname] });
      const pluginOptions = config.plugins[pluginName];
      if (!pluginOptions || typeof pluginFn !== "function") {
        return null;
      }
      return pluginFn(pluginOptions);
    }).filter(Boolean);
  }
  if (!nuxt.options.webpack.postcss || !nuxt.options.postcss) {
    return false;
  }
  const configFile = nuxt.options.postcss.config;
  if (configFile) {
    return {
      postcssOptions: {
        config: configFile
      },
      sourceMap: nuxt.options.webpack.cssSourceMap
    };
  }
  let postcssOptions = cloneDeep(nuxt.options.postcss);
  if (isPureObject(postcssOptions)) {
    if (Array.isArray(postcssOptions.plugins)) {
      defaults$1(postcssOptions, defaultConfig());
    } else {
      postcssOptions = merge({}, defaultConfig(), postcssOptions);
      loadPlugins(postcssOptions);
    }
    delete nuxt.options.webpack.postcss.order;
    return {
      sourceMap: nuxt.options.webpack.cssSourceMap,
      ...nuxt.options.webpack.postcss,
      postcssOptions
    };
  }
};

function style(ctx) {
  applyPresets(ctx, [
    loaders,
    extractCSS,
    minimizer
  ]);
}
function minimizer(ctx) {
  const { options, config } = ctx;
  if (options.webpack.optimizeCSS && Array.isArray(config.optimization.minimizer)) {
    config.optimization.minimizer.push(new CssMinimizerPlugin({
      ...options.webpack.optimizeCSS
    }));
  }
}
function extractCSS(ctx) {
  const { options, config } = ctx;
  if (options.webpack.extractCSS) {
    config.plugins.push(new MiniCssExtractPlugin({
      filename: fileName(ctx, "css"),
      chunkFilename: fileName(ctx, "css"),
      ...options.webpack.extractCSS === true ? {} : options.webpack.extractCSS
    }));
  }
}
function loaders(ctx) {
  const { config, options } = ctx;
  config.module.rules.push(createdStyleRule("css", /\.css$/i, null, ctx));
  config.module.rules.push(createdStyleRule("postcss", /\.p(ost)?css$/i, null, ctx));
  const lessLoader = { loader: "less-loader", options: options.webpack.loaders.less };
  config.module.rules.push(createdStyleRule("less", /\.less$/i, lessLoader, ctx));
  const sassLoader = { loader: "sass-loader", options: options.webpack.loaders.sass };
  config.module.rules.push(createdStyleRule("sass", /\.sass$/i, sassLoader, ctx));
  const scssLoader = { loader: "sass-loader", options: options.webpack.loaders.scss };
  config.module.rules.push(createdStyleRule("scss", /\.scss$/i, scssLoader, ctx));
  const stylusLoader = { loader: "stylus-loader", options: options.webpack.loaders.stylus };
  config.module.rules.push(createdStyleRule("stylus", /\.styl(us)?$/i, stylusLoader, ctx));
}
function createdStyleRule(lang, test, processorLoader, ctx) {
  const { options } = ctx;
  const styleLoaders = [
    createPostcssLoadersRule(ctx),
    processorLoader
  ].filter(Boolean);
  options.webpack.loaders.css.importLoaders = options.webpack.loaders.cssModules.importLoaders = styleLoaders.length;
  const cssLoaders = createCssLoadersRule(ctx, options.webpack.loaders.css);
  const cssModuleLoaders = createCssLoadersRule(ctx, options.webpack.loaders.cssModules);
  return {
    test,
    oneOf: [
      {
        resourceQuery: /module/,
        use: cssModuleLoaders.concat(styleLoaders)
      },
      {
        use: cssLoaders.concat(styleLoaders)
      }
    ]
  };
}
function createCssLoadersRule(ctx, cssLoaderOptions) {
  const { options } = ctx;
  const cssLoader = { loader: "css-loader", options: cssLoaderOptions };
  if (options.webpack.extractCSS) {
    if (ctx.isServer) {
      if (cssLoader.options.modules) {
        cssLoader.options.modules.exportOnlyLocals = cssLoader.options.modules.exportOnlyLocals ?? true;
      }
      return [cssLoader];
    }
    return [
      {
        loader: MiniCssExtractPlugin.loader
      },
      cssLoader
    ];
  }
  return [
    cssLoader
  ];
}
function createPostcssLoadersRule(ctx) {
  const { options, nuxt } = ctx;
  if (!options.postcss) {
    return;
  }
  const config = getPostcssConfig(nuxt);
  if (!config) {
    return;
  }
  return {
    loader: "postcss-loader",
    options: config
  };
}

const validate = (compiler) => {
  if (compiler.options.target !== "node") {
    logger.warn('webpack config `target` should be "node".');
  }
  if (!compiler.options.externals) {
    logger.info(
      "It is recommended to externalize dependencies in the server build for better build performance."
    );
  }
};
const isJSRegExp = /\.[cm]?js(\?[^.]+)?$/;
const isJS = (file) => isJSRegExp.test(file);
const extractQueryPartJS = (file) => isJSRegExp.exec(file)[1];
const isCSS = (file) => /\.css(\?[^.]+)?$/.test(file);
const isHotUpdate = (file) => file.includes("hot-update");

class VueSSRClientPlugin {
  constructor(options = {}) {
    this.options = Object.assign({
      filename: null
    }, options);
  }
  apply(compiler) {
    compiler.hooks.afterEmit.tap("VueSSRClientPlugin", async (compilation) => {
      const stats = compilation.getStats().toJson();
      const allFiles = uniq(stats.assets.map((a) => a.name)).filter((file) => !isHotUpdate(file));
      const initialFiles = uniq(Object.keys(stats.entrypoints).map((name) => stats.entrypoints[name].assets).reduce((files, entryAssets) => files.concat(entryAssets.map((entryAsset) => entryAsset.name)), []).filter((file) => isJS(file) || isCSS(file))).filter((file) => !isHotUpdate(file));
      const asyncFiles = allFiles.filter((file) => isJS(file) || isCSS(file)).filter((file) => !initialFiles.includes(file)).filter((file) => !isHotUpdate(file));
      const assetsMapping = {};
      stats.assets.filter(({ name }) => isJS(name)).filter(({ name }) => !isHotUpdate(name)).forEach(({ name, chunkNames }) => {
        const componentHash = hash$1(chunkNames.join("|"));
        if (!assetsMapping[componentHash]) {
          assetsMapping[componentHash] = [];
        }
        assetsMapping[componentHash].push(name);
      });
      const manifest = {
        publicPath: stats.publicPath,
        all: allFiles,
        initial: initialFiles,
        async: asyncFiles,
        modules: {},
        assetsMapping
      };
      const { entrypoints, namedChunkGroups } = stats;
      const assetModules = stats.modules.filter((m) => m.assets.length);
      const fileToIndex = (file) => manifest.all.indexOf(file);
      stats.modules.forEach((m) => {
        if (m.chunks.length === 1) {
          const [cid] = m.chunks;
          const chunk = stats.chunks.find((c) => c.id === cid);
          if (!chunk || !chunk.files) {
            return;
          }
          const id = m.identifier.replace(/\s\w+$/, "");
          const filesSet = new Set(chunk.files.map(fileToIndex).filter((i) => i !== -1));
          for (const chunkName of chunk.names) {
            if (!entrypoints[chunkName]) {
              const chunkGroup = namedChunkGroups[chunkName];
              if (chunkGroup) {
                for (const asset of chunkGroup.assets) {
                  filesSet.add(fileToIndex(asset.name));
                }
              }
            }
          }
          const files = Array.from(filesSet);
          manifest.modules[hash$1(id)] = files;
          if (Array.isArray(m.modules)) {
            for (const concatenatedModule of m.modules) {
              const id2 = hash$1(concatenatedModule.identifier.replace(/\s\w+$/, ""));
              if (!manifest.modules[id2]) {
                manifest.modules[id2] = files;
              }
            }
          }
          assetModules.forEach((m2) => {
            if (m2.chunks.includes(cid)) {
              files.push.apply(files, m2.assets.map(fileToIndex));
            }
          });
        }
      });
      const src = JSON.stringify(manifest, null, 2);
      await fse.mkdirp(dirname(this.options.filename));
      await fse.writeFile(this.options.filename, src);
      const mjsSrc = "export default " + src;
      await fse.writeFile(this.options.filename.replace(".json", ".mjs"), mjsSrc);
    });
  }
}

class VueSSRServerPlugin {
  constructor(options = {}) {
    this.options = Object.assign({
      filename: null
    }, options);
  }
  apply(compiler) {
    validate(compiler);
    compiler.hooks.make.tap("VueSSRServerPlugin", (compilation) => {
      compilation.hooks.processAssets.tapAsync({
        name: "VueSSRServerPlugin",
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
      }, (assets, cb) => {
        const stats = compilation.getStats().toJson();
        const [entryName] = Object.keys(stats.entrypoints);
        const entryInfo = stats.entrypoints[entryName];
        if (!entryInfo) {
          return cb();
        }
        const entryAssets = entryInfo.assets.filter((asset) => isJS(asset.name));
        if (entryAssets.length > 1) {
          throw new Error(
            "Server-side bundle should have one single entry file. Avoid using CommonsChunkPlugin in the server config."
          );
        }
        const [entry] = entryAssets;
        if (!entry || typeof entry.name !== "string") {
          throw new Error(
            `Entry "${entryName}" not found. Did you specify the correct entry option?`
          );
        }
        const bundle = {
          entry: entry.name,
          files: {},
          maps: {}
        };
        stats.assets.forEach((asset) => {
          if (isJS(asset.name)) {
            const queryPart = extractQueryPartJS(asset.name);
            if (queryPart !== void 0) {
              bundle.files[asset.name] = asset.name.replace(queryPart, "");
            } else {
              bundle.files[asset.name] = asset.name;
            }
          } else if (asset.name.match(/\.js\.map$/)) {
            bundle.maps[asset.name.replace(/\.map$/, "")] = asset.name;
          } else {
            delete assets[asset.name];
          }
        });
        const src = JSON.stringify(bundle, null, 2);
        assets[this.options.filename] = {
          source: () => src,
          size: () => src.length
        };
        const mjsSrc = "export default " + src;
        assets[this.options.filename.replace(".json", ".mjs")] = {
          source: () => mjsSrc,
          map: () => null,
          size: () => mjsSrc.length
        };
        cb();
      });
    });
  }
}

function vue(ctx) {
  const { options, config } = ctx;
  config.plugins.push(new (VueLoaderPlugin.default || VueLoaderPlugin)());
  config.module.rules.push({
    test: /\.vue$/i,
    loader: "vue-loader",
    options: {
      reactivityTransform: ctx.nuxt.options.experimental.reactivityTransform,
      ...options.webpack.loaders.vue
    }
  });
  if (ctx.isClient) {
    config.plugins.push(new VueSSRClientPlugin({
      filename: resolve(options.buildDir, "dist/server", `${ctx.name}.manifest.json`)
    }));
  } else {
    config.plugins.push(new VueSSRServerPlugin({
      filename: `${ctx.name}.manifest.json`
    }));
  }
  config.plugins.push(new webpack.DefinePlugin({
    __VUE_OPTIONS_API__: "true",
    __VUE_PROD_DEVTOOLS__: "false"
  }));
}

function nuxt(ctx) {
  applyPresets(ctx, [
    base,
    assets,
    esbuild,
    pug,
    style,
    vue
  ]);
}

function client(ctx) {
  ctx.name = "client";
  ctx.isClient = true;
  applyPresets(ctx, [
    nuxt,
    clientPlugins,
    clientOptimization,
    clientDevtool,
    clientPerformance,
    clientHMR
  ]);
}
function clientDevtool(ctx) {
  if (!ctx.isDev) {
    ctx.config.devtool = false;
    return;
  }
  const scriptPolicy = getCspScriptPolicy(ctx);
  const noUnsafeEval = scriptPolicy && !scriptPolicy.includes("'unsafe-eval'");
  ctx.config.devtool = noUnsafeEval ? "cheap-module-source-map" : "eval-cheap-module-source-map";
}
function clientPerformance(ctx) {
  ctx.config.performance = {
    maxEntrypointSize: 1e3 * 1024,
    hints: ctx.isDev ? false : "warning",
    ...ctx.config.performance
  };
}
function clientHMR(ctx) {
  const { options, config } = ctx;
  if (!ctx.isDev) {
    return;
  }
  const clientOptions = options.webpack.hotMiddleware?.client || {};
  const hotMiddlewareClientOptions = {
    reload: true,
    timeout: 3e4,
    path: joinURL(options.app.baseURL, "__webpack_hmr", ctx.name),
    ...clientOptions,
    ansiColors: JSON.stringify(clientOptions.ansiColors || {}),
    overlayStyles: JSON.stringify(clientOptions.overlayStyles || {}),
    name: ctx.name
  };
  const hotMiddlewareClientOptionsStr = querystring.stringify(hotMiddlewareClientOptions);
  const app = config.entry.app;
  app.unshift(
    `webpack-hot-middleware/client?${hotMiddlewareClientOptionsStr}`
  );
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
}
function clientOptimization(_ctx) {
}
function clientPlugins(ctx) {
  const { options, config } = ctx;
  if (!ctx.isDev && ctx.name === "client" && options.webpack.analyze) {
    const statsDir = resolve(options.buildDir, "stats");
    config.plugins.push(new BundleAnalyzerPlugin({
      analyzerMode: "static",
      defaultSizes: "gzip",
      generateStatsFile: true,
      openAnalyzer: !options.build.quiet,
      reportFilename: resolve(statsDir, `${ctx.name}.html`),
      statsFilename: resolve(statsDir, `${ctx.name}.json`),
      ...options.webpack.analyze === true ? {} : options.webpack.analyze
    }));
  }
}
function getCspScriptPolicy(ctx) {
  const { csp } = ctx.options.render;
  if (typeof csp === "object") {
    const { policies = {} } = csp;
    return policies["script-src"] || policies["default-src"] || [];
  }
}

function node(ctx) {
  const { config } = ctx;
  config.target = "node";
  config.node = false;
  config.experiments.outputModule = true;
  config.output = {
    ...config.output,
    chunkFilename: "[name].mjs",
    chunkFormat: "module",
    chunkLoading: "import",
    module: true,
    environment: {
      module: true,
      arrowFunction: true,
      bigIntLiteral: true,
      const: true,
      destructuring: true,
      dynamicImport: true,
      forOf: true
    },
    library: {
      type: "module"
    }
  };
  config.performance = {
    ...config.performance,
    hints: false,
    maxEntrypointSize: Infinity,
    maxAssetSize: Infinity
  };
}

const assetPattern = /\.(css|s[ca]ss|png|jpe?g|gif|svg|woff2?|eot|ttf|otf|webp|webm|mp4|ogv)(\?.*)?$/i;
function server(ctx) {
  ctx.name = "server";
  ctx.isServer = true;
  applyPresets(ctx, [
    nuxt,
    node,
    serverStandalone,
    serverPreset,
    serverPlugins
  ]);
  return getWebpackConfig(ctx);
}
function serverPreset(ctx) {
  const { config } = ctx;
  config.output.filename = "server.mjs";
  config.devtool = "cheap-module-source-map";
  config.optimization = {
    splitChunks: false,
    minimize: false
  };
}
function serverStandalone(ctx) {
  const inline = [
    "src/",
    "#app",
    "nuxt",
    "nuxt3",
    "!",
    "-!",
    "~",
    "@/",
    "#",
    ...ctx.options.build.transpile
  ];
  const external = ["#internal/nitro"];
  if (!Array.isArray(ctx.config.externals)) {
    return;
  }
  ctx.config.externals.push(({ request }, cb) => {
    if (external.includes(request)) {
      return cb(null, true);
    }
    if (request[0] === "." || isAbsolute(request) || inline.find((prefix) => typeof prefix === "string" && request.startsWith(prefix)) || assetPattern.test(request)) {
      return cb(null, false);
    }
    return cb(null, true);
  });
}
function serverPlugins(ctx) {
  const { config, options } = ctx;
  if (options.webpack.serverURLPolyfill) {
    config.plugins.push(new webpack.ProvidePlugin({
      URL: [options.webpack.serverURLPolyfill, "URL"],
      URLSearchParams: [options.webpack.serverURLPolyfill, "URLSearchParams"]
    }));
  }
  if (ctx.nuxt.options.typescript.typeCheck === true || ctx.nuxt.options.typescript.typeCheck === "build" && !ctx.nuxt.options.dev) {
    ctx.config.plugins.push(new ForkTSCheckerWebpackPlugin({ logger }));
  }
}

async function bundle(nuxt) {
  registerVirtualModules();
  const webpackConfigs = [client, ...nuxt.options.ssr ? [server] : []].map((preset) => {
    const ctx = createWebpackConfigContext(nuxt);
    applyPresets(ctx, preset);
    return getWebpackConfig(ctx);
  });
  await nuxt.callHook("webpack:config", webpackConfigs);
  const mfs = nuxt.options.dev ? createMFS() : null;
  const compilers = webpackConfigs.map((config) => {
    config.plugins.push(DynamicBasePlugin.webpack({
      sourcemap: nuxt.options.sourcemap
    }));
    config.plugins.push(composableKeysPlugin.webpack({
      sourcemap: nuxt.options.sourcemap,
      rootDir: nuxt.options.rootDir
    }));
    const compiler = webpack(config);
    if (nuxt.options.dev) {
      compiler.outputFileSystem = mfs;
    }
    return compiler;
  });
  nuxt.hook("close", async () => {
    for (const compiler of compilers) {
      await new Promise((resolve) => compiler.close(resolve));
    }
  });
  if (nuxt.options.dev) {
    return Promise.all(compilers.map((c) => compile(c)));
  }
  for (const c of compilers) {
    await compile(c);
  }
}
async function createDevMiddleware(compiler) {
  const nuxt = useNuxt();
  logger.debug("Creating webpack middleware...");
  const devMiddleware = pify(webpackDevMiddleware(compiler, {
    publicPath: joinURL(nuxt.options.app.baseURL, nuxt.options.app.buildAssetsDir),
    outputFileSystem: compiler.outputFileSystem,
    stats: "none",
    ...nuxt.options.webpack.devMiddleware
  }));
  nuxt.hook("close", () => pify(devMiddleware.close.bind(devMiddleware))());
  const { client: _client, ...hotMiddlewareOptions } = nuxt.options.webpack.hotMiddleware || {};
  const hotMiddleware = pify(webpackHotMiddleware(compiler, {
    log: false,
    heartbeat: 1e4,
    path: joinURL(nuxt.options.app.baseURL, "__webpack_hmr", compiler.options.name),
    ...hotMiddlewareOptions
  }));
  await nuxt.callHook("webpack:devMiddleware", devMiddleware);
  await nuxt.callHook("webpack:hotMiddleware", hotMiddleware);
  await nuxt.callHook("server:devMiddleware", async (req, res, next) => {
    for (const mw of [devMiddleware, hotMiddleware]) {
      await mw?.(req, res);
    }
    next();
  });
  return devMiddleware;
}
async function compile(compiler) {
  const nuxt = useNuxt();
  const { name } = compiler.options;
  await nuxt.callHook("build:compile", { name, compiler });
  compiler.hooks.done.tap("load-resources", async (stats2) => {
    await nuxt.callHook("build:compiled", { name, compiler, stats: stats2 });
    await nuxt.callHook("build:resources", compiler.outputFileSystem);
  });
  if (nuxt.options.dev) {
    const compilersWatching = [];
    nuxt.hook("close", async () => {
      await Promise.all(compilersWatching.map((watching) => pify(watching.close.bind(watching))()));
    });
    if (name === "client") {
      return new Promise((resolve, reject) => {
        compiler.hooks.done.tap("nuxt-dev", () => {
          resolve(null);
        });
        compiler.hooks.failed.tap("nuxt-errorlog", (err) => {
          reject(err);
        });
        createDevMiddleware(compiler).then((devMiddleware) => {
          compilersWatching.push(devMiddleware.context.watching);
        });
      });
    }
    return new Promise((resolve, reject) => {
      const watching = compiler.watch(nuxt.options.watchers.webpack, (err) => {
        if (err) {
          return reject(err);
        }
        resolve(null);
      });
      compilersWatching.push(watching);
    });
  }
  const stats = await new Promise((resolve, reject) => compiler.run((err, stats2) => err ? reject(err) : resolve(stats2)));
  if (stats.hasErrors()) {
    const error = new Error("Nuxt build error");
    if (nuxt.options.build.quiet === true) {
      error.stack = stats.toString("errors-only");
    }
    throw error;
  }
  await nuxt.callHook("build:resources");
}

export { bundle };
