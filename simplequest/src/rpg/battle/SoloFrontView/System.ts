///<reference path="uiBattleScreen.ts"/>

module RPG.BattleSystem.SoloFrontView {
    export class System {
        fightMusic:Egg.Music            = null;
        victoryMusic:Egg.Music          = null;
        monsters:any                    = null;
        renderPlane:Egg.RenderPlane     = null;
        uiPlane:Egg.UiPlane             = null;

        monsterLayer:Egg.Layer          = null;
        monsterSprite:Egg.Sprite        = null;

        constructor(args:any) {
            this.fightMusic = RPG.music[args.fightMusic] || null;
            this.victoryMusic = RPG.music[args.victoryMusic] || null;
            this.monsters = args.monsters || {};

            this.renderPlane = <Egg.RenderPlane>Egg.addPlane(Egg.RenderPlane, { className: 'battle-render' });
            this.renderPlane.hide();

            this.uiPlane = <Egg.UiPlane>Egg.addPlane(Egg.UiPlane, { className: 'battle-ui' });
            this.uiPlane.hide();
        }

        *start(args:any) {
            var music = Egg.Audio.currentMusic;
            if (this.fightMusic) this.fightMusic.start();

            var player = RPG.Party.members[0].character;
            var monster = new RPG.Character(this.monsters[args.enemy]);

            var battleScreen = new uiBattleScreen();
            this.uiPlane.addChild(battleScreen);

            this.monsterLayer = this.renderPlane.addRenderLayer();
            this.monsterLayer.add(new Egg.Sprite({
                texture: args.scene,
                position: { x: 80, y: 0}
            }));
            this.monsterSprite = new Egg.Sprite({
                texture: this.monsters[args.enemy].image,
                position: { x: 80, y: 0}
            });
            this.monsterLayer.add(this.monsterSprite);

            RPG.Textbox.show("Encountered " + monster.name + "!");
            battleScreen.updateFields(player);

            this.uiPlane.show();
            this.renderPlane.show();

            this.renderPlane.bringToFront();
            RPG.uiPlane.bringToFront();
            this.uiPlane.bringToFront();

            Egg.Input.debounce('confirm');

            var defeat = false;
            var victory = false;
            var attack = null;
            var dt:any = 0;

            while (!victory && !defeat) {
                RPG.Menu.push(battleScreen.menu);

                while(!battleScreen.menu.done) {
                    var dt = yield;
                    battleScreen.menu.update(dt);
                }

                switch(battleScreen.menu.result) {
                    case 'fight':
                        attack = this.resolveAttack(player, monster);
                        switch (attack.type) {
                            case 'crit':
                                this.output(`\nYou score a critical hit on the ${monster.name}! It takes ${attack.damage} damage.`);
                                break;
                            case 'hit':
                                this.output(`\nYou hit the ${monster.name}! It takes ${attack.damage} damage.`);
                                break;
                            case 'weak':
                                this.output(`\nYou hit the ${monster.name}, but it's a weak hit. It takes ${attack.damage} damage.`);
                                break;
                            case 'miss':
                                this.output(`\nYou miss the ${monster.name}.`);
                                break;
                        }

                        monster.hp -= attack.damage;

                        if (monster.hp <= 0) {
                            victory = true;
                        }
                        break;
                }
                battleScreen.updateFields(player);
                yield* RPG.Scene.waitTime(0.75);

                if (victory) break;

                var monsterAction = this.monsterThink();
                switch(monsterAction) {
                    case 'fight':
                    attack = this.resolveAttack(monster, player);

                    switch (attack.type) {
                        case 'crit':
                            this.output(`\nThe ${monster.name} scores a critical hit on you! You take ${attack.damage} damage.`);
                            break;
                        case 'hit':
                            this.output(`\nThe ${monster.name} hits you! You take ${attack.damage} damage.`);
                            break;
                        case 'weak':
                            this.output(`\nThe ${monster.name} hits you, but it's a weak hit. You take ${attack.damage} damage.`);
                            break;
                        case 'miss':
                            this.output(`\nThe ${monster.name} attacks, but misses you.`);
                            break;
                    }

                    player.hp -= attack.damage;

                    if (player.hp < 1) {
                        defeat = true;
                    }
                    break;
                }
                battleScreen.updateFields(player);
                yield* RPG.Scene.waitTime(0.75);

                if (defeat) break;
            }

            if (defeat) {
                this.output("\nYou have died!");
                yield* RPG.Scene.waitFadeTo("black", 2.0);

                Egg.quit(); // TODO this should actually be a gameover handler
            } else if (victory) {
                if (this.victoryMusic) this.victoryMusic.start();

                this.output(`\nThe ${monster.name} is defeated!`);
                yield* RPG.Scene.waitTime(0.75);

                this.output(`\nYou gained ${monster.xp} XP!`);
                Party.each(function(ch:Character) { ch.xp += monster.xp; }.bind(this));

                var money = monster.treasure.money.resolve();
                this.output(`\nYou found ${money} ${RPG.moneyName}!`);
                Party.money += money;

                yield* RPG.Scene.waitButton('confirm');
                if (music) music.start();
            }

            Egg.Input.debounce('confirm');

            this.renderPlane.hide();
            this.uiPlane.hide();

            this.renderPlane.clear();

            RPG.Textbox.hide();
        }

        output(s) {
            RPG.Textbox.box.appendText(s);
        }

        monsterThink() {
            return "fight";
        }

        resolveAttack(attacker:Character, defender:Character):any {
            var result:any = {};

            var attackRange:number = attacker.get('attack') + defender.get('evade');
            var attackRoll:number = (Math.random() * attackRange) | 0;

            if (attackRoll >= defender.get('evade')) {
                var damageRange:number = attacker.get('critical') + attacker.get('damage') + defender.get('defense');
                var damageRoll:number = (Math.random() * damageRange) | 0;

                if (damageRoll >= defender.get('defense') + attacker.get('damage')) {
                    result.type = 'crit';
                    result.damage = Math.max(1, (attacker.get('damage') * (2.0 + Math.random())) | 0);
                } else if (damageRoll >= defender.get('defense')) {
                    result.type = 'hit';
                    result.damage = Math.max(1, (attacker.get('damage') * (1.0 + Math.random() - 0.5)) | 0);
                } else {
                    result.type = 'weak';
                    result.damage = (attacker.get('damage') * (Math.random() / 2)) | 0;
                }
            } else {
                result.type = 'miss';
                result.damage = 0;
            }

            return result;
        }
    }
}
