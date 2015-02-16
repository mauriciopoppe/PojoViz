'use strict';

var hashKey = require('./hashKey');

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