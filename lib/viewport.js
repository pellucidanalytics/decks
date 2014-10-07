var _ = require("lodash");
var EventEmitter = require("eventemitter2").EventEmitter2;
var inherits = require("inherits");
var eventBinder = require("./util").eventBinder;
var Canvas = require("./canvas");
var Frame = require("./frame");
var Item = require("./item");
var ItemCollection = require("./itemcollection");

/**
 * Viewport - manages visual (DOM) components
 *
 * @constructor
 * @augments EventEmitter2
 * @mixes eventBinder
 * @param {!Object} options options for viewport initialization
 * @param {!(Frame|Object)} options.frame Frame instance or options object
 * @param {!(Canvas|Object)} options.canvas Canvas instance or options object
 * @param {!Object} options.animator Animator object
 * @param {?ItemCollection} options.itemCollection ItemCollection instance to use with this Viewport
 * @param {?Layout} options.layout Layout instance to use with this Viewport
 */
function Viewport(options) {
  if (!(this instanceof Viewport)) { return new Viewport(options); }
  if (!options) { throw new Error("options is required"); }
  EventEmitter.call(this);

  this._renders = [];

  this.setFrame(options.frame);
  this.setCanvas(options.canvas);
  this.setAnimator(options.animator);

  if (options.itemCollection) {
    this.setItemCollection(options.itemCollection);
  }

  if (options.layout) {
    this.setLayout(options.layout);
  }
}

inherits(Viewport, EventEmitter);

_.extend(Viewport.prototype, eventBinder, /** @lends Viewport.prototype */ {
  /**
   * Sets the viewport frame
   *
   * @param {Frame} frame frame to set
   * @param {object} options additional options
   * @return {undefined}
   */
  setFrame: function(frame, options) {
    if (!frame) { throw new Error("frame is required"); }
    options = options || {};

    if (!(frame instanceof Frame)) {
      frame = new Frame(frame);
    }

    this.frame = frame;

    if (this.canvas) {
      this.frame.setCanvas(this.canvas);
    }

    if (!options.silent) {
      this.emit("viewport:frame:set", this.frame);
    }
  },

  /**
   * Sets the viewport canvas
   *
   * @param {Canvas} canvas canvas to set
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setCanvas: function(canvas, options) {
    canvas = canvas || {};
    options = options || {};

    if (!(canvas instanceof Canvas)) {
      canvas = new Canvas(canvas);
    }

    this.canvas = canvas;

    if (this.frame) {
      this.frame.setCanvas(this.canvas);
    }

    if (!options.silent) {
      this.emit("viewport:canvas:set", this.canvas);
    }
  },

  /**
   * Sets the animator object, which is responsible for starting animations for
   * layout changes.
   *
   * @param {Object} animator Animator object
   * @param {Function} options.animator.animate Velocity-like animate function (properties hash, options hash)
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setAnimator: function(animator, options) {
    if (!animator) { throw new Error("animator is required"); }
    options = options || {};

    this.animator = animator;

    if (!options.silent) {
      this.emit("viewport:animator:set", this.animator);
    }
  },

  /**
   * Sets the ItemCollection
   *
   * @param {ItemCollection} itemCollection ItemCollection instance
   * @param {?Options} options additional options
   * @return {undefined}
   */
  setItemCollection: function(itemCollection, options) {
    if (!itemCollection) { throw new Error("itemCollection is required"); }
    options = options || {};

    if (this.itemCollection) {
      this.eraseItems();
      this.unbindEvents(this.itemCollection, this._itemCollectionEvents);
      if (!options.silent) {
        this.emit("viewport:item:collection:unset", this.itemCollection);
      }
    }

    this.itemCollection = itemCollection;
    this.bindEvents(itemCollection, this._itemCollectionEvents);
    this.drawItems();
    if (!options.silent) {
      this.emit("viewport:item:collection:set", this.itemCollection);
    }
  },

  /**
   * Sets the Layout
   *
   * @param {Layout} layout Layout instance
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setLayout: function(layout, options) {
    if (!layout) { throw new Error("layout is required"); }
    options = options || {};

    this.layout = layout;

    if (this.itemCollection) {
      this.drawItems();
    }

    if (!options.silent) {
      this.emit("viewport:layout:set", this.layout);
    }
  },

  /**
   * Gets the index of an Item in the ItemCollection
   *
   * @param {Item} item item for which to get index
   * @param {Number} index optional index of item (if specified, this will be returned)
   * @return {Number} index of Item in ItemCollection
   */
  indexOfItem: function(item, index) {
    return this.itemCollection.indexOf(item);
  },

  /**
   * Gets the index of a render for an item
   *
   * @param {Item} item item that has the render
   * @param {?Number} index index of the item
   * @param {Object} render render object
   * @return {Number} index of the render for this item
   */
  indexOfRender: function(item, index, render) {
    index = this.indexOfItem(item, index);
    return _.indexOf(this._renders[index], render);
  },

  /**
   * Draws all of the renders for an item
   *
   * Drawing an item involves creating or updating one or more "renders" for an item, and
   * animating the DOM style changes from the previous render state to the new state.
   *
   * @param {!Item} item item for which to draw renders
   * @param {?Number} index index of item in the collection
   * @param {?Object} options additional options
   * @return {undefined}
   */
  drawItem: function(item, index, options) {
    if (!item) { throw new Error("item is required"); }
    index = this.indexOfItem(item, index);
    options = options || {};

    var renders = this.layout.getRenders({ item: item, index: index });
    this.drawRenders(item, index, renders);

    if (!options.silent) {
      this.emit("viewport:item:drawn", { item: item, index: index });
    }
  },

  /**
   * Draws all the items in the Viewport's ItemCollection.
   *
   * @param {?Object} options additional options
   * @return {undefined}
   */
  drawItems: function(options) {
    options = options || {};

    _.each(this.itemCollection.getItems(), function(item, index) {
      this.drawItem(item, index);
    }, this);

    if (!options.silent) {
      this.emit("viewport:items:drawn");
    }
  },

  /**
   * Erases (removes) all the renders for the given Item.
   *
   * Removes the renders for an Item, but not the Item itself.
   *
   * @param {Item} item item for which to remove renders
   * @param {Number} index index of item
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseItem: function(item, index, options) {
    if (!item) { throw new Error("item is required"); }
    index = this.indexOfItem(item, index);
    options = options || {};

    this.removeRenders(item, index);
    this._renders.splice(index, 1);

    if (!options.noRedraw) {
      this.drawItems();
    }

    if (!options.silent) {
      this.emit("viewport:item:erased", { item: item, index: index });
    }
  },

  /**
   * Erases the renders for all items in the ItemCollection
   *
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseItems: function(options) {
    options = options || {};

    _.each(this.itemCollection.getItems(), function(item, index) {
      this.eraseItem(item, index, { noRedraw: true });
    }, this);

    if (!options.silent) {
      this.emit("viewport:items:erased");
    }
  },

  /**
   * Gets the array of renders for the given item.
   *
   * This returns the renders currently stored in the Viewport instance,
   * it does not request new renders from the Layout.
   *
   * @param {Item} item item for which to get renders
   * @param {?Number} index index of Item, if known
   * @return {Object[]} array of renders for the given item
   */
  getRenders: function(item, index) {
    if (!item) { throw new Error("item is required"); }
    index = this.indexOfItem(item, index);
    return this._renders[index];
  },

  /**
   * Draws the specified renders for the given item
   *
   * @param {Item} item item for which to draw renders
   * @param {?Number} index index of item, if known
   * @param {Object[]} renders renders to draw for the item
   * @return {undefined}
   */
  drawRenders: function(item, index, renders) {
    if (!item) { throw new Error("item is required"); }
    if (!renders) { throw new Error("renders is required"); }
    index = this.indexOfItem(item, index);

    if (!this._renders[index]) {
      this._renders[index] = [];
    }

    var previousRenders = this.getRenders(item, index);
    var maxLength = Math.max(previousRenders.length, renders.length);
    var sliceIndex = -1;

    _.each(_.range(maxLength), function(renderIndex) {
      var previousRender = previousRenders[renderIndex];
      var render = renders[renderIndex];

      if (previousRender && render) {
        // If we have a previous render for this render, we need to copy the new render data
        // to the previous render.  If the new render has the same transform, we don't need to
        // do anything here.
        var tempRender = _.extend({}, previousRender, render);
        if (_.isEqual(previousRender.transform, tempRender.transform)) {
          return;
        }
        render = tempRender;
      } else if (previousRender) {
        // If we have a previous render that is no longer needed, we need to remove it
        // from the DOM and remove it from our renders array for this item.
        this.canvas.removeRender(previousRender);

        // Don't slice the unneeded renders here - we don't want to mess up the indexes.
        // The slice is done below.
        if (sliceIndex !== -1) {
          sliceIndex = renderIndex;
        }
      } else if (render) {
        // We do not have a previous render for this, create a new element now.
        render.element = this.createRenderElement();
      }

      this.animateRender({ item: item, index: index, render: render, renderIndex: renderIndex });
    }, this);

    // Remove any unneeded renders for the items
    if (sliceIndex !== -1) {
      this._renders = this._renders.slice(sliceIndex);
    }
  },

  /**
   * Sets the given render object on an item
   *
   * @param {!Item} item item for which to set the render object
   * @param {?Nubmer} index index of the item
   * @param {!Object} render render object to set
   * @param {!Number} renderIndex index of render to set
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setRender: function(item, index, render, renderIndex, options) {
    options = options || {};
    index = this.indexOfItem(item, index);
    this._renders[index][renderIndex] = render;

    if (!options.silent) {
      this.emit("viewport:render:set", { item: item, index: index, render: render, renderIndex: renderIndex });
    }
  },

  /**
   * Removes a render from an item, and also removes the render's DOM element from
   * the Canvas
   *
   * @param {!Item} item item from which to remove the render
   * @param {?Number} index index of item, if known
   * @param {!Object} render render to remove
   * @param {?Object} options additional options
   * @return {undefined}
   */
  removeRender: function(item, index, render, options) {
    options = options || {};
    var renders = this.getRenders(item, index);
    var renderIndex = this.indexOfRender(item, index, render);

    this.canvas.removeRender(render);
    renders.splice(renderIndex, 1);

    if (!options.silent) {
      this.emit("viewport:render:removed", { item: item, index: index, render: render, renderIndex: renderIndex });
    }
  },

  /**
   * Removes all the renders from an item
   *
   * @param {!Item} item item from which to remove all renders
   * @param {?Number} index index of item, if known
   * @param {?Object} options additional options
   * @return {undefined}
   */
  removeRenders: function(item, index, options) {
    options = options || {};
    var renders = this.getRenders(item, index);

    if (!_.isArray(renders) || !renders.length) {
      return;
    }

    _.each(renders, function(render) {
      this.removeRender(item, index, render);
    }, this);

    if (!options.silent) {
      this.emit("viewport:renders:removed", { item: item, index: index, renders: renders });
    }
  },

  /**
   * Creates the container element for a render
   *
   * @return {HTMLElement} detached DOM element to contain a render
   */
  createRenderElement: function() {
    var element = document.createElement("div");
    element.className = "decks-item";
    element.style.position = "absolute";
    element.style.top = "0";
    element.style.left = "0";
    return element;
  },

  /**
   * Starts an animation to transform a render element
   *
   * @param {!Object} options animation options
   * @param {!Object} options.render render object
   * @param {!HTMLElement} options.render.element render element
   * @param {!Object} options.render.transform hash of style properties to animate
   * @param {?Object} options.render.transform animation options
   * @return {undefined}
   */
  animateRender: function(options) {
    if (!options) { throw new Error("options is required"); }
    var render = options.render;
    if (!render) { throw new Error("render is required"); }
    if (!render.element) { throw new Error("render.element is required"); }
    if (!render.transform) { throw new Error("render.transform is required"); }
    if (!render.animateOptions) { throw new Error("render.transform is required"); }

    // Make sure the render element is in the DOM
    this.canvas.addRender(render);

    if (_.isArray(render.transform)) {
      // TODO: not sure how to handle sequences of animations for complete/progress event
      throw new Error("animation sequences is not yet implemented");
    } else {
      // Extend the render animation options onto standard options, like callbacks
      var animateOptions = this.getAnimateOptions(options);

      // Start the animation
      this.animator.animate(render.element, render.transform, animateOptions);
    }
  },

  /**
   * Gets the default animation options, extended with the options.render.animateOptions
   *
   * @param {!Object} options object to pass to callback methods, like complete and progress
   * @return {Object} hash of animation options
   */
  getAnimateOptions: function(options) {
    var defaultOptions = {
      complete: _.bind(this._onAnimationComplete, this, options),
      progress: _.bind(this._onAnimationProgress, this, options)
    };
    return _.extend(defaultOptions, options.render.animateOptions);
  },

  _itemCollectionEvents: {
    "item:collection:item:added": "_onItemAdded",
    "item:collection:item:removed": "_onItemRemoved",
    "item:collection:item:changed": "_onItemChanged",
    "item:collection:cleared": "_onItemsCleared"
  },

  _onItemAdded: function(data) {
    this.drawItem(data.item, data.index);
  },

  _onItemRemoved: function(data) {
    this.eraseItem(data.item, data.index);
  },

  _onItemChanged: function(data) {
    this.drawItem(data.item, data.index);
  },

  _onItemsCleared: function(data) {
    this.eraseItems();
  },

  _onAnimationComplete: function(options) {
    this.setRender(options.item, options.index, options.render, options.renderIndex);
  },

  _onAnimationProgress: function(options) {
    if (this.frame.isElementVisible(options.render.element)) {
      this.layout.loadRender(options);
    } else {
      this.layout.unloadRender(options);
    }
  }
});

module.exports = Viewport;
