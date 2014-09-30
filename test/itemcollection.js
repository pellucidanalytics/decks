var tools = require("./test-tools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var ItemCollection = decks.ItemCollection;
var Item = decks.Item;
var EventEmitter = require("eventemitter2").EventEmitter2;

describe("ItemCollection", function() {
  describe("constructor", function() {
    it("should set sensible defaults", function() {
      var itemCollection = new ItemCollection();
      itemCollection._items.should.eql([]);
    });

    it("should be an instance of EventEmitter", function() {
      var itemCollection = new ItemCollection();
      itemCollection.should.be.an.instanceof(EventEmitter);
      itemCollection.on.should.be.a('function');
      itemCollection.off.should.be.a('function');
      itemCollection.emit.should.be.a('function');
    });
  });

  describe("getItem", function(){
    var items;
    var itemCollection;

    beforeEach(function(){
      items = [
        {
          key1: "val1",
          key2: 1
        },
        {
          key1: "val2",
          key2: 2
        }
      ];

      itemCollection = new ItemCollection(items);
    });

    it("should accept a Number index to get", function() {
      expect(itemCollection.getItem(-1)).to.be.undefined;
      expect(itemCollection.getItem(0)).to.eql(items[0]);
      expect(itemCollection.getItem(1)).to.eql(items[1]);
      expect(itemCollection.getItem(2)).to.be.undefined;
    });

    it("should accept an object to use as a _.where style get", function(){
      expect(itemCollection.getItem({ key1: "val1" })).to.eql(items[0]);
      expect(itemCollection.getItem({ key1: "val2" })).to.eql(items[1]);
      expect(itemCollection.getItem({ key1: "val3" })).to.be.undefined;
    });

    it("should accept a functioln to use as a _.find/_.filter style get", function() {
      expect(itemCollection.getItem(function(item) { return item.key1 === "val1"; })).to.eql(items[0]);
      expect(itemCollection.getItem(function(item) { return item.key1 === "val2"; })).to.eql(items[1]);
      expect(itemCollection.getItem(function(item) { return item.key1 === "val3"; })).to.be.undefined;
    });
  });

  describe("getItems", function() {
    it("should...", function() {
    });
  });

  describe("addItem", function() {
    it("should...", function() {
    });
  });

  describe("addItems", function() {
    it("should...", function() {
    });
  });

  describe("removeItem", function() {
    it("should...", function() {
    });
  });

  describe("clear", function() {
    it("should...", function() {
    });
  });

  describe("bindItemEvents", function() {
    it("should...", function() {
    });
  });

  describe("unbindItemEvents", function() {
    it("should...", function() {
    });
  });

  describe("onItemChanged", function() {
    it("should...", function() {
    });
  });
});
