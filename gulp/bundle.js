var path = require('path');
var assert = require('assert');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var _ = require('lodash');
var gulp = require('gulp');
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
  // bundle index.js file
  assert(options.src);
  // ouptut directory of the bundled file
  assert(options.build);
  assert(options.libs);

  /**
   * Bundle generator which creates production ready bundles
   * @param  {Object} local
   * @param  {Object} local.src Index file of bundle
   * @param  {Object} local.name Name of the bundle
   * @param  {Object} local.standalone True to make it standalone
   * under window[name]
   * @param  {Object} local.onPreBundle Prebundle hook
   * @return {stream}
   */
  function generateBundler(local) {
    local = _.merge({
      onPreBundle: function () {}
    }, local);

    var method = production ? browserify : watchify;
    var name = local.name;
    var bundler = method({
      entries: local.src,
      extensions: ['js']
    });

    var bundle = function () {
      // concat
      console.log('building ' + name);
      console.time('browserify ' + name);

      if (production) {
        bundler.plugin('minifyify', {
          map: name + '.map.json',
          output: path.join(options.build, name + '.map.json')
        });
      }

      // bundler options
      var bundleOptions = {
        debug: !production
      };
      if (local.standalone) {
        bundleOptions.standalone = name;
      }

      local.onPreBundle(bundler, name);

      var stream = bundler
        .bundle(bundleOptions)
        .on('error', function (e) {
          console.error(e);
        })
        .pipe(source(name + (production ? '.min' : '') + '.js'))
        .pipe(gulp.dest(options.build))
        .on('end', function () {
          console.time('browserify ' + name);
        });

      return stream;
    };

    if (!production) {
      bundler.on('update', bundle);
    }

    return bundle();
  }

  gulp.task('bundle:vendor', function () {
    return generateBundler({
      // the vendor package should not be standalone
      src: null,
      name: pkg.name + '-vendor',
      onPreBundle: function (bundler) {
        options.libs.forEach(function(lib) {
          bundler.require(lib.require, {expose: lib.expose});
        });
      }
    });
  });

  gulp.task('bundle:app', function () {
    return generateBundler({
      standalone: true,
      src: path.join(options.src, 'index.js'),
      name: pkg.name,
      onPreBundle: function (bundler) {
        options.libs.forEach(function(lib) {
          bundler.external(lib.require, {expose: lib.expose});
        });
      }
    });
  });

  gulp.task('bundle', ['bundle:app', 'bundle:vendor']);

  // export the bundler
  module.exports.bundlerGenerator = generateBundler;
};