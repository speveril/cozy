module SimpleQuest {
    export class Map_Cave extends SimpleQuest.Map {
        constructor() {
            super('map/cave.tmx');
            this.music = RPG.music['cave'];
            this.battleScene = 'ui/battle/scene_cave.png';
        }

        open() {
            super.open();

            this.fixSwitchDoor('switch_s', 'door_s');
            this.fixSwitchDoor('switch_n', 'door_n');
            this.fixKeyDoor('exit_door');
        }

        exit_overworld(args) {
            RPG.startMap('overworld', 16, 2);
        }

        trigger_go_away_sign(args) {
            RPG.Scene.do(function*() {
                yield* this.waitCenteredTextbox("Mt. Danger\nTurn back!");
            }.bind(this));
        }

        switch_s(args) {
            this.doSwitch('switch_s', 'door_s');
        }

        door_s(args) {
            this.doSwitchDoor('switch_s');
        }

        switch_n(args) {
            this.doSwitch('switch_n', 'door_n');
        }

        door_n(args) {
            this.doSwitchDoor('switch_n');
        }

        exit_door(args) {
            this.doKeyDoor('exit_door', 'massive_key');
        }

        exit_boss(args) {
            RPG.startMap('boss', 11, 13);
        }
    }
}
