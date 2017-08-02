module SimpleQuest {
    export class Map_Cave extends SimpleQuest.Map {
        constructor() {
            super('map/cave.tmx');
            this.music = RPG.music['cave'];
            this.battleScene = 'ui/battle/scene_cave.png';
        }

        open() {
            super.open();

            this.fixSwitchDoor('switch_s', 'door_s');
            this.fixSwitchDoor('switch_n', 'door_n');
            this.fixKeyDoor('exit_door');

            let koboldA = this.getAllEntitiesByName('kobold_guardA')[0];
            let koboldB = this.getAllEntitiesByName('kobold_guardB')[0];
            if (this.persisted('saw_cave_frontdoor_cutscene')) {
                koboldA.destroy();
                koboldB.destroy();
            } else {
                koboldA.dir = 0;
                koboldA.sprite.animation = "walk";
                koboldB.dir = 180;
                koboldB.sprite.animation = "walk";
            }
        }

        entrance_cutscene() {
            if (!this.persisted('saw_cave_frontdoor_cutscene')) {
                let koboldA = this.getAllEntitiesByName('kobold_guardA')[0];
                let koboldB = this.getAllEntitiesByName('kobold_guardB')[0];

                this.persist('saw_cave_frontdoor_cutscene');
                RPG.Scene.do(function*() {
                    let target = { x: 160, y: 664 };
                    let d = Trig.dist(RPG.player.position, target);
                    RPG.player.behavior = RPG.Behavior['path'](RPG.player, [[Math.atan2(target.y - RPG.player.position.y, target.x - RPG.player.position.x) * PIXI.RAD_TO_DEG, d],[270,0]]);
                    yield *RPG.Scene.waitTime(d / RPG.player.speed + 0.1);
                    RPG.player.sprite.animation = 'stand';

                    koboldA.hop(8);
                    yield *RPG.Scene.waitTextbox("KOBOLD", ["When humans bring more tribute?"]);
                    koboldB.hop(8);
                    yield *RPG.Scene.waitTextbox("KOBOLD", ["Soon!", "Maybe!"]);
                    koboldA.hop(8);
                    yield *RPG.Scene.waitTextbox("KOBOLD", ["Humans! Can't trust with anything."]);
                    koboldA.hop(8);
                    yield *RPG.Scene.waitTime(0.2);
                    koboldB.hop(8);
                    yield *RPG.Scene.waitTextbox("KOBOLDS", ["Ho ho ho!"]);

                    koboldB.hop(8);
                    yield *RPG.Scene.waitTime(0.3);
                    koboldA.hop(8);
                    yield *RPG.Scene.waitTextbox("KOBOLDS", ["Hoo hoo ha!"]);

                    koboldB.hop(8);
                    koboldA.dir = 90;
                    koboldA.emote('!');
                    yield *RPG.Scene.waitTextbox("KOBOLDS", ["Ha ha ho!"]);

                    koboldA.hop(8);
                    yield *RPG.Scene.waitTextbox("KOBOLD", ["Wait! Human there!", "Has no tribute, think it's a hero!"]);

                    koboldB.dir = 90;
                    koboldB.emote('!');
                    koboldB.hop(8);
                    yield *RPG.Scene.waitTextbox("KOBOLD", ["!", "Run! Warn Lord Danger!"]);
                    koboldA.clearEmote();
                    koboldB.clearEmote();


                    koboldA.behavior = RPG.Behavior['path'](koboldA, [[ 270, 9 * RPG.map.tileSize.y ]]);
                    koboldB.behavior = RPG.Behavior['path'](koboldB, [[ 180, 1.5 * RPG.map.tileSize.y ], [ 90, 0]]);
                    yield *RPG.Scene.waitTime((1.5 * RPG.map.tileSize.y) / koboldB.speed);

                    koboldB.hop(8);
                    yield *RPG.Scene.waitTextbox("KOBOLD", ["You die now!"]);
                    koboldB.behavior = RPG.Behavior['path'](koboldB, [[ 90, 3 * RPG.map.tileSize.y]]);
                    yield *RPG.Scene.waitTime((3 * RPG.map.tileSize.y) / koboldB.speed);

                    yield *this.waitFight(koboldB);

                    koboldA.destroy();
                }.bind(this));
            }
        }

        exit_overworld(args) {
            RPG.startMap('overworld', 16, 2);
        }

        trigger_go_away_sign(args) {
            RPG.Scene.do(function*() {
                yield* this.waitCenteredTextbox("Mt. Danger\nTurn back!");
            }.bind(this));
        }

        switch_s(args) {
            this.doSwitch('switch_s', 'door_s');
        }

        door_s(args) {
            this.doSwitchDoor('switch_s');
        }

        switch_n(args) {
            this.doSwitch('switch_n', 'door_n');
        }

        door_n(args) {
            this.doSwitchDoor('switch_n');
        }

        exit_door(args) {
            this.doKeyDoor('exit_door', 'massive_key');
        }

        exit_boss(args) {
            RPG.startMap('boss', 11, 13);
        }

        shopkeeper(args) {
            RPG.Scene.do(function*() {
                if (!this.persisted('talked to cave shopkeeper')) {
                    yield* RPG.Scene.waitTextbox('SHOPKEEPER', [
                        "I've been in here for hours! I keep hearing roars from the next room!",
                        "So, you wanna buy something?"
                    ]);
                }
                yield* this.waitShop({
                    shopName: "Prison Shop",
                    products: [
                        'tonic','potion','elixir',
                        'arming_sword','broad_blade','great_sword',
                        'breastplate','plate_armor',
                        'heater','helmet','horned_helmet'
                    ]
                });
                if (!this.persisted('talked to cave shopkeeper')) {
                    this.persist('talked to cave shopkeeper');
                    yield* RPG.Scene.waitTextbox('SHOPKEEPER', [
                        "I'm just going to wait here until it's safe.",
                    ]);
                }
            }.bind(this));
        }
    }
}
