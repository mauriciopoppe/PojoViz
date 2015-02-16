/**
 * Created by mauricio on 2/16/15.
 */
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var path = require('path');
var assert = require('assert');

module.exports = function (options) {
  options = options || {};
  assert(options.src);
  assert(options.test);
  assert(options.self);

  gulp.task('linter:jshint', function () {
    gulp.src([
      //path.resolve(options.src, '**/*.js'),
      path.resolve(options.src, '**/!(PanControls|TrackballControls)*.js'),
      path.resolve(options.test, '**/*.js')
    ])
      .pipe(jshint(path.resolve(options.self, '.jshintrc')))
      .pipe(jshint.reporter('jshint-stylish'))
      .pipe(jshint.reporter('fail'));
  });

  gulp.task('linter', ['linter:jshint']);
};