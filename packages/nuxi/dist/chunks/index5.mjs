import require$$0, { existsSync, promises } from 'fs';
import { r as resolve } from './index3.mjs';
import require$$1 from 'path';
import os$1 from 'os';
import { l as lib } from './index6.mjs';

var main = {exports: {}};

const fs = require$$0;
const path = require$$1;
const os = os$1;

const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;

// Parser src into an Object
function parse (src) {
  const obj = {};

  // Convert buffer to string
  let lines = src.toString();

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n');

  let match;
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1];

    // Default undefined or null to empty string
    let value = (match[2] || '');

    // Remove whitespace
    value = value.trim();

    // Check if double quoted
    const maybeQuote = value[0];

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2');

    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n');
      value = value.replace(/\\r/g, '\r');
    }

    // Add to object
    obj[key] = value;
  }

  return obj
}

function _log (message) {
  console.log(`[dotenv][DEBUG] ${message}`);
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

// Populates process.env from .env file
function config (options) {
  let dotenvPath = path.resolve(process.cwd(), '.env');
  let encoding = 'utf8';
  const debug = Boolean(options && options.debug);
  const override = Boolean(options && options.override);

  if (options) {
    if (options.path != null) {
      dotenvPath = _resolveHome(options.path);
    }
    if (options.encoding != null) {
      encoding = options.encoding;
    }
  }

  try {
    // Specifying an encoding returns a string instead of a buffer
    const parsed = DotenvModule.parse(fs.readFileSync(dotenvPath, { encoding }));

    Object.keys(parsed).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = parsed[key];
      } else {
        if (override === true) {
          process.env[key] = parsed[key];
        }

        if (debug) {
          if (override === true) {
            _log(`"${key}" is already defined in \`process.env\` and WAS overwritten`);
          } else {
            _log(`"${key}" is already defined in \`process.env\` and was NOT overwritten`);
          }
        }
      }
    });

    return { parsed }
  } catch (e) {
    if (debug) {
      _log(`Failed to load ${dotenvPath} ${e.message}`);
    }

    return { error: e }
  }
}

const DotenvModule = {
  config,
  parse
};

main.exports.config = DotenvModule.config;
var parse_1 = main.exports.parse = DotenvModule.parse;
main.exports = DotenvModule;

flatten.flatten = flatten;
flatten.unflatten = unflatten;

function isBuffer (obj) {
  return obj &&
    obj.constructor &&
    (typeof obj.constructor.isBuffer === 'function') &&
    obj.constructor.isBuffer(obj)
}

function keyIdentity (key) {
  return key
}

function flatten (target, opts) {
  opts = opts || {};

  const delimiter = opts.delimiter || '.';
  const maxDepth = opts.maxDepth;
  const transformKey = opts.transformKey || keyIdentity;
  const output = {};

  function step (object, prev, currentDepth) {
    currentDepth = currentDepth || 1;
    Object.keys(object).forEach(function (key) {
      const value = object[key];
      const isarray = opts.safe && Array.isArray(value);
      const type = Object.prototype.toString.call(value);
      const isbuffer = isBuffer(value);
      const isobject = (
        type === '[object Object]' ||
        type === '[object Array]'
      );

      const newKey = prev
        ? prev + delimiter + transformKey(key)
        : transformKey(key);

      if (!isarray && !isbuffer && isobject && Object.keys(value).length &&
        (!opts.maxDepth || currentDepth < maxDepth)) {
        return step(value, newKey, currentDepth + 1)
      }

      output[newKey] = value;
    });
  }

  step(target);

  return output
}

function unflatten (target, opts) {
  opts = opts || {};

  const delimiter = opts.delimiter || '.';
  const overwrite = opts.overwrite || false;
  const transformKey = opts.transformKey || keyIdentity;
  const result = {};

  const isbuffer = isBuffer(target);
  if (isbuffer || Object.prototype.toString.call(target) !== '[object Object]') {
    return target
  }

  // safely ensure that the key is
  // an integer.
  function getkey (key) {
    const parsedKey = Number(key);

    return (
      isNaN(parsedKey) ||
      key.indexOf('.') !== -1 ||
      opts.object
    ) ? key
      : parsedKey
  }

  function addKeys (keyPrefix, recipient, target) {
    return Object.keys(target).reduce(function (result, key) {
      result[keyPrefix + delimiter + key] = target[key];

      return result
    }, recipient)
  }

  function isEmpty (val) {
    const type = Object.prototype.toString.call(val);
    const isArray = type === '[object Array]';
    const isObject = type === '[object Object]';

    if (!val) {
      return true
    } else if (isArray) {
      return !val.length
    } else if (isObject) {
      return !Object.keys(val).length
    }
  }

  target = Object.keys(target).reduce(function (result, key) {
    const type = Object.prototype.toString.call(target[key]);
    const isObject = (type === '[object Object]' || type === '[object Array]');
    if (!isObject || isEmpty(target[key])) {
      result[key] = target[key];
      return result
    } else {
      return addKeys(
        key,
        result,
        flatten(target[key], opts)
      )
    }
  }, {});

  Object.keys(target).forEach(function (key) {
    const split = key.split(delimiter).map(transformKey);
    let key1 = getkey(split.shift());
    let key2 = getkey(split[0]);
    let recipient = result;

    while (key2 !== undefined) {
      if (key1 === '__proto__') {
        return
      }

      const type = Object.prototype.toString.call(recipient[key1]);
      const isobject = (
        type === '[object Object]' ||
        type === '[object Array]'
      );

      // do not write over falsey, non-undefined values if overwrite is false
      if (!overwrite && !isobject && typeof recipient[key1] !== 'undefined') {
        return
      }

      if ((overwrite && !isobject) || (!overwrite && recipient[key1] == null)) {
        recipient[key1] = (
          typeof key2 === 'number' &&
          !opts.object ? [] : {}
        );
      }

      recipient = recipient[key1];
      if (split.length > 0) {
        key1 = getkey(split.shift());
        key2 = getkey(split[0]);
      }
    }

    // unflatten again for 'messy objects'
    recipient[key1] = unflatten(target[key], opts);
  });

  return result
}

({
  name: ".conf",
  dir: process.cwd(),
  flat: false
});

async function setupDotenv(options) {
  const targetEnv = options.env ?? process.env;
  const env = await loadDotenv({
    cwd: options.cwd,
    fileName: options.fileName ?? ".env",
    env: targetEnv,
    interpolate: options.interpolate ?? true
  });
  for (const key in env) {
    if (!key.startsWith("_") && targetEnv[key] === void 0) {
      targetEnv[key] = env[key];
    }
  }
  return env;
}
async function loadDotenv(opts) {
  const env = /* @__PURE__ */ Object.create(null);
  const dotenvFile = resolve(opts.cwd, opts.fileName);
  if (existsSync(dotenvFile)) {
    const parsed = parse_1(await promises.readFile(dotenvFile, "utf-8"));
    Object.assign(env, parsed);
  }
  if (!opts.env._applied) {
    Object.assign(env, opts.env);
    env._applied = true;
  }
  if (opts.interpolate) {
    interpolate(env);
  }
  return env;
}
function interpolate(target, source = {}, parse = (v) => v) {
  function getValue(key) {
    return source[key] !== void 0 ? source[key] : target[key];
  }
  function interpolate2(value, parents = []) {
    if (typeof value !== "string") {
      return value;
    }
    const matches = value.match(/(.?\${?(?:[a-zA-Z0-9_:]+)?}?)/g) || [];
    return parse(matches.reduce((newValue, match) => {
      const parts = /(.?)\${?([a-zA-Z0-9_:]+)?}?/g.exec(match);
      const prefix = parts[1];
      let value2, replacePart;
      if (prefix === "\\") {
        replacePart = parts[0];
        value2 = replacePart.replace("\\$", "$");
      } else {
        const key = parts[2];
        replacePart = parts[0].substring(prefix.length);
        if (parents.includes(key)) {
          console.warn(`Please avoid recursive environment variables ( loop: ${parents.join(" > ")} > ${key} )`);
          return "";
        }
        value2 = getValue(key);
        value2 = interpolate2(value2, [...parents, key]);
      }
      return value2 !== void 0 ? newValue.replace(replacePart, value2) : newValue;
    }, value));
  }
  for (const key in target) {
    target[key] = interpolate2(getValue(key));
  }
}
lib(null, { cache: false, interopDefault: true, requireCache: false });

export { setupDotenv as s };