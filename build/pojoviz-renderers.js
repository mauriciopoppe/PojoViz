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
      return this.doProcess(inspector.json);
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
    utils.fireGlobalEvent('pojoviz-render-start');

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

      utils.fireGlobalEvent('pojoviz-render-end');
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
(function (global){
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
utils.notification = function (message) {
  utils.fireGlobalEvent('pojoviz-notification', message);
};
utils.fireGlobalEvent = function (event, params) {
  if (!global.document) {
    return;
  }
  var ev = utils.createEvent(event, params);
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
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"lodash":undefined}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcmVuZGVyZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsInNyYy9yZW5kZXJlci9kMy9DYW52YXMuanMiLCJzcmMvcmVuZGVyZXIvZDMvTm9kZS5qcyIsInNyYy9yZW5kZXJlci9kMy9Qcm9wZXJ0eS5qcyIsInNyYy9yZW5kZXJlci9kMy9pbmRleC5qcyIsInNyYy9yZW5kZXJlci9kcmF3LmpzIiwic3JjL3JlbmRlcmVyL3RocmVlL1BhbkNvbnRyb2xzLmpzIiwic3JjL3JlbmRlcmVyL3RocmVlL2luZGV4LmpzIiwic3JjL3JlbmRlcmVyL3V0aWxzLmpzIiwic3JjL3V0aWwvaGFzaEtleS5qcyIsInNyYy91dGlsL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdm9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDamJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBpdCdzIG5vdCBhIHN0YW5kYWxvbmUgcGFja2FnZVxuLy8gYnV0IGl0IGV4dGVuZHMgcG9qb3ZpeidzIGZ1bmN0aW9uYWxpdHlcbnZhciBwb2pvdml6ID0gZ2xvYmFsLnBvam92aXo7XG5pZiAoIXBvam92aXopIHtcbiAgdGhyb3cgJ1RoaXMgaXMgbm90IGEgc3RhbmRhbG9uZSBwcm9qZWN0LCBwb2pvdml6IG5vdCBmb3VuZCc7XG59XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5fLm1lcmdlKHBvam92aXosIHtcbiAgZHJhdzogcmVxdWlyZSgnLi9kcmF3Jylcbn0pO1xuXG5wb2pvdml6LmRyYXcuYWRkUmVuZGVyZXIoJ2QzJywgcmVxdWlyZSgnLi9kMy8nKSk7XG5wb2pvdml6LmRyYXcuYWRkUmVuZGVyZXIoJ3RocmVlJywgcmVxdWlyZSgnLi90aHJlZS8nKSk7XG5wb2pvdml6LmRyYXcuc2V0UmVuZGVyZXIoJ2QzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gcG9qb3Zpei5kcmF3OyIsIi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyB3aGVuIHVzZWQgaW4gbm9kZSwgdGhpcyB3aWxsIGFjdHVhbGx5IGxvYWQgdGhlIHV0aWwgbW9kdWxlIHdlIGRlcGVuZCBvblxuLy8gdmVyc3VzIGxvYWRpbmcgdGhlIGJ1aWx0aW4gdXRpbCBtb2R1bGUgYXMgaGFwcGVucyBvdGhlcndpc2Vcbi8vIHRoaXMgaXMgYSBidWcgaW4gbm9kZSBtb2R1bGUgbG9hZGluZyBhcyBmYXIgYXMgSSBhbSBjb25jZXJuZWRcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcblxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBzdGFja1N0YXJ0RnVuY3Rpb24ubmFtZTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHV0aWwuaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHV0aWwuaXNOdW1iZXIodmFsdWUpICYmICFpc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB1dGlsLmlzUmVnRXhwKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodXRpbC5pc1N0cmluZyhzKSkge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuYWN0dWFsLCByZXBsYWNlciksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNCdWZmZXIoYWN0dWFsKSAmJiB1dGlsLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCF1dGlsLmlzT2JqZWN0KGFjdHVhbCkgJiYgIXV0aWwuaXNPYmplY3QoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiKSB7XG4gIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGEpIHx8IHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy8gaWYgb25lIGlzIGEgcHJpbWl0aXZlLCB0aGUgb3RoZXIgbXVzdCBiZSBzYW1lXG4gIGlmICh1dGlsLmlzUHJpbWl0aXZlKGEpIHx8IHV0aWwuaXNQcmltaXRpdmUoYikpIHtcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgfVxuICB2YXIgYUlzQXJncyA9IGlzQXJndW1lbnRzKGEpLFxuICAgICAgYklzQXJncyA9IGlzQXJndW1lbnRzKGIpO1xuICBpZiAoKGFJc0FyZ3MgJiYgIWJJc0FyZ3MpIHx8ICghYUlzQXJncyAmJiBiSXNBcmdzKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhSXNBcmdzKSB7XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAga2V5LCBpO1xuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodXRpbC5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW2ZhbHNlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikge3Rocm93IGVycjt9fTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gdHJ1ZTtcbiAgICB2YXIgY3VycmVudFF1ZXVlO1xuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbaV0oKTtcbiAgICAgICAgfVxuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG59XG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHF1ZXVlLnB1c2goZnVuKTtcbiAgICBpZiAoIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpLFxuICBfID0gcmVxdWlyZSgnbG9kYXNoJyksXG4gIHV0aWxzID0gcmVxdWlyZSgnLi4vLi4vcmVuZGVyZXIvdXRpbHMnKSxcbiAgcG9qb1Zpek5vZGUgPSByZXF1aXJlKCcuL05vZGUnKTtcblxudmFyIHJvb3RTdmc7XG52YXIgcHJlZml4ID0gdXRpbHMucHJlZml4ZXI7XG52YXIgZXNjYXBlQ2xzID0gdXRpbHMuZXNjYXBlQ2xzO1xudmFyIGhhc2hDb2RlID0gcmVxdWlyZSgnLi4vLi4vdXRpbC8nKS5oYXNoQ29kZTtcbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9oYXNoS2V5Jyk7XG5cbmZ1bmN0aW9uIGdldFgoZCkge1xuICByZXR1cm4gZC54IC0gZC53aWR0aCAvIDI7XG59XG5cbmZ1bmN0aW9uIGdldFkoZCkge1xuICByZXR1cm4gZC55IC0gZC5oZWlnaHQgLyAyO1xufVxuXG5mdW5jdGlvbiBDYW52YXMoZGF0YSwgZWwpIHtcbiAgYXNzZXJ0KGVsKTtcbiAgdGhpcy5pZCA9IF8udW5pcXVlSWQoKTtcbiAgdGhpcy5kYXRhID0gZGF0YTtcbiAgdGhpcy5jcmVhdGVSb290KGVsKTtcbiAgdGhpcy5zZXQoe1xuICAgIG5vZGVzOiBkYXRhLm5vZGVzLFxuICAgIGVkZ2VzOiBkYXRhLmVkZ2VzXG4gIH0pO1xufVxuXG5DYW52YXMucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5kYXRhID0gbnVsbDtcbiAgcm9vdFN2Z1xuICAgIC5zZWxlY3RBbGwoJyonKVxuICAgIC5yZW1vdmUoKTtcbn07XG5cbkNhbnZhcy5wcm90b3R5cGUuY3JlYXRlUm9vdCA9IGZ1bmN0aW9uKGVsKSB7XG4gIHZhciByb290ID0gZDMuc2VsZWN0KGVsKTtcbiAgYXNzZXJ0KHJvb3RbMF1bMF0sIFwiY2FudmFzIGNvdWxkbid0IGJlIHNlbGVjdGVkXCIpO1xuICByb290LnNlbGVjdEFsbCgnKicpLnJlbW92ZSgpO1xuICByb290U3ZnID0gcm9vdC5hcHBlbmQoJ3N2ZycpO1xuICByb290U3ZnLmF0dHIoJ3N0eWxlJywgJ3dpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCUnKTtcbiAgdGhpcy5yb290ID0gcm9vdFN2Z1xuICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3Jvb3QtJyArIHRoaXMuaWQpO1xufTtcblxuQ2FudmFzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihvYmosIHJlbmRlcikge1xuICB0aGlzLm5vZGVzID0gb2JqLm5vZGVzO1xuICB0aGlzLmVkZ2VzID0gb2JqLmVkZ2VzO1xuICBpZiAocmVuZGVyKSB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxufTtcblxuQ2FudmFzLnByb3RvdHlwZS5maXhab29tID0gZnVuY3Rpb24oKSB7XG4gIHZhciBtZSA9IHRoaXMsXG4gICAgICBzY3IgPSByb290U3ZnLm5vZGUoKSxcbiAgICAgIGJib3ggPSB0aGlzLnJvb3Qubm9kZSgpLmdldEJCb3goKSxcbiAgICAgIHNjcmVlbldpZHRoID0gc2NyLmNsaWVudFdpZHRoLFxuICAgICAgc2NyZWVuSGVpZ2h0ID0gc2NyLmNsaWVudEhlaWdodCxcbiAgICAgIGNhbnZhc1dpZHRoID0gYmJveC53aWR0aCxcbiAgICAgIGNhbnZhc0hlaWdodCA9IGJib3guaGVpZ2h0LFxuICAgICAgc3ggPSB0aGlzLmRhdGEubW4ueCxcbiAgICAgIHN5ID0gdGhpcy5kYXRhLm1uLnksXG4gICAgICBzY2FsZSA9IE1hdGgubWluKFxuICAgICAgICBzY3JlZW5XaWR0aCAvIGNhbnZhc1dpZHRoLFxuICAgICAgICBzY3JlZW5IZWlnaHQgLyBjYW52YXNIZWlnaHRcbiAgICAgICksXG4gICAgICB0cmFuc2xhdGU7XG5cbiAgaWYgKCFpc0Zpbml0ZShzY2FsZSkpIHtcbiAgICBzY2FsZSA9IDA7XG4gIH1cbiAgLy8gY2hhbmdlIHRoZSBzY2FsZSBwcm9wb3J0aW9uYWxseSB0byBpdHMgcHJveGltaXR5IHRvIHplcm9cbiAgc2NhbGUgLT0gc2NhbGUgLyAxMDtcblxuICB0cmFuc2xhdGUgPSBbXG4gICAgLXN4ICogc2NhbGUgKyAoc2NyZWVuV2lkdGggLyAyIC1cbiAgICAgIGNhbnZhc1dpZHRoICogc2NhbGUgLyAyKSxcbiAgICAtc3kgKiBzY2FsZSArIChzY3JlZW5IZWlnaHQgLyAyIC1cbiAgICAgIGNhbnZhc0hlaWdodCAqIHNjYWxlIC8gMilcbiAgXTtcblxuICBmdW5jdGlvbiByZWRyYXcoKSB7XG4gICAgdmFyIHRyYW5zbGF0aW9uID0gZDMuZXZlbnQudHJhbnNsYXRlLFxuICAgICAgICBuZXdYID0gdHJhbnNsYXRpb25bMF0sXG4gICAgICAgIG5ld1kgPSB0cmFuc2xhdGlvblsxXTtcbiAgICBtZS5yb290LmF0dHIoJ3RyYW5zZm9ybScsXG4gICAgICB1dGlscy50cmFuc2Zvcm0oe1xuICAgICAgICB0cmFuc2xhdGU6IFtuZXdYLCBuZXdZXSxcbiAgICAgICAgc2NhbGU6IFtkMy5ldmVudC5zY2FsZV1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHpvb21CZWhhdmlvcih0eXBlKSB7XG4gICAgdmFyIHN0YXJ0ID0gdHlwZSA9PT0gJ3N0YXJ0JztcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoJ2RyYWdnZWQnLCBzdGFydCk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIGNvbnNvbGUubG9nKCdjZW50ZXInLCB0cmFuc2xhdGUpO1xuICAvLyBjb25zb2xlLmxvZyhzY3IuY2xpZW50V2lkdGgsIGJib3gud2lkdGgsIHN4KTtcbiAgdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAub24oJ3pvb21zdGFydCcsIHpvb21CZWhhdmlvcignc3RhcnQnKSlcbiAgICAub24oJ3pvb20nLCByZWRyYXcpXG4gICAgLm9uKCd6b29tZW5kJywgem9vbUJlaGF2aW9yKCdlbmQnKSlcbiAgICAudHJhbnNsYXRlKHRyYW5zbGF0ZSlcbiAgICAuc2NhbGUoc2NhbGUpO1xuXG4gIHJvb3RTdmcuY2FsbCh6b29tKTtcblxuICBtZS5yb290XG4gICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zZm9ybSh7XG4gICAgICBzY2FsZTogW3NjYWxlXSxcbiAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAtc3ggKyAoc2NyZWVuV2lkdGggLyBzY2FsZSAvIDIgLSBjYW52YXNXaWR0aCAvIDIpLFxuICAgICAgICAtc3kgKyAoc2NyZWVuSGVpZ2h0IC8gc2NhbGUgLyAyIC0gY2FudmFzSGVpZ2h0IC8gMilcbiAgICAgIF1cbiAgICB9KSlcbiAgICAuYXR0cignb3BhY2l0eScsIDApXG4gICAgLnRyYW5zaXRpb24oKVxuICAgIC5kdXJhdGlvbig1MDApXG4gICAgLmF0dHIoJ29wYWNpdHknLCAxKTtcbn07XG5cbkNhbnZhcy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucmVuZGVyTm9kZXMoKTtcbiAgdGhpcy5yZW5kZXJFZGdlcygpO1xuICB0aGlzLmZpeFpvb20oKTtcbn07XG5cbkNhbnZhcy5wcm90b3R5cGUucmVuZGVyRWRnZXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG1lID0gdGhpcyxcbiAgICAgIGVkZ2VzID0gdGhpcy5lZGdlcztcblxuICAvLyBDUkVBVEVcbiAgdmFyIGRpYWdvbmFsID0gZDMuc3ZnLmRpYWdvbmFsKClcbiAgLnNvdXJjZShmdW5jdGlvbihkKSB7XG4gICAgdmFyIGZyb20gPSBtZS5yb290LnNlbGVjdCgnLicgK1xuICAgICAgICAgIHByZWZpeChlc2NhcGVDbHMoZC5mcm9tKSlcbiAgICAgICAgKTtcbiAgICBpZiAoIWZyb20ubm9kZSgpKSB7XG4gICAgICB0aHJvdyAnc291cmNlIG5vZGUgbXVzdCBleGlzdCc7XG4gICAgfVxuICAgIHZhciBmcm9tRGF0YSA9IGZyb20uZGF0dW0oKSxcbiAgICAgICAgcHJvcGVydHkgPSBmcm9tLnNlbGVjdCgnLicgKyBwcmVmaXgoXG4gICAgICAgICAgZC5mcm9tLCBoYXNoQ29kZShkLnByb3BlcnR5KVxuICAgICAgICApKSxcbiAgICAgICAgcHJvcGVydHlEYXRhID0gZDMudHJhbnNmb3JtKHByb3BlcnR5LmF0dHIoJ3RyYW5zZm9ybScpKTtcblxuICAgIHJldHVybiB7XG4gICAgICB4OiBnZXRZKGZyb21EYXRhKSArIHByb3BlcnR5RGF0YS50cmFuc2xhdGVbMV0gLSAyLFxuICAgICAgeTogZ2V0WChmcm9tRGF0YSkgKyBwcm9wZXJ0eURhdGEudHJhbnNsYXRlWzBdIC0gMTBcbiAgICB9O1xuICB9KVxuICAudGFyZ2V0KGZ1bmN0aW9uKGQpIHtcbiAgICB2YXIgdG8gPSBtZS5yb290LnNlbGVjdCgnLicgK1xuICAgICAgICAgIHByZWZpeChlc2NhcGVDbHMoZC50bykpXG4gICAgICAgICksXG4gICAgICAgIHRvRGF0YSwgYmJveDtcbiAgICBpZiAoIXRvLm5vZGUoKSkge1xuICAgICAgdGhyb3cgJ3RhcmdldCBub2RlIG11c3QgZXhpc3QnO1xuICAgIH1cbiAgICB0b0RhdGEgPSB0by5kYXR1bSgpO1xuICAgIHJldHVybiB7XG4gICAgICB4OiBnZXRZKHRvRGF0YSkgKyAxMCwvLyArIGJib3guaGVpZ2h0IC8gMixcbiAgICAgIHk6IGdldFgodG9EYXRhKS8vICsgYmJveC53aWR0aCAvIDJcbiAgICB9O1xuICB9KVxuICAucHJvamVjdGlvbihmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIFtkLnksIGQueF07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIG1vdXNlRXZlbnQodHlwZSkge1xuICAgIHZhciBvdmVyID0gdHlwZSA9PT0gJ292ZXInO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgIC5jbGFzc2VkKCdzZWxlY3RlZCcsIG92ZXIpO1xuICAgIH07XG4gIH1cblxuICB0aGlzLnJvb3Quc2VsZWN0QWxsKCcubGluaycpXG4gICAgICAuZGF0YShlZGdlcylcbiAgICAuZW50ZXIoKVxuICAgICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHByZWZpeCgndG8nLCBlc2NhcGVDbHMoZC50bykpLFxuICAgICAgICAgIHByZWZpeCgnZnJvbScsIGVzY2FwZUNscyhkLmZyb20pKSxcbiAgICAgICAgICBwcmVmaXgoJ2xpbmsnKVxuICAgICAgICBdLmpvaW4oJyAnKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignc3Ryb2tlJywgJ2xpZ2h0Z3JheScpXG4gICAgICAuYXR0cignc3Ryb2tlLW9wYWNpdHknLCAwLjMpXG4gICAgICAuYXR0cignZCcsIGRpYWdvbmFsKVxuICAgICAgLm9uKCdtb3VzZW92ZXInLCBtb3VzZUV2ZW50KCdvdmVyJykpXG4gICAgICAub24oJ21vdXNlb3V0JywgbW91c2VFdmVudCgnb3V0JykpO1xufTtcblxuQ2FudmFzLnByb3RvdHlwZS5vcGFjaXR5VG9nZ2xlID0gZnVuY3Rpb24oZGVjcmVhc2UpIHtcbiAgdGhpcy5yb290XG4gICAgLmNsYXNzZWQocHJlZml4KCdub2Rlcy1mb2N1c2VkJyksIGRlY3JlYXNlKTtcbn07XG5cbkNhbnZhcy5wcm90b3R5cGUucmVuZGVyTm9kZXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vZGVzID0gdGhpcy5ub2RlcztcblxuICB2YXIgbm9kZUN0b3IgPSBwb2pvVml6Tm9kZSh0aGlzKTtcbiAgbm9kZUN0b3IubWFyZ2luKHtcbiAgICB0b3A6IDEwLFxuICAgIGxlZnQ6IDEwLFxuICAgIHJpZ2h0OiAxMCxcbiAgICBib3R0b206IDEwXG4gIH0pO1xuICB2YXIgbm9kZUdyb3VwID0gdGhpcy5yb290LnNlbGVjdEFsbChwcmVmaXgoJ25vZGUnKSlcbiAgICAuZGF0YShub2RlcylcbiAgICAuY2FsbChub2RlQ3Rvcik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbnZhczsiLCJ2YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpLFxuICBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICB1dGlscyA9IHJlcXVpcmUoJy4uLy4uL3JlbmRlcmVyL3V0aWxzJyksXG4gIHBvam9WaXpQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcbiAgaGFzaEtleSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaGFzaEtleScpO1xuXG52YXIgcHJlZml4ID0gdXRpbHMucHJlZml4ZXI7XG52YXIgbWFyZ2luID0geyB0b3A6IDAsIHJpZ2h0OiAwLCBsZWZ0OiAwLCBib3R0b206IDAgfTtcblxuZnVuY3Rpb24gTm9kZShwYXJlbnQpIHtcbiAgdmFyIHJvb3QgPSBkMy5zZWxlY3QocGFyZW50LnJvb3QpLm5vZGUoKTtcbiAgZnVuY3Rpb24gbXkoc2VsZWN0aW9uKSB7XG4gICAgLy8gY3JlYXRlXG4gICAgdmFyIGVudGVyID0gc2VsZWN0aW9uLmVudGVyKCk7XG5cbiAgICBmdW5jdGlvbiBncm91cE1vdXNlQmVoYXZpb3IodHlwZSkge1xuICAgICAgdmFyIG92ZXIgPSB0eXBlID09PSAnb3Zlcic7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgdmFyIGhrID0gZC5oYXNoS2V5O1xuXG4gICAgICAgIC8vIGhpZGUgYWxsXG4gICAgICAgIHBhcmVudC5vcGFjaXR5VG9nZ2xlKG92ZXIpO1xuXG4gICAgICAgIC8vIHNlbGVjdCBsaW5rc1xuICAgICAgICByb290XG4gICAgICAgICAgLnNlbGVjdEFsbCgnLicgKyBwcmVmaXgoJ3RvJywgaGspKVxuICAgICAgICAgIC5jbGFzc2VkKCdzZWxlY3RlZCBwcmVkZWNlc3NvcicsIG92ZXIpO1xuICAgICAgICByb290XG4gICAgICAgICAgLnNlbGVjdEFsbCgnLicgKyBwcmVmaXgoJ2Zyb20nLCBoaykpXG4gICAgICAgICAgLmNsYXNzZWQoJ3NlbGVjdGVkIHN1Y2Nlc3NvcicsIG92ZXIpO1xuXG4gICAgICAgIC8vIHNlbGVjdCBjdXJyZW50IG5vZGVcbiAgICAgICAgcm9vdFxuICAgICAgICAgIC5zZWxlY3QoJy4nICsgcHJlZml4KGhrKSlcbiAgICAgICAgICAuY2xhc3NlZCgnc2VsZWN0ZWQgY3VycmVudCcsIG92ZXIpO1xuXG4gICAgICAgIC8vIHNlbGVjdCBwcmVkZWNlc3NvciBub2Rlc1xuICAgICAgICBkLnByZWRlY2Vzc29yc1xuICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICByb290XG4gICAgICAgICAgICAgIC5zZWxlY3RBbGwoJy4nICsgcHJlZml4KHYpKVxuICAgICAgICAgICAgICAuY2xhc3NlZCgnc2VsZWN0ZWQgcHJlZGVjZXNzb3InLCBvdmVyKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBzZWxlY3Qgc3VjY2Vzc29yIG5vZGVzXG4gICAgICAgIGQuc3VjY2Vzc29yc1xuICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICByb290XG4gICAgICAgICAgICAgIC5zZWxlY3RBbGwoJy4nICsgcHJlZml4KHYpKVxuICAgICAgICAgICAgICAuY2xhc3NlZCgnc2VsZWN0ZWQgc3VjY2Vzc29yJywgb3Zlcik7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHZhciBub2RlRW50ZXIgPSBlbnRlclxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAvLyBzdHJpbmcsbnVtYmVyLGJvb2xlYW4udW5kZWZpbmVkLG9iamVjdCxmdW5jdGlvblxuICAgICAgICAvL3ZhciB0eXBlID0gZC5sYWJlbDtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICBwcmVmaXgoJ25vZGUnKSxcbiAgICAgICAgICBwcmVmaXgoZC5oYXNoS2V5KVxuICAgICAgICBdLmpvaW4oJyAnKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLnRyYW5zbGF0ZShcbiAgICAgICAgICBkLnggLSBkLndpZHRoIC8gMixcbiAgICAgICAgICBkLnkgLSBkLmhlaWdodCAvIDJcbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlb3ZlcicsIGdyb3VwTW91c2VCZWhhdmlvcignb3ZlcicpKVxuICAgICAgLm9uKCdtb3VzZW91dCcsIGdyb3VwTW91c2VCZWhhdmlvcignb3V0JykpO1xuXG4gICAgbm9kZUVudGVyXG4gICAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAgIC5hdHRyKCdyeCcsIDUpXG4gICAgICAuYXR0cigncnknLCA1KVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ25vZGUtYmFja2dyb3VuZCcpO1xuXG4gICAgbm9kZUVudGVyXG4gICAgICAvLyAuYXBwZW5kKCdnJylcbiAgICAgIC5hcHBlbmQoJ3RleHQnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBwcmVmaXgoJ3RpdGxlJykpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDIwLCAyNSknKVxuICAgICAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgIHJldHVybiBkLmxhYmVsO1xuICAgICAgICB9KTtcblxuICAgIC8vIG5vZGVFbnRlclxuICAgIC8vICAgLmFwcGVuZCgndGV4dCcpXG4gICAgLy8gICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpXG4gICAgLy8gICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLmxhYmVsOyB9KTtcblxuICAgIHZhciBib2R5RW50ZXIgPSBub2RlRW50ZXJcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBwcmVmaXgoJ2JvZHknKSk7XG5cbiAgICB2YXIgcHJvcGVydHlDdG9yID0gcG9qb1ZpelByb3BlcnR5KCk7XG4gICAgcHJvcGVydHlDdG9yLm1hcmdpbihtYXJnaW4pO1xuICAgIGJvZHlFbnRlci5zZWxlY3RBbGwoJ2cuJyArIHByZWZpeCgncHJvcGVydHknKSlcbiAgICAgIC5kYXRhKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGQucHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgcC5sYWJlbCA9IGQubGFiZWw7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZC5wcm9wZXJ0aWVzO1xuICAgICAgfSlcbiAgICAgIC5jYWxsKHByb3BlcnR5Q3Rvcik7XG5cbiAgICAvLyBmaXggbm9kZSBiYWNrZ3JvdW5kIHdpZHRoL2hlaWdodFxuICAgIHNlbGVjdGlvbi5lYWNoKGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICB2YXIgZWwgPSBkMy5zZWxlY3QodGhpcyksXG4gICAgICAgICAgcmVjdCA9IGVsLnNlbGVjdCgncmVjdC5ub2RlLWJhY2tncm91bmQnKTtcblxuICAgICAgLy8gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYmJveCA9IGVsLm5vZGUoKS5nZXRCQm94KCk7XG4gICAgICByZWN0XG4gICAgICAgIC5hdHRyKCd3aWR0aCcsIGJib3gud2lkdGggKyAyMClcbiAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGJib3guaGVpZ2h0ICsgMjApO1xuICAgICAgLy8gfSwgMCk7XG4gICAgfSk7XG4gIH1cbiAgbXkubWFyZ2luID0gZnVuY3Rpb24gKG0pIHtcbiAgICBpZiAoIW0pIHtcbiAgICAgIHJldHVybiBtYXJnaW47XG4gICAgfVxuICAgIG1hcmdpbiA9IF8ubWVyZ2UobWFyZ2luLCBtKTtcbiAgfTtcbiAgcmV0dXJuIG15O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE5vZGU7IiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgdXRpbHMgPSByZXF1aXJlKCcuLi8uLi9yZW5kZXJlci91dGlscycpO1xudmFyIGhhc2hLZXkgPSByZXF1aXJlKCcuLi8uLi91dGlsL2hhc2hLZXknKTtcbnZhciBwcmVmaXggPSB1dGlscy5wcmVmaXhlcjtcbnZhciBoYXNoQ29kZSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvJykuaGFzaENvZGU7XG5cbmZ1bmN0aW9uIFByb3BlcnR5KCkge1xuICB2YXIgbWFyZ2luID0ge1xuICAgIHRvcDogMCxcbiAgICByaWdodDogMCxcbiAgICBib3R0b206IDAsXG4gICAgbGVmdDogMFxuICB9O1xuXG4gIHZhciB0aXRsZUhlaWdodCA9IDQwO1xuXG4gIGZ1bmN0aW9uIG15KHNlbGVjdGlvbikge1xuXG4gICAgZnVuY3Rpb24gcHJvcGVydHlZKGQsIGkpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIG1hcmdpbi5sZWZ0ICsgMTAsXG4gICAgICAgIG1hcmdpbi50b3AgKyB0aXRsZUhlaWdodCArIGkgKiAxNVxuICAgICAgXTtcbiAgICB9XG5cbiAgICAvLyBQUk9QRVJUWSBDUkVBVEVcbiAgICBmdW5jdGlvbiBtb3VzZUV2ZW50KHR5cGUpIHtcbiAgICAgIHZhciBvdmVyID0gdHlwZSA9PT0gJ292ZXInO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgIC5kdXJhdGlvbigzMDApXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXR1cm4gdXRpbHMudHJhbnNmb3JtKHtcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGU6IHByb3BlcnR5WShkLCBpKSxcbiAgICAgICAgICAgICAgICBzY2FsZTogW292ZXIgPyAxLjUgOiAxXVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XG4gICAgdmFyIHByb3BlcnR5RW50ZXIgPSBzZWxlY3Rpb24uZW50ZXIoKVxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHByZWZpeCgncHJvcGVydHknKSxcbiAgICAgICAgICAvLyBlLmcuIG9iamVjdC0xLWxlbmd0aFxuICAgICAgICAgIHByZWZpeChkLnBhcmVudCwgaGFzaENvZGUoZC5wcm9wZXJ0eSkpXG4gICAgICAgIF0uam9pbignICcpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICByZXR1cm4gdXRpbHMudHJhbnNmb3JtKHtcbiAgICAgICAgICB0cmFuc2xhdGU6IHByb3BlcnR5WShkLCBpKVxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlb3ZlcicsIG1vdXNlRXZlbnQoJ292ZXInKSlcbiAgICAgIC5vbignbW91c2VvdXQnLCBtb3VzZUV2ZW50KCdvdXQnKSk7XG5cbiAgICBwcm9wZXJ0eUVudGVyXG4gICAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC5hdHRyKCdmb250LXNpemUnLCAxMClcbiAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdzdGFydCcpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHByZWZpeCgna2V5JylcbiAgICAgICAgXS5qb2luKCcgJyk7XG4gICAgICB9KVxuICAgICAgLnRleHQoZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIGQucHJvcGVydHk7XG4gICAgICB9KVxuICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIHZhciBsaW5rID0gZC5sYWJlbDtcbiAgICAgICAgdmFyIGV2ID0gbmV3IEN1c3RvbUV2ZW50KCdwcm9wZXJ0eS1jbGljaycsIHtcbiAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgIG5hbWU6IGxpbmssXG4gICAgICAgICAgICBwcm9wZXJ0eTogZC5wcm9wZXJ0eVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXYpO1xuICAgICAgfSk7XG5cbiAgICB2YXIgcmVjdFdyYXAgPSBwcm9wZXJ0eUVudGVyXG4gICAgICAuaW5zZXJ0KCdyZWN0JywgJ3RleHQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICBwcmVmaXgoZC50eXBlKSxcbiAgICAgICAgICBwcmVmaXgoJ3Byb3BlcnR5JywgJ2JhY2tncm91bmQnKVxuICAgICAgICBdLmpvaW4oJyAnKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cigncngnLCAzKVxuICAgICAgLmF0dHIoJ3J5JywgMylcbiAgICAgIC5hdHRyKCd4JywgLTIpXG4gICAgICAuYXR0cigneScsIC05KTtcblxuICAgIHNlbGVjdGlvbi5zZWxlY3RBbGwoJ3JlY3QuJyArIHByZWZpeCgncHJvcGVydHknLCAnYmFja2dyb3VuZCcpKVxuICAgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgdmFyIG1lID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICB2YXIgdGV4dCA9IGQzXG4gICAgICAgICAgICAgIC5zZWxlY3QodGhpcy5wYXJlbnROb2RlKVxuICAgICAgICAgICAgICAuc2VsZWN0KCd0ZXh0Jyk7XG4gICAgICAgICAgICByZXR1cm4gdGV4dC5wcm9wZXJ0eSgnY2xpZW50SGVpZ2h0Jyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgdmFyIHRleHQgPSBkM1xuICAgICAgICAgICAgICAuc2VsZWN0KHRoaXMucGFyZW50Tm9kZSlcbiAgICAgICAgICAgICAgLnNlbGVjdCgndGV4dCcpO1xuICAgICAgICAgICAgcmV0dXJuIHRleHQucHJvcGVydHkoJ2NsaWVudFdpZHRoJykgKyAzO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBwcm9wZXJ0eUVudGVyLmVhY2goZnVuY3Rpb24gKGQpIHtcbiAgICAgIGlmIChkLnR5cGUgPT09ICdvYmplY3QnIHx8IGQudHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgICAgIC5hdHRyKCdyJywgNClcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCBwcmVmaXgoJ2RvdC0nICsgZC50eXBlKSlcbiAgICAgICAgICAuYXR0cignY3gnLCAtMTApXG4gICAgICAgICAgLmF0dHIoJ2N5JywgLTIpXG4gICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBteS5tYXJnaW4gPSBmdW5jdGlvbiAobSkge1xuICAgIGlmICghbSkge1xuICAgICAgcmV0dXJuIG1hcmdpbjtcbiAgICB9XG4gICAgbWFyZ2luID0gXy5tZXJnZShtYXJnaW4sIG0pO1xuICB9O1xuICByZXR1cm4gbXk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvcGVydHk7IiwidmFyIENhbnZhcyA9IHJlcXVpcmUoJy4vQ2FudmFzJyksXG4gIGNhbnZhcyxcbiAgY2FudmFzRWw7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjbGVhcjogZnVuY3Rpb24gKCkge1xuICAgIGlmIChjYW52YXMpIHtcbiAgICAgIGNhbnZhcy5kZXN0cm95KCk7XG4gICAgfVxuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgY2FudmFzID0gbmV3IENhbnZhcyhkYXRhLCBjYW52YXNFbCk7XG4gICAgY2FudmFzLnJlbmRlcigpO1xuICB9LFxuICBzZXRDYW52YXNFbDogZnVuY3Rpb24gKGVsKSB7XG4gICAgY2FudmFzRWwgPSBlbDtcbiAgfVxufTtcblxuLy8gY3VzdG9tIGV2ZW50c1xuZ2xvYmFsLmRvY3VtZW50ICYmIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Byb3BlcnR5LWNsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgdmFyIGRldGFpbCA9IGUuZGV0YWlsO1xuICBnbG9iYWwucG9qb3ZpelxuICAgIC5nZXRDdXJyZW50SW5zcGVjdG9yKClcbiAgICAuc2hvd1NlYXJjaChkZXRhaWwubmFtZSwgZGV0YWlsLnByb3BlcnR5KTtcbn0pOyIsIi8qKlxuICogQ3JlYXRlZCBieSBtYXVyaWNpbyBvbiAyLzE4LzE1LlxuICovXG52YXIgZGFncmUgPSByZXF1aXJlKCdkYWdyZScpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBwb2pvdml6ID0gZ2xvYmFsLnBvam92aXo7XG52YXIgdXRpbHMgPSBwb2pvdml6LnV0aWxzO1xuXG52YXIgcmVuZGVyZXI7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcmVuZGVyZXJzOiB7fSxcblxuICAvKipcbiAgICogR2l2ZW4gYW4gaW5zcGVjdG9yIGluc3RhbmNlIGl0IGJ1aWxkIHRoZSBncmFwaCBhbmQgYWxzbyB0aGVcbiAgICogbGF5b3V0IG9mIHRoZSBub2RlcyBiZWxvbmdpbmcgdG8gaXQsIHRoZSByZXN1bHRpbmcgb2JqZWN0IGlzXG4gICAqIGFuIG9iamVjdCB3aGljaCBpcyB1c2VkIGJ5IGEgcmVuZGVyZXIgdG8gYmUgZHJhd25cbiAgICogQHBhcmFtIHtJbnNwZWN0b3J9IGluc3BlY3RvclxuICAgKi9cbiAgcHJvY2VzczogZnVuY3Rpb24gKGluc3BlY3Rvcikge1xuICAgIGlmIChpbnNwZWN0b3IucmVtb3RlKSB7XG4gICAgICByZXR1cm4gdGhpcy5kb1Byb2Nlc3MoaW5zcGVjdG9yLmpzb24pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5kb1Byb2Nlc3MoaW5zcGVjdG9yLmFuYWx5emVyLnN0cmluZ2lmeSgpKTtcbiAgfSxcbiAgLyoqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBub2Rlc1N0cmluZ2lmaWVkIEFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllc1xuICAgKiAge1xuICAgKiAgICBub2RlczogW3t9LCAuLl0gZWFjaCBvYmplY3QgaXMgZ2VuZXJhdGVkIGluIE9iamVjdEFuYWx5emVyI3N0cmluZ2lmeSxcbiAgICogICAgZWRnZXM6IFt7fSwgLi5dIGVhY2ggb2JqZWN0IGlzIGdlbmVyYXRlZCBpbiBPYmplY3RBbmFseXplciNzdHJpbmdpZnlcbiAgICogIH1cbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSByZXR1cm4gQW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBpbmZvOlxuICAgKiAge1xuICAgKiAgICAgbm9kZXM6IFthcnJheSBvZiBvYmplY3RzLCBlYWNoIGhhdmluZyBsYWJlbCx4LHksaGVpZ2h0LFxuICAgKiAgICAgICAgICAgIHdpZHRoLHByb3BlcnRpZXMsc3VjY2Vzc29ycyxwcmVkZWNlc3NvcnNdLFxuICAgKiAgICAgZWRnZXM6IFthcnJheSBvZiBvYmplY3RzLCBlYWNoIGhhdmluZyB0byxmcm9tLHByb3BlcnR5XSxcbiAgICogICAgIGNlbnRlcjogYW4gb2JqZWN0IHdpdGggdGhlIGNlbnRlciBvZiB0aGUgYmJveCB0aGF0IGNvdmVyc1xuICAgKiAgICAgICAgICAgIHRoZSBsYXlvdXQgb2YgdGhlIGdyYXBoXG4gICAqICAgICBtbjogYW4gb2JqZWN0IHdpdGggaW5mbyBhYm91dCB0aGUgbWluaW11bSB4LHkgb2YgdGhlIGJib3hcbiAgICogICAgICAgICAgICB0aGF0IGNvdmVycyB0aGUgbGF5b3V0IG9mIHRoZSBncmFwaFxuICAgKiAgICAgbXg6IGFuIG9iamVjdCB3aXRoIGluZm8gYWJvdXQgdGhlIG1heGltdW0geCx5IG9mIHRoZSBiYm94XG4gICAqICAgICAgICAgICAgdGhhdCBjb3ZlcnMgdGhlIGxheW91dCBvZiB0aGUgZ3JhcGhcbiAgICogIH1cbiAgICovXG4gIGRvUHJvY2VzczogZnVuY3Rpb24gKG5vZGVzU3RyaW5naWZpZWQpIHtcbiAgICB2YXIgZyA9IG5ldyBkYWdyZS5EaWdyYXBoKCksXG4gICAgICBub2RlLFxuICAgICAgbGlicmFyeUxhYmVscyA9IG5vZGVzU3RyaW5naWZpZWQubGFiZWxzLFxuICAgICAgbGlicmFyeU5vZGVzID0gbm9kZXNTdHJpbmdpZmllZC5ub2RlcyxcbiAgICAgIGxpYnJhcnlFZGdlcyA9IG5vZGVzU3RyaW5naWZpZWQuZWRnZXM7XG5cbiAgICAvLyBjcmVhdGUgdGhlIGdyYXBoXG4gICAgLy8gZWFjaCBlbGVtZW50IG9mIHRoZSBncmFwaCBoYXNcbiAgICAvLyAtIGxhYmVsXG4gICAgLy8gLSB3aWR0aFxuICAgIC8vIC0gaGVpZ2h0XG4gICAgLy8gLSBwcm9wZXJ0aWVzXG4gICAgXy5mb3JPd24obGlicmFyeU5vZGVzLCBmdW5jdGlvbiAocHJvcGVydGllcywgaykge1xuICAgICAgdmFyIGxhYmVsID0gbGlicmFyeUxhYmVsc1trXVswXS5sYWJlbDtcbiAgICAgIG5vZGUgPSB7XG4gICAgICAgIGhhc2hLZXk6IGssXG4gICAgICAgIGxhYmVsOiBsYWJlbCxcbiAgICAgICAgd2lkdGg6IGxhYmVsLmxlbmd0aCAqIDEwXG4gICAgICB9O1xuICAgICAgLy8gbGluZXMgKyBoZWFkZXIgKyBwYWRkaW5nIGJvdHRvbVxuICAgICAgbm9kZS5oZWlnaHQgPSBwcm9wZXJ0aWVzLmxlbmd0aCAqIDE1ICsgNTA7XG4gICAgICBub2RlLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIG5vZGUud2lkdGggPSBNYXRoLm1heChub2RlLndpZHRoLCB2LnByb3BlcnR5Lmxlbmd0aCAqIDEwKTtcbiAgICAgIH0pO1xuICAgICAgZy5hZGROb2RlKGssIG5vZGUpO1xuICAgIH0pO1xuXG4gICAgLy8gYnVpbGQgdGhlIGVkZ2VzIGZyb20gbm9kZSB0byBub2RlXG4gICAgXy5mb3JPd24obGlicmFyeUVkZ2VzLCBmdW5jdGlvbiAobGlua3MpIHtcbiAgICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgICAgaWYgKGcuaGFzTm9kZShsaW5rLmZyb20pICYmIGcuaGFzTm9kZShsaW5rLnRvKSkge1xuICAgICAgICAgIGcuYWRkRWRnZShudWxsLCBsaW5rLmZyb20sIGxpbmsudG8pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIGdlbmVyYXRlIHRoZSBncmFwaCBsYXlvdXRcbiAgICB2YXIgbGF5b3V0ID0gZGFncmUubGF5b3V0KClcbiAgICAgIC5ub2RlU2VwKDMwKVxuICAgICAgLy8gLnJhbmtTZXAoNzApXG4gICAgICAvLyAucmFua0RpcignVEInKVxuICAgICAgLnJ1bihnKTtcblxuICAgIHZhciBub2RlcyA9IFtdLFxuICAgICAgZWRnZXMgPSBbXSxcbiAgICAgIGNlbnRlciA9IHt4OiAwLCB5OiAwfSxcbiAgICAgIG1uID0ge3g6IEluZmluaXR5LCB5OiBJbmZpbml0eX0sXG4gICAgICBteCA9IHt4OiAtSW5maW5pdHksIHk6IC1JbmZpbml0eX0sXG4gICAgICB0b3RhbCA9IGcubm9kZXMoKS5sZW5ndGg7XG5cbiAgICAvLyB1cGRhdGUgdGhlIG5vZGUgaW5mbyBhZGRpbmc6XG4gICAgLy8gLSB4ICh4LWNvb3JkaW5hdGUgb2YgdGhlIGNlbnRlciBvZiB0aGUgbm9kZSlcbiAgICAvLyAtIHkgKHktY29vcmRpbmF0ZSBvZiB0aGUgY2VudGVyIG9mIHRoZSBub2RlKVxuICAgIC8vIC0gcHJlZGVjZXNzb3JzIChhbiBhcnJheSB3aXRoIHRoZSBpZGVudGlmaWVycyBvZiB0aGUgcHJlZGVjZXNzb3JzIG9mIHRoaXMgbm9kZSlcbiAgICAvLyAtIHN1Y2Nlc3NvcnMgKGFuIGFycmF5IHdpdGggdGhlIGlkZW50aWZpZXJzIG9mIHRoZSBzdWNjZXNzb3Igb2YgdGhpcyBub2RlKVxuICAgIGxheW91dC5lYWNoTm9kZShmdW5jdGlvbiAoaywgbGF5b3V0SW5mbykge1xuICAgICAgdmFyIHggPSBsYXlvdXRJbmZvLng7XG4gICAgICB2YXIgeSA9IGxheW91dEluZm8ueTtcblxuICAgICAgbm9kZSA9IGcubm9kZShrKTtcbiAgICAgIG5vZGUueCA9IHg7XG4gICAgICBub2RlLnkgPSB5O1xuICAgICAgbm9kZS5wcmVkZWNlc3NvcnMgPSBnLnByZWRlY2Vzc29ycyhrKTtcbiAgICAgIG5vZGUuc3VjY2Vzc29ycyA9IGcuc3VjY2Vzc29ycyhrKTtcbiAgICAgIG5vZGVzLnB1c2gobm9kZSk7XG5cbiAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgYmJveCBvZiB0aGUgZ3JhcGggdG8gY2VudGVyIHRoZSBncmFwaFxuICAgICAgdmFyIG1ueCA9IHggLSBub2RlLndpZHRoIC8gMjtcbiAgICAgIHZhciBtbnkgPSB5IC0gbm9kZS5oZWlnaHQgLyAyO1xuICAgICAgdmFyIG14eCA9IHggKyBub2RlLndpZHRoIC8gMjtcbiAgICAgIHZhciBteHkgPSB5ICsgbm9kZS5oZWlnaHQgLyAyO1xuXG4gICAgICBjZW50ZXIueCArPSB4O1xuICAgICAgY2VudGVyLnkgKz0geTtcbiAgICAgIG1uLnggPSBNYXRoLm1pbihtbi54LCBtbngpO1xuICAgICAgbW4ueSA9IE1hdGgubWluKG1uLnksIG1ueSk7XG4gICAgICAvLyBjb25zb2xlLmxvZyh4LCB5LCAnIGRpbSAnLCBub2RlLndpZHRoLCBub2RlLmhlaWdodCk7XG4gICAgICBteC54ID0gTWF0aC5tYXgobXgueCwgbXh4KTtcbiAgICAgIG14LnkgPSBNYXRoLm1heChteC55LCBteHkpO1xuICAgIH0pO1xuXG4gICAgY2VudGVyLnggLz0gKHRvdGFsIHx8IDEpO1xuICAgIGNlbnRlci55IC89ICh0b3RhbCB8fCAxKTtcblxuICAgIC8vIGNyZWF0ZSB0aGUgZWRnZXMgZnJvbSBwcm9wZXJ0eSB0byBub2RlXG4gICAgXy5mb3JPd24obGlicmFyeUVkZ2VzLCBmdW5jdGlvbiAobGlua3MpIHtcbiAgICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgICAgaWYgKGcuaGFzTm9kZShsaW5rLmZyb20pICYmIGcuaGFzTm9kZShsaW5rLnRvKSkge1xuICAgICAgICAgIGVkZ2VzLnB1c2gobGluayk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGVkZ2VzOiBlZGdlcyxcbiAgICAgIG5vZGVzOiBub2RlcyxcbiAgICAgIGNlbnRlcjogY2VudGVyLFxuICAgICAgbW46IG1uLFxuICAgICAgbXg6IG14XG4gICAgfTtcbiAgfSxcblxuICAvKipcbiAgICogRHJhd3MgdGhlIGN1cnJlbnQgaW5zcGVjdG9yIGluIHRoZSBjYW52YXMgd2l0aCB0aGUgZm9sbG93aW5nIHN0ZXBzOlxuICAgKlxuICAgKiAtIGNsZWFycyB0aGUgY2FudmFzXG4gICAqIC0gcHJvY2Vzc2VzIHRoZSBkYXRhIG9mIHRoZSBjdXJyZW50IGluc3BlY3RvclxuICAgKiAtIHJlbmRlcnMgdGhlIGRhdGEgcHJvZHVjZWQgYnkgdGhlIG1ldGhvZCBhYm92ZVxuICAgKiAtIG5vdGlmaWVzIHRoZSB1c2VyIG9mIGFueSBhY3Rpb24gcGVyZm9ybWVkXG4gICAqXG4gICAqIEBwYXJhbSB7SW5zcGVjdG9yfSBbaW5zcGVjdG9yXVxuICAgKiBAcGFyYW0ge09iamVjdH0gW3JlbmRlcmVyXVxuICAgKi9cbiAgcmVuZGVyOiBmdW5jdGlvbiAoaW5zcGVjdG9yLCByZW5kZXJlcikge1xuICAgIHZhciBkYXRhO1xuICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICBpbnNwZWN0b3IgPSBpbnNwZWN0b3IgfHwgcG9qb3Zpei5nZXRDdXJyZW50SW5zcGVjdG9yKCk7XG4gICAgcmVuZGVyZXIgPSByZW5kZXJlciB8fCBwb2pvdml6LmRyYXcuZ2V0Q3VycmVudFJlbmRlcmVyKCk7XG5cbiAgICB1dGlscy5ub3RpZmljYXRpb24oJ3Byb2Nlc3NpbmcgJyArIGluc3BlY3Rvci5lbnRyeVBvaW50KTtcbiAgICB1dGlscy5maXJlR2xvYmFsRXZlbnQoJ3Bvam92aXotcmVuZGVyLXN0YXJ0Jyk7XG5cbiAgICAvLyBwcmUgcmVuZGVyXG4gICAgcmVuZGVyZXIuY2xlYXIoKTtcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaW5zcGVjdG9yLnByZVJlbmRlcigpO1xuICAgICAgY29uc29sZS5sb2coJ3Byb2Nlc3MgJiByZW5kZXIgc3RhcnQ6ICcsIG5ldyBEYXRlKCkpO1xuICAgICAgLy8gZGF0YTpcbiAgICAgIC8vIC0gZWRnZXMgKHByb3BlcnR5IC0+IG5vZGUpXG4gICAgICAvLyAtIG5vZGVzXG4gICAgICAvLyAtIGNlbnRlclxuICAgICAgY29uc29sZS50aW1lKCdwcm9jZXNzJyk7XG4gICAgICBkYXRhID0gbWUucHJvY2VzcyhpbnNwZWN0b3IpO1xuICAgICAgY29uc29sZS50aW1lRW5kKCdwcm9jZXNzJyk7XG5cbiAgICAgIHV0aWxzLm5vdGlmaWNhdGlvbigncmVuZGVyaW5nICcgKyAoaW5zcGVjdG9yLmRpc3BsYXlOYW1lIHx8IGluc3BlY3Rvci5lbnRyeVBvaW50KSk7XG5cbiAgICAgIGNvbnNvbGUudGltZSgncmVuZGVyJyk7XG4gICAgICByZW5kZXJlci5yZW5kZXIoZGF0YSk7XG4gICAgICBjb25zb2xlLnRpbWVFbmQoJ3JlbmRlcicpO1xuXG4gICAgICB1dGlscy5maXJlR2xvYmFsRXZlbnQoJ3Bvam92aXotcmVuZGVyLWVuZCcpO1xuICAgICAgdXRpbHMubm90aWZpY2F0aW9uKCdjb21wbGV0ZSEnKTtcbiAgICB9LCAwKTtcbiAgfSxcblxuICAvKipcbiAgICogQWRkcyBhIHJlbmRlcmVyIHRvIHRoZSBhdmFpbGFibGUgcmVuZGVyZXJzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIEl0IG5lZWRzIHRvIGhhdmUgdGhlIGZvbGxvd2luZyBtZXRob2RzOlxuICAgKiAgLSBjbGVhclxuICAgKiAgLSByZW5kZXJcbiAgICovXG4gIGFkZFJlbmRlcmVyOiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIC8vIHRoZSByZW5kZXJlciBtdXN0IGJlIGFuIG9iamVjdCBhbmQgaGF2ZSB0aGUgZm9sbG93aW5nIG1ldGhvZHM6XG4gICAgLy8gLSByZW5kZXJcbiAgICAvLyAtIGNsZWFyXG4gICAgYXNzZXJ0KHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcsICd2YWx1ZSBpcyBub3QgYW4gb2JqZWN0Jyk7XG4gICAgYXNzZXJ0KHZhbHVlLmNsZWFyICYmIHZhbHVlLnJlbmRlciwgJ2NsZWFyICYgcmVuZGVyIG11c3QgYmUgZGVmaW5lZCBvbiBvYmplY3QnKTtcbiAgICB0aGlzLnJlbmRlcmVyc1trZXldID0gdmFsdWU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHZhbHVlIG9mIHRoZSBjdXJyZW50IHJlbmRlcmVyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByXG4gICAqL1xuICBzZXRSZW5kZXJlcjogZnVuY3Rpb24gKHIpIHtcbiAgICByZW5kZXJlciA9IHRoaXMucmVuZGVyZXJzW3JdO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIGEgcmVuZGVyZXIgYnkga2V5XG4gICAqIEBwYXJhbSBrZXlcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBnZXRSZW5kZXJlcjogZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcmVyc1trZXldO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHJlbmRlcmVyXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgZ2V0Q3VycmVudFJlbmRlcmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyO1xuICB9XG59OyIsIi8qKlxuICogQGF1dGhvciBxaWFvIC8gaHR0cHM6Ly9naXRodWIuY29tL3FpYW9cbiAqIEBhdXRob3IgbXJkb29iIC8gaHR0cDovL21yZG9vYi5jb21cbiAqIEBhdXRob3IgYWx0ZXJlZHEgLyBodHRwOi8vYWx0ZXJlZHF1YWxpYS5jb20vXG4gKiBAYXV0aG9yIFdlc3RMYW5nbGV5IC8gaHR0cDovL2dpdGh1Yi5jb20vV2VzdExhbmdsZXlcbiAqIEBhdXRob3IgZXJpY2g2NjYgLyBodHRwOi8vZXJpY2hhaW5lcy5jb21cbiAqL1xuLypnbG9iYWwgVEhSRUUsIGNvbnNvbGUgKi9cblxuLy8gVGhpcyBzZXQgb2YgY29udHJvbHMgcGVyZm9ybXMgb3JiaXRpbmcsIGRvbGx5aW5nICh6b29taW5nKSwgYW5kIHBhbm5pbmcuIEl0IG1haW50YWluc1xuLy8gdGhlIFwidXBcIiBkaXJlY3Rpb24gYXMgK1ksIHVubGlrZSB0aGUgVHJhY2tiYWxsQ29udHJvbHMuIFRvdWNoIG9uIHRhYmxldCBhbmQgcGhvbmVzIGlzXG4vLyBzdXBwb3J0ZWQuXG4vL1xuLy8gICAgT3JiaXQgLSBsZWZ0IG1vdXNlIC8gdG91Y2g6IG9uZSBmaW5nZXIgbW92ZVxuLy8gICAgWm9vbSAtIG1pZGRsZSBtb3VzZSwgb3IgbW91c2V3aGVlbCAvIHRvdWNoOiB0d28gZmluZ2VyIHNwcmVhZCBvciBzcXVpc2hcbi8vICAgIFBhbiAtIHJpZ2h0IG1vdXNlLCBvciBhcnJvdyBrZXlzIC8gdG91Y2g6IHRocmVlIGZpbnRlciBzd2lwZVxuLy9cbi8vIFRoaXMgaXMgYSBkcm9wLWluIHJlcGxhY2VtZW50IGZvciAobW9zdCkgVHJhY2tiYWxsQ29udHJvbHMgdXNlZCBpbiBleGFtcGxlcy5cbi8vIFRoYXQgaXMsIGluY2x1ZGUgdGhpcyBqcyBmaWxlIGFuZCB3aGVyZXZlciB5b3Ugc2VlOlxuLy8gICAgICBjb250cm9scyA9IG5ldyBUSFJFRS5UcmFja2JhbGxDb250cm9scyggY2FtZXJhICk7XG4vLyAgICAgIGNvbnRyb2xzLnRhcmdldC56ID0gMTUwO1xuLy8gU2ltcGxlIHN1YnN0aXR1dGUgXCJQYW5Db250cm9sc1wiIGFuZCB0aGUgY29udHJvbCBzaG91bGQgd29yayBhcy1pcy5cblxuVEhSRUUuUGFuQ29udHJvbHMgPSBmdW5jdGlvbiAoIG9iamVjdCwgZG9tRWxlbWVudCApIHtcblxuXHR0aGlzLm9iamVjdCA9IG9iamVjdDtcblx0dGhpcy5kb21FbGVtZW50ID0gKCBkb21FbGVtZW50ICE9PSB1bmRlZmluZWQgKSA/IGRvbUVsZW1lbnQgOiBkb2N1bWVudDtcblxuXHQvLyBBUElcblxuXHQvLyBTZXQgdG8gZmFsc2UgdG8gZGlzYWJsZSB0aGlzIGNvbnRyb2xcblx0dGhpcy5lbmFibGVkID0gdHJ1ZTtcblxuXHQvLyBcInRhcmdldFwiIHNldHMgdGhlIGxvY2F0aW9uIG9mIGZvY3VzLCB3aGVyZSB0aGUgY29udHJvbCBvcmJpdHMgYXJvdW5kXG5cdC8vIGFuZCB3aGVyZSBpdCBwYW5zIHdpdGggcmVzcGVjdCB0by5cblx0dGhpcy50YXJnZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdC8vIGNlbnRlciBpcyBvbGQsIGRlcHJlY2F0ZWQ7IHVzZSBcInRhcmdldFwiIGluc3RlYWRcblx0dGhpcy5jZW50ZXIgPSB0aGlzLnRhcmdldDtcblxuXHQvLyBUaGlzIG9wdGlvbiBhY3R1YWxseSBlbmFibGVzIGRvbGx5aW5nIGluIGFuZCBvdXQ7IGxlZnQgYXMgXCJ6b29tXCIgZm9yXG5cdC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG5cdHRoaXMubm9ab29tID0gZmFsc2U7XG5cdHRoaXMuem9vbVNwZWVkID0gMS4wO1xuXG5cdC8vIExpbWl0cyB0byBob3cgZmFyIHlvdSBjYW4gZG9sbHkgaW4gYW5kIG91dFxuXHR0aGlzLm1pbkRpc3RhbmNlID0gMDtcblx0dGhpcy5tYXhEaXN0YW5jZSA9IEluZmluaXR5O1xuXG5cdC8vIFNldCB0byB0cnVlIHRvIGRpc2FibGUgdGhpcyBjb250cm9sXG5cdHRoaXMubm9Sb3RhdGUgPSBmYWxzZTtcblx0dGhpcy5yb3RhdGVTcGVlZCA9IDEuMDtcblxuXHQvLyBTZXQgdG8gdHJ1ZSB0byBkaXNhYmxlIHRoaXMgY29udHJvbFxuXHR0aGlzLm5vUGFuID0gZmFsc2U7XG5cdHRoaXMua2V5UGFuU3BlZWQgPSA3LjA7XHQvLyBwaXhlbHMgbW92ZWQgcGVyIGFycm93IGtleSBwdXNoXG5cblx0Ly8gU2V0IHRvIHRydWUgdG8gYXV0b21hdGljYWxseSByb3RhdGUgYXJvdW5kIHRoZSB0YXJnZXRcblx0dGhpcy5hdXRvUm90YXRlID0gZmFsc2U7XG5cdHRoaXMuYXV0b1JvdGF0ZVNwZWVkID0gMi4wOyAvLyAzMCBzZWNvbmRzIHBlciByb3VuZCB3aGVuIGZwcyBpcyA2MFxuXG5cdC8vIEhvdyBmYXIgeW91IGNhbiBvcmJpdCB2ZXJ0aWNhbGx5LCB1cHBlciBhbmQgbG93ZXIgbGltaXRzLlxuXHQvLyBSYW5nZSBpcyAwIHRvIE1hdGguUEkgcmFkaWFucy5cblx0dGhpcy5taW5Qb2xhckFuZ2xlID0gMDsgLy8gcmFkaWFuc1xuXHR0aGlzLm1heFBvbGFyQW5nbGUgPSBNYXRoLlBJOyAvLyByYWRpYW5zXG5cblx0Ly8gU2V0IHRvIHRydWUgdG8gZGlzYWJsZSB1c2Ugb2YgdGhlIGtleXNcblx0dGhpcy5ub0tleXMgPSBmYWxzZTtcblxuXHQvLyBUaGUgZm91ciBhcnJvdyBrZXlzXG5cdHRoaXMua2V5cyA9IHsgTEVGVDogMzcsIFVQOiAzOCwgUklHSFQ6IDM5LCBCT1RUT006IDQwIH07XG5cblx0Ly8vLy8vLy8vLy8vXG5cdC8vIGludGVybmFsc1xuXG5cdHZhciBzY29wZSA9IHRoaXM7XG5cblx0dmFyIEVQUyA9IDAuMDAwMDAxO1xuXG5cdHZhciByb3RhdGVTdGFydCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciByb3RhdGVFbmQgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXHR2YXIgcm90YXRlRGVsdGEgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXG5cdHZhciBwYW5TdGFydCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciBwYW5FbmQgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXHR2YXIgcGFuRGVsdGEgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXHR2YXIgcGFuT2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuXHR2YXIgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuXHR2YXIgZG9sbHlTdGFydCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciBkb2xseUVuZCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciBkb2xseURlbHRhID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblxuXHR2YXIgcGhpRGVsdGEgPSAwO1xuXHR2YXIgdGhldGFEZWx0YSA9IDA7XG5cdHZhciBzY2FsZSA9IDE7XG5cdHZhciBwYW4gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdHZhciBsYXN0UG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXHR2YXIgbGFzdFF1YXRlcm5pb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG5cdHZhciBTVEFURSA9IHsgTk9ORSA6IC0xLCBST1RBVEUgOiAwLCBET0xMWSA6IDEsIFBBTiA6IDIsIFRPVUNIX1JPVEFURSA6IDMsIFRPVUNIX0RPTExZIDogNCwgVE9VQ0hfUEFOIDogNSB9O1xuXG5cdHZhciBzdGF0ZSA9IFNUQVRFLk5PTkU7XG5cblx0Ly8gZm9yIHJlc2V0XG5cblx0dGhpcy50YXJnZXQwID0gdGhpcy50YXJnZXQuY2xvbmUoKTtcblx0dGhpcy5wb3NpdGlvbjAgPSB0aGlzLm9iamVjdC5wb3NpdGlvbi5jbG9uZSgpO1xuXG5cdC8vIHNvIGNhbWVyYS51cCBpcyB0aGUgb3JiaXQgYXhpc1xuXG5cdHZhciBxdWF0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tVW5pdFZlY3RvcnMoIG9iamVjdC51cCwgbmV3IFRIUkVFLlZlY3RvcjMoIDAsIDEsIDAgKSApO1xuXHR2YXIgcXVhdEludmVyc2UgPSBxdWF0LmNsb25lKCkuaW52ZXJzZSgpO1xuXG5cdC8vIGV2ZW50c1xuXG5cdHZhciBjaGFuZ2VFdmVudCA9IHsgdHlwZTogJ2NoYW5nZScgfTtcblx0dmFyIHN0YXJ0RXZlbnQgPSB7IHR5cGU6ICdzdGFydCd9O1xuXHR2YXIgZW5kRXZlbnQgPSB7IHR5cGU6ICdlbmQnfTtcblxuXHR0aGlzLnJvdGF0ZUxlZnQgPSBmdW5jdGlvbiAoIGFuZ2xlICkge1xuXG5cdFx0aWYgKCBhbmdsZSA9PT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHRhbmdsZSA9IGdldEF1dG9Sb3RhdGlvbkFuZ2xlKCk7XG5cblx0XHR9XG5cblx0XHR0aGV0YURlbHRhIC09IGFuZ2xlO1xuXG5cdH07XG5cblx0dGhpcy5yb3RhdGVVcCA9IGZ1bmN0aW9uICggYW5nbGUgKSB7XG5cblx0XHRpZiAoIGFuZ2xlID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdGFuZ2xlID0gZ2V0QXV0b1JvdGF0aW9uQW5nbGUoKTtcblxuXHRcdH1cblxuXHRcdHBoaURlbHRhIC09IGFuZ2xlO1xuXG5cdH07XG5cblx0Ly8gcGFzcyBpbiBkaXN0YW5jZSBpbiB3b3JsZCBzcGFjZSB0byBtb3ZlIGxlZnRcblx0dGhpcy5wYW5MZWZ0ID0gZnVuY3Rpb24gKCBkaXN0YW5jZSApIHtcblxuXHRcdHZhciB0ZSA9IHRoaXMub2JqZWN0Lm1hdHJpeC5lbGVtZW50cztcblxuXHRcdC8vIGdldCBYIGNvbHVtbiBvZiBtYXRyaXhcblx0XHRwYW5PZmZzZXQuc2V0KCB0ZVsgMCBdLCB0ZVsgMSBdLCB0ZVsgMiBdICk7XG5cdFx0cGFuT2Zmc2V0Lm11bHRpcGx5U2NhbGFyKCAtIGRpc3RhbmNlICk7XG5cblx0XHRwYW4uYWRkKCBwYW5PZmZzZXQgKTtcblxuXHR9O1xuXG5cdC8vIHBhc3MgaW4gZGlzdGFuY2UgaW4gd29ybGQgc3BhY2UgdG8gbW92ZSB1cFxuXHR0aGlzLnBhblVwID0gZnVuY3Rpb24gKCBkaXN0YW5jZSApIHtcblxuXHRcdHZhciB0ZSA9IHRoaXMub2JqZWN0Lm1hdHJpeC5lbGVtZW50cztcblxuXHRcdC8vIGdldCBZIGNvbHVtbiBvZiBtYXRyaXhcblx0XHRwYW5PZmZzZXQuc2V0KCB0ZVsgNCBdLCB0ZVsgNSBdLCB0ZVsgNiBdICk7XG5cdFx0cGFuT2Zmc2V0Lm11bHRpcGx5U2NhbGFyKCBkaXN0YW5jZSApO1xuXG5cdFx0cGFuLmFkZCggcGFuT2Zmc2V0ICk7XG5cblx0fTtcblxuXHQvLyBwYXNzIGluIHgseSBvZiBjaGFuZ2UgZGVzaXJlZCBpbiBwaXhlbCBzcGFjZSxcblx0Ly8gcmlnaHQgYW5kIGRvd24gYXJlIHBvc2l0aXZlXG5cdHRoaXMucGFuID0gZnVuY3Rpb24gKCBkZWx0YVgsIGRlbHRhWSApIHtcblxuXHRcdHZhciBlbGVtZW50ID0gc2NvcGUuZG9tRWxlbWVudCA9PT0gZG9jdW1lbnQgPyBzY29wZS5kb21FbGVtZW50LmJvZHkgOiBzY29wZS5kb21FbGVtZW50O1xuXG5cdFx0aWYgKCBzY29wZS5vYmplY3QuZm92ICE9PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdC8vIHBlcnNwZWN0aXZlXG5cdFx0XHR2YXIgcG9zaXRpb24gPSBzY29wZS5vYmplY3QucG9zaXRpb247XG5cdFx0XHR2YXIgb2Zmc2V0ID0gcG9zaXRpb24uY2xvbmUoKS5zdWIoIHNjb3BlLnRhcmdldCApO1xuXHRcdFx0dmFyIHRhcmdldERpc3RhbmNlID0gb2Zmc2V0Lmxlbmd0aCgpO1xuXG5cdFx0XHQvLyBoYWxmIG9mIHRoZSBmb3YgaXMgY2VudGVyIHRvIHRvcCBvZiBzY3JlZW5cblx0XHRcdHRhcmdldERpc3RhbmNlICo9IE1hdGgudGFuKCAoIHNjb3BlLm9iamVjdC5mb3YgLyAyICkgKiBNYXRoLlBJIC8gMTgwLjAgKTtcblxuXHRcdFx0Ly8gd2UgYWN0dWFsbHkgZG9uJ3QgdXNlIHNjcmVlbldpZHRoLCBzaW5jZSBwZXJzcGVjdGl2ZSBjYW1lcmEgaXMgZml4ZWQgdG8gc2NyZWVuIGhlaWdodFxuXHRcdFx0c2NvcGUucGFuTGVmdCggMiAqIGRlbHRhWCAqIHRhcmdldERpc3RhbmNlIC8gZWxlbWVudC5jbGllbnRIZWlnaHQgKTtcblx0XHRcdHNjb3BlLnBhblVwKCAyICogZGVsdGFZICogdGFyZ2V0RGlzdGFuY2UgLyBlbGVtZW50LmNsaWVudEhlaWdodCApO1xuXG5cdFx0fSBlbHNlIGlmICggc2NvcGUub2JqZWN0LnRvcCAhPT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHQvLyBvcnRob2dyYXBoaWNcblx0XHRcdHNjb3BlLnBhbkxlZnQoIGRlbHRhWCAqIChzY29wZS5vYmplY3QucmlnaHQgLSBzY29wZS5vYmplY3QubGVmdCkgLyBlbGVtZW50LmNsaWVudFdpZHRoICk7XG5cdFx0XHRzY29wZS5wYW5VcCggZGVsdGFZICogKHNjb3BlLm9iamVjdC50b3AgLSBzY29wZS5vYmplY3QuYm90dG9tKSAvIGVsZW1lbnQuY2xpZW50SGVpZ2h0ICk7XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHQvLyBjYW1lcmEgbmVpdGhlciBvcnRob2dyYXBoaWMgb3IgcGVyc3BlY3RpdmVcblx0XHRcdGNvbnNvbGUud2FybiggJ1dBUk5JTkc6IFBhbkNvbnRyb2xzLmpzIGVuY291bnRlcmVkIGFuIHVua25vd24gY2FtZXJhIHR5cGUgLSBwYW4gZGlzYWJsZWQuJyApO1xuXG5cdFx0fVxuXG5cdH07XG5cblx0dGhpcy5kb2xseUluID0gZnVuY3Rpb24gKCBkb2xseVNjYWxlICkge1xuXG5cdFx0aWYgKCBkb2xseVNjYWxlID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdGRvbGx5U2NhbGUgPSBnZXRab29tU2NhbGUoKTtcblxuXHRcdH1cblxuXHRcdHNjYWxlIC89IGRvbGx5U2NhbGU7XG5cblx0fTtcblxuXHR0aGlzLmRvbGx5T3V0ID0gZnVuY3Rpb24gKCBkb2xseVNjYWxlICkge1xuXG5cdFx0aWYgKCBkb2xseVNjYWxlID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdGRvbGx5U2NhbGUgPSBnZXRab29tU2NhbGUoKTtcblxuXHRcdH1cblxuXHRcdHNjYWxlICo9IGRvbGx5U2NhbGU7XG5cblx0fTtcblxuXHR0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBwb3NpdGlvbiA9IHRoaXMub2JqZWN0LnBvc2l0aW9uO1xuXG5cdFx0b2Zmc2V0LmNvcHkoIHBvc2l0aW9uICkuc3ViKCB0aGlzLnRhcmdldCApO1xuXG5cdFx0Ly8gcm90YXRlIG9mZnNldCB0byBcInktYXhpcy1pcy11cFwiIHNwYWNlXG5cdFx0b2Zmc2V0LmFwcGx5UXVhdGVybmlvbiggcXVhdCApO1xuXG5cdFx0Ly8gYW5nbGUgZnJvbSB6LWF4aXMgYXJvdW5kIHktYXhpc1xuXG5cdFx0dmFyIHRoZXRhID0gTWF0aC5hdGFuMiggb2Zmc2V0LngsIG9mZnNldC56ICk7XG5cblx0XHQvLyBhbmdsZSBmcm9tIHktYXhpc1xuXG5cdFx0dmFyIHBoaSA9IE1hdGguYXRhbjIoIE1hdGguc3FydCggb2Zmc2V0LnggKiBvZmZzZXQueCArIG9mZnNldC56ICogb2Zmc2V0LnogKSwgb2Zmc2V0LnkgKTtcblxuXHRcdGlmICggdGhpcy5hdXRvUm90YXRlICkge1xuXG5cdFx0XHR0aGlzLnJvdGF0ZUxlZnQoIGdldEF1dG9Sb3RhdGlvbkFuZ2xlKCkgKTtcblxuXHRcdH1cblxuXHRcdHRoZXRhICs9IHRoZXRhRGVsdGE7XG5cdFx0cGhpICs9IHBoaURlbHRhO1xuXG5cdFx0Ly8gcmVzdHJpY3QgcGhpIHRvIGJlIGJldHdlZW4gZGVzaXJlZCBsaW1pdHNcblx0XHRwaGkgPSBNYXRoLm1heCggdGhpcy5taW5Qb2xhckFuZ2xlLCBNYXRoLm1pbiggdGhpcy5tYXhQb2xhckFuZ2xlLCBwaGkgKSApO1xuXG5cdFx0Ly8gcmVzdHJpY3QgcGhpIHRvIGJlIGJldHdlZSBFUFMgYW5kIFBJLUVQU1xuXHRcdHBoaSA9IE1hdGgubWF4KCBFUFMsIE1hdGgubWluKCBNYXRoLlBJIC0gRVBTLCBwaGkgKSApO1xuXG5cdFx0dmFyIHJhZGl1cyA9IG9mZnNldC5sZW5ndGgoKSAqIHNjYWxlO1xuXG5cdFx0Ly8gcmVzdHJpY3QgcmFkaXVzIHRvIGJlIGJldHdlZW4gZGVzaXJlZCBsaW1pdHNcblx0XHRyYWRpdXMgPSBNYXRoLm1heCggdGhpcy5taW5EaXN0YW5jZSwgTWF0aC5taW4oIHRoaXMubWF4RGlzdGFuY2UsIHJhZGl1cyApICk7XG5cblx0XHQvLyBtb3ZlIHRhcmdldCB0byBwYW5uZWQgbG9jYXRpb25cblx0XHR0aGlzLnRhcmdldC5hZGQoIHBhbiApO1xuXG5cdFx0b2Zmc2V0LnggPSByYWRpdXMgKiBNYXRoLnNpbiggcGhpICkgKiBNYXRoLnNpbiggdGhldGEgKTtcblx0XHRvZmZzZXQueSA9IHJhZGl1cyAqIE1hdGguY29zKCBwaGkgKTtcblx0XHRvZmZzZXQueiA9IHJhZGl1cyAqIE1hdGguc2luKCBwaGkgKSAqIE1hdGguY29zKCB0aGV0YSApO1xuXG5cdFx0Ly8gcm90YXRlIG9mZnNldCBiYWNrIHRvIFwiY2FtZXJhLXVwLXZlY3Rvci1pcy11cFwiIHNwYWNlXG5cdFx0b2Zmc2V0LmFwcGx5UXVhdGVybmlvbiggcXVhdEludmVyc2UgKTtcblxuXHRcdHBvc2l0aW9uLmNvcHkoIHRoaXMudGFyZ2V0ICkuYWRkKCBvZmZzZXQgKTtcblxuXHRcdHRoaXMub2JqZWN0Lmxvb2tBdCggdGhpcy50YXJnZXQgKTtcblxuXHRcdHRoZXRhRGVsdGEgPSAwO1xuXHRcdHBoaURlbHRhID0gMDtcblx0XHRzY2FsZSA9IDE7XG5cdFx0cGFuLnNldCggMCwgMCwgMCApO1xuXG5cdFx0Ly8gdXBkYXRlIGNvbmRpdGlvbiBpczpcblx0XHQvLyBtaW4oY2FtZXJhIGRpc3BsYWNlbWVudCwgY2FtZXJhIHJvdGF0aW9uIGluIHJhZGlhbnMpXjIgPiBFUFNcblx0XHQvLyB1c2luZyBzbWFsbC1hbmdsZSBhcHByb3hpbWF0aW9uIGNvcyh4LzIpID0gMSAtIHheMiAvIDhcblxuXHRcdGlmICggbGFzdFBvc2l0aW9uLmRpc3RhbmNlVG9TcXVhcmVkKCB0aGlzLm9iamVjdC5wb3NpdGlvbiApID4gRVBTXG5cdFx0ICAgIHx8IDggKiAoMSAtIGxhc3RRdWF0ZXJuaW9uLmRvdCh0aGlzLm9iamVjdC5xdWF0ZXJuaW9uKSkgPiBFUFMgKSB7XG5cblx0XHRcdHRoaXMuZGlzcGF0Y2hFdmVudCggY2hhbmdlRXZlbnQgKTtcblxuXHRcdFx0bGFzdFBvc2l0aW9uLmNvcHkoIHRoaXMub2JqZWN0LnBvc2l0aW9uICk7XG5cdFx0XHRsYXN0UXVhdGVybmlvbi5jb3B5ICh0aGlzLm9iamVjdC5xdWF0ZXJuaW9uICk7XG5cblx0XHR9XG5cblx0fTtcblxuXG5cdHRoaXMucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG5cblx0XHRzdGF0ZSA9IFNUQVRFLk5PTkU7XG5cblx0XHR0aGlzLnRhcmdldC5jb3B5KCB0aGlzLnRhcmdldDAgKTtcblx0XHR0aGlzLm9iamVjdC5wb3NpdGlvbi5jb3B5KCB0aGlzLnBvc2l0aW9uMCApO1xuXG5cdFx0dGhpcy51cGRhdGUoKTtcblxuXHR9O1xuXG5cdGZ1bmN0aW9uIGdldEF1dG9Sb3RhdGlvbkFuZ2xlKCkge1xuXG5cdFx0cmV0dXJuIDIgKiBNYXRoLlBJIC8gNjAgLyA2MCAqIHNjb3BlLmF1dG9Sb3RhdGVTcGVlZDtcblxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Wm9vbVNjYWxlKCkge1xuXG5cdFx0cmV0dXJuIE1hdGgucG93KCAwLjk1LCBzY29wZS56b29tU3BlZWQgKTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gb25Nb3VzZURvd24oIGV2ZW50ICkge1xuXG5cdFx0aWYgKCBzY29wZS5lbmFibGVkID09PSBmYWxzZSApIHJldHVybjtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0aWYgKCBldmVudC5idXR0b24gPT09IDIgKSB7XG5cdFx0XHRpZiAoIHNjb3BlLm5vUm90YXRlID09PSB0cnVlICkgcmV0dXJuO1xuXG5cdFx0XHRzdGF0ZSA9IFNUQVRFLlJPVEFURTtcblxuXHRcdFx0cm90YXRlU3RhcnQuc2V0KCBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZICk7XG5cblx0XHR9IGVsc2UgaWYgKCBldmVudC5idXR0b24gPT09IDEgKSB7XG5cdFx0XHRpZiAoIHNjb3BlLm5vWm9vbSA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdFx0c3RhdGUgPSBTVEFURS5ET0xMWTtcblxuXHRcdFx0ZG9sbHlTdGFydC5zZXQoIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgKTtcblxuXHRcdH0gZWxzZSBpZiAoIGV2ZW50LmJ1dHRvbiA9PT0gMCApIHtcblx0XHRcdGlmICggc2NvcGUubm9QYW4gPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRcdHN0YXRlID0gU1RBVEUuUEFOO1xuXG5cdFx0XHRwYW5TdGFydC5zZXQoIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgKTtcblxuXHRcdH1cblxuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSwgZmFsc2UgKTtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCAnbW91c2V1cCcsIG9uTW91c2VVcCwgZmFsc2UgKTtcblx0XHRzY29wZS5kaXNwYXRjaEV2ZW50KCBzdGFydEV2ZW50ICk7XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG9uTW91c2VNb3ZlKCBldmVudCApIHtcblxuXHRcdGlmICggc2NvcGUuZW5hYmxlZCA9PT0gZmFsc2UgKSByZXR1cm47XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dmFyIGVsZW1lbnQgPSBzY29wZS5kb21FbGVtZW50ID09PSBkb2N1bWVudCA/IHNjb3BlLmRvbUVsZW1lbnQuYm9keSA6IHNjb3BlLmRvbUVsZW1lbnQ7XG5cblx0XHRpZiAoIHN0YXRlID09PSBTVEFURS5ST1RBVEUgKSB7XG5cblx0XHRcdGlmICggc2NvcGUubm9Sb3RhdGUgPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRcdHJvdGF0ZUVuZC5zZXQoIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgKTtcblx0XHRcdHJvdGF0ZURlbHRhLnN1YlZlY3RvcnMoIHJvdGF0ZUVuZCwgcm90YXRlU3RhcnQgKTtcblxuXHRcdFx0Ly8gcm90YXRpbmcgYWNyb3NzIHdob2xlIHNjcmVlbiBnb2VzIDM2MCBkZWdyZWVzIGFyb3VuZFxuXHRcdFx0c2NvcGUucm90YXRlTGVmdCggMiAqIE1hdGguUEkgKiByb3RhdGVEZWx0YS54IC8gZWxlbWVudC5jbGllbnRXaWR0aCAqIHNjb3BlLnJvdGF0ZVNwZWVkICk7XG5cblx0XHRcdC8vIHJvdGF0aW5nIHVwIGFuZCBkb3duIGFsb25nIHdob2xlIHNjcmVlbiBhdHRlbXB0cyB0byBnbyAzNjAsIGJ1dCBsaW1pdGVkIHRvIDE4MFxuXHRcdFx0c2NvcGUucm90YXRlVXAoIDIgKiBNYXRoLlBJICogcm90YXRlRGVsdGEueSAvIGVsZW1lbnQuY2xpZW50SGVpZ2h0ICogc2NvcGUucm90YXRlU3BlZWQgKTtcblxuXHRcdFx0cm90YXRlU3RhcnQuY29weSggcm90YXRlRW5kICk7XG5cblx0XHR9IGVsc2UgaWYgKCBzdGF0ZSA9PT0gU1RBVEUuRE9MTFkgKSB7XG5cblx0XHRcdGlmICggc2NvcGUubm9ab29tID09PSB0cnVlICkgcmV0dXJuO1xuXG5cdFx0XHRkb2xseUVuZC5zZXQoIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgKTtcblx0XHRcdGRvbGx5RGVsdGEuc3ViVmVjdG9ycyggZG9sbHlFbmQsIGRvbGx5U3RhcnQgKTtcblxuXHRcdFx0aWYgKCBkb2xseURlbHRhLnkgPiAwICkge1xuXG5cdFx0XHRcdHNjb3BlLmRvbGx5SW4oKTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRzY29wZS5kb2xseU91dCgpO1xuXG5cdFx0XHR9XG5cblx0XHRcdGRvbGx5U3RhcnQuY29weSggZG9sbHlFbmQgKTtcblxuXHRcdH0gZWxzZSBpZiAoIHN0YXRlID09PSBTVEFURS5QQU4gKSB7XG5cblx0XHRcdGlmICggc2NvcGUubm9QYW4gPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRcdHBhbkVuZC5zZXQoIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgKTtcblx0XHRcdHBhbkRlbHRhLnN1YlZlY3RvcnMoIHBhbkVuZCwgcGFuU3RhcnQgKTtcblxuXHRcdFx0c2NvcGUucGFuKCBwYW5EZWx0YS54LCBwYW5EZWx0YS55ICk7XG5cblx0XHRcdHBhblN0YXJ0LmNvcHkoIHBhbkVuZCApO1xuXG5cdFx0fVxuXG5cdFx0c2NvcGUudXBkYXRlKCk7XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG9uTW91c2VVcCggLyogZXZlbnQgKi8gKSB7XG5cblx0XHRpZiAoIHNjb3BlLmVuYWJsZWQgPT09IGZhbHNlICkgcmV0dXJuO1xuXG5cdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlLCBmYWxzZSApO1xuXHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdtb3VzZXVwJywgb25Nb3VzZVVwLCBmYWxzZSApO1xuXHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIGVuZEV2ZW50ICk7XG5cdFx0c3RhdGUgPSBTVEFURS5OT05FO1xuXG5cdH1cblxuXHRmdW5jdGlvbiBvbk1vdXNlV2hlZWwoIGV2ZW50ICkge1xuXG5cdFx0aWYgKCBzY29wZS5lbmFibGVkID09PSBmYWxzZSB8fCBzY29wZS5ub1pvb20gPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0dmFyIGRlbHRhID0gMDtcblxuXHRcdGlmICggZXZlbnQud2hlZWxEZWx0YSAhPT0gdW5kZWZpbmVkICkgeyAvLyBXZWJLaXQgLyBPcGVyYSAvIEV4cGxvcmVyIDlcblxuXHRcdFx0ZGVsdGEgPSBldmVudC53aGVlbERlbHRhO1xuXG5cdFx0fSBlbHNlIGlmICggZXZlbnQuZGV0YWlsICE9PSB1bmRlZmluZWQgKSB7IC8vIEZpcmVmb3hcblxuXHRcdFx0ZGVsdGEgPSAtIGV2ZW50LmRldGFpbDtcblxuXHRcdH1cblxuXHRcdGlmICggZGVsdGEgPiAwICkge1xuXG5cdFx0XHRzY29wZS5kb2xseU91dCgpO1xuXG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0c2NvcGUuZG9sbHlJbigpO1xuXG5cdFx0fVxuXG5cdFx0c2NvcGUudXBkYXRlKCk7XG5cdFx0c2NvcGUuZGlzcGF0Y2hFdmVudCggc3RhcnRFdmVudCApO1xuXHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIGVuZEV2ZW50ICk7XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG9uS2V5RG93biggZXZlbnQgKSB7XG5cblx0XHRpZiAoIHNjb3BlLmVuYWJsZWQgPT09IGZhbHNlIHx8IHNjb3BlLm5vS2V5cyA9PT0gdHJ1ZSB8fCBzY29wZS5ub1BhbiA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdHN3aXRjaCAoIGV2ZW50LmtleUNvZGUgKSB7XG5cblx0XHRcdGNhc2Ugc2NvcGUua2V5cy5VUDpcblx0XHRcdFx0c2NvcGUucGFuKCAwLCBzY29wZS5rZXlQYW5TcGVlZCApO1xuXHRcdFx0XHRzY29wZS51cGRhdGUoKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2Ugc2NvcGUua2V5cy5CT1RUT006XG5cdFx0XHRcdHNjb3BlLnBhbiggMCwgLSBzY29wZS5rZXlQYW5TcGVlZCApO1xuXHRcdFx0XHRzY29wZS51cGRhdGUoKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2Ugc2NvcGUua2V5cy5MRUZUOlxuXHRcdFx0XHRzY29wZS5wYW4oIHNjb3BlLmtleVBhblNwZWVkLCAwICk7XG5cdFx0XHRcdHNjb3BlLnVwZGF0ZSgpO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBzY29wZS5rZXlzLlJJR0hUOlxuXHRcdFx0XHRzY29wZS5wYW4oIC0gc2NvcGUua2V5UGFuU3BlZWQsIDAgKTtcblx0XHRcdFx0c2NvcGUudXBkYXRlKCk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiB0b3VjaHN0YXJ0KCBldmVudCApIHtcblxuXHRcdGlmICggc2NvcGUuZW5hYmxlZCA9PT0gZmFsc2UgKSByZXR1cm47XG5cblx0XHRzd2l0Y2ggKCBldmVudC50b3VjaGVzLmxlbmd0aCApIHtcblxuXHRcdFx0Y2FzZSAxOlx0Ly8gb25lLWZpbmdlcmVkIHRvdWNoOiByb3RhdGVcblxuXHRcdFx0XHRpZiAoIHNjb3BlLm5vUm90YXRlID09PSB0cnVlICkgcmV0dXJuO1xuXG5cdFx0XHRcdHN0YXRlID0gU1RBVEUuVE9VQ0hfUk9UQVRFO1xuXG5cdFx0XHRcdHJvdGF0ZVN0YXJ0LnNldCggZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VYLCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVkgKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgMjpcdC8vIHR3by1maW5nZXJlZCB0b3VjaDogZG9sbHlcblxuXHRcdFx0XHRpZiAoIHNjb3BlLm5vWm9vbSA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdFx0XHRzdGF0ZSA9IFNUQVRFLlRPVUNIX0RPTExZO1xuXG5cdFx0XHRcdHZhciBkeCA9IGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWCAtIGV2ZW50LnRvdWNoZXNbIDEgXS5wYWdlWDtcblx0XHRcdFx0dmFyIGR5ID0gZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VZIC0gZXZlbnQudG91Y2hlc1sgMSBdLnBhZ2VZO1xuXHRcdFx0XHR2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoIGR4ICogZHggKyBkeSAqIGR5ICk7XG5cdFx0XHRcdGRvbGx5U3RhcnQuc2V0KCAwLCBkaXN0YW5jZSApO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAzOiAvLyB0aHJlZS1maW5nZXJlZCB0b3VjaDogcGFuXG5cblx0XHRcdFx0aWYgKCBzY29wZS5ub1BhbiA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdFx0XHRzdGF0ZSA9IFNUQVRFLlRPVUNIX1BBTjtcblxuXHRcdFx0XHRwYW5TdGFydC5zZXQoIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWCwgZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VZICk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRkZWZhdWx0OlxuXG5cdFx0XHRcdHN0YXRlID0gU1RBVEUuTk9ORTtcblxuXHRcdH1cblxuXHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIHN0YXJ0RXZlbnQgKTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gdG91Y2htb3ZlKCBldmVudCApIHtcblxuXHRcdGlmICggc2NvcGUuZW5hYmxlZCA9PT0gZmFsc2UgKSByZXR1cm47XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0dmFyIGVsZW1lbnQgPSBzY29wZS5kb21FbGVtZW50ID09PSBkb2N1bWVudCA/IHNjb3BlLmRvbUVsZW1lbnQuYm9keSA6IHNjb3BlLmRvbUVsZW1lbnQ7XG5cblx0XHRzd2l0Y2ggKCBldmVudC50b3VjaGVzLmxlbmd0aCApIHtcblxuXHRcdFx0Y2FzZSAxOiAvLyBvbmUtZmluZ2VyZWQgdG91Y2g6IHJvdGF0ZVxuXG5cdFx0XHRcdGlmICggc2NvcGUubm9Sb3RhdGUgPT09IHRydWUgKSByZXR1cm47XG5cdFx0XHRcdGlmICggc3RhdGUgIT09IFNUQVRFLlRPVUNIX1JPVEFURSApIHJldHVybjtcblxuXHRcdFx0XHRyb3RhdGVFbmQuc2V0KCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWSApO1xuXHRcdFx0XHRyb3RhdGVEZWx0YS5zdWJWZWN0b3JzKCByb3RhdGVFbmQsIHJvdGF0ZVN0YXJ0ICk7XG5cblx0XHRcdFx0Ly8gcm90YXRpbmcgYWNyb3NzIHdob2xlIHNjcmVlbiBnb2VzIDM2MCBkZWdyZWVzIGFyb3VuZFxuXHRcdFx0XHRzY29wZS5yb3RhdGVMZWZ0KCAyICogTWF0aC5QSSAqIHJvdGF0ZURlbHRhLnggLyBlbGVtZW50LmNsaWVudFdpZHRoICogc2NvcGUucm90YXRlU3BlZWQgKTtcblx0XHRcdFx0Ly8gcm90YXRpbmcgdXAgYW5kIGRvd24gYWxvbmcgd2hvbGUgc2NyZWVuIGF0dGVtcHRzIHRvIGdvIDM2MCwgYnV0IGxpbWl0ZWQgdG8gMTgwXG5cdFx0XHRcdHNjb3BlLnJvdGF0ZVVwKCAyICogTWF0aC5QSSAqIHJvdGF0ZURlbHRhLnkgLyBlbGVtZW50LmNsaWVudEhlaWdodCAqIHNjb3BlLnJvdGF0ZVNwZWVkICk7XG5cblx0XHRcdFx0cm90YXRlU3RhcnQuY29weSggcm90YXRlRW5kICk7XG5cblx0XHRcdFx0c2NvcGUudXBkYXRlKCk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIDI6IC8vIHR3by1maW5nZXJlZCB0b3VjaDogZG9sbHlcblxuXHRcdFx0XHRpZiAoIHNjb3BlLm5vWm9vbSA9PT0gdHJ1ZSApIHJldHVybjtcblx0XHRcdFx0aWYgKCBzdGF0ZSAhPT0gU1RBVEUuVE9VQ0hfRE9MTFkgKSByZXR1cm47XG5cblx0XHRcdFx0dmFyIGR4ID0gZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VYIC0gZXZlbnQudG91Y2hlc1sgMSBdLnBhZ2VYO1xuXHRcdFx0XHR2YXIgZHkgPSBldmVudC50b3VjaGVzWyAwIF0ucGFnZVkgLSBldmVudC50b3VjaGVzWyAxIF0ucGFnZVk7XG5cdFx0XHRcdHZhciBkaXN0YW5jZSA9IE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKTtcblxuXHRcdFx0XHRkb2xseUVuZC5zZXQoIDAsIGRpc3RhbmNlICk7XG5cdFx0XHRcdGRvbGx5RGVsdGEuc3ViVmVjdG9ycyggZG9sbHlFbmQsIGRvbGx5U3RhcnQgKTtcblxuXHRcdFx0XHRpZiAoIGRvbGx5RGVsdGEueSA+IDAgKSB7XG5cblx0XHRcdFx0XHRzY29wZS5kb2xseU91dCgpO1xuXG5cdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHRzY29wZS5kb2xseUluKCk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRvbGx5U3RhcnQuY29weSggZG9sbHlFbmQgKTtcblxuXHRcdFx0XHRzY29wZS51cGRhdGUoKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgMzogLy8gdGhyZWUtZmluZ2VyZWQgdG91Y2g6IHBhblxuXG5cdFx0XHRcdGlmICggc2NvcGUubm9QYW4gPT09IHRydWUgKSByZXR1cm47XG5cdFx0XHRcdGlmICggc3RhdGUgIT09IFNUQVRFLlRPVUNIX1BBTiApIHJldHVybjtcblxuXHRcdFx0XHRwYW5FbmQuc2V0KCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWSApO1xuXHRcdFx0XHRwYW5EZWx0YS5zdWJWZWN0b3JzKCBwYW5FbmQsIHBhblN0YXJ0ICk7XG5cblx0XHRcdFx0c2NvcGUucGFuKCBwYW5EZWx0YS54LCBwYW5EZWx0YS55ICk7XG5cblx0XHRcdFx0cGFuU3RhcnQuY29weSggcGFuRW5kICk7XG5cblx0XHRcdFx0c2NvcGUudXBkYXRlKCk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRkZWZhdWx0OlxuXG5cdFx0XHRcdHN0YXRlID0gU1RBVEUuTk9ORTtcblxuXHRcdH1cblxuXHR9XG5cblx0ZnVuY3Rpb24gdG91Y2hlbmQoIC8qIGV2ZW50ICovICkge1xuXG5cdFx0aWYgKCBzY29wZS5lbmFibGVkID09PSBmYWxzZSApIHJldHVybjtcblxuXHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIGVuZEV2ZW50ICk7XG5cdFx0c3RhdGUgPSBTVEFURS5OT05FO1xuXG5cdH1cblxuXHR0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgfSwgZmFsc2UgKTtcblx0dGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZWRvd24nLCBvbk1vdXNlRG93biwgZmFsc2UgKTtcblx0dGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZXdoZWVsJywgb25Nb3VzZVdoZWVsLCBmYWxzZSApO1xuXHR0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ0RPTU1vdXNlU2Nyb2xsJywgb25Nb3VzZVdoZWVsLCBmYWxzZSApOyAvLyBmaXJlZm94XG5cblx0dGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaHN0YXJ0JywgdG91Y2hzdGFydCwgZmFsc2UgKTtcblx0dGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaGVuZCcsIHRvdWNoZW5kLCBmYWxzZSApO1xuXHR0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNobW92ZScsIHRvdWNobW92ZSwgZmFsc2UgKTtcblxuXHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCBvbktleURvd24sIGZhbHNlICk7XG5cblx0Ly8gZm9yY2UgYW4gdXBkYXRlIGF0IHN0YXJ0XG5cdHRoaXMudXBkYXRlKCk7XG5cbn07XG5cblRIUkVFLlBhbkNvbnRyb2xzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFRIUkVFLkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUgKTtcbiIsInJlcXVpcmUoJy4vUGFuQ29udHJvbHMnKTtcblxudmFyIHQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cudDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLnQzIDogbnVsbCksXG4gIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5USFJFRSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuVEhSRUUgOiBudWxsKSxcbiAgZWwsXG4gIGluc3RhbmNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY2xlYXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcm9vdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWwpO1xuICAgIHdoaWxlKHJvb3QuZmlyc3RDaGlsZCkge1xuICAgICAgcm9vdC5yZW1vdmVDaGlsZChyb290LmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgICBpZiAoaW5zdGFuY2UpIHtcbiAgICAgIGluc3RhbmNlLmxvb3BNYW5hZ2VyLnN0b3AoKTtcbiAgICB9XG4gIH0sXG4gIHNldENhbnZhc0VsOiBmdW5jdGlvbiAobmV3RWwpIHtcbiAgICBlbCA9IG5ld0VsO1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdmFyIHJvb3RFbDtcbiAgICB2YXIgbm9kZXMgPSBkYXRhLm5vZGVzLFxuICAgICAgZWRnZXMgPSBkYXRhLmVkZ2VzLFxuICAgICAgbm9kZU1hcCA9IHt9LFxuICAgICAgbWFyZ2luID0ge1xuICAgICAgICB0b3A6IDEwLFxuICAgICAgICBsZWZ0OiAxMFxuICAgICAgfSxcbiAgICAgIGZpbGxTdHlsZSA9IHtcbiAgICAgICAgbnVtYmVyOiAnIzY3M2FiNycsXG4gICAgICAgICdzdHJpbmcnOiAnI2ZmOTgwMCcsXG4gICAgICAgICdib29sZWFuJzogJyMyNTliMjQnLFxuICAgICAgICAndW5kZWZpbmVkJzogJyMwMDAwMDAnXG4gICAgICB9LFxuICAgICAgYm9yZGVyU3R5bGUgPSB7XG4gICAgICAgIG9iamVjdDogJyMwM2E5ZjQnLFxuICAgICAgICAnZnVuY3Rpb24nOiAnI2U1MWMyMydcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Q29sb3IgPSAnIzAwMDAwMCcsXG4gICAgICB0aXRsZUhlaWdodCA9IDQwLFxuICAgICAgcHJvamVjdG9yID0gbmV3IFRIUkVFLlByb2plY3RvcigpLFxuICAgICAgbm9kZU1lc2hlcyA9IFtdO1xuXG4gICAgLy8gdGhlIGFjdHVhbCByb290IGVsZW1lbnQgaXMgYSBkaXYgY3JlYXRlZCB1bmRlciB0aGUgcm9vdFxuICAgIHJvb3RFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHJvb3RFbC5pZCA9ICdyb290JztcbiAgICByb290RWwuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWwpLmFwcGVuZENoaWxkKHJvb3RFbCk7XG5cbiAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICBub2RlTWFwW25vZGUuaGFzaEtleV0gPSBub2RlO1xuICAgIH0pO1xuXG4gICAgdmFyIHdyYXBwZXJFbCA9IHJvb3RFbDtcbiAgICB2YXIgYmJveCA9IHJvb3RFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGZ1bmN0aW9uIGdldFkobm9kZSwgaSkge1xuICAgICAgcmV0dXJuIG5vZGUueSAtIG5vZGUuaGVpZ2h0ICogMC41ICtcbiAgICAgICAgKG5vZGUucHJvcGVydGllcy5sZW5ndGggLSBpKSAqIDE1O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFgobm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUueCAtIG5vZGUud2lkdGggKiAwLjUgKyBtYXJnaW4ubGVmdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDYW1lcmFDb250cm9scyhjYW1lcmEsIGRvbUVsZW1lbnQpIHtcbiAgICAgIGNhbWVyYS5jYW1lcmFDb250cm9scyA9IG5ldyBUSFJFRS5QYW5Db250cm9scyhjYW1lcmEsIGRvbUVsZW1lbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZVRleHRTcHJpdGVzKCkge1xuICAgICAgdmFyIHNoYXBlcyA9IFRIUkVFLkZvbnRVdGlscy5nZW5lcmF0ZVNoYXBlcyhcIkhlbGxvIHdvcmxkXCIsIHtcbiAgICAgICAgZm9udDogXCJoZWx2ZXRpa2VyXCIsXG4gICAgICAgIHdlaWdodDogXCJib2xkXCIsXG4gICAgICAgIHNpemU6IDEwXG4gICAgICB9KTtcbiAgICAgIHZhciBnZW9tID0gbmV3IFRIUkVFLlNoYXBlR2VvbWV0cnkoc2hhcGVzKTtcbiAgICAgIHZhciBtYXQgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoKTtcbiAgICAgIHJldHVybiBuZXcgVEhSRUUuTWVzaChnZW9tLCBtYXQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRyYXdQcm9wZXJ0aWVzKG5vZGUsIGdyb3VwKSB7XG4gICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICBjYW52YXMud2lkdGggPSBub2RlLndpZHRoO1xuICAgICAgY2FudmFzLmhlaWdodCA9IG5vZGUuaGVpZ2h0O1xuICAgICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgIGNvbnRleHQuZm9udCA9IFwibm9ybWFsIDEwMCAxOHB4IFJvYm90b1wiO1xuICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBcInJnYmEoMCwgMCwgMCwgMSlcIjtcbiAgICAgIGNvbnRleHQuZmlsbFRleHQoXG4gICAgICAgIG5vZGUubGFiZWwsXG4gICAgICAgIG1hcmdpbi5sZWZ0LFxuICAgICAgICBtYXJnaW4udG9wICsgMTVcbiAgICAgICk7XG5cbiAgICAgIG5vZGUucHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wZXJ0eSwgaSkge1xuICAgICAgICB2YXIgc3BoZXJlO1xuXG4gICAgICAgIC8vIGRyYXcgdGV4dCBvbiB0aGUgY2FudmFzXG4gICAgICAgIGNvbnRleHQuZm9udCA9IFwibm9ybWFsIDE1cHggQXJpYWxcIjtcbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBmaWxsU3R5bGVbcHJvcGVydHkudHlwZV0gfHwgZGVmYXVsdENvbG9yO1xuICAgICAgICBjb250ZXh0LmZpbGxUZXh0KFxuICAgICAgICAgIHByb3BlcnR5LnByb3BlcnR5LFxuICAgICAgICAgIG1hcmdpbi5sZWZ0ICogMixcbiAgICAgICAgICBtYXJnaW4udG9wICsgdGl0bGVIZWlnaHQgKyBpICogMTVcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgdGV4dHVyZSA9IG5ldyBUSFJFRS5UZXh0dXJlKGNhbnZhcyk7XG4gICAgICB0ZXh0dXJlLm5lZWRzVXBkYXRlID0gdHJ1ZTtcblxuICAgICAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgbWFwOiB0ZXh0dXJlLFxuICAgICAgICBzaWRlOlRIUkVFLkRvdWJsZVNpZGVcbiAgICAgIH0pO1xuICAgICAgbWF0ZXJpYWwudHJhbnNwYXJlbnQgPSB0cnVlO1xuICAgICAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChcbiAgICAgICAgICBuZXcgVEhSRUUuUGxhbmVHZW9tZXRyeShjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpLFxuICAgICAgICAgIG1hdGVyaWFsXG4gICAgICApO1xuICAgICAgLy8gbWVzaC5wb3NpdGlvbi54ICs9IG5vZGUud2lkdGggLyAyO1xuICAgICAgLy8gbWVzaC5wb3NpdGlvbi55ICs9IG5vZGUuaGVpZ2h0IC8gMjtcblxuICAgICAgbWVzaC5wb3NpdGlvbi5zZXQoXG4gICAgICAgIG5vZGUueCxcbiAgICAgICAgbm9kZS55LFxuICAgICAgICAwLjFcbiAgICAgICk7XG5cbiAgICAgIGdyb3VwLmFkZChtZXNoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkcmF3Tm9kZXMoKSB7XG4gICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICBub2RlR3JvdXAgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuICAgICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB2YXIgcG9pbnRzID0gW10sXG4gICAgICAgICBnID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgICAgIHBvaW50cy5wdXNoKG5ldyBUSFJFRS5WZWN0b3IyKDAsIDApKTtcbiAgICAgICAgcG9pbnRzLnB1c2gobmV3IFRIUkVFLlZlY3RvcjIobm9kZS53aWR0aCwgMCkpO1xuICAgICAgICBwb2ludHMucHVzaChuZXcgVEhSRUUuVmVjdG9yMihub2RlLndpZHRoLCBub2RlLmhlaWdodCkpO1xuICAgICAgICBwb2ludHMucHVzaChuZXcgVEhSRUUuVmVjdG9yMigwLCBub2RlLmhlaWdodCkpO1xuXG4gICAgICAgIHZhciBzaGFwZSA9IG5ldyBUSFJFRS5TaGFwZShwb2ludHMpO1xuXG4gICAgICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5TaGFwZUdlb21ldHJ5KHNoYXBlKTtcbiAgICAgICAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChcbiAgICAgICAgICBnZW9tZXRyeSxcbiAgICAgICAgICBuZXcgVEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICAgICAgY29sb3I6ICcjZWVlZWVlJywvLyBib3JkZXJTdHlsZVsnZnVuY3Rpb24nXSxcbiAgICAgICAgICAgIGxpbmVXaWR0aDogMVxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgbWVzaC51c2VyRGF0YS5ub2RlID0gbm9kZTtcbiAgICAgICAgbWVzaC5wb3NpdGlvbi5zZXQoXG4gICAgICAgICAgbm9kZS54IC0gbm9kZS53aWR0aCAqIDAuNSxcbiAgICAgICAgICBub2RlLnkgLSBub2RlLmhlaWdodCAqIDAuNSxcbiAgICAgICAgICAwXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gRUFDSCBPTkUgSVMgQSBTSU5HTEUgTUVTSFxuICAgICAgICBtZS5hY3RpdmVTY2VuZS5hZGQobWVzaCk7XG4gICAgICAgIG5vZGVNZXNoZXMucHVzaChtZXNoKTtcblxuICAgICAgICAvLyBNRVJHRVxuICAgICAgICAvLyBtZXNoLnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgICAvLyBub2RlR2VvbWV0cnkubWVyZ2UobWVzaC5nZW9tZXRyeSwgbWVzaC5tYXRyaXgpO1xuXG4gICAgICAgIC8vIGFkZCB0aGUgZGVzY3JpcHRpb24gaW4gYW5vdGhlciBncm91cFxuICAgICAgICBkcmF3UHJvcGVydGllcyhub2RlLCBub2RlR3JvdXApO1xuICAgICAgfSk7XG5cbiAgICAgIG1lLmFjdGl2ZVNjZW5lLmFkZChub2RlR3JvdXApO1xuXG4gICAgICAvLyBNRVJHRVxuICAgICAgLy8gbWUuYWN0aXZlU2NlbmUuYWRkKG5ldyBUSFJFRS5NZXNoKFxuICAgICAgLy8gICBub2RlR2VvbWV0cnksXG4gICAgICAvLyAgIG5ldyBUSFJFRS5MaW5lQmFzaWNNYXRlcmlhbCh7XG4gICAgICAvLyAgICAgY29sb3I6ICcjZWVlZWVlJywvLyBib3JkZXJTdHlsZVsnZnVuY3Rpb24nXSxcbiAgICAgIC8vICAgICBsaW5lV2lkdGg6IDFcbiAgICAgIC8vICAgfSlcbiAgICAgIC8vICkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRyYXdDaXJjbGVzKCkge1xuICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgY2lyY2xlTWVzaCA9IG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5DaXJjbGVHZW9tZXRyeSg1LCA4KSksXG4gICAgICAgIG1lc2hlcyA9IHtcbiAgICAgICAgICBvYmplY3Q6IHtcbiAgICAgICAgICAgIG1hdGVyaWFsOiBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICAgICAgICBjb2xvcjogYm9yZGVyU3R5bGUub2JqZWN0XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGdlb21ldHJ5OiBuZXcgVEhSRUUuR2VvbWV0cnkoKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgJ2Z1bmN0aW9uJzoge1xuICAgICAgICAgICAgbWF0ZXJpYWw6IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICAgICAgICAgIGNvbG9yOiBib3JkZXJTdHlsZVsnZnVuY3Rpb24nXVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBnZW9tZXRyeTogbmV3IFRIUkVFLkdlb21ldHJ5KClcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIG5vZGUucHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wZXJ0eSwgaSkge1xuICAgICAgICAgIGlmIChwcm9wZXJ0eS50eXBlID09PSAnZnVuY3Rpb24nIHx8IHByb3BlcnR5LnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjaXJjbGVNZXNoLnBvc2l0aW9uLnNldChcbiAgICAgICAgICAgICAgZ2V0WChub2RlKSwgZ2V0WShub2RlLCBpKSArIDUsIDAuMlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNpcmNsZU1lc2gudXBkYXRlTWF0cml4KCk7XG4gICAgICAgICAgICBtZXNoZXNbcHJvcGVydHkudHlwZV0uZ2VvbWV0cnlcbiAgICAgICAgICAgICAgLm1lcmdlKGNpcmNsZU1lc2guZ2VvbWV0cnksIGNpcmNsZU1lc2gubWF0cml4KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBtZS5hY3RpdmVTY2VuZS5hZGQobmV3IFRIUkVFLk1lc2goXG4gICAgICAgIG1lc2hlcy5vYmplY3QuZ2VvbWV0cnksIG1lc2hlcy5vYmplY3QubWF0ZXJpYWxcbiAgICAgICkpO1xuICAgICAgbWUuYWN0aXZlU2NlbmUuYWRkKG5ldyBUSFJFRS5NZXNoKFxuICAgICAgICBtZXNoZXNbJ2Z1bmN0aW9uJ10uZ2VvbWV0cnksIG1lc2hlc1snZnVuY3Rpb24nXS5tYXRlcmlhbFxuICAgICAgKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVTcGxpbmUoZiwgbWlkLCB0LCBkKSB7XG4gICAgICB2YXIgbXVsdCA9IDAsXG4gICAgICAgIGJ1bXBaID0gbWlkLnogKiAwLjIsXG4gICAgICAgIGZtID0gbmV3IFRIUkVFLlZlY3RvcjMoKVxuICAgICAgICAgIC5hZGRWZWN0b3JzKGYsIG1pZClcbiAgICAgICAgICAubXVsdGlwbHlTY2FsYXIoMC41KVxuICAgICAgICAgIC5hZGQobmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgICAgICAgICAobWlkLnggLSBmLngpICogbXVsdCxcbiAgICAgICAgICAgIChmLnkgLSBtaWQueSkgKiBtdWx0LFxuICAgICAgICAgICAgYnVtcFpcbiAgICAgICAgICApKSxcbiAgICAgICAgbXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpXG4gICAgICAgICAgLmFkZFZlY3RvcnMobWlkLCB0KVxuICAgICAgICAgIC5tdWx0aXBseVNjYWxhcigwLjUpXG4gICAgICAgICAgLmFkZChuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgICAgICAgIChtaWQueCAtIHQueCkgKiBtdWx0LFxuICAgICAgICAgICAgKHQueSAtIG1pZC55KSAqIG11bHQsXG4gICAgICAgICAgICBidW1wWlxuICAgICAgICAgICkpO1xuXG4gICAgICB2YXIgc3BsaW5lID0gbmV3IFRIUkVFLlNwbGluZShbXG4gICAgICAgIGYsIGZtLCBtaWQsIG10LCB0XG4gICAgICBdKSwgaSwgbCA9IDEwLCBpbmRleCwgcG9zaXRpb24sXG4gICAgICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG5cbiAgICAgIGdlb21ldHJ5LmNvbG9ycyA9IFtdO1xuICAgICAgZm9yIChpID0gMDsgaSA8PSBsOyBpICs9IDEpIHtcbiAgICAgICAgaW5kZXggPSBpIC8gbDtcbiAgICAgICAgcG9zaXRpb24gPSBzcGxpbmUuZ2V0UG9pbnQoaW5kZXgpO1xuICAgICAgICBnZW9tZXRyeS52ZXJ0aWNlc1tpXSA9IG5ldyBUSFJFRS5WZWN0b3IzKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHBvc2l0aW9uLnopO1xuICAgICAgICBnZW9tZXRyeS5jb2xvcnNbaV0gPSBuZXcgVEhSRUUuQ29sb3IoMHhmZmZmZmYpO1xuICAgICAgICBnZW9tZXRyeS5jb2xvcnNbaV0uc2V0SFNMKFxuICAgICAgICAgIC8vIDIwMCAvIDM2MCxcbiAgICAgICAgICAvLyBpbmRleCxcbiAgICAgICAgICAvLyAwLjVcbiAgICAgICAgICAyMDAvMzYwLFxuICAgICAgICAgIDEsXG4gICAgICAgICAgMC45XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHJhd0VkZ2VzKHNjb3BlKSB7XG4gICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICBmcm9tViA9IG5ldyBUSFJFRS5WZWN0b3IzKCksXG4gICAgICAgIHRvViA9IG5ldyBUSFJFRS5WZWN0b3IzKCksXG4gICAgICAgIG1pZCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICAgIGVkZ2VzLmZvckVhY2goZnVuY3Rpb24gKGxpbmssIGkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coaSwgZWRnZXMubGVuZ3RoKTtcbiAgICAgICAgdmFyIGZyb20gPSBub2RlTWFwW2xpbmsuZnJvbV07XG4gICAgICAgIHZhciB0byA9IG5vZGVNYXBbbGluay50b107XG5cbiAgICAgICAgdmFyIGluZGV4ID0gXy5maW5kSW5kZXgoXG4gICAgICAgICAgZnJvbS5wcm9wZXJ0aWVzLFxuICAgICAgICAgIHsgbmFtZTogbGluay5wcm9wZXJ0eSB9XG4gICAgICAgICk7XG4gICAgICAgIGZyb21WLnNldChcbiAgICAgICAgICBmcm9tLnggLSBmcm9tLndpZHRoICogMC41ICsgbWFyZ2luLmxlZnQsXG4gICAgICAgICAgZnJvbS55IC0gZnJvbS5oZWlnaHQgKiAwLjUgKyAoZnJvbS5wcm9wZXJ0aWVzLmxlbmd0aCAtIGluZGV4KSAqIDE1ICsgNSxcbiAgICAgICAgICAwXG4gICAgICAgICk7XG4gICAgICAgIHRvVi5zZXQoXG4gICAgICAgICAgdG8ueCAtIHRvLndpZHRoICogMC41LFxuICAgICAgICAgIHRvLnkgLSB0by5oZWlnaHQgKiAwLjUsXG4gICAgICAgICAgMFxuICAgICAgICApO1xuICAgICAgICB2YXIgZCA9IGZyb21WLmRpc3RhbmNlVG8odG9WKTtcbiAgICAgICAgbWlkXG4gICAgICAgICAgLmFkZFZlY3RvcnMoZnJvbVYsIHRvVilcbiAgICAgICAgICAubXVsdGlwbHlTY2FsYXIoMC41KVxuICAgICAgICAgIC5zZXRaKDUwKTtcblxuICAgICAgICB2YXIgZ2VvbWV0cnkgPSBnZW5lcmF0ZVNwbGluZShmcm9tViwgbWlkLCB0b1YsIGQpO1xuICAgICAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICAgIGNvbG9yOiAweGZmZmZmZixcbiAgICAgICAgICBvcGFjaXR5OiAwLjUsXG4gICAgICAgICAgbGluZXdpZHRoOiAzLFxuICAgICAgICAgIHZlcnRleENvbG9yczogVEhSRUUuVmVydGV4Q29sb3JzXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5MaW5lKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gICAgICAgIG1lLmFjdGl2ZVNjZW5lLmFkZChtZXNoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHByZSBpbml0XG4gICAgdDMudGhlbWVzLmFsbFdoaXRlID0ge1xuICAgICAgY2xlYXJDb2xvcjogMHhmZmZmZmYsXG4gICAgICBmb2dDb2xvcjogMHhmZmZmZmYsXG4gICAgICBncm91bmRDb2xvcjogMHhmZmZmZmZcbiAgICB9O1xuICAgIGluc3RhbmNlID0gdDMucnVuKHtcbiAgICAgIHNlbGVjdG9yOiBlbCArICcgI3Jvb3QnLFxuICAgICAgd2lkdGg6IGJib3gud2lkdGgsXG4gICAgICBoZWlnaHQ6IGJib3guaGVpZ2h0LFxuICAgICAgdGhlbWU6ICdhbGxXaGl0ZScsXG4gICAgICBhbWJpZW50Q29uZmlnOiB7XG4gICAgICAgIGdyb3VuZDogZmFsc2UsXG4gICAgICAgIGF4ZXM6IGZhbHNlLFxuICAgICAgICBncmlkWTogZmFsc2UsXG4gICAgICAgIGdyaWRYOiBmYWxzZSxcbiAgICAgICAgZ3JpZFo6IGZhbHNlXG4gICAgICB9LFxuICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgIHJlbmRlcmVyRWwgPSBtZS5yZW5kZXJlci5kb21FbGVtZW50O1xuICAgICAgICBtZS5kYXRndWkuY2xvc2UoKTtcbiAgICAgICAgbWUuYWN0aXZlU2NlbmUuZm9nID0gbnVsbDtcbiAgICAgICAgbWUucmVuZGVyZXIuc29ydE9iamVjdHMgPSBmYWxzZTtcbiAgICAgICAgbWUucmVuZGVyZXIuc2hhZG93TWFwRW5hYmxlZCA9IHRydWU7XG4gICAgICAgIG1lLnJlbmRlcmVyLnNoYWRvd01hcFR5cGUgPSBUSFJFRS5QQ0ZTaGFkb3dNYXA7XG5cbiAgICAgICAgdmFyIG1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICAgICAgdmFyIG1vdmVkID0gZmFsc2UsIGRvd24gPSBmYWxzZTtcbiAgICAgICAgcmVuZGVyZXJFbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGlmIChkb3duKSB7XG4gICAgICAgICAgICBtb3ZlZCA9IHRydWU7XG4gICAgICAgICAgICB3cmFwcGVyRWwuc3R5bGUuY3Vyc29yID0gJ21vdmUnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb3ZlZCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlbmRlcmVyRWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBkb3duID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlbmRlcmVyRWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgZG93biA9IGZhbHNlO1xuICAgICAgICAgIHdyYXBwZXJFbC5zdHlsZS5jdXJzb3IgPSAnYXV0byc7XG4gICAgICAgIH0pO1xuICAgICAgICByZW5kZXJlckVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdmFyIGJib3ggPSByZW5kZXJlckVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgIHZhciBjeCA9IGUuY2xpZW50WCAtIGJib3gubGVmdDtcbiAgICAgICAgICB2YXIgY3kgPSBlLmNsaWVudFkgLSBiYm94LnRvcDtcbiAgICAgICAgICBtb3VzZS54ID0gKGN4IC8gcmVuZGVyZXJFbC5jbGllbnRXaWR0aCkgKiAyIC0gMTtcbiAgICAgICAgICBtb3VzZS55ID0gLShjeSAvIHJlbmRlcmVyRWwuY2xpZW50SGVpZ2h0KSAqIDIgKyAxO1xuICAgICAgICAgIHZhciB2ZWN0b3IgPSBuZXcgVEhSRUUuVmVjdG9yMyggbW91c2UueCwgbW91c2UueSwgMC41ICk7XG4gICAgICAgICAgcHJvamVjdG9yLnVucHJvamVjdFZlY3Rvcih2ZWN0b3IsIG1lLmFjdGl2ZUNhbWVyYSk7XG5cbiAgICAgICAgICB2YXIgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcihcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbixcbiAgICAgICAgICAgIHZlY3Rvci5zdWIoY2FtZXJhLnBvc2l0aW9uKS5ub3JtYWxpemUoKVxuICAgICAgICAgICk7XG4gICAgICAgICAgdmFyIGludGVyc2VjdHMgPSByYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhub2RlTWVzaGVzKSxcbiAgICAgICAgICAgIGlPYmplY3QgPSBpbnRlcnNlY3RzWzBdICYmIGludGVyc2VjdHNbMF0ub2JqZWN0O1xuICAgICAgICAgIGlmIChpT2JqZWN0ICYmICFtb3ZlZCkge1xuICAgICAgICAgICAgLy8gZm9jdXMgb24gdGhpcyBvYmplY3Qgb24gY2xpY2tcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGlPYmplY3QpO1xuICAgICAgICAgICAgdmFyIGRlc3QgPSB7XG4gICAgICAgICAgICAgIHg6IGlPYmplY3QucG9zaXRpb24ueCArIGlPYmplY3QudXNlckRhdGEubm9kZS53aWR0aCAvIDIsXG4gICAgICAgICAgICAgIHk6IGlPYmplY3QucG9zaXRpb24ueSArIGlPYmplY3QudXNlckRhdGEubm9kZS5oZWlnaHQgLyAyXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbmV3IFRXRUVOLlR3ZWVuKG1lLmFjdGl2ZUNhbWVyYS5wb3NpdGlvbilcbiAgICAgICAgICAgICAgLnRvKF8ubWVyZ2Uoe30sIGRlc3QsIHtcbiAgICAgICAgICAgICAgICB6OiBNYXRoLm1heChpT2JqZWN0LnVzZXJEYXRhLm5vZGUuaGVpZ2h0LCAzNTApXG4gICAgICAgICAgICAgIH0pLCAxMDAwKVxuICAgICAgICAgICAgICAuZWFzaW5nKFRXRUVOLkVhc2luZy5DdWJpYy5Jbk91dClcbiAgICAgICAgICAgICAgLnN0YXJ0KCk7XG4gICAgICAgICAgICBuZXcgVFdFRU4uVHdlZW4obWUuYWN0aXZlQ2FtZXJhLmNhbWVyYUNvbnRyb2xzLnRhcmdldClcbiAgICAgICAgICAgICAgLnRvKGRlc3QsIDEwMDApXG4gICAgICAgICAgICAgIC5lYXNpbmcoVFdFRU4uRWFzaW5nLkN1YmljLkluT3V0KVxuICAgICAgICAgICAgICAuc3RhcnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAvLyBjYW1lcmEgc2V0dXBcbiAgICAgICAgdmFyIGZvdiA9IDcwLFxuICAgICAgICAgIHJhdGlvID0gcmVuZGVyZXJFbC5jbGllbnRXaWR0aCAvIHJlbmRlcmVyRWwuY2xpZW50SGVpZ2h0LFxuICAgICAgICAgIG5lYXIgPSAxLFxuICAgICAgICAgIGZhciA9IDIwMDAwO1xuICAgICAgICB2YXIgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKGZvdiwgcmF0aW8sIG5lYXIsIGZhcik7XG4gICAgICAgIG1lXG4gICAgICAgICAgLmFkZENhbWVyYShjYW1lcmEsICdtaW5lJylcbiAgICAgICAgICAuc2V0QWN0aXZlQ2FtZXJhKCdtaW5lJyk7XG4gICAgICAgIGNyZWF0ZUNhbWVyYUNvbnRyb2xzKGNhbWVyYSwgcmVuZGVyZXJFbCk7XG4gICAgICAgIGNhbWVyYS5jYW1lcmFDb250cm9scy50YXJnZXQuc2V0KFxuICAgICAgICAgIGRhdGEuY2VudGVyLngsXG4gICAgICAgICAgZGF0YS5jZW50ZXIueSxcbiAgICAgICAgICAwXG4gICAgICAgICk7XG4gICAgICAgIGNhbWVyYS5jYW1lcmFDb250cm9scy5ub0tleXMgPSB0cnVlO1xuXG4gICAgICAgIC8vIGRyYXcgdGhlIG5vZGVzXG4gICAgICAgIGRyYXdOb2Rlcy5jYWxsKG1lKTtcbiAgICAgICAgZHJhd0NpcmNsZXMuY2FsbChtZSk7XG4gICAgICAgIGRyYXdFZGdlcy5jYWxsKG1lKTtcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjYW1lcmEucG9zaXRpb24uc2V0KFxuICAgICAgICAgICAgZGF0YS5jZW50ZXIueCxcbiAgICAgICAgICAgIGRhdGEuY2VudGVyLnksXG4gICAgICAgICAgICBNYXRoLm1pbihkYXRhLm14LnggLSBkYXRhLm1uLngsIGRhdGEubXgueSAtIGRhdGEubW4ueSlcbiAgICAgICAgICApO1xuICAgICAgICAgIC8vY2FtZXJhLmxvb2tBdChuZXcgVEhSRUUuVmVjdG9yMyhkYXRhLmNlbnRlci54LCBkYXRhLmNlbnRlci55LCAwKSk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZTogZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgICAgIFRXRUVOLnVwZGF0ZSgpO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICBtZS5hYyA9IG1lLmFjIHx8IDA7XG4gICAgICAgIG1lLmFjICs9IGRlbHRhO1xuICAgICAgICBpZiAobWUuYWMgPiAyKSB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2cobWUucmVuZGVyZXIuaW5mby5yZW5kZXIpO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKG1lLnJlbmRlcmVyKTtcbiAgICAgICAgICBtZS5hYyA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbnZhciBjaGFuZ2VGYWtlUHJvcGVydHlOYW1lID0ge1xuICAnW1tQcm90b3R5cGVdXSc6ICdfX3Byb3RvX18nXG59O1xuXG52YXIgdXRpbHMgPSB7XG4gIHRyYW5zbGF0ZTogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKHggfHwgMCkgKyAnLCAnICsgKHkgfHwgMCkgKyAnKSc7XG4gIH0sXG4gIHNjYWxlOiBmdW5jdGlvbiAocykge1xuICAgIHJldHVybiAnc2NhbGUoJyArIChzIHx8IDEpICsgJyknO1xuICB9LFxuICB0cmFuc2Zvcm06IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgdCA9IFtdO1xuICAgIF8uZm9yT3duKG9iaiwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICAgIHQucHVzaCh1dGlsc1trXS5hcHBseSh1dGlscywgdikpO1xuICAgIH0pO1xuICAgIHJldHVybiB0LmpvaW4oJyAnKTtcbiAgfSxcbiAgcHJlZml4ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICBhcmdzLnVuc2hpZnQoJ3B2Jyk7XG4gICAgcmV0dXJuIGFyZ3Muam9pbignLScpO1xuICB9LFxuICB0cmFuc2Zvcm1Qcm9wZXJ0eTogZnVuY3Rpb24gKHYpIHtcbiAgICBpZiAoY2hhbmdlRmFrZVByb3BlcnR5TmFtZS5oYXNPd25Qcm9wZXJ0eSh2KSkge1xuICAgICAgcmV0dXJuIGNoYW5nZUZha2VQcm9wZXJ0eU5hbWVbdl07XG4gICAgfVxuICAgIHJldHVybiB2O1xuICB9LFxuICBlc2NhcGVDbHM6IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gdi5yZXBsYWNlKC9cXCQvZywgJ18nKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsczsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLycpO1xudmFyIG1lLCBoYXNoS2V5O1xudmFyIGRvR2V0LCBkb1NldDtcblxubWUgPSBoYXNoS2V5ID0gZnVuY3Rpb24gKHYpIHtcbiAgdmFyIHVpZCA9IHY7XG4gIGlmICh1dGlscy5pc09iamVjdE9yRnVuY3Rpb24odikpIHtcbiAgICBpZiAoIW1lLmhhcyh2KSkge1xuICAgICAgZG9TZXQodiwgXy51bmlxdWVJZCgpKTtcbiAgICB9XG4gICAgdWlkID0gZG9HZXQodik7XG4gICAgaWYgKCFtZS5oYXModikpIHtcbiAgICAgIHRocm93IEVycm9yKHYgKyAnIHNob3VsZCBoYXZlIGEgaGFzaEtleSBhdCB0aGlzIHBvaW50IDooJyk7XG4gICAgfVxuICAgIHJldHVybiB1aWQ7XG4gIH1cblxuICAvLyB2IGlzIGEgcHJpbWl0aXZlXG4gIHJldHVybiB0eXBlb2YgdiArICctJyArIHVpZDtcbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEdldHMgdGhlIHN0b3JlZCBoYXNoa2V5LCBzaW5jZSB0aGVyZSBhcmUgb2JqZWN0IHRoYXQgbWlnaHQgbm90IGhhdmUgYSBjaGFpblxuICogdXAgdG8gT2JqZWN0LnByb3RvdHlwZSB0aGUgY2hlY2sgaXMgZG9uZSB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkgZXhwbGljaXRseVxuICpcbiAqIEBwYXJhbSAgeyp9IG9ialxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5kb0dldCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgYXNzZXJ0KHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbihvYmopLCAnb2JqIG11c3QgYmUgYW4gb2JqZWN0fGZ1bmN0aW9uJyk7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBtZS5oaWRkZW5LZXkpICYmXG4gICAgb2JqW21lLmhpZGRlbktleV07XG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBTZXRzIGEgaGlkZGVuIGtleSBvbiBhbiBvYmplY3QsIHRoZSBoaWRkZW4ga2V5IGlzIGRldGVybWluZWQgYXMgZm9sbG93czpcbiAqXG4gKiAtIG51bGwgb2JqZWN0LW51bGxcbiAqIC0gbnVtYmVyczogbnVtYmVyLXt2YWx1ZX1cbiAqIC0gYm9vbGVhbjogYm9vbGVhbi17dHJ1ZXxmYWxzZX1cbiAqIC0gc3RyaW5nOiBzdHJpbmcte3ZhbHVlfVxuICogLSB1bmRlZmluZWQgdW5kZWZpbmVkLXVuZGVmaW5lZFxuICogLSBmdW5jdGlvbjogZnVuY3Rpb24te2lkfSBpZCA9IF8udW5pcXVlSWRcbiAqIC0gb2JqZWN0OiBvYmplY3Qte2lkfSBpZCA9IF8udW5pcXVlSWRcbiAqXG4gKiBAcGFyYW0geyp9IG9iaiBUaGUgb2JqZWN0IHRvIHNldCB0aGUgaGlkZGVuS2V5XG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYmUgc2V0IGluIHRoZSBvYmplY3RcbiAqL1xuZG9TZXQgPSBmdW5jdGlvbiAob2JqLCBrZXkpIHtcbiAgYXNzZXJ0KHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbihvYmopLCAnb2JqIG11c3QgYmUgYW4gb2JqZWN0fGZ1bmN0aW9uJyk7XG4gIGFzc2VydChcbiAgICB0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyxcbiAgICAnVGhlIGtleSBuZWVkcyB0byBiZSBhIHZhbGlkIHN0cmluZydcbiAgKTtcbiAgdmFyIHZhbHVlO1xuICBpZiAoIW1lLmhhcyhvYmopKSB7XG4gICAgdmFsdWUgPSB0eXBlb2Ygb2JqICsgJy0nICsga2V5O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG1lLmhpZGRlbktleSwge1xuICAgICAgdmFsdWU6IHZhbHVlXG4gICAgfSk7XG4gICAgaWYgKCFvYmpbbWUuaGlkZGVuS2V5XSkge1xuICAgICAgLy8gaW4gbm9kZSBzZXR0aW5nIHRoZSBpbnN0cnVjdGlvbiBhYm92ZSBtaWdodCBub3QgaGF2ZSB3b3JrZWRcbiAgICAgIGNvbnNvbGUud2FybignaGFzaEtleSNkb1NldCgpIHNldHRpbmcgdGhlIHZhbHVlIG9uIHRoZSBvYmplY3QgZGlyZWN0bHknKTtcbiAgICAgIG9ialttZS5oaWRkZW5LZXldID0gdmFsdWU7XG4gICAgfVxuICAgIGFzc2VydChvYmpbbWUuaGlkZGVuS2V5XSwgJ09iamVjdC5kZWZpbmVQcm9wZXJ0eSBkaWQgbm90IHdvcmshJyk7XG4gIH1cbiAgcmV0dXJuIG1lO1xufTtcblxubWUuaGlkZGVuS2V5ID0gJ19fcG9qb3ZpektleV9fJztcblxubWUuaGFzID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHR5cGVvZiBkb0dldCh2KSA9PT0gJ3N0cmluZyc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1lOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuZnVuY3Rpb24gdHlwZSh2KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodikuc2xpY2UoOCwgLTEpO1xufVxuXG52YXIgdXRpbHMgPSB7fTtcblxuLyoqXG4gKiBBZnRlciBjYWxsaW5nIGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nYCB3aXRoIGB2YCBhcyB0aGUgc2NvcGVcbiAqIHRoZSByZXR1cm4gdmFsdWUgd291bGQgYmUgdGhlIGNvbmNhdGVuYXRpb24gb2YgJ1tPYmplY3QgJyxcbiAqIGNsYXNzIGFuZCAnXScsIGBjbGFzc2AgaXMgdGhlIHJldHVybmluZyB2YWx1ZSBvZiB0aGlzIGZ1bmN0aW9uXG4gKlxuICogZS5nLiAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChbXSkgPT0gW29iamVjdCBBcnJheV0sXG4gKiAgICAgICAgdGhlIHJldHVybmluZyB2YWx1ZSBpcyB0aGUgc3RyaW5nIEFycmF5XG4gKlxuICogQHBhcmFtIHsqfSB2XG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG51dGlscy5pbnRlcm5hbENsYXNzUHJvcGVydHkgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdHlwZSh2KTtcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZ2l2ZW4gdmFsdWUgaXMgYSBmdW5jdGlvbiwgdGhlIGxpYnJhcnkgb25seSBuZWVkc1xuICogdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2YgcHJpbWl0aXZlIHR5cGVzIChubyBuZWVkIHRvXG4gKiBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpZmZlcmVudCBraW5kcyBvZiBvYmplY3RzKVxuICpcbiAqIEBwYXJhbSAgeyp9ICB2IFRoZSB2YWx1ZSB0byBiZSBjaGVja2VkXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiAhIXYgJiYgdHlwZW9mIHYgPT09ICdmdW5jdGlvbic7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWUgaXMgYSBjb25zdHJ1Y3RvcixcbiAqIE5PVEU6IGZvciB0aGUgc2FrZSBvZiB0aGlzIGxpYnJhcnkgYSBjb25zdHJ1Y3RvciBpcyBhIGZ1bmN0aW9uXG4gKiB0aGF0IGhhcyBhIG5hbWUgd2hpY2ggc3RhcnRzIHdpdGggYW4gdXBwZXJjYXNlIGxldHRlciBhbmQgYWxzb1xuICogdGhhdCB0aGUgcHJvdG90eXBlJ3MgY29uc3RydWN0b3IgaXMgaXRzZWxmXG4gKiBAcGFyYW0geyp9IHZcbiAqL1xudXRpbHMuaXNDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB0aGlzLmlzRnVuY3Rpb24odikgJiYgdHlwZW9mIHYubmFtZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgIHYubmFtZS5sZW5ndGggJiYgdi5wcm90b3R5cGUgJiYgdi5wcm90b3R5cGUuY29uc3RydWN0b3IgPT09IHY7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiBhIGdpdmVuIHZhbHVlIGlzIGFuIG9iamVjdCwgdGhlIGxpYnJhcnkgb25seSBuZWVkc1xuICogdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2YgcHJpbWl0aXZlIHR5cGVzIChubyBuZWVkIHRvXG4gKiBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpZmZlcmVudCBraW5kcyBvZiBvYmplY3RzKVxuICpcbiAqIE5PVEU6IGEgZnVuY3Rpb24gd2lsbCBub3QgcGFzcyB0aGlzIHRlc3RcbiAqIGkuZS5cbiAqICAgICAgICB1dGlscy5pc09iamVjdChmdW5jdGlvbigpIHt9KSBpcyBmYWxzZSFcbiAqXG4gKiBTcGVjaWFsIHZhbHVlcyB3aG9zZSBgdHlwZW9mYCByZXN1bHRzIGluIGFuIG9iamVjdDpcbiAqIC0gbnVsbFxuICpcbiAqIEBwYXJhbSAgeyp9ICB2IFRoZSB2YWx1ZSB0byBiZSBjaGVja2VkXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNPYmplY3QgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gISF2ICYmIHR5cGVvZiB2ID09PSAnb2JqZWN0Jztcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhbiBvYmplY3Qgb3IgYSBmdW5jdGlvbiAobm90ZSB0aGF0IGZvciB0aGUgc2FrZVxuICogb2YgdGhlIGxpYnJhcnkgQXJyYXlzIGFyZSBub3Qgb2JqZWN0cylcbiAqXG4gKiBAcGFyYW0geyp9IHZcbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG51dGlscy5pc09iamVjdE9yRnVuY3Rpb24gPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdXRpbHMuaXNPYmplY3QodikgfHwgdXRpbHMuaXNGdW5jdGlvbih2KTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogQ2hlY2tzIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyB0cmF2ZXJzYWJsZSwgZm9yIHRoZSBzYWtlIG9mIHRoZSBsaWJyYXJ5IGFuXG4gKiBvYmplY3QgKHdoaWNoIGlzIG5vdCBhbiBhcnJheSkgb3IgYSBmdW5jdGlvbiBpcyB0cmF2ZXJzYWJsZSwgc2luY2UgdGhpcyBmdW5jdGlvblxuICogaXMgdXNlZCBieSB0aGUgb2JqZWN0IGFuYWx5emVyIG92ZXJyaWRpbmcgaXQgd2lsbCBkZXRlcm1pbmUgd2hpY2ggb2JqZWN0c1xuICogYXJlIHRyYXZlcnNhYmxlXG4gKlxuICogQHBhcmFtIHsqfSB2XG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNUcmF2ZXJzYWJsZSA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB1dGlscy5pc09iamVjdE9yRnVuY3Rpb24odik7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBzcGVjaWFsIGZ1bmN0aW9uIHdoaWNoIGlzIGFibGUgdG8gZXhlY3V0ZSBhIHNlcmllcyBvZiBmdW5jdGlvbnMgdGhyb3VnaFxuICogY2hhaW5pbmcsIHRvIHJ1biBhbGwgdGhlIGZ1bmN0aW9ucyBzdG9yZWQgaW4gdGhlIGNoYWluIGV4ZWN1dGUgdGhlIHJlc3VsdGluZyB2YWx1ZVxuICpcbiAqIC0gZWFjaCBmdW5jdGlvbiBpcyBpbnZva2VkIHdpdGggdGhlIG9yaWdpbmFsIGFyZ3VtZW50cyB3aGljaCBgZnVuY3Rpb25DaGFpbmAgd2FzXG4gKiBpbnZva2VkIHdpdGggKyB0aGUgcmVzdWx0aW5nIHZhbHVlIG9mIHRoZSBsYXN0IG9wZXJhdGlvbiBhcyB0aGUgbGFzdCBhcmd1bWVudFxuICogLSB0aGUgc2NvcGUgb2YgZWFjaCBmdW5jdGlvbiBpcyB0aGUgc2FtZSBzY29wZSBhcyB0aGUgb25lIHRoYXQgdGhlIHJlc3VsdGluZ1xuICogZnVuY3Rpb24gd2lsbCBoYXZlXG4gKlxuICogICAgdmFyIGZucyA9IHV0aWxzLmZ1bmN0aW9uQ2hhaW4oKVxuICogICAgICAgICAgICAgICAgLmNoYWluKGZ1bmN0aW9uIChhLCBiKSB7XG4gKiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGEsIGIpO1xuICogICAgICAgICAgICAgICAgICByZXR1cm4gJ2ZpcnN0JztcbiAqICAgICAgICAgICAgICAgIH0pXG4gKiAgICAgICAgICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAqICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYSwgYiwgYyk7XG4gKiAgICAgICAgICAgICAgICAgIHJldHVybiAnc2Vjb25kO1xuICogICAgICAgICAgICAgICAgfSlcbiAqICAgIGZucygxLCAyKTsgIC8vIHJldHVybnMgJ3NlY29uZCdcbiAqICAgIC8vIGxvZ3MgMSwgMlxuICogICAgLy8gbG9ncyAxLCAyLCAnZmlyc3QnXG4gKlxuICogQHJldHVybnMge0Z1bmN0aW9ufVxuICovXG51dGlscy5mdW5jdGlvbkNoYWluID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3RhY2sgPSBbXTtcbiAgdmFyIGlubmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICB2YXIgdmFsdWUgPSBudWxsO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIHZhbHVlID0gc3RhY2tbaV0uYXBwbHkodGhpcywgYXJncy5jb25jYXQodmFsdWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuICBpbm5lci5jaGFpbiA9IGZ1bmN0aW9uICh2KSB7XG4gICAgc3RhY2sucHVzaCh2KTtcbiAgICByZXR1cm4gaW5uZXI7XG4gIH07XG4gIHJldHVybiBpbm5lcjtcbn07XG5cbi8qKlxuICogR2l2ZW4gYSBzdHIgbWFkZSBvZiBhbnkgY2hhcmFjdGVycyB0aGlzIG1ldGhvZCByZXR1cm5zIGEgc3RyaW5nXG4gKiByZXByZXNlbnRhdGlvbiBvZiBhIHNpZ25lZCBpbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqL1xudXRpbHMuaGFzaENvZGUgPSBmdW5jdGlvbiAoc3RyKSB7XG4gIHZhciBpLCBsZW5ndGgsIGNoYXIsIGhhc2ggPSAwO1xuICBmb3IgKGkgPSAwLCBsZW5ndGggPSBzdHIubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBjaGFyID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgY2hhcjtcbiAgICBoYXNoID0gaGFzaCAmIGhhc2g7XG4gIH1cbiAgcmV0dXJuIFN0cmluZyhoYXNoKTtcbn07XG5cbnV0aWxzLmNyZWF0ZUV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgZGV0YWlscykge1xuICByZXR1cm4gbmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwge1xuICAgIGRldGFpbDogZGV0YWlsc1xuICB9KTtcbn07XG51dGlscy5ub3RpZmljYXRpb24gPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICB1dGlscy5maXJlR2xvYmFsRXZlbnQoJ3Bvam92aXotbm90aWZpY2F0aW9uJywgbWVzc2FnZSk7XG59O1xudXRpbHMuZmlyZUdsb2JhbEV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50LCBwYXJhbXMpIHtcbiAgaWYgKCFnbG9iYWwuZG9jdW1lbnQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGV2ID0gdXRpbHMuY3JlYXRlRXZlbnQoZXZlbnQsIHBhcmFtcyk7XG4gIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXYpO1xufTtcbnV0aWxzLmNyZWF0ZUpzb25wQ2FsbGJhY2sgPSBmdW5jdGlvbiAodXJsKSB7XG4gIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgc2NyaXB0LnNyYyA9IHVybDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xufTtcbnV0aWxzLnRvUXVlcnlTdHJpbmcgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBzID0gJycsXG4gICAgaSA9IDA7XG4gIF8uZm9yT3duKG9iaiwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICBpZiAoaSkge1xuICAgICAgcyArPSAnJic7XG4gICAgfVxuICAgIHMgKz0gayArICc9JyArIHY7XG4gICAgaSArPSAxO1xuICB9KTtcbiAgcmV0dXJuIHM7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICpcbiAqIEdpdmVuIGEgcHJvcGVydHkgbmFtZSB0aGlzIG1ldGhvZCBpZGVudGlmaWVzIGlmIGl0J3MgYSB2YWxpZCBwcm9wZXJ0eSBmb3IgdGhlIHNha2VcbiAqIG9mIHRoZSBsaWJyYXJ5LCBhIHZhbGlkIHByb3BlcnR5IGlzIGEgcHJvcGVydHkgd2hpY2ggZG9lcyBub3QgcHJvdm9rZSBhbiBlcnJvclxuICogd2hlbiB0cnlpbmcgdG8gYWNjZXNzIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIGl0IGZyb20gYW55IG9iamVjdFxuICpcbiAqIEZvciBleGFtcGxlIGV4ZWN1dGluZyB0aGUgZm9sbG93aW5nIGNvZGUgaW4gc3RyaWN0IG1vZGUgd2lsbCB5aWVsZCBhbiBlcnJvcjpcbiAqXG4gKiAgICB2YXIgZm4gPSBmdW5jdGlvbigpIHt9O1xuICogICAgZm4uYXJndW1lbnRzXG4gKlxuICogU2luY2UgYXJndW1lbnRzIGlzIHByb2hpYml0ZWQgaW4gc3RyaWN0IG1vZGVcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL1N0cmljdF9tb2RlXG4gKlxuICpcbiAqXG4gKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAqL1xudXRpbHMub2JqZWN0UHJvcGVydHlJc0ZvcmJpZGRlbiA9IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gIHZhciBrZXk7XG4gIHZhciBydWxlcyA9IHV0aWxzLnByb3BlcnR5Rm9yYmlkZGVuUnVsZXM7XG4gIGZvciAoa2V5IGluIHJ1bGVzKSB7XG4gICAgaWYgKHJ1bGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGlmIChydWxlc1trZXldKG9iamVjdCwgcHJvcGVydHkpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICpcbiAqIE1vZGlmeSB0aGlzIG9iamVjdCB0byBhZGQvcmVtb3ZlIHJ1bGVzIHRoYXQgd2lsIGJlIHJ1biBieVxuICogI29iamVjdFByb3BlcnR5SXNGb3JiaWRkZW4sIHRvIGRldGVybWluZSBpZiBhIHByb3BlcnR5IGlzIGludmFsaWRcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG51dGlscy5wcm9wZXJ0eUZvcmJpZGRlblJ1bGVzID0ge1xuICAvKipcbiAgICogYGNhbGxlcmAgYW5kIGBhcmd1bWVudHNgIGFyZSBpbnZhbGlkIHByb3BlcnRpZXMgb2YgYSBmdW5jdGlvbiBpbiBzdHJpY3QgbW9kZVxuICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBzdHJpY3RNb2RlOiBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGlmICh1dGlscy5pc0Z1bmN0aW9uKG9iamVjdCkpIHtcbiAgICAgIHJldHVybiBwcm9wZXJ0eSA9PT0gJ2NhbGxlcicgfHwgcHJvcGVydHkgPT09ICdhcmd1bWVudHMnO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFByb3BlcnRpZXMgdGhhdCBzdGFydCBhbmQgZW5kIHdpdGggX18gYXJlIHNwZWNpYWwgcHJvcGVydGllcyxcbiAgICogaW4gc29tZSBjYXNlcyB0aGV5IGFyZSB2YWxpZCAobGlrZSBfX3Byb3RvX18pIG9yIGRlcHJlY2F0ZWRcbiAgICogbGlrZSBfX2RlZmluZUdldHRlcl9fXG4gICAqXG4gICAqIGUuZy5cbiAgICogIC0gT2JqZWN0LnByb3RvdHlwZS5fX3Byb3RvX19cbiAgICogIC0gT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZUdldHRlcl9fXG4gICAqICAtIE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVTZXR0ZXJfX1xuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fbG9va3VwR2V0dGVyX19cbiAgICogIC0gT2JqZWN0LnByb3RvdHlwZS5fX2xvb2t1cFNldHRlcl9fXG4gICAqXG4gICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGhpZGRlblByb3BlcnR5OiBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIHJldHVybiBwcm9wZXJ0eS5zZWFyY2goL15fXy4qP19fJC8pID4gLTE7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFuZ3VsYXIgaGlkZGVuIHByb3BlcnRpZXMgc3RhcnQgYW5kIGVuZCB3aXRoICQkLCBmb3IgdGhlIHNha2VcbiAgICogb2YgdGhlIGxpYnJhcnkgdGhlc2UgYXJlIGludmFsaWQgcHJvcGVydGllc1xuICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBhbmd1bGFySGlkZGVuUHJvcGVydHk6IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIHByb3BlcnR5LnNlYXJjaCgvXlxcJFxcJC4qP1xcJFxcJCQvKSA+IC0xO1xuICB9LFxuXG4gIC8qKlxuICAgKiBUaGUgcHJvcGVydGllcyB0aGF0IGhhdmUgdGhlIGZvbGxvd2luZyBzeW1ib2xzIGFyZSBmb3JiaWRkZW46XG4gICAqIFs6K34hPjw9Ly9cXFtcXF1AXFwuIF1cbiAgICogQHBhcmFtIHsqfSBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgLy9zeW1ib2xzOiBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAvLyAgcmV0dXJuIHByb3BlcnR5LnNlYXJjaCgvWzorfiE+PD0vL1xcXUBcXC4gXS8pID4gLTE7XG4gIC8vfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsczsiXX0=
