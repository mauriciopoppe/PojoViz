// libs
var browserSync = require('browser-sync');
var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var exec = require('child_process').exec;
var pkg = require('./package.json');
var path = require('path');

// gulp extras
var gulp = require('gulp');
var git = require('gulp-git');
var compass = require('gulp-compass');
var concat = require('gulp-concat');
var jsdoc = require('gulp-jsdoc');
var bump = require('gulp-bump');
var filter = require('gulp-filter');
var tagVersion = require('gulp-tag-version');
var useWatchify;

function run(bundler, minify) {
  if (minify) {
    bundler = bundler.plugin('minifyify', {
      map: pkg.name + '.map.json',
      output: './dist/' + pkg.name + '.map.json'
    });
  }

  console.time('build');
  return bundler
    .bundle({
      debug: true,
      standalone: pkg.name
    })
    .pipe(source(pkg.name + (minify ? '.min' : '') + '.js'))
    .pipe(gulp.dest('./dist/'))
    .on('end', function () {
      console.timeEnd('build');
    });
}

gulp.task('browserify', function () {
  var method = useWatchify ? watchify : browserify;

  var bundler = method({
    entries: ['./src/index.js'],
    extensions: ['js']
  });

  var bundle = function () {
    if (!useWatchify) {
      // concat + min
      run(bundler, true);
    }
    // concat
    return run(bundler);
  };

  if (useWatchify) {
    bundler.on('update', bundle);
  }

  return bundle();
});

gulp.task('browserSync', ['browserify'], function () {
  browserSync.init(['./examples/**/*'], {
    server: {
      baseDir: '.'
    }
  });
});

gulp.task('docs', function(){
  return gulp.src('./src/**/*.js')
    .pipe(jsdoc('./docs/api'));
});

gulp.task('compass', function () {
  gulp.src(['./docs/**/*.scss'])
    .pipe(compass({
      // project: path.join(__dirname, 'docs/'),
      css: './docs/css',
      sass: './docs/sass'
    }));
});

function createTag(type, cb) {
  gulp.src(['./package.json', './bower.json'])
    .pipe(bump({ type: type }))
    .pipe(gulp.dest('./'))
    .pipe(git.commit('bump version'))
    .pipe(filter('package.json'))
    .pipe(tagVersion());

  exec('./push.sh', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

gulp.task('useWatchify', function () {
  useWatchify = true;
});

gulp.task('watch', ['useWatchify', 'browserSync'], function () {
  gulp.watch('./docs/**/*.scss', ['compass']);
});

// main tasks
gulp.task('build', ['browserify', 'compass', 'docs']);

gulp.task('release.major', function (cb) { createTag('major', cb); });
gulp.task('release.minor', function (cb) { createTag('minor', cb); });
gulp.task('release.patch', function (cb) { createTag('patch', cb); });

gulp.task('default', ['watch']);