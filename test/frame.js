var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var dom = decks.ui.dom;
var services = decks.services;
var Emitter = decks.events.Emitter;
var Frame = decks.Frame;

describe("decks.Frame", function() {
  beforeEach(function(){
    services.emitter = new Emitter();
  });

  describe("constructor", function() {
    it("should work with new", function() {
      var element = dom.create("div");
      var frame = new Frame({ element: element });
      expect(frame).to.be.an.instanceof(Frame);
    });

    it("should work without new", function() {
      var element = dom.create("div");
      var frame = Frame({ element: element });
      expect(frame).to.be.an.instanceof(Frame);
    });

    it("should throw if no options specified", function() {
      expect(function() { new Frame(); }).to.throw(Error);
    });

    it("should set an element", function() {
      var element = dom.create("div");
      var frame = new Frame({ element: element });
      expect(frame.element).to.eql(element);
    });

    it("should bind emitter events", function() {
      var spy = sinon.spy(Frame.prototype, "bindEvents");
      var element = dom.create("div");
      new Frame({ element: element });
      expect(spy).to.have.been.calledWith(services.emitter, Frame.emitterEvents);
      Frame.prototype.bindEvents.restore();
    });

    it("should bind window events", function() {
      var spy = sinon.spy(Frame.prototype, "bindEvents");
      var element = dom.create("div");
      new Frame({ element: element });
      expect(spy).to.have.been.calledWith(window, Frame.windowEvents);
      Frame.prototype.bindEvents.restore();
    });
  });

  describe("setElement", function() {
  });

  describe("setBounds", function() {
  });

  describe("isElementVisible", function() {
  });

  describe("onCanvasElementSet", function() {
  });

  describe("onWindowResize", function() {
  });

  describe("onWindowScroll", function() {
  });
});
