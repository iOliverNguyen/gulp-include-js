INCLUDE('./bar/bar');

exports.foo = 'foo';
exports.count = exports.count || 0;
exports.count++;
