import Inspector from './Inspector'

const toInspect = [window]

class Global extends Inspector {
  constructor () {
    super({
      analyzerConfig: {
        levels: 1,
        visitConstructors: false
      },
      alwaysDirty: true
    })
  }

  getItems () {
    return toInspect
  }

  inspectSelf () {
    const me = this
    this.debug && console.log('inspecting global')
    // var me = this,
    //  hashes = require('../InspectedInstances');
    //
    // _.forOwn(hashes, function (v, k) {
    //  if (v.getItems()) {
    //    me.analyzer.forbid([v.getItems()], true);
    //  }
    // });
    this.analyzer.getItems().empty()
    this.analyzer.add(me.getItems())
  }
}

export default Global
