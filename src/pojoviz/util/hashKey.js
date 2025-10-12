import { uniqueId } from "./lodash-replacements";

import utils from "./";

let me, hashKey;
let doGet, doSet;

me = hashKey = function (v) {
  let uid = v;
  if (utils.isObjectOrFunction(v)) {
    let hasError = false;
    if (!me.has(v)) {
      hasError = doSet(v, uniqueId());
    }
    uid = doGet(v);
    if (!hasError && !me.has(v)) {
      throw Error(v + " should have a hashKey at this point :(");
    }
    return uid;
  }

  // v is a primitive
  return typeof v + "-" + uid;
};

/**
 * @private
 * Gets the stored hashkey, since there are object that might not have a chain
 * up to Object.prototype the check is done with Object.prototype.hasOwnProperty explicitly
 *
 * @param  {*} obj
 * @return {string}
 */
doGet = function (obj) {
  if (!utils.isObjectOrFunction(obj)) {
    throw new Error("obj must be an object|function");
  }
  return (
    Object.prototype.hasOwnProperty.call(obj, me.hiddenKey) && obj[me.hiddenKey]
  );
};

/**
 * @private
 * Sets a hidden key on an object, the hidden key is determined as follows:
 *
 * - null object-null
 * - numbers: number-{value}
 * - boolean: boolean-{true|false}
 * - string: string-{value}
 * - undefined undefined-undefined
 * - function: function-{id} id = _.uniqueId
 * - object: object-{id} id = _.uniqueId
 *
 * @param {*} obj The object to set the hiddenKey
 * @param {string} key The key to be set in the object
 */
doSet = function (obj, key) {
  if (!utils.isObjectOrFunction(obj)) {
    throw new Error("obj must be an object|function");
  }
  if (typeof key !== "string") {
    throw new Error("The key needs to be a valid string");
  }
  let value;
  if (!me.has(obj)) {
    value = typeof obj + "-" + key;
    try {
      Object.defineProperty(obj, me.hiddenKey, {
        value: value,
      });
    } catch (e) {
      console.error(
        `Cannot set property ${me.hiddenKey} on object, skipping it.`,
        obj,
      );
      return e;
    }
    if (!obj[me.hiddenKey]) {
      // in node setting the instruction above might not have worked
      console.warn("hashKey#doSet() setting the value on the object directly");
      obj[me.hiddenKey] = value;
    }
    if (!obj[me.hiddenKey]) {
      throw new Error("Object.defineProperty did not work!");
    }
  }
};

me.hiddenKey = "__pojovizKey__";

me.has = function (v) {
  return typeof doGet(v) === "string";
};

export default me;
