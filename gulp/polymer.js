var gulp = require('gulp');
var vulcanize = require('gulp-vulcanize');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var assert = require('assert');
var path = require('path');

module.exports = function (options) {
  options = options || {};

  var input = options.input || path.join(options.project, 'index.html');
  var name = options.outputName || 'index.html';
  var outputDir = options.outputDir || options.dist;
  var output = path.join(outputDir, name);

  // renames a file
  gulp.task('polymer:rename', function () {
    return gulp.src(input)
      .pipe(rename(name))
      .pipe(gulp.dest(outputDir));
  });

  gulp.task('polymer:build', ['polymer:rename'], function () {
    var assets = useref.assets();
    return gulp.src(output)
      .pipe(assets)
      .pipe(gulpif('*.js', uglify()))
      .pipe(assets.restore())
      .pipe(useref())
      .pipe(gulp.dest(outputDir));
  });

  gulp.task('polymer', ['polymer:build'], function () {
    return gulp.src(output)
      .pipe(vulcanize({
        dest: output,
      }))
      .pipe(gulp.dest(outputDir));
  });
};