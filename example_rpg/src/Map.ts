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
            console.log("trigger_pot", args);
            var t = this.layers[1].getTile(args.tx, args.ty);
            if (t == 53) {
                this.layers[1].setTile(args.tx, args.ty, t + 1);
                // this.setObs(args.x, args.y, 0);
                this.potsSmashed++;
                // if (this.potsSmashed == 4) {
                //     Textbox.show("You've broken all the pots.\n\nAre you proud of yourself now?");
                // }
            }
        }

        trigger_chest(args) {
            console.log("trigger_chest", args);
            var t = this.layers[1].getTile(args.tx, args.ty);
            if (t == 37) {
                this.layers[1].setTile(args.tx, args.ty, t + 1);
                // Textbox.show("There was nothing in the chest. How disappointing.");
            }
        }

        // -- map switches

        // enter_town(args) {
        //     if (playerSprite.dir == direction.RIGHT) {
        //         mapSwitch("map/town.json", 1, 6);
        //     } else {
        //         mapSwitch("map/town.json", 8, 1);
        //     }
        //
        //     ms_potsSmashed = 0;
        //     camera_options.follow = false;
        // }
        //
        // exit_town(args) {
        //     if (args.y < 1) {
        //         mapSwitch("map/overworld.json", 14, 12);
        //     } else {
        //         mapSwitch("map/overworld.json", 13, 13);
        //     }
        //
        //     camera_options.follow = false;
        // }
        //
        // enter_forest(args) {
        //     if (args.x == 13 && args.y == 8) {
        //         mapSwitch("map/forest.json", 7, 43);
        //     } else {
        //         mapSwitch("map/forest.json", 32, 1);
        //     }
        //
        //     camera_options.follow = true;
        // }
        //
        // exit_forest(args) {
        //     if (args.y == 0) {
        //         mapSwitch("map/overworld.json", 16, 5);
        //     } else {
        //         mapSwitch("map/overworld.json", 13, 9)
        //     }
        // }

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
