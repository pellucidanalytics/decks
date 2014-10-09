var _ = require("lodash");
var EventEmitter2 = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var DecksEvent = require("./decksevent");

function Emitter(options) {
  if (!(this instanceof Emitter)) { return new Emitter(options); }
  EventEmitter2.call(this, options);
}

inherits(Emitter, EventEmitter2);

_.extend(Emitter.prototype, {
  emit: function() {
    // If the arg is a DecksEvent, use the event.type as the emit type argument
    if (arguments.length >= 1 && (arguments[0] instanceof DecksEvent)) {
      var decksEvent = arguments[0];
      return EventEmitter2.prototype.emit.call(this, decksEvent.type, decksEvent);
    }

    return EventEmitter2.prototype.emit.apply(this, arguments);
  }
});

module.exports = Emitter;
