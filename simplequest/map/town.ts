module SimpleQuest {
    export class Map_Town extends SimpleQuest.Map {
        constructor() {
            super('map/town.tmx');
            this.music = RPG.music['village'];
        }

        open() {
            super.open();
        }

        exit_town(args) {
            RPG.startMap('overworld', 14, 12);
        }

        goto_debug(args) {
            RPG.Scene.do(function*() {
                var choices = ["Yeah okay.", "What, no"];
                var choice = yield* this.waitChoice("Go to the debug map?", choices);
                if (choice == 0) {
                    RPG.startMap('debug', 9, 7);
                }
            }.bind(this));
        }

        sign_house(args) {
            RPG.Scene.do(function*() {
                yield* this.waitCenteredTextbox("Mayor's Office\nThe mayor is: IN");
            }.bind(this));
        }

        sign_shops(args) {
            RPG.Scene.do(function*() {
                yield* this.waitCenteredTextbox("Carp's Bend\nShopping Centre");
            }.bind(this));
        }

        shopkeeper_left(args) {
            RPG.Scene.do(function*() {
                if (!this.persisted('talked to item shop')) {
                    this.persist('talked to item shop');
                    yield* this.waitTextbox("SHOPKEEP", ["Don't you just love shopping?!"]);
                    yield* this.waitTextbox("HERO", ["..."]);
                    yield* this.waitTextbox("SHOPKEEP", ["Me too!"]);
                }

                yield* this.waitShop({
                    shopName: "Item Shop",
                    products: [ 'tonic', 'potion' ]
                });
            }.bind(this));
        }

        shopkeeper_right(args) {
            RPG.Scene.do(function*() {
                if (!this.persisted('talked to equip shop')) {
                    this.persist('talked to equip shop');
                    yield* this.waitTextbox("SHOPKEEP", ["Buy somethin', will ya!"]);
                }

                yield* this.waitShop({
                    shopName: "Equipment Shop",
                    products: [
                        'short_sword', 'arming_sword',
                        'oak_shield'
                    ]
                });
            }.bind(this));
        }

        villager_well(args) {
            RPG.Scene.do(function*() {
                args.target.pause();
                switch (args.entity.dir) {
                    case 'u': args.target.sprite.animation = "stand_d"; break;
                    case 'r': args.target.sprite.animation = "stand_l"; break;
                    case 'd': args.target.sprite.animation = "stand_u"; break;
                    case 'l': args.target.sprite.animation = "stand_r"; break;
                }
                console.log(args.entity.dir, args.target.animation);

                yield* this.waitTextbox("VILLAGER", [
                    "Fresh water is good for you! I'm so glad we have the well."
                ]);
                args.target.unpause();
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
                var tonics = RPG.Party.inventory.get((it) => it.key === 'tonic');
                if (tonics.length > 0) {
                    yield* this.waitTextbox("VILLAGER", ["Know what? I'mma steal a tonic from you!"]);
                    RPG.Party.inventory.remove(tonics[0]);
                    yield* this.waitCenteredTextbox("You lost a tonic!");
                    yield* this.waitTextbox("HERO", ["..."]);
                }
            }.bind(this));
        }
    }
}
