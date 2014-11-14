var _ = require("lodash");

/**
 * DOM manipulation helper module to encapsulate browser and DOM API version
 * differences.
 *
 * @module decks/ui/dom
 */
module.exports = {
  /**
   * Creates a DOM element by name (e.g. "div").
   *
   * @param {!String} type - the type of DOM element to create (e.g. "div")
   * @returns {Element} - the DOM element
   */
  create: function(type) {
    if (_.isString(type)) {
      return document.createElement(type);
    }
    throw new Error("dom.create: not implemented for non-string arguments");
  },

  /**
   * Gets or sets an element's innerHTML.
   *
   * @param {!Element} element - the Element for which to get or set HTML.
   * @param {?String} data - the HTML to set, or if not specified, the method will return the HTML.
   * @return {String} - the element's innerHTML
   */
  html: function(element, data) {
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

  empty: function(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  },

  append: function(parent, child) {
    parent.appendChild(child);
  },

  remove: function(parent, child) {
    if (!child) {
      parent.parentNode.removeChild(parent);
    } else {
      parent.removeChild(child);
    }
  },

  prepend: function(parent, child) {
    parent.insertBefore(child, parent.firstChild);
  },

  setAttr: function(element, name, value) {
    element.setAttribute(name, value);
  },

  getAttr: function(element, name) {
    return element.getAttribute(name);
  },

  addClass: function(element, className) {
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

  removeClass: function(element, className) {
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

  hasClass: function(element, className) {
    if (element.classList) {
      return element.classList.contains(className);
    } else {
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
    }
  },

  toggleClass: function(element, className) {
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

  getStyle: function(element, name, options) {
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

  setStyle: function(element, name, value, options) {
    options = options || {};

    if (_.isNumber(value)) {
      var unit = this.autoUnits[name];
      if (unit) {
        value = value + unit;
      }
    }

    element.style[name] = value;
  },

  setStyles: function(element, styles, options) {
    options = options || {};

    _.each(styles, function(value, key) {
      this.setStyle(element, key, value, options);
    }, this);
  },

  isPositioned: function(element) {
    var position = this.getStyle(element, "position");
    return _.contains(["absolute", "relative", "fixed"], position);
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
