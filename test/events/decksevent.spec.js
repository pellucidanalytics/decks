var tools = require("../testtools");
var expect = tools.expect;
var decks = require("../..");
var DecksEvent = decks.events.DecksEvent;

describe("decks.events.DecksEvent", function() {
  describe("constructor", function() {
    it("should work with new", function() {
      var e = new DecksEvent("test", {}, {});
      expect(e).to.be.an.instanceOf(DecksEvent);
    });

    it("should work without new", function() {
      var e = DecksEvent("test", {}, {});
      expect(e).to.be.an.instanceOf(DecksEvent);
    });

    it("should set properties", function() {
      var type = "test:type";
      var sender = {};
      var data = {};

      var e = new DecksEvent(type, sender, data);
      expect(e.type).to.eql(type);
      expect(e.sender).to.eql(sender);
      expect(e.data).to.eql(data);
    });

    it("should default the data to an empty object", function() {
      var e = new DecksEvent("my:type", {});
      expect(e.data).to.eql({});
    });

    it("should throw if required args are missing", function() {
      expect(function() { new DecksEvent(); }).to.Throw;
      expect(function() { new DecksEvent("my:type"); }).to.Throw;
    });
  });
});
