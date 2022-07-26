import { resolve } from 'node:path';
import defu from 'defu';
import { execa } from 'execa';
import { getRandomPort, waitForPort } from 'get-port-please';
import { fetch as fetch$1, $fetch as $fetch$1 } from 'ohmyfetch';
import * as _kit from '@nuxt/kit';
import { promises, existsSync } from 'node:fs';

let currentContext;
function createTestContext(options) {
  const _options = defu(options, {
    testDir: resolve(process.cwd(), "test"),
    fixture: "fixture",
    configFile: "nuxt.config",
    setupTimeout: 6e4,
    dev: !!JSON.parse(process.env.NUXT_TEST_DEV || "false"),
    logLevel: 1,
    server: true,
    build: options.browser !== false || options.server !== false,
    nuxtConfig: {},
    runner: "vitest",
    browserOptions: {
      type: "chromium"
    }
  });
  return setTestContext({ options: _options });
}
function useTestContext() {
  if (!currentContext) {
    throw new Error("No context is available. (Forgot calling setup or createContext?)");
  }
  return currentContext;
}
function setTestContext(context) {
  currentContext = context;
  return currentContext;
}
function isDev() {
  const ctx = useTestContext();
  return ctx.options.dev;
}

const kit$1 = _kit.default || _kit;
async function startServer() {
  const ctx = useTestContext();
  await stopServer();
  const port = await getRandomPort();
  ctx.url = "http://127.0.0.1:" + port;
  if (ctx.options.dev) {
    const nuxiCLI = await kit$1.resolvePath("nuxi/cli");
    ctx.serverProcess = execa(nuxiCLI, ["dev"], {
      cwd: ctx.nuxt.options.rootDir,
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: "development"
      }
    });
    await waitForPort(port, { retries: 32 });
    for (let i = 0; i < 50; i++) {
      await new Promise((resolve2) => setTimeout(resolve2, 100));
      try {
        const res = await $fetch("/");
        if (!res.includes("__NUXT_LOADING__")) {
          return;
        }
      } catch {
      }
    }
    throw new Error("Timeout waiting for dev server!");
  } else {
    ctx.serverProcess = execa("node", [
      resolve(ctx.nuxt.options.nitro.output.dir, "server/index.mjs")
    ], {
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: "test"
      }
    });
    await waitForPort(port, { retries: 8 });
  }
}
async function stopServer() {
  const ctx = useTestContext();
  if (ctx.serverProcess) {
    await ctx.serverProcess.kill();
  }
  if (ctx.listener) {
    await ctx.listener.close();
  }
}
function fetch(path, options) {
  return fetch$1(url(path), options);
}
function $fetch(path, options) {
  return $fetch$1(url(path), options);
}
function url(path) {
  const ctx = useTestContext();
  if (!ctx.url) {
    throw new Error("url is not availabe (is server option enabled?)");
  }
  return ctx.url + path;
}

async function createBrowser() {
  const ctx = useTestContext();
  let playwright;
  try {
    playwright = await import(String("playwright"));
  } catch {
    throw new Error(`
      The dependency 'playwright' not found.
      Please run 'yarn add --dev playwright' or 'npm install --save-dev playwright'
    `);
  }
  const { type, launch } = ctx.options.browserOptions;
  if (!playwright[type]) {
    throw new Error(`Invalid browser '${type}'`);
  }
  ctx.browser = await playwright[type].launch(launch);
}
async function getBrowser() {
  const ctx = useTestContext();
  if (!ctx.browser) {
    await createBrowser();
  }
  return ctx.browser;
}
async function createPage(path, options) {
  const browser = await getBrowser();
  const page = await browser.newPage(options);
  if (path) {
    await page.goto(url(path));
  }
  return page;
}

const kit = _kit.default || _kit;
const isNuxtApp = (dir) => {
  return existsSync(dir) && (existsSync(resolve(dir, "pages")) || existsSync(resolve(dir, "nuxt.config.js")) || existsSync(resolve(dir, "nuxt.config.ts")));
};
const resolveRootDir = () => {
  const { options } = useTestContext();
  const dirs = [
    options.rootDir,
    resolve(options.testDir, options.fixture),
    process.cwd()
  ];
  for (const dir of dirs) {
    if (dir && isNuxtApp(dir)) {
      return dir;
    }
  }
  throw new Error("Invalid nuxt app. (Please explicitly set `options.rootDir` pointing to a valid nuxt app)");
};
async function loadFixture() {
  const ctx = useTestContext();
  ctx.options.rootDir = resolveRootDir();
  if (!ctx.options.dev) {
    const randomId = Math.random().toString(36).slice(2, 8);
    const buildDir = resolve(ctx.options.rootDir, ".nuxt", randomId);
    Object.assign(ctx.options.nuxtConfig, {
      buildDir,
      nitro: {
        output: {
          dir: resolve(buildDir, "output")
        }
      }
    });
  }
  ctx.nuxt = await kit.loadNuxt({
    cwd: ctx.options.rootDir,
    dev: ctx.options.dev,
    overrides: ctx.options.nuxtConfig,
    configFile: ctx.options.configFile
  });
  kit.logger.level = ctx.options.logLevel;
  await promises.mkdir(ctx.nuxt.options.buildDir, { recursive: true });
}
async function buildFixture() {
  const ctx = useTestContext();
  await kit.buildNuxt(ctx.nuxt);
}

function setupJest(hooks) {
  test("setup", hooks.setup, 120 * 1e3);
  beforeEach(hooks.beforeEach);
  afterEach(hooks.afterEach);
  afterAll(hooks.afterAll);
}

async function setupVitest(hooks) {
  const vitest = await import('vitest');
  vitest.beforeAll(hooks.setup, 120 * 1e3);
  vitest.beforeEach(hooks.beforeEach);
  vitest.afterEach(hooks.afterEach);
  vitest.afterAll(hooks.afterAll);
}

const setupMaps = {
  jest: setupJest,
  vitest: setupVitest
};
function createTest(options) {
  const ctx = createTestContext(options);
  const beforeEach = () => {
    setTestContext(ctx);
  };
  const afterEach = () => {
    setTestContext(void 0);
  };
  const afterAll = async () => {
    if (ctx.serverProcess) {
      setTestContext(ctx);
      await stopServer();
      setTestContext(void 0);
    }
    if (ctx.nuxt && ctx.nuxt.options.dev) {
      await ctx.nuxt.close();
    }
    if (ctx.browser) {
      await ctx.browser.close();
    }
  };
  const setup2 = async () => {
    if (ctx.options.fixture) {
      await loadFixture();
    }
    if (ctx.options.build) {
      await buildFixture();
    }
    if (ctx.options.server) {
      await startServer();
    }
    if (ctx.options.waitFor) {
      await new Promise((resolve) => setTimeout(resolve, ctx.options.waitFor));
    }
    if (ctx.options.browser) {
      await createBrowser();
    }
  };
  return {
    beforeEach,
    afterEach,
    afterAll,
    setup: setup2,
    ctx
  };
}
async function setup(options) {
  const hooks = createTest(options);
  const setupFn = setupMaps[hooks.ctx.options.runner];
  await setupFn(hooks);
}

const RunTestDefaults = {
  runner: "vitest"
};
async function runTests(opts) {
  opts = { ...RunTestDefaults, ...opts };
  if (opts.runner !== "vitest") {
    throw new Error(`Unsupported runner: ${opts.runner}. Currently only vitest runner is supported.`);
  }
  if (opts.dev) {
    process.env.NUXT_TEST_DEV = "true";
  }
  const { startVitest } = await import('vitest/dist/node.mjs');
  const succeeded = await startVitest(
    [],
    {
      root: opts.rootDir,
      run: !opts.watch
    },
    {
      esbuild: {
        tsconfigRaw: "{}"
      }
    }
  );
  if (!succeeded) {
    process.exit(1);
  }
}

export { $fetch, buildFixture, createBrowser, createPage, createTest, createTestContext, fetch, getBrowser, isDev, loadFixture, runTests, setTestContext, setup, setupMaps, startServer, stopServer, url, useTestContext };
