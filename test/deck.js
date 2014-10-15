var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var dom = decks.ui.dom;
var services = decks.services;
var Emitter = decks.events.Emitter;
var Deck = decks.Deck;
var ItemCollection = decks.ItemCollection;
var Layout = decks.Layout;
var Canvas = decks.Canvas;
var Frame = decks.Frame;
var Viewport = decks.Viewport;

describe("decks.Deck", function () {
  var animator;
  var layout;
  var frame;
  var options;
  beforeEach(function(){
    animator = {
      animate: function() {
        throw new Error("not implemented");
      }
    };

    layout = {
    };

    frame = {
      element: dom.create("div")
    };

    options = {
      animator: animator,
      layout: layout,
      frame: frame
    };
  });

  describe("constructor", function() {
    it("should work with new", function() {
      var deck = new Deck(options);
      expect(deck).to.be.an.instanceof(Deck);
    });

    it("should work without new", function() {
      var deck = Deck(options);
      expect(deck).to.be.an.instanceof(Deck);
    });

    it("should create the core services", function() {
      new Deck(options);

      expect(services.config).to.eql({ debugEvents: false, debugDrawing: false });
      expect(services.emitter).to.be.an.instanceof(Emitter);
      expect(services.animator).to.eql(animator);
      expect(services.itemCollection).to.be.an.instanceof(ItemCollection);
      expect(services.layout).to.be.an.instanceof(Layout);
      expect(services.frame).to.be.an.instanceof(Frame);
      expect(services.canvas).to.be.an.instanceof(Canvas);
      expect(services.viewport).to.be.an.instanceof(Viewport);
    });

    it("should bind to emitter events", function() {
      var spy = sinon.spy(Deck.prototype, "bindEvents");
      new Deck(options);
      expect(spy).to.have.been.calledWith(services.emitter, Deck.emitterEvents);
      Deck.prototype.bindEvents.restore();
    });

    it("should emit an event", function(){
      var spy = sinon.spy();
      options.emitter = new Emitter();
      options.emitter.on("deck:ready", spy);
      var deck = new Deck(options);
      expect(spy).to.have.been.calledWithMatch(function(e) {
        return e.type === "deck:ready" &&
          e.sender === deck;
      });
    });
  });

  describe("getItems", function(){
  });

  describe("getItem", function(){
  });

  describe("addItem", function(){
  });

  describe("addItems", function(){
  });

  describe("removeItem", function(){
  });

  describe("clear", function(){
  });

  describe("setFilter", function(){
  });

  describe("setSortBy", function(){
  });

  describe("setReversed", function(){
  });

  describe("setConfig", function(){
  });

  describe("setEmitter", function(){
  });

  describe("setAnimator", function(){
  });

  describe("setItemCollection", function(){
  });

  describe("setLayout", function(){
  });

  describe("setCanvas", function(){
  });

  describe("setFrame", function(){
  });

  describe("setViewport", function(){
  });

  describe("setService", function() {
    it("should set a provided instance on the services object", function() {
      var deck = new Deck(options);
      var TestService = function(options) { this.options = options; };
      var testService = new TestService({ key: "val" });
      deck.setService("test", testService, TestService);
      expect(services.test).to.eql(testService);
    });

    it("should create a service instance if provided with options", function(){
      var deck = new Deck(options);
      var TestService = function(options) { this.options = options; };
      var testServiceOptions = { key: "val" };
      deck.setService("test", testServiceOptions, TestService);
      expect(services.test).to.eql(new TestService({ key: "val" }));
    });

    it("should emit an event", function() {
      options.emitter = new Emitter();
      var TestService = function(options) { this.options = options; };
      var spy = sinon.spy();
      options.emitter.on("deck:test:set", spy);
      var deck = new Deck(options);
      deck.setService("test", { key: "val" }, TestService);
      expect(spy).to.have.been.calledWithMatch(function(e) {
        return e.type === "deck:test:set" &&
          e.sender === deck &&
          e.data instanceof TestService;
      });
    });
  });
});
