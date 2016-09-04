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
            RPG.startMap(new Map_Overworld, 14, 12);
        }

        goto_debug(args) {
            RPG.startMap(new Map_Debug(), 11, 20);
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

        doShop(args) {
            // TODO move to Map
            Egg.Input.debounce('menu');
            Egg.Input.debounce('cancel');
            RPG.Menu.push(new SimpleQuest.Menu.Shop(args));
            // end TODO move to map
        }

        shopkeeper_left(args) {
            RPG.Scene.do(function*() {
                // yield* this.waitTextbox("SHOPKEEP", ["Don't you just love shopping?!"]);
                // yield* this.waitTextbox("HERO", ["..."]);
                // yield* this.waitTextbox("SHOPKEEP", ["Me too!"]);

                this.doShop({
                    shopName: "Don't you just love shopping!?",
                    products: [ 'tonic', 'potion' ]
                });
            }.bind(this));
        }

        shopkeeper_right(args) {
            RPG.Scene.do(function*() {
                // yield* this.waitTextbox("SHOPKEEP", ["Buy somethin', will ya!"]);

                // TODO move to a shop() function
                this.doShop({
                    shopName: "Buy somethin', will ya!",
                    priceMultiplier: 1.5,
                    products: [ 'tonic', 'short_sword', 'arming_sword' ]
                });
                // end hypothetical shop()
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
                if (RPG.Party.hasItem('tonic')) {
                    yield* this.waitTextbox("VILLAGER", ["Know what? I'mma steal a tonic from you!"]);
                    RPG.Party.removeItem('tonic');
                    yield* this.waitCenteredTextbox("You lost a tonic!");
                    yield* this.waitTextbox("HERO", ["..."]);
                }
            }.bind(this));
        }
    }
}
