var tools = require("../testtools");
var expect = tools.expect;
var decks = require("../..");
var DecksEvent = decks.events.DecksEvent;

describe("DecksEvent", function() {
  describe("constructor", function() {
    it("should set properties", function() {
      var type = "test:type";
      var sender = {};
      var data = {};

      var e = new DecksEvent(type, sender, data);
      expect(e.type).to.eql(type);
      expect(e.sender).to.eql(sender);
      expect(e.data).to.eql(data);
    });
  });
});
