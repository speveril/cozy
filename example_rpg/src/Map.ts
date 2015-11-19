///<reference path="rpg/RPGKit.ts"/>

module SimpleQuest {
    export class Map extends RPG.Map {
        potsSmashed:number = 0;

        open_door(args) {
            console.log("open_door", args);
            // if (this.layers[1].getTile(args.x, args.y) == 5) {
            //     this.layers[1].setTile(args.x, args.y, 6);
            // } else if (map.layers[1].getTile(args.x, args.y) == 21) {
            //     this.layers[1].setTile(args.x, args.y, 22);
            //     this.setObs(args.x, args.y, 0);
            // }
        }

        trigger_pot(args) {
            console.log("trigger_pot", args);
            // var t = map.layers[1].getTile(args.x, args.y);
            // if (t == 53) {
            //     this.layers[1].setTile(args.x, args.y, 54);
            //     this.setObs(args.x, args.y, 0);
            //     this.potsSmashed++;
            //     // if (this.potsSmashed == 4) {
            //     //     Textbox.show("You've broken all the pots.\n\nAre you proud of yourself now?");
            //     // }
            // }
        }

        trigger_chest(args) {
            console.log("trigger_chest", args);
            // var t = this.layers[1].getTile(args.x, args.y);
            // if (t == 37) {
            //     map.layers[1].setTile(args.x, args.y, t + 1);
            //     Textbox.show("There was nothing in the chest. How disappointing.");
            // }
        }
    }
}
