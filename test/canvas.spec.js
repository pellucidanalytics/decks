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

  describe("setAnimator", function() {
    it("should be set by the constructor", function() {
      expect(canvas.animator).to.eql(animator);
    });

    it("should throw if already set", function() {
      expect(function() { canvas.setAnimator({}); }).to.Throw;
    });
  });

  describe("setConfig", function() {
    it("should be set by the constructor", function() {
      expect(canvas.config).to.eql(config);
    });

    it("should throw if already set", function() {
      expect(function() { canvas.setConfig({}); }).to.Throw;
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

  describe("setLayout", function() {
    it("should throw if not specified", function() {
      expect(function() { canvas.setLayout(); }).to.Throw;
    });

    it("should set the layout", function() {
      var layout = new Layout();
      canvas.setLayout(layout);
      expect(canvas.layout).to.eql(layout);
    });

    it("should configure gestures for the new layout", function() {
      var configSpy = sinon.spy(canvas, "configureGestures");
      var layout = new Layout();
      canvas.setLayout(layout);
      expect(configSpy).to.have.been.calledOnce;
      configSpy.restore();
    });

    it("should reset the canvas position", function() {
      var resetSpy = sinon.spy(canvas, "resetPosition");
      var layout = new Layout();
      canvas.setLayout(layout);
      expect(resetSpy).to.have.been.calledOnce;
      resetSpy.restore();
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
      var settingSpy = sinon.spy();
      var setSpy = sinon.spy();
      canvasOptions.emitter.on("canvas:bounds:setting", settingSpy);
      canvasOptions.emitter.on("canvas:bounds:set", setSpy);

      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30 };
      canvas.setBounds(bounds);

      expect(settingSpy).to.have.been.calledWith(DecksEvent("canvas:bounds:setting", canvas, { oldBounds: undefined, newBounds: bounds }));
      expect(setSpy).to.have.been.calledWith(DecksEvent("canvas:bounds:set", canvas, bounds));
    });
  });

  describe("setFrameBounds", function() {
    it("should throw if not specified", function() {
      expect(function() { canvas.setFrameBounds(); }).to.Throw;
    });

    it("should set frame bounds", function() {
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30 };
      canvas.setFrameBounds(bounds);
      expect(canvas.frameBounds).to.eql(bounds);
    });

    it("should set the Canvas's bounds if not already set", function() {
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30 };
      canvas.setFrameBounds(bounds);
      expect(canvas.bounds).to.eql(bounds);
    });

    it("should configure gestures if gestures are not configured", function() {
      var spy = sinon.spy(canvas, "configureGestures");
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30 };
      canvas.setFrameBounds(bounds);
      expect(spy).to.have.been.calledOnce;
    });

    it("should update the GestureHandler bounds if gestures are configured", function() {
      var gestureHandler = {
        setBounds: function() {
        }
      };
      var spy = sinon.spy(gestureHandler, "setBounds");
      canvas.gestureHandler = gestureHandler;
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30 };
      canvas.setFrameBounds(bounds);
      expect(spy).to.have.been.calledWith(bounds);
      spy.restore();
    });
  });

  describe("addRender", function() {
    it("should add the render element to the canvas element", function() {
      var element = dom.create("div");
      var render = { element: element };
      canvas.addRender(render);
      expect(canvas.element.contains(element)).to.be.True;
      expect(render.isInCanvas).to.be.True;
    });

    it("should throw if no element is specified", function() {
      var render = { };
      expect(function() { canvas.addRender(render); }).to.Throw;
    });

    it("should do nothing if render is already in canvas", function() {
      var mockDom = sinon.mock(dom);
      var render = { isInCanvas: true };
      canvas.addRender(render);
      mockDom.expects("append").never();
      mockDom.verify();
    });
  });

  describe("removeRender", function(){
    it("should remove the render element from the canvas element", function() {
      var element = dom.create("div");
      var render = {
        isInCanvas: true,
        element: element
      };
      canvas.element.appendChild(element);
      canvas.removeRender(render);
      expect(render.isInCanvas).to.be.False;
      expect(canvas.element.contains(element)).to.be.False;
    });

    it("should throw if no element specified", function() {
      var render = {
        isInCanvas: true
      };
      expect(function() { canvas.removeRender(render); }).to.Throw;
    });

    it("should do nothing if the render element is not in the canvas", function() {
      var element = dom.create("div");
      var render = {
        isInCanvas: false,
        element: element
      };
      var mockDom = sinon.mock(dom);
      mockDom.expects("remove").never();
      canvas.removeRender(render);
      mockDom.verify();
    });
  });

  describe("resizeToFitElement", function() {
    xit("TODO", function() {
    });
  });

  describe("resizeToFitAllElements", function() {
    xit("TODO", function() {
    });
  });

  describe("resetPosition", function() {
    xit("TODO", function() {
    });
  });

  describe("panToElement", function() {
    xit("TODO", function() {
    });
  });

  describe("configureGestures", function() {
    xit("TODO", function() {
    });
  });

  describe("onDeckLayoutSet", function() {
    it("should set the layout", function() {
      var spy = sinon.spy(canvas, "setLayout");
      var layout = new Layout();
      var e = DecksEvent("", {}, layout);
      canvas.onDeckLayoutSet(e);
      expect(spy).to.have.been.calledWith(layout);
    });
  });

  describe("onFrameBoundsSet", function() {
    it("should set the layout", function() {
      var spy = sinon.spy(canvas, "setFrameBounds");
      var bounds = {};
      var e = DecksEvent("", {}, bounds);
      canvas.onFrameBoundsSet(e);
      expect(spy).to.have.been.calledWith(bounds);
    });
  });

  describe("onViewportAllRendersDrawn", function() {
    it("should resize to fit all elements", function() {
      var spy = sinon.spy(canvas, "resizeToFitAllElements");
      canvas.onViewportAllRendersDrawn();
      expect(spy).to.have.been.calledOnce;
      spy.restore();
    });
  });

  describe("onViewportRenderDrawing", function(){
    it("should add the render", function() {
      var spy = sinon.spy(canvas, "addRender");
      var render = { element: dom.create("div") };
      var e = DecksEvent("", {}, render);
      canvas.onViewportRenderDrawing(e);
      expect(spy).to.have.been.calledWith(render);
      spy.restore();
    });
  });

  describe("onViewportRenderErased", function(){
    it("should remove the render", function() {
      var spy = sinon.spy(canvas, "removeRender");
      var element = dom.create("div");
      var render = { element: element };
      var e = DecksEvent("", {}, render);
      canvas.onViewportRenderErased(e);
      expect(spy).to.have.been.calledWith(render);
      spy.restore();
    });
  });

  describe("onGestureElementMoved", function() {
    it("should reset bounds if the element moved is the canvas element", function() {
      var spy = sinon.spy(canvas, "setBounds");
      var e = DecksEvent("", {}, canvas.element);
      canvas.onGestureElementMoved(e);
      expect(spy).to.have.been.calledOnce;
      spy.restore();
    });

    it("should do nothing if the event is for another element", function() {
      var spy = sinon.spy(canvas, "setBounds");
      var e = DecksEvent("", {}, dom.create("div"));
      canvas.onGestureElementMoved(e);
      expect(spy).not.to.have.been.called;
      spy.restore();
    });
  });

  describe("onWindowScroll", function(){
    it("should set bounds", function() {
      var spy = sinon.spy(canvas, "setBounds");
      canvas.onWindowScroll();
      expect(spy).to.have.been.calledOnce;
      spy.restore();
    });
  });

  describe("onWindowResize", function(){
    it("should set bounds", function() {
      var spy = sinon.spy(canvas, "setBounds");
      canvas.onWindowScroll();
      expect(spy).to.have.been.calledOnce;
      spy.restore();
    });
  });
});
