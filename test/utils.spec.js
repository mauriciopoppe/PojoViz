var expect = require('chai').expect;
var utils = require('../src/util/');

describe('utilities', function () {
  it('should check if a value is a function #isFunction', function () {
    expect(utils.isFunction(1)).equals(false);
    expect(utils.isFunction('2')).equals(false);
    expect(utils.isFunction(NaN)).equals(false);
    expect(utils.isFunction(undefined)).equals(false);
    expect(utils.isFunction(null)).equals(false);
    expect(utils.isFunction(function () {})).equals(true);
    expect(utils.isFunction({})).equals(false);
  });

  it('should check if a value is an object #isObject', function () {
    expect(utils.isObject(1)).equals(false);
    expect(utils.isObject('2')).equals(false);
    expect(utils.isObject(NaN)).equals(false);
    expect(utils.isObject(undefined)).equals(false);
    expect(utils.isObject(null)).equals(false);
    expect(utils.isObject([])).equals(true);
    expect(utils.isObject(function () {})).equals(false);
    expect(utils.isObject({})).equals(true);
    expect(utils.isObject(new Date())).equals(true);
  });

  it('should create function chains #functionChain', function () {
    var fns;
    fns = utils.functionChain()
      .chain(function (a, b) {
        expect(a).equals(1);
        expect(b).equals(2);
        return 3;
      })
      .chain(function (a, b, c) {
        expect(a).equals(1);
        expect(b).equals(2);
        expect(c).equals(3);
        return 4;
      });
    expect(fns(1, 2)).equals(4);
  });

  it('should verify the validity of some properties #objectPropertyIsForbidden', function () {
    var fn = utils.objectPropertyIsForbidden;
    expect(fn({}, 'test')).equals(false);
    expect(fn({}, '__proto__')).equals(true);
    expect(fn({}, '__pojoVizKey__')).equals(true);
    expect(fn({}, 'arguments')).equals(false);
    expect(fn(function () {}, 'arguments')).equals(true);
    expect(fn(function () {}, 'caller')).equals(true);
    expect(fn({}, '$$digestCount$$')).equals(true);
  });
});