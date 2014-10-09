var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var services = decks.services;
var Emitter = decks.events.Emitter;
var ItemCollection = decks.ItemCollection;

describe("ItemCollection", function() {
  beforeEach(function() {
    services.emitter = new Emitter();
  });

  describe("constructor", function() {
    it("should set sensible defaults", function() {
      var itemCollection = new ItemCollection();
      itemCollection._items.should.eql({});
    });
  });

  describe("getItem", function(){
    var items;
    var itemCollection;

    beforeEach(function(){
      items = [
        {
          id: 0,
          key1: "val1",
          key2: 1
        },
        {
          id: 1,
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

    it("should accept a String index to get", function() {
      expect(itemCollection.getItem("-1")).to.be.undefined;
      expect(itemCollection.getItem("0").getData()).to.eql(items[0]);
      expect(itemCollection.getItem("1").getData()).to.eql(items[1]);
      expect(itemCollection.getItem("2")).to.be.undefined;
    });
  });

  describe("getItems", function() {
    var items;
    var itemCollection;

    beforeEach(function() {
      items = [
        {
          id: 0,
          key1: "val1",
          key2: 1
        },
        {
          id: 1,
          key1: "val2",
          key2: 2
        },
        {
          id: 2,
          key1: "val3",
          key2: 3
        }
      ];
      itemCollection = new ItemCollection(items);
    });

    it("should return all items", function() {
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
      services.emitter.on("item:collection:item:added", spy);

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
