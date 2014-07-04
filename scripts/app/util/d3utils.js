define(['lib/lodash'], function (_) {

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
      args.unshift('dw');
      return args.join('-');
    },
    transformProperty: function (v) {
      if (propertiesTransformation.hasOwnProperty(v)) {
        return propertiesTransformation[v];
      }
      return v;
    }
  };

	return utils;
});