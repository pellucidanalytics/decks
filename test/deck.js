var _ = require("lodash");
var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var dom = decks.ui.dom;
var DecksEvent = decks.events.DecksEvent;
var Emitter = decks.events.Emitter;
var Deck = decks.Deck;
var ItemCollection = decks.ItemCollection;
var Layout = decks.Layout;
var Canvas = decks.Canvas;
var Frame = decks.Frame;
var Viewport = decks.Viewport;

describe("decks.Deck", function () {
  var animator;
  var config;
  var emitter;
  var itemCollection;
  var layout;
  var canvas;
  var frame;
  var viewport;
  var deckOptions;
  var deck;

  beforeEach(function(){
    animator = {
      animate: function() { }
    };
    config = Deck.prototype.defaultOptions.config,
    emitter = new Emitter();
    itemCollection = [];
    layout = new Layout();
    canvas = {};
    frame = {
      element: dom.create("div")
    };
    viewport = {};
    deckOptions = {
      animator: animator,
      config: config,
      emitter: emitter,
      layout: layout,
      canvas: canvas,
      frame: frame,
      viewport: viewport
    };
    deck = new Deck(deckOptions);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      expect(deck).to.be.an.instanceof(Deck);
    });

    it("should work without new", function() {
      var deck = Deck(deckOptions);
      expect(deck).to.be.an.instanceof(Deck);
    });

    it("should create the core services", function() {
      expect(deck.config).to.eql(Deck.prototype.defaultOptions.config);
      expect(deck.emitter).to.eql(emitter);
      expect(deck.animator).to.eql(animator);
      expect(deck.itemCollection).to.be.an.instanceof(ItemCollection);
      expect(deck.layout).to.be.an.instanceof(Layout);
      expect(deck.frame).to.be.an.instanceof(Frame);
      expect(deck.canvas).to.be.an.instanceof(Canvas);
      expect(deck.viewport).to.be.an.instanceof(Viewport);
    });

    it("should bind to emitter events", function() {
      var spy = sinon.spy(Deck.prototype, "bindEvents");
      new Deck(deckOptions);
      expect(spy).to.have.been.calledWith(emitter, Deck.prototype.emitterEvents);
      Deck.prototype.bindEvents.restore();
    });

    it("should emit an event", function(){
      var spy = sinon.spy();
      emitter.on("deck:ready", spy);
      deck = new Deck(deckOptions);
      expect(spy).to.have.been.calledWith(DecksEvent("deck:ready", deck));
    });
  });

  describe("itemCollection methods", function() {
    var mockItemCollection;

    beforeEach(function() {
      mockItemCollection = sinon.mock(deck.itemCollection);
    });

    afterEach(function() {
      mockItemCollection.verify();
    });

    describe("getItems", function() {
      it("should call through to itemCollection.getItems()", function() {
        mockItemCollection.expects("getItems").once();
        deck.getItems();
      });
    });

    describe("getItem", function() {
      it("should call through to itemCollection.getItem()", function() {
        var id = "test";
        mockItemCollection.expects("getItem").once().withArgs(id);
        deck.getItem(id);
      });
    });

    describe("addItem", function() {
      it("should call through to itemCollection.addItem()", function() {
        var item = { key: "val" };
        mockItemCollection.expects("addItem").once().withArgs(item);
        deck.addItem(item);
      });
    });

    describe("addItems", function() {
      it("should call through to itemCollection.addItem()", function() {
        var items = [{ key: "val" }, { key: "val2" }];
        mockItemCollection.expects("addItems").once().withArgs(items);
        deck.addItems(items);
      });
    });

    describe("removeItem", function() {
      it("should call through to itemCollection.removeItem()", function() {
        var item = { key: "val" };
        mockItemCollection.expects("removeItem").once().withArgs(item);
        deck.removeItem(item);
      });
    });

    describe("clear", function() {
      it("should call through to itemCollection.clear()", function() {
        mockItemCollection.expects("clear").once();
        deck.clear();
      });
    });

    describe("setFilter", function(){
      it("should call through to itemCollection.setFilter()", function() {
        var filter = function() { };
        mockItemCollection.expects("setFilter").once().withArgs(filter);
        deck.setFilter(filter);
      });
    });

    describe("setSortBy", function(){
      it("should call through to itemCollection.setSortBy()", function() {
        var sortBy = function() { };
        mockItemCollection.expects("setSortBy").once().withArgs(sortBy);
        deck.setSortBy(sortBy);
      });
    });

    describe("setReversed", function(){
      it("should call through to itemCollection.setReversed()", function() {
        var isReversed = true;
        mockItemCollection.expects("setReversed").once().withArgs(isReversed);
        deck.setReversed(isReversed);
      });
    });
  });

  describe("setConfig", function() {
    it("should be set by constructor", function() {
      deckOptions = _.merge(deckOptions, { config: { key: "val" } });
      deck = new Deck(deckOptions);
      var expectedConfig = _.merge({}, Deck.prototype.defaultOptions.config, { key: "val" });
      expect(deck.config).to.eql(expectedConfig);
    });

    it("should throw if already set", function() {
      expect(function() { deck.setConfig({}); }).to.throw(Error);
    });
  });

  describe("setEmitter", function() {
    it("should be set by constructor", function() {
      var emitter = new Emitter();
      deckOptions.emitter = emitter;
      deck = new Deck(deckOptions);
      expect(deck.emitter).to.eql(emitter);
    });

    it("should throw if already set", function() {
      expect(function() { deck.setEmitter({}); }).to.throw(Error);
    });
  });

  describe("setAnimator", function() {
    it("should be set by constructor", function() {
      var animator = { animate: function() { } };
      deckOptions.animator = animator;
      deck = new Deck(deckOptions);
      expect(deck.animator).to.eql(animator);
    });

    it("should throw if already set", function() {
      expect(function() { deck.setAnimator({}); }).to.throw(Error);
    });
  });

  describe("setItemCollection", function() {
    it("should be set by constructor", function() {
      var itemCollection = new ItemCollection();
      deckOptions.itemCollection = itemCollection;
      deck = new Deck(deckOptions);
      expect(deck.itemCollection).to.eql(itemCollection);
    });

    it("should throw if already set", function() {
      expect(function() { deck.setItemCollection([]); }).to.throw(Error);
    });
  });

  describe("setLayout", function(){
    it("should set the new layout", function() {
      var layout = new Layout();
      deck.setLayout(layout);
      expect(deck.layout).to.eql(layout);
    });

    it("should emit an event", function() {
      var spy = sinon.spy();
      emitter.on("deck:layout:set", spy);
      var layout = new Layout();
      deck.setLayout(layout);
      expect(spy).to.have.been.calledWith(DecksEvent("deck:layout:set", deck, layout));
    });
  });

  describe("setCanvas", function(){
    it("should be set by the constructor", function() {
      canvas = new Canvas({
        animator: animator,
        config: Deck.prototype.defaultOptions.config,
        emitter: emitter,
        layout: layout
      });
      deckOptions.canvas = canvas;
      var deck = new Deck(deckOptions);
      expect(deck.canvas).to.eql(canvas);
    });

    it("should throw if already set", function() {
      expect(function() { deck.setCanvas({}); }).to.throw(Error);
    });
  });

  describe("setFrame", function(){
    it("should be set by the constructor", function() {
      frame = new Frame({
        animator: animator,
        config: Deck.prototype.defaultOptions.config,
        emitter: emitter,
        element: dom.create("div")
      });
      deckOptions.frame = frame;
      var deck = new Deck(deckOptions);
      expect(deck.frame).to.eql(frame);
    });

    it("should throw if already set", function() {
      expect(function() { deck.setFrame({}); }).to.throw(Error);
    });
  });

  describe("setViewport", function(){
    it("should be set by the constructor", function() {
      viewport = new Viewport({
        animator: animator,
        config: Deck.prototype.defaultOptions.config,
        emitter: emitter,
        itemCollection: new ItemCollection(),
        layout: layout,
        canvas: new Canvas(_.merge(canvas, {
          animator: animator,
          config: config,
          emitter: emitter,
          layout: layout
        })),
        frame: new Frame(_.merge(frame, {
          animator: animator,
          config: config,
          emitter: emitter
        }))
      });
      deckOptions.viewport = viewport;
      var deck = new Deck(deckOptions);
      expect(deck.viewport).to.eql(viewport);
    });

    it("should throw if already set", function() {
      expect(function() { deck.setViewport({}); }).to.throw(Error);
    });
  });
});
