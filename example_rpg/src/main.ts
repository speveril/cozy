///<reference path="../../resources/default_app/Egg.d.ts" />
///<reference path="rpg/RPGKit.ts"/>
///<reference path="Map.ts"/>
///<reference path="../map/town.ts"/>
///<reference path="../map/forest.ts"/>
///<reference path="../map/overworld.ts"/>


window['RPG'] = RPG;

module SimpleQuest {
    export function start() {
        Map.persistent['global'] = {};

        RPG.loadSkip = ["./src_image"];
        RPG.start(function() {
            RPG.player = new RPG.Entity({
                sprite: "sprites/sersha.sprite",
                speed: 64,
                triggersEvents: true,
                respectsObstructions: true
            });

            // RPG.startMap(new Map("map/town.tmx"), 10, 7);
            RPG.startMap(new Map_Town(), 10, 7);
            RPG.controls = RPG.ControlMode.Map;
            Egg.unpause();
        });
    }

    export var frame = RPG.frame;
}

module.exports = SimpleQuest;
