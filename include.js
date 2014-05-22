var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');
var trim = require('./lib/trim');

var pluginName = 'include-js';
var magenta = gutil.colors.magenta;

var cacheFiles = {};      // {time: Date, content: String, includes: Array}
var cacheIncludes = {};   // {time: Date, content: String}

function error(context, err) {
  context.emit('error', new gutil.PluginError(pluginName, err));
}

// ignore _* files
// for each file, scan for INCLUDE('filepath')
// read file contents, continue scanning, check for circular
// cache _* files

function exec(s, stack) {
  var result = '';
  var r = new RegExp('(//[^\r\n]*)?([^\\s]+\\s*)?' + this.options.keyword + '\\s*\\( *[\'"]([^\'"]*)[\'"]\\s*\\)');
  var m = r.exec(s);
  while (m) {
    var isCmt = m[1];
    var inline = m[2] || '';
    var id = m[3];

    result += s.slice(0, m.index);
    if (!isCmt) {
      var sinc = read.call(this, id, stack||[]);
      if (inline) sinc = trim(sinc);
      result += inline + sinc;
    }
    s = s.slice(m.index + m[0].length);
    m = r.exec(s);
  }
  return result + s;
}

function read(id, stack) {
  var basename = path.basename(id);
  basename = basename[0] === '_'? basename : '_' + basename;
  basename = path.extname(basename) === this.options.ext? basename : basename + '.' + this.options.ext;

  var filepath = path.join(this.base, path.dirname(id), basename);
  var newStack = stack.concat([id]);

  if (stack.indexOf(id) >= 0) {
    error(this, new Error('Circular ' +
      newStack.map(function(i){ return magenta(i); }).join(', ')));
    return '';
  }

  var s = fs.readFileSync(filepath, {encoding: 'utf8'});
  s = exec.call(this, s, newStack);
  return s;
}

function include(options) {

  options = options || {};
  if (options.cache === undefined) options.cache = false;
  if (options.keyword === undefined) options.keyword = 'INCLUDE';
  if (options.ext === undefined) options.ext = 'js';
  if (options.ext[0] === '.') options.ext = options.ext.slice(1);

  return through.obj(function(file, enc, cb) {

    this.options = options;
    this.base = file.base || file.cwd;

    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      error(this, new Error('Streaming not supported'));
      return cb();
    }

    // ignore _* files
    var filename = path.basename(file.path);
    if (filename[0] === '_') {
      return cb();
    }

    var s = file.contents.toString();
    try {
      file.contents = new Buffer(exec.call(this, s));

    } catch (e) {
      e.filename = file.path;
      error(this, e);
    }

    this.push(file);
    cb();
  });
}

module.exports = include;
