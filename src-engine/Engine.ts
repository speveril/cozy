import * as PIXI from 'pixi.js';
import * as Electron from 'electron';
import * as path from 'path';

import { Audio } from './Audio';
import { File, Directory } from "./FileSystem";
import { Input } from "./Input";
import { Plane } from './Plane';
import { Texture } from "./Texture";

declare var FontFace:any;

// The kitchen sink

class CozyState {
    public static Game:any;
    public static debug:boolean;

    public static config:Object;
    public static textures:{}[];
    public static planes:Plane[];
    public static browserWindow:Electron.BrowserWindow;
    // let scene:Entity;
    public static gamePath:string;
    public static gameDir:Directory = null;
    public static userDataDir:Directory = null;

    public static enginePath:string;
    public static paused:boolean;
    public static sizeMultiplier:number;
    public static autoResize:boolean;
}

export function setup(opts:any, overrides?:any) {
    window['cozyState'] = CozyState;

    console.log("Creating Cozy Object...", opts);

    window['cozyState'].config = opts;
    window['cozyState'].debug = !!opts.debug;
    window['cozyState'].gamePath = opts.game;
    window['cozyState'].browserWindow = Electron.remote.getCurrentWindow();

    if (window['cozyState'].debug) {
        window['cozyState'].browserWindow.webContents.once('devtools-opened', () => {
            window['cozyState'].browserWindow.focus();
        });
        window['cozyState'].browserWindow['openDevTools']({
            mode: 'detach'
        });
    }

    if (opts.integerUpscale) {
        document.body.classList.add('integerUpscale');
    }

    // see
    //  http://stackoverflow.com/a/26227660
    //  https://developer.apple.com/library/content/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html
    var userdataStem = '';

    if (process.platform === 'darwin') { // MacOS
        userdataStem = process.env.HOME + '/Library/Application Support/';
    } else if (process.env.APPDATA) { // Windows
        userdataStem = process.env.APPDATA + '\\';
    } else { // Linux
        userdataStem = process.env.HOME + "/.";
    }

    window['cozyState'].gameDir = new Directory(window['cozyState'].gamePath);
    console.log("SET GAMEDIR");

    if (!window['cozyState'].config['userdata']) {
        let p = window['cozyState'].gamePath.split(path.sep);
        window['cozyState'].config['userdata'] = p[p.length - 1];
        console.warn("No 'userdata' key found in window['cozyState'].config. This will be a problem when you export -- be sure to set it to something.");
    }
    window['cozyState'].userDataDir = new Directory(userdataStem).subdir(window['cozyState'].config['userdata'], true);

    let userconfig = window['cozyState'].userDataDir.file('config.json');
    if (userconfig.exists) {
        let data = JSON.parse(userconfig.read());
        window['cozyState'].config = Object.assign(window['cozyState'].config, data);
    }

    if (overrides) {
        window['cozyState'].config = Object.assign(window['cozyState'].config, overrides);
    }

    window['cozyState'].textures = [];
    window['cozyState'].planes = [];
    window['cozyState'].paused = true;
    window['cozyState'].autoResize = window['cozyState'].config.hasOwnProperty('autoResize') ? window['cozyState'].config['autoResize'] : true;

    process.chdir(window['cozyState'].gameDir.path);
    Input.init(window['cozyState'].config['controls']);

    // set up window
    var multX = screen.availWidth / window['cozyState'].config['width'],
        multY = screen.availHeight/ window['cozyState'].config['height'],
        mult  = Math.floor(Math.min(multX, multY));
    // window['cozyState'].browserWindow.setMinimumSize(window['cozyState'].config['width'], window['cozyState'].config['height']);
    //  this next line fails on MacOS
    // window['cozyState'].browserWindow.setContentSize(window['cozyState'].config['width'] * mult, window['cozyState'].config['height'] * mult);
    window['cozyState'].browserWindow.center();

    window.addEventListener('resize', (e) => onResize(e));
    window.addEventListener('blur', (e) => {
        if (getFullScreen()) {
            window['cozyState'].browserWindow.minimize();
        }
    });
    window.addEventListener('focus', (e) => {
        Input.clear();
    });

    if (window['cozyState'].config['fullscreen']) {
        setFullScreen(true);
    }

    // debugging
    if (window['cozyState'].debug) { 
        window.addEventListener('keyup', (e) => {
            if (e['keyCode'] === 192) { // ~ key, opens console
                window['cozyState'].browserWindow['openDevTools']();
                window['cozyState'].browserWindow['devToolsWebContents'].focus();
            }
        });
    }

    // set up graphics
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    window['cozyState'].planes = [];

    // set up audio
    Audio.init({
        NOSFX:      window['cozyState'].config['NOSFX'],
        NOMUSIC:    window['cozyState'].config['NOMUSIC']
    });
    if (window['cozyState'].config['volume']) {
        if (window['cozyState'].config['volume']['sfx'] !== undefined) {
            Audio.setSFXVolume(window['cozyState'].config['volume']['sfx']);
        }
        if (window['cozyState'].config['volume']['music'] !== undefined) {
            Audio.setMusicVolume(window['cozyState'].config['volume']['music']);
        }
    }

    if (window['cozyState'].config['css']) {
        if (typeof window['cozyState'].config['css'] === 'string') window['cozyState'].config['css'] = [window['cozyState'].config['css']];
        for (let path of window['cozyState'].config['css']) {
            for (let f of window['cozyState'].gameDir.glob(path)) {
                console.log("stylesheet:", window['cozyState'].gameDir.path, path, f);
                addStyleSheet(<File>f);
            }
        };
    }

    return document['fonts'].ready;
}

export function run(g) {
    window['cozyState'].Game = g;
    if (window['cozyState'].Game.load) {
        Promise.all(window['cozyState'].Game.load())
            .then(() => {
                window['cozyState'].Game.start();
                onResize();
                requestAnimationFrame(frame);
            })
        ;
    } else {
        window['cozyState'].Game.start();
        onResize();
        requestAnimationFrame(frame);
    }
}

const fps60 = 1.0 / 60.0;
let last_t = null;
export function frame(new_t) {
    requestAnimationFrame(frame); // do this here so if there's an error it doesn't stop everything forever

    // the very first time we call frame, go with a dt of 0
    if (last_t === null) {
        last_t = new_t;
    }

    let dt = (new_t - last_t)/1000;
    last_t = new_t;

    // if we've dropped a frame, do updates separately for each...
    let updatedt = dt;
    while (updatedt > 0) {
        let _dt = Math.min(updatedt, fps60);
        Input.update(_dt);
        Audio.update(_dt);

        if (window['cozyState'].paused) return;
        for (let plane of window['cozyState'].planes) plane.update(_dt);

        if (window['cozyState'].Game && window['cozyState'].Game.frame) {
            window['cozyState'].Game.frame(_dt);
        }

        updatedt -= fps60;
    }


    // only do one render
    for (let plane of window['cozyState'].planes) plane.render(dt);

    if (window['cozyState'].Game && window['cozyState'].Game.postRender) {
        window['cozyState'].Game.postRender(dt);
    }
}

export function gameDir():Directory {
    return window['cozyState'].gameDir;
}

export function userDataDir():Directory {
    return window['cozyState'].userDataDir;
}

export function config(k:string):any {
    if (k !== undefined) {
        return window['cozyState'].config[k];
    } else {
        return window['cozyState'].config;
    }
}

// export function setScene(e:Entity) {
//     scene = e;
// }

export function addPlane(Type:any, args?:any):Plane {
    if (!(Type.prototype instanceof Plane)) {
        throw new TypeError("Type passed to addPlane() must inherit from Plane.");
    }

    var plane = new Type(args || {});
    window['cozyState'].planes.push(plane);
    plane.resize(window['cozyState'].sizeMultiplier);

    return plane;
}

export function pause() {
    window['cozyState'].paused = true;
}

export function unpause() {
    window['cozyState'].paused = false;
}

function fixZoom() {
    let windowSize = window['cozyState'].browserWindow.getContentSize();
    let mult = window['cozyState'].sizeMultiplier;

    for (let plane of window['cozyState'].planes) plane.resize(window['cozyState'].config['width'], window['cozyState'].config['height'], mult);

    document.body.style.margin = "" + Math.floor((windowSize[1] - mult * window['cozyState'].config['height']) / 2) + "px " + Math.floor((windowSize[0] - mult * window['cozyState'].config['width']) / 2) + "px";
    document.body.style.display = 'none';
    document.body.offsetHeight;
    document.body.style.display = '';
}

export function onResize(event?:any) {
    let newSize = window['cozyState'].browserWindow.getContentSize(),
        multX   = newSize[0] / window['cozyState'].config['width'],
        multY   = newSize[1] / window['cozyState'].config['height'],
        mult    = Math.min(multX, multY);

    if (window['cozyState'].config['integerUpscale'] && mult > 1) {
        mult = Math.floor(mult);
    }

    window['cozyState'].sizeMultiplier = mult;
    fixZoom();
}

export function setZoom(z:number):void {
    if (window['cozyState'].config['autoResize']) {
        throw new Error("Do not call setZoom if the game has autoResize turned on.");
    }
    window['cozyState'].sizeMultiplier = z;
    fixZoom();
}

export function getZoom() {
    return window['cozyState'].sizeMultiplier;
}

export function setTitle(title) {
    window['cozyState'].browserWindow.setTitle(title);
}

export function quit() {
    window['cozyState'].browserWindow.close();
}

export function loadTextures(assets) {
    return new Promise((resolve, reject) => {
        if (Object.keys(assets).length < 1) {
            resolve();
            return;
        }

        for (let name in assets) {
            PIXI.loader.add(name, assets[name].path);
        }

        PIXI.loader.load(function(loader, resources) {
            for (let key of Object.keys(resources)) {
                let resource = resources[key];
                window['cozyState'].textures[resource['name'].replace(/\\/g, "/")] = new Texture(resource['texture']);
            }
            window['cozyState'].textures = Object.assign(window['cozyState'].textures, window['cozyState'].textures);
            resolve();
        });
    });
}

export function getTexture(f) {
    return window['cozyState'].textures[f.replace(/\\/g, "/")];
}

export function addStyleSheet(file:File):void {
    let el = document.createElement('link');
    el.rel = "stylesheet";
    el.type = "text/css";
    el.href = file.url;
    document.head.appendChild(el);
}

export function captureScreenshot(width?:number, height?:number):Promise<any> {
    let winSize = window['cozyState'].browserWindow.getContentSize();
    let w = <number>Math.ceil(window['cozyState'].config['width'] * window['cozyState'].sizeMultiplier);
    let h = <number>Math.ceil(window['cozyState'].config['height'] * window['cozyState'].sizeMultiplier);
    let x = ((winSize[0] - w) / 2) | 0;
    let y = ((winSize[1] - h) / 2) | 0;

    let rect:Electron.Rectangle = {
        width: w,
        height: h,
        x: x,
        y: y
    };

    return new Promise((resolve, reject) => {
        window['cozyState'].browserWindow.capturePage(rect, (image) => {
            let opts = {
                quality: "best"
            };
            if (width !== undefined) opts['width'] = width;
            if (height !== undefined) opts['height'] = height;
            resolve(image.resize(opts));
        });
    });
}

export function saveImageToFile(image:any):File {
    var filename = `${(new Date()).toISOString().replace(/[-T:Z\.]/g,"")}.png`;
    var file = window['cozyState'].userDataDir.subdir('screenshots', true).file(filename);
    file.write(image.toPng(), 'binary');
    return file;
}

export function writeUserConfig(data:any) {
    let f = window['cozyState'].userDataDir.file('config.json');
    f.write(data, 'json');
}

export function getFullScreen():boolean {
    return window['cozyState'].browserWindow.isFullScreen();
}

export function setFullScreen(f:boolean):void {
    window['cozyState'].browserWindow.setFullScreen(f);
}

export function getDebug():boolean {
    return window['cozyState'].debug;
}

/**
Convert some HTML to use URLs appropriate for displaying. Since the engine considers the engine root directory
to be the root of the HTML document, any references to images, stylesheets, etc must be rewritten.
@param html     The html to fix.
**/

export function fixHTML(html:string):string {
    var el = document.createElement('div');
    el.innerHTML = html;

    var fixElements = [].concat(
        Array.prototype.slice.call(el.getElementsByTagName('link')),
        Array.prototype.slice.call(el.getElementsByTagName('img')),
        Array.prototype.slice.call(el.getElementsByTagName('a'))
    );

    for (let element of fixElements) {
        for (let attr of ['src','href']) {
            if (element.getAttribute(attr)) {
                if (element.getAttribute(attr).indexOf('data') === 0) return;
                element[attr] = window['cozyState'].gameDir.file(element.getAttribute(attr)).url;
            }
        }
    }

    return el.innerHTML;
}

/**
Utility function to calculate a number that "wraps around" within a certain range.
For example, wrap(8, 10) will give you 8, while wrap(12, 10) will give you 2.
@param n        The number to wrap.
@param range    The range of the wrapping.
**/
export function wrap(n:number, range:number) {
    while (n < 0) n += range;
    n %= range;
    return n;
}

let lastID = -1;
export function uniqueID() {
    return (++lastID).toString();
}

let uniqueStrings = {"":true};
let stringChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export function randomString(len:number):string {
    let s = "";
    while (uniqueStrings[s]) {
        for (let i = 0; i < len; i++) {
            s += stringChars[(Math.random() * stringChars.length) | 0];
        }
    }
    uniqueStrings[s] = true;
    return s;
}

export function after(n, resolution) {
    let count = n;
    return () => {
        count--;
        if (count <= 0) {
            resolution();
        }
    }
}

/**
Take an object, o, and apply a function f to each value in turn. Returns an
object with all the same keys as o, but the result of f for the value of that
key.
@param {object}    o        The input object
@param {function}  f        The function, receives (value, key)
@returns {object}           The new object
**/

export function mapO(o, f) {
    let output = {};
    for (let k in o) {
        output[k] = f(o[k], k);
    }
    return output;
}

/**
Given an array, shuffle the elements of that array in-place and return it.
This is a Fisher-Yates shuffle. https://en.wikipedia.org/wiki/Fisher-Yates_shuffle
@param {array}    a         The array to shuffle
@returns {array}            The array, now shuffled.
**/

export function shuffle(a) {
    let total = a.length;

    for (let pivot = 0; pivot < total; pivot++) {
        let select = (Math.random() * (total - pivot)) | 0;
        let tmp = a[pivot];
        a[pivot] = a[select];
        a[select] = tmp;
    }

    return a;
}

/**
Given a sorted array, a, insert a new element e, into it, in-place. If cmp is
supplied, use it to compare values.
@param {array}    a         The sorted array
@param {any}      e         The new element
@param {function} cmp       Compare function; receives (a,b) and should return negative if a < b, positive if a > b, and 0 if they're equal
**/

export function sortedInsert(a,e,cmp) {
    if (!cmp) cmp = (a,b) => { return a - b; };

    // short circuit some cases so we can assume that the insert is within the
    // array somewhere
    if (a.length < 1 || cmp(e, a[a.length - 1]) >= 0) {
        a.push(e);
        return;
    }
    if (cmp(e,a[0]) < 0) {
        a.unshift(e);
        return;
    }

    let wnd = [1, a.length - 1];

    while (true) {
        let i = (wnd[0] + (wnd[1] - wnd[0]) / 2) | 0;
        if (wnd[1] - wnd[0] === 0) {
            break;
        }

        let c = cmp(e, a[i]);

        if (c >= 0) {
            wnd[0] = i + 1;
        } else {
            wnd[1] = i;
        }
    }

    a.splice(wnd[0], 0, e);
}
