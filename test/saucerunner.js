var _ = require("lodash");
var MochaSauce = require("mocha-sauce");
var debug = require("debug")("sauce-runner");

var sauceRunner = {
  start: function(done) {
    var sauce = new MochaSauce({
      name: "decks",
      host: "localhost",
      port: 4445,
      // The app needs to be served at this URL before this runs (e.g. using node-static)
      // We tried serving the app using express from the gulp file, but that seemed to create problems.
      url: "http://127.0.0.1:8080/dist/test/index.html",
      build: Date.now()
    });

    //sauce.record(true);

    sauce.browser({ platform: "Windows XP", browserName: "internet explorer", version: "8" });

    sauce.browser({ platform: "Windows 7", browserName: "chrome" });
    sauce.browser({ platform: "Windows 7", browserName: "internet explorer", version: "8" });
    sauce.browser({ platform: "Windows 7", browserName: "internet explorer", version: "9" });
    sauce.browser({ platform: "Windows 7", browserName: "internet explorer", version: "10" });
    sauce.browser({ platform: "Windows 7", browserName: "internet explorer", version: "11" });

    sauce.on("init", function(browser) {
      debug("sauce init: %s %s", browser.browserName, browser.platform);
    });

    sauce.on("start", function(browser) {
      debug("sauce start: %s %s", browser.browserName, browser.platform);
    });

    sauce.on("end", function(browser, res) {
      debug("sauce end: %s %s: %d failures", browser.browserName, browser.platform, res.failures);
    });

    debug("sauce.start");
    sauce.start(function(err, res) {

      debug("MochaSauce complete!");

      if(err) {
        debug("Failure in MochaSauce: ", err);
        done(err);

        debug("Exiting with status code 1");
        process.exit(1);
        return;
      }

      var failures = 1;
      if (res) {
        if (_.isArray(res) && res.length > 0) {
          failures = res[0].failures;
        } else {
          debug("Failed to get failures from response");
        }
      }

      debug("MochaSauce failures: " + failures);

      done();

      debug("Exiting with status code (failure count): " + failures);
      process.exit(failures);
    });
  }
};

module.exports = sauceRunner;
