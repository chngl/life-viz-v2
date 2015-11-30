(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/changfb/Documents/life-viz-v2/node_modules/browserify/node_modules/events/events.js":[function(require,module,exports){
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

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],"/Users/changfb/Documents/life-viz-v2/node_modules/browserify/node_modules/process/browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

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

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],"/Users/changfb/Documents/life-viz-v2/node_modules/classnames/index.js":[function(require,module,exports){
/*!
  Copyright (c) 2015 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

(function () {
	'use strict';

	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = '';

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes += ' ' + arg;
			} else if (Array.isArray(arg)) {
				classes += ' ' + classNames.apply(null, arg);
			} else if (argType === 'object') {
				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes += ' ' + key;
					}
				}
			}
		}

		return classes.substr(1);
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = classNames;
	} else if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		// register as 'classnames', consistent with npm package name
		define('classnames', [], function () {
			return classNames;
		});
	} else {
		window.classNames = classNames;
	}
}());

},{}],"/Users/changfb/Documents/life-viz-v2/node_modules/d3/d3.js":[function(require,module,exports){
!function() {
  var d3 = {
    version: "3.5.10"
  };
  var d3_arraySlice = [].slice, d3_array = function(list) {
    return d3_arraySlice.call(list);
  };
  var d3_document = this.document;
  function d3_documentElement(node) {
    return node && (node.ownerDocument || node.document || node).documentElement;
  }
  function d3_window(node) {
    return node && (node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView);
  }
  if (d3_document) {
    try {
      d3_array(d3_document.documentElement.childNodes)[0].nodeType;
    } catch (e) {
      d3_array = function(list) {
        var i = list.length, array = new Array(i);
        while (i--) array[i] = list[i];
        return array;
      };
    }
  }
  if (!Date.now) Date.now = function() {
    return +new Date();
  };
  if (d3_document) {
    try {
      d3_document.createElement("DIV").style.setProperty("opacity", 0, "");
    } catch (error) {
      var d3_element_prototype = this.Element.prototype, d3_element_setAttribute = d3_element_prototype.setAttribute, d3_element_setAttributeNS = d3_element_prototype.setAttributeNS, d3_style_prototype = this.CSSStyleDeclaration.prototype, d3_style_setProperty = d3_style_prototype.setProperty;
      d3_element_prototype.setAttribute = function(name, value) {
        d3_element_setAttribute.call(this, name, value + "");
      };
      d3_element_prototype.setAttributeNS = function(space, local, value) {
        d3_element_setAttributeNS.call(this, space, local, value + "");
      };
      d3_style_prototype.setProperty = function(name, value, priority) {
        d3_style_setProperty.call(this, name, value + "", priority);
      };
    }
  }
  d3.ascending = d3_ascending;
  function d3_ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }
  d3.descending = function(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  };
  d3.min = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
    }
    return a;
  };
  d3.max = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
    }
    return a;
  };
  d3.extent = function(array, f) {
    var i = -1, n = array.length, a, b, c;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = c = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = c = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
    return [ a, c ];
  };
  function d3_number(x) {
    return x === null ? NaN : +x;
  }
  function d3_numeric(x) {
    return !isNaN(x);
  }
  d3.sum = function(array, f) {
    var s = 0, n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = +array[i])) s += a;
    } else {
      while (++i < n) if (d3_numeric(a = +f.call(array, array[i], i))) s += a;
    }
    return s;
  };
  d3.mean = function(array, f) {
    var s = 0, n = array.length, a, i = -1, j = n;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = d3_number(array[i]))) s += a; else --j;
    } else {
      while (++i < n) if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) s += a; else --j;
    }
    if (j) return s / j;
  };
  d3.quantile = function(values, p) {
    var H = (values.length - 1) * p + 1, h = Math.floor(H), v = +values[h - 1], e = H - h;
    return e ? v + e * (values[h] - v) : v;
  };
  d3.median = function(array, f) {
    var numbers = [], n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = d3_number(array[i]))) numbers.push(a);
    } else {
      while (++i < n) if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) numbers.push(a);
    }
    if (numbers.length) return d3.quantile(numbers.sort(d3_ascending), .5);
  };
  d3.variance = function(array, f) {
    var n = array.length, m = 0, a, d, s = 0, i = -1, j = 0;
    if (arguments.length === 1) {
      while (++i < n) {
        if (d3_numeric(a = d3_number(array[i]))) {
          d = a - m;
          m += d / ++j;
          s += d * (a - m);
        }
      }
    } else {
      while (++i < n) {
        if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) {
          d = a - m;
          m += d / ++j;
          s += d * (a - m);
        }
      }
    }
    if (j > 1) return s / (j - 1);
  };
  d3.deviation = function() {
    var v = d3.variance.apply(this, arguments);
    return v ? Math.sqrt(v) : v;
  };
  function d3_bisector(compare) {
    return {
      left: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1; else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid; else lo = mid + 1;
        }
        return lo;
      }
    };
  }
  var d3_bisect = d3_bisector(d3_ascending);
  d3.bisectLeft = d3_bisect.left;
  d3.bisect = d3.bisectRight = d3_bisect.right;
  d3.bisector = function(f) {
    return d3_bisector(f.length === 1 ? function(d, x) {
      return d3_ascending(f(d), x);
    } : f);
  };
  d3.shuffle = function(array, i0, i1) {
    if ((m = arguments.length) < 3) {
      i1 = array.length;
      if (m < 2) i0 = 0;
    }
    var m = i1 - i0, t, i;
    while (m) {
      i = Math.random() * m-- | 0;
      t = array[m + i0], array[m + i0] = array[i + i0], array[i + i0] = t;
    }
    return array;
  };
  d3.permute = function(array, indexes) {
    var i = indexes.length, permutes = new Array(i);
    while (i--) permutes[i] = array[indexes[i]];
    return permutes;
  };
  d3.pairs = function(array) {
    var i = 0, n = array.length - 1, p0, p1 = array[0], pairs = new Array(n < 0 ? 0 : n);
    while (i < n) pairs[i] = [ p0 = p1, p1 = array[++i] ];
    return pairs;
  };
  d3.zip = function() {
    if (!(n = arguments.length)) return [];
    for (var i = -1, m = d3.min(arguments, d3_zipLength), zips = new Array(m); ++i < m; ) {
      for (var j = -1, n, zip = zips[i] = new Array(n); ++j < n; ) {
        zip[j] = arguments[j][i];
      }
    }
    return zips;
  };
  function d3_zipLength(d) {
    return d.length;
  }
  d3.transpose = function(matrix) {
    return d3.zip.apply(d3, matrix);
  };
  d3.keys = function(map) {
    var keys = [];
    for (var key in map) keys.push(key);
    return keys;
  };
  d3.values = function(map) {
    var values = [];
    for (var key in map) values.push(map[key]);
    return values;
  };
  d3.entries = function(map) {
    var entries = [];
    for (var key in map) entries.push({
      key: key,
      value: map[key]
    });
    return entries;
  };
  d3.merge = function(arrays) {
    var n = arrays.length, m, i = -1, j = 0, merged, array;
    while (++i < n) j += arrays[i].length;
    merged = new Array(j);
    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }
    return merged;
  };
  var abs = Math.abs;
  d3.range = function(start, stop, step) {
    if (arguments.length < 3) {
      step = 1;
      if (arguments.length < 2) {
        stop = start;
        start = 0;
      }
    }
    if ((stop - start) / step === Infinity) throw new Error("infinite range");
    var range = [], k = d3_range_integerScale(abs(step)), i = -1, j;
    start *= k, stop *= k, step *= k;
    if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k); else while ((j = start + step * ++i) < stop) range.push(j / k);
    return range;
  };
  function d3_range_integerScale(x) {
    var k = 1;
    while (x * k % 1) k *= 10;
    return k;
  }
  function d3_class(ctor, properties) {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  }
  d3.map = function(object, f) {
    var map = new d3_Map();
    if (object instanceof d3_Map) {
      object.forEach(function(key, value) {
        map.set(key, value);
      });
    } else if (Array.isArray(object)) {
      var i = -1, n = object.length, o;
      if (arguments.length === 1) while (++i < n) map.set(i, object[i]); else while (++i < n) map.set(f.call(object, o = object[i], i), o);
    } else {
      for (var key in object) map.set(key, object[key]);
    }
    return map;
  };
  function d3_Map() {
    this._ = Object.create(null);
  }
  var d3_map_proto = "__proto__", d3_map_zero = "\x00";
  d3_class(d3_Map, {
    has: d3_map_has,
    get: function(key) {
      return this._[d3_map_escape(key)];
    },
    set: function(key, value) {
      return this._[d3_map_escape(key)] = value;
    },
    remove: d3_map_remove,
    keys: d3_map_keys,
    values: function() {
      var values = [];
      for (var key in this._) values.push(this._[key]);
      return values;
    },
    entries: function() {
      var entries = [];
      for (var key in this._) entries.push({
        key: d3_map_unescape(key),
        value: this._[key]
      });
      return entries;
    },
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this._) f.call(this, d3_map_unescape(key), this._[key]);
    }
  });
  function d3_map_escape(key) {
    return (key += "") === d3_map_proto || key[0] === d3_map_zero ? d3_map_zero + key : key;
  }
  function d3_map_unescape(key) {
    return (key += "")[0] === d3_map_zero ? key.slice(1) : key;
  }
  function d3_map_has(key) {
    return d3_map_escape(key) in this._;
  }
  function d3_map_remove(key) {
    return (key = d3_map_escape(key)) in this._ && delete this._[key];
  }
  function d3_map_keys() {
    var keys = [];
    for (var key in this._) keys.push(d3_map_unescape(key));
    return keys;
  }
  function d3_map_size() {
    var size = 0;
    for (var key in this._) ++size;
    return size;
  }
  function d3_map_empty() {
    for (var key in this._) return false;
    return true;
  }
  d3.nest = function() {
    var nest = {}, keys = [], sortKeys = [], sortValues, rollup;
    function map(mapType, array, depth) {
      if (depth >= keys.length) return rollup ? rollup.call(nest, array) : sortValues ? array.sort(sortValues) : array;
      var i = -1, n = array.length, key = keys[depth++], keyValue, object, setter, valuesByKey = new d3_Map(), values;
      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(object = array[i]))) {
          values.push(object);
        } else {
          valuesByKey.set(keyValue, [ object ]);
        }
      }
      if (mapType) {
        object = mapType();
        setter = function(keyValue, values) {
          object.set(keyValue, map(mapType, values, depth));
        };
      } else {
        object = {};
        setter = function(keyValue, values) {
          object[keyValue] = map(mapType, values, depth);
        };
      }
      valuesByKey.forEach(setter);
      return object;
    }
    function entries(map, depth) {
      if (depth >= keys.length) return map;
      var array = [], sortKey = sortKeys[depth++];
      map.forEach(function(key, keyMap) {
        array.push({
          key: key,
          values: entries(keyMap, depth)
        });
      });
      return sortKey ? array.sort(function(a, b) {
        return sortKey(a.key, b.key);
      }) : array;
    }
    nest.map = function(array, mapType) {
      return map(mapType, array, 0);
    };
    nest.entries = function(array) {
      return entries(map(d3.map, array, 0), 0);
    };
    nest.key = function(d) {
      keys.push(d);
      return nest;
    };
    nest.sortKeys = function(order) {
      sortKeys[keys.length - 1] = order;
      return nest;
    };
    nest.sortValues = function(order) {
      sortValues = order;
      return nest;
    };
    nest.rollup = function(f) {
      rollup = f;
      return nest;
    };
    return nest;
  };
  d3.set = function(array) {
    var set = new d3_Set();
    if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);
    return set;
  };
  function d3_Set() {
    this._ = Object.create(null);
  }
  d3_class(d3_Set, {
    has: d3_map_has,
    add: function(key) {
      this._[d3_map_escape(key += "")] = true;
      return key;
    },
    remove: d3_map_remove,
    values: d3_map_keys,
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this._) f.call(this, d3_map_unescape(key));
    }
  });
  d3.behavior = {};
  function d3_identity(d) {
    return d;
  }
  d3.rebind = function(target, source) {
    var i = 1, n = arguments.length, method;
    while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
    return target;
  };
  function d3_rebind(target, source, method) {
    return function() {
      var value = method.apply(source, arguments);
      return value === source ? target : value;
    };
  }
  function d3_vendorSymbol(object, name) {
    if (name in object) return name;
    name = name.charAt(0).toUpperCase() + name.slice(1);
    for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
      var prefixName = d3_vendorPrefixes[i] + name;
      if (prefixName in object) return prefixName;
    }
  }
  var d3_vendorPrefixes = [ "webkit", "ms", "moz", "Moz", "o", "O" ];
  function d3_noop() {}
  d3.dispatch = function() {
    var dispatch = new d3_dispatch(), i = -1, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    return dispatch;
  };
  function d3_dispatch() {}
  d3_dispatch.prototype.on = function(type, listener) {
    var i = type.indexOf("."), name = "";
    if (i >= 0) {
      name = type.slice(i + 1);
      type = type.slice(0, i);
    }
    if (type) return arguments.length < 2 ? this[type].on(name) : this[type].on(name, listener);
    if (arguments.length === 2) {
      if (listener == null) for (type in this) {
        if (this.hasOwnProperty(type)) this[type].on(name, null);
      }
      return this;
    }
  };
  function d3_dispatch_event(dispatch) {
    var listeners = [], listenerByName = new d3_Map();
    function event() {
      var z = listeners, i = -1, n = z.length, l;
      while (++i < n) if (l = z[i].on) l.apply(this, arguments);
      return dispatch;
    }
    event.on = function(name, listener) {
      var l = listenerByName.get(name), i;
      if (arguments.length < 2) return l && l.on;
      if (l) {
        l.on = null;
        listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
        listenerByName.remove(name);
      }
      if (listener) listeners.push(listenerByName.set(name, {
        on: listener
      }));
      return dispatch;
    };
    return event;
  }
  d3.event = null;
  function d3_eventPreventDefault() {
    d3.event.preventDefault();
  }
  function d3_eventSource() {
    var e = d3.event, s;
    while (s = e.sourceEvent) e = s;
    return e;
  }
  function d3_eventDispatch(target) {
    var dispatch = new d3_dispatch(), i = 0, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    dispatch.of = function(thiz, argumentz) {
      return function(e1) {
        try {
          var e0 = e1.sourceEvent = d3.event;
          e1.target = target;
          d3.event = e1;
          dispatch[e1.type].apply(thiz, argumentz);
        } finally {
          d3.event = e0;
        }
      };
    };
    return dispatch;
  }
  d3.requote = function(s) {
    return s.replace(d3_requote_re, "\\$&");
  };
  var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  var d3_subclass = {}.__proto__ ? function(object, prototype) {
    object.__proto__ = prototype;
  } : function(object, prototype) {
    for (var property in prototype) object[property] = prototype[property];
  };
  function d3_selection(groups) {
    d3_subclass(groups, d3_selectionPrototype);
    return groups;
  }
  var d3_select = function(s, n) {
    return n.querySelector(s);
  }, d3_selectAll = function(s, n) {
    return n.querySelectorAll(s);
  }, d3_selectMatches = function(n, s) {
    var d3_selectMatcher = n.matches || n[d3_vendorSymbol(n, "matchesSelector")];
    d3_selectMatches = function(n, s) {
      return d3_selectMatcher.call(n, s);
    };
    return d3_selectMatches(n, s);
  };
  if (typeof Sizzle === "function") {
    d3_select = function(s, n) {
      return Sizzle(s, n)[0] || null;
    };
    d3_selectAll = Sizzle;
    d3_selectMatches = Sizzle.matchesSelector;
  }
  d3.selection = function() {
    return d3.select(d3_document.documentElement);
  };
  var d3_selectionPrototype = d3.selection.prototype = [];
  d3_selectionPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, group, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(subnode = selector.call(node, node.__data__, i, j));
          if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selector(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_select(selector, this);
    };
  }
  d3_selectionPrototype.selectAll = function(selector) {
    var subgroups = [], subgroup, node;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
          subgroup.parentNode = node;
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selectorAll(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_selectAll(selector, this);
    };
  }
  var d3_nsPrefix = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: "http://www.w3.org/1999/xhtml",
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };
  d3.ns = {
    prefix: d3_nsPrefix,
    qualify: function(name) {
      var i = name.indexOf(":"), prefix = name;
      if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
      return d3_nsPrefix.hasOwnProperty(prefix) ? {
        space: d3_nsPrefix[prefix],
        local: name
      } : name;
    }
  };
  d3_selectionPrototype.attr = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node();
        name = d3.ns.qualify(name);
        return name.local ? node.getAttributeNS(name.space, name.local) : node.getAttribute(name);
      }
      for (value in name) this.each(d3_selection_attr(value, name[value]));
      return this;
    }
    return this.each(d3_selection_attr(name, value));
  };
  function d3_selection_attr(name, value) {
    name = d3.ns.qualify(name);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrConstant() {
      this.setAttribute(name, value);
    }
    function attrConstantNS() {
      this.setAttributeNS(name.space, name.local, value);
    }
    function attrFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttribute(name); else this.setAttribute(name, x);
    }
    function attrFunctionNS() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttributeNS(name.space, name.local); else this.setAttributeNS(name.space, name.local, x);
    }
    return value == null ? name.local ? attrNullNS : attrNull : typeof value === "function" ? name.local ? attrFunctionNS : attrFunction : name.local ? attrConstantNS : attrConstant;
  }
  function d3_collapse(s) {
    return s.trim().replace(/\s+/g, " ");
  }
  d3_selectionPrototype.classed = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node(), n = (name = d3_selection_classes(name)).length, i = -1;
        if (value = node.classList) {
          while (++i < n) if (!value.contains(name[i])) return false;
        } else {
          value = node.getAttribute("class");
          while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
        }
        return true;
      }
      for (value in name) this.each(d3_selection_classed(value, name[value]));
      return this;
    }
    return this.each(d3_selection_classed(name, value));
  };
  function d3_selection_classedRe(name) {
    return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
  }
  function d3_selection_classes(name) {
    return (name + "").trim().split(/^|\s+/);
  }
  function d3_selection_classed(name, value) {
    name = d3_selection_classes(name).map(d3_selection_classedName);
    var n = name.length;
    function classedConstant() {
      var i = -1;
      while (++i < n) name[i](this, value);
    }
    function classedFunction() {
      var i = -1, x = value.apply(this, arguments);
      while (++i < n) name[i](this, x);
    }
    return typeof value === "function" ? classedFunction : classedConstant;
  }
  function d3_selection_classedName(name) {
    var re = d3_selection_classedRe(name);
    return function(node, value) {
      if (c = node.classList) return value ? c.add(name) : c.remove(name);
      var c = node.getAttribute("class") || "";
      if (value) {
        re.lastIndex = 0;
        if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
      } else {
        node.setAttribute("class", d3_collapse(c.replace(re, " ")));
      }
    };
  }
  d3_selectionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
        return this;
      }
      if (n < 2) {
        var node = this.node();
        return d3_window(node).getComputedStyle(node, null).getPropertyValue(name);
      }
      priority = "";
    }
    return this.each(d3_selection_style(name, value, priority));
  };
  function d3_selection_style(name, value, priority) {
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleConstant() {
      this.style.setProperty(name, value, priority);
    }
    function styleFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.style.removeProperty(name); else this.style.setProperty(name, x, priority);
    }
    return value == null ? styleNull : typeof value === "function" ? styleFunction : styleConstant;
  }
  d3_selectionPrototype.property = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") return this.node()[name];
      for (value in name) this.each(d3_selection_property(value, name[value]));
      return this;
    }
    return this.each(d3_selection_property(name, value));
  };
  function d3_selection_property(name, value) {
    function propertyNull() {
      delete this[name];
    }
    function propertyConstant() {
      this[name] = value;
    }
    function propertyFunction() {
      var x = value.apply(this, arguments);
      if (x == null) delete this[name]; else this[name] = x;
    }
    return value == null ? propertyNull : typeof value === "function" ? propertyFunction : propertyConstant;
  }
  d3_selectionPrototype.text = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    } : value == null ? function() {
      this.textContent = "";
    } : function() {
      this.textContent = value;
    }) : this.node().textContent;
  };
  d3_selectionPrototype.html = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    } : value == null ? function() {
      this.innerHTML = "";
    } : function() {
      this.innerHTML = value;
    }) : this.node().innerHTML;
  };
  d3_selectionPrototype.append = function(name) {
    name = d3_selection_creator(name);
    return this.select(function() {
      return this.appendChild(name.apply(this, arguments));
    });
  };
  function d3_selection_creator(name) {
    function create() {
      var document = this.ownerDocument, namespace = this.namespaceURI;
      return namespace ? document.createElementNS(namespace, name) : document.createElement(name);
    }
    function createNS() {
      return this.ownerDocument.createElementNS(name.space, name.local);
    }
    return typeof name === "function" ? name : (name = d3.ns.qualify(name)).local ? createNS : create;
  }
  d3_selectionPrototype.insert = function(name, before) {
    name = d3_selection_creator(name);
    before = d3_selection_selector(before);
    return this.select(function() {
      return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);
    });
  };
  d3_selectionPrototype.remove = function() {
    return this.each(d3_selectionRemove);
  };
  function d3_selectionRemove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }
  d3_selectionPrototype.data = function(value, key) {
    var i = -1, n = this.length, group, node;
    if (!arguments.length) {
      value = new Array(n = (group = this[0]).length);
      while (++i < n) {
        if (node = group[i]) {
          value[i] = node.__data__;
        }
      }
      return value;
    }
    function bind(group, groupData) {
      var i, n = group.length, m = groupData.length, n0 = Math.min(n, m), updateNodes = new Array(m), enterNodes = new Array(m), exitNodes = new Array(n), node, nodeData;
      if (key) {
        var nodeByKeyValue = new d3_Map(), keyValues = new Array(n), keyValue;
        for (i = -1; ++i < n; ) {
          if (node = group[i]) {
            if (nodeByKeyValue.has(keyValue = key.call(node, node.__data__, i))) {
              exitNodes[i] = node;
            } else {
              nodeByKeyValue.set(keyValue, node);
            }
            keyValues[i] = keyValue;
          }
        }
        for (i = -1; ++i < m; ) {
          if (!(node = nodeByKeyValue.get(keyValue = key.call(groupData, nodeData = groupData[i], i)))) {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          } else if (node !== true) {
            updateNodes[i] = node;
            node.__data__ = nodeData;
          }
          nodeByKeyValue.set(keyValue, true);
        }
        for (i = -1; ++i < n; ) {
          if (i in keyValues && nodeByKeyValue.get(keyValues[i]) !== true) {
            exitNodes[i] = group[i];
          }
        }
      } else {
        for (i = -1; ++i < n0; ) {
          node = group[i];
          nodeData = groupData[i];
          if (node) {
            node.__data__ = nodeData;
            updateNodes[i] = node;
          } else {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          }
        }
        for (;i < m; ++i) {
          enterNodes[i] = d3_selection_dataNode(groupData[i]);
        }
        for (;i < n; ++i) {
          exitNodes[i] = group[i];
        }
      }
      enterNodes.update = updateNodes;
      enterNodes.parentNode = updateNodes.parentNode = exitNodes.parentNode = group.parentNode;
      enter.push(enterNodes);
      update.push(updateNodes);
      exit.push(exitNodes);
    }
    var enter = d3_selection_enter([]), update = d3_selection([]), exit = d3_selection([]);
    if (typeof value === "function") {
      while (++i < n) {
        bind(group = this[i], value.call(group, group.parentNode.__data__, i));
      }
    } else {
      while (++i < n) {
        bind(group = this[i], value);
      }
    }
    update.enter = function() {
      return enter;
    };
    update.exit = function() {
      return exit;
    };
    return update;
  };
  function d3_selection_dataNode(data) {
    return {
      __data__: data
    };
  }
  d3_selectionPrototype.datum = function(value) {
    return arguments.length ? this.property("__data__", value) : this.property("__data__");
  };
  d3_selectionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_filter(selector) {
    return function() {
      return d3_selectMatches(this, selector);
    };
  }
  d3_selectionPrototype.order = function() {
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
        if (node = group[i]) {
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }
    return this;
  };
  d3_selectionPrototype.sort = function(comparator) {
    comparator = d3_selection_sortComparator.apply(this, arguments);
    for (var j = -1, m = this.length; ++j < m; ) this[j].sort(comparator);
    return this.order();
  };
  function d3_selection_sortComparator(comparator) {
    if (!arguments.length) comparator = d3_ascending;
    return function(a, b) {
      return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
    };
  }
  d3_selectionPrototype.each = function(callback) {
    return d3_selection_each(this, function(node, i, j) {
      callback.call(node, node.__data__, i, j);
    });
  };
  function d3_selection_each(groups, callback) {
    for (var j = 0, m = groups.length; j < m; j++) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
        if (node = group[i]) callback(node, i, j);
      }
    }
    return groups;
  }
  d3_selectionPrototype.call = function(callback) {
    var args = d3_array(arguments);
    callback.apply(args[0] = this, args);
    return this;
  };
  d3_selectionPrototype.empty = function() {
    return !this.node();
  };
  d3_selectionPrototype.node = function() {
    for (var j = 0, m = this.length; j < m; j++) {
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        var node = group[i];
        if (node) return node;
      }
    }
    return null;
  };
  d3_selectionPrototype.size = function() {
    var n = 0;
    d3_selection_each(this, function() {
      ++n;
    });
    return n;
  };
  function d3_selection_enter(selection) {
    d3_subclass(selection, d3_selection_enterPrototype);
    return selection;
  }
  var d3_selection_enterPrototype = [];
  d3.selection.enter = d3_selection_enter;
  d3.selection.enter.prototype = d3_selection_enterPrototype;
  d3_selection_enterPrototype.append = d3_selectionPrototype.append;
  d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
  d3_selection_enterPrototype.node = d3_selectionPrototype.node;
  d3_selection_enterPrototype.call = d3_selectionPrototype.call;
  d3_selection_enterPrototype.size = d3_selectionPrototype.size;
  d3_selection_enterPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, upgroup, group, node;
    for (var j = -1, m = this.length; ++j < m; ) {
      upgroup = (group = this[j]).update;
      subgroups.push(subgroup = []);
      subgroup.parentNode = group.parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
          subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  d3_selection_enterPrototype.insert = function(name, before) {
    if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
    return d3_selectionPrototype.insert.call(this, name, before);
  };
  function d3_selection_enterInsertBefore(enter) {
    var i0, j0;
    return function(d, i, j) {
      var group = enter[j].update, n = group.length, node;
      if (j != j0) j0 = j, i0 = 0;
      if (i >= i0) i0 = i + 1;
      while (!(node = group[i0]) && ++i0 < n) ;
      return node;
    };
  }
  d3.select = function(node) {
    var group;
    if (typeof node === "string") {
      group = [ d3_select(node, d3_document) ];
      group.parentNode = d3_document.documentElement;
    } else {
      group = [ node ];
      group.parentNode = d3_documentElement(node);
    }
    return d3_selection([ group ]);
  };
  d3.selectAll = function(nodes) {
    var group;
    if (typeof nodes === "string") {
      group = d3_array(d3_selectAll(nodes, d3_document));
      group.parentNode = d3_document.documentElement;
    } else {
      group = d3_array(nodes);
      group.parentNode = null;
    }
    return d3_selection([ group ]);
  };
  d3_selectionPrototype.on = function(type, listener, capture) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof type !== "string") {
        if (n < 2) listener = false;
        for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
        return this;
      }
      if (n < 2) return (n = this.node()["__on" + type]) && n._;
      capture = false;
    }
    return this.each(d3_selection_on(type, listener, capture));
  };
  function d3_selection_on(type, listener, capture) {
    var name = "__on" + type, i = type.indexOf("."), wrap = d3_selection_onListener;
    if (i > 0) type = type.slice(0, i);
    var filter = d3_selection_onFilters.get(type);
    if (filter) type = filter, wrap = d3_selection_onFilter;
    function onRemove() {
      var l = this[name];
      if (l) {
        this.removeEventListener(type, l, l.$);
        delete this[name];
      }
    }
    function onAdd() {
      var l = wrap(listener, d3_array(arguments));
      onRemove.call(this);
      this.addEventListener(type, this[name] = l, l.$ = capture);
      l._ = listener;
    }
    function removeAll() {
      var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"), match;
      for (var name in this) {
        if (match = name.match(re)) {
          var l = this[name];
          this.removeEventListener(match[1], l, l.$);
          delete this[name];
        }
      }
    }
    return i ? listener ? onAdd : onRemove : listener ? d3_noop : removeAll;
  }
  var d3_selection_onFilters = d3.map({
    mouseenter: "mouseover",
    mouseleave: "mouseout"
  });
  if (d3_document) {
    d3_selection_onFilters.forEach(function(k) {
      if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
    });
  }
  function d3_selection_onListener(listener, argumentz) {
    return function(e) {
      var o = d3.event;
      d3.event = e;
      argumentz[0] = this.__data__;
      try {
        listener.apply(this, argumentz);
      } finally {
        d3.event = o;
      }
    };
  }
  function d3_selection_onFilter(listener, argumentz) {
    var l = d3_selection_onListener(listener, argumentz);
    return function(e) {
      var target = this, related = e.relatedTarget;
      if (!related || related !== target && !(related.compareDocumentPosition(target) & 8)) {
        l.call(target, e);
      }
    };
  }
  var d3_event_dragSelect, d3_event_dragId = 0;
  function d3_event_dragSuppress(node) {
    var name = ".dragsuppress-" + ++d3_event_dragId, click = "click" + name, w = d3.select(d3_window(node)).on("touchmove" + name, d3_eventPreventDefault).on("dragstart" + name, d3_eventPreventDefault).on("selectstart" + name, d3_eventPreventDefault);
    if (d3_event_dragSelect == null) {
      d3_event_dragSelect = "onselectstart" in node ? false : d3_vendorSymbol(node.style, "userSelect");
    }
    if (d3_event_dragSelect) {
      var style = d3_documentElement(node).style, select = style[d3_event_dragSelect];
      style[d3_event_dragSelect] = "none";
    }
    return function(suppressClick) {
      w.on(name, null);
      if (d3_event_dragSelect) style[d3_event_dragSelect] = select;
      if (suppressClick) {
        var off = function() {
          w.on(click, null);
        };
        w.on(click, function() {
          d3_eventPreventDefault();
          off();
        }, true);
        setTimeout(off, 0);
      }
    };
  }
  d3.mouse = function(container) {
    return d3_mousePoint(container, d3_eventSource());
  };
  var d3_mouse_bug44083 = this.navigator && /WebKit/.test(this.navigator.userAgent) ? -1 : 0;
  function d3_mousePoint(container, e) {
    if (e.changedTouches) e = e.changedTouches[0];
    var svg = container.ownerSVGElement || container;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      if (d3_mouse_bug44083 < 0) {
        var window = d3_window(container);
        if (window.scrollX || window.scrollY) {
          svg = d3.select("body").append("svg").style({
            position: "absolute",
            top: 0,
            left: 0,
            margin: 0,
            padding: 0,
            border: "none"
          }, "important");
          var ctm = svg[0][0].getScreenCTM();
          d3_mouse_bug44083 = !(ctm.f || ctm.e);
          svg.remove();
        }
      }
      if (d3_mouse_bug44083) point.x = e.pageX, point.y = e.pageY; else point.x = e.clientX, 
      point.y = e.clientY;
      point = point.matrixTransform(container.getScreenCTM().inverse());
      return [ point.x, point.y ];
    }
    var rect = container.getBoundingClientRect();
    return [ e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop ];
  }
  d3.touch = function(container, touches, identifier) {
    if (arguments.length < 3) identifier = touches, touches = d3_eventSource().changedTouches;
    if (touches) for (var i = 0, n = touches.length, touch; i < n; ++i) {
      if ((touch = touches[i]).identifier === identifier) {
        return d3_mousePoint(container, touch);
      }
    }
  };
  d3.behavior.drag = function() {
    var event = d3_eventDispatch(drag, "drag", "dragstart", "dragend"), origin = null, mousedown = dragstart(d3_noop, d3.mouse, d3_window, "mousemove", "mouseup"), touchstart = dragstart(d3_behavior_dragTouchId, d3.touch, d3_identity, "touchmove", "touchend");
    function drag() {
      this.on("mousedown.drag", mousedown).on("touchstart.drag", touchstart);
    }
    function dragstart(id, position, subject, move, end) {
      return function() {
        var that = this, target = d3.event.target, parent = that.parentNode, dispatch = event.of(that, arguments), dragged = 0, dragId = id(), dragName = ".drag" + (dragId == null ? "" : "-" + dragId), dragOffset, dragSubject = d3.select(subject(target)).on(move + dragName, moved).on(end + dragName, ended), dragRestore = d3_event_dragSuppress(target), position0 = position(parent, dragId);
        if (origin) {
          dragOffset = origin.apply(that, arguments);
          dragOffset = [ dragOffset.x - position0[0], dragOffset.y - position0[1] ];
        } else {
          dragOffset = [ 0, 0 ];
        }
        dispatch({
          type: "dragstart"
        });
        function moved() {
          var position1 = position(parent, dragId), dx, dy;
          if (!position1) return;
          dx = position1[0] - position0[0];
          dy = position1[1] - position0[1];
          dragged |= dx | dy;
          position0 = position1;
          dispatch({
            type: "drag",
            x: position1[0] + dragOffset[0],
            y: position1[1] + dragOffset[1],
            dx: dx,
            dy: dy
          });
        }
        function ended() {
          if (!position(parent, dragId)) return;
          dragSubject.on(move + dragName, null).on(end + dragName, null);
          dragRestore(dragged);
          dispatch({
            type: "dragend"
          });
        }
      };
    }
    drag.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return drag;
    };
    return d3.rebind(drag, event, "on");
  };
  function d3_behavior_dragTouchId() {
    return d3.event.changedTouches[0].identifier;
  }
  d3.touches = function(container, touches) {
    if (arguments.length < 2) touches = d3_eventSource().touches;
    return touches ? d3_array(touches).map(function(touch) {
      var point = d3_mousePoint(container, touch);
      point.identifier = touch.identifier;
      return point;
    }) : [];
  };
  var ε = 1e-6, ε2 = ε * ε, π = Math.PI, τ = 2 * π, τε = τ - ε, halfπ = π / 2, d3_radians = π / 180, d3_degrees = 180 / π;
  function d3_sgn(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  }
  function d3_cross2d(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }
  function d3_acos(x) {
    return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
  }
  function d3_asin(x) {
    return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
  }
  function d3_sinh(x) {
    return ((x = Math.exp(x)) - 1 / x) / 2;
  }
  function d3_cosh(x) {
    return ((x = Math.exp(x)) + 1 / x) / 2;
  }
  function d3_tanh(x) {
    return ((x = Math.exp(2 * x)) - 1) / (x + 1);
  }
  function d3_haversin(x) {
    return (x = Math.sin(x / 2)) * x;
  }
  var ρ = Math.SQRT2, ρ2 = 2, ρ4 = 4;
  d3.interpolateZoom = function(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2], dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, i, S;
    if (d2 < ε2) {
      S = Math.log(w1 / w0) / ρ;
      i = function(t) {
        return [ ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(ρ * t * S) ];
      };
    } else {
      var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + ρ4 * d2) / (2 * w0 * ρ2 * d1), b1 = (w1 * w1 - w0 * w0 - ρ4 * d2) / (2 * w1 * ρ2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / ρ;
      i = function(t) {
        var s = t * S, coshr0 = d3_cosh(r0), u = w0 / (ρ2 * d1) * (coshr0 * d3_tanh(ρ * s + r0) - d3_sinh(r0));
        return [ ux0 + u * dx, uy0 + u * dy, w0 * coshr0 / d3_cosh(ρ * s + r0) ];
      };
    }
    i.duration = S * 1e3;
    return i;
  };
  d3.behavior.zoom = function() {
    var view = {
      x: 0,
      y: 0,
      k: 1
    }, translate0, center0, center, size = [ 960, 500 ], scaleExtent = d3_behavior_zoomInfinity, duration = 250, zooming = 0, mousedown = "mousedown.zoom", mousemove = "mousemove.zoom", mouseup = "mouseup.zoom", mousewheelTimer, touchstart = "touchstart.zoom", touchtime, event = d3_eventDispatch(zoom, "zoomstart", "zoom", "zoomend"), x0, x1, y0, y1;
    if (!d3_behavior_zoomWheel) {
      d3_behavior_zoomWheel = "onwheel" in d3_document ? (d3_behavior_zoomDelta = function() {
        return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1);
      }, "wheel") : "onmousewheel" in d3_document ? (d3_behavior_zoomDelta = function() {
        return d3.event.wheelDelta;
      }, "mousewheel") : (d3_behavior_zoomDelta = function() {
        return -d3.event.detail;
      }, "MozMousePixelScroll");
    }
    function zoom(g) {
      g.on(mousedown, mousedowned).on(d3_behavior_zoomWheel + ".zoom", mousewheeled).on("dblclick.zoom", dblclicked).on(touchstart, touchstarted);
    }
    zoom.event = function(g) {
      g.each(function() {
        var dispatch = event.of(this, arguments), view1 = view;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.zoom", function() {
            view = this.__chart__ || {
              x: 0,
              y: 0,
              k: 1
            };
            zoomstarted(dispatch);
          }).tween("zoom:zoom", function() {
            var dx = size[0], dy = size[1], cx = center0 ? center0[0] : dx / 2, cy = center0 ? center0[1] : dy / 2, i = d3.interpolateZoom([ (cx - view.x) / view.k, (cy - view.y) / view.k, dx / view.k ], [ (cx - view1.x) / view1.k, (cy - view1.y) / view1.k, dx / view1.k ]);
            return function(t) {
              var l = i(t), k = dx / l[2];
              this.__chart__ = view = {
                x: cx - l[0] * k,
                y: cy - l[1] * k,
                k: k
              };
              zoomed(dispatch);
            };
          }).each("interrupt.zoom", function() {
            zoomended(dispatch);
          }).each("end.zoom", function() {
            zoomended(dispatch);
          });
        } else {
          this.__chart__ = view;
          zoomstarted(dispatch);
          zoomed(dispatch);
          zoomended(dispatch);
        }
      });
    };
    zoom.translate = function(_) {
      if (!arguments.length) return [ view.x, view.y ];
      view = {
        x: +_[0],
        y: +_[1],
        k: view.k
      };
      rescale();
      return zoom;
    };
    zoom.scale = function(_) {
      if (!arguments.length) return view.k;
      view = {
        x: view.x,
        y: view.y,
        k: null
      };
      scaleTo(+_);
      rescale();
      return zoom;
    };
    zoom.scaleExtent = function(_) {
      if (!arguments.length) return scaleExtent;
      scaleExtent = _ == null ? d3_behavior_zoomInfinity : [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.center = function(_) {
      if (!arguments.length) return center;
      center = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.size = function(_) {
      if (!arguments.length) return size;
      size = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.duration = function(_) {
      if (!arguments.length) return duration;
      duration = +_;
      return zoom;
    };
    zoom.x = function(z) {
      if (!arguments.length) return x1;
      x1 = z;
      x0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    zoom.y = function(z) {
      if (!arguments.length) return y1;
      y1 = z;
      y0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    function location(p) {
      return [ (p[0] - view.x) / view.k, (p[1] - view.y) / view.k ];
    }
    function point(l) {
      return [ l[0] * view.k + view.x, l[1] * view.k + view.y ];
    }
    function scaleTo(s) {
      view.k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
    }
    function translateTo(p, l) {
      l = point(l);
      view.x += p[0] - l[0];
      view.y += p[1] - l[1];
    }
    function zoomTo(that, p, l, k) {
      that.__chart__ = {
        x: view.x,
        y: view.y,
        k: view.k
      };
      scaleTo(Math.pow(2, k));
      translateTo(center0 = p, l);
      that = d3.select(that);
      if (duration > 0) that = that.transition().duration(duration);
      that.call(zoom.event);
    }
    function rescale() {
      if (x1) x1.domain(x0.range().map(function(x) {
        return (x - view.x) / view.k;
      }).map(x0.invert));
      if (y1) y1.domain(y0.range().map(function(y) {
        return (y - view.y) / view.k;
      }).map(y0.invert));
    }
    function zoomstarted(dispatch) {
      if (!zooming++) dispatch({
        type: "zoomstart"
      });
    }
    function zoomed(dispatch) {
      rescale();
      dispatch({
        type: "zoom",
        scale: view.k,
        translate: [ view.x, view.y ]
      });
    }
    function zoomended(dispatch) {
      if (!--zooming) dispatch({
        type: "zoomend"
      }), center0 = null;
    }
    function mousedowned() {
      var that = this, dispatch = event.of(that, arguments), dragged = 0, subject = d3.select(d3_window(that)).on(mousemove, moved).on(mouseup, ended), location0 = location(d3.mouse(that)), dragRestore = d3_event_dragSuppress(that);
      d3_selection_interrupt.call(that);
      zoomstarted(dispatch);
      function moved() {
        dragged = 1;
        translateTo(d3.mouse(that), location0);
        zoomed(dispatch);
      }
      function ended() {
        subject.on(mousemove, null).on(mouseup, null);
        dragRestore(dragged);
        zoomended(dispatch);
      }
    }
    function touchstarted() {
      var that = this, dispatch = event.of(that, arguments), locations0 = {}, distance0 = 0, scale0, zoomName = ".zoom-" + d3.event.changedTouches[0].identifier, touchmove = "touchmove" + zoomName, touchend = "touchend" + zoomName, targets = [], subject = d3.select(that), dragRestore = d3_event_dragSuppress(that);
      started();
      zoomstarted(dispatch);
      subject.on(mousedown, null).on(touchstart, started);
      function relocate() {
        var touches = d3.touches(that);
        scale0 = view.k;
        touches.forEach(function(t) {
          if (t.identifier in locations0) locations0[t.identifier] = location(t);
        });
        return touches;
      }
      function started() {
        var target = d3.event.target;
        d3.select(target).on(touchmove, moved).on(touchend, ended);
        targets.push(target);
        var changed = d3.event.changedTouches;
        for (var i = 0, n = changed.length; i < n; ++i) {
          locations0[changed[i].identifier] = null;
        }
        var touches = relocate(), now = Date.now();
        if (touches.length === 1) {
          if (now - touchtime < 500) {
            var p = touches[0];
            zoomTo(that, p, locations0[p.identifier], Math.floor(Math.log(view.k) / Math.LN2) + 1);
            d3_eventPreventDefault();
          }
          touchtime = now;
        } else if (touches.length > 1) {
          var p = touches[0], q = touches[1], dx = p[0] - q[0], dy = p[1] - q[1];
          distance0 = dx * dx + dy * dy;
        }
      }
      function moved() {
        var touches = d3.touches(that), p0, l0, p1, l1;
        d3_selection_interrupt.call(that);
        for (var i = 0, n = touches.length; i < n; ++i, l1 = null) {
          p1 = touches[i];
          if (l1 = locations0[p1.identifier]) {
            if (l0) break;
            p0 = p1, l0 = l1;
          }
        }
        if (l1) {
          var distance1 = (distance1 = p1[0] - p0[0]) * distance1 + (distance1 = p1[1] - p0[1]) * distance1, scale1 = distance0 && Math.sqrt(distance1 / distance0);
          p0 = [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ];
          l0 = [ (l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2 ];
          scaleTo(scale1 * scale0);
        }
        touchtime = null;
        translateTo(p0, l0);
        zoomed(dispatch);
      }
      function ended() {
        if (d3.event.touches.length) {
          var changed = d3.event.changedTouches;
          for (var i = 0, n = changed.length; i < n; ++i) {
            delete locations0[changed[i].identifier];
          }
          for (var identifier in locations0) {
            return void relocate();
          }
        }
        d3.selectAll(targets).on(zoomName, null);
        subject.on(mousedown, mousedowned).on(touchstart, touchstarted);
        dragRestore();
        zoomended(dispatch);
      }
    }
    function mousewheeled() {
      var dispatch = event.of(this, arguments);
      if (mousewheelTimer) clearTimeout(mousewheelTimer); else d3_selection_interrupt.call(this), 
      translate0 = location(center0 = center || d3.mouse(this)), zoomstarted(dispatch);
      mousewheelTimer = setTimeout(function() {
        mousewheelTimer = null;
        zoomended(dispatch);
      }, 50);
      d3_eventPreventDefault();
      scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * view.k);
      translateTo(center0, translate0);
      zoomed(dispatch);
    }
    function dblclicked() {
      var p = d3.mouse(this), k = Math.log(view.k) / Math.LN2;
      zoomTo(this, p, location(p), d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1);
    }
    return d3.rebind(zoom, event, "on");
  };
  var d3_behavior_zoomInfinity = [ 0, Infinity ], d3_behavior_zoomDelta, d3_behavior_zoomWheel;
  d3.color = d3_color;
  function d3_color() {}
  d3_color.prototype.toString = function() {
    return this.rgb() + "";
  };
  d3.hsl = d3_hsl;
  function d3_hsl(h, s, l) {
    return this instanceof d3_hsl ? void (this.h = +h, this.s = +s, this.l = +l) : arguments.length < 2 ? h instanceof d3_hsl ? new d3_hsl(h.h, h.s, h.l) : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl) : new d3_hsl(h, s, l);
  }
  var d3_hslPrototype = d3_hsl.prototype = new d3_color();
  d3_hslPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_hsl(this.h, this.s, this.l / k);
  };
  d3_hslPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_hsl(this.h, this.s, k * this.l);
  };
  d3_hslPrototype.rgb = function() {
    return d3_hsl_rgb(this.h, this.s, this.l);
  };
  function d3_hsl_rgb(h, s, l) {
    var m1, m2;
    h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
    s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
    l = l < 0 ? 0 : l > 1 ? 1 : l;
    m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
    m1 = 2 * l - m2;
    function v(h) {
      if (h > 360) h -= 360; else if (h < 0) h += 360;
      if (h < 60) return m1 + (m2 - m1) * h / 60;
      if (h < 180) return m2;
      if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
      return m1;
    }
    function vv(h) {
      return Math.round(v(h) * 255);
    }
    return new d3_rgb(vv(h + 120), vv(h), vv(h - 120));
  }
  d3.hcl = d3_hcl;
  function d3_hcl(h, c, l) {
    return this instanceof d3_hcl ? void (this.h = +h, this.c = +c, this.l = +l) : arguments.length < 2 ? h instanceof d3_hcl ? new d3_hcl(h.h, h.c, h.l) : h instanceof d3_lab ? d3_lab_hcl(h.l, h.a, h.b) : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b) : new d3_hcl(h, c, l);
  }
  var d3_hclPrototype = d3_hcl.prototype = new d3_color();
  d3_hclPrototype.brighter = function(k) {
    return new d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.darker = function(k) {
    return new d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.rgb = function() {
    return d3_hcl_lab(this.h, this.c, this.l).rgb();
  };
  function d3_hcl_lab(h, c, l) {
    if (isNaN(h)) h = 0;
    if (isNaN(c)) c = 0;
    return new d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
  }
  d3.lab = d3_lab;
  function d3_lab(l, a, b) {
    return this instanceof d3_lab ? void (this.l = +l, this.a = +a, this.b = +b) : arguments.length < 2 ? l instanceof d3_lab ? new d3_lab(l.l, l.a, l.b) : l instanceof d3_hcl ? d3_hcl_lab(l.h, l.c, l.l) : d3_rgb_lab((l = d3_rgb(l)).r, l.g, l.b) : new d3_lab(l, a, b);
  }
  var d3_lab_K = 18;
  var d3_lab_X = .95047, d3_lab_Y = 1, d3_lab_Z = 1.08883;
  var d3_labPrototype = d3_lab.prototype = new d3_color();
  d3_labPrototype.brighter = function(k) {
    return new d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.darker = function(k) {
    return new d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.rgb = function() {
    return d3_lab_rgb(this.l, this.a, this.b);
  };
  function d3_lab_rgb(l, a, b) {
    var y = (l + 16) / 116, x = y + a / 500, z = y - b / 200;
    x = d3_lab_xyz(x) * d3_lab_X;
    y = d3_lab_xyz(y) * d3_lab_Y;
    z = d3_lab_xyz(z) * d3_lab_Z;
    return new d3_rgb(d3_xyz_rgb(3.2404542 * x - 1.5371385 * y - .4985314 * z), d3_xyz_rgb(-.969266 * x + 1.8760108 * y + .041556 * z), d3_xyz_rgb(.0556434 * x - .2040259 * y + 1.0572252 * z));
  }
  function d3_lab_hcl(l, a, b) {
    return l > 0 ? new d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l) : new d3_hcl(NaN, NaN, l);
  }
  function d3_lab_xyz(x) {
    return x > .206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
  }
  function d3_xyz_lab(x) {
    return x > .008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
  }
  function d3_xyz_rgb(r) {
    return Math.round(255 * (r <= .00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - .055));
  }
  d3.rgb = d3_rgb;
  function d3_rgb(r, g, b) {
    return this instanceof d3_rgb ? void (this.r = ~~r, this.g = ~~g, this.b = ~~b) : arguments.length < 2 ? r instanceof d3_rgb ? new d3_rgb(r.r, r.g, r.b) : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb) : new d3_rgb(r, g, b);
  }
  function d3_rgbNumber(value) {
    return new d3_rgb(value >> 16, value >> 8 & 255, value & 255);
  }
  function d3_rgbString(value) {
    return d3_rgbNumber(value) + "";
  }
  var d3_rgbPrototype = d3_rgb.prototype = new d3_color();
  d3_rgbPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    var r = this.r, g = this.g, b = this.b, i = 30;
    if (!r && !g && !b) return new d3_rgb(i, i, i);
    if (r && r < i) r = i;
    if (g && g < i) g = i;
    if (b && b < i) b = i;
    return new d3_rgb(Math.min(255, r / k), Math.min(255, g / k), Math.min(255, b / k));
  };
  d3_rgbPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_rgb(k * this.r, k * this.g, k * this.b);
  };
  d3_rgbPrototype.hsl = function() {
    return d3_rgb_hsl(this.r, this.g, this.b);
  };
  d3_rgbPrototype.toString = function() {
    return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
  };
  function d3_rgb_hex(v) {
    return v < 16 ? "0" + Math.max(0, v).toString(16) : Math.min(255, v).toString(16);
  }
  function d3_rgb_parse(format, rgb, hsl) {
    var r = 0, g = 0, b = 0, m1, m2, color;
    m1 = /([a-z]+)\((.*)\)/.exec(format = format.toLowerCase());
    if (m1) {
      m2 = m1[2].split(",");
      switch (m1[1]) {
       case "hsl":
        {
          return hsl(parseFloat(m2[0]), parseFloat(m2[1]) / 100, parseFloat(m2[2]) / 100);
        }

       case "rgb":
        {
          return rgb(d3_rgb_parseNumber(m2[0]), d3_rgb_parseNumber(m2[1]), d3_rgb_parseNumber(m2[2]));
        }
      }
    }
    if (color = d3_rgb_names.get(format)) {
      return rgb(color.r, color.g, color.b);
    }
    if (format != null && format.charAt(0) === "#" && !isNaN(color = parseInt(format.slice(1), 16))) {
      if (format.length === 4) {
        r = (color & 3840) >> 4;
        r = r >> 4 | r;
        g = color & 240;
        g = g >> 4 | g;
        b = color & 15;
        b = b << 4 | b;
      } else if (format.length === 7) {
        r = (color & 16711680) >> 16;
        g = (color & 65280) >> 8;
        b = color & 255;
      }
    }
    return rgb(r, g, b);
  }
  function d3_rgb_hsl(r, g, b) {
    var min = Math.min(r /= 255, g /= 255, b /= 255), max = Math.max(r, g, b), d = max - min, h, s, l = (max + min) / 2;
    if (d) {
      s = l < .5 ? d / (max + min) : d / (2 - max - min);
      if (r == max) h = (g - b) / d + (g < b ? 6 : 0); else if (g == max) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60;
    } else {
      h = NaN;
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new d3_hsl(h, s, l);
  }
  function d3_rgb_lab(r, g, b) {
    r = d3_rgb_xyz(r);
    g = d3_rgb_xyz(g);
    b = d3_rgb_xyz(b);
    var x = d3_xyz_lab((.4124564 * r + .3575761 * g + .1804375 * b) / d3_lab_X), y = d3_xyz_lab((.2126729 * r + .7151522 * g + .072175 * b) / d3_lab_Y), z = d3_xyz_lab((.0193339 * r + .119192 * g + .9503041 * b) / d3_lab_Z);
    return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
  }
  function d3_rgb_xyz(r) {
    return (r /= 255) <= .04045 ? r / 12.92 : Math.pow((r + .055) / 1.055, 2.4);
  }
  function d3_rgb_parseNumber(c) {
    var f = parseFloat(c);
    return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
  }
  var d3_rgb_names = d3.map({
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  });
  d3_rgb_names.forEach(function(key, value) {
    d3_rgb_names.set(key, d3_rgbNumber(value));
  });
  function d3_functor(v) {
    return typeof v === "function" ? v : function() {
      return v;
    };
  }
  d3.functor = d3_functor;
  d3.xhr = d3_xhrType(d3_identity);
  function d3_xhrType(response) {
    return function(url, mimeType, callback) {
      if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, 
      mimeType = null;
      return d3_xhr(url, mimeType, response, callback);
    };
  }
  function d3_xhr(url, mimeType, response, callback) {
    var xhr = {}, dispatch = d3.dispatch("beforesend", "progress", "load", "error"), headers = {}, request = new XMLHttpRequest(), responseType = null;
    if (this.XDomainRequest && !("withCredentials" in request) && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest();
    "onload" in request ? request.onload = request.onerror = respond : request.onreadystatechange = function() {
      request.readyState > 3 && respond();
    };
    function respond() {
      var status = request.status, result;
      if (!status && d3_xhrHasResponse(request) || status >= 200 && status < 300 || status === 304) {
        try {
          result = response.call(xhr, request);
        } catch (e) {
          dispatch.error.call(xhr, e);
          return;
        }
        dispatch.load.call(xhr, result);
      } else {
        dispatch.error.call(xhr, request);
      }
    }
    request.onprogress = function(event) {
      var o = d3.event;
      d3.event = event;
      try {
        dispatch.progress.call(xhr, request);
      } finally {
        d3.event = o;
      }
    };
    xhr.header = function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers[name];
      if (value == null) delete headers[name]; else headers[name] = value + "";
      return xhr;
    };
    xhr.mimeType = function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return xhr;
    };
    xhr.responseType = function(value) {
      if (!arguments.length) return responseType;
      responseType = value;
      return xhr;
    };
    xhr.response = function(value) {
      response = value;
      return xhr;
    };
    [ "get", "post" ].forEach(function(method) {
      xhr[method] = function() {
        return xhr.send.apply(xhr, [ method ].concat(d3_array(arguments)));
      };
    });
    xhr.send = function(method, data, callback) {
      if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
      request.open(method, url, true);
      if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
      if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
      if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
      if (responseType != null) request.responseType = responseType;
      if (callback != null) xhr.on("error", callback).on("load", function(request) {
        callback(null, request);
      });
      dispatch.beforesend.call(xhr, request);
      request.send(data == null ? null : data);
      return xhr;
    };
    xhr.abort = function() {
      request.abort();
      return xhr;
    };
    d3.rebind(xhr, dispatch, "on");
    return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
  }
  function d3_xhr_fixCallback(callback) {
    return callback.length === 1 ? function(error, request) {
      callback(error == null ? request : null);
    } : callback;
  }
  function d3_xhrHasResponse(request) {
    var type = request.responseType;
    return type && type !== "text" ? request.response : request.responseText;
  }
  d3.dsv = function(delimiter, mimeType) {
    var reFormat = new RegExp('["' + delimiter + "\n]"), delimiterCode = delimiter.charCodeAt(0);
    function dsv(url, row, callback) {
      if (arguments.length < 3) callback = row, row = null;
      var xhr = d3_xhr(url, mimeType, row == null ? response : typedResponse(row), callback);
      xhr.row = function(_) {
        return arguments.length ? xhr.response((row = _) == null ? response : typedResponse(_)) : row;
      };
      return xhr;
    }
    function response(request) {
      return dsv.parse(request.responseText);
    }
    function typedResponse(f) {
      return function(request) {
        return dsv.parse(request.responseText, f);
      };
    }
    dsv.parse = function(text, f) {
      var o;
      return dsv.parseRows(text, function(row, i) {
        if (o) return o(row, i - 1);
        var a = new Function("d", "return {" + row.map(function(name, i) {
          return JSON.stringify(name) + ": d[" + i + "]";
        }).join(",") + "}");
        o = f ? function(row, i) {
          return f(a(row), i);
        } : a;
      });
    };
    dsv.parseRows = function(text, f) {
      var EOL = {}, EOF = {}, rows = [], N = text.length, I = 0, n = 0, t, eol;
      function token() {
        if (I >= N) return EOF;
        if (eol) return eol = false, EOL;
        var j = I;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          var c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.slice(j + 1, i).replace(/""/g, '"');
        }
        while (I < N) {
          var c = text.charCodeAt(I++), k = 1;
          if (c === 10) eol = true; else if (c === 13) {
            eol = true;
            if (text.charCodeAt(I) === 10) ++I, ++k;
          } else if (c !== delimiterCode) continue;
          return text.slice(j, I - k);
        }
        return text.slice(j);
      }
      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && (a = f(a, n++)) == null) continue;
        rows.push(a);
      }
      return rows;
    };
    dsv.format = function(rows) {
      if (Array.isArray(rows[0])) return dsv.formatRows(rows);
      var fieldSet = new d3_Set(), fields = [];
      rows.forEach(function(row) {
        for (var field in row) {
          if (!fieldSet.has(field)) {
            fields.push(fieldSet.add(field));
          }
        }
      });
      return [ fields.map(formatValue).join(delimiter) ].concat(rows.map(function(row) {
        return fields.map(function(field) {
          return formatValue(row[field]);
        }).join(delimiter);
      })).join("\n");
    };
    dsv.formatRows = function(rows) {
      return rows.map(formatRow).join("\n");
    };
    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }
    function formatValue(text) {
      return reFormat.test(text) ? '"' + text.replace(/\"/g, '""') + '"' : text;
    }
    return dsv;
  };
  d3.csv = d3.dsv(",", "text/csv");
  d3.tsv = d3.dsv("	", "text/tab-separated-values");
  var d3_timer_queueHead, d3_timer_queueTail, d3_timer_interval, d3_timer_timeout, d3_timer_frame = this[d3_vendorSymbol(this, "requestAnimationFrame")] || function(callback) {
    setTimeout(callback, 17);
  };
  d3.timer = function() {
    d3_timer.apply(this, arguments);
  };
  function d3_timer(callback, delay, then) {
    var n = arguments.length;
    if (n < 2) delay = 0;
    if (n < 3) then = Date.now();
    var time = then + delay, timer = {
      c: callback,
      t: time,
      n: null
    };
    if (d3_timer_queueTail) d3_timer_queueTail.n = timer; else d3_timer_queueHead = timer;
    d3_timer_queueTail = timer;
    if (!d3_timer_interval) {
      d3_timer_timeout = clearTimeout(d3_timer_timeout);
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
    return timer;
  }
  function d3_timer_step() {
    var now = d3_timer_mark(), delay = d3_timer_sweep() - now;
    if (delay > 24) {
      if (isFinite(delay)) {
        clearTimeout(d3_timer_timeout);
        d3_timer_timeout = setTimeout(d3_timer_step, delay);
      }
      d3_timer_interval = 0;
    } else {
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  }
  d3.timer.flush = function() {
    d3_timer_mark();
    d3_timer_sweep();
  };
  function d3_timer_mark() {
    var now = Date.now(), timer = d3_timer_queueHead;
    while (timer) {
      if (now >= timer.t && timer.c(now - timer.t)) timer.c = null;
      timer = timer.n;
    }
    return now;
  }
  function d3_timer_sweep() {
    var t0, t1 = d3_timer_queueHead, time = Infinity;
    while (t1) {
      if (t1.c) {
        if (t1.t < time) time = t1.t;
        t1 = (t0 = t1).n;
      } else {
        t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
      }
    }
    d3_timer_queueTail = t0;
    return time;
  }
  function d3_format_precision(x, p) {
    return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
  }
  d3.round = function(x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
  };
  var d3_formatPrefixes = [ "y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y" ].map(d3_formatPrefix);
  d3.formatPrefix = function(value, precision) {
    var i = 0;
    if (value = +value) {
      if (value < 0) value *= -1;
      if (precision) value = d3.round(value, d3_format_precision(value, precision));
      i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
      i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
    }
    return d3_formatPrefixes[8 + i / 3];
  };
  function d3_formatPrefix(d, i) {
    var k = Math.pow(10, abs(8 - i) * 3);
    return {
      scale: i > 8 ? function(d) {
        return d / k;
      } : function(d) {
        return d * k;
      },
      symbol: d
    };
  }
  function d3_locale_numberFormat(locale) {
    var locale_decimal = locale.decimal, locale_thousands = locale.thousands, locale_grouping = locale.grouping, locale_currency = locale.currency, formatGroup = locale_grouping && locale_thousands ? function(value, width) {
      var i = value.length, t = [], j = 0, g = locale_grouping[0], length = 0;
      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = locale_grouping[j = (j + 1) % locale_grouping.length];
      }
      return t.reverse().join(locale_thousands);
    } : d3_identity;
    return function(specifier) {
      var match = d3_format_re.exec(specifier), fill = match[1] || " ", align = match[2] || ">", sign = match[3] || "-", symbol = match[4] || "", zfill = match[5], width = +match[6], comma = match[7], precision = match[8], type = match[9], scale = 1, prefix = "", suffix = "", integer = false, exponent = true;
      if (precision) precision = +precision.substring(1);
      if (zfill || fill === "0" && align === "=") {
        zfill = fill = "0";
        align = "=";
      }
      switch (type) {
       case "n":
        comma = true;
        type = "g";
        break;

       case "%":
        scale = 100;
        suffix = "%";
        type = "f";
        break;

       case "p":
        scale = 100;
        suffix = "%";
        type = "r";
        break;

       case "b":
       case "o":
       case "x":
       case "X":
        if (symbol === "#") prefix = "0" + type.toLowerCase();

       case "c":
        exponent = false;

       case "d":
        integer = true;
        precision = 0;
        break;

       case "s":
        scale = -1;
        type = "r";
        break;
      }
      if (symbol === "$") prefix = locale_currency[0], suffix = locale_currency[1];
      if (type == "r" && !precision) type = "g";
      if (precision != null) {
        if (type == "g") precision = Math.max(1, Math.min(21, precision)); else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
      }
      type = d3_format_types.get(type) || d3_format_typeDefault;
      var zcomma = zfill && comma;
      return function(value) {
        var fullSuffix = suffix;
        if (integer && value % 1) return "";
        var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign === "-" ? "" : sign;
        if (scale < 0) {
          var unit = d3.formatPrefix(value, precision);
          value = unit.scale(value);
          fullSuffix = unit.symbol + suffix;
        } else {
          value *= scale;
        }
        value = type(value, precision);
        var i = value.lastIndexOf("."), before, after;
        if (i < 0) {
          var j = exponent ? value.lastIndexOf("e") : -1;
          if (j < 0) before = value, after = ""; else before = value.substring(0, j), after = value.substring(j);
        } else {
          before = value.substring(0, i);
          after = locale_decimal + value.substring(i + 1);
        }
        if (!zfill && comma) before = formatGroup(before, Infinity);
        var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length), padding = length < width ? new Array(length = width - length + 1).join(fill) : "";
        if (zcomma) before = formatGroup(padding + before, padding.length ? width - after.length : Infinity);
        negative += prefix;
        value = before + after;
        return (align === "<" ? negative + value + padding : align === ">" ? padding + negative + value : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length) : negative + (zcomma ? value : padding + value)) + fullSuffix;
      };
    };
  }
  var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;
  var d3_format_types = d3.map({
    b: function(x) {
      return x.toString(2);
    },
    c: function(x) {
      return String.fromCharCode(x);
    },
    o: function(x) {
      return x.toString(8);
    },
    x: function(x) {
      return x.toString(16);
    },
    X: function(x) {
      return x.toString(16).toUpperCase();
    },
    g: function(x, p) {
      return x.toPrecision(p);
    },
    e: function(x, p) {
      return x.toExponential(p);
    },
    f: function(x, p) {
      return x.toFixed(p);
    },
    r: function(x, p) {
      return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p))));
    }
  });
  function d3_format_typeDefault(x) {
    return x + "";
  }
  var d3_time = d3.time = {}, d3_date = Date;
  function d3_date_utc() {
    this._ = new Date(arguments.length > 1 ? Date.UTC.apply(this, arguments) : arguments[0]);
  }
  d3_date_utc.prototype = {
    getDate: function() {
      return this._.getUTCDate();
    },
    getDay: function() {
      return this._.getUTCDay();
    },
    getFullYear: function() {
      return this._.getUTCFullYear();
    },
    getHours: function() {
      return this._.getUTCHours();
    },
    getMilliseconds: function() {
      return this._.getUTCMilliseconds();
    },
    getMinutes: function() {
      return this._.getUTCMinutes();
    },
    getMonth: function() {
      return this._.getUTCMonth();
    },
    getSeconds: function() {
      return this._.getUTCSeconds();
    },
    getTime: function() {
      return this._.getTime();
    },
    getTimezoneOffset: function() {
      return 0;
    },
    valueOf: function() {
      return this._.valueOf();
    },
    setDate: function() {
      d3_time_prototype.setUTCDate.apply(this._, arguments);
    },
    setDay: function() {
      d3_time_prototype.setUTCDay.apply(this._, arguments);
    },
    setFullYear: function() {
      d3_time_prototype.setUTCFullYear.apply(this._, arguments);
    },
    setHours: function() {
      d3_time_prototype.setUTCHours.apply(this._, arguments);
    },
    setMilliseconds: function() {
      d3_time_prototype.setUTCMilliseconds.apply(this._, arguments);
    },
    setMinutes: function() {
      d3_time_prototype.setUTCMinutes.apply(this._, arguments);
    },
    setMonth: function() {
      d3_time_prototype.setUTCMonth.apply(this._, arguments);
    },
    setSeconds: function() {
      d3_time_prototype.setUTCSeconds.apply(this._, arguments);
    },
    setTime: function() {
      d3_time_prototype.setTime.apply(this._, arguments);
    }
  };
  var d3_time_prototype = Date.prototype;
  function d3_time_interval(local, step, number) {
    function round(date) {
      var d0 = local(date), d1 = offset(d0, 1);
      return date - d0 < d1 - date ? d0 : d1;
    }
    function ceil(date) {
      step(date = local(new d3_date(date - 1)), 1);
      return date;
    }
    function offset(date, k) {
      step(date = new d3_date(+date), k);
      return date;
    }
    function range(t0, t1, dt) {
      var time = ceil(t0), times = [];
      if (dt > 1) {
        while (time < t1) {
          if (!(number(time) % dt)) times.push(new Date(+time));
          step(time, 1);
        }
      } else {
        while (time < t1) times.push(new Date(+time)), step(time, 1);
      }
      return times;
    }
    function range_utc(t0, t1, dt) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = t0;
        return range(utc, t1, dt);
      } finally {
        d3_date = Date;
      }
    }
    local.floor = local;
    local.round = round;
    local.ceil = ceil;
    local.offset = offset;
    local.range = range;
    var utc = local.utc = d3_time_interval_utc(local);
    utc.floor = utc;
    utc.round = d3_time_interval_utc(round);
    utc.ceil = d3_time_interval_utc(ceil);
    utc.offset = d3_time_interval_utc(offset);
    utc.range = range_utc;
    return local;
  }
  function d3_time_interval_utc(method) {
    return function(date, k) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = date;
        return method(utc, k)._;
      } finally {
        d3_date = Date;
      }
    };
  }
  d3_time.year = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setMonth(0, 1);
    return date;
  }, function(date, offset) {
    date.setFullYear(date.getFullYear() + offset);
  }, function(date) {
    return date.getFullYear();
  });
  d3_time.years = d3_time.year.range;
  d3_time.years.utc = d3_time.year.utc.range;
  d3_time.day = d3_time_interval(function(date) {
    var day = new d3_date(2e3, 0);
    day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    return day;
  }, function(date, offset) {
    date.setDate(date.getDate() + offset);
  }, function(date) {
    return date.getDate() - 1;
  });
  d3_time.days = d3_time.day.range;
  d3_time.days.utc = d3_time.day.utc.range;
  d3_time.dayOfYear = function(date) {
    var year = d3_time.year(date);
    return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
  };
  [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ].forEach(function(day, i) {
    i = 7 - i;
    var interval = d3_time[day] = d3_time_interval(function(date) {
      (date = d3_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
      return date;
    }, function(date, offset) {
      date.setDate(date.getDate() + Math.floor(offset) * 7);
    }, function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
    });
    d3_time[day + "s"] = interval.range;
    d3_time[day + "s"].utc = interval.utc.range;
    d3_time[day + "OfYear"] = function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7);
    };
  });
  d3_time.week = d3_time.sunday;
  d3_time.weeks = d3_time.sunday.range;
  d3_time.weeks.utc = d3_time.sunday.utc.range;
  d3_time.weekOfYear = d3_time.sundayOfYear;
  function d3_locale_timeFormat(locale) {
    var locale_dateTime = locale.dateTime, locale_date = locale.date, locale_time = locale.time, locale_periods = locale.periods, locale_days = locale.days, locale_shortDays = locale.shortDays, locale_months = locale.months, locale_shortMonths = locale.shortMonths;
    function d3_time_format(template) {
      var n = template.length;
      function format(date) {
        var string = [], i = -1, j = 0, c, p, f;
        while (++i < n) {
          if (template.charCodeAt(i) === 37) {
            string.push(template.slice(j, i));
            if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
            if (f = d3_time_formats[c]) c = f(date, p == null ? c === "e" ? " " : "0" : p);
            string.push(c);
            j = i + 1;
          }
        }
        string.push(template.slice(j, i));
        return string.join("");
      }
      format.parse = function(string) {
        var d = {
          y: 1900,
          m: 0,
          d: 1,
          H: 0,
          M: 0,
          S: 0,
          L: 0,
          Z: null
        }, i = d3_time_parse(d, template, string, 0);
        if (i != string.length) return null;
        if ("p" in d) d.H = d.H % 12 + d.p * 12;
        var localZ = d.Z != null && d3_date !== d3_date_utc, date = new (localZ ? d3_date_utc : d3_date)();
        if ("j" in d) date.setFullYear(d.y, 0, d.j); else if ("W" in d || "U" in d) {
          if (!("w" in d)) d.w = "W" in d ? 1 : 0;
          date.setFullYear(d.y, 0, 1);
          date.setFullYear(d.y, 0, "W" in d ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7 : d.w + d.U * 7 - (date.getDay() + 6) % 7);
        } else date.setFullYear(d.y, d.m, d.d);
        date.setHours(d.H + (d.Z / 100 | 0), d.M + d.Z % 100, d.S, d.L);
        return localZ ? date._ : date;
      };
      format.toString = function() {
        return template;
      };
      return format;
    }
    function d3_time_parse(date, template, string, j) {
      var c, p, t, i = 0, n = template.length, m = string.length;
      while (i < n) {
        if (j >= m) return -1;
        c = template.charCodeAt(i++);
        if (c === 37) {
          t = template.charAt(i++);
          p = d3_time_parsers[t in d3_time_formatPads ? template.charAt(i++) : t];
          if (!p || (j = p(date, string, j)) < 0) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }
      return j;
    }
    d3_time_format.utc = function(template) {
      var local = d3_time_format(template);
      function format(date) {
        try {
          d3_date = d3_date_utc;
          var utc = new d3_date();
          utc._ = date;
          return local(utc);
        } finally {
          d3_date = Date;
        }
      }
      format.parse = function(string) {
        try {
          d3_date = d3_date_utc;
          var date = local.parse(string);
          return date && date._;
        } finally {
          d3_date = Date;
        }
      };
      format.toString = local.toString;
      return format;
    };
    d3_time_format.multi = d3_time_format.utc.multi = d3_time_formatMulti;
    var d3_time_periodLookup = d3.map(), d3_time_dayRe = d3_time_formatRe(locale_days), d3_time_dayLookup = d3_time_formatLookup(locale_days), d3_time_dayAbbrevRe = d3_time_formatRe(locale_shortDays), d3_time_dayAbbrevLookup = d3_time_formatLookup(locale_shortDays), d3_time_monthRe = d3_time_formatRe(locale_months), d3_time_monthLookup = d3_time_formatLookup(locale_months), d3_time_monthAbbrevRe = d3_time_formatRe(locale_shortMonths), d3_time_monthAbbrevLookup = d3_time_formatLookup(locale_shortMonths);
    locale_periods.forEach(function(p, i) {
      d3_time_periodLookup.set(p.toLowerCase(), i);
    });
    var d3_time_formats = {
      a: function(d) {
        return locale_shortDays[d.getDay()];
      },
      A: function(d) {
        return locale_days[d.getDay()];
      },
      b: function(d) {
        return locale_shortMonths[d.getMonth()];
      },
      B: function(d) {
        return locale_months[d.getMonth()];
      },
      c: d3_time_format(locale_dateTime),
      d: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      e: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      H: function(d, p) {
        return d3_time_formatPad(d.getHours(), p, 2);
      },
      I: function(d, p) {
        return d3_time_formatPad(d.getHours() % 12 || 12, p, 2);
      },
      j: function(d, p) {
        return d3_time_formatPad(1 + d3_time.dayOfYear(d), p, 3);
      },
      L: function(d, p) {
        return d3_time_formatPad(d.getMilliseconds(), p, 3);
      },
      m: function(d, p) {
        return d3_time_formatPad(d.getMonth() + 1, p, 2);
      },
      M: function(d, p) {
        return d3_time_formatPad(d.getMinutes(), p, 2);
      },
      p: function(d) {
        return locale_periods[+(d.getHours() >= 12)];
      },
      S: function(d, p) {
        return d3_time_formatPad(d.getSeconds(), p, 2);
      },
      U: function(d, p) {
        return d3_time_formatPad(d3_time.sundayOfYear(d), p, 2);
      },
      w: function(d) {
        return d.getDay();
      },
      W: function(d, p) {
        return d3_time_formatPad(d3_time.mondayOfYear(d), p, 2);
      },
      x: d3_time_format(locale_date),
      X: d3_time_format(locale_time),
      y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 100, p, 2);
      },
      Y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 1e4, p, 4);
      },
      Z: d3_time_zone,
      "%": function() {
        return "%";
      }
    };
    var d3_time_parsers = {
      a: d3_time_parseWeekdayAbbrev,
      A: d3_time_parseWeekday,
      b: d3_time_parseMonthAbbrev,
      B: d3_time_parseMonth,
      c: d3_time_parseLocaleFull,
      d: d3_time_parseDay,
      e: d3_time_parseDay,
      H: d3_time_parseHour24,
      I: d3_time_parseHour24,
      j: d3_time_parseDayOfYear,
      L: d3_time_parseMilliseconds,
      m: d3_time_parseMonthNumber,
      M: d3_time_parseMinutes,
      p: d3_time_parseAmPm,
      S: d3_time_parseSeconds,
      U: d3_time_parseWeekNumberSunday,
      w: d3_time_parseWeekdayNumber,
      W: d3_time_parseWeekNumberMonday,
      x: d3_time_parseLocaleDate,
      X: d3_time_parseLocaleTime,
      y: d3_time_parseYear,
      Y: d3_time_parseFullYear,
      Z: d3_time_parseZone,
      "%": d3_time_parseLiteralPercent
    };
    function d3_time_parseWeekdayAbbrev(date, string, i) {
      d3_time_dayAbbrevRe.lastIndex = 0;
      var n = d3_time_dayAbbrevRe.exec(string.slice(i));
      return n ? (date.w = d3_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseWeekday(date, string, i) {
      d3_time_dayRe.lastIndex = 0;
      var n = d3_time_dayRe.exec(string.slice(i));
      return n ? (date.w = d3_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonthAbbrev(date, string, i) {
      d3_time_monthAbbrevRe.lastIndex = 0;
      var n = d3_time_monthAbbrevRe.exec(string.slice(i));
      return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonth(date, string, i) {
      d3_time_monthRe.lastIndex = 0;
      var n = d3_time_monthRe.exec(string.slice(i));
      return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseLocaleFull(date, string, i) {
      return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
    }
    function d3_time_parseLocaleDate(date, string, i) {
      return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
    }
    function d3_time_parseLocaleTime(date, string, i) {
      return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
    }
    function d3_time_parseAmPm(date, string, i) {
      var n = d3_time_periodLookup.get(string.slice(i, i += 2).toLowerCase());
      return n == null ? -1 : (date.p = n, i);
    }
    return d3_time_format;
  }
  var d3_time_formatPads = {
    "-": "",
    _: " ",
    "0": "0"
  }, d3_time_numberRe = /^\s*\d+/, d3_time_percentRe = /^%/;
  function d3_time_formatPad(value, fill, width) {
    var sign = value < 0 ? "-" : "", string = (sign ? -value : value) + "", length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }
  function d3_time_formatRe(names) {
    return new RegExp("^(?:" + names.map(d3.requote).join("|") + ")", "i");
  }
  function d3_time_formatLookup(names) {
    var map = new d3_Map(), i = -1, n = names.length;
    while (++i < n) map.set(names[i].toLowerCase(), i);
    return map;
  }
  function d3_time_parseWeekdayNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 1));
    return n ? (date.w = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberSunday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i));
    return n ? (date.U = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberMonday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i));
    return n ? (date.W = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseFullYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 4));
    return n ? (date.y = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.y = d3_time_expandYear(+n[0]), i + n[0].length) : -1;
  }
  function d3_time_parseZone(date, string, i) {
    return /^[+-]\d{4}$/.test(string = string.slice(i, i + 5)) ? (date.Z = -string, 
    i + 5) : -1;
  }
  function d3_time_expandYear(d) {
    return d + (d > 68 ? 1900 : 2e3);
  }
  function d3_time_parseMonthNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.m = n[0] - 1, i + n[0].length) : -1;
  }
  function d3_time_parseDay(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.d = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseDayOfYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 3));
    return n ? (date.j = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseHour24(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.H = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMinutes(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.M = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseSeconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.S = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMilliseconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 3));
    return n ? (date.L = +n[0], i + n[0].length) : -1;
  }
  function d3_time_zone(d) {
    var z = d.getTimezoneOffset(), zs = z > 0 ? "-" : "+", zh = abs(z) / 60 | 0, zm = abs(z) % 60;
    return zs + d3_time_formatPad(zh, "0", 2) + d3_time_formatPad(zm, "0", 2);
  }
  function d3_time_parseLiteralPercent(date, string, i) {
    d3_time_percentRe.lastIndex = 0;
    var n = d3_time_percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }
  function d3_time_formatMulti(formats) {
    var n = formats.length, i = -1;
    while (++i < n) formats[i][0] = this(formats[i][0]);
    return function(date) {
      var i = 0, f = formats[i];
      while (!f[1](date)) f = formats[++i];
      return f[0](date);
    };
  }
  d3.locale = function(locale) {
    return {
      numberFormat: d3_locale_numberFormat(locale),
      timeFormat: d3_locale_timeFormat(locale)
    };
  };
  var d3_locale_enUS = d3.locale({
    decimal: ".",
    thousands: ",",
    grouping: [ 3 ],
    currency: [ "$", "" ],
    dateTime: "%a %b %e %X %Y",
    date: "%m/%d/%Y",
    time: "%H:%M:%S",
    periods: [ "AM", "PM" ],
    days: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
    shortDays: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
    months: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
    shortMonths: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
  });
  d3.format = d3_locale_enUS.numberFormat;
  d3.geo = {};
  function d3_adder() {}
  d3_adder.prototype = {
    s: 0,
    t: 0,
    add: function(y) {
      d3_adderSum(y, this.t, d3_adderTemp);
      d3_adderSum(d3_adderTemp.s, this.s, this);
      if (this.s) this.t += d3_adderTemp.t; else this.s = d3_adderTemp.t;
    },
    reset: function() {
      this.s = this.t = 0;
    },
    valueOf: function() {
      return this.s;
    }
  };
  var d3_adderTemp = new d3_adder();
  function d3_adderSum(a, b, o) {
    var x = o.s = a + b, bv = x - a, av = x - bv;
    o.t = a - av + (b - bv);
  }
  d3.geo.stream = function(object, listener) {
    if (object && d3_geo_streamObjectType.hasOwnProperty(object.type)) {
      d3_geo_streamObjectType[object.type](object, listener);
    } else {
      d3_geo_streamGeometry(object, listener);
    }
  };
  function d3_geo_streamGeometry(geometry, listener) {
    if (geometry && d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {
      d3_geo_streamGeometryType[geometry.type](geometry, listener);
    }
  }
  var d3_geo_streamObjectType = {
    Feature: function(feature, listener) {
      d3_geo_streamGeometry(feature.geometry, listener);
    },
    FeatureCollection: function(object, listener) {
      var features = object.features, i = -1, n = features.length;
      while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);
    }
  };
  var d3_geo_streamGeometryType = {
    Sphere: function(object, listener) {
      listener.sphere();
    },
    Point: function(object, listener) {
      object = object.coordinates;
      listener.point(object[0], object[1], object[2]);
    },
    MultiPoint: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) object = coordinates[i], listener.point(object[0], object[1], object[2]);
    },
    LineString: function(object, listener) {
      d3_geo_streamLine(object.coordinates, listener, 0);
    },
    MultiLineString: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);
    },
    Polygon: function(object, listener) {
      d3_geo_streamPolygon(object.coordinates, listener);
    },
    MultiPolygon: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);
    },
    GeometryCollection: function(object, listener) {
      var geometries = object.geometries, i = -1, n = geometries.length;
      while (++i < n) d3_geo_streamGeometry(geometries[i], listener);
    }
  };
  function d3_geo_streamLine(coordinates, listener, closed) {
    var i = -1, n = coordinates.length - closed, coordinate;
    listener.lineStart();
    while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1], coordinate[2]);
    listener.lineEnd();
  }
  function d3_geo_streamPolygon(coordinates, listener) {
    var i = -1, n = coordinates.length;
    listener.polygonStart();
    while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);
    listener.polygonEnd();
  }
  d3.geo.area = function(object) {
    d3_geo_areaSum = 0;
    d3.geo.stream(object, d3_geo_area);
    return d3_geo_areaSum;
  };
  var d3_geo_areaSum, d3_geo_areaRingSum = new d3_adder();
  var d3_geo_area = {
    sphere: function() {
      d3_geo_areaSum += 4 * π;
    },
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_areaRingSum.reset();
      d3_geo_area.lineStart = d3_geo_areaRingStart;
    },
    polygonEnd: function() {
      var area = 2 * d3_geo_areaRingSum;
      d3_geo_areaSum += area < 0 ? 4 * π + area : area;
      d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;
    }
  };
  function d3_geo_areaRingStart() {
    var λ00, φ00, λ0, cosφ0, sinφ0;
    d3_geo_area.point = function(λ, φ) {
      d3_geo_area.point = nextPoint;
      λ0 = (λ00 = λ) * d3_radians, cosφ0 = Math.cos(φ = (φ00 = φ) * d3_radians / 2 + π / 4), 
      sinφ0 = Math.sin(φ);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      φ = φ * d3_radians / 2 + π / 4;
      var dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, cosφ = Math.cos(φ), sinφ = Math.sin(φ), k = sinφ0 * sinφ, u = cosφ0 * cosφ + k * Math.cos(adλ), v = k * sdλ * Math.sin(adλ);
      d3_geo_areaRingSum.add(Math.atan2(v, u));
      λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
    }
    d3_geo_area.lineEnd = function() {
      nextPoint(λ00, φ00);
    };
  }
  function d3_geo_cartesian(spherical) {
    var λ = spherical[0], φ = spherical[1], cosφ = Math.cos(φ);
    return [ cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ) ];
  }
  function d3_geo_cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function d3_geo_cartesianCross(a, b) {
    return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
  }
  function d3_geo_cartesianAdd(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
  }
  function d3_geo_cartesianScale(vector, k) {
    return [ vector[0] * k, vector[1] * k, vector[2] * k ];
  }
  function d3_geo_cartesianNormalize(d) {
    var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l;
    d[1] /= l;
    d[2] /= l;
  }
  function d3_geo_spherical(cartesian) {
    return [ Math.atan2(cartesian[1], cartesian[0]), d3_asin(cartesian[2]) ];
  }
  function d3_geo_sphericalEqual(a, b) {
    return abs(a[0] - b[0]) < ε && abs(a[1] - b[1]) < ε;
  }
  d3.geo.bounds = function() {
    var λ0, φ0, λ1, φ1, λ_, λ__, φ__, p0, dλSum, ranges, range;
    var bound = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        bound.point = ringPoint;
        bound.lineStart = ringStart;
        bound.lineEnd = ringEnd;
        dλSum = 0;
        d3_geo_area.polygonStart();
      },
      polygonEnd: function() {
        d3_geo_area.polygonEnd();
        bound.point = point;
        bound.lineStart = lineStart;
        bound.lineEnd = lineEnd;
        if (d3_geo_areaRingSum < 0) λ0 = -(λ1 = 180), φ0 = -(φ1 = 90); else if (dλSum > ε) φ1 = 90; else if (dλSum < -ε) φ0 = -90;
        range[0] = λ0, range[1] = λ1;
      }
    };
    function point(λ, φ) {
      ranges.push(range = [ λ0 = λ, λ1 = λ ]);
      if (φ < φ0) φ0 = φ;
      if (φ > φ1) φ1 = φ;
    }
    function linePoint(λ, φ) {
      var p = d3_geo_cartesian([ λ * d3_radians, φ * d3_radians ]);
      if (p0) {
        var normal = d3_geo_cartesianCross(p0, p), equatorial = [ normal[1], -normal[0], 0 ], inflection = d3_geo_cartesianCross(equatorial, normal);
        d3_geo_cartesianNormalize(inflection);
        inflection = d3_geo_spherical(inflection);
        var dλ = λ - λ_, s = dλ > 0 ? 1 : -1, λi = inflection[0] * d3_degrees * s, antimeridian = abs(dλ) > 180;
        if (antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = inflection[1] * d3_degrees;
          if (φi > φ1) φ1 = φi;
        } else if (λi = (λi + 360) % 360 - 180, antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = -inflection[1] * d3_degrees;
          if (φi < φ0) φ0 = φi;
        } else {
          if (φ < φ0) φ0 = φ;
          if (φ > φ1) φ1 = φ;
        }
        if (antimeridian) {
          if (λ < λ_) {
            if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
          } else {
            if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
          }
        } else {
          if (λ1 >= λ0) {
            if (λ < λ0) λ0 = λ;
            if (λ > λ1) λ1 = λ;
          } else {
            if (λ > λ_) {
              if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
            } else {
              if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
            }
          }
        }
      } else {
        point(λ, φ);
      }
      p0 = p, λ_ = λ;
    }
    function lineStart() {
      bound.point = linePoint;
    }
    function lineEnd() {
      range[0] = λ0, range[1] = λ1;
      bound.point = point;
      p0 = null;
    }
    function ringPoint(λ, φ) {
      if (p0) {
        var dλ = λ - λ_;
        dλSum += abs(dλ) > 180 ? dλ + (dλ > 0 ? 360 : -360) : dλ;
      } else λ__ = λ, φ__ = φ;
      d3_geo_area.point(λ, φ);
      linePoint(λ, φ);
    }
    function ringStart() {
      d3_geo_area.lineStart();
    }
    function ringEnd() {
      ringPoint(λ__, φ__);
      d3_geo_area.lineEnd();
      if (abs(dλSum) > ε) λ0 = -(λ1 = 180);
      range[0] = λ0, range[1] = λ1;
      p0 = null;
    }
    function angle(λ0, λ1) {
      return (λ1 -= λ0) < 0 ? λ1 + 360 : λ1;
    }
    function compareRanges(a, b) {
      return a[0] - b[0];
    }
    function withinRange(x, range) {
      return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
    }
    return function(feature) {
      φ1 = λ1 = -(λ0 = φ0 = Infinity);
      ranges = [];
      d3.geo.stream(feature, bound);
      var n = ranges.length;
      if (n) {
        ranges.sort(compareRanges);
        for (var i = 1, a = ranges[0], b, merged = [ a ]; i < n; ++i) {
          b = ranges[i];
          if (withinRange(b[0], a) || withinRange(b[1], a)) {
            if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
            if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
          } else {
            merged.push(a = b);
          }
        }
        var best = -Infinity, dλ;
        for (var n = merged.length - 1, i = 0, a = merged[n], b; i <= n; a = b, ++i) {
          b = merged[i];
          if ((dλ = angle(a[1], b[0])) > best) best = dλ, λ0 = b[0], λ1 = a[1];
        }
      }
      ranges = range = null;
      return λ0 === Infinity || φ0 === Infinity ? [ [ NaN, NaN ], [ NaN, NaN ] ] : [ [ λ0, φ0 ], [ λ1, φ1 ] ];
    };
  }();
  d3.geo.centroid = function(object) {
    d3_geo_centroidW0 = d3_geo_centroidW1 = d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
    d3.geo.stream(object, d3_geo_centroid);
    var x = d3_geo_centroidX2, y = d3_geo_centroidY2, z = d3_geo_centroidZ2, m = x * x + y * y + z * z;
    if (m < ε2) {
      x = d3_geo_centroidX1, y = d3_geo_centroidY1, z = d3_geo_centroidZ1;
      if (d3_geo_centroidW1 < ε) x = d3_geo_centroidX0, y = d3_geo_centroidY0, z = d3_geo_centroidZ0;
      m = x * x + y * y + z * z;
      if (m < ε2) return [ NaN, NaN ];
    }
    return [ Math.atan2(y, x) * d3_degrees, d3_asin(z / Math.sqrt(m)) * d3_degrees ];
  };
  var d3_geo_centroidW0, d3_geo_centroidW1, d3_geo_centroidX0, d3_geo_centroidY0, d3_geo_centroidZ0, d3_geo_centroidX1, d3_geo_centroidY1, d3_geo_centroidZ1, d3_geo_centroidX2, d3_geo_centroidY2, d3_geo_centroidZ2;
  var d3_geo_centroid = {
    sphere: d3_noop,
    point: d3_geo_centroidPoint,
    lineStart: d3_geo_centroidLineStart,
    lineEnd: d3_geo_centroidLineEnd,
    polygonStart: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidLineStart;
    }
  };
  function d3_geo_centroidPoint(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians);
    d3_geo_centroidPointXYZ(cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ));
  }
  function d3_geo_centroidPointXYZ(x, y, z) {
    ++d3_geo_centroidW0;
    d3_geo_centroidX0 += (x - d3_geo_centroidX0) / d3_geo_centroidW0;
    d3_geo_centroidY0 += (y - d3_geo_centroidY0) / d3_geo_centroidW0;
    d3_geo_centroidZ0 += (z - d3_geo_centroidZ0) / d3_geo_centroidW0;
  }
  function d3_geo_centroidLineStart() {
    var x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroid.point = nextPoint;
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), w = Math.atan2(Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_geo_centroidLineEnd() {
    d3_geo_centroid.point = d3_geo_centroidPoint;
  }
  function d3_geo_centroidRingStart() {
    var λ00, φ00, x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ00 = λ, φ00 = φ;
      d3_geo_centroid.point = nextPoint;
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    d3_geo_centroid.lineEnd = function() {
      nextPoint(λ00, φ00);
      d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;
      d3_geo_centroid.point = d3_geo_centroidPoint;
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), cx = y0 * z - z0 * y, cy = z0 * x - x0 * z, cz = x0 * y - y0 * x, m = Math.sqrt(cx * cx + cy * cy + cz * cz), u = x0 * x + y0 * y + z0 * z, v = m && -d3_acos(u) / m, w = Math.atan2(m, u);
      d3_geo_centroidX2 += v * cx;
      d3_geo_centroidY2 += v * cy;
      d3_geo_centroidZ2 += v * cz;
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_geo_compose(a, b) {
    function compose(x, y) {
      return x = a(x, y), b(x[0], x[1]);
    }
    if (a.invert && b.invert) compose.invert = function(x, y) {
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);
    };
    return compose;
  }
  function d3_true() {
    return true;
  }
  function d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener) {
    var subject = [], clip = [];
    segments.forEach(function(segment) {
      if ((n = segment.length - 1) <= 0) return;
      var n, p0 = segment[0], p1 = segment[n];
      if (d3_geo_sphericalEqual(p0, p1)) {
        listener.lineStart();
        for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);
        listener.lineEnd();
        return;
      }
      var a = new d3_geo_clipPolygonIntersection(p0, segment, null, true), b = new d3_geo_clipPolygonIntersection(p0, null, a, false);
      a.o = b;
      subject.push(a);
      clip.push(b);
      a = new d3_geo_clipPolygonIntersection(p1, segment, null, false);
      b = new d3_geo_clipPolygonIntersection(p1, null, a, true);
      a.o = b;
      subject.push(a);
      clip.push(b);
    });
    clip.sort(compare);
    d3_geo_clipPolygonLinkCircular(subject);
    d3_geo_clipPolygonLinkCircular(clip);
    if (!subject.length) return;
    for (var i = 0, entry = clipStartInside, n = clip.length; i < n; ++i) {
      clip[i].e = entry = !entry;
    }
    var start = subject[0], points, point;
    while (1) {
      var current = start, isSubject = true;
      while (current.v) if ((current = current.n) === start) return;
      points = current.z;
      listener.lineStart();
      do {
        current.v = current.o.v = true;
        if (current.e) {
          if (isSubject) {
            for (var i = 0, n = points.length; i < n; ++i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.n.x, 1, listener);
          }
          current = current.n;
        } else {
          if (isSubject) {
            points = current.p.z;
            for (var i = points.length - 1; i >= 0; --i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.p.x, -1, listener);
          }
          current = current.p;
        }
        current = current.o;
        points = current.z;
        isSubject = !isSubject;
      } while (!current.v);
      listener.lineEnd();
    }
  }
  function d3_geo_clipPolygonLinkCircular(array) {
    if (!(n = array.length)) return;
    var n, i = 0, a = array[0], b;
    while (++i < n) {
      a.n = b = array[i];
      b.p = a;
      a = b;
    }
    a.n = b = array[0];
    b.p = a;
  }
  function d3_geo_clipPolygonIntersection(point, points, other, entry) {
    this.x = point;
    this.z = points;
    this.o = other;
    this.e = entry;
    this.v = false;
    this.n = this.p = null;
  }
  function d3_geo_clip(pointVisible, clipLine, interpolate, clipStart) {
    return function(rotate, listener) {
      var line = clipLine(listener), rotatedClipStart = rotate.invert(clipStart[0], clipStart[1]);
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          segments = [];
          polygon = [];
        },
        polygonEnd: function() {
          clip.point = point;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = d3.merge(segments);
          var clipStartInside = d3_geo_pointInPolygon(rotatedClipStart, polygon);
          if (segments.length) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            d3_geo_clipPolygon(segments, d3_geo_clipSort, clipStartInside, interpolate, listener);
          } else if (clipStartInside) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            interpolate(null, null, 1, listener);
            listener.lineEnd();
          }
          if (polygonStarted) listener.polygonEnd(), polygonStarted = false;
          segments = polygon = null;
        },
        sphere: function() {
          listener.polygonStart();
          listener.lineStart();
          interpolate(null, null, 1, listener);
          listener.lineEnd();
          listener.polygonEnd();
        }
      };
      function point(λ, φ) {
        var point = rotate(λ, φ);
        if (pointVisible(λ = point[0], φ = point[1])) listener.point(λ, φ);
      }
      function pointLine(λ, φ) {
        var point = rotate(λ, φ);
        line.point(point[0], point[1]);
      }
      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }
      function lineEnd() {
        clip.point = point;
        line.lineEnd();
      }
      var segments;
      var buffer = d3_geo_clipBufferListener(), ringListener = clipLine(buffer), polygonStarted = false, polygon, ring;
      function pointRing(λ, φ) {
        ring.push([ λ, φ ]);
        var point = rotate(λ, φ);
        ringListener.point(point[0], point[1]);
      }
      function ringStart() {
        ringListener.lineStart();
        ring = [];
      }
      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringListener.lineEnd();
        var clean = ringListener.clean(), ringSegments = buffer.buffer(), segment, n = ringSegments.length;
        ring.pop();
        polygon.push(ring);
        ring = null;
        if (!n) return;
        if (clean & 1) {
          segment = ringSegments[0];
          var n = segment.length - 1, i = -1, point;
          if (n > 0) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            while (++i < n) listener.point((point = segment[i])[0], point[1]);
            listener.lineEnd();
          }
          return;
        }
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
        segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));
      }
      return clip;
    };
  }
  function d3_geo_clipSegmentLength1(segment) {
    return segment.length > 1;
  }
  function d3_geo_clipBufferListener() {
    var lines = [], line;
    return {
      lineStart: function() {
        lines.push(line = []);
      },
      point: function(λ, φ) {
        line.push([ λ, φ ]);
      },
      lineEnd: d3_noop,
      buffer: function() {
        var buffer = lines;
        lines = [];
        line = null;
        return buffer;
      },
      rejoin: function() {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
      }
    };
  }
  function d3_geo_clipSort(a, b) {
    return ((a = a.x)[0] < 0 ? a[1] - halfπ - ε : halfπ - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfπ - ε : halfπ - b[1]);
  }
  var d3_geo_clipAntimeridian = d3_geo_clip(d3_true, d3_geo_clipAntimeridianLine, d3_geo_clipAntimeridianInterpolate, [ -π, -π / 2 ]);
  function d3_geo_clipAntimeridianLine(listener) {
    var λ0 = NaN, φ0 = NaN, sλ0 = NaN, clean;
    return {
      lineStart: function() {
        listener.lineStart();
        clean = 1;
      },
      point: function(λ1, φ1) {
        var sλ1 = λ1 > 0 ? π : -π, dλ = abs(λ1 - λ0);
        if (abs(dλ - π) < ε) {
          listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? halfπ : -halfπ);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          listener.point(λ1, φ0);
          clean = 0;
        } else if (sλ0 !== sλ1 && dλ >= π) {
          if (abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;
          if (abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;
          φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          clean = 0;
        }
        listener.point(λ0 = λ1, φ0 = φ1);
        sλ0 = sλ1;
      },
      lineEnd: function() {
        listener.lineEnd();
        λ0 = φ0 = NaN;
      },
      clean: function() {
        return 2 - clean;
      }
    };
  }
  function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {
    var cosφ0, cosφ1, sinλ0_λ1 = Math.sin(λ0 - λ1);
    return abs(sinλ0_λ1) > ε ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1) - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0)) / (cosφ0 * cosφ1 * sinλ0_λ1)) : (φ0 + φ1) / 2;
  }
  function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
    var φ;
    if (from == null) {
      φ = direction * halfπ;
      listener.point(-π, φ);
      listener.point(0, φ);
      listener.point(π, φ);
      listener.point(π, 0);
      listener.point(π, -φ);
      listener.point(0, -φ);
      listener.point(-π, -φ);
      listener.point(-π, 0);
      listener.point(-π, φ);
    } else if (abs(from[0] - to[0]) > ε) {
      var s = from[0] < to[0] ? π : -π;
      φ = direction * s / 2;
      listener.point(-s, φ);
      listener.point(0, φ);
      listener.point(s, φ);
    } else {
      listener.point(to[0], to[1]);
    }
  }
  function d3_geo_pointInPolygon(point, polygon) {
    var meridian = point[0], parallel = point[1], meridianNormal = [ Math.sin(meridian), -Math.cos(meridian), 0 ], polarAngle = 0, winding = 0;
    d3_geo_areaRingSum.reset();
    for (var i = 0, n = polygon.length; i < n; ++i) {
      var ring = polygon[i], m = ring.length;
      if (!m) continue;
      var point0 = ring[0], λ0 = point0[0], φ0 = point0[1] / 2 + π / 4, sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), j = 1;
      while (true) {
        if (j === m) j = 0;
        point = ring[j];
        var λ = point[0], φ = point[1] / 2 + π / 4, sinφ = Math.sin(φ), cosφ = Math.cos(φ), dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, antimeridian = adλ > π, k = sinφ0 * sinφ;
        d3_geo_areaRingSum.add(Math.atan2(k * sdλ * Math.sin(adλ), cosφ0 * cosφ + k * Math.cos(adλ)));
        polarAngle += antimeridian ? dλ + sdλ * τ : dλ;
        if (antimeridian ^ λ0 >= meridian ^ λ >= meridian) {
          var arc = d3_geo_cartesianCross(d3_geo_cartesian(point0), d3_geo_cartesian(point));
          d3_geo_cartesianNormalize(arc);
          var intersection = d3_geo_cartesianCross(meridianNormal, arc);
          d3_geo_cartesianNormalize(intersection);
          var φarc = (antimeridian ^ dλ >= 0 ? -1 : 1) * d3_asin(intersection[2]);
          if (parallel > φarc || parallel === φarc && (arc[0] || arc[1])) {
            winding += antimeridian ^ dλ >= 0 ? 1 : -1;
          }
        }
        if (!j++) break;
        λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ, point0 = point;
      }
    }
    return (polarAngle < -ε || polarAngle < ε && d3_geo_areaRingSum < 0) ^ winding & 1;
  }
  function d3_geo_clipCircle(radius) {
    var cr = Math.cos(radius), smallRadius = cr > 0, notHemisphere = abs(cr) > ε, interpolate = d3_geo_circleInterpolate(radius, 6 * d3_radians);
    return d3_geo_clip(visible, clipLine, interpolate, smallRadius ? [ 0, -radius ] : [ -π, radius - π ]);
    function visible(λ, φ) {
      return Math.cos(λ) * Math.cos(φ) > cr;
    }
    function clipLine(listener) {
      var point0, c0, v0, v00, clean;
      return {
        lineStart: function() {
          v00 = v0 = false;
          clean = 1;
        },
        point: function(λ, φ) {
          var point1 = [ λ, φ ], point2, v = visible(λ, φ), c = smallRadius ? v ? 0 : code(λ, φ) : v ? code(λ + (λ < 0 ? π : -π), φ) : 0;
          if (!point0 && (v00 = v0 = v)) listener.lineStart();
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {
              point1[0] += ε;
              point1[1] += ε;
              v = visible(point1[0], point1[1]);
            }
          }
          if (v !== v0) {
            clean = 0;
            if (v) {
              listener.lineStart();
              point2 = intersect(point1, point0);
              listener.point(point2[0], point2[1]);
            } else {
              point2 = intersect(point0, point1);
              listener.point(point2[0], point2[1]);
              listener.lineEnd();
            }
            point0 = point2;
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            var t;
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0;
              if (smallRadius) {
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
              } else {
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
              }
            }
          }
          if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) {
            listener.point(point1[0], point1[1]);
          }
          point0 = point1, v0 = v, c0 = c;
        },
        lineEnd: function() {
          if (v0) listener.lineEnd();
          point0 = null;
        },
        clean: function() {
          return clean | (v00 && v0) << 1;
        }
      };
    }
    function intersect(a, b, two) {
      var pa = d3_geo_cartesian(a), pb = d3_geo_cartesian(b);
      var n1 = [ 1, 0, 0 ], n2 = d3_geo_cartesianCross(pa, pb), n2n2 = d3_geo_cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
      if (!determinant) return !two && a;
      var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = d3_geo_cartesianCross(n1, n2), A = d3_geo_cartesianScale(n1, c1), B = d3_geo_cartesianScale(n2, c2);
      d3_geo_cartesianAdd(A, B);
      var u = n1xn2, w = d3_geo_cartesianDot(A, u), uu = d3_geo_cartesianDot(u, u), t2 = w * w - uu * (d3_geo_cartesianDot(A, A) - 1);
      if (t2 < 0) return;
      var t = Math.sqrt(t2), q = d3_geo_cartesianScale(u, (-w - t) / uu);
      d3_geo_cartesianAdd(q, A);
      q = d3_geo_spherical(q);
      if (!two) return q;
      var λ0 = a[0], λ1 = b[0], φ0 = a[1], φ1 = b[1], z;
      if (λ1 < λ0) z = λ0, λ0 = λ1, λ1 = z;
      var δλ = λ1 - λ0, polar = abs(δλ - π) < ε, meridian = polar || δλ < ε;
      if (!polar && φ1 < φ0) z = φ0, φ0 = φ1, φ1 = z;
      if (meridian ? polar ? φ0 + φ1 > 0 ^ q[1] < (abs(q[0] - λ0) < ε ? φ0 : φ1) : φ0 <= q[1] && q[1] <= φ1 : δλ > π ^ (λ0 <= q[0] && q[0] <= λ1)) {
        var q1 = d3_geo_cartesianScale(u, (-w + t) / uu);
        d3_geo_cartesianAdd(q1, A);
        return [ q, d3_geo_spherical(q1) ];
      }
    }
    function code(λ, φ) {
      var r = smallRadius ? radius : π - radius, code = 0;
      if (λ < -r) code |= 1; else if (λ > r) code |= 2;
      if (φ < -r) code |= 4; else if (φ > r) code |= 8;
      return code;
    }
  }
  function d3_geom_clipLine(x0, y0, x1, y1) {
    return function(line) {
      var a = line.a, b = line.b, ax = a.x, ay = a.y, bx = b.x, by = b.y, t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay, r;
      r = x0 - ax;
      if (!dx && r > 0) return;
      r /= dx;
      if (dx < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dx > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = x1 - ax;
      if (!dx && r < 0) return;
      r /= dx;
      if (dx < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dx > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      r = y0 - ay;
      if (!dy && r > 0) return;
      r /= dy;
      if (dy < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dy > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = y1 - ay;
      if (!dy && r < 0) return;
      r /= dy;
      if (dy < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dy > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      if (t0 > 0) line.a = {
        x: ax + t0 * dx,
        y: ay + t0 * dy
      };
      if (t1 < 1) line.b = {
        x: ax + t1 * dx,
        y: ay + t1 * dy
      };
      return line;
    };
  }
  var d3_geo_clipExtentMAX = 1e9;
  d3.geo.clipExtent = function() {
    var x0, y0, x1, y1, stream, clip, clipExtent = {
      stream: function(output) {
        if (stream) stream.valid = false;
        stream = clip(output);
        stream.valid = true;
        return stream;
      },
      extent: function(_) {
        if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
        clip = d3_geo_clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]);
        if (stream) stream.valid = false, stream = null;
        return clipExtent;
      }
    };
    return clipExtent.extent([ [ 0, 0 ], [ 960, 500 ] ]);
  };
  function d3_geo_clipExtent(x0, y0, x1, y1) {
    return function(listener) {
      var listener_ = listener, bufferListener = d3_geo_clipBufferListener(), clipLine = d3_geom_clipLine(x0, y0, x1, y1), segments, polygon, ring;
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          listener = bufferListener;
          segments = [];
          polygon = [];
          clean = true;
        },
        polygonEnd: function() {
          listener = listener_;
          segments = d3.merge(segments);
          var clipStartInside = insidePolygon([ x0, y1 ]), inside = clean && clipStartInside, visible = segments.length;
          if (inside || visible) {
            listener.polygonStart();
            if (inside) {
              listener.lineStart();
              interpolate(null, null, 1, listener);
              listener.lineEnd();
            }
            if (visible) {
              d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener);
            }
            listener.polygonEnd();
          }
          segments = polygon = ring = null;
        }
      };
      function insidePolygon(p) {
        var wn = 0, n = polygon.length, y = p[1];
        for (var i = 0; i < n; ++i) {
          for (var j = 1, v = polygon[i], m = v.length, a = v[0], b; j < m; ++j) {
            b = v[j];
            if (a[1] <= y) {
              if (b[1] > y && d3_cross2d(a, b, p) > 0) ++wn;
            } else {
              if (b[1] <= y && d3_cross2d(a, b, p) < 0) --wn;
            }
            a = b;
          }
        }
        return wn !== 0;
      }
      function interpolate(from, to, direction, listener) {
        var a = 0, a1 = 0;
        if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoints(from, to) < 0 ^ direction > 0) {
          do {
            listener.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
          } while ((a = (a + direction + 4) % 4) !== a1);
        } else {
          listener.point(to[0], to[1]);
        }
      }
      function pointVisible(x, y) {
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
      }
      function point(x, y) {
        if (pointVisible(x, y)) listener.point(x, y);
      }
      var x__, y__, v__, x_, y_, v_, first, clean;
      function lineStart() {
        clip.point = linePoint;
        if (polygon) polygon.push(ring = []);
        first = true;
        v_ = false;
        x_ = y_ = NaN;
      }
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__);
          if (v__ && v_) bufferListener.rejoin();
          segments.push(bufferListener.buffer());
        }
        clip.point = point;
        if (v_) listener.lineEnd();
      }
      function linePoint(x, y) {
        x = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, x));
        y = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, y));
        var v = pointVisible(x, y);
        if (polygon) ring.push([ x, y ]);
        if (first) {
          x__ = x, y__ = y, v__ = v;
          first = false;
          if (v) {
            listener.lineStart();
            listener.point(x, y);
          }
        } else {
          if (v && v_) listener.point(x, y); else {
            var l = {
              a: {
                x: x_,
                y: y_
              },
              b: {
                x: x,
                y: y
              }
            };
            if (clipLine(l)) {
              if (!v_) {
                listener.lineStart();
                listener.point(l.a.x, l.a.y);
              }
              listener.point(l.b.x, l.b.y);
              if (!v) listener.lineEnd();
              clean = false;
            } else if (v) {
              listener.lineStart();
              listener.point(x, y);
              clean = false;
            }
          }
        }
        x_ = x, y_ = y, v_ = v;
      }
      return clip;
    };
    function corner(p, direction) {
      return abs(p[0] - x0) < ε ? direction > 0 ? 0 : 3 : abs(p[0] - x1) < ε ? direction > 0 ? 2 : 1 : abs(p[1] - y0) < ε ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;
    }
    function compare(a, b) {
      return comparePoints(a.x, b.x);
    }
    function comparePoints(a, b) {
      var ca = corner(a, 1), cb = corner(b, 1);
      return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];
    }
  }
  function d3_geo_conic(projectAt) {
    var φ0 = 0, φ1 = π / 3, m = d3_geo_projectionMutator(projectAt), p = m(φ0, φ1);
    p.parallels = function(_) {
      if (!arguments.length) return [ φ0 / π * 180, φ1 / π * 180 ];
      return m(φ0 = _[0] * π / 180, φ1 = _[1] * π / 180);
    };
    return p;
  }
  function d3_geo_conicEqualArea(φ0, φ1) {
    var sinφ0 = Math.sin(φ0), n = (sinφ0 + Math.sin(φ1)) / 2, C = 1 + sinφ0 * (2 * n - sinφ0), ρ0 = Math.sqrt(C) / n;
    function forward(λ, φ) {
      var ρ = Math.sqrt(C - 2 * n * Math.sin(φ)) / n;
      return [ ρ * Math.sin(λ *= n), ρ0 - ρ * Math.cos(λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = ρ0 - y;
      return [ Math.atan2(x, ρ0_y) / n, d3_asin((C - (x * x + ρ0_y * ρ0_y) * n * n) / (2 * n)) ];
    };
    return forward;
  }
  (d3.geo.conicEqualArea = function() {
    return d3_geo_conic(d3_geo_conicEqualArea);
  }).raw = d3_geo_conicEqualArea;
  d3.geo.albers = function() {
    return d3.geo.conicEqualArea().rotate([ 96, 0 ]).center([ -.6, 38.7 ]).parallels([ 29.5, 45.5 ]).scale(1070);
  };
  d3.geo.albersUsa = function() {
    var lower48 = d3.geo.albers();
    var alaska = d3.geo.conicEqualArea().rotate([ 154, 0 ]).center([ -2, 58.5 ]).parallels([ 55, 65 ]);
    var hawaii = d3.geo.conicEqualArea().rotate([ 157, 0 ]).center([ -3, 19.9 ]).parallels([ 8, 18 ]);
    var point, pointStream = {
      point: function(x, y) {
        point = [ x, y ];
      }
    }, lower48Point, alaskaPoint, hawaiiPoint;
    function albersUsa(coordinates) {
      var x = coordinates[0], y = coordinates[1];
      point = null;
      (lower48Point(x, y), point) || (alaskaPoint(x, y), point) || hawaiiPoint(x, y);
      return point;
    }
    albersUsa.invert = function(coordinates) {
      var k = lower48.scale(), t = lower48.translate(), x = (coordinates[0] - t[0]) / k, y = (coordinates[1] - t[1]) / k;
      return (y >= .12 && y < .234 && x >= -.425 && x < -.214 ? alaska : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii : lower48).invert(coordinates);
    };
    albersUsa.stream = function(stream) {
      var lower48Stream = lower48.stream(stream), alaskaStream = alaska.stream(stream), hawaiiStream = hawaii.stream(stream);
      return {
        point: function(x, y) {
          lower48Stream.point(x, y);
          alaskaStream.point(x, y);
          hawaiiStream.point(x, y);
        },
        sphere: function() {
          lower48Stream.sphere();
          alaskaStream.sphere();
          hawaiiStream.sphere();
        },
        lineStart: function() {
          lower48Stream.lineStart();
          alaskaStream.lineStart();
          hawaiiStream.lineStart();
        },
        lineEnd: function() {
          lower48Stream.lineEnd();
          alaskaStream.lineEnd();
          hawaiiStream.lineEnd();
        },
        polygonStart: function() {
          lower48Stream.polygonStart();
          alaskaStream.polygonStart();
          hawaiiStream.polygonStart();
        },
        polygonEnd: function() {
          lower48Stream.polygonEnd();
          alaskaStream.polygonEnd();
          hawaiiStream.polygonEnd();
        }
      };
    };
    albersUsa.precision = function(_) {
      if (!arguments.length) return lower48.precision();
      lower48.precision(_);
      alaska.precision(_);
      hawaii.precision(_);
      return albersUsa;
    };
    albersUsa.scale = function(_) {
      if (!arguments.length) return lower48.scale();
      lower48.scale(_);
      alaska.scale(_ * .35);
      hawaii.scale(_);
      return albersUsa.translate(lower48.translate());
    };
    albersUsa.translate = function(_) {
      if (!arguments.length) return lower48.translate();
      var k = lower48.scale(), x = +_[0], y = +_[1];
      lower48Point = lower48.translate(_).clipExtent([ [ x - .455 * k, y - .238 * k ], [ x + .455 * k, y + .238 * k ] ]).stream(pointStream).point;
      alaskaPoint = alaska.translate([ x - .307 * k, y + .201 * k ]).clipExtent([ [ x - .425 * k + ε, y + .12 * k + ε ], [ x - .214 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      hawaiiPoint = hawaii.translate([ x - .205 * k, y + .212 * k ]).clipExtent([ [ x - .214 * k + ε, y + .166 * k + ε ], [ x - .115 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      return albersUsa;
    };
    return albersUsa.scale(1070);
  };
  var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_pathAreaPolygon = 0;
      d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;
      d3_geo_pathAreaSum += abs(d3_geo_pathAreaPolygon / 2);
    }
  };
  function d3_geo_pathAreaRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathArea.point = function(x, y) {
      d3_geo_pathArea.point = nextPoint;
      x00 = x0 = x, y00 = y0 = y;
    };
    function nextPoint(x, y) {
      d3_geo_pathAreaPolygon += y0 * x - x0 * y;
      x0 = x, y0 = y;
    }
    d3_geo_pathArea.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  var d3_geo_pathBoundsX0, d3_geo_pathBoundsY0, d3_geo_pathBoundsX1, d3_geo_pathBoundsY1;
  var d3_geo_pathBounds = {
    point: d3_geo_pathBoundsPoint,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_pathBoundsPoint(x, y) {
    if (x < d3_geo_pathBoundsX0) d3_geo_pathBoundsX0 = x;
    if (x > d3_geo_pathBoundsX1) d3_geo_pathBoundsX1 = x;
    if (y < d3_geo_pathBoundsY0) d3_geo_pathBoundsY0 = y;
    if (y > d3_geo_pathBoundsY1) d3_geo_pathBoundsY1 = y;
  }
  function d3_geo_pathBuffer() {
    var pointCircle = d3_geo_pathBufferCircle(4.5), buffer = [];
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointCircle = d3_geo_pathBufferCircle(_);
        return stream;
      },
      result: function() {
        if (buffer.length) {
          var result = buffer.join("");
          buffer = [];
          return result;
        }
      }
    };
    function point(x, y) {
      buffer.push("M", x, ",", y, pointCircle);
    }
    function pointLineStart(x, y) {
      buffer.push("M", x, ",", y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      buffer.push("L", x, ",", y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      buffer.push("Z");
    }
    return stream;
  }
  function d3_geo_pathBufferCircle(radius) {
    return "m0," + radius + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius + "z";
  }
  var d3_geo_pathCentroid = {
    point: d3_geo_pathCentroidPoint,
    lineStart: d3_geo_pathCentroidLineStart,
    lineEnd: d3_geo_pathCentroidLineEnd,
    polygonStart: function() {
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;
      d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;
    }
  };
  function d3_geo_pathCentroidPoint(x, y) {
    d3_geo_centroidX0 += x;
    d3_geo_centroidY0 += y;
    ++d3_geo_centroidZ0;
  }
  function d3_geo_pathCentroidLineStart() {
    var x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
  }
  function d3_geo_pathCentroidLineEnd() {
    d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
  }
  function d3_geo_pathCentroidRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x00 = x0 = x, y00 = y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      z = y0 * x - x0 * y;
      d3_geo_centroidX2 += z * (x0 + x);
      d3_geo_centroidY2 += z * (y0 + y);
      d3_geo_centroidZ2 += z * 3;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
    d3_geo_pathCentroid.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  function d3_geo_pathContext(context) {
    var pointRadius = 4.5;
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointRadius = _;
        return stream;
      },
      result: d3_noop
    };
    function point(x, y) {
      context.moveTo(x + pointRadius, y);
      context.arc(x, y, pointRadius, 0, τ);
    }
    function pointLineStart(x, y) {
      context.moveTo(x, y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      context.lineTo(x, y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      context.closePath();
    }
    return stream;
  }
  function d3_geo_resample(project) {
    var δ2 = .5, cosMinDistance = Math.cos(30 * d3_radians), maxDepth = 16;
    function resample(stream) {
      return (maxDepth ? resampleRecursive : resampleNone)(stream);
    }
    function resampleNone(stream) {
      return d3_geo_transformPoint(stream, function(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      });
    }
    function resampleRecursive(stream) {
      var λ00, φ00, x00, y00, a00, b00, c00, λ0, x0, y0, a0, b0, c0;
      var resample = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          stream.polygonStart();
          resample.lineStart = ringStart;
        },
        polygonEnd: function() {
          stream.polygonEnd();
          resample.lineStart = lineStart;
        }
      };
      function point(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      }
      function lineStart() {
        x0 = NaN;
        resample.point = linePoint;
        stream.lineStart();
      }
      function linePoint(λ, φ) {
        var c = d3_geo_cartesian([ λ, φ ]), p = project(λ, φ);
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x0 = p[0], y0 = p[1], λ0 = λ, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x0, y0);
      }
      function lineEnd() {
        resample.point = point;
        stream.lineEnd();
      }
      function ringStart() {
        lineStart();
        resample.point = ringPoint;
        resample.lineEnd = ringEnd;
      }
      function ringPoint(λ, φ) {
        linePoint(λ00 = λ, φ00 = φ), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
        resample.point = linePoint;
      }
      function ringEnd() {
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x00, y00, λ00, a00, b00, c00, maxDepth, stream);
        resample.lineEnd = lineEnd;
        lineEnd();
      }
      return resample;
    }
    function resampleLineTo(x0, y0, λ0, a0, b0, c0, x1, y1, λ1, a1, b1, c1, depth, stream) {
      var dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy;
      if (d2 > 4 * δ2 && depth--) {
        var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = Math.sqrt(a * a + b * b + c * c), φ2 = Math.asin(c /= m), λ2 = abs(abs(c) - 1) < ε || abs(λ0 - λ1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a), p = project(λ2, φ2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > δ2 || abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
          resampleLineTo(x0, y0, λ0, a0, b0, c0, x2, y2, λ2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, λ2, a, b, c, x1, y1, λ1, a1, b1, c1, depth, stream);
        }
      }
    }
    resample.precision = function(_) {
      if (!arguments.length) return Math.sqrt(δ2);
      maxDepth = (δ2 = _ * _) > 0 && 16;
      return resample;
    };
    return resample;
  }
  d3.geo.path = function() {
    var pointRadius = 4.5, projection, context, projectStream, contextStream, cacheStream;
    function path(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
        if (!cacheStream || !cacheStream.valid) cacheStream = projectStream(contextStream);
        d3.geo.stream(object, cacheStream);
      }
      return contextStream.result();
    }
    path.area = function(object) {
      d3_geo_pathAreaSum = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathArea));
      return d3_geo_pathAreaSum;
    };
    path.centroid = function(object) {
      d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathCentroid));
      return d3_geo_centroidZ2 ? [ d3_geo_centroidX2 / d3_geo_centroidZ2, d3_geo_centroidY2 / d3_geo_centroidZ2 ] : d3_geo_centroidZ1 ? [ d3_geo_centroidX1 / d3_geo_centroidZ1, d3_geo_centroidY1 / d3_geo_centroidZ1 ] : d3_geo_centroidZ0 ? [ d3_geo_centroidX0 / d3_geo_centroidZ0, d3_geo_centroidY0 / d3_geo_centroidZ0 ] : [ NaN, NaN ];
    };
    path.bounds = function(object) {
      d3_geo_pathBoundsX1 = d3_geo_pathBoundsY1 = -(d3_geo_pathBoundsX0 = d3_geo_pathBoundsY0 = Infinity);
      d3.geo.stream(object, projectStream(d3_geo_pathBounds));
      return [ [ d3_geo_pathBoundsX0, d3_geo_pathBoundsY0 ], [ d3_geo_pathBoundsX1, d3_geo_pathBoundsY1 ] ];
    };
    path.projection = function(_) {
      if (!arguments.length) return projection;
      projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;
      return reset();
    };
    path.context = function(_) {
      if (!arguments.length) return context;
      contextStream = (context = _) == null ? new d3_geo_pathBuffer() : new d3_geo_pathContext(_);
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
      return reset();
    };
    path.pointRadius = function(_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
      return path;
    };
    function reset() {
      cacheStream = null;
      return path;
    }
    return path.projection(d3.geo.albersUsa()).context(null);
  };
  function d3_geo_pathProjectStream(project) {
    var resample = d3_geo_resample(function(x, y) {
      return project([ x * d3_degrees, y * d3_degrees ]);
    });
    return function(stream) {
      return d3_geo_projectionRadians(resample(stream));
    };
  }
  d3.geo.transform = function(methods) {
    return {
      stream: function(stream) {
        var transform = new d3_geo_transform(stream);
        for (var k in methods) transform[k] = methods[k];
        return transform;
      }
    };
  };
  function d3_geo_transform(stream) {
    this.stream = stream;
  }
  d3_geo_transform.prototype = {
    point: function(x, y) {
      this.stream.point(x, y);
    },
    sphere: function() {
      this.stream.sphere();
    },
    lineStart: function() {
      this.stream.lineStart();
    },
    lineEnd: function() {
      this.stream.lineEnd();
    },
    polygonStart: function() {
      this.stream.polygonStart();
    },
    polygonEnd: function() {
      this.stream.polygonEnd();
    }
  };
  function d3_geo_transformPoint(stream, point) {
    return {
      point: point,
      sphere: function() {
        stream.sphere();
      },
      lineStart: function() {
        stream.lineStart();
      },
      lineEnd: function() {
        stream.lineEnd();
      },
      polygonStart: function() {
        stream.polygonStart();
      },
      polygonEnd: function() {
        stream.polygonEnd();
      }
    };
  }
  d3.geo.projection = d3_geo_projection;
  d3.geo.projectionMutator = d3_geo_projectionMutator;
  function d3_geo_projection(project) {
    return d3_geo_projectionMutator(function() {
      return project;
    })();
  }
  function d3_geo_projectionMutator(projectAt) {
    var project, rotate, projectRotate, projectResample = d3_geo_resample(function(x, y) {
      x = project(x, y);
      return [ x[0] * k + δx, δy - x[1] * k ];
    }), k = 150, x = 480, y = 250, λ = 0, φ = 0, δλ = 0, δφ = 0, δγ = 0, δx, δy, preclip = d3_geo_clipAntimeridian, postclip = d3_identity, clipAngle = null, clipExtent = null, stream;
    function projection(point) {
      point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);
      return [ point[0] * k + δx, δy - point[1] * k ];
    }
    function invert(point) {
      point = projectRotate.invert((point[0] - δx) / k, (δy - point[1]) / k);
      return point && [ point[0] * d3_degrees, point[1] * d3_degrees ];
    }
    projection.stream = function(output) {
      if (stream) stream.valid = false;
      stream = d3_geo_projectionRadians(preclip(rotate, projectResample(postclip(output))));
      stream.valid = true;
      return stream;
    };
    projection.clipAngle = function(_) {
      if (!arguments.length) return clipAngle;
      preclip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle((clipAngle = +_) * d3_radians);
      return invalidate();
    };
    projection.clipExtent = function(_) {
      if (!arguments.length) return clipExtent;
      clipExtent = _;
      postclip = _ ? d3_geo_clipExtent(_[0][0], _[0][1], _[1][0], _[1][1]) : d3_identity;
      return invalidate();
    };
    projection.scale = function(_) {
      if (!arguments.length) return k;
      k = +_;
      return reset();
    };
    projection.translate = function(_) {
      if (!arguments.length) return [ x, y ];
      x = +_[0];
      y = +_[1];
      return reset();
    };
    projection.center = function(_) {
      if (!arguments.length) return [ λ * d3_degrees, φ * d3_degrees ];
      λ = _[0] % 360 * d3_radians;
      φ = _[1] % 360 * d3_radians;
      return reset();
    };
    projection.rotate = function(_) {
      if (!arguments.length) return [ δλ * d3_degrees, δφ * d3_degrees, δγ * d3_degrees ];
      δλ = _[0] % 360 * d3_radians;
      δφ = _[1] % 360 * d3_radians;
      δγ = _.length > 2 ? _[2] % 360 * d3_radians : 0;
      return reset();
    };
    d3.rebind(projection, projectResample, "precision");
    function reset() {
      projectRotate = d3_geo_compose(rotate = d3_geo_rotation(δλ, δφ, δγ), project);
      var center = project(λ, φ);
      δx = x - center[0] * k;
      δy = y + center[1] * k;
      return invalidate();
    }
    function invalidate() {
      if (stream) stream.valid = false, stream = null;
      return projection;
    }
    return function() {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return reset();
    };
  }
  function d3_geo_projectionRadians(stream) {
    return d3_geo_transformPoint(stream, function(x, y) {
      stream.point(x * d3_radians, y * d3_radians);
    });
  }
  function d3_geo_equirectangular(λ, φ) {
    return [ λ, φ ];
  }
  (d3.geo.equirectangular = function() {
    return d3_geo_projection(d3_geo_equirectangular);
  }).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;
  d3.geo.rotation = function(rotate) {
    rotate = d3_geo_rotation(rotate[0] % 360 * d3_radians, rotate[1] * d3_radians, rotate.length > 2 ? rotate[2] * d3_radians : 0);
    function forward(coordinates) {
      coordinates = rotate(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    }
    forward.invert = function(coordinates) {
      coordinates = rotate.invert(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    };
    return forward;
  };
  function d3_geo_identityRotation(λ, φ) {
    return [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
  }
  d3_geo_identityRotation.invert = d3_geo_equirectangular;
  function d3_geo_rotation(δλ, δφ, δγ) {
    return δλ ? δφ || δγ ? d3_geo_compose(d3_geo_rotationλ(δλ), d3_geo_rotationφγ(δφ, δγ)) : d3_geo_rotationλ(δλ) : δφ || δγ ? d3_geo_rotationφγ(δφ, δγ) : d3_geo_identityRotation;
  }
  function d3_geo_forwardRotationλ(δλ) {
    return function(λ, φ) {
      return λ += δλ, [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
    };
  }
  function d3_geo_rotationλ(δλ) {
    var rotation = d3_geo_forwardRotationλ(δλ);
    rotation.invert = d3_geo_forwardRotationλ(-δλ);
    return rotation;
  }
  function d3_geo_rotationφγ(δφ, δγ) {
    var cosδφ = Math.cos(δφ), sinδφ = Math.sin(δφ), cosδγ = Math.cos(δγ), sinδγ = Math.sin(δγ);
    function rotation(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδφ + x * sinδφ;
      return [ Math.atan2(y * cosδγ - k * sinδγ, x * cosδφ - z * sinδφ), d3_asin(k * cosδγ + y * sinδγ) ];
    }
    rotation.invert = function(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδγ - y * sinδγ;
      return [ Math.atan2(y * cosδγ + z * sinδγ, x * cosδφ + k * sinδφ), d3_asin(k * cosδφ - x * sinδφ) ];
    };
    return rotation;
  }
  d3.geo.circle = function() {
    var origin = [ 0, 0 ], angle, precision = 6, interpolate;
    function circle() {
      var center = typeof origin === "function" ? origin.apply(this, arguments) : origin, rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert, ring = [];
      interpolate(null, null, 1, {
        point: function(x, y) {
          ring.push(x = rotate(x, y));
          x[0] *= d3_degrees, x[1] *= d3_degrees;
        }
      });
      return {
        type: "Polygon",
        coordinates: [ ring ]
      };
    }
    circle.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return circle;
    };
    circle.angle = function(x) {
      if (!arguments.length) return angle;
      interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);
      return circle;
    };
    circle.precision = function(_) {
      if (!arguments.length) return precision;
      interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);
      return circle;
    };
    return circle.angle(90);
  };
  function d3_geo_circleInterpolate(radius, precision) {
    var cr = Math.cos(radius), sr = Math.sin(radius);
    return function(from, to, direction, listener) {
      var step = direction * precision;
      if (from != null) {
        from = d3_geo_circleAngle(cr, from);
        to = d3_geo_circleAngle(cr, to);
        if (direction > 0 ? from < to : from > to) from += direction * τ;
      } else {
        from = radius + direction * τ;
        to = radius - .5 * step;
      }
      for (var point, t = from; direction > 0 ? t > to : t < to; t -= step) {
        listener.point((point = d3_geo_spherical([ cr, -sr * Math.cos(t), -sr * Math.sin(t) ]))[0], point[1]);
      }
    };
  }
  function d3_geo_circleAngle(cr, point) {
    var a = d3_geo_cartesian(point);
    a[0] -= cr;
    d3_geo_cartesianNormalize(a);
    var angle = d3_acos(-a[1]);
    return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - ε) % (2 * Math.PI);
  }
  d3.geo.distance = function(a, b) {
    var Δλ = (b[0] - a[0]) * d3_radians, φ0 = a[1] * d3_radians, φ1 = b[1] * d3_radians, sinΔλ = Math.sin(Δλ), cosΔλ = Math.cos(Δλ), sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1), t;
    return Math.atan2(Math.sqrt((t = cosφ1 * sinΔλ) * t + (t = cosφ0 * sinφ1 - sinφ0 * cosφ1 * cosΔλ) * t), sinφ0 * sinφ1 + cosφ0 * cosφ1 * cosΔλ);
  };
  d3.geo.graticule = function() {
    var x1, x0, X1, X0, y1, y0, Y1, Y0, dx = 10, dy = dx, DX = 90, DY = 360, x, y, X, Y, precision = 2.5;
    function graticule() {
      return {
        type: "MultiLineString",
        coordinates: lines()
      };
    }
    function lines() {
      return d3.range(Math.ceil(X0 / DX) * DX, X1, DX).map(X).concat(d3.range(Math.ceil(Y0 / DY) * DY, Y1, DY).map(Y)).concat(d3.range(Math.ceil(x0 / dx) * dx, x1, dx).filter(function(x) {
        return abs(x % DX) > ε;
      }).map(x)).concat(d3.range(Math.ceil(y0 / dy) * dy, y1, dy).filter(function(y) {
        return abs(y % DY) > ε;
      }).map(y));
    }
    graticule.lines = function() {
      return lines().map(function(coordinates) {
        return {
          type: "LineString",
          coordinates: coordinates
        };
      });
    };
    graticule.outline = function() {
      return {
        type: "Polygon",
        coordinates: [ X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1)) ]
      };
    };
    graticule.extent = function(_) {
      if (!arguments.length) return graticule.minorExtent();
      return graticule.majorExtent(_).minorExtent(_);
    };
    graticule.majorExtent = function(_) {
      if (!arguments.length) return [ [ X0, Y0 ], [ X1, Y1 ] ];
      X0 = +_[0][0], X1 = +_[1][0];
      Y0 = +_[0][1], Y1 = +_[1][1];
      if (X0 > X1) _ = X0, X0 = X1, X1 = _;
      if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
      return graticule.precision(precision);
    };
    graticule.minorExtent = function(_) {
      if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
      x0 = +_[0][0], x1 = +_[1][0];
      y0 = +_[0][1], y1 = +_[1][1];
      if (x0 > x1) _ = x0, x0 = x1, x1 = _;
      if (y0 > y1) _ = y0, y0 = y1, y1 = _;
      return graticule.precision(precision);
    };
    graticule.step = function(_) {
      if (!arguments.length) return graticule.minorStep();
      return graticule.majorStep(_).minorStep(_);
    };
    graticule.majorStep = function(_) {
      if (!arguments.length) return [ DX, DY ];
      DX = +_[0], DY = +_[1];
      return graticule;
    };
    graticule.minorStep = function(_) {
      if (!arguments.length) return [ dx, dy ];
      dx = +_[0], dy = +_[1];
      return graticule;
    };
    graticule.precision = function(_) {
      if (!arguments.length) return precision;
      precision = +_;
      x = d3_geo_graticuleX(y0, y1, 90);
      y = d3_geo_graticuleY(x0, x1, precision);
      X = d3_geo_graticuleX(Y0, Y1, 90);
      Y = d3_geo_graticuleY(X0, X1, precision);
      return graticule;
    };
    return graticule.majorExtent([ [ -180, -90 + ε ], [ 180, 90 - ε ] ]).minorExtent([ [ -180, -80 - ε ], [ 180, 80 + ε ] ]);
  };
  function d3_geo_graticuleX(y0, y1, dy) {
    var y = d3.range(y0, y1 - ε, dy).concat(y1);
    return function(x) {
      return y.map(function(y) {
        return [ x, y ];
      });
    };
  }
  function d3_geo_graticuleY(x0, x1, dx) {
    var x = d3.range(x0, x1 - ε, dx).concat(x1);
    return function(y) {
      return x.map(function(x) {
        return [ x, y ];
      });
    };
  }
  function d3_source(d) {
    return d.source;
  }
  function d3_target(d) {
    return d.target;
  }
  d3.geo.greatArc = function() {
    var source = d3_source, source_, target = d3_target, target_;
    function greatArc() {
      return {
        type: "LineString",
        coordinates: [ source_ || source.apply(this, arguments), target_ || target.apply(this, arguments) ]
      };
    }
    greatArc.distance = function() {
      return d3.geo.distance(source_ || source.apply(this, arguments), target_ || target.apply(this, arguments));
    };
    greatArc.source = function(_) {
      if (!arguments.length) return source;
      source = _, source_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.target = function(_) {
      if (!arguments.length) return target;
      target = _, target_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.precision = function() {
      return arguments.length ? greatArc : 0;
    };
    return greatArc;
  };
  d3.geo.interpolate = function(source, target) {
    return d3_geo_interpolate(source[0] * d3_radians, source[1] * d3_radians, target[0] * d3_radians, target[1] * d3_radians);
  };
  function d3_geo_interpolate(x0, y0, x1, y1) {
    var cy0 = Math.cos(y0), sy0 = Math.sin(y0), cy1 = Math.cos(y1), sy1 = Math.sin(y1), kx0 = cy0 * Math.cos(x0), ky0 = cy0 * Math.sin(x0), kx1 = cy1 * Math.cos(x1), ky1 = cy1 * Math.sin(x1), d = 2 * Math.asin(Math.sqrt(d3_haversin(y1 - y0) + cy0 * cy1 * d3_haversin(x1 - x0))), k = 1 / Math.sin(d);
    var interpolate = d ? function(t) {
      var B = Math.sin(t *= d) * k, A = Math.sin(d - t) * k, x = A * kx0 + B * kx1, y = A * ky0 + B * ky1, z = A * sy0 + B * sy1;
      return [ Math.atan2(y, x) * d3_degrees, Math.atan2(z, Math.sqrt(x * x + y * y)) * d3_degrees ];
    } : function() {
      return [ x0 * d3_degrees, y0 * d3_degrees ];
    };
    interpolate.distance = d;
    return interpolate;
  }
  d3.geo.length = function(object) {
    d3_geo_lengthSum = 0;
    d3.geo.stream(object, d3_geo_length);
    return d3_geo_lengthSum;
  };
  var d3_geo_lengthSum;
  var d3_geo_length = {
    sphere: d3_noop,
    point: d3_noop,
    lineStart: d3_geo_lengthLineStart,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_lengthLineStart() {
    var λ0, sinφ0, cosφ0;
    d3_geo_length.point = function(λ, φ) {
      λ0 = λ * d3_radians, sinφ0 = Math.sin(φ *= d3_radians), cosφ0 = Math.cos(φ);
      d3_geo_length.point = nextPoint;
    };
    d3_geo_length.lineEnd = function() {
      d3_geo_length.point = d3_geo_length.lineEnd = d3_noop;
    };
    function nextPoint(λ, φ) {
      var sinφ = Math.sin(φ *= d3_radians), cosφ = Math.cos(φ), t = abs((λ *= d3_radians) - λ0), cosΔλ = Math.cos(t);
      d3_geo_lengthSum += Math.atan2(Math.sqrt((t = cosφ * Math.sin(t)) * t + (t = cosφ0 * sinφ - sinφ0 * cosφ * cosΔλ) * t), sinφ0 * sinφ + cosφ0 * cosφ * cosΔλ);
      λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ;
    }
  }
  function d3_geo_azimuthal(scale, angle) {
    function azimuthal(λ, φ) {
      var cosλ = Math.cos(λ), cosφ = Math.cos(φ), k = scale(cosλ * cosφ);
      return [ k * cosφ * Math.sin(λ), k * Math.sin(φ) ];
    }
    azimuthal.invert = function(x, y) {
      var ρ = Math.sqrt(x * x + y * y), c = angle(ρ), sinc = Math.sin(c), cosc = Math.cos(c);
      return [ Math.atan2(x * sinc, ρ * cosc), Math.asin(ρ && y * sinc / ρ) ];
    };
    return azimuthal;
  }
  var d3_geo_azimuthalEqualArea = d3_geo_azimuthal(function(cosλcosφ) {
    return Math.sqrt(2 / (1 + cosλcosφ));
  }, function(ρ) {
    return 2 * Math.asin(ρ / 2);
  });
  (d3.geo.azimuthalEqualArea = function() {
    return d3_geo_projection(d3_geo_azimuthalEqualArea);
  }).raw = d3_geo_azimuthalEqualArea;
  var d3_geo_azimuthalEquidistant = d3_geo_azimuthal(function(cosλcosφ) {
    var c = Math.acos(cosλcosφ);
    return c && c / Math.sin(c);
  }, d3_identity);
  (d3.geo.azimuthalEquidistant = function() {
    return d3_geo_projection(d3_geo_azimuthalEquidistant);
  }).raw = d3_geo_azimuthalEquidistant;
  function d3_geo_conicConformal(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), t = function(φ) {
      return Math.tan(π / 4 + φ / 2);
    }, n = φ0 === φ1 ? Math.sin(φ0) : Math.log(cosφ0 / Math.cos(φ1)) / Math.log(t(φ1) / t(φ0)), F = cosφ0 * Math.pow(t(φ0), n) / n;
    if (!n) return d3_geo_mercator;
    function forward(λ, φ) {
      if (F > 0) {
        if (φ < -halfπ + ε) φ = -halfπ + ε;
      } else {
        if (φ > halfπ - ε) φ = halfπ - ε;
      }
      var ρ = F / Math.pow(t(φ), n);
      return [ ρ * Math.sin(n * λ), F - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = F - y, ρ = d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y);
      return [ Math.atan2(x, ρ0_y) / n, 2 * Math.atan(Math.pow(F / ρ, 1 / n)) - halfπ ];
    };
    return forward;
  }
  (d3.geo.conicConformal = function() {
    return d3_geo_conic(d3_geo_conicConformal);
  }).raw = d3_geo_conicConformal;
  function d3_geo_conicEquidistant(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), n = φ0 === φ1 ? Math.sin(φ0) : (cosφ0 - Math.cos(φ1)) / (φ1 - φ0), G = cosφ0 / n + φ0;
    if (abs(n) < ε) return d3_geo_equirectangular;
    function forward(λ, φ) {
      var ρ = G - φ;
      return [ ρ * Math.sin(n * λ), G - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = G - y;
      return [ Math.atan2(x, ρ0_y) / n, G - d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y) ];
    };
    return forward;
  }
  (d3.geo.conicEquidistant = function() {
    return d3_geo_conic(d3_geo_conicEquidistant);
  }).raw = d3_geo_conicEquidistant;
  var d3_geo_gnomonic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / cosλcosφ;
  }, Math.atan);
  (d3.geo.gnomonic = function() {
    return d3_geo_projection(d3_geo_gnomonic);
  }).raw = d3_geo_gnomonic;
  function d3_geo_mercator(λ, φ) {
    return [ λ, Math.log(Math.tan(π / 4 + φ / 2)) ];
  }
  d3_geo_mercator.invert = function(x, y) {
    return [ x, 2 * Math.atan(Math.exp(y)) - halfπ ];
  };
  function d3_geo_mercatorProjection(project) {
    var m = d3_geo_projection(project), scale = m.scale, translate = m.translate, clipExtent = m.clipExtent, clipAuto;
    m.scale = function() {
      var v = scale.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.translate = function() {
      var v = translate.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.clipExtent = function(_) {
      var v = clipExtent.apply(m, arguments);
      if (v === m) {
        if (clipAuto = _ == null) {
          var k = π * scale(), t = translate();
          clipExtent([ [ t[0] - k, t[1] - k ], [ t[0] + k, t[1] + k ] ]);
        }
      } else if (clipAuto) {
        v = null;
      }
      return v;
    };
    return m.clipExtent(null);
  }
  (d3.geo.mercator = function() {
    return d3_geo_mercatorProjection(d3_geo_mercator);
  }).raw = d3_geo_mercator;
  var d3_geo_orthographic = d3_geo_azimuthal(function() {
    return 1;
  }, Math.asin);
  (d3.geo.orthographic = function() {
    return d3_geo_projection(d3_geo_orthographic);
  }).raw = d3_geo_orthographic;
  var d3_geo_stereographic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / (1 + cosλcosφ);
  }, function(ρ) {
    return 2 * Math.atan(ρ);
  });
  (d3.geo.stereographic = function() {
    return d3_geo_projection(d3_geo_stereographic);
  }).raw = d3_geo_stereographic;
  function d3_geo_transverseMercator(λ, φ) {
    return [ Math.log(Math.tan(π / 4 + φ / 2)), -λ ];
  }
  d3_geo_transverseMercator.invert = function(x, y) {
    return [ -y, 2 * Math.atan(Math.exp(x)) - halfπ ];
  };
  (d3.geo.transverseMercator = function() {
    var projection = d3_geo_mercatorProjection(d3_geo_transverseMercator), center = projection.center, rotate = projection.rotate;
    projection.center = function(_) {
      return _ ? center([ -_[1], _[0] ]) : (_ = center(), [ _[1], -_[0] ]);
    };
    projection.rotate = function(_) {
      return _ ? rotate([ _[0], _[1], _.length > 2 ? _[2] + 90 : 90 ]) : (_ = rotate(), 
      [ _[0], _[1], _[2] - 90 ]);
    };
    return rotate([ 0, 0, 90 ]);
  }).raw = d3_geo_transverseMercator;
  d3.geom = {};
  function d3_geom_pointX(d) {
    return d[0];
  }
  function d3_geom_pointY(d) {
    return d[1];
  }
  d3.geom.hull = function(vertices) {
    var x = d3_geom_pointX, y = d3_geom_pointY;
    if (arguments.length) return hull(vertices);
    function hull(data) {
      if (data.length < 3) return [];
      var fx = d3_functor(x), fy = d3_functor(y), i, n = data.length, points = [], flippedPoints = [];
      for (i = 0; i < n; i++) {
        points.push([ +fx.call(this, data[i], i), +fy.call(this, data[i], i), i ]);
      }
      points.sort(d3_geom_hullOrder);
      for (i = 0; i < n; i++) flippedPoints.push([ points[i][0], -points[i][1] ]);
      var upper = d3_geom_hullUpper(points), lower = d3_geom_hullUpper(flippedPoints);
      var skipLeft = lower[0] === upper[0], skipRight = lower[lower.length - 1] === upper[upper.length - 1], polygon = [];
      for (i = upper.length - 1; i >= 0; --i) polygon.push(data[points[upper[i]][2]]);
      for (i = +skipLeft; i < lower.length - skipRight; ++i) polygon.push(data[points[lower[i]][2]]);
      return polygon;
    }
    hull.x = function(_) {
      return arguments.length ? (x = _, hull) : x;
    };
    hull.y = function(_) {
      return arguments.length ? (y = _, hull) : y;
    };
    return hull;
  };
  function d3_geom_hullUpper(points) {
    var n = points.length, hull = [ 0, 1 ], hs = 2;
    for (var i = 2; i < n; i++) {
      while (hs > 1 && d3_cross2d(points[hull[hs - 2]], points[hull[hs - 1]], points[i]) <= 0) --hs;
      hull[hs++] = i;
    }
    return hull.slice(0, hs);
  }
  function d3_geom_hullOrder(a, b) {
    return a[0] - b[0] || a[1] - b[1];
  }
  d3.geom.polygon = function(coordinates) {
    d3_subclass(coordinates, d3_geom_polygonPrototype);
    return coordinates;
  };
  var d3_geom_polygonPrototype = d3.geom.polygon.prototype = [];
  d3_geom_polygonPrototype.area = function() {
    var i = -1, n = this.length, a, b = this[n - 1], area = 0;
    while (++i < n) {
      a = b;
      b = this[i];
      area += a[1] * b[0] - a[0] * b[1];
    }
    return area * .5;
  };
  d3_geom_polygonPrototype.centroid = function(k) {
    var i = -1, n = this.length, x = 0, y = 0, a, b = this[n - 1], c;
    if (!arguments.length) k = -1 / (6 * this.area());
    while (++i < n) {
      a = b;
      b = this[i];
      c = a[0] * b[1] - b[0] * a[1];
      x += (a[0] + b[0]) * c;
      y += (a[1] + b[1]) * c;
    }
    return [ x * k, y * k ];
  };
  d3_geom_polygonPrototype.clip = function(subject) {
    var input, closed = d3_geom_polygonClosed(subject), i = -1, n = this.length - d3_geom_polygonClosed(this), j, m, a = this[n - 1], b, c, d;
    while (++i < n) {
      input = subject.slice();
      subject.length = 0;
      b = this[i];
      c = input[(m = input.length - closed) - 1];
      j = -1;
      while (++j < m) {
        d = input[j];
        if (d3_geom_polygonInside(d, a, b)) {
          if (!d3_geom_polygonInside(c, a, b)) {
            subject.push(d3_geom_polygonIntersect(c, d, a, b));
          }
          subject.push(d);
        } else if (d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        c = d;
      }
      if (closed) subject.push(subject[0]);
      a = b;
    }
    return subject;
  };
  function d3_geom_polygonInside(p, a, b) {
    return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
  }
  function d3_geom_polygonIntersect(c, d, a, b) {
    var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3, y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3, ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
    return [ x1 + ua * x21, y1 + ua * y21 ];
  }
  function d3_geom_polygonClosed(coordinates) {
    var a = coordinates[0], b = coordinates[coordinates.length - 1];
    return !(a[0] - b[0] || a[1] - b[1]);
  }
  var d3_geom_voronoiEdges, d3_geom_voronoiCells, d3_geom_voronoiBeaches, d3_geom_voronoiBeachPool = [], d3_geom_voronoiFirstCircle, d3_geom_voronoiCircles, d3_geom_voronoiCirclePool = [];
  function d3_geom_voronoiBeach() {
    d3_geom_voronoiRedBlackNode(this);
    this.edge = this.site = this.circle = null;
  }
  function d3_geom_voronoiCreateBeach(site) {
    var beach = d3_geom_voronoiBeachPool.pop() || new d3_geom_voronoiBeach();
    beach.site = site;
    return beach;
  }
  function d3_geom_voronoiDetachBeach(beach) {
    d3_geom_voronoiDetachCircle(beach);
    d3_geom_voronoiBeaches.remove(beach);
    d3_geom_voronoiBeachPool.push(beach);
    d3_geom_voronoiRedBlackNode(beach);
  }
  function d3_geom_voronoiRemoveBeach(beach) {
    var circle = beach.circle, x = circle.x, y = circle.cy, vertex = {
      x: x,
      y: y
    }, previous = beach.P, next = beach.N, disappearing = [ beach ];
    d3_geom_voronoiDetachBeach(beach);
    var lArc = previous;
    while (lArc.circle && abs(x - lArc.circle.x) < ε && abs(y - lArc.circle.cy) < ε) {
      previous = lArc.P;
      disappearing.unshift(lArc);
      d3_geom_voronoiDetachBeach(lArc);
      lArc = previous;
    }
    disappearing.unshift(lArc);
    d3_geom_voronoiDetachCircle(lArc);
    var rArc = next;
    while (rArc.circle && abs(x - rArc.circle.x) < ε && abs(y - rArc.circle.cy) < ε) {
      next = rArc.N;
      disappearing.push(rArc);
      d3_geom_voronoiDetachBeach(rArc);
      rArc = next;
    }
    disappearing.push(rArc);
    d3_geom_voronoiDetachCircle(rArc);
    var nArcs = disappearing.length, iArc;
    for (iArc = 1; iArc < nArcs; ++iArc) {
      rArc = disappearing[iArc];
      lArc = disappearing[iArc - 1];
      d3_geom_voronoiSetEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
    }
    lArc = disappearing[0];
    rArc = disappearing[nArcs - 1];
    rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, rArc.site, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiAddBeach(site) {
    var x = site.x, directrix = site.y, lArc, rArc, dxl, dxr, node = d3_geom_voronoiBeaches._;
    while (node) {
      dxl = d3_geom_voronoiLeftBreakPoint(node, directrix) - x;
      if (dxl > ε) node = node.L; else {
        dxr = x - d3_geom_voronoiRightBreakPoint(node, directrix);
        if (dxr > ε) {
          if (!node.R) {
            lArc = node;
            break;
          }
          node = node.R;
        } else {
          if (dxl > -ε) {
            lArc = node.P;
            rArc = node;
          } else if (dxr > -ε) {
            lArc = node;
            rArc = node.N;
          } else {
            lArc = rArc = node;
          }
          break;
        }
      }
    }
    var newArc = d3_geom_voronoiCreateBeach(site);
    d3_geom_voronoiBeaches.insert(lArc, newArc);
    if (!lArc && !rArc) return;
    if (lArc === rArc) {
      d3_geom_voronoiDetachCircle(lArc);
      rArc = d3_geom_voronoiCreateBeach(lArc.site);
      d3_geom_voronoiBeaches.insert(newArc, rArc);
      newArc.edge = rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      d3_geom_voronoiAttachCircle(lArc);
      d3_geom_voronoiAttachCircle(rArc);
      return;
    }
    if (!rArc) {
      newArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      return;
    }
    d3_geom_voronoiDetachCircle(lArc);
    d3_geom_voronoiDetachCircle(rArc);
    var lSite = lArc.site, ax = lSite.x, ay = lSite.y, bx = site.x - ax, by = site.y - ay, rSite = rArc.site, cx = rSite.x - ax, cy = rSite.y - ay, d = 2 * (bx * cy - by * cx), hb = bx * bx + by * by, hc = cx * cx + cy * cy, vertex = {
      x: (cy * hb - by * hc) / d + ax,
      y: (bx * hc - cx * hb) / d + ay
    };
    d3_geom_voronoiSetEdgeEnd(rArc.edge, lSite, rSite, vertex);
    newArc.edge = d3_geom_voronoiCreateEdge(lSite, site, null, vertex);
    rArc.edge = d3_geom_voronoiCreateEdge(site, rSite, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiLeftBreakPoint(arc, directrix) {
    var site = arc.site, rfocx = site.x, rfocy = site.y, pby2 = rfocy - directrix;
    if (!pby2) return rfocx;
    var lArc = arc.P;
    if (!lArc) return -Infinity;
    site = lArc.site;
    var lfocx = site.x, lfocy = site.y, plby2 = lfocy - directrix;
    if (!plby2) return lfocx;
    var hl = lfocx - rfocx, aby2 = 1 / pby2 - 1 / plby2, b = hl / plby2;
    if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;
    return (rfocx + lfocx) / 2;
  }
  function d3_geom_voronoiRightBreakPoint(arc, directrix) {
    var rArc = arc.N;
    if (rArc) return d3_geom_voronoiLeftBreakPoint(rArc, directrix);
    var site = arc.site;
    return site.y === directrix ? site.x : Infinity;
  }
  function d3_geom_voronoiCell(site) {
    this.site = site;
    this.edges = [];
  }
  d3_geom_voronoiCell.prototype.prepare = function() {
    var halfEdges = this.edges, iHalfEdge = halfEdges.length, edge;
    while (iHalfEdge--) {
      edge = halfEdges[iHalfEdge].edge;
      if (!edge.b || !edge.a) halfEdges.splice(iHalfEdge, 1);
    }
    halfEdges.sort(d3_geom_voronoiHalfEdgeOrder);
    return halfEdges.length;
  };
  function d3_geom_voronoiCloseCells(extent) {
    var x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], x2, y2, x3, y3, cells = d3_geom_voronoiCells, iCell = cells.length, cell, iHalfEdge, halfEdges, nHalfEdges, start, end;
    while (iCell--) {
      cell = cells[iCell];
      if (!cell || !cell.prepare()) continue;
      halfEdges = cell.edges;
      nHalfEdges = halfEdges.length;
      iHalfEdge = 0;
      while (iHalfEdge < nHalfEdges) {
        end = halfEdges[iHalfEdge].end(), x3 = end.x, y3 = end.y;
        start = halfEdges[++iHalfEdge % nHalfEdges].start(), x2 = start.x, y2 = start.y;
        if (abs(x3 - x2) > ε || abs(y3 - y2) > ε) {
          halfEdges.splice(iHalfEdge, 0, new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, end, abs(x3 - x0) < ε && y1 - y3 > ε ? {
            x: x0,
            y: abs(x2 - x0) < ε ? y2 : y1
          } : abs(y3 - y1) < ε && x1 - x3 > ε ? {
            x: abs(y2 - y1) < ε ? x2 : x1,
            y: y1
          } : abs(x3 - x1) < ε && y3 - y0 > ε ? {
            x: x1,
            y: abs(x2 - x1) < ε ? y2 : y0
          } : abs(y3 - y0) < ε && x3 - x0 > ε ? {
            x: abs(y2 - y0) < ε ? x2 : x0,
            y: y0
          } : null), cell.site, null));
          ++nHalfEdges;
        }
      }
    }
  }
  function d3_geom_voronoiHalfEdgeOrder(a, b) {
    return b.angle - a.angle;
  }
  function d3_geom_voronoiCircle() {
    d3_geom_voronoiRedBlackNode(this);
    this.x = this.y = this.arc = this.site = this.cy = null;
  }
  function d3_geom_voronoiAttachCircle(arc) {
    var lArc = arc.P, rArc = arc.N;
    if (!lArc || !rArc) return;
    var lSite = lArc.site, cSite = arc.site, rSite = rArc.site;
    if (lSite === rSite) return;
    var bx = cSite.x, by = cSite.y, ax = lSite.x - bx, ay = lSite.y - by, cx = rSite.x - bx, cy = rSite.y - by;
    var d = 2 * (ax * cy - ay * cx);
    if (d >= -ε2) return;
    var ha = ax * ax + ay * ay, hc = cx * cx + cy * cy, x = (cy * ha - ay * hc) / d, y = (ax * hc - cx * ha) / d, cy = y + by;
    var circle = d3_geom_voronoiCirclePool.pop() || new d3_geom_voronoiCircle();
    circle.arc = arc;
    circle.site = cSite;
    circle.x = x + bx;
    circle.y = cy + Math.sqrt(x * x + y * y);
    circle.cy = cy;
    arc.circle = circle;
    var before = null, node = d3_geom_voronoiCircles._;
    while (node) {
      if (circle.y < node.y || circle.y === node.y && circle.x <= node.x) {
        if (node.L) node = node.L; else {
          before = node.P;
          break;
        }
      } else {
        if (node.R) node = node.R; else {
          before = node;
          break;
        }
      }
    }
    d3_geom_voronoiCircles.insert(before, circle);
    if (!before) d3_geom_voronoiFirstCircle = circle;
  }
  function d3_geom_voronoiDetachCircle(arc) {
    var circle = arc.circle;
    if (circle) {
      if (!circle.P) d3_geom_voronoiFirstCircle = circle.N;
      d3_geom_voronoiCircles.remove(circle);
      d3_geom_voronoiCirclePool.push(circle);
      d3_geom_voronoiRedBlackNode(circle);
      arc.circle = null;
    }
  }
  function d3_geom_voronoiClipEdges(extent) {
    var edges = d3_geom_voronoiEdges, clip = d3_geom_clipLine(extent[0][0], extent[0][1], extent[1][0], extent[1][1]), i = edges.length, e;
    while (i--) {
      e = edges[i];
      if (!d3_geom_voronoiConnectEdge(e, extent) || !clip(e) || abs(e.a.x - e.b.x) < ε && abs(e.a.y - e.b.y) < ε) {
        e.a = e.b = null;
        edges.splice(i, 1);
      }
    }
  }
  function d3_geom_voronoiConnectEdge(edge, extent) {
    var vb = edge.b;
    if (vb) return true;
    var va = edge.a, x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], lSite = edge.l, rSite = edge.r, lx = lSite.x, ly = lSite.y, rx = rSite.x, ry = rSite.y, fx = (lx + rx) / 2, fy = (ly + ry) / 2, fm, fb;
    if (ry === ly) {
      if (fx < x0 || fx >= x1) return;
      if (lx > rx) {
        if (!va) va = {
          x: fx,
          y: y0
        }; else if (va.y >= y1) return;
        vb = {
          x: fx,
          y: y1
        };
      } else {
        if (!va) va = {
          x: fx,
          y: y1
        }; else if (va.y < y0) return;
        vb = {
          x: fx,
          y: y0
        };
      }
    } else {
      fm = (lx - rx) / (ry - ly);
      fb = fy - fm * fx;
      if (fm < -1 || fm > 1) {
        if (lx > rx) {
          if (!va) va = {
            x: (y0 - fb) / fm,
            y: y0
          }; else if (va.y >= y1) return;
          vb = {
            x: (y1 - fb) / fm,
            y: y1
          };
        } else {
          if (!va) va = {
            x: (y1 - fb) / fm,
            y: y1
          }; else if (va.y < y0) return;
          vb = {
            x: (y0 - fb) / fm,
            y: y0
          };
        }
      } else {
        if (ly < ry) {
          if (!va) va = {
            x: x0,
            y: fm * x0 + fb
          }; else if (va.x >= x1) return;
          vb = {
            x: x1,
            y: fm * x1 + fb
          };
        } else {
          if (!va) va = {
            x: x1,
            y: fm * x1 + fb
          }; else if (va.x < x0) return;
          vb = {
            x: x0,
            y: fm * x0 + fb
          };
        }
      }
    }
    edge.a = va;
    edge.b = vb;
    return true;
  }
  function d3_geom_voronoiEdge(lSite, rSite) {
    this.l = lSite;
    this.r = rSite;
    this.a = this.b = null;
  }
  function d3_geom_voronoiCreateEdge(lSite, rSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, rSite);
    d3_geom_voronoiEdges.push(edge);
    if (va) d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, va);
    if (vb) d3_geom_voronoiSetEdgeEnd(edge, rSite, lSite, vb);
    d3_geom_voronoiCells[lSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, lSite, rSite));
    d3_geom_voronoiCells[rSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, rSite, lSite));
    return edge;
  }
  function d3_geom_voronoiCreateBorderEdge(lSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, null);
    edge.a = va;
    edge.b = vb;
    d3_geom_voronoiEdges.push(edge);
    return edge;
  }
  function d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, vertex) {
    if (!edge.a && !edge.b) {
      edge.a = vertex;
      edge.l = lSite;
      edge.r = rSite;
    } else if (edge.l === rSite) {
      edge.b = vertex;
    } else {
      edge.a = vertex;
    }
  }
  function d3_geom_voronoiHalfEdge(edge, lSite, rSite) {
    var va = edge.a, vb = edge.b;
    this.edge = edge;
    this.site = lSite;
    this.angle = rSite ? Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x) : edge.l === lSite ? Math.atan2(vb.x - va.x, va.y - vb.y) : Math.atan2(va.x - vb.x, vb.y - va.y);
  }
  d3_geom_voronoiHalfEdge.prototype = {
    start: function() {
      return this.edge.l === this.site ? this.edge.a : this.edge.b;
    },
    end: function() {
      return this.edge.l === this.site ? this.edge.b : this.edge.a;
    }
  };
  function d3_geom_voronoiRedBlackTree() {
    this._ = null;
  }
  function d3_geom_voronoiRedBlackNode(node) {
    node.U = node.C = node.L = node.R = node.P = node.N = null;
  }
  d3_geom_voronoiRedBlackTree.prototype = {
    insert: function(after, node) {
      var parent, grandpa, uncle;
      if (after) {
        node.P = after;
        node.N = after.N;
        if (after.N) after.N.P = node;
        after.N = node;
        if (after.R) {
          after = after.R;
          while (after.L) after = after.L;
          after.L = node;
        } else {
          after.R = node;
        }
        parent = after;
      } else if (this._) {
        after = d3_geom_voronoiRedBlackFirst(this._);
        node.P = null;
        node.N = after;
        after.P = after.L = node;
        parent = after;
      } else {
        node.P = node.N = null;
        this._ = node;
        parent = null;
      }
      node.L = node.R = null;
      node.U = parent;
      node.C = true;
      after = node;
      while (parent && parent.C) {
        grandpa = parent.U;
        if (parent === grandpa.L) {
          uncle = grandpa.R;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.R) {
              d3_geom_voronoiRedBlackRotateLeft(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, grandpa);
          }
        } else {
          uncle = grandpa.L;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.L) {
              d3_geom_voronoiRedBlackRotateRight(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, grandpa);
          }
        }
        parent = after.U;
      }
      this._.C = false;
    },
    remove: function(node) {
      if (node.N) node.N.P = node.P;
      if (node.P) node.P.N = node.N;
      node.N = node.P = null;
      var parent = node.U, sibling, left = node.L, right = node.R, next, red;
      if (!left) next = right; else if (!right) next = left; else next = d3_geom_voronoiRedBlackFirst(right);
      if (parent) {
        if (parent.L === node) parent.L = next; else parent.R = next;
      } else {
        this._ = next;
      }
      if (left && right) {
        red = next.C;
        next.C = node.C;
        next.L = left;
        left.U = next;
        if (next !== right) {
          parent = next.U;
          next.U = node.U;
          node = next.R;
          parent.L = node;
          next.R = right;
          right.U = next;
        } else {
          next.U = parent;
          parent = next;
          node = next.R;
        }
      } else {
        red = node.C;
        node = next;
      }
      if (node) node.U = parent;
      if (red) return;
      if (node && node.C) {
        node.C = false;
        return;
      }
      do {
        if (node === this._) break;
        if (node === parent.L) {
          sibling = parent.R;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            sibling = parent.R;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.R || !sibling.R.C) {
              sibling.L.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateRight(this, sibling);
              sibling = parent.R;
            }
            sibling.C = parent.C;
            parent.C = sibling.R.C = false;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            node = this._;
            break;
          }
        } else {
          sibling = parent.L;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            sibling = parent.L;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.L || !sibling.L.C) {
              sibling.R.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateLeft(this, sibling);
              sibling = parent.L;
            }
            sibling.C = parent.C;
            parent.C = sibling.L.C = false;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            node = this._;
            break;
          }
        }
        sibling.C = true;
        node = parent;
        parent = parent.U;
      } while (!node.C);
      if (node) node.C = false;
    }
  };
  function d3_geom_voronoiRedBlackRotateLeft(tree, node) {
    var p = node, q = node.R, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.R = q.L;
    if (p.R) p.R.U = p;
    q.L = p;
  }
  function d3_geom_voronoiRedBlackRotateRight(tree, node) {
    var p = node, q = node.L, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.L = q.R;
    if (p.L) p.L.U = p;
    q.R = p;
  }
  function d3_geom_voronoiRedBlackFirst(node) {
    while (node.L) node = node.L;
    return node;
  }
  function d3_geom_voronoi(sites, bbox) {
    var site = sites.sort(d3_geom_voronoiVertexOrder).pop(), x0, y0, circle;
    d3_geom_voronoiEdges = [];
    d3_geom_voronoiCells = new Array(sites.length);
    d3_geom_voronoiBeaches = new d3_geom_voronoiRedBlackTree();
    d3_geom_voronoiCircles = new d3_geom_voronoiRedBlackTree();
    while (true) {
      circle = d3_geom_voronoiFirstCircle;
      if (site && (!circle || site.y < circle.y || site.y === circle.y && site.x < circle.x)) {
        if (site.x !== x0 || site.y !== y0) {
          d3_geom_voronoiCells[site.i] = new d3_geom_voronoiCell(site);
          d3_geom_voronoiAddBeach(site);
          x0 = site.x, y0 = site.y;
        }
        site = sites.pop();
      } else if (circle) {
        d3_geom_voronoiRemoveBeach(circle.arc);
      } else {
        break;
      }
    }
    if (bbox) d3_geom_voronoiClipEdges(bbox), d3_geom_voronoiCloseCells(bbox);
    var diagram = {
      cells: d3_geom_voronoiCells,
      edges: d3_geom_voronoiEdges
    };
    d3_geom_voronoiBeaches = d3_geom_voronoiCircles = d3_geom_voronoiEdges = d3_geom_voronoiCells = null;
    return diagram;
  }
  function d3_geom_voronoiVertexOrder(a, b) {
    return b.y - a.y || b.x - a.x;
  }
  d3.geom.voronoi = function(points) {
    var x = d3_geom_pointX, y = d3_geom_pointY, fx = x, fy = y, clipExtent = d3_geom_voronoiClipExtent;
    if (points) return voronoi(points);
    function voronoi(data) {
      var polygons = new Array(data.length), x0 = clipExtent[0][0], y0 = clipExtent[0][1], x1 = clipExtent[1][0], y1 = clipExtent[1][1];
      d3_geom_voronoi(sites(data), clipExtent).cells.forEach(function(cell, i) {
        var edges = cell.edges, site = cell.site, polygon = polygons[i] = edges.length ? edges.map(function(e) {
          var s = e.start();
          return [ s.x, s.y ];
        }) : site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1 ? [ [ x0, y1 ], [ x1, y1 ], [ x1, y0 ], [ x0, y0 ] ] : [];
        polygon.point = data[i];
      });
      return polygons;
    }
    function sites(data) {
      return data.map(function(d, i) {
        return {
          x: Math.round(fx(d, i) / ε) * ε,
          y: Math.round(fy(d, i) / ε) * ε,
          i: i
        };
      });
    }
    voronoi.links = function(data) {
      return d3_geom_voronoi(sites(data)).edges.filter(function(edge) {
        return edge.l && edge.r;
      }).map(function(edge) {
        return {
          source: data[edge.l.i],
          target: data[edge.r.i]
        };
      });
    };
    voronoi.triangles = function(data) {
      var triangles = [];
      d3_geom_voronoi(sites(data)).cells.forEach(function(cell, i) {
        var site = cell.site, edges = cell.edges.sort(d3_geom_voronoiHalfEdgeOrder), j = -1, m = edges.length, e0, s0, e1 = edges[m - 1].edge, s1 = e1.l === site ? e1.r : e1.l;
        while (++j < m) {
          e0 = e1;
          s0 = s1;
          e1 = edges[j].edge;
          s1 = e1.l === site ? e1.r : e1.l;
          if (i < s0.i && i < s1.i && d3_geom_voronoiTriangleArea(site, s0, s1) < 0) {
            triangles.push([ data[i], data[s0.i], data[s1.i] ]);
          }
        }
      });
      return triangles;
    };
    voronoi.x = function(_) {
      return arguments.length ? (fx = d3_functor(x = _), voronoi) : x;
    };
    voronoi.y = function(_) {
      return arguments.length ? (fy = d3_functor(y = _), voronoi) : y;
    };
    voronoi.clipExtent = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent;
      clipExtent = _ == null ? d3_geom_voronoiClipExtent : _;
      return voronoi;
    };
    voronoi.size = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent && clipExtent[1];
      return voronoi.clipExtent(_ && [ [ 0, 0 ], _ ]);
    };
    return voronoi;
  };
  var d3_geom_voronoiClipExtent = [ [ -1e6, -1e6 ], [ 1e6, 1e6 ] ];
  function d3_geom_voronoiTriangleArea(a, b, c) {
    return (a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y);
  }
  d3.geom.delaunay = function(vertices) {
    return d3.geom.voronoi().triangles(vertices);
  };
  d3.geom.quadtree = function(points, x1, y1, x2, y2) {
    var x = d3_geom_pointX, y = d3_geom_pointY, compat;
    if (compat = arguments.length) {
      x = d3_geom_quadtreeCompatX;
      y = d3_geom_quadtreeCompatY;
      if (compat === 3) {
        y2 = y1;
        x2 = x1;
        y1 = x1 = 0;
      }
      return quadtree(points);
    }
    function quadtree(data) {
      var d, fx = d3_functor(x), fy = d3_functor(y), xs, ys, i, n, x1_, y1_, x2_, y2_;
      if (x1 != null) {
        x1_ = x1, y1_ = y1, x2_ = x2, y2_ = y2;
      } else {
        x2_ = y2_ = -(x1_ = y1_ = Infinity);
        xs = [], ys = [];
        n = data.length;
        if (compat) for (i = 0; i < n; ++i) {
          d = data[i];
          if (d.x < x1_) x1_ = d.x;
          if (d.y < y1_) y1_ = d.y;
          if (d.x > x2_) x2_ = d.x;
          if (d.y > y2_) y2_ = d.y;
          xs.push(d.x);
          ys.push(d.y);
        } else for (i = 0; i < n; ++i) {
          var x_ = +fx(d = data[i], i), y_ = +fy(d, i);
          if (x_ < x1_) x1_ = x_;
          if (y_ < y1_) y1_ = y_;
          if (x_ > x2_) x2_ = x_;
          if (y_ > y2_) y2_ = y_;
          xs.push(x_);
          ys.push(y_);
        }
      }
      var dx = x2_ - x1_, dy = y2_ - y1_;
      if (dx > dy) y2_ = y1_ + dx; else x2_ = x1_ + dy;
      function insert(n, d, x, y, x1, y1, x2, y2) {
        if (isNaN(x) || isNaN(y)) return;
        if (n.leaf) {
          var nx = n.x, ny = n.y;
          if (nx != null) {
            if (abs(nx - x) + abs(ny - y) < .01) {
              insertChild(n, d, x, y, x1, y1, x2, y2);
            } else {
              var nPoint = n.point;
              n.x = n.y = n.point = null;
              insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);
              insertChild(n, d, x, y, x1, y1, x2, y2);
            }
          } else {
            n.x = x, n.y = y, n.point = d;
          }
        } else {
          insertChild(n, d, x, y, x1, y1, x2, y2);
        }
      }
      function insertChild(n, d, x, y, x1, y1, x2, y2) {
        var xm = (x1 + x2) * .5, ym = (y1 + y2) * .5, right = x >= xm, below = y >= ym, i = below << 1 | right;
        n.leaf = false;
        n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode());
        if (right) x1 = xm; else x2 = xm;
        if (below) y1 = ym; else y2 = ym;
        insert(n, d, x, y, x1, y1, x2, y2);
      }
      var root = d3_geom_quadtreeNode();
      root.add = function(d) {
        insert(root, d, +fx(d, ++i), +fy(d, i), x1_, y1_, x2_, y2_);
      };
      root.visit = function(f) {
        d3_geom_quadtreeVisit(f, root, x1_, y1_, x2_, y2_);
      };
      root.find = function(point) {
        return d3_geom_quadtreeFind(root, point[0], point[1], x1_, y1_, x2_, y2_);
      };
      i = -1;
      if (x1 == null) {
        while (++i < n) {
          insert(root, data[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
        }
        --i;
      } else data.forEach(root.add);
      xs = ys = data = d = null;
      return root;
    }
    quadtree.x = function(_) {
      return arguments.length ? (x = _, quadtree) : x;
    };
    quadtree.y = function(_) {
      return arguments.length ? (y = _, quadtree) : y;
    };
    quadtree.extent = function(_) {
      if (!arguments.length) return x1 == null ? null : [ [ x1, y1 ], [ x2, y2 ] ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = +_[0][0], y1 = +_[0][1], x2 = +_[1][0], 
      y2 = +_[1][1];
      return quadtree;
    };
    quadtree.size = function(_) {
      if (!arguments.length) return x1 == null ? null : [ x2 - x1, y2 - y1 ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = y1 = 0, x2 = +_[0], y2 = +_[1];
      return quadtree;
    };
    return quadtree;
  };
  function d3_geom_quadtreeCompatX(d) {
    return d.x;
  }
  function d3_geom_quadtreeCompatY(d) {
    return d.y;
  }
  function d3_geom_quadtreeNode() {
    return {
      leaf: true,
      nodes: [],
      point: null,
      x: null,
      y: null
    };
  }
  function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {
    if (!f(node, x1, y1, x2, y2)) {
      var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, children = node.nodes;
      if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);
      if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);
      if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);
      if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);
    }
  }
  function d3_geom_quadtreeFind(root, x, y, x0, y0, x3, y3) {
    var minDistance2 = Infinity, closestPoint;
    (function find(node, x1, y1, x2, y2) {
      if (x1 > x3 || y1 > y3 || x2 < x0 || y2 < y0) return;
      if (point = node.point) {
        var point, dx = x - node.x, dy = y - node.y, distance2 = dx * dx + dy * dy;
        if (distance2 < minDistance2) {
          var distance = Math.sqrt(minDistance2 = distance2);
          x0 = x - distance, y0 = y - distance;
          x3 = x + distance, y3 = y + distance;
          closestPoint = point;
        }
      }
      var children = node.nodes, xm = (x1 + x2) * .5, ym = (y1 + y2) * .5, right = x >= xm, below = y >= ym;
      for (var i = below << 1 | right, j = i + 4; i < j; ++i) {
        if (node = children[i & 3]) switch (i & 3) {
         case 0:
          find(node, x1, y1, xm, ym);
          break;

         case 1:
          find(node, xm, y1, x2, ym);
          break;

         case 2:
          find(node, x1, ym, xm, y2);
          break;

         case 3:
          find(node, xm, ym, x2, y2);
          break;
        }
      }
    })(root, x0, y0, x3, y3);
    return closestPoint;
  }
  d3.interpolateRgb = d3_interpolateRgb;
  function d3_interpolateRgb(a, b) {
    a = d3.rgb(a);
    b = d3.rgb(b);
    var ar = a.r, ag = a.g, ab = a.b, br = b.r - ar, bg = b.g - ag, bb = b.b - ab;
    return function(t) {
      return "#" + d3_rgb_hex(Math.round(ar + br * t)) + d3_rgb_hex(Math.round(ag + bg * t)) + d3_rgb_hex(Math.round(ab + bb * t));
    };
  }
  d3.interpolateObject = d3_interpolateObject;
  function d3_interpolateObject(a, b) {
    var i = {}, c = {}, k;
    for (k in a) {
      if (k in b) {
        i[k] = d3_interpolate(a[k], b[k]);
      } else {
        c[k] = a[k];
      }
    }
    for (k in b) {
      if (!(k in a)) {
        c[k] = b[k];
      }
    }
    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }
  d3.interpolateNumber = d3_interpolateNumber;
  function d3_interpolateNumber(a, b) {
    a = +a, b = +b;
    return function(t) {
      return a * (1 - t) + b * t;
    };
  }
  d3.interpolateString = d3_interpolateString;
  function d3_interpolateString(a, b) {
    var bi = d3_interpolate_numberA.lastIndex = d3_interpolate_numberB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
    a = a + "", b = b + "";
    while ((am = d3_interpolate_numberA.exec(a)) && (bm = d3_interpolate_numberB.exec(b))) {
      if ((bs = bm.index) > bi) {
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s[i]) s[i] += bm; else s[++i] = bm;
      } else {
        s[++i] = null;
        q.push({
          i: i,
          x: d3_interpolateNumber(am, bm)
        });
      }
      bi = d3_interpolate_numberB.lastIndex;
    }
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; else s[++i] = bs;
    }
    return s.length < 2 ? q[0] ? (b = q[0].x, function(t) {
      return b(t) + "";
    }) : function() {
      return b;
    } : (b = q.length, function(t) {
      for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    });
  }
  var d3_interpolate_numberA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, d3_interpolate_numberB = new RegExp(d3_interpolate_numberA.source, "g");
  d3.interpolate = d3_interpolate;
  function d3_interpolate(a, b) {
    var i = d3.interpolators.length, f;
    while (--i >= 0 && !(f = d3.interpolators[i](a, b))) ;
    return f;
  }
  d3.interpolators = [ function(a, b) {
    var t = typeof b;
    return (t === "string" ? d3_rgb_names.has(b.toLowerCase()) || /^(#|rgb\(|hsl\()/i.test(b) ? d3_interpolateRgb : d3_interpolateString : b instanceof d3_color ? d3_interpolateRgb : Array.isArray(b) ? d3_interpolateArray : t === "object" && isNaN(b) ? d3_interpolateObject : d3_interpolateNumber)(a, b);
  } ];
  d3.interpolateArray = d3_interpolateArray;
  function d3_interpolateArray(a, b) {
    var x = [], c = [], na = a.length, nb = b.length, n0 = Math.min(a.length, b.length), i;
    for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));
    for (;i < na; ++i) c[i] = a[i];
    for (;i < nb; ++i) c[i] = b[i];
    return function(t) {
      for (i = 0; i < n0; ++i) c[i] = x[i](t);
      return c;
    };
  }
  var d3_ease_default = function() {
    return d3_identity;
  };
  var d3_ease = d3.map({
    linear: d3_ease_default,
    poly: d3_ease_poly,
    quad: function() {
      return d3_ease_quad;
    },
    cubic: function() {
      return d3_ease_cubic;
    },
    sin: function() {
      return d3_ease_sin;
    },
    exp: function() {
      return d3_ease_exp;
    },
    circle: function() {
      return d3_ease_circle;
    },
    elastic: d3_ease_elastic,
    back: d3_ease_back,
    bounce: function() {
      return d3_ease_bounce;
    }
  });
  var d3_ease_mode = d3.map({
    "in": d3_identity,
    out: d3_ease_reverse,
    "in-out": d3_ease_reflect,
    "out-in": function(f) {
      return d3_ease_reflect(d3_ease_reverse(f));
    }
  });
  d3.ease = function(name) {
    var i = name.indexOf("-"), t = i >= 0 ? name.slice(0, i) : name, m = i >= 0 ? name.slice(i + 1) : "in";
    t = d3_ease.get(t) || d3_ease_default;
    m = d3_ease_mode.get(m) || d3_identity;
    return d3_ease_clamp(m(t.apply(null, d3_arraySlice.call(arguments, 1))));
  };
  function d3_ease_clamp(f) {
    return function(t) {
      return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
    };
  }
  function d3_ease_reverse(f) {
    return function(t) {
      return 1 - f(1 - t);
    };
  }
  function d3_ease_reflect(f) {
    return function(t) {
      return .5 * (t < .5 ? f(2 * t) : 2 - f(2 - 2 * t));
    };
  }
  function d3_ease_quad(t) {
    return t * t;
  }
  function d3_ease_cubic(t) {
    return t * t * t;
  }
  function d3_ease_cubicInOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var t2 = t * t, t3 = t2 * t;
    return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
  }
  function d3_ease_poly(e) {
    return function(t) {
      return Math.pow(t, e);
    };
  }
  function d3_ease_sin(t) {
    return 1 - Math.cos(t * halfπ);
  }
  function d3_ease_exp(t) {
    return Math.pow(2, 10 * (t - 1));
  }
  function d3_ease_circle(t) {
    return 1 - Math.sqrt(1 - t * t);
  }
  function d3_ease_elastic(a, p) {
    var s;
    if (arguments.length < 2) p = .45;
    if (arguments.length) s = p / τ * Math.asin(1 / a); else a = 1, s = p / 4;
    return function(t) {
      return 1 + a * Math.pow(2, -10 * t) * Math.sin((t - s) * τ / p);
    };
  }
  function d3_ease_back(s) {
    if (!s) s = 1.70158;
    return function(t) {
      return t * t * ((s + 1) * t - s);
    };
  }
  function d3_ease_bounce(t) {
    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
  }
  d3.interpolateHcl = d3_interpolateHcl;
  function d3_interpolateHcl(a, b) {
    a = d3.hcl(a);
    b = d3.hcl(b);
    var ah = a.h, ac = a.c, al = a.l, bh = b.h - ah, bc = b.c - ac, bl = b.l - al;
    if (isNaN(bc)) bc = 0, ac = isNaN(ac) ? b.c : ac;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hcl_lab(ah + bh * t, ac + bc * t, al + bl * t) + "";
    };
  }
  d3.interpolateHsl = d3_interpolateHsl;
  function d3_interpolateHsl(a, b) {
    a = d3.hsl(a);
    b = d3.hsl(b);
    var ah = a.h, as = a.s, al = a.l, bh = b.h - ah, bs = b.s - as, bl = b.l - al;
    if (isNaN(bs)) bs = 0, as = isNaN(as) ? b.s : as;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hsl_rgb(ah + bh * t, as + bs * t, al + bl * t) + "";
    };
  }
  d3.interpolateLab = d3_interpolateLab;
  function d3_interpolateLab(a, b) {
    a = d3.lab(a);
    b = d3.lab(b);
    var al = a.l, aa = a.a, ab = a.b, bl = b.l - al, ba = b.a - aa, bb = b.b - ab;
    return function(t) {
      return d3_lab_rgb(al + bl * t, aa + ba * t, ab + bb * t) + "";
    };
  }
  d3.interpolateRound = d3_interpolateRound;
  function d3_interpolateRound(a, b) {
    b -= a;
    return function(t) {
      return Math.round(a + b * t);
    };
  }
  d3.transform = function(string) {
    var g = d3_document.createElementNS(d3.ns.prefix.svg, "g");
    return (d3.transform = function(string) {
      if (string != null) {
        g.setAttribute("transform", string);
        var t = g.transform.baseVal.consolidate();
      }
      return new d3_transform(t ? t.matrix : d3_transformIdentity);
    })(string);
  };
  function d3_transform(m) {
    var r0 = [ m.a, m.b ], r1 = [ m.c, m.d ], kx = d3_transformNormalize(r0), kz = d3_transformDot(r0, r1), ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
    if (r0[0] * r1[1] < r1[0] * r0[1]) {
      r0[0] *= -1;
      r0[1] *= -1;
      kx *= -1;
      kz *= -1;
    }
    this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;
    this.translate = [ m.e, m.f ];
    this.scale = [ kx, ky ];
    this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;
  }
  d3_transform.prototype.toString = function() {
    return "translate(" + this.translate + ")rotate(" + this.rotate + ")skewX(" + this.skew + ")scale(" + this.scale + ")";
  };
  function d3_transformDot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function d3_transformNormalize(a) {
    var k = Math.sqrt(d3_transformDot(a, a));
    if (k) {
      a[0] /= k;
      a[1] /= k;
    }
    return k;
  }
  function d3_transformCombine(a, b, k) {
    a[0] += k * b[0];
    a[1] += k * b[1];
    return a;
  }
  var d3_transformIdentity = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0
  };
  d3.interpolateTransform = d3_interpolateTransform;
  function d3_interpolateTransformPop(s) {
    return s.length ? s.pop() + "," : "";
  }
  function d3_interpolateTranslate(ta, tb, s, q) {
    if (ta[0] !== tb[0] || ta[1] !== tb[1]) {
      var i = s.push("translate(", null, ",", null, ")");
      q.push({
        i: i - 4,
        x: d3_interpolateNumber(ta[0], tb[0])
      }, {
        i: i - 2,
        x: d3_interpolateNumber(ta[1], tb[1])
      });
    } else if (tb[0] || tb[1]) {
      s.push("translate(" + tb + ")");
    }
  }
  function d3_interpolateRotate(ra, rb, s, q) {
    if (ra !== rb) {
      if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360;
      q.push({
        i: s.push(d3_interpolateTransformPop(s) + "rotate(", null, ")") - 2,
        x: d3_interpolateNumber(ra, rb)
      });
    } else if (rb) {
      s.push(d3_interpolateTransformPop(s) + "rotate(" + rb + ")");
    }
  }
  function d3_interpolateSkew(wa, wb, s, q) {
    if (wa !== wb) {
      q.push({
        i: s.push(d3_interpolateTransformPop(s) + "skewX(", null, ")") - 2,
        x: d3_interpolateNumber(wa, wb)
      });
    } else if (wb) {
      s.push(d3_interpolateTransformPop(s) + "skewX(" + wb + ")");
    }
  }
  function d3_interpolateScale(ka, kb, s, q) {
    if (ka[0] !== kb[0] || ka[1] !== kb[1]) {
      var i = s.push(d3_interpolateTransformPop(s) + "scale(", null, ",", null, ")");
      q.push({
        i: i - 4,
        x: d3_interpolateNumber(ka[0], kb[0])
      }, {
        i: i - 2,
        x: d3_interpolateNumber(ka[1], kb[1])
      });
    } else if (kb[0] !== 1 || kb[1] !== 1) {
      s.push(d3_interpolateTransformPop(s) + "scale(" + kb + ")");
    }
  }
  function d3_interpolateTransform(a, b) {
    var s = [], q = [];
    a = d3.transform(a), b = d3.transform(b);
    d3_interpolateTranslate(a.translate, b.translate, s, q);
    d3_interpolateRotate(a.rotate, b.rotate, s, q);
    d3_interpolateSkew(a.skew, b.skew, s, q);
    d3_interpolateScale(a.scale, b.scale, s, q);
    a = b = null;
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  }
  function d3_uninterpolateNumber(a, b) {
    b = (b -= a = +a) || 1 / b;
    return function(x) {
      return (x - a) / b;
    };
  }
  function d3_uninterpolateClamp(a, b) {
    b = (b -= a = +a) || 1 / b;
    return function(x) {
      return Math.max(0, Math.min(1, (x - a) / b));
    };
  }
  d3.layout = {};
  d3.layout.bundle = function() {
    return function(links) {
      var paths = [], i = -1, n = links.length;
      while (++i < n) paths.push(d3_layout_bundlePath(links[i]));
      return paths;
    };
  };
  function d3_layout_bundlePath(link) {
    var start = link.source, end = link.target, lca = d3_layout_bundleLeastCommonAncestor(start, end), points = [ start ];
    while (start !== lca) {
      start = start.parent;
      points.push(start);
    }
    var k = points.length;
    while (end !== lca) {
      points.splice(k, 0, end);
      end = end.parent;
    }
    return points;
  }
  function d3_layout_bundleAncestors(node) {
    var ancestors = [], parent = node.parent;
    while (parent != null) {
      ancestors.push(node);
      node = parent;
      parent = parent.parent;
    }
    ancestors.push(node);
    return ancestors;
  }
  function d3_layout_bundleLeastCommonAncestor(a, b) {
    if (a === b) return a;
    var aNodes = d3_layout_bundleAncestors(a), bNodes = d3_layout_bundleAncestors(b), aNode = aNodes.pop(), bNode = bNodes.pop(), sharedNode = null;
    while (aNode === bNode) {
      sharedNode = aNode;
      aNode = aNodes.pop();
      bNode = bNodes.pop();
    }
    return sharedNode;
  }
  d3.layout.chord = function() {
    var chord = {}, chords, groups, matrix, n, padding = 0, sortGroups, sortSubgroups, sortChords;
    function relayout() {
      var subgroups = {}, groupSums = [], groupIndex = d3.range(n), subgroupIndex = [], k, x, x0, i, j;
      chords = [];
      groups = [];
      k = 0, i = -1;
      while (++i < n) {
        x = 0, j = -1;
        while (++j < n) {
          x += matrix[i][j];
        }
        groupSums.push(x);
        subgroupIndex.push(d3.range(n));
        k += x;
      }
      if (sortGroups) {
        groupIndex.sort(function(a, b) {
          return sortGroups(groupSums[a], groupSums[b]);
        });
      }
      if (sortSubgroups) {
        subgroupIndex.forEach(function(d, i) {
          d.sort(function(a, b) {
            return sortSubgroups(matrix[i][a], matrix[i][b]);
          });
        });
      }
      k = (τ - padding * n) / k;
      x = 0, i = -1;
      while (++i < n) {
        x0 = x, j = -1;
        while (++j < n) {
          var di = groupIndex[i], dj = subgroupIndex[di][j], v = matrix[di][dj], a0 = x, a1 = x += v * k;
          subgroups[di + "-" + dj] = {
            index: di,
            subindex: dj,
            startAngle: a0,
            endAngle: a1,
            value: v
          };
        }
        groups[di] = {
          index: di,
          startAngle: x0,
          endAngle: x,
          value: (x - x0) / k
        };
        x += padding;
      }
      i = -1;
      while (++i < n) {
        j = i - 1;
        while (++j < n) {
          var source = subgroups[i + "-" + j], target = subgroups[j + "-" + i];
          if (source.value || target.value) {
            chords.push(source.value < target.value ? {
              source: target,
              target: source
            } : {
              source: source,
              target: target
            });
          }
        }
      }
      if (sortChords) resort();
    }
    function resort() {
      chords.sort(function(a, b) {
        return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
      });
    }
    chord.matrix = function(x) {
      if (!arguments.length) return matrix;
      n = (matrix = x) && matrix.length;
      chords = groups = null;
      return chord;
    };
    chord.padding = function(x) {
      if (!arguments.length) return padding;
      padding = x;
      chords = groups = null;
      return chord;
    };
    chord.sortGroups = function(x) {
      if (!arguments.length) return sortGroups;
      sortGroups = x;
      chords = groups = null;
      return chord;
    };
    chord.sortSubgroups = function(x) {
      if (!arguments.length) return sortSubgroups;
      sortSubgroups = x;
      chords = null;
      return chord;
    };
    chord.sortChords = function(x) {
      if (!arguments.length) return sortChords;
      sortChords = x;
      if (chords) resort();
      return chord;
    };
    chord.chords = function() {
      if (!chords) relayout();
      return chords;
    };
    chord.groups = function() {
      if (!groups) relayout();
      return groups;
    };
    return chord;
  };
  d3.layout.force = function() {
    var force = {}, event = d3.dispatch("start", "tick", "end"), timer, size = [ 1, 1 ], drag, alpha, friction = .9, linkDistance = d3_layout_forceLinkDistance, linkStrength = d3_layout_forceLinkStrength, charge = -30, chargeDistance2 = d3_layout_forceChargeDistance2, gravity = .1, theta2 = .64, nodes = [], links = [], distances, strengths, charges;
    function repulse(node) {
      return function(quad, x1, _, x2) {
        if (quad.point !== node) {
          var dx = quad.cx - node.x, dy = quad.cy - node.y, dw = x2 - x1, dn = dx * dx + dy * dy;
          if (dw * dw / theta2 < dn) {
            if (dn < chargeDistance2) {
              var k = quad.charge / dn;
              node.px -= dx * k;
              node.py -= dy * k;
            }
            return true;
          }
          if (quad.point && dn && dn < chargeDistance2) {
            var k = quad.pointCharge / dn;
            node.px -= dx * k;
            node.py -= dy * k;
          }
        }
        return !quad.charge;
      };
    }
    force.tick = function() {
      if ((alpha *= .99) < .005) {
        timer = null;
        event.end({
          type: "end",
          alpha: alpha = 0
        });
        return true;
      }
      var n = nodes.length, m = links.length, q, i, o, s, t, l, k, x, y;
      for (i = 0; i < m; ++i) {
        o = links[i];
        s = o.source;
        t = o.target;
        x = t.x - s.x;
        y = t.y - s.y;
        if (l = x * x + y * y) {
          l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
          x *= l;
          y *= l;
          t.x -= x * (k = s.weight + t.weight ? s.weight / (s.weight + t.weight) : .5);
          t.y -= y * k;
          s.x += x * (k = 1 - k);
          s.y += y * k;
        }
      }
      if (k = alpha * gravity) {
        x = size[0] / 2;
        y = size[1] / 2;
        i = -1;
        if (k) while (++i < n) {
          o = nodes[i];
          o.x += (x - o.x) * k;
          o.y += (y - o.y) * k;
        }
      }
      if (charge) {
        d3_layout_forceAccumulate(q = d3.geom.quadtree(nodes), alpha, charges);
        i = -1;
        while (++i < n) {
          if (!(o = nodes[i]).fixed) {
            q.visit(repulse(o));
          }
        }
      }
      i = -1;
      while (++i < n) {
        o = nodes[i];
        if (o.fixed) {
          o.x = o.px;
          o.y = o.py;
        } else {
          o.x -= (o.px - (o.px = o.x)) * friction;
          o.y -= (o.py - (o.py = o.y)) * friction;
        }
      }
      event.tick({
        type: "tick",
        alpha: alpha
      });
    };
    force.nodes = function(x) {
      if (!arguments.length) return nodes;
      nodes = x;
      return force;
    };
    force.links = function(x) {
      if (!arguments.length) return links;
      links = x;
      return force;
    };
    force.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return force;
    };
    force.linkDistance = function(x) {
      if (!arguments.length) return linkDistance;
      linkDistance = typeof x === "function" ? x : +x;
      return force;
    };
    force.distance = force.linkDistance;
    force.linkStrength = function(x) {
      if (!arguments.length) return linkStrength;
      linkStrength = typeof x === "function" ? x : +x;
      return force;
    };
    force.friction = function(x) {
      if (!arguments.length) return friction;
      friction = +x;
      return force;
    };
    force.charge = function(x) {
      if (!arguments.length) return charge;
      charge = typeof x === "function" ? x : +x;
      return force;
    };
    force.chargeDistance = function(x) {
      if (!arguments.length) return Math.sqrt(chargeDistance2);
      chargeDistance2 = x * x;
      return force;
    };
    force.gravity = function(x) {
      if (!arguments.length) return gravity;
      gravity = +x;
      return force;
    };
    force.theta = function(x) {
      if (!arguments.length) return Math.sqrt(theta2);
      theta2 = x * x;
      return force;
    };
    force.alpha = function(x) {
      if (!arguments.length) return alpha;
      x = +x;
      if (alpha) {
        if (x > 0) {
          alpha = x;
        } else {
          timer.c = null, timer.t = NaN, timer = null;
          event.end({
            type: "end",
            alpha: alpha = 0
          });
        }
      } else if (x > 0) {
        event.start({
          type: "start",
          alpha: alpha = x
        });
        timer = d3_timer(force.tick);
      }
      return force;
    };
    force.start = function() {
      var i, n = nodes.length, m = links.length, w = size[0], h = size[1], neighbors, o;
      for (i = 0; i < n; ++i) {
        (o = nodes[i]).index = i;
        o.weight = 0;
      }
      for (i = 0; i < m; ++i) {
        o = links[i];
        if (typeof o.source == "number") o.source = nodes[o.source];
        if (typeof o.target == "number") o.target = nodes[o.target];
        ++o.source.weight;
        ++o.target.weight;
      }
      for (i = 0; i < n; ++i) {
        o = nodes[i];
        if (isNaN(o.x)) o.x = position("x", w);
        if (isNaN(o.y)) o.y = position("y", h);
        if (isNaN(o.px)) o.px = o.x;
        if (isNaN(o.py)) o.py = o.y;
      }
      distances = [];
      if (typeof linkDistance === "function") for (i = 0; i < m; ++i) distances[i] = +linkDistance.call(this, links[i], i); else for (i = 0; i < m; ++i) distances[i] = linkDistance;
      strengths = [];
      if (typeof linkStrength === "function") for (i = 0; i < m; ++i) strengths[i] = +linkStrength.call(this, links[i], i); else for (i = 0; i < m; ++i) strengths[i] = linkStrength;
      charges = [];
      if (typeof charge === "function") for (i = 0; i < n; ++i) charges[i] = +charge.call(this, nodes[i], i); else for (i = 0; i < n; ++i) charges[i] = charge;
      function position(dimension, size) {
        if (!neighbors) {
          neighbors = new Array(n);
          for (j = 0; j < n; ++j) {
            neighbors[j] = [];
          }
          for (j = 0; j < m; ++j) {
            var o = links[j];
            neighbors[o.source.index].push(o.target);
            neighbors[o.target.index].push(o.source);
          }
        }
        var candidates = neighbors[i], j = -1, l = candidates.length, x;
        while (++j < l) if (!isNaN(x = candidates[j][dimension])) return x;
        return Math.random() * size;
      }
      return force.resume();
    };
    force.resume = function() {
      return force.alpha(.1);
    };
    force.stop = function() {
      return force.alpha(0);
    };
    force.drag = function() {
      if (!drag) drag = d3.behavior.drag().origin(d3_identity).on("dragstart.force", d3_layout_forceDragstart).on("drag.force", dragmove).on("dragend.force", d3_layout_forceDragend);
      if (!arguments.length) return drag;
      this.on("mouseover.force", d3_layout_forceMouseover).on("mouseout.force", d3_layout_forceMouseout).call(drag);
    };
    function dragmove(d) {
      d.px = d3.event.x, d.py = d3.event.y;
      force.resume();
    }
    return d3.rebind(force, event, "on");
  };
  function d3_layout_forceDragstart(d) {
    d.fixed |= 2;
  }
  function d3_layout_forceDragend(d) {
    d.fixed &= ~6;
  }
  function d3_layout_forceMouseover(d) {
    d.fixed |= 4;
    d.px = d.x, d.py = d.y;
  }
  function d3_layout_forceMouseout(d) {
    d.fixed &= ~4;
  }
  function d3_layout_forceAccumulate(quad, alpha, charges) {
    var cx = 0, cy = 0;
    quad.charge = 0;
    if (!quad.leaf) {
      var nodes = quad.nodes, n = nodes.length, i = -1, c;
      while (++i < n) {
        c = nodes[i];
        if (c == null) continue;
        d3_layout_forceAccumulate(c, alpha, charges);
        quad.charge += c.charge;
        cx += c.charge * c.cx;
        cy += c.charge * c.cy;
      }
    }
    if (quad.point) {
      if (!quad.leaf) {
        quad.point.x += Math.random() - .5;
        quad.point.y += Math.random() - .5;
      }
      var k = alpha * charges[quad.point.index];
      quad.charge += quad.pointCharge = k;
      cx += k * quad.point.x;
      cy += k * quad.point.y;
    }
    quad.cx = cx / quad.charge;
    quad.cy = cy / quad.charge;
  }
  var d3_layout_forceLinkDistance = 20, d3_layout_forceLinkStrength = 1, d3_layout_forceChargeDistance2 = Infinity;
  d3.layout.hierarchy = function() {
    var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren, value = d3_layout_hierarchyValue;
    function hierarchy(root) {
      var stack = [ root ], nodes = [], node;
      root.depth = 0;
      while ((node = stack.pop()) != null) {
        nodes.push(node);
        if ((childs = children.call(hierarchy, node, node.depth)) && (n = childs.length)) {
          var n, childs, child;
          while (--n >= 0) {
            stack.push(child = childs[n]);
            child.parent = node;
            child.depth = node.depth + 1;
          }
          if (value) node.value = 0;
          node.children = childs;
        } else {
          if (value) node.value = +value.call(hierarchy, node, node.depth) || 0;
          delete node.children;
        }
      }
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var childs, parent;
        if (sort && (childs = node.children)) childs.sort(sort);
        if (value && (parent = node.parent)) parent.value += node.value;
      });
      return nodes;
    }
    hierarchy.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return hierarchy;
    };
    hierarchy.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return hierarchy;
    };
    hierarchy.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return hierarchy;
    };
    hierarchy.revalue = function(root) {
      if (value) {
        d3_layout_hierarchyVisitBefore(root, function(node) {
          if (node.children) node.value = 0;
        });
        d3_layout_hierarchyVisitAfter(root, function(node) {
          var parent;
          if (!node.children) node.value = +value.call(hierarchy, node, node.depth) || 0;
          if (parent = node.parent) parent.value += node.value;
        });
      }
      return root;
    };
    return hierarchy;
  };
  function d3_layout_hierarchyRebind(object, hierarchy) {
    d3.rebind(object, hierarchy, "sort", "children", "value");
    object.nodes = object;
    object.links = d3_layout_hierarchyLinks;
    return object;
  }
  function d3_layout_hierarchyVisitBefore(node, callback) {
    var nodes = [ node ];
    while ((node = nodes.pop()) != null) {
      callback(node);
      if ((children = node.children) && (n = children.length)) {
        var n, children;
        while (--n >= 0) nodes.push(children[n]);
      }
    }
  }
  function d3_layout_hierarchyVisitAfter(node, callback) {
    var nodes = [ node ], nodes2 = [];
    while ((node = nodes.pop()) != null) {
      nodes2.push(node);
      if ((children = node.children) && (n = children.length)) {
        var i = -1, n, children;
        while (++i < n) nodes.push(children[i]);
      }
    }
    while ((node = nodes2.pop()) != null) {
      callback(node);
    }
  }
  function d3_layout_hierarchyChildren(d) {
    return d.children;
  }
  function d3_layout_hierarchyValue(d) {
    return d.value;
  }
  function d3_layout_hierarchySort(a, b) {
    return b.value - a.value;
  }
  function d3_layout_hierarchyLinks(nodes) {
    return d3.merge(nodes.map(function(parent) {
      return (parent.children || []).map(function(child) {
        return {
          source: parent,
          target: child
        };
      });
    }));
  }
  d3.layout.partition = function() {
    var hierarchy = d3.layout.hierarchy(), size = [ 1, 1 ];
    function position(node, x, dx, dy) {
      var children = node.children;
      node.x = x;
      node.y = node.depth * dy;
      node.dx = dx;
      node.dy = dy;
      if (children && (n = children.length)) {
        var i = -1, n, c, d;
        dx = node.value ? dx / node.value : 0;
        while (++i < n) {
          position(c = children[i], x, d = c.value * dx, dy);
          x += d;
        }
      }
    }
    function depth(node) {
      var children = node.children, d = 0;
      if (children && (n = children.length)) {
        var i = -1, n;
        while (++i < n) d = Math.max(d, depth(children[i]));
      }
      return 1 + d;
    }
    function partition(d, i) {
      var nodes = hierarchy.call(this, d, i);
      position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));
      return nodes;
    }
    partition.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return partition;
    };
    return d3_layout_hierarchyRebind(partition, hierarchy);
  };
  d3.layout.pie = function() {
    var value = Number, sort = d3_layout_pieSortByValue, startAngle = 0, endAngle = τ, padAngle = 0;
    function pie(data) {
      var n = data.length, values = data.map(function(d, i) {
        return +value.call(pie, d, i);
      }), a = +(typeof startAngle === "function" ? startAngle.apply(this, arguments) : startAngle), da = (typeof endAngle === "function" ? endAngle.apply(this, arguments) : endAngle) - a, p = Math.min(Math.abs(da) / n, +(typeof padAngle === "function" ? padAngle.apply(this, arguments) : padAngle)), pa = p * (da < 0 ? -1 : 1), sum = d3.sum(values), k = sum ? (da - n * pa) / sum : 0, index = d3.range(n), arcs = [], v;
      if (sort != null) index.sort(sort === d3_layout_pieSortByValue ? function(i, j) {
        return values[j] - values[i];
      } : function(i, j) {
        return sort(data[i], data[j]);
      });
      index.forEach(function(i) {
        arcs[i] = {
          data: data[i],
          value: v = values[i],
          startAngle: a,
          endAngle: a += v * k + pa,
          padAngle: p
        };
      });
      return arcs;
    }
    pie.value = function(_) {
      if (!arguments.length) return value;
      value = _;
      return pie;
    };
    pie.sort = function(_) {
      if (!arguments.length) return sort;
      sort = _;
      return pie;
    };
    pie.startAngle = function(_) {
      if (!arguments.length) return startAngle;
      startAngle = _;
      return pie;
    };
    pie.endAngle = function(_) {
      if (!arguments.length) return endAngle;
      endAngle = _;
      return pie;
    };
    pie.padAngle = function(_) {
      if (!arguments.length) return padAngle;
      padAngle = _;
      return pie;
    };
    return pie;
  };
  var d3_layout_pieSortByValue = {};
  d3.layout.stack = function() {
    var values = d3_identity, order = d3_layout_stackOrderDefault, offset = d3_layout_stackOffsetZero, out = d3_layout_stackOut, x = d3_layout_stackX, y = d3_layout_stackY;
    function stack(data, index) {
      if (!(n = data.length)) return data;
      var series = data.map(function(d, i) {
        return values.call(stack, d, i);
      });
      var points = series.map(function(d) {
        return d.map(function(v, i) {
          return [ x.call(stack, v, i), y.call(stack, v, i) ];
        });
      });
      var orders = order.call(stack, points, index);
      series = d3.permute(series, orders);
      points = d3.permute(points, orders);
      var offsets = offset.call(stack, points, index);
      var m = series[0].length, n, i, j, o;
      for (j = 0; j < m; ++j) {
        out.call(stack, series[0][j], o = offsets[j], points[0][j][1]);
        for (i = 1; i < n; ++i) {
          out.call(stack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
        }
      }
      return data;
    }
    stack.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      return stack;
    };
    stack.order = function(x) {
      if (!arguments.length) return order;
      order = typeof x === "function" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;
      return stack;
    };
    stack.offset = function(x) {
      if (!arguments.length) return offset;
      offset = typeof x === "function" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;
      return stack;
    };
    stack.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      return stack;
    };
    stack.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      return stack;
    };
    stack.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      return stack;
    };
    return stack;
  };
  function d3_layout_stackX(d) {
    return d.x;
  }
  function d3_layout_stackY(d) {
    return d.y;
  }
  function d3_layout_stackOut(d, y0, y) {
    d.y0 = y0;
    d.y = y;
  }
  var d3_layout_stackOrders = d3.map({
    "inside-out": function(data) {
      var n = data.length, i, j, max = data.map(d3_layout_stackMaxIndex), sums = data.map(d3_layout_stackReduceSum), index = d3.range(n).sort(function(a, b) {
        return max[a] - max[b];
      }), top = 0, bottom = 0, tops = [], bottoms = [];
      for (i = 0; i < n; ++i) {
        j = index[i];
        if (top < bottom) {
          top += sums[j];
          tops.push(j);
        } else {
          bottom += sums[j];
          bottoms.push(j);
        }
      }
      return bottoms.reverse().concat(tops);
    },
    reverse: function(data) {
      return d3.range(data.length).reverse();
    },
    "default": d3_layout_stackOrderDefault
  });
  var d3_layout_stackOffsets = d3.map({
    silhouette: function(data) {
      var n = data.length, m = data[0].length, sums = [], max = 0, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o > max) max = o;
        sums.push(o);
      }
      for (j = 0; j < m; ++j) {
        y0[j] = (max - sums[j]) / 2;
      }
      return y0;
    },
    wiggle: function(data) {
      var n = data.length, x = data[0], m = x.length, i, j, k, s1, s2, s3, dx, o, o0, y0 = [];
      y0[0] = o = o0 = 0;
      for (j = 1; j < m; ++j) {
        for (i = 0, s1 = 0; i < n; ++i) s1 += data[i][j][1];
        for (i = 0, s2 = 0, dx = x[j][0] - x[j - 1][0]; i < n; ++i) {
          for (k = 0, s3 = (data[i][j][1] - data[i][j - 1][1]) / (2 * dx); k < i; ++k) {
            s3 += (data[k][j][1] - data[k][j - 1][1]) / dx;
          }
          s2 += s3 * data[i][j][1];
        }
        y0[j] = o -= s1 ? s2 / s1 * dx : 0;
        if (o < o0) o0 = o;
      }
      for (j = 0; j < m; ++j) y0[j] -= o0;
      return y0;
    },
    expand: function(data) {
      var n = data.length, m = data[0].length, k = 1 / n, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o) for (i = 0; i < n; i++) data[i][j][1] /= o; else for (i = 0; i < n; i++) data[i][j][1] = k;
      }
      for (j = 0; j < m; ++j) y0[j] = 0;
      return y0;
    },
    zero: d3_layout_stackOffsetZero
  });
  function d3_layout_stackOrderDefault(data) {
    return d3.range(data.length);
  }
  function d3_layout_stackOffsetZero(data) {
    var j = -1, m = data[0].length, y0 = [];
    while (++j < m) y0[j] = 0;
    return y0;
  }
  function d3_layout_stackMaxIndex(array) {
    var i = 1, j = 0, v = array[0][1], k, n = array.length;
    for (;i < n; ++i) {
      if ((k = array[i][1]) > v) {
        j = i;
        v = k;
      }
    }
    return j;
  }
  function d3_layout_stackReduceSum(d) {
    return d.reduce(d3_layout_stackSum, 0);
  }
  function d3_layout_stackSum(p, d) {
    return p + d[1];
  }
  d3.layout.histogram = function() {
    var frequency = true, valuer = Number, ranger = d3_layout_histogramRange, binner = d3_layout_histogramBinSturges;
    function histogram(data, i) {
      var bins = [], values = data.map(valuer, this), range = ranger.call(this, values, i), thresholds = binner.call(this, range, values, i), bin, i = -1, n = values.length, m = thresholds.length - 1, k = frequency ? 1 : 1 / n, x;
      while (++i < m) {
        bin = bins[i] = [];
        bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
        bin.y = 0;
      }
      if (m > 0) {
        i = -1;
        while (++i < n) {
          x = values[i];
          if (x >= range[0] && x <= range[1]) {
            bin = bins[d3.bisect(thresholds, x, 1, m) - 1];
            bin.y += k;
            bin.push(data[i]);
          }
        }
      }
      return bins;
    }
    histogram.value = function(x) {
      if (!arguments.length) return valuer;
      valuer = x;
      return histogram;
    };
    histogram.range = function(x) {
      if (!arguments.length) return ranger;
      ranger = d3_functor(x);
      return histogram;
    };
    histogram.bins = function(x) {
      if (!arguments.length) return binner;
      binner = typeof x === "number" ? function(range) {
        return d3_layout_histogramBinFixed(range, x);
      } : d3_functor(x);
      return histogram;
    };
    histogram.frequency = function(x) {
      if (!arguments.length) return frequency;
      frequency = !!x;
      return histogram;
    };
    return histogram;
  };
  function d3_layout_histogramBinSturges(range, values) {
    return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));
  }
  function d3_layout_histogramBinFixed(range, n) {
    var x = -1, b = +range[0], m = (range[1] - b) / n, f = [];
    while (++x <= n) f[x] = m * x + b;
    return f;
  }
  function d3_layout_histogramRange(values) {
    return [ d3.min(values), d3.max(values) ];
  }
  d3.layout.pack = function() {
    var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort), padding = 0, size = [ 1, 1 ], radius;
    function pack(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], w = size[0], h = size[1], r = radius == null ? Math.sqrt : typeof radius === "function" ? radius : function() {
        return radius;
      };
      root.x = root.y = 0;
      d3_layout_hierarchyVisitAfter(root, function(d) {
        d.r = +r(d.value);
      });
      d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);
      if (padding) {
        var dr = padding * (radius ? 1 : Math.max(2 * root.r / w, 2 * root.r / h)) / 2;
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r += dr;
        });
        d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r -= dr;
        });
      }
      d3_layout_packTransform(root, w / 2, h / 2, radius ? 1 : 1 / Math.max(2 * root.r / w, 2 * root.r / h));
      return nodes;
    }
    pack.size = function(_) {
      if (!arguments.length) return size;
      size = _;
      return pack;
    };
    pack.radius = function(_) {
      if (!arguments.length) return radius;
      radius = _ == null || typeof _ === "function" ? _ : +_;
      return pack;
    };
    pack.padding = function(_) {
      if (!arguments.length) return padding;
      padding = +_;
      return pack;
    };
    return d3_layout_hierarchyRebind(pack, hierarchy);
  };
  function d3_layout_packSort(a, b) {
    return a.value - b.value;
  }
  function d3_layout_packInsert(a, b) {
    var c = a._pack_next;
    a._pack_next = b;
    b._pack_prev = a;
    b._pack_next = c;
    c._pack_prev = b;
  }
  function d3_layout_packSplice(a, b) {
    a._pack_next = b;
    b._pack_prev = a;
  }
  function d3_layout_packIntersects(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, dr = a.r + b.r;
    return .999 * dr * dr > dx * dx + dy * dy;
  }
  function d3_layout_packSiblings(node) {
    if (!(nodes = node.children) || !(n = nodes.length)) return;
    var nodes, xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, a, b, c, i, j, k, n;
    function bound(node) {
      xMin = Math.min(node.x - node.r, xMin);
      xMax = Math.max(node.x + node.r, xMax);
      yMin = Math.min(node.y - node.r, yMin);
      yMax = Math.max(node.y + node.r, yMax);
    }
    nodes.forEach(d3_layout_packLink);
    a = nodes[0];
    a.x = -a.r;
    a.y = 0;
    bound(a);
    if (n > 1) {
      b = nodes[1];
      b.x = b.r;
      b.y = 0;
      bound(b);
      if (n > 2) {
        c = nodes[2];
        d3_layout_packPlace(a, b, c);
        bound(c);
        d3_layout_packInsert(a, c);
        a._pack_prev = c;
        d3_layout_packInsert(c, b);
        b = a._pack_next;
        for (i = 3; i < n; i++) {
          d3_layout_packPlace(a, b, c = nodes[i]);
          var isect = 0, s1 = 1, s2 = 1;
          for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
            if (d3_layout_packIntersects(j, c)) {
              isect = 1;
              break;
            }
          }
          if (isect == 1) {
            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
              if (d3_layout_packIntersects(k, c)) {
                break;
              }
            }
          }
          if (isect) {
            if (s1 < s2 || s1 == s2 && b.r < a.r) d3_layout_packSplice(a, b = j); else d3_layout_packSplice(a = k, b);
            i--;
          } else {
            d3_layout_packInsert(a, c);
            b = c;
            bound(c);
          }
        }
      }
    }
    var cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2, cr = 0;
    for (i = 0; i < n; i++) {
      c = nodes[i];
      c.x -= cx;
      c.y -= cy;
      cr = Math.max(cr, c.r + Math.sqrt(c.x * c.x + c.y * c.y));
    }
    node.r = cr;
    nodes.forEach(d3_layout_packUnlink);
  }
  function d3_layout_packLink(node) {
    node._pack_next = node._pack_prev = node;
  }
  function d3_layout_packUnlink(node) {
    delete node._pack_next;
    delete node._pack_prev;
  }
  function d3_layout_packTransform(node, x, y, k) {
    var children = node.children;
    node.x = x += k * node.x;
    node.y = y += k * node.y;
    node.r *= k;
    if (children) {
      var i = -1, n = children.length;
      while (++i < n) d3_layout_packTransform(children[i], x, y, k);
    }
  }
  function d3_layout_packPlace(a, b, c) {
    var db = a.r + c.r, dx = b.x - a.x, dy = b.y - a.y;
    if (db && (dx || dy)) {
      var da = b.r + c.r, dc = dx * dx + dy * dy;
      da *= da;
      db *= db;
      var x = .5 + (db - da) / (2 * dc), y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
      c.x = a.x + x * dx + y * dy;
      c.y = a.y + x * dy - y * dx;
    } else {
      c.x = a.x + db;
      c.y = a.y;
    }
  }
  d3.layout.tree = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = null;
    function tree(d, i) {
      var nodes = hierarchy.call(this, d, i), root0 = nodes[0], root1 = wrapTree(root0);
      d3_layout_hierarchyVisitAfter(root1, firstWalk), root1.parent.m = -root1.z;
      d3_layout_hierarchyVisitBefore(root1, secondWalk);
      if (nodeSize) d3_layout_hierarchyVisitBefore(root0, sizeNode); else {
        var left = root0, right = root0, bottom = root0;
        d3_layout_hierarchyVisitBefore(root0, function(node) {
          if (node.x < left.x) left = node;
          if (node.x > right.x) right = node;
          if (node.depth > bottom.depth) bottom = node;
        });
        var tx = separation(left, right) / 2 - left.x, kx = size[0] / (right.x + separation(right, left) / 2 + tx), ky = size[1] / (bottom.depth || 1);
        d3_layout_hierarchyVisitBefore(root0, function(node) {
          node.x = (node.x + tx) * kx;
          node.y = node.depth * ky;
        });
      }
      return nodes;
    }
    function wrapTree(root0) {
      var root1 = {
        A: null,
        children: [ root0 ]
      }, queue = [ root1 ], node1;
      while ((node1 = queue.pop()) != null) {
        for (var children = node1.children, child, i = 0, n = children.length; i < n; ++i) {
          queue.push((children[i] = child = {
            _: children[i],
            parent: node1,
            children: (child = children[i].children) && child.slice() || [],
            A: null,
            a: null,
            z: 0,
            m: 0,
            c: 0,
            s: 0,
            t: null,
            i: i
          }).a = child);
        }
      }
      return root1.children[0];
    }
    function firstWalk(v) {
      var children = v.children, siblings = v.parent.children, w = v.i ? siblings[v.i - 1] : null;
      if (children.length) {
        d3_layout_treeShift(v);
        var midpoint = (children[0].z + children[children.length - 1].z) / 2;
        if (w) {
          v.z = w.z + separation(v._, w._);
          v.m = v.z - midpoint;
        } else {
          v.z = midpoint;
        }
      } else if (w) {
        v.z = w.z + separation(v._, w._);
      }
      v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
    }
    function secondWalk(v) {
      v._.x = v.z + v.parent.m;
      v.m += v.parent.m;
    }
    function apportion(v, w, ancestor) {
      if (w) {
        var vip = v, vop = v, vim = w, vom = vip.parent.children[0], sip = vip.m, sop = vop.m, sim = vim.m, som = vom.m, shift;
        while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {
          vom = d3_layout_treeLeft(vom);
          vop = d3_layout_treeRight(vop);
          vop.a = v;
          shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
          if (shift > 0) {
            d3_layout_treeMove(d3_layout_treeAncestor(vim, v, ancestor), v, shift);
            sip += shift;
            sop += shift;
          }
          sim += vim.m;
          sip += vip.m;
          som += vom.m;
          sop += vop.m;
        }
        if (vim && !d3_layout_treeRight(vop)) {
          vop.t = vim;
          vop.m += sim - sop;
        }
        if (vip && !d3_layout_treeLeft(vom)) {
          vom.t = vip;
          vom.m += sip - som;
          ancestor = v;
        }
      }
      return ancestor;
    }
    function sizeNode(node) {
      node.x *= size[0];
      node.y = node.depth * size[1];
    }
    tree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return tree;
    };
    tree.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null ? sizeNode : null;
      return tree;
    };
    tree.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) == null ? null : sizeNode;
      return tree;
    };
    return d3_layout_hierarchyRebind(tree, hierarchy);
  };
  function d3_layout_treeSeparation(a, b) {
    return a.parent == b.parent ? 1 : 2;
  }
  function d3_layout_treeLeft(v) {
    var children = v.children;
    return children.length ? children[0] : v.t;
  }
  function d3_layout_treeRight(v) {
    var children = v.children, n;
    return (n = children.length) ? children[n - 1] : v.t;
  }
  function d3_layout_treeMove(wm, wp, shift) {
    var change = shift / (wp.i - wm.i);
    wp.c -= change;
    wp.s += shift;
    wm.c += change;
    wp.z += shift;
    wp.m += shift;
  }
  function d3_layout_treeShift(v) {
    var shift = 0, change = 0, children = v.children, i = children.length, w;
    while (--i >= 0) {
      w = children[i];
      w.z += shift;
      w.m += shift;
      shift += w.s + (change += w.c);
    }
  }
  function d3_layout_treeAncestor(vim, v, ancestor) {
    return vim.a.parent === v.parent ? vim.a : ancestor;
  }
  d3.layout.cluster = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = false;
    function cluster(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], previousNode, x = 0;
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var children = node.children;
        if (children && children.length) {
          node.x = d3_layout_clusterX(children);
          node.y = d3_layout_clusterY(children);
        } else {
          node.x = previousNode ? x += separation(node, previousNode) : 0;
          node.y = 0;
          previousNode = node;
        }
      });
      var left = d3_layout_clusterLeft(root), right = d3_layout_clusterRight(root), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2;
      d3_layout_hierarchyVisitAfter(root, nodeSize ? function(node) {
        node.x = (node.x - root.x) * size[0];
        node.y = (root.y - node.y) * size[1];
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * size[0];
        node.y = (1 - (root.y ? node.y / root.y : 1)) * size[1];
      });
      return nodes;
    }
    cluster.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return cluster;
    };
    cluster.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null;
      return cluster;
    };
    cluster.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) != null;
      return cluster;
    };
    return d3_layout_hierarchyRebind(cluster, hierarchy);
  };
  function d3_layout_clusterY(children) {
    return 1 + d3.max(children, function(child) {
      return child.y;
    });
  }
  function d3_layout_clusterX(children) {
    return children.reduce(function(x, child) {
      return x + child.x;
    }, 0) / children.length;
  }
  function d3_layout_clusterLeft(node) {
    var children = node.children;
    return children && children.length ? d3_layout_clusterLeft(children[0]) : node;
  }
  function d3_layout_clusterRight(node) {
    var children = node.children, n;
    return children && (n = children.length) ? d3_layout_clusterRight(children[n - 1]) : node;
  }
  d3.layout.treemap = function() {
    var hierarchy = d3.layout.hierarchy(), round = Math.round, size = [ 1, 1 ], padding = null, pad = d3_layout_treemapPadNull, sticky = false, stickies, mode = "squarify", ratio = .5 * (1 + Math.sqrt(5));
    function scale(children, k) {
      var i = -1, n = children.length, child, area;
      while (++i < n) {
        area = (child = children[i]).value * (k < 0 ? 0 : k);
        child.area = isNaN(area) || area <= 0 ? 0 : area;
      }
    }
    function squarify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), row = [], remaining = children.slice(), child, best = Infinity, score, u = mode === "slice" ? rect.dx : mode === "dice" ? rect.dy : mode === "slice-dice" ? node.depth & 1 ? rect.dy : rect.dx : Math.min(rect.dx, rect.dy), n;
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while ((n = remaining.length) > 0) {
          row.push(child = remaining[n - 1]);
          row.area += child.area;
          if (mode !== "squarify" || (score = worst(row, u)) <= best) {
            remaining.pop();
            best = score;
          } else {
            row.area -= row.pop().area;
            position(row, u, rect, false);
            u = Math.min(rect.dx, rect.dy);
            row.length = row.area = 0;
            best = Infinity;
          }
        }
        if (row.length) {
          position(row, u, rect, true);
          row.length = row.area = 0;
        }
        children.forEach(squarify);
      }
    }
    function stickify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), remaining = children.slice(), child, row = [];
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while (child = remaining.pop()) {
          row.push(child);
          row.area += child.area;
          if (child.z != null) {
            position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);
            row.length = row.area = 0;
          }
        }
        children.forEach(stickify);
      }
    }
    function worst(row, u) {
      var s = row.area, r, rmax = 0, rmin = Infinity, i = -1, n = row.length;
      while (++i < n) {
        if (!(r = row[i].area)) continue;
        if (r < rmin) rmin = r;
        if (r > rmax) rmax = r;
      }
      s *= s;
      u *= u;
      return s ? Math.max(u * rmax * ratio / s, s / (u * rmin * ratio)) : Infinity;
    }
    function position(row, u, rect, flush) {
      var i = -1, n = row.length, x = rect.x, y = rect.y, v = u ? round(row.area / u) : 0, o;
      if (u == rect.dx) {
        if (flush || v > rect.dy) v = rect.dy;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dy = v;
          x += o.dx = Math.min(rect.x + rect.dx - x, v ? round(o.area / v) : 0);
        }
        o.z = true;
        o.dx += rect.x + rect.dx - x;
        rect.y += v;
        rect.dy -= v;
      } else {
        if (flush || v > rect.dx) v = rect.dx;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dx = v;
          y += o.dy = Math.min(rect.y + rect.dy - y, v ? round(o.area / v) : 0);
        }
        o.z = false;
        o.dy += rect.y + rect.dy - y;
        rect.x += v;
        rect.dx -= v;
      }
    }
    function treemap(d) {
      var nodes = stickies || hierarchy(d), root = nodes[0];
      root.x = root.y = 0;
      if (root.value) root.dx = size[0], root.dy = size[1]; else root.dx = root.dy = 0;
      if (stickies) hierarchy.revalue(root);
      scale([ root ], root.dx * root.dy / root.value);
      (stickies ? stickify : squarify)(root);
      if (sticky) stickies = nodes;
      return nodes;
    }
    treemap.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return treemap;
    };
    treemap.padding = function(x) {
      if (!arguments.length) return padding;
      function padFunction(node) {
        var p = x.call(treemap, node, node.depth);
        return p == null ? d3_layout_treemapPadNull(node) : d3_layout_treemapPad(node, typeof p === "number" ? [ p, p, p, p ] : p);
      }
      function padConstant(node) {
        return d3_layout_treemapPad(node, x);
      }
      var type;
      pad = (padding = x) == null ? d3_layout_treemapPadNull : (type = typeof x) === "function" ? padFunction : type === "number" ? (x = [ x, x, x, x ], 
      padConstant) : padConstant;
      return treemap;
    };
    treemap.round = function(x) {
      if (!arguments.length) return round != Number;
      round = x ? Math.round : Number;
      return treemap;
    };
    treemap.sticky = function(x) {
      if (!arguments.length) return sticky;
      sticky = x;
      stickies = null;
      return treemap;
    };
    treemap.ratio = function(x) {
      if (!arguments.length) return ratio;
      ratio = x;
      return treemap;
    };
    treemap.mode = function(x) {
      if (!arguments.length) return mode;
      mode = x + "";
      return treemap;
    };
    return d3_layout_hierarchyRebind(treemap, hierarchy);
  };
  function d3_layout_treemapPadNull(node) {
    return {
      x: node.x,
      y: node.y,
      dx: node.dx,
      dy: node.dy
    };
  }
  function d3_layout_treemapPad(node, padding) {
    var x = node.x + padding[3], y = node.y + padding[0], dx = node.dx - padding[1] - padding[3], dy = node.dy - padding[0] - padding[2];
    if (dx < 0) {
      x += dx / 2;
      dx = 0;
    }
    if (dy < 0) {
      y += dy / 2;
      dy = 0;
    }
    return {
      x: x,
      y: y,
      dx: dx,
      dy: dy
    };
  }
  d3.random = {
    normal: function(µ, σ) {
      var n = arguments.length;
      if (n < 2) σ = 1;
      if (n < 1) µ = 0;
      return function() {
        var x, y, r;
        do {
          x = Math.random() * 2 - 1;
          y = Math.random() * 2 - 1;
          r = x * x + y * y;
        } while (!r || r > 1);
        return µ + σ * x * Math.sqrt(-2 * Math.log(r) / r);
      };
    },
    logNormal: function() {
      var random = d3.random.normal.apply(d3, arguments);
      return function() {
        return Math.exp(random());
      };
    },
    bates: function(m) {
      var random = d3.random.irwinHall(m);
      return function() {
        return random() / m;
      };
    },
    irwinHall: function(m) {
      return function() {
        for (var s = 0, j = 0; j < m; j++) s += Math.random();
        return s;
      };
    }
  };
  d3.scale = {};
  function d3_scaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [ start, stop ] : [ stop, start ];
  }
  function d3_scaleRange(scale) {
    return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
  }
  function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
    var u = uninterpolate(domain[0], domain[1]), i = interpolate(range[0], range[1]);
    return function(x) {
      return i(u(x));
    };
  }
  function d3_scale_nice(domain, nice) {
    var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], dx;
    if (x1 < x0) {
      dx = i0, i0 = i1, i1 = dx;
      dx = x0, x0 = x1, x1 = dx;
    }
    domain[i0] = nice.floor(x0);
    domain[i1] = nice.ceil(x1);
    return domain;
  }
  function d3_scale_niceStep(step) {
    return step ? {
      floor: function(x) {
        return Math.floor(x / step) * step;
      },
      ceil: function(x) {
        return Math.ceil(x / step) * step;
      }
    } : d3_scale_niceIdentity;
  }
  var d3_scale_niceIdentity = {
    floor: d3_identity,
    ceil: d3_identity
  };
  function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
    var u = [], i = [], j = 0, k = Math.min(domain.length, range.length) - 1;
    if (domain[k] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }
    while (++j <= k) {
      u.push(uninterpolate(domain[j - 1], domain[j]));
      i.push(interpolate(range[j - 1], range[j]));
    }
    return function(x) {
      var j = d3.bisect(domain, x, 1, k) - 1;
      return i[j](u[j](x));
    };
  }
  d3.scale.linear = function() {
    return d3_scale_linear([ 0, 1 ], [ 0, 1 ], d3_interpolate, false);
  };
  function d3_scale_linear(domain, range, interpolate, clamp) {
    var output, input;
    function rescale() {
      var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear, uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
      output = linear(domain, range, uninterpolate, interpolate);
      input = linear(range, domain, uninterpolate, d3_interpolate);
      return scale;
    }
    function scale(x) {
      return output(x);
    }
    scale.invert = function(y) {
      return input(y);
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(Number);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.rangeRound = function(x) {
      return scale.range(x).interpolate(d3_interpolateRound);
    };
    scale.clamp = function(x) {
      if (!arguments.length) return clamp;
      clamp = x;
      return rescale();
    };
    scale.interpolate = function(x) {
      if (!arguments.length) return interpolate;
      interpolate = x;
      return rescale();
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      d3_scale_linearNice(domain, m);
      return rescale();
    };
    scale.copy = function() {
      return d3_scale_linear(domain, range, interpolate, clamp);
    };
    return rescale();
  }
  function d3_scale_linearRebind(scale, linear) {
    return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
  }
  function d3_scale_linearNice(domain, m) {
    return d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
  }
  function d3_scale_linearTickRange(domain, m) {
    if (m == null) m = 10;
    var extent = d3_scaleExtent(domain), span = extent[1] - extent[0], step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)), err = m / span * step;
    if (err <= .15) step *= 10; else if (err <= .35) step *= 5; else if (err <= .75) step *= 2;
    extent[0] = Math.ceil(extent[0] / step) * step;
    extent[1] = Math.floor(extent[1] / step) * step + step * .5;
    extent[2] = step;
    return extent;
  }
  function d3_scale_linearTicks(domain, m) {
    return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
  }
  function d3_scale_linearTickFormat(domain, m, format) {
    var range = d3_scale_linearTickRange(domain, m);
    if (format) {
      var match = d3_format_re.exec(format);
      match.shift();
      if (match[8] === "s") {
        var prefix = d3.formatPrefix(Math.max(abs(range[0]), abs(range[1])));
        if (!match[7]) match[7] = "." + d3_scale_linearPrecision(prefix.scale(range[2]));
        match[8] = "f";
        format = d3.format(match.join(""));
        return function(d) {
          return format(prefix.scale(d)) + prefix.symbol;
        };
      }
      if (!match[7]) match[7] = "." + d3_scale_linearFormatPrecision(match[8], range);
      format = match.join("");
    } else {
      format = ",." + d3_scale_linearPrecision(range[2]) + "f";
    }
    return d3.format(format);
  }
  var d3_scale_linearFormatSignificant = {
    s: 1,
    g: 1,
    p: 1,
    r: 1,
    e: 1
  };
  function d3_scale_linearPrecision(value) {
    return -Math.floor(Math.log(value) / Math.LN10 + .01);
  }
  function d3_scale_linearFormatPrecision(type, range) {
    var p = d3_scale_linearPrecision(range[2]);
    return type in d3_scale_linearFormatSignificant ? Math.abs(p - d3_scale_linearPrecision(Math.max(abs(range[0]), abs(range[1])))) + +(type !== "e") : p - (type === "%") * 2;
  }
  d3.scale.log = function() {
    return d3_scale_log(d3.scale.linear().domain([ 0, 1 ]), 10, true, [ 1, 10 ]);
  };
  function d3_scale_log(linear, base, positive, domain) {
    function log(x) {
      return (positive ? Math.log(x < 0 ? 0 : x) : -Math.log(x > 0 ? 0 : -x)) / Math.log(base);
    }
    function pow(x) {
      return positive ? Math.pow(base, x) : -Math.pow(base, -x);
    }
    function scale(x) {
      return linear(log(x));
    }
    scale.invert = function(x) {
      return pow(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      positive = x[0] >= 0;
      linear.domain((domain = x.map(Number)).map(log));
      return scale;
    };
    scale.base = function(_) {
      if (!arguments.length) return base;
      base = +_;
      linear.domain(domain.map(log));
      return scale;
    };
    scale.nice = function() {
      var niced = d3_scale_nice(domain.map(log), positive ? Math : d3_scale_logNiceNegative);
      linear.domain(niced);
      domain = niced.map(pow);
      return scale;
    };
    scale.ticks = function() {
      var extent = d3_scaleExtent(domain), ticks = [], u = extent[0], v = extent[1], i = Math.floor(log(u)), j = Math.ceil(log(v)), n = base % 1 ? 2 : base;
      if (isFinite(j - i)) {
        if (positive) {
          for (;i < j; i++) for (var k = 1; k < n; k++) ticks.push(pow(i) * k);
          ticks.push(pow(i));
        } else {
          ticks.push(pow(i));
          for (;i++ < j; ) for (var k = n - 1; k > 0; k--) ticks.push(pow(i) * k);
        }
        for (i = 0; ticks[i] < u; i++) {}
        for (j = ticks.length; ticks[j - 1] > v; j--) {}
        ticks = ticks.slice(i, j);
      }
      return ticks;
    };
    scale.tickFormat = function(n, format) {
      if (!arguments.length) return d3_scale_logFormat;
      if (arguments.length < 2) format = d3_scale_logFormat; else if (typeof format !== "function") format = d3.format(format);
      var k = Math.max(.1, n / scale.ticks().length), f = positive ? (e = 1e-12, Math.ceil) : (e = -1e-12, 
      Math.floor), e;
      return function(d) {
        return d / pow(f(log(d) + e)) <= k ? format(d) : "";
      };
    };
    scale.copy = function() {
      return d3_scale_log(linear.copy(), base, positive, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  var d3_scale_logFormat = d3.format(".0e"), d3_scale_logNiceNegative = {
    floor: function(x) {
      return -Math.ceil(-x);
    },
    ceil: function(x) {
      return -Math.floor(-x);
    }
  };
  d3.scale.pow = function() {
    return d3_scale_pow(d3.scale.linear(), 1, [ 0, 1 ]);
  };
  function d3_scale_pow(linear, exponent, domain) {
    var powp = d3_scale_powPow(exponent), powb = d3_scale_powPow(1 / exponent);
    function scale(x) {
      return linear(powp(x));
    }
    scale.invert = function(x) {
      return powb(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      linear.domain((domain = x.map(Number)).map(powp));
      return scale;
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      return scale.domain(d3_scale_linearNice(domain, m));
    };
    scale.exponent = function(x) {
      if (!arguments.length) return exponent;
      powp = d3_scale_powPow(exponent = x);
      powb = d3_scale_powPow(1 / exponent);
      linear.domain(domain.map(powp));
      return scale;
    };
    scale.copy = function() {
      return d3_scale_pow(linear.copy(), exponent, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_scale_powPow(e) {
    return function(x) {
      return x < 0 ? -Math.pow(-x, e) : Math.pow(x, e);
    };
  }
  d3.scale.sqrt = function() {
    return d3.scale.pow().exponent(.5);
  };
  d3.scale.ordinal = function() {
    return d3_scale_ordinal([], {
      t: "range",
      a: [ [] ]
    });
  };
  function d3_scale_ordinal(domain, ranger) {
    var index, range, rangeBand;
    function scale(x) {
      return range[((index.get(x) || (ranger.t === "range" ? index.set(x, domain.push(x)) : NaN)) - 1) % range.length];
    }
    function steps(start, step) {
      return d3.range(domain.length).map(function(i) {
        return start + step * i;
      });
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = [];
      index = new d3_Map();
      var i = -1, n = x.length, xi;
      while (++i < n) if (!index.has(xi = x[i])) index.set(xi, domain.push(xi));
      return scale[ranger.t].apply(scale, ranger.a);
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      rangeBand = 0;
      ranger = {
        t: "range",
        a: arguments
      };
      return scale;
    };
    scale.rangePoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = domain.length < 2 ? (start = (start + stop) / 2, 
      0) : (stop - start) / (domain.length - 1 + padding);
      range = steps(start + step * padding / 2, step);
      rangeBand = 0;
      ranger = {
        t: "rangePoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundPoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = domain.length < 2 ? (start = stop = Math.round((start + stop) / 2), 
      0) : (stop - start) / (domain.length - 1 + padding) | 0;
      range = steps(start + Math.round(step * padding / 2 + (stop - start - (domain.length - 1 + padding) * step) / 2), step);
      rangeBand = 0;
      ranger = {
        t: "rangeRoundPoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = (stop - start) / (domain.length - padding + 2 * outerPadding);
      range = steps(start + step * outerPadding, step);
      if (reverse) range.reverse();
      rangeBand = step * (1 - padding);
      ranger = {
        t: "rangeBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = Math.floor((stop - start) / (domain.length - padding + 2 * outerPadding));
      range = steps(start + Math.round((stop - start - (domain.length - padding) * step) / 2), step);
      if (reverse) range.reverse();
      rangeBand = Math.round(step * (1 - padding));
      ranger = {
        t: "rangeRoundBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeBand = function() {
      return rangeBand;
    };
    scale.rangeExtent = function() {
      return d3_scaleExtent(ranger.a[0]);
    };
    scale.copy = function() {
      return d3_scale_ordinal(domain, ranger);
    };
    return scale.domain(domain);
  }
  d3.scale.category10 = function() {
    return d3.scale.ordinal().range(d3_category10);
  };
  d3.scale.category20 = function() {
    return d3.scale.ordinal().range(d3_category20);
  };
  d3.scale.category20b = function() {
    return d3.scale.ordinal().range(d3_category20b);
  };
  d3.scale.category20c = function() {
    return d3.scale.ordinal().range(d3_category20c);
  };
  var d3_category10 = [ 2062260, 16744206, 2924588, 14034728, 9725885, 9197131, 14907330, 8355711, 12369186, 1556175 ].map(d3_rgbString);
  var d3_category20 = [ 2062260, 11454440, 16744206, 16759672, 2924588, 10018698, 14034728, 16750742, 9725885, 12955861, 9197131, 12885140, 14907330, 16234194, 8355711, 13092807, 12369186, 14408589, 1556175, 10410725 ].map(d3_rgbString);
  var d3_category20b = [ 3750777, 5395619, 7040719, 10264286, 6519097, 9216594, 11915115, 13556636, 9202993, 12426809, 15186514, 15190932, 8666169, 11356490, 14049643, 15177372, 8077683, 10834324, 13528509, 14589654 ].map(d3_rgbString);
  var d3_category20c = [ 3244733, 7057110, 10406625, 13032431, 15095053, 16616764, 16625259, 16634018, 3253076, 7652470, 10607003, 13101504, 7695281, 10394312, 12369372, 14342891, 6513507, 9868950, 12434877, 14277081 ].map(d3_rgbString);
  d3.scale.quantile = function() {
    return d3_scale_quantile([], []);
  };
  function d3_scale_quantile(domain, range) {
    var thresholds;
    function rescale() {
      var k = 0, q = range.length;
      thresholds = [];
      while (++k < q) thresholds[k - 1] = d3.quantile(domain, k / q);
      return scale;
    }
    function scale(x) {
      if (!isNaN(x = +x)) return range[d3.bisect(thresholds, x)];
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(d3_number).filter(d3_numeric).sort(d3_ascending);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.quantiles = function() {
      return thresholds;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return y < 0 ? [ NaN, NaN ] : [ y > 0 ? thresholds[y - 1] : domain[0], y < thresholds.length ? thresholds[y] : domain[domain.length - 1] ];
    };
    scale.copy = function() {
      return d3_scale_quantile(domain, range);
    };
    return rescale();
  }
  d3.scale.quantize = function() {
    return d3_scale_quantize(0, 1, [ 0, 1 ]);
  };
  function d3_scale_quantize(x0, x1, range) {
    var kx, i;
    function scale(x) {
      return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];
    }
    function rescale() {
      kx = range.length / (x1 - x0);
      i = range.length - 1;
      return scale;
    }
    scale.domain = function(x) {
      if (!arguments.length) return [ x0, x1 ];
      x0 = +x[0];
      x1 = +x[x.length - 1];
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      y = y < 0 ? NaN : y / kx + x0;
      return [ y, y + 1 / kx ];
    };
    scale.copy = function() {
      return d3_scale_quantize(x0, x1, range);
    };
    return rescale();
  }
  d3.scale.threshold = function() {
    return d3_scale_threshold([ .5 ], [ 0, 1 ]);
  };
  function d3_scale_threshold(domain, range) {
    function scale(x) {
      if (x <= x) return range[d3.bisect(domain, x)];
    }
    scale.domain = function(_) {
      if (!arguments.length) return domain;
      domain = _;
      return scale;
    };
    scale.range = function(_) {
      if (!arguments.length) return range;
      range = _;
      return scale;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return [ domain[y - 1], domain[y] ];
    };
    scale.copy = function() {
      return d3_scale_threshold(domain, range);
    };
    return scale;
  }
  d3.scale.identity = function() {
    return d3_scale_identity([ 0, 1 ]);
  };
  function d3_scale_identity(domain) {
    function identity(x) {
      return +x;
    }
    identity.invert = identity;
    identity.domain = identity.range = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(identity);
      return identity;
    };
    identity.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    identity.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    identity.copy = function() {
      return d3_scale_identity(domain);
    };
    return identity;
  }
  d3.svg = {};
  function d3_zero() {
    return 0;
  }
  d3.svg.arc = function() {
    var innerRadius = d3_svg_arcInnerRadius, outerRadius = d3_svg_arcOuterRadius, cornerRadius = d3_zero, padRadius = d3_svg_arcAuto, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle, padAngle = d3_svg_arcPadAngle;
    function arc() {
      var r0 = Math.max(0, +innerRadius.apply(this, arguments)), r1 = Math.max(0, +outerRadius.apply(this, arguments)), a0 = startAngle.apply(this, arguments) - halfπ, a1 = endAngle.apply(this, arguments) - halfπ, da = Math.abs(a1 - a0), cw = a0 > a1 ? 0 : 1;
      if (r1 < r0) rc = r1, r1 = r0, r0 = rc;
      if (da >= τε) return circleSegment(r1, cw) + (r0 ? circleSegment(r0, 1 - cw) : "") + "Z";
      var rc, cr, rp, ap, p0 = 0, p1 = 0, x0, y0, x1, y1, x2, y2, x3, y3, path = [];
      if (ap = (+padAngle.apply(this, arguments) || 0) / 2) {
        rp = padRadius === d3_svg_arcAuto ? Math.sqrt(r0 * r0 + r1 * r1) : +padRadius.apply(this, arguments);
        if (!cw) p1 *= -1;
        if (r1) p1 = d3_asin(rp / r1 * Math.sin(ap));
        if (r0) p0 = d3_asin(rp / r0 * Math.sin(ap));
      }
      if (r1) {
        x0 = r1 * Math.cos(a0 + p1);
        y0 = r1 * Math.sin(a0 + p1);
        x1 = r1 * Math.cos(a1 - p1);
        y1 = r1 * Math.sin(a1 - p1);
        var l1 = Math.abs(a1 - a0 - 2 * p1) <= π ? 0 : 1;
        if (p1 && d3_svg_arcSweep(x0, y0, x1, y1) === cw ^ l1) {
          var h1 = (a0 + a1) / 2;
          x0 = r1 * Math.cos(h1);
          y0 = r1 * Math.sin(h1);
          x1 = y1 = null;
        }
      } else {
        x0 = y0 = 0;
      }
      if (r0) {
        x2 = r0 * Math.cos(a1 - p0);
        y2 = r0 * Math.sin(a1 - p0);
        x3 = r0 * Math.cos(a0 + p0);
        y3 = r0 * Math.sin(a0 + p0);
        var l0 = Math.abs(a0 - a1 + 2 * p0) <= π ? 0 : 1;
        if (p0 && d3_svg_arcSweep(x2, y2, x3, y3) === 1 - cw ^ l0) {
          var h0 = (a0 + a1) / 2;
          x2 = r0 * Math.cos(h0);
          y2 = r0 * Math.sin(h0);
          x3 = y3 = null;
        }
      } else {
        x2 = y2 = 0;
      }
      if (da > ε && (rc = Math.min(Math.abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments))) > .001) {
        cr = r0 < r1 ^ cw ? 0 : 1;
        var rc1 = rc, rc0 = rc;
        if (da < π) {
          var oc = x3 == null ? [ x2, y2 ] : x1 == null ? [ x0, y0 ] : d3_geom_polygonIntersect([ x0, y0 ], [ x3, y3 ], [ x1, y1 ], [ x2, y2 ]), ax = x0 - oc[0], ay = y0 - oc[1], bx = x1 - oc[0], by = y1 - oc[1], kc = 1 / Math.sin(Math.acos((ax * bx + ay * by) / (Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by))) / 2), lc = Math.sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
          rc0 = Math.min(rc, (r0 - lc) / (kc - 1));
          rc1 = Math.min(rc, (r1 - lc) / (kc + 1));
        }
        if (x1 != null) {
          var t30 = d3_svg_arcCornerTangents(x3 == null ? [ x2, y2 ] : [ x3, y3 ], [ x0, y0 ], r1, rc1, cw), t12 = d3_svg_arcCornerTangents([ x1, y1 ], [ x2, y2 ], r1, rc1, cw);
          if (rc === rc1) {
            path.push("M", t30[0], "A", rc1, ",", rc1, " 0 0,", cr, " ", t30[1], "A", r1, ",", r1, " 0 ", 1 - cw ^ d3_svg_arcSweep(t30[1][0], t30[1][1], t12[1][0], t12[1][1]), ",", cw, " ", t12[1], "A", rc1, ",", rc1, " 0 0,", cr, " ", t12[0]);
          } else {
            path.push("M", t30[0], "A", rc1, ",", rc1, " 0 1,", cr, " ", t12[0]);
          }
        } else {
          path.push("M", x0, ",", y0);
        }
        if (x3 != null) {
          var t03 = d3_svg_arcCornerTangents([ x0, y0 ], [ x3, y3 ], r0, -rc0, cw), t21 = d3_svg_arcCornerTangents([ x2, y2 ], x1 == null ? [ x0, y0 ] : [ x1, y1 ], r0, -rc0, cw);
          if (rc === rc0) {
            path.push("L", t21[0], "A", rc0, ",", rc0, " 0 0,", cr, " ", t21[1], "A", r0, ",", r0, " 0 ", cw ^ d3_svg_arcSweep(t21[1][0], t21[1][1], t03[1][0], t03[1][1]), ",", 1 - cw, " ", t03[1], "A", rc0, ",", rc0, " 0 0,", cr, " ", t03[0]);
          } else {
            path.push("L", t21[0], "A", rc0, ",", rc0, " 0 0,", cr, " ", t03[0]);
          }
        } else {
          path.push("L", x2, ",", y2);
        }
      } else {
        path.push("M", x0, ",", y0);
        if (x1 != null) path.push("A", r1, ",", r1, " 0 ", l1, ",", cw, " ", x1, ",", y1);
        path.push("L", x2, ",", y2);
        if (x3 != null) path.push("A", r0, ",", r0, " 0 ", l0, ",", 1 - cw, " ", x3, ",", y3);
      }
      path.push("Z");
      return path.join("");
    }
    function circleSegment(r1, cw) {
      return "M0," + r1 + "A" + r1 + "," + r1 + " 0 1," + cw + " 0," + -r1 + "A" + r1 + "," + r1 + " 0 1," + cw + " 0," + r1;
    }
    arc.innerRadius = function(v) {
      if (!arguments.length) return innerRadius;
      innerRadius = d3_functor(v);
      return arc;
    };
    arc.outerRadius = function(v) {
      if (!arguments.length) return outerRadius;
      outerRadius = d3_functor(v);
      return arc;
    };
    arc.cornerRadius = function(v) {
      if (!arguments.length) return cornerRadius;
      cornerRadius = d3_functor(v);
      return arc;
    };
    arc.padRadius = function(v) {
      if (!arguments.length) return padRadius;
      padRadius = v == d3_svg_arcAuto ? d3_svg_arcAuto : d3_functor(v);
      return arc;
    };
    arc.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return arc;
    };
    arc.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return arc;
    };
    arc.padAngle = function(v) {
      if (!arguments.length) return padAngle;
      padAngle = d3_functor(v);
      return arc;
    };
    arc.centroid = function() {
      var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2, a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - halfπ;
      return [ Math.cos(a) * r, Math.sin(a) * r ];
    };
    return arc;
  };
  var d3_svg_arcAuto = "auto";
  function d3_svg_arcInnerRadius(d) {
    return d.innerRadius;
  }
  function d3_svg_arcOuterRadius(d) {
    return d.outerRadius;
  }
  function d3_svg_arcStartAngle(d) {
    return d.startAngle;
  }
  function d3_svg_arcEndAngle(d) {
    return d.endAngle;
  }
  function d3_svg_arcPadAngle(d) {
    return d && d.padAngle;
  }
  function d3_svg_arcSweep(x0, y0, x1, y1) {
    return (x0 - x1) * y0 - (y0 - y1) * x0 > 0 ? 0 : 1;
  }
  function d3_svg_arcCornerTangents(p0, p1, r1, rc, cw) {
    var x01 = p0[0] - p1[0], y01 = p0[1] - p1[1], lo = (cw ? rc : -rc) / Math.sqrt(x01 * x01 + y01 * y01), ox = lo * y01, oy = -lo * x01, x1 = p0[0] + ox, y1 = p0[1] + oy, x2 = p1[0] + ox, y2 = p1[1] + oy, x3 = (x1 + x2) / 2, y3 = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, d2 = dx * dx + dy * dy, r = r1 - rc, D = x1 * y2 - x2 * y1, d = (dy < 0 ? -1 : 1) * Math.sqrt(Math.max(0, r * r * d2 - D * D)), cx0 = (D * dy - dx * d) / d2, cy0 = (-D * dx - dy * d) / d2, cx1 = (D * dy + dx * d) / d2, cy1 = (-D * dx + dy * d) / d2, dx0 = cx0 - x3, dy0 = cy0 - y3, dx1 = cx1 - x3, dy1 = cy1 - y3;
    if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;
    return [ [ cx0 - ox, cy0 - oy ], [ cx0 * r1 / r, cy0 * r1 / r ] ];
  }
  function d3_svg_line(projection) {
    var x = d3_geom_pointX, y = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, tension = .7;
    function line(data) {
      var segments = [], points = [], i = -1, n = data.length, d, fx = d3_functor(x), fy = d3_functor(y);
      function segment() {
        segments.push("M", interpolate(projection(points), tension));
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points.push([ +fx.call(this, d, i), +fy.call(this, d, i) ]);
        } else if (points.length) {
          segment();
          points = [];
        }
      }
      if (points.length) segment();
      return segments.length ? segments.join("") : null;
    }
    line.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return line;
    };
    line.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return line;
    };
    line.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return line;
    };
    line.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      return line;
    };
    line.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return line;
    };
    return line;
  }
  d3.svg.line = function() {
    return d3_svg_line(d3_identity);
  };
  var d3_svg_lineInterpolators = d3.map({
    linear: d3_svg_lineLinear,
    "linear-closed": d3_svg_lineLinearClosed,
    step: d3_svg_lineStep,
    "step-before": d3_svg_lineStepBefore,
    "step-after": d3_svg_lineStepAfter,
    basis: d3_svg_lineBasis,
    "basis-open": d3_svg_lineBasisOpen,
    "basis-closed": d3_svg_lineBasisClosed,
    bundle: d3_svg_lineBundle,
    cardinal: d3_svg_lineCardinal,
    "cardinal-open": d3_svg_lineCardinalOpen,
    "cardinal-closed": d3_svg_lineCardinalClosed,
    monotone: d3_svg_lineMonotone
  });
  d3_svg_lineInterpolators.forEach(function(key, value) {
    value.key = key;
    value.closed = /-closed$/.test(key);
  });
  function d3_svg_lineLinear(points) {
    return points.length > 1 ? points.join("L") : points + "Z";
  }
  function d3_svg_lineLinearClosed(points) {
    return points.join("L") + "Z";
  }
  function d3_svg_lineStep(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p[0] + (p = points[i])[0]) / 2, "V", p[1]);
    if (n > 1) path.push("H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepBefore(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("V", (p = points[i])[1], "H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepAfter(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p = points[i])[0], "V", p[1]);
    return path.join("");
  }
  function d3_svg_lineCardinalOpen(points, tension) {
    return points.length < 4 ? d3_svg_lineLinear(points) : points[1] + d3_svg_lineHermite(points.slice(1, -1), d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineCardinalClosed(points, tension) {
    return points.length < 3 ? d3_svg_lineLinearClosed(points) : points[0] + d3_svg_lineHermite((points.push(points[0]), 
    points), d3_svg_lineCardinalTangents([ points[points.length - 2] ].concat(points, [ points[1] ]), tension));
  }
  function d3_svg_lineCardinal(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineHermite(points, tangents) {
    if (tangents.length < 1 || points.length != tangents.length && points.length != tangents.length + 2) {
      return d3_svg_lineLinear(points);
    }
    var quad = points.length != tangents.length, path = "", p0 = points[0], p = points[1], t0 = tangents[0], t = t0, pi = 1;
    if (quad) {
      path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3) + "," + p[0] + "," + p[1];
      p0 = points[1];
      pi = 2;
    }
    if (tangents.length > 1) {
      t = tangents[1];
      p = points[pi];
      pi++;
      path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1]) + "," + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      for (var i = 2; i < tangents.length; i++, pi++) {
        p = points[pi];
        t = tangents[i];
        path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      }
    }
    if (quad) {
      var lp = points[pi];
      path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3) + "," + lp[0] + "," + lp[1];
    }
    return path;
  }
  function d3_svg_lineCardinalTangents(points, tension) {
    var tangents = [], a = (1 - tension) / 2, p0, p1 = points[0], p2 = points[1], i = 1, n = points.length;
    while (++i < n) {
      p0 = p1;
      p1 = p2;
      p2 = points[i];
      tangents.push([ a * (p2[0] - p0[0]), a * (p2[1] - p0[1]) ]);
    }
    return tangents;
  }
  function d3_svg_lineBasis(points) {
    if (points.length < 3) return d3_svg_lineLinear(points);
    var i = 1, n = points.length, pi = points[0], x0 = pi[0], y0 = pi[1], px = [ x0, x0, x0, (pi = points[1])[0] ], py = [ y0, y0, y0, pi[1] ], path = [ x0, ",", y0, "L", d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    points.push(points[n - 1]);
    while (++i <= n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    points.pop();
    path.push("L", pi);
    return path.join("");
  }
  function d3_svg_lineBasisOpen(points) {
    if (points.length < 4) return d3_svg_lineLinear(points);
    var path = [], i = -1, n = points.length, pi, px = [ 0 ], py = [ 0 ];
    while (++i < 3) {
      pi = points[i];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px) + "," + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));
    --i;
    while (++i < n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBasisClosed(points) {
    var path, i = -1, n = points.length, m = n + 4, pi, px = [], py = [];
    while (++i < 4) {
      pi = points[i % n];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path = [ d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    --i;
    while (++i < m) {
      pi = points[i % n];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBundle(points, tension) {
    var n = points.length - 1;
    if (n) {
      var x0 = points[0][0], y0 = points[0][1], dx = points[n][0] - x0, dy = points[n][1] - y0, i = -1, p, t;
      while (++i <= n) {
        p = points[i];
        t = i / n;
        p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);
        p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
      }
    }
    return d3_svg_lineBasis(points);
  }
  function d3_svg_lineDot4(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  var d3_svg_lineBasisBezier1 = [ 0, 2 / 3, 1 / 3, 0 ], d3_svg_lineBasisBezier2 = [ 0, 1 / 3, 2 / 3, 0 ], d3_svg_lineBasisBezier3 = [ 0, 1 / 6, 2 / 3, 1 / 6 ];
  function d3_svg_lineBasisBezier(path, x, y) {
    path.push("C", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));
  }
  function d3_svg_lineSlope(p0, p1) {
    return (p1[1] - p0[1]) / (p1[0] - p0[0]);
  }
  function d3_svg_lineFiniteDifferences(points) {
    var i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = d3_svg_lineSlope(p0, p1);
    while (++i < j) {
      m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;
    }
    m[i] = d;
    return m;
  }
  function d3_svg_lineMonotoneTangents(points) {
    var tangents = [], d, a, b, s, m = d3_svg_lineFiniteDifferences(points), i = -1, j = points.length - 1;
    while (++i < j) {
      d = d3_svg_lineSlope(points[i], points[i + 1]);
      if (abs(d) < ε) {
        m[i] = m[i + 1] = 0;
      } else {
        a = m[i] / d;
        b = m[i + 1] / d;
        s = a * a + b * b;
        if (s > 9) {
          s = d * 3 / Math.sqrt(s);
          m[i] = s * a;
          m[i + 1] = s * b;
        }
      }
    }
    i = -1;
    while (++i <= j) {
      s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
      tangents.push([ s || 0, m[i] * s || 0 ]);
    }
    return tangents;
  }
  function d3_svg_lineMonotone(points) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));
  }
  d3.svg.line.radial = function() {
    var line = d3_svg_line(d3_svg_lineRadial);
    line.radius = line.x, delete line.x;
    line.angle = line.y, delete line.y;
    return line;
  };
  function d3_svg_lineRadial(points) {
    var point, i = -1, n = points.length, r, a;
    while (++i < n) {
      point = points[i];
      r = point[0];
      a = point[1] - halfπ;
      point[0] = r * Math.cos(a);
      point[1] = r * Math.sin(a);
    }
    return points;
  }
  function d3_svg_area(projection) {
    var x0 = d3_geom_pointX, x1 = d3_geom_pointX, y0 = 0, y1 = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, interpolateReverse = interpolate, L = "L", tension = .7;
    function area(data) {
      var segments = [], points0 = [], points1 = [], i = -1, n = data.length, d, fx0 = d3_functor(x0), fy0 = d3_functor(y0), fx1 = x0 === x1 ? function() {
        return x;
      } : d3_functor(x1), fy1 = y0 === y1 ? function() {
        return y;
      } : d3_functor(y1), x, y;
      function segment() {
        segments.push("M", interpolate(projection(points1), tension), L, interpolateReverse(projection(points0.reverse()), tension), "Z");
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points0.push([ x = +fx0.call(this, d, i), y = +fy0.call(this, d, i) ]);
          points1.push([ +fx1.call(this, d, i), +fy1.call(this, d, i) ]);
        } else if (points0.length) {
          segment();
          points0 = [];
          points1 = [];
        }
      }
      if (points0.length) segment();
      return segments.length ? segments.join("") : null;
    }
    area.x = function(_) {
      if (!arguments.length) return x1;
      x0 = x1 = _;
      return area;
    };
    area.x0 = function(_) {
      if (!arguments.length) return x0;
      x0 = _;
      return area;
    };
    area.x1 = function(_) {
      if (!arguments.length) return x1;
      x1 = _;
      return area;
    };
    area.y = function(_) {
      if (!arguments.length) return y1;
      y0 = y1 = _;
      return area;
    };
    area.y0 = function(_) {
      if (!arguments.length) return y0;
      y0 = _;
      return area;
    };
    area.y1 = function(_) {
      if (!arguments.length) return y1;
      y1 = _;
      return area;
    };
    area.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return area;
    };
    area.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      interpolateReverse = interpolate.reverse || interpolate;
      L = interpolate.closed ? "M" : "L";
      return area;
    };
    area.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return area;
    };
    return area;
  }
  d3_svg_lineStepBefore.reverse = d3_svg_lineStepAfter;
  d3_svg_lineStepAfter.reverse = d3_svg_lineStepBefore;
  d3.svg.area = function() {
    return d3_svg_area(d3_identity);
  };
  d3.svg.area.radial = function() {
    var area = d3_svg_area(d3_svg_lineRadial);
    area.radius = area.x, delete area.x;
    area.innerRadius = area.x0, delete area.x0;
    area.outerRadius = area.x1, delete area.x1;
    area.angle = area.y, delete area.y;
    area.startAngle = area.y0, delete area.y0;
    area.endAngle = area.y1, delete area.y1;
    return area;
  };
  d3.svg.chord = function() {
    var source = d3_source, target = d3_target, radius = d3_svg_chordRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function chord(d, i) {
      var s = subgroup(this, source, d, i), t = subgroup(this, target, d, i);
      return "M" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0) + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0) + arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0)) + "Z";
    }
    function subgroup(self, f, d, i) {
      var subgroup = f.call(self, d, i), r = radius.call(self, subgroup, i), a0 = startAngle.call(self, subgroup, i) - halfπ, a1 = endAngle.call(self, subgroup, i) - halfπ;
      return {
        r: r,
        a0: a0,
        a1: a1,
        p0: [ r * Math.cos(a0), r * Math.sin(a0) ],
        p1: [ r * Math.cos(a1), r * Math.sin(a1) ]
      };
    }
    function equals(a, b) {
      return a.a0 == b.a0 && a.a1 == b.a1;
    }
    function arc(r, p, a) {
      return "A" + r + "," + r + " 0 " + +(a > π) + ",1 " + p;
    }
    function curve(r0, p0, r1, p1) {
      return "Q 0,0 " + p1;
    }
    chord.radius = function(v) {
      if (!arguments.length) return radius;
      radius = d3_functor(v);
      return chord;
    };
    chord.source = function(v) {
      if (!arguments.length) return source;
      source = d3_functor(v);
      return chord;
    };
    chord.target = function(v) {
      if (!arguments.length) return target;
      target = d3_functor(v);
      return chord;
    };
    chord.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return chord;
    };
    chord.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return chord;
    };
    return chord;
  };
  function d3_svg_chordRadius(d) {
    return d.radius;
  }
  d3.svg.diagonal = function() {
    var source = d3_source, target = d3_target, projection = d3_svg_diagonalProjection;
    function diagonal(d, i) {
      var p0 = source.call(this, d, i), p3 = target.call(this, d, i), m = (p0.y + p3.y) / 2, p = [ p0, {
        x: p0.x,
        y: m
      }, {
        x: p3.x,
        y: m
      }, p3 ];
      p = p.map(projection);
      return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3];
    }
    diagonal.source = function(x) {
      if (!arguments.length) return source;
      source = d3_functor(x);
      return diagonal;
    };
    diagonal.target = function(x) {
      if (!arguments.length) return target;
      target = d3_functor(x);
      return diagonal;
    };
    diagonal.projection = function(x) {
      if (!arguments.length) return projection;
      projection = x;
      return diagonal;
    };
    return diagonal;
  };
  function d3_svg_diagonalProjection(d) {
    return [ d.x, d.y ];
  }
  d3.svg.diagonal.radial = function() {
    var diagonal = d3.svg.diagonal(), projection = d3_svg_diagonalProjection, projection_ = diagonal.projection;
    diagonal.projection = function(x) {
      return arguments.length ? projection_(d3_svg_diagonalRadialProjection(projection = x)) : projection;
    };
    return diagonal;
  };
  function d3_svg_diagonalRadialProjection(projection) {
    return function() {
      var d = projection.apply(this, arguments), r = d[0], a = d[1] - halfπ;
      return [ r * Math.cos(a), r * Math.sin(a) ];
    };
  }
  d3.svg.symbol = function() {
    var type = d3_svg_symbolType, size = d3_svg_symbolSize;
    function symbol(d, i) {
      return (d3_svg_symbols.get(type.call(this, d, i)) || d3_svg_symbolCircle)(size.call(this, d, i));
    }
    symbol.type = function(x) {
      if (!arguments.length) return type;
      type = d3_functor(x);
      return symbol;
    };
    symbol.size = function(x) {
      if (!arguments.length) return size;
      size = d3_functor(x);
      return symbol;
    };
    return symbol;
  };
  function d3_svg_symbolSize() {
    return 64;
  }
  function d3_svg_symbolType() {
    return "circle";
  }
  function d3_svg_symbolCircle(size) {
    var r = Math.sqrt(size / π);
    return "M0," + r + "A" + r + "," + r + " 0 1,1 0," + -r + "A" + r + "," + r + " 0 1,1 0," + r + "Z";
  }
  var d3_svg_symbols = d3.map({
    circle: d3_svg_symbolCircle,
    cross: function(size) {
      var r = Math.sqrt(size / 5) / 2;
      return "M" + -3 * r + "," + -r + "H" + -r + "V" + -3 * r + "H" + r + "V" + -r + "H" + 3 * r + "V" + r + "H" + r + "V" + 3 * r + "H" + -r + "V" + r + "H" + -3 * r + "Z";
    },
    diamond: function(size) {
      var ry = Math.sqrt(size / (2 * d3_svg_symbolTan30)), rx = ry * d3_svg_symbolTan30;
      return "M0," + -ry + "L" + rx + ",0" + " 0," + ry + " " + -rx + ",0" + "Z";
    },
    square: function(size) {
      var r = Math.sqrt(size) / 2;
      return "M" + -r + "," + -r + "L" + r + "," + -r + " " + r + "," + r + " " + -r + "," + r + "Z";
    },
    "triangle-down": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + ry + "L" + rx + "," + -ry + " " + -rx + "," + -ry + "Z";
    },
    "triangle-up": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + -ry + "L" + rx + "," + ry + " " + -rx + "," + ry + "Z";
    }
  });
  d3.svg.symbolTypes = d3_svg_symbols.keys();
  var d3_svg_symbolSqrt3 = Math.sqrt(3), d3_svg_symbolTan30 = Math.tan(30 * d3_radians);
  d3_selectionPrototype.transition = function(name) {
    var id = d3_transitionInheritId || ++d3_transitionId, ns = d3_transitionNamespace(name), subgroups = [], subgroup, node, transition = d3_transitionInherit || {
      time: Date.now(),
      ease: d3_ease_cubicInOut,
      delay: 0,
      duration: 250
    };
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) d3_transitionNode(node, i, ns, id, transition);
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_selectionPrototype.interrupt = function(name) {
    return this.each(name == null ? d3_selection_interrupt : d3_selection_interruptNS(d3_transitionNamespace(name)));
  };
  var d3_selection_interrupt = d3_selection_interruptNS(d3_transitionNamespace());
  function d3_selection_interruptNS(ns) {
    return function() {
      var lock, activeId, active;
      if ((lock = this[ns]) && (active = lock[activeId = lock.active])) {
        active.timer.c = null;
        active.timer.t = NaN;
        if (--lock.count) delete lock[activeId]; else delete this[ns];
        lock.active += .5;
        active.event && active.event.interrupt.call(this, this.__data__, active.index);
      }
    };
  }
  function d3_transition(groups, ns, id) {
    d3_subclass(groups, d3_transitionPrototype);
    groups.namespace = ns;
    groups.id = id;
    return groups;
  }
  var d3_transitionPrototype = [], d3_transitionId = 0, d3_transitionInheritId, d3_transitionInherit;
  d3_transitionPrototype.call = d3_selectionPrototype.call;
  d3_transitionPrototype.empty = d3_selectionPrototype.empty;
  d3_transitionPrototype.node = d3_selectionPrototype.node;
  d3_transitionPrototype.size = d3_selectionPrototype.size;
  d3.transition = function(selection, name) {
    return selection && selection.transition ? d3_transitionInheritId ? selection.transition(name) : selection : d3.selection().transition(selection);
  };
  d3.transition.prototype = d3_transitionPrototype;
  d3_transitionPrototype.select = function(selector) {
    var id = this.id, ns = this.namespace, subgroups = [], subgroup, subnode, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i, j))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          d3_transitionNode(subnode, i, ns, id, node[ns][id]);
          subgroup.push(subnode);
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_transitionPrototype.selectAll = function(selector) {
    var id = this.id, ns = this.namespace, subgroups = [], subgroup, subnodes, node, subnode, transition;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          transition = node[ns][id];
          subnodes = selector.call(node, node.__data__, i, j);
          subgroups.push(subgroup = []);
          for (var k = -1, o = subnodes.length; ++k < o; ) {
            if (subnode = subnodes[k]) d3_transitionNode(subnode, k, ns, id, transition);
            subgroup.push(subnode);
          }
        }
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_transitionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_transition(subgroups, this.namespace, this.id);
  };
  d3_transitionPrototype.tween = function(name, tween) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 2) return this.node()[ns][id].tween.get(name);
    return d3_selection_each(this, tween == null ? function(node) {
      node[ns][id].tween.remove(name);
    } : function(node) {
      node[ns][id].tween.set(name, tween);
    });
  };
  function d3_transition_tween(groups, name, value, tween) {
    var id = groups.id, ns = groups.namespace;
    return d3_selection_each(groups, typeof value === "function" ? function(node, i, j) {
      node[ns][id].tween.set(name, tween(value.call(node, node.__data__, i, j)));
    } : (value = tween(value), function(node) {
      node[ns][id].tween.set(name, value);
    }));
  }
  d3_transitionPrototype.attr = function(nameNS, value) {
    if (arguments.length < 2) {
      for (value in nameNS) this.attr(value, nameNS[value]);
      return this;
    }
    var interpolate = nameNS == "transform" ? d3_interpolateTransform : d3_interpolate, name = d3.ns.qualify(nameNS);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrTween(b) {
      return b == null ? attrNull : (b += "", function() {
        var a = this.getAttribute(name), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttribute(name, i(t));
        });
      });
    }
    function attrTweenNS(b) {
      return b == null ? attrNullNS : (b += "", function() {
        var a = this.getAttributeNS(name.space, name.local), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttributeNS(name.space, name.local, i(t));
        });
      });
    }
    return d3_transition_tween(this, "attr." + nameNS, value, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.attrTween = function(nameNS, tween) {
    var name = d3.ns.qualify(nameNS);
    function attrTween(d, i) {
      var f = tween.call(this, d, i, this.getAttribute(name));
      return f && function(t) {
        this.setAttribute(name, f(t));
      };
    }
    function attrTweenNS(d, i) {
      var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
      return f && function(t) {
        this.setAttributeNS(name.space, name.local, f(t));
      };
    }
    return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.style(priority, name[priority], value);
        return this;
      }
      priority = "";
    }
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleString(b) {
      return b == null ? styleNull : (b += "", function() {
        var a = d3_window(this).getComputedStyle(this, null).getPropertyValue(name), i;
        return a !== b && (i = d3_interpolate(a, b), function(t) {
          this.style.setProperty(name, i(t), priority);
        });
      });
    }
    return d3_transition_tween(this, "style." + name, value, styleString);
  };
  d3_transitionPrototype.styleTween = function(name, tween, priority) {
    if (arguments.length < 3) priority = "";
    function styleTween(d, i) {
      var f = tween.call(this, d, i, d3_window(this).getComputedStyle(this, null).getPropertyValue(name));
      return f && function(t) {
        this.style.setProperty(name, f(t), priority);
      };
    }
    return this.tween("style." + name, styleTween);
  };
  d3_transitionPrototype.text = function(value) {
    return d3_transition_tween(this, "text", value, d3_transition_text);
  };
  function d3_transition_text(b) {
    if (b == null) b = "";
    return function() {
      this.textContent = b;
    };
  }
  d3_transitionPrototype.remove = function() {
    var ns = this.namespace;
    return this.each("end.transition", function() {
      var p;
      if (this[ns].count < 2 && (p = this.parentNode)) p.removeChild(this);
    });
  };
  d3_transitionPrototype.ease = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].ease;
    if (typeof value !== "function") value = d3.ease.apply(d3, arguments);
    return d3_selection_each(this, function(node) {
      node[ns][id].ease = value;
    });
  };
  d3_transitionPrototype.delay = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].delay;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node[ns][id].delay = +value.call(node, node.__data__, i, j);
    } : (value = +value, function(node) {
      node[ns][id].delay = value;
    }));
  };
  d3_transitionPrototype.duration = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].duration;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node[ns][id].duration = Math.max(1, value.call(node, node.__data__, i, j));
    } : (value = Math.max(1, value), function(node) {
      node[ns][id].duration = value;
    }));
  };
  d3_transitionPrototype.each = function(type, listener) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 2) {
      var inherit = d3_transitionInherit, inheritId = d3_transitionInheritId;
      try {
        d3_transitionInheritId = id;
        d3_selection_each(this, function(node, i, j) {
          d3_transitionInherit = node[ns][id];
          type.call(node, node.__data__, i, j);
        });
      } finally {
        d3_transitionInherit = inherit;
        d3_transitionInheritId = inheritId;
      }
    } else {
      d3_selection_each(this, function(node) {
        var transition = node[ns][id];
        (transition.event || (transition.event = d3.dispatch("start", "end", "interrupt"))).on(type, listener);
      });
    }
    return this;
  };
  d3_transitionPrototype.transition = function() {
    var id0 = this.id, id1 = ++d3_transitionId, ns = this.namespace, subgroups = [], subgroup, group, node, transition;
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if (node = group[i]) {
          transition = node[ns][id0];
          d3_transitionNode(node, i, ns, id1, {
            time: transition.time,
            ease: transition.ease,
            delay: transition.delay + transition.duration,
            duration: transition.duration
          });
        }
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, ns, id1);
  };
  function d3_transitionNamespace(name) {
    return name == null ? "__transition__" : "__transition_" + name + "__";
  }
  function d3_transitionNode(node, i, ns, id, inherit) {
    var lock = node[ns] || (node[ns] = {
      active: 0,
      count: 0
    }), transition = lock[id], time, timer, duration, ease, tweens;
    function schedule(elapsed) {
      var delay = transition.delay;
      timer.t = delay + time;
      if (delay <= elapsed) return start(elapsed - delay);
      timer.c = start;
    }
    function start(elapsed) {
      var activeId = lock.active, active = lock[activeId];
      if (active) {
        active.timer.c = null;
        active.timer.t = NaN;
        --lock.count;
        delete lock[activeId];
        active.event && active.event.interrupt.call(node, node.__data__, active.index);
      }
      for (var cancelId in lock) {
        if (+cancelId < id) {
          var cancel = lock[cancelId];
          cancel.timer.c = null;
          cancel.timer.t = NaN;
          --lock.count;
          delete lock[cancelId];
        }
      }
      timer.c = tick;
      d3_timer(function() {
        if (timer.c && tick(elapsed || 1)) {
          timer.c = null;
          timer.t = NaN;
        }
        return 1;
      }, 0, time);
      lock.active = id;
      transition.event && transition.event.start.call(node, node.__data__, i);
      tweens = [];
      transition.tween.forEach(function(key, value) {
        if (value = value.call(node, node.__data__, i)) {
          tweens.push(value);
        }
      });
      ease = transition.ease;
      duration = transition.duration;
    }
    function tick(elapsed) {
      var t = elapsed / duration, e = ease(t), n = tweens.length;
      while (n > 0) {
        tweens[--n].call(node, e);
      }
      if (t >= 1) {
        transition.event && transition.event.end.call(node, node.__data__, i);
        if (--lock.count) delete lock[id]; else delete node[ns];
        return 1;
      }
    }
    if (!transition) {
      time = inherit.time;
      timer = d3_timer(schedule, 0, time);
      transition = lock[id] = {
        tween: new d3_Map(),
        time: time,
        timer: timer,
        delay: inherit.delay,
        duration: inherit.duration,
        ease: inherit.ease,
        index: i
      };
      inherit = null;
      ++lock.count;
    }
  }
  d3.svg.axis = function() {
    var scale = d3.scale.linear(), orient = d3_svg_axisDefaultOrient, innerTickSize = 6, outerTickSize = 6, tickPadding = 3, tickArguments_ = [ 10 ], tickValues = null, tickFormat_;
    function axis(g) {
      g.each(function() {
        var g = d3.select(this);
        var scale0 = this.__chart__ || scale, scale1 = this.__chart__ = scale.copy();
        var ticks = tickValues == null ? scale1.ticks ? scale1.ticks.apply(scale1, tickArguments_) : scale1.domain() : tickValues, tickFormat = tickFormat_ == null ? scale1.tickFormat ? scale1.tickFormat.apply(scale1, tickArguments_) : d3_identity : tickFormat_, tick = g.selectAll(".tick").data(ticks, scale1), tickEnter = tick.enter().insert("g", ".domain").attr("class", "tick").style("opacity", ε), tickExit = d3.transition(tick.exit()).style("opacity", ε).remove(), tickUpdate = d3.transition(tick.order()).style("opacity", 1), tickSpacing = Math.max(innerTickSize, 0) + tickPadding, tickTransform;
        var range = d3_scaleRange(scale1), path = g.selectAll(".domain").data([ 0 ]), pathUpdate = (path.enter().append("path").attr("class", "domain"), 
        d3.transition(path));
        tickEnter.append("line");
        tickEnter.append("text");
        var lineEnter = tickEnter.select("line"), lineUpdate = tickUpdate.select("line"), text = tick.select("text").text(tickFormat), textEnter = tickEnter.select("text"), textUpdate = tickUpdate.select("text"), sign = orient === "top" || orient === "left" ? -1 : 1, x1, x2, y1, y2;
        if (orient === "bottom" || orient === "top") {
          tickTransform = d3_svg_axisX, x1 = "x", y1 = "y", x2 = "x2", y2 = "y2";
          text.attr("dy", sign < 0 ? "0em" : ".71em").style("text-anchor", "middle");
          pathUpdate.attr("d", "M" + range[0] + "," + sign * outerTickSize + "V0H" + range[1] + "V" + sign * outerTickSize);
        } else {
          tickTransform = d3_svg_axisY, x1 = "y", y1 = "x", x2 = "y2", y2 = "x2";
          text.attr("dy", ".32em").style("text-anchor", sign < 0 ? "end" : "start");
          pathUpdate.attr("d", "M" + sign * outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + sign * outerTickSize);
        }
        lineEnter.attr(y2, sign * innerTickSize);
        textEnter.attr(y1, sign * tickSpacing);
        lineUpdate.attr(x2, 0).attr(y2, sign * innerTickSize);
        textUpdate.attr(x1, 0).attr(y1, sign * tickSpacing);
        if (scale1.rangeBand) {
          var x = scale1, dx = x.rangeBand() / 2;
          scale0 = scale1 = function(d) {
            return x(d) + dx;
          };
        } else if (scale0.rangeBand) {
          scale0 = scale1;
        } else {
          tickExit.call(tickTransform, scale1, scale0);
        }
        tickEnter.call(tickTransform, scale0, scale1);
        tickUpdate.call(tickTransform, scale1, scale1);
      });
    }
    axis.scale = function(x) {
      if (!arguments.length) return scale;
      scale = x;
      return axis;
    };
    axis.orient = function(x) {
      if (!arguments.length) return orient;
      orient = x in d3_svg_axisOrients ? x + "" : d3_svg_axisDefaultOrient;
      return axis;
    };
    axis.ticks = function() {
      if (!arguments.length) return tickArguments_;
      tickArguments_ = d3_array(arguments);
      return axis;
    };
    axis.tickValues = function(x) {
      if (!arguments.length) return tickValues;
      tickValues = x;
      return axis;
    };
    axis.tickFormat = function(x) {
      if (!arguments.length) return tickFormat_;
      tickFormat_ = x;
      return axis;
    };
    axis.tickSize = function(x) {
      var n = arguments.length;
      if (!n) return innerTickSize;
      innerTickSize = +x;
      outerTickSize = +arguments[n - 1];
      return axis;
    };
    axis.innerTickSize = function(x) {
      if (!arguments.length) return innerTickSize;
      innerTickSize = +x;
      return axis;
    };
    axis.outerTickSize = function(x) {
      if (!arguments.length) return outerTickSize;
      outerTickSize = +x;
      return axis;
    };
    axis.tickPadding = function(x) {
      if (!arguments.length) return tickPadding;
      tickPadding = +x;
      return axis;
    };
    axis.tickSubdivide = function() {
      return arguments.length && axis;
    };
    return axis;
  };
  var d3_svg_axisDefaultOrient = "bottom", d3_svg_axisOrients = {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1
  };
  function d3_svg_axisX(selection, x0, x1) {
    selection.attr("transform", function(d) {
      var v0 = x0(d);
      return "translate(" + (isFinite(v0) ? v0 : x1(d)) + ",0)";
    });
  }
  function d3_svg_axisY(selection, y0, y1) {
    selection.attr("transform", function(d) {
      var v0 = y0(d);
      return "translate(0," + (isFinite(v0) ? v0 : y1(d)) + ")";
    });
  }
  d3.svg.brush = function() {
    var event = d3_eventDispatch(brush, "brushstart", "brush", "brushend"), x = null, y = null, xExtent = [ 0, 0 ], yExtent = [ 0, 0 ], xExtentDomain, yExtentDomain, xClamp = true, yClamp = true, resizes = d3_svg_brushResizes[0];
    function brush(g) {
      g.each(function() {
        var g = d3.select(this).style("pointer-events", "all").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)").on("mousedown.brush", brushstart).on("touchstart.brush", brushstart);
        var background = g.selectAll(".background").data([ 0 ]);
        background.enter().append("rect").attr("class", "background").style("visibility", "hidden").style("cursor", "crosshair");
        g.selectAll(".extent").data([ 0 ]).enter().append("rect").attr("class", "extent").style("cursor", "move");
        var resize = g.selectAll(".resize").data(resizes, d3_identity);
        resize.exit().remove();
        resize.enter().append("g").attr("class", function(d) {
          return "resize " + d;
        }).style("cursor", function(d) {
          return d3_svg_brushCursor[d];
        }).append("rect").attr("x", function(d) {
          return /[ew]$/.test(d) ? -3 : null;
        }).attr("y", function(d) {
          return /^[ns]/.test(d) ? -3 : null;
        }).attr("width", 6).attr("height", 6).style("visibility", "hidden");
        resize.style("display", brush.empty() ? "none" : null);
        var gUpdate = d3.transition(g), backgroundUpdate = d3.transition(background), range;
        if (x) {
          range = d3_scaleRange(x);
          backgroundUpdate.attr("x", range[0]).attr("width", range[1] - range[0]);
          redrawX(gUpdate);
        }
        if (y) {
          range = d3_scaleRange(y);
          backgroundUpdate.attr("y", range[0]).attr("height", range[1] - range[0]);
          redrawY(gUpdate);
        }
        redraw(gUpdate);
      });
    }
    brush.event = function(g) {
      g.each(function() {
        var event_ = event.of(this, arguments), extent1 = {
          x: xExtent,
          y: yExtent,
          i: xExtentDomain,
          j: yExtentDomain
        }, extent0 = this.__chart__ || extent1;
        this.__chart__ = extent1;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.brush", function() {
            xExtentDomain = extent0.i;
            yExtentDomain = extent0.j;
            xExtent = extent0.x;
            yExtent = extent0.y;
            event_({
              type: "brushstart"
            });
          }).tween("brush:brush", function() {
            var xi = d3_interpolateArray(xExtent, extent1.x), yi = d3_interpolateArray(yExtent, extent1.y);
            xExtentDomain = yExtentDomain = null;
            return function(t) {
              xExtent = extent1.x = xi(t);
              yExtent = extent1.y = yi(t);
              event_({
                type: "brush",
                mode: "resize"
              });
            };
          }).each("end.brush", function() {
            xExtentDomain = extent1.i;
            yExtentDomain = extent1.j;
            event_({
              type: "brush",
              mode: "resize"
            });
            event_({
              type: "brushend"
            });
          });
        } else {
          event_({
            type: "brushstart"
          });
          event_({
            type: "brush",
            mode: "resize"
          });
          event_({
            type: "brushend"
          });
        }
      });
    };
    function redraw(g) {
      g.selectAll(".resize").attr("transform", function(d) {
        return "translate(" + xExtent[+/e$/.test(d)] + "," + yExtent[+/^s/.test(d)] + ")";
      });
    }
    function redrawX(g) {
      g.select(".extent").attr("x", xExtent[0]);
      g.selectAll(".extent,.n>rect,.s>rect").attr("width", xExtent[1] - xExtent[0]);
    }
    function redrawY(g) {
      g.select(".extent").attr("y", yExtent[0]);
      g.selectAll(".extent,.e>rect,.w>rect").attr("height", yExtent[1] - yExtent[0]);
    }
    function brushstart() {
      var target = this, eventTarget = d3.select(d3.event.target), event_ = event.of(target, arguments), g = d3.select(target), resizing = eventTarget.datum(), resizingX = !/^(n|s)$/.test(resizing) && x, resizingY = !/^(e|w)$/.test(resizing) && y, dragging = eventTarget.classed("extent"), dragRestore = d3_event_dragSuppress(target), center, origin = d3.mouse(target), offset;
      var w = d3.select(d3_window(target)).on("keydown.brush", keydown).on("keyup.brush", keyup);
      if (d3.event.changedTouches) {
        w.on("touchmove.brush", brushmove).on("touchend.brush", brushend);
      } else {
        w.on("mousemove.brush", brushmove).on("mouseup.brush", brushend);
      }
      g.interrupt().selectAll("*").interrupt();
      if (dragging) {
        origin[0] = xExtent[0] - origin[0];
        origin[1] = yExtent[0] - origin[1];
      } else if (resizing) {
        var ex = +/w$/.test(resizing), ey = +/^n/.test(resizing);
        offset = [ xExtent[1 - ex] - origin[0], yExtent[1 - ey] - origin[1] ];
        origin[0] = xExtent[ex];
        origin[1] = yExtent[ey];
      } else if (d3.event.altKey) center = origin.slice();
      g.style("pointer-events", "none").selectAll(".resize").style("display", null);
      d3.select("body").style("cursor", eventTarget.style("cursor"));
      event_({
        type: "brushstart"
      });
      brushmove();
      function keydown() {
        if (d3.event.keyCode == 32) {
          if (!dragging) {
            center = null;
            origin[0] -= xExtent[1];
            origin[1] -= yExtent[1];
            dragging = 2;
          }
          d3_eventPreventDefault();
        }
      }
      function keyup() {
        if (d3.event.keyCode == 32 && dragging == 2) {
          origin[0] += xExtent[1];
          origin[1] += yExtent[1];
          dragging = 0;
          d3_eventPreventDefault();
        }
      }
      function brushmove() {
        var point = d3.mouse(target), moved = false;
        if (offset) {
          point[0] += offset[0];
          point[1] += offset[1];
        }
        if (!dragging) {
          if (d3.event.altKey) {
            if (!center) center = [ (xExtent[0] + xExtent[1]) / 2, (yExtent[0] + yExtent[1]) / 2 ];
            origin[0] = xExtent[+(point[0] < center[0])];
            origin[1] = yExtent[+(point[1] < center[1])];
          } else center = null;
        }
        if (resizingX && move1(point, x, 0)) {
          redrawX(g);
          moved = true;
        }
        if (resizingY && move1(point, y, 1)) {
          redrawY(g);
          moved = true;
        }
        if (moved) {
          redraw(g);
          event_({
            type: "brush",
            mode: dragging ? "move" : "resize"
          });
        }
      }
      function move1(point, scale, i) {
        var range = d3_scaleRange(scale), r0 = range[0], r1 = range[1], position = origin[i], extent = i ? yExtent : xExtent, size = extent[1] - extent[0], min, max;
        if (dragging) {
          r0 -= position;
          r1 -= size + position;
        }
        min = (i ? yClamp : xClamp) ? Math.max(r0, Math.min(r1, point[i])) : point[i];
        if (dragging) {
          max = (min += position) + size;
        } else {
          if (center) position = Math.max(r0, Math.min(r1, 2 * center[i] - min));
          if (position < min) {
            max = min;
            min = position;
          } else {
            max = position;
          }
        }
        if (extent[0] != min || extent[1] != max) {
          if (i) yExtentDomain = null; else xExtentDomain = null;
          extent[0] = min;
          extent[1] = max;
          return true;
        }
      }
      function brushend() {
        brushmove();
        g.style("pointer-events", "all").selectAll(".resize").style("display", brush.empty() ? "none" : null);
        d3.select("body").style("cursor", null);
        w.on("mousemove.brush", null).on("mouseup.brush", null).on("touchmove.brush", null).on("touchend.brush", null).on("keydown.brush", null).on("keyup.brush", null);
        dragRestore();
        event_({
          type: "brushend"
        });
      }
    }
    brush.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.clamp = function(z) {
      if (!arguments.length) return x && y ? [ xClamp, yClamp ] : x ? xClamp : y ? yClamp : null;
      if (x && y) xClamp = !!z[0], yClamp = !!z[1]; else if (x) xClamp = !!z; else if (y) yClamp = !!z;
      return brush;
    };
    brush.extent = function(z) {
      var x0, x1, y0, y1, t;
      if (!arguments.length) {
        if (x) {
          if (xExtentDomain) {
            x0 = xExtentDomain[0], x1 = xExtentDomain[1];
          } else {
            x0 = xExtent[0], x1 = xExtent[1];
            if (x.invert) x0 = x.invert(x0), x1 = x.invert(x1);
            if (x1 < x0) t = x0, x0 = x1, x1 = t;
          }
        }
        if (y) {
          if (yExtentDomain) {
            y0 = yExtentDomain[0], y1 = yExtentDomain[1];
          } else {
            y0 = yExtent[0], y1 = yExtent[1];
            if (y.invert) y0 = y.invert(y0), y1 = y.invert(y1);
            if (y1 < y0) t = y0, y0 = y1, y1 = t;
          }
        }
        return x && y ? [ [ x0, y0 ], [ x1, y1 ] ] : x ? [ x0, x1 ] : y && [ y0, y1 ];
      }
      if (x) {
        x0 = z[0], x1 = z[1];
        if (y) x0 = x0[0], x1 = x1[0];
        xExtentDomain = [ x0, x1 ];
        if (x.invert) x0 = x(x0), x1 = x(x1);
        if (x1 < x0) t = x0, x0 = x1, x1 = t;
        if (x0 != xExtent[0] || x1 != xExtent[1]) xExtent = [ x0, x1 ];
      }
      if (y) {
        y0 = z[0], y1 = z[1];
        if (x) y0 = y0[1], y1 = y1[1];
        yExtentDomain = [ y0, y1 ];
        if (y.invert) y0 = y(y0), y1 = y(y1);
        if (y1 < y0) t = y0, y0 = y1, y1 = t;
        if (y0 != yExtent[0] || y1 != yExtent[1]) yExtent = [ y0, y1 ];
      }
      return brush;
    };
    brush.clear = function() {
      if (!brush.empty()) {
        xExtent = [ 0, 0 ], yExtent = [ 0, 0 ];
        xExtentDomain = yExtentDomain = null;
      }
      return brush;
    };
    brush.empty = function() {
      return !!x && xExtent[0] == xExtent[1] || !!y && yExtent[0] == yExtent[1];
    };
    return d3.rebind(brush, event, "on");
  };
  var d3_svg_brushCursor = {
    n: "ns-resize",
    e: "ew-resize",
    s: "ns-resize",
    w: "ew-resize",
    nw: "nwse-resize",
    ne: "nesw-resize",
    se: "nwse-resize",
    sw: "nesw-resize"
  };
  var d3_svg_brushResizes = [ [ "n", "e", "s", "w", "nw", "ne", "se", "sw" ], [ "e", "w" ], [ "n", "s" ], [] ];
  var d3_time_format = d3_time.format = d3_locale_enUS.timeFormat;
  var d3_time_formatUtc = d3_time_format.utc;
  var d3_time_formatIso = d3_time_formatUtc("%Y-%m-%dT%H:%M:%S.%LZ");
  d3_time_format.iso = Date.prototype.toISOString && +new Date("2000-01-01T00:00:00.000Z") ? d3_time_formatIsoNative : d3_time_formatIso;
  function d3_time_formatIsoNative(date) {
    return date.toISOString();
  }
  d3_time_formatIsoNative.parse = function(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  };
  d3_time_formatIsoNative.toString = d3_time_formatIso.toString;
  d3_time.second = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 1e3) * 1e3);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 1e3);
  }, function(date) {
    return date.getSeconds();
  });
  d3_time.seconds = d3_time.second.range;
  d3_time.seconds.utc = d3_time.second.utc.range;
  d3_time.minute = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 6e4) * 6e4);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 6e4);
  }, function(date) {
    return date.getMinutes();
  });
  d3_time.minutes = d3_time.minute.range;
  d3_time.minutes.utc = d3_time.minute.utc.range;
  d3_time.hour = d3_time_interval(function(date) {
    var timezone = date.getTimezoneOffset() / 60;
    return new d3_date((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 36e5);
  }, function(date) {
    return date.getHours();
  });
  d3_time.hours = d3_time.hour.range;
  d3_time.hours.utc = d3_time.hour.utc.range;
  d3_time.month = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setDate(1);
    return date;
  }, function(date, offset) {
    date.setMonth(date.getMonth() + offset);
  }, function(date) {
    return date.getMonth();
  });
  d3_time.months = d3_time.month.range;
  d3_time.months.utc = d3_time.month.utc.range;
  function d3_time_scale(linear, methods, format) {
    function scale(x) {
      return linear(x);
    }
    scale.invert = function(x) {
      return d3_time_scaleDate(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return linear.domain().map(d3_time_scaleDate);
      linear.domain(x);
      return scale;
    };
    function tickMethod(extent, count) {
      var span = extent[1] - extent[0], target = span / count, i = d3.bisect(d3_time_scaleSteps, target);
      return i == d3_time_scaleSteps.length ? [ methods.year, d3_scale_linearTickRange(extent.map(function(d) {
        return d / 31536e6;
      }), count)[2] ] : !i ? [ d3_time_scaleMilliseconds, d3_scale_linearTickRange(extent, count)[2] ] : methods[target / d3_time_scaleSteps[i - 1] < d3_time_scaleSteps[i] / target ? i - 1 : i];
    }
    scale.nice = function(interval, skip) {
      var domain = scale.domain(), extent = d3_scaleExtent(domain), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" && tickMethod(extent, interval);
      if (method) interval = method[0], skip = method[1];
      function skipped(date) {
        return !isNaN(date) && !interval.range(date, d3_time_scaleDate(+date + 1), skip).length;
      }
      return scale.domain(d3_scale_nice(domain, skip > 1 ? {
        floor: function(date) {
          while (skipped(date = interval.floor(date))) date = d3_time_scaleDate(date - 1);
          return date;
        },
        ceil: function(date) {
          while (skipped(date = interval.ceil(date))) date = d3_time_scaleDate(+date + 1);
          return date;
        }
      } : interval));
    };
    scale.ticks = function(interval, skip) {
      var extent = d3_scaleExtent(scale.domain()), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" ? tickMethod(extent, interval) : !interval.range && [ {
        range: interval
      }, skip ];
      if (method) interval = method[0], skip = method[1];
      return interval.range(extent[0], d3_time_scaleDate(+extent[1] + 1), skip < 1 ? 1 : skip);
    };
    scale.tickFormat = function() {
      return format;
    };
    scale.copy = function() {
      return d3_time_scale(linear.copy(), methods, format);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_time_scaleDate(t) {
    return new Date(t);
  }
  var d3_time_scaleSteps = [ 1e3, 5e3, 15e3, 3e4, 6e4, 3e5, 9e5, 18e5, 36e5, 108e5, 216e5, 432e5, 864e5, 1728e5, 6048e5, 2592e6, 7776e6, 31536e6 ];
  var d3_time_scaleLocalMethods = [ [ d3_time.second, 1 ], [ d3_time.second, 5 ], [ d3_time.second, 15 ], [ d3_time.second, 30 ], [ d3_time.minute, 1 ], [ d3_time.minute, 5 ], [ d3_time.minute, 15 ], [ d3_time.minute, 30 ], [ d3_time.hour, 1 ], [ d3_time.hour, 3 ], [ d3_time.hour, 6 ], [ d3_time.hour, 12 ], [ d3_time.day, 1 ], [ d3_time.day, 2 ], [ d3_time.week, 1 ], [ d3_time.month, 1 ], [ d3_time.month, 3 ], [ d3_time.year, 1 ] ];
  var d3_time_scaleLocalFormat = d3_time_format.multi([ [ ".%L", function(d) {
    return d.getMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getMinutes();
  } ], [ "%I %p", function(d) {
    return d.getHours();
  } ], [ "%a %d", function(d) {
    return d.getDay() && d.getDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getDate() != 1;
  } ], [ "%B", function(d) {
    return d.getMonth();
  } ], [ "%Y", d3_true ] ]);
  var d3_time_scaleMilliseconds = {
    range: function(start, stop, step) {
      return d3.range(Math.ceil(start / step) * step, +stop, step).map(d3_time_scaleDate);
    },
    floor: d3_identity,
    ceil: d3_identity
  };
  d3_time_scaleLocalMethods.year = d3_time.year;
  d3_time.scale = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);
  };
  var d3_time_scaleUtcMethods = d3_time_scaleLocalMethods.map(function(m) {
    return [ m[0].utc, m[1] ];
  });
  var d3_time_scaleUtcFormat = d3_time_formatUtc.multi([ [ ".%L", function(d) {
    return d.getUTCMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getUTCSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getUTCMinutes();
  } ], [ "%I %p", function(d) {
    return d.getUTCHours();
  } ], [ "%a %d", function(d) {
    return d.getUTCDay() && d.getUTCDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getUTCDate() != 1;
  } ], [ "%B", function(d) {
    return d.getUTCMonth();
  } ], [ "%Y", d3_true ] ]);
  d3_time_scaleUtcMethods.year = d3_time.year.utc;
  d3_time.scale.utc = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleUtcMethods, d3_time_scaleUtcFormat);
  };
  d3.text = d3_xhrType(function(request) {
    return request.responseText;
  });
  d3.json = function(url, callback) {
    return d3_xhr(url, "application/json", d3_json, callback);
  };
  function d3_json(request) {
    return JSON.parse(request.responseText);
  }
  d3.html = function(url, callback) {
    return d3_xhr(url, "text/html", d3_html, callback);
  };
  function d3_html(request) {
    var range = d3_document.createRange();
    range.selectNode(d3_document.body);
    return range.createContextualFragment(request.responseText);
  }
  d3.xml = d3_xhrType(function(request) {
    return request.responseXML;
  });
  if (typeof define === "function" && define.amd) this.d3 = d3, define(d3); else if (typeof module === "object" && module.exports) module.exports = d3; else this.d3 = d3;
}();
},{}],"/Users/changfb/Documents/life-viz-v2/node_modules/flux/index.js":[function(require,module,exports){
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = require('./lib/Dispatcher');

},{"./lib/Dispatcher":"/Users/changfb/Documents/life-viz-v2/node_modules/flux/lib/Dispatcher.js"}],"/Users/changfb/Documents/life-viz-v2/node_modules/flux/lib/Dispatcher.js":[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * 
 * @preventMunge
 */

'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var invariant = require('fbjs/lib/invariant');

var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *   CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *         case 'city-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

var Dispatcher = (function () {
  function Dispatcher() {
    _classCallCheck(this, Dispatcher);

    this._callbacks = {};
    this._isDispatching = false;
    this._isHandled = {};
    this._isPending = {};
    this._lastID = 1;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   */

  Dispatcher.prototype.register = function register(callback) {
    var id = _prefix + this._lastID++;
    this._callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   */

  Dispatcher.prototype.unregister = function unregister(id) {
    !this._callbacks[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.unregister(...): `%s` does not map to a registered callback.', id) : invariant(false) : undefined;
    delete this._callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   */

  Dispatcher.prototype.waitFor = function waitFor(ids) {
    !this._isDispatching ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): Must be invoked while dispatching.') : invariant(false) : undefined;
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this._isPending[id]) {
        !this._isHandled[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): Circular dependency detected while ' + 'waiting for `%s`.', id) : invariant(false) : undefined;
        continue;
      }
      !this._callbacks[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): `%s` does not map to a registered callback.', id) : invariant(false) : undefined;
      this._invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   */

  Dispatcher.prototype.dispatch = function dispatch(payload) {
    !!this._isDispatching ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.') : invariant(false) : undefined;
    this._startDispatching(payload);
    try {
      for (var id in this._callbacks) {
        if (this._isPending[id]) {
          continue;
        }
        this._invokeCallback(id);
      }
    } finally {
      this._stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   */

  Dispatcher.prototype.isDispatching = function isDispatching() {
    return this._isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @internal
   */

  Dispatcher.prototype._invokeCallback = function _invokeCallback(id) {
    this._isPending[id] = true;
    this._callbacks[id](this._pendingPayload);
    this._isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @internal
   */

  Dispatcher.prototype._startDispatching = function _startDispatching(payload) {
    for (var id in this._callbacks) {
      this._isPending[id] = false;
      this._isHandled[id] = false;
    }
    this._pendingPayload = payload;
    this._isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */

  Dispatcher.prototype._stopDispatching = function _stopDispatching() {
    delete this._pendingPayload;
    this._isDispatching = false;
  };

  return Dispatcher;
})();

module.exports = Dispatcher;
}).call(this,require('_process'))

},{"_process":"/Users/changfb/Documents/life-viz-v2/node_modules/browserify/node_modules/process/browser.js","fbjs/lib/invariant":"/Users/changfb/Documents/life-viz-v2/node_modules/flux/node_modules/fbjs/lib/invariant.js"}],"/Users/changfb/Documents/life-viz-v2/node_modules/flux/node_modules/fbjs/lib/invariant.js":[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function (condition, format, a, b, c, d, e, f) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error('Invariant Violation: ' + format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;
}).call(this,require('_process'))

},{"_process":"/Users/changfb/Documents/life-viz-v2/node_modules/browserify/node_modules/process/browser.js"}],"/Users/changfb/Documents/life-viz-v2/node_modules/keymirror/index.js":[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

"use strict";

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  if (!(obj instanceof Object && !Array.isArray(obj))) {
    throw new Error('keyMirror(...): Argument must be an object.');
  }
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

},{}],"/Users/changfb/Documents/life-viz-v2/node_modules/object-assign/index.js":[function(require,module,exports){
/* eslint-disable no-unused-vars */
'use strict';
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],"/Users/changfb/Documents/life-viz-v2/src/js/components/App.js":[function(require,module,exports){
var Scroller = require('./Scroller');
var Viz = require('./Viz');

var App = React.createClass({displayName: "App",
  render: function(){
    return (
      React.createElement("div", {className: 'container'}, 
        React.createElement(Scroller, null), 
        React.createElement(Viz, null)
      )
    );
  }
});

module.exports = App;

},{"./Scroller":"/Users/changfb/Documents/life-viz-v2/src/js/components/Scroller.js","./Viz":"/Users/changfb/Documents/life-viz-v2/src/js/components/Viz.js"}],"/Users/changfb/Documents/life-viz-v2/src/js/components/Scroller.js":[function(require,module,exports){
var Actions = require('../flux/LifeVizActions');

var classNames = require('classnames');
var d3 = require('d3');

var Scroller = React.createClass({displayName: "Scroller",

  _stages: [
    {
      title: 'March 12, 2015',
      text: 'Yichen is born in Redwood City! I updated to become a DAD!',
    }, 
    {
      title: 'Jun 20, 2015',
      text: 'Yichen is offically 100 days. We had a huge party for him!',
    }, 
  ],

  _stagesPositions: [],
  _containerPosition: 0,

  getInitialState: function() {
    return {currentStage: 0};
  },

  componentDidMount: function() {
    this._getStagesPositions();
    d3.select(window).on("scroll.scroller", this._scroll);
  },

  _getStagesPositions: function() {
    var sel = this;
    d3.selectAll('.stage').each(function(d, i) {
      var top = this.getBoundingClientRect().top;
      if(i === 0) {
        startPos = top;
      }
      sel._stagesPositions.push(top - startPos);
    });
    this._containerPosition = d3.select('.scroller').node().getBoundingClientRect().top + window.pageYOffset;
  },

  _scroll: function() {
    var pos = window.pageYOffset - 10 - this._containerPosition;
    var newStage = d3.bisect(this._stagesPositions, pos);
    newStage = Math.min(this._stages.length - 1, newStage);

    if (this.state.currentStage !== newStage) {
      this.setState({currentStage: newStage});
      Actions.moveToNewStage(newStage);
    }
  },

  render: function() {
    return (
      React.createElement("div", {className: 'scroller'}, 
        
          this._stages.map(function(stage, idx) { 
            var cn = classNames({
              'stage': true,
              'transparent': this.state.currentStage !== idx,
              'last-stage': this._stages.length - 1 === idx,
            });
            return (
              React.createElement("section", {className: cn}, 
                React.createElement("div", {className: 'title'}, stage.title), 
                React.createElement("p", {className: 'main-text'}, stage.text)
              )
            );
          }.bind(this))
        
      )
    );
  }
});

module.exports = Scroller;

},{"../flux/LifeVizActions":"/Users/changfb/Documents/life-viz-v2/src/js/flux/LifeVizActions.js","classnames":"/Users/changfb/Documents/life-viz-v2/node_modules/classnames/index.js","d3":"/Users/changfb/Documents/life-viz-v2/node_modules/d3/d3.js"}],"/Users/changfb/Documents/life-viz-v2/src/js/components/Viz.js":[function(require,module,exports){
var Store = require('../flux/LifeVizDataStore');

var Viz = React.createClass({displayName: "Viz",

  getInitialState: function() {
    return {currentStage: 0};
  },

  componentDidMount: function() {
    Store.addChangeListener(this._onStageChange); 
  },

  componentWillUnmount: function() {
    Store.removeChangeListener(this._onStageChange);
  },

  _onStageChange: function() {
    this.setState({currentStage: Store.getCurrentStage()}); 
  },

  render: function(){
    return React.createElement("div", {className: 'viz'}, this.state.currentStage);
  }
});

module.exports = Viz;

},{"../flux/LifeVizDataStore":"/Users/changfb/Documents/life-viz-v2/src/js/flux/LifeVizDataStore.js"}],"/Users/changfb/Documents/life-viz-v2/src/js/flux/LifeVizActions.js":[function(require,module,exports){
var LifeVizDispatcher = require('./LifeVizDispatcher');
var LifeVizConstants = require('./LifeVizConstants');

var ActionTypes = LifeVizConstants.ActionTypes;

module.exports = {
  moveToNewStage: function(currentStage) {
    LifeVizDispatcher.dispatch({
      type: ActionTypes.MOVE_TO_NEW_STAGE,
      data: {currentStage: currentStage},
    });
  }
};

},{"./LifeVizConstants":"/Users/changfb/Documents/life-viz-v2/src/js/flux/LifeVizConstants.js","./LifeVizDispatcher":"/Users/changfb/Documents/life-viz-v2/src/js/flux/LifeVizDispatcher.js"}],"/Users/changfb/Documents/life-viz-v2/src/js/flux/LifeVizConstants.js":[function(require,module,exports){
var keyMirror = require('keymirror');

module.exports = {
  ActionTypes: keyMirror({
    MOVE_TO_NEW_STAGE: null,
  })
};

},{"keymirror":"/Users/changfb/Documents/life-viz-v2/node_modules/keymirror/index.js"}],"/Users/changfb/Documents/life-viz-v2/src/js/flux/LifeVizDataStore.js":[function(require,module,exports){
var EventEmitter = require('events').EventEmitter;
var LifeVizConstants = require('./LifeVizConstants');
var LifeVizDispatcher = require('./LifeVizDispatcher');

var assign = require('object-assign');

var ActionTypes = LifeVizConstants.ActionTypes;
var CHANGE_EVENT = 'change';

var _currentStage = 0;
var _data = [1, 2];

var LifeVizDataStore = assign({}, EventEmitter.prototype, {

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  getCurrentStage: function() {
    return _currentStage;
  },

  getCurrentStageData: function() {
    return _data[_currentStage];
  },
});

LifeVizDataStore.dispatchToken = LifeVizDispatcher.register(function(action) {

  switch(action.type) {
    case ActionTypes.MOVE_TO_NEW_STAGE:
      _currentStage = action.data.currentStage;
      LifeVizDataStore.emitChange();
      break;
    default:
      // do nothing
  }
});

module.exports = LifeVizDataStore;

},{"./LifeVizConstants":"/Users/changfb/Documents/life-viz-v2/src/js/flux/LifeVizConstants.js","./LifeVizDispatcher":"/Users/changfb/Documents/life-viz-v2/src/js/flux/LifeVizDispatcher.js","events":"/Users/changfb/Documents/life-viz-v2/node_modules/browserify/node_modules/events/events.js","object-assign":"/Users/changfb/Documents/life-viz-v2/node_modules/object-assign/index.js"}],"/Users/changfb/Documents/life-viz-v2/src/js/flux/LifeVizDispatcher.js":[function(require,module,exports){
var Dispatcher = require('flux').Dispatcher;

module.exports = new Dispatcher();

},{"flux":"/Users/changfb/Documents/life-viz-v2/node_modules/flux/index.js"}],"/Users/changfb/Documents/life-viz-v2/src/js/main.js":[function(require,module,exports){
var App = require('./components/App');

React.render(React.createElement(App, null), document.getElementById('app'));

},{"./components/App":"/Users/changfb/Documents/life-viz-v2/src/js/components/App.js"}]},{},["/Users/changfb/Documents/life-viz-v2/src/js/main.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvY2xhc3NuYW1lcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kMy9kMy5qcyIsIm5vZGVfbW9kdWxlcy9mbHV4L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZsdXgvbGliL0Rpc3BhdGNoZXIuanMiLCJub2RlX21vZHVsZXMvZmx1eC9ub2RlX21vZHVsZXMvZmJqcy9saWIvaW52YXJpYW50LmpzIiwibm9kZV9tb2R1bGVzL2tleW1pcnJvci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3QtYXNzaWduL2luZGV4LmpzIiwiL1VzZXJzL2NoYW5nZmIvRG9jdW1lbnRzL2xpZmUtdml6LXYyL3NyYy9qcy9jb21wb25lbnRzL0FwcC5qcyIsIi9Vc2Vycy9jaGFuZ2ZiL0RvY3VtZW50cy9saWZlLXZpei12Mi9zcmMvanMvY29tcG9uZW50cy9TY3JvbGxlci5qcyIsIi9Vc2Vycy9jaGFuZ2ZiL0RvY3VtZW50cy9saWZlLXZpei12Mi9zcmMvanMvY29tcG9uZW50cy9WaXouanMiLCIvVXNlcnMvY2hhbmdmYi9Eb2N1bWVudHMvbGlmZS12aXotdjIvc3JjL2pzL2ZsdXgvTGlmZVZpekFjdGlvbnMuanMiLCIvVXNlcnMvY2hhbmdmYi9Eb2N1bWVudHMvbGlmZS12aXotdjIvc3JjL2pzL2ZsdXgvTGlmZVZpekNvbnN0YW50cy5qcyIsIi9Vc2Vycy9jaGFuZ2ZiL0RvY3VtZW50cy9saWZlLXZpei12Mi9zcmMvanMvZmx1eC9MaWZlVml6RGF0YVN0b3JlLmpzIiwiL1VzZXJzL2NoYW5nZmIvRG9jdW1lbnRzL2xpZmUtdml6LXYyL3NyYy9qcy9mbHV4L0xpZmVWaXpEaXNwYXRjaGVyLmpzIiwiL1VzZXJzL2NoYW5nZmIvRG9jdW1lbnRzL2xpZmUtdml6LXYyL3NyYy9qcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzcwU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3RPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQSxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDckMsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDOztBQUUzQixJQUFJLHlCQUF5QixtQkFBQTtFQUMzQixNQUFNLEVBQUUsVUFBVTtJQUNoQjtNQUNFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUUsV0FBYSxDQUFBLEVBQUE7UUFDM0Isb0JBQUMsUUFBUSxFQUFBLElBQUEsQ0FBRyxDQUFBLEVBQUE7UUFDWixvQkFBQyxHQUFHLEVBQUEsSUFBQSxDQUFHLENBQUE7TUFDSCxDQUFBO01BQ047R0FDSDtBQUNILENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDOzs7QUNkckIsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUM7O0FBRWhELElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN2QyxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRXZCLElBQUksOEJBQThCLHdCQUFBOztFQUVoQyxPQUFPLEVBQUU7SUFDUDtNQUNFLEtBQUssRUFBRSxnQkFBZ0I7TUFDdkIsSUFBSSxFQUFFLDREQUE0RDtLQUNuRTtJQUNEO01BQ0UsS0FBSyxFQUFFLGNBQWM7TUFDckIsSUFBSSxFQUFFLDREQUE0RDtLQUNuRTtBQUNMLEdBQUc7O0VBRUQsZ0JBQWdCLEVBQUUsRUFBRTtBQUN0QixFQUFFLGtCQUFrQixFQUFFLENBQUM7O0VBRXJCLGVBQWUsRUFBRSxXQUFXO0lBQzFCLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDN0IsR0FBRzs7RUFFRCxpQkFBaUIsRUFBRSxXQUFXO0lBQzVCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0lBQzNCLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMxRCxHQUFHOztFQUVELG1CQUFtQixFQUFFLFdBQVc7SUFDOUIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO0lBQ2YsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFO01BQ3pDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLEdBQUcsQ0FBQztNQUMzQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDVixRQUFRLEdBQUcsR0FBRyxDQUFDO09BQ2hCO01BQ0QsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLENBQUM7S0FDM0MsQ0FBQyxDQUFDO0lBQ0gsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztBQUM3RyxHQUFHOztFQUVELE9BQU8sRUFBRSxXQUFXO0lBQ2xCLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxXQUFXLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztJQUM1RCxJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUN6RCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQzs7SUFFdkQsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksS0FBSyxRQUFRLEVBQUU7TUFDeEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO01BQ3hDLE9BQU8sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDbEM7QUFDTCxHQUFHOztFQUVELE1BQU0sRUFBRSxXQUFXO0lBQ2pCO01BQ0Usb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxVQUFZLENBQUEsRUFBQTtRQUN6QjtVQUNDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsS0FBSyxFQUFFLEdBQUcsRUFBRTtZQUNwQyxJQUFJLEVBQUUsR0FBRyxVQUFVLENBQUM7Y0FDbEIsT0FBTyxFQUFFLElBQUk7Y0FDYixhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEtBQUssR0FBRztjQUM5QyxZQUFZLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxLQUFLLEdBQUc7YUFDOUMsQ0FBQyxDQUFDO1lBQ0g7Y0FDRSxvQkFBQSxTQUFRLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLEVBQUksQ0FBQSxFQUFBO2dCQUN0QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLE9BQVMsQ0FBQSxFQUFDLEtBQUssQ0FBQyxLQUFZLENBQUEsRUFBQTtnQkFDNUMsb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxXQUFhLENBQUEsRUFBQyxLQUFLLENBQUMsSUFBUyxDQUFBO2NBQ25DLENBQUE7Y0FDVjtXQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNiO01BQ0csQ0FBQTtNQUNOO0dBQ0g7QUFDSCxDQUFDLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQzs7O0FDNUUxQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQzs7QUFFaEQsSUFBSSx5QkFBeUIsbUJBQUE7O0VBRTNCLGVBQWUsRUFBRSxXQUFXO0lBQzFCLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDN0IsR0FBRzs7RUFFRCxpQkFBaUIsRUFBRSxXQUFXO0lBQzVCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDakQsR0FBRzs7RUFFRCxvQkFBb0IsRUFBRSxXQUFXO0lBQy9CLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDcEQsR0FBRzs7RUFFRCxjQUFjLEVBQUUsV0FBVztJQUN6QixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDM0QsR0FBRzs7RUFFRCxNQUFNLEVBQUUsVUFBVTtJQUNoQixPQUFPLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUUsS0FBTSxDQUFFLENBQUEsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQW1CLENBQUEsQ0FBQztHQUNoRTtBQUNILENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDOzs7QUN6QnJCLElBQUksaUJBQWlCLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDdkQsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQzs7QUFFckQsSUFBSSxXQUFXLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxDQUFDOztBQUUvQyxNQUFNLENBQUMsT0FBTyxHQUFHO0VBQ2YsY0FBYyxFQUFFLFNBQVMsWUFBWSxFQUFFO0lBQ3JDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztNQUN6QixJQUFJLEVBQUUsV0FBVyxDQUFDLGlCQUFpQjtNQUNuQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDO0tBQ25DLENBQUMsQ0FBQztHQUNKO0NBQ0YsQ0FBQzs7O0FDWkYsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDOztBQUVyQyxNQUFNLENBQUMsT0FBTyxHQUFHO0VBQ2YsV0FBVyxFQUFFLFNBQVMsQ0FBQztJQUNyQixpQkFBaUIsRUFBRSxJQUFJO0dBQ3hCLENBQUM7QUFDSixDQUFDLENBQUM7OztBQ05GLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLENBQUM7QUFDbEQsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUNyRCxJQUFJLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDOztBQUV2RCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7O0FBRXRDLElBQUksV0FBVyxHQUFHLGdCQUFnQixDQUFDLFdBQVcsQ0FBQztBQUMvQyxJQUFJLFlBQVksR0FBRyxRQUFRLENBQUM7O0FBRTVCLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztBQUN0QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7QUFFbkIsSUFBSSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxTQUFTLEVBQUU7O0VBRXhELFVBQVUsRUFBRSxXQUFXO0lBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDNUIsR0FBRzs7RUFFRCxpQkFBaUIsRUFBRSxTQUFTLFFBQVEsRUFBRTtJQUNwQyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNwQyxHQUFHOztFQUVELG9CQUFvQixFQUFFLFNBQVMsUUFBUSxFQUFFO0lBQ3ZDLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ2hELEdBQUc7O0VBRUQsZUFBZSxFQUFFLFdBQVc7SUFDMUIsT0FBTyxhQUFhLENBQUM7QUFDekIsR0FBRzs7RUFFRCxtQkFBbUIsRUFBRSxXQUFXO0lBQzlCLE9BQU8sS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0dBQzdCO0FBQ0gsQ0FBQyxDQUFDLENBQUM7O0FBRUgsZ0JBQWdCLENBQUMsYUFBYSxHQUFHLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxTQUFTLE1BQU0sRUFBRTs7RUFFM0UsT0FBTyxNQUFNLENBQUMsSUFBSTtJQUNoQixLQUFLLFdBQVcsQ0FBQyxpQkFBaUI7TUFDaEMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO01BQ3pDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDO01BQzlCLE1BQU07QUFDWixJQUFJLFFBQVE7O0dBRVQ7QUFDSCxDQUFDLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLGdCQUFnQixDQUFDOzs7QUMvQ2xDLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxVQUFVLENBQUM7O0FBRTVDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQzs7O0FDRmxDLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDOztBQUV0QyxLQUFLLENBQUMsTUFBTSxDQUFDLG9CQUFDLEdBQUcsRUFBQSxJQUFBLENBQUcsQ0FBQSxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8qIVxuICBDb3B5cmlnaHQgKGMpIDIwMTUgSmVkIFdhdHNvbi5cbiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIChNSVQpLCBzZWVcbiAgaHR0cDovL2plZHdhdHNvbi5naXRodWIuaW8vY2xhc3NuYW1lc1xuKi9cbi8qIGdsb2JhbCBkZWZpbmUgKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBoYXNPd24gPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuXHRmdW5jdGlvbiBjbGFzc05hbWVzICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9ICcnO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoIWFyZykgY29udGludWU7XG5cblx0XHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdFx0aWYgKGFyZ1R5cGUgPT09ICdzdHJpbmcnIHx8IGFyZ1R5cGUgPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdGNsYXNzZXMgKz0gJyAnICsgYXJnO1xuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcblx0XHRcdFx0Y2xhc3NlcyArPSAnICcgKyBjbGFzc05hbWVzLmFwcGx5KG51bGwsIGFyZyk7XG5cdFx0XHR9IGVsc2UgaWYgKGFyZ1R5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdFx0XHRpZiAoaGFzT3duLmNhbGwoYXJnLCBrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzICs9ICcgJyArIGtleTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY2xhc3Nlcy5zdWJzdHIoMSk7XG5cdH1cblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGNsYXNzTmFtZXM7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIHJlZ2lzdGVyIGFzICdjbGFzc25hbWVzJywgY29uc2lzdGVudCB3aXRoIG5wbSBwYWNrYWdlIG5hbWVcblx0XHRkZWZpbmUoJ2NsYXNzbmFtZXMnLCBbXSwgZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGNsYXNzTmFtZXM7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LmNsYXNzTmFtZXMgPSBjbGFzc05hbWVzO1xuXHR9XG59KCkpO1xuIiwiIWZ1bmN0aW9uKCkge1xuICB2YXIgZDMgPSB7XG4gICAgdmVyc2lvbjogXCIzLjUuMTBcIlxuICB9O1xuICB2YXIgZDNfYXJyYXlTbGljZSA9IFtdLnNsaWNlLCBkM19hcnJheSA9IGZ1bmN0aW9uKGxpc3QpIHtcbiAgICByZXR1cm4gZDNfYXJyYXlTbGljZS5jYWxsKGxpc3QpO1xuICB9O1xuICB2YXIgZDNfZG9jdW1lbnQgPSB0aGlzLmRvY3VtZW50O1xuICBmdW5jdGlvbiBkM19kb2N1bWVudEVsZW1lbnQobm9kZSkge1xuICAgIHJldHVybiBub2RlICYmIChub2RlLm93bmVyRG9jdW1lbnQgfHwgbm9kZS5kb2N1bWVudCB8fCBub2RlKS5kb2N1bWVudEVsZW1lbnQ7XG4gIH1cbiAgZnVuY3Rpb24gZDNfd2luZG93KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZSAmJiAobm9kZS5vd25lckRvY3VtZW50ICYmIG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0VmlldyB8fCBub2RlLmRvY3VtZW50ICYmIG5vZGUgfHwgbm9kZS5kZWZhdWx0Vmlldyk7XG4gIH1cbiAgaWYgKGQzX2RvY3VtZW50KSB7XG4gICAgdHJ5IHtcbiAgICAgIGQzX2FycmF5KGQzX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jaGlsZE5vZGVzKVswXS5ub2RlVHlwZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBkM19hcnJheSA9IGZ1bmN0aW9uKGxpc3QpIHtcbiAgICAgICAgdmFyIGkgPSBsaXN0Lmxlbmd0aCwgYXJyYXkgPSBuZXcgQXJyYXkoaSk7XG4gICAgICAgIHdoaWxlIChpLS0pIGFycmF5W2ldID0gbGlzdFtpXTtcbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgaWYgKCFEYXRlLm5vdykgRGF0ZS5ub3cgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gK25ldyBEYXRlKCk7XG4gIH07XG4gIGlmIChkM19kb2N1bWVudCkge1xuICAgIHRyeSB7XG4gICAgICBkM19kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpLnN0eWxlLnNldFByb3BlcnR5KFwib3BhY2l0eVwiLCAwLCBcIlwiKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdmFyIGQzX2VsZW1lbnRfcHJvdG90eXBlID0gdGhpcy5FbGVtZW50LnByb3RvdHlwZSwgZDNfZWxlbWVudF9zZXRBdHRyaWJ1dGUgPSBkM19lbGVtZW50X3Byb3RvdHlwZS5zZXRBdHRyaWJ1dGUsIGQzX2VsZW1lbnRfc2V0QXR0cmlidXRlTlMgPSBkM19lbGVtZW50X3Byb3RvdHlwZS5zZXRBdHRyaWJ1dGVOUywgZDNfc3R5bGVfcHJvdG90eXBlID0gdGhpcy5DU1NTdHlsZURlY2xhcmF0aW9uLnByb3RvdHlwZSwgZDNfc3R5bGVfc2V0UHJvcGVydHkgPSBkM19zdHlsZV9wcm90b3R5cGUuc2V0UHJvcGVydHk7XG4gICAgICBkM19lbGVtZW50X3Byb3RvdHlwZS5zZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgICBkM19lbGVtZW50X3NldEF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUsIHZhbHVlICsgXCJcIik7XG4gICAgICB9O1xuICAgICAgZDNfZWxlbWVudF9wcm90b3R5cGUuc2V0QXR0cmlidXRlTlMgPSBmdW5jdGlvbihzcGFjZSwgbG9jYWwsIHZhbHVlKSB7XG4gICAgICAgIGQzX2VsZW1lbnRfc2V0QXR0cmlidXRlTlMuY2FsbCh0aGlzLCBzcGFjZSwgbG9jYWwsIHZhbHVlICsgXCJcIik7XG4gICAgICB9O1xuICAgICAgZDNfc3R5bGVfcHJvdG90eXBlLnNldFByb3BlcnR5ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIHByaW9yaXR5KSB7XG4gICAgICAgIGQzX3N0eWxlX3NldFByb3BlcnR5LmNhbGwodGhpcywgbmFtZSwgdmFsdWUgKyBcIlwiLCBwcmlvcml0eSk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuICBkMy5hc2NlbmRpbmcgPSBkM19hc2NlbmRpbmc7XG4gIGZ1bmN0aW9uIGQzX2FzY2VuZGluZyhhLCBiKSB7XG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiBhID49IGIgPyAwIDogTmFOO1xuICB9XG4gIGQzLmRlc2NlbmRpbmcgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGIgPCBhID8gLTEgOiBiID4gYSA/IDEgOiBiID49IGEgPyAwIDogTmFOO1xuICB9O1xuICBkMy5taW4gPSBmdW5jdGlvbihhcnJheSwgZikge1xuICAgIHZhciBpID0gLTEsIG4gPSBhcnJheS5sZW5ndGgsIGEsIGI7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSBpZiAoKGIgPSBhcnJheVtpXSkgIT0gbnVsbCAmJiBiID49IGIpIHtcbiAgICAgICAgYSA9IGI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgd2hpbGUgKCsraSA8IG4pIGlmICgoYiA9IGFycmF5W2ldKSAhPSBudWxsICYmIGEgPiBiKSBhID0gYjtcbiAgICB9IGVsc2Uge1xuICAgICAgd2hpbGUgKCsraSA8IG4pIGlmICgoYiA9IGYuY2FsbChhcnJheSwgYXJyYXlbaV0sIGkpKSAhPSBudWxsICYmIGIgPj0gYikge1xuICAgICAgICBhID0gYjtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB3aGlsZSAoKytpIDwgbikgaWYgKChiID0gZi5jYWxsKGFycmF5LCBhcnJheVtpXSwgaSkpICE9IG51bGwgJiYgYSA+IGIpIGEgPSBiO1xuICAgIH1cbiAgICByZXR1cm4gYTtcbiAgfTtcbiAgZDMubWF4ID0gZnVuY3Rpb24oYXJyYXksIGYpIHtcbiAgICB2YXIgaSA9IC0xLCBuID0gYXJyYXkubGVuZ3RoLCBhLCBiO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICB3aGlsZSAoKytpIDwgbikgaWYgKChiID0gYXJyYXlbaV0pICE9IG51bGwgJiYgYiA+PSBiKSB7XG4gICAgICAgIGEgPSBiO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHdoaWxlICgrK2kgPCBuKSBpZiAoKGIgPSBhcnJheVtpXSkgIT0gbnVsbCAmJiBiID4gYSkgYSA9IGI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSBpZiAoKGIgPSBmLmNhbGwoYXJyYXksIGFycmF5W2ldLCBpKSkgIT0gbnVsbCAmJiBiID49IGIpIHtcbiAgICAgICAgYSA9IGI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgd2hpbGUgKCsraSA8IG4pIGlmICgoYiA9IGYuY2FsbChhcnJheSwgYXJyYXlbaV0sIGkpKSAhPSBudWxsICYmIGIgPiBhKSBhID0gYjtcbiAgICB9XG4gICAgcmV0dXJuIGE7XG4gIH07XG4gIGQzLmV4dGVudCA9IGZ1bmN0aW9uKGFycmF5LCBmKSB7XG4gICAgdmFyIGkgPSAtMSwgbiA9IGFycmF5Lmxlbmd0aCwgYSwgYiwgYztcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgd2hpbGUgKCsraSA8IG4pIGlmICgoYiA9IGFycmF5W2ldKSAhPSBudWxsICYmIGIgPj0gYikge1xuICAgICAgICBhID0gYyA9IGI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgd2hpbGUgKCsraSA8IG4pIGlmICgoYiA9IGFycmF5W2ldKSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChhID4gYikgYSA9IGI7XG4gICAgICAgIGlmIChjIDwgYikgYyA9IGI7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSBpZiAoKGIgPSBmLmNhbGwoYXJyYXksIGFycmF5W2ldLCBpKSkgIT0gbnVsbCAmJiBiID49IGIpIHtcbiAgICAgICAgYSA9IGMgPSBiO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHdoaWxlICgrK2kgPCBuKSBpZiAoKGIgPSBmLmNhbGwoYXJyYXksIGFycmF5W2ldLCBpKSkgIT0gbnVsbCkge1xuICAgICAgICBpZiAoYSA+IGIpIGEgPSBiO1xuICAgICAgICBpZiAoYyA8IGIpIGMgPSBiO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gWyBhLCBjIF07XG4gIH07XG4gIGZ1bmN0aW9uIGQzX251bWJlcih4KSB7XG4gICAgcmV0dXJuIHggPT09IG51bGwgPyBOYU4gOiAreDtcbiAgfVxuICBmdW5jdGlvbiBkM19udW1lcmljKHgpIHtcbiAgICByZXR1cm4gIWlzTmFOKHgpO1xuICB9XG4gIGQzLnN1bSA9IGZ1bmN0aW9uKGFycmF5LCBmKSB7XG4gICAgdmFyIHMgPSAwLCBuID0gYXJyYXkubGVuZ3RoLCBhLCBpID0gLTE7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSBpZiAoZDNfbnVtZXJpYyhhID0gK2FycmF5W2ldKSkgcyArPSBhO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAoKytpIDwgbikgaWYgKGQzX251bWVyaWMoYSA9ICtmLmNhbGwoYXJyYXksIGFycmF5W2ldLCBpKSkpIHMgKz0gYTtcbiAgICB9XG4gICAgcmV0dXJuIHM7XG4gIH07XG4gIGQzLm1lYW4gPSBmdW5jdGlvbihhcnJheSwgZikge1xuICAgIHZhciBzID0gMCwgbiA9IGFycmF5Lmxlbmd0aCwgYSwgaSA9IC0xLCBqID0gbjtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgd2hpbGUgKCsraSA8IG4pIGlmIChkM19udW1lcmljKGEgPSBkM19udW1iZXIoYXJyYXlbaV0pKSkgcyArPSBhOyBlbHNlIC0tajtcbiAgICB9IGVsc2Uge1xuICAgICAgd2hpbGUgKCsraSA8IG4pIGlmIChkM19udW1lcmljKGEgPSBkM19udW1iZXIoZi5jYWxsKGFycmF5LCBhcnJheVtpXSwgaSkpKSkgcyArPSBhOyBlbHNlIC0tajtcbiAgICB9XG4gICAgaWYgKGopIHJldHVybiBzIC8gajtcbiAgfTtcbiAgZDMucXVhbnRpbGUgPSBmdW5jdGlvbih2YWx1ZXMsIHApIHtcbiAgICB2YXIgSCA9ICh2YWx1ZXMubGVuZ3RoIC0gMSkgKiBwICsgMSwgaCA9IE1hdGguZmxvb3IoSCksIHYgPSArdmFsdWVzW2ggLSAxXSwgZSA9IEggLSBoO1xuICAgIHJldHVybiBlID8gdiArIGUgKiAodmFsdWVzW2hdIC0gdikgOiB2O1xuICB9O1xuICBkMy5tZWRpYW4gPSBmdW5jdGlvbihhcnJheSwgZikge1xuICAgIHZhciBudW1iZXJzID0gW10sIG4gPSBhcnJheS5sZW5ndGgsIGEsIGkgPSAtMTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgd2hpbGUgKCsraSA8IG4pIGlmIChkM19udW1lcmljKGEgPSBkM19udW1iZXIoYXJyYXlbaV0pKSkgbnVtYmVycy5wdXNoKGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAoKytpIDwgbikgaWYgKGQzX251bWVyaWMoYSA9IGQzX251bWJlcihmLmNhbGwoYXJyYXksIGFycmF5W2ldLCBpKSkpKSBudW1iZXJzLnB1c2goYSk7XG4gICAgfVxuICAgIGlmIChudW1iZXJzLmxlbmd0aCkgcmV0dXJuIGQzLnF1YW50aWxlKG51bWJlcnMuc29ydChkM19hc2NlbmRpbmcpLCAuNSk7XG4gIH07XG4gIGQzLnZhcmlhbmNlID0gZnVuY3Rpb24oYXJyYXksIGYpIHtcbiAgICB2YXIgbiA9IGFycmF5Lmxlbmd0aCwgbSA9IDAsIGEsIGQsIHMgPSAwLCBpID0gLTEsIGogPSAwO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICBpZiAoZDNfbnVtZXJpYyhhID0gZDNfbnVtYmVyKGFycmF5W2ldKSkpIHtcbiAgICAgICAgICBkID0gYSAtIG07XG4gICAgICAgICAgbSArPSBkIC8gKytqO1xuICAgICAgICAgIHMgKz0gZCAqIChhIC0gbSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgICAgaWYgKGQzX251bWVyaWMoYSA9IGQzX251bWJlcihmLmNhbGwoYXJyYXksIGFycmF5W2ldLCBpKSkpKSB7XG4gICAgICAgICAgZCA9IGEgLSBtO1xuICAgICAgICAgIG0gKz0gZCAvICsrajtcbiAgICAgICAgICBzICs9IGQgKiAoYSAtIG0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChqID4gMSkgcmV0dXJuIHMgLyAoaiAtIDEpO1xuICB9O1xuICBkMy5kZXZpYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdiA9IGQzLnZhcmlhbmNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIHYgPyBNYXRoLnNxcnQodikgOiB2O1xuICB9O1xuICBmdW5jdGlvbiBkM19iaXNlY3Rvcihjb21wYXJlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxlZnQ6IGZ1bmN0aW9uKGEsIHgsIGxvLCBoaSkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIGxvID0gMDtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCA0KSBoaSA9IGEubGVuZ3RoO1xuICAgICAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgICAgICAgIGlmIChjb21wYXJlKGFbbWlkXSwgeCkgPCAwKSBsbyA9IG1pZCArIDE7IGVsc2UgaGkgPSBtaWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxvO1xuICAgICAgfSxcbiAgICAgIHJpZ2h0OiBmdW5jdGlvbihhLCB4LCBsbywgaGkpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSBsbyA9IDA7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgNCkgaGkgPSBhLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgICAgICBpZiAoY29tcGFyZShhW21pZF0sIHgpID4gMCkgaGkgPSBtaWQ7IGVsc2UgbG8gPSBtaWQgKyAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsbztcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIHZhciBkM19iaXNlY3QgPSBkM19iaXNlY3RvcihkM19hc2NlbmRpbmcpO1xuICBkMy5iaXNlY3RMZWZ0ID0gZDNfYmlzZWN0LmxlZnQ7XG4gIGQzLmJpc2VjdCA9IGQzLmJpc2VjdFJpZ2h0ID0gZDNfYmlzZWN0LnJpZ2h0O1xuICBkMy5iaXNlY3RvciA9IGZ1bmN0aW9uKGYpIHtcbiAgICByZXR1cm4gZDNfYmlzZWN0b3IoZi5sZW5ndGggPT09IDEgPyBmdW5jdGlvbihkLCB4KSB7XG4gICAgICByZXR1cm4gZDNfYXNjZW5kaW5nKGYoZCksIHgpO1xuICAgIH0gOiBmKTtcbiAgfTtcbiAgZDMuc2h1ZmZsZSA9IGZ1bmN0aW9uKGFycmF5LCBpMCwgaTEpIHtcbiAgICBpZiAoKG0gPSBhcmd1bWVudHMubGVuZ3RoKSA8IDMpIHtcbiAgICAgIGkxID0gYXJyYXkubGVuZ3RoO1xuICAgICAgaWYgKG0gPCAyKSBpMCA9IDA7XG4gICAgfVxuICAgIHZhciBtID0gaTEgLSBpMCwgdCwgaTtcbiAgICB3aGlsZSAobSkge1xuICAgICAgaSA9IE1hdGgucmFuZG9tKCkgKiBtLS0gfCAwO1xuICAgICAgdCA9IGFycmF5W20gKyBpMF0sIGFycmF5W20gKyBpMF0gPSBhcnJheVtpICsgaTBdLCBhcnJheVtpICsgaTBdID0gdDtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xuICB9O1xuICBkMy5wZXJtdXRlID0gZnVuY3Rpb24oYXJyYXksIGluZGV4ZXMpIHtcbiAgICB2YXIgaSA9IGluZGV4ZXMubGVuZ3RoLCBwZXJtdXRlcyA9IG5ldyBBcnJheShpKTtcbiAgICB3aGlsZSAoaS0tKSBwZXJtdXRlc1tpXSA9IGFycmF5W2luZGV4ZXNbaV1dO1xuICAgIHJldHVybiBwZXJtdXRlcztcbiAgfTtcbiAgZDMucGFpcnMgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciBpID0gMCwgbiA9IGFycmF5Lmxlbmd0aCAtIDEsIHAwLCBwMSA9IGFycmF5WzBdLCBwYWlycyA9IG5ldyBBcnJheShuIDwgMCA/IDAgOiBuKTtcbiAgICB3aGlsZSAoaSA8IG4pIHBhaXJzW2ldID0gWyBwMCA9IHAxLCBwMSA9IGFycmF5WysraV0gXTtcbiAgICByZXR1cm4gcGFpcnM7XG4gIH07XG4gIGQzLnppcCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghKG4gPSBhcmd1bWVudHMubGVuZ3RoKSkgcmV0dXJuIFtdO1xuICAgIGZvciAodmFyIGkgPSAtMSwgbSA9IGQzLm1pbihhcmd1bWVudHMsIGQzX3ppcExlbmd0aCksIHppcHMgPSBuZXcgQXJyYXkobSk7ICsraSA8IG07ICkge1xuICAgICAgZm9yICh2YXIgaiA9IC0xLCBuLCB6aXAgPSB6aXBzW2ldID0gbmV3IEFycmF5KG4pOyArK2ogPCBuOyApIHtcbiAgICAgICAgemlwW2pdID0gYXJndW1lbnRzW2pdW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gemlwcztcbiAgfTtcbiAgZnVuY3Rpb24gZDNfemlwTGVuZ3RoKGQpIHtcbiAgICByZXR1cm4gZC5sZW5ndGg7XG4gIH1cbiAgZDMudHJhbnNwb3NlID0gZnVuY3Rpb24obWF0cml4KSB7XG4gICAgcmV0dXJuIGQzLnppcC5hcHBseShkMywgbWF0cml4KTtcbiAgfTtcbiAgZDMua2V5cyA9IGZ1bmN0aW9uKG1hcCkge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG1hcCkga2V5cy5wdXNoKGtleSk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG4gIGQzLnZhbHVlcyA9IGZ1bmN0aW9uKG1hcCkge1xuICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gbWFwKSB2YWx1ZXMucHVzaChtYXBba2V5XSk7XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcbiAgZDMuZW50cmllcyA9IGZ1bmN0aW9uKG1hcCkge1xuICAgIHZhciBlbnRyaWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG1hcCkgZW50cmllcy5wdXNoKHtcbiAgICAgIGtleToga2V5LFxuICAgICAgdmFsdWU6IG1hcFtrZXldXG4gICAgfSk7XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH07XG4gIGQzLm1lcmdlID0gZnVuY3Rpb24oYXJyYXlzKSB7XG4gICAgdmFyIG4gPSBhcnJheXMubGVuZ3RoLCBtLCBpID0gLTEsIGogPSAwLCBtZXJnZWQsIGFycmF5O1xuICAgIHdoaWxlICgrK2kgPCBuKSBqICs9IGFycmF5c1tpXS5sZW5ndGg7XG4gICAgbWVyZ2VkID0gbmV3IEFycmF5KGopO1xuICAgIHdoaWxlICgtLW4gPj0gMCkge1xuICAgICAgYXJyYXkgPSBhcnJheXNbbl07XG4gICAgICBtID0gYXJyYXkubGVuZ3RoO1xuICAgICAgd2hpbGUgKC0tbSA+PSAwKSB7XG4gICAgICAgIG1lcmdlZFstLWpdID0gYXJyYXlbbV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXJnZWQ7XG4gIH07XG4gIHZhciBhYnMgPSBNYXRoLmFicztcbiAgZDMucmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgICAgc3RlcCA9IDE7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgc3RvcCA9IHN0YXJ0O1xuICAgICAgICBzdGFydCA9IDA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXAgPT09IEluZmluaXR5KSB0aHJvdyBuZXcgRXJyb3IoXCJpbmZpbml0ZSByYW5nZVwiKTtcbiAgICB2YXIgcmFuZ2UgPSBbXSwgayA9IGQzX3JhbmdlX2ludGVnZXJTY2FsZShhYnMoc3RlcCkpLCBpID0gLTEsIGo7XG4gICAgc3RhcnQgKj0gaywgc3RvcCAqPSBrLCBzdGVwICo9IGs7XG4gICAgaWYgKHN0ZXAgPCAwKSB3aGlsZSAoKGogPSBzdGFydCArIHN0ZXAgKiArK2kpID4gc3RvcCkgcmFuZ2UucHVzaChqIC8gayk7IGVsc2Ugd2hpbGUgKChqID0gc3RhcnQgKyBzdGVwICogKytpKSA8IHN0b3ApIHJhbmdlLnB1c2goaiAvIGspO1xuICAgIHJldHVybiByYW5nZTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfcmFuZ2VfaW50ZWdlclNjYWxlKHgpIHtcbiAgICB2YXIgayA9IDE7XG4gICAgd2hpbGUgKHggKiBrICUgMSkgayAqPSAxMDtcbiAgICByZXR1cm4gaztcbiAgfVxuICBmdW5jdGlvbiBkM19jbGFzcyhjdG9yLCBwcm9wZXJ0aWVzKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHByb3BlcnRpZXMpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLnByb3RvdHlwZSwga2V5LCB7XG4gICAgICAgIHZhbHVlOiBwcm9wZXJ0aWVzW2tleV0sXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgZDMubWFwID0gZnVuY3Rpb24ob2JqZWN0LCBmKSB7XG4gICAgdmFyIG1hcCA9IG5ldyBkM19NYXAoKTtcbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgZDNfTWFwKSB7XG4gICAgICBvYmplY3QuZm9yRWFjaChmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgIG1hcC5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0KSkge1xuICAgICAgdmFyIGkgPSAtMSwgbiA9IG9iamVjdC5sZW5ndGgsIG87XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkgd2hpbGUgKCsraSA8IG4pIG1hcC5zZXQoaSwgb2JqZWN0W2ldKTsgZWxzZSB3aGlsZSAoKytpIDwgbikgbWFwLnNldChmLmNhbGwob2JqZWN0LCBvID0gb2JqZWN0W2ldLCBpKSwgbyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIG1hcC5zZXQoa2V5LCBvYmplY3Rba2V5XSk7XG4gICAgfVxuICAgIHJldHVybiBtYXA7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX01hcCgpIHtcbiAgICB0aGlzLl8gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB9XG4gIHZhciBkM19tYXBfcHJvdG8gPSBcIl9fcHJvdG9fX1wiLCBkM19tYXBfemVybyA9IFwiXFx4MDBcIjtcbiAgZDNfY2xhc3MoZDNfTWFwLCB7XG4gICAgaGFzOiBkM19tYXBfaGFzLFxuICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gdGhpcy5fW2QzX21hcF9lc2NhcGUoa2V5KV07XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9bZDNfbWFwX2VzY2FwZShrZXkpXSA9IHZhbHVlO1xuICAgIH0sXG4gICAgcmVtb3ZlOiBkM19tYXBfcmVtb3ZlLFxuICAgIGtleXM6IGQzX21hcF9rZXlzLFxuICAgIHZhbHVlczogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fKSB2YWx1ZXMucHVzaCh0aGlzLl9ba2V5XSk7XG4gICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH0sXG4gICAgZW50cmllczogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZW50cmllcyA9IFtdO1xuICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuXykgZW50cmllcy5wdXNoKHtcbiAgICAgICAga2V5OiBkM19tYXBfdW5lc2NhcGUoa2V5KSxcbiAgICAgICAgdmFsdWU6IHRoaXMuX1trZXldXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBlbnRyaWVzO1xuICAgIH0sXG4gICAgc2l6ZTogZDNfbWFwX3NpemUsXG4gICAgZW1wdHk6IGQzX21hcF9lbXB0eSxcbiAgICBmb3JFYWNoOiBmdW5jdGlvbihmKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fKSBmLmNhbGwodGhpcywgZDNfbWFwX3VuZXNjYXBlKGtleSksIHRoaXMuX1trZXldKTtcbiAgICB9XG4gIH0pO1xuICBmdW5jdGlvbiBkM19tYXBfZXNjYXBlKGtleSkge1xuICAgIHJldHVybiAoa2V5ICs9IFwiXCIpID09PSBkM19tYXBfcHJvdG8gfHwga2V5WzBdID09PSBkM19tYXBfemVybyA/IGQzX21hcF96ZXJvICsga2V5IDoga2V5O1xuICB9XG4gIGZ1bmN0aW9uIGQzX21hcF91bmVzY2FwZShrZXkpIHtcbiAgICByZXR1cm4gKGtleSArPSBcIlwiKVswXSA9PT0gZDNfbWFwX3plcm8gPyBrZXkuc2xpY2UoMSkgOiBrZXk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbWFwX2hhcyhrZXkpIHtcbiAgICByZXR1cm4gZDNfbWFwX2VzY2FwZShrZXkpIGluIHRoaXMuXztcbiAgfVxuICBmdW5jdGlvbiBkM19tYXBfcmVtb3ZlKGtleSkge1xuICAgIHJldHVybiAoa2V5ID0gZDNfbWFwX2VzY2FwZShrZXkpKSBpbiB0aGlzLl8gJiYgZGVsZXRlIHRoaXMuX1trZXldO1xuICB9XG4gIGZ1bmN0aW9uIGQzX21hcF9rZXlzKCkge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMuXykga2V5cy5wdXNoKGQzX21hcF91bmVzY2FwZShrZXkpKTtcbiAgICByZXR1cm4ga2V5cztcbiAgfVxuICBmdW5jdGlvbiBkM19tYXBfc2l6ZSgpIHtcbiAgICB2YXIgc2l6ZSA9IDA7XG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMuXykgKytzaXplO1xuICAgIHJldHVybiBzaXplO1xuICB9XG4gIGZ1bmN0aW9uIGQzX21hcF9lbXB0eSgpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgZDMubmVzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXN0ID0ge30sIGtleXMgPSBbXSwgc29ydEtleXMgPSBbXSwgc29ydFZhbHVlcywgcm9sbHVwO1xuICAgIGZ1bmN0aW9uIG1hcChtYXBUeXBlLCBhcnJheSwgZGVwdGgpIHtcbiAgICAgIGlmIChkZXB0aCA+PSBrZXlzLmxlbmd0aCkgcmV0dXJuIHJvbGx1cCA/IHJvbGx1cC5jYWxsKG5lc3QsIGFycmF5KSA6IHNvcnRWYWx1ZXMgPyBhcnJheS5zb3J0KHNvcnRWYWx1ZXMpIDogYXJyYXk7XG4gICAgICB2YXIgaSA9IC0xLCBuID0gYXJyYXkubGVuZ3RoLCBrZXkgPSBrZXlzW2RlcHRoKytdLCBrZXlWYWx1ZSwgb2JqZWN0LCBzZXR0ZXIsIHZhbHVlc0J5S2V5ID0gbmV3IGQzX01hcCgpLCB2YWx1ZXM7XG4gICAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICBpZiAodmFsdWVzID0gdmFsdWVzQnlLZXkuZ2V0KGtleVZhbHVlID0ga2V5KG9iamVjdCA9IGFycmF5W2ldKSkpIHtcbiAgICAgICAgICB2YWx1ZXMucHVzaChvYmplY3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlc0J5S2V5LnNldChrZXlWYWx1ZSwgWyBvYmplY3QgXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChtYXBUeXBlKSB7XG4gICAgICAgIG9iamVjdCA9IG1hcFR5cGUoKTtcbiAgICAgICAgc2V0dGVyID0gZnVuY3Rpb24oa2V5VmFsdWUsIHZhbHVlcykge1xuICAgICAgICAgIG9iamVjdC5zZXQoa2V5VmFsdWUsIG1hcChtYXBUeXBlLCB2YWx1ZXMsIGRlcHRoKSk7XG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvYmplY3QgPSB7fTtcbiAgICAgICAgc2V0dGVyID0gZnVuY3Rpb24oa2V5VmFsdWUsIHZhbHVlcykge1xuICAgICAgICAgIG9iamVjdFtrZXlWYWx1ZV0gPSBtYXAobWFwVHlwZSwgdmFsdWVzLCBkZXB0aCk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICB2YWx1ZXNCeUtleS5mb3JFYWNoKHNldHRlcik7XG4gICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBlbnRyaWVzKG1hcCwgZGVwdGgpIHtcbiAgICAgIGlmIChkZXB0aCA+PSBrZXlzLmxlbmd0aCkgcmV0dXJuIG1hcDtcbiAgICAgIHZhciBhcnJheSA9IFtdLCBzb3J0S2V5ID0gc29ydEtleXNbZGVwdGgrK107XG4gICAgICBtYXAuZm9yRWFjaChmdW5jdGlvbihrZXksIGtleU1hcCkge1xuICAgICAgICBhcnJheS5wdXNoKHtcbiAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICB2YWx1ZXM6IGVudHJpZXMoa2V5TWFwLCBkZXB0aClcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBzb3J0S2V5ID8gYXJyYXkuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHJldHVybiBzb3J0S2V5KGEua2V5LCBiLmtleSk7XG4gICAgICB9KSA6IGFycmF5O1xuICAgIH1cbiAgICBuZXN0Lm1hcCA9IGZ1bmN0aW9uKGFycmF5LCBtYXBUeXBlKSB7XG4gICAgICByZXR1cm4gbWFwKG1hcFR5cGUsIGFycmF5LCAwKTtcbiAgICB9O1xuICAgIG5lc3QuZW50cmllcyA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgICByZXR1cm4gZW50cmllcyhtYXAoZDMubWFwLCBhcnJheSwgMCksIDApO1xuICAgIH07XG4gICAgbmVzdC5rZXkgPSBmdW5jdGlvbihkKSB7XG4gICAgICBrZXlzLnB1c2goZCk7XG4gICAgICByZXR1cm4gbmVzdDtcbiAgICB9O1xuICAgIG5lc3Quc29ydEtleXMgPSBmdW5jdGlvbihvcmRlcikge1xuICAgICAgc29ydEtleXNba2V5cy5sZW5ndGggLSAxXSA9IG9yZGVyO1xuICAgICAgcmV0dXJuIG5lc3Q7XG4gICAgfTtcbiAgICBuZXN0LnNvcnRWYWx1ZXMgPSBmdW5jdGlvbihvcmRlcikge1xuICAgICAgc29ydFZhbHVlcyA9IG9yZGVyO1xuICAgICAgcmV0dXJuIG5lc3Q7XG4gICAgfTtcbiAgICBuZXN0LnJvbGx1cCA9IGZ1bmN0aW9uKGYpIHtcbiAgICAgIHJvbGx1cCA9IGY7XG4gICAgICByZXR1cm4gbmVzdDtcbiAgICB9O1xuICAgIHJldHVybiBuZXN0O1xuICB9O1xuICBkMy5zZXQgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciBzZXQgPSBuZXcgZDNfU2V0KCk7XG4gICAgaWYgKGFycmF5KSBmb3IgKHZhciBpID0gMCwgbiA9IGFycmF5Lmxlbmd0aDsgaSA8IG47ICsraSkgc2V0LmFkZChhcnJheVtpXSk7XG4gICAgcmV0dXJuIHNldDtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfU2V0KCkge1xuICAgIHRoaXMuXyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIH1cbiAgZDNfY2xhc3MoZDNfU2V0LCB7XG4gICAgaGFzOiBkM19tYXBfaGFzLFxuICAgIGFkZDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICB0aGlzLl9bZDNfbWFwX2VzY2FwZShrZXkgKz0gXCJcIildID0gdHJ1ZTtcbiAgICAgIHJldHVybiBrZXk7XG4gICAgfSxcbiAgICByZW1vdmU6IGQzX21hcF9yZW1vdmUsXG4gICAgdmFsdWVzOiBkM19tYXBfa2V5cyxcbiAgICBzaXplOiBkM19tYXBfc2l6ZSxcbiAgICBlbXB0eTogZDNfbWFwX2VtcHR5LFxuICAgIGZvckVhY2g6IGZ1bmN0aW9uKGYpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl8pIGYuY2FsbCh0aGlzLCBkM19tYXBfdW5lc2NhcGUoa2V5KSk7XG4gICAgfVxuICB9KTtcbiAgZDMuYmVoYXZpb3IgPSB7fTtcbiAgZnVuY3Rpb24gZDNfaWRlbnRpdHkoZCkge1xuICAgIHJldHVybiBkO1xuICB9XG4gIGQzLnJlYmluZCA9IGZ1bmN0aW9uKHRhcmdldCwgc291cmNlKSB7XG4gICAgdmFyIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aCwgbWV0aG9kO1xuICAgIHdoaWxlICgrK2kgPCBuKSB0YXJnZXRbbWV0aG9kID0gYXJndW1lbnRzW2ldXSA9IGQzX3JlYmluZCh0YXJnZXQsIHNvdXJjZSwgc291cmNlW21ldGhvZF0pO1xuICAgIHJldHVybiB0YXJnZXQ7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3JlYmluZCh0YXJnZXQsIHNvdXJjZSwgbWV0aG9kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHZhbHVlID0gbWV0aG9kLmFwcGx5KHNvdXJjZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gc291cmNlID8gdGFyZ2V0IDogdmFsdWU7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBkM192ZW5kb3JTeW1ib2wob2JqZWN0LCBuYW1lKSB7XG4gICAgaWYgKG5hbWUgaW4gb2JqZWN0KSByZXR1cm4gbmFtZTtcbiAgICBuYW1lID0gbmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIG5hbWUuc2xpY2UoMSk7XG4gICAgZm9yICh2YXIgaSA9IDAsIG4gPSBkM192ZW5kb3JQcmVmaXhlcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgIHZhciBwcmVmaXhOYW1lID0gZDNfdmVuZG9yUHJlZml4ZXNbaV0gKyBuYW1lO1xuICAgICAgaWYgKHByZWZpeE5hbWUgaW4gb2JqZWN0KSByZXR1cm4gcHJlZml4TmFtZTtcbiAgICB9XG4gIH1cbiAgdmFyIGQzX3ZlbmRvclByZWZpeGVzID0gWyBcIndlYmtpdFwiLCBcIm1zXCIsIFwibW96XCIsIFwiTW96XCIsIFwib1wiLCBcIk9cIiBdO1xuICBmdW5jdGlvbiBkM19ub29wKCkge31cbiAgZDMuZGlzcGF0Y2ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGlzcGF0Y2ggPSBuZXcgZDNfZGlzcGF0Y2goKSwgaSA9IC0xLCBuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICB3aGlsZSAoKytpIDwgbikgZGlzcGF0Y2hbYXJndW1lbnRzW2ldXSA9IGQzX2Rpc3BhdGNoX2V2ZW50KGRpc3BhdGNoKTtcbiAgICByZXR1cm4gZGlzcGF0Y2g7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2Rpc3BhdGNoKCkge31cbiAgZDNfZGlzcGF0Y2gucHJvdG90eXBlLm9uID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgICB2YXIgaSA9IHR5cGUuaW5kZXhPZihcIi5cIiksIG5hbWUgPSBcIlwiO1xuICAgIGlmIChpID49IDApIHtcbiAgICAgIG5hbWUgPSB0eXBlLnNsaWNlKGkgKyAxKTtcbiAgICAgIHR5cGUgPSB0eXBlLnNsaWNlKDAsIGkpO1xuICAgIH1cbiAgICBpZiAodHlwZSkgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPCAyID8gdGhpc1t0eXBlXS5vbihuYW1lKSA6IHRoaXNbdHlwZV0ub24obmFtZSwgbGlzdGVuZXIpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICBpZiAobGlzdGVuZXIgPT0gbnVsbCkgZm9yICh0eXBlIGluIHRoaXMpIHtcbiAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkodHlwZSkpIHRoaXNbdHlwZV0ub24obmFtZSwgbnVsbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2Rpc3BhdGNoX2V2ZW50KGRpc3BhdGNoKSB7XG4gICAgdmFyIGxpc3RlbmVycyA9IFtdLCBsaXN0ZW5lckJ5TmFtZSA9IG5ldyBkM19NYXAoKTtcbiAgICBmdW5jdGlvbiBldmVudCgpIHtcbiAgICAgIHZhciB6ID0gbGlzdGVuZXJzLCBpID0gLTEsIG4gPSB6Lmxlbmd0aCwgbDtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSBpZiAobCA9IHpbaV0ub24pIGwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBkaXNwYXRjaDtcbiAgICB9XG4gICAgZXZlbnQub24gPSBmdW5jdGlvbihuYW1lLCBsaXN0ZW5lcikge1xuICAgICAgdmFyIGwgPSBsaXN0ZW5lckJ5TmFtZS5nZXQobmFtZSksIGk7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHJldHVybiBsICYmIGwub247XG4gICAgICBpZiAobCkge1xuICAgICAgICBsLm9uID0gbnVsbDtcbiAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLnNsaWNlKDAsIGkgPSBsaXN0ZW5lcnMuaW5kZXhPZihsKSkuY29uY2F0KGxpc3RlbmVycy5zbGljZShpICsgMSkpO1xuICAgICAgICBsaXN0ZW5lckJ5TmFtZS5yZW1vdmUobmFtZSk7XG4gICAgICB9XG4gICAgICBpZiAobGlzdGVuZXIpIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyQnlOYW1lLnNldChuYW1lLCB7XG4gICAgICAgIG9uOiBsaXN0ZW5lclxuICAgICAgfSkpO1xuICAgICAgcmV0dXJuIGRpc3BhdGNoO1xuICAgIH07XG4gICAgcmV0dXJuIGV2ZW50O1xuICB9XG4gIGQzLmV2ZW50ID0gbnVsbDtcbiAgZnVuY3Rpb24gZDNfZXZlbnRQcmV2ZW50RGVmYXVsdCgpIHtcbiAgICBkMy5ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2V2ZW50U291cmNlKCkge1xuICAgIHZhciBlID0gZDMuZXZlbnQsIHM7XG4gICAgd2hpbGUgKHMgPSBlLnNvdXJjZUV2ZW50KSBlID0gcztcbiAgICByZXR1cm4gZTtcbiAgfVxuICBmdW5jdGlvbiBkM19ldmVudERpc3BhdGNoKHRhcmdldCkge1xuICAgIHZhciBkaXNwYXRjaCA9IG5ldyBkM19kaXNwYXRjaCgpLCBpID0gMCwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgd2hpbGUgKCsraSA8IG4pIGRpc3BhdGNoW2FyZ3VtZW50c1tpXV0gPSBkM19kaXNwYXRjaF9ldmVudChkaXNwYXRjaCk7XG4gICAgZGlzcGF0Y2gub2YgPSBmdW5jdGlvbih0aGl6LCBhcmd1bWVudHopIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihlMSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHZhciBlMCA9IGUxLnNvdXJjZUV2ZW50ID0gZDMuZXZlbnQ7XG4gICAgICAgICAgZTEudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgICAgIGQzLmV2ZW50ID0gZTE7XG4gICAgICAgICAgZGlzcGF0Y2hbZTEudHlwZV0uYXBwbHkodGhpeiwgYXJndW1lbnR6KTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkMy5ldmVudCA9IGUwO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH07XG4gICAgcmV0dXJuIGRpc3BhdGNoO1xuICB9XG4gIGQzLnJlcXVvdGUgPSBmdW5jdGlvbihzKSB7XG4gICAgcmV0dXJuIHMucmVwbGFjZShkM19yZXF1b3RlX3JlLCBcIlxcXFwkJlwiKTtcbiAgfTtcbiAgdmFyIGQzX3JlcXVvdGVfcmUgPSAvW1xcXFxcXF5cXCRcXCpcXCtcXD9cXHxcXFtcXF1cXChcXClcXC5cXHtcXH1dL2c7XG4gIHZhciBkM19zdWJjbGFzcyA9IHt9Ll9fcHJvdG9fXyA/IGZ1bmN0aW9uKG9iamVjdCwgcHJvdG90eXBlKSB7XG4gICAgb2JqZWN0Ll9fcHJvdG9fXyA9IHByb3RvdHlwZTtcbiAgfSA6IGZ1bmN0aW9uKG9iamVjdCwgcHJvdG90eXBlKSB7XG4gICAgZm9yICh2YXIgcHJvcGVydHkgaW4gcHJvdG90eXBlKSBvYmplY3RbcHJvcGVydHldID0gcHJvdG90eXBlW3Byb3BlcnR5XTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc2VsZWN0aW9uKGdyb3Vwcykge1xuICAgIGQzX3N1YmNsYXNzKGdyb3VwcywgZDNfc2VsZWN0aW9uUHJvdG90eXBlKTtcbiAgICByZXR1cm4gZ3JvdXBzO1xuICB9XG4gIHZhciBkM19zZWxlY3QgPSBmdW5jdGlvbihzLCBuKSB7XG4gICAgcmV0dXJuIG4ucXVlcnlTZWxlY3RvcihzKTtcbiAgfSwgZDNfc2VsZWN0QWxsID0gZnVuY3Rpb24ocywgbikge1xuICAgIHJldHVybiBuLnF1ZXJ5U2VsZWN0b3JBbGwocyk7XG4gIH0sIGQzX3NlbGVjdE1hdGNoZXMgPSBmdW5jdGlvbihuLCBzKSB7XG4gICAgdmFyIGQzX3NlbGVjdE1hdGNoZXIgPSBuLm1hdGNoZXMgfHwgbltkM192ZW5kb3JTeW1ib2wobiwgXCJtYXRjaGVzU2VsZWN0b3JcIildO1xuICAgIGQzX3NlbGVjdE1hdGNoZXMgPSBmdW5jdGlvbihuLCBzKSB7XG4gICAgICByZXR1cm4gZDNfc2VsZWN0TWF0Y2hlci5jYWxsKG4sIHMpO1xuICAgIH07XG4gICAgcmV0dXJuIGQzX3NlbGVjdE1hdGNoZXMobiwgcyk7XG4gIH07XG4gIGlmICh0eXBlb2YgU2l6emxlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBkM19zZWxlY3QgPSBmdW5jdGlvbihzLCBuKSB7XG4gICAgICByZXR1cm4gU2l6emxlKHMsIG4pWzBdIHx8IG51bGw7XG4gICAgfTtcbiAgICBkM19zZWxlY3RBbGwgPSBTaXp6bGU7XG4gICAgZDNfc2VsZWN0TWF0Y2hlcyA9IFNpenpsZS5tYXRjaGVzU2VsZWN0b3I7XG4gIH1cbiAgZDMuc2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGQzLnNlbGVjdChkM19kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpO1xuICB9O1xuICB2YXIgZDNfc2VsZWN0aW9uUHJvdG90eXBlID0gZDMuc2VsZWN0aW9uLnByb3RvdHlwZSA9IFtdO1xuICBkM19zZWxlY3Rpb25Qcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICB2YXIgc3ViZ3JvdXBzID0gW10sIHN1Ymdyb3VwLCBzdWJub2RlLCBncm91cCwgbm9kZTtcbiAgICBzZWxlY3RvciA9IGQzX3NlbGVjdGlvbl9zZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgZm9yICh2YXIgaiA9IC0xLCBtID0gdGhpcy5sZW5ndGg7ICsraiA8IG07ICkge1xuICAgICAgc3ViZ3JvdXBzLnB1c2goc3ViZ3JvdXAgPSBbXSk7XG4gICAgICBzdWJncm91cC5wYXJlbnROb2RlID0gKGdyb3VwID0gdGhpc1tqXSkucGFyZW50Tm9kZTtcbiAgICAgIGZvciAodmFyIGkgPSAtMSwgbiA9IGdyb3VwLmxlbmd0aDsgKytpIDwgbjsgKSB7XG4gICAgICAgIGlmIChub2RlID0gZ3JvdXBbaV0pIHtcbiAgICAgICAgICBzdWJncm91cC5wdXNoKHN1Ym5vZGUgPSBzZWxlY3Rvci5jYWxsKG5vZGUsIG5vZGUuX19kYXRhX18sIGksIGopKTtcbiAgICAgICAgICBpZiAoc3Vibm9kZSAmJiBcIl9fZGF0YV9fXCIgaW4gbm9kZSkgc3Vibm9kZS5fX2RhdGFfXyA9IG5vZGUuX19kYXRhX187XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3ViZ3JvdXAucHVzaChudWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZDNfc2VsZWN0aW9uKHN1Ymdyb3Vwcyk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3NlbGVjdGlvbl9zZWxlY3RvcihzZWxlY3Rvcikge1xuICAgIHJldHVybiB0eXBlb2Ygc2VsZWN0b3IgPT09IFwiZnVuY3Rpb25cIiA/IHNlbGVjdG9yIDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZDNfc2VsZWN0KHNlbGVjdG9yLCB0aGlzKTtcbiAgICB9O1xuICB9XG4gIGQzX3NlbGVjdGlvblByb3RvdHlwZS5zZWxlY3RBbGwgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgIHZhciBzdWJncm91cHMgPSBbXSwgc3ViZ3JvdXAsIG5vZGU7XG4gICAgc2VsZWN0b3IgPSBkM19zZWxlY3Rpb25fc2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgIGZvciAodmFyIGogPSAtMSwgbSA9IHRoaXMubGVuZ3RoOyArK2ogPCBtOyApIHtcbiAgICAgIGZvciAodmFyIGdyb3VwID0gdGhpc1tqXSwgaSA9IC0xLCBuID0gZ3JvdXAubGVuZ3RoOyArK2kgPCBuOyApIHtcbiAgICAgICAgaWYgKG5vZGUgPSBncm91cFtpXSkge1xuICAgICAgICAgIHN1Ymdyb3Vwcy5wdXNoKHN1Ymdyb3VwID0gZDNfYXJyYXkoc2VsZWN0b3IuY2FsbChub2RlLCBub2RlLl9fZGF0YV9fLCBpLCBqKSkpO1xuICAgICAgICAgIHN1Ymdyb3VwLnBhcmVudE5vZGUgPSBub2RlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkM19zZWxlY3Rpb24oc3ViZ3JvdXBzKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc2VsZWN0aW9uX3NlbGVjdG9yQWxsKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzZWxlY3RvciA9PT0gXCJmdW5jdGlvblwiID8gc2VsZWN0b3IgOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkM19zZWxlY3RBbGwoc2VsZWN0b3IsIHRoaXMpO1xuICAgIH07XG4gIH1cbiAgdmFyIGQzX25zUHJlZml4ID0ge1xuICAgIHN2ZzogXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFxuICAgIHhodG1sOiBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIixcbiAgICB4bGluazogXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIsXG4gICAgeG1sOiBcImh0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZVwiLFxuICAgIHhtbG5zOiBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAveG1sbnMvXCJcbiAgfTtcbiAgZDMubnMgPSB7XG4gICAgcHJlZml4OiBkM19uc1ByZWZpeCxcbiAgICBxdWFsaWZ5OiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICB2YXIgaSA9IG5hbWUuaW5kZXhPZihcIjpcIiksIHByZWZpeCA9IG5hbWU7XG4gICAgICBpZiAoaSA+PSAwICYmIChwcmVmaXggPSBuYW1lLnNsaWNlKDAsIGkpKSAhPT0gXCJ4bWxuc1wiKSBuYW1lID0gbmFtZS5zbGljZShpICsgMSk7XG4gICAgICByZXR1cm4gZDNfbnNQcmVmaXguaGFzT3duUHJvcGVydHkocHJlZml4KSA/IHtcbiAgICAgICAgc3BhY2U6IGQzX25zUHJlZml4W3ByZWZpeF0sXG4gICAgICAgIGxvY2FsOiBuYW1lXG4gICAgICB9IDogbmFtZTtcbiAgICB9XG4gIH07XG4gIGQzX3NlbGVjdGlvblByb3RvdHlwZS5hdHRyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubm9kZSgpO1xuICAgICAgICBuYW1lID0gZDMubnMucXVhbGlmeShuYW1lKTtcbiAgICAgICAgcmV0dXJuIG5hbWUubG9jYWwgPyBub2RlLmdldEF0dHJpYnV0ZU5TKG5hbWUuc3BhY2UsIG5hbWUubG9jYWwpIDogbm9kZS5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhbHVlIGluIG5hbWUpIHRoaXMuZWFjaChkM19zZWxlY3Rpb25fYXR0cih2YWx1ZSwgbmFtZVt2YWx1ZV0pKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5lYWNoKGQzX3NlbGVjdGlvbl9hdHRyKG5hbWUsIHZhbHVlKSk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3NlbGVjdGlvbl9hdHRyKG5hbWUsIHZhbHVlKSB7XG4gICAgbmFtZSA9IGQzLm5zLnF1YWxpZnkobmFtZSk7XG4gICAgZnVuY3Rpb24gYXR0ck51bGwoKSB7XG4gICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXR0ck51bGxOUygpIHtcbiAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlTlMobmFtZS5zcGFjZSwgbmFtZS5sb2NhbCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGF0dHJDb25zdGFudCgpIHtcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXR0ckNvbnN0YW50TlMoKSB7XG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZU5TKG5hbWUuc3BhY2UsIG5hbWUubG9jYWwsIHZhbHVlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXR0ckZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHggPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKHggPT0gbnVsbCkgdGhpcy5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7IGVsc2UgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgeCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGF0dHJGdW5jdGlvbk5TKCkge1xuICAgICAgdmFyIHggPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKHggPT0gbnVsbCkgdGhpcy5yZW1vdmVBdHRyaWJ1dGVOUyhuYW1lLnNwYWNlLCBuYW1lLmxvY2FsKTsgZWxzZSB0aGlzLnNldEF0dHJpYnV0ZU5TKG5hbWUuc3BhY2UsIG5hbWUubG9jYWwsIHgpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/IG5hbWUubG9jYWwgPyBhdHRyTnVsbE5TIDogYXR0ck51bGwgOiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiA/IG5hbWUubG9jYWwgPyBhdHRyRnVuY3Rpb25OUyA6IGF0dHJGdW5jdGlvbiA6IG5hbWUubG9jYWwgPyBhdHRyQ29uc3RhbnROUyA6IGF0dHJDb25zdGFudDtcbiAgfVxuICBmdW5jdGlvbiBkM19jb2xsYXBzZShzKSB7XG4gICAgcmV0dXJuIHMudHJpbSgpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuICB9XG4gIGQzX3NlbGVjdGlvblByb3RvdHlwZS5jbGFzc2VkID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubm9kZSgpLCBuID0gKG5hbWUgPSBkM19zZWxlY3Rpb25fY2xhc3NlcyhuYW1lKSkubGVuZ3RoLCBpID0gLTE7XG4gICAgICAgIGlmICh2YWx1ZSA9IG5vZGUuY2xhc3NMaXN0KSB7XG4gICAgICAgICAgd2hpbGUgKCsraSA8IG4pIGlmICghdmFsdWUuY29udGFpbnMobmFtZVtpXSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA9IG5vZGUuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIik7XG4gICAgICAgICAgd2hpbGUgKCsraSA8IG4pIGlmICghZDNfc2VsZWN0aW9uX2NsYXNzZWRSZShuYW1lW2ldKS50ZXN0KHZhbHVlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgZm9yICh2YWx1ZSBpbiBuYW1lKSB0aGlzLmVhY2goZDNfc2VsZWN0aW9uX2NsYXNzZWQodmFsdWUsIG5hbWVbdmFsdWVdKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZWFjaChkM19zZWxlY3Rpb25fY2xhc3NlZChuYW1lLCB2YWx1ZSkpO1xuICB9O1xuICBmdW5jdGlvbiBkM19zZWxlY3Rpb25fY2xhc3NlZFJlKG5hbWUpIHtcbiAgICByZXR1cm4gbmV3IFJlZ0V4cChcIig/Ol58XFxcXHMrKVwiICsgZDMucmVxdW90ZShuYW1lKSArIFwiKD86XFxcXHMrfCQpXCIsIFwiZ1wiKTtcbiAgfVxuICBmdW5jdGlvbiBkM19zZWxlY3Rpb25fY2xhc3NlcyhuYW1lKSB7XG4gICAgcmV0dXJuIChuYW1lICsgXCJcIikudHJpbSgpLnNwbGl0KC9efFxccysvKTtcbiAgfVxuICBmdW5jdGlvbiBkM19zZWxlY3Rpb25fY2xhc3NlZChuYW1lLCB2YWx1ZSkge1xuICAgIG5hbWUgPSBkM19zZWxlY3Rpb25fY2xhc3NlcyhuYW1lKS5tYXAoZDNfc2VsZWN0aW9uX2NsYXNzZWROYW1lKTtcbiAgICB2YXIgbiA9IG5hbWUubGVuZ3RoO1xuICAgIGZ1bmN0aW9uIGNsYXNzZWRDb25zdGFudCgpIHtcbiAgICAgIHZhciBpID0gLTE7XG4gICAgICB3aGlsZSAoKytpIDwgbikgbmFtZVtpXSh0aGlzLCB2YWx1ZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNsYXNzZWRGdW5jdGlvbigpIHtcbiAgICAgIHZhciBpID0gLTEsIHggPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgd2hpbGUgKCsraSA8IG4pIG5hbWVbaV0odGhpcywgeCk7XG4gICAgfVxuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiA/IGNsYXNzZWRGdW5jdGlvbiA6IGNsYXNzZWRDb25zdGFudDtcbiAgfVxuICBmdW5jdGlvbiBkM19zZWxlY3Rpb25fY2xhc3NlZE5hbWUobmFtZSkge1xuICAgIHZhciByZSA9IGQzX3NlbGVjdGlvbl9jbGFzc2VkUmUobmFtZSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUsIHZhbHVlKSB7XG4gICAgICBpZiAoYyA9IG5vZGUuY2xhc3NMaXN0KSByZXR1cm4gdmFsdWUgPyBjLmFkZChuYW1lKSA6IGMucmVtb3ZlKG5hbWUpO1xuICAgICAgdmFyIGMgPSBub2RlLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCI7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgcmUubGFzdEluZGV4ID0gMDtcbiAgICAgICAgaWYgKCFyZS50ZXN0KGMpKSBub2RlLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGQzX2NvbGxhcHNlKGMgKyBcIiBcIiArIG5hbWUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgZDNfY29sbGFwc2UoYy5yZXBsYWNlKHJlLCBcIiBcIikpKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGQzX3NlbGVjdGlvblByb3RvdHlwZS5zdHlsZSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBwcmlvcml0eSkge1xuICAgIHZhciBuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBpZiAobiA8IDMpIHtcbiAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBpZiAobiA8IDIpIHZhbHVlID0gXCJcIjtcbiAgICAgICAgZm9yIChwcmlvcml0eSBpbiBuYW1lKSB0aGlzLmVhY2goZDNfc2VsZWN0aW9uX3N0eWxlKHByaW9yaXR5LCBuYW1lW3ByaW9yaXR5XSwgdmFsdWUpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBpZiAobiA8IDIpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm5vZGUoKTtcbiAgICAgICAgcmV0dXJuIGQzX3dpbmRvdyhub2RlKS5nZXRDb21wdXRlZFN0eWxlKG5vZGUsIG51bGwpLmdldFByb3BlcnR5VmFsdWUobmFtZSk7XG4gICAgICB9XG4gICAgICBwcmlvcml0eSA9IFwiXCI7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmVhY2goZDNfc2VsZWN0aW9uX3N0eWxlKG5hbWUsIHZhbHVlLCBwcmlvcml0eSkpO1xuICB9O1xuICBmdW5jdGlvbiBkM19zZWxlY3Rpb25fc3R5bGUobmFtZSwgdmFsdWUsIHByaW9yaXR5KSB7XG4gICAgZnVuY3Rpb24gc3R5bGVOdWxsKCkge1xuICAgICAgdGhpcy5zdHlsZS5yZW1vdmVQcm9wZXJ0eShuYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3R5bGVDb25zdGFudCgpIHtcbiAgICAgIHRoaXMuc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgdmFsdWUsIHByaW9yaXR5KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3R5bGVGdW5jdGlvbigpIHtcbiAgICAgIHZhciB4ID0gdmFsdWUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIGlmICh4ID09IG51bGwpIHRoaXMuc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7IGVsc2UgdGhpcy5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCB4LCBwcmlvcml0eSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZSA9PSBudWxsID8gc3R5bGVOdWxsIDogdHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIgPyBzdHlsZUZ1bmN0aW9uIDogc3R5bGVDb25zdGFudDtcbiAgfVxuICBkM19zZWxlY3Rpb25Qcm90b3R5cGUucHJvcGVydHkgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikge1xuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSBcInN0cmluZ1wiKSByZXR1cm4gdGhpcy5ub2RlKClbbmFtZV07XG4gICAgICBmb3IgKHZhbHVlIGluIG5hbWUpIHRoaXMuZWFjaChkM19zZWxlY3Rpb25fcHJvcGVydHkodmFsdWUsIG5hbWVbdmFsdWVdKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZWFjaChkM19zZWxlY3Rpb25fcHJvcGVydHkobmFtZSwgdmFsdWUpKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc2VsZWN0aW9uX3Byb3BlcnR5KG5hbWUsIHZhbHVlKSB7XG4gICAgZnVuY3Rpb24gcHJvcGVydHlOdWxsKCkge1xuICAgICAgZGVsZXRlIHRoaXNbbmFtZV07XG4gICAgfVxuICAgIGZ1bmN0aW9uIHByb3BlcnR5Q29uc3RhbnQoKSB7XG4gICAgICB0aGlzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHByb3BlcnR5RnVuY3Rpb24oKSB7XG4gICAgICB2YXIgeCA9IHZhbHVlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoeCA9PSBudWxsKSBkZWxldGUgdGhpc1tuYW1lXTsgZWxzZSB0aGlzW25hbWVdID0geDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlID09IG51bGwgPyBwcm9wZXJ0eU51bGwgOiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiA/IHByb3BlcnR5RnVuY3Rpb24gOiBwcm9wZXJ0eUNvbnN0YW50O1xuICB9XG4gIGQzX3NlbGVjdGlvblByb3RvdHlwZS50ZXh0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IHRoaXMuZWFjaCh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiA/IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHYgPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgdGhpcy50ZXh0Q29udGVudCA9IHYgPT0gbnVsbCA/IFwiXCIgOiB2O1xuICAgIH0gOiB2YWx1ZSA9PSBudWxsID8gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICB9IDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgfSkgOiB0aGlzLm5vZGUoKS50ZXh0Q29udGVudDtcbiAgfTtcbiAgZDNfc2VsZWN0aW9uUHJvdG90eXBlLmh0bWwgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gdGhpcy5lYWNoKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiID8gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdiA9IHZhbHVlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB0aGlzLmlubmVySFRNTCA9IHYgPT0gbnVsbCA/IFwiXCIgOiB2O1xuICAgIH0gOiB2YWx1ZSA9PSBudWxsID8gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmlubmVySFRNTCA9IFwiXCI7XG4gICAgfSA6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICB9KSA6IHRoaXMubm9kZSgpLmlubmVySFRNTDtcbiAgfTtcbiAgZDNfc2VsZWN0aW9uUHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBuYW1lID0gZDNfc2VsZWN0aW9uX2NyZWF0b3IobmFtZSk7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kQ2hpbGQobmFtZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICB9KTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc2VsZWN0aW9uX2NyZWF0b3IobmFtZSkge1xuICAgIGZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgICAgIHZhciBkb2N1bWVudCA9IHRoaXMub3duZXJEb2N1bWVudCwgbmFtZXNwYWNlID0gdGhpcy5uYW1lc3BhY2VVUkk7XG4gICAgICByZXR1cm4gbmFtZXNwYWNlID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgbmFtZSkgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVOUygpIHtcbiAgICAgIHJldHVybiB0aGlzLm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWUuc3BhY2UsIG5hbWUubG9jYWwpO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZW9mIG5hbWUgPT09IFwiZnVuY3Rpb25cIiA/IG5hbWUgOiAobmFtZSA9IGQzLm5zLnF1YWxpZnkobmFtZSkpLmxvY2FsID8gY3JlYXRlTlMgOiBjcmVhdGU7XG4gIH1cbiAgZDNfc2VsZWN0aW9uUHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uKG5hbWUsIGJlZm9yZSkge1xuICAgIG5hbWUgPSBkM19zZWxlY3Rpb25fY3JlYXRvcihuYW1lKTtcbiAgICBiZWZvcmUgPSBkM19zZWxlY3Rpb25fc2VsZWN0b3IoYmVmb3JlKTtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3QoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnNlcnRCZWZvcmUobmFtZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCBiZWZvcmUuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCBudWxsKTtcbiAgICB9KTtcbiAgfTtcbiAgZDNfc2VsZWN0aW9uUHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVhY2goZDNfc2VsZWN0aW9uUmVtb3ZlKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc2VsZWN0aW9uUmVtb3ZlKCkge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgaWYgKHBhcmVudCkgcGFyZW50LnJlbW92ZUNoaWxkKHRoaXMpO1xuICB9XG4gIGQzX3NlbGVjdGlvblByb3RvdHlwZS5kYXRhID0gZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgIHZhciBpID0gLTEsIG4gPSB0aGlzLmxlbmd0aCwgZ3JvdXAsIG5vZGU7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICB2YWx1ZSA9IG5ldyBBcnJheShuID0gKGdyb3VwID0gdGhpc1swXSkubGVuZ3RoKTtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgIGlmIChub2RlID0gZ3JvdXBbaV0pIHtcbiAgICAgICAgICB2YWx1ZVtpXSA9IG5vZGUuX19kYXRhX187XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYmluZChncm91cCwgZ3JvdXBEYXRhKSB7XG4gICAgICB2YXIgaSwgbiA9IGdyb3VwLmxlbmd0aCwgbSA9IGdyb3VwRGF0YS5sZW5ndGgsIG4wID0gTWF0aC5taW4obiwgbSksIHVwZGF0ZU5vZGVzID0gbmV3IEFycmF5KG0pLCBlbnRlck5vZGVzID0gbmV3IEFycmF5KG0pLCBleGl0Tm9kZXMgPSBuZXcgQXJyYXkobiksIG5vZGUsIG5vZGVEYXRhO1xuICAgICAgaWYgKGtleSkge1xuICAgICAgICB2YXIgbm9kZUJ5S2V5VmFsdWUgPSBuZXcgZDNfTWFwKCksIGtleVZhbHVlcyA9IG5ldyBBcnJheShuKSwga2V5VmFsdWU7XG4gICAgICAgIGZvciAoaSA9IC0xOyArK2kgPCBuOyApIHtcbiAgICAgICAgICBpZiAobm9kZSA9IGdyb3VwW2ldKSB7XG4gICAgICAgICAgICBpZiAobm9kZUJ5S2V5VmFsdWUuaGFzKGtleVZhbHVlID0ga2V5LmNhbGwobm9kZSwgbm9kZS5fX2RhdGFfXywgaSkpKSB7XG4gICAgICAgICAgICAgIGV4aXROb2Rlc1tpXSA9IG5vZGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBub2RlQnlLZXlWYWx1ZS5zZXQoa2V5VmFsdWUsIG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2V5VmFsdWVzW2ldID0ga2V5VmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IC0xOyArK2kgPCBtOyApIHtcbiAgICAgICAgICBpZiAoIShub2RlID0gbm9kZUJ5S2V5VmFsdWUuZ2V0KGtleVZhbHVlID0ga2V5LmNhbGwoZ3JvdXBEYXRhLCBub2RlRGF0YSA9IGdyb3VwRGF0YVtpXSwgaSkpKSkge1xuICAgICAgICAgICAgZW50ZXJOb2Rlc1tpXSA9IGQzX3NlbGVjdGlvbl9kYXRhTm9kZShub2RlRGF0YSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChub2RlICE9PSB0cnVlKSB7XG4gICAgICAgICAgICB1cGRhdGVOb2Rlc1tpXSA9IG5vZGU7XG4gICAgICAgICAgICBub2RlLl9fZGF0YV9fID0gbm9kZURhdGE7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5vZGVCeUtleVZhbHVlLnNldChrZXlWYWx1ZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gLTE7ICsraSA8IG47ICkge1xuICAgICAgICAgIGlmIChpIGluIGtleVZhbHVlcyAmJiBub2RlQnlLZXlWYWx1ZS5nZXQoa2V5VmFsdWVzW2ldKSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgZXhpdE5vZGVzW2ldID0gZ3JvdXBbaV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSAtMTsgKytpIDwgbjA7ICkge1xuICAgICAgICAgIG5vZGUgPSBncm91cFtpXTtcbiAgICAgICAgICBub2RlRGF0YSA9IGdyb3VwRGF0YVtpXTtcbiAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgbm9kZS5fX2RhdGFfXyA9IG5vZGVEYXRhO1xuICAgICAgICAgICAgdXBkYXRlTm9kZXNbaV0gPSBub2RlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbnRlck5vZGVzW2ldID0gZDNfc2VsZWN0aW9uX2RhdGFOb2RlKG5vZGVEYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICg7aSA8IG07ICsraSkge1xuICAgICAgICAgIGVudGVyTm9kZXNbaV0gPSBkM19zZWxlY3Rpb25fZGF0YU5vZGUoZ3JvdXBEYXRhW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKDtpIDwgbjsgKytpKSB7XG4gICAgICAgICAgZXhpdE5vZGVzW2ldID0gZ3JvdXBbaV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVudGVyTm9kZXMudXBkYXRlID0gdXBkYXRlTm9kZXM7XG4gICAgICBlbnRlck5vZGVzLnBhcmVudE5vZGUgPSB1cGRhdGVOb2Rlcy5wYXJlbnROb2RlID0gZXhpdE5vZGVzLnBhcmVudE5vZGUgPSBncm91cC5wYXJlbnROb2RlO1xuICAgICAgZW50ZXIucHVzaChlbnRlck5vZGVzKTtcbiAgICAgIHVwZGF0ZS5wdXNoKHVwZGF0ZU5vZGVzKTtcbiAgICAgIGV4aXQucHVzaChleGl0Tm9kZXMpO1xuICAgIH1cbiAgICB2YXIgZW50ZXIgPSBkM19zZWxlY3Rpb25fZW50ZXIoW10pLCB1cGRhdGUgPSBkM19zZWxlY3Rpb24oW10pLCBleGl0ID0gZDNfc2VsZWN0aW9uKFtdKTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgIGJpbmQoZ3JvdXAgPSB0aGlzW2ldLCB2YWx1ZS5jYWxsKGdyb3VwLCBncm91cC5wYXJlbnROb2RlLl9fZGF0YV9fLCBpKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgIGJpbmQoZ3JvdXAgPSB0aGlzW2ldLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZS5lbnRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGVudGVyO1xuICAgIH07XG4gICAgdXBkYXRlLmV4aXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleGl0O1xuICAgIH07XG4gICAgcmV0dXJuIHVwZGF0ZTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc2VsZWN0aW9uX2RhdGFOb2RlKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgX19kYXRhX186IGRhdGFcbiAgICB9O1xuICB9XG4gIGQzX3NlbGVjdGlvblByb3RvdHlwZS5kYXR1bSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPyB0aGlzLnByb3BlcnR5KFwiX19kYXRhX19cIiwgdmFsdWUpIDogdGhpcy5wcm9wZXJ0eShcIl9fZGF0YV9fXCIpO1xuICB9O1xuICBkM19zZWxlY3Rpb25Qcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24oZmlsdGVyKSB7XG4gICAgdmFyIHN1Ymdyb3VwcyA9IFtdLCBzdWJncm91cCwgZ3JvdXAsIG5vZGU7XG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgIT09IFwiZnVuY3Rpb25cIikgZmlsdGVyID0gZDNfc2VsZWN0aW9uX2ZpbHRlcihmaWx0ZXIpO1xuICAgIGZvciAodmFyIGogPSAwLCBtID0gdGhpcy5sZW5ndGg7IGogPCBtOyBqKyspIHtcbiAgICAgIHN1Ymdyb3Vwcy5wdXNoKHN1Ymdyb3VwID0gW10pO1xuICAgICAgc3ViZ3JvdXAucGFyZW50Tm9kZSA9IChncm91cCA9IHRoaXNbal0pLnBhcmVudE5vZGU7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGdyb3VwLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBpZiAoKG5vZGUgPSBncm91cFtpXSkgJiYgZmlsdGVyLmNhbGwobm9kZSwgbm9kZS5fX2RhdGFfXywgaSwgaikpIHtcbiAgICAgICAgICBzdWJncm91cC5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkM19zZWxlY3Rpb24oc3ViZ3JvdXBzKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc2VsZWN0aW9uX2ZpbHRlcihzZWxlY3Rvcikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkM19zZWxlY3RNYXRjaGVzKHRoaXMsIHNlbGVjdG9yKTtcbiAgICB9O1xuICB9XG4gIGQzX3NlbGVjdGlvblByb3RvdHlwZS5vcmRlciA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGogPSAtMSwgbSA9IHRoaXMubGVuZ3RoOyArK2ogPCBtOyApIHtcbiAgICAgIGZvciAodmFyIGdyb3VwID0gdGhpc1tqXSwgaSA9IGdyb3VwLmxlbmd0aCAtIDEsIG5leHQgPSBncm91cFtpXSwgbm9kZTsgLS1pID49IDA7ICkge1xuICAgICAgICBpZiAobm9kZSA9IGdyb3VwW2ldKSB7XG4gICAgICAgICAgaWYgKG5leHQgJiYgbmV4dCAhPT0gbm9kZS5uZXh0U2libGluZykgbmV4dC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShub2RlLCBuZXh0KTtcbiAgICAgICAgICBuZXh0ID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgZDNfc2VsZWN0aW9uUHJvdG90eXBlLnNvcnQgPSBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgY29tcGFyYXRvciA9IGQzX3NlbGVjdGlvbl9zb3J0Q29tcGFyYXRvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGZvciAodmFyIGogPSAtMSwgbSA9IHRoaXMubGVuZ3RoOyArK2ogPCBtOyApIHRoaXNbal0uc29ydChjb21wYXJhdG9yKTtcbiAgICByZXR1cm4gdGhpcy5vcmRlcigpO1xuICB9O1xuICBmdW5jdGlvbiBkM19zZWxlY3Rpb25fc29ydENvbXBhcmF0b3IoY29tcGFyYXRvcikge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgY29tcGFyYXRvciA9IGQzX2FzY2VuZGluZztcbiAgICByZXR1cm4gZnVuY3Rpb24oYSwgYikge1xuICAgICAgcmV0dXJuIGEgJiYgYiA/IGNvbXBhcmF0b3IoYS5fX2RhdGFfXywgYi5fX2RhdGFfXykgOiAhYSAtICFiO1xuICAgIH07XG4gIH1cbiAgZDNfc2VsZWN0aW9uUHJvdG90eXBlLmVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHJldHVybiBkM19zZWxlY3Rpb25fZWFjaCh0aGlzLCBmdW5jdGlvbihub2RlLCBpLCBqKSB7XG4gICAgICBjYWxsYmFjay5jYWxsKG5vZGUsIG5vZGUuX19kYXRhX18sIGksIGopO1xuICAgIH0pO1xuICB9O1xuICBmdW5jdGlvbiBkM19zZWxlY3Rpb25fZWFjaChncm91cHMsIGNhbGxiYWNrKSB7XG4gICAgZm9yICh2YXIgaiA9IDAsIG0gPSBncm91cHMubGVuZ3RoOyBqIDwgbTsgaisrKSB7XG4gICAgICBmb3IgKHZhciBncm91cCA9IGdyb3Vwc1tqXSwgaSA9IDAsIG4gPSBncm91cC5sZW5ndGgsIG5vZGU7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgaWYgKG5vZGUgPSBncm91cFtpXSkgY2FsbGJhY2sobm9kZSwgaSwgaik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBncm91cHM7XG4gIH1cbiAgZDNfc2VsZWN0aW9uUHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHZhciBhcmdzID0gZDNfYXJyYXkoYXJndW1lbnRzKTtcbiAgICBjYWxsYmFjay5hcHBseShhcmdzWzBdID0gdGhpcywgYXJncyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIGQzX3NlbGVjdGlvblByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAhdGhpcy5ub2RlKCk7XG4gIH07XG4gIGQzX3NlbGVjdGlvblByb3RvdHlwZS5ub2RlID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaiA9IDAsIG0gPSB0aGlzLmxlbmd0aDsgaiA8IG07IGorKykge1xuICAgICAgZm9yICh2YXIgZ3JvdXAgPSB0aGlzW2pdLCBpID0gMCwgbiA9IGdyb3VwLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICB2YXIgbm9kZSA9IGdyb3VwW2ldO1xuICAgICAgICBpZiAobm9kZSkgcmV0dXJuIG5vZGU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuICBkM19zZWxlY3Rpb25Qcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuID0gMDtcbiAgICBkM19zZWxlY3Rpb25fZWFjaCh0aGlzLCBmdW5jdGlvbigpIHtcbiAgICAgICsrbjtcbiAgICB9KTtcbiAgICByZXR1cm4gbjtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc2VsZWN0aW9uX2VudGVyKHNlbGVjdGlvbikge1xuICAgIGQzX3N1YmNsYXNzKHNlbGVjdGlvbiwgZDNfc2VsZWN0aW9uX2VudGVyUHJvdG90eXBlKTtcbiAgICByZXR1cm4gc2VsZWN0aW9uO1xuICB9XG4gIHZhciBkM19zZWxlY3Rpb25fZW50ZXJQcm90b3R5cGUgPSBbXTtcbiAgZDMuc2VsZWN0aW9uLmVudGVyID0gZDNfc2VsZWN0aW9uX2VudGVyO1xuICBkMy5zZWxlY3Rpb24uZW50ZXIucHJvdG90eXBlID0gZDNfc2VsZWN0aW9uX2VudGVyUHJvdG90eXBlO1xuICBkM19zZWxlY3Rpb25fZW50ZXJQcm90b3R5cGUuYXBwZW5kID0gZDNfc2VsZWN0aW9uUHJvdG90eXBlLmFwcGVuZDtcbiAgZDNfc2VsZWN0aW9uX2VudGVyUHJvdG90eXBlLmVtcHR5ID0gZDNfc2VsZWN0aW9uUHJvdG90eXBlLmVtcHR5O1xuICBkM19zZWxlY3Rpb25fZW50ZXJQcm90b3R5cGUubm9kZSA9IGQzX3NlbGVjdGlvblByb3RvdHlwZS5ub2RlO1xuICBkM19zZWxlY3Rpb25fZW50ZXJQcm90b3R5cGUuY2FsbCA9IGQzX3NlbGVjdGlvblByb3RvdHlwZS5jYWxsO1xuICBkM19zZWxlY3Rpb25fZW50ZXJQcm90b3R5cGUuc2l6ZSA9IGQzX3NlbGVjdGlvblByb3RvdHlwZS5zaXplO1xuICBkM19zZWxlY3Rpb25fZW50ZXJQcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICB2YXIgc3ViZ3JvdXBzID0gW10sIHN1Ymdyb3VwLCBzdWJub2RlLCB1cGdyb3VwLCBncm91cCwgbm9kZTtcbiAgICBmb3IgKHZhciBqID0gLTEsIG0gPSB0aGlzLmxlbmd0aDsgKytqIDwgbTsgKSB7XG4gICAgICB1cGdyb3VwID0gKGdyb3VwID0gdGhpc1tqXSkudXBkYXRlO1xuICAgICAgc3ViZ3JvdXBzLnB1c2goc3ViZ3JvdXAgPSBbXSk7XG4gICAgICBzdWJncm91cC5wYXJlbnROb2RlID0gZ3JvdXAucGFyZW50Tm9kZTtcbiAgICAgIGZvciAodmFyIGkgPSAtMSwgbiA9IGdyb3VwLmxlbmd0aDsgKytpIDwgbjsgKSB7XG4gICAgICAgIGlmIChub2RlID0gZ3JvdXBbaV0pIHtcbiAgICAgICAgICBzdWJncm91cC5wdXNoKHVwZ3JvdXBbaV0gPSBzdWJub2RlID0gc2VsZWN0b3IuY2FsbChncm91cC5wYXJlbnROb2RlLCBub2RlLl9fZGF0YV9fLCBpLCBqKSk7XG4gICAgICAgICAgc3Vibm9kZS5fX2RhdGFfXyA9IG5vZGUuX19kYXRhX187XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3ViZ3JvdXAucHVzaChudWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZDNfc2VsZWN0aW9uKHN1Ymdyb3Vwcyk7XG4gIH07XG4gIGQzX3NlbGVjdGlvbl9lbnRlclByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbihuYW1lLCBiZWZvcmUpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIGJlZm9yZSA9IGQzX3NlbGVjdGlvbl9lbnRlckluc2VydEJlZm9yZSh0aGlzKTtcbiAgICByZXR1cm4gZDNfc2VsZWN0aW9uUHJvdG90eXBlLmluc2VydC5jYWxsKHRoaXMsIG5hbWUsIGJlZm9yZSk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3NlbGVjdGlvbl9lbnRlckluc2VydEJlZm9yZShlbnRlcikge1xuICAgIHZhciBpMCwgajA7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGQsIGksIGopIHtcbiAgICAgIHZhciBncm91cCA9IGVudGVyW2pdLnVwZGF0ZSwgbiA9IGdyb3VwLmxlbmd0aCwgbm9kZTtcbiAgICAgIGlmIChqICE9IGowKSBqMCA9IGosIGkwID0gMDtcbiAgICAgIGlmIChpID49IGkwKSBpMCA9IGkgKyAxO1xuICAgICAgd2hpbGUgKCEobm9kZSA9IGdyb3VwW2kwXSkgJiYgKytpMCA8IG4pIDtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH07XG4gIH1cbiAgZDMuc2VsZWN0ID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBncm91cDtcbiAgICBpZiAodHlwZW9mIG5vZGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGdyb3VwID0gWyBkM19zZWxlY3Qobm9kZSwgZDNfZG9jdW1lbnQpIF07XG4gICAgICBncm91cC5wYXJlbnROb2RlID0gZDNfZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBncm91cCA9IFsgbm9kZSBdO1xuICAgICAgZ3JvdXAucGFyZW50Tm9kZSA9IGQzX2RvY3VtZW50RWxlbWVudChub2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIGQzX3NlbGVjdGlvbihbIGdyb3VwIF0pO1xuICB9O1xuICBkMy5zZWxlY3RBbGwgPSBmdW5jdGlvbihub2Rlcykge1xuICAgIHZhciBncm91cDtcbiAgICBpZiAodHlwZW9mIG5vZGVzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBncm91cCA9IGQzX2FycmF5KGQzX3NlbGVjdEFsbChub2RlcywgZDNfZG9jdW1lbnQpKTtcbiAgICAgIGdyb3VwLnBhcmVudE5vZGUgPSBkM19kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdyb3VwID0gZDNfYXJyYXkobm9kZXMpO1xuICAgICAgZ3JvdXAucGFyZW50Tm9kZSA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBkM19zZWxlY3Rpb24oWyBncm91cCBdKTtcbiAgfTtcbiAgZDNfc2VsZWN0aW9uUHJvdG90eXBlLm9uID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIsIGNhcHR1cmUpIHtcbiAgICB2YXIgbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKG4gPCAzKSB7XG4gICAgICBpZiAodHlwZW9mIHR5cGUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgaWYgKG4gPCAyKSBsaXN0ZW5lciA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNhcHR1cmUgaW4gdHlwZSkgdGhpcy5lYWNoKGQzX3NlbGVjdGlvbl9vbihjYXB0dXJlLCB0eXBlW2NhcHR1cmVdLCBsaXN0ZW5lcikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmIChuIDwgMikgcmV0dXJuIChuID0gdGhpcy5ub2RlKClbXCJfX29uXCIgKyB0eXBlXSkgJiYgbi5fO1xuICAgICAgY2FwdHVyZSA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5lYWNoKGQzX3NlbGVjdGlvbl9vbih0eXBlLCBsaXN0ZW5lciwgY2FwdHVyZSkpO1xuICB9O1xuICBmdW5jdGlvbiBkM19zZWxlY3Rpb25fb24odHlwZSwgbGlzdGVuZXIsIGNhcHR1cmUpIHtcbiAgICB2YXIgbmFtZSA9IFwiX19vblwiICsgdHlwZSwgaSA9IHR5cGUuaW5kZXhPZihcIi5cIiksIHdyYXAgPSBkM19zZWxlY3Rpb25fb25MaXN0ZW5lcjtcbiAgICBpZiAoaSA+IDApIHR5cGUgPSB0eXBlLnNsaWNlKDAsIGkpO1xuICAgIHZhciBmaWx0ZXIgPSBkM19zZWxlY3Rpb25fb25GaWx0ZXJzLmdldCh0eXBlKTtcbiAgICBpZiAoZmlsdGVyKSB0eXBlID0gZmlsdGVyLCB3cmFwID0gZDNfc2VsZWN0aW9uX29uRmlsdGVyO1xuICAgIGZ1bmN0aW9uIG9uUmVtb3ZlKCkge1xuICAgICAgdmFyIGwgPSB0aGlzW25hbWVdO1xuICAgICAgaWYgKGwpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGwsIGwuJCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzW25hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBvbkFkZCgpIHtcbiAgICAgIHZhciBsID0gd3JhcChsaXN0ZW5lciwgZDNfYXJyYXkoYXJndW1lbnRzKSk7XG4gICAgICBvblJlbW92ZS5jYWxsKHRoaXMpO1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIHRoaXNbbmFtZV0gPSBsLCBsLiQgPSBjYXB0dXJlKTtcbiAgICAgIGwuXyA9IGxpc3RlbmVyO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmVBbGwoKSB7XG4gICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiXl9fb24oW14uXSspXCIgKyBkMy5yZXF1b3RlKHR5cGUpICsgXCIkXCIpLCBtYXRjaDtcbiAgICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcykge1xuICAgICAgICBpZiAobWF0Y2ggPSBuYW1lLm1hdGNoKHJlKSkge1xuICAgICAgICAgIHZhciBsID0gdGhpc1tuYW1lXTtcbiAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIobWF0Y2hbMV0sIGwsIGwuJCk7XG4gICAgICAgICAgZGVsZXRlIHRoaXNbbmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGkgPyBsaXN0ZW5lciA/IG9uQWRkIDogb25SZW1vdmUgOiBsaXN0ZW5lciA/IGQzX25vb3AgOiByZW1vdmVBbGw7XG4gIH1cbiAgdmFyIGQzX3NlbGVjdGlvbl9vbkZpbHRlcnMgPSBkMy5tYXAoe1xuICAgIG1vdXNlZW50ZXI6IFwibW91c2VvdmVyXCIsXG4gICAgbW91c2VsZWF2ZTogXCJtb3VzZW91dFwiXG4gIH0pO1xuICBpZiAoZDNfZG9jdW1lbnQpIHtcbiAgICBkM19zZWxlY3Rpb25fb25GaWx0ZXJzLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgaWYgKFwib25cIiArIGsgaW4gZDNfZG9jdW1lbnQpIGQzX3NlbGVjdGlvbl9vbkZpbHRlcnMucmVtb3ZlKGspO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3NlbGVjdGlvbl9vbkxpc3RlbmVyKGxpc3RlbmVyLCBhcmd1bWVudHopIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIG8gPSBkMy5ldmVudDtcbiAgICAgIGQzLmV2ZW50ID0gZTtcbiAgICAgIGFyZ3VtZW50elswXSA9IHRoaXMuX19kYXRhX187XG4gICAgICB0cnkge1xuICAgICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHopO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgZDMuZXZlbnQgPSBvO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gZDNfc2VsZWN0aW9uX29uRmlsdGVyKGxpc3RlbmVyLCBhcmd1bWVudHopIHtcbiAgICB2YXIgbCA9IGQzX3NlbGVjdGlvbl9vbkxpc3RlbmVyKGxpc3RlbmVyLCBhcmd1bWVudHopO1xuICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgdGFyZ2V0ID0gdGhpcywgcmVsYXRlZCA9IGUucmVsYXRlZFRhcmdldDtcbiAgICAgIGlmICghcmVsYXRlZCB8fCByZWxhdGVkICE9PSB0YXJnZXQgJiYgIShyZWxhdGVkLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKHRhcmdldCkgJiA4KSkge1xuICAgICAgICBsLmNhbGwodGFyZ2V0LCBlKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIHZhciBkM19ldmVudF9kcmFnU2VsZWN0LCBkM19ldmVudF9kcmFnSWQgPSAwO1xuICBmdW5jdGlvbiBkM19ldmVudF9kcmFnU3VwcHJlc3Mobm9kZSkge1xuICAgIHZhciBuYW1lID0gXCIuZHJhZ3N1cHByZXNzLVwiICsgKytkM19ldmVudF9kcmFnSWQsIGNsaWNrID0gXCJjbGlja1wiICsgbmFtZSwgdyA9IGQzLnNlbGVjdChkM193aW5kb3cobm9kZSkpLm9uKFwidG91Y2htb3ZlXCIgKyBuYW1lLCBkM19ldmVudFByZXZlbnREZWZhdWx0KS5vbihcImRyYWdzdGFydFwiICsgbmFtZSwgZDNfZXZlbnRQcmV2ZW50RGVmYXVsdCkub24oXCJzZWxlY3RzdGFydFwiICsgbmFtZSwgZDNfZXZlbnRQcmV2ZW50RGVmYXVsdCk7XG4gICAgaWYgKGQzX2V2ZW50X2RyYWdTZWxlY3QgPT0gbnVsbCkge1xuICAgICAgZDNfZXZlbnRfZHJhZ1NlbGVjdCA9IFwib25zZWxlY3RzdGFydFwiIGluIG5vZGUgPyBmYWxzZSA6IGQzX3ZlbmRvclN5bWJvbChub2RlLnN0eWxlLCBcInVzZXJTZWxlY3RcIik7XG4gICAgfVxuICAgIGlmIChkM19ldmVudF9kcmFnU2VsZWN0KSB7XG4gICAgICB2YXIgc3R5bGUgPSBkM19kb2N1bWVudEVsZW1lbnQobm9kZSkuc3R5bGUsIHNlbGVjdCA9IHN0eWxlW2QzX2V2ZW50X2RyYWdTZWxlY3RdO1xuICAgICAgc3R5bGVbZDNfZXZlbnRfZHJhZ1NlbGVjdF0gPSBcIm5vbmVcIjtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN1cHByZXNzQ2xpY2spIHtcbiAgICAgIHcub24obmFtZSwgbnVsbCk7XG4gICAgICBpZiAoZDNfZXZlbnRfZHJhZ1NlbGVjdCkgc3R5bGVbZDNfZXZlbnRfZHJhZ1NlbGVjdF0gPSBzZWxlY3Q7XG4gICAgICBpZiAoc3VwcHJlc3NDbGljaykge1xuICAgICAgICB2YXIgb2ZmID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdy5vbihjbGljaywgbnVsbCk7XG4gICAgICAgIH07XG4gICAgICAgIHcub24oY2xpY2ssIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGQzX2V2ZW50UHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBvZmYoKTtcbiAgICAgICAgfSwgdHJ1ZSk7XG4gICAgICAgIHNldFRpbWVvdXQob2ZmLCAwKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGQzLm1vdXNlID0gZnVuY3Rpb24oY29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGQzX21vdXNlUG9pbnQoY29udGFpbmVyLCBkM19ldmVudFNvdXJjZSgpKTtcbiAgfTtcbiAgdmFyIGQzX21vdXNlX2J1ZzQ0MDgzID0gdGhpcy5uYXZpZ2F0b3IgJiYgL1dlYktpdC8udGVzdCh0aGlzLm5hdmlnYXRvci51c2VyQWdlbnQpID8gLTEgOiAwO1xuICBmdW5jdGlvbiBkM19tb3VzZVBvaW50KGNvbnRhaW5lciwgZSkge1xuICAgIGlmIChlLmNoYW5nZWRUb3VjaGVzKSBlID0gZS5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICB2YXIgc3ZnID0gY29udGFpbmVyLm93bmVyU1ZHRWxlbWVudCB8fCBjb250YWluZXI7XG4gICAgaWYgKHN2Zy5jcmVhdGVTVkdQb2ludCkge1xuICAgICAgdmFyIHBvaW50ID0gc3ZnLmNyZWF0ZVNWR1BvaW50KCk7XG4gICAgICBpZiAoZDNfbW91c2VfYnVnNDQwODMgPCAwKSB7XG4gICAgICAgIHZhciB3aW5kb3cgPSBkM193aW5kb3coY29udGFpbmVyKTtcbiAgICAgICAgaWYgKHdpbmRvdy5zY3JvbGxYIHx8IHdpbmRvdy5zY3JvbGxZKSB7XG4gICAgICAgICAgc3ZnID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJzdmdcIikuc3R5bGUoe1xuICAgICAgICAgICAgcG9zaXRpb246IFwiYWJzb2x1dGVcIixcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgICAgICBwYWRkaW5nOiAwLFxuICAgICAgICAgICAgYm9yZGVyOiBcIm5vbmVcIlxuICAgICAgICAgIH0sIFwiaW1wb3J0YW50XCIpO1xuICAgICAgICAgIHZhciBjdG0gPSBzdmdbMF1bMF0uZ2V0U2NyZWVuQ1RNKCk7XG4gICAgICAgICAgZDNfbW91c2VfYnVnNDQwODMgPSAhKGN0bS5mIHx8IGN0bS5lKTtcbiAgICAgICAgICBzdmcucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChkM19tb3VzZV9idWc0NDA4MykgcG9pbnQueCA9IGUucGFnZVgsIHBvaW50LnkgPSBlLnBhZ2VZOyBlbHNlIHBvaW50LnggPSBlLmNsaWVudFgsIFxuICAgICAgcG9pbnQueSA9IGUuY2xpZW50WTtcbiAgICAgIHBvaW50ID0gcG9pbnQubWF0cml4VHJhbnNmb3JtKGNvbnRhaW5lci5nZXRTY3JlZW5DVE0oKS5pbnZlcnNlKCkpO1xuICAgICAgcmV0dXJuIFsgcG9pbnQueCwgcG9pbnQueSBdO1xuICAgIH1cbiAgICB2YXIgcmVjdCA9IGNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4gWyBlLmNsaWVudFggLSByZWN0LmxlZnQgLSBjb250YWluZXIuY2xpZW50TGVmdCwgZS5jbGllbnRZIC0gcmVjdC50b3AgLSBjb250YWluZXIuY2xpZW50VG9wIF07XG4gIH1cbiAgZDMudG91Y2ggPSBmdW5jdGlvbihjb250YWluZXIsIHRvdWNoZXMsIGlkZW50aWZpZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIGlkZW50aWZpZXIgPSB0b3VjaGVzLCB0b3VjaGVzID0gZDNfZXZlbnRTb3VyY2UoKS5jaGFuZ2VkVG91Y2hlcztcbiAgICBpZiAodG91Y2hlcykgZm9yICh2YXIgaSA9IDAsIG4gPSB0b3VjaGVzLmxlbmd0aCwgdG91Y2g7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmICgodG91Y2ggPSB0b3VjaGVzW2ldKS5pZGVudGlmaWVyID09PSBpZGVudGlmaWVyKSB7XG4gICAgICAgIHJldHVybiBkM19tb3VzZVBvaW50KGNvbnRhaW5lciwgdG91Y2gpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgZDMuYmVoYXZpb3IuZHJhZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBldmVudCA9IGQzX2V2ZW50RGlzcGF0Y2goZHJhZywgXCJkcmFnXCIsIFwiZHJhZ3N0YXJ0XCIsIFwiZHJhZ2VuZFwiKSwgb3JpZ2luID0gbnVsbCwgbW91c2Vkb3duID0gZHJhZ3N0YXJ0KGQzX25vb3AsIGQzLm1vdXNlLCBkM193aW5kb3csIFwibW91c2Vtb3ZlXCIsIFwibW91c2V1cFwiKSwgdG91Y2hzdGFydCA9IGRyYWdzdGFydChkM19iZWhhdmlvcl9kcmFnVG91Y2hJZCwgZDMudG91Y2gsIGQzX2lkZW50aXR5LCBcInRvdWNobW92ZVwiLCBcInRvdWNoZW5kXCIpO1xuICAgIGZ1bmN0aW9uIGRyYWcoKSB7XG4gICAgICB0aGlzLm9uKFwibW91c2Vkb3duLmRyYWdcIiwgbW91c2Vkb3duKS5vbihcInRvdWNoc3RhcnQuZHJhZ1wiLCB0b3VjaHN0YXJ0KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZHJhZ3N0YXJ0KGlkLCBwb3NpdGlvbiwgc3ViamVjdCwgbW92ZSwgZW5kKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcywgdGFyZ2V0ID0gZDMuZXZlbnQudGFyZ2V0LCBwYXJlbnQgPSB0aGF0LnBhcmVudE5vZGUsIGRpc3BhdGNoID0gZXZlbnQub2YodGhhdCwgYXJndW1lbnRzKSwgZHJhZ2dlZCA9IDAsIGRyYWdJZCA9IGlkKCksIGRyYWdOYW1lID0gXCIuZHJhZ1wiICsgKGRyYWdJZCA9PSBudWxsID8gXCJcIiA6IFwiLVwiICsgZHJhZ0lkKSwgZHJhZ09mZnNldCwgZHJhZ1N1YmplY3QgPSBkMy5zZWxlY3Qoc3ViamVjdCh0YXJnZXQpKS5vbihtb3ZlICsgZHJhZ05hbWUsIG1vdmVkKS5vbihlbmQgKyBkcmFnTmFtZSwgZW5kZWQpLCBkcmFnUmVzdG9yZSA9IGQzX2V2ZW50X2RyYWdTdXBwcmVzcyh0YXJnZXQpLCBwb3NpdGlvbjAgPSBwb3NpdGlvbihwYXJlbnQsIGRyYWdJZCk7XG4gICAgICAgIGlmIChvcmlnaW4pIHtcbiAgICAgICAgICBkcmFnT2Zmc2V0ID0gb3JpZ2luLmFwcGx5KHRoYXQsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgZHJhZ09mZnNldCA9IFsgZHJhZ09mZnNldC54IC0gcG9zaXRpb24wWzBdLCBkcmFnT2Zmc2V0LnkgLSBwb3NpdGlvbjBbMV0gXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkcmFnT2Zmc2V0ID0gWyAwLCAwIF07XG4gICAgICAgIH1cbiAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgIHR5cGU6IFwiZHJhZ3N0YXJ0XCJcbiAgICAgICAgfSk7XG4gICAgICAgIGZ1bmN0aW9uIG1vdmVkKCkge1xuICAgICAgICAgIHZhciBwb3NpdGlvbjEgPSBwb3NpdGlvbihwYXJlbnQsIGRyYWdJZCksIGR4LCBkeTtcbiAgICAgICAgICBpZiAoIXBvc2l0aW9uMSkgcmV0dXJuO1xuICAgICAgICAgIGR4ID0gcG9zaXRpb24xWzBdIC0gcG9zaXRpb24wWzBdO1xuICAgICAgICAgIGR5ID0gcG9zaXRpb24xWzFdIC0gcG9zaXRpb24wWzFdO1xuICAgICAgICAgIGRyYWdnZWQgfD0gZHggfCBkeTtcbiAgICAgICAgICBwb3NpdGlvbjAgPSBwb3NpdGlvbjE7XG4gICAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgICAgdHlwZTogXCJkcmFnXCIsXG4gICAgICAgICAgICB4OiBwb3NpdGlvbjFbMF0gKyBkcmFnT2Zmc2V0WzBdLFxuICAgICAgICAgICAgeTogcG9zaXRpb24xWzFdICsgZHJhZ09mZnNldFsxXSxcbiAgICAgICAgICAgIGR4OiBkeCxcbiAgICAgICAgICAgIGR5OiBkeVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGVuZGVkKCkge1xuICAgICAgICAgIGlmICghcG9zaXRpb24ocGFyZW50LCBkcmFnSWQpKSByZXR1cm47XG4gICAgICAgICAgZHJhZ1N1YmplY3Qub24obW92ZSArIGRyYWdOYW1lLCBudWxsKS5vbihlbmQgKyBkcmFnTmFtZSwgbnVsbCk7XG4gICAgICAgICAgZHJhZ1Jlc3RvcmUoZHJhZ2dlZCk7XG4gICAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgICAgdHlwZTogXCJkcmFnZW5kXCJcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gICAgZHJhZy5vcmlnaW4gPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBvcmlnaW47XG4gICAgICBvcmlnaW4gPSB4O1xuICAgICAgcmV0dXJuIGRyYWc7XG4gICAgfTtcbiAgICByZXR1cm4gZDMucmViaW5kKGRyYWcsIGV2ZW50LCBcIm9uXCIpO1xuICB9O1xuICBmdW5jdGlvbiBkM19iZWhhdmlvcl9kcmFnVG91Y2hJZCgpIHtcbiAgICByZXR1cm4gZDMuZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uaWRlbnRpZmllcjtcbiAgfVxuICBkMy50b3VjaGVzID0gZnVuY3Rpb24oY29udGFpbmVyLCB0b3VjaGVzKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB0b3VjaGVzID0gZDNfZXZlbnRTb3VyY2UoKS50b3VjaGVzO1xuICAgIHJldHVybiB0b3VjaGVzID8gZDNfYXJyYXkodG91Y2hlcykubWFwKGZ1bmN0aW9uKHRvdWNoKSB7XG4gICAgICB2YXIgcG9pbnQgPSBkM19tb3VzZVBvaW50KGNvbnRhaW5lciwgdG91Y2gpO1xuICAgICAgcG9pbnQuaWRlbnRpZmllciA9IHRvdWNoLmlkZW50aWZpZXI7XG4gICAgICByZXR1cm4gcG9pbnQ7XG4gICAgfSkgOiBbXTtcbiAgfTtcbiAgdmFyIM61ID0gMWUtNiwgzrUyID0gzrUgKiDOtSwgz4AgPSBNYXRoLlBJLCDPhCA9IDIgKiDPgCwgz4TOtSA9IM+EIC0gzrUsIGhhbGbPgCA9IM+AIC8gMiwgZDNfcmFkaWFucyA9IM+AIC8gMTgwLCBkM19kZWdyZWVzID0gMTgwIC8gz4A7XG4gIGZ1bmN0aW9uIGQzX3Nnbih4KSB7XG4gICAgcmV0dXJuIHggPiAwID8gMSA6IHggPCAwID8gLTEgOiAwO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2Nyb3NzMmQoYSwgYiwgYykge1xuICAgIHJldHVybiAoYlswXSAtIGFbMF0pICogKGNbMV0gLSBhWzFdKSAtIChiWzFdIC0gYVsxXSkgKiAoY1swXSAtIGFbMF0pO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2Fjb3MoeCkge1xuICAgIHJldHVybiB4ID4gMSA/IDAgOiB4IDwgLTEgPyDPgCA6IE1hdGguYWNvcyh4KTtcbiAgfVxuICBmdW5jdGlvbiBkM19hc2luKHgpIHtcbiAgICByZXR1cm4geCA+IDEgPyBoYWxmz4AgOiB4IDwgLTEgPyAtaGFsZs+AIDogTWF0aC5hc2luKHgpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3NpbmgoeCkge1xuICAgIHJldHVybiAoKHggPSBNYXRoLmV4cCh4KSkgLSAxIC8geCkgLyAyO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2Nvc2goeCkge1xuICAgIHJldHVybiAoKHggPSBNYXRoLmV4cCh4KSkgKyAxIC8geCkgLyAyO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RhbmgoeCkge1xuICAgIHJldHVybiAoKHggPSBNYXRoLmV4cCgyICogeCkpIC0gMSkgLyAoeCArIDEpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2hhdmVyc2luKHgpIHtcbiAgICByZXR1cm4gKHggPSBNYXRoLnNpbih4IC8gMikpICogeDtcbiAgfVxuICB2YXIgz4EgPSBNYXRoLlNRUlQyLCDPgTIgPSAyLCDPgTQgPSA0O1xuICBkMy5pbnRlcnBvbGF0ZVpvb20gPSBmdW5jdGlvbihwMCwgcDEpIHtcbiAgICB2YXIgdXgwID0gcDBbMF0sIHV5MCA9IHAwWzFdLCB3MCA9IHAwWzJdLCB1eDEgPSBwMVswXSwgdXkxID0gcDFbMV0sIHcxID0gcDFbMl0sIGR4ID0gdXgxIC0gdXgwLCBkeSA9IHV5MSAtIHV5MCwgZDIgPSBkeCAqIGR4ICsgZHkgKiBkeSwgaSwgUztcbiAgICBpZiAoZDIgPCDOtTIpIHtcbiAgICAgIFMgPSBNYXRoLmxvZyh3MSAvIHcwKSAvIM+BO1xuICAgICAgaSA9IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIFsgdXgwICsgdCAqIGR4LCB1eTAgKyB0ICogZHksIHcwICogTWF0aC5leHAoz4EgKiB0ICogUykgXTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBkMSA9IE1hdGguc3FydChkMiksIGIwID0gKHcxICogdzEgLSB3MCAqIHcwICsgz4E0ICogZDIpIC8gKDIgKiB3MCAqIM+BMiAqIGQxKSwgYjEgPSAodzEgKiB3MSAtIHcwICogdzAgLSDPgTQgKiBkMikgLyAoMiAqIHcxICogz4EyICogZDEpLCByMCA9IE1hdGgubG9nKE1hdGguc3FydChiMCAqIGIwICsgMSkgLSBiMCksIHIxID0gTWF0aC5sb2coTWF0aC5zcXJ0KGIxICogYjEgKyAxKSAtIGIxKTtcbiAgICAgIFMgPSAocjEgLSByMCkgLyDPgTtcbiAgICAgIGkgPSBmdW5jdGlvbih0KSB7XG4gICAgICAgIHZhciBzID0gdCAqIFMsIGNvc2hyMCA9IGQzX2Nvc2gocjApLCB1ID0gdzAgLyAoz4EyICogZDEpICogKGNvc2hyMCAqIGQzX3Rhbmgoz4EgKiBzICsgcjApIC0gZDNfc2luaChyMCkpO1xuICAgICAgICByZXR1cm4gWyB1eDAgKyB1ICogZHgsIHV5MCArIHUgKiBkeSwgdzAgKiBjb3NocjAgLyBkM19jb3NoKM+BICogcyArIHIwKSBdO1xuICAgICAgfTtcbiAgICB9XG4gICAgaS5kdXJhdGlvbiA9IFMgKiAxZTM7XG4gICAgcmV0dXJuIGk7XG4gIH07XG4gIGQzLmJlaGF2aW9yLnpvb20gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmlldyA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgICAgazogMVxuICAgIH0sIHRyYW5zbGF0ZTAsIGNlbnRlcjAsIGNlbnRlciwgc2l6ZSA9IFsgOTYwLCA1MDAgXSwgc2NhbGVFeHRlbnQgPSBkM19iZWhhdmlvcl96b29tSW5maW5pdHksIGR1cmF0aW9uID0gMjUwLCB6b29taW5nID0gMCwgbW91c2Vkb3duID0gXCJtb3VzZWRvd24uem9vbVwiLCBtb3VzZW1vdmUgPSBcIm1vdXNlbW92ZS56b29tXCIsIG1vdXNldXAgPSBcIm1vdXNldXAuem9vbVwiLCBtb3VzZXdoZWVsVGltZXIsIHRvdWNoc3RhcnQgPSBcInRvdWNoc3RhcnQuem9vbVwiLCB0b3VjaHRpbWUsIGV2ZW50ID0gZDNfZXZlbnREaXNwYXRjaCh6b29tLCBcInpvb21zdGFydFwiLCBcInpvb21cIiwgXCJ6b29tZW5kXCIpLCB4MCwgeDEsIHkwLCB5MTtcbiAgICBpZiAoIWQzX2JlaGF2aW9yX3pvb21XaGVlbCkge1xuICAgICAgZDNfYmVoYXZpb3Jfem9vbVdoZWVsID0gXCJvbndoZWVsXCIgaW4gZDNfZG9jdW1lbnQgPyAoZDNfYmVoYXZpb3Jfem9vbURlbHRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAtZDMuZXZlbnQuZGVsdGFZICogKGQzLmV2ZW50LmRlbHRhTW9kZSA/IDEyMCA6IDEpO1xuICAgICAgfSwgXCJ3aGVlbFwiKSA6IFwib25tb3VzZXdoZWVsXCIgaW4gZDNfZG9jdW1lbnQgPyAoZDNfYmVoYXZpb3Jfem9vbURlbHRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkMy5ldmVudC53aGVlbERlbHRhO1xuICAgICAgfSwgXCJtb3VzZXdoZWVsXCIpIDogKGQzX2JlaGF2aW9yX3pvb21EZWx0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gLWQzLmV2ZW50LmRldGFpbDtcbiAgICAgIH0sIFwiTW96TW91c2VQaXhlbFNjcm9sbFwiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gem9vbShnKSB7XG4gICAgICBnLm9uKG1vdXNlZG93biwgbW91c2Vkb3duZWQpLm9uKGQzX2JlaGF2aW9yX3pvb21XaGVlbCArIFwiLnpvb21cIiwgbW91c2V3aGVlbGVkKS5vbihcImRibGNsaWNrLnpvb21cIiwgZGJsY2xpY2tlZCkub24odG91Y2hzdGFydCwgdG91Y2hzdGFydGVkKTtcbiAgICB9XG4gICAgem9vbS5ldmVudCA9IGZ1bmN0aW9uKGcpIHtcbiAgICAgIGcuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRpc3BhdGNoID0gZXZlbnQub2YodGhpcywgYXJndW1lbnRzKSwgdmlldzEgPSB2aWV3O1xuICAgICAgICBpZiAoZDNfdHJhbnNpdGlvbkluaGVyaXRJZCkge1xuICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS50cmFuc2l0aW9uKCkuZWFjaChcInN0YXJ0Lnpvb21cIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2aWV3ID0gdGhpcy5fX2NoYXJ0X18gfHwge1xuICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICBrOiAxXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgem9vbXN0YXJ0ZWQoZGlzcGF0Y2gpO1xuICAgICAgICAgIH0pLnR3ZWVuKFwiem9vbTp6b29tXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGR4ID0gc2l6ZVswXSwgZHkgPSBzaXplWzFdLCBjeCA9IGNlbnRlcjAgPyBjZW50ZXIwWzBdIDogZHggLyAyLCBjeSA9IGNlbnRlcjAgPyBjZW50ZXIwWzFdIDogZHkgLyAyLCBpID0gZDMuaW50ZXJwb2xhdGVab29tKFsgKGN4IC0gdmlldy54KSAvIHZpZXcuaywgKGN5IC0gdmlldy55KSAvIHZpZXcuaywgZHggLyB2aWV3LmsgXSwgWyAoY3ggLSB2aWV3MS54KSAvIHZpZXcxLmssIChjeSAtIHZpZXcxLnkpIC8gdmlldzEuaywgZHggLyB2aWV3MS5rIF0pO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgICAgICAgdmFyIGwgPSBpKHQpLCBrID0gZHggLyBsWzJdO1xuICAgICAgICAgICAgICB0aGlzLl9fY2hhcnRfXyA9IHZpZXcgPSB7XG4gICAgICAgICAgICAgICAgeDogY3ggLSBsWzBdICogayxcbiAgICAgICAgICAgICAgICB5OiBjeSAtIGxbMV0gKiBrLFxuICAgICAgICAgICAgICAgIGs6IGtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgem9vbWVkKGRpc3BhdGNoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSkuZWFjaChcImludGVycnVwdC56b29tXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgem9vbWVuZGVkKGRpc3BhdGNoKTtcbiAgICAgICAgICB9KS5lYWNoKFwiZW5kLnpvb21cIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB6b29tZW5kZWQoZGlzcGF0Y2gpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX19jaGFydF9fID0gdmlldztcbiAgICAgICAgICB6b29tc3RhcnRlZChkaXNwYXRjaCk7XG4gICAgICAgICAgem9vbWVkKGRpc3BhdGNoKTtcbiAgICAgICAgICB6b29tZW5kZWQoZGlzcGF0Y2gpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHpvb20udHJhbnNsYXRlID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gWyB2aWV3LngsIHZpZXcueSBdO1xuICAgICAgdmlldyA9IHtcbiAgICAgICAgeDogK19bMF0sXG4gICAgICAgIHk6ICtfWzFdLFxuICAgICAgICBrOiB2aWV3LmtcbiAgICAgIH07XG4gICAgICByZXNjYWxlKCk7XG4gICAgICByZXR1cm4gem9vbTtcbiAgICB9O1xuICAgIHpvb20uc2NhbGUgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB2aWV3Lms7XG4gICAgICB2aWV3ID0ge1xuICAgICAgICB4OiB2aWV3LngsXG4gICAgICAgIHk6IHZpZXcueSxcbiAgICAgICAgazogbnVsbFxuICAgICAgfTtcbiAgICAgIHNjYWxlVG8oK18pO1xuICAgICAgcmVzY2FsZSgpO1xuICAgICAgcmV0dXJuIHpvb207XG4gICAgfTtcbiAgICB6b29tLnNjYWxlRXh0ZW50ID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2NhbGVFeHRlbnQ7XG4gICAgICBzY2FsZUV4dGVudCA9IF8gPT0gbnVsbCA/IGQzX2JlaGF2aW9yX3pvb21JbmZpbml0eSA6IFsgK19bMF0sICtfWzFdIF07XG4gICAgICByZXR1cm4gem9vbTtcbiAgICB9O1xuICAgIHpvb20uY2VudGVyID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gY2VudGVyO1xuICAgICAgY2VudGVyID0gXyAmJiBbICtfWzBdLCArX1sxXSBdO1xuICAgICAgcmV0dXJuIHpvb207XG4gICAgfTtcbiAgICB6b29tLnNpemUgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzaXplO1xuICAgICAgc2l6ZSA9IF8gJiYgWyArX1swXSwgK19bMV0gXTtcbiAgICAgIHJldHVybiB6b29tO1xuICAgIH07XG4gICAgem9vbS5kdXJhdGlvbiA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGR1cmF0aW9uO1xuICAgICAgZHVyYXRpb24gPSArXztcbiAgICAgIHJldHVybiB6b29tO1xuICAgIH07XG4gICAgem9vbS54ID0gZnVuY3Rpb24oeikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4geDE7XG4gICAgICB4MSA9IHo7XG4gICAgICB4MCA9IHouY29weSgpO1xuICAgICAgdmlldyA9IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMCxcbiAgICAgICAgazogMVxuICAgICAgfTtcbiAgICAgIHJldHVybiB6b29tO1xuICAgIH07XG4gICAgem9vbS55ID0gZnVuY3Rpb24oeikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4geTE7XG4gICAgICB5MSA9IHo7XG4gICAgICB5MCA9IHouY29weSgpO1xuICAgICAgdmlldyA9IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMCxcbiAgICAgICAgazogMVxuICAgICAgfTtcbiAgICAgIHJldHVybiB6b29tO1xuICAgIH07XG4gICAgZnVuY3Rpb24gbG9jYXRpb24ocCkge1xuICAgICAgcmV0dXJuIFsgKHBbMF0gLSB2aWV3LngpIC8gdmlldy5rLCAocFsxXSAtIHZpZXcueSkgLyB2aWV3LmsgXTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcG9pbnQobCkge1xuICAgICAgcmV0dXJuIFsgbFswXSAqIHZpZXcuayArIHZpZXcueCwgbFsxXSAqIHZpZXcuayArIHZpZXcueSBdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzY2FsZVRvKHMpIHtcbiAgICAgIHZpZXcuayA9IE1hdGgubWF4KHNjYWxlRXh0ZW50WzBdLCBNYXRoLm1pbihzY2FsZUV4dGVudFsxXSwgcykpO1xuICAgIH1cbiAgICBmdW5jdGlvbiB0cmFuc2xhdGVUbyhwLCBsKSB7XG4gICAgICBsID0gcG9pbnQobCk7XG4gICAgICB2aWV3LnggKz0gcFswXSAtIGxbMF07XG4gICAgICB2aWV3LnkgKz0gcFsxXSAtIGxbMV07XG4gICAgfVxuICAgIGZ1bmN0aW9uIHpvb21Ubyh0aGF0LCBwLCBsLCBrKSB7XG4gICAgICB0aGF0Ll9fY2hhcnRfXyA9IHtcbiAgICAgICAgeDogdmlldy54LFxuICAgICAgICB5OiB2aWV3LnksXG4gICAgICAgIGs6IHZpZXcua1xuICAgICAgfTtcbiAgICAgIHNjYWxlVG8oTWF0aC5wb3coMiwgaykpO1xuICAgICAgdHJhbnNsYXRlVG8oY2VudGVyMCA9IHAsIGwpO1xuICAgICAgdGhhdCA9IGQzLnNlbGVjdCh0aGF0KTtcbiAgICAgIGlmIChkdXJhdGlvbiA+IDApIHRoYXQgPSB0aGF0LnRyYW5zaXRpb24oKS5kdXJhdGlvbihkdXJhdGlvbik7XG4gICAgICB0aGF0LmNhbGwoem9vbS5ldmVudCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlc2NhbGUoKSB7XG4gICAgICBpZiAoeDEpIHgxLmRvbWFpbih4MC5yYW5nZSgpLm1hcChmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiAoeCAtIHZpZXcueCkgLyB2aWV3Lms7XG4gICAgICB9KS5tYXAoeDAuaW52ZXJ0KSk7XG4gICAgICBpZiAoeTEpIHkxLmRvbWFpbih5MC5yYW5nZSgpLm1hcChmdW5jdGlvbih5KSB7XG4gICAgICAgIHJldHVybiAoeSAtIHZpZXcueSkgLyB2aWV3Lms7XG4gICAgICB9KS5tYXAoeTAuaW52ZXJ0KSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHpvb21zdGFydGVkKGRpc3BhdGNoKSB7XG4gICAgICBpZiAoIXpvb21pbmcrKykgZGlzcGF0Y2goe1xuICAgICAgICB0eXBlOiBcInpvb21zdGFydFwiXG4gICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gem9vbWVkKGRpc3BhdGNoKSB7XG4gICAgICByZXNjYWxlKCk7XG4gICAgICBkaXNwYXRjaCh7XG4gICAgICAgIHR5cGU6IFwiem9vbVwiLFxuICAgICAgICBzY2FsZTogdmlldy5rLFxuICAgICAgICB0cmFuc2xhdGU6IFsgdmlldy54LCB2aWV3LnkgXVxuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHpvb21lbmRlZChkaXNwYXRjaCkge1xuICAgICAgaWYgKCEtLXpvb21pbmcpIGRpc3BhdGNoKHtcbiAgICAgICAgdHlwZTogXCJ6b29tZW5kXCJcbiAgICAgIH0pLCBjZW50ZXIwID0gbnVsbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gbW91c2Vkb3duZWQoKSB7XG4gICAgICB2YXIgdGhhdCA9IHRoaXMsIGRpc3BhdGNoID0gZXZlbnQub2YodGhhdCwgYXJndW1lbnRzKSwgZHJhZ2dlZCA9IDAsIHN1YmplY3QgPSBkMy5zZWxlY3QoZDNfd2luZG93KHRoYXQpKS5vbihtb3VzZW1vdmUsIG1vdmVkKS5vbihtb3VzZXVwLCBlbmRlZCksIGxvY2F0aW9uMCA9IGxvY2F0aW9uKGQzLm1vdXNlKHRoYXQpKSwgZHJhZ1Jlc3RvcmUgPSBkM19ldmVudF9kcmFnU3VwcHJlc3ModGhhdCk7XG4gICAgICBkM19zZWxlY3Rpb25faW50ZXJydXB0LmNhbGwodGhhdCk7XG4gICAgICB6b29tc3RhcnRlZChkaXNwYXRjaCk7XG4gICAgICBmdW5jdGlvbiBtb3ZlZCgpIHtcbiAgICAgICAgZHJhZ2dlZCA9IDE7XG4gICAgICAgIHRyYW5zbGF0ZVRvKGQzLm1vdXNlKHRoYXQpLCBsb2NhdGlvbjApO1xuICAgICAgICB6b29tZWQoZGlzcGF0Y2gpO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gZW5kZWQoKSB7XG4gICAgICAgIHN1YmplY3Qub24obW91c2Vtb3ZlLCBudWxsKS5vbihtb3VzZXVwLCBudWxsKTtcbiAgICAgICAgZHJhZ1Jlc3RvcmUoZHJhZ2dlZCk7XG4gICAgICAgIHpvb21lbmRlZChkaXNwYXRjaCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvdWNoc3RhcnRlZCgpIHtcbiAgICAgIHZhciB0aGF0ID0gdGhpcywgZGlzcGF0Y2ggPSBldmVudC5vZih0aGF0LCBhcmd1bWVudHMpLCBsb2NhdGlvbnMwID0ge30sIGRpc3RhbmNlMCA9IDAsIHNjYWxlMCwgem9vbU5hbWUgPSBcIi56b29tLVwiICsgZDMuZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uaWRlbnRpZmllciwgdG91Y2htb3ZlID0gXCJ0b3VjaG1vdmVcIiArIHpvb21OYW1lLCB0b3VjaGVuZCA9IFwidG91Y2hlbmRcIiArIHpvb21OYW1lLCB0YXJnZXRzID0gW10sIHN1YmplY3QgPSBkMy5zZWxlY3QodGhhdCksIGRyYWdSZXN0b3JlID0gZDNfZXZlbnRfZHJhZ1N1cHByZXNzKHRoYXQpO1xuICAgICAgc3RhcnRlZCgpO1xuICAgICAgem9vbXN0YXJ0ZWQoZGlzcGF0Y2gpO1xuICAgICAgc3ViamVjdC5vbihtb3VzZWRvd24sIG51bGwpLm9uKHRvdWNoc3RhcnQsIHN0YXJ0ZWQpO1xuICAgICAgZnVuY3Rpb24gcmVsb2NhdGUoKSB7XG4gICAgICAgIHZhciB0b3VjaGVzID0gZDMudG91Y2hlcyh0aGF0KTtcbiAgICAgICAgc2NhbGUwID0gdmlldy5rO1xuICAgICAgICB0b3VjaGVzLmZvckVhY2goZnVuY3Rpb24odCkge1xuICAgICAgICAgIGlmICh0LmlkZW50aWZpZXIgaW4gbG9jYXRpb25zMCkgbG9jYXRpb25zMFt0LmlkZW50aWZpZXJdID0gbG9jYXRpb24odCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdG91Y2hlcztcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIHN0YXJ0ZWQoKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSBkMy5ldmVudC50YXJnZXQ7XG4gICAgICAgIGQzLnNlbGVjdCh0YXJnZXQpLm9uKHRvdWNobW92ZSwgbW92ZWQpLm9uKHRvdWNoZW5kLCBlbmRlZCk7XG4gICAgICAgIHRhcmdldHMucHVzaCh0YXJnZXQpO1xuICAgICAgICB2YXIgY2hhbmdlZCA9IGQzLmV2ZW50LmNoYW5nZWRUb3VjaGVzO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGNoYW5nZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgbG9jYXRpb25zMFtjaGFuZ2VkW2ldLmlkZW50aWZpZXJdID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdG91Y2hlcyA9IHJlbG9jYXRlKCksIG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIGlmICh0b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIGlmIChub3cgLSB0b3VjaHRpbWUgPCA1MDApIHtcbiAgICAgICAgICAgIHZhciBwID0gdG91Y2hlc1swXTtcbiAgICAgICAgICAgIHpvb21Ubyh0aGF0LCBwLCBsb2NhdGlvbnMwW3AuaWRlbnRpZmllcl0sIE1hdGguZmxvb3IoTWF0aC5sb2codmlldy5rKSAvIE1hdGguTE4yKSArIDEpO1xuICAgICAgICAgICAgZDNfZXZlbnRQcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0b3VjaHRpbWUgPSBub3c7XG4gICAgICAgIH0gZWxzZSBpZiAodG91Y2hlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgdmFyIHAgPSB0b3VjaGVzWzBdLCBxID0gdG91Y2hlc1sxXSwgZHggPSBwWzBdIC0gcVswXSwgZHkgPSBwWzFdIC0gcVsxXTtcbiAgICAgICAgICBkaXN0YW5jZTAgPSBkeCAqIGR4ICsgZHkgKiBkeTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnVuY3Rpb24gbW92ZWQoKSB7XG4gICAgICAgIHZhciB0b3VjaGVzID0gZDMudG91Y2hlcyh0aGF0KSwgcDAsIGwwLCBwMSwgbDE7XG4gICAgICAgIGQzX3NlbGVjdGlvbl9pbnRlcnJ1cHQuY2FsbCh0aGF0KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSB0b3VjaGVzLmxlbmd0aDsgaSA8IG47ICsraSwgbDEgPSBudWxsKSB7XG4gICAgICAgICAgcDEgPSB0b3VjaGVzW2ldO1xuICAgICAgICAgIGlmIChsMSA9IGxvY2F0aW9uczBbcDEuaWRlbnRpZmllcl0pIHtcbiAgICAgICAgICAgIGlmIChsMCkgYnJlYWs7XG4gICAgICAgICAgICBwMCA9IHAxLCBsMCA9IGwxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobDEpIHtcbiAgICAgICAgICB2YXIgZGlzdGFuY2UxID0gKGRpc3RhbmNlMSA9IHAxWzBdIC0gcDBbMF0pICogZGlzdGFuY2UxICsgKGRpc3RhbmNlMSA9IHAxWzFdIC0gcDBbMV0pICogZGlzdGFuY2UxLCBzY2FsZTEgPSBkaXN0YW5jZTAgJiYgTWF0aC5zcXJ0KGRpc3RhbmNlMSAvIGRpc3RhbmNlMCk7XG4gICAgICAgICAgcDAgPSBbIChwMFswXSArIHAxWzBdKSAvIDIsIChwMFsxXSArIHAxWzFdKSAvIDIgXTtcbiAgICAgICAgICBsMCA9IFsgKGwwWzBdICsgbDFbMF0pIC8gMiwgKGwwWzFdICsgbDFbMV0pIC8gMiBdO1xuICAgICAgICAgIHNjYWxlVG8oc2NhbGUxICogc2NhbGUwKTtcbiAgICAgICAgfVxuICAgICAgICB0b3VjaHRpbWUgPSBudWxsO1xuICAgICAgICB0cmFuc2xhdGVUbyhwMCwgbDApO1xuICAgICAgICB6b29tZWQoZGlzcGF0Y2gpO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gZW5kZWQoKSB7XG4gICAgICAgIGlmIChkMy5ldmVudC50b3VjaGVzLmxlbmd0aCkge1xuICAgICAgICAgIHZhciBjaGFuZ2VkID0gZDMuZXZlbnQuY2hhbmdlZFRvdWNoZXM7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBjaGFuZ2VkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgZGVsZXRlIGxvY2F0aW9uczBbY2hhbmdlZFtpXS5pZGVudGlmaWVyXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yICh2YXIgaWRlbnRpZmllciBpbiBsb2NhdGlvbnMwKSB7XG4gICAgICAgICAgICByZXR1cm4gdm9pZCByZWxvY2F0ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBkMy5zZWxlY3RBbGwodGFyZ2V0cykub24oem9vbU5hbWUsIG51bGwpO1xuICAgICAgICBzdWJqZWN0Lm9uKG1vdXNlZG93biwgbW91c2Vkb3duZWQpLm9uKHRvdWNoc3RhcnQsIHRvdWNoc3RhcnRlZCk7XG4gICAgICAgIGRyYWdSZXN0b3JlKCk7XG4gICAgICAgIHpvb21lbmRlZChkaXNwYXRjaCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG1vdXNld2hlZWxlZCgpIHtcbiAgICAgIHZhciBkaXNwYXRjaCA9IGV2ZW50Lm9mKHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICBpZiAobW91c2V3aGVlbFRpbWVyKSBjbGVhclRpbWVvdXQobW91c2V3aGVlbFRpbWVyKTsgZWxzZSBkM19zZWxlY3Rpb25faW50ZXJydXB0LmNhbGwodGhpcyksIFxuICAgICAgdHJhbnNsYXRlMCA9IGxvY2F0aW9uKGNlbnRlcjAgPSBjZW50ZXIgfHwgZDMubW91c2UodGhpcykpLCB6b29tc3RhcnRlZChkaXNwYXRjaCk7XG4gICAgICBtb3VzZXdoZWVsVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBtb3VzZXdoZWVsVGltZXIgPSBudWxsO1xuICAgICAgICB6b29tZW5kZWQoZGlzcGF0Y2gpO1xuICAgICAgfSwgNTApO1xuICAgICAgZDNfZXZlbnRQcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2NhbGVUbyhNYXRoLnBvdygyLCBkM19iZWhhdmlvcl96b29tRGVsdGEoKSAqIC4wMDIpICogdmlldy5rKTtcbiAgICAgIHRyYW5zbGF0ZVRvKGNlbnRlcjAsIHRyYW5zbGF0ZTApO1xuICAgICAgem9vbWVkKGRpc3BhdGNoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGJsY2xpY2tlZCgpIHtcbiAgICAgIHZhciBwID0gZDMubW91c2UodGhpcyksIGsgPSBNYXRoLmxvZyh2aWV3LmspIC8gTWF0aC5MTjI7XG4gICAgICB6b29tVG8odGhpcywgcCwgbG9jYXRpb24ocCksIGQzLmV2ZW50LnNoaWZ0S2V5ID8gTWF0aC5jZWlsKGspIC0gMSA6IE1hdGguZmxvb3IoaykgKyAxKTtcbiAgICB9XG4gICAgcmV0dXJuIGQzLnJlYmluZCh6b29tLCBldmVudCwgXCJvblwiKTtcbiAgfTtcbiAgdmFyIGQzX2JlaGF2aW9yX3pvb21JbmZpbml0eSA9IFsgMCwgSW5maW5pdHkgXSwgZDNfYmVoYXZpb3Jfem9vbURlbHRhLCBkM19iZWhhdmlvcl96b29tV2hlZWw7XG4gIGQzLmNvbG9yID0gZDNfY29sb3I7XG4gIGZ1bmN0aW9uIGQzX2NvbG9yKCkge31cbiAgZDNfY29sb3IucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmdiKCkgKyBcIlwiO1xuICB9O1xuICBkMy5oc2wgPSBkM19oc2w7XG4gIGZ1bmN0aW9uIGQzX2hzbChoLCBzLCBsKSB7XG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBkM19oc2wgPyB2b2lkICh0aGlzLmggPSAraCwgdGhpcy5zID0gK3MsIHRoaXMubCA9ICtsKSA6IGFyZ3VtZW50cy5sZW5ndGggPCAyID8gaCBpbnN0YW5jZW9mIGQzX2hzbCA/IG5ldyBkM19oc2woaC5oLCBoLnMsIGgubCkgOiBkM19yZ2JfcGFyc2UoXCJcIiArIGgsIGQzX3JnYl9oc2wsIGQzX2hzbCkgOiBuZXcgZDNfaHNsKGgsIHMsIGwpO1xuICB9XG4gIHZhciBkM19oc2xQcm90b3R5cGUgPSBkM19oc2wucHJvdG90eXBlID0gbmV3IGQzX2NvbG9yKCk7XG4gIGQzX2hzbFByb3RvdHlwZS5icmlnaHRlciA9IGZ1bmN0aW9uKGspIHtcbiAgICBrID0gTWF0aC5wb3coLjcsIGFyZ3VtZW50cy5sZW5ndGggPyBrIDogMSk7XG4gICAgcmV0dXJuIG5ldyBkM19oc2wodGhpcy5oLCB0aGlzLnMsIHRoaXMubCAvIGspO1xuICB9O1xuICBkM19oc2xQcm90b3R5cGUuZGFya2VyID0gZnVuY3Rpb24oaykge1xuICAgIGsgPSBNYXRoLnBvdyguNywgYXJndW1lbnRzLmxlbmd0aCA/IGsgOiAxKTtcbiAgICByZXR1cm4gbmV3IGQzX2hzbCh0aGlzLmgsIHRoaXMucywgayAqIHRoaXMubCk7XG4gIH07XG4gIGQzX2hzbFByb3RvdHlwZS5yZ2IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfaHNsX3JnYih0aGlzLmgsIHRoaXMucywgdGhpcy5sKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfaHNsX3JnYihoLCBzLCBsKSB7XG4gICAgdmFyIG0xLCBtMjtcbiAgICBoID0gaXNOYU4oaCkgPyAwIDogKGggJT0gMzYwKSA8IDAgPyBoICsgMzYwIDogaDtcbiAgICBzID0gaXNOYU4ocykgPyAwIDogcyA8IDAgPyAwIDogcyA+IDEgPyAxIDogcztcbiAgICBsID0gbCA8IDAgPyAwIDogbCA+IDEgPyAxIDogbDtcbiAgICBtMiA9IGwgPD0gLjUgPyBsICogKDEgKyBzKSA6IGwgKyBzIC0gbCAqIHM7XG4gICAgbTEgPSAyICogbCAtIG0yO1xuICAgIGZ1bmN0aW9uIHYoaCkge1xuICAgICAgaWYgKGggPiAzNjApIGggLT0gMzYwOyBlbHNlIGlmIChoIDwgMCkgaCArPSAzNjA7XG4gICAgICBpZiAoaCA8IDYwKSByZXR1cm4gbTEgKyAobTIgLSBtMSkgKiBoIC8gNjA7XG4gICAgICBpZiAoaCA8IDE4MCkgcmV0dXJuIG0yO1xuICAgICAgaWYgKGggPCAyNDApIHJldHVybiBtMSArIChtMiAtIG0xKSAqICgyNDAgLSBoKSAvIDYwO1xuICAgICAgcmV0dXJuIG0xO1xuICAgIH1cbiAgICBmdW5jdGlvbiB2dihoKSB7XG4gICAgICByZXR1cm4gTWF0aC5yb3VuZCh2KGgpICogMjU1KTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBkM19yZ2IodnYoaCArIDEyMCksIHZ2KGgpLCB2dihoIC0gMTIwKSk7XG4gIH1cbiAgZDMuaGNsID0gZDNfaGNsO1xuICBmdW5jdGlvbiBkM19oY2woaCwgYywgbCkge1xuICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgZDNfaGNsID8gdm9pZCAodGhpcy5oID0gK2gsIHRoaXMuYyA9ICtjLCB0aGlzLmwgPSArbCkgOiBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGggaW5zdGFuY2VvZiBkM19oY2wgPyBuZXcgZDNfaGNsKGguaCwgaC5jLCBoLmwpIDogaCBpbnN0YW5jZW9mIGQzX2xhYiA/IGQzX2xhYl9oY2woaC5sLCBoLmEsIGguYikgOiBkM19sYWJfaGNsKChoID0gZDNfcmdiX2xhYigoaCA9IGQzLnJnYihoKSkuciwgaC5nLCBoLmIpKS5sLCBoLmEsIGguYikgOiBuZXcgZDNfaGNsKGgsIGMsIGwpO1xuICB9XG4gIHZhciBkM19oY2xQcm90b3R5cGUgPSBkM19oY2wucHJvdG90eXBlID0gbmV3IGQzX2NvbG9yKCk7XG4gIGQzX2hjbFByb3RvdHlwZS5icmlnaHRlciA9IGZ1bmN0aW9uKGspIHtcbiAgICByZXR1cm4gbmV3IGQzX2hjbCh0aGlzLmgsIHRoaXMuYywgTWF0aC5taW4oMTAwLCB0aGlzLmwgKyBkM19sYWJfSyAqIChhcmd1bWVudHMubGVuZ3RoID8gayA6IDEpKSk7XG4gIH07XG4gIGQzX2hjbFByb3RvdHlwZS5kYXJrZXIgPSBmdW5jdGlvbihrKSB7XG4gICAgcmV0dXJuIG5ldyBkM19oY2wodGhpcy5oLCB0aGlzLmMsIE1hdGgubWF4KDAsIHRoaXMubCAtIGQzX2xhYl9LICogKGFyZ3VtZW50cy5sZW5ndGggPyBrIDogMSkpKTtcbiAgfTtcbiAgZDNfaGNsUHJvdG90eXBlLnJnYiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM19oY2xfbGFiKHRoaXMuaCwgdGhpcy5jLCB0aGlzLmwpLnJnYigpO1xuICB9O1xuICBmdW5jdGlvbiBkM19oY2xfbGFiKGgsIGMsIGwpIHtcbiAgICBpZiAoaXNOYU4oaCkpIGggPSAwO1xuICAgIGlmIChpc05hTihjKSkgYyA9IDA7XG4gICAgcmV0dXJuIG5ldyBkM19sYWIobCwgTWF0aC5jb3MoaCAqPSBkM19yYWRpYW5zKSAqIGMsIE1hdGguc2luKGgpICogYyk7XG4gIH1cbiAgZDMubGFiID0gZDNfbGFiO1xuICBmdW5jdGlvbiBkM19sYWIobCwgYSwgYikge1xuICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgZDNfbGFiID8gdm9pZCAodGhpcy5sID0gK2wsIHRoaXMuYSA9ICthLCB0aGlzLmIgPSArYikgOiBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGwgaW5zdGFuY2VvZiBkM19sYWIgPyBuZXcgZDNfbGFiKGwubCwgbC5hLCBsLmIpIDogbCBpbnN0YW5jZW9mIGQzX2hjbCA/IGQzX2hjbF9sYWIobC5oLCBsLmMsIGwubCkgOiBkM19yZ2JfbGFiKChsID0gZDNfcmdiKGwpKS5yLCBsLmcsIGwuYikgOiBuZXcgZDNfbGFiKGwsIGEsIGIpO1xuICB9XG4gIHZhciBkM19sYWJfSyA9IDE4O1xuICB2YXIgZDNfbGFiX1ggPSAuOTUwNDcsIGQzX2xhYl9ZID0gMSwgZDNfbGFiX1ogPSAxLjA4ODgzO1xuICB2YXIgZDNfbGFiUHJvdG90eXBlID0gZDNfbGFiLnByb3RvdHlwZSA9IG5ldyBkM19jb2xvcigpO1xuICBkM19sYWJQcm90b3R5cGUuYnJpZ2h0ZXIgPSBmdW5jdGlvbihrKSB7XG4gICAgcmV0dXJuIG5ldyBkM19sYWIoTWF0aC5taW4oMTAwLCB0aGlzLmwgKyBkM19sYWJfSyAqIChhcmd1bWVudHMubGVuZ3RoID8gayA6IDEpKSwgdGhpcy5hLCB0aGlzLmIpO1xuICB9O1xuICBkM19sYWJQcm90b3R5cGUuZGFya2VyID0gZnVuY3Rpb24oaykge1xuICAgIHJldHVybiBuZXcgZDNfbGFiKE1hdGgubWF4KDAsIHRoaXMubCAtIGQzX2xhYl9LICogKGFyZ3VtZW50cy5sZW5ndGggPyBrIDogMSkpLCB0aGlzLmEsIHRoaXMuYik7XG4gIH07XG4gIGQzX2xhYlByb3RvdHlwZS5yZ2IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfbGFiX3JnYih0aGlzLmwsIHRoaXMuYSwgdGhpcy5iKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfbGFiX3JnYihsLCBhLCBiKSB7XG4gICAgdmFyIHkgPSAobCArIDE2KSAvIDExNiwgeCA9IHkgKyBhIC8gNTAwLCB6ID0geSAtIGIgLyAyMDA7XG4gICAgeCA9IGQzX2xhYl94eXooeCkgKiBkM19sYWJfWDtcbiAgICB5ID0gZDNfbGFiX3h5eih5KSAqIGQzX2xhYl9ZO1xuICAgIHogPSBkM19sYWJfeHl6KHopICogZDNfbGFiX1o7XG4gICAgcmV0dXJuIG5ldyBkM19yZ2IoZDNfeHl6X3JnYigzLjI0MDQ1NDIgKiB4IC0gMS41MzcxMzg1ICogeSAtIC40OTg1MzE0ICogeiksIGQzX3h5el9yZ2IoLS45NjkyNjYgKiB4ICsgMS44NzYwMTA4ICogeSArIC4wNDE1NTYgKiB6KSwgZDNfeHl6X3JnYiguMDU1NjQzNCAqIHggLSAuMjA0MDI1OSAqIHkgKyAxLjA1NzIyNTIgKiB6KSk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGFiX2hjbChsLCBhLCBiKSB7XG4gICAgcmV0dXJuIGwgPiAwID8gbmV3IGQzX2hjbChNYXRoLmF0YW4yKGIsIGEpICogZDNfZGVncmVlcywgTWF0aC5zcXJ0KGEgKiBhICsgYiAqIGIpLCBsKSA6IG5ldyBkM19oY2woTmFOLCBOYU4sIGwpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xhYl94eXooeCkge1xuICAgIHJldHVybiB4ID4gLjIwNjg5MzAzNCA/IHggKiB4ICogeCA6ICh4IC0gNCAvIDI5KSAvIDcuNzg3MDM3O1xuICB9XG4gIGZ1bmN0aW9uIGQzX3h5el9sYWIoeCkge1xuICAgIHJldHVybiB4ID4gLjAwODg1NiA/IE1hdGgucG93KHgsIDEgLyAzKSA6IDcuNzg3MDM3ICogeCArIDQgLyAyOTtcbiAgfVxuICBmdW5jdGlvbiBkM194eXpfcmdiKHIpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCgyNTUgKiAociA8PSAuMDAzMDQgPyAxMi45MiAqIHIgOiAxLjA1NSAqIE1hdGgucG93KHIsIDEgLyAyLjQpIC0gLjA1NSkpO1xuICB9XG4gIGQzLnJnYiA9IGQzX3JnYjtcbiAgZnVuY3Rpb24gZDNfcmdiKHIsIGcsIGIpIHtcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIGQzX3JnYiA/IHZvaWQgKHRoaXMuciA9IH5+ciwgdGhpcy5nID0gfn5nLCB0aGlzLmIgPSB+fmIpIDogYXJndW1lbnRzLmxlbmd0aCA8IDIgPyByIGluc3RhbmNlb2YgZDNfcmdiID8gbmV3IGQzX3JnYihyLnIsIHIuZywgci5iKSA6IGQzX3JnYl9wYXJzZShcIlwiICsgciwgZDNfcmdiLCBkM19oc2xfcmdiKSA6IG5ldyBkM19yZ2IociwgZywgYik7XG4gIH1cbiAgZnVuY3Rpb24gZDNfcmdiTnVtYmVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIG5ldyBkM19yZ2IodmFsdWUgPj4gMTYsIHZhbHVlID4+IDggJiAyNTUsIHZhbHVlICYgMjU1KTtcbiAgfVxuICBmdW5jdGlvbiBkM19yZ2JTdHJpbmcodmFsdWUpIHtcbiAgICByZXR1cm4gZDNfcmdiTnVtYmVyKHZhbHVlKSArIFwiXCI7XG4gIH1cbiAgdmFyIGQzX3JnYlByb3RvdHlwZSA9IGQzX3JnYi5wcm90b3R5cGUgPSBuZXcgZDNfY29sb3IoKTtcbiAgZDNfcmdiUHJvdG90eXBlLmJyaWdodGVyID0gZnVuY3Rpb24oaykge1xuICAgIGsgPSBNYXRoLnBvdyguNywgYXJndW1lbnRzLmxlbmd0aCA/IGsgOiAxKTtcbiAgICB2YXIgciA9IHRoaXMuciwgZyA9IHRoaXMuZywgYiA9IHRoaXMuYiwgaSA9IDMwO1xuICAgIGlmICghciAmJiAhZyAmJiAhYikgcmV0dXJuIG5ldyBkM19yZ2IoaSwgaSwgaSk7XG4gICAgaWYgKHIgJiYgciA8IGkpIHIgPSBpO1xuICAgIGlmIChnICYmIGcgPCBpKSBnID0gaTtcbiAgICBpZiAoYiAmJiBiIDwgaSkgYiA9IGk7XG4gICAgcmV0dXJuIG5ldyBkM19yZ2IoTWF0aC5taW4oMjU1LCByIC8gayksIE1hdGgubWluKDI1NSwgZyAvIGspLCBNYXRoLm1pbigyNTUsIGIgLyBrKSk7XG4gIH07XG4gIGQzX3JnYlByb3RvdHlwZS5kYXJrZXIgPSBmdW5jdGlvbihrKSB7XG4gICAgayA9IE1hdGgucG93KC43LCBhcmd1bWVudHMubGVuZ3RoID8gayA6IDEpO1xuICAgIHJldHVybiBuZXcgZDNfcmdiKGsgKiB0aGlzLnIsIGsgKiB0aGlzLmcsIGsgKiB0aGlzLmIpO1xuICB9O1xuICBkM19yZ2JQcm90b3R5cGUuaHNsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGQzX3JnYl9oc2wodGhpcy5yLCB0aGlzLmcsIHRoaXMuYik7XG4gIH07XG4gIGQzX3JnYlByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIiNcIiArIGQzX3JnYl9oZXgodGhpcy5yKSArIGQzX3JnYl9oZXgodGhpcy5nKSArIGQzX3JnYl9oZXgodGhpcy5iKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfcmdiX2hleCh2KSB7XG4gICAgcmV0dXJuIHYgPCAxNiA/IFwiMFwiICsgTWF0aC5tYXgoMCwgdikudG9TdHJpbmcoMTYpIDogTWF0aC5taW4oMjU1LCB2KS50b1N0cmluZygxNik7XG4gIH1cbiAgZnVuY3Rpb24gZDNfcmdiX3BhcnNlKGZvcm1hdCwgcmdiLCBoc2wpIHtcbiAgICB2YXIgciA9IDAsIGcgPSAwLCBiID0gMCwgbTEsIG0yLCBjb2xvcjtcbiAgICBtMSA9IC8oW2Etel0rKVxcKCguKilcXCkvLmV4ZWMoZm9ybWF0ID0gZm9ybWF0LnRvTG93ZXJDYXNlKCkpO1xuICAgIGlmIChtMSkge1xuICAgICAgbTIgPSBtMVsyXS5zcGxpdChcIixcIik7XG4gICAgICBzd2l0Y2ggKG0xWzFdKSB7XG4gICAgICAgY2FzZSBcImhzbFwiOlxuICAgICAgICB7XG4gICAgICAgICAgcmV0dXJuIGhzbChwYXJzZUZsb2F0KG0yWzBdKSwgcGFyc2VGbG9hdChtMlsxXSkgLyAxMDAsIHBhcnNlRmxvYXQobTJbMl0pIC8gMTAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgY2FzZSBcInJnYlwiOlxuICAgICAgICB7XG4gICAgICAgICAgcmV0dXJuIHJnYihkM19yZ2JfcGFyc2VOdW1iZXIobTJbMF0pLCBkM19yZ2JfcGFyc2VOdW1iZXIobTJbMV0pLCBkM19yZ2JfcGFyc2VOdW1iZXIobTJbMl0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY29sb3IgPSBkM19yZ2JfbmFtZXMuZ2V0KGZvcm1hdCkpIHtcbiAgICAgIHJldHVybiByZ2IoY29sb3IuciwgY29sb3IuZywgY29sb3IuYik7XG4gICAgfVxuICAgIGlmIChmb3JtYXQgIT0gbnVsbCAmJiBmb3JtYXQuY2hhckF0KDApID09PSBcIiNcIiAmJiAhaXNOYU4oY29sb3IgPSBwYXJzZUludChmb3JtYXQuc2xpY2UoMSksIDE2KSkpIHtcbiAgICAgIGlmIChmb3JtYXQubGVuZ3RoID09PSA0KSB7XG4gICAgICAgIHIgPSAoY29sb3IgJiAzODQwKSA+PiA0O1xuICAgICAgICByID0gciA+PiA0IHwgcjtcbiAgICAgICAgZyA9IGNvbG9yICYgMjQwO1xuICAgICAgICBnID0gZyA+PiA0IHwgZztcbiAgICAgICAgYiA9IGNvbG9yICYgMTU7XG4gICAgICAgIGIgPSBiIDw8IDQgfCBiO1xuICAgICAgfSBlbHNlIGlmIChmb3JtYXQubGVuZ3RoID09PSA3KSB7XG4gICAgICAgIHIgPSAoY29sb3IgJiAxNjcxMTY4MCkgPj4gMTY7XG4gICAgICAgIGcgPSAoY29sb3IgJiA2NTI4MCkgPj4gODtcbiAgICAgICAgYiA9IGNvbG9yICYgMjU1O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmdiKHIsIGcsIGIpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3JnYl9oc2wociwgZywgYikge1xuICAgIHZhciBtaW4gPSBNYXRoLm1pbihyIC89IDI1NSwgZyAvPSAyNTUsIGIgLz0gMjU1KSwgbWF4ID0gTWF0aC5tYXgociwgZywgYiksIGQgPSBtYXggLSBtaW4sIGgsIHMsIGwgPSAobWF4ICsgbWluKSAvIDI7XG4gICAgaWYgKGQpIHtcbiAgICAgIHMgPSBsIDwgLjUgPyBkIC8gKG1heCArIG1pbikgOiBkIC8gKDIgLSBtYXggLSBtaW4pO1xuICAgICAgaWYgKHIgPT0gbWF4KSBoID0gKGcgLSBiKSAvIGQgKyAoZyA8IGIgPyA2IDogMCk7IGVsc2UgaWYgKGcgPT0gbWF4KSBoID0gKGIgLSByKSAvIGQgKyAyOyBlbHNlIGggPSAociAtIGcpIC8gZCArIDQ7XG4gICAgICBoICo9IDYwO1xuICAgIH0gZWxzZSB7XG4gICAgICBoID0gTmFOO1xuICAgICAgcyA9IGwgPiAwICYmIGwgPCAxID8gMCA6IGg7XG4gICAgfVxuICAgIHJldHVybiBuZXcgZDNfaHNsKGgsIHMsIGwpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3JnYl9sYWIociwgZywgYikge1xuICAgIHIgPSBkM19yZ2JfeHl6KHIpO1xuICAgIGcgPSBkM19yZ2JfeHl6KGcpO1xuICAgIGIgPSBkM19yZ2JfeHl6KGIpO1xuICAgIHZhciB4ID0gZDNfeHl6X2xhYigoLjQxMjQ1NjQgKiByICsgLjM1NzU3NjEgKiBnICsgLjE4MDQzNzUgKiBiKSAvIGQzX2xhYl9YKSwgeSA9IGQzX3h5el9sYWIoKC4yMTI2NzI5ICogciArIC43MTUxNTIyICogZyArIC4wNzIxNzUgKiBiKSAvIGQzX2xhYl9ZKSwgeiA9IGQzX3h5el9sYWIoKC4wMTkzMzM5ICogciArIC4xMTkxOTIgKiBnICsgLjk1MDMwNDEgKiBiKSAvIGQzX2xhYl9aKTtcbiAgICByZXR1cm4gZDNfbGFiKDExNiAqIHkgLSAxNiwgNTAwICogKHggLSB5KSwgMjAwICogKHkgLSB6KSk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfcmdiX3h5eihyKSB7XG4gICAgcmV0dXJuIChyIC89IDI1NSkgPD0gLjA0MDQ1ID8gciAvIDEyLjkyIDogTWF0aC5wb3coKHIgKyAuMDU1KSAvIDEuMDU1LCAyLjQpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3JnYl9wYXJzZU51bWJlcihjKSB7XG4gICAgdmFyIGYgPSBwYXJzZUZsb2F0KGMpO1xuICAgIHJldHVybiBjLmNoYXJBdChjLmxlbmd0aCAtIDEpID09PSBcIiVcIiA/IE1hdGgucm91bmQoZiAqIDIuNTUpIDogZjtcbiAgfVxuICB2YXIgZDNfcmdiX25hbWVzID0gZDMubWFwKHtcbiAgICBhbGljZWJsdWU6IDE1NzkyMzgzLFxuICAgIGFudGlxdWV3aGl0ZTogMTY0NDQzNzUsXG4gICAgYXF1YTogNjU1MzUsXG4gICAgYXF1YW1hcmluZTogODM4ODU2NCxcbiAgICBhenVyZTogMTU3OTQxNzUsXG4gICAgYmVpZ2U6IDE2MTE5MjYwLFxuICAgIGJpc3F1ZTogMTY3NzAyNDQsXG4gICAgYmxhY2s6IDAsXG4gICAgYmxhbmNoZWRhbG1vbmQ6IDE2NzcyMDQ1LFxuICAgIGJsdWU6IDI1NSxcbiAgICBibHVldmlvbGV0OiA5MDU1MjAyLFxuICAgIGJyb3duOiAxMDgyNDIzNCxcbiAgICBidXJseXdvb2Q6IDE0NTk2MjMxLFxuICAgIGNhZGV0Ymx1ZTogNjI2NjUyOCxcbiAgICBjaGFydHJldXNlOiA4Mzg4MzUyLFxuICAgIGNob2NvbGF0ZTogMTM3ODk0NzAsXG4gICAgY29yYWw6IDE2NzQ0MjcyLFxuICAgIGNvcm5mbG93ZXJibHVlOiA2NTkxOTgxLFxuICAgIGNvcm5zaWxrOiAxNjc3NTM4OCxcbiAgICBjcmltc29uOiAxNDQyMzEwMCxcbiAgICBjeWFuOiA2NTUzNSxcbiAgICBkYXJrYmx1ZTogMTM5LFxuICAgIGRhcmtjeWFuOiAzNTcyMyxcbiAgICBkYXJrZ29sZGVucm9kOiAxMjA5MjkzOSxcbiAgICBkYXJrZ3JheTogMTExMTkwMTcsXG4gICAgZGFya2dyZWVuOiAyNTYwMCxcbiAgICBkYXJrZ3JleTogMTExMTkwMTcsXG4gICAgZGFya2toYWtpOiAxMjQzMzI1OSxcbiAgICBkYXJrbWFnZW50YTogOTEwOTY0MyxcbiAgICBkYXJrb2xpdmVncmVlbjogNTU5Nzk5OSxcbiAgICBkYXJrb3JhbmdlOiAxNjc0NzUyMCxcbiAgICBkYXJrb3JjaGlkOiAxMDA0MDAxMixcbiAgICBkYXJrcmVkOiA5MTA5NTA0LFxuICAgIGRhcmtzYWxtb246IDE1MzA4NDEwLFxuICAgIGRhcmtzZWFncmVlbjogOTQxOTkxOSxcbiAgICBkYXJrc2xhdGVibHVlOiA0NzM0MzQ3LFxuICAgIGRhcmtzbGF0ZWdyYXk6IDMxMDA0OTUsXG4gICAgZGFya3NsYXRlZ3JleTogMzEwMDQ5NSxcbiAgICBkYXJrdHVycXVvaXNlOiA1Mjk0NSxcbiAgICBkYXJrdmlvbGV0OiA5Njk5NTM5LFxuICAgIGRlZXBwaW5rOiAxNjcxNjk0NyxcbiAgICBkZWVwc2t5Ymx1ZTogNDkxNTEsXG4gICAgZGltZ3JheTogNjkwODI2NSxcbiAgICBkaW1ncmV5OiA2OTA4MjY1LFxuICAgIGRvZGdlcmJsdWU6IDIwMDMxOTksXG4gICAgZmlyZWJyaWNrOiAxMTY3NDE0NixcbiAgICBmbG9yYWx3aGl0ZTogMTY3NzU5MjAsXG4gICAgZm9yZXN0Z3JlZW46IDIyNjM4NDIsXG4gICAgZnVjaHNpYTogMTY3MTE5MzUsXG4gICAgZ2FpbnNib3JvOiAxNDQ3NDQ2MCxcbiAgICBnaG9zdHdoaXRlOiAxNjMxNjY3MSxcbiAgICBnb2xkOiAxNjc2NjcyMCxcbiAgICBnb2xkZW5yb2Q6IDE0MzI5MTIwLFxuICAgIGdyYXk6IDg0MjE1MDQsXG4gICAgZ3JlZW46IDMyNzY4LFxuICAgIGdyZWVueWVsbG93OiAxMTQwMzA1NSxcbiAgICBncmV5OiA4NDIxNTA0LFxuICAgIGhvbmV5ZGV3OiAxNTc5NDE2MCxcbiAgICBob3RwaW5rOiAxNjczODc0MCxcbiAgICBpbmRpYW5yZWQ6IDEzNDU4NTI0LFxuICAgIGluZGlnbzogNDkxNTMzMCxcbiAgICBpdm9yeTogMTY3NzcyMDAsXG4gICAga2hha2k6IDE1Nzg3NjYwLFxuICAgIGxhdmVuZGVyOiAxNTEzMjQxMCxcbiAgICBsYXZlbmRlcmJsdXNoOiAxNjc3MzM2NSxcbiAgICBsYXduZ3JlZW46IDgxOTA5NzYsXG4gICAgbGVtb25jaGlmZm9uOiAxNjc3NTg4NSxcbiAgICBsaWdodGJsdWU6IDExMzkzMjU0LFxuICAgIGxpZ2h0Y29yYWw6IDE1NzYxNTM2LFxuICAgIGxpZ2h0Y3lhbjogMTQ3NDU1OTksXG4gICAgbGlnaHRnb2xkZW5yb2R5ZWxsb3c6IDE2NDQ4MjEwLFxuICAgIGxpZ2h0Z3JheTogMTM4ODIzMjMsXG4gICAgbGlnaHRncmVlbjogOTQ5ODI1NixcbiAgICBsaWdodGdyZXk6IDEzODgyMzIzLFxuICAgIGxpZ2h0cGluazogMTY3NTg0NjUsXG4gICAgbGlnaHRzYWxtb246IDE2NzUyNzYyLFxuICAgIGxpZ2h0c2VhZ3JlZW46IDIxNDI4OTAsXG4gICAgbGlnaHRza3libHVlOiA4OTAwMzQ2LFxuICAgIGxpZ2h0c2xhdGVncmF5OiA3ODMzNzUzLFxuICAgIGxpZ2h0c2xhdGVncmV5OiA3ODMzNzUzLFxuICAgIGxpZ2h0c3RlZWxibHVlOiAxMTU4NDczNCxcbiAgICBsaWdodHllbGxvdzogMTY3NzcxODQsXG4gICAgbGltZTogNjUyODAsXG4gICAgbGltZWdyZWVuOiAzMzI5MzMwLFxuICAgIGxpbmVuOiAxNjQ0NTY3MCxcbiAgICBtYWdlbnRhOiAxNjcxMTkzNSxcbiAgICBtYXJvb246IDgzODg2MDgsXG4gICAgbWVkaXVtYXF1YW1hcmluZTogNjczNzMyMixcbiAgICBtZWRpdW1ibHVlOiAyMDUsXG4gICAgbWVkaXVtb3JjaGlkOiAxMjIxMTY2NyxcbiAgICBtZWRpdW1wdXJwbGU6IDk2NjI2ODMsXG4gICAgbWVkaXVtc2VhZ3JlZW46IDM5NzgwOTcsXG4gICAgbWVkaXVtc2xhdGVibHVlOiA4MDg3NzkwLFxuICAgIG1lZGl1bXNwcmluZ2dyZWVuOiA2NDE1NCxcbiAgICBtZWRpdW10dXJxdW9pc2U6IDQ3NzIzMDAsXG4gICAgbWVkaXVtdmlvbGV0cmVkOiAxMzA0NzE3MyxcbiAgICBtaWRuaWdodGJsdWU6IDE2NDQ5MTIsXG4gICAgbWludGNyZWFtOiAxNjEyMTg1MCxcbiAgICBtaXN0eXJvc2U6IDE2NzcwMjczLFxuICAgIG1vY2Nhc2luOiAxNjc3MDIyOSxcbiAgICBuYXZham93aGl0ZTogMTY3Njg2ODUsXG4gICAgbmF2eTogMTI4LFxuICAgIG9sZGxhY2U6IDE2NjQzNTU4LFxuICAgIG9saXZlOiA4NDIxMzc2LFxuICAgIG9saXZlZHJhYjogNzA0ODczOSxcbiAgICBvcmFuZ2U6IDE2NzUzOTIwLFxuICAgIG9yYW5nZXJlZDogMTY3MjkzNDQsXG4gICAgb3JjaGlkOiAxNDMxNTczNCxcbiAgICBwYWxlZ29sZGVucm9kOiAxNTY1NzEzMCxcbiAgICBwYWxlZ3JlZW46IDEwMDI1ODgwLFxuICAgIHBhbGV0dXJxdW9pc2U6IDExNTI5OTY2LFxuICAgIHBhbGV2aW9sZXRyZWQ6IDE0MzgxMjAzLFxuICAgIHBhcGF5YXdoaXA6IDE2NzczMDc3LFxuICAgIHBlYWNocHVmZjogMTY3Njc2NzMsXG4gICAgcGVydTogMTM0Njg5OTEsXG4gICAgcGluazogMTY3NjEwMzUsXG4gICAgcGx1bTogMTQ1MjQ2MzcsXG4gICAgcG93ZGVyYmx1ZTogMTE1OTE5MTAsXG4gICAgcHVycGxlOiA4Mzg4NzM2LFxuICAgIHJlYmVjY2FwdXJwbGU6IDY2OTc4ODEsXG4gICAgcmVkOiAxNjcxMTY4MCxcbiAgICByb3N5YnJvd246IDEyMzU3NTE5LFxuICAgIHJveWFsYmx1ZTogNDI4Njk0NSxcbiAgICBzYWRkbGVicm93bjogOTEyNzE4NyxcbiAgICBzYWxtb246IDE2NDE2ODgyLFxuICAgIHNhbmR5YnJvd246IDE2MDMyODY0LFxuICAgIHNlYWdyZWVuOiAzMDUwMzI3LFxuICAgIHNlYXNoZWxsOiAxNjc3NDYzOCxcbiAgICBzaWVubmE6IDEwNTA2Nzk3LFxuICAgIHNpbHZlcjogMTI2MzIyNTYsXG4gICAgc2t5Ymx1ZTogODkwMDMzMSxcbiAgICBzbGF0ZWJsdWU6IDY5NzAwNjEsXG4gICAgc2xhdGVncmF5OiA3MzcyOTQ0LFxuICAgIHNsYXRlZ3JleTogNzM3Mjk0NCxcbiAgICBzbm93OiAxNjc3NTkzMCxcbiAgICBzcHJpbmdncmVlbjogNjU0MDcsXG4gICAgc3RlZWxibHVlOiA0NjIwOTgwLFxuICAgIHRhbjogMTM4MDg3ODAsXG4gICAgdGVhbDogMzI4OTYsXG4gICAgdGhpc3RsZTogMTQyMDQ4ODgsXG4gICAgdG9tYXRvOiAxNjczNzA5NSxcbiAgICB0dXJxdW9pc2U6IDQyNTE4NTYsXG4gICAgdmlvbGV0OiAxNTYzMTA4NixcbiAgICB3aGVhdDogMTYxMTMzMzEsXG4gICAgd2hpdGU6IDE2Nzc3MjE1LFxuICAgIHdoaXRlc21va2U6IDE2MTE5Mjg1LFxuICAgIHllbGxvdzogMTY3NzY5NjAsXG4gICAgeWVsbG93Z3JlZW46IDEwMTQ1MDc0XG4gIH0pO1xuICBkM19yZ2JfbmFtZXMuZm9yRWFjaChmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgZDNfcmdiX25hbWVzLnNldChrZXksIGQzX3JnYk51bWJlcih2YWx1ZSkpO1xuICB9KTtcbiAgZnVuY3Rpb24gZDNfZnVuY3Rvcih2KSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2ID09PSBcImZ1bmN0aW9uXCIgPyB2IDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdjtcbiAgICB9O1xuICB9XG4gIGQzLmZ1bmN0b3IgPSBkM19mdW5jdG9yO1xuICBkMy54aHIgPSBkM194aHJUeXBlKGQzX2lkZW50aXR5KTtcbiAgZnVuY3Rpb24gZDNfeGhyVHlwZShyZXNwb25zZSkge1xuICAgIHJldHVybiBmdW5jdGlvbih1cmwsIG1pbWVUeXBlLCBjYWxsYmFjaykge1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIgJiYgdHlwZW9mIG1pbWVUeXBlID09PSBcImZ1bmN0aW9uXCIpIGNhbGxiYWNrID0gbWltZVR5cGUsIFxuICAgICAgbWltZVR5cGUgPSBudWxsO1xuICAgICAgcmV0dXJuIGQzX3hocih1cmwsIG1pbWVUeXBlLCByZXNwb25zZSwgY2FsbGJhY2spO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gZDNfeGhyKHVybCwgbWltZVR5cGUsIHJlc3BvbnNlLCBjYWxsYmFjaykge1xuICAgIHZhciB4aHIgPSB7fSwgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaChcImJlZm9yZXNlbmRcIiwgXCJwcm9ncmVzc1wiLCBcImxvYWRcIiwgXCJlcnJvclwiKSwgaGVhZGVycyA9IHt9LCByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCksIHJlc3BvbnNlVHlwZSA9IG51bGw7XG4gICAgaWYgKHRoaXMuWERvbWFpblJlcXVlc3QgJiYgIShcIndpdGhDcmVkZW50aWFsc1wiIGluIHJlcXVlc3QpICYmIC9eKGh0dHAocyk/Oik/XFwvXFwvLy50ZXN0KHVybCkpIHJlcXVlc3QgPSBuZXcgWERvbWFpblJlcXVlc3QoKTtcbiAgICBcIm9ubG9hZFwiIGluIHJlcXVlc3QgPyByZXF1ZXN0Lm9ubG9hZCA9IHJlcXVlc3Qub25lcnJvciA9IHJlc3BvbmQgOiByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVxdWVzdC5yZWFkeVN0YXRlID4gMyAmJiByZXNwb25kKCk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiByZXNwb25kKCkge1xuICAgICAgdmFyIHN0YXR1cyA9IHJlcXVlc3Quc3RhdHVzLCByZXN1bHQ7XG4gICAgICBpZiAoIXN0YXR1cyAmJiBkM194aHJIYXNSZXNwb25zZShyZXF1ZXN0KSB8fCBzdGF0dXMgPj0gMjAwICYmIHN0YXR1cyA8IDMwMCB8fCBzdGF0dXMgPT09IDMwNCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlc3VsdCA9IHJlc3BvbnNlLmNhbGwoeGhyLCByZXF1ZXN0KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGRpc3BhdGNoLmVycm9yLmNhbGwoeGhyLCBlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZGlzcGF0Y2gubG9hZC5jYWxsKHhociwgcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRpc3BhdGNoLmVycm9yLmNhbGwoeGhyLCByZXF1ZXN0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVxdWVzdC5vbnByb2dyZXNzID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBvID0gZDMuZXZlbnQ7XG4gICAgICBkMy5ldmVudCA9IGV2ZW50O1xuICAgICAgdHJ5IHtcbiAgICAgICAgZGlzcGF0Y2gucHJvZ3Jlc3MuY2FsbCh4aHIsIHJlcXVlc3QpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgZDMuZXZlbnQgPSBvO1xuICAgICAgfVxuICAgIH07XG4gICAgeGhyLmhlYWRlciA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICBuYW1lID0gKG5hbWUgKyBcIlwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSByZXR1cm4gaGVhZGVyc1tuYW1lXTtcbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSBkZWxldGUgaGVhZGVyc1tuYW1lXTsgZWxzZSBoZWFkZXJzW25hbWVdID0gdmFsdWUgKyBcIlwiO1xuICAgICAgcmV0dXJuIHhocjtcbiAgICB9O1xuICAgIHhoci5taW1lVHlwZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBtaW1lVHlwZTtcbiAgICAgIG1pbWVUeXBlID0gdmFsdWUgPT0gbnVsbCA/IG51bGwgOiB2YWx1ZSArIFwiXCI7XG4gICAgICByZXR1cm4geGhyO1xuICAgIH07XG4gICAgeGhyLnJlc3BvbnNlVHlwZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiByZXNwb25zZVR5cGU7XG4gICAgICByZXNwb25zZVR5cGUgPSB2YWx1ZTtcbiAgICAgIHJldHVybiB4aHI7XG4gICAgfTtcbiAgICB4aHIucmVzcG9uc2UgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmVzcG9uc2UgPSB2YWx1ZTtcbiAgICAgIHJldHVybiB4aHI7XG4gICAgfTtcbiAgICBbIFwiZ2V0XCIsIFwicG9zdFwiIF0uZm9yRWFjaChmdW5jdGlvbihtZXRob2QpIHtcbiAgICAgIHhoclttZXRob2RdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB4aHIuc2VuZC5hcHBseSh4aHIsIFsgbWV0aG9kIF0uY29uY2F0KGQzX2FycmF5KGFyZ3VtZW50cykpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gICAgeGhyLnNlbmQgPSBmdW5jdGlvbihtZXRob2QsIGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMiAmJiB0eXBlb2YgZGF0YSA9PT0gXCJmdW5jdGlvblwiKSBjYWxsYmFjayA9IGRhdGEsIGRhdGEgPSBudWxsO1xuICAgICAgcmVxdWVzdC5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcbiAgICAgIGlmIChtaW1lVHlwZSAhPSBudWxsICYmICEoXCJhY2NlcHRcIiBpbiBoZWFkZXJzKSkgaGVhZGVyc1tcImFjY2VwdFwiXSA9IG1pbWVUeXBlICsgXCIsKi8qXCI7XG4gICAgICBpZiAocmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKSBmb3IgKHZhciBuYW1lIGluIGhlYWRlcnMpIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcihuYW1lLCBoZWFkZXJzW25hbWVdKTtcbiAgICAgIGlmIChtaW1lVHlwZSAhPSBudWxsICYmIHJlcXVlc3Qub3ZlcnJpZGVNaW1lVHlwZSkgcmVxdWVzdC5vdmVycmlkZU1pbWVUeXBlKG1pbWVUeXBlKTtcbiAgICAgIGlmIChyZXNwb25zZVR5cGUgIT0gbnVsbCkgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSByZXNwb25zZVR5cGU7XG4gICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCkgeGhyLm9uKFwiZXJyb3JcIiwgY2FsbGJhY2spLm9uKFwibG9hZFwiLCBmdW5jdGlvbihyZXF1ZXN0KSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlcXVlc3QpO1xuICAgICAgfSk7XG4gICAgICBkaXNwYXRjaC5iZWZvcmVzZW5kLmNhbGwoeGhyLCByZXF1ZXN0KTtcbiAgICAgIHJlcXVlc3Quc2VuZChkYXRhID09IG51bGwgPyBudWxsIDogZGF0YSk7XG4gICAgICByZXR1cm4geGhyO1xuICAgIH07XG4gICAgeGhyLmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXF1ZXN0LmFib3J0KCk7XG4gICAgICByZXR1cm4geGhyO1xuICAgIH07XG4gICAgZDMucmViaW5kKHhociwgZGlzcGF0Y2gsIFwib25cIik7XG4gICAgcmV0dXJuIGNhbGxiYWNrID09IG51bGwgPyB4aHIgOiB4aHIuZ2V0KGQzX3hocl9maXhDYWxsYmFjayhjYWxsYmFjaykpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3hocl9maXhDYWxsYmFjayhjYWxsYmFjaykge1xuICAgIHJldHVybiBjYWxsYmFjay5sZW5ndGggPT09IDEgPyBmdW5jdGlvbihlcnJvciwgcmVxdWVzdCkge1xuICAgICAgY2FsbGJhY2soZXJyb3IgPT0gbnVsbCA/IHJlcXVlc3QgOiBudWxsKTtcbiAgICB9IDogY2FsbGJhY2s7XG4gIH1cbiAgZnVuY3Rpb24gZDNfeGhySGFzUmVzcG9uc2UocmVxdWVzdCkge1xuICAgIHZhciB0eXBlID0gcmVxdWVzdC5yZXNwb25zZVR5cGU7XG4gICAgcmV0dXJuIHR5cGUgJiYgdHlwZSAhPT0gXCJ0ZXh0XCIgPyByZXF1ZXN0LnJlc3BvbnNlIDogcmVxdWVzdC5yZXNwb25zZVRleHQ7XG4gIH1cbiAgZDMuZHN2ID0gZnVuY3Rpb24oZGVsaW1pdGVyLCBtaW1lVHlwZSkge1xuICAgIHZhciByZUZvcm1hdCA9IG5ldyBSZWdFeHAoJ1tcIicgKyBkZWxpbWl0ZXIgKyBcIlxcbl1cIiksIGRlbGltaXRlckNvZGUgPSBkZWxpbWl0ZXIuY2hhckNvZGVBdCgwKTtcbiAgICBmdW5jdGlvbiBkc3YodXJsLCByb3csIGNhbGxiYWNrKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIGNhbGxiYWNrID0gcm93LCByb3cgPSBudWxsO1xuICAgICAgdmFyIHhociA9IGQzX3hocih1cmwsIG1pbWVUeXBlLCByb3cgPT0gbnVsbCA/IHJlc3BvbnNlIDogdHlwZWRSZXNwb25zZShyb3cpLCBjYWxsYmFjayk7XG4gICAgICB4aHIucm93ID0gZnVuY3Rpb24oXykge1xuICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IHhoci5yZXNwb25zZSgocm93ID0gXykgPT0gbnVsbCA/IHJlc3BvbnNlIDogdHlwZWRSZXNwb25zZShfKSkgOiByb3c7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIHhocjtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVzcG9uc2UocmVxdWVzdCkge1xuICAgICAgcmV0dXJuIGRzdi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHR5cGVkUmVzcG9uc2UoZikge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHJlcXVlc3QpIHtcbiAgICAgICAgcmV0dXJuIGRzdi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCwgZik7XG4gICAgICB9O1xuICAgIH1cbiAgICBkc3YucGFyc2UgPSBmdW5jdGlvbih0ZXh0LCBmKSB7XG4gICAgICB2YXIgbztcbiAgICAgIHJldHVybiBkc3YucGFyc2VSb3dzKHRleHQsIGZ1bmN0aW9uKHJvdywgaSkge1xuICAgICAgICBpZiAobykgcmV0dXJuIG8ocm93LCBpIC0gMSk7XG4gICAgICAgIHZhciBhID0gbmV3IEZ1bmN0aW9uKFwiZFwiLCBcInJldHVybiB7XCIgKyByb3cubWFwKGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkobmFtZSkgKyBcIjogZFtcIiArIGkgKyBcIl1cIjtcbiAgICAgICAgfSkuam9pbihcIixcIikgKyBcIn1cIik7XG4gICAgICAgIG8gPSBmID8gZnVuY3Rpb24ocm93LCBpKSB7XG4gICAgICAgICAgcmV0dXJuIGYoYShyb3cpLCBpKTtcbiAgICAgICAgfSA6IGE7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGRzdi5wYXJzZVJvd3MgPSBmdW5jdGlvbih0ZXh0LCBmKSB7XG4gICAgICB2YXIgRU9MID0ge30sIEVPRiA9IHt9LCByb3dzID0gW10sIE4gPSB0ZXh0Lmxlbmd0aCwgSSA9IDAsIG4gPSAwLCB0LCBlb2w7XG4gICAgICBmdW5jdGlvbiB0b2tlbigpIHtcbiAgICAgICAgaWYgKEkgPj0gTikgcmV0dXJuIEVPRjtcbiAgICAgICAgaWYgKGVvbCkgcmV0dXJuIGVvbCA9IGZhbHNlLCBFT0w7XG4gICAgICAgIHZhciBqID0gSTtcbiAgICAgICAgaWYgKHRleHQuY2hhckNvZGVBdChqKSA9PT0gMzQpIHtcbiAgICAgICAgICB2YXIgaSA9IGo7XG4gICAgICAgICAgd2hpbGUgKGkrKyA8IE4pIHtcbiAgICAgICAgICAgIGlmICh0ZXh0LmNoYXJDb2RlQXQoaSkgPT09IDM0KSB7XG4gICAgICAgICAgICAgIGlmICh0ZXh0LmNoYXJDb2RlQXQoaSArIDEpICE9PSAzNCkgYnJlYWs7XG4gICAgICAgICAgICAgICsraTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgSSA9IGkgKyAyO1xuICAgICAgICAgIHZhciBjID0gdGV4dC5jaGFyQ29kZUF0KGkgKyAxKTtcbiAgICAgICAgICBpZiAoYyA9PT0gMTMpIHtcbiAgICAgICAgICAgIGVvbCA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGV4dC5jaGFyQ29kZUF0KGkgKyAyKSA9PT0gMTApICsrSTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGMgPT09IDEwKSB7XG4gICAgICAgICAgICBlb2wgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGV4dC5zbGljZShqICsgMSwgaSkucmVwbGFjZSgvXCJcIi9nLCAnXCInKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoSSA8IE4pIHtcbiAgICAgICAgICB2YXIgYyA9IHRleHQuY2hhckNvZGVBdChJKyspLCBrID0gMTtcbiAgICAgICAgICBpZiAoYyA9PT0gMTApIGVvbCA9IHRydWU7IGVsc2UgaWYgKGMgPT09IDEzKSB7XG4gICAgICAgICAgICBlb2wgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRleHQuY2hhckNvZGVBdChJKSA9PT0gMTApICsrSSwgKytrO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYyAhPT0gZGVsaW1pdGVyQ29kZSkgY29udGludWU7XG4gICAgICAgICAgcmV0dXJuIHRleHQuc2xpY2UoaiwgSSAtIGspO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZXh0LnNsaWNlKGopO1xuICAgICAgfVxuICAgICAgd2hpbGUgKCh0ID0gdG9rZW4oKSkgIT09IEVPRikge1xuICAgICAgICB2YXIgYSA9IFtdO1xuICAgICAgICB3aGlsZSAodCAhPT0gRU9MICYmIHQgIT09IEVPRikge1xuICAgICAgICAgIGEucHVzaCh0KTtcbiAgICAgICAgICB0ID0gdG9rZW4oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZiAmJiAoYSA9IGYoYSwgbisrKSkgPT0gbnVsbCkgY29udGludWU7XG4gICAgICAgIHJvd3MucHVzaChhKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByb3dzO1xuICAgIH07XG4gICAgZHN2LmZvcm1hdCA9IGZ1bmN0aW9uKHJvd3MpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHJvd3NbMF0pKSByZXR1cm4gZHN2LmZvcm1hdFJvd3Mocm93cyk7XG4gICAgICB2YXIgZmllbGRTZXQgPSBuZXcgZDNfU2V0KCksIGZpZWxkcyA9IFtdO1xuICAgICAgcm93cy5mb3JFYWNoKGZ1bmN0aW9uKHJvdykge1xuICAgICAgICBmb3IgKHZhciBmaWVsZCBpbiByb3cpIHtcbiAgICAgICAgICBpZiAoIWZpZWxkU2V0LmhhcyhmaWVsZCkpIHtcbiAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkU2V0LmFkZChmaWVsZCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gWyBmaWVsZHMubWFwKGZvcm1hdFZhbHVlKS5qb2luKGRlbGltaXRlcikgXS5jb25jYXQocm93cy5tYXAoZnVuY3Rpb24ocm93KSB7XG4gICAgICAgIHJldHVybiBmaWVsZHMubWFwKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgICAgcmV0dXJuIGZvcm1hdFZhbHVlKHJvd1tmaWVsZF0pO1xuICAgICAgICB9KS5qb2luKGRlbGltaXRlcik7XG4gICAgICB9KSkuam9pbihcIlxcblwiKTtcbiAgICB9O1xuICAgIGRzdi5mb3JtYXRSb3dzID0gZnVuY3Rpb24ocm93cykge1xuICAgICAgcmV0dXJuIHJvd3MubWFwKGZvcm1hdFJvdykuam9pbihcIlxcblwiKTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGZvcm1hdFJvdyhyb3cpIHtcbiAgICAgIHJldHVybiByb3cubWFwKGZvcm1hdFZhbHVlKS5qb2luKGRlbGltaXRlcik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZvcm1hdFZhbHVlKHRleHQpIHtcbiAgICAgIHJldHVybiByZUZvcm1hdC50ZXN0KHRleHQpID8gJ1wiJyArIHRleHQucmVwbGFjZSgvXFxcIi9nLCAnXCJcIicpICsgJ1wiJyA6IHRleHQ7XG4gICAgfVxuICAgIHJldHVybiBkc3Y7XG4gIH07XG4gIGQzLmNzdiA9IGQzLmRzdihcIixcIiwgXCJ0ZXh0L2NzdlwiKTtcbiAgZDMudHN2ID0gZDMuZHN2KFwiXHRcIiwgXCJ0ZXh0L3RhYi1zZXBhcmF0ZWQtdmFsdWVzXCIpO1xuICB2YXIgZDNfdGltZXJfcXVldWVIZWFkLCBkM190aW1lcl9xdWV1ZVRhaWwsIGQzX3RpbWVyX2ludGVydmFsLCBkM190aW1lcl90aW1lb3V0LCBkM190aW1lcl9mcmFtZSA9IHRoaXNbZDNfdmVuZG9yU3ltYm9sKHRoaXMsIFwicmVxdWVzdEFuaW1hdGlvbkZyYW1lXCIpXSB8fCBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHNldFRpbWVvdXQoY2FsbGJhY2ssIDE3KTtcbiAgfTtcbiAgZDMudGltZXIgPSBmdW5jdGlvbigpIHtcbiAgICBkM190aW1lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuICBmdW5jdGlvbiBkM190aW1lcihjYWxsYmFjaywgZGVsYXksIHRoZW4pIHtcbiAgICB2YXIgbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKG4gPCAyKSBkZWxheSA9IDA7XG4gICAgaWYgKG4gPCAzKSB0aGVuID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgdGltZSA9IHRoZW4gKyBkZWxheSwgdGltZXIgPSB7XG4gICAgICBjOiBjYWxsYmFjayxcbiAgICAgIHQ6IHRpbWUsXG4gICAgICBuOiBudWxsXG4gICAgfTtcbiAgICBpZiAoZDNfdGltZXJfcXVldWVUYWlsKSBkM190aW1lcl9xdWV1ZVRhaWwubiA9IHRpbWVyOyBlbHNlIGQzX3RpbWVyX3F1ZXVlSGVhZCA9IHRpbWVyO1xuICAgIGQzX3RpbWVyX3F1ZXVlVGFpbCA9IHRpbWVyO1xuICAgIGlmICghZDNfdGltZXJfaW50ZXJ2YWwpIHtcbiAgICAgIGQzX3RpbWVyX3RpbWVvdXQgPSBjbGVhclRpbWVvdXQoZDNfdGltZXJfdGltZW91dCk7XG4gICAgICBkM190aW1lcl9pbnRlcnZhbCA9IDE7XG4gICAgICBkM190aW1lcl9mcmFtZShkM190aW1lcl9zdGVwKTtcbiAgICB9XG4gICAgcmV0dXJuIHRpbWVyO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVyX3N0ZXAoKSB7XG4gICAgdmFyIG5vdyA9IGQzX3RpbWVyX21hcmsoKSwgZGVsYXkgPSBkM190aW1lcl9zd2VlcCgpIC0gbm93O1xuICAgIGlmIChkZWxheSA+IDI0KSB7XG4gICAgICBpZiAoaXNGaW5pdGUoZGVsYXkpKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChkM190aW1lcl90aW1lb3V0KTtcbiAgICAgICAgZDNfdGltZXJfdGltZW91dCA9IHNldFRpbWVvdXQoZDNfdGltZXJfc3RlcCwgZGVsYXkpO1xuICAgICAgfVxuICAgICAgZDNfdGltZXJfaW50ZXJ2YWwgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBkM190aW1lcl9pbnRlcnZhbCA9IDE7XG4gICAgICBkM190aW1lcl9mcmFtZShkM190aW1lcl9zdGVwKTtcbiAgICB9XG4gIH1cbiAgZDMudGltZXIuZmx1c2ggPSBmdW5jdGlvbigpIHtcbiAgICBkM190aW1lcl9tYXJrKCk7XG4gICAgZDNfdGltZXJfc3dlZXAoKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfdGltZXJfbWFyaygpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKSwgdGltZXIgPSBkM190aW1lcl9xdWV1ZUhlYWQ7XG4gICAgd2hpbGUgKHRpbWVyKSB7XG4gICAgICBpZiAobm93ID49IHRpbWVyLnQgJiYgdGltZXIuYyhub3cgLSB0aW1lci50KSkgdGltZXIuYyA9IG51bGw7XG4gICAgICB0aW1lciA9IHRpbWVyLm47XG4gICAgfVxuICAgIHJldHVybiBub3c7XG4gIH1cbiAgZnVuY3Rpb24gZDNfdGltZXJfc3dlZXAoKSB7XG4gICAgdmFyIHQwLCB0MSA9IGQzX3RpbWVyX3F1ZXVlSGVhZCwgdGltZSA9IEluZmluaXR5O1xuICAgIHdoaWxlICh0MSkge1xuICAgICAgaWYgKHQxLmMpIHtcbiAgICAgICAgaWYgKHQxLnQgPCB0aW1lKSB0aW1lID0gdDEudDtcbiAgICAgICAgdDEgPSAodDAgPSB0MSkubjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHQxID0gdDAgPyB0MC5uID0gdDEubiA6IGQzX3RpbWVyX3F1ZXVlSGVhZCA9IHQxLm47XG4gICAgICB9XG4gICAgfVxuICAgIGQzX3RpbWVyX3F1ZXVlVGFpbCA9IHQwO1xuICAgIHJldHVybiB0aW1lO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2Zvcm1hdF9wcmVjaXNpb24oeCwgcCkge1xuICAgIHJldHVybiBwIC0gKHggPyBNYXRoLmNlaWwoTWF0aC5sb2coeCkgLyBNYXRoLkxOMTApIDogMSk7XG4gIH1cbiAgZDMucm91bmQgPSBmdW5jdGlvbih4LCBuKSB7XG4gICAgcmV0dXJuIG4gPyBNYXRoLnJvdW5kKHggKiAobiA9IE1hdGgucG93KDEwLCBuKSkpIC8gbiA6IE1hdGgucm91bmQoeCk7XG4gIH07XG4gIHZhciBkM19mb3JtYXRQcmVmaXhlcyA9IFsgXCJ5XCIsIFwielwiLCBcImFcIiwgXCJmXCIsIFwicFwiLCBcIm5cIiwgXCLCtVwiLCBcIm1cIiwgXCJcIiwgXCJrXCIsIFwiTVwiLCBcIkdcIiwgXCJUXCIsIFwiUFwiLCBcIkVcIiwgXCJaXCIsIFwiWVwiIF0ubWFwKGQzX2Zvcm1hdFByZWZpeCk7XG4gIGQzLmZvcm1hdFByZWZpeCA9IGZ1bmN0aW9uKHZhbHVlLCBwcmVjaXNpb24pIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgaWYgKHZhbHVlID0gK3ZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPCAwKSB2YWx1ZSAqPSAtMTtcbiAgICAgIGlmIChwcmVjaXNpb24pIHZhbHVlID0gZDMucm91bmQodmFsdWUsIGQzX2Zvcm1hdF9wcmVjaXNpb24odmFsdWUsIHByZWNpc2lvbikpO1xuICAgICAgaSA9IDEgKyBNYXRoLmZsb29yKDFlLTEyICsgTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjEwKTtcbiAgICAgIGkgPSBNYXRoLm1heCgtMjQsIE1hdGgubWluKDI0LCBNYXRoLmZsb29yKChpIC0gMSkgLyAzKSAqIDMpKTtcbiAgICB9XG4gICAgcmV0dXJuIGQzX2Zvcm1hdFByZWZpeGVzWzggKyBpIC8gM107XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2Zvcm1hdFByZWZpeChkLCBpKSB7XG4gICAgdmFyIGsgPSBNYXRoLnBvdygxMCwgYWJzKDggLSBpKSAqIDMpO1xuICAgIHJldHVybiB7XG4gICAgICBzY2FsZTogaSA+IDggPyBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkIC8gaztcbiAgICAgIH0gOiBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkICogaztcbiAgICAgIH0sXG4gICAgICBzeW1ib2w6IGRcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xvY2FsZV9udW1iZXJGb3JtYXQobG9jYWxlKSB7XG4gICAgdmFyIGxvY2FsZV9kZWNpbWFsID0gbG9jYWxlLmRlY2ltYWwsIGxvY2FsZV90aG91c2FuZHMgPSBsb2NhbGUudGhvdXNhbmRzLCBsb2NhbGVfZ3JvdXBpbmcgPSBsb2NhbGUuZ3JvdXBpbmcsIGxvY2FsZV9jdXJyZW5jeSA9IGxvY2FsZS5jdXJyZW5jeSwgZm9ybWF0R3JvdXAgPSBsb2NhbGVfZ3JvdXBpbmcgJiYgbG9jYWxlX3Rob3VzYW5kcyA/IGZ1bmN0aW9uKHZhbHVlLCB3aWR0aCkge1xuICAgICAgdmFyIGkgPSB2YWx1ZS5sZW5ndGgsIHQgPSBbXSwgaiA9IDAsIGcgPSBsb2NhbGVfZ3JvdXBpbmdbMF0sIGxlbmd0aCA9IDA7XG4gICAgICB3aGlsZSAoaSA+IDAgJiYgZyA+IDApIHtcbiAgICAgICAgaWYgKGxlbmd0aCArIGcgKyAxID4gd2lkdGgpIGcgPSBNYXRoLm1heCgxLCB3aWR0aCAtIGxlbmd0aCk7XG4gICAgICAgIHQucHVzaCh2YWx1ZS5zdWJzdHJpbmcoaSAtPSBnLCBpICsgZykpO1xuICAgICAgICBpZiAoKGxlbmd0aCArPSBnICsgMSkgPiB3aWR0aCkgYnJlYWs7XG4gICAgICAgIGcgPSBsb2NhbGVfZ3JvdXBpbmdbaiA9IChqICsgMSkgJSBsb2NhbGVfZ3JvdXBpbmcubGVuZ3RoXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0LnJldmVyc2UoKS5qb2luKGxvY2FsZV90aG91c2FuZHMpO1xuICAgIH0gOiBkM19pZGVudGl0eTtcbiAgICByZXR1cm4gZnVuY3Rpb24oc3BlY2lmaWVyKSB7XG4gICAgICB2YXIgbWF0Y2ggPSBkM19mb3JtYXRfcmUuZXhlYyhzcGVjaWZpZXIpLCBmaWxsID0gbWF0Y2hbMV0gfHwgXCIgXCIsIGFsaWduID0gbWF0Y2hbMl0gfHwgXCI+XCIsIHNpZ24gPSBtYXRjaFszXSB8fCBcIi1cIiwgc3ltYm9sID0gbWF0Y2hbNF0gfHwgXCJcIiwgemZpbGwgPSBtYXRjaFs1XSwgd2lkdGggPSArbWF0Y2hbNl0sIGNvbW1hID0gbWF0Y2hbN10sIHByZWNpc2lvbiA9IG1hdGNoWzhdLCB0eXBlID0gbWF0Y2hbOV0sIHNjYWxlID0gMSwgcHJlZml4ID0gXCJcIiwgc3VmZml4ID0gXCJcIiwgaW50ZWdlciA9IGZhbHNlLCBleHBvbmVudCA9IHRydWU7XG4gICAgICBpZiAocHJlY2lzaW9uKSBwcmVjaXNpb24gPSArcHJlY2lzaW9uLnN1YnN0cmluZygxKTtcbiAgICAgIGlmICh6ZmlsbCB8fCBmaWxsID09PSBcIjBcIiAmJiBhbGlnbiA9PT0gXCI9XCIpIHtcbiAgICAgICAgemZpbGwgPSBmaWxsID0gXCIwXCI7XG4gICAgICAgIGFsaWduID0gXCI9XCI7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICBjYXNlIFwiblwiOlxuICAgICAgICBjb21tYSA9IHRydWU7XG4gICAgICAgIHR5cGUgPSBcImdcIjtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiJVwiOlxuICAgICAgICBzY2FsZSA9IDEwMDtcbiAgICAgICAgc3VmZml4ID0gXCIlXCI7XG4gICAgICAgIHR5cGUgPSBcImZcIjtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwicFwiOlxuICAgICAgICBzY2FsZSA9IDEwMDtcbiAgICAgICAgc3VmZml4ID0gXCIlXCI7XG4gICAgICAgIHR5cGUgPSBcInJcIjtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiYlwiOlxuICAgICAgIGNhc2UgXCJvXCI6XG4gICAgICAgY2FzZSBcInhcIjpcbiAgICAgICBjYXNlIFwiWFwiOlxuICAgICAgICBpZiAoc3ltYm9sID09PSBcIiNcIikgcHJlZml4ID0gXCIwXCIgKyB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICBleHBvbmVudCA9IGZhbHNlO1xuXG4gICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgaW50ZWdlciA9IHRydWU7XG4gICAgICAgIHByZWNpc2lvbiA9IDA7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgc2NhbGUgPSAtMTtcbiAgICAgICAgdHlwZSA9IFwiclwiO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChzeW1ib2wgPT09IFwiJFwiKSBwcmVmaXggPSBsb2NhbGVfY3VycmVuY3lbMF0sIHN1ZmZpeCA9IGxvY2FsZV9jdXJyZW5jeVsxXTtcbiAgICAgIGlmICh0eXBlID09IFwiclwiICYmICFwcmVjaXNpb24pIHR5cGUgPSBcImdcIjtcbiAgICAgIGlmIChwcmVjaXNpb24gIT0gbnVsbCkge1xuICAgICAgICBpZiAodHlwZSA9PSBcImdcIikgcHJlY2lzaW9uID0gTWF0aC5tYXgoMSwgTWF0aC5taW4oMjEsIHByZWNpc2lvbikpOyBlbHNlIGlmICh0eXBlID09IFwiZVwiIHx8IHR5cGUgPT0gXCJmXCIpIHByZWNpc2lvbiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDIwLCBwcmVjaXNpb24pKTtcbiAgICAgIH1cbiAgICAgIHR5cGUgPSBkM19mb3JtYXRfdHlwZXMuZ2V0KHR5cGUpIHx8IGQzX2Zvcm1hdF90eXBlRGVmYXVsdDtcbiAgICAgIHZhciB6Y29tbWEgPSB6ZmlsbCAmJiBjb21tYTtcbiAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB2YXIgZnVsbFN1ZmZpeCA9IHN1ZmZpeDtcbiAgICAgICAgaWYgKGludGVnZXIgJiYgdmFsdWUgJSAxKSByZXR1cm4gXCJcIjtcbiAgICAgICAgdmFyIG5lZ2F0aXZlID0gdmFsdWUgPCAwIHx8IHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDAgPyAodmFsdWUgPSAtdmFsdWUsIFwiLVwiKSA6IHNpZ24gPT09IFwiLVwiID8gXCJcIiA6IHNpZ247XG4gICAgICAgIGlmIChzY2FsZSA8IDApIHtcbiAgICAgICAgICB2YXIgdW5pdCA9IGQzLmZvcm1hdFByZWZpeCh2YWx1ZSwgcHJlY2lzaW9uKTtcbiAgICAgICAgICB2YWx1ZSA9IHVuaXQuc2NhbGUodmFsdWUpO1xuICAgICAgICAgIGZ1bGxTdWZmaXggPSB1bml0LnN5bWJvbCArIHN1ZmZpeDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSAqPSBzY2FsZTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZSA9IHR5cGUodmFsdWUsIHByZWNpc2lvbik7XG4gICAgICAgIHZhciBpID0gdmFsdWUubGFzdEluZGV4T2YoXCIuXCIpLCBiZWZvcmUsIGFmdGVyO1xuICAgICAgICBpZiAoaSA8IDApIHtcbiAgICAgICAgICB2YXIgaiA9IGV4cG9uZW50ID8gdmFsdWUubGFzdEluZGV4T2YoXCJlXCIpIDogLTE7XG4gICAgICAgICAgaWYgKGogPCAwKSBiZWZvcmUgPSB2YWx1ZSwgYWZ0ZXIgPSBcIlwiOyBlbHNlIGJlZm9yZSA9IHZhbHVlLnN1YnN0cmluZygwLCBqKSwgYWZ0ZXIgPSB2YWx1ZS5zdWJzdHJpbmcoaik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYmVmb3JlID0gdmFsdWUuc3Vic3RyaW5nKDAsIGkpO1xuICAgICAgICAgIGFmdGVyID0gbG9jYWxlX2RlY2ltYWwgKyB2YWx1ZS5zdWJzdHJpbmcoaSArIDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghemZpbGwgJiYgY29tbWEpIGJlZm9yZSA9IGZvcm1hdEdyb3VwKGJlZm9yZSwgSW5maW5pdHkpO1xuICAgICAgICB2YXIgbGVuZ3RoID0gcHJlZml4Lmxlbmd0aCArIGJlZm9yZS5sZW5ndGggKyBhZnRlci5sZW5ndGggKyAoemNvbW1hID8gMCA6IG5lZ2F0aXZlLmxlbmd0aCksIHBhZGRpbmcgPSBsZW5ndGggPCB3aWR0aCA/IG5ldyBBcnJheShsZW5ndGggPSB3aWR0aCAtIGxlbmd0aCArIDEpLmpvaW4oZmlsbCkgOiBcIlwiO1xuICAgICAgICBpZiAoemNvbW1hKSBiZWZvcmUgPSBmb3JtYXRHcm91cChwYWRkaW5nICsgYmVmb3JlLCBwYWRkaW5nLmxlbmd0aCA/IHdpZHRoIC0gYWZ0ZXIubGVuZ3RoIDogSW5maW5pdHkpO1xuICAgICAgICBuZWdhdGl2ZSArPSBwcmVmaXg7XG4gICAgICAgIHZhbHVlID0gYmVmb3JlICsgYWZ0ZXI7XG4gICAgICAgIHJldHVybiAoYWxpZ24gPT09IFwiPFwiID8gbmVnYXRpdmUgKyB2YWx1ZSArIHBhZGRpbmcgOiBhbGlnbiA9PT0gXCI+XCIgPyBwYWRkaW5nICsgbmVnYXRpdmUgKyB2YWx1ZSA6IGFsaWduID09PSBcIl5cIiA/IHBhZGRpbmcuc3Vic3RyaW5nKDAsIGxlbmd0aCA+Pj0gMSkgKyBuZWdhdGl2ZSArIHZhbHVlICsgcGFkZGluZy5zdWJzdHJpbmcobGVuZ3RoKSA6IG5lZ2F0aXZlICsgKHpjb21tYSA/IHZhbHVlIDogcGFkZGluZyArIHZhbHVlKSkgKyBmdWxsU3VmZml4O1xuICAgICAgfTtcbiAgICB9O1xuICB9XG4gIHZhciBkM19mb3JtYXRfcmUgPSAvKD86KFtee10pPyhbPD49Xl0pKT8oWytcXC0gXSk/KFskI10pPygwKT8oXFxkKyk/KCwpPyhcXC4tP1xcZCspPyhbYS16JV0pPy9pO1xuICB2YXIgZDNfZm9ybWF0X3R5cGVzID0gZDMubWFwKHtcbiAgICBiOiBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4geC50b1N0cmluZygyKTtcbiAgICB9LFxuICAgIGM6IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKHgpO1xuICAgIH0sXG4gICAgbzogZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHgudG9TdHJpbmcoOCk7XG4gICAgfSxcbiAgICB4OiBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4geC50b1N0cmluZygxNik7XG4gICAgfSxcbiAgICBYOiBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4geC50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcbiAgICB9LFxuICAgIGc6IGZ1bmN0aW9uKHgsIHApIHtcbiAgICAgIHJldHVybiB4LnRvUHJlY2lzaW9uKHApO1xuICAgIH0sXG4gICAgZTogZnVuY3Rpb24oeCwgcCkge1xuICAgICAgcmV0dXJuIHgudG9FeHBvbmVudGlhbChwKTtcbiAgICB9LFxuICAgIGY6IGZ1bmN0aW9uKHgsIHApIHtcbiAgICAgIHJldHVybiB4LnRvRml4ZWQocCk7XG4gICAgfSxcbiAgICByOiBmdW5jdGlvbih4LCBwKSB7XG4gICAgICByZXR1cm4gKHggPSBkMy5yb3VuZCh4LCBkM19mb3JtYXRfcHJlY2lzaW9uKHgsIHApKSkudG9GaXhlZChNYXRoLm1heCgwLCBNYXRoLm1pbigyMCwgZDNfZm9ybWF0X3ByZWNpc2lvbih4ICogKDEgKyAxZS0xNSksIHApKSkpO1xuICAgIH1cbiAgfSk7XG4gIGZ1bmN0aW9uIGQzX2Zvcm1hdF90eXBlRGVmYXVsdCh4KSB7XG4gICAgcmV0dXJuIHggKyBcIlwiO1xuICB9XG4gIHZhciBkM190aW1lID0gZDMudGltZSA9IHt9LCBkM19kYXRlID0gRGF0ZTtcbiAgZnVuY3Rpb24gZDNfZGF0ZV91dGMoKSB7XG4gICAgdGhpcy5fID0gbmV3IERhdGUoYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBEYXRlLlVUQy5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDogYXJndW1lbnRzWzBdKTtcbiAgfVxuICBkM19kYXRlX3V0Yy5wcm90b3R5cGUgPSB7XG4gICAgZ2V0RGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fLmdldFVUQ0RhdGUoKTtcbiAgICB9LFxuICAgIGdldERheTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fLmdldFVUQ0RheSgpO1xuICAgIH0sXG4gICAgZ2V0RnVsbFllYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuXy5nZXRVVENGdWxsWWVhcigpO1xuICAgIH0sXG4gICAgZ2V0SG91cnM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuXy5nZXRVVENIb3VycygpO1xuICAgIH0sXG4gICAgZ2V0TWlsbGlzZWNvbmRzOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl8uZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XG4gICAgfSxcbiAgICBnZXRNaW51dGVzOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl8uZ2V0VVRDTWludXRlcygpO1xuICAgIH0sXG4gICAgZ2V0TW9udGg6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuXy5nZXRVVENNb250aCgpO1xuICAgIH0sXG4gICAgZ2V0U2Vjb25kczogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fLmdldFVUQ1NlY29uZHMoKTtcbiAgICB9LFxuICAgIGdldFRpbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuXy5nZXRUaW1lKCk7XG4gICAgfSxcbiAgICBnZXRUaW1lem9uZU9mZnNldDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9LFxuICAgIHZhbHVlT2Y6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuXy52YWx1ZU9mKCk7XG4gICAgfSxcbiAgICBzZXREYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIGQzX3RpbWVfcHJvdG90eXBlLnNldFVUQ0RhdGUuYXBwbHkodGhpcy5fLCBhcmd1bWVudHMpO1xuICAgIH0sXG4gICAgc2V0RGF5OiBmdW5jdGlvbigpIHtcbiAgICAgIGQzX3RpbWVfcHJvdG90eXBlLnNldFVUQ0RheS5hcHBseSh0aGlzLl8sIGFyZ3VtZW50cyk7XG4gICAgfSxcbiAgICBzZXRGdWxsWWVhcjogZnVuY3Rpb24oKSB7XG4gICAgICBkM190aW1lX3Byb3RvdHlwZS5zZXRVVENGdWxsWWVhci5hcHBseSh0aGlzLl8sIGFyZ3VtZW50cyk7XG4gICAgfSxcbiAgICBzZXRIb3VyczogZnVuY3Rpb24oKSB7XG4gICAgICBkM190aW1lX3Byb3RvdHlwZS5zZXRVVENIb3Vycy5hcHBseSh0aGlzLl8sIGFyZ3VtZW50cyk7XG4gICAgfSxcbiAgICBzZXRNaWxsaXNlY29uZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgZDNfdGltZV9wcm90b3R5cGUuc2V0VVRDTWlsbGlzZWNvbmRzLmFwcGx5KHRoaXMuXywgYXJndW1lbnRzKTtcbiAgICB9LFxuICAgIHNldE1pbnV0ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgZDNfdGltZV9wcm90b3R5cGUuc2V0VVRDTWludXRlcy5hcHBseSh0aGlzLl8sIGFyZ3VtZW50cyk7XG4gICAgfSxcbiAgICBzZXRNb250aDogZnVuY3Rpb24oKSB7XG4gICAgICBkM190aW1lX3Byb3RvdHlwZS5zZXRVVENNb250aC5hcHBseSh0aGlzLl8sIGFyZ3VtZW50cyk7XG4gICAgfSxcbiAgICBzZXRTZWNvbmRzOiBmdW5jdGlvbigpIHtcbiAgICAgIGQzX3RpbWVfcHJvdG90eXBlLnNldFVUQ1NlY29uZHMuYXBwbHkodGhpcy5fLCBhcmd1bWVudHMpO1xuICAgIH0sXG4gICAgc2V0VGltZTogZnVuY3Rpb24oKSB7XG4gICAgICBkM190aW1lX3Byb3RvdHlwZS5zZXRUaW1lLmFwcGx5KHRoaXMuXywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH07XG4gIHZhciBkM190aW1lX3Byb3RvdHlwZSA9IERhdGUucHJvdG90eXBlO1xuICBmdW5jdGlvbiBkM190aW1lX2ludGVydmFsKGxvY2FsLCBzdGVwLCBudW1iZXIpIHtcbiAgICBmdW5jdGlvbiByb3VuZChkYXRlKSB7XG4gICAgICB2YXIgZDAgPSBsb2NhbChkYXRlKSwgZDEgPSBvZmZzZXQoZDAsIDEpO1xuICAgICAgcmV0dXJuIGRhdGUgLSBkMCA8IGQxIC0gZGF0ZSA/IGQwIDogZDE7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNlaWwoZGF0ZSkge1xuICAgICAgc3RlcChkYXRlID0gbG9jYWwobmV3IGQzX2RhdGUoZGF0ZSAtIDEpKSwgMSk7XG4gICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb2Zmc2V0KGRhdGUsIGspIHtcbiAgICAgIHN0ZXAoZGF0ZSA9IG5ldyBkM19kYXRlKCtkYXRlKSwgayk7XG4gICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmFuZ2UodDAsIHQxLCBkdCkge1xuICAgICAgdmFyIHRpbWUgPSBjZWlsKHQwKSwgdGltZXMgPSBbXTtcbiAgICAgIGlmIChkdCA+IDEpIHtcbiAgICAgICAgd2hpbGUgKHRpbWUgPCB0MSkge1xuICAgICAgICAgIGlmICghKG51bWJlcih0aW1lKSAlIGR0KSkgdGltZXMucHVzaChuZXcgRGF0ZSgrdGltZSkpO1xuICAgICAgICAgIHN0ZXAodGltZSwgMSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdoaWxlICh0aW1lIDwgdDEpIHRpbWVzLnB1c2gobmV3IERhdGUoK3RpbWUpKSwgc3RlcCh0aW1lLCAxKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aW1lcztcbiAgICB9XG4gICAgZnVuY3Rpb24gcmFuZ2VfdXRjKHQwLCB0MSwgZHQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGQzX2RhdGUgPSBkM19kYXRlX3V0YztcbiAgICAgICAgdmFyIHV0YyA9IG5ldyBkM19kYXRlX3V0YygpO1xuICAgICAgICB1dGMuXyA9IHQwO1xuICAgICAgICByZXR1cm4gcmFuZ2UodXRjLCB0MSwgZHQpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgZDNfZGF0ZSA9IERhdGU7XG4gICAgICB9XG4gICAgfVxuICAgIGxvY2FsLmZsb29yID0gbG9jYWw7XG4gICAgbG9jYWwucm91bmQgPSByb3VuZDtcbiAgICBsb2NhbC5jZWlsID0gY2VpbDtcbiAgICBsb2NhbC5vZmZzZXQgPSBvZmZzZXQ7XG4gICAgbG9jYWwucmFuZ2UgPSByYW5nZTtcbiAgICB2YXIgdXRjID0gbG9jYWwudXRjID0gZDNfdGltZV9pbnRlcnZhbF91dGMobG9jYWwpO1xuICAgIHV0Yy5mbG9vciA9IHV0YztcbiAgICB1dGMucm91bmQgPSBkM190aW1lX2ludGVydmFsX3V0Yyhyb3VuZCk7XG4gICAgdXRjLmNlaWwgPSBkM190aW1lX2ludGVydmFsX3V0YyhjZWlsKTtcbiAgICB1dGMub2Zmc2V0ID0gZDNfdGltZV9pbnRlcnZhbF91dGMob2Zmc2V0KTtcbiAgICB1dGMucmFuZ2UgPSByYW5nZV91dGM7XG4gICAgcmV0dXJuIGxvY2FsO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVfaW50ZXJ2YWxfdXRjKG1ldGhvZCkge1xuICAgIHJldHVybiBmdW5jdGlvbihkYXRlLCBrKSB7XG4gICAgICB0cnkge1xuICAgICAgICBkM19kYXRlID0gZDNfZGF0ZV91dGM7XG4gICAgICAgIHZhciB1dGMgPSBuZXcgZDNfZGF0ZV91dGMoKTtcbiAgICAgICAgdXRjLl8gPSBkYXRlO1xuICAgICAgICByZXR1cm4gbWV0aG9kKHV0YywgaykuXztcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGQzX2RhdGUgPSBEYXRlO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgZDNfdGltZS55ZWFyID0gZDNfdGltZV9pbnRlcnZhbChmdW5jdGlvbihkYXRlKSB7XG4gICAgZGF0ZSA9IGQzX3RpbWUuZGF5KGRhdGUpO1xuICAgIGRhdGUuc2V0TW9udGgoMCwgMSk7XG4gICAgcmV0dXJuIGRhdGU7XG4gIH0sIGZ1bmN0aW9uKGRhdGUsIG9mZnNldCkge1xuICAgIGRhdGUuc2V0RnVsbFllYXIoZGF0ZS5nZXRGdWxsWWVhcigpICsgb2Zmc2V0KTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSkge1xuICAgIHJldHVybiBkYXRlLmdldEZ1bGxZZWFyKCk7XG4gIH0pO1xuICBkM190aW1lLnllYXJzID0gZDNfdGltZS55ZWFyLnJhbmdlO1xuICBkM190aW1lLnllYXJzLnV0YyA9IGQzX3RpbWUueWVhci51dGMucmFuZ2U7XG4gIGQzX3RpbWUuZGF5ID0gZDNfdGltZV9pbnRlcnZhbChmdW5jdGlvbihkYXRlKSB7XG4gICAgdmFyIGRheSA9IG5ldyBkM19kYXRlKDJlMywgMCk7XG4gICAgZGF5LnNldEZ1bGxZZWFyKGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF0ZS5nZXRNb250aCgpLCBkYXRlLmdldERhdGUoKSk7XG4gICAgcmV0dXJuIGRheTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSwgb2Zmc2V0KSB7XG4gICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgb2Zmc2V0KTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSkge1xuICAgIHJldHVybiBkYXRlLmdldERhdGUoKSAtIDE7XG4gIH0pO1xuICBkM190aW1lLmRheXMgPSBkM190aW1lLmRheS5yYW5nZTtcbiAgZDNfdGltZS5kYXlzLnV0YyA9IGQzX3RpbWUuZGF5LnV0Yy5yYW5nZTtcbiAgZDNfdGltZS5kYXlPZlllYXIgPSBmdW5jdGlvbihkYXRlKSB7XG4gICAgdmFyIHllYXIgPSBkM190aW1lLnllYXIoZGF0ZSk7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoKGRhdGUgLSB5ZWFyIC0gKGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKSAtIHllYXIuZ2V0VGltZXpvbmVPZmZzZXQoKSkgKiA2ZTQpIC8gODY0ZTUpO1xuICB9O1xuICBbIFwic3VuZGF5XCIsIFwibW9uZGF5XCIsIFwidHVlc2RheVwiLCBcIndlZG5lc2RheVwiLCBcInRodXJzZGF5XCIsIFwiZnJpZGF5XCIsIFwic2F0dXJkYXlcIiBdLmZvckVhY2goZnVuY3Rpb24oZGF5LCBpKSB7XG4gICAgaSA9IDcgLSBpO1xuICAgIHZhciBpbnRlcnZhbCA9IGQzX3RpbWVbZGF5XSA9IGQzX3RpbWVfaW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgKGRhdGUgPSBkM190aW1lLmRheShkYXRlKSkuc2V0RGF0ZShkYXRlLmdldERhdGUoKSAtIChkYXRlLmdldERheSgpICsgaSkgJSA3KTtcbiAgICAgIHJldHVybiBkYXRlO1xuICAgIH0sIGZ1bmN0aW9uKGRhdGUsIG9mZnNldCkge1xuICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgTWF0aC5mbG9vcihvZmZzZXQpICogNyk7XG4gICAgfSwgZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgdmFyIGRheSA9IGQzX3RpbWUueWVhcihkYXRlKS5nZXREYXkoKTtcbiAgICAgIHJldHVybiBNYXRoLmZsb29yKChkM190aW1lLmRheU9mWWVhcihkYXRlKSArIChkYXkgKyBpKSAlIDcpIC8gNykgLSAoZGF5ICE9PSBpKTtcbiAgICB9KTtcbiAgICBkM190aW1lW2RheSArIFwic1wiXSA9IGludGVydmFsLnJhbmdlO1xuICAgIGQzX3RpbWVbZGF5ICsgXCJzXCJdLnV0YyA9IGludGVydmFsLnV0Yy5yYW5nZTtcbiAgICBkM190aW1lW2RheSArIFwiT2ZZZWFyXCJdID0gZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgdmFyIGRheSA9IGQzX3RpbWUueWVhcihkYXRlKS5nZXREYXkoKTtcbiAgICAgIHJldHVybiBNYXRoLmZsb29yKChkM190aW1lLmRheU9mWWVhcihkYXRlKSArIChkYXkgKyBpKSAlIDcpIC8gNyk7XG4gICAgfTtcbiAgfSk7XG4gIGQzX3RpbWUud2VlayA9IGQzX3RpbWUuc3VuZGF5O1xuICBkM190aW1lLndlZWtzID0gZDNfdGltZS5zdW5kYXkucmFuZ2U7XG4gIGQzX3RpbWUud2Vla3MudXRjID0gZDNfdGltZS5zdW5kYXkudXRjLnJhbmdlO1xuICBkM190aW1lLndlZWtPZlllYXIgPSBkM190aW1lLnN1bmRheU9mWWVhcjtcbiAgZnVuY3Rpb24gZDNfbG9jYWxlX3RpbWVGb3JtYXQobG9jYWxlKSB7XG4gICAgdmFyIGxvY2FsZV9kYXRlVGltZSA9IGxvY2FsZS5kYXRlVGltZSwgbG9jYWxlX2RhdGUgPSBsb2NhbGUuZGF0ZSwgbG9jYWxlX3RpbWUgPSBsb2NhbGUudGltZSwgbG9jYWxlX3BlcmlvZHMgPSBsb2NhbGUucGVyaW9kcywgbG9jYWxlX2RheXMgPSBsb2NhbGUuZGF5cywgbG9jYWxlX3Nob3J0RGF5cyA9IGxvY2FsZS5zaG9ydERheXMsIGxvY2FsZV9tb250aHMgPSBsb2NhbGUubW9udGhzLCBsb2NhbGVfc2hvcnRNb250aHMgPSBsb2NhbGUuc2hvcnRNb250aHM7XG4gICAgZnVuY3Rpb24gZDNfdGltZV9mb3JtYXQodGVtcGxhdGUpIHtcbiAgICAgIHZhciBuID0gdGVtcGxhdGUubGVuZ3RoO1xuICAgICAgZnVuY3Rpb24gZm9ybWF0KGRhdGUpIHtcbiAgICAgICAgdmFyIHN0cmluZyA9IFtdLCBpID0gLTEsIGogPSAwLCBjLCBwLCBmO1xuICAgICAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICAgIGlmICh0ZW1wbGF0ZS5jaGFyQ29kZUF0KGkpID09PSAzNykge1xuICAgICAgICAgICAgc3RyaW5nLnB1c2godGVtcGxhdGUuc2xpY2UoaiwgaSkpO1xuICAgICAgICAgICAgaWYgKChwID0gZDNfdGltZV9mb3JtYXRQYWRzW2MgPSB0ZW1wbGF0ZS5jaGFyQXQoKytpKV0pICE9IG51bGwpIGMgPSB0ZW1wbGF0ZS5jaGFyQXQoKytpKTtcbiAgICAgICAgICAgIGlmIChmID0gZDNfdGltZV9mb3JtYXRzW2NdKSBjID0gZihkYXRlLCBwID09IG51bGwgPyBjID09PSBcImVcIiA/IFwiIFwiIDogXCIwXCIgOiBwKTtcbiAgICAgICAgICAgIHN0cmluZy5wdXNoKGMpO1xuICAgICAgICAgICAgaiA9IGkgKyAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdHJpbmcucHVzaCh0ZW1wbGF0ZS5zbGljZShqLCBpKSk7XG4gICAgICAgIHJldHVybiBzdHJpbmcuam9pbihcIlwiKTtcbiAgICAgIH1cbiAgICAgIGZvcm1hdC5wYXJzZSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgICB2YXIgZCA9IHtcbiAgICAgICAgICB5OiAxOTAwLFxuICAgICAgICAgIG06IDAsXG4gICAgICAgICAgZDogMSxcbiAgICAgICAgICBIOiAwLFxuICAgICAgICAgIE06IDAsXG4gICAgICAgICAgUzogMCxcbiAgICAgICAgICBMOiAwLFxuICAgICAgICAgIFo6IG51bGxcbiAgICAgICAgfSwgaSA9IGQzX3RpbWVfcGFyc2UoZCwgdGVtcGxhdGUsIHN0cmluZywgMCk7XG4gICAgICAgIGlmIChpICE9IHN0cmluZy5sZW5ndGgpIHJldHVybiBudWxsO1xuICAgICAgICBpZiAoXCJwXCIgaW4gZCkgZC5IID0gZC5IICUgMTIgKyBkLnAgKiAxMjtcbiAgICAgICAgdmFyIGxvY2FsWiA9IGQuWiAhPSBudWxsICYmIGQzX2RhdGUgIT09IGQzX2RhdGVfdXRjLCBkYXRlID0gbmV3IChsb2NhbFogPyBkM19kYXRlX3V0YyA6IGQzX2RhdGUpKCk7XG4gICAgICAgIGlmIChcImpcIiBpbiBkKSBkYXRlLnNldEZ1bGxZZWFyKGQueSwgMCwgZC5qKTsgZWxzZSBpZiAoXCJXXCIgaW4gZCB8fCBcIlVcIiBpbiBkKSB7XG4gICAgICAgICAgaWYgKCEoXCJ3XCIgaW4gZCkpIGQudyA9IFwiV1wiIGluIGQgPyAxIDogMDtcbiAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKGQueSwgMCwgMSk7XG4gICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcihkLnksIDAsIFwiV1wiIGluIGQgPyAoZC53ICsgNikgJSA3ICsgZC5XICogNyAtIChkYXRlLmdldERheSgpICsgNSkgJSA3IDogZC53ICsgZC5VICogNyAtIChkYXRlLmdldERheSgpICsgNikgJSA3KTtcbiAgICAgICAgfSBlbHNlIGRhdGUuc2V0RnVsbFllYXIoZC55LCBkLm0sIGQuZCk7XG4gICAgICAgIGRhdGUuc2V0SG91cnMoZC5IICsgKGQuWiAvIDEwMCB8IDApLCBkLk0gKyBkLlogJSAxMDAsIGQuUywgZC5MKTtcbiAgICAgICAgcmV0dXJuIGxvY2FsWiA/IGRhdGUuXyA6IGRhdGU7XG4gICAgICB9O1xuICAgICAgZm9ybWF0LnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gZm9ybWF0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBkM190aW1lX3BhcnNlKGRhdGUsIHRlbXBsYXRlLCBzdHJpbmcsIGopIHtcbiAgICAgIHZhciBjLCBwLCB0LCBpID0gMCwgbiA9IHRlbXBsYXRlLmxlbmd0aCwgbSA9IHN0cmluZy5sZW5ndGg7XG4gICAgICB3aGlsZSAoaSA8IG4pIHtcbiAgICAgICAgaWYgKGogPj0gbSkgcmV0dXJuIC0xO1xuICAgICAgICBjID0gdGVtcGxhdGUuY2hhckNvZGVBdChpKyspO1xuICAgICAgICBpZiAoYyA9PT0gMzcpIHtcbiAgICAgICAgICB0ID0gdGVtcGxhdGUuY2hhckF0KGkrKyk7XG4gICAgICAgICAgcCA9IGQzX3RpbWVfcGFyc2Vyc1t0IGluIGQzX3RpbWVfZm9ybWF0UGFkcyA/IHRlbXBsYXRlLmNoYXJBdChpKyspIDogdF07XG4gICAgICAgICAgaWYgKCFwIHx8IChqID0gcChkYXRlLCBzdHJpbmcsIGopKSA8IDApIHJldHVybiAtMTtcbiAgICAgICAgfSBlbHNlIGlmIChjICE9IHN0cmluZy5jaGFyQ29kZUF0KGorKykpIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBqO1xuICAgIH1cbiAgICBkM190aW1lX2Zvcm1hdC51dGMgPSBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgdmFyIGxvY2FsID0gZDNfdGltZV9mb3JtYXQodGVtcGxhdGUpO1xuICAgICAgZnVuY3Rpb24gZm9ybWF0KGRhdGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkM19kYXRlID0gZDNfZGF0ZV91dGM7XG4gICAgICAgICAgdmFyIHV0YyA9IG5ldyBkM19kYXRlKCk7XG4gICAgICAgICAgdXRjLl8gPSBkYXRlO1xuICAgICAgICAgIHJldHVybiBsb2NhbCh1dGMpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGQzX2RhdGUgPSBEYXRlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3JtYXQucGFyc2UgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkM19kYXRlID0gZDNfZGF0ZV91dGM7XG4gICAgICAgICAgdmFyIGRhdGUgPSBsb2NhbC5wYXJzZShzdHJpbmcpO1xuICAgICAgICAgIHJldHVybiBkYXRlICYmIGRhdGUuXztcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkM19kYXRlID0gRGF0ZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGZvcm1hdC50b1N0cmluZyA9IGxvY2FsLnRvU3RyaW5nO1xuICAgICAgcmV0dXJuIGZvcm1hdDtcbiAgICB9O1xuICAgIGQzX3RpbWVfZm9ybWF0Lm11bHRpID0gZDNfdGltZV9mb3JtYXQudXRjLm11bHRpID0gZDNfdGltZV9mb3JtYXRNdWx0aTtcbiAgICB2YXIgZDNfdGltZV9wZXJpb2RMb29rdXAgPSBkMy5tYXAoKSwgZDNfdGltZV9kYXlSZSA9IGQzX3RpbWVfZm9ybWF0UmUobG9jYWxlX2RheXMpLCBkM190aW1lX2RheUxvb2t1cCA9IGQzX3RpbWVfZm9ybWF0TG9va3VwKGxvY2FsZV9kYXlzKSwgZDNfdGltZV9kYXlBYmJyZXZSZSA9IGQzX3RpbWVfZm9ybWF0UmUobG9jYWxlX3Nob3J0RGF5cyksIGQzX3RpbWVfZGF5QWJicmV2TG9va3VwID0gZDNfdGltZV9mb3JtYXRMb29rdXAobG9jYWxlX3Nob3J0RGF5cyksIGQzX3RpbWVfbW9udGhSZSA9IGQzX3RpbWVfZm9ybWF0UmUobG9jYWxlX21vbnRocyksIGQzX3RpbWVfbW9udGhMb29rdXAgPSBkM190aW1lX2Zvcm1hdExvb2t1cChsb2NhbGVfbW9udGhzKSwgZDNfdGltZV9tb250aEFiYnJldlJlID0gZDNfdGltZV9mb3JtYXRSZShsb2NhbGVfc2hvcnRNb250aHMpLCBkM190aW1lX21vbnRoQWJicmV2TG9va3VwID0gZDNfdGltZV9mb3JtYXRMb29rdXAobG9jYWxlX3Nob3J0TW9udGhzKTtcbiAgICBsb2NhbGVfcGVyaW9kcy5mb3JFYWNoKGZ1bmN0aW9uKHAsIGkpIHtcbiAgICAgIGQzX3RpbWVfcGVyaW9kTG9va3VwLnNldChwLnRvTG93ZXJDYXNlKCksIGkpO1xuICAgIH0pO1xuICAgIHZhciBkM190aW1lX2Zvcm1hdHMgPSB7XG4gICAgICBhOiBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGVfc2hvcnREYXlzW2QuZ2V0RGF5KCldO1xuICAgICAgfSxcbiAgICAgIEE6IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZV9kYXlzW2QuZ2V0RGF5KCldO1xuICAgICAgfSxcbiAgICAgIGI6IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZV9zaG9ydE1vbnRoc1tkLmdldE1vbnRoKCldO1xuICAgICAgfSxcbiAgICAgIEI6IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZV9tb250aHNbZC5nZXRNb250aCgpXTtcbiAgICAgIH0sXG4gICAgICBjOiBkM190aW1lX2Zvcm1hdChsb2NhbGVfZGF0ZVRpbWUpLFxuICAgICAgZDogZnVuY3Rpb24oZCwgcCkge1xuICAgICAgICByZXR1cm4gZDNfdGltZV9mb3JtYXRQYWQoZC5nZXREYXRlKCksIHAsIDIpO1xuICAgICAgfSxcbiAgICAgIGU6IGZ1bmN0aW9uKGQsIHApIHtcbiAgICAgICAgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0RGF0ZSgpLCBwLCAyKTtcbiAgICAgIH0sXG4gICAgICBIOiBmdW5jdGlvbihkLCBwKSB7XG4gICAgICAgIHJldHVybiBkM190aW1lX2Zvcm1hdFBhZChkLmdldEhvdXJzKCksIHAsIDIpO1xuICAgICAgfSxcbiAgICAgIEk6IGZ1bmN0aW9uKGQsIHApIHtcbiAgICAgICAgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0SG91cnMoKSAlIDEyIHx8IDEyLCBwLCAyKTtcbiAgICAgIH0sXG4gICAgICBqOiBmdW5jdGlvbihkLCBwKSB7XG4gICAgICAgIHJldHVybiBkM190aW1lX2Zvcm1hdFBhZCgxICsgZDNfdGltZS5kYXlPZlllYXIoZCksIHAsIDMpO1xuICAgICAgfSxcbiAgICAgIEw6IGZ1bmN0aW9uKGQsIHApIHtcbiAgICAgICAgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0TWlsbGlzZWNvbmRzKCksIHAsIDMpO1xuICAgICAgfSxcbiAgICAgIG06IGZ1bmN0aW9uKGQsIHApIHtcbiAgICAgICAgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0TW9udGgoKSArIDEsIHAsIDIpO1xuICAgICAgfSxcbiAgICAgIE06IGZ1bmN0aW9uKGQsIHApIHtcbiAgICAgICAgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0TWludXRlcygpLCBwLCAyKTtcbiAgICAgIH0sXG4gICAgICBwOiBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGVfcGVyaW9kc1srKGQuZ2V0SG91cnMoKSA+PSAxMildO1xuICAgICAgfSxcbiAgICAgIFM6IGZ1bmN0aW9uKGQsIHApIHtcbiAgICAgICAgcmV0dXJuIGQzX3RpbWVfZm9ybWF0UGFkKGQuZ2V0U2Vjb25kcygpLCBwLCAyKTtcbiAgICAgIH0sXG4gICAgICBVOiBmdW5jdGlvbihkLCBwKSB7XG4gICAgICAgIHJldHVybiBkM190aW1lX2Zvcm1hdFBhZChkM190aW1lLnN1bmRheU9mWWVhcihkKSwgcCwgMik7XG4gICAgICB9LFxuICAgICAgdzogZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXREYXkoKTtcbiAgICAgIH0sXG4gICAgICBXOiBmdW5jdGlvbihkLCBwKSB7XG4gICAgICAgIHJldHVybiBkM190aW1lX2Zvcm1hdFBhZChkM190aW1lLm1vbmRheU9mWWVhcihkKSwgcCwgMik7XG4gICAgICB9LFxuICAgICAgeDogZDNfdGltZV9mb3JtYXQobG9jYWxlX2RhdGUpLFxuICAgICAgWDogZDNfdGltZV9mb3JtYXQobG9jYWxlX3RpbWUpLFxuICAgICAgeTogZnVuY3Rpb24oZCwgcCkge1xuICAgICAgICByZXR1cm4gZDNfdGltZV9mb3JtYXRQYWQoZC5nZXRGdWxsWWVhcigpICUgMTAwLCBwLCAyKTtcbiAgICAgIH0sXG4gICAgICBZOiBmdW5jdGlvbihkLCBwKSB7XG4gICAgICAgIHJldHVybiBkM190aW1lX2Zvcm1hdFBhZChkLmdldEZ1bGxZZWFyKCkgJSAxZTQsIHAsIDQpO1xuICAgICAgfSxcbiAgICAgIFo6IGQzX3RpbWVfem9uZSxcbiAgICAgIFwiJVwiOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFwiJVwiO1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIGQzX3RpbWVfcGFyc2VycyA9IHtcbiAgICAgIGE6IGQzX3RpbWVfcGFyc2VXZWVrZGF5QWJicmV2LFxuICAgICAgQTogZDNfdGltZV9wYXJzZVdlZWtkYXksXG4gICAgICBiOiBkM190aW1lX3BhcnNlTW9udGhBYmJyZXYsXG4gICAgICBCOiBkM190aW1lX3BhcnNlTW9udGgsXG4gICAgICBjOiBkM190aW1lX3BhcnNlTG9jYWxlRnVsbCxcbiAgICAgIGQ6IGQzX3RpbWVfcGFyc2VEYXksXG4gICAgICBlOiBkM190aW1lX3BhcnNlRGF5LFxuICAgICAgSDogZDNfdGltZV9wYXJzZUhvdXIyNCxcbiAgICAgIEk6IGQzX3RpbWVfcGFyc2VIb3VyMjQsXG4gICAgICBqOiBkM190aW1lX3BhcnNlRGF5T2ZZZWFyLFxuICAgICAgTDogZDNfdGltZV9wYXJzZU1pbGxpc2Vjb25kcyxcbiAgICAgIG06IGQzX3RpbWVfcGFyc2VNb250aE51bWJlcixcbiAgICAgIE06IGQzX3RpbWVfcGFyc2VNaW51dGVzLFxuICAgICAgcDogZDNfdGltZV9wYXJzZUFtUG0sXG4gICAgICBTOiBkM190aW1lX3BhcnNlU2Vjb25kcyxcbiAgICAgIFU6IGQzX3RpbWVfcGFyc2VXZWVrTnVtYmVyU3VuZGF5LFxuICAgICAgdzogZDNfdGltZV9wYXJzZVdlZWtkYXlOdW1iZXIsXG4gICAgICBXOiBkM190aW1lX3BhcnNlV2Vla051bWJlck1vbmRheSxcbiAgICAgIHg6IGQzX3RpbWVfcGFyc2VMb2NhbGVEYXRlLFxuICAgICAgWDogZDNfdGltZV9wYXJzZUxvY2FsZVRpbWUsXG4gICAgICB5OiBkM190aW1lX3BhcnNlWWVhcixcbiAgICAgIFk6IGQzX3RpbWVfcGFyc2VGdWxsWWVhcixcbiAgICAgIFo6IGQzX3RpbWVfcGFyc2Vab25lLFxuICAgICAgXCIlXCI6IGQzX3RpbWVfcGFyc2VMaXRlcmFsUGVyY2VudFxuICAgIH07XG4gICAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZVdlZWtkYXlBYmJyZXYoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gICAgICBkM190aW1lX2RheUFiYnJldlJlLmxhc3RJbmRleCA9IDA7XG4gICAgICB2YXIgbiA9IGQzX3RpbWVfZGF5QWJicmV2UmUuZXhlYyhzdHJpbmcuc2xpY2UoaSkpO1xuICAgICAgcmV0dXJuIG4gPyAoZGF0ZS53ID0gZDNfdGltZV9kYXlBYmJyZXZMb29rdXAuZ2V0KG5bMF0udG9Mb3dlckNhc2UoKSksIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZVdlZWtkYXkoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gICAgICBkM190aW1lX2RheVJlLmxhc3RJbmRleCA9IDA7XG4gICAgICB2YXIgbiA9IGQzX3RpbWVfZGF5UmUuZXhlYyhzdHJpbmcuc2xpY2UoaSkpO1xuICAgICAgcmV0dXJuIG4gPyAoZGF0ZS53ID0gZDNfdGltZV9kYXlMb29rdXAuZ2V0KG5bMF0udG9Mb3dlckNhc2UoKSksIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZU1vbnRoQWJicmV2KGRhdGUsIHN0cmluZywgaSkge1xuICAgICAgZDNfdGltZV9tb250aEFiYnJldlJlLmxhc3RJbmRleCA9IDA7XG4gICAgICB2YXIgbiA9IGQzX3RpbWVfbW9udGhBYmJyZXZSZS5leGVjKHN0cmluZy5zbGljZShpKSk7XG4gICAgICByZXR1cm4gbiA/IChkYXRlLm0gPSBkM190aW1lX21vbnRoQWJicmV2TG9va3VwLmdldChuWzBdLnRvTG93ZXJDYXNlKCkpLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VNb250aChkYXRlLCBzdHJpbmcsIGkpIHtcbiAgICAgIGQzX3RpbWVfbW9udGhSZS5sYXN0SW5kZXggPSAwO1xuICAgICAgdmFyIG4gPSBkM190aW1lX21vbnRoUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSkpO1xuICAgICAgcmV0dXJuIG4gPyAoZGF0ZS5tID0gZDNfdGltZV9tb250aExvb2t1cC5nZXQoblswXS50b0xvd2VyQ2FzZSgpKSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkM190aW1lX3BhcnNlTG9jYWxlRnVsbChkYXRlLCBzdHJpbmcsIGkpIHtcbiAgICAgIHJldHVybiBkM190aW1lX3BhcnNlKGRhdGUsIGQzX3RpbWVfZm9ybWF0cy5jLnRvU3RyaW5nKCksIHN0cmluZywgaSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VMb2NhbGVEYXRlKGRhdGUsIHN0cmluZywgaSkge1xuICAgICAgcmV0dXJuIGQzX3RpbWVfcGFyc2UoZGF0ZSwgZDNfdGltZV9mb3JtYXRzLngudG9TdHJpbmcoKSwgc3RyaW5nLCBpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZUxvY2FsZVRpbWUoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gICAgICByZXR1cm4gZDNfdGltZV9wYXJzZShkYXRlLCBkM190aW1lX2Zvcm1hdHMuWC50b1N0cmluZygpLCBzdHJpbmcsIGkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkM190aW1lX3BhcnNlQW1QbShkYXRlLCBzdHJpbmcsIGkpIHtcbiAgICAgIHZhciBuID0gZDNfdGltZV9wZXJpb2RMb29rdXAuZ2V0KHN0cmluZy5zbGljZShpLCBpICs9IDIpLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgcmV0dXJuIG4gPT0gbnVsbCA/IC0xIDogKGRhdGUucCA9IG4sIGkpO1xuICAgIH1cbiAgICByZXR1cm4gZDNfdGltZV9mb3JtYXQ7XG4gIH1cbiAgdmFyIGQzX3RpbWVfZm9ybWF0UGFkcyA9IHtcbiAgICBcIi1cIjogXCJcIixcbiAgICBfOiBcIiBcIixcbiAgICBcIjBcIjogXCIwXCJcbiAgfSwgZDNfdGltZV9udW1iZXJSZSA9IC9eXFxzKlxcZCsvLCBkM190aW1lX3BlcmNlbnRSZSA9IC9eJS87XG4gIGZ1bmN0aW9uIGQzX3RpbWVfZm9ybWF0UGFkKHZhbHVlLCBmaWxsLCB3aWR0aCkge1xuICAgIHZhciBzaWduID0gdmFsdWUgPCAwID8gXCItXCIgOiBcIlwiLCBzdHJpbmcgPSAoc2lnbiA/IC12YWx1ZSA6IHZhbHVlKSArIFwiXCIsIGxlbmd0aCA9IHN0cmluZy5sZW5ndGg7XG4gICAgcmV0dXJuIHNpZ24gKyAobGVuZ3RoIDwgd2lkdGggPyBuZXcgQXJyYXkod2lkdGggLSBsZW5ndGggKyAxKS5qb2luKGZpbGwpICsgc3RyaW5nIDogc3RyaW5nKTtcbiAgfVxuICBmdW5jdGlvbiBkM190aW1lX2Zvcm1hdFJlKG5hbWVzKSB7XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoXCJeKD86XCIgKyBuYW1lcy5tYXAoZDMucmVxdW90ZSkuam9pbihcInxcIikgKyBcIilcIiwgXCJpXCIpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVfZm9ybWF0TG9va3VwKG5hbWVzKSB7XG4gICAgdmFyIG1hcCA9IG5ldyBkM19NYXAoKSwgaSA9IC0xLCBuID0gbmFtZXMubGVuZ3RoO1xuICAgIHdoaWxlICgrK2kgPCBuKSBtYXAuc2V0KG5hbWVzW2ldLnRvTG93ZXJDYXNlKCksIGkpO1xuICAgIHJldHVybiBtYXA7XG4gIH1cbiAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZVdlZWtkYXlOdW1iZXIoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gICAgZDNfdGltZV9udW1iZXJSZS5sYXN0SW5kZXggPSAwO1xuICAgIHZhciBuID0gZDNfdGltZV9udW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpLCBpICsgMSkpO1xuICAgIHJldHVybiBuID8gKGRhdGUudyA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG4gIH1cbiAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZVdlZWtOdW1iZXJTdW5kYXkoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gICAgZDNfdGltZV9udW1iZXJSZS5sYXN0SW5kZXggPSAwO1xuICAgIHZhciBuID0gZDNfdGltZV9udW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpKSk7XG4gICAgcmV0dXJuIG4gPyAoZGF0ZS5VID0gK25bMF0sIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbiAgfVxuICBmdW5jdGlvbiBkM190aW1lX3BhcnNlV2Vla051bWJlck1vbmRheShkYXRlLCBzdHJpbmcsIGkpIHtcbiAgICBkM190aW1lX251bWJlclJlLmxhc3RJbmRleCA9IDA7XG4gICAgdmFyIG4gPSBkM190aW1lX251bWJlclJlLmV4ZWMoc3RyaW5nLnNsaWNlKGkpKTtcbiAgICByZXR1cm4gbiA/IChkYXRlLlcgPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VGdWxsWWVhcihkYXRlLCBzdHJpbmcsIGkpIHtcbiAgICBkM190aW1lX251bWJlclJlLmxhc3RJbmRleCA9IDA7XG4gICAgdmFyIG4gPSBkM190aW1lX251bWJlclJlLmV4ZWMoc3RyaW5nLnNsaWNlKGksIGkgKyA0KSk7XG4gICAgcmV0dXJuIG4gPyAoZGF0ZS55ID0gK25bMF0sIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbiAgfVxuICBmdW5jdGlvbiBkM190aW1lX3BhcnNlWWVhcihkYXRlLCBzdHJpbmcsIGkpIHtcbiAgICBkM190aW1lX251bWJlclJlLmxhc3RJbmRleCA9IDA7XG4gICAgdmFyIG4gPSBkM190aW1lX251bWJlclJlLmV4ZWMoc3RyaW5nLnNsaWNlKGksIGkgKyAyKSk7XG4gICAgcmV0dXJuIG4gPyAoZGF0ZS55ID0gZDNfdGltZV9leHBhbmRZZWFyKCtuWzBdKSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2Vab25lKGRhdGUsIHN0cmluZywgaSkge1xuICAgIHJldHVybiAvXlsrLV1cXGR7NH0kLy50ZXN0KHN0cmluZyA9IHN0cmluZy5zbGljZShpLCBpICsgNSkpID8gKGRhdGUuWiA9IC1zdHJpbmcsIFxuICAgIGkgKyA1KSA6IC0xO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVfZXhwYW5kWWVhcihkKSB7XG4gICAgcmV0dXJuIGQgKyAoZCA+IDY4ID8gMTkwMCA6IDJlMyk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZU1vbnRoTnVtYmVyKGRhdGUsIHN0cmluZywgaSkge1xuICAgIGQzX3RpbWVfbnVtYmVyUmUubGFzdEluZGV4ID0gMDtcbiAgICB2YXIgbiA9IGQzX3RpbWVfbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSwgaSArIDIpKTtcbiAgICByZXR1cm4gbiA/IChkYXRlLm0gPSBuWzBdIC0gMSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VEYXkoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gICAgZDNfdGltZV9udW1iZXJSZS5sYXN0SW5kZXggPSAwO1xuICAgIHZhciBuID0gZDNfdGltZV9udW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpLCBpICsgMikpO1xuICAgIHJldHVybiBuID8gKGRhdGUuZCA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG4gIH1cbiAgZnVuY3Rpb24gZDNfdGltZV9wYXJzZURheU9mWWVhcihkYXRlLCBzdHJpbmcsIGkpIHtcbiAgICBkM190aW1lX251bWJlclJlLmxhc3RJbmRleCA9IDA7XG4gICAgdmFyIG4gPSBkM190aW1lX251bWJlclJlLmV4ZWMoc3RyaW5nLnNsaWNlKGksIGkgKyAzKSk7XG4gICAgcmV0dXJuIG4gPyAoZGF0ZS5qID0gK25bMF0sIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbiAgfVxuICBmdW5jdGlvbiBkM190aW1lX3BhcnNlSG91cjI0KGRhdGUsIHN0cmluZywgaSkge1xuICAgIGQzX3RpbWVfbnVtYmVyUmUubGFzdEluZGV4ID0gMDtcbiAgICB2YXIgbiA9IGQzX3RpbWVfbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSwgaSArIDIpKTtcbiAgICByZXR1cm4gbiA/IChkYXRlLkggPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VNaW51dGVzKGRhdGUsIHN0cmluZywgaSkge1xuICAgIGQzX3RpbWVfbnVtYmVyUmUubGFzdEluZGV4ID0gMDtcbiAgICB2YXIgbiA9IGQzX3RpbWVfbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSwgaSArIDIpKTtcbiAgICByZXR1cm4gbiA/IChkYXRlLk0gPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VTZWNvbmRzKGRhdGUsIHN0cmluZywgaSkge1xuICAgIGQzX3RpbWVfbnVtYmVyUmUubGFzdEluZGV4ID0gMDtcbiAgICB2YXIgbiA9IGQzX3RpbWVfbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSwgaSArIDIpKTtcbiAgICByZXR1cm4gbiA/IChkYXRlLlMgPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VNaWxsaXNlY29uZHMoZGF0ZSwgc3RyaW5nLCBpKSB7XG4gICAgZDNfdGltZV9udW1iZXJSZS5sYXN0SW5kZXggPSAwO1xuICAgIHZhciBuID0gZDNfdGltZV9udW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpLCBpICsgMykpO1xuICAgIHJldHVybiBuID8gKGRhdGUuTCA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG4gIH1cbiAgZnVuY3Rpb24gZDNfdGltZV96b25lKGQpIHtcbiAgICB2YXIgeiA9IGQuZ2V0VGltZXpvbmVPZmZzZXQoKSwgenMgPSB6ID4gMCA/IFwiLVwiIDogXCIrXCIsIHpoID0gYWJzKHopIC8gNjAgfCAwLCB6bSA9IGFicyh6KSAlIDYwO1xuICAgIHJldHVybiB6cyArIGQzX3RpbWVfZm9ybWF0UGFkKHpoLCBcIjBcIiwgMikgKyBkM190aW1lX2Zvcm1hdFBhZCh6bSwgXCIwXCIsIDIpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVfcGFyc2VMaXRlcmFsUGVyY2VudChkYXRlLCBzdHJpbmcsIGkpIHtcbiAgICBkM190aW1lX3BlcmNlbnRSZS5sYXN0SW5kZXggPSAwO1xuICAgIHZhciBuID0gZDNfdGltZV9wZXJjZW50UmUuZXhlYyhzdHJpbmcuc2xpY2UoaSwgaSArIDEpKTtcbiAgICByZXR1cm4gbiA/IGkgKyBuWzBdLmxlbmd0aCA6IC0xO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RpbWVfZm9ybWF0TXVsdGkoZm9ybWF0cykge1xuICAgIHZhciBuID0gZm9ybWF0cy5sZW5ndGgsIGkgPSAtMTtcbiAgICB3aGlsZSAoKytpIDwgbikgZm9ybWF0c1tpXVswXSA9IHRoaXMoZm9ybWF0c1tpXVswXSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUpIHtcbiAgICAgIHZhciBpID0gMCwgZiA9IGZvcm1hdHNbaV07XG4gICAgICB3aGlsZSAoIWZbMV0oZGF0ZSkpIGYgPSBmb3JtYXRzWysraV07XG4gICAgICByZXR1cm4gZlswXShkYXRlKTtcbiAgICB9O1xuICB9XG4gIGQzLmxvY2FsZSA9IGZ1bmN0aW9uKGxvY2FsZSkge1xuICAgIHJldHVybiB7XG4gICAgICBudW1iZXJGb3JtYXQ6IGQzX2xvY2FsZV9udW1iZXJGb3JtYXQobG9jYWxlKSxcbiAgICAgIHRpbWVGb3JtYXQ6IGQzX2xvY2FsZV90aW1lRm9ybWF0KGxvY2FsZSlcbiAgICB9O1xuICB9O1xuICB2YXIgZDNfbG9jYWxlX2VuVVMgPSBkMy5sb2NhbGUoe1xuICAgIGRlY2ltYWw6IFwiLlwiLFxuICAgIHRob3VzYW5kczogXCIsXCIsXG4gICAgZ3JvdXBpbmc6IFsgMyBdLFxuICAgIGN1cnJlbmN5OiBbIFwiJFwiLCBcIlwiIF0sXG4gICAgZGF0ZVRpbWU6IFwiJWEgJWIgJWUgJVggJVlcIixcbiAgICBkYXRlOiBcIiVtLyVkLyVZXCIsXG4gICAgdGltZTogXCIlSDolTTolU1wiLFxuICAgIHBlcmlvZHM6IFsgXCJBTVwiLCBcIlBNXCIgXSxcbiAgICBkYXlzOiBbIFwiU3VuZGF5XCIsIFwiTW9uZGF5XCIsIFwiVHVlc2RheVwiLCBcIldlZG5lc2RheVwiLCBcIlRodXJzZGF5XCIsIFwiRnJpZGF5XCIsIFwiU2F0dXJkYXlcIiBdLFxuICAgIHNob3J0RGF5czogWyBcIlN1blwiLCBcIk1vblwiLCBcIlR1ZVwiLCBcIldlZFwiLCBcIlRodVwiLCBcIkZyaVwiLCBcIlNhdFwiIF0sXG4gICAgbW9udGhzOiBbIFwiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCIsIFwiQXVndXN0XCIsIFwiU2VwdGVtYmVyXCIsIFwiT2N0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIiBdLFxuICAgIHNob3J0TW9udGhzOiBbIFwiSmFuXCIsIFwiRmViXCIsIFwiTWFyXCIsIFwiQXByXCIsIFwiTWF5XCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2N0XCIsIFwiTm92XCIsIFwiRGVjXCIgXVxuICB9KTtcbiAgZDMuZm9ybWF0ID0gZDNfbG9jYWxlX2VuVVMubnVtYmVyRm9ybWF0O1xuICBkMy5nZW8gPSB7fTtcbiAgZnVuY3Rpb24gZDNfYWRkZXIoKSB7fVxuICBkM19hZGRlci5wcm90b3R5cGUgPSB7XG4gICAgczogMCxcbiAgICB0OiAwLFxuICAgIGFkZDogZnVuY3Rpb24oeSkge1xuICAgICAgZDNfYWRkZXJTdW0oeSwgdGhpcy50LCBkM19hZGRlclRlbXApO1xuICAgICAgZDNfYWRkZXJTdW0oZDNfYWRkZXJUZW1wLnMsIHRoaXMucywgdGhpcyk7XG4gICAgICBpZiAodGhpcy5zKSB0aGlzLnQgKz0gZDNfYWRkZXJUZW1wLnQ7IGVsc2UgdGhpcy5zID0gZDNfYWRkZXJUZW1wLnQ7XG4gICAgfSxcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnMgPSB0aGlzLnQgPSAwO1xuICAgIH0sXG4gICAgdmFsdWVPZjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5zO1xuICAgIH1cbiAgfTtcbiAgdmFyIGQzX2FkZGVyVGVtcCA9IG5ldyBkM19hZGRlcigpO1xuICBmdW5jdGlvbiBkM19hZGRlclN1bShhLCBiLCBvKSB7XG4gICAgdmFyIHggPSBvLnMgPSBhICsgYiwgYnYgPSB4IC0gYSwgYXYgPSB4IC0gYnY7XG4gICAgby50ID0gYSAtIGF2ICsgKGIgLSBidik7XG4gIH1cbiAgZDMuZ2VvLnN0cmVhbSA9IGZ1bmN0aW9uKG9iamVjdCwgbGlzdGVuZXIpIHtcbiAgICBpZiAob2JqZWN0ICYmIGQzX2dlb19zdHJlYW1PYmplY3RUeXBlLmhhc093blByb3BlcnR5KG9iamVjdC50eXBlKSkge1xuICAgICAgZDNfZ2VvX3N0cmVhbU9iamVjdFR5cGVbb2JqZWN0LnR5cGVdKG9iamVjdCwgbGlzdGVuZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkM19nZW9fc3RyZWFtR2VvbWV0cnkob2JqZWN0LCBsaXN0ZW5lcik7XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBkM19nZW9fc3RyZWFtR2VvbWV0cnkoZ2VvbWV0cnksIGxpc3RlbmVyKSB7XG4gICAgaWYgKGdlb21ldHJ5ICYmIGQzX2dlb19zdHJlYW1HZW9tZXRyeVR5cGUuaGFzT3duUHJvcGVydHkoZ2VvbWV0cnkudHlwZSkpIHtcbiAgICAgIGQzX2dlb19zdHJlYW1HZW9tZXRyeVR5cGVbZ2VvbWV0cnkudHlwZV0oZ2VvbWV0cnksIGxpc3RlbmVyKTtcbiAgICB9XG4gIH1cbiAgdmFyIGQzX2dlb19zdHJlYW1PYmplY3RUeXBlID0ge1xuICAgIEZlYXR1cmU6IGZ1bmN0aW9uKGZlYXR1cmUsIGxpc3RlbmVyKSB7XG4gICAgICBkM19nZW9fc3RyZWFtR2VvbWV0cnkoZmVhdHVyZS5nZW9tZXRyeSwgbGlzdGVuZXIpO1xuICAgIH0sXG4gICAgRmVhdHVyZUNvbGxlY3Rpb246IGZ1bmN0aW9uKG9iamVjdCwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBmZWF0dXJlcyA9IG9iamVjdC5mZWF0dXJlcywgaSA9IC0xLCBuID0gZmVhdHVyZXMubGVuZ3RoO1xuICAgICAgd2hpbGUgKCsraSA8IG4pIGQzX2dlb19zdHJlYW1HZW9tZXRyeShmZWF0dXJlc1tpXS5nZW9tZXRyeSwgbGlzdGVuZXIpO1xuICAgIH1cbiAgfTtcbiAgdmFyIGQzX2dlb19zdHJlYW1HZW9tZXRyeVR5cGUgPSB7XG4gICAgU3BoZXJlOiBmdW5jdGlvbihvYmplY3QsIGxpc3RlbmVyKSB7XG4gICAgICBsaXN0ZW5lci5zcGhlcmUoKTtcbiAgICB9LFxuICAgIFBvaW50OiBmdW5jdGlvbihvYmplY3QsIGxpc3RlbmVyKSB7XG4gICAgICBvYmplY3QgPSBvYmplY3QuY29vcmRpbmF0ZXM7XG4gICAgICBsaXN0ZW5lci5wb2ludChvYmplY3RbMF0sIG9iamVjdFsxXSwgb2JqZWN0WzJdKTtcbiAgICB9LFxuICAgIE11bHRpUG9pbnQ6IGZ1bmN0aW9uKG9iamVjdCwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBjb29yZGluYXRlcyA9IG9iamVjdC5jb29yZGluYXRlcywgaSA9IC0xLCBuID0gY29vcmRpbmF0ZXMubGVuZ3RoO1xuICAgICAgd2hpbGUgKCsraSA8IG4pIG9iamVjdCA9IGNvb3JkaW5hdGVzW2ldLCBsaXN0ZW5lci5wb2ludChvYmplY3RbMF0sIG9iamVjdFsxXSwgb2JqZWN0WzJdKTtcbiAgICB9LFxuICAgIExpbmVTdHJpbmc6IGZ1bmN0aW9uKG9iamVjdCwgbGlzdGVuZXIpIHtcbiAgICAgIGQzX2dlb19zdHJlYW1MaW5lKG9iamVjdC5jb29yZGluYXRlcywgbGlzdGVuZXIsIDApO1xuICAgIH0sXG4gICAgTXVsdGlMaW5lU3RyaW5nOiBmdW5jdGlvbihvYmplY3QsIGxpc3RlbmVyKSB7XG4gICAgICB2YXIgY29vcmRpbmF0ZXMgPSBvYmplY3QuY29vcmRpbmF0ZXMsIGkgPSAtMSwgbiA9IGNvb3JkaW5hdGVzLmxlbmd0aDtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSBkM19nZW9fc3RyZWFtTGluZShjb29yZGluYXRlc1tpXSwgbGlzdGVuZXIsIDApO1xuICAgIH0sXG4gICAgUG9seWdvbjogZnVuY3Rpb24ob2JqZWN0LCBsaXN0ZW5lcikge1xuICAgICAgZDNfZ2VvX3N0cmVhbVBvbHlnb24ob2JqZWN0LmNvb3JkaW5hdGVzLCBsaXN0ZW5lcik7XG4gICAgfSxcbiAgICBNdWx0aVBvbHlnb246IGZ1bmN0aW9uKG9iamVjdCwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBjb29yZGluYXRlcyA9IG9iamVjdC5jb29yZGluYXRlcywgaSA9IC0xLCBuID0gY29vcmRpbmF0ZXMubGVuZ3RoO1xuICAgICAgd2hpbGUgKCsraSA8IG4pIGQzX2dlb19zdHJlYW1Qb2x5Z29uKGNvb3JkaW5hdGVzW2ldLCBsaXN0ZW5lcik7XG4gICAgfSxcbiAgICBHZW9tZXRyeUNvbGxlY3Rpb246IGZ1bmN0aW9uKG9iamVjdCwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBnZW9tZXRyaWVzID0gb2JqZWN0Lmdlb21ldHJpZXMsIGkgPSAtMSwgbiA9IGdlb21ldHJpZXMubGVuZ3RoO1xuICAgICAgd2hpbGUgKCsraSA8IG4pIGQzX2dlb19zdHJlYW1HZW9tZXRyeShnZW9tZXRyaWVzW2ldLCBsaXN0ZW5lcik7XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBkM19nZW9fc3RyZWFtTGluZShjb29yZGluYXRlcywgbGlzdGVuZXIsIGNsb3NlZCkge1xuICAgIHZhciBpID0gLTEsIG4gPSBjb29yZGluYXRlcy5sZW5ndGggLSBjbG9zZWQsIGNvb3JkaW5hdGU7XG4gICAgbGlzdGVuZXIubGluZVN0YXJ0KCk7XG4gICAgd2hpbGUgKCsraSA8IG4pIGNvb3JkaW5hdGUgPSBjb29yZGluYXRlc1tpXSwgbGlzdGVuZXIucG9pbnQoY29vcmRpbmF0ZVswXSwgY29vcmRpbmF0ZVsxXSwgY29vcmRpbmF0ZVsyXSk7XG4gICAgbGlzdGVuZXIubGluZUVuZCgpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19zdHJlYW1Qb2x5Z29uKGNvb3JkaW5hdGVzLCBsaXN0ZW5lcikge1xuICAgIHZhciBpID0gLTEsIG4gPSBjb29yZGluYXRlcy5sZW5ndGg7XG4gICAgbGlzdGVuZXIucG9seWdvblN0YXJ0KCk7XG4gICAgd2hpbGUgKCsraSA8IG4pIGQzX2dlb19zdHJlYW1MaW5lKGNvb3JkaW5hdGVzW2ldLCBsaXN0ZW5lciwgMSk7XG4gICAgbGlzdGVuZXIucG9seWdvbkVuZCgpO1xuICB9XG4gIGQzLmdlby5hcmVhID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgZDNfZ2VvX2FyZWFTdW0gPSAwO1xuICAgIGQzLmdlby5zdHJlYW0ob2JqZWN0LCBkM19nZW9fYXJlYSk7XG4gICAgcmV0dXJuIGQzX2dlb19hcmVhU3VtO1xuICB9O1xuICB2YXIgZDNfZ2VvX2FyZWFTdW0sIGQzX2dlb19hcmVhUmluZ1N1bSA9IG5ldyBkM19hZGRlcigpO1xuICB2YXIgZDNfZ2VvX2FyZWEgPSB7XG4gICAgc3BoZXJlOiBmdW5jdGlvbigpIHtcbiAgICAgIGQzX2dlb19hcmVhU3VtICs9IDQgKiDPgDtcbiAgICB9LFxuICAgIHBvaW50OiBkM19ub29wLFxuICAgIGxpbmVTdGFydDogZDNfbm9vcCxcbiAgICBsaW5lRW5kOiBkM19ub29wLFxuICAgIHBvbHlnb25TdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICBkM19nZW9fYXJlYVJpbmdTdW0ucmVzZXQoKTtcbiAgICAgIGQzX2dlb19hcmVhLmxpbmVTdGFydCA9IGQzX2dlb19hcmVhUmluZ1N0YXJ0O1xuICAgIH0sXG4gICAgcG9seWdvbkVuZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJlYSA9IDIgKiBkM19nZW9fYXJlYVJpbmdTdW07XG4gICAgICBkM19nZW9fYXJlYVN1bSArPSBhcmVhIDwgMCA/IDQgKiDPgCArIGFyZWEgOiBhcmVhO1xuICAgICAgZDNfZ2VvX2FyZWEubGluZVN0YXJ0ID0gZDNfZ2VvX2FyZWEubGluZUVuZCA9IGQzX2dlb19hcmVhLnBvaW50ID0gZDNfbm9vcDtcbiAgICB9XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2dlb19hcmVhUmluZ1N0YXJ0KCkge1xuICAgIHZhciDOuzAwLCDPhjAwLCDOuzAsIGNvc8+GMCwgc2luz4YwO1xuICAgIGQzX2dlb19hcmVhLnBvaW50ID0gZnVuY3Rpb24ozrssIM+GKSB7XG4gICAgICBkM19nZW9fYXJlYS5wb2ludCA9IG5leHRQb2ludDtcbiAgICAgIM67MCA9ICjOuzAwID0gzrspICogZDNfcmFkaWFucywgY29zz4YwID0gTWF0aC5jb3Moz4YgPSAoz4YwMCA9IM+GKSAqIGQzX3JhZGlhbnMgLyAyICsgz4AgLyA0KSwgXG4gICAgICBzaW7PhjAgPSBNYXRoLnNpbijPhik7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBuZXh0UG9pbnQozrssIM+GKSB7XG4gICAgICDOuyAqPSBkM19yYWRpYW5zO1xuICAgICAgz4YgPSDPhiAqIGQzX3JhZGlhbnMgLyAyICsgz4AgLyA0O1xuICAgICAgdmFyIGTOuyA9IM67IC0gzrswLCBzZM67ID0gZM67ID49IDAgPyAxIDogLTEsIGFkzrsgPSBzZM67ICogZM67LCBjb3PPhiA9IE1hdGguY29zKM+GKSwgc2luz4YgPSBNYXRoLnNpbijPhiksIGsgPSBzaW7PhjAgKiBzaW7PhiwgdSA9IGNvc8+GMCAqIGNvc8+GICsgayAqIE1hdGguY29zKGFkzrspLCB2ID0gayAqIHNkzrsgKiBNYXRoLnNpbihhZM67KTtcbiAgICAgIGQzX2dlb19hcmVhUmluZ1N1bS5hZGQoTWF0aC5hdGFuMih2LCB1KSk7XG4gICAgICDOuzAgPSDOuywgY29zz4YwID0gY29zz4YsIHNpbs+GMCA9IHNpbs+GO1xuICAgIH1cbiAgICBkM19nZW9fYXJlYS5saW5lRW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICBuZXh0UG9pbnQozrswMCwgz4YwMCk7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fY2FydGVzaWFuKHNwaGVyaWNhbCkge1xuICAgIHZhciDOuyA9IHNwaGVyaWNhbFswXSwgz4YgPSBzcGhlcmljYWxbMV0sIGNvc8+GID0gTWF0aC5jb3Moz4YpO1xuICAgIHJldHVybiBbIGNvc8+GICogTWF0aC5jb3MozrspLCBjb3PPhiAqIE1hdGguc2luKM67KSwgTWF0aC5zaW4oz4YpIF07XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX2NhcnRlc2lhbkRvdChhLCBiKSB7XG4gICAgcmV0dXJuIGFbMF0gKiBiWzBdICsgYVsxXSAqIGJbMV0gKyBhWzJdICogYlsyXTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fY2FydGVzaWFuQ3Jvc3MoYSwgYikge1xuICAgIHJldHVybiBbIGFbMV0gKiBiWzJdIC0gYVsyXSAqIGJbMV0sIGFbMl0gKiBiWzBdIC0gYVswXSAqIGJbMl0sIGFbMF0gKiBiWzFdIC0gYVsxXSAqIGJbMF0gXTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fY2FydGVzaWFuQWRkKGEsIGIpIHtcbiAgICBhWzBdICs9IGJbMF07XG4gICAgYVsxXSArPSBiWzFdO1xuICAgIGFbMl0gKz0gYlsyXTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fY2FydGVzaWFuU2NhbGUodmVjdG9yLCBrKSB7XG4gICAgcmV0dXJuIFsgdmVjdG9yWzBdICogaywgdmVjdG9yWzFdICogaywgdmVjdG9yWzJdICogayBdO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19jYXJ0ZXNpYW5Ob3JtYWxpemUoZCkge1xuICAgIHZhciBsID0gTWF0aC5zcXJ0KGRbMF0gKiBkWzBdICsgZFsxXSAqIGRbMV0gKyBkWzJdICogZFsyXSk7XG4gICAgZFswXSAvPSBsO1xuICAgIGRbMV0gLz0gbDtcbiAgICBkWzJdIC89IGw7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX3NwaGVyaWNhbChjYXJ0ZXNpYW4pIHtcbiAgICByZXR1cm4gWyBNYXRoLmF0YW4yKGNhcnRlc2lhblsxXSwgY2FydGVzaWFuWzBdKSwgZDNfYXNpbihjYXJ0ZXNpYW5bMl0pIF07XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX3NwaGVyaWNhbEVxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYWJzKGFbMF0gLSBiWzBdKSA8IM61ICYmIGFicyhhWzFdIC0gYlsxXSkgPCDOtTtcbiAgfVxuICBkMy5nZW8uYm91bmRzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIM67MCwgz4YwLCDOuzEsIM+GMSwgzrtfLCDOu19fLCDPhl9fLCBwMCwgZM67U3VtLCByYW5nZXMsIHJhbmdlO1xuICAgIHZhciBib3VuZCA9IHtcbiAgICAgIHBvaW50OiBwb2ludCxcbiAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgbGluZUVuZDogbGluZUVuZCxcbiAgICAgIHBvbHlnb25TdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGJvdW5kLnBvaW50ID0gcmluZ1BvaW50O1xuICAgICAgICBib3VuZC5saW5lU3RhcnQgPSByaW5nU3RhcnQ7XG4gICAgICAgIGJvdW5kLmxpbmVFbmQgPSByaW5nRW5kO1xuICAgICAgICBkzrtTdW0gPSAwO1xuICAgICAgICBkM19nZW9fYXJlYS5wb2x5Z29uU3RhcnQoKTtcbiAgICAgIH0sXG4gICAgICBwb2x5Z29uRW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZDNfZ2VvX2FyZWEucG9seWdvbkVuZCgpO1xuICAgICAgICBib3VuZC5wb2ludCA9IHBvaW50O1xuICAgICAgICBib3VuZC5saW5lU3RhcnQgPSBsaW5lU3RhcnQ7XG4gICAgICAgIGJvdW5kLmxpbmVFbmQgPSBsaW5lRW5kO1xuICAgICAgICBpZiAoZDNfZ2VvX2FyZWFSaW5nU3VtIDwgMCkgzrswID0gLSjOuzEgPSAxODApLCDPhjAgPSAtKM+GMSA9IDkwKTsgZWxzZSBpZiAoZM67U3VtID4gzrUpIM+GMSA9IDkwOyBlbHNlIGlmIChkzrtTdW0gPCAtzrUpIM+GMCA9IC05MDtcbiAgICAgICAgcmFuZ2VbMF0gPSDOuzAsIHJhbmdlWzFdID0gzrsxO1xuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gcG9pbnQozrssIM+GKSB7XG4gICAgICByYW5nZXMucHVzaChyYW5nZSA9IFsgzrswID0gzrssIM67MSA9IM67IF0pO1xuICAgICAgaWYgKM+GIDwgz4YwKSDPhjAgPSDPhjtcbiAgICAgIGlmICjPhiA+IM+GMSkgz4YxID0gz4Y7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGxpbmVQb2ludCjOuywgz4YpIHtcbiAgICAgIHZhciBwID0gZDNfZ2VvX2NhcnRlc2lhbihbIM67ICogZDNfcmFkaWFucywgz4YgKiBkM19yYWRpYW5zIF0pO1xuICAgICAgaWYgKHAwKSB7XG4gICAgICAgIHZhciBub3JtYWwgPSBkM19nZW9fY2FydGVzaWFuQ3Jvc3MocDAsIHApLCBlcXVhdG9yaWFsID0gWyBub3JtYWxbMV0sIC1ub3JtYWxbMF0sIDAgXSwgaW5mbGVjdGlvbiA9IGQzX2dlb19jYXJ0ZXNpYW5Dcm9zcyhlcXVhdG9yaWFsLCBub3JtYWwpO1xuICAgICAgICBkM19nZW9fY2FydGVzaWFuTm9ybWFsaXplKGluZmxlY3Rpb24pO1xuICAgICAgICBpbmZsZWN0aW9uID0gZDNfZ2VvX3NwaGVyaWNhbChpbmZsZWN0aW9uKTtcbiAgICAgICAgdmFyIGTOuyA9IM67IC0gzrtfLCBzID0gZM67ID4gMCA/IDEgOiAtMSwgzrtpID0gaW5mbGVjdGlvblswXSAqIGQzX2RlZ3JlZXMgKiBzLCBhbnRpbWVyaWRpYW4gPSBhYnMoZM67KSA+IDE4MDtcbiAgICAgICAgaWYgKGFudGltZXJpZGlhbiBeIChzICogzrtfIDwgzrtpICYmIM67aSA8IHMgKiDOuykpIHtcbiAgICAgICAgICB2YXIgz4ZpID0gaW5mbGVjdGlvblsxXSAqIGQzX2RlZ3JlZXM7XG4gICAgICAgICAgaWYgKM+GaSA+IM+GMSkgz4YxID0gz4ZpO1xuICAgICAgICB9IGVsc2UgaWYgKM67aSA9ICjOu2kgKyAzNjApICUgMzYwIC0gMTgwLCBhbnRpbWVyaWRpYW4gXiAocyAqIM67XyA8IM67aSAmJiDOu2kgPCBzICogzrspKSB7XG4gICAgICAgICAgdmFyIM+GaSA9IC1pbmZsZWN0aW9uWzFdICogZDNfZGVncmVlcztcbiAgICAgICAgICBpZiAoz4ZpIDwgz4YwKSDPhjAgPSDPhmk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKM+GIDwgz4YwKSDPhjAgPSDPhjtcbiAgICAgICAgICBpZiAoz4YgPiDPhjEpIM+GMSA9IM+GO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhbnRpbWVyaWRpYW4pIHtcbiAgICAgICAgICBpZiAozrsgPCDOu18pIHtcbiAgICAgICAgICAgIGlmIChhbmdsZSjOuzAsIM67KSA+IGFuZ2xlKM67MCwgzrsxKSkgzrsxID0gzrs7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChhbmdsZSjOuywgzrsxKSA+IGFuZ2xlKM67MCwgzrsxKSkgzrswID0gzrs7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICjOuzEgPj0gzrswKSB7XG4gICAgICAgICAgICBpZiAozrsgPCDOuzApIM67MCA9IM67O1xuICAgICAgICAgICAgaWYgKM67ID4gzrsxKSDOuzEgPSDOuztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKM67ID4gzrtfKSB7XG4gICAgICAgICAgICAgIGlmIChhbmdsZSjOuzAsIM67KSA+IGFuZ2xlKM67MCwgzrsxKSkgzrsxID0gzrs7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoYW5nbGUozrssIM67MSkgPiBhbmdsZSjOuzAsIM67MSkpIM67MCA9IM67O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9pbnQozrssIM+GKTtcbiAgICAgIH1cbiAgICAgIHAwID0gcCwgzrtfID0gzrs7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGxpbmVTdGFydCgpIHtcbiAgICAgIGJvdW5kLnBvaW50ID0gbGluZVBvaW50O1xuICAgIH1cbiAgICBmdW5jdGlvbiBsaW5lRW5kKCkge1xuICAgICAgcmFuZ2VbMF0gPSDOuzAsIHJhbmdlWzFdID0gzrsxO1xuICAgICAgYm91bmQucG9pbnQgPSBwb2ludDtcbiAgICAgIHAwID0gbnVsbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmluZ1BvaW50KM67LCDPhikge1xuICAgICAgaWYgKHAwKSB7XG4gICAgICAgIHZhciBkzrsgPSDOuyAtIM67XztcbiAgICAgICAgZM67U3VtICs9IGFicyhkzrspID4gMTgwID8gZM67ICsgKGTOuyA+IDAgPyAzNjAgOiAtMzYwKSA6IGTOuztcbiAgICAgIH0gZWxzZSDOu19fID0gzrssIM+GX18gPSDPhjtcbiAgICAgIGQzX2dlb19hcmVhLnBvaW50KM67LCDPhik7XG4gICAgICBsaW5lUG9pbnQozrssIM+GKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmluZ1N0YXJ0KCkge1xuICAgICAgZDNfZ2VvX2FyZWEubGluZVN0YXJ0KCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJpbmdFbmQoKSB7XG4gICAgICByaW5nUG9pbnQozrtfXywgz4ZfXyk7XG4gICAgICBkM19nZW9fYXJlYS5saW5lRW5kKCk7XG4gICAgICBpZiAoYWJzKGTOu1N1bSkgPiDOtSkgzrswID0gLSjOuzEgPSAxODApO1xuICAgICAgcmFuZ2VbMF0gPSDOuzAsIHJhbmdlWzFdID0gzrsxO1xuICAgICAgcDAgPSBudWxsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhbmdsZSjOuzAsIM67MSkge1xuICAgICAgcmV0dXJuICjOuzEgLT0gzrswKSA8IDAgPyDOuzEgKyAzNjAgOiDOuzE7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNvbXBhcmVSYW5nZXMoYSwgYikge1xuICAgICAgcmV0dXJuIGFbMF0gLSBiWzBdO1xuICAgIH1cbiAgICBmdW5jdGlvbiB3aXRoaW5SYW5nZSh4LCByYW5nZSkge1xuICAgICAgcmV0dXJuIHJhbmdlWzBdIDw9IHJhbmdlWzFdID8gcmFuZ2VbMF0gPD0geCAmJiB4IDw9IHJhbmdlWzFdIDogeCA8IHJhbmdlWzBdIHx8IHJhbmdlWzFdIDwgeDtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIM+GMSA9IM67MSA9IC0ozrswID0gz4YwID0gSW5maW5pdHkpO1xuICAgICAgcmFuZ2VzID0gW107XG4gICAgICBkMy5nZW8uc3RyZWFtKGZlYXR1cmUsIGJvdW5kKTtcbiAgICAgIHZhciBuID0gcmFuZ2VzLmxlbmd0aDtcbiAgICAgIGlmIChuKSB7XG4gICAgICAgIHJhbmdlcy5zb3J0KGNvbXBhcmVSYW5nZXMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMSwgYSA9IHJhbmdlc1swXSwgYiwgbWVyZ2VkID0gWyBhIF07IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBiID0gcmFuZ2VzW2ldO1xuICAgICAgICAgIGlmICh3aXRoaW5SYW5nZShiWzBdLCBhKSB8fCB3aXRoaW5SYW5nZShiWzFdLCBhKSkge1xuICAgICAgICAgICAgaWYgKGFuZ2xlKGFbMF0sIGJbMV0pID4gYW5nbGUoYVswXSwgYVsxXSkpIGFbMV0gPSBiWzFdO1xuICAgICAgICAgICAgaWYgKGFuZ2xlKGJbMF0sIGFbMV0pID4gYW5nbGUoYVswXSwgYVsxXSkpIGFbMF0gPSBiWzBdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZXJnZWQucHVzaChhID0gYik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBiZXN0ID0gLUluZmluaXR5LCBkzrs7XG4gICAgICAgIGZvciAodmFyIG4gPSBtZXJnZWQubGVuZ3RoIC0gMSwgaSA9IDAsIGEgPSBtZXJnZWRbbl0sIGI7IGkgPD0gbjsgYSA9IGIsICsraSkge1xuICAgICAgICAgIGIgPSBtZXJnZWRbaV07XG4gICAgICAgICAgaWYgKChkzrsgPSBhbmdsZShhWzFdLCBiWzBdKSkgPiBiZXN0KSBiZXN0ID0gZM67LCDOuzAgPSBiWzBdLCDOuzEgPSBhWzFdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByYW5nZXMgPSByYW5nZSA9IG51bGw7XG4gICAgICByZXR1cm4gzrswID09PSBJbmZpbml0eSB8fCDPhjAgPT09IEluZmluaXR5ID8gWyBbIE5hTiwgTmFOIF0sIFsgTmFOLCBOYU4gXSBdIDogWyBbIM67MCwgz4YwIF0sIFsgzrsxLCDPhjEgXSBdO1xuICAgIH07XG4gIH0oKTtcbiAgZDMuZ2VvLmNlbnRyb2lkID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgZDNfZ2VvX2NlbnRyb2lkVzAgPSBkM19nZW9fY2VudHJvaWRXMSA9IGQzX2dlb19jZW50cm9pZFgwID0gZDNfZ2VvX2NlbnRyb2lkWTAgPSBkM19nZW9fY2VudHJvaWRaMCA9IGQzX2dlb19jZW50cm9pZFgxID0gZDNfZ2VvX2NlbnRyb2lkWTEgPSBkM19nZW9fY2VudHJvaWRaMSA9IGQzX2dlb19jZW50cm9pZFgyID0gZDNfZ2VvX2NlbnRyb2lkWTIgPSBkM19nZW9fY2VudHJvaWRaMiA9IDA7XG4gICAgZDMuZ2VvLnN0cmVhbShvYmplY3QsIGQzX2dlb19jZW50cm9pZCk7XG4gICAgdmFyIHggPSBkM19nZW9fY2VudHJvaWRYMiwgeSA9IGQzX2dlb19jZW50cm9pZFkyLCB6ID0gZDNfZ2VvX2NlbnRyb2lkWjIsIG0gPSB4ICogeCArIHkgKiB5ICsgeiAqIHo7XG4gICAgaWYgKG0gPCDOtTIpIHtcbiAgICAgIHggPSBkM19nZW9fY2VudHJvaWRYMSwgeSA9IGQzX2dlb19jZW50cm9pZFkxLCB6ID0gZDNfZ2VvX2NlbnRyb2lkWjE7XG4gICAgICBpZiAoZDNfZ2VvX2NlbnRyb2lkVzEgPCDOtSkgeCA9IGQzX2dlb19jZW50cm9pZFgwLCB5ID0gZDNfZ2VvX2NlbnRyb2lkWTAsIHogPSBkM19nZW9fY2VudHJvaWRaMDtcbiAgICAgIG0gPSB4ICogeCArIHkgKiB5ICsgeiAqIHo7XG4gICAgICBpZiAobSA8IM61MikgcmV0dXJuIFsgTmFOLCBOYU4gXTtcbiAgICB9XG4gICAgcmV0dXJuIFsgTWF0aC5hdGFuMih5LCB4KSAqIGQzX2RlZ3JlZXMsIGQzX2FzaW4oeiAvIE1hdGguc3FydChtKSkgKiBkM19kZWdyZWVzIF07XG4gIH07XG4gIHZhciBkM19nZW9fY2VudHJvaWRXMCwgZDNfZ2VvX2NlbnRyb2lkVzEsIGQzX2dlb19jZW50cm9pZFgwLCBkM19nZW9fY2VudHJvaWRZMCwgZDNfZ2VvX2NlbnRyb2lkWjAsIGQzX2dlb19jZW50cm9pZFgxLCBkM19nZW9fY2VudHJvaWRZMSwgZDNfZ2VvX2NlbnRyb2lkWjEsIGQzX2dlb19jZW50cm9pZFgyLCBkM19nZW9fY2VudHJvaWRZMiwgZDNfZ2VvX2NlbnRyb2lkWjI7XG4gIHZhciBkM19nZW9fY2VudHJvaWQgPSB7XG4gICAgc3BoZXJlOiBkM19ub29wLFxuICAgIHBvaW50OiBkM19nZW9fY2VudHJvaWRQb2ludCxcbiAgICBsaW5lU3RhcnQ6IGQzX2dlb19jZW50cm9pZExpbmVTdGFydCxcbiAgICBsaW5lRW5kOiBkM19nZW9fY2VudHJvaWRMaW5lRW5kLFxuICAgIHBvbHlnb25TdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICBkM19nZW9fY2VudHJvaWQubGluZVN0YXJ0ID0gZDNfZ2VvX2NlbnRyb2lkUmluZ1N0YXJ0O1xuICAgIH0sXG4gICAgcG9seWdvbkVuZDogZnVuY3Rpb24oKSB7XG4gICAgICBkM19nZW9fY2VudHJvaWQubGluZVN0YXJ0ID0gZDNfZ2VvX2NlbnRyb2lkTGluZVN0YXJ0O1xuICAgIH1cbiAgfTtcbiAgZnVuY3Rpb24gZDNfZ2VvX2NlbnRyb2lkUG9pbnQozrssIM+GKSB7XG4gICAgzrsgKj0gZDNfcmFkaWFucztcbiAgICB2YXIgY29zz4YgPSBNYXRoLmNvcyjPhiAqPSBkM19yYWRpYW5zKTtcbiAgICBkM19nZW9fY2VudHJvaWRQb2ludFhZWihjb3PPhiAqIE1hdGguY29zKM67KSwgY29zz4YgKiBNYXRoLnNpbijOuyksIE1hdGguc2luKM+GKSk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX2NlbnRyb2lkUG9pbnRYWVooeCwgeSwgeikge1xuICAgICsrZDNfZ2VvX2NlbnRyb2lkVzA7XG4gICAgZDNfZ2VvX2NlbnRyb2lkWDAgKz0gKHggLSBkM19nZW9fY2VudHJvaWRYMCkgLyBkM19nZW9fY2VudHJvaWRXMDtcbiAgICBkM19nZW9fY2VudHJvaWRZMCArPSAoeSAtIGQzX2dlb19jZW50cm9pZFkwKSAvIGQzX2dlb19jZW50cm9pZFcwO1xuICAgIGQzX2dlb19jZW50cm9pZFowICs9ICh6IC0gZDNfZ2VvX2NlbnRyb2lkWjApIC8gZDNfZ2VvX2NlbnRyb2lkVzA7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX2NlbnRyb2lkTGluZVN0YXJ0KCkge1xuICAgIHZhciB4MCwgeTAsIHowO1xuICAgIGQzX2dlb19jZW50cm9pZC5wb2ludCA9IGZ1bmN0aW9uKM67LCDPhikge1xuICAgICAgzrsgKj0gZDNfcmFkaWFucztcbiAgICAgIHZhciBjb3PPhiA9IE1hdGguY29zKM+GICo9IGQzX3JhZGlhbnMpO1xuICAgICAgeDAgPSBjb3PPhiAqIE1hdGguY29zKM67KTtcbiAgICAgIHkwID0gY29zz4YgKiBNYXRoLnNpbijOuyk7XG4gICAgICB6MCA9IE1hdGguc2luKM+GKTtcbiAgICAgIGQzX2dlb19jZW50cm9pZC5wb2ludCA9IG5leHRQb2ludDtcbiAgICAgIGQzX2dlb19jZW50cm9pZFBvaW50WFlaKHgwLCB5MCwgejApO1xuICAgIH07XG4gICAgZnVuY3Rpb24gbmV4dFBvaW50KM67LCDPhikge1xuICAgICAgzrsgKj0gZDNfcmFkaWFucztcbiAgICAgIHZhciBjb3PPhiA9IE1hdGguY29zKM+GICo9IGQzX3JhZGlhbnMpLCB4ID0gY29zz4YgKiBNYXRoLmNvcyjOuyksIHkgPSBjb3PPhiAqIE1hdGguc2luKM67KSwgeiA9IE1hdGguc2luKM+GKSwgdyA9IE1hdGguYXRhbjIoTWF0aC5zcXJ0KCh3ID0geTAgKiB6IC0gejAgKiB5KSAqIHcgKyAodyA9IHowICogeCAtIHgwICogeikgKiB3ICsgKHcgPSB4MCAqIHkgLSB5MCAqIHgpICogdyksIHgwICogeCArIHkwICogeSArIHowICogeik7XG4gICAgICBkM19nZW9fY2VudHJvaWRXMSArPSB3O1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkWDEgKz0gdyAqICh4MCArICh4MCA9IHgpKTtcbiAgICAgIGQzX2dlb19jZW50cm9pZFkxICs9IHcgKiAoeTAgKyAoeTAgPSB5KSk7XG4gICAgICBkM19nZW9fY2VudHJvaWRaMSArPSB3ICogKHowICsgKHowID0geikpO1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkUG9pbnRYWVooeDAsIHkwLCB6MCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19jZW50cm9pZExpbmVFbmQoKSB7XG4gICAgZDNfZ2VvX2NlbnRyb2lkLnBvaW50ID0gZDNfZ2VvX2NlbnRyb2lkUG9pbnQ7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX2NlbnRyb2lkUmluZ1N0YXJ0KCkge1xuICAgIHZhciDOuzAwLCDPhjAwLCB4MCwgeTAsIHowO1xuICAgIGQzX2dlb19jZW50cm9pZC5wb2ludCA9IGZ1bmN0aW9uKM67LCDPhikge1xuICAgICAgzrswMCA9IM67LCDPhjAwID0gz4Y7XG4gICAgICBkM19nZW9fY2VudHJvaWQucG9pbnQgPSBuZXh0UG9pbnQ7XG4gICAgICDOuyAqPSBkM19yYWRpYW5zO1xuICAgICAgdmFyIGNvc8+GID0gTWF0aC5jb3Moz4YgKj0gZDNfcmFkaWFucyk7XG4gICAgICB4MCA9IGNvc8+GICogTWF0aC5jb3MozrspO1xuICAgICAgeTAgPSBjb3PPhiAqIE1hdGguc2luKM67KTtcbiAgICAgIHowID0gTWF0aC5zaW4oz4YpO1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkUG9pbnRYWVooeDAsIHkwLCB6MCk7XG4gICAgfTtcbiAgICBkM19nZW9fY2VudHJvaWQubGluZUVuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgbmV4dFBvaW50KM67MDAsIM+GMDApO1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkLmxpbmVFbmQgPSBkM19nZW9fY2VudHJvaWRMaW5lRW5kO1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkLnBvaW50ID0gZDNfZ2VvX2NlbnRyb2lkUG9pbnQ7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBuZXh0UG9pbnQozrssIM+GKSB7XG4gICAgICDOuyAqPSBkM19yYWRpYW5zO1xuICAgICAgdmFyIGNvc8+GID0gTWF0aC5jb3Moz4YgKj0gZDNfcmFkaWFucyksIHggPSBjb3PPhiAqIE1hdGguY29zKM67KSwgeSA9IGNvc8+GICogTWF0aC5zaW4ozrspLCB6ID0gTWF0aC5zaW4oz4YpLCBjeCA9IHkwICogeiAtIHowICogeSwgY3kgPSB6MCAqIHggLSB4MCAqIHosIGN6ID0geDAgKiB5IC0geTAgKiB4LCBtID0gTWF0aC5zcXJ0KGN4ICogY3ggKyBjeSAqIGN5ICsgY3ogKiBjeiksIHUgPSB4MCAqIHggKyB5MCAqIHkgKyB6MCAqIHosIHYgPSBtICYmIC1kM19hY29zKHUpIC8gbSwgdyA9IE1hdGguYXRhbjIobSwgdSk7XG4gICAgICBkM19nZW9fY2VudHJvaWRYMiArPSB2ICogY3g7XG4gICAgICBkM19nZW9fY2VudHJvaWRZMiArPSB2ICogY3k7XG4gICAgICBkM19nZW9fY2VudHJvaWRaMiArPSB2ICogY3o7XG4gICAgICBkM19nZW9fY2VudHJvaWRXMSArPSB3O1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkWDEgKz0gdyAqICh4MCArICh4MCA9IHgpKTtcbiAgICAgIGQzX2dlb19jZW50cm9pZFkxICs9IHcgKiAoeTAgKyAoeTAgPSB5KSk7XG4gICAgICBkM19nZW9fY2VudHJvaWRaMSArPSB3ICogKHowICsgKHowID0geikpO1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkUG9pbnRYWVooeDAsIHkwLCB6MCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19jb21wb3NlKGEsIGIpIHtcbiAgICBmdW5jdGlvbiBjb21wb3NlKHgsIHkpIHtcbiAgICAgIHJldHVybiB4ID0gYSh4LCB5KSwgYih4WzBdLCB4WzFdKTtcbiAgICB9XG4gICAgaWYgKGEuaW52ZXJ0ICYmIGIuaW52ZXJ0KSBjb21wb3NlLmludmVydCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgIHJldHVybiB4ID0gYi5pbnZlcnQoeCwgeSksIHggJiYgYS5pbnZlcnQoeFswXSwgeFsxXSk7XG4gICAgfTtcbiAgICByZXR1cm4gY29tcG9zZTtcbiAgfVxuICBmdW5jdGlvbiBkM190cnVlKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19jbGlwUG9seWdvbihzZWdtZW50cywgY29tcGFyZSwgY2xpcFN0YXJ0SW5zaWRlLCBpbnRlcnBvbGF0ZSwgbGlzdGVuZXIpIHtcbiAgICB2YXIgc3ViamVjdCA9IFtdLCBjbGlwID0gW107XG4gICAgc2VnbWVudHMuZm9yRWFjaChmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgICBpZiAoKG4gPSBzZWdtZW50Lmxlbmd0aCAtIDEpIDw9IDApIHJldHVybjtcbiAgICAgIHZhciBuLCBwMCA9IHNlZ21lbnRbMF0sIHAxID0gc2VnbWVudFtuXTtcbiAgICAgIGlmIChkM19nZW9fc3BoZXJpY2FsRXF1YWwocDAsIHAxKSkge1xuICAgICAgICBsaXN0ZW5lci5saW5lU3RhcnQoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIGxpc3RlbmVyLnBvaW50KChwMCA9IHNlZ21lbnRbaV0pWzBdLCBwMFsxXSk7XG4gICAgICAgIGxpc3RlbmVyLmxpbmVFbmQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIGEgPSBuZXcgZDNfZ2VvX2NsaXBQb2x5Z29uSW50ZXJzZWN0aW9uKHAwLCBzZWdtZW50LCBudWxsLCB0cnVlKSwgYiA9IG5ldyBkM19nZW9fY2xpcFBvbHlnb25JbnRlcnNlY3Rpb24ocDAsIG51bGwsIGEsIGZhbHNlKTtcbiAgICAgIGEubyA9IGI7XG4gICAgICBzdWJqZWN0LnB1c2goYSk7XG4gICAgICBjbGlwLnB1c2goYik7XG4gICAgICBhID0gbmV3IGQzX2dlb19jbGlwUG9seWdvbkludGVyc2VjdGlvbihwMSwgc2VnbWVudCwgbnVsbCwgZmFsc2UpO1xuICAgICAgYiA9IG5ldyBkM19nZW9fY2xpcFBvbHlnb25JbnRlcnNlY3Rpb24ocDEsIG51bGwsIGEsIHRydWUpO1xuICAgICAgYS5vID0gYjtcbiAgICAgIHN1YmplY3QucHVzaChhKTtcbiAgICAgIGNsaXAucHVzaChiKTtcbiAgICB9KTtcbiAgICBjbGlwLnNvcnQoY29tcGFyZSk7XG4gICAgZDNfZ2VvX2NsaXBQb2x5Z29uTGlua0NpcmN1bGFyKHN1YmplY3QpO1xuICAgIGQzX2dlb19jbGlwUG9seWdvbkxpbmtDaXJjdWxhcihjbGlwKTtcbiAgICBpZiAoIXN1YmplY3QubGVuZ3RoKSByZXR1cm47XG4gICAgZm9yICh2YXIgaSA9IDAsIGVudHJ5ID0gY2xpcFN0YXJ0SW5zaWRlLCBuID0gY2xpcC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgIGNsaXBbaV0uZSA9IGVudHJ5ID0gIWVudHJ5O1xuICAgIH1cbiAgICB2YXIgc3RhcnQgPSBzdWJqZWN0WzBdLCBwb2ludHMsIHBvaW50O1xuICAgIHdoaWxlICgxKSB7XG4gICAgICB2YXIgY3VycmVudCA9IHN0YXJ0LCBpc1N1YmplY3QgPSB0cnVlO1xuICAgICAgd2hpbGUgKGN1cnJlbnQudikgaWYgKChjdXJyZW50ID0gY3VycmVudC5uKSA9PT0gc3RhcnQpIHJldHVybjtcbiAgICAgIHBvaW50cyA9IGN1cnJlbnQuejtcbiAgICAgIGxpc3RlbmVyLmxpbmVTdGFydCgpO1xuICAgICAgZG8ge1xuICAgICAgICBjdXJyZW50LnYgPSBjdXJyZW50Lm8udiA9IHRydWU7XG4gICAgICAgIGlmIChjdXJyZW50LmUpIHtcbiAgICAgICAgICBpZiAoaXNTdWJqZWN0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IHBvaW50cy5sZW5ndGg7IGkgPCBuOyArK2kpIGxpc3RlbmVyLnBvaW50KChwb2ludCA9IHBvaW50c1tpXSlbMF0sIHBvaW50WzFdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW50ZXJwb2xhdGUoY3VycmVudC54LCBjdXJyZW50Lm4ueCwgMSwgbGlzdGVuZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5uO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChpc1N1YmplY3QpIHtcbiAgICAgICAgICAgIHBvaW50cyA9IGN1cnJlbnQucC56O1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHBvaW50cy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkgbGlzdGVuZXIucG9pbnQoKHBvaW50ID0gcG9pbnRzW2ldKVswXSwgcG9pbnRbMV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbnRlcnBvbGF0ZShjdXJyZW50LngsIGN1cnJlbnQucC54LCAtMSwgbGlzdGVuZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5wO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnQgPSBjdXJyZW50Lm87XG4gICAgICAgIHBvaW50cyA9IGN1cnJlbnQuejtcbiAgICAgICAgaXNTdWJqZWN0ID0gIWlzU3ViamVjdDtcbiAgICAgIH0gd2hpbGUgKCFjdXJyZW50LnYpO1xuICAgICAgbGlzdGVuZXIubGluZUVuZCgpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fY2xpcFBvbHlnb25MaW5rQ2lyY3VsYXIoYXJyYXkpIHtcbiAgICBpZiAoIShuID0gYXJyYXkubGVuZ3RoKSkgcmV0dXJuO1xuICAgIHZhciBuLCBpID0gMCwgYSA9IGFycmF5WzBdLCBiO1xuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBhLm4gPSBiID0gYXJyYXlbaV07XG4gICAgICBiLnAgPSBhO1xuICAgICAgYSA9IGI7XG4gICAgfVxuICAgIGEubiA9IGIgPSBhcnJheVswXTtcbiAgICBiLnAgPSBhO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19jbGlwUG9seWdvbkludGVyc2VjdGlvbihwb2ludCwgcG9pbnRzLCBvdGhlciwgZW50cnkpIHtcbiAgICB0aGlzLnggPSBwb2ludDtcbiAgICB0aGlzLnogPSBwb2ludHM7XG4gICAgdGhpcy5vID0gb3RoZXI7XG4gICAgdGhpcy5lID0gZW50cnk7XG4gICAgdGhpcy52ID0gZmFsc2U7XG4gICAgdGhpcy5uID0gdGhpcy5wID0gbnVsbDtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fY2xpcChwb2ludFZpc2libGUsIGNsaXBMaW5lLCBpbnRlcnBvbGF0ZSwgY2xpcFN0YXJ0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJvdGF0ZSwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBsaW5lID0gY2xpcExpbmUobGlzdGVuZXIpLCByb3RhdGVkQ2xpcFN0YXJ0ID0gcm90YXRlLmludmVydChjbGlwU3RhcnRbMF0sIGNsaXBTdGFydFsxXSk7XG4gICAgICB2YXIgY2xpcCA9IHtcbiAgICAgICAgcG9pbnQ6IHBvaW50LFxuICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgbGluZUVuZDogbGluZUVuZCxcbiAgICAgICAgcG9seWdvblN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjbGlwLnBvaW50ID0gcG9pbnRSaW5nO1xuICAgICAgICAgIGNsaXAubGluZVN0YXJ0ID0gcmluZ1N0YXJ0O1xuICAgICAgICAgIGNsaXAubGluZUVuZCA9IHJpbmdFbmQ7XG4gICAgICAgICAgc2VnbWVudHMgPSBbXTtcbiAgICAgICAgICBwb2x5Z29uID0gW107XG4gICAgICAgIH0sXG4gICAgICAgIHBvbHlnb25FbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNsaXAucG9pbnQgPSBwb2ludDtcbiAgICAgICAgICBjbGlwLmxpbmVTdGFydCA9IGxpbmVTdGFydDtcbiAgICAgICAgICBjbGlwLmxpbmVFbmQgPSBsaW5lRW5kO1xuICAgICAgICAgIHNlZ21lbnRzID0gZDMubWVyZ2Uoc2VnbWVudHMpO1xuICAgICAgICAgIHZhciBjbGlwU3RhcnRJbnNpZGUgPSBkM19nZW9fcG9pbnRJblBvbHlnb24ocm90YXRlZENsaXBTdGFydCwgcG9seWdvbik7XG4gICAgICAgICAgaWYgKHNlZ21lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKCFwb2x5Z29uU3RhcnRlZCkgbGlzdGVuZXIucG9seWdvblN0YXJ0KCksIHBvbHlnb25TdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGQzX2dlb19jbGlwUG9seWdvbihzZWdtZW50cywgZDNfZ2VvX2NsaXBTb3J0LCBjbGlwU3RhcnRJbnNpZGUsIGludGVycG9sYXRlLCBsaXN0ZW5lcik7XG4gICAgICAgICAgfSBlbHNlIGlmIChjbGlwU3RhcnRJbnNpZGUpIHtcbiAgICAgICAgICAgIGlmICghcG9seWdvblN0YXJ0ZWQpIGxpc3RlbmVyLnBvbHlnb25TdGFydCgpLCBwb2x5Z29uU3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBsaXN0ZW5lci5saW5lU3RhcnQoKTtcbiAgICAgICAgICAgIGludGVycG9sYXRlKG51bGwsIG51bGwsIDEsIGxpc3RlbmVyKTtcbiAgICAgICAgICAgIGxpc3RlbmVyLmxpbmVFbmQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHBvbHlnb25TdGFydGVkKSBsaXN0ZW5lci5wb2x5Z29uRW5kKCksIHBvbHlnb25TdGFydGVkID0gZmFsc2U7XG4gICAgICAgICAgc2VnbWVudHMgPSBwb2x5Z29uID0gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgc3BoZXJlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBsaXN0ZW5lci5wb2x5Z29uU3RhcnQoKTtcbiAgICAgICAgICBsaXN0ZW5lci5saW5lU3RhcnQoKTtcbiAgICAgICAgICBpbnRlcnBvbGF0ZShudWxsLCBudWxsLCAxLCBsaXN0ZW5lcik7XG4gICAgICAgICAgbGlzdGVuZXIubGluZUVuZCgpO1xuICAgICAgICAgIGxpc3RlbmVyLnBvbHlnb25FbmQoKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGZ1bmN0aW9uIHBvaW50KM67LCDPhikge1xuICAgICAgICB2YXIgcG9pbnQgPSByb3RhdGUozrssIM+GKTtcbiAgICAgICAgaWYgKHBvaW50VmlzaWJsZSjOuyA9IHBvaW50WzBdLCDPhiA9IHBvaW50WzFdKSkgbGlzdGVuZXIucG9pbnQozrssIM+GKTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIHBvaW50TGluZSjOuywgz4YpIHtcbiAgICAgICAgdmFyIHBvaW50ID0gcm90YXRlKM67LCDPhik7XG4gICAgICAgIGxpbmUucG9pbnQocG9pbnRbMF0sIHBvaW50WzFdKTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIGxpbmVTdGFydCgpIHtcbiAgICAgICAgY2xpcC5wb2ludCA9IHBvaW50TGluZTtcbiAgICAgICAgbGluZS5saW5lU3RhcnQoKTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIGxpbmVFbmQoKSB7XG4gICAgICAgIGNsaXAucG9pbnQgPSBwb2ludDtcbiAgICAgICAgbGluZS5saW5lRW5kKCk7XG4gICAgICB9XG4gICAgICB2YXIgc2VnbWVudHM7XG4gICAgICB2YXIgYnVmZmVyID0gZDNfZ2VvX2NsaXBCdWZmZXJMaXN0ZW5lcigpLCByaW5nTGlzdGVuZXIgPSBjbGlwTGluZShidWZmZXIpLCBwb2x5Z29uU3RhcnRlZCA9IGZhbHNlLCBwb2x5Z29uLCByaW5nO1xuICAgICAgZnVuY3Rpb24gcG9pbnRSaW5nKM67LCDPhikge1xuICAgICAgICByaW5nLnB1c2goWyDOuywgz4YgXSk7XG4gICAgICAgIHZhciBwb2ludCA9IHJvdGF0ZSjOuywgz4YpO1xuICAgICAgICByaW5nTGlzdGVuZXIucG9pbnQocG9pbnRbMF0sIHBvaW50WzFdKTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIHJpbmdTdGFydCgpIHtcbiAgICAgICAgcmluZ0xpc3RlbmVyLmxpbmVTdGFydCgpO1xuICAgICAgICByaW5nID0gW107XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiByaW5nRW5kKCkge1xuICAgICAgICBwb2ludFJpbmcocmluZ1swXVswXSwgcmluZ1swXVsxXSk7XG4gICAgICAgIHJpbmdMaXN0ZW5lci5saW5lRW5kKCk7XG4gICAgICAgIHZhciBjbGVhbiA9IHJpbmdMaXN0ZW5lci5jbGVhbigpLCByaW5nU2VnbWVudHMgPSBidWZmZXIuYnVmZmVyKCksIHNlZ21lbnQsIG4gPSByaW5nU2VnbWVudHMubGVuZ3RoO1xuICAgICAgICByaW5nLnBvcCgpO1xuICAgICAgICBwb2x5Z29uLnB1c2gocmluZyk7XG4gICAgICAgIHJpbmcgPSBudWxsO1xuICAgICAgICBpZiAoIW4pIHJldHVybjtcbiAgICAgICAgaWYgKGNsZWFuICYgMSkge1xuICAgICAgICAgIHNlZ21lbnQgPSByaW5nU2VnbWVudHNbMF07XG4gICAgICAgICAgdmFyIG4gPSBzZWdtZW50Lmxlbmd0aCAtIDEsIGkgPSAtMSwgcG9pbnQ7XG4gICAgICAgICAgaWYgKG4gPiAwKSB7XG4gICAgICAgICAgICBpZiAoIXBvbHlnb25TdGFydGVkKSBsaXN0ZW5lci5wb2x5Z29uU3RhcnQoKSwgcG9seWdvblN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgbGlzdGVuZXIubGluZVN0YXJ0KCk7XG4gICAgICAgICAgICB3aGlsZSAoKytpIDwgbikgbGlzdGVuZXIucG9pbnQoKHBvaW50ID0gc2VnbWVudFtpXSlbMF0sIHBvaW50WzFdKTtcbiAgICAgICAgICAgIGxpc3RlbmVyLmxpbmVFbmQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuID4gMSAmJiBjbGVhbiAmIDIpIHJpbmdTZWdtZW50cy5wdXNoKHJpbmdTZWdtZW50cy5wb3AoKS5jb25jYXQocmluZ1NlZ21lbnRzLnNoaWZ0KCkpKTtcbiAgICAgICAgc2VnbWVudHMucHVzaChyaW5nU2VnbWVudHMuZmlsdGVyKGQzX2dlb19jbGlwU2VnbWVudExlbmd0aDEpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjbGlwO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX2NsaXBTZWdtZW50TGVuZ3RoMShzZWdtZW50KSB7XG4gICAgcmV0dXJuIHNlZ21lbnQubGVuZ3RoID4gMTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fY2xpcEJ1ZmZlckxpc3RlbmVyKCkge1xuICAgIHZhciBsaW5lcyA9IFtdLCBsaW5lO1xuICAgIHJldHVybiB7XG4gICAgICBsaW5lU3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsaW5lcy5wdXNoKGxpbmUgPSBbXSk7XG4gICAgICB9LFxuICAgICAgcG9pbnQ6IGZ1bmN0aW9uKM67LCDPhikge1xuICAgICAgICBsaW5lLnB1c2goWyDOuywgz4YgXSk7XG4gICAgICB9LFxuICAgICAgbGluZUVuZDogZDNfbm9vcCxcbiAgICAgIGJ1ZmZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBidWZmZXIgPSBsaW5lcztcbiAgICAgICAgbGluZXMgPSBbXTtcbiAgICAgICAgbGluZSA9IG51bGw7XG4gICAgICAgIHJldHVybiBidWZmZXI7XG4gICAgICB9LFxuICAgICAgcmVqb2luOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA+IDEpIGxpbmVzLnB1c2gobGluZXMucG9wKCkuY29uY2F0KGxpbmVzLnNoaWZ0KCkpKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19jbGlwU29ydChhLCBiKSB7XG4gICAgcmV0dXJuICgoYSA9IGEueClbMF0gPCAwID8gYVsxXSAtIGhhbGbPgCAtIM61IDogaGFsZs+AIC0gYVsxXSkgLSAoKGIgPSBiLngpWzBdIDwgMCA/IGJbMV0gLSBoYWxmz4AgLSDOtSA6IGhhbGbPgCAtIGJbMV0pO1xuICB9XG4gIHZhciBkM19nZW9fY2xpcEFudGltZXJpZGlhbiA9IGQzX2dlb19jbGlwKGQzX3RydWUsIGQzX2dlb19jbGlwQW50aW1lcmlkaWFuTGluZSwgZDNfZ2VvX2NsaXBBbnRpbWVyaWRpYW5JbnRlcnBvbGF0ZSwgWyAtz4AsIC3PgCAvIDIgXSk7XG4gIGZ1bmN0aW9uIGQzX2dlb19jbGlwQW50aW1lcmlkaWFuTGluZShsaXN0ZW5lcikge1xuICAgIHZhciDOuzAgPSBOYU4sIM+GMCA9IE5hTiwgc867MCA9IE5hTiwgY2xlYW47XG4gICAgcmV0dXJuIHtcbiAgICAgIGxpbmVTdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGxpc3RlbmVyLmxpbmVTdGFydCgpO1xuICAgICAgICBjbGVhbiA9IDE7XG4gICAgICB9LFxuICAgICAgcG9pbnQ6IGZ1bmN0aW9uKM67MSwgz4YxKSB7XG4gICAgICAgIHZhciBzzrsxID0gzrsxID4gMCA/IM+AIDogLc+ALCBkzrsgPSBhYnMozrsxIC0gzrswKTtcbiAgICAgICAgaWYgKGFicyhkzrsgLSDPgCkgPCDOtSkge1xuICAgICAgICAgIGxpc3RlbmVyLnBvaW50KM67MCwgz4YwID0gKM+GMCArIM+GMSkgLyAyID4gMCA/IGhhbGbPgCA6IC1oYWxmz4ApO1xuICAgICAgICAgIGxpc3RlbmVyLnBvaW50KHPOuzAsIM+GMCk7XG4gICAgICAgICAgbGlzdGVuZXIubGluZUVuZCgpO1xuICAgICAgICAgIGxpc3RlbmVyLmxpbmVTdGFydCgpO1xuICAgICAgICAgIGxpc3RlbmVyLnBvaW50KHPOuzEsIM+GMCk7XG4gICAgICAgICAgbGlzdGVuZXIucG9pbnQozrsxLCDPhjApO1xuICAgICAgICAgIGNsZWFuID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChzzrswICE9PSBzzrsxICYmIGTOuyA+PSDPgCkge1xuICAgICAgICAgIGlmIChhYnMozrswIC0gc867MCkgPCDOtSkgzrswIC09IHPOuzAgKiDOtTtcbiAgICAgICAgICBpZiAoYWJzKM67MSAtIHPOuzEpIDwgzrUpIM67MSAtPSBzzrsxICogzrU7XG4gICAgICAgICAgz4YwID0gZDNfZ2VvX2NsaXBBbnRpbWVyaWRpYW5JbnRlcnNlY3QozrswLCDPhjAsIM67MSwgz4YxKTtcbiAgICAgICAgICBsaXN0ZW5lci5wb2ludChzzrswLCDPhjApO1xuICAgICAgICAgIGxpc3RlbmVyLmxpbmVFbmQoKTtcbiAgICAgICAgICBsaXN0ZW5lci5saW5lU3RhcnQoKTtcbiAgICAgICAgICBsaXN0ZW5lci5wb2ludChzzrsxLCDPhjApO1xuICAgICAgICAgIGNsZWFuID0gMDtcbiAgICAgICAgfVxuICAgICAgICBsaXN0ZW5lci5wb2ludCjOuzAgPSDOuzEsIM+GMCA9IM+GMSk7XG4gICAgICAgIHPOuzAgPSBzzrsxO1xuICAgICAgfSxcbiAgICAgIGxpbmVFbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsaXN0ZW5lci5saW5lRW5kKCk7XG4gICAgICAgIM67MCA9IM+GMCA9IE5hTjtcbiAgICAgIH0sXG4gICAgICBjbGVhbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAyIC0gY2xlYW47XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fY2xpcEFudGltZXJpZGlhbkludGVyc2VjdCjOuzAsIM+GMCwgzrsxLCDPhjEpIHtcbiAgICB2YXIgY29zz4YwLCBjb3PPhjEsIHNpbs67MF/OuzEgPSBNYXRoLnNpbijOuzAgLSDOuzEpO1xuICAgIHJldHVybiBhYnMoc2luzrswX867MSkgPiDOtSA/IE1hdGguYXRhbigoTWF0aC5zaW4oz4YwKSAqIChjb3PPhjEgPSBNYXRoLmNvcyjPhjEpKSAqIE1hdGguc2luKM67MSkgLSBNYXRoLnNpbijPhjEpICogKGNvc8+GMCA9IE1hdGguY29zKM+GMCkpICogTWF0aC5zaW4ozrswKSkgLyAoY29zz4YwICogY29zz4YxICogc2luzrswX867MSkpIDogKM+GMCArIM+GMSkgLyAyO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19jbGlwQW50aW1lcmlkaWFuSW50ZXJwb2xhdGUoZnJvbSwgdG8sIGRpcmVjdGlvbiwgbGlzdGVuZXIpIHtcbiAgICB2YXIgz4Y7XG4gICAgaWYgKGZyb20gPT0gbnVsbCkge1xuICAgICAgz4YgPSBkaXJlY3Rpb24gKiBoYWxmz4A7XG4gICAgICBsaXN0ZW5lci5wb2ludCgtz4AsIM+GKTtcbiAgICAgIGxpc3RlbmVyLnBvaW50KDAsIM+GKTtcbiAgICAgIGxpc3RlbmVyLnBvaW50KM+ALCDPhik7XG4gICAgICBsaXN0ZW5lci5wb2ludCjPgCwgMCk7XG4gICAgICBsaXN0ZW5lci5wb2ludCjPgCwgLc+GKTtcbiAgICAgIGxpc3RlbmVyLnBvaW50KDAsIC3Phik7XG4gICAgICBsaXN0ZW5lci5wb2ludCgtz4AsIC3Phik7XG4gICAgICBsaXN0ZW5lci5wb2ludCgtz4AsIDApO1xuICAgICAgbGlzdGVuZXIucG9pbnQoLc+ALCDPhik7XG4gICAgfSBlbHNlIGlmIChhYnMoZnJvbVswXSAtIHRvWzBdKSA+IM61KSB7XG4gICAgICB2YXIgcyA9IGZyb21bMF0gPCB0b1swXSA/IM+AIDogLc+AO1xuICAgICAgz4YgPSBkaXJlY3Rpb24gKiBzIC8gMjtcbiAgICAgIGxpc3RlbmVyLnBvaW50KC1zLCDPhik7XG4gICAgICBsaXN0ZW5lci5wb2ludCgwLCDPhik7XG4gICAgICBsaXN0ZW5lci5wb2ludChzLCDPhik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3RlbmVyLnBvaW50KHRvWzBdLCB0b1sxXSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19wb2ludEluUG9seWdvbihwb2ludCwgcG9seWdvbikge1xuICAgIHZhciBtZXJpZGlhbiA9IHBvaW50WzBdLCBwYXJhbGxlbCA9IHBvaW50WzFdLCBtZXJpZGlhbk5vcm1hbCA9IFsgTWF0aC5zaW4obWVyaWRpYW4pLCAtTWF0aC5jb3MobWVyaWRpYW4pLCAwIF0sIHBvbGFyQW5nbGUgPSAwLCB3aW5kaW5nID0gMDtcbiAgICBkM19nZW9fYXJlYVJpbmdTdW0ucmVzZXQoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IHBvbHlnb24ubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICB2YXIgcmluZyA9IHBvbHlnb25baV0sIG0gPSByaW5nLmxlbmd0aDtcbiAgICAgIGlmICghbSkgY29udGludWU7XG4gICAgICB2YXIgcG9pbnQwID0gcmluZ1swXSwgzrswID0gcG9pbnQwWzBdLCDPhjAgPSBwb2ludDBbMV0gLyAyICsgz4AgLyA0LCBzaW7PhjAgPSBNYXRoLnNpbijPhjApLCBjb3PPhjAgPSBNYXRoLmNvcyjPhjApLCBqID0gMTtcbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGlmIChqID09PSBtKSBqID0gMDtcbiAgICAgICAgcG9pbnQgPSByaW5nW2pdO1xuICAgICAgICB2YXIgzrsgPSBwb2ludFswXSwgz4YgPSBwb2ludFsxXSAvIDIgKyDPgCAvIDQsIHNpbs+GID0gTWF0aC5zaW4oz4YpLCBjb3PPhiA9IE1hdGguY29zKM+GKSwgZM67ID0gzrsgLSDOuzAsIHNkzrsgPSBkzrsgPj0gMCA/IDEgOiAtMSwgYWTOuyA9IHNkzrsgKiBkzrssIGFudGltZXJpZGlhbiA9IGFkzrsgPiDPgCwgayA9IHNpbs+GMCAqIHNpbs+GO1xuICAgICAgICBkM19nZW9fYXJlYVJpbmdTdW0uYWRkKE1hdGguYXRhbjIoayAqIHNkzrsgKiBNYXRoLnNpbihhZM67KSwgY29zz4YwICogY29zz4YgKyBrICogTWF0aC5jb3MoYWTOuykpKTtcbiAgICAgICAgcG9sYXJBbmdsZSArPSBhbnRpbWVyaWRpYW4gPyBkzrsgKyBzZM67ICogz4QgOiBkzrs7XG4gICAgICAgIGlmIChhbnRpbWVyaWRpYW4gXiDOuzAgPj0gbWVyaWRpYW4gXiDOuyA+PSBtZXJpZGlhbikge1xuICAgICAgICAgIHZhciBhcmMgPSBkM19nZW9fY2FydGVzaWFuQ3Jvc3MoZDNfZ2VvX2NhcnRlc2lhbihwb2ludDApLCBkM19nZW9fY2FydGVzaWFuKHBvaW50KSk7XG4gICAgICAgICAgZDNfZ2VvX2NhcnRlc2lhbk5vcm1hbGl6ZShhcmMpO1xuICAgICAgICAgIHZhciBpbnRlcnNlY3Rpb24gPSBkM19nZW9fY2FydGVzaWFuQ3Jvc3MobWVyaWRpYW5Ob3JtYWwsIGFyYyk7XG4gICAgICAgICAgZDNfZ2VvX2NhcnRlc2lhbk5vcm1hbGl6ZShpbnRlcnNlY3Rpb24pO1xuICAgICAgICAgIHZhciDPhmFyYyA9IChhbnRpbWVyaWRpYW4gXiBkzrsgPj0gMCA/IC0xIDogMSkgKiBkM19hc2luKGludGVyc2VjdGlvblsyXSk7XG4gICAgICAgICAgaWYgKHBhcmFsbGVsID4gz4ZhcmMgfHwgcGFyYWxsZWwgPT09IM+GYXJjICYmIChhcmNbMF0gfHwgYXJjWzFdKSkge1xuICAgICAgICAgICAgd2luZGluZyArPSBhbnRpbWVyaWRpYW4gXiBkzrsgPj0gMCA/IDEgOiAtMTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFqKyspIGJyZWFrO1xuICAgICAgICDOuzAgPSDOuywgc2luz4YwID0gc2luz4YsIGNvc8+GMCA9IGNvc8+GLCBwb2ludDAgPSBwb2ludDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIChwb2xhckFuZ2xlIDwgLc61IHx8IHBvbGFyQW5nbGUgPCDOtSAmJiBkM19nZW9fYXJlYVJpbmdTdW0gPCAwKSBeIHdpbmRpbmcgJiAxO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19jbGlwQ2lyY2xlKHJhZGl1cykge1xuICAgIHZhciBjciA9IE1hdGguY29zKHJhZGl1cyksIHNtYWxsUmFkaXVzID0gY3IgPiAwLCBub3RIZW1pc3BoZXJlID0gYWJzKGNyKSA+IM61LCBpbnRlcnBvbGF0ZSA9IGQzX2dlb19jaXJjbGVJbnRlcnBvbGF0ZShyYWRpdXMsIDYgKiBkM19yYWRpYW5zKTtcbiAgICByZXR1cm4gZDNfZ2VvX2NsaXAodmlzaWJsZSwgY2xpcExpbmUsIGludGVycG9sYXRlLCBzbWFsbFJhZGl1cyA/IFsgMCwgLXJhZGl1cyBdIDogWyAtz4AsIHJhZGl1cyAtIM+AIF0pO1xuICAgIGZ1bmN0aW9uIHZpc2libGUozrssIM+GKSB7XG4gICAgICByZXR1cm4gTWF0aC5jb3MozrspICogTWF0aC5jb3Moz4YpID4gY3I7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNsaXBMaW5lKGxpc3RlbmVyKSB7XG4gICAgICB2YXIgcG9pbnQwLCBjMCwgdjAsIHYwMCwgY2xlYW47XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsaW5lU3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHYwMCA9IHYwID0gZmFsc2U7XG4gICAgICAgICAgY2xlYW4gPSAxO1xuICAgICAgICB9LFxuICAgICAgICBwb2ludDogZnVuY3Rpb24ozrssIM+GKSB7XG4gICAgICAgICAgdmFyIHBvaW50MSA9IFsgzrssIM+GIF0sIHBvaW50MiwgdiA9IHZpc2libGUozrssIM+GKSwgYyA9IHNtYWxsUmFkaXVzID8gdiA/IDAgOiBjb2RlKM67LCDPhikgOiB2ID8gY29kZSjOuyArICjOuyA8IDAgPyDPgCA6IC3PgCksIM+GKSA6IDA7XG4gICAgICAgICAgaWYgKCFwb2ludDAgJiYgKHYwMCA9IHYwID0gdikpIGxpc3RlbmVyLmxpbmVTdGFydCgpO1xuICAgICAgICAgIGlmICh2ICE9PSB2MCkge1xuICAgICAgICAgICAgcG9pbnQyID0gaW50ZXJzZWN0KHBvaW50MCwgcG9pbnQxKTtcbiAgICAgICAgICAgIGlmIChkM19nZW9fc3BoZXJpY2FsRXF1YWwocG9pbnQwLCBwb2ludDIpIHx8IGQzX2dlb19zcGhlcmljYWxFcXVhbChwb2ludDEsIHBvaW50MikpIHtcbiAgICAgICAgICAgICAgcG9pbnQxWzBdICs9IM61O1xuICAgICAgICAgICAgICBwb2ludDFbMV0gKz0gzrU7XG4gICAgICAgICAgICAgIHYgPSB2aXNpYmxlKHBvaW50MVswXSwgcG9pbnQxWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHYgIT09IHYwKSB7XG4gICAgICAgICAgICBjbGVhbiA9IDA7XG4gICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saW5lU3RhcnQoKTtcbiAgICAgICAgICAgICAgcG9pbnQyID0gaW50ZXJzZWN0KHBvaW50MSwgcG9pbnQwKTtcbiAgICAgICAgICAgICAgbGlzdGVuZXIucG9pbnQocG9pbnQyWzBdLCBwb2ludDJbMV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcG9pbnQyID0gaW50ZXJzZWN0KHBvaW50MCwgcG9pbnQxKTtcbiAgICAgICAgICAgICAgbGlzdGVuZXIucG9pbnQocG9pbnQyWzBdLCBwb2ludDJbMV0pO1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saW5lRW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb2ludDAgPSBwb2ludDI7XG4gICAgICAgICAgfSBlbHNlIGlmIChub3RIZW1pc3BoZXJlICYmIHBvaW50MCAmJiBzbWFsbFJhZGl1cyBeIHYpIHtcbiAgICAgICAgICAgIHZhciB0O1xuICAgICAgICAgICAgaWYgKCEoYyAmIGMwKSAmJiAodCA9IGludGVyc2VjdChwb2ludDEsIHBvaW50MCwgdHJ1ZSkpKSB7XG4gICAgICAgICAgICAgIGNsZWFuID0gMDtcbiAgICAgICAgICAgICAgaWYgKHNtYWxsUmFkaXVzKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIubGluZVN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIucG9pbnQodFswXVswXSwgdFswXVsxXSk7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIucG9pbnQodFsxXVswXSwgdFsxXVsxXSk7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIubGluZUVuZCgpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLnBvaW50KHRbMV1bMF0sIHRbMV1bMV0pO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLmxpbmVFbmQoKTtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5saW5lU3RhcnQoKTtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5wb2ludCh0WzBdWzBdLCB0WzBdWzFdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodiAmJiAoIXBvaW50MCB8fCAhZDNfZ2VvX3NwaGVyaWNhbEVxdWFsKHBvaW50MCwgcG9pbnQxKSkpIHtcbiAgICAgICAgICAgIGxpc3RlbmVyLnBvaW50KHBvaW50MVswXSwgcG9pbnQxWzFdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcG9pbnQwID0gcG9pbnQxLCB2MCA9IHYsIGMwID0gYztcbiAgICAgICAgfSxcbiAgICAgICAgbGluZUVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKHYwKSBsaXN0ZW5lci5saW5lRW5kKCk7XG4gICAgICAgICAgcG9pbnQwID0gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgY2xlYW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBjbGVhbiB8ICh2MDAgJiYgdjApIDw8IDE7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludGVyc2VjdChhLCBiLCB0d28pIHtcbiAgICAgIHZhciBwYSA9IGQzX2dlb19jYXJ0ZXNpYW4oYSksIHBiID0gZDNfZ2VvX2NhcnRlc2lhbihiKTtcbiAgICAgIHZhciBuMSA9IFsgMSwgMCwgMCBdLCBuMiA9IGQzX2dlb19jYXJ0ZXNpYW5Dcm9zcyhwYSwgcGIpLCBuMm4yID0gZDNfZ2VvX2NhcnRlc2lhbkRvdChuMiwgbjIpLCBuMW4yID0gbjJbMF0sIGRldGVybWluYW50ID0gbjJuMiAtIG4xbjIgKiBuMW4yO1xuICAgICAgaWYgKCFkZXRlcm1pbmFudCkgcmV0dXJuICF0d28gJiYgYTtcbiAgICAgIHZhciBjMSA9IGNyICogbjJuMiAvIGRldGVybWluYW50LCBjMiA9IC1jciAqIG4xbjIgLyBkZXRlcm1pbmFudCwgbjF4bjIgPSBkM19nZW9fY2FydGVzaWFuQ3Jvc3MobjEsIG4yKSwgQSA9IGQzX2dlb19jYXJ0ZXNpYW5TY2FsZShuMSwgYzEpLCBCID0gZDNfZ2VvX2NhcnRlc2lhblNjYWxlKG4yLCBjMik7XG4gICAgICBkM19nZW9fY2FydGVzaWFuQWRkKEEsIEIpO1xuICAgICAgdmFyIHUgPSBuMXhuMiwgdyA9IGQzX2dlb19jYXJ0ZXNpYW5Eb3QoQSwgdSksIHV1ID0gZDNfZ2VvX2NhcnRlc2lhbkRvdCh1LCB1KSwgdDIgPSB3ICogdyAtIHV1ICogKGQzX2dlb19jYXJ0ZXNpYW5Eb3QoQSwgQSkgLSAxKTtcbiAgICAgIGlmICh0MiA8IDApIHJldHVybjtcbiAgICAgIHZhciB0ID0gTWF0aC5zcXJ0KHQyKSwgcSA9IGQzX2dlb19jYXJ0ZXNpYW5TY2FsZSh1LCAoLXcgLSB0KSAvIHV1KTtcbiAgICAgIGQzX2dlb19jYXJ0ZXNpYW5BZGQocSwgQSk7XG4gICAgICBxID0gZDNfZ2VvX3NwaGVyaWNhbChxKTtcbiAgICAgIGlmICghdHdvKSByZXR1cm4gcTtcbiAgICAgIHZhciDOuzAgPSBhWzBdLCDOuzEgPSBiWzBdLCDPhjAgPSBhWzFdLCDPhjEgPSBiWzFdLCB6O1xuICAgICAgaWYgKM67MSA8IM67MCkgeiA9IM67MCwgzrswID0gzrsxLCDOuzEgPSB6O1xuICAgICAgdmFyIM60zrsgPSDOuzEgLSDOuzAsIHBvbGFyID0gYWJzKM60zrsgLSDPgCkgPCDOtSwgbWVyaWRpYW4gPSBwb2xhciB8fCDOtM67IDwgzrU7XG4gICAgICBpZiAoIXBvbGFyICYmIM+GMSA8IM+GMCkgeiA9IM+GMCwgz4YwID0gz4YxLCDPhjEgPSB6O1xuICAgICAgaWYgKG1lcmlkaWFuID8gcG9sYXIgPyDPhjAgKyDPhjEgPiAwIF4gcVsxXSA8IChhYnMocVswXSAtIM67MCkgPCDOtSA/IM+GMCA6IM+GMSkgOiDPhjAgPD0gcVsxXSAmJiBxWzFdIDw9IM+GMSA6IM60zrsgPiDPgCBeICjOuzAgPD0gcVswXSAmJiBxWzBdIDw9IM67MSkpIHtcbiAgICAgICAgdmFyIHExID0gZDNfZ2VvX2NhcnRlc2lhblNjYWxlKHUsICgtdyArIHQpIC8gdXUpO1xuICAgICAgICBkM19nZW9fY2FydGVzaWFuQWRkKHExLCBBKTtcbiAgICAgICAgcmV0dXJuIFsgcSwgZDNfZ2VvX3NwaGVyaWNhbChxMSkgXTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gY29kZSjOuywgz4YpIHtcbiAgICAgIHZhciByID0gc21hbGxSYWRpdXMgPyByYWRpdXMgOiDPgCAtIHJhZGl1cywgY29kZSA9IDA7XG4gICAgICBpZiAozrsgPCAtcikgY29kZSB8PSAxOyBlbHNlIGlmICjOuyA+IHIpIGNvZGUgfD0gMjtcbiAgICAgIGlmICjPhiA8IC1yKSBjb2RlIHw9IDQ7IGVsc2UgaWYgKM+GID4gcikgY29kZSB8PSA4O1xuICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb21fY2xpcExpbmUoeDAsIHkwLCB4MSwgeTEpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24obGluZSkge1xuICAgICAgdmFyIGEgPSBsaW5lLmEsIGIgPSBsaW5lLmIsIGF4ID0gYS54LCBheSA9IGEueSwgYnggPSBiLngsIGJ5ID0gYi55LCB0MCA9IDAsIHQxID0gMSwgZHggPSBieCAtIGF4LCBkeSA9IGJ5IC0gYXksIHI7XG4gICAgICByID0geDAgLSBheDtcbiAgICAgIGlmICghZHggJiYgciA+IDApIHJldHVybjtcbiAgICAgIHIgLz0gZHg7XG4gICAgICBpZiAoZHggPCAwKSB7XG4gICAgICAgIGlmIChyIDwgdDApIHJldHVybjtcbiAgICAgICAgaWYgKHIgPCB0MSkgdDEgPSByO1xuICAgICAgfSBlbHNlIGlmIChkeCA+IDApIHtcbiAgICAgICAgaWYgKHIgPiB0MSkgcmV0dXJuO1xuICAgICAgICBpZiAociA+IHQwKSB0MCA9IHI7XG4gICAgICB9XG4gICAgICByID0geDEgLSBheDtcbiAgICAgIGlmICghZHggJiYgciA8IDApIHJldHVybjtcbiAgICAgIHIgLz0gZHg7XG4gICAgICBpZiAoZHggPCAwKSB7XG4gICAgICAgIGlmIChyID4gdDEpIHJldHVybjtcbiAgICAgICAgaWYgKHIgPiB0MCkgdDAgPSByO1xuICAgICAgfSBlbHNlIGlmIChkeCA+IDApIHtcbiAgICAgICAgaWYgKHIgPCB0MCkgcmV0dXJuO1xuICAgICAgICBpZiAociA8IHQxKSB0MSA9IHI7XG4gICAgICB9XG4gICAgICByID0geTAgLSBheTtcbiAgICAgIGlmICghZHkgJiYgciA+IDApIHJldHVybjtcbiAgICAgIHIgLz0gZHk7XG4gICAgICBpZiAoZHkgPCAwKSB7XG4gICAgICAgIGlmIChyIDwgdDApIHJldHVybjtcbiAgICAgICAgaWYgKHIgPCB0MSkgdDEgPSByO1xuICAgICAgfSBlbHNlIGlmIChkeSA+IDApIHtcbiAgICAgICAgaWYgKHIgPiB0MSkgcmV0dXJuO1xuICAgICAgICBpZiAociA+IHQwKSB0MCA9IHI7XG4gICAgICB9XG4gICAgICByID0geTEgLSBheTtcbiAgICAgIGlmICghZHkgJiYgciA8IDApIHJldHVybjtcbiAgICAgIHIgLz0gZHk7XG4gICAgICBpZiAoZHkgPCAwKSB7XG4gICAgICAgIGlmIChyID4gdDEpIHJldHVybjtcbiAgICAgICAgaWYgKHIgPiB0MCkgdDAgPSByO1xuICAgICAgfSBlbHNlIGlmIChkeSA+IDApIHtcbiAgICAgICAgaWYgKHIgPCB0MCkgcmV0dXJuO1xuICAgICAgICBpZiAociA8IHQxKSB0MSA9IHI7XG4gICAgICB9XG4gICAgICBpZiAodDAgPiAwKSBsaW5lLmEgPSB7XG4gICAgICAgIHg6IGF4ICsgdDAgKiBkeCxcbiAgICAgICAgeTogYXkgKyB0MCAqIGR5XG4gICAgICB9O1xuICAgICAgaWYgKHQxIDwgMSkgbGluZS5iID0ge1xuICAgICAgICB4OiBheCArIHQxICogZHgsXG4gICAgICAgIHk6IGF5ICsgdDEgKiBkeVxuICAgICAgfTtcbiAgICAgIHJldHVybiBsaW5lO1xuICAgIH07XG4gIH1cbiAgdmFyIGQzX2dlb19jbGlwRXh0ZW50TUFYID0gMWU5O1xuICBkMy5nZW8uY2xpcEV4dGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB4MCwgeTAsIHgxLCB5MSwgc3RyZWFtLCBjbGlwLCBjbGlwRXh0ZW50ID0ge1xuICAgICAgc3RyZWFtOiBmdW5jdGlvbihvdXRwdXQpIHtcbiAgICAgICAgaWYgKHN0cmVhbSkgc3RyZWFtLnZhbGlkID0gZmFsc2U7XG4gICAgICAgIHN0cmVhbSA9IGNsaXAob3V0cHV0KTtcbiAgICAgICAgc3RyZWFtLnZhbGlkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHN0cmVhbTtcbiAgICAgIH0sXG4gICAgICBleHRlbnQ6IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gWyBbIHgwLCB5MCBdLCBbIHgxLCB5MSBdIF07XG4gICAgICAgIGNsaXAgPSBkM19nZW9fY2xpcEV4dGVudCh4MCA9ICtfWzBdWzBdLCB5MCA9ICtfWzBdWzFdLCB4MSA9ICtfWzFdWzBdLCB5MSA9ICtfWzFdWzFdKTtcbiAgICAgICAgaWYgKHN0cmVhbSkgc3RyZWFtLnZhbGlkID0gZmFsc2UsIHN0cmVhbSA9IG51bGw7XG4gICAgICAgIHJldHVybiBjbGlwRXh0ZW50O1xuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIGNsaXBFeHRlbnQuZXh0ZW50KFsgWyAwLCAwIF0sIFsgOTYwLCA1MDAgXSBdKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfZ2VvX2NsaXBFeHRlbnQoeDAsIHkwLCB4MSwgeTEpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgIHZhciBsaXN0ZW5lcl8gPSBsaXN0ZW5lciwgYnVmZmVyTGlzdGVuZXIgPSBkM19nZW9fY2xpcEJ1ZmZlckxpc3RlbmVyKCksIGNsaXBMaW5lID0gZDNfZ2VvbV9jbGlwTGluZSh4MCwgeTAsIHgxLCB5MSksIHNlZ21lbnRzLCBwb2x5Z29uLCByaW5nO1xuICAgICAgdmFyIGNsaXAgPSB7XG4gICAgICAgIHBvaW50OiBwb2ludCxcbiAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgIGxpbmVFbmQ6IGxpbmVFbmQsXG4gICAgICAgIHBvbHlnb25TdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbGlzdGVuZXIgPSBidWZmZXJMaXN0ZW5lcjtcbiAgICAgICAgICBzZWdtZW50cyA9IFtdO1xuICAgICAgICAgIHBvbHlnb24gPSBbXTtcbiAgICAgICAgICBjbGVhbiA9IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIHBvbHlnb25FbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGxpc3RlbmVyID0gbGlzdGVuZXJfO1xuICAgICAgICAgIHNlZ21lbnRzID0gZDMubWVyZ2Uoc2VnbWVudHMpO1xuICAgICAgICAgIHZhciBjbGlwU3RhcnRJbnNpZGUgPSBpbnNpZGVQb2x5Z29uKFsgeDAsIHkxIF0pLCBpbnNpZGUgPSBjbGVhbiAmJiBjbGlwU3RhcnRJbnNpZGUsIHZpc2libGUgPSBzZWdtZW50cy5sZW5ndGg7XG4gICAgICAgICAgaWYgKGluc2lkZSB8fCB2aXNpYmxlKSB7XG4gICAgICAgICAgICBsaXN0ZW5lci5wb2x5Z29uU3RhcnQoKTtcbiAgICAgICAgICAgIGlmIChpbnNpZGUpIHtcbiAgICAgICAgICAgICAgbGlzdGVuZXIubGluZVN0YXJ0KCk7XG4gICAgICAgICAgICAgIGludGVycG9sYXRlKG51bGwsIG51bGwsIDEsIGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgbGlzdGVuZXIubGluZUVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZpc2libGUpIHtcbiAgICAgICAgICAgICAgZDNfZ2VvX2NsaXBQb2x5Z29uKHNlZ21lbnRzLCBjb21wYXJlLCBjbGlwU3RhcnRJbnNpZGUsIGludGVycG9sYXRlLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsaXN0ZW5lci5wb2x5Z29uRW5kKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlZ21lbnRzID0gcG9seWdvbiA9IHJpbmcgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgZnVuY3Rpb24gaW5zaWRlUG9seWdvbihwKSB7XG4gICAgICAgIHZhciB3biA9IDAsIG4gPSBwb2x5Z29uLmxlbmd0aCwgeSA9IHBbMV07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDEsIHYgPSBwb2x5Z29uW2ldLCBtID0gdi5sZW5ndGgsIGEgPSB2WzBdLCBiOyBqIDwgbTsgKytqKSB7XG4gICAgICAgICAgICBiID0gdltqXTtcbiAgICAgICAgICAgIGlmIChhWzFdIDw9IHkpIHtcbiAgICAgICAgICAgICAgaWYgKGJbMV0gPiB5ICYmIGQzX2Nyb3NzMmQoYSwgYiwgcCkgPiAwKSArK3duO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKGJbMV0gPD0geSAmJiBkM19jcm9zczJkKGEsIGIsIHApIDwgMCkgLS13bjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEgPSBiO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd24gIT09IDA7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBpbnRlcnBvbGF0ZShmcm9tLCB0bywgZGlyZWN0aW9uLCBsaXN0ZW5lcikge1xuICAgICAgICB2YXIgYSA9IDAsIGExID0gMDtcbiAgICAgICAgaWYgKGZyb20gPT0gbnVsbCB8fCAoYSA9IGNvcm5lcihmcm9tLCBkaXJlY3Rpb24pKSAhPT0gKGExID0gY29ybmVyKHRvLCBkaXJlY3Rpb24pKSB8fCBjb21wYXJlUG9pbnRzKGZyb20sIHRvKSA8IDAgXiBkaXJlY3Rpb24gPiAwKSB7XG4gICAgICAgICAgZG8ge1xuICAgICAgICAgICAgbGlzdGVuZXIucG9pbnQoYSA9PT0gMCB8fCBhID09PSAzID8geDAgOiB4MSwgYSA+IDEgPyB5MSA6IHkwKTtcbiAgICAgICAgICB9IHdoaWxlICgoYSA9IChhICsgZGlyZWN0aW9uICsgNCkgJSA0KSAhPT0gYTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpc3RlbmVyLnBvaW50KHRvWzBdLCB0b1sxXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIHBvaW50VmlzaWJsZSh4LCB5KSB7XG4gICAgICAgIHJldHVybiB4MCA8PSB4ICYmIHggPD0geDEgJiYgeTAgPD0geSAmJiB5IDw9IHkxO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gcG9pbnQoeCwgeSkge1xuICAgICAgICBpZiAocG9pbnRWaXNpYmxlKHgsIHkpKSBsaXN0ZW5lci5wb2ludCh4LCB5KTtcbiAgICAgIH1cbiAgICAgIHZhciB4X18sIHlfXywgdl9fLCB4XywgeV8sIHZfLCBmaXJzdCwgY2xlYW47XG4gICAgICBmdW5jdGlvbiBsaW5lU3RhcnQoKSB7XG4gICAgICAgIGNsaXAucG9pbnQgPSBsaW5lUG9pbnQ7XG4gICAgICAgIGlmIChwb2x5Z29uKSBwb2x5Z29uLnB1c2gocmluZyA9IFtdKTtcbiAgICAgICAgZmlyc3QgPSB0cnVlO1xuICAgICAgICB2XyA9IGZhbHNlO1xuICAgICAgICB4XyA9IHlfID0gTmFOO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gbGluZUVuZCgpIHtcbiAgICAgICAgaWYgKHNlZ21lbnRzKSB7XG4gICAgICAgICAgbGluZVBvaW50KHhfXywgeV9fKTtcbiAgICAgICAgICBpZiAodl9fICYmIHZfKSBidWZmZXJMaXN0ZW5lci5yZWpvaW4oKTtcbiAgICAgICAgICBzZWdtZW50cy5wdXNoKGJ1ZmZlckxpc3RlbmVyLmJ1ZmZlcigpKTtcbiAgICAgICAgfVxuICAgICAgICBjbGlwLnBvaW50ID0gcG9pbnQ7XG4gICAgICAgIGlmICh2XykgbGlzdGVuZXIubGluZUVuZCgpO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gbGluZVBvaW50KHgsIHkpIHtcbiAgICAgICAgeCA9IE1hdGgubWF4KC1kM19nZW9fY2xpcEV4dGVudE1BWCwgTWF0aC5taW4oZDNfZ2VvX2NsaXBFeHRlbnRNQVgsIHgpKTtcbiAgICAgICAgeSA9IE1hdGgubWF4KC1kM19nZW9fY2xpcEV4dGVudE1BWCwgTWF0aC5taW4oZDNfZ2VvX2NsaXBFeHRlbnRNQVgsIHkpKTtcbiAgICAgICAgdmFyIHYgPSBwb2ludFZpc2libGUoeCwgeSk7XG4gICAgICAgIGlmIChwb2x5Z29uKSByaW5nLnB1c2goWyB4LCB5IF0pO1xuICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICB4X18gPSB4LCB5X18gPSB5LCB2X18gPSB2O1xuICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgIGxpc3RlbmVyLmxpbmVTdGFydCgpO1xuICAgICAgICAgICAgbGlzdGVuZXIucG9pbnQoeCwgeSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh2ICYmIHZfKSBsaXN0ZW5lci5wb2ludCh4LCB5KTsgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbCA9IHtcbiAgICAgICAgICAgICAgYToge1xuICAgICAgICAgICAgICAgIHg6IHhfLFxuICAgICAgICAgICAgICAgIHk6IHlfXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGI6IHtcbiAgICAgICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgICAgIHk6IHlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChjbGlwTGluZShsKSkge1xuICAgICAgICAgICAgICBpZiAoIXZfKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIubGluZVN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIucG9pbnQobC5hLngsIGwuYS55KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBsaXN0ZW5lci5wb2ludChsLmIueCwgbC5iLnkpO1xuICAgICAgICAgICAgICBpZiAoIXYpIGxpc3RlbmVyLmxpbmVFbmQoKTtcbiAgICAgICAgICAgICAgY2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodikge1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saW5lU3RhcnQoKTtcbiAgICAgICAgICAgICAgbGlzdGVuZXIucG9pbnQoeCwgeSk7XG4gICAgICAgICAgICAgIGNsZWFuID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHhfID0geCwgeV8gPSB5LCB2XyA9IHY7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2xpcDtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGNvcm5lcihwLCBkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiBhYnMocFswXSAtIHgwKSA8IM61ID8gZGlyZWN0aW9uID4gMCA/IDAgOiAzIDogYWJzKHBbMF0gLSB4MSkgPCDOtSA/IGRpcmVjdGlvbiA+IDAgPyAyIDogMSA6IGFicyhwWzFdIC0geTApIDwgzrUgPyBkaXJlY3Rpb24gPiAwID8gMSA6IDAgOiBkaXJlY3Rpb24gPiAwID8gMyA6IDI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNvbXBhcmUoYSwgYikge1xuICAgICAgcmV0dXJuIGNvbXBhcmVQb2ludHMoYS54LCBiLngpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjb21wYXJlUG9pbnRzKGEsIGIpIHtcbiAgICAgIHZhciBjYSA9IGNvcm5lcihhLCAxKSwgY2IgPSBjb3JuZXIoYiwgMSk7XG4gICAgICByZXR1cm4gY2EgIT09IGNiID8gY2EgLSBjYiA6IGNhID09PSAwID8gYlsxXSAtIGFbMV0gOiBjYSA9PT0gMSA/IGFbMF0gLSBiWzBdIDogY2EgPT09IDIgPyBhWzFdIC0gYlsxXSA6IGJbMF0gLSBhWzBdO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fY29uaWMocHJvamVjdEF0KSB7XG4gICAgdmFyIM+GMCA9IDAsIM+GMSA9IM+AIC8gMywgbSA9IGQzX2dlb19wcm9qZWN0aW9uTXV0YXRvcihwcm9qZWN0QXQpLCBwID0gbSjPhjAsIM+GMSk7XG4gICAgcC5wYXJhbGxlbHMgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBbIM+GMCAvIM+AICogMTgwLCDPhjEgLyDPgCAqIDE4MCBdO1xuICAgICAgcmV0dXJuIG0oz4YwID0gX1swXSAqIM+AIC8gMTgwLCDPhjEgPSBfWzFdICogz4AgLyAxODApO1xuICAgIH07XG4gICAgcmV0dXJuIHA7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX2NvbmljRXF1YWxBcmVhKM+GMCwgz4YxKSB7XG4gICAgdmFyIHNpbs+GMCA9IE1hdGguc2luKM+GMCksIG4gPSAoc2luz4YwICsgTWF0aC5zaW4oz4YxKSkgLyAyLCBDID0gMSArIHNpbs+GMCAqICgyICogbiAtIHNpbs+GMCksIM+BMCA9IE1hdGguc3FydChDKSAvIG47XG4gICAgZnVuY3Rpb24gZm9yd2FyZCjOuywgz4YpIHtcbiAgICAgIHZhciDPgSA9IE1hdGguc3FydChDIC0gMiAqIG4gKiBNYXRoLnNpbijPhikpIC8gbjtcbiAgICAgIHJldHVybiBbIM+BICogTWF0aC5zaW4ozrsgKj0gbiksIM+BMCAtIM+BICogTWF0aC5jb3MozrspIF07XG4gICAgfVxuICAgIGZvcndhcmQuaW52ZXJ0ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgICAgdmFyIM+BMF95ID0gz4EwIC0geTtcbiAgICAgIHJldHVybiBbIE1hdGguYXRhbjIoeCwgz4EwX3kpIC8gbiwgZDNfYXNpbigoQyAtICh4ICogeCArIM+BMF95ICogz4EwX3kpICogbiAqIG4pIC8gKDIgKiBuKSkgXTtcbiAgICB9O1xuICAgIHJldHVybiBmb3J3YXJkO1xuICB9XG4gIChkMy5nZW8uY29uaWNFcXVhbEFyZWEgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfZ2VvX2NvbmljKGQzX2dlb19jb25pY0VxdWFsQXJlYSk7XG4gIH0pLnJhdyA9IGQzX2dlb19jb25pY0VxdWFsQXJlYTtcbiAgZDMuZ2VvLmFsYmVycyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkMy5nZW8uY29uaWNFcXVhbEFyZWEoKS5yb3RhdGUoWyA5NiwgMCBdKS5jZW50ZXIoWyAtLjYsIDM4LjcgXSkucGFyYWxsZWxzKFsgMjkuNSwgNDUuNSBdKS5zY2FsZSgxMDcwKTtcbiAgfTtcbiAgZDMuZ2VvLmFsYmVyc1VzYSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsb3dlcjQ4ID0gZDMuZ2VvLmFsYmVycygpO1xuICAgIHZhciBhbGFza2EgPSBkMy5nZW8uY29uaWNFcXVhbEFyZWEoKS5yb3RhdGUoWyAxNTQsIDAgXSkuY2VudGVyKFsgLTIsIDU4LjUgXSkucGFyYWxsZWxzKFsgNTUsIDY1IF0pO1xuICAgIHZhciBoYXdhaWkgPSBkMy5nZW8uY29uaWNFcXVhbEFyZWEoKS5yb3RhdGUoWyAxNTcsIDAgXSkuY2VudGVyKFsgLTMsIDE5LjkgXSkucGFyYWxsZWxzKFsgOCwgMTggXSk7XG4gICAgdmFyIHBvaW50LCBwb2ludFN0cmVhbSA9IHtcbiAgICAgIHBvaW50OiBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHBvaW50ID0gWyB4LCB5IF07XG4gICAgICB9XG4gICAgfSwgbG93ZXI0OFBvaW50LCBhbGFza2FQb2ludCwgaGF3YWlpUG9pbnQ7XG4gICAgZnVuY3Rpb24gYWxiZXJzVXNhKGNvb3JkaW5hdGVzKSB7XG4gICAgICB2YXIgeCA9IGNvb3JkaW5hdGVzWzBdLCB5ID0gY29vcmRpbmF0ZXNbMV07XG4gICAgICBwb2ludCA9IG51bGw7XG4gICAgICAobG93ZXI0OFBvaW50KHgsIHkpLCBwb2ludCkgfHwgKGFsYXNrYVBvaW50KHgsIHkpLCBwb2ludCkgfHwgaGF3YWlpUG9pbnQoeCwgeSk7XG4gICAgICByZXR1cm4gcG9pbnQ7XG4gICAgfVxuICAgIGFsYmVyc1VzYS5pbnZlcnQgPSBmdW5jdGlvbihjb29yZGluYXRlcykge1xuICAgICAgdmFyIGsgPSBsb3dlcjQ4LnNjYWxlKCksIHQgPSBsb3dlcjQ4LnRyYW5zbGF0ZSgpLCB4ID0gKGNvb3JkaW5hdGVzWzBdIC0gdFswXSkgLyBrLCB5ID0gKGNvb3JkaW5hdGVzWzFdIC0gdFsxXSkgLyBrO1xuICAgICAgcmV0dXJuICh5ID49IC4xMiAmJiB5IDwgLjIzNCAmJiB4ID49IC0uNDI1ICYmIHggPCAtLjIxNCA/IGFsYXNrYSA6IHkgPj0gLjE2NiAmJiB5IDwgLjIzNCAmJiB4ID49IC0uMjE0ICYmIHggPCAtLjExNSA/IGhhd2FpaSA6IGxvd2VyNDgpLmludmVydChjb29yZGluYXRlcyk7XG4gICAgfTtcbiAgICBhbGJlcnNVc2Euc3RyZWFtID0gZnVuY3Rpb24oc3RyZWFtKSB7XG4gICAgICB2YXIgbG93ZXI0OFN0cmVhbSA9IGxvd2VyNDguc3RyZWFtKHN0cmVhbSksIGFsYXNrYVN0cmVhbSA9IGFsYXNrYS5zdHJlYW0oc3RyZWFtKSwgaGF3YWlpU3RyZWFtID0gaGF3YWlpLnN0cmVhbShzdHJlYW0pO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcG9pbnQ6IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgICBsb3dlcjQ4U3RyZWFtLnBvaW50KHgsIHkpO1xuICAgICAgICAgIGFsYXNrYVN0cmVhbS5wb2ludCh4LCB5KTtcbiAgICAgICAgICBoYXdhaWlTdHJlYW0ucG9pbnQoeCwgeSk7XG4gICAgICAgIH0sXG4gICAgICAgIHNwaGVyZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbG93ZXI0OFN0cmVhbS5zcGhlcmUoKTtcbiAgICAgICAgICBhbGFza2FTdHJlYW0uc3BoZXJlKCk7XG4gICAgICAgICAgaGF3YWlpU3RyZWFtLnNwaGVyZSgpO1xuICAgICAgICB9LFxuICAgICAgICBsaW5lU3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGxvd2VyNDhTdHJlYW0ubGluZVN0YXJ0KCk7XG4gICAgICAgICAgYWxhc2thU3RyZWFtLmxpbmVTdGFydCgpO1xuICAgICAgICAgIGhhd2FpaVN0cmVhbS5saW5lU3RhcnQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgbGluZUVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbG93ZXI0OFN0cmVhbS5saW5lRW5kKCk7XG4gICAgICAgICAgYWxhc2thU3RyZWFtLmxpbmVFbmQoKTtcbiAgICAgICAgICBoYXdhaWlTdHJlYW0ubGluZUVuZCgpO1xuICAgICAgICB9LFxuICAgICAgICBwb2x5Z29uU3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGxvd2VyNDhTdHJlYW0ucG9seWdvblN0YXJ0KCk7XG4gICAgICAgICAgYWxhc2thU3RyZWFtLnBvbHlnb25TdGFydCgpO1xuICAgICAgICAgIGhhd2FpaVN0cmVhbS5wb2x5Z29uU3RhcnQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgcG9seWdvbkVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbG93ZXI0OFN0cmVhbS5wb2x5Z29uRW5kKCk7XG4gICAgICAgICAgYWxhc2thU3RyZWFtLnBvbHlnb25FbmQoKTtcbiAgICAgICAgICBoYXdhaWlTdHJlYW0ucG9seWdvbkVuZCgpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH07XG4gICAgYWxiZXJzVXNhLnByZWNpc2lvbiA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGxvd2VyNDgucHJlY2lzaW9uKCk7XG4gICAgICBsb3dlcjQ4LnByZWNpc2lvbihfKTtcbiAgICAgIGFsYXNrYS5wcmVjaXNpb24oXyk7XG4gICAgICBoYXdhaWkucHJlY2lzaW9uKF8pO1xuICAgICAgcmV0dXJuIGFsYmVyc1VzYTtcbiAgICB9O1xuICAgIGFsYmVyc1VzYS5zY2FsZSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGxvd2VyNDguc2NhbGUoKTtcbiAgICAgIGxvd2VyNDguc2NhbGUoXyk7XG4gICAgICBhbGFza2Euc2NhbGUoXyAqIC4zNSk7XG4gICAgICBoYXdhaWkuc2NhbGUoXyk7XG4gICAgICByZXR1cm4gYWxiZXJzVXNhLnRyYW5zbGF0ZShsb3dlcjQ4LnRyYW5zbGF0ZSgpKTtcbiAgICB9O1xuICAgIGFsYmVyc1VzYS50cmFuc2xhdGUgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBsb3dlcjQ4LnRyYW5zbGF0ZSgpO1xuICAgICAgdmFyIGsgPSBsb3dlcjQ4LnNjYWxlKCksIHggPSArX1swXSwgeSA9ICtfWzFdO1xuICAgICAgbG93ZXI0OFBvaW50ID0gbG93ZXI0OC50cmFuc2xhdGUoXykuY2xpcEV4dGVudChbIFsgeCAtIC40NTUgKiBrLCB5IC0gLjIzOCAqIGsgXSwgWyB4ICsgLjQ1NSAqIGssIHkgKyAuMjM4ICogayBdIF0pLnN0cmVhbShwb2ludFN0cmVhbSkucG9pbnQ7XG4gICAgICBhbGFza2FQb2ludCA9IGFsYXNrYS50cmFuc2xhdGUoWyB4IC0gLjMwNyAqIGssIHkgKyAuMjAxICogayBdKS5jbGlwRXh0ZW50KFsgWyB4IC0gLjQyNSAqIGsgKyDOtSwgeSArIC4xMiAqIGsgKyDOtSBdLCBbIHggLSAuMjE0ICogayAtIM61LCB5ICsgLjIzNCAqIGsgLSDOtSBdIF0pLnN0cmVhbShwb2ludFN0cmVhbSkucG9pbnQ7XG4gICAgICBoYXdhaWlQb2ludCA9IGhhd2FpaS50cmFuc2xhdGUoWyB4IC0gLjIwNSAqIGssIHkgKyAuMjEyICogayBdKS5jbGlwRXh0ZW50KFsgWyB4IC0gLjIxNCAqIGsgKyDOtSwgeSArIC4xNjYgKiBrICsgzrUgXSwgWyB4IC0gLjExNSAqIGsgLSDOtSwgeSArIC4yMzQgKiBrIC0gzrUgXSBdKS5zdHJlYW0ocG9pbnRTdHJlYW0pLnBvaW50O1xuICAgICAgcmV0dXJuIGFsYmVyc1VzYTtcbiAgICB9O1xuICAgIHJldHVybiBhbGJlcnNVc2Euc2NhbGUoMTA3MCk7XG4gIH07XG4gIHZhciBkM19nZW9fcGF0aEFyZWFTdW0sIGQzX2dlb19wYXRoQXJlYVBvbHlnb24sIGQzX2dlb19wYXRoQXJlYSA9IHtcbiAgICBwb2ludDogZDNfbm9vcCxcbiAgICBsaW5lU3RhcnQ6IGQzX25vb3AsXG4gICAgbGluZUVuZDogZDNfbm9vcCxcbiAgICBwb2x5Z29uU3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgZDNfZ2VvX3BhdGhBcmVhUG9seWdvbiA9IDA7XG4gICAgICBkM19nZW9fcGF0aEFyZWEubGluZVN0YXJ0ID0gZDNfZ2VvX3BhdGhBcmVhUmluZ1N0YXJ0O1xuICAgIH0sXG4gICAgcG9seWdvbkVuZDogZnVuY3Rpb24oKSB7XG4gICAgICBkM19nZW9fcGF0aEFyZWEubGluZVN0YXJ0ID0gZDNfZ2VvX3BhdGhBcmVhLmxpbmVFbmQgPSBkM19nZW9fcGF0aEFyZWEucG9pbnQgPSBkM19ub29wO1xuICAgICAgZDNfZ2VvX3BhdGhBcmVhU3VtICs9IGFicyhkM19nZW9fcGF0aEFyZWFQb2x5Z29uIC8gMik7XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBkM19nZW9fcGF0aEFyZWFSaW5nU3RhcnQoKSB7XG4gICAgdmFyIHgwMCwgeTAwLCB4MCwgeTA7XG4gICAgZDNfZ2VvX3BhdGhBcmVhLnBvaW50ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgICAgZDNfZ2VvX3BhdGhBcmVhLnBvaW50ID0gbmV4dFBvaW50O1xuICAgICAgeDAwID0geDAgPSB4LCB5MDAgPSB5MCA9IHk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBuZXh0UG9pbnQoeCwgeSkge1xuICAgICAgZDNfZ2VvX3BhdGhBcmVhUG9seWdvbiArPSB5MCAqIHggLSB4MCAqIHk7XG4gICAgICB4MCA9IHgsIHkwID0geTtcbiAgICB9XG4gICAgZDNfZ2VvX3BhdGhBcmVhLmxpbmVFbmQgPSBmdW5jdGlvbigpIHtcbiAgICAgIG5leHRQb2ludCh4MDAsIHkwMCk7XG4gICAgfTtcbiAgfVxuICB2YXIgZDNfZ2VvX3BhdGhCb3VuZHNYMCwgZDNfZ2VvX3BhdGhCb3VuZHNZMCwgZDNfZ2VvX3BhdGhCb3VuZHNYMSwgZDNfZ2VvX3BhdGhCb3VuZHNZMTtcbiAgdmFyIGQzX2dlb19wYXRoQm91bmRzID0ge1xuICAgIHBvaW50OiBkM19nZW9fcGF0aEJvdW5kc1BvaW50LFxuICAgIGxpbmVTdGFydDogZDNfbm9vcCxcbiAgICBsaW5lRW5kOiBkM19ub29wLFxuICAgIHBvbHlnb25TdGFydDogZDNfbm9vcCxcbiAgICBwb2x5Z29uRW5kOiBkM19ub29wXG4gIH07XG4gIGZ1bmN0aW9uIGQzX2dlb19wYXRoQm91bmRzUG9pbnQoeCwgeSkge1xuICAgIGlmICh4IDwgZDNfZ2VvX3BhdGhCb3VuZHNYMCkgZDNfZ2VvX3BhdGhCb3VuZHNYMCA9IHg7XG4gICAgaWYgKHggPiBkM19nZW9fcGF0aEJvdW5kc1gxKSBkM19nZW9fcGF0aEJvdW5kc1gxID0geDtcbiAgICBpZiAoeSA8IGQzX2dlb19wYXRoQm91bmRzWTApIGQzX2dlb19wYXRoQm91bmRzWTAgPSB5O1xuICAgIGlmICh5ID4gZDNfZ2VvX3BhdGhCb3VuZHNZMSkgZDNfZ2VvX3BhdGhCb3VuZHNZMSA9IHk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX3BhdGhCdWZmZXIoKSB7XG4gICAgdmFyIHBvaW50Q2lyY2xlID0gZDNfZ2VvX3BhdGhCdWZmZXJDaXJjbGUoNC41KSwgYnVmZmVyID0gW107XG4gICAgdmFyIHN0cmVhbSA9IHtcbiAgICAgIHBvaW50OiBwb2ludCxcbiAgICAgIGxpbmVTdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHN0cmVhbS5wb2ludCA9IHBvaW50TGluZVN0YXJ0O1xuICAgICAgfSxcbiAgICAgIGxpbmVFbmQ6IGxpbmVFbmQsXG4gICAgICBwb2x5Z29uU3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBzdHJlYW0ubGluZUVuZCA9IGxpbmVFbmRQb2x5Z29uO1xuICAgICAgfSxcbiAgICAgIHBvbHlnb25FbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBzdHJlYW0ubGluZUVuZCA9IGxpbmVFbmQ7XG4gICAgICAgIHN0cmVhbS5wb2ludCA9IHBvaW50O1xuICAgICAgfSxcbiAgICAgIHBvaW50UmFkaXVzOiBmdW5jdGlvbihfKSB7XG4gICAgICAgIHBvaW50Q2lyY2xlID0gZDNfZ2VvX3BhdGhCdWZmZXJDaXJjbGUoXyk7XG4gICAgICAgIHJldHVybiBzdHJlYW07XG4gICAgICB9LFxuICAgICAgcmVzdWx0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gYnVmZmVyLmpvaW4oXCJcIik7XG4gICAgICAgICAgYnVmZmVyID0gW107XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gcG9pbnQoeCwgeSkge1xuICAgICAgYnVmZmVyLnB1c2goXCJNXCIsIHgsIFwiLFwiLCB5LCBwb2ludENpcmNsZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBvaW50TGluZVN0YXJ0KHgsIHkpIHtcbiAgICAgIGJ1ZmZlci5wdXNoKFwiTVwiLCB4LCBcIixcIiwgeSk7XG4gICAgICBzdHJlYW0ucG9pbnQgPSBwb2ludExpbmU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBvaW50TGluZSh4LCB5KSB7XG4gICAgICBidWZmZXIucHVzaChcIkxcIiwgeCwgXCIsXCIsIHkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBsaW5lRW5kKCkge1xuICAgICAgc3RyZWFtLnBvaW50ID0gcG9pbnQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGxpbmVFbmRQb2x5Z29uKCkge1xuICAgICAgYnVmZmVyLnB1c2goXCJaXCIpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyZWFtO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19wYXRoQnVmZmVyQ2lyY2xlKHJhZGl1cykge1xuICAgIHJldHVybiBcIm0wLFwiICsgcmFkaXVzICsgXCJhXCIgKyByYWRpdXMgKyBcIixcIiArIHJhZGl1cyArIFwiIDAgMSwxIDAsXCIgKyAtMiAqIHJhZGl1cyArIFwiYVwiICsgcmFkaXVzICsgXCIsXCIgKyByYWRpdXMgKyBcIiAwIDEsMSAwLFwiICsgMiAqIHJhZGl1cyArIFwielwiO1xuICB9XG4gIHZhciBkM19nZW9fcGF0aENlbnRyb2lkID0ge1xuICAgIHBvaW50OiBkM19nZW9fcGF0aENlbnRyb2lkUG9pbnQsXG4gICAgbGluZVN0YXJ0OiBkM19nZW9fcGF0aENlbnRyb2lkTGluZVN0YXJ0LFxuICAgIGxpbmVFbmQ6IGQzX2dlb19wYXRoQ2VudHJvaWRMaW5lRW5kLFxuICAgIHBvbHlnb25TdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICBkM19nZW9fcGF0aENlbnRyb2lkLmxpbmVTdGFydCA9IGQzX2dlb19wYXRoQ2VudHJvaWRSaW5nU3RhcnQ7XG4gICAgfSxcbiAgICBwb2x5Z29uRW5kOiBmdW5jdGlvbigpIHtcbiAgICAgIGQzX2dlb19wYXRoQ2VudHJvaWQucG9pbnQgPSBkM19nZW9fcGF0aENlbnRyb2lkUG9pbnQ7XG4gICAgICBkM19nZW9fcGF0aENlbnRyb2lkLmxpbmVTdGFydCA9IGQzX2dlb19wYXRoQ2VudHJvaWRMaW5lU3RhcnQ7XG4gICAgICBkM19nZW9fcGF0aENlbnRyb2lkLmxpbmVFbmQgPSBkM19nZW9fcGF0aENlbnRyb2lkTGluZUVuZDtcbiAgICB9XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2dlb19wYXRoQ2VudHJvaWRQb2ludCh4LCB5KSB7XG4gICAgZDNfZ2VvX2NlbnRyb2lkWDAgKz0geDtcbiAgICBkM19nZW9fY2VudHJvaWRZMCArPSB5O1xuICAgICsrZDNfZ2VvX2NlbnRyb2lkWjA7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX3BhdGhDZW50cm9pZExpbmVTdGFydCgpIHtcbiAgICB2YXIgeDAsIHkwO1xuICAgIGQzX2dlb19wYXRoQ2VudHJvaWQucG9pbnQgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgICBkM19nZW9fcGF0aENlbnRyb2lkLnBvaW50ID0gbmV4dFBvaW50O1xuICAgICAgZDNfZ2VvX3BhdGhDZW50cm9pZFBvaW50KHgwID0geCwgeTAgPSB5KTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIG5leHRQb2ludCh4LCB5KSB7XG4gICAgICB2YXIgZHggPSB4IC0geDAsIGR5ID0geSAtIHkwLCB6ID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICAgIGQzX2dlb19jZW50cm9pZFgxICs9IHogKiAoeDAgKyB4KSAvIDI7XG4gICAgICBkM19nZW9fY2VudHJvaWRZMSArPSB6ICogKHkwICsgeSkgLyAyO1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkWjEgKz0gejtcbiAgICAgIGQzX2dlb19wYXRoQ2VudHJvaWRQb2ludCh4MCA9IHgsIHkwID0geSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19wYXRoQ2VudHJvaWRMaW5lRW5kKCkge1xuICAgIGQzX2dlb19wYXRoQ2VudHJvaWQucG9pbnQgPSBkM19nZW9fcGF0aENlbnRyb2lkUG9pbnQ7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX3BhdGhDZW50cm9pZFJpbmdTdGFydCgpIHtcbiAgICB2YXIgeDAwLCB5MDAsIHgwLCB5MDtcbiAgICBkM19nZW9fcGF0aENlbnRyb2lkLnBvaW50ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgICAgZDNfZ2VvX3BhdGhDZW50cm9pZC5wb2ludCA9IG5leHRQb2ludDtcbiAgICAgIGQzX2dlb19wYXRoQ2VudHJvaWRQb2ludCh4MDAgPSB4MCA9IHgsIHkwMCA9IHkwID0geSk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBuZXh0UG9pbnQoeCwgeSkge1xuICAgICAgdmFyIGR4ID0geCAtIHgwLCBkeSA9IHkgLSB5MCwgeiA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gICAgICBkM19nZW9fY2VudHJvaWRYMSArPSB6ICogKHgwICsgeCkgLyAyO1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkWTEgKz0geiAqICh5MCArIHkpIC8gMjtcbiAgICAgIGQzX2dlb19jZW50cm9pZFoxICs9IHo7XG4gICAgICB6ID0geTAgKiB4IC0geDAgKiB5O1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkWDIgKz0geiAqICh4MCArIHgpO1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkWTIgKz0geiAqICh5MCArIHkpO1xuICAgICAgZDNfZ2VvX2NlbnRyb2lkWjIgKz0geiAqIDM7XG4gICAgICBkM19nZW9fcGF0aENlbnRyb2lkUG9pbnQoeDAgPSB4LCB5MCA9IHkpO1xuICAgIH1cbiAgICBkM19nZW9fcGF0aENlbnRyb2lkLmxpbmVFbmQgPSBmdW5jdGlvbigpIHtcbiAgICAgIG5leHRQb2ludCh4MDAsIHkwMCk7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fcGF0aENvbnRleHQoY29udGV4dCkge1xuICAgIHZhciBwb2ludFJhZGl1cyA9IDQuNTtcbiAgICB2YXIgc3RyZWFtID0ge1xuICAgICAgcG9pbnQ6IHBvaW50LFxuICAgICAgbGluZVN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgc3RyZWFtLnBvaW50ID0gcG9pbnRMaW5lU3RhcnQ7XG4gICAgICB9LFxuICAgICAgbGluZUVuZDogbGluZUVuZCxcbiAgICAgIHBvbHlnb25TdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHN0cmVhbS5saW5lRW5kID0gbGluZUVuZFBvbHlnb247XG4gICAgICB9LFxuICAgICAgcG9seWdvbkVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHN0cmVhbS5saW5lRW5kID0gbGluZUVuZDtcbiAgICAgICAgc3RyZWFtLnBvaW50ID0gcG9pbnQ7XG4gICAgICB9LFxuICAgICAgcG9pbnRSYWRpdXM6IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgcG9pbnRSYWRpdXMgPSBfO1xuICAgICAgICByZXR1cm4gc3RyZWFtO1xuICAgICAgfSxcbiAgICAgIHJlc3VsdDogZDNfbm9vcFxuICAgIH07XG4gICAgZnVuY3Rpb24gcG9pbnQoeCwgeSkge1xuICAgICAgY29udGV4dC5tb3ZlVG8oeCArIHBvaW50UmFkaXVzLCB5KTtcbiAgICAgIGNvbnRleHQuYXJjKHgsIHksIHBvaW50UmFkaXVzLCAwLCDPhCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBvaW50TGluZVN0YXJ0KHgsIHkpIHtcbiAgICAgIGNvbnRleHQubW92ZVRvKHgsIHkpO1xuICAgICAgc3RyZWFtLnBvaW50ID0gcG9pbnRMaW5lO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwb2ludExpbmUoeCwgeSkge1xuICAgICAgY29udGV4dC5saW5lVG8oeCwgeSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGxpbmVFbmQoKSB7XG4gICAgICBzdHJlYW0ucG9pbnQgPSBwb2ludDtcbiAgICB9XG4gICAgZnVuY3Rpb24gbGluZUVuZFBvbHlnb24oKSB7XG4gICAgICBjb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyZWFtO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19yZXNhbXBsZShwcm9qZWN0KSB7XG4gICAgdmFyIM60MiA9IC41LCBjb3NNaW5EaXN0YW5jZSA9IE1hdGguY29zKDMwICogZDNfcmFkaWFucyksIG1heERlcHRoID0gMTY7XG4gICAgZnVuY3Rpb24gcmVzYW1wbGUoc3RyZWFtKSB7XG4gICAgICByZXR1cm4gKG1heERlcHRoID8gcmVzYW1wbGVSZWN1cnNpdmUgOiByZXNhbXBsZU5vbmUpKHN0cmVhbSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlc2FtcGxlTm9uZShzdHJlYW0pIHtcbiAgICAgIHJldHVybiBkM19nZW9fdHJhbnNmb3JtUG9pbnQoc3RyZWFtLCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHggPSBwcm9qZWN0KHgsIHkpO1xuICAgICAgICBzdHJlYW0ucG9pbnQoeFswXSwgeFsxXSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVzYW1wbGVSZWN1cnNpdmUoc3RyZWFtKSB7XG4gICAgICB2YXIgzrswMCwgz4YwMCwgeDAwLCB5MDAsIGEwMCwgYjAwLCBjMDAsIM67MCwgeDAsIHkwLCBhMCwgYjAsIGMwO1xuICAgICAgdmFyIHJlc2FtcGxlID0ge1xuICAgICAgICBwb2ludDogcG9pbnQsXG4gICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICBsaW5lRW5kOiBsaW5lRW5kLFxuICAgICAgICBwb2x5Z29uU3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHN0cmVhbS5wb2x5Z29uU3RhcnQoKTtcbiAgICAgICAgICByZXNhbXBsZS5saW5lU3RhcnQgPSByaW5nU3RhcnQ7XG4gICAgICAgIH0sXG4gICAgICAgIHBvbHlnb25FbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHN0cmVhbS5wb2x5Z29uRW5kKCk7XG4gICAgICAgICAgcmVzYW1wbGUubGluZVN0YXJ0ID0gbGluZVN0YXJ0O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgZnVuY3Rpb24gcG9pbnQoeCwgeSkge1xuICAgICAgICB4ID0gcHJvamVjdCh4LCB5KTtcbiAgICAgICAgc3RyZWFtLnBvaW50KHhbMF0sIHhbMV0pO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gbGluZVN0YXJ0KCkge1xuICAgICAgICB4MCA9IE5hTjtcbiAgICAgICAgcmVzYW1wbGUucG9pbnQgPSBsaW5lUG9pbnQ7XG4gICAgICAgIHN0cmVhbS5saW5lU3RhcnQoKTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIGxpbmVQb2ludCjOuywgz4YpIHtcbiAgICAgICAgdmFyIGMgPSBkM19nZW9fY2FydGVzaWFuKFsgzrssIM+GIF0pLCBwID0gcHJvamVjdCjOuywgz4YpO1xuICAgICAgICByZXNhbXBsZUxpbmVUbyh4MCwgeTAsIM67MCwgYTAsIGIwLCBjMCwgeDAgPSBwWzBdLCB5MCA9IHBbMV0sIM67MCA9IM67LCBhMCA9IGNbMF0sIGIwID0gY1sxXSwgYzAgPSBjWzJdLCBtYXhEZXB0aCwgc3RyZWFtKTtcbiAgICAgICAgc3RyZWFtLnBvaW50KHgwLCB5MCk7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBsaW5lRW5kKCkge1xuICAgICAgICByZXNhbXBsZS5wb2ludCA9IHBvaW50O1xuICAgICAgICBzdHJlYW0ubGluZUVuZCgpO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gcmluZ1N0YXJ0KCkge1xuICAgICAgICBsaW5lU3RhcnQoKTtcbiAgICAgICAgcmVzYW1wbGUucG9pbnQgPSByaW5nUG9pbnQ7XG4gICAgICAgIHJlc2FtcGxlLmxpbmVFbmQgPSByaW5nRW5kO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gcmluZ1BvaW50KM67LCDPhikge1xuICAgICAgICBsaW5lUG9pbnQozrswMCA9IM67LCDPhjAwID0gz4YpLCB4MDAgPSB4MCwgeTAwID0geTAsIGEwMCA9IGEwLCBiMDAgPSBiMCwgYzAwID0gYzA7XG4gICAgICAgIHJlc2FtcGxlLnBvaW50ID0gbGluZVBvaW50O1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gcmluZ0VuZCgpIHtcbiAgICAgICAgcmVzYW1wbGVMaW5lVG8oeDAsIHkwLCDOuzAsIGEwLCBiMCwgYzAsIHgwMCwgeTAwLCDOuzAwLCBhMDAsIGIwMCwgYzAwLCBtYXhEZXB0aCwgc3RyZWFtKTtcbiAgICAgICAgcmVzYW1wbGUubGluZUVuZCA9IGxpbmVFbmQ7XG4gICAgICAgIGxpbmVFbmQoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNhbXBsZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVzYW1wbGVMaW5lVG8oeDAsIHkwLCDOuzAsIGEwLCBiMCwgYzAsIHgxLCB5MSwgzrsxLCBhMSwgYjEsIGMxLCBkZXB0aCwgc3RyZWFtKSB7XG4gICAgICB2YXIgZHggPSB4MSAtIHgwLCBkeSA9IHkxIC0geTAsIGQyID0gZHggKiBkeCArIGR5ICogZHk7XG4gICAgICBpZiAoZDIgPiA0ICogzrQyICYmIGRlcHRoLS0pIHtcbiAgICAgICAgdmFyIGEgPSBhMCArIGExLCBiID0gYjAgKyBiMSwgYyA9IGMwICsgYzEsIG0gPSBNYXRoLnNxcnQoYSAqIGEgKyBiICogYiArIGMgKiBjKSwgz4YyID0gTWF0aC5hc2luKGMgLz0gbSksIM67MiA9IGFicyhhYnMoYykgLSAxKSA8IM61IHx8IGFicyjOuzAgLSDOuzEpIDwgzrUgPyAozrswICsgzrsxKSAvIDIgOiBNYXRoLmF0YW4yKGIsIGEpLCBwID0gcHJvamVjdCjOuzIsIM+GMiksIHgyID0gcFswXSwgeTIgPSBwWzFdLCBkeDIgPSB4MiAtIHgwLCBkeTIgPSB5MiAtIHkwLCBkeiA9IGR5ICogZHgyIC0gZHggKiBkeTI7XG4gICAgICAgIGlmIChkeiAqIGR6IC8gZDIgPiDOtDIgfHwgYWJzKChkeCAqIGR4MiArIGR5ICogZHkyKSAvIGQyIC0gLjUpID4gLjMgfHwgYTAgKiBhMSArIGIwICogYjEgKyBjMCAqIGMxIDwgY29zTWluRGlzdGFuY2UpIHtcbiAgICAgICAgICByZXNhbXBsZUxpbmVUbyh4MCwgeTAsIM67MCwgYTAsIGIwLCBjMCwgeDIsIHkyLCDOuzIsIGEgLz0gbSwgYiAvPSBtLCBjLCBkZXB0aCwgc3RyZWFtKTtcbiAgICAgICAgICBzdHJlYW0ucG9pbnQoeDIsIHkyKTtcbiAgICAgICAgICByZXNhbXBsZUxpbmVUbyh4MiwgeTIsIM67MiwgYSwgYiwgYywgeDEsIHkxLCDOuzEsIGExLCBiMSwgYzEsIGRlcHRoLCBzdHJlYW0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJlc2FtcGxlLnByZWNpc2lvbiA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIE1hdGguc3FydCjOtDIpO1xuICAgICAgbWF4RGVwdGggPSAozrQyID0gXyAqIF8pID4gMCAmJiAxNjtcbiAgICAgIHJldHVybiByZXNhbXBsZTtcbiAgICB9O1xuICAgIHJldHVybiByZXNhbXBsZTtcbiAgfVxuICBkMy5nZW8ucGF0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwb2ludFJhZGl1cyA9IDQuNSwgcHJvamVjdGlvbiwgY29udGV4dCwgcHJvamVjdFN0cmVhbSwgY29udGV4dFN0cmVhbSwgY2FjaGVTdHJlYW07XG4gICAgZnVuY3Rpb24gcGF0aChvYmplY3QpIHtcbiAgICAgIGlmIChvYmplY3QpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwb2ludFJhZGl1cyA9PT0gXCJmdW5jdGlvblwiKSBjb250ZXh0U3RyZWFtLnBvaW50UmFkaXVzKCtwb2ludFJhZGl1cy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICAgICAgaWYgKCFjYWNoZVN0cmVhbSB8fCAhY2FjaGVTdHJlYW0udmFsaWQpIGNhY2hlU3RyZWFtID0gcHJvamVjdFN0cmVhbShjb250ZXh0U3RyZWFtKTtcbiAgICAgICAgZDMuZ2VvLnN0cmVhbShvYmplY3QsIGNhY2hlU3RyZWFtKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb250ZXh0U3RyZWFtLnJlc3VsdCgpO1xuICAgIH1cbiAgICBwYXRoLmFyZWEgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgIGQzX2dlb19wYXRoQXJlYVN1bSA9IDA7XG4gICAgICBkMy5nZW8uc3RyZWFtKG9iamVjdCwgcHJvamVjdFN0cmVhbShkM19nZW9fcGF0aEFyZWEpKTtcbiAgICAgIHJldHVybiBkM19nZW9fcGF0aEFyZWFTdW07XG4gICAgfTtcbiAgICBwYXRoLmNlbnRyb2lkID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICBkM19nZW9fY2VudHJvaWRYMCA9IGQzX2dlb19jZW50cm9pZFkwID0gZDNfZ2VvX2NlbnRyb2lkWjAgPSBkM19nZW9fY2VudHJvaWRYMSA9IGQzX2dlb19jZW50cm9pZFkxID0gZDNfZ2VvX2NlbnRyb2lkWjEgPSBkM19nZW9fY2VudHJvaWRYMiA9IGQzX2dlb19jZW50cm9pZFkyID0gZDNfZ2VvX2NlbnRyb2lkWjIgPSAwO1xuICAgICAgZDMuZ2VvLnN0cmVhbShvYmplY3QsIHByb2plY3RTdHJlYW0oZDNfZ2VvX3BhdGhDZW50cm9pZCkpO1xuICAgICAgcmV0dXJuIGQzX2dlb19jZW50cm9pZFoyID8gWyBkM19nZW9fY2VudHJvaWRYMiAvIGQzX2dlb19jZW50cm9pZFoyLCBkM19nZW9fY2VudHJvaWRZMiAvIGQzX2dlb19jZW50cm9pZFoyIF0gOiBkM19nZW9fY2VudHJvaWRaMSA/IFsgZDNfZ2VvX2NlbnRyb2lkWDEgLyBkM19nZW9fY2VudHJvaWRaMSwgZDNfZ2VvX2NlbnRyb2lkWTEgLyBkM19nZW9fY2VudHJvaWRaMSBdIDogZDNfZ2VvX2NlbnRyb2lkWjAgPyBbIGQzX2dlb19jZW50cm9pZFgwIC8gZDNfZ2VvX2NlbnRyb2lkWjAsIGQzX2dlb19jZW50cm9pZFkwIC8gZDNfZ2VvX2NlbnRyb2lkWjAgXSA6IFsgTmFOLCBOYU4gXTtcbiAgICB9O1xuICAgIHBhdGguYm91bmRzID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICBkM19nZW9fcGF0aEJvdW5kc1gxID0gZDNfZ2VvX3BhdGhCb3VuZHNZMSA9IC0oZDNfZ2VvX3BhdGhCb3VuZHNYMCA9IGQzX2dlb19wYXRoQm91bmRzWTAgPSBJbmZpbml0eSk7XG4gICAgICBkMy5nZW8uc3RyZWFtKG9iamVjdCwgcHJvamVjdFN0cmVhbShkM19nZW9fcGF0aEJvdW5kcykpO1xuICAgICAgcmV0dXJuIFsgWyBkM19nZW9fcGF0aEJvdW5kc1gwLCBkM19nZW9fcGF0aEJvdW5kc1kwIF0sIFsgZDNfZ2VvX3BhdGhCb3VuZHNYMSwgZDNfZ2VvX3BhdGhCb3VuZHNZMSBdIF07XG4gICAgfTtcbiAgICBwYXRoLnByb2plY3Rpb24gPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwcm9qZWN0aW9uO1xuICAgICAgcHJvamVjdFN0cmVhbSA9IChwcm9qZWN0aW9uID0gXykgPyBfLnN0cmVhbSB8fCBkM19nZW9fcGF0aFByb2plY3RTdHJlYW0oXykgOiBkM19pZGVudGl0eTtcbiAgICAgIHJldHVybiByZXNldCgpO1xuICAgIH07XG4gICAgcGF0aC5jb250ZXh0ID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gY29udGV4dDtcbiAgICAgIGNvbnRleHRTdHJlYW0gPSAoY29udGV4dCA9IF8pID09IG51bGwgPyBuZXcgZDNfZ2VvX3BhdGhCdWZmZXIoKSA6IG5ldyBkM19nZW9fcGF0aENvbnRleHQoXyk7XG4gICAgICBpZiAodHlwZW9mIHBvaW50UmFkaXVzICE9PSBcImZ1bmN0aW9uXCIpIGNvbnRleHRTdHJlYW0ucG9pbnRSYWRpdXMocG9pbnRSYWRpdXMpO1xuICAgICAgcmV0dXJuIHJlc2V0KCk7XG4gICAgfTtcbiAgICBwYXRoLnBvaW50UmFkaXVzID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcG9pbnRSYWRpdXM7XG4gICAgICBwb2ludFJhZGl1cyA9IHR5cGVvZiBfID09PSBcImZ1bmN0aW9uXCIgPyBfIDogKGNvbnRleHRTdHJlYW0ucG9pbnRSYWRpdXMoK18pLCArXyk7XG4gICAgICByZXR1cm4gcGF0aDtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgY2FjaGVTdHJlYW0gPSBudWxsO1xuICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuICAgIHJldHVybiBwYXRoLnByb2plY3Rpb24oZDMuZ2VvLmFsYmVyc1VzYSgpKS5jb250ZXh0KG51bGwpO1xuICB9O1xuICBmdW5jdGlvbiBkM19nZW9fcGF0aFByb2plY3RTdHJlYW0ocHJvamVjdCkge1xuICAgIHZhciByZXNhbXBsZSA9IGQzX2dlb19yZXNhbXBsZShmdW5jdGlvbih4LCB5KSB7XG4gICAgICByZXR1cm4gcHJvamVjdChbIHggKiBkM19kZWdyZWVzLCB5ICogZDNfZGVncmVlcyBdKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oc3RyZWFtKSB7XG4gICAgICByZXR1cm4gZDNfZ2VvX3Byb2plY3Rpb25SYWRpYW5zKHJlc2FtcGxlKHN0cmVhbSkpO1xuICAgIH07XG4gIH1cbiAgZDMuZ2VvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKG1ldGhvZHMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3RyZWFtOiBmdW5jdGlvbihzdHJlYW0pIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybSA9IG5ldyBkM19nZW9fdHJhbnNmb3JtKHN0cmVhbSk7XG4gICAgICAgIGZvciAodmFyIGsgaW4gbWV0aG9kcykgdHJhbnNmb3JtW2tdID0gbWV0aG9kc1trXTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuICBmdW5jdGlvbiBkM19nZW9fdHJhbnNmb3JtKHN0cmVhbSkge1xuICAgIHRoaXMuc3RyZWFtID0gc3RyZWFtO1xuICB9XG4gIGQzX2dlb190cmFuc2Zvcm0ucHJvdG90eXBlID0ge1xuICAgIHBvaW50OiBmdW5jdGlvbih4LCB5KSB7XG4gICAgICB0aGlzLnN0cmVhbS5wb2ludCh4LCB5KTtcbiAgICB9LFxuICAgIHNwaGVyZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0cmVhbS5zcGhlcmUoKTtcbiAgICB9LFxuICAgIGxpbmVTdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0cmVhbS5saW5lU3RhcnQoKTtcbiAgICB9LFxuICAgIGxpbmVFbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zdHJlYW0ubGluZUVuZCgpO1xuICAgIH0sXG4gICAgcG9seWdvblN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc3RyZWFtLnBvbHlnb25TdGFydCgpO1xuICAgIH0sXG4gICAgcG9seWdvbkVuZDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0cmVhbS5wb2x5Z29uRW5kKCk7XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBkM19nZW9fdHJhbnNmb3JtUG9pbnQoc3RyZWFtLCBwb2ludCkge1xuICAgIHJldHVybiB7XG4gICAgICBwb2ludDogcG9pbnQsXG4gICAgICBzcGhlcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBzdHJlYW0uc3BoZXJlKCk7XG4gICAgICB9LFxuICAgICAgbGluZVN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgc3RyZWFtLmxpbmVTdGFydCgpO1xuICAgICAgfSxcbiAgICAgIGxpbmVFbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBzdHJlYW0ubGluZUVuZCgpO1xuICAgICAgfSxcbiAgICAgIHBvbHlnb25TdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHN0cmVhbS5wb2x5Z29uU3RhcnQoKTtcbiAgICAgIH0sXG4gICAgICBwb2x5Z29uRW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgc3RyZWFtLnBvbHlnb25FbmQoKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGQzLmdlby5wcm9qZWN0aW9uID0gZDNfZ2VvX3Byb2plY3Rpb247XG4gIGQzLmdlby5wcm9qZWN0aW9uTXV0YXRvciA9IGQzX2dlb19wcm9qZWN0aW9uTXV0YXRvcjtcbiAgZnVuY3Rpb24gZDNfZ2VvX3Byb2plY3Rpb24ocHJvamVjdCkge1xuICAgIHJldHVybiBkM19nZW9fcHJvamVjdGlvbk11dGF0b3IoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcHJvamVjdDtcbiAgICB9KSgpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19wcm9qZWN0aW9uTXV0YXRvcihwcm9qZWN0QXQpIHtcbiAgICB2YXIgcHJvamVjdCwgcm90YXRlLCBwcm9qZWN0Um90YXRlLCBwcm9qZWN0UmVzYW1wbGUgPSBkM19nZW9fcmVzYW1wbGUoZnVuY3Rpb24oeCwgeSkge1xuICAgICAgeCA9IHByb2plY3QoeCwgeSk7XG4gICAgICByZXR1cm4gWyB4WzBdICogayArIM60eCwgzrR5IC0geFsxXSAqIGsgXTtcbiAgICB9KSwgayA9IDE1MCwgeCA9IDQ4MCwgeSA9IDI1MCwgzrsgPSAwLCDPhiA9IDAsIM60zrsgPSAwLCDOtM+GID0gMCwgzrTOsyA9IDAsIM60eCwgzrR5LCBwcmVjbGlwID0gZDNfZ2VvX2NsaXBBbnRpbWVyaWRpYW4sIHBvc3RjbGlwID0gZDNfaWRlbnRpdHksIGNsaXBBbmdsZSA9IG51bGwsIGNsaXBFeHRlbnQgPSBudWxsLCBzdHJlYW07XG4gICAgZnVuY3Rpb24gcHJvamVjdGlvbihwb2ludCkge1xuICAgICAgcG9pbnQgPSBwcm9qZWN0Um90YXRlKHBvaW50WzBdICogZDNfcmFkaWFucywgcG9pbnRbMV0gKiBkM19yYWRpYW5zKTtcbiAgICAgIHJldHVybiBbIHBvaW50WzBdICogayArIM60eCwgzrR5IC0gcG9pbnRbMV0gKiBrIF07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludmVydChwb2ludCkge1xuICAgICAgcG9pbnQgPSBwcm9qZWN0Um90YXRlLmludmVydCgocG9pbnRbMF0gLSDOtHgpIC8gaywgKM60eSAtIHBvaW50WzFdKSAvIGspO1xuICAgICAgcmV0dXJuIHBvaW50ICYmIFsgcG9pbnRbMF0gKiBkM19kZWdyZWVzLCBwb2ludFsxXSAqIGQzX2RlZ3JlZXMgXTtcbiAgICB9XG4gICAgcHJvamVjdGlvbi5zdHJlYW0gPSBmdW5jdGlvbihvdXRwdXQpIHtcbiAgICAgIGlmIChzdHJlYW0pIHN0cmVhbS52YWxpZCA9IGZhbHNlO1xuICAgICAgc3RyZWFtID0gZDNfZ2VvX3Byb2plY3Rpb25SYWRpYW5zKHByZWNsaXAocm90YXRlLCBwcm9qZWN0UmVzYW1wbGUocG9zdGNsaXAob3V0cHV0KSkpKTtcbiAgICAgIHN0cmVhbS52YWxpZCA9IHRydWU7XG4gICAgICByZXR1cm4gc3RyZWFtO1xuICAgIH07XG4gICAgcHJvamVjdGlvbi5jbGlwQW5nbGUgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBjbGlwQW5nbGU7XG4gICAgICBwcmVjbGlwID0gXyA9PSBudWxsID8gKGNsaXBBbmdsZSA9IF8sIGQzX2dlb19jbGlwQW50aW1lcmlkaWFuKSA6IGQzX2dlb19jbGlwQ2lyY2xlKChjbGlwQW5nbGUgPSArXykgKiBkM19yYWRpYW5zKTtcbiAgICAgIHJldHVybiBpbnZhbGlkYXRlKCk7XG4gICAgfTtcbiAgICBwcm9qZWN0aW9uLmNsaXBFeHRlbnQgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBjbGlwRXh0ZW50O1xuICAgICAgY2xpcEV4dGVudCA9IF87XG4gICAgICBwb3N0Y2xpcCA9IF8gPyBkM19nZW9fY2xpcEV4dGVudChfWzBdWzBdLCBfWzBdWzFdLCBfWzFdWzBdLCBfWzFdWzFdKSA6IGQzX2lkZW50aXR5O1xuICAgICAgcmV0dXJuIGludmFsaWRhdGUoKTtcbiAgICB9O1xuICAgIHByb2plY3Rpb24uc2NhbGUgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBrO1xuICAgICAgayA9ICtfO1xuICAgICAgcmV0dXJuIHJlc2V0KCk7XG4gICAgfTtcbiAgICBwcm9qZWN0aW9uLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIFsgeCwgeSBdO1xuICAgICAgeCA9ICtfWzBdO1xuICAgICAgeSA9ICtfWzFdO1xuICAgICAgcmV0dXJuIHJlc2V0KCk7XG4gICAgfTtcbiAgICBwcm9qZWN0aW9uLmNlbnRlciA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIFsgzrsgKiBkM19kZWdyZWVzLCDPhiAqIGQzX2RlZ3JlZXMgXTtcbiAgICAgIM67ID0gX1swXSAlIDM2MCAqIGQzX3JhZGlhbnM7XG4gICAgICDPhiA9IF9bMV0gJSAzNjAgKiBkM19yYWRpYW5zO1xuICAgICAgcmV0dXJuIHJlc2V0KCk7XG4gICAgfTtcbiAgICBwcm9qZWN0aW9uLnJvdGF0ZSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIFsgzrTOuyAqIGQzX2RlZ3JlZXMsIM60z4YgKiBkM19kZWdyZWVzLCDOtM6zICogZDNfZGVncmVlcyBdO1xuICAgICAgzrTOuyA9IF9bMF0gJSAzNjAgKiBkM19yYWRpYW5zO1xuICAgICAgzrTPhiA9IF9bMV0gJSAzNjAgKiBkM19yYWRpYW5zO1xuICAgICAgzrTOsyA9IF8ubGVuZ3RoID4gMiA/IF9bMl0gJSAzNjAgKiBkM19yYWRpYW5zIDogMDtcbiAgICAgIHJldHVybiByZXNldCgpO1xuICAgIH07XG4gICAgZDMucmViaW5kKHByb2plY3Rpb24sIHByb2plY3RSZXNhbXBsZSwgXCJwcmVjaXNpb25cIik7XG4gICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICBwcm9qZWN0Um90YXRlID0gZDNfZ2VvX2NvbXBvc2Uocm90YXRlID0gZDNfZ2VvX3JvdGF0aW9uKM60zrssIM60z4YsIM60zrMpLCBwcm9qZWN0KTtcbiAgICAgIHZhciBjZW50ZXIgPSBwcm9qZWN0KM67LCDPhik7XG4gICAgICDOtHggPSB4IC0gY2VudGVyWzBdICogaztcbiAgICAgIM60eSA9IHkgKyBjZW50ZXJbMV0gKiBrO1xuICAgICAgcmV0dXJuIGludmFsaWRhdGUoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW52YWxpZGF0ZSgpIHtcbiAgICAgIGlmIChzdHJlYW0pIHN0cmVhbS52YWxpZCA9IGZhbHNlLCBzdHJlYW0gPSBudWxsO1xuICAgICAgcmV0dXJuIHByb2plY3Rpb247XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHByb2plY3QgPSBwcm9qZWN0QXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHByb2plY3Rpb24uaW52ZXJ0ID0gcHJvamVjdC5pbnZlcnQgJiYgaW52ZXJ0O1xuICAgICAgcmV0dXJuIHJlc2V0KCk7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fcHJvamVjdGlvblJhZGlhbnMoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGQzX2dlb190cmFuc2Zvcm1Qb2ludChzdHJlYW0sIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgIHN0cmVhbS5wb2ludCh4ICogZDNfcmFkaWFucywgeSAqIGQzX3JhZGlhbnMpO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19lcXVpcmVjdGFuZ3VsYXIozrssIM+GKSB7XG4gICAgcmV0dXJuIFsgzrssIM+GIF07XG4gIH1cbiAgKGQzLmdlby5lcXVpcmVjdGFuZ3VsYXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfZ2VvX3Byb2plY3Rpb24oZDNfZ2VvX2VxdWlyZWN0YW5ndWxhcik7XG4gIH0pLnJhdyA9IGQzX2dlb19lcXVpcmVjdGFuZ3VsYXIuaW52ZXJ0ID0gZDNfZ2VvX2VxdWlyZWN0YW5ndWxhcjtcbiAgZDMuZ2VvLnJvdGF0aW9uID0gZnVuY3Rpb24ocm90YXRlKSB7XG4gICAgcm90YXRlID0gZDNfZ2VvX3JvdGF0aW9uKHJvdGF0ZVswXSAlIDM2MCAqIGQzX3JhZGlhbnMsIHJvdGF0ZVsxXSAqIGQzX3JhZGlhbnMsIHJvdGF0ZS5sZW5ndGggPiAyID8gcm90YXRlWzJdICogZDNfcmFkaWFucyA6IDApO1xuICAgIGZ1bmN0aW9uIGZvcndhcmQoY29vcmRpbmF0ZXMpIHtcbiAgICAgIGNvb3JkaW5hdGVzID0gcm90YXRlKGNvb3JkaW5hdGVzWzBdICogZDNfcmFkaWFucywgY29vcmRpbmF0ZXNbMV0gKiBkM19yYWRpYW5zKTtcbiAgICAgIHJldHVybiBjb29yZGluYXRlc1swXSAqPSBkM19kZWdyZWVzLCBjb29yZGluYXRlc1sxXSAqPSBkM19kZWdyZWVzLCBjb29yZGluYXRlcztcbiAgICB9XG4gICAgZm9yd2FyZC5pbnZlcnQgPSBmdW5jdGlvbihjb29yZGluYXRlcykge1xuICAgICAgY29vcmRpbmF0ZXMgPSByb3RhdGUuaW52ZXJ0KGNvb3JkaW5hdGVzWzBdICogZDNfcmFkaWFucywgY29vcmRpbmF0ZXNbMV0gKiBkM19yYWRpYW5zKTtcbiAgICAgIHJldHVybiBjb29yZGluYXRlc1swXSAqPSBkM19kZWdyZWVzLCBjb29yZGluYXRlc1sxXSAqPSBkM19kZWdyZWVzLCBjb29yZGluYXRlcztcbiAgICB9O1xuICAgIHJldHVybiBmb3J3YXJkO1xuICB9O1xuICBmdW5jdGlvbiBkM19nZW9faWRlbnRpdHlSb3RhdGlvbijOuywgz4YpIHtcbiAgICByZXR1cm4gWyDOuyA+IM+AID8gzrsgLSDPhCA6IM67IDwgLc+AID8gzrsgKyDPhCA6IM67LCDPhiBdO1xuICB9XG4gIGQzX2dlb19pZGVudGl0eVJvdGF0aW9uLmludmVydCA9IGQzX2dlb19lcXVpcmVjdGFuZ3VsYXI7XG4gIGZ1bmN0aW9uIGQzX2dlb19yb3RhdGlvbijOtM67LCDOtM+GLCDOtM6zKSB7XG4gICAgcmV0dXJuIM60zrsgPyDOtM+GIHx8IM60zrMgPyBkM19nZW9fY29tcG9zZShkM19nZW9fcm90YXRpb27OuyjOtM67KSwgZDNfZ2VvX3JvdGF0aW9uz4bOsyjOtM+GLCDOtM6zKSkgOiBkM19nZW9fcm90YXRpb27OuyjOtM67KSA6IM60z4YgfHwgzrTOsyA/IGQzX2dlb19yb3RhdGlvbs+GzrMozrTPhiwgzrTOsykgOiBkM19nZW9faWRlbnRpdHlSb3RhdGlvbjtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fZm9yd2FyZFJvdGF0aW9uzrsozrTOuykge1xuICAgIHJldHVybiBmdW5jdGlvbijOuywgz4YpIHtcbiAgICAgIHJldHVybiDOuyArPSDOtM67LCBbIM67ID4gz4AgPyDOuyAtIM+EIDogzrsgPCAtz4AgPyDOuyArIM+EIDogzrssIM+GIF07XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fcm90YXRpb27OuyjOtM67KSB7XG4gICAgdmFyIHJvdGF0aW9uID0gZDNfZ2VvX2ZvcndhcmRSb3RhdGlvbs67KM60zrspO1xuICAgIHJvdGF0aW9uLmludmVydCA9IGQzX2dlb19mb3J3YXJkUm90YXRpb27OuygtzrTOuyk7XG4gICAgcmV0dXJuIHJvdGF0aW9uO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb19yb3RhdGlvbs+GzrMozrTPhiwgzrTOsykge1xuICAgIHZhciBjb3POtM+GID0gTWF0aC5jb3MozrTPhiksIHNpbs60z4YgPSBNYXRoLnNpbijOtM+GKSwgY29zzrTOsyA9IE1hdGguY29zKM60zrMpLCBzaW7OtM6zID0gTWF0aC5zaW4ozrTOsyk7XG4gICAgZnVuY3Rpb24gcm90YXRpb24ozrssIM+GKSB7XG4gICAgICB2YXIgY29zz4YgPSBNYXRoLmNvcyjPhiksIHggPSBNYXRoLmNvcyjOuykgKiBjb3PPhiwgeSA9IE1hdGguc2luKM67KSAqIGNvc8+GLCB6ID0gTWF0aC5zaW4oz4YpLCBrID0geiAqIGNvc860z4YgKyB4ICogc2luzrTPhjtcbiAgICAgIHJldHVybiBbIE1hdGguYXRhbjIoeSAqIGNvc860zrMgLSBrICogc2luzrTOsywgeCAqIGNvc860z4YgLSB6ICogc2luzrTPhiksIGQzX2FzaW4oayAqIGNvc860zrMgKyB5ICogc2luzrTOsykgXTtcbiAgICB9XG4gICAgcm90YXRpb24uaW52ZXJ0ID0gZnVuY3Rpb24ozrssIM+GKSB7XG4gICAgICB2YXIgY29zz4YgPSBNYXRoLmNvcyjPhiksIHggPSBNYXRoLmNvcyjOuykgKiBjb3PPhiwgeSA9IE1hdGguc2luKM67KSAqIGNvc8+GLCB6ID0gTWF0aC5zaW4oz4YpLCBrID0geiAqIGNvc860zrMgLSB5ICogc2luzrTOsztcbiAgICAgIHJldHVybiBbIE1hdGguYXRhbjIoeSAqIGNvc860zrMgKyB6ICogc2luzrTOsywgeCAqIGNvc860z4YgKyBrICogc2luzrTPhiksIGQzX2FzaW4oayAqIGNvc860z4YgLSB4ICogc2luzrTPhikgXTtcbiAgICB9O1xuICAgIHJldHVybiByb3RhdGlvbjtcbiAgfVxuICBkMy5nZW8uY2lyY2xlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9yaWdpbiA9IFsgMCwgMCBdLCBhbmdsZSwgcHJlY2lzaW9uID0gNiwgaW50ZXJwb2xhdGU7XG4gICAgZnVuY3Rpb24gY2lyY2xlKCkge1xuICAgICAgdmFyIGNlbnRlciA9IHR5cGVvZiBvcmlnaW4gPT09IFwiZnVuY3Rpb25cIiA/IG9yaWdpbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDogb3JpZ2luLCByb3RhdGUgPSBkM19nZW9fcm90YXRpb24oLWNlbnRlclswXSAqIGQzX3JhZGlhbnMsIC1jZW50ZXJbMV0gKiBkM19yYWRpYW5zLCAwKS5pbnZlcnQsIHJpbmcgPSBbXTtcbiAgICAgIGludGVycG9sYXRlKG51bGwsIG51bGwsIDEsIHtcbiAgICAgICAgcG9pbnQ6IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgICByaW5nLnB1c2goeCA9IHJvdGF0ZSh4LCB5KSk7XG4gICAgICAgICAgeFswXSAqPSBkM19kZWdyZWVzLCB4WzFdICo9IGQzX2RlZ3JlZXM7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogXCJQb2x5Z29uXCIsXG4gICAgICAgIGNvb3JkaW5hdGVzOiBbIHJpbmcgXVxuICAgICAgfTtcbiAgICB9XG4gICAgY2lyY2xlLm9yaWdpbiA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG9yaWdpbjtcbiAgICAgIG9yaWdpbiA9IHg7XG4gICAgICByZXR1cm4gY2lyY2xlO1xuICAgIH07XG4gICAgY2lyY2xlLmFuZ2xlID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gYW5nbGU7XG4gICAgICBpbnRlcnBvbGF0ZSA9IGQzX2dlb19jaXJjbGVJbnRlcnBvbGF0ZSgoYW5nbGUgPSAreCkgKiBkM19yYWRpYW5zLCBwcmVjaXNpb24gKiBkM19yYWRpYW5zKTtcbiAgICAgIHJldHVybiBjaXJjbGU7XG4gICAgfTtcbiAgICBjaXJjbGUucHJlY2lzaW9uID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcHJlY2lzaW9uO1xuICAgICAgaW50ZXJwb2xhdGUgPSBkM19nZW9fY2lyY2xlSW50ZXJwb2xhdGUoYW5nbGUgKiBkM19yYWRpYW5zLCAocHJlY2lzaW9uID0gK18pICogZDNfcmFkaWFucyk7XG4gICAgICByZXR1cm4gY2lyY2xlO1xuICAgIH07XG4gICAgcmV0dXJuIGNpcmNsZS5hbmdsZSg5MCk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2dlb19jaXJjbGVJbnRlcnBvbGF0ZShyYWRpdXMsIHByZWNpc2lvbikge1xuICAgIHZhciBjciA9IE1hdGguY29zKHJhZGl1cyksIHNyID0gTWF0aC5zaW4ocmFkaXVzKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oZnJvbSwgdG8sIGRpcmVjdGlvbiwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBzdGVwID0gZGlyZWN0aW9uICogcHJlY2lzaW9uO1xuICAgICAgaWYgKGZyb20gIT0gbnVsbCkge1xuICAgICAgICBmcm9tID0gZDNfZ2VvX2NpcmNsZUFuZ2xlKGNyLCBmcm9tKTtcbiAgICAgICAgdG8gPSBkM19nZW9fY2lyY2xlQW5nbGUoY3IsIHRvKTtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA+IDAgPyBmcm9tIDwgdG8gOiBmcm9tID4gdG8pIGZyb20gKz0gZGlyZWN0aW9uICogz4Q7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmcm9tID0gcmFkaXVzICsgZGlyZWN0aW9uICogz4Q7XG4gICAgICAgIHRvID0gcmFkaXVzIC0gLjUgKiBzdGVwO1xuICAgICAgfVxuICAgICAgZm9yICh2YXIgcG9pbnQsIHQgPSBmcm9tOyBkaXJlY3Rpb24gPiAwID8gdCA+IHRvIDogdCA8IHRvOyB0IC09IHN0ZXApIHtcbiAgICAgICAgbGlzdGVuZXIucG9pbnQoKHBvaW50ID0gZDNfZ2VvX3NwaGVyaWNhbChbIGNyLCAtc3IgKiBNYXRoLmNvcyh0KSwgLXNyICogTWF0aC5zaW4odCkgXSkpWzBdLCBwb2ludFsxXSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9fY2lyY2xlQW5nbGUoY3IsIHBvaW50KSB7XG4gICAgdmFyIGEgPSBkM19nZW9fY2FydGVzaWFuKHBvaW50KTtcbiAgICBhWzBdIC09IGNyO1xuICAgIGQzX2dlb19jYXJ0ZXNpYW5Ob3JtYWxpemUoYSk7XG4gICAgdmFyIGFuZ2xlID0gZDNfYWNvcygtYVsxXSk7XG4gICAgcmV0dXJuICgoLWFbMl0gPCAwID8gLWFuZ2xlIDogYW5nbGUpICsgMiAqIE1hdGguUEkgLSDOtSkgJSAoMiAqIE1hdGguUEkpO1xuICB9XG4gIGQzLmdlby5kaXN0YW5jZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgzpTOuyA9IChiWzBdIC0gYVswXSkgKiBkM19yYWRpYW5zLCDPhjAgPSBhWzFdICogZDNfcmFkaWFucywgz4YxID0gYlsxXSAqIGQzX3JhZGlhbnMsIHNpbs6UzrsgPSBNYXRoLnNpbijOlM67KSwgY29zzpTOuyA9IE1hdGguY29zKM6UzrspLCBzaW7PhjAgPSBNYXRoLnNpbijPhjApLCBjb3PPhjAgPSBNYXRoLmNvcyjPhjApLCBzaW7PhjEgPSBNYXRoLnNpbijPhjEpLCBjb3PPhjEgPSBNYXRoLmNvcyjPhjEpLCB0O1xuICAgIHJldHVybiBNYXRoLmF0YW4yKE1hdGguc3FydCgodCA9IGNvc8+GMSAqIHNpbs6UzrspICogdCArICh0ID0gY29zz4YwICogc2luz4YxIC0gc2luz4YwICogY29zz4YxICogY29zzpTOuykgKiB0KSwgc2luz4YwICogc2luz4YxICsgY29zz4YwICogY29zz4YxICogY29zzpTOuyk7XG4gIH07XG4gIGQzLmdlby5ncmF0aWN1bGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgeDEsIHgwLCBYMSwgWDAsIHkxLCB5MCwgWTEsIFkwLCBkeCA9IDEwLCBkeSA9IGR4LCBEWCA9IDkwLCBEWSA9IDM2MCwgeCwgeSwgWCwgWSwgcHJlY2lzaW9uID0gMi41O1xuICAgIGZ1bmN0aW9uIGdyYXRpY3VsZSgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IFwiTXVsdGlMaW5lU3RyaW5nXCIsXG4gICAgICAgIGNvb3JkaW5hdGVzOiBsaW5lcygpXG4gICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBsaW5lcygpIHtcbiAgICAgIHJldHVybiBkMy5yYW5nZShNYXRoLmNlaWwoWDAgLyBEWCkgKiBEWCwgWDEsIERYKS5tYXAoWCkuY29uY2F0KGQzLnJhbmdlKE1hdGguY2VpbChZMCAvIERZKSAqIERZLCBZMSwgRFkpLm1hcChZKSkuY29uY2F0KGQzLnJhbmdlKE1hdGguY2VpbCh4MCAvIGR4KSAqIGR4LCB4MSwgZHgpLmZpbHRlcihmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiBhYnMoeCAlIERYKSA+IM61O1xuICAgICAgfSkubWFwKHgpKS5jb25jYXQoZDMucmFuZ2UoTWF0aC5jZWlsKHkwIC8gZHkpICogZHksIHkxLCBkeSkuZmlsdGVyKGZ1bmN0aW9uKHkpIHtcbiAgICAgICAgcmV0dXJuIGFicyh5ICUgRFkpID4gzrU7XG4gICAgICB9KS5tYXAoeSkpO1xuICAgIH1cbiAgICBncmF0aWN1bGUubGluZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBsaW5lcygpLm1hcChmdW5jdGlvbihjb29yZGluYXRlcykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IFwiTGluZVN0cmluZ1wiLFxuICAgICAgICAgIGNvb3JkaW5hdGVzOiBjb29yZGluYXRlc1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBncmF0aWN1bGUub3V0bGluZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogXCJQb2x5Z29uXCIsXG4gICAgICAgIGNvb3JkaW5hdGVzOiBbIFgoWDApLmNvbmNhdChZKFkxKS5zbGljZSgxKSwgWChYMSkucmV2ZXJzZSgpLnNsaWNlKDEpLCBZKFkwKS5yZXZlcnNlKCkuc2xpY2UoMSkpIF1cbiAgICAgIH07XG4gICAgfTtcbiAgICBncmF0aWN1bGUuZXh0ZW50ID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZ3JhdGljdWxlLm1pbm9yRXh0ZW50KCk7XG4gICAgICByZXR1cm4gZ3JhdGljdWxlLm1ham9yRXh0ZW50KF8pLm1pbm9yRXh0ZW50KF8pO1xuICAgIH07XG4gICAgZ3JhdGljdWxlLm1ham9yRXh0ZW50ID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gWyBbIFgwLCBZMCBdLCBbIFgxLCBZMSBdIF07XG4gICAgICBYMCA9ICtfWzBdWzBdLCBYMSA9ICtfWzFdWzBdO1xuICAgICAgWTAgPSArX1swXVsxXSwgWTEgPSArX1sxXVsxXTtcbiAgICAgIGlmIChYMCA+IFgxKSBfID0gWDAsIFgwID0gWDEsIFgxID0gXztcbiAgICAgIGlmIChZMCA+IFkxKSBfID0gWTAsIFkwID0gWTEsIFkxID0gXztcbiAgICAgIHJldHVybiBncmF0aWN1bGUucHJlY2lzaW9uKHByZWNpc2lvbik7XG4gICAgfTtcbiAgICBncmF0aWN1bGUubWlub3JFeHRlbnQgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBbIFsgeDAsIHkwIF0sIFsgeDEsIHkxIF0gXTtcbiAgICAgIHgwID0gK19bMF1bMF0sIHgxID0gK19bMV1bMF07XG4gICAgICB5MCA9ICtfWzBdWzFdLCB5MSA9ICtfWzFdWzFdO1xuICAgICAgaWYgKHgwID4geDEpIF8gPSB4MCwgeDAgPSB4MSwgeDEgPSBfO1xuICAgICAgaWYgKHkwID4geTEpIF8gPSB5MCwgeTAgPSB5MSwgeTEgPSBfO1xuICAgICAgcmV0dXJuIGdyYXRpY3VsZS5wcmVjaXNpb24ocHJlY2lzaW9uKTtcbiAgICB9O1xuICAgIGdyYXRpY3VsZS5zdGVwID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZ3JhdGljdWxlLm1pbm9yU3RlcCgpO1xuICAgICAgcmV0dXJuIGdyYXRpY3VsZS5tYWpvclN0ZXAoXykubWlub3JTdGVwKF8pO1xuICAgIH07XG4gICAgZ3JhdGljdWxlLm1ham9yU3RlcCA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIFsgRFgsIERZIF07XG4gICAgICBEWCA9ICtfWzBdLCBEWSA9ICtfWzFdO1xuICAgICAgcmV0dXJuIGdyYXRpY3VsZTtcbiAgICB9O1xuICAgIGdyYXRpY3VsZS5taW5vclN0ZXAgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBbIGR4LCBkeSBdO1xuICAgICAgZHggPSArX1swXSwgZHkgPSArX1sxXTtcbiAgICAgIHJldHVybiBncmF0aWN1bGU7XG4gICAgfTtcbiAgICBncmF0aWN1bGUucHJlY2lzaW9uID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcHJlY2lzaW9uO1xuICAgICAgcHJlY2lzaW9uID0gK187XG4gICAgICB4ID0gZDNfZ2VvX2dyYXRpY3VsZVgoeTAsIHkxLCA5MCk7XG4gICAgICB5ID0gZDNfZ2VvX2dyYXRpY3VsZVkoeDAsIHgxLCBwcmVjaXNpb24pO1xuICAgICAgWCA9IGQzX2dlb19ncmF0aWN1bGVYKFkwLCBZMSwgOTApO1xuICAgICAgWSA9IGQzX2dlb19ncmF0aWN1bGVZKFgwLCBYMSwgcHJlY2lzaW9uKTtcbiAgICAgIHJldHVybiBncmF0aWN1bGU7XG4gICAgfTtcbiAgICByZXR1cm4gZ3JhdGljdWxlLm1ham9yRXh0ZW50KFsgWyAtMTgwLCAtOTAgKyDOtSBdLCBbIDE4MCwgOTAgLSDOtSBdIF0pLm1pbm9yRXh0ZW50KFsgWyAtMTgwLCAtODAgLSDOtSBdLCBbIDE4MCwgODAgKyDOtSBdIF0pO1xuICB9O1xuICBmdW5jdGlvbiBkM19nZW9fZ3JhdGljdWxlWCh5MCwgeTEsIGR5KSB7XG4gICAgdmFyIHkgPSBkMy5yYW5nZSh5MCwgeTEgLSDOtSwgZHkpLmNvbmNhdCh5MSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB5Lm1hcChmdW5jdGlvbih5KSB7XG4gICAgICAgIHJldHVybiBbIHgsIHkgXTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX2dyYXRpY3VsZVkoeDAsIHgxLCBkeCkge1xuICAgIHZhciB4ID0gZDMucmFuZ2UoeDAsIHgxIC0gzrUsIGR4KS5jb25jYXQoeDEpO1xuICAgIHJldHVybiBmdW5jdGlvbih5KSB7XG4gICAgICByZXR1cm4geC5tYXAoZnVuY3Rpb24oeCkge1xuICAgICAgICByZXR1cm4gWyB4LCB5IF07XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGQzX3NvdXJjZShkKSB7XG4gICAgcmV0dXJuIGQuc291cmNlO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RhcmdldChkKSB7XG4gICAgcmV0dXJuIGQudGFyZ2V0O1xuICB9XG4gIGQzLmdlby5ncmVhdEFyYyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzb3VyY2UgPSBkM19zb3VyY2UsIHNvdXJjZV8sIHRhcmdldCA9IGQzX3RhcmdldCwgdGFyZ2V0XztcbiAgICBmdW5jdGlvbiBncmVhdEFyYygpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IFwiTGluZVN0cmluZ1wiLFxuICAgICAgICBjb29yZGluYXRlczogWyBzb3VyY2VfIHx8IHNvdXJjZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCB0YXJnZXRfIHx8IHRhcmdldC5hcHBseSh0aGlzLCBhcmd1bWVudHMpIF1cbiAgICAgIH07XG4gICAgfVxuICAgIGdyZWF0QXJjLmRpc3RhbmNlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZDMuZ2VvLmRpc3RhbmNlKHNvdXJjZV8gfHwgc291cmNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksIHRhcmdldF8gfHwgdGFyZ2V0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gICAgZ3JlYXRBcmMuc291cmNlID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc291cmNlO1xuICAgICAgc291cmNlID0gXywgc291cmNlXyA9IHR5cGVvZiBfID09PSBcImZ1bmN0aW9uXCIgPyBudWxsIDogXztcbiAgICAgIHJldHVybiBncmVhdEFyYztcbiAgICB9O1xuICAgIGdyZWF0QXJjLnRhcmdldCA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRhcmdldDtcbiAgICAgIHRhcmdldCA9IF8sIHRhcmdldF8gPSB0eXBlb2YgXyA9PT0gXCJmdW5jdGlvblwiID8gbnVsbCA6IF87XG4gICAgICByZXR1cm4gZ3JlYXRBcmM7XG4gICAgfTtcbiAgICBncmVhdEFyYy5wcmVjaXNpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gZ3JlYXRBcmMgOiAwO1xuICAgIH07XG4gICAgcmV0dXJuIGdyZWF0QXJjO1xuICB9O1xuICBkMy5nZW8uaW50ZXJwb2xhdGUgPSBmdW5jdGlvbihzb3VyY2UsIHRhcmdldCkge1xuICAgIHJldHVybiBkM19nZW9faW50ZXJwb2xhdGUoc291cmNlWzBdICogZDNfcmFkaWFucywgc291cmNlWzFdICogZDNfcmFkaWFucywgdGFyZ2V0WzBdICogZDNfcmFkaWFucywgdGFyZ2V0WzFdICogZDNfcmFkaWFucyk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2dlb19pbnRlcnBvbGF0ZSh4MCwgeTAsIHgxLCB5MSkge1xuICAgIHZhciBjeTAgPSBNYXRoLmNvcyh5MCksIHN5MCA9IE1hdGguc2luKHkwKSwgY3kxID0gTWF0aC5jb3MoeTEpLCBzeTEgPSBNYXRoLnNpbih5MSksIGt4MCA9IGN5MCAqIE1hdGguY29zKHgwKSwga3kwID0gY3kwICogTWF0aC5zaW4oeDApLCBreDEgPSBjeTEgKiBNYXRoLmNvcyh4MSksIGt5MSA9IGN5MSAqIE1hdGguc2luKHgxKSwgZCA9IDIgKiBNYXRoLmFzaW4oTWF0aC5zcXJ0KGQzX2hhdmVyc2luKHkxIC0geTApICsgY3kwICogY3kxICogZDNfaGF2ZXJzaW4oeDEgLSB4MCkpKSwgayA9IDEgLyBNYXRoLnNpbihkKTtcbiAgICB2YXIgaW50ZXJwb2xhdGUgPSBkID8gZnVuY3Rpb24odCkge1xuICAgICAgdmFyIEIgPSBNYXRoLnNpbih0ICo9IGQpICogaywgQSA9IE1hdGguc2luKGQgLSB0KSAqIGssIHggPSBBICoga3gwICsgQiAqIGt4MSwgeSA9IEEgKiBreTAgKyBCICoga3kxLCB6ID0gQSAqIHN5MCArIEIgKiBzeTE7XG4gICAgICByZXR1cm4gWyBNYXRoLmF0YW4yKHksIHgpICogZDNfZGVncmVlcywgTWF0aC5hdGFuMih6LCBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSkpICogZDNfZGVncmVlcyBdO1xuICAgIH0gOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBbIHgwICogZDNfZGVncmVlcywgeTAgKiBkM19kZWdyZWVzIF07XG4gICAgfTtcbiAgICBpbnRlcnBvbGF0ZS5kaXN0YW5jZSA9IGQ7XG4gICAgcmV0dXJuIGludGVycG9sYXRlO1xuICB9XG4gIGQzLmdlby5sZW5ndGggPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICBkM19nZW9fbGVuZ3RoU3VtID0gMDtcbiAgICBkMy5nZW8uc3RyZWFtKG9iamVjdCwgZDNfZ2VvX2xlbmd0aCk7XG4gICAgcmV0dXJuIGQzX2dlb19sZW5ndGhTdW07XG4gIH07XG4gIHZhciBkM19nZW9fbGVuZ3RoU3VtO1xuICB2YXIgZDNfZ2VvX2xlbmd0aCA9IHtcbiAgICBzcGhlcmU6IGQzX25vb3AsXG4gICAgcG9pbnQ6IGQzX25vb3AsXG4gICAgbGluZVN0YXJ0OiBkM19nZW9fbGVuZ3RoTGluZVN0YXJ0LFxuICAgIGxpbmVFbmQ6IGQzX25vb3AsXG4gICAgcG9seWdvblN0YXJ0OiBkM19ub29wLFxuICAgIHBvbHlnb25FbmQ6IGQzX25vb3BcbiAgfTtcbiAgZnVuY3Rpb24gZDNfZ2VvX2xlbmd0aExpbmVTdGFydCgpIHtcbiAgICB2YXIgzrswLCBzaW7PhjAsIGNvc8+GMDtcbiAgICBkM19nZW9fbGVuZ3RoLnBvaW50ID0gZnVuY3Rpb24ozrssIM+GKSB7XG4gICAgICDOuzAgPSDOuyAqIGQzX3JhZGlhbnMsIHNpbs+GMCA9IE1hdGguc2luKM+GICo9IGQzX3JhZGlhbnMpLCBjb3PPhjAgPSBNYXRoLmNvcyjPhik7XG4gICAgICBkM19nZW9fbGVuZ3RoLnBvaW50ID0gbmV4dFBvaW50O1xuICAgIH07XG4gICAgZDNfZ2VvX2xlbmd0aC5saW5lRW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICBkM19nZW9fbGVuZ3RoLnBvaW50ID0gZDNfZ2VvX2xlbmd0aC5saW5lRW5kID0gZDNfbm9vcDtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIG5leHRQb2ludCjOuywgz4YpIHtcbiAgICAgIHZhciBzaW7PhiA9IE1hdGguc2luKM+GICo9IGQzX3JhZGlhbnMpLCBjb3PPhiA9IE1hdGguY29zKM+GKSwgdCA9IGFicygozrsgKj0gZDNfcmFkaWFucykgLSDOuzApLCBjb3POlM67ID0gTWF0aC5jb3ModCk7XG4gICAgICBkM19nZW9fbGVuZ3RoU3VtICs9IE1hdGguYXRhbjIoTWF0aC5zcXJ0KCh0ID0gY29zz4YgKiBNYXRoLnNpbih0KSkgKiB0ICsgKHQgPSBjb3PPhjAgKiBzaW7PhiAtIHNpbs+GMCAqIGNvc8+GICogY29zzpTOuykgKiB0KSwgc2luz4YwICogc2luz4YgKyBjb3PPhjAgKiBjb3PPhiAqIGNvc86UzrspO1xuICAgICAgzrswID0gzrssIHNpbs+GMCA9IHNpbs+GLCBjb3PPhjAgPSBjb3PPhjtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvX2F6aW11dGhhbChzY2FsZSwgYW5nbGUpIHtcbiAgICBmdW5jdGlvbiBhemltdXRoYWwozrssIM+GKSB7XG4gICAgICB2YXIgY29zzrsgPSBNYXRoLmNvcyjOuyksIGNvc8+GID0gTWF0aC5jb3Moz4YpLCBrID0gc2NhbGUoY29zzrsgKiBjb3PPhik7XG4gICAgICByZXR1cm4gWyBrICogY29zz4YgKiBNYXRoLnNpbijOuyksIGsgKiBNYXRoLnNpbijPhikgXTtcbiAgICB9XG4gICAgYXppbXV0aGFsLmludmVydCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgIHZhciDPgSA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5KSwgYyA9IGFuZ2xlKM+BKSwgc2luYyA9IE1hdGguc2luKGMpLCBjb3NjID0gTWF0aC5jb3MoYyk7XG4gICAgICByZXR1cm4gWyBNYXRoLmF0YW4yKHggKiBzaW5jLCDPgSAqIGNvc2MpLCBNYXRoLmFzaW4oz4EgJiYgeSAqIHNpbmMgLyDPgSkgXTtcbiAgICB9O1xuICAgIHJldHVybiBhemltdXRoYWw7XG4gIH1cbiAgdmFyIGQzX2dlb19hemltdXRoYWxFcXVhbEFyZWEgPSBkM19nZW9fYXppbXV0aGFsKGZ1bmN0aW9uKGNvc867Y29zz4YpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KDIgLyAoMSArIGNvc867Y29zz4YpKTtcbiAgfSwgZnVuY3Rpb24oz4EpIHtcbiAgICByZXR1cm4gMiAqIE1hdGguYXNpbijPgSAvIDIpO1xuICB9KTtcbiAgKGQzLmdlby5hemltdXRoYWxFcXVhbEFyZWEgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfZ2VvX3Byb2plY3Rpb24oZDNfZ2VvX2F6aW11dGhhbEVxdWFsQXJlYSk7XG4gIH0pLnJhdyA9IGQzX2dlb19hemltdXRoYWxFcXVhbEFyZWE7XG4gIHZhciBkM19nZW9fYXppbXV0aGFsRXF1aWRpc3RhbnQgPSBkM19nZW9fYXppbXV0aGFsKGZ1bmN0aW9uKGNvc867Y29zz4YpIHtcbiAgICB2YXIgYyA9IE1hdGguYWNvcyhjb3POu2Nvc8+GKTtcbiAgICByZXR1cm4gYyAmJiBjIC8gTWF0aC5zaW4oYyk7XG4gIH0sIGQzX2lkZW50aXR5KTtcbiAgKGQzLmdlby5hemltdXRoYWxFcXVpZGlzdGFudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM19nZW9fcHJvamVjdGlvbihkM19nZW9fYXppbXV0aGFsRXF1aWRpc3RhbnQpO1xuICB9KS5yYXcgPSBkM19nZW9fYXppbXV0aGFsRXF1aWRpc3RhbnQ7XG4gIGZ1bmN0aW9uIGQzX2dlb19jb25pY0NvbmZvcm1hbCjPhjAsIM+GMSkge1xuICAgIHZhciBjb3PPhjAgPSBNYXRoLmNvcyjPhjApLCB0ID0gZnVuY3Rpb24oz4YpIHtcbiAgICAgIHJldHVybiBNYXRoLnRhbijPgCAvIDQgKyDPhiAvIDIpO1xuICAgIH0sIG4gPSDPhjAgPT09IM+GMSA/IE1hdGguc2luKM+GMCkgOiBNYXRoLmxvZyhjb3PPhjAgLyBNYXRoLmNvcyjPhjEpKSAvIE1hdGgubG9nKHQoz4YxKSAvIHQoz4YwKSksIEYgPSBjb3PPhjAgKiBNYXRoLnBvdyh0KM+GMCksIG4pIC8gbjtcbiAgICBpZiAoIW4pIHJldHVybiBkM19nZW9fbWVyY2F0b3I7XG4gICAgZnVuY3Rpb24gZm9yd2FyZCjOuywgz4YpIHtcbiAgICAgIGlmIChGID4gMCkge1xuICAgICAgICBpZiAoz4YgPCAtaGFsZs+AICsgzrUpIM+GID0gLWhhbGbPgCArIM61O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKM+GID4gaGFsZs+AIC0gzrUpIM+GID0gaGFsZs+AIC0gzrU7XG4gICAgICB9XG4gICAgICB2YXIgz4EgPSBGIC8gTWF0aC5wb3codCjPhiksIG4pO1xuICAgICAgcmV0dXJuIFsgz4EgKiBNYXRoLnNpbihuICogzrspLCBGIC0gz4EgKiBNYXRoLmNvcyhuICogzrspIF07XG4gICAgfVxuICAgIGZvcndhcmQuaW52ZXJ0ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgICAgdmFyIM+BMF95ID0gRiAtIHksIM+BID0gZDNfc2duKG4pICogTWF0aC5zcXJ0KHggKiB4ICsgz4EwX3kgKiDPgTBfeSk7XG4gICAgICByZXR1cm4gWyBNYXRoLmF0YW4yKHgsIM+BMF95KSAvIG4sIDIgKiBNYXRoLmF0YW4oTWF0aC5wb3coRiAvIM+BLCAxIC8gbikpIC0gaGFsZs+AIF07XG4gICAgfTtcbiAgICByZXR1cm4gZm9yd2FyZDtcbiAgfVxuICAoZDMuZ2VvLmNvbmljQ29uZm9ybWFsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGQzX2dlb19jb25pYyhkM19nZW9fY29uaWNDb25mb3JtYWwpO1xuICB9KS5yYXcgPSBkM19nZW9fY29uaWNDb25mb3JtYWw7XG4gIGZ1bmN0aW9uIGQzX2dlb19jb25pY0VxdWlkaXN0YW50KM+GMCwgz4YxKSB7XG4gICAgdmFyIGNvc8+GMCA9IE1hdGguY29zKM+GMCksIG4gPSDPhjAgPT09IM+GMSA/IE1hdGguc2luKM+GMCkgOiAoY29zz4YwIC0gTWF0aC5jb3Moz4YxKSkgLyAoz4YxIC0gz4YwKSwgRyA9IGNvc8+GMCAvIG4gKyDPhjA7XG4gICAgaWYgKGFicyhuKSA8IM61KSByZXR1cm4gZDNfZ2VvX2VxdWlyZWN0YW5ndWxhcjtcbiAgICBmdW5jdGlvbiBmb3J3YXJkKM67LCDPhikge1xuICAgICAgdmFyIM+BID0gRyAtIM+GO1xuICAgICAgcmV0dXJuIFsgz4EgKiBNYXRoLnNpbihuICogzrspLCBHIC0gz4EgKiBNYXRoLmNvcyhuICogzrspIF07XG4gICAgfVxuICAgIGZvcndhcmQuaW52ZXJ0ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgICAgdmFyIM+BMF95ID0gRyAtIHk7XG4gICAgICByZXR1cm4gWyBNYXRoLmF0YW4yKHgsIM+BMF95KSAvIG4sIEcgLSBkM19zZ24obikgKiBNYXRoLnNxcnQoeCAqIHggKyDPgTBfeSAqIM+BMF95KSBdO1xuICAgIH07XG4gICAgcmV0dXJuIGZvcndhcmQ7XG4gIH1cbiAgKGQzLmdlby5jb25pY0VxdWlkaXN0YW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGQzX2dlb19jb25pYyhkM19nZW9fY29uaWNFcXVpZGlzdGFudCk7XG4gIH0pLnJhdyA9IGQzX2dlb19jb25pY0VxdWlkaXN0YW50O1xuICB2YXIgZDNfZ2VvX2dub21vbmljID0gZDNfZ2VvX2F6aW11dGhhbChmdW5jdGlvbihjb3POu2Nvc8+GKSB7XG4gICAgcmV0dXJuIDEgLyBjb3POu2Nvc8+GO1xuICB9LCBNYXRoLmF0YW4pO1xuICAoZDMuZ2VvLmdub21vbmljID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGQzX2dlb19wcm9qZWN0aW9uKGQzX2dlb19nbm9tb25pYyk7XG4gIH0pLnJhdyA9IGQzX2dlb19nbm9tb25pYztcbiAgZnVuY3Rpb24gZDNfZ2VvX21lcmNhdG9yKM67LCDPhikge1xuICAgIHJldHVybiBbIM67LCBNYXRoLmxvZyhNYXRoLnRhbijPgCAvIDQgKyDPhiAvIDIpKSBdO1xuICB9XG4gIGQzX2dlb19tZXJjYXRvci5pbnZlcnQgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgcmV0dXJuIFsgeCwgMiAqIE1hdGguYXRhbihNYXRoLmV4cCh5KSkgLSBoYWxmz4AgXTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfZ2VvX21lcmNhdG9yUHJvamVjdGlvbihwcm9qZWN0KSB7XG4gICAgdmFyIG0gPSBkM19nZW9fcHJvamVjdGlvbihwcm9qZWN0KSwgc2NhbGUgPSBtLnNjYWxlLCB0cmFuc2xhdGUgPSBtLnRyYW5zbGF0ZSwgY2xpcEV4dGVudCA9IG0uY2xpcEV4dGVudCwgY2xpcEF1dG87XG4gICAgbS5zY2FsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHYgPSBzY2FsZS5hcHBseShtLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHYgPT09IG0gPyBjbGlwQXV0byA/IG0uY2xpcEV4dGVudChudWxsKSA6IG0gOiB2O1xuICAgIH07XG4gICAgbS50cmFuc2xhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2ID0gdHJhbnNsYXRlLmFwcGx5KG0sIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdiA9PT0gbSA/IGNsaXBBdXRvID8gbS5jbGlwRXh0ZW50KG51bGwpIDogbSA6IHY7XG4gICAgfTtcbiAgICBtLmNsaXBFeHRlbnQgPSBmdW5jdGlvbihfKSB7XG4gICAgICB2YXIgdiA9IGNsaXBFeHRlbnQuYXBwbHkobSwgYXJndW1lbnRzKTtcbiAgICAgIGlmICh2ID09PSBtKSB7XG4gICAgICAgIGlmIChjbGlwQXV0byA9IF8gPT0gbnVsbCkge1xuICAgICAgICAgIHZhciBrID0gz4AgKiBzY2FsZSgpLCB0ID0gdHJhbnNsYXRlKCk7XG4gICAgICAgICAgY2xpcEV4dGVudChbIFsgdFswXSAtIGssIHRbMV0gLSBrIF0sIFsgdFswXSArIGssIHRbMV0gKyBrIF0gXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2xpcEF1dG8pIHtcbiAgICAgICAgdiA9IG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gdjtcbiAgICB9O1xuICAgIHJldHVybiBtLmNsaXBFeHRlbnQobnVsbCk7XG4gIH1cbiAgKGQzLmdlby5tZXJjYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM19nZW9fbWVyY2F0b3JQcm9qZWN0aW9uKGQzX2dlb19tZXJjYXRvcik7XG4gIH0pLnJhdyA9IGQzX2dlb19tZXJjYXRvcjtcbiAgdmFyIGQzX2dlb19vcnRob2dyYXBoaWMgPSBkM19nZW9fYXppbXV0aGFsKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAxO1xuICB9LCBNYXRoLmFzaW4pO1xuICAoZDMuZ2VvLm9ydGhvZ3JhcGhpYyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM19nZW9fcHJvamVjdGlvbihkM19nZW9fb3J0aG9ncmFwaGljKTtcbiAgfSkucmF3ID0gZDNfZ2VvX29ydGhvZ3JhcGhpYztcbiAgdmFyIGQzX2dlb19zdGVyZW9ncmFwaGljID0gZDNfZ2VvX2F6aW11dGhhbChmdW5jdGlvbihjb3POu2Nvc8+GKSB7XG4gICAgcmV0dXJuIDEgLyAoMSArIGNvc867Y29zz4YpO1xuICB9LCBmdW5jdGlvbijPgSkge1xuICAgIHJldHVybiAyICogTWF0aC5hdGFuKM+BKTtcbiAgfSk7XG4gIChkMy5nZW8uc3RlcmVvZ3JhcGhpYyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM19nZW9fcHJvamVjdGlvbihkM19nZW9fc3RlcmVvZ3JhcGhpYyk7XG4gIH0pLnJhdyA9IGQzX2dlb19zdGVyZW9ncmFwaGljO1xuICBmdW5jdGlvbiBkM19nZW9fdHJhbnN2ZXJzZU1lcmNhdG9yKM67LCDPhikge1xuICAgIHJldHVybiBbIE1hdGgubG9nKE1hdGgudGFuKM+AIC8gNCArIM+GIC8gMikpLCAtzrsgXTtcbiAgfVxuICBkM19nZW9fdHJhbnN2ZXJzZU1lcmNhdG9yLmludmVydCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICByZXR1cm4gWyAteSwgMiAqIE1hdGguYXRhbihNYXRoLmV4cCh4KSkgLSBoYWxmz4AgXTtcbiAgfTtcbiAgKGQzLmdlby50cmFuc3ZlcnNlTWVyY2F0b3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJvamVjdGlvbiA9IGQzX2dlb19tZXJjYXRvclByb2plY3Rpb24oZDNfZ2VvX3RyYW5zdmVyc2VNZXJjYXRvciksIGNlbnRlciA9IHByb2plY3Rpb24uY2VudGVyLCByb3RhdGUgPSBwcm9qZWN0aW9uLnJvdGF0ZTtcbiAgICBwcm9qZWN0aW9uLmNlbnRlciA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIHJldHVybiBfID8gY2VudGVyKFsgLV9bMV0sIF9bMF0gXSkgOiAoXyA9IGNlbnRlcigpLCBbIF9bMV0sIC1fWzBdIF0pO1xuICAgIH07XG4gICAgcHJvamVjdGlvbi5yb3RhdGUgPSBmdW5jdGlvbihfKSB7XG4gICAgICByZXR1cm4gXyA/IHJvdGF0ZShbIF9bMF0sIF9bMV0sIF8ubGVuZ3RoID4gMiA/IF9bMl0gKyA5MCA6IDkwIF0pIDogKF8gPSByb3RhdGUoKSwgXG4gICAgICBbIF9bMF0sIF9bMV0sIF9bMl0gLSA5MCBdKTtcbiAgICB9O1xuICAgIHJldHVybiByb3RhdGUoWyAwLCAwLCA5MCBdKTtcbiAgfSkucmF3ID0gZDNfZ2VvX3RyYW5zdmVyc2VNZXJjYXRvcjtcbiAgZDMuZ2VvbSA9IHt9O1xuICBmdW5jdGlvbiBkM19nZW9tX3BvaW50WChkKSB7XG4gICAgcmV0dXJuIGRbMF07XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvbV9wb2ludFkoZCkge1xuICAgIHJldHVybiBkWzFdO1xuICB9XG4gIGQzLmdlb20uaHVsbCA9IGZ1bmN0aW9uKHZlcnRpY2VzKSB7XG4gICAgdmFyIHggPSBkM19nZW9tX3BvaW50WCwgeSA9IGQzX2dlb21fcG9pbnRZO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gaHVsbCh2ZXJ0aWNlcyk7XG4gICAgZnVuY3Rpb24gaHVsbChkYXRhKSB7XG4gICAgICBpZiAoZGF0YS5sZW5ndGggPCAzKSByZXR1cm4gW107XG4gICAgICB2YXIgZnggPSBkM19mdW5jdG9yKHgpLCBmeSA9IGQzX2Z1bmN0b3IoeSksIGksIG4gPSBkYXRhLmxlbmd0aCwgcG9pbnRzID0gW10sIGZsaXBwZWRQb2ludHMgPSBbXTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcG9pbnRzLnB1c2goWyArZnguY2FsbCh0aGlzLCBkYXRhW2ldLCBpKSwgK2Z5LmNhbGwodGhpcywgZGF0YVtpXSwgaSksIGkgXSk7XG4gICAgICB9XG4gICAgICBwb2ludHMuc29ydChkM19nZW9tX2h1bGxPcmRlcik7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSBmbGlwcGVkUG9pbnRzLnB1c2goWyBwb2ludHNbaV1bMF0sIC1wb2ludHNbaV1bMV0gXSk7XG4gICAgICB2YXIgdXBwZXIgPSBkM19nZW9tX2h1bGxVcHBlcihwb2ludHMpLCBsb3dlciA9IGQzX2dlb21faHVsbFVwcGVyKGZsaXBwZWRQb2ludHMpO1xuICAgICAgdmFyIHNraXBMZWZ0ID0gbG93ZXJbMF0gPT09IHVwcGVyWzBdLCBza2lwUmlnaHQgPSBsb3dlcltsb3dlci5sZW5ndGggLSAxXSA9PT0gdXBwZXJbdXBwZXIubGVuZ3RoIC0gMV0sIHBvbHlnb24gPSBbXTtcbiAgICAgIGZvciAoaSA9IHVwcGVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSBwb2x5Z29uLnB1c2goZGF0YVtwb2ludHNbdXBwZXJbaV1dWzJdXSk7XG4gICAgICBmb3IgKGkgPSArc2tpcExlZnQ7IGkgPCBsb3dlci5sZW5ndGggLSBza2lwUmlnaHQ7ICsraSkgcG9seWdvbi5wdXNoKGRhdGFbcG9pbnRzW2xvd2VyW2ldXVsyXV0pO1xuICAgICAgcmV0dXJuIHBvbHlnb247XG4gICAgfVxuICAgIGh1bGwueCA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gKHggPSBfLCBodWxsKSA6IHg7XG4gICAgfTtcbiAgICBodWxsLnkgPSBmdW5jdGlvbihfKSB7XG4gICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/ICh5ID0gXywgaHVsbCkgOiB5O1xuICAgIH07XG4gICAgcmV0dXJuIGh1bGw7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2dlb21faHVsbFVwcGVyKHBvaW50cykge1xuICAgIHZhciBuID0gcG9pbnRzLmxlbmd0aCwgaHVsbCA9IFsgMCwgMSBdLCBocyA9IDI7XG4gICAgZm9yICh2YXIgaSA9IDI7IGkgPCBuOyBpKyspIHtcbiAgICAgIHdoaWxlIChocyA+IDEgJiYgZDNfY3Jvc3MyZChwb2ludHNbaHVsbFtocyAtIDJdXSwgcG9pbnRzW2h1bGxbaHMgLSAxXV0sIHBvaW50c1tpXSkgPD0gMCkgLS1ocztcbiAgICAgIGh1bGxbaHMrK10gPSBpO1xuICAgIH1cbiAgICByZXR1cm4gaHVsbC5zbGljZSgwLCBocyk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvbV9odWxsT3JkZXIoYSwgYikge1xuICAgIHJldHVybiBhWzBdIC0gYlswXSB8fCBhWzFdIC0gYlsxXTtcbiAgfVxuICBkMy5nZW9tLnBvbHlnb24gPSBmdW5jdGlvbihjb29yZGluYXRlcykge1xuICAgIGQzX3N1YmNsYXNzKGNvb3JkaW5hdGVzLCBkM19nZW9tX3BvbHlnb25Qcm90b3R5cGUpO1xuICAgIHJldHVybiBjb29yZGluYXRlcztcbiAgfTtcbiAgdmFyIGQzX2dlb21fcG9seWdvblByb3RvdHlwZSA9IGQzLmdlb20ucG9seWdvbi5wcm90b3R5cGUgPSBbXTtcbiAgZDNfZ2VvbV9wb2x5Z29uUHJvdG90eXBlLmFyZWEgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaSA9IC0xLCBuID0gdGhpcy5sZW5ndGgsIGEsIGIgPSB0aGlzW24gLSAxXSwgYXJlYSA9IDA7XG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIGEgPSBiO1xuICAgICAgYiA9IHRoaXNbaV07XG4gICAgICBhcmVhICs9IGFbMV0gKiBiWzBdIC0gYVswXSAqIGJbMV07XG4gICAgfVxuICAgIHJldHVybiBhcmVhICogLjU7XG4gIH07XG4gIGQzX2dlb21fcG9seWdvblByb3RvdHlwZS5jZW50cm9pZCA9IGZ1bmN0aW9uKGspIHtcbiAgICB2YXIgaSA9IC0xLCBuID0gdGhpcy5sZW5ndGgsIHggPSAwLCB5ID0gMCwgYSwgYiA9IHRoaXNbbiAtIDFdLCBjO1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgayA9IC0xIC8gKDYgKiB0aGlzLmFyZWEoKSk7XG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIGEgPSBiO1xuICAgICAgYiA9IHRoaXNbaV07XG4gICAgICBjID0gYVswXSAqIGJbMV0gLSBiWzBdICogYVsxXTtcbiAgICAgIHggKz0gKGFbMF0gKyBiWzBdKSAqIGM7XG4gICAgICB5ICs9IChhWzFdICsgYlsxXSkgKiBjO1xuICAgIH1cbiAgICByZXR1cm4gWyB4ICogaywgeSAqIGsgXTtcbiAgfTtcbiAgZDNfZ2VvbV9wb2x5Z29uUHJvdG90eXBlLmNsaXAgPSBmdW5jdGlvbihzdWJqZWN0KSB7XG4gICAgdmFyIGlucHV0LCBjbG9zZWQgPSBkM19nZW9tX3BvbHlnb25DbG9zZWQoc3ViamVjdCksIGkgPSAtMSwgbiA9IHRoaXMubGVuZ3RoIC0gZDNfZ2VvbV9wb2x5Z29uQ2xvc2VkKHRoaXMpLCBqLCBtLCBhID0gdGhpc1tuIC0gMV0sIGIsIGMsIGQ7XG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIGlucHV0ID0gc3ViamVjdC5zbGljZSgpO1xuICAgICAgc3ViamVjdC5sZW5ndGggPSAwO1xuICAgICAgYiA9IHRoaXNbaV07XG4gICAgICBjID0gaW5wdXRbKG0gPSBpbnB1dC5sZW5ndGggLSBjbG9zZWQpIC0gMV07XG4gICAgICBqID0gLTE7XG4gICAgICB3aGlsZSAoKytqIDwgbSkge1xuICAgICAgICBkID0gaW5wdXRbal07XG4gICAgICAgIGlmIChkM19nZW9tX3BvbHlnb25JbnNpZGUoZCwgYSwgYikpIHtcbiAgICAgICAgICBpZiAoIWQzX2dlb21fcG9seWdvbkluc2lkZShjLCBhLCBiKSkge1xuICAgICAgICAgICAgc3ViamVjdC5wdXNoKGQzX2dlb21fcG9seWdvbkludGVyc2VjdChjLCBkLCBhLCBiKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN1YmplY3QucHVzaChkKTtcbiAgICAgICAgfSBlbHNlIGlmIChkM19nZW9tX3BvbHlnb25JbnNpZGUoYywgYSwgYikpIHtcbiAgICAgICAgICBzdWJqZWN0LnB1c2goZDNfZ2VvbV9wb2x5Z29uSW50ZXJzZWN0KGMsIGQsIGEsIGIpKTtcbiAgICAgICAgfVxuICAgICAgICBjID0gZDtcbiAgICAgIH1cbiAgICAgIGlmIChjbG9zZWQpIHN1YmplY3QucHVzaChzdWJqZWN0WzBdKTtcbiAgICAgIGEgPSBiO1xuICAgIH1cbiAgICByZXR1cm4gc3ViamVjdDtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfZ2VvbV9wb2x5Z29uSW5zaWRlKHAsIGEsIGIpIHtcbiAgICByZXR1cm4gKGJbMF0gLSBhWzBdKSAqIChwWzFdIC0gYVsxXSkgPCAoYlsxXSAtIGFbMV0pICogKHBbMF0gLSBhWzBdKTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3BvbHlnb25JbnRlcnNlY3QoYywgZCwgYSwgYikge1xuICAgIHZhciB4MSA9IGNbMF0sIHgzID0gYVswXSwgeDIxID0gZFswXSAtIHgxLCB4NDMgPSBiWzBdIC0geDMsIHkxID0gY1sxXSwgeTMgPSBhWzFdLCB5MjEgPSBkWzFdIC0geTEsIHk0MyA9IGJbMV0gLSB5MywgdWEgPSAoeDQzICogKHkxIC0geTMpIC0geTQzICogKHgxIC0geDMpKSAvICh5NDMgKiB4MjEgLSB4NDMgKiB5MjEpO1xuICAgIHJldHVybiBbIHgxICsgdWEgKiB4MjEsIHkxICsgdWEgKiB5MjEgXTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3BvbHlnb25DbG9zZWQoY29vcmRpbmF0ZXMpIHtcbiAgICB2YXIgYSA9IGNvb3JkaW5hdGVzWzBdLCBiID0gY29vcmRpbmF0ZXNbY29vcmRpbmF0ZXMubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuICEoYVswXSAtIGJbMF0gfHwgYVsxXSAtIGJbMV0pO1xuICB9XG4gIHZhciBkM19nZW9tX3Zvcm9ub2lFZGdlcywgZDNfZ2VvbV92b3Jvbm9pQ2VsbHMsIGQzX2dlb21fdm9yb25vaUJlYWNoZXMsIGQzX2dlb21fdm9yb25vaUJlYWNoUG9vbCA9IFtdLCBkM19nZW9tX3Zvcm9ub2lGaXJzdENpcmNsZSwgZDNfZ2VvbV92b3Jvbm9pQ2lyY2xlcywgZDNfZ2VvbV92b3Jvbm9pQ2lyY2xlUG9vbCA9IFtdO1xuICBmdW5jdGlvbiBkM19nZW9tX3Zvcm9ub2lCZWFjaCgpIHtcbiAgICBkM19nZW9tX3Zvcm9ub2lSZWRCbGFja05vZGUodGhpcyk7XG4gICAgdGhpcy5lZGdlID0gdGhpcy5zaXRlID0gdGhpcy5jaXJjbGUgPSBudWxsO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb21fdm9yb25vaUNyZWF0ZUJlYWNoKHNpdGUpIHtcbiAgICB2YXIgYmVhY2ggPSBkM19nZW9tX3Zvcm9ub2lCZWFjaFBvb2wucG9wKCkgfHwgbmV3IGQzX2dlb21fdm9yb25vaUJlYWNoKCk7XG4gICAgYmVhY2guc2l0ZSA9IHNpdGU7XG4gICAgcmV0dXJuIGJlYWNoO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb21fdm9yb25vaURldGFjaEJlYWNoKGJlYWNoKSB7XG4gICAgZDNfZ2VvbV92b3Jvbm9pRGV0YWNoQ2lyY2xlKGJlYWNoKTtcbiAgICBkM19nZW9tX3Zvcm9ub2lCZWFjaGVzLnJlbW92ZShiZWFjaCk7XG4gICAgZDNfZ2VvbV92b3Jvbm9pQmVhY2hQb29sLnB1c2goYmVhY2gpO1xuICAgIGQzX2dlb21fdm9yb25vaVJlZEJsYWNrTm9kZShiZWFjaCk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvbV92b3Jvbm9pUmVtb3ZlQmVhY2goYmVhY2gpIHtcbiAgICB2YXIgY2lyY2xlID0gYmVhY2guY2lyY2xlLCB4ID0gY2lyY2xlLngsIHkgPSBjaXJjbGUuY3ksIHZlcnRleCA9IHtcbiAgICAgIHg6IHgsXG4gICAgICB5OiB5XG4gICAgfSwgcHJldmlvdXMgPSBiZWFjaC5QLCBuZXh0ID0gYmVhY2guTiwgZGlzYXBwZWFyaW5nID0gWyBiZWFjaCBdO1xuICAgIGQzX2dlb21fdm9yb25vaURldGFjaEJlYWNoKGJlYWNoKTtcbiAgICB2YXIgbEFyYyA9IHByZXZpb3VzO1xuICAgIHdoaWxlIChsQXJjLmNpcmNsZSAmJiBhYnMoeCAtIGxBcmMuY2lyY2xlLngpIDwgzrUgJiYgYWJzKHkgLSBsQXJjLmNpcmNsZS5jeSkgPCDOtSkge1xuICAgICAgcHJldmlvdXMgPSBsQXJjLlA7XG4gICAgICBkaXNhcHBlYXJpbmcudW5zaGlmdChsQXJjKTtcbiAgICAgIGQzX2dlb21fdm9yb25vaURldGFjaEJlYWNoKGxBcmMpO1xuICAgICAgbEFyYyA9IHByZXZpb3VzO1xuICAgIH1cbiAgICBkaXNhcHBlYXJpbmcudW5zaGlmdChsQXJjKTtcbiAgICBkM19nZW9tX3Zvcm9ub2lEZXRhY2hDaXJjbGUobEFyYyk7XG4gICAgdmFyIHJBcmMgPSBuZXh0O1xuICAgIHdoaWxlIChyQXJjLmNpcmNsZSAmJiBhYnMoeCAtIHJBcmMuY2lyY2xlLngpIDwgzrUgJiYgYWJzKHkgLSByQXJjLmNpcmNsZS5jeSkgPCDOtSkge1xuICAgICAgbmV4dCA9IHJBcmMuTjtcbiAgICAgIGRpc2FwcGVhcmluZy5wdXNoKHJBcmMpO1xuICAgICAgZDNfZ2VvbV92b3Jvbm9pRGV0YWNoQmVhY2gockFyYyk7XG4gICAgICByQXJjID0gbmV4dDtcbiAgICB9XG4gICAgZGlzYXBwZWFyaW5nLnB1c2gockFyYyk7XG4gICAgZDNfZ2VvbV92b3Jvbm9pRGV0YWNoQ2lyY2xlKHJBcmMpO1xuICAgIHZhciBuQXJjcyA9IGRpc2FwcGVhcmluZy5sZW5ndGgsIGlBcmM7XG4gICAgZm9yIChpQXJjID0gMTsgaUFyYyA8IG5BcmNzOyArK2lBcmMpIHtcbiAgICAgIHJBcmMgPSBkaXNhcHBlYXJpbmdbaUFyY107XG4gICAgICBsQXJjID0gZGlzYXBwZWFyaW5nW2lBcmMgLSAxXTtcbiAgICAgIGQzX2dlb21fdm9yb25vaVNldEVkZ2VFbmQockFyYy5lZGdlLCBsQXJjLnNpdGUsIHJBcmMuc2l0ZSwgdmVydGV4KTtcbiAgICB9XG4gICAgbEFyYyA9IGRpc2FwcGVhcmluZ1swXTtcbiAgICByQXJjID0gZGlzYXBwZWFyaW5nW25BcmNzIC0gMV07XG4gICAgckFyYy5lZGdlID0gZDNfZ2VvbV92b3Jvbm9pQ3JlYXRlRWRnZShsQXJjLnNpdGUsIHJBcmMuc2l0ZSwgbnVsbCwgdmVydGV4KTtcbiAgICBkM19nZW9tX3Zvcm9ub2lBdHRhY2hDaXJjbGUobEFyYyk7XG4gICAgZDNfZ2VvbV92b3Jvbm9pQXR0YWNoQ2lyY2xlKHJBcmMpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb21fdm9yb25vaUFkZEJlYWNoKHNpdGUpIHtcbiAgICB2YXIgeCA9IHNpdGUueCwgZGlyZWN0cml4ID0gc2l0ZS55LCBsQXJjLCByQXJjLCBkeGwsIGR4ciwgbm9kZSA9IGQzX2dlb21fdm9yb25vaUJlYWNoZXMuXztcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgZHhsID0gZDNfZ2VvbV92b3Jvbm9pTGVmdEJyZWFrUG9pbnQobm9kZSwgZGlyZWN0cml4KSAtIHg7XG4gICAgICBpZiAoZHhsID4gzrUpIG5vZGUgPSBub2RlLkw7IGVsc2Uge1xuICAgICAgICBkeHIgPSB4IC0gZDNfZ2VvbV92b3Jvbm9pUmlnaHRCcmVha1BvaW50KG5vZGUsIGRpcmVjdHJpeCk7XG4gICAgICAgIGlmIChkeHIgPiDOtSkge1xuICAgICAgICAgIGlmICghbm9kZS5SKSB7XG4gICAgICAgICAgICBsQXJjID0gbm9kZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBub2RlID0gbm9kZS5SO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChkeGwgPiAtzrUpIHtcbiAgICAgICAgICAgIGxBcmMgPSBub2RlLlA7XG4gICAgICAgICAgICByQXJjID0gbm9kZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGR4ciA+IC3OtSkge1xuICAgICAgICAgICAgbEFyYyA9IG5vZGU7XG4gICAgICAgICAgICByQXJjID0gbm9kZS5OO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsQXJjID0gckFyYyA9IG5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBuZXdBcmMgPSBkM19nZW9tX3Zvcm9ub2lDcmVhdGVCZWFjaChzaXRlKTtcbiAgICBkM19nZW9tX3Zvcm9ub2lCZWFjaGVzLmluc2VydChsQXJjLCBuZXdBcmMpO1xuICAgIGlmICghbEFyYyAmJiAhckFyYykgcmV0dXJuO1xuICAgIGlmIChsQXJjID09PSByQXJjKSB7XG4gICAgICBkM19nZW9tX3Zvcm9ub2lEZXRhY2hDaXJjbGUobEFyYyk7XG4gICAgICByQXJjID0gZDNfZ2VvbV92b3Jvbm9pQ3JlYXRlQmVhY2gobEFyYy5zaXRlKTtcbiAgICAgIGQzX2dlb21fdm9yb25vaUJlYWNoZXMuaW5zZXJ0KG5ld0FyYywgckFyYyk7XG4gICAgICBuZXdBcmMuZWRnZSA9IHJBcmMuZWRnZSA9IGQzX2dlb21fdm9yb25vaUNyZWF0ZUVkZ2UobEFyYy5zaXRlLCBuZXdBcmMuc2l0ZSk7XG4gICAgICBkM19nZW9tX3Zvcm9ub2lBdHRhY2hDaXJjbGUobEFyYyk7XG4gICAgICBkM19nZW9tX3Zvcm9ub2lBdHRhY2hDaXJjbGUockFyYyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghckFyYykge1xuICAgICAgbmV3QXJjLmVkZ2UgPSBkM19nZW9tX3Zvcm9ub2lDcmVhdGVFZGdlKGxBcmMuc2l0ZSwgbmV3QXJjLnNpdGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkM19nZW9tX3Zvcm9ub2lEZXRhY2hDaXJjbGUobEFyYyk7XG4gICAgZDNfZ2VvbV92b3Jvbm9pRGV0YWNoQ2lyY2xlKHJBcmMpO1xuICAgIHZhciBsU2l0ZSA9IGxBcmMuc2l0ZSwgYXggPSBsU2l0ZS54LCBheSA9IGxTaXRlLnksIGJ4ID0gc2l0ZS54IC0gYXgsIGJ5ID0gc2l0ZS55IC0gYXksIHJTaXRlID0gckFyYy5zaXRlLCBjeCA9IHJTaXRlLnggLSBheCwgY3kgPSByU2l0ZS55IC0gYXksIGQgPSAyICogKGJ4ICogY3kgLSBieSAqIGN4KSwgaGIgPSBieCAqIGJ4ICsgYnkgKiBieSwgaGMgPSBjeCAqIGN4ICsgY3kgKiBjeSwgdmVydGV4ID0ge1xuICAgICAgeDogKGN5ICogaGIgLSBieSAqIGhjKSAvIGQgKyBheCxcbiAgICAgIHk6IChieCAqIGhjIC0gY3ggKiBoYikgLyBkICsgYXlcbiAgICB9O1xuICAgIGQzX2dlb21fdm9yb25vaVNldEVkZ2VFbmQockFyYy5lZGdlLCBsU2l0ZSwgclNpdGUsIHZlcnRleCk7XG4gICAgbmV3QXJjLmVkZ2UgPSBkM19nZW9tX3Zvcm9ub2lDcmVhdGVFZGdlKGxTaXRlLCBzaXRlLCBudWxsLCB2ZXJ0ZXgpO1xuICAgIHJBcmMuZWRnZSA9IGQzX2dlb21fdm9yb25vaUNyZWF0ZUVkZ2Uoc2l0ZSwgclNpdGUsIG51bGwsIHZlcnRleCk7XG4gICAgZDNfZ2VvbV92b3Jvbm9pQXR0YWNoQ2lyY2xlKGxBcmMpO1xuICAgIGQzX2dlb21fdm9yb25vaUF0dGFjaENpcmNsZShyQXJjKTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3Zvcm9ub2lMZWZ0QnJlYWtQb2ludChhcmMsIGRpcmVjdHJpeCkge1xuICAgIHZhciBzaXRlID0gYXJjLnNpdGUsIHJmb2N4ID0gc2l0ZS54LCByZm9jeSA9IHNpdGUueSwgcGJ5MiA9IHJmb2N5IC0gZGlyZWN0cml4O1xuICAgIGlmICghcGJ5MikgcmV0dXJuIHJmb2N4O1xuICAgIHZhciBsQXJjID0gYXJjLlA7XG4gICAgaWYgKCFsQXJjKSByZXR1cm4gLUluZmluaXR5O1xuICAgIHNpdGUgPSBsQXJjLnNpdGU7XG4gICAgdmFyIGxmb2N4ID0gc2l0ZS54LCBsZm9jeSA9IHNpdGUueSwgcGxieTIgPSBsZm9jeSAtIGRpcmVjdHJpeDtcbiAgICBpZiAoIXBsYnkyKSByZXR1cm4gbGZvY3g7XG4gICAgdmFyIGhsID0gbGZvY3ggLSByZm9jeCwgYWJ5MiA9IDEgLyBwYnkyIC0gMSAvIHBsYnkyLCBiID0gaGwgLyBwbGJ5MjtcbiAgICBpZiAoYWJ5MikgcmV0dXJuICgtYiArIE1hdGguc3FydChiICogYiAtIDIgKiBhYnkyICogKGhsICogaGwgLyAoLTIgKiBwbGJ5MikgLSBsZm9jeSArIHBsYnkyIC8gMiArIHJmb2N5IC0gcGJ5MiAvIDIpKSkgLyBhYnkyICsgcmZvY3g7XG4gICAgcmV0dXJuIChyZm9jeCArIGxmb2N4KSAvIDI7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvbV92b3Jvbm9pUmlnaHRCcmVha1BvaW50KGFyYywgZGlyZWN0cml4KSB7XG4gICAgdmFyIHJBcmMgPSBhcmMuTjtcbiAgICBpZiAockFyYykgcmV0dXJuIGQzX2dlb21fdm9yb25vaUxlZnRCcmVha1BvaW50KHJBcmMsIGRpcmVjdHJpeCk7XG4gICAgdmFyIHNpdGUgPSBhcmMuc2l0ZTtcbiAgICByZXR1cm4gc2l0ZS55ID09PSBkaXJlY3RyaXggPyBzaXRlLnggOiBJbmZpbml0eTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3Zvcm9ub2lDZWxsKHNpdGUpIHtcbiAgICB0aGlzLnNpdGUgPSBzaXRlO1xuICAgIHRoaXMuZWRnZXMgPSBbXTtcbiAgfVxuICBkM19nZW9tX3Zvcm9ub2lDZWxsLnByb3RvdHlwZS5wcmVwYXJlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGhhbGZFZGdlcyA9IHRoaXMuZWRnZXMsIGlIYWxmRWRnZSA9IGhhbGZFZGdlcy5sZW5ndGgsIGVkZ2U7XG4gICAgd2hpbGUgKGlIYWxmRWRnZS0tKSB7XG4gICAgICBlZGdlID0gaGFsZkVkZ2VzW2lIYWxmRWRnZV0uZWRnZTtcbiAgICAgIGlmICghZWRnZS5iIHx8ICFlZGdlLmEpIGhhbGZFZGdlcy5zcGxpY2UoaUhhbGZFZGdlLCAxKTtcbiAgICB9XG4gICAgaGFsZkVkZ2VzLnNvcnQoZDNfZ2VvbV92b3Jvbm9pSGFsZkVkZ2VPcmRlcik7XG4gICAgcmV0dXJuIGhhbGZFZGdlcy5sZW5ndGg7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2dlb21fdm9yb25vaUNsb3NlQ2VsbHMoZXh0ZW50KSB7XG4gICAgdmFyIHgwID0gZXh0ZW50WzBdWzBdLCB4MSA9IGV4dGVudFsxXVswXSwgeTAgPSBleHRlbnRbMF1bMV0sIHkxID0gZXh0ZW50WzFdWzFdLCB4MiwgeTIsIHgzLCB5MywgY2VsbHMgPSBkM19nZW9tX3Zvcm9ub2lDZWxscywgaUNlbGwgPSBjZWxscy5sZW5ndGgsIGNlbGwsIGlIYWxmRWRnZSwgaGFsZkVkZ2VzLCBuSGFsZkVkZ2VzLCBzdGFydCwgZW5kO1xuICAgIHdoaWxlIChpQ2VsbC0tKSB7XG4gICAgICBjZWxsID0gY2VsbHNbaUNlbGxdO1xuICAgICAgaWYgKCFjZWxsIHx8ICFjZWxsLnByZXBhcmUoKSkgY29udGludWU7XG4gICAgICBoYWxmRWRnZXMgPSBjZWxsLmVkZ2VzO1xuICAgICAgbkhhbGZFZGdlcyA9IGhhbGZFZGdlcy5sZW5ndGg7XG4gICAgICBpSGFsZkVkZ2UgPSAwO1xuICAgICAgd2hpbGUgKGlIYWxmRWRnZSA8IG5IYWxmRWRnZXMpIHtcbiAgICAgICAgZW5kID0gaGFsZkVkZ2VzW2lIYWxmRWRnZV0uZW5kKCksIHgzID0gZW5kLngsIHkzID0gZW5kLnk7XG4gICAgICAgIHN0YXJ0ID0gaGFsZkVkZ2VzWysraUhhbGZFZGdlICUgbkhhbGZFZGdlc10uc3RhcnQoKSwgeDIgPSBzdGFydC54LCB5MiA9IHN0YXJ0Lnk7XG4gICAgICAgIGlmIChhYnMoeDMgLSB4MikgPiDOtSB8fCBhYnMoeTMgLSB5MikgPiDOtSkge1xuICAgICAgICAgIGhhbGZFZGdlcy5zcGxpY2UoaUhhbGZFZGdlLCAwLCBuZXcgZDNfZ2VvbV92b3Jvbm9pSGFsZkVkZ2UoZDNfZ2VvbV92b3Jvbm9pQ3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIGVuZCwgYWJzKHgzIC0geDApIDwgzrUgJiYgeTEgLSB5MyA+IM61ID8ge1xuICAgICAgICAgICAgeDogeDAsXG4gICAgICAgICAgICB5OiBhYnMoeDIgLSB4MCkgPCDOtSA/IHkyIDogeTFcbiAgICAgICAgICB9IDogYWJzKHkzIC0geTEpIDwgzrUgJiYgeDEgLSB4MyA+IM61ID8ge1xuICAgICAgICAgICAgeDogYWJzKHkyIC0geTEpIDwgzrUgPyB4MiA6IHgxLFxuICAgICAgICAgICAgeTogeTFcbiAgICAgICAgICB9IDogYWJzKHgzIC0geDEpIDwgzrUgJiYgeTMgLSB5MCA+IM61ID8ge1xuICAgICAgICAgICAgeDogeDEsXG4gICAgICAgICAgICB5OiBhYnMoeDIgLSB4MSkgPCDOtSA/IHkyIDogeTBcbiAgICAgICAgICB9IDogYWJzKHkzIC0geTApIDwgzrUgJiYgeDMgLSB4MCA+IM61ID8ge1xuICAgICAgICAgICAgeDogYWJzKHkyIC0geTApIDwgzrUgPyB4MiA6IHgwLFxuICAgICAgICAgICAgeTogeTBcbiAgICAgICAgICB9IDogbnVsbCksIGNlbGwuc2l0ZSwgbnVsbCkpO1xuICAgICAgICAgICsrbkhhbGZFZGdlcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3Zvcm9ub2lIYWxmRWRnZU9yZGVyKGEsIGIpIHtcbiAgICByZXR1cm4gYi5hbmdsZSAtIGEuYW5nbGU7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvbV92b3Jvbm9pQ2lyY2xlKCkge1xuICAgIGQzX2dlb21fdm9yb25vaVJlZEJsYWNrTm9kZSh0aGlzKTtcbiAgICB0aGlzLnggPSB0aGlzLnkgPSB0aGlzLmFyYyA9IHRoaXMuc2l0ZSA9IHRoaXMuY3kgPSBudWxsO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb21fdm9yb25vaUF0dGFjaENpcmNsZShhcmMpIHtcbiAgICB2YXIgbEFyYyA9IGFyYy5QLCByQXJjID0gYXJjLk47XG4gICAgaWYgKCFsQXJjIHx8ICFyQXJjKSByZXR1cm47XG4gICAgdmFyIGxTaXRlID0gbEFyYy5zaXRlLCBjU2l0ZSA9IGFyYy5zaXRlLCByU2l0ZSA9IHJBcmMuc2l0ZTtcbiAgICBpZiAobFNpdGUgPT09IHJTaXRlKSByZXR1cm47XG4gICAgdmFyIGJ4ID0gY1NpdGUueCwgYnkgPSBjU2l0ZS55LCBheCA9IGxTaXRlLnggLSBieCwgYXkgPSBsU2l0ZS55IC0gYnksIGN4ID0gclNpdGUueCAtIGJ4LCBjeSA9IHJTaXRlLnkgLSBieTtcbiAgICB2YXIgZCA9IDIgKiAoYXggKiBjeSAtIGF5ICogY3gpO1xuICAgIGlmIChkID49IC3OtTIpIHJldHVybjtcbiAgICB2YXIgaGEgPSBheCAqIGF4ICsgYXkgKiBheSwgaGMgPSBjeCAqIGN4ICsgY3kgKiBjeSwgeCA9IChjeSAqIGhhIC0gYXkgKiBoYykgLyBkLCB5ID0gKGF4ICogaGMgLSBjeCAqIGhhKSAvIGQsIGN5ID0geSArIGJ5O1xuICAgIHZhciBjaXJjbGUgPSBkM19nZW9tX3Zvcm9ub2lDaXJjbGVQb29sLnBvcCgpIHx8IG5ldyBkM19nZW9tX3Zvcm9ub2lDaXJjbGUoKTtcbiAgICBjaXJjbGUuYXJjID0gYXJjO1xuICAgIGNpcmNsZS5zaXRlID0gY1NpdGU7XG4gICAgY2lyY2xlLnggPSB4ICsgYng7XG4gICAgY2lyY2xlLnkgPSBjeSArIE1hdGguc3FydCh4ICogeCArIHkgKiB5KTtcbiAgICBjaXJjbGUuY3kgPSBjeTtcbiAgICBhcmMuY2lyY2xlID0gY2lyY2xlO1xuICAgIHZhciBiZWZvcmUgPSBudWxsLCBub2RlID0gZDNfZ2VvbV92b3Jvbm9pQ2lyY2xlcy5fO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBpZiAoY2lyY2xlLnkgPCBub2RlLnkgfHwgY2lyY2xlLnkgPT09IG5vZGUueSAmJiBjaXJjbGUueCA8PSBub2RlLngpIHtcbiAgICAgICAgaWYgKG5vZGUuTCkgbm9kZSA9IG5vZGUuTDsgZWxzZSB7XG4gICAgICAgICAgYmVmb3JlID0gbm9kZS5QO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobm9kZS5SKSBub2RlID0gbm9kZS5SOyBlbHNlIHtcbiAgICAgICAgICBiZWZvcmUgPSBub2RlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGQzX2dlb21fdm9yb25vaUNpcmNsZXMuaW5zZXJ0KGJlZm9yZSwgY2lyY2xlKTtcbiAgICBpZiAoIWJlZm9yZSkgZDNfZ2VvbV92b3Jvbm9pRmlyc3RDaXJjbGUgPSBjaXJjbGU7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvbV92b3Jvbm9pRGV0YWNoQ2lyY2xlKGFyYykge1xuICAgIHZhciBjaXJjbGUgPSBhcmMuY2lyY2xlO1xuICAgIGlmIChjaXJjbGUpIHtcbiAgICAgIGlmICghY2lyY2xlLlApIGQzX2dlb21fdm9yb25vaUZpcnN0Q2lyY2xlID0gY2lyY2xlLk47XG4gICAgICBkM19nZW9tX3Zvcm9ub2lDaXJjbGVzLnJlbW92ZShjaXJjbGUpO1xuICAgICAgZDNfZ2VvbV92b3Jvbm9pQ2lyY2xlUG9vbC5wdXNoKGNpcmNsZSk7XG4gICAgICBkM19nZW9tX3Zvcm9ub2lSZWRCbGFja05vZGUoY2lyY2xlKTtcbiAgICAgIGFyYy5jaXJjbGUgPSBudWxsO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3Zvcm9ub2lDbGlwRWRnZXMoZXh0ZW50KSB7XG4gICAgdmFyIGVkZ2VzID0gZDNfZ2VvbV92b3Jvbm9pRWRnZXMsIGNsaXAgPSBkM19nZW9tX2NsaXBMaW5lKGV4dGVudFswXVswXSwgZXh0ZW50WzBdWzFdLCBleHRlbnRbMV1bMF0sIGV4dGVudFsxXVsxXSksIGkgPSBlZGdlcy5sZW5ndGgsIGU7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgZSA9IGVkZ2VzW2ldO1xuICAgICAgaWYgKCFkM19nZW9tX3Zvcm9ub2lDb25uZWN0RWRnZShlLCBleHRlbnQpIHx8ICFjbGlwKGUpIHx8IGFicyhlLmEueCAtIGUuYi54KSA8IM61ICYmIGFicyhlLmEueSAtIGUuYi55KSA8IM61KSB7XG4gICAgICAgIGUuYSA9IGUuYiA9IG51bGw7XG4gICAgICAgIGVkZ2VzLnNwbGljZShpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvbV92b3Jvbm9pQ29ubmVjdEVkZ2UoZWRnZSwgZXh0ZW50KSB7XG4gICAgdmFyIHZiID0gZWRnZS5iO1xuICAgIGlmICh2YikgcmV0dXJuIHRydWU7XG4gICAgdmFyIHZhID0gZWRnZS5hLCB4MCA9IGV4dGVudFswXVswXSwgeDEgPSBleHRlbnRbMV1bMF0sIHkwID0gZXh0ZW50WzBdWzFdLCB5MSA9IGV4dGVudFsxXVsxXSwgbFNpdGUgPSBlZGdlLmwsIHJTaXRlID0gZWRnZS5yLCBseCA9IGxTaXRlLngsIGx5ID0gbFNpdGUueSwgcnggPSByU2l0ZS54LCByeSA9IHJTaXRlLnksIGZ4ID0gKGx4ICsgcngpIC8gMiwgZnkgPSAobHkgKyByeSkgLyAyLCBmbSwgZmI7XG4gICAgaWYgKHJ5ID09PSBseSkge1xuICAgICAgaWYgKGZ4IDwgeDAgfHwgZnggPj0geDEpIHJldHVybjtcbiAgICAgIGlmIChseCA+IHJ4KSB7XG4gICAgICAgIGlmICghdmEpIHZhID0ge1xuICAgICAgICAgIHg6IGZ4LFxuICAgICAgICAgIHk6IHkwXG4gICAgICAgIH07IGVsc2UgaWYgKHZhLnkgPj0geTEpIHJldHVybjtcbiAgICAgICAgdmIgPSB7XG4gICAgICAgICAgeDogZngsXG4gICAgICAgICAgeTogeTFcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghdmEpIHZhID0ge1xuICAgICAgICAgIHg6IGZ4LFxuICAgICAgICAgIHk6IHkxXG4gICAgICAgIH07IGVsc2UgaWYgKHZhLnkgPCB5MCkgcmV0dXJuO1xuICAgICAgICB2YiA9IHtcbiAgICAgICAgICB4OiBmeCxcbiAgICAgICAgICB5OiB5MFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmbSA9IChseCAtIHJ4KSAvIChyeSAtIGx5KTtcbiAgICAgIGZiID0gZnkgLSBmbSAqIGZ4O1xuICAgICAgaWYgKGZtIDwgLTEgfHwgZm0gPiAxKSB7XG4gICAgICAgIGlmIChseCA+IHJ4KSB7XG4gICAgICAgICAgaWYgKCF2YSkgdmEgPSB7XG4gICAgICAgICAgICB4OiAoeTAgLSBmYikgLyBmbSxcbiAgICAgICAgICAgIHk6IHkwXG4gICAgICAgICAgfTsgZWxzZSBpZiAodmEueSA+PSB5MSkgcmV0dXJuO1xuICAgICAgICAgIHZiID0ge1xuICAgICAgICAgICAgeDogKHkxIC0gZmIpIC8gZm0sXG4gICAgICAgICAgICB5OiB5MVxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCF2YSkgdmEgPSB7XG4gICAgICAgICAgICB4OiAoeTEgLSBmYikgLyBmbSxcbiAgICAgICAgICAgIHk6IHkxXG4gICAgICAgICAgfTsgZWxzZSBpZiAodmEueSA8IHkwKSByZXR1cm47XG4gICAgICAgICAgdmIgPSB7XG4gICAgICAgICAgICB4OiAoeTAgLSBmYikgLyBmbSxcbiAgICAgICAgICAgIHk6IHkwXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGx5IDwgcnkpIHtcbiAgICAgICAgICBpZiAoIXZhKSB2YSA9IHtcbiAgICAgICAgICAgIHg6IHgwLFxuICAgICAgICAgICAgeTogZm0gKiB4MCArIGZiXG4gICAgICAgICAgfTsgZWxzZSBpZiAodmEueCA+PSB4MSkgcmV0dXJuO1xuICAgICAgICAgIHZiID0ge1xuICAgICAgICAgICAgeDogeDEsXG4gICAgICAgICAgICB5OiBmbSAqIHgxICsgZmJcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghdmEpIHZhID0ge1xuICAgICAgICAgICAgeDogeDEsXG4gICAgICAgICAgICB5OiBmbSAqIHgxICsgZmJcbiAgICAgICAgICB9OyBlbHNlIGlmICh2YS54IDwgeDApIHJldHVybjtcbiAgICAgICAgICB2YiA9IHtcbiAgICAgICAgICAgIHg6IHgwLFxuICAgICAgICAgICAgeTogZm0gKiB4MCArIGZiXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlZGdlLmEgPSB2YTtcbiAgICBlZGdlLmIgPSB2YjtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3Zvcm9ub2lFZGdlKGxTaXRlLCByU2l0ZSkge1xuICAgIHRoaXMubCA9IGxTaXRlO1xuICAgIHRoaXMuciA9IHJTaXRlO1xuICAgIHRoaXMuYSA9IHRoaXMuYiA9IG51bGw7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvbV92b3Jvbm9pQ3JlYXRlRWRnZShsU2l0ZSwgclNpdGUsIHZhLCB2Yikge1xuICAgIHZhciBlZGdlID0gbmV3IGQzX2dlb21fdm9yb25vaUVkZ2UobFNpdGUsIHJTaXRlKTtcbiAgICBkM19nZW9tX3Zvcm9ub2lFZGdlcy5wdXNoKGVkZ2UpO1xuICAgIGlmICh2YSkgZDNfZ2VvbV92b3Jvbm9pU2V0RWRnZUVuZChlZGdlLCBsU2l0ZSwgclNpdGUsIHZhKTtcbiAgICBpZiAodmIpIGQzX2dlb21fdm9yb25vaVNldEVkZ2VFbmQoZWRnZSwgclNpdGUsIGxTaXRlLCB2Yik7XG4gICAgZDNfZ2VvbV92b3Jvbm9pQ2VsbHNbbFNpdGUuaV0uZWRnZXMucHVzaChuZXcgZDNfZ2VvbV92b3Jvbm9pSGFsZkVkZ2UoZWRnZSwgbFNpdGUsIHJTaXRlKSk7XG4gICAgZDNfZ2VvbV92b3Jvbm9pQ2VsbHNbclNpdGUuaV0uZWRnZXMucHVzaChuZXcgZDNfZ2VvbV92b3Jvbm9pSGFsZkVkZ2UoZWRnZSwgclNpdGUsIGxTaXRlKSk7XG4gICAgcmV0dXJuIGVkZ2U7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZ2VvbV92b3Jvbm9pQ3JlYXRlQm9yZGVyRWRnZShsU2l0ZSwgdmEsIHZiKSB7XG4gICAgdmFyIGVkZ2UgPSBuZXcgZDNfZ2VvbV92b3Jvbm9pRWRnZShsU2l0ZSwgbnVsbCk7XG4gICAgZWRnZS5hID0gdmE7XG4gICAgZWRnZS5iID0gdmI7XG4gICAgZDNfZ2VvbV92b3Jvbm9pRWRnZXMucHVzaChlZGdlKTtcbiAgICByZXR1cm4gZWRnZTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3Zvcm9ub2lTZXRFZGdlRW5kKGVkZ2UsIGxTaXRlLCByU2l0ZSwgdmVydGV4KSB7XG4gICAgaWYgKCFlZGdlLmEgJiYgIWVkZ2UuYikge1xuICAgICAgZWRnZS5hID0gdmVydGV4O1xuICAgICAgZWRnZS5sID0gbFNpdGU7XG4gICAgICBlZGdlLnIgPSByU2l0ZTtcbiAgICB9IGVsc2UgaWYgKGVkZ2UubCA9PT0gclNpdGUpIHtcbiAgICAgIGVkZ2UuYiA9IHZlcnRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgZWRnZS5hID0gdmVydGV4O1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3Zvcm9ub2lIYWxmRWRnZShlZGdlLCBsU2l0ZSwgclNpdGUpIHtcbiAgICB2YXIgdmEgPSBlZGdlLmEsIHZiID0gZWRnZS5iO1xuICAgIHRoaXMuZWRnZSA9IGVkZ2U7XG4gICAgdGhpcy5zaXRlID0gbFNpdGU7XG4gICAgdGhpcy5hbmdsZSA9IHJTaXRlID8gTWF0aC5hdGFuMihyU2l0ZS55IC0gbFNpdGUueSwgclNpdGUueCAtIGxTaXRlLngpIDogZWRnZS5sID09PSBsU2l0ZSA/IE1hdGguYXRhbjIodmIueCAtIHZhLngsIHZhLnkgLSB2Yi55KSA6IE1hdGguYXRhbjIodmEueCAtIHZiLngsIHZiLnkgLSB2YS55KTtcbiAgfVxuICBkM19nZW9tX3Zvcm9ub2lIYWxmRWRnZS5wcm90b3R5cGUgPSB7XG4gICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZWRnZS5sID09PSB0aGlzLnNpdGUgPyB0aGlzLmVkZ2UuYSA6IHRoaXMuZWRnZS5iO1xuICAgIH0sXG4gICAgZW5kOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmVkZ2UubCA9PT0gdGhpcy5zaXRlID8gdGhpcy5lZGdlLmIgOiB0aGlzLmVkZ2UuYTtcbiAgICB9XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2dlb21fdm9yb25vaVJlZEJsYWNrVHJlZSgpIHtcbiAgICB0aGlzLl8gPSBudWxsO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb21fdm9yb25vaVJlZEJsYWNrTm9kZShub2RlKSB7XG4gICAgbm9kZS5VID0gbm9kZS5DID0gbm9kZS5MID0gbm9kZS5SID0gbm9kZS5QID0gbm9kZS5OID0gbnVsbDtcbiAgfVxuICBkM19nZW9tX3Zvcm9ub2lSZWRCbGFja1RyZWUucHJvdG90eXBlID0ge1xuICAgIGluc2VydDogZnVuY3Rpb24oYWZ0ZXIsIG5vZGUpIHtcbiAgICAgIHZhciBwYXJlbnQsIGdyYW5kcGEsIHVuY2xlO1xuICAgICAgaWYgKGFmdGVyKSB7XG4gICAgICAgIG5vZGUuUCA9IGFmdGVyO1xuICAgICAgICBub2RlLk4gPSBhZnRlci5OO1xuICAgICAgICBpZiAoYWZ0ZXIuTikgYWZ0ZXIuTi5QID0gbm9kZTtcbiAgICAgICAgYWZ0ZXIuTiA9IG5vZGU7XG4gICAgICAgIGlmIChhZnRlci5SKSB7XG4gICAgICAgICAgYWZ0ZXIgPSBhZnRlci5SO1xuICAgICAgICAgIHdoaWxlIChhZnRlci5MKSBhZnRlciA9IGFmdGVyLkw7XG4gICAgICAgICAgYWZ0ZXIuTCA9IG5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWZ0ZXIuUiA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50ID0gYWZ0ZXI7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuXykge1xuICAgICAgICBhZnRlciA9IGQzX2dlb21fdm9yb25vaVJlZEJsYWNrRmlyc3QodGhpcy5fKTtcbiAgICAgICAgbm9kZS5QID0gbnVsbDtcbiAgICAgICAgbm9kZS5OID0gYWZ0ZXI7XG4gICAgICAgIGFmdGVyLlAgPSBhZnRlci5MID0gbm9kZTtcbiAgICAgICAgcGFyZW50ID0gYWZ0ZXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub2RlLlAgPSBub2RlLk4gPSBudWxsO1xuICAgICAgICB0aGlzLl8gPSBub2RlO1xuICAgICAgICBwYXJlbnQgPSBudWxsO1xuICAgICAgfVxuICAgICAgbm9kZS5MID0gbm9kZS5SID0gbnVsbDtcbiAgICAgIG5vZGUuVSA9IHBhcmVudDtcbiAgICAgIG5vZGUuQyA9IHRydWU7XG4gICAgICBhZnRlciA9IG5vZGU7XG4gICAgICB3aGlsZSAocGFyZW50ICYmIHBhcmVudC5DKSB7XG4gICAgICAgIGdyYW5kcGEgPSBwYXJlbnQuVTtcbiAgICAgICAgaWYgKHBhcmVudCA9PT0gZ3JhbmRwYS5MKSB7XG4gICAgICAgICAgdW5jbGUgPSBncmFuZHBhLlI7XG4gICAgICAgICAgaWYgKHVuY2xlICYmIHVuY2xlLkMpIHtcbiAgICAgICAgICAgIHBhcmVudC5DID0gdW5jbGUuQyA9IGZhbHNlO1xuICAgICAgICAgICAgZ3JhbmRwYS5DID0gdHJ1ZTtcbiAgICAgICAgICAgIGFmdGVyID0gZ3JhbmRwYTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGFmdGVyID09PSBwYXJlbnQuUikge1xuICAgICAgICAgICAgICBkM19nZW9tX3Zvcm9ub2lSZWRCbGFja1JvdGF0ZUxlZnQodGhpcywgcGFyZW50KTtcbiAgICAgICAgICAgICAgYWZ0ZXIgPSBwYXJlbnQ7XG4gICAgICAgICAgICAgIHBhcmVudCA9IGFmdGVyLlU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXJlbnQuQyA9IGZhbHNlO1xuICAgICAgICAgICAgZ3JhbmRwYS5DID0gdHJ1ZTtcbiAgICAgICAgICAgIGQzX2dlb21fdm9yb25vaVJlZEJsYWNrUm90YXRlUmlnaHQodGhpcywgZ3JhbmRwYSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVuY2xlID0gZ3JhbmRwYS5MO1xuICAgICAgICAgIGlmICh1bmNsZSAmJiB1bmNsZS5DKSB7XG4gICAgICAgICAgICBwYXJlbnQuQyA9IHVuY2xlLkMgPSBmYWxzZTtcbiAgICAgICAgICAgIGdyYW5kcGEuQyA9IHRydWU7XG4gICAgICAgICAgICBhZnRlciA9IGdyYW5kcGE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChhZnRlciA9PT0gcGFyZW50LkwpIHtcbiAgICAgICAgICAgICAgZDNfZ2VvbV92b3Jvbm9pUmVkQmxhY2tSb3RhdGVSaWdodCh0aGlzLCBwYXJlbnQpO1xuICAgICAgICAgICAgICBhZnRlciA9IHBhcmVudDtcbiAgICAgICAgICAgICAgcGFyZW50ID0gYWZ0ZXIuVTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmVudC5DID0gZmFsc2U7XG4gICAgICAgICAgICBncmFuZHBhLkMgPSB0cnVlO1xuICAgICAgICAgICAgZDNfZ2VvbV92b3Jvbm9pUmVkQmxhY2tSb3RhdGVMZWZ0KHRoaXMsIGdyYW5kcGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwYXJlbnQgPSBhZnRlci5VO1xuICAgICAgfVxuICAgICAgdGhpcy5fLkMgPSBmYWxzZTtcbiAgICB9LFxuICAgIHJlbW92ZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgaWYgKG5vZGUuTikgbm9kZS5OLlAgPSBub2RlLlA7XG4gICAgICBpZiAobm9kZS5QKSBub2RlLlAuTiA9IG5vZGUuTjtcbiAgICAgIG5vZGUuTiA9IG5vZGUuUCA9IG51bGw7XG4gICAgICB2YXIgcGFyZW50ID0gbm9kZS5VLCBzaWJsaW5nLCBsZWZ0ID0gbm9kZS5MLCByaWdodCA9IG5vZGUuUiwgbmV4dCwgcmVkO1xuICAgICAgaWYgKCFsZWZ0KSBuZXh0ID0gcmlnaHQ7IGVsc2UgaWYgKCFyaWdodCkgbmV4dCA9IGxlZnQ7IGVsc2UgbmV4dCA9IGQzX2dlb21fdm9yb25vaVJlZEJsYWNrRmlyc3QocmlnaHQpO1xuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBpZiAocGFyZW50LkwgPT09IG5vZGUpIHBhcmVudC5MID0gbmV4dDsgZWxzZSBwYXJlbnQuUiA9IG5leHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl8gPSBuZXh0O1xuICAgICAgfVxuICAgICAgaWYgKGxlZnQgJiYgcmlnaHQpIHtcbiAgICAgICAgcmVkID0gbmV4dC5DO1xuICAgICAgICBuZXh0LkMgPSBub2RlLkM7XG4gICAgICAgIG5leHQuTCA9IGxlZnQ7XG4gICAgICAgIGxlZnQuVSA9IG5leHQ7XG4gICAgICAgIGlmIChuZXh0ICE9PSByaWdodCkge1xuICAgICAgICAgIHBhcmVudCA9IG5leHQuVTtcbiAgICAgICAgICBuZXh0LlUgPSBub2RlLlU7XG4gICAgICAgICAgbm9kZSA9IG5leHQuUjtcbiAgICAgICAgICBwYXJlbnQuTCA9IG5vZGU7XG4gICAgICAgICAgbmV4dC5SID0gcmlnaHQ7XG4gICAgICAgICAgcmlnaHQuVSA9IG5leHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV4dC5VID0gcGFyZW50O1xuICAgICAgICAgIHBhcmVudCA9IG5leHQ7XG4gICAgICAgICAgbm9kZSA9IG5leHQuUjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVkID0gbm9kZS5DO1xuICAgICAgICBub2RlID0gbmV4dDtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlKSBub2RlLlUgPSBwYXJlbnQ7XG4gICAgICBpZiAocmVkKSByZXR1cm47XG4gICAgICBpZiAobm9kZSAmJiBub2RlLkMpIHtcbiAgICAgICAgbm9kZS5DID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGRvIHtcbiAgICAgICAgaWYgKG5vZGUgPT09IHRoaXMuXykgYnJlYWs7XG4gICAgICAgIGlmIChub2RlID09PSBwYXJlbnQuTCkge1xuICAgICAgICAgIHNpYmxpbmcgPSBwYXJlbnQuUjtcbiAgICAgICAgICBpZiAoc2libGluZy5DKSB7XG4gICAgICAgICAgICBzaWJsaW5nLkMgPSBmYWxzZTtcbiAgICAgICAgICAgIHBhcmVudC5DID0gdHJ1ZTtcbiAgICAgICAgICAgIGQzX2dlb21fdm9yb25vaVJlZEJsYWNrUm90YXRlTGVmdCh0aGlzLCBwYXJlbnQpO1xuICAgICAgICAgICAgc2libGluZyA9IHBhcmVudC5SO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2libGluZy5MICYmIHNpYmxpbmcuTC5DIHx8IHNpYmxpbmcuUiAmJiBzaWJsaW5nLlIuQykge1xuICAgICAgICAgICAgaWYgKCFzaWJsaW5nLlIgfHwgIXNpYmxpbmcuUi5DKSB7XG4gICAgICAgICAgICAgIHNpYmxpbmcuTC5DID0gZmFsc2U7XG4gICAgICAgICAgICAgIHNpYmxpbmcuQyA9IHRydWU7XG4gICAgICAgICAgICAgIGQzX2dlb21fdm9yb25vaVJlZEJsYWNrUm90YXRlUmlnaHQodGhpcywgc2libGluZyk7XG4gICAgICAgICAgICAgIHNpYmxpbmcgPSBwYXJlbnQuUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNpYmxpbmcuQyA9IHBhcmVudC5DO1xuICAgICAgICAgICAgcGFyZW50LkMgPSBzaWJsaW5nLlIuQyA9IGZhbHNlO1xuICAgICAgICAgICAgZDNfZ2VvbV92b3Jvbm9pUmVkQmxhY2tSb3RhdGVMZWZ0KHRoaXMsIHBhcmVudCk7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5fO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNpYmxpbmcgPSBwYXJlbnQuTDtcbiAgICAgICAgICBpZiAoc2libGluZy5DKSB7XG4gICAgICAgICAgICBzaWJsaW5nLkMgPSBmYWxzZTtcbiAgICAgICAgICAgIHBhcmVudC5DID0gdHJ1ZTtcbiAgICAgICAgICAgIGQzX2dlb21fdm9yb25vaVJlZEJsYWNrUm90YXRlUmlnaHQodGhpcywgcGFyZW50KTtcbiAgICAgICAgICAgIHNpYmxpbmcgPSBwYXJlbnQuTDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHNpYmxpbmcuTCAmJiBzaWJsaW5nLkwuQyB8fCBzaWJsaW5nLlIgJiYgc2libGluZy5SLkMpIHtcbiAgICAgICAgICAgIGlmICghc2libGluZy5MIHx8ICFzaWJsaW5nLkwuQykge1xuICAgICAgICAgICAgICBzaWJsaW5nLlIuQyA9IGZhbHNlO1xuICAgICAgICAgICAgICBzaWJsaW5nLkMgPSB0cnVlO1xuICAgICAgICAgICAgICBkM19nZW9tX3Zvcm9ub2lSZWRCbGFja1JvdGF0ZUxlZnQodGhpcywgc2libGluZyk7XG4gICAgICAgICAgICAgIHNpYmxpbmcgPSBwYXJlbnQuTDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNpYmxpbmcuQyA9IHBhcmVudC5DO1xuICAgICAgICAgICAgcGFyZW50LkMgPSBzaWJsaW5nLkwuQyA9IGZhbHNlO1xuICAgICAgICAgICAgZDNfZ2VvbV92b3Jvbm9pUmVkQmxhY2tSb3RhdGVSaWdodCh0aGlzLCBwYXJlbnQpO1xuICAgICAgICAgICAgbm9kZSA9IHRoaXMuXztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzaWJsaW5nLkMgPSB0cnVlO1xuICAgICAgICBub2RlID0gcGFyZW50O1xuICAgICAgICBwYXJlbnQgPSBwYXJlbnQuVTtcbiAgICAgIH0gd2hpbGUgKCFub2RlLkMpO1xuICAgICAgaWYgKG5vZGUpIG5vZGUuQyA9IGZhbHNlO1xuICAgIH1cbiAgfTtcbiAgZnVuY3Rpb24gZDNfZ2VvbV92b3Jvbm9pUmVkQmxhY2tSb3RhdGVMZWZ0KHRyZWUsIG5vZGUpIHtcbiAgICB2YXIgcCA9IG5vZGUsIHEgPSBub2RlLlIsIHBhcmVudCA9IHAuVTtcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBpZiAocGFyZW50LkwgPT09IHApIHBhcmVudC5MID0gcTsgZWxzZSBwYXJlbnQuUiA9IHE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyZWUuXyA9IHE7XG4gICAgfVxuICAgIHEuVSA9IHBhcmVudDtcbiAgICBwLlUgPSBxO1xuICAgIHAuUiA9IHEuTDtcbiAgICBpZiAocC5SKSBwLlIuVSA9IHA7XG4gICAgcS5MID0gcDtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3Zvcm9ub2lSZWRCbGFja1JvdGF0ZVJpZ2h0KHRyZWUsIG5vZGUpIHtcbiAgICB2YXIgcCA9IG5vZGUsIHEgPSBub2RlLkwsIHBhcmVudCA9IHAuVTtcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBpZiAocGFyZW50LkwgPT09IHApIHBhcmVudC5MID0gcTsgZWxzZSBwYXJlbnQuUiA9IHE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyZWUuXyA9IHE7XG4gICAgfVxuICAgIHEuVSA9IHBhcmVudDtcbiAgICBwLlUgPSBxO1xuICAgIHAuTCA9IHEuUjtcbiAgICBpZiAocC5MKSBwLkwuVSA9IHA7XG4gICAgcS5SID0gcDtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3Zvcm9ub2lSZWRCbGFja0ZpcnN0KG5vZGUpIHtcbiAgICB3aGlsZSAobm9kZS5MKSBub2RlID0gbm9kZS5MO1xuICAgIHJldHVybiBub2RlO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb21fdm9yb25vaShzaXRlcywgYmJveCkge1xuICAgIHZhciBzaXRlID0gc2l0ZXMuc29ydChkM19nZW9tX3Zvcm9ub2lWZXJ0ZXhPcmRlcikucG9wKCksIHgwLCB5MCwgY2lyY2xlO1xuICAgIGQzX2dlb21fdm9yb25vaUVkZ2VzID0gW107XG4gICAgZDNfZ2VvbV92b3Jvbm9pQ2VsbHMgPSBuZXcgQXJyYXkoc2l0ZXMubGVuZ3RoKTtcbiAgICBkM19nZW9tX3Zvcm9ub2lCZWFjaGVzID0gbmV3IGQzX2dlb21fdm9yb25vaVJlZEJsYWNrVHJlZSgpO1xuICAgIGQzX2dlb21fdm9yb25vaUNpcmNsZXMgPSBuZXcgZDNfZ2VvbV92b3Jvbm9pUmVkQmxhY2tUcmVlKCk7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNpcmNsZSA9IGQzX2dlb21fdm9yb25vaUZpcnN0Q2lyY2xlO1xuICAgICAgaWYgKHNpdGUgJiYgKCFjaXJjbGUgfHwgc2l0ZS55IDwgY2lyY2xlLnkgfHwgc2l0ZS55ID09PSBjaXJjbGUueSAmJiBzaXRlLnggPCBjaXJjbGUueCkpIHtcbiAgICAgICAgaWYgKHNpdGUueCAhPT0geDAgfHwgc2l0ZS55ICE9PSB5MCkge1xuICAgICAgICAgIGQzX2dlb21fdm9yb25vaUNlbGxzW3NpdGUuaV0gPSBuZXcgZDNfZ2VvbV92b3Jvbm9pQ2VsbChzaXRlKTtcbiAgICAgICAgICBkM19nZW9tX3Zvcm9ub2lBZGRCZWFjaChzaXRlKTtcbiAgICAgICAgICB4MCA9IHNpdGUueCwgeTAgPSBzaXRlLnk7XG4gICAgICAgIH1cbiAgICAgICAgc2l0ZSA9IHNpdGVzLnBvcCgpO1xuICAgICAgfSBlbHNlIGlmIChjaXJjbGUpIHtcbiAgICAgICAgZDNfZ2VvbV92b3Jvbm9pUmVtb3ZlQmVhY2goY2lyY2xlLmFyYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGJib3gpIGQzX2dlb21fdm9yb25vaUNsaXBFZGdlcyhiYm94KSwgZDNfZ2VvbV92b3Jvbm9pQ2xvc2VDZWxscyhiYm94KTtcbiAgICB2YXIgZGlhZ3JhbSA9IHtcbiAgICAgIGNlbGxzOiBkM19nZW9tX3Zvcm9ub2lDZWxscyxcbiAgICAgIGVkZ2VzOiBkM19nZW9tX3Zvcm9ub2lFZGdlc1xuICAgIH07XG4gICAgZDNfZ2VvbV92b3Jvbm9pQmVhY2hlcyA9IGQzX2dlb21fdm9yb25vaUNpcmNsZXMgPSBkM19nZW9tX3Zvcm9ub2lFZGdlcyA9IGQzX2dlb21fdm9yb25vaUNlbGxzID0gbnVsbDtcbiAgICByZXR1cm4gZGlhZ3JhbTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3Zvcm9ub2lWZXJ0ZXhPcmRlcihhLCBiKSB7XG4gICAgcmV0dXJuIGIueSAtIGEueSB8fCBiLnggLSBhLng7XG4gIH1cbiAgZDMuZ2VvbS52b3Jvbm9pID0gZnVuY3Rpb24ocG9pbnRzKSB7XG4gICAgdmFyIHggPSBkM19nZW9tX3BvaW50WCwgeSA9IGQzX2dlb21fcG9pbnRZLCBmeCA9IHgsIGZ5ID0geSwgY2xpcEV4dGVudCA9IGQzX2dlb21fdm9yb25vaUNsaXBFeHRlbnQ7XG4gICAgaWYgKHBvaW50cykgcmV0dXJuIHZvcm9ub2kocG9pbnRzKTtcbiAgICBmdW5jdGlvbiB2b3Jvbm9pKGRhdGEpIHtcbiAgICAgIHZhciBwb2x5Z29ucyA9IG5ldyBBcnJheShkYXRhLmxlbmd0aCksIHgwID0gY2xpcEV4dGVudFswXVswXSwgeTAgPSBjbGlwRXh0ZW50WzBdWzFdLCB4MSA9IGNsaXBFeHRlbnRbMV1bMF0sIHkxID0gY2xpcEV4dGVudFsxXVsxXTtcbiAgICAgIGQzX2dlb21fdm9yb25vaShzaXRlcyhkYXRhKSwgY2xpcEV4dGVudCkuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsLCBpKSB7XG4gICAgICAgIHZhciBlZGdlcyA9IGNlbGwuZWRnZXMsIHNpdGUgPSBjZWxsLnNpdGUsIHBvbHlnb24gPSBwb2x5Z29uc1tpXSA9IGVkZ2VzLmxlbmd0aCA/IGVkZ2VzLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgdmFyIHMgPSBlLnN0YXJ0KCk7XG4gICAgICAgICAgcmV0dXJuIFsgcy54LCBzLnkgXTtcbiAgICAgICAgfSkgOiBzaXRlLnggPj0geDAgJiYgc2l0ZS54IDw9IHgxICYmIHNpdGUueSA+PSB5MCAmJiBzaXRlLnkgPD0geTEgPyBbIFsgeDAsIHkxIF0sIFsgeDEsIHkxIF0sIFsgeDEsIHkwIF0sIFsgeDAsIHkwIF0gXSA6IFtdO1xuICAgICAgICBwb2x5Z29uLnBvaW50ID0gZGF0YVtpXTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHBvbHlnb25zO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzaXRlcyhkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YS5tYXAoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IE1hdGgucm91bmQoZngoZCwgaSkgLyDOtSkgKiDOtSxcbiAgICAgICAgICB5OiBNYXRoLnJvdW5kKGZ5KGQsIGkpIC8gzrUpICogzrUsXG4gICAgICAgICAgaTogaVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfVxuICAgIHZvcm9ub2kubGlua3MgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gZDNfZ2VvbV92b3Jvbm9pKHNpdGVzKGRhdGEpKS5lZGdlcy5maWx0ZXIoZnVuY3Rpb24oZWRnZSkge1xuICAgICAgICByZXR1cm4gZWRnZS5sICYmIGVkZ2UucjtcbiAgICAgIH0pLm1hcChmdW5jdGlvbihlZGdlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc291cmNlOiBkYXRhW2VkZ2UubC5pXSxcbiAgICAgICAgICB0YXJnZXQ6IGRhdGFbZWRnZS5yLmldXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHZvcm9ub2kudHJpYW5nbGVzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIHRyaWFuZ2xlcyA9IFtdO1xuICAgICAgZDNfZ2VvbV92b3Jvbm9pKHNpdGVzKGRhdGEpKS5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwsIGkpIHtcbiAgICAgICAgdmFyIHNpdGUgPSBjZWxsLnNpdGUsIGVkZ2VzID0gY2VsbC5lZGdlcy5zb3J0KGQzX2dlb21fdm9yb25vaUhhbGZFZGdlT3JkZXIpLCBqID0gLTEsIG0gPSBlZGdlcy5sZW5ndGgsIGUwLCBzMCwgZTEgPSBlZGdlc1ttIC0gMV0uZWRnZSwgczEgPSBlMS5sID09PSBzaXRlID8gZTEuciA6IGUxLmw7XG4gICAgICAgIHdoaWxlICgrK2ogPCBtKSB7XG4gICAgICAgICAgZTAgPSBlMTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgIGUxID0gZWRnZXNbal0uZWRnZTtcbiAgICAgICAgICBzMSA9IGUxLmwgPT09IHNpdGUgPyBlMS5yIDogZTEubDtcbiAgICAgICAgICBpZiAoaSA8IHMwLmkgJiYgaSA8IHMxLmkgJiYgZDNfZ2VvbV92b3Jvbm9pVHJpYW5nbGVBcmVhKHNpdGUsIHMwLCBzMSkgPCAwKSB7XG4gICAgICAgICAgICB0cmlhbmdsZXMucHVzaChbIGRhdGFbaV0sIGRhdGFbczAuaV0sIGRhdGFbczEuaV0gXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0cmlhbmdsZXM7XG4gICAgfTtcbiAgICB2b3Jvbm9pLnggPSBmdW5jdGlvbihfKSB7XG4gICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IChmeCA9IGQzX2Z1bmN0b3IoeCA9IF8pLCB2b3Jvbm9pKSA6IHg7XG4gICAgfTtcbiAgICB2b3Jvbm9pLnkgPSBmdW5jdGlvbihfKSB7XG4gICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IChmeSA9IGQzX2Z1bmN0b3IoeSA9IF8pLCB2b3Jvbm9pKSA6IHk7XG4gICAgfTtcbiAgICB2b3Jvbm9pLmNsaXBFeHRlbnQgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBjbGlwRXh0ZW50ID09PSBkM19nZW9tX3Zvcm9ub2lDbGlwRXh0ZW50ID8gbnVsbCA6IGNsaXBFeHRlbnQ7XG4gICAgICBjbGlwRXh0ZW50ID0gXyA9PSBudWxsID8gZDNfZ2VvbV92b3Jvbm9pQ2xpcEV4dGVudCA6IF87XG4gICAgICByZXR1cm4gdm9yb25vaTtcbiAgICB9O1xuICAgIHZvcm9ub2kuc2l6ZSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGNsaXBFeHRlbnQgPT09IGQzX2dlb21fdm9yb25vaUNsaXBFeHRlbnQgPyBudWxsIDogY2xpcEV4dGVudCAmJiBjbGlwRXh0ZW50WzFdO1xuICAgICAgcmV0dXJuIHZvcm9ub2kuY2xpcEV4dGVudChfICYmIFsgWyAwLCAwIF0sIF8gXSk7XG4gICAgfTtcbiAgICByZXR1cm4gdm9yb25vaTtcbiAgfTtcbiAgdmFyIGQzX2dlb21fdm9yb25vaUNsaXBFeHRlbnQgPSBbIFsgLTFlNiwgLTFlNiBdLCBbIDFlNiwgMWU2IF0gXTtcbiAgZnVuY3Rpb24gZDNfZ2VvbV92b3Jvbm9pVHJpYW5nbGVBcmVhKGEsIGIsIGMpIHtcbiAgICByZXR1cm4gKGEueCAtIGMueCkgKiAoYi55IC0gYS55KSAtIChhLnggLSBiLngpICogKGMueSAtIGEueSk7XG4gIH1cbiAgZDMuZ2VvbS5kZWxhdW5heSA9IGZ1bmN0aW9uKHZlcnRpY2VzKSB7XG4gICAgcmV0dXJuIGQzLmdlb20udm9yb25vaSgpLnRyaWFuZ2xlcyh2ZXJ0aWNlcyk7XG4gIH07XG4gIGQzLmdlb20ucXVhZHRyZWUgPSBmdW5jdGlvbihwb2ludHMsIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgdmFyIHggPSBkM19nZW9tX3BvaW50WCwgeSA9IGQzX2dlb21fcG9pbnRZLCBjb21wYXQ7XG4gICAgaWYgKGNvbXBhdCA9IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIHggPSBkM19nZW9tX3F1YWR0cmVlQ29tcGF0WDtcbiAgICAgIHkgPSBkM19nZW9tX3F1YWR0cmVlQ29tcGF0WTtcbiAgICAgIGlmIChjb21wYXQgPT09IDMpIHtcbiAgICAgICAgeTIgPSB5MTtcbiAgICAgICAgeDIgPSB4MTtcbiAgICAgICAgeTEgPSB4MSA9IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gcXVhZHRyZWUocG9pbnRzKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcXVhZHRyZWUoZGF0YSkge1xuICAgICAgdmFyIGQsIGZ4ID0gZDNfZnVuY3Rvcih4KSwgZnkgPSBkM19mdW5jdG9yKHkpLCB4cywgeXMsIGksIG4sIHgxXywgeTFfLCB4Ml8sIHkyXztcbiAgICAgIGlmICh4MSAhPSBudWxsKSB7XG4gICAgICAgIHgxXyA9IHgxLCB5MV8gPSB5MSwgeDJfID0geDIsIHkyXyA9IHkyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgeDJfID0geTJfID0gLSh4MV8gPSB5MV8gPSBJbmZpbml0eSk7XG4gICAgICAgIHhzID0gW10sIHlzID0gW107XG4gICAgICAgIG4gPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgaWYgKGNvbXBhdCkgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGQgPSBkYXRhW2ldO1xuICAgICAgICAgIGlmIChkLnggPCB4MV8pIHgxXyA9IGQueDtcbiAgICAgICAgICBpZiAoZC55IDwgeTFfKSB5MV8gPSBkLnk7XG4gICAgICAgICAgaWYgKGQueCA+IHgyXykgeDJfID0gZC54O1xuICAgICAgICAgIGlmIChkLnkgPiB5Ml8pIHkyXyA9IGQueTtcbiAgICAgICAgICB4cy5wdXNoKGQueCk7XG4gICAgICAgICAgeXMucHVzaChkLnkpO1xuICAgICAgICB9IGVsc2UgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIHZhciB4XyA9ICtmeChkID0gZGF0YVtpXSwgaSksIHlfID0gK2Z5KGQsIGkpO1xuICAgICAgICAgIGlmICh4XyA8IHgxXykgeDFfID0geF87XG4gICAgICAgICAgaWYgKHlfIDwgeTFfKSB5MV8gPSB5XztcbiAgICAgICAgICBpZiAoeF8gPiB4Ml8pIHgyXyA9IHhfO1xuICAgICAgICAgIGlmICh5XyA+IHkyXykgeTJfID0geV87XG4gICAgICAgICAgeHMucHVzaCh4Xyk7XG4gICAgICAgICAgeXMucHVzaCh5Xyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBkeCA9IHgyXyAtIHgxXywgZHkgPSB5Ml8gLSB5MV87XG4gICAgICBpZiAoZHggPiBkeSkgeTJfID0geTFfICsgZHg7IGVsc2UgeDJfID0geDFfICsgZHk7XG4gICAgICBmdW5jdGlvbiBpbnNlcnQobiwgZCwgeCwgeSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgaWYgKGlzTmFOKHgpIHx8IGlzTmFOKHkpKSByZXR1cm47XG4gICAgICAgIGlmIChuLmxlYWYpIHtcbiAgICAgICAgICB2YXIgbnggPSBuLngsIG55ID0gbi55O1xuICAgICAgICAgIGlmIChueCAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAoYWJzKG54IC0geCkgKyBhYnMobnkgLSB5KSA8IC4wMSkge1xuICAgICAgICAgICAgICBpbnNlcnRDaGlsZChuLCBkLCB4LCB5LCB4MSwgeTEsIHgyLCB5Mik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB2YXIgblBvaW50ID0gbi5wb2ludDtcbiAgICAgICAgICAgICAgbi54ID0gbi55ID0gbi5wb2ludCA9IG51bGw7XG4gICAgICAgICAgICAgIGluc2VydENoaWxkKG4sIG5Qb2ludCwgbngsIG55LCB4MSwgeTEsIHgyLCB5Mik7XG4gICAgICAgICAgICAgIGluc2VydENoaWxkKG4sIGQsIHgsIHksIHgxLCB5MSwgeDIsIHkyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbi54ID0geCwgbi55ID0geSwgbi5wb2ludCA9IGQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluc2VydENoaWxkKG4sIGQsIHgsIHksIHgxLCB5MSwgeDIsIHkyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnVuY3Rpb24gaW5zZXJ0Q2hpbGQobiwgZCwgeCwgeSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgdmFyIHhtID0gKHgxICsgeDIpICogLjUsIHltID0gKHkxICsgeTIpICogLjUsIHJpZ2h0ID0geCA+PSB4bSwgYmVsb3cgPSB5ID49IHltLCBpID0gYmVsb3cgPDwgMSB8IHJpZ2h0O1xuICAgICAgICBuLmxlYWYgPSBmYWxzZTtcbiAgICAgICAgbiA9IG4ubm9kZXNbaV0gfHwgKG4ubm9kZXNbaV0gPSBkM19nZW9tX3F1YWR0cmVlTm9kZSgpKTtcbiAgICAgICAgaWYgKHJpZ2h0KSB4MSA9IHhtOyBlbHNlIHgyID0geG07XG4gICAgICAgIGlmIChiZWxvdykgeTEgPSB5bTsgZWxzZSB5MiA9IHltO1xuICAgICAgICBpbnNlcnQobiwgZCwgeCwgeSwgeDEsIHkxLCB4MiwgeTIpO1xuICAgICAgfVxuICAgICAgdmFyIHJvb3QgPSBkM19nZW9tX3F1YWR0cmVlTm9kZSgpO1xuICAgICAgcm9vdC5hZGQgPSBmdW5jdGlvbihkKSB7XG4gICAgICAgIGluc2VydChyb290LCBkLCArZngoZCwgKytpKSwgK2Z5KGQsIGkpLCB4MV8sIHkxXywgeDJfLCB5Ml8pO1xuICAgICAgfTtcbiAgICAgIHJvb3QudmlzaXQgPSBmdW5jdGlvbihmKSB7XG4gICAgICAgIGQzX2dlb21fcXVhZHRyZWVWaXNpdChmLCByb290LCB4MV8sIHkxXywgeDJfLCB5Ml8pO1xuICAgICAgfTtcbiAgICAgIHJvb3QuZmluZCA9IGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICAgIHJldHVybiBkM19nZW9tX3F1YWR0cmVlRmluZChyb290LCBwb2ludFswXSwgcG9pbnRbMV0sIHgxXywgeTFfLCB4Ml8sIHkyXyk7XG4gICAgICB9O1xuICAgICAgaSA9IC0xO1xuICAgICAgaWYgKHgxID09IG51bGwpIHtcbiAgICAgICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgICAgICBpbnNlcnQocm9vdCwgZGF0YVtpXSwgeHNbaV0sIHlzW2ldLCB4MV8sIHkxXywgeDJfLCB5Ml8pO1xuICAgICAgICB9XG4gICAgICAgIC0taTtcbiAgICAgIH0gZWxzZSBkYXRhLmZvckVhY2gocm9vdC5hZGQpO1xuICAgICAgeHMgPSB5cyA9IGRhdGEgPSBkID0gbnVsbDtcbiAgICAgIHJldHVybiByb290O1xuICAgIH1cbiAgICBxdWFkdHJlZS54ID0gZnVuY3Rpb24oXykge1xuICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPyAoeCA9IF8sIHF1YWR0cmVlKSA6IHg7XG4gICAgfTtcbiAgICBxdWFkdHJlZS55ID0gZnVuY3Rpb24oXykge1xuICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPyAoeSA9IF8sIHF1YWR0cmVlKSA6IHk7XG4gICAgfTtcbiAgICBxdWFkdHJlZS5leHRlbnQgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB4MSA9PSBudWxsID8gbnVsbCA6IFsgWyB4MSwgeTEgXSwgWyB4MiwgeTIgXSBdO1xuICAgICAgaWYgKF8gPT0gbnVsbCkgeDEgPSB5MSA9IHgyID0geTIgPSBudWxsOyBlbHNlIHgxID0gK19bMF1bMF0sIHkxID0gK19bMF1bMV0sIHgyID0gK19bMV1bMF0sIFxuICAgICAgeTIgPSArX1sxXVsxXTtcbiAgICAgIHJldHVybiBxdWFkdHJlZTtcbiAgICB9O1xuICAgIHF1YWR0cmVlLnNpemUgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB4MSA9PSBudWxsID8gbnVsbCA6IFsgeDIgLSB4MSwgeTIgLSB5MSBdO1xuICAgICAgaWYgKF8gPT0gbnVsbCkgeDEgPSB5MSA9IHgyID0geTIgPSBudWxsOyBlbHNlIHgxID0geTEgPSAwLCB4MiA9ICtfWzBdLCB5MiA9ICtfWzFdO1xuICAgICAgcmV0dXJuIHF1YWR0cmVlO1xuICAgIH07XG4gICAgcmV0dXJuIHF1YWR0cmVlO1xuICB9O1xuICBmdW5jdGlvbiBkM19nZW9tX3F1YWR0cmVlQ29tcGF0WChkKSB7XG4gICAgcmV0dXJuIGQueDtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3F1YWR0cmVlQ29tcGF0WShkKSB7XG4gICAgcmV0dXJuIGQueTtcbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3F1YWR0cmVlTm9kZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGVhZjogdHJ1ZSxcbiAgICAgIG5vZGVzOiBbXSxcbiAgICAgIHBvaW50OiBudWxsLFxuICAgICAgeDogbnVsbCxcbiAgICAgIHk6IG51bGxcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2dlb21fcXVhZHRyZWVWaXNpdChmLCBub2RlLCB4MSwgeTEsIHgyLCB5Mikge1xuICAgIGlmICghZihub2RlLCB4MSwgeTEsIHgyLCB5MikpIHtcbiAgICAgIHZhciBzeCA9ICh4MSArIHgyKSAqIC41LCBzeSA9ICh5MSArIHkyKSAqIC41LCBjaGlsZHJlbiA9IG5vZGUubm9kZXM7XG4gICAgICBpZiAoY2hpbGRyZW5bMF0pIGQzX2dlb21fcXVhZHRyZWVWaXNpdChmLCBjaGlsZHJlblswXSwgeDEsIHkxLCBzeCwgc3kpO1xuICAgICAgaWYgKGNoaWxkcmVuWzFdKSBkM19nZW9tX3F1YWR0cmVlVmlzaXQoZiwgY2hpbGRyZW5bMV0sIHN4LCB5MSwgeDIsIHN5KTtcbiAgICAgIGlmIChjaGlsZHJlblsyXSkgZDNfZ2VvbV9xdWFkdHJlZVZpc2l0KGYsIGNoaWxkcmVuWzJdLCB4MSwgc3ksIHN4LCB5Mik7XG4gICAgICBpZiAoY2hpbGRyZW5bM10pIGQzX2dlb21fcXVhZHRyZWVWaXNpdChmLCBjaGlsZHJlblszXSwgc3gsIHN5LCB4MiwgeTIpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkM19nZW9tX3F1YWR0cmVlRmluZChyb290LCB4LCB5LCB4MCwgeTAsIHgzLCB5Mykge1xuICAgIHZhciBtaW5EaXN0YW5jZTIgPSBJbmZpbml0eSwgY2xvc2VzdFBvaW50O1xuICAgIChmdW5jdGlvbiBmaW5kKG5vZGUsIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICBpZiAoeDEgPiB4MyB8fCB5MSA+IHkzIHx8IHgyIDwgeDAgfHwgeTIgPCB5MCkgcmV0dXJuO1xuICAgICAgaWYgKHBvaW50ID0gbm9kZS5wb2ludCkge1xuICAgICAgICB2YXIgcG9pbnQsIGR4ID0geCAtIG5vZGUueCwgZHkgPSB5IC0gbm9kZS55LCBkaXN0YW5jZTIgPSBkeCAqIGR4ICsgZHkgKiBkeTtcbiAgICAgICAgaWYgKGRpc3RhbmNlMiA8IG1pbkRpc3RhbmNlMikge1xuICAgICAgICAgIHZhciBkaXN0YW5jZSA9IE1hdGguc3FydChtaW5EaXN0YW5jZTIgPSBkaXN0YW5jZTIpO1xuICAgICAgICAgIHgwID0geCAtIGRpc3RhbmNlLCB5MCA9IHkgLSBkaXN0YW5jZTtcbiAgICAgICAgICB4MyA9IHggKyBkaXN0YW5jZSwgeTMgPSB5ICsgZGlzdGFuY2U7XG4gICAgICAgICAgY2xvc2VzdFBvaW50ID0gcG9pbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBjaGlsZHJlbiA9IG5vZGUubm9kZXMsIHhtID0gKHgxICsgeDIpICogLjUsIHltID0gKHkxICsgeTIpICogLjUsIHJpZ2h0ID0geCA+PSB4bSwgYmVsb3cgPSB5ID49IHltO1xuICAgICAgZm9yICh2YXIgaSA9IGJlbG93IDw8IDEgfCByaWdodCwgaiA9IGkgKyA0OyBpIDwgajsgKytpKSB7XG4gICAgICAgIGlmIChub2RlID0gY2hpbGRyZW5baSAmIDNdKSBzd2l0Y2ggKGkgJiAzKSB7XG4gICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgZmluZChub2RlLCB4MSwgeTEsIHhtLCB5bSk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBmaW5kKG5vZGUsIHhtLCB5MSwgeDIsIHltKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIGZpbmQobm9kZSwgeDEsIHltLCB4bSwgeTIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgZmluZChub2RlLCB4bSwgeW0sIHgyLCB5Mik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KShyb290LCB4MCwgeTAsIHgzLCB5Myk7XG4gICAgcmV0dXJuIGNsb3Nlc3RQb2ludDtcbiAgfVxuICBkMy5pbnRlcnBvbGF0ZVJnYiA9IGQzX2ludGVycG9sYXRlUmdiO1xuICBmdW5jdGlvbiBkM19pbnRlcnBvbGF0ZVJnYihhLCBiKSB7XG4gICAgYSA9IGQzLnJnYihhKTtcbiAgICBiID0gZDMucmdiKGIpO1xuICAgIHZhciBhciA9IGEuciwgYWcgPSBhLmcsIGFiID0gYS5iLCBiciA9IGIuciAtIGFyLCBiZyA9IGIuZyAtIGFnLCBiYiA9IGIuYiAtIGFiO1xuICAgIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgICByZXR1cm4gXCIjXCIgKyBkM19yZ2JfaGV4KE1hdGgucm91bmQoYXIgKyBiciAqIHQpKSArIGQzX3JnYl9oZXgoTWF0aC5yb3VuZChhZyArIGJnICogdCkpICsgZDNfcmdiX2hleChNYXRoLnJvdW5kKGFiICsgYmIgKiB0KSk7XG4gICAgfTtcbiAgfVxuICBkMy5pbnRlcnBvbGF0ZU9iamVjdCA9IGQzX2ludGVycG9sYXRlT2JqZWN0O1xuICBmdW5jdGlvbiBkM19pbnRlcnBvbGF0ZU9iamVjdChhLCBiKSB7XG4gICAgdmFyIGkgPSB7fSwgYyA9IHt9LCBrO1xuICAgIGZvciAoayBpbiBhKSB7XG4gICAgICBpZiAoayBpbiBiKSB7XG4gICAgICAgIGlba10gPSBkM19pbnRlcnBvbGF0ZShhW2tdLCBiW2tdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNba10gPSBhW2tdO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGsgaW4gYikge1xuICAgICAgaWYgKCEoayBpbiBhKSkge1xuICAgICAgICBjW2tdID0gYltrXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcbiAgICAgIGZvciAoayBpbiBpKSBjW2tdID0gaVtrXSh0KTtcbiAgICAgIHJldHVybiBjO1xuICAgIH07XG4gIH1cbiAgZDMuaW50ZXJwb2xhdGVOdW1iZXIgPSBkM19pbnRlcnBvbGF0ZU51bWJlcjtcbiAgZnVuY3Rpb24gZDNfaW50ZXJwb2xhdGVOdW1iZXIoYSwgYikge1xuICAgIGEgPSArYSwgYiA9ICtiO1xuICAgIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgICByZXR1cm4gYSAqICgxIC0gdCkgKyBiICogdDtcbiAgICB9O1xuICB9XG4gIGQzLmludGVycG9sYXRlU3RyaW5nID0gZDNfaW50ZXJwb2xhdGVTdHJpbmc7XG4gIGZ1bmN0aW9uIGQzX2ludGVycG9sYXRlU3RyaW5nKGEsIGIpIHtcbiAgICB2YXIgYmkgPSBkM19pbnRlcnBvbGF0ZV9udW1iZXJBLmxhc3RJbmRleCA9IGQzX2ludGVycG9sYXRlX251bWJlckIubGFzdEluZGV4ID0gMCwgYW0sIGJtLCBicywgaSA9IC0xLCBzID0gW10sIHEgPSBbXTtcbiAgICBhID0gYSArIFwiXCIsIGIgPSBiICsgXCJcIjtcbiAgICB3aGlsZSAoKGFtID0gZDNfaW50ZXJwb2xhdGVfbnVtYmVyQS5leGVjKGEpKSAmJiAoYm0gPSBkM19pbnRlcnBvbGF0ZV9udW1iZXJCLmV4ZWMoYikpKSB7XG4gICAgICBpZiAoKGJzID0gYm0uaW5kZXgpID4gYmkpIHtcbiAgICAgICAgYnMgPSBiLnNsaWNlKGJpLCBicyk7XG4gICAgICAgIGlmIChzW2ldKSBzW2ldICs9IGJzOyBlbHNlIHNbKytpXSA9IGJzO1xuICAgICAgfVxuICAgICAgaWYgKChhbSA9IGFtWzBdKSA9PT0gKGJtID0gYm1bMF0pKSB7XG4gICAgICAgIGlmIChzW2ldKSBzW2ldICs9IGJtOyBlbHNlIHNbKytpXSA9IGJtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc1srK2ldID0gbnVsbDtcbiAgICAgICAgcS5wdXNoKHtcbiAgICAgICAgICBpOiBpLFxuICAgICAgICAgIHg6IGQzX2ludGVycG9sYXRlTnVtYmVyKGFtLCBibSlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBiaSA9IGQzX2ludGVycG9sYXRlX251bWJlckIubGFzdEluZGV4O1xuICAgIH1cbiAgICBpZiAoYmkgPCBiLmxlbmd0aCkge1xuICAgICAgYnMgPSBiLnNsaWNlKGJpKTtcbiAgICAgIGlmIChzW2ldKSBzW2ldICs9IGJzOyBlbHNlIHNbKytpXSA9IGJzO1xuICAgIH1cbiAgICByZXR1cm4gcy5sZW5ndGggPCAyID8gcVswXSA/IChiID0gcVswXS54LCBmdW5jdGlvbih0KSB7XG4gICAgICByZXR1cm4gYih0KSArIFwiXCI7XG4gICAgfSkgOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBiO1xuICAgIH0gOiAoYiA9IHEubGVuZ3RoLCBmdW5jdGlvbih0KSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbzsgaSA8IGI7ICsraSkgc1sobyA9IHFbaV0pLmldID0gby54KHQpO1xuICAgICAgcmV0dXJuIHMuam9pbihcIlwiKTtcbiAgICB9KTtcbiAgfVxuICB2YXIgZDNfaW50ZXJwb2xhdGVfbnVtYmVyQSA9IC9bLStdPyg/OlxcZCtcXC4/XFxkKnxcXC4/XFxkKykoPzpbZUVdWy0rXT9cXGQrKT8vZywgZDNfaW50ZXJwb2xhdGVfbnVtYmVyQiA9IG5ldyBSZWdFeHAoZDNfaW50ZXJwb2xhdGVfbnVtYmVyQS5zb3VyY2UsIFwiZ1wiKTtcbiAgZDMuaW50ZXJwb2xhdGUgPSBkM19pbnRlcnBvbGF0ZTtcbiAgZnVuY3Rpb24gZDNfaW50ZXJwb2xhdGUoYSwgYikge1xuICAgIHZhciBpID0gZDMuaW50ZXJwb2xhdG9ycy5sZW5ndGgsIGY7XG4gICAgd2hpbGUgKC0taSA+PSAwICYmICEoZiA9IGQzLmludGVycG9sYXRvcnNbaV0oYSwgYikpKSA7XG4gICAgcmV0dXJuIGY7XG4gIH1cbiAgZDMuaW50ZXJwb2xhdG9ycyA9IFsgZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB0ID0gdHlwZW9mIGI7XG4gICAgcmV0dXJuICh0ID09PSBcInN0cmluZ1wiID8gZDNfcmdiX25hbWVzLmhhcyhiLnRvTG93ZXJDYXNlKCkpIHx8IC9eKCN8cmdiXFwofGhzbFxcKCkvaS50ZXN0KGIpID8gZDNfaW50ZXJwb2xhdGVSZ2IgOiBkM19pbnRlcnBvbGF0ZVN0cmluZyA6IGIgaW5zdGFuY2VvZiBkM19jb2xvciA/IGQzX2ludGVycG9sYXRlUmdiIDogQXJyYXkuaXNBcnJheShiKSA/IGQzX2ludGVycG9sYXRlQXJyYXkgOiB0ID09PSBcIm9iamVjdFwiICYmIGlzTmFOKGIpID8gZDNfaW50ZXJwb2xhdGVPYmplY3QgOiBkM19pbnRlcnBvbGF0ZU51bWJlcikoYSwgYik7XG4gIH0gXTtcbiAgZDMuaW50ZXJwb2xhdGVBcnJheSA9IGQzX2ludGVycG9sYXRlQXJyYXk7XG4gIGZ1bmN0aW9uIGQzX2ludGVycG9sYXRlQXJyYXkoYSwgYikge1xuICAgIHZhciB4ID0gW10sIGMgPSBbXSwgbmEgPSBhLmxlbmd0aCwgbmIgPSBiLmxlbmd0aCwgbjAgPSBNYXRoLm1pbihhLmxlbmd0aCwgYi5sZW5ndGgpLCBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBuMDsgKytpKSB4LnB1c2goZDNfaW50ZXJwb2xhdGUoYVtpXSwgYltpXSkpO1xuICAgIGZvciAoO2kgPCBuYTsgKytpKSBjW2ldID0gYVtpXTtcbiAgICBmb3IgKDtpIDwgbmI7ICsraSkgY1tpXSA9IGJbaV07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBuMDsgKytpKSBjW2ldID0geFtpXSh0KTtcbiAgICAgIHJldHVybiBjO1xuICAgIH07XG4gIH1cbiAgdmFyIGQzX2Vhc2VfZGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM19pZGVudGl0eTtcbiAgfTtcbiAgdmFyIGQzX2Vhc2UgPSBkMy5tYXAoe1xuICAgIGxpbmVhcjogZDNfZWFzZV9kZWZhdWx0LFxuICAgIHBvbHk6IGQzX2Vhc2VfcG9seSxcbiAgICBxdWFkOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkM19lYXNlX3F1YWQ7XG4gICAgfSxcbiAgICBjdWJpYzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZDNfZWFzZV9jdWJpYztcbiAgICB9LFxuICAgIHNpbjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZDNfZWFzZV9zaW47XG4gICAgfSxcbiAgICBleHA6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGQzX2Vhc2VfZXhwO1xuICAgIH0sXG4gICAgY2lyY2xlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkM19lYXNlX2NpcmNsZTtcbiAgICB9LFxuICAgIGVsYXN0aWM6IGQzX2Vhc2VfZWxhc3RpYyxcbiAgICBiYWNrOiBkM19lYXNlX2JhY2ssXG4gICAgYm91bmNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkM19lYXNlX2JvdW5jZTtcbiAgICB9XG4gIH0pO1xuICB2YXIgZDNfZWFzZV9tb2RlID0gZDMubWFwKHtcbiAgICBcImluXCI6IGQzX2lkZW50aXR5LFxuICAgIG91dDogZDNfZWFzZV9yZXZlcnNlLFxuICAgIFwiaW4tb3V0XCI6IGQzX2Vhc2VfcmVmbGVjdCxcbiAgICBcIm91dC1pblwiOiBmdW5jdGlvbihmKSB7XG4gICAgICByZXR1cm4gZDNfZWFzZV9yZWZsZWN0KGQzX2Vhc2VfcmV2ZXJzZShmKSk7XG4gICAgfVxuICB9KTtcbiAgZDMuZWFzZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgaSA9IG5hbWUuaW5kZXhPZihcIi1cIiksIHQgPSBpID49IDAgPyBuYW1lLnNsaWNlKDAsIGkpIDogbmFtZSwgbSA9IGkgPj0gMCA/IG5hbWUuc2xpY2UoaSArIDEpIDogXCJpblwiO1xuICAgIHQgPSBkM19lYXNlLmdldCh0KSB8fCBkM19lYXNlX2RlZmF1bHQ7XG4gICAgbSA9IGQzX2Vhc2VfbW9kZS5nZXQobSkgfHwgZDNfaWRlbnRpdHk7XG4gICAgcmV0dXJuIGQzX2Vhc2VfY2xhbXAobSh0LmFwcGx5KG51bGwsIGQzX2FycmF5U2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSkpO1xuICB9O1xuICBmdW5jdGlvbiBkM19lYXNlX2NsYW1wKGYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odCkge1xuICAgICAgcmV0dXJuIHQgPD0gMCA/IDAgOiB0ID49IDEgPyAxIDogZih0KTtcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2Vhc2VfcmV2ZXJzZShmKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcbiAgICAgIHJldHVybiAxIC0gZigxIC0gdCk7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBkM19lYXNlX3JlZmxlY3QoZikge1xuICAgIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgICByZXR1cm4gLjUgKiAodCA8IC41ID8gZigyICogdCkgOiAyIC0gZigyIC0gMiAqIHQpKTtcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2Vhc2VfcXVhZCh0KSB7XG4gICAgcmV0dXJuIHQgKiB0O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2Vhc2VfY3ViaWModCkge1xuICAgIHJldHVybiB0ICogdCAqIHQ7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZWFzZV9jdWJpY0luT3V0KHQpIHtcbiAgICBpZiAodCA8PSAwKSByZXR1cm4gMDtcbiAgICBpZiAodCA+PSAxKSByZXR1cm4gMTtcbiAgICB2YXIgdDIgPSB0ICogdCwgdDMgPSB0MiAqIHQ7XG4gICAgcmV0dXJuIDQgKiAodCA8IC41ID8gdDMgOiAzICogKHQgLSB0MikgKyB0MyAtIC43NSk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZWFzZV9wb2x5KGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odCkge1xuICAgICAgcmV0dXJuIE1hdGgucG93KHQsIGUpO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gZDNfZWFzZV9zaW4odCkge1xuICAgIHJldHVybiAxIC0gTWF0aC5jb3ModCAqIGhhbGbPgCk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfZWFzZV9leHAodCkge1xuICAgIHJldHVybiBNYXRoLnBvdygyLCAxMCAqICh0IC0gMSkpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2Vhc2VfY2lyY2xlKHQpIHtcbiAgICByZXR1cm4gMSAtIE1hdGguc3FydCgxIC0gdCAqIHQpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2Vhc2VfZWxhc3RpYyhhLCBwKSB7XG4gICAgdmFyIHM7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSBwID0gLjQ1O1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSBzID0gcCAvIM+EICogTWF0aC5hc2luKDEgLyBhKTsgZWxzZSBhID0gMSwgcyA9IHAgLyA0O1xuICAgIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgICByZXR1cm4gMSArIGEgKiBNYXRoLnBvdygyLCAtMTAgKiB0KSAqIE1hdGguc2luKCh0IC0gcykgKiDPhCAvIHApO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gZDNfZWFzZV9iYWNrKHMpIHtcbiAgICBpZiAoIXMpIHMgPSAxLjcwMTU4O1xuICAgIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgICByZXR1cm4gdCAqIHQgKiAoKHMgKyAxKSAqIHQgLSBzKTtcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2Vhc2VfYm91bmNlKHQpIHtcbiAgICByZXR1cm4gdCA8IDEgLyAyLjc1ID8gNy41NjI1ICogdCAqIHQgOiB0IDwgMiAvIDIuNzUgPyA3LjU2MjUgKiAodCAtPSAxLjUgLyAyLjc1KSAqIHQgKyAuNzUgOiB0IDwgMi41IC8gMi43NSA/IDcuNTYyNSAqICh0IC09IDIuMjUgLyAyLjc1KSAqIHQgKyAuOTM3NSA6IDcuNTYyNSAqICh0IC09IDIuNjI1IC8gMi43NSkgKiB0ICsgLjk4NDM3NTtcbiAgfVxuICBkMy5pbnRlcnBvbGF0ZUhjbCA9IGQzX2ludGVycG9sYXRlSGNsO1xuICBmdW5jdGlvbiBkM19pbnRlcnBvbGF0ZUhjbChhLCBiKSB7XG4gICAgYSA9IGQzLmhjbChhKTtcbiAgICBiID0gZDMuaGNsKGIpO1xuICAgIHZhciBhaCA9IGEuaCwgYWMgPSBhLmMsIGFsID0gYS5sLCBiaCA9IGIuaCAtIGFoLCBiYyA9IGIuYyAtIGFjLCBibCA9IGIubCAtIGFsO1xuICAgIGlmIChpc05hTihiYykpIGJjID0gMCwgYWMgPSBpc05hTihhYykgPyBiLmMgOiBhYztcbiAgICBpZiAoaXNOYU4oYmgpKSBiaCA9IDAsIGFoID0gaXNOYU4oYWgpID8gYi5oIDogYWg7IGVsc2UgaWYgKGJoID4gMTgwKSBiaCAtPSAzNjA7IGVsc2UgaWYgKGJoIDwgLTE4MCkgYmggKz0gMzYwO1xuICAgIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgICByZXR1cm4gZDNfaGNsX2xhYihhaCArIGJoICogdCwgYWMgKyBiYyAqIHQsIGFsICsgYmwgKiB0KSArIFwiXCI7XG4gICAgfTtcbiAgfVxuICBkMy5pbnRlcnBvbGF0ZUhzbCA9IGQzX2ludGVycG9sYXRlSHNsO1xuICBmdW5jdGlvbiBkM19pbnRlcnBvbGF0ZUhzbChhLCBiKSB7XG4gICAgYSA9IGQzLmhzbChhKTtcbiAgICBiID0gZDMuaHNsKGIpO1xuICAgIHZhciBhaCA9IGEuaCwgYXMgPSBhLnMsIGFsID0gYS5sLCBiaCA9IGIuaCAtIGFoLCBicyA9IGIucyAtIGFzLCBibCA9IGIubCAtIGFsO1xuICAgIGlmIChpc05hTihicykpIGJzID0gMCwgYXMgPSBpc05hTihhcykgPyBiLnMgOiBhcztcbiAgICBpZiAoaXNOYU4oYmgpKSBiaCA9IDAsIGFoID0gaXNOYU4oYWgpID8gYi5oIDogYWg7IGVsc2UgaWYgKGJoID4gMTgwKSBiaCAtPSAzNjA7IGVsc2UgaWYgKGJoIDwgLTE4MCkgYmggKz0gMzYwO1xuICAgIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgICByZXR1cm4gZDNfaHNsX3JnYihhaCArIGJoICogdCwgYXMgKyBicyAqIHQsIGFsICsgYmwgKiB0KSArIFwiXCI7XG4gICAgfTtcbiAgfVxuICBkMy5pbnRlcnBvbGF0ZUxhYiA9IGQzX2ludGVycG9sYXRlTGFiO1xuICBmdW5jdGlvbiBkM19pbnRlcnBvbGF0ZUxhYihhLCBiKSB7XG4gICAgYSA9IGQzLmxhYihhKTtcbiAgICBiID0gZDMubGFiKGIpO1xuICAgIHZhciBhbCA9IGEubCwgYWEgPSBhLmEsIGFiID0gYS5iLCBibCA9IGIubCAtIGFsLCBiYSA9IGIuYSAtIGFhLCBiYiA9IGIuYiAtIGFiO1xuICAgIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgICByZXR1cm4gZDNfbGFiX3JnYihhbCArIGJsICogdCwgYWEgKyBiYSAqIHQsIGFiICsgYmIgKiB0KSArIFwiXCI7XG4gICAgfTtcbiAgfVxuICBkMy5pbnRlcnBvbGF0ZVJvdW5kID0gZDNfaW50ZXJwb2xhdGVSb3VuZDtcbiAgZnVuY3Rpb24gZDNfaW50ZXJwb2xhdGVSb3VuZChhLCBiKSB7XG4gICAgYiAtPSBhO1xuICAgIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgICByZXR1cm4gTWF0aC5yb3VuZChhICsgYiAqIHQpO1xuICAgIH07XG4gIH1cbiAgZDMudHJhbnNmb3JtID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdmFyIGcgPSBkM19kb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoZDMubnMucHJlZml4LnN2ZywgXCJnXCIpO1xuICAgIHJldHVybiAoZDMudHJhbnNmb3JtID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICBpZiAoc3RyaW5nICE9IG51bGwpIHtcbiAgICAgICAgZy5zZXRBdHRyaWJ1dGUoXCJ0cmFuc2Zvcm1cIiwgc3RyaW5nKTtcbiAgICAgICAgdmFyIHQgPSBnLnRyYW5zZm9ybS5iYXNlVmFsLmNvbnNvbGlkYXRlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IGQzX3RyYW5zZm9ybSh0ID8gdC5tYXRyaXggOiBkM190cmFuc2Zvcm1JZGVudGl0eSk7XG4gICAgfSkoc3RyaW5nKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfdHJhbnNmb3JtKG0pIHtcbiAgICB2YXIgcjAgPSBbIG0uYSwgbS5iIF0sIHIxID0gWyBtLmMsIG0uZCBdLCBreCA9IGQzX3RyYW5zZm9ybU5vcm1hbGl6ZShyMCksIGt6ID0gZDNfdHJhbnNmb3JtRG90KHIwLCByMSksIGt5ID0gZDNfdHJhbnNmb3JtTm9ybWFsaXplKGQzX3RyYW5zZm9ybUNvbWJpbmUocjEsIHIwLCAta3opKSB8fCAwO1xuICAgIGlmIChyMFswXSAqIHIxWzFdIDwgcjFbMF0gKiByMFsxXSkge1xuICAgICAgcjBbMF0gKj0gLTE7XG4gICAgICByMFsxXSAqPSAtMTtcbiAgICAgIGt4ICo9IC0xO1xuICAgICAga3ogKj0gLTE7XG4gICAgfVxuICAgIHRoaXMucm90YXRlID0gKGt4ID8gTWF0aC5hdGFuMihyMFsxXSwgcjBbMF0pIDogTWF0aC5hdGFuMigtcjFbMF0sIHIxWzFdKSkgKiBkM19kZWdyZWVzO1xuICAgIHRoaXMudHJhbnNsYXRlID0gWyBtLmUsIG0uZiBdO1xuICAgIHRoaXMuc2NhbGUgPSBbIGt4LCBreSBdO1xuICAgIHRoaXMuc2tldyA9IGt5ID8gTWF0aC5hdGFuMihreiwga3kpICogZDNfZGVncmVlcyA6IDA7XG4gIH1cbiAgZDNfdHJhbnNmb3JtLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIHRoaXMudHJhbnNsYXRlICsgXCIpcm90YXRlKFwiICsgdGhpcy5yb3RhdGUgKyBcIilza2V3WChcIiArIHRoaXMuc2tldyArIFwiKXNjYWxlKFwiICsgdGhpcy5zY2FsZSArIFwiKVwiO1xuICB9O1xuICBmdW5jdGlvbiBkM190cmFuc2Zvcm1Eb3QoYSwgYikge1xuICAgIHJldHVybiBhWzBdICogYlswXSArIGFbMV0gKiBiWzFdO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RyYW5zZm9ybU5vcm1hbGl6ZShhKSB7XG4gICAgdmFyIGsgPSBNYXRoLnNxcnQoZDNfdHJhbnNmb3JtRG90KGEsIGEpKTtcbiAgICBpZiAoaykge1xuICAgICAgYVswXSAvPSBrO1xuICAgICAgYVsxXSAvPSBrO1xuICAgIH1cbiAgICByZXR1cm4gaztcbiAgfVxuICBmdW5jdGlvbiBkM190cmFuc2Zvcm1Db21iaW5lKGEsIGIsIGspIHtcbiAgICBhWzBdICs9IGsgKiBiWzBdO1xuICAgIGFbMV0gKz0gayAqIGJbMV07XG4gICAgcmV0dXJuIGE7XG4gIH1cbiAgdmFyIGQzX3RyYW5zZm9ybUlkZW50aXR5ID0ge1xuICAgIGE6IDEsXG4gICAgYjogMCxcbiAgICBjOiAwLFxuICAgIGQ6IDEsXG4gICAgZTogMCxcbiAgICBmOiAwXG4gIH07XG4gIGQzLmludGVycG9sYXRlVHJhbnNmb3JtID0gZDNfaW50ZXJwb2xhdGVUcmFuc2Zvcm07XG4gIGZ1bmN0aW9uIGQzX2ludGVycG9sYXRlVHJhbnNmb3JtUG9wKHMpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPyBzLnBvcCgpICsgXCIsXCIgOiBcIlwiO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2ludGVycG9sYXRlVHJhbnNsYXRlKHRhLCB0YiwgcywgcSkge1xuICAgIGlmICh0YVswXSAhPT0gdGJbMF0gfHwgdGFbMV0gIT09IHRiWzFdKSB7XG4gICAgICB2YXIgaSA9IHMucHVzaChcInRyYW5zbGF0ZShcIiwgbnVsbCwgXCIsXCIsIG51bGwsIFwiKVwiKTtcbiAgICAgIHEucHVzaCh7XG4gICAgICAgIGk6IGkgLSA0LFxuICAgICAgICB4OiBkM19pbnRlcnBvbGF0ZU51bWJlcih0YVswXSwgdGJbMF0pXG4gICAgICB9LCB7XG4gICAgICAgIGk6IGkgLSAyLFxuICAgICAgICB4OiBkM19pbnRlcnBvbGF0ZU51bWJlcih0YVsxXSwgdGJbMV0pXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRiWzBdIHx8IHRiWzFdKSB7XG4gICAgICBzLnB1c2goXCJ0cmFuc2xhdGUoXCIgKyB0YiArIFwiKVwiKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZDNfaW50ZXJwb2xhdGVSb3RhdGUocmEsIHJiLCBzLCBxKSB7XG4gICAgaWYgKHJhICE9PSByYikge1xuICAgICAgaWYgKHJhIC0gcmIgPiAxODApIHJiICs9IDM2MDsgZWxzZSBpZiAocmIgLSByYSA+IDE4MCkgcmEgKz0gMzYwO1xuICAgICAgcS5wdXNoKHtcbiAgICAgICAgaTogcy5wdXNoKGQzX2ludGVycG9sYXRlVHJhbnNmb3JtUG9wKHMpICsgXCJyb3RhdGUoXCIsIG51bGwsIFwiKVwiKSAtIDIsXG4gICAgICAgIHg6IGQzX2ludGVycG9sYXRlTnVtYmVyKHJhLCByYilcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAocmIpIHtcbiAgICAgIHMucHVzaChkM19pbnRlcnBvbGF0ZVRyYW5zZm9ybVBvcChzKSArIFwicm90YXRlKFwiICsgcmIgKyBcIilcIik7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGQzX2ludGVycG9sYXRlU2tldyh3YSwgd2IsIHMsIHEpIHtcbiAgICBpZiAod2EgIT09IHdiKSB7XG4gICAgICBxLnB1c2goe1xuICAgICAgICBpOiBzLnB1c2goZDNfaW50ZXJwb2xhdGVUcmFuc2Zvcm1Qb3AocykgKyBcInNrZXdYKFwiLCBudWxsLCBcIilcIikgLSAyLFxuICAgICAgICB4OiBkM19pbnRlcnBvbGF0ZU51bWJlcih3YSwgd2IpXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHdiKSB7XG4gICAgICBzLnB1c2goZDNfaW50ZXJwb2xhdGVUcmFuc2Zvcm1Qb3AocykgKyBcInNrZXdYKFwiICsgd2IgKyBcIilcIik7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGQzX2ludGVycG9sYXRlU2NhbGUoa2EsIGtiLCBzLCBxKSB7XG4gICAgaWYgKGthWzBdICE9PSBrYlswXSB8fCBrYVsxXSAhPT0ga2JbMV0pIHtcbiAgICAgIHZhciBpID0gcy5wdXNoKGQzX2ludGVycG9sYXRlVHJhbnNmb3JtUG9wKHMpICsgXCJzY2FsZShcIiwgbnVsbCwgXCIsXCIsIG51bGwsIFwiKVwiKTtcbiAgICAgIHEucHVzaCh7XG4gICAgICAgIGk6IGkgLSA0LFxuICAgICAgICB4OiBkM19pbnRlcnBvbGF0ZU51bWJlcihrYVswXSwga2JbMF0pXG4gICAgICB9LCB7XG4gICAgICAgIGk6IGkgLSAyLFxuICAgICAgICB4OiBkM19pbnRlcnBvbGF0ZU51bWJlcihrYVsxXSwga2JbMV0pXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGtiWzBdICE9PSAxIHx8IGtiWzFdICE9PSAxKSB7XG4gICAgICBzLnB1c2goZDNfaW50ZXJwb2xhdGVUcmFuc2Zvcm1Qb3AocykgKyBcInNjYWxlKFwiICsga2IgKyBcIilcIik7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGQzX2ludGVycG9sYXRlVHJhbnNmb3JtKGEsIGIpIHtcbiAgICB2YXIgcyA9IFtdLCBxID0gW107XG4gICAgYSA9IGQzLnRyYW5zZm9ybShhKSwgYiA9IGQzLnRyYW5zZm9ybShiKTtcbiAgICBkM19pbnRlcnBvbGF0ZVRyYW5zbGF0ZShhLnRyYW5zbGF0ZSwgYi50cmFuc2xhdGUsIHMsIHEpO1xuICAgIGQzX2ludGVycG9sYXRlUm90YXRlKGEucm90YXRlLCBiLnJvdGF0ZSwgcywgcSk7XG4gICAgZDNfaW50ZXJwb2xhdGVTa2V3KGEuc2tldywgYi5za2V3LCBzLCBxKTtcbiAgICBkM19pbnRlcnBvbGF0ZVNjYWxlKGEuc2NhbGUsIGIuc2NhbGUsIHMsIHEpO1xuICAgIGEgPSBiID0gbnVsbDtcbiAgICByZXR1cm4gZnVuY3Rpb24odCkge1xuICAgICAgdmFyIGkgPSAtMSwgbiA9IHEubGVuZ3RoLCBvO1xuICAgICAgd2hpbGUgKCsraSA8IG4pIHNbKG8gPSBxW2ldKS5pXSA9IG8ueCh0KTtcbiAgICAgIHJldHVybiBzLmpvaW4oXCJcIik7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBkM191bmludGVycG9sYXRlTnVtYmVyKGEsIGIpIHtcbiAgICBiID0gKGIgLT0gYSA9ICthKSB8fCAxIC8gYjtcbiAgICByZXR1cm4gZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuICh4IC0gYSkgLyBiO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gZDNfdW5pbnRlcnBvbGF0ZUNsYW1wKGEsIGIpIHtcbiAgICBiID0gKGIgLT0gYSA9ICthKSB8fCAxIC8gYjtcbiAgICByZXR1cm4gZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKDEsICh4IC0gYSkgLyBiKSk7XG4gICAgfTtcbiAgfVxuICBkMy5sYXlvdXQgPSB7fTtcbiAgZDMubGF5b3V0LmJ1bmRsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihsaW5rcykge1xuICAgICAgdmFyIHBhdGhzID0gW10sIGkgPSAtMSwgbiA9IGxpbmtzLmxlbmd0aDtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSBwYXRocy5wdXNoKGQzX2xheW91dF9idW5kbGVQYXRoKGxpbmtzW2ldKSk7XG4gICAgICByZXR1cm4gcGF0aHM7XG4gICAgfTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfbGF5b3V0X2J1bmRsZVBhdGgobGluaykge1xuICAgIHZhciBzdGFydCA9IGxpbmsuc291cmNlLCBlbmQgPSBsaW5rLnRhcmdldCwgbGNhID0gZDNfbGF5b3V0X2J1bmRsZUxlYXN0Q29tbW9uQW5jZXN0b3Ioc3RhcnQsIGVuZCksIHBvaW50cyA9IFsgc3RhcnQgXTtcbiAgICB3aGlsZSAoc3RhcnQgIT09IGxjYSkge1xuICAgICAgc3RhcnQgPSBzdGFydC5wYXJlbnQ7XG4gICAgICBwb2ludHMucHVzaChzdGFydCk7XG4gICAgfVxuICAgIHZhciBrID0gcG9pbnRzLmxlbmd0aDtcbiAgICB3aGlsZSAoZW5kICE9PSBsY2EpIHtcbiAgICAgIHBvaW50cy5zcGxpY2UoaywgMCwgZW5kKTtcbiAgICAgIGVuZCA9IGVuZC5wYXJlbnQ7XG4gICAgfVxuICAgIHJldHVybiBwb2ludHM7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X2J1bmRsZUFuY2VzdG9ycyhub2RlKSB7XG4gICAgdmFyIGFuY2VzdG9ycyA9IFtdLCBwYXJlbnQgPSBub2RlLnBhcmVudDtcbiAgICB3aGlsZSAocGFyZW50ICE9IG51bGwpIHtcbiAgICAgIGFuY2VzdG9ycy5wdXNoKG5vZGUpO1xuICAgICAgbm9kZSA9IHBhcmVudDtcbiAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgfVxuICAgIGFuY2VzdG9ycy5wdXNoKG5vZGUpO1xuICAgIHJldHVybiBhbmNlc3RvcnM7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X2J1bmRsZUxlYXN0Q29tbW9uQW5jZXN0b3IoYSwgYikge1xuICAgIGlmIChhID09PSBiKSByZXR1cm4gYTtcbiAgICB2YXIgYU5vZGVzID0gZDNfbGF5b3V0X2J1bmRsZUFuY2VzdG9ycyhhKSwgYk5vZGVzID0gZDNfbGF5b3V0X2J1bmRsZUFuY2VzdG9ycyhiKSwgYU5vZGUgPSBhTm9kZXMucG9wKCksIGJOb2RlID0gYk5vZGVzLnBvcCgpLCBzaGFyZWROb2RlID0gbnVsbDtcbiAgICB3aGlsZSAoYU5vZGUgPT09IGJOb2RlKSB7XG4gICAgICBzaGFyZWROb2RlID0gYU5vZGU7XG4gICAgICBhTm9kZSA9IGFOb2Rlcy5wb3AoKTtcbiAgICAgIGJOb2RlID0gYk5vZGVzLnBvcCgpO1xuICAgIH1cbiAgICByZXR1cm4gc2hhcmVkTm9kZTtcbiAgfVxuICBkMy5sYXlvdXQuY2hvcmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2hvcmQgPSB7fSwgY2hvcmRzLCBncm91cHMsIG1hdHJpeCwgbiwgcGFkZGluZyA9IDAsIHNvcnRHcm91cHMsIHNvcnRTdWJncm91cHMsIHNvcnRDaG9yZHM7XG4gICAgZnVuY3Rpb24gcmVsYXlvdXQoKSB7XG4gICAgICB2YXIgc3ViZ3JvdXBzID0ge30sIGdyb3VwU3VtcyA9IFtdLCBncm91cEluZGV4ID0gZDMucmFuZ2UobiksIHN1Ymdyb3VwSW5kZXggPSBbXSwgaywgeCwgeDAsIGksIGo7XG4gICAgICBjaG9yZHMgPSBbXTtcbiAgICAgIGdyb3VwcyA9IFtdO1xuICAgICAgayA9IDAsIGkgPSAtMTtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgIHggPSAwLCBqID0gLTE7XG4gICAgICAgIHdoaWxlICgrK2ogPCBuKSB7XG4gICAgICAgICAgeCArPSBtYXRyaXhbaV1bal07XG4gICAgICAgIH1cbiAgICAgICAgZ3JvdXBTdW1zLnB1c2goeCk7XG4gICAgICAgIHN1Ymdyb3VwSW5kZXgucHVzaChkMy5yYW5nZShuKSk7XG4gICAgICAgIGsgKz0geDtcbiAgICAgIH1cbiAgICAgIGlmIChzb3J0R3JvdXBzKSB7XG4gICAgICAgIGdyb3VwSW5kZXguc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgcmV0dXJuIHNvcnRHcm91cHMoZ3JvdXBTdW1zW2FdLCBncm91cFN1bXNbYl0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChzb3J0U3ViZ3JvdXBzKSB7XG4gICAgICAgIHN1Ymdyb3VwSW5kZXguZm9yRWFjaChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgZC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBzb3J0U3ViZ3JvdXBzKG1hdHJpeFtpXVthXSwgbWF0cml4W2ldW2JdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBrID0gKM+EIC0gcGFkZGluZyAqIG4pIC8gaztcbiAgICAgIHggPSAwLCBpID0gLTE7XG4gICAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICB4MCA9IHgsIGogPSAtMTtcbiAgICAgICAgd2hpbGUgKCsraiA8IG4pIHtcbiAgICAgICAgICB2YXIgZGkgPSBncm91cEluZGV4W2ldLCBkaiA9IHN1Ymdyb3VwSW5kZXhbZGldW2pdLCB2ID0gbWF0cml4W2RpXVtkal0sIGEwID0geCwgYTEgPSB4ICs9IHYgKiBrO1xuICAgICAgICAgIHN1Ymdyb3Vwc1tkaSArIFwiLVwiICsgZGpdID0ge1xuICAgICAgICAgICAgaW5kZXg6IGRpLFxuICAgICAgICAgICAgc3ViaW5kZXg6IGRqLFxuICAgICAgICAgICAgc3RhcnRBbmdsZTogYTAsXG4gICAgICAgICAgICBlbmRBbmdsZTogYTEsXG4gICAgICAgICAgICB2YWx1ZTogdlxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZ3JvdXBzW2RpXSA9IHtcbiAgICAgICAgICBpbmRleDogZGksXG4gICAgICAgICAgc3RhcnRBbmdsZTogeDAsXG4gICAgICAgICAgZW5kQW5nbGU6IHgsXG4gICAgICAgICAgdmFsdWU6ICh4IC0geDApIC8ga1xuICAgICAgICB9O1xuICAgICAgICB4ICs9IHBhZGRpbmc7XG4gICAgICB9XG4gICAgICBpID0gLTE7XG4gICAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICBqID0gaSAtIDE7XG4gICAgICAgIHdoaWxlICgrK2ogPCBuKSB7XG4gICAgICAgICAgdmFyIHNvdXJjZSA9IHN1Ymdyb3Vwc1tpICsgXCItXCIgKyBqXSwgdGFyZ2V0ID0gc3ViZ3JvdXBzW2ogKyBcIi1cIiArIGldO1xuICAgICAgICAgIGlmIChzb3VyY2UudmFsdWUgfHwgdGFyZ2V0LnZhbHVlKSB7XG4gICAgICAgICAgICBjaG9yZHMucHVzaChzb3VyY2UudmFsdWUgPCB0YXJnZXQudmFsdWUgPyB7XG4gICAgICAgICAgICAgIHNvdXJjZTogdGFyZ2V0LFxuICAgICAgICAgICAgICB0YXJnZXQ6IHNvdXJjZVxuICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgc291cmNlOiBzb3VyY2UsXG4gICAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzb3J0Q2hvcmRzKSByZXNvcnQoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVzb3J0KCkge1xuICAgICAgY2hvcmRzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICByZXR1cm4gc29ydENob3JkcygoYS5zb3VyY2UudmFsdWUgKyBhLnRhcmdldC52YWx1ZSkgLyAyLCAoYi5zb3VyY2UudmFsdWUgKyBiLnRhcmdldC52YWx1ZSkgLyAyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjaG9yZC5tYXRyaXggPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBtYXRyaXg7XG4gICAgICBuID0gKG1hdHJpeCA9IHgpICYmIG1hdHJpeC5sZW5ndGg7XG4gICAgICBjaG9yZHMgPSBncm91cHMgPSBudWxsO1xuICAgICAgcmV0dXJuIGNob3JkO1xuICAgIH07XG4gICAgY2hvcmQucGFkZGluZyA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHBhZGRpbmc7XG4gICAgICBwYWRkaW5nID0geDtcbiAgICAgIGNob3JkcyA9IGdyb3VwcyA9IG51bGw7XG4gICAgICByZXR1cm4gY2hvcmQ7XG4gICAgfTtcbiAgICBjaG9yZC5zb3J0R3JvdXBzID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc29ydEdyb3VwcztcbiAgICAgIHNvcnRHcm91cHMgPSB4O1xuICAgICAgY2hvcmRzID0gZ3JvdXBzID0gbnVsbDtcbiAgICAgIHJldHVybiBjaG9yZDtcbiAgICB9O1xuICAgIGNob3JkLnNvcnRTdWJncm91cHMgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzb3J0U3ViZ3JvdXBzO1xuICAgICAgc29ydFN1Ymdyb3VwcyA9IHg7XG4gICAgICBjaG9yZHMgPSBudWxsO1xuICAgICAgcmV0dXJuIGNob3JkO1xuICAgIH07XG4gICAgY2hvcmQuc29ydENob3JkcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHNvcnRDaG9yZHM7XG4gICAgICBzb3J0Q2hvcmRzID0geDtcbiAgICAgIGlmIChjaG9yZHMpIHJlc29ydCgpO1xuICAgICAgcmV0dXJuIGNob3JkO1xuICAgIH07XG4gICAgY2hvcmQuY2hvcmRzID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIWNob3JkcykgcmVsYXlvdXQoKTtcbiAgICAgIHJldHVybiBjaG9yZHM7XG4gICAgfTtcbiAgICBjaG9yZC5ncm91cHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghZ3JvdXBzKSByZWxheW91dCgpO1xuICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICB9O1xuICAgIHJldHVybiBjaG9yZDtcbiAgfTtcbiAgZDMubGF5b3V0LmZvcmNlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvcmNlID0ge30sIGV2ZW50ID0gZDMuZGlzcGF0Y2goXCJzdGFydFwiLCBcInRpY2tcIiwgXCJlbmRcIiksIHRpbWVyLCBzaXplID0gWyAxLCAxIF0sIGRyYWcsIGFscGhhLCBmcmljdGlvbiA9IC45LCBsaW5rRGlzdGFuY2UgPSBkM19sYXlvdXRfZm9yY2VMaW5rRGlzdGFuY2UsIGxpbmtTdHJlbmd0aCA9IGQzX2xheW91dF9mb3JjZUxpbmtTdHJlbmd0aCwgY2hhcmdlID0gLTMwLCBjaGFyZ2VEaXN0YW5jZTIgPSBkM19sYXlvdXRfZm9yY2VDaGFyZ2VEaXN0YW5jZTIsIGdyYXZpdHkgPSAuMSwgdGhldGEyID0gLjY0LCBub2RlcyA9IFtdLCBsaW5rcyA9IFtdLCBkaXN0YW5jZXMsIHN0cmVuZ3RocywgY2hhcmdlcztcbiAgICBmdW5jdGlvbiByZXB1bHNlKG5vZGUpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihxdWFkLCB4MSwgXywgeDIpIHtcbiAgICAgICAgaWYgKHF1YWQucG9pbnQgIT09IG5vZGUpIHtcbiAgICAgICAgICB2YXIgZHggPSBxdWFkLmN4IC0gbm9kZS54LCBkeSA9IHF1YWQuY3kgLSBub2RlLnksIGR3ID0geDIgLSB4MSwgZG4gPSBkeCAqIGR4ICsgZHkgKiBkeTtcbiAgICAgICAgICBpZiAoZHcgKiBkdyAvIHRoZXRhMiA8IGRuKSB7XG4gICAgICAgICAgICBpZiAoZG4gPCBjaGFyZ2VEaXN0YW5jZTIpIHtcbiAgICAgICAgICAgICAgdmFyIGsgPSBxdWFkLmNoYXJnZSAvIGRuO1xuICAgICAgICAgICAgICBub2RlLnB4IC09IGR4ICogaztcbiAgICAgICAgICAgICAgbm9kZS5weSAtPSBkeSAqIGs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHF1YWQucG9pbnQgJiYgZG4gJiYgZG4gPCBjaGFyZ2VEaXN0YW5jZTIpIHtcbiAgICAgICAgICAgIHZhciBrID0gcXVhZC5wb2ludENoYXJnZSAvIGRuO1xuICAgICAgICAgICAgbm9kZS5weCAtPSBkeCAqIGs7XG4gICAgICAgICAgICBub2RlLnB5IC09IGR5ICogaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICFxdWFkLmNoYXJnZTtcbiAgICAgIH07XG4gICAgfVxuICAgIGZvcmNlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgoYWxwaGEgKj0gLjk5KSA8IC4wMDUpIHtcbiAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICBldmVudC5lbmQoe1xuICAgICAgICAgIHR5cGU6IFwiZW5kXCIsXG4gICAgICAgICAgYWxwaGE6IGFscGhhID0gMFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgbiA9IG5vZGVzLmxlbmd0aCwgbSA9IGxpbmtzLmxlbmd0aCwgcSwgaSwgbywgcywgdCwgbCwgaywgeCwgeTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBtOyArK2kpIHtcbiAgICAgICAgbyA9IGxpbmtzW2ldO1xuICAgICAgICBzID0gby5zb3VyY2U7XG4gICAgICAgIHQgPSBvLnRhcmdldDtcbiAgICAgICAgeCA9IHQueCAtIHMueDtcbiAgICAgICAgeSA9IHQueSAtIHMueTtcbiAgICAgICAgaWYgKGwgPSB4ICogeCArIHkgKiB5KSB7XG4gICAgICAgICAgbCA9IGFscGhhICogc3RyZW5ndGhzW2ldICogKChsID0gTWF0aC5zcXJ0KGwpKSAtIGRpc3RhbmNlc1tpXSkgLyBsO1xuICAgICAgICAgIHggKj0gbDtcbiAgICAgICAgICB5ICo9IGw7XG4gICAgICAgICAgdC54IC09IHggKiAoayA9IHMud2VpZ2h0ICsgdC53ZWlnaHQgPyBzLndlaWdodCAvIChzLndlaWdodCArIHQud2VpZ2h0KSA6IC41KTtcbiAgICAgICAgICB0LnkgLT0geSAqIGs7XG4gICAgICAgICAgcy54ICs9IHggKiAoayA9IDEgLSBrKTtcbiAgICAgICAgICBzLnkgKz0geSAqIGs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChrID0gYWxwaGEgKiBncmF2aXR5KSB7XG4gICAgICAgIHggPSBzaXplWzBdIC8gMjtcbiAgICAgICAgeSA9IHNpemVbMV0gLyAyO1xuICAgICAgICBpID0gLTE7XG4gICAgICAgIGlmIChrKSB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICAgIG8gPSBub2Rlc1tpXTtcbiAgICAgICAgICBvLnggKz0gKHggLSBvLngpICogaztcbiAgICAgICAgICBvLnkgKz0gKHkgLSBvLnkpICogaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGNoYXJnZSkge1xuICAgICAgICBkM19sYXlvdXRfZm9yY2VBY2N1bXVsYXRlKHEgPSBkMy5nZW9tLnF1YWR0cmVlKG5vZGVzKSwgYWxwaGEsIGNoYXJnZXMpO1xuICAgICAgICBpID0gLTE7XG4gICAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgICAgaWYgKCEobyA9IG5vZGVzW2ldKS5maXhlZCkge1xuICAgICAgICAgICAgcS52aXNpdChyZXB1bHNlKG8pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGkgPSAtMTtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgIG8gPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG8uZml4ZWQpIHtcbiAgICAgICAgICBvLnggPSBvLnB4O1xuICAgICAgICAgIG8ueSA9IG8ucHk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgby54IC09IChvLnB4IC0gKG8ucHggPSBvLngpKSAqIGZyaWN0aW9uO1xuICAgICAgICAgIG8ueSAtPSAoby5weSAtIChvLnB5ID0gby55KSkgKiBmcmljdGlvbjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZXZlbnQudGljayh7XG4gICAgICAgIHR5cGU6IFwidGlja1wiLFxuICAgICAgICBhbHBoYTogYWxwaGFcbiAgICAgIH0pO1xuICAgIH07XG4gICAgZm9yY2Uubm9kZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBub2RlcztcbiAgICAgIG5vZGVzID0geDtcbiAgICAgIHJldHVybiBmb3JjZTtcbiAgICB9O1xuICAgIGZvcmNlLmxpbmtzID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gbGlua3M7XG4gICAgICBsaW5rcyA9IHg7XG4gICAgICByZXR1cm4gZm9yY2U7XG4gICAgfTtcbiAgICBmb3JjZS5zaXplID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2l6ZTtcbiAgICAgIHNpemUgPSB4O1xuICAgICAgcmV0dXJuIGZvcmNlO1xuICAgIH07XG4gICAgZm9yY2UubGlua0Rpc3RhbmNlID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gbGlua0Rpc3RhbmNlO1xuICAgICAgbGlua0Rpc3RhbmNlID0gdHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIiA/IHggOiAreDtcbiAgICAgIHJldHVybiBmb3JjZTtcbiAgICB9O1xuICAgIGZvcmNlLmRpc3RhbmNlID0gZm9yY2UubGlua0Rpc3RhbmNlO1xuICAgIGZvcmNlLmxpbmtTdHJlbmd0aCA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGxpbmtTdHJlbmd0aDtcbiAgICAgIGxpbmtTdHJlbmd0aCA9IHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCIgPyB4IDogK3g7XG4gICAgICByZXR1cm4gZm9yY2U7XG4gICAgfTtcbiAgICBmb3JjZS5mcmljdGlvbiA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGZyaWN0aW9uO1xuICAgICAgZnJpY3Rpb24gPSAreDtcbiAgICAgIHJldHVybiBmb3JjZTtcbiAgICB9O1xuICAgIGZvcmNlLmNoYXJnZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGNoYXJnZTtcbiAgICAgIGNoYXJnZSA9IHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCIgPyB4IDogK3g7XG4gICAgICByZXR1cm4gZm9yY2U7XG4gICAgfTtcbiAgICBmb3JjZS5jaGFyZ2VEaXN0YW5jZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIE1hdGguc3FydChjaGFyZ2VEaXN0YW5jZTIpO1xuICAgICAgY2hhcmdlRGlzdGFuY2UyID0geCAqIHg7XG4gICAgICByZXR1cm4gZm9yY2U7XG4gICAgfTtcbiAgICBmb3JjZS5ncmF2aXR5ID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZ3Jhdml0eTtcbiAgICAgIGdyYXZpdHkgPSAreDtcbiAgICAgIHJldHVybiBmb3JjZTtcbiAgICB9O1xuICAgIGZvcmNlLnRoZXRhID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gTWF0aC5zcXJ0KHRoZXRhMik7XG4gICAgICB0aGV0YTIgPSB4ICogeDtcbiAgICAgIHJldHVybiBmb3JjZTtcbiAgICB9O1xuICAgIGZvcmNlLmFscGhhID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gYWxwaGE7XG4gICAgICB4ID0gK3g7XG4gICAgICBpZiAoYWxwaGEpIHtcbiAgICAgICAgaWYgKHggPiAwKSB7XG4gICAgICAgICAgYWxwaGEgPSB4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRpbWVyLmMgPSBudWxsLCB0aW1lci50ID0gTmFOLCB0aW1lciA9IG51bGw7XG4gICAgICAgICAgZXZlbnQuZW5kKHtcbiAgICAgICAgICAgIHR5cGU6IFwiZW5kXCIsXG4gICAgICAgICAgICBhbHBoYTogYWxwaGEgPSAwXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoeCA+IDApIHtcbiAgICAgICAgZXZlbnQuc3RhcnQoe1xuICAgICAgICAgIHR5cGU6IFwic3RhcnRcIixcbiAgICAgICAgICBhbHBoYTogYWxwaGEgPSB4XG4gICAgICAgIH0pO1xuICAgICAgICB0aW1lciA9IGQzX3RpbWVyKGZvcmNlLnRpY2spO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZvcmNlO1xuICAgIH07XG4gICAgZm9yY2Uuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpLCBuID0gbm9kZXMubGVuZ3RoLCBtID0gbGlua3MubGVuZ3RoLCB3ID0gc2l6ZVswXSwgaCA9IHNpemVbMV0sIG5laWdoYm9ycywgbztcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgKG8gPSBub2Rlc1tpXSkuaW5kZXggPSBpO1xuICAgICAgICBvLndlaWdodCA9IDA7XG4gICAgICB9XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbTsgKytpKSB7XG4gICAgICAgIG8gPSBsaW5rc1tpXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvLnNvdXJjZSA9PSBcIm51bWJlclwiKSBvLnNvdXJjZSA9IG5vZGVzW28uc291cmNlXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvLnRhcmdldCA9PSBcIm51bWJlclwiKSBvLnRhcmdldCA9IG5vZGVzW28udGFyZ2V0XTtcbiAgICAgICAgKytvLnNvdXJjZS53ZWlnaHQ7XG4gICAgICAgICsrby50YXJnZXQud2VpZ2h0O1xuICAgICAgfVxuICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICBvID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChpc05hTihvLngpKSBvLnggPSBwb3NpdGlvbihcInhcIiwgdyk7XG4gICAgICAgIGlmIChpc05hTihvLnkpKSBvLnkgPSBwb3NpdGlvbihcInlcIiwgaCk7XG4gICAgICAgIGlmIChpc05hTihvLnB4KSkgby5weCA9IG8ueDtcbiAgICAgICAgaWYgKGlzTmFOKG8ucHkpKSBvLnB5ID0gby55O1xuICAgICAgfVxuICAgICAgZGlzdGFuY2VzID0gW107XG4gICAgICBpZiAodHlwZW9mIGxpbmtEaXN0YW5jZSA9PT0gXCJmdW5jdGlvblwiKSBmb3IgKGkgPSAwOyBpIDwgbTsgKytpKSBkaXN0YW5jZXNbaV0gPSArbGlua0Rpc3RhbmNlLmNhbGwodGhpcywgbGlua3NbaV0sIGkpOyBlbHNlIGZvciAoaSA9IDA7IGkgPCBtOyArK2kpIGRpc3RhbmNlc1tpXSA9IGxpbmtEaXN0YW5jZTtcbiAgICAgIHN0cmVuZ3RocyA9IFtdO1xuICAgICAgaWYgKHR5cGVvZiBsaW5rU3RyZW5ndGggPT09IFwiZnVuY3Rpb25cIikgZm9yIChpID0gMDsgaSA8IG07ICsraSkgc3RyZW5ndGhzW2ldID0gK2xpbmtTdHJlbmd0aC5jYWxsKHRoaXMsIGxpbmtzW2ldLCBpKTsgZWxzZSBmb3IgKGkgPSAwOyBpIDwgbTsgKytpKSBzdHJlbmd0aHNbaV0gPSBsaW5rU3RyZW5ndGg7XG4gICAgICBjaGFyZ2VzID0gW107XG4gICAgICBpZiAodHlwZW9mIGNoYXJnZSA9PT0gXCJmdW5jdGlvblwiKSBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSBjaGFyZ2VzW2ldID0gK2NoYXJnZS5jYWxsKHRoaXMsIG5vZGVzW2ldLCBpKTsgZWxzZSBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSBjaGFyZ2VzW2ldID0gY2hhcmdlO1xuICAgICAgZnVuY3Rpb24gcG9zaXRpb24oZGltZW5zaW9uLCBzaXplKSB7XG4gICAgICAgIGlmICghbmVpZ2hib3JzKSB7XG4gICAgICAgICAgbmVpZ2hib3JzID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBuOyArK2opIHtcbiAgICAgICAgICAgIG5laWdoYm9yc1tqXSA9IFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbTsgKytqKSB7XG4gICAgICAgICAgICB2YXIgbyA9IGxpbmtzW2pdO1xuICAgICAgICAgICAgbmVpZ2hib3JzW28uc291cmNlLmluZGV4XS5wdXNoKG8udGFyZ2V0KTtcbiAgICAgICAgICAgIG5laWdoYm9yc1tvLnRhcmdldC5pbmRleF0ucHVzaChvLnNvdXJjZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBjYW5kaWRhdGVzID0gbmVpZ2hib3JzW2ldLCBqID0gLTEsIGwgPSBjYW5kaWRhdGVzLmxlbmd0aCwgeDtcbiAgICAgICAgd2hpbGUgKCsraiA8IGwpIGlmICghaXNOYU4oeCA9IGNhbmRpZGF0ZXNbal1bZGltZW5zaW9uXSkpIHJldHVybiB4O1xuICAgICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIHNpemU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZm9yY2UucmVzdW1lKCk7XG4gICAgfTtcbiAgICBmb3JjZS5yZXN1bWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmb3JjZS5hbHBoYSguMSk7XG4gICAgfTtcbiAgICBmb3JjZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZm9yY2UuYWxwaGEoMCk7XG4gICAgfTtcbiAgICBmb3JjZS5kcmFnID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIWRyYWcpIGRyYWcgPSBkMy5iZWhhdmlvci5kcmFnKCkub3JpZ2luKGQzX2lkZW50aXR5KS5vbihcImRyYWdzdGFydC5mb3JjZVwiLCBkM19sYXlvdXRfZm9yY2VEcmFnc3RhcnQpLm9uKFwiZHJhZy5mb3JjZVwiLCBkcmFnbW92ZSkub24oXCJkcmFnZW5kLmZvcmNlXCIsIGQzX2xheW91dF9mb3JjZURyYWdlbmQpO1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZHJhZztcbiAgICAgIHRoaXMub24oXCJtb3VzZW92ZXIuZm9yY2VcIiwgZDNfbGF5b3V0X2ZvcmNlTW91c2VvdmVyKS5vbihcIm1vdXNlb3V0LmZvcmNlXCIsIGQzX2xheW91dF9mb3JjZU1vdXNlb3V0KS5jYWxsKGRyYWcpO1xuICAgIH07XG4gICAgZnVuY3Rpb24gZHJhZ21vdmUoZCkge1xuICAgICAgZC5weCA9IGQzLmV2ZW50LngsIGQucHkgPSBkMy5ldmVudC55O1xuICAgICAgZm9yY2UucmVzdW1lKCk7XG4gICAgfVxuICAgIHJldHVybiBkMy5yZWJpbmQoZm9yY2UsIGV2ZW50LCBcIm9uXCIpO1xuICB9O1xuICBmdW5jdGlvbiBkM19sYXlvdXRfZm9yY2VEcmFnc3RhcnQoZCkge1xuICAgIGQuZml4ZWQgfD0gMjtcbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfZm9yY2VEcmFnZW5kKGQpIHtcbiAgICBkLmZpeGVkICY9IH42O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9mb3JjZU1vdXNlb3ZlcihkKSB7XG4gICAgZC5maXhlZCB8PSA0O1xuICAgIGQucHggPSBkLngsIGQucHkgPSBkLnk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X2ZvcmNlTW91c2VvdXQoZCkge1xuICAgIGQuZml4ZWQgJj0gfjQ7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X2ZvcmNlQWNjdW11bGF0ZShxdWFkLCBhbHBoYSwgY2hhcmdlcykge1xuICAgIHZhciBjeCA9IDAsIGN5ID0gMDtcbiAgICBxdWFkLmNoYXJnZSA9IDA7XG4gICAgaWYgKCFxdWFkLmxlYWYpIHtcbiAgICAgIHZhciBub2RlcyA9IHF1YWQubm9kZXMsIG4gPSBub2Rlcy5sZW5ndGgsIGkgPSAtMSwgYztcbiAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgIGMgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKGMgPT0gbnVsbCkgY29udGludWU7XG4gICAgICAgIGQzX2xheW91dF9mb3JjZUFjY3VtdWxhdGUoYywgYWxwaGEsIGNoYXJnZXMpO1xuICAgICAgICBxdWFkLmNoYXJnZSArPSBjLmNoYXJnZTtcbiAgICAgICAgY3ggKz0gYy5jaGFyZ2UgKiBjLmN4O1xuICAgICAgICBjeSArPSBjLmNoYXJnZSAqIGMuY3k7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChxdWFkLnBvaW50KSB7XG4gICAgICBpZiAoIXF1YWQubGVhZikge1xuICAgICAgICBxdWFkLnBvaW50LnggKz0gTWF0aC5yYW5kb20oKSAtIC41O1xuICAgICAgICBxdWFkLnBvaW50LnkgKz0gTWF0aC5yYW5kb20oKSAtIC41O1xuICAgICAgfVxuICAgICAgdmFyIGsgPSBhbHBoYSAqIGNoYXJnZXNbcXVhZC5wb2ludC5pbmRleF07XG4gICAgICBxdWFkLmNoYXJnZSArPSBxdWFkLnBvaW50Q2hhcmdlID0gaztcbiAgICAgIGN4ICs9IGsgKiBxdWFkLnBvaW50Lng7XG4gICAgICBjeSArPSBrICogcXVhZC5wb2ludC55O1xuICAgIH1cbiAgICBxdWFkLmN4ID0gY3ggLyBxdWFkLmNoYXJnZTtcbiAgICBxdWFkLmN5ID0gY3kgLyBxdWFkLmNoYXJnZTtcbiAgfVxuICB2YXIgZDNfbGF5b3V0X2ZvcmNlTGlua0Rpc3RhbmNlID0gMjAsIGQzX2xheW91dF9mb3JjZUxpbmtTdHJlbmd0aCA9IDEsIGQzX2xheW91dF9mb3JjZUNoYXJnZURpc3RhbmNlMiA9IEluZmluaXR5O1xuICBkMy5sYXlvdXQuaGllcmFyY2h5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNvcnQgPSBkM19sYXlvdXRfaGllcmFyY2h5U29ydCwgY2hpbGRyZW4gPSBkM19sYXlvdXRfaGllcmFyY2h5Q2hpbGRyZW4sIHZhbHVlID0gZDNfbGF5b3V0X2hpZXJhcmNoeVZhbHVlO1xuICAgIGZ1bmN0aW9uIGhpZXJhcmNoeShyb290KSB7XG4gICAgICB2YXIgc3RhY2sgPSBbIHJvb3QgXSwgbm9kZXMgPSBbXSwgbm9kZTtcbiAgICAgIHJvb3QuZGVwdGggPSAwO1xuICAgICAgd2hpbGUgKChub2RlID0gc3RhY2sucG9wKCkpICE9IG51bGwpIHtcbiAgICAgICAgbm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgaWYgKChjaGlsZHMgPSBjaGlsZHJlbi5jYWxsKGhpZXJhcmNoeSwgbm9kZSwgbm9kZS5kZXB0aCkpICYmIChuID0gY2hpbGRzLmxlbmd0aCkpIHtcbiAgICAgICAgICB2YXIgbiwgY2hpbGRzLCBjaGlsZDtcbiAgICAgICAgICB3aGlsZSAoLS1uID49IDApIHtcbiAgICAgICAgICAgIHN0YWNrLnB1c2goY2hpbGQgPSBjaGlsZHNbbl0pO1xuICAgICAgICAgICAgY2hpbGQucGFyZW50ID0gbm9kZTtcbiAgICAgICAgICAgIGNoaWxkLmRlcHRoID0gbm9kZS5kZXB0aCArIDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh2YWx1ZSkgbm9kZS52YWx1ZSA9IDA7XG4gICAgICAgICAgbm9kZS5jaGlsZHJlbiA9IGNoaWxkcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodmFsdWUpIG5vZGUudmFsdWUgPSArdmFsdWUuY2FsbChoaWVyYXJjaHksIG5vZGUsIG5vZGUuZGVwdGgpIHx8IDA7XG4gICAgICAgICAgZGVsZXRlIG5vZGUuY2hpbGRyZW47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGQzX2xheW91dF9oaWVyYXJjaHlWaXNpdEFmdGVyKHJvb3QsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIGNoaWxkcywgcGFyZW50O1xuICAgICAgICBpZiAoc29ydCAmJiAoY2hpbGRzID0gbm9kZS5jaGlsZHJlbikpIGNoaWxkcy5zb3J0KHNvcnQpO1xuICAgICAgICBpZiAodmFsdWUgJiYgKHBhcmVudCA9IG5vZGUucGFyZW50KSkgcGFyZW50LnZhbHVlICs9IG5vZGUudmFsdWU7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBub2RlcztcbiAgICB9XG4gICAgaGllcmFyY2h5LnNvcnQgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzb3J0O1xuICAgICAgc29ydCA9IHg7XG4gICAgICByZXR1cm4gaGllcmFyY2h5O1xuICAgIH07XG4gICAgaGllcmFyY2h5LmNoaWxkcmVuID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gY2hpbGRyZW47XG4gICAgICBjaGlsZHJlbiA9IHg7XG4gICAgICByZXR1cm4gaGllcmFyY2h5O1xuICAgIH07XG4gICAgaGllcmFyY2h5LnZhbHVlID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdmFsdWU7XG4gICAgICB2YWx1ZSA9IHg7XG4gICAgICByZXR1cm4gaGllcmFyY2h5O1xuICAgIH07XG4gICAgaGllcmFyY2h5LnJldmFsdWUgPSBmdW5jdGlvbihyb290KSB7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgZDNfbGF5b3V0X2hpZXJhcmNoeVZpc2l0QmVmb3JlKHJvb3QsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikgbm9kZS52YWx1ZSA9IDA7XG4gICAgICAgIH0pO1xuICAgICAgICBkM19sYXlvdXRfaGllcmFyY2h5VmlzaXRBZnRlcihyb290LCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgdmFyIHBhcmVudDtcbiAgICAgICAgICBpZiAoIW5vZGUuY2hpbGRyZW4pIG5vZGUudmFsdWUgPSArdmFsdWUuY2FsbChoaWVyYXJjaHksIG5vZGUsIG5vZGUuZGVwdGgpIHx8IDA7XG4gICAgICAgICAgaWYgKHBhcmVudCA9IG5vZGUucGFyZW50KSBwYXJlbnQudmFsdWUgKz0gbm9kZS52YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcm9vdDtcbiAgICB9O1xuICAgIHJldHVybiBoaWVyYXJjaHk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9oaWVyYXJjaHlSZWJpbmQob2JqZWN0LCBoaWVyYXJjaHkpIHtcbiAgICBkMy5yZWJpbmQob2JqZWN0LCBoaWVyYXJjaHksIFwic29ydFwiLCBcImNoaWxkcmVuXCIsIFwidmFsdWVcIik7XG4gICAgb2JqZWN0Lm5vZGVzID0gb2JqZWN0O1xuICAgIG9iamVjdC5saW5rcyA9IGQzX2xheW91dF9oaWVyYXJjaHlMaW5rcztcbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9oaWVyYXJjaHlWaXNpdEJlZm9yZShub2RlLCBjYWxsYmFjaykge1xuICAgIHZhciBub2RlcyA9IFsgbm9kZSBdO1xuICAgIHdoaWxlICgobm9kZSA9IG5vZGVzLnBvcCgpKSAhPSBudWxsKSB7XG4gICAgICBjYWxsYmFjayhub2RlKTtcbiAgICAgIGlmICgoY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuKSAmJiAobiA9IGNoaWxkcmVuLmxlbmd0aCkpIHtcbiAgICAgICAgdmFyIG4sIGNoaWxkcmVuO1xuICAgICAgICB3aGlsZSAoLS1uID49IDApIG5vZGVzLnB1c2goY2hpbGRyZW5bbl0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfaGllcmFyY2h5VmlzaXRBZnRlcihub2RlLCBjYWxsYmFjaykge1xuICAgIHZhciBub2RlcyA9IFsgbm9kZSBdLCBub2RlczIgPSBbXTtcbiAgICB3aGlsZSAoKG5vZGUgPSBub2Rlcy5wb3AoKSkgIT0gbnVsbCkge1xuICAgICAgbm9kZXMyLnB1c2gobm9kZSk7XG4gICAgICBpZiAoKGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbikgJiYgKG4gPSBjaGlsZHJlbi5sZW5ndGgpKSB7XG4gICAgICAgIHZhciBpID0gLTEsIG4sIGNoaWxkcmVuO1xuICAgICAgICB3aGlsZSAoKytpIDwgbikgbm9kZXMucHVzaChjaGlsZHJlbltpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHdoaWxlICgobm9kZSA9IG5vZGVzMi5wb3AoKSkgIT0gbnVsbCkge1xuICAgICAgY2FsbGJhY2sobm9kZSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9oaWVyYXJjaHlDaGlsZHJlbihkKSB7XG4gICAgcmV0dXJuIGQuY2hpbGRyZW47XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X2hpZXJhcmNoeVZhbHVlKGQpIHtcbiAgICByZXR1cm4gZC52YWx1ZTtcbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfaGllcmFyY2h5U29ydChhLCBiKSB7XG4gICAgcmV0dXJuIGIudmFsdWUgLSBhLnZhbHVlO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9oaWVyYXJjaHlMaW5rcyhub2Rlcykge1xuICAgIHJldHVybiBkMy5tZXJnZShub2Rlcy5tYXAoZnVuY3Rpb24ocGFyZW50KSB7XG4gICAgICByZXR1cm4gKHBhcmVudC5jaGlsZHJlbiB8fCBbXSkubWFwKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc291cmNlOiBwYXJlbnQsXG4gICAgICAgICAgdGFyZ2V0OiBjaGlsZFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSkpO1xuICB9XG4gIGQzLmxheW91dC5wYXJ0aXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGllcmFyY2h5ID0gZDMubGF5b3V0LmhpZXJhcmNoeSgpLCBzaXplID0gWyAxLCAxIF07XG4gICAgZnVuY3Rpb24gcG9zaXRpb24obm9kZSwgeCwgZHgsIGR5KSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuO1xuICAgICAgbm9kZS54ID0geDtcbiAgICAgIG5vZGUueSA9IG5vZGUuZGVwdGggKiBkeTtcbiAgICAgIG5vZGUuZHggPSBkeDtcbiAgICAgIG5vZGUuZHkgPSBkeTtcbiAgICAgIGlmIChjaGlsZHJlbiAmJiAobiA9IGNoaWxkcmVuLmxlbmd0aCkpIHtcbiAgICAgICAgdmFyIGkgPSAtMSwgbiwgYywgZDtcbiAgICAgICAgZHggPSBub2RlLnZhbHVlID8gZHggLyBub2RlLnZhbHVlIDogMDtcbiAgICAgICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgICAgICBwb3NpdGlvbihjID0gY2hpbGRyZW5baV0sIHgsIGQgPSBjLnZhbHVlICogZHgsIGR5KTtcbiAgICAgICAgICB4ICs9IGQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZGVwdGgobm9kZSkge1xuICAgICAgdmFyIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbiwgZCA9IDA7XG4gICAgICBpZiAoY2hpbGRyZW4gJiYgKG4gPSBjaGlsZHJlbi5sZW5ndGgpKSB7XG4gICAgICAgIHZhciBpID0gLTEsIG47XG4gICAgICAgIHdoaWxlICgrK2kgPCBuKSBkID0gTWF0aC5tYXgoZCwgZGVwdGgoY2hpbGRyZW5baV0pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAxICsgZDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGFydGl0aW9uKGQsIGkpIHtcbiAgICAgIHZhciBub2RlcyA9IGhpZXJhcmNoeS5jYWxsKHRoaXMsIGQsIGkpO1xuICAgICAgcG9zaXRpb24obm9kZXNbMF0sIDAsIHNpemVbMF0sIHNpemVbMV0gLyBkZXB0aChub2Rlc1swXSkpO1xuICAgICAgcmV0dXJuIG5vZGVzO1xuICAgIH1cbiAgICBwYXJ0aXRpb24uc2l6ZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHNpemU7XG4gICAgICBzaXplID0geDtcbiAgICAgIHJldHVybiBwYXJ0aXRpb247XG4gICAgfTtcbiAgICByZXR1cm4gZDNfbGF5b3V0X2hpZXJhcmNoeVJlYmluZChwYXJ0aXRpb24sIGhpZXJhcmNoeSk7XG4gIH07XG4gIGQzLmxheW91dC5waWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSBOdW1iZXIsIHNvcnQgPSBkM19sYXlvdXRfcGllU29ydEJ5VmFsdWUsIHN0YXJ0QW5nbGUgPSAwLCBlbmRBbmdsZSA9IM+ELCBwYWRBbmdsZSA9IDA7XG4gICAgZnVuY3Rpb24gcGllKGRhdGEpIHtcbiAgICAgIHZhciBuID0gZGF0YS5sZW5ndGgsIHZhbHVlcyA9IGRhdGEubWFwKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuICt2YWx1ZS5jYWxsKHBpZSwgZCwgaSk7XG4gICAgICB9KSwgYSA9ICsodHlwZW9mIHN0YXJ0QW5nbGUgPT09IFwiZnVuY3Rpb25cIiA/IHN0YXJ0QW5nbGUuYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IHN0YXJ0QW5nbGUpLCBkYSA9ICh0eXBlb2YgZW5kQW5nbGUgPT09IFwiZnVuY3Rpb25cIiA/IGVuZEFuZ2xlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgOiBlbmRBbmdsZSkgLSBhLCBwID0gTWF0aC5taW4oTWF0aC5hYnMoZGEpIC8gbiwgKyh0eXBlb2YgcGFkQW5nbGUgPT09IFwiZnVuY3Rpb25cIiA/IHBhZEFuZ2xlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgOiBwYWRBbmdsZSkpLCBwYSA9IHAgKiAoZGEgPCAwID8gLTEgOiAxKSwgc3VtID0gZDMuc3VtKHZhbHVlcyksIGsgPSBzdW0gPyAoZGEgLSBuICogcGEpIC8gc3VtIDogMCwgaW5kZXggPSBkMy5yYW5nZShuKSwgYXJjcyA9IFtdLCB2O1xuICAgICAgaWYgKHNvcnQgIT0gbnVsbCkgaW5kZXguc29ydChzb3J0ID09PSBkM19sYXlvdXRfcGllU29ydEJ5VmFsdWUgPyBmdW5jdGlvbihpLCBqKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZXNbal0gLSB2YWx1ZXNbaV07XG4gICAgICB9IDogZnVuY3Rpb24oaSwgaikge1xuICAgICAgICByZXR1cm4gc29ydChkYXRhW2ldLCBkYXRhW2pdKTtcbiAgICAgIH0pO1xuICAgICAgaW5kZXguZm9yRWFjaChmdW5jdGlvbihpKSB7XG4gICAgICAgIGFyY3NbaV0gPSB7XG4gICAgICAgICAgZGF0YTogZGF0YVtpXSxcbiAgICAgICAgICB2YWx1ZTogdiA9IHZhbHVlc1tpXSxcbiAgICAgICAgICBzdGFydEFuZ2xlOiBhLFxuICAgICAgICAgIGVuZEFuZ2xlOiBhICs9IHYgKiBrICsgcGEsXG4gICAgICAgICAgcGFkQW5nbGU6IHBcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFyY3M7XG4gICAgfVxuICAgIHBpZS52YWx1ZSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHZhbHVlO1xuICAgICAgdmFsdWUgPSBfO1xuICAgICAgcmV0dXJuIHBpZTtcbiAgICB9O1xuICAgIHBpZS5zb3J0ID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc29ydDtcbiAgICAgIHNvcnQgPSBfO1xuICAgICAgcmV0dXJuIHBpZTtcbiAgICB9O1xuICAgIHBpZS5zdGFydEFuZ2xlID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc3RhcnRBbmdsZTtcbiAgICAgIHN0YXJ0QW5nbGUgPSBfO1xuICAgICAgcmV0dXJuIHBpZTtcbiAgICB9O1xuICAgIHBpZS5lbmRBbmdsZSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGVuZEFuZ2xlO1xuICAgICAgZW5kQW5nbGUgPSBfO1xuICAgICAgcmV0dXJuIHBpZTtcbiAgICB9O1xuICAgIHBpZS5wYWRBbmdsZSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHBhZEFuZ2xlO1xuICAgICAgcGFkQW5nbGUgPSBfO1xuICAgICAgcmV0dXJuIHBpZTtcbiAgICB9O1xuICAgIHJldHVybiBwaWU7XG4gIH07XG4gIHZhciBkM19sYXlvdXRfcGllU29ydEJ5VmFsdWUgPSB7fTtcbiAgZDMubGF5b3V0LnN0YWNrID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlcyA9IGQzX2lkZW50aXR5LCBvcmRlciA9IGQzX2xheW91dF9zdGFja09yZGVyRGVmYXVsdCwgb2Zmc2V0ID0gZDNfbGF5b3V0X3N0YWNrT2Zmc2V0WmVybywgb3V0ID0gZDNfbGF5b3V0X3N0YWNrT3V0LCB4ID0gZDNfbGF5b3V0X3N0YWNrWCwgeSA9IGQzX2xheW91dF9zdGFja1k7XG4gICAgZnVuY3Rpb24gc3RhY2soZGF0YSwgaW5kZXgpIHtcbiAgICAgIGlmICghKG4gPSBkYXRhLmxlbmd0aCkpIHJldHVybiBkYXRhO1xuICAgICAgdmFyIHNlcmllcyA9IGRhdGEubWFwKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlcy5jYWxsKHN0YWNrLCBkLCBpKTtcbiAgICAgIH0pO1xuICAgICAgdmFyIHBvaW50cyA9IHNlcmllcy5tYXAoZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5tYXAoZnVuY3Rpb24odiwgaSkge1xuICAgICAgICAgIHJldHVybiBbIHguY2FsbChzdGFjaywgdiwgaSksIHkuY2FsbChzdGFjaywgdiwgaSkgXTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHZhciBvcmRlcnMgPSBvcmRlci5jYWxsKHN0YWNrLCBwb2ludHMsIGluZGV4KTtcbiAgICAgIHNlcmllcyA9IGQzLnBlcm11dGUoc2VyaWVzLCBvcmRlcnMpO1xuICAgICAgcG9pbnRzID0gZDMucGVybXV0ZShwb2ludHMsIG9yZGVycyk7XG4gICAgICB2YXIgb2Zmc2V0cyA9IG9mZnNldC5jYWxsKHN0YWNrLCBwb2ludHMsIGluZGV4KTtcbiAgICAgIHZhciBtID0gc2VyaWVzWzBdLmxlbmd0aCwgbiwgaSwgaiwgbztcbiAgICAgIGZvciAoaiA9IDA7IGogPCBtOyArK2opIHtcbiAgICAgICAgb3V0LmNhbGwoc3RhY2ssIHNlcmllc1swXVtqXSwgbyA9IG9mZnNldHNbal0sIHBvaW50c1swXVtqXVsxXSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBvdXQuY2FsbChzdGFjaywgc2VyaWVzW2ldW2pdLCBvICs9IHBvaW50c1tpIC0gMV1bal1bMV0sIHBvaW50c1tpXVtqXVsxXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbiAgICBzdGFjay52YWx1ZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB2YWx1ZXM7XG4gICAgICB2YWx1ZXMgPSB4O1xuICAgICAgcmV0dXJuIHN0YWNrO1xuICAgIH07XG4gICAgc3RhY2sub3JkZXIgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBvcmRlcjtcbiAgICAgIG9yZGVyID0gdHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIiA/IHggOiBkM19sYXlvdXRfc3RhY2tPcmRlcnMuZ2V0KHgpIHx8IGQzX2xheW91dF9zdGFja09yZGVyRGVmYXVsdDtcbiAgICAgIHJldHVybiBzdGFjaztcbiAgICB9O1xuICAgIHN0YWNrLm9mZnNldCA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG9mZnNldDtcbiAgICAgIG9mZnNldCA9IHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCIgPyB4IDogZDNfbGF5b3V0X3N0YWNrT2Zmc2V0cy5nZXQoeCkgfHwgZDNfbGF5b3V0X3N0YWNrT2Zmc2V0WmVybztcbiAgICAgIHJldHVybiBzdGFjaztcbiAgICB9O1xuICAgIHN0YWNrLnggPSBmdW5jdGlvbih6KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB4O1xuICAgICAgeCA9IHo7XG4gICAgICByZXR1cm4gc3RhY2s7XG4gICAgfTtcbiAgICBzdGFjay55ID0gZnVuY3Rpb24oeikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4geTtcbiAgICAgIHkgPSB6O1xuICAgICAgcmV0dXJuIHN0YWNrO1xuICAgIH07XG4gICAgc3RhY2sub3V0ID0gZnVuY3Rpb24oeikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gb3V0O1xuICAgICAgb3V0ID0gejtcbiAgICAgIHJldHVybiBzdGFjaztcbiAgICB9O1xuICAgIHJldHVybiBzdGFjaztcbiAgfTtcbiAgZnVuY3Rpb24gZDNfbGF5b3V0X3N0YWNrWChkKSB7XG4gICAgcmV0dXJuIGQueDtcbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfc3RhY2tZKGQpIHtcbiAgICByZXR1cm4gZC55O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9zdGFja091dChkLCB5MCwgeSkge1xuICAgIGQueTAgPSB5MDtcbiAgICBkLnkgPSB5O1xuICB9XG4gIHZhciBkM19sYXlvdXRfc3RhY2tPcmRlcnMgPSBkMy5tYXAoe1xuICAgIFwiaW5zaWRlLW91dFwiOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgbiA9IGRhdGEubGVuZ3RoLCBpLCBqLCBtYXggPSBkYXRhLm1hcChkM19sYXlvdXRfc3RhY2tNYXhJbmRleCksIHN1bXMgPSBkYXRhLm1hcChkM19sYXlvdXRfc3RhY2tSZWR1Y2VTdW0pLCBpbmRleCA9IGQzLnJhbmdlKG4pLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICByZXR1cm4gbWF4W2FdIC0gbWF4W2JdO1xuICAgICAgfSksIHRvcCA9IDAsIGJvdHRvbSA9IDAsIHRvcHMgPSBbXSwgYm90dG9tcyA9IFtdO1xuICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICBqID0gaW5kZXhbaV07XG4gICAgICAgIGlmICh0b3AgPCBib3R0b20pIHtcbiAgICAgICAgICB0b3AgKz0gc3Vtc1tqXTtcbiAgICAgICAgICB0b3BzLnB1c2goaik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYm90dG9tICs9IHN1bXNbal07XG4gICAgICAgICAgYm90dG9tcy5wdXNoKGopO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gYm90dG9tcy5yZXZlcnNlKCkuY29uY2F0KHRvcHMpO1xuICAgIH0sXG4gICAgcmV2ZXJzZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIGQzLnJhbmdlKGRhdGEubGVuZ3RoKS5yZXZlcnNlKCk7XG4gICAgfSxcbiAgICBcImRlZmF1bHRcIjogZDNfbGF5b3V0X3N0YWNrT3JkZXJEZWZhdWx0XG4gIH0pO1xuICB2YXIgZDNfbGF5b3V0X3N0YWNrT2Zmc2V0cyA9IGQzLm1hcCh7XG4gICAgc2lsaG91ZXR0ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIG4gPSBkYXRhLmxlbmd0aCwgbSA9IGRhdGFbMF0ubGVuZ3RoLCBzdW1zID0gW10sIG1heCA9IDAsIGksIGosIG8sIHkwID0gW107XG4gICAgICBmb3IgKGogPSAwOyBqIDwgbTsgKytqKSB7XG4gICAgICAgIGZvciAoaSA9IDAsIG8gPSAwOyBpIDwgbjsgaSsrKSBvICs9IGRhdGFbaV1bal1bMV07XG4gICAgICAgIGlmIChvID4gbWF4KSBtYXggPSBvO1xuICAgICAgICBzdW1zLnB1c2gobyk7XG4gICAgICB9XG4gICAgICBmb3IgKGogPSAwOyBqIDwgbTsgKytqKSB7XG4gICAgICAgIHkwW2pdID0gKG1heCAtIHN1bXNbal0pIC8gMjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB5MDtcbiAgICB9LFxuICAgIHdpZ2dsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIG4gPSBkYXRhLmxlbmd0aCwgeCA9IGRhdGFbMF0sIG0gPSB4Lmxlbmd0aCwgaSwgaiwgaywgczEsIHMyLCBzMywgZHgsIG8sIG8wLCB5MCA9IFtdO1xuICAgICAgeTBbMF0gPSBvID0gbzAgPSAwO1xuICAgICAgZm9yIChqID0gMTsgaiA8IG07ICsraikge1xuICAgICAgICBmb3IgKGkgPSAwLCBzMSA9IDA7IGkgPCBuOyArK2kpIHMxICs9IGRhdGFbaV1bal1bMV07XG4gICAgICAgIGZvciAoaSA9IDAsIHMyID0gMCwgZHggPSB4W2pdWzBdIC0geFtqIC0gMV1bMF07IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBmb3IgKGsgPSAwLCBzMyA9IChkYXRhW2ldW2pdWzFdIC0gZGF0YVtpXVtqIC0gMV1bMV0pIC8gKDIgKiBkeCk7IGsgPCBpOyArK2spIHtcbiAgICAgICAgICAgIHMzICs9IChkYXRhW2tdW2pdWzFdIC0gZGF0YVtrXVtqIC0gMV1bMV0pIC8gZHg7XG4gICAgICAgICAgfVxuICAgICAgICAgIHMyICs9IHMzICogZGF0YVtpXVtqXVsxXTtcbiAgICAgICAgfVxuICAgICAgICB5MFtqXSA9IG8gLT0gczEgPyBzMiAvIHMxICogZHggOiAwO1xuICAgICAgICBpZiAobyA8IG8wKSBvMCA9IG87XG4gICAgICB9XG4gICAgICBmb3IgKGogPSAwOyBqIDwgbTsgKytqKSB5MFtqXSAtPSBvMDtcbiAgICAgIHJldHVybiB5MDtcbiAgICB9LFxuICAgIGV4cGFuZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIG4gPSBkYXRhLmxlbmd0aCwgbSA9IGRhdGFbMF0ubGVuZ3RoLCBrID0gMSAvIG4sIGksIGosIG8sIHkwID0gW107XG4gICAgICBmb3IgKGogPSAwOyBqIDwgbTsgKytqKSB7XG4gICAgICAgIGZvciAoaSA9IDAsIG8gPSAwOyBpIDwgbjsgaSsrKSBvICs9IGRhdGFbaV1bal1bMV07XG4gICAgICAgIGlmIChvKSBmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSBkYXRhW2ldW2pdWzFdIC89IG87IGVsc2UgZm9yIChpID0gMDsgaSA8IG47IGkrKykgZGF0YVtpXVtqXVsxXSA9IGs7XG4gICAgICB9XG4gICAgICBmb3IgKGogPSAwOyBqIDwgbTsgKytqKSB5MFtqXSA9IDA7XG4gICAgICByZXR1cm4geTA7XG4gICAgfSxcbiAgICB6ZXJvOiBkM19sYXlvdXRfc3RhY2tPZmZzZXRaZXJvXG4gIH0pO1xuICBmdW5jdGlvbiBkM19sYXlvdXRfc3RhY2tPcmRlckRlZmF1bHQoZGF0YSkge1xuICAgIHJldHVybiBkMy5yYW5nZShkYXRhLmxlbmd0aCk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X3N0YWNrT2Zmc2V0WmVybyhkYXRhKSB7XG4gICAgdmFyIGogPSAtMSwgbSA9IGRhdGFbMF0ubGVuZ3RoLCB5MCA9IFtdO1xuICAgIHdoaWxlICgrK2ogPCBtKSB5MFtqXSA9IDA7XG4gICAgcmV0dXJuIHkwO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9zdGFja01heEluZGV4KGFycmF5KSB7XG4gICAgdmFyIGkgPSAxLCBqID0gMCwgdiA9IGFycmF5WzBdWzFdLCBrLCBuID0gYXJyYXkubGVuZ3RoO1xuICAgIGZvciAoO2kgPCBuOyArK2kpIHtcbiAgICAgIGlmICgoayA9IGFycmF5W2ldWzFdKSA+IHYpIHtcbiAgICAgICAgaiA9IGk7XG4gICAgICAgIHYgPSBrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gajtcbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfc3RhY2tSZWR1Y2VTdW0oZCkge1xuICAgIHJldHVybiBkLnJlZHVjZShkM19sYXlvdXRfc3RhY2tTdW0sIDApO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9zdGFja1N1bShwLCBkKSB7XG4gICAgcmV0dXJuIHAgKyBkWzFdO1xuICB9XG4gIGQzLmxheW91dC5oaXN0b2dyYW0gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnJlcXVlbmN5ID0gdHJ1ZSwgdmFsdWVyID0gTnVtYmVyLCByYW5nZXIgPSBkM19sYXlvdXRfaGlzdG9ncmFtUmFuZ2UsIGJpbm5lciA9IGQzX2xheW91dF9oaXN0b2dyYW1CaW5TdHVyZ2VzO1xuICAgIGZ1bmN0aW9uIGhpc3RvZ3JhbShkYXRhLCBpKSB7XG4gICAgICB2YXIgYmlucyA9IFtdLCB2YWx1ZXMgPSBkYXRhLm1hcCh2YWx1ZXIsIHRoaXMpLCByYW5nZSA9IHJhbmdlci5jYWxsKHRoaXMsIHZhbHVlcywgaSksIHRocmVzaG9sZHMgPSBiaW5uZXIuY2FsbCh0aGlzLCByYW5nZSwgdmFsdWVzLCBpKSwgYmluLCBpID0gLTEsIG4gPSB2YWx1ZXMubGVuZ3RoLCBtID0gdGhyZXNob2xkcy5sZW5ndGggLSAxLCBrID0gZnJlcXVlbmN5ID8gMSA6IDEgLyBuLCB4O1xuICAgICAgd2hpbGUgKCsraSA8IG0pIHtcbiAgICAgICAgYmluID0gYmluc1tpXSA9IFtdO1xuICAgICAgICBiaW4uZHggPSB0aHJlc2hvbGRzW2kgKyAxXSAtIChiaW4ueCA9IHRocmVzaG9sZHNbaV0pO1xuICAgICAgICBiaW4ueSA9IDA7XG4gICAgICB9XG4gICAgICBpZiAobSA+IDApIHtcbiAgICAgICAgaSA9IC0xO1xuICAgICAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICAgIHggPSB2YWx1ZXNbaV07XG4gICAgICAgICAgaWYgKHggPj0gcmFuZ2VbMF0gJiYgeCA8PSByYW5nZVsxXSkge1xuICAgICAgICAgICAgYmluID0gYmluc1tkMy5iaXNlY3QodGhyZXNob2xkcywgeCwgMSwgbSkgLSAxXTtcbiAgICAgICAgICAgIGJpbi55ICs9IGs7XG4gICAgICAgICAgICBiaW4ucHVzaChkYXRhW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBiaW5zO1xuICAgIH1cbiAgICBoaXN0b2dyYW0udmFsdWUgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB2YWx1ZXI7XG4gICAgICB2YWx1ZXIgPSB4O1xuICAgICAgcmV0dXJuIGhpc3RvZ3JhbTtcbiAgICB9O1xuICAgIGhpc3RvZ3JhbS5yYW5nZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHJhbmdlcjtcbiAgICAgIHJhbmdlciA9IGQzX2Z1bmN0b3IoeCk7XG4gICAgICByZXR1cm4gaGlzdG9ncmFtO1xuICAgIH07XG4gICAgaGlzdG9ncmFtLmJpbnMgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBiaW5uZXI7XG4gICAgICBiaW5uZXIgPSB0eXBlb2YgeCA9PT0gXCJudW1iZXJcIiA/IGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgIHJldHVybiBkM19sYXlvdXRfaGlzdG9ncmFtQmluRml4ZWQocmFuZ2UsIHgpO1xuICAgICAgfSA6IGQzX2Z1bmN0b3IoeCk7XG4gICAgICByZXR1cm4gaGlzdG9ncmFtO1xuICAgIH07XG4gICAgaGlzdG9ncmFtLmZyZXF1ZW5jeSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGZyZXF1ZW5jeTtcbiAgICAgIGZyZXF1ZW5jeSA9ICEheDtcbiAgICAgIHJldHVybiBoaXN0b2dyYW07XG4gICAgfTtcbiAgICByZXR1cm4gaGlzdG9ncmFtO1xuICB9O1xuICBmdW5jdGlvbiBkM19sYXlvdXRfaGlzdG9ncmFtQmluU3R1cmdlcyhyYW5nZSwgdmFsdWVzKSB7XG4gICAgcmV0dXJuIGQzX2xheW91dF9oaXN0b2dyYW1CaW5GaXhlZChyYW5nZSwgTWF0aC5jZWlsKE1hdGgubG9nKHZhbHVlcy5sZW5ndGgpIC8gTWF0aC5MTjIgKyAxKSk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X2hpc3RvZ3JhbUJpbkZpeGVkKHJhbmdlLCBuKSB7XG4gICAgdmFyIHggPSAtMSwgYiA9ICtyYW5nZVswXSwgbSA9IChyYW5nZVsxXSAtIGIpIC8gbiwgZiA9IFtdO1xuICAgIHdoaWxlICgrK3ggPD0gbikgZlt4XSA9IG0gKiB4ICsgYjtcbiAgICByZXR1cm4gZjtcbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfaGlzdG9ncmFtUmFuZ2UodmFsdWVzKSB7XG4gICAgcmV0dXJuIFsgZDMubWluKHZhbHVlcyksIGQzLm1heCh2YWx1ZXMpIF07XG4gIH1cbiAgZDMubGF5b3V0LnBhY2sgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGllcmFyY2h5ID0gZDMubGF5b3V0LmhpZXJhcmNoeSgpLnNvcnQoZDNfbGF5b3V0X3BhY2tTb3J0KSwgcGFkZGluZyA9IDAsIHNpemUgPSBbIDEsIDEgXSwgcmFkaXVzO1xuICAgIGZ1bmN0aW9uIHBhY2soZCwgaSkge1xuICAgICAgdmFyIG5vZGVzID0gaGllcmFyY2h5LmNhbGwodGhpcywgZCwgaSksIHJvb3QgPSBub2Rlc1swXSwgdyA9IHNpemVbMF0sIGggPSBzaXplWzFdLCByID0gcmFkaXVzID09IG51bGwgPyBNYXRoLnNxcnQgOiB0eXBlb2YgcmFkaXVzID09PSBcImZ1bmN0aW9uXCIgPyByYWRpdXMgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHJhZGl1cztcbiAgICAgIH07XG4gICAgICByb290LnggPSByb290LnkgPSAwO1xuICAgICAgZDNfbGF5b3V0X2hpZXJhcmNoeVZpc2l0QWZ0ZXIocm9vdCwgZnVuY3Rpb24oZCkge1xuICAgICAgICBkLnIgPSArcihkLnZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgZDNfbGF5b3V0X2hpZXJhcmNoeVZpc2l0QWZ0ZXIocm9vdCwgZDNfbGF5b3V0X3BhY2tTaWJsaW5ncyk7XG4gICAgICBpZiAocGFkZGluZykge1xuICAgICAgICB2YXIgZHIgPSBwYWRkaW5nICogKHJhZGl1cyA/IDEgOiBNYXRoLm1heCgyICogcm9vdC5yIC8gdywgMiAqIHJvb3QuciAvIGgpKSAvIDI7XG4gICAgICAgIGQzX2xheW91dF9oaWVyYXJjaHlWaXNpdEFmdGVyKHJvb3QsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBkLnIgKz0gZHI7XG4gICAgICAgIH0pO1xuICAgICAgICBkM19sYXlvdXRfaGllcmFyY2h5VmlzaXRBZnRlcihyb290LCBkM19sYXlvdXRfcGFja1NpYmxpbmdzKTtcbiAgICAgICAgZDNfbGF5b3V0X2hpZXJhcmNoeVZpc2l0QWZ0ZXIocm9vdCwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIGQuciAtPSBkcjtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBkM19sYXlvdXRfcGFja1RyYW5zZm9ybShyb290LCB3IC8gMiwgaCAvIDIsIHJhZGl1cyA/IDEgOiAxIC8gTWF0aC5tYXgoMiAqIHJvb3QuciAvIHcsIDIgKiByb290LnIgLyBoKSk7XG4gICAgICByZXR1cm4gbm9kZXM7XG4gICAgfVxuICAgIHBhY2suc2l6ZSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHNpemU7XG4gICAgICBzaXplID0gXztcbiAgICAgIHJldHVybiBwYWNrO1xuICAgIH07XG4gICAgcGFjay5yYWRpdXMgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiByYWRpdXM7XG4gICAgICByYWRpdXMgPSBfID09IG51bGwgfHwgdHlwZW9mIF8gPT09IFwiZnVuY3Rpb25cIiA/IF8gOiArXztcbiAgICAgIHJldHVybiBwYWNrO1xuICAgIH07XG4gICAgcGFjay5wYWRkaW5nID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcGFkZGluZztcbiAgICAgIHBhZGRpbmcgPSArXztcbiAgICAgIHJldHVybiBwYWNrO1xuICAgIH07XG4gICAgcmV0dXJuIGQzX2xheW91dF9oaWVyYXJjaHlSZWJpbmQocGFjaywgaGllcmFyY2h5KTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfbGF5b3V0X3BhY2tTb3J0KGEsIGIpIHtcbiAgICByZXR1cm4gYS52YWx1ZSAtIGIudmFsdWU7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X3BhY2tJbnNlcnQoYSwgYikge1xuICAgIHZhciBjID0gYS5fcGFja19uZXh0O1xuICAgIGEuX3BhY2tfbmV4dCA9IGI7XG4gICAgYi5fcGFja19wcmV2ID0gYTtcbiAgICBiLl9wYWNrX25leHQgPSBjO1xuICAgIGMuX3BhY2tfcHJldiA9IGI7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X3BhY2tTcGxpY2UoYSwgYikge1xuICAgIGEuX3BhY2tfbmV4dCA9IGI7XG4gICAgYi5fcGFja19wcmV2ID0gYTtcbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfcGFja0ludGVyc2VjdHMoYSwgYikge1xuICAgIHZhciBkeCA9IGIueCAtIGEueCwgZHkgPSBiLnkgLSBhLnksIGRyID0gYS5yICsgYi5yO1xuICAgIHJldHVybiAuOTk5ICogZHIgKiBkciA+IGR4ICogZHggKyBkeSAqIGR5O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9wYWNrU2libGluZ3Mobm9kZSkge1xuICAgIGlmICghKG5vZGVzID0gbm9kZS5jaGlsZHJlbikgfHwgIShuID0gbm9kZXMubGVuZ3RoKSkgcmV0dXJuO1xuICAgIHZhciBub2RlcywgeE1pbiA9IEluZmluaXR5LCB4TWF4ID0gLUluZmluaXR5LCB5TWluID0gSW5maW5pdHksIHlNYXggPSAtSW5maW5pdHksIGEsIGIsIGMsIGksIGosIGssIG47XG4gICAgZnVuY3Rpb24gYm91bmQobm9kZSkge1xuICAgICAgeE1pbiA9IE1hdGgubWluKG5vZGUueCAtIG5vZGUuciwgeE1pbik7XG4gICAgICB4TWF4ID0gTWF0aC5tYXgobm9kZS54ICsgbm9kZS5yLCB4TWF4KTtcbiAgICAgIHlNaW4gPSBNYXRoLm1pbihub2RlLnkgLSBub2RlLnIsIHlNaW4pO1xuICAgICAgeU1heCA9IE1hdGgubWF4KG5vZGUueSArIG5vZGUuciwgeU1heCk7XG4gICAgfVxuICAgIG5vZGVzLmZvckVhY2goZDNfbGF5b3V0X3BhY2tMaW5rKTtcbiAgICBhID0gbm9kZXNbMF07XG4gICAgYS54ID0gLWEucjtcbiAgICBhLnkgPSAwO1xuICAgIGJvdW5kKGEpO1xuICAgIGlmIChuID4gMSkge1xuICAgICAgYiA9IG5vZGVzWzFdO1xuICAgICAgYi54ID0gYi5yO1xuICAgICAgYi55ID0gMDtcbiAgICAgIGJvdW5kKGIpO1xuICAgICAgaWYgKG4gPiAyKSB7XG4gICAgICAgIGMgPSBub2Rlc1syXTtcbiAgICAgICAgZDNfbGF5b3V0X3BhY2tQbGFjZShhLCBiLCBjKTtcbiAgICAgICAgYm91bmQoYyk7XG4gICAgICAgIGQzX2xheW91dF9wYWNrSW5zZXJ0KGEsIGMpO1xuICAgICAgICBhLl9wYWNrX3ByZXYgPSBjO1xuICAgICAgICBkM19sYXlvdXRfcGFja0luc2VydChjLCBiKTtcbiAgICAgICAgYiA9IGEuX3BhY2tfbmV4dDtcbiAgICAgICAgZm9yIChpID0gMzsgaSA8IG47IGkrKykge1xuICAgICAgICAgIGQzX2xheW91dF9wYWNrUGxhY2UoYSwgYiwgYyA9IG5vZGVzW2ldKTtcbiAgICAgICAgICB2YXIgaXNlY3QgPSAwLCBzMSA9IDEsIHMyID0gMTtcbiAgICAgICAgICBmb3IgKGogPSBiLl9wYWNrX25leHQ7IGogIT09IGI7IGogPSBqLl9wYWNrX25leHQsIHMxKyspIHtcbiAgICAgICAgICAgIGlmIChkM19sYXlvdXRfcGFja0ludGVyc2VjdHMoaiwgYykpIHtcbiAgICAgICAgICAgICAgaXNlY3QgPSAxO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzZWN0ID09IDEpIHtcbiAgICAgICAgICAgIGZvciAoayA9IGEuX3BhY2tfcHJldjsgayAhPT0gai5fcGFja19wcmV2OyBrID0gay5fcGFja19wcmV2LCBzMisrKSB7XG4gICAgICAgICAgICAgIGlmIChkM19sYXlvdXRfcGFja0ludGVyc2VjdHMoaywgYykpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXNlY3QpIHtcbiAgICAgICAgICAgIGlmIChzMSA8IHMyIHx8IHMxID09IHMyICYmIGIuciA8IGEucikgZDNfbGF5b3V0X3BhY2tTcGxpY2UoYSwgYiA9IGopOyBlbHNlIGQzX2xheW91dF9wYWNrU3BsaWNlKGEgPSBrLCBiKTtcbiAgICAgICAgICAgIGktLTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZDNfbGF5b3V0X3BhY2tJbnNlcnQoYSwgYyk7XG4gICAgICAgICAgICBiID0gYztcbiAgICAgICAgICAgIGJvdW5kKGMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgY3ggPSAoeE1pbiArIHhNYXgpIC8gMiwgY3kgPSAoeU1pbiArIHlNYXgpIC8gMiwgY3IgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIGMgPSBub2Rlc1tpXTtcbiAgICAgIGMueCAtPSBjeDtcbiAgICAgIGMueSAtPSBjeTtcbiAgICAgIGNyID0gTWF0aC5tYXgoY3IsIGMuciArIE1hdGguc3FydChjLnggKiBjLnggKyBjLnkgKiBjLnkpKTtcbiAgICB9XG4gICAgbm9kZS5yID0gY3I7XG4gICAgbm9kZXMuZm9yRWFjaChkM19sYXlvdXRfcGFja1VubGluayk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X3BhY2tMaW5rKG5vZGUpIHtcbiAgICBub2RlLl9wYWNrX25leHQgPSBub2RlLl9wYWNrX3ByZXYgPSBub2RlO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9wYWNrVW5saW5rKG5vZGUpIHtcbiAgICBkZWxldGUgbm9kZS5fcGFja19uZXh0O1xuICAgIGRlbGV0ZSBub2RlLl9wYWNrX3ByZXY7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X3BhY2tUcmFuc2Zvcm0obm9kZSwgeCwgeSwgaykge1xuICAgIHZhciBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW47XG4gICAgbm9kZS54ID0geCArPSBrICogbm9kZS54O1xuICAgIG5vZGUueSA9IHkgKz0gayAqIG5vZGUueTtcbiAgICBub2RlLnIgKj0gaztcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgIHZhciBpID0gLTEsIG4gPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgICB3aGlsZSAoKytpIDwgbikgZDNfbGF5b3V0X3BhY2tUcmFuc2Zvcm0oY2hpbGRyZW5baV0sIHgsIHksIGspO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfcGFja1BsYWNlKGEsIGIsIGMpIHtcbiAgICB2YXIgZGIgPSBhLnIgKyBjLnIsIGR4ID0gYi54IC0gYS54LCBkeSA9IGIueSAtIGEueTtcbiAgICBpZiAoZGIgJiYgKGR4IHx8IGR5KSkge1xuICAgICAgdmFyIGRhID0gYi5yICsgYy5yLCBkYyA9IGR4ICogZHggKyBkeSAqIGR5O1xuICAgICAgZGEgKj0gZGE7XG4gICAgICBkYiAqPSBkYjtcbiAgICAgIHZhciB4ID0gLjUgKyAoZGIgLSBkYSkgLyAoMiAqIGRjKSwgeSA9IE1hdGguc3FydChNYXRoLm1heCgwLCAyICogZGEgKiAoZGIgKyBkYykgLSAoZGIgLT0gZGMpICogZGIgLSBkYSAqIGRhKSkgLyAoMiAqIGRjKTtcbiAgICAgIGMueCA9IGEueCArIHggKiBkeCArIHkgKiBkeTtcbiAgICAgIGMueSA9IGEueSArIHggKiBkeSAtIHkgKiBkeDtcbiAgICB9IGVsc2Uge1xuICAgICAgYy54ID0gYS54ICsgZGI7XG4gICAgICBjLnkgPSBhLnk7XG4gICAgfVxuICB9XG4gIGQzLmxheW91dC50cmVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGhpZXJhcmNoeSA9IGQzLmxheW91dC5oaWVyYXJjaHkoKS5zb3J0KG51bGwpLnZhbHVlKG51bGwpLCBzZXBhcmF0aW9uID0gZDNfbGF5b3V0X3RyZWVTZXBhcmF0aW9uLCBzaXplID0gWyAxLCAxIF0sIG5vZGVTaXplID0gbnVsbDtcbiAgICBmdW5jdGlvbiB0cmVlKGQsIGkpIHtcbiAgICAgIHZhciBub2RlcyA9IGhpZXJhcmNoeS5jYWxsKHRoaXMsIGQsIGkpLCByb290MCA9IG5vZGVzWzBdLCByb290MSA9IHdyYXBUcmVlKHJvb3QwKTtcbiAgICAgIGQzX2xheW91dF9oaWVyYXJjaHlWaXNpdEFmdGVyKHJvb3QxLCBmaXJzdFdhbGspLCByb290MS5wYXJlbnQubSA9IC1yb290MS56O1xuICAgICAgZDNfbGF5b3V0X2hpZXJhcmNoeVZpc2l0QmVmb3JlKHJvb3QxLCBzZWNvbmRXYWxrKTtcbiAgICAgIGlmIChub2RlU2l6ZSkgZDNfbGF5b3V0X2hpZXJhcmNoeVZpc2l0QmVmb3JlKHJvb3QwLCBzaXplTm9kZSk7IGVsc2Uge1xuICAgICAgICB2YXIgbGVmdCA9IHJvb3QwLCByaWdodCA9IHJvb3QwLCBib3R0b20gPSByb290MDtcbiAgICAgICAgZDNfbGF5b3V0X2hpZXJhcmNoeVZpc2l0QmVmb3JlKHJvb3QwLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgaWYgKG5vZGUueCA8IGxlZnQueCkgbGVmdCA9IG5vZGU7XG4gICAgICAgICAgaWYgKG5vZGUueCA+IHJpZ2h0LngpIHJpZ2h0ID0gbm9kZTtcbiAgICAgICAgICBpZiAobm9kZS5kZXB0aCA+IGJvdHRvbS5kZXB0aCkgYm90dG9tID0gbm9kZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciB0eCA9IHNlcGFyYXRpb24obGVmdCwgcmlnaHQpIC8gMiAtIGxlZnQueCwga3ggPSBzaXplWzBdIC8gKHJpZ2h0LnggKyBzZXBhcmF0aW9uKHJpZ2h0LCBsZWZ0KSAvIDIgKyB0eCksIGt5ID0gc2l6ZVsxXSAvIChib3R0b20uZGVwdGggfHwgMSk7XG4gICAgICAgIGQzX2xheW91dF9oaWVyYXJjaHlWaXNpdEJlZm9yZShyb290MCwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgIG5vZGUueCA9IChub2RlLnggKyB0eCkgKiBreDtcbiAgICAgICAgICBub2RlLnkgPSBub2RlLmRlcHRoICoga3k7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiB3cmFwVHJlZShyb290MCkge1xuICAgICAgdmFyIHJvb3QxID0ge1xuICAgICAgICBBOiBudWxsLFxuICAgICAgICBjaGlsZHJlbjogWyByb290MCBdXG4gICAgICB9LCBxdWV1ZSA9IFsgcm9vdDEgXSwgbm9kZTE7XG4gICAgICB3aGlsZSAoKG5vZGUxID0gcXVldWUucG9wKCkpICE9IG51bGwpIHtcbiAgICAgICAgZm9yICh2YXIgY2hpbGRyZW4gPSBub2RlMS5jaGlsZHJlbiwgY2hpbGQsIGkgPSAwLCBuID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgcXVldWUucHVzaCgoY2hpbGRyZW5baV0gPSBjaGlsZCA9IHtcbiAgICAgICAgICAgIF86IGNoaWxkcmVuW2ldLFxuICAgICAgICAgICAgcGFyZW50OiBub2RlMSxcbiAgICAgICAgICAgIGNoaWxkcmVuOiAoY2hpbGQgPSBjaGlsZHJlbltpXS5jaGlsZHJlbikgJiYgY2hpbGQuc2xpY2UoKSB8fCBbXSxcbiAgICAgICAgICAgIEE6IG51bGwsXG4gICAgICAgICAgICBhOiBudWxsLFxuICAgICAgICAgICAgejogMCxcbiAgICAgICAgICAgIG06IDAsXG4gICAgICAgICAgICBjOiAwLFxuICAgICAgICAgICAgczogMCxcbiAgICAgICAgICAgIHQ6IG51bGwsXG4gICAgICAgICAgICBpOiBpXG4gICAgICAgICAgfSkuYSA9IGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJvb3QxLmNoaWxkcmVuWzBdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmaXJzdFdhbGsodikge1xuICAgICAgdmFyIGNoaWxkcmVuID0gdi5jaGlsZHJlbiwgc2libGluZ3MgPSB2LnBhcmVudC5jaGlsZHJlbiwgdyA9IHYuaSA/IHNpYmxpbmdzW3YuaSAtIDFdIDogbnVsbDtcbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgZDNfbGF5b3V0X3RyZWVTaGlmdCh2KTtcbiAgICAgICAgdmFyIG1pZHBvaW50ID0gKGNoaWxkcmVuWzBdLnogKyBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXS56KSAvIDI7XG4gICAgICAgIGlmICh3KSB7XG4gICAgICAgICAgdi56ID0gdy56ICsgc2VwYXJhdGlvbih2Ll8sIHcuXyk7XG4gICAgICAgICAgdi5tID0gdi56IC0gbWlkcG9pbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdi56ID0gbWlkcG9pbnQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodykge1xuICAgICAgICB2LnogPSB3LnogKyBzZXBhcmF0aW9uKHYuXywgdy5fKTtcbiAgICAgIH1cbiAgICAgIHYucGFyZW50LkEgPSBhcHBvcnRpb24odiwgdywgdi5wYXJlbnQuQSB8fCBzaWJsaW5nc1swXSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNlY29uZFdhbGsodikge1xuICAgICAgdi5fLnggPSB2LnogKyB2LnBhcmVudC5tO1xuICAgICAgdi5tICs9IHYucGFyZW50Lm07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFwcG9ydGlvbih2LCB3LCBhbmNlc3Rvcikge1xuICAgICAgaWYgKHcpIHtcbiAgICAgICAgdmFyIHZpcCA9IHYsIHZvcCA9IHYsIHZpbSA9IHcsIHZvbSA9IHZpcC5wYXJlbnQuY2hpbGRyZW5bMF0sIHNpcCA9IHZpcC5tLCBzb3AgPSB2b3AubSwgc2ltID0gdmltLm0sIHNvbSA9IHZvbS5tLCBzaGlmdDtcbiAgICAgICAgd2hpbGUgKHZpbSA9IGQzX2xheW91dF90cmVlUmlnaHQodmltKSwgdmlwID0gZDNfbGF5b3V0X3RyZWVMZWZ0KHZpcCksIHZpbSAmJiB2aXApIHtcbiAgICAgICAgICB2b20gPSBkM19sYXlvdXRfdHJlZUxlZnQodm9tKTtcbiAgICAgICAgICB2b3AgPSBkM19sYXlvdXRfdHJlZVJpZ2h0KHZvcCk7XG4gICAgICAgICAgdm9wLmEgPSB2O1xuICAgICAgICAgIHNoaWZ0ID0gdmltLnogKyBzaW0gLSB2aXAueiAtIHNpcCArIHNlcGFyYXRpb24odmltLl8sIHZpcC5fKTtcbiAgICAgICAgICBpZiAoc2hpZnQgPiAwKSB7XG4gICAgICAgICAgICBkM19sYXlvdXRfdHJlZU1vdmUoZDNfbGF5b3V0X3RyZWVBbmNlc3Rvcih2aW0sIHYsIGFuY2VzdG9yKSwgdiwgc2hpZnQpO1xuICAgICAgICAgICAgc2lwICs9IHNoaWZ0O1xuICAgICAgICAgICAgc29wICs9IHNoaWZ0O1xuICAgICAgICAgIH1cbiAgICAgICAgICBzaW0gKz0gdmltLm07XG4gICAgICAgICAgc2lwICs9IHZpcC5tO1xuICAgICAgICAgIHNvbSArPSB2b20ubTtcbiAgICAgICAgICBzb3AgKz0gdm9wLm07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZpbSAmJiAhZDNfbGF5b3V0X3RyZWVSaWdodCh2b3ApKSB7XG4gICAgICAgICAgdm9wLnQgPSB2aW07XG4gICAgICAgICAgdm9wLm0gKz0gc2ltIC0gc29wO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2aXAgJiYgIWQzX2xheW91dF90cmVlTGVmdCh2b20pKSB7XG4gICAgICAgICAgdm9tLnQgPSB2aXA7XG4gICAgICAgICAgdm9tLm0gKz0gc2lwIC0gc29tO1xuICAgICAgICAgIGFuY2VzdG9yID0gdjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGFuY2VzdG9yO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzaXplTm9kZShub2RlKSB7XG4gICAgICBub2RlLnggKj0gc2l6ZVswXTtcbiAgICAgIG5vZGUueSA9IG5vZGUuZGVwdGggKiBzaXplWzFdO1xuICAgIH1cbiAgICB0cmVlLnNlcGFyYXRpb24gPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzZXBhcmF0aW9uO1xuICAgICAgc2VwYXJhdGlvbiA9IHg7XG4gICAgICByZXR1cm4gdHJlZTtcbiAgICB9O1xuICAgIHRyZWUuc2l6ZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG5vZGVTaXplID8gbnVsbCA6IHNpemU7XG4gICAgICBub2RlU2l6ZSA9IChzaXplID0geCkgPT0gbnVsbCA/IHNpemVOb2RlIDogbnVsbDtcbiAgICAgIHJldHVybiB0cmVlO1xuICAgIH07XG4gICAgdHJlZS5ub2RlU2l6ZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG5vZGVTaXplID8gc2l6ZSA6IG51bGw7XG4gICAgICBub2RlU2l6ZSA9IChzaXplID0geCkgPT0gbnVsbCA/IG51bGwgOiBzaXplTm9kZTtcbiAgICAgIHJldHVybiB0cmVlO1xuICAgIH07XG4gICAgcmV0dXJuIGQzX2xheW91dF9oaWVyYXJjaHlSZWJpbmQodHJlZSwgaGllcmFyY2h5KTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfbGF5b3V0X3RyZWVTZXBhcmF0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYS5wYXJlbnQgPT0gYi5wYXJlbnQgPyAxIDogMjtcbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfdHJlZUxlZnQodikge1xuICAgIHZhciBjaGlsZHJlbiA9IHYuY2hpbGRyZW47XG4gICAgcmV0dXJuIGNoaWxkcmVuLmxlbmd0aCA/IGNoaWxkcmVuWzBdIDogdi50O1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xheW91dF90cmVlUmlnaHQodikge1xuICAgIHZhciBjaGlsZHJlbiA9IHYuY2hpbGRyZW4sIG47XG4gICAgcmV0dXJuIChuID0gY2hpbGRyZW4ubGVuZ3RoKSA/IGNoaWxkcmVuW24gLSAxXSA6IHYudDtcbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfdHJlZU1vdmUod20sIHdwLCBzaGlmdCkge1xuICAgIHZhciBjaGFuZ2UgPSBzaGlmdCAvICh3cC5pIC0gd20uaSk7XG4gICAgd3AuYyAtPSBjaGFuZ2U7XG4gICAgd3AucyArPSBzaGlmdDtcbiAgICB3bS5jICs9IGNoYW5nZTtcbiAgICB3cC56ICs9IHNoaWZ0O1xuICAgIHdwLm0gKz0gc2hpZnQ7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X3RyZWVTaGlmdCh2KSB7XG4gICAgdmFyIHNoaWZ0ID0gMCwgY2hhbmdlID0gMCwgY2hpbGRyZW4gPSB2LmNoaWxkcmVuLCBpID0gY2hpbGRyZW4ubGVuZ3RoLCB3O1xuICAgIHdoaWxlICgtLWkgPj0gMCkge1xuICAgICAgdyA9IGNoaWxkcmVuW2ldO1xuICAgICAgdy56ICs9IHNoaWZ0O1xuICAgICAgdy5tICs9IHNoaWZ0O1xuICAgICAgc2hpZnQgKz0gdy5zICsgKGNoYW5nZSArPSB3LmMpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfdHJlZUFuY2VzdG9yKHZpbSwgdiwgYW5jZXN0b3IpIHtcbiAgICByZXR1cm4gdmltLmEucGFyZW50ID09PSB2LnBhcmVudCA/IHZpbS5hIDogYW5jZXN0b3I7XG4gIH1cbiAgZDMubGF5b3V0LmNsdXN0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGllcmFyY2h5ID0gZDMubGF5b3V0LmhpZXJhcmNoeSgpLnNvcnQobnVsbCkudmFsdWUobnVsbCksIHNlcGFyYXRpb24gPSBkM19sYXlvdXRfdHJlZVNlcGFyYXRpb24sIHNpemUgPSBbIDEsIDEgXSwgbm9kZVNpemUgPSBmYWxzZTtcbiAgICBmdW5jdGlvbiBjbHVzdGVyKGQsIGkpIHtcbiAgICAgIHZhciBub2RlcyA9IGhpZXJhcmNoeS5jYWxsKHRoaXMsIGQsIGkpLCByb290ID0gbm9kZXNbMF0sIHByZXZpb3VzTm9kZSwgeCA9IDA7XG4gICAgICBkM19sYXlvdXRfaGllcmFyY2h5VmlzaXRBZnRlcihyb290LCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW47XG4gICAgICAgIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICBub2RlLnggPSBkM19sYXlvdXRfY2x1c3RlclgoY2hpbGRyZW4pO1xuICAgICAgICAgIG5vZGUueSA9IGQzX2xheW91dF9jbHVzdGVyWShjaGlsZHJlbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbm9kZS54ID0gcHJldmlvdXNOb2RlID8geCArPSBzZXBhcmF0aW9uKG5vZGUsIHByZXZpb3VzTm9kZSkgOiAwO1xuICAgICAgICAgIG5vZGUueSA9IDA7XG4gICAgICAgICAgcHJldmlvdXNOb2RlID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB2YXIgbGVmdCA9IGQzX2xheW91dF9jbHVzdGVyTGVmdChyb290KSwgcmlnaHQgPSBkM19sYXlvdXRfY2x1c3RlclJpZ2h0KHJvb3QpLCB4MCA9IGxlZnQueCAtIHNlcGFyYXRpb24obGVmdCwgcmlnaHQpIC8gMiwgeDEgPSByaWdodC54ICsgc2VwYXJhdGlvbihyaWdodCwgbGVmdCkgLyAyO1xuICAgICAgZDNfbGF5b3V0X2hpZXJhcmNoeVZpc2l0QWZ0ZXIocm9vdCwgbm9kZVNpemUgPyBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIG5vZGUueCA9IChub2RlLnggLSByb290LngpICogc2l6ZVswXTtcbiAgICAgICAgbm9kZS55ID0gKHJvb3QueSAtIG5vZGUueSkgKiBzaXplWzFdO1xuICAgICAgfSA6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgbm9kZS54ID0gKG5vZGUueCAtIHgwKSAvICh4MSAtIHgwKSAqIHNpemVbMF07XG4gICAgICAgIG5vZGUueSA9ICgxIC0gKHJvb3QueSA/IG5vZGUueSAvIHJvb3QueSA6IDEpKSAqIHNpemVbMV07XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBub2RlcztcbiAgICB9XG4gICAgY2x1c3Rlci5zZXBhcmF0aW9uID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2VwYXJhdGlvbjtcbiAgICAgIHNlcGFyYXRpb24gPSB4O1xuICAgICAgcmV0dXJuIGNsdXN0ZXI7XG4gICAgfTtcbiAgICBjbHVzdGVyLnNpemUgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBub2RlU2l6ZSA/IG51bGwgOiBzaXplO1xuICAgICAgbm9kZVNpemUgPSAoc2l6ZSA9IHgpID09IG51bGw7XG4gICAgICByZXR1cm4gY2x1c3RlcjtcbiAgICB9O1xuICAgIGNsdXN0ZXIubm9kZVNpemUgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBub2RlU2l6ZSA/IHNpemUgOiBudWxsO1xuICAgICAgbm9kZVNpemUgPSAoc2l6ZSA9IHgpICE9IG51bGw7XG4gICAgICByZXR1cm4gY2x1c3RlcjtcbiAgICB9O1xuICAgIHJldHVybiBkM19sYXlvdXRfaGllcmFyY2h5UmViaW5kKGNsdXN0ZXIsIGhpZXJhcmNoeSk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9jbHVzdGVyWShjaGlsZHJlbikge1xuICAgIHJldHVybiAxICsgZDMubWF4KGNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xuICAgICAgcmV0dXJuIGNoaWxkLnk7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X2NsdXN0ZXJYKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIGNoaWxkcmVuLnJlZHVjZShmdW5jdGlvbih4LCBjaGlsZCkge1xuICAgICAgcmV0dXJuIHggKyBjaGlsZC54O1xuICAgIH0sIDApIC8gY2hpbGRyZW4ubGVuZ3RoO1xuICB9XG4gIGZ1bmN0aW9uIGQzX2xheW91dF9jbHVzdGVyTGVmdChub2RlKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbjtcbiAgICByZXR1cm4gY2hpbGRyZW4gJiYgY2hpbGRyZW4ubGVuZ3RoID8gZDNfbGF5b3V0X2NsdXN0ZXJMZWZ0KGNoaWxkcmVuWzBdKSA6IG5vZGU7XG4gIH1cbiAgZnVuY3Rpb24gZDNfbGF5b3V0X2NsdXN0ZXJSaWdodChub2RlKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbiwgbjtcbiAgICByZXR1cm4gY2hpbGRyZW4gJiYgKG4gPSBjaGlsZHJlbi5sZW5ndGgpID8gZDNfbGF5b3V0X2NsdXN0ZXJSaWdodChjaGlsZHJlbltuIC0gMV0pIDogbm9kZTtcbiAgfVxuICBkMy5sYXlvdXQudHJlZW1hcCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBoaWVyYXJjaHkgPSBkMy5sYXlvdXQuaGllcmFyY2h5KCksIHJvdW5kID0gTWF0aC5yb3VuZCwgc2l6ZSA9IFsgMSwgMSBdLCBwYWRkaW5nID0gbnVsbCwgcGFkID0gZDNfbGF5b3V0X3RyZWVtYXBQYWROdWxsLCBzdGlja3kgPSBmYWxzZSwgc3RpY2tpZXMsIG1vZGUgPSBcInNxdWFyaWZ5XCIsIHJhdGlvID0gLjUgKiAoMSArIE1hdGguc3FydCg1KSk7XG4gICAgZnVuY3Rpb24gc2NhbGUoY2hpbGRyZW4sIGspIHtcbiAgICAgIHZhciBpID0gLTEsIG4gPSBjaGlsZHJlbi5sZW5ndGgsIGNoaWxkLCBhcmVhO1xuICAgICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgICAgYXJlYSA9IChjaGlsZCA9IGNoaWxkcmVuW2ldKS52YWx1ZSAqIChrIDwgMCA/IDAgOiBrKTtcbiAgICAgICAgY2hpbGQuYXJlYSA9IGlzTmFOKGFyZWEpIHx8IGFyZWEgPD0gMCA/IDAgOiBhcmVhO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzcXVhcmlmeShub2RlKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuO1xuICAgICAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICB2YXIgcmVjdCA9IHBhZChub2RlKSwgcm93ID0gW10sIHJlbWFpbmluZyA9IGNoaWxkcmVuLnNsaWNlKCksIGNoaWxkLCBiZXN0ID0gSW5maW5pdHksIHNjb3JlLCB1ID0gbW9kZSA9PT0gXCJzbGljZVwiID8gcmVjdC5keCA6IG1vZGUgPT09IFwiZGljZVwiID8gcmVjdC5keSA6IG1vZGUgPT09IFwic2xpY2UtZGljZVwiID8gbm9kZS5kZXB0aCAmIDEgPyByZWN0LmR5IDogcmVjdC5keCA6IE1hdGgubWluKHJlY3QuZHgsIHJlY3QuZHkpLCBuO1xuICAgICAgICBzY2FsZShyZW1haW5pbmcsIHJlY3QuZHggKiByZWN0LmR5IC8gbm9kZS52YWx1ZSk7XG4gICAgICAgIHJvdy5hcmVhID0gMDtcbiAgICAgICAgd2hpbGUgKChuID0gcmVtYWluaW5nLmxlbmd0aCkgPiAwKSB7XG4gICAgICAgICAgcm93LnB1c2goY2hpbGQgPSByZW1haW5pbmdbbiAtIDFdKTtcbiAgICAgICAgICByb3cuYXJlYSArPSBjaGlsZC5hcmVhO1xuICAgICAgICAgIGlmIChtb2RlICE9PSBcInNxdWFyaWZ5XCIgfHwgKHNjb3JlID0gd29yc3Qocm93LCB1KSkgPD0gYmVzdCkge1xuICAgICAgICAgICAgcmVtYWluaW5nLnBvcCgpO1xuICAgICAgICAgICAgYmVzdCA9IHNjb3JlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByb3cuYXJlYSAtPSByb3cucG9wKCkuYXJlYTtcbiAgICAgICAgICAgIHBvc2l0aW9uKHJvdywgdSwgcmVjdCwgZmFsc2UpO1xuICAgICAgICAgICAgdSA9IE1hdGgubWluKHJlY3QuZHgsIHJlY3QuZHkpO1xuICAgICAgICAgICAgcm93Lmxlbmd0aCA9IHJvdy5hcmVhID0gMDtcbiAgICAgICAgICAgIGJlc3QgPSBJbmZpbml0eTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJvdy5sZW5ndGgpIHtcbiAgICAgICAgICBwb3NpdGlvbihyb3csIHUsIHJlY3QsIHRydWUpO1xuICAgICAgICAgIHJvdy5sZW5ndGggPSByb3cuYXJlYSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGRyZW4uZm9yRWFjaChzcXVhcmlmeSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN0aWNraWZ5KG5vZGUpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW47XG4gICAgICBpZiAoY2hpbGRyZW4gJiYgY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIHZhciByZWN0ID0gcGFkKG5vZGUpLCByZW1haW5pbmcgPSBjaGlsZHJlbi5zbGljZSgpLCBjaGlsZCwgcm93ID0gW107XG4gICAgICAgIHNjYWxlKHJlbWFpbmluZywgcmVjdC5keCAqIHJlY3QuZHkgLyBub2RlLnZhbHVlKTtcbiAgICAgICAgcm93LmFyZWEgPSAwO1xuICAgICAgICB3aGlsZSAoY2hpbGQgPSByZW1haW5pbmcucG9wKCkpIHtcbiAgICAgICAgICByb3cucHVzaChjaGlsZCk7XG4gICAgICAgICAgcm93LmFyZWEgKz0gY2hpbGQuYXJlYTtcbiAgICAgICAgICBpZiAoY2hpbGQueiAhPSBudWxsKSB7XG4gICAgICAgICAgICBwb3NpdGlvbihyb3csIGNoaWxkLnogPyByZWN0LmR4IDogcmVjdC5keSwgcmVjdCwgIXJlbWFpbmluZy5sZW5ndGgpO1xuICAgICAgICAgICAgcm93Lmxlbmd0aCA9IHJvdy5hcmVhID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGRyZW4uZm9yRWFjaChzdGlja2lmeSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHdvcnN0KHJvdywgdSkge1xuICAgICAgdmFyIHMgPSByb3cuYXJlYSwgciwgcm1heCA9IDAsIHJtaW4gPSBJbmZpbml0eSwgaSA9IC0xLCBuID0gcm93Lmxlbmd0aDtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgIGlmICghKHIgPSByb3dbaV0uYXJlYSkpIGNvbnRpbnVlO1xuICAgICAgICBpZiAociA8IHJtaW4pIHJtaW4gPSByO1xuICAgICAgICBpZiAociA+IHJtYXgpIHJtYXggPSByO1xuICAgICAgfVxuICAgICAgcyAqPSBzO1xuICAgICAgdSAqPSB1O1xuICAgICAgcmV0dXJuIHMgPyBNYXRoLm1heCh1ICogcm1heCAqIHJhdGlvIC8gcywgcyAvICh1ICogcm1pbiAqIHJhdGlvKSkgOiBJbmZpbml0eTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcG9zaXRpb24ocm93LCB1LCByZWN0LCBmbHVzaCkge1xuICAgICAgdmFyIGkgPSAtMSwgbiA9IHJvdy5sZW5ndGgsIHggPSByZWN0LngsIHkgPSByZWN0LnksIHYgPSB1ID8gcm91bmQocm93LmFyZWEgLyB1KSA6IDAsIG87XG4gICAgICBpZiAodSA9PSByZWN0LmR4KSB7XG4gICAgICAgIGlmIChmbHVzaCB8fCB2ID4gcmVjdC5keSkgdiA9IHJlY3QuZHk7XG4gICAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgICAgbyA9IHJvd1tpXTtcbiAgICAgICAgICBvLnggPSB4O1xuICAgICAgICAgIG8ueSA9IHk7XG4gICAgICAgICAgby5keSA9IHY7XG4gICAgICAgICAgeCArPSBvLmR4ID0gTWF0aC5taW4ocmVjdC54ICsgcmVjdC5keCAtIHgsIHYgPyByb3VuZChvLmFyZWEgLyB2KSA6IDApO1xuICAgICAgICB9XG4gICAgICAgIG8ueiA9IHRydWU7XG4gICAgICAgIG8uZHggKz0gcmVjdC54ICsgcmVjdC5keCAtIHg7XG4gICAgICAgIHJlY3QueSArPSB2O1xuICAgICAgICByZWN0LmR5IC09IHY7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZmx1c2ggfHwgdiA+IHJlY3QuZHgpIHYgPSByZWN0LmR4O1xuICAgICAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICAgIG8gPSByb3dbaV07XG4gICAgICAgICAgby54ID0geDtcbiAgICAgICAgICBvLnkgPSB5O1xuICAgICAgICAgIG8uZHggPSB2O1xuICAgICAgICAgIHkgKz0gby5keSA9IE1hdGgubWluKHJlY3QueSArIHJlY3QuZHkgLSB5LCB2ID8gcm91bmQoby5hcmVhIC8gdikgOiAwKTtcbiAgICAgICAgfVxuICAgICAgICBvLnogPSBmYWxzZTtcbiAgICAgICAgby5keSArPSByZWN0LnkgKyByZWN0LmR5IC0geTtcbiAgICAgICAgcmVjdC54ICs9IHY7XG4gICAgICAgIHJlY3QuZHggLT0gdjtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdHJlZW1hcChkKSB7XG4gICAgICB2YXIgbm9kZXMgPSBzdGlja2llcyB8fCBoaWVyYXJjaHkoZCksIHJvb3QgPSBub2Rlc1swXTtcbiAgICAgIHJvb3QueCA9IHJvb3QueSA9IDA7XG4gICAgICBpZiAocm9vdC52YWx1ZSkgcm9vdC5keCA9IHNpemVbMF0sIHJvb3QuZHkgPSBzaXplWzFdOyBlbHNlIHJvb3QuZHggPSByb290LmR5ID0gMDtcbiAgICAgIGlmIChzdGlja2llcykgaGllcmFyY2h5LnJldmFsdWUocm9vdCk7XG4gICAgICBzY2FsZShbIHJvb3QgXSwgcm9vdC5keCAqIHJvb3QuZHkgLyByb290LnZhbHVlKTtcbiAgICAgIChzdGlja2llcyA/IHN0aWNraWZ5IDogc3F1YXJpZnkpKHJvb3QpO1xuICAgICAgaWYgKHN0aWNreSkgc3RpY2tpZXMgPSBub2RlcztcbiAgICAgIHJldHVybiBub2RlcztcbiAgICB9XG4gICAgdHJlZW1hcC5zaXplID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2l6ZTtcbiAgICAgIHNpemUgPSB4O1xuICAgICAgcmV0dXJuIHRyZWVtYXA7XG4gICAgfTtcbiAgICB0cmVlbWFwLnBhZGRpbmcgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwYWRkaW5nO1xuICAgICAgZnVuY3Rpb24gcGFkRnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgcCA9IHguY2FsbCh0cmVlbWFwLCBub2RlLCBub2RlLmRlcHRoKTtcbiAgICAgICAgcmV0dXJuIHAgPT0gbnVsbCA/IGQzX2xheW91dF90cmVlbWFwUGFkTnVsbChub2RlKSA6IGQzX2xheW91dF90cmVlbWFwUGFkKG5vZGUsIHR5cGVvZiBwID09PSBcIm51bWJlclwiID8gWyBwLCBwLCBwLCBwIF0gOiBwKTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIHBhZENvbnN0YW50KG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGQzX2xheW91dF90cmVlbWFwUGFkKG5vZGUsIHgpO1xuICAgICAgfVxuICAgICAgdmFyIHR5cGU7XG4gICAgICBwYWQgPSAocGFkZGluZyA9IHgpID09IG51bGwgPyBkM19sYXlvdXRfdHJlZW1hcFBhZE51bGwgOiAodHlwZSA9IHR5cGVvZiB4KSA9PT0gXCJmdW5jdGlvblwiID8gcGFkRnVuY3Rpb24gOiB0eXBlID09PSBcIm51bWJlclwiID8gKHggPSBbIHgsIHgsIHgsIHggXSwgXG4gICAgICBwYWRDb25zdGFudCkgOiBwYWRDb25zdGFudDtcbiAgICAgIHJldHVybiB0cmVlbWFwO1xuICAgIH07XG4gICAgdHJlZW1hcC5yb3VuZCA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHJvdW5kICE9IE51bWJlcjtcbiAgICAgIHJvdW5kID0geCA/IE1hdGgucm91bmQgOiBOdW1iZXI7XG4gICAgICByZXR1cm4gdHJlZW1hcDtcbiAgICB9O1xuICAgIHRyZWVtYXAuc3RpY2t5ID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc3RpY2t5O1xuICAgICAgc3RpY2t5ID0geDtcbiAgICAgIHN0aWNraWVzID0gbnVsbDtcbiAgICAgIHJldHVybiB0cmVlbWFwO1xuICAgIH07XG4gICAgdHJlZW1hcC5yYXRpbyA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHJhdGlvO1xuICAgICAgcmF0aW8gPSB4O1xuICAgICAgcmV0dXJuIHRyZWVtYXA7XG4gICAgfTtcbiAgICB0cmVlbWFwLm1vZGUgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBtb2RlO1xuICAgICAgbW9kZSA9IHggKyBcIlwiO1xuICAgICAgcmV0dXJuIHRyZWVtYXA7XG4gICAgfTtcbiAgICByZXR1cm4gZDNfbGF5b3V0X2hpZXJhcmNoeVJlYmluZCh0cmVlbWFwLCBoaWVyYXJjaHkpO1xuICB9O1xuICBmdW5jdGlvbiBkM19sYXlvdXRfdHJlZW1hcFBhZE51bGwobm9kZSkge1xuICAgIHJldHVybiB7XG4gICAgICB4OiBub2RlLngsXG4gICAgICB5OiBub2RlLnksXG4gICAgICBkeDogbm9kZS5keCxcbiAgICAgIGR5OiBub2RlLmR5XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBkM19sYXlvdXRfdHJlZW1hcFBhZChub2RlLCBwYWRkaW5nKSB7XG4gICAgdmFyIHggPSBub2RlLnggKyBwYWRkaW5nWzNdLCB5ID0gbm9kZS55ICsgcGFkZGluZ1swXSwgZHggPSBub2RlLmR4IC0gcGFkZGluZ1sxXSAtIHBhZGRpbmdbM10sIGR5ID0gbm9kZS5keSAtIHBhZGRpbmdbMF0gLSBwYWRkaW5nWzJdO1xuICAgIGlmIChkeCA8IDApIHtcbiAgICAgIHggKz0gZHggLyAyO1xuICAgICAgZHggPSAwO1xuICAgIH1cbiAgICBpZiAoZHkgPCAwKSB7XG4gICAgICB5ICs9IGR5IC8gMjtcbiAgICAgIGR5ID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHgsXG4gICAgICB5OiB5LFxuICAgICAgZHg6IGR4LFxuICAgICAgZHk6IGR5XG4gICAgfTtcbiAgfVxuICBkMy5yYW5kb20gPSB7XG4gICAgbm9ybWFsOiBmdW5jdGlvbijCtSwgz4MpIHtcbiAgICAgIHZhciBuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIGlmIChuIDwgMikgz4MgPSAxO1xuICAgICAgaWYgKG4gPCAxKSDCtSA9IDA7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB4LCB5LCByO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgeCA9IE1hdGgucmFuZG9tKCkgKiAyIC0gMTtcbiAgICAgICAgICB5ID0gTWF0aC5yYW5kb20oKSAqIDIgLSAxO1xuICAgICAgICAgIHIgPSB4ICogeCArIHkgKiB5O1xuICAgICAgICB9IHdoaWxlICghciB8fCByID4gMSk7XG4gICAgICAgIHJldHVybiDCtSArIM+DICogeCAqIE1hdGguc3FydCgtMiAqIE1hdGgubG9nKHIpIC8gcik7XG4gICAgICB9O1xuICAgIH0sXG4gICAgbG9nTm9ybWFsOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByYW5kb20gPSBkMy5yYW5kb20ubm9ybWFsLmFwcGx5KGQzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5leHAocmFuZG9tKCkpO1xuICAgICAgfTtcbiAgICB9LFxuICAgIGJhdGVzOiBmdW5jdGlvbihtKSB7XG4gICAgICB2YXIgcmFuZG9tID0gZDMucmFuZG9tLmlyd2luSGFsbChtKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHJhbmRvbSgpIC8gbTtcbiAgICAgIH07XG4gICAgfSxcbiAgICBpcndpbkhhbGw6IGZ1bmN0aW9uKG0pIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIgcyA9IDAsIGogPSAwOyBqIDwgbTsgaisrKSBzICs9IE1hdGgucmFuZG9tKCk7XG4gICAgICAgIHJldHVybiBzO1xuICAgICAgfTtcbiAgICB9XG4gIH07XG4gIGQzLnNjYWxlID0ge307XG4gIGZ1bmN0aW9uIGQzX3NjYWxlRXh0ZW50KGRvbWFpbikge1xuICAgIHZhciBzdGFydCA9IGRvbWFpblswXSwgc3RvcCA9IGRvbWFpbltkb21haW4ubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIHN0YXJ0IDwgc3RvcCA/IFsgc3RhcnQsIHN0b3AgXSA6IFsgc3RvcCwgc3RhcnQgXTtcbiAgfVxuICBmdW5jdGlvbiBkM19zY2FsZVJhbmdlKHNjYWxlKSB7XG4gICAgcmV0dXJuIHNjYWxlLnJhbmdlRXh0ZW50ID8gc2NhbGUucmFuZ2VFeHRlbnQoKSA6IGQzX3NjYWxlRXh0ZW50KHNjYWxlLnJhbmdlKCkpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3NjYWxlX2JpbGluZWFyKGRvbWFpbiwgcmFuZ2UsIHVuaW50ZXJwb2xhdGUsIGludGVycG9sYXRlKSB7XG4gICAgdmFyIHUgPSB1bmludGVycG9sYXRlKGRvbWFpblswXSwgZG9tYWluWzFdKSwgaSA9IGludGVycG9sYXRlKHJhbmdlWzBdLCByYW5nZVsxXSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiBpKHUoeCkpO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gZDNfc2NhbGVfbmljZShkb21haW4sIG5pY2UpIHtcbiAgICB2YXIgaTAgPSAwLCBpMSA9IGRvbWFpbi5sZW5ndGggLSAxLCB4MCA9IGRvbWFpbltpMF0sIHgxID0gZG9tYWluW2kxXSwgZHg7XG4gICAgaWYgKHgxIDwgeDApIHtcbiAgICAgIGR4ID0gaTAsIGkwID0gaTEsIGkxID0gZHg7XG4gICAgICBkeCA9IHgwLCB4MCA9IHgxLCB4MSA9IGR4O1xuICAgIH1cbiAgICBkb21haW5baTBdID0gbmljZS5mbG9vcih4MCk7XG4gICAgZG9tYWluW2kxXSA9IG5pY2UuY2VpbCh4MSk7XG4gICAgcmV0dXJuIGRvbWFpbjtcbiAgfVxuICBmdW5jdGlvbiBkM19zY2FsZV9uaWNlU3RlcChzdGVwKSB7XG4gICAgcmV0dXJuIHN0ZXAgPyB7XG4gICAgICBmbG9vcjogZnVuY3Rpb24oeCkge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcih4IC8gc3RlcCkgKiBzdGVwO1xuICAgICAgfSxcbiAgICAgIGNlaWw6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbCh4IC8gc3RlcCkgKiBzdGVwO1xuICAgICAgfVxuICAgIH0gOiBkM19zY2FsZV9uaWNlSWRlbnRpdHk7XG4gIH1cbiAgdmFyIGQzX3NjYWxlX25pY2VJZGVudGl0eSA9IHtcbiAgICBmbG9vcjogZDNfaWRlbnRpdHksXG4gICAgY2VpbDogZDNfaWRlbnRpdHlcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc2NhbGVfcG9seWxpbmVhcihkb21haW4sIHJhbmdlLCB1bmludGVycG9sYXRlLCBpbnRlcnBvbGF0ZSkge1xuICAgIHZhciB1ID0gW10sIGkgPSBbXSwgaiA9IDAsIGsgPSBNYXRoLm1pbihkb21haW4ubGVuZ3RoLCByYW5nZS5sZW5ndGgpIC0gMTtcbiAgICBpZiAoZG9tYWluW2tdIDwgZG9tYWluWzBdKSB7XG4gICAgICBkb21haW4gPSBkb21haW4uc2xpY2UoKS5yZXZlcnNlKCk7XG4gICAgICByYW5nZSA9IHJhbmdlLnNsaWNlKCkucmV2ZXJzZSgpO1xuICAgIH1cbiAgICB3aGlsZSAoKytqIDw9IGspIHtcbiAgICAgIHUucHVzaCh1bmludGVycG9sYXRlKGRvbWFpbltqIC0gMV0sIGRvbWFpbltqXSkpO1xuICAgICAgaS5wdXNoKGludGVycG9sYXRlKHJhbmdlW2ogLSAxXSwgcmFuZ2Vbal0pKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHgpIHtcbiAgICAgIHZhciBqID0gZDMuYmlzZWN0KGRvbWFpbiwgeCwgMSwgaykgLSAxO1xuICAgICAgcmV0dXJuIGlbal0odVtqXSh4KSk7XG4gICAgfTtcbiAgfVxuICBkMy5zY2FsZS5saW5lYXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfc2NhbGVfbGluZWFyKFsgMCwgMSBdLCBbIDAsIDEgXSwgZDNfaW50ZXJwb2xhdGUsIGZhbHNlKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc2NhbGVfbGluZWFyKGRvbWFpbiwgcmFuZ2UsIGludGVycG9sYXRlLCBjbGFtcCkge1xuICAgIHZhciBvdXRwdXQsIGlucHV0O1xuICAgIGZ1bmN0aW9uIHJlc2NhbGUoKSB7XG4gICAgICB2YXIgbGluZWFyID0gTWF0aC5taW4oZG9tYWluLmxlbmd0aCwgcmFuZ2UubGVuZ3RoKSA+IDIgPyBkM19zY2FsZV9wb2x5bGluZWFyIDogZDNfc2NhbGVfYmlsaW5lYXIsIHVuaW50ZXJwb2xhdGUgPSBjbGFtcCA/IGQzX3VuaW50ZXJwb2xhdGVDbGFtcCA6IGQzX3VuaW50ZXJwb2xhdGVOdW1iZXI7XG4gICAgICBvdXRwdXQgPSBsaW5lYXIoZG9tYWluLCByYW5nZSwgdW5pbnRlcnBvbGF0ZSwgaW50ZXJwb2xhdGUpO1xuICAgICAgaW5wdXQgPSBsaW5lYXIocmFuZ2UsIGRvbWFpbiwgdW5pbnRlcnBvbGF0ZSwgZDNfaW50ZXJwb2xhdGUpO1xuICAgICAgcmV0dXJuIHNjYWxlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzY2FsZSh4KSB7XG4gICAgICByZXR1cm4gb3V0cHV0KHgpO1xuICAgIH1cbiAgICBzY2FsZS5pbnZlcnQgPSBmdW5jdGlvbih5KSB7XG4gICAgICByZXR1cm4gaW5wdXQoeSk7XG4gICAgfTtcbiAgICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBkb21haW47XG4gICAgICBkb21haW4gPSB4Lm1hcChOdW1iZXIpO1xuICAgICAgcmV0dXJuIHJlc2NhbGUoKTtcbiAgICB9O1xuICAgIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcmFuZ2U7XG4gICAgICByYW5nZSA9IHg7XG4gICAgICByZXR1cm4gcmVzY2FsZSgpO1xuICAgIH07XG4gICAgc2NhbGUucmFuZ2VSb3VuZCA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiBzY2FsZS5yYW5nZSh4KS5pbnRlcnBvbGF0ZShkM19pbnRlcnBvbGF0ZVJvdW5kKTtcbiAgICB9O1xuICAgIHNjYWxlLmNsYW1wID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gY2xhbXA7XG4gICAgICBjbGFtcCA9IHg7XG4gICAgICByZXR1cm4gcmVzY2FsZSgpO1xuICAgIH07XG4gICAgc2NhbGUuaW50ZXJwb2xhdGUgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBpbnRlcnBvbGF0ZTtcbiAgICAgIGludGVycG9sYXRlID0geDtcbiAgICAgIHJldHVybiByZXNjYWxlKCk7XG4gICAgfTtcbiAgICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKG0pIHtcbiAgICAgIHJldHVybiBkM19zY2FsZV9saW5lYXJUaWNrcyhkb21haW4sIG0pO1xuICAgIH07XG4gICAgc2NhbGUudGlja0Zvcm1hdCA9IGZ1bmN0aW9uKG0sIGZvcm1hdCkge1xuICAgICAgcmV0dXJuIGQzX3NjYWxlX2xpbmVhclRpY2tGb3JtYXQoZG9tYWluLCBtLCBmb3JtYXQpO1xuICAgIH07XG4gICAgc2NhbGUubmljZSA9IGZ1bmN0aW9uKG0pIHtcbiAgICAgIGQzX3NjYWxlX2xpbmVhck5pY2UoZG9tYWluLCBtKTtcbiAgICAgIHJldHVybiByZXNjYWxlKCk7XG4gICAgfTtcbiAgICBzY2FsZS5jb3B5ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZDNfc2NhbGVfbGluZWFyKGRvbWFpbiwgcmFuZ2UsIGludGVycG9sYXRlLCBjbGFtcCk7XG4gICAgfTtcbiAgICByZXR1cm4gcmVzY2FsZSgpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3NjYWxlX2xpbmVhclJlYmluZChzY2FsZSwgbGluZWFyKSB7XG4gICAgcmV0dXJuIGQzLnJlYmluZChzY2FsZSwgbGluZWFyLCBcInJhbmdlXCIsIFwicmFuZ2VSb3VuZFwiLCBcImludGVycG9sYXRlXCIsIFwiY2xhbXBcIik7XG4gIH1cbiAgZnVuY3Rpb24gZDNfc2NhbGVfbGluZWFyTmljZShkb21haW4sIG0pIHtcbiAgICByZXR1cm4gZDNfc2NhbGVfbmljZShkb21haW4sIGQzX3NjYWxlX25pY2VTdGVwKGQzX3NjYWxlX2xpbmVhclRpY2tSYW5nZShkb21haW4sIG0pWzJdKSk7XG4gIH1cbiAgZnVuY3Rpb24gZDNfc2NhbGVfbGluZWFyVGlja1JhbmdlKGRvbWFpbiwgbSkge1xuICAgIGlmIChtID09IG51bGwpIG0gPSAxMDtcbiAgICB2YXIgZXh0ZW50ID0gZDNfc2NhbGVFeHRlbnQoZG9tYWluKSwgc3BhbiA9IGV4dGVudFsxXSAtIGV4dGVudFswXSwgc3RlcCA9IE1hdGgucG93KDEwLCBNYXRoLmZsb29yKE1hdGgubG9nKHNwYW4gLyBtKSAvIE1hdGguTE4xMCkpLCBlcnIgPSBtIC8gc3BhbiAqIHN0ZXA7XG4gICAgaWYgKGVyciA8PSAuMTUpIHN0ZXAgKj0gMTA7IGVsc2UgaWYgKGVyciA8PSAuMzUpIHN0ZXAgKj0gNTsgZWxzZSBpZiAoZXJyIDw9IC43NSkgc3RlcCAqPSAyO1xuICAgIGV4dGVudFswXSA9IE1hdGguY2VpbChleHRlbnRbMF0gLyBzdGVwKSAqIHN0ZXA7XG4gICAgZXh0ZW50WzFdID0gTWF0aC5mbG9vcihleHRlbnRbMV0gLyBzdGVwKSAqIHN0ZXAgKyBzdGVwICogLjU7XG4gICAgZXh0ZW50WzJdID0gc3RlcDtcbiAgICByZXR1cm4gZXh0ZW50O1xuICB9XG4gIGZ1bmN0aW9uIGQzX3NjYWxlX2xpbmVhclRpY2tzKGRvbWFpbiwgbSkge1xuICAgIHJldHVybiBkMy5yYW5nZS5hcHBseShkMywgZDNfc2NhbGVfbGluZWFyVGlja1JhbmdlKGRvbWFpbiwgbSkpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3NjYWxlX2xpbmVhclRpY2tGb3JtYXQoZG9tYWluLCBtLCBmb3JtYXQpIHtcbiAgICB2YXIgcmFuZ2UgPSBkM19zY2FsZV9saW5lYXJUaWNrUmFuZ2UoZG9tYWluLCBtKTtcbiAgICBpZiAoZm9ybWF0KSB7XG4gICAgICB2YXIgbWF0Y2ggPSBkM19mb3JtYXRfcmUuZXhlYyhmb3JtYXQpO1xuICAgICAgbWF0Y2guc2hpZnQoKTtcbiAgICAgIGlmIChtYXRjaFs4XSA9PT0gXCJzXCIpIHtcbiAgICAgICAgdmFyIHByZWZpeCA9IGQzLmZvcm1hdFByZWZpeChNYXRoLm1heChhYnMocmFuZ2VbMF0pLCBhYnMocmFuZ2VbMV0pKSk7XG4gICAgICAgIGlmICghbWF0Y2hbN10pIG1hdGNoWzddID0gXCIuXCIgKyBkM19zY2FsZV9saW5lYXJQcmVjaXNpb24ocHJlZml4LnNjYWxlKHJhbmdlWzJdKSk7XG4gICAgICAgIG1hdGNoWzhdID0gXCJmXCI7XG4gICAgICAgIGZvcm1hdCA9IGQzLmZvcm1hdChtYXRjaC5qb2luKFwiXCIpKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4gZm9ybWF0KHByZWZpeC5zY2FsZShkKSkgKyBwcmVmaXguc3ltYm9sO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgaWYgKCFtYXRjaFs3XSkgbWF0Y2hbN10gPSBcIi5cIiArIGQzX3NjYWxlX2xpbmVhckZvcm1hdFByZWNpc2lvbihtYXRjaFs4XSwgcmFuZ2UpO1xuICAgICAgZm9ybWF0ID0gbWF0Y2guam9pbihcIlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9ybWF0ID0gXCIsLlwiICsgZDNfc2NhbGVfbGluZWFyUHJlY2lzaW9uKHJhbmdlWzJdKSArIFwiZlwiO1xuICAgIH1cbiAgICByZXR1cm4gZDMuZm9ybWF0KGZvcm1hdCk7XG4gIH1cbiAgdmFyIGQzX3NjYWxlX2xpbmVhckZvcm1hdFNpZ25pZmljYW50ID0ge1xuICAgIHM6IDEsXG4gICAgZzogMSxcbiAgICBwOiAxLFxuICAgIHI6IDEsXG4gICAgZTogMVxuICB9O1xuICBmdW5jdGlvbiBkM19zY2FsZV9saW5lYXJQcmVjaXNpb24odmFsdWUpIHtcbiAgICByZXR1cm4gLU1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjEwICsgLjAxKTtcbiAgfVxuICBmdW5jdGlvbiBkM19zY2FsZV9saW5lYXJGb3JtYXRQcmVjaXNpb24odHlwZSwgcmFuZ2UpIHtcbiAgICB2YXIgcCA9IGQzX3NjYWxlX2xpbmVhclByZWNpc2lvbihyYW5nZVsyXSk7XG4gICAgcmV0dXJuIHR5cGUgaW4gZDNfc2NhbGVfbGluZWFyRm9ybWF0U2lnbmlmaWNhbnQgPyBNYXRoLmFicyhwIC0gZDNfc2NhbGVfbGluZWFyUHJlY2lzaW9uKE1hdGgubWF4KGFicyhyYW5nZVswXSksIGFicyhyYW5nZVsxXSkpKSkgKyArKHR5cGUgIT09IFwiZVwiKSA6IHAgLSAodHlwZSA9PT0gXCIlXCIpICogMjtcbiAgfVxuICBkMy5zY2FsZS5sb2cgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfc2NhbGVfbG9nKGQzLnNjYWxlLmxpbmVhcigpLmRvbWFpbihbIDAsIDEgXSksIDEwLCB0cnVlLCBbIDEsIDEwIF0pO1xuICB9O1xuICBmdW5jdGlvbiBkM19zY2FsZV9sb2cobGluZWFyLCBiYXNlLCBwb3NpdGl2ZSwgZG9tYWluKSB7XG4gICAgZnVuY3Rpb24gbG9nKHgpIHtcbiAgICAgIHJldHVybiAocG9zaXRpdmUgPyBNYXRoLmxvZyh4IDwgMCA/IDAgOiB4KSA6IC1NYXRoLmxvZyh4ID4gMCA/IDAgOiAteCkpIC8gTWF0aC5sb2coYmFzZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBvdyh4KSB7XG4gICAgICByZXR1cm4gcG9zaXRpdmUgPyBNYXRoLnBvdyhiYXNlLCB4KSA6IC1NYXRoLnBvdyhiYXNlLCAteCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNjYWxlKHgpIHtcbiAgICAgIHJldHVybiBsaW5lYXIobG9nKHgpKTtcbiAgICB9XG4gICAgc2NhbGUuaW52ZXJ0ID0gZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHBvdyhsaW5lYXIuaW52ZXJ0KHgpKTtcbiAgICB9O1xuICAgIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGRvbWFpbjtcbiAgICAgIHBvc2l0aXZlID0geFswXSA+PSAwO1xuICAgICAgbGluZWFyLmRvbWFpbigoZG9tYWluID0geC5tYXAoTnVtYmVyKSkubWFwKGxvZykpO1xuICAgICAgcmV0dXJuIHNjYWxlO1xuICAgIH07XG4gICAgc2NhbGUuYmFzZSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGJhc2U7XG4gICAgICBiYXNlID0gK187XG4gICAgICBsaW5lYXIuZG9tYWluKGRvbWFpbi5tYXAobG9nKSk7XG4gICAgICByZXR1cm4gc2NhbGU7XG4gICAgfTtcbiAgICBzY2FsZS5uaWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbmljZWQgPSBkM19zY2FsZV9uaWNlKGRvbWFpbi5tYXAobG9nKSwgcG9zaXRpdmUgPyBNYXRoIDogZDNfc2NhbGVfbG9nTmljZU5lZ2F0aXZlKTtcbiAgICAgIGxpbmVhci5kb21haW4obmljZWQpO1xuICAgICAgZG9tYWluID0gbmljZWQubWFwKHBvdyk7XG4gICAgICByZXR1cm4gc2NhbGU7XG4gICAgfTtcbiAgICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGV4dGVudCA9IGQzX3NjYWxlRXh0ZW50KGRvbWFpbiksIHRpY2tzID0gW10sIHUgPSBleHRlbnRbMF0sIHYgPSBleHRlbnRbMV0sIGkgPSBNYXRoLmZsb29yKGxvZyh1KSksIGogPSBNYXRoLmNlaWwobG9nKHYpKSwgbiA9IGJhc2UgJSAxID8gMiA6IGJhc2U7XG4gICAgICBpZiAoaXNGaW5pdGUoaiAtIGkpKSB7XG4gICAgICAgIGlmIChwb3NpdGl2ZSkge1xuICAgICAgICAgIGZvciAoO2kgPCBqOyBpKyspIGZvciAodmFyIGsgPSAxOyBrIDwgbjsgaysrKSB0aWNrcy5wdXNoKHBvdyhpKSAqIGspO1xuICAgICAgICAgIHRpY2tzLnB1c2gocG93KGkpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aWNrcy5wdXNoKHBvdyhpKSk7XG4gICAgICAgICAgZm9yICg7aSsrIDwgajsgKSBmb3IgKHZhciBrID0gbiAtIDE7IGsgPiAwOyBrLS0pIHRpY2tzLnB1c2gocG93KGkpICogayk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgdGlja3NbaV0gPCB1OyBpKyspIHt9XG4gICAgICAgIGZvciAoaiA9IHRpY2tzLmxlbmd0aDsgdGlja3NbaiAtIDFdID4gdjsgai0tKSB7fVxuICAgICAgICB0aWNrcyA9IHRpY2tzLnNsaWNlKGksIGopO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRpY2tzO1xuICAgIH07XG4gICAgc2NhbGUudGlja0Zvcm1hdCA9IGZ1bmN0aW9uKG4sIGZvcm1hdCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZDNfc2NhbGVfbG9nRm9ybWF0O1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSBmb3JtYXQgPSBkM19zY2FsZV9sb2dGb3JtYXQ7IGVsc2UgaWYgKHR5cGVvZiBmb3JtYXQgIT09IFwiZnVuY3Rpb25cIikgZm9ybWF0ID0gZDMuZm9ybWF0KGZvcm1hdCk7XG4gICAgICB2YXIgayA9IE1hdGgubWF4KC4xLCBuIC8gc2NhbGUudGlja3MoKS5sZW5ndGgpLCBmID0gcG9zaXRpdmUgPyAoZSA9IDFlLTEyLCBNYXRoLmNlaWwpIDogKGUgPSAtMWUtMTIsIFxuICAgICAgTWF0aC5mbG9vciksIGU7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZCAvIHBvdyhmKGxvZyhkKSArIGUpKSA8PSBrID8gZm9ybWF0KGQpIDogXCJcIjtcbiAgICAgIH07XG4gICAgfTtcbiAgICBzY2FsZS5jb3B5ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZDNfc2NhbGVfbG9nKGxpbmVhci5jb3B5KCksIGJhc2UsIHBvc2l0aXZlLCBkb21haW4pO1xuICAgIH07XG4gICAgcmV0dXJuIGQzX3NjYWxlX2xpbmVhclJlYmluZChzY2FsZSwgbGluZWFyKTtcbiAgfVxuICB2YXIgZDNfc2NhbGVfbG9nRm9ybWF0ID0gZDMuZm9ybWF0KFwiLjBlXCIpLCBkM19zY2FsZV9sb2dOaWNlTmVnYXRpdmUgPSB7XG4gICAgZmxvb3I6IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiAtTWF0aC5jZWlsKC14KTtcbiAgICB9LFxuICAgIGNlaWw6IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiAtTWF0aC5mbG9vcigteCk7XG4gICAgfVxuICB9O1xuICBkMy5zY2FsZS5wb3cgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfc2NhbGVfcG93KGQzLnNjYWxlLmxpbmVhcigpLCAxLCBbIDAsIDEgXSk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3NjYWxlX3BvdyhsaW5lYXIsIGV4cG9uZW50LCBkb21haW4pIHtcbiAgICB2YXIgcG93cCA9IGQzX3NjYWxlX3Bvd1BvdyhleHBvbmVudCksIHBvd2IgPSBkM19zY2FsZV9wb3dQb3coMSAvIGV4cG9uZW50KTtcbiAgICBmdW5jdGlvbiBzY2FsZSh4KSB7XG4gICAgICByZXR1cm4gbGluZWFyKHBvd3AoeCkpO1xuICAgIH1cbiAgICBzY2FsZS5pbnZlcnQgPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gcG93YihsaW5lYXIuaW52ZXJ0KHgpKTtcbiAgICB9O1xuICAgIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGRvbWFpbjtcbiAgICAgIGxpbmVhci5kb21haW4oKGRvbWFpbiA9IHgubWFwKE51bWJlcikpLm1hcChwb3dwKSk7XG4gICAgICByZXR1cm4gc2NhbGU7XG4gICAgfTtcbiAgICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKG0pIHtcbiAgICAgIHJldHVybiBkM19zY2FsZV9saW5lYXJUaWNrcyhkb21haW4sIG0pO1xuICAgIH07XG4gICAgc2NhbGUudGlja0Zvcm1hdCA9IGZ1bmN0aW9uKG0sIGZvcm1hdCkge1xuICAgICAgcmV0dXJuIGQzX3NjYWxlX2xpbmVhclRpY2tGb3JtYXQoZG9tYWluLCBtLCBmb3JtYXQpO1xuICAgIH07XG4gICAgc2NhbGUubmljZSA9IGZ1bmN0aW9uKG0pIHtcbiAgICAgIHJldHVybiBzY2FsZS5kb21haW4oZDNfc2NhbGVfbGluZWFyTmljZShkb21haW4sIG0pKTtcbiAgICB9O1xuICAgIHNjYWxlLmV4cG9uZW50ID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZXhwb25lbnQ7XG4gICAgICBwb3dwID0gZDNfc2NhbGVfcG93UG93KGV4cG9uZW50ID0geCk7XG4gICAgICBwb3diID0gZDNfc2NhbGVfcG93UG93KDEgLyBleHBvbmVudCk7XG4gICAgICBsaW5lYXIuZG9tYWluKGRvbWFpbi5tYXAocG93cCkpO1xuICAgICAgcmV0dXJuIHNjYWxlO1xuICAgIH07XG4gICAgc2NhbGUuY29weSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGQzX3NjYWxlX3BvdyhsaW5lYXIuY29weSgpLCBleHBvbmVudCwgZG9tYWluKTtcbiAgICB9O1xuICAgIHJldHVybiBkM19zY2FsZV9saW5lYXJSZWJpbmQoc2NhbGUsIGxpbmVhcik7XG4gIH1cbiAgZnVuY3Rpb24gZDNfc2NhbGVfcG93UG93KGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHggPCAwID8gLU1hdGgucG93KC14LCBlKSA6IE1hdGgucG93KHgsIGUpO1xuICAgIH07XG4gIH1cbiAgZDMuc2NhbGUuc3FydCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkMy5zY2FsZS5wb3coKS5leHBvbmVudCguNSk7XG4gIH07XG4gIGQzLnNjYWxlLm9yZGluYWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfc2NhbGVfb3JkaW5hbChbXSwge1xuICAgICAgdDogXCJyYW5nZVwiLFxuICAgICAgYTogWyBbXSBdXG4gICAgfSk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3NjYWxlX29yZGluYWwoZG9tYWluLCByYW5nZXIpIHtcbiAgICB2YXIgaW5kZXgsIHJhbmdlLCByYW5nZUJhbmQ7XG4gICAgZnVuY3Rpb24gc2NhbGUoeCkge1xuICAgICAgcmV0dXJuIHJhbmdlWygoaW5kZXguZ2V0KHgpIHx8IChyYW5nZXIudCA9PT0gXCJyYW5nZVwiID8gaW5kZXguc2V0KHgsIGRvbWFpbi5wdXNoKHgpKSA6IE5hTikpIC0gMSkgJSByYW5nZS5sZW5ndGhdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzdGVwcyhzdGFydCwgc3RlcCkge1xuICAgICAgcmV0dXJuIGQzLnJhbmdlKGRvbWFpbi5sZW5ndGgpLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICAgIHJldHVybiBzdGFydCArIHN0ZXAgKiBpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGRvbWFpbjtcbiAgICAgIGRvbWFpbiA9IFtdO1xuICAgICAgaW5kZXggPSBuZXcgZDNfTWFwKCk7XG4gICAgICB2YXIgaSA9IC0xLCBuID0geC5sZW5ndGgsIHhpO1xuICAgICAgd2hpbGUgKCsraSA8IG4pIGlmICghaW5kZXguaGFzKHhpID0geFtpXSkpIGluZGV4LnNldCh4aSwgZG9tYWluLnB1c2goeGkpKTtcbiAgICAgIHJldHVybiBzY2FsZVtyYW5nZXIudF0uYXBwbHkoc2NhbGUsIHJhbmdlci5hKTtcbiAgICB9O1xuICAgIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcmFuZ2U7XG4gICAgICByYW5nZSA9IHg7XG4gICAgICByYW5nZUJhbmQgPSAwO1xuICAgICAgcmFuZ2VyID0ge1xuICAgICAgICB0OiBcInJhbmdlXCIsXG4gICAgICAgIGE6IGFyZ3VtZW50c1xuICAgICAgfTtcbiAgICAgIHJldHVybiBzY2FsZTtcbiAgICB9O1xuICAgIHNjYWxlLnJhbmdlUG9pbnRzID0gZnVuY3Rpb24oeCwgcGFkZGluZykge1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSBwYWRkaW5nID0gMDtcbiAgICAgIHZhciBzdGFydCA9IHhbMF0sIHN0b3AgPSB4WzFdLCBzdGVwID0gZG9tYWluLmxlbmd0aCA8IDIgPyAoc3RhcnQgPSAoc3RhcnQgKyBzdG9wKSAvIDIsIFxuICAgICAgMCkgOiAoc3RvcCAtIHN0YXJ0KSAvIChkb21haW4ubGVuZ3RoIC0gMSArIHBhZGRpbmcpO1xuICAgICAgcmFuZ2UgPSBzdGVwcyhzdGFydCArIHN0ZXAgKiBwYWRkaW5nIC8gMiwgc3RlcCk7XG4gICAgICByYW5nZUJhbmQgPSAwO1xuICAgICAgcmFuZ2VyID0ge1xuICAgICAgICB0OiBcInJhbmdlUG9pbnRzXCIsXG4gICAgICAgIGE6IGFyZ3VtZW50c1xuICAgICAgfTtcbiAgICAgIHJldHVybiBzY2FsZTtcbiAgICB9O1xuICAgIHNjYWxlLnJhbmdlUm91bmRQb2ludHMgPSBmdW5jdGlvbih4LCBwYWRkaW5nKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHBhZGRpbmcgPSAwO1xuICAgICAgdmFyIHN0YXJ0ID0geFswXSwgc3RvcCA9IHhbMV0sIHN0ZXAgPSBkb21haW4ubGVuZ3RoIDwgMiA/IChzdGFydCA9IHN0b3AgPSBNYXRoLnJvdW5kKChzdGFydCArIHN0b3ApIC8gMiksIFxuICAgICAgMCkgOiAoc3RvcCAtIHN0YXJ0KSAvIChkb21haW4ubGVuZ3RoIC0gMSArIHBhZGRpbmcpIHwgMDtcbiAgICAgIHJhbmdlID0gc3RlcHMoc3RhcnQgKyBNYXRoLnJvdW5kKHN0ZXAgKiBwYWRkaW5nIC8gMiArIChzdG9wIC0gc3RhcnQgLSAoZG9tYWluLmxlbmd0aCAtIDEgKyBwYWRkaW5nKSAqIHN0ZXApIC8gMiksIHN0ZXApO1xuICAgICAgcmFuZ2VCYW5kID0gMDtcbiAgICAgIHJhbmdlciA9IHtcbiAgICAgICAgdDogXCJyYW5nZVJvdW5kUG9pbnRzXCIsXG4gICAgICAgIGE6IGFyZ3VtZW50c1xuICAgICAgfTtcbiAgICAgIHJldHVybiBzY2FsZTtcbiAgICB9O1xuICAgIHNjYWxlLnJhbmdlQmFuZHMgPSBmdW5jdGlvbih4LCBwYWRkaW5nLCBvdXRlclBhZGRpbmcpIHtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikgcGFkZGluZyA9IDA7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIG91dGVyUGFkZGluZyA9IHBhZGRpbmc7XG4gICAgICB2YXIgcmV2ZXJzZSA9IHhbMV0gPCB4WzBdLCBzdGFydCA9IHhbcmV2ZXJzZSAtIDBdLCBzdG9wID0geFsxIC0gcmV2ZXJzZV0sIHN0ZXAgPSAoc3RvcCAtIHN0YXJ0KSAvIChkb21haW4ubGVuZ3RoIC0gcGFkZGluZyArIDIgKiBvdXRlclBhZGRpbmcpO1xuICAgICAgcmFuZ2UgPSBzdGVwcyhzdGFydCArIHN0ZXAgKiBvdXRlclBhZGRpbmcsIHN0ZXApO1xuICAgICAgaWYgKHJldmVyc2UpIHJhbmdlLnJldmVyc2UoKTtcbiAgICAgIHJhbmdlQmFuZCA9IHN0ZXAgKiAoMSAtIHBhZGRpbmcpO1xuICAgICAgcmFuZ2VyID0ge1xuICAgICAgICB0OiBcInJhbmdlQmFuZHNcIixcbiAgICAgICAgYTogYXJndW1lbnRzXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHNjYWxlO1xuICAgIH07XG4gICAgc2NhbGUucmFuZ2VSb3VuZEJhbmRzID0gZnVuY3Rpb24oeCwgcGFkZGluZywgb3V0ZXJQYWRkaW5nKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHBhZGRpbmcgPSAwO1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSBvdXRlclBhZGRpbmcgPSBwYWRkaW5nO1xuICAgICAgdmFyIHJldmVyc2UgPSB4WzFdIDwgeFswXSwgc3RhcnQgPSB4W3JldmVyc2UgLSAwXSwgc3RvcCA9IHhbMSAtIHJldmVyc2VdLCBzdGVwID0gTWF0aC5mbG9vcigoc3RvcCAtIHN0YXJ0KSAvIChkb21haW4ubGVuZ3RoIC0gcGFkZGluZyArIDIgKiBvdXRlclBhZGRpbmcpKTtcbiAgICAgIHJhbmdlID0gc3RlcHMoc3RhcnQgKyBNYXRoLnJvdW5kKChzdG9wIC0gc3RhcnQgLSAoZG9tYWluLmxlbmd0aCAtIHBhZGRpbmcpICogc3RlcCkgLyAyKSwgc3RlcCk7XG4gICAgICBpZiAocmV2ZXJzZSkgcmFuZ2UucmV2ZXJzZSgpO1xuICAgICAgcmFuZ2VCYW5kID0gTWF0aC5yb3VuZChzdGVwICogKDEgLSBwYWRkaW5nKSk7XG4gICAgICByYW5nZXIgPSB7XG4gICAgICAgIHQ6IFwicmFuZ2VSb3VuZEJhbmRzXCIsXG4gICAgICAgIGE6IGFyZ3VtZW50c1xuICAgICAgfTtcbiAgICAgIHJldHVybiBzY2FsZTtcbiAgICB9O1xuICAgIHNjYWxlLnJhbmdlQmFuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJhbmdlQmFuZDtcbiAgICB9O1xuICAgIHNjYWxlLnJhbmdlRXh0ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZDNfc2NhbGVFeHRlbnQocmFuZ2VyLmFbMF0pO1xuICAgIH07XG4gICAgc2NhbGUuY29weSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGQzX3NjYWxlX29yZGluYWwoZG9tYWluLCByYW5nZXIpO1xuICAgIH07XG4gICAgcmV0dXJuIHNjYWxlLmRvbWFpbihkb21haW4pO1xuICB9XG4gIGQzLnNjYWxlLmNhdGVnb3J5MTAgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDMuc2NhbGUub3JkaW5hbCgpLnJhbmdlKGQzX2NhdGVnb3J5MTApO1xuICB9O1xuICBkMy5zY2FsZS5jYXRlZ29yeTIwID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGQzLnNjYWxlLm9yZGluYWwoKS5yYW5nZShkM19jYXRlZ29yeTIwKTtcbiAgfTtcbiAgZDMuc2NhbGUuY2F0ZWdvcnkyMGIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDMuc2NhbGUub3JkaW5hbCgpLnJhbmdlKGQzX2NhdGVnb3J5MjBiKTtcbiAgfTtcbiAgZDMuc2NhbGUuY2F0ZWdvcnkyMGMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDMuc2NhbGUub3JkaW5hbCgpLnJhbmdlKGQzX2NhdGVnb3J5MjBjKTtcbiAgfTtcbiAgdmFyIGQzX2NhdGVnb3J5MTAgPSBbIDIwNjIyNjAsIDE2NzQ0MjA2LCAyOTI0NTg4LCAxNDAzNDcyOCwgOTcyNTg4NSwgOTE5NzEzMSwgMTQ5MDczMzAsIDgzNTU3MTEsIDEyMzY5MTg2LCAxNTU2MTc1IF0ubWFwKGQzX3JnYlN0cmluZyk7XG4gIHZhciBkM19jYXRlZ29yeTIwID0gWyAyMDYyMjYwLCAxMTQ1NDQ0MCwgMTY3NDQyMDYsIDE2NzU5NjcyLCAyOTI0NTg4LCAxMDAxODY5OCwgMTQwMzQ3MjgsIDE2NzUwNzQyLCA5NzI1ODg1LCAxMjk1NTg2MSwgOTE5NzEzMSwgMTI4ODUxNDAsIDE0OTA3MzMwLCAxNjIzNDE5NCwgODM1NTcxMSwgMTMwOTI4MDcsIDEyMzY5MTg2LCAxNDQwODU4OSwgMTU1NjE3NSwgMTA0MTA3MjUgXS5tYXAoZDNfcmdiU3RyaW5nKTtcbiAgdmFyIGQzX2NhdGVnb3J5MjBiID0gWyAzNzUwNzc3LCA1Mzk1NjE5LCA3MDQwNzE5LCAxMDI2NDI4NiwgNjUxOTA5NywgOTIxNjU5NCwgMTE5MTUxMTUsIDEzNTU2NjM2LCA5MjAyOTkzLCAxMjQyNjgwOSwgMTUxODY1MTQsIDE1MTkwOTMyLCA4NjY2MTY5LCAxMTM1NjQ5MCwgMTQwNDk2NDMsIDE1MTc3MzcyLCA4MDc3NjgzLCAxMDgzNDMyNCwgMTM1Mjg1MDksIDE0NTg5NjU0IF0ubWFwKGQzX3JnYlN0cmluZyk7XG4gIHZhciBkM19jYXRlZ29yeTIwYyA9IFsgMzI0NDczMywgNzA1NzExMCwgMTA0MDY2MjUsIDEzMDMyNDMxLCAxNTA5NTA1MywgMTY2MTY3NjQsIDE2NjI1MjU5LCAxNjYzNDAxOCwgMzI1MzA3NiwgNzY1MjQ3MCwgMTA2MDcwMDMsIDEzMTAxNTA0LCA3Njk1MjgxLCAxMDM5NDMxMiwgMTIzNjkzNzIsIDE0MzQyODkxLCA2NTEzNTA3LCA5ODY4OTUwLCAxMjQzNDg3NywgMTQyNzcwODEgXS5tYXAoZDNfcmdiU3RyaW5nKTtcbiAgZDMuc2NhbGUucXVhbnRpbGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfc2NhbGVfcXVhbnRpbGUoW10sIFtdKTtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc2NhbGVfcXVhbnRpbGUoZG9tYWluLCByYW5nZSkge1xuICAgIHZhciB0aHJlc2hvbGRzO1xuICAgIGZ1bmN0aW9uIHJlc2NhbGUoKSB7XG4gICAgICB2YXIgayA9IDAsIHEgPSByYW5nZS5sZW5ndGg7XG4gICAgICB0aHJlc2hvbGRzID0gW107XG4gICAgICB3aGlsZSAoKytrIDwgcSkgdGhyZXNob2xkc1trIC0gMV0gPSBkMy5xdWFudGlsZShkb21haW4sIGsgLyBxKTtcbiAgICAgIHJldHVybiBzY2FsZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2NhbGUoeCkge1xuICAgICAgaWYgKCFpc05hTih4ID0gK3gpKSByZXR1cm4gcmFuZ2VbZDMuYmlzZWN0KHRocmVzaG9sZHMsIHgpXTtcbiAgICB9XG4gICAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZG9tYWluO1xuICAgICAgZG9tYWluID0geC5tYXAoZDNfbnVtYmVyKS5maWx0ZXIoZDNfbnVtZXJpYykuc29ydChkM19hc2NlbmRpbmcpO1xuICAgICAgcmV0dXJuIHJlc2NhbGUoKTtcbiAgICB9O1xuICAgIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcmFuZ2U7XG4gICAgICByYW5nZSA9IHg7XG4gICAgICByZXR1cm4gcmVzY2FsZSgpO1xuICAgIH07XG4gICAgc2NhbGUucXVhbnRpbGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhyZXNob2xkcztcbiAgICB9O1xuICAgIHNjYWxlLmludmVydEV4dGVudCA9IGZ1bmN0aW9uKHkpIHtcbiAgICAgIHkgPSByYW5nZS5pbmRleE9mKHkpO1xuICAgICAgcmV0dXJuIHkgPCAwID8gWyBOYU4sIE5hTiBdIDogWyB5ID4gMCA/IHRocmVzaG9sZHNbeSAtIDFdIDogZG9tYWluWzBdLCB5IDwgdGhyZXNob2xkcy5sZW5ndGggPyB0aHJlc2hvbGRzW3ldIDogZG9tYWluW2RvbWFpbi5sZW5ndGggLSAxXSBdO1xuICAgIH07XG4gICAgc2NhbGUuY29weSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGQzX3NjYWxlX3F1YW50aWxlKGRvbWFpbiwgcmFuZ2UpO1xuICAgIH07XG4gICAgcmV0dXJuIHJlc2NhbGUoKTtcbiAgfVxuICBkMy5zY2FsZS5xdWFudGl6ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM19zY2FsZV9xdWFudGl6ZSgwLCAxLCBbIDAsIDEgXSk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3NjYWxlX3F1YW50aXplKHgwLCB4MSwgcmFuZ2UpIHtcbiAgICB2YXIga3gsIGk7XG4gICAgZnVuY3Rpb24gc2NhbGUoeCkge1xuICAgICAgcmV0dXJuIHJhbmdlW01hdGgubWF4KDAsIE1hdGgubWluKGksIE1hdGguZmxvb3Ioa3ggKiAoeCAtIHgwKSkpKV07XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlc2NhbGUoKSB7XG4gICAgICBreCA9IHJhbmdlLmxlbmd0aCAvICh4MSAtIHgwKTtcbiAgICAgIGkgPSByYW5nZS5sZW5ndGggLSAxO1xuICAgICAgcmV0dXJuIHNjYWxlO1xuICAgIH1cbiAgICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBbIHgwLCB4MSBdO1xuICAgICAgeDAgPSAreFswXTtcbiAgICAgIHgxID0gK3hbeC5sZW5ndGggLSAxXTtcbiAgICAgIHJldHVybiByZXNjYWxlKCk7XG4gICAgfTtcbiAgICBzY2FsZS5yYW5nZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHJhbmdlO1xuICAgICAgcmFuZ2UgPSB4O1xuICAgICAgcmV0dXJuIHJlc2NhbGUoKTtcbiAgICB9O1xuICAgIHNjYWxlLmludmVydEV4dGVudCA9IGZ1bmN0aW9uKHkpIHtcbiAgICAgIHkgPSByYW5nZS5pbmRleE9mKHkpO1xuICAgICAgeSA9IHkgPCAwID8gTmFOIDogeSAvIGt4ICsgeDA7XG4gICAgICByZXR1cm4gWyB5LCB5ICsgMSAvIGt4IF07XG4gICAgfTtcbiAgICBzY2FsZS5jb3B5ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZDNfc2NhbGVfcXVhbnRpemUoeDAsIHgxLCByYW5nZSk7XG4gICAgfTtcbiAgICByZXR1cm4gcmVzY2FsZSgpO1xuICB9XG4gIGQzLnNjYWxlLnRocmVzaG9sZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM19zY2FsZV90aHJlc2hvbGQoWyAuNSBdLCBbIDAsIDEgXSk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3NjYWxlX3RocmVzaG9sZChkb21haW4sIHJhbmdlKSB7XG4gICAgZnVuY3Rpb24gc2NhbGUoeCkge1xuICAgICAgaWYgKHggPD0geCkgcmV0dXJuIHJhbmdlW2QzLmJpc2VjdChkb21haW4sIHgpXTtcbiAgICB9XG4gICAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZG9tYWluO1xuICAgICAgZG9tYWluID0gXztcbiAgICAgIHJldHVybiBzY2FsZTtcbiAgICB9O1xuICAgIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcmFuZ2U7XG4gICAgICByYW5nZSA9IF87XG4gICAgICByZXR1cm4gc2NhbGU7XG4gICAgfTtcbiAgICBzY2FsZS5pbnZlcnRFeHRlbnQgPSBmdW5jdGlvbih5KSB7XG4gICAgICB5ID0gcmFuZ2UuaW5kZXhPZih5KTtcbiAgICAgIHJldHVybiBbIGRvbWFpblt5IC0gMV0sIGRvbWFpblt5XSBdO1xuICAgIH07XG4gICAgc2NhbGUuY29weSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGQzX3NjYWxlX3RocmVzaG9sZChkb21haW4sIHJhbmdlKTtcbiAgICB9O1xuICAgIHJldHVybiBzY2FsZTtcbiAgfVxuICBkMy5zY2FsZS5pZGVudGl0eSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM19zY2FsZV9pZGVudGl0eShbIDAsIDEgXSk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3NjYWxlX2lkZW50aXR5KGRvbWFpbikge1xuICAgIGZ1bmN0aW9uIGlkZW50aXR5KHgpIHtcbiAgICAgIHJldHVybiAreDtcbiAgICB9XG4gICAgaWRlbnRpdHkuaW52ZXJ0ID0gaWRlbnRpdHk7XG4gICAgaWRlbnRpdHkuZG9tYWluID0gaWRlbnRpdHkucmFuZ2UgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBkb21haW47XG4gICAgICBkb21haW4gPSB4Lm1hcChpZGVudGl0eSk7XG4gICAgICByZXR1cm4gaWRlbnRpdHk7XG4gICAgfTtcbiAgICBpZGVudGl0eS50aWNrcyA9IGZ1bmN0aW9uKG0pIHtcbiAgICAgIHJldHVybiBkM19zY2FsZV9saW5lYXJUaWNrcyhkb21haW4sIG0pO1xuICAgIH07XG4gICAgaWRlbnRpdHkudGlja0Zvcm1hdCA9IGZ1bmN0aW9uKG0sIGZvcm1hdCkge1xuICAgICAgcmV0dXJuIGQzX3NjYWxlX2xpbmVhclRpY2tGb3JtYXQoZG9tYWluLCBtLCBmb3JtYXQpO1xuICAgIH07XG4gICAgaWRlbnRpdHkuY29weSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGQzX3NjYWxlX2lkZW50aXR5KGRvbWFpbik7XG4gICAgfTtcbiAgICByZXR1cm4gaWRlbnRpdHk7XG4gIH1cbiAgZDMuc3ZnID0ge307XG4gIGZ1bmN0aW9uIGQzX3plcm8oKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgZDMuc3ZnLmFyYyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbm5lclJhZGl1cyA9IGQzX3N2Z19hcmNJbm5lclJhZGl1cywgb3V0ZXJSYWRpdXMgPSBkM19zdmdfYXJjT3V0ZXJSYWRpdXMsIGNvcm5lclJhZGl1cyA9IGQzX3plcm8sIHBhZFJhZGl1cyA9IGQzX3N2Z19hcmNBdXRvLCBzdGFydEFuZ2xlID0gZDNfc3ZnX2FyY1N0YXJ0QW5nbGUsIGVuZEFuZ2xlID0gZDNfc3ZnX2FyY0VuZEFuZ2xlLCBwYWRBbmdsZSA9IGQzX3N2Z19hcmNQYWRBbmdsZTtcbiAgICBmdW5jdGlvbiBhcmMoKSB7XG4gICAgICB2YXIgcjAgPSBNYXRoLm1heCgwLCAraW5uZXJSYWRpdXMuYXBwbHkodGhpcywgYXJndW1lbnRzKSksIHIxID0gTWF0aC5tYXgoMCwgK291dGVyUmFkaXVzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpLCBhMCA9IHN0YXJ0QW5nbGUuYXBwbHkodGhpcywgYXJndW1lbnRzKSAtIGhhbGbPgCwgYTEgPSBlbmRBbmdsZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpIC0gaGFsZs+ALCBkYSA9IE1hdGguYWJzKGExIC0gYTApLCBjdyA9IGEwID4gYTEgPyAwIDogMTtcbiAgICAgIGlmIChyMSA8IHIwKSByYyA9IHIxLCByMSA9IHIwLCByMCA9IHJjO1xuICAgICAgaWYgKGRhID49IM+EzrUpIHJldHVybiBjaXJjbGVTZWdtZW50KHIxLCBjdykgKyAocjAgPyBjaXJjbGVTZWdtZW50KHIwLCAxIC0gY3cpIDogXCJcIikgKyBcIlpcIjtcbiAgICAgIHZhciByYywgY3IsIHJwLCBhcCwgcDAgPSAwLCBwMSA9IDAsIHgwLCB5MCwgeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgcGF0aCA9IFtdO1xuICAgICAgaWYgKGFwID0gKCtwYWRBbmdsZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpIHx8IDApIC8gMikge1xuICAgICAgICBycCA9IHBhZFJhZGl1cyA9PT0gZDNfc3ZnX2FyY0F1dG8gPyBNYXRoLnNxcnQocjAgKiByMCArIHIxICogcjEpIDogK3BhZFJhZGl1cy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBpZiAoIWN3KSBwMSAqPSAtMTtcbiAgICAgICAgaWYgKHIxKSBwMSA9IGQzX2FzaW4ocnAgLyByMSAqIE1hdGguc2luKGFwKSk7XG4gICAgICAgIGlmIChyMCkgcDAgPSBkM19hc2luKHJwIC8gcjAgKiBNYXRoLnNpbihhcCkpO1xuICAgICAgfVxuICAgICAgaWYgKHIxKSB7XG4gICAgICAgIHgwID0gcjEgKiBNYXRoLmNvcyhhMCArIHAxKTtcbiAgICAgICAgeTAgPSByMSAqIE1hdGguc2luKGEwICsgcDEpO1xuICAgICAgICB4MSA9IHIxICogTWF0aC5jb3MoYTEgLSBwMSk7XG4gICAgICAgIHkxID0gcjEgKiBNYXRoLnNpbihhMSAtIHAxKTtcbiAgICAgICAgdmFyIGwxID0gTWF0aC5hYnMoYTEgLSBhMCAtIDIgKiBwMSkgPD0gz4AgPyAwIDogMTtcbiAgICAgICAgaWYgKHAxICYmIGQzX3N2Z19hcmNTd2VlcCh4MCwgeTAsIHgxLCB5MSkgPT09IGN3IF4gbDEpIHtcbiAgICAgICAgICB2YXIgaDEgPSAoYTAgKyBhMSkgLyAyO1xuICAgICAgICAgIHgwID0gcjEgKiBNYXRoLmNvcyhoMSk7XG4gICAgICAgICAgeTAgPSByMSAqIE1hdGguc2luKGgxKTtcbiAgICAgICAgICB4MSA9IHkxID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgeDAgPSB5MCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAocjApIHtcbiAgICAgICAgeDIgPSByMCAqIE1hdGguY29zKGExIC0gcDApO1xuICAgICAgICB5MiA9IHIwICogTWF0aC5zaW4oYTEgLSBwMCk7XG4gICAgICAgIHgzID0gcjAgKiBNYXRoLmNvcyhhMCArIHAwKTtcbiAgICAgICAgeTMgPSByMCAqIE1hdGguc2luKGEwICsgcDApO1xuICAgICAgICB2YXIgbDAgPSBNYXRoLmFicyhhMCAtIGExICsgMiAqIHAwKSA8PSDPgCA/IDAgOiAxO1xuICAgICAgICBpZiAocDAgJiYgZDNfc3ZnX2FyY1N3ZWVwKHgyLCB5MiwgeDMsIHkzKSA9PT0gMSAtIGN3IF4gbDApIHtcbiAgICAgICAgICB2YXIgaDAgPSAoYTAgKyBhMSkgLyAyO1xuICAgICAgICAgIHgyID0gcjAgKiBNYXRoLmNvcyhoMCk7XG4gICAgICAgICAgeTIgPSByMCAqIE1hdGguc2luKGgwKTtcbiAgICAgICAgICB4MyA9IHkzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgeDIgPSB5MiA9IDA7XG4gICAgICB9XG4gICAgICBpZiAoZGEgPiDOtSAmJiAocmMgPSBNYXRoLm1pbihNYXRoLmFicyhyMSAtIHIwKSAvIDIsICtjb3JuZXJSYWRpdXMuYXBwbHkodGhpcywgYXJndW1lbnRzKSkpID4gLjAwMSkge1xuICAgICAgICBjciA9IHIwIDwgcjEgXiBjdyA/IDAgOiAxO1xuICAgICAgICB2YXIgcmMxID0gcmMsIHJjMCA9IHJjO1xuICAgICAgICBpZiAoZGEgPCDPgCkge1xuICAgICAgICAgIHZhciBvYyA9IHgzID09IG51bGwgPyBbIHgyLCB5MiBdIDogeDEgPT0gbnVsbCA/IFsgeDAsIHkwIF0gOiBkM19nZW9tX3BvbHlnb25JbnRlcnNlY3QoWyB4MCwgeTAgXSwgWyB4MywgeTMgXSwgWyB4MSwgeTEgXSwgWyB4MiwgeTIgXSksIGF4ID0geDAgLSBvY1swXSwgYXkgPSB5MCAtIG9jWzFdLCBieCA9IHgxIC0gb2NbMF0sIGJ5ID0geTEgLSBvY1sxXSwga2MgPSAxIC8gTWF0aC5zaW4oTWF0aC5hY29zKChheCAqIGJ4ICsgYXkgKiBieSkgLyAoTWF0aC5zcXJ0KGF4ICogYXggKyBheSAqIGF5KSAqIE1hdGguc3FydChieCAqIGJ4ICsgYnkgKiBieSkpKSAvIDIpLCBsYyA9IE1hdGguc3FydChvY1swXSAqIG9jWzBdICsgb2NbMV0gKiBvY1sxXSk7XG4gICAgICAgICAgcmMwID0gTWF0aC5taW4ocmMsIChyMCAtIGxjKSAvIChrYyAtIDEpKTtcbiAgICAgICAgICByYzEgPSBNYXRoLm1pbihyYywgKHIxIC0gbGMpIC8gKGtjICsgMSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4MSAhPSBudWxsKSB7XG4gICAgICAgICAgdmFyIHQzMCA9IGQzX3N2Z19hcmNDb3JuZXJUYW5nZW50cyh4MyA9PSBudWxsID8gWyB4MiwgeTIgXSA6IFsgeDMsIHkzIF0sIFsgeDAsIHkwIF0sIHIxLCByYzEsIGN3KSwgdDEyID0gZDNfc3ZnX2FyY0Nvcm5lclRhbmdlbnRzKFsgeDEsIHkxIF0sIFsgeDIsIHkyIF0sIHIxLCByYzEsIGN3KTtcbiAgICAgICAgICBpZiAocmMgPT09IHJjMSkge1xuICAgICAgICAgICAgcGF0aC5wdXNoKFwiTVwiLCB0MzBbMF0sIFwiQVwiLCByYzEsIFwiLFwiLCByYzEsIFwiIDAgMCxcIiwgY3IsIFwiIFwiLCB0MzBbMV0sIFwiQVwiLCByMSwgXCIsXCIsIHIxLCBcIiAwIFwiLCAxIC0gY3cgXiBkM19zdmdfYXJjU3dlZXAodDMwWzFdWzBdLCB0MzBbMV1bMV0sIHQxMlsxXVswXSwgdDEyWzFdWzFdKSwgXCIsXCIsIGN3LCBcIiBcIiwgdDEyWzFdLCBcIkFcIiwgcmMxLCBcIixcIiwgcmMxLCBcIiAwIDAsXCIsIGNyLCBcIiBcIiwgdDEyWzBdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGF0aC5wdXNoKFwiTVwiLCB0MzBbMF0sIFwiQVwiLCByYzEsIFwiLFwiLCByYzEsIFwiIDAgMSxcIiwgY3IsIFwiIFwiLCB0MTJbMF0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXRoLnB1c2goXCJNXCIsIHgwLCBcIixcIiwgeTApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4MyAhPSBudWxsKSB7XG4gICAgICAgICAgdmFyIHQwMyA9IGQzX3N2Z19hcmNDb3JuZXJUYW5nZW50cyhbIHgwLCB5MCBdLCBbIHgzLCB5MyBdLCByMCwgLXJjMCwgY3cpLCB0MjEgPSBkM19zdmdfYXJjQ29ybmVyVGFuZ2VudHMoWyB4MiwgeTIgXSwgeDEgPT0gbnVsbCA/IFsgeDAsIHkwIF0gOiBbIHgxLCB5MSBdLCByMCwgLXJjMCwgY3cpO1xuICAgICAgICAgIGlmIChyYyA9PT0gcmMwKSB7XG4gICAgICAgICAgICBwYXRoLnB1c2goXCJMXCIsIHQyMVswXSwgXCJBXCIsIHJjMCwgXCIsXCIsIHJjMCwgXCIgMCAwLFwiLCBjciwgXCIgXCIsIHQyMVsxXSwgXCJBXCIsIHIwLCBcIixcIiwgcjAsIFwiIDAgXCIsIGN3IF4gZDNfc3ZnX2FyY1N3ZWVwKHQyMVsxXVswXSwgdDIxWzFdWzFdLCB0MDNbMV1bMF0sIHQwM1sxXVsxXSksIFwiLFwiLCAxIC0gY3csIFwiIFwiLCB0MDNbMV0sIFwiQVwiLCByYzAsIFwiLFwiLCByYzAsIFwiIDAgMCxcIiwgY3IsIFwiIFwiLCB0MDNbMF0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXRoLnB1c2goXCJMXCIsIHQyMVswXSwgXCJBXCIsIHJjMCwgXCIsXCIsIHJjMCwgXCIgMCAwLFwiLCBjciwgXCIgXCIsIHQwM1swXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhdGgucHVzaChcIkxcIiwgeDIsIFwiLFwiLCB5Mik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhdGgucHVzaChcIk1cIiwgeDAsIFwiLFwiLCB5MCk7XG4gICAgICAgIGlmICh4MSAhPSBudWxsKSBwYXRoLnB1c2goXCJBXCIsIHIxLCBcIixcIiwgcjEsIFwiIDAgXCIsIGwxLCBcIixcIiwgY3csIFwiIFwiLCB4MSwgXCIsXCIsIHkxKTtcbiAgICAgICAgcGF0aC5wdXNoKFwiTFwiLCB4MiwgXCIsXCIsIHkyKTtcbiAgICAgICAgaWYgKHgzICE9IG51bGwpIHBhdGgucHVzaChcIkFcIiwgcjAsIFwiLFwiLCByMCwgXCIgMCBcIiwgbDAsIFwiLFwiLCAxIC0gY3csIFwiIFwiLCB4MywgXCIsXCIsIHkzKTtcbiAgICAgIH1cbiAgICAgIHBhdGgucHVzaChcIlpcIik7XG4gICAgICByZXR1cm4gcGF0aC5qb2luKFwiXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjaXJjbGVTZWdtZW50KHIxLCBjdykge1xuICAgICAgcmV0dXJuIFwiTTAsXCIgKyByMSArIFwiQVwiICsgcjEgKyBcIixcIiArIHIxICsgXCIgMCAxLFwiICsgY3cgKyBcIiAwLFwiICsgLXIxICsgXCJBXCIgKyByMSArIFwiLFwiICsgcjEgKyBcIiAwIDEsXCIgKyBjdyArIFwiIDAsXCIgKyByMTtcbiAgICB9XG4gICAgYXJjLmlubmVyUmFkaXVzID0gZnVuY3Rpb24odikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gaW5uZXJSYWRpdXM7XG4gICAgICBpbm5lclJhZGl1cyA9IGQzX2Z1bmN0b3Iodik7XG4gICAgICByZXR1cm4gYXJjO1xuICAgIH07XG4gICAgYXJjLm91dGVyUmFkaXVzID0gZnVuY3Rpb24odikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gb3V0ZXJSYWRpdXM7XG4gICAgICBvdXRlclJhZGl1cyA9IGQzX2Z1bmN0b3Iodik7XG4gICAgICByZXR1cm4gYXJjO1xuICAgIH07XG4gICAgYXJjLmNvcm5lclJhZGl1cyA9IGZ1bmN0aW9uKHYpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGNvcm5lclJhZGl1cztcbiAgICAgIGNvcm5lclJhZGl1cyA9IGQzX2Z1bmN0b3Iodik7XG4gICAgICByZXR1cm4gYXJjO1xuICAgIH07XG4gICAgYXJjLnBhZFJhZGl1cyA9IGZ1bmN0aW9uKHYpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHBhZFJhZGl1cztcbiAgICAgIHBhZFJhZGl1cyA9IHYgPT0gZDNfc3ZnX2FyY0F1dG8gPyBkM19zdmdfYXJjQXV0byA6IGQzX2Z1bmN0b3Iodik7XG4gICAgICByZXR1cm4gYXJjO1xuICAgIH07XG4gICAgYXJjLnN0YXJ0QW5nbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzdGFydEFuZ2xlO1xuICAgICAgc3RhcnRBbmdsZSA9IGQzX2Z1bmN0b3Iodik7XG4gICAgICByZXR1cm4gYXJjO1xuICAgIH07XG4gICAgYXJjLmVuZEFuZ2xlID0gZnVuY3Rpb24odikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZW5kQW5nbGU7XG4gICAgICBlbmRBbmdsZSA9IGQzX2Z1bmN0b3Iodik7XG4gICAgICByZXR1cm4gYXJjO1xuICAgIH07XG4gICAgYXJjLnBhZEFuZ2xlID0gZnVuY3Rpb24odikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcGFkQW5nbGU7XG4gICAgICBwYWRBbmdsZSA9IGQzX2Z1bmN0b3Iodik7XG4gICAgICByZXR1cm4gYXJjO1xuICAgIH07XG4gICAgYXJjLmNlbnRyb2lkID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgciA9ICgraW5uZXJSYWRpdXMuYXBwbHkodGhpcywgYXJndW1lbnRzKSArICtvdXRlclJhZGl1cy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKSAvIDIsIGEgPSAoK3N0YXJ0QW5nbGUuYXBwbHkodGhpcywgYXJndW1lbnRzKSArICtlbmRBbmdsZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpKSAvIDIgLSBoYWxmz4A7XG4gICAgICByZXR1cm4gWyBNYXRoLmNvcyhhKSAqIHIsIE1hdGguc2luKGEpICogciBdO1xuICAgIH07XG4gICAgcmV0dXJuIGFyYztcbiAgfTtcbiAgdmFyIGQzX3N2Z19hcmNBdXRvID0gXCJhdXRvXCI7XG4gIGZ1bmN0aW9uIGQzX3N2Z19hcmNJbm5lclJhZGl1cyhkKSB7XG4gICAgcmV0dXJuIGQuaW5uZXJSYWRpdXM7XG4gIH1cbiAgZnVuY3Rpb24gZDNfc3ZnX2FyY091dGVyUmFkaXVzKGQpIHtcbiAgICByZXR1cm4gZC5vdXRlclJhZGl1cztcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfYXJjU3RhcnRBbmdsZShkKSB7XG4gICAgcmV0dXJuIGQuc3RhcnRBbmdsZTtcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfYXJjRW5kQW5nbGUoZCkge1xuICAgIHJldHVybiBkLmVuZEFuZ2xlO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3N2Z19hcmNQYWRBbmdsZShkKSB7XG4gICAgcmV0dXJuIGQgJiYgZC5wYWRBbmdsZTtcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfYXJjU3dlZXAoeDAsIHkwLCB4MSwgeTEpIHtcbiAgICByZXR1cm4gKHgwIC0geDEpICogeTAgLSAoeTAgLSB5MSkgKiB4MCA+IDAgPyAwIDogMTtcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfYXJjQ29ybmVyVGFuZ2VudHMocDAsIHAxLCByMSwgcmMsIGN3KSB7XG4gICAgdmFyIHgwMSA9IHAwWzBdIC0gcDFbMF0sIHkwMSA9IHAwWzFdIC0gcDFbMV0sIGxvID0gKGN3ID8gcmMgOiAtcmMpIC8gTWF0aC5zcXJ0KHgwMSAqIHgwMSArIHkwMSAqIHkwMSksIG94ID0gbG8gKiB5MDEsIG95ID0gLWxvICogeDAxLCB4MSA9IHAwWzBdICsgb3gsIHkxID0gcDBbMV0gKyBveSwgeDIgPSBwMVswXSArIG94LCB5MiA9IHAxWzFdICsgb3ksIHgzID0gKHgxICsgeDIpIC8gMiwgeTMgPSAoeTEgKyB5MikgLyAyLCBkeCA9IHgyIC0geDEsIGR5ID0geTIgLSB5MSwgZDIgPSBkeCAqIGR4ICsgZHkgKiBkeSwgciA9IHIxIC0gcmMsIEQgPSB4MSAqIHkyIC0geDIgKiB5MSwgZCA9IChkeSA8IDAgPyAtMSA6IDEpICogTWF0aC5zcXJ0KE1hdGgubWF4KDAsIHIgKiByICogZDIgLSBEICogRCkpLCBjeDAgPSAoRCAqIGR5IC0gZHggKiBkKSAvIGQyLCBjeTAgPSAoLUQgKiBkeCAtIGR5ICogZCkgLyBkMiwgY3gxID0gKEQgKiBkeSArIGR4ICogZCkgLyBkMiwgY3kxID0gKC1EICogZHggKyBkeSAqIGQpIC8gZDIsIGR4MCA9IGN4MCAtIHgzLCBkeTAgPSBjeTAgLSB5MywgZHgxID0gY3gxIC0geDMsIGR5MSA9IGN5MSAtIHkzO1xuICAgIGlmIChkeDAgKiBkeDAgKyBkeTAgKiBkeTAgPiBkeDEgKiBkeDEgKyBkeTEgKiBkeTEpIGN4MCA9IGN4MSwgY3kwID0gY3kxO1xuICAgIHJldHVybiBbIFsgY3gwIC0gb3gsIGN5MCAtIG95IF0sIFsgY3gwICogcjEgLyByLCBjeTAgKiByMSAvIHIgXSBdO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3N2Z19saW5lKHByb2plY3Rpb24pIHtcbiAgICB2YXIgeCA9IGQzX2dlb21fcG9pbnRYLCB5ID0gZDNfZ2VvbV9wb2ludFksIGRlZmluZWQgPSBkM190cnVlLCBpbnRlcnBvbGF0ZSA9IGQzX3N2Z19saW5lTGluZWFyLCBpbnRlcnBvbGF0ZUtleSA9IGludGVycG9sYXRlLmtleSwgdGVuc2lvbiA9IC43O1xuICAgIGZ1bmN0aW9uIGxpbmUoZGF0YSkge1xuICAgICAgdmFyIHNlZ21lbnRzID0gW10sIHBvaW50cyA9IFtdLCBpID0gLTEsIG4gPSBkYXRhLmxlbmd0aCwgZCwgZnggPSBkM19mdW5jdG9yKHgpLCBmeSA9IGQzX2Z1bmN0b3IoeSk7XG4gICAgICBmdW5jdGlvbiBzZWdtZW50KCkge1xuICAgICAgICBzZWdtZW50cy5wdXNoKFwiTVwiLCBpbnRlcnBvbGF0ZShwcm9qZWN0aW9uKHBvaW50cyksIHRlbnNpb24pKTtcbiAgICAgIH1cbiAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgIGlmIChkZWZpbmVkLmNhbGwodGhpcywgZCA9IGRhdGFbaV0sIGkpKSB7XG4gICAgICAgICAgcG9pbnRzLnB1c2goWyArZnguY2FsbCh0aGlzLCBkLCBpKSwgK2Z5LmNhbGwodGhpcywgZCwgaSkgXSk7XG4gICAgICAgIH0gZWxzZSBpZiAocG9pbnRzLmxlbmd0aCkge1xuICAgICAgICAgIHNlZ21lbnQoKTtcbiAgICAgICAgICBwb2ludHMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHBvaW50cy5sZW5ndGgpIHNlZ21lbnQoKTtcbiAgICAgIHJldHVybiBzZWdtZW50cy5sZW5ndGggPyBzZWdtZW50cy5qb2luKFwiXCIpIDogbnVsbDtcbiAgICB9XG4gICAgbGluZS54ID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4geDtcbiAgICAgIHggPSBfO1xuICAgICAgcmV0dXJuIGxpbmU7XG4gICAgfTtcbiAgICBsaW5lLnkgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB5O1xuICAgICAgeSA9IF87XG4gICAgICByZXR1cm4gbGluZTtcbiAgICB9O1xuICAgIGxpbmUuZGVmaW5lZCA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGRlZmluZWQ7XG4gICAgICBkZWZpbmVkID0gXztcbiAgICAgIHJldHVybiBsaW5lO1xuICAgIH07XG4gICAgbGluZS5pbnRlcnBvbGF0ZSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGludGVycG9sYXRlS2V5O1xuICAgICAgaWYgKHR5cGVvZiBfID09PSBcImZ1bmN0aW9uXCIpIGludGVycG9sYXRlS2V5ID0gaW50ZXJwb2xhdGUgPSBfOyBlbHNlIGludGVycG9sYXRlS2V5ID0gKGludGVycG9sYXRlID0gZDNfc3ZnX2xpbmVJbnRlcnBvbGF0b3JzLmdldChfKSB8fCBkM19zdmdfbGluZUxpbmVhcikua2V5O1xuICAgICAgcmV0dXJuIGxpbmU7XG4gICAgfTtcbiAgICBsaW5lLnRlbnNpb24gPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0ZW5zaW9uO1xuICAgICAgdGVuc2lvbiA9IF87XG4gICAgICByZXR1cm4gbGluZTtcbiAgICB9O1xuICAgIHJldHVybiBsaW5lO1xuICB9XG4gIGQzLnN2Zy5saW5lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGQzX3N2Z19saW5lKGQzX2lkZW50aXR5KTtcbiAgfTtcbiAgdmFyIGQzX3N2Z19saW5lSW50ZXJwb2xhdG9ycyA9IGQzLm1hcCh7XG4gICAgbGluZWFyOiBkM19zdmdfbGluZUxpbmVhcixcbiAgICBcImxpbmVhci1jbG9zZWRcIjogZDNfc3ZnX2xpbmVMaW5lYXJDbG9zZWQsXG4gICAgc3RlcDogZDNfc3ZnX2xpbmVTdGVwLFxuICAgIFwic3RlcC1iZWZvcmVcIjogZDNfc3ZnX2xpbmVTdGVwQmVmb3JlLFxuICAgIFwic3RlcC1hZnRlclwiOiBkM19zdmdfbGluZVN0ZXBBZnRlcixcbiAgICBiYXNpczogZDNfc3ZnX2xpbmVCYXNpcyxcbiAgICBcImJhc2lzLW9wZW5cIjogZDNfc3ZnX2xpbmVCYXNpc09wZW4sXG4gICAgXCJiYXNpcy1jbG9zZWRcIjogZDNfc3ZnX2xpbmVCYXNpc0Nsb3NlZCxcbiAgICBidW5kbGU6IGQzX3N2Z19saW5lQnVuZGxlLFxuICAgIGNhcmRpbmFsOiBkM19zdmdfbGluZUNhcmRpbmFsLFxuICAgIFwiY2FyZGluYWwtb3BlblwiOiBkM19zdmdfbGluZUNhcmRpbmFsT3BlbixcbiAgICBcImNhcmRpbmFsLWNsb3NlZFwiOiBkM19zdmdfbGluZUNhcmRpbmFsQ2xvc2VkLFxuICAgIG1vbm90b25lOiBkM19zdmdfbGluZU1vbm90b25lXG4gIH0pO1xuICBkM19zdmdfbGluZUludGVycG9sYXRvcnMuZm9yRWFjaChmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgdmFsdWUua2V5ID0ga2V5O1xuICAgIHZhbHVlLmNsb3NlZCA9IC8tY2xvc2VkJC8udGVzdChrZXkpO1xuICB9KTtcbiAgZnVuY3Rpb24gZDNfc3ZnX2xpbmVMaW5lYXIocG9pbnRzKSB7XG4gICAgcmV0dXJuIHBvaW50cy5sZW5ndGggPiAxID8gcG9pbnRzLmpvaW4oXCJMXCIpIDogcG9pbnRzICsgXCJaXCI7XG4gIH1cbiAgZnVuY3Rpb24gZDNfc3ZnX2xpbmVMaW5lYXJDbG9zZWQocG9pbnRzKSB7XG4gICAgcmV0dXJuIHBvaW50cy5qb2luKFwiTFwiKSArIFwiWlwiO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3N2Z19saW5lU3RlcChwb2ludHMpIHtcbiAgICB2YXIgaSA9IDAsIG4gPSBwb2ludHMubGVuZ3RoLCBwID0gcG9pbnRzWzBdLCBwYXRoID0gWyBwWzBdLCBcIixcIiwgcFsxXSBdO1xuICAgIHdoaWxlICgrK2kgPCBuKSBwYXRoLnB1c2goXCJIXCIsIChwWzBdICsgKHAgPSBwb2ludHNbaV0pWzBdKSAvIDIsIFwiVlwiLCBwWzFdKTtcbiAgICBpZiAobiA+IDEpIHBhdGgucHVzaChcIkhcIiwgcFswXSk7XG4gICAgcmV0dXJuIHBhdGguam9pbihcIlwiKTtcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfbGluZVN0ZXBCZWZvcmUocG9pbnRzKSB7XG4gICAgdmFyIGkgPSAwLCBuID0gcG9pbnRzLmxlbmd0aCwgcCA9IHBvaW50c1swXSwgcGF0aCA9IFsgcFswXSwgXCIsXCIsIHBbMV0gXTtcbiAgICB3aGlsZSAoKytpIDwgbikgcGF0aC5wdXNoKFwiVlwiLCAocCA9IHBvaW50c1tpXSlbMV0sIFwiSFwiLCBwWzBdKTtcbiAgICByZXR1cm4gcGF0aC5qb2luKFwiXCIpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3N2Z19saW5lU3RlcEFmdGVyKHBvaW50cykge1xuICAgIHZhciBpID0gMCwgbiA9IHBvaW50cy5sZW5ndGgsIHAgPSBwb2ludHNbMF0sIHBhdGggPSBbIHBbMF0sIFwiLFwiLCBwWzFdIF07XG4gICAgd2hpbGUgKCsraSA8IG4pIHBhdGgucHVzaChcIkhcIiwgKHAgPSBwb2ludHNbaV0pWzBdLCBcIlZcIiwgcFsxXSk7XG4gICAgcmV0dXJuIHBhdGguam9pbihcIlwiKTtcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfbGluZUNhcmRpbmFsT3Blbihwb2ludHMsIHRlbnNpb24pIHtcbiAgICByZXR1cm4gcG9pbnRzLmxlbmd0aCA8IDQgPyBkM19zdmdfbGluZUxpbmVhcihwb2ludHMpIDogcG9pbnRzWzFdICsgZDNfc3ZnX2xpbmVIZXJtaXRlKHBvaW50cy5zbGljZSgxLCAtMSksIGQzX3N2Z19saW5lQ2FyZGluYWxUYW5nZW50cyhwb2ludHMsIHRlbnNpb24pKTtcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfbGluZUNhcmRpbmFsQ2xvc2VkKHBvaW50cywgdGVuc2lvbikge1xuICAgIHJldHVybiBwb2ludHMubGVuZ3RoIDwgMyA/IGQzX3N2Z19saW5lTGluZWFyQ2xvc2VkKHBvaW50cykgOiBwb2ludHNbMF0gKyBkM19zdmdfbGluZUhlcm1pdGUoKHBvaW50cy5wdXNoKHBvaW50c1swXSksIFxuICAgIHBvaW50cyksIGQzX3N2Z19saW5lQ2FyZGluYWxUYW5nZW50cyhbIHBvaW50c1twb2ludHMubGVuZ3RoIC0gMl0gXS5jb25jYXQocG9pbnRzLCBbIHBvaW50c1sxXSBdKSwgdGVuc2lvbikpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3N2Z19saW5lQ2FyZGluYWwocG9pbnRzLCB0ZW5zaW9uKSB7XG4gICAgcmV0dXJuIHBvaW50cy5sZW5ndGggPCAzID8gZDNfc3ZnX2xpbmVMaW5lYXIocG9pbnRzKSA6IHBvaW50c1swXSArIGQzX3N2Z19saW5lSGVybWl0ZShwb2ludHMsIGQzX3N2Z19saW5lQ2FyZGluYWxUYW5nZW50cyhwb2ludHMsIHRlbnNpb24pKTtcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfbGluZUhlcm1pdGUocG9pbnRzLCB0YW5nZW50cykge1xuICAgIGlmICh0YW5nZW50cy5sZW5ndGggPCAxIHx8IHBvaW50cy5sZW5ndGggIT0gdGFuZ2VudHMubGVuZ3RoICYmIHBvaW50cy5sZW5ndGggIT0gdGFuZ2VudHMubGVuZ3RoICsgMikge1xuICAgICAgcmV0dXJuIGQzX3N2Z19saW5lTGluZWFyKHBvaW50cyk7XG4gICAgfVxuICAgIHZhciBxdWFkID0gcG9pbnRzLmxlbmd0aCAhPSB0YW5nZW50cy5sZW5ndGgsIHBhdGggPSBcIlwiLCBwMCA9IHBvaW50c1swXSwgcCA9IHBvaW50c1sxXSwgdDAgPSB0YW5nZW50c1swXSwgdCA9IHQwLCBwaSA9IDE7XG4gICAgaWYgKHF1YWQpIHtcbiAgICAgIHBhdGggKz0gXCJRXCIgKyAocFswXSAtIHQwWzBdICogMiAvIDMpICsgXCIsXCIgKyAocFsxXSAtIHQwWzFdICogMiAvIDMpICsgXCIsXCIgKyBwWzBdICsgXCIsXCIgKyBwWzFdO1xuICAgICAgcDAgPSBwb2ludHNbMV07XG4gICAgICBwaSA9IDI7XG4gICAgfVxuICAgIGlmICh0YW5nZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICB0ID0gdGFuZ2VudHNbMV07XG4gICAgICBwID0gcG9pbnRzW3BpXTtcbiAgICAgIHBpKys7XG4gICAgICBwYXRoICs9IFwiQ1wiICsgKHAwWzBdICsgdDBbMF0pICsgXCIsXCIgKyAocDBbMV0gKyB0MFsxXSkgKyBcIixcIiArIChwWzBdIC0gdFswXSkgKyBcIixcIiArIChwWzFdIC0gdFsxXSkgKyBcIixcIiArIHBbMF0gKyBcIixcIiArIHBbMV07XG4gICAgICBmb3IgKHZhciBpID0gMjsgaSA8IHRhbmdlbnRzLmxlbmd0aDsgaSsrLCBwaSsrKSB7XG4gICAgICAgIHAgPSBwb2ludHNbcGldO1xuICAgICAgICB0ID0gdGFuZ2VudHNbaV07XG4gICAgICAgIHBhdGggKz0gXCJTXCIgKyAocFswXSAtIHRbMF0pICsgXCIsXCIgKyAocFsxXSAtIHRbMV0pICsgXCIsXCIgKyBwWzBdICsgXCIsXCIgKyBwWzFdO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocXVhZCkge1xuICAgICAgdmFyIGxwID0gcG9pbnRzW3BpXTtcbiAgICAgIHBhdGggKz0gXCJRXCIgKyAocFswXSArIHRbMF0gKiAyIC8gMykgKyBcIixcIiArIChwWzFdICsgdFsxXSAqIDIgLyAzKSArIFwiLFwiICsgbHBbMF0gKyBcIixcIiArIGxwWzFdO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aDtcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfbGluZUNhcmRpbmFsVGFuZ2VudHMocG9pbnRzLCB0ZW5zaW9uKSB7XG4gICAgdmFyIHRhbmdlbnRzID0gW10sIGEgPSAoMSAtIHRlbnNpb24pIC8gMiwgcDAsIHAxID0gcG9pbnRzWzBdLCBwMiA9IHBvaW50c1sxXSwgaSA9IDEsIG4gPSBwb2ludHMubGVuZ3RoO1xuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBwMCA9IHAxO1xuICAgICAgcDEgPSBwMjtcbiAgICAgIHAyID0gcG9pbnRzW2ldO1xuICAgICAgdGFuZ2VudHMucHVzaChbIGEgKiAocDJbMF0gLSBwMFswXSksIGEgKiAocDJbMV0gLSBwMFsxXSkgXSk7XG4gICAgfVxuICAgIHJldHVybiB0YW5nZW50cztcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfbGluZUJhc2lzKHBvaW50cykge1xuICAgIGlmIChwb2ludHMubGVuZ3RoIDwgMykgcmV0dXJuIGQzX3N2Z19saW5lTGluZWFyKHBvaW50cyk7XG4gICAgdmFyIGkgPSAxLCBuID0gcG9pbnRzLmxlbmd0aCwgcGkgPSBwb2ludHNbMF0sIHgwID0gcGlbMF0sIHkwID0gcGlbMV0sIHB4ID0gWyB4MCwgeDAsIHgwLCAocGkgPSBwb2ludHNbMV0pWzBdIF0sIHB5ID0gWyB5MCwgeTAsIHkwLCBwaVsxXSBdLCBwYXRoID0gWyB4MCwgXCIsXCIsIHkwLCBcIkxcIiwgZDNfc3ZnX2xpbmVEb3Q0KGQzX3N2Z19saW5lQmFzaXNCZXppZXIzLCBweCksIFwiLFwiLCBkM19zdmdfbGluZURvdDQoZDNfc3ZnX2xpbmVCYXNpc0JlemllcjMsIHB5KSBdO1xuICAgIHBvaW50cy5wdXNoKHBvaW50c1tuIC0gMV0pO1xuICAgIHdoaWxlICgrK2kgPD0gbikge1xuICAgICAgcGkgPSBwb2ludHNbaV07XG4gICAgICBweC5zaGlmdCgpO1xuICAgICAgcHgucHVzaChwaVswXSk7XG4gICAgICBweS5zaGlmdCgpO1xuICAgICAgcHkucHVzaChwaVsxXSk7XG4gICAgICBkM19zdmdfbGluZUJhc2lzQmV6aWVyKHBhdGgsIHB4LCBweSk7XG4gICAgfVxuICAgIHBvaW50cy5wb3AoKTtcbiAgICBwYXRoLnB1c2goXCJMXCIsIHBpKTtcbiAgICByZXR1cm4gcGF0aC5qb2luKFwiXCIpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3N2Z19saW5lQmFzaXNPcGVuKHBvaW50cykge1xuICAgIGlmIChwb2ludHMubGVuZ3RoIDwgNCkgcmV0dXJuIGQzX3N2Z19saW5lTGluZWFyKHBvaW50cyk7XG4gICAgdmFyIHBhdGggPSBbXSwgaSA9IC0xLCBuID0gcG9pbnRzLmxlbmd0aCwgcGksIHB4ID0gWyAwIF0sIHB5ID0gWyAwIF07XG4gICAgd2hpbGUgKCsraSA8IDMpIHtcbiAgICAgIHBpID0gcG9pbnRzW2ldO1xuICAgICAgcHgucHVzaChwaVswXSk7XG4gICAgICBweS5wdXNoKHBpWzFdKTtcbiAgICB9XG4gICAgcGF0aC5wdXNoKGQzX3N2Z19saW5lRG90NChkM19zdmdfbGluZUJhc2lzQmV6aWVyMywgcHgpICsgXCIsXCIgKyBkM19zdmdfbGluZURvdDQoZDNfc3ZnX2xpbmVCYXNpc0JlemllcjMsIHB5KSk7XG4gICAgLS1pO1xuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBwaSA9IHBvaW50c1tpXTtcbiAgICAgIHB4LnNoaWZ0KCk7XG4gICAgICBweC5wdXNoKHBpWzBdKTtcbiAgICAgIHB5LnNoaWZ0KCk7XG4gICAgICBweS5wdXNoKHBpWzFdKTtcbiAgICAgIGQzX3N2Z19saW5lQmFzaXNCZXppZXIocGF0aCwgcHgsIHB5KTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGguam9pbihcIlwiKTtcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfbGluZUJhc2lzQ2xvc2VkKHBvaW50cykge1xuICAgIHZhciBwYXRoLCBpID0gLTEsIG4gPSBwb2ludHMubGVuZ3RoLCBtID0gbiArIDQsIHBpLCBweCA9IFtdLCBweSA9IFtdO1xuICAgIHdoaWxlICgrK2kgPCA0KSB7XG4gICAgICBwaSA9IHBvaW50c1tpICUgbl07XG4gICAgICBweC5wdXNoKHBpWzBdKTtcbiAgICAgIHB5LnB1c2gocGlbMV0pO1xuICAgIH1cbiAgICBwYXRoID0gWyBkM19zdmdfbGluZURvdDQoZDNfc3ZnX2xpbmVCYXNpc0JlemllcjMsIHB4KSwgXCIsXCIsIGQzX3N2Z19saW5lRG90NChkM19zdmdfbGluZUJhc2lzQmV6aWVyMywgcHkpIF07XG4gICAgLS1pO1xuICAgIHdoaWxlICgrK2kgPCBtKSB7XG4gICAgICBwaSA9IHBvaW50c1tpICUgbl07XG4gICAgICBweC5zaGlmdCgpO1xuICAgICAgcHgucHVzaChwaVswXSk7XG4gICAgICBweS5zaGlmdCgpO1xuICAgICAgcHkucHVzaChwaVsxXSk7XG4gICAgICBkM19zdmdfbGluZUJhc2lzQmV6aWVyKHBhdGgsIHB4LCBweSk7XG4gICAgfVxuICAgIHJldHVybiBwYXRoLmpvaW4oXCJcIik7XG4gIH1cbiAgZnVuY3Rpb24gZDNfc3ZnX2xpbmVCdW5kbGUocG9pbnRzLCB0ZW5zaW9uKSB7XG4gICAgdmFyIG4gPSBwb2ludHMubGVuZ3RoIC0gMTtcbiAgICBpZiAobikge1xuICAgICAgdmFyIHgwID0gcG9pbnRzWzBdWzBdLCB5MCA9IHBvaW50c1swXVsxXSwgZHggPSBwb2ludHNbbl1bMF0gLSB4MCwgZHkgPSBwb2ludHNbbl1bMV0gLSB5MCwgaSA9IC0xLCBwLCB0O1xuICAgICAgd2hpbGUgKCsraSA8PSBuKSB7XG4gICAgICAgIHAgPSBwb2ludHNbaV07XG4gICAgICAgIHQgPSBpIC8gbjtcbiAgICAgICAgcFswXSA9IHRlbnNpb24gKiBwWzBdICsgKDEgLSB0ZW5zaW9uKSAqICh4MCArIHQgKiBkeCk7XG4gICAgICAgIHBbMV0gPSB0ZW5zaW9uICogcFsxXSArICgxIC0gdGVuc2lvbikgKiAoeTAgKyB0ICogZHkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZDNfc3ZnX2xpbmVCYXNpcyhwb2ludHMpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3N2Z19saW5lRG90NChhLCBiKSB7XG4gICAgcmV0dXJuIGFbMF0gKiBiWzBdICsgYVsxXSAqIGJbMV0gKyBhWzJdICogYlsyXSArIGFbM10gKiBiWzNdO1xuICB9XG4gIHZhciBkM19zdmdfbGluZUJhc2lzQmV6aWVyMSA9IFsgMCwgMiAvIDMsIDEgLyAzLCAwIF0sIGQzX3N2Z19saW5lQmFzaXNCZXppZXIyID0gWyAwLCAxIC8gMywgMiAvIDMsIDAgXSwgZDNfc3ZnX2xpbmVCYXNpc0JlemllcjMgPSBbIDAsIDEgLyA2LCAyIC8gMywgMSAvIDYgXTtcbiAgZnVuY3Rpb24gZDNfc3ZnX2xpbmVCYXNpc0JlemllcihwYXRoLCB4LCB5KSB7XG4gICAgcGF0aC5wdXNoKFwiQ1wiLCBkM19zdmdfbGluZURvdDQoZDNfc3ZnX2xpbmVCYXNpc0JlemllcjEsIHgpLCBcIixcIiwgZDNfc3ZnX2xpbmVEb3Q0KGQzX3N2Z19saW5lQmFzaXNCZXppZXIxLCB5KSwgXCIsXCIsIGQzX3N2Z19saW5lRG90NChkM19zdmdfbGluZUJhc2lzQmV6aWVyMiwgeCksIFwiLFwiLCBkM19zdmdfbGluZURvdDQoZDNfc3ZnX2xpbmVCYXNpc0JlemllcjIsIHkpLCBcIixcIiwgZDNfc3ZnX2xpbmVEb3Q0KGQzX3N2Z19saW5lQmFzaXNCZXppZXIzLCB4KSwgXCIsXCIsIGQzX3N2Z19saW5lRG90NChkM19zdmdfbGluZUJhc2lzQmV6aWVyMywgeSkpO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3N2Z19saW5lU2xvcGUocDAsIHAxKSB7XG4gICAgcmV0dXJuIChwMVsxXSAtIHAwWzFdKSAvIChwMVswXSAtIHAwWzBdKTtcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfbGluZUZpbml0ZURpZmZlcmVuY2VzKHBvaW50cykge1xuICAgIHZhciBpID0gMCwgaiA9IHBvaW50cy5sZW5ndGggLSAxLCBtID0gW10sIHAwID0gcG9pbnRzWzBdLCBwMSA9IHBvaW50c1sxXSwgZCA9IG1bMF0gPSBkM19zdmdfbGluZVNsb3BlKHAwLCBwMSk7XG4gICAgd2hpbGUgKCsraSA8IGopIHtcbiAgICAgIG1baV0gPSAoZCArIChkID0gZDNfc3ZnX2xpbmVTbG9wZShwMCA9IHAxLCBwMSA9IHBvaW50c1tpICsgMV0pKSkgLyAyO1xuICAgIH1cbiAgICBtW2ldID0gZDtcbiAgICByZXR1cm4gbTtcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfbGluZU1vbm90b25lVGFuZ2VudHMocG9pbnRzKSB7XG4gICAgdmFyIHRhbmdlbnRzID0gW10sIGQsIGEsIGIsIHMsIG0gPSBkM19zdmdfbGluZUZpbml0ZURpZmZlcmVuY2VzKHBvaW50cyksIGkgPSAtMSwgaiA9IHBvaW50cy5sZW5ndGggLSAxO1xuICAgIHdoaWxlICgrK2kgPCBqKSB7XG4gICAgICBkID0gZDNfc3ZnX2xpbmVTbG9wZShwb2ludHNbaV0sIHBvaW50c1tpICsgMV0pO1xuICAgICAgaWYgKGFicyhkKSA8IM61KSB7XG4gICAgICAgIG1baV0gPSBtW2kgKyAxXSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhID0gbVtpXSAvIGQ7XG4gICAgICAgIGIgPSBtW2kgKyAxXSAvIGQ7XG4gICAgICAgIHMgPSBhICogYSArIGIgKiBiO1xuICAgICAgICBpZiAocyA+IDkpIHtcbiAgICAgICAgICBzID0gZCAqIDMgLyBNYXRoLnNxcnQocyk7XG4gICAgICAgICAgbVtpXSA9IHMgKiBhO1xuICAgICAgICAgIG1baSArIDFdID0gcyAqIGI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaSA9IC0xO1xuICAgIHdoaWxlICgrK2kgPD0gaikge1xuICAgICAgcyA9IChwb2ludHNbTWF0aC5taW4oaiwgaSArIDEpXVswXSAtIHBvaW50c1tNYXRoLm1heCgwLCBpIC0gMSldWzBdKSAvICg2ICogKDEgKyBtW2ldICogbVtpXSkpO1xuICAgICAgdGFuZ2VudHMucHVzaChbIHMgfHwgMCwgbVtpXSAqIHMgfHwgMCBdKTtcbiAgICB9XG4gICAgcmV0dXJuIHRhbmdlbnRzO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3N2Z19saW5lTW9ub3RvbmUocG9pbnRzKSB7XG4gICAgcmV0dXJuIHBvaW50cy5sZW5ndGggPCAzID8gZDNfc3ZnX2xpbmVMaW5lYXIocG9pbnRzKSA6IHBvaW50c1swXSArIGQzX3N2Z19saW5lSGVybWl0ZShwb2ludHMsIGQzX3N2Z19saW5lTW9ub3RvbmVUYW5nZW50cyhwb2ludHMpKTtcbiAgfVxuICBkMy5zdmcubGluZS5yYWRpYWwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGluZSA9IGQzX3N2Z19saW5lKGQzX3N2Z19saW5lUmFkaWFsKTtcbiAgICBsaW5lLnJhZGl1cyA9IGxpbmUueCwgZGVsZXRlIGxpbmUueDtcbiAgICBsaW5lLmFuZ2xlID0gbGluZS55LCBkZWxldGUgbGluZS55O1xuICAgIHJldHVybiBsaW5lO1xuICB9O1xuICBmdW5jdGlvbiBkM19zdmdfbGluZVJhZGlhbChwb2ludHMpIHtcbiAgICB2YXIgcG9pbnQsIGkgPSAtMSwgbiA9IHBvaW50cy5sZW5ndGgsIHIsIGE7XG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIHBvaW50ID0gcG9pbnRzW2ldO1xuICAgICAgciA9IHBvaW50WzBdO1xuICAgICAgYSA9IHBvaW50WzFdIC0gaGFsZs+AO1xuICAgICAgcG9pbnRbMF0gPSByICogTWF0aC5jb3MoYSk7XG4gICAgICBwb2ludFsxXSA9IHIgKiBNYXRoLnNpbihhKTtcbiAgICB9XG4gICAgcmV0dXJuIHBvaW50cztcbiAgfVxuICBmdW5jdGlvbiBkM19zdmdfYXJlYShwcm9qZWN0aW9uKSB7XG4gICAgdmFyIHgwID0gZDNfZ2VvbV9wb2ludFgsIHgxID0gZDNfZ2VvbV9wb2ludFgsIHkwID0gMCwgeTEgPSBkM19nZW9tX3BvaW50WSwgZGVmaW5lZCA9IGQzX3RydWUsIGludGVycG9sYXRlID0gZDNfc3ZnX2xpbmVMaW5lYXIsIGludGVycG9sYXRlS2V5ID0gaW50ZXJwb2xhdGUua2V5LCBpbnRlcnBvbGF0ZVJldmVyc2UgPSBpbnRlcnBvbGF0ZSwgTCA9IFwiTFwiLCB0ZW5zaW9uID0gLjc7XG4gICAgZnVuY3Rpb24gYXJlYShkYXRhKSB7XG4gICAgICB2YXIgc2VnbWVudHMgPSBbXSwgcG9pbnRzMCA9IFtdLCBwb2ludHMxID0gW10sIGkgPSAtMSwgbiA9IGRhdGEubGVuZ3RoLCBkLCBmeDAgPSBkM19mdW5jdG9yKHgwKSwgZnkwID0gZDNfZnVuY3Rvcih5MCksIGZ4MSA9IHgwID09PSB4MSA/IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICAgIH0gOiBkM19mdW5jdG9yKHgxKSwgZnkxID0geTAgPT09IHkxID8gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB5O1xuICAgICAgfSA6IGQzX2Z1bmN0b3IoeTEpLCB4LCB5O1xuICAgICAgZnVuY3Rpb24gc2VnbWVudCgpIHtcbiAgICAgICAgc2VnbWVudHMucHVzaChcIk1cIiwgaW50ZXJwb2xhdGUocHJvamVjdGlvbihwb2ludHMxKSwgdGVuc2lvbiksIEwsIGludGVycG9sYXRlUmV2ZXJzZShwcm9qZWN0aW9uKHBvaW50czAucmV2ZXJzZSgpKSwgdGVuc2lvbiksIFwiWlwiKTtcbiAgICAgIH1cbiAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgIGlmIChkZWZpbmVkLmNhbGwodGhpcywgZCA9IGRhdGFbaV0sIGkpKSB7XG4gICAgICAgICAgcG9pbnRzMC5wdXNoKFsgeCA9ICtmeDAuY2FsbCh0aGlzLCBkLCBpKSwgeSA9ICtmeTAuY2FsbCh0aGlzLCBkLCBpKSBdKTtcbiAgICAgICAgICBwb2ludHMxLnB1c2goWyArZngxLmNhbGwodGhpcywgZCwgaSksICtmeTEuY2FsbCh0aGlzLCBkLCBpKSBdKTtcbiAgICAgICAgfSBlbHNlIGlmIChwb2ludHMwLmxlbmd0aCkge1xuICAgICAgICAgIHNlZ21lbnQoKTtcbiAgICAgICAgICBwb2ludHMwID0gW107XG4gICAgICAgICAgcG9pbnRzMSA9IFtdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocG9pbnRzMC5sZW5ndGgpIHNlZ21lbnQoKTtcbiAgICAgIHJldHVybiBzZWdtZW50cy5sZW5ndGggPyBzZWdtZW50cy5qb2luKFwiXCIpIDogbnVsbDtcbiAgICB9XG4gICAgYXJlYS54ID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4geDE7XG4gICAgICB4MCA9IHgxID0gXztcbiAgICAgIHJldHVybiBhcmVhO1xuICAgIH07XG4gICAgYXJlYS54MCA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHgwO1xuICAgICAgeDAgPSBfO1xuICAgICAgcmV0dXJuIGFyZWE7XG4gICAgfTtcbiAgICBhcmVhLngxID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4geDE7XG4gICAgICB4MSA9IF87XG4gICAgICByZXR1cm4gYXJlYTtcbiAgICB9O1xuICAgIGFyZWEueSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHkxO1xuICAgICAgeTAgPSB5MSA9IF87XG4gICAgICByZXR1cm4gYXJlYTtcbiAgICB9O1xuICAgIGFyZWEueTAgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB5MDtcbiAgICAgIHkwID0gXztcbiAgICAgIHJldHVybiBhcmVhO1xuICAgIH07XG4gICAgYXJlYS55MSA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHkxO1xuICAgICAgeTEgPSBfO1xuICAgICAgcmV0dXJuIGFyZWE7XG4gICAgfTtcbiAgICBhcmVhLmRlZmluZWQgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBkZWZpbmVkO1xuICAgICAgZGVmaW5lZCA9IF87XG4gICAgICByZXR1cm4gYXJlYTtcbiAgICB9O1xuICAgIGFyZWEuaW50ZXJwb2xhdGUgPSBmdW5jdGlvbihfKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBpbnRlcnBvbGF0ZUtleTtcbiAgICAgIGlmICh0eXBlb2YgXyA9PT0gXCJmdW5jdGlvblwiKSBpbnRlcnBvbGF0ZUtleSA9IGludGVycG9sYXRlID0gXzsgZWxzZSBpbnRlcnBvbGF0ZUtleSA9IChpbnRlcnBvbGF0ZSA9IGQzX3N2Z19saW5lSW50ZXJwb2xhdG9ycy5nZXQoXykgfHwgZDNfc3ZnX2xpbmVMaW5lYXIpLmtleTtcbiAgICAgIGludGVycG9sYXRlUmV2ZXJzZSA9IGludGVycG9sYXRlLnJldmVyc2UgfHwgaW50ZXJwb2xhdGU7XG4gICAgICBMID0gaW50ZXJwb2xhdGUuY2xvc2VkID8gXCJNXCIgOiBcIkxcIjtcbiAgICAgIHJldHVybiBhcmVhO1xuICAgIH07XG4gICAgYXJlYS50ZW5zaW9uID0gZnVuY3Rpb24oXykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGVuc2lvbjtcbiAgICAgIHRlbnNpb24gPSBfO1xuICAgICAgcmV0dXJuIGFyZWE7XG4gICAgfTtcbiAgICByZXR1cm4gYXJlYTtcbiAgfVxuICBkM19zdmdfbGluZVN0ZXBCZWZvcmUucmV2ZXJzZSA9IGQzX3N2Z19saW5lU3RlcEFmdGVyO1xuICBkM19zdmdfbGluZVN0ZXBBZnRlci5yZXZlcnNlID0gZDNfc3ZnX2xpbmVTdGVwQmVmb3JlO1xuICBkMy5zdmcuYXJlYSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkM19zdmdfYXJlYShkM19pZGVudGl0eSk7XG4gIH07XG4gIGQzLnN2Zy5hcmVhLnJhZGlhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmVhID0gZDNfc3ZnX2FyZWEoZDNfc3ZnX2xpbmVSYWRpYWwpO1xuICAgIGFyZWEucmFkaXVzID0gYXJlYS54LCBkZWxldGUgYXJlYS54O1xuICAgIGFyZWEuaW5uZXJSYWRpdXMgPSBhcmVhLngwLCBkZWxldGUgYXJlYS54MDtcbiAgICBhcmVhLm91dGVyUmFkaXVzID0gYXJlYS54MSwgZGVsZXRlIGFyZWEueDE7XG4gICAgYXJlYS5hbmdsZSA9IGFyZWEueSwgZGVsZXRlIGFyZWEueTtcbiAgICBhcmVhLnN0YXJ0QW5nbGUgPSBhcmVhLnkwLCBkZWxldGUgYXJlYS55MDtcbiAgICBhcmVhLmVuZEFuZ2xlID0gYXJlYS55MSwgZGVsZXRlIGFyZWEueTE7XG4gICAgcmV0dXJuIGFyZWE7XG4gIH07XG4gIGQzLnN2Zy5jaG9yZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzb3VyY2UgPSBkM19zb3VyY2UsIHRhcmdldCA9IGQzX3RhcmdldCwgcmFkaXVzID0gZDNfc3ZnX2Nob3JkUmFkaXVzLCBzdGFydEFuZ2xlID0gZDNfc3ZnX2FyY1N0YXJ0QW5nbGUsIGVuZEFuZ2xlID0gZDNfc3ZnX2FyY0VuZEFuZ2xlO1xuICAgIGZ1bmN0aW9uIGNob3JkKGQsIGkpIHtcbiAgICAgIHZhciBzID0gc3ViZ3JvdXAodGhpcywgc291cmNlLCBkLCBpKSwgdCA9IHN1Ymdyb3VwKHRoaXMsIHRhcmdldCwgZCwgaSk7XG4gICAgICByZXR1cm4gXCJNXCIgKyBzLnAwICsgYXJjKHMuciwgcy5wMSwgcy5hMSAtIHMuYTApICsgKGVxdWFscyhzLCB0KSA/IGN1cnZlKHMuciwgcy5wMSwgcy5yLCBzLnAwKSA6IGN1cnZlKHMuciwgcy5wMSwgdC5yLCB0LnAwKSArIGFyYyh0LnIsIHQucDEsIHQuYTEgLSB0LmEwKSArIGN1cnZlKHQuciwgdC5wMSwgcy5yLCBzLnAwKSkgKyBcIlpcIjtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3ViZ3JvdXAoc2VsZiwgZiwgZCwgaSkge1xuICAgICAgdmFyIHN1Ymdyb3VwID0gZi5jYWxsKHNlbGYsIGQsIGkpLCByID0gcmFkaXVzLmNhbGwoc2VsZiwgc3ViZ3JvdXAsIGkpLCBhMCA9IHN0YXJ0QW5nbGUuY2FsbChzZWxmLCBzdWJncm91cCwgaSkgLSBoYWxmz4AsIGExID0gZW5kQW5nbGUuY2FsbChzZWxmLCBzdWJncm91cCwgaSkgLSBoYWxmz4A7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByOiByLFxuICAgICAgICBhMDogYTAsXG4gICAgICAgIGExOiBhMSxcbiAgICAgICAgcDA6IFsgciAqIE1hdGguY29zKGEwKSwgciAqIE1hdGguc2luKGEwKSBdLFxuICAgICAgICBwMTogWyByICogTWF0aC5jb3MoYTEpLCByICogTWF0aC5zaW4oYTEpIF1cbiAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVxdWFscyhhLCBiKSB7XG4gICAgICByZXR1cm4gYS5hMCA9PSBiLmEwICYmIGEuYTEgPT0gYi5hMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXJjKHIsIHAsIGEpIHtcbiAgICAgIHJldHVybiBcIkFcIiArIHIgKyBcIixcIiArIHIgKyBcIiAwIFwiICsgKyhhID4gz4ApICsgXCIsMSBcIiArIHA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGN1cnZlKHIwLCBwMCwgcjEsIHAxKSB7XG4gICAgICByZXR1cm4gXCJRIDAsMCBcIiArIHAxO1xuICAgIH1cbiAgICBjaG9yZC5yYWRpdXMgPSBmdW5jdGlvbih2KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiByYWRpdXM7XG4gICAgICByYWRpdXMgPSBkM19mdW5jdG9yKHYpO1xuICAgICAgcmV0dXJuIGNob3JkO1xuICAgIH07XG4gICAgY2hvcmQuc291cmNlID0gZnVuY3Rpb24odikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc291cmNlO1xuICAgICAgc291cmNlID0gZDNfZnVuY3Rvcih2KTtcbiAgICAgIHJldHVybiBjaG9yZDtcbiAgICB9O1xuICAgIGNob3JkLnRhcmdldCA9IGZ1bmN0aW9uKHYpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRhcmdldDtcbiAgICAgIHRhcmdldCA9IGQzX2Z1bmN0b3Iodik7XG4gICAgICByZXR1cm4gY2hvcmQ7XG4gICAgfTtcbiAgICBjaG9yZC5zdGFydEFuZ2xlID0gZnVuY3Rpb24odikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc3RhcnRBbmdsZTtcbiAgICAgIHN0YXJ0QW5nbGUgPSBkM19mdW5jdG9yKHYpO1xuICAgICAgcmV0dXJuIGNob3JkO1xuICAgIH07XG4gICAgY2hvcmQuZW5kQW5nbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBlbmRBbmdsZTtcbiAgICAgIGVuZEFuZ2xlID0gZDNfZnVuY3Rvcih2KTtcbiAgICAgIHJldHVybiBjaG9yZDtcbiAgICB9O1xuICAgIHJldHVybiBjaG9yZDtcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc3ZnX2Nob3JkUmFkaXVzKGQpIHtcbiAgICByZXR1cm4gZC5yYWRpdXM7XG4gIH1cbiAgZDMuc3ZnLmRpYWdvbmFsID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNvdXJjZSA9IGQzX3NvdXJjZSwgdGFyZ2V0ID0gZDNfdGFyZ2V0LCBwcm9qZWN0aW9uID0gZDNfc3ZnX2RpYWdvbmFsUHJvamVjdGlvbjtcbiAgICBmdW5jdGlvbiBkaWFnb25hbChkLCBpKSB7XG4gICAgICB2YXIgcDAgPSBzb3VyY2UuY2FsbCh0aGlzLCBkLCBpKSwgcDMgPSB0YXJnZXQuY2FsbCh0aGlzLCBkLCBpKSwgbSA9IChwMC55ICsgcDMueSkgLyAyLCBwID0gWyBwMCwge1xuICAgICAgICB4OiBwMC54LFxuICAgICAgICB5OiBtXG4gICAgICB9LCB7XG4gICAgICAgIHg6IHAzLngsXG4gICAgICAgIHk6IG1cbiAgICAgIH0sIHAzIF07XG4gICAgICBwID0gcC5tYXAocHJvamVjdGlvbik7XG4gICAgICByZXR1cm4gXCJNXCIgKyBwWzBdICsgXCJDXCIgKyBwWzFdICsgXCIgXCIgKyBwWzJdICsgXCIgXCIgKyBwWzNdO1xuICAgIH1cbiAgICBkaWFnb25hbC5zb3VyY2UgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzb3VyY2U7XG4gICAgICBzb3VyY2UgPSBkM19mdW5jdG9yKHgpO1xuICAgICAgcmV0dXJuIGRpYWdvbmFsO1xuICAgIH07XG4gICAgZGlhZ29uYWwudGFyZ2V0ID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGFyZ2V0O1xuICAgICAgdGFyZ2V0ID0gZDNfZnVuY3Rvcih4KTtcbiAgICAgIHJldHVybiBkaWFnb25hbDtcbiAgICB9O1xuICAgIGRpYWdvbmFsLnByb2plY3Rpb24gPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwcm9qZWN0aW9uO1xuICAgICAgcHJvamVjdGlvbiA9IHg7XG4gICAgICByZXR1cm4gZGlhZ29uYWw7XG4gICAgfTtcbiAgICByZXR1cm4gZGlhZ29uYWw7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3N2Z19kaWFnb25hbFByb2plY3Rpb24oZCkge1xuICAgIHJldHVybiBbIGQueCwgZC55IF07XG4gIH1cbiAgZDMuc3ZnLmRpYWdvbmFsLnJhZGlhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkaWFnb25hbCA9IGQzLnN2Zy5kaWFnb25hbCgpLCBwcm9qZWN0aW9uID0gZDNfc3ZnX2RpYWdvbmFsUHJvamVjdGlvbiwgcHJvamVjdGlvbl8gPSBkaWFnb25hbC5wcm9qZWN0aW9uO1xuICAgIGRpYWdvbmFsLnByb2plY3Rpb24gPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IHByb2plY3Rpb25fKGQzX3N2Z19kaWFnb25hbFJhZGlhbFByb2plY3Rpb24ocHJvamVjdGlvbiA9IHgpKSA6IHByb2plY3Rpb247XG4gICAgfTtcbiAgICByZXR1cm4gZGlhZ29uYWw7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3N2Z19kaWFnb25hbFJhZGlhbFByb2plY3Rpb24ocHJvamVjdGlvbikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBkID0gcHJvamVjdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCByID0gZFswXSwgYSA9IGRbMV0gLSBoYWxmz4A7XG4gICAgICByZXR1cm4gWyByICogTWF0aC5jb3MoYSksIHIgKiBNYXRoLnNpbihhKSBdO1xuICAgIH07XG4gIH1cbiAgZDMuc3ZnLnN5bWJvbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0eXBlID0gZDNfc3ZnX3N5bWJvbFR5cGUsIHNpemUgPSBkM19zdmdfc3ltYm9sU2l6ZTtcbiAgICBmdW5jdGlvbiBzeW1ib2woZCwgaSkge1xuICAgICAgcmV0dXJuIChkM19zdmdfc3ltYm9scy5nZXQodHlwZS5jYWxsKHRoaXMsIGQsIGkpKSB8fCBkM19zdmdfc3ltYm9sQ2lyY2xlKShzaXplLmNhbGwodGhpcywgZCwgaSkpO1xuICAgIH1cbiAgICBzeW1ib2wudHlwZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHR5cGU7XG4gICAgICB0eXBlID0gZDNfZnVuY3Rvcih4KTtcbiAgICAgIHJldHVybiBzeW1ib2w7XG4gICAgfTtcbiAgICBzeW1ib2wuc2l6ZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHNpemU7XG4gICAgICBzaXplID0gZDNfZnVuY3Rvcih4KTtcbiAgICAgIHJldHVybiBzeW1ib2w7XG4gICAgfTtcbiAgICByZXR1cm4gc3ltYm9sO1xuICB9O1xuICBmdW5jdGlvbiBkM19zdmdfc3ltYm9sU2l6ZSgpIHtcbiAgICByZXR1cm4gNjQ7XG4gIH1cbiAgZnVuY3Rpb24gZDNfc3ZnX3N5bWJvbFR5cGUoKSB7XG4gICAgcmV0dXJuIFwiY2lyY2xlXCI7XG4gIH1cbiAgZnVuY3Rpb24gZDNfc3ZnX3N5bWJvbENpcmNsZShzaXplKSB7XG4gICAgdmFyIHIgPSBNYXRoLnNxcnQoc2l6ZSAvIM+AKTtcbiAgICByZXR1cm4gXCJNMCxcIiArIHIgKyBcIkFcIiArIHIgKyBcIixcIiArIHIgKyBcIiAwIDEsMSAwLFwiICsgLXIgKyBcIkFcIiArIHIgKyBcIixcIiArIHIgKyBcIiAwIDEsMSAwLFwiICsgciArIFwiWlwiO1xuICB9XG4gIHZhciBkM19zdmdfc3ltYm9scyA9IGQzLm1hcCh7XG4gICAgY2lyY2xlOiBkM19zdmdfc3ltYm9sQ2lyY2xlLFxuICAgIGNyb3NzOiBmdW5jdGlvbihzaXplKSB7XG4gICAgICB2YXIgciA9IE1hdGguc3FydChzaXplIC8gNSkgLyAyO1xuICAgICAgcmV0dXJuIFwiTVwiICsgLTMgKiByICsgXCIsXCIgKyAtciArIFwiSFwiICsgLXIgKyBcIlZcIiArIC0zICogciArIFwiSFwiICsgciArIFwiVlwiICsgLXIgKyBcIkhcIiArIDMgKiByICsgXCJWXCIgKyByICsgXCJIXCIgKyByICsgXCJWXCIgKyAzICogciArIFwiSFwiICsgLXIgKyBcIlZcIiArIHIgKyBcIkhcIiArIC0zICogciArIFwiWlwiO1xuICAgIH0sXG4gICAgZGlhbW9uZDogZnVuY3Rpb24oc2l6ZSkge1xuICAgICAgdmFyIHJ5ID0gTWF0aC5zcXJ0KHNpemUgLyAoMiAqIGQzX3N2Z19zeW1ib2xUYW4zMCkpLCByeCA9IHJ5ICogZDNfc3ZnX3N5bWJvbFRhbjMwO1xuICAgICAgcmV0dXJuIFwiTTAsXCIgKyAtcnkgKyBcIkxcIiArIHJ4ICsgXCIsMFwiICsgXCIgMCxcIiArIHJ5ICsgXCIgXCIgKyAtcnggKyBcIiwwXCIgKyBcIlpcIjtcbiAgICB9LFxuICAgIHNxdWFyZTogZnVuY3Rpb24oc2l6ZSkge1xuICAgICAgdmFyIHIgPSBNYXRoLnNxcnQoc2l6ZSkgLyAyO1xuICAgICAgcmV0dXJuIFwiTVwiICsgLXIgKyBcIixcIiArIC1yICsgXCJMXCIgKyByICsgXCIsXCIgKyAtciArIFwiIFwiICsgciArIFwiLFwiICsgciArIFwiIFwiICsgLXIgKyBcIixcIiArIHIgKyBcIlpcIjtcbiAgICB9LFxuICAgIFwidHJpYW5nbGUtZG93blwiOiBmdW5jdGlvbihzaXplKSB7XG4gICAgICB2YXIgcnggPSBNYXRoLnNxcnQoc2l6ZSAvIGQzX3N2Z19zeW1ib2xTcXJ0MyksIHJ5ID0gcnggKiBkM19zdmdfc3ltYm9sU3FydDMgLyAyO1xuICAgICAgcmV0dXJuIFwiTTAsXCIgKyByeSArIFwiTFwiICsgcnggKyBcIixcIiArIC1yeSArIFwiIFwiICsgLXJ4ICsgXCIsXCIgKyAtcnkgKyBcIlpcIjtcbiAgICB9LFxuICAgIFwidHJpYW5nbGUtdXBcIjogZnVuY3Rpb24oc2l6ZSkge1xuICAgICAgdmFyIHJ4ID0gTWF0aC5zcXJ0KHNpemUgLyBkM19zdmdfc3ltYm9sU3FydDMpLCByeSA9IHJ4ICogZDNfc3ZnX3N5bWJvbFNxcnQzIC8gMjtcbiAgICAgIHJldHVybiBcIk0wLFwiICsgLXJ5ICsgXCJMXCIgKyByeCArIFwiLFwiICsgcnkgKyBcIiBcIiArIC1yeCArIFwiLFwiICsgcnkgKyBcIlpcIjtcbiAgICB9XG4gIH0pO1xuICBkMy5zdmcuc3ltYm9sVHlwZXMgPSBkM19zdmdfc3ltYm9scy5rZXlzKCk7XG4gIHZhciBkM19zdmdfc3ltYm9sU3FydDMgPSBNYXRoLnNxcnQoMyksIGQzX3N2Z19zeW1ib2xUYW4zMCA9IE1hdGgudGFuKDMwICogZDNfcmFkaWFucyk7XG4gIGQzX3NlbGVjdGlvblByb3RvdHlwZS50cmFuc2l0aW9uID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBpZCA9IGQzX3RyYW5zaXRpb25Jbmhlcml0SWQgfHwgKytkM190cmFuc2l0aW9uSWQsIG5zID0gZDNfdHJhbnNpdGlvbk5hbWVzcGFjZShuYW1lKSwgc3ViZ3JvdXBzID0gW10sIHN1Ymdyb3VwLCBub2RlLCB0cmFuc2l0aW9uID0gZDNfdHJhbnNpdGlvbkluaGVyaXQgfHwge1xuICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgIGVhc2U6IGQzX2Vhc2VfY3ViaWNJbk91dCxcbiAgICAgIGRlbGF5OiAwLFxuICAgICAgZHVyYXRpb246IDI1MFxuICAgIH07XG4gICAgZm9yICh2YXIgaiA9IC0xLCBtID0gdGhpcy5sZW5ndGg7ICsraiA8IG07ICkge1xuICAgICAgc3ViZ3JvdXBzLnB1c2goc3ViZ3JvdXAgPSBbXSk7XG4gICAgICBmb3IgKHZhciBncm91cCA9IHRoaXNbal0sIGkgPSAtMSwgbiA9IGdyb3VwLmxlbmd0aDsgKytpIDwgbjsgKSB7XG4gICAgICAgIGlmIChub2RlID0gZ3JvdXBbaV0pIGQzX3RyYW5zaXRpb25Ob2RlKG5vZGUsIGksIG5zLCBpZCwgdHJhbnNpdGlvbik7XG4gICAgICAgIHN1Ymdyb3VwLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkM190cmFuc2l0aW9uKHN1Ymdyb3VwcywgbnMsIGlkKTtcbiAgfTtcbiAgZDNfc2VsZWN0aW9uUHJvdG90eXBlLmludGVycnVwdCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKG5hbWUgPT0gbnVsbCA/IGQzX3NlbGVjdGlvbl9pbnRlcnJ1cHQgOiBkM19zZWxlY3Rpb25faW50ZXJydXB0TlMoZDNfdHJhbnNpdGlvbk5hbWVzcGFjZShuYW1lKSkpO1xuICB9O1xuICB2YXIgZDNfc2VsZWN0aW9uX2ludGVycnVwdCA9IGQzX3NlbGVjdGlvbl9pbnRlcnJ1cHROUyhkM190cmFuc2l0aW9uTmFtZXNwYWNlKCkpO1xuICBmdW5jdGlvbiBkM19zZWxlY3Rpb25faW50ZXJydXB0TlMobnMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbG9jaywgYWN0aXZlSWQsIGFjdGl2ZTtcbiAgICAgIGlmICgobG9jayA9IHRoaXNbbnNdKSAmJiAoYWN0aXZlID0gbG9ja1thY3RpdmVJZCA9IGxvY2suYWN0aXZlXSkpIHtcbiAgICAgICAgYWN0aXZlLnRpbWVyLmMgPSBudWxsO1xuICAgICAgICBhY3RpdmUudGltZXIudCA9IE5hTjtcbiAgICAgICAgaWYgKC0tbG9jay5jb3VudCkgZGVsZXRlIGxvY2tbYWN0aXZlSWRdOyBlbHNlIGRlbGV0ZSB0aGlzW25zXTtcbiAgICAgICAgbG9jay5hY3RpdmUgKz0gLjU7XG4gICAgICAgIGFjdGl2ZS5ldmVudCAmJiBhY3RpdmUuZXZlbnQuaW50ZXJydXB0LmNhbGwodGhpcywgdGhpcy5fX2RhdGFfXywgYWN0aXZlLmluZGV4KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGQzX3RyYW5zaXRpb24oZ3JvdXBzLCBucywgaWQpIHtcbiAgICBkM19zdWJjbGFzcyhncm91cHMsIGQzX3RyYW5zaXRpb25Qcm90b3R5cGUpO1xuICAgIGdyb3Vwcy5uYW1lc3BhY2UgPSBucztcbiAgICBncm91cHMuaWQgPSBpZDtcbiAgICByZXR1cm4gZ3JvdXBzO1xuICB9XG4gIHZhciBkM190cmFuc2l0aW9uUHJvdG90eXBlID0gW10sIGQzX3RyYW5zaXRpb25JZCA9IDAsIGQzX3RyYW5zaXRpb25Jbmhlcml0SWQsIGQzX3RyYW5zaXRpb25Jbmhlcml0O1xuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLmNhbGwgPSBkM19zZWxlY3Rpb25Qcm90b3R5cGUuY2FsbDtcbiAgZDNfdHJhbnNpdGlvblByb3RvdHlwZS5lbXB0eSA9IGQzX3NlbGVjdGlvblByb3RvdHlwZS5lbXB0eTtcbiAgZDNfdHJhbnNpdGlvblByb3RvdHlwZS5ub2RlID0gZDNfc2VsZWN0aW9uUHJvdG90eXBlLm5vZGU7XG4gIGQzX3RyYW5zaXRpb25Qcm90b3R5cGUuc2l6ZSA9IGQzX3NlbGVjdGlvblByb3RvdHlwZS5zaXplO1xuICBkMy50cmFuc2l0aW9uID0gZnVuY3Rpb24oc2VsZWN0aW9uLCBuYW1lKSB7XG4gICAgcmV0dXJuIHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24udHJhbnNpdGlvbiA/IGQzX3RyYW5zaXRpb25Jbmhlcml0SWQgPyBzZWxlY3Rpb24udHJhbnNpdGlvbihuYW1lKSA6IHNlbGVjdGlvbiA6IGQzLnNlbGVjdGlvbigpLnRyYW5zaXRpb24oc2VsZWN0aW9uKTtcbiAgfTtcbiAgZDMudHJhbnNpdGlvbi5wcm90b3R5cGUgPSBkM190cmFuc2l0aW9uUHJvdG90eXBlO1xuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgdmFyIGlkID0gdGhpcy5pZCwgbnMgPSB0aGlzLm5hbWVzcGFjZSwgc3ViZ3JvdXBzID0gW10sIHN1Ymdyb3VwLCBzdWJub2RlLCBub2RlO1xuICAgIHNlbGVjdG9yID0gZDNfc2VsZWN0aW9uX3NlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICBmb3IgKHZhciBqID0gLTEsIG0gPSB0aGlzLmxlbmd0aDsgKytqIDwgbTsgKSB7XG4gICAgICBzdWJncm91cHMucHVzaChzdWJncm91cCA9IFtdKTtcbiAgICAgIGZvciAodmFyIGdyb3VwID0gdGhpc1tqXSwgaSA9IC0xLCBuID0gZ3JvdXAubGVuZ3RoOyArK2kgPCBuOyApIHtcbiAgICAgICAgaWYgKChub2RlID0gZ3JvdXBbaV0pICYmIChzdWJub2RlID0gc2VsZWN0b3IuY2FsbChub2RlLCBub2RlLl9fZGF0YV9fLCBpLCBqKSkpIHtcbiAgICAgICAgICBpZiAoXCJfX2RhdGFfX1wiIGluIG5vZGUpIHN1Ym5vZGUuX19kYXRhX18gPSBub2RlLl9fZGF0YV9fO1xuICAgICAgICAgIGQzX3RyYW5zaXRpb25Ob2RlKHN1Ym5vZGUsIGksIG5zLCBpZCwgbm9kZVtuc11baWRdKTtcbiAgICAgICAgICBzdWJncm91cC5wdXNoKHN1Ym5vZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN1Ymdyb3VwLnB1c2gobnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGQzX3RyYW5zaXRpb24oc3ViZ3JvdXBzLCBucywgaWQpO1xuICB9O1xuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLnNlbGVjdEFsbCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgdmFyIGlkID0gdGhpcy5pZCwgbnMgPSB0aGlzLm5hbWVzcGFjZSwgc3ViZ3JvdXBzID0gW10sIHN1Ymdyb3VwLCBzdWJub2Rlcywgbm9kZSwgc3Vibm9kZSwgdHJhbnNpdGlvbjtcbiAgICBzZWxlY3RvciA9IGQzX3NlbGVjdGlvbl9zZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgZm9yICh2YXIgaiA9IC0xLCBtID0gdGhpcy5sZW5ndGg7ICsraiA8IG07ICkge1xuICAgICAgZm9yICh2YXIgZ3JvdXAgPSB0aGlzW2pdLCBpID0gLTEsIG4gPSBncm91cC5sZW5ndGg7ICsraSA8IG47ICkge1xuICAgICAgICBpZiAobm9kZSA9IGdyb3VwW2ldKSB7XG4gICAgICAgICAgdHJhbnNpdGlvbiA9IG5vZGVbbnNdW2lkXTtcbiAgICAgICAgICBzdWJub2RlcyA9IHNlbGVjdG9yLmNhbGwobm9kZSwgbm9kZS5fX2RhdGFfXywgaSwgaik7XG4gICAgICAgICAgc3ViZ3JvdXBzLnB1c2goc3ViZ3JvdXAgPSBbXSk7XG4gICAgICAgICAgZm9yICh2YXIgayA9IC0xLCBvID0gc3Vibm9kZXMubGVuZ3RoOyArK2sgPCBvOyApIHtcbiAgICAgICAgICAgIGlmIChzdWJub2RlID0gc3Vibm9kZXNba10pIGQzX3RyYW5zaXRpb25Ob2RlKHN1Ym5vZGUsIGssIG5zLCBpZCwgdHJhbnNpdGlvbik7XG4gICAgICAgICAgICBzdWJncm91cC5wdXNoKHN1Ym5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZDNfdHJhbnNpdGlvbihzdWJncm91cHMsIG5zLCBpZCk7XG4gIH07XG4gIGQzX3RyYW5zaXRpb25Qcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24oZmlsdGVyKSB7XG4gICAgdmFyIHN1Ymdyb3VwcyA9IFtdLCBzdWJncm91cCwgZ3JvdXAsIG5vZGU7XG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgIT09IFwiZnVuY3Rpb25cIikgZmlsdGVyID0gZDNfc2VsZWN0aW9uX2ZpbHRlcihmaWx0ZXIpO1xuICAgIGZvciAodmFyIGogPSAwLCBtID0gdGhpcy5sZW5ndGg7IGogPCBtOyBqKyspIHtcbiAgICAgIHN1Ymdyb3Vwcy5wdXNoKHN1Ymdyb3VwID0gW10pO1xuICAgICAgZm9yICh2YXIgZ3JvdXAgPSB0aGlzW2pdLCBpID0gMCwgbiA9IGdyb3VwLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBpZiAoKG5vZGUgPSBncm91cFtpXSkgJiYgZmlsdGVyLmNhbGwobm9kZSwgbm9kZS5fX2RhdGFfXywgaSwgaikpIHtcbiAgICAgICAgICBzdWJncm91cC5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkM190cmFuc2l0aW9uKHN1Ymdyb3VwcywgdGhpcy5uYW1lc3BhY2UsIHRoaXMuaWQpO1xuICB9O1xuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLnR3ZWVuID0gZnVuY3Rpb24obmFtZSwgdHdlZW4pIHtcbiAgICB2YXIgaWQgPSB0aGlzLmlkLCBucyA9IHRoaXMubmFtZXNwYWNlO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikgcmV0dXJuIHRoaXMubm9kZSgpW25zXVtpZF0udHdlZW4uZ2V0KG5hbWUpO1xuICAgIHJldHVybiBkM19zZWxlY3Rpb25fZWFjaCh0aGlzLCB0d2VlbiA9PSBudWxsID8gZnVuY3Rpb24obm9kZSkge1xuICAgICAgbm9kZVtuc11baWRdLnR3ZWVuLnJlbW92ZShuYW1lKTtcbiAgICB9IDogZnVuY3Rpb24obm9kZSkge1xuICAgICAgbm9kZVtuc11baWRdLnR3ZWVuLnNldChuYW1lLCB0d2Vlbik7XG4gICAgfSk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3RyYW5zaXRpb25fdHdlZW4oZ3JvdXBzLCBuYW1lLCB2YWx1ZSwgdHdlZW4pIHtcbiAgICB2YXIgaWQgPSBncm91cHMuaWQsIG5zID0gZ3JvdXBzLm5hbWVzcGFjZTtcbiAgICByZXR1cm4gZDNfc2VsZWN0aW9uX2VhY2goZ3JvdXBzLCB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiA/IGZ1bmN0aW9uKG5vZGUsIGksIGopIHtcbiAgICAgIG5vZGVbbnNdW2lkXS50d2Vlbi5zZXQobmFtZSwgdHdlZW4odmFsdWUuY2FsbChub2RlLCBub2RlLl9fZGF0YV9fLCBpLCBqKSkpO1xuICAgIH0gOiAodmFsdWUgPSB0d2Vlbih2YWx1ZSksIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIG5vZGVbbnNdW2lkXS50d2Vlbi5zZXQobmFtZSwgdmFsdWUpO1xuICAgIH0pKTtcbiAgfVxuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLmF0dHIgPSBmdW5jdGlvbihuYW1lTlMsIHZhbHVlKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG4gICAgICBmb3IgKHZhbHVlIGluIG5hbWVOUykgdGhpcy5hdHRyKHZhbHVlLCBuYW1lTlNbdmFsdWVdKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB2YXIgaW50ZXJwb2xhdGUgPSBuYW1lTlMgPT0gXCJ0cmFuc2Zvcm1cIiA/IGQzX2ludGVycG9sYXRlVHJhbnNmb3JtIDogZDNfaW50ZXJwb2xhdGUsIG5hbWUgPSBkMy5ucy5xdWFsaWZ5KG5hbWVOUyk7XG4gICAgZnVuY3Rpb24gYXR0ck51bGwoKSB7XG4gICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXR0ck51bGxOUygpIHtcbiAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlTlMobmFtZS5zcGFjZSwgbmFtZS5sb2NhbCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGF0dHJUd2VlbihiKSB7XG4gICAgICByZXR1cm4gYiA9PSBudWxsID8gYXR0ck51bGwgOiAoYiArPSBcIlwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzLmdldEF0dHJpYnV0ZShuYW1lKSwgaTtcbiAgICAgICAgcmV0dXJuIGEgIT09IGIgJiYgKGkgPSBpbnRlcnBvbGF0ZShhLCBiKSwgZnVuY3Rpb24odCkge1xuICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIGkodCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhdHRyVHdlZW5OUyhiKSB7XG4gICAgICByZXR1cm4gYiA9PSBudWxsID8gYXR0ck51bGxOUyA6IChiICs9IFwiXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYSA9IHRoaXMuZ2V0QXR0cmlidXRlTlMobmFtZS5zcGFjZSwgbmFtZS5sb2NhbCksIGk7XG4gICAgICAgIHJldHVybiBhICE9PSBiICYmIChpID0gaW50ZXJwb2xhdGUoYSwgYiksIGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZU5TKG5hbWUuc3BhY2UsIG5hbWUubG9jYWwsIGkodCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZDNfdHJhbnNpdGlvbl90d2Vlbih0aGlzLCBcImF0dHIuXCIgKyBuYW1lTlMsIHZhbHVlLCBuYW1lLmxvY2FsID8gYXR0clR3ZWVuTlMgOiBhdHRyVHdlZW4pO1xuICB9O1xuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLmF0dHJUd2VlbiA9IGZ1bmN0aW9uKG5hbWVOUywgdHdlZW4pIHtcbiAgICB2YXIgbmFtZSA9IGQzLm5zLnF1YWxpZnkobmFtZU5TKTtcbiAgICBmdW5jdGlvbiBhdHRyVHdlZW4oZCwgaSkge1xuICAgICAgdmFyIGYgPSB0d2Vlbi5jYWxsKHRoaXMsIGQsIGksIHRoaXMuZ2V0QXR0cmlidXRlKG5hbWUpKTtcbiAgICAgIHJldHVybiBmICYmIGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgZih0KSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBhdHRyVHdlZW5OUyhkLCBpKSB7XG4gICAgICB2YXIgZiA9IHR3ZWVuLmNhbGwodGhpcywgZCwgaSwgdGhpcy5nZXRBdHRyaWJ1dGVOUyhuYW1lLnNwYWNlLCBuYW1lLmxvY2FsKSk7XG4gICAgICByZXR1cm4gZiAmJiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlTlMobmFtZS5zcGFjZSwgbmFtZS5sb2NhbCwgZih0KSk7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy50d2VlbihcImF0dHIuXCIgKyBuYW1lTlMsIG5hbWUubG9jYWwgPyBhdHRyVHdlZW5OUyA6IGF0dHJUd2Vlbik7XG4gIH07XG4gIGQzX3RyYW5zaXRpb25Qcm90b3R5cGUuc3R5bGUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgcHJpb3JpdHkpIHtcbiAgICB2YXIgbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKG4gPCAzKSB7XG4gICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgaWYgKG4gPCAyKSB2YWx1ZSA9IFwiXCI7XG4gICAgICAgIGZvciAocHJpb3JpdHkgaW4gbmFtZSkgdGhpcy5zdHlsZShwcmlvcml0eSwgbmFtZVtwcmlvcml0eV0sIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBwcmlvcml0eSA9IFwiXCI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN0eWxlTnVsbCgpIHtcbiAgICAgIHRoaXMuc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN0eWxlU3RyaW5nKGIpIHtcbiAgICAgIHJldHVybiBiID09IG51bGwgPyBzdHlsZU51bGwgOiAoYiArPSBcIlwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGEgPSBkM193aW5kb3codGhpcykuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpLCBpO1xuICAgICAgICByZXR1cm4gYSAhPT0gYiAmJiAoaSA9IGQzX2ludGVycG9sYXRlKGEsIGIpLCBmdW5jdGlvbih0KSB7XG4gICAgICAgICAgdGhpcy5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCBpKHQpLCBwcmlvcml0eSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBkM190cmFuc2l0aW9uX3R3ZWVuKHRoaXMsIFwic3R5bGUuXCIgKyBuYW1lLCB2YWx1ZSwgc3R5bGVTdHJpbmcpO1xuICB9O1xuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLnN0eWxlVHdlZW4gPSBmdW5jdGlvbihuYW1lLCB0d2VlbiwgcHJpb3JpdHkpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHByaW9yaXR5ID0gXCJcIjtcbiAgICBmdW5jdGlvbiBzdHlsZVR3ZWVuKGQsIGkpIHtcbiAgICAgIHZhciBmID0gdHdlZW4uY2FsbCh0aGlzLCBkLCBpLCBkM193aW5kb3codGhpcykuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpKTtcbiAgICAgIHJldHVybiBmICYmIGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgdGhpcy5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCBmKHQpLCBwcmlvcml0eSk7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy50d2VlbihcInN0eWxlLlwiICsgbmFtZSwgc3R5bGVUd2Vlbik7XG4gIH07XG4gIGQzX3RyYW5zaXRpb25Qcm90b3R5cGUudGV4dCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIGQzX3RyYW5zaXRpb25fdHdlZW4odGhpcywgXCJ0ZXh0XCIsIHZhbHVlLCBkM190cmFuc2l0aW9uX3RleHQpO1xuICB9O1xuICBmdW5jdGlvbiBkM190cmFuc2l0aW9uX3RleHQoYikge1xuICAgIGlmIChiID09IG51bGwpIGIgPSBcIlwiO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudGV4dENvbnRlbnQgPSBiO1xuICAgIH07XG4gIH1cbiAgZDNfdHJhbnNpdGlvblByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbnMgPSB0aGlzLm5hbWVzcGFjZTtcbiAgICByZXR1cm4gdGhpcy5lYWNoKFwiZW5kLnRyYW5zaXRpb25cIiwgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcDtcbiAgICAgIGlmICh0aGlzW25zXS5jb3VudCA8IDIgJiYgKHAgPSB0aGlzLnBhcmVudE5vZGUpKSBwLnJlbW92ZUNoaWxkKHRoaXMpO1xuICAgIH0pO1xuICB9O1xuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLmVhc2UgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhciBpZCA9IHRoaXMuaWQsIG5zID0gdGhpcy5uYW1lc3BhY2U7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAxKSByZXR1cm4gdGhpcy5ub2RlKClbbnNdW2lkXS5lYXNlO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwiZnVuY3Rpb25cIikgdmFsdWUgPSBkMy5lYXNlLmFwcGx5KGQzLCBhcmd1bWVudHMpO1xuICAgIHJldHVybiBkM19zZWxlY3Rpb25fZWFjaCh0aGlzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICBub2RlW25zXVtpZF0uZWFzZSA9IHZhbHVlO1xuICAgIH0pO1xuICB9O1xuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgaWQgPSB0aGlzLmlkLCBucyA9IHRoaXMubmFtZXNwYWNlO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMSkgcmV0dXJuIHRoaXMubm9kZSgpW25zXVtpZF0uZGVsYXk7XG4gICAgcmV0dXJuIGQzX3NlbGVjdGlvbl9lYWNoKHRoaXMsIHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiID8gZnVuY3Rpb24obm9kZSwgaSwgaikge1xuICAgICAgbm9kZVtuc11baWRdLmRlbGF5ID0gK3ZhbHVlLmNhbGwobm9kZSwgbm9kZS5fX2RhdGFfXywgaSwgaik7XG4gICAgfSA6ICh2YWx1ZSA9ICt2YWx1ZSwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgbm9kZVtuc11baWRdLmRlbGF5ID0gdmFsdWU7XG4gICAgfSkpO1xuICB9O1xuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLmR1cmF0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgaWQgPSB0aGlzLmlkLCBucyA9IHRoaXMubmFtZXNwYWNlO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMSkgcmV0dXJuIHRoaXMubm9kZSgpW25zXVtpZF0uZHVyYXRpb247XG4gICAgcmV0dXJuIGQzX3NlbGVjdGlvbl9lYWNoKHRoaXMsIHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiID8gZnVuY3Rpb24obm9kZSwgaSwgaikge1xuICAgICAgbm9kZVtuc11baWRdLmR1cmF0aW9uID0gTWF0aC5tYXgoMSwgdmFsdWUuY2FsbChub2RlLCBub2RlLl9fZGF0YV9fLCBpLCBqKSk7XG4gICAgfSA6ICh2YWx1ZSA9IE1hdGgubWF4KDEsIHZhbHVlKSwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgbm9kZVtuc11baWRdLmR1cmF0aW9uID0gdmFsdWU7XG4gICAgfSkpO1xuICB9O1xuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLmVhY2ggPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICAgIHZhciBpZCA9IHRoaXMuaWQsIG5zID0gdGhpcy5uYW1lc3BhY2U7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG4gICAgICB2YXIgaW5oZXJpdCA9IGQzX3RyYW5zaXRpb25Jbmhlcml0LCBpbmhlcml0SWQgPSBkM190cmFuc2l0aW9uSW5oZXJpdElkO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZDNfdHJhbnNpdGlvbkluaGVyaXRJZCA9IGlkO1xuICAgICAgICBkM19zZWxlY3Rpb25fZWFjaCh0aGlzLCBmdW5jdGlvbihub2RlLCBpLCBqKSB7XG4gICAgICAgICAgZDNfdHJhbnNpdGlvbkluaGVyaXQgPSBub2RlW25zXVtpZF07XG4gICAgICAgICAgdHlwZS5jYWxsKG5vZGUsIG5vZGUuX19kYXRhX18sIGksIGopO1xuICAgICAgICB9KTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGQzX3RyYW5zaXRpb25Jbmhlcml0ID0gaW5oZXJpdDtcbiAgICAgICAgZDNfdHJhbnNpdGlvbkluaGVyaXRJZCA9IGluaGVyaXRJZDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZDNfc2VsZWN0aW9uX2VhY2godGhpcywgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgdHJhbnNpdGlvbiA9IG5vZGVbbnNdW2lkXTtcbiAgICAgICAgKHRyYW5zaXRpb24uZXZlbnQgfHwgKHRyYW5zaXRpb24uZXZlbnQgPSBkMy5kaXNwYXRjaChcInN0YXJ0XCIsIFwiZW5kXCIsIFwiaW50ZXJydXB0XCIpKSkub24odHlwZSwgbGlzdGVuZXIpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBkM190cmFuc2l0aW9uUHJvdG90eXBlLnRyYW5zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaWQwID0gdGhpcy5pZCwgaWQxID0gKytkM190cmFuc2l0aW9uSWQsIG5zID0gdGhpcy5uYW1lc3BhY2UsIHN1Ymdyb3VwcyA9IFtdLCBzdWJncm91cCwgZ3JvdXAsIG5vZGUsIHRyYW5zaXRpb247XG4gICAgZm9yICh2YXIgaiA9IDAsIG0gPSB0aGlzLmxlbmd0aDsgaiA8IG07IGorKykge1xuICAgICAgc3ViZ3JvdXBzLnB1c2goc3ViZ3JvdXAgPSBbXSk7XG4gICAgICBmb3IgKHZhciBncm91cCA9IHRoaXNbal0sIGkgPSAwLCBuID0gZ3JvdXAubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIGlmIChub2RlID0gZ3JvdXBbaV0pIHtcbiAgICAgICAgICB0cmFuc2l0aW9uID0gbm9kZVtuc11baWQwXTtcbiAgICAgICAgICBkM190cmFuc2l0aW9uTm9kZShub2RlLCBpLCBucywgaWQxLCB7XG4gICAgICAgICAgICB0aW1lOiB0cmFuc2l0aW9uLnRpbWUsXG4gICAgICAgICAgICBlYXNlOiB0cmFuc2l0aW9uLmVhc2UsXG4gICAgICAgICAgICBkZWxheTogdHJhbnNpdGlvbi5kZWxheSArIHRyYW5zaXRpb24uZHVyYXRpb24sXG4gICAgICAgICAgICBkdXJhdGlvbjogdHJhbnNpdGlvbi5kdXJhdGlvblxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHN1Ymdyb3VwLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkM190cmFuc2l0aW9uKHN1Ymdyb3VwcywgbnMsIGlkMSk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX3RyYW5zaXRpb25OYW1lc3BhY2UobmFtZSkge1xuICAgIHJldHVybiBuYW1lID09IG51bGwgPyBcIl9fdHJhbnNpdGlvbl9fXCIgOiBcIl9fdHJhbnNpdGlvbl9cIiArIG5hbWUgKyBcIl9fXCI7XG4gIH1cbiAgZnVuY3Rpb24gZDNfdHJhbnNpdGlvbk5vZGUobm9kZSwgaSwgbnMsIGlkLCBpbmhlcml0KSB7XG4gICAgdmFyIGxvY2sgPSBub2RlW25zXSB8fCAobm9kZVtuc10gPSB7XG4gICAgICBhY3RpdmU6IDAsXG4gICAgICBjb3VudDogMFxuICAgIH0pLCB0cmFuc2l0aW9uID0gbG9ja1tpZF0sIHRpbWUsIHRpbWVyLCBkdXJhdGlvbiwgZWFzZSwgdHdlZW5zO1xuICAgIGZ1bmN0aW9uIHNjaGVkdWxlKGVsYXBzZWQpIHtcbiAgICAgIHZhciBkZWxheSA9IHRyYW5zaXRpb24uZGVsYXk7XG4gICAgICB0aW1lci50ID0gZGVsYXkgKyB0aW1lO1xuICAgICAgaWYgKGRlbGF5IDw9IGVsYXBzZWQpIHJldHVybiBzdGFydChlbGFwc2VkIC0gZGVsYXkpO1xuICAgICAgdGltZXIuYyA9IHN0YXJ0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBzdGFydChlbGFwc2VkKSB7XG4gICAgICB2YXIgYWN0aXZlSWQgPSBsb2NrLmFjdGl2ZSwgYWN0aXZlID0gbG9ja1thY3RpdmVJZF07XG4gICAgICBpZiAoYWN0aXZlKSB7XG4gICAgICAgIGFjdGl2ZS50aW1lci5jID0gbnVsbDtcbiAgICAgICAgYWN0aXZlLnRpbWVyLnQgPSBOYU47XG4gICAgICAgIC0tbG9jay5jb3VudDtcbiAgICAgICAgZGVsZXRlIGxvY2tbYWN0aXZlSWRdO1xuICAgICAgICBhY3RpdmUuZXZlbnQgJiYgYWN0aXZlLmV2ZW50LmludGVycnVwdC5jYWxsKG5vZGUsIG5vZGUuX19kYXRhX18sIGFjdGl2ZS5pbmRleCk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBjYW5jZWxJZCBpbiBsb2NrKSB7XG4gICAgICAgIGlmICgrY2FuY2VsSWQgPCBpZCkge1xuICAgICAgICAgIHZhciBjYW5jZWwgPSBsb2NrW2NhbmNlbElkXTtcbiAgICAgICAgICBjYW5jZWwudGltZXIuYyA9IG51bGw7XG4gICAgICAgICAgY2FuY2VsLnRpbWVyLnQgPSBOYU47XG4gICAgICAgICAgLS1sb2NrLmNvdW50O1xuICAgICAgICAgIGRlbGV0ZSBsb2NrW2NhbmNlbElkXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGltZXIuYyA9IHRpY2s7XG4gICAgICBkM190aW1lcihmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRpbWVyLmMgJiYgdGljayhlbGFwc2VkIHx8IDEpKSB7XG4gICAgICAgICAgdGltZXIuYyA9IG51bGw7XG4gICAgICAgICAgdGltZXIudCA9IE5hTjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH0sIDAsIHRpbWUpO1xuICAgICAgbG9jay5hY3RpdmUgPSBpZDtcbiAgICAgIHRyYW5zaXRpb24uZXZlbnQgJiYgdHJhbnNpdGlvbi5ldmVudC5zdGFydC5jYWxsKG5vZGUsIG5vZGUuX19kYXRhX18sIGkpO1xuICAgICAgdHdlZW5zID0gW107XG4gICAgICB0cmFuc2l0aW9uLnR3ZWVuLmZvckVhY2goZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgPSB2YWx1ZS5jYWxsKG5vZGUsIG5vZGUuX19kYXRhX18sIGkpKSB7XG4gICAgICAgICAgdHdlZW5zLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGVhc2UgPSB0cmFuc2l0aW9uLmVhc2U7XG4gICAgICBkdXJhdGlvbiA9IHRyYW5zaXRpb24uZHVyYXRpb247XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRpY2soZWxhcHNlZCkge1xuICAgICAgdmFyIHQgPSBlbGFwc2VkIC8gZHVyYXRpb24sIGUgPSBlYXNlKHQpLCBuID0gdHdlZW5zLmxlbmd0aDtcbiAgICAgIHdoaWxlIChuID4gMCkge1xuICAgICAgICB0d2VlbnNbLS1uXS5jYWxsKG5vZGUsIGUpO1xuICAgICAgfVxuICAgICAgaWYgKHQgPj0gMSkge1xuICAgICAgICB0cmFuc2l0aW9uLmV2ZW50ICYmIHRyYW5zaXRpb24uZXZlbnQuZW5kLmNhbGwobm9kZSwgbm9kZS5fX2RhdGFfXywgaSk7XG4gICAgICAgIGlmICgtLWxvY2suY291bnQpIGRlbGV0ZSBsb2NrW2lkXTsgZWxzZSBkZWxldGUgbm9kZVtuc107XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXRyYW5zaXRpb24pIHtcbiAgICAgIHRpbWUgPSBpbmhlcml0LnRpbWU7XG4gICAgICB0aW1lciA9IGQzX3RpbWVyKHNjaGVkdWxlLCAwLCB0aW1lKTtcbiAgICAgIHRyYW5zaXRpb24gPSBsb2NrW2lkXSA9IHtcbiAgICAgICAgdHdlZW46IG5ldyBkM19NYXAoKSxcbiAgICAgICAgdGltZTogdGltZSxcbiAgICAgICAgdGltZXI6IHRpbWVyLFxuICAgICAgICBkZWxheTogaW5oZXJpdC5kZWxheSxcbiAgICAgICAgZHVyYXRpb246IGluaGVyaXQuZHVyYXRpb24sXG4gICAgICAgIGVhc2U6IGluaGVyaXQuZWFzZSxcbiAgICAgICAgaW5kZXg6IGlcbiAgICAgIH07XG4gICAgICBpbmhlcml0ID0gbnVsbDtcbiAgICAgICsrbG9jay5jb3VudDtcbiAgICB9XG4gIH1cbiAgZDMuc3ZnLmF4aXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKSwgb3JpZW50ID0gZDNfc3ZnX2F4aXNEZWZhdWx0T3JpZW50LCBpbm5lclRpY2tTaXplID0gNiwgb3V0ZXJUaWNrU2l6ZSA9IDYsIHRpY2tQYWRkaW5nID0gMywgdGlja0FyZ3VtZW50c18gPSBbIDEwIF0sIHRpY2tWYWx1ZXMgPSBudWxsLCB0aWNrRm9ybWF0XztcbiAgICBmdW5jdGlvbiBheGlzKGcpIHtcbiAgICAgIGcuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGcgPSBkMy5zZWxlY3QodGhpcyk7XG4gICAgICAgIHZhciBzY2FsZTAgPSB0aGlzLl9fY2hhcnRfXyB8fCBzY2FsZSwgc2NhbGUxID0gdGhpcy5fX2NoYXJ0X18gPSBzY2FsZS5jb3B5KCk7XG4gICAgICAgIHZhciB0aWNrcyA9IHRpY2tWYWx1ZXMgPT0gbnVsbCA/IHNjYWxlMS50aWNrcyA/IHNjYWxlMS50aWNrcy5hcHBseShzY2FsZTEsIHRpY2tBcmd1bWVudHNfKSA6IHNjYWxlMS5kb21haW4oKSA6IHRpY2tWYWx1ZXMsIHRpY2tGb3JtYXQgPSB0aWNrRm9ybWF0XyA9PSBudWxsID8gc2NhbGUxLnRpY2tGb3JtYXQgPyBzY2FsZTEudGlja0Zvcm1hdC5hcHBseShzY2FsZTEsIHRpY2tBcmd1bWVudHNfKSA6IGQzX2lkZW50aXR5IDogdGlja0Zvcm1hdF8sIHRpY2sgPSBnLnNlbGVjdEFsbChcIi50aWNrXCIpLmRhdGEodGlja3MsIHNjYWxlMSksIHRpY2tFbnRlciA9IHRpY2suZW50ZXIoKS5pbnNlcnQoXCJnXCIsIFwiLmRvbWFpblwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrXCIpLnN0eWxlKFwib3BhY2l0eVwiLCDOtSksIHRpY2tFeGl0ID0gZDMudHJhbnNpdGlvbih0aWNrLmV4aXQoKSkuc3R5bGUoXCJvcGFjaXR5XCIsIM61KS5yZW1vdmUoKSwgdGlja1VwZGF0ZSA9IGQzLnRyYW5zaXRpb24odGljay5vcmRlcigpKS5zdHlsZShcIm9wYWNpdHlcIiwgMSksIHRpY2tTcGFjaW5nID0gTWF0aC5tYXgoaW5uZXJUaWNrU2l6ZSwgMCkgKyB0aWNrUGFkZGluZywgdGlja1RyYW5zZm9ybTtcbiAgICAgICAgdmFyIHJhbmdlID0gZDNfc2NhbGVSYW5nZShzY2FsZTEpLCBwYXRoID0gZy5zZWxlY3RBbGwoXCIuZG9tYWluXCIpLmRhdGEoWyAwIF0pLCBwYXRoVXBkYXRlID0gKHBhdGguZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpLmF0dHIoXCJjbGFzc1wiLCBcImRvbWFpblwiKSwgXG4gICAgICAgIGQzLnRyYW5zaXRpb24ocGF0aCkpO1xuICAgICAgICB0aWNrRW50ZXIuYXBwZW5kKFwibGluZVwiKTtcbiAgICAgICAgdGlja0VudGVyLmFwcGVuZChcInRleHRcIik7XG4gICAgICAgIHZhciBsaW5lRW50ZXIgPSB0aWNrRW50ZXIuc2VsZWN0KFwibGluZVwiKSwgbGluZVVwZGF0ZSA9IHRpY2tVcGRhdGUuc2VsZWN0KFwibGluZVwiKSwgdGV4dCA9IHRpY2suc2VsZWN0KFwidGV4dFwiKS50ZXh0KHRpY2tGb3JtYXQpLCB0ZXh0RW50ZXIgPSB0aWNrRW50ZXIuc2VsZWN0KFwidGV4dFwiKSwgdGV4dFVwZGF0ZSA9IHRpY2tVcGRhdGUuc2VsZWN0KFwidGV4dFwiKSwgc2lnbiA9IG9yaWVudCA9PT0gXCJ0b3BcIiB8fCBvcmllbnQgPT09IFwibGVmdFwiID8gLTEgOiAxLCB4MSwgeDIsIHkxLCB5MjtcbiAgICAgICAgaWYgKG9yaWVudCA9PT0gXCJib3R0b21cIiB8fCBvcmllbnQgPT09IFwidG9wXCIpIHtcbiAgICAgICAgICB0aWNrVHJhbnNmb3JtID0gZDNfc3ZnX2F4aXNYLCB4MSA9IFwieFwiLCB5MSA9IFwieVwiLCB4MiA9IFwieDJcIiwgeTIgPSBcInkyXCI7XG4gICAgICAgICAgdGV4dC5hdHRyKFwiZHlcIiwgc2lnbiA8IDAgPyBcIjBlbVwiIDogXCIuNzFlbVwiKS5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpO1xuICAgICAgICAgIHBhdGhVcGRhdGUuYXR0cihcImRcIiwgXCJNXCIgKyByYW5nZVswXSArIFwiLFwiICsgc2lnbiAqIG91dGVyVGlja1NpemUgKyBcIlYwSFwiICsgcmFuZ2VbMV0gKyBcIlZcIiArIHNpZ24gKiBvdXRlclRpY2tTaXplKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aWNrVHJhbnNmb3JtID0gZDNfc3ZnX2F4aXNZLCB4MSA9IFwieVwiLCB5MSA9IFwieFwiLCB4MiA9IFwieTJcIiwgeTIgPSBcIngyXCI7XG4gICAgICAgICAgdGV4dC5hdHRyKFwiZHlcIiwgXCIuMzJlbVwiKS5zdHlsZShcInRleHQtYW5jaG9yXCIsIHNpZ24gPCAwID8gXCJlbmRcIiA6IFwic3RhcnRcIik7XG4gICAgICAgICAgcGF0aFVwZGF0ZS5hdHRyKFwiZFwiLCBcIk1cIiArIHNpZ24gKiBvdXRlclRpY2tTaXplICsgXCIsXCIgKyByYW5nZVswXSArIFwiSDBWXCIgKyByYW5nZVsxXSArIFwiSFwiICsgc2lnbiAqIG91dGVyVGlja1NpemUpO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVFbnRlci5hdHRyKHkyLCBzaWduICogaW5uZXJUaWNrU2l6ZSk7XG4gICAgICAgIHRleHRFbnRlci5hdHRyKHkxLCBzaWduICogdGlja1NwYWNpbmcpO1xuICAgICAgICBsaW5lVXBkYXRlLmF0dHIoeDIsIDApLmF0dHIoeTIsIHNpZ24gKiBpbm5lclRpY2tTaXplKTtcbiAgICAgICAgdGV4dFVwZGF0ZS5hdHRyKHgxLCAwKS5hdHRyKHkxLCBzaWduICogdGlja1NwYWNpbmcpO1xuICAgICAgICBpZiAoc2NhbGUxLnJhbmdlQmFuZCkge1xuICAgICAgICAgIHZhciB4ID0gc2NhbGUxLCBkeCA9IHgucmFuZ2VCYW5kKCkgLyAyO1xuICAgICAgICAgIHNjYWxlMCA9IHNjYWxlMSA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiB4KGQpICsgZHg7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2FsZTAucmFuZ2VCYW5kKSB7XG4gICAgICAgICAgc2NhbGUwID0gc2NhbGUxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRpY2tFeGl0LmNhbGwodGlja1RyYW5zZm9ybSwgc2NhbGUxLCBzY2FsZTApO1xuICAgICAgICB9XG4gICAgICAgIHRpY2tFbnRlci5jYWxsKHRpY2tUcmFuc2Zvcm0sIHNjYWxlMCwgc2NhbGUxKTtcbiAgICAgICAgdGlja1VwZGF0ZS5jYWxsKHRpY2tUcmFuc2Zvcm0sIHNjYWxlMSwgc2NhbGUxKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBheGlzLnNjYWxlID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2NhbGU7XG4gICAgICBzY2FsZSA9IHg7XG4gICAgICByZXR1cm4gYXhpcztcbiAgICB9O1xuICAgIGF4aXMub3JpZW50ID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gb3JpZW50O1xuICAgICAgb3JpZW50ID0geCBpbiBkM19zdmdfYXhpc09yaWVudHMgPyB4ICsgXCJcIiA6IGQzX3N2Z19heGlzRGVmYXVsdE9yaWVudDtcbiAgICAgIHJldHVybiBheGlzO1xuICAgIH07XG4gICAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja0FyZ3VtZW50c187XG4gICAgICB0aWNrQXJndW1lbnRzXyA9IGQzX2FycmF5KGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gYXhpcztcbiAgICB9O1xuICAgIGF4aXMudGlja1ZhbHVlcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRpY2tWYWx1ZXM7XG4gICAgICB0aWNrVmFsdWVzID0geDtcbiAgICAgIHJldHVybiBheGlzO1xuICAgIH07XG4gICAgYXhpcy50aWNrRm9ybWF0ID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja0Zvcm1hdF87XG4gICAgICB0aWNrRm9ybWF0XyA9IHg7XG4gICAgICByZXR1cm4gYXhpcztcbiAgICB9O1xuICAgIGF4aXMudGlja1NpemUgPSBmdW5jdGlvbih4KSB7XG4gICAgICB2YXIgbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICBpZiAoIW4pIHJldHVybiBpbm5lclRpY2tTaXplO1xuICAgICAgaW5uZXJUaWNrU2l6ZSA9ICt4O1xuICAgICAgb3V0ZXJUaWNrU2l6ZSA9ICthcmd1bWVudHNbbiAtIDFdO1xuICAgICAgcmV0dXJuIGF4aXM7XG4gICAgfTtcbiAgICBheGlzLmlubmVyVGlja1NpemUgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBpbm5lclRpY2tTaXplO1xuICAgICAgaW5uZXJUaWNrU2l6ZSA9ICt4O1xuICAgICAgcmV0dXJuIGF4aXM7XG4gICAgfTtcbiAgICBheGlzLm91dGVyVGlja1NpemUgPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBvdXRlclRpY2tTaXplO1xuICAgICAgb3V0ZXJUaWNrU2l6ZSA9ICt4O1xuICAgICAgcmV0dXJuIGF4aXM7XG4gICAgfTtcbiAgICBheGlzLnRpY2tQYWRkaW5nID0gZnVuY3Rpb24oeCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja1BhZGRpbmc7XG4gICAgICB0aWNrUGFkZGluZyA9ICt4O1xuICAgICAgcmV0dXJuIGF4aXM7XG4gICAgfTtcbiAgICBheGlzLnRpY2tTdWJkaXZpZGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoICYmIGF4aXM7XG4gICAgfTtcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcbiAgdmFyIGQzX3N2Z19heGlzRGVmYXVsdE9yaWVudCA9IFwiYm90dG9tXCIsIGQzX3N2Z19heGlzT3JpZW50cyA9IHtcbiAgICB0b3A6IDEsXG4gICAgcmlnaHQ6IDEsXG4gICAgYm90dG9tOiAxLFxuICAgIGxlZnQ6IDFcbiAgfTtcbiAgZnVuY3Rpb24gZDNfc3ZnX2F4aXNYKHNlbGVjdGlvbiwgeDAsIHgxKSB7XG4gICAgc2VsZWN0aW9uLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge1xuICAgICAgdmFyIHYwID0geDAoZCk7XG4gICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyAoaXNGaW5pdGUodjApID8gdjAgOiB4MShkKSkgKyBcIiwwKVwiO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGQzX3N2Z19heGlzWShzZWxlY3Rpb24sIHkwLCB5MSkge1xuICAgIHNlbGVjdGlvbi5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHZhciB2MCA9IHkwKGQpO1xuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKDAsXCIgKyAoaXNGaW5pdGUodjApID8gdjAgOiB5MShkKSkgKyBcIilcIjtcbiAgICB9KTtcbiAgfVxuICBkMy5zdmcuYnJ1c2ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZXZlbnQgPSBkM19ldmVudERpc3BhdGNoKGJydXNoLCBcImJydXNoc3RhcnRcIiwgXCJicnVzaFwiLCBcImJydXNoZW5kXCIpLCB4ID0gbnVsbCwgeSA9IG51bGwsIHhFeHRlbnQgPSBbIDAsIDAgXSwgeUV4dGVudCA9IFsgMCwgMCBdLCB4RXh0ZW50RG9tYWluLCB5RXh0ZW50RG9tYWluLCB4Q2xhbXAgPSB0cnVlLCB5Q2xhbXAgPSB0cnVlLCByZXNpemVzID0gZDNfc3ZnX2JydXNoUmVzaXplc1swXTtcbiAgICBmdW5jdGlvbiBicnVzaChnKSB7XG4gICAgICBnLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBnID0gZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIiwgXCJhbGxcIikuc3R5bGUoXCItd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3JcIiwgXCJyZ2JhKDAsMCwwLDApXCIpLm9uKFwibW91c2Vkb3duLmJydXNoXCIsIGJydXNoc3RhcnQpLm9uKFwidG91Y2hzdGFydC5icnVzaFwiLCBicnVzaHN0YXJ0KTtcbiAgICAgICAgdmFyIGJhY2tncm91bmQgPSBnLnNlbGVjdEFsbChcIi5iYWNrZ3JvdW5kXCIpLmRhdGEoWyAwIF0pO1xuICAgICAgICBiYWNrZ3JvdW5kLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKS5zdHlsZShcImN1cnNvclwiLCBcImNyb3NzaGFpclwiKTtcbiAgICAgICAgZy5zZWxlY3RBbGwoXCIuZXh0ZW50XCIpLmRhdGEoWyAwIF0pLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJleHRlbnRcIikuc3R5bGUoXCJjdXJzb3JcIiwgXCJtb3ZlXCIpO1xuICAgICAgICB2YXIgcmVzaXplID0gZy5zZWxlY3RBbGwoXCIucmVzaXplXCIpLmRhdGEocmVzaXplcywgZDNfaWRlbnRpdHkpO1xuICAgICAgICByZXNpemUuZXhpdCgpLnJlbW92ZSgpO1xuICAgICAgICByZXNpemUuZW50ZXIoKS5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIFwicmVzaXplIFwiICsgZDtcbiAgICAgICAgfSkuc3R5bGUoXCJjdXJzb3JcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBkM19zdmdfYnJ1c2hDdXJzb3JbZF07XG4gICAgICAgIH0pLmFwcGVuZChcInJlY3RcIikuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiAvW2V3XSQvLnRlc3QoZCkgPyAtMyA6IG51bGw7XG4gICAgICAgIH0pLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4gL15bbnNdLy50ZXN0KGQpID8gLTMgOiBudWxsO1xuICAgICAgICB9KS5hdHRyKFwid2lkdGhcIiwgNikuYXR0cihcImhlaWdodFwiLCA2KS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgIHJlc2l6ZS5zdHlsZShcImRpc3BsYXlcIiwgYnJ1c2guZW1wdHkoKSA/IFwibm9uZVwiIDogbnVsbCk7XG4gICAgICAgIHZhciBnVXBkYXRlID0gZDMudHJhbnNpdGlvbihnKSwgYmFja2dyb3VuZFVwZGF0ZSA9IGQzLnRyYW5zaXRpb24oYmFja2dyb3VuZCksIHJhbmdlO1xuICAgICAgICBpZiAoeCkge1xuICAgICAgICAgIHJhbmdlID0gZDNfc2NhbGVSYW5nZSh4KTtcbiAgICAgICAgICBiYWNrZ3JvdW5kVXBkYXRlLmF0dHIoXCJ4XCIsIHJhbmdlWzBdKS5hdHRyKFwid2lkdGhcIiwgcmFuZ2VbMV0gLSByYW5nZVswXSk7XG4gICAgICAgICAgcmVkcmF3WChnVXBkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeSkge1xuICAgICAgICAgIHJhbmdlID0gZDNfc2NhbGVSYW5nZSh5KTtcbiAgICAgICAgICBiYWNrZ3JvdW5kVXBkYXRlLmF0dHIoXCJ5XCIsIHJhbmdlWzBdKS5hdHRyKFwiaGVpZ2h0XCIsIHJhbmdlWzFdIC0gcmFuZ2VbMF0pO1xuICAgICAgICAgIHJlZHJhd1koZ1VwZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVkcmF3KGdVcGRhdGUpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGJydXNoLmV2ZW50ID0gZnVuY3Rpb24oZykge1xuICAgICAgZy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXZlbnRfID0gZXZlbnQub2YodGhpcywgYXJndW1lbnRzKSwgZXh0ZW50MSA9IHtcbiAgICAgICAgICB4OiB4RXh0ZW50LFxuICAgICAgICAgIHk6IHlFeHRlbnQsXG4gICAgICAgICAgaTogeEV4dGVudERvbWFpbixcbiAgICAgICAgICBqOiB5RXh0ZW50RG9tYWluXG4gICAgICAgIH0sIGV4dGVudDAgPSB0aGlzLl9fY2hhcnRfXyB8fCBleHRlbnQxO1xuICAgICAgICB0aGlzLl9fY2hhcnRfXyA9IGV4dGVudDE7XG4gICAgICAgIGlmIChkM190cmFuc2l0aW9uSW5oZXJpdElkKSB7XG4gICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnRyYW5zaXRpb24oKS5lYWNoKFwic3RhcnQuYnJ1c2hcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB4RXh0ZW50RG9tYWluID0gZXh0ZW50MC5pO1xuICAgICAgICAgICAgeUV4dGVudERvbWFpbiA9IGV4dGVudDAuajtcbiAgICAgICAgICAgIHhFeHRlbnQgPSBleHRlbnQwLng7XG4gICAgICAgICAgICB5RXh0ZW50ID0gZXh0ZW50MC55O1xuICAgICAgICAgICAgZXZlbnRfKHtcbiAgICAgICAgICAgICAgdHlwZTogXCJicnVzaHN0YXJ0XCJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLnR3ZWVuKFwiYnJ1c2g6YnJ1c2hcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgeGkgPSBkM19pbnRlcnBvbGF0ZUFycmF5KHhFeHRlbnQsIGV4dGVudDEueCksIHlpID0gZDNfaW50ZXJwb2xhdGVBcnJheSh5RXh0ZW50LCBleHRlbnQxLnkpO1xuICAgICAgICAgICAgeEV4dGVudERvbWFpbiA9IHlFeHRlbnREb21haW4gPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgICAgICAgeEV4dGVudCA9IGV4dGVudDEueCA9IHhpKHQpO1xuICAgICAgICAgICAgICB5RXh0ZW50ID0gZXh0ZW50MS55ID0geWkodCk7XG4gICAgICAgICAgICAgIGV2ZW50Xyh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJicnVzaFwiLFxuICAgICAgICAgICAgICAgIG1vZGU6IFwicmVzaXplXCJcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pLmVhY2goXCJlbmQuYnJ1c2hcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB4RXh0ZW50RG9tYWluID0gZXh0ZW50MS5pO1xuICAgICAgICAgICAgeUV4dGVudERvbWFpbiA9IGV4dGVudDEuajtcbiAgICAgICAgICAgIGV2ZW50Xyh7XG4gICAgICAgICAgICAgIHR5cGU6IFwiYnJ1c2hcIixcbiAgICAgICAgICAgICAgbW9kZTogXCJyZXNpemVcIlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBldmVudF8oe1xuICAgICAgICAgICAgICB0eXBlOiBcImJydXNoZW5kXCJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV2ZW50Xyh7XG4gICAgICAgICAgICB0eXBlOiBcImJydXNoc3RhcnRcIlxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGV2ZW50Xyh7XG4gICAgICAgICAgICB0eXBlOiBcImJydXNoXCIsXG4gICAgICAgICAgICBtb2RlOiBcInJlc2l6ZVwiXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZXZlbnRfKHtcbiAgICAgICAgICAgIHR5cGU6IFwiYnJ1c2hlbmRcIlxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIHJlZHJhdyhnKSB7XG4gICAgICBnLnNlbGVjdEFsbChcIi5yZXNpemVcIikuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIHhFeHRlbnRbKy9lJC8udGVzdChkKV0gKyBcIixcIiArIHlFeHRlbnRbKy9ecy8udGVzdChkKV0gKyBcIilcIjtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZWRyYXdYKGcpIHtcbiAgICAgIGcuc2VsZWN0KFwiLmV4dGVudFwiKS5hdHRyKFwieFwiLCB4RXh0ZW50WzBdKTtcbiAgICAgIGcuc2VsZWN0QWxsKFwiLmV4dGVudCwubj5yZWN0LC5zPnJlY3RcIikuYXR0cihcIndpZHRoXCIsIHhFeHRlbnRbMV0gLSB4RXh0ZW50WzBdKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVkcmF3WShnKSB7XG4gICAgICBnLnNlbGVjdChcIi5leHRlbnRcIikuYXR0cihcInlcIiwgeUV4dGVudFswXSk7XG4gICAgICBnLnNlbGVjdEFsbChcIi5leHRlbnQsLmU+cmVjdCwudz5yZWN0XCIpLmF0dHIoXCJoZWlnaHRcIiwgeUV4dGVudFsxXSAtIHlFeHRlbnRbMF0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBicnVzaHN0YXJ0KCkge1xuICAgICAgdmFyIHRhcmdldCA9IHRoaXMsIGV2ZW50VGFyZ2V0ID0gZDMuc2VsZWN0KGQzLmV2ZW50LnRhcmdldCksIGV2ZW50XyA9IGV2ZW50Lm9mKHRhcmdldCwgYXJndW1lbnRzKSwgZyA9IGQzLnNlbGVjdCh0YXJnZXQpLCByZXNpemluZyA9IGV2ZW50VGFyZ2V0LmRhdHVtKCksIHJlc2l6aW5nWCA9ICEvXihufHMpJC8udGVzdChyZXNpemluZykgJiYgeCwgcmVzaXppbmdZID0gIS9eKGV8dykkLy50ZXN0KHJlc2l6aW5nKSAmJiB5LCBkcmFnZ2luZyA9IGV2ZW50VGFyZ2V0LmNsYXNzZWQoXCJleHRlbnRcIiksIGRyYWdSZXN0b3JlID0gZDNfZXZlbnRfZHJhZ1N1cHByZXNzKHRhcmdldCksIGNlbnRlciwgb3JpZ2luID0gZDMubW91c2UodGFyZ2V0KSwgb2Zmc2V0O1xuICAgICAgdmFyIHcgPSBkMy5zZWxlY3QoZDNfd2luZG93KHRhcmdldCkpLm9uKFwia2V5ZG93bi5icnVzaFwiLCBrZXlkb3duKS5vbihcImtleXVwLmJydXNoXCIsIGtleXVwKTtcbiAgICAgIGlmIChkMy5ldmVudC5jaGFuZ2VkVG91Y2hlcykge1xuICAgICAgICB3Lm9uKFwidG91Y2htb3ZlLmJydXNoXCIsIGJydXNobW92ZSkub24oXCJ0b3VjaGVuZC5icnVzaFwiLCBicnVzaGVuZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3Lm9uKFwibW91c2Vtb3ZlLmJydXNoXCIsIGJydXNobW92ZSkub24oXCJtb3VzZXVwLmJydXNoXCIsIGJydXNoZW5kKTtcbiAgICAgIH1cbiAgICAgIGcuaW50ZXJydXB0KCkuc2VsZWN0QWxsKFwiKlwiKS5pbnRlcnJ1cHQoKTtcbiAgICAgIGlmIChkcmFnZ2luZykge1xuICAgICAgICBvcmlnaW5bMF0gPSB4RXh0ZW50WzBdIC0gb3JpZ2luWzBdO1xuICAgICAgICBvcmlnaW5bMV0gPSB5RXh0ZW50WzBdIC0gb3JpZ2luWzFdO1xuICAgICAgfSBlbHNlIGlmIChyZXNpemluZykge1xuICAgICAgICB2YXIgZXggPSArL3ckLy50ZXN0KHJlc2l6aW5nKSwgZXkgPSArL15uLy50ZXN0KHJlc2l6aW5nKTtcbiAgICAgICAgb2Zmc2V0ID0gWyB4RXh0ZW50WzEgLSBleF0gLSBvcmlnaW5bMF0sIHlFeHRlbnRbMSAtIGV5XSAtIG9yaWdpblsxXSBdO1xuICAgICAgICBvcmlnaW5bMF0gPSB4RXh0ZW50W2V4XTtcbiAgICAgICAgb3JpZ2luWzFdID0geUV4dGVudFtleV07XG4gICAgICB9IGVsc2UgaWYgKGQzLmV2ZW50LmFsdEtleSkgY2VudGVyID0gb3JpZ2luLnNsaWNlKCk7XG4gICAgICBnLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIiwgXCJub25lXCIpLnNlbGVjdEFsbChcIi5yZXNpemVcIikuc3R5bGUoXCJkaXNwbGF5XCIsIG51bGwpO1xuICAgICAgZDMuc2VsZWN0KFwiYm9keVwiKS5zdHlsZShcImN1cnNvclwiLCBldmVudFRhcmdldC5zdHlsZShcImN1cnNvclwiKSk7XG4gICAgICBldmVudF8oe1xuICAgICAgICB0eXBlOiBcImJydXNoc3RhcnRcIlxuICAgICAgfSk7XG4gICAgICBicnVzaG1vdmUoKTtcbiAgICAgIGZ1bmN0aW9uIGtleWRvd24oKSB7XG4gICAgICAgIGlmIChkMy5ldmVudC5rZXlDb2RlID09IDMyKSB7XG4gICAgICAgICAgaWYgKCFkcmFnZ2luZykge1xuICAgICAgICAgICAgY2VudGVyID0gbnVsbDtcbiAgICAgICAgICAgIG9yaWdpblswXSAtPSB4RXh0ZW50WzFdO1xuICAgICAgICAgICAgb3JpZ2luWzFdIC09IHlFeHRlbnRbMV07XG4gICAgICAgICAgICBkcmFnZ2luZyA9IDI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGQzX2V2ZW50UHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnVuY3Rpb24ga2V5dXAoKSB7XG4gICAgICAgIGlmIChkMy5ldmVudC5rZXlDb2RlID09IDMyICYmIGRyYWdnaW5nID09IDIpIHtcbiAgICAgICAgICBvcmlnaW5bMF0gKz0geEV4dGVudFsxXTtcbiAgICAgICAgICBvcmlnaW5bMV0gKz0geUV4dGVudFsxXTtcbiAgICAgICAgICBkcmFnZ2luZyA9IDA7XG4gICAgICAgICAgZDNfZXZlbnRQcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBicnVzaG1vdmUoKSB7XG4gICAgICAgIHZhciBwb2ludCA9IGQzLm1vdXNlKHRhcmdldCksIG1vdmVkID0gZmFsc2U7XG4gICAgICAgIGlmIChvZmZzZXQpIHtcbiAgICAgICAgICBwb2ludFswXSArPSBvZmZzZXRbMF07XG4gICAgICAgICAgcG9pbnRbMV0gKz0gb2Zmc2V0WzFdO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZHJhZ2dpbmcpIHtcbiAgICAgICAgICBpZiAoZDMuZXZlbnQuYWx0S2V5KSB7XG4gICAgICAgICAgICBpZiAoIWNlbnRlcikgY2VudGVyID0gWyAoeEV4dGVudFswXSArIHhFeHRlbnRbMV0pIC8gMiwgKHlFeHRlbnRbMF0gKyB5RXh0ZW50WzFdKSAvIDIgXTtcbiAgICAgICAgICAgIG9yaWdpblswXSA9IHhFeHRlbnRbKyhwb2ludFswXSA8IGNlbnRlclswXSldO1xuICAgICAgICAgICAgb3JpZ2luWzFdID0geUV4dGVudFsrKHBvaW50WzFdIDwgY2VudGVyWzFdKV07XG4gICAgICAgICAgfSBlbHNlIGNlbnRlciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc2l6aW5nWCAmJiBtb3ZlMShwb2ludCwgeCwgMCkpIHtcbiAgICAgICAgICByZWRyYXdYKGcpO1xuICAgICAgICAgIG1vdmVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzaXppbmdZICYmIG1vdmUxKHBvaW50LCB5LCAxKSkge1xuICAgICAgICAgIHJlZHJhd1koZyk7XG4gICAgICAgICAgbW92ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtb3ZlZCkge1xuICAgICAgICAgIHJlZHJhdyhnKTtcbiAgICAgICAgICBldmVudF8oe1xuICAgICAgICAgICAgdHlwZTogXCJicnVzaFwiLFxuICAgICAgICAgICAgbW9kZTogZHJhZ2dpbmcgPyBcIm1vdmVcIiA6IFwicmVzaXplXCJcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnVuY3Rpb24gbW92ZTEocG9pbnQsIHNjYWxlLCBpKSB7XG4gICAgICAgIHZhciByYW5nZSA9IGQzX3NjYWxlUmFuZ2Uoc2NhbGUpLCByMCA9IHJhbmdlWzBdLCByMSA9IHJhbmdlWzFdLCBwb3NpdGlvbiA9IG9yaWdpbltpXSwgZXh0ZW50ID0gaSA/IHlFeHRlbnQgOiB4RXh0ZW50LCBzaXplID0gZXh0ZW50WzFdIC0gZXh0ZW50WzBdLCBtaW4sIG1heDtcbiAgICAgICAgaWYgKGRyYWdnaW5nKSB7XG4gICAgICAgICAgcjAgLT0gcG9zaXRpb247XG4gICAgICAgICAgcjEgLT0gc2l6ZSArIHBvc2l0aW9uO1xuICAgICAgICB9XG4gICAgICAgIG1pbiA9IChpID8geUNsYW1wIDogeENsYW1wKSA/IE1hdGgubWF4KHIwLCBNYXRoLm1pbihyMSwgcG9pbnRbaV0pKSA6IHBvaW50W2ldO1xuICAgICAgICBpZiAoZHJhZ2dpbmcpIHtcbiAgICAgICAgICBtYXggPSAobWluICs9IHBvc2l0aW9uKSArIHNpemU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGNlbnRlcikgcG9zaXRpb24gPSBNYXRoLm1heChyMCwgTWF0aC5taW4ocjEsIDIgKiBjZW50ZXJbaV0gLSBtaW4pKTtcbiAgICAgICAgICBpZiAocG9zaXRpb24gPCBtaW4pIHtcbiAgICAgICAgICAgIG1heCA9IG1pbjtcbiAgICAgICAgICAgIG1pbiA9IHBvc2l0aW9uO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYXggPSBwb3NpdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4dGVudFswXSAhPSBtaW4gfHwgZXh0ZW50WzFdICE9IG1heCkge1xuICAgICAgICAgIGlmIChpKSB5RXh0ZW50RG9tYWluID0gbnVsbDsgZWxzZSB4RXh0ZW50RG9tYWluID0gbnVsbDtcbiAgICAgICAgICBleHRlbnRbMF0gPSBtaW47XG4gICAgICAgICAgZXh0ZW50WzFdID0gbWF4O1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBicnVzaGVuZCgpIHtcbiAgICAgICAgYnJ1c2htb3ZlKCk7XG4gICAgICAgIGcuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBcImFsbFwiKS5zZWxlY3RBbGwoXCIucmVzaXplXCIpLnN0eWxlKFwiZGlzcGxheVwiLCBicnVzaC5lbXB0eSgpID8gXCJub25lXCIgOiBudWxsKTtcbiAgICAgICAgZDMuc2VsZWN0KFwiYm9keVwiKS5zdHlsZShcImN1cnNvclwiLCBudWxsKTtcbiAgICAgICAgdy5vbihcIm1vdXNlbW92ZS5icnVzaFwiLCBudWxsKS5vbihcIm1vdXNldXAuYnJ1c2hcIiwgbnVsbCkub24oXCJ0b3VjaG1vdmUuYnJ1c2hcIiwgbnVsbCkub24oXCJ0b3VjaGVuZC5icnVzaFwiLCBudWxsKS5vbihcImtleWRvd24uYnJ1c2hcIiwgbnVsbCkub24oXCJrZXl1cC5icnVzaFwiLCBudWxsKTtcbiAgICAgICAgZHJhZ1Jlc3RvcmUoKTtcbiAgICAgICAgZXZlbnRfKHtcbiAgICAgICAgICB0eXBlOiBcImJydXNoZW5kXCJcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGJydXNoLnggPSBmdW5jdGlvbih6KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB4O1xuICAgICAgeCA9IHo7XG4gICAgICByZXNpemVzID0gZDNfc3ZnX2JydXNoUmVzaXplc1sheCA8PCAxIHwgIXldO1xuICAgICAgcmV0dXJuIGJydXNoO1xuICAgIH07XG4gICAgYnJ1c2gueSA9IGZ1bmN0aW9uKHopIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHk7XG4gICAgICB5ID0gejtcbiAgICAgIHJlc2l6ZXMgPSBkM19zdmdfYnJ1c2hSZXNpemVzWyF4IDw8IDEgfCAheV07XG4gICAgICByZXR1cm4gYnJ1c2g7XG4gICAgfTtcbiAgICBicnVzaC5jbGFtcCA9IGZ1bmN0aW9uKHopIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHggJiYgeSA/IFsgeENsYW1wLCB5Q2xhbXAgXSA6IHggPyB4Q2xhbXAgOiB5ID8geUNsYW1wIDogbnVsbDtcbiAgICAgIGlmICh4ICYmIHkpIHhDbGFtcCA9ICEhelswXSwgeUNsYW1wID0gISF6WzFdOyBlbHNlIGlmICh4KSB4Q2xhbXAgPSAhIXo7IGVsc2UgaWYgKHkpIHlDbGFtcCA9ICEhejtcbiAgICAgIHJldHVybiBicnVzaDtcbiAgICB9O1xuICAgIGJydXNoLmV4dGVudCA9IGZ1bmN0aW9uKHopIHtcbiAgICAgIHZhciB4MCwgeDEsIHkwLCB5MSwgdDtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBpZiAoeCkge1xuICAgICAgICAgIGlmICh4RXh0ZW50RG9tYWluKSB7XG4gICAgICAgICAgICB4MCA9IHhFeHRlbnREb21haW5bMF0sIHgxID0geEV4dGVudERvbWFpblsxXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgeDAgPSB4RXh0ZW50WzBdLCB4MSA9IHhFeHRlbnRbMV07XG4gICAgICAgICAgICBpZiAoeC5pbnZlcnQpIHgwID0geC5pbnZlcnQoeDApLCB4MSA9IHguaW52ZXJ0KHgxKTtcbiAgICAgICAgICAgIGlmICh4MSA8IHgwKSB0ID0geDAsIHgwID0geDEsIHgxID0gdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHkpIHtcbiAgICAgICAgICBpZiAoeUV4dGVudERvbWFpbikge1xuICAgICAgICAgICAgeTAgPSB5RXh0ZW50RG9tYWluWzBdLCB5MSA9IHlFeHRlbnREb21haW5bMV07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHkwID0geUV4dGVudFswXSwgeTEgPSB5RXh0ZW50WzFdO1xuICAgICAgICAgICAgaWYgKHkuaW52ZXJ0KSB5MCA9IHkuaW52ZXJ0KHkwKSwgeTEgPSB5LmludmVydCh5MSk7XG4gICAgICAgICAgICBpZiAoeTEgPCB5MCkgdCA9IHkwLCB5MCA9IHkxLCB5MSA9IHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4ICYmIHkgPyBbIFsgeDAsIHkwIF0sIFsgeDEsIHkxIF0gXSA6IHggPyBbIHgwLCB4MSBdIDogeSAmJiBbIHkwLCB5MSBdO1xuICAgICAgfVxuICAgICAgaWYgKHgpIHtcbiAgICAgICAgeDAgPSB6WzBdLCB4MSA9IHpbMV07XG4gICAgICAgIGlmICh5KSB4MCA9IHgwWzBdLCB4MSA9IHgxWzBdO1xuICAgICAgICB4RXh0ZW50RG9tYWluID0gWyB4MCwgeDEgXTtcbiAgICAgICAgaWYgKHguaW52ZXJ0KSB4MCA9IHgoeDApLCB4MSA9IHgoeDEpO1xuICAgICAgICBpZiAoeDEgPCB4MCkgdCA9IHgwLCB4MCA9IHgxLCB4MSA9IHQ7XG4gICAgICAgIGlmICh4MCAhPSB4RXh0ZW50WzBdIHx8IHgxICE9IHhFeHRlbnRbMV0pIHhFeHRlbnQgPSBbIHgwLCB4MSBdO1xuICAgICAgfVxuICAgICAgaWYgKHkpIHtcbiAgICAgICAgeTAgPSB6WzBdLCB5MSA9IHpbMV07XG4gICAgICAgIGlmICh4KSB5MCA9IHkwWzFdLCB5MSA9IHkxWzFdO1xuICAgICAgICB5RXh0ZW50RG9tYWluID0gWyB5MCwgeTEgXTtcbiAgICAgICAgaWYgKHkuaW52ZXJ0KSB5MCA9IHkoeTApLCB5MSA9IHkoeTEpO1xuICAgICAgICBpZiAoeTEgPCB5MCkgdCA9IHkwLCB5MCA9IHkxLCB5MSA9IHQ7XG4gICAgICAgIGlmICh5MCAhPSB5RXh0ZW50WzBdIHx8IHkxICE9IHlFeHRlbnRbMV0pIHlFeHRlbnQgPSBbIHkwLCB5MSBdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJydXNoO1xuICAgIH07XG4gICAgYnJ1c2guY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghYnJ1c2guZW1wdHkoKSkge1xuICAgICAgICB4RXh0ZW50ID0gWyAwLCAwIF0sIHlFeHRlbnQgPSBbIDAsIDAgXTtcbiAgICAgICAgeEV4dGVudERvbWFpbiA9IHlFeHRlbnREb21haW4gPSBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJydXNoO1xuICAgIH07XG4gICAgYnJ1c2guZW1wdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhIXggJiYgeEV4dGVudFswXSA9PSB4RXh0ZW50WzFdIHx8ICEheSAmJiB5RXh0ZW50WzBdID09IHlFeHRlbnRbMV07XG4gICAgfTtcbiAgICByZXR1cm4gZDMucmViaW5kKGJydXNoLCBldmVudCwgXCJvblwiKTtcbiAgfTtcbiAgdmFyIGQzX3N2Z19icnVzaEN1cnNvciA9IHtcbiAgICBuOiBcIm5zLXJlc2l6ZVwiLFxuICAgIGU6IFwiZXctcmVzaXplXCIsXG4gICAgczogXCJucy1yZXNpemVcIixcbiAgICB3OiBcImV3LXJlc2l6ZVwiLFxuICAgIG53OiBcIm53c2UtcmVzaXplXCIsXG4gICAgbmU6IFwibmVzdy1yZXNpemVcIixcbiAgICBzZTogXCJud3NlLXJlc2l6ZVwiLFxuICAgIHN3OiBcIm5lc3ctcmVzaXplXCJcbiAgfTtcbiAgdmFyIGQzX3N2Z19icnVzaFJlc2l6ZXMgPSBbIFsgXCJuXCIsIFwiZVwiLCBcInNcIiwgXCJ3XCIsIFwibndcIiwgXCJuZVwiLCBcInNlXCIsIFwic3dcIiBdLCBbIFwiZVwiLCBcIndcIiBdLCBbIFwiblwiLCBcInNcIiBdLCBbXSBdO1xuICB2YXIgZDNfdGltZV9mb3JtYXQgPSBkM190aW1lLmZvcm1hdCA9IGQzX2xvY2FsZV9lblVTLnRpbWVGb3JtYXQ7XG4gIHZhciBkM190aW1lX2Zvcm1hdFV0YyA9IGQzX3RpbWVfZm9ybWF0LnV0YztcbiAgdmFyIGQzX3RpbWVfZm9ybWF0SXNvID0gZDNfdGltZV9mb3JtYXRVdGMoXCIlWS0lbS0lZFQlSDolTTolUy4lTFpcIik7XG4gIGQzX3RpbWVfZm9ybWF0LmlzbyA9IERhdGUucHJvdG90eXBlLnRvSVNPU3RyaW5nICYmICtuZXcgRGF0ZShcIjIwMDAtMDEtMDFUMDA6MDA6MDAuMDAwWlwiKSA/IGQzX3RpbWVfZm9ybWF0SXNvTmF0aXZlIDogZDNfdGltZV9mb3JtYXRJc287XG4gIGZ1bmN0aW9uIGQzX3RpbWVfZm9ybWF0SXNvTmF0aXZlKGRhdGUpIHtcbiAgICByZXR1cm4gZGF0ZS50b0lTT1N0cmluZygpO1xuICB9XG4gIGQzX3RpbWVfZm9ybWF0SXNvTmF0aXZlLnBhcnNlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShzdHJpbmcpO1xuICAgIHJldHVybiBpc05hTihkYXRlKSA/IG51bGwgOiBkYXRlO1xuICB9O1xuICBkM190aW1lX2Zvcm1hdElzb05hdGl2ZS50b1N0cmluZyA9IGQzX3RpbWVfZm9ybWF0SXNvLnRvU3RyaW5nO1xuICBkM190aW1lLnNlY29uZCA9IGQzX3RpbWVfaW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICAgIHJldHVybiBuZXcgZDNfZGF0ZShNYXRoLmZsb29yKGRhdGUgLyAxZTMpICogMWUzKTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSwgb2Zmc2V0KSB7XG4gICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgTWF0aC5mbG9vcihvZmZzZXQpICogMWUzKTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSkge1xuICAgIHJldHVybiBkYXRlLmdldFNlY29uZHMoKTtcbiAgfSk7XG4gIGQzX3RpbWUuc2Vjb25kcyA9IGQzX3RpbWUuc2Vjb25kLnJhbmdlO1xuICBkM190aW1lLnNlY29uZHMudXRjID0gZDNfdGltZS5zZWNvbmQudXRjLnJhbmdlO1xuICBkM190aW1lLm1pbnV0ZSA9IGQzX3RpbWVfaW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICAgIHJldHVybiBuZXcgZDNfZGF0ZShNYXRoLmZsb29yKGRhdGUgLyA2ZTQpICogNmU0KTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSwgb2Zmc2V0KSB7XG4gICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgTWF0aC5mbG9vcihvZmZzZXQpICogNmU0KTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSkge1xuICAgIHJldHVybiBkYXRlLmdldE1pbnV0ZXMoKTtcbiAgfSk7XG4gIGQzX3RpbWUubWludXRlcyA9IGQzX3RpbWUubWludXRlLnJhbmdlO1xuICBkM190aW1lLm1pbnV0ZXMudXRjID0gZDNfdGltZS5taW51dGUudXRjLnJhbmdlO1xuICBkM190aW1lLmhvdXIgPSBkM190aW1lX2ludGVydmFsKGZ1bmN0aW9uKGRhdGUpIHtcbiAgICB2YXIgdGltZXpvbmUgPSBkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCkgLyA2MDtcbiAgICByZXR1cm4gbmV3IGQzX2RhdGUoKE1hdGguZmxvb3IoZGF0ZSAvIDM2ZTUgLSB0aW1lem9uZSkgKyB0aW1lem9uZSkgKiAzNmU1KTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSwgb2Zmc2V0KSB7XG4gICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgTWF0aC5mbG9vcihvZmZzZXQpICogMzZlNSk7XG4gIH0sIGZ1bmN0aW9uKGRhdGUpIHtcbiAgICByZXR1cm4gZGF0ZS5nZXRIb3VycygpO1xuICB9KTtcbiAgZDNfdGltZS5ob3VycyA9IGQzX3RpbWUuaG91ci5yYW5nZTtcbiAgZDNfdGltZS5ob3Vycy51dGMgPSBkM190aW1lLmhvdXIudXRjLnJhbmdlO1xuICBkM190aW1lLm1vbnRoID0gZDNfdGltZV9pbnRlcnZhbChmdW5jdGlvbihkYXRlKSB7XG4gICAgZGF0ZSA9IGQzX3RpbWUuZGF5KGRhdGUpO1xuICAgIGRhdGUuc2V0RGF0ZSgxKTtcbiAgICByZXR1cm4gZGF0ZTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSwgb2Zmc2V0KSB7XG4gICAgZGF0ZS5zZXRNb250aChkYXRlLmdldE1vbnRoKCkgKyBvZmZzZXQpO1xuICB9LCBmdW5jdGlvbihkYXRlKSB7XG4gICAgcmV0dXJuIGRhdGUuZ2V0TW9udGgoKTtcbiAgfSk7XG4gIGQzX3RpbWUubW9udGhzID0gZDNfdGltZS5tb250aC5yYW5nZTtcbiAgZDNfdGltZS5tb250aHMudXRjID0gZDNfdGltZS5tb250aC51dGMucmFuZ2U7XG4gIGZ1bmN0aW9uIGQzX3RpbWVfc2NhbGUobGluZWFyLCBtZXRob2RzLCBmb3JtYXQpIHtcbiAgICBmdW5jdGlvbiBzY2FsZSh4KSB7XG4gICAgICByZXR1cm4gbGluZWFyKHgpO1xuICAgIH1cbiAgICBzY2FsZS5pbnZlcnQgPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gZDNfdGltZV9zY2FsZURhdGUobGluZWFyLmludmVydCh4KSk7XG4gICAgfTtcbiAgICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbih4KSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBsaW5lYXIuZG9tYWluKCkubWFwKGQzX3RpbWVfc2NhbGVEYXRlKTtcbiAgICAgIGxpbmVhci5kb21haW4oeCk7XG4gICAgICByZXR1cm4gc2NhbGU7XG4gICAgfTtcbiAgICBmdW5jdGlvbiB0aWNrTWV0aG9kKGV4dGVudCwgY291bnQpIHtcbiAgICAgIHZhciBzcGFuID0gZXh0ZW50WzFdIC0gZXh0ZW50WzBdLCB0YXJnZXQgPSBzcGFuIC8gY291bnQsIGkgPSBkMy5iaXNlY3QoZDNfdGltZV9zY2FsZVN0ZXBzLCB0YXJnZXQpO1xuICAgICAgcmV0dXJuIGkgPT0gZDNfdGltZV9zY2FsZVN0ZXBzLmxlbmd0aCA/IFsgbWV0aG9kcy55ZWFyLCBkM19zY2FsZV9saW5lYXJUaWNrUmFuZ2UoZXh0ZW50Lm1hcChmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkIC8gMzE1MzZlNjtcbiAgICAgIH0pLCBjb3VudClbMl0gXSA6ICFpID8gWyBkM190aW1lX3NjYWxlTWlsbGlzZWNvbmRzLCBkM19zY2FsZV9saW5lYXJUaWNrUmFuZ2UoZXh0ZW50LCBjb3VudClbMl0gXSA6IG1ldGhvZHNbdGFyZ2V0IC8gZDNfdGltZV9zY2FsZVN0ZXBzW2kgLSAxXSA8IGQzX3RpbWVfc2NhbGVTdGVwc1tpXSAvIHRhcmdldCA/IGkgLSAxIDogaV07XG4gICAgfVxuICAgIHNjYWxlLm5pY2UgPSBmdW5jdGlvbihpbnRlcnZhbCwgc2tpcCkge1xuICAgICAgdmFyIGRvbWFpbiA9IHNjYWxlLmRvbWFpbigpLCBleHRlbnQgPSBkM19zY2FsZUV4dGVudChkb21haW4pLCBtZXRob2QgPSBpbnRlcnZhbCA9PSBudWxsID8gdGlja01ldGhvZChleHRlbnQsIDEwKSA6IHR5cGVvZiBpbnRlcnZhbCA9PT0gXCJudW1iZXJcIiAmJiB0aWNrTWV0aG9kKGV4dGVudCwgaW50ZXJ2YWwpO1xuICAgICAgaWYgKG1ldGhvZCkgaW50ZXJ2YWwgPSBtZXRob2RbMF0sIHNraXAgPSBtZXRob2RbMV07XG4gICAgICBmdW5jdGlvbiBza2lwcGVkKGRhdGUpIHtcbiAgICAgICAgcmV0dXJuICFpc05hTihkYXRlKSAmJiAhaW50ZXJ2YWwucmFuZ2UoZGF0ZSwgZDNfdGltZV9zY2FsZURhdGUoK2RhdGUgKyAxKSwgc2tpcCkubGVuZ3RoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNjYWxlLmRvbWFpbihkM19zY2FsZV9uaWNlKGRvbWFpbiwgc2tpcCA+IDEgPyB7XG4gICAgICAgIGZsb29yOiBmdW5jdGlvbihkYXRlKSB7XG4gICAgICAgICAgd2hpbGUgKHNraXBwZWQoZGF0ZSA9IGludGVydmFsLmZsb29yKGRhdGUpKSkgZGF0ZSA9IGQzX3RpbWVfc2NhbGVEYXRlKGRhdGUgLSAxKTtcbiAgICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICAgICAgfSxcbiAgICAgICAgY2VpbDogZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICAgIHdoaWxlIChza2lwcGVkKGRhdGUgPSBpbnRlcnZhbC5jZWlsKGRhdGUpKSkgZGF0ZSA9IGQzX3RpbWVfc2NhbGVEYXRlKCtkYXRlICsgMSk7XG4gICAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgICAgIH1cbiAgICAgIH0gOiBpbnRlcnZhbCkpO1xuICAgIH07XG4gICAgc2NhbGUudGlja3MgPSBmdW5jdGlvbihpbnRlcnZhbCwgc2tpcCkge1xuICAgICAgdmFyIGV4dGVudCA9IGQzX3NjYWxlRXh0ZW50KHNjYWxlLmRvbWFpbigpKSwgbWV0aG9kID0gaW50ZXJ2YWwgPT0gbnVsbCA/IHRpY2tNZXRob2QoZXh0ZW50LCAxMCkgOiB0eXBlb2YgaW50ZXJ2YWwgPT09IFwibnVtYmVyXCIgPyB0aWNrTWV0aG9kKGV4dGVudCwgaW50ZXJ2YWwpIDogIWludGVydmFsLnJhbmdlICYmIFsge1xuICAgICAgICByYW5nZTogaW50ZXJ2YWxcbiAgICAgIH0sIHNraXAgXTtcbiAgICAgIGlmIChtZXRob2QpIGludGVydmFsID0gbWV0aG9kWzBdLCBza2lwID0gbWV0aG9kWzFdO1xuICAgICAgcmV0dXJuIGludGVydmFsLnJhbmdlKGV4dGVudFswXSwgZDNfdGltZV9zY2FsZURhdGUoK2V4dGVudFsxXSArIDEpLCBza2lwIDwgMSA/IDEgOiBza2lwKTtcbiAgICB9O1xuICAgIHNjYWxlLnRpY2tGb3JtYXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgfTtcbiAgICBzY2FsZS5jb3B5ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZDNfdGltZV9zY2FsZShsaW5lYXIuY29weSgpLCBtZXRob2RzLCBmb3JtYXQpO1xuICAgIH07XG4gICAgcmV0dXJuIGQzX3NjYWxlX2xpbmVhclJlYmluZChzY2FsZSwgbGluZWFyKTtcbiAgfVxuICBmdW5jdGlvbiBkM190aW1lX3NjYWxlRGF0ZSh0KSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKHQpO1xuICB9XG4gIHZhciBkM190aW1lX3NjYWxlU3RlcHMgPSBbIDFlMywgNWUzLCAxNWUzLCAzZTQsIDZlNCwgM2U1LCA5ZTUsIDE4ZTUsIDM2ZTUsIDEwOGU1LCAyMTZlNSwgNDMyZTUsIDg2NGU1LCAxNzI4ZTUsIDYwNDhlNSwgMjU5MmU2LCA3Nzc2ZTYsIDMxNTM2ZTYgXTtcbiAgdmFyIGQzX3RpbWVfc2NhbGVMb2NhbE1ldGhvZHMgPSBbIFsgZDNfdGltZS5zZWNvbmQsIDEgXSwgWyBkM190aW1lLnNlY29uZCwgNSBdLCBbIGQzX3RpbWUuc2Vjb25kLCAxNSBdLCBbIGQzX3RpbWUuc2Vjb25kLCAzMCBdLCBbIGQzX3RpbWUubWludXRlLCAxIF0sIFsgZDNfdGltZS5taW51dGUsIDUgXSwgWyBkM190aW1lLm1pbnV0ZSwgMTUgXSwgWyBkM190aW1lLm1pbnV0ZSwgMzAgXSwgWyBkM190aW1lLmhvdXIsIDEgXSwgWyBkM190aW1lLmhvdXIsIDMgXSwgWyBkM190aW1lLmhvdXIsIDYgXSwgWyBkM190aW1lLmhvdXIsIDEyIF0sIFsgZDNfdGltZS5kYXksIDEgXSwgWyBkM190aW1lLmRheSwgMiBdLCBbIGQzX3RpbWUud2VlaywgMSBdLCBbIGQzX3RpbWUubW9udGgsIDEgXSwgWyBkM190aW1lLm1vbnRoLCAzIF0sIFsgZDNfdGltZS55ZWFyLCAxIF0gXTtcbiAgdmFyIGQzX3RpbWVfc2NhbGVMb2NhbEZvcm1hdCA9IGQzX3RpbWVfZm9ybWF0Lm11bHRpKFsgWyBcIi4lTFwiLCBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIGQuZ2V0TWlsbGlzZWNvbmRzKCk7XG4gIH0gXSwgWyBcIjolU1wiLCBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIGQuZ2V0U2Vjb25kcygpO1xuICB9IF0sIFsgXCIlSTolTVwiLCBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIGQuZ2V0TWludXRlcygpO1xuICB9IF0sIFsgXCIlSSAlcFwiLCBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIGQuZ2V0SG91cnMoKTtcbiAgfSBdLCBbIFwiJWEgJWRcIiwgZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiBkLmdldERheSgpICYmIGQuZ2V0RGF0ZSgpICE9IDE7XG4gIH0gXSwgWyBcIiViICVkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gZC5nZXREYXRlKCkgIT0gMTtcbiAgfSBdLCBbIFwiJUJcIiwgZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiBkLmdldE1vbnRoKCk7XG4gIH0gXSwgWyBcIiVZXCIsIGQzX3RydWUgXSBdKTtcbiAgdmFyIGQzX3RpbWVfc2NhbGVNaWxsaXNlY29uZHMgPSB7XG4gICAgcmFuZ2U6IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgICByZXR1cm4gZDMucmFuZ2UoTWF0aC5jZWlsKHN0YXJ0IC8gc3RlcCkgKiBzdGVwLCArc3RvcCwgc3RlcCkubWFwKGQzX3RpbWVfc2NhbGVEYXRlKTtcbiAgICB9LFxuICAgIGZsb29yOiBkM19pZGVudGl0eSxcbiAgICBjZWlsOiBkM19pZGVudGl0eVxuICB9O1xuICBkM190aW1lX3NjYWxlTG9jYWxNZXRob2RzLnllYXIgPSBkM190aW1lLnllYXI7XG4gIGQzX3RpbWUuc2NhbGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZDNfdGltZV9zY2FsZShkMy5zY2FsZS5saW5lYXIoKSwgZDNfdGltZV9zY2FsZUxvY2FsTWV0aG9kcywgZDNfdGltZV9zY2FsZUxvY2FsRm9ybWF0KTtcbiAgfTtcbiAgdmFyIGQzX3RpbWVfc2NhbGVVdGNNZXRob2RzID0gZDNfdGltZV9zY2FsZUxvY2FsTWV0aG9kcy5tYXAoZnVuY3Rpb24obSkge1xuICAgIHJldHVybiBbIG1bMF0udXRjLCBtWzFdIF07XG4gIH0pO1xuICB2YXIgZDNfdGltZV9zY2FsZVV0Y0Zvcm1hdCA9IGQzX3RpbWVfZm9ybWF0VXRjLm11bHRpKFsgWyBcIi4lTFwiLCBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIGQuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XG4gIH0gXSwgWyBcIjolU1wiLCBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIGQuZ2V0VVRDU2Vjb25kcygpO1xuICB9IF0sIFsgXCIlSTolTVwiLCBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIGQuZ2V0VVRDTWludXRlcygpO1xuICB9IF0sIFsgXCIlSSAlcFwiLCBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIGQuZ2V0VVRDSG91cnMoKTtcbiAgfSBdLCBbIFwiJWEgJWRcIiwgZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiBkLmdldFVUQ0RheSgpICYmIGQuZ2V0VVRDRGF0ZSgpICE9IDE7XG4gIH0gXSwgWyBcIiViICVkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gZC5nZXRVVENEYXRlKCkgIT0gMTtcbiAgfSBdLCBbIFwiJUJcIiwgZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiBkLmdldFVUQ01vbnRoKCk7XG4gIH0gXSwgWyBcIiVZXCIsIGQzX3RydWUgXSBdKTtcbiAgZDNfdGltZV9zY2FsZVV0Y01ldGhvZHMueWVhciA9IGQzX3RpbWUueWVhci51dGM7XG4gIGQzX3RpbWUuc2NhbGUudXRjID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGQzX3RpbWVfc2NhbGUoZDMuc2NhbGUubGluZWFyKCksIGQzX3RpbWVfc2NhbGVVdGNNZXRob2RzLCBkM190aW1lX3NjYWxlVXRjRm9ybWF0KTtcbiAgfTtcbiAgZDMudGV4dCA9IGQzX3hoclR5cGUoZnVuY3Rpb24ocmVxdWVzdCkge1xuICAgIHJldHVybiByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcbiAgfSk7XG4gIGQzLmpzb24gPSBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGQzX3hocih1cmwsIFwiYXBwbGljYXRpb24vanNvblwiLCBkM19qc29uLCBjYWxsYmFjayk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2pzb24ocmVxdWVzdCkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcbiAgfVxuICBkMy5odG1sID0gZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBkM194aHIodXJsLCBcInRleHQvaHRtbFwiLCBkM19odG1sLCBjYWxsYmFjayk7XG4gIH07XG4gIGZ1bmN0aW9uIGQzX2h0bWwocmVxdWVzdCkge1xuICAgIHZhciByYW5nZSA9IGQzX2RvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgcmFuZ2Uuc2VsZWN0Tm9kZShkM19kb2N1bWVudC5ib2R5KTtcbiAgICByZXR1cm4gcmFuZ2UuY3JlYXRlQ29udGV4dHVhbEZyYWdtZW50KHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcbiAgfVxuICBkMy54bWwgPSBkM194aHJUeXBlKGZ1bmN0aW9uKHJlcXVlc3QpIHtcbiAgICByZXR1cm4gcmVxdWVzdC5yZXNwb25zZVhNTDtcbiAgfSk7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkgdGhpcy5kMyA9IGQzLCBkZWZpbmUoZDMpOyBlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IGQzOyBlbHNlIHRoaXMuZDMgPSBkMztcbn0oKTsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMuRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4vbGliL0Rpc3BhdGNoZXInKTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgRGlzcGF0Y2hlclxuICogXG4gKiBAcHJldmVudE11bmdlXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIGludmFyaWFudCA9IHJlcXVpcmUoJ2ZianMvbGliL2ludmFyaWFudCcpO1xuXG52YXIgX3ByZWZpeCA9ICdJRF8nO1xuXG4vKipcbiAqIERpc3BhdGNoZXIgaXMgdXNlZCB0byBicm9hZGNhc3QgcGF5bG9hZHMgdG8gcmVnaXN0ZXJlZCBjYWxsYmFja3MuIFRoaXMgaXNcbiAqIGRpZmZlcmVudCBmcm9tIGdlbmVyaWMgcHViLXN1YiBzeXN0ZW1zIGluIHR3byB3YXlzOlxuICpcbiAqICAgMSkgQ2FsbGJhY2tzIGFyZSBub3Qgc3Vic2NyaWJlZCB0byBwYXJ0aWN1bGFyIGV2ZW50cy4gRXZlcnkgcGF5bG9hZCBpc1xuICogICAgICBkaXNwYXRjaGVkIHRvIGV2ZXJ5IHJlZ2lzdGVyZWQgY2FsbGJhY2suXG4gKiAgIDIpIENhbGxiYWNrcyBjYW4gYmUgZGVmZXJyZWQgaW4gd2hvbGUgb3IgcGFydCB1bnRpbCBvdGhlciBjYWxsYmFja3MgaGF2ZVxuICogICAgICBiZWVuIGV4ZWN1dGVkLlxuICpcbiAqIEZvciBleGFtcGxlLCBjb25zaWRlciB0aGlzIGh5cG90aGV0aWNhbCBmbGlnaHQgZGVzdGluYXRpb24gZm9ybSwgd2hpY2hcbiAqIHNlbGVjdHMgYSBkZWZhdWx0IGNpdHkgd2hlbiBhIGNvdW50cnkgaXMgc2VsZWN0ZWQ6XG4gKlxuICogICB2YXIgZmxpZ2h0RGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKCk7XG4gKlxuICogICAvLyBLZWVwcyB0cmFjayBvZiB3aGljaCBjb3VudHJ5IGlzIHNlbGVjdGVkXG4gKiAgIHZhciBDb3VudHJ5U3RvcmUgPSB7Y291bnRyeTogbnVsbH07XG4gKlxuICogICAvLyBLZWVwcyB0cmFjayBvZiB3aGljaCBjaXR5IGlzIHNlbGVjdGVkXG4gKiAgIHZhciBDaXR5U3RvcmUgPSB7Y2l0eTogbnVsbH07XG4gKlxuICogICAvLyBLZWVwcyB0cmFjayBvZiB0aGUgYmFzZSBmbGlnaHQgcHJpY2Ugb2YgdGhlIHNlbGVjdGVkIGNpdHlcbiAqICAgdmFyIEZsaWdodFByaWNlU3RvcmUgPSB7cHJpY2U6IG51bGx9XG4gKlxuICogV2hlbiBhIHVzZXIgY2hhbmdlcyB0aGUgc2VsZWN0ZWQgY2l0eSwgd2UgZGlzcGF0Y2ggdGhlIHBheWxvYWQ6XG4gKlxuICogICBmbGlnaHREaXNwYXRjaGVyLmRpc3BhdGNoKHtcbiAqICAgICBhY3Rpb25UeXBlOiAnY2l0eS11cGRhdGUnLFxuICogICAgIHNlbGVjdGVkQ2l0eTogJ3BhcmlzJ1xuICogICB9KTtcbiAqXG4gKiBUaGlzIHBheWxvYWQgaXMgZGlnZXN0ZWQgYnkgYENpdHlTdG9yZWA6XG4gKlxuICogICBmbGlnaHREaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKHBheWxvYWQpIHtcbiAqICAgICBpZiAocGF5bG9hZC5hY3Rpb25UeXBlID09PSAnY2l0eS11cGRhdGUnKSB7XG4gKiAgICAgICBDaXR5U3RvcmUuY2l0eSA9IHBheWxvYWQuc2VsZWN0ZWRDaXR5O1xuICogICAgIH1cbiAqICAgfSk7XG4gKlxuICogV2hlbiB0aGUgdXNlciBzZWxlY3RzIGEgY291bnRyeSwgd2UgZGlzcGF0Y2ggdGhlIHBheWxvYWQ6XG4gKlxuICogICBmbGlnaHREaXNwYXRjaGVyLmRpc3BhdGNoKHtcbiAqICAgICBhY3Rpb25UeXBlOiAnY291bnRyeS11cGRhdGUnLFxuICogICAgIHNlbGVjdGVkQ291bnRyeTogJ2F1c3RyYWxpYSdcbiAqICAgfSk7XG4gKlxuICogVGhpcyBwYXlsb2FkIGlzIGRpZ2VzdGVkIGJ5IGJvdGggc3RvcmVzOlxuICpcbiAqICAgQ291bnRyeVN0b3JlLmRpc3BhdGNoVG9rZW4gPSBmbGlnaHREaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKHBheWxvYWQpIHtcbiAqICAgICBpZiAocGF5bG9hZC5hY3Rpb25UeXBlID09PSAnY291bnRyeS11cGRhdGUnKSB7XG4gKiAgICAgICBDb3VudHJ5U3RvcmUuY291bnRyeSA9IHBheWxvYWQuc2VsZWN0ZWRDb3VudHJ5O1xuICogICAgIH1cbiAqICAgfSk7XG4gKlxuICogV2hlbiB0aGUgY2FsbGJhY2sgdG8gdXBkYXRlIGBDb3VudHJ5U3RvcmVgIGlzIHJlZ2lzdGVyZWQsIHdlIHNhdmUgYSByZWZlcmVuY2VcbiAqIHRvIHRoZSByZXR1cm5lZCB0b2tlbi4gVXNpbmcgdGhpcyB0b2tlbiB3aXRoIGB3YWl0Rm9yKClgLCB3ZSBjYW4gZ3VhcmFudGVlXG4gKiB0aGF0IGBDb3VudHJ5U3RvcmVgIGlzIHVwZGF0ZWQgYmVmb3JlIHRoZSBjYWxsYmFjayB0aGF0IHVwZGF0ZXMgYENpdHlTdG9yZWBcbiAqIG5lZWRzIHRvIHF1ZXJ5IGl0cyBkYXRhLlxuICpcbiAqICAgQ2l0eVN0b3JlLmRpc3BhdGNoVG9rZW4gPSBmbGlnaHREaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKHBheWxvYWQpIHtcbiAqICAgICBpZiAocGF5bG9hZC5hY3Rpb25UeXBlID09PSAnY291bnRyeS11cGRhdGUnKSB7XG4gKiAgICAgICAvLyBgQ291bnRyeVN0b3JlLmNvdW50cnlgIG1heSBub3QgYmUgdXBkYXRlZC5cbiAqICAgICAgIGZsaWdodERpc3BhdGNoZXIud2FpdEZvcihbQ291bnRyeVN0b3JlLmRpc3BhdGNoVG9rZW5dKTtcbiAqICAgICAgIC8vIGBDb3VudHJ5U3RvcmUuY291bnRyeWAgaXMgbm93IGd1YXJhbnRlZWQgdG8gYmUgdXBkYXRlZC5cbiAqXG4gKiAgICAgICAvLyBTZWxlY3QgdGhlIGRlZmF1bHQgY2l0eSBmb3IgdGhlIG5ldyBjb3VudHJ5XG4gKiAgICAgICBDaXR5U3RvcmUuY2l0eSA9IGdldERlZmF1bHRDaXR5Rm9yQ291bnRyeShDb3VudHJ5U3RvcmUuY291bnRyeSk7XG4gKiAgICAgfVxuICogICB9KTtcbiAqXG4gKiBUaGUgdXNhZ2Ugb2YgYHdhaXRGb3IoKWAgY2FuIGJlIGNoYWluZWQsIGZvciBleGFtcGxlOlxuICpcbiAqICAgRmxpZ2h0UHJpY2VTdG9yZS5kaXNwYXRjaFRva2VuID1cbiAqICAgICBmbGlnaHREaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKHBheWxvYWQpIHtcbiAqICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb25UeXBlKSB7XG4gKiAgICAgICAgIGNhc2UgJ2NvdW50cnktdXBkYXRlJzpcbiAqICAgICAgICAgY2FzZSAnY2l0eS11cGRhdGUnOlxuICogICAgICAgICAgIGZsaWdodERpc3BhdGNoZXIud2FpdEZvcihbQ2l0eVN0b3JlLmRpc3BhdGNoVG9rZW5dKTtcbiAqICAgICAgICAgICBGbGlnaHRQcmljZVN0b3JlLnByaWNlID1cbiAqICAgICAgICAgICAgIGdldEZsaWdodFByaWNlU3RvcmUoQ291bnRyeVN0b3JlLmNvdW50cnksIENpdHlTdG9yZS5jaXR5KTtcbiAqICAgICAgICAgICBicmVhaztcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIFRoZSBgY291bnRyeS11cGRhdGVgIHBheWxvYWQgd2lsbCBiZSBndWFyYW50ZWVkIHRvIGludm9rZSB0aGUgc3RvcmVzJ1xuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MgaW4gb3JkZXI6IGBDb3VudHJ5U3RvcmVgLCBgQ2l0eVN0b3JlYCwgdGhlblxuICogYEZsaWdodFByaWNlU3RvcmVgLlxuICovXG5cbnZhciBEaXNwYXRjaGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gRGlzcGF0Y2hlcigpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRGlzcGF0Y2hlcik7XG5cbiAgICB0aGlzLl9jYWxsYmFja3MgPSB7fTtcbiAgICB0aGlzLl9pc0Rpc3BhdGNoaW5nID0gZmFsc2U7XG4gICAgdGhpcy5faXNIYW5kbGVkID0ge307XG4gICAgdGhpcy5faXNQZW5kaW5nID0ge307XG4gICAgdGhpcy5fbGFzdElEID0gMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHdpdGggZXZlcnkgZGlzcGF0Y2hlZCBwYXlsb2FkLiBSZXR1cm5zXG4gICAqIGEgdG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB3aXRoIGB3YWl0Rm9yKClgLlxuICAgKi9cblxuICBEaXNwYXRjaGVyLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uIHJlZ2lzdGVyKGNhbGxiYWNrKSB7XG4gICAgdmFyIGlkID0gX3ByZWZpeCArIHRoaXMuX2xhc3RJRCsrO1xuICAgIHRoaXMuX2NhbGxiYWNrc1tpZF0gPSBjYWxsYmFjaztcbiAgICByZXR1cm4gaWQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBjYWxsYmFjayBiYXNlZCBvbiBpdHMgdG9rZW4uXG4gICAqL1xuXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLnVucmVnaXN0ZXIgPSBmdW5jdGlvbiB1bnJlZ2lzdGVyKGlkKSB7XG4gICAgIXRoaXMuX2NhbGxiYWNrc1tpZF0gPyBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gaW52YXJpYW50KGZhbHNlLCAnRGlzcGF0Y2hlci51bnJlZ2lzdGVyKC4uLik6IGAlc2AgZG9lcyBub3QgbWFwIHRvIGEgcmVnaXN0ZXJlZCBjYWxsYmFjay4nLCBpZCkgOiBpbnZhcmlhbnQoZmFsc2UpIDogdW5kZWZpbmVkO1xuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbaWRdO1xuICB9O1xuXG4gIC8qKlxuICAgKiBXYWl0cyBmb3IgdGhlIGNhbGxiYWNrcyBzcGVjaWZpZWQgdG8gYmUgaW52b2tlZCBiZWZvcmUgY29udGludWluZyBleGVjdXRpb25cbiAgICogb2YgdGhlIGN1cnJlbnQgY2FsbGJhY2suIFRoaXMgbWV0aG9kIHNob3VsZCBvbmx5IGJlIHVzZWQgYnkgYSBjYWxsYmFjayBpblxuICAgKiByZXNwb25zZSB0byBhIGRpc3BhdGNoZWQgcGF5bG9hZC5cbiAgICovXG5cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUud2FpdEZvciA9IGZ1bmN0aW9uIHdhaXRGb3IoaWRzKSB7XG4gICAgIXRoaXMuX2lzRGlzcGF0Y2hpbmcgPyBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gaW52YXJpYW50KGZhbHNlLCAnRGlzcGF0Y2hlci53YWl0Rm9yKC4uLik6IE11c3QgYmUgaW52b2tlZCB3aGlsZSBkaXNwYXRjaGluZy4nKSA6IGludmFyaWFudChmYWxzZSkgOiB1bmRlZmluZWQ7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IGlkcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgIHZhciBpZCA9IGlkc1tpaV07XG4gICAgICBpZiAodGhpcy5faXNQZW5kaW5nW2lkXSkge1xuICAgICAgICAhdGhpcy5faXNIYW5kbGVkW2lkXSA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdEaXNwYXRjaGVyLndhaXRGb3IoLi4uKTogQ2lyY3VsYXIgZGVwZW5kZW5jeSBkZXRlY3RlZCB3aGlsZSAnICsgJ3dhaXRpbmcgZm9yIGAlc2AuJywgaWQpIDogaW52YXJpYW50KGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAhdGhpcy5fY2FsbGJhY2tzW2lkXSA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdEaXNwYXRjaGVyLndhaXRGb3IoLi4uKTogYCVzYCBkb2VzIG5vdCBtYXAgdG8gYSByZWdpc3RlcmVkIGNhbGxiYWNrLicsIGlkKSA6IGludmFyaWFudChmYWxzZSkgOiB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9pbnZva2VDYWxsYmFjayhpZCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBEaXNwYXRjaGVzIGEgcGF5bG9hZCB0byBhbGwgcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gICAqL1xuXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gZGlzcGF0Y2gocGF5bG9hZCkge1xuICAgICEhdGhpcy5faXNEaXNwYXRjaGluZyA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdEaXNwYXRjaC5kaXNwYXRjaCguLi4pOiBDYW5ub3QgZGlzcGF0Y2ggaW4gdGhlIG1pZGRsZSBvZiBhIGRpc3BhdGNoLicpIDogaW52YXJpYW50KGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zdGFydERpc3BhdGNoaW5nKHBheWxvYWQpO1xuICAgIHRyeSB7XG4gICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLl9jYWxsYmFja3MpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzUGVuZGluZ1tpZF0pIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbnZva2VDYWxsYmFjayhpZCk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuX3N0b3BEaXNwYXRjaGluZygpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogSXMgdGhpcyBEaXNwYXRjaGVyIGN1cnJlbnRseSBkaXNwYXRjaGluZy5cbiAgICovXG5cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuaXNEaXNwYXRjaGluZyA9IGZ1bmN0aW9uIGlzRGlzcGF0Y2hpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzRGlzcGF0Y2hpbmc7XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGwgdGhlIGNhbGxiYWNrIHN0b3JlZCB3aXRoIHRoZSBnaXZlbiBpZC4gQWxzbyBkbyBzb21lIGludGVybmFsXG4gICAqIGJvb2trZWVwaW5nLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG5cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuX2ludm9rZUNhbGxiYWNrID0gZnVuY3Rpb24gX2ludm9rZUNhbGxiYWNrKGlkKSB7XG4gICAgdGhpcy5faXNQZW5kaW5nW2lkXSA9IHRydWU7XG4gICAgdGhpcy5fY2FsbGJhY2tzW2lkXSh0aGlzLl9wZW5kaW5nUGF5bG9hZCk7XG4gICAgdGhpcy5faXNIYW5kbGVkW2lkXSA9IHRydWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldCB1cCBib29ra2VlcGluZyBuZWVkZWQgd2hlbiBkaXNwYXRjaGluZy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLl9zdGFydERpc3BhdGNoaW5nID0gZnVuY3Rpb24gX3N0YXJ0RGlzcGF0Y2hpbmcocGF5bG9hZCkge1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMuX2NhbGxiYWNrcykge1xuICAgICAgdGhpcy5faXNQZW5kaW5nW2lkXSA9IGZhbHNlO1xuICAgICAgdGhpcy5faXNIYW5kbGVkW2lkXSA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLl9wZW5kaW5nUGF5bG9hZCA9IHBheWxvYWQ7XG4gICAgdGhpcy5faXNEaXNwYXRjaGluZyA9IHRydWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsZWFyIGJvb2trZWVwaW5nIHVzZWQgZm9yIGRpc3BhdGNoaW5nLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG5cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuX3N0b3BEaXNwYXRjaGluZyA9IGZ1bmN0aW9uIF9zdG9wRGlzcGF0Y2hpbmcoKSB7XG4gICAgZGVsZXRlIHRoaXMuX3BlbmRpbmdQYXlsb2FkO1xuICAgIHRoaXMuX2lzRGlzcGF0Y2hpbmcgPSBmYWxzZTtcbiAgfTtcblxuICByZXR1cm4gRGlzcGF0Y2hlcjtcbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRGlzcGF0Y2hlcjsiLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLTIwMTUsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgaW52YXJpYW50XG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogVXNlIGludmFyaWFudCgpIHRvIGFzc2VydCBzdGF0ZSB3aGljaCB5b3VyIHByb2dyYW0gYXNzdW1lcyB0byBiZSB0cnVlLlxuICpcbiAqIFByb3ZpZGUgc3ByaW50Zi1zdHlsZSBmb3JtYXQgKG9ubHkgJXMgaXMgc3VwcG9ydGVkKSBhbmQgYXJndW1lbnRzXG4gKiB0byBwcm92aWRlIGluZm9ybWF0aW9uIGFib3V0IHdoYXQgYnJva2UgYW5kIHdoYXQgeW91IHdlcmVcbiAqIGV4cGVjdGluZy5cbiAqXG4gKiBUaGUgaW52YXJpYW50IG1lc3NhZ2Ugd2lsbCBiZSBzdHJpcHBlZCBpbiBwcm9kdWN0aW9uLCBidXQgdGhlIGludmFyaWFudFxuICogd2lsbCByZW1haW4gdG8gZW5zdXJlIGxvZ2ljIGRvZXMgbm90IGRpZmZlciBpbiBwcm9kdWN0aW9uLlxuICovXG5cbnZhciBpbnZhcmlhbnQgPSBmdW5jdGlvbiAoY29uZGl0aW9uLCBmb3JtYXQsIGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YXJpYW50IHJlcXVpcmVzIGFuIGVycm9yIG1lc3NhZ2UgYXJndW1lbnQnKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWNvbmRpdGlvbikge1xuICAgIHZhciBlcnJvcjtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKCdNaW5pZmllZCBleGNlcHRpb24gb2NjdXJyZWQ7IHVzZSB0aGUgbm9uLW1pbmlmaWVkIGRldiBlbnZpcm9ubWVudCAnICsgJ2ZvciB0aGUgZnVsbCBlcnJvciBtZXNzYWdlIGFuZCBhZGRpdGlvbmFsIGhlbHBmdWwgd2FybmluZ3MuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhcmdzID0gW2EsIGIsIGMsIGQsIGUsIGZdO1xuICAgICAgdmFyIGFyZ0luZGV4ID0gMDtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKCdJbnZhcmlhbnQgVmlvbGF0aW9uOiAnICsgZm9ybWF0LnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGFyZ3NbYXJnSW5kZXgrK107XG4gICAgICB9KSk7XG4gICAgfVxuXG4gICAgZXJyb3IuZnJhbWVzVG9Qb3AgPSAxOyAvLyB3ZSBkb24ndCBjYXJlIGFib3V0IGludmFyaWFudCdzIG93biBmcmFtZVxuICAgIHRocm93IGVycm9yO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGludmFyaWFudDsiLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhbiBlbnVtZXJhdGlvbiB3aXRoIGtleXMgZXF1YWwgdG8gdGhlaXIgdmFsdWUuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogICB2YXIgQ09MT1JTID0ga2V5TWlycm9yKHtibHVlOiBudWxsLCByZWQ6IG51bGx9KTtcbiAqICAgdmFyIG15Q29sb3IgPSBDT0xPUlMuYmx1ZTtcbiAqICAgdmFyIGlzQ29sb3JWYWxpZCA9ICEhQ09MT1JTW215Q29sb3JdO1xuICpcbiAqIFRoZSBsYXN0IGxpbmUgY291bGQgbm90IGJlIHBlcmZvcm1lZCBpZiB0aGUgdmFsdWVzIG9mIHRoZSBnZW5lcmF0ZWQgZW51bSB3ZXJlXG4gKiBub3QgZXF1YWwgdG8gdGhlaXIga2V5cy5cbiAqXG4gKiAgIElucHV0OiAge2tleTE6IHZhbDEsIGtleTI6IHZhbDJ9XG4gKiAgIE91dHB1dDoge2tleTE6IGtleTEsIGtleTI6IGtleTJ9XG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9ialxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG52YXIga2V5TWlycm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gIHZhciByZXQgPSB7fTtcbiAgdmFyIGtleTtcbiAgaWYgKCEob2JqIGluc3RhbmNlb2YgT2JqZWN0ICYmICFBcnJheS5pc0FycmF5KG9iaikpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdrZXlNaXJyb3IoLi4uKTogQXJndW1lbnQgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gIH1cbiAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHJldFtrZXldID0ga2V5O1xuICB9XG4gIHJldHVybiByZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleU1pcnJvcjtcbiIsIi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG4ndXNlIHN0cmljdCc7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHByb3BJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5mdW5jdGlvbiB0b09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcblx0dmFyIGZyb207XG5cdHZhciB0byA9IHRvT2JqZWN0KHRhcmdldCk7XG5cdHZhciBzeW1ib2xzO1xuXG5cdGZvciAodmFyIHMgPSAxOyBzIDwgYXJndW1lbnRzLmxlbmd0aDsgcysrKSB7XG5cdFx0ZnJvbSA9IE9iamVjdChhcmd1bWVudHNbc10pO1xuXG5cdFx0Zm9yICh2YXIga2V5IGluIGZyb20pIHtcblx0XHRcdGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGZyb20sIGtleSkpIHtcblx0XHRcdFx0dG9ba2V5XSA9IGZyb21ba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuXHRcdFx0c3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZnJvbSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHByb3BJc0VudW1lcmFibGUuY2FsbChmcm9tLCBzeW1ib2xzW2ldKSkge1xuXHRcdFx0XHRcdHRvW3N5bWJvbHNbaV1dID0gZnJvbVtzeW1ib2xzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCJ2YXIgU2Nyb2xsZXIgPSByZXF1aXJlKCcuL1Njcm9sbGVyJyk7XG52YXIgVml6ID0gcmVxdWlyZSgnLi9WaXonKTtcblxudmFyIEFwcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyOiBmdW5jdGlvbigpe1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17J2NvbnRhaW5lcid9PiBcbiAgICAgICAgPFNjcm9sbGVyIC8+XG4gICAgICAgIDxWaXogLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcDtcblxuIiwidmFyIEFjdGlvbnMgPSByZXF1aXJlKCcuLi9mbHV4L0xpZmVWaXpBY3Rpb25zJyk7XG5cbnZhciBjbGFzc05hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xudmFyIGQzID0gcmVxdWlyZSgnZDMnKTtcblxudmFyIFNjcm9sbGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIF9zdGFnZXM6IFtcbiAgICB7XG4gICAgICB0aXRsZTogJ01hcmNoIDEyLCAyMDE1JyxcbiAgICAgIHRleHQ6ICdZaWNoZW4gaXMgYm9ybiBpbiBSZWR3b29kIENpdHkhIEkgdXBkYXRlZCB0byBiZWNvbWUgYSBEQUQhJyxcbiAgICB9LCBcbiAgICB7XG4gICAgICB0aXRsZTogJ0p1biAyMCwgMjAxNScsXG4gICAgICB0ZXh0OiAnWWljaGVuIGlzIG9mZmljYWxseSAxMDAgZGF5cy4gV2UgaGFkIGEgaHVnZSBwYXJ0eSBmb3IgaGltIScsXG4gICAgfSwgXG4gIF0sXG5cbiAgX3N0YWdlc1Bvc2l0aW9uczogW10sXG4gIF9jb250YWluZXJQb3NpdGlvbjogMCxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Y3VycmVudFN0YWdlOiAwfTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fZ2V0U3RhZ2VzUG9zaXRpb25zKCk7XG4gICAgZDMuc2VsZWN0KHdpbmRvdykub24oXCJzY3JvbGwuc2Nyb2xsZXJcIiwgdGhpcy5fc2Nyb2xsKTtcbiAgfSxcblxuICBfZ2V0U3RhZ2VzUG9zaXRpb25zOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsID0gdGhpcztcbiAgICBkMy5zZWxlY3RBbGwoJy5zdGFnZScpLmVhY2goZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHRvcCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuICAgICAgaWYoaSA9PT0gMCkge1xuICAgICAgICBzdGFydFBvcyA9IHRvcDtcbiAgICAgIH1cbiAgICAgIHNlbC5fc3RhZ2VzUG9zaXRpb25zLnB1c2godG9wIC0gc3RhcnRQb3MpO1xuICAgIH0pO1xuICAgIHRoaXMuX2NvbnRhaW5lclBvc2l0aW9uID0gZDMuc2VsZWN0KCcuc2Nyb2xsZXInKS5ub2RlKCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgd2luZG93LnBhZ2VZT2Zmc2V0O1xuICB9LFxuXG4gIF9zY3JvbGw6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwb3MgPSB3aW5kb3cucGFnZVlPZmZzZXQgLSAxMCAtIHRoaXMuX2NvbnRhaW5lclBvc2l0aW9uO1xuICAgIHZhciBuZXdTdGFnZSA9IGQzLmJpc2VjdCh0aGlzLl9zdGFnZXNQb3NpdGlvbnMsIHBvcyk7XG4gICAgbmV3U3RhZ2UgPSBNYXRoLm1pbih0aGlzLl9zdGFnZXMubGVuZ3RoIC0gMSwgbmV3U3RhZ2UpO1xuXG4gICAgaWYgKHRoaXMuc3RhdGUuY3VycmVudFN0YWdlICE9PSBuZXdTdGFnZSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VycmVudFN0YWdlOiBuZXdTdGFnZX0pO1xuICAgICAgQWN0aW9ucy5tb3ZlVG9OZXdTdGFnZShuZXdTdGFnZSk7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXsnc2Nyb2xsZXInfT4gXG4gICAgICAgIHtcbiAgICAgICAgICB0aGlzLl9zdGFnZXMubWFwKGZ1bmN0aW9uKHN0YWdlLCBpZHgpIHsgXG4gICAgICAgICAgICB2YXIgY24gPSBjbGFzc05hbWVzKHtcbiAgICAgICAgICAgICAgJ3N0YWdlJzogdHJ1ZSxcbiAgICAgICAgICAgICAgJ3RyYW5zcGFyZW50JzogdGhpcy5zdGF0ZS5jdXJyZW50U3RhZ2UgIT09IGlkeCxcbiAgICAgICAgICAgICAgJ2xhc3Qtc3RhZ2UnOiB0aGlzLl9zdGFnZXMubGVuZ3RoIC0gMSA9PT0gaWR4LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9e2NufT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17J3RpdGxlJ30+e3N0YWdlLnRpdGxlfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT17J21haW4tdGV4dCd9PntzdGFnZS50ZXh0fTwvcD5cbiAgICAgICAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIH1cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcm9sbGVyO1xuXG4iLCJ2YXIgU3RvcmUgPSByZXF1aXJlKCcuLi9mbHV4L0xpZmVWaXpEYXRhU3RvcmUnKTtcblxudmFyIFZpeiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Y3VycmVudFN0YWdlOiAwfTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25TdGFnZUNoYW5nZSk7IFxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICBTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vblN0YWdlQ2hhbmdlKTtcbiAgfSxcblxuICBfb25TdGFnZUNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Y3VycmVudFN0YWdlOiBTdG9yZS5nZXRDdXJyZW50U3RhZ2UoKX0pOyBcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPXsndml6J30gPnt0aGlzLnN0YXRlLmN1cnJlbnRTdGFnZX08L2Rpdj47XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpejtcblxuIiwidmFyIExpZmVWaXpEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi9MaWZlVml6RGlzcGF0Y2hlcicpO1xudmFyIExpZmVWaXpDb25zdGFudHMgPSByZXF1aXJlKCcuL0xpZmVWaXpDb25zdGFudHMnKTtcblxudmFyIEFjdGlvblR5cGVzID0gTGlmZVZpekNvbnN0YW50cy5BY3Rpb25UeXBlcztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1vdmVUb05ld1N0YWdlOiBmdW5jdGlvbihjdXJyZW50U3RhZ2UpIHtcbiAgICBMaWZlVml6RGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gICAgICB0eXBlOiBBY3Rpb25UeXBlcy5NT1ZFX1RPX05FV19TVEFHRSxcbiAgICAgIGRhdGE6IHtjdXJyZW50U3RhZ2U6IGN1cnJlbnRTdGFnZX0sXG4gICAgfSk7XG4gIH1cbn07XG4iLCJ2YXIga2V5TWlycm9yID0gcmVxdWlyZSgna2V5bWlycm9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBBY3Rpb25UeXBlczoga2V5TWlycm9yKHtcbiAgICBNT1ZFX1RPX05FV19TVEFHRTogbnVsbCxcbiAgfSlcbn07XG5cbiIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XG52YXIgTGlmZVZpekNvbnN0YW50cyA9IHJlcXVpcmUoJy4vTGlmZVZpekNvbnN0YW50cycpO1xudmFyIExpZmVWaXpEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi9MaWZlVml6RGlzcGF0Y2hlcicpO1xuXG52YXIgYXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgQWN0aW9uVHlwZXMgPSBMaWZlVml6Q29uc3RhbnRzLkFjdGlvblR5cGVzO1xudmFyIENIQU5HRV9FVkVOVCA9ICdjaGFuZ2UnO1xuXG52YXIgX2N1cnJlbnRTdGFnZSA9IDA7XG52YXIgX2RhdGEgPSBbMSwgMl07XG5cbnZhciBMaWZlVml6RGF0YVN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cbiAgZW1pdENoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbWl0KENIQU5HRV9FVkVOVCk7XG4gIH0sXG5cbiAgYWRkQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5vbihDSEFOR0VfRVZFTlQsIGNhbGxiYWNrKTtcbiAgfSxcblxuICByZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKENIQU5HRV9FVkVOVCwgY2FsbGJhY2spO1xuICB9LFxuXG4gIGdldEN1cnJlbnRTdGFnZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF9jdXJyZW50U3RhZ2U7XG4gIH0sXG5cbiAgZ2V0Q3VycmVudFN0YWdlRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF9kYXRhW19jdXJyZW50U3RhZ2VdO1xuICB9LFxufSk7XG5cbkxpZmVWaXpEYXRhU3RvcmUuZGlzcGF0Y2hUb2tlbiA9IExpZmVWaXpEaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKGFjdGlvbikge1xuXG4gIHN3aXRjaChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgQWN0aW9uVHlwZXMuTU9WRV9UT19ORVdfU1RBR0U6XG4gICAgICBfY3VycmVudFN0YWdlID0gYWN0aW9uLmRhdGEuY3VycmVudFN0YWdlO1xuICAgICAgTGlmZVZpekRhdGFTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gZG8gbm90aGluZ1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaWZlVml6RGF0YVN0b3JlO1xuIiwidmFyIERpc3BhdGNoZXIgPSByZXF1aXJlKCdmbHV4JykuRGlzcGF0Y2hlcjtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgRGlzcGF0Y2hlcigpO1xuIiwidmFyIEFwcCA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9BcHAnKTtcblxuUmVhY3QucmVuZGVyKDxBcHAgLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHAnKSk7XG5cbiJdfQ==
