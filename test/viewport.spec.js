var _ = require("lodash");
var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var Deck = decks.Deck;
var Viewport = decks.Viewport;
var Item = decks.Item;
var ItemCollection = decks.ItemCollection;
var Emitter = decks.events.Emitter;
var DecksEvent = decks.events.DecksEvent;
var Layout = decks.Layout;
var Frame = decks.Frame;
var Canvas = decks.Canvas;
var dom = decks.ui.dom;

describe("decks.Viewport", function() {
  var config;
  var animator;
  var emitter;
  var itemCollection;
  var layout;
  var frame;
  var canvas;
  var viewportOptions;
  var viewport;

  function addTestItems() {
    itemCollection.addItems([
      {
        key: "val1"
      },
      {
        key: "val2"
      },
      {
        key: "val3"
      }
    ]);
  }

  beforeEach(function() {
    config = Deck.prototype.defaultOptions.config;
    animator = {
      animate: function() { }
    };
    emitter = new Emitter();
    itemCollection = new ItemCollection();
    layout = new Layout({ });
    canvas = new Canvas({
      config: config,
      animator: animator,
      emitter: emitter,
      layout: layout
    });
    frame = new Frame({
      config: config,
      animator: animator,
      emitter: emitter,
      element: dom.create("div")
    });
    viewportOptions = {
      config: config,
      animator: animator,
      emitter: emitter,
      itemCollection: itemCollection,
      layout: layout,
      frame: frame,
      canvas: canvas
    };
    viewport = new Viewport(viewportOptions);
    viewport.isDeckReady = true;
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(viewport).to.be.an.instanceOf(Viewport);
    });

    it("should work without new", function() {
      var viewport = Viewport(viewportOptions);
      expect(viewport).to.be.an.instanceOf(Viewport);
    });

    it("should bind emitter events", function() {
      var spy = sinon.spy(Viewport.prototype, "bindEvents");
      viewport = new Viewport(viewportOptions);
      expect(spy).to.have.been.calledWith(emitter, viewport.getEmitterEvents());
      Viewport.prototype.bindEvents.restore();
    });
  });

  describe("destroy", function() {
    it("should destroy the instance", function() {
      var unbindSpy = sinon.spy(viewport, "unbind");
      viewport.destroy();
      expect(unbindSpy).to.have.been.called;
    });
  });

  describe("enableDrawing", function() {
    it("should enable drawing", function() {
      viewport.isDrawingEnabled = false;
      viewport.enableDrawing();
      expect(viewport.isDrawingEnabled).to.be.True;
    });
  });

  describe("disableDrawing", function() {
    it("should disable drawing", function() {
      viewport.isDrawingEnabled = true;
      viewport.disableDrawing();
      expect(viewport.isDrawingEnabled).to.be.False;
    });
  });

  describe("drawItem", function() {
    it("should throw for no item", function() {
      expect(function() { viewport.drawItem(); }).to.Throw(Error);
    });

    it("should call layout.getRenders, then drawRenders", function() {
      var item = new Item();
      var mockViewport = sinon.mock(viewport);
      var mockLayout = sinon.mock(layout);
      var renders = [
        {
          tranform: {},
          animateOptions: {}
        }
      ];
      mockLayout.expects("getRenders").once().returns(renders);
      mockViewport.expects("drawRenders").once().withArgs(item, sinon.match(function(value) {
        return _.keys(value).length === 1 &&
          value["0"].transform === renders[0].transform &&
          value["0"].animateOptions === renders[0].animateOptions &&
          value["0"].id === "0" &&
          value["0"].index === 0 &&
          value["0"].item === item;
      }));

      viewport.drawItem(item);

      mockLayout.verify();
      mockViewport.verify();
    });

    it("should not draw if deck is not ready", function() {
      var spy = sinon.spy(viewport, "emit");
      viewport.isDeckReady = false;
      viewport.drawItem(new Item());
      expect(spy).not.to.have.been.called;
    });

    it("should not draw if drawing is disabled", function() {
      var spy = sinon.spy(viewport, "emit");
      viewport.isDrawingEnabled = false;
      viewport.drawItem(new Item());
      expect(spy).not.to.have.been.called;
    });
  });

  describe("drawItems", function() {
    it("should drawItem for each item", function() {
      addTestItems();
      var mockViewport = sinon.mock(viewport);
      mockViewport.expects("drawItem").thrice();
      viewport.drawItems();
      mockViewport.verify();
    });
  });

  describe("eraseItem", function() {
    it("should erase all the renders for the item", function() {
      var item = new Item();
      var mockViewport = sinon.mock(viewport);
      mockViewport.expects("eraseRenders").once().withArgs(item);
      viewport.eraseItem(item);
      expect(item.isRemoving).to.be.True;
      mockViewport.verify();
    });
  });

  describe("eraseItems", function() {
    it("should call eraseItem for each item", function() {
      addTestItems();
      var mockViewport = sinon.mock(viewport);
      mockViewport.expects("eraseItem").thrice();
      viewport.eraseItems();
      mockViewport.verify();
    });
  });

  describe("removeItem", function() {
    it("should remove the item from the internal data structure", function() {
      viewport.renders["0"] = {};
      viewport.removeItem(new Item({ id: "0" }));
      expect(viewport.renders["0"]).to.be.Undefined;
    });

    it("should emit an event", function() {
      var item = new Item({ "id": "0" });
      viewport.renders["0"] = {};
      var spy = sinon.spy();
      emitter.on("viewport:item:erased", spy);
      viewport.removeItem(item);
      expect(spy).to.have.been.calledWith(DecksEvent("viewport:item:erased", viewport, item));
    });
  });

  describe("getRenders", function() {
    it("should return the renders object for an item", function() {
      var item1 = new Item({ id: 0 });
      var item2 = new Item({ id: 1 });
      var data1 = {};
      var data2 = {};
      viewport.renders["0"] = data1;
      viewport.renders["1"] = data2;

      expect(viewport.getRenders(item1)).to.equal(data1);
      expect(viewport.getRenders(item2)).to.equal(data2);
    });
  });

  describe("hasRenders", function() {
    it("should indicate if there are renders for an item", function() {
      var item1 = new Item({ id: 0 });
      var item2 = new Item({ id: 1 });
      var data1 = { "0": { } };
      var data2 = {};
      viewport.renders["0"] = data1;
      viewport.renders["1"] = data2;
      expect(viewport.hasRenders(item1)).to.be.True;
      expect(viewport.hasRenders(item2)).to.be.False;
    });
  });

  describe("setRender", function() {
    it("should store a render in the internal data structure", function() {
      var item = new Item();
      var render = {
        id: "render-id",
        item: item
      };
      viewport.setRender(render);
      expect(viewport.getRenders(item)).to.eql({
        "render-id": render
      });
    });

    // TODO: Event moved to onRenderAnimationComplete
    xit("should emit an event", function() {
      var item = new Item();
      var render = {
        id: "render-id",
        item: item
      };
      var spy = sinon.spy();
      emitter.on("viewport:render:drawn", spy);
      viewport.setRender(render);
      expect(spy).to.have.been.calledWith(DecksEvent("viewport:render:drawn", viewport, render));
    });
  });

  describe("removeRender", function() {
    it("should remove a render object from the internal data structure", function() {
      var item = new Item({ id: 0 });
      var render = {
        id: "0",
        item: item
      };
      viewport.renders["0"] = {};
      viewport.removeRender(render);
      expect(viewport.hasRenders(item)).to.be.False;
      expect(viewport.getRenders(item)).to.eql({});
    });
  });

  describe("drawRender", function() {
    xit("should call the animate function for the given render", function() {
      var render = {
        element: document.createElement("div"),
        transform: {},
        animateOptions: {}
      };
      var mockAnimator = sinon.mock(viewport.animator);
      mockAnimator.expects("animate").once().withArgs(sinon.match(function(arg) {
        return arg.elements === render.element &&
          arg.properties === render.transform &&
          !!arg.options;
      }));
      //viewport.animator = mockAnimator;
      viewport.drawRender(render);
      mockAnimator.verify();
    });
  });

  describe("drawRenders", function() {
    xit("TODO", function() {
    });
  });

  describe("eraseRender", function() {
    xit("TODO", function() {
    });
  });

  describe("eraseRenders", function() {
    xit("TODO", function() {
    });
  });

  describe("getAnimateOptions", function() {
    xit("TODO", function() {
    });
  });

  describe("createRenderElement", function() {
    xit("TODO", function() {
    });
  });

  describe("loadOrUnloadRender", function() {
    xit("TODO", function() {
    });
  });

  describe("onDeckReady", function() {
    it("should run a draw cycle", function() {
      var spy = sinon.spy(viewport, "drawItems");
      viewport.onDeckReady();
      expect(spy).to.have.been.calledWith({ isLoadNeeded: true });
      viewport.drawItems.restore();
    });

    it("should not run a draw cycle if drawOnDeckReady is false", function() {
      viewportOptions.drawOnDeckReady = false;
      viewport = new Viewport(viewportOptions);
      var spy = sinon.spy(viewport, "drawItems");
      viewport.onDeckReady();
      expect(spy).not.to.have.been.called;
      viewport.drawItems.restore();
    });
  });

  describe("onDeckLayoutSet", function() {
    xit("TODO", function() {
    });
  });

  describe("onFrameBoundsSet", function() {
    xit("TODO", function() {
    });
  });

  describe("onItemChanged", function() {
    xit("TODO", function() {
    });
  });

  describe("onItemIndexChanged", function() {
    xit("TODO", function() {
    });
  });

  describe("onItemCollectionItemRemoved", function() {
    xit("TODO", function() {
    });
  });

  describe("onAnimationBegin", function() {
    xit("TODO", function() {
    });
  });

  describe("onAnimationComplete", function() {
    xit("TODO", function() {
    });
  });

  describe("onAnimationProgress", function() {
    xit("TODO", function() {
    });
  });
});
