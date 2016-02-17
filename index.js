var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var queue = require('queue-async');
var Readable = require('stream').Readable;
var util = require('util');
var fs = require('fs');

util.inherits(ListStream, Readable);
function ListStream(bucket, key) {
  Readable.call(this);
  this.bucket = bucket;
  this.key = key;
  this.buffer = [];
  this.loaded = false;
}



function Prefixer(key) {
  var p4Regex = /^.*{prefix4}.*$/;
  var pRegex = /^.*{prefix}.*$/;
  this.key = key;

  if (pRegex.exec(key)) {
    this.base = 16;
  } else if (p4Regex.exec(key)) {
    this.base = 256;
  } else {
    this.base = 1;
  }
}

Prefixer.prototype.prefix = function(i, j) {
    function pad(str) {
        return str.length < 2 ? '0' + str : str;
    }
    return this.key.replace('{prefix}', i.toString(16) + j.toString(16))
        .replace('{prefix4}', pad(i.toString(16)) + pad(j.toString(16)));
}

ListStream.prototype._read = function() {
  if (this.buffer.length) return this.push(this.buffer.shift());
  else if (this.loaded) return this.push(null);

  var stream = this;
  var q = queue();
  var prefix;
  var prefixer = new Prefixer(stream.key);

  for (var i = 0; i < prefixer.base; i++) {
    for (var j = 0; j < prefixer.base; j++) {
      prefix = prefixer.prefix(i, j);
      q.defer(listObjects, stream, prefix);
    }
  }

  q.await(function(err) {
    if (err) return stream.emit('error', err);
    stream.loaded = true;
    stream.push(stream.buffer.shift());
  });
};

function list(bucket, key) {
  return new ListStream(bucket, key);
}

function copy(bucket, key, destination, callback) {
  var q = queue();
  var prefix;

  var prefixer = new Prefixer(key);

  for (var i = 0; i < prefixer.base; i++) {
    for (var j = 0; j < prefixer.base; j++) {
      prefix = prefixer.prefix(i, j);
      q.defer(copyObject, bucket, prefix, destination);
    }
  }

  q.awaitAll(function(err, items) {
    if (err) return callback(err);
    items = items.filter(function(item) {
      return !!item;
    });
    callback(null, items[0]);
  });
}

function copyObject(bucket, key, destination, callback) {
  var params = {
    Bucket: bucket,
    Key: key
  };

  s3.headObject(params, function(err, data) {
    if (err && err.statusCode === 404) return callback();
    if (err) return callback(err);
    s3.getObject(params)
      .createReadStream()
      .on('error', callback)
      .pipe(fs.createWriteStream(destination))
      .on('error', callback)
      .on('finish', function() {
        callback(null, key);
      });
  });
}

function listObjects(stream, prefix, callback) {
  function ls(marker) {
    var params = {
      Bucket: stream.bucket,
      Prefix: prefix
    };
    if (marker) params.Marker = marker;
    s3.listObjects(params, function(err, data) {
      if (err) return callback(err);
      data.Contents.forEach(function(item) {
        var mod = new Date(item.LastModified);
        item = [
          [ mod.getUTCFullYear(), pad(mod.getUTCMonth()), pad(mod.getUTCDate()) ].join('-') + ' ',
          [ pad(mod.getUTCHours()), pad(mod.getUTCMinutes()), pad(mod.getUTCSeconds()) ].join(':'),
          '\t' + item.Size,
          '\t' + item.Key,
          '\n'
        ].join('');
        stream.buffer.push(item);
      });
      if (data.IsTruncated) return ls(data.Contents.pop().Key);
      callback();
    });
  }

  ls();
}

function pad(num) {
  return ('00' + num).slice(-2);
}

module.exports = {
  ls: list,
  cp: copy,
  Prefixer: Prefixer
};
