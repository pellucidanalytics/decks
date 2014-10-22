var MochaSauce = require("mocha-sauce");

var sauce = new MochaSauce({
  name: "decks",
  url: "http://localhost/dist/test"
});

sauce.browser({ browserName: "chrome", platform: "Windows 7" });
sauce.browser({ browserName: "firefox", platform: "Windows XP" });

sauce.on("init", function(browser) {
  console.log("init : %s %s", browser.browserName, browser.platform);
});

sauce.on("start", function(browser) {
  console.log("start : %s %s", browser.browserName, browser.platform);
});

sauce.on("end", function(browser, res) {
  console.log("end : %s %s : %d failures", browser.browserName, browser.platform, res.failures);
});

module.exports = sauce;
