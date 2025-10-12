const expect = require('chai').expect
const _ = require('lodash')
const hashKey = require('../src/util/hashKey')
const labeler = require('../src/util/labeler')
const ObjectAnalyzer = require('../src/ObjectAnalyzer')
const utils = require('../src/util/')

// NOTE: objects.keys.shim does not exist in the browser
delete Object.keys.shim

describe('ObjectAnalyzer', function () {
  describe('constructor', function () {
    // todo: create better constructor tests
    it('sets all default properties', function () {
      const instance = new ObjectAnalyzer()
      expect(instance.getItems()).be.a('object')
      expect(instance.getForbidden()).be.a('object')
    })
  })

  describe('during api test', function () {
    let analyzer

    beforeEach(function () {
      analyzer = new ObjectAnalyzer()
    })

    it('should forbid objects when forbid(obj) is called', function () {
      function A () {}
      analyzer.forbid([A])
      expect(_.size(analyzer.getForbidden())).to.equal(1)
      expect(_.size(analyzer.getItems())).to.equal(0)
    })

    it('should forbid with prototype when forbid(obj,true) is called', function () {
      function A () {}
      analyzer.forbid([A], true)
      expect(_.size(analyzer.getForbidden())).to.equal(2)
      expect(_.size(analyzer.getItems())).to.equal(0)
    })

    it('should store 4 objects when add is called with [Object]', function () {
      analyzer.add([Object])
      expect(_.size(analyzer.getForbidden())).to.equal(0)
      // Object
      //   + Function.prototype
      //     + Function
      // Object.prototype
      expect(_.size(analyzer.getItems())).to.equal(4)
    })

    it('should store the objects in the getItems() HashMap', function () {
      analyzer.add([Object])
      expect(analyzer.getItems()[hashKey(Object)]).to.equal(Object)
      expect(analyzer.getItems()[hashKey(Object.prototype)]).to.equal(Object.prototype)
      expect(analyzer.getItems()[hashKey(Function)]).to.equal(Function)
      expect(analyzer.getItems()[hashKey(Function.prototype)]).to.equal(Function.prototype)
    })

    it('should not store forbidden objects', function () {
      analyzer = new ObjectAnalyzer()
      analyzer.forbid([Object])
      analyzer.add([Object])
      expect(_.size(analyzer.getForbidden())).to.equal(1)
      expect(_.size(analyzer.getItems())).to.equal(0)

      analyzer = new ObjectAnalyzer()
      analyzer.forbid([Object.prototype])
      analyzer.add([Object])
      expect(_.size(analyzer.getForbidden())).to.equal(1)
      expect(_.size(analyzer.getItems())).to.equal(3)

      analyzer = new ObjectAnalyzer()
      analyzer.forbid([Object.prototype, Function])
      analyzer.add([Object])
      expect(_.size(analyzer.getForbidden())).to.equal(2)
      expect(_.size(analyzer.getItems())).to.equal(2)

      analyzer = new ObjectAnalyzer()
      analyzer.forbid([Object.prototype, Function, Function.prototype])
      analyzer.add([Object])
      expect(_.size(analyzer.getForbidden())).to.equal(3)
      expect(_.size(analyzer.getItems())).to.equal(1)
    })

    it('should not store an object that is unreachable', function () {
      analyzer.forbid([Function.prototype])
      analyzer.add([Object])
      expect(_.size(analyzer.getForbidden())).to.equal(1)
      expect(_.size(analyzer.getItems())).to.equal(2)
    })

    it('should not save the same hash for different objects with the same name', function () {
      analyzer.forbid([Object.prototype, Function, Function.prototype, Object])
      const a = {
        a: {
          common: {}
        }
      }
      const b = {
        b: {
          common: {}
        }
      }
      analyzer.add([a, b])
      expect(_.size(analyzer.getItems())).equals(6)
    })

    it('should return only objects when calling getProperties(obj, true)', function () {
      const s = analyzer.getProperties(global, true)
      expect(s).to.be.a('array')
      _(s).forOwn(function (v) {
        expect(v.isTraversable).to.be.true()
      })
    })

    it('should return an array when calling stringifyObjectProperties', function () {
      const A = function () {}
      A.Number = 1
      A.Boolean = false
      A.String = 'hi'
      A.Function = function () {}
      A.Object = {}
      A.Null = null
      A.Undefined = undefined

      function checkProperties (s, d) {
        let valid = true
        _.forOwn(s, function (value, key) {
          valid = valid && (d[key] === value)
        })
        return valid
      }
      analyzer.debug = false
      analyzer.add([A])
      const str = analyzer.stringify()
      const s = str.nodes[hashKey(A)]

      // enumerable properties are retrieved in the same order as they
      // were declared, so getOwnPropertyNames should have the same order
      expect(Object.getOwnPropertyNames(A)).deep.equals(
        ['length', 'name', 'arguments', 'caller', 'prototype',
          'Number', 'Boolean', 'String', 'Function', 'Object', 'Null', 'Undefined', hashKey.hiddenKey]
      )
      expect(_.pluck(s, 'property')).deep.equals(
        ['length', 'name', 'prototype',
          'Number', 'Boolean', 'String', 'Function', 'Object', 'Null', 'Undefined', '[[Prototype]]']
      )

      // don't need to check the first three properties since they are
      // length, name and prototype
      s.splice(0, 3)

      expect(checkProperties({
        property: 'Number',
        type: 'number',
        isTraversable: false,
        isFunction: false,
        isObject: false,
        toString: 'Number'
      }, s[0])).equals(true)
      expect(checkProperties({
        property: 'Boolean',
        type: 'boolean',
        isTraversable: false,
        isFunction: false,
        isObject: false,
        toString: 'Boolean'
      }, s[1])).equals(true)
      expect(checkProperties({
        property: 'String',
        type: 'string',
        isTraversable: false,
        isFunction: false,
        isObject: false,
        toString: 'String'
      }, s[2])).equals(true)
      expect(checkProperties({
        property: 'Function',
        type: 'function',
        // not traversable since it's a simple function
        isTraversable: false,
        isFunction: true,
        isObject: false,
        toString: 'Function'
      }, s[3])).equals(true)
      expect(checkProperties({
        property: 'Object',
        type: 'object',
        isTraversable: true,
        isFunction: false,
        isObject: true,
        toString: 'Object'
      }, s[4])).equals(true)
      expect(checkProperties({
        property: 'Null',
        type: 'object',
        isTraversable: false,
        isFunction: false,
        isObject: false,
        toString: 'Null'
      }, s[5])).equals(true)
      expect(checkProperties({
        property: 'Undefined',
        type: 'undefined',
        isTraversable: false,
        isFunction: false,
        isObject: false,
        toString: 'Undefined'
      }, s[6])).equals(true)
      expect(checkProperties({
        property: '[[Prototype]]',
        type: 'function',
        isTraversable: true,
        isFunction: true,
        isObject: false,
        toString: 'Function'
      }, s[7])).equals(true)
    })

    it('should have the correct values for an object', function () {
      const t1 = {
        aString: 'hello world',
        aNumber: 1,
        aBoolean: true,
        aNull: null,
        aUndefined: undefined,
        aError: new Error(),
        aObject: {},
        aFunction: function () {
        }
      }

      function A () {
      }

      function check (target) {
        analyzer.debug = false
        analyzer.add([target])
        const nodes = analyzer.stringify().nodes
        const arr = nodes[hashKey(target)]
        // console.log(arr);
        expect(arr).to.be.a('array')
        _(arr).forEach(function (v) {
          if (v.hidden) {
            return
          }
          const to = target[v.property]
          const toType = typeof to

          expect(toType).to.equal(v.type)
          if (to && (toType === 'object' || toType === 'function')) {
            expect(v.isTraversable).to.be.true()
          } else {
            expect(v.isTraversable).to.be.false()
          }
        })
      }

      check(t1)
      check(A)
    })
  })

  describe('stringify', function () {
    const functionObject = hashKey(Object)
    const objectObjectPrototype = hashKey(Object.prototype)
    const functionFunction = hashKey(Function)
    const functionFunctionPrototype = hashKey(Function.prototype)
    const analyzer = new ObjectAnalyzer()
    analyzer.debug = false
    analyzer.add([Object])
    const s = analyzer.stringify()

    it('should return an array representation per node', function () {
      const nodes = s.nodes
      expect(_(nodes).size()).to.equal(4)
      expect(nodes[functionObject]).to.be.a('array')
      expect(nodes[objectObjectPrototype]).to.be.a('array')
      expect(nodes[functionFunction]).to.be.a('array')
      expect(nodes[functionFunctionPrototype]).to.be.a('array')
    })

    it('should return the correct representation for function-Object', function () {
      // analyzing Object
      expect(s.edges[functionObject]).deep.equals([{
        from: functionObject,
        to: objectObjectPrototype,
        property: 'prototype'
      }, {
        from: functionObject,
        to: functionFunctionPrototype,
        property: '[[Prototype]]'
      }])
    })

    it('should return the correct representation for object-Object-prototype', function () {
      // analyzing Object-prototype
      expect(s.edges[objectObjectPrototype]).deep.equals([{
        from: objectObjectPrototype,
        to: functionObject,
        property: 'constructor'
      }])
    })

    it('should return the correct representation for function-Function-prototype', function () {
      // analyzing function-Function-prototype
      expect(s.edges[functionFunctionPrototype]).deep.equals([{
        from: functionFunctionPrototype,
        to: functionFunction,
        property: 'constructor'
      }, {
        from: functionFunctionPrototype,
        to: objectObjectPrototype,
        property: '[[Prototype]]'
      }])
    })

    it('should return the correct representation for object-Object-prototype', function () {
      // analyzing function-Function
      expect(s.edges[functionFunction]).deep.equals([{
        from: functionFunction,
        to: functionFunctionPrototype,
        property: 'prototype'
      }, {
        from: functionFunction,
        to: functionFunctionPrototype,
        property: '[[Prototype]]'
      }])
    })

    it('should stringify the edges of a node', function () {
      analyzer.add([Object])
      const links = analyzer.stringifyObjectLinks(Object)
      const first = links[0]
      // properties: from, to, property
      expect(_.size(first)).equals(3)
      expect(first.to).to.be.a('string')
      expect(first.from).to.be.a('string')
      expect(first.property).to.be.a('string')
      // isTraversable Object.prototype
      expect(
        utils.isTraversable(Object[first.property])
      ).equals(true)
    })
  })
})
