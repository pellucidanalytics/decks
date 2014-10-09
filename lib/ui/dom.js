var _ = require("lodash");

var dom = {
  create: function(type) {
    if (_.isString(type)) {
      return document.createElement(type);
    }
    throw new Error("dom.create not implemented for non-string arguments yet");
  },

  html: function(element, data) {
    if (!data) {
      return element.innerHTML;
    }

    if (_.isElement(data)) {
      element.innerHTML = element.outerHTML;
    }

    if (_.isString(data)) {
      element.innerHTML = data;
    }

    throw new Error("cannot set element html");
  },

  empty: function(element) {
    this.html(element, "");
  },

  append: function(parent, child) {
    parent.appendChild(child);
  },

  remove: function(parent, child) {
    parent.removeChild(child);
  },

  /*
  prepend: function(parent, child) {
  },
  */

  setAttr: function(element, name, value) {
    element.setAttribute(name, value);
  },

  getAttr: function(element, name) {
    return element.getAttribute(name);
  },

  addClass: function(element, className) {
    if (this.hasClass(element, className)) { return; }
    element.className += ' ' + className;
  },

  removeClass: function(element, className) {
    if (!this.hasClass(element, className)) { return; }
    element.className = element.className.replace(className, "");
  },

  hasClass: function(element, className) {
    var classNameRegExp = new RegExp("\\s*" + className + "\\s*", "gi");
    return classNameRegExp.test(element.className);
  },

  toggleClass: function(element, className) {
    var addOrRemoveClass = this.hasClass(element, className) ? "removeClass" : "addClass";
    this[addOrRemoveClass](element, className);
  },

  getStyle: function(element, name, options) {
    if (!_.isElement(element)) { throw new Error("element is required"); }
    if (!_.isString(name)) { throw new Error("name is required"); }
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
    if (!_.isElement(element)) { throw new Error("element is required"); }
    if (!_.isString(name)) { throw new Error("name is required"); }
    if (_.isUndefined(value)) { throw new Error("value is required"); }
    options = options || {};

    if (_.isNumber(value)) {
      var unit = this.autoUnits[name];
      if (unit) {
        value = value + unit;
      }
    }

    element.style[name] = value;
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


module.exports = dom;
