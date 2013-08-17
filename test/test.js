
var link = require('../')
var join = require('path').join
var cp = require('child_process')
var tape = require('tape')

tape('link', function (t) {

  link(__dirname, join(__dirname, 'bin'), {}, function (err) {
    if(err) throw err
    t.end()
  })
})

tape('hi', function (t) {
  t.plan(2)

  var hi = cp.exec(join(__dirname, 'bin', 'hello'), [])

  hi.stdout.pipe(process.stdout)

  hi.stdout.once('data', function (data) {
    t.ok(/^Hello/.test(data.toString('utf8')))
  })

  hi.on('exit', function (code) {
    t.equal(code, 0, 'non-error exit')
    t.end()
  })
})

tape('bye', function (t) {
  t.plan(2)

  var bye = cp.exec(join(__dirname, 'bin', 'goodbye'), [])

  bye.stdout.pipe(process.stdout)

  bye.stdout.once('data', function (data) {
    t.ok(/^Goodbye/.test(data.toString('utf8')))
  })

  bye.on('exit', function (code) {
    t.equal(code, 1, 'error exit')
    t.end()
  })
})

