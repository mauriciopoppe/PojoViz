var gulp = require('gulp');
var mocha = require('gulp-mocha');
var git = require('gulp-git');
var compass = require('gulp-compass');

var reload = require('browser-sync').reload;
var assert = require('assert');
var path = require('path');

module.exports = function (options) {
  options = options || {};
  assert(options.project);

  var src = path.join(options.project, 'sass/*.scss');
  var dest = path.join(options.project, 'css');
  var project = path.resolve(__dirname, '../', options.project);

  gulp.task('compass', function () {
    return gulp.src(src)
      .pipe(compass({
        project: project,
        css: 'css',
        sass: 'sass'
      }))
      .on('error', function (e) {
        console.log(e);
        this.emit('end');
      })
      .pipe(gulp.dest(dest))
      .pipe(reload({stream: true}));
  });

  gulp.task('watch:compass', function () {
    return gulp.watch(path.join(options.project, 'sass/**'), ['compass']);
  });
};
