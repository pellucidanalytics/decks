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
    it("should get inner HTML", function() {
      var element = dom.create("div");
      var html = "<span>Hello World</span>";
      element.innerHTML = html;
      var result = dom.html(element);
      expect(result).to.eql(html);
    });

    it("should set inner HTML", function() {
      var element = dom.create("div");
      var html = "<span>Hello world</span>";
      dom.html(element, html);
      expect(element.innerHTML).to.eql(html);
    });

    it("should set inner HTML from an element", function() {
      var parent = dom.create("div");
      var child = dom.create("span");
      dom.html(child, "Hello world");
      dom.html(parent, child);
      expect(dom.html(parent)).to.eql("<span>Hello world</span>");
    });
  });

  describe("parse", function() {
    it("should parse HTML", function() {
      var html = "<hr/>";
      var element = dom.parse(html);
      expect(element.outerHTML).to.eql("<hr>");
    });
  });

  describe("text", function(){
    it("should get inner text", function() {
      var element = dom.create("div");
      element.innerHTML = "<div>Testing</div>";
      expect(dom.text(element)).to.eql("Testing");
    });

    it("should set inner text", function() {
      var element = dom.create("div");
      element.innerHTML = "<div>Testing</div>";
      expect(dom.text(element)).to.eql("Testing");
      dom.text(element, "Something else");
      expect(dom.text(element)).to.eql("Something else");
      expect(element.textContent || element.innerText).to.eql("Something else");
    });
  });

  describe("empty", function() {
    it("should empty the contents of an element", function() {
      var element = dom.create("div");
      element.innerHTML = "<h1>Hi</h1><p>Testing</p>";
      expect(element.firstChild.tagName).to.eql("H1");
      expect(element.children.length).to.eql(2);
      dom.empty(element);
      expect(element.children.length).to.eql(0);
    });
  });

  describe("append", function() {
    it("should append an element in a container", function() {
      var ul = dom.create("ul");
      dom.html(ul, "<li>one</li><li>two</li>");
      var li = dom.create("li");
      dom.html(li, "three");
      dom.append(ul, li);
      expect(dom.html(ul)).to.eql("<li>one</li><li>two</li><li>three</li>");
    });
  });

  describe("prepend", function() {
    it("should prepend an element in a container", function() {
      var ul = dom.create("ul");
      dom.html(ul, "<li>one</li><li>two</li>");
      var li = dom.create("li");
      dom.html(li, "zero");
      dom.prepend(ul, li);
      expect(dom.html(ul)).to.eql("<li>zero</li><li>one</li><li>two</li>");
    });
  });

  describe("remove", function() {
    it("should remove an element from a container", function() {
      var ul = dom.create("ul");
      dom.html(ul, "<li>one</li><li>two</li>");
      var li = dom.create("li");
      dom.html(li, "zero");
      dom.prepend(ul, li);
      expect(dom.html(ul)).to.eql("<li>zero</li><li>one</li><li>two</li>");
      dom.remove(ul, li);
      expect(dom.html(ul)).to.eql("<li>one</li><li>two</li>");
    });

    it("should remove an element from its parent", function() {
      var parent = dom.create("div");
      var child = dom.create("div");
      parent.appendChild(child);
      expect(parent.firstChild).to.equal(child);
      var removed = dom.remove(child);
      expect(removed).to.equal(child);
      expect(parent.firstChild).to.not.equal(child);
    });
  });

  describe("getAttr", function() {
    it("should get an attribute", function() {
      var element = dom.create("div");
      element.innerHTML = "<div data-id='123'></div>";
      var child = element.firstChild;
      expect(dom.getAttr(child, "data-id")).to.eql("123");
    });
  });

  describe("setAttr", function() {
    it("should set an attribute", function() {
      var element = dom.create("div");
      element.innerHTML = "<div data-id='123'></div>";
      var child = element.firstChild;
      expect(dom.getAttr(child, "data-id")).to.eql("123");
      dom.setAttr(child, "data-id", "456");
      expect(dom.getAttr(child, "data-id")).to.eql("456");
    });
  });

  describe("hasClass", function() {
    it("should return true if an element has the class", function() {
      var element = dom.create("div");
      element.className = "one";
      expect(dom.hasClass(element, "one")).to.be.True;
    });

    it("should return true if element has the class among many classes", function(){
      var element = dom.create("div");
      element.className = "one two three";
      expect(dom.hasClass(element, "two")).to.be.True;
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

  describe("toggleClass", function() {
    it("should add a class if it doesn't exist", function() {
      var element = dom.create("div");
      element.className = "one two";
      expect(dom.hasClass(element, "three")).to.be.False;
      dom.toggleClass(element, "three");
      expect(dom.hasClass(element, "three")).to.be.True;
    });

    it("should remove a class if it exists", function() {
      var element = dom.create("div");
      element.className = "one two three";
      expect(dom.hasClass(element, "three")).to.be.True;
      dom.toggleClass(element, "three");
      expect(dom.hasClass(element, "three")).to.be.False;
    });
  });

  describe("getStyle", function() {
    it("should get a single style", function() {
      var element = dom.create("div");
      element.style.top = "10px";
      expect(dom.getStyle(element, "top")).to.eql("10px");
    });

    it("should get a single style and parse it as an integer", function() {
      var element = dom.create("div");
      element.style.top = "10px";
      expect(dom.getStyle(element, "top", { parseInt: true })).to.eql(10);
      element.style.top = "10.5px";
      expect(dom.getStyle(element, "top", { parseInt: true })).to.eql(10);
    });

    it("should get a single style and parse it as a float", function() {
      var element = dom.create("div");
      element.style.top = "10px";
      expect(dom.getStyle(element, "top", { parseFloat: true })).to.eql(10);
      element.style.top = "10.5px";
      expect(dom.getStyle(element, "top", { parseFloat: true })).to.eql(10.5);
    });
  });

  describe("setStyle", function() {
    it("should set a single style", function() {
      var element = dom.create("div");
      dom.setStyle(element, "top", "10px");
      expect(element.style.top).to.eql("10px");
    });

    it("should automatically set units for certain styles", function() {
      var element = dom.create("div");
      dom.setStyle(element, "top", 10);
      dom.setStyle(element, "bottom", 11);
      dom.setStyle(element, "left", 12);
      dom.setStyle(element, "right", 13);
      dom.setStyle(element, "width", 14);
      dom.setStyle(element, "height", 15);
      expect(element.style.top).to.eql("10px");
      expect(element.style.bottom).to.eql("11px");
      expect(element.style.left).to.eql("12px");
      expect(element.style.right).to.eql("13px");
      expect(element.style.width).to.eql("14px");
      expect(element.style.height).to.eql("15px");
    });
  });

  describe("setStyles", function() {
    it("should set multiple styles at once", function() {
      var element = dom.create("div");
      dom.setStyles(element, {
        position: "absolute",
        top: 0,
        left: "10%"
      });
      expect(element.style.position).to.eql("absolute");
      expect(element.style.top).to.eql("0px");
      expect(element.style.left).to.eql("10%");
    });
  });

  describe("isPositioned", function() {
    it("should return true if the element is fixed, absolute, or relative", function() {
      var element = dom.create("div");
      expect(dom.isPositioned(element)).to.be.False;
      element.style.position = "static";
      expect(dom.isPositioned(element)).to.be.False;
      element.style.position = "fixed";
      expect(dom.isPositioned(element)).to.be.True;
      element.style.position = "absolute";
      expect(dom.isPositioned(element)).to.be.True;
      element.style.position = "relative";
      expect(dom.isPositioned(element)).to.be.True;
    });
  });
});
