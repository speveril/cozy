module RPG {
    export class Effect {
        static do(effect:string, source:any, target:any, params:Array<any>) {
            if (this[effect]) {
                return this[effect].apply(null, [source, target].concat(params));
            } else {
                console.warn("! Bad effect", effect);
                console.trace();
            }
        }

        static heal(source:any, target:any, amount:number):any {
            if (target.hp < target.maxhp) {
                target.hp = Math.min(target.maxhp, target.hp + amount);
                return { success:true, hpChange:amount };
            }
            return { success: false };
        }

        static strike(source:any, target:any, type:string, damageRoll:string):any {
            // TODO check elemental weaknesses
            var damage = Dice.roll(source, damageRoll);
            target.hp -= damage;
            return { success:true, hpChange:-damage };
        }
    }
}
