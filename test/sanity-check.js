var tools = require("./test-tools");
var expect = tools.expect;

describe("sanity check for unit tests", function() {
  describe("expect tests", function() {
    expect("hello").to.be.a("string");
  });

  describe("should tests", function() {
    "hello".should.be.a("string");
  });

  describe("assert tests", function() {
    assert.typeOf("hello", "string");
  });
});
