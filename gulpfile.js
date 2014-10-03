var browserify = require("browserify");
var connectLiveReload = require("connect-livereload");
var eventStream = require("event-stream");
var express = require("express");
var fs = require("fs");
var gulp = require("gulp");
var gulpLiveReload = require("gulp-livereload");
var gutil = require("gulp-util");
var mochaPhantomJS = require("gulp-mocha-phantomjs");
var nib = require("nib");
var path = require("path");
var runSequence = require("run-sequence");
var source = require("vinyl-source-stream");
var stylus = require("gulp-stylus");
var watchify = require("watchify");

var paths = {
  lib: {
    baseDir: "./lib",
    jsMain: "./lib/index.js",
    jsAll: "./lib/**/*.js",
    stylMain: "./lib/index.styl",
    stylAll: "./lib/**/*.styl"
  },
  test: {
    baseDir: "./test",
    htmlMain: "./test/index.html",
    htmlAll: "./test/**/*.html",
    jsMain: "./test/index.js",
    jsAll: "./test/**/*.js",
    stylMain: "./test/index.styl",
    stylAll: "./test/**/*.styl"
  },
  examples: {
    baseDir: "./examples",
    htmlMain: "index.html",
    htmlAll: "**/*.html",
    jsMain: "index.js",
    jsAll: "**/*.js",
    stylMain: "index.styl",
    stylAll: "**/*.styl"
  },
  dist: {
    baseDir: "./dist",
    testDir: "./dist/test",
    examplesDir: "./dist/examples"
  }
};

// Gets the 1st-level subdirectories of baseDir
function getSubDirs(baseDir) {
  return fs.readdirSync(baseDir)
    .filter(function(file) {
      return fs.statSync(path.join(baseDir, file)).isDirectory();
    });
}

// Maps a callback for every subdirectory of baseDir
function mapSubDir(baseDir, callback) {
  return getSubDirs(baseDir).map(callback);
}

// Runs a callback for every subdirectory of baseDir
function forEachSubDir(baseDir, callback) {
  getSubDirs(baseDir).forEach(callback);
}

// Maps a create stream function over each subdirectory, and returns a concatenation
// of the streams
function concatSubDirStreams(baseDir, createStream) {
  var streams = mapSubDir(baseDir, createStream);
  return eventStream.concat.apply(null, streams);
}

////////////////////////////////////////////////////////////////////////////////
// lib tasks
////////////////////////////////////////////////////////////////////////////////

// TODO: need more tasks here

gulp.task("styl-dist", function() {
  gulp.src(paths.lib.stylMain)
    .pipe(stylus({ use: nib() }))
    .pipe(gulp.dest(paths.dist.baseDir));
});

gulp.task("dist", ["styl-dist"]);

////////////////////////////////////////////////////////////////////////////////
// example tasks
////////////////////////////////////////////////////////////////////////////////

gulp.task("html-examples", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    return gulp.src(path.join(paths.examples.baseDir, dir, paths.examples.htmlMain))
      .pipe(gulp.dest(path.join(paths.dist.examplesDir, dir)));
  });
});

gulp.task("styl-examples", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    return gulp.src(path.join(paths.examples.baseDir, dir, paths.examples.stylMain))
      .pipe(stylus({ use: nib() }))
      .pipe(gulp.dest(path.join(paths.dist.examplesDir, dir)));
  });
});

gulp.task("js-examples", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    var indexjsPath = "./" + path.join(paths.examples.baseDir, dir, paths.examples.jsMain);

    var bundler = browserify(indexjsPath, {
      noparse: ['lodash', 'q'],
      debug: true
    });

    return bundler.bundle()
      .pipe(source('bundle.js'))
      .pipe(gulp.dest(path.join(paths.dist.examplesDir, dir)));
  });
});

gulp.task("examples", ["html-examples", "styl-examples", "js-examples"]);

gulp.task('watch-examples', ['examples'], function () {
  var liveReload = gulpLiveReload();

  gulp.watch(path.join(paths.examples.baseDir, paths.examples.htmlAll), ['html-examples']);

  gulp.watch(path.join(paths.examples.baseDir, paths.examples.stylAll), ['styl-examples']);

  gulp.watch(paths.dist.baseDir + '/**/*').on('change', function (file) {
    liveReload.changed(file.path);
  });

  forEachSubDir(paths.examples.baseDir, function(dir) {
    var indexjsPath = "./" + path.join(paths.examples.baseDir, dir, paths.examples.jsMain);

    var bundler = watchify(browserify(indexjsPath, {
      cache: {},
      packageCache: {},
      fullPaths: true,
      debug: true
    }));

    bundler.on("update", rebundle);

    function rebundle() {
      return bundler.bundle()
        .on("error", gutil.log.bind(gutil, "browserify error"))
        .pipe(source("bundle.js"))
        .pipe(gulp.dest(path.join(paths.dist.examplesDir, dir)))
        .on('end', gutil.log.bind(gutil, "finished bundling"));
    }
  });
});

////////////////////////////////////////////////////////////////////////////////
// test tasks
////////////////////////////////////////////////////////////////////////////////

gulp.task("html-test", function() {
  gulp.src(paths.test.htmlMain)
    .pipe(gulp.dest(paths.dist.testDir));
});

gulp.task("styl-test", function() {
  gulp.src(paths.test.stylMain)
    .pipe(stylus({ use: nib() }))
    .pipe(gulp.dest(paths.dist.testDir));
});

gulp.task("js-test", function() {
  return browserify(paths.test.jsMain)
    .bundle()
    .pipe(source("bundle.js"))
    .pipe(gulp.dest(paths.dist.testDir));
});

gulp.task("test", ["html-test", "styl-test", "js-test"], function() {
  return gulp.src(path.join(paths.dist.testDir, "index.html"))
    .pipe(mochaPhantomJS());
});

gulp.task("watch-test", ["test"], function() {
  gulp.watch(paths.test.htmlAll, ["html-test"]);

  gulp.watch(paths.test.stylAll, ["styl-test"]);

  var bundler = watchify(browserify(paths.test.jsMain, watchify.args));

  bundler.on("update", rebundle);

  function rebundle() {
    return bundler.bundle()
      .on("error", gutil.log.bind(gutil, "browserify error"))
      .pipe(source("bundle.js"))
      .pipe(gulp.dest(paths.dist.testDir));
  }

  gulp.watch(path.join(paths.dist.testDir, "bundle.js"), ["test"]);
});

////////////////////////////////////////////////////////////////////////////////
// Live reload server
////////////////////////////////////////////////////////////////////////////////

gulp.task("serve", function() {
  var app = express();
  app.use(connectLiveReload());
  app.use(express.static(path.join(__dirname, paths.dist.baseDir)));
  app.listen(3000);
});

////////////////////////////////////////////////////////////////////////////////
// Default task
////////////////////////////////////////////////////////////////////////////////

gulp.task("default", function(cb) {
  runSequence(
    ['watch-test', 'watch-examples'],
    'serve',
    cb
  );
});
