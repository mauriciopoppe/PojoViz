define(['lib/lodash'], function (_) {
  var hashKey = function (v) {
    var value = v,
        uid = v;
    if (v && (typeof v === 'object' || typeof v === 'function')) {
      hashKey.createHashKeysFor(v);
      uid = v[hashKey.hiddenKey];
    }
    return typeof v + '-' + uid;
  };
  hashKey.hiddenKey = '__pojoVizKey__';
  hashKey.createHashKeysFor = function (obj) {

    function getName(obj) {
      var name, matchRE;
      name = typeof obj.name === 'string' ?
        obj.name : _.uniqueId();
      try {
        matchRE = obj.toString().match(/^\[object (\S*?)\]/);        
      } catch(e) {
        console.log(e);
      }

      name = (matchRE && matchRE[1]) || name;
      name = name.replace(/[\. ]/g, '-');
      return name;
    }

    if (!obj.hasOwnProperty(hashKey.hiddenKey)) {
      Object.defineProperty(obj, hashKey.hiddenKey, {
        value: getName(obj)
      });
    }
    if (obj.hasOwnProperty('prototype')) {
      if (!obj.prototype.hasOwnProperty(hashKey.hiddenKey)) {
        Object.defineProperty(obj.prototype, hashKey.hiddenKey, {
          value: getName(obj) + '-prototype'
        });
      }
    }
  };

  window.hashKey = hashKey;
  return hashKey;
});