var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var htmlreplace = require('gulp-html-replace');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify');
var streamify = require('gulp-streamify');

var env = {
  DEV: 'dev',
  PROD: 'PROD',
};

var config = {
  INDEX: './src/index.html',
  CSS: './src/css/**/*.css',
  CSS_OUT: 'main.css',
  JS_OUT: 'main.js',
  MINIFIED_JS_OUT: 'main.min.js',
  DEV_PATH: 'dev',
  DIST_PATH: 'dist',
  ENTRY_POINT: './src/js/main.js',
};

function getCopier(mode) {
  console.log(mode);
  var path = mode === env.DEV
    ? config.DEV_PATH
    : config.DIST_PATH;
  var output = mode === env.DEV
    ? config.JS_OUT
    : config.MINIFIED_JS_OUT;

  return function() {
    console.log(path);
    console.log(output);
    gulp.src(config.CSS)
      .pipe(concat(config.CSS_OUT))
      .pipe(gulp.dest(path));
    gulp.src(config.INDEX)
      .pipe(htmlreplace({'js': output}))
      .pipe(gulp.dest(path));
  }
}

/**
 * This is for the dev mode. 
 * Whenever there's change in any files, re-bundle it and 
 * copy everything to the./dev
 */
function watch() {
  // make sure when first time running gulp, 
  // it'll copy the index.html and the css files
  var copy = getCopier(env.DEV);
  copy();
  console.log('Copied index.html and css files');

  gulp.watch([config.INDEX, config.CSS], copy);

  var watcher  = watchify(browserify({
    entries: [config.ENTRY_POINT],
    transform: [reactify],
    debug: true,
    cache: {}, 
    packageCache: {}, 
    fullPaths: true,
  }));

  // make sure when first time running gulp, it'll bundle
  watcher.bundle()
    .pipe(source(config.JS_OUT))
    .pipe(gulp.dest(config.DEV_PATH))
    .on('update', function () {
      watcher.bundle()
        .pipe(source(config.JS_OUT))
        .pipe(gulp.dest(config.DEV_PATH));
      console.log('updated index.html and css files');
    });
  console.log('bundled js files');

}

/**
 * This is for the production mode.
 * When we finished developing, we minify, uglify it and
 * copy everything to the ./dist
 */
function build() {
  console.log('[start building]');
  var copy = getCopier(env.PROD);
  copy();
  console.log('...copied index.html and css files');

  browserify({
    entries: [config.ENTRY_POINT],
    transform: [reactify],
  })
  .bundle()
  .pipe(source(config.MINIFIED_JS_OUT))
  .pipe(streamify(uglify(config.MINIFIED_JS_OUT)))
  .pipe(gulp.dest(config.DIST_PATH));
  console.log('...bundled js files');

  console.log('[finish building]');
}

gulp.task('watch', watch);
gulp.task('build', build);

gulp.task('default', ['watch']);

