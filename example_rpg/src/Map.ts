///<reference path="rpg/RPGKit.ts"/>

module SimpleQuest {
    var potsSmashed:Array<any> = [];

    export class Map extends RPG.Map {
        open() {
            super.open();
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
                potsSmashed.push([args.tx,args.ty]);
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
    }
}
