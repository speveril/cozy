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
