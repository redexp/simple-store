var gulp = require('gulp');
var replace = require('gulp-replace');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('default', function() {
    gulp.src('simple-state-store.js')
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
        .pipe(rename('simple-state-store.min.js'))
        .pipe(gulp.dest('./'))
    ;
});