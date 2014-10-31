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
    jsdocDir: "./dist/jsdoc"
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

  bundler.on("update", function() {
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
  });
}

// Wrapper for gulp.watch, which logs which file changed
function runWatch() {
  var watcher = gulp.watch.apply(gulp, arguments);
  watcher.on("change", function(e) {
    gulpUtil.log(gulpUtil.colors.yellow("File " + e.path + " was " + e.type + ", re-running tasks."));
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

gulp.task("styl-lib", function() {
  return runStylus(paths.lib.stylMain, paths.dist.baseDir);
});

gulp.task("jshint-lib", function() {
  return runJSHint(paths.lib.jsAll);
});

gulp.task("jsdoc-lib", function() {
  return gulp.src([paths.lib.jsAll, "README.md"])
    .pipe(gulpJSDoc(paths.dist.jsdocDir));
});

gulp.task("lib", ["styl-lib", "jshint-lib", "jsdoc-lib"]);

gulp.task("watch-lib", ["lib"], function() {
  runWatch(paths.lib.stylAll, ["styl-lib"]);
  runWatch(paths.lib.jsAll, ["jshint-lib", "jsdoc-lib"]);
});

////////////////////////////////////////////////////////////////////////////////
// example tasks
////////////////////////////////////////////////////////////////////////////////

gulp.task("html-examples", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    return runCopy(
      path.join(paths.examples.baseDir, dir, paths.examples.htmlMain),
      path.join(paths.dist.examplesDir, dir)
    );
  });
});

gulp.task("styl-examples", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    return runStylus(
      path.join(paths.examples.baseDir, dir, paths.examples.stylMain),
      path.join(paths.dist.examplesDir, dir)
    );
  });
});

gulp.task("jshint-examples", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    return runJSHint(
      path.join(paths.examples.baseDir, dir, paths.examples.jsAll)
    );
  });
});

gulp.task("js-examples", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    return runBrowserify(
      "./" + path.join(paths.examples.baseDir, dir, paths.examples.jsMain),
      path.join(paths.dist.examplesDir, dir)
    );
  });
});

gulp.task("examples", ["html-examples", "styl-examples", "jshint-examples", "js-examples"]);

gulp.task("watch-examples", ["examples"], function () {
  runWatch(path.join(paths.examples.baseDir, paths.examples.htmlAll), ["html-examples"]);

  runWatch(path.join(paths.examples.baseDir, paths.examples.stylAll), ["styl-examples"]);

  eachSubDir(paths.examples.baseDir, function(dir) {
    runWatch(path.join(paths.examples.baseDir, dir, paths.examples.jsAll), ["jshint-examples"]);

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
gulp.task("html-test", function() {
  return runCopy(paths.test.htmlMain, paths.dist.testDir);
});

// Compile .styl files to .css files in dist/test dir
gulp.task("styl-test", function() {
  return runStylus(paths.test.stylMain, paths.dist.testDir);
});

// JSHint all the test .js files
gulp.task("jshint-test", function() {
  return runJSHint(paths.test.jsAll);
});

// Browserify the test .js files into dist/test
gulp.task("js-test", function() {
  return runBrowserify(paths.test.jsMain, paths.dist.testDir);
});

// Compile all the test files and run the phantom testss
gulp.task("test", ["html-test", "styl-test", "jshint-test", "js-test"], function() {
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
gulp.task("watch-test", ["test"], function() {
  runWatch(paths.test.htmlAll, ["html-test"]);

  runWatch(paths.test.stylAll, ["styl-test"]);

  runWatch(paths.test.jsAll, ["jshint-test"]);

  runWatchify(paths.test.jsMain, paths.dist.testDir, runPhantomTests);

  //runWatch(path.join(paths.dist.testDir, "bundle.js"), ["test-phantom"]);
});

////////////////////////////////////////////////////////////////////////////////
// Live reload server (localhost:3000)
////////////////////////////////////////////////////////////////////////////////

gulp.task("serve", function() {
  var app = express();
  app.use(connectLiveReload());
  app.use(express.static(__dirname));
  app.listen(3001);
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
    ["watch-lib", "watch-test", "watch-examples"],
    "serve",
    "notify",
    cb
  );
});

gulp.task("publish", ["lib", "examples", "test"], function() {
  gulpUtil.log("publishing to npm...");

  // TODO: allow passing a command line argument like "gulp publish --major|minor|patch|etc"
  var versionString = "prerelease";

  if (!shell.which("git") || !shell.which("npm")) {
    gulpUtil.log(gulpUtil.colors.red("publish failed - git and/or npm not found"));
    shell.exit(1);
  }

  /* Don't add dist files for now
  runShell("git add --force ./dist", "publish failed - git add --force ./dist failed");
  runShell("git commit -m 'release ./dist files'", "publish failed - git commit failed");
  */

  runShell("npm version " + versionString, "publish failed - npm version failed");
  runShell("npm publish .", "publish failed - npm publish . failed");
  runShell("git push --tags origin master", "publish failed - git push --tags origin master failed");
});
