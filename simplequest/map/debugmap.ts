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
            RPG.startMap(new Map_Town(), 8, 1);
        }

        goto_forest(args) {
            RPG.startMap(new Map_Forest(), 7, 43);
        }

        goto_castle(args) {
            RPG.startMap(new Map_Castle(), 25, 43);
        }

        goto_cave(args) {
            RPG.startMap(new Map_Cave(), 9, 43);
        }

        goto_boss(args) {
            RPG.startMap(new Map_Boss(), 11, 13);
        }

        read_sign(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox(null, [
                    `<div style="text-align:center">Welcome to the debug map!</div>This map showcases many of the things that SimpleQuest and the RPGKit can do.`,
                    "It also provides a convenient way to skip to any maps.",
                    "If you'd like to go back to town, simply go and activate the town to south."
                ]);
            }.bind(this));
        }

        trigger_restartmap(args) {
            RPG.startMap(new Map_Debug(), 9, 7);
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

        test_shop(args) {
            RPG.Scene.do(function*() {
                yield* this.waitShop({
                    shopName: "Ye Olde Test Shoppe",
                    priceMultiplier: 1,
                    products: _.keys(RPG.Item.library)
                });
            }.bind(this));
        }

        test_fight(enemy) {
            RPG.Battle.start({
                enemy: enemy,
                scene: 'ui/battle/scene_test.png'
            });
        }

        fight_slime(args)              { this.test_fight("blueslime"); }
        fight_stabber(args)            { this.test_fight("stabber"); }
        fight_skeleton(args)           { this.test_fight("skellington"); }
    }
}
