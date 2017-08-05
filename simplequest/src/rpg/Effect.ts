module RPG {
    export class Effect {
        static do(effect:string, source:any, target:any, params:Array<any>) {
            if (this[effect]) {
                return this[effect].apply(this, [source, target].concat(params));
            } else {
                console.warn("! Bad effect", effect);
                console.trace();
            }
        }

        // ---

        static heal(source:any, target:any, amount:number):any {
            if (target.hp < target.maxhp) {
                target.hp += amount;
                return { success:true, hpChange:amount };
            }
            return { success: false };
        }

        static strike(source:any, target:any, type:string, damageRoll:string):any {
            // TODO allow a dodge?
            let damage = target.modifiedDamage(Dice.roll(source, damageRoll), type);
            if (source.hasTrait('double_magic')) damage *= 2;
            target.hp -= damage;
            return { success:true, hpChange:-damage };
        }

        static doNothing(source:any, target:any, message:string) {
            return { success:true, message:message };
        }

        static flee():any {
            // should actually do the calcluation in here rather than resolveFlee() in System
            return {};
        }

        static basicAttack(attacker:Character, defender:Character, element:string="physical"):any {
            var result:any = {
                type: 'hit',
                hpChange: attacker.get('damage')
            };
            console.log("Damage:", result.hpChange);

            if (Effect.statCheck(defender.get('dodge'))) {
                result.type = 'miss';
            } else {
                if (Effect.statCheck(defender.get('block'))) {
                    result.type = 'weak';
                }
                if (Effect.statCheck(attacker.get('critical'))) {
                    result.type = (result.type === 'weak' ? 'hit' : 'crit');
                }
            }

            switch (result.type) {
                case 'miss':
                    result.hpChange *= 0; break;
                case 'weak':
                    result.hpChange *= Effect.curveRoll(0, 0.5); break;
                case 'hit':
                    result.hpChange *= Effect.curveRoll(0.75, 1.25); break;
                case 'crit':
                    result.hpChange *= Effect.curveRoll(2, 3); break;
            }
            console.log(">>", result.hpChange);

            result.hpChange = defender.modifiedDamage(result.hpChange, element);
            console.log(">>", result.hpChange);
            result.hpChange *= Math.min(1, Math.max(0, 1 - (defender.get('defense') / 100)));
            console.log(">>", result.hpChange);
            result.hpChange = -Math.round(Math.max(0, result.hpChange));
            console.log(">>", result.hpChange);

            defender.hp += result.hpChange;

            return result;
        }

        // Not actually effects...
        static statCheck(stat:number) {
            return Math.random() < (stat / 100);
        }

        static curveRoll(min:number, max:number) {
            let curve = (a,b,c) => {
                // median
                let m = Math.max(a,b,c);
                return (m === a ? Math.max(b,c) : (m === b ? Math.max(a,c) : Math.max(a,b)));
                //average
                // return (a+b+c) / 3;
            }
            let r = curve(Math.random(), Math.random(), Math.random());
            return min + (max - min + 1) * r;
        }
    }
}
