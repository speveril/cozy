var battleHTML = `
    <div class="left-sidebar">
        <div><span class="name"></span></div>
        <div>HP <span class="hp"></span></div>
        <div class="right-align">/<span class="maxhp"></span></div>
    </div>

    <div class="right-sidebar menu">
        <ul class="selections"></ul>
    </div>
`;

module RPG {
    export enum AttackResult { Miss, Weak, Normal, Critical  };
    export class Battle {
        static active:boolean = false;
        static resolve:()=>void;
        static enemy:Character;
        static player:Character;
        static monsters:any;
        static monsterLayer:Egg.Layer;
        static monsterSprite:Egg.Sprite;

        static defaultFightMusic:Egg.Music;
        static defaultVictoryMusic:Egg.Music;
        static savedMusic:Egg.Music;

        static menuSelection:number;
        static menu = [ "Fight", "Item", "Flee" ];

        static start(args):Promise<any> {
            if (!args.enemy) throw new Error("Battle.start() called with no enemy");
            if (!args.scene) throw new Error("Battle.start() called with no scene");

            this.player = Party.members[0].character;
            this.enemy = new Character(this.monsters[args.enemy]);

            this.savedMusic = Egg.Audio.currentMusic;
            this.defaultFightMusic.start();

            return new Promise(function(resolve, reject) {
                this.resolve = resolve;
                this.active = true;

                RPG.controlStack.push(RPG.ControlMode.Battle);

                this.monsterLayer = RPG.battleRenderPlane.addRenderLayer();
                this.monsterLayer.add(new Egg.Sprite({
                    texture: args.scene,
                    position: { x: 82, y: 15}
                }));
                this.monsterSprite = new Egg.Sprite({
                    texture: this.monsters[args.enemy].image,
                    position: { x: 82, y: 15}
                });
                this.monsterLayer.add(this.monsterSprite);

                var ui = document.createElement('div');
                ui.innerHTML = battleHTML;
                RPG.battleUiPlane.container.appendChild(ui);

                var actionsMenu = <HTMLElement>(document.querySelector('.battle-ui .right-sidebar .selections'));
                for (var i = 0; i < this.menu.length; i++) {
                    var el = document.createElement('li');
                    el.innerHTML = this.menu[i];
                    actionsMenu.appendChild(el);
                }

                this.menuSelection = 0;
                RPG.Textbox.show("Encountered " + this.enemy.name + "!");
                this.updateUI();

                RPG.battleRenderPlane.show();
                RPG.battleUiPlane.show();
            }.bind(this));
        }

        static updateUI():void {
            var fields = ['name', 'hp', 'maxhp'];
            for (var i = 0; i < fields.length; i++) {
                var element = <HTMLElement>(document.querySelector('.battle-ui .left-sidebar .' + fields[i]))
                element.innerHTML = this.player[fields[i]];
            }

            var menuLIs = document.querySelectorAll('.battle-ui .right-sidebar li');
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
            if (Egg.Input.pressed('up')) {
                Egg.Input.debounce('up', 0.2);
                this.menuSelection = Egg.wrap(this.menuSelection - 1, 3);
                if (Menu.blip) {
                    Menu.blip.play();
                }
            }
            if (Egg.Input.pressed('down')) {
                Egg.Input.debounce('down', 0.2);
                this.menuSelection = Egg.wrap(this.menuSelection + 1, 3);
                if (Menu.blip) {
                    Menu.blip.play();
                }
            }
            if (Egg.Input.pressed('confirm')) {
                RPG.Menu.choose.play();
                Egg.Input.debounce('confirm');
                this.do(this.menu[this.menuSelection]);
            }

            this.updateUI();
        }

        static do(action:string):void {
            switch(this.menu[this.menuSelection]) {
                case 'Fight':
                    var menuSave = this.menuSelection;
                    this.menuSelection = -1;

                    RPG.Scene.do(function*() {
                        var result;

                        this.text("You attack the " + this.enemy.name + "!");
                        yield* RPG.Scene.waitTime(0.75);

                        result = this.resolveAttack(this.player, this.enemy);
                        if (result !== AttackResult.Miss) {
                            SimpleQuest.sfx['hit'].play(); // TODO don't use SimpleQuest, get this somewhere
                            this.monsterSprite.quake(0.25, { x: 10, y: 3 }, { x: 40, y: 12 });
                        }
                        yield* RPG.Scene.waitTime(0.75);

                        if (this.enemy.hp < 1) {
                            this.defaultVictoryMusic.start();

                            this.text("The " + this.enemy.name + " is destroyed!");
                            yield* RPG.Scene.waitTime(0.75);

                            this.text("You gained " + this.enemy.xp + " XP!");
                            Party.each(function(ch:Character) { ch.xp += this.enemy.xp; }.bind(this));

                            var money = this.enemy.treasure.money.resolve();
                            this.text("You found " + money + " " + RPG.moneyName + "!");
                            Party.money += money;

                            yield* RPG.Scene.waitButton('confirm');

                            Battle.end();
                            return;
                        }

                        this.text("The " + this.enemy.name + " attacks you!");
                        yield* RPG.Scene.waitTime(0.75);

                        result = this.resolveAttack(this.enemy, this.player);
                        yield* RPG.Scene.waitTime(0.75);

                        if (this.player.hp < 1) {
                            this.text("You have died!");
                            yield* RPG.Scene.waitFadeTo("black", 2.0);

                            Egg.quit(); // TODO this should actually be a gameover handler
                            return
                        } else {
                            this.menuSelection = menuSave;
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
            RPG.battleRenderPlane.hide();
            RPG.battleRenderPlane.clear();
            RPG.battleUiPlane.hide();
            RPG.battleUiPlane.clear();
            RPG.controlStack.pop();
            Textbox.hide();
            this.active = false;

            if (this.savedMusic) {
                this.savedMusic.start();
            } else {
                Egg.Audio.currentMusic.stop();
            }

            this.resolve();
        }

        static resolveAttack(attacker:Character, defender:Character):AttackResult {
            if (Math.random() * 100 < defender.get('evade')) {
                this.text(defender.name + " evades the attack!");
                return AttackResult.Miss;
            }

            var result:AttackResult;
            var damage = attacker.get('attack');
            if (Math.random() * 100 < attacker.get('critical')) {
                damage = ((damage * (3 + Math.random() * 2)) / 4) | 0;
                result = AttackResult.Critical;
            } else {
                damage -= (defender.get('defense') / 2) | 0;
                if (damage == 0) {
                    damage = ((Math.random() * attacker.get('attack')) / 10) | 0;
                    result = AttackResult.Weak;
                } else {
                    damage = ((damage * (3 + Math.random() * 2)) / 4) | 0;
                    result = AttackResult.Normal;
                }
            }
            if (damage > 0) {
                this.text("Hit! " + defender.name + " takes " + damage + " damage.");
            } else {
                result = AttackResult.Miss;
                this.text(attacker.name + " hit but didn't do any damage.");
            }

            defender.hp -= damage;

            return result;
        }

        static text(s:string) {
            Textbox.box.appendText("\n" + s);
        }

        static setMonsters(m:any) {
            this.monsters = m;
        }

        static setFightMusic(m:Egg.Music) {
            this.defaultFightMusic = m;
        }

        static setVictoryMusic(m:Egg.Music) {
            this.defaultVictoryMusic = m;
        }
    }
}
