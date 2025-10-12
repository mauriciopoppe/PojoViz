const changeFakePropertyName = {
  '[[Prototype]]': '__proto__'
}

const utils = {
  translate: function (x, y) {
    return 'translate(' + (x || 0) + ', ' + (y || 0) + ')'
  },
  scale: function (s) {
    return 'scale(' + (s || 1) + ')'
  },
  transform: function (obj) {
    return Object.keys(obj)
      .map(k => utils[k].apply(utils, obj[k]))
      .join(' ')
  },
  prefixer: function () {
    const args = [].slice.call(arguments)
    args.unshift('pv')
    return args.join('-')
  },
  transformProperty: function (v) {
    if (Object.prototype.hasOwnProperty.call(changeFakePropertyName, v)) {
      return changeFakePropertyName[v]
    }
    return v
  },
  escapeCls: function (v) {
    return v.replace(/\$/g, '_')
  }
}

export default utils
