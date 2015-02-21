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
var transformProperty = utils.transformProperty;

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
          escapeCls(transformProperty(d.property))
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

},{"../../renderer/utils":14,"./Node":8,"assert":2,"lodash":undefined}],8:[function(require,module,exports){
(function (global){
var _ = require('lodash'),
  d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
  utils = require('../../renderer/utils'),
  pojoVizProperty = require('./Property'),
  hashKey = require('../../util/hashKey');

var prefix = utils.prefixer;
var escapeCls = utils.escapeCls;
var margin = { top: 0, right: 0, left: 0, bottom: 0 };

function Node(parent) {
  var root = d3.select(parent.root).node();
  function my(selection) {
    // create
    var enter = selection.enter();

    function groupMouseBehavior(type) {
      var over = type === 'over';
      return function (d, i) {
        var labelEscaped = escapeCls(d.label);

        // hide all
        parent.opacityToggle(over);

        // select links
        root
          .selectAll('.' + prefix('to', labelEscaped))
          .classed('selected predecessor', over);
        root
          .selectAll('.' + prefix('from', labelEscaped))
          .classed('selected successor', over);

        // select current node
        root
          .select('.' + prefix(labelEscaped))
          .classed('selected current', over);

        // select predecessor nodes
        d.predecessors
          .forEach(function (v) {
            root
              .selectAll('.' + prefix(escapeCls(v)))
              .classed('selected predecessor', over);
          });

        // select successor nodes
        d.successors
          .forEach(function (v) {
            root
              .selectAll('.' + prefix(escapeCls(v)))
              .classed('selected successor', over);
          });
      };
    }

    var nodeEnter = enter
      .append('g')
      .attr('class', function (d) {
        var type = d.label
          .match(/^(\w)*/);
        return [
          prefix('node'),
          prefix(type[0]),
          prefix(escapeCls(d.label))
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
          var name = d.label
            .match(/\S*?-(.*)/)[1]
            .replace('-', '.');
          return name;
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

var prefix = utils.prefixer;
var escapeCls = utils.escapeCls;
var transformProperty = utils.transformProperty;

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
            prefix(
              escapeCls(transformProperty(d.property))
            )
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
        var link = d.label.match(/\S*?-([\$\w-\.]*)/);
        var ev = new CustomEvent('property-click', {
          detail: {
            name: link[1],
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

},{"../../renderer/utils":14,"lodash":undefined}],10:[function(require,module,exports){
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
      libraryNodes = nodesStringified.nodes,
      libraryEdges = nodesStringified.edges;

    // create the graph
    // each element of the graph has
    // - label
    // - width
    // - height
    // - properties
    _.forOwn(libraryNodes, function (properties, k) {
      var label = k.match(/\S*?-(.*)/)[1];
      //console.log(k, label.length);
      node = {
        label: k,
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
      nodeMap[node.label] = node;
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
        node.label
          .match(/^\S*?-([\S-]*)$/)[1]
          .replace(/-/, '.'),
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
/**
 * Gets a store hashkey only if it's an object
 * @param  {[type]} obj
 * @return {[type]}
 */
function get(obj) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  return Object.prototype.hasOwnProperty.call(obj, me.hiddenKey) &&
    obj[me.hiddenKey];
}

/**
 * TODO: document
 * Sets a key on an object
 * @param {[type]} obj [description]
 * @param {[type]} key [description]
 */
function set(obj, key) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  assert(
    key && typeof key === 'string',
    'The key needs to be a valid string'
  );
  var value;
  if (!get(obj)) {
    value = typeof obj + '-' + key;
    Object.defineProperty(obj, me.hiddenKey, {
      value: value
    });
    if (!obj[me.hiddenKey]) {
      console.warn('Object.defineProperty did not work! setting the value on the object directly');
      obj[me.hiddenKey] = value;
    }
    assert(obj[me.hiddenKey], 'Object.defineProperty did not work!');
  }
  return me;
}

me = hashKey = function (v) {
  var uid = v;
  if (utils.isObjectOrFunction(v)) {
    if (!get(v)) {
      me.createHashKeysFor(v);
    }
    uid = get(v);
    if (!uid) {
      throw Error(v + ' should have a hashKey at this point :(');
    }
    assert(uid, 'error getting the key');
    return uid;
  }

  // v is a primitive
  return typeof v + '-' + uid;
};

me.hiddenKey = '__pojovizKey__';

me.createHashKeysFor = function (obj, name) {

  function localToString(obj) {
    var match;
    try {
      match = {}.toString.call(obj).match(/^\[object (\S*?)\]/);
    } catch (e) {
      match = false;
    }
    return match && match[1];
  }

  /**
   * Analyze the internal property [[Class]] to guess the name
   * of this object, e.g. [object Date], [object Math]
   * Many object will give false positives (they will match [object Object])
   * so let's consider Object as the name only if it's equal to
   * Object.prototype
   * @param  {Object}  obj
   * @return {Boolean}
   */
  function hasAClassName(obj) {
    var match = localToString(obj);
    if (match === 'Object') {
      return obj === Object.prototype && 'Object';
    }
    return match;
  }

  function getName(obj) {
    var name, className;

    // return the already generated hashKey
    if (get(obj)) {
      return get(obj);
    }

    // generate a new key based on
    // - the name if it's a function
    // - a unique id
    name = typeof obj === 'function' &&
      typeof obj.name === 'string' &&
      obj.name;

    className = hasAClassName(obj);
    if (!name && className) {
      name = className;
    }

    name = name || _.uniqueId();
    return name;
  }

  // the name is equal to the passed name or the
  // generated name
  name = name || getName(obj);
  name = name.replace(/[\. ]/img, '-');

  // if the obj is a prototype then try to analyze
  // the constructor first so that the prototype becomes
  // [name].prototype
  // special case: object.constructor = object
  if (obj.hasOwnProperty &&
      obj.hasOwnProperty('constructor') &&
      typeof obj.constructor === 'function' &&
      obj.constructor !== obj) {
    me.createHashKeysFor(obj.constructor);
  }

  // set name on self
  set(obj, name);

  // set name on the prototype
  if (typeof obj === 'function' &&
      obj.hasOwnProperty('prototype')) {
    set(obj.prototype, name + '-prototype');
  }
};

me.has = function (v) {
  return v.hasOwnProperty &&
    v.hasOwnProperty(me.hiddenKey);
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
  symbols: function (object, property) {
    return property.search(/[:+~!><=//\]@\. ]/) > -1;
  }
};

module.exports = utils;
},{"lodash":undefined}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcmVuZGVyZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsInNyYy9yZW5kZXJlci9kMy9DYW52YXMuanMiLCJzcmMvcmVuZGVyZXIvZDMvTm9kZS5qcyIsInNyYy9yZW5kZXJlci9kMy9Qcm9wZXJ0eS5qcyIsInNyYy9yZW5kZXJlci9kMy9pbmRleC5qcyIsInNyYy9yZW5kZXJlci9kcmF3LmpzIiwic3JjL3JlbmRlcmVyL3RocmVlL1BhbkNvbnRyb2xzLmpzIiwic3JjL3JlbmRlcmVyL3RocmVlL2luZGV4LmpzIiwic3JjL3JlbmRlcmVyL3V0aWxzLmpzIiwic3JjL3V0aWwvaGFzaEtleS5qcyIsInNyYy91dGlsL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQy9OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDck9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdm9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25iQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGl0J3Mgbm90IGEgc3RhbmRhbG9uZSBwYWNrYWdlXG4vLyBidXQgaXQgZXh0ZW5kcyBwb2pvdml6J3MgZnVuY3Rpb25hbGl0eVxudmFyIHBvam92aXogPSBnbG9iYWwucG9qb3ZpejtcbmlmICghcG9qb3Zpeikge1xuICB0aHJvdyAnVGhpcyBpcyBub3QgYSBzdGFuZGFsb25lIHByb2plY3QsIHBvam92aXogbm90IGZvdW5kJztcbn1cblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbl8ubWVyZ2UocG9qb3Zpeiwge1xuICBkcmF3OiByZXF1aXJlKCcuL2RyYXcnKVxufSk7XG5cbnBvam92aXouZHJhdy5hZGRSZW5kZXJlcignZDMnLCByZXF1aXJlKCcuL2QzLycpKTtcbnBvam92aXouZHJhdy5hZGRSZW5kZXJlcigndGhyZWUnLCByZXF1aXJlKCcuL3RocmVlLycpKTtcbnBvam92aXouZHJhdy5zZXRSZW5kZXJlcignZDMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBwb2pvdml6LmRyYXc7IiwiLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHdoZW4gdXNlZCBpbiBub2RlLCB0aGlzIHdpbGwgYWN0dWFsbHkgbG9hZCB0aGUgdXRpbCBtb2R1bGUgd2UgZGVwZW5kIG9uXG4vLyB2ZXJzdXMgbG9hZGluZyB0aGUgYnVpbHRpbiB1dGlsIG1vZHVsZSBhcyBoYXBwZW5zIG90aGVyd2lzZVxuLy8gdGhpcyBpcyBhIGJ1ZyBpbiBub2RlIG1vZHVsZSBsb2FkaW5nIGFzIGZhciBhcyBJIGFtIGNvbmNlcm5lZFxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xuXG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcblxuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IHN0YWNrU3RhcnRGdW5jdGlvbi5uYW1lO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gcmVwbGFjZXIoa2V5LCB2YWx1ZSkge1xuICBpZiAodXRpbC5pc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJycgKyB2YWx1ZTtcbiAgfVxuICBpZiAodXRpbC5pc051bWJlcih2YWx1ZSkgJiYgIWlzRmluaXRlKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIGlmICh1dGlsLmlzRnVuY3Rpb24odmFsdWUpIHx8IHV0aWwuaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh1dGlsLmlzU3RyaW5nKHMpKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5hY3R1YWwsIHJlcGxhY2VyKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuZXhwZWN0ZWQsIHJlcGxhY2VyKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0J1ZmZlcihhY3R1YWwpICYmIHV0aWwuaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgaWYgKGFjdHVhbC5sZW5ndGggIT0gZXhwZWN0ZWQubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdHVhbC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFjdHVhbFtpXSAhPT0gZXhwZWN0ZWRbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoIXV0aWwuaXNPYmplY3QoYWN0dWFsKSAmJiAhdXRpbC5pc09iamVjdChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIpIHtcbiAgaWYgKHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYSkgfHwgdXRpbC5pc051bGxPclVuZGVmaW5lZChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvLyBpZiBvbmUgaXMgYSBwcmltaXRpdmUsIHRoZSBvdGhlciBtdXN0IGJlIHNhbWVcbiAgaWYgKHV0aWwuaXNQcmltaXRpdmUoYSkgfHwgdXRpbC5pc1ByaW1pdGl2ZShiKSkge1xuICAgIHJldHVybiBhID09PSBiO1xuICB9XG4gIHZhciBhSXNBcmdzID0gaXNBcmd1bWVudHMoYSksXG4gICAgICBiSXNBcmdzID0gaXNBcmd1bWVudHMoYik7XG4gIGlmICgoYUlzQXJncyAmJiAhYklzQXJncykgfHwgKCFhSXNBcmdzICYmIGJJc0FyZ3MpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGFJc0FyZ3MpIHtcbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIpO1xuICB9XG4gIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICBrYiA9IG9iamVjdEtleXMoYiksXG4gICAgICBrZXksIGk7XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh1dGlsLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhY3R1YWwgPSBlO1xuICB9XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoIXNob3VsZFRocm93ICYmIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbZmFsc2VdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB7dGhyb3cgZXJyO319O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuICAgIHZhciBjdXJyZW50UXVldWU7XG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHZhciBpID0gLTE7XG4gICAgICAgIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtpXSgpO1xuICAgICAgICB9XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbn1cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgcXVldWUucHVzaChmdW4pO1xuICAgIGlmICghZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0JyksXG4gIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgdXRpbHMgPSByZXF1aXJlKCcuLi8uLi9yZW5kZXJlci91dGlscycpLFxuICBwb2pvVml6Tm9kZSA9IHJlcXVpcmUoJy4vTm9kZScpO1xuXG52YXIgcm9vdFN2ZztcbnZhciBwcmVmaXggPSB1dGlscy5wcmVmaXhlcjtcbnZhciBlc2NhcGVDbHMgPSB1dGlscy5lc2NhcGVDbHM7XG52YXIgdHJhbnNmb3JtUHJvcGVydHkgPSB1dGlscy50cmFuc2Zvcm1Qcm9wZXJ0eTtcblxuZnVuY3Rpb24gZ2V0WChkKSB7XG4gIHJldHVybiBkLnggLSBkLndpZHRoIC8gMjtcbn1cblxuZnVuY3Rpb24gZ2V0WShkKSB7XG4gIHJldHVybiBkLnkgLSBkLmhlaWdodCAvIDI7XG59XG5cbmZ1bmN0aW9uIENhbnZhcyhkYXRhLCBlbCkge1xuICBhc3NlcnQoZWwpO1xuICB0aGlzLmlkID0gXy51bmlxdWVJZCgpO1xuICB0aGlzLmRhdGEgPSBkYXRhO1xuICB0aGlzLmNyZWF0ZVJvb3QoZWwpO1xuICB0aGlzLnNldCh7XG4gICAgbm9kZXM6IGRhdGEubm9kZXMsXG4gICAgZWRnZXM6IGRhdGEuZWRnZXNcbiAgfSk7XG59XG5cbkNhbnZhcy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmRhdGEgPSBudWxsO1xuICByb290U3ZnXG4gICAgLnNlbGVjdEFsbCgnKicpXG4gICAgLnJlbW92ZSgpO1xufTtcblxuQ2FudmFzLnByb3RvdHlwZS5jcmVhdGVSb290ID0gZnVuY3Rpb24oZWwpIHtcbiAgdmFyIHJvb3QgPSBkMy5zZWxlY3QoZWwpO1xuICBhc3NlcnQocm9vdFswXVswXSwgXCJjYW52YXMgY291bGRuJ3QgYmUgc2VsZWN0ZWRcIik7XG4gIHJvb3Quc2VsZWN0QWxsKCcqJykucmVtb3ZlKCk7XG4gIHJvb3RTdmcgPSByb290LmFwcGVuZCgnc3ZnJyk7XG4gIHJvb3RTdmcuYXR0cignc3R5bGUnLCAnd2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJScpO1xuICB0aGlzLnJvb3QgPSByb290U3ZnXG4gICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAncm9vdC0nICsgdGhpcy5pZCk7XG59O1xuXG5DYW52YXMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKG9iaiwgcmVuZGVyKSB7XG4gIHRoaXMubm9kZXMgPSBvYmoubm9kZXM7XG4gIHRoaXMuZWRnZXMgPSBvYmouZWRnZXM7XG4gIGlmIChyZW5kZXIpIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG59O1xuXG5DYW52YXMucHJvdG90eXBlLmZpeFpvb20gPSBmdW5jdGlvbigpIHtcbiAgdmFyIG1lID0gdGhpcyxcbiAgICAgIHNjciA9IHJvb3RTdmcubm9kZSgpLFxuICAgICAgYmJveCA9IHRoaXMucm9vdC5ub2RlKCkuZ2V0QkJveCgpLFxuICAgICAgc2NyZWVuV2lkdGggPSBzY3IuY2xpZW50V2lkdGgsXG4gICAgICBzY3JlZW5IZWlnaHQgPSBzY3IuY2xpZW50SGVpZ2h0LFxuICAgICAgY2FudmFzV2lkdGggPSBiYm94LndpZHRoLFxuICAgICAgY2FudmFzSGVpZ2h0ID0gYmJveC5oZWlnaHQsXG4gICAgICBzeCA9IHRoaXMuZGF0YS5tbi54LFxuICAgICAgc3kgPSB0aGlzLmRhdGEubW4ueSxcbiAgICAgIHNjYWxlID0gTWF0aC5taW4oXG4gICAgICAgIHNjcmVlbldpZHRoIC8gY2FudmFzV2lkdGgsXG4gICAgICAgIHNjcmVlbkhlaWdodCAvIGNhbnZhc0hlaWdodFxuICAgICAgKSxcbiAgICAgIHRyYW5zbGF0ZTtcblxuICBpZiAoIWlzRmluaXRlKHNjYWxlKSkge1xuICAgIHNjYWxlID0gMDtcbiAgfVxuICAvLyBjaGFuZ2UgdGhlIHNjYWxlIHByb3BvcnRpb25hbGx5IHRvIGl0cyBwcm94aW1pdHkgdG8gemVyb1xuICBzY2FsZSAtPSBzY2FsZSAvIDEwO1xuXG4gIHRyYW5zbGF0ZSA9IFtcbiAgICAtc3ggKiBzY2FsZSArIChzY3JlZW5XaWR0aCAvIDIgLVxuICAgICAgY2FudmFzV2lkdGggKiBzY2FsZSAvIDIpLFxuICAgIC1zeSAqIHNjYWxlICsgKHNjcmVlbkhlaWdodCAvIDIgLVxuICAgICAgY2FudmFzSGVpZ2h0ICogc2NhbGUgLyAyKVxuICBdO1xuXG4gIGZ1bmN0aW9uIHJlZHJhdygpIHtcbiAgICB2YXIgdHJhbnNsYXRpb24gPSBkMy5ldmVudC50cmFuc2xhdGUsXG4gICAgICAgIG5ld1ggPSB0cmFuc2xhdGlvblswXSxcbiAgICAgICAgbmV3WSA9IHRyYW5zbGF0aW9uWzFdO1xuICAgIG1lLnJvb3QuYXR0cigndHJhbnNmb3JtJyxcbiAgICAgIHV0aWxzLnRyYW5zZm9ybSh7XG4gICAgICAgIHRyYW5zbGF0ZTogW25ld1gsIG5ld1ldLFxuICAgICAgICBzY2FsZTogW2QzLmV2ZW50LnNjYWxlXVxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gem9vbUJlaGF2aW9yKHR5cGUpIHtcbiAgICB2YXIgc3RhcnQgPSB0eXBlID09PSAnc3RhcnQnO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICBkMy5zZWxlY3QodGhpcykuY2xhc3NlZCgnZHJhZ2dlZCcsIHN0YXJ0KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gY29uc29sZS5sb2coJ2NlbnRlcicsIHRyYW5zbGF0ZSk7XG4gIC8vIGNvbnNvbGUubG9nKHNjci5jbGllbnRXaWR0aCwgYmJveC53aWR0aCwgc3gpO1xuICB2YXIgem9vbSA9IGQzLmJlaGF2aW9yLnpvb20oKVxuICAgIC5vbignem9vbXN0YXJ0Jywgem9vbUJlaGF2aW9yKCdzdGFydCcpKVxuICAgIC5vbignem9vbScsIHJlZHJhdylcbiAgICAub24oJ3pvb21lbmQnLCB6b29tQmVoYXZpb3IoJ2VuZCcpKVxuICAgIC50cmFuc2xhdGUodHJhbnNsYXRlKVxuICAgIC5zY2FsZShzY2FsZSk7XG5cbiAgcm9vdFN2Zy5jYWxsKHpvb20pO1xuXG4gIG1lLnJvb3RcbiAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNmb3JtKHtcbiAgICAgIHNjYWxlOiBbc2NhbGVdLFxuICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgIC1zeCArIChzY3JlZW5XaWR0aCAvIHNjYWxlIC8gMiAtIGNhbnZhc1dpZHRoIC8gMiksXG4gICAgICAgIC1zeSArIChzY3JlZW5IZWlnaHQgLyBzY2FsZSAvIDIgLSBjYW52YXNIZWlnaHQgLyAyKVxuICAgICAgXVxuICAgIH0pKVxuICAgIC5hdHRyKCdvcGFjaXR5JywgMClcbiAgICAudHJhbnNpdGlvbigpXG4gICAgLmR1cmF0aW9uKDUwMClcbiAgICAuYXR0cignb3BhY2l0eScsIDEpO1xufTtcblxuQ2FudmFzLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yZW5kZXJOb2RlcygpO1xuICB0aGlzLnJlbmRlckVkZ2VzKCk7XG4gIHRoaXMuZml4Wm9vbSgpO1xufTtcblxuQ2FudmFzLnByb3RvdHlwZS5yZW5kZXJFZGdlcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbWUgPSB0aGlzLFxuICAgICAgZWRnZXMgPSB0aGlzLmVkZ2VzO1xuXG4gIC8vIENSRUFURVxuICB2YXIgZGlhZ29uYWwgPSBkMy5zdmcuZGlhZ29uYWwoKVxuICAuc291cmNlKGZ1bmN0aW9uKGQpIHtcbiAgICB2YXIgZnJvbSA9IG1lLnJvb3Quc2VsZWN0KCcuJyArXG4gICAgICAgICAgcHJlZml4KGVzY2FwZUNscyhkLmZyb20pKVxuICAgICAgICApO1xuICAgIGlmICghZnJvbS5ub2RlKCkpIHtcbiAgICAgIHRocm93ICdzb3VyY2Ugbm9kZSBtdXN0IGV4aXN0JztcbiAgICB9XG4gICAgdmFyIGZyb21EYXRhID0gZnJvbS5kYXR1bSgpLFxuICAgICAgICBwcm9wZXJ0eSA9IGZyb20uc2VsZWN0KCcuJyArIHByZWZpeChcbiAgICAgICAgICBlc2NhcGVDbHModHJhbnNmb3JtUHJvcGVydHkoZC5wcm9wZXJ0eSkpXG4gICAgICAgICkpLFxuICAgICAgICBwcm9wZXJ0eURhdGEgPSBkMy50cmFuc2Zvcm0ocHJvcGVydHkuYXR0cigndHJhbnNmb3JtJykpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGdldFkoZnJvbURhdGEpICsgcHJvcGVydHlEYXRhLnRyYW5zbGF0ZVsxXSAtIDIsXG4gICAgICB5OiBnZXRYKGZyb21EYXRhKSArIHByb3BlcnR5RGF0YS50cmFuc2xhdGVbMF0gLSAxMFxuICAgIH07XG4gIH0pXG4gIC50YXJnZXQoZnVuY3Rpb24oZCkge1xuICAgIHZhciB0byA9IG1lLnJvb3Quc2VsZWN0KCcuJyArXG4gICAgICAgICAgcHJlZml4KGVzY2FwZUNscyhkLnRvKSlcbiAgICAgICAgKSxcbiAgICAgICAgdG9EYXRhLCBiYm94O1xuICAgIGlmICghdG8ubm9kZSgpKSB7XG4gICAgICB0aHJvdyAndGFyZ2V0IG5vZGUgbXVzdCBleGlzdCc7XG4gICAgfVxuICAgIHRvRGF0YSA9IHRvLmRhdHVtKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGdldFkodG9EYXRhKSArIDEwLC8vICsgYmJveC5oZWlnaHQgLyAyLFxuICAgICAgeTogZ2V0WCh0b0RhdGEpLy8gKyBiYm94LndpZHRoIC8gMlxuICAgIH07XG4gIH0pXG4gIC5wcm9qZWN0aW9uKGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gW2QueSwgZC54XTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gbW91c2VFdmVudCh0eXBlKSB7XG4gICAgdmFyIG92ZXIgPSB0eXBlID09PSAnb3Zlcic7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgLmNsYXNzZWQoJ3NlbGVjdGVkJywgb3Zlcik7XG4gICAgfTtcbiAgfVxuXG4gIHRoaXMucm9vdC5zZWxlY3RBbGwoJy5saW5rJylcbiAgICAgIC5kYXRhKGVkZ2VzKVxuICAgIC5lbnRlcigpXG4gICAgICAuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgcHJlZml4KCd0bycsIGVzY2FwZUNscyhkLnRvKSksXG4gICAgICAgICAgcHJlZml4KCdmcm9tJywgZXNjYXBlQ2xzKGQuZnJvbSkpLFxuICAgICAgICAgIHByZWZpeCgnbGluaycpXG4gICAgICAgIF0uam9pbignICcpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdzdHJva2UnLCAnbGlnaHRncmF5JylcbiAgICAgIC5hdHRyKCdzdHJva2Utb3BhY2l0eScsIDAuMylcbiAgICAgIC5hdHRyKCdkJywgZGlhZ29uYWwpXG4gICAgICAub24oJ21vdXNlb3ZlcicsIG1vdXNlRXZlbnQoJ292ZXInKSlcbiAgICAgIC5vbignbW91c2VvdXQnLCBtb3VzZUV2ZW50KCdvdXQnKSk7XG59O1xuXG5DYW52YXMucHJvdG90eXBlLm9wYWNpdHlUb2dnbGUgPSBmdW5jdGlvbihkZWNyZWFzZSkge1xuICB0aGlzLnJvb3RcbiAgICAuY2xhc3NlZChwcmVmaXgoJ25vZGVzLWZvY3VzZWQnKSwgZGVjcmVhc2UpO1xufTtcblxuQ2FudmFzLnByb3RvdHlwZS5yZW5kZXJOb2RlcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbm9kZXMgPSB0aGlzLm5vZGVzO1xuXG4gIHZhciBub2RlQ3RvciA9IHBvam9WaXpOb2RlKHRoaXMpO1xuICBub2RlQ3Rvci5tYXJnaW4oe1xuICAgIHRvcDogMTAsXG4gICAgbGVmdDogMTAsXG4gICAgcmlnaHQ6IDEwLFxuICAgIGJvdHRvbTogMTBcbiAgfSk7XG4gIHZhciBub2RlR3JvdXAgPSB0aGlzLnJvb3Quc2VsZWN0QWxsKHByZWZpeCgnbm9kZScpKVxuICAgIC5kYXRhKG5vZGVzKVxuICAgIC5jYWxsKG5vZGVDdG9yKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FudmFzOyIsInZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyksXG4gIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gIHV0aWxzID0gcmVxdWlyZSgnLi4vLi4vcmVuZGVyZXIvdXRpbHMnKSxcbiAgcG9qb1ZpelByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxuICBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9oYXNoS2V5Jyk7XG5cbnZhciBwcmVmaXggPSB1dGlscy5wcmVmaXhlcjtcbnZhciBlc2NhcGVDbHMgPSB1dGlscy5lc2NhcGVDbHM7XG52YXIgbWFyZ2luID0geyB0b3A6IDAsIHJpZ2h0OiAwLCBsZWZ0OiAwLCBib3R0b206IDAgfTtcblxuZnVuY3Rpb24gTm9kZShwYXJlbnQpIHtcbiAgdmFyIHJvb3QgPSBkMy5zZWxlY3QocGFyZW50LnJvb3QpLm5vZGUoKTtcbiAgZnVuY3Rpb24gbXkoc2VsZWN0aW9uKSB7XG4gICAgLy8gY3JlYXRlXG4gICAgdmFyIGVudGVyID0gc2VsZWN0aW9uLmVudGVyKCk7XG5cbiAgICBmdW5jdGlvbiBncm91cE1vdXNlQmVoYXZpb3IodHlwZSkge1xuICAgICAgdmFyIG92ZXIgPSB0eXBlID09PSAnb3Zlcic7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgdmFyIGxhYmVsRXNjYXBlZCA9IGVzY2FwZUNscyhkLmxhYmVsKTtcblxuICAgICAgICAvLyBoaWRlIGFsbFxuICAgICAgICBwYXJlbnQub3BhY2l0eVRvZ2dsZShvdmVyKTtcblxuICAgICAgICAvLyBzZWxlY3QgbGlua3NcbiAgICAgICAgcm9vdFxuICAgICAgICAgIC5zZWxlY3RBbGwoJy4nICsgcHJlZml4KCd0bycsIGxhYmVsRXNjYXBlZCkpXG4gICAgICAgICAgLmNsYXNzZWQoJ3NlbGVjdGVkIHByZWRlY2Vzc29yJywgb3Zlcik7XG4gICAgICAgIHJvb3RcbiAgICAgICAgICAuc2VsZWN0QWxsKCcuJyArIHByZWZpeCgnZnJvbScsIGxhYmVsRXNjYXBlZCkpXG4gICAgICAgICAgLmNsYXNzZWQoJ3NlbGVjdGVkIHN1Y2Nlc3NvcicsIG92ZXIpO1xuXG4gICAgICAgIC8vIHNlbGVjdCBjdXJyZW50IG5vZGVcbiAgICAgICAgcm9vdFxuICAgICAgICAgIC5zZWxlY3QoJy4nICsgcHJlZml4KGxhYmVsRXNjYXBlZCkpXG4gICAgICAgICAgLmNsYXNzZWQoJ3NlbGVjdGVkIGN1cnJlbnQnLCBvdmVyKTtcblxuICAgICAgICAvLyBzZWxlY3QgcHJlZGVjZXNzb3Igbm9kZXNcbiAgICAgICAgZC5wcmVkZWNlc3NvcnNcbiAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgcm9vdFxuICAgICAgICAgICAgICAuc2VsZWN0QWxsKCcuJyArIHByZWZpeChlc2NhcGVDbHModikpKVxuICAgICAgICAgICAgICAuY2xhc3NlZCgnc2VsZWN0ZWQgcHJlZGVjZXNzb3InLCBvdmVyKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBzZWxlY3Qgc3VjY2Vzc29yIG5vZGVzXG4gICAgICAgIGQuc3VjY2Vzc29yc1xuICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICByb290XG4gICAgICAgICAgICAgIC5zZWxlY3RBbGwoJy4nICsgcHJlZml4KGVzY2FwZUNscyh2KSkpXG4gICAgICAgICAgICAgIC5jbGFzc2VkKCdzZWxlY3RlZCBzdWNjZXNzb3InLCBvdmVyKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIG5vZGVFbnRlciA9IGVudGVyXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHZhciB0eXBlID0gZC5sYWJlbFxuICAgICAgICAgIC5tYXRjaCgvXihcXHcpKi8pO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHByZWZpeCgnbm9kZScpLFxuICAgICAgICAgIHByZWZpeCh0eXBlWzBdKSxcbiAgICAgICAgICBwcmVmaXgoZXNjYXBlQ2xzKGQubGFiZWwpKVxuICAgICAgICBdLmpvaW4oJyAnKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLnRyYW5zbGF0ZShcbiAgICAgICAgICBkLnggLSBkLndpZHRoIC8gMixcbiAgICAgICAgICBkLnkgLSBkLmhlaWdodCAvIDJcbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlb3ZlcicsIGdyb3VwTW91c2VCZWhhdmlvcignb3ZlcicpKVxuICAgICAgLm9uKCdtb3VzZW91dCcsIGdyb3VwTW91c2VCZWhhdmlvcignb3V0JykpO1xuXG4gICAgbm9kZUVudGVyXG4gICAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAgIC5hdHRyKCdyeCcsIDUpXG4gICAgICAuYXR0cigncnknLCA1KVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ25vZGUtYmFja2dyb3VuZCcpO1xuXG4gICAgbm9kZUVudGVyXG4gICAgICAvLyAuYXBwZW5kKCdnJylcbiAgICAgIC5hcHBlbmQoJ3RleHQnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBwcmVmaXgoJ3RpdGxlJykpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDIwLCAyNSknKVxuICAgICAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgIHZhciBuYW1lID0gZC5sYWJlbFxuICAgICAgICAgICAgLm1hdGNoKC9cXFMqPy0oLiopLylbMV1cbiAgICAgICAgICAgIC5yZXBsYWNlKCctJywgJy4nKTtcbiAgICAgICAgICByZXR1cm4gbmFtZTtcbiAgICAgICAgfSk7XG5cbiAgICAvLyBub2RlRW50ZXJcbiAgICAvLyAgIC5hcHBlbmQoJ3RleHQnKVxuICAgIC8vICAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKVxuICAgIC8vICAgICAudGV4dChmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5sYWJlbDsgfSk7XG5cbiAgICB2YXIgYm9keUVudGVyID0gbm9kZUVudGVyXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgcHJlZml4KCdib2R5JykpO1xuXG4gICAgdmFyIHByb3BlcnR5Q3RvciA9IHBvam9WaXpQcm9wZXJ0eSgpO1xuICAgIHByb3BlcnR5Q3Rvci5tYXJnaW4obWFyZ2luKTtcbiAgICBib2R5RW50ZXIuc2VsZWN0QWxsKCdnLicgKyBwcmVmaXgoJ3Byb3BlcnR5JykpXG4gICAgICAuZGF0YShmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLnByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbiAocCkge1xuICAgICAgICAgIHAubGFiZWwgPSBkLmxhYmVsO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGQucHJvcGVydGllcztcbiAgICAgIH0pXG4gICAgICAuY2FsbChwcm9wZXJ0eUN0b3IpO1xuXG4gICAgLy8gZml4IG5vZGUgYmFja2dyb3VuZCB3aWR0aC9oZWlnaHRcbiAgICBzZWxlY3Rpb24uZWFjaChmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgdmFyIGVsID0gZDMuc2VsZWN0KHRoaXMpLFxuICAgICAgICAgIHJlY3QgPSBlbC5zZWxlY3QoJ3JlY3Qubm9kZS1iYWNrZ3JvdW5kJyk7XG5cbiAgICAgIC8vIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGJib3ggPSBlbC5ub2RlKCkuZ2V0QkJveCgpO1xuICAgICAgcmVjdFxuICAgICAgICAuYXR0cignd2lkdGgnLCBiYm94LndpZHRoICsgMjApXG4gICAgICAgIC5hdHRyKCdoZWlnaHQnLCBiYm94LmhlaWdodCArIDIwKTtcbiAgICAgIC8vIH0sIDApO1xuICAgIH0pO1xuICB9XG4gIG15Lm1hcmdpbiA9IGZ1bmN0aW9uIChtKSB7XG4gICAgaWYgKCFtKSB7XG4gICAgICByZXR1cm4gbWFyZ2luO1xuICAgIH1cbiAgICBtYXJnaW4gPSBfLm1lcmdlKG1hcmdpbiwgbSk7XG4gIH07XG4gIHJldHVybiBteTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBOb2RlOyIsInZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICBfID0gcmVxdWlyZSgnbG9kYXNoJyksXG4gIHV0aWxzID0gcmVxdWlyZSgnLi4vLi4vcmVuZGVyZXIvdXRpbHMnKTtcblxudmFyIHByZWZpeCA9IHV0aWxzLnByZWZpeGVyO1xudmFyIGVzY2FwZUNscyA9IHV0aWxzLmVzY2FwZUNscztcbnZhciB0cmFuc2Zvcm1Qcm9wZXJ0eSA9IHV0aWxzLnRyYW5zZm9ybVByb3BlcnR5O1xuXG5mdW5jdGlvbiBQcm9wZXJ0eSgpIHtcbiAgdmFyIG1hcmdpbiA9IHtcbiAgICB0b3A6IDAsXG4gICAgcmlnaHQ6IDAsXG4gICAgYm90dG9tOiAwLFxuICAgIGxlZnQ6IDBcbiAgfTtcblxuICB2YXIgdGl0bGVIZWlnaHQgPSA0MDtcblxuICBmdW5jdGlvbiBteShzZWxlY3Rpb24pIHtcblxuICAgIGZ1bmN0aW9uIHByb3BlcnR5WShkLCBpKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICBtYXJnaW4ubGVmdCArIDEwLFxuICAgICAgICBtYXJnaW4udG9wICsgdGl0bGVIZWlnaHQgKyBpICogMTVcbiAgICAgIF07XG4gICAgfVxuXG4gICAgLy8gUFJPUEVSVFkgQ1JFQVRFXG4gICAgZnVuY3Rpb24gbW91c2VFdmVudCh0eXBlKSB7XG4gICAgICB2YXIgb3ZlciA9IHR5cGUgPT09ICdvdmVyJztcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAuZHVyYXRpb24oMzAwKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHV0aWxzLnRyYW5zZm9ybSh7XG4gICAgICAgICAgICAgICAgdHJhbnNsYXRlOiBwcm9wZXJ0eVkoZCwgaSksXG4gICAgICAgICAgICAgICAgc2NhbGU6IFtvdmVyID8gMS41IDogMV1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfVxuICAgIHZhciBwcm9wZXJ0eUVudGVyID0gc2VsZWN0aW9uLmVudGVyKClcbiAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHByZWZpeCgncHJvcGVydHknKSxcbiAgICAgICAgICAgIHByZWZpeChcbiAgICAgICAgICAgICAgZXNjYXBlQ2xzKHRyYW5zZm9ybVByb3BlcnR5KGQucHJvcGVydHkpKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIF0uam9pbignICcpO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICByZXR1cm4gdXRpbHMudHJhbnNmb3JtKHtcbiAgICAgICAgICAgIHRyYW5zbGF0ZTogcHJvcGVydHlZKGQsIGkpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignbW91c2VvdmVyJywgbW91c2VFdmVudCgnb3ZlcicpKVxuICAgICAgICAub24oJ21vdXNlb3V0JywgbW91c2VFdmVudCgnb3V0JykpO1xuXG4gICAgcHJvcGVydHlFbnRlclxuICAgICAgLmFwcGVuZCgndGV4dCcpXG4gICAgICAuYXR0cignZm9udC1zaXplJywgMTApXG4gICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnc3RhcnQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICBwcmVmaXgoJ2tleScpXG4gICAgICAgIF0uam9pbignICcpO1xuICAgICAgfSlcbiAgICAgIC50ZXh0KGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIHJldHVybiBkLnByb3BlcnR5O1xuICAgICAgfSlcbiAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICB2YXIgbGluayA9IGQubGFiZWwubWF0Y2goL1xcUyo/LShbXFwkXFx3LVxcLl0qKS8pO1xuICAgICAgICB2YXIgZXYgPSBuZXcgQ3VzdG9tRXZlbnQoJ3Byb3BlcnR5LWNsaWNrJywge1xuICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgbmFtZTogbGlua1sxXSxcbiAgICAgICAgICAgIHByb3BlcnR5OiBkLnByb3BlcnR5XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldik7XG4gICAgICB9KTtcblxuICAgIHZhciByZWN0V3JhcCA9IHByb3BlcnR5RW50ZXJcbiAgICAgIC5pbnNlcnQoJ3JlY3QnLCAndGV4dCcpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHByZWZpeChkLnR5cGUpLFxuICAgICAgICAgIHByZWZpeCgncHJvcGVydHknLCAnYmFja2dyb3VuZCcpXG4gICAgICAgIF0uam9pbignICcpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdyeCcsIDMpXG4gICAgICAuYXR0cigncnknLCAzKVxuICAgICAgLmF0dHIoJ3gnLCAtMilcbiAgICAgIC5hdHRyKCd5JywgLTkpO1xuXG4gICAgc2VsZWN0aW9uLnNlbGVjdEFsbCgncmVjdC4nICsgcHJlZml4KCdwcm9wZXJ0eScsICdiYWNrZ3JvdW5kJykpXG4gICAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICB2YXIgbWUgPSBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuYXR0cignaGVpZ2h0JywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHZhciB0ZXh0ID0gZDNcbiAgICAgICAgICAgICAgLnNlbGVjdCh0aGlzLnBhcmVudE5vZGUpXG4gICAgICAgICAgICAgIC5zZWxlY3QoJ3RleHQnKTtcbiAgICAgICAgICAgIHJldHVybiB0ZXh0LnByb3BlcnR5KCdjbGllbnRIZWlnaHQnKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICB2YXIgdGV4dCA9IGQzXG4gICAgICAgICAgICAgIC5zZWxlY3QodGhpcy5wYXJlbnROb2RlKVxuICAgICAgICAgICAgICAuc2VsZWN0KCd0ZXh0Jyk7XG4gICAgICAgICAgICByZXR1cm4gdGV4dC5wcm9wZXJ0eSgnY2xpZW50V2lkdGgnKSArIDM7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIHByb3BlcnR5RW50ZXIuZWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgaWYgKGQudHlwZSA9PT0gJ29iamVjdCcgfHwgZC50eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAgICAgLmF0dHIoJ3InLCA0KVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsIHByZWZpeCgnZG90LScgKyBkLnR5cGUpKVxuICAgICAgICAgIC5hdHRyKCdjeCcsIC0xMClcbiAgICAgICAgICAuYXR0cignY3knLCAtMilcbiAgICAgICAgICAuYXR0cignb3BhY2l0eScsIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIG15Lm1hcmdpbiA9IGZ1bmN0aW9uIChtKSB7XG4gICAgaWYgKCFtKSB7XG4gICAgICByZXR1cm4gbWFyZ2luO1xuICAgIH1cbiAgICBtYXJnaW4gPSBfLm1lcmdlKG1hcmdpbiwgbSk7XG4gIH07XG4gIHJldHVybiBteTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQcm9wZXJ0eTsiLCJ2YXIgQ2FudmFzID0gcmVxdWlyZSgnLi9DYW52YXMnKSxcbiAgY2FudmFzLFxuICBjYW52YXNFbDtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNsZWFyOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGNhbnZhcykge1xuICAgICAgY2FudmFzLmRlc3Ryb3koKTtcbiAgICB9XG4gIH0sXG4gIHJlbmRlcjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBjYW52YXMgPSBuZXcgQ2FudmFzKGRhdGEsIGNhbnZhc0VsKTtcbiAgICBjYW52YXMucmVuZGVyKCk7XG4gIH0sXG4gIHNldENhbnZhc0VsOiBmdW5jdGlvbiAoZWwpIHtcbiAgICBjYW52YXNFbCA9IGVsO1xuICB9XG59O1xuXG4vLyBjdXN0b20gZXZlbnRzXG5nbG9iYWwuZG9jdW1lbnQgJiYgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncHJvcGVydHktY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICB2YXIgZGV0YWlsID0gZS5kZXRhaWw7XG4gIGdsb2JhbC5wb2pvdml6XG4gICAgLmdldEN1cnJlbnRJbnNwZWN0b3IoKVxuICAgIC5zaG93U2VhcmNoKGRldGFpbC5uYW1lLCBkZXRhaWwucHJvcGVydHkpO1xufSk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IG1hdXJpY2lvIG9uIDIvMTgvMTUuXG4gKi9cbnZhciBkYWdyZSA9IHJlcXVpcmUoJ2RhZ3JlJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHBvam92aXogPSBnbG9iYWwucG9qb3ZpejtcbnZhciB1dGlscyA9IHBvam92aXoudXRpbHM7XG5cbnZhciByZW5kZXJlcjtcbm1vZHVsZS5leHBvcnRzID0ge1xuICByZW5kZXJlcnM6IHt9LFxuXG4gIC8qKlxuICAgKiBHaXZlbiBhbiBpbnNwZWN0b3IgaW5zdGFuY2UgaXQgYnVpbGQgdGhlIGdyYXBoIGFuZCBhbHNvIHRoZVxuICAgKiBsYXlvdXQgb2YgdGhlIG5vZGVzIGJlbG9uZ2luZyB0byBpdCwgdGhlIHJlc3VsdGluZyBvYmplY3QgaXNcbiAgICogYW4gb2JqZWN0IHdoaWNoIGlzIHVzZWQgYnkgYSByZW5kZXJlciB0byBiZSBkcmF3blxuICAgKiBAcGFyYW0ge0luc3BlY3Rvcn0gaW5zcGVjdG9yXG4gICAqL1xuICBwcm9jZXNzOiBmdW5jdGlvbiAoaW5zcGVjdG9yKSB7XG4gICAgcmV0dXJuIHRoaXMuZG9Qcm9jZXNzKGluc3BlY3Rvci5hbmFseXplci5zdHJpbmdpZnkoKSk7XG4gIH0sXG4gIC8qKlxuICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZXNTdHJpbmdpZmllZCBBbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXNcbiAgICogIHtcbiAgICogICAgbm9kZXM6IFt7fSwgLi5dIGVhY2ggb2JqZWN0IGlzIGdlbmVyYXRlZCBpbiBPYmplY3RBbmFseXplciNzdHJpbmdpZnksXG4gICAqICAgIGVkZ2VzOiBbe30sIC4uXSBlYWNoIG9iamVjdCBpcyBnZW5lcmF0ZWQgaW4gT2JqZWN0QW5hbHl6ZXIjc3RyaW5naWZ5XG4gICAqICB9XG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gcmV0dXJuIEFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgaW5mbzpcbiAgICogIHtcbiAgICogICAgIG5vZGVzOiBbYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBoYXZpbmcgbGFiZWwseCx5LGhlaWdodCxcbiAgICogICAgICAgICAgICB3aWR0aCxwcm9wZXJ0aWVzLHN1Y2Nlc3NvcnMscHJlZGVjZXNzb3JzXSxcbiAgICogICAgIGVkZ2VzOiBbYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBoYXZpbmcgdG8sZnJvbSxwcm9wZXJ0eV0sXG4gICAqICAgICBjZW50ZXI6IGFuIG9iamVjdCB3aXRoIHRoZSBjZW50ZXIgb2YgdGhlIGJib3ggdGhhdCBjb3ZlcnNcbiAgICogICAgICAgICAgICB0aGUgbGF5b3V0IG9mIHRoZSBncmFwaFxuICAgKiAgICAgbW46IGFuIG9iamVjdCB3aXRoIGluZm8gYWJvdXQgdGhlIG1pbmltdW0geCx5IG9mIHRoZSBiYm94XG4gICAqICAgICAgICAgICAgdGhhdCBjb3ZlcnMgdGhlIGxheW91dCBvZiB0aGUgZ3JhcGhcbiAgICogICAgIG14OiBhbiBvYmplY3Qgd2l0aCBpbmZvIGFib3V0IHRoZSBtYXhpbXVtIHgseSBvZiB0aGUgYmJveFxuICAgKiAgICAgICAgICAgIHRoYXQgY292ZXJzIHRoZSBsYXlvdXQgb2YgdGhlIGdyYXBoXG4gICAqICB9XG4gICAqL1xuICBkb1Byb2Nlc3M6IGZ1bmN0aW9uIChub2Rlc1N0cmluZ2lmaWVkKSB7XG4gICAgdmFyIGcgPSBuZXcgZGFncmUuRGlncmFwaCgpLFxuICAgICAgbm9kZSxcbiAgICAgIGxpYnJhcnlOb2RlcyA9IG5vZGVzU3RyaW5naWZpZWQubm9kZXMsXG4gICAgICBsaWJyYXJ5RWRnZXMgPSBub2Rlc1N0cmluZ2lmaWVkLmVkZ2VzO1xuXG4gICAgLy8gY3JlYXRlIHRoZSBncmFwaFxuICAgIC8vIGVhY2ggZWxlbWVudCBvZiB0aGUgZ3JhcGggaGFzXG4gICAgLy8gLSBsYWJlbFxuICAgIC8vIC0gd2lkdGhcbiAgICAvLyAtIGhlaWdodFxuICAgIC8vIC0gcHJvcGVydGllc1xuICAgIF8uZm9yT3duKGxpYnJhcnlOb2RlcywgZnVuY3Rpb24gKHByb3BlcnRpZXMsIGspIHtcbiAgICAgIHZhciBsYWJlbCA9IGsubWF0Y2goL1xcUyo/LSguKikvKVsxXTtcbiAgICAgIC8vY29uc29sZS5sb2coaywgbGFiZWwubGVuZ3RoKTtcbiAgICAgIG5vZGUgPSB7XG4gICAgICAgIGxhYmVsOiBrLFxuICAgICAgICB3aWR0aDogbGFiZWwubGVuZ3RoICogMTBcbiAgICAgIH07XG4gICAgICAvLyBsaW5lcyArIGhlYWRlciArIHBhZGRpbmcgYm90dG9tXG4gICAgICBub2RlLmhlaWdodCA9IHByb3BlcnRpZXMubGVuZ3RoICogMTUgKyA1MDtcbiAgICAgIG5vZGUucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgbm9kZS53aWR0aCA9IE1hdGgubWF4KG5vZGUud2lkdGgsIHYucHJvcGVydHkubGVuZ3RoICogMTApO1xuICAgICAgfSk7XG4gICAgICBnLmFkZE5vZGUoaywgbm9kZSk7XG4gICAgfSk7XG5cbiAgICAvLyBidWlsZCB0aGUgZWRnZXMgZnJvbSBub2RlIHRvIG5vZGVcbiAgICBfLmZvck93bihsaWJyYXJ5RWRnZXMsIGZ1bmN0aW9uIChsaW5rcykge1xuICAgICAgbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobGluaykge1xuICAgICAgICBpZiAoZy5oYXNOb2RlKGxpbmsuZnJvbSkgJiYgZy5oYXNOb2RlKGxpbmsudG8pKSB7XG4gICAgICAgICAgZy5hZGRFZGdlKG51bGwsIGxpbmsuZnJvbSwgbGluay50byk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gZ2VuZXJhdGUgdGhlIGdyYXBoIGxheW91dFxuICAgIHZhciBsYXlvdXQgPSBkYWdyZS5sYXlvdXQoKVxuICAgICAgLm5vZGVTZXAoMzApXG4gICAgICAvLyAucmFua1NlcCg3MClcbiAgICAgIC8vIC5yYW5rRGlyKCdUQicpXG4gICAgICAucnVuKGcpO1xuXG4gICAgdmFyIG5vZGVzID0gW10sXG4gICAgICBlZGdlcyA9IFtdLFxuICAgICAgY2VudGVyID0ge3g6IDAsIHk6IDB9LFxuICAgICAgbW4gPSB7eDogSW5maW5pdHksIHk6IEluZmluaXR5fSxcbiAgICAgIG14ID0ge3g6IC1JbmZpbml0eSwgeTogLUluZmluaXR5fSxcbiAgICAgIHRvdGFsID0gZy5ub2RlcygpLmxlbmd0aDtcblxuICAgIC8vIHVwZGF0ZSB0aGUgbm9kZSBpbmZvIGFkZGluZzpcbiAgICAvLyAtIHggKHgtY29vcmRpbmF0ZSBvZiB0aGUgY2VudGVyIG9mIHRoZSBub2RlKVxuICAgIC8vIC0geSAoeS1jb29yZGluYXRlIG9mIHRoZSBjZW50ZXIgb2YgdGhlIG5vZGUpXG4gICAgLy8gLSBwcmVkZWNlc3NvcnMgKGFuIGFycmF5IHdpdGggdGhlIGlkZW50aWZpZXJzIG9mIHRoZSBwcmVkZWNlc3NvcnMgb2YgdGhpcyBub2RlKVxuICAgIC8vIC0gc3VjY2Vzc29ycyAoYW4gYXJyYXkgd2l0aCB0aGUgaWRlbnRpZmllcnMgb2YgdGhlIHN1Y2Nlc3NvciBvZiB0aGlzIG5vZGUpXG4gICAgbGF5b3V0LmVhY2hOb2RlKGZ1bmN0aW9uIChrLCBsYXlvdXRJbmZvKSB7XG4gICAgICB2YXIgeCA9IGxheW91dEluZm8ueDtcbiAgICAgIHZhciB5ID0gbGF5b3V0SW5mby55O1xuXG4gICAgICBub2RlID0gZy5ub2RlKGspO1xuICAgICAgbm9kZS54ID0geDtcbiAgICAgIG5vZGUueSA9IHk7XG4gICAgICBub2RlLnByZWRlY2Vzc29ycyA9IGcucHJlZGVjZXNzb3JzKGspO1xuICAgICAgbm9kZS5zdWNjZXNzb3JzID0gZy5zdWNjZXNzb3JzKGspO1xuICAgICAgbm9kZXMucHVzaChub2RlKTtcblxuICAgICAgLy8gY2FsY3VsYXRlIHRoZSBiYm94IG9mIHRoZSBncmFwaCB0byBjZW50ZXIgdGhlIGdyYXBoXG4gICAgICB2YXIgbW54ID0geCAtIG5vZGUud2lkdGggLyAyO1xuICAgICAgdmFyIG1ueSA9IHkgLSBub2RlLmhlaWdodCAvIDI7XG4gICAgICB2YXIgbXh4ID0geCArIG5vZGUud2lkdGggLyAyO1xuICAgICAgdmFyIG14eSA9IHkgKyBub2RlLmhlaWdodCAvIDI7XG5cbiAgICAgIGNlbnRlci54ICs9IHg7XG4gICAgICBjZW50ZXIueSArPSB5O1xuICAgICAgbW4ueCA9IE1hdGgubWluKG1uLngsIG1ueCk7XG4gICAgICBtbi55ID0gTWF0aC5taW4obW4ueSwgbW55KTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHgsIHksICcgZGltICcsIG5vZGUud2lkdGgsIG5vZGUuaGVpZ2h0KTtcbiAgICAgIG14LnggPSBNYXRoLm1heChteC54LCBteHgpO1xuICAgICAgbXgueSA9IE1hdGgubWF4KG14LnksIG14eSk7XG4gICAgfSk7XG5cbiAgICBjZW50ZXIueCAvPSAodG90YWwgfHwgMSk7XG4gICAgY2VudGVyLnkgLz0gKHRvdGFsIHx8IDEpO1xuXG4gICAgLy8gY3JlYXRlIHRoZSBlZGdlcyBmcm9tIHByb3BlcnR5IHRvIG5vZGVcbiAgICBfLmZvck93bihsaWJyYXJ5RWRnZXMsIGZ1bmN0aW9uIChsaW5rcykge1xuICAgICAgbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobGluaykge1xuICAgICAgICBpZiAoZy5oYXNOb2RlKGxpbmsuZnJvbSkgJiYgZy5oYXNOb2RlKGxpbmsudG8pKSB7XG4gICAgICAgICAgZWRnZXMucHVzaChsaW5rKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZWRnZXM6IGVkZ2VzLFxuICAgICAgbm9kZXM6IG5vZGVzLFxuICAgICAgY2VudGVyOiBjZW50ZXIsXG4gICAgICBtbjogbW4sXG4gICAgICBteDogbXhcbiAgICB9O1xuICB9LFxuXG4gIC8qKlxuICAgKiBEcmF3cyB0aGUgY3VycmVudCBpbnNwZWN0b3IgaW4gdGhlIGNhbnZhcyB3aXRoIHRoZSBmb2xsb3dpbmcgc3RlcHM6XG4gICAqXG4gICAqIC0gY2xlYXJzIHRoZSBjYW52YXNcbiAgICogLSBwcm9jZXNzZXMgdGhlIGRhdGEgb2YgdGhlIGN1cnJlbnQgaW5zcGVjdG9yXG4gICAqIC0gcmVuZGVycyB0aGUgZGF0YSBwcm9kdWNlZCBieSB0aGUgbWV0aG9kIGFib3ZlXG4gICAqIC0gbm90aWZpZXMgdGhlIHVzZXIgb2YgYW55IGFjdGlvbiBwZXJmb3JtZWRcbiAgICpcbiAgICogQHBhcmFtIHtJbnNwZWN0b3J9IFtpbnNwZWN0b3JdXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbcmVuZGVyZXJdXG4gICAqL1xuICByZW5kZXI6IGZ1bmN0aW9uIChpbnNwZWN0b3IsIHJlbmRlcmVyKSB7XG4gICAgdmFyIGRhdGE7XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIGluc3BlY3RvciA9IGluc3BlY3RvciB8fCBwb2pvdml6LmdldEN1cnJlbnRJbnNwZWN0b3IoKTtcbiAgICByZW5kZXJlciA9IHJlbmRlcmVyIHx8IHBvam92aXouZHJhdy5nZXRDdXJyZW50UmVuZGVyZXIoKTtcblxuICAgIHV0aWxzLm5vdGlmaWNhdGlvbigncHJvY2Vzc2luZyAnICsgaW5zcGVjdG9yLmVudHJ5UG9pbnQpO1xuXG4gICAgLy8gcHJlIHJlbmRlclxuICAgIHJlbmRlcmVyLmNsZWFyKCk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGluc3BlY3Rvci5wcmVSZW5kZXIoKTtcbiAgICAgIGNvbnNvbGUubG9nKCdwcm9jZXNzICYgcmVuZGVyIHN0YXJ0OiAnLCBuZXcgRGF0ZSgpKTtcbiAgICAgIC8vIGRhdGE6XG4gICAgICAvLyAtIGVkZ2VzIChwcm9wZXJ0eSAtPiBub2RlKVxuICAgICAgLy8gLSBub2Rlc1xuICAgICAgLy8gLSBjZW50ZXJcbiAgICAgIGNvbnNvbGUudGltZSgncHJvY2VzcycpO1xuICAgICAgZGF0YSA9IG1lLnByb2Nlc3MoaW5zcGVjdG9yKTtcbiAgICAgIGNvbnNvbGUudGltZUVuZCgncHJvY2VzcycpO1xuXG4gICAgICB1dGlscy5ub3RpZmljYXRpb24oJ3JlbmRlcmluZyAnICsgKGluc3BlY3Rvci5kaXNwbGF5TmFtZSB8fCBpbnNwZWN0b3IuZW50cnlQb2ludCkpO1xuXG4gICAgICBjb25zb2xlLnRpbWUoJ3JlbmRlcicpO1xuICAgICAgcmVuZGVyZXIucmVuZGVyKGRhdGEpO1xuICAgICAgY29uc29sZS50aW1lRW5kKCdyZW5kZXInKTtcblxuICAgICAgdXRpbHMubm90aWZpY2F0aW9uKCdjb21wbGV0ZSEnKTtcbiAgICB9LCAwKTtcbiAgfSxcblxuICAvKipcbiAgICogQWRkcyBhIHJlbmRlcmVyIHRvIHRoZSBhdmFpbGFibGUgcmVuZGVyZXJzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIEl0IG5lZWRzIHRvIGhhdmUgdGhlIGZvbGxvd2luZyBtZXRob2RzOlxuICAgKiAgLSBjbGVhclxuICAgKiAgLSByZW5kZXJcbiAgICovXG4gIGFkZFJlbmRlcmVyOiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIC8vIHRoZSByZW5kZXJlciBtdXN0IGJlIGFuIG9iamVjdCBhbmQgaGF2ZSB0aGUgZm9sbG93aW5nIG1ldGhvZHM6XG4gICAgLy8gLSByZW5kZXJcbiAgICAvLyAtIGNsZWFyXG4gICAgYXNzZXJ0KHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcsICd2YWx1ZSBpcyBub3QgYW4gb2JqZWN0Jyk7XG4gICAgYXNzZXJ0KHZhbHVlLmNsZWFyICYmIHZhbHVlLnJlbmRlciwgJ2NsZWFyICYgcmVuZGVyIG11c3QgYmUgZGVmaW5lZCBvbiBvYmplY3QnKTtcbiAgICB0aGlzLnJlbmRlcmVyc1trZXldID0gdmFsdWU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHZhbHVlIG9mIHRoZSBjdXJyZW50IHJlbmRlcmVyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByXG4gICAqL1xuICBzZXRSZW5kZXJlcjogZnVuY3Rpb24gKHIpIHtcbiAgICByZW5kZXJlciA9IHRoaXMucmVuZGVyZXJzW3JdO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIGEgcmVuZGVyZXIgYnkga2V5XG4gICAqIEBwYXJhbSBrZXlcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBnZXRSZW5kZXJlcjogZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcmVyc1trZXldO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHJlbmRlcmVyXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgZ2V0Q3VycmVudFJlbmRlcmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyO1xuICB9XG59OyIsIi8qKlxuICogQGF1dGhvciBxaWFvIC8gaHR0cHM6Ly9naXRodWIuY29tL3FpYW9cbiAqIEBhdXRob3IgbXJkb29iIC8gaHR0cDovL21yZG9vYi5jb21cbiAqIEBhdXRob3IgYWx0ZXJlZHEgLyBodHRwOi8vYWx0ZXJlZHF1YWxpYS5jb20vXG4gKiBAYXV0aG9yIFdlc3RMYW5nbGV5IC8gaHR0cDovL2dpdGh1Yi5jb20vV2VzdExhbmdsZXlcbiAqIEBhdXRob3IgZXJpY2g2NjYgLyBodHRwOi8vZXJpY2hhaW5lcy5jb21cbiAqL1xuLypnbG9iYWwgVEhSRUUsIGNvbnNvbGUgKi9cblxuLy8gVGhpcyBzZXQgb2YgY29udHJvbHMgcGVyZm9ybXMgb3JiaXRpbmcsIGRvbGx5aW5nICh6b29taW5nKSwgYW5kIHBhbm5pbmcuIEl0IG1haW50YWluc1xuLy8gdGhlIFwidXBcIiBkaXJlY3Rpb24gYXMgK1ksIHVubGlrZSB0aGUgVHJhY2tiYWxsQ29udHJvbHMuIFRvdWNoIG9uIHRhYmxldCBhbmQgcGhvbmVzIGlzXG4vLyBzdXBwb3J0ZWQuXG4vL1xuLy8gICAgT3JiaXQgLSBsZWZ0IG1vdXNlIC8gdG91Y2g6IG9uZSBmaW5nZXIgbW92ZVxuLy8gICAgWm9vbSAtIG1pZGRsZSBtb3VzZSwgb3IgbW91c2V3aGVlbCAvIHRvdWNoOiB0d28gZmluZ2VyIHNwcmVhZCBvciBzcXVpc2hcbi8vICAgIFBhbiAtIHJpZ2h0IG1vdXNlLCBvciBhcnJvdyBrZXlzIC8gdG91Y2g6IHRocmVlIGZpbnRlciBzd2lwZVxuLy9cbi8vIFRoaXMgaXMgYSBkcm9wLWluIHJlcGxhY2VtZW50IGZvciAobW9zdCkgVHJhY2tiYWxsQ29udHJvbHMgdXNlZCBpbiBleGFtcGxlcy5cbi8vIFRoYXQgaXMsIGluY2x1ZGUgdGhpcyBqcyBmaWxlIGFuZCB3aGVyZXZlciB5b3Ugc2VlOlxuLy8gICAgICBjb250cm9scyA9IG5ldyBUSFJFRS5UcmFja2JhbGxDb250cm9scyggY2FtZXJhICk7XG4vLyAgICAgIGNvbnRyb2xzLnRhcmdldC56ID0gMTUwO1xuLy8gU2ltcGxlIHN1YnN0aXR1dGUgXCJQYW5Db250cm9sc1wiIGFuZCB0aGUgY29udHJvbCBzaG91bGQgd29yayBhcy1pcy5cblxuVEhSRUUuUGFuQ29udHJvbHMgPSBmdW5jdGlvbiAoIG9iamVjdCwgZG9tRWxlbWVudCApIHtcblxuXHR0aGlzLm9iamVjdCA9IG9iamVjdDtcblx0dGhpcy5kb21FbGVtZW50ID0gKCBkb21FbGVtZW50ICE9PSB1bmRlZmluZWQgKSA/IGRvbUVsZW1lbnQgOiBkb2N1bWVudDtcblxuXHQvLyBBUElcblxuXHQvLyBTZXQgdG8gZmFsc2UgdG8gZGlzYWJsZSB0aGlzIGNvbnRyb2xcblx0dGhpcy5lbmFibGVkID0gdHJ1ZTtcblxuXHQvLyBcInRhcmdldFwiIHNldHMgdGhlIGxvY2F0aW9uIG9mIGZvY3VzLCB3aGVyZSB0aGUgY29udHJvbCBvcmJpdHMgYXJvdW5kXG5cdC8vIGFuZCB3aGVyZSBpdCBwYW5zIHdpdGggcmVzcGVjdCB0by5cblx0dGhpcy50YXJnZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdC8vIGNlbnRlciBpcyBvbGQsIGRlcHJlY2F0ZWQ7IHVzZSBcInRhcmdldFwiIGluc3RlYWRcblx0dGhpcy5jZW50ZXIgPSB0aGlzLnRhcmdldDtcblxuXHQvLyBUaGlzIG9wdGlvbiBhY3R1YWxseSBlbmFibGVzIGRvbGx5aW5nIGluIGFuZCBvdXQ7IGxlZnQgYXMgXCJ6b29tXCIgZm9yXG5cdC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG5cdHRoaXMubm9ab29tID0gZmFsc2U7XG5cdHRoaXMuem9vbVNwZWVkID0gMS4wO1xuXG5cdC8vIExpbWl0cyB0byBob3cgZmFyIHlvdSBjYW4gZG9sbHkgaW4gYW5kIG91dFxuXHR0aGlzLm1pbkRpc3RhbmNlID0gMDtcblx0dGhpcy5tYXhEaXN0YW5jZSA9IEluZmluaXR5O1xuXG5cdC8vIFNldCB0byB0cnVlIHRvIGRpc2FibGUgdGhpcyBjb250cm9sXG5cdHRoaXMubm9Sb3RhdGUgPSBmYWxzZTtcblx0dGhpcy5yb3RhdGVTcGVlZCA9IDEuMDtcblxuXHQvLyBTZXQgdG8gdHJ1ZSB0byBkaXNhYmxlIHRoaXMgY29udHJvbFxuXHR0aGlzLm5vUGFuID0gZmFsc2U7XG5cdHRoaXMua2V5UGFuU3BlZWQgPSA3LjA7XHQvLyBwaXhlbHMgbW92ZWQgcGVyIGFycm93IGtleSBwdXNoXG5cblx0Ly8gU2V0IHRvIHRydWUgdG8gYXV0b21hdGljYWxseSByb3RhdGUgYXJvdW5kIHRoZSB0YXJnZXRcblx0dGhpcy5hdXRvUm90YXRlID0gZmFsc2U7XG5cdHRoaXMuYXV0b1JvdGF0ZVNwZWVkID0gMi4wOyAvLyAzMCBzZWNvbmRzIHBlciByb3VuZCB3aGVuIGZwcyBpcyA2MFxuXG5cdC8vIEhvdyBmYXIgeW91IGNhbiBvcmJpdCB2ZXJ0aWNhbGx5LCB1cHBlciBhbmQgbG93ZXIgbGltaXRzLlxuXHQvLyBSYW5nZSBpcyAwIHRvIE1hdGguUEkgcmFkaWFucy5cblx0dGhpcy5taW5Qb2xhckFuZ2xlID0gMDsgLy8gcmFkaWFuc1xuXHR0aGlzLm1heFBvbGFyQW5nbGUgPSBNYXRoLlBJOyAvLyByYWRpYW5zXG5cblx0Ly8gU2V0IHRvIHRydWUgdG8gZGlzYWJsZSB1c2Ugb2YgdGhlIGtleXNcblx0dGhpcy5ub0tleXMgPSBmYWxzZTtcblxuXHQvLyBUaGUgZm91ciBhcnJvdyBrZXlzXG5cdHRoaXMua2V5cyA9IHsgTEVGVDogMzcsIFVQOiAzOCwgUklHSFQ6IDM5LCBCT1RUT006IDQwIH07XG5cblx0Ly8vLy8vLy8vLy8vXG5cdC8vIGludGVybmFsc1xuXG5cdHZhciBzY29wZSA9IHRoaXM7XG5cblx0dmFyIEVQUyA9IDAuMDAwMDAxO1xuXG5cdHZhciByb3RhdGVTdGFydCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciByb3RhdGVFbmQgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXHR2YXIgcm90YXRlRGVsdGEgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXG5cdHZhciBwYW5TdGFydCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciBwYW5FbmQgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXHR2YXIgcGFuRGVsdGEgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXHR2YXIgcGFuT2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuXHR2YXIgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuXHR2YXIgZG9sbHlTdGFydCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciBkb2xseUVuZCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cdHZhciBkb2xseURlbHRhID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblxuXHR2YXIgcGhpRGVsdGEgPSAwO1xuXHR2YXIgdGhldGFEZWx0YSA9IDA7XG5cdHZhciBzY2FsZSA9IDE7XG5cdHZhciBwYW4gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdHZhciBsYXN0UG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXHR2YXIgbGFzdFF1YXRlcm5pb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG5cdHZhciBTVEFURSA9IHsgTk9ORSA6IC0xLCBST1RBVEUgOiAwLCBET0xMWSA6IDEsIFBBTiA6IDIsIFRPVUNIX1JPVEFURSA6IDMsIFRPVUNIX0RPTExZIDogNCwgVE9VQ0hfUEFOIDogNSB9O1xuXG5cdHZhciBzdGF0ZSA9IFNUQVRFLk5PTkU7XG5cblx0Ly8gZm9yIHJlc2V0XG5cblx0dGhpcy50YXJnZXQwID0gdGhpcy50YXJnZXQuY2xvbmUoKTtcblx0dGhpcy5wb3NpdGlvbjAgPSB0aGlzLm9iamVjdC5wb3NpdGlvbi5jbG9uZSgpO1xuXG5cdC8vIHNvIGNhbWVyYS51cCBpcyB0aGUgb3JiaXQgYXhpc1xuXG5cdHZhciBxdWF0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tVW5pdFZlY3RvcnMoIG9iamVjdC51cCwgbmV3IFRIUkVFLlZlY3RvcjMoIDAsIDEsIDAgKSApO1xuXHR2YXIgcXVhdEludmVyc2UgPSBxdWF0LmNsb25lKCkuaW52ZXJzZSgpO1xuXG5cdC8vIGV2ZW50c1xuXG5cdHZhciBjaGFuZ2VFdmVudCA9IHsgdHlwZTogJ2NoYW5nZScgfTtcblx0dmFyIHN0YXJ0RXZlbnQgPSB7IHR5cGU6ICdzdGFydCd9O1xuXHR2YXIgZW5kRXZlbnQgPSB7IHR5cGU6ICdlbmQnfTtcblxuXHR0aGlzLnJvdGF0ZUxlZnQgPSBmdW5jdGlvbiAoIGFuZ2xlICkge1xuXG5cdFx0aWYgKCBhbmdsZSA9PT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHRhbmdsZSA9IGdldEF1dG9Sb3RhdGlvbkFuZ2xlKCk7XG5cblx0XHR9XG5cblx0XHR0aGV0YURlbHRhIC09IGFuZ2xlO1xuXG5cdH07XG5cblx0dGhpcy5yb3RhdGVVcCA9IGZ1bmN0aW9uICggYW5nbGUgKSB7XG5cblx0XHRpZiAoIGFuZ2xlID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdGFuZ2xlID0gZ2V0QXV0b1JvdGF0aW9uQW5nbGUoKTtcblxuXHRcdH1cblxuXHRcdHBoaURlbHRhIC09IGFuZ2xlO1xuXG5cdH07XG5cblx0Ly8gcGFzcyBpbiBkaXN0YW5jZSBpbiB3b3JsZCBzcGFjZSB0byBtb3ZlIGxlZnRcblx0dGhpcy5wYW5MZWZ0ID0gZnVuY3Rpb24gKCBkaXN0YW5jZSApIHtcblxuXHRcdHZhciB0ZSA9IHRoaXMub2JqZWN0Lm1hdHJpeC5lbGVtZW50cztcblxuXHRcdC8vIGdldCBYIGNvbHVtbiBvZiBtYXRyaXhcblx0XHRwYW5PZmZzZXQuc2V0KCB0ZVsgMCBdLCB0ZVsgMSBdLCB0ZVsgMiBdICk7XG5cdFx0cGFuT2Zmc2V0Lm11bHRpcGx5U2NhbGFyKCAtIGRpc3RhbmNlICk7XG5cblx0XHRwYW4uYWRkKCBwYW5PZmZzZXQgKTtcblxuXHR9O1xuXG5cdC8vIHBhc3MgaW4gZGlzdGFuY2UgaW4gd29ybGQgc3BhY2UgdG8gbW92ZSB1cFxuXHR0aGlzLnBhblVwID0gZnVuY3Rpb24gKCBkaXN0YW5jZSApIHtcblxuXHRcdHZhciB0ZSA9IHRoaXMub2JqZWN0Lm1hdHJpeC5lbGVtZW50cztcblxuXHRcdC8vIGdldCBZIGNvbHVtbiBvZiBtYXRyaXhcblx0XHRwYW5PZmZzZXQuc2V0KCB0ZVsgNCBdLCB0ZVsgNSBdLCB0ZVsgNiBdICk7XG5cdFx0cGFuT2Zmc2V0Lm11bHRpcGx5U2NhbGFyKCBkaXN0YW5jZSApO1xuXG5cdFx0cGFuLmFkZCggcGFuT2Zmc2V0ICk7XG5cblx0fTtcblxuXHQvLyBwYXNzIGluIHgseSBvZiBjaGFuZ2UgZGVzaXJlZCBpbiBwaXhlbCBzcGFjZSxcblx0Ly8gcmlnaHQgYW5kIGRvd24gYXJlIHBvc2l0aXZlXG5cdHRoaXMucGFuID0gZnVuY3Rpb24gKCBkZWx0YVgsIGRlbHRhWSApIHtcblxuXHRcdHZhciBlbGVtZW50ID0gc2NvcGUuZG9tRWxlbWVudCA9PT0gZG9jdW1lbnQgPyBzY29wZS5kb21FbGVtZW50LmJvZHkgOiBzY29wZS5kb21FbGVtZW50O1xuXG5cdFx0aWYgKCBzY29wZS5vYmplY3QuZm92ICE9PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdC8vIHBlcnNwZWN0aXZlXG5cdFx0XHR2YXIgcG9zaXRpb24gPSBzY29wZS5vYmplY3QucG9zaXRpb247XG5cdFx0XHR2YXIgb2Zmc2V0ID0gcG9zaXRpb24uY2xvbmUoKS5zdWIoIHNjb3BlLnRhcmdldCApO1xuXHRcdFx0dmFyIHRhcmdldERpc3RhbmNlID0gb2Zmc2V0Lmxlbmd0aCgpO1xuXG5cdFx0XHQvLyBoYWxmIG9mIHRoZSBmb3YgaXMgY2VudGVyIHRvIHRvcCBvZiBzY3JlZW5cblx0XHRcdHRhcmdldERpc3RhbmNlICo9IE1hdGgudGFuKCAoIHNjb3BlLm9iamVjdC5mb3YgLyAyICkgKiBNYXRoLlBJIC8gMTgwLjAgKTtcblxuXHRcdFx0Ly8gd2UgYWN0dWFsbHkgZG9uJ3QgdXNlIHNjcmVlbldpZHRoLCBzaW5jZSBwZXJzcGVjdGl2ZSBjYW1lcmEgaXMgZml4ZWQgdG8gc2NyZWVuIGhlaWdodFxuXHRcdFx0c2NvcGUucGFuTGVmdCggMiAqIGRlbHRhWCAqIHRhcmdldERpc3RhbmNlIC8gZWxlbWVudC5jbGllbnRIZWlnaHQgKTtcblx0XHRcdHNjb3BlLnBhblVwKCAyICogZGVsdGFZICogdGFyZ2V0RGlzdGFuY2UgLyBlbGVtZW50LmNsaWVudEhlaWdodCApO1xuXG5cdFx0fSBlbHNlIGlmICggc2NvcGUub2JqZWN0LnRvcCAhPT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHQvLyBvcnRob2dyYXBoaWNcblx0XHRcdHNjb3BlLnBhbkxlZnQoIGRlbHRhWCAqIChzY29wZS5vYmplY3QucmlnaHQgLSBzY29wZS5vYmplY3QubGVmdCkgLyBlbGVtZW50LmNsaWVudFdpZHRoICk7XG5cdFx0XHRzY29wZS5wYW5VcCggZGVsdGFZICogKHNjb3BlLm9iamVjdC50b3AgLSBzY29wZS5vYmplY3QuYm90dG9tKSAvIGVsZW1lbnQuY2xpZW50SGVpZ2h0ICk7XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHQvLyBjYW1lcmEgbmVpdGhlciBvcnRob2dyYXBoaWMgb3IgcGVyc3BlY3RpdmVcblx0XHRcdGNvbnNvbGUud2FybiggJ1dBUk5JTkc6IFBhbkNvbnRyb2xzLmpzIGVuY291bnRlcmVkIGFuIHVua25vd24gY2FtZXJhIHR5cGUgLSBwYW4gZGlzYWJsZWQuJyApO1xuXG5cdFx0fVxuXG5cdH07XG5cblx0dGhpcy5kb2xseUluID0gZnVuY3Rpb24gKCBkb2xseVNjYWxlICkge1xuXG5cdFx0aWYgKCBkb2xseVNjYWxlID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdGRvbGx5U2NhbGUgPSBnZXRab29tU2NhbGUoKTtcblxuXHRcdH1cblxuXHRcdHNjYWxlIC89IGRvbGx5U2NhbGU7XG5cblx0fTtcblxuXHR0aGlzLmRvbGx5T3V0ID0gZnVuY3Rpb24gKCBkb2xseVNjYWxlICkge1xuXG5cdFx0aWYgKCBkb2xseVNjYWxlID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdGRvbGx5U2NhbGUgPSBnZXRab29tU2NhbGUoKTtcblxuXHRcdH1cblxuXHRcdHNjYWxlICo9IGRvbGx5U2NhbGU7XG5cblx0fTtcblxuXHR0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBwb3NpdGlvbiA9IHRoaXMub2JqZWN0LnBvc2l0aW9uO1xuXG5cdFx0b2Zmc2V0LmNvcHkoIHBvc2l0aW9uICkuc3ViKCB0aGlzLnRhcmdldCApO1xuXG5cdFx0Ly8gcm90YXRlIG9mZnNldCB0byBcInktYXhpcy1pcy11cFwiIHNwYWNlXG5cdFx0b2Zmc2V0LmFwcGx5UXVhdGVybmlvbiggcXVhdCApO1xuXG5cdFx0Ly8gYW5nbGUgZnJvbSB6LWF4aXMgYXJvdW5kIHktYXhpc1xuXG5cdFx0dmFyIHRoZXRhID0gTWF0aC5hdGFuMiggb2Zmc2V0LngsIG9mZnNldC56ICk7XG5cblx0XHQvLyBhbmdsZSBmcm9tIHktYXhpc1xuXG5cdFx0dmFyIHBoaSA9IE1hdGguYXRhbjIoIE1hdGguc3FydCggb2Zmc2V0LnggKiBvZmZzZXQueCArIG9mZnNldC56ICogb2Zmc2V0LnogKSwgb2Zmc2V0LnkgKTtcblxuXHRcdGlmICggdGhpcy5hdXRvUm90YXRlICkge1xuXG5cdFx0XHR0aGlzLnJvdGF0ZUxlZnQoIGdldEF1dG9Sb3RhdGlvbkFuZ2xlKCkgKTtcblxuXHRcdH1cblxuXHRcdHRoZXRhICs9IHRoZXRhRGVsdGE7XG5cdFx0cGhpICs9IHBoaURlbHRhO1xuXG5cdFx0Ly8gcmVzdHJpY3QgcGhpIHRvIGJlIGJldHdlZW4gZGVzaXJlZCBsaW1pdHNcblx0XHRwaGkgPSBNYXRoLm1heCggdGhpcy5taW5Qb2xhckFuZ2xlLCBNYXRoLm1pbiggdGhpcy5tYXhQb2xhckFuZ2xlLCBwaGkgKSApO1xuXG5cdFx0Ly8gcmVzdHJpY3QgcGhpIHRvIGJlIGJldHdlZSBFUFMgYW5kIFBJLUVQU1xuXHRcdHBoaSA9IE1hdGgubWF4KCBFUFMsIE1hdGgubWluKCBNYXRoLlBJIC0gRVBTLCBwaGkgKSApO1xuXG5cdFx0dmFyIHJhZGl1cyA9IG9mZnNldC5sZW5ndGgoKSAqIHNjYWxlO1xuXG5cdFx0Ly8gcmVzdHJpY3QgcmFkaXVzIHRvIGJlIGJldHdlZW4gZGVzaXJlZCBsaW1pdHNcblx0XHRyYWRpdXMgPSBNYXRoLm1heCggdGhpcy5taW5EaXN0YW5jZSwgTWF0aC5taW4oIHRoaXMubWF4RGlzdGFuY2UsIHJhZGl1cyApICk7XG5cblx0XHQvLyBtb3ZlIHRhcmdldCB0byBwYW5uZWQgbG9jYXRpb25cblx0XHR0aGlzLnRhcmdldC5hZGQoIHBhbiApO1xuXG5cdFx0b2Zmc2V0LnggPSByYWRpdXMgKiBNYXRoLnNpbiggcGhpICkgKiBNYXRoLnNpbiggdGhldGEgKTtcblx0XHRvZmZzZXQueSA9IHJhZGl1cyAqIE1hdGguY29zKCBwaGkgKTtcblx0XHRvZmZzZXQueiA9IHJhZGl1cyAqIE1hdGguc2luKCBwaGkgKSAqIE1hdGguY29zKCB0aGV0YSApO1xuXG5cdFx0Ly8gcm90YXRlIG9mZnNldCBiYWNrIHRvIFwiY2FtZXJhLXVwLXZlY3Rvci1pcy11cFwiIHNwYWNlXG5cdFx0b2Zmc2V0LmFwcGx5UXVhdGVybmlvbiggcXVhdEludmVyc2UgKTtcblxuXHRcdHBvc2l0aW9uLmNvcHkoIHRoaXMudGFyZ2V0ICkuYWRkKCBvZmZzZXQgKTtcblxuXHRcdHRoaXMub2JqZWN0Lmxvb2tBdCggdGhpcy50YXJnZXQgKTtcblxuXHRcdHRoZXRhRGVsdGEgPSAwO1xuXHRcdHBoaURlbHRhID0gMDtcblx0XHRzY2FsZSA9IDE7XG5cdFx0cGFuLnNldCggMCwgMCwgMCApO1xuXG5cdFx0Ly8gdXBkYXRlIGNvbmRpdGlvbiBpczpcblx0XHQvLyBtaW4oY2FtZXJhIGRpc3BsYWNlbWVudCwgY2FtZXJhIHJvdGF0aW9uIGluIHJhZGlhbnMpXjIgPiBFUFNcblx0XHQvLyB1c2luZyBzbWFsbC1hbmdsZSBhcHByb3hpbWF0aW9uIGNvcyh4LzIpID0gMSAtIHheMiAvIDhcblxuXHRcdGlmICggbGFzdFBvc2l0aW9uLmRpc3RhbmNlVG9TcXVhcmVkKCB0aGlzLm9iamVjdC5wb3NpdGlvbiApID4gRVBTXG5cdFx0ICAgIHx8IDggKiAoMSAtIGxhc3RRdWF0ZXJuaW9uLmRvdCh0aGlzLm9iamVjdC5xdWF0ZXJuaW9uKSkgPiBFUFMgKSB7XG5cblx0XHRcdHRoaXMuZGlzcGF0Y2hFdmVudCggY2hhbmdlRXZlbnQgKTtcblxuXHRcdFx0bGFzdFBvc2l0aW9uLmNvcHkoIHRoaXMub2JqZWN0LnBvc2l0aW9uICk7XG5cdFx0XHRsYXN0UXVhdGVybmlvbi5jb3B5ICh0aGlzLm9iamVjdC5xdWF0ZXJuaW9uICk7XG5cblx0XHR9XG5cblx0fTtcblxuXG5cdHRoaXMucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG5cblx0XHRzdGF0ZSA9IFNUQVRFLk5PTkU7XG5cblx0XHR0aGlzLnRhcmdldC5jb3B5KCB0aGlzLnRhcmdldDAgKTtcblx0XHR0aGlzLm9iamVjdC5wb3NpdGlvbi5jb3B5KCB0aGlzLnBvc2l0aW9uMCApO1xuXG5cdFx0dGhpcy51cGRhdGUoKTtcblxuXHR9O1xuXG5cdGZ1bmN0aW9uIGdldEF1dG9Sb3RhdGlvbkFuZ2xlKCkge1xuXG5cdFx0cmV0dXJuIDIgKiBNYXRoLlBJIC8gNjAgLyA2MCAqIHNjb3BlLmF1dG9Sb3RhdGVTcGVlZDtcblxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Wm9vbVNjYWxlKCkge1xuXG5cdFx0cmV0dXJuIE1hdGgucG93KCAwLjk1LCBzY29wZS56b29tU3BlZWQgKTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gb25Nb3VzZURvd24oIGV2ZW50ICkge1xuXG5cdFx0aWYgKCBzY29wZS5lbmFibGVkID09PSBmYWxzZSApIHJldHVybjtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0aWYgKCBldmVudC5idXR0b24gPT09IDIgKSB7XG5cdFx0XHRpZiAoIHNjb3BlLm5vUm90YXRlID09PSB0cnVlICkgcmV0dXJuO1xuXG5cdFx0XHRzdGF0ZSA9IFNUQVRFLlJPVEFURTtcblxuXHRcdFx0cm90YXRlU3RhcnQuc2V0KCBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZICk7XG5cblx0XHR9IGVsc2UgaWYgKCBldmVudC5idXR0b24gPT09IDEgKSB7XG5cdFx0XHRpZiAoIHNjb3BlLm5vWm9vbSA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdFx0c3RhdGUgPSBTVEFURS5ET0xMWTtcblxuXHRcdFx0ZG9sbHlTdGFydC5zZXQoIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgKTtcblxuXHRcdH0gZWxzZSBpZiAoIGV2ZW50LmJ1dHRvbiA9PT0gMCApIHtcblx0XHRcdGlmICggc2NvcGUubm9QYW4gPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRcdHN0YXRlID0gU1RBVEUuUEFOO1xuXG5cdFx0XHRwYW5TdGFydC5zZXQoIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgKTtcblxuXHRcdH1cblxuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSwgZmFsc2UgKTtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCAnbW91c2V1cCcsIG9uTW91c2VVcCwgZmFsc2UgKTtcblx0XHRzY29wZS5kaXNwYXRjaEV2ZW50KCBzdGFydEV2ZW50ICk7XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG9uTW91c2VNb3ZlKCBldmVudCApIHtcblxuXHRcdGlmICggc2NvcGUuZW5hYmxlZCA9PT0gZmFsc2UgKSByZXR1cm47XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dmFyIGVsZW1lbnQgPSBzY29wZS5kb21FbGVtZW50ID09PSBkb2N1bWVudCA/IHNjb3BlLmRvbUVsZW1lbnQuYm9keSA6IHNjb3BlLmRvbUVsZW1lbnQ7XG5cblx0XHRpZiAoIHN0YXRlID09PSBTVEFURS5ST1RBVEUgKSB7XG5cblx0XHRcdGlmICggc2NvcGUubm9Sb3RhdGUgPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRcdHJvdGF0ZUVuZC5zZXQoIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgKTtcblx0XHRcdHJvdGF0ZURlbHRhLnN1YlZlY3RvcnMoIHJvdGF0ZUVuZCwgcm90YXRlU3RhcnQgKTtcblxuXHRcdFx0Ly8gcm90YXRpbmcgYWNyb3NzIHdob2xlIHNjcmVlbiBnb2VzIDM2MCBkZWdyZWVzIGFyb3VuZFxuXHRcdFx0c2NvcGUucm90YXRlTGVmdCggMiAqIE1hdGguUEkgKiByb3RhdGVEZWx0YS54IC8gZWxlbWVudC5jbGllbnRXaWR0aCAqIHNjb3BlLnJvdGF0ZVNwZWVkICk7XG5cblx0XHRcdC8vIHJvdGF0aW5nIHVwIGFuZCBkb3duIGFsb25nIHdob2xlIHNjcmVlbiBhdHRlbXB0cyB0byBnbyAzNjAsIGJ1dCBsaW1pdGVkIHRvIDE4MFxuXHRcdFx0c2NvcGUucm90YXRlVXAoIDIgKiBNYXRoLlBJICogcm90YXRlRGVsdGEueSAvIGVsZW1lbnQuY2xpZW50SGVpZ2h0ICogc2NvcGUucm90YXRlU3BlZWQgKTtcblxuXHRcdFx0cm90YXRlU3RhcnQuY29weSggcm90YXRlRW5kICk7XG5cblx0XHR9IGVsc2UgaWYgKCBzdGF0ZSA9PT0gU1RBVEUuRE9MTFkgKSB7XG5cblx0XHRcdGlmICggc2NvcGUubm9ab29tID09PSB0cnVlICkgcmV0dXJuO1xuXG5cdFx0XHRkb2xseUVuZC5zZXQoIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgKTtcblx0XHRcdGRvbGx5RGVsdGEuc3ViVmVjdG9ycyggZG9sbHlFbmQsIGRvbGx5U3RhcnQgKTtcblxuXHRcdFx0aWYgKCBkb2xseURlbHRhLnkgPiAwICkge1xuXG5cdFx0XHRcdHNjb3BlLmRvbGx5SW4oKTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRzY29wZS5kb2xseU91dCgpO1xuXG5cdFx0XHR9XG5cblx0XHRcdGRvbGx5U3RhcnQuY29weSggZG9sbHlFbmQgKTtcblxuXHRcdH0gZWxzZSBpZiAoIHN0YXRlID09PSBTVEFURS5QQU4gKSB7XG5cblx0XHRcdGlmICggc2NvcGUubm9QYW4gPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRcdHBhbkVuZC5zZXQoIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkgKTtcblx0XHRcdHBhbkRlbHRhLnN1YlZlY3RvcnMoIHBhbkVuZCwgcGFuU3RhcnQgKTtcblxuXHRcdFx0c2NvcGUucGFuKCBwYW5EZWx0YS54LCBwYW5EZWx0YS55ICk7XG5cblx0XHRcdHBhblN0YXJ0LmNvcHkoIHBhbkVuZCApO1xuXG5cdFx0fVxuXG5cdFx0c2NvcGUudXBkYXRlKCk7XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG9uTW91c2VVcCggLyogZXZlbnQgKi8gKSB7XG5cblx0XHRpZiAoIHNjb3BlLmVuYWJsZWQgPT09IGZhbHNlICkgcmV0dXJuO1xuXG5cdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlLCBmYWxzZSApO1xuXHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdtb3VzZXVwJywgb25Nb3VzZVVwLCBmYWxzZSApO1xuXHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIGVuZEV2ZW50ICk7XG5cdFx0c3RhdGUgPSBTVEFURS5OT05FO1xuXG5cdH1cblxuXHRmdW5jdGlvbiBvbk1vdXNlV2hlZWwoIGV2ZW50ICkge1xuXG5cdFx0aWYgKCBzY29wZS5lbmFibGVkID09PSBmYWxzZSB8fCBzY29wZS5ub1pvb20gPT09IHRydWUgKSByZXR1cm47XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0dmFyIGRlbHRhID0gMDtcblxuXHRcdGlmICggZXZlbnQud2hlZWxEZWx0YSAhPT0gdW5kZWZpbmVkICkgeyAvLyBXZWJLaXQgLyBPcGVyYSAvIEV4cGxvcmVyIDlcblxuXHRcdFx0ZGVsdGEgPSBldmVudC53aGVlbERlbHRhO1xuXG5cdFx0fSBlbHNlIGlmICggZXZlbnQuZGV0YWlsICE9PSB1bmRlZmluZWQgKSB7IC8vIEZpcmVmb3hcblxuXHRcdFx0ZGVsdGEgPSAtIGV2ZW50LmRldGFpbDtcblxuXHRcdH1cblxuXHRcdGlmICggZGVsdGEgPiAwICkge1xuXG5cdFx0XHRzY29wZS5kb2xseU91dCgpO1xuXG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0c2NvcGUuZG9sbHlJbigpO1xuXG5cdFx0fVxuXG5cdFx0c2NvcGUudXBkYXRlKCk7XG5cdFx0c2NvcGUuZGlzcGF0Y2hFdmVudCggc3RhcnRFdmVudCApO1xuXHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIGVuZEV2ZW50ICk7XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG9uS2V5RG93biggZXZlbnQgKSB7XG5cblx0XHRpZiAoIHNjb3BlLmVuYWJsZWQgPT09IGZhbHNlIHx8IHNjb3BlLm5vS2V5cyA9PT0gdHJ1ZSB8fCBzY29wZS5ub1BhbiA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdHN3aXRjaCAoIGV2ZW50LmtleUNvZGUgKSB7XG5cblx0XHRcdGNhc2Ugc2NvcGUua2V5cy5VUDpcblx0XHRcdFx0c2NvcGUucGFuKCAwLCBzY29wZS5rZXlQYW5TcGVlZCApO1xuXHRcdFx0XHRzY29wZS51cGRhdGUoKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2Ugc2NvcGUua2V5cy5CT1RUT006XG5cdFx0XHRcdHNjb3BlLnBhbiggMCwgLSBzY29wZS5rZXlQYW5TcGVlZCApO1xuXHRcdFx0XHRzY29wZS51cGRhdGUoKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2Ugc2NvcGUua2V5cy5MRUZUOlxuXHRcdFx0XHRzY29wZS5wYW4oIHNjb3BlLmtleVBhblNwZWVkLCAwICk7XG5cdFx0XHRcdHNjb3BlLnVwZGF0ZSgpO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBzY29wZS5rZXlzLlJJR0hUOlxuXHRcdFx0XHRzY29wZS5wYW4oIC0gc2NvcGUua2V5UGFuU3BlZWQsIDAgKTtcblx0XHRcdFx0c2NvcGUudXBkYXRlKCk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiB0b3VjaHN0YXJ0KCBldmVudCApIHtcblxuXHRcdGlmICggc2NvcGUuZW5hYmxlZCA9PT0gZmFsc2UgKSByZXR1cm47XG5cblx0XHRzd2l0Y2ggKCBldmVudC50b3VjaGVzLmxlbmd0aCApIHtcblxuXHRcdFx0Y2FzZSAxOlx0Ly8gb25lLWZpbmdlcmVkIHRvdWNoOiByb3RhdGVcblxuXHRcdFx0XHRpZiAoIHNjb3BlLm5vUm90YXRlID09PSB0cnVlICkgcmV0dXJuO1xuXG5cdFx0XHRcdHN0YXRlID0gU1RBVEUuVE9VQ0hfUk9UQVRFO1xuXG5cdFx0XHRcdHJvdGF0ZVN0YXJ0LnNldCggZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VYLCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVkgKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgMjpcdC8vIHR3by1maW5nZXJlZCB0b3VjaDogZG9sbHlcblxuXHRcdFx0XHRpZiAoIHNjb3BlLm5vWm9vbSA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdFx0XHRzdGF0ZSA9IFNUQVRFLlRPVUNIX0RPTExZO1xuXG5cdFx0XHRcdHZhciBkeCA9IGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWCAtIGV2ZW50LnRvdWNoZXNbIDEgXS5wYWdlWDtcblx0XHRcdFx0dmFyIGR5ID0gZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VZIC0gZXZlbnQudG91Y2hlc1sgMSBdLnBhZ2VZO1xuXHRcdFx0XHR2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoIGR4ICogZHggKyBkeSAqIGR5ICk7XG5cdFx0XHRcdGRvbGx5U3RhcnQuc2V0KCAwLCBkaXN0YW5jZSApO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAzOiAvLyB0aHJlZS1maW5nZXJlZCB0b3VjaDogcGFuXG5cblx0XHRcdFx0aWYgKCBzY29wZS5ub1BhbiA9PT0gdHJ1ZSApIHJldHVybjtcblxuXHRcdFx0XHRzdGF0ZSA9IFNUQVRFLlRPVUNIX1BBTjtcblxuXHRcdFx0XHRwYW5TdGFydC5zZXQoIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWCwgZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VZICk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRkZWZhdWx0OlxuXG5cdFx0XHRcdHN0YXRlID0gU1RBVEUuTk9ORTtcblxuXHRcdH1cblxuXHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIHN0YXJ0RXZlbnQgKTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gdG91Y2htb3ZlKCBldmVudCApIHtcblxuXHRcdGlmICggc2NvcGUuZW5hYmxlZCA9PT0gZmFsc2UgKSByZXR1cm47XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0dmFyIGVsZW1lbnQgPSBzY29wZS5kb21FbGVtZW50ID09PSBkb2N1bWVudCA/IHNjb3BlLmRvbUVsZW1lbnQuYm9keSA6IHNjb3BlLmRvbUVsZW1lbnQ7XG5cblx0XHRzd2l0Y2ggKCBldmVudC50b3VjaGVzLmxlbmd0aCApIHtcblxuXHRcdFx0Y2FzZSAxOiAvLyBvbmUtZmluZ2VyZWQgdG91Y2g6IHJvdGF0ZVxuXG5cdFx0XHRcdGlmICggc2NvcGUubm9Sb3RhdGUgPT09IHRydWUgKSByZXR1cm47XG5cdFx0XHRcdGlmICggc3RhdGUgIT09IFNUQVRFLlRPVUNIX1JPVEFURSApIHJldHVybjtcblxuXHRcdFx0XHRyb3RhdGVFbmQuc2V0KCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWSApO1xuXHRcdFx0XHRyb3RhdGVEZWx0YS5zdWJWZWN0b3JzKCByb3RhdGVFbmQsIHJvdGF0ZVN0YXJ0ICk7XG5cblx0XHRcdFx0Ly8gcm90YXRpbmcgYWNyb3NzIHdob2xlIHNjcmVlbiBnb2VzIDM2MCBkZWdyZWVzIGFyb3VuZFxuXHRcdFx0XHRzY29wZS5yb3RhdGVMZWZ0KCAyICogTWF0aC5QSSAqIHJvdGF0ZURlbHRhLnggLyBlbGVtZW50LmNsaWVudFdpZHRoICogc2NvcGUucm90YXRlU3BlZWQgKTtcblx0XHRcdFx0Ly8gcm90YXRpbmcgdXAgYW5kIGRvd24gYWxvbmcgd2hvbGUgc2NyZWVuIGF0dGVtcHRzIHRvIGdvIDM2MCwgYnV0IGxpbWl0ZWQgdG8gMTgwXG5cdFx0XHRcdHNjb3BlLnJvdGF0ZVVwKCAyICogTWF0aC5QSSAqIHJvdGF0ZURlbHRhLnkgLyBlbGVtZW50LmNsaWVudEhlaWdodCAqIHNjb3BlLnJvdGF0ZVNwZWVkICk7XG5cblx0XHRcdFx0cm90YXRlU3RhcnQuY29weSggcm90YXRlRW5kICk7XG5cblx0XHRcdFx0c2NvcGUudXBkYXRlKCk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIDI6IC8vIHR3by1maW5nZXJlZCB0b3VjaDogZG9sbHlcblxuXHRcdFx0XHRpZiAoIHNjb3BlLm5vWm9vbSA9PT0gdHJ1ZSApIHJldHVybjtcblx0XHRcdFx0aWYgKCBzdGF0ZSAhPT0gU1RBVEUuVE9VQ0hfRE9MTFkgKSByZXR1cm47XG5cblx0XHRcdFx0dmFyIGR4ID0gZXZlbnQudG91Y2hlc1sgMCBdLnBhZ2VYIC0gZXZlbnQudG91Y2hlc1sgMSBdLnBhZ2VYO1xuXHRcdFx0XHR2YXIgZHkgPSBldmVudC50b3VjaGVzWyAwIF0ucGFnZVkgLSBldmVudC50b3VjaGVzWyAxIF0ucGFnZVk7XG5cdFx0XHRcdHZhciBkaXN0YW5jZSA9IE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKTtcblxuXHRcdFx0XHRkb2xseUVuZC5zZXQoIDAsIGRpc3RhbmNlICk7XG5cdFx0XHRcdGRvbGx5RGVsdGEuc3ViVmVjdG9ycyggZG9sbHlFbmQsIGRvbGx5U3RhcnQgKTtcblxuXHRcdFx0XHRpZiAoIGRvbGx5RGVsdGEueSA+IDAgKSB7XG5cblx0XHRcdFx0XHRzY29wZS5kb2xseU91dCgpO1xuXG5cdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHRzY29wZS5kb2xseUluKCk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRvbGx5U3RhcnQuY29weSggZG9sbHlFbmQgKTtcblxuXHRcdFx0XHRzY29wZS51cGRhdGUoKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgMzogLy8gdGhyZWUtZmluZ2VyZWQgdG91Y2g6IHBhblxuXG5cdFx0XHRcdGlmICggc2NvcGUubm9QYW4gPT09IHRydWUgKSByZXR1cm47XG5cdFx0XHRcdGlmICggc3RhdGUgIT09IFNUQVRFLlRPVUNIX1BBTiApIHJldHVybjtcblxuXHRcdFx0XHRwYW5FbmQuc2V0KCBldmVudC50b3VjaGVzWyAwIF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbIDAgXS5wYWdlWSApO1xuXHRcdFx0XHRwYW5EZWx0YS5zdWJWZWN0b3JzKCBwYW5FbmQsIHBhblN0YXJ0ICk7XG5cblx0XHRcdFx0c2NvcGUucGFuKCBwYW5EZWx0YS54LCBwYW5EZWx0YS55ICk7XG5cblx0XHRcdFx0cGFuU3RhcnQuY29weSggcGFuRW5kICk7XG5cblx0XHRcdFx0c2NvcGUudXBkYXRlKCk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRkZWZhdWx0OlxuXG5cdFx0XHRcdHN0YXRlID0gU1RBVEUuTk9ORTtcblxuXHRcdH1cblxuXHR9XG5cblx0ZnVuY3Rpb24gdG91Y2hlbmQoIC8qIGV2ZW50ICovICkge1xuXG5cdFx0aWYgKCBzY29wZS5lbmFibGVkID09PSBmYWxzZSApIHJldHVybjtcblxuXHRcdHNjb3BlLmRpc3BhdGNoRXZlbnQoIGVuZEV2ZW50ICk7XG5cdFx0c3RhdGUgPSBTVEFURS5OT05FO1xuXG5cdH1cblxuXHR0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgfSwgZmFsc2UgKTtcblx0dGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZWRvd24nLCBvbk1vdXNlRG93biwgZmFsc2UgKTtcblx0dGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZXdoZWVsJywgb25Nb3VzZVdoZWVsLCBmYWxzZSApO1xuXHR0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ0RPTU1vdXNlU2Nyb2xsJywgb25Nb3VzZVdoZWVsLCBmYWxzZSApOyAvLyBmaXJlZm94XG5cblx0dGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaHN0YXJ0JywgdG91Y2hzdGFydCwgZmFsc2UgKTtcblx0dGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaGVuZCcsIHRvdWNoZW5kLCBmYWxzZSApO1xuXHR0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNobW92ZScsIHRvdWNobW92ZSwgZmFsc2UgKTtcblxuXHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCBvbktleURvd24sIGZhbHNlICk7XG5cblx0Ly8gZm9yY2UgYW4gdXBkYXRlIGF0IHN0YXJ0XG5cdHRoaXMudXBkYXRlKCk7XG5cbn07XG5cblRIUkVFLlBhbkNvbnRyb2xzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFRIUkVFLkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUgKTtcbiIsInJlcXVpcmUoJy4vUGFuQ29udHJvbHMnKTtcblxudmFyIHQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cudDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLnQzIDogbnVsbCksXG4gIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5USFJFRSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuVEhSRUUgOiBudWxsKSxcbiAgZWwsXG4gIGluc3RhbmNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY2xlYXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcm9vdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWwpO1xuICAgIHdoaWxlKHJvb3QuZmlyc3RDaGlsZCkge1xuICAgICAgcm9vdC5yZW1vdmVDaGlsZChyb290LmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgICBpZiAoaW5zdGFuY2UpIHtcbiAgICAgIGluc3RhbmNlLmxvb3BNYW5hZ2VyLnN0b3AoKTtcbiAgICB9XG4gIH0sXG4gIHNldENhbnZhc0VsOiBmdW5jdGlvbiAobmV3RWwpIHtcbiAgICBlbCA9IG5ld0VsO1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdmFyIHJvb3RFbDtcbiAgICB2YXIgbm9kZXMgPSBkYXRhLm5vZGVzLFxuICAgICAgZWRnZXMgPSBkYXRhLmVkZ2VzLFxuICAgICAgbm9kZU1hcCA9IHt9LFxuICAgICAgbWFyZ2luID0ge1xuICAgICAgICB0b3A6IDEwLFxuICAgICAgICBsZWZ0OiAxMFxuICAgICAgfSxcbiAgICAgIGZpbGxTdHlsZSA9IHtcbiAgICAgICAgbnVtYmVyOiAnIzY3M2FiNycsXG4gICAgICAgICdzdHJpbmcnOiAnI2ZmOTgwMCcsXG4gICAgICAgICdib29sZWFuJzogJyMyNTliMjQnLFxuICAgICAgICAndW5kZWZpbmVkJzogJyMwMDAwMDAnXG4gICAgICB9LFxuICAgICAgYm9yZGVyU3R5bGUgPSB7XG4gICAgICAgIG9iamVjdDogJyMwM2E5ZjQnLFxuICAgICAgICAnZnVuY3Rpb24nOiAnI2U1MWMyMydcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Q29sb3IgPSAnIzAwMDAwMCcsXG4gICAgICB0aXRsZUhlaWdodCA9IDQwLFxuICAgICAgcHJvamVjdG9yID0gbmV3IFRIUkVFLlByb2plY3RvcigpLFxuICAgICAgbm9kZU1lc2hlcyA9IFtdO1xuXG4gICAgLy8gdGhlIGFjdHVhbCByb290IGVsZW1lbnQgaXMgYSBkaXYgY3JlYXRlZCB1bmRlciB0aGUgcm9vdFxuICAgIHJvb3RFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHJvb3RFbC5pZCA9ICdyb290JztcbiAgICByb290RWwuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWwpLmFwcGVuZENoaWxkKHJvb3RFbCk7XG5cbiAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICBub2RlTWFwW25vZGUubGFiZWxdID0gbm9kZTtcbiAgICB9KTtcblxuICAgIHZhciB3cmFwcGVyRWwgPSByb290RWw7XG4gICAgdmFyIGJib3ggPSByb290RWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBmdW5jdGlvbiBnZXRZKG5vZGUsIGkpIHtcbiAgICAgIHJldHVybiBub2RlLnkgLSBub2RlLmhlaWdodCAqIDAuNSArXG4gICAgICAgIChub2RlLnByb3BlcnRpZXMubGVuZ3RoIC0gaSkgKiAxNTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRYKG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlLnggLSBub2RlLndpZHRoICogMC41ICsgbWFyZ2luLmxlZnQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ2FtZXJhQ29udHJvbHMoY2FtZXJhLCBkb21FbGVtZW50KSB7XG4gICAgICBjYW1lcmEuY2FtZXJhQ29udHJvbHMgPSBuZXcgVEhSRUUuUGFuQ29udHJvbHMoY2FtZXJhLCBkb21FbGVtZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVUZXh0U3ByaXRlcygpIHtcbiAgICAgIHZhciBzaGFwZXMgPSBUSFJFRS5Gb250VXRpbHMuZ2VuZXJhdGVTaGFwZXMoXCJIZWxsbyB3b3JsZFwiLCB7XG4gICAgICAgIGZvbnQ6IFwiaGVsdmV0aWtlclwiLFxuICAgICAgICB3ZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICBzaXplOiAxMFxuICAgICAgfSk7XG4gICAgICB2YXIgZ2VvbSA9IG5ldyBUSFJFRS5TaGFwZUdlb21ldHJ5KHNoYXBlcyk7XG4gICAgICB2YXIgbWF0ID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKCk7XG4gICAgICByZXR1cm4gbmV3IFRIUkVFLk1lc2goZ2VvbSwgbWF0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkcmF3UHJvcGVydGllcyhub2RlLCBncm91cCkge1xuICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgY2FudmFzLndpZHRoID0gbm9kZS53aWR0aDtcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBub2RlLmhlaWdodDtcbiAgICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICBjb250ZXh0LmZvbnQgPSBcIm5vcm1hbCAxMDAgMThweCBSb2JvdG9cIjtcbiAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gXCJyZ2JhKDAsIDAsIDAsIDEpXCI7XG4gICAgICBjb250ZXh0LmZpbGxUZXh0KFxuICAgICAgICBub2RlLmxhYmVsXG4gICAgICAgICAgLm1hdGNoKC9eXFxTKj8tKFtcXFMtXSopJC8pWzFdXG4gICAgICAgICAgLnJlcGxhY2UoLy0vLCAnLicpLFxuICAgICAgICBtYXJnaW4ubGVmdCxcbiAgICAgICAgbWFyZ2luLnRvcCArIDE1XG4gICAgICApO1xuXG4gICAgICBub2RlLnByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbiAocHJvcGVydHksIGkpIHtcbiAgICAgICAgdmFyIHNwaGVyZTtcblxuICAgICAgICAvLyBkcmF3IHRleHQgb24gdGhlIGNhbnZhc1xuICAgICAgICBjb250ZXh0LmZvbnQgPSBcIm5vcm1hbCAxNXB4IEFyaWFsXCI7XG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gZmlsbFN0eWxlW3Byb3BlcnR5LnR5cGVdIHx8IGRlZmF1bHRDb2xvcjtcbiAgICAgICAgY29udGV4dC5maWxsVGV4dChcbiAgICAgICAgICBwcm9wZXJ0eS5wcm9wZXJ0eSxcbiAgICAgICAgICBtYXJnaW4ubGVmdCAqIDIsXG4gICAgICAgICAgbWFyZ2luLnRvcCArIHRpdGxlSGVpZ2h0ICsgaSAqIDE1XG4gICAgICAgICk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIHRleHR1cmUgPSBuZXcgVEhSRUUuVGV4dHVyZShjYW52YXMpO1xuICAgICAgdGV4dHVyZS5uZWVkc1VwZGF0ZSA9IHRydWU7XG5cbiAgICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICAgIG1hcDogdGV4dHVyZSxcbiAgICAgICAgc2lkZTpUSFJFRS5Eb3VibGVTaWRlXG4gICAgICB9KTtcbiAgICAgIG1hdGVyaWFsLnRyYW5zcGFyZW50ID0gdHJ1ZTtcbiAgICAgIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goXG4gICAgICAgICAgbmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KSxcbiAgICAgICAgICBtYXRlcmlhbFxuICAgICAgKTtcbiAgICAgIC8vIG1lc2gucG9zaXRpb24ueCArPSBub2RlLndpZHRoIC8gMjtcbiAgICAgIC8vIG1lc2gucG9zaXRpb24ueSArPSBub2RlLmhlaWdodCAvIDI7XG5cbiAgICAgIG1lc2gucG9zaXRpb24uc2V0KFxuICAgICAgICBub2RlLngsXG4gICAgICAgIG5vZGUueSxcbiAgICAgICAgMC4xXG4gICAgICApO1xuXG4gICAgICBncm91cC5hZGQobWVzaCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHJhd05vZGVzKCkge1xuICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgbm9kZUdyb3VwID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG5cbiAgICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIHBvaW50cyA9IFtdLFxuICAgICAgICAgZyA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgICAgICBwb2ludHMucHVzaChuZXcgVEhSRUUuVmVjdG9yMigwLCAwKSk7XG4gICAgICAgIHBvaW50cy5wdXNoKG5ldyBUSFJFRS5WZWN0b3IyKG5vZGUud2lkdGgsIDApKTtcbiAgICAgICAgcG9pbnRzLnB1c2gobmV3IFRIUkVFLlZlY3RvcjIobm9kZS53aWR0aCwgbm9kZS5oZWlnaHQpKTtcbiAgICAgICAgcG9pbnRzLnB1c2gobmV3IFRIUkVFLlZlY3RvcjIoMCwgbm9kZS5oZWlnaHQpKTtcblxuICAgICAgICB2YXIgc2hhcGUgPSBuZXcgVEhSRUUuU2hhcGUocG9pbnRzKTtcblxuICAgICAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuU2hhcGVHZW9tZXRyeShzaGFwZSk7XG4gICAgICAgIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goXG4gICAgICAgICAgZ2VvbWV0cnksXG4gICAgICAgICAgbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgICAgIGNvbG9yOiAnI2VlZWVlZScsLy8gYm9yZGVyU3R5bGVbJ2Z1bmN0aW9uJ10sXG4gICAgICAgICAgICBsaW5lV2lkdGg6IDFcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIG1lc2gudXNlckRhdGEubm9kZSA9IG5vZGU7XG4gICAgICAgIG1lc2gucG9zaXRpb24uc2V0KFxuICAgICAgICAgIG5vZGUueCAtIG5vZGUud2lkdGggKiAwLjUsXG4gICAgICAgICAgbm9kZS55IC0gbm9kZS5oZWlnaHQgKiAwLjUsXG4gICAgICAgICAgMFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIEVBQ0ggT05FIElTIEEgU0lOR0xFIE1FU0hcbiAgICAgICAgbWUuYWN0aXZlU2NlbmUuYWRkKG1lc2gpO1xuICAgICAgICBub2RlTWVzaGVzLnB1c2gobWVzaCk7XG5cbiAgICAgICAgLy8gTUVSR0VcbiAgICAgICAgLy8gbWVzaC51cGRhdGVNYXRyaXgoKTtcbiAgICAgICAgLy8gbm9kZUdlb21ldHJ5Lm1lcmdlKG1lc2guZ2VvbWV0cnksIG1lc2gubWF0cml4KTtcblxuICAgICAgICAvLyBhZGQgdGhlIGRlc2NyaXB0aW9uIGluIGFub3RoZXIgZ3JvdXBcbiAgICAgICAgZHJhd1Byb3BlcnRpZXMobm9kZSwgbm9kZUdyb3VwKTtcbiAgICAgIH0pO1xuXG4gICAgICBtZS5hY3RpdmVTY2VuZS5hZGQobm9kZUdyb3VwKTtcblxuICAgICAgLy8gTUVSR0VcbiAgICAgIC8vIG1lLmFjdGl2ZVNjZW5lLmFkZChuZXcgVEhSRUUuTWVzaChcbiAgICAgIC8vICAgbm9kZUdlb21ldHJ5LFxuICAgICAgLy8gICBuZXcgVEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwoe1xuICAgICAgLy8gICAgIGNvbG9yOiAnI2VlZWVlZScsLy8gYm9yZGVyU3R5bGVbJ2Z1bmN0aW9uJ10sXG4gICAgICAvLyAgICAgbGluZVdpZHRoOiAxXG4gICAgICAvLyAgIH0pXG4gICAgICAvLyApKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkcmF3Q2lyY2xlcygpIHtcbiAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgIGNpcmNsZU1lc2ggPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuQ2lyY2xlR2VvbWV0cnkoNSwgOCkpLFxuICAgICAgICBtZXNoZXMgPSB7XG4gICAgICAgICAgb2JqZWN0OiB7XG4gICAgICAgICAgICBtYXRlcmlhbDogbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgICAgICAgY29sb3I6IGJvcmRlclN0eWxlLm9iamVjdFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBnZW9tZXRyeTogbmV3IFRIUkVFLkdlb21ldHJ5KClcbiAgICAgICAgICB9LFxuICAgICAgICAgICdmdW5jdGlvbic6IHtcbiAgICAgICAgICAgIG1hdGVyaWFsOiBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICAgICAgICBjb2xvcjogYm9yZGVyU3R5bGVbJ2Z1bmN0aW9uJ11cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgZ2VvbWV0cnk6IG5ldyBUSFJFRS5HZW9tZXRyeSgpXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBub2RlLnByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbiAocHJvcGVydHksIGkpIHtcbiAgICAgICAgICBpZiAocHJvcGVydHkudHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCBwcm9wZXJ0eS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgY2lyY2xlTWVzaC5wb3NpdGlvbi5zZXQoXG4gICAgICAgICAgICAgIGdldFgobm9kZSksIGdldFkobm9kZSwgaSkgKyA1LCAwLjJcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjaXJjbGVNZXNoLnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgICAgICAgbWVzaGVzW3Byb3BlcnR5LnR5cGVdLmdlb21ldHJ5XG4gICAgICAgICAgICAgIC5tZXJnZShjaXJjbGVNZXNoLmdlb21ldHJ5LCBjaXJjbGVNZXNoLm1hdHJpeCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgbWUuYWN0aXZlU2NlbmUuYWRkKG5ldyBUSFJFRS5NZXNoKFxuICAgICAgICBtZXNoZXMub2JqZWN0Lmdlb21ldHJ5LCBtZXNoZXMub2JqZWN0Lm1hdGVyaWFsXG4gICAgICApKTtcbiAgICAgIG1lLmFjdGl2ZVNjZW5lLmFkZChuZXcgVEhSRUUuTWVzaChcbiAgICAgICAgbWVzaGVzWydmdW5jdGlvbiddLmdlb21ldHJ5LCBtZXNoZXNbJ2Z1bmN0aW9uJ10ubWF0ZXJpYWxcbiAgICAgICkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlU3BsaW5lKGYsIG1pZCwgdCwgZCkge1xuICAgICAgdmFyIG11bHQgPSAwLFxuICAgICAgICBidW1wWiA9IG1pZC56ICogMC4yLFxuICAgICAgICBmbSA9IG5ldyBUSFJFRS5WZWN0b3IzKClcbiAgICAgICAgICAuYWRkVmVjdG9ycyhmLCBtaWQpXG4gICAgICAgICAgLm11bHRpcGx5U2NhbGFyKDAuNSlcbiAgICAgICAgICAuYWRkKG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgICAgICAgKG1pZC54IC0gZi54KSAqIG11bHQsXG4gICAgICAgICAgICAoZi55IC0gbWlkLnkpICogbXVsdCxcbiAgICAgICAgICAgIGJ1bXBaXG4gICAgICAgICAgKSksXG4gICAgICAgIG10ID0gbmV3IFRIUkVFLlZlY3RvcjMoKVxuICAgICAgICAgIC5hZGRWZWN0b3JzKG1pZCwgdClcbiAgICAgICAgICAubXVsdGlwbHlTY2FsYXIoMC41KVxuICAgICAgICAgIC5hZGQobmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgICAgICAgICAobWlkLnggLSB0LngpICogbXVsdCxcbiAgICAgICAgICAgICh0LnkgLSBtaWQueSkgKiBtdWx0LFxuICAgICAgICAgICAgYnVtcFpcbiAgICAgICAgICApKTtcblxuICAgICAgdmFyIHNwbGluZSA9IG5ldyBUSFJFRS5TcGxpbmUoW1xuICAgICAgICBmLCBmbSwgbWlkLCBtdCwgdFxuICAgICAgXSksIGksIGwgPSAxMCwgaW5kZXgsIHBvc2l0aW9uLFxuICAgICAgICBnZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuXG4gICAgICBnZW9tZXRyeS5jb2xvcnMgPSBbXTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPD0gbDsgaSArPSAxKSB7XG4gICAgICAgIGluZGV4ID0gaSAvIGw7XG4gICAgICAgIHBvc2l0aW9uID0gc3BsaW5lLmdldFBvaW50KGluZGV4KTtcbiAgICAgICAgZ2VvbWV0cnkudmVydGljZXNbaV0gPSBuZXcgVEhSRUUuVmVjdG9yMyhwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBwb3NpdGlvbi56KTtcbiAgICAgICAgZ2VvbWV0cnkuY29sb3JzW2ldID0gbmV3IFRIUkVFLkNvbG9yKDB4ZmZmZmZmKTtcbiAgICAgICAgZ2VvbWV0cnkuY29sb3JzW2ldLnNldEhTTChcbiAgICAgICAgICAvLyAyMDAgLyAzNjAsXG4gICAgICAgICAgLy8gaW5kZXgsXG4gICAgICAgICAgLy8gMC41XG4gICAgICAgICAgMjAwLzM2MCxcbiAgICAgICAgICAxLFxuICAgICAgICAgIDAuOVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdlb21ldHJ5O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRyYXdFZGdlcyhzY29wZSkge1xuICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgZnJvbVYgPSBuZXcgVEhSRUUuVmVjdG9yMygpLFxuICAgICAgICB0b1YgPSBuZXcgVEhSRUUuVmVjdG9yMygpLFxuICAgICAgICBtaWQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgICBlZGdlcy5mb3JFYWNoKGZ1bmN0aW9uIChsaW5rLCBpKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGksIGVkZ2VzLmxlbmd0aCk7XG4gICAgICAgIHZhciBmcm9tID0gbm9kZU1hcFtsaW5rLmZyb21dO1xuICAgICAgICB2YXIgdG8gPSBub2RlTWFwW2xpbmsudG9dO1xuXG4gICAgICAgIHZhciBpbmRleCA9IF8uZmluZEluZGV4KFxuICAgICAgICAgIGZyb20ucHJvcGVydGllcyxcbiAgICAgICAgICB7IG5hbWU6IGxpbmsucHJvcGVydHkgfVxuICAgICAgICApO1xuICAgICAgICBmcm9tVi5zZXQoXG4gICAgICAgICAgZnJvbS54IC0gZnJvbS53aWR0aCAqIDAuNSArIG1hcmdpbi5sZWZ0LFxuICAgICAgICAgIGZyb20ueSAtIGZyb20uaGVpZ2h0ICogMC41ICsgKGZyb20ucHJvcGVydGllcy5sZW5ndGggLSBpbmRleCkgKiAxNSArIDUsXG4gICAgICAgICAgMFxuICAgICAgICApO1xuICAgICAgICB0b1Yuc2V0KFxuICAgICAgICAgIHRvLnggLSB0by53aWR0aCAqIDAuNSxcbiAgICAgICAgICB0by55IC0gdG8uaGVpZ2h0ICogMC41LFxuICAgICAgICAgIDBcbiAgICAgICAgKTtcbiAgICAgICAgdmFyIGQgPSBmcm9tVi5kaXN0YW5jZVRvKHRvVik7XG4gICAgICAgIG1pZFxuICAgICAgICAgIC5hZGRWZWN0b3JzKGZyb21WLCB0b1YpXG4gICAgICAgICAgLm11bHRpcGx5U2NhbGFyKDAuNSlcbiAgICAgICAgICAuc2V0Wig1MCk7XG5cbiAgICAgICAgdmFyIGdlb21ldHJ5ID0gZ2VuZXJhdGVTcGxpbmUoZnJvbVYsIG1pZCwgdG9WLCBkKTtcbiAgICAgICAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgICBjb2xvcjogMHhmZmZmZmYsXG4gICAgICAgICAgb3BhY2l0eTogMC41LFxuICAgICAgICAgIGxpbmV3aWR0aDogMyxcbiAgICAgICAgICB2ZXJ0ZXhDb2xvcnM6IFRIUkVFLlZlcnRleENvbG9yc1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTGluZShnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICAgICAgICBtZS5hY3RpdmVTY2VuZS5hZGQobWVzaCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBwcmUgaW5pdFxuICAgIHQzLnRoZW1lcy5hbGxXaGl0ZSA9IHtcbiAgICAgIGNsZWFyQ29sb3I6IDB4ZmZmZmZmLFxuICAgICAgZm9nQ29sb3I6IDB4ZmZmZmZmLFxuICAgICAgZ3JvdW5kQ29sb3I6IDB4ZmZmZmZmXG4gICAgfTtcbiAgICBpbnN0YW5jZSA9IHQzLnJ1bih7XG4gICAgICBzZWxlY3RvcjogZWwgKyAnICNyb290JyxcbiAgICAgIHdpZHRoOiBiYm94LndpZHRoLFxuICAgICAgaGVpZ2h0OiBiYm94LmhlaWdodCxcbiAgICAgIHRoZW1lOiAnYWxsV2hpdGUnLFxuICAgICAgYW1iaWVudENvbmZpZzoge1xuICAgICAgICBncm91bmQ6IGZhbHNlLFxuICAgICAgICBheGVzOiBmYWxzZSxcbiAgICAgICAgZ3JpZFk6IGZhbHNlLFxuICAgICAgICBncmlkWDogZmFsc2UsXG4gICAgICAgIGdyaWRaOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICByZW5kZXJlckVsID0gbWUucmVuZGVyZXIuZG9tRWxlbWVudDtcbiAgICAgICAgbWUuZGF0Z3VpLmNsb3NlKCk7XG4gICAgICAgIG1lLmFjdGl2ZVNjZW5lLmZvZyA9IG51bGw7XG4gICAgICAgIG1lLnJlbmRlcmVyLnNvcnRPYmplY3RzID0gZmFsc2U7XG4gICAgICAgIG1lLnJlbmRlcmVyLnNoYWRvd01hcEVuYWJsZWQgPSB0cnVlO1xuICAgICAgICBtZS5yZW5kZXJlci5zaGFkb3dNYXBUeXBlID0gVEhSRUUuUENGU2hhZG93TWFwO1xuXG4gICAgICAgIHZhciBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgICAgIHZhciBtb3ZlZCA9IGZhbHNlLCBkb3duID0gZmFsc2U7XG4gICAgICAgIHJlbmRlcmVyRWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBpZiAoZG93bikge1xuICAgICAgICAgICAgbW92ZWQgPSB0cnVlO1xuICAgICAgICAgICAgd3JhcHBlckVsLnN0eWxlLmN1cnNvciA9ICdtb3ZlJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW92ZWQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZW5kZXJlckVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgZG93biA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICByZW5kZXJlckVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGRvd24gPSBmYWxzZTtcbiAgICAgICAgICB3cmFwcGVyRWwuc3R5bGUuY3Vyc29yID0gJ2F1dG8nO1xuICAgICAgICB9KTtcbiAgICAgICAgcmVuZGVyZXJFbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZhciBiYm94ID0gcmVuZGVyZXJFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICB2YXIgY3ggPSBlLmNsaWVudFggLSBiYm94LmxlZnQ7XG4gICAgICAgICAgdmFyIGN5ID0gZS5jbGllbnRZIC0gYmJveC50b3A7XG4gICAgICAgICAgbW91c2UueCA9IChjeCAvIHJlbmRlcmVyRWwuY2xpZW50V2lkdGgpICogMiAtIDE7XG4gICAgICAgICAgbW91c2UueSA9IC0oY3kgLyByZW5kZXJlckVsLmNsaWVudEhlaWdodCkgKiAyICsgMTtcbiAgICAgICAgICB2YXIgdmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjMoIG1vdXNlLngsIG1vdXNlLnksIDAuNSApO1xuICAgICAgICAgIHByb2plY3Rvci51bnByb2plY3RWZWN0b3IodmVjdG9yLCBtZS5hY3RpdmVDYW1lcmEpO1xuXG4gICAgICAgICAgdmFyIHJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoXG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24sXG4gICAgICAgICAgICB2ZWN0b3Iuc3ViKGNhbWVyYS5wb3NpdGlvbikubm9ybWFsaXplKClcbiAgICAgICAgICApO1xuICAgICAgICAgIHZhciBpbnRlcnNlY3RzID0gcmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdHMobm9kZU1lc2hlcyksXG4gICAgICAgICAgICBpT2JqZWN0ID0gaW50ZXJzZWN0c1swXSAmJiBpbnRlcnNlY3RzWzBdLm9iamVjdDtcbiAgICAgICAgICBpZiAoaU9iamVjdCAmJiAhbW92ZWQpIHtcbiAgICAgICAgICAgIC8vIGZvY3VzIG9uIHRoaXMgb2JqZWN0IG9uIGNsaWNrXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhpT2JqZWN0KTtcbiAgICAgICAgICAgIHZhciBkZXN0ID0ge1xuICAgICAgICAgICAgICB4OiBpT2JqZWN0LnBvc2l0aW9uLnggKyBpT2JqZWN0LnVzZXJEYXRhLm5vZGUud2lkdGggLyAyLFxuICAgICAgICAgICAgICB5OiBpT2JqZWN0LnBvc2l0aW9uLnkgKyBpT2JqZWN0LnVzZXJEYXRhLm5vZGUuaGVpZ2h0IC8gMlxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG5ldyBUV0VFTi5Ud2VlbihtZS5hY3RpdmVDYW1lcmEucG9zaXRpb24pXG4gICAgICAgICAgICAgIC50byhfLm1lcmdlKHt9LCBkZXN0LCB7XG4gICAgICAgICAgICAgICAgejogTWF0aC5tYXgoaU9iamVjdC51c2VyRGF0YS5ub2RlLmhlaWdodCwgMzUwKVxuICAgICAgICAgICAgICB9KSwgMTAwMClcbiAgICAgICAgICAgICAgLmVhc2luZyhUV0VFTi5FYXNpbmcuQ3ViaWMuSW5PdXQpXG4gICAgICAgICAgICAgIC5zdGFydCgpO1xuICAgICAgICAgICAgbmV3IFRXRUVOLlR3ZWVuKG1lLmFjdGl2ZUNhbWVyYS5jYW1lcmFDb250cm9scy50YXJnZXQpXG4gICAgICAgICAgICAgIC50byhkZXN0LCAxMDAwKVxuICAgICAgICAgICAgICAuZWFzaW5nKFRXRUVOLkVhc2luZy5DdWJpYy5Jbk91dClcbiAgICAgICAgICAgICAgLnN0YXJ0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgLy8gY2FtZXJhIHNldHVwXG4gICAgICAgIHZhciBmb3YgPSA3MCxcbiAgICAgICAgICByYXRpbyA9IHJlbmRlcmVyRWwuY2xpZW50V2lkdGggLyByZW5kZXJlckVsLmNsaWVudEhlaWdodCxcbiAgICAgICAgICBuZWFyID0gMSxcbiAgICAgICAgICBmYXIgPSAyMDAwMDtcbiAgICAgICAgdmFyIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYShmb3YsIHJhdGlvLCBuZWFyLCBmYXIpO1xuICAgICAgICBtZVxuICAgICAgICAgIC5hZGRDYW1lcmEoY2FtZXJhLCAnbWluZScpXG4gICAgICAgICAgLnNldEFjdGl2ZUNhbWVyYSgnbWluZScpO1xuICAgICAgICBjcmVhdGVDYW1lcmFDb250cm9scyhjYW1lcmEsIHJlbmRlcmVyRWwpO1xuICAgICAgICBjYW1lcmEuY2FtZXJhQ29udHJvbHMudGFyZ2V0LnNldChcbiAgICAgICAgICBkYXRhLmNlbnRlci54LFxuICAgICAgICAgIGRhdGEuY2VudGVyLnksXG4gICAgICAgICAgMFxuICAgICAgICApO1xuICAgICAgICBjYW1lcmEuY2FtZXJhQ29udHJvbHMubm9LZXlzID0gdHJ1ZTtcblxuICAgICAgICAvLyBkcmF3IHRoZSBub2Rlc1xuICAgICAgICBkcmF3Tm9kZXMuY2FsbChtZSk7XG4gICAgICAgIGRyYXdDaXJjbGVzLmNhbGwobWUpO1xuICAgICAgICBkcmF3RWRnZXMuY2FsbChtZSk7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnNldChcbiAgICAgICAgICAgIGRhdGEuY2VudGVyLngsXG4gICAgICAgICAgICBkYXRhLmNlbnRlci55LFxuICAgICAgICAgICAgTWF0aC5taW4oZGF0YS5teC54IC0gZGF0YS5tbi54LCBkYXRhLm14LnkgLSBkYXRhLm1uLnkpXG4gICAgICAgICAgKTtcbiAgICAgICAgICAvL2NhbWVyYS5sb29rQXQobmV3IFRIUkVFLlZlY3RvcjMoZGF0YS5jZW50ZXIueCwgZGF0YS5jZW50ZXIueSwgMCkpO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH0sXG4gICAgICB1cGRhdGU6IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgICAgICBUV0VFTi51cGRhdGUoKTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgbWUuYWMgPSBtZS5hYyB8fCAwO1xuICAgICAgICBtZS5hYyArPSBkZWx0YTtcbiAgICAgICAgaWYgKG1lLmFjID4gMikge1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKG1lLnJlbmRlcmVyLmluZm8ucmVuZGVyKTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhtZS5yZW5kZXJlcik7XG4gICAgICAgICAgbWUuYWMgPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgY2hhbmdlRmFrZVByb3BlcnR5TmFtZSA9IHtcbiAgJ1tbUHJvdG90eXBlXV0nOiAnX19wcm90b19fJ1xufTtcblxudmFyIHV0aWxzID0ge1xuICB0cmFuc2xhdGU6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgcmV0dXJuICd0cmFuc2xhdGUoJyArICh4IHx8IDApICsgJywgJyArICh5IHx8IDApICsgJyknO1xuICB9LFxuICBzY2FsZTogZnVuY3Rpb24gKHMpIHtcbiAgICByZXR1cm4gJ3NjYWxlKCcgKyAocyB8fCAxKSArICcpJztcbiAgfSxcbiAgdHJhbnNmb3JtOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHQgPSBbXTtcbiAgICBfLmZvck93bihvYmosIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgICB0LnB1c2godXRpbHNba10uYXBwbHkodXRpbHMsIHYpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdC5qb2luKCcgJyk7XG4gIH0sXG4gIHByZWZpeGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KCdwdicpO1xuICAgIHJldHVybiBhcmdzLmpvaW4oJy0nKTtcbiAgfSxcbiAgdHJhbnNmb3JtUHJvcGVydHk6IGZ1bmN0aW9uICh2KSB7XG4gICAgaWYgKGNoYW5nZUZha2VQcm9wZXJ0eU5hbWUuaGFzT3duUHJvcGVydHkodikpIHtcbiAgICAgIHJldHVybiBjaGFuZ2VGYWtlUHJvcGVydHlOYW1lW3ZdO1xuICAgIH1cbiAgICByZXR1cm4gdjtcbiAgfSxcbiAgZXNjYXBlQ2xzOiBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHYucmVwbGFjZSgvXFwkL2csICdfJyk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbHM7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi8nKTtcbnZhciBtZSwgaGFzaEtleTtcbi8qKlxuICogR2V0cyBhIHN0b3JlIGhhc2hrZXkgb25seSBpZiBpdCdzIGFuIG9iamVjdFxuICogQHBhcmFtICB7W3R5cGVdfSBvYmpcbiAqIEByZXR1cm4ge1t0eXBlXX1cbiAqL1xuZnVuY3Rpb24gZ2V0KG9iaikge1xuICBhc3NlcnQodXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKG9iaiksICdvYmogbXVzdCBiZSBhbiBvYmplY3R8ZnVuY3Rpb24nKTtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIG1lLmhpZGRlbktleSkgJiZcbiAgICBvYmpbbWUuaGlkZGVuS2V5XTtcbn1cblxuLyoqXG4gKiBUT0RPOiBkb2N1bWVudFxuICogU2V0cyBhIGtleSBvbiBhbiBvYmplY3RcbiAqIEBwYXJhbSB7W3R5cGVdfSBvYmogW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtIHtbdHlwZV19IGtleSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIHNldChvYmosIGtleSkge1xuICBhc3NlcnQodXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKG9iaiksICdvYmogbXVzdCBiZSBhbiBvYmplY3R8ZnVuY3Rpb24nKTtcbiAgYXNzZXJ0KFxuICAgIGtleSAmJiB0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyxcbiAgICAnVGhlIGtleSBuZWVkcyB0byBiZSBhIHZhbGlkIHN0cmluZydcbiAgKTtcbiAgdmFyIHZhbHVlO1xuICBpZiAoIWdldChvYmopKSB7XG4gICAgdmFsdWUgPSB0eXBlb2Ygb2JqICsgJy0nICsga2V5O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG1lLmhpZGRlbktleSwge1xuICAgICAgdmFsdWU6IHZhbHVlXG4gICAgfSk7XG4gICAgaWYgKCFvYmpbbWUuaGlkZGVuS2V5XSkge1xuICAgICAgY29uc29sZS53YXJuKCdPYmplY3QuZGVmaW5lUHJvcGVydHkgZGlkIG5vdCB3b3JrISBzZXR0aW5nIHRoZSB2YWx1ZSBvbiB0aGUgb2JqZWN0IGRpcmVjdGx5Jyk7XG4gICAgICBvYmpbbWUuaGlkZGVuS2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgICBhc3NlcnQob2JqW21lLmhpZGRlbktleV0sICdPYmplY3QuZGVmaW5lUHJvcGVydHkgZGlkIG5vdCB3b3JrIScpO1xuICB9XG4gIHJldHVybiBtZTtcbn1cblxubWUgPSBoYXNoS2V5ID0gZnVuY3Rpb24gKHYpIHtcbiAgdmFyIHVpZCA9IHY7XG4gIGlmICh1dGlscy5pc09iamVjdE9yRnVuY3Rpb24odikpIHtcbiAgICBpZiAoIWdldCh2KSkge1xuICAgICAgbWUuY3JlYXRlSGFzaEtleXNGb3Iodik7XG4gICAgfVxuICAgIHVpZCA9IGdldCh2KTtcbiAgICBpZiAoIXVpZCkge1xuICAgICAgdGhyb3cgRXJyb3IodiArICcgc2hvdWxkIGhhdmUgYSBoYXNoS2V5IGF0IHRoaXMgcG9pbnQgOignKTtcbiAgICB9XG4gICAgYXNzZXJ0KHVpZCwgJ2Vycm9yIGdldHRpbmcgdGhlIGtleScpO1xuICAgIHJldHVybiB1aWQ7XG4gIH1cblxuICAvLyB2IGlzIGEgcHJpbWl0aXZlXG4gIHJldHVybiB0eXBlb2YgdiArICctJyArIHVpZDtcbn07XG5cbm1lLmhpZGRlbktleSA9ICdfX3Bvam92aXpLZXlfXyc7XG5cbm1lLmNyZWF0ZUhhc2hLZXlzRm9yID0gZnVuY3Rpb24gKG9iaiwgbmFtZSkge1xuXG4gIGZ1bmN0aW9uIGxvY2FsVG9TdHJpbmcob2JqKSB7XG4gICAgdmFyIG1hdGNoO1xuICAgIHRyeSB7XG4gICAgICBtYXRjaCA9IHt9LnRvU3RyaW5nLmNhbGwob2JqKS5tYXRjaCgvXlxcW29iamVjdCAoXFxTKj8pXFxdLyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbWF0Y2ggPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoICYmIG1hdGNoWzFdO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuYWx5emUgdGhlIGludGVybmFsIHByb3BlcnR5IFtbQ2xhc3NdXSB0byBndWVzcyB0aGUgbmFtZVxuICAgKiBvZiB0aGlzIG9iamVjdCwgZS5nLiBbb2JqZWN0IERhdGVdLCBbb2JqZWN0IE1hdGhdXG4gICAqIE1hbnkgb2JqZWN0IHdpbGwgZ2l2ZSBmYWxzZSBwb3NpdGl2ZXMgKHRoZXkgd2lsbCBtYXRjaCBbb2JqZWN0IE9iamVjdF0pXG4gICAqIHNvIGxldCdzIGNvbnNpZGVyIE9iamVjdCBhcyB0aGUgbmFtZSBvbmx5IGlmIGl0J3MgZXF1YWwgdG9cbiAgICogT2JqZWN0LnByb3RvdHlwZVxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICBvYmpcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG4gIGZ1bmN0aW9uIGhhc0FDbGFzc05hbWUob2JqKSB7XG4gICAgdmFyIG1hdGNoID0gbG9jYWxUb1N0cmluZyhvYmopO1xuICAgIGlmIChtYXRjaCA9PT0gJ09iamVjdCcpIHtcbiAgICAgIHJldHVybiBvYmogPT09IE9iamVjdC5wcm90b3R5cGUgJiYgJ09iamVjdCc7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5hbWUob2JqKSB7XG4gICAgdmFyIG5hbWUsIGNsYXNzTmFtZTtcblxuICAgIC8vIHJldHVybiB0aGUgYWxyZWFkeSBnZW5lcmF0ZWQgaGFzaEtleVxuICAgIGlmIChnZXQob2JqKSkge1xuICAgICAgcmV0dXJuIGdldChvYmopO1xuICAgIH1cblxuICAgIC8vIGdlbmVyYXRlIGEgbmV3IGtleSBiYXNlZCBvblxuICAgIC8vIC0gdGhlIG5hbWUgaWYgaXQncyBhIGZ1bmN0aW9uXG4gICAgLy8gLSBhIHVuaXF1ZSBpZFxuICAgIG5hbWUgPSB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nICYmXG4gICAgICB0eXBlb2Ygb2JqLm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICBvYmoubmFtZTtcblxuICAgIGNsYXNzTmFtZSA9IGhhc0FDbGFzc05hbWUob2JqKTtcbiAgICBpZiAoIW5hbWUgJiYgY2xhc3NOYW1lKSB7XG4gICAgICBuYW1lID0gY2xhc3NOYW1lO1xuICAgIH1cblxuICAgIG5hbWUgPSBuYW1lIHx8IF8udW5pcXVlSWQoKTtcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIC8vIHRoZSBuYW1lIGlzIGVxdWFsIHRvIHRoZSBwYXNzZWQgbmFtZSBvciB0aGVcbiAgLy8gZ2VuZXJhdGVkIG5hbWVcbiAgbmFtZSA9IG5hbWUgfHwgZ2V0TmFtZShvYmopO1xuICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFwuIF0vaW1nLCAnLScpO1xuXG4gIC8vIGlmIHRoZSBvYmogaXMgYSBwcm90b3R5cGUgdGhlbiB0cnkgdG8gYW5hbHl6ZVxuICAvLyB0aGUgY29uc3RydWN0b3IgZmlyc3Qgc28gdGhhdCB0aGUgcHJvdG90eXBlIGJlY29tZXNcbiAgLy8gW25hbWVdLnByb3RvdHlwZVxuICAvLyBzcGVjaWFsIGNhc2U6IG9iamVjdC5jb25zdHJ1Y3RvciA9IG9iamVjdFxuICBpZiAob2JqLmhhc093blByb3BlcnR5ICYmXG4gICAgICBvYmouaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgJiZcbiAgICAgIHR5cGVvZiBvYmouY29uc3RydWN0b3IgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3RvciAhPT0gb2JqKSB7XG4gICAgbWUuY3JlYXRlSGFzaEtleXNGb3Iob2JqLmNvbnN0cnVjdG9yKTtcbiAgfVxuXG4gIC8vIHNldCBuYW1lIG9uIHNlbGZcbiAgc2V0KG9iaiwgbmFtZSk7XG5cbiAgLy8gc2V0IG5hbWUgb24gdGhlIHByb3RvdHlwZVxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgb2JqLmhhc093blByb3BlcnR5KCdwcm90b3R5cGUnKSkge1xuICAgIHNldChvYmoucHJvdG90eXBlLCBuYW1lICsgJy1wcm90b3R5cGUnKTtcbiAgfVxufTtcblxubWUuaGFzID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHYuaGFzT3duUHJvcGVydHkgJiZcbiAgICB2Lmhhc093blByb3BlcnR5KG1lLmhpZGRlbktleSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1lOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuZnVuY3Rpb24gdHlwZSh2KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodikuc2xpY2UoOCwgLTEpO1xufVxuXG52YXIgdXRpbHMgPSB7fTtcblxuLyoqXG4gKiBBZnRlciBjYWxsaW5nIGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nYCB3aXRoIGB2YCBhcyB0aGUgc2NvcGVcbiAqIHRoZSByZXR1cm4gdmFsdWUgd291bGQgYmUgdGhlIGNvbmNhdGVuYXRpb24gb2YgJ1tPYmplY3QgJyxcbiAqIGNsYXNzIGFuZCAnXScsIGBjbGFzc2AgaXMgdGhlIHJldHVybmluZyB2YWx1ZSBvZiB0aGlzIGZ1bmN0aW9uXG4gKlxuICogZS5nLiAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChbXSkgPT0gW29iamVjdCBBcnJheV0sXG4gKiAgICAgICAgdGhlIHJldHVybmluZyB2YWx1ZSBpcyB0aGUgc3RyaW5nIEFycmF5XG4gKlxuICogQHBhcmFtIHsqfSB2XG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG51dGlscy5pbnRlcm5hbENsYXNzUHJvcGVydHkgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdHlwZSh2KTtcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZ2l2ZW4gdmFsdWUgaXMgYSBmdW5jdGlvbiwgdGhlIGxpYnJhcnkgb25seSBuZWVkc1xuICogdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2YgcHJpbWl0aXZlIHR5cGVzIChubyBuZWVkIHRvXG4gKiBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpZmZlcmVudCBraW5kcyBvZiBvYmplY3RzKVxuICpcbiAqIEBwYXJhbSAgeyp9ICB2IFRoZSB2YWx1ZSB0byBiZSBjaGVja2VkXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiAhIXYgJiYgdHlwZW9mIHYgPT09ICdmdW5jdGlvbic7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiBhIGdpdmVuIHZhbHVlIGlzIGFuIG9iamVjdCwgdGhlIGxpYnJhcnkgb25seSBuZWVkc1xuICogdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2YgcHJpbWl0aXZlIHR5cGVzIChubyBuZWVkIHRvXG4gKiBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpZmZlcmVudCBraW5kcyBvZiBvYmplY3RzKVxuICpcbiAqIE5PVEU6IGEgZnVuY3Rpb24gd2lsbCBub3QgcGFzcyB0aGlzIHRlc3RcbiAqIGkuZS5cbiAqICAgICAgICB1dGlscy5pc09iamVjdChmdW5jdGlvbigpIHt9KSBpcyBmYWxzZSFcbiAqXG4gKiBTcGVjaWFsIHZhbHVlcyB3aG9zZSBgdHlwZW9mYCByZXN1bHRzIGluIGFuIG9iamVjdDpcbiAqIC0gbnVsbFxuICpcbiAqIEBwYXJhbSAgeyp9ICB2IFRoZSB2YWx1ZSB0byBiZSBjaGVja2VkXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNPYmplY3QgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gISF2ICYmIHR5cGVvZiB2ID09PSAnb2JqZWN0Jztcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhbiBvYmplY3Qgb3IgYSBmdW5jdGlvbiAobm90ZSB0aGF0IGZvciB0aGUgc2FrZVxuICogb2YgdGhlIGxpYnJhcnkgQXJyYXlzIGFyZSBub3Qgb2JqZWN0cylcbiAqXG4gKiBAcGFyYW0geyp9IHZcbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG51dGlscy5pc09iamVjdE9yRnVuY3Rpb24gPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdXRpbHMuaXNPYmplY3QodikgfHwgdXRpbHMuaXNGdW5jdGlvbih2KTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogQ2hlY2tzIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyB0cmF2ZXJzYWJsZSwgZm9yIHRoZSBzYWtlIG9mIHRoZSBsaWJyYXJ5IGFuXG4gKiBvYmplY3QgKHdoaWNoIGlzIG5vdCBhbiBhcnJheSkgb3IgYSBmdW5jdGlvbiBpcyB0cmF2ZXJzYWJsZSwgc2luY2UgdGhpcyBmdW5jdGlvblxuICogaXMgdXNlZCBieSB0aGUgb2JqZWN0IGFuYWx5emVyIG92ZXJyaWRpbmcgaXQgd2lsbCBkZXRlcm1pbmUgd2hpY2ggb2JqZWN0c1xuICogYXJlIHRyYXZlcnNhYmxlXG4gKlxuICogQHBhcmFtIHsqfSB2XG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNUcmF2ZXJzYWJsZSA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB1dGlscy5pc09iamVjdE9yRnVuY3Rpb24odik7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBzcGVjaWFsIGZ1bmN0aW9uIHdoaWNoIGlzIGFibGUgdG8gZXhlY3V0ZSBhIHNlcmllcyBvZiBmdW5jdGlvbnMgdGhyb3VnaFxuICogY2hhaW5pbmcsIHRvIHJ1biBhbGwgdGhlIGZ1bmN0aW9ucyBzdG9yZWQgaW4gdGhlIGNoYWluIGV4ZWN1dGUgdGhlIHJlc3VsdGluZyB2YWx1ZVxuICpcbiAqIC0gZWFjaCBmdW5jdGlvbiBpcyBpbnZva2VkIHdpdGggdGhlIG9yaWdpbmFsIGFyZ3VtZW50cyB3aGljaCBgZnVuY3Rpb25DaGFpbmAgd2FzXG4gKiBpbnZva2VkIHdpdGggKyB0aGUgcmVzdWx0aW5nIHZhbHVlIG9mIHRoZSBsYXN0IG9wZXJhdGlvbiBhcyB0aGUgbGFzdCBhcmd1bWVudFxuICogLSB0aGUgc2NvcGUgb2YgZWFjaCBmdW5jdGlvbiBpcyB0aGUgc2FtZSBzY29wZSBhcyB0aGUgb25lIHRoYXQgdGhlIHJlc3VsdGluZ1xuICogZnVuY3Rpb24gd2lsbCBoYXZlXG4gKlxuICogICAgdmFyIGZucyA9IHV0aWxzLmZ1bmN0aW9uQ2hhaW4oKVxuICogICAgICAgICAgICAgICAgLmNoYWluKGZ1bmN0aW9uIChhLCBiKSB7XG4gKiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGEsIGIpO1xuICogICAgICAgICAgICAgICAgICByZXR1cm4gJ2ZpcnN0JztcbiAqICAgICAgICAgICAgICAgIH0pXG4gKiAgICAgICAgICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAqICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYSwgYiwgYyk7XG4gKiAgICAgICAgICAgICAgICAgIHJldHVybiAnc2Vjb25kO1xuICogICAgICAgICAgICAgICAgfSlcbiAqICAgIGZucygxLCAyKTsgIC8vIHJldHVybnMgJ3NlY29uZCdcbiAqICAgIC8vIGxvZ3MgMSwgMlxuICogICAgLy8gbG9ncyAxLCAyLCAnZmlyc3QnXG4gKlxuICogQHJldHVybnMge0Z1bmN0aW9ufVxuICovXG51dGlscy5mdW5jdGlvbkNoYWluID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3RhY2sgPSBbXTtcbiAgdmFyIGlubmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICB2YXIgdmFsdWUgPSBudWxsO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIHZhbHVlID0gc3RhY2tbaV0uYXBwbHkodGhpcywgYXJncy5jb25jYXQodmFsdWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuICBpbm5lci5jaGFpbiA9IGZ1bmN0aW9uICh2KSB7XG4gICAgc3RhY2sucHVzaCh2KTtcbiAgICByZXR1cm4gaW5uZXI7XG4gIH07XG4gIHJldHVybiBpbm5lcjtcbn07XG5cbnV0aWxzLmNyZWF0ZUV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgZGV0YWlscykge1xuICByZXR1cm4gbmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwge1xuICAgIGRldGFpbDogZGV0YWlsc1xuICB9KTtcbn07XG51dGlscy5ub3RpZmljYXRpb24gPSBmdW5jdGlvbiAobWVzc2FnZSwgY29uc29sZVRvbykge1xuICB2YXIgZXYgPSB1dGlscy5jcmVhdGVFdmVudCgncG9qb3Zpei1ub3RpZmljYXRpb24nLCBtZXNzYWdlKTtcbiAgY29uc29sZVRvbyAmJiBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldik7XG59O1xudXRpbHMuY3JlYXRlSnNvbnBDYWxsYmFjayA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICBzY3JpcHQuc3JjID0gdXJsO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG59O1xudXRpbHMudG9RdWVyeVN0cmluZyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIHMgPSAnJyxcbiAgICBpID0gMDtcbiAgXy5mb3JPd24ob2JqLCBmdW5jdGlvbiAodiwgaykge1xuICAgIGlmIChpKSB7XG4gICAgICBzICs9ICcmJztcbiAgICB9XG4gICAgcyArPSBrICsgJz0nICsgdjtcbiAgICBpICs9IDE7XG4gIH0pO1xuICByZXR1cm4gcztcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogR2l2ZW4gYSBwcm9wZXJ0eSBuYW1lIHRoaXMgbWV0aG9kIGlkZW50aWZpZXMgaWYgaXQncyBhIHZhbGlkIHByb3BlcnR5IGZvciB0aGUgc2FrZVxuICogb2YgdGhlIGxpYnJhcnksIGEgdmFsaWQgcHJvcGVydHkgaXMgYSBwcm9wZXJ0eSB3aGljaCBkb2VzIG5vdCBwcm92b2tlIGFuIGVycm9yXG4gKiB3aGVuIHRyeWluZyB0byBhY2Nlc3MgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gaXQgZnJvbSBhbnkgb2JqZWN0XG4gKlxuICogRm9yIGV4YW1wbGUgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgY29kZSBpbiBzdHJpY3QgbW9kZSB3aWxsIHlpZWxkIGFuIGVycm9yOlxuICpcbiAqICAgIHZhciBmbiA9IGZ1bmN0aW9uKCkge307XG4gKiAgICBmbi5hcmd1bWVudHNcbiAqXG4gKiBTaW5jZSBhcmd1bWVudHMgaXMgcHJvaGliaXRlZCBpbiBzdHJpY3QgbW9kZVxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvU3RyaWN0X21vZGVcbiAqXG4gKlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICovXG51dGlscy5vYmplY3RQcm9wZXJ0eUlzRm9yYmlkZGVuID0gZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgdmFyIGtleTtcbiAgdmFyIHJ1bGVzID0gdXRpbHMucHJvcGVydHlGb3JiaWRkZW5SdWxlcztcbiAgZm9yIChrZXkgaW4gcnVsZXMpIHtcbiAgICBpZiAocnVsZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgaWYgKHJ1bGVzW2tleV0ob2JqZWN0LCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogTW9kaWZ5IHRoaXMgb2JqZWN0IHRvIGFkZC9yZW1vdmUgcnVsZXMgdGhhdCB3aWwgYmUgcnVuIGJ5XG4gKiAjb2JqZWN0UHJvcGVydHlJc0ZvcmJpZGRlbiwgdG8gZGV0ZXJtaW5lIGlmIGEgcHJvcGVydHkgaXMgaW52YWxpZFxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnV0aWxzLnByb3BlcnR5Rm9yYmlkZGVuUnVsZXMgPSB7XG4gIC8qKlxuICAgKiBgY2FsbGVyYCBhbmQgYGFyZ3VtZW50c2AgYXJlIGludmFsaWQgcHJvcGVydGllcyBvZiBhIGZ1bmN0aW9uIGluIHN0cmljdCBtb2RlXG4gICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIHN0cmljdE1vZGU6IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKHV0aWxzLmlzRnVuY3Rpb24ob2JqZWN0KSkge1xuICAgICAgcmV0dXJuIHByb3BlcnR5ID09PSAnY2FsbGVyJyB8fCBwcm9wZXJ0eSA9PT0gJ2FyZ3VtZW50cyc7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogUHJvcGVydGllcyB0aGF0IHN0YXJ0IGFuZCBlbmQgd2l0aCBfXyBhcmUgc3BlY2lhbCBwcm9wZXJ0aWVzLFxuICAgKiBpbiBzb21lIGNhc2VzIHRoZXkgYXJlIHZhbGlkIChsaWtlIF9fcHJvdG9fXykgb3IgZGVwcmVjYXRlZFxuICAgKiBsaWtlIF9fZGVmaW5lR2V0dGVyX19cbiAgICpcbiAgICogZS5nLlxuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fcHJvdG9fX1xuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lR2V0dGVyX19cbiAgICogIC0gT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZVNldHRlcl9fXG4gICAqICAtIE9iamVjdC5wcm90b3R5cGUuX19sb29rdXBHZXR0ZXJfX1xuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fbG9va3VwU2V0dGVyX19cbiAgICpcbiAgICogQHBhcmFtIHsqfSBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgaGlkZGVuUHJvcGVydHk6IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIHByb3BlcnR5LnNlYXJjaCgvXl9fLio/X18kLykgPiAtMTtcbiAgfSxcblxuICAvKipcbiAgICogQW5ndWxhciBoaWRkZW4gcHJvcGVydGllcyBzdGFydCBhbmQgZW5kIHdpdGggJCQsIGZvciB0aGUgc2FrZVxuICAgKiBvZiB0aGUgbGlicmFyeSB0aGVzZSBhcmUgaW52YWxpZCBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGFuZ3VsYXJIaWRkZW5Qcm9wZXJ0eTogZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICByZXR1cm4gcHJvcGVydHkuc2VhcmNoKC9eXFwkXFwkLio/XFwkXFwkJC8pID4gLTE7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRoZSBwcm9wZXJ0aWVzIHRoYXQgaGF2ZSB0aGUgZm9sbG93aW5nIHN5bWJvbHMgYXJlIGZvcmJpZGRlbjpcbiAgICogWzorfiE+PD0vL1xcW1xcXUBcXC4gXVxuICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBzeW1ib2xzOiBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIHJldHVybiBwcm9wZXJ0eS5zZWFyY2goL1s6K34hPjw9Ly9cXF1AXFwuIF0vKSA+IC0xO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzOyJdfQ==
