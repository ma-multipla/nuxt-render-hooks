import { RouterOptions as RouterOptions$1 } from 'vue-router';
import * as vue_meta from 'vue-meta';
import * as _vue_compiler_core from '@vue/compiler-core';
import * as vue_types_vue from 'vue/types/vue';
import { UnimportOptions, Preset, Import } from 'unimport';
import { Hookable } from 'hookable';
import { Ignore } from 'ignore';
import { Server as Server$1, IncomingMessage, ServerResponse } from 'node:http';
import { Server as Server$2 } from 'node:https';
import { Configuration, Compiler, Stats, WebpackError } from 'webpack';
import { TSConfig, readPackageJSON } from 'pkg-types';
import { InlineConfig, ViteDevServer, UserConfig } from 'vite';
import { NitroConfig, Nitro, NitroEventHandler, NitroDevEventHandler } from 'nitropack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { PluginOptions } from 'mini-css-extract-plugin';
import { BasePluginOptions, DefinedDefaultMinimizerAndOptions } from 'terser-webpack-plugin';
import { BasePluginOptions as BasePluginOptions$1, DefinedDefaultMinimizerAndOptions as DefinedDefaultMinimizerAndOptions$1 } from 'css-minimizer-webpack-plugin';
import { Options } from 'webpack-dev-middleware';
import { IncomingMessage as IncomingMessage$1, ServerResponse as ServerResponse$1 } from 'http';
import { MiddlewareOptions, ClientOptions } from 'webpack-hot-middleware';
import { PluginVisualizerOptions } from 'rollup-plugin-visualizer';
import { ResolvedConfig } from 'c12';

/**
 * Reference: https://github.com/vitejs/vite/blob/main/packages/vite/types/importMeta.d.ts
 */
interface ViteHot {
    readonly data: any;
    accept(): void;
    accept(cb: (mod: any) => void): void;
    accept(dep: string, cb: (mod: any) => void): void;
    accept(deps: readonly string[], cb: (mods: any[]) => void): void;
    dispose(cb: (data: any) => void): void;
    decline(): void;
    invalidate(): void;
    on(event: any, cb: (payload: any) => void): void;
    send(event: any, data?: any): void;
}
interface ViteGlobOptions {
    as?: string;
}
interface ViteImportMeta {
    /** Vite client HMR API - see https://vitejs.dev/guide/api-hmr.html */
    readonly hot?: ViteHot;
    /** vite glob import utility - https://vitejs.dev/guide/features.html#glob-import */
    glob?(pattern: string, options?: ViteGlobOptions): Record<string, () => Promise<Record<string, any>>>;
    /** vite glob import utility - https://vitejs.dev/guide/features.html#glob-import */
    globEager?(pattern: string, options?: ViteGlobOptions): Record<string, Record<string, any>>;
}

/**
 * Reference: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/webpack-env/index.d.ts
 */
declare type WebpackModuleId = string | number;
interface HotNotifierInfo {
    type: 'self-declined' | 'declined' | 'unaccepted' | 'accepted' | 'disposed' | 'accept-errored' | 'self-accept-errored' | 'self-accept-error-handler-errored';
    /**
     * The module in question.
     */
    moduleId: number;
    /**
     * For errors: the module id owning the accept handler.
     */
    dependencyId?: number | undefined;
    /**
     * For declined/accepted/unaccepted: the chain from where the update was propagated.
     */
    chain?: number[] | undefined;
    /**
     * For declined: the module id of the declining parent
     */
    parentId?: number | undefined;
    /**
     * For accepted: the modules that are outdated and will be disposed
     */
    outdatedModules?: number[] | undefined;
    /**
     * For accepted: The location of accept handlers that will handle the update
     */
    outdatedDependencies?: {
        [dependencyId: number]: number[];
    } | undefined;
    /**
     * For errors: the thrown error
     */
    error?: Error | undefined;
    /**
     * For self-accept-error-handler-errored: the error thrown by the module
     * before the error handler tried to handle it.
     */
    originalError?: Error | undefined;
}
interface AcceptOptions {
    /**
     * If true the update process continues even if some modules are not accepted (and would bubble to the entry point).
     */
    ignoreUnaccepted?: boolean | undefined;
    /**
     * Ignore changes made to declined modules.
     */
    ignoreDeclined?: boolean | undefined;
    /**
     *  Ignore errors throw in accept handlers, error handlers and while reevaluating module.
     */
    ignoreErrored?: boolean | undefined;
    /**
     * Notifier for declined modules.
     */
    onDeclined?: ((info: HotNotifierInfo) => void) | undefined;
    /**
     * Notifier for unaccepted modules.
     */
    onUnaccepted?: ((info: HotNotifierInfo) => void) | undefined;
    /**
     * Notifier for accepted modules.
     */
    onAccepted?: ((info: HotNotifierInfo) => void) | undefined;
    /**
     * Notifier for disposed modules.
     */
    onDisposed?: ((info: HotNotifierInfo) => void) | undefined;
    /**
     * Notifier for errors.
     */
    onErrored?: ((info: HotNotifierInfo) => void) | undefined;
    /**
     * Indicates that apply() is automatically called by check function
     */
    autoApply?: boolean | undefined;
}
interface WebpackHot {
    /**
     * Accept code updates for the specified dependencies. The callback is called when dependencies were replaced.
     *
     * @param dependencies
     * @param callback
     * @param errorHandler
     */
    accept(dependencies: string[], callback?: (updatedDependencies: WebpackModuleId[]) => void, errorHandler?: (err: Error) => void): void;
    /**
     * Accept code updates for the specified dependencies. The callback is called when dependencies were replaced.
     *
     * @param dependency
     * @param callback
     * @param errorHandler
     */
    accept(dependency: string, callback?: () => void, errorHandler?: (err: Error) => void): void;
    /**
     * Accept code updates for this module without notification of parents.
     * This should only be used if the module doesn’t export anything.
     * The errHandler can be used to handle errors that occur while loading the updated module.
     *
     * @param errHandler
     */
    accept(errHandler?: (err: Error) => void): void;
    /**
     * Do not accept updates for the specified dependencies. If any dependencies is updated, the code update fails with code "decline".
     */
    decline(dependencies: string[]): void;
    /**
     * Do not accept updates for the specified dependencies. If any dependencies is updated, the code update fails with code "decline".
     */
    decline(dependency: string): void;
    /**
     * Flag the current module as not update-able. If updated the update code would fail with code "decline".
     */
    decline(): void;
    /**
     * Add a one time handler, which is executed when the current module code is replaced.
     * Here you should destroy/remove any persistent resource you have claimed/created.
     * If you want to transfer state to the new module, add it to data object.
     * The data will be available at module.hot.data on the new module.
     *
     * @param callback
     */
    dispose(callback: (data: any) => void): void;
    dispose(callback: <T>(data: T) => void): void;
    /**
     * Add a one time handler, which is executed when the current module code is replaced.
     * Here you should destroy/remove any persistent resource you have claimed/created.
     * If you want to transfer state to the new module, add it to data object.
     * The data will be available at module.hot.data on the new module.
     *
     * @param callback
     */
    addDisposeHandler(callback: (data: any) => void): void;
    addDisposeHandler<T>(callback: (data: T) => void): void;
    /**
     * Remove a handler.
     * This can useful to add a temporary dispose handler. You could i. e. replace code while in the middle of a multi-step async function.
     *
     * @param callback
     */
    removeDisposeHandler(callback: (data: any) => void): void;
    removeDisposeHandler<T>(callback: (data: T) => void): void;
    /**
     * Throws an exceptions if status() is not idle.
     * Check all currently loaded modules for updates and apply updates if found.
     * If no update was found, the callback is called with null.
     * If autoApply is truthy the callback will be called with all modules that were disposed.
     * apply() is automatically called with autoApply as options parameter.
     * If autoApply is not set the callback will be called with all modules that will be disposed on apply().
     *
     * @param autoApply
     * @param callback
     */
    check(autoApply: boolean, callback: (err: Error, outdatedModules: WebpackModuleId[]) => void): void;
    /**
     * Throws an exceptions if status() is not idle.
     * Check all currently loaded modules for updates and apply updates if found.
     * If no update was found, the callback is called with null.
     * The callback will be called with all modules that will be disposed on apply().
     *
     * @param callback
     */
    check(callback: (err: Error, outdatedModules: WebpackModuleId[]) => void): void;
    /**
     * If status() != "ready" it throws an error.
     * Continue the update process.
     *
     * @param options
     * @param callback
     */
    apply(options: AcceptOptions, callback: (err: Error, outdatedModules: WebpackModuleId[]) => void): void;
    /**
     * If status() != "ready" it throws an error.
     * Continue the update process.
     *
     * @param callback
     */
    apply(callback: (err: Error, outdatedModules: WebpackModuleId[]) => void): void;
    /**
     * Return one of idle, check, watch, watch-delay, prepare, ready, dispose, apply, abort or fail.
     */
    status(): string;
    /** Register a callback on status change. */
    status(callback: (status: string) => void): void;
    /** Register a callback on status change. */
    addStatusHandler(callback: (status: string) => void): void;
    /**
     * Remove a registered status change handler.
     *
     * @param callback
     */
    removeStatusHandler(callback: (status: string) => void): void;
    active: boolean;
    data: any;
}
interface WebpackImportMeta {
    /** an alias for `module.hot` - see https://webpack.js.org/api/hot-module-replacement/ */
    webpackHot?: WebpackHot | undefined;
    /** the webpack major version as number */
    webpack?: number;
}

declare type BundlerImportMeta = ViteImportMeta & WebpackImportMeta;
declare global {
    interface ImportMeta extends BundlerImportMeta {
        /** the `file:` url of the current file (similar to `__filename` but as file url) */
        url: string;
        readonly env: Record<string, string | boolean | undefined>;
    }
}

interface NuxtCompatibility {
    /**
     * Required nuxt version in semver format.
     *
     * @example `^2.14.0` or `>=3.0.0-27219851.6e49637`.
     *
     */
    nuxt?: string;
    /**
     * Bridge constraint for Nuxt 2 support.
     *
     * - `true`:  When using Nuxt 2, using bridge module is required
     * - `false`: When using Nuxt 2, using bridge module is not supported
    */
    bridge?: boolean;
}
interface NuxtCompatibilityIssue {
    name: string;
    message: string;
}
interface NuxtCompatibilityIssues extends Array<NuxtCompatibilityIssue> {
    /**
     * Return formatted error message
     */
    toString(): string;
}

interface Component {
    pascalName: string;
    kebabName: string;
    export: string;
    filePath: string;
    shortPath: string;
    chunkName: string;
    prefetch: boolean;
    preload: boolean;
    global?: boolean;
    mode?: 'client' | 'server' | 'all';
    /** @deprecated */
    level?: number;
    /** @deprecated */
    import?: string;
    /** @deprecated */
    asyncImport?: string;
    /** @deprecated */
    async?: boolean;
}
interface ScanDir {
    /**
     * Path (absolute or relative) to the directory containing your components.
     * You can use Nuxt aliases (~ or @) to refer to directories inside project or directly use a npm package path similar to require.
     */
    path: string;
    /**
     * Accept Pattern that will be run against specified path.
     */
    pattern?: string | string[];
    /**
     * Ignore patterns that will be run against specified path.
     */
    ignore?: string[];
    /**
     * Prefix all matched components.
     */
    prefix?: string;
    /**
     * Prefix component name by it's path.
     */
    pathPrefix?: boolean;
    /**
     * Ignore scanning this directory if set to `true`
     */
    enabled?: boolean;
    /**
     * Level is used to define a hint when overwriting the components which have the same name in two different directories.
     * @deprecated Not used by Nuxt 3 anymore
     */
    level?: number;
    /**
     * These properties (prefetch/preload) are used in production to configure how components with Lazy prefix are handled by Webpack via its magic comments.
     * Learn more on Webpack documentation: https://webpack.js.org/api/module-methods/#magic-comments
     */
    prefetch?: boolean;
    /**
     * These properties (prefetch/preload) are used in production to configure how components with Lazy prefix are handled by Webpack via its magic comments.
     * Learn more on Webpack documentation: https://webpack.js.org/api/module-methods/#magic-comments
     */
    preload?: boolean;
    /**
     * This flag indicates, component should be loaded async (with a seperate chunk) regardless of using Lazy prefix or not.
     */
    isAsync?: boolean;
    extendComponent?: (component: Component) => Promise<Component | void> | (Component | void);
    /**
     * If enabled, registers components to be globally available
     *
     */
    global?: boolean;
}
interface ComponentsDir extends ScanDir {
    /**
     * Watch specified path for changes, including file additions and file deletions.
     */
    watch?: boolean;
    /**
     * Extensions supported by Nuxt builder.
     */
    extensions?: string[];
    /**
     * Transpile specified path using build.transpile.
     * By default ('auto') it will set transpile: true if node_modules/ is in path.
     */
    transpile?: 'auto' | boolean;
}
interface ComponentsOptions {
    dirs: (string | ComponentsDir)[];
    /**
     * The default value for whether to globally register components.
     *
     * When components are registered globally, they will still be directly imported where used,
     * but they can also be used dynamically, for example `<component :is="`icon-${myIcon}`">`.
     *
     * This can be overridden by an individual component directory entry.
     *
     * @default false
     */
    global?: boolean;
    loader?: boolean;
    transform?: {
        exclude?: RegExp[];
        include?: RegExp[];
    };
}

declare type RouterConfig = Partial<Omit<RouterOptions$1, 'history' | 'routes'>>;
/** @deprecated Use RouterConfig instead */
declare type RouterOptions = RouterConfig;
/**
 * Only JSON serializable router options are configurable from nuxt config
 */
declare type RouterConfigSerializable = Pick<RouterConfig, 'linkActiveClass' | 'linkExactActiveClass' | 'end' | 'sensitive' | 'strict'>;
/** @deprecated Use RouterConfigSerializable instead */
declare type RouterConfigOptions = RouterConfigSerializable;

interface AutoImportsOptions extends UnimportOptions {
    dirs?: string[];
    global?: boolean;
    transform?: {
        exclude?: RegExp[];
        include?: RegExp[];
    };
}

interface MetaObject extends Record<string, any> {
    /**
     * The character encoding in which the document is encoded => `<meta charset="<value>" />`
     *
     * @default `'utf-8'`
     */
    charset?: string;
    /**
     * Configuration of the viewport (the area of the window in which web content can be seen),
     * mapped to => `<meta name="viewport" content="<value>" />`
     *
     * @default `'width=device-width, initial-scale=1'`
     */
    viewport?: string;
    /** Each item in the array maps to a newly-created `<meta>` element, where object properties map to attributes. */
    meta?: Array<Record<string, any>>;
    /** Each item in the array maps to a newly-created `<link>` element, where object properties map to attributes. */
    link?: Array<Record<string, any>>;
    /** Each item in the array maps to a newly-created `<style>` element, where object properties map to attributes. */
    style?: Array<Record<string, any>>;
    /** Each item in the array maps to a newly-created `<script>` element, where object properties map to attributes. */
    script?: Array<Record<string, any>>;
    titleTemplate?: string | ((title: string) => string);
    title?: string;
    bodyAttrs?: Record<string, any>;
    htmlAttrs?: Record<string, any>;
}

interface ModuleMeta {
    /** Module name */
    name?: string;
    /** Module version */
    version?: string;
    /**
     * The configuration key used within `nuxt.config` for this module's options.
     * For example, `@nuxtjs/axios` uses `axios`.
     */
    configKey?: string;
    /**
     * Constraints for the versions of Nuxt or features this module requires
     */
    compatibility?: NuxtCompatibility;
    [key: string]: any;
}
/** The options received  */
declare type ModuleOptions = Record<string, any>;
/** Input module passed to defineNuxtModule */
interface ModuleDefinition<T extends ModuleOptions = ModuleOptions> {
    meta?: ModuleMeta;
    defaults?: T | ((nuxt: Nuxt) => T);
    schema?: T;
    hooks?: Partial<NuxtHooks>;
    setup?: (this: void, resolvedOptions: T, nuxt: Nuxt) => void | Promise<void>;
}
/** Nuxt modules are always a simple function */
interface NuxtModule<T extends ModuleOptions = ModuleOptions> {
    (this: void, inlineOptions: T, nuxt: Nuxt): void | Promise<void>;
    getOptions?: (inlineOptions?: T, nuxt?: Nuxt) => Promise<T>;
    getMeta?: () => Promise<ModuleMeta>;
}
/**
* Legacy ModuleContainer for backwards compatibility with Nuxt 2 module format.
*/
interface ModuleContainer {
    nuxt: Nuxt;
    options: Nuxt['options'];
    /** @deprecated */
    ready(): Promise<any>;
    /** @deprecated */
    addVendor(): void;
    /** Renders given template using lodash template during build into the project buildDir (`.nuxt`).*/
    addTemplate(template: string | NuxtTemplate): NuxtTemplate;
    /** Register a custom layout. If its name is 'error' it will override the default error layout. */
    addLayout(tmpl: NuxtTemplate, name: string): any;
    /** Set the layout that will render Nuxt errors. It should already have been added via addLayout or addTemplate. */
    addErrorLayout(dst: string): void;
    /** Adds a new server middleware to the end of the server middleware array. */
    addServerMiddleware(arg1: any): void;
    /** Allows extending webpack build config by chaining `options.build.extend` function. */
    extendBuild(fn: any): void;
    /** Allows extending routes by chaining `options.router.extendRoutes` function. */
    extendRoutes(fn: any): void;
    /** Registers a module */
    requireModule(installOptions: any, opts: any): Promise<void>;
    /** Registers a module */
    addModule(installOptions: any, opts: any): Promise<void>;
}

declare type HookResult = Promise<void> | void;
declare type Builder = any;
declare type Generator = any;
declare type Server = any;
declare type WatchEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
interface PreloadFile {
    asType: 'script' | 'style' | 'font';
    extension: string;
    file: string;
    fileWithoutQuery: string;
}
declare type RenderResult = {
    html: string;
    cspScriptSrcHashes: string[];
    error: any;
    redirected: boolean;
    preloadFiles: PreloadFile[];
};
declare type TSReference = {
    types: string;
} | {
    path: string;
};
declare type NuxtPage = {
    name?: string;
    path: string;
    file: string;
    meta?: Record<string, any>;
    children?: NuxtPage[];
};
declare type NuxtMiddleware = {
    name: string;
    path: string;
    global?: boolean;
};
declare type NuxtLayout = {
    name: string;
    file: string;
};
interface ImportPresetWithDeprecation extends Preset {
    /**
     * @deprecated renamed to `imports`
     */
    names?: string[];
}
interface NuxtHooks {
    'kit:compatibility': (compatibility: NuxtCompatibility, issues: NuxtCompatibilityIssues) => HookResult;
    'app:resolve': (app: NuxtApp) => HookResult;
    'app:templates': (app: NuxtApp) => HookResult;
    'app:templatesGenerated': (app: NuxtApp) => HookResult;
    'builder:generateApp': () => HookResult;
    'pages:extend': (pages: NuxtPage[]) => HookResult;
    'autoImports:sources': (presets: ImportPresetWithDeprecation[]) => HookResult;
    'autoImports:extend': (imports: Import[]) => HookResult;
    'autoImports:dirs': (dirs: string[]) => HookResult;
    'components:dirs': (dirs: ComponentsOptions['dirs']) => HookResult;
    'components:extend': (components: (Component | ComponentsDir | ScanDir)[]) => HookResult;
    'build:before': (builder: Builder, buildOptions: NuxtOptions['build']) => HookResult;
    'builder:prepared': (builder: Builder, buildOptions: NuxtOptions['build']) => HookResult;
    'builder:extendPlugins': (plugins: NuxtOptions['plugins']) => HookResult;
    'build:templates': (templates: {
        templateVars: Record<string, any>;
        templatesFiles: NuxtTemplate[];
        resolve: (...args: string[]) => string;
    }) => HookResult;
    'build:extendRoutes': (routes: any[], resolve: (...args: string[]) => string) => HookResult;
    'build:done': (builder: Builder) => HookResult;
    'watch:restart': (event: {
        event: string;
        path: string;
    }) => HookResult;
    'builder:watch': (event: WatchEvent, path: string) => HookResult;
    'nitro:config': (nitroConfig: NitroConfig) => HookResult;
    'nitro:init': (nitro: Nitro) => HookResult;
    'nitro:build:before': (nitro: Nitro) => HookResult;
    'generate:cache:ignore': (ignore: string[]) => HookResult;
    'config': (options: NuxtConfig) => HookResult;
    'run:before': (options: {
        argv: string[];
        cmd: {
            name: string;
            usage: string;
            description: string;
            options: Record<string, any>;
        };
        rootDir: string;
    }) => HookResult;
    'build:error': (error: Error) => HookResult;
    'prepare:types': (options: {
        references: TSReference[];
        declarations: string[];
        tsConfig: TSConfig;
    }) => HookResult;
    'ready': (nuxt: Nuxt) => HookResult;
    'close': (nuxt: Nuxt) => HookResult;
    'modules:before': (moduleContainer: ModuleContainer, modules?: any[]) => HookResult;
    'modules:done': (moduleContainer: ModuleContainer) => HookResult;
    'render:before': (server: Server, renderOptions: NuxtOptions['render']) => HookResult;
    'render:setupMiddleware': (app: any) => HookResult;
    'render:errorMiddleware': (app: any) => HookResult;
    'render:done': (server: Server) => HookResult;
    'listen': (listenerServer: Server$1 | Server$2, listener: any) => HookResult;
    'server:nuxt:renderLoading': (req: IncomingMessage, res: ServerResponse) => HookResult;
    'render:route': (url: string, result: RenderResult, context: any) => HookResult;
    'render:routeDone': (url: string, result: RenderResult, context: any) => HookResult;
    'render:beforeResponse': (url: string, result: RenderResult, context: any) => HookResult;
    'render:resourcesLoaded': (resources: any) => HookResult;
    'vue-renderer:context': (renderContext: any) => HookResult;
    'vue-renderer:spa:prepareContext': (renderContext: any) => HookResult;
    'vue-renderer:spa:templateParams': (templateParams: Record<string, any>) => HookResult;
    'vue-renderer:ssr:prepareContext': (renderContext: any) => HookResult;
    'vue-renderer:ssr:context': (renderContext: any) => HookResult;
    'vue-renderer:ssr:csp': (cspScriptSrcHashes: string[]) => HookResult;
    'vue-renderer:ssr:templateParams': (templateParams: Record<string, any>, renderContext: any) => HookResult;
    'webpack:config': (webpackConfigs: Configuration[]) => HookResult;
    'webpack:devMiddleware': (middleware: (req: IncomingMessage, res: ServerResponse, next: (err?: any) => any) => any) => HookResult;
    'webpack:hotMiddleware': (middleware: (req: IncomingMessage, res: ServerResponse, next: (err?: any) => any) => any) => HookResult;
    'build:compile': (options: {
        name: string;
        compiler: Compiler;
    }) => HookResult;
    'build:compiled': (options: {
        name: string;
        compiler: Compiler;
        stats: Stats;
    }) => HookResult;
    'build:resources': (mfs?: Compiler['outputFileSystem']) => HookResult;
    'server:devMiddleware': (middleware: (req: IncomingMessage, res: ServerResponse, next: (err?: any) => any) => any) => HookResult;
    'bundler:change': (shortPath: string) => void;
    'bundler:error': () => void;
    'bundler:done': () => void;
    'bundler:progress': (statesArray: any[]) => void;
    'generate:before': (generator: Generator, generateOptions: NuxtOptions['generate']) => HookResult;
    'generate:distRemoved': (generator: Generator) => HookResult;
    'generate:distCopied': (generator: Generator) => HookResult;
    'generate:route': ({ route, setPayload }: {
        route: any;
        setPayload: any;
    }) => HookResult;
    'generate:page': (page: {
        route: any;
        path: string;
        html: string;
        exclude: boolean;
        errors: string[];
    }) => HookResult;
    'generate:routeCreated': ({ route, path, errors }: {
        route: any;
        path: string;
        errors: any[];
    }) => HookResult;
    'generate:extendRoutes': (routes: any[]) => HookResult;
    'generate:routeFailed': ({ route, errors }: {
        route: any;
        errors: any[];
    }) => HookResult;
    'generate:manifest': (manifest: any, generator: Generator) => HookResult;
    'generate:done': (generator: Generator, errors: any[]) => HookResult;
    'export:before': (generator: Generator) => HookResult;
    'export:distRemoved': (generator: Generator) => HookResult;
    'export:distCopied': (generator: Generator) => HookResult;
    'export:route': ({ route, setPayload }: {
        route: any;
        setPayload: any;
    }) => HookResult;
    'export:routeCreated': ({ route, path, errors }: {
        route: any;
        path: string;
        errors: any[];
    }) => HookResult;
    'export:extendRoutes': ({ routes }: {
        routes: any[];
    }) => HookResult;
    'export:routeFailed': ({ route, errors }: {
        route: any;
        errors: any[];
    }) => HookResult;
    'export:done': (generator: Generator, { errors }: {
        errors: any[];
    }) => HookResult;
    'vite:extend': (viteBuildContext: {
        nuxt: Nuxt;
        config: InlineConfig;
    }) => HookResult;
    'vite:extendConfig': (viteInlineConfig: InlineConfig, env: {
        isClient: boolean;
        isServer: boolean;
    }) => HookResult;
    'vite:serverCreated': (viteServer: ViteDevServer, env: {
        isClient: boolean;
        isServer: boolean;
    }) => HookResult;
}
declare type NuxtHookName = keyof NuxtHooks;

interface Nuxt {
    _version: string;
    _ignore?: Ignore;
    /** The resolved Nuxt configuration. */
    options: NuxtOptions;
    hooks: Hookable<NuxtHooks>;
    hook: Nuxt['hooks']['hook'];
    callHook: Nuxt['hooks']['callHook'];
    addHooks: Nuxt['hooks']['addHooks'];
    ready: () => Promise<void>;
    close: () => Promise<void>;
    /** The production or development server */
    server?: any;
    vfs: Record<string, string>;
}
interface NuxtTemplate {
    /** @deprecated filename */
    fileName?: string;
    /** @deprecated whether template is custom or a nuxt core template */
    custom?: boolean;
    /** resolved output file path (generated) */
    dst?: string;
    /** The target filename once the template is copied into the Nuxt buildDir */
    filename?: string;
    /** An options object that will be accessible within the template via `<% options %>` */
    options?: Record<string, any>;
    /** The resolved path to the source file to be template */
    src?: string;
    /** Provided compile option intead of src */
    getContents?: (data: Record<string, any>) => string | Promise<string>;
    /** Write to filesystem */
    write?: boolean;
}
interface NuxtPlugin {
    /** @deprecated use mode */
    ssr?: boolean;
    src: string;
    mode?: 'all' | 'server' | 'client';
}
interface NuxtApp {
    mainComponent?: string;
    rootComponent?: string;
    errorComponent?: string;
    dir: string;
    extensions: string[];
    plugins: NuxtPlugin[];
    layouts: Record<string, NuxtLayout>;
    middleware: NuxtMiddleware[];
    templates: NuxtTemplate[];
}
declare type _TemplatePlugin = Omit<NuxtPlugin, 'src'> & NuxtTemplate;
interface NuxtPluginTemplate extends _TemplatePlugin {
}

interface ConfigSchema {
   /**
   * Configure Nuxt component auto-registration.
   * Any components in the directories configured here can be used throughout your pages, layouts (and other components) without needing to explicitly import them.
   * 
   * @default {{ dirs: [`~/components`] }}
   * 
   * @see [Nuxt 3](https://v3.nuxtjs.org/guide/directory-structure/components) and
   * [Nuxt 2](https://nuxtjs.org/docs/directory-structure/components/) documentation
   * 
   * @version 2
   * 
   * @version 3
  */
  components: boolean | ComponentsOptions | ComponentsOptions['dirs'],

  /**
   * Configure how Nuxt auto-imports composables into your application.
   * 
   * @see [Nuxt 3 documentation](https://v3.nuxtjs.org/guide/directory-structure/composables)
   * 
   * @version 3
  */
  autoImports: AutoImportsOptions,

  /**
   * Whether to use the vue-router integration in Nuxt 3. If you do not provide a value it will be enabled if you have a `pages/` directory in your source folder.
   * 
   * @version 3
  */
  pages: boolean,

  /**
   * Manually disable nuxt telemetry
   * 
   * @see [Nuxt Telemetry](https://github.com/nuxt/telemetry) for more information.
   * 
   * @version 3
  */
  telemetry: boolean,

  /**
   * Vue.js config
   * 
   * @version 2
   * 
   * @version 3
  */
  vue: {
    /**
     * Properties that will be set directly on `Vue.config` for vue@2.
     * 
     * @see [vue@2 Documentation](https://v2.vuejs.org/v2/api/#Global-Config)
     * 
     * @version 2
    */
    config: vue_types_vue.VueConfiguration,

    /**
     * Options for the Vue compiler that will be passed at build time
     * 
     * @see [documentation](https://vuejs.org/api/application.html#app-config-compileroptions)
     * 
     * @version 3
    */
    compilerOptions: _vue_compiler_core.CompilerOptions,
  },

  /**
   * Nuxt App configuration.
   * 
   * @version 2
   * 
   * @version 3
  */
  app: {
    /**
     * The base path of your Nuxt application.
     * This can be set at runtime by setting the NUXT_APP_BASE_URL environment variable.
     * @default "/"
     * 
     * @example
     * ```bash
     * NUXT_APP_BASE_URL=/prefix/ node .output/server/index.mjs
     * ```
    */
    baseURL: string,

    /**
     * The folder name for the built site assets, relative to `baseURL` (or `cdnURL` if set). This is set at build time and should not be customized at runtime.
     * @default "/_nuxt/"
    */
    buildAssetsDir: string,

    /**
     * The folder name for the built site assets, relative to `baseURL` (or `cdnURL` if set).
     * 
     * @deprecated - use `buildAssetsDir` instead
     * 
     * @version 2
    */
    assetsPath: any,

    /**
     * An absolute URL to serve the public folder from (production-only).
     * This can be set to a different value at runtime by setting the NUXT_APP_CDN_URL environment variable.
     * @default ""
     * 
     * @example
     * ```bash
     * NUXT_APP_CDN_URL=https://mycdn.org/ node .output/server/index.mjs
     * ```
    */
    cdnURL: string,

    /**
     * Set default configuration for `<head>` on every page.
     * 
     * @example
     * ```js
     * app: {
     *   head: {
     *     meta: [
     *       // <meta name="viewport" content="width=device-width, initial-scale=1">
     *       { name: 'viewport', content: 'width=device-width, initial-scale=1' }
     *     ],
     *     script: [
     *       // <script src="https://myawesome-lib.js"></script>
     *       { src: 'https://awesome-lib.js' }
     *     ],
     *     link: [
     *       // <link rel="stylesheet" href="https://myawesome-lib.css">
     *       { rel: 'stylesheet', href: 'https://awesome-lib.css' }
     *     ],
     *     // please note that this is an area that is likely to change
     *     style: [
     *       // <style type="text/css">:root { color: red }</style>
     *       { children: ':root { color: red }', type: 'text/css' }
     *     ]
     *   }
     * }
     * ```
     * 
     * @version 3
    */
    head: MetaObject,
  },

  /**
   * The path to a templated HTML file for rendering Nuxt responses. Uses `<srcDir>/app.html` if it exists or the Nuxt default template if not.
   * @default "/<rootDir>/.nuxt/views/app.template.html"
   * 
   * @example
   * ```html
   * <!DOCTYPE html>
   * <html {{ HTML_ATTRS }}>
   *   <head {{ HEAD_ATTRS }}>
   *     {{ HEAD }}
   *   </head>
   *   <body {{ BODY_ATTRS }}>
   *     {{ APP }}
   *   </body>
   * </html>
   * ```
   * 
   * @version 2
  */
  appTemplatePath: string,

  /**
   * Enable or disable vuex store.
   * By default it is enabled if there is a `store/` directory
   * @default false
   * 
   * @version 2
  */
  store: boolean,

  /**
   * Options to pass directly to `vue-meta`.
   * 
   * @see [documentation](https://vue-meta.nuxtjs.org/api/#plugin-options).
   * 
   * @version 2
  */
  vueMeta: vue_meta.VueMetaOptions,

  /**
   * Set default configuration for `<head>` on every page.
   * 
   * @see [documentation](https://vue-meta.nuxtjs.org/api/#metainfo-properties) for specifics.
   * 
   * @version 2
  */
  head: vue_meta.MetaInfo,

  /**
   * 
   * @version 3
   * 
   * @deprecated - use `head` instead
  */
  meta: MetaObject,

  /**
   * Configuration for the Nuxt `fetch()` hook.
   * 
   * @version 2
  */
  fetch: {
    /**
     * Whether to enable `fetch()` on the server.
     * @default true
    */
    server: boolean,

    /**
     * Whether to enable `fetch()` on the client.
     * @default true
    */
    client: boolean,
  },

  /**
   * An array of nuxt app plugins.
   * Each plugin can be a string (which can be an absolute or relative path to a file). If it ends with `.client` or `.server` then it will be automatically loaded only in the appropriate context.
   * It can also be an object with `src` and `mode` keys.
   * 
   * @example
   * ```js
   * plugins: [
   *   '~/plugins/foo.client.js', // only in client side
   *   '~/plugins/bar.server.js', // only in server side
   *   '~/plugins/baz.js', // both client & server
   *   { src: '~/plugins/both-sides.js' },
   *   { src: '~/plugins/client-only.js', mode: 'client' }, // only on client side
   *   { src: '~/plugins/server-only.js', mode: 'server' } // only on server side
   * ]
   * ```
   * 
   * @version 2
  */
  plugins: (NuxtPlugin | string)[],

  /**
   * You may want to extend plugins or change their order. For this, you can pass a function using `extendPlugins`. It accepts an array of plugin objects and should return an array of plugin objects.
   * 
   * @version 2
  */
  extendPlugins: (plugins: Array<{ src: string, mode?: 'client' | 'server' }>) => Array<{ src: string, mode?: 'client' | 'server' }>,

  /**
   * You can define the CSS files/modules/libraries you want to set globally (included in every page).
   * Nuxt will automatically guess the file type by its extension and use the appropriate pre-processor. You will still need to install the required loader if you need to use them.
   * 
   * @example
   * ```js
   * css: [
   *   // Load a Node.js module directly (here it's a Sass file)
   *   'bulma',
   *   // CSS file in the project
   *   '@/assets/css/main.css',
   *   // SCSS file in the project
   *   '@/assets/css/main.scss'
   * ]
   * ```
   * 
   * @version 2
   * 
   * @version 3
  */
  css: string[],

  /**
   * An object where each key name maps to a path to a layout .vue file.
   * Normally there is no need to configure this directly.
   * 
   * @version 2
  */
  layouts: Record<string, string>,

  /**
   * Set a custom error page layout.
   * Normally there is no need to configure this directly.
   * @default null
   * 
   * @version 2
  */
  ErrorPage: string,

  /**
   * Configure the Nuxt loading progress bar component that's shown between routes. Set to `false` to disable. You can also customize it or create your own component.
   * 
   * @version 2
  */
  loading: {
    /**
     * CSS color of the progress bar
     * @default "black"
    */
    color: string,

    /**
     * CSS color of the progress bar when an error appended while rendering the route (if data or fetch sent back an error for example).
     * @default "red"
    */
    failedColor: string,

    /**
     * Height of the progress bar (used in the style property of the progress bar).
     * @default "2px"
    */
    height: string,

    /**
     * In ms, wait for the specified time before displaying the progress bar. Useful for preventing the bar from flashing.
     * @default 200
    */
    throttle: number,

    /**
     * In ms, the maximum duration of the progress bar, Nuxt assumes that the route will be rendered before 5 seconds.
     * @default 5000
    */
    duration: number,

    /**
     * Keep animating progress bar when loading takes longer than duration.
     * @default false
    */
    continuous: boolean,

    /**
     * Set the direction of the progress bar from right to left.
     * @default false
    */
    rtl: boolean,

    /**
     * Set to false to remove default progress bar styles (and add your own).
     * @default true
    */
    css: boolean,
  },

  /**
   * Show a loading spinner while the page is loading (only when `ssr: false`).
   * Set to `false` to disable. Alternatively, you can pass a string name or an object for more configuration. The name can refer to an indicator from [SpinKit](https://tobiasahlin.com/spinkit/) or a path to an HTML template of the indicator source code (in this case, all the other options will be passed to the template.)
   * 
   * @version 2
  */
  loadingIndicator: {
    [key: string]: any
  },

  /**
   * Used to set the default properties of the page transitions.
   * You can either pass a string (the transition name) or an object with properties to bind to the `<Transition>` component that will wrap your pages.
   * 
   * @see [vue@2 documentation](https://v2.vuejs.org/v2/guide/transitions.html)
   * 
   * @see [vue@3 documentation](https://vuejs.org/guide/built-ins/transition-group.html#enter-leave-transitions)
   * 
   * @version 2
  */
  pageTransition: {
    [key: string]: any
  },

  /**
   * Used to set the default properties of the layout transitions.
   * You can either pass a string (the transition name) or an object with properties to bind to the `<Transition>` component that will wrap your layouts.
   * 
   * @see [vue@2 documentation](https://v2.vuejs.org/v2/guide/transitions.html)
   * 
   * @see [vue@3 documentation](https://vuejs.org/guide/built-ins/transition-group.html#enter-leave-transitions)
   * 
   * @version 2
  */
  layoutTransition: {
    [key: string]: any
  },

  /**
   * You can disable specific Nuxt features that you do not want.
   * 
   * @version 2
  */
  features: {
    /**
     * Set to false to disable Nuxt vuex integration
     * @default true
    */
    store: boolean,

    /**
     * Set to false to disable layouts
     * @default true
    */
    layouts: boolean,

    /**
     * Set to false to disable Nuxt integration with `vue-meta` and the `head` property
     * @default true
    */
    meta: boolean,

    /**
     * Set to false to disable middleware
     * @default true
    */
    middleware: boolean,

    /**
     * Set to false to disable transitions
     * @default true
    */
    transitions: boolean,

    /**
     * Set to false to disable support for deprecated features and aliases
     * @default true
    */
    deprecations: boolean,

    /**
     * Set to false to disable the Nuxt `validate()` hook
     * @default true
    */
    validate: boolean,

    /**
     * Set to false to disable the Nuxt `asyncData()` hook
     * @default true
    */
    useAsyncData: boolean,

    /**
     * Set to false to disable the Nuxt `fetch()` hook
     * @default true
    */
    fetch: boolean,

    /**
     * Set to false to disable `$nuxt.isOnline`
     * @default true
    */
    clientOnline: boolean,

    /**
     * Set to false to disable prefetching behavior in `<NuxtLink>`
     * @default true
    */
    clientPrefetch: boolean,

    /**
     * Set to false to disable extra component aliases like `<NLink>` and `<NChild>`
     * @default true
    */
    componentAliases: boolean,

    /**
     * Set to false to disable the `<ClientOnly>` component (see [docs](https://github.com/egoist/vue-client-only))
     * @default true
    */
    componentClientOnly: boolean,
  },

  /**
   * Extend nested configurations from multiple local or remote sources
   * Value should be either a string or array of strings pointing to source directories or config path relative to current config.
   * You can use `github:`, `gitlab:`, `bitbucket:` or `https://` to extend from a remote git repository.
   * 
   * @version 3
  */
  extends: string|string[],

  /**
   * Define the workspace directory of your application.
   * This property can be overwritten (for example, running `nuxt ./my-app/` will set the `rootDir` to the absolute path of `./my-app/` from the current/working directory.
   * It is normally not needed to configure this option.
   * @default "/<rootDir>"
   * 
   * @version 2
   * 
   * @version 3
  */
  rootDir: string,

  /**
   * Define the source directory of your Nuxt application.
   * If a relative path is specified it will be relative to the `rootDir`.
   * @default "/<rootDir>"
   * 
   * @example
   * ```js
   * export default {
   *   srcDir: 'client/'
   * }
   * ```
   * This would work with the following folder structure:
   * ```bash
   * -| app/
   * ---| node_modules/
   * ---| nuxt.config.js
   * ---| package.json
   * ---| client/
   * ------| assets/
   * ------| components/
   * ------| layouts/
   * ------| middleware/
   * ------| pages/
   * ------| plugins/
   * ------| static/
   * ------| store/
   * ```
   * 
   * @version 2
   * 
   * @version 3
  */
  srcDir: string,

  /**
   * Define the directory where your built Nuxt files will be placed.
   * Many tools assume that `.nuxt` is a hidden directory (because it starts with a `.`). If that is a problem, you can use this option to prevent that.
   * @default "/<rootDir>/.nuxt"
   * 
   * @example
   * ```js
   * export default {
   *   buildDir: 'nuxt-build'
   * }
   * ```
   * 
   * @version 2
   * 
   * @version 3
  */
  buildDir: string,

  /**
   * Whether Nuxt is running in development mode.
   * Normally you should not need to set this.
   * @default false
   * 
   * @version 2
   * 
   * @version 3
  */
  dev: boolean,

  /**
   * Whether your app is being unit tested
   * @default false
   * 
   * @version 2
  */
  test: boolean,

  /**
   * Set to true to enable debug mode.
   * By default it's only enabled in development mode.
   * @default false
   * 
   * @version 2
  */
  debug: boolean,

  /**
   * The env property defines environment variables that should be available throughout your app (server- and client-side). They can be assigned using server side environment variables.
   * 
   * @note Nuxt uses webpack's `definePlugin` to define these environment variables.
   * This means that the actual `process` or `process.env` from Node.js is neither
   * available nor defined. Each of the `env` properties defined here is individually
   * mapped to `process.env.xxxx` and converted during compilation.
   * 
   * @note Environment variables starting with `NUXT_ENV_` are automatically injected
   * into the process environment.
   * 
   * @version 2
  */
  env: {
    [key: string]: any
  },

  /**
   * Set the method Nuxt uses to require modules, such as loading `nuxt.config`, server middleware, and so on - defaulting to `jiti` (which has support for TypeScript and ESM syntax).
   * 
   * @see [jiti](https://github.com/unjs/jiti)
   * 
   * @version 2
  */
  createRequire: 'jiti' | 'native' | ((p: string | { filename: string }) => NodeRequire),

  /**
   * Whether your Nuxt app should be built to be served by the Nuxt server (`server`) or as static HTML files suitable for a CDN or other static file server (`static`).
   * This is unrelated to `ssr`.
   * @default "server"
   * 
   * @version 2
  */
  target: 'server' | 'static',

  /**
   * Whether to enable rendering of HTML - either dynamically (in server mode) or at generate time. If set to `false` and combined with `static` target, generated pages will simply display a loading screen with no content.
   * @default true
   * 
   * @version 2
   * 
   * @version 3
  */
  ssr: boolean,

  /**
   * @default "spa"
   * 
   * @deprecated `mode` option is deprecated
   * 
   * @deprecated use ssr option
  */
  mode: string,

  /**
   * Whether to produce a separate modern build targeting browsers that support ES modules.
   * Set to `'server'` to enable server mode, where the Nuxt server checks browser version based on the user agent and serves the correct bundle.
   * Set to `'client'` to serve both the modern bundle with `<script type="module">` and the legacy bundle with `<script nomodule>`. It will also provide a `<link rel="modulepreload">` for the modern bundle. Every browser that understands the module type will load the modern bundle while older browsers fall back to the legacy (transpiled) bundle.
   * If you have set `modern: true` and are generating your app or have `ssr: false`, modern will be set to `'client'`.
   * If you have set `modern: true` and are serving your app, modern will be set to `'server'`.
   * 
   * @see [concept of modern mode](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/)
   * 
   * @version 2
  */
  modern: 'server' | 'client' | boolean,

  /**
   * Modules are Nuxt extensions which can extend its core functionality and add endless integrations
   * Each module is either a string (which can refer to a package, or be a path to a file), a tuple with the module as first string and the options as a second object, or an inline module function.
   * Nuxt tries to resolve each item in the modules array using node require path (in `node_modules`) and then will be resolved from project `srcDir` if `~` alias is used.
   * 
   * @note Modules are executed sequentially so the order is important.
   * 
   * @example
   * ```js
   * modules: [
   *   // Using package name
   *   '@nuxtjs/axios',
   *   // Relative to your project srcDir
   *   '~/modules/awesome.js',
   *   // Providing options
   *   ['@nuxtjs/google-analytics', { ua: 'X1234567' }],
   *   // Inline definition
   *   function () {}
   * ]
   * ```
   * 
   * @version 2
   * 
   * @version 3
  */
  modules: (NuxtModule | string | [NuxtModule | string, Record<string, any>])[],

  /**
   * Modules that are only required during development and build time.
   * Modules are Nuxt extensions which can extend its core functionality and add endless integrations
   * Each module is either a string (which can refer to a package, or be a path to a file), a tuple with the module as first string and the options as a second object, or an inline module function.
   * Nuxt tries to resolve each item in the modules array using node require path (in `node_modules`) and then will be resolved from project `srcDir` if `~` alias is used.
   * 
   * @note Modules are executed sequentially so the order is important.
   * 
   * @example
   * ```js
   * modules: [
   *   // Using package name
   *   '@nuxtjs/axios',
   *   // Relative to your project srcDir
   *   '~/modules/awesome.js',
   *   // Providing options
   *   ['@nuxtjs/google-analytics', { ua: 'X1234567' }],
   *   // Inline definition
   *   function () {}
   * ]
   * ```
   * 
   * @note In Nuxt 2, using `buildModules` helps to make production startup faster and also significantly
   * decreases the size of `node_modules` in production deployments. Please refer to each
   * module's documentation to see if it is recommended to use `modules` or `buildModules`.
   * 
   * @version 2
   * 
   * @deprecated This is no longer needed in Nuxt 3 and Nuxt Bridge; all modules should be added to `modules` instead.
  */
  buildModules: (NuxtModule | string | [NuxtModule | string, Record<string, any>])[],

  /**
   * Built-in ad-hoc modules
   *  @private
  */
  _modules: Array<any>,

  /**
   * Installed module metadata
   * 
   * @version 3
   * 
   * @private
  */
  _installedModules: Array<any>,

  /**
   * Allows customizing the global ID used in the main HTML template as well as the main Vue instance name and other options.
   * @default "nuxt"
   * 
   * @version 2
  */
  globalName: string,

  /**
   * Customizes specific global names (they are based on `globalName` by default).
   * 
   * @version 2
  */
  globals: {
    id: (globalName: string) => string,

    nuxt: (globalName: string) => string,

    context: (globalName: string) => string,

    pluginPrefix: (globalName: string) => string,

    readyCallback: (globalName: string) => string,

    loadedCallback: (globalName: string) => string,
  },

  /**
   * Server middleware are connect/express/h3-shaped functions that handle server-side requests. They run on the server and before the Vue renderer.
   * By adding entries to `serverMiddleware` you can register additional routes without the need for an external server.
   * You can pass a string, which can be the name of a node dependency or a path to a file. You can also pass an object with `path` and `handler` keys. (`handler` can be a path or a function.)
   * 
   * @note If you pass a function directly, it will only run in development mode.
   * 
   * @example
   * ```js
   * serverMiddleware: [
   *   // Will register redirect-ssl npm package
   *   'redirect-ssl',
   *   // Will register file from project server-middleware directory to handle /server-middleware/* requires
   *   { path: '/server-middleware', handler: '~/server-middleware/index.js' },
   *   // We can create custom instances too, but only in development mode, they are ignored for the production bundle.
   *   { path: '/static2', handler: serveStatic(fileURLToPath(new URL('./static2', import.meta.url))) }
   * ]
   * ```
   * 
   * @note If you don't want middleware to run on all routes you should use the object
   * form with a specific path.
   * 
   * If you pass a string handler, Nuxt will expect that file to export a default function
   * that handles `(req, res, next) => void`.
   * 
   * @example
   * ```js
   * export default function (req, res, next) {
   *   // req is the Node.js http request object
   *   console.log(req.url)
   *   // res is the Node.js http response object
   *   // next is a function to call to invoke the next middleware
   *   // Don't forget to call next at the end if your middleware is not an endpoint!
   *   next()
   * }
   * ```
   * 
   * Alternatively, it can export a connect/express/h3-type app instance.
   * 
   * @example
   * ```js
   * import bodyParser from 'body-parser'
   * import createApp from 'express'
   * const app = createApp()
   * app.use(bodyParser.json())
   * app.all('/getJSON', (req, res) => {
   *   res.json({ data: 'data' })
   * })
   * export default app
   * ```
   * 
   * Alternatively, instead of passing an array of `serverMiddleware`, you can pass an object
   * whose keys are the paths and whose values are the handlers (string or function).
   * 
   * @example
   * ```js
   * export default {
   *   serverMiddleware: {
   *     '/a': '~/server-middleware/a.js',
   *     '/b': '~/server-middleware/b.js',
   *     '/c': '~/server-middleware/c.js'
   *   }
   * }
   * ```
   * 
   * @version 2
   * 
   * @deprecated Use `serverHandlers` instead
  */
  serverMiddleware: Array<any>,

  /**
   * Used to set the modules directories for path resolving (for example, webpack's `resolveLoading`, `nodeExternals` and `postcss`).
   * The configuration path is relative to `options.rootDir` (default is current working directory).
   * Setting this field may be necessary if your project is organized as a yarn workspace-styled mono-repository.
   * @default ["/<rootDir>/node_modules","/home/mklaproth/Projects/nuxt-render-hooks/packages/schema/node_modules"]
   * 
   * @example
   * ```js
   * export default {
   *   modulesDir: ['../../node_modules']
   * }
   * ```
   * 
   * @version 2
  */
  modulesDir: Array<string>,

  /**
   * Customize default directory structure used by nuxt.
   * It is better to stick with defaults unless needed.
   * 
   * @version 2
   * 
   * @version 3
  */
  dir: {
    /**
     * The assets directory (aliased as `~assets` in your build)
     * @default "assets"
     * 
     * @version 2
    */
    assets: string,

    /**
     * The directory containing app template files like `app.html` and `router.scrollBehavior.js`
     * @default "app"
     * 
     * @version 2
    */
    app: string,

    /**
     * The layouts directory, each file of which will be auto-registered as a Nuxt layout.
     * @default "layouts"
     * 
     * @version 2
     * 
     * @version 3
    */
    layouts: string,

    /**
     * The middleware directory, each file of which will be auto-registered as a Nuxt middleware.
     * @default "middleware"
     * 
     * @version 3
     * 
     * @version 2
    */
    middleware: string,

    /**
     * The directory which will be processed to auto-generate your application page routes.
     * @default "pages"
     * 
     * @version 2
     * 
     * @version 3
    */
    pages: string,

    /**
     * The directory containing your static files, which will be directly accessible via the Nuxt server and copied across into your `dist` folder when your app is generated.
     * @default "public"
     * 
     * @version 3
    */
    public: string,

    /**
     * @default "public"
     * 
     * @deprecated use `dir.public` option instead
     * 
     * @version 2
    */
    static: string,

    /**
     * The folder which will be used to auto-generate your Vuex store structure.
     * @default "store"
     * 
     * @version 2
    */
    store: string,
  },

  /**
   * The extensions that should be resolved by the Nuxt resolver.
   * @default [".js",".jsx",".mjs",".ts",".tsx",".vue"]
   * 
   * @version 2
   * 
   * @version 3
  */
  extensions: Array<string>,

  /**
   * The style extensions that should be resolved by the Nuxt resolver (for example, in `css` property).
   * @default [".css",".pcss",".postcss",".styl",".stylus",".scss",".sass",".less"]
   * 
   * @version 2
  */
  styleExtensions: Array<string>,

  /**
   * You can improve your DX by defining additional aliases to access custom directories within your JavaScript and CSS.
   * 
   * @note Within a webpack context (image sources, CSS - but not JavaScript) you _must_ access
   * your alias by prefixing it with `~`.
   * 
   * @note These aliases will be automatically added to the generated `.nuxt/tsconfig.json` so you can get full
   * type support and path auto-complete. In case you need to extend options provided by `./.nuxt/tsconfig.json`
   * further, make sure to add them here or within the `typescript.tsConfig` property in `nuxt.config`.
   * 
   * @example
   * ```js
   * export default {
   *   alias: {
   *     'images': fileURLToPath(new URL('./assets/images', import.meta.url)),
   *     'style': fileURLToPath(new URL('./assets/style', import.meta.url)),
   *     'data': fileURLToPath(new URL('./assets/other/data', import.meta.url))
   *   }
   * }
   * ```
   * 
   * ```html
   * <template>
   *   <img src="~images/main-bg.jpg">
   * </template>
   * 
   * <script>
   * import data from 'data/test.json'
   * </script>
   * 
   * <style>
   * // Uncomment the below
   * //@import '~style/variables.scss';
   * //@import '~style/utils.scss';
   * //@import '~style/base.scss';
   * body {
   *   background-image: url('~images/main-bg.jpg');
   * }
   * </style>
   * ```
   * 
   * @version 2
   * 
   * @version 3
  */
  alias: Record<string, string>,

  /**
   * Pass options directly to `node-ignore` (which is used by Nuxt to ignore files).
   * 
   * @see [node-ignore](https://github.com/kaelzhang/node-ignore)
   * 
   * @example
   * ```js
   * ignoreOptions: {
   *   ignorecase: false
   * }
   * ```
   * 
   * @version 2
   * 
   * @version 3
  */
  ignoreOptions: any,

  /**
   * Any file in `pages/`, `layouts/`, `middleware/` or `store/` will be ignored during building if its filename starts with the prefix specified by `ignorePrefix`.
   * @default "-"
   * 
   * @version 2
   * 
   * @version 3
  */
  ignorePrefix: string,

  /**
   * More customizable than `ignorePrefix`: all files matching glob patterns specified inside the `ignore` array will be ignored in building.
   * @default ["**\/*.stories.{js,ts,jsx,tsx}","**\/*.{spec,test}.{js,ts,jsx,tsx}",".output","**\/-*.*"]
   * 
   * @version 2
   * 
   * @version 3
  */
  ignore: Array<string>,

  /**
   * The watch property lets you watch custom files for restarting the server.
   * `chokidar` is used to set up the watchers. To learn more about its pattern options, see chokidar documentation.
   * 
   * @see [chokidar](https://github.com/paulmillr/chokidar#api)
   * 
   * @example
   * ```js
   * watch: ['~/custom/*.js']
   * ```
   * 
   * @version 2
  */
  watch: string[],

  /**
   * The watchers property lets you overwrite watchers configuration in your `nuxt.config`.
   * 
   * @version 2
   * 
   * @version 3
  */
  watchers: {
    /** An array of event types, which, when received, will cause the watcher to restart. */
    rewatchOnRawEvents: any,

    /**
     * `watchOptions` to pass directly to webpack.
     * 
     * @see [webpack@4 watch options](https://v4.webpack.js.org/configuration/watch/#watchoptions).
    */
    webpack: {
       /** @default 1000 */
       aggregateTimeout: number,
    },

    /**
     * Options to pass directly to `chokidar`.
     * 
     * @see [chokidar](https://github.com/paulmillr/chokidar#api)
    */
    chokidar: {
       /** @default true */
       ignoreInitial: boolean,
    },
  },

  /**
   * Your preferred code editor to launch when debugging.
   * 
   * @see [documentation](https://github.com/yyx990803/launch-editor#supported-editors)
   * 
   * @version 2
  */
  editor: string,

  /**
   * Hooks are listeners to Nuxt events that are typically used in modules, but are also available in `nuxt.config`.
   * Internally, hooks follow a naming pattern using colons (e.g., build:done).
   * For ease of configuration, you can also structure them as an hierarchical object in `nuxt.config` (as below).
   * 
   * @example
   * ```js'node:fs'
   * import fs from 'node:fs'
   * import path from 'node:path'
   * export default {
   *   hooks: {
   *     build: {
   *       done(builder) {
   *         const extraFilePath = path.join(
   *           builder.nuxt.options.buildDir,
   *           'extra-file'
   *         )
   *         fs.writeFileSync(extraFilePath, 'Something extra')
   *       }
   *     }
   *   }
   * }
   * ```
   * 
   * @version 2
   * 
   * @version 3
  */
  hooks: NuxtHooks,

  /**
   * Runtime config allows passing dynamic config and environment variables to the Nuxt app context.
   * The value of this object is accessible from server only using `useRuntimeConfig`.
   * It mainly should hold _private_ configuration which is not exposed on the frontend. This could include a reference to your API secret tokens.
   * Anything under `public` and `app` will be exposed to the frontend as well.
   * Values are automatically replaced by matching env variables at runtime, e.g. setting an environment variable `API_KEY=my-api-key PUBLIC_BASE_URL=/foo/` would overwrite the two values in the example below.
   * 
   * @example
   * ```js
   * export default {
   *  runtimeConfig: {
   *     apiKey: '' // Default to an empty string, automatically set at runtime using process.env.NUXT_API_KEY
   *     public: {
   *        baseURL: '' // Exposed to the frontend as well.
   *     }
   *   }
   * }
   * ```
   * 
   * @version 3
  */
  runtimeConfig: RuntimeConfig,

  /**
   * 
   * @version 2
   * 
   * @version 3
   * 
   * @deprecated Use `runtimeConfig` option
  */
  privateRuntimeConfig: PrivateRuntimeConfig,

  /**
   * 
   * @version 2
   * 
   * @version 3
   * 
   * @deprecated Use `runtimeConfig` option with `public` key (`runtimeConfig.public.*`)
  */
  publicRuntimeConfig: PublicRuntimeConfig,

  /**
   * @default 2
   * 
   * @private
  */
  _majorVersion: number,

  /**
   * @default false
   * 
   * @private
  */
  _legacyGenerate: boolean,

  /**
   * @default false
   * 
   * @private
  */
  _start: boolean,

  /**
   * @default false
   * 
   * @private
  */
  _build: boolean,

  /**
   * @default false
   * 
   * @private
  */
  _generate: boolean,

  /**
   * @default false
   * 
   * @private
  */
  _prepare: boolean,

  /**
   * @default false
   * 
   * @private
  */
  _cli: boolean,

  /**
   * 
   * @private
  */
  _requiredModules: any,

  /**
   * 
   * @private
  */
  _nuxtConfigFile: any,

  /**
   * 
   * @private
  */
  _nuxtConfigFiles: Array<any>,

  /**
   * @default ""
   * 
   * @private
  */
  appDir: string,

  /**
   * 
   * @version 3
  */
  postcss: {
    /**
     * Path to postcss config file.
     * @default false
    */
    config: boolean,

    /**
     * Options for configuring PostCSS plugins.
     * https://postcss.org/
    */
    plugins: Record<string, any>,
  },

  /**
   * Configuration for Nuxt's TypeScript integration.
   * 
   * @version 2
   * 
   * @version 3
  */
  typescript: {
    /**
     * TypeScript comes with certain checks to give you more safety and analysis of your program. Once you’ve converted your codebase to TypeScript, you can start enabling these checks for greater safety. [Read More](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html#getting-stricter-checks)
     * @default false
    */
    strict: boolean,

    /**
     * Enable build-time type checking.
     * If set to true, this will type check in development. You can restrict this to build-time type checking by setting it to `build`.
     * @default false
    */
    typeCheck: boolean | 'build',

    /** You can extend generated `.nuxt/tsconfig.json` using this option */
    tsConfig: readPackageJSON,

    /**
     * Generate a `*.vue` shim.
     * We recommend instead either enabling [**Take Over Mode**](https://github.com/johnsoncodehk/volar/discussions/471) or adding **TypeScript Vue Plugin (Volar)** 👉 [[Download](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.vscode-typescript-vue-plugin)].
     * @default true
    */
    shim: boolean,
  },

  /**
   * Configuration that will be passed directly to Vite.
   * See https://vitejs.dev/config for more information. Please note that not all vite options are supported in Nuxt.
   * 
   * @version 3
  */
  vite: UserConfig,

  /**
   * 
   * @version 3
  */
  webpack: {
    /**
     * Nuxt uses `webpack-bundle-analyzer` to visualize your bundles and how to optimize them.
     * Set to `true` to enable bundle analysis, or pass an object with options: [for webpack](https://github.com/webpack-contrib/webpack-bundle-analyzer#options-for-plugin) or [for vite](https://github.com/btd/rollup-plugin-visualizer#options).
     * @default false
     * 
     * @example
     * ```js
     * analyze: {
     *   analyzerMode: 'static'
     * }
     * ```
    */
    analyze: boolean | BundleAnalyzerPlugin.Options,

    /**
     * Enable the profiler in webpackbar.
     * It is normally enabled by CLI argument `--profile`.
     * @default false
     * 
     * @see [webpackbar](https://github.com/unjs/webpackbar#profile)
    */
    profile: boolean,

    /**
     * Enables Common CSS Extraction using [Vue Server Renderer guidelines](https://ssr.vuejs.org/guide/css.html).
     * Using [extract-css-chunks-webpack-plugin](https://github.com/faceyspacey/extract-css-chunks-webpack-plugin/) under the hood, your CSS will be extracted into separate files, usually one per component. This allows caching your CSS and JavaScript separately and is worth trying if you have a lot of global or shared CSS.
     * @default true
     * 
     * @example
     * ```js
     * export default {
     *   webpack: {
     *     extractCSS: true,
     *     // or
     *     extractCSS: {
     *       ignoreOrder: true
     *     }
     *   }
     * }
     * ```
     * 
     * If you want to extract all your CSS to a single file, there is a workaround for this.
     * However, note that it is not recommended to extract everything into a single file.
     * Extracting into multiple CSS files is better for caching and preload isolation. It
     * can also improve page performance by downloading and resolving only those resources
     * that are needed.
     * 
     * @example
     * ```js
     * export default {
     *   webpack: {
     *     extractCSS: true,
     *     optimization: {
     *       splitChunks: {
     *         cacheGroups: {
     *           styles: {
     *             name: 'styles',
     *             test: /\.(css|vue)$/,
     *             chunks: 'all',
     *             enforce: true
     *           }
     *         }
     *       }
     *     }
     *   }
     * }
     * ```
    */
    extractCSS: boolean | PluginOptions,

    /**
     * Enables CSS source map support (defaults to true in development)
     * @default false
    */
    cssSourceMap: boolean,

    /**
     * The polyfill library to load to provide URL and URLSearchParams.
     * Defaults to `'url'` ([see package](https://www.npmjs.com/package/url)).
     * @default "url"
    */
    serverURLPolyfill: string,

    /**
     * Customize bundle filenames.
     * To understand a bit more about the use of manifests, take a look at [this webpack documentation](https://webpack.js.org/guides/code-splitting/).
     * 
     * @note Be careful when using non-hashed based filenames in production
     * as most browsers will cache the asset and not detect the changes on first load.
     * 
     * This example changes fancy chunk names to numerical ids:
     * 
     * @example
     * ```js
     * filenames: {
     *   chunk: ({ isDev }) => (isDev ? '[name].js' : '[id].[contenthash].js')
     * }
     * ```
    */
    filenames: {
       app: () => any,

       chunk: () => any,

       css: () => any,

       img: () => any,

       font: () => any,

       video: () => any,
    },

    /** Customize the options of Nuxt's integrated webpack loaders. */
    loaders: {
       file: {
           /** @default false */
           esModule: boolean,
       },

       fontUrl: {
           /** @default false */
           esModule: boolean,

           /** @default 1000 */
           limit: number,
       },

       imgUrl: {
           /** @default false */
           esModule: boolean,

           /** @default 1000 */
           limit: number,
       },

       pugPlain: any,

       vue: {
           /** @default true */
           productionMode: boolean,

           transformAssetUrls: {
                /** @default "src" */
                video: string,

                /** @default "src" */
                source: string,

                /** @default "src" */
                object: string,

                /** @default "src" */
                embed: string,
           },

           compilerOptions: {
                [key: string]: any
           },
       },

       css: {
           /** @default 0 */
           importLoaders: number,

           url: {
                filter: () => any,
           },

           /** @default false */
           esModule: boolean,
       },

       cssModules: {
           /** @default 0 */
           importLoaders: number,

           url: {
                filter: () => any,
           },

           /** @default false */
           esModule: boolean,

           modules: {
                /** @default "[local]_[hash:base64:5]" */
                localIdentName: string,
           },
       },

       less: any,

       sass: {
           sassOptions: {
                /** @default true */
                indentedSyntax: boolean,
           },
       },

       scss: any,

       stylus: any,

       vueStyle: any,
    },

    /**
     * Add webpack plugins.
     * 
     * @example
     * ```js
     * import webpack from 'webpack'
     * import { version } from './package.json'
     * // ...
     * plugins: [
     *   new webpack.DefinePlugin({
     *     'process.VERSION': version
     *   })
     * ]
     * ```
    */
    plugins: Array<any>,

    /**
     * Terser plugin options.
     * Set to false to disable this plugin, or pass an object of options.
     * 
     * @see [terser-webpack-plugin documentation](https://github.com/webpack-contrib/terser-webpack-plugin)
     * 
     * @note Enabling sourceMap will leave `//# sourceMappingURL` linking comment at
     * the end of each output file if webpack `config.devtool` is set to `source-map`.
    */
    terser: false | BasePluginOptions & DefinedDefaultMinimizerAndOptions<any>,

    /**
     * Hard-replaces `typeof process`, `typeof window` and `typeof document` to tree-shake bundle.
     * @default false
    */
    aggressiveCodeRemoval: boolean,

    /**
     * OptimizeCSSAssets plugin options.
     * Defaults to true when `extractCSS` is enabled.
     * @default false
     * 
     * @see [css-minimizer-webpack-plugin documentation](https://github.com/webpack-contrib/css-minimizer-webpack-plugin).
    */
    optimizeCSS: false | BasePluginOptions$1 & DefinedDefaultMinimizerAndOptions$1<any>,

    /** Configure [webpack optimization](https://webpack.js.org/configuration/optimization/). */
    optimization: false | Configuration['optimization'],

    /** Customize PostCSS Loader. Same options as https://github.com/webpack-contrib/postcss-loader#options */
    postcss: {
       execute: any,

       postcssOptions: {
           /** @default false */
           config: boolean,

           plugins: {
                [key: string]: any
           },
       },

       sourceMap: any,

       implementation: any,

       /** @default "" */
       order: string,
    },

    /** See [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) for available options. */
    devMiddleware: Options<IncomingMessage$1, ServerResponse$1>,

    /** See [webpack-hot-middleware](https://github.com/webpack-contrib/webpack-hot-middleware) for available options. */
    hotMiddleware: MiddlewareOptions & { client?: ClientOptions },

    /**
     * Set to `false` to disable the overlay provided by [FriendlyErrorsWebpackPlugin](https://github.com/nuxt/friendly-errors-webpack-plugin)
     * @default true
    */
    friendlyErrors: boolean,

    /** Filters to hide build warnings. */
    warningIgnoreFilters: Array<(warn: WebpackError) => boolean>,
  },

  /**
   * Configuration for Nitro
   * 
   * @see https://nitro.unjs.io/config/
   * 
   * @version 2
   * 
   * @version 3
  */
  nitro: NitroConfig,

  /**
   * Nitro server handlers
   * 
   * @see https://nitro.unjs.io/guide/routing.html
   * 
   * **Note:** Files from `server/api`, `server/middleware` and `server/routes` will be automatically registred by Nuxt.
   * 
   * @version 3
  */
  serverHandlers: NitroEventHandler[],

  /**
   * Nitro devevelopment-only server handlers
   * 
   * @see https://nitro.unjs.io/guide/routing.html
   * 
   * @version 3
  */
  devServerHandlers: NitroDevEventHandler[],

  /**
   * 
   * @version 3
  */
  experimental: {
    /**
     * Set to true to generate an async entry point for the Vue bundle (for module federation support).
     * @default false
    */
    asyncEntry: boolean,

    /**
     * Use vite-node for on-demand server chunk loading
     * @default false
    */
    viteNode: boolean,

    /**
     * Enable Vue's reactivity transform
     * @default false
     * 
     * @see https://vuejs.org/guide/extras/reactivity-transform.html
    */
    reactivityTransform: boolean,

    /**
     * Externalize `vue`, `@vue/*` and `vue-router` when build
     * @default false
     * 
     * @see https://github.com/nuxt/framework/issues/4084
    */
    externalVue: boolean,

    /**
     * Tree shakes contents of client-only components from server bundle
     * @default false
     * 
     * @see https://github.com/nuxt/framework/pull/5750
    */
    treeshakeClientOnly: boolean,
  },

  /**
   * The builder to use for bundling the Vue part of your application.
   * @default "@nuxt/vite-builder"
   * 
   * @version 3
  */
  builder: 'vite' | 'webpack' | { bundle: (nuxt: Nuxt) => Promise<void> },

  /**
   * Whether to generate sourcemaps.
   * @default true
   * 
   * @version 3
  */
  sourcemap: boolean,

  /**
   * Shared build configuration.
   * 
   * @version 2
   * 
   * @version 3
  */
  build: {
    /**
     * Suppresses most of the build output log.
     * It is enabled by default when a CI or test environment is detected.
     * @default false
     * 
     * @see [std-env](https://github.com/unjs/std-env)
     * 
     * @version 2
     * 
     * @version 3
    */
    quiet: boolean,

    /**
     * Nuxt uses `webpack-bundle-analyzer` to visualize your bundles and how to optimize them.
     * Set to `true` to enable bundle analysis, or pass an object with options: [for webpack](https://github.com/webpack-contrib/webpack-bundle-analyzer#options-for-plugin) or [for vite](https://github.com/btd/rollup-plugin-visualizer#options).
     * @default false
     * 
     * @example
     * ```js
     * analyze: {
     *   analyzerMode: 'static'
     * }
     * ```
    */
    analyze: boolean | BundleAnalyzerPlugin.Options | PluginVisualizerOptions,

    /**
     * Enable the profiler in webpackbar.
     * It is normally enabled by CLI argument `--profile`.
     * @default false
     * 
     * @see [webpackbar](https://github.com/unjs/webpackbar#profile)
     * 
     * @version 2
    */
    profile: boolean,

    /**
     * Enables Common CSS Extraction using [Vue Server Renderer guidelines](https://ssr.vuejs.org/guide/css.html).
     * Using [extract-css-chunks-webpack-plugin](https://github.com/faceyspacey/extract-css-chunks-webpack-plugin/) under the hood, your CSS will be extracted into separate files, usually one per component. This allows caching your CSS and JavaScript separately and is worth trying if you have a lot of global or shared CSS.
     * @default false
     * 
     * @example
     * ```js
     * export default {
     *   build: {
     *     extractCSS: true,
     *     // or
     *     extractCSS: {
     *       ignoreOrder: true
     *     }
     *   }
     * }
     * ```
     * 
     * If you want to extract all your CSS to a single file, there is a workaround for this.
     * However, note that it is not recommended to extract everything into a single file.
     * Extracting into multiple CSS files is better for caching and preload isolation. It
     * can also improve page performance by downloading and resolving only those resources
     * that are needed.
     * 
     * @example
     * ```js
     * export default {
     *   build: {
     *     extractCSS: true,
     *     optimization: {
     *       splitChunks: {
     *         cacheGroups: {
     *           styles: {
     *             name: 'styles',
     *             test: /\.(css|vue)$/,
     *             chunks: 'all',
     *             enforce: true
     *           }
     *         }
     *       }
     *     }
     *   }
     * }
     * ```
     * 
     * @version 2
    */
    extractCSS: boolean,

    /**
     * Enables CSS source map support (defaults to true in development)
     * @default true
     * 
     * @version 2
    */
    cssSourceMap: boolean,

    /**
     * Creates special webpack bundle for SSR renderer. It is normally not necessary to change this value.
     * 
     * @version 2
    */
    ssr: any,

    /**
     * Enable [thread-loader](https://github.com/webpack-contrib/thread-loader#thread-loader) when building app with webpack.
     * @default false
     * 
     * @warning This is an unstable feature.
     * 
     * @version 2
    */
    parallel: boolean,

    /**
     * Enable caching for [`terser-webpack-plugin`](https://github.com/webpack-contrib/terser-webpack-plugin#options) and [`cache-loader`](https://github.com/webpack-contrib/cache-loader#cache-loader)
     * @default false
     * 
     * @warning This is an unstable feature.
     * 
     * @version 2
    */
    cache: boolean,

    /**
     * Inline server bundle dependencies
     * This mode bundles `node_modules` that are normally preserved as externals in the server build.
     * @default false
     * 
     * @warning Runtime dependencies (modules, `nuxt.config`, server middleware and the static directory) are not bundled.
     * This feature only disables use of [webpack-externals](https://webpack.js.org/configuration/externals/) for server-bundle.
     * 
     * @note You can enable standalone bundling by passing `--standalone` via the command line.
     * 
     * @see [context](https://github.com/nuxt/nuxt.js/pull/4661)
     * 
     * @version 2
    */
    standalone: boolean,

    /**
     * If you are uploading your dist files to a CDN, you can set the publicPath to your CDN.
     * @default "/_nuxt/"
     * 
     * @note This is only applied in production.
     * 
     * The value of this property at runtime will override the configuration of an app that
     * has already been built.
     * 
     * @example
     * ```js
     * build: {
     *   publicPath: process.env.PUBLIC_PATH || 'https://cdn.nuxtjs.org'
     * }
     * ```
     * 
     * @version 2
    */
    publicPath: string,

    /**
     * The polyfill library to load to provide URL and URLSearchParams.
     * Defaults to `'url'` ([see package](https://www.npmjs.com/package/url)).
     * @default "url"
     * 
     * @version 2
    */
    serverURLPolyfill: string,

    /**
     * Customize bundle filenames.
     * To understand a bit more about the use of manifests, take a look at [this webpack documentation](https://webpack.js.org/guides/code-splitting/).
     * 
     * @note Be careful when using non-hashed based filenames in production
     * as most browsers will cache the asset and not detect the changes on first load.
     * 
     * This example changes fancy chunk names to numerical ids:
     * 
     * @example
     * ```js
     * filenames: {
     *   chunk: ({ isDev }) => (isDev ? '[name].js' : '[id].[contenthash].js')
     * }
     * ```
     * 
     * @version 2
    */
    filenames: {
       app: () => any,

       chunk: () => any,

       css: () => any,

       img: () => any,

       font: () => any,

       video: () => any,
    },

    /**
     * Customize the options of Nuxt's integrated webpack loaders.
     * 
     * @version 2
    */
    loaders: {
       file: {
           /** @default false */
           esModule: boolean,
       },

       fontUrl: {
           /** @default false */
           esModule: boolean,

           /** @default 1000 */
           limit: number,
       },

       imgUrl: {
           /** @default false */
           esModule: boolean,

           /** @default 1000 */
           limit: number,
       },

       pugPlain: any,

       vue: {
           /** @default true */
           productionMode: boolean,

           transformAssetUrls: {
                /** @default "src" */
                video: string,

                /** @default "src" */
                source: string,

                /** @default "src" */
                object: string,

                /** @default "src" */
                embed: string,
           },

           compilerOptions: {
                [key: string]: any
           },
       },

       css: {
           /** @default 0 */
           importLoaders: number,

           /** @default false */
           esModule: boolean,
       },

       cssModules: {
           /** @default 0 */
           importLoaders: number,

           /** @default false */
           esModule: boolean,

           modules: {
                /** @default "[local]_[hash:base64:5]" */
                localIdentName: string,
           },
       },

       less: any,

       sass: {
           sassOptions: {
                /** @default true */
                indentedSyntax: boolean,
           },
       },

       scss: any,

       stylus: any,

       vueStyle: any,
    },

    /**
     * 
     * @deprecated  Use [style-resources-module](https://github.com/nuxt-community/style-resources-module/)
     * 
     * @version 2
    */
    styleResources: any,

    /**
     * Add webpack plugins.
     * 
     * @example
     * ```js
     * import webpack from 'webpack'
     * import { version } from './package.json'
     * // ...
     * plugins: [
     *   new webpack.DefinePlugin({
     *     'process.VERSION': version
     *   })
     * ]
     * ```
     * 
     * @version 2
    */
    plugins: Array<any>,

    /**
     * Terser plugin options.
     * Set to false to disable this plugin, or pass an object of options.
     * 
     * @see [terser-webpack-plugin documentation](https://github.com/webpack-contrib/terser-webpack-plugin)
     * 
     * @note Enabling sourcemap will leave `//# sourcemappingURL` linking comment at
     * the end of each output file if webpack `config.devtool` is set to `source-map`.
     * 
     * @version 2
    */
    terser: any,

    /**
     * Enables the [HardSourceWebpackPlugin](https://github.com/mzgoddard/hard-source-webpack-plugin) for improved caching.
     * @default false
     * 
     * @warning unstable
     * 
     * @version 2
    */
    hardSource: boolean,

    /**
     * Hard-replaces `typeof process`, `typeof window` and `typeof document` to tree-shake bundle.
     * @default false
     * 
     * @version 2
    */
    aggressiveCodeRemoval: boolean,

    /**
     * OptimizeCSSAssets plugin options.
     * Defaults to true when `extractCSS` is enabled.
     * @default false
     * 
     * @see [optimize-css-assets-webpack-plugin documentation](https://github.com/NMFR/optimize-css-assets-webpack-plugin).
     * 
     * @version 2
    */
    optimizeCSS: boolean,

    /**
     * Configure [webpack optimization](https://webpack.js.org/configuration/optimization/).
     * 
     * @version 2
    */
    optimization: {
       /** @default "single" */
       runtimeChunk: string,

       /**
        * Set minimize to false to disable all minimizers. (It is disabled in development by default)
        * @default true
       */
       minimize: boolean,

       /** You can set minimizer to a customized array of plugins. */
       minimizer: any,

       splitChunks: {
           /** @default "all" */
           chunks: string,

           /** @default "/" */
           automaticNameDelimiter: string,

           cacheGroups: any,
       },
    },

    /**
     * Whether to split code for `layout`, `pages` and `commons` chunks.
     * Commons libs include `vue`, `vue-loader`, `vue-router`, `vuex`, etc.
     * 
     * @version 2
    */
    splitChunks: {
       /** @default false */
       layouts: boolean,

       /** @default true */
       pages: boolean,

       /** @default true */
       commons: boolean,
    },

    /**
     * Nuxt will automatically detect the current version of `core-js` in your project (`'auto'`), or you can specify which version you want to use (`2` or `3`).
     * @default "auto"
     * 
     * @version 2
    */
    corejs: string,

    /**
     * Customize your Babel configuration.
     * See [babel-loader options](https://github.com/babel/babel-loader#options) and [babel options](https://babeljs.io/docs/en/options).
     * 
     * @note `.babelrc` is ignored by default.
     * 
     * @version 2
    */
    babel: {
       /** @default false */
       configFile: boolean,

       /** @default false */
       babelrc: boolean,

       /**
        * An array of Babel plugins to load, or a function that takes webpack context and returns an array of Babel plugins.
        * For more information see [Babel plugins options](https://babeljs.io/docs/en/options#plugins) and [babel-loader options](https://github.com/babel/babel-loader#options).
       */
       plugins: Array<any>,

       /**
        * The Babel presets to be applied.
        * 
        * @note The presets configured here will be applied to both the client and the server
        * build. The target will be set by Nuxt accordingly (client/server). If you want to configure
        * the preset differently for the client or the server build, please use presets as a function.
        * 
        * @warning It is highly recommended to use the default preset instead customizing.
        * 
        * @example
        * ```js
        * export default {
        *   build: {
        *     babel: {
        *       presets({ isServer }, [ preset, options ]) {
        *         // change options directly
        *         options.targets = isServer ? '...' :  '...'
        *         options.corejs = '...'
        *         // return nothing
        *       }
        *     }
        *   }
        * }
        * ```
        * 
        * @example
        * ```js
        * export default {
        *   build: {
        *     babel: {
        *       presets({ isServer }, [preset, options]) {
        *         return [
        *           [
        *             preset,
        *             {
        *               targets: isServer ? '...' :  '...',
        *               ...options
        *             }
        *           ],
        *           [
        *             // Other presets
        *           ]
        *         ]
        *       }
        *     }
        *   }
        * }
        * ```
       */
       presets: any,

       /** @default false */
       cacheDirectory: boolean,
    },

    /**
     * If you want to transpile specific dependencies with Babel, you can add them here. Each item in transpile can be a package name, a function, a string or regex object matching the dependency's file name.
     * You can also use a function to conditionally transpile. The function will receive an object ({ isDev, isServer, isClient, isModern, isLegacy }).
     * 
     * @example
     * ```js
     *       transpile: [({ isLegacy }) => isLegacy && 'ky']
     * ```
     * 
     * @version 2
     * 
     * @version 3
    */
    transpile: Array<string | RegExp | Function>,

    /**
     * Customize PostCSS Loader plugins. Sames options as https://github.com/webpack-contrib/postcss-loader#options
     * 
     * @version 2
    */
    postcss: {
       execute: any,

       postcssOptions: {
           [key: string]: any
       },

       sourcemap: any,

       implementation: any,

       /** @default "" */
       order: string,
    },

    /**
     * 
     * @version 2
    */
    html: {
       /**
        * Configuration for the html-minifier plugin used to minify HTML files created during the build process (will be applied for all modes).
        * 
        * @warning If you make changes, they won't be merged with the defaults!
        * 
        * @example
        * ```js
        * export default {
        *   html: {
        *     minify: {
        *       collapseBooleanAttributes: true,
        *       decodeEntities: true,
        *       minifyCSS: true,
        *       minifyJS: true,
        *       processConditionalComments: true,
        *       removeEmptyAttributes: true,
        *       removeRedundantAttributes: true,
        *       trimCustomFragments: true,
        *       useShortDoctype: true
        *     }
        *   }
        * }
        * ```
       */
       minify: {
           /** @default true */
           collapseBooleanAttributes: boolean,

           /** @default true */
           decodeEntities: boolean,

           /** @default true */
           minifyCSS: boolean,

           /** @default true */
           minifyJS: boolean,

           /** @default true */
           processConditionalComments: boolean,

           /** @default true */
           removeEmptyAttributes: boolean,

           /** @default true */
           removeRedundantAttributes: boolean,

           /** @default true */
           trimCustomFragments: boolean,

           /** @default true */
           useShortDoctype: boolean,
       },
    },

    /**
     * Allows setting a different app template (other than `@nuxt/vue-app`)
     * 
     * @version 2
    */
    template: any,

    /**
     * You can provide your own templates which will be rendered based on Nuxt configuration. This feature is specially useful for using with modules.
     * Templates are rendered using [`lodash.template`](https://lodash.com/docs/4.17.15#template).
     * 
     * @example
     * ```js
     * templates: [
     *   {
     *     src: '~/modules/support/plugin.js', // `src` can be absolute or relative
     *     dst: 'support.js', // `dst` is relative to project `.nuxt` dir
     *     options: {
     *       // Options are provided to template as `options` key
     *       live_chat: false
     *     }
     *   }
     * ]
     * ```
     * 
     * @version 2
     * 
     * @version 3
    */
    templates: Array<any>,

    /**
     * You can provide your custom files to watch and regenerate after changes.
     * This feature is especially useful for using with modules.
     * 
     * @example
     * ```js
     *       watch: ['~/.nuxt/support.js']
     * ```
     * 
     * @version 2
    */
    watch: Array<any>,

    /**
     * See [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) for available options.
     * 
     * @version 2
    */
    devMiddleware: {
       /** @default "none" */
       stats: string,
    },

    /**
     * See [webpack-hot-middleware](https://github.com/webpack-contrib/webpack-hot-middleware) for available options.
     * 
     * @version 2
    */
    hotMiddleware: any,

    /**
     * 
     * @version 2
    */
    vendor: {
       "$meta": {
           /** @default "vendor has been deprecated since nuxt 2" */
           deprecated: string,
       },
    },

    /**
     * Set to `'none'` or `false` to disable stats printing out after a build.
     * 
     * @version 2
    */
    stats: {
       /** @default [{},{},{}] */
       excludeAssets: Array<any>,
    },

    /**
     * Set to `false` to disable the overlay provided by [FriendlyErrorsWebpackPlugin](https://github.com/nuxt/friendly-errors-webpack-plugin)
     * @default true
     * 
     * @version 2
    */
    friendlyErrors: boolean,

    /**
     * Additional extensions (beyond `['vue', 'js']` to support in `pages/`, `layouts/`, `middleware/`, etc.)
     * 
     * @version 2
    */
    additionalExtensions: Array<any>,

    /**
     * Filters to hide build warnings.
     * 
     * @version 2
    */
    warningIgnoreFilters: Array<any>,

    /**
     * Set to true to scan files within symlinks in the build (such as within `pages/`).
     * @default false
     * 
     * @version 2
    */
    followSymlinks: boolean,
  },

  messages: {
    /**
     * The text that displays on the Nuxt loading indicator when `ssr: false`.
     * @default "Loading..."
    */
    loading: string,

    /**
     * The 404 text on the default Nuxt error page.
     * @default "This page could not be found"
    */
    error_404: string,

    /**
     * The text to display on the default Nuxt error page when there has been a server error.
     * @default "Server error"
    */
    server_error: string,

    /**
     * The text (linked to nuxtjs.org) that appears on the built-in Nuxt error page.
     * @default "Nuxt"
    */
    nuxtjs: string,

    /**
     * The text (linked to the home page) that appears on the built-in Nuxt error page.
     * @default "Back to the home page"
    */
    back_to_home: string,

    /**
     * The message that will display on a white screen if the built-in Nuxt error page can't be rendered.
     * @default "An error occurred in the application and your page could not be served. If you are the application owner, check your logs for details."
    */
    server_error_details: string,

    /**
     * The default error title (if there isn't a specific error message) on the built-in Nuxt error page.
     * @default "Error"
    */
    client_error: string,

    /**
     * The error message (in debug mode) on the built-in Nuxt error page.
     * @default "An error occurred while rendering the page. Check developer tools console for details."
    */
    client_error_details: string,
  },

  render: {
    /**
     * Use this option to customize the Vue SSR bundle renderer. This option is skipped if `ssr: false`.
     * Read [docs for Vue 2](https://ssr.vuejs.org/api/#renderer-options) here.
    */
    bundleRenderer: {
       shouldPrefetch: () => any,

       shouldPreload: () => any,

       /**
        * enabled by default for development
        * @default false
       */
       runInNewContext: boolean,
    },

    /** Configure the crossorigin attribute on `<link rel="stylesheet">` and `<script>` tags in generated HTML. [More information](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin). */
    crossorigin: any,

    /**
     * Adds prefetch and preload links for faster initial page load time. You probably don't want to disable this option unless you have many pages and routes.
     * @default true
    */
    resourceHints: boolean,

    /**
     * Whether to enable rendering of HTML - either dynamically (in server mode) or at generate time.
     * This option is automatically set based on global ssr value if not provided. This can be useful to dynamically enable/disable SSR on runtime after image builds (with docker for example).
    */
    ssr: any,

    /**
     * Forward server-side logs to the browser for better debugging (only available in development)
     * Set to `collapsed` to collapse the logs, or false to disable.
     * @default false
    */
    ssrLog: boolean,

    /** Configuration for HTTP2 push headers */
    http2: {
       /**
        * Set to true to enable HTTP2 push headers
        * @default false
       */
       push: boolean,

       /**
        * 
        * @deprecated
       */
       shouldPush: any,

       /**
        * You can control what links to push using this function. It receives `req`, `res`, `publicPath` and a `preloadFiles` array.
        * You can add your own assets to the array as well. Using `req` and `res` you can decide what links to push based on the request headers, for example using the cookie with application version.
        * Assets will be joined together with `,` and passed as a single `Link` header.
        * 
        * @example
        * ```js
        * pushAssets: (req, res, publicPath, preloadFiles) =>
        *   preloadFiles
        *     .filter(f => f.asType === 'script' && f.file === 'runtime.js')
        *     .map(f => `<${publicPath}${f.file}>; rel=preload; as=${f.asType}`)
        * ```
       */
       pushAssets: any,
    },

    /**
     * Configure the behavior of the `static/` directory.
     * See [serve-static docs](https://github.com/expressjs/serve-static) for possible options.
    */
    static: {
       /**
        * Whether to add the router base to your static assets.
        * @default true
        * 
        * @note some URL rewrites might not respect the prefix.
        * 
        * @example
        * Assets: favicon.ico
        * Router base: /t
        * With `prefix: true` (default): /t/favicon.ico
        * With `prefix: false`: /favicon.ico
       */
       prefix: boolean,
    },

    /**
     * Configure server compression.
     * Set to `false` to disable compression. You can also pass an object of options for [compression middleware](https://www.npmjs.com/package/compression), or use your own middleware by passing it in directly - for example, `otherComp({ myOptions: 'example' })`.
    */
    compressor: boolean | object | Function,

    /**
     * To disable etag for pages set `etag: false`. See [etag docs](https://github.com/jshttp/etag) for possible options. You can use your own hash function by specifying etag.hash:
     * 
     * @example
     * ```js
     * import { murmurHash128 } from 'murmurhash-native'
     * 
     * export default {
     *   render: {
     *     etag: {
     *       hash: html => murmurHash128(html)
     *     }
     *   }
     * }
     * ```
     * In this example we are using `murmurhash-native`, which is faster
     * for larger HTML body sizes. Note that the weak option is ignored
     * when specifying your own hash function.
    */
    etag: {
       /** @default false */
       hash: boolean,

       /** @default false */
       weak: boolean,
    },

    /**
     * Use this to configure Content-Security-Policy to load external resources. [Read more](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).
     * Set to `true` to enable, or you can pass options to fine-tune your CSP options.
     * **Prerequisites**: These CSP settings are only effective when using Nuxt with `mode: 'server'` to serve your SSR application.
     * **Updating settings**: These settings are read by the Nuxt server directly from `nuxt.config.js`. This means changes to these settings take effect when the server is restarted. There is no need to rebuild the application to update CSP settings.
     * @default false
     * 
     * @example
     * ```js
     * export default {
     *   render: {
     *     csp: {
     *       hashAlgorithm: 'sha256',
     *       policies: {
     *         'script-src': [
     *           'https://www.google-analytics.com',
     *           'https://name.example.com'
     *         ],
     *         'report-uri': ['https://report.example.com/report-csp-violations']
     *       },
     *       addMeta: true
     *     }
     *   }
     * }
     * ```
     * 
     * The following example allows Google Analytics, LogRocket.io, and Sentry.io
     * for logging and analytic tracking.
     * 
     * Review [this blog on Sentry.io](https://blog.sentry.io/2018/09/04/how-sentry-captures-csp-violations)
     * To learn what tracking link you should use.
     * 
     * @example
     * ```js
     * // PRIMARY_HOSTS = `loc.example-website.com`
     * export default {
     *   render: {
     *     csp: {
     *       reportOnly: true,
     *       hashAlgorithm: 'sha256',
     *       policies: {
     *         'default-src': ["'self'"],
     *         'img-src': ['https:', '*.google-analytics.com'],
     *         'worker-src': ["'self'", `blob:`, PRIMARY_HOSTS, '*.logrocket.io'],
     *         'style-src': ["'self'", "'unsafe-inline'", PRIMARY_HOSTS],
     *         'script-src': [
     *           "'self'",
     *           "'unsafe-inline'",
     *           PRIMARY_HOSTS,
     *           'sentry.io',
     *           '*.sentry-cdn.com',
     *           '*.google-analytics.com',
     *           '*.logrocket.io'
     *         ],
     *         'connect-src': [PRIMARY_HOSTS, 'sentry.io', '*.google-analytics.com'],
     *         'form-action': ["'self'"],
     *         'frame-ancestors': ["'none'"],
     *         'object-src': ["'none'"],
     *         'base-uri': [PRIMARY_HOSTS],
     *         'report-uri': [
     *           `https://sentry.io/api/<project>/security/?sentry_key=<key>`
     *         ]
     *       }
     *     }
     *   }
     * }
     * ```
    */
    csp: boolean,

    /**
     * Options used for serving distribution files. Only applicable in production.
     * See [serve-static docs](https://www.npmjs.com/package/serve-static) for possible options.
    */
    dist: {
       /** @default false */
       index: boolean,

       /** @default "1y" */
       maxAge: string,
    },

    /**
     * Configure fallback behavior for [`serve-placeholder` middleware](https://github.com/nuxt/serve-placeholder).
     * Example of allowing `.js` extension for routing (for example, `/repos/nuxt.js`):
     * 
     * @example
     * ```js
     * export default {
     *   render: {
     *     fallback: {
     *       static: {
     *         // Avoid sending 404 for these extensions
     *         handlers: {
     *           '.js': false
     *         }
     *       }
     *     }
     *   }
     * }
     * ```
    */
    fallback: {
       /** For routes matching the publicPath (`/_nuxt/*`) Disable by setting to false. */
       dist: any,

       /** For all other routes (`/*`) Disable by setting to false. */
       static: {
           /** @default true */
           skipUnknown: boolean,

           handlers: {
                /** @default false */
                ".htm": boolean,

                /** @default false */
                ".html": boolean,
           },
       },
    },
  },

  router: {
    /**
     * Additional options passed to vue-router
     * Note: Only JSON serializable options should be passed by nuxt config.
     * For more control, you can use `app/router.optionts.ts` file.
     * 
     * @see [documentation](https://router.vuejs.org/api/#routeroptions)
     * 
     * @version 3
    */
    options: RouterConfigSerializable,

    /**
     * Configure the router mode.
     * For server-side rendering it is not recommended to change it./
     * @default "history"
     * 
     * @version 2
    */
    mode: string,

    /**
     * The base URL of the app. For example, if the entire single page application is served under /app/, then base should use the value '/app/'.
     * This can be useful if you need to serve Nuxt as a different context root, from within a bigger web site.
     * @default "/"
     * 
     * @version 2
    */
    base: string,

    /**
     * @default true
     * 
     * @private
    */
    _routerBaseSpecified: boolean,

    /**
     * 
     * @version 2
    */
    routes: Array<any>,

    /**
     * This allows changing the separator between route names that Nuxt uses.
     * Imagine we have the page file `pages/posts/_id.vue`. Nuxt will generate the route name programmatically, in this case `posts-id`. If you change the routeNameSplitter config to `/` the name will change to `posts/id`.
     * @default "-"
     * 
     * @version 2
    */
    routeNameSplitter: string,

    /**
     * Set the default(s) middleware for every page of the application.
     * 
     * @version 2
    */
    middleware: Array<any>,

    /**
     * Globally configure `<nuxt-link>` default active class.
     * @default "nuxt-link-active"
     * 
     * @version 2
    */
    linkActiveClass: string,

    /**
     * Globally configure `<nuxt-link>` default exact active class.
     * @default "nuxt-link-exact-active"
     * 
     * @version 2
    */
    linkExactActiveClass: string,

    /**
     * Globally configure `<nuxt-link>` default prefetch class (feature disabled by default)
     * @default false
     * 
     * @version 2
    */
    linkPrefetchedClass: boolean,

    /**
     * You can pass a function to extend the routes created by Nuxt.
     * 
     * @example
     * ```js
     * import { fileURLToPath } from 'url'
     * export default {
     *   router: {
     *     extendRoutes(routes, resolve) {
     *       routes.push({
     *         name: 'custom',
     *         path: '*',
     *         component: fileURLToPath(new URL('./pages/404.vue', import.meta.url))
     *       })
     *     }
     *   }
     * }
     * ```
     * 
     * @version 2
    */
    extendRoutes: any,

    /**
     * The `scrollBehavior` option lets you define a custom behavior for the scroll position between the routes. This method is called every time a page is rendered. To learn more about it.
     * 
     * @deprecated router.scrollBehavior` property is deprecated in favor of using `~/app/router.scrollBehavior.js` file, learn more: https://nuxtjs.org/api/configuration-router#scrollbehavior
     * 
     * @see [vue-router `scrollBehavior` documentation](https://router.vuejs.org/guide/advanced/scroll-behavior.html)
     * 
     * @version 2
    */
    scrollBehavior: any,

    /**
     * Provide custom query string parse function. Overrides the default.
     * @default false
     * 
     * @version 2
    */
    parseQuery: boolean,

    /**
     * Provide custom query string stringify function. Overrides the default.
     * @default false
     * 
     * @version 2
    */
    stringifyQuery: boolean,

    /**
     * Controls whether the router should fall back to hash mode when the browser does not support history.pushState but mode is set to history.
     * Setting this to false essentially makes every router-link navigation a full page refresh in IE9. This is useful when the app is server-rendered and needs to work in IE9, because a hash mode URL does not work with SSR.
     * @default false
     * 
     * @version 2
    */
    fallback: boolean,

    /**
     * Configure `<nuxt-link>` to prefetch the code-splitted page when detected within the viewport. Requires [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to be supported (see [Caniuse](https://caniuse.com/intersectionobserver)).
     * @default true
     * 
     * @version 2
    */
    prefetchLinks: boolean,

    /**
     * When using nuxt generate with target: 'static', Nuxt will generate a payload.js for each page.
     * With this option enabled, Nuxt will automatically prefetch the payload of the linked page when the `<nuxt-link>` is visible in the viewport, making instant navigation.
     * @default true
     * 
     * @version 2
    */
    prefetchPayloads: boolean,

    /**
     * If this option is set to true, trailing slashes will be appended to every route. If set to false, they'll be removed.
     * 
     * @warning This option should not be set without preparation and has to
     * be tested thoroughly. When setting `trailingSlash` to something else than
     * undefined, the opposite route will stop working. Thus 301 redirects should
     * be in place and your internal linking has to be adapted correctly. If you set
     * `trailingSlash` to true, then only example.com/abc/ will work but not
     * example.com/abc. On false, it's vice-versa
     * 
     * @version 2
    */
    trailingSlash: any,
  },

  server: {
    /**
     * Whether to enable HTTPS.
     * @default false
     * 
     * @example
     * ```
     * import { fileURLToPath } from 'node:url'
     * export default {
     *   server: {
     *     https: {
     *       key: fs.readFileSync(fileURLToPath(new URL('./server.key', import.meta.url))),
     *       cert: fs.readFileSync(fileURLToPath(new URL('./server.crt', import.meta.url)))
     *     }
     *   }
     * }
     * ```
     * 
     * @version 2
     * 
     * @deprecated  This option is ignored with Bridge and Nuxt 3
    */
    https: boolean,

    /**
     * @default 3000
     * 
     * @deprecated  This option is ignored with Bridge and Nuxt 3
    */
    port: number,

    /**
     * @default "localhost"
     * 
     * @deprecated  This option is ignored with Bridge and Nuxt 3
    */
    host: string,

    /**
     * 
     * @deprecated  This option is ignored with Bridge and Nuxt 3
    */
    socket: any,

    /**
     * Enabling timing adds a middleware to measure the time elapsed during server-side rendering and adds it to the headers as 'Server-Timing'.
     * Apart from true/false, this can be an object for providing options. Currently, only `total` is supported (which directly tracks the whole time spent on server-side rendering.
     * 
     * @deprecated This option is ignored with Bridge and Nuxt 3
    */
    timing: () => any,
  },

  cli: {
    /**
     * Add a message to the CLI banner by adding a string to this array.
     * 
     * @version 2
    */
    badgeMessages: string[],

    /**
     * Change the color of the 'Nuxt.js' title in the CLI banner.
     * @default "green"
     * 
     * @version 2
    */
    bannerColor: string,
  },

  generate: {
    /**
     * Directory name that holds all the assets and generated pages for a `static` build.
     * @default "/<rootDir>/dist"
    */
    dir: string,

    /**
     * The routes to generate.
     * If you are using the crawler, this will be only the starting point for route generation. This is often necessary when using dynamic routes.
     * It can be an array or a function.
     * 
     * @example
     * ```js
     * routes: ['/users/1', '/users/2', '/users/3']
     * ```
     * 
     * You can pass a function that returns a promise or a function that takes a callback. It should
     * return an array of strings or objects with `route` and (optional) `payload` keys.
     * 
     * @example
     * ```js
     * export default {
     *   generate: {
     *     async routes() {
     *       const res = await axios.get('https://my-api/users')
     *       return res.data.map(user => ({ route: '/users/' + user.id, payload: user }))
     *     }
     *   }
     * }
     * ```
     * Or instead:
     * ```js
     * export default {
     *   generate: {
     *     routes(callback) {
     *       axios
     *         .get('https://my-api/users')
     *         .then(res => {
     *           const routes = res.data.map(user => '/users/' + user.id)
     *           callback(null, routes)
     *         })
     *         .catch(callback)
     *     }
     *   }
     * }
     * ```
     * 
     * If `routes()` returns a payload, it can be accessed from the Nuxt context.
     * 
     * @example
     * ```js
     * export default {
     *   async useAsyncData ({ params, error, payload }) {
     *     if (payload) return { user: payload }
     *     else return { user: await backend.fetchUser(params.id) }
     *   }
     * }
     * ```
    */
    routes: Array<any>,

    /** An array of string or regular expressions that will prevent generation of routes matching them. The routes will still be accessible when `fallback` is set. */
    exclude: Array<any>,

    /**
     * The number of routes that are generated concurrently in the same thread.
     * @default 500
    */
    concurrency: number,

    /**
     * Interval in milliseconds between two render cycles to avoid flooding a potential API with calls.
     * @default 0
    */
    interval: number,

    /**
     * Set to `false` to disable creating a directory + `index.html` for each route.
     * @default true
     * 
     * @example
     * ```bash
     * # subFolders: true
     * -| dist/
     * ---| index.html
     * ---| about/
     * -----| index.html
     * ---| products/
     * -----| item/
     * -------| index.html
     * 
     * # subFolders: false
     * -| dist/
     * ---| index.html
     * ---| about.html
     * ---| products/
     * -----| item.html
     * ```
    */
    subFolders: boolean,

    /**
     * The path to the fallback HTML file.
     * Set this as the error page in your static server configuration, so that unknown routes can be rendered (on the client-side) by Nuxt.
     * * If unset or set to a falsy value, the name of the fallback HTML file will be `200.html`. * If set to true, the filename will be `404.html`. * If you provide a string as a value, it will be used instead.
     * @default "200.html"
     * 
     * @note Multiple services (e.g. Netlify) detect a `404.html` automatically. If
     * you configure your web server on your own, please consult its documentation
     * to find out how to set up an error page (and set it to the 404.html file)
    */
    fallback: string,

    /**
     * Set to `false` to disable generating pages discovered through crawling relative links in generated pages.
     * @default true
    */
    crawler: boolean,

    /**
     * Set to `false` to disable generating a `manifest.js` with a list of all generated pages.
     * @default true
    */
    manifest: boolean,

    /**
     * Set to `false` to disable generating a `.nojekyll` file (which aids compatibility with GitHub Pages).
     * @default true
    */
    nojekyll: boolean,

    /**
     * Configure the cache (used with `static` target to avoid rebuilding when no files have changed).
     * Set to `false` to disable completely.
    */
    cache: {
       /** An array of files or directories to ignore. (It can also be a function that returns an array.) */
       ignore: Array<any>,

       /** Options to pass to [`globby`](https://github.com/sindresorhus/globby), which is used to generate a 'snapshot' of the source files. */
       globbyOptions: {
           /** @default true */
           gitignore: boolean,
       },
    },

    staticAssets: {
       /**
        * The directory underneath `/_nuxt/`, where static assets (payload, state and manifest files) will live.
        * @default "static"
       */
       dir: string,

       /**
        * The full path to the directory underneath `/_nuxt/` where static assets (payload, state and manifest files) will live.
        * @default "/_nuxt/<rootDir>/dist"
       */
       base: string,

       /**
        * The full path to the versioned directory where static assets for the current buidl are located.
        * @default ""
       */
       versionBase: string,

       /**
        * A unique string to uniquely identify payload versions (defaults to the current timestamp).
        * @default "1658844110"
       */
       version: string,
    },
  },
}

declare type DeepPartial<T> = T extends Record<string, any> ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
/** User configuration in `nuxt.config` file */
interface NuxtConfig extends DeepPartial<Omit<ConfigSchema, 'vite'>> {
    vite?: ConfigSchema['vite'];
    [key: string]: any;
}
/** Normalized Nuxt options available as `nuxt.options.*` */
interface NuxtOptions extends ConfigSchema {
    _layers: ResolvedConfig<NuxtConfig>[];
}
declare type RuntimeConfigNamespace = Record<string, any>;
interface PublicRuntimeConfig extends RuntimeConfigNamespace {
}
/** @deprecated use RuntimeConfig interface */
interface PrivateRuntimeConfig extends RuntimeConfigNamespace {
}
interface RuntimeConfig extends PrivateRuntimeConfig, RuntimeConfigNamespace {
    public: PublicRuntimeConfig;
}

declare const _default: {
    messages: {
        loading: string;
        error_404: string;
        server_error: string;
        nuxtjs: string;
        back_to_home: string;
        server_error_details: string;
        client_error: string;
        client_error_details: string;
    };
    render: {
        bundleRenderer: {
            shouldPrefetch: () => boolean;
            shouldPreload: (_fileWithoutQuery: any, asType: any) => boolean;
            runInNewContext: {
                $resolve: (val: any, get: any) => any;
            };
        };
        crossorigin: any;
        resourceHints: boolean;
        ssr: any;
        ssrLog: {
            $resolve: (val: any, get: any) => boolean;
        };
        http2: {
            push: boolean;
            shouldPush: any;
            pushAssets: any;
        };
        static: {
            prefix: boolean;
        };
        compressor: {
            threshold: number;
        };
        etag: {
            hash: boolean;
            weak: boolean;
        };
        csp: {
            $resolve: (val: any, get: any) => any;
        };
        dist: {
            index: boolean;
            maxAge: string;
        };
        fallback: {
            dist: {};
            static: {
                skipUnknown: boolean;
                handlers: {
                    '.htm': boolean;
                    '.html': boolean;
                };
            };
        };
    };
    router: {
        options: {};
        mode: string;
        base: {
            $resolve: (val: any, get: any) => any;
        };
        _routerBaseSpecified: {
            $resolve: (_val: any, get: any) => boolean;
        };
        routes: any[];
        routeNameSplitter: string;
        middleware: {
            $resolve: (val: any) => any[];
        };
        linkActiveClass: string;
        linkExactActiveClass: string;
        linkPrefetchedClass: boolean;
        extendRoutes: any;
        scrollBehavior: {
            $schema: {
                deprecated: string;
            };
        };
        parseQuery: boolean;
        stringifyQuery: boolean;
        fallback: boolean;
        prefetchLinks: boolean;
        prefetchPayloads: boolean;
        trailingSlash: any;
    };
    server: {
        https: boolean;
        port: string | number;
        host: string;
        socket: string;
        timing: (val: any) => any;
    };
    cli: {
        badgeMessages: any[];
        bannerColor: string;
    };
    generate: {
        dir: {
            $resolve: (val: string, get: any) => string;
        };
        routes: any[];
        exclude: any[];
        concurrency: number;
        interval: number;
        subFolders: boolean;
        fallback: {
            $resolve: (val: any) => any;
        };
        crawler: boolean;
        manifest: boolean;
        nojekyll: boolean;
        cache: {
            ignore: any[];
            globbyOptions: {
                gitignore: boolean;
            };
        };
        staticAssets: {
            dir: string;
            base: {
                $resolve: (val: any, get: any) => any;
            };
            versionBase: {
                $resolve: (val: any, get: any) => any;
            };
            version: {
                $resolve: (val: any) => any;
            };
        };
    };
    builder: {
        $resolve: (val: any, get: any) => any;
    };
    sourcemap: boolean;
    build: {
        quiet: boolean;
        analyze: {
            $resolve: (val: any, get: any) => any;
        };
        profile: boolean;
        extractCSS: boolean;
        cssSourceMap: {
            $resolve: (val: any, get: any) => any;
        };
        ssr: any;
        parallel: {
            $resolve: (val: any, get: any) => boolean;
        };
        cache: boolean;
        standalone: boolean;
        publicPath: {
            $resolve: (val: any, get: any) => any;
        };
        serverURLPolyfill: string;
        filenames: {
            app: ({ isDev, isModern }: {
                isDev: any;
                isModern: any;
            }) => string;
            chunk: ({ isDev, isModern }: {
                isDev: any;
                isModern: any;
            }) => string;
            css: ({ isDev }: {
                isDev: any;
            }) => "[name].css" | "css/[contenthash:7].css";
            img: ({ isDev }: {
                isDev: any;
            }) => "[path][name].[ext]" | "img/[name].[contenthash:7].[ext]";
            font: ({ isDev }: {
                isDev: any;
            }) => "[path][name].[ext]" | "fonts/[name].[contenthash:7].[ext]";
            video: ({ isDev }: {
                isDev: any;
            }) => "[path][name].[ext]" | "videos/[name].[contenthash:7].[ext]";
        };
        loaders: {
            $resolve: (val: any, get: any) => any;
            file: {
                esModule: boolean;
            };
            fontUrl: {
                esModule: boolean;
                limit: number;
            };
            imgUrl: {
                esModule: boolean;
                limit: number;
            };
            pugPlain: {};
            vue: {
                productionMode: {
                    $resolve: (val: any, get: any) => any;
                };
                transformAssetUrls: {
                    video: string;
                    source: string;
                    object: string;
                    embed: string;
                };
                compilerOptions: {
                    $resolve: (val: any, get: any) => any;
                };
            };
            css: {
                importLoaders: number;
                esModule: boolean;
            };
            cssModules: {
                importLoaders: number;
                esModule: boolean;
                modules: {
                    localIdentName: string;
                };
            };
            less: {};
            sass: {
                sassOptions: {
                    indentedSyntax: boolean;
                };
            };
            scss: {};
            stylus: {};
            vueStyle: {};
        };
        styleResources: {};
        plugins: any[];
        terser: {};
        hardSource: boolean;
        aggressiveCodeRemoval: boolean;
        optimizeCSS: {
            $resolve: (val: any, get: any) => any;
        };
        optimization: {
            runtimeChunk: string;
            minimize: {
                $resolve: (val: any, get: any) => any;
            };
            minimizer: any;
            splitChunks: {
                chunks: string;
                automaticNameDelimiter: string;
                cacheGroups: {};
            };
        };
        splitChunks: {
            layouts: boolean;
            pages: boolean;
            commons: boolean;
        };
        corejs: string;
        babel: {
            configFile: boolean;
            babelrc: boolean;
            plugins: any[];
            presets: {};
            cacheDirectory: {
                $resolve: (val: any, get: any) => any;
            };
        };
        transpile: {
            $resolve: (val: any) => any[];
        };
        postcss: {
            execute: any;
            postcssOptions: {
                $resolve: (val: any, get: any) => any;
            };
            sourcemap: any;
            implementation: any;
            order: string;
        };
        html: {
            minify: {
                collapseBooleanAttributes: boolean;
                decodeEntities: boolean;
                minifyCSS: boolean;
                minifyJS: boolean;
                processConditionalComments: boolean;
                removeEmptyAttributes: boolean;
                removeRedundantAttributes: boolean;
                trimCustomFragments: boolean;
                useShortDoctype: boolean;
            };
        };
        template: any;
        templates: any[];
        watch: any[];
        devMiddleware: {
            stats: string;
        };
        hotMiddleware: {};
        vendor: {
            $meta: {
                deprecated: string;
            };
        };
        stats: {
            $resolve: (val: any, get: any) => any;
            excludeAssets: RegExp[];
        };
        friendlyErrors: boolean;
        additionalExtensions: any[];
        warningIgnoreFilters: any[];
        followSymlinks: boolean;
    };
    experimental: {
        asyncEntry: {
            $resolve: (val: any, get: any) => any;
        };
        viteNode: boolean;
        reactivityTransform: boolean;
        externalVue: boolean;
        treeshakeClientOnly: boolean;
    };
    nitro: {};
    serverHandlers: any[];
    devServerHandlers: any[];
    webpack: {
        analyze: {
            $resolve: (val: any, get: any) => any;
        };
        profile: boolean;
        extractCSS: boolean;
        cssSourceMap: {
            $resolve: (val: any, get: any) => any;
        };
        serverURLPolyfill: string;
        filenames: {
            app: ({ isDev }: {
                isDev: any;
            }) => "[name].js" | "[contenthash:7].js";
            chunk: ({ isDev }: {
                isDev: any;
            }) => "[name].js" | "[contenthash:7].js";
            css: ({ isDev }: {
                isDev: any;
            }) => "[name].css" | "css/[contenthash:7].css";
            img: ({ isDev }: {
                isDev: any;
            }) => "[path][name].[ext]" | "img/[name].[contenthash:7].[ext]";
            font: ({ isDev }: {
                isDev: any;
            }) => "[path][name].[ext]" | "fonts/[name].[contenthash:7].[ext]";
            video: ({ isDev }: {
                isDev: any;
            }) => "[path][name].[ext]" | "videos/[name].[contenthash:7].[ext]";
        };
        loaders: {
            $resolve: (val: any, get: any) => any;
            file: {
                esModule: boolean;
            };
            fontUrl: {
                esModule: boolean;
                limit: number;
            };
            imgUrl: {
                esModule: boolean;
                limit: number;
            };
            pugPlain: {};
            vue: {
                productionMode: {
                    $resolve: (val: any, get: any) => any;
                };
                transformAssetUrls: {
                    video: string;
                    source: string;
                    object: string;
                    embed: string;
                };
                compilerOptions: {
                    $resolve: (val: any, get: any) => any;
                };
            };
            css: {
                importLoaders: number;
                url: {
                    filter: (url: string, resourcePath: string) => boolean;
                };
                esModule: boolean;
            };
            cssModules: {
                importLoaders: number;
                url: {
                    filter: (url: string, resourcePath: string) => boolean;
                };
                esModule: boolean;
                modules: {
                    localIdentName: string;
                };
            };
            less: {};
            sass: {
                sassOptions: {
                    indentedSyntax: boolean;
                };
            };
            scss: {};
            stylus: {};
            vueStyle: {};
        };
        plugins: any[];
        terser: {};
        aggressiveCodeRemoval: boolean;
        optimizeCSS: {
            $resolve: (val: any, get: any) => any;
        };
        optimization: {
            runtimeChunk: string;
            minimize: {
                $resolve: (val: any, get: any) => any;
            };
            minimizer: any;
            splitChunks: {
                chunks: string;
                automaticNameDelimiter: string;
                cacheGroups: {};
            };
        };
        postcss: {
            execute: any;
            postcssOptions: {
                config: {
                    $resolve: (val: any, get: any) => any;
                };
                plugins: {
                    $resolve: (val: any, get: any) => any;
                };
            };
            sourceMap: any;
            implementation: any;
            order: string;
        };
        devMiddleware: {
            stats: string;
        };
        hotMiddleware: {};
        friendlyErrors: boolean;
        warningIgnoreFilters: any[];
    };
    vite: {
        root: {
            $resolve: (val: any, get: any) => any;
        };
        mode: {
            $resolve: (val: any, get: any) => any;
        };
        logLevel: string;
        define: {
            $resolve: (val: any, get: any) => any;
        };
        resolve: {
            extensions: string[];
        };
        publicDir: {
            $resolve: (val: any, get: any) => any;
        };
        vue: {
            isProduction: {
                $resolve: (val: any, get: any) => any;
            };
            template: {
                compilerOptions: {
                    $resolve: (val: any, get: any) => any;
                };
            };
        };
        optimizeDeps: {
            exclude: {
                $resolve: (val: any, get: any) => any[];
            };
        };
        esbuild: {
            jsxFactory: string;
            jsxFragment: string;
            tsconfigRaw: string;
        };
        clearScreen: boolean;
        build: {
            assetsDir: {
                $resolve: (val: any, get: any) => any;
            };
            emptyOutDir: boolean;
        };
        server: {
            fs: {
                strict: boolean;
                allow: {
                    $resolve: (val: any, get: any) => any[];
                };
            };
        };
    };
    typescript: {
        strict: boolean;
        typeCheck: boolean;
        tsConfig: {};
        shim: boolean;
    };
    postcss: {
        config: boolean;
        plugins: {
            'postcss-import': {
                $resolve: (val: any, get: any) => any;
            };
            'postcss-url': {};
            autoprefixer: {};
            cssnano: {
                $resolve: (val: any, get: any) => any;
            };
        };
    };
    _majorVersion: number;
    _legacyGenerate: boolean;
    _start: boolean;
    _build: boolean;
    _generate: boolean;
    _prepare: boolean;
    _cli: boolean;
    _requiredModules: {};
    _nuxtConfigFile: any;
    _nuxtConfigFiles: any[];
    appDir: string;
    extends: any;
    rootDir: {
        $resolve: (val: any) => string;
    };
    srcDir: {
        $resolve: (val: any, get: any) => string;
    };
    buildDir: {
        $resolve: (val: any, get: any) => string;
    };
    dev: boolean;
    test: boolean;
    debug: {
        $resolve: (val: any, get: any) => any;
    };
    env: {
        $default: {};
        $resolve: (val: any) => any;
    };
    createRequire: {
        $resolve: (val: any) => any;
    };
    target: {
        $resolve: (val: any) => any;
    };
    ssr: boolean;
    mode: {
        $resolve: (val: any, get: any) => any;
        $schema: {
            deprecated: string;
        };
    };
    modern: any;
    modules: any[];
    buildModules: any[];
    _modules: any[];
    _installedModules: any[];
    globalName: {
        $resolve: (val: any) => string;
    };
    globals: {
        id: (globalName: any) => string;
        nuxt: (globalName: any) => string;
        context: (globalName: any) => string;
        pluginPrefix: (globalName: any) => any;
        readyCallback: (globalName: any) => string;
        loadedCallback: (globalName: any) => string;
    };
    serverMiddleware: {
        $resolve: (val: any) => any[];
    };
    modulesDir: {
        $default: string[];
        $resolve: (val: any, get: any) => any[];
    };
    dir: {
        assets: string;
        app: string;
        layouts: string;
        middleware: string;
        pages: string;
        public: {
            $resolve: (val: any, get: any) => any;
        };
        static: {
            $schema: {
                deprecated: string;
            };
            $resolve: (val: any, get: any) => any;
        };
        store: string;
    };
    extensions: {
        $resolve: (val: any) => string[];
    };
    styleExtensions: string[];
    alias: {
        $resolve: (val: any, get: any) => any;
    };
    ignoreOptions: any;
    ignorePrefix: string;
    ignore: {
        $resolve: (val: any, get: any) => string[];
    };
    watch: {
        $resolve: (val: any, get: any) => string[];
    };
    watchers: {
        rewatchOnRawEvents: any;
        webpack: {
            aggregateTimeout: number;
        };
        chokidar: {
            ignoreInitial: boolean;
        };
    };
    editor: any;
    hooks: any;
    runtimeConfig: {
        $resolve: (val: RuntimeConfig, get: any) => RuntimeConfig;
    };
    privateRuntimeConfig: {};
    publicRuntimeConfig: {};
    vue: {
        config: {
            silent: {
                $resolve: (val: any, get: any) => any;
            };
            performance: {
                $resolve: (val: any, get: any) => any;
            };
        };
        compilerOptions: {};
    };
    app: {
        baseURL: string;
        buildAssetsDir: string;
        assetsPath: {
            $resolve: (val: any, get: any) => any;
        };
        cdnURL: {
            $resolve: (val: any, get: any) => any;
        };
        head: {
            $resolve: (val: any, get: any) => any;
        };
    };
    appTemplatePath: {
        $resolve: (val: any, get: any) => string;
    };
    store: {
        $resolve: (val: any, get: any) => string;
    };
    vueMeta: any;
    head: {
        meta: any[];
        link: any[];
        style: any[];
        script: any[];
    };
    meta: {
        meta: any[];
        link: any[];
        style: any[];
        script: any[];
    };
    fetch: {
        server: boolean;
        client: boolean;
    };
    plugins: any[];
    extendPlugins: any;
    css: {
        $resolve: (val: any) => any;
    };
    layouts: {};
    ErrorPage: any;
    loading: {
        color: string;
        failedColor: string;
        height: string;
        throttle: number;
        duration: number;
        continuous: boolean;
        rtl: boolean;
        css: boolean;
    };
    loadingIndicator: {
        $resolve: (val: any, get: any) => any;
    };
    pageTransition: {
        $resolve: (val: any, get: any) => any;
    };
    layoutTransition: {
        $resolve: (val: any) => any;
    };
    features: {
        store: boolean;
        layouts: boolean;
        meta: boolean;
        middleware: boolean;
        transitions: boolean;
        deprecations: boolean;
        validate: boolean;
        useAsyncData: boolean;
        fetch: boolean;
        clientOnline: boolean;
        clientPrefetch: boolean;
        componentAliases: boolean;
        componentClientOnly: boolean;
    };
    components: {
        $resolve: (val: any, get: any) => any;
    };
    autoImports: {
        global: boolean;
        dirs: any[];
    };
    pages: any;
    telemetry: any;
};

export { AutoImportsOptions, Component, ComponentsDir, ComponentsOptions, ImportPresetWithDeprecation, MetaObject, ModuleContainer, ModuleDefinition, ModuleMeta, ModuleOptions, Nuxt, NuxtApp, NuxtCompatibility, NuxtCompatibilityIssue, NuxtCompatibilityIssues, NuxtConfig, _default as NuxtConfigSchema, NuxtHookName, NuxtHooks, NuxtLayout, NuxtMiddleware, NuxtModule, NuxtOptions, NuxtPage, NuxtPlugin, NuxtPluginTemplate, NuxtTemplate, PrivateRuntimeConfig, PublicRuntimeConfig, RouterConfig, RouterConfigOptions, RouterConfigSerializable, RouterOptions, RuntimeConfig, ScanDir, TSReference };