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
            this.doScene([
                "<center>Mayor's Office\n\nThe mayor is: IN</center>"
            ]);
        }

        sign_shops(args) {
            this.doScene([
                "<center>Carp's Bend\nShopping Centre</center>"
            ]);
        }

        trigger_rocks(args) {
            this.doScene([
                "<center>\nFound some... rocks.</center>",
            ]);
        }

        trigger_well(args) {
            this.doScene([
                function() {
                    SimpleQuest.sfx['restore'].play();
                    RPG.Party.each(function(ch:RPG.Character) {
                        ch.hp = ch.maxhp;
                    });
                },
                "\n<center>HP restored!</center>",
            ]);
        }

        shopkeeper_left(args) {
            this.doScene([
                this.sceneText("Shopkeep", "Don't you just love shopping?!")
            ]);
        }

        shopkeeper_right(args) {
            this.doScene([
                this.sceneText("Shopkeep", "Buy somethin', will ya!")
            ]);
        }

        villager_well(args) {
            this.doScene([
                this.sceneText("VILLAGER", "Fresh water is good for you! I'm so glad we have this well.")
            ]);
        }

        villager_mayor(args) {
            this.doScene([
                this.sceneText("MAYOR JOAN", "Welcome to Carp's Bend."),
                this.sceneText("MAYOR JOAN", "Do you happen to have any experience in slaying dragons?"),
                this.sceneText("MAYOR JOAN", "We've been having trouble with a dragon that lives up north on Mount Danger."),
                this.sceneText("MAYOR JOAN", "You would do us a great service by defeating this dragon..."),
                this.sceneText("MAYOR JOAN", "Your name would probably be remembered in song for... days! Probably!")
            ]);
        }

        villager_south_house(args) {
            this.doScene([
                this.sceneText("VILLAGER","The dragon attacks have been getting worse lately."),
                this.sceneText("VILLAGER","At least I have a house! Most people in this town just seem to sleep outside.")
            ]);
        }

        villager_fisher(args) {
            this.doScene([
                this.sceneText("FISHERMAN","We like to fish, here in Carp's Bend.")
            ]);
        }

        villager_bushes(args) {
            this.doScene([
                this.sceneText("VILLAGER","Whoa there! This here's private property."),
                this.sceneText("VILLAGER","Go find your own dang bushes!")
            ])
        }
    }
}
