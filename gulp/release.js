var exec = require('child_process').exec;

var gulp = require('gulp');
var git = require('gulp-git');
var bump = require('gulp-bump');
var filter = require('gulp-filter');
var tagVersion = require('gulp-tag-version');

module.exports = function (options) {
  function createTag(type, cb) {
    gulp.src(['./package.json', './bower.json'])
      .pipe(bump({ type: type }))
      .pipe(gulp.dest('./'))
      .pipe(git.commit('bump version'))
      .pipe(filter('package.json'))
      .pipe(tagVersion())
      .on('error', function (err) {
        console.error(err);
      });

    exec('./push.sh', function (err, stdout, stderr) {
      console.log(stdout);
      console.error(stderr);
      cb(err);
    });
  }

  gulp.task('release:major', function (cb) { createTag('major', cb); });
  gulp.task('release:minor', function (cb) { createTag('minor', cb); });
  gulp.task('release:patch', function (cb) { createTag('patch', cb); });
};