var app = require('app');
var BrowserWindow = require('browser-window');

var execPath = process.execPath.replace(/(.*)(\\|\/).*$/, '$1$2');
process.chdir(execPath);

// process command line args
var argv = process.argv.slice(1);
var gamePath = '.';
var options = { debug: false }

for (var i in argv) {
    var option = argv[i];
    if (option === '--debug' || option === '-d') {
        options.debug = true;
    } else if (option.indexOf('-') === 0) {
        console.log("Bad command line param, " + option);
        process.exit(1);
    } else {
        gamePath = argv[i];
    }
}

// set up general handlers
app.on('window-all-closed', function() {
  app.quit();
});

// launch
app.on('ready', function() {
    var window = new BrowserWindow({
      width: 320,
      height: 240,
      title: 'Egg',

      'auto-hide-menu-bar': true,
      'use-content-size': true,
    //   'frame': false
    });
    
    params = "game=" + gamePath;
    if (options.debug) params += "&debug=1";

    window.loadUrl("file://" + __dirname + "/index.html?" + params);
}.bind(this));
