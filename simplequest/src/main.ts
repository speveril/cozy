///<reference path="rpg/RPGKit.ts"/>

///<reference path="Map.ts"/>
///<reference path="menus/all.ts"/>

///<reference path="characters/Hero.ts"/>

///<reference path="../map/boss.ts"/>
///<reference path="../map/castle.ts"/>
///<reference path="../map/cave.ts"/>
///<reference path="../map/debugmap.ts"/>
///<reference path="../map/forest.ts"/>
///<reference path="../map/town.ts"/>
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
            'negative': new Egg.Sound("audio/sfx/ALERT_Error.wav"),

            'menu_move': new Egg.Sound('audio/sfx/MENU_Pick.wav'),
            'menu_choose': new Egg.Sound('audio/sfx/MENU B_Select.wav'),
            'menu_bad': new Egg.Sound('audio/sfx/MENU B_Back.wav'),
            'menu_newgame': new Egg.Sound('audio/sfx/MENU A_Select.wav'),

            'dragon_roar': new Egg.Sound('audio/sfx/dinosaur_roar.wav'),
        };
        music = {
            'village':    new Egg.Music({ tracks: ["audio/music/1-01 Town of Wishes.ogg"] }),
            'overworld':  new Egg.Music({ tracks: ["audio/music/Death Is Just Another Path.ogg"] }),
            'forest':     new Egg.Music({ tracks: ["audio/music/2-05 Mellow Darkness.ogg"] }),
            'castle':     new Egg.Music({ tracks: ["audio/music/1-12 The Ritual.ogg" ]}),
            'cave':       new Egg.Music({ tracks: ["audio/music/1-10 Brazen.ogg" ]}),
            'boss':       new Egg.Music({ tracks: ["audio/music/3-11 Royalty of Sin.ogg"] }),
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
            skellington: { name: "Skellington", xp: 20,
                hp: 5, attributes: { attack: 6, defense: 2, critical: 3, evade: 0 },
                image: 'ui/battle/monster_skellington.png',
                treasure: { money: '1d4 + 2' }
            },
            blueslime: { name: "Blue Slime", xp: 15,
                hp: 7, attributes: { attack: 3, defense: 4, critical: 1, evade: 3 },
                image: 'ui/battle/monster_blueslime.png',
                treasure: { money: '1d3' }
            },
            stabber: { name: "Stabber", xp: 35,
                hp: 10, attributes: { attack: 3, defense: 3, critical: 10, evade: 10 },
                image: 'ui/battle/monster_stabber.png',
                treasure: { money: '2d6' }
            }
        });

        RPG.Item.load(JSON.parse(Egg.File.read("src/items.json")));

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
        RPG.controlStack.push(RPG.ControlMode.Map);
        RPG.Menu.push(new Menu.Boot());
        Egg.unpause();
    }

    export function newGame() {
        var i;

        console.log("newGame");
        Egg.pause();

        RPG.characters['hero'] = new Characters.Hero();
        RPG.Party.add(RPG.characters['hero']);

        RPG.Party.inventory.add('tonic', 2);

        i = RPG.Party.inventory.add('oak_sword');
        RPG.characters['hero'].equipItem(i[0], "weapon");

        i = RPG.Party.inventory.add('quilt_armor');
        RPG.characters['hero'].equipItem(i[0], "armor");

        RPG.player = RPG.Party.members[0].makeEntity();

        // music['village'].start();
        RPG.startMap(new Map_Town(), 10, 7);
        // music['forest'].start();
        // RPG.startMap(new Map_Forest(), 7, 43);
        // RPG.startMap(new Map_Debug(), 11, 20, undefined, { noFadeOut: true });

        Egg.unpause();
    }

    export var frame = RPG.frame;
}

module.exports = SimpleQuest;
