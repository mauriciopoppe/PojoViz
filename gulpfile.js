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
var bump = require('gulp-bump');
var filter = require('gulp-filter');
var vulcanize = require('gulp-vulcanize');
var tagVersion = require('gulp-tag-version');
var useWatchify;

browserSync.use("logger", function () {
    return function (emitter, options) {
    };
});

function run(bundler, minify) {
  var output = './build/';
  if (minify) {
    bundler = bundler.plugin('minifyify', {
      map: pkg.name + '.map.json',
      output: output + pkg.name + '.map.json'
    });
  }

  console.time('build');
  return bundler
    .bundle({
      debug: true,
      standalone: 'pojoviz'
    })
    .on('error', function (e) {
      console.log(e);
    })
    .pipe(source(pkg.name + (minify ? '.min' : '') + '.js'))
    .pipe(gulp.dest(output))
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
  browserSync.init(['build/**'], {
    server: {
      baseDir: './public'
    }
  });
});

gulp.task('vulcanize', function () {
  return gulp.src('./public/index.html')
    .pipe(vulcanize({
      dest: './public/vulcanize.html',
    }))
    .pipe(gulp.dest('./public/'));
});

gulp.task('compass', function () {
  return gulp.src('./public/sass/*.scss')
    .pipe(compass({
      config_file: 'compass.rb',
      css: 'public/css',
      sass: 'public/sass'
    }))
    .on('error', function (e) {
      console.log(e);
    })
    .pipe(browserSync.reload({
      stream: true
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

gulp.task('watch', ['useWatchify', 'browserSync'],  function () {
  gulp.watch('public/sass/**', ['compass']);
});

// main tasks
gulp.task('build', ['browserify', 'compass', 'vulcanize']);

gulp.task('release.major', function (cb) { createTag('major', cb); });
gulp.task('release.minor', function (cb) { createTag('minor', cb); });
gulp.task('release.patch', function (cb) { createTag('patch', cb); });

gulp.task('default', ['watch']);