var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');
var trim = require('./lib/trim');

var pluginName = 'include-js';
var magenta = gutil.colors.magenta;

function error(context, err) {
  context.emit('error', new gutil.PluginError(pluginName, err));
}

// ignore _* files
// for each file, scan for INCLUDE('filepath')
// read file contents, continue scanning, check for circular
// cache _* files

function include(options) {

  options = options || {};
  if (options.cache === undefined) options.cache = false;
  if (options.keyword === undefined) options.keyword = 'INCLUDE';
  if (options.ext === undefined) options.ext = 'js';

  return through.obj(function(file, enc, cb) {
    var context = this;

    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      error(context, new Error('Streaming not supported'));
      return cb();
    }

    // ignore _* files
    var filename = path.basename(file.path);
    if (filename[0] === '_') {
      return cb();
    }

    function exec(s, stack) {
      var result = '';
      var r = new RegExp('(//[^\r\n]*)?' + options.keyword + ' *\\( *[\'"]([^\'"]*)[\'"] *\\)');
      var m = r.exec(s);
      while (m) {
        isCmt = m[1];
        relpath = m[2];
        result += s.slice(0, m.index) + (isCmt? '' : read(relpath, stack || []));
        s = s.slice(m.index + m[0].length);
        m = r.exec(s);
      }
      return result + s;
    }

    function read(relpath, stack, inline) {
      var basename = path.basename(relpath);
      basename = basename[0] === '_'? basename : '_' + basename;
      basename = path.extname(basename) === options.ext? basename : basename + '.' + options.ext;

      var filepath = path.join(file.base || file.cwd, path.dirname(relpath), basename);
      var newStack = stack.concat([relpath]);

      if (stack.indexOf(relpath) >= 0) {
        error(context, new Error('Circular ' + magenta(newStack.join(', '))));
        return '';
      }

      var str = fs.readFileSync(filepath, {encoding: 'utf8'});
      str = exec(str, newStack);
      return trim(str);
    }

    var str = file.contents.toString();
    try {
      file.contents = new Buffer(exec(str));

    } catch (e) {
      e.filename = file.path;
      error(context, e);
    }

    this.push(file);
    cb();
  });
}

module.exports = include;
