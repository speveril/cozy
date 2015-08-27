var app = require('app');
var BrowserWindow = require('browser-window');
var fs = require('fs');

var execPath = process.execPath.replace(/(.*)(\\|\/).*$/, '$1$2');
process.chdir(execPath);

// process command line args
var argv = process.argv.slice(1);
var gamePath = '.';
var options = { debug: false }
var actions = [ play ];

var optionMap = {
    '--build':     'build',
    '--buildGame': 'buildGame',
    '--console':   'console',
    '--debug':     'debug',
    '-d':          'debug',
};

for (var i in argv) {
    var option = argv[i];
    if (optionMap[option]) {
        options[optionMap[option]] = true;
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

function setup() {
    if (options.buildGame) {
        console.log("foo");
        actions.unshift(build.bind(null, gamePath));
    }
    if (options.build) {
        actions.unshift(build.bind(null, __dirname + '/src'));
    }

    next();
}

function next() {
    var action = actions.shift();
    action();
}

function build(path) {
    console.log("Building", path);

    var child = require('child_process');
    var tsc = child.fork(__dirname + '/lib/typescript/tsc', ['--project', path]);

    // TODO add a new browserwindow that shows the results of the compile
    tsc.on('close', function(return_code) {
        if (!return_code) {
            console.log("Build success.");
            next();
        } else {
            console.log("Build failed.");
        }
    });
}

function play() {
    var window = new BrowserWindow({
      width: 320,
      height: 240,
      title: 'Egg',

      'auto-hide-menu-bar': true,
      'use-content-size': true,
    //   'frame': false,
    //   'fullscreen': true
    });

    params = "game=" + gamePath;
    if (options.debug) {
        params += "&debug=1";
    }
    if (options.console) window.toggleDevTools();

    window.loadUrl("file://" + __dirname + "/index.html?" + params);
}

// launch
app.on('ready', setup);
