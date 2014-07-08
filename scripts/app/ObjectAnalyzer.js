define(['util/HashMap', 'util/hashKey',
  'lib/lodash'], function (HashMap, hashKey, _) {
  'use strict';

  // utils
  function eachObjectAndPrototype(obj, fn) {
    fn(obj);
    if (obj.hasOwnProperty('prototype')) {
      fn(obj.prototype);
    }
  }

  function getProperties(obj, objectsOnly) {
    var properties = Object.getOwnPropertyNames(obj);

    function forbiddenKey(v) {
      return v.match(/^__.*?__$/) ||
        v.match(/^\$\$.*?\$\$$/) ||
        v.match(/\$/);
    }

    // console.log(properties);
    properties = _.filter(properties, function (v) {
      var good = typeof v === 'string' && !forbiddenKey(v),
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

  /**
   * Creates a wrapper around to hashes on which multiple methods
   * work
   * @param  {[type]} objectMap [description]
   * @param  {[type]} forbidden [description]
   * @return {[type]}           [description]
   */
  function wrap(objectMap, forbidden) {
    var prop = {
      levels: Infinity,
      dirty: true
    };

    function isForbidden(obj) {
      return forbidden.get(obj);
    }

    function getOwnLinks(obj) {
      // TODO: memoization
      var links = [],
          properties = getProperties(obj, true);

      // console.log(properties);
      _.forEach(properties, function (v) {
        var ref = obj[v.name];
        if (ref !== null &&
            ref !== undefined &&
            !isForbidden(ref)) {
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
      if (proto && !isForbidden(proto)) {
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
        if (currentLevel <= prop.levels &&  // dfs level
            !objectMap.get(v) &&            // already registered
            !isForbidden(v)                 // forbidden check
            ) {
          objectMap.put(v, v);
          analyzeObjects(
            getOwnLinks(v).map(function (link) {
              return link.to;
            }),
            currentLevel + 1
          );
        }
      });
    }

    // public api methods
    function add(objects) {
      analyzeObjects(objects, 0);
      return instance;
    }

    function remove(objects, withPrototype) {
      objects.forEach(function (obj) {
        objectMap.remove(obj);
        if (withPrototype && obj.hasOwnProperty('prototype')) {
          objectMap.remove(obj.prototype);
        }
      });
      return instance;
    }

    function forbid(objects, withPrototype) {
      remove(objects, withPrototype);
      objects.forEach(function (obj) {
        forbidden.put(obj);
        if (withPrototype && obj.hasOwnProperty('prototype')) {
          forbidden.put(obj.prototype);
        }
      });
    }

    function unforbid(objects, withPrototype) {
      objects.forEach(function (obj) {
        forbidden.remove(obj);
        if (withPrototype && obj.hasOwnProperty('prototype')) {
          forbidden.remove(obj.prototype);
        }
      });
    }

    function wrapFn(fn) {
      return function () {
        prop.dirty = true;
        var args = [].slice.call(arguments);
        fn.apply(null, args);
      };
    }

    function gs(property) {
      return function (newValue) {
        prop.dirty = true;
        if (newValue === undefined) { return prop[property]; }
        prop[property] = newValue;
        return instance;
      };
    }

    var instance = {
      analyzeObjects: analyzeObjects,

      // api that changes the state of the graph
      add: wrapFn(add),
      forbid: wrapFn(forbid),
      remove: wrapFn(remove),
      unforbid: unforbid,

      // getters and setters
      levels: gs('levels'),
      dirty: gs('dirty'),

      // template
      preRender: function () {},
      
      getProperties: getProperties,
      getObjects: function () {
        return objectMap;
      },
      getLinks: function () {
        var links = {};
        _.forOwn(objectMap, function (v, k) {
          links[k] = getOwnLinks(v).map(function (link) {
            return hashKey(link.to);
          });
        });
        return links;
      },
      getLinkDetails: function (obj) {
        if (!obj) {
          throw new Error('The object must be defined');
        }
        return getOwnLinks(obj);
      }
    };

    return instance;
  }

  return wrap;
});