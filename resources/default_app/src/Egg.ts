/// <reference path="../lib/typescript/github-electron.d.ts"/>
/// <reference path="../lib/typescript/node.d.ts"/>
/// <reference path="../lib/typescript/pixi.js.d.ts"/>
/// <reference path="../lib/typescript/underscore.d.ts"/>
/// <reference path="../lib/typescript/es6-promise.d.ts"/>

/// <reference path="File.ts"/>
/// <reference path="Layer.ts"/>
/// <reference path="Map.ts"/>
/// <reference path="Sprite.ts"/>
/// <reference path="Texture.ts"/>

var fs = require('fs');
var remote = require('remote');
require('es6-promise').polyfill();

function include(path) {
    return require(process.cwd() + "/" + path);
}

module Egg {
    enum ButtonState { UP, DOWN, IGNORED };

    export var browserWindow: GitHubElectron.BrowserWindow;

    export var debug: boolean;
    export var key: Object;
    var buttonMap: Object;
    var __button: { [name:string]:ButtonState };
    var paused: Boolean;

    // wtf, seriously
    export var game: string;
    export var Game: any;
    export var gameDir: string;

    export var config: Object;
    export var lastTime: number;
    export var textures: {}[];
    export var layerStack: Array<Layer>;
    export var layerContainer: PIXI.Container;

    export var renderer:PIXI.WebGLRenderer;

    export function setup(opts:any) {
        console.log("Creating Egg Object");

        this.config = opts;
        this.debug = !!opts.debug;
        this.game = opts.game;
        this.browserWindow = remote.getCurrentWindow();

        this.key = {};
        this.__button = {};
        this.buttonMap = {};
        this.textures = {};
        this.paused = true;

        this.layerStack = [];
        this.layerContainer = new PIXI.Container();
    }

    export function run() {
        process.chdir(this.game);
        this.gameDir = process.cwd();

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
        this.renderer = new PIXI.WebGLRenderer(this.config['width'], this.config['height']);
        this.renderer.backgroundColor = 0x888888;
        document.body.appendChild(this.renderer.view);
        this.onResize();

        // start the game
        this.Game = include("/main.js");
        this.Game.start();

        // set up animation loop
        this.lastTime = Date.now();
        this.frame();
    }

    export function frame() {
        requestAnimationFrame(this.frame.bind(this)); // do this here so if there's an error it doesn't stop everything forever

        var dt = Date.now() - this.lastTime;
        this.lastTime += dt;

        if (this.paused) { return; }

        _.each(this.layerStack, function(layer) {
            layer.update(dt / 1000);
        }.bind(this));

        if (this.Game && this.Game.frame) {
            this.Game.frame(dt / 1000);
        }

        _.each(this.layerStack, function(layer) {
            this.renderer.render(layerContainer);
        }.bind(this));

        if (this.Game && this.Game.postRender) {
            this.Game.postRender(dt / 1000);
        }
    }

    export function pause() {
        this.paused = true;
    }

    export function unpause() {
        this.paused = false;
    }

    export function onKeyDown(event) {
        var keyCode = event.keyCode;

        this.key[keyCode] = true;

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

        this.key[keyCode] = false;

        if (_.has(this.buttonMap, keyCode)) {
            _.each(this.buttonMap[keyCode], function(b) {
                this.__button[b] = ButtonState.UP;
            }.bind(this));
        }

        // DEBUGGING KEYS
        if (this.debug && keyCode === 192) { // ~ key, opens console
            this.browserWindow.toggleDevTools();
        }
    }

    export function onResize(event?) {
        var newSize = this.browserWindow.getContentSize(),
            multX   = newSize[0] / this.config['width'],
            multY   = newSize[1] / this.config['height'],
            mult    = Math.floor(Math.min(multX, multY));
        this.renderer.resolution = mult;
        this.renderer.resize(this.config['width'], this.config['height']);
    }

    export function setTitle(title) {
        this.browserWindow.setTitle(title);
    }

    export function setBackground(color) {
        this.renderer.backgroundColor = color;
    }

    export function quit() {
        this.browserWindow.close();
    }

    export function projectFilePath(fname) {
        return gameDir + "/" + fname;
    }

    export function addLayer(index?:number) {
        var lyr = new Layer();
        if (index === undefined) {
            layerStack.push(lyr);
        } else {
            layerStack.splice(index, 0, lyr);
        }
        layerContainer.addChild(lyr.innerContainer);
        return lyr;
    }

    export function clearLayers() {
        layerStack = [];
        layerContainer.removeChildren();
    }

    export function button(name):Boolean {
        return (this.__button[name] === ButtonState.DOWN);
    }

    export function debounce(name) {
        this.__button[name] = ButtonState.IGNORED;
    }

    export function loadTextures(assets, onComplete) {
        if (assets.length < 1) {
            setTimeout(onComplete, 0);
        }

        _.each(assets, function(path, name) {
            PIXI.loader.add(name, Egg.projectFilePath(path));
        })

        PIXI.loader.load(function(loader, resources) {
            _.each(resources, function(resource) {
                this.textures[resource['name']] = new Texture(resource['texture']);
            }.bind(this));
            this.textures = _.extend(this.textures, textures);
            onComplete();
        }.bind(this));
    }
}
