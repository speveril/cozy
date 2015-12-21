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
                "SHOPKEEP: Don't you just love shopping?!"
            ]);
        }

        shopkeeper_right(args) {
            this.doScene([
                "SHOPKEEP: Buy somethin', will ya!"
            ]);
        }

        villager_well(args) {
            this.doScene([
                "VILLAGER: Fresh water is good for you! I'm so glad we have this well."
            ]);
        }

        villager_mayor(args) {
            this.doScene([
                "MAYOR JOAN: Welcome to Carp's Bend.",
                "MAYOR JOAN: Do you happen to have any experience in slaying dragons?",
                "MAYOR JOAN: We've been having trouble with a dragon that lives up north on Mount Danger.",
                "MAYOR JOAN: You would do us a great service by defeating this dragon...",
                "MAYOR JOAN: Your name would be remembered in song for at least a week or two!"
            ]);
        }

        villager_south_house(args) {
            this.doScene([
                "VILLAGER: The dragon attacks have been getting worse lately.",
                "VILLAGER: At least I have a house! Most people in this town just seem to sleep outside."
            ]);
        }

        villager_fisher(args) {
            this.doScene([
                "FISHERMAN: We like to fish, here in Carp's Bend."
            ]);
        }

        villager_bushes(args) {
            this.doScene([
                "VILLAGER: Whoa there! This here's private property.",
                "VILLAGER: Go find your own dang bushes!"
            ])
        }
    }
}
