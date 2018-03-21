'use strict';

const Electron = require('electron');
const FS = require('fs-extra');
const Path = require('path');
const Process = require('process');
const WindowStateKeeper = require('electron-window-state');

Electron.app.on('ready', setup);

var mainWindow, editors = {};

function output(text) {
    if (mainWindow) {
        mainWindow.webContents.send('output', text);
    }
}

function setup() {
    var windowState = WindowStateKeeper({});
    mainWindow = new Electron.BrowserWindow(windowState);
    windowState.manage(mainWindow);

    mainWindow.once('close', () => {
        return process.exit(0);
    });

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('start');
    });

    Electron.ipcMain.on('control-message', (event, arg) => {
        var command = arg.command;
        // output("-> " + JSON.stringify(arg));

        switch(command) {
            case 'play':
                play(arg.path, arg.override || {}, arg.debug || false)
                    .then(() => {
                        output("<span style='color:#0f0'>[ Done ]</span>\n");
                    }, (e) => {
                        output("<span style='color:red'>[ Error: " + e.toString() + " ]</span>\n");
                    })
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

function play(path, override, debug) {
    path = path || '';

    return new Promise((resolve, reject) => {
        var params;

        try {
            params = JSON.parse(FS.readFileSync(Path.join(path, "config.json")));
        } catch(e) {
            output("Couldn't load game in " + Path.join(process.cwd(), path) + ".");
            output("<span style='color:red'>" + e.toString() + "</span>");
            reject(e);
        }

        output("<span style='color:white'>[ Launching " + (params.title || path) + " ]</span>");
        output(">" + path);

        var window = new Electron.BrowserWindow({
            'minWidth':           20,
            'minHeight':          20,
            'width':              params['width'],
            'height':             params['height'],
            'title':              params['title'] || 'Cozy',
            'fullscreen':         false,
            'icon':               params['icon'] ? Path.join(process.cwd(), path, params['icon']) : undefined,
            'autoHideMenuBar':    true,
            'useContentSize':     true
        });
        // window.toggleDevTools();

        params['game'] = path;
        params['width'] = params['width'] || 320;
        params['height'] = params['height'] || 240;
        params['debug'] = debug;

        params['enginePath'] = 'node_modules/electron/dist';
        if (process.platform === 'darwin') params['enginePath'] += '/Contents/Resources'

        window.once('close', () => {
            resolve();
        });

        window.loadURL("file://" + __dirname + "/game.html");

        window.webContents.once('did-finish-load', () => {
            window.webContents.send('start', params, override);
        });
    });
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
        'useContentSize':     true
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
