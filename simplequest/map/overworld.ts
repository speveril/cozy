module SimpleQuest {
    export class Map_Overworld extends SimpleQuest.Map {
        constructor() {
            super('map/overworld.tmx');
            this.music = RPG.music['overworld'];
        }

        start() {
            RPG.player.speed *= 0.6;
        }

        finish() {
            RPG.player.speed /= 0.6;
        }

        enter_town(args) {
            RPG.startMap('village', 8, 1);
        }

        enter_forest(args) {
            if (args.tx == 13 && args.ty == 7) {
                RPG.startMap('forest', 7, 43);
            } else {
                RPG.startMap('forest', 32, 1);
            }
        }

        enter_castle(args) {
            RPG.startMap('castle', 25, 43);
        }

        enter_cave(args) {
            RPG.startMap('cave', 9, 43);
        }

        examine_ship(args) {
            RPG.Scene.do(function*() {
                yield* RPG.Scene.waitTextbox(null, ["I can't leave yet."]);
            }.bind(this));
        }
    }
}
