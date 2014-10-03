var tools = require("./testtools");
var expect = tools.expect;
var assert = tools.assert;

describe("sanity check for unit tests", function() {
  describe("expect tests", function() {
    it("should pass basic expect tests", function() {
      expect("hello").to.be.a("string");
      expect(1).to.be.a("number");
      expect(2).to.be.a("number");
    });
  });

  describe("should tests", function() {
    it("should pass basic should tests", function() {
      "hello".should.be.a("string");
    });
  });

  describe("assert tests", function() {
    it("should pass basic assert tests", function() {
      assert.typeOf("hello", "string");
    });
  });
});
