///<reference path="rpg/RPGKit.ts"/>

module SimpleQuest {
    export class Map extends RPG.Map {
        potsSmashed:number = 0;

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
                this.potsSmashed++;
                RPG.Textbox.show("smash!");
                if (this.potsSmashed == 4) {
                    RPG.Textbox.show("You've broken all the pots.\n\nAre you proud of yourself now?");
                }
            }
        }

        trigger_chest(args) {
            var t = this.layers[1].getTile(args.tx, args.ty);
            if (t == 37) {
                this.layers[1].setTile(args.tx, args.ty, t + 1);
                // Textbox.show("There was nothing in the chest. How disappointing.");
            }
        }

        // -- map switches

        enter_town(args) {
            if (RPG.player.dir == 'r') {
                RPG.startMap(new Map("map/town.tmx"), 1, 6);
            } else {
                RPG.startMap(new Map("map/town.tmx"), 8, 1);
            }

            this.potsSmashed = 0;
            // camera_options.follow = false;
        }

        exit_town(args) {
            if (args.ty < 2) {
                RPG.startMap(new Map("map/overworld.tmx"), 14, 12);
            } else {
                RPG.startMap(new Map("map/overworld.tmx"), 13, 13);
            }
            // camera_options.follow = false;
        }

        enter_forest(args) {
            if (args.tx == 13 && args.ty == 8) {
                RPG.startMap(new Map("map/forest.tmx"), 7, 43);
            } else {
                RPG.startMap(new Map("map/forest.tmx"), 32, 1);
            }
            // camera_options.follow = true;
        }

        exit_forest(args) {
            if (args.ty == 0) {
                RPG.startMap(new Map("map/overworld.tmx"), 16, 5);
            } else {
                RPG.startMap(new Map("map/overworld.tmx"), 13, 9)
            }
        }

        // -- specific world manipulation

        // sign_house(args) {
        //     Textbox.show("An empty house");
        // }
        //
        // sign_shops(args) {
        //     Textbox.show("Shopping is fun!");
        // }
        //
        // trigger_rocks(args) {
        //     Textbox.show("I... found some rocks");
        // }
    }
}
