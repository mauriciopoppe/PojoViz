define(['util/HashMap', 'util/hashKey',
  'lib/lodash'], function (HashMap, hashKey, _) {
  var defaultObjects = [
    Object, Function,
    Array, Date, Boolean, Number, Math, String, RegExp, JSON,
    // window
  ],
      // a map of $$hashKey: value objects
      registeredObjects = new HashMap(),
      l = Infinity;

  function registerConstructorsAndPrototypes(objects) {
    objects.forEach(function (obj) {
      hashKey.createHashKeysFor(obj);
    });
  }

  function levels(nl) {
    if (nl === undefined) { return l; }
    l = nl;
    return this;
  }

  function getProperties(obj, objectsOnly) {
    var properties = Object.getOwnPropertyNames(obj);

    function forbidden(v) {
      return v.match(/^__.*?__$/) ||
        v.match(/^\$\$.*?\$\$$/);
    }

    // console.log(properties);
    properties = _.filter(properties, function (v) {
      var good = typeof v === 'string' && !forbidden(v),
          r;
      if (objectsOnly) {
        try {
          r = good && typeof obj[v] === 'object';
        } catch (e) {
          r = false;
          console.log(e);
        } finally {
          return r;
        }
      }
      return good;
    }).map(function (v) {
      var type;
      try {
        type = obj[v] ? typeof obj[v] : '' + obj[v];
      } catch(e) {
        type = 'null';
      }
      return {
        name: v,
        cls: hashKey(obj),
        type: v === 'constructor' ? 'object' : type,
        linkeable: type === 'object'
      };
    });

    // special properties
    var proto = Object.getPrototypeOf(obj);
    if (proto) {
      properties.push({
        name: '[[Prototype]]',
        cls: hashKey(obj),
        type: 'object',
        linkeable: true
      });
    }
    var constructor = obj.hasOwnProperty('constructor') &&
      obj.constructor;
    if (constructor &&
        _.findIndex(properties, { name: 'constructor' }) === -1) {
      properties.push({
        cls: hashKey(obj),
        name: 'constructor',
        type: 'object',
        linkeable: true
      });
    }

    // console.log(properties);
    return properties;
  }

  function getOwnLinks(obj) {
    // TODO: memoization
    var links = [],
        properties = getProperties(obj, true);

    // console.log(properties);
    _.forEach(properties, function (v) {
      var ref = obj[v.name];
      if (ref !== null && ref !== undefined) {
        links.push({
          from: obj,
          fromHash: hashKey(obj),
          to: ref,
          toHash: hashKey(ref),
          property: v.name
        });
      }
    });

    var proto = Object.getPrototypeOf(obj);
    if (proto) {
      links.push({
        from: obj,
        fromHash: hashKey(obj),
        to: proto,
        toHash: hashKey(proto),
        property: '[[Prototype]]'
      });
    }
    
    // console.log(links);
    return links;
  }

  function analyzeObjects(objects, currentLevel) {
    objects.forEach(function (v) {
      if (currentLevel <= l && !registeredObjects.get(v)) {
        registeredObjects.put(v, v);
        analyzeObjects(
          getOwnLinks(v).map(function (link) {
            return link.to;
          }),
          currentLevel + 1
        );
      }
    });
  }

  function register(obj) {
    analyzeObjects(obj);
    return this;
  }


  // analyze default objects
  function init() {
    registerConstructorsAndPrototypes(defaultObjects);
    analyzeObjects(defaultObjects, 0);
    return this;
  }

  return {
    // api
    levels: levels,
    register: register,
    init: init,
    getProperties: getProperties,
    getObjects: function () {
      return registeredObjects;
    },
    getLinks: function () {
      var links = {};
      _.forOwn(registeredObjects, function (v, k) {
        links[k] = getOwnLinks(v).map(function (link) {
          return hashKey(link.to);
        });
      });
      return links;
    },
    getLinkDetails: function (obj) {
      return getOwnLinks(obj);
    }
  };

});