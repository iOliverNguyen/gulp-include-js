var expect = require('chai').expect;
var fs = require('fs');
var gulp = require('gulp');
var clean = require('gulp-clean');
var insert = require('gulp-insert');
var plumber = require('gulp-plumber');
var runSequence = require('gulp-run-sequence');
var includeJs = require('./include.js');

gulp.task('test1', function(cb) {
  gulp.src('test/1/*.js', {base:'test/1'})
    .pipe(plumber())
    .pipe(includeJs())
    .pipe(gulp.dest('test/out/1'))
    .on('error', console.log)
    .on('end', function() {
      var a = require('./test/out/1/a');
      expect(a.ABC).equal('ABCCC');
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

gulp.task('test3', function(cb) {
  gulp.src('test/3/*.js', {base:'test/3'})
    .pipe(plumber())
    .pipe(includeJs())
    .pipe(gulp.dest('test/out/3'))
    .on('error', console.log)
    .on('end', function() {
      var a = require('./test/out/3/a');
      expect(a.AC).equal('Aundefined');
      expect(a.B).equal('undefined');
      console.log('Test 3 OK');
      cb();
    });
});

gulp.task('trim_test', function(cb) {
  require('./test/trim_test');
  console.log('Trim Test OK');
});

gulp.task('sleep', function(cb) {
  setTimeout(cb, 500);
});

gulp.task('cache_test_0', function(cb) {
  gulp.src('test/1/*.js', {base:'test/1'})
    .pipe(plumber())
    .pipe(gulp.dest('test/out/cache'))
    .on('error', console.log)
    .on('end', cb);
});

gulp.task('cache_test_1', function(cb) {
  gulp.src('test/out/cache/*.js', {base:'test/out/cache'})
    .pipe(plumber())
    .pipe(includeJs({cache:true}))
    .pipe(gulp.dest('test/out/cache_1'))
    .on('error', console.log)
    .on('end', function() {
      var a = require('./test/out/cache_1/a');
      expect(a.ABC).equal('ABCCC');
      console.log('Cache Test 1 OK');
      cb();
    });
});

gulp.task('cache_test_2', function(cb) {
  gulp.src('test/out/cache/*.js', {base:'test/out/cache'})
    .pipe(plumber())
    .pipe(includeJs({cache:true}))
    .pipe(gulp.dest('test/out/cache_2'))
    .on('error', console.log)
    .on('end', function() {
      expect(fs.existsSync('test/out/cache_2/a.js')).equal(false);
      console.log('Cache Test 2 OK');
      cb();
    });
});

gulp.task('cache_test_3_touch', function(cb) {
  gulp.src('test/out/cache/_b.js')
    .pipe(insert.append('var Blitzcrank = function(){ return \'X\'; }'))
    .pipe(gulp.dest('test/out/cache'))
    .on('error', console.log)
    .on('end', function() {
      cb();
    });
});

gulp.task('cache_test_3', function(cb) {
  gulp.src('test/out/cache/*.js', {base:'test/out/cache'})
    .pipe(plumber())
    .pipe(includeJs({cache:true}))
    .pipe(gulp.dest('test/out/cache_3'))
    .on('error', console.log)
    .on('end', function() {
      var a = require('./test/out/cache_3/a.js');
      expect(a.ABC).equal('AXCC');
      console.log('Cache Test 3 OK');
      cb();
    });
});

gulp.task('cache_test', function(cb) {
  runSequence('cache_test_0', 'cache_test_1', 'sleep', 'cache_test_2', 'sleep', 'cache_test_3_touch', 'cache_test_3', cb);
});

gulp.task('clean', function(cb) {
  gulp.src('test/out', {read:false})
    .pipe(clean())
    .on('error', console.log)
    .on('end', cb);
});

gulp.task('test', function() {
  gulp.start('test1');
  gulp.start('test2');
  gulp.start('test3');
  gulp.start('trim_test');
  gulp.start('cache_test');
});
