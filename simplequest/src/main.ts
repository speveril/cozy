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
    export var frame = RPG.frame;
    export function start() {
        RPG.start({
            mainMenuClass:        Menu.Main,
            battleSystem:         RPG.BattleSystem.SoloFrontView,
            battleSystemConfig: {
                fightMusic:       'battle',
                victoryMusic:     'victory',
                monsters:         Egg.gameDir.file('src/monsters.json').read('json'),
            },
            loadSkip:             [ "src_image/" ],
            items:                Egg.gameDir.file('src/items.json').read('json'),
            sfx: {
                'hit':            "audio/sfx/smash.wav",
                'restore':        "audio/sfx/Healing Full.wav",
                'thud':           "audio/sfx/thud.wav",
                'chnk':           "audio/sfx/chnk.ogg",
                'negative':       "audio/sfx/ALERT_Error.wav",

                'menu_move':      'audio/sfx/MENU_Pick.wav',
                'menu_choose':    'audio/sfx/MENU B_Select.wav',
                'menu_bad':       'audio/sfx/MENU B_Back.wav',
                'menu_newgame':   'audio/sfx/MENU A_Select.wav',

                'dragon_roar':    'audio/sfx/dinosaur_roar.wav',
            },
            music: {
                'village':        { tracks: ["audio/music/1-01 Town of Wishes.ogg"] },
                'overworld':      { tracks: ["audio/music/Death Is Just Another Path.ogg"] },
                'forest':         { tracks: ["audio/music/2-05 Mellow Darkness.ogg"] },
                'castle':         { tracks: ["audio/music/1-12 The Ritual.ogg"] },
                'cave':           { tracks: ["audio/music/1-10 Brazen.ogg"] },
                'boss':           { tracks: ["audio/music/3-11 Royalty of Sin.ogg"] },
                'battle':         { tracks: ["audio/music/1-02 Resonant Hopes Ignited Wills.ogg"] },
                'victory':        { tracks: ["audio/music/2-12 Victory Theme.ogg"] }
            }
        }).then(function() {
            // TODO this stuff could go into a menuConfig key?
            RPG.Menu.blip   = RPG.sfx['menu_move'];
            RPG.Menu.choose = RPG.sfx['menu_choose'];
            RPG.Menu.sfxBad = RPG.sfx['menu_bad'];

            Egg.unpause();

            SimpleQuest.bootSequence();
        }.bind(this));
    }

    export function bootSequence() {
        RPG.music['overworld'].start();
        RPG.controlStack.push(RPG.ControlMode.Map);

        var bootMenu = new Menu.Boot();
        RPG.uiPlane.addChild(bootMenu);
        RPG.Menu.push(bootMenu);

        Egg.unpause();
    }

    export function newGame() {
        var i;

        Egg.pause();

        RPG.characters = {
            hero: new Characters.Hero()
        };
        RPG.Party.add(RPG.characters['hero']);

        RPG.Party.inventory.add('tonic', 2);

        i = RPG.Party.inventory.add('oak_sword');
        RPG.characters['hero'].equipItem(i[0], "weapon");

        i = RPG.Party.inventory.add('quilt_armor');
        RPG.characters['hero'].equipItem(i[0], "armor");

        RPG.player = RPG.Party.members[0].makeEntity();

        RPG.startMap(new Map_Town(), 10, 7);

        Egg.unpause();
    }

    export function loadGame(game:RPG.SavedGame) {
        console.log("Load a game:", game);
    }
}

module.exports = SimpleQuest;
