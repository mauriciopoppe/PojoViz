import builtInObjects from './builtInObjects'
import notableLibraries from './notableLibraries'
import myLibraries from './myLibraries'
import hugeLibraries from './hugeLibraries'

const proto = {
  find: function (entry) {
    function predicate (v) {
      return v.entryPoint === entry
    }
    let result
    for (const schema of Object.values(this)) {
      if (Array.isArray(schema)) {
        result = schema.find(predicate)
        if (result) {
          return result
        }
      }
    }
  }
}

const schemas = Object.create(proto)

Object.assign(schemas, {
  builtInObjects,
  notableLibraries,
  myLibraries,
  hugeLibraries
})

export { builtInObjects, notableLibraries, myLibraries, hugeLibraries }
export default schemas
