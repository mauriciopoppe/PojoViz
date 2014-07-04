define(['util/hashKey'], function (hashKey) {

  function HashMap() {
  }

  HashMap.prototype = {
    put: function (key, value) {
      this[hashKey(key)] = value;
    },
    get: function (key) {
      return this[hashKey(key)];
    },
    remove: function (key) {
      var v = this[hashKey(key)];
      delete this[hashKey(key)];
      return v;
    }
  };

  return HashMap;
});