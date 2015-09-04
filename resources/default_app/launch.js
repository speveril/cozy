var app = require('app');
var BrowserWindow = require('browser-window');
var fs = require('fs');

var execPath = process.execPath.replace(/(.*)(\\|\/).*$/, '$1$2');
process.chdir(execPath);

// process command line args
var argv = process.argv.slice(1);
var gamePath = '.';
var options = { debug: false }
var actions = [ ];

var optionMap = {
    '--build':     'build',
    '--buildGame': 'buildGame',
    '--console':   'console',
    '--debug':     'debug',
    '--init':      'new',
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

app.on('ready', setup);

function setup() {
    if (options.build) {
        actions.push(build.bind(null, __dirname + '/src'));
    }
    if (options.buildGame) {
        actions.push(build.bind(null, gamePath));
    }

    if (options.new) {
        actions.push(makeNew);
    } else {
        actions.push(play);
    }

    next();
}

function next() {
    if (actions.length === 0) {
        console.log("Done!");
        return process.exit(0);
    }

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
            process.exit(1);
        }
    });
}

function makeNew() {
    var templateDir = __dirname + "/game_template";

    if (!fs.existsSync(gamePath)) {
        fs.mkdirSync(gamePath);
    }

    if (fs.existsSync(gamePath + "/" + "config.json")) {
        throw new Error("Cannot initialize a game at " + gamePath + ", there's already one there!");
    } else {
        var filesToCopy = fs.readdirSync(templateDir);
        filesToCopy.forEach(function(filename) {
            var contents = fs.readFileSync(templateDir + "/" + filename, { encoding: 'UTF-8' });
            contents = contents.replace(/\$GAMEPATH\$/g, gamePath);
            fs.writeFileSync(gamePath + "/" + filename, contents);
        });
    }


    next();
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

    window.once('close', function() {
        next();
    });

    window.loadUrl("file://" + __dirname + "/index.html?" + params);
}
