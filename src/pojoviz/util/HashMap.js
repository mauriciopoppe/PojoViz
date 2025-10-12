import hashKey from './hashKey'

class HashMap {
  put (key, value) {
    this[hashKey(key)] = value || key
  }

  get (key) {
    return this[hashKey(key)]
  }

  remove (key) {
    const v = this[hashKey(key)]
    delete this[hashKey(key)]
    return v
  }

  empty () {
    for (const p in this) {
      if (Object.prototype.hasOwnProperty.call(this, p)) {
        delete this[p]
      }
    }
  }

  set (key, value) {
    this.put(key, value)
  }
}

export default HashMap
