var battleHTML = `
    <style>
        .right-align { text-align: right; }

        .left-sidebar {
            width: 66px;
            height: 128px;
            position: absolute;
            top: 29px;
            left: 16px;
            padding: 4px;
            box-sizing: border-box;
        }
        .right-sidebar {
            width: 66px;
            height: 128px;
            position: absolute;
            top: 29px;
            right: 16px;
            left: initial;
            padding: 4px;
            box-sizing: border-box;
        }
    </style>

    <div class="left-sidebar">
        <div><span class="name"></span></div>
        <div>HP <span class="hp"></span></div>
        <div class="right-align">/<span class="maxhp"></span></div>
    </div>

    <div class="right-sidebar menu">
        <ul class="selections"></ul>
    </div>
`;

var monsters = {
    skellington: {
        name: "Skellington", hp: 5, maxhp: 5, attack: 3, defense: 2, critical: 1, evade: 1
    }
}

module RPG {
    export enum AttackResult { Miss, Weak, Normal, Critical  };
    export class Battle {

        static active:boolean = false;
        static resolve:()=>void;
        static savedControls:RPG.ControlMode;
        static enemy:Character;
        static player:Character;
        static battleText:string[];
        static monsterLayer:Egg.Layer;

        static menuSelection:number;
        static menu = [ "Fight", "Item", "Flee" ];

        static start(args):Promise<any> {
            if (!args.enemy) throw new Error("Battle.start() called with no enemy");
            if (!args.scene) throw new Error("Battle.start() called with no scene");

            this.player = Party.members[0].character;
            this.enemy = new Character(monsters[args.enemy]);

            return new Promise(function(resolve, reject) {
                this.resolve = resolve;
                this.active = true;

                this.savedControls = RPG.controls;
                RPG.controls = RPG.ControlMode.Battle;

                this.monsterLayer = RPG.battlePlane.addRenderLayer();
                this.monsterLayer.add(new Egg.Sprite({
                    texture: args.scene,
                    position: { x: 82, y: 15}
                }));

                var ui = document.createElement('div');
                ui.innerHTML = battleHTML;
                RPG.battlePlane.ui.appendChild(ui);

                var actionsMenu = <HTMLElement>(document.querySelector('.battle-plane .right-sidebar .selections'));
                for (var i = 0; i < this.menu.length; i++) {
                    var el = document.createElement('li');
                    el.innerHTML = this.menu[i];
                    actionsMenu.appendChild(el);
                }

                this.menuSelection = 0;
                RPG.Textbox.show("");
                this.battleText = [];
                this.text("Encountered " + this.enemy.name + "!");
                this.updateUI();

                RPG.battlePlane.show();
            }.bind(this));
        }

        static updateUI():void {
            var fields = ['name', 'hp', 'maxhp'];
            for (var i = 0; i < fields.length; i++) {
                var element = <HTMLElement>(document.querySelector('.battle-plane .left-sidebar .' + fields[i]))
                element.innerHTML = this.player[fields[i]];
            }

            var menuLIs = document.querySelectorAll('.battle-plane .right-sidebar li');
            for (var i = 0; i < menuLIs.length; i++) {
                var el = <HTMLElement>menuLIs[i];
                if (i === this.menuSelection) {
                    el.className = 'active';
                } else {
                    el.className = '';
                }
            }
        }

        static update(dt:number):void {
            if (Egg.button('up')) {
                Egg.debounce('up', 0.2);
                this.menuSelection = Egg.wrap(this.menuSelection - 1, 3);
                if (Menu.blip) {
                    Menu.blip.play();
                }
            }
            if (Egg.button('down')) {
                Egg.debounce('down', 0.2);
                this.menuSelection = Egg.wrap(this.menuSelection + 1, 3);
                if (Menu.blip) {
                    Menu.blip.play();
                }
            }
            if (Egg.button('confirm')) {
                Egg.debounce('confirm');
                this.do(this.menu[this.menuSelection]);
            }

            this.updateUI();
        }

        static do(action:string):void {
            switch(this.menu[this.menuSelection]) {
                case 'Fight':
                    var menuSave = this.menuSelection;
                    this.menuSelection = -1;
                    RPG.Scene.start()
                        .then(function() {
                            this.text("You attack the " + this.enemy.name + "!");
                            return RPG.Scene.waitForTime(0.75);
                        }.bind(this))
                        .then(function() {
                            var result = this.resolveAttack(this.player, this.enemy);
                            return RPG.Scene.waitForTime(0.75);
                        }.bind(this))
                        .then(function() {
                            if (this.enemy.hp < 1) {
                                this.text("The " + this.enemy.name + " is destroyed!");
                                return RPG.Scene.waitForTime(0.75);
                            } else {
                                this.text("The " + this.enemy.name + " attacks you!");
                                return RPG.Scene.waitForTime(0.75);
                            }
                        }.bind(this))
                        .then(function() {
                            if (this.enemy.hp < 1) {
                                // do nothing
                            } else {
                                var result = this.resolveAttack(this.enemy, this.player);
                                return RPG.Scene.waitForTime(0.75);
                            }
                        }.bind(this))
                        .then(function() {
                            if (this.player.hp < 1) {
                                this.text("You have died!");
                                return RPG.Scene.waitForFadeOut(2.0, "#000");
                            } else if (this.enemy.hp < 1) {
                                RPG.Scene.finish();
                                Battle.end();
                            } else {
                                this.menuSelection = menuSave;
                                RPG.Scene.finish();
                            }
                        }.bind(this))
                        .then(function() {
                            if (this.player.hp === 0) {
                                Egg.quit();
                            }
                        }.bind(this));
                    break;
                case 'Item':
                    this.text("You don't have any items!");
                    break;
                case 'Flee':
                    this.text("You can't run!");
                    break;
            }

            if (Menu.choose) {
                Menu.choose.play();
            }
        }

        static end():void {
            RPG.battlePlane.hide();
            RPG.battlePlane.clear();
            RPG.battlePlane.ui.innerHTML = "";
            RPG.controls = this.savedControls;
            Textbox.hide();
            this.active = false;
            this.resolve();
        }

        static resolveAttack(attacker:Character, defender:Character):AttackResult {
            if (Math.random() * 100 < defender.evade) {
                this.text(defender.name + " evades the attack!");
                return AttackResult.Miss;
            }

            var result:AttackResult;
            var damage = attacker.attack;
            if (Math.random() * 100 < attacker.critical) {
                damage = ((damage * (3 + Math.random() * 2)) / 4) | 0;
                this.text("Critical hit! " + defender.name + " takes " + damage + " damage.");
                result = AttackResult.Critical;
            } else {
                damage -= (defender.defense / 2) | 0;
                if (damage == 0) {
                    damage = ((Math.random() * attacker.attack) / 10) | 0;
                    this.text("Weak hit! " + defender.name + " takes " + damage + " damage.");
                    result = AttackResult.Weak;
                } else {
                    damage = ((damage * (3 + Math.random() * 2)) / 4) | 0;
                    this.text("A hit! " + defender.name + " takes " + damage + " damage.");
                    result = AttackResult.Normal;
                }
            }

            defender.hp -= damage;

            return result;
        }

        static text(s:string) {
            this.battleText.push(s);
            while (this.battleText.length > 3) {
                this.battleText.shift();
            }
            Textbox.setText(this.battleText.join("\n"));
        }
    }
}

window['runTest'] = function() {
    function attack(attacker, defender) {
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
