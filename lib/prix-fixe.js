module.exports = {
  pad: pad,
  xyToPrefix: xyToPrefix,
  pathToZXY: pathToZXY,
  Prefixer: Prefixer
}

function Prefixer(key) {
  var p4Regex = /^.*{prefix4}.*$/;
  var pRegex = /^.*{prefix}.*$/;
  this.key = key;
  this.base;
  if (pRegex.exec(key)) {
  this.base = 16;
  } else if (p4Regex.exec(key)) {
  this.base = 256;
  } else {
  this.base = 1;
  }
}

Prefixer.prototype.prefix = function(i, j) {
  return this.key.replace('{prefix}', i.toString(16) + j.toString(16))
    .replace('{prefix4}', pad(i.toString(16), 2) + pad(j.toString(16), 2));
}

function xyToPrefix(key, x, y) {
  return key.replace('{prefix}', (x % 16).toString(16) + (y % 16).toString(16))
    .replace('{prefix4}', pad((x % 256).toString(16), 2) + pad((y % 256).toString(16), 2));
}

function pad(str, padding) {
  return str.length < padding ? '0' + str : str;
}

function pathToZXY(path, callback) {
  var zxymatch = /[0-9]+\/[0-9]+\/[0-9]+/;
  var matched = zxymatch.exec(path);
  if (!matched) return callback(new Error('No match found for ' + path));

  return callback(null, matched[0].split('/').map(function(a) {
    return parseInt(a);
  }));
}