'use strict';

const Child = require('child_process');
const Electron = require('electron');
const FS = require('fs-extra');
const Path = require('path');
const Process = require('process');
const WindowStateKeeper = require('electron-window-state');

Process.chdir(__dirname);

let cliargs = Process.argv.slice(0);

// Slice the __dirname out of our args; this is because we run games in multiple contexts.
// When running from source, we end up getting the IDE directory as argv[1]. When running
// a dist, we do not. Remove it, to make them consistent.
if (cliargs.indexOf(__dirname) !== -1) {
    cliargs.splice(cliargs.indexOf(__dirname), 1);
}

if (cliargs.indexOf('--play') !== -1) {
    let window;
    let args = JSON.parse(cliargs[2]);
    
    Electron.app.on('ready', () => {
        let path = args.path;
        let params;
        
        try {
            params = JSON.parse(FS.readFileSync(Path.join(path, "config.json")));
        } catch(e) {
            console.error("Couldn't load game in " + Path.join(process.cwd(), path) + ".");
            console.error("<span style='color:red'>" + e.toString() + "</span>");
            process.exit(1);
        }
    
        var window = new Electron.BrowserWindow({
            'minWidth':           20,
            'minHeight':          20,
            'width':              params['width'],
            'height':             params['height'],
            'title':              params['title'] || 'Cozy',
            'fullscreen':         false,
            'icon':               params['icon'] ? Path.join(process.cwd(), path, params['icon']) : undefined,
            'autoHideMenuBar':    true,
            'useContentSize':     true,
            'webPreferences': {
                'nodeIntegration': true,
            },
        });
        // window.toggleDevTools();
    
        params['game'] = path;
        params['width'] = params['width'] || 320;
        params['height'] = params['height'] || 240;
        params['debug'] = args.debug;
        params['libRoots'] = args.libRoots;
    
        window.once('close', () => {
            process.exit(0);
        });
    
        window.loadURL("file://" + __dirname + "/player/game.html?" + path);
    
        window.webContents.once('did-finish-load', () => {
            window.setMenu(null);
            window.webContents.send('start', params, args.override);
        });
    });
} else {
    console.log("Requesting single instance lock...");
    Electron.app.requestSingleInstanceLock();
    Electron.app.on('second-instace', (event, argv, cwd) => {
        console.log("Second instance started; ignoring.");
        if (mainWindow) {
            mainWindow.show();
        }
    });
    Electron.app.on('ready', setup);
}

var mainWindow, editors = {};

function output(text) {
    if (mainWindow) {
        mainWindow.webContents.send('output', text);
    }
}

function setup() {
    var windowState = WindowStateKeeper({});
    mainWindow = new Electron.BrowserWindow(Object.assign({}, windowState, {
        'icon': 'icon.ico',
        'webPreferences': {
            'nodeIntegration': true,
        },
    }));
    windowState.manage(mainWindow);

    mainWindow.once('close', () => {
        return process.exit(0);
    });

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('start');
    });

    Electron.ipcMain.on('control-message', (event, arg) => {
        var command = arg.command;

        switch(command) {
            case 'play':
                play(arg.path, arg.override || {}, arg.debug || false, arg.libRoots || '');
                break;
            case 'edit':
                openEditor(arg.path);
                break;
            case 'view-docs':
                viewDocs();
                break;
            default:
                output("<span style='color:red'>Got unrecognized control command: " + command + "</span>");
                // do nothing
        }
    });

    mainWindow.loadURL("file://" + __dirname + "/projectmanager/manager.html");
    // mainWindow.toggleDevTools();
}

function play(path, override, debug, libRoots) {
    return new Promise((resolve, reject) => {
        output("<span style='color:white'>[ Launching " + (path) + " ]</span>");
        output(">" + path);

        let args = {
            path: path,
            override: override,
            debug: debug,
            libRoots: libRoots
        };

        let child_params = {
            stdio: [ 'ignore', 'pipe', 'pipe', 'ipc' ],
            cwd: Path.resolve(Path.join(__dirname, '..'))
        };

        let childproc = Child.spawn(process.execPath, [ __dirname, '--play', JSON.stringify(args) ], child_params);

        let stdout = '', stderr = '';
        childproc.stdout.on('data', (s) => stdout += s.toString().trim() + "\n");
        childproc.stderr.on('data', (s) => stderr += s.toString().trim() + "\n");

        childproc.on('exit', (returnCode) => {
            if (!returnCode) {
                output("<span style='color:#0f0'>[ Done ]</span>\n");
                mainWindow.webContents.send('play-done');
                resolve();
            } else {
                output(stderr);
                output("<span style='color:red'>[ Error: " + returnCode + " ]</span>\n");
                mainWindow.webContents.send('play-done');
                reject();
            }
        });
    });


    // path = path || '';

    // return new Promise((resolve, reject) => {
    //     var params;

    //     try {
    //         params = JSON.parse(FS.readFileSync(Path.join(path, "config.json")));
    //     } catch(e) {
    //         output("Couldn't load game in " + Path.join(process.cwd(), path) + ".");
    //         output("<span style='color:red'>" + e.toString() + "</span>");
    //         reject(e);
    //     }

    //     output("<span style='color:white'>[ Launching " + (params.title || path) + " ]</span>");
    //     output(">" + path);

    //     var window = new Electron.BrowserWindow({
    //         'minWidth':           20,
    //         'minHeight':          20,
    //         'width':              params['width'],
    //         'height':             params['height'],
    //         'title':              params['title'] || 'Cozy',
    //         'fullscreen':         false,
    //         'icon':               params['icon'] ? Path.join(process.cwd(), path, params['icon']) : undefined,
    //         'autoHideMenuBar':    true,
    //         'useContentSize':     true
    //     });
    //     // window.toggleDevTools();

    //     params['game'] = path;
    //     params['width'] = params['width'] || 320;
    //     params['height'] = params['height'] || 240;
    //     params['debug'] = debug;

    //     params['enginePath'] = 'node_modules/electron/dist';
    //     if (process.platform === 'darwin') params['enginePath'] += '/Contents/Resources'

    //     window.once('close', () => {
    //         resolve();
    //     });

    //     window.loadURL("file://" + __dirname + "/game.html");

    //     window.webContents.once('did-finish-load', () => {
    //         window.webContents.send('start', params, override);
    //     });
    // });
}

function viewDocs() {
    require('shell').openExternal("file://" + Process.cwd() + "/docs/index.html");
}

function openEditor(path) {
    if (editors[path]) {
        editors[path].focus();
        return;
    }

    path = path || '';

    var params = {};

    try {
        params.config = JSON.parse(FS.readFileSync(Path.join(path, "config.json")));
    } catch(e) {
        output("Couldn't load game in " + Path.join(process.cwd(), path) + ".");
        output("<span style='color:red'>" + e.toString() + "</span>");
    }

    var window = new Electron.BrowserWindow({
        'width':              1024,
        'height':             768,
        'fullscreen':         false,
        // 'icon':               params['icon'] ? Path.join(process.cwd(), path, params['icon']) : undefined,
        'autoHideMenuBar':    false,
        'useContentSize':     true,
        'webPreferences': {
            'nodeIntegration': true,
        },
    });
    // window.toggleDevTools();

    editors[path] = window;

    params['gamePath'] = path;
    params['enginePath'] = 'bin-win32-x64';

    window.once('close', () => {
        editors[path] = null;
    });
    window.webContents.once('did-finish-load', () => {
        window.webContents.send('start', params);
    });
    window.once('ready-to-show', () => {
        window.show();
    })

    window.loadURL("file://" + __dirname + "/editor/editor.html");
}
