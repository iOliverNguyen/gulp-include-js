// a.js includes b.js and c.js
// b.js includes c.js
// c.js includes b.js
// ~> ERROR: circular

function Annie() {
  return 'A';
}

;

function Caitlyn() {
  ;
}

var expect = require('chai').expect;
expect(Annie() + Caitlyn()).equal('Aundefined');
expect(typeof Blitzcrank).equal('undefined');
