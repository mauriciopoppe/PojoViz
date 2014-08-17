var gulp = require('gulp');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var assert = require('assert');
var path = require('path');

module.exports = function (options) {
  options = options || {};
  // main polymer file
  assert(options.project);
  assert(options.dist);

  var source = path.join(options.project, 'index.html');

  // generates a minified bundle of the
  // client side scripts
  // see https://www.npmjs.org/package/gulp-useref
  gulp.task('index:build', function () {
    var assets = useref.assets();
    return gulp.src(source)
      .pipe(assets)
      .pipe(gulpif('*.js', uglify()))
      .pipe(assets.restore())
      .pipe(useref())
      .pipe(gulp.dest(options.dist));
  });
};