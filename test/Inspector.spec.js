/**
 * Created by mauricio on 2/15/15.
 */
var expect = require('chai').expect;
var _ = require('lodash');
var Inspector = require('../src/analyzer/Inspector');
var utils = require('../src/util/');

var BuiltIn = require('../src/analyzer/BuiltIn');
var PObject = require('../src/analyzer/Object');

require('../src/InspectedInstances');

describe('Inspector', function () {
  describe('with predefined instances', function () {
    it('inspects the basic objects', function (done) {
      var inspector = new PObject();
      inspector.init();
      setTimeout(function () {
        expect(_.size(inspector.analyzer.items)).equals(4);
        done();
      }, 1);
    });

    it('inspects the builtIn objects', function (done) {
      var inspector = new BuiltIn();
      inspector.init();

      var length = 0;
      inspector.getItems().forEach(function (v) {
        if (typeof v === 'function') {
          length += 2;
        } else {
          length += 1;
        }
      });

      setTimeout(function () {
        expect(_.size(inspector.analyzer.items) >= length).equals(true);
        done();
      }, 1);
    });
  });

  it('inspect a simple object including builtIn objects', function () {
    global.x = {};
    var inspector = new Inspector({
      entryPoint: 'x',
      forbiddenTokens: ''
    });
    inspector.init()
      .then(function () {
        expect(_.size(inspector.analyzer.items)).equals(4);
      });
  });

  it('inspect a simple object avoiding the Object.prototype link', function () {
    global.x = {};
    var inspector = new Inspector({
      entryPoint: 'x',
      forbiddenTokens: null
    });
    inspector.analyzer.forbid([Object.prototype]);
    inspector.init()
      .then(function () {
        expect(_.size(inspector.analyzer.items)).equals(1);
      });
  });

  it('inspects a simple object avoiding the builtIn objects', function (done) {
    global.x = {};
    var inspector = new Inspector({
      //debug: true,
      entryPoint: 'x',
      forbiddenTokens: 'pojoviz:builtIn'
    });
    inspector.init();
    setTimeout(function () {
      expect(_.size(inspector.analyzer.items)).equals(1);
      done();
    }, 1);
  });

  it('inspects a simple object avoiding the objects that are forbidden by default', function (done) {
    global.x = {};
    var inspector = new Inspector({
      //debug: true,
      entryPoint: 'x'
    });
    inspector.init();
    setTimeout(function () {
      expect(_.size(inspector.analyzer.items)).equals(1);
      done();
    }, 1);
  });
});