///<reference path="uiBattleScreen.ts"/>

module RPG.BattleSystem.SoloFrontView {
    export class System {
        fightMusic:Cozy.Music                   = null;
        victoryMusic:Cozy.Music                 = null;
        monsters:any                            = null;
        renderPlane:Cozy.RenderPlane            = null;
        uiPlane:Cozy.UiPlane                    = null;
        gameOver:any                            = null;

        combatants:Array<Character>             = null;
        bouncyComponent:RPG.BouncyComponent     = null;

        constructor(args:any) {
            this.fightMusic = RPG.music[args.fightMusic] || null;
            this.victoryMusic = RPG.music[args.victoryMusic] || null;
            this.monsters = args.monsters || {};
            this.gameOver = args.gameOver || Cozy.quit;

            this.renderPlane = <Cozy.RenderPlane>Cozy.addPlane(Cozy.RenderPlane, { className: 'battle-render' });
            this.renderPlane.hide();

            this.uiPlane = <Cozy.UiPlane>Cozy.addPlane(Cozy.UiPlane, { className: 'battle-ui' });
            this.uiPlane.hide();
        }

        *start(args:any) {
            //// SET UP

            var music = Cozy.Audio.currentMusic;
            if (this.fightMusic) this.fightMusic.start();

            var player = RPG.Party.members[0].character;
            var monster = new RPG.Character(this.monsters[args.enemy]);
            this.combatants = [player, monster];

            var battleScreen = new uiBattleScreen(player, monster);
            this.uiPlane.addChild(battleScreen);

            let monsterLayer = this.renderPlane.addRenderLayer();
            monsterLayer.add(new Cozy.Sprite({
                texture: args.scene,
                position: { x: 80, y: 0}
            }));
            let monsterSprite = new Cozy.Sprite({
                texture: this.monsters[args.enemy].image,
                position: { x: 80, y: 0}
            });
            monsterLayer.add(monsterSprite);

            RPG.Textbox.show("Encountered " + monster.name + "!");
            battleScreen.update(0);

            this.uiPlane.show();
            this.renderPlane.show();

            this.renderPlane.bringToFront();
            RPG.uiPlane.bringToFront();
            this.uiPlane.bringToFront();

            this.bouncyComponent = new RPG.BouncyComponent();
            this.uiPlane.addChild(this.bouncyComponent);

            Cozy.Input.debounce('confirm');

            //// LOOP

            var result = null;
            var battleOutcome:any = null;
            var dt:any = 0;

            while (!battleOutcome) {
                //// PLAYER ACTION PHASE

                RPG.Menu.push(battleScreen.menu);
                while(!battleScreen.menu.done) {
                    dt = yield;
                    Menu.update(dt);
                }

                switch(battleScreen.menu.result.action) {
                    case 'fight':
                        result = this.resolveAttack(player, monster);
                        switch (result.type) {
                            case 'crit': this.output(`\nYou score a critical hit on the ${monster.name}! It takes ${result.damage} damage.`); break;
                            case 'hit':  this.output(`\nYou hit the ${monster.name}! It takes ${result.damage} damage.`); break;
                            case 'weak': this.output(`\nYou hit the ${monster.name}, but it's a weak hit. It takes ${result.damage} damage.`); break;
                            case 'miss': this.output(`\nYou miss the ${monster.name}.`); break;
                        }
                        monster.hp -= result.damage;
                        monsterSprite.quake(0.5, { x: 5, y: 1 }, { x: 10, y: 2 });
                        if (result.type === 'miss') {
                            this.bouncyComponent.show("miss");
                        } else {
                            this.bouncyComponent.show(result.damage.toString());
                        }
                        break;
                    case 'item':
                        var item = battleScreen.menu.result.item;
                        this.output(`\nYou use ${item.iconHTML}${item.name}.`);
                        if (!item.def.useEffect) {
                            this.output(`\nYou can't use that!`);
                        } else {
                            var target = item.def.useEffect._target === 'enemy' ? monster : player;
                            result = item.activate(target)
                            if (result.success) {
                                this.outputItemResult(target, result);
                            } else {
                                this.output(`\nIt doesn't seem to work.`);
                            }
                        }
                        break;
                    case 'flee':
                        this.output(`\nYou attempt to escape.`);
                        result = this.resolveFlee(player, monster);
                        if (result.success) battleOutcome = { playerEscaped: true };
                        else this.output(`\nYou can't get away!`);
                        break;
                }

                yield* RPG.Scene.waitTime(0.75);

                if (monster.hp <= 0) battleOutcome = { victory: true };
                if (battleOutcome) break;

                //// MONSTER ACTION PHASE

                var monsterAction = this.monsterThink();
                switch(monsterAction) {
                    case 'fight':
                        result = this.resolveAttack(monster, player);
                        switch (result.type) {
                            case 'crit': this.output(`\nThe ${monster.name} scores a critical hit on you! You take ${result.damage} damage.`); break;
                            case 'hit':  this.output(`\nThe ${monster.name} hits you! You take ${result.damage} damage.`); break;
                            case 'weak': this.output(`\nThe ${monster.name} hits you, but it's a weak hit. You take ${result.damage} damage.`); break;
                            case 'miss': this.output(`\nThe ${monster.name} attacks, but misses you.`); break;
                        }
                        player.hp -= result.damage;
                        break;
                    case 'flee':
                        this.output(`\nThe ${monster.name} tries to run away.`);
                        result = this.resolveFlee(monster, player);
                        if (result.success) battleOutcome = { monsterEscaped: true };
                        else this.output(`\nIt doesn't get away!`);
                        break;
                }

                yield* RPG.Scene.waitTime(0.75);

                if (player.hp < 1) battleOutcome = { defeat: true };
                if (battleOutcome) break;
            }

            //// RESOLUTION PHASE

            if (battleOutcome.defeat) {
                this.output("\nYou have died!");
                Cozy.Audio.currentMusic.stop(2.0);
                yield* RPG.Scene.waitFadeTo("black", 2.0);

                Cozy.Input.debounce('confirm');
                this.renderPlane.hide();
                this.uiPlane.hide();
                this.renderPlane.clear();
                RPG.Textbox.hide();

                this.gameOver();
                return;
            } else if (battleOutcome.victory) {
                if (this.victoryMusic) this.victoryMusic.start();

                this.output(`\nThe ${monster.name} is defeated!`);
                yield* RPG.Scene.waitTime(0.75);

                this.output(`\nYou gained ${monster.xp} XP!`);
                Party.each(function(ch:Character) { ch.xp += monster.xp; }.bind(this));

                var money = monster.treasure.money.resolve();
                this.output(`\nYou found ${money} ${RPG.moneyName}!`);
                Party.money += money;

                // TODO non-monetary treasure
            } else if (battleOutcome.playerEscaped) {
                // TODO sound
                this.output(`\nYou escaped!`);
            } else if (battleOutcome.monsterEscaped) {
                // TODO sound
                this.output(`\nThe ${monster.name} escaped!`);
            }

            //// CLEAN UP

            yield* RPG.Scene.waitButton('confirm');
            this.combatants = [];

            if (music) music.start();

            Cozy.Input.debounce('confirm');

            this.renderPlane.hide();
            this.uiPlane.hide();

            this.renderPlane.clear();

            RPG.Textbox.hide();
        }

        output(s) {
            RPG.Textbox.box.appendText(s);
        }

        monsterThink() {
            // TODO
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

        outputItemResult(target:Character, result:any) {
            if (Party.isInParty(target)) {
                if (_.has(result, 'hpChange')) {
                    if (result.hpChange > 0) this.output(`\nYou gain ${result.hpChange} health!`);
                    if (result.hpChange < 0) this.output(`\nYou take ${-result.hpChange} damage!`);
                }
            } else {
                if (_.has(result, 'hpChange')) {
                    if (result.hpChange > 0) this.output(`\nThe ${target.name} gains ${result.hpChange} health!`);
                    if (result.hpChange < 0) this.output(`\nThe ${target.name} takes ${-result.hpChange} damage!`);
                }
            }
        }

        resolveFlee(runner:Character, chaser:Character):any {
            var result:any = {};

            var fleeRange:number = runner.get('evade') + chaser.get('evade') + 2;
            var fleeRoll:number = (Math.random() * fleeRange) | 0;

            if (fleeRoll >= chaser.get('evade') + 1) {
                result.success = true;
            } else {
                result.success = false;
            }

            return result;
        }

        isCombatant(ch:Character):boolean {
            return this.combatants.indexOf(ch) !== -1;
        }
    }
}
