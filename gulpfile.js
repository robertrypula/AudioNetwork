'use strict';

var gulp = require('gulp');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var debug = require('gulp-debug');

var DEST = 'build/';

gulp.task('default', function() {
    return gulp.src([
            './src/audio-network-begin.js',
            './src/common/**/*.js',
            './src/physical-layer/**/*.js',
            './src/audio-network-end.js'
        ])
        .pipe(debug())
        .pipe(concat('audio-network-v1.0.2.js'))
        .pipe(gulp.dest(DEST))
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(DEST));
});
