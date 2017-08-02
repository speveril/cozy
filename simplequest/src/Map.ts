module SimpleQuest {
    export class Map extends RPG.Map.Map {
        public music:Cozy.Music;
        public battleScene:string;

        persisted(k):boolean {
            return Map.persistent[this.filename][k];
        }

        persist(k:string, v?:any):void {
            if (v === undefined) v = true;
            Map.persistent[this.filename][k] = v;
        }

        open() {
            super.open();

            if (!Map.persistent[this.filename]) {
                Map.persistent[this.filename] = {};
            }

            _.each(Map.persistent[this.filename].smashedPots, function(coords) {
                var tx = coords[0], ty = coords[1];
                _.each(this.layers, function(lyr:RPG.Map.MapLayer, i) {
                    var t = lyr.getTile(tx, ty);
                    if (t == 53) {
                        lyr.setTile(tx, ty, t + 3);
                    }

                    var tr = lyr.getTriggerByPoint((tx + 0.5) * this.tileSize.x, (ty + 0.5) * this.tileSize.y);
                    if (tr && tr.name === 'smash_pot') {
                        tr.solid = false;
                        tr.active = false;
                    }
                }.bind(this));
            }.bind(this));

            _.each(Map.persistent[this.filename].openedChests, function(coords) {
                var tx = coords[0], ty = coords[1];
                _.each(this.layers, function(lyr:RPG.Map.MapLayer, i) {
                    var t = lyr.getTile(tx, ty);
                    if (t == 37) {
                        lyr.setTile(tx, ty, t + 3);
                    }
                }.bind(this));
            }.bind(this));

            Map.persistent[this.filename].completedFights = Map.persistent[this.filename].completedFights || [];
            _.each(Map.persistent[this.filename].completedFights, (mapID:string) => {
                this.entityLookup[mapID].destroy();
            });

            if (this.music && this.music !== Cozy.Audio.currentMusic) {
                Cozy.Audio.currentMusic.stop();
                this.music.start();
            }
        }

        finish() {
            super.finish();
            Map.persistent[this.filename].completedFights = [];
        }

        doFight(args) {
            RPG.Scene.do(function*() {
                yield *this.waitFight(args.target);
            }.bind(this));
        }

        *waitFight(entity, options?:any) {
            var opts = options ? options : {};

            var scene = this.battleScene || 'ui/battle/scene_placeholder.png';

            let result = yield *RPG.Battle.waitBattle({
                enemy: entity.params.monster,
                scene: scene,
                noFlee: (entity.params.noFlee === 'true')
            });

            if (result.playerEscaped) {
                entity.behavior = RPG.Behavior.stun(entity, 2, entity.behavior);
            } else if (!opts.leaveEntity) {
                Map.persistent[this.filename].completedFights.push(entity.mapID);
                entity.destroy();
            }
        }

        entityFacePlayerAndPause(e:RPG.Entity) {
            e.pause();
            e.sprite.animation = 'stand';
            e.sprite.direction = RPG.player.dir - 180;
        }

        doDoor(name) {
            var doors = this.getAllTriggersByName(name);

            if (doors.length < 1) {
                throw new Error(`Couldn't find '${name}' trigger.`);
            }

            _.each(doors, (door) => {
                var tx = door.tx,
                    ty = door.ty,
                    x, y;

                for (y = 0; y < door.th; y++) {
                    for (x = 0; x < door.tw; x++) {
                        RPG.sfx['thud'].play();
                        this.layers[1].setTile(tx + x, ty + y, this.layers[1].getTile(tx + x, ty + y) + 1);
                    }
                }

                door.solid = false;
            });
        }

        doKeyDoor(name, keyName, message?) {
            if (!keyName) {
                this.doDoor(name);
            }

            if (Map.persistent[this.filename][name + "__opened"]) return;

            var key = RPG.Party.inventory.has(keyName);
            if (key) {
                RPG.Scene.do(function*() {
                    Map.persistent[this.filename][name + "__opened"] = true;
                    yield* this.waitCenteredTextbox(`Used ${key.iconHTML}${key.name}.`);
                    this.doDoor(name)
                }.bind(this));
            } else {
                RPG.Scene.do(function*() {
                    yield* RPG.Scene.waitTextbox(null, [message || "This door is locked, and you don't have the key."]);
                }.bind(this));
            }
        }

        doSwitchDoor(switchName, message?) {
            if (Map.persistent[this.filename][switchName + '__switched']) return;

            RPG.Scene.do(function*() {
                yield* RPG.Scene.waitTextbox(null, [message || "There is no obvious way to open this door."]);
            }.bind(this));
        }

        doSwitch(switchName, doorName?, message?) {
            if (Map.persistent[this.filename][switchName + '__switched']) return;

            Map.persistent[this.filename][switchName + '__switched'] = true;

            var triggers = this.getAllTriggersByName(switchName);

            RPG.Scene.do(function*() {
                yield *this.waitLevers(_.map(triggers, (tr) => [tr.tx,tr.ty]));
                if (doorName) {
                    this.doDoor(doorName);
                }
                yield* RPG.Scene.waitTextbox(null, [message || "Something opened in the distance."]);
            }.bind(this))
        }

        fixDoor(name) {
            var doors = this.getAllTriggersByName(name);

            if (doors.length < 1) {
                throw new Error(`Couldn't find '${name}' trigger.`);
            }

            _.each(doors, (door) => {
                var x, y;

                for (y = 0; y < door.th; y++) {
                    for (x = 0; x < door.tw; x++) {
                        this.layers[1].setTile(door.tx + x, door.ty + y, this.layers[1].getTile(door.tx + x, door.ty + y) + 3);
                    }
                }

                door.solid = false;
            });
        }

        fixSwitch(name) {
            if (Map.persistent[this.filename][name + '__switched']) {
                var triggers = this.getAllTriggersByName(name);
                _.each(triggers, (trigger) => {
                    this.layers[1].setTile(trigger.tx, trigger.ty, this.layers[1].getTile(trigger.tx, trigger.ty) + 2);
                });
            }
        }

        fixKeyDoor(name) {
            if (Map.persistent[this.filename][name + "__opened"]) {
                this.fixDoor(name);
            }
        }

        fixSwitchDoor(switchName, doorName) {
            if (Map.persistent[this.filename][switchName + '__switched']) {
                this.fixSwitch(switchName);
                this.fixDoor(doorName);
            }
        }

        *waitChoice(topic, choices:string[]|{[key:string]: string}) {
            var choicesHTML = _.reduce(choices, (str, ch, index) => str + `<li data-menu="choose" data-index="${index}">${ch}</li>`, '');
            var m = new RPG.Menu({
                className: '__ch inline-choice menu selections scrollable',
                tagName: 'ul',
                html: choicesHTML
            });

            var returnValue = null;
            m['choose'] = (e) => {
                returnValue = e.getAttribute('data-index');
                RPG.Menu.pop();
            };

            RPG.Textbox.show(topic);
            RPG.Textbox.box.addChild(m, '.inner-text');
            RPG.Menu.push(m);
            while (!m.done) {
                yield;
            }
            RPG.Textbox.hide();

            return returnValue;
        }

        *waitLevers(tiles:any) {
            _.each(tiles, (tile) => {
                this.layers[1].setTile(tile[0], tile[1], this.layers[1].getTile(tile[0], tile[1]) + 1);
            });
            RPG.sfx['chnk'].play();
            yield* RPG.Scene.waitTime(0.5);

            _.each(tiles, (tile) => {
                this.layers[1].setTile(tile[0], tile[1], this.layers[1].getTile(tile[0], tile[1]) + 1);
            });
            RPG.sfx['chnk'].play();
            yield* RPG.Scene.waitTime(0.5);
        }

        *waitCenteredTextbox(text:string) {
            RPG.Textbox.show(`<div class="__c"><div class="__c_i">${text}</div></div>`);
            yield* RPG.Scene.waitButton("confirm");
            Cozy.Input.debounce("confirm");
            RPG.Textbox.hide();
        }

        *waitShop(args) {
            Cozy.Input.debounce('menu');
            Cozy.Input.debounce('cancel');
            var m = new SimpleQuest.Menu.ShopMenu(args);
            RPG.uiPlane.addChild(m);
            RPG.Menu.push(m);
            while (!m.done) {
                yield;
            }
            m.remove();
        }

        open_door(args) {
            var t = this.layers[1].getTile(args.tx, args.ty);
            if (t == 5) {
                RPG.sfx['thud'].play();
                this.layers[1].setTile(args.tx, args.ty, 6);
            }
        }

        smash_pot(args) {
            var smashed = Map.persistent[this.filename].smashedPots;
            if (!smashed) {
                smashed = Map.persistent[this.filename].smashedPots = [];

                Map.persistent[this.filename].potCount = 0;
                _.each(this.layers, function(lyr) {
                    _.each(lyr.triggers, function(t) {
                        if (t.name === 'smash_pot') {
                            Map.persistent[this.filename].potCount++;
                        }
                    }.bind(this));
                }.bind(this));
            }

            if (!_.find(smashed, function(o) { return o[0] === args.tx && o[1] === args.ty; })) {
                _.each(this.layers, function(lyr) {
                    var t = lyr.getTile(args.tx, args.ty);
                    if (t == 53) {
                        lyr.setTile(args.tx, args.ty, t + 1);
                    }
                }.bind(this));

                smashed.push([args.tx, args.ty]);
                args.trigger.solid = false;
                args.trigger.active = false;
                RPG.sfx['hit'].play();

                if (smashed.length === Map.persistent[this.filename].potCount) {
                    RPG.Scene.do(function*() {
                        yield* RPG.Scene.waitTextbox(null, ["You've broken all the pots."]);
                        yield* RPG.Scene.waitTextbox(null, ["Are you proud of yourself now?"]);
                    }.bind(this));
                }
            }
        }

        teleport(args) {
            var pos = args.event.properties.to.split(','),
                x = parseInt(pos[0], 10),
                y = parseInt(pos[1], 10),
                z = pos.length > 2 ? this.getLayerByName(pos[2]) : RPG.player.layer;

            RPG.Scene.do(function*() {
                yield* RPG.Scene.waitFadeTo("black", 0.2);

                RPG.player.place((x + 0.5) * RPG.map.tileSize.x, (y + 0.5) * RPG.map.tileSize.y, z);
                RPG.centerCameraOn(RPG.player.position, true);

                _.each(this.layers, (lyr:RPG.Map.MapLayer) => {
                    console.log(lyr.displayLayer);
                });

                yield* RPG.Scene.waitFadeFrom("black", 0.2);
            }.bind(this));

        }

        trigger_well(args) {
            RPG.Scene.do(function*() {
                RPG.sfx['restore'].play();
                RPG.Party.each(function(ch:RPG.Character) {
                    ch.hp = ch.maxhp;
                });
                yield* this.waitCenteredTextbox("HP restored!");
            }.bind(this));
        }

        open_chest(args) {
            var opened = Map.persistent[this.filename].openedChests;
            if (!opened) {
                opened = Map.persistent[this.filename].openedChests = [];
            }

            if (!_.find(opened, function(o) { return o[0] === args.tx && o[1] === args.ty; })) {
                _.each(this.layers, function(lyr) {
                    var t = lyr.getTile(args.tx, args.ty);
                    if (t == 37) {
                        lyr.setTile(args.tx, args.ty, t + 1);
                    }
                }.bind(this));

                opened.push([args.tx, args.ty]);

                if (args.trigger.properties.contents) {
                    RPG.Scene.do(function*() {
                        var itemkey = args.trigger.properties.contents;
                        var count = parseInt(args.trigger.properties.count, 10) || 1;

                        if (itemkey === '#money') {
                            RPG.Party.money += count;
                            yield* this.waitCenteredTextbox(`Found ${count} ${RPG.moneyName}!`);
                        } else {
                            var items = RPG.Party.inventory.add(itemkey, count);

                            if (count > 1) {
                                yield* this.waitCenteredTextbox(`Found ${items[0].iconHTML}${items[0].name} x${count}!`);
                            } else {
                                yield* this.waitCenteredTextbox(`Found ${items[0].iconHTML}${items[0].name}!`);
                            }
                        }
                    }.bind(this));
                } else {
                    RPG.Scene.do(function*() {
                        yield* this.waitCenteredTextbox(`The chest was empty!\n<span style="font-size:60%">How disappointing.</span>`);
                    }.bind(this));
                }
            } else {
                RPG.Scene.do(function*() {
                    yield* this.waitCenteredTextbox("The chest is empty.");
                }.bind(this));
            }
        }

        switch_layers(args) {
            var spriteLayer = RPG.player.layer;

            if (RPG.player.dir > 180) {
                spriteLayer = this.getLayerByName("#spritelayer-upper");
            } else {
                spriteLayer = this.getLayerByName("#spritelayer");
            }

            if (spriteLayer !== RPG.player.layer) {
                RPG.player.place(RPG.player.position.x, RPG.player.position.y, spriteLayer);
            }
        }
    }
}
