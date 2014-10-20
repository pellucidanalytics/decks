var _ = require("lodash");
var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var dom = decks.ui.dom;
var services = decks.services;
var Emitter = decks.events.Emitter;
var DecksEvent = decks.events.DecksEvent;
var Frame = decks.Frame;

describe("decks.Frame", function() {
  beforeEach(function(){
    services.emitter = new Emitter();
  });

  describe("constructor", function() {
    it("should work with new", function() {
      var element = dom.create("div");
      var frame = new Frame({ element: element });
      expect(frame).to.be.an.instanceof(Frame);
    });

    it("should work without new", function() {
      var element = dom.create("div");
      var frame = Frame({ element: element });
      expect(frame).to.be.an.instanceof(Frame);
    });

    it("should throw if no options specified", function() {
      expect(function() { new Frame(); }).to.throw(Error);
    });

    it("should set an element", function() {
      var element = dom.create("div");
      var frame = new Frame({ element: element });
      expect(frame.element).to.eql(element);
    });

    it("should bind emitter events", function() {
      var spy = sinon.spy(Frame.prototype, "bindEvents");
      var element = dom.create("div");
      new Frame({ element: element });
      expect(spy).to.have.been.calledWith(services.emitter, Frame.emitterEvents);
      Frame.prototype.bindEvents.restore();
    });

    it("should bind window events", function() {
      var spy = sinon.spy(Frame.prototype, "bindEvents");
      var element = dom.create("div");
      new Frame({ element: element });
      expect(spy).to.have.been.calledWith(window, Frame.windowEvents);
      Frame.prototype.bindEvents.restore();
    });
  });

  describe("setElement", function() {
    it("should require an element", function() {
      expect(function() { new Frame(); }).to.throw(Error);
    });

    it("should set the element property", function() {
      var element = dom.create("div");
      var frame = new Frame({ element: element });
      expect(frame.element).to.eql(element);
    });

    it("should apply styles/classes/etc. to the element", function() {
      var element = dom.create("div");
      new Frame({ element: element });
      expect(element.className).to.eql("decks-frame");
      expect(element.style.position).to.eql("relative");
      expect(element.style.overflow).to.eql("hidden");
    });

    it("should emit an event", function() {
      var spy = sinon.spy();
      services.emitter.on("frame:element:set", spy);
      var element = dom.create("div");
      var frame = new Frame({ element: element });
      expect(spy).to.have.been.calledWith(DecksEvent("frame:element:set", frame, element));
    });

    it("should set the bounds to the element bounds", function() {
      var element = dom.create("div");
      dom.setStyles(element, {
        position: "absolute",
        top: "10%",
        left: "20%",
        width: "60%",
        height: "80%"
      });
      var frame = new Frame({ element: element });
      expect(frame.bounds).not.to.be.undefined;
      _.each(["top", "bottom", "left", "right", "width", "height"], function(key) {
        expect(frame.bounds[key]).to.be.a("number");
      });
    });
  });

  describe("setBounds", function() {
    it("should set the bounds based on frame element", function() {
      var element = dom.create("div");
      dom.setStyles(element, {
        position: "absolute",
        top: 20,
        left: 40,
        width: 1000,
        height: 800
      });
      document.body.appendChild(element);
      var frame = new Frame({ element: element });
      expect(frame.bounds).to.eql({
        top: 20,
        bottom: 820,
        left: 40,
        right: 1040,
        width: 1000,
        height: 800
      });
    });
  });

  describe("isElementVisible", function() {
    it("should check if an element rect intersects the frame element rect", function() {
      var element = dom.create("div");
      dom.setStyles(element, {
        position: "absolute",
        top: 0,
        left: 0,
        width: 1024,
        height: 768
      });
      document.body.appendChild(element);
      var frame = new Frame({ element: element });

      var itemElement = dom.create("div");
      frame.element.appendChild(itemElement);

      dom.setStyles(itemElement, {
        position: "absolute",
        top: -5,
        left: -5,
        width: 50,
        height: 50
      });
      expect(frame.isElementVisible(itemElement)).to.be.true;

      dom.setStyles(itemElement, {
        position: "absolute",
        top: 800,
        left: 1020,
        width: 50,
        height: 50
      });
      expect(frame.isElementVisible(itemElement)).to.be.false;
    });
  });

  describe("onCanvasElementSet", function() {
    it("should append the canvas element to the Frame, and set the Frame bounds on the Canvas", function() {
      var element = dom.create("div");
      document.body.appendChild(element);
      var frame = new Frame({ element: element });
      var mockCanvas = {
        element: dom.create("div"),
        setFrameBounds: sinon.spy()
      };
      var e = new DecksEvent("canvas:bounds:set", mockCanvas, mockCanvas.element);
      frame.onCanvasElementSet(e);
      expect(frame.element.childNodes.length).to.eql(1);
      expect(frame.element.firstChild).to.eql(mockCanvas.element);
      expect(mockCanvas.setFrameBounds).to.have.been.calledWith(frame.bounds);
    });
  });

  describe("onWindowResize", function() {
    it("should set its bounds", function() {
      var element = dom.create("div");
      var frame = new Frame({ element: element });
      var spy = sinon.spy(frame, "setBounds");
      frame.onWindowResize();
      expect(spy).to.have.been.called;
      frame.setBounds.restore();
    });
  });

  describe("onWindowScroll", function() {
    it("should set its bounds", function() {
      var element = dom.create("div");
      var frame = new Frame({ element: element });
      var spy = sinon.spy(frame, "setBounds");
      frame.onWindowResize();
      expect(spy).to.have.been.called;
      frame.setBounds.restore();
    });
  });
});
