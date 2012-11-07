var cp = require('child_process'),
  fs = require('fs'),
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

    var regex = /^(.+)-(.+)\.zip$/;
    var packages = [];
    files.forEach(function (file) {
      var match = regex.exec(file);
      if (!match) return;

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
    cb(null, name + '-' + version + '.zip');
  });
};

// finds the maxSatisfying package and unzips in current directory
Depget.prototype.install = function (name, versionRange, cb) {
  var self = this,
    cwd = process.cwd(),
    modules = path.join(cwd, 'node_modules'),
    module = path.join(modules, name);

  if (!fs.existsSync(modules)) {
    fs.mkdirSync(modules);
    fs.mkdirSync(module);
  } else if (!fs.existsSync(module)) {
    fs.mkdirSync(module);
  }

  this.maxSatisfying(name, versionRange, function (err, package) { 
    if (err) { return cb(err); }
    var       unzip = path.join(__dirname, 'tools', 'unzip-x86.exe');
      src = path.join(self.repoDir, package),
      cmd = util.format('"%s" "%s" -d "%s"', unzip, src, module);

    var handle = cp.exec(cmd, function (err) {
      if (err) { return cb(new Error('Unable to extract package "' + name + '": ' + err)); }
      cb(null);
    });
    handle.stdout.pipe(process.stdout);
    handle.stderr.pipe(process.stderr);
  });
};
