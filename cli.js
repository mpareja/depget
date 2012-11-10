#!/usr/bin/env node
var async = require('async'),
  depget = require('./depget.js'),
  path = require('path');

var command = process.argv[2],
  args = process.argv.slice(3),
  pkg = require(path.join(process.cwd(), 'package.json')),
  dependencies = pkg.privateDependencies || {};

if (command === 'update') {
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
}



