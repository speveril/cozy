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
                    evade: 0
                });
            }
        }
    }
}
