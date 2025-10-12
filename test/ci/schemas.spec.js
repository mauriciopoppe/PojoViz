/**
 * Created by mauricio on 2/17/15.
 */
/* jshint loopfunc: true */
const expect = require('chai').expect
const Q = require('q')
const pojoviz = require('../../src/')
const utils = pojoviz.utils
global.pojoviz = pojoviz
pojoviz.draw = require('../../src/renderer/draw')

describe('Known configuration schemas', function () {
  it('should be processed without errors', function (done) {
    this.timeout(3 * 60 * 1000)

    // avoid CustomEvent error, to be fixed in PhantomJS 2
    utils.notification = function () {}

    const promises = []

    const schemas = [{
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
    }]

    schemas.forEach(function (cfg) {
      cfg.debug = false
      let promise
      const inspector = pojoviz.getInspectorFromOptions(cfg)
      inspector.debug = false
      promise = pojoviz
        .run(cfg)
        .then(function () {
          console.time('process')
          console.log('processing: ', cfg.displayName || cfg.entryPoint)
          pojoviz.draw.process(pojoviz.getCurrentInspector())
          console.timeEnd('process')
        })
      promises.push(promise)
    })

    Q.all(promises)
      .then(function () {
        done()
      })
      .done(null, done)
  })
})

module.exports = pojoviz
