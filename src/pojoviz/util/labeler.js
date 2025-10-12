import hashKey from "./hashKey";
import utils from "./";

let me, labeler;
let doInsert, doGet;

// labels per each object will be saved inside this object
const labelCache = {};

const proto = {
  first: function () {
    return this.values[0];
  },
  size: function () {
    return this.values.length;
  },
  getValues: function () {
    return this.values;
  },
};

/**
 * @param {Object} from
 * @param {string} [property]
 * @param {string} [config]
 *
 *  - config.labelOverride Overrides the property label with this value
 *  - config.highPriority {boolean} if set to true then the label will be
 *  prepended instead of being append
 *
 * @type {Function}
 */
me = labeler = function (from, property, config) {
  if (!utils.isObjectOrFunction(from)) {
    throw new Error("from needs to be an object or a function");
  }
  config = config || {};
  let obj;
  let label;

  function attempToInsert(obj, from, label) {
    if (utils.isObjectOrFunction(obj)) {
      const objHash = hashKey(obj);
      const fromHash = from ? hashKey(from) : null;
      const labelCfg = {
        from: fromHash,
        label: label,
      };
      if (!(labelCache[objHash] || []).find(item => item.from === labelCfg.from && item.label === labelCfg.label)) {
        doInsert(obj, labelCfg, config);
      }
    }
  }

  if (property) {
    obj = from[property];
    label = property;
    // if the property is `prototype` append the name of the constructor
    // this means that it has a higher priority so the item should be prepended
    if (property === "prototype" && utils.isConstructor(from)) {
      config.highPriority = true;
      label = from.name + "." + property;
    }
    attempToInsert(obj, from, label);
  } else {
    // the default label for an iterable is the hashkey
    attempToInsert(from, null, hashKey(from));

    // if it's called with the second arg === undefined then only
    // set a label if it's a constructor
    if (utils.isConstructor(from)) {
      config.highPriority = true;
      attempToInsert(from, null, from.name);
    }
  }

  return doGet(from, property);
};

me.hiddenLabel = "__pojovizLabel__";

/**
 * The object has a hidden key if it exists and is
 * an array
 * @param v
 * @returns {boolean}
 */
me.has = function (v) {
  return typeof labelCache[hashKey(v)] !== "undefined";
};

doGet = function (from, property) {
  const obj = property ? from[property] : from;
  const r = Object.create(proto);
  r.values = (utils.isObjectOrFunction(obj) && labelCache[hashKey(obj)]) || [];
  return r;
};

/**
 * @private
 * Sets a hidden key on an object, the hidden key is an array of objects,
 * each object has the following structure:
 *
 *  {
 *    from: string,
 *    label: string
 *  }
 *
 * @param {*} obj The object whose label need to be saved
 * @param {Object} properties The properties of the labels
 * @param {Object} config additional configuration options
 */
doInsert = function (obj, properties, config) {
  const hkObj = hashKey(obj);
  labelCache[hkObj] = labelCache[hkObj] || [];
  const arr = labelCache[hkObj];
  const index = config.highPriority ? 0 : arr.length;

  // label override
  if (config.labelOverride) {
    properties.label = config.labelOverride;
  }

  // insertion either at start or end
  arr.splice(index, 0, properties);
};

//me.labelCache = labelCache;
export default me;

