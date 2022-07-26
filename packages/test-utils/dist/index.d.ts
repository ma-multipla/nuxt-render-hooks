import * as playwright_core from 'playwright-core';
import { Browser, BrowserContextOptions, LaunchOptions } from 'playwright';
import { NuxtConfig, Nuxt } from '@nuxt/schema';
import { ExecaChildProcess } from 'execa';
import { Listener } from 'listhen';
import { FetchOptions } from 'ohmyfetch';

declare function createBrowser(): Promise<void>;
declare function getBrowser(): Promise<Browser>;
declare function createPage(path?: string, options?: BrowserContextOptions): Promise<playwright_core.Page>;

declare type TestRunner = 'vitest' | 'jest';
interface TestOptions {
    testDir: string;
    fixture: string;
    configFile: string;
    rootDir: string;
    buildDir: string;
    nuxtConfig: NuxtConfig;
    build: boolean;
    dev: boolean;
    setupTimeout: number;
    waitFor: number;
    browser: boolean;
    runner: TestRunner;
    logLevel: number;
    browserOptions: {
        type: 'chromium' | 'firefox' | 'webkit';
        launch?: LaunchOptions;
    };
    server: boolean;
}
interface TestContext {
    options: TestOptions;
    nuxt?: Nuxt;
    browser?: Browser;
    url?: string;
    serverProcess?: ExecaChildProcess;
    listener?: Listener;
}
interface TestHooks {
    beforeEach: () => void;
    afterEach: () => void;
    afterAll: () => void;
    setup: () => void;
    ctx: TestContext;
}

declare function createTestContext(options: Partial<TestOptions>): TestContext;
declare function useTestContext(): TestContext;
declare function setTestContext(context: TestContext): TestContext;
declare function isDev(): boolean;

declare function loadFixture(): Promise<void>;
declare function buildFixture(): Promise<void>;

declare function startServer(): Promise<void>;
declare function stopServer(): Promise<void>;
declare function fetch(path: string, options?: any): Promise<Response>;
declare function $fetch(path: string, options?: FetchOptions): Promise<any>;
declare function url(path: string): string;

declare function setupJest(hooks: TestHooks): void;

declare function setupVitest(hooks: TestHooks): Promise<void>;

declare const setupMaps: {
    jest: typeof setupJest;
    vitest: typeof setupVitest;
};
declare function createTest(options: Partial<TestOptions>): TestHooks;
declare function setup(options: Partial<TestOptions>): Promise<void>;

interface RunTestOptions {
    rootDir: string;
    dev?: boolean;
    watch?: boolean;
    runner?: 'vitest';
}
declare function runTests(opts: RunTestOptions): Promise<void>;

export { $fetch, RunTestOptions, buildFixture, createBrowser, createPage, createTest, createTestContext, fetch, getBrowser, isDev, loadFixture, runTests, setTestContext, setup, setupMaps, startServer, stopServer, url, useTestContext };
