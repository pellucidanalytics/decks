var tools = require("./testtools");
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
      expect(itemCollection.getItem(0).getData()).to.eql(items[0]);
      expect(itemCollection.getItem(1).getData()).to.eql(items[1]);
      expect(itemCollection.getItem(2)).to.be.undefined;
    });

    it("should accept a function to use as a _.find/_.filter style get", function() {
      expect(itemCollection.getItem(function(item) { return item.get("key1") === "val1"; }).getData()).to.eql(items[0]);
      expect(itemCollection.getItem(function(item) { return item.get("key1") === "val2"; }).getData()).to.eql(items[1]);
      expect(itemCollection.getItem(function(item) { return item.get("key1") === "val3"; })).to.be.undefined;
    });
  });

  describe("getItems", function() {
    var items;
    var itemCollection;

    beforeEach(function() {
      items = [
        {
          key1: "val1",
          key2: 1
        },
        {
          key1: "val2",
          key2: 2
        },
        {
          key1: "val3",
          key2: 3
        }
      ];
      itemCollection = new ItemCollection(items);
    });

    it("should accept a filter function to get items", function() {
      var filter = function(item) {
        return item.get("key2") >= 2;
      };
      expect(itemCollection.getItems(filter).length).to.eql(2);
    });

    it("should return all items if no filter", function() {
      expect(itemCollection.getItems().length).to.eql(3);
    });
  });

  describe("addItem", function() {
    var itemCollection;

    beforeEach(function(){
      itemCollection = new ItemCollection();
    });

    it("should add an plain object item and emit an event", function() {
      var spy = sinon.spy();
      var item = { key1: "val1" };
      itemCollection.on("item:added", spy);

      itemCollection.addItem(item);

      //expect(itemCollection.getItems()).to.eql(
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
