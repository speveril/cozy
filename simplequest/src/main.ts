///<reference path="rpg/RPGKit.ts"/>

///<reference path="Map.ts"/>
///<reference path="menus/all.ts"/>

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
            mainMenuClass:          Menu.Main,
            battleSystem:           RPG.BattleSystem.SoloFrontView,
            battleSystemConfig: {
                fightMusic:             'battle',
                victoryMusic:           'victory',
                monsters:               Cozy.gameDir.file('src/monsters.json').read('json'),
                gameOver:               this.gameOverSequence
            },
            loadSkip:               [ "src_image/" ],
            items:                  Cozy.gameDir.file('src/items.json').read('json'),
            sfx: {
                'hit':                  "audio/sfx/smash.wav",
                'restore':              "audio/sfx/Healing Full.wav",
                'thud':                 "audio/sfx/thud.wav",
                'chnk':                 "audio/sfx/chnk.ogg",
                'negative':             "audio/sfx/ALERT_Error.wav",
                'alert':                "audio/sfx/sfx_alarm_loop6.wav",

                'menu_move':            'audio/sfx/MENU_Pick.wav',
                'menu_choose':          'audio/sfx/MENU B_Select.wav',
                'menu_bad':             'audio/sfx/MENU B_Back.wav',
                'menu_newgame':         'audio/sfx/MENU A_Select.wav',

                'dragon_roar':          'audio/sfx/dinosaur_roar.wav',
            },
            music: {
                'village':              { tracks: ["audio/music/1-01 Town of Wishes.ogg"] },
                'overworld':            { tracks: ["audio/music/Death Is Just Another Path.ogg"] },
                'forest':               { tracks: ["audio/music/2-05 Mellow Darkness.ogg"] },
                'castle':               { tracks: ["audio/music/1-12 The Ritual.ogg"] },
                'cave':                 { tracks: ["audio/music/1-10 Brazen.ogg"] },
                'boss':                 { tracks: ["audio/music/3-11 Royalty of Sin.ogg"] },
                'battle':               { tracks: ["audio/music/1-02 Resonant Hopes Ignited Wills.ogg"] },
                'victory':              { tracks: ["audio/music/2-12 Victory Theme.ogg"] }
            },
            maps: {
                'overworld':            [ Map_Overworld ],
                'village':              [ Map_Town ],
                'forest':               [ Map_Forest ],
                'castle':               [ Map_Castle ],
                'cave':                 [ Map_Cave ],
                'boss':                 [ Map_Boss ],
                'debug':                [ Map_Debug ]
            }
        }).then(function() {
            // TODO this stuff could go into a menuConfig key?
            RPG.Menu.blip   = RPG.sfx['menu_move'];
            RPG.Menu.choose = RPG.sfx['menu_choose'];
            RPG.Menu.sfxBad = RPG.sfx['menu_bad'];
            SimpleQuest.bootSequence();
        }.bind(this));
    }

    export function bootSequence() {
        RPG.cleanup();
        RPG.music['overworld'].start();

        var bootMenu = new Menu.Boot();
        RPG.uiPlane.addChild(bootMenu);
        RPG.Menu.push(bootMenu);

        Cozy.unpause();
    }

    export function startGame(game:RPG.SavedGame) {
        Cozy.pause();
        game.applyToState();

        Cozy.unpause();
        if (!RPG.map) {
            this.newGameSequence();
        }
    }

    export function newGameSequence() {
        let lyr = RPG.renderPlane.addRenderLayer();
        let sprite = new Cozy.Sprite(RPG.characters['hero'].sprite);
        lyr.add(sprite);
        sprite.setPosition(160, 120)
        sprite.direction = 90;

        RPG.Scene.do(function*() {
            yield *RPG.Scene.waitFadeFrom('black', 1.0);
            yield *RPG.Scene.waitTextbox(null, [
                "My name is Hero. Great expectations were thrust upon me at birth.",
                "I've been wandering for most of my life, trying to figure out how to fulfill those expectations.",
                "Or how to escape them."
            ]);
            yield *RPG.Scene.waitTextbox(null, [
                "For now I've come to this place. A small village named Carp's Bend. Maybe I'll find what I'm looking for here."
            ]);
            RPG.startMap('village', 8, 2, undefined, { direction: 90 });
        });
    }

    export function gameOverSequence() {
        let gameOverMenu = new Menu.GameOver();
        RPG.uiPlane.addChild(gameOverMenu);
        RPG.Menu.push(gameOverMenu);
    }

    export function newGameData() {
        return new RPG.SavedGame(null, {
            characters: {
                 // TODO move to json data somewhere
                hero: {
                    name: "Hero",
                    title: "Fighter",
                    portrait: "ui/portrait-hero.png",
                    sprite: "sprites/hero.sprite",
                    attributes: {
                        attack: 1,
                        damage: 1,
                        defense: 1,
                        critical: 0,
                        evade: 0,
                    },
                    hp: 10,
                    levels: [ 0, 100, 200, 500, 1000, 2000, 5000, 10000 ],
                    equipped: {
                        weapon: 'oak_sword',
                        armor:  'quilt_armor'
                    }
                }
            },
            party: {
                members: ['hero'],
                inventory: ['tonic','tonic','oak_sword','quilt_armor']
            }
        });
    }
}

module.exports = SimpleQuest;
