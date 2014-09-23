var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

module.exports = {
  mocha: mocha,
  chai: chai,
  expect: chai.expect,
  assert: chai.assert,
  sinon: sinon,
  sinonChai: sinonChai
};
