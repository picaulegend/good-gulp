var gulp = require('gulp');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');
var plugins = require('gulp-load-plugins')();
var revdel = require('gulp-rev-delete-original');
var del = require('del');
var AWS = require('aws-sdk');

/* work, build, publish */
gulp.task('default', function(callback) {
  runSequence(['sass', 'browserSync'], 'watch',
    callback
  )
})

gulp.task('build', function(callback) {
  runSequence('clean:dist', ['html', 'css', 'js', 'img', 'misc'], 'revreplace',
    callback
  )
})




/* browser */
gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: './src/'
    }
  })
})

/* watchers */
gulp.task('watch', function() {
  gulp.watch('src/sass/**/*.scss', ['sass']);
  gulp.watch('src/**/*.html', browserSync.reload);
  gulp.watch('src/js/**/*.js', browserSync.reload);
})

/* cleaning */
gulp.task('clean:dist', function() {
  return del.sync('dist');
})

/* revving */
gulp.task("revision", function(){
  return gulp.src(["dist/**/*.css", "dist/**/*.js", "dist/**/*.+(png|jpg|jpeg|gif|svg)"])
    .pipe(plugins.rev())
    .pipe(revdel())
    .pipe(gulp.dest('dist'))
    .pipe(plugins.rev.manifest())
    .pipe(gulp.dest('dist'))
})

gulp.task("revreplace", ["revision"], function(){
  var manifest = gulp.src("dist/rev-manifest.json");

  return gulp.src("dist/index.html")
    .pipe(plugins.revReplace({manifest: manifest}))
    .pipe(gulp.dest("dist"));
});


/* html */
gulp.task('html', function() {
  return gulp.src('src/*.html')
  	.pipe(plugins.htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist/'))
})

/* sass */
gulp.task('sass', function() {
  return gulp.src('src/sass/**/*')
  	.pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass())
    .pipe(plugins.autoprefixer())
    .pipe(plugins.sourcemaps.write('/maps/'))
    .pipe(gulp.dest('src/css/'))
    .pipe(browserSync.reload({
      stream: true
    }));
})

/* css */
gulp.task('css', function() {
	return gulp.src('src/css/**/*')
		.pipe(plugins.changed('dist/css'))
		.pipe(plugins.cleanCss())
		.pipe(gulp.dest('dist/css/'))
})

/* js */
gulp.task('js', function() {
  return gulp.src('src/js/**/*')
    .pipe(gulp.dest('dist/js/'))
})

/* img */
gulp.task('img', function() {
  return gulp.src('src/img/**/*')
  	.pipe(plugins.changed('dist/img'))
  	.pipe(plugins.image())
    .pipe(gulp.dest('dist/img/'))
})

/* misc */
gulp.task('misc', function() {
  return gulp.src('src/misc/**/*')
  	.pipe(plugins.changed('dist/misc'))
    .pipe(gulp.dest('dist/misc/'))
})







gulp.task('publish', function() {
  var publisher = plugins.awspublish.create({
    params: {
     Bucket: ''
  },
  credentials: new AWS.SharedIniFileCredentials({profile: 'default'})
  });
 
  var headers = {
    'Cache-Control': 'max-age=315360000, no-transform, public'
  };
 
  return gulp.src('./dist/**/*') 
    .pipe(plugins.awspublish.gzip())
    .pipe(publisher.publish(headers))
    .pipe(publisher.cache())
    .pipe(plugins.awspublish.reporter());
});