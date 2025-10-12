import Inspector from './Inspector'

class PObject extends Inspector {
  inspectSelf () {
    this.debug && console.log('inspecting Object objects')
    this.analyzer.add(this.getItems())
    return this
  }

  getItems () {
    return [Object]
  }
}

export default PObject
