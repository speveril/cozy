import * as PIXI from 'pixi.js';
import * as Electron from 'electron';
import * as path from 'path';

import { Audio, Sound, Music } from './Audio';
import { File, Directory } from "./File";
import { Input } from "./Input";
import { Plane } from './Plane';
import { Texture } from "./Texture";

declare var FontFace:any;

// The kitchen sink

export var Game:any;
export var debug:boolean;
export var config:Object;
export var textures:{}[];
export var planes:Plane[];
export var browserWindow:Electron.BrowserWindow;
// export var scene:Entity;
export var gamePath:string;
export var gameDir:Directory;
export var engineDir:Directory;
export var userdataDir:Directory;

var enginePath:string;
var paused:Boolean;
var sizeMultiplier:Number;
var lastTime: number;

export function setup(opts:any, overrides?:any) {
    console.log("Creating Cozy Object...", opts);

    this.config = opts;
    this.debug = true; //!!opts.debug;
    this.gamePath = opts.game;
    this.browserWindow = Electron.remote.getCurrentWindow();

    if (this.debug) {
        this.browserWindow.webContents.once('devtools-opened', () => {
            this.browserWindow.focus();
        });
        this.browserWindow.openDevTools({
            mode: 'detach'
        });
    }

    // see
    //  http://stackoverflow.com/a/26227660
    //  https://developer.apple.com/library/content/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html
    var userdataStem = process.env.APPDATA + '\\' || (process.platform == 'darwin' ? process.env.HOME + 'Library/Application Support/' : process.env.HOME + "/.");

    this.engineDir = new Directory(path.join(process.cwd(), opts.enginePath, "resources", "app"));
    this.gameDir = new Directory(this.gamePath);

    if (!this.config.userdata) {
        let p = this.gamePath.split(path.sep);
        this.config.userdata = p[p.length - 1];
        console.warn("No 'userdata' key found in config. This will be a problem when you export -- be sure to set it to something.");
    }
    this.userdataDir = new Directory(userdataStem).subdir(this.config.userdata, true);

    let userconfig = this.userdataDir.file('config.json');
    if (userconfig.exists) {
        let data = JSON.parse(userconfig.read());
        this.config = Object.assign(this.config, data);
    }

    if (overrides) {
        this.config = Object.assign(this.config, overrides);
    }

    this.textures = {};
    this.paused = true;

    process.chdir(this.gameDir.path);
    Input.init(this.config['controls']);

    // set up window
    var multX = screen.availWidth / this.config['width'],
        multY = screen.availHeight/ this.config['height'],
        mult  = Math.floor(Math.min(multX, multY));
    this.browserWindow.setMinimumSize(this.config['width'], this.config['height']);
    this.browserWindow.setContentSize(this.config['width'] * mult, this.config['height'] * mult);
    this.browserWindow.center();

    window.addEventListener('resize', (e) => this.onResize(e));
    window.addEventListener('blur', (e) => {
        if (this.getFullScreen()) {
            browserWindow.minimize();
        }
    });
    window.addEventListener('focus', (e) => {
        Input.clear();
    });

    if (this.config.fullscreen) {
        this.setFullScreen(true);
    }

    // debugging
    if (this.debug) { // ~ key, opens console
        window.addEventListener('onkeydown', (e) => {
            if (e['keyCode'] === 192) {
                browserWindow['toggleDevTools']();
            }
        });
    }

    // set up graphics
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    planes = [];

    // set up audio
    Audio.init({
        NOSFX:      this.config['NOSFX'],
        NOMUSIC:    this.config['NOMUSIC']
    });
    if (this.config['volume']) {
        if (this.config['volume']['sfx'] !== undefined) {
            Audio.setSFXVolume(this.config['volume']['sfx']);
        }
        if (this.config['volume']['music'] !== undefined) {
            Audio.setMusicVolume(this.config['volume']['music']);
        }
    }

    if (typeof this.config['css'] === 'string') this.config['css'] = [this.config['css']];
    for (let path of this.config['css']) {
        for (let f of this.gameDir.glob(path)) {
            console.log("stylesheet:", this.gameDir.path, path, f);
            addStyleSheet(f);
        }
    };

    return document['fonts'].ready;
}

export function run(g) {
    this.Game = g;
    this.Game.start();

    this.onResize();

    // set up animation loop
    this.lastTime = Date.now();
    this.frame();
}

export function frame() {
    requestAnimationFrame(this.frame.bind(this)); // do this here so if there's an error it doesn't stop everything forever

    var dt = Date.now() - this.lastTime;
    this.lastTime += dt;
    dt /= 1000;

    Input.update(dt);
    Audio.update(dt);

    if (this.paused) { return; }

    for (let plane of this.planes) plane.update(dt);

    if (this.scene) {
        this.scene.update(dt);
    }
    if (this.Game && this.Game.frame) {
        this.Game.frame(dt);
    }

    for (let plane of this.planes) plane.render(dt);

    if (this.scene) {
        this.scene.render();
    }

    if (this.Game && this.Game.postRender) {
        this.Game.postRender(dt);
    }
}

// export function setScene(e:Entity) {
//     this.scene = e;
// }

export function addPlane(Type:any, args?:any):Plane {
    if (!(Type.prototype instanceof Plane)) {
        throw new TypeError("Type passed to addPlane() must inherit from Plane.");
    }

    var plane = new Type(args || {});
    this.planes.push(plane);
    plane.resize(this.sizeMultiplier);

    return plane;
}

export function pause() {
    this.paused = true;
}

export function unpause() {
    this.paused = false;
}

export function onResize(event?:any) {
    var newSize = this.browserWindow.getContentSize(),
        multX   = newSize[0] / this.config['width'],
        multY   = newSize[1] / this.config['height'],
        mult    = Math.min(multX, multY);

    if (mult > 1) {
        mult = Math.floor(mult);
    }

    this.sizeMultiplier = mult;

    for (let plane of this.planes) plane.resize(this.sizeMultiplier);

    // force everything to update properly
    document.body.style.margin = "" + Math.floor((newSize[1] - mult * this.config['height']) / 2) + "px " + Math.floor((newSize[0] - mult * this.config['width']) / 2) + "px";
    document.body.style.display = 'none';
    document.body.offsetHeight;
    document.body.style.display = '';
}

export function getCurrentZoom() {
    return this.sizeMultiplier;
}

export function setTitle(title) {
    this.browserWindow.setTitle(title);
}

export function quit() {
    this.browserWindow.close();
}

export function loadTextures(assets) {
    return new Promise((resolve, reject) => {
        if (assets.length < 1) {
            resolve();
        }

        for (let name in assets) {
            PIXI.loader.add(name, assets[name].path);
        }

        PIXI.loader.load((loader, resources) => {
            for (let resource of resources) {
                this.textures[resource['name'].replace(/\\/g, "/")] = new Texture(resource['texture']);
            }
            this.textures = Object.assign(this.textures, textures);
            resolve();
        });
    });
}

export function getTexture(f) {
    return this.textures[f.replace(/\\/g, "/")];
}

export function addStyleSheet(file:File):void {
    let el = document.createElement('link');
    el.rel = "stylesheet";
    el.type = "text/css";
    el.href = file.url;
    document.head.appendChild(el);
}

export function captureScreenshot(width?:number, height?:number):Promise<any> {
    let winSize = this.browserWindow.getContentSize();
    let w = Math.ceil(this.config['width'] * this.sizeMultiplier);
    let h = Math.ceil(this.config['height'] * this.sizeMultiplier);
    let x = ((winSize[0] - w) / 2) | 0;
    let y = ((winSize[1] - h) / 2) | 0;

    let rect:Electron.Rectangle = {
        width: w,
        height: h,
        x: x,
        y: y
    };

    return new Promise((resolve, reject) => {
        this.browserWindow.capturePage(rect, (image) => {
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
    var file = this.userdataDir.subdir('screenshots', true).file(filename);
    file.write(image.toPng(), 'binary');
    return file;
}

export function writeUserConfig(data:any) {
    let f = this.userdataDir.file('config.json');
    f.write(data, 'json');
}

export function getFullScreen():boolean {
    return this.browserWindow.isFullScreen();
}

export function setFullScreen(f:boolean):void {
    this.browserWindow.setFullScreen(f);
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
                element[attr] = this.gameDir.file(element.getAttribute(attr)).url;
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
        if (count === 0) {
            resolution();
        }
    }
}

/**
Utility function to take an object, o, and apply a function f to each value in
turn. Returns an object with all the same keys as o, but the result of f for
the value of that key.
@param o        The object
@param f        The function, receives (value, key)
**/

export function mapO(o, f) {
    let output = {};
    for (let k in o) {
        output[k] = f(o, k);
    }
    return output;
}
