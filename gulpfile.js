var gulp = require('gulp');
var plumber = require('gulp-plumber');
var includeJs = require('./include.js');

gulp.task('test1', function(cb) {
  gulp.src('test/1/*.js', {base:'test/1'})
    .pipe(plumber())
    .pipe(includeJs())
    .pipe(gulp.dest('test/out/1'))
    .on('error', console.log)
    .on('end', function() {
      require('./test/out/1/a.js');
      console.log('Test 1 OK');
      cb();
    });
});

gulp.task('test2', function(cb) {
  var isError = false;
  gulp.src('test/2/*.js', {base:'test/2'})
    .pipe(plumber(function(err) {
      if (typeof err.message === 'string' && err.message.match(/^Circular/)) {
        isError = true;
        console.log('Test 2 OK', err.message);
      }
    }))
    .pipe(includeJs())
    .pipe(gulp.dest('test/out/2'))
    .on('end', function() {
      if (!isError) {
        console.log('Test 2 FAIL: Expect circular error');
      }
      cb();
    });
});

gulp.task('trim_test', function(cb) {
  require('./test/trim_test');
});

gulp.task('test', function() {
  gulp.start('test1');
  gulp.start('test2');
  gulp.start('trim_test');
});
