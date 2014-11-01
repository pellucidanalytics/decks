var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var Deck = decks.Deck;
var dom = decks.ui.dom;
var DecksEvent = decks.events.DecksEvent;
var Emitter = decks.events.Emitter;
var Canvas = decks.Canvas;
var Layout = decks.Layout;

describe("decks.Canvas", function() {
  var element;
  var animator;
  var config;
  var emitter;
  var layout;
  var canvasOptions;
  var canvas;

  beforeEach(function() {
    element = dom.create("div");
    animator = {
      animate: function() { }
    };
    config = Deck.prototype.defaultOptions.config;
    emitter = new Emitter();
    layout = new Layout();
    canvasOptions = {
      element: element,
      animator: animator,
      config: config,
      emitter: emitter,
      layout: layout
    };
    canvas = new Canvas(canvasOptions);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(canvas).to.be.an.instanceOf(Canvas);
    });

    it("should work without new", function(){
      canvas = Canvas(canvasOptions);
      expect(canvas).to.be.an.instanceOf(Canvas);
    });

    it("should set the element from options", function(){
      expect(canvas.element).to.eql(element);
    });

    it("should create an element if not provided in options", function() {
      delete canvasOptions.element;
      canvas = new Canvas(canvasOptions);
      expect(canvas.element).to.be.an.instanceOf(HTMLElement);
    });

    it("should bind emitter events", function() {
      var spy = sinon.spy(Canvas.prototype, "bindEvents");
      canvas = new Canvas(canvasOptions);
      expect(spy).to.have.been.calledWith(emitter, Canvas.prototype.emitterEvents);
      expect(spy).to.have.been.calledWith(window, Canvas.prototype.windowEvents);
      Canvas.prototype.bindEvents.restore();
    });
  });

  describe("setElement", function() {
    it("should set class/style/etc. properties on the element", function(){
      expect(dom.hasClass(canvas.element, canvas.config.canvasClassName)).to.be.True;
      expect(canvas.element.style.position).to.eql("absolute");
      expect(canvas.element.style.top).to.eql("0px");
      expect(canvas.element.style.left).to.eql("0px");
    });

    it("should emit an event", function() {
      var spy = sinon.spy();
      canvasOptions.emitter.on("canvas:element:set", spy);
      canvas = new Canvas(canvasOptions);
      expect(spy).to.have.been.calledWith(DecksEvent("canvas:element:set", canvas, element));
    });
  });

  describe("setBounds", function() {
    it("should set an instance bounds property and element size", function() {
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30 };
      canvas.setBounds(bounds);
      expect(canvas.bounds).to.eql(bounds);
      expect(canvas.element.style.width).to.eql(bounds.width + "px");
      expect(canvas.element.style.height).to.eql(bounds.height + "px");
    });

    it("should emit an event", function() {
      var spy = sinon.spy();
      canvasOptions.emitter.on("canvas:bounds:set", spy);

      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30 };
      canvas.setBounds(bounds);

      expect(spy).to.have.been.calledWith(DecksEvent("canvas:bounds:set", canvas, bounds));
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
