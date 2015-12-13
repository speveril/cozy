///<reference path="../../egg/resources/default_app/Egg.d.ts" />
///<reference path="rpg/RPGKit.ts"/>

///<reference path="Map.ts"/>
///<reference path="Menus.ts"/>

///<reference path="../map/town.ts"/>
///<reference path="../map/forest.ts"/>
///<reference path="../map/overworld.ts"/>

window['RPG'] = RPG;

module SimpleQuest {
    export var sfx:{ [name:string]: Egg.Sound } = {};
    export var music:{ [name:string]: Egg.Music } = {};

    export function start() {
        Map.persistent['global'] = {};

        sfx['hit'] = new Egg.Sound("audio/sfx/hit.wav");
        music['village'] = new Egg.Music({
            tracks: ["audio/music/village.ogg"]
        });
        music['overworld'] = new Egg.Music({
            tracks: ["audio/music/oworld.ogg"]
        });
        music['forest'] = new Egg.Music({
            tracks: ["audio/music/forest.ogg"]
        });

        RPG.mainMenuClass = Menu_Main;
        RPG.loadSkip = ["./src_image"];

        Egg.addStyleSheet("ui/menu.css");

        RPG.start(function() {
            var promises = [];
            _.each(sfx, function(s) { promises.push(s.loaded()); })
            _.each(music, function(m) { promises.push(m.loaded()); })
            console.log("promises", promises);

            Promise.all(promises)
                .then(function() {
                    Egg.unpause();
                    SimpleQuest.bootSequence();
                }.bind(this));
        });
    }

    export function bootSequence() {
        RPG.controls = RPG.ControlMode.Scene;
        RPG.Menu.push(new Menu_Boot());
        Egg.unpause();
    }

    export function newGame() {
        Egg.pause();

        //RPG.characters.push(new RPG.Character());

        RPG.player = new RPG.Entity({
            sprite: "sprites/hero.sprite",
            speed: 64,
            triggersEvents: true,
            respectsObstructions: true
        });

        // music['village'].start();
        // RPG.startMap(new Map_Town(), 10, 7);

        music['forest'].start();
        RPG.startMap(new Map_Forest(), 7, 43);
        RPG.controls = RPG.ControlMode.Map;
        Egg.unpause();
    }

    export var frame = RPG.frame;
}

module.exports = SimpleQuest;
