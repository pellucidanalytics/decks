var browserify = require("browserify");
var connectLiveReload = require("connect-livereload");
var eventStream = require("event-stream");
var express = require("express");
var fs = require("fs");
var gulp = require("gulp");
var gulpJSDoc = require("gulp-jsdoc");
var gulpJSHint = require("gulp-jshint");
var gulpLiveReload = require("gulp-livereload");
var gulpMochaPhantomJS = require("gulp-mocha-phantomjs");
var gulpReplace = require("gulp-replace");
var gulpStylus = require("gulp-stylus");
var gulpUtil = require("gulp-util");
var nib = require("nib");
var nodeNotifier = require("node-notifier");
var path = require("path");
var runSequence = require("run-sequence");
var sauceRunner = require("./test/saucerunner");
var shell = require("shelljs");
var vinylSourceStream = require("vinyl-source-stream");
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
    examplesDir: "./dist/examples",
    jsdocDir: "./dist/jsdoc",
    jsdocHtmlAll: "./dist/jsdoc/*.html"
  }
};

/**
 * Gets the 1st-level subdirectories of baseDir
 *
 * @param {string} baseDir - Base directory
 * @return {Array} - 1st-level subdirectories
 */
function getSubDirs(baseDir) {
  return fs.readdirSync(baseDir)
    .filter(function(file) {
      return fs.statSync(path.join(baseDir, file)).isDirectory();
    });
}

/**
 * Maps a callback over every subdirectory of baseDir
 *
 * @param {string} baseDir - Base directory
 * @param {Function} callback - map callback
 * @return {Array} - result of map
 */
function mapSubDir(baseDir, callback) {
  return getSubDirs(baseDir).map(callback);
}

// Runs a callback over every subdirectory of baseDir
function eachSubDir(baseDir, callback) {
  getSubDirs(baseDir).forEach(callback);
}

// Maps a create stream function over each subdirectory, and returns a concatenation
// of the streams.
function concatSubDirStreams(baseDir, createStream) {
  var streams = mapSubDir(baseDir, createStream);
  return eventStream.concat.apply(eventStream, streams);
}

// Shows a Mac OSX notification with the given message
function notify(message) {
  nodeNotifier.notify({
    title: "gulp - decks",
    message: message
  });
}

function runCopy(sourcePath, destinationPath) {
  return gulp.src(sourcePath)
    .pipe(gulp.dest(destinationPath));
}

function runStylus(sourcePath, destinationPath) {
  return gulp.src(sourcePath)
    .pipe(gulpStylus({ use: nib() }))
    .pipe(gulp.dest(destinationPath));
}

function runJSHint(sourcePath) {
  return gulp.src(sourcePath)
    .pipe(gulpJSHint())
    .pipe(gulpJSHint.reporter("jshint-stylish"))
    .pipe(gulpJSHint.reporter("fail"));
}

function runBrowserify(sourcePath, destinationPath) {
  var bundler = browserify(sourcePath, {
    noparse: ["lodash"],
    debug: true
  });

  return bundler.bundle()
    .pipe(vinylSourceStream("bundle.js"))
    .pipe(gulp.dest(destinationPath));
}

// Wrapper for watchify that handles the common options and other stuff
function runWatchify(sourcePath, destinationPath, onEnd) {
  var bundler = watchify(browserify(sourcePath, {
    cache: {},
    packageCache: {},
    fullPaths: true,
    noparse: ["lodash"],
    debug: true
  }));

  function rebundle() {
    var pathInfo = sourcePath + " -> " + destinationPath;

    gulpUtil.log(gulpUtil.colors.cyan("Rebundling: " + pathInfo));

    return bundler.bundle()
      .on("error", function() {
        gulpUtil.log(gulpUtil.colors.red("Failed to rebundle: " + pathInfo));
      })
      .pipe(vinylSourceStream("bundle.js"))
      .pipe(gulp.dest(destinationPath))
      .on("end", function() {
        gulpUtil.log(gulpUtil.colors.green("Successfully rebundled: " + pathInfo));

        // TODO: There must be a better way to execute something when the rebundle finishes
        if (onEnd) {
          return onEnd();
        }
      });
  }

  bundler.on("update", rebundle);

  return rebundle();
}

// Wrapper for gulp.watch, which logs which file changed
function runWatch() {
  var watcher = gulp.watch.apply(gulp, arguments);
  watcher.on("change", function(e) {
    gulpUtil.log(gulpUtil.colors.yellow("File " + e.path + " was " + e.type + ", re-running tasks."));
  });
  watcher.on("end", function() {
    gulpUtil.log(gulpUtil.colors.red("Watcher ended: " + arguments[0]));
  });
}

function runWatchLiveReload(sourcePath) {
  var liveReload = gulpLiveReload();
  var watcher = gulp.watch(sourcePath);
  watcher.on("change", function(e) {
    liveReload.changed(e.path);
  });
}

// Helper function to execute the phantom tests
function runPhantomTests() {
  var isFailed = false;
  return gulp.src(path.join(paths.dist.testDir, "index.html"))
    .pipe(gulpMochaPhantomJS())
    .on("error", function() {
      isFailed = true;
      notify("Tests failed!");
    })
    .on("end", function() {
      if (!isFailed) {
        notify("Tests passed!");
      }
    });
}

function runShell(command, errorMessage) {
  if (shell.exec(command).code !== 0) {
    gulpUtil.log(gulpUtil.colors.red(errorMessage));
    shell.exit(1);
  }
}

////////////////////////////////////////////////////////////////////////////////
// lib tasks
////////////////////////////////////////////////////////////////////////////////

// TODO: need a task to bundle a standalone module for browser use

gulp.task("lib-styl", function() {
  return runStylus(paths.lib.stylMain, paths.dist.baseDir);
});

gulp.task("lib-jshint", function() {
  return runJSHint(paths.lib.jsAll);
});

gulp.task("lib-jsdoc", function() {
  return gulp.src([paths.lib.jsAll, "README.md"])
    .pipe(gulpJSDoc(paths.dist.jsdocDir));
});

gulp.task("lib-jsdoc-clean", ["lib-jsdoc"], function() {
  return gulp.src(paths.dist.jsdocHtmlAll)
    .pipe(gulpReplace(/Documentation generated by.*/, ""))
    .pipe(gulp.dest(paths.dist.jsdocDir));
});

gulp.task("lib", ["lib-styl", "lib-jshint", "lib-jsdoc-clean"]);

gulp.task("lib-watch", ["lib"], function() {
  runWatch(paths.lib.stylAll, ["lib-styl"]);
  runWatch(paths.lib.jsAll, ["lib-jshint", "lib-jsdoc-clean"]);
});

////////////////////////////////////////////////////////////////////////////////
// example tasks
////////////////////////////////////////////////////////////////////////////////

gulp.task("examples-html", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    return runCopy(
      path.join(paths.examples.baseDir, dir, paths.examples.htmlMain),
      path.join(paths.dist.examplesDir, dir)
    );
  });
});

gulp.task("examples-styl", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    return runStylus(
      path.join(paths.examples.baseDir, dir, paths.examples.stylMain),
      path.join(paths.dist.examplesDir, dir)
    );
  });
});

gulp.task("examples-jshint", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    return runJSHint(
      path.join(paths.examples.baseDir, dir, paths.examples.jsAll)
    );
  });
});

gulp.task("examples-js", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    return runBrowserify(
      "./" + path.join(paths.examples.baseDir, dir, paths.examples.jsMain),
      path.join(paths.dist.examplesDir, dir)
    );
  });
});

gulp.task("examples", ["examples-html", "examples-styl", "examples-jshint", "examples-js"]);

gulp.task("examples-watch", ["examples"], function () {
  runWatch(path.join(paths.examples.baseDir, paths.examples.htmlAll), ["examples-html"]);

  runWatch(path.join(paths.examples.baseDir, paths.examples.stylAll), ["examples-styl"]);

  eachSubDir(paths.examples.baseDir, function(dir) {
    runWatch(path.join(paths.examples.baseDir, dir, paths.examples.jsAll), ["examples-jshint"]);

    runWatchify(
      "./" + path.join(paths.examples.baseDir, dir, paths.examples.jsMain),
      path.join(paths.dist.examplesDir, dir)
    );

    runWatchLiveReload(paths.dist.baseDir + "/**/*");
  });
});

////////////////////////////////////////////////////////////////////////////////
// test tasks
////////////////////////////////////////////////////////////////////////////////

// Copy .html files to dist/test dir
gulp.task("test-html", function() {
  return runCopy(paths.test.htmlMain, paths.dist.testDir);
});

// Compile .styl files to .css files in dist/test dir
gulp.task("test-styl", function() {
  return runStylus(paths.test.stylMain, paths.dist.testDir);
});

// JSHint all the test .js files
gulp.task("test-jshint", function() {
  return runJSHint(paths.test.jsAll);
});

// Browserify the test .js files into dist/test
gulp.task("test-js", function() {
  return runBrowserify(paths.test.jsMain, paths.dist.testDir);
});

// Compile all the test files and run the phantom testss
gulp.task("test", ["test-html", "test-styl", "test-jshint", "test-js"], function() {
  return runPhantomTests();
});

// Just run the phantom tests (used by watcher, where we don't want to recompile tests again)
gulp.task("test-phantom", function() {
  return runPhantomTests();
});

// Run the tests on Sauce Labs
gulp.task("test-sauce", ["test"], function(cb) {
  sauceRunner.start(cb);
});

// Watches all the test files and re-runs tasks
gulp.task("test-watch", ["test"], function() {
  runWatch(paths.test.htmlAll, ["test-html"]);

  runWatch(paths.test.stylAll, ["test-styl"]);

  runWatch(paths.test.jsAll, ["test-jshint"]);

  runWatchify(paths.test.jsMain, paths.dist.testDir, runPhantomTests);
});

////////////////////////////////////////////////////////////////////////////////
// Live reload server (localhost:3000)
////////////////////////////////////////////////////////////////////////////////

gulp.task("serve", function() {
  var app = express();
  app.use(connectLiveReload());
  /* jshint ignore:start */
  app.use(express.static(__dirname));
  /* jshint ignore:end */
  var port = 3001;
  console.log("Listening on port " + port);
  app.listen(port);
});

////////////////////////////////////////////////////////////////////////////////
// Notify of build completion task
////////////////////////////////////////////////////////////////////////////////

gulp.task("notify", function() {
  notify("Decks build complete!");
});

////////////////////////////////////////////////////////////////////////////////
// Default task 
////////////////////////////////////////////////////////////////////////////////

gulp.task("default", function(cb) {
  return runSequence(
    ["lib-watch", "test-watch", "examples-watch"],
    "serve",
    "notify",
    cb
  );
});

gulp.task("build", ["lib", "examples", "test"]);

gulp.task("publish", ["build"], function() {
  gulpUtil.log("publishing to npm...");
  runShell("./publish.sh", "publish failed!");
});
