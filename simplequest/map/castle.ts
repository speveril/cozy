module SimpleQuest {
    export class Map_Castle extends SimpleQuest.Map {
        constructor() {
            super('map/castle.tmx');
            this.music = RPG.music['castle'];
            this.battleScene = 'ui/battle/scene_dungeon.png';
        }

        open() {
            super.open();

            this.fixSwitchDoor('trigger_green_castle_switch', 'green_door');
            this.fixSwitchDoor('trigger_red_castle_switch', 'red_door');
            this.fixSwitchDoor('trigger_blue_castle_switch', 'blue_door');
            this.fixKeyDoor('castle_door_A');
            this.fixKeyDoor('castle_door_B');
        }

        exit_castle(args) {
            RPG.startMap('overworld', 3, 6);
        }

        castle_door_A(args) {
            this.doKeyDoor('castle_door_A', 'iron_key');
        }

        castle_door_B(args) {
            this.doKeyDoor('castle_door_B', 'steel_key');
        }

        trigger_green_castle_switch(args) {
            this.doSwitch('trigger_green_castle_switch', 'green_door');
        }

        green_door(args) {
            this.doSwitchDoor('green_door');
        }

        trigger_red_castle_switch(args) {
            this.doSwitch('trigger_red_castle_switch', 'red_door');
        }

        red_door(args) {
            this.doSwitchDoor('red_door');
        }

        trigger_blue_castle_switch(args) {
            this.doSwitch('trigger_blue_castle_switch', 'blue_door');
        }

        blue_door(args) {
            this.doSwitch('blue_door');
        }

        ghost_frontgate(args) {
            RPG.Scene.do(function*() {
                this.entityFacePlayerAndPause(args.target);
                yield *RPG.Scene.waitTextbox("GHOST", ["Why have you come to this accursed place?"]);
                yield *RPG.Scene.waitTextbox("HERO", ["..."]);
                yield *this.waitFight(args.target, {});
                args.target.unpause();
            });
        }
    }
}
