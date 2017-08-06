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
            if (!this.persisted('talked to mayor')) {
                RPG.Scene.do(function*() {
                    yield *RPG.Scene.waitTextbox(null, ["I should look around for someone who needs help before I leave town."]);
                    yield *RPG.Scene.waitEntityMove(RPG.player, [90]);
                });
            } else {
                RPG.startMap('overworld', 14, 12);
            }
        }

        goto_debug(args) {
            RPG.Scene.do(function*() {
                var choices = ["What, no", "Yeah okay."];
                var choice = yield* this.waitChoice("Go to the debug map?", choices);
                if (choice == 1) {
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
                    yield* RPG.Scene.waitTextbox("SHOPKEEP", ["Don't you just love shopping?!"]);
                    yield* RPG.Scene.waitTextbox("HERO", ["..."]);
                    yield* RPG.Scene.waitTextbox("SHOPKEEP", ["Me too!"]);
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
                    yield* RPG.Scene.waitTextbox("SHOPKEEP", ["Buy somethin', will ya!"]);
                }

                yield* this.waitShop({
                    shopName: "Equipment Shop",
                    products: [
                        'short_sword', 'arming_sword',
                        'buckler'
                    ]
                });
            }.bind(this));
        }

        villager_well(args) {
            RPG.Scene.do(function*() {
                this.entityFacePlayerAndPause(args.target);
                yield* RPG.Scene.waitTextbox("VILLAGER", [
                    "Fresh water is good for you! I'm so glad we have the well."
                ]);
                args.target.unpause();
            }.bind(this));
        }

        villager_mayor(args) {
            RPG.Scene.do(function*() {
                if (!this.persisted('talked to mayor')) {
                    this.persist('talked to mayor');
                    yield* RPG.Scene.waitTextbox("MAYOR JOAN", [
                        "Welcome to Carp's Bend.",
                        "Do you happen to have any experience in slaying dragons?",
                        "We've been having trouble with a dragon that lives up north on Mount Danger."
                    ]);
                    yield* RPG.Scene.waitTextbox("HERO", ["..."]);
                    yield* RPG.Scene.waitTextbox("MAYOR JOAN", [
                        "You would do us a great service by defeating this dragon...",
                        "Your name would be remembered in song for... days!",
                        "Probably!"
                    ]);
                } else {
                    yield* RPG.Scene.waitTextbox("MAYOR JOAN", [
                        "Mount Danger is north of Carp's Bend, through the Dark Forest.",
                        "Thank you for your help!"
                    ]);
                }
            }.bind(this));
        }

        villager_south_house(args) {
            RPG.Scene.do(function*() {
                yield* RPG.Scene.waitTextbox("VILLAGER", [
                    "The dragon attacks have been getting worse lately.",
                    "At least I have a house! Most people in this town just seem to sleep outside."
                ]);
            }.bind(this));
        }

        villager_fisher(args) {
            RPG.Scene.do(function*() {
                yield* RPG.Scene.waitTextbox("FISHERMAN", ["We like to fish, here in Carp's Bend."]);
            }.bind(this));
        }

        villager_bushes(args) {
            RPG.Scene.do(function*() {
                yield* RPG.Scene.waitTextbox("VILLAGER", [
                    "Whoa there! This here's private property.",
                    "Go find your own dang bushes!"
                ]);
                var tonics = RPG.Party.inventory.get((it) => it.key === 'tonic');
                if (tonics.length > 0) {
                    yield* RPG.Scene.waitTextbox("VILLAGER", ["Know what? I'mma steal a tonic from you!"]);
                    RPG.Party.inventory.remove(tonics[0]);
                    yield* this.waitCenteredTextbox("You lost a tonic!");
                    yield* RPG.Scene.waitTextbox("HERO", ["..."]);
                }
            }.bind(this));
        }
    }
}
