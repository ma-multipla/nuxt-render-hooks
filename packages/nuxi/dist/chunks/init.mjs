import { existsSync, readdirSync as readdirSync$1 } from 'node:fs';
import require$$0$3 from 'fs';
import require$$1$2 from 'path';
import { c as commonjsGlobal } from './_commonjsHelpers.mjs';
import require$$0 from 'events';
import require$$1 from 'stream';
import require$$2 from 'string_decoder';
import require$$0$2 from 'assert';
import require$$1$1 from 'buffer';
import require$$0$1 from 'zlib';
import { y as yallist } from './yallist.mjs';
import require$$2$1 from 'util';
import require$$8 from 'crypto';
import { a as commonjsRequire, c as consola } from './consola.mjs';
import os$1 from 'os';
import require$$1$4 from 'https';
import require$$0$6 from 'child_process';
import require$$7 from 'url';
import require$$0$4 from 'net';
import require$$1$3 from 'tls';
import tty__default from 'tty';
import require$$0$5 from 'constants';
import { r as resolve$1, a as relative } from './index3.mjs';
import { d as defineNuxtCommand } from './index.mjs';

var tar$1 = {};

// turn tar(1) style args like `C` into the more verbose things like `cwd`

const argmap = new Map([
  ['C', 'cwd'],
  ['f', 'file'],
  ['z', 'gzip'],
  ['P', 'preservePaths'],
  ['U', 'unlink'],
  ['strip-components', 'strip'],
  ['stripComponents', 'strip'],
  ['keep-newer', 'newer'],
  ['keepNewer', 'newer'],
  ['keep-newer-files', 'newer'],
  ['keepNewerFiles', 'newer'],
  ['k', 'keep'],
  ['keep-existing', 'keep'],
  ['keepExisting', 'keep'],
  ['m', 'noMtime'],
  ['no-mtime', 'noMtime'],
  ['p', 'preserveOwner'],
  ['L', 'follow'],
  ['h', 'follow'],
]);

var highLevelOpt = opt => opt ? Object.keys(opt).map(k => [
  argmap.has(k) ? argmap.get(k) : k, opt[k],
]).reduce((set, kv) => (set[kv[0]] = kv[1], set), Object.create(null)) : {};

const proc = typeof process === 'object' && process ? process : {
  stdout: null,
  stderr: null,
};
const EE$2 = require$$0;
const Stream$1 = require$$1;
const SD = require$$2.StringDecoder;

const EOF$1 = Symbol('EOF');
const MAYBE_EMIT_END = Symbol('maybeEmitEnd');
const EMITTED_END = Symbol('emittedEnd');
const EMITTING_END = Symbol('emittingEnd');
const EMITTED_ERROR = Symbol('emittedError');
const CLOSED = Symbol('closed');
const READ$1 = Symbol('read');
const FLUSH = Symbol('flush');
const FLUSHCHUNK = Symbol('flushChunk');
const ENCODING = Symbol('encoding');
const DECODER = Symbol('decoder');
const FLOWING = Symbol('flowing');
const PAUSED = Symbol('paused');
const RESUME = Symbol('resume');
const BUFFERLENGTH = Symbol('bufferLength');
const BUFFERPUSH = Symbol('bufferPush');
const BUFFERSHIFT = Symbol('bufferShift');
const OBJECTMODE = Symbol('objectMode');
const DESTROYED = Symbol('destroyed');
const EMITDATA = Symbol('emitData');
const EMITEND = Symbol('emitEnd');
const EMITEND2 = Symbol('emitEnd2');
const ASYNC = Symbol('async');

const defer = fn => Promise.resolve().then(fn);

// TODO remove when Node v8 support drops
const doIter = commonjsGlobal._MP_NO_ITERATOR_SYMBOLS_  !== '1';
const ASYNCITERATOR = doIter && Symbol.asyncIterator
  || Symbol('asyncIterator not implemented');
const ITERATOR = doIter && Symbol.iterator
  || Symbol('iterator not implemented');

// events that mean 'the stream is over'
// these are treated specially, and re-emitted
// if they are listened for after emitting.
const isEndish = ev =>
  ev === 'end' ||
  ev === 'finish' ||
  ev === 'prefinish';

const isArrayBuffer = b => b instanceof ArrayBuffer ||
  typeof b === 'object' &&
  b.constructor &&
  b.constructor.name === 'ArrayBuffer' &&
  b.byteLength >= 0;

const isArrayBufferView = b => !Buffer.isBuffer(b) && ArrayBuffer.isView(b);

class Pipe {
  constructor (src, dest, opts) {
    this.src = src;
    this.dest = dest;
    this.opts = opts;
    this.ondrain = () => src[RESUME]();
    dest.on('drain', this.ondrain);
  }
  unpipe () {
    this.dest.removeListener('drain', this.ondrain);
  }
  // istanbul ignore next - only here for the prototype
  proxyErrors () {}
  end () {
    this.unpipe();
    if (this.opts.end)
      this.dest.end();
  }
}

class PipeProxyErrors extends Pipe {
  unpipe () {
    this.src.removeListener('error', this.proxyErrors);
    super.unpipe();
  }
  constructor (src, dest, opts) {
    super(src, dest, opts);
    this.proxyErrors = er => dest.emit('error', er);
    src.on('error', this.proxyErrors);
  }
}

var minipass = class Minipass extends Stream$1 {
  constructor (options) {
    super();
    this[FLOWING] = false;
    // whether we're explicitly paused
    this[PAUSED] = false;
    this.pipes = [];
    this.buffer = [];
    this[OBJECTMODE] = options && options.objectMode || false;
    if (this[OBJECTMODE])
      this[ENCODING] = null;
    else
      this[ENCODING] = options && options.encoding || null;
    if (this[ENCODING] === 'buffer')
      this[ENCODING] = null;
    this[ASYNC] = options && !!options.async || false;
    this[DECODER] = this[ENCODING] ? new SD(this[ENCODING]) : null;
    this[EOF$1] = false;
    this[EMITTED_END] = false;
    this[EMITTING_END] = false;
    this[CLOSED] = false;
    this[EMITTED_ERROR] = null;
    this.writable = true;
    this.readable = true;
    this[BUFFERLENGTH] = 0;
    this[DESTROYED] = false;
  }

  get bufferLength () { return this[BUFFERLENGTH] }

  get encoding () { return this[ENCODING] }
  set encoding (enc) {
    if (this[OBJECTMODE])
      throw new Error('cannot set encoding in objectMode')

    if (this[ENCODING] && enc !== this[ENCODING] &&
        (this[DECODER] && this[DECODER].lastNeed || this[BUFFERLENGTH]))
      throw new Error('cannot change encoding')

    if (this[ENCODING] !== enc) {
      this[DECODER] = enc ? new SD(enc) : null;
      if (this.buffer.length)
        this.buffer = this.buffer.map(chunk => this[DECODER].write(chunk));
    }

    this[ENCODING] = enc;
  }

  setEncoding (enc) {
    this.encoding = enc;
  }

  get objectMode () { return this[OBJECTMODE] }
  set objectMode (om) { this[OBJECTMODE] = this[OBJECTMODE] || !!om; }

  get ['async'] () { return this[ASYNC] }
  set ['async'] (a) { this[ASYNC] = this[ASYNC] || !!a; }

  write (chunk, encoding, cb) {
    if (this[EOF$1])
      throw new Error('write after end')

    if (this[DESTROYED]) {
      this.emit('error', Object.assign(
        new Error('Cannot call write after a stream was destroyed'),
        { code: 'ERR_STREAM_DESTROYED' }
      ));
      return true
    }

    if (typeof encoding === 'function')
      cb = encoding, encoding = 'utf8';

    if (!encoding)
      encoding = 'utf8';

    const fn = this[ASYNC] ? defer : f => f();

    // convert array buffers and typed array views into buffers
    // at some point in the future, we may want to do the opposite!
    // leave strings and buffers as-is
    // anything else switches us into object mode
    if (!this[OBJECTMODE] && !Buffer.isBuffer(chunk)) {
      if (isArrayBufferView(chunk))
        chunk = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      else if (isArrayBuffer(chunk))
        chunk = Buffer.from(chunk);
      else if (typeof chunk !== 'string')
        // use the setter so we throw if we have encoding set
        this.objectMode = true;
    }

    // handle object mode up front, since it's simpler
    // this yields better performance, fewer checks later.
    if (this[OBJECTMODE]) {
      /* istanbul ignore if - maybe impossible? */
      if (this.flowing && this[BUFFERLENGTH] !== 0)
        this[FLUSH](true);

      if (this.flowing)
        this.emit('data', chunk);
      else
        this[BUFFERPUSH](chunk);

      if (this[BUFFERLENGTH] !== 0)
        this.emit('readable');

      if (cb)
        fn(cb);

      return this.flowing
    }

    // at this point the chunk is a buffer or string
    // don't buffer it up or send it to the decoder
    if (!chunk.length) {
      if (this[BUFFERLENGTH] !== 0)
        this.emit('readable');
      if (cb)
        fn(cb);
      return this.flowing
    }

    // fast-path writing strings of same encoding to a stream with
    // an empty buffer, skipping the buffer/decoder dance
    if (typeof chunk === 'string' &&
        // unless it is a string already ready for us to use
        !(encoding === this[ENCODING] && !this[DECODER].lastNeed)) {
      chunk = Buffer.from(chunk, encoding);
    }

    if (Buffer.isBuffer(chunk) && this[ENCODING])
      chunk = this[DECODER].write(chunk);

    // Note: flushing CAN potentially switch us into not-flowing mode
    if (this.flowing && this[BUFFERLENGTH] !== 0)
      this[FLUSH](true);

    if (this.flowing)
      this.emit('data', chunk);
    else
      this[BUFFERPUSH](chunk);

    if (this[BUFFERLENGTH] !== 0)
      this.emit('readable');

    if (cb)
      fn(cb);

    return this.flowing
  }

  read (n) {
    if (this[DESTROYED])
      return null

    if (this[BUFFERLENGTH] === 0 || n === 0 || n > this[BUFFERLENGTH]) {
      this[MAYBE_EMIT_END]();
      return null
    }

    if (this[OBJECTMODE])
      n = null;

    if (this.buffer.length > 1 && !this[OBJECTMODE]) {
      if (this.encoding)
        this.buffer = [this.buffer.join('')];
      else
        this.buffer = [Buffer.concat(this.buffer, this[BUFFERLENGTH])];
    }

    const ret = this[READ$1](n || null, this.buffer[0]);
    this[MAYBE_EMIT_END]();
    return ret
  }

  [READ$1] (n, chunk) {
    if (n === chunk.length || n === null)
      this[BUFFERSHIFT]();
    else {
      this.buffer[0] = chunk.slice(n);
      chunk = chunk.slice(0, n);
      this[BUFFERLENGTH] -= n;
    }

    this.emit('data', chunk);

    if (!this.buffer.length && !this[EOF$1])
      this.emit('drain');

    return chunk
  }

  end (chunk, encoding, cb) {
    if (typeof chunk === 'function')
      cb = chunk, chunk = null;
    if (typeof encoding === 'function')
      cb = encoding, encoding = 'utf8';
    if (chunk)
      this.write(chunk, encoding);
    if (cb)
      this.once('end', cb);
    this[EOF$1] = true;
    this.writable = false;

    // if we haven't written anything, then go ahead and emit,
    // even if we're not reading.
    // we'll re-emit if a new 'end' listener is added anyway.
    // This makes MP more suitable to write-only use cases.
    if (this.flowing || !this[PAUSED])
      this[MAYBE_EMIT_END]();
    return this
  }

  // don't let the internal resume be overwritten
  [RESUME] () {
    if (this[DESTROYED])
      return

    this[PAUSED] = false;
    this[FLOWING] = true;
    this.emit('resume');
    if (this.buffer.length)
      this[FLUSH]();
    else if (this[EOF$1])
      this[MAYBE_EMIT_END]();
    else
      this.emit('drain');
  }

  resume () {
    return this[RESUME]()
  }

  pause () {
    this[FLOWING] = false;
    this[PAUSED] = true;
  }

  get destroyed () {
    return this[DESTROYED]
  }

  get flowing () {
    return this[FLOWING]
  }

  get paused () {
    return this[PAUSED]
  }

  [BUFFERPUSH] (chunk) {
    if (this[OBJECTMODE])
      this[BUFFERLENGTH] += 1;
    else
      this[BUFFERLENGTH] += chunk.length;
    this.buffer.push(chunk);
  }

  [BUFFERSHIFT] () {
    if (this.buffer.length) {
      if (this[OBJECTMODE])
        this[BUFFERLENGTH] -= 1;
      else
        this[BUFFERLENGTH] -= this.buffer[0].length;
    }
    return this.buffer.shift()
  }

  [FLUSH] (noDrain) {
    do {} while (this[FLUSHCHUNK](this[BUFFERSHIFT]()))

    if (!noDrain && !this.buffer.length && !this[EOF$1])
      this.emit('drain');
  }

  [FLUSHCHUNK] (chunk) {
    return chunk ? (this.emit('data', chunk), this.flowing) : false
  }

  pipe (dest, opts) {
    if (this[DESTROYED])
      return

    const ended = this[EMITTED_END];
    opts = opts || {};
    if (dest === proc.stdout || dest === proc.stderr)
      opts.end = false;
    else
      opts.end = opts.end !== false;
    opts.proxyErrors = !!opts.proxyErrors;

    // piping an ended stream ends immediately
    if (ended) {
      if (opts.end)
        dest.end();
    } else {
      this.pipes.push(!opts.proxyErrors ? new Pipe(this, dest, opts)
        : new PipeProxyErrors(this, dest, opts));
      if (this[ASYNC])
        defer(() => this[RESUME]());
      else
        this[RESUME]();
    }

    return dest
  }

  unpipe (dest) {
    const p = this.pipes.find(p => p.dest === dest);
    if (p) {
      this.pipes.splice(this.pipes.indexOf(p), 1);
      p.unpipe();
    }
  }

  addListener (ev, fn) {
    return this.on(ev, fn)
  }

  on (ev, fn) {
    const ret = super.on(ev, fn);
    if (ev === 'data' && !this.pipes.length && !this.flowing)
      this[RESUME]();
    else if (ev === 'readable' && this[BUFFERLENGTH] !== 0)
      super.emit('readable');
    else if (isEndish(ev) && this[EMITTED_END]) {
      super.emit(ev);
      this.removeAllListeners(ev);
    } else if (ev === 'error' && this[EMITTED_ERROR]) {
      if (this[ASYNC])
        defer(() => fn.call(this, this[EMITTED_ERROR]));
      else
        fn.call(this, this[EMITTED_ERROR]);
    }
    return ret
  }

  get emittedEnd () {
    return this[EMITTED_END]
  }

  [MAYBE_EMIT_END] () {
    if (!this[EMITTING_END] &&
        !this[EMITTED_END] &&
        !this[DESTROYED] &&
        this.buffer.length === 0 &&
        this[EOF$1]) {
      this[EMITTING_END] = true;
      this.emit('end');
      this.emit('prefinish');
      this.emit('finish');
      if (this[CLOSED])
        this.emit('close');
      this[EMITTING_END] = false;
    }
  }

  emit (ev, data, ...extra) {
    // error and close are only events allowed after calling destroy()
    if (ev !== 'error' && ev !== 'close' && ev !== DESTROYED && this[DESTROYED])
      return
    else if (ev === 'data') {
      return !data ? false
        : this[ASYNC] ? defer(() => this[EMITDATA](data))
        : this[EMITDATA](data)
    } else if (ev === 'end') {
      return this[EMITEND]()
    } else if (ev === 'close') {
      this[CLOSED] = true;
      // don't emit close before 'end' and 'finish'
      if (!this[EMITTED_END] && !this[DESTROYED])
        return
      const ret = super.emit('close');
      this.removeAllListeners('close');
      return ret
    } else if (ev === 'error') {
      this[EMITTED_ERROR] = data;
      const ret = super.emit('error', data);
      this[MAYBE_EMIT_END]();
      return ret
    } else if (ev === 'resume') {
      const ret = super.emit('resume');
      this[MAYBE_EMIT_END]();
      return ret
    } else if (ev === 'finish' || ev === 'prefinish') {
      const ret = super.emit(ev);
      this.removeAllListeners(ev);
      return ret
    }

    // Some other unknown event
    const ret = super.emit(ev, data, ...extra);
    this[MAYBE_EMIT_END]();
    return ret
  }

  [EMITDATA] (data) {
    for (const p of this.pipes) {
      if (p.dest.write(data) === false)
        this.pause();
    }
    const ret = super.emit('data', data);
    this[MAYBE_EMIT_END]();
    return ret
  }

  [EMITEND] () {
    if (this[EMITTED_END])
      return

    this[EMITTED_END] = true;
    this.readable = false;
    if (this[ASYNC])
      defer(() => this[EMITEND2]());
    else
      this[EMITEND2]();
  }

  [EMITEND2] () {
    if (this[DECODER]) {
      const data = this[DECODER].end();
      if (data) {
        for (const p of this.pipes) {
          p.dest.write(data);
        }
        super.emit('data', data);
      }
    }

    for (const p of this.pipes) {
      p.end();
    }
    const ret = super.emit('end');
    this.removeAllListeners('end');
    return ret
  }

  // const all = await stream.collect()
  collect () {
    const buf = [];
    if (!this[OBJECTMODE])
      buf.dataLength = 0;
    // set the promise first, in case an error is raised
    // by triggering the flow here.
    const p = this.promise();
    this.on('data', c => {
      buf.push(c);
      if (!this[OBJECTMODE])
        buf.dataLength += c.length;
    });
    return p.then(() => buf)
  }

  // const data = await stream.concat()
  concat () {
    return this[OBJECTMODE]
      ? Promise.reject(new Error('cannot concat in objectMode'))
      : this.collect().then(buf =>
          this[OBJECTMODE]
            ? Promise.reject(new Error('cannot concat in objectMode'))
            : this[ENCODING] ? buf.join('') : Buffer.concat(buf, buf.dataLength))
  }

  // stream.promise().then(() => done, er => emitted error)
  promise () {
    return new Promise((resolve, reject) => {
      this.on(DESTROYED, () => reject(new Error('stream destroyed')));
      this.on('error', er => reject(er));
      this.on('end', () => resolve());
    })
  }

  // for await (let chunk of stream)
  [ASYNCITERATOR] () {
    const next = () => {
      const res = this.read();
      if (res !== null)
        return Promise.resolve({ done: false, value: res })

      if (this[EOF$1])
        return Promise.resolve({ done: true })

      let resolve = null;
      let reject = null;
      const onerr = er => {
        this.removeListener('data', ondata);
        this.removeListener('end', onend);
        reject(er);
      };
      const ondata = value => {
        this.removeListener('error', onerr);
        this.removeListener('end', onend);
        this.pause();
        resolve({ value: value, done: !!this[EOF$1] });
      };
      const onend = () => {
        this.removeListener('error', onerr);
        this.removeListener('data', ondata);
        resolve({ done: true });
      };
      const ondestroy = () => onerr(new Error('stream destroyed'));
      return new Promise((res, rej) => {
        reject = rej;
        resolve = res;
        this.once(DESTROYED, ondestroy);
        this.once('error', onerr);
        this.once('end', onend);
        this.once('data', ondata);
      })
    };

    return { next }
  }

  // for (let chunk of stream)
  [ITERATOR] () {
    const next = () => {
      const value = this.read();
      const done = value === null;
      return { value, done }
    };
    return { next }
  }

  destroy (er) {
    if (this[DESTROYED]) {
      if (er)
        this.emit('error', er);
      else
        this.emit(DESTROYED);
      return this
    }

    this[DESTROYED] = true;

    // throw away all buffered data, it's never coming out
    this.buffer.length = 0;
    this[BUFFERLENGTH] = 0;

    if (typeof this.close === 'function' && !this[CLOSED])
      this.close();

    if (er)
      this.emit('error', er);
    else // if no error to emit, still reject pending promises
      this.emit(DESTROYED);

    return this
  }

  static isStream (s) {
    return !!s && (s instanceof Minipass || s instanceof Stream$1 ||
      s instanceof EE$2 && (
        typeof s.pipe === 'function' || // readable
        (typeof s.write === 'function' && typeof s.end === 'function') // writable
      ))
  }
};

var minizlib = {};

// Update with any zlib constants that are added or changed in the future.
// Node v6 didn't export this, so we just hard code the version and rely
// on all the other hard-coded values from zlib v4736.  When node v6
// support drops, we can just export the realZlibConstants object.
const realZlibConstants = require$$0$1.constants ||
  /* istanbul ignore next */ { ZLIB_VERNUM: 4736 };

var constants$2 = Object.freeze(Object.assign(Object.create(null), {
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_ERRNO: -1,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  Z_VERSION_ERROR: -6,
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  DEFLATE: 1,
  INFLATE: 2,
  GZIP: 3,
  GUNZIP: 4,
  DEFLATERAW: 5,
  INFLATERAW: 6,
  UNZIP: 7,
  BROTLI_DECODE: 8,
  BROTLI_ENCODE: 9,
  Z_MIN_WINDOWBITS: 8,
  Z_MAX_WINDOWBITS: 15,
  Z_DEFAULT_WINDOWBITS: 15,
  Z_MIN_CHUNK: 64,
  Z_MAX_CHUNK: Infinity,
  Z_DEFAULT_CHUNK: 16384,
  Z_MIN_MEMLEVEL: 1,
  Z_MAX_MEMLEVEL: 9,
  Z_DEFAULT_MEMLEVEL: 8,
  Z_MIN_LEVEL: -1,
  Z_MAX_LEVEL: 9,
  Z_DEFAULT_LEVEL: -1,
  BROTLI_OPERATION_PROCESS: 0,
  BROTLI_OPERATION_FLUSH: 1,
  BROTLI_OPERATION_FINISH: 2,
  BROTLI_OPERATION_EMIT_METADATA: 3,
  BROTLI_MODE_GENERIC: 0,
  BROTLI_MODE_TEXT: 1,
  BROTLI_MODE_FONT: 2,
  BROTLI_DEFAULT_MODE: 0,
  BROTLI_MIN_QUALITY: 0,
  BROTLI_MAX_QUALITY: 11,
  BROTLI_DEFAULT_QUALITY: 11,
  BROTLI_MIN_WINDOW_BITS: 10,
  BROTLI_MAX_WINDOW_BITS: 24,
  BROTLI_LARGE_MAX_WINDOW_BITS: 30,
  BROTLI_DEFAULT_WINDOW: 22,
  BROTLI_MIN_INPUT_BLOCK_BITS: 16,
  BROTLI_MAX_INPUT_BLOCK_BITS: 24,
  BROTLI_PARAM_MODE: 0,
  BROTLI_PARAM_QUALITY: 1,
  BROTLI_PARAM_LGWIN: 2,
  BROTLI_PARAM_LGBLOCK: 3,
  BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING: 4,
  BROTLI_PARAM_SIZE_HINT: 5,
  BROTLI_PARAM_LARGE_WINDOW: 6,
  BROTLI_PARAM_NPOSTFIX: 7,
  BROTLI_PARAM_NDIRECT: 8,
  BROTLI_DECODER_RESULT_ERROR: 0,
  BROTLI_DECODER_RESULT_SUCCESS: 1,
  BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT: 2,
  BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT: 3,
  BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION: 0,
  BROTLI_DECODER_PARAM_LARGE_WINDOW: 1,
  BROTLI_DECODER_NO_ERROR: 0,
  BROTLI_DECODER_SUCCESS: 1,
  BROTLI_DECODER_NEEDS_MORE_INPUT: 2,
  BROTLI_DECODER_NEEDS_MORE_OUTPUT: 3,
  BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_NIBBLE: -1,
  BROTLI_DECODER_ERROR_FORMAT_RESERVED: -2,
  BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_META_NIBBLE: -3,
  BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_ALPHABET: -4,
  BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_SAME: -5,
  BROTLI_DECODER_ERROR_FORMAT_CL_SPACE: -6,
  BROTLI_DECODER_ERROR_FORMAT_HUFFMAN_SPACE: -7,
  BROTLI_DECODER_ERROR_FORMAT_CONTEXT_MAP_REPEAT: -8,
  BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_1: -9,
  BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_2: -10,
  BROTLI_DECODER_ERROR_FORMAT_TRANSFORM: -11,
  BROTLI_DECODER_ERROR_FORMAT_DICTIONARY: -12,
  BROTLI_DECODER_ERROR_FORMAT_WINDOW_BITS: -13,
  BROTLI_DECODER_ERROR_FORMAT_PADDING_1: -14,
  BROTLI_DECODER_ERROR_FORMAT_PADDING_2: -15,
  BROTLI_DECODER_ERROR_FORMAT_DISTANCE: -16,
  BROTLI_DECODER_ERROR_DICTIONARY_NOT_SET: -19,
  BROTLI_DECODER_ERROR_INVALID_ARGUMENTS: -20,
  BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MODES: -21,
  BROTLI_DECODER_ERROR_ALLOC_TREE_GROUPS: -22,
  BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MAP: -25,
  BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_1: -26,
  BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_2: -27,
  BROTLI_DECODER_ERROR_ALLOC_BLOCK_TYPE_TREES: -30,
  BROTLI_DECODER_ERROR_UNREACHABLE: -31,
}, realZlibConstants));

const assert$4 = require$$0$2;
const Buffer$1 = require$$1$1.Buffer;
const realZlib = require$$0$1;

const constants$1 = minizlib.constants = constants$2;
const Minipass = minipass;

const OriginalBufferConcat = Buffer$1.concat;

const _superWrite = Symbol('_superWrite');
class ZlibError extends Error {
  constructor (err) {
    super('zlib: ' + err.message);
    this.code = err.code;
    this.errno = err.errno;
    /* istanbul ignore if */
    if (!this.code)
      this.code = 'ZLIB_ERROR';

    this.message = 'zlib: ' + err.message;
    Error.captureStackTrace(this, this.constructor);
  }

  get name () {
    return 'ZlibError'
  }
}

// the Zlib class they all inherit from
// This thing manages the queue of requests, and returns
// true or false if there is anything in the queue when
// you call the .write() method.
const _opts = Symbol('opts');
const _flushFlag = Symbol('flushFlag');
const _finishFlushFlag = Symbol('finishFlushFlag');
const _fullFlushFlag = Symbol('fullFlushFlag');
const _handle = Symbol('handle');
const _onError = Symbol('onError');
const _sawError = Symbol('sawError');
const _level = Symbol('level');
const _strategy = Symbol('strategy');
const _ended$1 = Symbol('ended');

class ZlibBase extends Minipass {
  constructor (opts, mode) {
    if (!opts || typeof opts !== 'object')
      throw new TypeError('invalid options for ZlibBase constructor')

    super(opts);
    this[_sawError] = false;
    this[_ended$1] = false;
    this[_opts] = opts;

    this[_flushFlag] = opts.flush;
    this[_finishFlushFlag] = opts.finishFlush;
    // this will throw if any options are invalid for the class selected
    try {
      this[_handle] = new realZlib[mode](opts);
    } catch (er) {
      // make sure that all errors get decorated properly
      throw new ZlibError(er)
    }

    this[_onError] = (err) => {
      // no sense raising multiple errors, since we abort on the first one.
      if (this[_sawError])
        return

      this[_sawError] = true;

      // there is no way to cleanly recover.
      // continuing only obscures problems.
      this.close();
      this.emit('error', err);
    };

    this[_handle].on('error', er => this[_onError](new ZlibError(er)));
    this.once('end', () => this.close);
  }

  close () {
    if (this[_handle]) {
      this[_handle].close();
      this[_handle] = null;
      this.emit('close');
    }
  }

  reset () {
    if (!this[_sawError]) {
      assert$4(this[_handle], 'zlib binding closed');
      return this[_handle].reset()
    }
  }

  flush (flushFlag) {
    if (this.ended)
      return

    if (typeof flushFlag !== 'number')
      flushFlag = this[_fullFlushFlag];
    this.write(Object.assign(Buffer$1.alloc(0), { [_flushFlag]: flushFlag }));
  }

  end (chunk, encoding, cb) {
    if (chunk)
      this.write(chunk, encoding);
    this.flush(this[_finishFlushFlag]);
    this[_ended$1] = true;
    return super.end(null, null, cb)
  }

  get ended () {
    return this[_ended$1]
  }

  write (chunk, encoding, cb) {
    // process the chunk using the sync process
    // then super.write() all the outputted chunks
    if (typeof encoding === 'function')
      cb = encoding, encoding = 'utf8';

    if (typeof chunk === 'string')
      chunk = Buffer$1.from(chunk, encoding);

    if (this[_sawError])
      return
    assert$4(this[_handle], 'zlib binding closed');

    // _processChunk tries to .close() the native handle after it's done, so we
    // intercept that by temporarily making it a no-op.
    const nativeHandle = this[_handle]._handle;
    const originalNativeClose = nativeHandle.close;
    nativeHandle.close = () => {};
    const originalClose = this[_handle].close;
    this[_handle].close = () => {};
    // It also calls `Buffer.concat()` at the end, which may be convenient
    // for some, but which we are not interested in as it slows us down.
    Buffer$1.concat = (args) => args;
    let result;
    try {
      const flushFlag = typeof chunk[_flushFlag] === 'number'
        ? chunk[_flushFlag] : this[_flushFlag];
      result = this[_handle]._processChunk(chunk, flushFlag);
      // if we don't throw, reset it back how it was
      Buffer$1.concat = OriginalBufferConcat;
    } catch (err) {
      // or if we do, put Buffer.concat() back before we emit error
      // Error events call into user code, which may call Buffer.concat()
      Buffer$1.concat = OriginalBufferConcat;
      this[_onError](new ZlibError(err));
    } finally {
      if (this[_handle]) {
        // Core zlib resets `_handle` to null after attempting to close the
        // native handle. Our no-op handler prevented actual closure, but we
        // need to restore the `._handle` property.
        this[_handle]._handle = nativeHandle;
        nativeHandle.close = originalNativeClose;
        this[_handle].close = originalClose;
        // `_processChunk()` adds an 'error' listener. If we don't remove it
        // after each call, these handlers start piling up.
        this[_handle].removeAllListeners('error');
        // make sure OUR error listener is still attached tho
      }
    }

    if (this[_handle])
      this[_handle].on('error', er => this[_onError](new ZlibError(er)));

    let writeReturn;
    if (result) {
      if (Array.isArray(result) && result.length > 0) {
        // The first buffer is always `handle._outBuffer`, which would be
        // re-used for later invocations; so, we always have to copy that one.
        writeReturn = this[_superWrite](Buffer$1.from(result[0]));
        for (let i = 1; i < result.length; i++) {
          writeReturn = this[_superWrite](result[i]);
        }
      } else {
        writeReturn = this[_superWrite](Buffer$1.from(result));
      }
    }

    if (cb)
      cb();
    return writeReturn
  }

  [_superWrite] (data) {
    return super.write(data)
  }
}

class Zlib extends ZlibBase {
  constructor (opts, mode) {
    opts = opts || {};

    opts.flush = opts.flush || constants$1.Z_NO_FLUSH;
    opts.finishFlush = opts.finishFlush || constants$1.Z_FINISH;
    super(opts, mode);

    this[_fullFlushFlag] = constants$1.Z_FULL_FLUSH;
    this[_level] = opts.level;
    this[_strategy] = opts.strategy;
  }

  params (level, strategy) {
    if (this[_sawError])
      return

    if (!this[_handle])
      throw new Error('cannot switch params when binding is closed')

    // no way to test this without also not supporting params at all
    /* istanbul ignore if */
    if (!this[_handle].params)
      throw new Error('not supported in this implementation')

    if (this[_level] !== level || this[_strategy] !== strategy) {
      this.flush(constants$1.Z_SYNC_FLUSH);
      assert$4(this[_handle], 'zlib binding closed');
      // .params() calls .flush(), but the latter is always async in the
      // core zlib. We override .flush() temporarily to intercept that and
      // flush synchronously.
      const origFlush = this[_handle].flush;
      this[_handle].flush = (flushFlag, cb) => {
        this.flush(flushFlag);
        cb();
      };
      try {
        this[_handle].params(level, strategy);
      } finally {
        this[_handle].flush = origFlush;
      }
      /* istanbul ignore else */
      if (this[_handle]) {
        this[_level] = level;
        this[_strategy] = strategy;
      }
    }
  }
}

// minimal 2-byte header
class Deflate extends Zlib {
  constructor (opts) {
    super(opts, 'Deflate');
  }
}

class Inflate extends Zlib {
  constructor (opts) {
    super(opts, 'Inflate');
  }
}

// gzip - bigger header, same deflate compression
const _portable = Symbol('_portable');
class Gzip extends Zlib {
  constructor (opts) {
    super(opts, 'Gzip');
    this[_portable] = opts && !!opts.portable;
  }

  [_superWrite] (data) {
    if (!this[_portable])
      return super[_superWrite](data)

    // we'll always get the header emitted in one first chunk
    // overwrite the OS indicator byte with 0xFF
    this[_portable] = false;
    data[9] = 255;
    return super[_superWrite](data)
  }
}

class Gunzip extends Zlib {
  constructor (opts) {
    super(opts, 'Gunzip');
  }
}

// raw - no header
class DeflateRaw extends Zlib {
  constructor (opts) {
    super(opts, 'DeflateRaw');
  }
}

class InflateRaw extends Zlib {
  constructor (opts) {
    super(opts, 'InflateRaw');
  }
}

// auto-detect header.
class Unzip extends Zlib {
  constructor (opts) {
    super(opts, 'Unzip');
  }
}

class Brotli extends ZlibBase {
  constructor (opts, mode) {
    opts = opts || {};

    opts.flush = opts.flush || constants$1.BROTLI_OPERATION_PROCESS;
    opts.finishFlush = opts.finishFlush || constants$1.BROTLI_OPERATION_FINISH;

    super(opts, mode);

    this[_fullFlushFlag] = constants$1.BROTLI_OPERATION_FLUSH;
  }
}

class BrotliCompress extends Brotli {
  constructor (opts) {
    super(opts, 'BrotliCompress');
  }
}

class BrotliDecompress extends Brotli {
  constructor (opts) {
    super(opts, 'BrotliDecompress');
  }
}

minizlib.Deflate = Deflate;
minizlib.Inflate = Inflate;
minizlib.Gzip = Gzip;
minizlib.Gunzip = Gunzip;
minizlib.DeflateRaw = DeflateRaw;
minizlib.InflateRaw = InflateRaw;
minizlib.Unzip = Unzip;
/* istanbul ignore else */
if (typeof realZlib.BrotliCompress === 'function') {
  minizlib.BrotliCompress = BrotliCompress;
  minizlib.BrotliDecompress = BrotliDecompress;
} else {
  minizlib.BrotliCompress = minizlib.BrotliDecompress = class {
    constructor () {
      throw new Error('Brotli is not supported in this version of Node.js')
    }
  };
}

const MiniPass$3 = minipass;

const SLURP$1 = Symbol('slurp');
var readEntry = class ReadEntry extends MiniPass$3 {
  constructor (header, ex, gex) {
    super();
    // read entries always start life paused.  this is to avoid the
    // situation where Minipass's auto-ending empty streams results
    // in an entry ending before we're ready for it.
    this.pause();
    this.extended = ex;
    this.globalExtended = gex;
    this.header = header;
    this.startBlockSize = 512 * Math.ceil(header.size / 512);
    this.blockRemain = this.startBlockSize;
    this.remain = header.size;
    this.type = header.type;
    this.meta = false;
    this.ignore = false;
    switch (this.type) {
      case 'File':
      case 'OldFile':
      case 'Link':
      case 'SymbolicLink':
      case 'CharacterDevice':
      case 'BlockDevice':
      case 'Directory':
      case 'FIFO':
      case 'ContiguousFile':
      case 'GNUDumpDir':
        break

      case 'NextFileHasLongLinkpath':
      case 'NextFileHasLongPath':
      case 'OldGnuLongPath':
      case 'GlobalExtendedHeader':
      case 'ExtendedHeader':
      case 'OldExtendedHeader':
        this.meta = true;
        break

      // NOTE: gnutar and bsdtar treat unrecognized types as 'File'
      // it may be worth doing the same, but with a warning.
      default:
        this.ignore = true;
    }

    this.path = header.path;
    this.mode = header.mode;
    if (this.mode)
      this.mode = this.mode & 0o7777;
    this.uid = header.uid;
    this.gid = header.gid;
    this.uname = header.uname;
    this.gname = header.gname;
    this.size = header.size;
    this.mtime = header.mtime;
    this.atime = header.atime;
    this.ctime = header.ctime;
    this.linkpath = header.linkpath;
    this.uname = header.uname;
    this.gname = header.gname;

    if (ex)
      this[SLURP$1](ex);
    if (gex)
      this[SLURP$1](gex, true);
  }

  write (data) {
    const writeLen = data.length;
    if (writeLen > this.blockRemain)
      throw new Error('writing more to entry than is appropriate')

    const r = this.remain;
    const br = this.blockRemain;
    this.remain = Math.max(0, r - writeLen);
    this.blockRemain = Math.max(0, br - writeLen);
    if (this.ignore)
      return true

    if (r >= writeLen)
      return super.write(data)

    // r < writeLen
    return super.write(data.slice(0, r))
  }

  [SLURP$1] (ex, global) {
    for (const k in ex) {
      // we slurp in everything except for the path attribute in
      // a global extended header, because that's weird.
      if (ex[k] !== null && ex[k] !== undefined &&
          !(global && k === 'path'))
        this[k] = ex[k];
    }
  }
};

var types$1 = {};

(function (exports) {
	// map types from key to human-friendly name
	exports.name = new Map([
	  ['0', 'File'],
	  // same as File
	  ['', 'OldFile'],
	  ['1', 'Link'],
	  ['2', 'SymbolicLink'],
	  // Devices and FIFOs aren't fully supported
	  // they are parsed, but skipped when unpacking
	  ['3', 'CharacterDevice'],
	  ['4', 'BlockDevice'],
	  ['5', 'Directory'],
	  ['6', 'FIFO'],
	  // same as File
	  ['7', 'ContiguousFile'],
	  // pax headers
	  ['g', 'GlobalExtendedHeader'],
	  ['x', 'ExtendedHeader'],
	  // vendor-specific stuff
	  // skip
	  ['A', 'SolarisACL'],
	  // like 5, but with data, which should be skipped
	  ['D', 'GNUDumpDir'],
	  // metadata only, skip
	  ['I', 'Inode'],
	  // data = link path of next file
	  ['K', 'NextFileHasLongLinkpath'],
	  // data = path of next file
	  ['L', 'NextFileHasLongPath'],
	  // skip
	  ['M', 'ContinuationFile'],
	  // like L
	  ['N', 'OldGnuLongPath'],
	  // skip
	  ['S', 'SparseFile'],
	  // skip
	  ['V', 'TapeVolumeHeader'],
	  // like x
	  ['X', 'OldExtendedHeader'],
	]);

	// map the other direction
	exports.code = new Map(Array.from(exports.name).map(kv => [kv[1], kv[0]]));
} (types$1));

// Tar can encode large and negative numbers using a leading byte of
// 0xff for negative, and 0x80 for positive.

const encode = (num, buf) => {
  if (!Number.isSafeInteger(num))
    // The number is so large that javascript cannot represent it with integer
    // precision.
    throw Error('cannot encode number outside of javascript safe integer range')
  else if (num < 0)
    encodeNegative(num, buf);
  else
    encodePositive(num, buf);
  return buf
};

const encodePositive = (num, buf) => {
  buf[0] = 0x80;

  for (var i = buf.length; i > 1; i--) {
    buf[i - 1] = num & 0xff;
    num = Math.floor(num / 0x100);
  }
};

const encodeNegative = (num, buf) => {
  buf[0] = 0xff;
  var flipped = false;
  num = num * -1;
  for (var i = buf.length; i > 1; i--) {
    var byte = num & 0xff;
    num = Math.floor(num / 0x100);
    if (flipped)
      buf[i - 1] = onesComp(byte);
    else if (byte === 0)
      buf[i - 1] = 0;
    else {
      flipped = true;
      buf[i - 1] = twosComp(byte);
    }
  }
};

const parse$3 = (buf) => {
  const pre = buf[0];
  const value = pre === 0x80 ? pos(buf.slice(1, buf.length))
    : pre === 0xff ? twos(buf)
    : null;
  if (value === null)
    throw Error('invalid base256 encoding')

  if (!Number.isSafeInteger(value))
    // The number is so large that javascript cannot represent it with integer
    // precision.
    throw Error('parsed number outside of javascript safe integer range')

  return value
};

const twos = (buf) => {
  var len = buf.length;
  var sum = 0;
  var flipped = false;
  for (var i = len - 1; i > -1; i--) {
    var byte = buf[i];
    var f;
    if (flipped)
      f = onesComp(byte);
    else if (byte === 0)
      f = byte;
    else {
      flipped = true;
      f = twosComp(byte);
    }
    if (f !== 0)
      sum -= f * Math.pow(256, len - i - 1);
  }
  return sum
};

const pos = (buf) => {
  var len = buf.length;
  var sum = 0;
  for (var i = len - 1; i > -1; i--) {
    var byte = buf[i];
    if (byte !== 0)
      sum += byte * Math.pow(256, len - i - 1);
  }
  return sum
};

const onesComp = byte => (0xff ^ byte) & 0xff;

const twosComp = byte => ((0xff ^ byte) + 1) & 0xff;

var largeNumbers = {
  encode,
  parse: parse$3,
};

// parse a 512-byte header block to a data object, or vice-versa
// encode returns `true` if a pax extended header is needed, because
// the data could not be faithfully encoded in a simple header.
// (Also, check header.needPax to see if it needs a pax header.)

const types = types$1;
const pathModule = require$$1$2.posix;
const large = largeNumbers;

const SLURP = Symbol('slurp');
const TYPE = Symbol('type');

class Header$4 {
  constructor (data, off, ex, gex) {
    this.cksumValid = false;
    this.needPax = false;
    this.nullBlock = false;

    this.block = null;
    this.path = null;
    this.mode = null;
    this.uid = null;
    this.gid = null;
    this.size = null;
    this.mtime = null;
    this.cksum = null;
    this[TYPE] = '0';
    this.linkpath = null;
    this.uname = null;
    this.gname = null;
    this.devmaj = 0;
    this.devmin = 0;
    this.atime = null;
    this.ctime = null;

    if (Buffer.isBuffer(data))
      this.decode(data, off || 0, ex, gex);
    else if (data)
      this.set(data);
  }

  decode (buf, off, ex, gex) {
    if (!off)
      off = 0;

    if (!buf || !(buf.length >= off + 512))
      throw new Error('need 512 bytes for header')

    this.path = decString(buf, off, 100);
    this.mode = decNumber(buf, off + 100, 8);
    this.uid = decNumber(buf, off + 108, 8);
    this.gid = decNumber(buf, off + 116, 8);
    this.size = decNumber(buf, off + 124, 12);
    this.mtime = decDate(buf, off + 136, 12);
    this.cksum = decNumber(buf, off + 148, 12);

    // if we have extended or global extended headers, apply them now
    // See https://github.com/npm/node-tar/pull/187
    this[SLURP](ex);
    this[SLURP](gex, true);

    // old tar versions marked dirs as a file with a trailing /
    this[TYPE] = decString(buf, off + 156, 1);
    if (this[TYPE] === '')
      this[TYPE] = '0';
    if (this[TYPE] === '0' && this.path.substr(-1) === '/')
      this[TYPE] = '5';

    // tar implementations sometimes incorrectly put the stat(dir).size
    // as the size in the tarball, even though Directory entries are
    // not able to have any body at all.  In the very rare chance that
    // it actually DOES have a body, we weren't going to do anything with
    // it anyway, and it'll just be a warning about an invalid header.
    if (this[TYPE] === '5')
      this.size = 0;

    this.linkpath = decString(buf, off + 157, 100);
    if (buf.slice(off + 257, off + 265).toString() === 'ustar\u000000') {
      this.uname = decString(buf, off + 265, 32);
      this.gname = decString(buf, off + 297, 32);
      this.devmaj = decNumber(buf, off + 329, 8);
      this.devmin = decNumber(buf, off + 337, 8);
      if (buf[off + 475] !== 0) {
        // definitely a prefix, definitely >130 chars.
        const prefix = decString(buf, off + 345, 155);
        this.path = prefix + '/' + this.path;
      } else {
        const prefix = decString(buf, off + 345, 130);
        if (prefix)
          this.path = prefix + '/' + this.path;
        this.atime = decDate(buf, off + 476, 12);
        this.ctime = decDate(buf, off + 488, 12);
      }
    }

    let sum = 8 * 0x20;
    for (let i = off; i < off + 148; i++)
      sum += buf[i];

    for (let i = off + 156; i < off + 512; i++)
      sum += buf[i];

    this.cksumValid = sum === this.cksum;
    if (this.cksum === null && sum === 8 * 0x20)
      this.nullBlock = true;
  }

  [SLURP] (ex, global) {
    for (const k in ex) {
      // we slurp in everything except for the path attribute in
      // a global extended header, because that's weird.
      if (ex[k] !== null && ex[k] !== undefined &&
          !(global && k === 'path'))
        this[k] = ex[k];
    }
  }

  encode (buf, off) {
    if (!buf) {
      buf = this.block = Buffer.alloc(512);
      off = 0;
    }

    if (!off)
      off = 0;

    if (!(buf.length >= off + 512))
      throw new Error('need 512 bytes for header')

    const prefixSize = this.ctime || this.atime ? 130 : 155;
    const split = splitPrefix(this.path || '', prefixSize);
    const path = split[0];
    const prefix = split[1];
    this.needPax = split[2];

    this.needPax = encString(buf, off, 100, path) || this.needPax;
    this.needPax = encNumber(buf, off + 100, 8, this.mode) || this.needPax;
    this.needPax = encNumber(buf, off + 108, 8, this.uid) || this.needPax;
    this.needPax = encNumber(buf, off + 116, 8, this.gid) || this.needPax;
    this.needPax = encNumber(buf, off + 124, 12, this.size) || this.needPax;
    this.needPax = encDate(buf, off + 136, 12, this.mtime) || this.needPax;
    buf[off + 156] = this[TYPE].charCodeAt(0);
    this.needPax = encString(buf, off + 157, 100, this.linkpath) || this.needPax;
    buf.write('ustar\u000000', off + 257, 8);
    this.needPax = encString(buf, off + 265, 32, this.uname) || this.needPax;
    this.needPax = encString(buf, off + 297, 32, this.gname) || this.needPax;
    this.needPax = encNumber(buf, off + 329, 8, this.devmaj) || this.needPax;
    this.needPax = encNumber(buf, off + 337, 8, this.devmin) || this.needPax;
    this.needPax = encString(buf, off + 345, prefixSize, prefix) || this.needPax;
    if (buf[off + 475] !== 0)
      this.needPax = encString(buf, off + 345, 155, prefix) || this.needPax;
    else {
      this.needPax = encString(buf, off + 345, 130, prefix) || this.needPax;
      this.needPax = encDate(buf, off + 476, 12, this.atime) || this.needPax;
      this.needPax = encDate(buf, off + 488, 12, this.ctime) || this.needPax;
    }

    let sum = 8 * 0x20;
    for (let i = off; i < off + 148; i++)
      sum += buf[i];

    for (let i = off + 156; i < off + 512; i++)
      sum += buf[i];

    this.cksum = sum;
    encNumber(buf, off + 148, 8, this.cksum);
    this.cksumValid = true;

    return this.needPax
  }

  set (data) {
    for (const i in data) {
      if (data[i] !== null && data[i] !== undefined)
        this[i] = data[i];
    }
  }

  get type () {
    return types.name.get(this[TYPE]) || this[TYPE]
  }

  get typeKey () {
    return this[TYPE]
  }

  set type (type) {
    if (types.code.has(type))
      this[TYPE] = types.code.get(type);
    else
      this[TYPE] = type;
  }
}

const splitPrefix = (p, prefixSize) => {
  const pathSize = 100;
  let pp = p;
  let prefix = '';
  let ret;
  const root = pathModule.parse(p).root || '.';

  if (Buffer.byteLength(pp) < pathSize)
    ret = [pp, prefix, false];
  else {
    // first set prefix to the dir, and path to the base
    prefix = pathModule.dirname(pp);
    pp = pathModule.basename(pp);

    do {
      // both fit!
      if (Buffer.byteLength(pp) <= pathSize &&
          Buffer.byteLength(prefix) <= prefixSize)
        ret = [pp, prefix, false];

      // prefix fits in prefix, but path doesn't fit in path
      else if (Buffer.byteLength(pp) > pathSize &&
          Buffer.byteLength(prefix) <= prefixSize)
        ret = [pp.substr(0, pathSize - 1), prefix, true];

      else {
        // make path take a bit from prefix
        pp = pathModule.join(pathModule.basename(prefix), pp);
        prefix = pathModule.dirname(prefix);
      }
    } while (prefix !== root && !ret)

    // at this point, found no resolution, just truncate
    if (!ret)
      ret = [p.substr(0, pathSize - 1), '', true];
  }
  return ret
};

const decString = (buf, off, size) =>
  buf.slice(off, off + size).toString('utf8').replace(/\0.*/, '');

const decDate = (buf, off, size) =>
  numToDate(decNumber(buf, off, size));

const numToDate = num => num === null ? null : new Date(num * 1000);

const decNumber = (buf, off, size) =>
  buf[off] & 0x80 ? large.parse(buf.slice(off, off + size))
  : decSmallNumber(buf, off, size);

const nanNull = value => isNaN(value) ? null : value;

const decSmallNumber = (buf, off, size) =>
  nanNull(parseInt(
    buf.slice(off, off + size)
      .toString('utf8').replace(/\0.*$/, '').trim(), 8));

// the maximum encodable as a null-terminated octal, by field size
const MAXNUM = {
  12: 0o77777777777,
  8: 0o7777777,
};

const encNumber = (buf, off, size, number) =>
  number === null ? false :
  number > MAXNUM[size] || number < 0
    ? (large.encode(number, buf.slice(off, off + size)), true)
    : (encSmallNumber(buf, off, size, number), false);

const encSmallNumber = (buf, off, size, number) =>
  buf.write(octalString(number, size), off, size, 'ascii');

const octalString = (number, size) =>
  padOctal(Math.floor(number).toString(8), size);

const padOctal = (string, size) =>
  (string.length === size - 1 ? string
  : new Array(size - string.length - 1).join('0') + string + ' ') + '\0';

const encDate = (buf, off, size, date) =>
  date === null ? false :
  encNumber(buf, off, size, date.getTime() / 1000);

// enough to fill the longest string we've got
const NULLS = new Array(156).join('\0');
// pad with nulls, return true if it's longer or non-ascii
const encString = (buf, off, size, string) =>
  string === null ? false :
  (buf.write(string + NULLS, off, size, 'utf8'),
  string.length !== Buffer.byteLength(string) || string.length > size);

var header = Header$4;

const Header$3 = header;
const path$e = require$$1$2;

class Pax$2 {
  constructor (obj, global) {
    this.atime = obj.atime || null;
    this.charset = obj.charset || null;
    this.comment = obj.comment || null;
    this.ctime = obj.ctime || null;
    this.gid = obj.gid || null;
    this.gname = obj.gname || null;
    this.linkpath = obj.linkpath || null;
    this.mtime = obj.mtime || null;
    this.path = obj.path || null;
    this.size = obj.size || null;
    this.uid = obj.uid || null;
    this.uname = obj.uname || null;
    this.dev = obj.dev || null;
    this.ino = obj.ino || null;
    this.nlink = obj.nlink || null;
    this.global = global || false;
  }

  encode () {
    const body = this.encodeBody();
    if (body === '')
      return null

    const bodyLen = Buffer.byteLength(body);
    // round up to 512 bytes
    // add 512 for header
    const bufLen = 512 * Math.ceil(1 + bodyLen / 512);
    const buf = Buffer.allocUnsafe(bufLen);

    // 0-fill the header section, it might not hit every field
    for (let i = 0; i < 512; i++)
      buf[i] = 0;

    new Header$3({
      // XXX split the path
      // then the path should be PaxHeader + basename, but less than 99,
      // prepend with the dirname
      path: ('PaxHeader/' + path$e.basename(this.path)).slice(0, 99),
      mode: this.mode || 0o644,
      uid: this.uid || null,
      gid: this.gid || null,
      size: bodyLen,
      mtime: this.mtime || null,
      type: this.global ? 'GlobalExtendedHeader' : 'ExtendedHeader',
      linkpath: '',
      uname: this.uname || '',
      gname: this.gname || '',
      devmaj: 0,
      devmin: 0,
      atime: this.atime || null,
      ctime: this.ctime || null,
    }).encode(buf);

    buf.write(body, 512, bodyLen, 'utf8');

    // null pad after the body
    for (let i = bodyLen + 512; i < buf.length; i++)
      buf[i] = 0;

    return buf
  }

  encodeBody () {
    return (
      this.encodeField('path') +
      this.encodeField('ctime') +
      this.encodeField('atime') +
      this.encodeField('dev') +
      this.encodeField('ino') +
      this.encodeField('nlink') +
      this.encodeField('charset') +
      this.encodeField('comment') +
      this.encodeField('gid') +
      this.encodeField('gname') +
      this.encodeField('linkpath') +
      this.encodeField('mtime') +
      this.encodeField('size') +
      this.encodeField('uid') +
      this.encodeField('uname')
    )
  }

  encodeField (field) {
    if (this[field] === null || this[field] === undefined)
      return ''
    const v = this[field] instanceof Date ? this[field].getTime() / 1000
      : this[field];
    const s = ' ' +
      (field === 'dev' || field === 'ino' || field === 'nlink'
        ? 'SCHILY.' : '') +
      field + '=' + v + '\n';
    const byteLen = Buffer.byteLength(s);
    // the digits includes the length of the digits in ascii base-10
    // so if it's 9 characters, then adding 1 for the 9 makes it 10
    // which makes it 11 chars.
    let digits = Math.floor(Math.log(byteLen) / Math.log(10)) + 1;
    if (byteLen + digits >= Math.pow(10, digits))
      digits += 1;
    const len = digits + byteLen;
    return len + s
  }
}

Pax$2.parse = (string, ex, g) => new Pax$2(merge(parseKV(string), ex), g);

const merge = (a, b) =>
  b ? Object.keys(a).reduce((s, k) => (s[k] = a[k], s), b) : a;

const parseKV = string =>
  string
    .replace(/\n$/, '')
    .split('\n')
    .reduce(parseKVLine, Object.create(null));

const parseKVLine = (set, line) => {
  const n = parseInt(line, 10);

  // XXX Values with \n in them will fail this.
  // Refactor to not be a naive line-by-line parse.
  if (n !== Buffer.byteLength(line) + 1)
    return set

  line = line.substr((n + ' ').length);
  const kv = line.split('=');
  const k = kv.shift().replace(/^SCHILY\.(dev|ino|nlink)/, '$1');
  if (!k)
    return set

  const v = kv.join('=');
  set[k] = /^([A-Z]+\.)?([mac]|birth|creation)time$/.test(k)
    ? new Date(v * 1000)
    : /^[0-9]+$/.test(v) ? +v
    : v;
  return set
};

var pax = Pax$2;

var warnMixin = Base => class extends Base {
  warn (code, message, data = {}) {
    if (this.file)
      data.file = this.file;
    if (this.cwd)
      data.cwd = this.cwd;
    data.code = message instanceof Error && message.code || code;
    data.tarCode = code;
    if (!this.strict && data.recoverable !== false) {
      if (message instanceof Error) {
        data = Object.assign(message, data);
        message = message.message;
      }
      this.emit('warn', data.tarCode, message, data);
    } else if (message instanceof Error)
      this.emit('error', Object.assign(message, data));
    else
      this.emit('error', Object.assign(new Error(`${code}: ${message}`), data));
  }
};

// When writing files on Windows, translate the characters to their
// 0xf000 higher-encoded versions.

const raw$1 = [
  '|',
  '<',
  '>',
  '?',
  ':',
];

const win = raw$1.map(char =>
  String.fromCharCode(0xf000 + char.charCodeAt(0)));

const toWin = new Map(raw$1.map((char, i) => [char, win[i]]));
const toRaw = new Map(win.map((char, i) => [char, raw$1[i]]));

var winchars$1 = {
  encode: s => raw$1.reduce((s, c) => s.split(c).join(toWin.get(c)), s),
  decode: s => win.reduce((s, c) => s.split(c).join(toRaw.get(c)), s),
};

var modeFix$1 = (mode, isDir, portable) => {
  mode &= 0o7777;

  // in portable mode, use the minimum reasonable umask
  // if this system creates files with 0o664 by default
  // (as some linux distros do), then we'll write the
  // archive with 0o644 instead.  Also, don't ever create
  // a file that is not readable/writable by the owner.
  if (portable)
    mode = (mode | 0o600) & ~0o22;

  // if dirs are readable, then they should be listable
  if (isDir) {
    if (mode & 0o400)
      mode |= 0o100;
    if (mode & 0o40)
      mode |= 0o10;
    if (mode & 0o4)
      mode |= 0o1;
  }
  return mode
};

const MiniPass$2 = minipass;
const Pax$1 = pax;
const Header$2 = header;
const fs$h = require$$0$3;
const path$d = require$$1$2;

const maxReadSize = 16 * 1024 * 1024;
const PROCESS$1 = Symbol('process');
const FILE$1 = Symbol('file');
const DIRECTORY$1 = Symbol('directory');
const SYMLINK$1 = Symbol('symlink');
const HARDLINK$1 = Symbol('hardlink');
const HEADER = Symbol('header');
const READ = Symbol('read');
const LSTAT = Symbol('lstat');
const ONLSTAT = Symbol('onlstat');
const ONREAD = Symbol('onread');
const ONREADLINK = Symbol('onreadlink');
const OPENFILE = Symbol('openfile');
const ONOPENFILE = Symbol('onopenfile');
const CLOSE = Symbol('close');
const MODE = Symbol('mode');
const warner$2 = warnMixin;
const winchars = winchars$1;

const modeFix = modeFix$1;

const WriteEntry$1 = warner$2(class WriteEntry extends MiniPass$2 {
  constructor (p, opt) {
    opt = opt || {};
    super(opt);
    if (typeof p !== 'string')
      throw new TypeError('path is required')
    this.path = p;
    // suppress atime, ctime, uid, gid, uname, gname
    this.portable = !!opt.portable;
    // until node has builtin pwnam functions, this'll have to do
    this.myuid = process.getuid && process.getuid();
    this.myuser = process.env.USER || '';
    this.maxReadSize = opt.maxReadSize || maxReadSize;
    this.linkCache = opt.linkCache || new Map();
    this.statCache = opt.statCache || new Map();
    this.preservePaths = !!opt.preservePaths;
    this.cwd = opt.cwd || process.cwd();
    this.strict = !!opt.strict;
    this.noPax = !!opt.noPax;
    this.noMtime = !!opt.noMtime;
    this.mtime = opt.mtime || null;

    if (typeof opt.onwarn === 'function')
      this.on('warn', opt.onwarn);

    let pathWarn = false;
    if (!this.preservePaths && path$d.win32.isAbsolute(p)) {
      // absolutes on posix are also absolutes on win32
      // so we only need to test this one to get both
      const parsed = path$d.win32.parse(p);
      this.path = p.substr(parsed.root.length);
      pathWarn = parsed.root;
    }

    this.win32 = !!opt.win32 || process.platform === 'win32';
    if (this.win32) {
      this.path = winchars.decode(this.path.replace(/\\/g, '/'));
      p = p.replace(/\\/g, '/');
    }

    this.absolute = opt.absolute || path$d.resolve(this.cwd, p);

    if (this.path === '')
      this.path = './';

    if (pathWarn) {
      this.warn('TAR_ENTRY_INFO', `stripping ${pathWarn} from absolute path`, {
        entry: this,
        path: pathWarn + this.path,
      });
    }

    if (this.statCache.has(this.absolute))
      this[ONLSTAT](this.statCache.get(this.absolute));
    else
      this[LSTAT]();
  }

  [LSTAT] () {
    fs$h.lstat(this.absolute, (er, stat) => {
      if (er)
        return this.emit('error', er)
      this[ONLSTAT](stat);
    });
  }

  [ONLSTAT] (stat) {
    this.statCache.set(this.absolute, stat);
    this.stat = stat;
    if (!stat.isFile())
      stat.size = 0;
    this.type = getType(stat);
    this.emit('stat', stat);
    this[PROCESS$1]();
  }

  [PROCESS$1] () {
    switch (this.type) {
      case 'File': return this[FILE$1]()
      case 'Directory': return this[DIRECTORY$1]()
      case 'SymbolicLink': return this[SYMLINK$1]()
      // unsupported types are ignored.
      default: return this.end()
    }
  }

  [MODE] (mode) {
    return modeFix(mode, this.type === 'Directory', this.portable)
  }

  [HEADER] () {
    if (this.type === 'Directory' && this.portable)
      this.noMtime = true;

    this.header = new Header$2({
      path: this.path,
      linkpath: this.linkpath,
      // only the permissions and setuid/setgid/sticky bitflags
      // not the higher-order bits that specify file type
      mode: this[MODE](this.stat.mode),
      uid: this.portable ? null : this.stat.uid,
      gid: this.portable ? null : this.stat.gid,
      size: this.stat.size,
      mtime: this.noMtime ? null : this.mtime || this.stat.mtime,
      type: this.type,
      uname: this.portable ? null :
      this.stat.uid === this.myuid ? this.myuser : '',
      atime: this.portable ? null : this.stat.atime,
      ctime: this.portable ? null : this.stat.ctime,
    });

    if (this.header.encode() && !this.noPax) {
      this.write(new Pax$1({
        atime: this.portable ? null : this.header.atime,
        ctime: this.portable ? null : this.header.ctime,
        gid: this.portable ? null : this.header.gid,
        mtime: this.noMtime ? null : this.mtime || this.header.mtime,
        path: this.path,
        linkpath: this.linkpath,
        size: this.header.size,
        uid: this.portable ? null : this.header.uid,
        uname: this.portable ? null : this.header.uname,
        dev: this.portable ? null : this.stat.dev,
        ino: this.portable ? null : this.stat.ino,
        nlink: this.portable ? null : this.stat.nlink,
      }).encode());
    }
    this.write(this.header.block);
  }

  [DIRECTORY$1] () {
    if (this.path.substr(-1) !== '/')
      this.path += '/';
    this.stat.size = 0;
    this[HEADER]();
    this.end();
  }

  [SYMLINK$1] () {
    fs$h.readlink(this.absolute, (er, linkpath) => {
      if (er)
        return this.emit('error', er)
      this[ONREADLINK](linkpath);
    });
  }

  [ONREADLINK] (linkpath) {
    this.linkpath = linkpath.replace(/\\/g, '/');
    this[HEADER]();
    this.end();
  }

  [HARDLINK$1] (linkpath) {
    this.type = 'Link';
    this.linkpath = path$d.relative(this.cwd, linkpath).replace(/\\/g, '/');
    this.stat.size = 0;
    this[HEADER]();
    this.end();
  }

  [FILE$1] () {
    if (this.stat.nlink > 1) {
      const linkKey = this.stat.dev + ':' + this.stat.ino;
      if (this.linkCache.has(linkKey)) {
        const linkpath = this.linkCache.get(linkKey);
        if (linkpath.indexOf(this.cwd) === 0)
          return this[HARDLINK$1](linkpath)
      }
      this.linkCache.set(linkKey, this.absolute);
    }

    this[HEADER]();
    if (this.stat.size === 0)
      return this.end()

    this[OPENFILE]();
  }

  [OPENFILE] () {
    fs$h.open(this.absolute, 'r', (er, fd) => {
      if (er)
        return this.emit('error', er)
      this[ONOPENFILE](fd);
    });
  }

  [ONOPENFILE] (fd) {
    const blockLen = 512 * Math.ceil(this.stat.size / 512);
    const bufLen = Math.min(blockLen, this.maxReadSize);
    const buf = Buffer.allocUnsafe(bufLen);
    this[READ](fd, buf, 0, buf.length, 0, this.stat.size, blockLen);
  }

  [READ] (fd, buf, offset, length, pos, remain, blockRemain) {
    fs$h.read(fd, buf, offset, length, pos, (er, bytesRead) => {
      if (er) {
        // ignoring the error from close(2) is a bad practice, but at
        // this point we already have an error, don't need another one
        return this[CLOSE](fd, () => this.emit('error', er))
      }
      this[ONREAD](fd, buf, offset, length, pos, remain, blockRemain, bytesRead);
    });
  }

  [CLOSE] (fd, cb) {
    fs$h.close(fd, cb);
  }

  [ONREAD] (fd, buf, offset, length, pos, remain, blockRemain, bytesRead) {
    if (bytesRead <= 0 && remain > 0) {
      const er = new Error('encountered unexpected EOF');
      er.path = this.absolute;
      er.syscall = 'read';
      er.code = 'EOF';
      return this[CLOSE](fd, () => this.emit('error', er))
    }

    if (bytesRead > remain) {
      const er = new Error('did not encounter expected EOF');
      er.path = this.absolute;
      er.syscall = 'read';
      er.code = 'EOF';
      return this[CLOSE](fd, () => this.emit('error', er))
    }

    // null out the rest of the buffer, if we could fit the block padding
    if (bytesRead === remain) {
      for (let i = bytesRead; i < length && bytesRead < blockRemain; i++) {
        buf[i + offset] = 0;
        bytesRead++;
        remain++;
      }
    }

    const writeBuf = offset === 0 && bytesRead === buf.length ?
      buf : buf.slice(offset, offset + bytesRead);
    remain -= bytesRead;
    blockRemain -= bytesRead;
    pos += bytesRead;
    offset += bytesRead;

    this.write(writeBuf);

    if (!remain) {
      if (blockRemain)
        this.write(Buffer.alloc(blockRemain));
      return this[CLOSE](fd, er => er ? this.emit('error', er) : this.end())
    }

    if (offset >= length) {
      buf = Buffer.allocUnsafe(length);
      offset = 0;
    }
    length = buf.length - offset;
    this[READ](fd, buf, offset, length, pos, remain, blockRemain);
  }
});

class WriteEntrySync$1 extends WriteEntry$1 {
  [LSTAT] () {
    this[ONLSTAT](fs$h.lstatSync(this.absolute));
  }

  [SYMLINK$1] () {
    this[ONREADLINK](fs$h.readlinkSync(this.absolute));
  }

  [OPENFILE] () {
    this[ONOPENFILE](fs$h.openSync(this.absolute, 'r'));
  }

  [READ] (fd, buf, offset, length, pos, remain, blockRemain) {
    let threw = true;
    try {
      const bytesRead = fs$h.readSync(fd, buf, offset, length, pos);
      this[ONREAD](fd, buf, offset, length, pos, remain, blockRemain, bytesRead);
      threw = false;
    } finally {
      // ignoring the error from close(2) is a bad practice, but at
      // this point we already have an error, don't need another one
      if (threw) {
        try {
          this[CLOSE](fd, () => {});
        } catch (er) {}
      }
    }
  }

  [CLOSE] (fd, cb) {
    fs$h.closeSync(fd);
    cb();
  }
}

const WriteEntryTar$1 = warner$2(class WriteEntryTar extends MiniPass$2 {
  constructor (readEntry, opt) {
    opt = opt || {};
    super(opt);
    this.preservePaths = !!opt.preservePaths;
    this.portable = !!opt.portable;
    this.strict = !!opt.strict;
    this.noPax = !!opt.noPax;
    this.noMtime = !!opt.noMtime;

    this.readEntry = readEntry;
    this.type = readEntry.type;
    if (this.type === 'Directory' && this.portable)
      this.noMtime = true;

    this.path = readEntry.path;
    this.mode = this[MODE](readEntry.mode);
    this.uid = this.portable ? null : readEntry.uid;
    this.gid = this.portable ? null : readEntry.gid;
    this.uname = this.portable ? null : readEntry.uname;
    this.gname = this.portable ? null : readEntry.gname;
    this.size = readEntry.size;
    this.mtime = this.noMtime ? null : opt.mtime || readEntry.mtime;
    this.atime = this.portable ? null : readEntry.atime;
    this.ctime = this.portable ? null : readEntry.ctime;
    this.linkpath = readEntry.linkpath;

    if (typeof opt.onwarn === 'function')
      this.on('warn', opt.onwarn);

    let pathWarn = false;
    if (path$d.isAbsolute(this.path) && !this.preservePaths) {
      const parsed = path$d.parse(this.path);
      pathWarn = parsed.root;
      this.path = this.path.substr(parsed.root.length);
    }

    this.remain = readEntry.size;
    this.blockRemain = readEntry.startBlockSize;

    this.header = new Header$2({
      path: this.path,
      linkpath: this.linkpath,
      // only the permissions and setuid/setgid/sticky bitflags
      // not the higher-order bits that specify file type
      mode: this.mode,
      uid: this.portable ? null : this.uid,
      gid: this.portable ? null : this.gid,
      size: this.size,
      mtime: this.noMtime ? null : this.mtime,
      type: this.type,
      uname: this.portable ? null : this.uname,
      atime: this.portable ? null : this.atime,
      ctime: this.portable ? null : this.ctime,
    });

    if (pathWarn) {
      this.warn('TAR_ENTRY_INFO', `stripping ${pathWarn} from absolute path`, {
        entry: this,
        path: pathWarn + this.path,
      });
    }

    if (this.header.encode() && !this.noPax) {
      super.write(new Pax$1({
        atime: this.portable ? null : this.atime,
        ctime: this.portable ? null : this.ctime,
        gid: this.portable ? null : this.gid,
        mtime: this.noMtime ? null : this.mtime,
        path: this.path,
        linkpath: this.linkpath,
        size: this.size,
        uid: this.portable ? null : this.uid,
        uname: this.portable ? null : this.uname,
        dev: this.portable ? null : this.readEntry.dev,
        ino: this.portable ? null : this.readEntry.ino,
        nlink: this.portable ? null : this.readEntry.nlink,
      }).encode());
    }

    super.write(this.header.block);
    readEntry.pipe(this);
  }

  [MODE] (mode) {
    return modeFix(mode, this.type === 'Directory', this.portable)
  }

  write (data) {
    const writeLen = data.length;
    if (writeLen > this.blockRemain)
      throw new Error('writing more to entry than is appropriate')
    this.blockRemain -= writeLen;
    return super.write(data)
  }

  end () {
    if (this.blockRemain)
      this.write(Buffer.alloc(this.blockRemain));
    return super.end()
  }
});

WriteEntry$1.Sync = WriteEntrySync$1;
WriteEntry$1.Tar = WriteEntryTar$1;

const getType = stat =>
  stat.isFile() ? 'File'
  : stat.isDirectory() ? 'Directory'
  : stat.isSymbolicLink() ? 'SymbolicLink'
  : 'Unsupported';

var writeEntry = WriteEntry$1;

// A readable tar stream creator
// Technically, this is a transform stream that you write paths into,
// and tar format comes out of.
// The `add()` method is like `write()` but returns this,
// and end() return `this` as well, so you can
// do `new Pack(opt).add('files').add('dir').end().pipe(output)
// You could also do something like:
// streamOfPaths().pipe(new Pack()).pipe(new fs.WriteStream('out.tar'))

class PackJob {
  constructor (path, absolute) {
    this.path = path || './';
    this.absolute = absolute;
    this.entry = null;
    this.stat = null;
    this.readdir = null;
    this.pending = false;
    this.ignore = false;
    this.piped = false;
  }
}

const MiniPass$1 = minipass;
const zlib$1 = minizlib;
const ReadEntry = readEntry;
const WriteEntry = writeEntry;
const WriteEntrySync = WriteEntry.Sync;
const WriteEntryTar = WriteEntry.Tar;
const Yallist$1 = yallist;
const EOF = Buffer.alloc(1024);
const ONSTAT = Symbol('onStat');
const ENDED$2 = Symbol('ended');
const QUEUE$1 = Symbol('queue');
const CURRENT = Symbol('current');
const PROCESS = Symbol('process');
const PROCESSING = Symbol('processing');
const PROCESSJOB = Symbol('processJob');
const JOBS = Symbol('jobs');
const JOBDONE = Symbol('jobDone');
const ADDFSENTRY = Symbol('addFSEntry');
const ADDTARENTRY = Symbol('addTarEntry');
const STAT = Symbol('stat');
const READDIR = Symbol('readdir');
const ONREADDIR = Symbol('onreaddir');
const PIPE = Symbol('pipe');
const ENTRY = Symbol('entry');
const ENTRYOPT = Symbol('entryOpt');
const WRITEENTRYCLASS = Symbol('writeEntryClass');
const WRITE = Symbol('write');
const ONDRAIN = Symbol('ondrain');

const fs$g = require$$0$3;
const path$c = require$$1$2;
const warner$1 = warnMixin;

const Pack$2 = warner$1(class Pack extends MiniPass$1 {
  constructor (opt) {
    super(opt);
    opt = opt || Object.create(null);
    this.opt = opt;
    this.file = opt.file || '';
    this.cwd = opt.cwd || process.cwd();
    this.maxReadSize = opt.maxReadSize;
    this.preservePaths = !!opt.preservePaths;
    this.strict = !!opt.strict;
    this.noPax = !!opt.noPax;
    this.prefix = (opt.prefix || '').replace(/(\\|\/)+$/, '');
    this.linkCache = opt.linkCache || new Map();
    this.statCache = opt.statCache || new Map();
    this.readdirCache = opt.readdirCache || new Map();

    this[WRITEENTRYCLASS] = WriteEntry;
    if (typeof opt.onwarn === 'function')
      this.on('warn', opt.onwarn);

    this.portable = !!opt.portable;
    this.zip = null;
    if (opt.gzip) {
      if (typeof opt.gzip !== 'object')
        opt.gzip = {};
      if (this.portable)
        opt.gzip.portable = true;
      this.zip = new zlib$1.Gzip(opt.gzip);
      this.zip.on('data', chunk => super.write(chunk));
      this.zip.on('end', _ => super.end());
      this.zip.on('drain', _ => this[ONDRAIN]());
      this.on('resume', _ => this.zip.resume());
    } else
      this.on('drain', this[ONDRAIN]);

    this.noDirRecurse = !!opt.noDirRecurse;
    this.follow = !!opt.follow;
    this.noMtime = !!opt.noMtime;
    this.mtime = opt.mtime || null;

    this.filter = typeof opt.filter === 'function' ? opt.filter : _ => true;

    this[QUEUE$1] = new Yallist$1();
    this[JOBS] = 0;
    this.jobs = +opt.jobs || 4;
    this[PROCESSING] = false;
    this[ENDED$2] = false;
  }

  [WRITE] (chunk) {
    return super.write(chunk)
  }

  add (path) {
    this.write(path);
    return this
  }

  end (path) {
    if (path)
      this.write(path);
    this[ENDED$2] = true;
    this[PROCESS]();
    return this
  }

  write (path) {
    if (this[ENDED$2])
      throw new Error('write after end')

    if (path instanceof ReadEntry)
      this[ADDTARENTRY](path);
    else
      this[ADDFSENTRY](path);
    return this.flowing
  }

  [ADDTARENTRY] (p) {
    const absolute = path$c.resolve(this.cwd, p.path);
    if (this.prefix)
      p.path = this.prefix + '/' + p.path.replace(/^\.(\/+|$)/, '');

    // in this case, we don't have to wait for the stat
    if (!this.filter(p.path, p))
      p.resume();
    else {
      const job = new PackJob(p.path, absolute, false);
      job.entry = new WriteEntryTar(p, this[ENTRYOPT](job));
      job.entry.on('end', _ => this[JOBDONE](job));
      this[JOBS] += 1;
      this[QUEUE$1].push(job);
    }

    this[PROCESS]();
  }

  [ADDFSENTRY] (p) {
    const absolute = path$c.resolve(this.cwd, p);
    if (this.prefix)
      p = this.prefix + '/' + p.replace(/^\.(\/+|$)/, '');

    this[QUEUE$1].push(new PackJob(p, absolute));
    this[PROCESS]();
  }

  [STAT] (job) {
    job.pending = true;
    this[JOBS] += 1;
    const stat = this.follow ? 'stat' : 'lstat';
    fs$g[stat](job.absolute, (er, stat) => {
      job.pending = false;
      this[JOBS] -= 1;
      if (er)
        this.emit('error', er);
      else
        this[ONSTAT](job, stat);
    });
  }

  [ONSTAT] (job, stat) {
    this.statCache.set(job.absolute, stat);
    job.stat = stat;

    // now we have the stat, we can filter it.
    if (!this.filter(job.path, stat))
      job.ignore = true;

    this[PROCESS]();
  }

  [READDIR] (job) {
    job.pending = true;
    this[JOBS] += 1;
    fs$g.readdir(job.absolute, (er, entries) => {
      job.pending = false;
      this[JOBS] -= 1;
      if (er)
        return this.emit('error', er)
      this[ONREADDIR](job, entries);
    });
  }

  [ONREADDIR] (job, entries) {
    this.readdirCache.set(job.absolute, entries);
    job.readdir = entries;
    this[PROCESS]();
  }

  [PROCESS] () {
    if (this[PROCESSING])
      return

    this[PROCESSING] = true;
    for (let w = this[QUEUE$1].head;
      w !== null && this[JOBS] < this.jobs;
      w = w.next) {
      this[PROCESSJOB](w.value);
      if (w.value.ignore) {
        const p = w.next;
        this[QUEUE$1].removeNode(w);
        w.next = p;
      }
    }

    this[PROCESSING] = false;

    if (this[ENDED$2] && !this[QUEUE$1].length && this[JOBS] === 0) {
      if (this.zip)
        this.zip.end(EOF);
      else {
        super.write(EOF);
        super.end();
      }
    }
  }

  get [CURRENT] () {
    return this[QUEUE$1] && this[QUEUE$1].head && this[QUEUE$1].head.value
  }

  [JOBDONE] (job) {
    this[QUEUE$1].shift();
    this[JOBS] -= 1;
    this[PROCESS]();
  }

  [PROCESSJOB] (job) {
    if (job.pending)
      return

    if (job.entry) {
      if (job === this[CURRENT] && !job.piped)
        this[PIPE](job);
      return
    }

    if (!job.stat) {
      if (this.statCache.has(job.absolute))
        this[ONSTAT](job, this.statCache.get(job.absolute));
      else
        this[STAT](job);
    }
    if (!job.stat)
      return

    // filtered out!
    if (job.ignore)
      return

    if (!this.noDirRecurse && job.stat.isDirectory() && !job.readdir) {
      if (this.readdirCache.has(job.absolute))
        this[ONREADDIR](job, this.readdirCache.get(job.absolute));
      else
        this[READDIR](job);
      if (!job.readdir)
        return
    }

    // we know it doesn't have an entry, because that got checked above
    job.entry = this[ENTRY](job);
    if (!job.entry) {
      job.ignore = true;
      return
    }

    if (job === this[CURRENT] && !job.piped)
      this[PIPE](job);
  }

  [ENTRYOPT] (job) {
    return {
      onwarn: (code, msg, data) => this.warn(code, msg, data),
      noPax: this.noPax,
      cwd: this.cwd,
      absolute: job.absolute,
      preservePaths: this.preservePaths,
      maxReadSize: this.maxReadSize,
      strict: this.strict,
      portable: this.portable,
      linkCache: this.linkCache,
      statCache: this.statCache,
      noMtime: this.noMtime,
      mtime: this.mtime,
    }
  }

  [ENTRY] (job) {
    this[JOBS] += 1;
    try {
      return new this[WRITEENTRYCLASS](job.path, this[ENTRYOPT](job))
        .on('end', () => this[JOBDONE](job))
        .on('error', er => this.emit('error', er))
    } catch (er) {
      this.emit('error', er);
    }
  }

  [ONDRAIN] () {
    if (this[CURRENT] && this[CURRENT].entry)
      this[CURRENT].entry.resume();
  }

  // like .pipe() but using super, because our write() is special
  [PIPE] (job) {
    job.piped = true;

    if (job.readdir) {
      job.readdir.forEach(entry => {
        const p = this.prefix ?
          job.path.slice(this.prefix.length + 1) || './'
          : job.path;

        const base = p === './' ? '' : p.replace(/\/*$/, '/');
        this[ADDFSENTRY](base + entry);
      });
    }

    const source = job.entry;
    const zip = this.zip;

    if (zip) {
      source.on('data', chunk => {
        if (!zip.write(chunk))
          source.pause();
      });
    } else {
      source.on('data', chunk => {
        if (!super.write(chunk))
          source.pause();
      });
    }
  }

  pause () {
    if (this.zip)
      this.zip.pause();
    return super.pause()
  }
});

class PackSync extends Pack$2 {
  constructor (opt) {
    super(opt);
    this[WRITEENTRYCLASS] = WriteEntrySync;
  }

  // pause/resume are no-ops in sync streams.
  pause () {}
  resume () {}

  [STAT] (job) {
    const stat = this.follow ? 'statSync' : 'lstatSync';
    this[ONSTAT](job, fs$g[stat](job.absolute));
  }

  [READDIR] (job, stat) {
    this[ONREADDIR](job, fs$g.readdirSync(job.absolute));
  }

  // gotta get it all in this tick
  [PIPE] (job) {
    const source = job.entry;
    const zip = this.zip;

    if (job.readdir) {
      job.readdir.forEach(entry => {
        const p = this.prefix ?
          job.path.slice(this.prefix.length + 1) || './'
          : job.path;

        const base = p === './' ? '' : p.replace(/\/*$/, '/');
        this[ADDFSENTRY](base + entry);
      });
    }

    if (zip) {
      source.on('data', chunk => {
        zip.write(chunk);
      });
    } else {
      source.on('data', chunk => {
        super[WRITE](chunk);
      });
    }
  }
}

Pack$2.Sync = PackSync;

var pack = Pack$2;

var fsMinipass = {};

const MiniPass = minipass;
const EE$1 = require$$0.EventEmitter;
const fs$f = require$$0$3;

let writev = fs$f.writev;
/* istanbul ignore next */
if (!writev) {
  // This entire block can be removed if support for earlier than Node.js
  // 12.9.0 is not needed.
  const binding = process.binding('fs');
  const FSReqWrap = binding.FSReqWrap || binding.FSReqCallback;

  writev = (fd, iovec, pos, cb) => {
    const done = (er, bw) => cb(er, bw, iovec);
    const req = new FSReqWrap();
    req.oncomplete = done;
    binding.writeBuffers(fd, iovec, pos, req);
  };
}

const _autoClose = Symbol('_autoClose');
const _close = Symbol('_close');
const _ended = Symbol('_ended');
const _fd = Symbol('_fd');
const _finished = Symbol('_finished');
const _flags = Symbol('_flags');
const _flush = Symbol('_flush');
const _handleChunk = Symbol('_handleChunk');
const _makeBuf = Symbol('_makeBuf');
const _mode = Symbol('_mode');
const _needDrain = Symbol('_needDrain');
const _onerror = Symbol('_onerror');
const _onopen = Symbol('_onopen');
const _onread = Symbol('_onread');
const _onwrite = Symbol('_onwrite');
const _open = Symbol('_open');
const _path = Symbol('_path');
const _pos = Symbol('_pos');
const _queue = Symbol('_queue');
const _read = Symbol('_read');
const _readSize = Symbol('_readSize');
const _reading = Symbol('_reading');
const _remain = Symbol('_remain');
const _size = Symbol('_size');
const _write = Symbol('_write');
const _writing = Symbol('_writing');
const _defaultFlag = Symbol('_defaultFlag');
const _errored = Symbol('_errored');

class ReadStream extends MiniPass {
  constructor (path, opt) {
    opt = opt || {};
    super(opt);

    this.readable = true;
    this.writable = false;

    if (typeof path !== 'string')
      throw new TypeError('path must be a string')

    this[_errored] = false;
    this[_fd] = typeof opt.fd === 'number' ? opt.fd : null;
    this[_path] = path;
    this[_readSize] = opt.readSize || 16*1024*1024;
    this[_reading] = false;
    this[_size] = typeof opt.size === 'number' ? opt.size : Infinity;
    this[_remain] = this[_size];
    this[_autoClose] = typeof opt.autoClose === 'boolean' ?
      opt.autoClose : true;

    if (typeof this[_fd] === 'number')
      this[_read]();
    else
      this[_open]();
  }

  get fd () { return this[_fd] }
  get path () { return this[_path] }

  write () {
    throw new TypeError('this is a readable stream')
  }

  end () {
    throw new TypeError('this is a readable stream')
  }

  [_open] () {
    fs$f.open(this[_path], 'r', (er, fd) => this[_onopen](er, fd));
  }

  [_onopen] (er, fd) {
    if (er)
      this[_onerror](er);
    else {
      this[_fd] = fd;
      this.emit('open', fd);
      this[_read]();
    }
  }

  [_makeBuf] () {
    return Buffer.allocUnsafe(Math.min(this[_readSize], this[_remain]))
  }

  [_read] () {
    if (!this[_reading]) {
      this[_reading] = true;
      const buf = this[_makeBuf]();
      /* istanbul ignore if */
      if (buf.length === 0)
        return process.nextTick(() => this[_onread](null, 0, buf))
      fs$f.read(this[_fd], buf, 0, buf.length, null, (er, br, buf) =>
        this[_onread](er, br, buf));
    }
  }

  [_onread] (er, br, buf) {
    this[_reading] = false;
    if (er)
      this[_onerror](er);
    else if (this[_handleChunk](br, buf))
      this[_read]();
  }

  [_close] () {
    if (this[_autoClose] && typeof this[_fd] === 'number') {
      const fd = this[_fd];
      this[_fd] = null;
      fs$f.close(fd, er => er ? this.emit('error', er) : this.emit('close'));
    }
  }

  [_onerror] (er) {
    this[_reading] = true;
    this[_close]();
    this.emit('error', er);
  }

  [_handleChunk] (br, buf) {
    let ret = false;
    // no effect if infinite
    this[_remain] -= br;
    if (br > 0)
      ret = super.write(br < buf.length ? buf.slice(0, br) : buf);

    if (br === 0 || this[_remain] <= 0) {
      ret = false;
      this[_close]();
      super.end();
    }

    return ret
  }

  emit (ev, data) {
    switch (ev) {
      case 'prefinish':
      case 'finish':
        break

      case 'drain':
        if (typeof this[_fd] === 'number')
          this[_read]();
        break

      case 'error':
        if (this[_errored])
          return
        this[_errored] = true;
        return super.emit(ev, data)

      default:
        return super.emit(ev, data)
    }
  }
}

class ReadStreamSync extends ReadStream {
  [_open] () {
    let threw = true;
    try {
      this[_onopen](null, fs$f.openSync(this[_path], 'r'));
      threw = false;
    } finally {
      if (threw)
        this[_close]();
    }
  }

  [_read] () {
    let threw = true;
    try {
      if (!this[_reading]) {
        this[_reading] = true;
        do {
          const buf = this[_makeBuf]();
          /* istanbul ignore next */
          const br = buf.length === 0 ? 0
            : fs$f.readSync(this[_fd], buf, 0, buf.length, null);
          if (!this[_handleChunk](br, buf))
            break
        } while (true)
        this[_reading] = false;
      }
      threw = false;
    } finally {
      if (threw)
        this[_close]();
    }
  }

  [_close] () {
    if (this[_autoClose] && typeof this[_fd] === 'number') {
      const fd = this[_fd];
      this[_fd] = null;
      fs$f.closeSync(fd);
      this.emit('close');
    }
  }
}

class WriteStream extends EE$1 {
  constructor (path, opt) {
    opt = opt || {};
    super(opt);
    this.readable = false;
    this.writable = true;
    this[_errored] = false;
    this[_writing] = false;
    this[_ended] = false;
    this[_needDrain] = false;
    this[_queue] = [];
    this[_path] = path;
    this[_fd] = typeof opt.fd === 'number' ? opt.fd : null;
    this[_mode] = opt.mode === undefined ? 0o666 : opt.mode;
    this[_pos] = typeof opt.start === 'number' ? opt.start : null;
    this[_autoClose] = typeof opt.autoClose === 'boolean' ?
      opt.autoClose : true;

    // truncating makes no sense when writing into the middle
    const defaultFlag = this[_pos] !== null ? 'r+' : 'w';
    this[_defaultFlag] = opt.flags === undefined;
    this[_flags] = this[_defaultFlag] ? defaultFlag : opt.flags;

    if (this[_fd] === null)
      this[_open]();
  }

  emit (ev, data) {
    if (ev === 'error') {
      if (this[_errored])
        return
      this[_errored] = true;
    }
    return super.emit(ev, data)
  }


  get fd () { return this[_fd] }
  get path () { return this[_path] }

  [_onerror] (er) {
    this[_close]();
    this[_writing] = true;
    this.emit('error', er);
  }

  [_open] () {
    fs$f.open(this[_path], this[_flags], this[_mode],
      (er, fd) => this[_onopen](er, fd));
  }

  [_onopen] (er, fd) {
    if (this[_defaultFlag] &&
        this[_flags] === 'r+' &&
        er && er.code === 'ENOENT') {
      this[_flags] = 'w';
      this[_open]();
    } else if (er)
      this[_onerror](er);
    else {
      this[_fd] = fd;
      this.emit('open', fd);
      this[_flush]();
    }
  }

  end (buf, enc) {
    if (buf)
      this.write(buf, enc);

    this[_ended] = true;

    // synthetic after-write logic, where drain/finish live
    if (!this[_writing] && !this[_queue].length &&
        typeof this[_fd] === 'number')
      this[_onwrite](null, 0);
    return this
  }

  write (buf, enc) {
    if (typeof buf === 'string')
      buf = Buffer.from(buf, enc);

    if (this[_ended]) {
      this.emit('error', new Error('write() after end()'));
      return false
    }

    if (this[_fd] === null || this[_writing] || this[_queue].length) {
      this[_queue].push(buf);
      this[_needDrain] = true;
      return false
    }

    this[_writing] = true;
    this[_write](buf);
    return true
  }

  [_write] (buf) {
    fs$f.write(this[_fd], buf, 0, buf.length, this[_pos], (er, bw) =>
      this[_onwrite](er, bw));
  }

  [_onwrite] (er, bw) {
    if (er)
      this[_onerror](er);
    else {
      if (this[_pos] !== null)
        this[_pos] += bw;
      if (this[_queue].length)
        this[_flush]();
      else {
        this[_writing] = false;

        if (this[_ended] && !this[_finished]) {
          this[_finished] = true;
          this[_close]();
          this.emit('finish');
        } else if (this[_needDrain]) {
          this[_needDrain] = false;
          this.emit('drain');
        }
      }
    }
  }

  [_flush] () {
    if (this[_queue].length === 0) {
      if (this[_ended])
        this[_onwrite](null, 0);
    } else if (this[_queue].length === 1)
      this[_write](this[_queue].pop());
    else {
      const iovec = this[_queue];
      this[_queue] = [];
      writev(this[_fd], iovec, this[_pos],
        (er, bw) => this[_onwrite](er, bw));
    }
  }

  [_close] () {
    if (this[_autoClose] && typeof this[_fd] === 'number') {
      const fd = this[_fd];
      this[_fd] = null;
      fs$f.close(fd, er => er ? this.emit('error', er) : this.emit('close'));
    }
  }
}

class WriteStreamSync extends WriteStream {
  [_open] () {
    let fd;
    // only wrap in a try{} block if we know we'll retry, to avoid
    // the rethrow obscuring the error's source frame in most cases.
    if (this[_defaultFlag] && this[_flags] === 'r+') {
      try {
        fd = fs$f.openSync(this[_path], this[_flags], this[_mode]);
      } catch (er) {
        if (er.code === 'ENOENT') {
          this[_flags] = 'w';
          return this[_open]()
        } else
          throw er
      }
    } else
      fd = fs$f.openSync(this[_path], this[_flags], this[_mode]);

    this[_onopen](null, fd);
  }

  [_close] () {
    if (this[_autoClose] && typeof this[_fd] === 'number') {
      const fd = this[_fd];
      this[_fd] = null;
      fs$f.closeSync(fd);
      this.emit('close');
    }
  }

  [_write] (buf) {
    // throw the original, but try to close if it fails
    let threw = true;
    try {
      this[_onwrite](null,
        fs$f.writeSync(this[_fd], buf, 0, buf.length, this[_pos]));
      threw = false;
    } finally {
      if (threw)
        try { this[_close](); } catch (_) {}
    }
  }
}

fsMinipass.ReadStream = ReadStream;
fsMinipass.ReadStreamSync = ReadStreamSync;

fsMinipass.WriteStream = WriteStream;
fsMinipass.WriteStreamSync = WriteStreamSync;

// this[BUFFER] is the remainder of a chunk if we're waiting for
// the full 512 bytes of a header to come in.  We will Buffer.concat()
// it to the next write(), which is a mem copy, but a small one.
//
// this[QUEUE] is a Yallist of entries that haven't been emitted
// yet this can only get filled up if the user keeps write()ing after
// a write() returns false, or does a write() with more than one entry
//
// We don't buffer chunks, we always parse them and either create an
// entry, or push it into the active entry.  The ReadEntry class knows
// to throw data away if .ignore=true
//
// Shift entry off the buffer when it emits 'end', and emit 'entry' for
// the next one in the list.
//
// At any time, we're pushing body chunks into the entry at WRITEENTRY,
// and waiting for 'end' on the entry at READENTRY
//
// ignored entries get .resume() called on them straight away

const warner = warnMixin;
const Header$1 = header;
const EE = require$$0;
const Yallist = yallist;
const maxMetaEntrySize = 1024 * 1024;
const Entry = readEntry;
const Pax = pax;
const zlib = minizlib;

const gzipHeader = Buffer.from([0x1f, 0x8b]);
const STATE = Symbol('state');
const WRITEENTRY = Symbol('writeEntry');
const READENTRY = Symbol('readEntry');
const NEXTENTRY = Symbol('nextEntry');
const PROCESSENTRY = Symbol('processEntry');
const EX = Symbol('extendedHeader');
const GEX = Symbol('globalExtendedHeader');
const META = Symbol('meta');
const EMITMETA = Symbol('emitMeta');
const BUFFER = Symbol('buffer');
const QUEUE = Symbol('queue');
const ENDED$1 = Symbol('ended');
const EMITTEDEND = Symbol('emittedEnd');
const EMIT = Symbol('emit');
const UNZIP = Symbol('unzip');
const CONSUMECHUNK = Symbol('consumeChunk');
const CONSUMECHUNKSUB = Symbol('consumeChunkSub');
const CONSUMEBODY = Symbol('consumeBody');
const CONSUMEMETA = Symbol('consumeMeta');
const CONSUMEHEADER = Symbol('consumeHeader');
const CONSUMING = Symbol('consuming');
const BUFFERCONCAT = Symbol('bufferConcat');
const MAYBEEND = Symbol('maybeEnd');
const WRITING = Symbol('writing');
const ABORTED = Symbol('aborted');
const DONE = Symbol('onDone');
const SAW_VALID_ENTRY = Symbol('sawValidEntry');
const SAW_NULL_BLOCK = Symbol('sawNullBlock');
const SAW_EOF = Symbol('sawEOF');

const noop$1 = _ => true;

var parse$2 = warner(class Parser extends EE {
  constructor (opt) {
    opt = opt || {};
    super(opt);

    this.file = opt.file || '';

    // set to boolean false when an entry starts.  1024 bytes of \0
    // is technically a valid tarball, albeit a boring one.
    this[SAW_VALID_ENTRY] = null;

    // these BADARCHIVE errors can't be detected early. listen on DONE.
    this.on(DONE, _ => {
      if (this[STATE] === 'begin' || this[SAW_VALID_ENTRY] === false) {
        // either less than 1 block of data, or all entries were invalid.
        // Either way, probably not even a tarball.
        this.warn('TAR_BAD_ARCHIVE', 'Unrecognized archive format');
      }
    });

    if (opt.ondone)
      this.on(DONE, opt.ondone);
    else {
      this.on(DONE, _ => {
        this.emit('prefinish');
        this.emit('finish');
        this.emit('end');
        this.emit('close');
      });
    }

    this.strict = !!opt.strict;
    this.maxMetaEntrySize = opt.maxMetaEntrySize || maxMetaEntrySize;
    this.filter = typeof opt.filter === 'function' ? opt.filter : noop$1;

    // have to set this so that streams are ok piping into it
    this.writable = true;
    this.readable = false;

    this[QUEUE] = new Yallist();
    this[BUFFER] = null;
    this[READENTRY] = null;
    this[WRITEENTRY] = null;
    this[STATE] = 'begin';
    this[META] = '';
    this[EX] = null;
    this[GEX] = null;
    this[ENDED$1] = false;
    this[UNZIP] = null;
    this[ABORTED] = false;
    this[SAW_NULL_BLOCK] = false;
    this[SAW_EOF] = false;
    if (typeof opt.onwarn === 'function')
      this.on('warn', opt.onwarn);
    if (typeof opt.onentry === 'function')
      this.on('entry', opt.onentry);
  }

  [CONSUMEHEADER] (chunk, position) {
    if (this[SAW_VALID_ENTRY] === null)
      this[SAW_VALID_ENTRY] = false;
    let header;
    try {
      header = new Header$1(chunk, position, this[EX], this[GEX]);
    } catch (er) {
      return this.warn('TAR_ENTRY_INVALID', er)
    }

    if (header.nullBlock) {
      if (this[SAW_NULL_BLOCK]) {
        this[SAW_EOF] = true;
        // ending an archive with no entries.  pointless, but legal.
        if (this[STATE] === 'begin')
          this[STATE] = 'header';
        this[EMIT]('eof');
      } else {
        this[SAW_NULL_BLOCK] = true;
        this[EMIT]('nullBlock');
      }
    } else {
      this[SAW_NULL_BLOCK] = false;
      if (!header.cksumValid)
        this.warn('TAR_ENTRY_INVALID', 'checksum failure', {header});
      else if (!header.path)
        this.warn('TAR_ENTRY_INVALID', 'path is required', {header});
      else {
        const type = header.type;
        if (/^(Symbolic)?Link$/.test(type) && !header.linkpath)
          this.warn('TAR_ENTRY_INVALID', 'linkpath required', {header});
        else if (!/^(Symbolic)?Link$/.test(type) && header.linkpath)
          this.warn('TAR_ENTRY_INVALID', 'linkpath forbidden', {header});
        else {
          const entry = this[WRITEENTRY] = new Entry(header, this[EX], this[GEX]);

          // we do this for meta & ignored entries as well, because they
          // are still valid tar, or else we wouldn't know to ignore them
          if (!this[SAW_VALID_ENTRY]) {
            if (entry.remain) {
              // this might be the one!
              const onend = () => {
                if (!entry.invalid)
                  this[SAW_VALID_ENTRY] = true;
              };
              entry.on('end', onend);
            } else
              this[SAW_VALID_ENTRY] = true;
          }

          if (entry.meta) {
            if (entry.size > this.maxMetaEntrySize) {
              entry.ignore = true;
              this[EMIT]('ignoredEntry', entry);
              this[STATE] = 'ignore';
              entry.resume();
            } else if (entry.size > 0) {
              this[META] = '';
              entry.on('data', c => this[META] += c);
              this[STATE] = 'meta';
            }
          } else {
            this[EX] = null;
            entry.ignore = entry.ignore || !this.filter(entry.path, entry);

            if (entry.ignore) {
              // probably valid, just not something we care about
              this[EMIT]('ignoredEntry', entry);
              this[STATE] = entry.remain ? 'ignore' : 'header';
              entry.resume();
            } else {
              if (entry.remain)
                this[STATE] = 'body';
              else {
                this[STATE] = 'header';
                entry.end();
              }

              if (!this[READENTRY]) {
                this[QUEUE].push(entry);
                this[NEXTENTRY]();
              } else
                this[QUEUE].push(entry);
            }
          }
        }
      }
    }
  }

  [PROCESSENTRY] (entry) {
    let go = true;

    if (!entry) {
      this[READENTRY] = null;
      go = false;
    } else if (Array.isArray(entry))
      this.emit.apply(this, entry);
    else {
      this[READENTRY] = entry;
      this.emit('entry', entry);
      if (!entry.emittedEnd) {
        entry.on('end', _ => this[NEXTENTRY]());
        go = false;
      }
    }

    return go
  }

  [NEXTENTRY] () {
    do {} while (this[PROCESSENTRY](this[QUEUE].shift()))

    if (!this[QUEUE].length) {
      // At this point, there's nothing in the queue, but we may have an
      // entry which is being consumed (readEntry).
      // If we don't, then we definitely can handle more data.
      // If we do, and either it's flowing, or it has never had any data
      // written to it, then it needs more.
      // The only other possibility is that it has returned false from a
      // write() call, so we wait for the next drain to continue.
      const re = this[READENTRY];
      const drainNow = !re || re.flowing || re.size === re.remain;
      if (drainNow) {
        if (!this[WRITING])
          this.emit('drain');
      } else
        re.once('drain', _ => this.emit('drain'));
    }
  }

  [CONSUMEBODY] (chunk, position) {
    // write up to but no  more than writeEntry.blockRemain
    const entry = this[WRITEENTRY];
    const br = entry.blockRemain;
    const c = (br >= chunk.length && position === 0) ? chunk
      : chunk.slice(position, position + br);

    entry.write(c);

    if (!entry.blockRemain) {
      this[STATE] = 'header';
      this[WRITEENTRY] = null;
      entry.end();
    }

    return c.length
  }

  [CONSUMEMETA] (chunk, position) {
    const entry = this[WRITEENTRY];
    const ret = this[CONSUMEBODY](chunk, position);

    // if we finished, then the entry is reset
    if (!this[WRITEENTRY])
      this[EMITMETA](entry);

    return ret
  }

  [EMIT] (ev, data, extra) {
    if (!this[QUEUE].length && !this[READENTRY])
      this.emit(ev, data, extra);
    else
      this[QUEUE].push([ev, data, extra]);
  }

  [EMITMETA] (entry) {
    this[EMIT]('meta', this[META]);
    switch (entry.type) {
      case 'ExtendedHeader':
      case 'OldExtendedHeader':
        this[EX] = Pax.parse(this[META], this[EX], false);
        break

      case 'GlobalExtendedHeader':
        this[GEX] = Pax.parse(this[META], this[GEX], true);
        break

      case 'NextFileHasLongPath':
      case 'OldGnuLongPath':
        this[EX] = this[EX] || Object.create(null);
        this[EX].path = this[META].replace(/\0.*/, '');
        break

      case 'NextFileHasLongLinkpath':
        this[EX] = this[EX] || Object.create(null);
        this[EX].linkpath = this[META].replace(/\0.*/, '');
        break

      /* istanbul ignore next */
      default: throw new Error('unknown meta: ' + entry.type)
    }
  }

  abort (error) {
    this[ABORTED] = true;
    this.emit('abort', error);
    // always throws, even in non-strict mode
    this.warn('TAR_ABORT', error, { recoverable: false });
  }

  write (chunk) {
    if (this[ABORTED])
      return

    // first write, might be gzipped
    if (this[UNZIP] === null && chunk) {
      if (this[BUFFER]) {
        chunk = Buffer.concat([this[BUFFER], chunk]);
        this[BUFFER] = null;
      }
      if (chunk.length < gzipHeader.length) {
        this[BUFFER] = chunk;
        return true
      }
      for (let i = 0; this[UNZIP] === null && i < gzipHeader.length; i++) {
        if (chunk[i] !== gzipHeader[i])
          this[UNZIP] = false;
      }
      if (this[UNZIP] === null) {
        const ended = this[ENDED$1];
        this[ENDED$1] = false;
        this[UNZIP] = new zlib.Unzip();
        this[UNZIP].on('data', chunk => this[CONSUMECHUNK](chunk));
        this[UNZIP].on('error', er => this.abort(er));
        this[UNZIP].on('end', _ => {
          this[ENDED$1] = true;
          this[CONSUMECHUNK]();
        });
        this[WRITING] = true;
        const ret = this[UNZIP][ended ? 'end' : 'write'](chunk);
        this[WRITING] = false;
        return ret
      }
    }

    this[WRITING] = true;
    if (this[UNZIP])
      this[UNZIP].write(chunk);
    else
      this[CONSUMECHUNK](chunk);
    this[WRITING] = false;

    // return false if there's a queue, or if the current entry isn't flowing
    const ret =
      this[QUEUE].length ? false :
      this[READENTRY] ? this[READENTRY].flowing :
      true;

    // if we have no queue, then that means a clogged READENTRY
    if (!ret && !this[QUEUE].length)
      this[READENTRY].once('drain', _ => this.emit('drain'));

    return ret
  }

  [BUFFERCONCAT] (c) {
    if (c && !this[ABORTED])
      this[BUFFER] = this[BUFFER] ? Buffer.concat([this[BUFFER], c]) : c;
  }

  [MAYBEEND] () {
    if (this[ENDED$1] &&
        !this[EMITTEDEND] &&
        !this[ABORTED] &&
        !this[CONSUMING]) {
      this[EMITTEDEND] = true;
      const entry = this[WRITEENTRY];
      if (entry && entry.blockRemain) {
        // truncated, likely a damaged file
        const have = this[BUFFER] ? this[BUFFER].length : 0;
        this.warn('TAR_BAD_ARCHIVE', `Truncated input (needed ${
          entry.blockRemain} more bytes, only ${have} available)`, {entry});
        if (this[BUFFER])
          entry.write(this[BUFFER]);
        entry.end();
      }
      this[EMIT](DONE);
    }
  }

  [CONSUMECHUNK] (chunk) {
    if (this[CONSUMING])
      this[BUFFERCONCAT](chunk);
    else if (!chunk && !this[BUFFER])
      this[MAYBEEND]();
    else {
      this[CONSUMING] = true;
      if (this[BUFFER]) {
        this[BUFFERCONCAT](chunk);
        const c = this[BUFFER];
        this[BUFFER] = null;
        this[CONSUMECHUNKSUB](c);
      } else
        this[CONSUMECHUNKSUB](chunk);

      while (this[BUFFER] &&
          this[BUFFER].length >= 512 &&
          !this[ABORTED] &&
          !this[SAW_EOF]) {
        const c = this[BUFFER];
        this[BUFFER] = null;
        this[CONSUMECHUNKSUB](c);
      }
      this[CONSUMING] = false;
    }

    if (!this[BUFFER] || this[ENDED$1])
      this[MAYBEEND]();
  }

  [CONSUMECHUNKSUB] (chunk) {
    // we know that we are in CONSUMING mode, so anything written goes into
    // the buffer.  Advance the position and put any remainder in the buffer.
    let position = 0;
    const length = chunk.length;
    while (position + 512 <= length && !this[ABORTED] && !this[SAW_EOF]) {
      switch (this[STATE]) {
        case 'begin':
        case 'header':
          this[CONSUMEHEADER](chunk, position);
          position += 512;
          break

        case 'ignore':
        case 'body':
          position += this[CONSUMEBODY](chunk, position);
          break

        case 'meta':
          position += this[CONSUMEMETA](chunk, position);
          break

        /* istanbul ignore next */
        default:
          throw new Error('invalid state: ' + this[STATE])
      }
    }

    if (position < length) {
      if (this[BUFFER])
        this[BUFFER] = Buffer.concat([chunk.slice(position), this[BUFFER]]);
      else
        this[BUFFER] = chunk.slice(position);
    }
  }

  end (chunk) {
    if (!this[ABORTED]) {
      if (this[UNZIP])
        this[UNZIP].end(chunk);
      else {
        this[ENDED$1] = true;
        this.write(chunk);
      }
    }
  }
});

// XXX: This shares a lot in common with extract.js
// maybe some DRY opportunity here?

// tar -t
const hlo$4 = highLevelOpt;
const Parser$1 = parse$2;
const fs$e = require$$0$3;
const fsm$4 = fsMinipass;
const path$b = require$$1$2;

var list_1 = (opt_, files, cb) => {
  if (typeof opt_ === 'function')
    cb = opt_, files = null, opt_ = {};
  else if (Array.isArray(opt_))
    files = opt_, opt_ = {};

  if (typeof files === 'function')
    cb = files, files = null;

  if (!files)
    files = [];
  else
    files = Array.from(files);

  const opt = hlo$4(opt_);

  if (opt.sync && typeof cb === 'function')
    throw new TypeError('callback not supported for sync tar functions')

  if (!opt.file && typeof cb === 'function')
    throw new TypeError('callback only supported with file option')

  if (files.length)
    filesFilter$1(opt, files);

  if (!opt.noResume)
    onentryFunction(opt);

  return opt.file && opt.sync ? listFileSync(opt)
    : opt.file ? listFile(opt, cb)
    : list(opt)
};

const onentryFunction = opt => {
  const onentry = opt.onentry;
  opt.onentry = onentry ? e => {
    onentry(e);
    e.resume();
  } : e => e.resume();
};

// construct a filter that limits the file entries listed
// include child entries if a dir is included
const filesFilter$1 = (opt, files) => {
  const map = new Map(files.map(f => [f.replace(/\/+$/, ''), true]));
  const filter = opt.filter;

  const mapHas = (file, r) => {
    const root = r || path$b.parse(file).root || '.';
    const ret = file === root ? false
      : map.has(file) ? map.get(file)
      : mapHas(path$b.dirname(file), root);

    map.set(file, ret);
    return ret
  };

  opt.filter = filter
    ? (file, entry) => filter(file, entry) && mapHas(file.replace(/\/+$/, ''))
    : file => mapHas(file.replace(/\/+$/, ''));
};

const listFileSync = opt => {
  const p = list(opt);
  const file = opt.file;
  let threw = true;
  let fd;
  try {
    const stat = fs$e.statSync(file);
    const readSize = opt.maxReadSize || 16 * 1024 * 1024;
    if (stat.size < readSize)
      p.end(fs$e.readFileSync(file));
    else {
      let pos = 0;
      const buf = Buffer.allocUnsafe(readSize);
      fd = fs$e.openSync(file, 'r');
      while (pos < stat.size) {
        const bytesRead = fs$e.readSync(fd, buf, 0, readSize, pos);
        pos += bytesRead;
        p.write(buf.slice(0, bytesRead));
      }
      p.end();
    }
    threw = false;
  } finally {
    if (threw && fd) {
      try {
        fs$e.closeSync(fd);
      } catch (er) {}
    }
  }
};

const listFile = (opt, cb) => {
  const parse = new Parser$1(opt);
  const readSize = opt.maxReadSize || 16 * 1024 * 1024;

  const file = opt.file;
  const p = new Promise((resolve, reject) => {
    parse.on('error', reject);
    parse.on('end', resolve);

    fs$e.stat(file, (er, stat) => {
      if (er)
        reject(er);
      else {
        const stream = new fsm$4.ReadStream(file, {
          readSize: readSize,
          size: stat.size,
        });
        stream.on('error', reject);
        stream.pipe(parse);
      }
    });
  });
  return cb ? p.then(cb, cb) : p
};

const list = opt => new Parser$1(opt);

// tar -c
const hlo$3 = highLevelOpt;

const Pack$1 = pack;
const fsm$3 = fsMinipass;
const t$1 = list_1;
const path$a = require$$1$2;

var create_1 = (opt_, files, cb) => {
  if (typeof files === 'function')
    cb = files;

  if (Array.isArray(opt_))
    files = opt_, opt_ = {};

  if (!files || !Array.isArray(files) || !files.length)
    throw new TypeError('no files or directories specified')

  files = Array.from(files);

  const opt = hlo$3(opt_);

  if (opt.sync && typeof cb === 'function')
    throw new TypeError('callback not supported for sync tar functions')

  if (!opt.file && typeof cb === 'function')
    throw new TypeError('callback only supported with file option')

  return opt.file && opt.sync ? createFileSync(opt, files)
    : opt.file ? createFile(opt, files, cb)
    : opt.sync ? createSync(opt, files)
    : create(opt, files)
};

const createFileSync = (opt, files) => {
  const p = new Pack$1.Sync(opt);
  const stream = new fsm$3.WriteStreamSync(opt.file, {
    mode: opt.mode || 0o666,
  });
  p.pipe(stream);
  addFilesSync$1(p, files);
};

const createFile = (opt, files, cb) => {
  const p = new Pack$1(opt);
  const stream = new fsm$3.WriteStream(opt.file, {
    mode: opt.mode || 0o666,
  });
  p.pipe(stream);

  const promise = new Promise((res, rej) => {
    stream.on('error', rej);
    stream.on('close', res);
    p.on('error', rej);
  });

  addFilesAsync$1(p, files);

  return cb ? promise.then(cb, cb) : promise
};

const addFilesSync$1 = (p, files) => {
  files.forEach(file => {
    if (file.charAt(0) === '@') {
      t$1({
        file: path$a.resolve(p.cwd, file.substr(1)),
        sync: true,
        noResume: true,
        onentry: entry => p.add(entry),
      });
    } else
      p.add(file);
  });
  p.end();
};

const addFilesAsync$1 = (p, files) => {
  while (files.length) {
    const file = files.shift();
    if (file.charAt(0) === '@') {
      return t$1({
        file: path$a.resolve(p.cwd, file.substr(1)),
        noResume: true,
        onentry: entry => p.add(entry),
      }).then(_ => addFilesAsync$1(p, files))
    } else
      p.add(file);
  }
  p.end();
};

const createSync = (opt, files) => {
  const p = new Pack$1.Sync(opt);
  addFilesSync$1(p, files);
  return p
};

const create = (opt, files) => {
  const p = new Pack$1(opt);
  addFilesAsync$1(p, files);
  return p
};

// tar -r
const hlo$2 = highLevelOpt;
const Pack = pack;
const fs$d = require$$0$3;
const fsm$2 = fsMinipass;
const t = list_1;
const path$9 = require$$1$2;

// starting at the head of the file, read a Header
// If the checksum is invalid, that's our position to start writing
// If it is, jump forward by the specified size (round up to 512)
// and try again.
// Write the new Pack stream starting there.

const Header = header;

var replace_1 = (opt_, files, cb) => {
  const opt = hlo$2(opt_);

  if (!opt.file)
    throw new TypeError('file is required')

  if (opt.gzip)
    throw new TypeError('cannot append to compressed archives')

  if (!files || !Array.isArray(files) || !files.length)
    throw new TypeError('no files or directories specified')

  files = Array.from(files);

  return opt.sync ? replaceSync(opt, files)
    : replace(opt, files, cb)
};

const replaceSync = (opt, files) => {
  const p = new Pack.Sync(opt);

  let threw = true;
  let fd;
  let position;

  try {
    try {
      fd = fs$d.openSync(opt.file, 'r+');
    } catch (er) {
      if (er.code === 'ENOENT')
        fd = fs$d.openSync(opt.file, 'w+');
      else
        throw er
    }

    const st = fs$d.fstatSync(fd);
    const headBuf = Buffer.alloc(512);

    POSITION: for (position = 0; position < st.size; position += 512) {
      for (let bufPos = 0, bytes = 0; bufPos < 512; bufPos += bytes) {
        bytes = fs$d.readSync(
          fd, headBuf, bufPos, headBuf.length - bufPos, position + bufPos
        );

        if (position === 0 && headBuf[0] === 0x1f && headBuf[1] === 0x8b)
          throw new Error('cannot append to compressed archives')

        if (!bytes)
          break POSITION
      }

      const h = new Header(headBuf);
      if (!h.cksumValid)
        break
      const entryBlockSize = 512 * Math.ceil(h.size / 512);
      if (position + entryBlockSize + 512 > st.size)
        break
      // the 512 for the header we just parsed will be added as well
      // also jump ahead all the blocks for the body
      position += entryBlockSize;
      if (opt.mtimeCache)
        opt.mtimeCache.set(h.path, h.mtime);
    }
    threw = false;

    streamSync(opt, p, position, fd, files);
  } finally {
    if (threw) {
      try {
        fs$d.closeSync(fd);
      } catch (er) {}
    }
  }
};

const streamSync = (opt, p, position, fd, files) => {
  const stream = new fsm$2.WriteStreamSync(opt.file, {
    fd: fd,
    start: position,
  });
  p.pipe(stream);
  addFilesSync(p, files);
};

const replace = (opt, files, cb) => {
  files = Array.from(files);
  const p = new Pack(opt);

  const getPos = (fd, size, cb_) => {
    const cb = (er, pos) => {
      if (er)
        fs$d.close(fd, _ => cb_(er));
      else
        cb_(null, pos);
    };

    let position = 0;
    if (size === 0)
      return cb(null, 0)

    let bufPos = 0;
    const headBuf = Buffer.alloc(512);
    const onread = (er, bytes) => {
      if (er)
        return cb(er)
      bufPos += bytes;
      if (bufPos < 512 && bytes) {
        return fs$d.read(
          fd, headBuf, bufPos, headBuf.length - bufPos,
          position + bufPos, onread
        )
      }

      if (position === 0 && headBuf[0] === 0x1f && headBuf[1] === 0x8b)
        return cb(new Error('cannot append to compressed archives'))

      // truncated header
      if (bufPos < 512)
        return cb(null, position)

      const h = new Header(headBuf);
      if (!h.cksumValid)
        return cb(null, position)

      const entryBlockSize = 512 * Math.ceil(h.size / 512);
      if (position + entryBlockSize + 512 > size)
        return cb(null, position)

      position += entryBlockSize + 512;
      if (position >= size)
        return cb(null, position)

      if (opt.mtimeCache)
        opt.mtimeCache.set(h.path, h.mtime);
      bufPos = 0;
      fs$d.read(fd, headBuf, 0, 512, position, onread);
    };
    fs$d.read(fd, headBuf, 0, 512, position, onread);
  };

  const promise = new Promise((resolve, reject) => {
    p.on('error', reject);
    let flag = 'r+';
    const onopen = (er, fd) => {
      if (er && er.code === 'ENOENT' && flag === 'r+') {
        flag = 'w+';
        return fs$d.open(opt.file, flag, onopen)
      }

      if (er)
        return reject(er)

      fs$d.fstat(fd, (er, st) => {
        if (er)
          return reject(er)
        getPos(fd, st.size, (er, position) => {
          if (er)
            return reject(er)
          const stream = new fsm$2.WriteStream(opt.file, {
            fd: fd,
            start: position,
          });
          p.pipe(stream);
          stream.on('error', reject);
          stream.on('close', resolve);
          addFilesAsync(p, files);
        });
      });
    };
    fs$d.open(opt.file, flag, onopen);
  });

  return cb ? promise.then(cb, cb) : promise
};

const addFilesSync = (p, files) => {
  files.forEach(file => {
    if (file.charAt(0) === '@') {
      t({
        file: path$9.resolve(p.cwd, file.substr(1)),
        sync: true,
        noResume: true,
        onentry: entry => p.add(entry),
      });
    } else
      p.add(file);
  });
  p.end();
};

const addFilesAsync = (p, files) => {
  while (files.length) {
    const file = files.shift();
    if (file.charAt(0) === '@') {
      return t({
        file: path$9.resolve(p.cwd, file.substr(1)),
        noResume: true,
        onentry: entry => p.add(entry),
      }).then(_ => addFilesAsync(p, files))
    } else
      p.add(file);
  }
  p.end();
};

// tar -u

const hlo$1 = highLevelOpt;
const r = replace_1;
// just call tar.r with the filter and mtimeCache

var update = (opt_, files, cb) => {
  const opt = hlo$1(opt_);

  if (!opt.file)
    throw new TypeError('file is required')

  if (opt.gzip)
    throw new TypeError('cannot append to compressed archives')

  if (!files || !Array.isArray(files) || !files.length)
    throw new TypeError('no files or directories specified')

  files = Array.from(files);

  mtimeFilter(opt);
  return r(opt, files, cb)
};

const mtimeFilter = opt => {
  const filter = opt.filter;

  if (!opt.mtimeCache)
    opt.mtimeCache = new Map();

  opt.filter = filter ? (path, stat) =>
    filter(path, stat) && !(opt.mtimeCache.get(path) > stat.mtime)
    : (path, stat) => !(opt.mtimeCache.get(path) > stat.mtime);
};

var mkdir$2 = {exports: {}};

const { promisify: promisify$2 } = require$$2$1;
const fs$c = require$$0$3;
const optsArg$1 = opts => {
  if (!opts)
    opts = { mode: 0o777, fs: fs$c };
  else if (typeof opts === 'object')
    opts = { mode: 0o777, fs: fs$c, ...opts };
  else if (typeof opts === 'number')
    opts = { mode: opts, fs: fs$c };
  else if (typeof opts === 'string')
    opts = { mode: parseInt(opts, 8), fs: fs$c };
  else
    throw new TypeError('invalid options argument')

  opts.mkdir = opts.mkdir || opts.fs.mkdir || fs$c.mkdir;
  opts.mkdirAsync = promisify$2(opts.mkdir);
  opts.stat = opts.stat || opts.fs.stat || fs$c.stat;
  opts.statAsync = promisify$2(opts.stat);
  opts.statSync = opts.statSync || opts.fs.statSync || fs$c.statSync;
  opts.mkdirSync = opts.mkdirSync || opts.fs.mkdirSync || fs$c.mkdirSync;
  return opts
};
var optsArg_1 = optsArg$1;

const platform$2 = process.env.__TESTING_MKDIRP_PLATFORM__ || process.platform;
const { resolve, parse: parse$1 } = require$$1$2;
const pathArg$1 = path => {
  if (/\0/.test(path)) {
    // simulate same failure that node raises
    throw Object.assign(
      new TypeError('path must be a string without null bytes'),
      {
        path,
        code: 'ERR_INVALID_ARG_VALUE',
      }
    )
  }

  path = resolve(path);
  if (platform$2 === 'win32') {
    const badWinChars = /[*|"<>?:]/;
    const {root} = parse$1(path);
    if (badWinChars.test(path.substr(root.length))) {
      throw Object.assign(new Error('Illegal characters in path.'), {
        path,
        code: 'EINVAL',
      })
    }
  }

  return path
};
var pathArg_1 = pathArg$1;

const {dirname: dirname$2} = require$$1$2;

const findMade$1 = (opts, parent, path = undefined) => {
  // we never want the 'made' return value to be a root directory
  if (path === parent)
    return Promise.resolve()

  return opts.statAsync(parent).then(
    st => st.isDirectory() ? path : undefined, // will fail later
    er => er.code === 'ENOENT'
      ? findMade$1(opts, dirname$2(parent), parent)
      : undefined
  )
};

const findMadeSync$1 = (opts, parent, path = undefined) => {
  if (path === parent)
    return undefined

  try {
    return opts.statSync(parent).isDirectory() ? path : undefined
  } catch (er) {
    return er.code === 'ENOENT'
      ? findMadeSync$1(opts, dirname$2(parent), parent)
      : undefined
  }
};

var findMade_1 = {findMade: findMade$1, findMadeSync: findMadeSync$1};

const {dirname: dirname$1} = require$$1$2;

const mkdirpManual$2 = (path, opts, made) => {
  opts.recursive = false;
  const parent = dirname$1(path);
  if (parent === path) {
    return opts.mkdirAsync(path, opts).catch(er => {
      // swallowed by recursive implementation on posix systems
      // any other error is a failure
      if (er.code !== 'EISDIR')
        throw er
    })
  }

  return opts.mkdirAsync(path, opts).then(() => made || path, er => {
    if (er.code === 'ENOENT')
      return mkdirpManual$2(parent, opts)
        .then(made => mkdirpManual$2(path, opts, made))
    if (er.code !== 'EEXIST' && er.code !== 'EROFS')
      throw er
    return opts.statAsync(path).then(st => {
      if (st.isDirectory())
        return made
      else
        throw er
    }, () => { throw er })
  })
};

const mkdirpManualSync$2 = (path, opts, made) => {
  const parent = dirname$1(path);
  opts.recursive = false;

  if (parent === path) {
    try {
      return opts.mkdirSync(path, opts)
    } catch (er) {
      // swallowed by recursive implementation on posix systems
      // any other error is a failure
      if (er.code !== 'EISDIR')
        throw er
      else
        return
    }
  }

  try {
    opts.mkdirSync(path, opts);
    return made || path
  } catch (er) {
    if (er.code === 'ENOENT')
      return mkdirpManualSync$2(path, opts, mkdirpManualSync$2(parent, opts, made))
    if (er.code !== 'EEXIST' && er.code !== 'EROFS')
      throw er
    try {
      if (!opts.statSync(path).isDirectory())
        throw er
    } catch (_) {
      throw er
    }
  }
};

var mkdirpManual_1 = {mkdirpManual: mkdirpManual$2, mkdirpManualSync: mkdirpManualSync$2};

const {dirname} = require$$1$2;
const {findMade, findMadeSync} = findMade_1;
const {mkdirpManual: mkdirpManual$1, mkdirpManualSync: mkdirpManualSync$1} = mkdirpManual_1;

const mkdirpNative$1 = (path, opts) => {
  opts.recursive = true;
  const parent = dirname(path);
  if (parent === path)
    return opts.mkdirAsync(path, opts)

  return findMade(opts, path).then(made =>
    opts.mkdirAsync(path, opts).then(() => made)
    .catch(er => {
      if (er.code === 'ENOENT')
        return mkdirpManual$1(path, opts)
      else
        throw er
    }))
};

const mkdirpNativeSync$1 = (path, opts) => {
  opts.recursive = true;
  const parent = dirname(path);
  if (parent === path)
    return opts.mkdirSync(path, opts)

  const made = findMadeSync(opts, path);
  try {
    opts.mkdirSync(path, opts);
    return made
  } catch (er) {
    if (er.code === 'ENOENT')
      return mkdirpManualSync$1(path, opts)
    else
      throw er
  }
};

var mkdirpNative_1 = {mkdirpNative: mkdirpNative$1, mkdirpNativeSync: mkdirpNativeSync$1};

const fs$b = require$$0$3;

const version = process.env.__TESTING_MKDIRP_NODE_VERSION__ || process.version;
const versArr = version.replace(/^v/, '').split('.');
const hasNative = +versArr[0] > 10 || +versArr[0] === 10 && +versArr[1] >= 12;

const useNative$1 = !hasNative ? () => false : opts => opts.mkdir === fs$b.mkdir;
const useNativeSync$1 = !hasNative ? () => false : opts => opts.mkdirSync === fs$b.mkdirSync;

var useNative_1 = {useNative: useNative$1, useNativeSync: useNativeSync$1};

const optsArg = optsArg_1;
const pathArg = pathArg_1;

const {mkdirpNative, mkdirpNativeSync} = mkdirpNative_1;
const {mkdirpManual, mkdirpManualSync} = mkdirpManual_1;
const {useNative, useNativeSync} = useNative_1;


const mkdirp$4 = (path, opts) => {
  path = pathArg(path);
  opts = optsArg(opts);
  return useNative(opts)
    ? mkdirpNative(path, opts)
    : mkdirpManual(path, opts)
};

const mkdirpSync = (path, opts) => {
  path = pathArg(path);
  opts = optsArg(opts);
  return useNativeSync(opts)
    ? mkdirpNativeSync(path, opts)
    : mkdirpManualSync(path, opts)
};

mkdirp$4.sync = mkdirpSync;
mkdirp$4.native = (path, opts) => mkdirpNative(pathArg(path), optsArg(opts));
mkdirp$4.manual = (path, opts) => mkdirpManual(pathArg(path), optsArg(opts));
mkdirp$4.nativeSync = (path, opts) => mkdirpNativeSync(pathArg(path), optsArg(opts));
mkdirp$4.manualSync = (path, opts) => mkdirpManualSync(pathArg(path), optsArg(opts));

var mkdirp_1 = mkdirp$4;

const fs$a = require$$0$3;
const path$8 = require$$1$2;

/* istanbul ignore next */
const LCHOWN = fs$a.lchown ? 'lchown' : 'chown';
/* istanbul ignore next */
const LCHOWNSYNC = fs$a.lchownSync ? 'lchownSync' : 'chownSync';

/* istanbul ignore next */
const needEISDIRHandled = fs$a.lchown &&
  !process.version.match(/v1[1-9]+\./) &&
  !process.version.match(/v10\.[6-9]/);

const lchownSync$1 = (path, uid, gid) => {
  try {
    return fs$a[LCHOWNSYNC](path, uid, gid)
  } catch (er) {
    if (er.code !== 'ENOENT')
      throw er
  }
};

/* istanbul ignore next */
const chownSync$1 = (path, uid, gid) => {
  try {
    return fs$a.chownSync(path, uid, gid)
  } catch (er) {
    if (er.code !== 'ENOENT')
      throw er
  }
};

/* istanbul ignore next */
const handleEISDIR =
  needEISDIRHandled ? (path, uid, gid, cb) => er => {
    // Node prior to v10 had a very questionable implementation of
    // fs.lchown, which would always try to call fs.open on a directory
    // Fall back to fs.chown in those cases.
    if (!er || er.code !== 'EISDIR')
      cb(er);
    else
      fs$a.chown(path, uid, gid, cb);
  }
  : (_, __, ___, cb) => cb;

/* istanbul ignore next */
const handleEISDirSync =
  needEISDIRHandled ? (path, uid, gid) => {
    try {
      return lchownSync$1(path, uid, gid)
    } catch (er) {
      if (er.code !== 'EISDIR')
        throw er
      chownSync$1(path, uid, gid);
    }
  }
  : (path, uid, gid) => lchownSync$1(path, uid, gid);

// fs.readdir could only accept an options object as of node v6
const nodeVersion = process.version;
let readdir = (path, options, cb) => fs$a.readdir(path, options, cb);
let readdirSync = (path, options) => fs$a.readdirSync(path, options);
/* istanbul ignore next */
if (/^v4\./.test(nodeVersion))
  readdir = (path, options, cb) => fs$a.readdir(path, cb);

const chown$1 = (cpath, uid, gid, cb) => {
  fs$a[LCHOWN](cpath, uid, gid, handleEISDIR(cpath, uid, gid, er => {
    // Skip ENOENT error
    cb(er && er.code !== 'ENOENT' ? er : null);
  }));
};

const chownrKid = (p, child, uid, gid, cb) => {
  if (typeof child === 'string')
    return fs$a.lstat(path$8.resolve(p, child), (er, stats) => {
      // Skip ENOENT error
      if (er)
        return cb(er.code !== 'ENOENT' ? er : null)
      stats.name = child;
      chownrKid(p, stats, uid, gid, cb);
    })

  if (child.isDirectory()) {
    chownr$1(path$8.resolve(p, child.name), uid, gid, er => {
      if (er)
        return cb(er)
      const cpath = path$8.resolve(p, child.name);
      chown$1(cpath, uid, gid, cb);
    });
  } else {
    const cpath = path$8.resolve(p, child.name);
    chown$1(cpath, uid, gid, cb);
  }
};


const chownr$1 = (p, uid, gid, cb) => {
  readdir(p, { withFileTypes: true }, (er, children) => {
    // any error other than ENOTDIR or ENOTSUP means it's not readable,
    // or doesn't exist.  give up.
    if (er) {
      if (er.code === 'ENOENT')
        return cb()
      else if (er.code !== 'ENOTDIR' && er.code !== 'ENOTSUP')
        return cb(er)
    }
    if (er || !children.length)
      return chown$1(p, uid, gid, cb)

    let len = children.length;
    let errState = null;
    const then = er => {
      if (errState)
        return
      if (er)
        return cb(errState = er)
      if (-- len === 0)
        return chown$1(p, uid, gid, cb)
    };

    children.forEach(child => chownrKid(p, child, uid, gid, then));
  });
};

const chownrKidSync = (p, child, uid, gid) => {
  if (typeof child === 'string') {
    try {
      const stats = fs$a.lstatSync(path$8.resolve(p, child));
      stats.name = child;
      child = stats;
    } catch (er) {
      if (er.code === 'ENOENT')
        return
      else
        throw er
    }
  }

  if (child.isDirectory())
    chownrSync(path$8.resolve(p, child.name), uid, gid);

  handleEISDirSync(path$8.resolve(p, child.name), uid, gid);
};

const chownrSync = (p, uid, gid) => {
  let children;
  try {
    children = readdirSync(p, { withFileTypes: true });
  } catch (er) {
    if (er.code === 'ENOENT')
      return
    else if (er.code === 'ENOTDIR' || er.code === 'ENOTSUP')
      return handleEISDirSync(p, uid, gid)
    else
      throw er
  }

  if (children && children.length)
    children.forEach(child => chownrKidSync(p, child, uid, gid));

  return handleEISDirSync(p, uid, gid)
};

var chownr_1 = chownr$1;
chownr$1.sync = chownrSync;

// wrapper around mkdirp for tar's needs.

// TODO: This should probably be a class, not functionally
// passing around state in a gazillion args.

const mkdirp$3 = mkdirp_1;
const fs$9 = require$$0$3;
const path$7 = require$$1$2;
const chownr = chownr_1;

class SymlinkError extends Error {
  constructor (symlink, path) {
    super('Cannot extract through symbolic link');
    this.path = path;
    this.symlink = symlink;
  }

  get name () {
    return 'SylinkError'
  }
}

class CwdError extends Error {
  constructor (path, code) {
    super(code + ': Cannot cd into \'' + path + '\'');
    this.path = path;
    this.code = code;
  }

  get name () {
    return 'CwdError'
  }
}

mkdir$2.exports = (dir, opt, cb) => {
  // if there's any overlap between mask and mode,
  // then we'll need an explicit chmod
  const umask = opt.umask;
  const mode = opt.mode | 0o0700;
  const needChmod = (mode & umask) !== 0;

  const uid = opt.uid;
  const gid = opt.gid;
  const doChown = typeof uid === 'number' &&
    typeof gid === 'number' &&
    (uid !== opt.processUid || gid !== opt.processGid);

  const preserve = opt.preserve;
  const unlink = opt.unlink;
  const cache = opt.cache;
  const cwd = opt.cwd;

  const done = (er, created) => {
    if (er)
      cb(er);
    else {
      cache.set(dir, true);
      if (created && doChown)
        chownr(created, uid, gid, er => done(er));
      else if (needChmod)
        fs$9.chmod(dir, mode, cb);
      else
        cb();
    }
  };

  if (cache && cache.get(dir) === true)
    return done()

  if (dir === cwd) {
    return fs$9.stat(dir, (er, st) => {
      if (er || !st.isDirectory())
        er = new CwdError(dir, er && er.code || 'ENOTDIR');
      done(er);
    })
  }

  if (preserve)
    return mkdirp$3(dir, {mode}).then(made => done(null, made), done)

  const sub = path$7.relative(cwd, dir);
  const parts = sub.split(/\/|\\/);
  mkdir_(cwd, parts, mode, cache, unlink, cwd, null, done);
};

const mkdir_ = (base, parts, mode, cache, unlink, cwd, created, cb) => {
  if (!parts.length)
    return cb(null, created)
  const p = parts.shift();
  const part = base + '/' + p;
  if (cache.get(part))
    return mkdir_(part, parts, mode, cache, unlink, cwd, created, cb)
  fs$9.mkdir(part, mode, onmkdir(part, parts, mode, cache, unlink, cwd, created, cb));
};

const onmkdir = (part, parts, mode, cache, unlink, cwd, created, cb) => er => {
  if (er) {
    if (er.path && path$7.dirname(er.path) === cwd &&
        (er.code === 'ENOTDIR' || er.code === 'ENOENT'))
      return cb(new CwdError(cwd, er.code))

    fs$9.lstat(part, (statEr, st) => {
      if (statEr)
        cb(statEr);
      else if (st.isDirectory())
        mkdir_(part, parts, mode, cache, unlink, cwd, created, cb);
      else if (unlink) {
        fs$9.unlink(part, er => {
          if (er)
            return cb(er)
          fs$9.mkdir(part, mode, onmkdir(part, parts, mode, cache, unlink, cwd, created, cb));
        });
      } else if (st.isSymbolicLink())
        return cb(new SymlinkError(part, part + '/' + parts.join('/')))
      else
        cb(er);
    });
  } else {
    created = created || part;
    mkdir_(part, parts, mode, cache, unlink, cwd, created, cb);
  }
};

mkdir$2.exports.sync = (dir, opt) => {
  // if there's any overlap between mask and mode,
  // then we'll need an explicit chmod
  const umask = opt.umask;
  const mode = opt.mode | 0o0700;
  const needChmod = (mode & umask) !== 0;

  const uid = opt.uid;
  const gid = opt.gid;
  const doChown = typeof uid === 'number' &&
    typeof gid === 'number' &&
    (uid !== opt.processUid || gid !== opt.processGid);

  const preserve = opt.preserve;
  const unlink = opt.unlink;
  const cache = opt.cache;
  const cwd = opt.cwd;

  const done = (created) => {
    cache.set(dir, true);
    if (created && doChown)
      chownr.sync(created, uid, gid);
    if (needChmod)
      fs$9.chmodSync(dir, mode);
  };

  if (cache && cache.get(dir) === true)
    return done()

  if (dir === cwd) {
    let ok = false;
    let code = 'ENOTDIR';
    try {
      ok = fs$9.statSync(dir).isDirectory();
    } catch (er) {
      code = er.code;
    } finally {
      if (!ok)
        throw new CwdError(dir, code)
    }
    done();
    return
  }

  if (preserve)
    return done(mkdirp$3.sync(dir, mode))

  const sub = path$7.relative(cwd, dir);
  const parts = sub.split(/\/|\\/);
  let created = null;
  for (let p = parts.shift(), part = cwd;
    p && (part += '/' + p);
    p = parts.shift()) {
    if (cache.get(part))
      continue

    try {
      fs$9.mkdirSync(part, mode);
      created = created || part;
      cache.set(part, true);
    } catch (er) {
      if (er.path && path$7.dirname(er.path) === cwd &&
          (er.code === 'ENOTDIR' || er.code === 'ENOENT'))
        return new CwdError(cwd, er.code)

      const st = fs$9.lstatSync(part);
      if (st.isDirectory()) {
        cache.set(part, true);
        continue
      } else if (unlink) {
        fs$9.unlinkSync(part);
        fs$9.mkdirSync(part, mode);
        created = created || part;
        cache.set(part, true);
        continue
      } else if (st.isSymbolicLink())
        return new SymlinkError(part, part + '/' + parts.join('/'))
    }
  }

  return done(created)
};

// A path exclusive reservation system
// reserve([list, of, paths], fn)
// When the fn is first in line for all its paths, it
// is called with a cb that clears the reservation.
//
// Used by async unpack to avoid clobbering paths in use,
// while still allowing maximal safe parallelization.

const assert$3 = require$$0$2;

var pathReservations$1 = () => {
  // path => [function or Set]
  // A Set object means a directory reservation
  // A fn is a direct reservation on that path
  const queues = new Map();

  // fn => {paths:[path,...], dirs:[path, ...]}
  const reservations = new Map();

  // return a set of parent dirs for a given path
  const { join } = require$$1$2;
  const getDirs = path =>
    join(path).split(/[\\/]/).slice(0, -1).reduce((set, path) =>
      set.length ? set.concat(join(set[set.length - 1], path)) : [path], []);

  // functions currently running
  const running = new Set();

  // return the queues for each path the function cares about
  // fn => {paths, dirs}
  const getQueues = fn => {
    const res = reservations.get(fn);
    /* istanbul ignore if - unpossible */
    if (!res)
      throw new Error('function does not have any path reservations')
    return {
      paths: res.paths.map(path => queues.get(path)),
      dirs: [...res.dirs].map(path => queues.get(path)),
    }
  };

  // check if fn is first in line for all its paths, and is
  // included in the first set for all its dir queues
  const check = fn => {
    const {paths, dirs} = getQueues(fn);
    return paths.every(q => q[0] === fn) &&
      dirs.every(q => q[0] instanceof Set && q[0].has(fn))
  };

  // run the function if it's first in line and not already running
  const run = fn => {
    if (running.has(fn) || !check(fn))
      return false
    running.add(fn);
    fn(() => clear(fn));
    return true
  };

  const clear = fn => {
    if (!running.has(fn))
      return false

    const { paths, dirs } = reservations.get(fn);
    const next = new Set();

    paths.forEach(path => {
      const q = queues.get(path);
      assert$3.equal(q[0], fn);
      if (q.length === 1)
        queues.delete(path);
      else {
        q.shift();
        if (typeof q[0] === 'function')
          next.add(q[0]);
        else
          q[0].forEach(fn => next.add(fn));
      }
    });

    dirs.forEach(dir => {
      const q = queues.get(dir);
      assert$3(q[0] instanceof Set);
      if (q[0].size === 1 && q.length === 1)
        queues.delete(dir);
      else if (q[0].size === 1) {
        q.shift();

        // must be a function or else the Set would've been reused
        next.add(q[0]);
      } else
        q[0].delete(fn);
    });
    running.delete(fn);

    next.forEach(fn => run(fn));
    return true
  };

  const reserve = (paths, fn) => {
    const dirs = new Set(
      paths.map(path => getDirs(path)).reduce((a, b) => a.concat(b))
    );
    reservations.set(fn, {dirs, paths});
    paths.forEach(path => {
      const q = queues.get(path);
      if (!q)
        queues.set(path, [fn]);
      else
        q.push(fn);
    });
    dirs.forEach(dir => {
      const q = queues.get(dir);
      if (!q)
        queues.set(dir, [new Set([fn])]);
      else if (q[q.length - 1] instanceof Set)
        q[q.length - 1].add(fn);
      else
        q.push(new Set([fn]));
    });

    return run(fn)
  };

  return { check, reserve }
};

// Get the appropriate flag to use for creating files
// We use fmap on Windows platforms for files less than
// 512kb.  This is a fairly low limit, but avoids making
// things slower in some cases.  Since most of what this
// library is used for is extracting tarballs of many
// relatively small files in npm packages and the like,
// it can be a big boost on Windows platforms.
// Only supported in Node v12.9.0 and above.
const platform$1 = process.env.__FAKE_PLATFORM__ || process.platform;
const isWindows$3 = platform$1 === 'win32';
const fs$8 = commonjsGlobal.__FAKE_TESTING_FS__ || require$$0$3;

/* istanbul ignore next */
const { O_CREAT, O_TRUNC, O_WRONLY, UV_FS_O_FILEMAP = 0 } = fs$8.constants;

const fMapEnabled = isWindows$3 && !!UV_FS_O_FILEMAP;
const fMapLimit = 512 * 1024;
const fMapFlag = UV_FS_O_FILEMAP | O_TRUNC | O_CREAT | O_WRONLY;
var getWriteFlag = !fMapEnabled ? () => 'w'
  : size => size < fMapLimit ? fMapFlag : 'w';

// the PEND/UNPEND stuff tracks whether we're ready to emit end/close yet.
// but the path reservations are required to avoid race conditions where
// parallelized unpack ops may mess with one another, due to dependencies
// (like a Link depending on its target) or destructive operations (like
// clobbering an fs object to create one of a different type.)

const assert$2 = require$$0$2;
const Parser = parse$2;
const fs$7 = require$$0$3;
const fsm$1 = fsMinipass;
const path$6 = require$$1$2;
const mkdir$1 = mkdir$2.exports;
const wc = winchars$1;
const pathReservations = pathReservations$1;

const ONENTRY = Symbol('onEntry');
const CHECKFS = Symbol('checkFs');
const CHECKFS2 = Symbol('checkFs2');
const ISREUSABLE = Symbol('isReusable');
const MAKEFS = Symbol('makeFs');
const FILE = Symbol('file');
const DIRECTORY = Symbol('directory');
const LINK = Symbol('link');
const SYMLINK = Symbol('symlink');
const HARDLINK = Symbol('hardlink');
const UNSUPPORTED = Symbol('unsupported');
const CHECKPATH = Symbol('checkPath');
const MKDIR = Symbol('mkdir');
const ONERROR = Symbol('onError');
const PENDING = Symbol('pending');
const PEND = Symbol('pend');
const UNPEND = Symbol('unpend');
const ENDED = Symbol('ended');
const MAYBECLOSE = Symbol('maybeClose');
const SKIP = Symbol('skip');
const DOCHOWN = Symbol('doChown');
const UID = Symbol('uid');
const GID = Symbol('gid');
const crypto = require$$8;
const getFlag = getWriteFlag;

/* istanbul ignore next */
const neverCalled = () => {
  throw new Error('sync function called cb somehow?!?')
};

// Unlinks on Windows are not atomic.
//
// This means that if you have a file entry, followed by another
// file entry with an identical name, and you cannot re-use the file
// (because it's a hardlink, or because unlink:true is set, or it's
// Windows, which does not have useful nlink values), then the unlink
// will be committed to the disk AFTER the new file has been written
// over the old one, deleting the new file.
//
// To work around this, on Windows systems, we rename the file and then
// delete the renamed file.  It's a sloppy kludge, but frankly, I do not
// know of a better way to do this, given windows' non-atomic unlink
// semantics.
//
// See: https://github.com/npm/node-tar/issues/183
/* istanbul ignore next */
const unlinkFile = (path, cb) => {
  if (process.platform !== 'win32')
    return fs$7.unlink(path, cb)

  const name = path + '.DELETE.' + crypto.randomBytes(16).toString('hex');
  fs$7.rename(path, name, er => {
    if (er)
      return cb(er)
    fs$7.unlink(name, cb);
  });
};

/* istanbul ignore next */
const unlinkFileSync = path => {
  if (process.platform !== 'win32')
    return fs$7.unlinkSync(path)

  const name = path + '.DELETE.' + crypto.randomBytes(16).toString('hex');
  fs$7.renameSync(path, name);
  fs$7.unlinkSync(name);
};

// this.gid, entry.gid, this.processUid
const uint32 = (a, b, c) =>
  a === a >>> 0 ? a
  : b === b >>> 0 ? b
  : c;

class Unpack$1 extends Parser {
  constructor (opt) {
    if (!opt)
      opt = {};

    opt.ondone = _ => {
      this[ENDED] = true;
      this[MAYBECLOSE]();
    };

    super(opt);

    this.reservations = pathReservations();

    this.transform = typeof opt.transform === 'function' ? opt.transform : null;

    this.writable = true;
    this.readable = false;

    this[PENDING] = 0;
    this[ENDED] = false;

    this.dirCache = opt.dirCache || new Map();

    if (typeof opt.uid === 'number' || typeof opt.gid === 'number') {
      // need both or neither
      if (typeof opt.uid !== 'number' || typeof opt.gid !== 'number')
        throw new TypeError('cannot set owner without number uid and gid')
      if (opt.preserveOwner) {
        throw new TypeError(
          'cannot preserve owner in archive and also set owner explicitly')
      }
      this.uid = opt.uid;
      this.gid = opt.gid;
      this.setOwner = true;
    } else {
      this.uid = null;
      this.gid = null;
      this.setOwner = false;
    }

    // default true for root
    if (opt.preserveOwner === undefined && typeof opt.uid !== 'number')
      this.preserveOwner = process.getuid && process.getuid() === 0;
    else
      this.preserveOwner = !!opt.preserveOwner;

    this.processUid = (this.preserveOwner || this.setOwner) && process.getuid ?
      process.getuid() : null;
    this.processGid = (this.preserveOwner || this.setOwner) && process.getgid ?
      process.getgid() : null;

    // mostly just for testing, but useful in some cases.
    // Forcibly trigger a chown on every entry, no matter what
    this.forceChown = opt.forceChown === true;

    // turn ><?| in filenames into 0xf000-higher encoded forms
    this.win32 = !!opt.win32 || process.platform === 'win32';

    // do not unpack over files that are newer than what's in the archive
    this.newer = !!opt.newer;

    // do not unpack over ANY files
    this.keep = !!opt.keep;

    // do not set mtime/atime of extracted entries
    this.noMtime = !!opt.noMtime;

    // allow .., absolute path entries, and unpacking through symlinks
    // without this, warn and skip .., relativize absolutes, and error
    // on symlinks in extraction path
    this.preservePaths = !!opt.preservePaths;

    // unlink files and links before writing. This breaks existing hard
    // links, and removes symlink directories rather than erroring
    this.unlink = !!opt.unlink;

    this.cwd = path$6.resolve(opt.cwd || process.cwd());
    this.strip = +opt.strip || 0;
    // if we're not chmodding, then we don't need the process umask
    this.processUmask = opt.noChmod ? 0 : process.umask();
    this.umask = typeof opt.umask === 'number' ? opt.umask : this.processUmask;

    // default mode for dirs created as parents
    this.dmode = opt.dmode || (0o0777 & (~this.umask));
    this.fmode = opt.fmode || (0o0666 & (~this.umask));

    this.on('entry', entry => this[ONENTRY](entry));
  }

  // a bad or damaged archive is a warning for Parser, but an error
  // when extracting.  Mark those errors as unrecoverable, because
  // the Unpack contract cannot be met.
  warn (code, msg, data = {}) {
    if (code === 'TAR_BAD_ARCHIVE' || code === 'TAR_ABORT')
      data.recoverable = false;
    return super.warn(code, msg, data)
  }

  [MAYBECLOSE] () {
    if (this[ENDED] && this[PENDING] === 0) {
      this.emit('prefinish');
      this.emit('finish');
      this.emit('end');
      this.emit('close');
    }
  }

  [CHECKPATH] (entry) {
    if (this.strip) {
      const parts = entry.path.split(/\/|\\/);
      if (parts.length < this.strip)
        return false
      entry.path = parts.slice(this.strip).join('/');

      if (entry.type === 'Link') {
        const linkparts = entry.linkpath.split(/\/|\\/);
        if (linkparts.length >= this.strip)
          entry.linkpath = linkparts.slice(this.strip).join('/');
      }
    }

    if (!this.preservePaths) {
      const p = entry.path;
      if (p.match(/(^|\/|\\)\.\.(\\|\/|$)/)) {
        this.warn('TAR_ENTRY_ERROR', `path contains '..'`, {
          entry,
          path: p,
        });
        return false
      }

      // absolutes on posix are also absolutes on win32
      // so we only need to test this one to get both
      if (path$6.win32.isAbsolute(p)) {
        const parsed = path$6.win32.parse(p);
        entry.path = p.substr(parsed.root.length);
        const r = parsed.root;
        this.warn('TAR_ENTRY_INFO', `stripping ${r} from absolute path`, {
          entry,
          path: p,
        });
      }
    }

    // only encode : chars that aren't drive letter indicators
    if (this.win32) {
      const parsed = path$6.win32.parse(entry.path);
      entry.path = parsed.root === '' ? wc.encode(entry.path)
        : parsed.root + wc.encode(entry.path.substr(parsed.root.length));
    }

    if (path$6.isAbsolute(entry.path))
      entry.absolute = entry.path;
    else
      entry.absolute = path$6.resolve(this.cwd, entry.path);

    return true
  }

  [ONENTRY] (entry) {
    if (!this[CHECKPATH](entry))
      return entry.resume()

    assert$2.equal(typeof entry.absolute, 'string');

    switch (entry.type) {
      case 'Directory':
      case 'GNUDumpDir':
        if (entry.mode)
          entry.mode = entry.mode | 0o700;

      case 'File':
      case 'OldFile':
      case 'ContiguousFile':
      case 'Link':
      case 'SymbolicLink':
        return this[CHECKFS](entry)

      case 'CharacterDevice':
      case 'BlockDevice':
      case 'FIFO':
      default:
        return this[UNSUPPORTED](entry)
    }
  }

  [ONERROR] (er, entry) {
    // Cwd has to exist, or else nothing works. That's serious.
    // Other errors are warnings, which raise the error in strict
    // mode, but otherwise continue on.
    if (er.name === 'CwdError')
      this.emit('error', er);
    else {
      this.warn('TAR_ENTRY_ERROR', er, {entry});
      this[UNPEND]();
      entry.resume();
    }
  }

  [MKDIR] (dir, mode, cb) {
    mkdir$1(dir, {
      uid: this.uid,
      gid: this.gid,
      processUid: this.processUid,
      processGid: this.processGid,
      umask: this.processUmask,
      preserve: this.preservePaths,
      unlink: this.unlink,
      cache: this.dirCache,
      cwd: this.cwd,
      mode: mode,
      noChmod: this.noChmod,
    }, cb);
  }

  [DOCHOWN] (entry) {
    // in preserve owner mode, chown if the entry doesn't match process
    // in set owner mode, chown if setting doesn't match process
    return this.forceChown ||
      this.preserveOwner &&
      (typeof entry.uid === 'number' && entry.uid !== this.processUid ||
        typeof entry.gid === 'number' && entry.gid !== this.processGid)
      ||
      (typeof this.uid === 'number' && this.uid !== this.processUid ||
        typeof this.gid === 'number' && this.gid !== this.processGid)
  }

  [UID] (entry) {
    return uint32(this.uid, entry.uid, this.processUid)
  }

  [GID] (entry) {
    return uint32(this.gid, entry.gid, this.processGid)
  }

  [FILE] (entry, fullyDone) {
    const mode = entry.mode & 0o7777 || this.fmode;
    const stream = new fsm$1.WriteStream(entry.absolute, {
      flags: getFlag(entry.size),
      mode: mode,
      autoClose: false,
    });
    stream.on('error', er => this[ONERROR](er, entry));

    let actions = 1;
    const done = er => {
      if (er)
        return this[ONERROR](er, entry)

      if (--actions === 0) {
        fs$7.close(stream.fd, er => {
          fullyDone();
          er ? this[ONERROR](er, entry) : this[UNPEND]();
        });
      }
    };

    stream.on('finish', _ => {
      // if futimes fails, try utimes
      // if utimes fails, fail with the original error
      // same for fchown/chown
      const abs = entry.absolute;
      const fd = stream.fd;

      if (entry.mtime && !this.noMtime) {
        actions++;
        const atime = entry.atime || new Date();
        const mtime = entry.mtime;
        fs$7.futimes(fd, atime, mtime, er =>
          er ? fs$7.utimes(abs, atime, mtime, er2 => done(er2 && er))
          : done());
      }

      if (this[DOCHOWN](entry)) {
        actions++;
        const uid = this[UID](entry);
        const gid = this[GID](entry);
        fs$7.fchown(fd, uid, gid, er =>
          er ? fs$7.chown(abs, uid, gid, er2 => done(er2 && er))
          : done());
      }

      done();
    });

    const tx = this.transform ? this.transform(entry) || entry : entry;
    if (tx !== entry) {
      tx.on('error', er => this[ONERROR](er, entry));
      entry.pipe(tx);
    }
    tx.pipe(stream);
  }

  [DIRECTORY] (entry, fullyDone) {
    const mode = entry.mode & 0o7777 || this.dmode;
    this[MKDIR](entry.absolute, mode, er => {
      if (er) {
        fullyDone();
        return this[ONERROR](er, entry)
      }

      let actions = 1;
      const done = _ => {
        if (--actions === 0) {
          fullyDone();
          this[UNPEND]();
          entry.resume();
        }
      };

      if (entry.mtime && !this.noMtime) {
        actions++;
        fs$7.utimes(entry.absolute, entry.atime || new Date(), entry.mtime, done);
      }

      if (this[DOCHOWN](entry)) {
        actions++;
        fs$7.chown(entry.absolute, this[UID](entry), this[GID](entry), done);
      }

      done();
    });
  }

  [UNSUPPORTED] (entry) {
    entry.unsupported = true;
    this.warn('TAR_ENTRY_UNSUPPORTED',
      `unsupported entry type: ${entry.type}`, {entry});
    entry.resume();
  }

  [SYMLINK] (entry, done) {
    this[LINK](entry, entry.linkpath, 'symlink', done);
  }

  [HARDLINK] (entry, done) {
    this[LINK](entry, path$6.resolve(this.cwd, entry.linkpath), 'link', done);
  }

  [PEND] () {
    this[PENDING]++;
  }

  [UNPEND] () {
    this[PENDING]--;
    this[MAYBECLOSE]();
  }

  [SKIP] (entry) {
    this[UNPEND]();
    entry.resume();
  }

  // Check if we can reuse an existing filesystem entry safely and
  // overwrite it, rather than unlinking and recreating
  // Windows doesn't report a useful nlink, so we just never reuse entries
  [ISREUSABLE] (entry, st) {
    return entry.type === 'File' &&
      !this.unlink &&
      st.isFile() &&
      st.nlink <= 1 &&
      process.platform !== 'win32'
  }

  // check if a thing is there, and if so, try to clobber it
  [CHECKFS] (entry) {
    this[PEND]();
    const paths = [entry.path];
    if (entry.linkpath)
      paths.push(entry.linkpath);
    this.reservations.reserve(paths, done => this[CHECKFS2](entry, done));
  }

  [CHECKFS2] (entry, done) {
    this[MKDIR](path$6.dirname(entry.absolute), this.dmode, er => {
      if (er) {
        done();
        return this[ONERROR](er, entry)
      }
      fs$7.lstat(entry.absolute, (er, st) => {
        if (st && (this.keep || this.newer && st.mtime > entry.mtime)) {
          this[SKIP](entry);
          done();
        } else if (er || this[ISREUSABLE](entry, st))
          this[MAKEFS](null, entry, done);

        else if (st.isDirectory()) {
          if (entry.type === 'Directory') {
            if (!this.noChmod && (!entry.mode || (st.mode & 0o7777) === entry.mode))
              this[MAKEFS](null, entry, done);
            else {
              fs$7.chmod(entry.absolute, entry.mode,
                er => this[MAKEFS](er, entry, done));
            }
          } else
            fs$7.rmdir(entry.absolute, er => this[MAKEFS](er, entry, done));
        } else
          unlinkFile(entry.absolute, er => this[MAKEFS](er, entry, done));
      });
    });
  }

  [MAKEFS] (er, entry, done) {
    if (er)
      return this[ONERROR](er, entry)

    switch (entry.type) {
      case 'File':
      case 'OldFile':
      case 'ContiguousFile':
        return this[FILE](entry, done)

      case 'Link':
        return this[HARDLINK](entry, done)

      case 'SymbolicLink':
        return this[SYMLINK](entry, done)

      case 'Directory':
      case 'GNUDumpDir':
        return this[DIRECTORY](entry, done)
    }
  }

  [LINK] (entry, linkpath, link, done) {
    // XXX: get the type ('file' or 'dir') for windows
    fs$7[link](linkpath, entry.absolute, er => {
      if (er)
        return this[ONERROR](er, entry)
      done();
      this[UNPEND]();
      entry.resume();
    });
  }
}

class UnpackSync extends Unpack$1 {
  [CHECKFS] (entry) {
    const er = this[MKDIR](path$6.dirname(entry.absolute), this.dmode, neverCalled);
    if (er)
      return this[ONERROR](er, entry)
    try {
      const st = fs$7.lstatSync(entry.absolute);
      if (this.keep || this.newer && st.mtime > entry.mtime)
        return this[SKIP](entry)
      else if (this[ISREUSABLE](entry, st))
        return this[MAKEFS](null, entry, neverCalled)
      else {
        try {
          if (st.isDirectory()) {
            if (entry.type === 'Directory') {
              if (!this.noChmod && entry.mode && (st.mode & 0o7777) !== entry.mode)
                fs$7.chmodSync(entry.absolute, entry.mode);
            } else
              fs$7.rmdirSync(entry.absolute);
          } else
            unlinkFileSync(entry.absolute);
          return this[MAKEFS](null, entry, neverCalled)
        } catch (er) {
          return this[ONERROR](er, entry)
        }
      }
    } catch (er) {
      return this[MAKEFS](null, entry, neverCalled)
    }
  }

  [FILE] (entry, _) {
    const mode = entry.mode & 0o7777 || this.fmode;

    const oner = er => {
      let closeError;
      try {
        fs$7.closeSync(fd);
      } catch (e) {
        closeError = e;
      }
      if (er || closeError)
        this[ONERROR](er || closeError, entry);
    };

    let fd;
    try {
      fd = fs$7.openSync(entry.absolute, getFlag(entry.size), mode);
    } catch (er) {
      return oner(er)
    }
    const tx = this.transform ? this.transform(entry) || entry : entry;
    if (tx !== entry) {
      tx.on('error', er => this[ONERROR](er, entry));
      entry.pipe(tx);
    }

    tx.on('data', chunk => {
      try {
        fs$7.writeSync(fd, chunk, 0, chunk.length);
      } catch (er) {
        oner(er);
      }
    });

    tx.on('end', _ => {
      let er = null;
      // try both, falling futimes back to utimes
      // if either fails, handle the first error
      if (entry.mtime && !this.noMtime) {
        const atime = entry.atime || new Date();
        const mtime = entry.mtime;
        try {
          fs$7.futimesSync(fd, atime, mtime);
        } catch (futimeser) {
          try {
            fs$7.utimesSync(entry.absolute, atime, mtime);
          } catch (utimeser) {
            er = futimeser;
          }
        }
      }

      if (this[DOCHOWN](entry)) {
        const uid = this[UID](entry);
        const gid = this[GID](entry);

        try {
          fs$7.fchownSync(fd, uid, gid);
        } catch (fchowner) {
          try {
            fs$7.chownSync(entry.absolute, uid, gid);
          } catch (chowner) {
            er = er || fchowner;
          }
        }
      }

      oner(er);
    });
  }

  [DIRECTORY] (entry, _) {
    const mode = entry.mode & 0o7777 || this.dmode;
    const er = this[MKDIR](entry.absolute, mode);
    if (er)
      return this[ONERROR](er, entry)
    if (entry.mtime && !this.noMtime) {
      try {
        fs$7.utimesSync(entry.absolute, entry.atime || new Date(), entry.mtime);
      } catch (er) {}
    }
    if (this[DOCHOWN](entry)) {
      try {
        fs$7.chownSync(entry.absolute, this[UID](entry), this[GID](entry));
      } catch (er) {}
    }
    entry.resume();
  }

  [MKDIR] (dir, mode) {
    try {
      return mkdir$1.sync(dir, {
        uid: this.uid,
        gid: this.gid,
        processUid: this.processUid,
        processGid: this.processGid,
        umask: this.processUmask,
        preserve: this.preservePaths,
        unlink: this.unlink,
        cache: this.dirCache,
        cwd: this.cwd,
        mode: mode,
      })
    } catch (er) {
      return er
    }
  }

  [LINK] (entry, linkpath, link, _) {
    try {
      fs$7[link + 'Sync'](linkpath, entry.absolute);
      entry.resume();
    } catch (er) {
      return this[ONERROR](er, entry)
    }
  }
}

Unpack$1.Sync = UnpackSync;
var unpack = Unpack$1;

// tar -x
const hlo = highLevelOpt;
const Unpack = unpack;
const fs$6 = require$$0$3;
const fsm = fsMinipass;
const path$5 = require$$1$2;

var extract_1 = (opt_, files, cb) => {
  if (typeof opt_ === 'function')
    cb = opt_, files = null, opt_ = {};
  else if (Array.isArray(opt_))
    files = opt_, opt_ = {};

  if (typeof files === 'function')
    cb = files, files = null;

  if (!files)
    files = [];
  else
    files = Array.from(files);

  const opt = hlo(opt_);

  if (opt.sync && typeof cb === 'function')
    throw new TypeError('callback not supported for sync tar functions')

  if (!opt.file && typeof cb === 'function')
    throw new TypeError('callback only supported with file option')

  if (files.length)
    filesFilter(opt, files);

  return opt.file && opt.sync ? extractFileSync(opt)
    : opt.file ? extractFile(opt, cb)
    : opt.sync ? extractSync(opt)
    : extract(opt)
};

// construct a filter that limits the file entries listed
// include child entries if a dir is included
const filesFilter = (opt, files) => {
  const map = new Map(files.map(f => [f.replace(/\/+$/, ''), true]));
  const filter = opt.filter;

  const mapHas = (file, r) => {
    const root = r || path$5.parse(file).root || '.';
    const ret = file === root ? false
      : map.has(file) ? map.get(file)
      : mapHas(path$5.dirname(file), root);

    map.set(file, ret);
    return ret
  };

  opt.filter = filter
    ? (file, entry) => filter(file, entry) && mapHas(file.replace(/\/+$/, ''))
    : file => mapHas(file.replace(/\/+$/, ''));
};

const extractFileSync = opt => {
  const u = new Unpack.Sync(opt);

  const file = opt.file;
  const stat = fs$6.statSync(file);
  // This trades a zero-byte read() syscall for a stat
  // However, it will usually result in less memory allocation
  const readSize = opt.maxReadSize || 16 * 1024 * 1024;
  const stream = new fsm.ReadStreamSync(file, {
    readSize: readSize,
    size: stat.size,
  });
  stream.pipe(u);
};

const extractFile = (opt, cb) => {
  const u = new Unpack(opt);
  const readSize = opt.maxReadSize || 16 * 1024 * 1024;

  const file = opt.file;
  const p = new Promise((resolve, reject) => {
    u.on('error', reject);
    u.on('close', resolve);

    // This trades a zero-byte read() syscall for a stat
    // However, it will usually result in less memory allocation
    fs$6.stat(file, (er, stat) => {
      if (er)
        reject(er);
      else {
        const stream = new fsm.ReadStream(file, {
          readSize: readSize,
          size: stat.size,
        });
        stream.on('error', reject);
        stream.pipe(u);
      }
    });
  });
  return cb ? p.then(cb, cb) : p
};

const extractSync = opt => new Unpack.Sync(opt);

const extract = opt => new Unpack(opt);

// high-level commands
tar$1.c = tar$1.create = create_1;
tar$1.r = tar$1.replace = replace_1;
tar$1.t = tar$1.list = list_1;
tar$1.u = tar$1.update = update;
tar$1.x = tar$1.extract = extract_1;

// classes
tar$1.Pack = pack;
tar$1.Unpack = unpack;
tar$1.Parse = parse$2;
tar$1.ReadEntry = readEntry;
tar$1.WriteEntry = writeEntry;
tar$1.Header = header;
tar$1.Pax = pax;
tar$1.types = types$1;

var colorette$1 = {};

let enabled =
  !("NO_COLOR" in process.env) &&
  ("FORCE_COLOR" in process.env ||
    process.platform === "win32" ||
    (process.stdout != null &&
      process.stdout.isTTY &&
      process.env.TERM &&
      process.env.TERM !== "dumb"));

const raw = (open, close, searchRegex, replaceValue) => (s) =>
  enabled
    ? open +
      (~(s += "").indexOf(close, 4) // skip opening \x1b[
        ? s.replace(searchRegex, replaceValue)
        : s) +
      close
    : s;

const init$1 = (open, close) => {
  return raw(
    `\x1b[${open}m`,
    `\x1b[${close}m`,
    new RegExp(`\\x1b\\[${close}m`, "g"),
    `\x1b[${open}m`
  )
};

colorette$1.options = Object.defineProperty({}, "enabled", {
  get: () => enabled,
  set: (value) => (enabled = value),
});

colorette$1.reset = init$1(0, 0);
colorette$1.bold = raw("\x1b[1m", "\x1b[22m", /\x1b\[22m/g, "\x1b[22m\x1b[1m");
colorette$1.dim = raw("\x1b[2m", "\x1b[22m", /\x1b\[22m/g, "\x1b[22m\x1b[2m");
colorette$1.italic = init$1(3, 23);
colorette$1.underline = init$1(4, 24);
colorette$1.inverse = init$1(7, 27);
colorette$1.hidden = init$1(8, 28);
colorette$1.strikethrough = init$1(9, 29);
colorette$1.black = init$1(30, 39);
colorette$1.red = init$1(31, 39);
colorette$1.green = init$1(32, 39);
colorette$1.yellow = init$1(33, 39);
colorette$1.blue = init$1(34, 39);
colorette$1.magenta = init$1(35, 39);
colorette$1.cyan = init$1(36, 39);
colorette$1.white = init$1(37, 39);
colorette$1.gray = init$1(90, 39);
colorette$1.bgBlack = init$1(40, 49);
colorette$1.bgRed = init$1(41, 49);
colorette$1.bgGreen = init$1(42, 49);
colorette$1.bgYellow = init$1(43, 49);
colorette$1.bgBlue = init$1(44, 49);
colorette$1.bgMagenta = init$1(45, 49);
colorette$1.bgCyan = init$1(46, 49);
colorette$1.bgWhite = init$1(47, 49);
colorette$1.blackBright = init$1(90, 39);
colorette$1.redBright = init$1(91, 39);
colorette$1.greenBright = init$1(92, 39);
colorette$1.yellowBright = init$1(93, 39);
colorette$1.blueBright = init$1(94, 39);
colorette$1.magentaBright = init$1(95, 39);
colorette$1.cyanBright = init$1(96, 39);
colorette$1.whiteBright = init$1(97, 39);
colorette$1.bgBlackBright = init$1(100, 49);
colorette$1.bgRedBright = init$1(101, 49);
colorette$1.bgGreenBright = init$1(102, 49);
colorette$1.bgYellowBright = init$1(103, 49);
colorette$1.bgBlueBright = init$1(104, 49);
colorette$1.bgMagentaBright = init$1(105, 49);
colorette$1.bgCyanBright = init$1(106, 49);
colorette$1.bgWhiteBright = init$1(107, 49);

var indexE42359c2 = {};

const os = os$1;

var homeOrTmp$1 = os.homedir() || os.tmpdir();

var agent = {};

var src$1 = {exports: {}};

var browser = {exports: {}};

/**
 * Helpers.
 */

var ms;
var hasRequiredMs;

function requireMs () {
	if (hasRequiredMs) return ms;
	hasRequiredMs = 1;
	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} [options]
	 * @throws {Error} throw an error if val is not a non-empty string or a number
	 * @return {String|Number}
	 * @api public
	 */

	ms = function(val, options) {
	  options = options || {};
	  var type = typeof val;
	  if (type === 'string' && val.length > 0) {
	    return parse(val);
	  } else if (type === 'number' && isFinite(val)) {
	    return options.long ? fmtLong(val) : fmtShort(val);
	  }
	  throw new Error(
	    'val is not a non-empty string or a valid number. val=' +
	      JSON.stringify(val)
	  );
	};

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = String(str);
	  if (str.length > 100) {
	    return;
	  }
	  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
	    str
	  );
	  if (!match) {
	    return;
	  }
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y;
	    case 'weeks':
	    case 'week':
	    case 'w':
	      return n * w;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s;
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n;
	    default:
	      return undefined;
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtShort(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return Math.round(ms / d) + 'd';
	  }
	  if (msAbs >= h) {
	    return Math.round(ms / h) + 'h';
	  }
	  if (msAbs >= m) {
	    return Math.round(ms / m) + 'm';
	  }
	  if (msAbs >= s) {
	    return Math.round(ms / s) + 's';
	  }
	  return ms + 'ms';
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtLong(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return plural(ms, msAbs, d, 'day');
	  }
	  if (msAbs >= h) {
	    return plural(ms, msAbs, h, 'hour');
	  }
	  if (msAbs >= m) {
	    return plural(ms, msAbs, m, 'minute');
	  }
	  if (msAbs >= s) {
	    return plural(ms, msAbs, s, 'second');
	  }
	  return ms + ' ms';
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, msAbs, n, name) {
	  var isPlural = msAbs >= n * 1.5;
	  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
	}
	return ms;
}

var common$1;
var hasRequiredCommon$1;

function requireCommon$1 () {
	if (hasRequiredCommon$1) return common$1;
	hasRequiredCommon$1 = 1;
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 */

	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = requireMs();
		createDebug.destroy = destroy;

		Object.keys(env).forEach(key => {
			createDebug[key] = env[key];
		});

		/**
		* The currently active debug mode names, and names to skip.
		*/

		createDebug.names = [];
		createDebug.skips = [];

		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};

		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;

			for (let i = 0; i < namespace.length; i++) {
				hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
				hash |= 0; // Convert to 32bit integer
			}

			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;

		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;

			function debug(...args) {
				// Disabled?
				if (!debug.enabled) {
					return;
				}

				const self = debug;

				// Set `diff` timestamp
				const curr = Number(new Date());
				const ms = curr - (prevTime || curr);
				self.diff = ms;
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;

				args[0] = createDebug.coerce(args[0]);

				if (typeof args[0] !== 'string') {
					// Anything else let's inspect with %O
					args.unshift('%O');
				}

				// Apply any `formatters` transformations
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					// If we encounter an escaped % then don't increase the array index
					if (match === '%%') {
						return '%';
					}
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === 'function') {
						const val = args[index];
						match = formatter.call(self, val);

						// Now we need to remove `args[index]` since it's inlined in the `format`
						args.splice(index, 1);
						index--;
					}
					return match;
				});

				// Apply env-specific formatting (colors, etc.)
				createDebug.formatArgs.call(self, args);

				const logFn = self.log || createDebug.log;
				logFn.apply(self, args);
			}

			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

			Object.defineProperty(debug, 'enabled', {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) {
						return enableOverride;
					}
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}

					return enabledCache;
				},
				set: v => {
					enableOverride = v;
				}
			});

			// Env-specific initialization logic for debug instances
			if (typeof createDebug.init === 'function') {
				createDebug.init(debug);
			}

			return debug;
		}

		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}

		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;

			createDebug.names = [];
			createDebug.skips = [];

			let i;
			const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
			const len = split.length;

			for (i = 0; i < len; i++) {
				if (!split[i]) {
					// ignore empty strings
					continue;
				}

				namespaces = split[i].replace(/\*/g, '.*?');

				if (namespaces[0] === '-') {
					createDebug.skips.push(new RegExp('^' + namespaces.slice(1) + '$'));
				} else {
					createDebug.names.push(new RegExp('^' + namespaces + '$'));
				}
			}
		}

		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [
				...createDebug.names.map(toNamespace),
				...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
			].join(',');
			createDebug.enable('');
			return namespaces;
		}

		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			if (name[name.length - 1] === '*') {
				return true;
			}

			let i;
			let len;

			for (i = 0, len = createDebug.skips.length; i < len; i++) {
				if (createDebug.skips[i].test(name)) {
					return false;
				}
			}

			for (i = 0, len = createDebug.names.length; i < len; i++) {
				if (createDebug.names[i].test(name)) {
					return true;
				}
			}

			return false;
		}

		/**
		* Convert regexp to namespace
		*
		* @param {RegExp} regxep
		* @return {String} namespace
		* @api private
		*/
		function toNamespace(regexp) {
			return regexp.toString()
				.substring(2, regexp.toString().length - 2)
				.replace(/\.\*\?$/, '*');
		}

		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) {
				return val.stack || val.message;
			}
			return val;
		}

		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}

		createDebug.enable(createDebug.load());

		return createDebug;
	}

	common$1 = setup;
	return common$1;
}

/* eslint-env browser */

var hasRequiredBrowser;

function requireBrowser () {
	if (hasRequiredBrowser) return browser.exports;
	hasRequiredBrowser = 1;
	(function (module, exports) {
		/**
		 * This is the web browser implementation of `debug()`.
		 */

		exports.formatArgs = formatArgs;
		exports.save = save;
		exports.load = load;
		exports.useColors = useColors;
		exports.storage = localstorage();
		exports.destroy = (() => {
			let warned = false;

			return () => {
				if (!warned) {
					warned = true;
					console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
				}
			};
		})();

		/**
		 * Colors.
		 */

		exports.colors = [
			'#0000CC',
			'#0000FF',
			'#0033CC',
			'#0033FF',
			'#0066CC',
			'#0066FF',
			'#0099CC',
			'#0099FF',
			'#00CC00',
			'#00CC33',
			'#00CC66',
			'#00CC99',
			'#00CCCC',
			'#00CCFF',
			'#3300CC',
			'#3300FF',
			'#3333CC',
			'#3333FF',
			'#3366CC',
			'#3366FF',
			'#3399CC',
			'#3399FF',
			'#33CC00',
			'#33CC33',
			'#33CC66',
			'#33CC99',
			'#33CCCC',
			'#33CCFF',
			'#6600CC',
			'#6600FF',
			'#6633CC',
			'#6633FF',
			'#66CC00',
			'#66CC33',
			'#9900CC',
			'#9900FF',
			'#9933CC',
			'#9933FF',
			'#99CC00',
			'#99CC33',
			'#CC0000',
			'#CC0033',
			'#CC0066',
			'#CC0099',
			'#CC00CC',
			'#CC00FF',
			'#CC3300',
			'#CC3333',
			'#CC3366',
			'#CC3399',
			'#CC33CC',
			'#CC33FF',
			'#CC6600',
			'#CC6633',
			'#CC9900',
			'#CC9933',
			'#CCCC00',
			'#CCCC33',
			'#FF0000',
			'#FF0033',
			'#FF0066',
			'#FF0099',
			'#FF00CC',
			'#FF00FF',
			'#FF3300',
			'#FF3333',
			'#FF3366',
			'#FF3399',
			'#FF33CC',
			'#FF33FF',
			'#FF6600',
			'#FF6633',
			'#FF9900',
			'#FF9933',
			'#FFCC00',
			'#FFCC33'
		];

		/**
		 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
		 * and the Firebug extension (any Firefox version) are known
		 * to support "%c" CSS customizations.
		 *
		 * TODO: add a `localStorage` variable to explicitly enable/disable colors
		 */

		// eslint-disable-next-line complexity
		function useColors() {
			// NB: In an Electron preload script, document will be defined but not fully
			// initialized. Since we know we're in Chrome, we'll just detect this case
			// explicitly
			if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
				return true;
			}

			// Internet Explorer and Edge do not support colors.
			if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
				return false;
			}

			// Is webkit? http://stackoverflow.com/a/16459606/376773
			// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
			return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
				// Is firebug? http://stackoverflow.com/a/398120/376773
				(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
				// Is firefox >= v31?
				// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
				(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
				// Double check webkit in userAgent just in case we are in a worker
				(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
		}

		/**
		 * Colorize log arguments if enabled.
		 *
		 * @api public
		 */

		function formatArgs(args) {
			args[0] = (this.useColors ? '%c' : '') +
				this.namespace +
				(this.useColors ? ' %c' : ' ') +
				args[0] +
				(this.useColors ? '%c ' : ' ') +
				'+' + module.exports.humanize(this.diff);

			if (!this.useColors) {
				return;
			}

			const c = 'color: ' + this.color;
			args.splice(1, 0, c, 'color: inherit');

			// The final "%c" is somewhat tricky, because there could be other
			// arguments passed either before or after the %c, so we need to
			// figure out the correct index to insert the CSS into
			let index = 0;
			let lastC = 0;
			args[0].replace(/%[a-zA-Z%]/g, match => {
				if (match === '%%') {
					return;
				}
				index++;
				if (match === '%c') {
					// We only are interested in the *last* %c
					// (the user may have provided their own)
					lastC = index;
				}
			});

			args.splice(lastC, 0, c);
		}

		/**
		 * Invokes `console.debug()` when available.
		 * No-op when `console.debug` is not a "function".
		 * If `console.debug` is not available, falls back
		 * to `console.log`.
		 *
		 * @api public
		 */
		exports.log = console.debug || console.log || (() => {});

		/**
		 * Save `namespaces`.
		 *
		 * @param {String} namespaces
		 * @api private
		 */
		function save(namespaces) {
			try {
				if (namespaces) {
					exports.storage.setItem('debug', namespaces);
				} else {
					exports.storage.removeItem('debug');
				}
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}
		}

		/**
		 * Load `namespaces`.
		 *
		 * @return {String} returns the previously persisted debug modes
		 * @api private
		 */
		function load() {
			let r;
			try {
				r = exports.storage.getItem('debug');
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}

			// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
			if (!r && typeof process !== 'undefined' && 'env' in process) {
				r = process.env.DEBUG;
			}

			return r;
		}

		/**
		 * Localstorage attempts to return the localstorage.
		 *
		 * This is necessary because safari throws
		 * when a user disables cookies/localstorage
		 * and you attempt to access it.
		 *
		 * @return {LocalStorage}
		 * @api private
		 */

		function localstorage() {
			try {
				// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
				// The Browser also has localStorage in the global context.
				return localStorage;
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}
		}

		module.exports = requireCommon$1()(exports);

		const {formatters} = module.exports;

		/**
		 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
		 */

		formatters.j = function (v) {
			try {
				return JSON.stringify(v);
			} catch (error) {
				return '[UnexpectedJSONParseError]: ' + error.message;
			}
		};
} (browser, browser.exports));
	return browser.exports;
}

var node = {exports: {}};

var hasFlag;
var hasRequiredHasFlag;

function requireHasFlag () {
	if (hasRequiredHasFlag) return hasFlag;
	hasRequiredHasFlag = 1;

	hasFlag = (flag, argv = process.argv) => {
		const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
		const position = argv.indexOf(prefix + flag);
		const terminatorPosition = argv.indexOf('--');
		return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
	};
	return hasFlag;
}

var supportsColor_1;
var hasRequiredSupportsColor;

function requireSupportsColor () {
	if (hasRequiredSupportsColor) return supportsColor_1;
	hasRequiredSupportsColor = 1;
	const os = os$1;
	const tty = tty__default;
	const hasFlag = requireHasFlag();

	const {env} = process;

	let forceColor;
	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false') ||
		hasFlag('color=never')) {
		forceColor = 0;
	} else if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		forceColor = 1;
	}

	if ('FORCE_COLOR' in env) {
		if (env.FORCE_COLOR === 'true') {
			forceColor = 1;
		} else if (env.FORCE_COLOR === 'false') {
			forceColor = 0;
		} else {
			forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
		}
	}

	function translateLevel(level) {
		if (level === 0) {
			return false;
		}

		return {
			level,
			hasBasic: true,
			has256: level >= 2,
			has16m: level >= 3
		};
	}

	function supportsColor(haveStream, streamIsTTY) {
		if (forceColor === 0) {
			return 0;
		}

		if (hasFlag('color=16m') ||
			hasFlag('color=full') ||
			hasFlag('color=truecolor')) {
			return 3;
		}

		if (hasFlag('color=256')) {
			return 2;
		}

		if (haveStream && !streamIsTTY && forceColor === undefined) {
			return 0;
		}

		const min = forceColor || 0;

		if (env.TERM === 'dumb') {
			return min;
		}

		if (process.platform === 'win32') {
			// Windows 10 build 10586 is the first Windows release that supports 256 colors.
			// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
			const osRelease = os.release().split('.');
			if (
				Number(osRelease[0]) >= 10 &&
				Number(osRelease[2]) >= 10586
			) {
				return Number(osRelease[2]) >= 14931 ? 3 : 2;
			}

			return 1;
		}

		if ('CI' in env) {
			if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI', 'GITHUB_ACTIONS', 'BUILDKITE'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
				return 1;
			}

			return min;
		}

		if ('TEAMCITY_VERSION' in env) {
			return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
		}

		if (env.COLORTERM === 'truecolor') {
			return 3;
		}

		if ('TERM_PROGRAM' in env) {
			const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

			switch (env.TERM_PROGRAM) {
				case 'iTerm.app':
					return version >= 3 ? 3 : 2;
				case 'Apple_Terminal':
					return 2;
				// No default
			}
		}

		if (/-256(color)?$/i.test(env.TERM)) {
			return 2;
		}

		if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
			return 1;
		}

		if ('COLORTERM' in env) {
			return 1;
		}

		return min;
	}

	function getSupportLevel(stream) {
		const level = supportsColor(stream, stream && stream.isTTY);
		return translateLevel(level);
	}

	supportsColor_1 = {
		supportsColor: getSupportLevel,
		stdout: translateLevel(supportsColor(true, tty.isatty(1))),
		stderr: translateLevel(supportsColor(true, tty.isatty(2)))
	};
	return supportsColor_1;
}

/**
 * Module dependencies.
 */

var hasRequiredNode;

function requireNode () {
	if (hasRequiredNode) return node.exports;
	hasRequiredNode = 1;
	(function (module, exports) {
		const tty = tty__default;
		const util = require$$2$1;

		/**
		 * This is the Node.js implementation of `debug()`.
		 */

		exports.init = init;
		exports.log = log;
		exports.formatArgs = formatArgs;
		exports.save = save;
		exports.load = load;
		exports.useColors = useColors;
		exports.destroy = util.deprecate(
			() => {},
			'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
		);

		/**
		 * Colors.
		 */

		exports.colors = [6, 2, 3, 4, 5, 1];

		try {
			// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
			// eslint-disable-next-line import/no-extraneous-dependencies
			const supportsColor = requireSupportsColor();

			if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
				exports.colors = [
					20,
					21,
					26,
					27,
					32,
					33,
					38,
					39,
					40,
					41,
					42,
					43,
					44,
					45,
					56,
					57,
					62,
					63,
					68,
					69,
					74,
					75,
					76,
					77,
					78,
					79,
					80,
					81,
					92,
					93,
					98,
					99,
					112,
					113,
					128,
					129,
					134,
					135,
					148,
					149,
					160,
					161,
					162,
					163,
					164,
					165,
					166,
					167,
					168,
					169,
					170,
					171,
					172,
					173,
					178,
					179,
					184,
					185,
					196,
					197,
					198,
					199,
					200,
					201,
					202,
					203,
					204,
					205,
					206,
					207,
					208,
					209,
					214,
					215,
					220,
					221
				];
			}
		} catch (error) {
			// Swallow - we only care if `supports-color` is available; it doesn't have to be.
		}

		/**
		 * Build up the default `inspectOpts` object from the environment variables.
		 *
		 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
		 */

		exports.inspectOpts = Object.keys(process.env).filter(key => {
			return /^debug_/i.test(key);
		}).reduce((obj, key) => {
			// Camel-case
			const prop = key
				.substring(6)
				.toLowerCase()
				.replace(/_([a-z])/g, (_, k) => {
					return k.toUpperCase();
				});

			// Coerce string value into JS value
			let val = process.env[key];
			if (/^(yes|on|true|enabled)$/i.test(val)) {
				val = true;
			} else if (/^(no|off|false|disabled)$/i.test(val)) {
				val = false;
			} else if (val === 'null') {
				val = null;
			} else {
				val = Number(val);
			}

			obj[prop] = val;
			return obj;
		}, {});

		/**
		 * Is stdout a TTY? Colored output is enabled when `true`.
		 */

		function useColors() {
			return 'colors' in exports.inspectOpts ?
				Boolean(exports.inspectOpts.colors) :
				tty.isatty(process.stderr.fd);
		}

		/**
		 * Adds ANSI color escape codes if enabled.
		 *
		 * @api public
		 */

		function formatArgs(args) {
			const {namespace: name, useColors} = this;

			if (useColors) {
				const c = this.color;
				const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
				const prefix = `  ${colorCode};1m${name} \u001B[0m`;

				args[0] = prefix + args[0].split('\n').join('\n' + prefix);
				args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
			} else {
				args[0] = getDate() + name + ' ' + args[0];
			}
		}

		function getDate() {
			if (exports.inspectOpts.hideDate) {
				return '';
			}
			return new Date().toISOString() + ' ';
		}

		/**
		 * Invokes `util.format()` with the specified arguments and writes to stderr.
		 */

		function log(...args) {
			return process.stderr.write(util.format(...args) + '\n');
		}

		/**
		 * Save `namespaces`.
		 *
		 * @param {String} namespaces
		 * @api private
		 */
		function save(namespaces) {
			if (namespaces) {
				process.env.DEBUG = namespaces;
			} else {
				// If you set a process.env field to null or undefined, it gets cast to the
				// string 'null' or 'undefined'. Just delete instead.
				delete process.env.DEBUG;
			}
		}

		/**
		 * Load `namespaces`.
		 *
		 * @return {String} returns the previously persisted debug modes
		 * @api private
		 */

		function load() {
			return process.env.DEBUG;
		}

		/**
		 * Init logic for `debug` instances.
		 *
		 * Create a new `inspectOpts` object in case `useColors` is set
		 * differently for a particular `debug` instance.
		 */

		function init(debug) {
			debug.inspectOpts = {};

			const keys = Object.keys(exports.inspectOpts);
			for (let i = 0; i < keys.length; i++) {
				debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
			}
		}

		module.exports = requireCommon$1()(exports);

		const {formatters} = module.exports;

		/**
		 * Map %o to `util.inspect()`, all on a single line.
		 */

		formatters.o = function (v) {
			this.inspectOpts.colors = this.useColors;
			return util.inspect(v, this.inspectOpts)
				.split('\n')
				.map(str => str.trim())
				.join(' ');
		};

		/**
		 * Map %O to `util.inspect()`, allowing multiple lines if needed.
		 */

		formatters.O = function (v) {
			this.inspectOpts.colors = this.useColors;
			return util.inspect(v, this.inspectOpts);
		};
} (node, node.exports));
	return node.exports;
}

/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */

(function (module) {
	if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
		module.exports = requireBrowser();
	} else {
		module.exports = requireNode();
	}
} (src$1));

var promisify$1 = {};

Object.defineProperty(promisify$1, "__esModule", { value: true });
function promisify(fn) {
    return function (req, opts) {
        return new Promise((resolve, reject) => {
            fn.call(this, req, opts, (err, rtn) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rtn);
                }
            });
        });
    };
}
promisify$1.default = promisify;

var __importDefault$3 = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const events_1 = require$$0;
const debug_1$2 = __importDefault$3(src$1.exports);
const promisify_1 = __importDefault$3(promisify$1);
const debug$3 = debug_1$2.default('agent-base');
function isAgent(v) {
    return Boolean(v) && typeof v.addRequest === 'function';
}
function isSecureEndpoint() {
    const { stack } = new Error();
    if (typeof stack !== 'string')
        return false;
    return stack.split('\n').some(l => l.indexOf('(https.js:') !== -1 || l.indexOf('node:https:') !== -1);
}
function createAgent(callback, opts) {
    return new createAgent.Agent(callback, opts);
}
(function (createAgent) {
    /**
     * Base `http.Agent` implementation.
     * No pooling/keep-alive is implemented by default.
     *
     * @param {Function} callback
     * @api public
     */
    class Agent extends events_1.EventEmitter {
        constructor(callback, _opts) {
            super();
            let opts = _opts;
            if (typeof callback === 'function') {
                this.callback = callback;
            }
            else if (callback) {
                opts = callback;
            }
            // Timeout for the socket to be returned from the callback
            this.timeout = null;
            if (opts && typeof opts.timeout === 'number') {
                this.timeout = opts.timeout;
            }
            // These aren't actually used by `agent-base`, but are required
            // for the TypeScript definition files in `@types/node` :/
            this.maxFreeSockets = 1;
            this.maxSockets = 1;
            this.maxTotalSockets = Infinity;
            this.sockets = {};
            this.freeSockets = {};
            this.requests = {};
            this.options = {};
        }
        get defaultPort() {
            if (typeof this.explicitDefaultPort === 'number') {
                return this.explicitDefaultPort;
            }
            return isSecureEndpoint() ? 443 : 80;
        }
        set defaultPort(v) {
            this.explicitDefaultPort = v;
        }
        get protocol() {
            if (typeof this.explicitProtocol === 'string') {
                return this.explicitProtocol;
            }
            return isSecureEndpoint() ? 'https:' : 'http:';
        }
        set protocol(v) {
            this.explicitProtocol = v;
        }
        callback(req, opts, fn) {
            throw new Error('"agent-base" has no default implementation, you must subclass and override `callback()`');
        }
        /**
         * Called by node-core's "_http_client.js" module when creating
         * a new HTTP request with this Agent instance.
         *
         * @api public
         */
        addRequest(req, _opts) {
            const opts = Object.assign({}, _opts);
            if (typeof opts.secureEndpoint !== 'boolean') {
                opts.secureEndpoint = isSecureEndpoint();
            }
            if (opts.host == null) {
                opts.host = 'localhost';
            }
            if (opts.port == null) {
                opts.port = opts.secureEndpoint ? 443 : 80;
            }
            if (opts.protocol == null) {
                opts.protocol = opts.secureEndpoint ? 'https:' : 'http:';
            }
            if (opts.host && opts.path) {
                // If both a `host` and `path` are specified then it's most
                // likely the result of a `url.parse()` call... we need to
                // remove the `path` portion so that `net.connect()` doesn't
                // attempt to open that as a unix socket file.
                delete opts.path;
            }
            delete opts.agent;
            delete opts.hostname;
            delete opts._defaultAgent;
            delete opts.defaultPort;
            delete opts.createConnection;
            // Hint to use "Connection: close"
            // XXX: non-documented `http` module API :(
            req._last = true;
            req.shouldKeepAlive = false;
            let timedOut = false;
            let timeoutId = null;
            const timeoutMs = opts.timeout || this.timeout;
            const onerror = (err) => {
                if (req._hadError)
                    return;
                req.emit('error', err);
                // For Safety. Some additional errors might fire later on
                // and we need to make sure we don't double-fire the error event.
                req._hadError = true;
            };
            const ontimeout = () => {
                timeoutId = null;
                timedOut = true;
                const err = new Error(`A "socket" was not created for HTTP request before ${timeoutMs}ms`);
                err.code = 'ETIMEOUT';
                onerror(err);
            };
            const callbackError = (err) => {
                if (timedOut)
                    return;
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                onerror(err);
            };
            const onsocket = (socket) => {
                if (timedOut)
                    return;
                if (timeoutId != null) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                if (isAgent(socket)) {
                    // `socket` is actually an `http.Agent` instance, so
                    // relinquish responsibility for this `req` to the Agent
                    // from here on
                    debug$3('Callback returned another Agent instance %o', socket.constructor.name);
                    socket.addRequest(req, opts);
                    return;
                }
                if (socket) {
                    socket.once('free', () => {
                        this.freeSocket(socket, opts);
                    });
                    req.onSocket(socket);
                    return;
                }
                const err = new Error(`no Duplex stream was returned to agent-base for \`${req.method} ${req.path}\``);
                onerror(err);
            };
            if (typeof this.callback !== 'function') {
                onerror(new Error('`callback` is not defined'));
                return;
            }
            if (!this.promisifiedCallback) {
                if (this.callback.length >= 3) {
                    debug$3('Converting legacy callback function to promise');
                    this.promisifiedCallback = promisify_1.default(this.callback);
                }
                else {
                    this.promisifiedCallback = this.callback;
                }
            }
            if (typeof timeoutMs === 'number' && timeoutMs > 0) {
                timeoutId = setTimeout(ontimeout, timeoutMs);
            }
            if ('port' in opts && typeof opts.port !== 'number') {
                opts.port = Number(opts.port);
            }
            try {
                debug$3('Resolving socket for %o request: %o', opts.protocol, `${req.method} ${req.path}`);
                Promise.resolve(this.promisifiedCallback(req, opts)).then(onsocket, callbackError);
            }
            catch (err) {
                Promise.reject(err).catch(callbackError);
            }
        }
        freeSocket(socket, opts) {
            debug$3('Freeing socket %o %o', socket.constructor.name, opts);
            socket.destroy();
        }
        destroy() {
            debug$3('Destroying agent %o', this.constructor.name);
        }
    }
    createAgent.Agent = Agent;
    // So that `instanceof` works correctly
    createAgent.prototype = createAgent.Agent.prototype;
})(createAgent || (createAgent = {}));
var src = createAgent;

var parseProxyResponse$1 = {};

var __importDefault$2 = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(parseProxyResponse$1, "__esModule", { value: true });
const debug_1$1 = __importDefault$2(src$1.exports);
const debug$2 = debug_1$1.default('https-proxy-agent:parse-proxy-response');
function parseProxyResponse(socket) {
    return new Promise((resolve, reject) => {
        // we need to buffer any HTTP traffic that happens with the proxy before we get
        // the CONNECT response, so that if the response is anything other than an "200"
        // response code, then we can re-play the "data" events on the socket once the
        // HTTP parser is hooked up...
        let buffersLength = 0;
        const buffers = [];
        function read() {
            const b = socket.read();
            if (b)
                ondata(b);
            else
                socket.once('readable', read);
        }
        function cleanup() {
            socket.removeListener('end', onend);
            socket.removeListener('error', onerror);
            socket.removeListener('close', onclose);
            socket.removeListener('readable', read);
        }
        function onclose(err) {
            debug$2('onclose had error %o', err);
        }
        function onend() {
            debug$2('onend');
        }
        function onerror(err) {
            cleanup();
            debug$2('onerror %o', err);
            reject(err);
        }
        function ondata(b) {
            buffers.push(b);
            buffersLength += b.length;
            const buffered = Buffer.concat(buffers, buffersLength);
            const endOfHeaders = buffered.indexOf('\r\n\r\n');
            if (endOfHeaders === -1) {
                // keep buffering
                debug$2('have not received end of HTTP headers yet...');
                read();
                return;
            }
            const firstLine = buffered.toString('ascii', 0, buffered.indexOf('\r\n'));
            const statusCode = +firstLine.split(' ')[1];
            debug$2('got proxy server response: %o', firstLine);
            resolve({
                statusCode,
                buffered
            });
        }
        socket.on('error', onerror);
        socket.on('close', onclose);
        socket.on('end', onend);
        read();
    });
}
parseProxyResponse$1.default = parseProxyResponse;

var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault$1 = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(agent, "__esModule", { value: true });
const net_1 = __importDefault$1(require$$0$4);
const tls_1 = __importDefault$1(require$$1$3);
const url_1 = __importDefault$1(require$$7);
const assert_1 = __importDefault$1(require$$0$2);
const debug_1 = __importDefault$1(src$1.exports);
const agent_base_1 = src;
const parse_proxy_response_1 = __importDefault$1(parseProxyResponse$1);
const debug$1 = debug_1.default('https-proxy-agent:agent');
/**
 * The `HttpsProxyAgent` implements an HTTP Agent subclass that connects to
 * the specified "HTTP(s) proxy server" in order to proxy HTTPS requests.
 *
 * Outgoing HTTP requests are first tunneled through the proxy server using the
 * `CONNECT` HTTP request method to establish a connection to the proxy server,
 * and then the proxy server connects to the destination target and issues the
 * HTTP request from the proxy server.
 *
 * `https:` requests have their socket connection upgraded to TLS once
 * the connection to the proxy server has been established.
 *
 * @api public
 */
class HttpsProxyAgent extends agent_base_1.Agent {
    constructor(_opts) {
        let opts;
        if (typeof _opts === 'string') {
            opts = url_1.default.parse(_opts);
        }
        else {
            opts = _opts;
        }
        if (!opts) {
            throw new Error('an HTTP(S) proxy server `host` and `port` must be specified!');
        }
        debug$1('creating new HttpsProxyAgent instance: %o', opts);
        super(opts);
        const proxy = Object.assign({}, opts);
        // If `true`, then connect to the proxy server over TLS.
        // Defaults to `false`.
        this.secureProxy = opts.secureProxy || isHTTPS(proxy.protocol);
        // Prefer `hostname` over `host`, and set the `port` if needed.
        proxy.host = proxy.hostname || proxy.host;
        if (typeof proxy.port === 'string') {
            proxy.port = parseInt(proxy.port, 10);
        }
        if (!proxy.port && proxy.host) {
            proxy.port = this.secureProxy ? 443 : 80;
        }
        // ALPN is supported by Node.js >= v5.
        // attempt to negotiate http/1.1 for proxy servers that support http/2
        if (this.secureProxy && !('ALPNProtocols' in proxy)) {
            proxy.ALPNProtocols = ['http 1.1'];
        }
        if (proxy.host && proxy.path) {
            // If both a `host` and `path` are specified then it's most likely
            // the result of a `url.parse()` call... we need to remove the
            // `path` portion so that `net.connect()` doesn't attempt to open
            // that as a Unix socket file.
            delete proxy.path;
            delete proxy.pathname;
        }
        this.proxy = proxy;
    }
    /**
     * Called when the node-core HTTP client library is creating a
     * new HTTP request.
     *
     * @api protected
     */
    callback(req, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { proxy, secureProxy } = this;
            // Create a socket connection to the proxy server.
            let socket;
            if (secureProxy) {
                debug$1('Creating `tls.Socket`: %o', proxy);
                socket = tls_1.default.connect(proxy);
            }
            else {
                debug$1('Creating `net.Socket`: %o', proxy);
                socket = net_1.default.connect(proxy);
            }
            const headers = Object.assign({}, proxy.headers);
            const hostname = `${opts.host}:${opts.port}`;
            let payload = `CONNECT ${hostname} HTTP/1.1\r\n`;
            // Inject the `Proxy-Authorization` header if necessary.
            if (proxy.auth) {
                headers['Proxy-Authorization'] = `Basic ${Buffer.from(proxy.auth).toString('base64')}`;
            }
            // The `Host` header should only include the port
            // number when it is not the default port.
            let { host, port, secureEndpoint } = opts;
            if (!isDefaultPort(port, secureEndpoint)) {
                host += `:${port}`;
            }
            headers.Host = host;
            headers.Connection = 'close';
            for (const name of Object.keys(headers)) {
                payload += `${name}: ${headers[name]}\r\n`;
            }
            const proxyResponsePromise = parse_proxy_response_1.default(socket);
            socket.write(`${payload}\r\n`);
            const { statusCode, buffered } = yield proxyResponsePromise;
            if (statusCode === 200) {
                req.once('socket', resume);
                if (opts.secureEndpoint) {
                    const servername = opts.servername || opts.host;
                    if (!servername) {
                        throw new Error('Could not determine "servername"');
                    }
                    // The proxy is connecting to a TLS server, so upgrade
                    // this socket connection to a TLS connection.
                    debug$1('Upgrading socket connection to TLS');
                    return tls_1.default.connect(Object.assign(Object.assign({}, omit(opts, 'host', 'hostname', 'path', 'port')), { socket,
                        servername }));
                }
                return socket;
            }
            // Some other status code that's not 200... need to re-play the HTTP
            // header "data" events onto the socket once the HTTP machinery is
            // attached so that the node core `http` can parse and handle the
            // error status code.
            // Close the original socket, and a new "fake" socket is returned
            // instead, so that the proxy doesn't get the HTTP request
            // written to it (which may contain `Authorization` headers or other
            // sensitive data).
            //
            // See: https://hackerone.com/reports/541502
            socket.destroy();
            const fakeSocket = new net_1.default.Socket();
            fakeSocket.readable = true;
            // Need to wait for the "socket" event to re-play the "data" events.
            req.once('socket', (s) => {
                debug$1('replaying proxy buffer for failed request');
                assert_1.default(s.listenerCount('data') > 0);
                // Replay the "buffered" Buffer onto the fake `socket`, since at
                // this point the HTTP module machinery has been hooked up for
                // the user.
                s.push(buffered);
                s.push(null);
            });
            return fakeSocket;
        });
    }
}
agent.default = HttpsProxyAgent;
function resume(socket) {
    socket.resume();
}
function isDefaultPort(port, secure) {
    return Boolean((!secure && port === 80) || (secure && port === 443));
}
function isHTTPS(protocol) {
    return typeof protocol === 'string' ? /^https:?$/i.test(protocol) : false;
}
function omit(obj, ...keys) {
    const ret = {};
    let key;
    for (key in obj) {
        if (!keys.includes(key)) {
            ret[key] = obj[key];
        }
    }
    return ret;
}

var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const agent_1 = __importDefault(agent);
function createHttpsProxyAgent(opts) {
    return new agent_1.default(opts);
}
(function (createHttpsProxyAgent) {
    createHttpsProxyAgent.HttpsProxyAgent = agent_1.default;
    createHttpsProxyAgent.prototype = agent_1.default.prototype;
})(createHttpsProxyAgent || (createHttpsProxyAgent = {}));
var dist$1 = createHttpsProxyAgent;

var sander_cjs = {};

var constants = require$$0$5;

var origCwd = process.cwd;
var cwd = null;

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process);
  return cwd
};
try {
  process.cwd();
} catch (er) {}

// This check is needed until node.js 12 is required
if (typeof process.chdir === 'function') {
  var chdir = process.chdir;
  process.chdir = function (d) {
    cwd = null;
    chdir.call(process, d);
  };
  if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
}

var polyfills$1 = patch$1;

function patch$1 (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs);
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs);
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown);
  fs.fchown = chownFix(fs.fchown);
  fs.lchown = chownFix(fs.lchown);

  fs.chmod = chmodFix(fs.chmod);
  fs.fchmod = chmodFix(fs.fchmod);
  fs.lchmod = chmodFix(fs.lchmod);

  fs.chownSync = chownFixSync(fs.chownSync);
  fs.fchownSync = chownFixSync(fs.fchownSync);
  fs.lchownSync = chownFixSync(fs.lchownSync);

  fs.chmodSync = chmodFixSync(fs.chmodSync);
  fs.fchmodSync = chmodFixSync(fs.fchmodSync);
  fs.lchmodSync = chmodFixSync(fs.lchmodSync);

  fs.stat = statFix(fs.stat);
  fs.fstat = statFix(fs.fstat);
  fs.lstat = statFix(fs.lstat);

  fs.statSync = statFixSync(fs.statSync);
  fs.fstatSync = statFixSync(fs.fstatSync);
  fs.lstatSync = statFixSync(fs.lstatSync);

  // if lchmod/lchown do not exist, then make them no-ops
  if (fs.chmod && !fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchmodSync = function () {};
  }
  if (fs.chown && !fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchownSync = function () {};
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = typeof fs.rename !== 'function' ? fs.rename
    : (function (fs$rename) {
      function rename (from, to, cb) {
        var start = Date.now();
        var backoff = 0;
        fs$rename(from, to, function CB (er) {
          if (er
              && (er.code === "EACCES" || er.code === "EPERM")
              && Date.now() - start < 60000) {
            setTimeout(function() {
              fs.stat(to, function (stater, st) {
                if (stater && stater.code === "ENOENT")
                  fs$rename(from, to, CB);
                else
                  cb(er);
              });
            }, backoff);
            if (backoff < 100)
              backoff += 10;
            return;
          }
          if (cb) cb(er);
        });
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
      return rename
    })(fs.rename);
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = typeof fs.read !== 'function' ? fs.read
  : (function (fs$read) {
    function read (fd, buffer, offset, length, position, callback_) {
      var callback;
      if (callback_ && typeof callback_ === 'function') {
        var eagCounter = 0;
        callback = function (er, _, __) {
          if (er && er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter ++;
            return fs$read.call(fs, fd, buffer, offset, length, position, callback)
          }
          callback_.apply(this, arguments);
        };
      }
      return fs$read.call(fs, fd, buffer, offset, length, position, callback)
    }

    // This ensures `util.promisify` works as it does for native `fs.read`.
    if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
    return read
  })(fs.read);

  fs.readSync = typeof fs.readSync !== 'function' ? fs.readSync
  : (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0;
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++;
          continue
        }
        throw er
      }
    }
  }})(fs.readSync);

  function patchLchmod (fs) {
    fs.lchmod = function (path, mode, callback) {
      fs.open( path
             , constants.O_WRONLY | constants.O_SYMLINK
             , mode
             , function (err, fd) {
        if (err) {
          if (callback) callback(err);
          return
        }
        // prefer to return the chmod error, if one occurs,
        // but still try to close, and report closing errors if they occur.
        fs.fchmod(fd, mode, function (err) {
          fs.close(fd, function(err2) {
            if (callback) callback(err || err2);
          });
        });
      });
    };

    fs.lchmodSync = function (path, mode) {
      var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);

      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      var threw = true;
      var ret;
      try {
        ret = fs.fchmodSync(fd, mode);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd);
          } catch (er) {}
        } else {
          fs.closeSync(fd);
        }
      }
      return ret
    };
  }

  function patchLutimes (fs) {
    if (constants.hasOwnProperty("O_SYMLINK") && fs.futimes) {
      fs.lutimes = function (path, at, mt, cb) {
        fs.open(path, constants.O_SYMLINK, function (er, fd) {
          if (er) {
            if (cb) cb(er);
            return
          }
          fs.futimes(fd, at, mt, function (er) {
            fs.close(fd, function (er2) {
              if (cb) cb(er || er2);
            });
          });
        });
      };

      fs.lutimesSync = function (path, at, mt) {
        var fd = fs.openSync(path, constants.O_SYMLINK);
        var ret;
        var threw = true;
        try {
          ret = fs.futimesSync(fd, at, mt);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs.closeSync(fd);
            } catch (er) {}
          } else {
            fs.closeSync(fd);
          }
        }
        return ret
      };

    } else if (fs.futimes) {
      fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb); };
      fs.lutimesSync = function () {};
    }
  }

  function chmodFix (orig) {
    if (!orig) return orig
    return function (target, mode, cb) {
      return orig.call(fs, target, mode, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chmodFixSync (orig) {
    if (!orig) return orig
    return function (target, mode) {
      try {
        return orig.call(fs, target, mode)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }


  function chownFix (orig) {
    if (!orig) return orig
    return function (target, uid, gid, cb) {
      return orig.call(fs, target, uid, gid, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chownFixSync (orig) {
    if (!orig) return orig
    return function (target, uid, gid) {
      try {
        return orig.call(fs, target, uid, gid)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }

  function statFix (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = null;
      }
      function callback (er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 0x100000000;
          if (stats.gid < 0) stats.gid += 0x100000000;
        }
        if (cb) cb.apply(this, arguments);
      }
      return options ? orig.call(fs, target, options, callback)
        : orig.call(fs, target, callback)
    }
  }

  function statFixSync (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options) {
      var stats = options ? orig.call(fs, target, options)
        : orig.call(fs, target);
      if (stats) {
        if (stats.uid < 0) stats.uid += 0x100000000;
        if (stats.gid < 0) stats.gid += 0x100000000;
      }
      return stats;
    }
  }

  // ENOSYS means that the fs doesn't support the op. Just ignore
  // that, because it doesn't matter.
  //
  // if there's no getuid, or if getuid() is something other
  // than 0, and the error is EINVAL or EPERM, then just ignore
  // it.
  //
  // This specific case is a silent failure in cp, install, tar,
  // and most other unix tools that manage permissions.
  //
  // When running as root, or if other types of errors are
  // encountered, then it's strict.
  function chownErOk (er) {
    if (!er)
      return true

    if (er.code === "ENOSYS")
      return true

    var nonroot = !process.getuid || process.getuid() !== 0;
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM")
        return true
    }

    return false
  }
}

var Stream = require$$1.Stream;

var legacyStreams = legacy$1;

function legacy$1 (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    });
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}

var clone_1 = clone$1;

var getPrototypeOf = Object.getPrototypeOf || function (obj) {
  return obj.__proto__
};

function clone$1 (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: getPrototypeOf(obj) };
  else
    var copy = Object.create(null);

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
  });

  return copy
}

var fs$5 = require$$0$3;
var polyfills = polyfills$1;
var legacy = legacyStreams;
var clone = clone_1;

var util = require$$2$1;

/* istanbul ignore next - node 0.x polyfill */
var gracefulQueue;
var previousSymbol;

/* istanbul ignore else - node 0.x polyfill */
if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
  gracefulQueue = Symbol.for('graceful-fs.queue');
  // This is used in testing by future versions
  previousSymbol = Symbol.for('graceful-fs.previous');
} else {
  gracefulQueue = '___graceful-fs.queue';
  previousSymbol = '___graceful-fs.previous';
}

function noop () {}

function publishQueue(context, queue) {
  Object.defineProperty(context, gracefulQueue, {
    get: function() {
      return queue
    }
  });
}

var debug = noop;
if (util.debuglog)
  debug = util.debuglog('gfs4');
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util.format.apply(util, arguments);
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
    console.error(m);
  };

// Once time initialization
if (!fs$5[gracefulQueue]) {
  // This queue can be shared by multiple loaded instances
  var queue = commonjsGlobal[gracefulQueue] || [];
  publishQueue(fs$5, queue);

  // Patch fs.close/closeSync to shared queue version, because we need
  // to retry() whenever a close happens *anywhere* in the program.
  // This is essential when multiple graceful-fs instances are
  // in play at the same time.
  fs$5.close = (function (fs$close) {
    function close (fd, cb) {
      return fs$close.call(fs$5, fd, function (err) {
        // This function uses the graceful-fs shared queue
        if (!err) {
          resetQueue();
        }

        if (typeof cb === 'function')
          cb.apply(this, arguments);
      })
    }

    Object.defineProperty(close, previousSymbol, {
      value: fs$close
    });
    return close
  })(fs$5.close);

  fs$5.closeSync = (function (fs$closeSync) {
    function closeSync (fd) {
      // This function uses the graceful-fs shared queue
      fs$closeSync.apply(fs$5, arguments);
      resetQueue();
    }

    Object.defineProperty(closeSync, previousSymbol, {
      value: fs$closeSync
    });
    return closeSync
  })(fs$5.closeSync);

  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
    process.on('exit', function() {
      debug(fs$5[gracefulQueue]);
      require$$0$2.equal(fs$5[gracefulQueue].length, 0);
    });
  }
}

if (!commonjsGlobal[gracefulQueue]) {
  publishQueue(commonjsGlobal, fs$5[gracefulQueue]);
}

var gracefulFs = patch(clone(fs$5));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs$5.__patched) {
    gracefulFs = patch(fs$5);
    fs$5.__patched = true;
}

function patch (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs);
  fs.gracefulify = patch;

  fs.createReadStream = createReadStream;
  fs.createWriteStream = createWriteStream;
  var fs$readFile = fs.readFile;
  fs.readFile = readFile;
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb, startTime) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile;
  fs.writeFile = writeFile;
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb, startTime) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile;
  if (fs$appendFile)
    fs.appendFile = appendFile;
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb, startTime) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$copyFile = fs.copyFile;
  if (fs$copyFile)
    fs.copyFile = copyFile;
  function copyFile (src, dest, flags, cb) {
    if (typeof flags === 'function') {
      cb = flags;
      flags = 0;
    }
    return go$copyFile(src, dest, flags, cb)

    function go$copyFile (src, dest, flags, cb, startTime) {
      return fs$copyFile(src, dest, flags, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$copyFile, [src, dest, flags, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$readdir = fs.readdir;
  fs.readdir = readdir;
  var noReaddirOptionVersions = /^v[0-5]\./;
  function readdir (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    var go$readdir = noReaddirOptionVersions.test(process.version)
      ? function go$readdir (path, options, cb, startTime) {
        return fs$readdir(path, fs$readdirCallback(
          path, options, cb, startTime
        ))
      }
      : function go$readdir (path, options, cb, startTime) {
        return fs$readdir(path, options, fs$readdirCallback(
          path, options, cb, startTime
        ))
      };

    return go$readdir(path, options, cb)

    function fs$readdirCallback (path, options, cb, startTime) {
      return function (err, files) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([
            go$readdir,
            [path, options, cb],
            err,
            startTime || Date.now(),
            Date.now()
          ]);
        else {
          if (files && files.sort)
            files.sort();

          if (typeof cb === 'function')
            cb.call(this, err, files);
        }
      }
    }
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacy(fs);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }

  var fs$ReadStream = fs.ReadStream;
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype);
    ReadStream.prototype.open = ReadStream$open;
  }

  var fs$WriteStream = fs.WriteStream;
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype);
    WriteStream.prototype.open = WriteStream$open;
  }

  Object.defineProperty(fs, 'ReadStream', {
    get: function () {
      return ReadStream
    },
    set: function (val) {
      ReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(fs, 'WriteStream', {
    get: function () {
      return WriteStream
    },
    set: function (val) {
      WriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  // legacy names
  var FileReadStream = ReadStream;
  Object.defineProperty(fs, 'FileReadStream', {
    get: function () {
      return FileReadStream
    },
    set: function (val) {
      FileReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileWriteStream = WriteStream;
  Object.defineProperty(fs, 'FileWriteStream', {
    get: function () {
      return FileWriteStream
    },
    set: function (val) {
      FileWriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy();

        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
        that.read();
      }
    });
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy();
        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
      }
    });
  }

  function createReadStream (path, options) {
    return new fs.ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new fs.WriteStream(path, options)
  }

  var fs$open = fs.open;
  fs.open = open;
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null;

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb, startTime) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug('ENQUEUE', elem[0].name, elem[1]);
  fs$5[gracefulQueue].push(elem);
  retry();
}

// keep track of the timeout between retry() calls
var retryTimer;

// reset the startTime and lastTime to now
// this resets the start of the 60 second overall timeout as well as the
// delay between attempts so that we'll retry these jobs sooner
function resetQueue () {
  var now = Date.now();
  for (var i = 0; i < fs$5[gracefulQueue].length; ++i) {
    // entries that are only a length of 2 are from an older version, don't
    // bother modifying those since they'll be retried anyway.
    if (fs$5[gracefulQueue][i].length > 2) {
      fs$5[gracefulQueue][i][3] = now; // startTime
      fs$5[gracefulQueue][i][4] = now; // lastTime
    }
  }
  // call retry to make sure we're actively processing the queue
  retry();
}

function retry () {
  // clear the timer and remove it to help prevent unintended concurrency
  clearTimeout(retryTimer);
  retryTimer = undefined;

  if (fs$5[gracefulQueue].length === 0)
    return

  var elem = fs$5[gracefulQueue].shift();
  var fn = elem[0];
  var args = elem[1];
  // these items may be unset if they were added by an older graceful-fs
  var err = elem[2];
  var startTime = elem[3];
  var lastTime = elem[4];

  // if we don't have a startTime we have no way of knowing if we've waited
  // long enough, so go ahead and retry this item now
  if (startTime === undefined) {
    debug('RETRY', fn.name, args);
    fn.apply(null, args);
  } else if (Date.now() - startTime >= 60000) {
    // it's been more than 60 seconds total, bail now
    debug('TIMEOUT', fn.name, args);
    var cb = args.pop();
    if (typeof cb === 'function')
      cb.call(null, err);
  } else {
    // the amount of time between the last attempt and right now
    var sinceAttempt = Date.now() - lastTime;
    // the amount of time between when we first tried, and when we last tried
    // rounded up to at least 1
    var sinceStart = Math.max(lastTime - startTime, 1);
    // backoff. wait longer than the total time we've been retrying, but only
    // up to a maximum of 100ms
    var desiredDelay = Math.min(sinceStart * 1.2, 100);
    // it's been long enough since the last retry, do it again
    if (sinceAttempt >= desiredDelay) {
      debug('RETRY', fn.name, args);
      fn.apply(null, args.concat([startTime]));
    } else {
      // if we can't do this job yet, push it to the end of the queue
      // and let the next iteration check again
      fs$5[gracefulQueue].push(elem);
    }
  }

  // schedule our next run if one isn't already scheduled
  if (retryTimer === undefined) {
    retryTimer = setTimeout(retry, 0);
  }
}

var path$4 = require$$1$2;
var fs$4 = require$$0$3;
var _0777 = parseInt('0777', 8);

var mkdirp$2 = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

function mkdirP (p, opts, f, made) {
    if (typeof opts === 'function') {
        f = opts;
        opts = {};
    }
    else if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs$4;
    
    if (mode === undefined) {
        mode = _0777;
    }
    if (!made) made = null;
    
    var cb = f || /* istanbul ignore next */ function () {};
    p = path$4.resolve(p);
    
    xfs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                /* istanbul ignore if */
                if (path$4.dirname(p) === p) return cb(er);
                mkdirP(path$4.dirname(p), opts, function (er, made) {
                    /* istanbul ignore if */
                    if (er) cb(er, made);
                    else mkdirP(p, opts, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                xfs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made);
                    else cb(null, made);
                });
                break;
        }
    });
}

mkdirP.sync = function sync (p, opts, made) {
    if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs$4;
    
    if (mode === undefined) {
        mode = _0777;
    }
    if (!made) made = null;

    p = path$4.resolve(p);

    try {
        xfs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = sync(path$4.dirname(p), opts, made);
                sync(p, opts, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = xfs.statSync(p);
                }
                catch (err1) /* istanbul ignore next */ {
                    throw err0;
                }
                /* istanbul ignore if */
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
};

var old = {};

var hasRequiredOld;

function requireOld () {
	if (hasRequiredOld) return old;
	hasRequiredOld = 1;
	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var pathModule = require$$1$2;
	var isWindows = process.platform === 'win32';
	var fs = require$$0$3;

	// JavaScript implementation of realpath, ported from node pre-v6

	var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);

	function rethrow() {
	  // Only enable in debug mode. A backtrace uses ~1000 bytes of heap space and
	  // is fairly slow to generate.
	  var callback;
	  if (DEBUG) {
	    var backtrace = new Error;
	    callback = debugCallback;
	  } else
	    callback = missingCallback;

	  return callback;

	  function debugCallback(err) {
	    if (err) {
	      backtrace.message = err.message;
	      err = backtrace;
	      missingCallback(err);
	    }
	  }

	  function missingCallback(err) {
	    if (err) {
	      if (process.throwDeprecation)
	        throw err;  // Forgot a callback but don't know where? Use NODE_DEBUG=fs
	      else if (!process.noDeprecation) {
	        var msg = 'fs: missing callback ' + (err.stack || err.message);
	        if (process.traceDeprecation)
	          console.trace(msg);
	        else
	          console.error(msg);
	      }
	    }
	  }
	}

	function maybeCallback(cb) {
	  return typeof cb === 'function' ? cb : rethrow();
	}

	pathModule.normalize;

	// Regexp that finds the next partion of a (partial) path
	// result is [base_with_slash, base], e.g. ['somedir/', 'somedir']
	if (isWindows) {
	  var nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
	} else {
	  var nextPartRe = /(.*?)(?:[\/]+|$)/g;
	}

	// Regex to find the device root, including trailing slash. E.g. 'c:\\'.
	if (isWindows) {
	  var splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
	} else {
	  var splitRootRe = /^[\/]*/;
	}

	old.realpathSync = function realpathSync(p, cache) {
	  // make p is absolute
	  p = pathModule.resolve(p);

	  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
	    return cache[p];
	  }

	  var original = p,
	      seenLinks = {},
	      knownHard = {};

	  // current character position in p
	  var pos;
	  // the partial path so far, including a trailing slash if any
	  var current;
	  // the partial path without a trailing slash (except when pointing at a root)
	  var base;
	  // the partial path scanned in the previous round, with slash
	  var previous;

	  start();

	  function start() {
	    // Skip over roots
	    var m = splitRootRe.exec(p);
	    pos = m[0].length;
	    current = m[0];
	    base = m[0];
	    previous = '';

	    // On windows, check that the root exists. On unix there is no need.
	    if (isWindows && !knownHard[base]) {
	      fs.lstatSync(base);
	      knownHard[base] = true;
	    }
	  }

	  // walk down the path, swapping out linked pathparts for their real
	  // values
	  // NB: p.length changes.
	  while (pos < p.length) {
	    // find the next part
	    nextPartRe.lastIndex = pos;
	    var result = nextPartRe.exec(p);
	    previous = current;
	    current += result[0];
	    base = previous + result[1];
	    pos = nextPartRe.lastIndex;

	    // continue if not a symlink
	    if (knownHard[base] || (cache && cache[base] === base)) {
	      continue;
	    }

	    var resolvedLink;
	    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
	      // some known symbolic link.  no need to stat again.
	      resolvedLink = cache[base];
	    } else {
	      var stat = fs.lstatSync(base);
	      if (!stat.isSymbolicLink()) {
	        knownHard[base] = true;
	        if (cache) cache[base] = base;
	        continue;
	      }

	      // read the link if it wasn't read before
	      // dev/ino always return 0 on windows, so skip the check.
	      var linkTarget = null;
	      if (!isWindows) {
	        var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
	        if (seenLinks.hasOwnProperty(id)) {
	          linkTarget = seenLinks[id];
	        }
	      }
	      if (linkTarget === null) {
	        fs.statSync(base);
	        linkTarget = fs.readlinkSync(base);
	      }
	      resolvedLink = pathModule.resolve(previous, linkTarget);
	      // track this, if given a cache.
	      if (cache) cache[base] = resolvedLink;
	      if (!isWindows) seenLinks[id] = linkTarget;
	    }

	    // resolve the link, then start over
	    p = pathModule.resolve(resolvedLink, p.slice(pos));
	    start();
	  }

	  if (cache) cache[original] = p;

	  return p;
	};


	old.realpath = function realpath(p, cache, cb) {
	  if (typeof cb !== 'function') {
	    cb = maybeCallback(cache);
	    cache = null;
	  }

	  // make p is absolute
	  p = pathModule.resolve(p);

	  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
	    return process.nextTick(cb.bind(null, null, cache[p]));
	  }

	  var original = p,
	      seenLinks = {},
	      knownHard = {};

	  // current character position in p
	  var pos;
	  // the partial path so far, including a trailing slash if any
	  var current;
	  // the partial path without a trailing slash (except when pointing at a root)
	  var base;
	  // the partial path scanned in the previous round, with slash
	  var previous;

	  start();

	  function start() {
	    // Skip over roots
	    var m = splitRootRe.exec(p);
	    pos = m[0].length;
	    current = m[0];
	    base = m[0];
	    previous = '';

	    // On windows, check that the root exists. On unix there is no need.
	    if (isWindows && !knownHard[base]) {
	      fs.lstat(base, function(err) {
	        if (err) return cb(err);
	        knownHard[base] = true;
	        LOOP();
	      });
	    } else {
	      process.nextTick(LOOP);
	    }
	  }

	  // walk down the path, swapping out linked pathparts for their real
	  // values
	  function LOOP() {
	    // stop if scanned past end of path
	    if (pos >= p.length) {
	      if (cache) cache[original] = p;
	      return cb(null, p);
	    }

	    // find the next part
	    nextPartRe.lastIndex = pos;
	    var result = nextPartRe.exec(p);
	    previous = current;
	    current += result[0];
	    base = previous + result[1];
	    pos = nextPartRe.lastIndex;

	    // continue if not a symlink
	    if (knownHard[base] || (cache && cache[base] === base)) {
	      return process.nextTick(LOOP);
	    }

	    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
	      // known symbolic link.  no need to stat again.
	      return gotResolvedLink(cache[base]);
	    }

	    return fs.lstat(base, gotStat);
	  }

	  function gotStat(err, stat) {
	    if (err) return cb(err);

	    // if not a symlink, skip to the next path part
	    if (!stat.isSymbolicLink()) {
	      knownHard[base] = true;
	      if (cache) cache[base] = base;
	      return process.nextTick(LOOP);
	    }

	    // stat & read the link if not read before
	    // call gotTarget as soon as the link target is known
	    // dev/ino always return 0 on windows, so skip the check.
	    if (!isWindows) {
	      var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
	      if (seenLinks.hasOwnProperty(id)) {
	        return gotTarget(null, seenLinks[id], base);
	      }
	    }
	    fs.stat(base, function(err) {
	      if (err) return cb(err);

	      fs.readlink(base, function(err, target) {
	        if (!isWindows) seenLinks[id] = target;
	        gotTarget(err, target);
	      });
	    });
	  }

	  function gotTarget(err, target, base) {
	    if (err) return cb(err);

	    var resolvedLink = pathModule.resolve(previous, target);
	    if (cache) cache[base] = resolvedLink;
	    gotResolvedLink(resolvedLink);
	  }

	  function gotResolvedLink(resolvedLink) {
	    // resolve the link, then start over
	    p = pathModule.resolve(resolvedLink, p.slice(pos));
	    start();
	  }
	};
	return old;
}

var fs_realpath;
var hasRequiredFs_realpath;

function requireFs_realpath () {
	if (hasRequiredFs_realpath) return fs_realpath;
	hasRequiredFs_realpath = 1;
	fs_realpath = realpath;
	realpath.realpath = realpath;
	realpath.sync = realpathSync;
	realpath.realpathSync = realpathSync;
	realpath.monkeypatch = monkeypatch;
	realpath.unmonkeypatch = unmonkeypatch;

	var fs = require$$0$3;
	var origRealpath = fs.realpath;
	var origRealpathSync = fs.realpathSync;

	var version = process.version;
	var ok = /^v[0-5]\./.test(version);
	var old = requireOld();

	function newError (er) {
	  return er && er.syscall === 'realpath' && (
	    er.code === 'ELOOP' ||
	    er.code === 'ENOMEM' ||
	    er.code === 'ENAMETOOLONG'
	  )
	}

	function realpath (p, cache, cb) {
	  if (ok) {
	    return origRealpath(p, cache, cb)
	  }

	  if (typeof cache === 'function') {
	    cb = cache;
	    cache = null;
	  }
	  origRealpath(p, cache, function (er, result) {
	    if (newError(er)) {
	      old.realpath(p, cache, cb);
	    } else {
	      cb(er, result);
	    }
	  });
	}

	function realpathSync (p, cache) {
	  if (ok) {
	    return origRealpathSync(p, cache)
	  }

	  try {
	    return origRealpathSync(p, cache)
	  } catch (er) {
	    if (newError(er)) {
	      return old.realpathSync(p, cache)
	    } else {
	      throw er
	    }
	  }
	}

	function monkeypatch () {
	  fs.realpath = realpath;
	  fs.realpathSync = realpathSync;
	}

	function unmonkeypatch () {
	  fs.realpath = origRealpath;
	  fs.realpathSync = origRealpathSync;
	}
	return fs_realpath;
}

var concatMap;
var hasRequiredConcatMap;

function requireConcatMap () {
	if (hasRequiredConcatMap) return concatMap;
	hasRequiredConcatMap = 1;
	concatMap = function (xs, fn) {
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        var x = fn(xs[i], i);
	        if (isArray(x)) res.push.apply(res, x);
	        else res.push(x);
	    }
	    return res;
	};

	var isArray = Array.isArray || function (xs) {
	    return Object.prototype.toString.call(xs) === '[object Array]';
	};
	return concatMap;
}

var balancedMatch;
var hasRequiredBalancedMatch;

function requireBalancedMatch () {
	if (hasRequiredBalancedMatch) return balancedMatch;
	hasRequiredBalancedMatch = 1;
	balancedMatch = balanced;
	function balanced(a, b, str) {
	  if (a instanceof RegExp) a = maybeMatch(a, str);
	  if (b instanceof RegExp) b = maybeMatch(b, str);

	  var r = range(a, b, str);

	  return r && {
	    start: r[0],
	    end: r[1],
	    pre: str.slice(0, r[0]),
	    body: str.slice(r[0] + a.length, r[1]),
	    post: str.slice(r[1] + b.length)
	  };
	}

	function maybeMatch(reg, str) {
	  var m = str.match(reg);
	  return m ? m[0] : null;
	}

	balanced.range = range;
	function range(a, b, str) {
	  var begs, beg, left, right, result;
	  var ai = str.indexOf(a);
	  var bi = str.indexOf(b, ai + 1);
	  var i = ai;

	  if (ai >= 0 && bi > 0) {
	    if(a===b) {
	      return [ai, bi];
	    }
	    begs = [];
	    left = str.length;

	    while (i >= 0 && !result) {
	      if (i == ai) {
	        begs.push(i);
	        ai = str.indexOf(a, i + 1);
	      } else if (begs.length == 1) {
	        result = [ begs.pop(), bi ];
	      } else {
	        beg = begs.pop();
	        if (beg < left) {
	          left = beg;
	          right = bi;
	        }

	        bi = str.indexOf(b, i + 1);
	      }

	      i = ai < bi && ai >= 0 ? ai : bi;
	    }

	    if (begs.length) {
	      result = [ left, right ];
	    }
	  }

	  return result;
	}
	return balancedMatch;
}

var braceExpansion;
var hasRequiredBraceExpansion;

function requireBraceExpansion () {
	if (hasRequiredBraceExpansion) return braceExpansion;
	hasRequiredBraceExpansion = 1;
	var concatMap = requireConcatMap();
	var balanced = requireBalancedMatch();

	braceExpansion = expandTop;

	var escSlash = '\0SLASH'+Math.random()+'\0';
	var escOpen = '\0OPEN'+Math.random()+'\0';
	var escClose = '\0CLOSE'+Math.random()+'\0';
	var escComma = '\0COMMA'+Math.random()+'\0';
	var escPeriod = '\0PERIOD'+Math.random()+'\0';

	function numeric(str) {
	  return parseInt(str, 10) == str
	    ? parseInt(str, 10)
	    : str.charCodeAt(0);
	}

	function escapeBraces(str) {
	  return str.split('\\\\').join(escSlash)
	            .split('\\{').join(escOpen)
	            .split('\\}').join(escClose)
	            .split('\\,').join(escComma)
	            .split('\\.').join(escPeriod);
	}

	function unescapeBraces(str) {
	  return str.split(escSlash).join('\\')
	            .split(escOpen).join('{')
	            .split(escClose).join('}')
	            .split(escComma).join(',')
	            .split(escPeriod).join('.');
	}


	// Basically just str.split(","), but handling cases
	// where we have nested braced sections, which should be
	// treated as individual members, like {a,{b,c},d}
	function parseCommaParts(str) {
	  if (!str)
	    return [''];

	  var parts = [];
	  var m = balanced('{', '}', str);

	  if (!m)
	    return str.split(',');

	  var pre = m.pre;
	  var body = m.body;
	  var post = m.post;
	  var p = pre.split(',');

	  p[p.length-1] += '{' + body + '}';
	  var postParts = parseCommaParts(post);
	  if (post.length) {
	    p[p.length-1] += postParts.shift();
	    p.push.apply(p, postParts);
	  }

	  parts.push.apply(parts, p);

	  return parts;
	}

	function expandTop(str) {
	  if (!str)
	    return [];

	  // I don't know why Bash 4.3 does this, but it does.
	  // Anything starting with {} will have the first two bytes preserved
	  // but *only* at the top level, so {},a}b will not expand to anything,
	  // but a{},b}c will be expanded to [a}c,abc].
	  // One could argue that this is a bug in Bash, but since the goal of
	  // this module is to match Bash's rules, we escape a leading {}
	  if (str.substr(0, 2) === '{}') {
	    str = '\\{\\}' + str.substr(2);
	  }

	  return expand(escapeBraces(str), true).map(unescapeBraces);
	}

	function embrace(str) {
	  return '{' + str + '}';
	}
	function isPadded(el) {
	  return /^-?0\d/.test(el);
	}

	function lte(i, y) {
	  return i <= y;
	}
	function gte(i, y) {
	  return i >= y;
	}

	function expand(str, isTop) {
	  var expansions = [];

	  var m = balanced('{', '}', str);
	  if (!m || /\$$/.test(m.pre)) return [str];

	  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
	  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
	  var isSequence = isNumericSequence || isAlphaSequence;
	  var isOptions = m.body.indexOf(',') >= 0;
	  if (!isSequence && !isOptions) {
	    // {a},b}
	    if (m.post.match(/,.*\}/)) {
	      str = m.pre + '{' + m.body + escClose + m.post;
	      return expand(str);
	    }
	    return [str];
	  }

	  var n;
	  if (isSequence) {
	    n = m.body.split(/\.\./);
	  } else {
	    n = parseCommaParts(m.body);
	    if (n.length === 1) {
	      // x{{a,b}}y ==> x{a}y x{b}y
	      n = expand(n[0], false).map(embrace);
	      if (n.length === 1) {
	        var post = m.post.length
	          ? expand(m.post, false)
	          : [''];
	        return post.map(function(p) {
	          return m.pre + n[0] + p;
	        });
	      }
	    }
	  }

	  // at this point, n is the parts, and we know it's not a comma set
	  // with a single entry.

	  // no need to expand pre, since it is guaranteed to be free of brace-sets
	  var pre = m.pre;
	  var post = m.post.length
	    ? expand(m.post, false)
	    : [''];

	  var N;

	  if (isSequence) {
	    var x = numeric(n[0]);
	    var y = numeric(n[1]);
	    var width = Math.max(n[0].length, n[1].length);
	    var incr = n.length == 3
	      ? Math.abs(numeric(n[2]))
	      : 1;
	    var test = lte;
	    var reverse = y < x;
	    if (reverse) {
	      incr *= -1;
	      test = gte;
	    }
	    var pad = n.some(isPadded);

	    N = [];

	    for (var i = x; test(i, y); i += incr) {
	      var c;
	      if (isAlphaSequence) {
	        c = String.fromCharCode(i);
	        if (c === '\\')
	          c = '';
	      } else {
	        c = String(i);
	        if (pad) {
	          var need = width - c.length;
	          if (need > 0) {
	            var z = new Array(need + 1).join('0');
	            if (i < 0)
	              c = '-' + z + c.slice(1);
	            else
	              c = z + c;
	          }
	        }
	      }
	      N.push(c);
	    }
	  } else {
	    N = concatMap(n, function(el) { return expand(el, false) });
	  }

	  for (var j = 0; j < N.length; j++) {
	    for (var k = 0; k < post.length; k++) {
	      var expansion = pre + N[j] + post[k];
	      if (!isTop || isSequence || expansion)
	        expansions.push(expansion);
	    }
	  }

	  return expansions;
	}
	return braceExpansion;
}

var minimatch_1;
var hasRequiredMinimatch;

function requireMinimatch () {
	if (hasRequiredMinimatch) return minimatch_1;
	hasRequiredMinimatch = 1;
	minimatch_1 = minimatch;
	minimatch.Minimatch = Minimatch;

	var path = (function () { try { return require('path') } catch (e) {}}()) || {
	  sep: '/'
	};
	minimatch.sep = path.sep;

	var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {};
	var expand = requireBraceExpansion();

	var plTypes = {
	  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
	  '?': { open: '(?:', close: ')?' },
	  '+': { open: '(?:', close: ')+' },
	  '*': { open: '(?:', close: ')*' },
	  '@': { open: '(?:', close: ')' }
	};

	// any single thing other than /
	// don't need to escape / when using new RegExp()
	var qmark = '[^/]';

	// * => any number of characters
	var star = qmark + '*?';

	// ** when dots are allowed.  Anything goes, except .. and .
	// not (^ or / followed by one or two dots followed by $ or /),
	// followed by anything, any number of times.
	var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?';

	// not a ^ or / followed by a dot,
	// followed by anything, any number of times.
	var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?';

	// characters that need to be escaped in RegExp.
	var reSpecials = charSet('().*{}+?[]^$\\!');

	// "abc" -> { a:true, b:true, c:true }
	function charSet (s) {
	  return s.split('').reduce(function (set, c) {
	    set[c] = true;
	    return set
	  }, {})
	}

	// normalizes slashes.
	var slashSplit = /\/+/;

	minimatch.filter = filter;
	function filter (pattern, options) {
	  options = options || {};
	  return function (p, i, list) {
	    return minimatch(p, pattern, options)
	  }
	}

	function ext (a, b) {
	  b = b || {};
	  var t = {};
	  Object.keys(a).forEach(function (k) {
	    t[k] = a[k];
	  });
	  Object.keys(b).forEach(function (k) {
	    t[k] = b[k];
	  });
	  return t
	}

	minimatch.defaults = function (def) {
	  if (!def || typeof def !== 'object' || !Object.keys(def).length) {
	    return minimatch
	  }

	  var orig = minimatch;

	  var m = function minimatch (p, pattern, options) {
	    return orig(p, pattern, ext(def, options))
	  };

	  m.Minimatch = function Minimatch (pattern, options) {
	    return new orig.Minimatch(pattern, ext(def, options))
	  };
	  m.Minimatch.defaults = function defaults (options) {
	    return orig.defaults(ext(def, options)).Minimatch
	  };

	  m.filter = function filter (pattern, options) {
	    return orig.filter(pattern, ext(def, options))
	  };

	  m.defaults = function defaults (options) {
	    return orig.defaults(ext(def, options))
	  };

	  m.makeRe = function makeRe (pattern, options) {
	    return orig.makeRe(pattern, ext(def, options))
	  };

	  m.braceExpand = function braceExpand (pattern, options) {
	    return orig.braceExpand(pattern, ext(def, options))
	  };

	  m.match = function (list, pattern, options) {
	    return orig.match(list, pattern, ext(def, options))
	  };

	  return m
	};

	Minimatch.defaults = function (def) {
	  return minimatch.defaults(def).Minimatch
	};

	function minimatch (p, pattern, options) {
	  assertValidPattern(pattern);

	  if (!options) options = {};

	  // shortcut: comments match nothing.
	  if (!options.nocomment && pattern.charAt(0) === '#') {
	    return false
	  }

	  return new Minimatch(pattern, options).match(p)
	}

	function Minimatch (pattern, options) {
	  if (!(this instanceof Minimatch)) {
	    return new Minimatch(pattern, options)
	  }

	  assertValidPattern(pattern);

	  if (!options) options = {};

	  pattern = pattern.trim();

	  // windows support: need to use /, not \
	  if (!options.allowWindowsEscape && path.sep !== '/') {
	    pattern = pattern.split(path.sep).join('/');
	  }

	  this.options = options;
	  this.set = [];
	  this.pattern = pattern;
	  this.regexp = null;
	  this.negate = false;
	  this.comment = false;
	  this.empty = false;
	  this.partial = !!options.partial;

	  // make the set of regexps etc.
	  this.make();
	}

	Minimatch.prototype.debug = function () {};

	Minimatch.prototype.make = make;
	function make () {
	  var pattern = this.pattern;
	  var options = this.options;

	  // empty patterns and comments match nothing.
	  if (!options.nocomment && pattern.charAt(0) === '#') {
	    this.comment = true;
	    return
	  }
	  if (!pattern) {
	    this.empty = true;
	    return
	  }

	  // step 1: figure out negation, etc.
	  this.parseNegate();

	  // step 2: expand braces
	  var set = this.globSet = this.braceExpand();

	  if (options.debug) this.debug = function debug() { console.error.apply(console, arguments); };

	  this.debug(this.pattern, set);

	  // step 3: now we have a set, so turn each one into a series of path-portion
	  // matching patterns.
	  // These will be regexps, except in the case of "**", which is
	  // set to the GLOBSTAR object for globstar behavior,
	  // and will not contain any / characters
	  set = this.globParts = set.map(function (s) {
	    return s.split(slashSplit)
	  });

	  this.debug(this.pattern, set);

	  // glob --> regexps
	  set = set.map(function (s, si, set) {
	    return s.map(this.parse, this)
	  }, this);

	  this.debug(this.pattern, set);

	  // filter out everything that didn't compile properly.
	  set = set.filter(function (s) {
	    return s.indexOf(false) === -1
	  });

	  this.debug(this.pattern, set);

	  this.set = set;
	}

	Minimatch.prototype.parseNegate = parseNegate;
	function parseNegate () {
	  var pattern = this.pattern;
	  var negate = false;
	  var options = this.options;
	  var negateOffset = 0;

	  if (options.nonegate) return

	  for (var i = 0, l = pattern.length
	    ; i < l && pattern.charAt(i) === '!'
	    ; i++) {
	    negate = !negate;
	    negateOffset++;
	  }

	  if (negateOffset) this.pattern = pattern.substr(negateOffset);
	  this.negate = negate;
	}

	// Brace expansion:
	// a{b,c}d -> abd acd
	// a{b,}c -> abc ac
	// a{0..3}d -> a0d a1d a2d a3d
	// a{b,c{d,e}f}g -> abg acdfg acefg
	// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
	//
	// Invalid sets are not expanded.
	// a{2..}b -> a{2..}b
	// a{b}c -> a{b}c
	minimatch.braceExpand = function (pattern, options) {
	  return braceExpand(pattern, options)
	};

	Minimatch.prototype.braceExpand = braceExpand;

	function braceExpand (pattern, options) {
	  if (!options) {
	    if (this instanceof Minimatch) {
	      options = this.options;
	    } else {
	      options = {};
	    }
	  }

	  pattern = typeof pattern === 'undefined'
	    ? this.pattern : pattern;

	  assertValidPattern(pattern);

	  // Thanks to Yeting Li <https://github.com/yetingli> for
	  // improving this regexp to avoid a ReDOS vulnerability.
	  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
	    // shortcut. no need to expand.
	    return [pattern]
	  }

	  return expand(pattern)
	}

	var MAX_PATTERN_LENGTH = 1024 * 64;
	var assertValidPattern = function (pattern) {
	  if (typeof pattern !== 'string') {
	    throw new TypeError('invalid pattern')
	  }

	  if (pattern.length > MAX_PATTERN_LENGTH) {
	    throw new TypeError('pattern is too long')
	  }
	};

	// parse a component of the expanded set.
	// At this point, no pattern may contain "/" in it
	// so we're going to return a 2d array, where each entry is the full
	// pattern, split on '/', and then turned into a regular expression.
	// A regexp is made at the end which joins each array with an
	// escaped /, and another full one which joins each regexp with |.
	//
	// Following the lead of Bash 4.1, note that "**" only has special meaning
	// when it is the *only* thing in a path portion.  Otherwise, any series
	// of * is equivalent to a single *.  Globstar behavior is enabled by
	// default, and can be disabled by setting options.noglobstar.
	Minimatch.prototype.parse = parse;
	var SUBPARSE = {};
	function parse (pattern, isSub) {
	  assertValidPattern(pattern);

	  var options = this.options;

	  // shortcuts
	  if (pattern === '**') {
	    if (!options.noglobstar)
	      return GLOBSTAR
	    else
	      pattern = '*';
	  }
	  if (pattern === '') return ''

	  var re = '';
	  var hasMagic = !!options.nocase;
	  var escaping = false;
	  // ? => one single character
	  var patternListStack = [];
	  var negativeLists = [];
	  var stateChar;
	  var inClass = false;
	  var reClassStart = -1;
	  var classStart = -1;
	  // . and .. never match anything that doesn't start with .,
	  // even when options.dot is set.
	  var patternStart = pattern.charAt(0) === '.' ? '' // anything
	  // not (start or / followed by . or .. followed by / or end)
	  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
	  : '(?!\\.)';
	  var self = this;

	  function clearStateChar () {
	    if (stateChar) {
	      // we had some state-tracking character
	      // that wasn't consumed by this pass.
	      switch (stateChar) {
	        case '*':
	          re += star;
	          hasMagic = true;
	        break
	        case '?':
	          re += qmark;
	          hasMagic = true;
	        break
	        default:
	          re += '\\' + stateChar;
	        break
	      }
	      self.debug('clearStateChar %j %j', stateChar, re);
	      stateChar = false;
	    }
	  }

	  for (var i = 0, len = pattern.length, c
	    ; (i < len) && (c = pattern.charAt(i))
	    ; i++) {
	    this.debug('%s\t%s %s %j', pattern, i, re, c);

	    // skip over any that are escaped.
	    if (escaping && reSpecials[c]) {
	      re += '\\' + c;
	      escaping = false;
	      continue
	    }

	    switch (c) {
	      /* istanbul ignore next */
	      case '/': {
	        // completely not allowed, even escaped.
	        // Should already be path-split by now.
	        return false
	      }

	      case '\\':
	        clearStateChar();
	        escaping = true;
	      continue

	      // the various stateChar values
	      // for the "extglob" stuff.
	      case '?':
	      case '*':
	      case '+':
	      case '@':
	      case '!':
	        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c);

	        // all of those are literals inside a class, except that
	        // the glob [!a] means [^a] in regexp
	        if (inClass) {
	          this.debug('  in class');
	          if (c === '!' && i === classStart + 1) c = '^';
	          re += c;
	          continue
	        }

	        // if we already have a stateChar, then it means
	        // that there was something like ** or +? in there.
	        // Handle the stateChar, then proceed with this one.
	        self.debug('call clearStateChar %j', stateChar);
	        clearStateChar();
	        stateChar = c;
	        // if extglob is disabled, then +(asdf|foo) isn't a thing.
	        // just clear the statechar *now*, rather than even diving into
	        // the patternList stuff.
	        if (options.noext) clearStateChar();
	      continue

	      case '(':
	        if (inClass) {
	          re += '(';
	          continue
	        }

	        if (!stateChar) {
	          re += '\\(';
	          continue
	        }

	        patternListStack.push({
	          type: stateChar,
	          start: i - 1,
	          reStart: re.length,
	          open: plTypes[stateChar].open,
	          close: plTypes[stateChar].close
	        });
	        // negation is (?:(?!js)[^/]*)
	        re += stateChar === '!' ? '(?:(?!(?:' : '(?:';
	        this.debug('plType %j %j', stateChar, re);
	        stateChar = false;
	      continue

	      case ')':
	        if (inClass || !patternListStack.length) {
	          re += '\\)';
	          continue
	        }

	        clearStateChar();
	        hasMagic = true;
	        var pl = patternListStack.pop();
	        // negation is (?:(?!js)[^/]*)
	        // The others are (?:<pattern>)<type>
	        re += pl.close;
	        if (pl.type === '!') {
	          negativeLists.push(pl);
	        }
	        pl.reEnd = re.length;
	      continue

	      case '|':
	        if (inClass || !patternListStack.length || escaping) {
	          re += '\\|';
	          escaping = false;
	          continue
	        }

	        clearStateChar();
	        re += '|';
	      continue

	      // these are mostly the same in regexp and glob
	      case '[':
	        // swallow any state-tracking char before the [
	        clearStateChar();

	        if (inClass) {
	          re += '\\' + c;
	          continue
	        }

	        inClass = true;
	        classStart = i;
	        reClassStart = re.length;
	        re += c;
	      continue

	      case ']':
	        //  a right bracket shall lose its special
	        //  meaning and represent itself in
	        //  a bracket expression if it occurs
	        //  first in the list.  -- POSIX.2 2.8.3.2
	        if (i === classStart + 1 || !inClass) {
	          re += '\\' + c;
	          escaping = false;
	          continue
	        }

	        // handle the case where we left a class open.
	        // "[z-a]" is valid, equivalent to "\[z-a\]"
	        // split where the last [ was, make sure we don't have
	        // an invalid re. if so, re-walk the contents of the
	        // would-be class to re-translate any characters that
	        // were passed through as-is
	        // TODO: It would probably be faster to determine this
	        // without a try/catch and a new RegExp, but it's tricky
	        // to do safely.  For now, this is safe and works.
	        var cs = pattern.substring(classStart + 1, i);
	        try {
	          RegExp('[' + cs + ']');
	        } catch (er) {
	          // not a valid class!
	          var sp = this.parse(cs, SUBPARSE);
	          re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]';
	          hasMagic = hasMagic || sp[1];
	          inClass = false;
	          continue
	        }

	        // finish up the class.
	        hasMagic = true;
	        inClass = false;
	        re += c;
	      continue

	      default:
	        // swallow any state char that wasn't consumed
	        clearStateChar();

	        if (escaping) {
	          // no need
	          escaping = false;
	        } else if (reSpecials[c]
	          && !(c === '^' && inClass)) {
	          re += '\\';
	        }

	        re += c;

	    } // switch
	  } // for

	  // handle the case where we left a class open.
	  // "[abc" is valid, equivalent to "\[abc"
	  if (inClass) {
	    // split where the last [ was, and escape it
	    // this is a huge pita.  We now have to re-walk
	    // the contents of the would-be class to re-translate
	    // any characters that were passed through as-is
	    cs = pattern.substr(classStart + 1);
	    sp = this.parse(cs, SUBPARSE);
	    re = re.substr(0, reClassStart) + '\\[' + sp[0];
	    hasMagic = hasMagic || sp[1];
	  }

	  // handle the case where we had a +( thing at the *end*
	  // of the pattern.
	  // each pattern list stack adds 3 chars, and we need to go through
	  // and escape any | chars that were passed through as-is for the regexp.
	  // Go through and escape them, taking care not to double-escape any
	  // | chars that were already escaped.
	  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
	    var tail = re.slice(pl.reStart + pl.open.length);
	    this.debug('setting tail', re, pl);
	    // maybe some even number of \, then maybe 1 \, followed by a |
	    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
	      if (!$2) {
	        // the | isn't already escaped, so escape it.
	        $2 = '\\';
	      }

	      // need to escape all those slashes *again*, without escaping the
	      // one that we need for escaping the | character.  As it works out,
	      // escaping an even number of slashes can be done by simply repeating
	      // it exactly after itself.  That's why this trick works.
	      //
	      // I am sorry that you have to see this.
	      return $1 + $1 + $2 + '|'
	    });

	    this.debug('tail=%j\n   %s', tail, tail, pl, re);
	    var t = pl.type === '*' ? star
	      : pl.type === '?' ? qmark
	      : '\\' + pl.type;

	    hasMagic = true;
	    re = re.slice(0, pl.reStart) + t + '\\(' + tail;
	  }

	  // handle trailing things that only matter at the very end.
	  clearStateChar();
	  if (escaping) {
	    // trailing \\
	    re += '\\\\';
	  }

	  // only need to apply the nodot start if the re starts with
	  // something that could conceivably capture a dot
	  var addPatternStart = false;
	  switch (re.charAt(0)) {
	    case '[': case '.': case '(': addPatternStart = true;
	  }

	  // Hack to work around lack of negative lookbehind in JS
	  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
	  // like 'a.xyz.yz' doesn't match.  So, the first negative
	  // lookahead, has to look ALL the way ahead, to the end of
	  // the pattern.
	  for (var n = negativeLists.length - 1; n > -1; n--) {
	    var nl = negativeLists[n];

	    var nlBefore = re.slice(0, nl.reStart);
	    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
	    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd);
	    var nlAfter = re.slice(nl.reEnd);

	    nlLast += nlAfter;

	    // Handle nested stuff like *(*.js|!(*.json)), where open parens
	    // mean that we should *not* include the ) in the bit that is considered
	    // "after" the negated section.
	    var openParensBefore = nlBefore.split('(').length - 1;
	    var cleanAfter = nlAfter;
	    for (i = 0; i < openParensBefore; i++) {
	      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '');
	    }
	    nlAfter = cleanAfter;

	    var dollar = '';
	    if (nlAfter === '' && isSub !== SUBPARSE) {
	      dollar = '$';
	    }
	    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast;
	    re = newRe;
	  }

	  // if the re is not "" at this point, then we need to make sure
	  // it doesn't match against an empty path part.
	  // Otherwise a/* will match a/, which it should not.
	  if (re !== '' && hasMagic) {
	    re = '(?=.)' + re;
	  }

	  if (addPatternStart) {
	    re = patternStart + re;
	  }

	  // parsing just a piece of a larger pattern.
	  if (isSub === SUBPARSE) {
	    return [re, hasMagic]
	  }

	  // skip the regexp for non-magical patterns
	  // unescape anything in it, though, so that it'll be
	  // an exact match against a file etc.
	  if (!hasMagic) {
	    return globUnescape(pattern)
	  }

	  var flags = options.nocase ? 'i' : '';
	  try {
	    var regExp = new RegExp('^' + re + '$', flags);
	  } catch (er) /* istanbul ignore next - should be impossible */ {
	    // If it was an invalid regular expression, then it can't match
	    // anything.  This trick looks for a character after the end of
	    // the string, which is of course impossible, except in multi-line
	    // mode, but it's not a /m regex.
	    return new RegExp('$.')
	  }

	  regExp._glob = pattern;
	  regExp._src = re;

	  return regExp
	}

	minimatch.makeRe = function (pattern, options) {
	  return new Minimatch(pattern, options || {}).makeRe()
	};

	Minimatch.prototype.makeRe = makeRe;
	function makeRe () {
	  if (this.regexp || this.regexp === false) return this.regexp

	  // at this point, this.set is a 2d array of partial
	  // pattern strings, or "**".
	  //
	  // It's better to use .match().  This function shouldn't
	  // be used, really, but it's pretty convenient sometimes,
	  // when you just want to work with a regex.
	  var set = this.set;

	  if (!set.length) {
	    this.regexp = false;
	    return this.regexp
	  }
	  var options = this.options;

	  var twoStar = options.noglobstar ? star
	    : options.dot ? twoStarDot
	    : twoStarNoDot;
	  var flags = options.nocase ? 'i' : '';

	  var re = set.map(function (pattern) {
	    return pattern.map(function (p) {
	      return (p === GLOBSTAR) ? twoStar
	      : (typeof p === 'string') ? regExpEscape(p)
	      : p._src
	    }).join('\\\/')
	  }).join('|');

	  // must match entire pattern
	  // ending in a * or ** will make it less strict.
	  re = '^(?:' + re + ')$';

	  // can match anything, as long as it's not this.
	  if (this.negate) re = '^(?!' + re + ').*$';

	  try {
	    this.regexp = new RegExp(re, flags);
	  } catch (ex) /* istanbul ignore next - should be impossible */ {
	    this.regexp = false;
	  }
	  return this.regexp
	}

	minimatch.match = function (list, pattern, options) {
	  options = options || {};
	  var mm = new Minimatch(pattern, options);
	  list = list.filter(function (f) {
	    return mm.match(f)
	  });
	  if (mm.options.nonull && !list.length) {
	    list.push(pattern);
	  }
	  return list
	};

	Minimatch.prototype.match = function match (f, partial) {
	  if (typeof partial === 'undefined') partial = this.partial;
	  this.debug('match', f, this.pattern);
	  // short-circuit in the case of busted things.
	  // comments, etc.
	  if (this.comment) return false
	  if (this.empty) return f === ''

	  if (f === '/' && partial) return true

	  var options = this.options;

	  // windows: need to use /, not \
	  if (path.sep !== '/') {
	    f = f.split(path.sep).join('/');
	  }

	  // treat the test path as a set of pathparts.
	  f = f.split(slashSplit);
	  this.debug(this.pattern, 'split', f);

	  // just ONE of the pattern sets in this.set needs to match
	  // in order for it to be valid.  If negating, then just one
	  // match means that we have failed.
	  // Either way, return on the first hit.

	  var set = this.set;
	  this.debug(this.pattern, 'set', set);

	  // Find the basename of the path by looking for the last non-empty segment
	  var filename;
	  var i;
	  for (i = f.length - 1; i >= 0; i--) {
	    filename = f[i];
	    if (filename) break
	  }

	  for (i = 0; i < set.length; i++) {
	    var pattern = set[i];
	    var file = f;
	    if (options.matchBase && pattern.length === 1) {
	      file = [filename];
	    }
	    var hit = this.matchOne(file, pattern, partial);
	    if (hit) {
	      if (options.flipNegate) return true
	      return !this.negate
	    }
	  }

	  // didn't get any hits.  this is success if it's a negative
	  // pattern, failure otherwise.
	  if (options.flipNegate) return false
	  return this.negate
	};

	// set partial to true to test if, for example,
	// "/a/b" matches the start of "/*/b/*/d"
	// Partial means, if you run out of file before you run
	// out of pattern, then that's fine, as long as all
	// the parts match.
	Minimatch.prototype.matchOne = function (file, pattern, partial) {
	  var options = this.options;

	  this.debug('matchOne',
	    { 'this': this, file: file, pattern: pattern });

	  this.debug('matchOne', file.length, pattern.length);

	  for (var fi = 0,
	      pi = 0,
	      fl = file.length,
	      pl = pattern.length
	      ; (fi < fl) && (pi < pl)
	      ; fi++, pi++) {
	    this.debug('matchOne loop');
	    var p = pattern[pi];
	    var f = file[fi];

	    this.debug(pattern, p, f);

	    // should be impossible.
	    // some invalid regexp stuff in the set.
	    /* istanbul ignore if */
	    if (p === false) return false

	    if (p === GLOBSTAR) {
	      this.debug('GLOBSTAR', [pattern, p, f]);

	      // "**"
	      // a/**/b/**/c would match the following:
	      // a/b/x/y/z/c
	      // a/x/y/z/b/c
	      // a/b/x/b/x/c
	      // a/b/c
	      // To do this, take the rest of the pattern after
	      // the **, and see if it would match the file remainder.
	      // If so, return success.
	      // If not, the ** "swallows" a segment, and try again.
	      // This is recursively awful.
	      //
	      // a/**/b/**/c matching a/b/x/y/z/c
	      // - a matches a
	      // - doublestar
	      //   - matchOne(b/x/y/z/c, b/**/c)
	      //     - b matches b
	      //     - doublestar
	      //       - matchOne(x/y/z/c, c) -> no
	      //       - matchOne(y/z/c, c) -> no
	      //       - matchOne(z/c, c) -> no
	      //       - matchOne(c, c) yes, hit
	      var fr = fi;
	      var pr = pi + 1;
	      if (pr === pl) {
	        this.debug('** at the end');
	        // a ** at the end will just swallow the rest.
	        // We have found a match.
	        // however, it will not swallow /.x, unless
	        // options.dot is set.
	        // . and .. are *never* matched by **, for explosively
	        // exponential reasons.
	        for (; fi < fl; fi++) {
	          if (file[fi] === '.' || file[fi] === '..' ||
	            (!options.dot && file[fi].charAt(0) === '.')) return false
	        }
	        return true
	      }

	      // ok, let's see if we can swallow whatever we can.
	      while (fr < fl) {
	        var swallowee = file[fr];

	        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee);

	        // XXX remove this slice.  Just pass the start index.
	        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
	          this.debug('globstar found match!', fr, fl, swallowee);
	          // found a match.
	          return true
	        } else {
	          // can't swallow "." or ".." ever.
	          // can only swallow ".foo" when explicitly asked.
	          if (swallowee === '.' || swallowee === '..' ||
	            (!options.dot && swallowee.charAt(0) === '.')) {
	            this.debug('dot detected!', file, fr, pattern, pr);
	            break
	          }

	          // ** swallows a segment, and continue.
	          this.debug('globstar swallow a segment, and continue');
	          fr++;
	        }
	      }

	      // no match was found.
	      // However, in partial mode, we can't say this is necessarily over.
	      // If there's more *pattern* left, then
	      /* istanbul ignore if */
	      if (partial) {
	        // ran out of file
	        this.debug('\n>>> no match, partial?', file, fr, pattern, pr);
	        if (fr === fl) return true
	      }
	      return false
	    }

	    // something other than **
	    // non-magic patterns just have to match exactly
	    // patterns with magic have been turned into regexps.
	    var hit;
	    if (typeof p === 'string') {
	      hit = f === p;
	      this.debug('string match', p, f, hit);
	    } else {
	      hit = f.match(p);
	      this.debug('pattern match', p, f, hit);
	    }

	    if (!hit) return false
	  }

	  // Note: ending in / means that we'll get a final ""
	  // at the end of the pattern.  This can only match a
	  // corresponding "" at the end of the file.
	  // If the file ends in /, then it can only match a
	  // a pattern that ends in /, unless the pattern just
	  // doesn't have any more for it. But, a/b/ should *not*
	  // match "a/b/*", even though "" matches against the
	  // [^/]*? pattern, except in partial mode, where it might
	  // simply not be reached yet.
	  // However, a/b/ should still satisfy a/*

	  // now either we fell off the end of the pattern, or we're done.
	  if (fi === fl && pi === pl) {
	    // ran out of pattern and filename at the same time.
	    // an exact hit!
	    return true
	  } else if (fi === fl) {
	    // ran out of file, but still had pattern left.
	    // this is ok if we're doing the match as part of
	    // a glob fs traversal.
	    return partial
	  } else /* istanbul ignore else */ if (pi === pl) {
	    // ran out of pattern, still have file left.
	    // this is only acceptable if we're on the very last
	    // empty segment of a file with a trailing slash.
	    // a/* should match a/b/
	    return (fi === fl - 1) && (file[fi] === '')
	  }

	  // should be unreachable.
	  /* istanbul ignore next */
	  throw new Error('wtf?')
	};

	// replace stuff like \* with *
	function globUnescape (s) {
	  return s.replace(/\\(.)/g, '$1')
	}

	function regExpEscape (s) {
	  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
	}
	return minimatch_1;
}

var inherits = {exports: {}};

var inherits_browser = {exports: {}};

var hasRequiredInherits_browser;

function requireInherits_browser () {
	if (hasRequiredInherits_browser) return inherits_browser.exports;
	hasRequiredInherits_browser = 1;
	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  inherits_browser.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      ctor.prototype = Object.create(superCtor.prototype, {
	        constructor: {
	          value: ctor,
	          enumerable: false,
	          writable: true,
	          configurable: true
	        }
	      });
	    }
	  };
	} else {
	  // old school shim for old browsers
	  inherits_browser.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      var TempCtor = function () {};
	      TempCtor.prototype = superCtor.prototype;
	      ctor.prototype = new TempCtor();
	      ctor.prototype.constructor = ctor;
	    }
	  };
	}
	return inherits_browser.exports;
}

var hasRequiredInherits;

function requireInherits () {
	if (hasRequiredInherits) return inherits.exports;
	hasRequiredInherits = 1;
	(function (module) {
		try {
		  var util = require('util');
		  /* istanbul ignore next */
		  if (typeof util.inherits !== 'function') throw '';
		  module.exports = util.inherits;
		} catch (e) {
		  /* istanbul ignore next */
		  module.exports = requireInherits_browser();
		}
} (inherits));
	return inherits.exports;
}

var pathIsAbsolute = {exports: {}};

var hasRequiredPathIsAbsolute;

function requirePathIsAbsolute () {
	if (hasRequiredPathIsAbsolute) return pathIsAbsolute.exports;
	hasRequiredPathIsAbsolute = 1;

	function posix(path) {
		return path.charAt(0) === '/';
	}

	function win32(path) {
		// https://github.com/nodejs/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
		var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
		var result = splitDeviceRe.exec(path);
		var device = result[1] || '';
		var isUnc = Boolean(device && device.charAt(1) !== ':');

		// UNC paths are always absolute
		return Boolean(result[2] || isUnc);
	}

	pathIsAbsolute.exports = process.platform === 'win32' ? win32 : posix;
	pathIsAbsolute.exports.posix = posix;
	pathIsAbsolute.exports.win32 = win32;
	return pathIsAbsolute.exports;
}

var common = {};

var hasRequiredCommon;

function requireCommon () {
	if (hasRequiredCommon) return common;
	hasRequiredCommon = 1;
	common.setopts = setopts;
	common.ownProp = ownProp;
	common.makeAbs = makeAbs;
	common.finish = finish;
	common.mark = mark;
	common.isIgnored = isIgnored;
	common.childrenIgnored = childrenIgnored;

	function ownProp (obj, field) {
	  return Object.prototype.hasOwnProperty.call(obj, field)
	}

	var fs = require$$0$3;
	var path = require$$1$2;
	var minimatch = requireMinimatch();
	var isAbsolute = requirePathIsAbsolute();
	var Minimatch = minimatch.Minimatch;

	function alphasort (a, b) {
	  return a.localeCompare(b, 'en')
	}

	function setupIgnores (self, options) {
	  self.ignore = options.ignore || [];

	  if (!Array.isArray(self.ignore))
	    self.ignore = [self.ignore];

	  if (self.ignore.length) {
	    self.ignore = self.ignore.map(ignoreMap);
	  }
	}

	// ignore patterns are always in dot:true mode.
	function ignoreMap (pattern) {
	  var gmatcher = null;
	  if (pattern.slice(-3) === '/**') {
	    var gpattern = pattern.replace(/(\/\*\*)+$/, '');
	    gmatcher = new Minimatch(gpattern, { dot: true });
	  }

	  return {
	    matcher: new Minimatch(pattern, { dot: true }),
	    gmatcher: gmatcher
	  }
	}

	function setopts (self, pattern, options) {
	  if (!options)
	    options = {};

	  // base-matching: just use globstar for that.
	  if (options.matchBase && -1 === pattern.indexOf("/")) {
	    if (options.noglobstar) {
	      throw new Error("base matching requires globstar")
	    }
	    pattern = "**/" + pattern;
	  }

	  self.silent = !!options.silent;
	  self.pattern = pattern;
	  self.strict = options.strict !== false;
	  self.realpath = !!options.realpath;
	  self.realpathCache = options.realpathCache || Object.create(null);
	  self.follow = !!options.follow;
	  self.dot = !!options.dot;
	  self.mark = !!options.mark;
	  self.nodir = !!options.nodir;
	  if (self.nodir)
	    self.mark = true;
	  self.sync = !!options.sync;
	  self.nounique = !!options.nounique;
	  self.nonull = !!options.nonull;
	  self.nosort = !!options.nosort;
	  self.nocase = !!options.nocase;
	  self.stat = !!options.stat;
	  self.noprocess = !!options.noprocess;
	  self.absolute = !!options.absolute;
	  self.fs = options.fs || fs;

	  self.maxLength = options.maxLength || Infinity;
	  self.cache = options.cache || Object.create(null);
	  self.statCache = options.statCache || Object.create(null);
	  self.symlinks = options.symlinks || Object.create(null);

	  setupIgnores(self, options);

	  self.changedCwd = false;
	  var cwd = process.cwd();
	  if (!ownProp(options, "cwd"))
	    self.cwd = cwd;
	  else {
	    self.cwd = path.resolve(options.cwd);
	    self.changedCwd = self.cwd !== cwd;
	  }

	  self.root = options.root || path.resolve(self.cwd, "/");
	  self.root = path.resolve(self.root);
	  if (process.platform === "win32")
	    self.root = self.root.replace(/\\/g, "/");

	  // TODO: is an absolute `cwd` supposed to be resolved against `root`?
	  // e.g. { cwd: '/test', root: __dirname } === path.join(__dirname, '/test')
	  self.cwdAbs = isAbsolute(self.cwd) ? self.cwd : makeAbs(self, self.cwd);
	  if (process.platform === "win32")
	    self.cwdAbs = self.cwdAbs.replace(/\\/g, "/");
	  self.nomount = !!options.nomount;

	  // disable comments and negation in Minimatch.
	  // Note that they are not supported in Glob itself anyway.
	  options.nonegate = true;
	  options.nocomment = true;
	  // always treat \ in patterns as escapes, not path separators
	  options.allowWindowsEscape = false;

	  self.minimatch = new Minimatch(pattern, options);
	  self.options = self.minimatch.options;
	}

	function finish (self) {
	  var nou = self.nounique;
	  var all = nou ? [] : Object.create(null);

	  for (var i = 0, l = self.matches.length; i < l; i ++) {
	    var matches = self.matches[i];
	    if (!matches || Object.keys(matches).length === 0) {
	      if (self.nonull) {
	        // do like the shell, and spit out the literal glob
	        var literal = self.minimatch.globSet[i];
	        if (nou)
	          all.push(literal);
	        else
	          all[literal] = true;
	      }
	    } else {
	      // had matches
	      var m = Object.keys(matches);
	      if (nou)
	        all.push.apply(all, m);
	      else
	        m.forEach(function (m) {
	          all[m] = true;
	        });
	    }
	  }

	  if (!nou)
	    all = Object.keys(all);

	  if (!self.nosort)
	    all = all.sort(alphasort);

	  // at *some* point we statted all of these
	  if (self.mark) {
	    for (var i = 0; i < all.length; i++) {
	      all[i] = self._mark(all[i]);
	    }
	    if (self.nodir) {
	      all = all.filter(function (e) {
	        var notDir = !(/\/$/.test(e));
	        var c = self.cache[e] || self.cache[makeAbs(self, e)];
	        if (notDir && c)
	          notDir = c !== 'DIR' && !Array.isArray(c);
	        return notDir
	      });
	    }
	  }

	  if (self.ignore.length)
	    all = all.filter(function(m) {
	      return !isIgnored(self, m)
	    });

	  self.found = all;
	}

	function mark (self, p) {
	  var abs = makeAbs(self, p);
	  var c = self.cache[abs];
	  var m = p;
	  if (c) {
	    var isDir = c === 'DIR' || Array.isArray(c);
	    var slash = p.slice(-1) === '/';

	    if (isDir && !slash)
	      m += '/';
	    else if (!isDir && slash)
	      m = m.slice(0, -1);

	    if (m !== p) {
	      var mabs = makeAbs(self, m);
	      self.statCache[mabs] = self.statCache[abs];
	      self.cache[mabs] = self.cache[abs];
	    }
	  }

	  return m
	}

	// lotta situps...
	function makeAbs (self, f) {
	  var abs = f;
	  if (f.charAt(0) === '/') {
	    abs = path.join(self.root, f);
	  } else if (isAbsolute(f) || f === '') {
	    abs = f;
	  } else if (self.changedCwd) {
	    abs = path.resolve(self.cwd, f);
	  } else {
	    abs = path.resolve(f);
	  }

	  if (process.platform === 'win32')
	    abs = abs.replace(/\\/g, '/');

	  return abs
	}


	// Return true, if pattern ends with globstar '**', for the accompanying parent directory.
	// Ex:- If node_modules/** is the pattern, add 'node_modules' to ignore list along with it's contents
	function isIgnored (self, path) {
	  if (!self.ignore.length)
	    return false

	  return self.ignore.some(function(item) {
	    return item.matcher.match(path) || !!(item.gmatcher && item.gmatcher.match(path))
	  })
	}

	function childrenIgnored (self, path) {
	  if (!self.ignore.length)
	    return false

	  return self.ignore.some(function(item) {
	    return !!(item.gmatcher && item.gmatcher.match(path))
	  })
	}
	return common;
}

var sync;
var hasRequiredSync;

function requireSync () {
	if (hasRequiredSync) return sync;
	hasRequiredSync = 1;
	sync = globSync;
	globSync.GlobSync = GlobSync;

	var rp = requireFs_realpath();
	var minimatch = requireMinimatch();
	minimatch.Minimatch;
	requireGlob().Glob;
	var path = require$$1$2;
	var assert = require$$0$2;
	var isAbsolute = requirePathIsAbsolute();
	var common = requireCommon();
	var setopts = common.setopts;
	var ownProp = common.ownProp;
	var childrenIgnored = common.childrenIgnored;
	var isIgnored = common.isIgnored;

	function globSync (pattern, options) {
	  if (typeof options === 'function' || arguments.length === 3)
	    throw new TypeError('callback provided to sync glob\n'+
	                        'See: https://github.com/isaacs/node-glob/issues/167')

	  return new GlobSync(pattern, options).found
	}

	function GlobSync (pattern, options) {
	  if (!pattern)
	    throw new Error('must provide pattern')

	  if (typeof options === 'function' || arguments.length === 3)
	    throw new TypeError('callback provided to sync glob\n'+
	                        'See: https://github.com/isaacs/node-glob/issues/167')

	  if (!(this instanceof GlobSync))
	    return new GlobSync(pattern, options)

	  setopts(this, pattern, options);

	  if (this.noprocess)
	    return this

	  var n = this.minimatch.set.length;
	  this.matches = new Array(n);
	  for (var i = 0; i < n; i ++) {
	    this._process(this.minimatch.set[i], i, false);
	  }
	  this._finish();
	}

	GlobSync.prototype._finish = function () {
	  assert.ok(this instanceof GlobSync);
	  if (this.realpath) {
	    var self = this;
	    this.matches.forEach(function (matchset, index) {
	      var set = self.matches[index] = Object.create(null);
	      for (var p in matchset) {
	        try {
	          p = self._makeAbs(p);
	          var real = rp.realpathSync(p, self.realpathCache);
	          set[real] = true;
	        } catch (er) {
	          if (er.syscall === 'stat')
	            set[self._makeAbs(p)] = true;
	          else
	            throw er
	        }
	      }
	    });
	  }
	  common.finish(this);
	};


	GlobSync.prototype._process = function (pattern, index, inGlobStar) {
	  assert.ok(this instanceof GlobSync);

	  // Get the first [n] parts of pattern that are all strings.
	  var n = 0;
	  while (typeof pattern[n] === 'string') {
	    n ++;
	  }
	  // now n is the index of the first one that is *not* a string.

	  // See if there's anything else
	  var prefix;
	  switch (n) {
	    // if not, then this is rather simple
	    case pattern.length:
	      this._processSimple(pattern.join('/'), index);
	      return

	    case 0:
	      // pattern *starts* with some non-trivial item.
	      // going to readdir(cwd), but not include the prefix in matches.
	      prefix = null;
	      break

	    default:
	      // pattern has some string bits in the front.
	      // whatever it starts with, whether that's 'absolute' like /foo/bar,
	      // or 'relative' like '../baz'
	      prefix = pattern.slice(0, n).join('/');
	      break
	  }

	  var remain = pattern.slice(n);

	  // get the list of entries.
	  var read;
	  if (prefix === null)
	    read = '.';
	  else if (isAbsolute(prefix) ||
	      isAbsolute(pattern.map(function (p) {
	        return typeof p === 'string' ? p : '[*]'
	      }).join('/'))) {
	    if (!prefix || !isAbsolute(prefix))
	      prefix = '/' + prefix;
	    read = prefix;
	  } else
	    read = prefix;

	  var abs = this._makeAbs(read);

	  //if ignored, skip processing
	  if (childrenIgnored(this, read))
	    return

	  var isGlobStar = remain[0] === minimatch.GLOBSTAR;
	  if (isGlobStar)
	    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar);
	  else
	    this._processReaddir(prefix, read, abs, remain, index, inGlobStar);
	};


	GlobSync.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar) {
	  var entries = this._readdir(abs, inGlobStar);

	  // if the abs isn't a dir, then nothing can match!
	  if (!entries)
	    return

	  // It will only match dot entries if it starts with a dot, or if
	  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
	  var pn = remain[0];
	  var negate = !!this.minimatch.negate;
	  var rawGlob = pn._glob;
	  var dotOk = this.dot || rawGlob.charAt(0) === '.';

	  var matchedEntries = [];
	  for (var i = 0; i < entries.length; i++) {
	    var e = entries[i];
	    if (e.charAt(0) !== '.' || dotOk) {
	      var m;
	      if (negate && !prefix) {
	        m = !e.match(pn);
	      } else {
	        m = e.match(pn);
	      }
	      if (m)
	        matchedEntries.push(e);
	    }
	  }

	  var len = matchedEntries.length;
	  // If there are no matched entries, then nothing matches.
	  if (len === 0)
	    return

	  // if this is the last remaining pattern bit, then no need for
	  // an additional stat *unless* the user has specified mark or
	  // stat explicitly.  We know they exist, since readdir returned
	  // them.

	  if (remain.length === 1 && !this.mark && !this.stat) {
	    if (!this.matches[index])
	      this.matches[index] = Object.create(null);

	    for (var i = 0; i < len; i ++) {
	      var e = matchedEntries[i];
	      if (prefix) {
	        if (prefix.slice(-1) !== '/')
	          e = prefix + '/' + e;
	        else
	          e = prefix + e;
	      }

	      if (e.charAt(0) === '/' && !this.nomount) {
	        e = path.join(this.root, e);
	      }
	      this._emitMatch(index, e);
	    }
	    // This was the last one, and no stats were needed
	    return
	  }

	  // now test all matched entries as stand-ins for that part
	  // of the pattern.
	  remain.shift();
	  for (var i = 0; i < len; i ++) {
	    var e = matchedEntries[i];
	    var newPattern;
	    if (prefix)
	      newPattern = [prefix, e];
	    else
	      newPattern = [e];
	    this._process(newPattern.concat(remain), index, inGlobStar);
	  }
	};


	GlobSync.prototype._emitMatch = function (index, e) {
	  if (isIgnored(this, e))
	    return

	  var abs = this._makeAbs(e);

	  if (this.mark)
	    e = this._mark(e);

	  if (this.absolute) {
	    e = abs;
	  }

	  if (this.matches[index][e])
	    return

	  if (this.nodir) {
	    var c = this.cache[abs];
	    if (c === 'DIR' || Array.isArray(c))
	      return
	  }

	  this.matches[index][e] = true;

	  if (this.stat)
	    this._stat(e);
	};


	GlobSync.prototype._readdirInGlobStar = function (abs) {
	  // follow all symlinked directories forever
	  // just proceed as if this is a non-globstar situation
	  if (this.follow)
	    return this._readdir(abs, false)

	  var entries;
	  var lstat;
	  try {
	    lstat = this.fs.lstatSync(abs);
	  } catch (er) {
	    if (er.code === 'ENOENT') {
	      // lstat failed, doesn't exist
	      return null
	    }
	  }

	  var isSym = lstat && lstat.isSymbolicLink();
	  this.symlinks[abs] = isSym;

	  // If it's not a symlink or a dir, then it's definitely a regular file.
	  // don't bother doing a readdir in that case.
	  if (!isSym && lstat && !lstat.isDirectory())
	    this.cache[abs] = 'FILE';
	  else
	    entries = this._readdir(abs, false);

	  return entries
	};

	GlobSync.prototype._readdir = function (abs, inGlobStar) {

	  if (inGlobStar && !ownProp(this.symlinks, abs))
	    return this._readdirInGlobStar(abs)

	  if (ownProp(this.cache, abs)) {
	    var c = this.cache[abs];
	    if (!c || c === 'FILE')
	      return null

	    if (Array.isArray(c))
	      return c
	  }

	  try {
	    return this._readdirEntries(abs, this.fs.readdirSync(abs))
	  } catch (er) {
	    this._readdirError(abs, er);
	    return null
	  }
	};

	GlobSync.prototype._readdirEntries = function (abs, entries) {
	  // if we haven't asked to stat everything, then just
	  // assume that everything in there exists, so we can avoid
	  // having to stat it a second time.
	  if (!this.mark && !this.stat) {
	    for (var i = 0; i < entries.length; i ++) {
	      var e = entries[i];
	      if (abs === '/')
	        e = abs + e;
	      else
	        e = abs + '/' + e;
	      this.cache[e] = true;
	    }
	  }

	  this.cache[abs] = entries;

	  // mark and cache dir-ness
	  return entries
	};

	GlobSync.prototype._readdirError = function (f, er) {
	  // handle errors, and cache the information
	  switch (er.code) {
	    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
	    case 'ENOTDIR': // totally normal. means it *does* exist.
	      var abs = this._makeAbs(f);
	      this.cache[abs] = 'FILE';
	      if (abs === this.cwdAbs) {
	        var error = new Error(er.code + ' invalid cwd ' + this.cwd);
	        error.path = this.cwd;
	        error.code = er.code;
	        throw error
	      }
	      break

	    case 'ENOENT': // not terribly unusual
	    case 'ELOOP':
	    case 'ENAMETOOLONG':
	    case 'UNKNOWN':
	      this.cache[this._makeAbs(f)] = false;
	      break

	    default: // some unusual error.  Treat as failure.
	      this.cache[this._makeAbs(f)] = false;
	      if (this.strict)
	        throw er
	      if (!this.silent)
	        console.error('glob error', er);
	      break
	  }
	};

	GlobSync.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar) {

	  var entries = this._readdir(abs, inGlobStar);

	  // no entries means not a dir, so it can never have matches
	  // foo.txt/** doesn't match foo.txt
	  if (!entries)
	    return

	  // test without the globstar, and with every child both below
	  // and replacing the globstar.
	  var remainWithoutGlobStar = remain.slice(1);
	  var gspref = prefix ? [ prefix ] : [];
	  var noGlobStar = gspref.concat(remainWithoutGlobStar);

	  // the noGlobStar pattern exits the inGlobStar state
	  this._process(noGlobStar, index, false);

	  var len = entries.length;
	  var isSym = this.symlinks[abs];

	  // If it's a symlink, and we're in a globstar, then stop
	  if (isSym && inGlobStar)
	    return

	  for (var i = 0; i < len; i++) {
	    var e = entries[i];
	    if (e.charAt(0) === '.' && !this.dot)
	      continue

	    // these two cases enter the inGlobStar state
	    var instead = gspref.concat(entries[i], remainWithoutGlobStar);
	    this._process(instead, index, true);

	    var below = gspref.concat(entries[i], remain);
	    this._process(below, index, true);
	  }
	};

	GlobSync.prototype._processSimple = function (prefix, index) {
	  // XXX review this.  Shouldn't it be doing the mounting etc
	  // before doing stat?  kinda weird?
	  var exists = this._stat(prefix);

	  if (!this.matches[index])
	    this.matches[index] = Object.create(null);

	  // If it doesn't exist, then just mark the lack of results
	  if (!exists)
	    return

	  if (prefix && isAbsolute(prefix) && !this.nomount) {
	    var trail = /[\/\\]$/.test(prefix);
	    if (prefix.charAt(0) === '/') {
	      prefix = path.join(this.root, prefix);
	    } else {
	      prefix = path.resolve(this.root, prefix);
	      if (trail)
	        prefix += '/';
	    }
	  }

	  if (process.platform === 'win32')
	    prefix = prefix.replace(/\\/g, '/');

	  // Mark this as a match
	  this._emitMatch(index, prefix);
	};

	// Returns either 'DIR', 'FILE', or false
	GlobSync.prototype._stat = function (f) {
	  var abs = this._makeAbs(f);
	  var needDir = f.slice(-1) === '/';

	  if (f.length > this.maxLength)
	    return false

	  if (!this.stat && ownProp(this.cache, abs)) {
	    var c = this.cache[abs];

	    if (Array.isArray(c))
	      c = 'DIR';

	    // It exists, but maybe not how we need it
	    if (!needDir || c === 'DIR')
	      return c

	    if (needDir && c === 'FILE')
	      return false

	    // otherwise we have to stat, because maybe c=true
	    // if we know it exists, but not what it is.
	  }
	  var stat = this.statCache[abs];
	  if (!stat) {
	    var lstat;
	    try {
	      lstat = this.fs.lstatSync(abs);
	    } catch (er) {
	      if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
	        this.statCache[abs] = false;
	        return false
	      }
	    }

	    if (lstat && lstat.isSymbolicLink()) {
	      try {
	        stat = this.fs.statSync(abs);
	      } catch (er) {
	        stat = lstat;
	      }
	    } else {
	      stat = lstat;
	    }
	  }

	  this.statCache[abs] = stat;

	  var c = true;
	  if (stat)
	    c = stat.isDirectory() ? 'DIR' : 'FILE';

	  this.cache[abs] = this.cache[abs] || c;

	  if (needDir && c === 'FILE')
	    return false

	  return c
	};

	GlobSync.prototype._mark = function (p) {
	  return common.mark(this, p)
	};

	GlobSync.prototype._makeAbs = function (f) {
	  return common.makeAbs(this, f)
	};
	return sync;
}

var wrappy_1;
var hasRequiredWrappy;

function requireWrappy () {
	if (hasRequiredWrappy) return wrappy_1;
	hasRequiredWrappy = 1;
	// Returns a wrapper function that returns a wrapped callback
	// The wrapper function should do some stuff, and return a
	// presumably different callback function.
	// This makes sure that own properties are retained, so that
	// decorations and such are not lost along the way.
	wrappy_1 = wrappy;
	function wrappy (fn, cb) {
	  if (fn && cb) return wrappy(fn)(cb)

	  if (typeof fn !== 'function')
	    throw new TypeError('need wrapper function')

	  Object.keys(fn).forEach(function (k) {
	    wrapper[k] = fn[k];
	  });

	  return wrapper

	  function wrapper() {
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }
	    var ret = fn.apply(this, args);
	    var cb = args[args.length-1];
	    if (typeof ret === 'function' && ret !== cb) {
	      Object.keys(cb).forEach(function (k) {
	        ret[k] = cb[k];
	      });
	    }
	    return ret
	  }
	}
	return wrappy_1;
}

var once = {exports: {}};

var hasRequiredOnce;

function requireOnce () {
	if (hasRequiredOnce) return once.exports;
	hasRequiredOnce = 1;
	var wrappy = requireWrappy();
	once.exports = wrappy(once$1);
	once.exports.strict = wrappy(onceStrict);

	once$1.proto = once$1(function () {
	  Object.defineProperty(Function.prototype, 'once', {
	    value: function () {
	      return once$1(this)
	    },
	    configurable: true
	  });

	  Object.defineProperty(Function.prototype, 'onceStrict', {
	    value: function () {
	      return onceStrict(this)
	    },
	    configurable: true
	  });
	});

	function once$1 (fn) {
	  var f = function () {
	    if (f.called) return f.value
	    f.called = true;
	    return f.value = fn.apply(this, arguments)
	  };
	  f.called = false;
	  return f
	}

	function onceStrict (fn) {
	  var f = function () {
	    if (f.called)
	      throw new Error(f.onceError)
	    f.called = true;
	    return f.value = fn.apply(this, arguments)
	  };
	  var name = fn.name || 'Function wrapped with `once`';
	  f.onceError = name + " shouldn't be called more than once";
	  f.called = false;
	  return f
	}
	return once.exports;
}

var inflight_1;
var hasRequiredInflight;

function requireInflight () {
	if (hasRequiredInflight) return inflight_1;
	hasRequiredInflight = 1;
	var wrappy = requireWrappy();
	var reqs = Object.create(null);
	var once = requireOnce();

	inflight_1 = wrappy(inflight);

	function inflight (key, cb) {
	  if (reqs[key]) {
	    reqs[key].push(cb);
	    return null
	  } else {
	    reqs[key] = [cb];
	    return makeres(key)
	  }
	}

	function makeres (key) {
	  return once(function RES () {
	    var cbs = reqs[key];
	    var len = cbs.length;
	    var args = slice(arguments);

	    // XXX It's somewhat ambiguous whether a new callback added in this
	    // pass should be queued for later execution if something in the
	    // list of callbacks throws, or if it should just be discarded.
	    // However, it's such an edge case that it hardly matters, and either
	    // choice is likely as surprising as the other.
	    // As it happens, we do go ahead and schedule it for later execution.
	    try {
	      for (var i = 0; i < len; i++) {
	        cbs[i].apply(null, args);
	      }
	    } finally {
	      if (cbs.length > len) {
	        // added more in the interim.
	        // de-zalgo, just in case, but don't call again.
	        cbs.splice(0, len);
	        process.nextTick(function () {
	          RES.apply(null, args);
	        });
	      } else {
	        delete reqs[key];
	      }
	    }
	  })
	}

	function slice (args) {
	  var length = args.length;
	  var array = [];

	  for (var i = 0; i < length; i++) array[i] = args[i];
	  return array
	}
	return inflight_1;
}

var glob_1;
var hasRequiredGlob;

function requireGlob () {
	if (hasRequiredGlob) return glob_1;
	hasRequiredGlob = 1;
	// Approach:
	//
	// 1. Get the minimatch set
	// 2. For each pattern in the set, PROCESS(pattern, false)
	// 3. Store matches per-set, then uniq them
	//
	// PROCESS(pattern, inGlobStar)
	// Get the first [n] items from pattern that are all strings
	// Join these together.  This is PREFIX.
	//   If there is no more remaining, then stat(PREFIX) and
	//   add to matches if it succeeds.  END.
	//
	// If inGlobStar and PREFIX is symlink and points to dir
	//   set ENTRIES = []
	// else readdir(PREFIX) as ENTRIES
	//   If fail, END
	//
	// with ENTRIES
	//   If pattern[n] is GLOBSTAR
	//     // handle the case where the globstar match is empty
	//     // by pruning it out, and testing the resulting pattern
	//     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
	//     // handle other cases.
	//     for ENTRY in ENTRIES (not dotfiles)
	//       // attach globstar + tail onto the entry
	//       // Mark that this entry is a globstar match
	//       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
	//
	//   else // not globstar
	//     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
	//       Test ENTRY against pattern[n]
	//       If fails, continue
	//       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
	//
	// Caveat:
	//   Cache all stats and readdirs results to minimize syscall.  Since all
	//   we ever care about is existence and directory-ness, we can just keep
	//   `true` for files, and [children,...] for directories, or `false` for
	//   things that don't exist.

	glob_1 = glob;

	var rp = requireFs_realpath();
	var minimatch = requireMinimatch();
	minimatch.Minimatch;
	var inherits = requireInherits();
	var EE = require$$0.EventEmitter;
	var path = require$$1$2;
	var assert = require$$0$2;
	var isAbsolute = requirePathIsAbsolute();
	var globSync = requireSync();
	var common = requireCommon();
	var setopts = common.setopts;
	var ownProp = common.ownProp;
	var inflight = requireInflight();
	var childrenIgnored = common.childrenIgnored;
	var isIgnored = common.isIgnored;

	var once = requireOnce();

	function glob (pattern, options, cb) {
	  if (typeof options === 'function') cb = options, options = {};
	  if (!options) options = {};

	  if (options.sync) {
	    if (cb)
	      throw new TypeError('callback provided to sync glob')
	    return globSync(pattern, options)
	  }

	  return new Glob(pattern, options, cb)
	}

	glob.sync = globSync;
	var GlobSync = glob.GlobSync = globSync.GlobSync;

	// old api surface
	glob.glob = glob;

	function extend (origin, add) {
	  if (add === null || typeof add !== 'object') {
	    return origin
	  }

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin
	}

	glob.hasMagic = function (pattern, options_) {
	  var options = extend({}, options_);
	  options.noprocess = true;

	  var g = new Glob(pattern, options);
	  var set = g.minimatch.set;

	  if (!pattern)
	    return false

	  if (set.length > 1)
	    return true

	  for (var j = 0; j < set[0].length; j++) {
	    if (typeof set[0][j] !== 'string')
	      return true
	  }

	  return false
	};

	glob.Glob = Glob;
	inherits(Glob, EE);
	function Glob (pattern, options, cb) {
	  if (typeof options === 'function') {
	    cb = options;
	    options = null;
	  }

	  if (options && options.sync) {
	    if (cb)
	      throw new TypeError('callback provided to sync glob')
	    return new GlobSync(pattern, options)
	  }

	  if (!(this instanceof Glob))
	    return new Glob(pattern, options, cb)

	  setopts(this, pattern, options);
	  this._didRealPath = false;

	  // process each pattern in the minimatch set
	  var n = this.minimatch.set.length;

	  // The matches are stored as {<filename>: true,...} so that
	  // duplicates are automagically pruned.
	  // Later, we do an Object.keys() on these.
	  // Keep them as a list so we can fill in when nonull is set.
	  this.matches = new Array(n);

	  if (typeof cb === 'function') {
	    cb = once(cb);
	    this.on('error', cb);
	    this.on('end', function (matches) {
	      cb(null, matches);
	    });
	  }

	  var self = this;
	  this._processing = 0;

	  this._emitQueue = [];
	  this._processQueue = [];
	  this.paused = false;

	  if (this.noprocess)
	    return this

	  if (n === 0)
	    return done()

	  var sync = true;
	  for (var i = 0; i < n; i ++) {
	    this._process(this.minimatch.set[i], i, false, done);
	  }
	  sync = false;

	  function done () {
	    --self._processing;
	    if (self._processing <= 0) {
	      if (sync) {
	        process.nextTick(function () {
	          self._finish();
	        });
	      } else {
	        self._finish();
	      }
	    }
	  }
	}

	Glob.prototype._finish = function () {
	  assert(this instanceof Glob);
	  if (this.aborted)
	    return

	  if (this.realpath && !this._didRealpath)
	    return this._realpath()

	  common.finish(this);
	  this.emit('end', this.found);
	};

	Glob.prototype._realpath = function () {
	  if (this._didRealpath)
	    return

	  this._didRealpath = true;

	  var n = this.matches.length;
	  if (n === 0)
	    return this._finish()

	  var self = this;
	  for (var i = 0; i < this.matches.length; i++)
	    this._realpathSet(i, next);

	  function next () {
	    if (--n === 0)
	      self._finish();
	  }
	};

	Glob.prototype._realpathSet = function (index, cb) {
	  var matchset = this.matches[index];
	  if (!matchset)
	    return cb()

	  var found = Object.keys(matchset);
	  var self = this;
	  var n = found.length;

	  if (n === 0)
	    return cb()

	  var set = this.matches[index] = Object.create(null);
	  found.forEach(function (p, i) {
	    // If there's a problem with the stat, then it means that
	    // one or more of the links in the realpath couldn't be
	    // resolved.  just return the abs value in that case.
	    p = self._makeAbs(p);
	    rp.realpath(p, self.realpathCache, function (er, real) {
	      if (!er)
	        set[real] = true;
	      else if (er.syscall === 'stat')
	        set[p] = true;
	      else
	        self.emit('error', er); // srsly wtf right here

	      if (--n === 0) {
	        self.matches[index] = set;
	        cb();
	      }
	    });
	  });
	};

	Glob.prototype._mark = function (p) {
	  return common.mark(this, p)
	};

	Glob.prototype._makeAbs = function (f) {
	  return common.makeAbs(this, f)
	};

	Glob.prototype.abort = function () {
	  this.aborted = true;
	  this.emit('abort');
	};

	Glob.prototype.pause = function () {
	  if (!this.paused) {
	    this.paused = true;
	    this.emit('pause');
	  }
	};

	Glob.prototype.resume = function () {
	  if (this.paused) {
	    this.emit('resume');
	    this.paused = false;
	    if (this._emitQueue.length) {
	      var eq = this._emitQueue.slice(0);
	      this._emitQueue.length = 0;
	      for (var i = 0; i < eq.length; i ++) {
	        var e = eq[i];
	        this._emitMatch(e[0], e[1]);
	      }
	    }
	    if (this._processQueue.length) {
	      var pq = this._processQueue.slice(0);
	      this._processQueue.length = 0;
	      for (var i = 0; i < pq.length; i ++) {
	        var p = pq[i];
	        this._processing--;
	        this._process(p[0], p[1], p[2], p[3]);
	      }
	    }
	  }
	};

	Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
	  assert(this instanceof Glob);
	  assert(typeof cb === 'function');

	  if (this.aborted)
	    return

	  this._processing++;
	  if (this.paused) {
	    this._processQueue.push([pattern, index, inGlobStar, cb]);
	    return
	  }

	  //console.error('PROCESS %d', this._processing, pattern)

	  // Get the first [n] parts of pattern that are all strings.
	  var n = 0;
	  while (typeof pattern[n] === 'string') {
	    n ++;
	  }
	  // now n is the index of the first one that is *not* a string.

	  // see if there's anything else
	  var prefix;
	  switch (n) {
	    // if not, then this is rather simple
	    case pattern.length:
	      this._processSimple(pattern.join('/'), index, cb);
	      return

	    case 0:
	      // pattern *starts* with some non-trivial item.
	      // going to readdir(cwd), but not include the prefix in matches.
	      prefix = null;
	      break

	    default:
	      // pattern has some string bits in the front.
	      // whatever it starts with, whether that's 'absolute' like /foo/bar,
	      // or 'relative' like '../baz'
	      prefix = pattern.slice(0, n).join('/');
	      break
	  }

	  var remain = pattern.slice(n);

	  // get the list of entries.
	  var read;
	  if (prefix === null)
	    read = '.';
	  else if (isAbsolute(prefix) ||
	      isAbsolute(pattern.map(function (p) {
	        return typeof p === 'string' ? p : '[*]'
	      }).join('/'))) {
	    if (!prefix || !isAbsolute(prefix))
	      prefix = '/' + prefix;
	    read = prefix;
	  } else
	    read = prefix;

	  var abs = this._makeAbs(read);

	  //if ignored, skip _processing
	  if (childrenIgnored(this, read))
	    return cb()

	  var isGlobStar = remain[0] === minimatch.GLOBSTAR;
	  if (isGlobStar)
	    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb);
	  else
	    this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb);
	};

	Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
	  var self = this;
	  this._readdir(abs, inGlobStar, function (er, entries) {
	    return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
	  });
	};

	Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {

	  // if the abs isn't a dir, then nothing can match!
	  if (!entries)
	    return cb()

	  // It will only match dot entries if it starts with a dot, or if
	  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
	  var pn = remain[0];
	  var negate = !!this.minimatch.negate;
	  var rawGlob = pn._glob;
	  var dotOk = this.dot || rawGlob.charAt(0) === '.';

	  var matchedEntries = [];
	  for (var i = 0; i < entries.length; i++) {
	    var e = entries[i];
	    if (e.charAt(0) !== '.' || dotOk) {
	      var m;
	      if (negate && !prefix) {
	        m = !e.match(pn);
	      } else {
	        m = e.match(pn);
	      }
	      if (m)
	        matchedEntries.push(e);
	    }
	  }

	  //console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)

	  var len = matchedEntries.length;
	  // If there are no matched entries, then nothing matches.
	  if (len === 0)
	    return cb()

	  // if this is the last remaining pattern bit, then no need for
	  // an additional stat *unless* the user has specified mark or
	  // stat explicitly.  We know they exist, since readdir returned
	  // them.

	  if (remain.length === 1 && !this.mark && !this.stat) {
	    if (!this.matches[index])
	      this.matches[index] = Object.create(null);

	    for (var i = 0; i < len; i ++) {
	      var e = matchedEntries[i];
	      if (prefix) {
	        if (prefix !== '/')
	          e = prefix + '/' + e;
	        else
	          e = prefix + e;
	      }

	      if (e.charAt(0) === '/' && !this.nomount) {
	        e = path.join(this.root, e);
	      }
	      this._emitMatch(index, e);
	    }
	    // This was the last one, and no stats were needed
	    return cb()
	  }

	  // now test all matched entries as stand-ins for that part
	  // of the pattern.
	  remain.shift();
	  for (var i = 0; i < len; i ++) {
	    var e = matchedEntries[i];
	    if (prefix) {
	      if (prefix !== '/')
	        e = prefix + '/' + e;
	      else
	        e = prefix + e;
	    }
	    this._process([e].concat(remain), index, inGlobStar, cb);
	  }
	  cb();
	};

	Glob.prototype._emitMatch = function (index, e) {
	  if (this.aborted)
	    return

	  if (isIgnored(this, e))
	    return

	  if (this.paused) {
	    this._emitQueue.push([index, e]);
	    return
	  }

	  var abs = isAbsolute(e) ? e : this._makeAbs(e);

	  if (this.mark)
	    e = this._mark(e);

	  if (this.absolute)
	    e = abs;

	  if (this.matches[index][e])
	    return

	  if (this.nodir) {
	    var c = this.cache[abs];
	    if (c === 'DIR' || Array.isArray(c))
	      return
	  }

	  this.matches[index][e] = true;

	  var st = this.statCache[abs];
	  if (st)
	    this.emit('stat', e, st);

	  this.emit('match', e);
	};

	Glob.prototype._readdirInGlobStar = function (abs, cb) {
	  if (this.aborted)
	    return

	  // follow all symlinked directories forever
	  // just proceed as if this is a non-globstar situation
	  if (this.follow)
	    return this._readdir(abs, false, cb)

	  var lstatkey = 'lstat\0' + abs;
	  var self = this;
	  var lstatcb = inflight(lstatkey, lstatcb_);

	  if (lstatcb)
	    self.fs.lstat(abs, lstatcb);

	  function lstatcb_ (er, lstat) {
	    if (er && er.code === 'ENOENT')
	      return cb()

	    var isSym = lstat && lstat.isSymbolicLink();
	    self.symlinks[abs] = isSym;

	    // If it's not a symlink or a dir, then it's definitely a regular file.
	    // don't bother doing a readdir in that case.
	    if (!isSym && lstat && !lstat.isDirectory()) {
	      self.cache[abs] = 'FILE';
	      cb();
	    } else
	      self._readdir(abs, false, cb);
	  }
	};

	Glob.prototype._readdir = function (abs, inGlobStar, cb) {
	  if (this.aborted)
	    return

	  cb = inflight('readdir\0'+abs+'\0'+inGlobStar, cb);
	  if (!cb)
	    return

	  //console.error('RD %j %j', +inGlobStar, abs)
	  if (inGlobStar && !ownProp(this.symlinks, abs))
	    return this._readdirInGlobStar(abs, cb)

	  if (ownProp(this.cache, abs)) {
	    var c = this.cache[abs];
	    if (!c || c === 'FILE')
	      return cb()

	    if (Array.isArray(c))
	      return cb(null, c)
	  }

	  var self = this;
	  self.fs.readdir(abs, readdirCb(this, abs, cb));
	};

	function readdirCb (self, abs, cb) {
	  return function (er, entries) {
	    if (er)
	      self._readdirError(abs, er, cb);
	    else
	      self._readdirEntries(abs, entries, cb);
	  }
	}

	Glob.prototype._readdirEntries = function (abs, entries, cb) {
	  if (this.aborted)
	    return

	  // if we haven't asked to stat everything, then just
	  // assume that everything in there exists, so we can avoid
	  // having to stat it a second time.
	  if (!this.mark && !this.stat) {
	    for (var i = 0; i < entries.length; i ++) {
	      var e = entries[i];
	      if (abs === '/')
	        e = abs + e;
	      else
	        e = abs + '/' + e;
	      this.cache[e] = true;
	    }
	  }

	  this.cache[abs] = entries;
	  return cb(null, entries)
	};

	Glob.prototype._readdirError = function (f, er, cb) {
	  if (this.aborted)
	    return

	  // handle errors, and cache the information
	  switch (er.code) {
	    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
	    case 'ENOTDIR': // totally normal. means it *does* exist.
	      var abs = this._makeAbs(f);
	      this.cache[abs] = 'FILE';
	      if (abs === this.cwdAbs) {
	        var error = new Error(er.code + ' invalid cwd ' + this.cwd);
	        error.path = this.cwd;
	        error.code = er.code;
	        this.emit('error', error);
	        this.abort();
	      }
	      break

	    case 'ENOENT': // not terribly unusual
	    case 'ELOOP':
	    case 'ENAMETOOLONG':
	    case 'UNKNOWN':
	      this.cache[this._makeAbs(f)] = false;
	      break

	    default: // some unusual error.  Treat as failure.
	      this.cache[this._makeAbs(f)] = false;
	      if (this.strict) {
	        this.emit('error', er);
	        // If the error is handled, then we abort
	        // if not, we threw out of here
	        this.abort();
	      }
	      if (!this.silent)
	        console.error('glob error', er);
	      break
	  }

	  return cb()
	};

	Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
	  var self = this;
	  this._readdir(abs, inGlobStar, function (er, entries) {
	    self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb);
	  });
	};


	Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
	  //console.error('pgs2', prefix, remain[0], entries)

	  // no entries means not a dir, so it can never have matches
	  // foo.txt/** doesn't match foo.txt
	  if (!entries)
	    return cb()

	  // test without the globstar, and with every child both below
	  // and replacing the globstar.
	  var remainWithoutGlobStar = remain.slice(1);
	  var gspref = prefix ? [ prefix ] : [];
	  var noGlobStar = gspref.concat(remainWithoutGlobStar);

	  // the noGlobStar pattern exits the inGlobStar state
	  this._process(noGlobStar, index, false, cb);

	  var isSym = this.symlinks[abs];
	  var len = entries.length;

	  // If it's a symlink, and we're in a globstar, then stop
	  if (isSym && inGlobStar)
	    return cb()

	  for (var i = 0; i < len; i++) {
	    var e = entries[i];
	    if (e.charAt(0) === '.' && !this.dot)
	      continue

	    // these two cases enter the inGlobStar state
	    var instead = gspref.concat(entries[i], remainWithoutGlobStar);
	    this._process(instead, index, true, cb);

	    var below = gspref.concat(entries[i], remain);
	    this._process(below, index, true, cb);
	  }

	  cb();
	};

	Glob.prototype._processSimple = function (prefix, index, cb) {
	  // XXX review this.  Shouldn't it be doing the mounting etc
	  // before doing stat?  kinda weird?
	  var self = this;
	  this._stat(prefix, function (er, exists) {
	    self._processSimple2(prefix, index, er, exists, cb);
	  });
	};
	Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {

	  //console.error('ps2', prefix, exists)

	  if (!this.matches[index])
	    this.matches[index] = Object.create(null);

	  // If it doesn't exist, then just mark the lack of results
	  if (!exists)
	    return cb()

	  if (prefix && isAbsolute(prefix) && !this.nomount) {
	    var trail = /[\/\\]$/.test(prefix);
	    if (prefix.charAt(0) === '/') {
	      prefix = path.join(this.root, prefix);
	    } else {
	      prefix = path.resolve(this.root, prefix);
	      if (trail)
	        prefix += '/';
	    }
	  }

	  if (process.platform === 'win32')
	    prefix = prefix.replace(/\\/g, '/');

	  // Mark this as a match
	  this._emitMatch(index, prefix);
	  cb();
	};

	// Returns either 'DIR', 'FILE', or false
	Glob.prototype._stat = function (f, cb) {
	  var abs = this._makeAbs(f);
	  var needDir = f.slice(-1) === '/';

	  if (f.length > this.maxLength)
	    return cb()

	  if (!this.stat && ownProp(this.cache, abs)) {
	    var c = this.cache[abs];

	    if (Array.isArray(c))
	      c = 'DIR';

	    // It exists, but maybe not how we need it
	    if (!needDir || c === 'DIR')
	      return cb(null, c)

	    if (needDir && c === 'FILE')
	      return cb()

	    // otherwise we have to stat, because maybe c=true
	    // if we know it exists, but not what it is.
	  }
	  var stat = this.statCache[abs];
	  if (stat !== undefined) {
	    if (stat === false)
	      return cb(null, stat)
	    else {
	      var type = stat.isDirectory() ? 'DIR' : 'FILE';
	      if (needDir && type === 'FILE')
	        return cb()
	      else
	        return cb(null, type, stat)
	    }
	  }

	  var self = this;
	  var statcb = inflight('stat\0' + abs, lstatcb_);
	  if (statcb)
	    self.fs.lstat(abs, statcb);

	  function lstatcb_ (er, lstat) {
	    if (lstat && lstat.isSymbolicLink()) {
	      // If it's a symlink, then treat it as the target, unless
	      // the target does not exist, then treat it as a file.
	      return self.fs.stat(abs, function (er, stat) {
	        if (er)
	          self._stat2(f, abs, null, lstat, cb);
	        else
	          self._stat2(f, abs, er, stat, cb);
	      })
	    } else {
	      self._stat2(f, abs, er, lstat, cb);
	    }
	  }
	};

	Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
	  if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
	    this.statCache[abs] = false;
	    return cb()
	  }

	  var needDir = f.slice(-1) === '/';
	  this.statCache[abs] = stat;

	  if (abs.slice(-1) === '/' && stat && !stat.isDirectory())
	    return cb(null, false, stat)

	  var c = true;
	  if (stat)
	    c = stat.isDirectory() ? 'DIR' : 'FILE';
	  this.cache[abs] = this.cache[abs] || c;

	  if (needDir && c === 'FILE')
	    return cb()

	  return cb(null, c, stat)
	};
	return glob_1;
}

var rimraf_1$1 = rimraf$3;
rimraf$3.sync = rimrafSync$3;

var assert$1 = require$$0$2;
var path$3 = require$$1$2;
var fs$3 = require$$0$3;
var glob$1 = undefined;
try {
  glob$1 = requireGlob();
} catch (_err) {
  // treat glob as optional.
}
var _0666 = parseInt('666', 8);

var defaultGlobOpts$1 = {
  nosort: true,
  silent: true
};

// for EMFILE handling
var timeout$1 = 0;

var isWindows$2 = (process.platform === "win32");

function defaults$1 (options) {
  var methods = [
    'unlink',
    'chmod',
    'stat',
    'lstat',
    'rmdir',
    'readdir'
  ];
  methods.forEach(function(m) {
    options[m] = options[m] || fs$3[m];
    m = m + 'Sync';
    options[m] = options[m] || fs$3[m];
  });

  options.maxBusyTries = options.maxBusyTries || 3;
  options.emfileWait = options.emfileWait || 1000;
  if (options.glob === false) {
    options.disableGlob = true;
  }
  if (options.disableGlob !== true && glob$1 === undefined) {
    throw Error('glob dependency not found, set `options.disableGlob = true` if intentional')
  }
  options.disableGlob = options.disableGlob || false;
  options.glob = options.glob || defaultGlobOpts$1;
}

function rimraf$3 (p, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  assert$1(p, 'rimraf: missing path');
  assert$1.equal(typeof p, 'string', 'rimraf: path should be a string');
  assert$1.equal(typeof cb, 'function', 'rimraf: callback function required');
  assert$1(options, 'rimraf: invalid options argument provided');
  assert$1.equal(typeof options, 'object', 'rimraf: options should be object');

  defaults$1(options);

  var busyTries = 0;
  var errState = null;
  var n = 0;

  if (options.disableGlob || !glob$1.hasMagic(p))
    return afterGlob(null, [p])

  options.lstat(p, function (er, stat) {
    if (!er)
      return afterGlob(null, [p])

    glob$1(p, options.glob, afterGlob);
  });

  function next (er) {
    errState = errState || er;
    if (--n === 0)
      cb(errState);
  }

  function afterGlob (er, results) {
    if (er)
      return cb(er)

    n = results.length;
    if (n === 0)
      return cb()

    results.forEach(function (p) {
      rimraf_$1(p, options, function CB (er) {
        if (er) {
          if ((er.code === "EBUSY" || er.code === "ENOTEMPTY" || er.code === "EPERM") &&
              busyTries < options.maxBusyTries) {
            busyTries ++;
            var time = busyTries * 100;
            // try again, with the same exact callback as this one.
            return setTimeout(function () {
              rimraf_$1(p, options, CB);
            }, time)
          }

          // this one won't happen if graceful-fs is used.
          if (er.code === "EMFILE" && timeout$1 < options.emfileWait) {
            return setTimeout(function () {
              rimraf_$1(p, options, CB);
            }, timeout$1 ++)
          }

          // already gone
          if (er.code === "ENOENT") er = null;
        }

        timeout$1 = 0;
        next(er);
      });
    });
  }
}

// Two possible strategies.
// 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
// 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
//
// Both result in an extra syscall when you guess wrong.  However, there
// are likely far more normal files in the world than directories.  This
// is based on the assumption that a the average number of files per
// directory is >= 1.
//
// If anyone ever complains about this, then I guess the strategy could
// be made configurable somehow.  But until then, YAGNI.
function rimraf_$1 (p, options, cb) {
  assert$1(p);
  assert$1(options);
  assert$1(typeof cb === 'function');

  // sunos lets the root user unlink directories, which is... weird.
  // so we have to lstat here and make sure it's not a dir.
  options.lstat(p, function (er, st) {
    if (er && er.code === "ENOENT")
      return cb(null)

    // Windows can EPERM on stat.  Life is suffering.
    if (er && er.code === "EPERM" && isWindows$2)
      fixWinEPERM$1(p, options, er, cb);

    if (st && st.isDirectory())
      return rmdir$2(p, options, er, cb)

    options.unlink(p, function (er) {
      if (er) {
        if (er.code === "ENOENT")
          return cb(null)
        if (er.code === "EPERM")
          return (isWindows$2)
            ? fixWinEPERM$1(p, options, er, cb)
            : rmdir$2(p, options, er, cb)
        if (er.code === "EISDIR")
          return rmdir$2(p, options, er, cb)
      }
      return cb(er)
    });
  });
}

function fixWinEPERM$1 (p, options, er, cb) {
  assert$1(p);
  assert$1(options);
  assert$1(typeof cb === 'function');
  if (er)
    assert$1(er instanceof Error);

  options.chmod(p, _0666, function (er2) {
    if (er2)
      cb(er2.code === "ENOENT" ? null : er);
    else
      options.stat(p, function(er3, stats) {
        if (er3)
          cb(er3.code === "ENOENT" ? null : er);
        else if (stats.isDirectory())
          rmdir$2(p, options, er, cb);
        else
          options.unlink(p, cb);
      });
  });
}

function fixWinEPERMSync$1 (p, options, er) {
  assert$1(p);
  assert$1(options);
  if (er)
    assert$1(er instanceof Error);

  try {
    options.chmodSync(p, _0666);
  } catch (er2) {
    if (er2.code === "ENOENT")
      return
    else
      throw er
  }

  try {
    var stats = options.statSync(p);
  } catch (er3) {
    if (er3.code === "ENOENT")
      return
    else
      throw er
  }

  if (stats.isDirectory())
    rmdirSync$2(p, options, er);
  else
    options.unlinkSync(p);
}

function rmdir$2 (p, options, originalEr, cb) {
  assert$1(p);
  assert$1(options);
  if (originalEr)
    assert$1(originalEr instanceof Error);
  assert$1(typeof cb === 'function');

  // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
  // if we guessed wrong, and it's not a directory, then
  // raise the original error.
  options.rmdir(p, function (er) {
    if (er && (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM"))
      rmkids$1(p, options, cb);
    else if (er && er.code === "ENOTDIR")
      cb(originalEr);
    else
      cb(er);
  });
}

function rmkids$1(p, options, cb) {
  assert$1(p);
  assert$1(options);
  assert$1(typeof cb === 'function');

  options.readdir(p, function (er, files) {
    if (er)
      return cb(er)
    var n = files.length;
    if (n === 0)
      return options.rmdir(p, cb)
    var errState;
    files.forEach(function (f) {
      rimraf$3(path$3.join(p, f), options, function (er) {
        if (errState)
          return
        if (er)
          return cb(errState = er)
        if (--n === 0)
          options.rmdir(p, cb);
      });
    });
  });
}

// this looks simpler, and is strictly *faster*, but will
// tie up the JavaScript thread and fail on excessively
// deep directory trees.
function rimrafSync$3 (p, options) {
  options = options || {};
  defaults$1(options);

  assert$1(p, 'rimraf: missing path');
  assert$1.equal(typeof p, 'string', 'rimraf: path should be a string');
  assert$1(options, 'rimraf: missing options');
  assert$1.equal(typeof options, 'object', 'rimraf: options should be object');

  var results;

  if (options.disableGlob || !glob$1.hasMagic(p)) {
    results = [p];
  } else {
    try {
      options.lstatSync(p);
      results = [p];
    } catch (er) {
      results = glob$1.sync(p, options.glob);
    }
  }

  if (!results.length)
    return

  for (var i = 0; i < results.length; i++) {
    var p = results[i];

    try {
      var st = options.lstatSync(p);
    } catch (er) {
      if (er.code === "ENOENT")
        return

      // Windows can EPERM on stat.  Life is suffering.
      if (er.code === "EPERM" && isWindows$2)
        fixWinEPERMSync$1(p, options, er);
    }

    try {
      // sunos lets the root user unlink directories, which is... weird.
      if (st && st.isDirectory())
        rmdirSync$2(p, options, null);
      else
        options.unlinkSync(p);
    } catch (er) {
      if (er.code === "ENOENT")
        return
      if (er.code === "EPERM")
        return isWindows$2 ? fixWinEPERMSync$1(p, options, er) : rmdirSync$2(p, options, er)
      if (er.code !== "EISDIR")
        throw er

      rmdirSync$2(p, options, er);
    }
  }
}

function rmdirSync$2 (p, options, originalEr) {
  assert$1(p);
  assert$1(options);
  if (originalEr)
    assert$1(originalEr instanceof Error);

  try {
    options.rmdirSync(p);
  } catch (er) {
    if (er.code === "ENOENT")
      return
    if (er.code === "ENOTDIR")
      throw originalEr
    if (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM")
      rmkidsSync$1(p, options);
  }
}

function rmkidsSync$1 (p, options) {
  assert$1(p);
  assert$1(options);
  options.readdirSync(p).forEach(function (f) {
    rimrafSync$3(path$3.join(p, f), options);
  });

  // We only end up here once we got ENOTEMPTY at least once, and
  // at this point, we are guaranteed to have removed all the kids.
  // So, we know that it won't be ENOENT or ENOTDIR or anything else.
  // try really hard to delete stuff on windows, because it has a
  // PROFOUNDLY annoying habit of not closing handles promptly when
  // files are deleted, resulting in spurious ENOTEMPTY errors.
  var retries = isWindows$2 ? 100 : 1;
  var i = 0;
  do {
    var threw = true;
    try {
      var ret = options.rmdirSync(p, options);
      threw = false;
      return ret
    } finally {
      if (++i < retries && threw)
        continue
    }
  } while (true)
}

Object.defineProperty(sander_cjs, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs$2 = gracefulFs;
var path$2 = require$$1$2;
var mkdirp$1 = _interopDefault(mkdirp$2);
var fs$1$1 = require$$0$3;
var _rimraf = _interopDefault(rimraf_1$1);

function resolvePath ( args ) {
	return path$2.resolve.apply( null, args );
}

function normaliseArguments ( args ) {
	var len = args.length;

	var buildingPath = true;
	var pathargs = [];
	var normalised = [ null ]; // null is a placeholder for the resolved path
	var i;

	for ( i = 0; i < len; i += 1 ) {
		if ( buildingPath && typeof args[i] === 'string' ) {
			pathargs[i] = args[i];
		} else {
			buildingPath = false;
			normalised.push( args[i] );
		}
	}

	normalised[0] = resolvePath( pathargs );

	return normalised;
}

function asyncMethod ( methodName ) {
	return function () {
		var args = normaliseArguments( arguments );

		return new Promise( function ( fulfil, reject ) {
			args.push( function ( err, result ) {
				if ( err ) {
					reject( err );
				} else {
					fulfil( result );
				}
			});

			fs$2[ methodName ].apply( fs$2, args );
		});
	};
}

function syncMethod ( methodName ) {
	return function () {
		var args = normaliseArguments( arguments );
		return fs$2[ methodName ].apply( fs$2, args );
	};
}

function asyncFileDescriptorMethod ( methodName ) {
	return function () {
		var arguments$1 = arguments;

		var args = [];
		var i = arguments.length;

		while ( i-- ) {
			args[i] = arguments$1[i];
		}

		return new Promise( function ( fulfil, reject ) {
			args.push( function ( err, result ) {
				if ( err ) {
					reject( err );
				} else {
					fulfil( result );
				}
			});

			fs$2[ methodName ].apply( fs$2, args );
		});
	};
}

function resolvePathAndOptions ( args ) {
	var options;
	var pathargs;

	if ( typeof args[ args.length - 1 ] === 'object' ) {
		options = args[ args.length - 1 ];

		var i = args.length - 1;
		pathargs = new Array( i );

		while ( i-- ) {
			pathargs[i] = args[i];
		}
	} else {
		options = {};
		pathargs = args;
	}

	var resolvedPath = path$2.resolve.apply( null, pathargs );

	return { options: options, resolvedPath: resolvedPath };
}

function createReadStream$1 () {
	var ref = resolvePathAndOptions( arguments );
	var resolvedPath = ref.resolvedPath;
	var options = ref.options;
	return fs$2.createReadStream( resolvedPath, options );
}

function createWriteStream$1 () {
	var ref = resolvePathAndOptions( arguments );
	var resolvedPath = ref.resolvedPath;
	var options = ref.options;

	mkdirp$1.sync( path$2.dirname( resolvedPath ) );
	return fs$2.createWriteStream( resolvedPath, options );
}

function exists$1 () {
	var target = resolvePath( arguments );

	return new Promise( function (fulfil) {
		fs$2.exists( target, function (exists$$1) { return fulfil( exists$$1 ); } );
	});
}

function existsSync$1 () {
	return fs$2.existsSync( resolvePath( arguments ) );
}

var rename = asyncMethod$1( 'rename' );
var link = asyncMethod$1( 'link' );

var renameSync = syncMethod$1( 'renameSync' );
var linkSync = syncMethod$1( 'linkSync' );

function asyncMethod$1 ( methodName ) {
	return function () {
		var src = resolvePath( arguments );

		return {
			to: function to () {
				var dest = resolvePath( arguments );

				return new Promise( function ( fulfil, reject ) {
					mkdirp$1( path$2.dirname( dest ), function (err) {
						if ( err ) {
							reject( err );
						} else {
							fs$2[ methodName ]( src, dest, function (err) {
								if ( err ) {
									reject( err );
								} else {
									fulfil();
								}
							});
						}
					});
				});
			}
		};
	};
}

function syncMethod$1 ( methodName ) {
	return function () {
		var src = resolvePath( arguments );

		return {
			to: function to () {
				var dest = resolvePath( arguments );

				mkdirp$1.sync( path$2.dirname( dest ) );
				return fs$2[ methodName ]( src, dest );
			}
		};
	};
}

function mkdir () {
	var dir = resolvePath( arguments );

	return new Promise( function ( fulfil, reject ) {
		mkdirp$1( dir, function (err) {
			if ( err ) {
				reject( err );
			} else {
				fulfil();
			}
		});
	});
}

function mkdirSync () {
	var dir = resolvePath( arguments );
	mkdirp$1.sync( dir );
}

function normaliseArguments$1 ( args ) {
	var options;
	var flags;
	var i;

	if ( typeof args[ args.length - 1 ] === 'object' ) {
		options = args[ args.length - 1 ];
		flags = args[ args.length - 2 ];
		i = args.length - 2;
	} else {
		options = {};
		flags = args[ args.length - 1 ];
		i = args.length - 1;
	}

	var pathargs = new Array( i );
	while ( i-- ) {
		pathargs[i] = args[i];
	}

	var resolvedPath = resolvePath( pathargs );

	return { resolvedPath: resolvedPath, options: options, flags: flags };
}

function bailIfExists ( src, flags, mode ) {
	var alreadyExists;

	try {
		fs$2.statSync( src );
		alreadyExists = true;
	} catch ( err ) {
		if ( err.code !== 'ENOENT' ) {
			throw err;
		}
	}

	if ( alreadyExists ) {
		// attempt the operation = that way, we get the intended error message
		// TODO can't we just do this in the first place?
		fs$2.openSync( src, flags, mode );
	}
}

function open$1 () {
	var ref = normaliseArguments$1( arguments );
	var src = ref.resolvedPath;
	var options = ref.options;
	var flags = ref.flags;

	if ( /^.x/.test( flags ) ) {
		bailIfExists( src, flags, options.mode );
	}

	return new Promise( function ( fulfil, reject ) {
		function open$$1 () {
			fs$2.open( src, flags, options.mode, function ( err, fd ) {
				if ( err ) {
					reject( err );
				} else {
					fulfil( fd );
				}
			});
		}

		// create dirs if necessary
		if ( /^[wa]/.test( flags ) ) {
			mkdirp$1( path$2.dirname( src ), function (err) {
				if ( err ) {
					reject( err );
				} else {
					open$$1();
				}
			});
		} else {
			open$$1();
		}
	});
}


function openSync$1 () {
	var ref = normaliseArguments$1( arguments );
	var src = ref.resolvedPath;
	var options = ref.options;
	var flags = ref.flags;

	if ( /^.x/.test( flags ) ) {
		bailIfExists( src, flags, options.mode );
	}

	// create dirs if necessary
	if ( /^[wa]/.test( flags ) ) {
		mkdirp$1.sync( path$2.dirname( src ) );
	}

	return fs$2.openSync( src, flags, options.mode );
}

function symlink$1 () {
	var src = resolvePath( arguments );

	return {
		to: function to () {
			var ref = resolvePathAndOptions( arguments );
			var options = ref.options;
			var dest = ref.resolvedPath;

			return new Promise( function ( fulfil, reject ) {
				mkdirp$1( path$2.dirname( dest ), function (err) {
					if ( err ) {
						reject( err );
					} else {
						fs$2.symlink( src, dest, options.type, function (err) {
							if ( err ) {
								reject( err );
							} else {
								fulfil();
							}
						});
					}
				});
			});
		}
	};
}

function symlinkSync$1 () {
	var src = resolvePath( arguments );

	return {
		to: function to () {
			var ref = resolvePathAndOptions( arguments );
			var options = ref.options;
			var dest = ref.resolvedPath;
			mkdirp$1.sync( path$2.dirname( dest ) );
			return fs$2.symlinkSync( src, dest, options.type );
		}
	};
}

var writeFile = asyncMethod$2( 'writeFile' );
var appendFile = asyncMethod$2( 'appendFile' );

var writeFileSync$1 = syncMethod$2( 'writeFileSync' );
var appendFileSync = syncMethod$2( 'appendFileSync' );

function normaliseArguments$2 ( args ) {
	args = Array.prototype.slice.call( args, 0 );
	var opts = {};

	if ( typeof args[ args.length - 1 ] === 'object' && !( args[ args.length - 1 ] instanceof Buffer ) ) {
		opts = args.pop();
	}

	return { opts: opts, data: args.pop(), dest: resolvePath( args ) };
}

function asyncMethod$2 ( methodName ) {
	return function () {
		var ref = normaliseArguments$2( arguments );
		var dest = ref.dest;
		var data = ref.data;
		var opts = ref.opts;

		return new Promise( function ( fulfil, reject ) {
			mkdirp$1( path$2.dirname( dest ), function (err) {
				if ( err ) {
					reject( err );
				} else {
					fs$2[ methodName ]( dest, data, opts, function (err) {
						if ( err ) {
							reject( err );
						} else {
							fulfil( data );
						}
					});
				}
			});
		});
	};
}

function syncMethod$2 ( methodName ) {
	return function () {
		var ref = normaliseArguments$2( arguments );
		var dest = ref.dest;
		var data = ref.data;

		mkdirp$1.sync( path$2.dirname( dest ) );
		return fs$2[ methodName ]( dest, data );
	};
}

function copydir () {
	var ref = resolvePathAndOptions( arguments );
	var src = ref.resolvedPath;
	var readOptions = ref.options;

	return {
		to: function to () {
			var ref = resolvePathAndOptions( arguments );
			var dest = ref.resolvedPath;
			var writeOptions = ref.options;

			function copydir ( src, dest, cb ) {
				mkdirp$1( dest, function (err) {
					if ( err ) { return cb( err ); }

					fs$2.readdir( src, function ( err, files ) {
						if ( err ) { return cb( err ); }

						var remaining = files.length;

						if ( !remaining ) { return cb(); }

						function check ( err ) {
							if ( err ) {
								return cb( err );
							}

							if ( !--remaining ) {
								cb();
							}
						}

						files.forEach( function ( filename ) {
							var srcpath = src + path$2.sep + filename;
							var destpath = dest + path$2.sep + filename;

							fs$2.stat( srcpath, function ( err, stats ) {
								var readStream, writeStream;

								if ( stats.isDirectory() ) {
									return copydir( srcpath, destpath, check );
								}

								readStream = fs$2.createReadStream( srcpath, readOptions );
								writeStream = fs$2.createWriteStream( destpath, writeOptions );

								readStream.on( 'error', cb );
								writeStream.on( 'error', cb );

								writeStream.on( 'close', check );

								readStream.pipe( writeStream );
							});
						});
					});
				});
			}

			return new Promise( function ( fulfil, reject ) {
				copydir( src, dest, function (err) {
					if ( err ) {
						reject( err );
					} else {
						fulfil();
					}
				});
			});
		}
	};
}

function copydirSync () {
	var ref = resolvePathAndOptions( arguments );
	var src = ref.resolvedPath;
	var readOptions = ref.options;

	return {
		to: function to () {
			var ref = resolvePathAndOptions( arguments );
			var dest = ref.resolvedPath;
			var writeOptions = ref.options;

			function copydir ( src, dest ) {
				mkdirp$1.sync( dest );

				fs$2.readdirSync( src ).forEach( function (filename) {
					var srcpath = src + path$2.sep + filename;
					var destpath = dest + path$2.sep + filename;

					if ( fs$2.statSync( srcpath ).isDirectory() ) {
						return copydir( srcpath, destpath );
					}

					var data = fs$2.readFileSync( srcpath, readOptions );
					fs$2.writeFileSync( destpath, data, writeOptions );
				});
			}

			copydir( src, dest );
		}
	};
}

function copyFile () {
	var ref = resolvePathAndOptions( arguments );
	var src = ref.resolvedPath;
	var readOptions = ref.options;

	return {
		to: function to () {
			var ref = resolvePathAndOptions( arguments );
			var dest = ref.resolvedPath;
			var writeOptions = ref.options;

			return new Promise( function ( fulfil, reject ) {
				mkdirp$1( path$2.dirname( dest ), function (err) {
					if ( err ) {
						reject( err );
					} else {
						var readStream = fs$2.createReadStream( src, readOptions );
						var writeStream = fs$2.createWriteStream( dest, writeOptions );

						readStream.on( 'error', reject );
						writeStream.on( 'error', reject );

						writeStream.on( 'close', fulfil );

						readStream.pipe( writeStream );
					}
				});
			});
		}
	};
}

function copyFileSync () {
	var ref = resolvePathAndOptions( arguments );
	var src = ref.resolvedPath;
	var readOptions = ref.options;

	return {
		to: function to () {
			var ref = resolvePathAndOptions( arguments );
			var dest = ref.resolvedPath;
			var writeOptions = ref.options;

			var data = fs$2.readFileSync( src, readOptions );

			mkdirp$1.sync( path$2.dirname( dest ) );
			fs$2.writeFileSync( dest, data, writeOptions );
		}
	};
}

function walk ( dir, callback ) {
	var results = [];

	fs$1$1.readdir( dir, function ( err, files ) {
		if ( err ) { return callback( err ); }

		var pending = files.length;
		if ( !pending ) { return callback( null, results ); }

		files.forEach( function (file) {
			file = path$2.resolve( dir, file );

			fs$1$1.stat( file, function ( err, stats ) {
				if ( stats && stats.isDirectory() ) {
					walk( file, function ( err, res ) {
						results = results.concat( res );
						if ( !--pending ) { callback( null, results ); }
					});
				} else {
					results.push( file );
					if ( !--pending ) { callback( null, results ); }
				}
			});
		});
	});
}

function lsr () {
	var basedir = resolvePath( arguments );

	return new Promise( function ( fulfil, reject ) {
		walk( basedir, function ( err, result ) {
			if ( err ) { return reject( err ); }

			// files should be relative to basedir
			var index = basedir.length + 1;
			var i = result.length;
			while ( i-- ) {
				result[i] = result[i].substring( index );
			}

			fulfil( result );
		});
	});
}

function lsrSync () {
	var basedir = resolvePath( arguments );

	var result = [];

	function processdir ( dir ) {
		fs$1$1.readdirSync( dir ).forEach( function (file) {
			var filepath = dir + path$2.sep + file;

			if ( fs$1$1.statSync( filepath ).isDirectory() ) {
				processdir( filepath );
			} else {
				result.push( filepath.replace( basedir + path$2.sep, '' ) );
			}
		});
	}

	processdir( basedir );
	return result;
}

function rimraf$2 () {
	var target = resolvePath( arguments );

	return new Promise( function ( fulfil, reject ) {
		_rimraf( target, function (err) {
			if ( err ) {
				reject( err );
			} else {
				fulfil();
			}
		});
	});
}

function rimrafSync$2 () {
	_rimraf.sync( resolvePath( arguments ) );
}

var isWindows$1 = process.platform === 'win32';

function symlinkOrCopy$$1 () {
	var arguments$1 = arguments;

	if ( isWindows$1 ) {
		var ref = resolvePathAndOptions( arguments );
		var src = ref.resolvedPath;
		ref.options;

		var copyDirOrFileTo = stat$2( src )
			.then( function (stats) {
				return ( stats.isDirectory() ? copydir : copyFile )
					.apply( null, arguments$1 )
					.to;
			});

		return {
			to: function to () {
				var arguments$1 = arguments;

				return copyDirOrFileTo
					.then(function (fn) {
						return fn.apply(null, arguments$1);
					});
			}
		};
	}

	return symlink$1.apply( null, arguments );
}

function symlinkOrCopySync$$1 () {
	if ( isWindows$1 ) {
		var ref = resolvePathAndOptions( arguments );
		var src = ref.resolvedPath;
		ref.options;
		return ( statSync$2( src ).isDirectory() ? copydirSync : copyFileSync ).apply( null, arguments );
	}

	return symlinkSync$1.apply( null, arguments );
}

// standard async methods
var chmod = asyncMethod( 'chmod' );
var chown = asyncMethod( 'chown' );
var lchmod = asyncMethod( 'lchmod' );
var lchown = asyncMethod( 'lchown' );
var lstat = asyncMethod( 'lstat' );
var readdir$2 = asyncMethod( 'readdir' );
var readFile = asyncMethod( 'readFile' );
var readlink = asyncMethod( 'readlink' );
var realpath = asyncMethod( 'realpath' );
var rmdir$1 = asyncMethod( 'rmdir' );
var stat$2 = asyncMethod( 'stat' );
var truncate = asyncMethod( 'truncate' );
var unlink = asyncMethod( 'unlink' );
var utimes = asyncMethod( 'utimes' );
var unwatchFile = asyncMethod( 'unwatchFile' );
var watch = asyncMethod( 'watch' );
var watchFile = asyncMethod( 'watchFile' );

// standard sync methods
var chmodSync = syncMethod( 'chmodSync' );
var chownSync = syncMethod( 'chownSync' );
var lchmodSync = syncMethod( 'lchmodSync' );
var lchownSync = syncMethod( 'lchownSync' );
var lstatSync = syncMethod( 'lstatSync' );
var readdirSync$2 = syncMethod( 'readdirSync' );
var readFileSync$1 = syncMethod( 'readFileSync' );
var readlinkSync = syncMethod( 'readlinkSync' );
var realpathSync = syncMethod( 'realpathSync' );
var rmdirSync$1 = syncMethod( 'rmdirSync' );
var statSync$2 = syncMethod( 'statSync' );
var truncateSync = syncMethod( 'truncateSync' );
var unlinkSync = syncMethod( 'unlinkSync' );
var utimesSync = syncMethod( 'utimesSync' );

// file descriptor async methods
var close = asyncFileDescriptorMethod( 'close' );
var fchmod = asyncFileDescriptorMethod( 'fchmod' );
var fchown = asyncFileDescriptorMethod( 'fchown' );
var fstat = asyncFileDescriptorMethod( 'fstat' );
var fsync = asyncFileDescriptorMethod( 'fsync' );
var ftruncate = asyncFileDescriptorMethod( 'ftruncate' );
var futimes = asyncFileDescriptorMethod( 'futimes' );
var read = asyncFileDescriptorMethod( 'read' );

// file descriptor sync methods
var closeSync$1 = fs$2.closeSync;
var fchmodSync$1 = fs$2.fchmodSync;
var fchownSync$1 = fs$2.fchownSync;
var fstatSync$1 = fs$2.fstatSync;
var fsyncSync$1 = fs$2.fsyncSync;
var ftruncateSync$1 = fs$2.ftruncateSync;
var futimesSync$1 = fs$2.futimesSync;
var readSync$1 = fs$2.readSync;

sander_cjs.chmod = chmod;
sander_cjs.chown = chown;
sander_cjs.lchmod = lchmod;
sander_cjs.lchown = lchown;
sander_cjs.lstat = lstat;
sander_cjs.readdir = readdir$2;
sander_cjs.readFile = readFile;
sander_cjs.readlink = readlink;
sander_cjs.realpath = realpath;
sander_cjs.rmdir = rmdir$1;
sander_cjs.stat = stat$2;
sander_cjs.truncate = truncate;
sander_cjs.unlink = unlink;
sander_cjs.utimes = utimes;
sander_cjs.unwatchFile = unwatchFile;
sander_cjs.watch = watch;
sander_cjs.watchFile = watchFile;
sander_cjs.chmodSync = chmodSync;
sander_cjs.chownSync = chownSync;
sander_cjs.lchmodSync = lchmodSync;
sander_cjs.lchownSync = lchownSync;
sander_cjs.lstatSync = lstatSync;
sander_cjs.readdirSync = readdirSync$2;
sander_cjs.readFileSync = readFileSync$1;
sander_cjs.readlinkSync = readlinkSync;
sander_cjs.realpathSync = realpathSync;
sander_cjs.rmdirSync = rmdirSync$1;
sander_cjs.statSync = statSync$2;
sander_cjs.truncateSync = truncateSync;
sander_cjs.unlinkSync = unlinkSync;
sander_cjs.utimesSync = utimesSync;
sander_cjs.close = close;
sander_cjs.fchmod = fchmod;
sander_cjs.fchown = fchown;
sander_cjs.fstat = fstat;
sander_cjs.fsync = fsync;
sander_cjs.ftruncate = ftruncate;
sander_cjs.futimes = futimes;
sander_cjs.read = read;
sander_cjs.closeSync = closeSync$1;
sander_cjs.fchmodSync = fchmodSync$1;
sander_cjs.fchownSync = fchownSync$1;
sander_cjs.fstatSync = fstatSync$1;
sander_cjs.fsyncSync = fsyncSync$1;
sander_cjs.ftruncateSync = ftruncateSync$1;
sander_cjs.futimesSync = futimesSync$1;
sander_cjs.readSync = readSync$1;
sander_cjs.createReadStream = createReadStream$1;
sander_cjs.createWriteStream = createWriteStream$1;
sander_cjs.exists = exists$1;
sander_cjs.existsSync = existsSync$1;
sander_cjs.link = link;
sander_cjs.linkSync = linkSync;
sander_cjs.rename = rename;
sander_cjs.renameSync = renameSync;
sander_cjs.mkdir = mkdir;
sander_cjs.mkdirSync = mkdirSync;
sander_cjs.open = open$1;
sander_cjs.openSync = openSync$1;
sander_cjs.symlink = symlink$1;
sander_cjs.symlinkSync = symlinkSync$1;
sander_cjs.writeFile = writeFile;
sander_cjs.writeFileSync = writeFileSync$1;
sander_cjs.appendFile = appendFile;
sander_cjs.appendFileSync = appendFileSync;
sander_cjs.copydir = copydir;
sander_cjs.copydirSync = copydirSync;
sander_cjs.copyFile = copyFile;
sander_cjs.copyFileSync = copyFileSync;
sander_cjs.lsr = lsr;
sander_cjs.lsrSync = lsrSync;
sander_cjs.rimraf = rimraf$2;
sander_cjs.rimrafSync = rimrafSync$2;
sander_cjs.symlinkOrCopy = symlinkOrCopy$$1;
sander_cjs.symlinkOrCopySync = symlinkOrCopySync$$1;

const assert = require$$0$2;
const path$1 = require$$1$2;
const fs$1 = require$$0$3;
let glob = undefined;
try {
  glob = requireGlob();
} catch (_err) {
  // treat glob as optional.
}

const defaultGlobOpts = {
  nosort: true,
  silent: true
};

// for EMFILE handling
let timeout = 0;

const isWindows = (process.platform === "win32");

const defaults = options => {
  const methods = [
    'unlink',
    'chmod',
    'stat',
    'lstat',
    'rmdir',
    'readdir'
  ];
  methods.forEach(m => {
    options[m] = options[m] || fs$1[m];
    m = m + 'Sync';
    options[m] = options[m] || fs$1[m];
  });

  options.maxBusyTries = options.maxBusyTries || 3;
  options.emfileWait = options.emfileWait || 1000;
  if (options.glob === false) {
    options.disableGlob = true;
  }
  if (options.disableGlob !== true && glob === undefined) {
    throw Error('glob dependency not found, set `options.disableGlob = true` if intentional')
  }
  options.disableGlob = options.disableGlob || false;
  options.glob = options.glob || defaultGlobOpts;
};

const rimraf$1 = (p, options, cb) => {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  assert(p, 'rimraf: missing path');
  assert.equal(typeof p, 'string', 'rimraf: path should be a string');
  assert.equal(typeof cb, 'function', 'rimraf: callback function required');
  assert(options, 'rimraf: invalid options argument provided');
  assert.equal(typeof options, 'object', 'rimraf: options should be object');

  defaults(options);

  let busyTries = 0;
  let errState = null;
  let n = 0;

  const next = (er) => {
    errState = errState || er;
    if (--n === 0)
      cb(errState);
  };

  const afterGlob = (er, results) => {
    if (er)
      return cb(er)

    n = results.length;
    if (n === 0)
      return cb()

    results.forEach(p => {
      const CB = (er) => {
        if (er) {
          if ((er.code === "EBUSY" || er.code === "ENOTEMPTY" || er.code === "EPERM") &&
              busyTries < options.maxBusyTries) {
            busyTries ++;
            // try again, with the same exact callback as this one.
            return setTimeout(() => rimraf_(p, options, CB), busyTries * 100)
          }

          // this one won't happen if graceful-fs is used.
          if (er.code === "EMFILE" && timeout < options.emfileWait) {
            return setTimeout(() => rimraf_(p, options, CB), timeout ++)
          }

          // already gone
          if (er.code === "ENOENT") er = null;
        }

        timeout = 0;
        next(er);
      };
      rimraf_(p, options, CB);
    });
  };

  if (options.disableGlob || !glob.hasMagic(p))
    return afterGlob(null, [p])

  options.lstat(p, (er, stat) => {
    if (!er)
      return afterGlob(null, [p])

    glob(p, options.glob, afterGlob);
  });

};

// Two possible strategies.
// 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
// 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
//
// Both result in an extra syscall when you guess wrong.  However, there
// are likely far more normal files in the world than directories.  This
// is based on the assumption that a the average number of files per
// directory is >= 1.
//
// If anyone ever complains about this, then I guess the strategy could
// be made configurable somehow.  But until then, YAGNI.
const rimraf_ = (p, options, cb) => {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  // sunos lets the root user unlink directories, which is... weird.
  // so we have to lstat here and make sure it's not a dir.
  options.lstat(p, (er, st) => {
    if (er && er.code === "ENOENT")
      return cb(null)

    // Windows can EPERM on stat.  Life is suffering.
    if (er && er.code === "EPERM" && isWindows)
      fixWinEPERM(p, options, er, cb);

    if (st && st.isDirectory())
      return rmdir(p, options, er, cb)

    options.unlink(p, er => {
      if (er) {
        if (er.code === "ENOENT")
          return cb(null)
        if (er.code === "EPERM")
          return (isWindows)
            ? fixWinEPERM(p, options, er, cb)
            : rmdir(p, options, er, cb)
        if (er.code === "EISDIR")
          return rmdir(p, options, er, cb)
      }
      return cb(er)
    });
  });
};

const fixWinEPERM = (p, options, er, cb) => {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  options.chmod(p, 0o666, er2 => {
    if (er2)
      cb(er2.code === "ENOENT" ? null : er);
    else
      options.stat(p, (er3, stats) => {
        if (er3)
          cb(er3.code === "ENOENT" ? null : er);
        else if (stats.isDirectory())
          rmdir(p, options, er, cb);
        else
          options.unlink(p, cb);
      });
  });
};

const fixWinEPERMSync = (p, options, er) => {
  assert(p);
  assert(options);

  try {
    options.chmodSync(p, 0o666);
  } catch (er2) {
    if (er2.code === "ENOENT")
      return
    else
      throw er
  }

  let stats;
  try {
    stats = options.statSync(p);
  } catch (er3) {
    if (er3.code === "ENOENT")
      return
    else
      throw er
  }

  if (stats.isDirectory())
    rmdirSync(p, options, er);
  else
    options.unlinkSync(p);
};

const rmdir = (p, options, originalEr, cb) => {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
  // if we guessed wrong, and it's not a directory, then
  // raise the original error.
  options.rmdir(p, er => {
    if (er && (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM"))
      rmkids(p, options, cb);
    else if (er && er.code === "ENOTDIR")
      cb(originalEr);
    else
      cb(er);
  });
};

const rmkids = (p, options, cb) => {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  options.readdir(p, (er, files) => {
    if (er)
      return cb(er)
    let n = files.length;
    if (n === 0)
      return options.rmdir(p, cb)
    let errState;
    files.forEach(f => {
      rimraf$1(path$1.join(p, f), options, er => {
        if (errState)
          return
        if (er)
          return cb(errState = er)
        if (--n === 0)
          options.rmdir(p, cb);
      });
    });
  });
};

// this looks simpler, and is strictly *faster*, but will
// tie up the JavaScript thread and fail on excessively
// deep directory trees.
const rimrafSync$1 = (p, options) => {
  options = options || {};
  defaults(options);

  assert(p, 'rimraf: missing path');
  assert.equal(typeof p, 'string', 'rimraf: path should be a string');
  assert(options, 'rimraf: missing options');
  assert.equal(typeof options, 'object', 'rimraf: options should be object');

  let results;

  if (options.disableGlob || !glob.hasMagic(p)) {
    results = [p];
  } else {
    try {
      options.lstatSync(p);
      results = [p];
    } catch (er) {
      results = glob.sync(p, options.glob);
    }
  }

  if (!results.length)
    return

  for (let i = 0; i < results.length; i++) {
    const p = results[i];

    let st;
    try {
      st = options.lstatSync(p);
    } catch (er) {
      if (er.code === "ENOENT")
        return

      // Windows can EPERM on stat.  Life is suffering.
      if (er.code === "EPERM" && isWindows)
        fixWinEPERMSync(p, options, er);
    }

    try {
      // sunos lets the root user unlink directories, which is... weird.
      if (st && st.isDirectory())
        rmdirSync(p, options, null);
      else
        options.unlinkSync(p);
    } catch (er) {
      if (er.code === "ENOENT")
        return
      if (er.code === "EPERM")
        return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er)
      if (er.code !== "EISDIR")
        throw er

      rmdirSync(p, options, er);
    }
  }
};

const rmdirSync = (p, options, originalEr) => {
  assert(p);
  assert(options);

  try {
    options.rmdirSync(p);
  } catch (er) {
    if (er.code === "ENOENT")
      return
    if (er.code === "ENOTDIR")
      throw originalEr
    if (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM")
      rmkidsSync(p, options);
  }
};

const rmkidsSync = (p, options) => {
  assert(p);
  assert(options);
  options.readdirSync(p).forEach(f => rimrafSync$1(path$1.join(p, f), options));

  // We only end up here once we got ENOTEMPTY at least once, and
  // at this point, we are guaranteed to have removed all the kids.
  // So, we know that it won't be ENOENT or ENOTDIR or anything else.
  // try really hard to delete stuff on windows, because it has a
  // PROFOUNDLY annoying habit of not closing handles promptly when
  // files are deleted, resulting in spurious ENOTEMPTY errors.
  const retries = isWindows ? 100 : 1;
  let i = 0;
  do {
    let threw = true;
    try {
      const ret = options.rmdirSync(p, options);
      threw = false;
      return ret
    } finally {
      if (++i < retries && threw)
        continue
    }
  } while (true)
};

var rimraf_1 = rimraf$1;
rimraf$1.sync = rimrafSync$1;

var fs = require$$0$3;
var path = require$$1$2;
var tar = tar$1;
var colorette = colorette$1;
var EventEmitter = require$$0;
var homeOrTmp = homeOrTmp$1;
var https = require$$1$4;
var child_process = require$$0$6;
var URL = require$$7;
var Agent = dist$1;
var sander = sander_cjs;
var rimraf = rimraf_1;

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var tar__default = /*#__PURE__*/_interopDefaultLegacy(tar);
var EventEmitter__default = /*#__PURE__*/_interopDefaultLegacy(EventEmitter);
var homeOrTmp__default = /*#__PURE__*/_interopDefaultLegacy(homeOrTmp);
var https__default = /*#__PURE__*/_interopDefaultLegacy(https);
var child_process__default = /*#__PURE__*/_interopDefaultLegacy(child_process);
var URL__default = /*#__PURE__*/_interopDefaultLegacy(URL);
var Agent__default = /*#__PURE__*/_interopDefaultLegacy(Agent);
var rimraf__default = /*#__PURE__*/_interopDefaultLegacy(rimraf);

const tmpDirName = 'tmp';
const degitConfigName = 'degit.json';
const rimrafSync = dir =>
	rimraf__default['default'].sync(dir);

class DegitError extends Error {
	constructor(message, opts) {
		super(message);
		Object.assign(this, opts);
	}
}

function tryRequire(file, opts) {
	try {
		if (opts && opts.clearCache === true) {
			delete require.cache[require.resolve(file)];
		}
		return commonjsRequire(file);
	} catch (err) {
		return null;
	}
}

function exec(command) {
	return new Promise((fulfil, reject) => {
		child_process__default['default'].exec(command, (err, stdout, stderr) => {
			if (err) {
				reject(err);
				return;
			}

			fulfil({ stdout, stderr });
		});
	});
}

function mkdirp(dir) {
	const parent = path__default['default'].dirname(dir);
	if (parent === dir) return;

	mkdirp(parent);

	try {
		fs__default['default'].mkdirSync(dir);
	} catch (err) {
		if (err.code !== 'EEXIST') throw err;
	}
}

function fetch(url, dest, proxy) {
	return new Promise((fulfil, reject) => {
		let options = url;

		if (proxy) {
			const parsedUrl = URL__default['default'].parse(url);
			options = {
				hostname: parsedUrl.host,
				path: parsedUrl.path,
				agent: new Agent__default['default'](proxy)
			};
		}

		https__default['default']
			.get(options, response => {
				const code = response.statusCode;
				if (code >= 400) {
					reject({ code, message: response.statusMessage });
				} else if (code >= 300) {
					fetch(response.headers.location, dest, proxy).then(fulfil, reject);
				} else {
					response
						.pipe(fs__default['default'].createWriteStream(dest))
						.on('finish', () => fulfil())
						.on('error', reject);
				}
			})
			.on('error', reject);
	});
}

function stashFiles(dir, dest) {
	const tmpDir = path__default['default'].join(dir, tmpDirName);
  try {
	  rimrafSync(tmpDir);
  } catch (e) {
    if (e.errno !== -2 && e.syscall !== "rmdir" && e.code !== "ENOENT") {
      throw e;
    }
  }
	mkdirp(tmpDir);
	fs__default['default'].readdirSync(dest).forEach(file => {
		const filePath = path__default['default'].join(dest, file);
		const targetPath = path__default['default'].join(tmpDir, file);
		const isDir = fs__default['default'].lstatSync(filePath).isDirectory();
		if (isDir) {
			sander.copydirSync(filePath).to(targetPath);
			rimrafSync(filePath);
		} else {
			fs__default['default'].copyFileSync(filePath, targetPath);
			fs__default['default'].unlinkSync(filePath);
		}
	});
}

function unstashFiles(dir, dest) {
	const tmpDir = path__default['default'].join(dir, tmpDirName);
	fs__default['default'].readdirSync(tmpDir).forEach(filename => {
		const tmpFile = path__default['default'].join(tmpDir, filename);
		const targetPath = path__default['default'].join(dest, filename);
		const isDir = fs__default['default'].lstatSync(tmpFile).isDirectory();
		if (isDir) {
			sander.copydirSync(tmpFile).to(targetPath);
			rimrafSync(tmpFile);
		} else {
			if (filename !== 'degit.json') {
				fs__default['default'].copyFileSync(tmpFile, targetPath);
			}
			fs__default['default'].unlinkSync(tmpFile);
		}
	});
	rimrafSync(tmpDir);
}

const base = path__default['default'].join(homeOrTmp__default['default'], '.degit');

const validModes = new Set(['tar', 'git']);

function degit(src, opts) {
	return new Degit(src, opts);
}

class Degit extends EventEmitter__default['default'] {
	constructor(src, opts = {}) {
		super();
		this.src = src;
		this.cache = opts.cache;
		this.force = opts.force;
		this.verbose = opts.verbose;
		this.proxy = process.env.https_proxy; // TODO allow setting via --proxy
    this.subgroup = opts.subgroup;
    this.subdir = opts["sub-directory"];
		this.repo = parse(src);
    if (this.subgroup) {
      this.repo.subgroup = true;
			this.repo.name = this.repo.subdir.slice(1);
      this.repo.url = this.repo.url + this.repo.subdir;
      this.repo.ssh = this.repo.ssh + this.repo.subdir + ".git";
			this.repo.subdir = null;
			if (this.subdir) {
				this.repo.subdir = this.subdir.startsWith('/') ? this.subdir : `/${this.subdir}`;
			}
		}
		this.mode = opts.mode || this.repo.mode;

		if (!validModes.has(this.mode)) {
			throw new Error(`Valid modes are ${Array.from(validModes).join(', ')}`);
		}

		this._hasStashed = false;

		this.directiveActions = {
			clone: async (dir, dest, action) => {
				if (this._hasStashed === false) {
					stashFiles(dir, dest);
					this._hasStashed = true;
				}
				const opts = Object.assign(
					{ force: true },
					{ cache: action.cache, verbose: action.verbose }
				);
				const d = degit(action.src, opts);

				d.on('info', event => {
					console.error(colorette.cyan(`> ${event.message.replace('options.', '--')}`));
				});

				d.on('warn', event => {
					console.error(
						colorette.magenta(`! ${event.message.replace('options.', '--')}`)
					);
				});

				await d.clone(dest).catch(err => {
					console.error(colorette.red(`! ${err.message}`));
					process.exit(1);
				});
			},
			remove: this.remove.bind(this)
		};
	}

	_getDirectives(dest) {
		const directivesPath = path__default['default'].resolve(dest, degitConfigName);
		const directives =
			tryRequire(directivesPath, { clearCache: true }) || false;
		if (directives) {
			fs__default['default'].unlinkSync(directivesPath);
		}

		return directives;
	}

	async clone(dest) {
		this._checkDirIsEmpty(dest);
		const { repo } = this;
		const dir = path__default['default'].join(base, repo.site, repo.user, repo.name);

		if (this.mode === 'tar') {
			await this._cloneWithTar(dir, dest);
		} else {
			await this._cloneWithGit(dir, dest);
		}

		this._info({
			code: 'SUCCESS',
			message: `cloned ${colorette.bold(repo.user + '/' + repo.name)}#${colorette.bold(repo.ref)}${
				dest !== '.' ? ` to ${dest}` : ''
			}`,
			repo,
			dest
		});

		const directives = this._getDirectives(dest);
		if (directives) {
			for (const d of directives) {
				// TODO, can this be a loop with an index to pass for better error messages?
				await this.directiveActions[d.action](dir, dest, d);
			}
			if (this._hasStashed === true) {
				unstashFiles(dir, dest);
			}
		}
	}

	remove(dir, dest, action) {
		let files = action.files;
		if (!Array.isArray(files)) {
			files = [files];
		}
		const removedFiles = files
			.map(file => {
				const filePath = path__default['default'].resolve(dest, file);
				if (fs__default['default'].existsSync(filePath)) {
					const isDir = fs__default['default'].lstatSync(filePath).isDirectory();
					if (isDir) {
						rimrafSync(filePath);
						return file + '/';
					} else {
						fs__default['default'].unlinkSync(filePath);
						return file;
					}
				} else {
					this._warn({
						code: 'FILE_DOES_NOT_EXIST',
						message: `action wants to remove ${colorette.bold(
							file
						)} but it does not exist`
					});
					return null;
				}
			})
			.filter(d => d);

		if (removedFiles.length > 0) {
			this._info({
				code: 'REMOVED',
				message: `removed: ${colorette.bold(removedFiles.map(d => colorette.bold(d)).join(', '))}`
			});
		}
	}

	_checkDirIsEmpty(dir) {
		try {
			const files = fs__default['default'].readdirSync(dir);
			if (files.length > 0) {
				if (this.force) {
					this._info({
						code: 'DEST_NOT_EMPTY',
						message: `destination directory is not empty. Using options.force, continuing`
					});

					rimrafSync(dir);
				} else {
					throw new DegitError(
						`destination directory is not empty, aborting. Use options.force to override`,
						{
							code: 'DEST_NOT_EMPTY'
						}
					);
				}
			} else {
				this._verbose({
					code: 'DEST_IS_EMPTY',
					message: `destination directory is empty`
				});
			}
		} catch (err) {
			if (err.code !== 'ENOENT') throw err;
		}
	}

	_info(info) {
		this.emit('info', info);
	}

	_warn(info) {
		this.emit('warn', info);
	}

	_verbose(info) {
		if (this.verbose) this._info(info);
	}

	async _getHash(repo, cached) {
		try {
			const refs = await fetchRefs(repo);
			if (repo.ref === 'HEAD') {
				return refs.find(ref => ref.type === 'HEAD').hash;
			}

			return this._selectRef(refs, repo.ref);
		} catch (err) {
			this._warn(err);
			this._verbose(err.original);

			return this._getHashFromCache(repo, cached);
		}
	}

	_getHashFromCache(repo, cached) {
		if (repo.ref in cached) {
			const hash = cached[repo.ref];
			this._info({
				code: 'USING_CACHE',
				message: `using cached commit hash ${hash}`
			});
			return hash;
		}
	}

	_selectRef(refs, selector) {
		for (const ref of refs) {
			if (ref.name === selector) {
				this._verbose({
					code: 'FOUND_MATCH',
					message: `found matching commit hash: ${ref.hash}`
				});
				return ref.hash;
			}
		}

		if (selector.length < 8) return null;

		for (const ref of refs) {
			if (ref.hash.startsWith(selector)) return ref.hash;
		}
	}

	async _cloneWithTar(dir, dest) {
		const { repo } = this;

		const cached = tryRequire(path__default['default'].join(dir, 'map.json')) || {};

		const hash = this.cache
			? this._getHashFromCache(repo, cached)
			: await this._getHash(repo, cached);

		const subdir = repo.subdir ? `${repo.name}-${hash}${repo.subdir}` : null;


		if (!hash) {
			// TODO 'did you mean...?'
			throw new DegitError(`could not find commit hash for ${repo.ref}`, {
				code: 'MISSING_REF',
				ref: repo.ref
			});
		}

		const file = `${dir}/${hash}.tar.gz`;
		const url =
			repo.site === 'gitlab'
				? `${repo.url}/-/archive/${hash}/${repo.name}-${hash}.tar.gz`
				: repo.site === 'bitbucket'
				? `${repo.url}/get/${hash}.tar.gz`
				: `${repo.url}/archive/${hash}.tar.gz`;

		try {
			if (!this.cache) {
				try {
					fs__default['default'].statSync(file);
					this._verbose({
						code: 'FILE_EXISTS',
						message: `${file} already exists locally`
					});
				} catch (err) {
					mkdirp(path__default['default'].dirname(file));

					if (this.proxy) {
						this._verbose({
							code: 'PROXY',
							message: `using proxy ${this.proxy}`
						});
					}

					this._verbose({
						code: 'DOWNLOADING',
						message: `downloading ${url} to ${file}`
					});

					await fetch(url, file, this.proxy);
				}
			}
		} catch (err) {
			throw new DegitError(`could not download ${url}`, {
				code: 'COULD_NOT_DOWNLOAD',
				url,
				original: err
			});
		}

		updateCache(dir, repo, hash, cached);

		this._verbose({
			code: 'EXTRACTING',
			message: `extracting ${
				subdir ? repo.subdir + ' from ' : ''
			}${file} to ${dest}`
		});

		mkdirp(dest);
		await untar(file, dest, subdir);
	}

	async _cloneWithGit(dir, dest) {
		if (this.repo.subdir) {
      fs__default['default'].mkdirSync(dest);
			const tempDir = fs__default['default'].mkdtempSync(`${dest}/.degit`);
			await exec(`git clone --depth 1 ${this.repo.ssh} ${tempDir}`);
			const files = fs__default['default'].readdirSync(`${tempDir}${this.repo.subdir}`);
			files.forEach(file => {
				fs__default['default'].renameSync(
					`${tempDir}${this.repo.subdir}/${file}`,
					`${dest}/${file}`
				);
			});
			rimrafSync(tempDir);
		} else {
			await exec(`git clone --depth 1 ${this.repo.ssh} ${dest}`);
			rimrafSync(path__default['default'].resolve(dest, '.git'));
		}
	}
}

const supported = {
	github: '.com',
	gitlab: '.com',
	bitbucket: '.com',
	'git.sr.ht': '.ht',
};

function parse(src) {
	const match = /^(?:(?:https:\/\/)?([^:/]+\.[^:/]+)\/|git@([^:/]+)[:/]|([^/]+):)?([^/\s]+)\/([^/\s#]+)(?:((?:\/[^/\s#]+)+))?(?:\/)?(?:#(.+))?/.exec(
		src
	);
	if (!match) {
		throw new DegitError(`could not parse ${src}`, {
			code: 'BAD_SRC'
		});
	}

	const site = match[1] || match[2] || match[3] || 'github.com';
	const tldMatch = /\.([a-z]{2,})$/.exec(site);
	const tld = tldMatch ? tldMatch[0] : null;
	const siteName = tld ? site.replace(tld, '') : site;

	const user = match[4];
	const name = match[5].replace(/\.git$/, '');
	const subdir = match[6];
	const ref = match[7] || 'HEAD';

	const domain = `${siteName}${tld || supported[siteName] || supported[site] || ''}`;

	const url = `https://${domain}/${user}/${name}`;
	const ssh = `git@${domain}:${user}/${name}`;

	const mode = supported[siteName] || supported[site] ? 'tar' : 'git';

	return { site: siteName, user, name, ref, url, ssh, subdir, mode };
}

async function untar(file, dest, subdir = null) {
	return tar__default['default'].extract(
		{
			file,
			strip: subdir ? subdir.split('/').length : 1,
			C: dest
		},
		subdir ? [subdir] : []
	);
}

async function fetchRefs(repo) {
	try {
		const { stdout } = await exec(`git ls-remote ${repo.url}`);

		return stdout
			.split('\n')
			.filter(Boolean)
			.map(row => {
				const [hash, ref] = row.split('\t');

				if (ref === 'HEAD') {
					return {
						type: 'HEAD',
						hash
					};
				}

				const match = /refs\/(\w+)\/(.+)/.exec(ref);
				if (!match)
					throw new DegitError(`could not parse ${ref}`, {
						code: 'BAD_REF'
					});

				return {
					type:
						match[1] === 'heads'
							? 'branch'
							: match[1] === 'refs'
							? 'ref'
							: match[1],
					name: match[2],
					hash
				};
			});
	} catch (error) {
		throw new DegitError(`could not fetch remote ${repo.url}`, {
			code: 'COULD_NOT_FETCH',
			url: repo.url,
			original: error
		});
	}
}

function updateCache(dir, repo, hash, cached) {
	// update access logs
	const logs = tryRequire(path__default['default'].join(dir, 'access.json')) || {};
	logs[repo.ref] = new Date().toISOString();
	fs__default['default'].writeFileSync(
		path__default['default'].join(dir, 'access.json'),
		JSON.stringify(logs, null, '  ')
	);

	if (cached[repo.ref] === hash) return;

	const oldHash = cached[repo.ref];
	if (oldHash) {
		let used = false;
		for (const key in cached) {
			if (cached[key] === hash) {
				used = true;
				break;
			}
		}

		if (!used) {
			// we no longer need this tar file
			try {
				fs__default['default'].unlinkSync(path__default['default'].join(dir, `${oldHash}.tar.gz`));
			} catch (err) {
				// ignore
			}
		}
	}

	cached[repo.ref] = hash;
	fs__default['default'].writeFileSync(
		path__default['default'].join(dir, 'map.json'),
		JSON.stringify(cached, null, '  ')
	);
}

indexE42359c2.base = base;
indexE42359c2.degit = degit;
indexE42359c2.tryRequire = tryRequire;

var index = indexE42359c2;










var dist = index.degit;

var superb = {};

var uniqueRandom$1 = (minimum, maximum) => {
	let previousValue;
	return function random() {
		const number = Math.floor(
			(Math.random() * (maximum - minimum + 1)) + minimum
		);
		previousValue = number === previousValue && minimum !== maximum ? random() : number;
		return previousValue;
	};
};

const uniqueRandom = uniqueRandom$1;

var uniqueRandomArray$1 = array => {
	const random = uniqueRandom(0, array.length - 1);
	return () => array[random()];
};

var words$1 = [
	"ace",
	"amazing",
	"astonishing",
	"astounding",
	"awe-inspiring",
	"awesome",
	"badass",
	"beautiful",
	"bedazzling",
	"bee's knees",
	"best",
	"breathtaking",
	"brilliant",
	"cat's meow",
	"cat's pajamas",
	"classy",
	"cool",
	"dandy",
	"dazzling",
	"delightful",
	"divine",
	"doozie",
	"epic",
	"excellent",
	"exceptional",
	"exquisite",
	"extraordinary",
	"fabulous",
	"fantastic",
	"fantabulous",
	"fine",
	"finest",
	"first-class",
	"first-rate",
	"flawless",
	"funkadelic",
	"geometric",
	"glorious",
	"gnarly",
	"good",
	"grand",
	"great",
	"groovy",
	"groundbreaking",
	"hunky-dory",
	"impeccable",
	"impressive",
	"incredible",
	"kickass",
	"kryptonian",
	"laudable",
	"legendary",
	"lovely",
	"luminous",
	"magnificent",
	"majestic",
	"marvelous",
	"mathematical",
	"mind-blowing",
	"neat",
	"outstanding",
	"peachy",
	"perfect",
	"phenomenal",
	"pioneering",
	"polished",
	"posh",
	"praiseworthy",
	"premium",
	"priceless",
	"prime",
	"primo",
	"rad",
	"remarkable",
	"riveting",
	"scrumtrulescent",
	"sensational",
	"shining",
	"slick",
	"smashing",
	"solid",
	"spectacular",
	"splendid",
	"splendiferous",
	"stellar",
	"striking",
	"stunning",
	"stupendous",
	"stylish",
	"sublime",
	"super",
	"super-duper",
	"super-excellent",
	"superb",
	"superior",
	"supreme",
	"sweet",
	"swell",
	"terrific",
	"tiptop",
	"top-notch",
	"transcendent",
	"tremendous",
	"ultimate",
	"unreal",
	"well-made",
	"wicked",
	"wonderful",
	"wondrous",
	"world-class"
];

const uniqueRandomArray = uniqueRandomArray$1;
const words = words$1;

superb.all = words;
superb.random = uniqueRandomArray(words);

const rpath = (p) => relative(process.cwd(), p);
const resolveTemplate = (template) => {
  if (typeof template === "boolean") {
    consola.error("Please specify a template!");
    process.exit(1);
  }
  if (!template) {
    template = "v3";
  }
  if (template.includes("/")) {
    return template;
  }
  return `nuxt/starter#${template}`;
};
const init = defineNuxtCommand({
  meta: {
    name: "init",
    usage: "npx nuxi init|create [--verbose|-v] [--template,-t] [dir]",
    description: "Initialize a fresh project"
  },
  async invoke(args) {
    const src = resolveTemplate(args.template || args.t);
    const dstDir = resolve$1(process.cwd(), args._[0] || "nuxt-app");
    const tiged = dist(src, { cache: false, verbose: args.verbose || args.v });
    if (existsSync(dstDir) && readdirSync$1(dstDir).length) {
      consola.error(`Directory ${dstDir} is not empty. Please pick another name or remove it first. Aborting.`);
      process.exit(1);
    }
    const formatArgs = (msg) => msg.replace("options.", "--");
    tiged.on("warn", (event) => consola.warn(formatArgs(event.message)));
    tiged.on("info", (event) => consola.info(formatArgs(event.message)));
    try {
      await tiged.clone(dstDir);
    } catch (e) {
      if (e.toString().includes("could not find commit hash")) {
        consola.error(`Failed to clone template from \`${src}\`. Please check the repo is valid and that you have installed \`git\` correctly.`);
        process.exit(1);
      }
      throw e;
    }
    const relativeDist = rpath(dstDir);
    const nextSteps = [
      relativeDist.length > 1 && `\u{1F4C1}  \`cd ${relativeDist}\``,
      "\u{1F4BF}  Install dependencies with `npm install` or `yarn install` or `pnpm install --shamefully-hoist`",
      "\u{1F680}  Start development server with `npm run dev` or `yarn dev` or `pnpm run dev`"
    ].filter(Boolean);
    consola.log(`
 \u2728 Your ${superb.random()} Nuxt project is just created! Next steps:
`);
    for (const step of nextSteps) {
      consola.log(` ${step}
`);
    }
  }
});

export { init as default };