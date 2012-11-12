#!/usr/bin/env node
var async = require('async'),
  depget = require('./depget.js'),
  path = require('path');

var command = process.argv[2],
  args = process.argv.slice(3),
  pkg = require(path.join(process.cwd(), 'package.json')),
  dependencies = pkg.privateDependencies || {};

if (command === 'publish') {
  if (pkg.registry) {
    var force = args.shift() === '--force',
      dg = depget(pkg.registry);

    dg.publish(force, function (err) {
      console.log(err
        ? 'Unable to publish package: ' + err
        : 'done.');
    });
  } else {
    console.log('Must specify the "registry" configuration option in your package.json. ' +
      'It should point at your private directory or file-share.');
  }
} else if (command === 'update') {
  var configs = Object.keys(dependencies)
    .filter(function (repo) {
      var deps = dependencies[repo];
      return deps && Object.keys(deps).length > 0;
    })
    .map(function (repo) {
      return {
        installer: depget(repo),
        deps: dependencies[repo]
      };
    });

  var installations = [];
  if (configs && configs.length > 0) {
    configs.forEach(function (config) {
      var repoInstalls = Object.keys(config.deps).map(function (dep) {
        return function (cb) {
          config.installer.install(dep, config.deps[dep], cb);
        };
      });
      installations = installations.concat(repoInstalls);
    });
  }

  if (installations.length > 0) {
    console.log('Installing %s packages.', installations.length);
    async.series(installations, function (err) {
      if (err) { console.log('Unable to install all packages: ' + err); }
      console.log('done.');
    });
  } else {
    console.log('Nothing to install.');
  }
} else {
  var msg = 'SYNTAX: depget <command> [opts...]\n\n' +
    'Commands:\n\n' +
    'update: install latest version of new and existing modules\n' +
    'publish: publish a .tgz file matching the current version to the custom registry\n' +
    '  --force: overwrite previously published package';

  console.log(msg);
}



