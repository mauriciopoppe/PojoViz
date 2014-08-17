var browserSync = require('browser-sync');
var gulp = require('gulp');
var path = require('path');
var production = process.env.NODE_ENV === 'production';

/**
 * make a little server
 * @param {Object} options
 * @param {string} options.baseDir Alternative server base dir
 */
module.exports = function (options) {
  options = options || {};
  var root = production ? options.dist :
    path.join(options.project, '..');

  gulp.task('server', function () {
    browserSync({
      server: {
        baseDir: root
      },
      // logLevel: 'debug',
      // notify: false,
      // tunnel: true
    });
  });
};