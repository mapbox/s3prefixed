var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var queue = require('queue-async');
var Readable = require('stream').Readable;
var Transform = require('stream').Transform;
var util = require('util');
var fs = require('fs');
var util = require('util');
var s3PrixeFixe = require('./lib/prix-fixe.js');

util.inherits(ListStream, Readable);
function ListStream(bucket, key) {
  Readable.call(this);
  this.bucket = bucket;
  this.key = key;
  this.buffer = [];
  this.loaded = false;
}

ListStream.prototype._read = function() {
  if (this.buffer.length) return this.push(this.buffer.shift());
  else if (this.loaded) return this.push(null);

  var stream = this;
  var q = queue(10);
  var prefix;
  var prefixer = new s3PrixeFixe.Prefixer(stream.key);

  for (var i = 0; i < prefixer.base; i++) {
    for (var j = 0; j < prefixer.base; j++) {
      prefix = prefixer.prefix(i, j);
      q.defer(listObjects, stream, prefix);
    }
  }

  q.await(function(err) {
    if (err) return stream.emit('error', err);
    stream.loaded = true;
    stream.push(stream.buffer.shift() || null);
  });
};

function list(bucket, key) {
  return new ListStream(bucket, key);
}

function copy(bucket, key, destination, callback) {
  var q = queue(10);
  var prefix;

  var prefixer = new s3PrixeFixe.Prefixer(key);

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


util.inherits(ConvertStream, Transform);

function ConvertStream() {
  Transform.call(this);
}

ConvertStream.prototype._transform = function(chunk, enc, callback) {
  var ConvertStream = this;
  if (!chunk.toString()) { return callback() }
  chunk = chunk.toString();
  s3PrixeFixe.pathToZXY(chunk, function(err, zxy) {
    if (err) callback(err);
    var prefix = s3PrixeFixe.xyToPrefix(chunk, zxy[1], zxy[2]);
    ConvertStream.push(prefix.toString() + '\n');
    return callback();
  });
};

module.exports = {
  ls: list,
  cp: copy,
  Prefixer: s3PrixeFixe.Prefixer,
  ConvertStream: function() { return new ConvertStream(); }
};
