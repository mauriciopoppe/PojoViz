const expect = require('chai').expect
const utils = require('../src/util/')
const lb = require('../src/util/labeler')
const hk = require('../src/util/hashKey')

describe('labeler', function () {
  let nested

  beforeEach(function () {
    nested = {
      object: {},
      fn: function () {},
      number: 1,
      string: '',
      nullValue: null,
      undefinedValue: undefined
    }
  })

  it('should generate a label for an object', function () {
    const label = lb(nested, 'object')
    expect(lb.has(nested.object)).equals(true)
    expect(label.size()).equals(1)
    expect(label.first()).deep.equals({
      from: hk(nested),
      label: 'object'
    })
  })

  it('should generate one label per source', function () {
    lb(nested, 'object')
    lb(nested, 'object')
    lb(nested, 'object')
    expect(lb(nested, 'object').size()).equals(1)
  })

  it('should not generate labels on primitive values', function () {
    expect(lb(nested, 'number').size()).equals(0)
    expect(lb(nested, 'string').size()).equals(0)
  })

  it('should generate an overriden label', function () {
    expect(lb(nested, 'object', { labelOverride: 'mauricio' }).first())
      .deep.equals({
        from: hk(nested),
        label: 'mauricio'
      })
  })

  it("should set {value}.prototype on any function's prototype", function () {
    function A () {}
    expect(lb(A, 'prototype').first())
      .deep.equals({
        from: hk(A),
        label: 'A.prototype'
      })
  })

  it('should store a label per source', function () {
    const common = {}
    const a = { common }
    const b = { random: { nested: common } }
    lb(a, 'common')
    lb(a, 'common')
    lb(b.random, 'nested')
    const label = lb(b.random, 'nested')
    expect(label.size()).equals(2)
    expect(label.getValues()).deep.equals([{
      from: hk(a),
      label: 'common'
    }, {
      from: hk(b.random),
      label: 'nested'
    }])
  })

  it('should store many labels per source if an object has a link to another through many properties', function () {
    const common = {}
    const link = { a: common, b: common }
    lb(link, 'a')
    const label = lb(link, 'b')
    expect(label.size()).equals(2)
    expect(label.getValues())
      .deep.equals([{
        from: hk(link),
        label: 'a'
      }, {
        from: hk(link),
        label: 'b'
      }])
  })

  it('should push a label with a higher priority', function () {
    function A () {}
    const x = { prototype: A.prototype }
    const v = function () {}
    v.prototype = A.prototype
    lb(x, 'prototype')
    lb(v, 'prototype')
    const label = lb(A, 'prototype')
    expect(label.size()).equals(3)
    expect(label.getValues())
      .deep.equals([{
        from: hk(A),
        label: 'A.prototype'
      }, {
        from: hk(x),
        label: 'prototype'
      }, {
        from: hk(v),
        label: 'prototype'
      }])
  })

  it('should generate a label on a constructor', function () {
    function A () {}
    const x = {}
    const parent = { a: A }

    lb(parent, 'a')
    const label = lb(A)
    expect(label.size()).equals(3)
    expect(label.getValues())
      .deep.equals([{
        from: null,
        label: 'A'
      }, {
        from: hk(parent),
        label: 'a'
      }, {
        from: null,
        label: hk(A)
      }])

    expect(lb(x).size()).equals(1)
  })
})
