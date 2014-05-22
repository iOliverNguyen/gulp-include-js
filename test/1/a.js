// a.js includes b.js and c.js
// b.js includes c.js

function Annie() {
  return 'A';
}

INCLUDE('b');

function Caitlyn() {
  return INCLUDE('c');
}

var expect = require('chai').expect;
expect(Annie() + Blitzcrank() + Caitlyn()).equal('ABCC');
