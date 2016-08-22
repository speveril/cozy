module SimpleQuest {
    var threats:any = {
        "forest_A": {
            "dist_min": 25,
            "dist_max": 100,
            "scene": "ui/battle/scene_test.png",
            "enemies": [ "blueslime", "blueslime", "skellington" ]
        },
        "forest_B": {
            "dist_min": 20,
            "dist_max": 50,
            "scene": "ui/battle/scene_test.png",
            "enemies": [ "skellington", "skellington", "stabber" ]
        },
        "forest_C": {
            "dist_min": 25,
            "dist_max": 85,
            "scene": "ui/battle/scene_test.png",
            "enemies": [ "stabber" ]
        }
    };

    export class Map extends RPG.Map {
        static persistent:any = {};

        private threatGroup:string;
        private nextBattle:number;
        private lastPlayerPosition:PIXI.Point;
        private onetimeSwitches:any;
        public music:Egg.Music;

        open() {
            super.open();

            if (!Map.persistent[this.filename]) {
                Map.persistent[this.filename] = {};
            }

            _.each(Map.persistent[this.filename].smashedPots, function(coords) {
                var tx = coords[0], ty = coords[1];
                _.each(this.layers, function(lyr:RPG.MapLayer, i) {
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
                _.each(this.layers, function(lyr:RPG.MapLayer, i) {
                    var t = lyr.getTile(tx, ty);
                    if (t == 37) {
                        lyr.setTile(tx, ty, t + 3);
                    }
                }.bind(this));
            }.bind(this));

            this.threatGroup = null;
        }

        update(dt) {
            super.update(dt);

            if (this.threatGroup) {
                var d = dist(this.lastPlayerPosition, RPG.player.position);
                this.nextBattle -= d;

                if (this.nextBattle < 0) {
                    var groupDef = threats[this.threatGroup];
                    var enemy = groupDef.enemies[Math.floor(Math.random() * groupDef.enemies.length)];
                    this.nextBattle = this.tileSize.x * (groupDef['dist_min'] + Math.random() * groupDef['dist_max']);

                    RPG.Battle.start({ enemy: enemy, scene: groupDef.scene });
                }

                this.lastPlayerPosition.x = RPG.player.position.x;
                this.lastPlayerPosition.y = RPG.player.position.y;
            }
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
                        sfx['thud'].play();
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

            var key = RPG.Party.hasItem(keyName);
            if (key) {
                RPG.Scene.do(function*() {
                    Map.persistent[this.filename][name + "__opened"] = true;
                    yield* this.waitCenteredTextbox(`Used ${key.item.makeIconString()}${key.item.name}.`);
                    this.doDoor(name)
                }.bind(this));
            } else {
                RPG.Scene.do(function*() {
                    yield* this.waitTextbox(null, [message || "This door is locked, and you don't have the key."]);
                }.bind(this));
            }
        }

        doSwitchDoor(switchName, message?) {
            if (Map.persistent[this.filename][switchName + '__switched']) return;

            RPG.Scene.do(function*() {
                yield* this.waitTextbox(null, [message || "There is no obvious way to open this door."]);
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
                yield* this.waitTextbox(null, [message || "Something opened in the distance."]);
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

        *waitLevers(tiles:any) {
            console.log(tiles);
            _.each(tiles, (tile) => {
                this.layers[1].setTile(tile[0], tile[1], this.layers[1].getTile(tile[0], tile[1]) + 1);
            });
            sfx['chnk'].play();
            yield* RPG.Scene.waitTime(0.5);

            _.each(tiles, (tile) => {
                this.layers[1].setTile(tile[0], tile[1], this.layers[1].getTile(tile[0], tile[1]) + 1);
            });
            sfx['chnk'].play();
            yield* RPG.Scene.waitTime(0.5);
        }

        *waitTextbox(speaker, lines:string[]) {
            for(var i = 0; i < lines.length; i++) {
                if (i === 0) {
                    if (speaker) {
                        RPG.Textbox.show(`<span class="speaker">${speaker}:</span> ${lines[i]}`);
                    } else {
                        RPG.Textbox.show(lines[i]);
                    }
                } else {
                    RPG.Textbox.box.appendText("\n" + lines[i]);
                }

                yield* RPG.Scene.waitButton("confirm");
                Egg.Input.debounce("confirm");
            }

            RPG.Textbox.hide();
        }

        *waitCenteredTextbox(text:string) {
            RPG.Textbox.show(`<div class="__c"><div class="__c_i">${text}</div></div>`);
            yield* RPG.Scene.waitButton("confirm");
            Egg.Input.debounce("confirm");
            RPG.Textbox.hide();
        }

        set_threat(args) {
            var group = args.event.properties['group'];
            if (group === 'null') group = null;

            if (this.threatGroup !== args.event.properties['group']) {
                this.threatGroup = args.event.properties['group'];

                if (this.threatGroup !== null) {
                    var groupDef = threats[this.threatGroup];
                    this.nextBattle = this.tileSize.x * (groupDef['dist_min'] + Math.random() * groupDef['dist_max']);
                    this.lastPlayerPosition = new PIXI.Point(RPG.player.position.x, RPG.player.position.y);
                } else {
                    this.nextBattle = null;
                    this.lastPlayerPosition = null;
                }
            }
        }

        open_door(args) {
            var t = this.layers[1].getTile(args.tx, args.ty);
            if (t == 5) {
                SimpleQuest.sfx['thud'].play();
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
                sfx['hit'].play();

                if (smashed.length === Map.persistent[this.filename].potCount) {
                    RPG.Scene.do(function*() {
                        yield* this.waitTextbox(null, ["You've broken all the pots."]);
                        yield* this.waitTextbox(null, ["Are you proud of yourself now?"]);
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
                RPG.centerCameraOn(RPG.player.position);

                _.each(this.layers, (lyr:RPG.MapLayer) => {
                    console.log(lyr.displayLayer);
                });

                yield* RPG.Scene.waitFadeFrom("black", 0.2);
            }.bind(this));

        }

        trigger_well(args) {
            RPG.Scene.do(function*() {
                SimpleQuest.sfx['restore'].play();
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
                            var item = RPG.Item.lookup(itemkey);
                            RPG.Party.addItem(itemkey, count);

                            if (count > 1) {
                                yield* this.waitCenteredTextbox(`Found ${item.makeIconString()}${item.name} x${count}!`);
                            } else {
                                yield* this.waitCenteredTextbox(`Found ${item.makeIconString()}${item.name}!`);
                            }
                        }
                    }.bind(this));
                } else {
                    RPG.Scene.do(function*() {
                        yield* this.waitCenteredTextbox(`The chest was empty!\n<span style="font-size:60%">How disappointing.</font>`);
                    }.bind(this));
                }
            } else {
                RPG.Scene.do(function*() {
                    yield* this.waitCenteredTextbox("The chest is empty.");
                }.bind(this));
            }
        }

        map_switch(m, x, y) {
            RPG.Scene.do(function*() {
                yield* RPG.Scene.waitFadeTo("black", 0.2);

                if (m.music && m.music !== Egg.Audio.currentMusic) {
                    Egg.Audio.currentMusic.stop();
                    m.music.start();
                }
                RPG.startMap(m, x, y);

                yield* RPG.Scene.waitFadeFrom("black", 0.2);
            }.bind(this));
        }

        switch_layers(args) {
            var spriteLayer = RPG.player.layer;

            if (RPG.player.dir === 'u') {
                spriteLayer = this.getLayerByName("#spritelayer-upper");
            } else if (RPG.player.dir === 'd') {
                spriteLayer = this.getLayerByName("#spritelayer");
            }

            if (spriteLayer !== RPG.player.layer) {
                RPG.player.place(RPG.player.position.x, RPG.player.position.y, spriteLayer);
            }
        }
    }
}
