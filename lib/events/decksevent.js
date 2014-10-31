/**
 * A custom event class for use within decks.js
 *
 * @class
 * @param {!String} type - The type of event (e.g. "item:changed")
 * @param {!*} sender - The sender of the event (e.g. the object which is emitting the event)
 * @param {?*} [data={}] - Custom data to include with the event (any type, Object, array, primitive, etc.)
 */
function DecksEvent(type, sender, data) {
  if (!(this instanceof DecksEvent)) {
    return new DecksEvent(type, sender, data);
  }

  if (!type) {
    throw new Error("DecksEvent#constructor: type is required");
  }

  if (!sender) {
    throw new Error("DecksEvent#constructor: sender is required");
  }

  /** The type of event */
  this.type = type;

  /** The sender of the event (the object that emitted the event) */
  this.sender = sender;

  /** Custom event data (can be anything) */
  this.data = data || {};
}

module.exports = DecksEvent;
