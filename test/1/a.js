// a.js includes b.js and c.js
// b.js includes c.js

function Annie() {
  return 'A';
}

// This comment is added to test an issue
INCLUDE('b');

function Caitlyn() {
  var c = INCLUDE('c');
  return INCLUDE('c') + c;
}

exports.ABC = Annie() + Blitzcrank() + Caitlyn();
