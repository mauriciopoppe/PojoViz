import hashKey from './hashKey'
import utils from './'

const labelCache = {}

const proto = {
  first: function () {
    return this.values[0]
  },
  size: function () {
    return this.values.length
  },
  getValues: function () {
    return this.values
  }
}

function doGet (from, property) {
  const obj = property ? from[property] : from
  const r = Object.create(proto)
  r.values = (utils.isObjectOrFunction(obj) && labelCache[hashKey(obj)]) || []
  return r
}

function doInsert (obj, properties, config) {
  const hkObj = hashKey(obj)
  labelCache[hkObj] = labelCache[hkObj] || []
  const arr = labelCache[hkObj]
  const index = config.highPriority ? 0 : arr.length

  // label override
  if (config.labelOverride) {
    properties.label = config.labelOverride
  }

  // insertion either at start or end
  arr.splice(index, 0, properties)
}

function labeler (from, property, config) {
  if (!utils.isObjectOrFunction(from)) {
    throw new Error('from needs to be an object or a function')
  }
  config = config || {}
  let obj
  let label

  function attempToInsert (obj, from, label) {
    if (utils.isObjectOrFunction(obj)) {
      const objHash = hashKey(obj)
      const fromHash = from ? hashKey(from) : null
      const labelCfg = {
        from: fromHash,
        label
      }
      if (!(labelCache[objHash] || []).find(item => item.from === labelCfg.from && item.label === labelCfg.label)) {
        doInsert(obj, labelCfg, config)
      }
    }
  }

  if (property) {
    obj = from[property]
    label = property
    // if the property is `prototype` append the name of the constructor
    // this means that it has a higher priority so the item should be prepended
    if (property === 'prototype' && utils.isConstructor(from)) {
      config.highPriority = true
      label = from.name + '.' + property
    }
    attempToInsert(obj, from, label)
  } else {
    // the default label for an iterable is the hashkey
    attempToInsert(from, null, hashKey(from))

    // if it's called with the second arg === undefined then only
    // set a label if it's a constructor
    if (utils.isConstructor(from)) {
      config.highPriority = true
      attempToInsert(from, null, from.name)
    }
  }

  return doGet(from, property)
}

labeler.hiddenLabel = '__pojovizLabel__'

labeler.has = function (v) {
  return typeof labelCache[hashKey(v)] !== 'undefined'
}

export default labeler
