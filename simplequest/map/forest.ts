module SimpleQuest {
    export class Map_Forest extends SimpleQuest.Map {
        constructor() {
            super('map/forest.tmx');
            this.music = RPG.music['forest'];
            this.battleScene = 'ui/battle/scene_forest.png';
        }

        open() {
            super.open();

            this.fixSwitchDoor('trigger_forest_door_switch', 'locked_door');
            this.fixKeyDoor('forest_door_A');
            this.fixKeyDoor('forest_door_B');
        }

        exit_forest(args) {
            if (args.ty == 0) {
                RPG.startMap('overworld', 16, 5);
            } else {
                RPG.startMap('overworld', 13, 8)
            }
        }

        trigger_forest_door_switch(args) {
            this.doSwitch('trigger_forest_door_switch', 'locked_door')
        }

        locked_door(args) {
            this.doSwitchDoor('trigger_forest_door_switch');
        }

        forest_door_A(args) {
            RPG.Scene.do(function*() {
                yield *this.waitKeyDoor('forest_door_A', 'gold_key');
                if (this.persisted('plateau cutscene') && !this.persisted('forest_door_A__opened')) {
                    yield* RPG.Scene.waitTextbox("Hero", [
                        "Those cultists said they left the Gold Key for this door in the haunted castle to the west.",
                        "I should check there."
                    ]);
                }
            }.bind(this));
        }

        forest_door_B(args) {
            this.doKeyDoor('forest_door_B', 'gold_key');
        }

        examine_statue(args) {
            RPG.Scene.do(function*() {
                yield* RPG.Scene.waitTextbox(null, [
                    "The statues seem ancient, but are in remarkably good repair.",
                    "It is not clear what they are supposed to represent, though."
                ]);
            }.bind(this));
        }

        cult_leader(args) {
            this.doFight(args);
        }

        cultist_a(args) {
            this.doFight(args);
        }

        cultist_b(args) {
            this.doFight(args);
        }

        cultist_c(args) {
            this.doFight(args);
        }

        cult_plateau_cutscene(args) {
            if (!this.persisted('plateau cutscene')) {
                this.persist('plateau cutscene');

                let cultLeader = this.getAllEntitiesByName('cult_leader')[0];
                let cultistA = this.getAllEntitiesByName('cultist_a')[0];
                let cultistB = this.getAllEntitiesByName('cultist_b')[0];
                let cultistC = this.getAllEntitiesByName('cultist_c')[0];

                RPG.Scene.do(function*() {
                    yield* RPG.Scene.waitCameraMove(26.5 * RPG.map.tileSize.x, 18.5 * RPG.map.tileSize.y, 0.5);

                    cultLeader.bounce(8);
                    cultistA.dir = 90;
                    cultistC.dir = 0;

                    yield* RPG.Scene.waitTextbox("Cult Leader", ["The ritual is complete! We must move on through the ruins and to Mount Danger!"]);
                    cultistA.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cultist", ["Uhhhh. About that."]);
                    cultLeader.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cult Leader", ["What's that over there? Speak up!"]);
                    cultistB.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cultist", [
                        "We might have uh...",
                        "that is...",
                        "I mean, Jeff left the key in the uh...",
                        "The haunted castle."
                    ]);
                    cultLeader.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cult Leader", [
                        "The haunted castle?! To the west, by the lake?",
                        "Why did he even have the key there?!"
                    ]);
                    cultistA.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cultist", ["We didn't really think to ask, Master!"]);
                    cultLeader.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cult Leader", [
                        "You buffoons! You know we need that Gold Key to open the door to the ruins! Now what are we supposed to do?!",
                        "You're all very lucky that I keep a copy of the Iron Key in this chest here."
                    ]);
                    cultistB.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cultist", ["The Iron Key, Master? The one that opens the door to the castle?"]);
                    cultLeader.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cult Leader", ["Yes, of course!"]);
                    cultistA.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cultist", ["Master, wouldn't it have made more sense to keep a copy of the Gold Key?"]);
                    yield *RPG.Scene.waitTime(1.5);
                    cultLeader.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cult Leader", ["Lord Danger's kobolds are always asking for extra sacrifices, you know."]);
                    cultistA.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cultist", ["Understood! Please allow me to retract my previous question."]);
                    cultistC.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cultist", ["Master, I just want it to be clear I had nothing to do with any of this!"]);

                    cultLeader.emote("!");
                    RPG.sfx['alert'].play();
                    cultLeader.bounce(8);
                    yield *RPG.Scene.waitTime(1);
                    cultLeader.clearEmote();

                    yield* RPG.Scene.waitTextbox("CULT LEADER", ["Cease your prattling, we've been discovered!"]);
                    cultistA.dir = 180;
                    cultistC.dir = 270;

                    yield* RPG.Scene.waitCameraMove(RPG.player.position.x, RPG.player.position.y, 0.5);
                }.bind(this));
            }
        }
    }
}
