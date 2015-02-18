var gulp = require('gulp');
var mocha = require('gulp-mocha');
var assert = require('assert');
var path = require('path');
var karma = require('karma').server;

module.exports = function (options) {
  options = options || {};
  assert(options.src);
  assert(options.test);

  gulp.task('test', function () {
    return gulp.src(path.resolve(options.test, 'index.js'))
      .pipe(mocha({ reporter: 'spec' }))
      .on('error', function (err) {
        console.error(err);
        this.emit('end');
      });
  });

  gulp.task('test:ci', function (done) {
    karma.start({
      configFile: __dirname + '/../karma.conf.js',
      singleRun: true
    }, done);
  });

  gulp.task('watch:test', function () {
    gulp.watch([
      path.resolve(options.src, '**'),
      path.resolve(options.test, '**')
    ], ['test']);
  });
};