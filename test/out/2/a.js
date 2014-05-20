// a.js includes b.js and c.js
// b.js includes c.js
// c.js includes b.js
// ~> ERROR: circular

function Annie() {
  return 'A';
}

function Blitzcrank() {
  return 'B' + 

}


function Caitlyn() {
  return function Blitzcrank() {
  return 'B' + 
}


}
