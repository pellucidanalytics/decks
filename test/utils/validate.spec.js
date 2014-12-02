var tools = require("../testtools");
var expect = tools.expect;
var decks = require("../..");
var validate = decks.utils.validate;
var Item = decks.Item;

describe("decks.utils.validate", function() {
  describe("validate", function() {
    describe("isRequired", function() {
      it("should throw for missing values", function() {
        expect(function() { validate(null, "myObj", { isRequired: true }); }).to.Throw;
        expect(function() { validate(undefined, "myObj", { isRequired: true }); }).to.Throw;
      });

      it("should not throw for provided values", function(){
        validate(123, "myObj", { isRequired: true });
        validate({}, "myObj", { isRequired: true });
        validate("", "myObj", { isRequired: true });
        validate([], "myObj", { isRequired: true });
      });
    });

    describe("isPlainObject", function() {
      it("should throw for non-plain objects", function() {
        expect(function() { validate(null, "myObj", { isPlainObject: true }); }).to.Throw;
        expect(function() { validate(undefined, "myObj", { isPlainObject: true }); }).to.Throw;
        expect(function() { validate("", "myObj", { isPlainObject: true }); }).to.Throw;
        expect(function() { validate([], "myObj", { isPlainObject: true }); }).to.Throw;
        expect(function() { validate(123, "myObj", { isPlainObject: true }); }).to.Throw;
        expect(function() { validate(new Item(), "myObj", { isPlainObject: true}); }).to.Throw;
      });

      it("should not throw for plain objects", function() {
        validate({}, "myObj", { isPlainObject: true });
        validate({ key: 123 }, "myObj", { isPlainObject: true });
      });
    });

    describe("isArray", function() {
      it("should throw for non-arrays", function() {
        expect(function() { validate(null, "myObj", { isArray: true }); }).to.Throw;
        expect(function() { validate(undefined, "myObj", { isArray: true }); }).to.Throw;
        expect(function() { validate("", "myObj", { isArray: true }); }).to.Throw;
        expect(function() { validate(123, "myObj", { isArray: true }); }).to.Throw;
        expect(function() { validate(new Item(), "myObj", { isArray: true}); }).to.Throw;
      });

      it("should not throw for arrays", function() {
        validate([], "myObj", { isArray: true });
        validate([1, 23, 3], "myObj", { isArray: true });
        validate(new Array(1), "myObj", { isArray: true });
      });
    });

    describe("isString", function() {
      it("should throw for non-strings", function() {
        expect(function() { validate(null, "myObj", { isString: true }); }).to.Throw;
        expect(function() { validate(undefined, "myObj", { isString: true }); }).to.Throw;
        expect(function() { validate([], "myObj", { isString: true }); }).to.Throw;
        expect(function() { validate(123, "myObj", { isString: true }); }).to.Throw;
        expect(function() { validate(new Item(), "myObj", { isString: true}); }).to.Throw;
      });

      it("should not throw for strings", function() {
        validate("", "myObj", { isString: true });
        validate("test", "myObj", { isString: true });
      });
    });

    describe("isFunction", function() {
      it("should throw for non-functions", function() {
        expect(function() { validate(null, "myObj", { isFunction: true }); }).to.Throw;
        expect(function() { validate(undefined, "myObj", { isFunction: true }); }).to.Throw;
        expect(function() { validate([], "myObj", { isFunction: true }); }).to.Throw;
        expect(function() { validate(123, "myObj", { isFunction: true }); }).to.Throw;
        expect(function() { validate(new Item(), "myObj", { isFunction: true}); }).to.Throw;
      });

      it("should not throw for functions", function() {
        validate(function() {}, "myObj", { isFunction: true });
        validate(Array.prototype.slice, "myObj", { isFunction: true });
      });
    });

    describe("isNumber", function() {
      it("should throw for non-numbers", function() {
        expect(function() { validate(null, "myObj", { isNumber: true }); }).to.Throw;
        expect(function() { validate(undefined, "myObj", { isNumber: true }); }).to.Throw;
        expect(function() { validate([], "myObj", { isNumber: true }); }).to.Throw;
        expect(function() { validate(function() {}, "myObj", { isNumber: true }); }).to.Throw;
        expect(function() { validate(new Item(), "myObj", { isNumber: true}); }).to.Throw;
      });

      it("should not throw for numbers", function() {
        validate(0, "myObj", { isNumber: true });
        validate(123, "myObj", { isNumber: true });
        validate(NaN, "myObj", { isNumber: true });
        validate(Infinity, "myObj", { isNumber: true });
      });
    });

    describe("isFinite", function() {
      it("should throw for non-finite values", function() {
        expect(function() { validate(null, "myObj", { isFinite: true }); }).to.Throw;
        expect(function() { validate(undefined, "myObj", { isFinite: true }); }).to.Throw;
        expect(function() { validate([], "myObj", { isFinite: true }); }).to.Throw;
        expect(function() { validate(function() {}, "myObj", { isFinite: true }); }).to.Throw;
        expect(function() { validate(new Item(), "myObj", { isFinite: true}); }).to.Throw;
        expect(function() { validate(NaN, "myObj", { isFinite: true}); }).to.Throw;
        expect(function() { validate(Infinity, "myObj", { isFinite: true}); }).to.Throw;
      });

      it("should not throw for numbers", function() {
        validate(0, "myObj", { isFinite: true });
        validate(123, "myObj", { isFinite: true });
      });
    });

    describe("isRegExp", function() {
      it("should throw for non-regular expressions", function() {
        expect(function() { validate(null, "myObj", { isRegExp: true }); }).to.Throw;
        expect(function() { validate(undefined, "myObj", { isRegExp: true }); }).to.Throw;
        expect(function() { validate([], "myObj", { isRegExp: true }); }).to.Throw;
        expect(function() { validate(function() {}, "myObj", { isRegExp: true }); }).to.Throw;
        expect(function() { validate(new Item(), "myObj", { isRegExp: true}); }).to.Throw;
        expect(function() { validate(NaN, "myObj", { isRegExp: true}); }).to.Throw;
        expect(function() { validate(Infinity, "myObj", { isRegExp: true}); }).to.Throw;
      });

      it("should not throw for regular expression", function() {
        validate(/test/, "myObj", { isRegExp: true });
        validate(/test/gi, "myObj", { isRegExp: true });
        validate(new RegExp("test", "i"), "myObj", { isRegExp: true });
      });
    });

    describe("isElement", function() {
      it("should throw for non-elements", function() {
        expect(function() { validate(null, "myObj", { isElement: true }); }).to.Throw;
        expect(function() { validate(undefined, "myObj", { isElement: true }); }).to.Throw;
        expect(function() { validate([], "myObj", { isElement: true }); }).to.Throw;
        expect(function() { validate(function() {}, "myObj", { isElement: true }); }).to.Throw;
        expect(function() { validate(new Item(), "myObj", { isElement: true}); }).to.Throw;
        expect(function() { validate(NaN, "myObj", { isElement: true}); }).to.Throw;
        expect(function() { validate(Infinity, "myObj", { isElement: true}); }).to.Throw;
      });

      it("should not throw for regular expression", function() {
        validate(document.body, "myObj", { isElement: true });
        validate(document.createElement("div"), "myObj", { isElement: true });
        validate(document.createElement("span"), "myObj", { isElement: true });
      });
    });

    describe("isInstanceOf", function() {
      it("should throw for non-matching instances", function() {
        expect(function() { validate(null, "myObj", { isInstanceOf: String }); }).to.Throw;
        expect(function() { validate(undefined, "myObj", { InstanceOf: String }); }).to.Throw;
        expect(function() { validate([], "myObj", { InstanceOf: String }); }).to.Throw;
        expect(function() { validate(function() {}, "myObj", { InstanceOf: String }); }).to.Throw;
        expect(function() { validate(new Item(), "myObj", { InstanceOf: String}); }).to.Throw;
        expect(function() { validate(NaN, "myObj", { InstanceOf: String}); }).to.Throw;
        expect(function() { validate(Infinity, "myObj", { InstanceOf: String}); }).to.Throw;
      });

      it("should not throw for matching instances", function() {
        validate(document.body, "myObj", { isInstanceOf: HTMLElement });
        validate(document.createElement("div"), "myObj", { isInstanceOf: HTMLDivElement });
        validate(function() { }, "myObj", { isInstanceOf: Function });
        validate({}, "myObj", { isInstanceOf: Object });
        validate([], "myObj", { isInstanceOf: Array });
        validate(new Item(), "myObj", { isInstanceOf: Item });
      });
    });

    describe("isArguments", function() {
      it("should throw for non-arguments", function() {
        expect(function() { validate("", "myObj", { isArguments: true }); }).to.Throw;
        expect(function() { validate([], "myObj", { isArguments: true }); }).to.Throw;
        expect(function() { validate({}, "myObj", { isArguments: true }); }).to.Throw;
        expect(function() { validate(/test/, "myObj", { isArguments: true }); }).to.Throw;
      });

      it("should not throw for arguments", function() {
        validate(arguments, "args", { isArguments: true });
      });
    });

    describe("isNotSet", function() {
      it("should throw if valid is not null or undefined", function() {
        expect(function() { validate("", "myObj", { isNotSet: true }); }).to.Throw;
        expect(function() { validate({}, "myObj", { isNotSet: true }); }).to.Throw;
        expect(function() { validate([], "myObj", { isNotSet: true }); }).to.Throw;
        expect(function() { validate(document.body, "myObj", { isNotSet: true }); }).to.Throw;
      });

      it("should not throw if value is null or undefined", function() {
        var obj = {
          key1: 123,
          key2: null,
          key3: undefined
        };
        validate("test", "myObj", { isNotSet: obj.key2 });
        validate("test", "myObj", { isNotSet: obj.key3 });
        validate("test", "myObj", { isNotSet: obj.key4 });
      });
    });
  });
});
