var gulp = require("gulp");
var stylus = require("gulp-stylus");
var nib = require("nib");

var paths = {
    demo: {
        html: "src-demo/index.html",
        js: "src-demo/index.js",
        styl: "src-demo/index.styl",
        out: "dist/demo"
    },
    src: {
        js: "src/index.js",
        styl: "src/index.styl",
        out: "dist"
    }
};

gulp.task("stylus-dist", function() {
    gulp.src(paths.src.styl)
        .pipe(stylus({ use: nib() }))
        .pipe(gulp.dest(paths.src.out));
});

gulp.task("html-demo", function() {
    gulp.src(paths.demo.html)
        .pipe(gulp.dest(paths.demo.out));
});

gulp.task("stylus-demo", function() {
    gulp.src(paths.demo.styl)
        .pipe(stylus({ use: nib() }))
        .pipe(gulp.dest(paths.demo.out));
});

gulp.task("dist", ["stylus-dist"]);
gulp.task("demo", ["html-demo", "stylus-demo"]);
gulp.task("default", ["dist", "demo"]);
