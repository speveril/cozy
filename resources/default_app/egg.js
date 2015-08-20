var fs = require('fs');
var remote = require('remote');

function Egg(argsArray) {
    console.log("Creating Egg Object");

    var args = {};
    for (var i in argsArray) {
        var chunks = argsArray[i].split('=');
        args[chunks[0]] = chunks[1];
    }

    this.debug = !!args.debug;
    this.keys = {};
    this.game = args.game;
}

Egg.prototype = {
    run: function() {
        process.chdir(this.game);
        this.gameDir = "../../" + this.game;
        this.browserWindow = remote.getCurrentWindow();

        // read/parse config
        try {
            this.config = JSON.parse(fs.readFileSync("config.json"));
        } catch(e) {
            alert("Couldn't load config.json in " + process.cwd());
            window.close();
        }

        this.config.width = this.config.width || 320;
        this.config.height = this.config.height || 240;

        // set up window
        this.browserWindow.setContentSize(this.config.width, this.config.height);
        this.browserWindow.center();
        this.browserWindow.setMinimumSize(this.config.width, this.config.height);

        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));

        // set up graphics
        PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
        this.renderer = new PIXI.autoDetectRenderer(this.config.width, this.config.height);
        this.renderer.backgroundColor = 0x888888;
        document.body.appendChild(this.renderer.view);
        this.stage = new PIXI.Container();

        // set up animation loop
        this.lastTime = Date.now();
        this.frame();

        // start the game
        this.Game = include("/main.js");
        this.Game.start();
    },

    frame: function() {
        requestAnimationFrame(this.frame.bind(this)); // do this here so if there's an error it doesn't stop everything forever

        var dt = Date.now() - this.lastTime;
        this.lastTime += dt;

        if (this.Game && this.Game.frame) {
            this.Game.frame(dt);
        }

        this.renderer.render(this.stage);
    },

    onKeyDown: function(event) {
        this.keys[event.keyCode] = true;
    },

    onKeyUp: function(event) {
        this.keys[event.keyCode] = false;

        // console.log(event.keyCode);

        // DEBUGGING KEYS
        if (this.debug && event.keyCode === 192) { // ~ key, opens console
            remote.getCurrentWindow().toggleDevTools();
        }
    },

    onResize: function(event) {
        var newSize = this.browserWindow.getContentSize(),
            multX   = newSize[0] / this.config.width,
            multY   = newSize[1] / this.config.height,
            mult    = Math.floor(Math.min(multX, multY));
        // console.log(newSize, multX, multY, mult, [this.config.width * mult, this.config.height * mult]);
        this.renderer.resolution = mult;
        // this.renderer.resize(this.config.width * mult, this.config.height * mult);
        this.renderer.resize(this.config.width, this.config.height);
        // console.log(this.renderer.view);
    },

    setTitle: function(title) {
        remote.getCurrentWindow().setTitle(title);
    },

    loadTexture: function(path) {
        return PIXI.Texture.fromImage(this.gameDir + "/" + path);
    },

    makeSprite: function(tex) {
        return new PIXI.Sprite(tex);
    },

    quit: function() {
        console.log("Quitting Egg");
        window.close();
    }
};

module.exports = Egg;
