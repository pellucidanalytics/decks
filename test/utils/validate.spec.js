var tools = require("../testtools");
var expect = tools.expect;
var decks = require("../..");
var validate = decks.utils.validate;

describe("decks.utils.validate", function() {
  describe("isRequired", function() {
    it("should throw for missing values", function() {
      var obj = null;
      expect(function() {
        validate(obj, "myObj", { isRequired: true });
      }).to.Throw();
    });

    it("should not throw for provided values", function(){
      var obj = 123;
      validate(obj, "myObj", { isRequired: true });
    });
  });

  describe("chaining", function() {
    it("should allow chained checks", function() {
      validate("test", "myString", { isRequired: true, isString: true });

      expect(function() {
        validate("test", "myString", { isRequired: true, isString: true });
      }).to.Throw;
    });
  });
});
