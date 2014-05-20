// a.js includes b.js and c.js
// b.js includes c.js

function Annie() {
  return 'A';
}

function Blitzcrank() {
  return 'B' + 'C';

}

function Blitzcrank() {
  return 'B' + 'C';

}


function Caitlyn() {
  return 'C';

}

var expect = require('chai').expect;
expect(Annie() + Blitzcrank() + Caitlyn()).equal('ABCC');
