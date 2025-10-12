import { uniqueId } from './lodash-replacements'

import utils from './'

function doGet (obj) {
  if (!utils.isObjectOrFunction(obj)) {
    throw new Error('obj must be an object|function')
  }
  return (
    Object.prototype.hasOwnProperty.call(obj, hashKey.hiddenKey) && obj[hashKey.hiddenKey]
  )
}

function doSet (obj, key) {
  if (!utils.isObjectOrFunction(obj)) {
    throw new Error('obj must be an object|function')
  }
  if (typeof key !== 'string') {
    throw new Error('The key needs to be a valid string')
  }
  let value
  if (!hashKey.has(obj)) {
    value = typeof obj + '-' + key
    try {
      Object.defineProperty(obj, hashKey.hiddenKey, {
        value
      })
    } catch (e) {
      console.error(
        `Cannot set property ${hashKey.hiddenKey} on object, skipping it.`,
        obj
      )
      return e
    }
    if (!obj[hashKey.hiddenKey]) {
      // in node setting the instruction above might not have worked
      console.warn('hashKey#doSet() setting the value on the object directly')
      obj[hashKey.hiddenKey] = value
    }
    if (!obj[hashKey.hiddenKey]) {
      throw new Error('Object.defineProperty did not work!')
    }
  }
}

function hashKey (v) {
  let uid = v
  if (utils.isObjectOrFunction(v)) {
    let hasError = false
    if (!hashKey.has(v)) {
      hasError = doSet(v, uniqueId())
    }
    uid = doGet(v)
    if (!hasError && !hashKey.has(v)) {
      throw Error(v + ' should have a hashKey at this point :(')
    }
    return uid
  }

  // v is a primitive
  return typeof v + '-' + uid
}

hashKey.hiddenKey = '__pojovizKey__'

hashKey.has = function (v) {
  return typeof doGet(v) === 'string'
}

export default hashKey
