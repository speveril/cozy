/// <reference path="../lib/typescript/github-electron.d.ts" />
/// <reference path="../lib/typescript/node.d.ts" />
/// <reference path="../lib/typescript/pixi.js.d.ts" />
/// <reference path="../lib/typescript/underscore.d.ts" />

// TODO encapsulate these a bit better
/// <reference path="Map.ts" />
/// <reference path="Sprite.ts" />
/// <reference path="Texture.ts" />

var fs = require('fs');
var remote = require('remote');

function include(path) {
    return require(process.cwd() + "/" + path);
}

module Egg {
    export var browserWindow: GitHubElectron.BrowserWindow;

    export var debug: boolean;
    export var key: Object;
    export var button: Object;
    export var buttonMap: Object;

    // wtf, seriously
    export var game: string;
    export var Game: any;
    export var config: Object;
    export var gameDir: string;
    export var lastTime: number;

    export var renderer:PIXI.WebGLRenderer;
    export var stage: PIXI.Container;

    export function setup(opts:any) {
        console.log("Creating Egg Object");

        this.debug = !!opts.debug;
        this.game = opts.game;
        this.browserWindow = remote.getCurrentWindow();

        this.key = {};
        this.button = {};
        this.buttonMap = {};
    }

    export function run() {
        process.chdir(this.game);
        this.gameDir = "../../" + this.game;

        // read/parse config
        try {
            this.config = JSON.parse(fs.readFileSync("config.json"));
        } catch(e) {
            alert("Couldn't load config.json in " + process.cwd());
            window.close();
        }

        this.config['width'] = this.config['width'] || 320;
        this.config['height'] = this.config['height'] || 240;
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
        console.log(this.config['buttons'], this.buttonMap);

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
        this.stage = new PIXI.Container();
        this.onResize();

        // set up animation loop
        this.lastTime = Date.now();
        this.frame();

        // start the game
        this.Game = include("/main.js");
        this.Game.start();
    }

    export function frame() {
        requestAnimationFrame(this.frame.bind(this)); // do this here so if there's an error it doesn't stop everything forever

        var dt = Date.now() - this.lastTime;
        this.lastTime += dt;

        if (this.Game && this.Game.frame) {
            this.Game.frame(dt / 1000);
        }

        this.renderer.render(this.stage);
    }

    export function onKeyDown(event) {
        var keyCode = event.keyCode;

        this.key[keyCode] = true;

        if (_.has(this.buttonMap, keyCode)) {
            _.each(this.buttonMap[keyCode], function(b) {
                this.button[b] = true;
            }.bind(this));
        }
    }

    export function onKeyUp(event) {
        var keyCode = event.keyCode;

        // console.log(keyCode);

        this.key[keyCode] = false;

        if (_.has(this.buttonMap, keyCode)) {
            _.each(this.buttonMap[keyCode], function(b) {
                this.button[b] = false;
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
}
