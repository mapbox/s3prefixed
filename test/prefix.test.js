var tape = require('tape');
var s3prefix = require('../lib/prix-fixe.js');
var fs = require('fs');

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