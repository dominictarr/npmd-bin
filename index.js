#! /usr/bin/env node
//create executables from package.
var fs      = require('fs')
var path    = require('path')
var cont    = require('continuable')
var cpara   = require('continuable-para')
var cseries = require('continuable-series')
var mkdirp  = require('mkdirp')

function readJson (file, cb) {
  fs.readFile(file, 'utf8', function (err, data) {
    if(err) return cb(err)
    var obj
    try { obj = JSON.parse(data) }
    catch (_err) { err = _err }
    cb(err, obj)
  })
}

function map (obj, iter) {
  var a = {}
  for(var k in obj)
    a[k] = iter(obj[k], k, obj)
  return a
}

var linkBin = module.exports = cont.to(function (dir, binRoot, opts, cb) {
  if(!cb) cb = opts, opts = {}
  mkdirp(binRoot, function () {
    readJson(path.resolve(dir, 'package.json'), function (err, pkg) {
      if(err) return cb(err.code === 'ENOENT' ? null : err)

      //if pkg is just string, then assume name of bin is name of package.
      var bin = pkg.bin || {}
      if('string' === typeof pkg.bin) {
        bin = {}
        bin[pkg.name] = pkg.bin
      }

      cpara(map(bin, function (v, k) {
        var dest = path.resolve(binRoot, k)
        var src  = path.resolve(dir, v)

        if(opts.verbose)
          console.error('link', dest, '->', src)

        return cseries(
          cont.to(fs.chmod)(src, 0777),
          function (cb) {
            fs.unlink(dest, function () { cb() })
          },
          cont.to(fs.symlink)(src, dest)
        )
      }))(cb)
    })
  })
})

var all = module.exports.all = cont.to(function (dirs, binRoot, opts, cb) {
  cpara(map(dirs, function (dir) {
    return linkBin(dir, binRoot, opts)
  })) (cb)
})

if(!module.parent) {
  var config = require('npmd-config')
  if(config.version) {
    console.log(require('./package').version)
    process.exit(0)
  }

  if(!config._.length) {
    console.log('expected at least on directory link bins from')
    process.exit(1)
  }

  var modules = config._.map(function (e) {
    if(/^[./]/.test(e)) return e
    return config.global
      ? path.join(config.prefix, 'lib', 'node_modules', e)
      : path.join(process.cwd(), 'node_modules', e)
  })

  all(modules, config.bin, config, function (err, data) {
    if(err) throw err
  })
}
