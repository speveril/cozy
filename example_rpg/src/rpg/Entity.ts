// obstruction utils
// http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
function sqr(x) { return x * x }
function dist(v, w) { return Math.sqrt(dist2(v, w)); }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function closestPointOnLine(p, v, w) {
    var len = dist2(v, w);
    if (len === 0) return v;
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / len;
    if (t < 0) return v;
    if (t > 1) return w;
    return {
        x: v.x + t * (w.x - v.x),
        y: v.y + t * (w.y - v.y)
    };
}
function distToSegmentSquared(p, v, w) { return dist2(p, closestPointOnLine(p, v, w)); }
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

module RPG {
    export class Entity {
        private spriteDef:any; // can be an object or a string
        public triggersEvents:boolean;
        public respectsObstructions:boolean;

        public sprite:Egg.Sprite;
        public layer:MapLayer;
        public speed:number;
        public radius:number;

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
        }

        move(dx:number, dy:number):void {
            var i, ang = 0;

            if (dy !== 0 || dx !== 0) {
                if (dx < 0 && dy === 0) this.sprite.animation = "walk_l";
                if (dx > 0 && dy === 0) this.sprite.animation = "walk_r";
                if (dy < 0) this.sprite.animation = "walk_u";
                if (dy > 0) this.sprite.animation = "walk_d";

                if (!this.respectsObstructions) {
                    this.sprite.adjustPosition(dx, dy);
                    return;
                }

                var ang = Math.atan2(dy, dx);
                var dist = Math.sqrt(dx * dx + dy * dy);
                var travelled = 0;
                var iter = 0;
                var d;
                var obstructions = this.layer.obstructions;

                while (travelled < 0.999 && iter < 20) {
                    iter++;

                    var projectedPosition = { x: this.sprite.position.x + dx * (1 - travelled), y: this.sprite.position.y + dy * (1 - travelled) };

                    for (i = 0; i < obstructions.length; i++) {
                        if (!obstructions[i].active) {
                            continue;
                        }
                        var closest = closestPointOnLine(projectedPosition, obstructions[i].a, obstructions[i].b);
                        d = Math.sqrt(dist2(projectedPosition, closest));
                        if (d < this.radius) {
                            var ang = Math.atan2(projectedPosition.y - closest.y, projectedPosition.x - closest.x);
                            projectedPosition.x += Math.cos(ang) * (this.radius - d);
                            projectedPosition.y += Math.sin(ang) * (this.radius - d);
                        }
                    }

                    d = Math.sqrt(dist2(this.sprite.position, projectedPosition));
                    if (d === 0) break;

                    travelled += d / dist;

                    this.sprite.setPosition(projectedPosition.x, projectedPosition.y);
                }
            } else {
                this.sprite.animation = this.sprite.animation.replace('walk', 'stand');
            }

            if (this.triggersEvents) {
                _.each(this.layer.events, function(e) {
                    if (e.rect.contains(this.sprite.position.x, this.sprite.position.y)) {
                        if (this.layer.map[e.name]) {
                            this.layer.map[e.name]({
                                sprite: this,
                                event: e,
                                x: this.sprite.position.x, y: this.sprite.position.y,
                                tx: Math.floor(this.sprite.position.x / this.layer.map.tileSize.x), ty: Math.floor(this.sprite.position.y / this.layer.map.tileSize.y)
                            });
                        }
                    }
                }.bind(this));
            }
        }
    }
}
