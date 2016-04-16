/// <reference path="../lib/typescript/github-electron.d.ts"/>
/// <reference path="../lib/typescript/node.d.ts"/>
/// <reference path="../lib/typescript/pixi.js.d.ts"/>
/// <reference path="../lib/typescript/underscore.d.ts"/>
/// <reference path="../lib/typescript/es6-promise.d.ts"/>

/// <reference path="Audio.ts"/>
/// <reference path="File.ts"/>
/// <reference path="Layer.ts"/>
/// <reference path="Map.ts"/>
/// <reference path="Plane.ts"/>
/// <reference path="Sprite.ts"/>
/// <reference path="Texture.ts"/>
/// <reference path="UiComponent.ts"/>

var remote = require('remote');
declare var FontFace:any;

function include(path) {
    return require(process.cwd() + "/" + path);
}

/**
 * The main container for everything Egg.
 */
module Egg {
    enum ButtonState { UP, DOWN, IGNORED };

    export var Game: any;
    export var key: Object;
    export var debug: boolean;
    export var config: Object;
    export var textures: {}[];
    export var planes:Plane[];

    var gameName: string;
    var browserWindow: GitHubElectron.BrowserWindow;
    var buttonMap: Object;
    var __button: { [name:string]:ButtonState };
    var buttonTimeouts: { [name:string]:number };
    var paused: Boolean;
    var sizeMultiplier: Number;
    var lastTime: number;

    export function setup(opts:any) {
        console.log("Creating Egg Object");

        this.config = opts;
        this.debug = !!opts.debug;
        this.gameName = opts.game;
        this.browserWindow = remote.getCurrentWindow();

        this.key = {};
        this.__button = {};
        this.buttonMap = {};
        this.buttonTimeouts = {};
        this.textures = {};
        this.paused = true;
    }

    export function run() {
        var eggPath = path.join(process.cwd(), "engine", "resources", "runner"); // TODO this isn't necessarily true
        var gamePath = path.join(process.cwd(), this.gameName);

        process.chdir(gamePath);
        File.setPaths(eggPath, gamePath);

        this.config['buttons'] = this.config['buttons'] || {
            "left": [37],        // left arrow
            "up": [38],          // up arrow
            "right": [39],       // right arrow
            "down": [40],        // down arrow

            "confirm": [32,88],  // space, x
            "cancel": [18,90],   // alt, z
            "menu": [27]         // esc
        };

        _.each(this.config['buttons'], function(keys, button) {
            if (typeof keys === 'number') keys = [keys];
            _.each(keys, function(key) {
                if (!_.has(this.buttonMap, key)) this.buttonMap[key] = [];
                this.buttonMap[key].push(button);
            }.bind(this))
        }.bind(this));

        // set up window
        var multX = screen.availWidth / this.config['width'],
            multY = screen.availHeight/ this.config['height'],
            mult  = Math.floor(Math.min(multX, multY));
        this.browserWindow.setMinimumSize(this.config['width'], this.config['height']);
        this.browserWindow.setContentSize(this.config['width'] * mult, this.config['height'] * mult);
        this.browserWindow.center();

        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));

        // set up graphics
        PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
        planes = [];

        // set up audio
        Egg.Audio.init();
        if (Egg.config['volume']) {
            if (Egg.config['volume']['sfx'] !== undefined) {
                Audio.setSFXVolume(Egg.config['volume']['sfx']);
            }
            if (Egg.config['volume']['music'] !== undefined) {
                Audio.setMusicVolume(Egg.config['volume']['music']);
            }
        }

        var styles = [];
        _.each(this.config['css'], function(path:string) {
            Egg.addStyleSheet(path);
        });

        document['fonts'].ready
            .then(function() {
                // start the game
                this.Game = include("/main.js");
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

        if (this.paused) { return; }

        _.each(this.planes, function(plane) {
            plane.update(dt);
        }.bind(this));

        if (this.Game && this.Game.frame) {
            this.Game.frame(dt);
        }

        _.each(this.planes, function(plane) {
            plane.render();
        }.bind(this));

        if (this.Game && this.Game.postRender) {
            this.Game.postRender(dt);
        }
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

    export function onKeyDown(event) {
        var keyCode = event.keyCode;

        Egg.key[keyCode] = true;

        if (_.has(this.buttonMap, keyCode)) {
            _.each(this.buttonMap[keyCode], function(b) {
                if (this.__button[b] !== ButtonState.IGNORED) {
                    this.__button[b] = ButtonState.DOWN;
                }
            }.bind(this));
        }
    }

    export function onKeyUp(event) {
        var keyCode = event.keyCode;

        // console.log(keyCode);

        Egg.key[keyCode] = false;

        if (_.has(this.buttonMap, keyCode)) {
            _.each(this.buttonMap[keyCode], function(b) {
                this.__button[b] = ButtonState.UP;
                clearTimeout(this.buttonTimeouts[b]);
            }.bind(this));
        }

        // DEBUGGING KEYS
        if (this.debug && keyCode === 192) { // ~ key, opens console
            this.browserWindow.toggleDevTools();
        }
    }

    export function onResize(event?:any) {
        var newSize = this.browserWindow.getContentSize(),
            multX   = newSize[0] / this.config['width'],
            multY   = newSize[1] / this.config['height'],
            mult    = Math.floor(Math.min(multX, multY));
        this.sizeMultiplier = mult;

        _.each(this.planes, function(plane) {
            plane.resize(this.sizeMultiplier);
        }.bind(this));

        // force everything to update properly
        document.body.style.margin = "" + (newSize[1] - mult * this.config['height']) / 2 + "px " + (newSize[0] - mult * this.config['width']) / 2 + "px";
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
    }

    export function setTitle(title) {
        this.browserWindow.setTitle(title);
    }

    export function quit() {
        this.browserWindow.close();
    }

    export function button(name):Boolean {
        return (this.__button[name] === ButtonState.DOWN);
    }

    export function debounce(name, duration?:number) {
        this.__button[name] = ButtonState.IGNORED;
        if (duration !== undefined) {
            this.buttonTimeouts[name] = setTimeout(function() {
                this.__button[name] = ButtonState.DOWN;
            }.bind(this), duration * 1000);
        }
    }

    export function loadTextures(assets, onComplete) {
        if (assets.length < 1) {
            setTimeout(onComplete, 0);
        }

        _.each(assets, function(path, name) {
            PIXI.loader.add(name, File.projectFile(path));
        });

        PIXI.loader.load(function(loader, resources) {
            _.each(resources, function(resource) {
                this.textures[resource['name']] = new Texture(resource['texture']);
            }.bind(this));
            this.textures = _.extend(this.textures, textures);
            onComplete();
        }.bind(this));
    }

    export function addStyleSheet(path:string):void {
        var el = document.createElement('link');
        el.rel = "stylesheet";
        el.type = "text/css";
        el.href = File.urlPath(path);
        document.head.appendChild(el);
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
}
