'use strict';
const Electron = require('electron');
const FS = require('fs');
const Path = require('path');
const Process = require('process');

process.chdir(Path.dirname(process.execPath));
var window;

Electron.app.on('ready', () => {
    var path = Path.join("resources", "app", "g");
    var params = $$_PARAMS_$$;

    window = new Electron.BrowserWindow({
        'width':              params['width'],
        'height':             params['height'],
        'title':              params['title'],
        'fullscreen':         params['fullscreen'],
        'autoHideMenuBar':    true,
        'useContentSize':     true
    });

    window.once('close', () => {
        return process.exit(0);
    });

    params['game'] = path;
    params['enginePath'] = '.';
    params['debug'] = false;

    window.loadURL("file://" + __dirname + "/game.html");
    window.webContents.once('did-finish-load', () => {
        window.webContents.send('start', params);
    });
});
