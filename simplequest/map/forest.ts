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
    }
}
