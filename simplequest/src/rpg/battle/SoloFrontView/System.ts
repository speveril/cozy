///<reference path="uiBattleScreen.ts"/>

module RPG.BattleSystem.SoloFrontView {
    export class System {
        fightMusic:Cozy.Music                   = null;
        fightSound:Cozy.Sound                   = null;
        victoryMusic:Cozy.Music                 = null;
        monsters:any                            = null;
        renderPlane:Cozy.RenderPlane            = null;
        uiPlane:Cozy.UiPlane                    = null;
        gameOver:any                            = null;

        combatants:Array<Character>             = null;
        bouncyComponent:RPG.BouncyComponent     = null;

        constructor(args:any) {
            this.fightMusic = RPG.music[args.fightMusic] || null;
            this.fightSound = RPG.sfx[args.fightSound] || null;
            this.victoryMusic = RPG.music[args.victoryMusic] || null;
            this.monsters = args.monsters || {};
            this.gameOver = args.gameOver || Cozy.quit;

            this.renderPlane = <Cozy.RenderPlane>Cozy.addPlane(Cozy.RenderPlane, { className: 'battle-render' });
            this.renderPlane.container.classList.add('hide');
            this.renderPlane.hide();

            this.uiPlane = <Cozy.UiPlane>Cozy.addPlane(Cozy.UiPlane, { className: 'battle-ui' });
            this.uiPlane.hide();
        }

        *start(args:any) {
            //// SET UP

            this.uiPlane.clear();
            this.renderPlane.clear();
            this.renderPlane.container.classList.add('hide');

            var music = Cozy.Audio.currentMusic;
            if (this.fightSound) this.fightSound.play();
            if (this.fightMusic) this.fightMusic.start();

            var player = RPG.Party.members[0].character;
            var monster = new RPG.Character(this.monsters[args.enemy]);
            this.combatants = [player, monster];

            var battleScreen = new uiBattleScreen(player, monster);
            this.uiPlane.addChild(battleScreen);

            let monsterLayer = this.renderPlane.addRenderLayer();
            let bgSprite = new Cozy.Sprite({
                texture: args.scene,
                position: { x: 80, y: 0 }
            });
            let monsterSprite = new Cozy.Sprite({
                texture: this.monsters[args.enemy].image,
                position: { x: -320, y: 0 }
            });
            monsterLayer.add(bgSprite);
            monsterLayer.add(monsterSprite);

            battleScreen.update(0);

            this.uiPlane.show();
            this.renderPlane.show();

            this.renderPlane.bringToFront();
            RPG.uiPlane.bringToFront();
            this.uiPlane.bringToFront();
            this.renderPlane.container.classList.add('hide');

            this.bouncyComponent = new RPG.BouncyComponent();
            this.uiPlane.addChild(this.bouncyComponent);

            Cozy.Input.debounce('confirm');

            //// LOOP

            var result = null;
            var battleOutcome:any = null;
            var dt:any = 0;

            yield *RPG.Scene.waitFrame(1);
            this.renderPlane.container.classList.remove('hide');
            yield *RPG.Scene.waitTime(0.25);

            const v = 400 / 0.25;
            let d = 0;

            while (monsterSprite.position.x < 80) {
                dt = yield;
                d = v * dt;

                monsterSprite.adjustPosition(d, 0);
            }
            battleScreen.go();

            monsterSprite.setPosition(80, 0);

            RPG.Textbox.show("Encountered " + monster.name + "!");

            // TODO sounds should be passed into the configuration somehow, or something like that
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
                        monster.hp -= result.damage;
                        switch (result.type) {
                            case 'crit':
                                RPG.sfx['battle_playerhit'].play();
                                this.output(`\nYou score a critical hit on the ${monster.name}! It takes ${result.damage} damage.`);
                                monsterSprite.quake(0.5, { x: 7, y: 2 }, { x: 14, y: 4 });
                                this.bouncyComponent.show(result.damage.toString());
                                break;
                            case 'hit':
                                RPG.sfx['battle_playerhit'].play();
                                this.output(`\nYou hit the ${monster.name}! It takes ${result.damage} damage.`);
                                monsterSprite.quake(0.5, { x: 5, y: 1 }, { x: 10, y: 2 });
                                this.bouncyComponent.show(result.damage.toString());
                                break;
                            case 'weak':
                                this.output(`\nYou hit the ${monster.name}, but it's a weak hit. It takes ${result.damage} damage.`);
                                RPG.sfx['battle_playerweakhit'].play();
                                monsterSprite.quake(0.5, { x: 3, y: 0 }, { x: 6, y: 0 });
                                this.bouncyComponent.show(result.damage.toString());
                                break;
                            case 'miss':
                                RPG.sfx['battle_playermiss'].play();
                                this.output(`\nYou miss the ${monster.name}.`);
                                this.bouncyComponent.show("miss");
                                break;
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
                            case 'crit':
                                RPG.sfx['battle_playerhit'].play(); // TODO
                                battleScreen.shake();
                                this.output(`\nThe ${monster.name} scores a critical hit on you! You take ${result.damage} damage.`);
                                break;
                            case 'hit':
                                RPG.sfx['battle_playerhit'].play(); // TODO
                                battleScreen.shake();
                                this.output(`\nThe ${monster.name} hits you! You take ${result.damage} damage.`);
                                break;
                            case 'weak':
                                RPG.sfx['battle_playerweakhit'].play(); // TODO
                                battleScreen.shake();
                                this.output(`\nThe ${monster.name} hits you, but it's a weak hit. You take ${result.damage} damage.`);
                                break;
                            case 'miss':
                                RPG.sfx['battle_playermiss'].play(); // TODO
                                this.output(`\nThe ${monster.name} attacks, but misses you.`);
                                break;
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
                yield;
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

        statCheck(stat:number) {
            return Math.random() < (stat / 100);
        }

        curveRoll(min:number, max:number) {
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

        resolveAttack(attacker:Character, defender:Character):any {
            var result:any = {
                type: 'hit',
                damage: attacker.get('damage')
            };

            if (this.statCheck(defender.get('dodge'))) {
                result.type = 'miss';
            } else {
                if (this.statCheck(defender.get('block'))) {
                    result.type = 'weak';
                }
                if (this.statCheck(attacker.get('critical'))) {
                    result.type = (result.type === 'weak' ? 'hit' : 'crit');
                }
            }

            switch (result.type) {
                case 'miss':
                    result.damage *= 0; break;
                case 'weak':
                    result.damage *= this.curveRoll(0, 0.5); break;
                case 'hit':
                    result.damage *= this.curveRoll(0.75, 1.25); break;
                case 'crit':
                    result.damage *= this.curveRoll(2, 3); break;
            }

            result.damage *= Math.min(1, Math.max(0, 1 - (defender.get('defense') / 100)));

            result.damage = Math.round(Math.max(0, result.damage));
            //
            //
            // var attackRange:number = attacker.get('attack') + defender.get('dodge');
            // var attackRoll:number = (Math.random() * attackRange) | 0;
            //
            // if (attackRoll >= defender.get('dodge')) {
            //     var damageRange:number = attacker.get('critical') + attacker.get('damage') + defender.get('defense');
            //     var damageRoll:number = (Math.random() * damageRange) | 0;
            //
            //     if (damageRoll >= defender.get('defense') + attacker.get('damage')) {
            //         result.type = 'crit';
            //         result.damage = Math.max(1, (attacker.get('damage') * (2.0 + Math.random())) | 0);
            //     } else if (damageRoll >= defender.get('defense')) {
            //         result.type = 'hit';
            //         result.damage = Math.max(1, (attacker.get('damage') * (1.0 + Math.random() - 0.5)) | 0);
            //     } else {
            //         result.type = 'weak';
            //         result.damage = (attacker.get('damage') * (Math.random() / 2)) | 0;
            //     }
            // } else {
            //     result.type = 'miss';
            //     result.damage = 0;
            // }

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
            return { success: (Math.random() < 0.6) };

            // var result:any = {};
            //
            // var fleeRange:number = runner.get('dodge') + chaser.get('dodge') + 2;
            // var fleeRoll:number = (Math.random() * fleeRange) | 0;
            //
            // if (fleeRoll >= chaser.get('dodge') + 1) {
            //     result.success = true;
            // } else {
            //     result.success = false;
            // }
            //
            // return result;
        }

        isCombatant(ch:Character):boolean {
            return this.combatants.indexOf(ch) !== -1;
        }
    }
}
