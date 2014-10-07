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

  this._renders = {};

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

    if (this.frame === frame) {
      return;
    }

    if (!(frame instanceof Frame)) {
      frame = new Frame(frame);
    }

    if (this.frame) {
      this.unbindEvents(this.frame, this._frameEvents);
    }

    this.frame = frame;
    console.log("viewport: frame set", this.frame);

    this.bindEvents(this.frame, this._frameEvents);

    if (this.canvas) {
      this.frame.setCanvas(this.canvas);
      this.canvas.setFrame(this.frame);
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

    if (this.canvas === canvas) {
      return;
    }

    if (!(canvas instanceof Canvas)) {
      canvas = new Canvas(canvas);
    }

    if (this.canvas) {
      this.unbindEvents(this.canvas, this._canvasEvents);
    }

    this.canvas = canvas;
    console.log("viewport: canvas set", this.canvas);

    this.bindEvents(this.canvas, this._canvasEvents);

    if (this.frame) {
      this.frame.setCanvas(this.canvas);
      this.canvas.setFrame(this.frame);
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

    if (this.animator === animator) {
      return;
    }

    this.animator = animator;
    console.log("viewport: animator set", this.animator);

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

    if (this.itemCollection === itemCollection) {
      return;
    }

    if (this.itemCollection) {
      this.eraseItems();
      this.unbindEvents(this.itemCollection, this._itemCollectionEvents);
      if (!options.silent) {
        this.emit("viewport:item:collection:removed", this.itemCollection);
      }
    }

    this.itemCollection = itemCollection;
    console.log("viewport: itemCollection set", itemCollection);

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

    if (this.layout === layout) {
      return;
    }

    this.layout = layout;
    console.log("viewport: layout set");

    if (this.itemCollection) {
      this.drawItems();
    }

    if (!options.silent) {
      this.emit("viewport:layout:set", this.layout);
    }
  },

  /**
   * Draws all of the renders for an item
   *
   * Drawing an item involves creating or updating one or more "renders" for an item, and
   * animating the DOM style changes from the previous render state to the new state.
   *
   * @param {!Item} item item for which to draw renders
   * @param {?Object} options additional options
   * @return {undefined}
   */
  drawItem: function(item, options) {
    if (!item) { throw new Error("item is required"); }
    options = options || {};

    console.log("viewport: drawing item", item);

    // Ask the layout to provide one or more renders for the Item
    var rendersArray = this.layout.getRenders(item);

    // Assign ids to each render (based on the array index), and change it from an array to
    // an object with the render id as the key, and the render as the value.  Also, add some additional
    // data to the render, like the item.
    var renders = {};
    _.each(rendersArray, function(render, index) {
      render.id = "" + index;
      render.item = item;
      renders[render.id] = render;
    });

    this.drawRenders(item, renders);

    if (!options.silent) {
      this.emit("viewport:item:drawing", { item: item });
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

    var items = this.itemCollection.getItems();
    console.log("viewport: drawing items", items);

    _.each(items, function(item) {
      this.drawItem(item);
    }, this);

    if (!options.silent) {
      this.emit("viewport:items:drawing");
    }
  },

  /**
   * Erases all the renders for the given Item, and removes the Item itself.
   *
   * @param {Item} item item for which to remove renders
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseItem: function(item, options) {
    if (!item) { throw new Error("item is required"); }
    options = options || {};

    console.log("viewport: erasing item", item);

    item.isRemoving = true;
    this.eraseRenders(item);

    if (!options.silent) {
      this.emit("viewport:item:erasing", { item: item });
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

    var items = this.itemCollection.getItems();
    console.log("viewport: erasing items", items);

    _.each(item, function(item) {
      this.eraseItem(item, { noRedraw: true });
    }, this);

    if (!options.silent) {
      this.emit("viewport:items:erasing");
    }
  },

  removeItem: function(item, options) {
    if (!item) { throw new Error("item is required"); }
    options = options || {};

    console.log("viewport: removing item", item);

    delete this._renders[item.id];

    if (!options.silent) {
      this.emit("viewport:item:removed", item);
    }
  },

  /**
   * Gets the renders object for the given item
   *
   * This returns the renders currently stored in the Viewport instance,
   * it does not request new renders from the Layout.
   *
   * @param {Item} item item for which to get renders
   * @return {Object[]} array of renders for the given item
   */
  getRenders: function(item) {
    if (!item) { throw new Error("item is required"); }
    if (!this._renders[item.id]) {
      this._renders[item.id] = {};
    }
    return this._renders[item.id];
  },

  hasRenders: function(item) {
    return !_.isEmpty(this.getRenders(item));
  },

  /**
   * Sets the given render object on an item
   *
   * @param {!Object} render render object to set
   * @param {?Object} options additional options
   * @return {undefined}
   */
  setRender: function(render, options) {
    if (!render) { throw new Error("render is required"); }
    options = options || {};

    console.log("viewport: setting render", render);

    var renders = this.getRenders(render.item);
    renders[render.id] = render;

    if (!options.silent) {
      this.emit("viewport:render:set", render);
    }
  },

  removeRender: function(render, options) {
    if (!render) { throw new Error("render is required"); }
    options = options || {};

    console.log("viewport: removing render", render);

    var renders = this.getRenders(render.item);
    this.canvas.removeRender(render);
    delete renders[render.id];

    if (!options.silent) {
      this.emit("viewport:render:removed", render);
    }
  },

  /**
   * Starts an animation to draw a render element
   *
   * @param {!Object} options animation options
   * @param {!Object} options.render render object
   * @param {!HTMLElement} options.render.element render element
   * @param {!Object} options.render.transform hash of CSS style properties to animate
   * @param {!Object} options.render.animateOptions animation options
   * @return {undefined}
   */
  drawRender: function(render) {
    if (!render) { throw new Error("render is required"); }
    if (!render.element) { throw new Error("render.element is required"); }
    if (!render.transform) { throw new Error("render.transform is required"); }
    if (!render.animateOptions) { throw new Error("render.animateOptions is required"); }

    console.log("viewport: drawing render", render);

    var animateOptions = this.getAnimateOptions(render);

    this.animator.animate({
      elements: render.element,
      properties: render.transform,
      options: animateOptions
    });
  },

  /**
   * Draws the specified renders for the given item
   *
   * @param {Item} item item for which to draw renders
   * @param {Object} renders renders to draw for the item
   * @return {undefined}
   */
  drawRenders: function(item, renders) {
    if (!item) { throw new Error("item is required"); }
    if (!renders) { throw new Error("renders is required"); }

    console.log("viewport: drawing renders", item);

    var previousRenders = this.getRenders(item);

    var previousRenderIds = _.keys(previousRenders);
    var newRenderIds = _.keys(renders);
    var renderIdsToMerge = _.intersection(previousRenderIds, newRenderIds);
    var renderIdsToRemove = _.difference(previousRenderIds, renderIdsToMerge);
    var renderIdsToAdd = _.difference(newRenderIds, renderIdsToMerge);

    // Previous and new render exist - copy the new data onto the previous, and
    // check if we need to re-draw (if transform has changed)
    _.each(renderIdsToMerge, function(renderId) {
      var previousRender = previousRenders[renderId];
      var newRender = renders[renderId];
      var mergedRender = _.extend({}, previousRender, newRender);
      if (_.isEqual(previousRender.transform, mergedRender.transform)) {
        return;
      }
      this.drawRender(mergedRender);
    }, this);

    // New render with no corresponding previous render - create the container element, and animate it
    _.each(renderIdsToAdd, function(renderId) {
      var newRender = renders[renderId];
      newRender.element = this.createRenderElement();
      this.drawRender(newRender);
    }, this);

    // Previous render exists with no corresponding new render - remove the previous render
    _.each(renderIdsToRemove, function(renderId) {
      var previousRender = previousRenders[renderId];
      this.eraseRender(previousRender);
    }, this);
  },

  /**
   * Removes a render from an item, and also removes the render's DOM element from
   * the Canvas
   *
   * @param {!Object} render render to remove
   * @param {?Object} options additional options
   * @return {undefined}
   */
  eraseRender: function(render, options) {
    if (!render) { throw new Error("render is required"); }
    options = options || {};

    console.log("viewport: erasing render", render);

    var renders = this.getRenders(render.item);

    render.isRemoving = true;
    this.layout.setRemoveAnimation(render);
    this.drawRender(render);

    if (!options.silent) {
      this.emit("viewport:render:erasing");
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
  eraseRenders: function(item, options) {
    if (!item) { throw new Error("item is required"); }
    options = options || {};

    console.log("viewport: erasing renders", item);

    var renders = this.getRenders(item);

    _.each(renders, function(render) {
      this.eraseRender(render);
    }, this);

    if (!options.silent) {
      this.emit("viewport:renders:erasing", renders);
    }
  },
  /**
   * Gets the default animation options, extended with the options.render.animateOptions
   *
   * @param {!Object} options object to pass to callback methods, like complete and progress
   * @return {Object} hash of animation options
   */
  getAnimateOptions: function(render) {
    if (!render) { throw new Error("render is required"); }

    var onBegin = _.bind(function(elements) {
      render.animationBeginData = {
        elements: elements
      };
      this._onAnimationBegin(render);
    }, this);

    var onComplete = _.bind(function(elements) {
      render.animationCompleteData = {
        elements: elements
      };
      this._onAnimationComplete(render);
    }, this);

    var onProgress = _.bind(function(elements, percentComplete, timeRemaining, timeStart) {
      render.animationProgressData = {
        elements: elements,
        percentComplete: percentComplete,
        timeRemaining: timeRemaining,
        timeStart: timeStart
      };
      this._onAnimationProgress(render);
    }, this);

    var defaultAnimateOptions = {
      begin: onBegin,
      complete: onComplete,
      progress: onProgress
    };

    return _.extend(defaultAnimateOptions, render.animateOptions);
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

  loadOrUnloadRender: function(render) {
    if (this.frame.isElementVisible(render.element)) {
      this.layout.loadRender(render);
    } else {
      this.layout.unloadRender(render);
    }
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

  _frameEvents: {
  },

  _canvasEvents: {
  },

  _onAnimationBegin: function(render) {
    console.log("viewport: animation begin", render);
    this.canvas.addRender(render);
  },

  _onAnimationComplete: function(render) {
    console.log("viewport: animation complete", render, render.item);

    if (render.isRemoving) {
      this.removeRender(render);
      if (render.item.isRemoving && !this.hasRenders(render.item)) {
        this.removeItem(render.item);
      }
      return;
    }

    this.setRender(render);
  },

  _onAnimationProgress: function(render) {
    console.log("viewport: animation progress", render);
    this.loadOrUnloadRender(render);
  }
});

module.exports = Viewport;
