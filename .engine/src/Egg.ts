/// <reference path="typescript/github-electron.d.ts"/>
/// <reference path="typescript/node.d.ts"/>
/// <reference path="typescript/pixi.js.d.ts"/>
/// <reference path="typescript/underscore.d.ts"/>

/// <reference path="Audio.ts"/>
/// <reference path="File.ts"/>
/// <reference path="Input.ts"/>
/// <reference path="Layer.ts"/>
/// <reference path="Map.ts"/>
/// <reference path="Plane.ts"/>
/// <reference path="Sprite.ts"/>
/// <reference path="Texture.ts"/>
/// <reference path="UiComponent.ts"/>

var Electron = require('electron');
declare var FontFace:any;

function include(path) {
    return require(process.cwd() + "/" + path);
}

/**
 * The main container for everything Egg.
 */
module Egg {
    export var Game: any;
    export var debug: boolean;
    export var config: Object;
    export var textures: {}[];
    export var planes:Plane[];
    export var browserWindow: GitHubElectron.BrowserWindow;

    var gameName: string;
    var paused: Boolean;
    var sizeMultiplier: Number;
    var lastTime: number;

    export function setup(opts:any) {
        console.log("Creating Egg Object");

        this.config = opts;
        this.debug = !!opts.debug;
        this.gameName = opts.game;
        this.browserWindow = Electron.remote.getCurrentWindow();
        this.browserWindow.toggleDevTools();

        this.textures = {};
        this.paused = true;
    }

    export function run() {
        var eggPath = path.join(process.cwd(), ".engine", "resources", "runner"); // TODO this isn't necessarily true
        var gamePath = path.join(process.cwd(), this.gameName);

        process.chdir(gamePath);
        File.setPaths(eggPath, gamePath);
        Egg.Input.init(this.config['buttons']);

        // set up window
        var multX = screen.availWidth / this.config['width'],
            multY = screen.availHeight/ this.config['height'],
            mult  = Math.floor(Math.min(multX, multY));
        this.browserWindow.setMinimumSize(this.config['width'], this.config['height']);
        this.browserWindow.setContentSize(this.config['width'] * mult, this.config['height'] * mult);
        this.browserWindow.center();

        window.addEventListener('keydown', (e) => Input.onKeyDown(e));
        window.addEventListener('keyup', (e) => Input.onKeyUp(e));
        window.addEventListener('resize', (e) => this.onResize(e));

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

    export function loadTextures(assets) {
        return new Promise((resolve, reject) => {
            if (assets.length < 1) {
                resolve();
            }

            _.each(assets, function(path, name) {
                PIXI.loader.add(name, File.projectFile(path));
            });

            PIXI.loader.load((loader, resources) => {
                _.each(resources, (resource) => {
                    this.textures[resource['name']] = new Texture(resource['texture']);
                });
                this.textures = _.extend(this.textures, textures);
                resolve();
            });
        });
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
