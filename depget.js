var cp = require('child_process'),
  fs = require('fs'),
  fse = require('fs-extra'),
  path = require('path'),
  semver = require('semver'),
  util = require('util');

function Depget(repoDir) {
  this.repoDir = repoDir;
}

module.exports = function (repoDir) {
  return new Depget(repoDir);
};

Depget.prototype.list = function (cb) {
  this.listAllVersions(function (err, packages) {
    if (err) { return cb(err); }
    cb(null, Object.keys(packages));
  });
};

Depget.prototype.listAllVersions = function (cb) {
  fs.readdir(this.repoDir, function (err, files) {
    if (err) { return cb(new Error('Unable to read repository: ' + err)); }

    var regex = new RegExp('^(.+)-(.+)\\.tgz');
    var packages = [];
    files.forEach(function (file) {
      var match = regex.exec(file);
      if (!match) { return; }

      var name = match[1],
        version = match[2];

      packages[name] = packages[name] || [];
      packages[name].push(version);
    });
    cb(null, packages);
  });
};

Depget.prototype.maxSatisfying = function (name, versionRange, cb) {
  this.listAllVersions(function (err, packages) {
    if (err) { return cb(err); }
    var versions = packages[name];
    if (!versions) { return cb('Package not found: ' + name); }

    var version = semver.maxSatisfying(versions, versionRange);
    cb(null, name + '-' + version + '.tgz');
  });
};

// finds the maxSatisfying package and installs in current directory
Depget.prototype.install = function (name, versionRange, cb) {
  var self = this;
  this.maxSatisfying(name, versionRange, function (err, thepackage) {
    if (err) { return cb(err); }
    var module = path.join(self.repoDir, thepackage),
      cmd = util.format('npm install "%s"', module);

    exec(cmd, function (err) {
      if (err) { return cb(new Error('Unable to install package "' + name + '": ' + err)); }
      cb(null);
    });
  });
};

Depget.prototype.publish = function (force, callback) {
  try {
    var pkg = require(path.join(process.cwd(), 'package.json'));
  } catch (e) {
    callback(new Error('Unable to load package.json'));
    return;
  }

  var self = this,
    file = util.format('%s-%s.tgz', pkg.name, pkg.version),
    dst = path.join(self.repoDir, file);

  exec('npm pack', function (err) {
    if (err) { return callback(err); }

    fs.exists(dst, function (exists) {
      if (!exists) {
        publish(null);
      } else if (force) {
        fs.unlink(file, publish);
      } else {
        callback(new Error('This package has already been published. Use --force to override.'));
        return;
      }
    });
  });

  function publish(err) {
    if (err) { return callback(err); }
    fse.copy(file, dst, function (err) {
      callback(!err ? null : new Error('Failed pushing file to registry.'));
    });
  }
};

function exec(cmd, cb) {
  var handle = cp.exec(cmd, cb);
  handle.stdout.pipe(process.stdout);
  handle.stderr.pipe(process.stderr);
}
