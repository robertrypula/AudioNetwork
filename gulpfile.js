'use strict';

var gulp = require('gulp');
var header = require('gulp-header');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var debug = require('gulp-debug');
var fs = require('fs');

var DEST = 'build/';

gulp.task('default', function() {
    // var pattern = "./src/**/!(*.test).js";
    return gulp.src([
            './src/audio-network-boot.js',
            './src/**/!(audio-network-boot|audio-network-end|*.test).js',
            './src/audio-network-end.js'
        ])
        .pipe(debug())
        .pipe(concat('audio-network-v1.3.2.js'))
        .pipe(header('/*\n' + fs.readFileSync('./LICENCE', 'utf8') + '*/\n\n'))
        .pipe(gulp.dest(DEST))
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(header('/*\n' + fs.readFileSync('./LICENCE', 'utf8') + '*/\n\n'))
        .pipe(gulp.dest(DEST));
});

var markdown = require('gulp-markdown');

gulp.task('md-readme', function () {
    return gulp.src('README.md')
        .pipe(markdown())
        .pipe(gulp.dest(DEST));
});

gulp.task('md-changelog', function () {
    return gulp.src('CHANGELOG.md')
        .pipe(markdown())
        .pipe(gulp.dest(DEST));
});

gulp.task('md-article02', function () {
    return gulp.src('article_02.md')
        .pipe(markdown())
        .pipe(gulp.dest(DEST));
});



var webserver = require('gulp-webserver');

gulp.task('serve', function() {
    gulp.src('.')
        .pipe(webserver({
            fallback: 'index.html',
            // livereload: true,
            directoryListing: true,
            open: 'http://localhost:8000/index.html'
        }));
});

var Glob = require("glob").Glob;

gulp.task('script-list', function() {
    var pattern = "./src/**/!(audio-network-boot|audio-network-end|*.test).js";
    var mg = new Glob(pattern, {mark: true}, function (er, matches) {
        console.log('\'audio-network-boot.js\',');
        for (var i = 0; i < matches.length; i++) {
            matches[i] = matches[i]
                .replace('./src/', '\'')
                .replace('.js', '.js\',');

            console.log(matches[i]);
        }
        console.log('\'audio-network-end.js\'');
    });
});

gulp.task('script-tag-unit-test', function() {
    var pattern = "./src/**/*.test.js";
    var mg = new Glob(pattern, {mark: true}, function (er, matches) {
        for (var i = 0; i < matches.length; i++) {
            matches[i] = matches[i]
                .replace('./src/', '<script src="../../src/')
                .replace('.js', '.js"></script>');

            console.log(matches[i]);
        }
    });
});
