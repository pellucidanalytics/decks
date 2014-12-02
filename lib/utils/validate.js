var _ = require("lodash");

function isNullOrUndefined(obj) {
  return _.isNull(obj) || _.isUndefined(obj);
}

function validate(obj, name, constraints) {
  if (!validate.isEnabled) {
    return;
  }

  constraints = constraints || {};

  if (constraints.isRequired && isNullOrUndefined(obj)) {
    throw new Error(name + " is required");
  }

  if (constraints.isPlainObject && !_.isPlainObject(obj)) {
    throw new Error(name + " must be a plain object");
  }

  if (constraints.isArray && !_.isArray(obj)) {
    throw new Error(name + " must be an array");
  }

  if (constraints.isString && !_.isString(obj)) {
    throw new Error(name + " must be a string");
  }

  if (constraints.isFunction && !_.isFunction(obj)) {
    throw new Error(name + " must be a function");
  }

  if (constraints.isNumber && !_.isNumber(obj)) {
    throw new Error(name + " must be a number");
  }

  if (constraints.isFinite && !_.isFinite(obj)) {
    throw new Error(name + " must be a finite number");
  }

  if (constraints.isRegExp && !_.isRegExp(obj)) {
    throw new Error(name + " must be a regular expression");
  }

  if (constraints.isElement && !_.isElement(obj)) {
    throw new Error(name + " must be an element");
  }

  if (constraints.isInstanceOf && !(obj instanceof constraints.isInstanceOf)) {
    throw new Error(name + " must be an instance of " + constraints.isInstanceOf);
  }

  if (constraints.isArguments && !_.isArguments(obj)) {
    throw new Error(name + " must be an arguments object");
  }

  if (_.has(constraints, "isNotSet") && !isNullOrUndefined(constraints.isNotSet)) {
    throw new Error(name + " is already set");
  }
}

validate.isEnabled = true;

module.exports = validate;
