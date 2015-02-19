/**
 * Created by mauricio on 2/17/15.
 */
/*jshint loopfunc: true */
var expect = require('chai').expect;
var Q = require('q');
var pojoviz = require('../../src/');
var utils = pojoviz.utils;
global.pojoviz = pojoviz;
pojoviz.draw = require('../../src/renderer/draw');

describe('Known configuration schemas', function () {
  it('should be processed without errors', function (done) {
    this.timeout(3 * 60 * 1000);

    // avoid CustomEvent error, to be fixed in PhantomJS 2
    utils.notification = function () {};

    var promises = [];

    var schemas = [{
      label: 'Object',
      displayName: 'object'
    }, {
      label: 'BuiltIn Objects',
      displayName: 'builtIn'
    }, {
      entryPoint: 'pojoviz'
    }, {
      src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js',
      entryPoint: 'jQuery'
    }, {
      src: '//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular.js',
      entryPoint: 'angular',
      label: 'Angular JS'
    }];

    schemas.forEach(function (cfg) {
      cfg.debug = true;
      promises.push(
        pojoviz.setCurrentInspector(cfg)
          .then(function () {
            console.time('process');
            console.log('processing: ', cfg.displayName || cfg.entryPoint);
            pojoviz.draw.process(pojoviz.getCurrentInspector());
            console.timeEnd('process');
          })
      );
    });

    Q.all(promises)
      .then(function () {
        done();
      })
      .done(null, done);
  });
});

module.exports = pojoviz;