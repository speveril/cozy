'use strict';
const App = require('app');
const BrowserWindow = require('browser-window');
const Electron = require('electron');
const FS = require('fs');
const Path = require('path');
const Process = require('process');
const WindowStateKeeper = require('electron-window-state');

process.chdir(Path.join(Path.dirname(process.execPath), ".."));

App.on('ready', setup);

var mainWindow;

function output(text) {
    if (mainWindow) {
        mainWindow.webContents.send('output', text);
    }
}

function setup() {
    var windowState = WindowStateKeeper({});

    mainWindow = new BrowserWindow(windowState);

    windowState.manage(mainWindow);

    mainWindow.once('close', () => {
        return process.exit(0);
    });

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('start');
    });

    Electron.ipcMain.on('control-message', (event, arg) => {
        var command = arg.command;
        output("-> " + JSON.stringify(arg));

        switch(command) {
            case 'play':
                play(arg.path)
                    .then(() => {
                        output("<span style='color:#0f0'>Game finished successfully.</span>");
                    }, (e) => {
                        output("<span style='color:red'>Playing game failed. " + e.toString() + "</span>");
                    })
                break;
            default:
                output("<span style='color:red'>Got unrecognized control command: " + command + "</span>");
                // do nothing
        }
    });

    mainWindow.loadURL("file://" + __dirname + "/browser.html");
    mainWindow.toggleDevTools();

}

function play(path, debug) {
    path = path || '';

    return new Promise((resolve, reject) => {
        var params;

        try {
            params = JSON.parse(FS.readFileSync(Path.join(path, "config.json")));
        } catch(e) {
            output("Couldn't load game in " + Path.join(process.cwd(), path) + ".");
            output("<span style='color:red'>" + e.toString() + "</span>");
            reject();
        }

        var window = new BrowserWindow({
            'width':              params['width'],
            'height':             params['height'],
            'title':              params['title'] || 'Egg',
            'fullscreen':         params['fullscreen'] || false,
            'autoHideMenuBar':    true,
            'useContentSize':     true
        });

        window.once('close', function() {
            resolve();
        });

        params['game'] = path;
        params['width'] = params['width'] || 320;
        params['height'] = params['height'] || 240;
        params['debug'] = debug;

        window.loadURL("file://" + __dirname + "/game.html");
        window.webContents.once('did-finish-load', () => {
            window.webContents.send('start', params);
        });
    });
}

// const fs = require('fs');
// const path = require ('path');
// const child = require('child_process');
//
// process.chdir(path.join(path.dirname(process.execPath), ".."));
//
// // process command line args
// var argv = process.argv.slice(1);
// var gamePath = '.';
// var options = { debug: false }
// var actions = [ ];
//
// var optionMap = {
//     '--buildcore':  'build',
//     '--init':       'new',
//     '--build':      'buildgame',
//     '--console':    'console',
//     '--debug':      'debug',
//     '--noplay':     'noplay',
//
//     '-d':           'debug'
// };
//
// app.on('ready', setup);
//
// var buildWindow;
// var buildWindowReady;
// var queuedBuildMessages = [];
//
// var buildMessage = (msg) => {
//     if (buildWindow && buildWindowReady) {
//         buildWindow.webContents.send('build-message', msg);
//     } else {
//         queuedBuildMessages.push(msg);
//         if (!buildWindow) {
//             makeBuildWindow();
//         }
//     }
// }
//
// function makeBuildWindow() {
//     buildWindow = new BrowserWindow({
//         width: 640,
//         height: 480,
//         title: 'Egg Builder',
//         'autoHideMenuBar':  true,
//     });
//     buildWindow.loadURL("file://" + __dirname + "/build.html");
//     buildWindow.webContents.on('did-finish-load', () => {
//         buildWindowReady = true;
//         queuedBuildMessages.forEach((m) => {
//             buildMessage(m);
//         });
//         queuedBuildMessages = [];
//     });
// }
//
// function setup() {
//     var badParam = false;
//
//     for (var i in argv) {
//         var option = argv[i];
//         if (optionMap[option]) {
//             options[optionMap[option]] = true;
//         } else if (option.indexOf('-') === 0) {
//             uncleanExit(3, "Bad command line param, " + option);
//             return;
//         } else {
//             gamePath = argv[i];
//         }
//     }
//
//     if (options.build) {
//         actions.push(build.bind(null, path.join("egg", "resources", "default_app", "src"), '../Egg.js'));
//         actions.push(doc.bind(null, path.join("egg", "resources", "default_app", "src", "Egg.ts"), path.join("egg", "docs")));
//     }
//     if (options.buildgame) {
//         actions.push(build.bind(null, gamePath, 'main.js'));
//     }
//
//     if (options.new) {
//         actions.push(makeNew);
//     }
//
//     if (!options.noplay) {
//         actions.push(play);
//     }
//
//     next();
// }
//
// function uncleanExit(code, msg) {
//     if (!buildWindow) {
//         makeBuildWindow();
//     }
//     buildMessage(msg);
//
//     buildWindow.once('close', function() {
//         process.exit(code);
//     });
// }
//
// function next() {
//     if (actions.length === 0) {
//         if (buildWindow) {
//             buildWindow.close();
//         }
//         return process.exit(0);
//     } else {
//         var action = actions.shift();
//         action();
//     }
// }
//
// function build(buildPath, outputFile) {
//     buildMessage("### Building " + buildPath + " ###\n")
//
//     // TODO copy all the stuff we need into a lib/ directory in the game
//     //   - need to add the d.ts files for PIXI, node, etc
//     // var filesToCopy = [
//     //     'Egg.js',
//     //     'Egg.js.map',
//     //     'Egg.d.ts'
//     // ];
//     // filesToCopy.forEach(function(filename) {
//     //     var contents = fs.readFileSync(__dirname + "/" + filename, { encoding: 'UTF-8' });
//     //     fs.writeFileSync(gamePath + "/" + filename, contents);
//     // });
//
//     var tsc = child.fork(path.join(__dirname, 'lib', 'typescript', 'tsc.js'), [
//         '--project', buildPath,
//         '--out', path.join(buildPath, outputFile)
//     ], { silent: true, env: {"ATOM_SHELL_INTERNAL_RUN_AS_NODE":"0"} });
//
//     tsc.stdout.on('data', buildMessage);
//     tsc.stderr.on('data', buildMessage);
//
//     tsc.on('exit', function(returnCode) {
//         if (!returnCode) {
//             buildMessage(" - Built in " + path.join(buildPath, outputFile) + "\n");
//             buildMessage("<span style='color:green'>### Success ###</span>\n\n");
//             next();
//         } else {
//             uncleanExit(1, "<span style='color:red'>### FAILURE ###</span>\n");
//         }
//     });
// }
//
// function doc(srcPath, outputPath) {
//     buildMessage("### Documenting ###\n - source:      " + srcPath + "\n - destination: " + outputPath + "\n");
//
//     var typedoc = child.fork(path.join(__dirname, "builddoc"), [
//         '--out', outputPath,
//         '--mode', 'file',
//         '--target', 'ES5',
//         '--name', 'Egg Engine',
//         srcPath
//     ], { silent: true, env: {"ATOM_SHELL_INTERNAL_RUN_AS_NODE":"0"} });
//
//     typedoc.stdout.on('data', buildMessage);
//     typedoc.stderr.on('data', buildMessage);
//
//     typedoc.on('exit', function(returnCode) {
//         if (!returnCode) {
//             buildMessage("<span style='color:green'>### Success ###</span>\n\n");
//             next();
//         } else {
//             uncleanExit(1, "<span style='color:red'>### FAILURE ###</span>\n");
//         }
//     });
// }
//
// function makeNew() {
//     var templateDir =  path.join("egg", "resources", "default_app", "game_template");
//
//     if (!fs.existsSync(gamePath)) {
//         fs.mkdirSync(gamePath);
//     }
//
//     if (fs.existsSync(path.join(gamePath, "config.json"))) {
//         buildMessage("Cannot initialize a game at " + gamePath + ", there's already one there!");
//     } else {
//         var filesToCopy = fs.readdirSync(templateDir);
//         filesToCopy.forEach(function(filename) {
//             var contents = fs.readFileSync(path.join(templateDir, filename), { encoding: 'UTF-8' });
//             contents = contents.replace(/\$GAMEPATH\$/g, gamePath);
//             fs.writeFileSync(path.join(gamePath, filename), contents);
//         });
//     }
//
//     next();
// }
//
