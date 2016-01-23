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

    if (needBuildWindow) {
        // ...
    }

    if (options.new) {
        actions.push(makeNew);
    }
    if (!options.noplay) {
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
    // console.log("Building", buildPath, '->', path.join(buildPath, outputFile));

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

    var window = new BrowserWindow({
        width: 640,
        height: 480,
        title: 'Egg Builder',
        'auto-hide-menu-bar':  true,
    });
    window.loadURL("file://" + __dirname + "/build.html");
    window.toggleDevTools();
    window.webContents.on('did-finish-load', function() {
        var buildMessage = (msg) => {
            window.webContents.send('build-message', msg);
        }

        buildMessage("Building " + buildPath + " -> " + path.join(buildPath, outputFile) + "\n");

        var tsc = child.fork(path.join(__dirname, 'lib', 'typescript', 'tsc.js'), [
            '--project', buildPath,
            '--out', path.join(buildPath, outputFile)
        ], { silent: true, env: {"ATOM_SHELL_INTERNAL_RUN_AS_NODE":"0"} });

        tsc.stdout.on('data', buildMessage);
        tsc.stderr.on('data', buildMessage);

        tsc.on('exit', function(return_code) {
            if (!return_code) {
                buildMessage(" - Success.");
                window.once('close', function() {
                    next();
                });
            } else {
                buildMessage(" - Failure.");
                window.once('close', function() {
                    process.exit(1);
                });
            }
        });
    })
}

function doc(srcPath, outputPath) {
    console.log("Generating documentation for", srcPath, '->', outputPath);

    var typedoc = child.fork(path.join(__dirname, "node_modules", "typedoc", "bin", "typedoc"), [
        '--out', outputPath,
        '--mode', 'file',
        '--target', 'ES5',
        srcPath
    ]);

    typedoc.on('exit', function(return_code) {
        if (!return_code) {
            console.log(" - Success.");
            next();
        } else {
            console.log(" - Failure.");
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
      'fullscreen':          params['fullscreen'] || false,
      'auto-hide-menu-bar':  true,
      'use-content-size':    true
    });
    params.game = gamePath;
    if (options.debug) params.debug = true
    if (options.console) window.toggleDevTools();

    window.once('close', function() {
        next();
    });

    window.loadURL("file://" + __dirname + "/game.html?" + JSON.stringify(params));
}
