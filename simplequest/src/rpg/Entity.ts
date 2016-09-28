module RPG {
    export class Entity {
        private spriteDef:any; // can be an object or a string
        private paused:boolean;

        public triggersEvents:boolean;
        public respectsObstructions:boolean;
        public name:string;
        public behavior:any;

        public sprite:Egg.Sprite;
        public layer:MapLayer;
        public speed:number;
        public radius:number;

        public spawn:PIXI.Point;

        get dir():string {
            return this.sprite.animation.slice(-1);
        }

        get position():PIXI.Point {
            return this.sprite.position;
        }

        constructor(args) {
            this.spriteDef = args.sprite;
            this.speed = args.speed || 100;
            this.triggersEvents = (args.triggersEvents !== undefined ? args.triggersEvents : false);
            this.respectsObstructions = (args.respectsObstructions !== undefined ? args.respectsObstructions : true);
            this.radius = args.radius || args.sprite.radius || 8;
            this.name = args.name;
            this.behavior = args.behavior && RPG.Behavior[args.behavior] ? RPG.Behavior[args.behavior](this) : undefined;
            this.paused = false;
        }

        place(x:number, y:number, lyr:MapLayer):void {
            if (this.sprite) {
                this.layer.displayLayer.remove(this.sprite);
            } else {
                this.sprite = new Egg.Sprite(this.spriteDef);
            }

            this.sprite.setPosition(x, y);
            this.layer = lyr;
            this.layer.displayLayer.add(this.sprite);

            if (!_.contains(this.layer.entities, this)) {
                this.layer.entities.push(this);
            }
        }

        adjust(dx:number, dy:number):void {
            this.sprite.setPosition(this.sprite.position.x + dx, this.sprite.position.y + dy);
        }

        destroy() {
            var index = this.layer.entities.indexOf(this);
            this.layer.entities.splice(index, 1);
            this.sprite.layer.remove(this.sprite);
        }

        update(dt:number) {
            if (!this.paused && this.behavior) {
                var result = this.behavior.next(dt);
                if (result.done) {
                    this.behavior = result.value;
                }
            }
        }

        pause() {
            this.paused = true;
        }

        unpause() {
            this.paused = false;
        }

        move(dx:number, dy:number):void {
            var tx = Math.floor(this.position.x / this.layer.map.tileSize.x),
                ty = Math.floor(this.position.y / this.layer.map.tileSize.y);

            if (dy !== 0 || dx !== 0) {
                if (dx < 0 && Math.abs(dx) > Math.abs(dy)) this.sprite.animation = "walk_l";
                else if (dx > 0 && Math.abs(dx) > Math.abs(dy)) this.sprite.animation = "walk_r";
                else if (dy < 0) this.sprite.animation = "walk_u";
                else if (dy > 0) this.sprite.animation = "walk_d";

                if (!this.respectsObstructions) {
                    this.sprite.adjustPosition(dx, dy);
                    return;
                }

                var ang;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var travelled = 0;
                var iter = 0;
                var d;
                var obstructions = this.layer.obstructions, o = [];
                var entities = this.layer.entities;
                var i:number, j:number, e:any;

                while (travelled < 0.999 && iter < 20) {
                    iter++;

                    var projectedPosition = { x: this.sprite.position.x + dx * (1 - travelled), y: this.sprite.position.y + dy * (1 - travelled) };

                    o = [];
                    for (i = 0; i < obstructions.length; i++) {
                        if (!obstructions[i].active) {
                            continue;
                        }
                        var closest = Trig.closestPointOnLine(projectedPosition, obstructions[i].a, obstructions[i].b);
                        d = Math.sqrt(Trig.dist2(projectedPosition, closest));
                        if (d < this.radius) {
                            e = { d: d, type: 'line', a: obstructions[i].a, b: obstructions[i].b };
                            o.splice(_.sortedIndex(o, e, (x) => x.d), 0, e);
                        }
                    }

                    for (i = 0; i < entities.length; i++) {
                        if (entities[i] === this) continue;

                        d = Math.sqrt(Trig.dist2(projectedPosition, entities[i].position));

                        // TODO set stationary to false if the entity is moving
                        var stationary = true;

                        // short circuit if we're at more than 1.5 x the radius of the entity -- theoretically this
                        // "should" be 1 if in motion, and 1.414(etc.) if not, but this is good enough for a first pass
                        if (d > (entities[i].radius + this.radius) * 1.5) continue;

                        // treat stationary entities as squares, and moving ones as circles
                        if (stationary) {
                            var entityX = entities[i].position.x;
                            var entityY = entities[i].position.y;
                            var entityR = entities[i].radius;
                            var edges = [
                                [ { x: entityX - entityR, y: entityY - entityR }, { x: entityX + entityR, y: entityY - entityR } ],
                                [ { x: entityX + entityR, y: entityY - entityR }, { x: entityX + entityR, y: entityY + entityR } ],
                                [ { x: entityX - entityR, y: entityY + entityR }, { x: entityX + entityR, y: entityY + entityR } ],
                                [ { x: entityX - entityR, y: entityY - entityR }, { x: entityX - entityR, y: entityY + entityR } ]
                            ];
                            for (j = 0; j < edges.length; j++) {
                                var closest = Trig.closestPointOnLine(projectedPosition, edges[j][0], edges[j][1]);
                                d = Math.sqrt(Trig.dist2(projectedPosition, closest));
                                if (d < this.radius) {
                                    e = { d: d, type: 'line', a: edges[j][0], b: edges[j][1] };
                                    o.splice(_.sortedIndex(o, e, (x) => x.d), 0, e);
                                }
                            }
                        } else {
                            if (d < this.radius + entities[i].radius) {
                                e = { d: d - entities[i].radius, type: 'circ', x: entities[i].sprite.position.x, y: entities[i].sprite.position.y, r: entities[i].radius };
                                o.splice(_.sortedIndex(o, e, (x) => x.d), 0, e);
                            }
                        }
                    }

                    for (i = 0; i < o.length; i++) {
                        if (o[i].type === 'line') {
                            closest = Trig.closestPointOnLine(projectedPosition, o[i].a, o[i].b);
                            d = Math.sqrt(Trig.dist2(projectedPosition, closest));
                            ang = Math.atan2(projectedPosition.y - closest.y, projectedPosition.x - closest.x);
                        } else if (o[i].type === 'circ') {
                            d = Math.sqrt(Trig.dist2(projectedPosition, { x: o[i].x, y: o[i].y })) - o[i].r;
                            ang = Math.atan2(projectedPosition.y -  o[i].y, projectedPosition.x -  o[i].x);
                        }
                        if (this.radius - d > 0) {
                            projectedPosition.x += Math.cos(ang) * (this.radius - d);
                            projectedPosition.y += Math.sin(ang) * (this.radius - d);
                        }
                    }

                    d = Math.sqrt(Trig.dist2(this.sprite.position, projectedPosition));
                    if (d === 0) break;

                    travelled += d / dist;

                    this.sprite.setPosition(projectedPosition.x, projectedPosition.y);
                }
            } else {
                this.sprite.animation = this.sprite.animation.replace('walk', 'stand');
            }

            if (this.triggersEvents) {
                var tx_ = Math.floor(this.position.x / this.layer.map.tileSize.x),
                    ty_ = Math.floor(this.position.y / this.layer.map.tileSize.y);

                if (tx !== tx_ || ty !== ty_) {
                    _.each(this.layer.events, function(e) {
                        if (e.active && e.rect.contains(this.sprite.position.x, this.sprite.position.y) && this.layer.map[e.name]) {
                            this.layer.map[e.name]({
                                entity: this,
                                event: e,
                                x: this.sprite.position.x, y: this.sprite.position.y,
                                tx: Math.floor(this.sprite.position.x / this.layer.map.tileSize.x), ty: Math.floor(this.sprite.position.y / this.layer.map.tileSize.y)
                            });
                        }
                    }.bind(this));
                }
            }
        }
    }
}
