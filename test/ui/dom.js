var tools = require("../testtools");
var expect = tools.expect;
var decks = require("../..");
var dom = decks.ui.dom;

describe("decks.ui.dom", function() {
  describe("create", function() {
    it("should create a DOM element by tag name", function() {
      var element = dom.create("div");
      expect(element.tagName).to.eql("DIV");
    });
  });

  describe("html", function() {
  });

  describe("empty", function() {
  });

  describe("append", function() {
  });

  describe("prepend", function() {
  });

  describe("hasClass", function() {
    it("should return true if an element has the class", function() {
      var element = dom.create("div");
      element.className = "one";
      expect(dom.hasClass(element, "one")).to.be.true;
    });

    it("should return true if element has the class among many classes", function(){
      var element = dom.create("div");
      element.className = "one two three";
      expect(dom.hasClass(element, "two")).to.be.true;
    });
  });

  describe("addClass", function() {
    it("should add a class", function() {
      var element = dom.create("div");
      dom.addClass(element, "test-class");
      expect(element.className).to.eql("test-class");
    });

    it("should not re-add duplicate classes", function() {
      var element = dom.create("div");
      dom.addClass(element, "one");
      expect(element.className).to.eql("one");
      dom.addClass(element, "one");
      expect(element.className).to.eql("one");
    });

    it("should add multiple classes, and not duplicate any", function() {
      var element = dom.create("div");
      dom.addClass(element, "one two");
      expect(element.className).to.eql("one two");
      dom.addClass(element, "two three");
      expect(element.className).to.eql("one two three");
    });
  });

  describe("removeClass", function() {
    it("should remove a class", function() {
      var element = dom.create("div");
      dom.addClass(element, "one");
      expect(element.className).to.eql("one");
      dom.removeClass(element, "one");
      expect(element.className).to.eql("");
    });

    it("should remove multiple classes", function() {
      var element = dom.create("div");
      dom.addClass(element, "one two three");
      expect(element.className).to.eql("one two three");
      dom.removeClass(element, "one three");
      expect(element.className).to.eql("two");
    });

    it("should do nothing if class does not exist", function() {
      var element = dom.create("div");
      dom.addClass(element, "one two");
      expect(element.className).to.eql("one two");
      dom.removeClass(element, "three");
      expect(element.className).to.eql("one two");
    });
  });
});
