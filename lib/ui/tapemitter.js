var _ = require("lodash");
var GestureEmitter = require("./gestureemitter");
var DecksEvent = require("../events/decksevent");

/**
 * Class that monitors an element for tap (click/touch) events/gestures.
 *
 * @class
 * @extends GestureEmitter
 * @param element
 * @param options
 */
function TapEmitter(element, options) {
  if (!(this instanceof TapEmitter)) {
    return new TapEmitter(element, options);
  }

  options = _.merge({}, this.defaultOptions, options);

  GestureEmitter.call(this, element, options);

  this.bindHammerEvents();
}

TapEmitter.prototype = _.create(GestureEmitter.prototype, /** @lends TapEmitter.prototype */ {
  constructor: TapEmitter,

  defaultOptions: _.merge({}, GestureEmitter.prototype.defaultOptions, {
  }),

  getHammerEvents: function() {
    return {
      "tap": "onTap"
    };
  },

  onTap: function(e) {
    /**
     * Event for a tap (click/touch) event
     *
     * @event TapEmitter#gesture:tap
     * @type {DecksEvent}
     * @property type
     * @property sender
     * @property data
     */
    this.emit(DecksEvent("gesture:tap", this, e));
  }
});

module.exports = TapEmitter;
