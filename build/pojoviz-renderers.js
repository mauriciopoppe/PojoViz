(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
// it's not a standalone package
// but it extends pojoviz's functionality
var pojoviz = global.pojoviz;
if (!pojoviz) {
  throw 'This is not a standalone project, pojoviz not found';
}

var _ = require('lodash');
_.merge(pojoviz, {
  draw: require('./draw')
});

pojoviz.draw.addRenderer('d3', require('./d3/'));
pojoviz.draw.addRenderer('three', require('./three/'));
pojoviz.draw.setRenderer('d3');

module.exports = pojoviz.draw;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./d3/":10,"./draw":11,"./three/":13,"lodash":undefined}],2:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":6}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],6:[function(require,module,exports){
(function (process,global){
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

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":5,"_process":4,"inherits":3}],7:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
  assert = require('assert'),
  _ = require('lodash'),
  utils = require('../../renderer/utils'),
  pojoVizNode = require('./Node');

var rootSvg;
var prefix = utils.prefixer;
var escapeCls = utils.escapeCls;
var hashCode = require('../../util/').hashCode;
var hashKey = require('../../util/hashKey');

function getX(d) {
  return d.x - d.width / 2;
}

function getY(d) {
  return d.y - d.height / 2;
}

function Canvas(data, el) {
  assert(el);
  this.id = _.uniqueId();
  this.data = data;
  this.createRoot(el);
  this.set({
    nodes: data.nodes,
    edges: data.edges
  });
}

Canvas.prototype.destroy = function() {
  this.data = null;
  rootSvg
    .selectAll('*')
    .remove();
};

Canvas.prototype.createRoot = function(el) {
  var root = d3.select(el);
  assert(root[0][0], "canvas couldn't be selected");
  root.selectAll('*').remove();
  rootSvg = root.append('svg');
  rootSvg.attr('style', 'width: 100%; height: 100%');
  this.root = rootSvg
    .append('g')
      .attr('class', 'root-' + this.id);
};

Canvas.prototype.set = function(obj, render) {
  this.nodes = obj.nodes;
  this.edges = obj.edges;
  if (render) {
    this.render();
  }
};

Canvas.prototype.fixZoom = function() {
  var me = this,
      scr = rootSvg.node(),
      bbox = this.root.node().getBBox(),
      screenWidth = scr.clientWidth,
      screenHeight = scr.clientHeight,
      canvasWidth = bbox.width,
      canvasHeight = bbox.height,
      sx = this.data.mn.x,
      sy = this.data.mn.y,
      scale = Math.min(
        screenWidth / canvasWidth,
        screenHeight / canvasHeight
      ),
      translate;

  if (!isFinite(scale)) {
    scale = 0;
  }
  // change the scale proportionally to its proximity to zero
  scale -= scale / 10;

  translate = [
    -sx * scale + (screenWidth / 2 -
      canvasWidth * scale / 2),
    -sy * scale + (screenHeight / 2 -
      canvasHeight * scale / 2)
  ];

  function redraw() {
    var translation = d3.event.translate,
        newX = translation[0],
        newY = translation[1];
    me.root.attr('transform',
      utils.transform({
        translate: [newX, newY],
        scale: [d3.event.scale]
      })
    );
  }

  function zoomBehavior(type) {
    var start = type === 'start';
    return function () {
      d3.select(this).classed('dragged', start);
    };
  }

  // console.log('center', translate);
  // console.log(scr.clientWidth, bbox.width, sx);
  var zoom = d3.behavior.zoom()
    .on('zoomstart', zoomBehavior('start'))
    .on('zoom', redraw)
    .on('zoomend', zoomBehavior('end'))
    .translate(translate)
    .scale(scale);

  rootSvg.call(zoom);

  me.root
    .attr('transform', utils.transform({
      scale: [scale],
      translate: [
        -sx + (screenWidth / scale / 2 - canvasWidth / 2),
        -sy + (screenHeight / scale / 2 - canvasHeight / 2)
      ]
    }))
    .attr('opacity', 0)
    .transition()
    .duration(500)
    .attr('opacity', 1);
};

Canvas.prototype.render = function() {
  this.renderNodes();
  this.renderEdges();
  this.fixZoom();
};

Canvas.prototype.renderEdges = function() {
  var me = this,
      edges = this.edges;

  // CREATE
  var diagonal = d3.svg.diagonal()
  .source(function(d) {
    var from = me.root.select('.' +
          prefix(escapeCls(d.from))
        );
    if (!from.node()) {
      throw 'source node must exist';
    }
    var fromData = from.datum(),
        property = from.select('.' + prefix(
          d.from, hashCode(d.property)
        )),
        propertyData = d3.transform(property.attr('transform'));

    return {
      x: getY(fromData) + propertyData.translate[1] - 2,
      y: getX(fromData) + propertyData.translate[0] - 10
    };
  })
  .target(function(d) {
    var to = me.root.select('.' +
          prefix(escapeCls(d.to))
        ),
        toData, bbox;
    if (!to.node()) {
      throw 'target node must exist';
    }
    toData = to.datum();
    return {
      x: getY(toData) + 10,// + bbox.height / 2,
      y: getX(toData)// + bbox.width / 2
    };
  })
  .projection(function(d) {
    return [d.y, d.x];
  });

  function mouseEvent(type) {
    var over = type === 'over';
    return function (d) {
      d3.select(this)
        .classed('selected', over);
    };
  }

  this.root.selectAll('.link')
      .data(edges)
    .enter()
      .append('path')
      .attr('class', function (d) {
        return [
          prefix('to', escapeCls(d.to)),
          prefix('from', escapeCls(d.from)),
          prefix('link')
        ].join(' ');
      })
      .attr('stroke', 'lightgray')
      .attr('stroke-opacity', 0.3)
      .attr('d', diagonal)
      .on('mouseover', mouseEvent('over'))
      .on('mouseout', mouseEvent('out'));
};

Canvas.prototype.opacityToggle = function(decrease) {
  this.root
    .classed(prefix('nodes-focused'), decrease);
};

Canvas.prototype.renderNodes = function() {
  var nodes = this.nodes;

  var nodeCtor = pojoVizNode(this);
  nodeCtor.margin({
    top: 10,
    left: 10,
    right: 10,
    bottom: 10
  });
  var nodeGroup = this.root.selectAll(prefix('node'))
    .data(nodes)
    .call(nodeCtor);
};

module.exports = Canvas;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../renderer/utils":14,"../../util/":16,"../../util/hashKey":15,"./Node":8,"assert":2,"lodash":undefined}],8:[function(require,module,exports){
(function (global){
var _ = require('lodash'),
  d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
  utils = require('../../renderer/utils'),
  pojoVizProperty = require('./Property'),
  hashKey = require('../../util/hashKey');

var prefix = utils.prefixer;
var margin = { top: 0, right: 0, left: 0, bottom: 0 };

function Node(parent) {
  var root = d3.select(parent.root).node();
  function my(selection) {
    // create
    var enter = selection.enter();

    function groupMouseBehavior(type) {
      var over = type === 'over';
      return function (d, i) {
        var hk = d.hashKey;

        // hide all
        parent.opacityToggle(over);

        // select links
        root
          .selectAll('.' + prefix('to', hk))
          .classed('selected predecessor', over);
        root
          .selectAll('.' + prefix('from', hk))
          .classed('selected successor', over);

        // select current node
        root
          .select('.' + prefix(hk))
          .classed('selected current', over);

        // select predecessor nodes
        d.predecessors
          .forEach(function (v) {
            root
              .selectAll('.' + prefix(v))
              .classed('selected predecessor', over);
          });

        // select successor nodes
        d.successors
          .forEach(function (v) {
            root
              .selectAll('.' + prefix(v))
              .classed('selected successor', over);
          });
      };
    }

    var nodeEnter = enter
      .append('g')
      .attr('class', function (d) {
        // string,number,boolean.undefined,object,function
        //var type = d.label;
        return [
          prefix('node'),
          prefix(d.hashKey)
        ].join(' ');
      })
      .attr('transform', function (d) {
        return utils.translate(
          d.x - d.width / 2,
          d.y - d.height / 2
        );
      })
      .on('mouseover', groupMouseBehavior('over'))
      .on('mouseout', groupMouseBehavior('out'));

    nodeEnter
      .append('rect')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('class', 'node-background');

    nodeEnter
      // .append('g')
      .append('text')
        .attr('class', prefix('title'))
        .attr('transform', 'translate(20, 25)')
        .text(function (d) {
          return d.label;
        });

    // nodeEnter
    //   .append('text')
    //     .attr('class', 'title')
    //     .text(function (d) { return d.label; });

    var bodyEnter = nodeEnter
      .append('g')
        .attr('class', prefix('body'));

    var propertyCtor = pojoVizProperty();
    propertyCtor.margin(margin);
    bodyEnter.selectAll('g.' + prefix('property'))
      .data(function (d) {
        d.properties.forEach(function (p) {
          p.label = d.label;
        });
        return d.properties;
      })
      .call(propertyCtor);

    // fix node background width/height
    selection.each(function (d, i) {
      var el = d3.select(this),
          rect = el.select('rect.node-background');

      // setTimeout(function () {
      var bbox = el.node().getBBox();
      rect
        .attr('width', bbox.width + 20)
        .attr('height', bbox.height + 20);
      // }, 0);
    });
  }
  my.margin = function (m) {
    if (!m) {
      return margin;
    }
    margin = _.merge(margin, m);
  };
  return my;
}

module.exports = Node;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../renderer/utils":14,"../../util/hashKey":15,"./Property":9,"lodash":undefined}],9:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
  _ = require('lodash'),
  utils = require('../../renderer/utils');
var hashKey = require('../../util/hashKey');
var prefix = utils.prefixer;
var hashCode = require('../../util/').hashCode;

function Property() {
  var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  var titleHeight = 40;

  function my(selection) {

    function propertyY(d, i) {
      return [
        margin.left + 10,
        margin.top + titleHeight + i * 15
      ];
    }

    // PROPERTY CREATE
    function mouseEvent(type) {
      var over = type === 'over';
      return function (d, i) {
        d3.select(this)
          .transition()
            .duration(300)
            .attr('transform', function () {
              return utils.transform({
                translate: propertyY(d, i),
                scale: [over ? 1.5 : 1]
              });
            });
      };
    }
    var propertyEnter = selection.enter()
      .append('g')
      .attr('class', function (d) {
        return [
          prefix('property'),
          // e.g. object-1-length
          prefix(d.parent, hashCode(d.property))
        ].join(' ');
      })
      .attr('transform', function (d, i) {
        return utils.transform({
          translate: propertyY(d, i)
        });
      })
      .on('mouseover', mouseEvent('over'))
      .on('mouseout', mouseEvent('out'));

    propertyEnter
      .append('text')
      .attr('font-size', 10)
      .attr('text-anchor', 'start')
      .attr('class', function (d) {
        return [
          prefix('key')
        ].join(' ');
      })
      .text(function (d, i) {
        return d.property;
      })
      .on('click', function (d, i) {
        var link = d.label;
        var ev = new CustomEvent('property-click', {
          detail: {
            name: link,
            property: d.property
          }
        });
        document.dispatchEvent(ev);
      });

    var rectWrap = propertyEnter
      .insert('rect', 'text')
      .attr('class', function (d) {
        return [
          prefix(d.type),
          prefix('property', 'background')
        ].join(' ');
      })
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('x', -2)
      .attr('y', -9);

    selection.selectAll('rect.' + prefix('property', 'background'))
      .each(function (d) {
        var me = d3.select(this)
          .attr('height', function (d) {
            var text = d3
              .select(this.parentNode)
              .select('text');
            return text.property('clientHeight');
          })
          .attr('width', function (d) {
            var text = d3
              .select(this.parentNode)
              .select('text');
            return text.property('clientWidth') + 3;
          });
      });

    propertyEnter.each(function (d) {
      if (d.type === 'object' || d.type === 'function') {
        d3.select(this)
          .append('circle')
          .attr('r', 4)
          .attr('class', prefix('dot-' + d.type))
          .attr('cx', -10)
          .attr('cy', -2)
          .attr('opacity', 1);
      }
    });
  }
  my.margin = function (m) {
    if (!m) {
      return margin;
    }
    margin = _.merge(margin, m);
  };
  return my;
}

module.exports = Property;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../renderer/utils":14,"../../util/":16,"../../util/hashKey":15,"lodash":undefined}],10:[function(require,module,exports){
(function (global){
var Canvas = require('./Canvas'),
  canvas,
  canvasEl;

module.exports = {
  clear: function () {
    if (canvas) {
      canvas.destroy();
    }
  },
  render: function (data) {
    canvas = new Canvas(data, canvasEl);
    canvas.render();
  },
  setCanvasEl: function (el) {
    canvasEl = el;
  }
};

// custom events
global.document && document.addEventListener('property-click', function (e) {
  var detail = e.detail;
  global.pojoviz
    .getCurrentInspector()
    .showSearch(detail.name, detail.property);
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./Canvas":7}],11:[function(require,module,exports){
(function (global){
/**
 * Created by mauricio on 2/18/15.
 */
var dagre = require('dagre');
var assert = require('assert');
var _ = require('lodash');
var pojoviz = global.pojoviz;
var utils = pojoviz.utils;

var renderer;
module.exports = {
  renderers: {},

  /**
   * Given an inspector instance it build the graph and also the
   * layout of the nodes belonging to it, the resulting object is
   * an object which is used by a renderer to be drawn
   * @param {Inspector} inspector
   */
  process: function (inspector) {
    if (inspector.remote) {
      return this.doProcess(inspector.stringified);
    }
    return this.doProcess(inspector.analyzer.stringify());
  },
  /**
   * @param {object} nodesStringified An object with the following properties
   *  {
   *    nodes: [{}, ..] each object is generated in ObjectAnalyzer#stringify,
   *    edges: [{}, ..] each object is generated in ObjectAnalyzer#stringify
   *  }
   *
   * @return {Object} return An object with the following info:
   *  {
   *     nodes: [array of objects, each having label,x,y,height,
   *            width,properties,successors,predecessors],
   *     edges: [array of objects, each having to,from,property],
   *     center: an object with the center of the bbox that covers
   *            the layout of the graph
   *     mn: an object with info about the minimum x,y of the bbox
   *            that covers the layout of the graph
   *     mx: an object with info about the maximum x,y of the bbox
   *            that covers the layout of the graph
   *  }
   */
  doProcess: function (nodesStringified) {
    var g = new dagre.Digraph(),
      node,
      libraryLabels = nodesStringified.labels,
      libraryNodes = nodesStringified.nodes,
      libraryEdges = nodesStringified.edges;

    // create the graph
    // each element of the graph has
    // - label
    // - width
    // - height
    // - properties
    _.forOwn(libraryNodes, function (properties, k) {
      var label = libraryLabels[k][0].label;
      node = {
        hashKey: k,
        label: label,
        width: label.length * 10
      };
      // lines + header + padding bottom
      node.height = properties.length * 15 + 50;
      node.properties = properties;
      properties.forEach(function (v) {
        node.width = Math.max(node.width, v.property.length * 10);
      });
      g.addNode(k, node);
    });

    // build the edges from node to node
    _.forOwn(libraryEdges, function (links) {
      links.forEach(function (link) {
        if (g.hasNode(link.from) && g.hasNode(link.to)) {
          g.addEdge(null, link.from, link.to);
        }
      });
    });

    // generate the graph layout
    var layout = dagre.layout()
      .nodeSep(30)
      // .rankSep(70)
      // .rankDir('TB')
      .run(g);

    var nodes = [],
      edges = [],
      center = {x: 0, y: 0},
      mn = {x: Infinity, y: Infinity},
      mx = {x: -Infinity, y: -Infinity},
      total = g.nodes().length;

    // update the node info adding:
    // - x (x-coordinate of the center of the node)
    // - y (y-coordinate of the center of the node)
    // - predecessors (an array with the identifiers of the predecessors of this node)
    // - successors (an array with the identifiers of the successor of this node)
    layout.eachNode(function (k, layoutInfo) {
      var x = layoutInfo.x;
      var y = layoutInfo.y;

      node = g.node(k);
      node.x = x;
      node.y = y;
      node.predecessors = g.predecessors(k);
      node.successors = g.successors(k);
      nodes.push(node);

      // calculate the bbox of the graph to center the graph
      var mnx = x - node.width / 2;
      var mny = y - node.height / 2;
      var mxx = x + node.width / 2;
      var mxy = y + node.height / 2;

      center.x += x;
      center.y += y;
      mn.x = Math.min(mn.x, mnx);
      mn.y = Math.min(mn.y, mny);
      // console.log(x, y, ' dim ', node.width, node.height);
      mx.x = Math.max(mx.x, mxx);
      mx.y = Math.max(mx.y, mxy);
    });

    center.x /= (total || 1);
    center.y /= (total || 1);

    // create the edges from property to node
    _.forOwn(libraryEdges, function (links) {
      links.forEach(function (link) {
        if (g.hasNode(link.from) && g.hasNode(link.to)) {
          edges.push(link);
        }
      });
    });

    return {
      edges: edges,
      nodes: nodes,
      center: center,
      mn: mn,
      mx: mx
    };
  },

  /**
   * Draws the current inspector in the canvas with the following steps:
   *
   * - clears the canvas
   * - processes the data of the current inspector
   * - renders the data produced by the method above
   * - notifies the user of any action performed
   *
   * @param {Inspector} [inspector]
   * @param {Object} [renderer]
   */
  render: function (inspector, renderer) {
    var data;
    var me = this;

    inspector = inspector || pojoviz.getCurrentInspector();
    renderer = renderer || pojoviz.draw.getCurrentRenderer();

    utils.notification('processing ' + inspector.entryPoint);

    // pre render
    renderer.clear();

    setTimeout(function () {
      inspector.preRender();
      console.log('process & render start: ', new Date());
      // data:
      // - edges (property -> node)
      // - nodes
      // - center
      console.time('process');
      data = me.process(inspector);
      console.timeEnd('process');

      utils.notification('rendering ' + (inspector.displayName || inspector.entryPoint));

      console.time('render');
      renderer.render(data);
      console.timeEnd('render');

      utils.notification('complete!');
    }, 0);
  },

  /**
   * Adds a renderer to the available renderers
   * @param {string} key
   * @param {Object} value It needs to have the following methods:
   *  - clear
   *  - render
   */
  addRenderer: function (key, value) {
    // the renderer must be an object and have the following methods:
    // - render
    // - clear
    assert(value && typeof value === 'object', 'value is not an object');
    assert(value.clear && value.render, 'clear & render must be defined on object');
    this.renderers[key] = value;
  },

  /**
   * Updates the value of the current renderer
   * @param {string} r
   */
  setRenderer: function (r) {
    renderer = this.renderers[r];
  },

  /**
   * Gets a renderer by key
   * @param key
   * @returns {*}
   */
  getRenderer: function (key) {
    return this.renderers[key];
  },

  /**
   * Gets the current renderer
   * @returns {*}
   */
  getCurrentRenderer: function () {
    return renderer;
  }
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"assert":2,"dagre":undefined,"lodash":undefined}],12:[function(require,module,exports){
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */
/*global THREE, console */

// This set of controls performs orbiting, dollying (zooming), and panning. It maintains
// the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
// supported.
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe
//
// This is a drop-in replacement for (most) TrackballControls used in examples.
// That is, include this js file and wherever you see:
//      controls = new THREE.TrackballControls( camera );
//      controls.target.z = 150;
// Simple substitute "PanControls" and the control should work as-is.

THREE.PanControls = function ( object, domElement ) {

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the control orbits around
	// and where it pans with respect to.
	this.target = new THREE.Vector3();

	// center is old, deprecated; use "target" instead
	this.center = this.target;

	// This option actually enables dollying in and out; left as "zoom" for
	// backwards compatibility
	this.noZoom = false;
	this.zoomSpeed = 1.0;

	// Limits to how far you can dolly in and out
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// Set to true to disable this control
	this.noRotate = false;
	this.rotateSpeed = 1.0;

	// Set to true to disable this control
	this.noPan = false;
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// Set to true to disable use of the keys
	this.noKeys = false;

	// The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	////////////
	// internals

	var scope = this;

	var EPS = 0.000001;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();
	var panOffset = new THREE.Vector3();

	var offset = new THREE.Vector3();

	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();

	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 1;
	var pan = new THREE.Vector3();

	var lastPosition = new THREE.Vector3();
	var lastQuaternion = new THREE.Quaternion();

	var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

	var state = STATE.NONE;

	// for reset

	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();

	// so camera.up is the orbit axis

	var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
	var quatInverse = quat.clone().inverse();

	// events

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start'};
	var endEvent = { type: 'end'};

	this.rotateLeft = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		thetaDelta -= angle;

	};

	this.rotateUp = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		phiDelta -= angle;

	};

	// pass in distance in world space to move left
	this.panLeft = function ( distance ) {

		var te = this.object.matrix.elements;

		// get X column of matrix
		panOffset.set( te[ 0 ], te[ 1 ], te[ 2 ] );
		panOffset.multiplyScalar( - distance );

		pan.add( panOffset );

	};

	// pass in distance in world space to move up
	this.panUp = function ( distance ) {

		var te = this.object.matrix.elements;

		// get Y column of matrix
		panOffset.set( te[ 4 ], te[ 5 ], te[ 6 ] );
		panOffset.multiplyScalar( distance );

		pan.add( panOffset );

	};

	// pass in x,y of change desired in pixel space,
	// right and down are positive
	this.pan = function ( deltaX, deltaY ) {

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		if ( scope.object.fov !== undefined ) {

			// perspective
			var position = scope.object.position;
			var offset = position.clone().sub( scope.target );
			var targetDistance = offset.length();

			// half of the fov is center to top of screen
			targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

			// we actually don't use screenWidth, since perspective camera is fixed to screen height
			scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight );
			scope.panUp( 2 * deltaY * targetDistance / element.clientHeight );

		} else if ( scope.object.top !== undefined ) {

			// orthographic
			scope.panLeft( deltaX * (scope.object.right - scope.object.left) / element.clientWidth );
			scope.panUp( deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight );

		} else {

			// camera neither orthographic or perspective
			console.warn( 'WARNING: PanControls.js encountered an unknown camera type - pan disabled.' );

		}

	};

	this.dollyIn = function ( dollyScale ) {

		if ( dollyScale === undefined ) {

			dollyScale = getZoomScale();

		}

		scale /= dollyScale;

	};

	this.dollyOut = function ( dollyScale ) {

		if ( dollyScale === undefined ) {

			dollyScale = getZoomScale();

		}

		scale *= dollyScale;

	};

	this.update = function () {

		var position = this.object.position;

		offset.copy( position ).sub( this.target );

		// rotate offset to "y-axis-is-up" space
		offset.applyQuaternion( quat );

		// angle from z-axis around y-axis

		var theta = Math.atan2( offset.x, offset.z );

		// angle from y-axis

		var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

		if ( this.autoRotate ) {

			this.rotateLeft( getAutoRotationAngle() );

		}

		theta += thetaDelta;
		phi += phiDelta;

		// restrict phi to be between desired limits
		phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

		// restrict phi to be betwee EPS and PI-EPS
		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

		var radius = offset.length() * scale;

		// restrict radius to be between desired limits
		radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

		// move target to panned location
		this.target.add( pan );

		offset.x = radius * Math.sin( phi ) * Math.sin( theta );
		offset.y = radius * Math.cos( phi );
		offset.z = radius * Math.sin( phi ) * Math.cos( theta );

		// rotate offset back to "camera-up-vector-is-up" space
		offset.applyQuaternion( quatInverse );

		position.copy( this.target ).add( offset );

		this.object.lookAt( this.target );

		thetaDelta = 0;
		phiDelta = 0;
		scale = 1;
		pan.set( 0, 0, 0 );

		// update condition is:
		// min(camera displacement, camera rotation in radians)^2 > EPS
		// using small-angle approximation cos(x/2) = 1 - x^2 / 8

		if ( lastPosition.distanceToSquared( this.object.position ) > EPS
		    || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS ) {

			this.dispatchEvent( changeEvent );

			lastPosition.copy( this.object.position );
			lastQuaternion.copy (this.object.quaternion );

		}

	};


	this.reset = function () {

		state = STATE.NONE;

		this.target.copy( this.target0 );
		this.object.position.copy( this.position0 );

		this.update();

	};

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;
		event.preventDefault();

		if ( event.button === 2 ) {
			if ( scope.noRotate === true ) return;

			state = STATE.ROTATE;

			rotateStart.set( event.clientX, event.clientY );

		} else if ( event.button === 1 ) {
			if ( scope.noZoom === true ) return;

			state = STATE.DOLLY;

			dollyStart.set( event.clientX, event.clientY );

		} else if ( event.button === 0 ) {
			if ( scope.noPan === true ) return;

			state = STATE.PAN;

			panStart.set( event.clientX, event.clientY );

		}

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );
		scope.dispatchEvent( startEvent );

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		if ( state === STATE.ROTATE ) {

			if ( scope.noRotate === true ) return;

			rotateEnd.set( event.clientX, event.clientY );
			rotateDelta.subVectors( rotateEnd, rotateStart );

			// rotating across whole screen goes 360 degrees around
			scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

			// rotating up and down along whole screen attempts to go 360, but limited to 180
			scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

			rotateStart.copy( rotateEnd );

		} else if ( state === STATE.DOLLY ) {

			if ( scope.noZoom === true ) return;

			dollyEnd.set( event.clientX, event.clientY );
			dollyDelta.subVectors( dollyEnd, dollyStart );

			if ( dollyDelta.y > 0 ) {

				scope.dollyIn();

			} else {

				scope.dollyOut();

			}

			dollyStart.copy( dollyEnd );

		} else if ( state === STATE.PAN ) {

			if ( scope.noPan === true ) return;

			panEnd.set( event.clientX, event.clientY );
			panDelta.subVectors( panEnd, panStart );

			scope.pan( panDelta.x, panDelta.y );

			panStart.copy( panEnd );

		}

		scope.update();

	}

	function onMouseUp( /* event */ ) {

		if ( scope.enabled === false ) return;

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );
		scope.dispatchEvent( endEvent );
		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.noZoom === true ) return;

		event.preventDefault();
		event.stopPropagation();

		var delta = 0;

		if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta;

		} else if ( event.detail !== undefined ) { // Firefox

			delta = - event.detail;

		}

		if ( delta > 0 ) {

			scope.dollyOut();

		} else {

			scope.dollyIn();

		}

		scope.update();
		scope.dispatchEvent( startEvent );
		scope.dispatchEvent( endEvent );

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false || scope.noKeys === true || scope.noPan === true ) return;

		switch ( event.keyCode ) {

			case scope.keys.UP:
				scope.pan( 0, scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.BOTTOM:
				scope.pan( 0, - scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.LEFT:
				scope.pan( scope.keyPanSpeed, 0 );
				scope.update();
				break;

			case scope.keys.RIGHT:
				scope.pan( - scope.keyPanSpeed, 0 );
				scope.update();
				break;

		}

	}

	function touchstart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:	// one-fingered touch: rotate

				if ( scope.noRotate === true ) return;

				state = STATE.TOUCH_ROTATE;

				rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			case 2:	// two-fingered touch: dolly

				if ( scope.noZoom === true ) return;

				state = STATE.TOUCH_DOLLY;

				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				var distance = Math.sqrt( dx * dx + dy * dy );
				dollyStart.set( 0, distance );
				break;

			case 3: // three-fingered touch: pan

				if ( scope.noPan === true ) return;

				state = STATE.TOUCH_PAN;

				panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			default:

				state = STATE.NONE;

		}

		scope.dispatchEvent( startEvent );

	}

	function touchmove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		switch ( event.touches.length ) {

			case 1: // one-fingered touch: rotate

				if ( scope.noRotate === true ) return;
				if ( state !== STATE.TOUCH_ROTATE ) return;

				rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				rotateDelta.subVectors( rotateEnd, rotateStart );

				// rotating across whole screen goes 360 degrees around
				scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
				// rotating up and down along whole screen attempts to go 360, but limited to 180
				scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

				rotateStart.copy( rotateEnd );

				scope.update();
				break;

			case 2: // two-fingered touch: dolly

				if ( scope.noZoom === true ) return;
				if ( state !== STATE.TOUCH_DOLLY ) return;

				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				var distance = Math.sqrt( dx * dx + dy * dy );

				dollyEnd.set( 0, distance );
				dollyDelta.subVectors( dollyEnd, dollyStart );

				if ( dollyDelta.y > 0 ) {

					scope.dollyOut();

				} else {

					scope.dollyIn();

				}

				dollyStart.copy( dollyEnd );

				scope.update();
				break;

			case 3: // three-fingered touch: pan

				if ( scope.noPan === true ) return;
				if ( state !== STATE.TOUCH_PAN ) return;

				panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				panDelta.subVectors( panEnd, panStart );

				scope.pan( panDelta.x, panDelta.y );

				panStart.copy( panEnd );

				scope.update();
				break;

			default:

				state = STATE.NONE;

		}

	}

	function touchend( /* event */ ) {

		if ( scope.enabled === false ) return;

		scope.dispatchEvent( endEvent );
		state = STATE.NONE;

	}

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	this.domElement.addEventListener( 'mousedown', onMouseDown, false );
	this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

	this.domElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );

	window.addEventListener( 'keydown', onKeyDown, false );

	// force an update at start
	this.update();

};

THREE.PanControls.prototype = Object.create( THREE.EventDispatcher.prototype );

},{}],13:[function(require,module,exports){
(function (global){
require('./PanControls');

var t3 = (typeof window !== "undefined" ? window.t3 : typeof global !== "undefined" ? global.t3 : null),
  _ = require('lodash'),
  THREE = (typeof window !== "undefined" ? window.THREE : typeof global !== "undefined" ? global.THREE : null),
  el,
  instance;

module.exports = {
  clear: function () {
    var root = document.querySelector(el);
    while(root.firstChild) {
      root.removeChild(root.firstChild);
    }
    if (instance) {
      instance.loopManager.stop();
    }
  },
  setCanvasEl: function (newEl) {
    el = newEl;
  },
  render: function (data) {
    var rootEl;
    var nodes = data.nodes,
      edges = data.edges,
      nodeMap = {},
      margin = {
        top: 10,
        left: 10
      },
      fillStyle = {
        number: '#673ab7',
        'string': '#ff9800',
        'boolean': '#259b24',
        'undefined': '#000000'
      },
      borderStyle = {
        object: '#03a9f4',
        'function': '#e51c23'
      },
      defaultColor = '#000000',
      titleHeight = 40,
      projector = new THREE.Projector(),
      nodeMeshes = [];

    // the actual root element is a div created under the root
    rootEl = document.createElement('div');
    rootEl.id = 'root';
    rootEl.style.height = '100%';
    document.querySelector(el).appendChild(rootEl);

    nodes.forEach(function (node) {
      nodeMap[node.hashKey] = node;
    });

    var wrapperEl = rootEl;
    var bbox = rootEl.getBoundingClientRect();

    function getY(node, i) {
      return node.y - node.height * 0.5 +
        (node.properties.length - i) * 15;
    }

    function getX(node) {
      return node.x - node.width * 0.5 + margin.left;
    }

    function createCameraControls(camera, domElement) {
      camera.cameraControls = new THREE.PanControls(camera, domElement);
    }

    function createTextSprites() {
      var shapes = THREE.FontUtils.generateShapes("Hello world", {
        font: "helvetiker",
        weight: "bold",
        size: 10
      });
      var geom = new THREE.ShapeGeometry(shapes);
      var mat = new THREE.MeshBasicMaterial();
      return new THREE.Mesh(geom, mat);
    }

    function drawProperties(node, group) {
      var canvas = document.createElement('canvas');
      canvas.width = node.width;
      canvas.height = node.height;
      var context = canvas.getContext('2d');
      context.font = "normal 100 18px Roboto";
      context.fillStyle = "rgba(0, 0, 0, 1)";
      context.fillText(
        node.label,
        margin.left,
        margin.top + 15
      );

      node.properties.forEach(function (property, i) {
        var sphere;

        // draw text on the canvas
        context.font = "normal 15px Arial";
        context.fillStyle = fillStyle[property.type] || defaultColor;
        context.fillText(
          property.property,
          margin.left * 2,
          margin.top + titleHeight + i * 15
        );
      });

      var texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;

      var material = new THREE.MeshBasicMaterial({
        map: texture,
        side:THREE.DoubleSide
      });
      material.transparent = true;
      var mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(canvas.width, canvas.height),
          material
      );
      // mesh.position.x += node.width / 2;
      // mesh.position.y += node.height / 2;

      mesh.position.set(
        node.x,
        node.y,
        0.1
      );

      group.add(mesh);
    }

    function drawNodes() {
      var me = this,
        nodeGroup = new THREE.Object3D();

      nodes.forEach(function (node) {
        var points = [],
         g = new THREE.Object3D();
        points.push(new THREE.Vector2(0, 0));
        points.push(new THREE.Vector2(node.width, 0));
        points.push(new THREE.Vector2(node.width, node.height));
        points.push(new THREE.Vector2(0, node.height));

        var shape = new THREE.Shape(points);

        var geometry = new THREE.ShapeGeometry(shape);
        var mesh = new THREE.Mesh(
          geometry,
          new THREE.LineBasicMaterial({
            color: '#eeeeee',// borderStyle['function'],
            lineWidth: 1
          })
        );

        mesh.userData.node = node;
        mesh.position.set(
          node.x - node.width * 0.5,
          node.y - node.height * 0.5,
          0
        );

        // EACH ONE IS A SINGLE MESH
        me.activeScene.add(mesh);
        nodeMeshes.push(mesh);

        // MERGE
        // mesh.updateMatrix();
        // nodeGeometry.merge(mesh.geometry, mesh.matrix);

        // add the description in another group
        drawProperties(node, nodeGroup);
      });

      me.activeScene.add(nodeGroup);

      // MERGE
      // me.activeScene.add(new THREE.Mesh(
      //   nodeGeometry,
      //   new THREE.LineBasicMaterial({
      //     color: '#eeeeee',// borderStyle['function'],
      //     lineWidth: 1
      //   })
      // ));
    }

    function drawCircles() {
      var me = this,
        circleMesh = new THREE.Mesh(new THREE.CircleGeometry(5, 8)),
        meshes = {
          object: {
            material: new THREE.MeshBasicMaterial({
              color: borderStyle.object
            }),
            geometry: new THREE.Geometry()
          },
          'function': {
            material: new THREE.MeshBasicMaterial({
              color: borderStyle['function']
            }),
            geometry: new THREE.Geometry()
          }
        };
      nodes.forEach(function (node) {
        node.properties.forEach(function (property, i) {
          if (property.type === 'function' || property.type === 'object') {
            circleMesh.position.set(
              getX(node), getY(node, i) + 5, 0.2
            );
            circleMesh.updateMatrix();
            meshes[property.type].geometry
              .merge(circleMesh.geometry, circleMesh.matrix);
          }
        });
      });
      me.activeScene.add(new THREE.Mesh(
        meshes.object.geometry, meshes.object.material
      ));
      me.activeScene.add(new THREE.Mesh(
        meshes['function'].geometry, meshes['function'].material
      ));
    }

    function generateSpline(f, mid, t, d) {
      var mult = 0,
        bumpZ = mid.z * 0.2,
        fm = new THREE.Vector3()
          .addVectors(f, mid)
          .multiplyScalar(0.5)
          .add(new THREE.Vector3(
            (mid.x - f.x) * mult,
            (f.y - mid.y) * mult,
            bumpZ
          )),
        mt = new THREE.Vector3()
          .addVectors(mid, t)
          .multiplyScalar(0.5)
          .add(new THREE.Vector3(
            (mid.x - t.x) * mult,
            (t.y - mid.y) * mult,
            bumpZ
          ));

      var spline = new THREE.Spline([
        f, fm, mid, mt, t
      ]), i, l = 10, index, position,
        geometry = new THREE.Geometry();

      geometry.colors = [];
      for (i = 0; i <= l; i += 1) {
        index = i / l;
        position = spline.getPoint(index);
        geometry.vertices[i] = new THREE.Vector3(position.x, position.y, position.z);
        geometry.colors[i] = new THREE.Color(0xffffff);
        geometry.colors[i].setHSL(
          // 200 / 360,
          // index,
          // 0.5
          200/360,
          1,
          0.9
        );
      }
      return geometry;
    }

    function drawEdges(scope) {
      var me = this,
        fromV = new THREE.Vector3(),
        toV = new THREE.Vector3(),
        mid = new THREE.Vector3();

      edges.forEach(function (link, i) {
        // console.log(i, edges.length);
        var from = nodeMap[link.from];
        var to = nodeMap[link.to];

        var index = _.findIndex(
          from.properties,
          { name: link.property }
        );
        fromV.set(
          from.x - from.width * 0.5 + margin.left,
          from.y - from.height * 0.5 + (from.properties.length - index) * 15 + 5,
          0
        );
        toV.set(
          to.x - to.width * 0.5,
          to.y - to.height * 0.5,
          0
        );
        var d = fromV.distanceTo(toV);
        mid
          .addVectors(fromV, toV)
          .multiplyScalar(0.5)
          .setZ(50);

        var geometry = generateSpline(fromV, mid, toV, d);
        var material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          opacity: 0.5,
          linewidth: 3,
          vertexColors: THREE.VertexColors
        });
        var mesh = new THREE.Line(geometry, material);
        me.activeScene.add(mesh);
      });
    }

    // pre init
    t3.themes.allWhite = {
      clearColor: 0xffffff,
      fogColor: 0xffffff,
      groundColor: 0xffffff
    };
    instance = t3.run({
      selector: el + ' #root',
      width: bbox.width,
      height: bbox.height,
      theme: 'allWhite',
      ambientConfig: {
        ground: false,
        axes: false,
        gridY: false,
        gridX: false,
        gridZ: false
      },
      init: function () {
        var me = this,
          rendererEl = me.renderer.domElement;
        me.datgui.close();
        me.activeScene.fog = null;
        me.renderer.sortObjects = false;
        me.renderer.shadowMapEnabled = true;
        me.renderer.shadowMapType = THREE.PCFShadowMap;

        var mouse = new THREE.Vector3();
        var moved = false, down = false;
        rendererEl.addEventListener('mousemove', function (e) {
          if (down) {
            moved = true;
            wrapperEl.style.cursor = 'move';
          } else {
            moved = false;
          }
        });
        rendererEl.addEventListener('mousedown', function (e) {
          down = true;
        });
        rendererEl.addEventListener('mouseup', function (e) {
          down = false;
          wrapperEl.style.cursor = 'auto';
        });
        rendererEl.addEventListener('click', function (e) {
          e.preventDefault();
          var bbox = rendererEl.getBoundingClientRect();
          var cx = e.clientX - bbox.left;
          var cy = e.clientY - bbox.top;
          mouse.x = (cx / rendererEl.clientWidth) * 2 - 1;
          mouse.y = -(cy / rendererEl.clientHeight) * 2 + 1;
          var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
          projector.unprojectVector(vector, me.activeCamera);

          var raycaster = new THREE.Raycaster(
            camera.position,
            vector.sub(camera.position).normalize()
          );
          var intersects = raycaster.intersectObjects(nodeMeshes),
            iObject = intersects[0] && intersects[0].object;
          if (iObject && !moved) {
            // focus on this object on click
            // console.log(iObject);
            var dest = {
              x: iObject.position.x + iObject.userData.node.width / 2,
              y: iObject.position.y + iObject.userData.node.height / 2
            };
            new TWEEN.Tween(me.activeCamera.position)
              .to(_.merge({}, dest, {
                z: Math.max(iObject.userData.node.height, 350)
              }), 1000)
              .easing(TWEEN.Easing.Cubic.InOut)
              .start();
            new TWEEN.Tween(me.activeCamera.cameraControls.target)
              .to(dest, 1000)
              .easing(TWEEN.Easing.Cubic.InOut)
              .start();
          }
        }, false);

        // camera setup
        var fov = 70,
          ratio = rendererEl.clientWidth / rendererEl.clientHeight,
          near = 1,
          far = 20000;
        var camera = new THREE.PerspectiveCamera(fov, ratio, near, far);
        me
          .addCamera(camera, 'mine')
          .setActiveCamera('mine');
        createCameraControls(camera, rendererEl);
        camera.cameraControls.target.set(
          data.center.x,
          data.center.y,
          0
        );
        camera.cameraControls.noKeys = true;

        // draw the nodes
        drawNodes.call(me);
        drawCircles.call(me);
        drawEdges.call(me);

        setTimeout(function () {
          camera.position.set(
            data.center.x,
            data.center.y,
            Math.min(data.mx.x - data.mn.x, data.mx.y - data.mn.y)
          );
          //camera.lookAt(new THREE.Vector3(data.center.x, data.center.y, 0));
        }, 0);
      },
      update: function (delta) {
        TWEEN.update();
        var me = this;
        me.ac = me.ac || 0;
        me.ac += delta;
        if (me.ac > 2) {
          // console.log(me.renderer.info.render);
          // console.log(me.renderer);
          me.ac = 0;
        }
      }
    });
  }
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./PanControls":12,"lodash":undefined}],14:[function(require,module,exports){
'use strict';

var _ = require('lodash');

var changeFakePropertyName = {
  '[[Prototype]]': '__proto__'
};

var utils = {
  translate: function (x, y) {
    return 'translate(' + (x || 0) + ', ' + (y || 0) + ')';
  },
  scale: function (s) {
    return 'scale(' + (s || 1) + ')';
  },
  transform: function (obj) {
    var t = [];
    _.forOwn(obj, function (v, k) {
      t.push(utils[k].apply(utils, v));
    });
    return t.join(' ');
  },
  prefixer: function () {
    var args = [].slice.call(arguments);
    args.unshift('pv');
    return args.join('-');
  },
  transformProperty: function (v) {
    if (changeFakePropertyName.hasOwnProperty(v)) {
      return changeFakePropertyName[v];
    }
    return v;
  },
  escapeCls: function(v) {
    return v.replace(/\$/g, '_');
  }
};

module.exports = utils;
},{"lodash":undefined}],15:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var assert = require('assert');
var utils = require('./');
var me, hashKey;
var doGet, doSet;

me = hashKey = function (v) {
  var uid = v;
  if (utils.isObjectOrFunction(v)) {
    if (!me.has(v)) {
      doSet(v, _.uniqueId());
    }
    uid = doGet(v);
    if (!me.has(v)) {
      throw Error(v + ' should have a hashKey at this point :(');
    }
    return uid;
  }

  // v is a primitive
  return typeof v + '-' + uid;
};

/**
 * @private
 * Gets the stored hashkey, since there are object that might not have a chain
 * up to Object.prototype the check is done with Object.prototype.hasOwnProperty explicitly
 *
 * @param  {*} obj
 * @return {string}
 */
doGet = function (obj) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  return Object.prototype.hasOwnProperty.call(obj, me.hiddenKey) &&
    obj[me.hiddenKey];
};

/**
 * @private
 * Sets a hidden key on an object, the hidden key is determined as follows:
 *
 * - null object-null
 * - numbers: number-{value}
 * - boolean: boolean-{true|false}
 * - string: string-{value}
 * - undefined undefined-undefined
 * - function: function-{id} id = _.uniqueId
 * - object: object-{id} id = _.uniqueId
 *
 * @param {*} obj The object to set the hiddenKey
 * @param {string} key The key to be set in the object
 */
doSet = function (obj, key) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  assert(
    typeof key === 'string',
    'The key needs to be a valid string'
  );
  var value;
  if (!me.has(obj)) {
    value = typeof obj + '-' + key;
    Object.defineProperty(obj, me.hiddenKey, {
      value: value
    });
    if (!obj[me.hiddenKey]) {
      // in node setting the instruction above might not have worked
      console.warn('hashKey#doSet() setting the value on the object directly');
      obj[me.hiddenKey] = value;
    }
    assert(obj[me.hiddenKey], 'Object.defineProperty did not work!');
  }
  return me;
};

me.hiddenKey = '__pojovizKey__';

me.has = function (v) {
  return typeof doGet(v) === 'string';
};

module.exports = me;
},{"./":16,"assert":2,"lodash":undefined}],16:[function(require,module,exports){
'use strict';

var _ = require('lodash');

function type(v) {
  return Object.prototype.toString.call(v).slice(8, -1);
}

var utils = {};

/**
 * After calling `Object.prototype.toString` with `v` as the scope
 * the return value would be the concatenation of '[Object ',
 * class and ']', `class` is the returning value of this function
 *
 * e.g.   Object.prototype.toString.call([]) == [object Array],
 *        the returning value is the string Array
 *
 * @param {*} v
 * @returns {string}
 */
utils.internalClassProperty = function (v) {
  return type(v);
};

/**
 * Checks if a given value is a function, the library only needs
 * to distinguish between different kinds of primitive types (no need to
 * distinguish between different kinds of objects)
 *
 * @param  {*}  v The value to be checked
 * @returns {Boolean}
 */
utils.isFunction = function (v) {
  return !!v && typeof v === 'function';
};

/**
 * Checks if the value is a constructor,
 * NOTE: for the sake of this library a constructor is a function
 * that has a name which starts with an uppercase letter and also
 * that the prototype's constructor is itself
 * @param {*} v
 */
utils.isConstructor = function (v) {
  return this.isFunction(v) && typeof v.name === 'string' &&
      v.name.length && v.prototype && v.prototype.constructor === v;
};

/**
 * Checks if a given value is an object, the library only needs
 * to distinguish between different kinds of primitive types (no need to
 * distinguish between different kinds of objects)
 *
 * NOTE: a function will not pass this test
 * i.e.
 *        utils.isObject(function() {}) is false!
 *
 * Special values whose `typeof` results in an object:
 * - null
 *
 * @param  {*}  v The value to be checked
 * @returns {Boolean}
 */
utils.isObject = function (v) {
  return !!v && typeof v === 'object';
};

/**
 * Checks if the given value is an object or a function (note that for the sake
 * of the library Arrays are not objects)
 *
 * @param {*} v
 * @returns {Boolean}
 */
utils.isObjectOrFunction = function (v) {
  return utils.isObject(v) || utils.isFunction(v);
};

/**
 * @template
 *
 * Checks if the given value is traversable, for the sake of the library an
 * object (which is not an array) or a function is traversable, since this function
 * is used by the object analyzer overriding it will determine which objects
 * are traversable
 *
 * @param {*} v
 * @returns {Boolean}
 */
utils.isTraversable = function (v) {
  return utils.isObjectOrFunction(v);
};

/**
 * Creates a special function which is able to execute a series of functions through
 * chaining, to run all the functions stored in the chain execute the resulting value
 *
 * - each function is invoked with the original arguments which `functionChain` was
 * invoked with + the resulting value of the last operation as the last argument
 * - the scope of each function is the same scope as the one that the resulting
 * function will have
 *
 *    var fns = utils.functionChain()
 *                .chain(function (a, b) {
 *                  console.log(a, b);
 *                  return 'first';
 *                })
 *                .chain(function (a, b, c) {
 *                  console.log(a, b, c);
 *                  return 'second;
 *                })
 *    fns(1, 2);  // returns 'second'
 *    // logs 1, 2
 *    // logs 1, 2, 'first'
 *
 * @returns {Function}
 */
utils.functionChain = function () {
  var stack = [];
  var inner = function () {
    var args = Array.prototype.slice.call(arguments);
    var value = null;
    for (var i = 0; i < stack.length; i += 1) {
      value = stack[i].apply(this, args.concat(value));
    }
    return value;
  };
  inner.chain = function (v) {
    stack.push(v);
    return inner;
  };
  return inner;
};

/**
 * Given a str made of any characters this method returns a string
 * representation of a signed int
 * @param {string} str
 */
utils.hashCode = function (str) {
  var i, length, char, hash = 0;
  for (i = 0, length = str.length; i < length; i += 1) {
    char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return String(hash);
};

utils.createEvent = function (eventName, details) {
  return new CustomEvent(eventName, {
    detail: details
  });
};
utils.notification = function (message, consoleToo) {
  var ev = utils.createEvent('pojoviz-notification', message);
  consoleToo && console.log(message);
  document.dispatchEvent(ev);
};
utils.createJsonpCallback = function (url) {
  var script = document.createElement('script');
  script.src = url;
  document.head.appendChild(script);
};
utils.toQueryString = function (obj) {
  var s = '',
    i = 0;
  _.forOwn(obj, function (v, k) {
    if (i) {
      s += '&';
    }
    s += k + '=' + v;
    i += 1;
  });
  return s;
};

/**
 * @template
 *
 * Given a property name this method identifies if it's a valid property for the sake
 * of the library, a valid property is a property which does not provoke an error
 * when trying to access the value associated to it from any object
 *
 * For example executing the following code in strict mode will yield an error:
 *
 *    var fn = function() {};
 *    fn.arguments
 *
 * Since arguments is prohibited in strict mode
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
 *
 *
 *
 * @param {Object|Function} object
 * @param {string} property
 */
utils.objectPropertyIsForbidden = function (object, property) {
  var key;
  var rules = utils.propertyForbiddenRules;
  for (key in rules) {
    if (rules.hasOwnProperty(key)) {
      if (rules[key](object, property)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * @template
 *
 * Modify this object to add/remove rules that wil be run by
 * #objectPropertyIsForbidden, to determine if a property is invalid
 *
 * @type {Object}
 */
utils.propertyForbiddenRules = {
  /**
   * `caller` and `arguments` are invalid properties of a function in strict mode
   * @param {*} object
   * @param {string} property
   * @returns {boolean}
   */
  strictMode: function (object, property) {
    if (utils.isFunction(object)) {
      return property === 'caller' || property === 'arguments';
    }
    return false;
  },

  /**
   * Properties that start and end with __ are special properties,
   * in some cases they are valid (like __proto__) or deprecated
   * like __defineGetter__
   *
   * e.g.
   *  - Object.prototype.__proto__
   *  - Object.prototype.__defineGetter__
   *  - Object.prototype.__defineSetter__
   *  - Object.prototype.__lookupGetter__
   *  - Object.prototype.__lookupSetter__
   *
   * @param {*} object
   * @param {string} property
   * @returns {boolean}
   */
  hiddenProperty: function (object, property) {
    return property.search(/^__.*?__$/) > -1;
  },

  /**
   * Angular hidden properties start and end with $$, for the sake
   * of the library these are invalid properties
   * @param {*} object
   * @param {string} property
   * @returns {boolean}
   */
  angularHiddenProperty: function (object, property) {
    return property.search(/^\$\$.*?\$\$$/) > -1;
  },

  /**
   * The properties that have the following symbols are forbidden:
   * [:+~!><=//\[\]@\. ]
   * @param {*} object
   * @param {string} property
   * @returns {boolean}
   */
  //symbols: function (object, property) {
  //  return property.search(/[:+~!><=//\]@\. ]/) > -1;
  //}
};

module.exports = utils;
},{"lodash":undefined}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcmVuZGVyZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsInNyYy9yZW5kZXJlci9kMy9DYW52YXMuanMiLCJzcmMvcmVuZGVyZXIvZDMvTm9kZS5qcyIsInNyYy9yZW5kZXJlci9kMy9Qcm9wZXJ0eS5qcyIsInNyYy9yZW5kZXJlci9kMy9pbmRleC5qcyIsInNyYy9yZW5kZXJlci9kcmF3LmpzIiwic3JjL3JlbmRlcmVyL3RocmVlL1BhbkNvbnRyb2xzLmpzIiwic3JjL3JlbmRlcmVyL3RocmVlL2luZGV4LmpzIiwic3JjL3JlbmRlcmVyL3V0aWxzLmpzIiwic3JjL3V0aWwvaGFzaEtleS5qcyIsInNyYy91dGlsL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2b0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBpdCdzIG5vdCBhIHN0YW5kYWxvbmUgcGFja2FnZVxuLy8gYnV0IGl0IGV4dGVuZHMgcG9qb3ZpeidzIGZ1bmN0aW9uYWxpdHlcbnZhciBwb2pvdml6ID0gZ2xvYmFsLnBvam92aXo7XG5pZiAoIXBvam92aXopIHtcbiAgdGhyb3cgJ1RoaXMgaXMgbm90IGEgc3RhbmRhbG9uZSBwcm9qZWN0LCBwb2pvdml6IG5vdCBmb3VuZCc7XG59XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5fLm1lcmdlKHBvam92aXosIHtcbiAgZHJhdzogcmVxdWlyZSgnLi9kcmF3Jylcbn0pO1xuXG5wb2pvdml6LmRyYXcuYWRkUmVuZGVyZXIoJ2QzJywgcmVxdWlyZSgnLi9kMy8nKSk7XG5wb2pvdml6LmRyYXcuYWRkUmVuZGVyZXIoJ3RocmVlJywgcmVxdWlyZSgnLi90aHJlZS8nKSk7XG5wb2pvdml6LmRyYXcuc2V0UmVuZGVyZXIoJ2QzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gcG9qb3Zpei5kcmF3OyIsIi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyB3aGVuIHVzZWQgaW4gbm9kZSwgdGhpcyB3aWxsIGFjdHVhbGx5IGxvYWQgdGhlIHV0aWwgbW9kdWxlIHdlIGRlcGVuZCBvblxuLy8gdmVyc3VzIGxvYWRpbmcgdGhlIGJ1aWx0aW4gdXRpbCBtb2R1bGUgYXMgaGFwcGVucyBvdGhlcndpc2Vcbi8vIHRoaXMgaXMgYSBidWcgaW4gbm9kZSBtb2R1bGUgbG9hZGluZyBhcyBmYXIgYXMgSSBhbSBjb25jZXJuZWRcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcblxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBzdGFja1N0YXJ0RnVuY3Rpb24ubmFtZTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHV0aWwuaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHV0aWwuaXNOdW1iZXIodmFsdWUpICYmICFpc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB1dGlsLmlzUmVnRXhwKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodXRpbC5pc1N0cmluZyhzKSkge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuYWN0dWFsLCByZXBsYWNlciksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNCdWZmZXIoYWN0dWFsKSAmJiB1dGlsLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCF1dGlsLmlzT2JqZWN0KGFjdHVhbCkgJiYgIXV0aWwuaXNPYmplY3QoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiKSB7XG4gIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGEpIHx8IHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy8gaWYgb25lIGlzIGEgcHJpbWl0aXZlLCB0aGUgb3RoZXIgbXVzdCBiZSBzYW1lXG4gIGlmICh1dGlsLmlzUHJpbWl0aXZlKGEpIHx8IHV0aWwuaXNQcmltaXRpdmUoYikpIHtcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgfVxuICB2YXIgYUlzQXJncyA9IGlzQXJndW1lbnRzKGEpLFxuICAgICAgYklzQXJncyA9IGlzQXJndW1lbnRzKGIpO1xuICBpZiAoKGFJc0FyZ3MgJiYgIWJJc0FyZ3MpIHx8ICghYUlzQXJncyAmJiBiSXNBcmdzKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhSXNBcmdzKSB7XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAga2V5LCBpO1xuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodXRpbC5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW2ZhbHNlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikge3Rocm93IGVycjt9fTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gdHJ1ZTtcbiAgICB2YXIgY3VycmVudFF1ZXVlO1xuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbaV0oKTtcbiAgICAgICAgfVxuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG59XG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHF1ZXVlLnB1c2goZnVuKTtcbiAgICBpZiAoIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpLFxuICBfID0gcmVxdWlyZSgnbG9kYXNoJyksXG4gIHV0aWxzID0gcmVxdWlyZSgnLi4vLi4vcmVuZGVyZXIvdXRpbHMnKSxcbiAgcG9qb1Zpek5vZGUgPSByZXF1aXJlKCcuL05vZGUnKTtcblxudmFyIHJvb3RTdmc7XG52YXIgcHJlZml4ID0gdXRpbHMucHJlZml4ZXI7XG52YXIgZXNjYXBlQ2xzID0gdXRpbHMuZXNjYXBlQ2xzO1xudmFyIGhhc2hDb2RlID0gcmVxdWlyZSgnLi4vLi4vdXRpbC8nKS5oYXNoQ29kZTtcbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9oYXNoS2V5Jyk7XG5cbmZ1bmN0aW9uIGdldFgoZCkge1xuICByZXR1cm4gZC54IC0gZC53aWR0aCAvIDI7XG59XG5cbmZ1bmN0aW9uIGdldFkoZCkge1xuICByZXR1cm4gZC55IC0gZC5oZWlnaHQgLyAyO1xufVxuXG5mdW5jdGlvbiBDYW52YXMoZGF0YSwgZWwpIHtcbiAgYXNzZXJ0KGVsKTtcbiAgdGhpcy5pZCA9IF8udW5pcXVlSWQoKTtcbiAgdGhpcy5kYXRhID0gZGF0YTtcbiAgdGhpcy5jcmVhdGVSb290KGVsKTtcbiAgdGhpcy5zZXQoe1xuICAgIG5vZGVzOiBkYXRhLm5vZGVzLFxuICAgIGVkZ2VzOiBkYXRhLmVkZ2VzXG4gIH0pO1xufVxuXG5DYW52YXMucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5kYXRhID0gbnVsbDtcbiAgcm9vdFN2Z1xuICAgIC5zZWxlY3RBbGwoJyonKVxuICAgIC5yZW1vdmUoKTtcbn07XG5cbkNhbnZhcy5wcm90b3R5cGUuY3JlYXRlUm9vdCA9IGZ1bmN0aW9uKGVsKSB7XG4gIHZhciByb290ID0gZDMuc2VsZWN0KGVsKTtcbiAgYXNzZXJ0KHJvb3RbMF1bMF0sIFwiY2FudmFzIGNvdWxkbid0IGJlIHNlbGVjdGVkXCIpO1xuICByb290LnNlbGVjdEFsbCgnKicpLnJlbW92ZSgpO1xuICByb290U3ZnID0gcm9vdC5hcHBlbmQoJ3N2ZycpO1xuICByb290U3ZnLmF0dHIoJ3N0eWxlJywgJ3dpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCUnKTtcbiAgdGhpcy5yb290ID0gcm9vdFN2Z1xuICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3Jvb3QtJyArIHRoaXMuaWQpO1xufTtcblxuQ2FudmFzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihvYmosIHJlbmRlcikge1xuICB0aGlzLm5vZGVzID0gb2JqLm5vZGVzO1xuICB0aGlzLmVkZ2VzID0gb2JqLmVkZ2VzO1xuICBpZiAocmVuZGVyKSB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxufTtcblxuQ2FudmFzLnByb3RvdHlwZS5maXhab29tID0gZnVuY3Rpb24oKSB7XG4gIHZhciBtZSA9IHRoaXMsXG4gICAgICBzY3IgPSByb290U3ZnLm5vZGUoKSxcbiAgICAgIGJib3ggPSB0aGlzLnJvb3Qubm9kZSgpLmdldEJCb3goKSxcbiAgICAgIHNjcmVlbldpZHRoID0gc2NyLmNsaWVudFdpZHRoLFxuICAgICAgc2NyZWVuSGVpZ2h0ID0gc2NyLmNsaWVudEhlaWdodCxcbiAgICAgIGNhbnZhc1dpZHRoID0gYmJveC53aWR0aCxcbiAgICAgIGNhbnZhc0hlaWdodCA9IGJib3guaGVpZ2h0LFxuICAgICAgc3ggPSB0aGlzLmRhdGEubW4ueCxcbiAgICAgIHN5ID0gdGhpcy5kYXRhLm1uLnksXG4gICAgICBzY2FsZSA9IE1hdGgubWluKFxuICAgICAgICBzY3JlZW5XaWR0aCAvIGNhbnZhc1dpZHRoLFxuICAgICAgICBzY3JlZW5IZWlnaHQgLyBjYW52YXNIZWlnaHRcbiAgICAgICksXG4gICAgICB0cmFuc2xhdGU7XG5cbiAgaWYgKCFpc0Zpbml0ZShzY2FsZSkpIHtcbiAgICBzY2FsZSA9IDA7XG4gIH1cbiAgLy8gY2hhbmdlIHRoZSBzY2FsZSBwcm9wb3J0aW9uYWxseSB0byBpdHMgcHJveGltaXR5IHRvIHplcm9cbiAgc2NhbGUgLT0gc2NhbGUgLyAxMDtcblxuICB0cmFuc2xhdGUgPSBbXG4gICAgLXN4ICogc2NhbGUgKyAoc2NyZWVuV2lkdGggLyAyIC1cbiAgICAgIGNhbnZhc1dpZHRoICogc2NhbGUgLyAyKSxcbiAgICAtc3kgKiBzY2FsZSArIChzY3JlZW5IZWlnaHQgLyAyIC1cbiAgICAgIGNhbnZhc0hlaWdodCAqIHNjYWxlIC8gMilcbiAgXTtcblxuICBmdW5jdGlvbiByZWRyYXcoKSB7XG4gICAgdmFyIHRyYW5zbGF0aW9uID0gZDMuZXZlbnQudHJhbnNsYXRlLFxuICAgICAgICBuZXdYID0gdHJhbnNsYXRpb25bMF0sXG4gICAgICAgIG5ld1kgPSB0cmFuc2xhdGlvblsxXTtcbiAgICBtZS5yb290LmF0dHIoJ3RyYW5zZm9ybScsXG4gICAgICB1dGlscy50cmFuc2Zvcm0oe1xuICAgICAgICB0cmFuc2xhdGU6IFtuZXdYLCBuZXdZXSxcbiAgICAgICAgc2NhbGU6IFtkMy5ldmVudC5zY2FsZV1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHpvb21CZWhhdmlvcih0eXBlKSB7XG4gICAgdmFyIHN0YXJ0ID0gdHlwZSA9PT0gJ3N0YXJ0JztcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoJ2RyYWdnZWQnLCBzdGFydCk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIGNvbnNvbGUubG9nKCdjZW50ZXInLCB0cmFuc2xhdGUpO1xuICAvLyBjb25zb2xlLmxvZyhzY3IuY2xpZW50V2lkdGgsIGJib3gud2lkdGgsIHN4KTtcbiAgdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAub24oJ3pvb21zdGFydCcsIHpvb21CZWhhdmlvcignc3RhcnQnKSlcbiAgICAub24oJ3pvb20nLCByZWRyYXcpXG4gICAgLm9uKCd6b29tZW5kJywgem9vbUJlaGF2aW9yKCdlbmQnKSlcbiAgICAudHJhbnNsYXRlKHRyYW5zbGF0ZSlcbiAgICAuc2NhbGUoc2NhbGUpO1xuXG4gIHJvb3RTdmcuY2FsbCh6b29tKTtcblxuICBtZS5yb290XG4gICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zZm9ybSh7XG4gICAgICBzY2FsZTogW3NjYWxlXSxcbiAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAtc3ggKyAoc2NyZWVuV2lkdGggLyBzY2FsZSAvIDIgLSBjYW52YXNXaWR0aCAvIDIpLFxuICAgICAgICAtc3kgKyAoc2NyZWVuSGVpZ2h0IC8gc2NhbGUgLyAyIC0gY2FudmFzSGVpZ2h0IC8gMilcbiAgICAgIF1cbiAgICB9KSlcbiAgICAuYXR0cignb3BhY2l0eScsIDApXG4gICAgLnRyYW5zaXRpb24oKVxuICAgIC5kdXJhdGlvbig1MDApXG4gICAgLmF0dHIoJ29wYWNpdHknLCAxKTtcbn07XG5cbkNhbnZhcy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucmVuZGVyTm9kZXMoKTtcbiAgdGhpcy5yZW5kZXJFZGdlcygpO1xuICB0aGlzLmZpeFpvb20oKTtcbn07XG5cbkNhbnZhcy5wcm90b3R5cGUucmVuZGVyRWRnZXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG1lID0gdGhpcyxcbiAgICAgIGVkZ2VzID0gdGhpcy5lZGdlcztcblxuICAvLyBDUkVBVEVcbiAgdmFyIGRpYWdvbmFsID0gZDMuc3ZnLmRpYWdvbmFsKClcbiAgLnNvdXJjZShmdW5jdGlvbihkKSB7XG4gICAgdmFyIGZyb20gPSBtZS5yb290LnNlbGVjdCgnLicgK1xuICAgICAgICAgIHByZWZpeChlc2NhcGVDbHMoZC5mcm9tKSlcbiAgICAgICAgKTtcbiAgICBpZiAoIWZyb20ubm9kZSgpKSB7XG4gICAgICB0aHJvdyAnc291cmNlIG5vZGUgbXVzdCBleGlzdCc7XG4gICAgfVxuICAgIHZhciBmcm9tRGF0YSA9IGZyb20uZGF0dW0oKSxcbiAgICAgICAgcHJvcGVydHkgPSBmcm9tLnNlbGVjdCgnLicgKyBwcmVmaXgoXG4gICAgICAgICAgZC5mcm9tLCBoYXNoQ29kZShkLnByb3BlcnR5KVxuICAgICAgICApKSxcbiAgICAgICAgcHJvcGVydHlEYXRhID0gZDMudHJhbnNmb3JtKHByb3BlcnR5LmF0dHIoJ3RyYW5zZm9ybScpKTtcblxuICAgIHJldHVybiB7XG4gICAgICB4OiBnZXRZKGZyb21EYXRhKSArIHByb3BlcnR5RGF0YS50cmFuc2xhdGVbMV0gLSAyLFxuICAgICAgeTogZ2V0WChmcm9tRGF0YSkgKyBwcm9wZXJ0eURhdGEudHJhbnNsYXRlWzBdIC0gMTBcbiAgICB9O1xuICB9KVxuICAudGFyZ2V0KGZ1bmN0aW9uKGQpIHtcbiAgICB2YXIgdG8gPSBtZS5yb290LnNlbGVjdCgnLicgK1xuICAgICAgICAgIHByZWZpeChlc2NhcGVDbHMoZC50bykpXG4gICAgICAgICksXG4gICAgICAgIHRvRGF0YSwgYmJveDtcbiAgICBpZiAoIXRvLm5vZGUoKSkge1xuICAgICAgdGhyb3cgJ3RhcmdldCBub2RlIG11c3QgZXhpc3QnO1xuICAgIH1cbiAgICB0b0RhdGEgPSB0by5kYXR1bSgpO1xuICAgIHJldHVybiB7XG4gICAgICB4OiBnZXRZKHRvRGF0YSkgKyAxMCwvLyArIGJib3guaGVpZ2h0IC8gMixcbiAgICAgIHk6IGdldFgodG9EYXRhKS8vICsgYmJveC53aWR0aCAvIDJcbiAgICB9O1xuICB9KVxuICAucHJvamVjdGlvbihmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIFtkLnksIGQueF07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIG1vdXNlRXZlbnQodHlwZSkge1xuICAgIHZhciBvdmVyID0gdHlwZSA9PT0gJ292ZXInO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgIC5jbGFzc2VkKCdzZWxlY3RlZCcsIG92ZXIpO1xuICAgIH07XG4gIH1cblxuICB0aGlzLnJvb3Quc2VsZWN0QWxsKCcubGluaycpXG4gICAgICAuZGF0YShlZGdlcylcbiAgICAuZW50ZXIoKVxuICAgICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHByZWZpeCgndG8nLCBlc2NhcGVDbHMoZC50bykpLFxuICAgICAgICAgIHByZWZpeCgnZnJvbScsIGVzY2FwZUNscyhkLmZyb20pKSxcbiAgICAgICAgICBwcmVmaXgoJ2xpbmsnKVxuICAgICAgICBdLmpvaW4oJyAnKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignc3Ryb2tlJywgJ2xpZ2h0Z3JheScpXG4gICAgICAuYXR0cignc3Ryb2tlLW9wYWNpdHknLCAwLjMpXG4gICAgICAuYXR0cignZCcsIGRpYWdvbmFsKVxuICAgICAgLm9uKCdtb3VzZW92ZXInLCBtb3VzZUV2ZW50KCdvdmVyJykpXG4gICAgICAub24oJ21vdXNlb3V0JywgbW91c2VFdmVudCgnb3V0JykpO1xufTtcblxuQ2FudmFzLnByb3RvdHlwZS5vcGFjaXR5VG9nZ2xlID0gZnVuY3Rpb24oZGVjcmVhc2UpIHtcbiAgdGhpcy5yb290XG4gICAgLmNsYXNzZWQocHJlZml4KCdub2Rlcy1mb2N1c2VkJyksIGRlY3JlYXNlKTtcbn07XG5cbkNhbnZhcy5wcm90b3R5cGUucmVuZGVyTm9kZXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGVzID0gdGhpcy5ub2RlcztcblxuICB2YXIgbm9kZUN0b3IgPSBwb2pvVml6Tm9kZSh0aGlzKTtcbiAgbm9kZUN0b3IubWFyZ2luKHtcbiAgICB0b3A6IDEwLFxuICAgIGxlZnQ6IDEwLFxuICAgIHJpZ2h0OiAxMCxcbiAgICBib3R0b206IDEwXG4gIH0pO1xuICB2YXIgbm9kZUdyb3VwID0gdGhpcy5yb290LnNlbGVjdEFsbChwcmVmaXgoJ25vZGUnKSlcbiAgICAuZGF0YShub2RlcylcbiAgICAuY2FsbChub2RlQ3Rvcik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbnZhczsiLCJ2YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpLFxuICBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICB1dGlscyA9IHJlcXVpcmUoJy4uLy4uL3JlbmRlcmVyL3V0aWxzJyksXG4gIHBvam9WaXpQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcbiAgaGFzaEtleSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaGFzaEtleScpO1xuXG52YXIgcHJlZml4ID0gdXRpbHMucHJlZml4ZXI7XG52YXIgbWFyZ2luID0geyB0b3A6IDAsIHJpZ2h0OiAwLCBsZWZ0OiAwLCBib3R0b206IDAgfTtcblxuZnVuY3Rpb24gTm9kZShwYXJlbnQpIHtcbiAgdmFyIHJvb3QgPSBkMy5zZWxlY3QocGFyZW50LnJvb3QpLm5vZGUoKTtcbiAgZnVuY3Rpb24gbXkoc2VsZWN0aW9uKSB7XG4gICAgLy8gY3JlYXRlXG4gICAgdmFyIGVudGVyID0gc2VsZWN0aW9uLmVudGVyKCk7XG5cbiAgICBmdW5jdGlvbiBncm91cE1vdXNlQmVoYXZpb3IodHlwZSkge1xuICAgICAgdmFyIG92ZXIgPSB0eXBlID09PSAnb3Zlcic7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgdmFyIGhrID0gZC5oYXNoS2V5O1xuXG4gICAgICAgIC8vIGhpZGUgYWxsXG4gICAgICAgIHBhcmVudC5vcGFjaXR5VG9nZ2xlKG92ZXIpO1xuXG4gICAgICAgIC8vIHNlbGVjdCBsaW5rc1xuICAgICAgICByb290XG4gICAgICAgICAgLnNlbGVjdEFsbCgnLicgKyBwcmVmaXgoJ3RvJywgaGspKVxuICAgICAgICAgIC5jbGFzc2VkKCdzZWxlY3RlZCBwcmVkZWNlc3NvcicsIG92ZXIpO1xuICAgICAgICByb290XG4gICAgICAgICAgLnNlbGVjdEFsbCgnLicgKyBwcmVmaXgoJ2Zyb20nLCBoaykpXG4gICAgICAgICAgLmNsYXNzZWQoJ3NlbGVjdGVkIHN1Y2Nlc3NvcicsIG92ZXIpO1xuXG4gICAgICAgIC8vIHNlbGVjdCBjdXJyZW50IG5vZGVcbiAgICAgICAgcm9vdFxuICAgICAgICAgIC5zZWxlY3QoJy4nICsgcHJlZml4KGhrKSlcbiAgICAgICAgICAuY2xhc3NlZCgnc2VsZWN0ZWQgY3VycmVudCcsIG92ZXIpO1xuXG4gICAgICAgIC8vIHNlbGVjdCBwcmVkZWNlc3NvciBub2Rlc1xuICAgICAgICBkLnByZWRlY2Vzc29yc1xuICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICByb290XG4gICAgICAgICAgICAgIC5zZWxlY3RBbGwoJy4nICsgcHJlZml4KHYpKVxuICAgICAgICAgICAgICAuY2xhc3NlZCgnc2VsZWN0ZWQgcHJlZGVjZXNzb3InLCBvdmVyKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBzZWxlY3Qgc3VjY2Vzc29yIG5vZGVzXG4gICAgICAgIGQuc3VjY2Vzc29yc1xuICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICByb290XG4gICAgICAgICAgICAgIC5zZWxlY3RBbGwoJy4nICsgcHJlZml4KHYpKVxuICAgICAgICAgICAgICAuY2xhc3NlZCgnc2VsZWN0ZWQgc3VjY2Vzc29yJywgb3Zlcik7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHZhciBub2RlRW50ZXIgPSBlbnRlclxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAvLyBzdHJpbmcsbnVtYmVyLGJvb2xlYW4udW5kZWZpbmVkLG9iamVjdCxmdW5jdGlvblxuICAgICAgICAvL3ZhciB0eXBlID0gZC5sYWJlbDtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICBwcmVmaXgoJ25vZGUnKSxcbiAgICAgICAgICBwcmVmaXgoZC5oYXNoS2V5KVxuICAgICAgICBdLmpvaW4oJyAnKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLnRyYW5zbGF0ZShcbiAgICAgICAgICBkLnggLSBkLndpZHRoIC8gMixcbiAgICAgICAgICBkLnkgLSBkLmhlaWdodCAvIDJcbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlb3ZlcicsIGdyb3VwTW91c2VCZWhhdmlvcignb3ZlcicpKVxuICAgICAgLm9uKCdtb3VzZW91dCcsIGdyb3VwTW91c2VCZWhhdmlvcignb3V0JykpO1xuXG4gICAgbm9kZUVudGVyXG4gICAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAgIC5hdHRyKCdyeCcsIDUpXG4gICAgICAuYXR0cigncnknLCA1KVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ25vZGUtYmFja2dyb3VuZCcpO1xuXG4gICAgbm9kZUVudGVyXG4gICAgICAvLyAuYXBwZW5kKCdnJylcbiAgICAgIC5hcHBlbmQoJ3RleHQnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBwcmVmaXgoJ3RpdGxlJykpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDIwLCAyNSknKVxuICAgICAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgIHJldHVybiBkLmxhYmVsO1xuICAgICAgICB9KTtcblxuICAgIC8vIG5vZGVFbnRlclxuICAgIC8vICAgLmFwcGVuZCgndGV4dCcpXG4gICAgLy8gICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpXG4gICAgLy8gICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLmxhYmVsOyB9KTtcblxuICAgIHZhciBib2R5RW50ZXIgPSBub2RlRW50ZXJcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBwcmVmaXgoJ2JvZHknKSk7XG5cbiAgICB2YXIgcHJvcGVydHlDdG9yID0gcG9qb1ZpelByb3BlcnR5KCk7XG4gICAgcHJvcGVydHlDdG9yLm1hcmdpbihtYXJnaW4pO1xuICAgIGJvZHlFbnRlci5zZWxlY3RBbGwoJ2cuJyArIHByZWZpeCgncHJvcGVydHknKSlcbiAgICAgIC5kYXRhKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGQucHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgcC5sYWJlbCA9IGQubGFiZWw7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZC5wcm9wZXJ0aWVzO1xuICAgICAgfSlcbiAgICAgIC5jYWxsKHByb3BlcnR5Q3Rvcik7XG5cbiAgICAvLyBmaXggbm9kZSBiYWNrZ3JvdW5kIHdpZHRoL2hlaWdodFxuICAgIHNlbGVjdGlvbi5lYWNoKGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICB2YXIgZWwgPSBkMy5zZWxlY3QodGhpcyksXG4gICAgICAgICAgcmVjdCA9IGVsLnNlbGVjdCgncmVjdC5ub2RlLWJhY2tncm91bmQnKTtcblxuICAgICAgLy8gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYmJveCA9IGVsLm5vZGUoKS5nZXRCQm94KCk7XG4gICAgICByZWN0XG4gICAgICAgIC5hdHRyKCd3aWR0aCcsIGJib3gud2lkdGggKyAyMClcbiAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGJib3guaGVpZ2h0ICsgMjApO1xuICAgICAgLy8gfSwgMCk7XG4gICAgfSk7XG4gIH1cbiAgbXkubWFyZ2luID0gZnVuY3Rpb24gKG0pIHtcbiAgICBpZiAoIW0pIHtcbiAgICAgIHJldHVybiBtYXJnaW47XG4gICAgfVxuICAgIG1hcmdpbiA9IF8ubWVyZ2UobWFyZ2luLCBtKTtcbiAgfTtcbiAgcmV0dXJuIG15O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE5vZGU7IiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgdXRpbHMgPSByZXF1aXJlKCcuLi8uLi9yZW5kZXJlci91dGlscycpO1xudmFyIGhhc2hLZXkgPSByZXF1aXJlKCcuLi8uLi91dGlsL2hhc2hLZXknKTtcbnZhciBwcmVmaXggPSB1dGlscy5wcmVmaXhlcjtcbnZhciBoYXNoQ29kZSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvJykuaGFzaENvZGU7XG5cbmZ1bmN0aW9uIFByb3BlcnR5KCkge1xuICB2YXIgbWFyZ2luID0ge1xuICAgIHRvcDogMCxcbiAgICByaWdodDogMCxcbiAgICBib3R0b206IDAsXG4gICAgbGVmdDogMFxuICB9O1xuXG4gIHZhciB0aXRsZUhlaWdodCA9IDQwO1xuXG4gIGZ1bmN0aW9uIG15KHNlbGVjdGlvbikge1xuXG4gICAgZnVuY3Rpb24gcHJvcGVydHlZKGQsIGkpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIG1hcmdpbi5sZWZ0ICsgMTAsXG4gICAgICAgIG1hcmdpbi50b3AgKyB0aXRsZUhlaWdodCArIGkgKiAxNVxuICAgICAgXTtcbiAgICB9XG5cbiAgICAvLyBQUk9QRVJUWSBDUkVBVEVcbiAgICBmdW5jdGlvbiBtb3VzZUV2ZW50KHR5cGUpIHtcbiAgICAgIHZhciBvdmVyID0gdHlwZSA9PT0gJ292ZXInO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgIC5kdXJhdGlvbigzMDApXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXR1cm4gdXRpbHMudHJhbnNmb3JtKHtcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGU6IHByb3BlcnR5WShkLCBpKSxcbiAgICAgICAgICAgICAgICBzY2FsZTogW292ZXIgPyAxLjUgOiAxXVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XG4gICAgdmFyIHByb3BlcnR5RW50ZXIgPSBzZWxlY3Rpb24uZW50ZXIoKVxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHByZWZpeCgncHJvcGVydHknKSxcbiAgICAgICAgICAvLyBlLmcuIG9iamVjdC0xLWxlbmd0aFxuICAgICAgICAgIHByZWZpeChkLnBhcmVudCwgaGFzaENvZGUoZC5wcm9wZXJ0eSkpXG4gICAgICAgIF0uam9pbignICcpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICByZXR1cm4gdXRpbHMudHJhbnNmb3JtKHtcbiAgICAgICAgICB0cmFuc2xhdGU6IHByb3BlcnR5WShkLCBpKVxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlb3ZlcicsIG1vdXNlRXZlbnQoJ292ZXInKSlcbiAgICAgIC5vbignbW91c2VvdXQnLCBtb3VzZUV2ZW50KCdvdXQnKSk7XG5cbiAgICBwcm9wZXJ0eUVudGVyXG4gICAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC5hdHRyKCdmb250LXNpemUnLCAxMClcbiAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdzdGFydCcpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHByZWZpeCgna2V5JylcbiAgICAgICAgXS5qb2luKCcgJyk7XG4gICAgICB9KVxuICAgICAgLnRleHQoZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIGQucHJvcGVydHk7XG4gICAgICB9KVxuICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIHZhciBsaW5rID0gZC5sYWJlbDtcbiAgICAgICAgdmFyIGV2ID0gbmV3IEN1c3RvbUV2ZW50KCdwcm9wZXJ0eS1jbGljaycsIHtcbiAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgIG5hbWU6IGxpbmssXG4gICAgICAgICAgICBwcm9wZXJ0eTogZC5wcm9wZXJ0eVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXYpO1xuICAgICAgfSk7XG5cbiAgICB2YXIgcmVjdFdyYXAgPSBwcm9wZXJ0eUVudGVyXG4gICAgICAuaW5zZXJ0KCdyZWN0JywgJ3RleHQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICBwcmVmaXgoZC50eXBlKSxcbiAgICAgICAgICBwcmVmaXgoJ3Byb3BlcnR5JywgJ2JhY2tncm91bmQnKVxuICAgICAgICBdLmpvaW4oJyAnKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cigncngnLCAzKVxuICAgICAgLmF0dHIoJ3J5JywgMylcbiAgICAgIC5hdHRyKCd4JywgLTIpXG4gICAgICAuYXR0cigneScsIC05KTtcblxuICAgIHNlbGVjdGlvbi5zZWxlY3RBbGwoJ3JlY3QuJyArIHByZWZpeCgncHJvcGVydHknLCAnYmFja2dyb3VuZCcpKVxuICAgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgdmFyIG1lID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICB2YXIgdGV4dCA9IGQzXG4gICAgICAgICAgICAgIC5zZWxlY3QodGhpcy5wYXJlbnROb2RlKVxuICAgICAgICAgICAgICAuc2VsZWN0KCd0ZXh0Jyk7XG4gICAgICAgICAgICByZXR1cm4gdGV4dC5wcm9wZXJ0eSgnY2xpZW50SGVpZ2h0Jyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgdmFyIHRleHQgPSBkM1xuICAgICAgICAgICAgICAuc2VsZWN0KHRoaXMucGFyZW50Tm9kZSlcbiAgICAgICAgICAgICAgLnNlbGVjdCgndGV4dCcpO1xuICAgICAgICAgICAgcmV0dXJuIHRleHQucHJvcGVydHkoJ2NsaWVudFdpZHRoJykgKyAzO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBwcm9wZXJ0eUVudGVyLmVhY2goZnVuY3Rpb24gKGQpIHtcbiAgICAgIGlmIChkLnR5cGUgPT09ICdvYmplY3QnIHx8IGQudHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgICAgIC5hdHRyKCdyJywgNClcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCBwcmVmaXgoJ2RvdC0nICsgZC50eXBlKSlcbiAgICAgICAgICAuYXR0cignY3gnLCAtMTApXG4gICAgICAgICAgLmF0dHIoJ2N5JywgLTIpXG4gICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBteS5tYXJnaW4gPSBmdW5jdGlvbiAobSkge1xuICAgIGlmICghbSkge1xuICAgICAgcmV0dXJuIG1hcmdpbjtcbiAgICB9XG4gICAgbWFyZ2luID0gXy5tZXJnZShtYXJnaW4sIG0pO1xuICB9O1xuICByZXR1cm4gbXk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvcGVydHk7IiwidmFyIENhbnZhcyA9IHJlcXVpcmUoJy4vQ2FudmFzJyksXG4gIGNhbnZhcyxcbiAgY2FudmFzRWw7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjbGVhcjogZnVuY3Rpb24gKCkge1xuICAgIGlmIChjYW52YXMpIHtcbiAgICAgIGNhbnZhcy5kZXN0cm95KCk7XG4gICAgfVxuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgY2FudmFzID0gbmV3IENhbnZhcyhkYXRhLCBjYW52YXNFbCk7XG4gICAgY2FudmFzLnJlbmRlcigpO1xuICB9LFxuICBzZXRDYW52YXNFbDogZnVuY3Rpb24gKGVsKSB7XG4gICAgY2FudmFzRWwgPSBlbDtcbiAgfVxufTtcblxuLy8gY3VzdG9tIGV2ZW50c1xuZ2xvYmFsLmRvY3VtZW50ICYmIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Byb3BlcnR5LWNsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgdmFyIGRldGFpbCA9IGUuZGV0YWlsO1xuICBnbG9iYWwucG9qb3ZpelxuICAgIC5nZXRDdXJyZW50SW5zcGVjdG9yKClcbiAgICAuc2hvd1NlYXJjaChkZXRhaWwubmFtZSwgZGV0YWlsLnByb3BlcnR5KTtcbn0pOyIsIi8qKlxuICogQ3JlYXRlZCBieSBtYXVyaWNpbyBvbiAyLzE4LzE1LlxuICovXG52YXIgZGFncmUgPSByZXF1aXJlKCdkYWdyZScpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBwb2pvdml6ID0gZ2xvYmFsLnBvam92aXo7XG52YXIgdXRpbHMgPSBwb2pvdml6LnV0aWxzO1xuXG52YXIgcmVuZGVyZXI7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcmVuZGVyZXJzOiB7fSxcblxuICAvKipcbiAgICogR2l2ZW4gYW4gaW5zcGVjdG9yIGluc3RhbmNlIGl0IGJ1aWxkIHRoZSBncmFwaCBhbmQgYWxzbyB0aGVcbiAgICogbGF5b3V0IG9mIHRoZSBub2RlcyBiZWxvbmdpbmcgdG8gaXQsIHRoZSByZXN1bHRpbmcgb2JqZWN0IGlzXG4gICAqIGFuIG9iamVjdCB3aGljaCBpcyB1c2VkIGJ5IGEgcmVuZGVyZXIgdG8gYmUgZHJhd25cbiAgICogQHBhcmFtIHtJbnNwZWN0b3J9IGluc3BlY3RvclxuICAgKi9cbiAgcHJvY2VzczogZnVuY3Rpb24gKGluc3BlY3Rvcikge1xuICAgIGlmIChpbnNwZWN0b3IucmVtb3RlKSB7XG4gICAgICByZXR1cm4gdGhpcy5kb1Byb2Nlc3MoaW5zcGVjdG9yLnN0cmluZ2lmaWVkKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZG9Qcm9jZXNzKGluc3BlY3Rvci5hbmFseXplci5zdHJpbmdpZnkoKSk7XG4gIH0sXG4gIC8qKlxuICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZXNTdHJpbmdpZmllZCBBbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXNcbiAgICogIHtcbiAgICogICAgbm9kZXM6IFt7fSwgLi5dIGVhY2ggb2JqZWN0IGlzIGdlbmVyYXRlZCBpbiBPYmplY3RBbmFseXplciNzdHJpbmdpZnksXG4gICAqICAgIGVkZ2VzOiBbe30sIC4uXSBlYWNoIG9iamVjdCBpcyBnZW5lcmF0ZWQgaW4gT2JqZWN0QW5hbHl6ZXIjc3RyaW5naWZ5XG4gICAqICB9XG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gcmV0dXJuIEFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgaW5mbzpcbiAgICogIHtcbiAgICogICAgIG5vZGVzOiBbYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBoYXZpbmcgbGFiZWwseCx5LGhlaWdodCxcbiAgICogICAgICAgICAgICB3aWR0aCxwcm9wZXJ0aWVzLHN1Y2Nlc3NvcnMscHJlZGVjZXNzb3JzXSxcbiAgICogICAgIGVkZ2VzOiBbYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBoYXZpbmcgdG8sZnJvbSxwcm9wZXJ0eV0sXG4gICAqICAgICBjZW50ZXI6IGFuIG9iamVjdCB3aXRoIHRoZSBjZW50ZXIgb2YgdGhlIGJib3ggdGhhdCBjb3ZlcnNcbiAgICogICAgICAgICAgICB0aGUgbGF5b3V0IG9mIHRoZSBncmFwaFxuICAgKiAgICAgbW46IGFuIG9iamVjdCB3aXRoIGluZm8gYWJvdXQgdGhlIG1pbmltdW0geCx5IG9mIHRoZSBiYm94XG4gICAqICAgICAgICAgICAgdGhhdCBjb3ZlcnMgdGhlIGxheW91dCBvZiB0aGUgZ3JhcGhcbiAgICogICAgIG14OiBhbiBvYmplY3Qgd2l0aCBpbmZvIGFib3V0IHRoZSBtYXhpbXVtIHgseSBvZiB0aGUgYmJveFxuICAgKiAgICAgICAgICAgIHRoYXQgY292ZXJzIHRoZSBsYXlvdXQgb2YgdGhlIGdyYXBoXG4gICAqICB9XG4gICAqL1xuICBkb1Byb2Nlc3M6IGZ1bmN0aW9uIChub2Rlc1N0cmluZ2lmaWVkKSB7XG4gICAgdmFyIGcgPSBuZXcgZGFncmUuRGlncmFwaCgpLFxuICAgICAgbm9kZSxcbiAgICAgIGxpYnJhcnlMYWJlbHMgPSBub2Rlc1N0cmluZ2lmaWVkLmxhYmVscyxcbiAgICAgIGxpYnJhcnlOb2RlcyA9IG5vZGVzU3RyaW5naWZpZWQubm9kZXMsXG4gICAgICBsaWJyYXJ5RWRnZXMgPSBub2Rlc1N0cmluZ2lmaWVkLmVkZ2VzO1xuXG4gICAgLy8gY3JlYXRlIHRoZSBncmFwaFxuICAgIC8vIGVhY2ggZWxlbWVudCBvZiB0aGUgZ3JhcGggaGFzXG4gICAgLy8gLSBsYWJlbFxuICAgIC8vIC0gd2lkdGhcbiAgICAvLyAtIGhlaWdodFxuICAgIC8vIC0gcHJvcGVydGllc1xuICAgIF8uZm9yT3duKGxpYnJhcnlOb2RlcywgZnVuY3Rpb24gKHByb3BlcnRpZXMsIGspIHtcbiAgICAgIHZhciBsYWJlbCA9IGxpYnJhcnlMYWJlbHNba11bMF0ubGFiZWw7XG4gICAgICBub2RlID0ge1xuICAgICAgICBoYXNoS2V5OiBrLFxuICAgICAgICBsYWJlbDogbGFiZWwsXG4gICAgICAgIHdpZHRoOiBsYWJlbC5sZW5ndGggKiAxMFxuICAgICAgfTtcbiAgICAgIC8vIGxpbmVzICsgaGVhZGVyICsgcGFkZGluZyBib3R0b21cbiAgICAgIG5vZGUuaGVpZ2h0ID0gcHJvcGVydGllcy5sZW5ndGggKiAxNSArIDUwO1xuICAgICAgbm9kZS5wcm9wZXJ0aWVzID0gcHJvcGVydGllcztcbiAgICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICBub2RlLndpZHRoID0gTWF0aC5tYXgobm9kZS53aWR0aCwgdi5wcm9wZXJ0eS5sZW5ndGggKiAxMCk7XG4gICAgICB9KTtcbiAgICAgIGcuYWRkTm9kZShrLCBub2RlKTtcbiAgICB9KTtcblxuICAgIC8vIGJ1aWxkIHRoZSBlZGdlcyBmcm9tIG5vZGUgdG8gbm9kZVxuICAgIF8uZm9yT3duKGxpYnJhcnlFZGdlcywgZnVuY3Rpb24gKGxpbmtzKSB7XG4gICAgICBsaW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICAgIGlmIChnLmhhc05vZGUobGluay5mcm9tKSAmJiBnLmhhc05vZGUobGluay50bykpIHtcbiAgICAgICAgICBnLmFkZEVkZ2UobnVsbCwgbGluay5mcm9tLCBsaW5rLnRvKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBnZW5lcmF0ZSB0aGUgZ3JhcGggbGF5b3V0XG4gICAgdmFyIGxheW91dCA9IGRhZ3JlLmxheW91dCgpXG4gICAgICAubm9kZVNlcCgzMClcbiAgICAgIC8vIC5yYW5rU2VwKDcwKVxuICAgICAgLy8gLnJhbmtEaXIoJ1RCJylcbiAgICAgIC5ydW4oZyk7XG5cbiAgICB2YXIgbm9kZXMgPSBbXSxcbiAgICAgIGVkZ2VzID0gW10sXG4gICAgICBjZW50ZXIgPSB7eDogMCwgeTogMH0sXG4gICAgICBtbiA9IHt4OiBJbmZpbml0eSwgeTogSW5maW5pdHl9LFxuICAgICAgbXggPSB7eDogLUluZmluaXR5LCB5OiAtSW5maW5pdHl9LFxuICAgICAgdG90YWwgPSBnLm5vZGVzKCkubGVuZ3RoO1xuXG4gICAgLy8gdXBkYXRlIHRoZSBub2RlIGluZm8gYWRkaW5nOlxuICAgIC8vIC0geCAoeC1jb29yZGluYXRlIG9mIHRoZSBjZW50ZXIgb2YgdGhlIG5vZGUpXG4gICAgLy8gLSB5ICh5LWNvb3JkaW5hdGUgb2YgdGhlIGNlbnRlciBvZiB0aGUgbm9kZSlcbiAgICAvLyAtIHByZWRlY2Vzc29ycyAoYW4gYXJyYXkgd2l0aCB0aGUgaWRlbnRpZmllcnMgb2YgdGhlIHByZWRlY2Vzc29ycyBvZiB0aGlzIG5vZGUpXG4gICAgLy8gLSBzdWNjZXNzb3JzIChhbiBhcnJheSB3aXRoIHRoZSBpZGVudGlmaWVycyBvZiB0aGUgc3VjY2Vzc29yIG9mIHRoaXMgbm9kZSlcbiAgICBsYXlvdXQuZWFjaE5vZGUoZnVuY3Rpb24gKGssIGxheW91dEluZm8pIHtcbiAgICAgIHZhciB4ID0gbGF5b3V0SW5mby54O1xuICAgICAgdmFyIHkgPSBsYXlvdXRJbmZvLnk7XG5cbiAgICAgIG5vZGUgPSBnLm5vZGUoayk7XG4gICAgICBub2RlLnggPSB4O1xuICAgICAgbm9kZS55ID0geTtcbiAgICAgIG5vZGUucHJlZGVjZXNzb3JzID0gZy5wcmVkZWNlc3NvcnMoayk7XG4gICAgICBub2RlLnN1Y2Nlc3NvcnMgPSBnLnN1Y2Nlc3NvcnMoayk7XG4gICAgICBub2Rlcy5wdXNoKG5vZGUpO1xuXG4gICAgICAvLyBjYWxjdWxhdGUgdGhlIGJib3ggb2YgdGhlIGdyYXBoIHRvIGNlbnRlciB0aGUgZ3JhcGhcbiAgICAgIHZhciBtbnggPSB4IC0gbm9kZS53aWR0aCAvIDI7XG4gICAgICB2YXIgbW55ID0geSAtIG5vZGUuaGVpZ2h0IC8gMjtcbiAgICAgIHZhciBteHggPSB4ICsgbm9kZS53aWR0aCAvIDI7XG4gICAgICB2YXIgbXh5ID0geSArIG5vZGUuaGVpZ2h0IC8gMjtcblxuICAgICAgY2VudGVyLnggKz0geDtcbiAgICAgIGNlbnRlci55ICs9IHk7XG4gICAgICBtbi54ID0gTWF0aC5taW4obW4ueCwgbW54KTtcbiAgICAgIG1uLnkgPSBNYXRoLm1pbihtbi55LCBtbnkpO1xuICAgICAgLy8gY29uc29sZS5sb2coeCwgeSwgJyBkaW0gJywgbm9kZS53aWR0aCwgbm9kZS5oZWlnaHQpO1xuICAgICAgbXgueCA9IE1hdGgubWF4KG14LngsIG14eCk7XG4gICAgICBteC55ID0gTWF0aC5tYXgobXgueSwgbXh5KTtcbiAgICB9KTtcblxuICAgIGNlbnRlci54IC89ICh0b3RhbCB8fCAxKTtcbiAgICBjZW50ZXIueSAvPSAodG90YWwgfHwgMSk7XG5cbiAgICAvLyBjcmVhdGUgdGhlIGVkZ2VzIGZyb20gcHJvcGVydHkgdG8gbm9kZVxuICAgIF8uZm9yT3duKGxpYnJhcnlFZGdlcywgZnVuY3Rpb24gKGxpbmtzKSB7XG4gICAgICBsaW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICAgIGlmIChnLmhhc05vZGUobGluay5mcm9tKSAmJiBnLmhhc05vZGUobGluay50bykpIHtcbiAgICAgICAgICBlZGdlcy5wdXNoKGxpbmspO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBlZGdlczogZWRnZXMsXG4gICAgICBub2Rlczogbm9kZXMsXG4gICAgICBjZW50ZXI6IGNlbnRlcixcbiAgICAgIG1uOiBtbixcbiAgICAgIG14OiBteFxuICAgIH07XG4gIH0sXG5cbiAgLyoqXG4gICAqIERyYXdzIHRoZSBjdXJyZW50IGluc3BlY3RvciBpbiB0aGUgY2FudmFzIHdpdGggdGhlIGZvbGxvd2luZyBzdGVwczpcbiAgICpcbiAgICogLSBjbGVhcnMgdGhlIGNhbnZhc1xuICAgKiAtIHByb2Nlc3NlcyB0aGUgZGF0YSBvZiB0aGUgY3VycmVudCBpbnNwZWN0b3JcbiAgICogLSByZW5kZXJzIHRoZSBkYXRhIHByb2R1Y2VkIGJ5IHRoZSBtZXRob2QgYWJvdmVcbiAgICogLSBub3RpZmllcyB0aGUgdXNlciBvZiBhbnkgYWN0aW9uIHBlcmZvcm1lZFxuICAgKlxuICAgKiBAcGFyYW0ge0luc3BlY3Rvcn0gW2luc3BlY3Rvcl1cbiAgICogQHBhcmFtIHtPYmplY3R9IFtyZW5kZXJlcl1cbiAgICovXG4gIHJlbmRlcjogZnVuY3Rpb24gKGluc3BlY3RvciwgcmVuZGVyZXIpIHtcbiAgICB2YXIgZGF0YTtcbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgaW5zcGVjdG9yID0gaW5zcGVjdG9yIHx8IHBvam92aXouZ2V0Q3VycmVudEluc3BlY3RvcigpO1xuICAgIHJlbmRlcmVyID0gcmVuZGVyZXIgfHwgcG9qb3Zpei5kcmF3LmdldEN1cnJlbnRSZW5kZXJlcigpO1xuXG4gICAgdXRpbHMubm90aWZpY2F0aW9uKCdwcm9jZXNzaW5nICcgKyBpbnNwZWN0b3IuZW50cnlQb2ludCk7XG5cbiAgICAvLyBwcmUgcmVuZGVyXG4gICAgcmVuZGVyZXIuY2xlYXIoKTtcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaW5zcGVjdG9yLnByZVJlbmRlcigpO1xuICAgICAgY29uc29sZS5sb2coJ3Byb2Nlc3MgJiByZW5kZXIgc3RhcnQ6ICcsIG5ldyBEYXRlKCkpO1xuICAgICAgLy8gZGF0YTpcbiAgICAgIC8vIC0gZWRnZXMgKHByb3BlcnR5IC0+IG5vZGUpXG4gICAgICAvLyAtIG5vZGVzXG4gICAgICAvLyAtIGNlbnRlclxuICAgICAgY29uc29sZS50aW1lKCdwcm9jZXNzJyk7XG4gICAgICBkYXRhID0gbWUucHJvY2VzcyhpbnNwZWN0b3IpO1xuICAgICAgY29uc29sZS50aW1lRW5kKCdwcm9jZXNzJyk7XG5cbiAgICAgIHV0aWxzLm5vdGlmaWNhdGlvbigncmVuZGVyaW5nICcgKyAoaW5zcGVjdG9yLmRpc3BsYXlOYW1lIHx8IGluc3BlY3Rvci5lbnRyeVBvaW50KSk7XG5cbiAgICAgIGNvbnNvbGUudGltZSgncmVuZGVyJyk7XG4gICAgICByZW5kZXJlci5yZW5kZXIoZGF0YSk7XG4gICAgICBjb25zb2xlLnRpbWVFbmQoJ3JlbmRlcicpO1xuXG4gICAgICB1dGlscy5ub3RpZmljYXRpb24oJ2NvbXBsZXRlIScpO1xuICAgIH0sIDApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGRzIGEgcmVuZGVyZXIgdG8gdGhlIGF2YWlsYWJsZSByZW5kZXJlcnNcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgSXQgbmVlZHMgdG8gaGF2ZSB0aGUgZm9sbG93aW5nIG1ldGhvZHM6XG4gICAqICAtIGNsZWFyXG4gICAqICAtIHJlbmRlclxuICAgKi9cbiAgYWRkUmVuZGVyZXI6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgLy8gdGhlIHJlbmRlcmVyIG11c3QgYmUgYW4gb2JqZWN0IGFuZCBoYXZlIHRoZSBmb2xsb3dpbmcgbWV0aG9kczpcbiAgICAvLyAtIHJlbmRlclxuICAgIC8vIC0gY2xlYXJcbiAgICBhc3NlcnQodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JywgJ3ZhbHVlIGlzIG5vdCBhbiBvYmplY3QnKTtcbiAgICBhc3NlcnQodmFsdWUuY2xlYXIgJiYgdmFsdWUucmVuZGVyLCAnY2xlYXIgJiByZW5kZXIgbXVzdCBiZSBkZWZpbmVkIG9uIG9iamVjdCcpO1xuICAgIHRoaXMucmVuZGVyZXJzW2tleV0gPSB2YWx1ZTtcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgdGhlIGN1cnJlbnQgcmVuZGVyZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJcbiAgICovXG4gIHNldFJlbmRlcmVyOiBmdW5jdGlvbiAocikge1xuICAgIHJlbmRlcmVyID0gdGhpcy5yZW5kZXJlcnNbcl07XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgYSByZW5kZXJlciBieSBrZXlcbiAgICogQHBhcmFtIGtleVxuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIGdldFJlbmRlcmVyOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXJzW2tleV07XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgcmVuZGVyZXJcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBnZXRDdXJyZW50UmVuZGVyZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gcmVuZGVyZXI7XG4gIH1cbn07IiwiLyoqXG4gKiBAYXV0aG9yIHFpYW8gLyBodHRwczovL2dpdGh1Yi5jb20vcWlhb1xuICogQGF1dGhvciBtcmRvb2IgLyBodHRwOi8vbXJkb29iLmNvbVxuICogQGF1dGhvciBhbHRlcmVkcSAvIGh0dHA6Ly9hbHRlcmVkcXVhbGlhLmNvbS9cbiAqIEBhdXRob3IgV2VzdExhbmdsZXkgLyBodHRwOi8vZ2l0aHViLmNvbS9XZXN0TGFuZ2xleVxuICogQGF1dGhvciBlcmljaDY2NiAvIGh0dHA6Ly9lcmljaGFpbmVzLmNvbVxuICovXG4vKmdsb2JhbCBUSFJFRSwgY29uc29sZSAqL1xuXG4vLyBUaGlzIHNldCBvZiBjb250cm9scyBwZXJmb3JtcyBvcmJpdGluZywgZG9sbHlpbmcgKHpvb21pbmcpLCBhbmQgcGFubmluZy4gSXQgbWFpbnRhaW5zXG4vLyB0aGUgXCJ1cFwiIGRpcmVjdGlvbiBhcyArWSwgdW5saWtlIHRoZSBUcmFja2JhbGxDb250cm9scy4gVG91Y2ggb24gdGFibGV0IGFuZCBwaG9uZXMgaXNcbi8vIHN1cHBvcnRlZC5cbi8vXG4vLyAgICBPcmJpdCAtIGxlZnQgbW91c2UgLyB0b3VjaDogb25lIGZpbmdlciBtb3ZlXG4vLyAgICBab29tIC0gbWlkZGxlIG1vdXNlLCBvciBtb3VzZXdoZWVsIC8gdG91Y2g6IHR3byBmaW5nZXIgc3ByZWFkIG9yIHNxdWlzaFxuLy8gICAgUGFuIC0gcmlnaHQgbW91c2UsIG9yIGFycm93IGtleXMgLyB0b3VjaDogdGhyZWUgZmludGVyIHN3aXBlXG4vL1xuLy8gVGhpcyBpcyBhIGRyb3AtaW4gcmVwbGFjZW1lbnQgZm9yIChtb3N0KSBUcmFja2JhbGxDb250cm9scyB1c2VkIGluIGV4YW1wbGVzLlxuLy8gVGhhdCBpcywgaW5jbHVkZSB0aGlzIGpzIGZpbGUgYW5kIHdoZXJldmVyIHlvdSBzZWU6XG4vLyAgICAgIGNvbnRyb2xzID0gbmV3IFRIUkVFLlRyYWNrYmFsbENvbnRyb2xzKCBjYW1lcmEgKTtcbi8vICAgICAgY29udHJvbHMudGFyZ2V0LnogPSAxNTA7XG4vLyBTaW1wbGUgc3Vic3RpdHV0ZSBcIlBhbkNvbnRyb2xzXCIgYW5kIHRoZSBjb250cm9sIHNob3VsZCB3b3JrIGFzLWlzLlxuXG5USFJFRS5QYW5Db250cm9scyA9IGZ1bmN0aW9uICggb2JqZWN0LCBkb21FbGVtZW50ICkge1xuXG5cdHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuXHR0aGlzLmRvbUVsZW1lbnQgPSAoIGRvbUVsZW1lbnQgIT09IHVuZGVmaW5lZCApID8gZG9tRWxlbWVudCA6IGRvY3VtZW50O1xuXG5cdC8vIEFQSVxuXG5cdC8vIFNldCB0byBmYWxzZSB0byBkaXNhYmxlIHRoaXMgY29udHJvbFxuXHR0aGlzLmVuYWJsZWQgPSB0cnVlO1xuXG5cdC8vIFwidGFyZ2V0XCIgc2V0cyB0aGUgbG9jYXRpb24gb2YgZm9jdXMsIHdoZXJlIHRoZSBjb250cm9sIG9yYml0cyBhcm91bmRcblx0Ly8gYW5kIHdoZXJlIGl0IHBhbnMgd2l0aCByZXNwZWN0IHRvLlxuXHR0aGlzLnRhcmdldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cblx0Ly8gY2VudGVyIGlzIG9sZCwgZGVwcmVjYXRlZDsgdXNlIFwidGFyZ2V0XCIgaW5zdGVhZFxuXHR0aGlzLmNlbnRlciA9IHRoaXMudGFyZ2V0O1xuXG5cdC8vIFRoaXMgb3B0aW9uIGFjdHVhbGx5IGVuYWJsZXMgZG9sbHlpbmcgaW4gYW5kIG91dDsgbGVmdCBhcyBcInpvb21cIiBmb3Jcblx0Ly8gYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcblx0dGhpcy5ub1pvb20gPSBmYWxzZTtcblx0dGhpcy56b29tU3BlZWQgPSAxLjA7XG5cblx0Ly8gTGltaXRzIHRvIGhvdyBmYXIgeW91IGNhbiBkb2xseSBpbiBhbmQgb3V0XG5cdHRoaXMubWluRGlzdGFuY2UgPSAwO1xuXHR0aGlzLm1heERpc3RhbmNlID0gSW5maW5pdHk7XG5cblx0Ly8gU2V0IHRvIHRydWUgdG8gZGlzYWJsZSB0aGlzIGNvbnRyb2xcblx0dGhpcy5ub1JvdGF0ZSA9IGZhbHNlO1xuXHR0aGlzLnJvdGF0ZVNwZWVkID0gMS4wO1xuXG5cdC8vIFNldCB0byB0cnVlIHRvIGRpc2FibGUgdGhpcyBjb250cm9sXG5cdHRoaXMubm9QYW4gPSBmYWxzZTtcblx0dGhpcy5rZXlQYW5TcGVlZCA9IDcuMDtcdC8vIHBpeGVscyBtb3ZlZCBwZXIgYXJyb3cga2V5IHB1c2hcblxuXHQvLyBTZXQgdG8gdHJ1ZSB0byBhdXRvbWF0aWNhbGx5IHJvdGF0ZSBhcm91bmQgdGhlIHRhcmdldFxuXHR0aGlzLmF1dG9Sb3RhdGUgPSBmYWxzZTtcblx0dGhpcy5hdXRvUm90YXRlU3BlZWQgPSAyLjA7IC8vIDMwIHNlY29uZHMgcGVyIHJvdW5kIHdoZW4gZnBzIGlzIDYwXG5cblx0Ly8gSG93IGZhciB5b3UgY2FuIG9yYml0IHZlcnRpY2FsbHksIHVwcGVyIGFuZCBsb3dlciBsaW1pdHMuXG5cdC8vIFJhbmdlIGlzIDAgdG8gTWF0aC5QSSByYWRpYW5zLlxuXHR0aGlzLm1pblBvbGFyQW5nbGUgPSAwOyAvLyByYWRpYW5zXG5cdHRoaXMubWF4UG9sYXJBbmdsZSA9IE1hdGguUEk7IC8vIHJhZGlhbnNcblxuXHQvLyBTZXQgdG8gdHJ1ZSB0byBkaXNhYmxlIHVzZSBvZiB0aGUga2V5c1xuXHR0aGlzLm5vS2V5cyA9IGZhbHNlO1xuXG5cdC8vIFRoZSBmb3VyIGFycm93IGtleXNcblx0dGhpcy5rZXlzID0geyBMRUZUOiAzNywgVVA6IDM4LCBSSUdIVDogMzksIEJPVFRPTTogNDAgfTtcblxuXHQvLy8vLy8vLy8vLy9cblx0Ly8gaW50ZXJuYWxzXG5cblx0dmFyIHNjb3BlID0gdGhpcztcblxuXHR2YXIgRVBTID0gMC4wMDAwMDE7XG5cblx0dmFyIHJvdGF0ZVN0YXJ0ID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblx0dmFyIHJvdGF0ZUVuZCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciByb3RhdGVEZWx0YSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cblx0dmFyIHBhblN0YXJ0ID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblx0dmFyIHBhbkVuZCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciBwYW5EZWx0YSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciBwYW5PZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdHZhciBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdHZhciBkb2xseVN0YXJ0ID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblx0dmFyIGRvbGx5RW5kID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblx0dmFyIGRvbGx5RGVsdGEgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXG5cdHZhciBwaGlEZWx0YSA9IDA7XG5cdHZhciB0aGV0YURlbHRhID0gMDtcblx0dmFyIHNjYWxlID0gMTtcblx0dmFyIHBhbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cblx0dmFyIGxhc3RQb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cdHZhciBsYXN0UXVhdGVybmlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cblx0dmFyIFNUQVRFID0geyBOT05FIDogLTEsIFJPVEFURSA6IDAsIERPTExZIDogMSwgUEFOIDogMiwgVE9VQ0hfUk9UQVRFIDogMywgVE9VQ0hfRE9MTFkgOiA0LCBUT1VDSF9QQU4gOiA1IH07XG5cblx0dmFyIHN0YXRlID0gU1RBVEUuTk9ORTtcblxuXHQvLyBmb3IgcmVzZXRcblxuXHR0aGlzLnRhcmdldDAgPSB0aGlzLnRhcmdldC5jbG9uZSgpO1xuXHR0aGlzLnBvc2l0aW9uMCA9IHRoaXMub2JqZWN0LnBvc2l0aW9uLmNsb25lKCk7XG5cblx0Ly8gc28gY2FtZXJhLnVwIGlzIHRoZSBvcmJpdCBheGlzXG5cblx0dmFyIHF1YXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21Vbml0VmVjdG9ycyggb2JqZWN0LnVwLCBuZXcgVEhSRUUuVmVjdG9yMyggMCwgMSwgMCApICk7XG5cdHZhciBxdWF0SW52ZXJzZSA9IHF1YXQuY2xvbmUoKS5pbnZlcnNlKCk7XG5cblx0Ly8gZXZlbnRzXG5cblx0dmFyIGNoYW5nZUV2ZW50ID0geyB0eXBlOiAnY2hhbmdlJyB9O1xuXHR2YXIgc3RhcnRFdmVudCA9IHsgdHlwZTogJ3N0YXJ0J307XG5cdHZhciBlbmRFdmVudCA9IHsgdHlwZTogJ2VuZCd9O1xuXG5cdHRoaXMucm90YXRlTGVmdCA9IGZ1bmN0aW9uICggYW5nbGUgKSB7XG5cblx0XHRpZiAoIGFuZ2xlID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdGFuZ2xlID0gZ2V0QXV0b1JvdGF0aW9uQW5nbGUoKTtcblxuXHRcdH1cblxuXHRcdHRoZXRhRGVsdGEgLT0gYW5nbGU7XG5cblx0fTtcblxuXHR0aGlzLnJvdGF0ZVVwID0gZnVuY3Rpb24gKCBhbmdsZSApIHtcblxuXHRcdGlmICggYW5nbGUgPT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0YW5nbGUgPSBnZXRBdXRvUm90YXRpb25BbmdsZSgpO1xuXG5cdFx0fVxuXG5cdFx0cGhpRGVsdGEgLT0gYW5nbGU7XG5cblx0fTtcblxuXHQvLyBwYXNzIGluIGRpc3RhbmNlIGluIHdvcmxkIHNwYWNlIHRvIG1vdmUgbGVmdFxuXHR0aGlzLnBhbkxlZnQgPSBmdW5jdGlvbiAoIGRpc3RhbmNlICkge1xuXG5cdFx0dmFyIHRlID0gdGhpcy5vYmplY3QubWF0cml4LmVsZW1lbnRzO1xuXG5cdFx0Ly8gZ2V0IFggY29sdW1uIG9mIG1hdHJpeFxuXHRcdHBhbk9mZnNldC5zZXQoIHRlWyAwIF0sIHRlWyAxIF0sIHRlWyAyIF0gKTtcblx0XHRwYW5PZmZzZXQubXVsdGlwbHlTY2FsYXIoIC0gZGlzdGFuY2UgKTtcblxuXHRcdHBhbi5hZGQoIHBhbk9mZnNldCApO1xuXG5cdH07XG5cblx0Ly8gcGFzcyBpbiBkaXN0YW5jZSBpbiB3b3JsZCBzcGFjZSB0byBtb3ZlIHVwXG5cdHRoaXMucGFuVXAgPSBmdW5jdGlvbiAoIGRpc3RhbmNlICkge1xuXG5cdFx0dmFyIHRlID0gdGhpcy5vYmplY3QubWF0cml4LmVsZW1lbnRzO1xuXG5cdFx0Ly8gZ2V0IFkgY29sdW1uIG9mIG1hdHJpeFxuXHRcdHBhbk9mZnNldC5zZXQoIHRlWyA0IF0sIHRlWyA1IF0sIHRlWyA2IF0gKTtcblx0XHRwYW5PZmZzZXQubXVsdGlwbHlTY2FsYXIoIGRpc3RhbmNlICk7XG5cblx0XHRwYW4uYWRkKCBwYW5PZmZzZXQgKTtcblxuXHR9O1xuXG5cdC8vIHBhc3MgaW4geCx5IG9mIGNoYW5nZSBkZXNpcmVkIGluIHBpeGVsIHNwYWNlLFxuXHQvLyByaWdodCBhbmQgZG93biBhcmUgcG9zaXRpdmVcblx0dGhpcy5wYW4gPSBmdW5jdGlvbiAoIGRlbHRhWCwgZGVsdGFZICkge1xuXG5cdFx0dmFyIGVsZW1lbnQgPSBzY29wZS5kb21FbGVtZW50ID09PSBkb2N1bWVudCA/IHNjb3BlLmRvbUVsZW1lbnQuYm9keSA6IHNjb3BlLmRvbUVsZW1lbnQ7XG5cblx0XHRpZiAoIHNjb3BlLm9iamVjdC5mb3YgIT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0Ly8gcGVyc3BlY3RpdmVcblx0XHRcdHZhciBwb3NpdGlvbiA9IHNjb3BlLm9iamVjdC5wb3NpdGlvbjtcblx0XHRcdHZhciBvZmZzZXQgPSBwb3NpdGlvbi5jbG9uZSgpLnN1Yiggc2NvcGUudGFyZ2V0ICk7XG5cdFx0XHR2YXIgdGFyZ2V0RGlzdGFuY2UgPSBvZmZzZXQubGVuZ3RoKCk7XG5cblx0XHRcdC8vIGhhbGYgb2YgdGhlIGZvdiBpcyBjZW50ZXIgdG8gdG9wIG9mIHNjcmVlblxuXHRcdFx0dGFyZ2V0RGlzdGFuY2UgKj0gTWF0aC50YW4oICggc2NvcGUub2JqZWN0LmZvdiAvIDIgKSAqIE1hdGguUEkgLyAxODAuMCApO1xuXG5cdFx0XHQvLyB3ZSBhY3R1YWxseSBkb24ndCB1c2Ugc2NyZWVuV2lkdGgsIHNpbmNlIHBlcnNwZWN0aXZlIGNhbWVyYSBpcyBmaXhlZCB0byBzY3JlZW4gaGVpZ2h0XG5cdFx0XHRzY29wZS5wYW5MZWZ0KCAyICogZGVsdGFYICogdGFyZ2V0RGlzdGFuY2UgLyBlbGVtZW50LmNsaWVudEhlaWdodCApO1xuXHRcdFx0c2NvcGUucGFuVXAoIDIgKiBkZWx0YVkgKiB0YXJnZXREaXN0YW5jZSAvIGVsZW1lbnQuY2xpZW50SGVpZ2h0ICk7XG5cblx0XHR9IGVsc2UgaWYgKCBzY29wZS5vYmplY3QudG9wICE9PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdC8vIG9ydGhvZ3JhcGhpY1xuXHRcdFx0c2NvcGUucGFuTGVmdCggZGVsdGFYICogKHNjb3BlLm9iamVjdC5yaWdodCAtIHNjb3BlLm9iamVjdC5sZWZ0KSAvIGVsZW1lbnQuY2xpZW50V2lkdGggKTtcblx0XHRcdHNjb3BlLnBhblVwKCBkZWx0YVkgKiAoc2NvcGUub2JqZWN0LnRvcCAtIHNjb3BlLm9iamVjdC5ib3R0b20pIC8gZWxlbWVudC5jbGllbnRIZWlnaHQgKTtcblxuXHRcdH0gZWxzZSB7XG5cblx0XHRcdC8vIGNhbWVyYSBuZWl0aGVyIG9ydGhvZ3JhcGhpYyBvciBwZXJzcGVjdGl2ZVxuXHRcdFx0Y29uc29sZS53YXJuKCAnV0FSTklORzogUGFuQ29udHJvbHMuanMgZW5jb3VudGVyZWQgYW4gdW5rbm93biBjYW1lcmEgdHlwZSAtIHBhbiBkaXNhYmxlZC4nICk7XG5cblx0XHR9XG5cblx0fTtcblxuXHR0aGlzLmRvbGx5SW4gPSBmdW5jdGlvbiAoIGRvbGx5U2NhbGUgKSB7XG5cblx0XHRpZiAoIGRvbGx5U2NhbGUgPT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0ZG9sbHlTY2FsZSA9IGdldFpvb21TY2FsZSgpO1xuXG5cdFx0fVxuXG5cdFx0c2NhbGUgLz0gZG9sbHlTY2FsZTtcblxuXHR9O1xuXG5cdHRoaXMuZG9sbHlPdXQgPSBmdW5jdGlvbiAoIGRvbGx5U2NhbGUgKSB7XG5cblx0XHRpZiAoIGRvbGx5U2NhbGUgPT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0ZG9sbHlTY2FsZSA9IGdldFpvb21TY2FsZSgpO1xuXG5cdFx0fVxuXG5cdFx0c2NhbGUgKj0gZG9sbHlTY2FsZTtcblxuXHR9O1xuXG5cdHRoaXMudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHBvc2l0aW9uID0gdGhpcy5vYmplY3QucG9zaXRpb247XG5cblx0XHRvZmZzZXQuY29weSggcG9zaXRpb24gKS5zdWIoIHRoaXMudGFyZ2V0ICk7XG5cblx0XHQvLyByb3RhdGUgb2Zmc2V0IHRvIFwieS1heGlzLWlzLXVwXCIgc3BhY2Vcblx0XHRvZmZzZXQuYXBwbHlRdWF0ZXJuaW9uKCBxdWF0ICk7XG5cblx0XHQvLyBhbmdsZSBmcm9tIHotYXhpcyBhcm91bmQgeS1heGlzXG5cblx0XHR2YXIgdGhldGEgPSBNYXRoLmF0YW4yKCBvZmZzZXQueCwgb2Zmc2V0LnogKTtcblxuXHRcdC8vIGFuZ2xlIGZyb20geS1heGlzXG5cblx0XHR2YXIgcGhpID0gTWF0aC5hdGFuMiggTWF0aC5zcXJ0KCBvZmZzZXQueCAqIG9mZnNldC54ICsgb2Zmc2V0LnogKiBvZmZzZXQueiApLCBvZmZzZXQueSApO1xuXG5cdFx0aWYgKCB0aGlzLmF1dG9Sb3RhdGUgKSB7XG5cblx0XHRcdHRoaXMucm90YXRlTGVmdCggZ2V0QXV0b1JvdGF0aW9uQW5nbGUoKSApO1xuXG5cdFx0fVxuXG5cdFx0dGhldGEgKz0gdGhldGFEZWx0YTtcblx0XHRwaGkgKz0gcGhpRGVsdGE7XG5cblx0XHQvLyByZXN0cmljdCBwaGkgdG8gYmUgYmV0d2VlbiBkZXNpcmVkIGxpbWl0c1xuXHRcdHBoaSA9IE1hdGgubWF4KCB0aGlzLm1pblBvbGFyQW5nbGUsIE1hdGgubWluKCB0aGlzLm1heFBvbGFyQW5nbGUsIHBoaSApICk7XG5cblx0XHQvLyByZXN0cmljdCBwaGkgdG8gYmUgYmV0d2VlIEVQUyBhbmQgUEktRVBTXG5cdFx0cGhpID0gTWF0aC5tYXgoIEVQUywgTWF0aC5taW4oIE1hdGguUEkgLSBFUFMsIHBoaSApICk7XG5cblx0XHR2YXIgcmFkaXVzID0gb2Zmc2V0Lmxlbmd0aCgpICogc2NhbGU7XG5cblx0XHQvLyByZXN0cmljdCByYWRpdXMgdG8gYmUgYmV0d2VlbiBkZXNpcmVkIGxpbWl0c1xuXHRcdHJhZGl1cyA9IE1hdGgubWF4KCB0aGlzLm1pbkRpc3RhbmNlLCBNYXRoLm1pbiggdGhpcy5tYXhEaXN0YW5jZSwgcmFkaXVzICkgKTtcblxuXHRcdC8vIG1vdmUgdGFyZ2V0IHRvIHBhbm5lZCBsb2NhdGlvblxuXHRcdHRoaXMudGFyZ2V0LmFkZCggcGFuICk7XG5cblx0XHRvZmZzZXQueCA9IHJhZGl1cyAqIE1hdGguc2luKCBwaGkgKSAqIE1hdGguc2luKCB0aGV0YSApO1xuXHRcdG9mZnNldC55ID0gcmFkaXVzICogTWF0aC5jb3MoIHBoaSApO1xuXHRcdG9mZnNldC56ID0gcmFkaXVzICogTWF0aC5zaW4oIHBoaSApICogTWF0aC5jb3MoIHRoZXRhICk7XG5cblx0XHQvLyByb3RhdGUgb2Zmc2V0IGJhY2sgdG8gXCJjYW1lcmEtdXAtdmVjdG9yLWlzLXVwXCIgc3BhY2Vcblx0XHRvZmZzZXQuYXBwbHlRdWF0ZXJuaW9uKCBxdWF0SW52ZXJzZSApO1xuXG5cdFx0cG9zaXRpb24uY29weSggdGhpcy50YXJnZXQgKS5hZGQoIG9mZnNldCApO1xuXG5cdFx0dGhpcy5vYmplY3QubG9va0F0KCB0aGlzLnRhcmdldCApO1xuXG5cdFx0dGhldGFEZWx0YSA9IDA7XG5cdFx0cGhpRGVsdGEgPSAwO1xuXHRcdHNjYWxlID0gMTtcblx0XHRwYW4uc2V0KCAwLCAwLCAwICk7XG5cblx0XHQvLyB1cGRhdGUgY29uZGl0aW9uIGlzOlxuXHRcdC8vIG1pbihjYW1lcmEgZGlzcGxhY2VtZW50LCBjYW1lcmEgcm90YXRpb24gaW4gcmFkaWFucyleMiA+IEVQU1xuXHRcdC8vIHVzaW5nIHNtYWxsLWFuZ2xlIGFwcHJveGltYXRpb24gY29zKHgvMikgPSAxIC0geF4yIC8gOFxuXG5cdFx0aWYgKCBsYXN0UG9zaXRpb24uZGlzdGFuY2VUb1NxdWFyZWQoIHRoaXMub2JqZWN0LnBvc2l0aW9uICkgPiBFUFNcblx0XHQgICAgfHwgOCAqICgxIC0gbGFzdFF1YXRlcm5pb24uZG90KHRoaXMub2JqZWN0LnF1YXRlcm5pb24pKSA+IEVQUyApIHtcblxuXHRcdFx0dGhpcy5kaXNwYXRjaEV2ZW50KCBjaGFuZ2VFdmVudCApO1xuXG5cdFx0XHRsYXN0UG9zaXRpb24uY29weSggdGhpcy5vYmplY3QucG9zaXRpb24gKTtcblx0XHRcdGxhc3RRdWF0ZXJuaW9uLmNvcHkgKHRoaXMub2JqZWN0LnF1YXRlcm5pb24gKTtcblxuXHRcdH1cblxuXHR9O1xuXG5cblx0dGhpcy5yZXNldCA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdHN0YXRlID0gU1RBVEUuTk9ORTtcblxuXHRcdHRoaXMudGFyZ2V0LmNvcHkoIHRoaXMudGFyZ2V0MCApO1xuXHRcdHRoaXMub2JqZWN0LnBvc2l0aW9uLmNvcHkoIHRoaXMucG9zaXRpb24wICk7XG5cblx0XHR0aGlzLnVwZGF0ZSgpO1xuXG5cdH07XG5cblx0ZnVuY3Rpb24gZ2V0QXV0b1JvdGF0aW9uQW5nbGUoKSB7XG5cblx0XHRyZXR1cm4gMiAqIE1hdGguUEkgLyA2MCAvIDYwICogc2NvcGUuYXV0b1JvdGF0ZVNwZWVkO1xuXG5cdH1cblxuXHRmdW5jdGlvbiBnZXRab29tU2NhbGUoKSB7XG5cblx0XHRyZXR1cm4gTWF0aC5wb3coIDAuOTUsIHNjb3BlLnpvb21TcGVlZCApO1xuXG5cdH1cblxuXHRmdW5jdGlvbiBvbk1vdXNlRG93biggZXZlbnQgKSB7XG5cblx0XHRpZiAoIHNjb3BlLmVuYWJsZWQgPT09IGZhbHNlICkgcmV0dXJuO1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRpZiAoIGV2ZW50LmJ1dHRvbiA9PT0gMiApIHtcblx0XHRcdGlmICggc2NvcGUubm9Sb3RhdGUgPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRcdHN0YXRlID0gU1RBVEUuUk9UQVRFO1xuXG5cdFx0XHRyb3RhdGVTdGFydC5zZXQoIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgKTtcblxuXHRcdH0gZWxzZSBpZiAoIGV2ZW50LmJ1dHRvbiA9PT0gMSApIHtcblx0XHRcdGlmICggc2NvcGUubm9ab29tID09PSB0cnVlICkgcmV0dXJuO1xuXG5cdFx0XHRzdGF0ZSA9IFNUQVRFLkRPTExZO1xuXG5cdFx0XHRkb2xseVN0YXJ0LnNldCggZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSApO1xuXG5cdFx0fSBlbHNlIGlmICggZXZlbnQuYnV0dG9uID09PSAwICkge1xuXHRcdFx0aWYgKCBzY29wZS5ub1BhbiA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdFx0c3RhdGUgPSBTVEFURS5QQU47XG5cblx0XHRcdHBhblN0YXJ0LnNldCggZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSApO1xuXG5cdFx0fVxuXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlLCBmYWxzZSApO1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZXVwJywgb25Nb3VzZVVwLCBmYWxzZSApO1xuXHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIHN0YXJ0RXZlbnQgKTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gb25Nb3VzZU1vdmUoIGV2ZW50ICkge1xuXG5cdFx0aWYgKCBzY29wZS5lbmFibGVkID09PSBmYWxzZSApIHJldHVybjtcblxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHR2YXIgZWxlbWVudCA9IHNjb3BlLmRvbUVsZW1lbnQgPT09IGRvY3VtZW50ID8gc2NvcGUuZG9tRWxlbWVudC5ib2R5IDogc2NvcGUuZG9tRWxlbWVudDtcblxuXHRcdGlmICggc3RhdGUgPT09IFNUQVRFLlJPVEFURSApIHtcblxuXHRcdFx0aWYgKCBzY29wZS5ub1JvdGF0ZSA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdFx0cm90YXRlRW5kLnNldCggZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSApO1xuXHRcdFx0cm90YXRlRGVsdGEuc3ViVmVjdG9ycyggcm90YXRlRW5kLCByb3RhdGVTdGFydCApO1xuXG5cdFx0XHQvLyByb3RhdGluZyBhY3Jvc3Mgd2hvbGUgc2NyZWVuIGdvZXMgMzYwIGRlZ3JlZXMgYXJvdW5kXG5cdFx0XHRzY29wZS5yb3RhdGVMZWZ0KCAyICogTWF0aC5QSSAqIHJvdGF0ZURlbHRhLnggLyBlbGVtZW50LmNsaWVudFdpZHRoICogc2NvcGUucm90YXRlU3BlZWQgKTtcblxuXHRcdFx0Ly8gcm90YXRpbmcgdXAgYW5kIGRvd24gYWxvbmcgd2hvbGUgc2NyZWVuIGF0dGVtcHRzIHRvIGdvIDM2MCwgYnV0IGxpbWl0ZWQgdG8gMTgwXG5cdFx0XHRzY29wZS5yb3RhdGVVcCggMiAqIE1hdGguUEkgKiByb3RhdGVEZWx0YS55IC8gZWxlbWVudC5jbGllbnRIZWlnaHQgKiBzY29wZS5yb3RhdGVTcGVlZCApO1xuXG5cdFx0XHRyb3RhdGVTdGFydC5jb3B5KCByb3RhdGVFbmQgKTtcblxuXHRcdH0gZWxzZSBpZiAoIHN0YXRlID09PSBTVEFURS5ET0xMWSApIHtcblxuXHRcdFx0aWYgKCBzY29wZS5ub1pvb20gPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRcdGRvbGx5RW5kLnNldCggZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSApO1xuXHRcdFx0ZG9sbHlEZWx0YS5zdWJWZWN0b3JzKCBkb2xseUVuZCwgZG9sbHlTdGFydCApO1xuXG5cdFx0XHRpZiAoIGRvbGx5RGVsdGEueSA+IDAgKSB7XG5cblx0XHRcdFx0c2NvcGUuZG9sbHlJbigpO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdHNjb3BlLmRvbGx5T3V0KCk7XG5cblx0XHRcdH1cblxuXHRcdFx0ZG9sbHlTdGFydC5jb3B5KCBkb2xseUVuZCApO1xuXG5cdFx0fSBlbHNlIGlmICggc3RhdGUgPT09IFNUQVRFLlBBTiApIHtcblxuXHRcdFx0aWYgKCBzY29wZS5ub1BhbiA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdFx0cGFuRW5kLnNldCggZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSApO1xuXHRcdFx0cGFuRGVsdGEuc3ViVmVjdG9ycyggcGFuRW5kLCBwYW5TdGFydCApO1xuXG5cdFx0XHRzY29wZS5wYW4oIHBhbkRlbHRhLngsIHBhbkRlbHRhLnkgKTtcblxuXHRcdFx0cGFuU3RhcnQuY29weSggcGFuRW5kICk7XG5cblx0XHR9XG5cblx0XHRzY29wZS51cGRhdGUoKTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gb25Nb3VzZVVwKCAvKiBldmVudCAqLyApIHtcblxuXHRcdGlmICggc2NvcGUuZW5hYmxlZCA9PT0gZmFsc2UgKSByZXR1cm47XG5cblx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAnbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUsIGZhbHNlICk7XG5cdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ21vdXNldXAnLCBvbk1vdXNlVXAsIGZhbHNlICk7XG5cdFx0c2NvcGUuZGlzcGF0Y2hFdmVudCggZW5kRXZlbnQgKTtcblx0XHRzdGF0ZSA9IFNUQVRFLk5PTkU7XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG9uTW91c2VXaGVlbCggZXZlbnQgKSB7XG5cblx0XHRpZiAoIHNjb3BlLmVuYWJsZWQgPT09IGZhbHNlIHx8IHNjb3BlLm5vWm9vbSA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHR2YXIgZGVsdGEgPSAwO1xuXG5cdFx0aWYgKCBldmVudC53aGVlbERlbHRhICE9PSB1bmRlZmluZWQgKSB7IC8vIFdlYktpdCAvIE9wZXJhIC8gRXhwbG9yZXIgOVxuXG5cdFx0XHRkZWx0YSA9IGV2ZW50LndoZWVsRGVsdGE7XG5cblx0XHR9IGVsc2UgaWYgKCBldmVudC5kZXRhaWwgIT09IHVuZGVmaW5lZCApIHsgLy8gRmlyZWZveFxuXG5cdFx0XHRkZWx0YSA9IC0gZXZlbnQuZGV0YWlsO1xuXG5cdFx0fVxuXG5cdFx0aWYgKCBkZWx0YSA+IDAgKSB7XG5cblx0XHRcdHNjb3BlLmRvbGx5T3V0KCk7XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHRzY29wZS5kb2xseUluKCk7XG5cblx0XHR9XG5cblx0XHRzY29wZS51cGRhdGUoKTtcblx0XHRzY29wZS5kaXNwYXRjaEV2ZW50KCBzdGFydEV2ZW50ICk7XG5cdFx0c2NvcGUuZGlzcGF0Y2hFdmVudCggZW5kRXZlbnQgKTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gb25LZXlEb3duKCBldmVudCApIHtcblxuXHRcdGlmICggc2NvcGUuZW5hYmxlZCA9PT0gZmFsc2UgfHwgc2NvcGUubm9LZXlzID09PSB0cnVlIHx8IHNjb3BlLm5vUGFuID09PSB0cnVlICkgcmV0dXJuO1xuXG5cdFx0c3dpdGNoICggZXZlbnQua2V5Q29kZSApIHtcblxuXHRcdFx0Y2FzZSBzY29wZS5rZXlzLlVQOlxuXHRcdFx0XHRzY29wZS5wYW4oIDAsIHNjb3BlLmtleVBhblNwZWVkICk7XG5cdFx0XHRcdHNjb3BlLnVwZGF0ZSgpO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBzY29wZS5rZXlzLkJPVFRPTTpcblx0XHRcdFx0c2NvcGUucGFuKCAwLCAtIHNjb3BlLmtleVBhblNwZWVkICk7XG5cdFx0XHRcdHNjb3BlLnVwZGF0ZSgpO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBzY29wZS5rZXlzLkxFRlQ6XG5cdFx0XHRcdHNjb3BlLnBhbiggc2NvcGUua2V5UGFuU3BlZWQsIDAgKTtcblx0XHRcdFx0c2NvcGUudXBkYXRlKCk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIHNjb3BlLmtleXMuUklHSFQ6XG5cdFx0XHRcdHNjb3BlLnBhbiggLSBzY29wZS5rZXlQYW5TcGVlZCwgMCApO1xuXHRcdFx0XHRzY29wZS51cGRhdGUoKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHR9XG5cblx0fVxuXG5cdGZ1bmN0aW9uIHRvdWNoc3RhcnQoIGV2ZW50ICkge1xuXG5cdFx0aWYgKCBzY29wZS5lbmFibGVkID09PSBmYWxzZSApIHJldHVybjtcblxuXHRcdHN3aXRjaCAoIGV2ZW50LnRvdWNoZXMubGVuZ3RoICkge1xuXG5cdFx0XHRjYXNlIDE6XHQvLyBvbmUtZmluZ2VyZWQgdG91Y2g6IHJvdGF0ZVxuXG5cdFx0XHRcdGlmICggc2NvcGUubm9Sb3RhdGUgPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRcdFx0c3RhdGUgPSBTVEFURS5UT1VDSF9ST1RBVEU7XG5cblx0XHRcdFx0cm90YXRlU3RhcnQuc2V0KCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWSApO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAyOlx0Ly8gdHdvLWZpbmdlcmVkIHRvdWNoOiBkb2xseVxuXG5cdFx0XHRcdGlmICggc2NvcGUubm9ab29tID09PSB0cnVlICkgcmV0dXJuO1xuXG5cdFx0XHRcdHN0YXRlID0gU1RBVEUuVE9VQ0hfRE9MTFk7XG5cblx0XHRcdFx0dmFyIGR4ID0gZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VYIC0gZXZlbnQudG91Y2hlc1sgMSBdLnBhZ2VYO1xuXHRcdFx0XHR2YXIgZHkgPSBldmVudC50b3VjaGVzWyAwIF0ucGFnZVkgLSBldmVudC50b3VjaGVzWyAxIF0ucGFnZVk7XG5cdFx0XHRcdHZhciBkaXN0YW5jZSA9IE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKTtcblx0XHRcdFx0ZG9sbHlTdGFydC5zZXQoIDAsIGRpc3RhbmNlICk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIDM6IC8vIHRocmVlLWZpbmdlcmVkIHRvdWNoOiBwYW5cblxuXHRcdFx0XHRpZiAoIHNjb3BlLm5vUGFuID09PSB0cnVlICkgcmV0dXJuO1xuXG5cdFx0XHRcdHN0YXRlID0gU1RBVEUuVE9VQ0hfUEFOO1xuXG5cdFx0XHRcdHBhblN0YXJ0LnNldCggZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VYLCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVkgKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGRlZmF1bHQ6XG5cblx0XHRcdFx0c3RhdGUgPSBTVEFURS5OT05FO1xuXG5cdFx0fVxuXG5cdFx0c2NvcGUuZGlzcGF0Y2hFdmVudCggc3RhcnRFdmVudCApO1xuXG5cdH1cblxuXHRmdW5jdGlvbiB0b3VjaG1vdmUoIGV2ZW50ICkge1xuXG5cdFx0aWYgKCBzY29wZS5lbmFibGVkID09PSBmYWxzZSApIHJldHVybjtcblxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHR2YXIgZWxlbWVudCA9IHNjb3BlLmRvbUVsZW1lbnQgPT09IGRvY3VtZW50ID8gc2NvcGUuZG9tRWxlbWVudC5ib2R5IDogc2NvcGUuZG9tRWxlbWVudDtcblxuXHRcdHN3aXRjaCAoIGV2ZW50LnRvdWNoZXMubGVuZ3RoICkge1xuXG5cdFx0XHRjYXNlIDE6IC8vIG9uZS1maW5nZXJlZCB0b3VjaDogcm90YXRlXG5cblx0XHRcdFx0aWYgKCBzY29wZS5ub1JvdGF0ZSA9PT0gdHJ1ZSApIHJldHVybjtcblx0XHRcdFx0aWYgKCBzdGF0ZSAhPT0gU1RBVEUuVE9VQ0hfUk9UQVRFICkgcmV0dXJuO1xuXG5cdFx0XHRcdHJvdGF0ZUVuZC5zZXQoIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWCwgZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VZICk7XG5cdFx0XHRcdHJvdGF0ZURlbHRhLnN1YlZlY3RvcnMoIHJvdGF0ZUVuZCwgcm90YXRlU3RhcnQgKTtcblxuXHRcdFx0XHQvLyByb3RhdGluZyBhY3Jvc3Mgd2hvbGUgc2NyZWVuIGdvZXMgMzYwIGRlZ3JlZXMgYXJvdW5kXG5cdFx0XHRcdHNjb3BlLnJvdGF0ZUxlZnQoIDIgKiBNYXRoLlBJICogcm90YXRlRGVsdGEueCAvIGVsZW1lbnQuY2xpZW50V2lkdGggKiBzY29wZS5yb3RhdGVTcGVlZCApO1xuXHRcdFx0XHQvLyByb3RhdGluZyB1cCBhbmQgZG93biBhbG9uZyB3aG9sZSBzY3JlZW4gYXR0ZW1wdHMgdG8gZ28gMzYwLCBidXQgbGltaXRlZCB0byAxODBcblx0XHRcdFx0c2NvcGUucm90YXRlVXAoIDIgKiBNYXRoLlBJICogcm90YXRlRGVsdGEueSAvIGVsZW1lbnQuY2xpZW50SGVpZ2h0ICogc2NvcGUucm90YXRlU3BlZWQgKTtcblxuXHRcdFx0XHRyb3RhdGVTdGFydC5jb3B5KCByb3RhdGVFbmQgKTtcblxuXHRcdFx0XHRzY29wZS51cGRhdGUoKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgMjogLy8gdHdvLWZpbmdlcmVkIHRvdWNoOiBkb2xseVxuXG5cdFx0XHRcdGlmICggc2NvcGUubm9ab29tID09PSB0cnVlICkgcmV0dXJuO1xuXHRcdFx0XHRpZiAoIHN0YXRlICE9PSBTVEFURS5UT1VDSF9ET0xMWSApIHJldHVybjtcblxuXHRcdFx0XHR2YXIgZHggPSBldmVudC50b3VjaGVzWyAwIF0ucGFnZVggLSBldmVudC50b3VjaGVzWyAxIF0ucGFnZVg7XG5cdFx0XHRcdHZhciBkeSA9IGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWSAtIGV2ZW50LnRvdWNoZXNbIDEgXS5wYWdlWTtcblx0XHRcdFx0dmFyIGRpc3RhbmNlID0gTWF0aC5zcXJ0KCBkeCAqIGR4ICsgZHkgKiBkeSApO1xuXG5cdFx0XHRcdGRvbGx5RW5kLnNldCggMCwgZGlzdGFuY2UgKTtcblx0XHRcdFx0ZG9sbHlEZWx0YS5zdWJWZWN0b3JzKCBkb2xseUVuZCwgZG9sbHlTdGFydCApO1xuXG5cdFx0XHRcdGlmICggZG9sbHlEZWx0YS55ID4gMCApIHtcblxuXHRcdFx0XHRcdHNjb3BlLmRvbGx5T3V0KCk7XG5cblx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdHNjb3BlLmRvbGx5SW4oKTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZG9sbHlTdGFydC5jb3B5KCBkb2xseUVuZCApO1xuXG5cdFx0XHRcdHNjb3BlLnVwZGF0ZSgpO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAzOiAvLyB0aHJlZS1maW5nZXJlZCB0b3VjaDogcGFuXG5cblx0XHRcdFx0aWYgKCBzY29wZS5ub1BhbiA9PT0gdHJ1ZSApIHJldHVybjtcblx0XHRcdFx0aWYgKCBzdGF0ZSAhPT0gU1RBVEUuVE9VQ0hfUEFOICkgcmV0dXJuO1xuXG5cdFx0XHRcdHBhbkVuZC5zZXQoIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWCwgZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VZICk7XG5cdFx0XHRcdHBhbkRlbHRhLnN1YlZlY3RvcnMoIHBhbkVuZCwgcGFuU3RhcnQgKTtcblxuXHRcdFx0XHRzY29wZS5wYW4oIHBhbkRlbHRhLngsIHBhbkRlbHRhLnkgKTtcblxuXHRcdFx0XHRwYW5TdGFydC5jb3B5KCBwYW5FbmQgKTtcblxuXHRcdFx0XHRzY29wZS51cGRhdGUoKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGRlZmF1bHQ6XG5cblx0XHRcdFx0c3RhdGUgPSBTVEFURS5OT05FO1xuXG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiB0b3VjaGVuZCggLyogZXZlbnQgKi8gKSB7XG5cblx0XHRpZiAoIHNjb3BlLmVuYWJsZWQgPT09IGZhbHNlICkgcmV0dXJuO1xuXG5cdFx0c2NvcGUuZGlzcGF0Y2hFdmVudCggZW5kRXZlbnQgKTtcblx0XHRzdGF0ZSA9IFNUQVRFLk5PTkU7XG5cblx0fVxuXG5cdHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCAnY29udGV4dG1lbnUnLCBmdW5jdGlvbiAoIGV2ZW50ICkgeyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyB9LCBmYWxzZSApO1xuXHR0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ21vdXNlZG93bicsIG9uTW91c2VEb3duLCBmYWxzZSApO1xuXHR0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ21vdXNld2hlZWwnLCBvbk1vdXNlV2hlZWwsIGZhbHNlICk7XG5cdHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCAnRE9NTW91c2VTY3JvbGwnLCBvbk1vdXNlV2hlZWwsIGZhbHNlICk7IC8vIGZpcmVmb3hcblxuXHR0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNoc3RhcnQnLCB0b3VjaHN0YXJ0LCBmYWxzZSApO1xuXHR0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNoZW5kJywgdG91Y2hlbmQsIGZhbHNlICk7XG5cdHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCAndG91Y2htb3ZlJywgdG91Y2htb3ZlLCBmYWxzZSApO1xuXG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAna2V5ZG93bicsIG9uS2V5RG93biwgZmFsc2UgKTtcblxuXHQvLyBmb3JjZSBhbiB1cGRhdGUgYXQgc3RhcnRcblx0dGhpcy51cGRhdGUoKTtcblxufTtcblxuVEhSRUUuUGFuQ29udHJvbHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVEhSRUUuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZSApO1xuIiwicmVxdWlyZSgnLi9QYW5Db250cm9scycpO1xuXG52YXIgdDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy50MyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwudDMgOiBudWxsKSxcbiAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpLFxuICBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlRIUkVFIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5USFJFRSA6IG51bGwpLFxuICBlbCxcbiAgaW5zdGFuY2U7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjbGVhcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbCk7XG4gICAgd2hpbGUocm9vdC5maXJzdENoaWxkKSB7XG4gICAgICByb290LnJlbW92ZUNoaWxkKHJvb3QuZmlyc3RDaGlsZCk7XG4gICAgfVxuICAgIGlmIChpbnN0YW5jZSkge1xuICAgICAgaW5zdGFuY2UubG9vcE1hbmFnZXIuc3RvcCgpO1xuICAgIH1cbiAgfSxcbiAgc2V0Q2FudmFzRWw6IGZ1bmN0aW9uIChuZXdFbCkge1xuICAgIGVsID0gbmV3RWw7XG4gIH0sXG4gIHJlbmRlcjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB2YXIgcm9vdEVsO1xuICAgIHZhciBub2RlcyA9IGRhdGEubm9kZXMsXG4gICAgICBlZGdlcyA9IGRhdGEuZWRnZXMsXG4gICAgICBub2RlTWFwID0ge30sXG4gICAgICBtYXJnaW4gPSB7XG4gICAgICAgIHRvcDogMTAsXG4gICAgICAgIGxlZnQ6IDEwXG4gICAgICB9LFxuICAgICAgZmlsbFN0eWxlID0ge1xuICAgICAgICBudW1iZXI6ICcjNjczYWI3JyxcbiAgICAgICAgJ3N0cmluZyc6ICcjZmY5ODAwJyxcbiAgICAgICAgJ2Jvb2xlYW4nOiAnIzI1OWIyNCcsXG4gICAgICAgICd1bmRlZmluZWQnOiAnIzAwMDAwMCdcbiAgICAgIH0sXG4gICAgICBib3JkZXJTdHlsZSA9IHtcbiAgICAgICAgb2JqZWN0OiAnIzAzYTlmNCcsXG4gICAgICAgICdmdW5jdGlvbic6ICcjZTUxYzIzJ1xuICAgICAgfSxcbiAgICAgIGRlZmF1bHRDb2xvciA9ICcjMDAwMDAwJyxcbiAgICAgIHRpdGxlSGVpZ2h0ID0gNDAsXG4gICAgICBwcm9qZWN0b3IgPSBuZXcgVEhSRUUuUHJvamVjdG9yKCksXG4gICAgICBub2RlTWVzaGVzID0gW107XG5cbiAgICAvLyB0aGUgYWN0dWFsIHJvb3QgZWxlbWVudCBpcyBhIGRpdiBjcmVhdGVkIHVuZGVyIHRoZSByb290XG4gICAgcm9vdEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgcm9vdEVsLmlkID0gJ3Jvb3QnO1xuICAgIHJvb3RFbC5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbCkuYXBwZW5kQ2hpbGQocm9vdEVsKTtcblxuICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgIG5vZGVNYXBbbm9kZS5oYXNoS2V5XSA9IG5vZGU7XG4gICAgfSk7XG5cbiAgICB2YXIgd3JhcHBlckVsID0gcm9vdEVsO1xuICAgIHZhciBiYm94ID0gcm9vdEVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgZnVuY3Rpb24gZ2V0WShub2RlLCBpKSB7XG4gICAgICByZXR1cm4gbm9kZS55IC0gbm9kZS5oZWlnaHQgKiAwLjUgK1xuICAgICAgICAobm9kZS5wcm9wZXJ0aWVzLmxlbmd0aCAtIGkpICogMTU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0WChub2RlKSB7XG4gICAgICByZXR1cm4gbm9kZS54IC0gbm9kZS53aWR0aCAqIDAuNSArIG1hcmdpbi5sZWZ0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNhbWVyYUNvbnRyb2xzKGNhbWVyYSwgZG9tRWxlbWVudCkge1xuICAgICAgY2FtZXJhLmNhbWVyYUNvbnRyb2xzID0gbmV3IFRIUkVFLlBhbkNvbnRyb2xzKGNhbWVyYSwgZG9tRWxlbWVudCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlVGV4dFNwcml0ZXMoKSB7XG4gICAgICB2YXIgc2hhcGVzID0gVEhSRUUuRm9udFV0aWxzLmdlbmVyYXRlU2hhcGVzKFwiSGVsbG8gd29ybGRcIiwge1xuICAgICAgICBmb250OiBcImhlbHZldGlrZXJcIixcbiAgICAgICAgd2VpZ2h0OiBcImJvbGRcIixcbiAgICAgICAgc2l6ZTogMTBcbiAgICAgIH0pO1xuICAgICAgdmFyIGdlb20gPSBuZXcgVEhSRUUuU2hhcGVHZW9tZXRyeShzaGFwZXMpO1xuICAgICAgdmFyIG1hdCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCgpO1xuICAgICAgcmV0dXJuIG5ldyBUSFJFRS5NZXNoKGdlb20sIG1hdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHJhd1Byb3BlcnRpZXMobm9kZSwgZ3JvdXApIHtcbiAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgIGNhbnZhcy53aWR0aCA9IG5vZGUud2lkdGg7XG4gICAgICBjYW52YXMuaGVpZ2h0ID0gbm9kZS5oZWlnaHQ7XG4gICAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgY29udGV4dC5mb250ID0gXCJub3JtYWwgMTAwIDE4cHggUm9ib3RvXCI7XG4gICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IFwicmdiYSgwLCAwLCAwLCAxKVwiO1xuICAgICAgY29udGV4dC5maWxsVGV4dChcbiAgICAgICAgbm9kZS5sYWJlbCxcbiAgICAgICAgbWFyZ2luLmxlZnQsXG4gICAgICAgIG1hcmdpbi50b3AgKyAxNVxuICAgICAgKTtcblxuICAgICAgbm9kZS5wcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24gKHByb3BlcnR5LCBpKSB7XG4gICAgICAgIHZhciBzcGhlcmU7XG5cbiAgICAgICAgLy8gZHJhdyB0ZXh0IG9uIHRoZSBjYW52YXNcbiAgICAgICAgY29udGV4dC5mb250ID0gXCJub3JtYWwgMTVweCBBcmlhbFwiO1xuICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGZpbGxTdHlsZVtwcm9wZXJ0eS50eXBlXSB8fCBkZWZhdWx0Q29sb3I7XG4gICAgICAgIGNvbnRleHQuZmlsbFRleHQoXG4gICAgICAgICAgcHJvcGVydHkucHJvcGVydHksXG4gICAgICAgICAgbWFyZ2luLmxlZnQgKiAyLFxuICAgICAgICAgIG1hcmdpbi50b3AgKyB0aXRsZUhlaWdodCArIGkgKiAxNVxuICAgICAgICApO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciB0ZXh0dXJlID0gbmV3IFRIUkVFLlRleHR1cmUoY2FudmFzKTtcbiAgICAgIHRleHR1cmUubmVlZHNVcGRhdGUgPSB0cnVlO1xuXG4gICAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICBtYXA6IHRleHR1cmUsXG4gICAgICAgIHNpZGU6VEhSRUUuRG91YmxlU2lkZVxuICAgICAgfSk7XG4gICAgICBtYXRlcmlhbC50cmFuc3BhcmVudCA9IHRydWU7XG4gICAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKFxuICAgICAgICAgIG5ldyBUSFJFRS5QbGFuZUdlb21ldHJ5KGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCksXG4gICAgICAgICAgbWF0ZXJpYWxcbiAgICAgICk7XG4gICAgICAvLyBtZXNoLnBvc2l0aW9uLnggKz0gbm9kZS53aWR0aCAvIDI7XG4gICAgICAvLyBtZXNoLnBvc2l0aW9uLnkgKz0gbm9kZS5oZWlnaHQgLyAyO1xuXG4gICAgICBtZXNoLnBvc2l0aW9uLnNldChcbiAgICAgICAgbm9kZS54LFxuICAgICAgICBub2RlLnksXG4gICAgICAgIDAuMVxuICAgICAgKTtcblxuICAgICAgZ3JvdXAuYWRkKG1lc2gpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRyYXdOb2RlcygpIHtcbiAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgIG5vZGVHcm91cCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHZhciBwb2ludHMgPSBbXSxcbiAgICAgICAgIGcgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICAgICAgcG9pbnRzLnB1c2gobmV3IFRIUkVFLlZlY3RvcjIoMCwgMCkpO1xuICAgICAgICBwb2ludHMucHVzaChuZXcgVEhSRUUuVmVjdG9yMihub2RlLndpZHRoLCAwKSk7XG4gICAgICAgIHBvaW50cy5wdXNoKG5ldyBUSFJFRS5WZWN0b3IyKG5vZGUud2lkdGgsIG5vZGUuaGVpZ2h0KSk7XG4gICAgICAgIHBvaW50cy5wdXNoKG5ldyBUSFJFRS5WZWN0b3IyKDAsIG5vZGUuaGVpZ2h0KSk7XG5cbiAgICAgICAgdmFyIHNoYXBlID0gbmV3IFRIUkVFLlNoYXBlKHBvaW50cyk7XG5cbiAgICAgICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLlNoYXBlR2VvbWV0cnkoc2hhcGUpO1xuICAgICAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKFxuICAgICAgICAgIGdlb21ldHJ5LFxuICAgICAgICAgIG5ldyBUSFJFRS5MaW5lQmFzaWNNYXRlcmlhbCh7XG4gICAgICAgICAgICBjb2xvcjogJyNlZWVlZWUnLC8vIGJvcmRlclN0eWxlWydmdW5jdGlvbiddLFxuICAgICAgICAgICAgbGluZVdpZHRoOiAxXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBtZXNoLnVzZXJEYXRhLm5vZGUgPSBub2RlO1xuICAgICAgICBtZXNoLnBvc2l0aW9uLnNldChcbiAgICAgICAgICBub2RlLnggLSBub2RlLndpZHRoICogMC41LFxuICAgICAgICAgIG5vZGUueSAtIG5vZGUuaGVpZ2h0ICogMC41LFxuICAgICAgICAgIDBcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBFQUNIIE9ORSBJUyBBIFNJTkdMRSBNRVNIXG4gICAgICAgIG1lLmFjdGl2ZVNjZW5lLmFkZChtZXNoKTtcbiAgICAgICAgbm9kZU1lc2hlcy5wdXNoKG1lc2gpO1xuXG4gICAgICAgIC8vIE1FUkdFXG4gICAgICAgIC8vIG1lc2gudXBkYXRlTWF0cml4KCk7XG4gICAgICAgIC8vIG5vZGVHZW9tZXRyeS5tZXJnZShtZXNoLmdlb21ldHJ5LCBtZXNoLm1hdHJpeCk7XG5cbiAgICAgICAgLy8gYWRkIHRoZSBkZXNjcmlwdGlvbiBpbiBhbm90aGVyIGdyb3VwXG4gICAgICAgIGRyYXdQcm9wZXJ0aWVzKG5vZGUsIG5vZGVHcm91cCk7XG4gICAgICB9KTtcblxuICAgICAgbWUuYWN0aXZlU2NlbmUuYWRkKG5vZGVHcm91cCk7XG5cbiAgICAgIC8vIE1FUkdFXG4gICAgICAvLyBtZS5hY3RpdmVTY2VuZS5hZGQobmV3IFRIUkVFLk1lc2goXG4gICAgICAvLyAgIG5vZGVHZW9tZXRyeSxcbiAgICAgIC8vICAgbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsKHtcbiAgICAgIC8vICAgICBjb2xvcjogJyNlZWVlZWUnLC8vIGJvcmRlclN0eWxlWydmdW5jdGlvbiddLFxuICAgICAgLy8gICAgIGxpbmVXaWR0aDogMVxuICAgICAgLy8gICB9KVxuICAgICAgLy8gKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHJhd0NpcmNsZXMoKSB7XG4gICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICBjaXJjbGVNZXNoID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLkNpcmNsZUdlb21ldHJ5KDUsIDgpKSxcbiAgICAgICAgbWVzaGVzID0ge1xuICAgICAgICAgIG9iamVjdDoge1xuICAgICAgICAgICAgbWF0ZXJpYWw6IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICAgICAgICAgIGNvbG9yOiBib3JkZXJTdHlsZS5vYmplY3RcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgZ2VvbWV0cnk6IG5ldyBUSFJFRS5HZW9tZXRyeSgpXG4gICAgICAgICAgfSxcbiAgICAgICAgICAnZnVuY3Rpb24nOiB7XG4gICAgICAgICAgICBtYXRlcmlhbDogbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgICAgICAgY29sb3I6IGJvcmRlclN0eWxlWydmdW5jdGlvbiddXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGdlb21ldHJ5OiBuZXcgVEhSRUUuR2VvbWV0cnkoKVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgbm9kZS5wcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24gKHByb3BlcnR5LCBpKSB7XG4gICAgICAgICAgaWYgKHByb3BlcnR5LnR5cGUgPT09ICdmdW5jdGlvbicgfHwgcHJvcGVydHkudHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNpcmNsZU1lc2gucG9zaXRpb24uc2V0KFxuICAgICAgICAgICAgICBnZXRYKG5vZGUpLCBnZXRZKG5vZGUsIGkpICsgNSwgMC4yXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY2lyY2xlTWVzaC51cGRhdGVNYXRyaXgoKTtcbiAgICAgICAgICAgIG1lc2hlc1twcm9wZXJ0eS50eXBlXS5nZW9tZXRyeVxuICAgICAgICAgICAgICAubWVyZ2UoY2lyY2xlTWVzaC5nZW9tZXRyeSwgY2lyY2xlTWVzaC5tYXRyaXgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIG1lLmFjdGl2ZVNjZW5lLmFkZChuZXcgVEhSRUUuTWVzaChcbiAgICAgICAgbWVzaGVzLm9iamVjdC5nZW9tZXRyeSwgbWVzaGVzLm9iamVjdC5tYXRlcmlhbFxuICAgICAgKSk7XG4gICAgICBtZS5hY3RpdmVTY2VuZS5hZGQobmV3IFRIUkVFLk1lc2goXG4gICAgICAgIG1lc2hlc1snZnVuY3Rpb24nXS5nZW9tZXRyeSwgbWVzaGVzWydmdW5jdGlvbiddLm1hdGVyaWFsXG4gICAgICApKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZVNwbGluZShmLCBtaWQsIHQsIGQpIHtcbiAgICAgIHZhciBtdWx0ID0gMCxcbiAgICAgICAgYnVtcFogPSBtaWQueiAqIDAuMixcbiAgICAgICAgZm0gPSBuZXcgVEhSRUUuVmVjdG9yMygpXG4gICAgICAgICAgLmFkZFZlY3RvcnMoZiwgbWlkKVxuICAgICAgICAgIC5tdWx0aXBseVNjYWxhcigwLjUpXG4gICAgICAgICAgLmFkZChuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgICAgICAgIChtaWQueCAtIGYueCkgKiBtdWx0LFxuICAgICAgICAgICAgKGYueSAtIG1pZC55KSAqIG11bHQsXG4gICAgICAgICAgICBidW1wWlxuICAgICAgICAgICkpLFxuICAgICAgICBtdCA9IG5ldyBUSFJFRS5WZWN0b3IzKClcbiAgICAgICAgICAuYWRkVmVjdG9ycyhtaWQsIHQpXG4gICAgICAgICAgLm11bHRpcGx5U2NhbGFyKDAuNSlcbiAgICAgICAgICAuYWRkKG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgICAgICAgKG1pZC54IC0gdC54KSAqIG11bHQsXG4gICAgICAgICAgICAodC55IC0gbWlkLnkpICogbXVsdCxcbiAgICAgICAgICAgIGJ1bXBaXG4gICAgICAgICAgKSk7XG5cbiAgICAgIHZhciBzcGxpbmUgPSBuZXcgVEhSRUUuU3BsaW5lKFtcbiAgICAgICAgZiwgZm0sIG1pZCwgbXQsIHRcbiAgICAgIF0pLCBpLCBsID0gMTAsIGluZGV4LCBwb3NpdGlvbixcbiAgICAgICAgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICAgICAgZ2VvbWV0cnkuY29sb3JzID0gW107XG4gICAgICBmb3IgKGkgPSAwOyBpIDw9IGw7IGkgKz0gMSkge1xuICAgICAgICBpbmRleCA9IGkgLyBsO1xuICAgICAgICBwb3NpdGlvbiA9IHNwbGluZS5nZXRQb2ludChpbmRleCk7XG4gICAgICAgIGdlb21ldHJ5LnZlcnRpY2VzW2ldID0gbmV3IFRIUkVFLlZlY3RvcjMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueik7XG4gICAgICAgIGdlb21ldHJ5LmNvbG9yc1tpXSA9IG5ldyBUSFJFRS5Db2xvcigweGZmZmZmZik7XG4gICAgICAgIGdlb21ldHJ5LmNvbG9yc1tpXS5zZXRIU0woXG4gICAgICAgICAgLy8gMjAwIC8gMzYwLFxuICAgICAgICAgIC8vIGluZGV4LFxuICAgICAgICAgIC8vIDAuNVxuICAgICAgICAgIDIwMC8zNjAsXG4gICAgICAgICAgMSxcbiAgICAgICAgICAwLjlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkcmF3RWRnZXMoc2NvcGUpIHtcbiAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgIGZyb21WID0gbmV3IFRIUkVFLlZlY3RvcjMoKSxcbiAgICAgICAgdG9WID0gbmV3IFRIUkVFLlZlY3RvcjMoKSxcbiAgICAgICAgbWlkID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgICAgZWRnZXMuZm9yRWFjaChmdW5jdGlvbiAobGluaywgaSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhpLCBlZGdlcy5sZW5ndGgpO1xuICAgICAgICB2YXIgZnJvbSA9IG5vZGVNYXBbbGluay5mcm9tXTtcbiAgICAgICAgdmFyIHRvID0gbm9kZU1hcFtsaW5rLnRvXTtcblxuICAgICAgICB2YXIgaW5kZXggPSBfLmZpbmRJbmRleChcbiAgICAgICAgICBmcm9tLnByb3BlcnRpZXMsXG4gICAgICAgICAgeyBuYW1lOiBsaW5rLnByb3BlcnR5IH1cbiAgICAgICAgKTtcbiAgICAgICAgZnJvbVYuc2V0KFxuICAgICAgICAgIGZyb20ueCAtIGZyb20ud2lkdGggKiAwLjUgKyBtYXJnaW4ubGVmdCxcbiAgICAgICAgICBmcm9tLnkgLSBmcm9tLmhlaWdodCAqIDAuNSArIChmcm9tLnByb3BlcnRpZXMubGVuZ3RoIC0gaW5kZXgpICogMTUgKyA1LFxuICAgICAgICAgIDBcbiAgICAgICAgKTtcbiAgICAgICAgdG9WLnNldChcbiAgICAgICAgICB0by54IC0gdG8ud2lkdGggKiAwLjUsXG4gICAgICAgICAgdG8ueSAtIHRvLmhlaWdodCAqIDAuNSxcbiAgICAgICAgICAwXG4gICAgICAgICk7XG4gICAgICAgIHZhciBkID0gZnJvbVYuZGlzdGFuY2VUbyh0b1YpO1xuICAgICAgICBtaWRcbiAgICAgICAgICAuYWRkVmVjdG9ycyhmcm9tViwgdG9WKVxuICAgICAgICAgIC5tdWx0aXBseVNjYWxhcigwLjUpXG4gICAgICAgICAgLnNldFooNTApO1xuXG4gICAgICAgIHZhciBnZW9tZXRyeSA9IGdlbmVyYXRlU3BsaW5lKGZyb21WLCBtaWQsIHRvViwgZCk7XG4gICAgICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5MaW5lQmFzaWNNYXRlcmlhbCh7XG4gICAgICAgICAgY29sb3I6IDB4ZmZmZmZmLFxuICAgICAgICAgIG9wYWNpdHk6IDAuNSxcbiAgICAgICAgICBsaW5ld2lkdGg6IDMsXG4gICAgICAgICAgdmVydGV4Q29sb3JzOiBUSFJFRS5WZXJ0ZXhDb2xvcnNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBtZXNoID0gbmV3IFRIUkVFLkxpbmUoZ2VvbWV0cnksIG1hdGVyaWFsKTtcbiAgICAgICAgbWUuYWN0aXZlU2NlbmUuYWRkKG1lc2gpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gcHJlIGluaXRcbiAgICB0My50aGVtZXMuYWxsV2hpdGUgPSB7XG4gICAgICBjbGVhckNvbG9yOiAweGZmZmZmZixcbiAgICAgIGZvZ0NvbG9yOiAweGZmZmZmZixcbiAgICAgIGdyb3VuZENvbG9yOiAweGZmZmZmZlxuICAgIH07XG4gICAgaW5zdGFuY2UgPSB0My5ydW4oe1xuICAgICAgc2VsZWN0b3I6IGVsICsgJyAjcm9vdCcsXG4gICAgICB3aWR0aDogYmJveC53aWR0aCxcbiAgICAgIGhlaWdodDogYmJveC5oZWlnaHQsXG4gICAgICB0aGVtZTogJ2FsbFdoaXRlJyxcbiAgICAgIGFtYmllbnRDb25maWc6IHtcbiAgICAgICAgZ3JvdW5kOiBmYWxzZSxcbiAgICAgICAgYXhlczogZmFsc2UsXG4gICAgICAgIGdyaWRZOiBmYWxzZSxcbiAgICAgICAgZ3JpZFg6IGZhbHNlLFxuICAgICAgICBncmlkWjogZmFsc2VcbiAgICAgIH0sXG4gICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgcmVuZGVyZXJFbCA9IG1lLnJlbmRlcmVyLmRvbUVsZW1lbnQ7XG4gICAgICAgIG1lLmRhdGd1aS5jbG9zZSgpO1xuICAgICAgICBtZS5hY3RpdmVTY2VuZS5mb2cgPSBudWxsO1xuICAgICAgICBtZS5yZW5kZXJlci5zb3J0T2JqZWN0cyA9IGZhbHNlO1xuICAgICAgICBtZS5yZW5kZXJlci5zaGFkb3dNYXBFbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgbWUucmVuZGVyZXIuc2hhZG93TWFwVHlwZSA9IFRIUkVFLlBDRlNoYWRvd01hcDtcblxuICAgICAgICB2YXIgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgICAgICB2YXIgbW92ZWQgPSBmYWxzZSwgZG93biA9IGZhbHNlO1xuICAgICAgICByZW5kZXJlckVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgaWYgKGRvd24pIHtcbiAgICAgICAgICAgIG1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHdyYXBwZXJFbC5zdHlsZS5jdXJzb3IgPSAnbW92ZSc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vdmVkID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVuZGVyZXJFbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGRvd24gPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmVuZGVyZXJFbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBkb3duID0gZmFsc2U7XG4gICAgICAgICAgd3JhcHBlckVsLnN0eWxlLmN1cnNvciA9ICdhdXRvJztcbiAgICAgICAgfSk7XG4gICAgICAgIHJlbmRlcmVyRWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB2YXIgYmJveCA9IHJlbmRlcmVyRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgdmFyIGN4ID0gZS5jbGllbnRYIC0gYmJveC5sZWZ0O1xuICAgICAgICAgIHZhciBjeSA9IGUuY2xpZW50WSAtIGJib3gudG9wO1xuICAgICAgICAgIG1vdXNlLnggPSAoY3ggLyByZW5kZXJlckVsLmNsaWVudFdpZHRoKSAqIDIgLSAxO1xuICAgICAgICAgIG1vdXNlLnkgPSAtKGN5IC8gcmVuZGVyZXJFbC5jbGllbnRIZWlnaHQpICogMiArIDE7XG4gICAgICAgICAgdmFyIHZlY3RvciA9IG5ldyBUSFJFRS5WZWN0b3IzKCBtb3VzZS54LCBtb3VzZS55LCAwLjUgKTtcbiAgICAgICAgICBwcm9qZWN0b3IudW5wcm9qZWN0VmVjdG9yKHZlY3RvciwgbWUuYWN0aXZlQ2FtZXJhKTtcblxuICAgICAgICAgIHZhciByYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKFxuICAgICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLFxuICAgICAgICAgICAgdmVjdG9yLnN1YihjYW1lcmEucG9zaXRpb24pLm5vcm1hbGl6ZSgpXG4gICAgICAgICAgKTtcbiAgICAgICAgICB2YXIgaW50ZXJzZWN0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKG5vZGVNZXNoZXMpLFxuICAgICAgICAgICAgaU9iamVjdCA9IGludGVyc2VjdHNbMF0gJiYgaW50ZXJzZWN0c1swXS5vYmplY3Q7XG4gICAgICAgICAgaWYgKGlPYmplY3QgJiYgIW1vdmVkKSB7XG4gICAgICAgICAgICAvLyBmb2N1cyBvbiB0aGlzIG9iamVjdCBvbiBjbGlja1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coaU9iamVjdCk7XG4gICAgICAgICAgICB2YXIgZGVzdCA9IHtcbiAgICAgICAgICAgICAgeDogaU9iamVjdC5wb3NpdGlvbi54ICsgaU9iamVjdC51c2VyRGF0YS5ub2RlLndpZHRoIC8gMixcbiAgICAgICAgICAgICAgeTogaU9iamVjdC5wb3NpdGlvbi55ICsgaU9iamVjdC51c2VyRGF0YS5ub2RlLmhlaWdodCAvIDJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBuZXcgVFdFRU4uVHdlZW4obWUuYWN0aXZlQ2FtZXJhLnBvc2l0aW9uKVxuICAgICAgICAgICAgICAudG8oXy5tZXJnZSh7fSwgZGVzdCwge1xuICAgICAgICAgICAgICAgIHo6IE1hdGgubWF4KGlPYmplY3QudXNlckRhdGEubm9kZS5oZWlnaHQsIDM1MClcbiAgICAgICAgICAgICAgfSksIDEwMDApXG4gICAgICAgICAgICAgIC5lYXNpbmcoVFdFRU4uRWFzaW5nLkN1YmljLkluT3V0KVxuICAgICAgICAgICAgICAuc3RhcnQoKTtcbiAgICAgICAgICAgIG5ldyBUV0VFTi5Ud2VlbihtZS5hY3RpdmVDYW1lcmEuY2FtZXJhQ29udHJvbHMudGFyZ2V0KVxuICAgICAgICAgICAgICAudG8oZGVzdCwgMTAwMClcbiAgICAgICAgICAgICAgLmVhc2luZyhUV0VFTi5FYXNpbmcuQ3ViaWMuSW5PdXQpXG4gICAgICAgICAgICAgIC5zdGFydCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgIC8vIGNhbWVyYSBzZXR1cFxuICAgICAgICB2YXIgZm92ID0gNzAsXG4gICAgICAgICAgcmF0aW8gPSByZW5kZXJlckVsLmNsaWVudFdpZHRoIC8gcmVuZGVyZXJFbC5jbGllbnRIZWlnaHQsXG4gICAgICAgICAgbmVhciA9IDEsXG4gICAgICAgICAgZmFyID0gMjAwMDA7XG4gICAgICAgIHZhciBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoZm92LCByYXRpbywgbmVhciwgZmFyKTtcbiAgICAgICAgbWVcbiAgICAgICAgICAuYWRkQ2FtZXJhKGNhbWVyYSwgJ21pbmUnKVxuICAgICAgICAgIC5zZXRBY3RpdmVDYW1lcmEoJ21pbmUnKTtcbiAgICAgICAgY3JlYXRlQ2FtZXJhQ29udHJvbHMoY2FtZXJhLCByZW5kZXJlckVsKTtcbiAgICAgICAgY2FtZXJhLmNhbWVyYUNvbnRyb2xzLnRhcmdldC5zZXQoXG4gICAgICAgICAgZGF0YS5jZW50ZXIueCxcbiAgICAgICAgICBkYXRhLmNlbnRlci55LFxuICAgICAgICAgIDBcbiAgICAgICAgKTtcbiAgICAgICAgY2FtZXJhLmNhbWVyYUNvbnRyb2xzLm5vS2V5cyA9IHRydWU7XG5cbiAgICAgICAgLy8gZHJhdyB0aGUgbm9kZXNcbiAgICAgICAgZHJhd05vZGVzLmNhbGwobWUpO1xuICAgICAgICBkcmF3Q2lyY2xlcy5jYWxsKG1lKTtcbiAgICAgICAgZHJhd0VkZ2VzLmNhbGwobWUpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi5zZXQoXG4gICAgICAgICAgICBkYXRhLmNlbnRlci54LFxuICAgICAgICAgICAgZGF0YS5jZW50ZXIueSxcbiAgICAgICAgICAgIE1hdGgubWluKGRhdGEubXgueCAtIGRhdGEubW4ueCwgZGF0YS5teC55IC0gZGF0YS5tbi55KVxuICAgICAgICAgICk7XG4gICAgICAgICAgLy9jYW1lcmEubG9va0F0KG5ldyBUSFJFRS5WZWN0b3IzKGRhdGEuY2VudGVyLngsIGRhdGEuY2VudGVyLnksIDApKTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9LFxuICAgICAgdXBkYXRlOiBmdW5jdGlvbiAoZGVsdGEpIHtcbiAgICAgICAgVFdFRU4udXBkYXRlKCk7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIG1lLmFjID0gbWUuYWMgfHwgMDtcbiAgICAgICAgbWUuYWMgKz0gZGVsdGE7XG4gICAgICAgIGlmIChtZS5hYyA+IDIpIHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhtZS5yZW5kZXJlci5pbmZvLnJlbmRlcik7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2cobWUucmVuZGVyZXIpO1xuICAgICAgICAgIG1lLmFjID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxudmFyIGNoYW5nZUZha2VQcm9wZXJ0eU5hbWUgPSB7XG4gICdbW1Byb3RvdHlwZV1dJzogJ19fcHJvdG9fXydcbn07XG5cbnZhciB1dGlscyA9IHtcbiAgdHJhbnNsYXRlOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyAoeCB8fCAwKSArICcsICcgKyAoeSB8fCAwKSArICcpJztcbiAgfSxcbiAgc2NhbGU6IGZ1bmN0aW9uIChzKSB7XG4gICAgcmV0dXJuICdzY2FsZSgnICsgKHMgfHwgMSkgKyAnKSc7XG4gIH0sXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciB0ID0gW107XG4gICAgXy5mb3JPd24ob2JqLCBmdW5jdGlvbiAodiwgaykge1xuICAgICAgdC5wdXNoKHV0aWxzW2tdLmFwcGx5KHV0aWxzLCB2KSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHQuam9pbignICcpO1xuICB9LFxuICBwcmVmaXhlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgIGFyZ3MudW5zaGlmdCgncHYnKTtcbiAgICByZXR1cm4gYXJncy5qb2luKCctJyk7XG4gIH0sXG4gIHRyYW5zZm9ybVByb3BlcnR5OiBmdW5jdGlvbiAodikge1xuICAgIGlmIChjaGFuZ2VGYWtlUHJvcGVydHlOYW1lLmhhc093blByb3BlcnR5KHYpKSB7XG4gICAgICByZXR1cm4gY2hhbmdlRmFrZVByb3BlcnR5TmFtZVt2XTtcbiAgICB9XG4gICAgcmV0dXJuIHY7XG4gIH0sXG4gIGVzY2FwZUNsczogZnVuY3Rpb24odikge1xuICAgIHJldHVybiB2LnJlcGxhY2UoL1xcJC9nLCAnXycpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vJyk7XG52YXIgbWUsIGhhc2hLZXk7XG52YXIgZG9HZXQsIGRvU2V0O1xuXG5tZSA9IGhhc2hLZXkgPSBmdW5jdGlvbiAodikge1xuICB2YXIgdWlkID0gdjtcbiAgaWYgKHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbih2KSkge1xuICAgIGlmICghbWUuaGFzKHYpKSB7XG4gICAgICBkb1NldCh2LCBfLnVuaXF1ZUlkKCkpO1xuICAgIH1cbiAgICB1aWQgPSBkb0dldCh2KTtcbiAgICBpZiAoIW1lLmhhcyh2KSkge1xuICAgICAgdGhyb3cgRXJyb3IodiArICcgc2hvdWxkIGhhdmUgYSBoYXNoS2V5IGF0IHRoaXMgcG9pbnQgOignKTtcbiAgICB9XG4gICAgcmV0dXJuIHVpZDtcbiAgfVxuXG4gIC8vIHYgaXMgYSBwcmltaXRpdmVcbiAgcmV0dXJuIHR5cGVvZiB2ICsgJy0nICsgdWlkO1xufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogR2V0cyB0aGUgc3RvcmVkIGhhc2hrZXksIHNpbmNlIHRoZXJlIGFyZSBvYmplY3QgdGhhdCBtaWdodCBub3QgaGF2ZSBhIGNoYWluXG4gKiB1cCB0byBPYmplY3QucHJvdG90eXBlIHRoZSBjaGVjayBpcyBkb25lIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSBleHBsaWNpdGx5XG4gKlxuICogQHBhcmFtICB7Kn0gb2JqXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmRvR2V0ID0gZnVuY3Rpb24gKG9iaikge1xuICBhc3NlcnQodXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKG9iaiksICdvYmogbXVzdCBiZSBhbiBvYmplY3R8ZnVuY3Rpb24nKTtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIG1lLmhpZGRlbktleSkgJiZcbiAgICBvYmpbbWUuaGlkZGVuS2V5XTtcbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIFNldHMgYSBoaWRkZW4ga2V5IG9uIGFuIG9iamVjdCwgdGhlIGhpZGRlbiBrZXkgaXMgZGV0ZXJtaW5lZCBhcyBmb2xsb3dzOlxuICpcbiAqIC0gbnVsbCBvYmplY3QtbnVsbFxuICogLSBudW1iZXJzOiBudW1iZXIte3ZhbHVlfVxuICogLSBib29sZWFuOiBib29sZWFuLXt0cnVlfGZhbHNlfVxuICogLSBzdHJpbmc6IHN0cmluZy17dmFsdWV9XG4gKiAtIHVuZGVmaW5lZCB1bmRlZmluZWQtdW5kZWZpbmVkXG4gKiAtIGZ1bmN0aW9uOiBmdW5jdGlvbi17aWR9IGlkID0gXy51bmlxdWVJZFxuICogLSBvYmplY3Q6IG9iamVjdC17aWR9IGlkID0gXy51bmlxdWVJZFxuICpcbiAqIEBwYXJhbSB7Kn0gb2JqIFRoZSBvYmplY3QgdG8gc2V0IHRoZSBoaWRkZW5LZXlcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byBiZSBzZXQgaW4gdGhlIG9iamVjdFxuICovXG5kb1NldCA9IGZ1bmN0aW9uIChvYmosIGtleSkge1xuICBhc3NlcnQodXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKG9iaiksICdvYmogbXVzdCBiZSBhbiBvYmplY3R8ZnVuY3Rpb24nKTtcbiAgYXNzZXJ0KFxuICAgIHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnLFxuICAgICdUaGUga2V5IG5lZWRzIHRvIGJlIGEgdmFsaWQgc3RyaW5nJ1xuICApO1xuICB2YXIgdmFsdWU7XG4gIGlmICghbWUuaGFzKG9iaikpIHtcbiAgICB2YWx1ZSA9IHR5cGVvZiBvYmogKyAnLScgKyBrZXk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgbWUuaGlkZGVuS2V5LCB7XG4gICAgICB2YWx1ZTogdmFsdWVcbiAgICB9KTtcbiAgICBpZiAoIW9ialttZS5oaWRkZW5LZXldKSB7XG4gICAgICAvLyBpbiBub2RlIHNldHRpbmcgdGhlIGluc3RydWN0aW9uIGFib3ZlIG1pZ2h0IG5vdCBoYXZlIHdvcmtlZFxuICAgICAgY29uc29sZS53YXJuKCdoYXNoS2V5I2RvU2V0KCkgc2V0dGluZyB0aGUgdmFsdWUgb24gdGhlIG9iamVjdCBkaXJlY3RseScpO1xuICAgICAgb2JqW21lLmhpZGRlbktleV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgYXNzZXJ0KG9ialttZS5oaWRkZW5LZXldLCAnT2JqZWN0LmRlZmluZVByb3BlcnR5IGRpZCBub3Qgd29yayEnKTtcbiAgfVxuICByZXR1cm4gbWU7XG59O1xuXG5tZS5oaWRkZW5LZXkgPSAnX19wb2pvdml6S2V5X18nO1xuXG5tZS5oYXMgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdHlwZW9mIGRvR2V0KHYpID09PSAnc3RyaW5nJztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbWU7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5mdW5jdGlvbiB0eXBlKHYpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2KS5zbGljZSg4LCAtMSk7XG59XG5cbnZhciB1dGlscyA9IHt9O1xuXG4vKipcbiAqIEFmdGVyIGNhbGxpbmcgYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdgIHdpdGggYHZgIGFzIHRoZSBzY29wZVxuICogdGhlIHJldHVybiB2YWx1ZSB3b3VsZCBiZSB0aGUgY29uY2F0ZW5hdGlvbiBvZiAnW09iamVjdCAnLFxuICogY2xhc3MgYW5kICddJywgYGNsYXNzYCBpcyB0aGUgcmV0dXJuaW5nIHZhbHVlIG9mIHRoaXMgZnVuY3Rpb25cbiAqXG4gKiBlLmcuICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFtdKSA9PSBbb2JqZWN0IEFycmF5XSxcbiAqICAgICAgICB0aGUgcmV0dXJuaW5nIHZhbHVlIGlzIHRoZSBzdHJpbmcgQXJyYXlcbiAqXG4gKiBAcGFyYW0geyp9IHZcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbnV0aWxzLmludGVybmFsQ2xhc3NQcm9wZXJ0eSA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB0eXBlKHYpO1xufTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYSBnaXZlbiB2YWx1ZSBpcyBhIGZ1bmN0aW9uLCB0aGUgbGlicmFyeSBvbmx5IG5lZWRzXG4gKiB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpZmZlcmVudCBraW5kcyBvZiBwcmltaXRpdmUgdHlwZXMgKG5vIG5lZWQgdG9cbiAqIGRpc3Rpbmd1aXNoIGJldHdlZW4gZGlmZmVyZW50IGtpbmRzIG9mIG9iamVjdHMpXG4gKlxuICogQHBhcmFtICB7Kn0gIHYgVGhlIHZhbHVlIHRvIGJlIGNoZWNrZWRcbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG51dGlscy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuICEhdiAmJiB0eXBlb2YgdiA9PT0gJ2Z1bmN0aW9uJztcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBhIGNvbnN0cnVjdG9yLFxuICogTk9URTogZm9yIHRoZSBzYWtlIG9mIHRoaXMgbGlicmFyeSBhIGNvbnN0cnVjdG9yIGlzIGEgZnVuY3Rpb25cbiAqIHRoYXQgaGFzIGEgbmFtZSB3aGljaCBzdGFydHMgd2l0aCBhbiB1cHBlcmNhc2UgbGV0dGVyIGFuZCBhbHNvXG4gKiB0aGF0IHRoZSBwcm90b3R5cGUncyBjb25zdHJ1Y3RvciBpcyBpdHNlbGZcbiAqIEBwYXJhbSB7Kn0gdlxuICovXG51dGlscy5pc0NvbnN0cnVjdG9yID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHRoaXMuaXNGdW5jdGlvbih2KSAmJiB0eXBlb2Ygdi5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgdi5uYW1lLmxlbmd0aCAmJiB2LnByb3RvdHlwZSAmJiB2LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9PT0gdjtcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZ2l2ZW4gdmFsdWUgaXMgYW4gb2JqZWN0LCB0aGUgbGlicmFyeSBvbmx5IG5lZWRzXG4gKiB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpZmZlcmVudCBraW5kcyBvZiBwcmltaXRpdmUgdHlwZXMgKG5vIG5lZWQgdG9cbiAqIGRpc3Rpbmd1aXNoIGJldHdlZW4gZGlmZmVyZW50IGtpbmRzIG9mIG9iamVjdHMpXG4gKlxuICogTk9URTogYSBmdW5jdGlvbiB3aWxsIG5vdCBwYXNzIHRoaXMgdGVzdFxuICogaS5lLlxuICogICAgICAgIHV0aWxzLmlzT2JqZWN0KGZ1bmN0aW9uKCkge30pIGlzIGZhbHNlIVxuICpcbiAqIFNwZWNpYWwgdmFsdWVzIHdob3NlIGB0eXBlb2ZgIHJlc3VsdHMgaW4gYW4gb2JqZWN0OlxuICogLSBudWxsXG4gKlxuICogQHBhcmFtICB7Kn0gIHYgVGhlIHZhbHVlIHRvIGJlIGNoZWNrZWRcbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG51dGlscy5pc09iamVjdCA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiAhIXYgJiYgdHlwZW9mIHYgPT09ICdvYmplY3QnO1xufTtcblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGFuIG9iamVjdCBvciBhIGZ1bmN0aW9uIChub3RlIHRoYXQgZm9yIHRoZSBzYWtlXG4gKiBvZiB0aGUgbGlicmFyeSBBcnJheXMgYXJlIG5vdCBvYmplY3RzKVxuICpcbiAqIEBwYXJhbSB7Kn0gdlxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbnV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbiA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB1dGlscy5pc09iamVjdCh2KSB8fCB1dGlscy5pc0Z1bmN0aW9uKHYpO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqXG4gKiBDaGVja3MgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIHRyYXZlcnNhYmxlLCBmb3IgdGhlIHNha2Ugb2YgdGhlIGxpYnJhcnkgYW5cbiAqIG9iamVjdCAod2hpY2ggaXMgbm90IGFuIGFycmF5KSBvciBhIGZ1bmN0aW9uIGlzIHRyYXZlcnNhYmxlLCBzaW5jZSB0aGlzIGZ1bmN0aW9uXG4gKiBpcyB1c2VkIGJ5IHRoZSBvYmplY3QgYW5hbHl6ZXIgb3ZlcnJpZGluZyBpdCB3aWxsIGRldGVybWluZSB3aGljaCBvYmplY3RzXG4gKiBhcmUgdHJhdmVyc2FibGVcbiAqXG4gKiBAcGFyYW0geyp9IHZcbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG51dGlscy5pc1RyYXZlcnNhYmxlID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbih2KTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNwZWNpYWwgZnVuY3Rpb24gd2hpY2ggaXMgYWJsZSB0byBleGVjdXRlIGEgc2VyaWVzIG9mIGZ1bmN0aW9ucyB0aHJvdWdoXG4gKiBjaGFpbmluZywgdG8gcnVuIGFsbCB0aGUgZnVuY3Rpb25zIHN0b3JlZCBpbiB0aGUgY2hhaW4gZXhlY3V0ZSB0aGUgcmVzdWx0aW5nIHZhbHVlXG4gKlxuICogLSBlYWNoIGZ1bmN0aW9uIGlzIGludm9rZWQgd2l0aCB0aGUgb3JpZ2luYWwgYXJndW1lbnRzIHdoaWNoIGBmdW5jdGlvbkNoYWluYCB3YXNcbiAqIGludm9rZWQgd2l0aCArIHRoZSByZXN1bHRpbmcgdmFsdWUgb2YgdGhlIGxhc3Qgb3BlcmF0aW9uIGFzIHRoZSBsYXN0IGFyZ3VtZW50XG4gKiAtIHRoZSBzY29wZSBvZiBlYWNoIGZ1bmN0aW9uIGlzIHRoZSBzYW1lIHNjb3BlIGFzIHRoZSBvbmUgdGhhdCB0aGUgcmVzdWx0aW5nXG4gKiBmdW5jdGlvbiB3aWxsIGhhdmVcbiAqXG4gKiAgICB2YXIgZm5zID0gdXRpbHMuZnVuY3Rpb25DaGFpbigpXG4gKiAgICAgICAgICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKGEsIGIpIHtcbiAqICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYSwgYik7XG4gKiAgICAgICAgICAgICAgICAgIHJldHVybiAnZmlyc3QnO1xuICogICAgICAgICAgICAgICAgfSlcbiAqICAgICAgICAgICAgICAgIC5jaGFpbihmdW5jdGlvbiAoYSwgYiwgYykge1xuICogICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhhLCBiLCBjKTtcbiAqICAgICAgICAgICAgICAgICAgcmV0dXJuICdzZWNvbmQ7XG4gKiAgICAgICAgICAgICAgICB9KVxuICogICAgZm5zKDEsIDIpOyAgLy8gcmV0dXJucyAnc2Vjb25kJ1xuICogICAgLy8gbG9ncyAxLCAyXG4gKiAgICAvLyBsb2dzIDEsIDIsICdmaXJzdCdcbiAqXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gKi9cbnV0aWxzLmZ1bmN0aW9uQ2hhaW4gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzdGFjayA9IFtdO1xuICB2YXIgaW5uZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgIHZhciB2YWx1ZSA9IG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgdmFsdWUgPSBzdGFja1tpXS5hcHBseSh0aGlzLCBhcmdzLmNvbmNhdCh2YWx1ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG4gIGlubmVyLmNoYWluID0gZnVuY3Rpb24gKHYpIHtcbiAgICBzdGFjay5wdXNoKHYpO1xuICAgIHJldHVybiBpbm5lcjtcbiAgfTtcbiAgcmV0dXJuIGlubmVyO1xufTtcblxuLyoqXG4gKiBHaXZlbiBhIHN0ciBtYWRlIG9mIGFueSBjaGFyYWN0ZXJzIHRoaXMgbWV0aG9kIHJldHVybnMgYSBzdHJpbmdcbiAqIHJlcHJlc2VudGF0aW9uIG9mIGEgc2lnbmVkIGludFxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICovXG51dGlscy5oYXNoQ29kZSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgdmFyIGksIGxlbmd0aCwgY2hhciwgaGFzaCA9IDA7XG4gIGZvciAoaSA9IDAsIGxlbmd0aCA9IHN0ci5sZW5ndGg7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGNoYXIgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBjaGFyO1xuICAgIGhhc2ggPSBoYXNoICYgaGFzaDtcbiAgfVxuICByZXR1cm4gU3RyaW5nKGhhc2gpO1xufTtcblxudXRpbHMuY3JlYXRlRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnROYW1lLCBkZXRhaWxzKSB7XG4gIHJldHVybiBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lLCB7XG4gICAgZGV0YWlsOiBkZXRhaWxzXG4gIH0pO1xufTtcbnV0aWxzLm5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uIChtZXNzYWdlLCBjb25zb2xlVG9vKSB7XG4gIHZhciBldiA9IHV0aWxzLmNyZWF0ZUV2ZW50KCdwb2pvdml6LW5vdGlmaWNhdGlvbicsIG1lc3NhZ2UpO1xuICBjb25zb2xlVG9vICYmIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KGV2KTtcbn07XG51dGlscy5jcmVhdGVKc29ucENhbGxiYWNrID0gZnVuY3Rpb24gKHVybCkge1xuICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gIHNjcmlwdC5zcmMgPSB1cmw7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbn07XG51dGlscy50b1F1ZXJ5U3RyaW5nID0gZnVuY3Rpb24gKG9iaikge1xuICB2YXIgcyA9ICcnLFxuICAgIGkgPSAwO1xuICBfLmZvck93bihvYmosIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgaWYgKGkpIHtcbiAgICAgIHMgKz0gJyYnO1xuICAgIH1cbiAgICBzICs9IGsgKyAnPScgKyB2O1xuICAgIGkgKz0gMTtcbiAgfSk7XG4gIHJldHVybiBzO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqXG4gKiBHaXZlbiBhIHByb3BlcnR5IG5hbWUgdGhpcyBtZXRob2QgaWRlbnRpZmllcyBpZiBpdCdzIGEgdmFsaWQgcHJvcGVydHkgZm9yIHRoZSBzYWtlXG4gKiBvZiB0aGUgbGlicmFyeSwgYSB2YWxpZCBwcm9wZXJ0eSBpcyBhIHByb3BlcnR5IHdoaWNoIGRvZXMgbm90IHByb3Zva2UgYW4gZXJyb3JcbiAqIHdoZW4gdHJ5aW5nIHRvIGFjY2VzcyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byBpdCBmcm9tIGFueSBvYmplY3RcbiAqXG4gKiBGb3IgZXhhbXBsZSBleGVjdXRpbmcgdGhlIGZvbGxvd2luZyBjb2RlIGluIHN0cmljdCBtb2RlIHdpbGwgeWllbGQgYW4gZXJyb3I6XG4gKlxuICogICAgdmFyIGZuID0gZnVuY3Rpb24oKSB7fTtcbiAqICAgIGZuLmFyZ3VtZW50c1xuICpcbiAqIFNpbmNlIGFyZ3VtZW50cyBpcyBwcm9oaWJpdGVkIGluIHN0cmljdCBtb2RlXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9TdHJpY3RfbW9kZVxuICpcbiAqXG4gKlxuICogQHBhcmFtIHtPYmplY3R8RnVuY3Rpb259IG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gKi9cbnV0aWxzLm9iamVjdFByb3BlcnR5SXNGb3JiaWRkZW4gPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICB2YXIga2V5O1xuICB2YXIgcnVsZXMgPSB1dGlscy5wcm9wZXJ0eUZvcmJpZGRlblJ1bGVzO1xuICBmb3IgKGtleSBpbiBydWxlcykge1xuICAgIGlmIChydWxlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBpZiAocnVsZXNba2V5XShvYmplY3QsIHByb3BlcnR5KSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqXG4gKiBNb2RpZnkgdGhpcyBvYmplY3QgdG8gYWRkL3JlbW92ZSBydWxlcyB0aGF0IHdpbCBiZSBydW4gYnlcbiAqICNvYmplY3RQcm9wZXJ0eUlzRm9yYmlkZGVuLCB0byBkZXRlcm1pbmUgaWYgYSBwcm9wZXJ0eSBpcyBpbnZhbGlkXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xudXRpbHMucHJvcGVydHlGb3JiaWRkZW5SdWxlcyA9IHtcbiAgLyoqXG4gICAqIGBjYWxsZXJgIGFuZCBgYXJndW1lbnRzYCBhcmUgaW52YWxpZCBwcm9wZXJ0aWVzIG9mIGEgZnVuY3Rpb24gaW4gc3RyaWN0IG1vZGVcbiAgICogQHBhcmFtIHsqfSBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgc3RyaWN0TW9kZTogZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBpZiAodXRpbHMuaXNGdW5jdGlvbihvYmplY3QpKSB7XG4gICAgICByZXR1cm4gcHJvcGVydHkgPT09ICdjYWxsZXInIHx8IHByb3BlcnR5ID09PSAnYXJndW1lbnRzJztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBQcm9wZXJ0aWVzIHRoYXQgc3RhcnQgYW5kIGVuZCB3aXRoIF9fIGFyZSBzcGVjaWFsIHByb3BlcnRpZXMsXG4gICAqIGluIHNvbWUgY2FzZXMgdGhleSBhcmUgdmFsaWQgKGxpa2UgX19wcm90b19fKSBvciBkZXByZWNhdGVkXG4gICAqIGxpa2UgX19kZWZpbmVHZXR0ZXJfX1xuICAgKlxuICAgKiBlLmcuXG4gICAqICAtIE9iamVjdC5wcm90b3R5cGUuX19wcm90b19fXG4gICAqICAtIE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVHZXR0ZXJfX1xuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lU2V0dGVyX19cbiAgICogIC0gT2JqZWN0LnByb3RvdHlwZS5fX2xvb2t1cEdldHRlcl9fXG4gICAqICAtIE9iamVjdC5wcm90b3R5cGUuX19sb29rdXBTZXR0ZXJfX1xuICAgKlxuICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBoaWRkZW5Qcm9wZXJ0eTogZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICByZXR1cm4gcHJvcGVydHkuc2VhcmNoKC9eX18uKj9fXyQvKSA+IC0xO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBbmd1bGFyIGhpZGRlbiBwcm9wZXJ0aWVzIHN0YXJ0IGFuZCBlbmQgd2l0aCAkJCwgZm9yIHRoZSBzYWtlXG4gICAqIG9mIHRoZSBsaWJyYXJ5IHRoZXNlIGFyZSBpbnZhbGlkIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIHsqfSBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgYW5ndWxhckhpZGRlblByb3BlcnR5OiBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIHJldHVybiBwcm9wZXJ0eS5zZWFyY2goL15cXCRcXCQuKj9cXCRcXCQkLykgPiAtMTtcbiAgfSxcblxuICAvKipcbiAgICogVGhlIHByb3BlcnRpZXMgdGhhdCBoYXZlIHRoZSBmb2xsb3dpbmcgc3ltYm9scyBhcmUgZm9yYmlkZGVuOlxuICAgKiBbOit+IT48PS8vXFxbXFxdQFxcLiBdXG4gICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIC8vc3ltYm9sczogZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgLy8gIHJldHVybiBwcm9wZXJ0eS5zZWFyY2goL1s6K34hPjw9Ly9cXF1AXFwuIF0vKSA+IC0xO1xuICAvL31cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbHM7Il19
