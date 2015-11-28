///<reference path="rpg/RPGKit.ts"/>

module SimpleQuest {
    var potsSmashed:Array<any> = [];
    var switchesFlipped:any = {};
    var spriteLayer:RPG.MapLayer;

    export class Map extends RPG.Map {
        open() {
            super.open();
            spriteLayer = RPG.map.getLayerByName("#spritelayer");

            // TODO this is such a dumb way to do this; need to split this out
            if (this.filename === 'map/town.tmx') {
                _.each(potsSmashed, function(coords) {
                    var tx = Math.floor(coords[0] / this.tileSize.x);
                    var ty = Math.floor(coords[1] / this.tileSize.y);
                    var t = this.layers[1].getTile(tx, ty);
                    if (t == 53) {
                        this.layers[1].setTile(tx, ty, t + 3);
                        spriteLayer.getTriggerByPoint(coords[0], coords[1]).solid = false;
                    }
                }.bind(this));
            } else if(this.filename === 'map/forest.tmx') {
                if (switchesFlipped['trigger_forest_door_switch']) {
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
        }

        open_door(args) {
            var t = this.layers[1].getTile(args.tx, args.ty);
            if (t == 5) {
                this.layers[1].setTile(args.tx, args.ty, 6);
            } else if (t == 21) {
                this.layers[1].setTile(args.tx, args.ty, 22);
                // this.setObs(args.x, args.y, 0);
            }
        }

        trigger_pot(args) {
            var t = this.layers[1].getTile(args.tx, args.ty);
            if (t == 53) {
                this.layers[1].setTile(args.tx, args.ty, t + 1);
                // this.setObs(args.x, args.y, 0);
                potsSmashed.push([args.x, args.y]);
                args.trigger.solid = false;
                RPG.Scene.start()
                    .then(function() {
                        RPG.Textbox.show("Smash!");
                        return RPG.Scene.waitForButton("confirm");
                    }.bind(this))
                    .then(function() {
                        if (potsSmashed.length === 4) {
                            RPG.Textbox.show("You've broken all the pots.\n\nAre you proud of yourself now?");
                            return RPG.Scene.waitForButton("confirm");
                        }
                    }.bind(this))
                    .then(function() {
                        RPG.Textbox.hide();
                        RPG.Scene.finish();
                    }.bind(this));
            }
        }

        trigger_chest(args) {
            var t = this.layers[1].getTile(args.tx, args.ty);
            if (t == 37) {
                this.layers[1].setTile(args.tx, args.ty, t + 1);
                RPG.Scene.start()
                    .then(function() {
                        RPG.Textbox.show("There was nothing in the chest.\n\nHow disappointing.");
                        return RPG.Scene.waitForButton("confirm");
                    }.bind(this))
                    .then(function() {
                        RPG.Textbox.hide();
                        RPG.Scene.finish();
                    }.bind(this));
            }
        }

        // -- map switches

        enter_town(args) {
            if (RPG.player.dir == 'r') {
                RPG.startMap(new Map("map/town.tmx"), 1, 6);
            } else {
                RPG.startMap(new Map("map/town.tmx"), 8, 1);
            }

            _.each(potsSmashed, function(pt) {
                RPG.map.layers[1].setTile(pt.x, pt.y, 56);
            }.bind(this));
        }

        exit_town(args) {
            if (args.ty < 2) {
                RPG.startMap(new Map("map/overworld.tmx"), 14, 12);
            } else {
                RPG.startMap(new Map("map/overworld.tmx"), 13, 13);
            }
        }

        enter_forest(args) {
            if (args.tx == 13 && args.ty == 7) {
                RPG.startMap(new Map("map/forest.tmx"), 7, 43);
            } else {
                RPG.startMap(new Map("map/forest.tmx"), 32, 1);
            }
        }

        exit_forest(args) {
            if (args.ty == 0) {
                RPG.startMap(new Map("map/overworld.tmx"), 16, 5);
            } else {
                RPG.startMap(new Map("map/overworld.tmx"), 13, 9)
            }
        }

        // -- specific world manipulation

        sign_house(args) {
            RPG.Scene.start()
                .then(function() {
                    RPG.Textbox.show("An empty house");
                    return RPG.Scene.waitForButton("confirm");
                }.bind(this))
                .then(function() {
                    RPG.Textbox.hide();
                    RPG.Scene.finish();
                }.bind(this));
        }

        sign_shops(args) {
            RPG.Scene.start()
                .then(function() {
                    RPG.Textbox.show("Shopping is fun!");
                    return RPG.Scene.waitForButton("confirm");
                }.bind(this))
                .then(function() {
                    RPG.Textbox.hide();
                    RPG.Scene.finish();
                }.bind(this));
        }

        trigger_rocks(args) {
            RPG.Scene.start()
                .then(function() {
                    RPG.Textbox.show("I found...");
                    return RPG.Scene.waitForButton("confirm");
                }.bind(this))
                .then(function() {
                    RPG.Textbox.hide();
                    return RPG.Scene.waitForTime(2.5);
                }.bind(this))
                .then(function() {
                    RPG.Textbox.show("... some rocks.");
                    return RPG.Scene.waitForButton("confirm");
                }.bind(this))
                .then(function() {
                    RPG.Textbox.hide();
                    RPG.Scene.finish();
                }.bind(this));
        }

        trigger_well(args) {
            RPG.Scene.start()
                .then(function() {
                    RPG.Textbox.show("HP and MP restored!\n\nThis means nothing to you.");
                    return RPG.Scene.waitForButton("confirm");
                }.bind(this))
                .then(function() {
                    RPG.Textbox.hide();
                    RPG.Scene.finish();
                }.bind(this));
        }

        trigger_forest_door_switch(args) {
            if (switchesFlipped['trigger_forest_door_switch']) return;

            switchesFlipped['trigger_forest_door_switch'] = true;
            var t = this.layers[1].getTile(args.tx, args.ty);
            RPG.Scene.start()
                .then(function() {
                    this.layers[1].setTile(args.tx, args.ty, t + 1);
                    return RPG.Scene.waitForTime(0.5);
                }.bind(this))
                .then(function() {
                    this.layers[1].setTile(args.tx, args.ty, t + 2);
                    return RPG.Scene.waitForTime(0.5);
                }.bind(this))
                .then(function() {
                    var door = spriteLayer.getTriggersByName('locked_door')[0];
                    var tx = Math.floor(door.rect.x / this.tileSize.x);
                    var ty = Math.floor(door.rect.y / this.tileSize.y);
                    this.layers[1].setTile(tx, ty, this.layers[1].getTile(tx, ty) + 1);
                    door.solid = false;
                    RPG.Textbox.show("I heard something open somewhere in the distance.");
                    return RPG.Scene.waitForButton("confirm");
                }.bind(this))
                .then(function() {
                    RPG.Textbox.hide();
                    RPG.Scene.finish();
                }.bind(this));
        }

        locked_door(args) {
            if (switchesFlipped['trigger_forest_door_switch']) return;

            RPG.Scene.start()
                .then(function() {
                    RPG.Textbox.show("This door is locked. It must be opened somewhere else.");
                    return RPG.Scene.waitForButton("confirm");
                }.bind(this))
                .then(function() {
                    RPG.Textbox.hide();
                    RPG.Scene.finish();
                }.bind(this));
        }

        key_door(args) {
            // var switchName = 'key_door_' + args.tx + "_" + args.ty;
            // if (switchesFlipped[switchName]) return;

            RPG.Scene.start()
                .then(function() {
                    RPG.Textbox.show("This door is locked.");
                    return RPG.Scene.waitForButton("confirm");
                }.bind(this))
                .then(function() {
                    RPG.Textbox.show("Good thing I carry around this magical Omnikey!");
                    return RPG.Scene.waitForButton("confirm");
                }.bind(this))
                .then(function() {
                    RPG.Textbox.show("*click*");
                    this.layers[1].setTile(args.tx, args.ty, this.layers[1].getTile(args.tx, args.ty) + 1);
                    args.trigger.solid = false;
                    return RPG.Scene.waitForButton("confirm");
                }.bind(this))
                .then(function() {
                    RPG.Textbox.hide();
                    RPG.Scene.finish();
                }.bind(this));
        }

        switch_layers(args) {
            var sl = spriteLayer;

            if (RPG.player.dir === 'u') {
                spriteLayer = this.getLayerByName("#spritelayer-upper");
            } else if (RPG.player.dir === 'd') {
                spriteLayer = this.getLayerByName("#spritelayer");
            }

            if (spriteLayer !== sl) {
                RPG.player.place(RPG.player.position.x, RPG.player.position.y, spriteLayer);
            }
        }
    }
}
