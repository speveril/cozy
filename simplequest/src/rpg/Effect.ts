module RPG {
    export class Effect {
        static heal(source:any, target:any, amount:number) {
            if (target.hp < target.maxhp) {
                target.hp = Math.min(target.maxhp, target.hp + amount);
                return true;
            }
            return false;
        }
    }
}
