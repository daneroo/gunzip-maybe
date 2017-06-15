var tape = require('tape')
var zlib = require('zlib')
var concat = require('concat-stream')
var fs = require('fs')
var gunzip = require('./')

tape('deflated input', function (t) {
  fs.createReadStream(__filename)
    .pipe(zlib.createDeflate())
    .pipe(gunzip())
    .pipe(concat(function (data) {
      t.same(data, fs.readFileSync(__filename))
      t.end()
    }))
})

tape('deflated multiple times', function (t) {
  fs.createReadStream(__filename)
    .pipe(zlib.createDeflate())
    .pipe(zlib.createDeflate())
    .pipe(gunzip())
    .pipe(concat(function (data) {
      t.same(data, fs.readFileSync(__filename))
      t.end()
    }))
})

tape('gunzipped input', function (t) {
  fs.createReadStream(__filename)
    .pipe(zlib.createGzip())
    .pipe(gunzip())
    .pipe(concat(function (data) {
      t.same(data, fs.readFileSync(__filename))
      t.end()
    }))
})

tape('gunzipped multiple times', function (t) {
  fs.createReadStream(__filename)
    .pipe(zlib.createGzip())
    .pipe(zlib.createGzip())
    .pipe(gunzip())
    .pipe(concat(function (data) {
      t.same(data, fs.readFileSync(__filename))
      t.end()
    }))
})

tape('regular input', function (t) {
  fs.createReadStream(__filename)
    .pipe(gunzip())
    .pipe(concat(function (data) {
      t.same(data, fs.readFileSync(__filename))
      t.end()
    }))
})

const input = 'I am just a little bit of content'
tape(`zlib gzip|gunzip a buffer`, function (t) {
  zlib.gzip(input, function (err, buffer1) {
    if (err) { return t.end(err) }
    zlib.gunzip(buffer1, function (err, buffer2) {
      if (err) { return t.end(err) }
      t.same(buffer2.toString(), input, 'gzip|gunzip === identity')
      t.end()
    })
  })
})

tape('zlib.gunzip a truncated buffer', function (t) {
  zlib.gzip(input, function (err, gzBuf) {
    if (err) { return t.end(err) }

    const gzBufTruncated = gzBuf.slice(0, gzBuf.length / 2)
    zlib.gunzip(gzBufTruncated, function (err, buffer) {
      if (err) {
        t.same(err.message, 'unexpected end of file', 'expected error')
        return t.end()
      }
      // expect(buffer.toString()).to.equal(input)
      t.end(new Error('Should not happen'))
    })
  })
})

// Does not work on node:8.1
tape(`Handle error in truncated gunzip-maybe stream`, function (t) {
  const stream = require('stream')

  const gzip = gunzip()
  gzip.on('error', function (err) {
    t.same(err.message, 'unexpected end of file', 'expected error')
    t.end()
  })
  gzip.on('end', function () {
    t.end(new Error('Should not reach the end...'))
  })

  const readStream = new stream.PassThrough()
  readStream.pipe(gzip)

  zlib.gzip(input, function (err, gzBuf) {
    if (err) { return t.end(err) }

    const gzBufTruncated = gzBuf.slice(0, gzBuf.length / 2)
    readStream.end(gzBufTruncated)
  })
})
