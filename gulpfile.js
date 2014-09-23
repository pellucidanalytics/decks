var browserify = require("browserify");
var gulp = require("gulp");
var gutil = require("gutil");
var mochaPhantomJS = require("gulp-mocha-phantomjs");
var nib = require("nib");
var path = require("path");
var runSequence = require("run-sequence");
var source = require("vinyl-source-stream");
var stylus = require("gulp-stylus");
var watchify = require("watchify");

var paths = {
  src: {
    jsMain: "./lib/index.js",
    jsAll: "./lib/**/*.js",

    stylMain: "./lib/index.styl",
    stylAll: "./lib/**/*.styl",

    out: "./dist",
  },
  test: {
    htmlMain: "./test/index.html",
    htmlAll: "./test/**/*.html",

    jsMain: "./test/index.js",
    jsAll: "./test/**/*.js",

    stylMain: "./test/index.styl",
    stylAll: "./test/**/*.styl",

    out: "./dist/test"
  },
  example: {
    htmlMain: "./example/index.html",
    htmlAll: "./example/**/*.html",

    jsMain: "./example/index.js",
    jsAll: "./example/**/*.js",

    stylMain: "./example/index.styl",
    stylAll: "./example/**/*.styl",

    out: "./dist/example"
  }
};

////////////////////////////////////////////////////////////////////////////////
// lib tasks
////////////////////////////////////////////////////////////////////////////////

gulp.task("styl-dist", function() {
  gulp.src(paths.src.stylMain)
    .pipe(stylus({ use: nib() }))
    .pipe(gulp.dest(paths.src.out));
});

gulp.task("dist", ["styl-dist"]);

////////////////////////////////////////////////////////////////////////////////
// example tasks
////////////////////////////////////////////////////////////////////////////////

gulp.task("html-example", function() {
  gulp.src(paths.example.htmlMain)
    .pipe(gulp.dest(paths.example.out));
});

gulp.task("styl-example", function() {
  gulp.src(paths.example.stylMain)
    .pipe(stylus({ use: nib() }))
    .pipe(gulp.dest(paths.example.out));
});

gulp.task("js-example", function() {
  // TODO
});

gulp.task("example", ["html-example", "styl-example", "js-example"]);

////////////////////////////////////////////////////////////////////////////////
// test tasks
////////////////////////////////////////////////////////////////////////////////

// Copy .html files to test output folder
gulp.task("html-test", function() {
  gulp.src(paths.test.htmlMain)
    .pipe(gulp.dest(paths.test.out));
});

// Compile .styl files to .css files in test output folder
gulp.task("styl-test", function() {
  gulp.src(paths.test.stylMain)
    .pipe(stylus({ use: nib() }))
    .pipe(gulp.dest(paths.test.out));
});

// Bundle .js files into test output folder
gulp.task("js-test", function() {
  return browserify(paths.test.jsMain)
    .bundle()
    .pipe(source("bundle.js"))
    .pipe(gulp.dest(paths.test.out));
});

// Run mocha PhantomJS tests in test output folder
gulp.task("mocha-test", function() {
  return gulp.src(path.join(paths.test.out, "index.html"))
    .pipe(mochaPhantomJS());
});

// Watch test .html files
gulp.task("watch-html-test", function() {
  gulp.watch(paths.test.htmlAll, ["html-test"]);
});

// Watch test .styl files
gulp.task("watch-styl-test", function() {
  gulp.watch(paths.test.stylAll, ["styl-test"]);
});

// Watch test .js files
gulp.task("watch-js-test", function() {
  var bundler = watchify(browserify(paths.test.jsMain, watchify.args));
  bundler.on("update", rebundle);
  function rebundle() {
    return bundler.bundle()
      .on("error", gutil.log.bind(gutil, "browserify error"))
      .pipe(source("bundle.js"))
      .pipe(gulp.dest(paths.test.out));
  }
  //return rebundle();
});

// Watch built test .js file
gulp.task("watch-mocha-test", function() {
  gulp.watch(path.join(paths.test.out, "bundle.js"), ["mocha-test"]);
});

// Run the test build
gulp.task("test", ["html-test", "styl-test", "js-test", "mocha-test"]);

// Start the watchers for test files
gulp.task("watch-test", ["watch-html-test", "watch-styl-test", "watch-js-test", "watch-mocha-test"]);

////////////////////////////////////////////////////////////////////////////////
// Default task
////////////////////////////////////////////////////////////////////////////////

gulp.task("default", function(cb) {
  runSequence(
    ['dist', 'example', 'test'],
    'watch-test');
});
