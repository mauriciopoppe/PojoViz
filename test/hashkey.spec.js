var expect = require('chai').expect,
  hk = require('../src/util/hashKey');

describe('hashKey', function () {
  it('should generate a hashKey for an object', function () {
    expect(hk({})).to.be.a('string');
  });

  it('should set an auto generated key', function () {
    expect(hk({})).to.match(/^object-\d*$/);
  });

  it('should generate the same value for multiple calls on the same object', function () {
    var obj = {};
    expect(hk(obj)).to.equal(hk(obj));
  });

  it('should look for the name property that function/object may have', function () {
    function A(){}
    expect(hk(A)).to.equal('function-A');
  });

  it('should set the name overriden by createHashKeysFor', function () {
    function A(){}
    hk.createHashKeysFor(A, 'X');
    expect(hk(A)).to.equal('function-X');
  });

  it('should set the name on the prototype too', function () {
    function A(){}
    expect(hk(A)).to.equal('function-A');
    expect(hk(A.prototype)).to.equal('object-A-prototype');
  });

  it('should set the name on the prototype when the ' +
    'hashKey is applied on the prototype', function () {
    function A(){}
    hk(A.prototype);
    expect(hk(A.prototype)).to.equal('object-A-prototype');
    expect(hk(A)).to.equal('function-A');
  });

  it("should not set a key on an object which doesn't inherit from Object", function () {
    var x = Object.create(null);
    hk(x);
    expect(hk(x).indexOf('object-') > -1).equals(true);
  });
});