module SimpleQuest {
    export class Map_Castle extends SimpleQuest.Map {
        constructor() {
            super('map/castle.tmx');
            this.music = SimpleQuest.music['castle'];
        }

        open() {
            super.open();
        }

        exit_castle(args) {
            this.map_switch(new Map_Overworld(), 3, 6);
        }

        trigger_green_castle_switch(args) {

        }
    }
}
