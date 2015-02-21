var gulp = require('gulp');
var path = require('path');
var _ = require('lodash');
var me = __dirname;
var pkg = require('./package.json');

var options = {
  // client side project
  self: './',
  project: 'public/',
  // server side project
  build: 'build/',
  src: 'src/',
  test: 'test/',
  // for a client side project that needs minification
  dist: 'dist/'
};
_(options).forOwn(function (v, k) {
  options[k] = path.resolve(me, v);
});
// files that are not including in the app build
options.vendor = [
  'q', 'lodash', 'dagre'
];

// tasks:
// - watch:browserify
// - browserify
require('./gulp/browserify')(options);
// tasks:
// - compass
// - watch:compass
require('./gulp/compass')(options);
// tasks:
// - server
require('./gulp/server')(options);
// tasks:
// - test
// - watch:test
require('./gulp/test')(options);
// tasks:
// - jshint
require('./gulp/linter')(options);
// tasks:
// - polymer
require('./gulp/polymer')(options);
// tasks:
// - release:major
// - release:minor
// - release:patch
require('./gulp/release')();

// main tasks
// NOTE: gulp.watch has conflicts with watchify
gulp.task('watch', ['watch:test', 'watch:compass', 'watch:browserify']);
gulp.task('default', ['watch'], function () {
  gulp.start('server');
});

gulp.task('build:page', ['compass'], function () {
  gulp.start('polymer');
});

gulp.task('build:app', ['browserify']);

// show be run with NODE_ENV=production
// to avoid calling watchify on the browserify task
gulp.task('build', ['build:app', 'build:page']);