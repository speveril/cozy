'use strict';
const Electron = require('electron');
const FS = require('fs');
const Path = require('path');
const process = require('process');

process.chdir(Path.dirname(process.execPath));
let window;
let args = JSON.parse(process.argv[2]);

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
        'useContentSize':     true
    });
    // window.toggleDevTools();

    params['game'] = path;
    params['width'] = params['width'] || 320;
    params['height'] = params['height'] || 240;
    params['debug'] = args.debug;

    params['enginePath'] = 'node_modules/electron/dist';
    if (process.platform === 'darwin') params['enginePath'] += '/Contents/Resources'

    window.once('close', () => {
        process.exit(0);
    });

    window.loadURL("file://" + __dirname + "/game.html?" + path);

    window.webContents.once('did-finish-load', () => {
        window.webContents.send('start', params, args.override);
    });
});
