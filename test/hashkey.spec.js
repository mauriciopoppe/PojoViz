const expect = require('chai').expect
const hk = require('../src/util/hashKey')

describe('hashKey', function () {
  it('should generate a hashKey for an object', function () {
    expect(hk({})).to.be.a('string')
  })

  it('should set an auto generated key', function () {
    expect(hk({})).to.match(/^object-\d*$/)
  })

  it('should generate the same value for multiple calls on the same object', function () {
    const obj = {}
    expect(hk(obj)).to.equal(hk(obj))
  })

  it("should not set a key on an object which doesn't inherit from Object", function () {
    const x = Object.create(null)
    hk(x)
    expect(hk(x).indexOf('object-') > -1).equals(true)
  })
})
