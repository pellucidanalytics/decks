/**
 * Main index module for all publicly-exposed modules/classes/mixins/etc. in decks.
 *
 * @module decks
 */
module.exports = {
  /**
   * Provides access to the {@link module:decks/events} index module.
   */
  events: require("./events"),

  /**
   * Provides access to the {@link module:decks/layouts} index module.
   */
  layouts: require('./layouts'),

  /**
   * Provides access to the {@link module:decks/ui} index module.
   */
  ui: require("./ui"),

  /**
   * Provides access to the {@link module:decks/utils} index module.
   */
  utils: require('./utils'),

  /**
   * Provides access to the {@link Canvas} class.
   */
  Canvas: require('./canvas'),

  /**
   * provides access to the {@link Deck} class.
   */
  Deck: require('./deck'),

  /**
   * provides access to the {@link Frame} class.
   */
  Frame: require('./frame'),

  /**
   * provides access to the {@link Item} class.
   */
  Item: require('./item'),

  /**
   * provides access to the {@link ItemCollection} class.
   */
  ItemCollection: require('./itemcollection'),

  /**
   * provides access to the {@link Layout} class.
   */
  Layout: require('./layout'),

  /**
   * provides access to the {@link Viewport} class.
   */
  Viewport: require('./viewport')
};
