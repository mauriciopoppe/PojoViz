'use strict';

var _ = require('lodash');

var propertiesTransformation = {
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
    if (propertiesTransformation.hasOwnProperty(v)) {
      return propertiesTransformation[v];
    }
    return v;
  },
  escapeCls: function(v) {
    return v.replace(/\$/g, '_');
  },
  toQueryString: function (obj) {
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
  },
  createJsonpCallback: function (url) {
    var script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
  }
};

module.exports = utils;