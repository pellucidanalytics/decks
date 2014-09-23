var browserify = require("browserify");
var gulp = require("gulp");
var mochaPhantomJS = require("gulp-mocha-phantomjs");
var nib = require("nib");
var source = require("vinyl-source-stream");
var stylus = require("gulp-stylus");
var watchify = require("watchify");

var paths = {
  src: {
    jsMain: "lib/index.js",
    jsAll: "lib/**/*.js",

    stylMain: "lib/index.styl",
    stylAll: "lib/**/*.styl",

    out: "dist",
  },
  test: {
    htmlMain: "test/index.html",
    htmlAll: "test/**/*.html",

    jsMain: "test/index.js",
    jsAll: "test/**/*.js",

    stylMain: "test/index.styl",
    stylAll: "test/**/*.styl",

    out: "dist/test"
  },
  example: {
    htmlMain: "example/index.html",
    htmlAll: "example/**/*.html",

    jsMain: "example/index.js",
    jsAll: "example/**/*.js",

    stylMain: "example/index.styl",
    stylAll: "example/**/*.styl",

    out: "dist/example"
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

gulp.task("html-test", function() {
  gulp.src(paths.test.htmlMain)
    .pipe(gulp.dest(paths.test.out));
});

gulp.task("styl-test", function() {
  gulp.src(paths.test.stylMain)
    .pipe(stylus({ use: nib() }))
    .pipe(gulp.dest(paths.test.out));
});

gulp.task("js-test", function() {
  return browserify("./test/index.js")
    .bundle()
    .pipe(source("bundle.js"))
    .pipe(gulp.dest(paths.test.out));
});

gulp.task("mocha-test", function() {
  return gulp.src("dist/test/index.html")
    .pipe(mochaPhantomJS());
});

gulp.task("watch-html-test", function() {
  gulp.watch(paths.test.htmlAll, ["html-test"]);
});

gulp.task("watch-styl-test", function() {
  gulp.watch(paths.test.stylAll, ["styl-test"]);
});

gulp.task("watch-js-test", function() {
});

gulp.task("test", ["html-test", "styl-test", "js-test", "mocha-test"]);

////////////////////////////////////////////////////////////////////////////////
// Default task
////////////////////////////////////////////////////////////////////////////////

gulp.task("default", ["dist", "test", "example"]);
