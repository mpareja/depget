var glob = require('glob'),
  path = require('path'),
  run = require('paprika').run,
  async = require('async'),
  fs = require('fs'),
  cp = require('child_process'),
  config = require('./package.json');

desc('Run JSLint on all javascript files.');
task('default', ['lint']);

desc('Run JSLint on all javascript files.');
task('lint', function () {
  var args = [
      path.join('node_modules', 'jslint', 'bin', 'jslint.js'),
      '--devel',
      '--node',
      '--vars',
      '--maxerr=100',
      '--indent=2',
      '--sloppy=true', // don't require "use strict" everywhere
      '--nomen=true', // don't give warnings for __dirname
      '--undef',
      '--plusplus',
      '--stupid', // enable Sync methods
      '--minusminus',
      '--'
    ],
    files = glob.sync('*.js');

  execute('node', args.concat(files), '*** JSLint passed. ***', '!!! JSLint FAILED. !!!');
}, { async: true });

desc('Bump the version patch number up.');
task('bump', function () {
  async.parallel([isMaster, isClean], function (err) {
    if (err) { return fail(err); }

    config.version = require('semver').inc(config.version, 'patch');
    fs.writeFile('package.json', JSON.stringify(config, null, '  '), function (err) {
      if (err) { return fail(err); }
      var msg = 'Bumped to version ' + config.version + '.';
      console.log(msg);
      cp.exec('git commit -am "' + msg + '"', mycomplete);
    });
  });

  function isMaster(cb) {
    expect('git symbolic-ref HEAD', 'refs/heads/master\n', 'Not on master branch', cb);
  }

  function isClean(cb) {
    expect('git status --porcelain', '', 'Uncommitted changes in working directory', cb);
  }

  function expect(cmd, expected, message, cb) {
    cp.exec(cmd, function (err, stdout) {
      if (err) { fail(err); }
      if (stdout.toString() === expected) {
        cb(null);
      } else {
        cb(new Error(message));
      }
    });
  }
}, { async: true });

function execute(cmd, args, successMessage, failureMessage, dontComplete) {
  run(cmd, args, function (code) {
    if (code === 0) {
      console.log(successMessage);
    } else {
      fail(failureMessage);
    }
    if (!dontComplete) {
      complete();
    }
  });
}

function mycomplete(err) {
  if (err) {
    fail(err);
  } else {
    complete();
  }
}
