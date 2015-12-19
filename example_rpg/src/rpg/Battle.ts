module RPG {
    export class Battle {
        static active:boolean = false;
        static resolve:()=>void;
        static savedControls:RPG.ControlMode;

        static start(args):Promise<any> {
            if (!args.enemy) throw new Error("Battle.start() called with no 'enemy'");

            return new Promise(function(resolve, reject) {
                this.resolve = resolve;
                this.active = true;

                console.log(">> Starting battle with " + args.enemy);
                this.savedControls = RPG.controls;
                RPG.controls = RPG.ControlMode.Battle;

                
            }.bind(this));
        }

        static update(dt:number):void {

        }

        static end():void {
            RPG.battlePlane.clear();
            RPG.controls = this.savedControls;
            this.active = false;
            this.resolve();
        }
    }
}

window['runTest'] = function() {
    function attack(attacker, defender) {
        console.log(attacker.name + " attacks " + defender.name + "!");

        if (Math.random() * 100 < defender.evade) {
            console.log(defender.name + " evades the attack!");
            return;
        }

        var damage = attacker.attack;
        if (Math.random() * 100 < attacker.critical) {
            damage = ((damage * (3 + Math.random() * 2)) / 4) | 0;
            console.log("Critical hit! " + defender.name + " takes " + damage + " damage.");
        } else {
            damage -= (defender.defense / 2) | 0;
            if (damage == 0) {
                damage = ((Math.random() * attacker.attack) / 10) | 0;
                console.log("Weak hit! " + defender.name + " takes " + damage + " damage.");
            } else {
                damage = ((damage * (3 + Math.random() * 2)) / 4) | 0;
                console.log("A hit! " + defender.name + " takes " + damage + " damage.");
            }
        }

        defender.hp -= damage;
    }

    var hero = { name: "Hero", hp: 100, attack: 5, defense: 5, critical: 0, evade: 0 };
    var a = { name: "Monster A", hp: 50, attack: 10, defense: 3, critical: 2, evade: 5 };
    var b = { name: "Monster B", hp: 50, attack: 6, defense: 10, critical: 12, evade: 0 };

    debugger;
}
