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
    return gulp.src([
            './src/audio-network-begin.js',
            './src/common/**/*.js',
            './src/physical-layer/**/*.js',
            './src/audio-network-end.js'
        ])
        .pipe(debug())
        .pipe(concat('audio-network-v1.0.3rc1.js'))
        .pipe(header('/*\n' + fs.readFileSync('./LICENCE', 'utf8') + '*/\n\n'))
        .pipe(gulp.dest(DEST))
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(header('/*\n' + fs.readFileSync('./LICENCE', 'utf8') + '*/\n\n'))
        .pipe(gulp.dest(DEST));
});

var markdown = require('gulp-markdown');

gulp.task('md', function () {
    return gulp.src('README.md')
        .pipe(markdown())
        .pipe(gulp.dest(DEST));
});
