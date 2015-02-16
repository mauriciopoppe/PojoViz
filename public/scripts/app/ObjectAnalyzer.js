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
        v.match(/^\$\$.*?\$\$$/);
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

  function wrapFn(fn, wrapper) {
    return function () {
      // NOTE: `this` will be the instance
      wrapper.call(this);
      var args = [].slice.call(arguments);
      return fn.apply(this, args);
    };
  }

  function ObjectAnalizer(config) {
    if (!(this instanceof ObjectAnalizer)) {
      return new ObjectAnalizer(config);
    }
    config = config || {};

    this.objectMap = config.objectMap || new HashMap();
    this.forbidden = config.forbidden || new HashMap();
    this.levels = Infinity;
    this.dirty = true;
  }

  ObjectAnalizer.prototype = {
    constructor: ObjectAnalizer,

    isForbidden: function (obj) {
      return this.forbidden.get(obj);
    },

    analyzeObjects: function (objects, currentLevel) {
      var me = this;
      objects.forEach(function (v) {
        if (currentLevel <= me.levels &&  // dfs level
            !me.objectMap.get(v) &&            // already registered
            !me.isForbidden(v)                 // forbidden check
            ) {
          me.objectMap.put(v, v);
          me.analyzeObjects(
            me.getOwnLinks(v).map(function (link) {
              return link.to;
            }),
            currentLevel + 1
          );
        }
      });
    },

    getOwnLinks: function (obj) {
      // TODO: memoization
      var me = this,
          links = [],
          properties = getProperties(obj, true),
          name = hashKey.get(obj);

      if (!name) {
        throw 'the object needs to have a hashkey';
      }

      // function createHashKeyForLink(obj, name) {
      //   var parentName = hashKey(obj)
      //   if (hashKey.setHashKey(obj, ))
      // }
      // console.log(properties);
      _.forEach(properties, function (v) {
        var ref = obj[v.name];
        if (ref !== null &&
            ref !== undefined &&
            !me.isForbidden(ref)) {

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
      if (proto && !me.isForbidden(proto)) {
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
    },

    makeDirty: function () {
      this.dirty = true;
    },

    setLevels: function (l) {
      this.levels = l;
    },

    setDirty: function (d) {
      this.dirty = d;
    },

    getItems: function () {
      return this.objectMap;
    },

    getLinks: function () {
      var me = this,
          links = {};
      _.forOwn(this.objectMap, function (v, k) {
        links[k] = me.getOwnLinks(v).map(function (link) {
          return hashKey(link.to);
        });
      });
      return links;
    },

    getLinkDetails: function (obj) {
      if (!obj) {
        throw new Error('The object must be defined');
      }
      return this.getOwnLinks(obj);
    },

    // template
    preRender: function () {},
    getProperties: getProperties,
    showSearch: function (name, property) {
      window.open('https://duckduckgo.com/?q=' +
        name + ' ' + property);
    }
  };

  // aditional objects that need the prototype to exist
  var oaProto = ObjectAnalizer.prototype;
  _.merge(oaProto, {
    
    add: wrapFn(function (objects) {
      this.analyzeObjects(objects, 0);
      return this;
    }, oaProto.makeDirty),

    remove: wrapFn(function (objects, withPrototype) {
      var me = this;
      objects.forEach(function (obj) {
        me.objectMap.remove(obj);
        if (withPrototype && obj.hasOwnProperty('prototype')) {
          me.objectMap.remove(obj.prototype);
        }
      });
      return me;
    }, oaProto.makeDirty),

    forbid: wrapFn(function (objects, withPrototype) {
      var me = this;
      me.remove(objects, withPrototype);
      objects.forEach(function (obj) {
        me.forbidden.put(obj);
        if (withPrototype && obj.hasOwnProperty('prototype')) {
          me.forbidden.put(obj.prototype);
        }
      });
    }, oaProto.makeDirty),

    unforbid: wrapFn(function (objects, withPrototype) {
      var me = this;
      objects.forEach(function (obj) {
        me.forbidden.remove(obj);
        if (withPrototype && obj.hasOwnProperty('prototype')) {
          me.forbidden.remove(obj.prototype);
        }
      });
    }, oaProto.makeDirty)
  });
  return ObjectAnalizer;
});