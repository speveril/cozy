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

module SimpleQuest {
    export class Entity {
        private spriteDef:any; // can be an object or a string
        public triggersEvents:boolean;
        public sprite:Egg.Sprite;
        public layer:MapLayer;
        public speed:number;

        constructor(args) {
            this.spriteDef = args.sprite;
            this.speed = args.speed || 100;
            this.triggersEvents = args.triggersEvents || false;
        }

        place(x:number, y:number, lyr:MapLayer):void {
            this.sprite = new Egg.Sprite(this.spriteDef);
            this.sprite.setPosition(x, y);
            this.layer = lyr;
            this.layer.displayLayer.add(this.sprite);
        }

        move(dx:number, dy:number):void {
            var i, ang = 0, radius = 8;

            if (dy !== 0 || dx !== 0) {
                if (dx < 0 && dy === 0) this.sprite.animation = "walk_l";
                if (dx > 0 && dy === 0) this.sprite.animation = "walk_r";
                if (dy < 0) this.sprite.animation = "walk_u";
                if (dy > 0) this.sprite.animation = "walk_d";

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
                        var closest = closestPointOnLine(projectedPosition, obstructions[i][0], obstructions[i][1]);
                        d = Math.sqrt(dist2(projectedPosition, closest));
                        if (d < radius) {
                            var ang = Math.atan2(projectedPosition.y - closest.y, projectedPosition.x - closest.x);
                            projectedPosition.x += Math.cos(ang) * (radius - d);
                            projectedPosition.y += Math.sin(ang) * (radius - d);
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
        }
    }
}
