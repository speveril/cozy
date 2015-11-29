module SimpleQuest {
    var threats:any = {
        "forest_A": {
            "dist_min": 25,
            "dist_max": 100,
            "enemies": [
                ["Bunny", "Bunny", "Bunny Captain"],
                ["Mosquito", "Mosquito"],
                ["Bushling"]
            ]
        },
        "forest_B": {
            "dist_min": 20,
            "dist_max": 50,
            "enemies": [
                ["Ruiner"],
                ["Haunt", "Haunt"],
                ["Giant Rat", "Giant Rat", "Giant Rat"]
            ]
        },
        "forest_C": {
            "dist_min": 25,
            "dist_max": 85,
            "enemies": [
                ["Bushling", "Bushling", "Bushling"],
                ["Bunny Captain", "Bunny Lord", "Bunny Captain"],
                ["Forest Drake"]
            ]
        }
    };

    var switchesFlipped:any = {};

    export class Map extends RPG.Map {
        static persistent:any = {};

        private threatGroup:string;
        private nextBattle:number;
        private lastPlayerPosition:PIXI.Point;

        open() {
            super.open();

            if (!Map.persistent[this.filename]) {
                Map.persistent[this.filename] = {};
            }

            _.each(Map.persistent[this.filename].smashedPots, function(coords) {
                var tx = coords[0], ty = coords[1];
                _.each(this.layers, function(lyr:RPG.MapLayer, i) {
                    var t = lyr.getTile(tx, ty);
                    if (t == 53) {
                        lyr.setTile(tx, ty, t + 3);
                    }

                    var tr = lyr.getTriggerByPoint((tx + 0.5) * this.tileSize.x, (ty + 0.5) * this.tileSize.y);
                    if (tr && tr.name === 'smash_pot') {
                        tr.solid = false;
                        tr.active = false;
                    }
                }.bind(this));
            }.bind(this));

            _.each(Map.persistent[this.filename].openedChests, function(coords) {
                var tx = coords[0], ty = coords[1];
                _.each(this.layers, function(lyr:RPG.MapLayer, i) {
                    var t = lyr.getTile(tx, ty);
                    if (t == 37) {
                        lyr.setTile(tx, ty, t + 1);
                    }
                    var tr = lyr.getTriggerByPoint((tx + 0.5) * this.tileSize.x, (ty + 0.5) * this.tileSize.y);
                    if (tr && tr.name === 'open_chest') {
                        tr.active = false;
                    }
                }.bind(this));
            }.bind(this));

            this.threatGroup = null;
        }

        update(dt) {
            super.update(dt);

            if (this.threatGroup) {
                var d = dist(this.lastPlayerPosition, RPG.player.position);
                this.nextBattle -= d;

                if (this.nextBattle < 0) {
                    var groupDef = threats[this.threatGroup];
                    var enemies = groupDef.enemies[Math.floor(Math.random() * groupDef.enemies.length)];

                    console.log("FIGHT:", enemies);

                    this.nextBattle = this.tileSize.x * (groupDef['dist_min'] + Math.random() * groupDef['dist_max']);
                }

                this.lastPlayerPosition.x = RPG.player.position.x;
                this.lastPlayerPosition.y = RPG.player.position.y;
            }
        }

        doScene(steps:Array<any>) {
            var s = RPG.Scene.start();

            _.each(steps, function(step) {
                if (typeof step === "string") {
                    s = s.then(function() {
                        RPG.Textbox.show(step);
                        return RPG.Scene.waitForButton("confirm");
                    });
                } else if (typeof step === 'function') {
                    s = s.then(step);
                } else {
                    throw new Error("doScene() got something weird for a step; not sure what you want me to do with it.");
                }
            }.bind(this));

            return s.then(function() {
                RPG.Textbox.hide();
                RPG.Scene.finish();
            }.bind(this));
        }

        set_threat(args) {
            var group = args.event.properties['group'];
            if (group === 'null') group = null;

            if (this.threatGroup !== args.event.properties['group']) {
                this.threatGroup = args.event.properties['group'];

                if (this.threatGroup !== null) {
                    var groupDef = threats[this.threatGroup];
                    this.nextBattle = this.tileSize.x * (groupDef['dist_min'] + Math.random() * groupDef['dist_max']);
                    this.lastPlayerPosition = new PIXI.Point(RPG.player.position.x, RPG.player.position.y);
                } else {
                    this.nextBattle = null;
                    this.lastPlayerPosition = null;
                }
            }
        }

        open_door(args) {
            var t = this.layers[1].getTile(args.tx, args.ty);
            if (t == 5) {
                this.layers[1].setTile(args.tx, args.ty, 6);
            }
        }

        smash_pot(args) {
            var smashed = Map.persistent[this.filename].smashedPots;
            if (!smashed) {
                smashed = Map.persistent[this.filename].smashedPots = [];

                Map.persistent[this.filename].potCount = 0;
                _.each(this.layers, function(lyr) {
                    _.each(lyr.triggers, function(t) {
                        if (t.name === 'smash_pot') {
                            Map.persistent[this.filename].potCount++;
                        }
                    }.bind(this));
                }.bind(this));
            }

            if (!_.find(smashed, function(o) { return o[0] === args.tx && o[1] === args.ty; })) {
                _.each(this.layers, function(lyr) {
                    var t = lyr.getTile(args.tx, args.ty);
                    if (t == 53) {
                        lyr.setTile(args.tx, args.ty, t + 1);
                    }
                }.bind(this));

                smashed.push([args.tx, args.ty]);
                args.trigger.solid = false;
                args.trigger.active = false;

                if (smashed.length === Map.persistent[this.filename].potCount) {
                    this.doScene([
                        "You've broken all the pots.",
                        "Are you proud of yourself now?"
                    ]);
                }
            }
        }

        open_chest(args) {
            var opened = Map.persistent[this.filename].openedChests;
            if (!opened) {
                opened = Map.persistent[this.filename].openedChests = [];
            }

            if (!_.find(opened, function(o) { return o[0] === args.tx && o[1] === args.ty; })) {
                _.each(this.layers, function(lyr) {
                    var t = lyr.getTile(args.tx, args.ty);
                    if (t == 37) {
                        lyr.setTile(args.tx, args.ty, t + 1);
                    }
                }.bind(this));

                opened.push([args.tx, args.ty]);
                args.trigger.active = false;

                if (args.trigger.properties.contents) {
                    this.doScene([
                        "\n<center>Found " + args.trigger.properties.contents + "!</center>",
                    ]);
                } else {
                    this.doScene([
                        "\n<center>The chest was empty!\n<span style=\"font-size:60%\">How disappointing.</font></center>",
                    ]);
                }
            }
        }

        map_switch(m, x, y) {
            this.doScene([
                function() {
                    return RPG.Scene.waitForFadeOut(0.2);
                }.bind(this),
                function() {
                    RPG.startMap(m, x, y);
                    return RPG.Scene.waitForFadeIn(0.2);
                }.bind(this)
            ]);
        }

        switch_layers(args) {
            var spriteLayer;

            if (RPG.player.dir === 'u') {
                spriteLayer = this.getLayerByName("#spritelayer-upper");
            } else if (RPG.player.dir === 'd') {
                spriteLayer = this.getLayerByName("#spritelayer");
            }

            if (spriteLayer !== RPG.player.layer) {
                RPG.player.place(RPG.player.position.x, RPG.player.position.y, spriteLayer);
            }
        }
    }
}
