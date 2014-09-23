var gulp = require("gulp");
var stylus = require("gulp-stylus");
var nib = require("nib");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var mochaPhantomJS = require("gulp-mocha-phantomjs");

var paths = {
  src: {
    js: "lib/index.js",
    styl: "lib/index.styl",
    out: "dist"
  },
  test: {
    html: "test/index.html",
    js: "test/index.js",
    styl: "test/index.styl",
    out: "dist/test"
  },
  example: {
    html: "example/index.html",
    js: "example/index.js",
    styl: "example/index.styl",
    out: "dist/example"
  }
};

////////////////////////////////////////////////////////////////////////////////
// lib tasks
////////////////////////////////////////////////////////////////////////////////

gulp.task("styl-dist", function() {
  gulp.src(paths.src.styl)
    .pipe(stylus({ use: nib() }))
    .pipe(gulp.dest(paths.src.out));
});

gulp.task("dist", ["styl-dist"]);

////////////////////////////////////////////////////////////////////////////////
// example tasks
////////////////////////////////////////////////////////////////////////////////

gulp.task("html-example", function() {
  gulp.src(paths.example.html)
    .pipe(gulp.dest(paths.example.out));
});

gulp.task("styl-example", function() {
  gulp.src(paths.example.styl)
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
  gulp.src(paths.test.html)
    .pipe(gulp.dest(paths.test.out));
});

gulp.task("styl-test", function() {
  gulp.src(paths.test.styl)
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

gulp.task("test", ["html-test", "styl-test", "js-test", "mocha-test"]);

////////////////////////////////////////////////////////////////////////////////
// Default task
////////////////////////////////////////////////////////////////////////////////

gulp.task("default", ["dist", "test", "example"]);
