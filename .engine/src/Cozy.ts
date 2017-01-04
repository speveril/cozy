/// <reference path="typescript/github-electron.d.ts"/>
/// <reference path="typescript/node.d.ts"/>
/// <reference path="typescript/pixi.js.d.ts"/>
/// <reference path="typescript/underscore.d.ts"/>

/// <reference path="Audio.ts"/>
/// <reference path="Entity.ts"/>
/// <reference path="File.ts"/>
/// <reference path="Input.ts"/>
/// <reference path="Layer.ts"/>
/// <reference path="Map.ts"/>
/// <reference path="Plane.ts"/>
/// <reference path="Sprite.ts"/>
/// <reference path="Texture.ts"/>
/// <reference path="UiComponent.ts"/>

/// <reference path="Trig.ts"/>

var Electron = require('electron');
declare var FontFace:any;

type Dict<T> = { [key:string]: T }

/**
 * The main container for everything Cozy.
 */
module Cozy {
    export var Game:any;
    export var debug:boolean;
    export var config:Object;
    export var textures:{}[];
    export var planes:Plane[];
    export var browserWindow:GitHubElectron.BrowserWindow;
    export var scene:Entity;
    export var gameName:string; // TODO unnecessary?
    export var engineDir:Cozy.Directory;
    export var gameDir:Cozy.Directory;
    export var userdataDir:Cozy.Directory;

    var enginePath:string;
    var paused:Boolean;
    var sizeMultiplier:Number;
    var lastTime: number;

    export function setup(opts:any) {
        console.log("Creating Cozy Object...", opts);

        this.config = opts;
        this.debug = !!opts.debug;
        this.gameName = opts.game;
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
        //    http://stackoverflow.com/a/26227660
        //    https://developer.apple.com/library/content/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html
        var userdataStem = process.env.APPDATA + '\\' || (process.platform == 'darwin' ? process.env.HOME + 'Library/Application Support/' : process.env.HOME + "/.");

        this.engineDir = new Cozy.Directory(path.join(process.cwd(), opts.enginePath, "resources", "app"));
        this.gameDir = new Cozy.Directory(path.join(process.cwd(), this.gameName));

        if (!this.config.userdata) {
            this.config.userdata = this.gameName;
            console.warn("No 'userdata' key found in config. This will be a problem when you export -- be sure to set it to something.");
        }
        this.userdataDir = new Cozy.Directory(userdataStem).subdir(this.config.userdata, true);

        this.textures = {};
        this.paused = true;
    }

    export function run() {
        process.chdir(this.gameDir.path);
        Cozy.Input.init(this.config['controls']);

        // set up window
        var multX = screen.availWidth / this.config['width'],
            multY = screen.availHeight/ this.config['height'],
            mult  = Math.floor(Math.min(multX, multY));
        this.browserWindow.setMinimumSize(this.config['width'], this.config['height']);
        this.browserWindow.setContentSize(this.config['width'] * mult, this.config['height'] * mult);
        this.browserWindow.center();

        window.addEventListener('resize', (e) => this.onResize(e));

        // debugging
        if (this.debug) { // ~ key, opens console
            window.addEventListener('onkeydown', (e) => {
                if (e['keyCode'] === 192) {
                    Cozy.browserWindow['toggleDevTools']();
                }
            });
        }

        // set up graphics
        PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
        planes = [];

        // set up audio
        Cozy.Audio.init();
        if (Cozy.config['volume']) {
            if (Cozy.config['volume']['sfx'] !== undefined) {
                Audio.setSFXVolume(Cozy.config['volume']['sfx']);
            }
            if (Cozy.config['volume']['music'] !== undefined) {
                Audio.setMusicVolume(Cozy.config['volume']['music']);
            }
        }

        var styles = [];
        if (typeof this.config['css'] === 'string') this.config['css'] = [this.config['css']];
        _.each(this.config['css'], (path:string) => {
            _.each(this.gameDir.glob(path), (f:File) => {
                Cozy.addStyleSheet(f);
            })
        });

        document['fonts'].ready
            .then(function() {
                // start the game
                this.Game = require(this.gameDir.file("main.js").path);
                this.Game.start();

                this.onResize();

                // set up animation loop
                this.lastTime = Date.now();
                this.frame();
            }.bind(this));
    }

    export function frame() {
        requestAnimationFrame(this.frame.bind(this)); // do this here so if there's an error it doesn't stop everything forever

        var dt = Date.now() - this.lastTime;
        this.lastTime += dt;
        dt /= 1000;

        Input.update(dt);
        Audio.update(dt);

        if (this.paused) { return; }

        _.each(this.planes, function(plane) {
            plane.update(dt);
        }.bind(this));

        if (this.scene) {
            this.scene.update(dt);
        }
        if (this.Game && this.Game.frame) {
            this.Game.frame(dt);
        }

        _.each(this.planes, function(plane) {
            plane.render();
        }.bind(this));
        if (this.scene) {
            this.scene.render();
        }

        if (this.Game && this.Game.postRender) {
            this.Game.postRender(dt);
        }
    }

    export function setScene(e:Entity) {
        this.scene = e;
    }

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

        _.each(this.planes, function(plane) {
            plane.resize(this.sizeMultiplier);
        }.bind(this));

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

            _.each(assets, (file:File, name:string) => {
                PIXI.loader.add(name, file.path);
            });

            PIXI.loader.load((loader, resources) => {
                _.each(resources, (resource) => {
                    this.textures[resource['name'].replace(/\\/g, "/")] = new Texture(resource['texture']);
                });
                this.textures = _.extend(this.textures, textures);
                resolve();
            });
        });
    }

    export function getTexture(f) {
        return Cozy.textures[f.replace(/\\/g, "/")];
    }

    export function addStyleSheet(file:File):void {
        var el = document.createElement('link');
        el.rel = "stylesheet";
        el.type = "text/css";
        el.href = file.url;
        document.head.appendChild(el);
    }

    export function captureScreenshot(width?:number, height?:number):Promise<any> {
        return new Promise((resolve, reject) => {
            this.browserWindow.capturePage((image) => {
                var opts = {
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
        var file = Cozy.userdataDir.subdir('screenshots', true).file(filename);
        file.write(image.toPng(), 'binary');
        return file;
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

        _.each(fixElements, (element) => {
            _.each(['src','href'], (attr) => {
                if (element.getAttribute(attr)) {
                    if (element.getAttribute(attr).indexOf('data') === 0) return;
                    element[attr] = this.gameDir.file(element.getAttribute(attr)).url;
                }
            });
        });

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
}
