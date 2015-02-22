var expect = require('chai').expect;
var _ = require('lodash');
var hashKey = require('../src/util/hashKey');
var ObjectAnalyzer = require('../src/ObjectAnalyzer');
var utils = require('../src/util/');
var hk = hashKey;

// NOTE: objects.keys.shim does not exist in the browser
delete Object.keys.shim;

describe('ObjectAnalyzer', function () {
  describe('constructor', function () {

    // todo: create better constructor tests
    it('sets all default properties', function () {
      var instance = new ObjectAnalyzer();
      expect(instance.items).be.a('object');
      expect(instance.forbidden).be.a('object');
    });
  });

  describe('during api test', function () {
    var analyzer;

    beforeEach(function () {
      analyzer = new ObjectAnalyzer();
    });

    it('should forbid objects when forbid(obj) is called', function () {
      function A(){}
      analyzer.forbid([A]);
      expect(_.size(analyzer.forbidden)).to.equal(1);
      expect(_.size(analyzer.items)).to.equal(0);
    });

    it('should forbid with prototype when forbid(obj,true) ' +
        'is called', function () {
      function A(){}
      analyzer.forbid([A], true);
      expect(_.size(analyzer.forbidden)).to.equal(2);
      expect(_.size(analyzer.items)).to.equal(0);
    });

    it('should store 4 objects when add is called with [Object]', function () {
      analyzer.add([Object]);
      expect(_.size(analyzer.forbidden)).to.equal(0);
      // Object
      //   + Function.prototype
      //     + Function
      // Object.prototype
      expect(_.size(analyzer.items)).to.equal(4);
    });

    xit('should store the objects in the items HashMap', function () {
      analyzer.add([Object]);
      expect(analyzer.items['function-Object']).to.equal(Object);
      expect(analyzer.items['object-Object-prototype']).to.equal(Object.prototype);
      expect(analyzer.items['function-Function']).to.equal(Function);
      expect(analyzer.items['function-Function-prototype']).to.equal(Function.prototype);
      expect(analyzer.items['object-Function-prototype']).equals(undefined);
    });

    it('should not store forbidden objects', function () {
      analyzer = new ObjectAnalyzer();
      analyzer.forbid([Object]);
      analyzer.add([Object]);
      expect(_.size(analyzer.forbidden)).to.equal(1);
      expect(_.size(analyzer.items)).to.equal(0);

      analyzer = new ObjectAnalyzer();
      analyzer.forbid([Object.prototype]);
      analyzer.add([Object]);
      expect(_.size(analyzer.forbidden)).to.equal(1);
      expect(_.size(analyzer.items)).to.equal(3);

      analyzer = new ObjectAnalyzer();
      analyzer.forbid([Object.prototype, Function]);
      analyzer.add([Object]);
      expect(_.size(analyzer.forbidden)).to.equal(2);
      expect(_.size(analyzer.items)).to.equal(2);

      analyzer = new ObjectAnalyzer();
      analyzer.forbid([Object.prototype, Function, Function.prototype]);
      analyzer.add([Object]);
      expect(_.size(analyzer.forbidden)).to.equal(3);
      expect(_.size(analyzer.items)).to.equal(1);
    });

    it('should not store an object that is unreachable', function () {
      analyzer.forbid([Function.prototype]);
      analyzer.add([Object]);
      expect(_.size(analyzer.forbidden)).to.equal(1);
      expect(_.size(analyzer.items)).to.equal(2);
    });

    it('should not save the same hash for different objects with the same name', function () {
      analyzer.forbid([Object.prototype, Function, Function.prototype, Object]);
      var a = {
        a: {
          common: {}
        }
      };
      var b = {
        b: {
          common: {}
        }
      };
      analyzer.add([a, b]);
      expect(_.size(analyzer.items)).equals(6);
    });

    it('should return only objects when calling getProperties(obj, true)', function () {
      var s = analyzer.getProperties(global, true);
      expect(s).to.be.a('array');
      _(s).forOwn(function (v) {
        expect(v.isTraversable).to.be.true();
      });
    });

    it('should return an array when calling stringifyObjectProperties', function () {
      var obj = {};
      obj.Number = 1;
      obj.Boolean = false;
      obj.String = "hi";
      obj.Function = function () {};
      obj.Object = {};
      obj.Null = null;
      obj.Undefined = undefined;

      function checkProperties(s, d) {
        var valid = true;
        _.forOwn(s, function (value, key) {
          valid = valid && (d[key] === value);
        });
        return valid;
      }

      var s = analyzer.stringifyObjectProperties(obj);

      // enumerable properties are retrieved in the same order as they
      // were declared, so getOwnPropertyNames should have the same order
      expect(Object.getOwnPropertyNames(obj)).deep.equals(
        ['Number', 'Boolean', 'String', 'Function', 'Object', 'Null', 'Undefined', hashKey.hiddenKey]
      );
      expect(_.pluck(s, 'property')).deep.equals(
        ['Number', 'Boolean', 'String', 'Function', 'Object', 'Null', 'Undefined', '[[Prototype]]']
      );
      expect(checkProperties({
        property: 'Number',
        type: 'number',
        isTraversable: false,
        isFunction: false,
        isObject: false,
        toString: 'Number'
      }, s[0])).equals(true);
      expect(checkProperties({
        property: 'Boolean',
        type: 'boolean',
        isTraversable: false,
        isFunction: false,
        isObject: false,
        toString: 'Boolean'
      }, s[1])).equals(true);
      expect(checkProperties({
        property: 'String',
        type: 'string',
        isTraversable: false,
        isFunction: false,
        isObject: false,
        toString: 'String'
      }, s[2])).equals(true);
      expect(checkProperties({
        property: 'Function',
        type: 'function',
        // not traversable since it's a simple function
        isTraversable: false,
        isFunction: true,
        isObject: false,
        toString: 'Function'
      }, s[3])).equals(true);
      expect(checkProperties({
        property: 'Object',
        type: 'object',
        isTraversable: true,
        isFunction: false,
        isObject: true,
        toString: 'Object'
      }, s[4])).equals(true);
      expect(checkProperties({
        property: 'Null',
        type: 'object',
        isTraversable: false,
        isFunction: false,
        isObject: false,
        toString: 'Null'
      }, s[5])).equals(true);
      expect(checkProperties({
        property: 'Undefined',
        type: 'undefined',
        isTraversable: false,
        isFunction: false,
        isObject: false,
        toString: 'Undefined'
      }, s[6])).equals(true);
      expect(checkProperties({
        property: '[[Prototype]]',
        type: 'object',
        isTraversable: true,
        isFunction: false,
        isObject: true,
        toString: 'Object'
      }, s[7])).equals(true);
    });

    it('should have the correct values for an object', function () {
      var t1 = {
        aString: 'hello world',
        aNumber: 1,
        aBoolean: true,
        aNull: null,
        aUndefined: undefined,
        aError: new Error(),
        aObject: {},
        aFunction: function () {}
      };
      function A(){}

      function check(target) {
        var arr = analyzer.stringifyObjectProperties(target);
        // console.log(arr);
        expect(arr).to.be.a('array');
        _(arr).forEach(function (v) {
          if (v.hidden) {
            return;
          }
          var to = target[v.property],
            toType = typeof to;

          expect(toType).to.equal(v.type);
          if (to && (toType === 'object' || toType === 'function')) {
            expect(v.isTraversable).to.be.true();
          } else {
            expect(v.isTraversable).to.be.false();
          }
        });
      }

      check(t1);
      check(A);
    });

    xit('should return a string representation of the analyzer when `stringify` is called', function () {
      analyzer.debug = false;
      analyzer.add([Object]);
      var s = analyzer.stringify();
      var nodes = s.nodes;
      expect(_(nodes).size()).to.equal(4);
      expect(nodes['function-Object']).to.be.a('array');
      expect(nodes['object-Object-prototype']).to.be.a('array');
      expect(nodes['function-Function']).to.be.a('array');
      expect(nodes['function-Function-prototype']).to.be.a('array');

      // analyzing Object
      expect(s.edges['function-Object']).deep.equals([{
        from: 'function-Object',
        to: 'object-Object-prototype',
        property: 'prototype'
      }, {
        from: 'function-Object',
        to: 'function-Function-prototype',
        property: '[[Prototype]]'
      }]);

      // analyzing Object-prototype
      expect(s.edges['object-Object-prototype']).deep.equals([{
        from: 'object-Object-prototype',
        to: 'function-Object',
        property: 'constructor'
      }]);

      // analyzing function-Function-prototype
      expect(s.edges['function-Function-prototype']).deep.equals([{
        from: 'function-Function-prototype',
        to: 'function-Function',
        property: 'constructor'
      }, {
        from: 'function-Function-prototype',
        to: 'object-Object-prototype',
        property: '[[Prototype]]'
      }]);

      // analyzing function-Function
      expect(s.edges['function-Function']).deep.equals([{
        from: 'function-Function',
        to: 'function-Function-prototype',
        property: 'prototype'
      }, {
        from: 'function-Function',
        to: 'function-Function-prototype',
        property: '[[Prototype]]'
      }]);
    });

    it('should stringify the edges of a node', function () {
      analyzer.add([Object]);
      var links = analyzer.stringifyObjectLinks(Object);
      var first = links[0];
      // properties: from, to, property
      expect(_.size(first)).equals(3);
      expect(first.to).to.be.a('string');
      expect(first.from).to.be.a('string');
      expect(first.property).to.be.a('string');
      expect(
        utils.isTraversable(Object[first.property])
      ).equals(true);
    });
  });
});