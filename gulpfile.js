var gulp = require('gulp');
var replace = require('gulp-replace');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('default', function() {
    var info = require('./package');

    gulp.src(info.main)
        .pipe(replace('var _DEV_ = true;', ''))
        .pipe(uglify({
            mangle: false,
            compress: {
                global_defs: {
                    '_DEV_': false
                },
                unused: true
            }
        }))
        .pipe(rename(info.main.replace(/\.js$/, '.min.js')))
        .pipe(gulp.dest('./'))
    ;
});