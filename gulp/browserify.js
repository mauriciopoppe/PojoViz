/**
 * Created by mauricio on 2/18/15.
 */
var path = require('path');
var assert = require('assert');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');

var pkg = require('../package.json');
var production = process.env.NODE_ENV === 'production';

/**
 * browserify app task
 * @param  {Object} options
 * @param {Array} options.src
 * @param {string} options.output
 */
module.exports = function (options) {
  options = options || {};

  assert(options.build);

  /**
   * Bundle generator which creates production ready bundles
   *
   * @param  {Object} local
   * @param  {Object} local.src Index file of bundle
   * @param  {Object} local.name Name of the bundle
   * @param  {Object} local.standalone True to make it standalone
   * i.e. generate window[local.name]
   * @return {stream}
   */
  function generateBundler(local) {
    //local = _.merge({
    //  onPreBundle: function () {
    //  }
    //}, local);
    var name = local.name;

    var bundleOptions = {
      debug: !production,
      verbose: !production,
      entries: local.src
    };

    if (local.standalone) {
      bundleOptions.standalone = name;
    }

    var bundler;
    if (!production) {
      bundler = watchify(browserify(bundleOptions), watchify.args);
      bundler.on('update', (function (b) {
        return function () {
          bundle(b);
        };
      })(bundler));
    } else {
      bundler = browserify(bundleOptions);
    }

    // exclude vendor files
    options.vendor.forEach(function (lib) {
      bundler.exclude(lib);
    });

    function bundle(bundler) {
      return bundler.bundle()
        .on('error', gutil.log.bind(gutil, 'browserify error'))
        // turn to a stream the gulp expects
        .pipe(source(name + '.js'))
        .pipe(gulp.dest(options.build));
    }

    // initial call
    return bundle(bundler);
  }

  /**
   * Generates a vendor bundle with all the libraries under `options.vendor`
   * @returns {*}
   */
  function vendor() {
    assert(options.vendor);
    var bundle = browserify('./gulp/noop.js');

    // require vendor files
    options.vendor.forEach(function (lib) {
      bundle.require(lib);
    });

    return bundle
      .bundle()
      .pipe(source(pkg.name + '-vendor.js'))
      .pipe(buffer())
      .pipe(uglify())
      .pipe(gulp.dest(options.build));
  }

  gulp.task('browserify:vendor', vendor);

  gulp.task('browserify:renderers', function () {
    return generateBundler({
      name: 'pojoviz-renderers',
      src: './src/renderer/'
    });
  });

  gulp.task('browserify:app', function () {
    return generateBundler({
      name: 'pojoviz',
      src: './src/index.js',
      standalone: true
    });
  });

  gulp.task('browserify', ['browserify:vendor', 'browserify:app', 'browserify:renderers']);

  gulp.task('watch:browserify', ['browserify:app', 'browserify:renderers']);
};