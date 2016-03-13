const app = require('app');
const BrowserWindow = require('browser-window');
const fs = require('fs');
const path = require ('path');
const child = require('child_process');

process.chdir(path.join(path.dirname(process.execPath), ".."));

// process command line args
var argv = process.argv.slice(1);
var gamePath = '.';
var options = { debug: false }
var actions = [ ];

var optionMap = {
    '--buildcore':  'build',
    '--init':       'new',
    '--build':      'buildgame',
    '--console':    'console',
    '--debug':      'debug',
    '--noplay':     'noplay',

    '-d':           'debug'
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

var buildWindow;
var buildMessage = (msg) => {
    if (buildWindow) {
        buildWindow.webContents.send('build-message', msg);
    }
}

function setup() {
    var needBuildWindow = false;
    if (options.build) {
        actions.push(build.bind(null, path.join("egg", "resources", "default_app", "src"), '../Egg.js'));
        actions.push(doc.bind(null, path.join("egg", "resources", "default_app", "src", "Egg.ts"), path.join("egg", "docs")));
        needBuildWindow = true;
    }
    if (options.buildgame) {
        actions.push(build.bind(null, gamePath, 'main.js'));
        needBuildWindow = true;
    }


    if (options.new) {
        actions.push(makeNew);
        needBuildWindow = true;
    }

    if (!options.noplay) {
        actions.push(play);
    }

    if (needBuildWindow) {
        buildWindow = new BrowserWindow({
            width: 640,
            height: 480,
            title: 'Egg Builder',
            'auto-hide-menu-bar':  true,
        });
        buildWindow.loadURL("file://" + __dirname + "/build.html");
        buildWindow.toggleDevTools();
        buildWindow.webContents.on('did-finish-load', () => {
            next();
        });
        buildWindow.on('close', () => process.exit(2));
    } else {
        next();
    }
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
    buildMessage("Building " + buildPath + " -> " + path.join(buildPath, outputFile) + "\n");

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

    var tsc = child.fork(path.join(__dirname, 'lib', 'typescript', 'tsc.js'), [
        '--project', buildPath,
        '--out', path.join(buildPath, outputFile)
    ], { silent: true, env: {"ATOM_SHELL_INTERNAL_RUN_AS_NODE":"0"} });

    tsc.stdout.on('data', buildMessage);
    tsc.stderr.on('data', buildMessage);

    tsc.on('exit', function(returnCode) {
        if (!returnCode) {
            buildMessage(" - Success.\n");
            next();
        } else {
            buildMessage(" - Failure.\n");
            buildWindow.once('close', function() {
                process.exit(1);
            });
        }
    });
}

function doc(srcPath, outputPath) {
    buildMessage("Generating documentation for " + srcPath + " -> " + outputPath + "\n");

    var typedoc = child.fork(path.join(__dirname, "builddoc"), [
        '--out', outputPath,
        '--mode', 'file',
        '--target', 'ES5',
        '--name', 'Egg Engine',
        srcPath
    ], { silent: true, env: {"ATOM_SHELL_INTERNAL_RUN_AS_NODE":"0"} });

    typedoc.stdout.on('data', buildMessage);
    typedoc.stderr.on('data', buildMessage);

    typedoc.on('exit', function(returnCode) {
        if (!returnCode) {
            buildMessage(" - Success.\n");
            next();
        } else {
            buildMessage(" - Failure.\n");
            buildWindow.once('close', function() {
                process.exit(1);
            });
        }
    });
}

function makeNew() {
    var templateDir =  path.join("egg", "resources", "default_app", "game_template");

    if (!fs.existsSync(gamePath)) {
        fs.mkdirSync(gamePath);
    }

    if (fs.existsSync(path.join(gamePath, "config.json"))) {
        buildMessage("Cannot initialize a game at " + gamePath + ", there's already one there!");
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
    if (buildWindow) {
        buildWindow.close();
    }

    try {
        params = JSON.parse(fs.readFileSync(path.join(gamePath, "config.json")));
    } catch(e) {
        console.log("Couldn't load config.json in " + path.join(process.cwd(), gamePath) + ". " + e);
        next();
    }
    params['width'] = params['width'] || 320;
    params['height'] = params['height'] || 240;

    var window = new BrowserWindow({
      'width':              params['width'],
      'height':             params['height'],
      'title':              params['title'] || 'Egg',
      'fullscreen':         params['fullscreen'] || false,
      'autoHideMenuBar':    true,
      'useContentSize':     true
    });
    params.game = gamePath;
    if (options.debug) params.debug = true
    if (options.console) window.toggleDevTools();

    window.once('close', function() {
        next();
    });

    window.loadURL("file://" + __dirname + "/game.html?" + JSON.stringify(params));
}
