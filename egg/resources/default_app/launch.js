var app = require('app');
var BrowserWindow = require('browser-window');
var fs = require('fs');
var path = require ('path');

process.chdir(path.join(path.dirname(process.execPath), ".."));

// process command line args
var argv = process.argv.slice(1);
var gamePath = '.';
var options = { debug: false }
var actions = [ ];

var optionMap = {
    '--build':     'build',
    '--init':      'new',
    '--buildGame': 'buildGame',
    '--console':   'console',
    '--debug':     'debug',
    '-d':          'debug'
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
        actions.push(build.bind(null, path.join("egg", "resources", "default_app", "src"), '../Egg.js'));
    }
    if (options.buildGame) {
        actions.push(build.bind(null, gamePath, 'main.js'));
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

function build(buildPath, outputFile) {
    console.log("Building", buildPath, '->', path.join(buildPath, outputFile));

    // TODO copy all the stuff we need into a lib/ directory in the game
    //   - need to add the d.ts files for PIXI, node, etc
    // var filesToCopy = [
    //     'Egg.js',
    //     'Egg.js.map',
    //     'Egg.d.ts'
    // ];
    // filesToCopy.forEach(function(filename) {
    //     var contents = fs.readFileSync(__dirname + "/" + filename, { encoding: 'UTF-8' });
    //     fs.writeFileSync(gamePath + "/" + filename, contents);
    // });

    var child = require('child_process');
    var tsc = child.fork(__dirname + '/lib/typescript/tsc', ['--project', buildPath, '--out', path.join(buildPath, outputFile)]);

    // TODO add a new browserwindow that shows the results of the compile

    tsc.on('close', function(return_code) {
        if (!return_code) {
            console.log(" - Build success.");
            next();
        } else {
            console.log(" - Build failed.");
            process.exit(1);
        }
    });
}

function makeNew() {
    var templateDir =  path.join("egg", "resources", "default_app", "game_template");

    if (!fs.existsSync(gamePath)) {
        fs.mkdirSync(gamePath);
    }

    if (fs.existsSync(path.join(gamePath, "config.json"))) {
        throw new Error("Cannot initialize a game at " + gamePath + ", there's already one there!");
    } else {
        var filesToCopy = fs.readdirSync(templateDir);
        filesToCopy.forEach(function(filename) {
            var contents = fs.readFileSync(path.join(templateDir, filename), { encoding: 'UTF-8' });
            contents = contents.replace(/\$GAMEPATH\$/g, gamePath);
            fs.writeFileSync(path.join(gamePath, filename), contents);
        });
    }

    next();
}

function play() {
    try {
        params = JSON.parse(fs.readFileSync(path.join(gamePath, "config.json")));
    } catch(e) {
        console.log("Couldn't load config.json in " + path.join(process.cwd(), gamePath) + ". " + e);
        next();
    }
    params['width'] = params['width'] || 320;
    params['height'] = params['height'] || 240;

    var window = new BrowserWindow({
      'width':               params['width'],
      'height':              params['height'],
      'title':               params['title'] || 'Egg',
      'fullscreen':          params['fullscreen'] || false
      'auto-hide-menu-bar':  true,
      'use-content-size':    true,
    });
    params.game = gamePath;
    if (options.debug) params.debug = true
    if (options.console) window.toggleDevTools();

    window.once('close', function() {
        next();
    });

    window.loadURL("file://" + __dirname + "/index.html?" + JSON.stringify(params));
}
