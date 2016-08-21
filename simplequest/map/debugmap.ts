module SimpleQuest {
    export class Map_Debug extends SimpleQuest.Map {
        constructor() {
            super('map/debugmap.tmx');
            this.music = SimpleQuest.music['village'];
        }

        open() {
            super.open();

            this.fixSwitch('trigger_useless_switch');
            this.fixSwitchDoor('trigger_switch', 'trigger_switchdoor');
            this.fixKeyDoor('trigger_keydoor');
        }

        goto_village(args) {
            this.map_switch(new Map_Town(), 8, 1);
        }

        goto_forest(args) {
            this.map_switch(new Map_Forest(), 7, 43);
        }

        goto_castle(args) {
            this.map_switch(new Map_Castle(), 25, 43);
        }

        trigger_restartmap(args) {
            this.map_switch(new Map_Debug(), 11, 20);
        }

        trigger_switchdoor(args) {
            this.doSwitchDoor('trigger_switch');
        }

        trigger_switch(args) {
            this.doSwitch('trigger_switch', 'trigger_switchdoor');
        }

        trigger_keydoor(args) {
            this.doKeyDoor('trigger_keydoor', 'iron_key');
        }

        trigger_useless_switch(args) {
            this.doSwitch('trigger_useless_switch', null, 'Well, that was unsatisfying.');
        }
    }
}
