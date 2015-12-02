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
            this.doScene([
                function() {
                    this.layers[1].setTile(args.tx, args.ty, t + 1);
                    return RPG.Scene.waitForTime(0.5);
                }.bind(this),
                function() {
                    this.layers[1].setTile(args.tx, args.ty, t + 2);
                    return RPG.Scene.waitForTime(0.5);
                }.bind(this),
                function() {
                    var door = RPG.player.layer.getTriggersByName('locked_door')[0];
                    var tx = Math.floor(door.rect.x / this.tileSize.x);
                    var ty = Math.floor(door.rect.y / this.tileSize.y);
                    this.layers[1].setTile(tx, ty, this.layers[1].getTile(tx, ty) + 1);
                    door.solid = false;
                    return RPG.Scene.waitForTime(0);
                }.bind(this),
                "Something opened in the distance."
            ]);
        }

        locked_door(args) {
            var switchName = 'trigger_forest_door_switch';
            if (Map.persistent['global'][switchName]) return;

            this.doScene([
                "This door is locked. It must be opened somewhere else."
            ]);
        }

        key_door_A(args) {
            var switchName = 'key_forest_door_A';
            if (Map.persistent['global'][switchName]) return;

            this.doScene([
                "This door is locked.",
                "\n<center>Used Magical Plotkey!\n</center>",
                function() {
                    this.layers[1].setTile(args.tx, args.ty, this.layers[1].getTile(args.tx, args.ty) + 1);
                    args.trigger.solid = false;
                }.bind(this)
            ]);
        }

        key_door_B(args) {
            var switchName = 'key_forest_door_B';
            if (Map.persistent['global'][switchName]) return;

            this.doScene([
                "This door is locked.",
                "\n<center>Used Magical Plotkey #2!\n</center>",
                function() {
                    this.layers[1].setTile(args.tx, args.ty, this.layers[1].getTile(args.tx, args.ty) + 1);
                    args.trigger.solid = false;
                }.bind(this)
            ]);
        }

        examine_statue(args) {
            this.doScene([
                "The statues seem ancient, but are in remarkably good repair.",
                "It is not clear what they are supposed to represent, though."
            ])
        }
    }
}
