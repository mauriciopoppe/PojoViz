define(['lib/lodash'], function (_) {
  var hashKey = function (v) {
    var value = v,
        uid = v;
    if (v && (typeof v === 'object' || typeof v === 'function')) {
      if (!v.hasOwnProperty(hashKey.hiddenKey)) {
        Object.defineProperty(v, hashKey.hiddenKey, {
          value: _.uniqueId()
        });
      }
      uid = v[hashKey.hiddenKey];
    }
    return typeof v + '-' + uid;
  };
  hashKey.hiddenKey = '$$dwHiddenKey$$';
  window.hashKey = hashKey;
  return hashKey;
});