///<reference path="SoloFrontView/System.ts"/>

module RPG {
    export module BattleSystem {};

    export enum AttackResult { Miss, Weak, Normal, Critical  };
    export class Battle {
        static active:boolean = false;

        static start(args):Promise<any> {
            return new Promise((resolve, reject) => {
                RPG.Scene.do(function *() {
                    yield *Battle.waitBattle(args);
                    resolve();
                });
            });
        }

        static *waitBattle(args) {
            Battle.active = true;
            yield *RPG.battleSystem.start(args);
            Battle.active = false;
        }

        static isCombatant(ch:RPG.Character):boolean {
            if (!Battle.active) return false;
            return RPG.battleSystem.isCombatant(ch);
        }
    }
}
