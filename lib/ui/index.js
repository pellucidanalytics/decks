/**
 * Index module for decks ui modules.
 *
 * @module decks/ui
 */
module.exports = {
  /**
   * Provides access to the {@link decks/ui/dom} module.
   */
  dom: require("./dom"),

  /**
   * Provides access to the {@link GestureHandler} class.
   */
  GestureHandler: require("./gesturehandler"),

  /**
   * Provides access to the {@link GestureEmitter} class.
   */
  GestureEmitter: require("./gestureemitter"),

  /**
   * Provides access to the {@link PanEmitter} class.
   */
  PanEmitter: require("./panemitter"),

  /**
   * Provides access to the {@link SwipeEmitter} class.
   */
  SwipeEmitter: require("./swipeemitter"),

  /**
   * Provides access to the {@link MouseWheelEmitter} class.
   */
  MouseWheelEmitter: require("./mousewheelemitter"),

  /**
   * Provides access to the {@link TapEmitter} class.
   */
  TapEmitter: require("./tapemitter"),

  /**
   * Provides access to the {@link PressEmitter} class.
   */
  PressEmitter: require("./pressemitter")
};
