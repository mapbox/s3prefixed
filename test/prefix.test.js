var tape = require('tape');
var s3prefix = require('../lib/prix-fixe.js');
var s3prixfixe = require('..').ConvertStream;
var fs = require('fs');
var os = require('os');
var path = require('path');
var split = require('split')();

tape('[{prefix}] prefixer should return the correct prefixes', function(assert) {
  var prefixkey = '{prefix}/test';
  var prefixer = new s3prefix.Prefixer(prefixkey);
  var expected;
  var prefixes = [];
  assert.equal(prefixer.base, 16, 'Base should be 16')
  fs.readFile('./test/fixtures/prefix.txt', function(err, data) {
    expected = JSON.parse(data);
    for (var i = 0; i <= prefixer.base; i++) {
      for (var j = 0; j <= prefixer.base; j++) {
        prefixes.push(prefixer.prefix(i, j));
      }
    }
    assert.deepEqual(prefixes, expected, 'prefixes should be equivalent');
    assert.end();
  })
});

tape('[{prefix}] prefixer should return the correct max val', function(assert) {
  var prefixkey = '{prefix}/test';
  var prefixer = new s3prefix.Prefixer(prefixkey);
  assert.equal(prefixer.base, 16, 'Base should be256');
  assert.equal(prefixer.prefix(15, 15), 'ff/test');
  assert.end();
});

tape('[{badprefix}] prefixer return a base of 1 for bad prefixes', function(assert) {
  var prefixkey = '{yo}/test';
  var prefixer = new s3prefix.Prefixer(prefixkey);
  assert.equal(prefixer.base, 1, 'Base should be 1');
  assert.equal(prefixer.prefix(1, 1), prefixkey, 'bad prefix should not change')
  assert.end();
});

tape('[{prefix4}] prefixer should return the correct max val', function(assert) {
  var prefixkey = '{prefix4}/test';
  var prefixer = new s3prefix.Prefixer(prefixkey);
  assert.equal(prefixer.base, 256, 'Base should be256');
  assert.equal(prefixer.prefix(255, 255), 'ffff/test');
  assert.end();
});

tape('[{prefix4}] prefixer should pad correctly', function(assert) {
  var prefixkey = '{prefix4}/test';
  var prefixer = new s3prefix.Prefixer(prefixkey);
  assert.equal(prefixer.base, 256, 'Base should be 256');
  assert.equal(prefixer.prefix(1, 1), '0101/test');
  assert.end();
});

tape('[url parsing] url should be parsed correctly', function(assert) {
  var url = '{prefix}/hash/hashha/14/10/10';
  s3prefix.pathToZXY(url, function(err, zxy) {
    if (err) assert.ifError();
    assert.deepEqual(zxy, [14, 10, 10], 'should parse the correct zxy');
    assert.end();
  });
});

tape('[url parsing] incorrect url should error', function(assert) {
  var url = '{prefix}/hash/10/10';
  s3prefix.pathToZXY(url, function(err, zxy) {
    assert.equal(err.message, 'No match found for {prefix}/hash/10/10', 'should return the correct error');
    assert.end();
  });
});

tape('[prefix] should make the correct prefix for a given xy', function(assert) {
  var url = '{prefix}/hash/hashha/14/200/300';
  var x = 200;
  var y = 300;
  assert.equal(s3prefix.xyToPrefix(url, x, y), '8c/hash/hashha/14/200/300');
  assert.end();
});

tape('[prefix4] should make the correct prefix for a given xy', function(assert) {
  var url = '{prefix4}/hash/hashha/14/200/300';
  var x = 200;
  var y = 300;
  assert.equal(s3prefix.xyToPrefix(url, x, y), 'c82c/hash/hashha/14/200/300');
  assert.end();
});

tape('[prefixed] should no replace anything if no prefix present', function(assert) {
  var url = '{prepheex}/hash/hashha/14/200/300';
  var x = 200;
  var y = 300;
  assert.equal(s3prefix.xyToPrefix(url, x, y), '{prepheex}/hash/hashha/14/200/300');
  assert.end();
});

function testStream(fpath, callback) {
  var tmpdir = path.join(os.tmpdir(), Date.now() + 'parsedstream.txt');
  fs.createReadStream(fpath)
    .pipe(split)
    .pipe(s3prixfixe())
    .pipe(fs.createWriteStream(tmpdir))
    .on('finish', function() {
      return callback(null, tmpdir);
    })  
    .on('err', function(err) {
      return callback(err);
    });
}

tape('[url stream {prefix}] should parse + convert stream of urls', function(assert) {
  testStream('./test/fixtures/prefixtileurlstream.txt', function(err, createdpath) {
    var created = fs.readFileSync(createdpath).toString();
    var expected = fs.readFileSync('./test/expected/prefixtileurlstream.txt').toString();
    assert.deepEqual(created, expected, 'should stream + parse {prefix} tiles correctly')

    testStream('./test/fixtures/prefix4tileurlstream.txt', function(err, createdpath) {
      // y r u failing

      assert.end();
  })
  });
});