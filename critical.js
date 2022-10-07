const gulp = require('gulp');
const changed = require('gulp-changed');
const ftp = require('vinyl-ftp');
const del = require('del');
const env = require('gulp-env');
const notify = require('gulp-notify');
const GulpSSH = require('gulp-ssh');
const autoprefixer = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const sass = require('gulp-sass');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const penthouse = require('gulp-penthouse');
const postcss = require('gulp-postcss');
const webp = require('gulp-webp');
const uncss = require('postcss-uncss');

const urlList = require('./pageList.json');

sass.compiler = require('node-sass');

env('.env.json');
const childTheme = process.env.CHILD_THEME;
const devStyle = process.env.DEV_STYLESHEET_NAME;
const sftpConfig = {
	type: process.env.TYPE.toUpperCase(),
	host: process.env.HOST,
	port: process.env.PORT || (type == 'SFTP' ? 22 : 21),
	user: process.env.USER,
	pass: process.env.PASS,
	key: process.env.KEY,
	remotePath: process.env.REMOTE_PATH,
};

const src = [
	'src/**',
	'!src/**/sass/**',
	'!src/**/main.css',
	'!src/**/sourceJs/**',
	'!src/**/js/main.min.js',
];

gulp.task('default', (done) => {
	console.log('Use gulp commands for updating this plugin:');
	console.log('gulp clean: clean the dist folder');
	console.log('gulp init: initialize dist folder');
	console.log('gulp sass: compiles sass files');
	console.log('gulp deploy: deploy changed files to remote SFTP');
	console.log('gulp watch: watch src and auto deploy all changes');
	console.log('gulp critical: runs critical. Under development.');
	console.log('gulp watchDev: watches and deploys changes while respecting distinct style sheets');
	done();
});

gulp.task('clean', () => {
	return del('dist/**/*.*');
});

gulp.task('init', () => {
	return gulp.src(['src/**/*.*', '!src/**/sass/**', '!src/**/sourceJs/**'])
		.pipe(gulp.dest('dist'));
});

gulp.task('webp', function () {
	return gulp
		.src(`./newImages/**`, `!./newImages/**.wepb`)
	.pipe(webp())
	.pipe(gulp.dest(`./newImages/`));
});

gulp.task('generateCritical', function () {
	function specificCritical(page, postCssPlugins) {
		console.log(page.url);
		console.log(page.name);

		return gulp
			.src(`./src/themes/${childTheme}/assets/css/main.css`)
			.pipe(postcss(postCssPlugins))
			.pipe(
				penthouse({
					out: `critical-${page.name}.css`,
					url: `https://konstructdigital.com${page.url}`,
					width: 2000,
					height: 1100,
					keepLargerMediaQueries: true,
					userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
				}),
			)
			// .pipe(
			// 	cleanCss({ debug: true }, (details) => {
			// 		console.log(`${details.name}: ${details.stats.originalSize}`);
			// 		console.log(`${details.name}: ${details.stats.minifiedSize}`);
			// 	}),
			// )
			.pipe(
				rename(function (path) {
					path.basename = `critical-${page.name}`;
					path.extname = '.php';
				}),
			)
			.pipe(gulp.dest(`./src/themes/${childTheme}/template-parts/critical/critical`));
	}

	function iterateCritical() {
		let interval = 1;

		for (let page in urlList) {
			var postCssPlugins = [
				uncss({
					html: [`https://www.konstructdigital.com/${urlList[page].url}`],
				}),
			];
			setTimeout(() => {
				specificCritical(urlList[page], postCssPlugins);
			}, (1000 * interval));
			interval += 1;
		}
	}

	return iterateCritical();
});

gulp.task('deployCritical', deploy([`src/themes/${childTheme}/assets/css/critical/**`], `src/themes/${childTheme}/assets/css/critical/`));

gulp.task('critical', function() {
	gulp.series('generateCritical', 'deployCritical');
})

gulp.task('devSass', function () {
	console.log('Starting Dev Sass');
	return gulp.src([`./src/themes/${childTheme}/assets/sass/dev-main.scss`])
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer({
			cascade: false,
			grid: true,
		}))
		.pipe(rename(function (path) {
			path.basename = `dev-${devStyle}`;
		}))
		.pipe(gulp.dest(`./src/themes/${childTheme}/assets/css/`));
});

gulp.task('adminSass', function () {
	console.log('Compiling Admin Styles');
	return gulp.src(`./src/themes/${childTheme}/assets/sass/admin/admin.scss`)
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer({
			cascade: false,
			grid: true,
		}))
		.pipe(cleanCss({ debug: true }, (details) => {
			console.log(`${details.name}: ${details.stats.originalSize}`);
			console.log(`${details.name}: ${details.stats.minifiedSize}`);
		}))
		.pipe(gulp.dest(`./src/themes/${childTheme}/assets/css/`));
});

gulp.task('sass', function () {
	console.log('Compiling CSS from Sass files');
	return gulp.src(`./src/themes/${childTheme}/assets/sass/main.scss`)
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer({
			cascade: false,
			grid: true,
		}))
		.pipe(cleanCss({ debug: true }, (details) => {
			console.log(`${details.name}: ${details.stats.originalSize}`);
			console.log(`${details.name}: ${details.stats.minifiedSize}`);
		}))
		.pipe(gulp.dest(`./src/themes/${childTheme}/assets/css/`));
});

gulp.task('scripts', function () {
	console.log('Compiling JS');
	return gulp.src([`src/themes/${childTheme}/assets/sourceJs/**/*.js`, `!src/themes/${childTheme}/assets/sourceJs/devMain.js`, `!src/themes/${childTheme}/assets/sourceJs/pageSpecific/**`])
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(concat('main.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest(`./src/themes/${childTheme}/assets/js/`));
});

gulp.task('devScripts', function () {
	console.log('Compiling JS');
	return gulp.src([`src/themes/${childTheme}/assets/sourceJs/**/*.js`, `!src/themes/${childTheme}/assets/sourceJs/devMain.js`, `!src/themes/${childTheme}/assets/sourceJs/pageSpecific/**`])
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(concat('main.min.js'))
		.pipe(gulp.dest(`./src/themes/${childTheme}/assets/js/`));
});

gulp.task('pageSpecificScripts', function () {
	console.log('Compiling JS');
	return gulp.src([`src/themes/${childTheme}/assets/sourceJs/page-specific/**/*.js`, `src/themes/${childTheme}/assets/sourceJs/page-specific/**/slick.js`])
		.pipe(babel({
			presets: ['@babel/env']
		}))
		// .pipe(uglify())
		.pipe(gulp.dest(`./src/themes/${childTheme}/assets/js/page-specific/`));
});

gulp.task('watchAdminSass', () => {
	console.log('Watching admin sass files for changes...');
	return gulp.watch(['src/**/sass/admin/**/*.scss'], gulp.series('adminSass', 'deployAdminCSS'));
});
gulp.task('watchNonSass', () => {
	console.log('Watching src files for changes...');
	return gulp.watch(src, gulp.series('deploy'));
});
gulp.task('watchSass', () => {
	console.log('Watching sass files for changes...');
	return gulp.watch(['src/**/sass/**/*.scss', '!src/**/sass/admin/**'], gulp.series('sass', 'deployCSS'));
});
gulp.task('watchJs', () => {
	console.log('Watching sourceJs files for changes...');
	return gulp.watch(['src/**/sourceJs/**/*.js'], gulp.series('scripts', 'deployJs'));
});
gulp.task('watch', gulp.parallel('init', 'watchNonSass', 'watchSass', 'watchJs', 'watchAdminSass'));

// Watch Dev Scripts
gulp.task('watchDevJs', () => {
	console.log('Watching sourceJs files for changes...');
	return gulp.watch(['src/**/sourceJs/**/*.js'], gulp.series('devScripts', 'deployJs'));
});
gulp.task('watchDevSass', () => {
	console.log('Watching dev sass files for changes...');
	return gulp.watch(['src/**/sass/**/*.scss', '!src/**/sass/admin/**'], gulp.series('devSass', 'deployDevCSS'));
});
gulp.task('watchDev', gulp.parallel('init', 'watchNonSass', 'watchDevSass', 'watchDevJs', 'watchAdminSass'));

gulp.task('deploy', deploy(['src/**', '!src/**/sass/**', '!src/**/sourceJs/**']));
gulp.task('deployJs', deploy(`src/themes/${childTheme}/assets/js/**.js`, `/themes/${childTheme}/assets/js/`));
gulp.task('deployCSS', deploy(`src/themes/${childTheme}/assets/css/main.css`, `/themes/${childTheme}/assets/css/`));
gulp.task('deployDevCSS', deploy(`src/themes/${childTheme}/assets/css/dev-${devStyle}.css`, `/themes/${childTheme}/assets/css/`));
gulp.task('deployAdminCSS', deploy(`src/themes/${childTheme}/assets/css/admin.css`, `/themes/${childTheme}/assets/css/`));

function deploy(streamTarget, destTarget = '') {
	return function properDeploy() {
		let stream = gulp.src(streamTarget)
			.pipe(changed('dist'))
			.pipe(gulp.dest('dist'));

		if (sftpConfig.type == 'SFTP') {
			let options = {
				host: sftpConfig.host,
				port: sftpConfig.port,
				username: sftpConfig.user,
				password: sftpConfig.pass
			}
			let gulpSSH = new GulpSSH({
				ignoreErrors: false,
				sshConfig: options
			});
			stream = stream.pipe(gulpSSH.dest(`${sftpConfig.remotePath}${destTarget}`));
		} else {
			let remote = ftp.create({
				host: sftpConfig.host,
				port: sftpConfig.port,
				user: sftpConfig.user,
				pass: sftpConfig.pass,
				parallel: 1,
			});
			stream = stream.pipe(remote.dest(`${sftpConfig.remotePath}${destTarget}`));
		}
		return stream.pipe(notify("Successfully uploaded file: <%= file.relative %>."));
	};
};