var gulp = require("gulp");
var stylus = require("gulp-stylus");
var nib = require("nib");

var paths = {
    demo: {
        html: "demo/index.html",
        js: "demo/index.js",
        styl: "demo/index.styl",
        out: "demo/www"
    },
    src: {
        js: "src/index.js",
        styl: "src/index.styl",
        out: "dist"
    }
};

////////////////////////////////////////////////////////////////////////////////
// Distribution tasks
////////////////////////////////////////////////////////////////////////////////

gulp.task("stylus-dist", function() {
    gulp.src(paths.src.styl)
        .pipe(stylus({ use: nib() }))
        .pipe(gulp.dest(paths.src.out));
});

gulp.task("dist", ["stylus-dist"]);

////////////////////////////////////////////////////////////////////////////////
// Demo tasks
////////////////////////////////////////////////////////////////////////////////

gulp.task("html-demo", function() {
    gulp.src(paths.demo.html)
        .pipe(gulp.dest(paths.demo.out));
});

gulp.task("stylus-demo", function() {
    gulp.src(paths.demo.styl)
        .pipe(stylus({ use: nib() }))
        .pipe(gulp.dest(paths.demo.out));
});

gulp.task("demo", ["html-demo", "stylus-demo"]);

////////////////////////////////////////////////////////////////////////////////
// Default task
////////////////////////////////////////////////////////////////////////////////

gulp.task("default", ["dist", "demo"]);
