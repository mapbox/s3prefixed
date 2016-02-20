module.exports = {
    pad: pad,
    xyToPrefix: xyToPrefix,
    pathToZXY: pathToZXY,
    Prefixer: Prefixer,
    prefixToXY: prefixToXY
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

function pad(str, padding) {
    return str.length < padding ? '0' + str : str;
}

function xyToPrefix(x, y, type) {
    var prefixMapper = {
        prefix: {
            base: 16,
            padding: 1
        },
        prefix4: {
            base: 256,
            padding: 2
        }
    };
    
    return '' + pad(
            (x % prefixMapper[type].base).toString(16), prefixMapper[type].padding
        ) + pad(
            (y % prefixMapper[type].base).toString(16), prefixMapper[type].padding
        );
}

function pathToZXY(path, callback) {
    var zxymatch = /[0-9]+\/[0-9]+\/[0-9]+/;
    var matched = zxymatch.exec(path);
    if (!matched) return callback(new Error('No match found for ' + path));

    return callback(null, matched[0].split('/').map(function(a) {
        return parseInt(a);
    }));
}

function prefixToXY(prefix) {
    if (prefix.length !== 4 && prefix.length !== 2) throw new Error('Only 2 [{prefix}] and 4 [{prefix4}] length prefixes supported');

    return [prefix.length / 2, prefix.length].map(function(a) {
        return parseInt(prefix.substring(a - prefix.length / 2, a), 16);
    });
}