'use strict';

const gulp = require('gulp');
const exec = require('child_process').exec;
const runSequence = require('run-sequence');
const watch = require('gulp-watch');
const pug = require('gulp-pug');
const templateCache = require('gulp-angular-templatecache');
const path = require('path');
const sass = require('gulp-sass');

const tmplSrc = path.resolve(__dirname, './app/src/templates/**/*.pug');
const tmplDest = path.resolve(__dirname, './app/src/angular/');

const scssSrc = path.resolve(__dirname, './app/src/stylesheets/scss/main.scss');
const scssDest = path.resolve(__dirname, './app/src/stylesheets/css');
const isWin =  /^win/.test(process.platform);


gulp.task('templates', (cb) => {
	gulp.src(tmplSrc)
		.pipe(pug({client: false}))
		.on('error', function(error) {
			console.log(error);
			this.emit('end');
		})
		.pipe(templateCache({standalone: true, filename: 'app.templates.js'}))
		.on('error', function(error) {
			console.log(error);
			this.emit('end');
		})
		.pipe(gulp.dest(tmplDest))
		.on('end', () => {
			cb();
		});
});

gulp.task('stylesheets', (cb) => {
	gulp.src(scssSrc)
		.pipe(sass({outputStyle: 'nested'}).on('error', sass.logError))
		.pipe(gulp.dest(scssDest))
		.on('end', () => {
			cb();
		});
});

gulp.task('watch', (cb) => {
	watch([scssSrc, tmplSrc], () => {
		runSequence(['templates', 'stylesheets'], cb);
	});
});

gulp.task('start', (cb)=>{
	let command = '';
	if(isWin){
		command = 'node_modules\\.bin\\electron-forge start -- dev';
	} else {
		command = './node_modules/.bin/electron-forge start -- dev';
	}
	exec(command, (err)=>{
		cb(err);
	})
});

gulp.task('make', (cb)=>{
	let command = '';
	if(isWin){
		command = 'node_modules\\.bin\\electron-forge make';
	} else {
		command = './node_modules/.bin/electron-forge make';
	}
	exec(command, (err)=>{
		cb(err);
	})
});

gulp.task('default', (cb) => {
	runSequence(['templates', 'stylesheets'], cb);
});
