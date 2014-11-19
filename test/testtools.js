/* global KeyboardEvent */
var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

// Test helper method to emit a DOM event
// PhantomJS and IE don't have the same public event API as sane browsers
function emitKeyUpEvent(element) {
  var event;

  // Have to use dispatchEvent/fireEvent because jQuery.trigger will not
  // fire an event attached via addEventListener. Each environment has an
  // unusual way to trigger a keyup event.
  if (element.dispatchEvent) {
    // Sane browsers
    try {
      // Chrome, Safari, Firefox
      event = new KeyboardEvent('keyup');
    } catch (e) {
      // PhantomJS (wat!)
      event = document.createEvent('KeyboardEvent');
      event.initEvent('keyup', true, false);
    }
    event.keyCode = 32;
    element.dispatchEvent(event);
  } else {
    // IE 8
    event = document.createEventObject('KeyboardEvent');
    event.keyCode = 32;
    element.fireEvent('onkeyup', event);
  }

  return event;
}

module.exports = {
  chai: chai,
  expect: chai.expect,
  assert: chai.assert,
  sinon: sinon,
  sinonChai: sinonChai,
  emitKeyUpEvent: emitKeyUpEvent
};
