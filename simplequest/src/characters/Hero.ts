module SimpleQuest {
    export module Characters {
        export class Hero extends RPG.Character {
            constructor() {
                super({
                    name: "Hero",
                    sprite: "sprites/hero.sprite",
                    attributes: {
                        attack: 1,
                        damage: 1,
                        defense: 1,
                        critical: 0,
                        evade: 0,
                    },
                    hp: 10,
                    levels: [ 0, 100, 200, 500, 1000, 2000, 5000, 10000 ]
                });

                this['portrait'] = "portrait-hero.png";
                this['title'] = "Fighter";
            }

            levelUp(level:number):void {
                super.levelUp(level);
            }
        }
    }
}
