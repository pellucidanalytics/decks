/**
 * Index module for utility modules/classes/mixins/etc.
 *
 * @module decks/utils
 */
module.exports = {
  /**
   * Provides access to the {@link module:decks/utils/browser} module.
   */
  browser: require("./browser"),

  /**
   * Provides access to the {@link module:decks/utils/rect} module.
   */
  rect: require("./rect"),

  /**
   * Provides access to the {@link module:decks/utils/validate} module.
   */
  validate: require("./validate"),

  logger: require("./logger")
};
