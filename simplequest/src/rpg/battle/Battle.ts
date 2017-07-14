///<reference path="SoloFrontView/System.ts"/>

module RPG {
    export module BattleSystem {};

    export enum AttackResult { Miss, Weak, Normal, Critical  };
    export class Battle {
        static active:boolean = false;

        static start(args):Promise<any> {
            return new Promise((resolve, reject) => {
                RPG.Scene.do(function *() {
                    let result = yield *Battle.waitBattle(args);
                    resolve(result);
                });
            });
        }

        static *waitBattle(args) {
            Battle.active = true;
            let result = yield *RPG.battleSystem.start(args);
            Battle.active = false;
            return result;
        }

        static isCombatant(ch:RPG.Character):boolean {
            if (!Battle.active) return false;
            return RPG.battleSystem.isCombatant(ch);
        }
    }
}
