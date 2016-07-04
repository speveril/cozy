module SimpleQuest {
    export class Map_Town extends SimpleQuest.Map {
        constructor() {
            super('map/town.tmx');
            this.music = SimpleQuest.music['village'];
        }

        open() {
            super.open();
        }

        exit_town(args) {
            this.map_switch(new Map_Overworld, 14, 12);
        }

        sign_house(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox(null, ["<center>Mayor's Office\n\nThe mayor is: IN</center>"]);
            }.bind(this));
        }

        sign_shops(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox(null, ["<center>Carp's Bend\nShopping Centre</center>"]);
            }.bind(this));
        }

        trigger_rocks(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox(null, ["\n<center>Found some... rocks</center>"]);
            }.bind(this));
        }

        trigger_well(args) {
            RPG.Scene.do(function*() {
                SimpleQuest.sfx['restore'].play();
                RPG.Party.each(function(ch:RPG.Character) {
                    ch.hp = ch.maxhp;
                });
                yield* this.waitTextbox(null, ["\n<center>HP restored!</center>"]);
            }.bind(this));
        }

        shopkeeper_left(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox("SHOPKEEP", ["Don't you just love shopping?!"]);
                yield* this.waitTextbox("HERO", ["..."]);
                yield* this.waitTextbox("SHOPKEEP", ["Me too!"]);
            }.bind(this));
        }

        shopkeeper_right(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox("SHOPKEEP", ["Buy somethin', will ya!"]);
            }.bind(this));
        }

        villager_well(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox("VILLAGER", [
                    "Fresh water is good for you! I'm so glad we have this well."
                ]);
            }.bind(this));
        }

        villager_mayor(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox("MAYOR JOAN", [
                    "Welcome to Carp's Bend.",
                    "Do you happen to have any experience in slaying dragons?",
                    "We've been having trouble with a dragon that lives up north on Mount Danger."
                ]);
                yield* this.waitTextbox("HERO", ["..."]);
                yield* this.waitTextbox("MAYOR JOAN", [
                    "You would do us a great service by defeating this dragon...",
                    "Your name would probably be remembered in song for... days! Probably!"
                ]);
            }.bind(this));
        }

        villager_south_house(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox("VILLAGER", [
                    "The dragon attacks have been getting worse lately.",
                    "At least I have a house! Most people in this town just seem to sleep outside."
                ]);
            }.bind(this));
        }

        villager_fisher(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox("FISHERMAN", ["We like to fish, here in Carp's Bend."]);
            }.bind(this));
        }

        villager_bushes(args) {
            RPG.Scene.do(function*() {
                yield* this.waitTextbox("VILLAGER", [
                    "Whoa there! This here's private property.",
                    "Go find your own dang bushes!"
                ]);
            }.bind(this));
        }
    }
}
