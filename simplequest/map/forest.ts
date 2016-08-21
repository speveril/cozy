module SimpleQuest {
    export class Map_Forest extends SimpleQuest.Map {
        constructor() {
            super('map/forest.tmx');
            this.music = SimpleQuest.music['forest'];
        }

        open() {
            super.open();

            var spriteLayer = RPG.map.getLayerByName("#spritelayer");
            if (SimpleQuest.Map.persistent['global']['trigger_forest_door_switch']) {
                var trigger = spriteLayer.getTriggersByName('trigger_forest_door_switch')[0];
                var tx = Math.floor(trigger.rect.x / this.tileSize.x);
                var ty = Math.floor(trigger.rect.y / this.tileSize.y);
                this.layers[1].setTile(tx, ty, this.layers[1].getTile(tx, ty) + 2);

                trigger = spriteLayer.getTriggersByName('locked_door')[0];
                tx = Math.floor(trigger.rect.x / this.tileSize.x);
                ty = Math.floor(trigger.rect.y / this.tileSize.y);
                this.layers[1].setTile(tx, ty, this.layers[1].getTile(tx, ty) + 3);
                trigger.solid = false;
            }

            _.each(['forest_door_A','forest_door_B'], (key) => {
                if (SimpleQuest.Map.persistent['global']['opened_' + key]) {
                    var trigger = spriteLayer.getTriggersByName(key)[0];
                    if (trigger) {
                        tx = Math.floor(trigger.rect.x / this.tileSize.x);
                        ty = Math.floor(trigger.rect.y / this.tileSize.y);
                        this.layers[1].setTile(tx, ty, this.layers[1].getTile(tx, ty) + 3);
                        trigger.solid = false;
                    }
                }
            });

            _.each(['skeleton_doorguard'], (name) => {
                if (SimpleQuest.Map.persistent['global']['defeated_' + name]) {
                    var entity = spriteLayer.getEntitiesByName(name)[0];
                    if (entity) {
                        entity.destroy();
                    }
                }
            });
        }

        exit_forest(args) {
            if (args.ty == 0) {
                this.map_switch(new Map_Overworld, 16, 5);
            } else {
                this.map_switch(new Map_Overworld, 13, 8)
            }
        }

        trigger_forest_door_switch(args) {
            this.doSwitch('forest_door_switch', 'locked_door')
        }

        locked_door(args) {
            this.doSwitchDoor('forest_door_switch');
        }

        forest_door_A(args) {
            this.doKeyDoor('forest_door_A', 'gold_key');
        }

        forest_door_B(args) {
            var switchName = 'opened_forest_door_B';
            if (Map.persistent['global'][switchName]) return;

            RPG.Scene.do(function*() {
                yield* this.waitTextbox(null, ["This door is locked."]);
                yield* this.waitTextbox(null, ["\n<center>Used Magical Plotkey #2!\n</center>"]);
                Map.persistent['global'][switchName] = true;

                this.layers[1].setTile(args.tx, args.ty, this.layers[1].getTile(args.tx, args.ty) + 1);
                sfx['thud'].play();
                args.trigger.solid = false;
            }.bind(this));
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
