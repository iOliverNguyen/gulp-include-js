var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');
var trim = require('./lib/trim');

var pluginName = 'include-js';
var magenta = gutil.colors.magenta;
var cyan = gutil.colors.cyan;

var caches = {};

function error(context, includedId, err) {
  err.message = 'Error in ' + cyan(context.filepath) + ': ' +
    (includedId? context.options.keyword + '("' + cyan(includedId) + '"): ': '') + err.message;
  err.filename = context.filepath;
  throw err;
}

function exec(s, id, stack) {

  var result = '';
  var r = new RegExp('(//[^\r\n]*)?([^\\s]+[ \\t\\v]*)?' + this.options.keyword + '\\s*\\( *[\'"]([^\'"]*)[\'"]\\s*\\)');
  var m = r.exec(s);
  while (m) {
    var isCmt = m[1];
    var inline = m[2] || '';
    var childId = m[3];

    // Resolve relative path
    if (childId[0] === '.') childId = path.join(path.join(path.dirname(id), childId));

    result += s.slice(0, m.index);
    if (isCmt) {
      result += m[0];

    } else try {
      var sinc = read.call(this, childId, stack);
      if (inline) sinc = trim(sinc);
      result += inline + sinc;

    } catch(e) {
      error(this, childId, e);
      return;
    }
    s = s.slice(m.index + m[0].length);
    m = r.exec(s);
  }
  return result + s;
}

function read(id, stack) {

  var filepath;
  if (this.options.exactName) {
    filepath = path.join(this.base, id);

  } else {
    var basename = path.basename(id);
    basename = basename[0] === '_'? basename : '_' + basename;
    basename = path.extname(basename) === this.options.ext? basename : basename + '.' + this.options.ext;

    filepath = path.join(this.base, path.dirname(id), basename);
  }

  var newStack = stack.concat([filepath]);

  if (stack.indexOf(filepath) >= 0) throw new Error('Circular ' +
    newStack.map(function(i){ return magenta(i); }).join(', '));

  this.includes[filepath] = this.includes[filepath] || time(filepath);

  var s = readIncFile.call(this, filepath);
  if (this.options.recursive) s = exec.call(this, s, id, newStack);
  if (this.options.transform) s = this.options.transform(s);
  return s;
}

function readIncFile(filepath) {
  var isCache = this.options.cache;
  if (isCache) {
    var cache = this.cacheIncludes[filepath];
    if (cache && time(filepath) === cache.time) return cache.content;
  }

  var s = fs.readFileSync(filepath, {encoding: 'utf8'});
  if (isCache) this.cacheIncludes[filepath] = {
    time: time(filepath),
    content: s
  };

  return s;
}

function time(filepath) {
  try {
    var stat = fs.statSync(filepath);
    return stat? stat.mtime.getTime() : null;

  } catch(e) {
    return null;
  }
}

function isDirty(filepath, cacheModules, cacheIncludes) {
  var cache = cacheModules[filepath];
  if (!cache || cache.time !== time(filepath)) return true;
  if (!cache.includes) return true;
  for (var incFile in cache.includes) {
    if (cacheIncludes[incFile].time !== time(incFile)) return true;
  }
  return false;
}

function include(options) {

  options = options || {};
  options.keyword = options.keyword || 'INCLUDE';
  options.cache = options.cache || false;
  options.showFiles = typeof options.showFiles === 'string'? options.showFiles :
    options.showFiles? 'include-js:' : false;
  options.ext = options.ext || 'js';
  if (options.recursive === undefined) options.recursive = true;
  if (options.ext[0] === '.') options.ext = options.ext.slice(1);

  return through.obj(function(file, enc, cb) {

    this.base = file.base || file.cwd;
    this.filepath = file.path;
    this.id = path.relative(this.base, this.filepath);
    this.options = options;
    this.includes = {};

    if (options.cache) {
      var cachename = options.cache === true? 'default': options.cache;
      caches[cachename] = caches[cachename] || {
        includes: {},
        modules: {}
      };
      this.cacheIncludes = caches[cachename].includes;
      this.cacheModules = caches[cachename].modules;
    }

    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) throw new Error('Streaming not supported');

    // ignore _* files
    var filename = path.basename(file.path);
    if (filename[0] === '_') return cb();

    // check if file was cached
    if (options.cache && !isDirty(file.path, this.cacheModules, this.cacheIncludes)) {
      return cb();
    }

    var s = file.contents.toString();
    try {
      s = exec.call(this, s, this.id, [this.filepath]);

    } catch(e) {
      this.emit('error', e);
      return cb();
    }

    file.contents = new Buffer(s);

    // save to cache
    if (options.cache) this.cacheModules[file.path] = {
      time: time(file.path),
      includes: this.includes
    };

    if (options.showFiles) {
      gutil.log(options.showFiles, magenta(path.relative(file.cwd, file.path)));
    }

    this.push(file);
    cb();
  });
}

module.exports = include;
