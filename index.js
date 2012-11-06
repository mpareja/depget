var fs = require('fs'),
  semver = require('semver');

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
      var match = regex.exec(file),
        name = match[1],
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
