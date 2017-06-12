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
            if (this.persisted('plateau cutscene')) {
                yield* RPG.Scene.waitTextbox("Hero", ["Those cultists said they needed a Massive Key for this door."]);
            }
            this.doKeyDoor('forest_door_A', 'gold_key');
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
                        "You buffoons! You know we need that Massive Key to open the door to the ruins! Now what are we supposed to do?!",
                    ]);
                    cultistC.bounce(8);
                    yield* RPG.Scene.waitTextbox("Cultist", ["Master, I just want it to be clear I had nothing to do with any of this!"]);

                    cultLeader.emote("!");
                    RPG.sfx['alert'].play();
                    cultLeader.bounce(8);
                    yield *RPG.Scene.waitTime(1);
                    cultLeader.clearEmote();

                    yield* RPG.Scene.waitTextbox("Cult Leaver", ["Cease your prattling, we've been discovered!"]);
                    yield* RPG.Scene.waitCameraMove(RPG.player.position.x, RPG.player.position.y, 0.5);
                }.bind(this));
            }
        }
    }
}
