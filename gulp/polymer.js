var gulp = require('gulp');
var assert = require('assert');
var exec = require('child_process').exec;

module.exports = function (options) {
  gulp.task('polymer', function (cb) {
    exec('vulcanize -o public/vulcanize.html public/index.html --csp --inline', function (err, stdout, stderr) {
      console.log(stdout);
      console.error(stderr);
      cb(err);
    });
  });
};