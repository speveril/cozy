///<reference path="rpg/RPGKit.ts"/>

///<reference path="Map.ts"/>
///<reference path="Menus.ts"/>

///<reference path="characters/Hero.ts"/>

///<reference path="../map/town.ts"/>
///<reference path="../map/forest.ts"/>
///<reference path="../map/overworld.ts"/>

window['RPG'] = RPG;

module SimpleQuest {
    export var sfx:{ [name:string]: Egg.Sound } = {};
    export var music:{ [name:string]: Egg.Music } = {};

    export function start() {
        Map.persistent['global'] = {};

        sfx = {
            'start': new Egg.Sound("audio/sfx/start.wav"),
            'hit': new Egg.Sound("audio/sfx/smash.wav"),
            'menu_blip': new Egg.Sound("audio/sfx/menu_blip.ogg"),
            'restore': new Egg.Sound("audio/sfx/healthrestore.ogg"),
            'thud': new Egg.Sound("audio/sfx/thud.wav"),
            'chnk': new Egg.Sound("audio/sfx/chnk.ogg")
        };
        music = {
            'village':    new Egg.Music({ tracks: ["audio/music/village.ogg"] }),
            'overworld':  new Egg.Music({ tracks: ["audio/music/oworld.ogg"] }),
            'forest':     new Egg.Music({ tracks: ["audio/music/forest.ogg"] })
        };

        RPG.mainMenuClass = Menu_Main;
        RPG.loadSkip = ["./src_image"];
        RPG.Menu.blip = sfx['menu_blip'];
        RPG.Battle.setMonsters({
            skellington: { name: "Skellington", maxhp: 5, attack: 6, defense: 2, critical: 3, evade: 0, xp: 20,
                image: 'ui/battle/monster_skellington.png',
                treasure: function() { return { money:(3 + Math.random() * 4) | 0 }; }
            },
            blueslime: { name: "Blue Slime", maxhp: 7, attack: 3, defense: 4, critical: 1, evade: 3, xp: 15,
                image: 'ui/battle/monster_blueslime.png',
                treasure: function() { return { money:(1 + Math.random() * 3) | 0 }; }
            },
            stabber: { name: "Stabber", maxhp: 10, attack: 3, defense: 3, critical: 10, evade: 10, xp: 35,
                image: 'ui/battle/monster_stabber.png',
                treasure: function() { return { money:(5 + Math.random() * 5) | 0 }; }
            }
        });

        RPG.start(function() {
            var promises = [];
            _.each(sfx, function(s) { promises.push(s.loaded()); })
            _.each(music, function(m) { promises.push(m.loaded()); })

            Promise.all(promises)
                .then(function() {
                    Egg.unpause();
                    // SimpleQuest.bootSequence();
                    SimpleQuest.newGame();
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

        RPG.characters['hero'] = new Characters.Hero();
        RPG.Party.add(RPG.characters['hero']);
        RPG.player = RPG.Party.members[0].makeEntity();

        music['village'].start();
        RPG.startMap(new Map_Town(), 10, 7);
        // music['forest'].start();
        // RPG.startMap(new Map_Forest(), 7, 43);

        RPG.controls = RPG.ControlMode.Map;
        Egg.unpause();
    }

    export var frame = RPG.frame;
}

module.exports = SimpleQuest;
