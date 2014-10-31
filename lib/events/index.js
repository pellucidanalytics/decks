/**
 * Index module for events classes/mixins/etc.
 *
 * @module decks/events
 */
module.exports = {
  /**
   * Provides access to the {@link binder} mixin.
   */
  binder: require("./binder"),

  /**
   * Provides access to the {@link DecksEvent} class.
   */
  DecksEvent: require("./decksevent"),

  /**
   * Provides access to the {@link Emitter} class.
   */
  Emitter: require("./emitter"),

  /**
   * Provides access to the {@link hasEmitter} mixin.
   */
  hasEmitter: require("./hasemitter")
};
