import { existsSync, promises } from 'node:fs';
import { dirname, relative } from 'node:path';
import { e as execa } from './index7.mjs';
import { s as setupDotenv } from './index5.mjs';
import { r as resolve } from './index3.mjs';
import { c as consola } from './consola.mjs';
import { d as defineNuxtCommand } from './index.mjs';
import 'node:buffer';
import 'node:child_process';
import 'node:process';
import 'child_process';
import 'path';
import './_commonjsHelpers.mjs';
import 'fs';
import 'node:url';
import 'os';
import 'node:os';
import 'assert';
import 'events';
import 'buffer';
import 'stream';
import 'util';
import './index6.mjs';
import 'crypto';
import 'module';
import 'vm';
import 'url';
import 'tty';
import 'v8';

const preview = defineNuxtCommand({
  meta: {
    name: "preview",
    usage: "npx nuxi preview|start [rootDir]",
    description: "Launches nitro server for local testing after `nuxi build`."
  },
  async invoke(args) {
    process.env.NODE_ENV = process.env.NODE_ENV || "production";
    const rootDir = resolve(args._[0] || ".");
    const nitroJSONPaths = [".output/nitro.json", "nitro.json"].map((p) => resolve(rootDir, p));
    const nitroJSONPath = nitroJSONPaths.find((p) => existsSync(p));
    if (!nitroJSONPath) {
      consola.error("Cannot find `nitro.json`. Did you run `nuxi build` first? Search path:\n", nitroJSONPaths);
      process.exit(1);
    }
    const outputPath = dirname(nitroJSONPath);
    const nitroJSON = JSON.parse(await promises.readFile(nitroJSONPath, "utf-8"));
    consola.info("Node.js version:", process.versions.node);
    consola.info("Preset:", nitroJSON.preset);
    consola.info("Working dir:", relative(process.cwd(), outputPath));
    if (!nitroJSON.commands.preview) {
      consola.error("Preview is not supported for this build.");
      process.exit(1);
    }
    if (existsSync(resolve(rootDir, ".env"))) {
      consola.info("Loading `.env`. This will not be loaded when running the server in production.");
      await setupDotenv({ cwd: rootDir });
    }
    consola.info("Starting preview command:", nitroJSON.commands.preview);
    const [command, ...commandArgs] = nitroJSON.commands.preview.split(" ");
    consola.log("");
    await execa(command, commandArgs, { stdio: "inherit", cwd: outputPath });
  }
});

export { preview as default };