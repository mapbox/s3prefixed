#!/usr/bin/env node

var url = require('url');
var path = require('path');
var s3prefixed = require('..');
var command = process.argv[2];
var uri = process.argv[3];
var destination = process.argv[4];

if (command !== 'ls' && command !== 'cp') {
  console.error('Command must be one of ls or cp');
  process.exit(1);
}

if (!uri) {
  console.error('Error: Must specify an s3 url');
  process.exit(1);
}

uri = url.parse(uri);
if (uri.protocol !== 's3:') {
  console.error('Error: Must specify an s3 url');
  process.exit(1);
}
if (uri.pathname === '/') {
  console.error('Error: Must specify a key in the s3 url');
  process.exit(1);
}
if (uri.pathname.indexOf('{prefix}') === -1 &&  uri.pathname.indexOf('{prefix4}') === -1) {
  console.error('Error: Must specify the location of the {prefix} in the s3 url');
  process.exit(1);
}

if (command === 'ls') {
  s3prefixed.ls(uri.hostname, uri.pathname.slice(1))
    .on('error', function(err) {
      console.error(err);
      process.exit(1);
    })
    .on('end', function() {
      process.exit(0);
    }).pipe(process.stdout);

}

if (command === 'cp') {
  if (!destination) destination = './' + path.basename(uri.pathname);

  destination = path.resolve(destination);
  s3prefixed.cp(uri.hostname, uri.pathname.slice(1), destination, function(err, key) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('Copied s3://%s/%s to %s', uri.hostname, key, destination);
  });
}
