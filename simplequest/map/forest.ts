module SimpleQuest {
    export class Map_Forest extends SimpleQuest.Map {
        constructor() {
            super('map/forest.tmx');
            this.music = RPG.music['forest'];
        }

        open() {
            super.open();

            this.fixSwitchDoor('trigger_forest_door_switch', 'locked_door');
            this.fixKeyDoor('forest_door_A');
            this.fixKeyDoor('forest_door_B');

            _.each(['skeleton_doorguard'], (name) => {
                if (SimpleQuest.Map.persistent['global']['defeated_' + name]) {
                    var spriteLayer = RPG.map.getLayerByName("#spritelayer");
                    var entity = spriteLayer.getEntitiesByName(name)[0];
                    if (entity) {
                        entity.destroy();
                    }
                }
            });
        }

        exit_forest(args) {
            if (args.ty == 0) {
                RPG.startMap(new Map_Overworld, 16, 5);
            } else {
                RPG.startMap(new Map_Overworld, 13, 8)
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

        skeleton_doorguard(args) {
            RPG.Battle.start({
                enemy: "skellington",
                scene: 'ui/battle/scene_test.png'
            })
            .then(function() {
                args.target.destroy();
                Map.persistent['global']['defeated_skeleton_doorguard'] = true;
            }.bind(this));
        }

        examine_statue(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox(null, [
                    "The statues seem ancient, but are in remarkably good repair.",
                    "It is not clear what they are supposed to represent, though."
                ]);
            }.bind(this));
        }
    }
}
