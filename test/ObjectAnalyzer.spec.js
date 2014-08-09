var expect = require('chai').expect,
  _ = require('lodash'),
  hashKey = require('../src/util/hashKey'),
  ObjectAnalyzer = require('../src/ObjectAnalyzer');

describe('ObjectAnalyzer', function () {
  describe('constructor', function () {
    it('sets all default properties', function () {
      var instance = new ObjectAnalyzer();
      expect(instance.objects).to.be.a('object');
      expect(instance.forbidden).to.be.a('object');
    });
  });

  describe('api test', function () {
    var wrap;

    beforeEach(function () {
      wrap = new ObjectAnalyzer();
    });

    it('should forbid objects when forbid(obj) is called', function () {
      function A(){}
      wrap.forbid([A]);
      expect(_.size(wrap.forbidden)).to.equal(1);
      expect(_.size(wrap.objects)).to.equal(0);
    });

    it('should forbid with prototype when forbid(obj,true) ' +
        'is called', function () {
      function A(){}
      wrap.forbid([A], true);
      expect(_.size(wrap.forbidden)).to.equal(2);
      expect(_.size(wrap.objects)).to.equal(0);
    });

    it('should store at least 4 objects when add is called', function () {
      wrap.add([Object]);
      expect(_.size(wrap.forbidden)).to.equal(0);
      // Object
      //   + Function.prototype
      //     + Function
      // Object.prototype
      expect(_.size(wrap.objects)).to.equal(4);
    });

    it('should store the objects correctly', function () {
      wrap.add([Object]);
      expect(wrap.objects['function-Object']).to.equal(Object);
      expect(wrap.objects['object-Object-prototype']).to.equal(Object.prototype);
      expect(wrap.objects['function-Function']).to.equal(Function);
      expect(wrap.objects['function-Function-prototype']).to.equal(Function.prototype);
      expect(wrap.objects['object-Function-prototype']).to.not.be.ok;
    });

    it('should not store forbidden objects', function () {
      wrap = new ObjectAnalyzer();
      wrap.forbid([Object]);
      wrap.add([Object]);
      expect(_.size(wrap.forbidden)).to.equal(1);
      expect(_.size(wrap.objects)).to.equal(0);

      wrap = new ObjectAnalyzer();
      wrap.forbid([Object.prototype]);
      wrap.add([Object]);
      expect(_.size(wrap.forbidden)).to.equal(1);
      expect(_.size(wrap.objects)).to.equal(3);

      wrap = new ObjectAnalyzer();
      wrap.forbid([Object.prototype, Function]);
      wrap.add([Object]);
      expect(_.size(wrap.forbidden)).to.equal(2);
      expect(_.size(wrap.objects)).to.equal(2);

      wrap = new ObjectAnalyzer();
      wrap.forbid([Object.prototype, Function, Function.prototype]);
      wrap.add([Object]);
      expect(_.size(wrap.forbidden)).to.equal(3);
      expect(_.size(wrap.objects)).to.equal(1);
    });

    it('should not store an object that is unreachable', function () {
      wrap.forbid([Function.prototype]);
      wrap.add([Object]);
      expect(_.size(wrap.forbidden)).to.equal(1);
      expect(_.size(wrap.objects)).to.equal(2);
    });


    it('should return only objects when calling getProperties(obj, true)', function () {
      var s = wrap.getProperties(global, true);
      expect(s).to.be.a('array');
      _(s).forOwn(function (v) {
        expect(v.linkeable).to.be.true;
      });
    });

    it('should return an array when calling stringifyObjectProperties', function () {
      var s = wrap.stringifyObjectProperties(Object);
      expect(s).to.be.ok;
      expect(s).to.be.a('array');
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
        var arr = wrap.stringifyObjectProperties(target);
        // console.log(arr);
        expect(arr).to.be.ok;
        expect(arr).to.be.a('array');
        _(arr).forEach(function (v) {
          if (v.hidden) {
            return;
          }
          var to = target[v.name],
            toType = typeof to;

          expect(toType).to.equal(v.type);
          if (to && (toType === 'object' || toType === 'function')) {
            expect(v.linkeable).to.be.true;
          } else {
            expect(v.linkeable).to.be.false;
          }
        });
      }

      check(t1);
      check(A);
    });

    it('stringifies an analyzer', function () {
      wrap.add([Object]);
      var s = wrap.stringify(),
        nodes = s.nodes;
      expect(_(nodes).size()).to.equal(4);
      expect(nodes['function-Object']).to.be.a('array');
      expect(nodes['object-Object-prototype']).to.be.a('array');
      expect(nodes['function-Function']).to.be.a('array');
      expect(nodes['function-Function-prototype']).to.be.a('array');
    });

    it('should have the correct links for an object', function () {
      wrap.add([Object]);
      var oLinks = wrap.stringifyObjectLinks(Object),
        first = oLinks[0];
      expect(_(first).size()).to.equal(3);
      expect(first.to).to.be.a('string');
      expect(first.from).to.be.a('string');
      expect(first.property).to.be.a('string');
    });

    it('should have all the objects that the link says', function () {
      wrap.add([Object]);
      var s = wrap.stringify(),
        nodes = s.nodes,
        edges = s.edges;
      _(edges).forOwn(function (links, k) {
        links.forEach(function (link) {
          expect(nodes[link.from]).to.be.ok;
          expect(nodes[link.to]).to.be.ok;
        });
      });
    });
  });
});