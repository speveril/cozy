///<reference path="rpg/RPGKit.ts"/>

///<reference path="Map.ts"/>
///<reference path="menus/all.ts"/>

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
            'hit': new Egg.Sound("audio/sfx/smash.wav"),
            'restore': new Egg.Sound("audio/sfx/Healing Full.wav"),
            'thud': new Egg.Sound("audio/sfx/thud.wav"),
            'chnk': new Egg.Sound("audio/sfx/chnk.ogg"),

            'menu_move': new Egg.Sound('audio/sfx/MENU_Pick.wav'),
            'menu_choose': new Egg.Sound('audio/sfx/MENU B_Select.wav'),
            'menu_bad': new Egg.Sound('audio/sfx/MENU B_Back.wav'),
            'menu_newgame': new Egg.Sound('audio/sfx/MENU A_Select.wav'),
        };
        music = {
            'village':    new Egg.Music({ tracks: ["audio/music/1-01 Town of Wishes.ogg"] }),
            'overworld':  new Egg.Music({ tracks: ["audio/music/Death Is Just Another Path.ogg"] }),
            'forest':     new Egg.Music({ tracks: ["audio/music/2-05 Mellow Darkness.ogg"] }),
            'battle':     new Egg.Music({ tracks: ["audio/music/1-02 Resonant Hopes Ignited Wills.ogg"] }),
            'victory':    new Egg.Music({ tracks: ["audio/music/2-12 Victory Theme.ogg"] })
        };

        RPG.mainMenuClass = Menu.Main;
        RPG.loadSkip = ["./src_image"];
        RPG.Menu.blip = sfx['menu_move'];
        RPG.Menu.choose = sfx['menu_choose'];
        RPG.Menu.sfxBad = sfx['menu_bad'];

        RPG.Battle.setFightMusic(music['battle']);
        RPG.Battle.setVictoryMusic(music['victory']);
        RPG.Battle.setMonsters({
            skellington: { name: "Skellington", xp: 20, hp: 5, attributes: { attack: 6, defense: 2, critical: 3, evade: 0 },
                image: 'ui/battle/monster_skellington.png',
                treasure: function() { return { money:(3 + Math.random() * 4) | 0 }; }
            },
            blueslime: { name: "Blue Slime", xp: 15, hp: 7, attributes: { attack: 3, defense: 4, critical: 1, evade: 3 },
                image: 'ui/battle/monster_blueslime.png',
                treasure: function() { return { money:(1 + Math.random() * 3) | 0 }; }
            },
            stabber: { name: "Stabber", xp: 35, hp: 10, attributes: { attack: 3, defense: 3, critical: 10, evade: 10 },
                image: 'ui/battle/monster_stabber.png',
                treasure: function() { return { money:(5 + Math.random() * 5) | 0 }; }
            }
        });

        // TODO should be able to load icons as frames in an atlas
        RPG.Item.load({
            tonic: {
                name: "Tonic", icon: "ui/item_icons.png", icon_frame: { x:0, y:14 }, description: "A light healing potion. Restores 5 HP.", sort: 0.01,
                canStack: true, use: { target: 'self', effect: 'heal', effect_params: [ 5 ] }
            },
            potion: {
                name: "Potion", icon: "ui/item_icons.png", icon_frame: { x:14, y:14 }, description: "A healing potion. Restores 15 HP.", sort: 0.02,
                canStack: true, use: { target: 'self', effect: 'heal', effect_params: [ 15 ] }
            },
            elixir: {
                name: "Elixir", icon: "ui/item_icons.png", icon_frame: { x:28, y:14 }, description: "A powerful healing potion. Restores 50 HP.", sort: 0.03,
                canStack: true, use: { target: 'self', effect: 'heal', effect_params: [ 50 ] }
            },

            oak_sword: {
                name: "Oak Sword", icon: "ui/item_icons.png", icon_frame: { x:0, y:0 }, description: "Made of wood. Might still hurt.", sort: 10.00,
                slot: 'weapon', equip: { attributes: { attack: 1 } }
            },
            arming_sword: {
                name: "Arming Sword", icon: "ui/item_icons.png", icon_frame: { x:14, y:0 }, description: "A steel sword. Popular in fights the world over.", sort: 10.01,
                slot: 'weapon', equip: { attributes: { attack: 2 } }
            },

            quilt_armor: {
                name: "Quilt Armor", icon: "ui/item_icons.png", icon_frame: { x:0, y:28 }, description: "A very thick shirt. Better than nothing.", sort: 15.00,
                slot: 'armor', equip: { attributes: { defense: 3 } }
            },

            amulet: {
                name: "Amulet", icon: "ui/item_icons.png", icon_frame: { x:0, y:42 }, description: "This pendant may or may not have any useful properties.", sort: 20.00,
                slot: 'accessory', equip: { status: ['lucky'] }
            },
        });

        var promises = [];
        promises.push(RPG.start());
        _.each(sfx, function(s) { promises.push(s.loaded()); })
        _.each(music, function(m) { promises.push(m.loaded()); })

        Promise.all(promises)
            .then(function() {
                Egg.unpause();
                SimpleQuest.bootSequence();
                // SimpleQuest.newGame();
            }.bind(this));
    }

    export function bootSequence() {
        music['overworld'].start();
        RPG.controls = RPG.ControlMode.Scene;
        RPG.Menu.push(new Menu.Boot());
        Egg.unpause();
    }

    export function newGame() {
        console.log("newGame");
        Egg.pause();

        RPG.Party.addItem('tonic', 2);
        RPG.Party.addItem('oak_sword');
        RPG.Party.addItem('quilt_armor');

        RPG.characters['hero'] = new Characters.Hero();
        RPG.characters['hero'].equipItem('oak_sword', "weapon");
        RPG.characters['hero'].equipItem('quilt_armor', "armor");

        RPG.Party.add(RPG.characters['hero']);
        RPG.player = RPG.Party.members[0].makeEntity();

        music['village'].start();
        RPG.startMap(new Map_Town(), 10, 7);
        // music['forest'].start();
        // RPG.startMap(new Map_Forest(), 7, 43);

        console.log("setting controls");
        RPG.controls = RPG.ControlMode.Map;
        Egg.unpause();
    }

    export var frame = RPG.frame;
}

module.exports = SimpleQuest;
