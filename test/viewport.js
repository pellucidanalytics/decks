var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var services = decks.services;
var Viewport = decks.Viewport;

describe("decks.Viewport", function() {
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
  });

  describe("drawItems", function() {
  });

  describe("eraseItem", function() {
  });

  describe("eraseItems", function() {
  });

  describe("removeItem", function() {
  });

  describe("getRenders", function() {
  });

  describe("hasRenders", function() {
  });

  describe("setRender", function() {
  });

  describe("removeRender", function() {
  });

  describe("drawRender", function() {
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
