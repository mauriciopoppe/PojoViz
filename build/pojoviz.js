!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.pojoviz=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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
var util = _dereq_('util/');

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
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
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
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
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

},{"util/":5}],2:[function(_dereq_,module,exports){
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

},{}],3:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

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
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(_dereq_,module,exports){
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

exports.isBuffer = _dereq_('./support/isBuffer');

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
exports.inherits = _dereq_('inherits');

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

}).call(this,_dereq_("FWaASH"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"FWaASH":3,"inherits":2}],"dagre":[function(_dereq_,module,exports){
module.exports=_dereq_('JWa/F1');
},{}],"lodash":[function(_dereq_,module,exports){
module.exports=_dereq_('MicNly');
},{}],"q":[function(_dereq_,module,exports){
module.exports=_dereq_('qLuPo1');
},{}],9:[function(_dereq_,module,exports){
'use strict';

var _ = _dereq_('lodash');
var Inspector = _dereq_('./analyzer/Inspector');
var PObject = _dereq_('./analyzer/Object');
var BuiltIn = _dereq_('./analyzer/BuiltIn');
var Global = _dereq_('./analyzer/Global');
var Angular = _dereq_('./analyzer/Angular');
var libraries;

var proto = {
  /**
   * Creates a new Inspector with `config` as its configuration
   * saved in `this` as `entryPoint`
   * @param {Object} options
   * @chainable
   */
  create: function (options) {
    var displayName = options.displayName || options.entryPoint;
    console.log('creating a generic container for: ' + displayName, options);
    return (libraries[displayName] = new Inspector(options));
  },
  /**
   * Execute `fn` with all the properties saved in `this`
   * @param fn
   */
  all: function (fn) {
    _.forOwn(libraries, fn);
  },
  /**
   * Marks all the properties saved in `this` as dirty
   * @chainable
   */
  setDirty: function () {
    this.all(function (v) {
      v.setDirty();
    });
    return this;
  }
  //setFunctionConstructors: function (newValue) {
  //  this.all(function (v) {
  //    // this only works on the generic analyzers
  //    if (!v._hasfc) {
  //      v.analyzer.setFunctionConstructors(newValue);
  //    }
  //  });
  //  return proto;
  //}
};

libraries = Object.create(proto);
//console.log(libraries);
_.merge(libraries, {
  object: new PObject(),
  builtIn: new BuiltIn(),
  window: new Global(),
  //popular
  angular: new Angular(),
  //mine
  t3: new Inspector({ entryPoint: 't3' }),
  //huge
  three: new Inspector({
    entryPoint: 'THREE',
    alwaysDirty: true
  })
});

Inspector.instances = libraries;

module.exports = libraries;

},{"./analyzer/Angular":11,"./analyzer/BuiltIn":12,"./analyzer/Global":13,"./analyzer/Inspector":14,"./analyzer/Object":15,"lodash":"MicNly"}],10:[function(_dereq_,module,exports){
'use strict';

var _ = _dereq_('lodash');
var assert = _dereq_('assert');

var HashMap = _dereq_('./util/HashMap');
var hashKey = _dereq_('./util/hashKey');
var utils = _dereq_('./util');

/**
 * Given an object `obj`, this function executes `fn` only if `obj` is
 * an object or a function, if it's a function then `obj.prototype` is analyzed
 * if it exists then it will execute `fn` again
 *
 * Note that the only argument which fn is executed with is obj for the first
 * call and obj.prototype for the second call if it's possible
 *
 * @param {Object} obj
 * @param {Function} fn Function to be invoked with obj/obj.prototype according
 * to the rules cited above
 */
function withFunctionAndPrototype(obj, fn) {
  if (utils.isObjectOrFunction(obj)) {
    fn(obj);
    if (utils.isFunction(obj) &&
        utils.isObjectOrFunction(obj.prototype)) {
      fn(obj.prototype);
    }
  }
}

/**
 * @constructor
 *
 * Class Analyzer, saves objects in an internal HashMap after doing
 * a dfs traversal of a source object through its `add` method.
 *
 * Whenever a graph needs to be analyzed an instance of Analyzer is created and
 * a dfs routine is run starting (presumably) in the root node:
 *
 * e.g.
 *
 *      var analyzer = new Analyzer();
 *      analyzer.add([Object]);
 *
 * The internal hashMap will save the following traversable values:
 *
 * - Object
 * - Object.prototype (Reachable from Object)
 * - Function (Reachable from Function.prototype)
 * - Function.prototype (Reachable from Object through the __proto__ link)
 *
 * There are some troublesome structures do which include huge objects like
 * window or document, to avoid analyzing this kind of objects the analyzer can
 * be instructed to forbid the addition of some objects:
 *
 * e.g.
 *
 *      var analyzer = new Analyzer();
 *      analyzer.forbid([Function])
 *      analyzer.add([
 *        Object
 *      ]);
 *
 * - Object
 * - Object.prototype (Reachable from Object)
 * - Function.prototype (Reachable from Object through the __proto__ link)
 *
 * @param {Object} config
 * @param {Object} [config.items = new HashMap]
 * @param {Object} [config.forbidden = new HashMap]
 * @param {Object} [config.cache = true]
 * @param {Object} [config.levels = Analyzer.DFS_LEVELS]
 * @param {Object} [config.visitConstructors = Analyzer.VISIT_CONSTRUCTORS]
 * @param {Object} [config.visitSimpleFunctions = Analyzer.VISIT_SIMPLE_FUNCTIONS]
 */
function Analyzer(config) {
  if (!(this instanceof Analyzer)) {
    return new Analyzer(config);
  }
  config = config || {};

  /**
   * items registered in this instance
   * @type {HashMap}
   */
  this.items = config.items || new HashMap();

  /**
   * Forbidden objects
   * @type {HashMap}
   */
  this.forbidden = config.forbidden || new HashMap();

  /**
   * If the analyzer is dirty then it has some pending work
   * to do
   * @type {boolean}
   */
  this.dirty = true;

  /**
   * Print debug info in the console
   * @type {boolean}
   */
  this.debug = true;

  /**
   * True to save the properties of the objects analyzed in an
   * internal cache
   * @type {Boolean}
   * @cfg {boolean} [cache=true]
   */
  this.cache = typeof config.cache === 'boolean' ?
    config.cache : true;

  /**
   * Dfs levels
   * @type {number}
   */
  this.levels = typeof config.levels === 'number' ?
    config.levels : Analyzer.DFS_LEVELS;

  /**
   * True to include function constructors in the analysis graph
   * i.e. the functions that have a prototype
   * @type {boolean}
   * @cfg {boolean} [visitConstructors=false]
   */
  this.visitConstructors = typeof config.visitConstructors === 'boolean' ?
    config.visitConstructors : Analyzer.VISIT_CONSTRUCTORS;

  /**
   * True to include all the functions in the analysis graph,
   * see #traversableObjectProperties
   * @type {boolean}
   * @cfg {boolean} [visitSimpleFunctions=false]
   */
  this.visitSimpleFunctions = typeof config.visitSimpleFunctions === 'boolean' ?
    config.visitSimpleFunctions : Analyzer.VISIT_SIMPLE_FUNCTIONS;

  /**
   * @private
   * Internal property cache, each value is an array of objects
   * generated in #getProperties
   * @type {Object}
   */
  this.__objectsCache = {};

  /**
   * @private
   * Internal links cache, each value is an array of objects
   * generated in #getOwnLinks
   * @type {Object}
   */
  this.__linksCache = {};
}

/**
 * True to add an additional flag to the traversable properties of a node
 * if the node is a constructor
 * @type {boolean}
 */
Analyzer.VISIT_CONSTRUCTORS = true;

/**
 * True to visit simple functions which don't have additional links, see
 * #traversableObjectProperties
 * @type {boolean}
 */
Analyzer.VISIT_SIMPLE_FUNCTIONS = false;

/**
 * Default number of levels to be analyzed by this constructor
 * @type {number}
 */
Analyzer.DFS_LEVELS = 15;

Analyzer.prototype = {
  constructor: Analyzer,

  /**
   * Checks if an object is in the forbidden hash
   * @param  {Object}  obj
   * @return {boolean}
   */
  isForbidden: function (obj) {
    return this.forbidden.get(obj);
  },

  /**
   * Let `value` be the result of executing obj[property], this method
   * returns an object with a summary of the properties of `value` which are
   * useful to know for the analyzer:
   *
   * - parent         {*} an predecessor of value (an object which can reach value)
   * - property       {string} the name of the property used to reach value,
   *                      i.e. parent[property] = value
   * - value          {*} the value itself
   * - type           {string} the result of calling `typeof value`
   * - isTraversable  {boolean} true if `value` is traversable
   * - isFunction     {boolean} true if `value` is a function
   * - isObject       {boolean} true if `value` is an object
   * - toString       {string} the result of calling {}.toString with `value`
   *
   * @param {Object|Function} value
   * @param {Object|Function} parent
   * @param {string} property
   * @returns {Object}
   */
  buildNodeProperties: function (value, parent, property) {
    return {
      parent: parent,
      property: property,
      value: value,
      type: typeof value,
      isTraversable: utils.isTraversable(value),
      isFunction: utils.isFunction(value),
      isObject: utils.isObject(value),
      toString: utils.internalClassProperty(value)
    };
  },

  /**
   * Determines the properties that obj[property] has which are
   * useful for other methods like #getProperties, the properties are
   * returned in a simple object and are the ones declared in
   * #getNodeProperties
   *
   * The following properties might be set depending on what `value` is:
   *
   * - unreachable        {boolean} true if there was an error executing `value`
   * - isSimpleFunction   {boolean} true if `value` is a simple function
   * - isConstructor      {boolean} true if `value` is a constructor
   *
   * @param obj
   * @param property
   * @returns {Object}
   */
  traversableObjectProperties: function (obj, property) {
    var me = this;
    var value;
    try {
      value = obj[property];
    } catch (e) {
      return {
        parent: obj,
        property: property,
        unreachable: true,
        isTraversable: false
      };
    }
    // self, parent, property
    var properties = me.buildNodeProperties(value, obj, property);

    // if the current property is a function and it's not allowed to
    // visit simple functions mark the property as not traversable
    if (properties.isFunction && !this.visitSimpleFunctions) {
      var ownProperties = Object.getOwnPropertyNames(value);
      var length = ownProperties.length;
      // the minimum number of properties a normal function has is 5
      // - ["length", "name", "arguments", "caller", "prototype"]

      // an additional property retrieved is the hidden key that
      // the hash function may have already set
      if (ownProperties.indexOf(hashKey.hiddenKey) > -1) {
        --length;
      }
      // discard the prototype link to consider a property simple
      if (ownProperties.indexOf('prototype') > -1) {
        --length;
      }
      if (length <= 4) {
        // it's simple if it only has
        // - ["length", "name", "arguments", "caller"]
        properties.isTraversable = false;
        properties.isSimpleFunction = true;
      }
    }

    // if the current property is a function and it's allowed to
    // visit function constructors verify if `value` is a
    // function constructor (it's name must be capitalized to be one)
    if (properties.isFunction && this.visitConstructors) {
      if (typeof value.name === 'string' &&
          value.name.search(/^[A-Z]/) > -1) {
        properties.isTraversable = true;
        properties.isConstructor = true;
      }
    }

    return properties;
  },

  /**
   * Retrieves all the properties of the object `obj`, each property is returned
   * as an object with the properties set in #traversableObjectProperties,
   * additionally this function sets the following properties:
   *
   * - hidden       {boolean} (true if it's a hidden property like [[Prototype]])
   *
   * @param  {Object} obj
   * @param  {boolean} [traversableOnly] True to return only the traversable properties
   * @return {Array} Array of objects with the properties described above
   */
  getProperties: function (obj, traversableOnly) {
    var me = this;
    var hk = hashKey(obj);
    var allProperties;
    var nodeProperties;

    if (!obj) {
      throw 'this method needs an object to analyze';
    }

    if (this.cache) {
      if (!traversableOnly && this.__objectsCache[hk]) {
        return this.__objectsCache[hk];
      }
    }

    // Object.getOwnPropertyNames returns an array of strings
    // with the properties (enumerable or not)
    allProperties = Object.getOwnPropertyNames(obj);

    allProperties = allProperties
      .filter(function (property) {
        // filter out forbidden properties
        return !utils.objectPropertyIsForbidden(obj, property);
      })
      .map(function (property) {
        // obtain detailed info of all the valid properties
        return me.traversableObjectProperties(obj, property);
      })
      .filter(function (propertyDescription) {
        if (traversableOnly) {
          // filter out non traversable properties
          return propertyDescription.isTraversable;
        }
        return true;
      });

    // special properties
    // __proto__
    var proto = Object.getPrototypeOf(obj);
    if (proto) {
      nodeProperties = me.buildNodeProperties(proto, obj, '[[Prototype]]');
      nodeProperties.hidden = true;
      allProperties.push(nodeProperties);
    }

    // constructor (if it's a function)
    //var isConstructor = obj.hasOwnProperty &&
    //  obj.hasOwnProperty('constructor') &&
    //  typeof obj.constructor === 'function';
    //if (isConstructor &&
    //    _.findIndex(allProperties, { property: 'constructor' }) === -1) {
    //  nodeProperties = me.buildNodeProperties();
    //
    //  allProperties.push({
    //    // cls: hashKey(obj),
    //    name: 'constructor',
    //    type: 'function',
    //    linkeable: true
    //  });
    //}

    if (this.cache && !traversableOnly) {
      this.__objectsCache[hk] = allProperties;
    }

    return allProperties;
  },

  /**
   * Main DFS routine, it analyzes each traversable object until
   * the recursion level has been reached or there are no objects
   * to be analyzed
   *
   * - for each object in `objects`
   *  - if it wasn't analyzed yet
   *  - if it's not forbidden
   *   - add the item to the items HashMap
   *   - find all the traversable properties
   *   - call `analyze` object with each traversable object
   *     that can be reached from the current object
   *
   * @param  {Array} objects      Array of objects to be analyzed
   * @param  {number} currentLevel Current dfs level
   */
  analyzeObjects: function (objects, currentLevel) {
    var me = this;
    if (currentLevel <= me.levels) {
      objects.forEach(function (v) {
        if (!me.items.get(v) &&           // registered check
          !me.isForbidden(v)            // forbidden check
        ) {

          // add the item to the registered items pool
          me.items.put(v);

          // dfs to the next level
          me.analyzeObjects(
            // get all the links outgoing from `v`
            me.getOwnLinks(v)
              // to analyze the tree only the `to` property is needed
              .map(function (link) {
                return link.to;
              }),
            currentLevel + 1
          );
        }
      });
    }
  },

  /**
   * Given an traversable object `obj`, this method returns an array of direct traversable
   * object which can be reached from `obj`, each object has the following properties:
   *
   * - from     {object} (`this`)
   * - fromHash {string} (from's hash)
   * - to       {object} (a reachable traversable object from `this`)
   * - toHash   {string} (to's hash)
   * - property {string} (the name of the property which links `from` with `to`, i.e.
   *                      this[property] = to)
   *
   * @param  {Object} obj
   * @return {Array}
   */
  getOwnLinks: function (obj) {
    var me = this;
    var links = [];
    var properties;
    var name = hashKey(obj);

    // <debug>
    //console.log(name);
    // </debug>

    if (me.cache && me.__linksCache[name]) {
      return me.__linksCache[name];
    }

    // args:
    // - object whose properties will be analyzed
    // - traversable properties only
    properties = me.getProperties(obj, true);

    // given an `obj` let's find out if it has a hash or not
    // if it doesn't have a hash then we have to analyze the name of
    // the property which when applied on an external objects gives obj
    //
    // it's not needed to set a hash for `prototype` or `constructor`
    // since the hashKey function takes care of assigning it
    function getAugmentedHash(obj, name) {
      if (!hashKey.has(obj) &&
          name !== 'prototype' &&
          name !== 'constructor') {
        hashKey.createHashKeysFor(obj, name);
      }
      return hashKey(obj);
    }

    if (!name) {
      throw 'the object needs to have a hashkey';
    }

    _.forEach(properties, function (desc) {
      var ref = obj[desc.property];
      // because of the levels a reference might not exist
      if (!ref) {
        return;
      }

      // if the object doesn't have a hashKey
      // let's give it a name equal to the property being analyzed
      getAugmentedHash(ref, desc.property);

      if (!me.isForbidden(ref)) {
        links.push({
          from: obj,
          fromHash: hashKey(obj),
          to: ref,
          toHash: hashKey(ref),
          property: desc.property
        });
      }
    });

    var proto = Object.getPrototypeOf(obj);
    if (proto && !me.isForbidden(proto)) {
      links.push({
        from: obj,
        fromHash: hashKey(obj),
        to: proto,
        toHash: hashKey(proto),
        property: '[[Prototype]]'
      });
    }

    if (this.cache) {
      this.__linksCache[name] = links;
    }

    return links;
  },

  /**
   * Marks this analyzer as dirty
   */
  makeDirty: function () {
    this.dirty = true;
  },

  /**
   * Set the number of levels for the dfs routine
   * @param {number} l
   */
  setLevels: function (l) {
    this.levels = l;
  },

  /**
   * Sets the dirty state of this analyzer
   * @param {boolean} d
   */
  setDirty: function (d) {
    this.dirty = d;
  },

  /**
   * Gets the items stored in this Analyzer
   * @returns {HashMap}
   */
  getItems: function () {
    return this.items;
  },

  /**
   * Alias for #getProperties
   * @param  obj
   * @return {Array}
   */
  stringifyObjectProperties: function (obj) {
    return this.getProperties(obj);
  },

  /**
   * Returns a representation of the outgoing links of
   * an object
   * @return {Object}
   */
  stringifyObjectLinks: function (obj) {
    var me = this;
    return me.getOwnLinks(obj).map(function (link) {
      // discarded: from, to
      return {
        from: link.fromHash,
        to: link.toHash,
        property: link.property
      };
    });
  },

  /**
   * Stringifies the objects saved in this analyzer
   * @return {Object}
   */
  stringify: function () {
    var me = this,
      nodes = {},
      edges = {};
    me.debug && console.time('stringify');
    _.forOwn(me.items, function (v) {
      var hk = hashKey(v);
      nodes[hk] = me.stringifyObjectProperties(v);
      edges[hk] = me.stringifyObjectLinks(v);
    });
    me.debug && console.timeEnd('stringify');
    return {
      nodes: nodes,
      edges: edges
    };
  },

  /**
   * Alias for #analyzeObjects
   * @param {Array} objects
   * @chainable
   */
  add: function (objects) {
    //console.time('analyze');
    this.analyzeObjects(objects, 0);
    //console.timeEnd('analyze');
    return this;
  },

  /**
   * Removes some existing objects from the items HashMap
   * @param {Array} objects
   * @param {boolean} withPrototype True to remove the prototype
   * if the current object being removed is a function
   * @chainable
   */
  remove: function (objects, withPrototype) {
    var me = this;

    function doRemove(obj) {
      me.items.remove(obj);
    }

    objects.forEach(function (obj) {
      if (withPrototype) {
        withFunctionAndPrototype(obj, doRemove);
      } else {
        doRemove(obj);
      }
    });
    return me;
  },

  /**
   * Forbids some objects to be added to the items HashMap
   * @param {Array} objects
   * @param {boolean} withPrototype True to forbid the prototype
   * if the current object being forbidden is a function
   */
  forbid: function (objects, withPrototype) {
    var me = this;
    me.remove(objects, withPrototype);

    function doForbid(obj) {
      me.forbidden.put(obj);
    }
    objects.forEach(function (obj) {
      if (withPrototype) {
        withFunctionAndPrototype(obj, doForbid);
      } else {
        doForbid(obj);
      }
    });
  },

  /**
   * Allows some objects to be added to the items HashMap, call this to
   * remove some existing objects from the forbidden HashMap (so that when
   * the tree is analyzed again)
   * @param {Array} objects
   * @param {boolean} withPrototype True to forbid the prototype
   * if the current object being forbidden is a function
   */
  allow: function (objects, withPrototype) {
    var me = this;

    function doAllow(obj) {
      me.forbidden.remove(obj);
    }
    objects.forEach(function (obj) {
      if (withPrototype) {
        withFunctionAndPrototype(obj, doAllow);
      } else {
        doAllow(obj);
      }
    });
  }
};

var proto = Analyzer.prototype;
function chain(method) {
  proto[method] =
    utils.functionChain()
      .chain(proto.makeDirty)
      .chain(proto[method]);
}

// call #makeDirty before all these methods are called
chain('add');
chain('remove');
chain('forbid');
chain('allow');

module.exports = Analyzer;

},{"./util":19,"./util/HashMap":17,"./util/hashKey":18,"assert":1,"lodash":"MicNly"}],11:[function(_dereq_,module,exports){
'use strict';

var _ = _dereq_('lodash');
var Inspector = _dereq_('./Inspector');
var hashKey = _dereq_('../util/hashKey');

function Angular(config) {
  Inspector.call(this, _.merge({
    entryPoint: 'angular',
    displayName: 'AngularJS',
    alwaysDirty: true,
    additionalForbiddenTokens: 'global:jQuery'
  }, config));

  this.services = [
    '$animate',
    '$cacheFactory',
    '$compile',
    '$controller',
    // '$document',
    '$exceptionHandler',
    '$filter',
    '$http',
    '$httpBackend',
    '$interpolate',
    '$interval',
    '$locale',
    '$log',
    '$parse',
    '$q',
    '$rootScope',
    '$sce',
    '$sceDelegate',
    '$templateCache',
    '$timeout'
    // '$window'
  ].map(function (v) {
    return { checked: true, name: v };
  });
}

Angular.prototype = Object.create(Inspector.prototype);

Angular.prototype.getSelectedServices = function () {
  var me = this,
    toAnalyze = [];

  window.angular.module('app', ['ng']);
  this.injector = window.angular.injector(['app']);

  me.services.forEach(function (s) {
    if (s.checked) {
      var obj = me.injector.get(s.name);
      hashKey.createHashKeysFor(obj, s.name);
      toAnalyze.push(obj);
    }
  });
  return toAnalyze;
};

/**
 * @override
 */
Angular.prototype.inspectSelf = function () {
  var me = this;
  this.debug && console.log('inspecting angular');
  hashKey.createHashKeysFor(window.angular, 'angular');

  // get the objects that need to be forbidden
  var toForbid = me.parseForbiddenTokens();
  this.debug && console.log('forbidding: ', toForbid);
  this.analyzer.forbid(toForbid, true);

  this.analyzer.add(
    [window.angular].concat(this.getSelectedServices())
  );
};

/**
 * @template
 * Since Angular is a script retrieved on demand but the instance
 * is already created in InspectedInstance, let's alter the
 * properties it has before making the request
 */
Angular.prototype.modifyInstance = function (options) {
  this.src = options.src;
};

module.exports = Angular;
},{"../util/hashKey":18,"./Inspector":14,"lodash":"MicNly"}],12:[function(_dereq_,module,exports){
'use strict';

var GenericAnalyzer = _dereq_('./Inspector'),
  utils = _dereq_('../util');

var toInspect = [
  Object, Function,
  Array, Date, Boolean, Number, Math, String, RegExp, JSON,
  Error
];

function BuiltIn(options) {
  GenericAnalyzer.call(this, options);
}

BuiltIn.prototype = Object.create(GenericAnalyzer.prototype);

/**
 * @override
 */
BuiltIn.prototype.inspectSelf = function () {
  this.debug && console.log('inspecting builtIn objects');
  this.analyzer.add(this.getItems());
};

/**
 * @override
 * @returns {Array}
 */
BuiltIn.prototype.getItems = function () {
  return toInspect;
};

BuiltIn.prototype.showSearch = function (nodeName, nodeProperty) {
  var url = 'https://developer.mozilla.org/en-US/search?' +
    utils.toQueryString({
      q: encodeURIComponent(nodeName + ' ' + nodeProperty)
    });
  window.open(url);
};

module.exports = BuiltIn;
},{"../util":19,"./Inspector":14}],13:[function(_dereq_,module,exports){
(function (global){
'use strict';

var _ = _dereq_('lodash');
var hashKey = _dereq_('../util/hashKey');
var Inspector = _dereq_('./Inspector');

var toInspect = [global];

function Global() {
  Inspector.call(this, {
    analyzerConfig: {
      levels: 1
    },
    alwaysDirty: true
  });
}

Global.prototype = Object.create(Inspector.prototype);

Global.prototype.getItems = function () {
  return toInspect;
};

Global.prototype.inspectSelf = function () {
  var me = this;
  this.debug && console.log('inspecting global');
  //var me = this,
  //  hashes = require('../InspectedInstances');
  //
  //_.forOwn(hashes, function (v, k) {
  //  if (v.getItems()) {
  //    me.analyzer.forbid([v.getItems()], true);
  //  }
  //});
  this.analyzer.items.empty();
  this.analyzer.add(me.getItems());
};

module.exports = Global;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../util/hashKey":18,"./Inspector":14,"lodash":"MicNly"}],14:[function(_dereq_,module,exports){
(function (global){
'use strict';

var Q = _dereq_('q');
var _ = _dereq_('lodash');
var util = _dereq_('util');
var assert = _dereq_('assert');
var utils = _dereq_('../util/');
var hashKey = _dereq_('../util/hashKey');
var analyzer = _dereq_('../ObjectAnalyzer');

var searchEngine = 'https://duckduckgo.com/?q=';

/**
 * @constructor
 *
 * Instances of the class inspector decide which objects will be
 * analyzed by the internal analyzer it holds, besides doing that
 * this inspector is able to:
 *
 * - do deferred analysis (analysis on demand)
 * - fetch external scripts in series (the analysis is made
 *   when all the scrips have finished loading)
 * - mark itself as an already inspected instance so that
 *   further inspection calls are not made
 * - receive a configuration to forbid complete graphs from
 *   the analysis step
 *
 * Sample usage:
 *
 * Analysis of a simple object:
 *
 *    var x = {};
 *    var inspector = new Inspector();
 *    inspector
 *      .init()
 *      .then(function () {
 *        // x is ready analyzed at this point!
 *        // objects saved in inspector.analyzer = {x}
 *      })
 *
 * As seen in the code there is a default variable which specifies
 * the objects that will be forbidden, the value is a pipe separated
 * list of commands (see @forbiddenTokens) which is making the
 * inspector avoid the builtIn properties, let's avoid that by making
 * forbiddenTokens null:
 *
 *    var x = {};
 *    var inspector = new Inspector({
 *      forbiddenTokens: null
 *    });
 *    inspector
 *      .init()
 *      .then(function () {
 *        // x is ready analyzed at this point!
 *        // objects saved in inspector.analyzer = {x, Object,
 *          Object.prototype, Function, Function.prototype}
 *      })
 *
 * To execute more complex analysis consider overriding:
 *
 * - inspectSelf
 * - getItems
 *
 * See BuiltIn.js for a basic override of the methods above
 *
 * @param {Object} config
 * @param {string} [config.entryPoint]
 * @param {string} [config.src]
 * @param {string} [config.displayName]
 * @param {string} [config.forbiddenTokens=Inspector.DEFAULT_FORBIDDEN_TOKENS]
 */
function Inspector(config) {
  config = _.merge({
    src: null,
    entryPoint: '',
    displayName: '',
    alwaysDirty: false,
    debug: false,
    forbiddenTokens: Inspector.DEFAULT_FORBIDDEN_TOKENS,
    additionalForbiddenTokens: '',
    analyzerConfig: {}
  }, config);

  /**
   * If provided it'll be used as the starting object from the
   * global object to be analyzed, nested objects can be specified
   * with the dot notation
   * @type {string}
   */
  this.entryPoint = config.entryPoint;

  /**
   * Name to be displayed
   * @type {string}
   */
  this.displayName = config.displayName;

  /**
   * If the inspector needs to fetch external resources use
   * a string separated with the pipe | character, the scripts
   * are loaded in series because one script might need the existence
   * of another before it's fetched
   * @type {string}
   */
  this.src = config.src;

  /**
   * Each token determines which objects will be forbidden
   * when the analyzer is run.
   *
   * Token examples:
   *
   * - pojoviz:{string}
   *   Forbids all the items saved in the {string} instance which
   *   is stored in the InspectedInstances object,
   *   assuming that each is a subclass of `Inspector`
   *
   * e.g.
   *
   *   // forbid all the items found in the builtIn inspector
   *   pojoviz:builtIn
   *
   * - global:{string}
   *   Forbids an object which is in the global object, {string} might
   *   also indicate a nested object using . as a normal property
   *   retrieval
   *
   * e.g.
   *
   *   global:document
   *   global:document.body
   *   global:document.head
   *
   * ForbiddenTokens example:
   *
   *  pojoviz:builtIn|pojoviz:window|global:document
   *
   * @type {Array}
   */
  this.forbiddenTokens = (config.forbiddenTokens || '').split('|').concat(
    (config.additionalForbiddenTokens || '').split('|')
  );

  /**
   * This inspector is initially in a dirty state
   * @type {boolean}
   */
  this.dirty = true;

  /**
   * Print debug info
   * @type {boolean}
   */
  this.debug = config.debug;

  /**
   * To avoid reanalyzing the same structure multiple times a small
   * optimization is to mark the inspector as inspected, to avoid
   * this optimization pass alwaysDirty as true in the options
   * @type {boolean}
   */
  this.alwaysDirty = config.alwaysDirty;

  /**
   * An instance of ObjectAnalyzer which will save all
   * the inspected objects
   * @type {ObjectAnalyzer}
   */
  this.analyzer = analyzer(config.analyzerConfig);
}

/**
 * An object which holds all the inspector instances created
 * (filled in the file InspectedInstances)
 * @type {Object}
 */
Inspector.instances = null;

Inspector.DEFAULT_FORBIDDEN_TOKENS =
  'pojoviz:window|pojoviz:builtIn|global:document';
  //'pojoviz:window|pojoviz:builtIn';

/**
 * Init routine, should be called on demand to initialize the
 * analysis process, it orchestrates the following:
 *
 * - fetching of external resources
 * - inspection of elements if the inspector is in a dirty state
 *
 * @returns {Promise}
 */
Inspector.prototype.init = function () {
  var me = this;
  me.debug && console.log('%cPojoViz', 'font-size: 15px; color: ');
  return me.fetch()
    .then(function () {
      if (me.alwaysDirty || me.dirty) {
        me.inspect();
      }
      return me;
    });
};

/**
 * @template
 *
 * Performs the analysis of an object given an entryPoint, before
 * performing the analysis it identifies which object need to be
 * forbidden (forbiddenTokens)
 *
 * @chainable
 */
Inspector.prototype.inspectSelf = function () {
  var me = this;
  var start = me.findNestedValueInGlobal(me.entryPoint);
  var analyzer = this.analyzer;

  assert(start, 'entry point not found!');
  me.debug && console.log('analyzing global.' + me.entryPoint);

  // set a predefined global name (so that it's known as entryPoint)
  hashKey.createHashKeysFor(start, me.entryPoint);

  // before inspect hook
  me.beforeInspectSelf();

  // get the objects that need to be forbidden
  var toForbid = me.parseForbiddenTokens();
  me.debug && console.log('forbidding: ', toForbid);
  analyzer.forbid(toForbid, true);

  // perform the analysis
  me.debug && console.log('adding: ' + start);
  analyzer.add([start]);

  // after inspect hook
  me.afterInspectSelf();
  return me;
};

/**
 * @template
 * before inspect self hook
 * Cleans the items stored in the analyzer
 */
Inspector.prototype.beforeInspectSelf = function () {
  // clean the analyzer
  this.analyzer.items.empty();
  //this.analyzer.forbidden.empty();
};

/**
 * @template
 * after inspect self hook
 */
Inspector.prototype.afterInspectSelf = function () {
};

/**
 * Parses the forbiddenTokens string and identifies which
 * objects should be forbidden from the analysis phase
 * @returns {Array}
 */
Inspector.prototype.parseForbiddenTokens = function () {
  var me = this;
  var forbidden = [].concat(this.forbiddenTokens);
  var toForbid = [];
  me.debug && console.log('about to forbid: ', forbidden);
  forbidden
    .filter(function (v) { return !!v; })
    .forEach(function(token) {
      var arr = [];
      var tokens;
      if (token.search(/^pojoviz:/) > -1) {
        tokens = token.split(':');

        // if it's a command for the library then make sure it exists
        assert(Inspector.instances[tokens[1]]);
        arr = Inspector.instances[tokens[1]].getItems();
      } else if (token.search(/^global:/) > -1) {
        tokens = token.split(':');
        arr = [me.findNestedValueInGlobal(tokens[1])];
      }

      toForbid = toForbid.concat(arr);
    });
  return toForbid;
};

/**
 * Marks this inspector as dirty
 * @chainable
 */
Inspector.prototype.setDirty = function () {
  this.dirty = true;
  return this;
};

/**
 * Marks this inspector as not dirty (so that further calls
 * to inspect are not made)
 * @chainable
 */
Inspector.prototype.unsetDirty = function () {
  this.dirty = false;
  return this;
};

/**
 * @template
 * Should be called after the instance is created to modify it with
 * additional options
 */
Inspector.prototype.modifyInstance = function (options) {
};

/**
 * @private
 * Performs the inspection on self
 * @chainable
 */
Inspector.prototype.inspect = function () {
  return this
    .unsetDirty()
    .inspectSelf();
};

/**
 * @template
 * Prerender hook
 */
Inspector.prototype.preRender = function () {
};

/**
 * @template
 * Postrender hook
 */
Inspector.prototype.postRender = function () {
};

/**
 * @templates
 * Returns the predefined items that this inspector is in charge of
 * it's useful to determine which objects need to be discarded in
 * #inspectSelf
 */
Inspector.prototype.getItems = function () {
  return [];
};

/**
 * Given a string which have tokens separated by the . symbol
 * this methods checks if it's a valid value under the global object
 *
 * e.g.
 *        'document.body'
 *        returns global.document.body since it's a valid object
 *        under the global object
 *
 * @param nestedConfiguration
 * @returns {*}
 */
Inspector.prototype.findNestedValueInGlobal = function (nestedConfiguration) {
  var tokens = nestedConfiguration.split('.');
  var start = global;
  while (tokens.length) {
    var token = tokens.shift();
    if (!start.hasOwnProperty(token)) {
      this.debug && console.warn('nestedConfig not found!');
      return null;
    }
    start = start[token];
  }
  return start;
};

/**
 * Fetches all the resources required to perform the inspection,
 * (which are saved in `this.src`), returns a promise which is
 * resolved when all the scrips have finished loading
 * @returns {Promise}
 */
Inspector.prototype.fetch = function () {
  var me = this;

  /**
   * Given a string `v` it fetches it an an async way,
   * since this method returns a promise it allows easy chaining
   * see the reduce part below
   * @param v
   * @returns {Function}
   */
  function promisify(v) {
    return function () {
      utils.notification('fetching script ' + v, true);
      var deferred = Q.defer();
      var script = document.createElement('script');
      script.src = v;
      script.onload = function () {
        utils.notification('completed fetching script ' + v, true);
        deferred.resolve(me.findNestedValueInGlobal(me.entryPoint));
      };
      document.head.appendChild(script);
      return deferred.promise;
    };
  }

  if (me.src) {
    if (me.findNestedValueInGlobal(me.entryPoint)) {
      console.log('resource already fetched: ' + me.entryPoint);
    } else {
      var srcs = this.src.split('|');
      return srcs.reduce(function (prev, current) {
        return prev.then(promisify(current));
      }, Q('reduce'));
    }
  }

  return Q.delay(0);
};

Inspector.prototype.showSearch = function (nodeName, nodeProperty) {
  var me = this;
  window.open(
    _.template('${searchEngine}${lucky}${libraryName} ${nodeName} ${nodeProperty}', {
      searchEngine: searchEngine,
      lucky: Inspector.lucky ? '!ducky' : '',
      libraryName: me.displayname || me.global,
      nodeName: nodeName,
      nodeProperty: nodeProperty
    })
  );
};

module.exports = Inspector;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../ObjectAnalyzer":10,"../util/":19,"../util/hashKey":18,"assert":1,"lodash":"MicNly","q":"qLuPo1","util":5}],15:[function(_dereq_,module,exports){
'use strict';
var Inspector = _dereq_('./Inspector');
function PObject(options) {
  Inspector.call(this, options);
}

PObject.prototype = Object.create(Inspector.prototype);

PObject.prototype.inspectSelf = function () {
  this.debug && console.log('inspecting Object objects');
  this.analyzer.add(this.getItems());
  return this;
};

PObject.prototype.getItems = function () {
  return [Object];
};

module.exports = PObject;
},{"./Inspector":14}],16:[function(_dereq_,module,exports){
var _ = _dereq_('lodash');
var Q = _dereq_('q');
var dagre = _dereq_('dagre');
var utils = _dereq_('./util/');
var InspectedInstances = _dereq_('./InspectedInstances');
var assert = _dereq_('assert');

// enable promise chain debug
Q.longStackSupport = true;

var inspector, oldInspector;
var renderer, oldRenderer;
var pojoviz;

/**
 * Given an inspector instance it build the graph and also the
 * layout of the nodes belonging to it, the resulting object is
 * an object which is used by a renderer to be drawn
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
function process(inspector) {
  var g = new dagre.Digraph(),
      node,
      analyzer = inspector.analyzer,
      str = analyzer.stringify(),
      libraryNodes = str.nodes,
      libraryEdges = str.edges;

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
}

/**
 * Draws the current inspector in the canvas with the following steps:
 *
 * - clears the canvas
 * - processes the data of the current inspector
 * - renders the data produced by the method above
 * - notifies the user of any action performed
 *
 */
function render() {
  var data;

  if (inspector === oldInspector) {
    return;
  }

  utils.notification('processing ' + inspector.entryPoint);

  // pre render
  oldRenderer && oldRenderer.clean();
  renderer.clean();

  setTimeout(function () {
    inspector.preRender();
    console.log('process & render start: ', new Date());
    // data:
    // - edges (property -> node)
    // - nodes
    // - center
    console.time('process');
    data = process(inspector);
    console.timeEnd('process');

    utils.notification('rendering ' + inspector.global);

    console.time('render');
    renderer.render(data);
    console.timeEnd('render');

    utils.notification('complete!');
  }, 0);
}

// public api
pojoviz = {
  /**
   * holds a list of all the renderers available, shipped
   * with a d3 and a ThreeJS renderer
   */
  renderers: {},
  /**
   * Adds a renderer to the renderers available
   * @param newRenderers
   */
  addRenderers: function (newRenderers) {
    _.merge(pojoviz.renderers, newRenderers);
  },
  /**
   * Clears the inspector variable
   * @chainable
   */
  unsetInspector: function () {
    oldInspector = inspector;
    inspector = null;
    return this;
  },
  /**
   * Gets the current inspector (set through #setCurrentInspector)
   * @returns {*}
   */
  getCurrentInspector: function () {
    return inspector;
  },
  /**
   * Given an object containing the configuration options of a
   * possible new instance of Inspector, this method checks if there's
   * already an instance with the same displayName/entryPoint to avoid
   * creating more Instances of the same type, calls the hook
   * `modifyInstance` after the inspector is retrieved/created
   *
   * @param {config} options Options passed to an Inspector instance
   * if the entryPoint/displayName wasn't created yet in
   * InspectorInstances
   * @returns {Promise}
   */
  setCurrentInspector: function (options) {
    var entryPoint = options.displayName || options.entryPoint;
    assert(entryPoint);
    oldInspector = inspector;
    inspector = InspectedInstances[entryPoint];

    if (!inspector) {
      inspector = InspectedInstances.create(options);
    //} else {
    //  // required to fetch external resources
    //  inspector.src = options.src;
    }
    inspector.modifyInstance(options);
    return inspector.init();
  },
  /**
   * Updates the value of the current renderer
   * @param r
   */
  setRenderer: function (r) {
    oldRenderer = renderer;
    renderer = pojoviz.renderers[r];
  },
  /**
   * Gets the current renderer
   * @returns {*}
   */
  getRenderer: function () {
    return renderer;
  },
  render: render,

  // expose inner modules
  ObjectAnalyzer: _dereq_('./ObjectAnalyzer'),
  InspectedInstances: _dereq_('./InspectedInstances'),
  analyzer: {
    Inspector: _dereq_('./analyzer/Inspector')
  },
  utils: _dereq_('./util'),
  // used in search to save the downloaded configurations
  userVariables: []
};

// custom events
document.addEventListener('property-click', function (e) {
  var detail = e.detail;
  pojoviz
    .getCurrentInspector()
    .showSearch(detail.name, detail.property);
});

module.exports = pojoviz;
},{"./InspectedInstances":9,"./ObjectAnalyzer":10,"./analyzer/Inspector":14,"./util":19,"./util/":19,"assert":1,"dagre":"JWa/F1","lodash":"MicNly","q":"qLuPo1"}],17:[function(_dereq_,module,exports){
'use strict';

var hashKey = _dereq_('./hashKey');

function HashMap() {
}

HashMap.prototype = {
  put: function (key, value) {
    this[hashKey(key)] = (value || key);
  },
  get: function (key) {
    return this[hashKey(key)];
  },
  remove: function (key) {
    var v = this[hashKey(key)];
    delete this[hashKey(key)];
    return v;
  },
  empty: function () {
    var p,
        me = this;
    for (p in me) {
      if (me.hasOwnProperty(p)) {
        delete this[p];
      }
    }
  }
};

// alias
HashMap.prototype.set = HashMap.prototype.put;

module.exports = HashMap;
},{"./hashKey":18}],18:[function(_dereq_,module,exports){
'use strict';

var _ = _dereq_('lodash');
var assert = _dereq_('assert');
var utils = _dereq_('./');
var me, hashKey;
/**
 * Gets a store hashkey only if it's an object
 * @param  {[type]} obj
 * @return {[type]}
 */
function get(obj) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  return obj.hasOwnProperty &&
    obj.hasOwnProperty(me.hiddenKey) &&
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
  if (!get(obj)) {
    Object.defineProperty(obj, me.hiddenKey, {
      value: typeof obj + '-' + key
    });
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
      console.err('no hashkey :(', v);
    }
    assert(uid, 'error getting the key');
    return uid;
  }

  // v is a primitive
  return typeof v + '-' + uid;
};
me.hiddenKey = '__pojoVizKey__';

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
},{"./":19,"assert":1,"lodash":"MicNly"}],19:[function(_dereq_,module,exports){
'use strict';

var _ = _dereq_('lodash');

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
    return property.search(/[:+~!><=//\[\]@\. ]/) > -1;
  }
};

module.exports = utils;
},{"lodash":"MicNly"}]},{},[16])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvbWF1cmljaW8vRG9jdW1lbnRzL3dlYi9tYXVyaXp6emlvLm1lL3Bvam92aXovbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvVXNlcnMvbWF1cmljaW8vRG9jdW1lbnRzL3dlYi9tYXVyaXp6emlvLm1lL3Bvam92aXovbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvSW5zcGVjdGVkSW5zdGFuY2VzLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9PYmplY3RBbmFseXplci5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvYW5hbHl6ZXIvQW5ndWxhci5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvYW5hbHl6ZXIvQnVpbHRJbi5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvYW5hbHl6ZXIvR2xvYmFsLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9hbmFseXplci9JbnNwZWN0b3IuanMiLCIvVXNlcnMvbWF1cmljaW8vRG9jdW1lbnRzL3dlYi9tYXVyaXp6emlvLm1lL3Bvam92aXovc3JjL2FuYWx5emVyL09iamVjdC5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvaW5kZXguanMiLCIvVXNlcnMvbWF1cmljaW8vRG9jdW1lbnRzL3dlYi9tYXVyaXp6emlvLm1lL3Bvam92aXovc3JjL3V0aWwvSGFzaE1hcC5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvdXRpbC9oYXNoS2V5LmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy91dGlsL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7QUM1a0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzcUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHdoZW4gdXNlZCBpbiBub2RlLCB0aGlzIHdpbGwgYWN0dWFsbHkgbG9hZCB0aGUgdXRpbCBtb2R1bGUgd2UgZGVwZW5kIG9uXG4vLyB2ZXJzdXMgbG9hZGluZyB0aGUgYnVpbHRpbiB1dGlsIG1vZHVsZSBhcyBoYXBwZW5zIG90aGVyd2lzZVxuLy8gdGhpcyBpcyBhIGJ1ZyBpbiBub2RlIG1vZHVsZSBsb2FkaW5nIGFzIGZhciBhcyBJIGFtIGNvbmNlcm5lZFxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xuXG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcblxuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IHN0YWNrU3RhcnRGdW5jdGlvbi5uYW1lO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gcmVwbGFjZXIoa2V5LCB2YWx1ZSkge1xuICBpZiAodXRpbC5pc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJycgKyB2YWx1ZTtcbiAgfVxuICBpZiAodXRpbC5pc051bWJlcih2YWx1ZSkgJiYgKGlzTmFOKHZhbHVlKSB8fCAhaXNGaW5pdGUodmFsdWUpKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIGlmICh1dGlsLmlzRnVuY3Rpb24odmFsdWUpIHx8IHV0aWwuaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh1dGlsLmlzU3RyaW5nKHMpKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5hY3R1YWwsIHJlcGxhY2VyKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuZXhwZWN0ZWQsIHJlcGxhY2VyKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0J1ZmZlcihhY3R1YWwpICYmIHV0aWwuaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgaWYgKGFjdHVhbC5sZW5ndGggIT0gZXhwZWN0ZWQubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdHVhbC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFjdHVhbFtpXSAhPT0gZXhwZWN0ZWRbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoIXV0aWwuaXNPYmplY3QoYWN0dWFsKSAmJiAhdXRpbC5pc09iamVjdChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIpIHtcbiAgaWYgKHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYSkgfHwgdXRpbC5pc051bGxPclVuZGVmaW5lZChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIpO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAgICBrZXksIGk7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh1dGlsLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhY3R1YWwgPSBlO1xuICB9XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoIXNob3VsZFRocm93ICYmIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbZmFsc2VdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB7dGhyb3cgZXJyO319O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiRldhQVNIXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgSW5zcGVjdG9yID0gcmVxdWlyZSgnLi9hbmFseXplci9JbnNwZWN0b3InKTtcbnZhciBQT2JqZWN0ID0gcmVxdWlyZSgnLi9hbmFseXplci9PYmplY3QnKTtcbnZhciBCdWlsdEluID0gcmVxdWlyZSgnLi9hbmFseXplci9CdWlsdEluJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi9hbmFseXplci9HbG9iYWwnKTtcbnZhciBBbmd1bGFyID0gcmVxdWlyZSgnLi9hbmFseXplci9Bbmd1bGFyJyk7XG52YXIgbGlicmFyaWVzO1xuXG52YXIgcHJvdG8gPSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IEluc3BlY3RvciB3aXRoIGBjb25maWdgIGFzIGl0cyBjb25maWd1cmF0aW9uXG4gICAqIHNhdmVkIGluIGB0aGlzYCBhcyBgZW50cnlQb2ludGBcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgY3JlYXRlOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciBkaXNwbGF5TmFtZSA9IG9wdGlvbnMuZGlzcGxheU5hbWUgfHwgb3B0aW9ucy5lbnRyeVBvaW50O1xuICAgIGNvbnNvbGUubG9nKCdjcmVhdGluZyBhIGdlbmVyaWMgY29udGFpbmVyIGZvcjogJyArIGRpc3BsYXlOYW1lLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKGxpYnJhcmllc1tkaXNwbGF5TmFtZV0gPSBuZXcgSW5zcGVjdG9yKG9wdGlvbnMpKTtcbiAgfSxcbiAgLyoqXG4gICAqIEV4ZWN1dGUgYGZuYCB3aXRoIGFsbCB0aGUgcHJvcGVydGllcyBzYXZlZCBpbiBgdGhpc2BcbiAgICogQHBhcmFtIGZuXG4gICAqL1xuICBhbGw6IGZ1bmN0aW9uIChmbikge1xuICAgIF8uZm9yT3duKGxpYnJhcmllcywgZm4pO1xuICB9LFxuICAvKipcbiAgICogTWFya3MgYWxsIHRoZSBwcm9wZXJ0aWVzIHNhdmVkIGluIGB0aGlzYCBhcyBkaXJ0eVxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBzZXREaXJ0eTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYWxsKGZ1bmN0aW9uICh2KSB7XG4gICAgICB2LnNldERpcnR5KCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgLy9zZXRGdW5jdGlvbkNvbnN0cnVjdG9yczogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gIC8vICB0aGlzLmFsbChmdW5jdGlvbiAodikge1xuICAvLyAgICAvLyB0aGlzIG9ubHkgd29ya3Mgb24gdGhlIGdlbmVyaWMgYW5hbHl6ZXJzXG4gIC8vICAgIGlmICghdi5faGFzZmMpIHtcbiAgLy8gICAgICB2LmFuYWx5emVyLnNldEZ1bmN0aW9uQ29uc3RydWN0b3JzKG5ld1ZhbHVlKTtcbiAgLy8gICAgfVxuICAvLyAgfSk7XG4gIC8vICByZXR1cm4gcHJvdG87XG4gIC8vfVxufTtcblxubGlicmFyaWVzID0gT2JqZWN0LmNyZWF0ZShwcm90byk7XG4vL2NvbnNvbGUubG9nKGxpYnJhcmllcyk7XG5fLm1lcmdlKGxpYnJhcmllcywge1xuICBvYmplY3Q6IG5ldyBQT2JqZWN0KCksXG4gIGJ1aWx0SW46IG5ldyBCdWlsdEluKCksXG4gIHdpbmRvdzogbmV3IEdsb2JhbCgpLFxuICAvL3BvcHVsYXJcbiAgYW5ndWxhcjogbmV3IEFuZ3VsYXIoKSxcbiAgLy9taW5lXG4gIHQzOiBuZXcgSW5zcGVjdG9yKHsgZW50cnlQb2ludDogJ3QzJyB9KSxcbiAgLy9odWdlXG4gIHRocmVlOiBuZXcgSW5zcGVjdG9yKHtcbiAgICBlbnRyeVBvaW50OiAnVEhSRUUnLFxuICAgIGFsd2F5c0RpcnR5OiB0cnVlXG4gIH0pXG59KTtcblxuSW5zcGVjdG9yLmluc3RhbmNlcyA9IGxpYnJhcmllcztcblxubW9kdWxlLmV4cG9ydHMgPSBsaWJyYXJpZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG5cbnZhciBIYXNoTWFwID0gcmVxdWlyZSgnLi91dGlsL0hhc2hNYXAnKTtcbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi91dGlsL2hhc2hLZXknKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vKipcbiAqIEdpdmVuIGFuIG9iamVjdCBgb2JqYCwgdGhpcyBmdW5jdGlvbiBleGVjdXRlcyBgZm5gIG9ubHkgaWYgYG9iamAgaXNcbiAqIGFuIG9iamVjdCBvciBhIGZ1bmN0aW9uLCBpZiBpdCdzIGEgZnVuY3Rpb24gdGhlbiBgb2JqLnByb3RvdHlwZWAgaXMgYW5hbHl6ZWRcbiAqIGlmIGl0IGV4aXN0cyB0aGVuIGl0IHdpbGwgZXhlY3V0ZSBgZm5gIGFnYWluXG4gKlxuICogTm90ZSB0aGF0IHRoZSBvbmx5IGFyZ3VtZW50IHdoaWNoIGZuIGlzIGV4ZWN1dGVkIHdpdGggaXMgb2JqIGZvciB0aGUgZmlyc3RcbiAqIGNhbGwgYW5kIG9iai5wcm90b3R5cGUgZm9yIHRoZSBzZWNvbmQgY2FsbCBpZiBpdCdzIHBvc3NpYmxlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gYmUgaW52b2tlZCB3aXRoIG9iai9vYmoucHJvdG90eXBlIGFjY29yZGluZ1xuICogdG8gdGhlIHJ1bGVzIGNpdGVkIGFib3ZlXG4gKi9cbmZ1bmN0aW9uIHdpdGhGdW5jdGlvbkFuZFByb3RvdHlwZShvYmosIGZuKSB7XG4gIGlmICh1dGlscy5pc09iamVjdE9yRnVuY3Rpb24ob2JqKSkge1xuICAgIGZuKG9iaik7XG4gICAgaWYgKHV0aWxzLmlzRnVuY3Rpb24ob2JqKSAmJlxuICAgICAgICB1dGlscy5pc09iamVjdE9yRnVuY3Rpb24ob2JqLnByb3RvdHlwZSkpIHtcbiAgICAgIGZuKG9iai5wcm90b3R5cGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIENsYXNzIEFuYWx5emVyLCBzYXZlcyBvYmplY3RzIGluIGFuIGludGVybmFsIEhhc2hNYXAgYWZ0ZXIgZG9pbmdcbiAqIGEgZGZzIHRyYXZlcnNhbCBvZiBhIHNvdXJjZSBvYmplY3QgdGhyb3VnaCBpdHMgYGFkZGAgbWV0aG9kLlxuICpcbiAqIFdoZW5ldmVyIGEgZ3JhcGggbmVlZHMgdG8gYmUgYW5hbHl6ZWQgYW4gaW5zdGFuY2Ugb2YgQW5hbHl6ZXIgaXMgY3JlYXRlZCBhbmRcbiAqIGEgZGZzIHJvdXRpbmUgaXMgcnVuIHN0YXJ0aW5nIChwcmVzdW1hYmx5KSBpbiB0aGUgcm9vdCBub2RlOlxuICpcbiAqIGUuZy5cbiAqXG4gKiAgICAgIHZhciBhbmFseXplciA9IG5ldyBBbmFseXplcigpO1xuICogICAgICBhbmFseXplci5hZGQoW09iamVjdF0pO1xuICpcbiAqIFRoZSBpbnRlcm5hbCBoYXNoTWFwIHdpbGwgc2F2ZSB0aGUgZm9sbG93aW5nIHRyYXZlcnNhYmxlIHZhbHVlczpcbiAqXG4gKiAtIE9iamVjdFxuICogLSBPYmplY3QucHJvdG90eXBlIChSZWFjaGFibGUgZnJvbSBPYmplY3QpXG4gKiAtIEZ1bmN0aW9uIChSZWFjaGFibGUgZnJvbSBGdW5jdGlvbi5wcm90b3R5cGUpXG4gKiAtIEZ1bmN0aW9uLnByb3RvdHlwZSAoUmVhY2hhYmxlIGZyb20gT2JqZWN0IHRocm91Z2ggdGhlIF9fcHJvdG9fXyBsaW5rKVxuICpcbiAqIFRoZXJlIGFyZSBzb21lIHRyb3VibGVzb21lIHN0cnVjdHVyZXMgZG8gd2hpY2ggaW5jbHVkZSBodWdlIG9iamVjdHMgbGlrZVxuICogd2luZG93IG9yIGRvY3VtZW50LCB0byBhdm9pZCBhbmFseXppbmcgdGhpcyBraW5kIG9mIG9iamVjdHMgdGhlIGFuYWx5emVyIGNhblxuICogYmUgaW5zdHJ1Y3RlZCB0byBmb3JiaWQgdGhlIGFkZGl0aW9uIG9mIHNvbWUgb2JqZWN0czpcbiAqXG4gKiBlLmcuXG4gKlxuICogICAgICB2YXIgYW5hbHl6ZXIgPSBuZXcgQW5hbHl6ZXIoKTtcbiAqICAgICAgYW5hbHl6ZXIuZm9yYmlkKFtGdW5jdGlvbl0pXG4gKiAgICAgIGFuYWx5emVyLmFkZChbXG4gKiAgICAgICAgT2JqZWN0XG4gKiAgICAgIF0pO1xuICpcbiAqIC0gT2JqZWN0XG4gKiAtIE9iamVjdC5wcm90b3R5cGUgKFJlYWNoYWJsZSBmcm9tIE9iamVjdClcbiAqIC0gRnVuY3Rpb24ucHJvdG90eXBlIChSZWFjaGFibGUgZnJvbSBPYmplY3QgdGhyb3VnaCB0aGUgX19wcm90b19fIGxpbmspXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZ1xuICogQHBhcmFtIHtPYmplY3R9IFtjb25maWcuaXRlbXMgPSBuZXcgSGFzaE1hcF1cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnLmZvcmJpZGRlbiA9IG5ldyBIYXNoTWFwXVxuICogQHBhcmFtIHtPYmplY3R9IFtjb25maWcuY2FjaGUgPSB0cnVlXVxuICogQHBhcmFtIHtPYmplY3R9IFtjb25maWcubGV2ZWxzID0gQW5hbHl6ZXIuREZTX0xFVkVMU11cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnLnZpc2l0Q29uc3RydWN0b3JzID0gQW5hbHl6ZXIuVklTSVRfQ09OU1RSVUNUT1JTXVxuICogQHBhcmFtIHtPYmplY3R9IFtjb25maWcudmlzaXRTaW1wbGVGdW5jdGlvbnMgPSBBbmFseXplci5WSVNJVF9TSU1QTEVfRlVOQ1RJT05TXVxuICovXG5mdW5jdGlvbiBBbmFseXplcihjb25maWcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEFuYWx5emVyKSkge1xuICAgIHJldHVybiBuZXcgQW5hbHl6ZXIoY29uZmlnKTtcbiAgfVxuICBjb25maWcgPSBjb25maWcgfHwge307XG5cbiAgLyoqXG4gICAqIGl0ZW1zIHJlZ2lzdGVyZWQgaW4gdGhpcyBpbnN0YW5jZVxuICAgKiBAdHlwZSB7SGFzaE1hcH1cbiAgICovXG4gIHRoaXMuaXRlbXMgPSBjb25maWcuaXRlbXMgfHwgbmV3IEhhc2hNYXAoKTtcblxuICAvKipcbiAgICogRm9yYmlkZGVuIG9iamVjdHNcbiAgICogQHR5cGUge0hhc2hNYXB9XG4gICAqL1xuICB0aGlzLmZvcmJpZGRlbiA9IGNvbmZpZy5mb3JiaWRkZW4gfHwgbmV3IEhhc2hNYXAoKTtcblxuICAvKipcbiAgICogSWYgdGhlIGFuYWx5emVyIGlzIGRpcnR5IHRoZW4gaXQgaGFzIHNvbWUgcGVuZGluZyB3b3JrXG4gICAqIHRvIGRvXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5kaXJ0eSA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFByaW50IGRlYnVnIGluZm8gaW4gdGhlIGNvbnNvbGVcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmRlYnVnID0gdHJ1ZTtcblxuICAvKipcbiAgICogVHJ1ZSB0byBzYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3RzIGFuYWx5emVkIGluIGFuXG4gICAqIGludGVybmFsIGNhY2hlXG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKiBAY2ZnIHtib29sZWFufSBbY2FjaGU9dHJ1ZV1cbiAgICovXG4gIHRoaXMuY2FjaGUgPSB0eXBlb2YgY29uZmlnLmNhY2hlID09PSAnYm9vbGVhbicgP1xuICAgIGNvbmZpZy5jYWNoZSA6IHRydWU7XG5cbiAgLyoqXG4gICAqIERmcyBsZXZlbHNcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIHRoaXMubGV2ZWxzID0gdHlwZW9mIGNvbmZpZy5sZXZlbHMgPT09ICdudW1iZXInID9cbiAgICBjb25maWcubGV2ZWxzIDogQW5hbHl6ZXIuREZTX0xFVkVMUztcblxuICAvKipcbiAgICogVHJ1ZSB0byBpbmNsdWRlIGZ1bmN0aW9uIGNvbnN0cnVjdG9ycyBpbiB0aGUgYW5hbHlzaXMgZ3JhcGhcbiAgICogaS5lLiB0aGUgZnVuY3Rpb25zIHRoYXQgaGF2ZSBhIHByb3RvdHlwZVxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGNmZyB7Ym9vbGVhbn0gW3Zpc2l0Q29uc3RydWN0b3JzPWZhbHNlXVxuICAgKi9cbiAgdGhpcy52aXNpdENvbnN0cnVjdG9ycyA9IHR5cGVvZiBjb25maWcudmlzaXRDb25zdHJ1Y3RvcnMgPT09ICdib29sZWFuJyA/XG4gICAgY29uZmlnLnZpc2l0Q29uc3RydWN0b3JzIDogQW5hbHl6ZXIuVklTSVRfQ09OU1RSVUNUT1JTO1xuXG4gIC8qKlxuICAgKiBUcnVlIHRvIGluY2x1ZGUgYWxsIHRoZSBmdW5jdGlvbnMgaW4gdGhlIGFuYWx5c2lzIGdyYXBoLFxuICAgKiBzZWUgI3RyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllc1xuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGNmZyB7Ym9vbGVhbn0gW3Zpc2l0U2ltcGxlRnVuY3Rpb25zPWZhbHNlXVxuICAgKi9cbiAgdGhpcy52aXNpdFNpbXBsZUZ1bmN0aW9ucyA9IHR5cGVvZiBjb25maWcudmlzaXRTaW1wbGVGdW5jdGlvbnMgPT09ICdib29sZWFuJyA/XG4gICAgY29uZmlnLnZpc2l0U2ltcGxlRnVuY3Rpb25zIDogQW5hbHl6ZXIuVklTSVRfU0lNUExFX0ZVTkNUSU9OUztcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogSW50ZXJuYWwgcHJvcGVydHkgY2FjaGUsIGVhY2ggdmFsdWUgaXMgYW4gYXJyYXkgb2Ygb2JqZWN0c1xuICAgKiBnZW5lcmF0ZWQgaW4gI2dldFByb3BlcnRpZXNcbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHRoaXMuX19vYmplY3RzQ2FjaGUgPSB7fTtcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogSW50ZXJuYWwgbGlua3MgY2FjaGUsIGVhY2ggdmFsdWUgaXMgYW4gYXJyYXkgb2Ygb2JqZWN0c1xuICAgKiBnZW5lcmF0ZWQgaW4gI2dldE93bkxpbmtzXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICB0aGlzLl9fbGlua3NDYWNoZSA9IHt9O1xufVxuXG4vKipcbiAqIFRydWUgdG8gYWRkIGFuIGFkZGl0aW9uYWwgZmxhZyB0byB0aGUgdHJhdmVyc2FibGUgcHJvcGVydGllcyBvZiBhIG5vZGVcbiAqIGlmIHRoZSBub2RlIGlzIGEgY29uc3RydWN0b3JcbiAqIEB0eXBlIHtib29sZWFufVxuICovXG5BbmFseXplci5WSVNJVF9DT05TVFJVQ1RPUlMgPSB0cnVlO1xuXG4vKipcbiAqIFRydWUgdG8gdmlzaXQgc2ltcGxlIGZ1bmN0aW9ucyB3aGljaCBkb24ndCBoYXZlIGFkZGl0aW9uYWwgbGlua3MsIHNlZVxuICogI3RyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllc1xuICogQHR5cGUge2Jvb2xlYW59XG4gKi9cbkFuYWx5emVyLlZJU0lUX1NJTVBMRV9GVU5DVElPTlMgPSBmYWxzZTtcblxuLyoqXG4gKiBEZWZhdWx0IG51bWJlciBvZiBsZXZlbHMgdG8gYmUgYW5hbHl6ZWQgYnkgdGhpcyBjb25zdHJ1Y3RvclxuICogQHR5cGUge251bWJlcn1cbiAqL1xuQW5hbHl6ZXIuREZTX0xFVkVMUyA9IDE1O1xuXG5BbmFseXplci5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBBbmFseXplcixcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGFuIG9iamVjdCBpcyBpbiB0aGUgZm9yYmlkZGVuIGhhc2hcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgb2JqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBpc0ZvcmJpZGRlbjogZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiB0aGlzLmZvcmJpZGRlbi5nZXQob2JqKTtcbiAgfSxcblxuICAvKipcbiAgICogTGV0IGB2YWx1ZWAgYmUgdGhlIHJlc3VsdCBvZiBleGVjdXRpbmcgb2JqW3Byb3BlcnR5XSwgdGhpcyBtZXRob2RcbiAgICogcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBhIHN1bW1hcnkgb2YgdGhlIHByb3BlcnRpZXMgb2YgYHZhbHVlYCB3aGljaCBhcmVcbiAgICogdXNlZnVsIHRvIGtub3cgZm9yIHRoZSBhbmFseXplcjpcbiAgICpcbiAgICogLSBwYXJlbnQgICAgICAgICB7Kn0gYW4gcHJlZGVjZXNzb3Igb2YgdmFsdWUgKGFuIG9iamVjdCB3aGljaCBjYW4gcmVhY2ggdmFsdWUpXG4gICAqIC0gcHJvcGVydHkgICAgICAge3N0cmluZ30gdGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHVzZWQgdG8gcmVhY2ggdmFsdWUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgIGkuZS4gcGFyZW50W3Byb3BlcnR5XSA9IHZhbHVlXG4gICAqIC0gdmFsdWUgICAgICAgICAgeyp9IHRoZSB2YWx1ZSBpdHNlbGZcbiAgICogLSB0eXBlICAgICAgICAgICB7c3RyaW5nfSB0aGUgcmVzdWx0IG9mIGNhbGxpbmcgYHR5cGVvZiB2YWx1ZWBcbiAgICogLSBpc1RyYXZlcnNhYmxlICB7Ym9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIHRyYXZlcnNhYmxlXG4gICAqIC0gaXNGdW5jdGlvbiAgICAge2Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uXG4gICAqIC0gaXNPYmplY3QgICAgICAge2Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3RcbiAgICogLSB0b1N0cmluZyAgICAgICB7c3RyaW5nfSB0aGUgcmVzdWx0IG9mIGNhbGxpbmcge30udG9TdHJpbmcgd2l0aCBgdmFsdWVgXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSB2YWx1ZVxuICAgKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gcGFyZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgYnVpbGROb2RlUHJvcGVydGllczogZnVuY3Rpb24gKHZhbHVlLCBwYXJlbnQsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhcmVudDogcGFyZW50LFxuICAgICAgcHJvcGVydHk6IHByb3BlcnR5LFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgdHlwZTogdHlwZW9mIHZhbHVlLFxuICAgICAgaXNUcmF2ZXJzYWJsZTogdXRpbHMuaXNUcmF2ZXJzYWJsZSh2YWx1ZSksXG4gICAgICBpc0Z1bmN0aW9uOiB1dGlscy5pc0Z1bmN0aW9uKHZhbHVlKSxcbiAgICAgIGlzT2JqZWN0OiB1dGlscy5pc09iamVjdCh2YWx1ZSksXG4gICAgICB0b1N0cmluZzogdXRpbHMuaW50ZXJuYWxDbGFzc1Byb3BlcnR5KHZhbHVlKVxuICAgIH07XG4gIH0sXG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIHByb3BlcnRpZXMgdGhhdCBvYmpbcHJvcGVydHldIGhhcyB3aGljaCBhcmVcbiAgICogdXNlZnVsIGZvciBvdGhlciBtZXRob2RzIGxpa2UgI2dldFByb3BlcnRpZXMsIHRoZSBwcm9wZXJ0aWVzIGFyZVxuICAgKiByZXR1cm5lZCBpbiBhIHNpbXBsZSBvYmplY3QgYW5kIGFyZSB0aGUgb25lcyBkZWNsYXJlZCBpblxuICAgKiAjZ2V0Tm9kZVByb3BlcnRpZXNcbiAgICpcbiAgICogVGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzIG1pZ2h0IGJlIHNldCBkZXBlbmRpbmcgb24gd2hhdCBgdmFsdWVgIGlzOlxuICAgKlxuICAgKiAtIHVucmVhY2hhYmxlICAgICAgICB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgZXhlY3V0aW5nIGB2YWx1ZWBcbiAgICogLSBpc1NpbXBsZUZ1bmN0aW9uICAge2Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhIHNpbXBsZSBmdW5jdGlvblxuICAgKiAtIGlzQ29uc3RydWN0b3IgICAgICB7Ym9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGEgY29uc3RydWN0b3JcbiAgICpcbiAgICogQHBhcmFtIG9ialxuICAgKiBAcGFyYW0gcHJvcGVydHlcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIHRyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllczogZnVuY3Rpb24gKG9iaiwgcHJvcGVydHkpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHZhciB2YWx1ZTtcbiAgICB0cnkge1xuICAgICAgdmFsdWUgPSBvYmpbcHJvcGVydHldO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBhcmVudDogb2JqLFxuICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHksXG4gICAgICAgIHVucmVhY2hhYmxlOiB0cnVlLFxuICAgICAgICBpc1RyYXZlcnNhYmxlOiBmYWxzZVxuICAgICAgfTtcbiAgICB9XG4gICAgLy8gc2VsZiwgcGFyZW50LCBwcm9wZXJ0eVxuICAgIHZhciBwcm9wZXJ0aWVzID0gbWUuYnVpbGROb2RlUHJvcGVydGllcyh2YWx1ZSwgb2JqLCBwcm9wZXJ0eSk7XG5cbiAgICAvLyBpZiB0aGUgY3VycmVudCBwcm9wZXJ0eSBpcyBhIGZ1bmN0aW9uIGFuZCBpdCdzIG5vdCBhbGxvd2VkIHRvXG4gICAgLy8gdmlzaXQgc2ltcGxlIGZ1bmN0aW9ucyBtYXJrIHRoZSBwcm9wZXJ0eSBhcyBub3QgdHJhdmVyc2FibGVcbiAgICBpZiAocHJvcGVydGllcy5pc0Z1bmN0aW9uICYmICF0aGlzLnZpc2l0U2ltcGxlRnVuY3Rpb25zKSB7XG4gICAgICB2YXIgb3duUHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgICAgIHZhciBsZW5ndGggPSBvd25Qcm9wZXJ0aWVzLmxlbmd0aDtcbiAgICAgIC8vIHRoZSBtaW5pbXVtIG51bWJlciBvZiBwcm9wZXJ0aWVzIGEgbm9ybWFsIGZ1bmN0aW9uIGhhcyBpcyA1XG4gICAgICAvLyAtIFtcImxlbmd0aFwiLCBcIm5hbWVcIiwgXCJhcmd1bWVudHNcIiwgXCJjYWxsZXJcIiwgXCJwcm90b3R5cGVcIl1cblxuICAgICAgLy8gYW4gYWRkaXRpb25hbCBwcm9wZXJ0eSByZXRyaWV2ZWQgaXMgdGhlIGhpZGRlbiBrZXkgdGhhdFxuICAgICAgLy8gdGhlIGhhc2ggZnVuY3Rpb24gbWF5IGhhdmUgYWxyZWFkeSBzZXRcbiAgICAgIGlmIChvd25Qcm9wZXJ0aWVzLmluZGV4T2YoaGFzaEtleS5oaWRkZW5LZXkpID4gLTEpIHtcbiAgICAgICAgLS1sZW5ndGg7XG4gICAgICB9XG4gICAgICAvLyBkaXNjYXJkIHRoZSBwcm90b3R5cGUgbGluayB0byBjb25zaWRlciBhIHByb3BlcnR5IHNpbXBsZVxuICAgICAgaWYgKG93blByb3BlcnRpZXMuaW5kZXhPZigncHJvdG90eXBlJykgPiAtMSkge1xuICAgICAgICAtLWxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChsZW5ndGggPD0gNCkge1xuICAgICAgICAvLyBpdCdzIHNpbXBsZSBpZiBpdCBvbmx5IGhhc1xuICAgICAgICAvLyAtIFtcImxlbmd0aFwiLCBcIm5hbWVcIiwgXCJhcmd1bWVudHNcIiwgXCJjYWxsZXJcIl1cbiAgICAgICAgcHJvcGVydGllcy5pc1RyYXZlcnNhYmxlID0gZmFsc2U7XG4gICAgICAgIHByb3BlcnRpZXMuaXNTaW1wbGVGdW5jdGlvbiA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaWYgdGhlIGN1cnJlbnQgcHJvcGVydHkgaXMgYSBmdW5jdGlvbiBhbmQgaXQncyBhbGxvd2VkIHRvXG4gICAgLy8gdmlzaXQgZnVuY3Rpb24gY29uc3RydWN0b3JzIHZlcmlmeSBpZiBgdmFsdWVgIGlzIGFcbiAgICAvLyBmdW5jdGlvbiBjb25zdHJ1Y3RvciAoaXQncyBuYW1lIG11c3QgYmUgY2FwaXRhbGl6ZWQgdG8gYmUgb25lKVxuICAgIGlmIChwcm9wZXJ0aWVzLmlzRnVuY3Rpb24gJiYgdGhpcy52aXNpdENvbnN0cnVjdG9ycykge1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZS5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgIHZhbHVlLm5hbWUuc2VhcmNoKC9eW0EtWl0vKSA+IC0xKSB7XG4gICAgICAgIHByb3BlcnRpZXMuaXNUcmF2ZXJzYWJsZSA9IHRydWU7XG4gICAgICAgIHByb3BlcnRpZXMuaXNDb25zdHJ1Y3RvciA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbGwgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdCBgb2JqYCwgZWFjaCBwcm9wZXJ0eSBpcyByZXR1cm5lZFxuICAgKiBhcyBhbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBzZXQgaW4gI3RyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllcyxcbiAgICogYWRkaXRpb25hbGx5IHRoaXMgZnVuY3Rpb24gc2V0cyB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAqXG4gICAqIC0gaGlkZGVuICAgICAgIHtib29sZWFufSAodHJ1ZSBpZiBpdCdzIGEgaGlkZGVuIHByb3BlcnR5IGxpa2UgW1tQcm90b3R5cGVdXSlcbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSBvYmpcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gW3RyYXZlcnNhYmxlT25seV0gVHJ1ZSB0byByZXR1cm4gb25seSB0aGUgdHJhdmVyc2FibGUgcHJvcGVydGllc1xuICAgKiBAcmV0dXJuIHtBcnJheX0gQXJyYXkgb2Ygb2JqZWN0cyB3aXRoIHRoZSBwcm9wZXJ0aWVzIGRlc2NyaWJlZCBhYm92ZVxuICAgKi9cbiAgZ2V0UHJvcGVydGllczogZnVuY3Rpb24gKG9iaiwgdHJhdmVyc2FibGVPbmx5KSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICB2YXIgaGsgPSBoYXNoS2V5KG9iaik7XG4gICAgdmFyIGFsbFByb3BlcnRpZXM7XG4gICAgdmFyIG5vZGVQcm9wZXJ0aWVzO1xuXG4gICAgaWYgKCFvYmopIHtcbiAgICAgIHRocm93ICd0aGlzIG1ldGhvZCBuZWVkcyBhbiBvYmplY3QgdG8gYW5hbHl6ZSc7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2FjaGUpIHtcbiAgICAgIGlmICghdHJhdmVyc2FibGVPbmx5ICYmIHRoaXMuX19vYmplY3RzQ2FjaGVbaGtdKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fb2JqZWN0c0NhY2hlW2hrXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyByZXR1cm5zIGFuIGFycmF5IG9mIHN0cmluZ3NcbiAgICAvLyB3aXRoIHRoZSBwcm9wZXJ0aWVzIChlbnVtZXJhYmxlIG9yIG5vdClcbiAgICBhbGxQcm9wZXJ0aWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKTtcblxuICAgIGFsbFByb3BlcnRpZXMgPSBhbGxQcm9wZXJ0aWVzXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAvLyBmaWx0ZXIgb3V0IGZvcmJpZGRlbiBwcm9wZXJ0aWVzXG4gICAgICAgIHJldHVybiAhdXRpbHMub2JqZWN0UHJvcGVydHlJc0ZvcmJpZGRlbihvYmosIHByb3BlcnR5KTtcbiAgICAgIH0pXG4gICAgICAubWFwKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAvLyBvYnRhaW4gZGV0YWlsZWQgaW5mbyBvZiBhbGwgdGhlIHZhbGlkIHByb3BlcnRpZXNcbiAgICAgICAgcmV0dXJuIG1lLnRyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllcyhvYmosIHByb3BlcnR5KTtcbiAgICAgIH0pXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChwcm9wZXJ0eURlc2NyaXB0aW9uKSB7XG4gICAgICAgIGlmICh0cmF2ZXJzYWJsZU9ubHkpIHtcbiAgICAgICAgICAvLyBmaWx0ZXIgb3V0IG5vbiB0cmF2ZXJzYWJsZSBwcm9wZXJ0aWVzXG4gICAgICAgICAgcmV0dXJuIHByb3BlcnR5RGVzY3JpcHRpb24uaXNUcmF2ZXJzYWJsZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgLy8gc3BlY2lhbCBwcm9wZXJ0aWVzXG4gICAgLy8gX19wcm90b19fXG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgaWYgKHByb3RvKSB7XG4gICAgICBub2RlUHJvcGVydGllcyA9IG1lLmJ1aWxkTm9kZVByb3BlcnRpZXMocHJvdG8sIG9iaiwgJ1tbUHJvdG90eXBlXV0nKTtcbiAgICAgIG5vZGVQcm9wZXJ0aWVzLmhpZGRlbiA9IHRydWU7XG4gICAgICBhbGxQcm9wZXJ0aWVzLnB1c2gobm9kZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIC8vIGNvbnN0cnVjdG9yIChpZiBpdCdzIGEgZnVuY3Rpb24pXG4gICAgLy92YXIgaXNDb25zdHJ1Y3RvciA9IG9iai5oYXNPd25Qcm9wZXJ0eSAmJlxuICAgIC8vICBvYmouaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgJiZcbiAgICAvLyAgdHlwZW9mIG9iai5jb25zdHJ1Y3RvciA9PT0gJ2Z1bmN0aW9uJztcbiAgICAvL2lmIChpc0NvbnN0cnVjdG9yICYmXG4gICAgLy8gICAgXy5maW5kSW5kZXgoYWxsUHJvcGVydGllcywgeyBwcm9wZXJ0eTogJ2NvbnN0cnVjdG9yJyB9KSA9PT0gLTEpIHtcbiAgICAvLyAgbm9kZVByb3BlcnRpZXMgPSBtZS5idWlsZE5vZGVQcm9wZXJ0aWVzKCk7XG4gICAgLy9cbiAgICAvLyAgYWxsUHJvcGVydGllcy5wdXNoKHtcbiAgICAvLyAgICAvLyBjbHM6IGhhc2hLZXkob2JqKSxcbiAgICAvLyAgICBuYW1lOiAnY29uc3RydWN0b3InLFxuICAgIC8vICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgLy8gICAgbGlua2VhYmxlOiB0cnVlXG4gICAgLy8gIH0pO1xuICAgIC8vfVxuXG4gICAgaWYgKHRoaXMuY2FjaGUgJiYgIXRyYXZlcnNhYmxlT25seSkge1xuICAgICAgdGhpcy5fX29iamVjdHNDYWNoZVtoa10gPSBhbGxQcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIHJldHVybiBhbGxQcm9wZXJ0aWVzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBNYWluIERGUyByb3V0aW5lLCBpdCBhbmFseXplcyBlYWNoIHRyYXZlcnNhYmxlIG9iamVjdCB1bnRpbFxuICAgKiB0aGUgcmVjdXJzaW9uIGxldmVsIGhhcyBiZWVuIHJlYWNoZWQgb3IgdGhlcmUgYXJlIG5vIG9iamVjdHNcbiAgICogdG8gYmUgYW5hbHl6ZWRcbiAgICpcbiAgICogLSBmb3IgZWFjaCBvYmplY3QgaW4gYG9iamVjdHNgXG4gICAqICAtIGlmIGl0IHdhc24ndCBhbmFseXplZCB5ZXRcbiAgICogIC0gaWYgaXQncyBub3QgZm9yYmlkZGVuXG4gICAqICAgLSBhZGQgdGhlIGl0ZW0gdG8gdGhlIGl0ZW1zIEhhc2hNYXBcbiAgICogICAtIGZpbmQgYWxsIHRoZSB0cmF2ZXJzYWJsZSBwcm9wZXJ0aWVzXG4gICAqICAgLSBjYWxsIGBhbmFseXplYCBvYmplY3Qgd2l0aCBlYWNoIHRyYXZlcnNhYmxlIG9iamVjdFxuICAgKiAgICAgdGhhdCBjYW4gYmUgcmVhY2hlZCBmcm9tIHRoZSBjdXJyZW50IG9iamVjdFxuICAgKlxuICAgKiBAcGFyYW0gIHtBcnJheX0gb2JqZWN0cyAgICAgIEFycmF5IG9mIG9iamVjdHMgdG8gYmUgYW5hbHl6ZWRcbiAgICogQHBhcmFtICB7bnVtYmVyfSBjdXJyZW50TGV2ZWwgQ3VycmVudCBkZnMgbGV2ZWxcbiAgICovXG4gIGFuYWx5emVPYmplY3RzOiBmdW5jdGlvbiAob2JqZWN0cywgY3VycmVudExldmVsKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICBpZiAoY3VycmVudExldmVsIDw9IG1lLmxldmVscykge1xuICAgICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIGlmICghbWUuaXRlbXMuZ2V0KHYpICYmICAgICAgICAgICAvLyByZWdpc3RlcmVkIGNoZWNrXG4gICAgICAgICAgIW1lLmlzRm9yYmlkZGVuKHYpICAgICAgICAgICAgLy8gZm9yYmlkZGVuIGNoZWNrXG4gICAgICAgICkge1xuXG4gICAgICAgICAgLy8gYWRkIHRoZSBpdGVtIHRvIHRoZSByZWdpc3RlcmVkIGl0ZW1zIHBvb2xcbiAgICAgICAgICBtZS5pdGVtcy5wdXQodik7XG5cbiAgICAgICAgICAvLyBkZnMgdG8gdGhlIG5leHQgbGV2ZWxcbiAgICAgICAgICBtZS5hbmFseXplT2JqZWN0cyhcbiAgICAgICAgICAgIC8vIGdldCBhbGwgdGhlIGxpbmtzIG91dGdvaW5nIGZyb20gYHZgXG4gICAgICAgICAgICBtZS5nZXRPd25MaW5rcyh2KVxuICAgICAgICAgICAgICAvLyB0byBhbmFseXplIHRoZSB0cmVlIG9ubHkgdGhlIGB0b2AgcHJvcGVydHkgaXMgbmVlZGVkXG4gICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGluay50bztcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjdXJyZW50TGV2ZWwgKyAxXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBHaXZlbiBhbiB0cmF2ZXJzYWJsZSBvYmplY3QgYG9iamAsIHRoaXMgbWV0aG9kIHJldHVybnMgYW4gYXJyYXkgb2YgZGlyZWN0IHRyYXZlcnNhYmxlXG4gICAqIG9iamVjdCB3aGljaCBjYW4gYmUgcmVhY2hlZCBmcm9tIGBvYmpgLCBlYWNoIG9iamVjdCBoYXMgdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgKlxuICAgKiAtIGZyb20gICAgIHtvYmplY3R9IChgdGhpc2ApXG4gICAqIC0gZnJvbUhhc2gge3N0cmluZ30gKGZyb20ncyBoYXNoKVxuICAgKiAtIHRvICAgICAgIHtvYmplY3R9IChhIHJlYWNoYWJsZSB0cmF2ZXJzYWJsZSBvYmplY3QgZnJvbSBgdGhpc2ApXG4gICAqIC0gdG9IYXNoICAge3N0cmluZ30gKHRvJ3MgaGFzaClcbiAgICogLSBwcm9wZXJ0eSB7c3RyaW5nfSAodGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHdoaWNoIGxpbmtzIGBmcm9tYCB3aXRoIGB0b2AsIGkuZS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eV0gPSB0bylcbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSBvYmpcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBnZXRPd25MaW5rczogZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdmFyIGxpbmtzID0gW107XG4gICAgdmFyIHByb3BlcnRpZXM7XG4gICAgdmFyIG5hbWUgPSBoYXNoS2V5KG9iaik7XG5cbiAgICAvLyA8ZGVidWc+XG4gICAgLy9jb25zb2xlLmxvZyhuYW1lKTtcbiAgICAvLyA8L2RlYnVnPlxuXG4gICAgaWYgKG1lLmNhY2hlICYmIG1lLl9fbGlua3NDYWNoZVtuYW1lXSkge1xuICAgICAgcmV0dXJuIG1lLl9fbGlua3NDYWNoZVtuYW1lXTtcbiAgICB9XG5cbiAgICAvLyBhcmdzOlxuICAgIC8vIC0gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgd2lsbCBiZSBhbmFseXplZFxuICAgIC8vIC0gdHJhdmVyc2FibGUgcHJvcGVydGllcyBvbmx5XG4gICAgcHJvcGVydGllcyA9IG1lLmdldFByb3BlcnRpZXMob2JqLCB0cnVlKTtcblxuICAgIC8vIGdpdmVuIGFuIGBvYmpgIGxldCdzIGZpbmQgb3V0IGlmIGl0IGhhcyBhIGhhc2ggb3Igbm90XG4gICAgLy8gaWYgaXQgZG9lc24ndCBoYXZlIGEgaGFzaCB0aGVuIHdlIGhhdmUgdG8gYW5hbHl6ZSB0aGUgbmFtZSBvZlxuICAgIC8vIHRoZSBwcm9wZXJ0eSB3aGljaCB3aGVuIGFwcGxpZWQgb24gYW4gZXh0ZXJuYWwgb2JqZWN0cyBnaXZlcyBvYmpcbiAgICAvL1xuICAgIC8vIGl0J3Mgbm90IG5lZWRlZCB0byBzZXQgYSBoYXNoIGZvciBgcHJvdG90eXBlYCBvciBgY29uc3RydWN0b3JgXG4gICAgLy8gc2luY2UgdGhlIGhhc2hLZXkgZnVuY3Rpb24gdGFrZXMgY2FyZSBvZiBhc3NpZ25pbmcgaXRcbiAgICBmdW5jdGlvbiBnZXRBdWdtZW50ZWRIYXNoKG9iaiwgbmFtZSkge1xuICAgICAgaWYgKCFoYXNoS2V5LmhhcyhvYmopICYmXG4gICAgICAgICAgbmFtZSAhPT0gJ3Byb3RvdHlwZScgJiZcbiAgICAgICAgICBuYW1lICE9PSAnY29uc3RydWN0b3InKSB7XG4gICAgICAgIGhhc2hLZXkuY3JlYXRlSGFzaEtleXNGb3Iob2JqLCBuYW1lKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYXNoS2V5KG9iaik7XG4gICAgfVxuXG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB0aHJvdyAndGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIGEgaGFzaGtleSc7XG4gICAgfVxuXG4gICAgXy5mb3JFYWNoKHByb3BlcnRpZXMsIGZ1bmN0aW9uIChkZXNjKSB7XG4gICAgICB2YXIgcmVmID0gb2JqW2Rlc2MucHJvcGVydHldO1xuICAgICAgLy8gYmVjYXVzZSBvZiB0aGUgbGV2ZWxzIGEgcmVmZXJlbmNlIG1pZ2h0IG5vdCBleGlzdFxuICAgICAgaWYgKCFyZWYpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGUgb2JqZWN0IGRvZXNuJ3QgaGF2ZSBhIGhhc2hLZXlcbiAgICAgIC8vIGxldCdzIGdpdmUgaXQgYSBuYW1lIGVxdWFsIHRvIHRoZSBwcm9wZXJ0eSBiZWluZyBhbmFseXplZFxuICAgICAgZ2V0QXVnbWVudGVkSGFzaChyZWYsIGRlc2MucHJvcGVydHkpO1xuXG4gICAgICBpZiAoIW1lLmlzRm9yYmlkZGVuKHJlZikpIHtcbiAgICAgICAgbGlua3MucHVzaCh7XG4gICAgICAgICAgZnJvbTogb2JqLFxuICAgICAgICAgIGZyb21IYXNoOiBoYXNoS2V5KG9iaiksXG4gICAgICAgICAgdG86IHJlZixcbiAgICAgICAgICB0b0hhc2g6IGhhc2hLZXkocmVmKSxcbiAgICAgICAgICBwcm9wZXJ0eTogZGVzYy5wcm9wZXJ0eVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopO1xuICAgIGlmIChwcm90byAmJiAhbWUuaXNGb3JiaWRkZW4ocHJvdG8pKSB7XG4gICAgICBsaW5rcy5wdXNoKHtcbiAgICAgICAgZnJvbTogb2JqLFxuICAgICAgICBmcm9tSGFzaDogaGFzaEtleShvYmopLFxuICAgICAgICB0bzogcHJvdG8sXG4gICAgICAgIHRvSGFzaDogaGFzaEtleShwcm90byksXG4gICAgICAgIHByb3BlcnR5OiAnW1tQcm90b3R5cGVdXSdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNhY2hlKSB7XG4gICAgICB0aGlzLl9fbGlua3NDYWNoZVtuYW1lXSA9IGxpbmtzO1xuICAgIH1cblxuICAgIHJldHVybiBsaW5rcztcbiAgfSxcblxuICAvKipcbiAgICogTWFya3MgdGhpcyBhbmFseXplciBhcyBkaXJ0eVxuICAgKi9cbiAgbWFrZURpcnR5OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldCB0aGUgbnVtYmVyIG9mIGxldmVscyBmb3IgdGhlIGRmcyByb3V0aW5lXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsXG4gICAqL1xuICBzZXRMZXZlbHM6IGZ1bmN0aW9uIChsKSB7XG4gICAgdGhpcy5sZXZlbHMgPSBsO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXJ0eSBzdGF0ZSBvZiB0aGlzIGFuYWx5emVyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZFxuICAgKi9cbiAgc2V0RGlydHk6IGZ1bmN0aW9uIChkKSB7XG4gICAgdGhpcy5kaXJ0eSA9IGQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGl0ZW1zIHN0b3JlZCBpbiB0aGlzIEFuYWx5emVyXG4gICAqIEByZXR1cm5zIHtIYXNoTWFwfVxuICAgKi9cbiAgZ2V0SXRlbXM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pdGVtcztcbiAgfSxcblxuICAvKipcbiAgICogQWxpYXMgZm9yICNnZXRQcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSAgb2JqXG4gICAqIEByZXR1cm4ge0FycmF5fVxuICAgKi9cbiAgc3RyaW5naWZ5T2JqZWN0UHJvcGVydGllczogZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiB0aGlzLmdldFByb3BlcnRpZXMob2JqKTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBvdXRnb2luZyBsaW5rcyBvZlxuICAgKiBhbiBvYmplY3RcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgc3RyaW5naWZ5T2JqZWN0TGlua3M6IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHJldHVybiBtZS5nZXRPd25MaW5rcyhvYmopLm1hcChmdW5jdGlvbiAobGluaykge1xuICAgICAgLy8gZGlzY2FyZGVkOiBmcm9tLCB0b1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZnJvbTogbGluay5mcm9tSGFzaCxcbiAgICAgICAgdG86IGxpbmsudG9IYXNoLFxuICAgICAgICBwcm9wZXJ0eTogbGluay5wcm9wZXJ0eVxuICAgICAgfTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogU3RyaW5naWZpZXMgdGhlIG9iamVjdHMgc2F2ZWQgaW4gdGhpcyBhbmFseXplclxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuICBzdHJpbmdpZnk6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgbm9kZXMgPSB7fSxcbiAgICAgIGVkZ2VzID0ge307XG4gICAgbWUuZGVidWcgJiYgY29uc29sZS50aW1lKCdzdHJpbmdpZnknKTtcbiAgICBfLmZvck93bihtZS5pdGVtcywgZnVuY3Rpb24gKHYpIHtcbiAgICAgIHZhciBoayA9IGhhc2hLZXkodik7XG4gICAgICBub2Rlc1toa10gPSBtZS5zdHJpbmdpZnlPYmplY3RQcm9wZXJ0aWVzKHYpO1xuICAgICAgZWRnZXNbaGtdID0gbWUuc3RyaW5naWZ5T2JqZWN0TGlua3Modik7XG4gICAgfSk7XG4gICAgbWUuZGVidWcgJiYgY29uc29sZS50aW1lRW5kKCdzdHJpbmdpZnknKTtcbiAgICByZXR1cm4ge1xuICAgICAgbm9kZXM6IG5vZGVzLFxuICAgICAgZWRnZXM6IGVkZ2VzXG4gICAgfTtcbiAgfSxcblxuICAvKipcbiAgICogQWxpYXMgZm9yICNhbmFseXplT2JqZWN0c1xuICAgKiBAcGFyYW0ge0FycmF5fSBvYmplY3RzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGFkZDogZnVuY3Rpb24gKG9iamVjdHMpIHtcbiAgICAvL2NvbnNvbGUudGltZSgnYW5hbHl6ZScpO1xuICAgIHRoaXMuYW5hbHl6ZU9iamVjdHMob2JqZWN0cywgMCk7XG4gICAgLy9jb25zb2xlLnRpbWVFbmQoJ2FuYWx5emUnKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlcyBzb21lIGV4aXN0aW5nIG9iamVjdHMgZnJvbSB0aGUgaXRlbXMgSGFzaE1hcFxuICAgKiBAcGFyYW0ge0FycmF5fSBvYmplY3RzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gd2l0aFByb3RvdHlwZSBUcnVlIHRvIHJlbW92ZSB0aGUgcHJvdG90eXBlXG4gICAqIGlmIHRoZSBjdXJyZW50IG9iamVjdCBiZWluZyByZW1vdmVkIGlzIGEgZnVuY3Rpb25cbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgcmVtb3ZlOiBmdW5jdGlvbiAob2JqZWN0cywgd2l0aFByb3RvdHlwZSkge1xuICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBkb1JlbW92ZShvYmopIHtcbiAgICAgIG1lLml0ZW1zLnJlbW92ZShvYmopO1xuICAgIH1cblxuICAgIG9iamVjdHMuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgICBpZiAod2l0aFByb3RvdHlwZSkge1xuICAgICAgICB3aXRoRnVuY3Rpb25BbmRQcm90b3R5cGUob2JqLCBkb1JlbW92ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb1JlbW92ZShvYmopO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBtZTtcbiAgfSxcblxuICAvKipcbiAgICogRm9yYmlkcyBzb21lIG9iamVjdHMgdG8gYmUgYWRkZWQgdG8gdGhlIGl0ZW1zIEhhc2hNYXBcbiAgICogQHBhcmFtIHtBcnJheX0gb2JqZWN0c1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHdpdGhQcm90b3R5cGUgVHJ1ZSB0byBmb3JiaWQgdGhlIHByb3RvdHlwZVxuICAgKiBpZiB0aGUgY3VycmVudCBvYmplY3QgYmVpbmcgZm9yYmlkZGVuIGlzIGEgZnVuY3Rpb25cbiAgICovXG4gIGZvcmJpZDogZnVuY3Rpb24gKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIG1lLnJlbW92ZShvYmplY3RzLCB3aXRoUHJvdG90eXBlKTtcblxuICAgIGZ1bmN0aW9uIGRvRm9yYmlkKG9iaikge1xuICAgICAgbWUuZm9yYmlkZGVuLnB1dChvYmopO1xuICAgIH1cbiAgICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgICAgaWYgKHdpdGhQcm90b3R5cGUpIHtcbiAgICAgICAgd2l0aEZ1bmN0aW9uQW5kUHJvdG90eXBlKG9iaiwgZG9Gb3JiaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9Gb3JiaWQob2JqKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogQWxsb3dzIHNvbWUgb2JqZWN0cyB0byBiZSBhZGRlZCB0byB0aGUgaXRlbXMgSGFzaE1hcCwgY2FsbCB0aGlzIHRvXG4gICAqIHJlbW92ZSBzb21lIGV4aXN0aW5nIG9iamVjdHMgZnJvbSB0aGUgZm9yYmlkZGVuIEhhc2hNYXAgKHNvIHRoYXQgd2hlblxuICAgKiB0aGUgdHJlZSBpcyBhbmFseXplZCBhZ2FpbilcbiAgICogQHBhcmFtIHtBcnJheX0gb2JqZWN0c1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHdpdGhQcm90b3R5cGUgVHJ1ZSB0byBmb3JiaWQgdGhlIHByb3RvdHlwZVxuICAgKiBpZiB0aGUgY3VycmVudCBvYmplY3QgYmVpbmcgZm9yYmlkZGVuIGlzIGEgZnVuY3Rpb25cbiAgICovXG4gIGFsbG93OiBmdW5jdGlvbiAob2JqZWN0cywgd2l0aFByb3RvdHlwZSkge1xuICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBkb0FsbG93KG9iaikge1xuICAgICAgbWUuZm9yYmlkZGVuLnJlbW92ZShvYmopO1xuICAgIH1cbiAgICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgICAgaWYgKHdpdGhQcm90b3R5cGUpIHtcbiAgICAgICAgd2l0aEZ1bmN0aW9uQW5kUHJvdG90eXBlKG9iaiwgZG9BbGxvdyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb0FsbG93KG9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cbnZhciBwcm90byA9IEFuYWx5emVyLnByb3RvdHlwZTtcbmZ1bmN0aW9uIGNoYWluKG1ldGhvZCkge1xuICBwcm90b1ttZXRob2RdID1cbiAgICB1dGlscy5mdW5jdGlvbkNoYWluKClcbiAgICAgIC5jaGFpbihwcm90by5tYWtlRGlydHkpXG4gICAgICAuY2hhaW4ocHJvdG9bbWV0aG9kXSk7XG59XG5cbi8vIGNhbGwgI21ha2VEaXJ0eSBiZWZvcmUgYWxsIHRoZXNlIG1ldGhvZHMgYXJlIGNhbGxlZFxuY2hhaW4oJ2FkZCcpO1xuY2hhaW4oJ3JlbW92ZScpO1xuY2hhaW4oJ2ZvcmJpZCcpO1xuY2hhaW4oJ2FsbG93Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQW5hbHl6ZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgSW5zcGVjdG9yID0gcmVxdWlyZSgnLi9JbnNwZWN0b3InKTtcbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vdXRpbC9oYXNoS2V5Jyk7XG5cbmZ1bmN0aW9uIEFuZ3VsYXIoY29uZmlnKSB7XG4gIEluc3BlY3Rvci5jYWxsKHRoaXMsIF8ubWVyZ2Uoe1xuICAgIGVudHJ5UG9pbnQ6ICdhbmd1bGFyJyxcbiAgICBkaXNwbGF5TmFtZTogJ0FuZ3VsYXJKUycsXG4gICAgYWx3YXlzRGlydHk6IHRydWUsXG4gICAgYWRkaXRpb25hbEZvcmJpZGRlblRva2VuczogJ2dsb2JhbDpqUXVlcnknXG4gIH0sIGNvbmZpZykpO1xuXG4gIHRoaXMuc2VydmljZXMgPSBbXG4gICAgJyRhbmltYXRlJyxcbiAgICAnJGNhY2hlRmFjdG9yeScsXG4gICAgJyRjb21waWxlJyxcbiAgICAnJGNvbnRyb2xsZXInLFxuICAgIC8vICckZG9jdW1lbnQnLFxuICAgICckZXhjZXB0aW9uSGFuZGxlcicsXG4gICAgJyRmaWx0ZXInLFxuICAgICckaHR0cCcsXG4gICAgJyRodHRwQmFja2VuZCcsXG4gICAgJyRpbnRlcnBvbGF0ZScsXG4gICAgJyRpbnRlcnZhbCcsXG4gICAgJyRsb2NhbGUnLFxuICAgICckbG9nJyxcbiAgICAnJHBhcnNlJyxcbiAgICAnJHEnLFxuICAgICckcm9vdFNjb3BlJyxcbiAgICAnJHNjZScsXG4gICAgJyRzY2VEZWxlZ2F0ZScsXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICAnJHRpbWVvdXQnXG4gICAgLy8gJyR3aW5kb3cnXG4gIF0ubWFwKGZ1bmN0aW9uICh2KSB7XG4gICAgcmV0dXJuIHsgY2hlY2tlZDogdHJ1ZSwgbmFtZTogdiB9O1xuICB9KTtcbn1cblxuQW5ndWxhci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEluc3BlY3Rvci5wcm90b3R5cGUpO1xuXG5Bbmd1bGFyLnByb3RvdHlwZS5nZXRTZWxlY3RlZFNlcnZpY2VzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzLFxuICAgIHRvQW5hbHl6ZSA9IFtdO1xuXG4gIHdpbmRvdy5hbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZyddKTtcbiAgdGhpcy5pbmplY3RvciA9IHdpbmRvdy5hbmd1bGFyLmluamVjdG9yKFsnYXBwJ10pO1xuXG4gIG1lLnNlcnZpY2VzLmZvckVhY2goZnVuY3Rpb24gKHMpIHtcbiAgICBpZiAocy5jaGVja2VkKSB7XG4gICAgICB2YXIgb2JqID0gbWUuaW5qZWN0b3IuZ2V0KHMubmFtZSk7XG4gICAgICBoYXNoS2V5LmNyZWF0ZUhhc2hLZXlzRm9yKG9iaiwgcy5uYW1lKTtcbiAgICAgIHRvQW5hbHl6ZS5wdXNoKG9iaik7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRvQW5hbHl6ZTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKi9cbkFuZ3VsYXIucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIGFuZ3VsYXInKTtcbiAgaGFzaEtleS5jcmVhdGVIYXNoS2V5c0Zvcih3aW5kb3cuYW5ndWxhciwgJ2FuZ3VsYXInKTtcblxuICAvLyBnZXQgdGhlIG9iamVjdHMgdGhhdCBuZWVkIHRvIGJlIGZvcmJpZGRlblxuICB2YXIgdG9Gb3JiaWQgPSBtZS5wYXJzZUZvcmJpZGRlblRva2VucygpO1xuICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdmb3JiaWRkaW5nOiAnLCB0b0ZvcmJpZCk7XG4gIHRoaXMuYW5hbHl6ZXIuZm9yYmlkKHRvRm9yYmlkLCB0cnVlKTtcblxuICB0aGlzLmFuYWx5emVyLmFkZChcbiAgICBbd2luZG93LmFuZ3VsYXJdLmNvbmNhdCh0aGlzLmdldFNlbGVjdGVkU2VydmljZXMoKSlcbiAgKTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKiBTaW5jZSBBbmd1bGFyIGlzIGEgc2NyaXB0IHJldHJpZXZlZCBvbiBkZW1hbmQgYnV0IHRoZSBpbnN0YW5jZVxuICogaXMgYWxyZWFkeSBjcmVhdGVkIGluIEluc3BlY3RlZEluc3RhbmNlLCBsZXQncyBhbHRlciB0aGVcbiAqIHByb3BlcnRpZXMgaXQgaGFzIGJlZm9yZSBtYWtpbmcgdGhlIHJlcXVlc3RcbiAqL1xuQW5ndWxhci5wcm90b3R5cGUubW9kaWZ5SW5zdGFuY2UgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICB0aGlzLnNyYyA9IG9wdGlvbnMuc3JjO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBbmd1bGFyOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIEdlbmVyaWNBbmFseXplciA9IHJlcXVpcmUoJy4vSW5zcGVjdG9yJyksXG4gIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG52YXIgdG9JbnNwZWN0ID0gW1xuICBPYmplY3QsIEZ1bmN0aW9uLFxuICBBcnJheSwgRGF0ZSwgQm9vbGVhbiwgTnVtYmVyLCBNYXRoLCBTdHJpbmcsIFJlZ0V4cCwgSlNPTixcbiAgRXJyb3Jcbl07XG5cbmZ1bmN0aW9uIEJ1aWx0SW4ob3B0aW9ucykge1xuICBHZW5lcmljQW5hbHl6ZXIuY2FsbCh0aGlzLCBvcHRpb25zKTtcbn1cblxuQnVpbHRJbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdlbmVyaWNBbmFseXplci5wcm90b3R5cGUpO1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICovXG5CdWlsdEluLnByb3RvdHlwZS5pbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnaW5zcGVjdGluZyBidWlsdEluIG9iamVjdHMnKTtcbiAgdGhpcy5hbmFseXplci5hZGQodGhpcy5nZXRJdGVtcygpKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKi9cbkJ1aWx0SW4ucHJvdG90eXBlLmdldEl0ZW1zID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdG9JbnNwZWN0O1xufTtcblxuQnVpbHRJbi5wcm90b3R5cGUuc2hvd1NlYXJjaCA9IGZ1bmN0aW9uIChub2RlTmFtZSwgbm9kZVByb3BlcnR5KSB7XG4gIHZhciB1cmwgPSAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvc2VhcmNoPycgK1xuICAgIHV0aWxzLnRvUXVlcnlTdHJpbmcoe1xuICAgICAgcTogZW5jb2RlVVJJQ29tcG9uZW50KG5vZGVOYW1lICsgJyAnICsgbm9kZVByb3BlcnR5KVxuICAgIH0pO1xuICB3aW5kb3cub3Blbih1cmwpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdWlsdEluOyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vdXRpbC9oYXNoS2V5Jyk7XG52YXIgSW5zcGVjdG9yID0gcmVxdWlyZSgnLi9JbnNwZWN0b3InKTtcblxudmFyIHRvSW5zcGVjdCA9IFtnbG9iYWxdO1xuXG5mdW5jdGlvbiBHbG9iYWwoKSB7XG4gIEluc3BlY3Rvci5jYWxsKHRoaXMsIHtcbiAgICBhbmFseXplckNvbmZpZzoge1xuICAgICAgbGV2ZWxzOiAxXG4gICAgfSxcbiAgICBhbHdheXNEaXJ0eTogdHJ1ZVxuICB9KTtcbn1cblxuR2xvYmFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSW5zcGVjdG9yLnByb3RvdHlwZSk7XG5cbkdsb2JhbC5wcm90b3R5cGUuZ2V0SXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0b0luc3BlY3Q7XG59O1xuXG5HbG9iYWwucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIGdsb2JhbCcpO1xuICAvL3ZhciBtZSA9IHRoaXMsXG4gIC8vICBoYXNoZXMgPSByZXF1aXJlKCcuLi9JbnNwZWN0ZWRJbnN0YW5jZXMnKTtcbiAgLy9cbiAgLy9fLmZvck93bihoYXNoZXMsIGZ1bmN0aW9uICh2LCBrKSB7XG4gIC8vICBpZiAodi5nZXRJdGVtcygpKSB7XG4gIC8vICAgIG1lLmFuYWx5emVyLmZvcmJpZChbdi5nZXRJdGVtcygpXSwgdHJ1ZSk7XG4gIC8vICB9XG4gIC8vfSk7XG4gIHRoaXMuYW5hbHl6ZXIuaXRlbXMuZW1wdHkoKTtcbiAgdGhpcy5hbmFseXplci5hZGQobWUuZ2V0SXRlbXMoKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdsb2JhbDtcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUSA9IHJlcXVpcmUoJ3EnKTtcbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWwvJyk7XG52YXIgaGFzaEtleSA9IHJlcXVpcmUoJy4uL3V0aWwvaGFzaEtleScpO1xudmFyIGFuYWx5emVyID0gcmVxdWlyZSgnLi4vT2JqZWN0QW5hbHl6ZXInKTtcblxudmFyIHNlYXJjaEVuZ2luZSA9ICdodHRwczovL2R1Y2tkdWNrZ28uY29tLz9xPSc7XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogSW5zdGFuY2VzIG9mIHRoZSBjbGFzcyBpbnNwZWN0b3IgZGVjaWRlIHdoaWNoIG9iamVjdHMgd2lsbCBiZVxuICogYW5hbHl6ZWQgYnkgdGhlIGludGVybmFsIGFuYWx5emVyIGl0IGhvbGRzLCBiZXNpZGVzIGRvaW5nIHRoYXRcbiAqIHRoaXMgaW5zcGVjdG9yIGlzIGFibGUgdG86XG4gKlxuICogLSBkbyBkZWZlcnJlZCBhbmFseXNpcyAoYW5hbHlzaXMgb24gZGVtYW5kKVxuICogLSBmZXRjaCBleHRlcm5hbCBzY3JpcHRzIGluIHNlcmllcyAodGhlIGFuYWx5c2lzIGlzIG1hZGVcbiAqICAgd2hlbiBhbGwgdGhlIHNjcmlwcyBoYXZlIGZpbmlzaGVkIGxvYWRpbmcpXG4gKiAtIG1hcmsgaXRzZWxmIGFzIGFuIGFscmVhZHkgaW5zcGVjdGVkIGluc3RhbmNlIHNvIHRoYXRcbiAqICAgZnVydGhlciBpbnNwZWN0aW9uIGNhbGxzIGFyZSBub3QgbWFkZVxuICogLSByZWNlaXZlIGEgY29uZmlndXJhdGlvbiB0byBmb3JiaWQgY29tcGxldGUgZ3JhcGhzIGZyb21cbiAqICAgdGhlIGFuYWx5c2lzIHN0ZXBcbiAqXG4gKiBTYW1wbGUgdXNhZ2U6XG4gKlxuICogQW5hbHlzaXMgb2YgYSBzaW1wbGUgb2JqZWN0OlxuICpcbiAqICAgIHZhciB4ID0ge307XG4gKiAgICB2YXIgaW5zcGVjdG9yID0gbmV3IEluc3BlY3RvcigpO1xuICogICAgaW5zcGVjdG9yXG4gKiAgICAgIC5pbml0KClcbiAqICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICogICAgICAgIC8vIHggaXMgcmVhZHkgYW5hbHl6ZWQgYXQgdGhpcyBwb2ludCFcbiAqICAgICAgICAvLyBvYmplY3RzIHNhdmVkIGluIGluc3BlY3Rvci5hbmFseXplciA9IHt4fVxuICogICAgICB9KVxuICpcbiAqIEFzIHNlZW4gaW4gdGhlIGNvZGUgdGhlcmUgaXMgYSBkZWZhdWx0IHZhcmlhYmxlIHdoaWNoIHNwZWNpZmllc1xuICogdGhlIG9iamVjdHMgdGhhdCB3aWxsIGJlIGZvcmJpZGRlbiwgdGhlIHZhbHVlIGlzIGEgcGlwZSBzZXBhcmF0ZWRcbiAqIGxpc3Qgb2YgY29tbWFuZHMgKHNlZSBAZm9yYmlkZGVuVG9rZW5zKSB3aGljaCBpcyBtYWtpbmcgdGhlXG4gKiBpbnNwZWN0b3IgYXZvaWQgdGhlIGJ1aWx0SW4gcHJvcGVydGllcywgbGV0J3MgYXZvaWQgdGhhdCBieSBtYWtpbmdcbiAqIGZvcmJpZGRlblRva2VucyBudWxsOlxuICpcbiAqICAgIHZhciB4ID0ge307XG4gKiAgICB2YXIgaW5zcGVjdG9yID0gbmV3IEluc3BlY3Rvcih7XG4gKiAgICAgIGZvcmJpZGRlblRva2VuczogbnVsbFxuICogICAgfSk7XG4gKiAgICBpbnNwZWN0b3JcbiAqICAgICAgLmluaXQoKVxuICogICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gKiAgICAgICAgLy8geCBpcyByZWFkeSBhbmFseXplZCBhdCB0aGlzIHBvaW50IVxuICogICAgICAgIC8vIG9iamVjdHMgc2F2ZWQgaW4gaW5zcGVjdG9yLmFuYWx5emVyID0ge3gsIE9iamVjdCxcbiAqICAgICAgICAgIE9iamVjdC5wcm90b3R5cGUsIEZ1bmN0aW9uLCBGdW5jdGlvbi5wcm90b3R5cGV9XG4gKiAgICAgIH0pXG4gKlxuICogVG8gZXhlY3V0ZSBtb3JlIGNvbXBsZXggYW5hbHlzaXMgY29uc2lkZXIgb3ZlcnJpZGluZzpcbiAqXG4gKiAtIGluc3BlY3RTZWxmXG4gKiAtIGdldEl0ZW1zXG4gKlxuICogU2VlIEJ1aWx0SW4uanMgZm9yIGEgYmFzaWMgb3ZlcnJpZGUgb2YgdGhlIG1ldGhvZHMgYWJvdmVcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gY29uZmlnXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5lbnRyeVBvaW50XVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc3JjXVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuZGlzcGxheU5hbWVdXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5mb3JiaWRkZW5Ub2tlbnM9SW5zcGVjdG9yLkRFRkFVTFRfRk9SQklEREVOX1RPS0VOU11cbiAqL1xuZnVuY3Rpb24gSW5zcGVjdG9yKGNvbmZpZykge1xuICBjb25maWcgPSBfLm1lcmdlKHtcbiAgICBzcmM6IG51bGwsXG4gICAgZW50cnlQb2ludDogJycsXG4gICAgZGlzcGxheU5hbWU6ICcnLFxuICAgIGFsd2F5c0RpcnR5OiBmYWxzZSxcbiAgICBkZWJ1ZzogZmFsc2UsXG4gICAgZm9yYmlkZGVuVG9rZW5zOiBJbnNwZWN0b3IuREVGQVVMVF9GT1JCSURERU5fVE9LRU5TLFxuICAgIGFkZGl0aW9uYWxGb3JiaWRkZW5Ub2tlbnM6ICcnLFxuICAgIGFuYWx5emVyQ29uZmlnOiB7fVxuICB9LCBjb25maWcpO1xuXG4gIC8qKlxuICAgKiBJZiBwcm92aWRlZCBpdCdsbCBiZSB1c2VkIGFzIHRoZSBzdGFydGluZyBvYmplY3QgZnJvbSB0aGVcbiAgICogZ2xvYmFsIG9iamVjdCB0byBiZSBhbmFseXplZCwgbmVzdGVkIG9iamVjdHMgY2FuIGJlIHNwZWNpZmllZFxuICAgKiB3aXRoIHRoZSBkb3Qgbm90YXRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIHRoaXMuZW50cnlQb2ludCA9IGNvbmZpZy5lbnRyeVBvaW50O1xuXG4gIC8qKlxuICAgKiBOYW1lIHRvIGJlIGRpc3BsYXllZFxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5kaXNwbGF5TmFtZSA9IGNvbmZpZy5kaXNwbGF5TmFtZTtcblxuICAvKipcbiAgICogSWYgdGhlIGluc3BlY3RvciBuZWVkcyB0byBmZXRjaCBleHRlcm5hbCByZXNvdXJjZXMgdXNlXG4gICAqIGEgc3RyaW5nIHNlcGFyYXRlZCB3aXRoIHRoZSBwaXBlIHwgY2hhcmFjdGVyLCB0aGUgc2NyaXB0c1xuICAgKiBhcmUgbG9hZGVkIGluIHNlcmllcyBiZWNhdXNlIG9uZSBzY3JpcHQgbWlnaHQgbmVlZCB0aGUgZXhpc3RlbmNlXG4gICAqIG9mIGFub3RoZXIgYmVmb3JlIGl0J3MgZmV0Y2hlZFxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5zcmMgPSBjb25maWcuc3JjO1xuXG4gIC8qKlxuICAgKiBFYWNoIHRva2VuIGRldGVybWluZXMgd2hpY2ggb2JqZWN0cyB3aWxsIGJlIGZvcmJpZGRlblxuICAgKiB3aGVuIHRoZSBhbmFseXplciBpcyBydW4uXG4gICAqXG4gICAqIFRva2VuIGV4YW1wbGVzOlxuICAgKlxuICAgKiAtIHBvam92aXo6e3N0cmluZ31cbiAgICogICBGb3JiaWRzIGFsbCB0aGUgaXRlbXMgc2F2ZWQgaW4gdGhlIHtzdHJpbmd9IGluc3RhbmNlIHdoaWNoXG4gICAqICAgaXMgc3RvcmVkIGluIHRoZSBJbnNwZWN0ZWRJbnN0YW5jZXMgb2JqZWN0LFxuICAgKiAgIGFzc3VtaW5nIHRoYXQgZWFjaCBpcyBhIHN1YmNsYXNzIG9mIGBJbnNwZWN0b3JgXG4gICAqXG4gICAqIGUuZy5cbiAgICpcbiAgICogICAvLyBmb3JiaWQgYWxsIHRoZSBpdGVtcyBmb3VuZCBpbiB0aGUgYnVpbHRJbiBpbnNwZWN0b3JcbiAgICogICBwb2pvdml6OmJ1aWx0SW5cbiAgICpcbiAgICogLSBnbG9iYWw6e3N0cmluZ31cbiAgICogICBGb3JiaWRzIGFuIG9iamVjdCB3aGljaCBpcyBpbiB0aGUgZ2xvYmFsIG9iamVjdCwge3N0cmluZ30gbWlnaHRcbiAgICogICBhbHNvIGluZGljYXRlIGEgbmVzdGVkIG9iamVjdCB1c2luZyAuIGFzIGEgbm9ybWFsIHByb3BlcnR5XG4gICAqICAgcmV0cmlldmFsXG4gICAqXG4gICAqIGUuZy5cbiAgICpcbiAgICogICBnbG9iYWw6ZG9jdW1lbnRcbiAgICogICBnbG9iYWw6ZG9jdW1lbnQuYm9keVxuICAgKiAgIGdsb2JhbDpkb2N1bWVudC5oZWFkXG4gICAqXG4gICAqIEZvcmJpZGRlblRva2VucyBleGFtcGxlOlxuICAgKlxuICAgKiAgcG9qb3ZpejpidWlsdElufHBvam92aXo6d2luZG93fGdsb2JhbDpkb2N1bWVudFxuICAgKlxuICAgKiBAdHlwZSB7QXJyYXl9XG4gICAqL1xuICB0aGlzLmZvcmJpZGRlblRva2VucyA9IChjb25maWcuZm9yYmlkZGVuVG9rZW5zIHx8ICcnKS5zcGxpdCgnfCcpLmNvbmNhdChcbiAgICAoY29uZmlnLmFkZGl0aW9uYWxGb3JiaWRkZW5Ub2tlbnMgfHwgJycpLnNwbGl0KCd8JylcbiAgKTtcblxuICAvKipcbiAgICogVGhpcyBpbnNwZWN0b3IgaXMgaW5pdGlhbGx5IGluIGEgZGlydHkgc3RhdGVcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcblxuICAvKipcbiAgICogUHJpbnQgZGVidWcgaW5mb1xuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuZGVidWcgPSBjb25maWcuZGVidWc7XG5cbiAgLyoqXG4gICAqIFRvIGF2b2lkIHJlYW5hbHl6aW5nIHRoZSBzYW1lIHN0cnVjdHVyZSBtdWx0aXBsZSB0aW1lcyBhIHNtYWxsXG4gICAqIG9wdGltaXphdGlvbiBpcyB0byBtYXJrIHRoZSBpbnNwZWN0b3IgYXMgaW5zcGVjdGVkLCB0byBhdm9pZFxuICAgKiB0aGlzIG9wdGltaXphdGlvbiBwYXNzIGFsd2F5c0RpcnR5IGFzIHRydWUgaW4gdGhlIG9wdGlvbnNcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmFsd2F5c0RpcnR5ID0gY29uZmlnLmFsd2F5c0RpcnR5O1xuXG4gIC8qKlxuICAgKiBBbiBpbnN0YW5jZSBvZiBPYmplY3RBbmFseXplciB3aGljaCB3aWxsIHNhdmUgYWxsXG4gICAqIHRoZSBpbnNwZWN0ZWQgb2JqZWN0c1xuICAgKiBAdHlwZSB7T2JqZWN0QW5hbHl6ZXJ9XG4gICAqL1xuICB0aGlzLmFuYWx5emVyID0gYW5hbHl6ZXIoY29uZmlnLmFuYWx5emVyQ29uZmlnKTtcbn1cblxuLyoqXG4gKiBBbiBvYmplY3Qgd2hpY2ggaG9sZHMgYWxsIHRoZSBpbnNwZWN0b3IgaW5zdGFuY2VzIGNyZWF0ZWRcbiAqIChmaWxsZWQgaW4gdGhlIGZpbGUgSW5zcGVjdGVkSW5zdGFuY2VzKVxuICogQHR5cGUge09iamVjdH1cbiAqL1xuSW5zcGVjdG9yLmluc3RhbmNlcyA9IG51bGw7XG5cbkluc3BlY3Rvci5ERUZBVUxUX0ZPUkJJRERFTl9UT0tFTlMgPVxuICAncG9qb3Zpejp3aW5kb3d8cG9qb3ZpejpidWlsdElufGdsb2JhbDpkb2N1bWVudCc7XG4gIC8vJ3Bvam92aXo6d2luZG93fHBvam92aXo6YnVpbHRJbic7XG5cbi8qKlxuICogSW5pdCByb3V0aW5lLCBzaG91bGQgYmUgY2FsbGVkIG9uIGRlbWFuZCB0byBpbml0aWFsaXplIHRoZVxuICogYW5hbHlzaXMgcHJvY2VzcywgaXQgb3JjaGVzdHJhdGVzIHRoZSBmb2xsb3dpbmc6XG4gKlxuICogLSBmZXRjaGluZyBvZiBleHRlcm5hbCByZXNvdXJjZXNcbiAqIC0gaW5zcGVjdGlvbiBvZiBlbGVtZW50cyBpZiB0aGUgaW5zcGVjdG9yIGlzIGluIGEgZGlydHkgc3RhdGVcbiAqXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzO1xuICBtZS5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnJWNQb2pvVml6JywgJ2ZvbnQtc2l6ZTogMTVweDsgY29sb3I6ICcpO1xuICByZXR1cm4gbWUuZmV0Y2goKVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChtZS5hbHdheXNEaXJ0eSB8fCBtZS5kaXJ0eSkge1xuICAgICAgICBtZS5pbnNwZWN0KCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWU7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICpcbiAqIFBlcmZvcm1zIHRoZSBhbmFseXNpcyBvZiBhbiBvYmplY3QgZ2l2ZW4gYW4gZW50cnlQb2ludCwgYmVmb3JlXG4gKiBwZXJmb3JtaW5nIHRoZSBhbmFseXNpcyBpdCBpZGVudGlmaWVzIHdoaWNoIG9iamVjdCBuZWVkIHRvIGJlXG4gKiBmb3JiaWRkZW4gKGZvcmJpZGRlblRva2VucylcbiAqXG4gKiBAY2hhaW5hYmxlXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIHZhciBzdGFydCA9IG1lLmZpbmROZXN0ZWRWYWx1ZUluR2xvYmFsKG1lLmVudHJ5UG9pbnQpO1xuICB2YXIgYW5hbHl6ZXIgPSB0aGlzLmFuYWx5emVyO1xuXG4gIGFzc2VydChzdGFydCwgJ2VudHJ5IHBvaW50IG5vdCBmb3VuZCEnKTtcbiAgbWUuZGVidWcgJiYgY29uc29sZS5sb2coJ2FuYWx5emluZyBnbG9iYWwuJyArIG1lLmVudHJ5UG9pbnQpO1xuXG4gIC8vIHNldCBhIHByZWRlZmluZWQgZ2xvYmFsIG5hbWUgKHNvIHRoYXQgaXQncyBrbm93biBhcyBlbnRyeVBvaW50KVxuICBoYXNoS2V5LmNyZWF0ZUhhc2hLZXlzRm9yKHN0YXJ0LCBtZS5lbnRyeVBvaW50KTtcblxuICAvLyBiZWZvcmUgaW5zcGVjdCBob29rXG4gIG1lLmJlZm9yZUluc3BlY3RTZWxmKCk7XG5cbiAgLy8gZ2V0IHRoZSBvYmplY3RzIHRoYXQgbmVlZCB0byBiZSBmb3JiaWRkZW5cbiAgdmFyIHRvRm9yYmlkID0gbWUucGFyc2VGb3JiaWRkZW5Ub2tlbnMoKTtcbiAgbWUuZGVidWcgJiYgY29uc29sZS5sb2coJ2ZvcmJpZGRpbmc6ICcsIHRvRm9yYmlkKTtcbiAgYW5hbHl6ZXIuZm9yYmlkKHRvRm9yYmlkLCB0cnVlKTtcblxuICAvLyBwZXJmb3JtIHRoZSBhbmFseXNpc1xuICBtZS5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnYWRkaW5nOiAnICsgc3RhcnQpO1xuICBhbmFseXplci5hZGQoW3N0YXJ0XSk7XG5cbiAgLy8gYWZ0ZXIgaW5zcGVjdCBob29rXG4gIG1lLmFmdGVySW5zcGVjdFNlbGYoKTtcbiAgcmV0dXJuIG1lO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqIGJlZm9yZSBpbnNwZWN0IHNlbGYgaG9va1xuICogQ2xlYW5zIHRoZSBpdGVtcyBzdG9yZWQgaW4gdGhlIGFuYWx5emVyXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuYmVmb3JlSW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIGNsZWFuIHRoZSBhbmFseXplclxuICB0aGlzLmFuYWx5emVyLml0ZW1zLmVtcHR5KCk7XG4gIC8vdGhpcy5hbmFseXplci5mb3JiaWRkZW4uZW1wdHkoKTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKiBhZnRlciBpbnNwZWN0IHNlbGYgaG9va1xuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmFmdGVySW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG59O1xuXG4vKipcbiAqIFBhcnNlcyB0aGUgZm9yYmlkZGVuVG9rZW5zIHN0cmluZyBhbmQgaWRlbnRpZmllcyB3aGljaFxuICogb2JqZWN0cyBzaG91bGQgYmUgZm9yYmlkZGVuIGZyb20gdGhlIGFuYWx5c2lzIHBoYXNlXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUucGFyc2VGb3JiaWRkZW5Ub2tlbnMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIHZhciBmb3JiaWRkZW4gPSBbXS5jb25jYXQodGhpcy5mb3JiaWRkZW5Ub2tlbnMpO1xuICB2YXIgdG9Gb3JiaWQgPSBbXTtcbiAgbWUuZGVidWcgJiYgY29uc29sZS5sb2coJ2Fib3V0IHRvIGZvcmJpZDogJywgZm9yYmlkZGVuKTtcbiAgZm9yYmlkZGVuXG4gICAgLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gISF2OyB9KVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgICB2YXIgYXJyID0gW107XG4gICAgICB2YXIgdG9rZW5zO1xuICAgICAgaWYgKHRva2VuLnNlYXJjaCgvXnBvam92aXo6LykgPiAtMSkge1xuICAgICAgICB0b2tlbnMgPSB0b2tlbi5zcGxpdCgnOicpO1xuXG4gICAgICAgIC8vIGlmIGl0J3MgYSBjb21tYW5kIGZvciB0aGUgbGlicmFyeSB0aGVuIG1ha2Ugc3VyZSBpdCBleGlzdHNcbiAgICAgICAgYXNzZXJ0KEluc3BlY3Rvci5pbnN0YW5jZXNbdG9rZW5zWzFdXSk7XG4gICAgICAgIGFyciA9IEluc3BlY3Rvci5pbnN0YW5jZXNbdG9rZW5zWzFdXS5nZXRJdGVtcygpO1xuICAgICAgfSBlbHNlIGlmICh0b2tlbi5zZWFyY2goL15nbG9iYWw6LykgPiAtMSkge1xuICAgICAgICB0b2tlbnMgPSB0b2tlbi5zcGxpdCgnOicpO1xuICAgICAgICBhcnIgPSBbbWUuZmluZE5lc3RlZFZhbHVlSW5HbG9iYWwodG9rZW5zWzFdKV07XG4gICAgICB9XG5cbiAgICAgIHRvRm9yYmlkID0gdG9Gb3JiaWQuY29uY2F0KGFycik7XG4gICAgfSk7XG4gIHJldHVybiB0b0ZvcmJpZDtcbn07XG5cbi8qKlxuICogTWFya3MgdGhpcyBpbnNwZWN0b3IgYXMgZGlydHlcbiAqIEBjaGFpbmFibGVcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5zZXREaXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBNYXJrcyB0aGlzIGluc3BlY3RvciBhcyBub3QgZGlydHkgKHNvIHRoYXQgZnVydGhlciBjYWxsc1xuICogdG8gaW5zcGVjdCBhcmUgbm90IG1hZGUpXG4gKiBAY2hhaW5hYmxlXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUudW5zZXREaXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKiBTaG91bGQgYmUgY2FsbGVkIGFmdGVyIHRoZSBpbnN0YW5jZSBpcyBjcmVhdGVkIHRvIG1vZGlmeSBpdCB3aXRoXG4gKiBhZGRpdGlvbmFsIG9wdGlvbnNcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5tb2RpZnlJbnN0YW5jZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBQZXJmb3JtcyB0aGUgaW5zcGVjdGlvbiBvbiBzZWxmXG4gKiBAY2hhaW5hYmxlXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXNcbiAgICAudW5zZXREaXJ0eSgpXG4gICAgLmluc3BlY3RTZWxmKCk7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICogUHJlcmVuZGVyIGhvb2tcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5wcmVSZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICogUG9zdHJlbmRlciBob29rXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUucG9zdFJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlc1xuICogUmV0dXJucyB0aGUgcHJlZGVmaW5lZCBpdGVtcyB0aGF0IHRoaXMgaW5zcGVjdG9yIGlzIGluIGNoYXJnZSBvZlxuICogaXQncyB1c2VmdWwgdG8gZGV0ZXJtaW5lIHdoaWNoIG9iamVjdHMgbmVlZCB0byBiZSBkaXNjYXJkZWQgaW5cbiAqICNpbnNwZWN0U2VsZlxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmdldEl0ZW1zID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gW107XG59O1xuXG4vKipcbiAqIEdpdmVuIGEgc3RyaW5nIHdoaWNoIGhhdmUgdG9rZW5zIHNlcGFyYXRlZCBieSB0aGUgLiBzeW1ib2xcbiAqIHRoaXMgbWV0aG9kcyBjaGVja3MgaWYgaXQncyBhIHZhbGlkIHZhbHVlIHVuZGVyIHRoZSBnbG9iYWwgb2JqZWN0XG4gKlxuICogZS5nLlxuICogICAgICAgICdkb2N1bWVudC5ib2R5J1xuICogICAgICAgIHJldHVybnMgZ2xvYmFsLmRvY3VtZW50LmJvZHkgc2luY2UgaXQncyBhIHZhbGlkIG9iamVjdFxuICogICAgICAgIHVuZGVyIHRoZSBnbG9iYWwgb2JqZWN0XG4gKlxuICogQHBhcmFtIG5lc3RlZENvbmZpZ3VyYXRpb25cbiAqIEByZXR1cm5zIHsqfVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmZpbmROZXN0ZWRWYWx1ZUluR2xvYmFsID0gZnVuY3Rpb24gKG5lc3RlZENvbmZpZ3VyYXRpb24pIHtcbiAgdmFyIHRva2VucyA9IG5lc3RlZENvbmZpZ3VyYXRpb24uc3BsaXQoJy4nKTtcbiAgdmFyIHN0YXJ0ID0gZ2xvYmFsO1xuICB3aGlsZSAodG9rZW5zLmxlbmd0aCkge1xuICAgIHZhciB0b2tlbiA9IHRva2Vucy5zaGlmdCgpO1xuICAgIGlmICghc3RhcnQuaGFzT3duUHJvcGVydHkodG9rZW4pKSB7XG4gICAgICB0aGlzLmRlYnVnICYmIGNvbnNvbGUud2FybignbmVzdGVkQ29uZmlnIG5vdCBmb3VuZCEnKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzdGFydCA9IHN0YXJ0W3Rva2VuXTtcbiAgfVxuICByZXR1cm4gc3RhcnQ7XG59O1xuXG4vKipcbiAqIEZldGNoZXMgYWxsIHRoZSByZXNvdXJjZXMgcmVxdWlyZWQgdG8gcGVyZm9ybSB0aGUgaW5zcGVjdGlvbixcbiAqICh3aGljaCBhcmUgc2F2ZWQgaW4gYHRoaXMuc3JjYCksIHJldHVybnMgYSBwcm9taXNlIHdoaWNoIGlzXG4gKiByZXNvbHZlZCB3aGVuIGFsbCB0aGUgc2NyaXBzIGhhdmUgZmluaXNoZWQgbG9hZGluZ1xuICogQHJldHVybnMge1Byb21pc2V9XG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuZmV0Y2ggPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXM7XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgc3RyaW5nIGB2YCBpdCBmZXRjaGVzIGl0IGFuIGFuIGFzeW5jIHdheSxcbiAgICogc2luY2UgdGhpcyBtZXRob2QgcmV0dXJucyBhIHByb21pc2UgaXQgYWxsb3dzIGVhc3kgY2hhaW5pbmdcbiAgICogc2VlIHRoZSByZWR1Y2UgcGFydCBiZWxvd1xuICAgKiBAcGFyYW0gdlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAqL1xuICBmdW5jdGlvbiBwcm9taXNpZnkodikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB1dGlscy5ub3RpZmljYXRpb24oJ2ZldGNoaW5nIHNjcmlwdCAnICsgdiwgdHJ1ZSk7XG4gICAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICBzY3JpcHQuc3JjID0gdjtcbiAgICAgIHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHV0aWxzLm5vdGlmaWNhdGlvbignY29tcGxldGVkIGZldGNoaW5nIHNjcmlwdCAnICsgdiwgdHJ1ZSk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUobWUuZmluZE5lc3RlZFZhbHVlSW5HbG9iYWwobWUuZW50cnlQb2ludCkpO1xuICAgICAgfTtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gIH1cblxuICBpZiAobWUuc3JjKSB7XG4gICAgaWYgKG1lLmZpbmROZXN0ZWRWYWx1ZUluR2xvYmFsKG1lLmVudHJ5UG9pbnQpKSB7XG4gICAgICBjb25zb2xlLmxvZygncmVzb3VyY2UgYWxyZWFkeSBmZXRjaGVkOiAnICsgbWUuZW50cnlQb2ludCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBzcmNzID0gdGhpcy5zcmMuc3BsaXQoJ3wnKTtcbiAgICAgIHJldHVybiBzcmNzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VycmVudCkge1xuICAgICAgICByZXR1cm4gcHJldi50aGVuKHByb21pc2lmeShjdXJyZW50KSk7XG4gICAgICB9LCBRKCdyZWR1Y2UnKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFEuZGVsYXkoMCk7XG59O1xuXG5JbnNwZWN0b3IucHJvdG90eXBlLnNob3dTZWFyY2ggPSBmdW5jdGlvbiAobm9kZU5hbWUsIG5vZGVQcm9wZXJ0eSkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB3aW5kb3cub3BlbihcbiAgICBfLnRlbXBsYXRlKCcke3NlYXJjaEVuZ2luZX0ke2x1Y2t5fSR7bGlicmFyeU5hbWV9ICR7bm9kZU5hbWV9ICR7bm9kZVByb3BlcnR5fScsIHtcbiAgICAgIHNlYXJjaEVuZ2luZTogc2VhcmNoRW5naW5lLFxuICAgICAgbHVja3k6IEluc3BlY3Rvci5sdWNreSA/ICchZHVja3knIDogJycsXG4gICAgICBsaWJyYXJ5TmFtZTogbWUuZGlzcGxheW5hbWUgfHwgbWUuZ2xvYmFsLFxuICAgICAgbm9kZU5hbWU6IG5vZGVOYW1lLFxuICAgICAgbm9kZVByb3BlcnR5OiBub2RlUHJvcGVydHlcbiAgICB9KVxuICApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnNwZWN0b3I7XG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIid1c2Ugc3RyaWN0JztcbnZhciBJbnNwZWN0b3IgPSByZXF1aXJlKCcuL0luc3BlY3RvcicpO1xuZnVuY3Rpb24gUE9iamVjdChvcHRpb25zKSB7XG4gIEluc3BlY3Rvci5jYWxsKHRoaXMsIG9wdGlvbnMpO1xufVxuXG5QT2JqZWN0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSW5zcGVjdG9yLnByb3RvdHlwZSk7XG5cblBPYmplY3QucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIE9iamVjdCBvYmplY3RzJyk7XG4gIHRoaXMuYW5hbHl6ZXIuYWRkKHRoaXMuZ2V0SXRlbXMoKSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuUE9iamVjdC5wcm90b3R5cGUuZ2V0SXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBbT2JqZWN0XTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUE9iamVjdDsiLCJ2YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIFEgPSByZXF1aXJlKCdxJyk7XG52YXIgZGFncmUgPSByZXF1aXJlKCdkYWdyZScpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlsLycpO1xudmFyIEluc3BlY3RlZEluc3RhbmNlcyA9IHJlcXVpcmUoJy4vSW5zcGVjdGVkSW5zdGFuY2VzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG5cbi8vIGVuYWJsZSBwcm9taXNlIGNoYWluIGRlYnVnXG5RLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xuXG52YXIgaW5zcGVjdG9yLCBvbGRJbnNwZWN0b3I7XG52YXIgcmVuZGVyZXIsIG9sZFJlbmRlcmVyO1xudmFyIHBvam92aXo7XG5cbi8qKlxuICogR2l2ZW4gYW4gaW5zcGVjdG9yIGluc3RhbmNlIGl0IGJ1aWxkIHRoZSBncmFwaCBhbmQgYWxzbyB0aGVcbiAqIGxheW91dCBvZiB0aGUgbm9kZXMgYmVsb25naW5nIHRvIGl0LCB0aGUgcmVzdWx0aW5nIG9iamVjdCBpc1xuICogYW4gb2JqZWN0IHdoaWNoIGlzIHVzZWQgYnkgYSByZW5kZXJlciB0byBiZSBkcmF3blxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gcmV0dXJuIEFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgaW5mbzpcbiAqICB7XG4gKiAgICAgbm9kZXM6IFthcnJheSBvZiBvYmplY3RzLCBlYWNoIGhhdmluZyBsYWJlbCx4LHksaGVpZ2h0LFxuICogICAgICAgICAgICB3aWR0aCxwcm9wZXJ0aWVzLHN1Y2Nlc3NvcnMscHJlZGVjZXNzb3JzXSxcbiAqICAgICBlZGdlczogW2FycmF5IG9mIG9iamVjdHMsIGVhY2ggaGF2aW5nIHRvLGZyb20scHJvcGVydHldLFxuICogICAgIGNlbnRlcjogYW4gb2JqZWN0IHdpdGggdGhlIGNlbnRlciBvZiB0aGUgYmJveCB0aGF0IGNvdmVyc1xuICogICAgICAgICAgICB0aGUgbGF5b3V0IG9mIHRoZSBncmFwaFxuICogICAgIG1uOiBhbiBvYmplY3Qgd2l0aCBpbmZvIGFib3V0IHRoZSBtaW5pbXVtIHgseSBvZiB0aGUgYmJveFxuICogICAgICAgICAgICB0aGF0IGNvdmVycyB0aGUgbGF5b3V0IG9mIHRoZSBncmFwaFxuICogICAgIG14OiBhbiBvYmplY3Qgd2l0aCBpbmZvIGFib3V0IHRoZSBtYXhpbXVtIHgseSBvZiB0aGUgYmJveFxuICogICAgICAgICAgICB0aGF0IGNvdmVycyB0aGUgbGF5b3V0IG9mIHRoZSBncmFwaFxuICogIH1cbiAqL1xuZnVuY3Rpb24gcHJvY2VzcyhpbnNwZWN0b3IpIHtcbiAgdmFyIGcgPSBuZXcgZGFncmUuRGlncmFwaCgpLFxuICAgICAgbm9kZSxcbiAgICAgIGFuYWx5emVyID0gaW5zcGVjdG9yLmFuYWx5emVyLFxuICAgICAgc3RyID0gYW5hbHl6ZXIuc3RyaW5naWZ5KCksXG4gICAgICBsaWJyYXJ5Tm9kZXMgPSBzdHIubm9kZXMsXG4gICAgICBsaWJyYXJ5RWRnZXMgPSBzdHIuZWRnZXM7XG5cbiAgLy8gY3JlYXRlIHRoZSBncmFwaFxuICAvLyBlYWNoIGVsZW1lbnQgb2YgdGhlIGdyYXBoIGhhc1xuICAvLyAtIGxhYmVsXG4gIC8vIC0gd2lkdGhcbiAgLy8gLSBoZWlnaHRcbiAgLy8gLSBwcm9wZXJ0aWVzXG4gIF8uZm9yT3duKGxpYnJhcnlOb2RlcywgZnVuY3Rpb24gKHByb3BlcnRpZXMsIGspIHtcbiAgICB2YXIgbGFiZWwgPSBrLm1hdGNoKC9cXFMqPy0oLiopLylbMV07XG4gICAgLy9jb25zb2xlLmxvZyhrLCBsYWJlbC5sZW5ndGgpO1xuICAgIG5vZGUgPSB7XG4gICAgICBsYWJlbDogayxcbiAgICAgIHdpZHRoOiBsYWJlbC5sZW5ndGggKiAxMFxuICAgIH07XG4gICAgLy8gbGluZXMgKyBoZWFkZXIgKyBwYWRkaW5nIGJvdHRvbVxuICAgIG5vZGUuaGVpZ2h0ID0gcHJvcGVydGllcy5sZW5ndGggKiAxNSArIDUwO1xuICAgIG5vZGUucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICBub2RlLndpZHRoID0gTWF0aC5tYXgobm9kZS53aWR0aCwgdi5wcm9wZXJ0eS5sZW5ndGggKiAxMCk7XG4gICAgfSk7XG4gICAgZy5hZGROb2RlKGssIG5vZGUpO1xuICB9KTtcblxuICAvLyBidWlsZCB0aGUgZWRnZXMgZnJvbSBub2RlIHRvIG5vZGVcbiAgXy5mb3JPd24obGlicmFyeUVkZ2VzLCBmdW5jdGlvbiAobGlua3MpIHtcbiAgICBsaW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICBpZiAoZy5oYXNOb2RlKGxpbmsuZnJvbSkgJiYgZy5oYXNOb2RlKGxpbmsudG8pKSB7XG4gICAgICAgIGcuYWRkRWRnZShudWxsLCBsaW5rLmZyb20sIGxpbmsudG8pO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICAvLyBnZW5lcmF0ZSB0aGUgZ3JhcGggbGF5b3V0XG4gIHZhciBsYXlvdXQgPSBkYWdyZS5sYXlvdXQoKVxuICAgIC5ub2RlU2VwKDMwKVxuICAgIC8vIC5yYW5rU2VwKDcwKVxuICAgIC8vIC5yYW5rRGlyKCdUQicpXG4gICAgLnJ1bihnKTtcblxuICB2YXIgbm9kZXMgPSBbXSxcbiAgICAgIGVkZ2VzID0gW10sXG4gICAgICBjZW50ZXIgPSB7eDogMCwgeTogMH0sXG4gICAgICBtbiA9IHt4OiBJbmZpbml0eSwgeTogSW5maW5pdHl9LFxuICAgICAgbXggPSB7eDogLUluZmluaXR5LCB5OiAtSW5maW5pdHl9LFxuICAgICAgdG90YWwgPSBnLm5vZGVzKCkubGVuZ3RoO1xuXG4gIC8vIHVwZGF0ZSB0aGUgbm9kZSBpbmZvIGFkZGluZzpcbiAgLy8gLSB4ICh4LWNvb3JkaW5hdGUgb2YgdGhlIGNlbnRlciBvZiB0aGUgbm9kZSlcbiAgLy8gLSB5ICh5LWNvb3JkaW5hdGUgb2YgdGhlIGNlbnRlciBvZiB0aGUgbm9kZSlcbiAgLy8gLSBwcmVkZWNlc3NvcnMgKGFuIGFycmF5IHdpdGggdGhlIGlkZW50aWZpZXJzIG9mIHRoZSBwcmVkZWNlc3NvcnMgb2YgdGhpcyBub2RlKVxuICAvLyAtIHN1Y2Nlc3NvcnMgKGFuIGFycmF5IHdpdGggdGhlIGlkZW50aWZpZXJzIG9mIHRoZSBzdWNjZXNzb3Igb2YgdGhpcyBub2RlKVxuICBsYXlvdXQuZWFjaE5vZGUoZnVuY3Rpb24gKGssIGxheW91dEluZm8pIHtcbiAgICB2YXIgeCA9IGxheW91dEluZm8ueDtcbiAgICB2YXIgeSA9IGxheW91dEluZm8ueTtcblxuICAgIG5vZGUgPSBnLm5vZGUoayk7XG4gICAgbm9kZS54ID0geDtcbiAgICBub2RlLnkgPSB5O1xuICAgIG5vZGUucHJlZGVjZXNzb3JzID0gZy5wcmVkZWNlc3NvcnMoayk7XG4gICAgbm9kZS5zdWNjZXNzb3JzID0gZy5zdWNjZXNzb3JzKGspO1xuICAgIG5vZGVzLnB1c2gobm9kZSk7XG5cbiAgICAvLyBjYWxjdWxhdGUgdGhlIGJib3ggb2YgdGhlIGdyYXBoIHRvIGNlbnRlciB0aGUgZ3JhcGhcbiAgICB2YXIgbW54ID0geCAtIG5vZGUud2lkdGggLyAyO1xuICAgIHZhciBtbnkgPSB5IC0gbm9kZS5oZWlnaHQgLyAyO1xuICAgIHZhciBteHggPSB4ICsgbm9kZS53aWR0aCAvIDI7XG4gICAgdmFyIG14eSA9IHkgKyBub2RlLmhlaWdodCAvIDI7XG5cbiAgICBjZW50ZXIueCArPSB4O1xuICAgIGNlbnRlci55ICs9IHk7XG4gICAgbW4ueCA9IE1hdGgubWluKG1uLngsIG1ueCk7XG4gICAgbW4ueSA9IE1hdGgubWluKG1uLnksIG1ueSk7XG4gICAgLy8gY29uc29sZS5sb2coeCwgeSwgJyBkaW0gJywgbm9kZS53aWR0aCwgbm9kZS5oZWlnaHQpO1xuICAgIG14LnggPSBNYXRoLm1heChteC54LCBteHgpO1xuICAgIG14LnkgPSBNYXRoLm1heChteC55LCBteHkpO1xuICB9KTtcblxuICBjZW50ZXIueCAvPSAodG90YWwgfHwgMSk7XG4gIGNlbnRlci55IC89ICh0b3RhbCB8fCAxKTtcblxuICAvLyBjcmVhdGUgdGhlIGVkZ2VzIGZyb20gcHJvcGVydHkgdG8gbm9kZVxuICBfLmZvck93bihsaWJyYXJ5RWRnZXMsIGZ1bmN0aW9uIChsaW5rcykge1xuICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgIGlmIChnLmhhc05vZGUobGluay5mcm9tKSAmJiBnLmhhc05vZGUobGluay50bykpIHtcbiAgICAgICAgZWRnZXMucHVzaChsaW5rKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBlZGdlczogZWRnZXMsXG4gICAgbm9kZXM6IG5vZGVzLFxuICAgIGNlbnRlcjogY2VudGVyLFxuICAgIG1uOiBtbixcbiAgICBteDogbXhcbiAgfTtcbn1cblxuLyoqXG4gKiBEcmF3cyB0aGUgY3VycmVudCBpbnNwZWN0b3IgaW4gdGhlIGNhbnZhcyB3aXRoIHRoZSBmb2xsb3dpbmcgc3RlcHM6XG4gKlxuICogLSBjbGVhcnMgdGhlIGNhbnZhc1xuICogLSBwcm9jZXNzZXMgdGhlIGRhdGEgb2YgdGhlIGN1cnJlbnQgaW5zcGVjdG9yXG4gKiAtIHJlbmRlcnMgdGhlIGRhdGEgcHJvZHVjZWQgYnkgdGhlIG1ldGhvZCBhYm92ZVxuICogLSBub3RpZmllcyB0aGUgdXNlciBvZiBhbnkgYWN0aW9uIHBlcmZvcm1lZFxuICpcbiAqL1xuZnVuY3Rpb24gcmVuZGVyKCkge1xuICB2YXIgZGF0YTtcblxuICBpZiAoaW5zcGVjdG9yID09PSBvbGRJbnNwZWN0b3IpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB1dGlscy5ub3RpZmljYXRpb24oJ3Byb2Nlc3NpbmcgJyArIGluc3BlY3Rvci5lbnRyeVBvaW50KTtcblxuICAvLyBwcmUgcmVuZGVyXG4gIG9sZFJlbmRlcmVyICYmIG9sZFJlbmRlcmVyLmNsZWFuKCk7XG4gIHJlbmRlcmVyLmNsZWFuKCk7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgaW5zcGVjdG9yLnByZVJlbmRlcigpO1xuICAgIGNvbnNvbGUubG9nKCdwcm9jZXNzICYgcmVuZGVyIHN0YXJ0OiAnLCBuZXcgRGF0ZSgpKTtcbiAgICAvLyBkYXRhOlxuICAgIC8vIC0gZWRnZXMgKHByb3BlcnR5IC0+IG5vZGUpXG4gICAgLy8gLSBub2Rlc1xuICAgIC8vIC0gY2VudGVyXG4gICAgY29uc29sZS50aW1lKCdwcm9jZXNzJyk7XG4gICAgZGF0YSA9IHByb2Nlc3MoaW5zcGVjdG9yKTtcbiAgICBjb25zb2xlLnRpbWVFbmQoJ3Byb2Nlc3MnKTtcblxuICAgIHV0aWxzLm5vdGlmaWNhdGlvbigncmVuZGVyaW5nICcgKyBpbnNwZWN0b3IuZ2xvYmFsKTtcblxuICAgIGNvbnNvbGUudGltZSgncmVuZGVyJyk7XG4gICAgcmVuZGVyZXIucmVuZGVyKGRhdGEpO1xuICAgIGNvbnNvbGUudGltZUVuZCgncmVuZGVyJyk7XG5cbiAgICB1dGlscy5ub3RpZmljYXRpb24oJ2NvbXBsZXRlIScpO1xuICB9LCAwKTtcbn1cblxuLy8gcHVibGljIGFwaVxucG9qb3ZpeiA9IHtcbiAgLyoqXG4gICAqIGhvbGRzIGEgbGlzdCBvZiBhbGwgdGhlIHJlbmRlcmVycyBhdmFpbGFibGUsIHNoaXBwZWRcbiAgICogd2l0aCBhIGQzIGFuZCBhIFRocmVlSlMgcmVuZGVyZXJcbiAgICovXG4gIHJlbmRlcmVyczoge30sXG4gIC8qKlxuICAgKiBBZGRzIGEgcmVuZGVyZXIgdG8gdGhlIHJlbmRlcmVycyBhdmFpbGFibGVcbiAgICogQHBhcmFtIG5ld1JlbmRlcmVyc1xuICAgKi9cbiAgYWRkUmVuZGVyZXJzOiBmdW5jdGlvbiAobmV3UmVuZGVyZXJzKSB7XG4gICAgXy5tZXJnZShwb2pvdml6LnJlbmRlcmVycywgbmV3UmVuZGVyZXJzKTtcbiAgfSxcbiAgLyoqXG4gICAqIENsZWFycyB0aGUgaW5zcGVjdG9yIHZhcmlhYmxlXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHVuc2V0SW5zcGVjdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgb2xkSW5zcGVjdG9yID0gaW5zcGVjdG9yO1xuICAgIGluc3BlY3RvciA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGluc3BlY3RvciAoc2V0IHRocm91Z2ggI3NldEN1cnJlbnRJbnNwZWN0b3IpXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgZ2V0Q3VycmVudEluc3BlY3RvcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBpbnNwZWN0b3I7XG4gIH0sXG4gIC8qKlxuICAgKiBHaXZlbiBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgY29uZmlndXJhdGlvbiBvcHRpb25zIG9mIGFcbiAgICogcG9zc2libGUgbmV3IGluc3RhbmNlIG9mIEluc3BlY3RvciwgdGhpcyBtZXRob2QgY2hlY2tzIGlmIHRoZXJlJ3NcbiAgICogYWxyZWFkeSBhbiBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIGRpc3BsYXlOYW1lL2VudHJ5UG9pbnQgdG8gYXZvaWRcbiAgICogY3JlYXRpbmcgbW9yZSBJbnN0YW5jZXMgb2YgdGhlIHNhbWUgdHlwZSwgY2FsbHMgdGhlIGhvb2tcbiAgICogYG1vZGlmeUluc3RhbmNlYCBhZnRlciB0aGUgaW5zcGVjdG9yIGlzIHJldHJpZXZlZC9jcmVhdGVkXG4gICAqXG4gICAqIEBwYXJhbSB7Y29uZmlnfSBvcHRpb25zIE9wdGlvbnMgcGFzc2VkIHRvIGFuIEluc3BlY3RvciBpbnN0YW5jZVxuICAgKiBpZiB0aGUgZW50cnlQb2ludC9kaXNwbGF5TmFtZSB3YXNuJ3QgY3JlYXRlZCB5ZXQgaW5cbiAgICogSW5zcGVjdG9ySW5zdGFuY2VzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgc2V0Q3VycmVudEluc3BlY3RvcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgZW50cnlQb2ludCA9IG9wdGlvbnMuZGlzcGxheU5hbWUgfHwgb3B0aW9ucy5lbnRyeVBvaW50O1xuICAgIGFzc2VydChlbnRyeVBvaW50KTtcbiAgICBvbGRJbnNwZWN0b3IgPSBpbnNwZWN0b3I7XG4gICAgaW5zcGVjdG9yID0gSW5zcGVjdGVkSW5zdGFuY2VzW2VudHJ5UG9pbnRdO1xuXG4gICAgaWYgKCFpbnNwZWN0b3IpIHtcbiAgICAgIGluc3BlY3RvciA9IEluc3BlY3RlZEluc3RhbmNlcy5jcmVhdGUob3B0aW9ucyk7XG4gICAgLy99IGVsc2Uge1xuICAgIC8vICAvLyByZXF1aXJlZCB0byBmZXRjaCBleHRlcm5hbCByZXNvdXJjZXNcbiAgICAvLyAgaW5zcGVjdG9yLnNyYyA9IG9wdGlvbnMuc3JjO1xuICAgIH1cbiAgICBpbnNwZWN0b3IubW9kaWZ5SW5zdGFuY2Uob3B0aW9ucyk7XG4gICAgcmV0dXJuIGluc3BlY3Rvci5pbml0KCk7XG4gIH0sXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSB2YWx1ZSBvZiB0aGUgY3VycmVudCByZW5kZXJlclxuICAgKiBAcGFyYW0gclxuICAgKi9cbiAgc2V0UmVuZGVyZXI6IGZ1bmN0aW9uIChyKSB7XG4gICAgb2xkUmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICByZW5kZXJlciA9IHBvam92aXoucmVuZGVyZXJzW3JdO1xuICB9LFxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCByZW5kZXJlclxuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIGdldFJlbmRlcmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyO1xuICB9LFxuICByZW5kZXI6IHJlbmRlcixcblxuICAvLyBleHBvc2UgaW5uZXIgbW9kdWxlc1xuICBPYmplY3RBbmFseXplcjogcmVxdWlyZSgnLi9PYmplY3RBbmFseXplcicpLFxuICBJbnNwZWN0ZWRJbnN0YW5jZXM6IHJlcXVpcmUoJy4vSW5zcGVjdGVkSW5zdGFuY2VzJyksXG4gIGFuYWx5emVyOiB7XG4gICAgSW5zcGVjdG9yOiByZXF1aXJlKCcuL2FuYWx5emVyL0luc3BlY3RvcicpXG4gIH0sXG4gIHV0aWxzOiByZXF1aXJlKCcuL3V0aWwnKSxcbiAgLy8gdXNlZCBpbiBzZWFyY2ggdG8gc2F2ZSB0aGUgZG93bmxvYWRlZCBjb25maWd1cmF0aW9uc1xuICB1c2VyVmFyaWFibGVzOiBbXVxufTtcblxuLy8gY3VzdG9tIGV2ZW50c1xuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncHJvcGVydHktY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICB2YXIgZGV0YWlsID0gZS5kZXRhaWw7XG4gIHBvam92aXpcbiAgICAuZ2V0Q3VycmVudEluc3BlY3RvcigpXG4gICAgLnNob3dTZWFyY2goZGV0YWlsLm5hbWUsIGRldGFpbC5wcm9wZXJ0eSk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBwb2pvdml6OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhc2hLZXkgPSByZXF1aXJlKCcuL2hhc2hLZXknKTtcblxuZnVuY3Rpb24gSGFzaE1hcCgpIHtcbn1cblxuSGFzaE1hcC5wcm90b3R5cGUgPSB7XG4gIHB1dDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICB0aGlzW2hhc2hLZXkoa2V5KV0gPSAodmFsdWUgfHwga2V5KTtcbiAgfSxcbiAgZ2V0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXNbaGFzaEtleShrZXkpXTtcbiAgfSxcbiAgcmVtb3ZlOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgdmFyIHYgPSB0aGlzW2hhc2hLZXkoa2V5KV07XG4gICAgZGVsZXRlIHRoaXNbaGFzaEtleShrZXkpXTtcbiAgICByZXR1cm4gdjtcbiAgfSxcbiAgZW1wdHk6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcCxcbiAgICAgICAgbWUgPSB0aGlzO1xuICAgIGZvciAocCBpbiBtZSkge1xuICAgICAgaWYgKG1lLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzW3BdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLy8gYWxpYXNcbkhhc2hNYXAucHJvdG90eXBlLnNldCA9IEhhc2hNYXAucHJvdG90eXBlLnB1dDtcblxubW9kdWxlLmV4cG9ydHMgPSBIYXNoTWFwOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vJyk7XG52YXIgbWUsIGhhc2hLZXk7XG4vKipcbiAqIEdldHMgYSBzdG9yZSBoYXNoa2V5IG9ubHkgaWYgaXQncyBhbiBvYmplY3RcbiAqIEBwYXJhbSAge1t0eXBlXX0gb2JqXG4gKiBAcmV0dXJuIHtbdHlwZV19XG4gKi9cbmZ1bmN0aW9uIGdldChvYmopIHtcbiAgYXNzZXJ0KHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbihvYmopLCAnb2JqIG11c3QgYmUgYW4gb2JqZWN0fGZ1bmN0aW9uJyk7XG4gIHJldHVybiBvYmouaGFzT3duUHJvcGVydHkgJiZcbiAgICBvYmouaGFzT3duUHJvcGVydHkobWUuaGlkZGVuS2V5KSAmJlxuICAgIG9ialttZS5oaWRkZW5LZXldO1xufVxuXG4vKipcbiAqIFRPRE86IGRvY3VtZW50XG4gKiBTZXRzIGEga2V5IG9uIGFuIG9iamVjdFxuICogQHBhcmFtIHtbdHlwZV19IG9iaiBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0ge1t0eXBlXX0ga2V5IFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gc2V0KG9iaiwga2V5KSB7XG4gIGFzc2VydCh1dGlscy5pc09iamVjdE9yRnVuY3Rpb24ob2JqKSwgJ29iaiBtdXN0IGJlIGFuIG9iamVjdHxmdW5jdGlvbicpO1xuICBhc3NlcnQoXG4gICAga2V5ICYmIHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnLFxuICAgICdUaGUga2V5IG5lZWRzIHRvIGJlIGEgdmFsaWQgc3RyaW5nJ1xuICApO1xuICBpZiAoIWdldChvYmopKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgbWUuaGlkZGVuS2V5LCB7XG4gICAgICB2YWx1ZTogdHlwZW9mIG9iaiArICctJyArIGtleVxuICAgIH0pO1xuICB9XG4gIHJldHVybiBtZTtcbn1cblxubWUgPSBoYXNoS2V5ID0gZnVuY3Rpb24gKHYpIHtcbiAgdmFyIHVpZCA9IHY7XG4gIGlmICh1dGlscy5pc09iamVjdE9yRnVuY3Rpb24odikpIHtcbiAgICBpZiAoIWdldCh2KSkge1xuICAgICAgbWUuY3JlYXRlSGFzaEtleXNGb3Iodik7XG4gICAgfVxuICAgIHVpZCA9IGdldCh2KTtcbiAgICBpZiAoIXVpZCkge1xuICAgICAgY29uc29sZS5lcnIoJ25vIGhhc2hrZXkgOignLCB2KTtcbiAgICB9XG4gICAgYXNzZXJ0KHVpZCwgJ2Vycm9yIGdldHRpbmcgdGhlIGtleScpO1xuICAgIHJldHVybiB1aWQ7XG4gIH1cblxuICAvLyB2IGlzIGEgcHJpbWl0aXZlXG4gIHJldHVybiB0eXBlb2YgdiArICctJyArIHVpZDtcbn07XG5tZS5oaWRkZW5LZXkgPSAnX19wb2pvVml6S2V5X18nO1xuXG5tZS5jcmVhdGVIYXNoS2V5c0ZvciA9IGZ1bmN0aW9uIChvYmosIG5hbWUpIHtcblxuICBmdW5jdGlvbiBsb2NhbFRvU3RyaW5nKG9iaikge1xuICAgIHZhciBtYXRjaDtcbiAgICB0cnkge1xuICAgICAgbWF0Y2ggPSB7fS50b1N0cmluZy5jYWxsKG9iaikubWF0Y2goL15cXFtvYmplY3QgKFxcUyo/KVxcXS8pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIG1hdGNoID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaCAmJiBtYXRjaFsxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbmFseXplIHRoZSBpbnRlcm5hbCBwcm9wZXJ0eSBbW0NsYXNzXV0gdG8gZ3Vlc3MgdGhlIG5hbWVcbiAgICogb2YgdGhpcyBvYmplY3QsIGUuZy4gW29iamVjdCBEYXRlXSwgW29iamVjdCBNYXRoXVxuICAgKiBNYW55IG9iamVjdCB3aWxsIGdpdmUgZmFsc2UgcG9zaXRpdmVzICh0aGV5IHdpbGwgbWF0Y2ggW29iamVjdCBPYmplY3RdKVxuICAgKiBzbyBsZXQncyBjb25zaWRlciBPYmplY3QgYXMgdGhlIG5hbWUgb25seSBpZiBpdCdzIGVxdWFsIHRvXG4gICAqIE9iamVjdC5wcm90b3R5cGVcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgb2JqXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuICBmdW5jdGlvbiBoYXNBQ2xhc3NOYW1lKG9iaikge1xuICAgIHZhciBtYXRjaCA9IGxvY2FsVG9TdHJpbmcob2JqKTtcbiAgICBpZiAobWF0Y2ggPT09ICdPYmplY3QnKSB7XG4gICAgICByZXR1cm4gb2JqID09PSBPYmplY3QucHJvdG90eXBlICYmICdPYmplY3QnO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2g7XG4gIH1cblxuICBmdW5jdGlvbiBnZXROYW1lKG9iaikge1xuICAgIHZhciBuYW1lLCBjbGFzc05hbWU7XG5cbiAgICAvLyByZXR1cm4gdGhlIGFscmVhZHkgZ2VuZXJhdGVkIGhhc2hLZXlcbiAgICBpZiAoZ2V0KG9iaikpIHtcbiAgICAgIHJldHVybiBnZXQob2JqKTtcbiAgICB9XG5cbiAgICAvLyBnZW5lcmF0ZSBhIG5ldyBrZXkgYmFzZWQgb25cbiAgICAvLyAtIHRoZSBuYW1lIGlmIGl0J3MgYSBmdW5jdGlvblxuICAgIC8vIC0gYSB1bmlxdWUgaWRcbiAgICBuYW1lID0gdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgdHlwZW9mIG9iai5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgb2JqLm5hbWU7XG5cbiAgICBjbGFzc05hbWUgPSBoYXNBQ2xhc3NOYW1lKG9iaik7XG4gICAgaWYgKCFuYW1lICYmIGNsYXNzTmFtZSkge1xuICAgICAgbmFtZSA9IGNsYXNzTmFtZTtcbiAgICB9XG5cbiAgICBuYW1lID0gbmFtZSB8fCBfLnVuaXF1ZUlkKCk7XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cblxuICAvLyB0aGUgbmFtZSBpcyBlcXVhbCB0byB0aGUgcGFzc2VkIG5hbWUgb3IgdGhlXG4gIC8vIGdlbmVyYXRlZCBuYW1lXG4gIG5hbWUgPSBuYW1lIHx8IGdldE5hbWUob2JqKTtcbiAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcLiBdL2ltZywgJy0nKTtcblxuICAvLyBpZiB0aGUgb2JqIGlzIGEgcHJvdG90eXBlIHRoZW4gdHJ5IHRvIGFuYWx5emVcbiAgLy8gdGhlIGNvbnN0cnVjdG9yIGZpcnN0IHNvIHRoYXQgdGhlIHByb3RvdHlwZSBiZWNvbWVzXG4gIC8vIFtuYW1lXS5wcm90b3R5cGVcbiAgLy8gc3BlY2lhbCBjYXNlOiBvYmplY3QuY29uc3RydWN0b3IgPSBvYmplY3RcbiAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eSAmJlxuICAgICAgb2JqLmhhc093blByb3BlcnR5KCdjb25zdHJ1Y3RvcicpICYmXG4gICAgICB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yID09PSAnZnVuY3Rpb24nICYmXG4gICAgICBvYmouY29uc3RydWN0b3IgIT09IG9iaikge1xuICAgIG1lLmNyZWF0ZUhhc2hLZXlzRm9yKG9iai5jb25zdHJ1Y3Rvcik7XG4gIH1cblxuICAvLyBzZXQgbmFtZSBvbiBzZWxmXG4gIHNldChvYmosIG5hbWUpO1xuXG4gIC8vIHNldCBuYW1lIG9uIHRoZSBwcm90b3R5cGVcbiAgaWYgKHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIG9iai5oYXNPd25Qcm9wZXJ0eSgncHJvdG90eXBlJykpIHtcbiAgICBzZXQob2JqLnByb3RvdHlwZSwgbmFtZSArICctcHJvdG90eXBlJyk7XG4gIH1cbn07XG5cbm1lLmhhcyA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB2Lmhhc093blByb3BlcnR5ICYmXG4gICAgdi5oYXNPd25Qcm9wZXJ0eShtZS5oaWRkZW5LZXkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtZTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbmZ1bmN0aW9uIHR5cGUodikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHYpLnNsaWNlKDgsIC0xKTtcbn1cblxudmFyIHV0aWxzID0ge307XG5cbi8qKlxuICogQWZ0ZXIgY2FsbGluZyBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ2Agd2l0aCBgdmAgYXMgdGhlIHNjb3BlXG4gKiB0aGUgcmV0dXJuIHZhbHVlIHdvdWxkIGJlIHRoZSBjb25jYXRlbmF0aW9uIG9mICdbT2JqZWN0ICcsXG4gKiBjbGFzcyBhbmQgJ10nLCBgY2xhc3NgIGlzIHRoZSByZXR1cm5pbmcgdmFsdWUgb2YgdGhpcyBmdW5jdGlvblxuICpcbiAqIGUuZy4gICBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoW10pID09IFtvYmplY3QgQXJyYXldLFxuICogICAgICAgIHRoZSByZXR1cm5pbmcgdmFsdWUgaXMgdGhlIHN0cmluZyBBcnJheVxuICpcbiAqIEBwYXJhbSB7Kn0gdlxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xudXRpbHMuaW50ZXJuYWxDbGFzc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHR5cGUodik7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiBhIGdpdmVuIHZhbHVlIGlzIGEgZnVuY3Rpb24sIHRoZSBsaWJyYXJ5IG9ubHkgbmVlZHNcbiAqIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gZGlmZmVyZW50IGtpbmRzIG9mIHByaW1pdGl2ZSB0eXBlcyAobm8gbmVlZCB0b1xuICogZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2Ygb2JqZWN0cylcbiAqXG4gKiBAcGFyYW0gIHsqfSAgdiBUaGUgdmFsdWUgdG8gYmUgY2hlY2tlZFxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbnV0aWxzLmlzRnVuY3Rpb24gPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gISF2ICYmIHR5cGVvZiB2ID09PSAnZnVuY3Rpb24nO1xufTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYSBnaXZlbiB2YWx1ZSBpcyBhbiBvYmplY3QsIHRoZSBsaWJyYXJ5IG9ubHkgbmVlZHNcbiAqIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gZGlmZmVyZW50IGtpbmRzIG9mIHByaW1pdGl2ZSB0eXBlcyAobm8gbmVlZCB0b1xuICogZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2Ygb2JqZWN0cylcbiAqXG4gKiBOT1RFOiBhIGZ1bmN0aW9uIHdpbGwgbm90IHBhc3MgdGhpcyB0ZXN0XG4gKiBpLmUuXG4gKiAgICAgICAgdXRpbHMuaXNPYmplY3QoZnVuY3Rpb24oKSB7fSkgaXMgZmFsc2UhXG4gKlxuICogU3BlY2lhbCB2YWx1ZXMgd2hvc2UgYHR5cGVvZmAgcmVzdWx0cyBpbiBhbiBvYmplY3Q6XG4gKiAtIG51bGxcbiAqXG4gKiBAcGFyYW0gIHsqfSAgdiBUaGUgdmFsdWUgdG8gYmUgY2hlY2tlZFxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbnV0aWxzLmlzT2JqZWN0ID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuICEhdiAmJiB0eXBlb2YgdiA9PT0gJ29iamVjdCc7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYW4gb2JqZWN0IG9yIGEgZnVuY3Rpb24gKG5vdGUgdGhhdCBmb3IgdGhlIHNha2VcbiAqIG9mIHRoZSBsaWJyYXJ5IEFycmF5cyBhcmUgbm90IG9iamVjdHMpXG4gKlxuICogQHBhcmFtIHsqfSB2XG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHV0aWxzLmlzT2JqZWN0KHYpIHx8IHV0aWxzLmlzRnVuY3Rpb24odik7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICpcbiAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgdHJhdmVyc2FibGUsIGZvciB0aGUgc2FrZSBvZiB0aGUgbGlicmFyeSBhblxuICogb2JqZWN0ICh3aGljaCBpcyBub3QgYW4gYXJyYXkpIG9yIGEgZnVuY3Rpb24gaXMgdHJhdmVyc2FibGUsIHNpbmNlIHRoaXMgZnVuY3Rpb25cbiAqIGlzIHVzZWQgYnkgdGhlIG9iamVjdCBhbmFseXplciBvdmVycmlkaW5nIGl0IHdpbGwgZGV0ZXJtaW5lIHdoaWNoIG9iamVjdHNcbiAqIGFyZSB0cmF2ZXJzYWJsZVxuICpcbiAqIEBwYXJhbSB7Kn0gdlxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbnV0aWxzLmlzVHJhdmVyc2FibGUgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKHYpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgc3BlY2lhbCBmdW5jdGlvbiB3aGljaCBpcyBhYmxlIHRvIGV4ZWN1dGUgYSBzZXJpZXMgb2YgZnVuY3Rpb25zIHRocm91Z2hcbiAqIGNoYWluaW5nLCB0byBydW4gYWxsIHRoZSBmdW5jdGlvbnMgc3RvcmVkIGluIHRoZSBjaGFpbiBleGVjdXRlIHRoZSByZXN1bHRpbmcgdmFsdWVcbiAqXG4gKiAtIGVhY2ggZnVuY3Rpb24gaXMgaW52b2tlZCB3aXRoIHRoZSBvcmlnaW5hbCBhcmd1bWVudHMgd2hpY2ggYGZ1bmN0aW9uQ2hhaW5gIHdhc1xuICogaW52b2tlZCB3aXRoICsgdGhlIHJlc3VsdGluZyB2YWx1ZSBvZiB0aGUgbGFzdCBvcGVyYXRpb24gYXMgdGhlIGxhc3QgYXJndW1lbnRcbiAqIC0gdGhlIHNjb3BlIG9mIGVhY2ggZnVuY3Rpb24gaXMgdGhlIHNhbWUgc2NvcGUgYXMgdGhlIG9uZSB0aGF0IHRoZSByZXN1bHRpbmdcbiAqIGZ1bmN0aW9uIHdpbGwgaGF2ZVxuICpcbiAqICAgIHZhciBmbnMgPSB1dGlscy5mdW5jdGlvbkNoYWluKClcbiAqICAgICAgICAgICAgICAgIC5jaGFpbihmdW5jdGlvbiAoYSwgYikge1xuICogICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhhLCBiKTtcbiAqICAgICAgICAgICAgICAgICAgcmV0dXJuICdmaXJzdCc7XG4gKiAgICAgICAgICAgICAgICB9KVxuICogICAgICAgICAgICAgICAgLmNoYWluKGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gKiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGEsIGIsIGMpO1xuICogICAgICAgICAgICAgICAgICByZXR1cm4gJ3NlY29uZDtcbiAqICAgICAgICAgICAgICAgIH0pXG4gKiAgICBmbnMoMSwgMik7ICAvLyByZXR1cm5zICdzZWNvbmQnXG4gKiAgICAvLyBsb2dzIDEsIDJcbiAqICAgIC8vIGxvZ3MgMSwgMiwgJ2ZpcnN0J1xuICpcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAqL1xudXRpbHMuZnVuY3Rpb25DaGFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHN0YWNrID0gW107XG4gIHZhciBpbm5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIHZhbHVlID0gbnVsbDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YWNrLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICB2YWx1ZSA9IHN0YWNrW2ldLmFwcGx5KHRoaXMsIGFyZ3MuY29uY2F0KHZhbHVlKSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcbiAgaW5uZXIuY2hhaW4gPSBmdW5jdGlvbiAodikge1xuICAgIHN0YWNrLnB1c2godik7XG4gICAgcmV0dXJuIGlubmVyO1xuICB9O1xuICByZXR1cm4gaW5uZXI7XG59O1xuXG51dGlscy5jcmVhdGVFdmVudCA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGRldGFpbHMpIHtcbiAgcmV0dXJuIG5ldyBDdXN0b21FdmVudChldmVudE5hbWUsIHtcbiAgICBkZXRhaWw6IGRldGFpbHNcbiAgfSk7XG59O1xudXRpbHMubm90aWZpY2F0aW9uID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGNvbnNvbGVUb28pIHtcbiAgdmFyIGV2ID0gdXRpbHMuY3JlYXRlRXZlbnQoJ3Bvam92aXotbm90aWZpY2F0aW9uJywgbWVzc2FnZSk7XG4gIGNvbnNvbGVUb28gJiYgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXYpO1xufTtcbnV0aWxzLmNyZWF0ZUpzb25wQ2FsbGJhY2sgPSBmdW5jdGlvbiAodXJsKSB7XG4gIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgc2NyaXB0LnNyYyA9IHVybDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqXG4gKiBHaXZlbiBhIHByb3BlcnR5IG5hbWUgdGhpcyBtZXRob2QgaWRlbnRpZmllcyBpZiBpdCdzIGEgdmFsaWQgcHJvcGVydHkgZm9yIHRoZSBzYWtlXG4gKiBvZiB0aGUgbGlicmFyeSwgYSB2YWxpZCBwcm9wZXJ0eSBpcyBhIHByb3BlcnR5IHdoaWNoIGRvZXMgbm90IHByb3Zva2UgYW4gZXJyb3JcbiAqIHdoZW4gdHJ5aW5nIHRvIGFjY2VzcyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byBpdCBmcm9tIGFueSBvYmplY3RcbiAqXG4gKiBGb3IgZXhhbXBsZSBleGVjdXRpbmcgdGhlIGZvbGxvd2luZyBjb2RlIGluIHN0cmljdCBtb2RlIHdpbGwgeWllbGQgYW4gZXJyb3I6XG4gKlxuICogICAgdmFyIGZuID0gZnVuY3Rpb24oKSB7fTtcbiAqICAgIGZuLmFyZ3VtZW50c1xuICpcbiAqIFNpbmNlIGFyZ3VtZW50cyBpcyBwcm9oaWJpdGVkIGluIHN0cmljdCBtb2RlXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9TdHJpY3RfbW9kZVxuICpcbiAqXG4gKlxuICogQHBhcmFtIHtPYmplY3R8RnVuY3Rpb259IG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gKi9cbnV0aWxzLm9iamVjdFByb3BlcnR5SXNGb3JiaWRkZW4gPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICB2YXIga2V5O1xuICB2YXIgcnVsZXMgPSB1dGlscy5wcm9wZXJ0eUZvcmJpZGRlblJ1bGVzO1xuICBmb3IgKGtleSBpbiBydWxlcykge1xuICAgIGlmIChydWxlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBpZiAocnVsZXNba2V5XShvYmplY3QsIHByb3BlcnR5KSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqXG4gKiBNb2RpZnkgdGhpcyBvYmplY3QgdG8gYWRkL3JlbW92ZSBydWxlcyB0aGF0IHdpbCBiZSBydW4gYnlcbiAqICNvYmplY3RQcm9wZXJ0eUlzRm9yYmlkZGVuLCB0byBkZXRlcm1pbmUgaWYgYSBwcm9wZXJ0eSBpcyBpbnZhbGlkXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xudXRpbHMucHJvcGVydHlGb3JiaWRkZW5SdWxlcyA9IHtcbiAgLyoqXG4gICAqIGBjYWxsZXJgIGFuZCBgYXJndW1lbnRzYCBhcmUgaW52YWxpZCBwcm9wZXJ0aWVzIG9mIGEgZnVuY3Rpb24gaW4gc3RyaWN0IG1vZGVcbiAgICogQHBhcmFtIHsqfSBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgc3RyaWN0TW9kZTogZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBpZiAodXRpbHMuaXNGdW5jdGlvbihvYmplY3QpKSB7XG4gICAgICByZXR1cm4gcHJvcGVydHkgPT09ICdjYWxsZXInIHx8IHByb3BlcnR5ID09PSAnYXJndW1lbnRzJztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBQcm9wZXJ0aWVzIHRoYXQgc3RhcnQgYW5kIGVuZCB3aXRoIF9fIGFyZSBzcGVjaWFsIHByb3BlcnRpZXMsXG4gICAqIGluIHNvbWUgY2FzZXMgdGhleSBhcmUgdmFsaWQgKGxpa2UgX19wcm90b19fKSBvciBkZXByZWNhdGVkXG4gICAqIGxpa2UgX19kZWZpbmVHZXR0ZXJfX1xuICAgKlxuICAgKiBlLmcuXG4gICAqICAtIE9iamVjdC5wcm90b3R5cGUuX19wcm90b19fXG4gICAqICAtIE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVHZXR0ZXJfX1xuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lU2V0dGVyX19cbiAgICogIC0gT2JqZWN0LnByb3RvdHlwZS5fX2xvb2t1cEdldHRlcl9fXG4gICAqICAtIE9iamVjdC5wcm90b3R5cGUuX19sb29rdXBTZXR0ZXJfX1xuICAgKlxuICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBoaWRkZW5Qcm9wZXJ0eTogZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICByZXR1cm4gcHJvcGVydHkuc2VhcmNoKC9eX18uKj9fXyQvKSA+IC0xO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBbmd1bGFyIGhpZGRlbiBwcm9wZXJ0aWVzIHN0YXJ0IGFuZCBlbmQgd2l0aCAkJCwgZm9yIHRoZSBzYWtlXG4gICAqIG9mIHRoZSBsaWJyYXJ5IHRoZXNlIGFyZSBpbnZhbGlkIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIHsqfSBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgYW5ndWxhckhpZGRlblByb3BlcnR5OiBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIHJldHVybiBwcm9wZXJ0eS5zZWFyY2goL15cXCRcXCQuKj9cXCRcXCQkLykgPiAtMTtcbiAgfSxcblxuICAvKipcbiAgICogVGhlIHByb3BlcnRpZXMgdGhhdCBoYXZlIHRoZSBmb2xsb3dpbmcgc3ltYm9scyBhcmUgZm9yYmlkZGVuOlxuICAgKiBbOit+IT48PS8vXFxbXFxdQFxcLiBdXG4gICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIHN5bWJvbHM6IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIHByb3BlcnR5LnNlYXJjaCgvWzorfiE+PD0vL1xcW1xcXUBcXC4gXS8pID4gLTE7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbHM7Il19
(16)
});
