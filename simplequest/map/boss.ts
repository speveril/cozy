module SimpleQuest {
    export class Map_Boss extends SimpleQuest.Map {
        torches:any;
        switches:any;
        sequence:any;
        torchTiles:any;
        switchTiles:any;
        platform:any;
        platformHeight:number;
        dragon:any;
        spawnspots:Array<Array<number>>;

        constructor() {
            super('map/boss.tmx');
            this.music = RPG.music['boss'];
            this.battleScene = 'ui/battle/scene_cave.png';

            this.torchTiles = {
                none: 205,
                orange: 206,
                blue: 222,
                red: 238,
                green: 254
            };
            this.switchTiles = {
                orange: 17,
                blue: 33,
                red: 49,
                green: 65
            }
        }

        open() {
            super.open();

            this.torches = {};
            _.each(['a','b','c'], (lett) => {
                this.torches[lett] = this.getAllTriggersByName('torch_' + lett)[0];
            });

            this.switches = {};
            _.each(this.getAllTriggersByName('trigger_switch'), (sw) => {
                this.switches[sw.properties.color] = sw;
            });

            this.platform = this.getAllTriggersByName('platform')[0];
            this.platformHeight = 3;

            this.dragon = this.getAllEntitiesByName('dragon')[0];
        }

        start() {
            this.resetSwitches();
            this.newSequence();
        }

        exit_door(args) {
            RPG.Scene.do(function*() {
                yield *RPG.Scene.waitTextbox(null, ['The door is locked!']);
            }.bind(this))
        }

        leave_room(args) {
            SimpleQuest.gameWinSequence();
        }

        trigger_switch(args) {
            if (this.layers[1].getTile(args.tx, args.ty) !== this.switchTiles[args.trigger.properties.color]) {
                return;
            }
            RPG.Scene.do(function*() {
                yield *this.waitLevers([[args.trigger.tx, args.trigger.ty]]);

                if (args.trigger.properties.color === this.sequence[0]) {
                    var torchLetter = _.keys(this.torches)[3 - this.sequence.length];
                    this.layers[1].setTile(this.torches[torchLetter].tx, this.torches[torchLetter].ty, this.torchTiles[this.sequence[0]]);
                    this.sequence.shift();

                    if (this.sequence.length === 0) {
                        this.lowerPlatform();
                    }
                } else {
                    RPG.sfx['negative'].play();
                    this.resetSwitches();
                    this.newSequence();
                }
            }.bind(this));
        }

        lowerPlatform() {
            RPG.Scene.do(function*() {
                RPG.sfx['chnk'].play();

                this.platformHeight--;

                if (this.platformHeight > 0) {
                    this.platform.rect.y += this.tileSize.y;
                    this.dragon.adjust(0, this.tileSize.y);

                    var tx = this.platform.tx,
                        ty = this.platform.ty,
                        x, y;


                    for (y = this.platform.th - 1; y >= 0; y--) {
                        for (x = 0; x < this.platform.tw; x++) {
                            this.layers[1].setTile(tx + x, ty + y, this.layers[1].getTile(tx + x, ty + y - 1));
                            if (y === 0) this.layers[1].setTile(tx + x, ty - 1, 0);
                        }
                    }

                    for (x = 0; x < this.platform.tw; x++) {
                        this.layers[2].setTile(tx + x, ty - 1, this.layers[2].getTile(tx + x, ty - 2));
                        this.layers[2].setTile(tx + x, ty - 2, 0);

                        this.layers[2].setTile(tx + x, ty + this.platform.th, this.layers[2].getTile(tx + x, ty + this.platform.th - 1));
                        this.layers[2].setTile(tx + x, ty + this.platform.th - 1, 0);
                    }

                    for (y = this.platform.th; y >= -1; y--) {
                        this.layers[2].setTile(tx - 1, ty + y, this.layers[2].getTile(tx - 1, ty + y - 1));
                        this.layers[2].setTile(tx + this.platform.tw, ty + y, this.layers[2].getTile(tx + this.platform.tw, ty + y - 1));
                    }

                    this.resetSwitches();
                    this.newSequence();
                } else {
                    var tx = this.platform.tx,
                        ty = this.platform.ty,
                        x, y;

                    for (y = -1; y <= this.platform.th; y++) {
                        for (x = -1; x <= this.platform.tw; x++) {
                            if (y > -1 && x > -1 && x < this.platform.tw && y < this.platform.th) {
                                this.layers[1].setTile(tx + x, ty + y, 0);
                            }
                            this.layers[2].setTile(tx + x, ty + y, 0);
                        }
                    }

                    RPG.sfx['dragon_roar'].play();
                    this.dragon.sprite.animation = 'roar';
                    yield *RPG.Scene.waitTime(2.0);

                    RPG.sfx['dragon_roar'].play();
                    RPG.music['victory'].start();

                    var i, q = 0;
                    for (i = 0; i < 2.0; i += 1/16) {
                        this.dragon.adjust(-q, 0);
                        if (q > 0) {
                            q = -Math.random() * 2
                        } else {
                            q = Math.random() * 2;
                        }
                        this.dragon.adjust(q, 1);
                        this.dragon.sprite.setClip(
                            this.dragon.sprite.clip.y,
                            this.dragon.sprite.clip.x,
                            this.dragon.sprite.clip.width,
                            this.dragon.sprite.clip.height - 1
                        );
                        yield *RPG.Scene.waitTime(1/16);
                    }

                    this.dragon.destroy();

                    yield *this.waitCenteredTextbox('The dragon is defeated!');

                    this.doDoor('exit_door');
                }
            }.bind(this));
        }

        resetSwitches() {
            RPG.sfx['chnk'].play();
            _.each(this.switches, (sw, color) => {
                this.layers[1].setTile(sw['tx'], sw['ty'], this.switchTiles[color]);
            });
        }

        *dropSlimes(count:number = 1) {
            if (!this.spawnspots) {
                this.spawnspots = [];
                this.getAllEventsByName('slimespawn').forEach((e) => {
                    for (let y = this.tileSize.y / 2; y < e.rect.height; y += this.tileSize.y) {
                        for (let x = this.tileSize.x / 2; x < e.rect.width; x += this.tileSize.x) {
                            this.spawnspots.push([e.rect.x + Math.floor(x), e.rect.y + Math.floor(y)]);
                        }
                    }
                });
            }

            let lyr = this.layerLookup['#spritelayer'];
            let slimes = [];

            _.times(count, (i) => {
                let type = ['slime','blueslime','lavaslime'][(Math.random() * 3) | 0];
                let e = new RPG.Entity({
                    sprite: 'sprites/monster_' + type + '.sprite',
                    monster: type,
                    respectsObstructions: 'false',
                    speed: 10,
                    animation: 'stand'
                });

                let p = this.spawnspots[Math.floor(Math.random() * this.spawnspots.length)];
                let v = 100;

                e.place(p[0], p[1] - 240 + (i * 30), lyr);
                e.dir = 90;
                slimes.push([e,p[0],p[1],v]);
            });

            let done = false;
            while (!done) {
                let dt = yield;

                done = true;
                slimes.forEach((s) => {
                    s[0].adjust(0, s[3] * dt);
                    s[3] += dt * 250;

                    if (s[0].position.y > s[2]) {
                        s[0].place(s[1], s[2], lyr);
                        s[0].respectsObstructions = true;
                    } else {
                        done = false;
                    }
                });
            }

            slimes.forEach((s) => {
                s[0].behavior = RPG.Behavior['fight_wander'](s[0]);
            });
        }

        newSequence() {
            this.sequence = _.shuffle(['orange','blue','red','green']);
            this.sequence.pop();

            RPG.Scene.do(function*() {
                var letters = ['a','b','c'];

                RPG.sfx['dragon_roar'].play();
                this.dragon.sprite.animation = 'roar';
                yield *RPG.Scene.waitTime(1.0);
                for (var i = 0; i < letters.length; i++) {
                    var letter = letters[i];
                    this.layers[1].setTile(this.torches[letter].tx, this.torches[letter].ty, this.torchTiles.none);
                }
                yield *this.dropSlimes(3 + (3 - this.platformHeight));
                RPG.sfx['dragon_roar'].play();
                yield *RPG.Scene.waitTime(1.0);

                this.dragon.sprite.animation = 'stand';

                var time = (3 - this.platformHeight) * 0.25;
                for (var i = 0; i < letters.length; i++) {
                    var letter = letters[i];

                    RPG.sfx['chnk'].play();
                    this.layers[1].setTile(this.torches[letter].tx, this.torches[letter].ty, this.torchTiles[this.sequence[i]]);
                    yield* RPG.Scene.waitTime(0.5);

                    this.layers[1].setTile(this.torches[letter].tx, this.torches[letter].ty, this.torchTiles.none);
                }

                RPG.sfx['chnk'].play();
            }.bind(this))
        }
    }
}
