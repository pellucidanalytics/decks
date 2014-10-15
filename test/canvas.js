var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var dom = decks.ui.dom;
var services = decks.services;
var Emitter = decks.events.Emitter;
var Canvas = decks.Canvas;

describe("decks.Canvas", function() {
  beforeEach(function(){
    services.emitter = new Emitter();
  });

  describe("constructor", function() {
    it("should work with new", function() {
      var canvas = new Canvas();
      expect(canvas).to.be.an.instanceof(Canvas);
    });

    it("should work without new", function(){
      var canvas = Canvas();
      expect(canvas).to.be.an.instanceof(Canvas);
    });

    it("should set the element from options", function(){
      var element = dom.create("div");
      var canvas = new Canvas({ element: element });
      expect(canvas.element).to.eql(element);
    });

    it("should create an element if not provided in options", function() {
      var canvas = new Canvas();
      expect(canvas.element).to.be.an.instanceof(HTMLElement);
    });

    it("should bind emitter events", function() {
      var spy = sinon.spy(Canvas.prototype, "bindEvents");
      new Canvas();
      expect(spy).to.have.been.calledWith(services.emitter, Canvas.emitterEvents);
      expect(spy).to.have.been.calledWith(window, Canvas.windowEvents);
      Canvas.prototype.bindEvents.restore();
    });
  });

  describe("setElement", function() {
    it("should set class/style/etc. properties on the element", function(){
      var element = dom.create("div");
      var canvas = new Canvas();
      canvas.setElement(element);
      expect(dom.hasClass(canvas.element, services.constants.canvasClassName)).to.be.true;
      expect(canvas.element.style.position).to.eql("absolute");
      expect(canvas.element.style.top).to.eql("0px");
      expect(canvas.element.style.left).to.eql("0px");
    });

    it("should emit an event", function() {
      var element = dom.create("div");
      var canvas = new Canvas();
      var spy = sinon.spy();
      services.emitter.on("canvas:element:set", spy);
      canvas.setElement(element);
      expect(spy).to.have.been.calledWithMatch(function(e) {
        return e.type === "canvas:element:set" &&
          e.sender === canvas &&
          e.data === element;
      });
    });
  });

  describe("setBounds", function() {
    it("should set an instance bounds property and element size", function() {
      var canvas = new Canvas();
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30 };
      canvas.setBounds(bounds);
      expect(canvas.bounds).to.eql(bounds);
      expect(canvas.element.style.width).to.eql(bounds.width + "px");
      expect(canvas.element.style.height).to.eql(bounds.height + "px");
    });

    it("should emit an event", function() {
      var canvas = new Canvas();
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30 };
      var spy = sinon.spy();
      services.emitter.on("canvas:bounds:set", spy);
      canvas.setBounds(bounds);
      expect(spy).to.have.been.calledWithMatch(function(e) {
        return e.type === "canvas:bounds:set" &&
          e.sender === canvas &&
          e.data === bounds;
      });
    });
  });

  describe("setFrameBounds", function() {
  });

  describe("addRender", function(){
  });

  describe("removeRender", function(){
  });

  describe("configureGestures", function() {
  });

  describe("onDeckLayoutSet", function() {
  });

  describe("onFrameBoundsSet", function() {
  });

  describe("onFrameBoundsSet", function() {
  });

  describe("onViewportAnimationBegin", function(){
  });

  describe("onViewportAnimationComplete", function(){
  });

  describe("onViewportRenderRemoved", function(){
  });

  describe("onGestureElementMoved", function(){
  });
});
