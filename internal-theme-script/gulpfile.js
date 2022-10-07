const gulp = require('gulp');
const changed = require('gulp-changed');
const del = require('del');
const env = require('gulp-env');
const notify = require('gulp-notify');
const GulpSSH = require('gulp-ssh');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const rimraf = require('gulp-rimraf');
const cmq = require('gulp-combine-media-queries');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const cache = require('gulp-cache');
const imagemin = require('gulp-imagemin');

var cfg = require('./gulpconfig.json');

// Help manual for gulp script, could add more information
gulp.task('default', (done) => {
	console.log('Use gulp commands for updating this plugin:');
	console.log('gulp clean: clean the dist folder');
	console.log('gulp init: initialize dist folder');
	console.log('gulp sass: compile, autoprefix and minify sass files');
	console.log('gulp scripts: compile and minify JavaScript files');
	console.log('gulp deploy: deploy changed files to remote SFTP');
	console.log('gulp watch: watch src and auto deploy all changes');
	done();
});

// Src for all files except dev (grunt, package.json, node_modules) and non-compiled assets (scss, js, images)
const src = [
	'src/**',
	'!src/grunt-settings.js',
	'!src/Gruntfile.js',
	'!src/index.php.old',
	'!src/package-lock.json',
	'!src/package.json',
	'!src/old',
	'!src/old/**',
	'!src/scss',
	'!src/scss/**',
	'!src/sourcejs',
	'!src/sourcejs/**',
	'!src/sourceimages/**',
	'!src/node_modules',
	'!src/node_modules/**'
];

// A source watching just the scss folder
const scssSrc = [
	'src/scss/*.scss',
];

// A source watching just the scripts
const scriptSrc = [
	'src/sourcejs/*.js',
];

// A source watching just images
const imageSrc = [
	'src/sourceimages/**/*',
];

let browserList = [
	'last 2 version',
	'> 1%',
	'ie >= 11',
	'last 1 Android versions',
	'last 1 ChromeAndroid versions',
	'last 2 Chrome versions',
	'last 2 Firefox versions',
	'last 2 Safari versions',
	'last 2 iOS versions',
	'last 2 Edge versions',
	'last 2 Opera versions'
];

gulp.task('sass', () => {
	return gulp.src(scssSrc, { allowEmpty: true })
		.pipe(plumber({
			errorHandler: (err) => {
				console.log(err);
				this.emit('end');
			}
		}))
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sass({ errLogToConsole: true }))
		.pipe(autoprefixer(browserList))
		.pipe(sourcemaps.write(undefined, { sourceRoot: null }))
		.pipe(gulp.dest('src/css'));
});

gulp.task('minifycss', () => {
	return gulp.src('src/css/*.css')
		.pipe(cleanCSS({ compatibility: '*' }))
		.pipe(plumber({
			errorHandler: (err) => {
				console.log(err);
				this.emit('end');
			}
		}))
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest('src/css'))
});

gulp.task('cleancss', () => {
	return gulp.src('src/css/*.css', { read: false })
		.pipe(rimraf());
});

gulp.task('styles', gulp.series('cleancss', 'sass', 'minifycss'));

gulp.task('scripts', () => {
	return gulp.src(scriptSrc)
		.pipe(plumber({
			errorHandler: (err) => {
				console.log(err);
				this.emit('end');
			}
		}))
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(concat('main.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('src/js'));
});

gulp.task('images', () => {
	return gulp.src(imageSrc)
		.pipe(
			cache(
				imagemin([
					imagemin.gifsicle({ interlaced: true }),
					imagemin.jpegtran({ progressive: true }),
					imagemin.optipng({ optimizationLevel: 3 }),
					imagemin.svgo({
						plugins: [{ removeViewBox: true }, { cleanupIDS: false }]

					})
				])
			)
		)
		.pipe(gulp.dest('src/images'));
});

gulp.task('clearCache', (done) => {
	return cache.clearAll(done);
});

gulp.task('watchStyles', () => {
	return gulp.watch(scssSrc, gulp.series('styles', 'deploy'));
});

gulp.task('watchImages', () => {
	return gulp.watch(imageSrc, gulp.series('images', 'deploy'));
});

gulp.task('watchScripts', () => {
	return gulp.watch(scriptSrc, gulp.series('scripts', 'deploy'));
});

gulp.task('watchElse', () => {
	return gulp.watch(src, gulp.parallel('deploy'));
});

gulp.task('init', () => {
	return gulp.src(src)
		.pipe(gulp.dest('dist'));
});

gulp.task('watch', gulp.parallel('init', 'watchStyles', 'watchImages', 'watchScripts', 'watchElse'));

gulp.task('deploy', () => {
	let stream = gulp.src(src)
		.pipe(changed('dist'))
		.pipe(gulp.dest('dist'));

	let config = {
		host: cfg.sftp.host,
		port: cfg.sftp.port,
		username: cfg.sftp.user,
		password: cfg.sftp.pass
	}

	let gulpSSH = new GulpSSH({
		ignoreErrors: false,
		sshConfig: config
	});

	stream = stream.pipe(gulpSSH.dest('/wp-content/themes/konstruct/'));

	return stream.pipe(notify("Successfully uploaded file: <%= file.relative %>."));
});