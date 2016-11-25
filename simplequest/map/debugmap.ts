module SimpleQuest {
    export class Map_Debug extends SimpleQuest.Map {
        private musicKey:string;

        constructor() {
            super('map/debugmap.tmx');
            this.musicKey = 'overworld';
            this.music = RPG.music[this.musicKey];
        }

        open() {
            super.open();

            this.fixSwitch('trigger_useless_switch');
            this.fixSwitchDoor('trigger_switch', 'trigger_switchdoor');
            this.fixKeyDoor('trigger_keydoor');
        }

        goto_village(args) {
            RPG.startMap('village', 8, 1);
        }

        goto_forest(args) {
            RPG.startMap('forest', 7, 43);
        }

        goto_castle(args) {
            RPG.startMap('castle', 25, 43);
        }

        goto_cave(args) {
            RPG.startMap('cave', 9, 43);
        }

        goto_boss(args) {
            RPG.startMap('boss', 11, 13);
        }

        read_sign(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox(null, [
                    `<div style="text-align:center">Welcome to the debug map!</div>This map showcases many of the things that SimpleQuest and the RPGKit can do.`,
                    "It also provides a convenient way to skip to any maps.",
                    "If you'd like to go back to town, simply go and activate the town to south."
                ]);
            }.bind(this));
        }

        trigger_restartmap(args) {
            RPG.startMap('debug', 9, 7);
        }

        trigger_switchdoor(args) {
            this.doSwitchDoor('trigger_switch');
        }

        trigger_switch(args) {
            this.doSwitch('trigger_switch', 'trigger_switchdoor');
        }

        trigger_keydoor(args) {
            this.doKeyDoor('trigger_keydoor', 'iron_key');
        }

        trigger_useless_switch(args) {
            this.doSwitch('trigger_useless_switch', null, 'Well, that was unsatisfying.');
        }

        test_shop(args) {
            RPG.Scene.do(function*() {
                yield* this.waitShop({
                    shopName: "Ye Olde Test Shoppe",
                    priceMultiplier: 1,
                    products: _.keys(RPG.Item.library)
                });
            }.bind(this));
        }

        music_check(args) {
            RPG.Scene.do(function*() {
                var choices = ["Change track...", "Leave it"];
                var choice = yield* this.waitChoice(`Playing '${this.musicKey}'.`, choices);
                if (choice === choices[0]) {
                    this.musicKey = yield* this.waitChoice("Select track...", _.keys(RPG.music));
                    RPG.music[this.musicKey].start();
                }
            }.bind(this));
        }

        music_prev(args) {
            RPG.Scene.do(function*() {
                var musicKeys = _.keys(RPG.music);
                var index = Egg.wrap(musicKeys.indexOf(this.musicKey) - 1, musicKeys.length);
                this.musicKey = musicKeys[index];
                RPG.music[this.musicKey].start();
                yield* this.waitTextbox(null, [
                    `<center>Now playing:\n${this.musicKey}</center>`
                ]);
            }.bind(this));
        }

        music_next(args) {
            RPG.Scene.do(function*() {
                var musicKeys = _.keys(RPG.music);
                var index = Egg.wrap(musicKeys.indexOf(this.musicKey) + 1, musicKeys.length);
                this.musicKey = musicKeys[index];
                RPG.music[this.musicKey].start();
                yield* this.waitTextbox(null, [
                    `<center>Now playing:\n${this.musicKey}</center>`
                ]);
            }.bind(this));
        }


        test_fight(enemy) {
            RPG.Battle.start({
                enemy: enemy,
                scene: 'ui/battle/scene_test.png'
            });
        }

        fight_slime(args)              { this.test_fight("slime"); }
        fight_blueslime(args)          { this.test_fight("blueslime"); }
        fight_stabber(args)            { this.test_fight("stabber"); }
        fight_skeleton(args)           { this.test_fight("skellington"); }

        fight_special(args) {
            RPG.Scene.do(function*() {
                yield *this.waitTextbox('Skeleton', [
                    "Knave! You stand before Dr. Skull Van Skellington, Esq."
                ]);
                var fight = yield *this.waitChoice("Fight Dr. Whatever?", ["Yes","No"]);
                if (fight === 'Yes') {
                    yield *RPG.Battle.waitBattle({
                        enemy: 'skellington',
                        scene: 'ui/battle/scene_test.png'
                    });
                    yield *this.waitTextbox('Skeleton', [
                        "Capital! Good show."
                    ]);
                } else {
                    yield *this.waitTextbox('Skeleton', [
                        "Yes! Cower before my skeletal might!"
                    ]);
                }
            }.bind(this));
        }
    }
}
