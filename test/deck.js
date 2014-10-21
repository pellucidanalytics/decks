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
  var deckOptions;
  var deck;

  beforeEach(function(){
    deckOptions = {
      animator: {
        animate: function() { }
      },
      config: {},
      emitter: new Emitter(),
      layout: new Layout({}),
      canvas: {},
      frame: {
        element: dom.create("div")
      },
      viewport: {}
    };

    deck = new Deck(deckOptions);
  });

  describe("constructor", function() {
    it("should work with new", function() {
      var deck = new Deck(deckOptions);
      expect(deck).to.be.an.instanceof(Deck);
    });

    it("should work without new", function() {
      var deck = Deck(deckOptions);
      expect(deck).to.be.an.instanceof(Deck);
    });

    it("should create the core services", function() {
      expect(deck.config).to.eql(Deck.prototype.defaultOptions.config);
      expect(deck.emitter).to.be.an.instanceof(Emitter);
      expect(deck.animator).to.eql(deckOptions.animator);
      expect(deck.itemCollection).to.be.an.instanceof(ItemCollection);
      expect(deck.layout).to.be.an.instanceof(Layout);
      expect(deck.frame).to.be.an.instanceof(Frame);
      expect(deck.canvas).to.be.an.instanceof(Canvas);
      expect(deck.viewport).to.be.an.instanceof(Viewport);
    });

    xit("should bind to emitter events", function() {
      var spy = sinon.spy(Deck.prototype, "bindEvents");
      new Deck(deckOptions);
      expect(spy).to.have.been.calledWith(deckOptions.emitter, Deck.prototype.emitterEvents);
      Deck.prototype.bindEvents.restore();
    });

    xit("should emit an event", function(){
      var spy = sinon.spy();
      deckOptions.emitter.on("deck:ready", spy);
      deck = new Deck(deckOptions);
      expect(spy).to.have.been.calledWith(DecksEvent("deck:ready", deck));
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
});
