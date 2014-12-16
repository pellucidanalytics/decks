var _ = require("lodash");
var rect = require("../utils/rect");
var validate = require("../utils/validate");

/**
 * DOM manipulation helper module to encapsulate browser and DOM API version
 * differences.
 *
 * @module decks/ui/dom
 */
module.exports = {

  /**
   * Wrapper for querySelectorAll
   *
   * @param {!string} selector - DOM selector
   * @param {?HTMLElement} [context=document] - context element for DOM query
   * @return {NodeList}
   */
  query: function query(selector, context) {
    validate(selector, "selector", { isString: true });

    context = context || document;

    return context.querySelectorAll(selector);
  },

  /**
   * Wrapper for querySelector
   *
   * @param {!string} selector - DOM selector
   * @param {?Element} [context=document] - context element for DOM query
   * @return {undefined}
   */
  querySingle: function querySingle(selector, context) {
    validate(selector, "selector", { isString: true });

    context = context || document;

    return context.querySelector(selector);
  },

  /**
   * Creates a DOM element by name (e.g. "div").
   *
   * @param {!String} type - the type of DOM element to create (e.g. "div")
   * @returns {Element} - the DOM element
   */
  create: function create(type, options) {
    validate(type, "type", { isString: true });
    options = options || {};

    var element = document.createElement(type);

    if (_.has(options, "id")) {
      element.id = options.id;
    }

    if (_.has(options, "className")) {
      element.className = options.className;
    }

    if (_.has(options, "styles")) {
      this.setStyles(element, options.styles);
    }

    if (_.has(options, "attrs")) {
      this.setAttrs(element, options.attrs);
    }

    return element;
  },

  /**
   * Gets or sets an element's innerHTML.
   *
   * @param {!Element} element - the Element for which to get or set HTML.
   * @param {?String} data - the HTML to set, or if not specified, the method will return the HTML.
   * @return {String} - the element's innerHTML
   */
  html: function html(element, data) {
    if (!data) {
      return element.innerHTML;
    }

    if (_.isElement(data)) {
      element.innerHTML = data.outerHTML;
      return;
    }

    if (_.isString(data)) {
      element.innerHTML = data;
      return;
    }

    throw new Error("dom.create: cannot set element html");
  },

  /**
   * Parses an HTML string, and returns the resulting Element or Elements.
   *
   * @param {!string} html - the HTML string
   * @param {?Object} [options={}] - additional options
   * @param {?boolean} [options.multiple=false] - whether to return a all top-level sibling elements
   * @return {Element|NodeList} - the resulting Element or NodeList of elements
   */
  parse: function parse(html, options) {
    options = options || {};
    var element = this.create("dom");
    element.innerHTML = html;

    // Default to returning firstChild, unless options.multiple === true
    if (options.multiple) {
      return element.children;
    }

    return element.firstChild;
  },

  /**
   * Gets or sets the textContent/innerText of the Element
   *
   * @param element
   * @param data
   * @return {undefined}
   */
  text: function text(element, data) {
    if (!_.isString(data)) {
      return element.textContent || element.innerText;
    }

    if (!_.isUndefined(element.textContent)) {
      element.textContent = data;
    } else {
      element.innerText = data;
    }
  },

  /**
   * Empties an element by removing all children
   *
   * @param element
   * @return {undefined}
   */
  empty: function empty(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  },

  /**
   * Appends a child element to a parent element
   *
   * @param parent
   * @param child
   * @return {undefined}
   */
  append: function append(parent, child) {
    parent.appendChild(child);
  },

  /**
   * Prepends a child element in a parent element
   *
   * @param parent
   * @param child
   * @return {undefined}
   */
  prepend: function prepend(parent, child) {
    parent.insertBefore(child, parent.firstChild);
  },

  /**
   * Removes a child element from a parent element, or removes the parent element
   * from its parent if no child specified.
   *
   * @param parent
   * @param child
   * @return {undefined}
   */
  remove: function remove(parent, child) {
    if (!child) {
      return parent.parentNode.removeChild(parent);
    } else {
      return parent.removeChild(child);
    }
  },

  /**
   * Gets or sets an Element attribute value
   *
   * @param element
   * @param name
   * @param value
   * @return {undefined}
   */
  attr: function attr(element, name, value) {
    if (_.isUndefined(value)) {
      return this.getAttr(element, name);
    }
    this.setAttr(element, name, value);
  },

  /**
   * Gets an Element's attribute value by name
   *
   * @param element
   * @param name
   * @return {undefined}
   */
  getAttr: function getAttr(element, name) {
    return element.getAttribute(name);
  },

  /**
   * Sets an Element's attribute value by name
   *
   * @param element
   * @param name
   * @param value
   * @return {undefined}
   */
  setAttr: function setAttr(element, key, value) {
    element.setAttribute(key, value);
  },

  setAttrs: function setAttrs(element, attrs) {
    _.each(attrs, function(value, key) {
      this.setAttr(element, key, value);
    }, this);
  },

  /**
   * Indicates if an Element has the given class
   *
   * @param element
   * @param className
   * @return {undefined}
   */
  hasClass: function hasClass(element, className) {
    if (element.classList) {
      return element.classList.contains(className);
    } else {
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
    }
  },

  addClass: function addClass(element, className) {
    var classNames = _.map(className.split(" "), function(name) {
      return name.trim();
    });

    _.each(classNames, function(className) {
      if (this.hasClass(element, className)) { return; }
      if (element.classList) {
        element.classList.add(className);
      } else {
        element.className += ' ' + className;
      }
    }, this);
  },

  removeClass: function removeClass(element, className) {
    var classNames = _.map(className.split(" "), function(className) {
      return className.trim();
    });

    _.each(classNames, function(className) {
      if (!this.hasClass(element, className)) { return; }
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
    }, this);
  },

  toggleClass: function toggleClass(element, className) {
    if (element.classList) {
      element.classList.toggle(className);
    } else {
      var classes = element.className.split(' ');
      var existingIndex = -1;
      for (var i = classes.length; i--;) {
        if (classes[i] === className) {
          existingIndex = i;
        }
      }

      if (existingIndex >= 0) {
        classes.splice(existingIndex, 1);
      } else {
        classes.push(className);
      }

      element.className = classes.join(' ');
    }
  },

  getStyle: function getStyle(element, name, options) {
    options = options || {};

    var value = element.style[name];

    if (options.parseInt) {
      value = _.parseInt(value);
    }

    if (options.parseFloat) {
      value = parseFloat(value);
    }

    return value;
  },

  setStyle: function setStyle(element, name, value) {
    if (_.isNumber(value)) {
      var unit = this.autoUnits[name];
      if (unit) {
        value = value + unit;
      }
    }
    element.style[name] = value;
  },

  setStyles: function setStyles(element, styles) {
    _.each(styles, function(value, key) {
      this.setStyle(element, key, value);
    }, this);
  },

  removeStyle: function removeStyle(element, name) {
    element.style[name] = "";
  },

  isPositioned: function isPositioned(element) {
    var position = this.getStyle(element, "position");
    return _.contains(["absolute", "relative", "fixed"], position);
  },

  isVisible: function(element) {
    validate(element, "element", { isElement: true });

    return element.style.display !== "none" &&
      element.style.visibility !== "hidden";
  },

  closest: function closest(element, predicate) {
    if (element && predicate(element)) {
      return element;
    }

    if (element.parentNode) {
      return this.closest(element.parentNode, predicate);
    }

    return null;
  },

  closestWithClass: function closestWithClass(element, className) {
    var self = this;
    return self.closest(element, function(el) {
      return self.hasClass(el, className);
    });
  },

  /**
   * Get the element whose bounding rect top/left is nearest to the given point in
   * distance.
   *
   * @param {!Object} point - the point to compare all elements to (in top/left or x/y)
   * @param {!(Element[]|NodeList)} elements - the elements to check
   * @return {Element} - the element whose top/left is nearest to point
   */
  nearest: function nearest(point, elements, options) {
    options = options || {};

    var minDistance = Infinity;

    if (options.ignoreInvisibleElements) {
      elements = _.filter(elements, function(element) {
        return this.isVisible(element);
      }, this);
    }

    return _.reduce(elements, function(nearestElement, element) {
      var elementRect = rect.normalize(element);
      var distance = rect.distance(point, elementRect);
      if (distance < minDistance) {
        minDistance = distance;
        return element;
      }
      return nearestElement;
    }, null);
  },

  /**
   * Default tolerance value for isOverflowed methods
   */
  defaultOverflowTolerance: 2,

  /**
   * Indicates if an element is overflowing it's parent in the horizontal direction.
   *
   * @param {!Element} element - element to check
   * @param {?number} [tolerance=2] - tolerance to add to element.clientWidth
   * @return {boolean} - whether element is overflowed horizontally
   */
  isOverflowedX: function isOverflowedX(element, tolerance) {
    tolerance = _.isNumber(tolerance) ? tolerance : this.defaultOverflowTolerance;
    return element.clientWidth + tolerance < element.scrollWidth;
  },

  /**
   * Indicates if an element is overflowing it's parent in the vertical direction.
   *
   * @param {!Element} element - element to check
   * @param {?number} [tolerance=2] - tolerance to add to element.clientHeight
   * @return {boolean} - whether element is overflowed vertically
   */
  isOverflowedY: function isOverflowedY(element, tolerance) {
    tolerance = _.isNumber(tolerance) ? tolerance : this.defaultOverflowTolerance;
    return element.clientHeight + tolerance < element.scrollHeight;
  },

  /**
   * Indicates if an element is overflowing it's parent in any direction.
   *
   * @param {!Element} element - element to check
   * @param {?number} [tolerance=2] - tolerance to add to element.clientHeight and element.clientWidth
   * @return {boolean} - whether element is overflowed
   */
  isOverflowed: function isOverflowed(element, tolerance) {
    return this.isOverflowedX(element, tolerance) || this.isOverflowedY(element, tolerance);
  },

  autoUnits: {
    "top": "px",
    "bottom": "px",
    "left": "px",
    "right": "px",
    "width": "px",
    "height": "px"
  }
};
