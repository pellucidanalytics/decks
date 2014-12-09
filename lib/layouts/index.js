/**
 * Index module for all of the pre-built/sample Layout implementations in decks.
 *
 * @module decks/layouts
 */
module.exports = {
  /**
   * Provides access to the {@link BasicGridLayout} class.
   */
  BasicGridLayout: require("./basicgridlayout"),

  /**
   * Provides access to the {@link BasicStackLayout} class.
   */
  BasicStackLayout: require("./basicstacklayout"),

  /**
   * Provides access to the {@link RowLayout} class.
   */
  RowLayout: require("./rowlayout"),

  /**
   * Provides access to the {@link ColumnLayout} class.
   */
  ColumnLayout: require("./columnlayout"),

  /**
   * Provides access to the {@link ZoomLayout} class.
   */
  ZoomLayout: require("./zoomlayout")
};
