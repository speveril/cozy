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
                yield* RPG.Scene.waitTextbox(null, [
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

        showCredits(args) {
            RPG.Scene.do(function*() {
                var choice = yield *this.waitChoice("View ending credits?", {yes:"Yes", no:"No"});
                if (choice === 'yes') {
                    RPG.music['victory'].start();
                    SimpleQuest.gameWinSequence()
                }
            }.bind(this));
        }

        music_check(args) {
            RPG.Scene.do(function*() {
                var choice = yield* this.waitChoice(`Playing '${this.musicKey}'.`, {change:'Change track...', 'cancel':'Leave it'});
                if (choice === 'change') {
                    let musicKeys = _.keys(RPG.music);
                    this.musicKey = musicKeys[yield* this.waitChoice("Select track...", musicKeys)];
                    RPG.music[this.musicKey].start();
                }
            }.bind(this));
        }

        music_prev(args) {
            RPG.Scene.do(function*() {
                var musicKeys = _.keys(RPG.music);
                var index = Cozy.wrap(musicKeys.indexOf(this.musicKey) - 1, musicKeys.length);
                this.musicKey = musicKeys[index];
                RPG.music[this.musicKey].start();
                yield* RPG.Scene.waitTextbox(null, [
                    `<center>Now playing:\n${this.musicKey}</center>`
                ]);
            }.bind(this));
        }

        music_next(args) {
            RPG.Scene.do(function*() {
                var musicKeys = _.keys(RPG.music);
                var index = Cozy.wrap(musicKeys.indexOf(this.musicKey) + 1, musicKeys.length);
                this.musicKey = musicKeys[index];
                RPG.music[this.musicKey].start();
                yield* RPG.Scene.waitTextbox(null, [
                    `<center>Now playing:\n${this.musicKey}</center>`
                ]);
            }.bind(this));
        }

        check_entity(args) {
            RPG.Scene.do(function*() {
                var choices = {
                    fight:      'Fight it',
                    change:     'Change to this sprite',
                    leave:      'Leave it alone',
                };
                if (!args.target.params.monster) {
                    delete choices['fight'];
                }

                var choice = yield* this.waitChoice(args.target.spriteDef, choices);
                switch (choice) {
                    case 'leave':
                        return;
                    case 'fight':
                        yield *this.waitFight(args.target, { leaveEntity: true });
                        return;
                    case 'change':
                        RPG.player.changeSprite(args.target.spriteDef);
                        return;
                }
            }.bind(this));
        }

        emote_test(args) {
            RPG.Scene.do(function*() {
                var emotes = {
                    "done": "Never mind",
                    "!": "!"
                }
                yield *RPG.Scene.waitTextbox("Emote Tester", ["I'm the emote tester!"]);
                while (true) {
                    var choice = yield *this.waitChoice("Which emote?", emotes);
                    if (choice === 'done') {
                        yield *RPG.Scene.waitTextbox("Emote Tester", ["Okay, bye!"]);
                        args.target.clearEmote();
                        break;
                    } else {
                        args.target.emote(choice);
                    }
                }
            }.bind(this));
        }

        fight_special(args) {
            RPG.Scene.do(function*() {
                yield *RPG.Scene.waitTextbox('Skeleton', [
                    "Knave! You stand before Dr. Skull Van Skellington, Esq."
                ]);
                var fight = yield *this.waitChoice("Fight Dr. Whatever?", {yes:"Yes", no:"No"});
                if (fight === 'yes') {
                    yield *RPG.Battle.waitBattle({
                        enemy: 'skellington',
                        scene: 'ui/battle/scene_test.png'
                    });
                    yield *RPG.Scene.waitTextbox('Skeleton', [
                        "Capital! Good show."
                    ]);
                } else {
                    yield *RPG.Scene.waitTextbox('Skeleton', [
                        "Yes! Cower before my skeletal might!"
                    ]);
                }
            }.bind(this));
        }
    }
}
