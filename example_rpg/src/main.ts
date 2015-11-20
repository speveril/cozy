///<reference path="../../resources/default_app/Egg.d.ts" />
///<reference path="rpg/RPGKit.ts"/>
///<reference path="Map.ts"/>

module SimpleQuest {
    export function start() {
        RPG.loadSkip = ["./src_image"];
        RPG.start(function() {
            RPG.player = new RPG.Entity({
                sprite: "sprites/sersha.sprite",
                speed: 64,
                triggersEvents: true,
                respectsObstructions: true
            });

            RPG.startMap(new Map("map/town.tmx"), 10, 7);

            Egg.unpause();
        });
    }

    export var frame = RPG.frame;
}

module.exports = SimpleQuest;
