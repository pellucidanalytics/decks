var tools = require("./testtools");
var expect = tools.expect;
var sinon = tools.sinon;
var decks = require("..");
var Emitter = decks.events.Emitter;
var Item = decks.Item;
var ItemCollection = decks.ItemCollection;
var DecksEvent = decks.events.DecksEvent;

describe("decks.ItemCollection", function() {
  var emitter;
  var itemCollectionOptions;
  var itemCollection;

  beforeEach(function() {
    emitter = new Emitter();
    itemCollectionOptions = {
      emitter: emitter
    };
    itemCollection = new ItemCollection([], itemCollectionOptions);
  });

  describe("constructor", function() {
    it("should set sensible defaults", function() {
      itemCollection.items.should.eql({});
      expect(itemCollection.emitter).to.eql(emitter);
    });
  });

  describe("getItem", function(){
    var items;
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

      itemCollection = new ItemCollection(items, itemCollectionOptions);
    });

    it("should accept a Number index to get", function() {
      expect(itemCollection.getItem(-1)).to.be.Undefined;
      expect(itemCollection.getItem(0).getData()).to.eql(items[0]);
      expect(itemCollection.getItem(1).getData()).to.eql(items[1]);
      expect(itemCollection.getItem(2)).to.be.Undefined;
    });

    it("should accept a String index to get", function() {
      expect(itemCollection.getItem("-1")).to.be.Undefined;
      expect(itemCollection.getItem("0").getData()).to.eql(items[0]);
      expect(itemCollection.getItem("1").getData()).to.eql(items[1]);
      expect(itemCollection.getItem("2")).to.be.Undefined;
    });
  });

  describe("getItems", function() {
    var items;

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
      itemCollection = new ItemCollection(items, itemCollectionOptions);
    });

    it("should return all items", function() {
      var items = itemCollection.getItems();
      expect(items).to.be.an("array");
      expect(items.length).to.eql(3);
    });

    it("should return items based on a filter", function() {
      var items = itemCollection.getItems(function(item) {
        return item.get("key2") > 1;
      });

      expect(items).to.be.an("array");
      expect(items.length).to.eql(2);
      expect(items[0].id).to.eql("1");
      expect(items[1].id).to.eql("2");
    });
  });

  describe("addItem", function() {
    it("should throw if item is not specified", function() {
      expect(function() { itemCollection.addItem(); }).to.Throw;
    });

    it("should throw for duplicate Item id", function() {
      var item = { id: 10 };
      itemCollection.addItem(item);
      expect(function() { itemCollection.addItem(item); }).to.Throw;
    });

    it("should add a plain object item to the internal collection", function() {
      expect(itemCollection.items).to.eql({});
      itemCollection.addItem({ id: 10 });
      expect(itemCollection.items["10"]).to.be.an.instanceOf(Item);
    });

    it("should add an Item to the internal collection", function() {
      expect(itemCollection.items).to.eql({});
      var item = new Item({ id: 10 });
      itemCollection.addItem(item);
      expect(itemCollection.items["10"]).to.eql(item);
    });

    it("should emit events for adding and added", function() {
      var addingSpy = sinon.spy();
      var addedSpy = sinon.spy();
      var item = new Item({ key1: "val1" });
      itemCollection.on("item:collection:item:adding", addingSpy);
      itemCollection.on("item:collection:item:added", addedSpy);
      itemCollection.addItem(item);
      expect(addingSpy).to.have.been.calledOnce;
      expect(addedSpy).to.have.been.calledOnce;
    });

    it("should not emit events if options.silent", function() {
      var addingSpy = sinon.spy();
      var addedSpy = sinon.spy();
      var item = new Item({ key1: "val1" });
      itemCollection.on("item:collection:item:adding", addingSpy);
      itemCollection.on("item:collection:item:added", addedSpy);
      itemCollection.addItem(item, { silent: true });
      expect(addingSpy).not.to.have.been.called;
      expect(addedSpy).not.to.have.been.called;
    });

    it("should bind to the Item events", function() {
      var spy = sinon.spy(itemCollection, "bindEvents");
      var item = new Item();
      itemCollection.addItem(item);
      expect(spy).to.have.been.calledWith(item, itemCollection.getItemEvents());
      spy.reset();
    });

    it("should call index", function() {
      var spy = sinon.spy(itemCollection, "index");
      itemCollection.addItem({ id: 10 });
      expect(spy).to.have.been.calledWith({ isAddItem: true });
      spy.restore();
    });

    it("should not call index if options.noIndex", function() {
      var spy = sinon.spy(itemCollection, "index");
      itemCollection.addItem({ id: 10 }, { noIndex: true });
      expect(spy).not.to.have.been.called;
      spy.restore();
    });

    it("should return the added Item (from options)", function() {
      var itemOptions = {
        id: 10,
        index: 0,
        key: "val"
      };
      var item = itemCollection.addItem(itemOptions);
      expect(item).to.be.an.instanceOf(Item);
      expect(item.getData()).to.eql(itemOptions);
    });

    it("should return the added Item (from options)", function() {
      var item = new Item({
        id: 10,
        index: 0,
        key: "val"
      });
      var returned = itemCollection.addItem(item);
      expect(returned).to.eql(item);
    });
  });

  describe("addItems", function() {
    it("should throw if items is not an array", function() {
      expect(function() { itemCollection.addItems(); }).to.Throw;
      expect(function() { itemCollection.addItems({}); }).to.Throw;
      expect(function() { itemCollection.addItems(1); }).to.Throw;
      expect(function() { itemCollection.addItems(""); }).to.Throw;
    });

    it("should do nothing for an empty array", function() {
      var emitSpy = sinon.spy(itemCollection, "emit");
      var addItemSpy = sinon.spy(itemCollection, "addItem");
      var indexSpy = sinon.spy(itemCollection, "index");

      itemCollection.addItems([]);

      expect(emitSpy).not.to.have.been.called;
      expect(addItemSpy).not.to.have.been.called;
      expect(indexSpy).not.to.have.been.called;
    });

    it("should call addItem for each item", function() {
      var addItemSpy = sinon.spy(itemCollection, "addItem");
      var item1 = {};
      var item2 = {};
      var items = [item1, item2];
      itemCollection.addItems(items);
      expect(addItemSpy).to.have.been.calledWith(item1, { silent: true, noIndex: true });
      expect(addItemSpy).to.have.been.calledWith(item2, { silent: true, noIndex: true });
    });

    it("should emit events", function(){
      var spy = sinon.spy(itemCollection, "emit");

      var item1 = new Item({ key: "val" });
      var item2 = new Item({ key: "val" });
      var items = [item1, item2];
      //itemCollection.on("*", function(e) { console.log(e.type); });

      itemCollection.addItems(items);

      expect(spy).to.have.callCount(6);
      expect(spy).to.have.been.calledWith(DecksEvent("item:collection:items:adding", itemCollection));
      expect(spy).to.have.been.calledWith(DecksEvent("item:collection:items:added", itemCollection, items));
      expect(spy).to.have.been.calledWith(DecksEvent("item:collection:indexing", itemCollection, {
        reason: { isAddItems: true },
        totalCount: 2,
        referenceCount: 2
      }));
      expect(spy).to.have.been.calledWith(DecksEvent("item:index:changed", item1, 0));
      expect(spy).to.have.been.calledWith(DecksEvent("item:index:changed", item2, 1));
      expect(spy).to.have.been.calledWith(DecksEvent("item:collection:indexed", itemCollection, {
        reason: { isAddItems: true },
        totalCount: 2,
        referenceCount: 2,
        changedCount: 2
      }));
    });

    it("should not emit events if options.silent", function(){
      var spy = sinon.spy(itemCollection, "emit");

      var item1 = { key: "val" };
      var item2 = { key: "val" };
      var items = [item1, item2];

      itemCollection.on("*", console.log);

      itemCollection.addItems(items, { silent: true });

      expect(spy).not.to.have.been.called;
    });

    it("should index the collection", function() {
      var spy = sinon.spy(itemCollection, "index");
      itemCollection.addItems([{}, {}]);
      expect(spy).to.have.been.calledWith({ isAddItems: true }, { silent: undefined });
    });

    it("should not index the collection if options.noIndex", function() {
      var spy = sinon.spy(itemCollection, "index");
      itemCollection.addItems([{}, {}], { noIndex: true });
      expect(spy).not.to.have.been.called;
    });
  });

  describe("removeItem", function() {
    xit("TODO", function() {
    });
  });

  describe("clear", function() {
    xit("TODO", function() {
    });
  });

  describe("indexing operations", function() {
    var items;

    beforeEach(function() {
      items = [
        {
          id: 10,
          prop: 20
        },
        {
          id: 20,
          prop: 10
        },
        {
          id: 30,
          prop: 30
        }
      ];
    });

    it("should apply a default index to each item", function() {
      itemCollection.addItems(items);

      expect(itemCollection.getItem("10").index).to.eql(0);
      expect(itemCollection.getItem("20").index).to.eql(1);
      expect(itemCollection.getItem("30").index).to.eql(2);
    });

    describe("setFilter", function() {
      it("it should set item indices based on the filter function", function() {
        itemCollection.addItems(items);

        itemCollection.setFilter(function(item) {
          return item.getData().prop > 10;
        });

        expect(itemCollection.getItem("10").index).to.eql(0);
        expect(itemCollection.getItem("20").index).to.eql(-1);
        expect(itemCollection.getItem("30").index).to.eql(1);

        itemCollection.setFilter(null);

        expect(itemCollection.getItem("10").index).to.eql(0);
        expect(itemCollection.getItem("20").index).to.eql(1);
        expect(itemCollection.getItem("30").index).to.eql(2);
      });
    });

    describe("setSortBy", function() {
      it("should set item indices based on the sortBy function", function() {
        itemCollection.addItems(items);

        itemCollection.setSortBy(function(item) {
          return item.getData().prop;
        });

        expect(itemCollection.getItem("10").index).to.eql(1);
        expect(itemCollection.getItem("20").index).to.eql(0);
        expect(itemCollection.getItem("30").index).to.eql(2);

        itemCollection.setSortBy(null);

        expect(itemCollection.getItem("10").index).to.eql(0);
        expect(itemCollection.getItem("20").index).to.eql(1);
        expect(itemCollection.getItem("30").index).to.eql(2);
      });
    });

    describe("setReversed", function() {
      it("should set item indices based on the reversed flag", function() {
        itemCollection.addItems(items);

        itemCollection.setReversed(true);

        expect(itemCollection.getItem("10").index).to.eql(2);
        expect(itemCollection.getItem("20").index).to.eql(1);
        expect(itemCollection.getItem("30").index).to.eql(0);

        itemCollection.setReversed(false);

        expect(itemCollection.getItem("10").index).to.eql(0);
        expect(itemCollection.getItem("20").index).to.eql(1);
        expect(itemCollection.getItem("30").index).to.eql(2);
      });
    });

    describe("index", function() {
      it("should emit events for addItem", function() {
        var indexingSpy = sinon.spy();
        var indexedSpy = sinon.spy();

        itemCollection.addItems(items);

        itemCollection.on("item:collection:indexing", indexingSpy);
        itemCollection.on("item:collection:indexed", indexedSpy);

        itemCollection.addItem({ id: 40, prop: 0 });

        expect(indexingSpy).to.have.been.calledWith(DecksEvent("item:collection:indexing", itemCollection, {
          reason: { isAddItem: true },
          totalCount: 4,
          referenceCount: 4
        }));

        expect(indexedSpy).to.have.been.calledWith(DecksEvent("item:collection:indexed", itemCollection, {
          reason: { isAddItem: true },
          totalCount: 4,
          referenceCount: 4,
          changedCount: 1 // "40" added at end
        }));
      });

      it("should emit events for addItems", function() {
        var indexingSpy = sinon.spy();
        var indexedSpy = sinon.spy();

        itemCollection.on("item:collection:indexing", indexingSpy);
        itemCollection.on("item:collection:indexed", indexedSpy);

        itemCollection.addItems(items);

        expect(indexingSpy).to.have.been.calledWith(DecksEvent("item:collection:indexing", itemCollection, {
          reason: { isAddItems: true },
          totalCount: 3,
          referenceCount: 3
        }));

        expect(indexedSpy).to.have.been.calledWith(DecksEvent("item:collection:indexed", itemCollection, {
          reason: { isAddItems: true },
          totalCount: 3,
          referenceCount: 3,
          changedCount: 3 // "10": index=0, "20": index=1, "30": index=2
        }));
      });

      it("should emit events for setFilter", function() {
        var indexingSpy = sinon.spy();
        var indexedSpy = sinon.spy();

        itemCollection.addItems(items);

        itemCollection.on("item:collection:indexing", indexingSpy);
        itemCollection.on("item:collection:indexed", indexedSpy);

        itemCollection.setFilter(function(item) {
          return item.get("prop") > 10;
        });

        expect(indexingSpy).to.have.been.calledWith(DecksEvent("item:collection:indexing", itemCollection, {
          reason: { isSetFilter: true },
          totalCount: 3,
          referenceCount: 2
        }));

        expect(indexedSpy).to.have.been.calledWith(DecksEvent("item:collection:indexed", itemCollection, {
          reason: { isSetFilter: true },
          totalCount: 3,
          referenceCount: 2,
          changedCount: 2 // "10": no change, "20": index=-1, "30": index=1
        }));
      });
    });
  });

  describe("onItemEvent", function() {
    it("should re-emit the event", function() {
      var spy = sinon.spy(itemCollection, "emit");
      var item = new Item();
      itemCollection.addItem(item);
      var e = DecksEvent("some:item:event", item, {});
      item.emit(e);
      expect(spy).to.have.been.calledWith(e);
    });
  });
});
