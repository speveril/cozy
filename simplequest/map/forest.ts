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
            var switchName = 'trigger_forest_door_switch';
            if (Map.persistent['global'][switchName]) return;

            Map.persistent['global'][switchName] = true;
            var t = this.layers[1].getTile(args.tx, args.ty);
            RPG.Scene.do(function*() {
                this.layers[1].setTile(args.tx, args.ty, t + 1);
                sfx['chnk'].play();
                yield* RPG.Scene.waitTime(0.5);

                this.layers[1].setTile(args.tx, args.ty, t + 2);
                sfx['chnk'].play();
                yield* RPG.Scene.waitTime(0.5);

                var door = RPG.player.layer.getTriggersByName('locked_door')[0];
                sfx['thud'].play();
                var tx = Math.floor(door.rect.x / this.tileSize.x);
                var ty = Math.floor(door.rect.y / this.tileSize.y);
                this.layers[1].setTile(tx, ty, this.layers[1].getTile(tx, ty) + 1);
                door.solid = false;

                yield* this.waitTextbox(null, ["Something opened in the distance."]);
            }.bind(this))
        }

        locked_door(args) {
            var switchName = 'trigger_forest_door_switch';
            if (Map.persistent['global'][switchName]) return;

            RPG.Scene.do(function*() {
                yield* this.waitTextbox(null, ["This door is locked. It must be opened somewhere else."]);
            }.bind(this));
        }

        forest_door_A(args) {
            var switchName = 'opened_forest_door_A';
            if (Map.persistent['global'][switchName]) return;

            RPG.Scene.do(function*() {
                yield* this.waitTextbox(null, ["This door is locked."]);
                yield* this.waitTextbox(null, ["\n<center>Used Magical Plotkey!\n</center>"]);
                Map.persistent['global'][switchName] = true;

                this.layers[1].setTile(args.tx, args.ty, this.layers[1].getTile(args.tx, args.ty) + 1);
                sfx['thud'].play();
                args.trigger.solid = false;
            }.bind(this));
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
