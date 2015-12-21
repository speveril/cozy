module SimpleQuest {
    export module Characters {
        export class Hero extends RPG.Character {
            constructor() {
                super({
                    name: "Hero",
                    sprite: "sprites/hero.sprite",
                    maxhp: 10,
                    attack: 4,
                    defense: 4,
                    critical: 2,
                    evade: 0,
                    levels: [ 0, 100, 200, 500, 1000, 2000, 5000, 10000 ]
                });

                this['portrait'] = "portrait-hero.png";
                this['title'] = "Ftr";
            }

            levelUp(level:number):void {
                super.levelUp(level);
                this.adjust({ attack: +2, defense: +1, maxhp: +3});
            }
        }
    }
}
