var gulp = require('gulp');
var runSequence = require('run-sequence');
var merge = require('merge2');
var del = require('del');

var fs = require('fs');

var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json', {
  declaration: true
});


gulp.task('default', function () {
  runSequence(
    'clean',
    'typescript'
  );
});

gulp.task('clean', function () {
  return del([
    'lib/**/*'
  ]);
});

gulp.task('typescript', function () {
  const tsResult = tsProject.src()
    .pipe(tsProject());

  return merge([
    tsResult.dts.pipe(gulp.dest('src/typings')),
    tsResult.js.pipe(gulp.dest('lib'))
  ]);
});
