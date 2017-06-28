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
            RPG.Scene.do(function*() {
                this.doSwitch('trigger_green_castle_switch', 'green_door');
                let warrior = this.getAllEntitiesByName('west_tower_skelwarrior')[0];
                if (warrior) {
                    yield *RPG.Scene.waitTime(0.01);
                    warrior.respectsObstructions = false;
                    warrior.params.vision = 5;
                    warrior.behavior = RPG.Behavior['guard_down'](warrior);
                }
            }.bind(this));
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

        west_tower_skelwarrior(args) {
            this.doFight(args);
        }

        start_boss_cutscene(args) {
            if (this.persisted('saw_lich_cutscene')) {
                return;
            }

            this.persist('saw_lich_cutscene');

            let lich = this.getAllEntitiesByName('lich')[0];
            let lackeyA = this.getAllEntitiesByName('lackeyA')[0];
            let lackeyB = this.getAllEntitiesByName('lackeyB')[0];
            let lackeyC = this.getAllEntitiesByName('lackeyC')[0];
            let lackeyD = this.getAllEntitiesByName('lackeyD')[0];

            RPG.Scene.do(function*() {
                let target = { x: 320, y: 184 };
                let d = Trig.dist(RPG.player.position, target);
                RPG.player.behavior = RPG.Behavior['path'](RPG.player, [[Math.atan2(target.y - RPG.player.position.y, target.x - RPG.player.position.x) * PIXI.RAD_TO_DEG, d],[270,0]]);
                yield *RPG.Scene.waitTime(d / RPG.player.speed + 0.1);

                lich.hop(8);
                yield *RPG.Scene.waitTextbox("LICH", ["Behold! Another human intent on soiling my castle with the filth of the living!"]);
                lackeyA.hop(8);
                yield *RPG.Scene.waitTime(0.17);
                lackeyC.hop(8);
                yield *RPG.Scene.waitTime(0.12);
                lackeyB.hop(8);
                yield *RPG.Scene.waitTime(0.21);
                lackeyD.hop(8);
                yield *RPG.Scene.waitTextbox("LACKEYS", ["Ha ha ha!", "Death has not diminished your cleverness, Lord!"]);
                lich.hop(8);
                yield *RPG.Scene.waitTextbox("LICH", ["Yes, yes."]);
                yield *RPG.Scene.waitTime(1.5);
                yield *RPG.Scene.waitTextbox("LICH", ["Ahem.", "Well?"]);
                lackeyA.hop(8);
                yield *RPG.Scene.waitTime(0.17);
                lackeyC.hop(8);
                yield *RPG.Scene.waitTime(0.12);
                lackeyB.hop(8);
                yield *RPG.Scene.waitTime(0.21);
                lackeyD.hop(8);
                yield *RPG.Scene.waitTextbox("LACKEYS", ["Right away, Lord!"]);

                lackeyA.behavior = RPG.Behavior['path'](lackeyA, [[ 90, 5 * RPG.map.tileSize.y],[  0, 0]]);
                lackeyB.behavior = RPG.Behavior['path'](lackeyB, [[ 90, 2 * RPG.map.tileSize.y],[ 90, 0]]);
                lackeyC.behavior = RPG.Behavior['path'](lackeyC, [[ 90, 2 * RPG.map.tileSize.y],[ 90, 0]]);
                lackeyD.behavior = RPG.Behavior['path'](lackeyD, [[ 90, 5 * RPG.map.tileSize.y],[180, 0]]);

                // TODO there should be a better way to wait for some number of movements to finish
                yield *RPG.Scene.waitTime(5 * RPG.map.tileSize.x / lackeyA.speed);

                lackeyB.hop(8);
                yield *RPG.Scene.waitTextbox('LACKEY', ["For the master!"]);
                lackeyB.speed = 128;
                lackeyB.behavior = RPG.Behavior['path'](lackeyB, [[ 90, RPG.map.tileSize.y]]);
                yield *RPG.Scene.waitTime(1 * RPG.map.tileSize.x / lackeyB.speed);
                yield *this.waitFight(lackeyB);

                lackeyC.hop(8);
                yield *RPG.Scene.waitTextbox('LACKEY', ["Death shall consume all!"]);
                lackeyC.speed = 128;
                lackeyC.behavior = RPG.Behavior['path'](lackeyC, [[ 90, RPG.map.tileSize.y]]);
                yield *RPG.Scene.waitTime(1 * RPG.map.tileSize.x / lackeyC.speed);
                yield *this.waitFight(lackeyC);

                lackeyA.hop(8);
                yield *RPG.Scene.waitTextbox('LACKEY', ["I might have a few regrets!"]);
                lackeyA.speed = 128;
                lackeyA.behavior = RPG.Behavior['path'](lackeyA, [[  0, RPG.map.tileSize.y]]);
                yield *RPG.Scene.waitTime(1 * RPG.map.tileSize.x / lackeyA.speed);
                yield *this.waitFight(lackeyA);

                lackeyD.hop(8);
                yield *RPG.Scene.waitTextbox('LACKEY', ["Die!"]);
                lackeyD.speed = 128;
                lackeyD.behavior = RPG.Behavior['path'](lackeyD, [[180, RPG.map.tileSize.y]]);
                yield *RPG.Scene.waitTime(1 * RPG.map.tileSize.x / lackeyD.speed);
                yield *this.waitFight(lackeyD);


                lich.hop(8);
                yield *RPG.Scene.waitTextbox("LICH", ["Hmm."]);
                yield *RPG.Scene.waitTextbox("LICH", ["You've defeated my minions, perhaps...","but you won't find me so easy to deal with!"]);
                lich.speed = 128;
                lich.behavior = RPG.Behavior['path'](lich, [[ 90, 5 * RPG.map.tileSize.y]]);
                yield *RPG.Scene.waitTime(5 * RPG.map.tileSize.y / lich.speed);
                yield *this.waitFight(lich);
            }.bind(this));
        }

        jeff(args) {
            RPG.Scene.do(function*() {
                yield *RPG.Scene.waitTextbox(null, ["It's some sort of cultist.", "The nametag on the robe says 'Jeff'."]);
            });
        }
    }
}
