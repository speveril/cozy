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
                yield *this.waitFight(args.target, {});
                yield *RPG.Scene.waitTextbox("HERO", ["..."]);
                args.target.unpause();
            }.bind(this));
        }

        start_boss_cutscene(args) {
            if (this.persisted('saw_lich_cutscene')) {
                return;
            }

            this.persist('saw_lich_cutscene');

            let lich = this.getAllEntitiesByName('lich')[0];
            let warriorA = this.getAllEntitiesByName('warriorA')[0];
            let warriorB = this.getAllEntitiesByName('warriorB')[0];
            let warriorC = this.getAllEntitiesByName('warriorC')[0];
            let warriorD = this.getAllEntitiesByName('warriorD')[0];

            RPG.Scene.do(function*() {
                lich.hop(8);
                yield *RPG.Scene.waitTextbox("LICH", ["Behold! Another human intent on soiling my castle with the filth of the living!"]);
                warriorA.hop(8);
                yield *RPG.Scene.waitTime(0.17);
                warriorC.hop(8);
                yield *RPG.Scene.waitTime(0.12);
                warriorB.hop(8);
                yield *RPG.Scene.waitTime(0.21);
                warriorD.hop(8);
                yield *RPG.Scene.waitTextbox("LACKEYS", ["Ha ha ha!", "Death has not diminished your cleverness, Lord!"]);
                lich.hop(8);
                yield *RPG.Scene.waitTextbox("LICH", ["Yes, yes."]);
                yield *RPG.Scene.waitTime(1.5);
                yield *RPG.Scene.waitTextbox("LICH", ["Ahem.", "Well?"]);
                warriorA.hop(8);
                yield *RPG.Scene.waitTime(0.17);
                warriorC.hop(8);
                yield *RPG.Scene.waitTime(0.12);
                warriorB.hop(8);
                yield *RPG.Scene.waitTime(0.21);
                warriorD.hop(8);
                yield *RPG.Scene.waitTextbox("LACKEYS", ["Right away, Lord!"]);

                warriorA.behavior = RPG.Behavior['path'](warriorA, [[ 90, 5 * RPG.map.tileSize.x],[  0, 0]]);
                warriorB.behavior = RPG.Behavior['path'](warriorB, [[ 90, 4 * RPG.map.tileSize.x],[ 90, 0]]);
                warriorC.behavior = RPG.Behavior['path'](warriorC, [[ 90, 4 * RPG.map.tileSize.x],[ 90, 0]]);
                warriorD.behavior = RPG.Behavior['path'](warriorD, [[ 90, 5 * RPG.map.tileSize.x],[180, 0]]);

            }.bind(this));
        }

        jeff(args) {
            RPG.Scene.do(function*() {
                yield *RPG.Scene.waitTextbox(null, ["It's some sort of cultist.", "The nametag on the robe says 'Jeff'."]);
            });
        }
    }
}
