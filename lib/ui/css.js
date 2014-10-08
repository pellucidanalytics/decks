var _ = require("lodash");

var units = {
  "top": "px",
  "bottom": "px",
  "left": "px",
  "right": "px",
  "width": "px",
  "height": "px"
};

function get(element, name, options) {
  _validate(element, name);
  options = options || {};

  var value = element.style[name];

  if (options.parseInt) {
    value = _.parseInt(value);
  }

  if (options.parseFloat) {
    value = parseFloat(value);
  }

  return value;
}

function set(element, name, value, options) {
  _validate(element, name);
  if (_.isUndefined(value)) { throw new Error("value is required"); }
  options = options || {};

  if (_.isNumber(value)) {
    var unit = units[name];
    if (unit) {
      value = value + units[name];
    }
  }

  element.style[name] = value;
}

function _validate(element, name) {
  if (!_.isElement(element)) { throw new Error("element is required"); }
  if (!_.isString(name)) { throw new Error("name is required"); }
}

module.exports = {
  get: get,
  set: set
};
