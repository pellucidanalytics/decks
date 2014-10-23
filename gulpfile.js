var browserify = require("browserify");
//var connectLiveReload = require("connect-livereload");
var debug = require("debug")("gulp-decks");
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

// Gets the 1st-level subdirectories of baseDir
function getSubDirs(baseDir) {
  return fs.readdirSync(baseDir)
    .filter(function(file) {
      return fs.statSync(path.join(baseDir, file)).isDirectory();
    });
}

// Maps a callback over every subdirectory of baseDir
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
  return eventStream.concat.apply(null, streams);
}

// Shows a Mac OSX notification with the given message
function notify(message) {
  nodeNotifier.notify({
    title: "gulp - decks",
    message: message
  });
}

////////////////////////////////////////////////////////////////////////////////
// lib tasks
////////////////////////////////////////////////////////////////////////////////

// TODO: need more tasks here

gulp.task("styl-lib", function() {
  return gulp.src(paths.lib.stylMain)
    .pipe(gulpStylus({ use: nib() }))
    .pipe(gulp.dest(paths.dist.baseDir));
});

gulp.task("jshint-lib", function() {
  return gulp.src(paths.lib.jsAll)
    .pipe(gulpJSHint())
    .pipe(gulpJSHint.reporter("jshint-stylish"))
    .pipe(gulpJSHint.reporter("fail"));
});

gulp.task("jsdoc-lib", function() {
  return gulp.src([paths.lib.jsAll, "README.md"])
    .pipe(gulpJSDoc(paths.dist.jsdocDir));
});

gulp.task("lib", ["styl-lib", "jshint-lib", "jsdoc-lib"]);

gulp.task("watch-lib", ["lib"], function() {
  gulp.watch(paths.lib.stylAll, ["styl-lib"]);
  gulp.watch(paths.lib.jsAll, ["jshint-lib", "jsdoc-lib"]);
});

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
      .pipe(gulpStylus({ use: nib() }))
      .pipe(gulp.dest(path.join(paths.dist.examplesDir, dir)));
  });
});

gulp.task("jshint-examples", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    return gulp.src(path.join(paths.examples.baseDir, dir, paths.examples.jsAll))
      .pipe(gulpJSHint())
      .pipe(gulpJSHint.reporter("jshint-stylish"))
      .pipe(gulpJSHint.reporter("fail"));
  });
});

gulp.task("js-examples", function() {
  return concatSubDirStreams(paths.examples.baseDir, function(dir) {
    var indexjsPath = "./" + path.join(paths.examples.baseDir, dir, paths.examples.jsMain);

    var bundler = browserify(indexjsPath, {
      noparse: ["lodash"],
      debug: true
    });

    return bundler
      .bundle()
      .pipe(vinylSourceStream("bundle.js"))
      .pipe(gulp.dest(path.join(paths.dist.examplesDir, dir)));
  });
});

gulp.task("examples", ["html-examples", "styl-examples", "jshint-examples", "js-examples"]);

gulp.task("watch-examples", ["examples"], function () {
  var liveReload = gulpLiveReload();

  gulp.watch(path.join(paths.examples.baseDir, paths.examples.htmlAll), ["html-examples"]);

  gulp.watch(path.join(paths.examples.baseDir, paths.examples.stylAll), ["styl-examples"]);

  gulp.watch(paths.dist.baseDir + "/**/*").on("change", function (file) {
    liveReload.changed(file.path);
  });

  eachSubDir(paths.examples.baseDir, function(dir) {
    var indexjsPath = "./" + path.join(paths.examples.baseDir, dir, paths.examples.jsMain);

    var bundler = watchify(browserify(indexjsPath, {
      cache: {},
      packageCache: {},
      fullPaths: true,
      noparse: ["lodash"],
      debug: true
    }));

    bundler.on("update", rebundle);

    function rebundle() {
      debug("-- rebundling for example " + dir + " --");
      return bundler
        .bundle()
        .on("error", gulpUtil.log.bind(gulpUtil, "browserify error"))
        .pipe(vinylSourceStream("bundle.js"))
        .pipe(gulp.dest(path.join(paths.dist.examplesDir, dir)))
        .on("end", gulpUtil.log.bind(gulpUtil, "finished bundling"));
    }

    gulp.watch(path.join(paths.examples.baseDir, dir, paths.examples.jsAll), ["jshint-examples"]);
  });
});

////////////////////////////////////////////////////////////////////////////////
// test tasks
////////////////////////////////////////////////////////////////////////////////

gulp.task("html-test", function() {
  return gulp.src(paths.test.htmlMain)
    .pipe(gulp.dest(paths.dist.testDir));
});

gulp.task("styl-test", function() {
  return gulp.src(paths.test.stylMain)
    .pipe(gulpStylus({ use: nib() }))
    .pipe(gulp.dest(paths.dist.testDir));
});

gulp.task("jshint-test", function() {
  return gulp.src(paths.test.jsAll)
    .pipe(gulpJSHint())
    .pipe(gulpJSHint.reporter("jshint-stylish"))
    .pipe(gulpJSHint.reporter("fail"));
});

gulp.task("js-test", function() {
  var bundler = browserify(paths.test.jsMain, {
    noparse: ["lodash"],
    debug: true
  });

  return bundler
    .bundle()
    .pipe(vinylSourceStream("bundle.js"))
    .pipe(gulp.dest(paths.dist.testDir));
});

gulp.task("test", ["html-test", "styl-test", "jshint-test", "js-test"], function() {
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
});

gulp.task("test-sauce", ["test", "serve"], function(cb) {
  sauceRunner.start(cb);
});

gulp.task("watch-test", ["test"], function() {
  gulp.watch(paths.test.htmlAll, ["html-test"]);
  gulp.watch(paths.test.stylAll, ["styl-test"]);
  gulp.watch(paths.test.jsAll, ["jshint-test"]);

  var bundler = watchify(browserify(paths.test.jsMain, watchify.args));
  bundler.on("update", rebundle);
  function rebundle() {
    debug("-- rebundling for test --");
    return bundler.bundle()
      .on("error", gulpUtil.log.bind(gulpUtil, "browserify error"))
      .pipe(vinylSourceStream("bundle.js"))
      .pipe(gulp.dest(paths.dist.testDir));
  }

  gulp.watch(path.join(paths.dist.testDir, "bundle.js"), ["test"]);
});

////////////////////////////////////////////////////////////////////////////////
// Live reload server
////////////////////////////////////////////////////////////////////////////////

gulp.task("serve", function() {
  var app = express();
  //app.use(connectLiveReload());
  app.use(express.static(__dirname));
  app.listen(3000);
});

////////////////////////////////////////////////////////////////////////////////
// Default task
////////////////////////////////////////////////////////////////////////////////

gulp.task("notify", function() {
  notify("Decks build complete!");
});

gulp.task("default", function(cb) {
  return runSequence(
    ["watch-lib", "watch-test", "watch-examples"],
    "serve",
    "notify",
    cb
  );
});

gulp.task("publish", ["lib", "examples", "test"], function() {
  debug("publishing to npm...");

  // TODO: allow passing a command line argument like "gulp publish --major|minor|patch|etc"
  var versionString = "prerelease";

  if (!shell.which("git") || !shell.which("npm")) {
    debug("publish failed - git and/or npm not found");
    shell.exit(1);
  }

  /* Don't add the dist files for now
  if (shell.exec("git add --force ./dist").code !== 0) {
    debug("publish failed - git add --force ./dist failed");
    shell.exit(1);
  }

  if (shell.exec("git commit -m 'release ./dist files'").code !== 0) {
    debug("publish failed - git commit failed");
    shell.exit(1);
  }
  */

  if (shell.exec("npm version " + versionString).code !== 0){
    debug("publish failed - npm version failed");
    shell.exit(1);
  }

  if (shell.exec("npm publish .").code !== 0) {
    debug("publish failed - npm publish failed");
    shell.exit(1);
  }

  if (shell.exec("git push --tags origin master").code !== 0) {
    debug("publish failed - git push failed");
    shell.exit(1);
  }
});
