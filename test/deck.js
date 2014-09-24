var tools = require("./test-tools");
var expect = tools.expect;
var Deck = require("../lib/deck");
var testDeck = new Deck({});

describe("deck", function () {
  describe("_calculateItemsPerRow", function () {
    it("should return the number of items that can fit in a row", function () {
      testDeck._calculateItemsPerRow(900, 300).should.equal(3);
      testDeck._calculateItemsPerRow(1000, 300, 50).should.equal(3);
      testDeck._calculateItemsPerRow(1000, 300, 51).should.equal(2);
      testDeck._calculateItemsPerRow(1000, 50).should.equal(20);
      testDeck._calculateItemsPerRow(1000, 50, 200).should.equal(4);
    });

    it("should never return less than one", function () {
      testDeck._calculateItemsPerRow(200, 300).should.equal(1);
      testDeck._calculateItemsPerRow(200, 200, 10).should.equal(1);
      testDeck._calculateItemsPerRow(100, 1, 200).should.equal(1);
    });
  });
});
