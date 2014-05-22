var expect = require('chai').expect;
var trim = require('../lib/trim');

var tests = [];
var outputs = [];

tests[0] = '//abc';
outputs[0] = '';

tests[1] = '//abc\nabc';
outputs[1] = 'abc';

tests[2] = 'abc\n//abc\nabc';
outputs[2] = 'abc\n//abc\nabc';

tests[3] = 'abc/*xyz*/abc';
outputs[3] = 'abc/*xyz*/abc';

tests[4] = '\n  \n  /*xyz\nxyz*///123\nabc';
outputs[4] = 'abc';

tests[5] = '/*xyz\nxyz*///123\n\n  \n  abc';
outputs[5] = 'abc';

tests[6] = '\n\n/*\nxyz\n  */ \n/* */ // 123 \nabc\n\n//123\n/* xyz */abc \n';
outputs[6] = 'abc\n\n//123\n/* xyz */abc';

for (var i=0; i<tests.length; i++) {
  expect(trim(tests[i])).equal(outputs[i]);
}
