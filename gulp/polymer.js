var gulp = require('gulp');
var vulcanize = require('gulp-vulcanize');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var assert = require('assert');
var path = require('path');
var exec = require('child_process').exec;

module.exports = function (options) {
  gulp.task('polymer', function (cb) {
    exec('vulcanize -o ../public/vulcanize.html ../public/index.html --csp --inline', function (err, stdout, stderr) {
      console.log(stdout);
      console.error(stderr);
      cb(err);
    });
  });
};