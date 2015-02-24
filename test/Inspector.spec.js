/**
 * Created by mauricio on 2/15/15.
 */
require('../src/InspectedInstances');

var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;
var _ = require('lodash');
var Inspector = require('../src/analyzer/Inspector');
var utils = require('../src/util/');

var BuiltIn = require('../src/analyzer/BuiltIn');
var PObject = require('../src/analyzer/Object');

describe('Inspector', function () {
  describe('with predefined instances', function () {
    it('inspects the basic objects', function (done) {
      var inspector = new PObject();
      inspector.init()
        .then(function () {
          expect(_.size(inspector.analyzer.getItems())).equals(4);
        })
        .done(done, done);
    });

    it('inspects the builtIn objects', function (done) {
      var inspector = new BuiltIn();

      var length = inspector.getItems().length * 2;
      inspector.getItems().forEach(function (v) {
        if (typeof v === 'object') {
          length -= 1;
        }
      });

      inspector.init()
        .then(function () {
          expect(_.size(inspector.analyzer.getItems()) >= length).equals(true);
        })
        .done(done, done);
    });
  });

  it('inspects a simple object including builtIn objects', function (done) {
    global.x = {};
    var inspector = new Inspector({
      entryPoint: 'x',
      forbiddenTokens: null
    });
    inspector.init()
      .then(function () {
        // x + object + object.prototype + function + function.prototype
        expect(_.size(inspector.analyzer.getItems())).equals(5);
      })
      .done(done, done);
  });

  it('inspects a simple object avoiding the Object.prototype link', function (done) {
    global.x = {};
    var inspector = new Inspector({
      entryPoint: 'x',
      forbiddenTokens: null
    });
    inspector.analyzer.forbid([Object.prototype]);
    inspector.init()
      .then(function () {
        expect(_.size(inspector.analyzer.getItems())).equals(1);
      })
      .done(done, done);
  });

  it('inspects a simple object avoiding the builtIn objects', function (done) {
    global.x = {};
    var inspector = new Inspector({
      //debug: true,
      entryPoint: 'x',
      forbiddenTokens: 'pojoviz:builtIn'
    });
    inspector.init()
      .then(function () {
        expect(_.size(inspector.analyzer.getItems())).equals(1);
      })
      .done(done, done);
  });

  it('inspects a simple object avoiding objects forbidden by default', function (done) {
    global.x = {};
    var inspector = new Inspector({
      //debug: true,
      entryPoint: 'x'
    });
    expect(inspector.forbiddenTokens).equals('pojoviz:global|pojoviz:builtIn|global:document');
    inspector.init()
      .then(function () {
        expect(_.size(inspector.analyzer.getItems())).equals(1);
      })
      .done(done, done);
  });

  it('inspects a simple object avoiding objects forbidden by default + additional forbidden tokens', function (done) {
    global.x = {};
    var inspector = new Inspector({
      //debug: true,
      entryPoint: 'x',
      additionalForbiddenTokens: 'global:x'
    });
    expect(inspector.forbiddenTokens).equals('pojoviz:global|pojoviz:builtIn|global:document|global:x');
    inspector.init()
      .then(function () {
        expect(_.size(inspector.analyzer.getItems())).equals(0);
      })
      .done(done, done);
  });

  it('inspects a simple object avoiding controlling the number of levels reached', function (done) {
    global.x = {};
    var inspector = new Inspector({
      entryPoint: 'x',
      forbiddenTokens: null,
      analyzerConfig: {
        levels: 0
      }
    });
    inspector.init()
      .then(function () {
        expect(_.size(inspector.analyzer.getItems())).equals(1);
      })
      .done(done, done);
  });

  it("should not analyze the same structure twice", function (done) {
    global.x = {};
    var inspector = new Inspector({
      entryPoint: 'x',
      forbiddenTokens: null
    });

    Inspector.prototype.inspectSelf = sinon.spy();

    inspector.init()
      .then(function () {
        return inspector.init();
      })
      .then(function () {
        expect(Inspector.prototype.inspectSelf.calledOnce)
          .equals(true);
      })
      .done(done, done);
  });

  it("should analyze the same structure multiple times on demand", function (done) {
    global.x = {};
    var inspector = new Inspector({
      entryPoint: 'x',
      forbiddenTokens: null,
      alwaysDirty: true
    });

    Inspector.prototype.inspectSelf = sinon.spy();

    inspector.init()
      .then(function () {
        return inspector.init();
      })
      .then(function () {
        return inspector.init();
      })
      .then(function () {
        expect(Inspector.prototype.inspectSelf.callCount)
          .equals(3);
      })
      .done(done, done);
  });

  // TODO: allow npm packages to be analyzed too
  xit('fetches external resources before performing the analysis', function (done) {
    var inspector = new Inspector({
      src: '//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.js',
      entryPoint: '_'
    });

    // disable notifications
    var notification = utils.notification;
    utils.notification = function () {};

    inspector.init()
      .then(function () {
        utils.notification = notification;
      })
      .done(done, done);
  });
});