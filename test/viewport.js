var _ = require("lodash");
var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var services = decks.services;
var Viewport = decks.Viewport;
var Item = decks.Item;
var ItemCollection = decks.ItemCollection;
var Emitter = decks.events.Emitter;
var DecksEvent = decks.events.DecksEvent;
var Layout = decks.Layout;

describe("decks.Viewport", function() {
  var animator;
  var emitter;
  var layout;
  var itemCollection;
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
    services.animator = animator = {
      animate: function() { }
    };
    services.emitter = emitter = new Emitter();
    services.layout = layout = new Layout({
      getRenders: function() { }
    });
    services.itemCollection = itemCollection = new ItemCollection();
    services.viewport = viewport = new Viewport();
  });

  describe("constructor", function() {
    it("should work with new", function() {
      var viewport = new Viewport();
      expect(viewport).to.be.an.instanceof(Viewport);
    });

    it("should work without new", function() {
      var viewport = Viewport();
      expect(viewport).to.be.an.instanceof(Viewport);
    });

    it("should bind emitter events", function() {
      var spy = sinon.spy(Viewport.prototype, "bindEvents");
      new Viewport();
      expect(spy).to.have.been.calledWith(services.emitter, Viewport.emitterEvents);
      Viewport.prototype.bindEvents.restore();
    });
  });

  describe("drawItem", function() {
    it("should throw for no item", function() {
      expect(function() { viewport.drawItem(); }).to.throw(Error);
    });

    it("should call layout.getRenders, then drawRenders", function() {
      var viewport = new Viewport();
      var item = new Item();

      var mockViewport = sinon.mock(viewport);
      var mockLayout = sinon.mock(services.layout);
      var renders = [
        {
          tranform: {},
          animateOptions: {}
        },
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
      expect(item.isRemoving).to.be.true;
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
      viewport._renders["0"] = {};
      viewport.removeItem({ id: "0" });
      expect(viewport._renders["0"]).to.be.undefined;
    });

    it("should emit an event", function() {
      var item = new Item({ "id": "0" });
      viewport._renders["0"] = {};
      var spy = sinon.spy();
      services.emitter.on("viewport:item:removed", spy);
      viewport.removeItem(item);
      expect(spy).to.have.been.calledWith(DecksEvent("viewport:item:removed", viewport, item));

    });
  });

  describe("getRenders", function() {
    it("should return the renders object for an item", function() {
      var item1 = new Item({ id: 0 });
      var item2 = new Item({ id: 1 });
      var data1 = {};
      var data2 = {};
      viewport._renders["0"] = data1;
      viewport._renders["1"] = data2;

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
      viewport._renders["0"] = data1;
      viewport._renders["1"] = data2;
      expect(viewport.hasRenders(item1)).to.be.true;
      expect(viewport.hasRenders(item2)).to.be.false;
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

    it("should emit an event", function() {
      var item = new Item();
      var render = {
        id: "render-id",
        item: item
      };
      var spy = sinon.spy();
      emitter.on("viewport:render:set", spy);
      viewport.setRender(render);
      expect(spy).to.have.been.calledWith(DecksEvent("viewport:render:set", viewport, render));
    });
  });

  describe("removeRender", function() {
    it("should remove a render object from the internal data structure", function() {
      var item = new Item({ id: 0 });
      var render = {
        id: "0",
        item: item
      };
      viewport._renders["0"] = {};
      viewport.removeRender(render);
      expect(viewport.hasRenders(item)).to.be.false;
      expect(viewport.getRenders(item)).to.eql({});
    });
  });

  describe("drawRender", function() {
    it("should call the animate function for the given render", function() {
      var render = {
        element: {},
        transform: {},
        animateOptions: {}
      };

      var mockAnimator = sinon.mock(animator);

      mockAnimator.expects("animate").once().withArgs(sinon.match({
        elements: render.element,
        properties: render.transform,
        options: render.animateOptions
      }));

      viewport.drawRender(render);

      mockAnimator.verify();
    });
  });

  describe("drawRenders", function() {
  });

  describe("eraseRender", function() {
  });

  describe("eraseRenders", function() {
  });

  describe("getAnimateOptions", function() {
  });

  describe("createRenderElement", function() {
  });

  describe("loadOrUnloadRender", function() {
  });

  describe("onDeckReady", function() {
  });

  describe("onDeckLayoutSet", function() {
  });

  describe("onFrameBoundsSet", function() {
  });

  describe("onItemChanged", function() {
  });

  describe("onItemIndexChanged", function() {
  });

  describe("onItemCollectionItemRemoved", function() {
  });

  describe("onAnimationBegin", function() {
  });

  describe("onAnimationComplete", function() {
  });

  describe("onAnimationProgress", function() {
  });
});
