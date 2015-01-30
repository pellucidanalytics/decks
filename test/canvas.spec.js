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
      expect(spy).to.have.been.calledWith(emitter, canvas.getEmitterEvents());
      Canvas.prototype.bindEvents.restore();
    });

    it("should bind to window events", function() {
      var spy = sinon.spy(Canvas.prototype, "bindEvents");
      canvas = new Canvas(canvasOptions);
      expect(spy).to.have.been.calledWith(window, canvas.getWindowEvents());
      Canvas.prototype.bindEvents.restore();
    });

    it("should not bind to window events if options are false", function() {
      var spy = sinon.spy(Canvas.prototype, "bindEvents");
      canvasOptions.watchWindowResize = false;
      canvasOptions.watchWindowScroll = false;
      canvas = new Canvas(canvasOptions);
      expect(spy).to.have.been.calledWith(window, {});
      Canvas.prototype.bindEvents.restore();
    });
  });

  describe("destroy", function() {
    it("should destroy the instance", function() {
      var unbindSpy = sinon.spy(canvas, "unbind");
      canvas.gestureHandler = { destroy: function() { } };
      var destroySpy = sinon.spy(canvas.gestureHandler, "destroy");
      canvas.destroy();
      expect(unbindSpy).to.have.been.called;
      expect(destroySpy).to.have.been.called;
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
      expect(canvas.element.style.overflow).to.eql("hidden");
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
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30, isNormalized: true };
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

      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30, isNormalized: true };
      canvas.setBounds(bounds);

      expect(settingSpy).to.have.been.calledWith(DecksEvent("canvas:bounds:setting", canvas, { oldBounds: undefined, newBounds: bounds }));
      expect(setSpy).to.have.been.calledWith(DecksEvent("canvas:bounds:set", canvas, bounds));
    });

    describe("layout bounds options", function() {
      var canvasBoundsOptions;
      var bounds;
      var expectedBounds;

      beforeEach(function() {
        // Stub layout method that provides the callback function used by Canvas
        canvas.layout = {
          getCanvasBoundsOptions: function() { return canvasBoundsOptions; }
        };

        // Stub for current frame bounds -- 100x100 square at (10, 10)
        canvas.frameBounds = {
          left: 10,
          right: 110,
          top: 10,
          bottom: 110,
          width: 100,
          height: 100
        };

        // New bounds we are going to try to set 200x200 square at (10, 10)
        bounds = {
          left: 10,
          right: 210,
          top: 10,
          bottom: 210,
          width: 200,
          height: 200
        };

        // Margin options
        canvasBoundsOptions = {
          marginRight: 0,
          marginBottom: 0,
          preventOverflowHorizontal: false,
          preventOverflowVertical: false,
          preventScrollbarHorizontal: false,
          preventScrollbarVertical: false,
          scrollbarSize: 20
        };
      });

      it("should resize the canvas with extra marginRight and marginBottom", function() {
        canvasBoundsOptions.marginRight = 20;
        canvasBoundsOptions.marginBottom = 40;
        expectedBounds = {
          isNormalized: true,
          left: 10,
          right: 230, // +marginRight
          top: 10,
          bottom: 250, // +marginBottom
          width: 220,
          height: 240
        };
        canvas.setBounds(bounds);
        expect(canvas.bounds).to.eql(expectedBounds);
      });

      it("should prevent horizontal overflow by resizing the canvas width to the frame width", function() {
        // Overflow options
        canvasBoundsOptions.preventOverflowHorizontal = true;
        expectedBounds = {
          isNormalized: true,
          left: 10,
          right: 110,
          top: 10,
          bottom: 210,
          width: 100,
          height: 200
        };
        canvas.setBounds(bounds);
        expect(canvas.bounds).to.eql(expectedBounds);
      });

      it("should prevent vertical overflow by resizing the canvas height to the frame height", function() {
        canvasBoundsOptions.preventOverflowVertical = true;
        expectedBounds = {
          isNormalized: true,
          left: 10,
          right: 210,
          top: 10,
          bottom: 110,
          width: 200,
          height: 100
        };
        canvas.setBounds(bounds);
        expect(canvas.bounds).to.eql(expectedBounds);
      });

      it("should prevent a horizontal scrollbar by resizing the canvas minus a scrollbar width", function() {
        canvasBoundsOptions.preventScrollbarHorizontal = true;
        canvasBoundsOptions.scrollbarSize = 17;
        expectedBounds = {
          isNormalized: true,
          left: 10,
          right: 193,
          top: 10,
          bottom: 210,
          width: 183,
          height: 200
        };
        canvas.setBounds(bounds);
        expect(canvas.bounds).to.eql(expectedBounds);
      });

      it("should prevent a vertical scrollbar by resizing the canvas minus a scrollbar height", function() {
        canvasBoundsOptions.preventScrollbarVertical = true;
        canvasBoundsOptions.scrollbarSize = 17;
        expectedBounds = {
          isNormalized: true,
          left: 10,
          right: 210,
          top: 10,
          bottom: 193,
          width: 200,
          height: 183
        };
        canvas.setBounds(bounds);
        expect(canvas.bounds).to.eql(expectedBounds);
      });

      it("should apply margin, then overflow, then scrollbar adjustments", function() {
        canvasBoundsOptions.marginRight = 30;
        canvasBoundsOptions.marginBottom = 30;
        canvasBoundsOptions.preventOverflowHorizontal = true;
        canvasBoundsOptions.preventOverflowVertical = true;
        canvasBoundsOptions.preventScrollbarHorizontal = true;
        canvasBoundsOptions.preventScrollbarVertical = true;
        canvasBoundsOptions.scrollbarSize = 15;
        expectedBounds = {
          isNormalized: true,
          left: 10,
          right: 95,
          top: 10,
          bottom: 95,
          width: 85,
          height: 85
        };
        canvas.setBounds(bounds);
        expect(canvas.bounds).to.eql(expectedBounds);
      });
    });
  });

  describe("setFrameBounds", function() {
    it("should throw if not specified", function() {
      expect(function() { canvas.setFrameBounds(); }).to.Throw;
    });

    it("should set frame bounds", function() {
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30, isNormalized: true };
      canvas.setFrameBounds(bounds);
      expect(canvas.frameBounds).to.eql(bounds);
    });

    it("should set the Canvas's bounds if not already set", function() {
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30, isNormalized: true };
      canvas.setFrameBounds(bounds);
      expect(canvas.bounds).to.eql(bounds);
    });

    it("should configure gestures if gestures are not configured", function() {
      var spy = sinon.spy(canvas, "configureGestures");
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30, isNormalized: true };
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
      var bounds = { top: 10, bottom: 40, left: 10, right: 50, width: 40, height: 30, isNormalized: true };
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

  // Note: viewport now calls canvas directly
  xdescribe("onViewportRenderDrawing", function(){
    it("should add the render", function() {
      var spy = sinon.spy(canvas, "addRender");
      var render = { element: dom.create("div") };
      var e = DecksEvent("", {}, render);
      canvas.onViewportRenderDrawing(e);
      expect(spy).to.have.been.calledWith(render);
      spy.restore();
    });
  });

  // Note: viewport now calls canvas directly
  xdescribe("onViewportRenderErased", function(){
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
