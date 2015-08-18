var fs = require('fs');
var remote = require('remote');

function Egg(args) {
    console.log("Creating Egg Object");

    this.debug = !!args.debug;
    this.keys = {};
    this.game = args.game;
}

Egg.prototype = {
    run: function() {
        process.chdir(this.game);

        try {
            this.config = JSON.parse(fs.readFileSync("config.json"));
        } catch(e) {
            alert("Couldn't load config.json in " + process.cwd());
            window.close();
        }

        this.config.width = this.config.width || 640;
        this.config.height = this.config.height || 480;

        window.resizeTo(this.config.width, this.config.height);
        window.moveTo(screen.width / 2 - this.config.width / 2, screen.height / 2 - this.config.height / 2);

        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));

        this.lastTime = Date.now();
        this.frame();

        this.Game = include("/main.js");
        this.Game.start();
    },

    frame: function() {
        requestAnimationFrame(this.frame.bind(this)); // do this here so if there's an error it doesn't stop everything forever

        var dt = Date.now() - this.lastTime;
        this.lastTime += dt;

        // TODO do actual frame stuff
    },

    onKeyDown: function(event) {
        this.keys[event.keyCode] = true;
    },

    onKeyUp: function(event) {
        this.keys[event.keyCode] = false;

        // DEBUGGING KEYS
        if (this.debug && event.keyCode === 192) {
            remote.getCurrentWindow().toggleDevTools();
        }
    },

    setTitle: function(title) {
        remote.getCurrentWindow().setTitle(title);
    },

    quit: function() {
        console.log("Quitting Egg");
        window.close();
    }
};

module.exports = Egg;
