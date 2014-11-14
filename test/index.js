// Velocity requires global jQuery/$ for IE8
window.jQuery = window.$ = require("jquery");
require("velocity-animate");

require("./sanitycheck");

require("./events");
require("./layouts");
require("./ui");
require("./utils");

require("./canvas.spec");
require("./deck.spec");
require("./frame.spec");
require("./item.spec");
require("./itemcollection.spec");
require("./layout.spec");
require("./viewport.spec");
