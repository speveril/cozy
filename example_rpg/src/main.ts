///<reference path="../../resources/default_app/Egg.d.ts" />
///<reference path="Map.ts"/>

module SimpleQuest {
    var sershaSprite:Egg.Sprite;
    var map:Map;
    var spriteLayer:MapLayer;
    var graphics:PIXI.Graphics;

    // -- start up --
    export function start() {
        // scrape all images under the project
        var textures = {};
        var directories = ['.'];
        var skip = ["./src_image", "./map/tiles.png"];

        while (directories.length > 0) {
            var dir = directories.shift();
            var files = Egg.Directory.read(dir);
            _.each(files, function(f) {
                var fullPath = dir + "/" + f;
                if (_.contains(skip, fullPath)) return;

                var stats = Egg.File.stat(fullPath);
                if (stats.isDirectory()) {
                    directories.push(fullPath);
                    return;
                }

                var ext = Egg.File.extension(fullPath).toLowerCase();
                if (ext == '.png' || ext == '.jpg' || ext == '.gif') {
                    textures[fullPath.substr(2)] = fullPath;
                }
            }.bind(this));
        }

        Egg.loadTextures(textures, loaded);
    }

    function loaded() {
        map = Map.loadFromFile("map/town.tmx");
        map.open();

        sershaSprite = new Egg.Sprite({
            texture: 'sprites/sersha.png',
            position: { x:10*16, y:7*16 },
            frameSize: { x:16, y:16 },
            hotspot: { x:7.5, y:7.5 },
            animations: {
                stand_u: { loop: true, frames: [5] },
                stand_r: { loop: true, frames: [10] },
                stand_d: { loop: true, frames: [0] },
                stand_l: { loop: true, frames: [15] },
                walk_u: { loop: true, frames: [6, 7, 8, 9] },
                walk_r: { loop: true, frames: [11, 12, 13, 14] },
                walk_d: { loop: true, frames: [1, 2, 3, 4] },
                walk_l: { loop: true, frames: [16, 17, 18, 19] }
            },
            frameRate: 8,
            currentAnimation: 'stand_d'
        });
        spriteLayer = map.getLayerByName('#spritelayer');
        spriteLayer.displayLayer.add(sershaSprite);

        // var layer2 = Egg.addLayer();
        // var textboxSprite = new Egg.Sprite({
        //     texture: 'sprites/textbox.png',
        //     position: { x:0, y:190 }
        // })
        // layer2.add(textboxSprite);

        graphics = new PIXI.Graphics();
        graphics.fillAlpha = 0;

        Egg.unpause();
    }

    // -- per-frame funcs --
    export function frame(dt) {
        var i, dx = 0, dy = 0, ang = 0,
            speed = 64, radius = 8;

        if (Egg.button('up')) dy -= speed * dt;
        if (Egg.button('down')) dy += speed * dt;
        if (Egg.button('left')) dx -= speed * dt;
        if (Egg.button('right')) dx += speed * dt;

        if (dy !== 0 || dx !== 0) {
            if (dx < 0) sershaSprite.animation = "walk_l";
            if (dx > 0) sershaSprite.animation = "walk_r";
            if (dy < 0) sershaSprite.animation = "walk_u";
            if (dy > 0) sershaSprite.animation = "walk_d";

            // sershaSprite.adjustPosition(dx, dy);

            var ang = Math.atan2(dy, dx);

            // -- the magic --
            var dist = Math.sqrt(dx * dx + dy * dy);
            var travelled = 0;
            var iter = 0;
            var d;
            var obstructions = spriteLayer.obstructions;

            while (travelled < 0.999 && iter < 20) {
                iter++;

                var projectedPosition = { x: sershaSprite.position.x + dx * (1 - travelled), y: sershaSprite.position.y + dy * (1 - travelled) };

                for (i = 0; i < obstructions.length; i++) {
                    var closest = closestPointOnLine(projectedPosition, obstructions[i][0], obstructions[i][1]);
                    d = Math.sqrt(dist2(projectedPosition, closest));
                    if (d < radius) {
                        var ang = Math.atan2(projectedPosition.y - closest.y, projectedPosition.x - closest.x);
                        projectedPosition.x += Math.cos(ang) * (radius - d);
                        projectedPosition.y += Math.sin(ang) * (radius - d);
                    }
                }

                d = Math.sqrt(dist2(sershaSprite.position, projectedPosition));
                if (d === 0) break;

                travelled += d / dist;

                sershaSprite.setPosition(projectedPosition.x, projectedPosition.y);
            }
        } else {
            sershaSprite.animation = sershaSprite.animation.replace('walk', 'stand');
        }
    }

    // export function postRender(dt) {
    //     // DEBUG OBSTRUCTION DRAWING
    //     var obstructions = spriteLayer.obstructions;
    //
    //     graphics.clear();
    //     graphics.lineStyle(1, 0x00FF00);
    //     graphics.drawCircle(sershaSprite.position.x, sershaSprite.position.y, 8);
    //
    //     graphics.lineStyle(1, 0xFF0000);
    //     for (var i = 0; i < obstructions.length; i++) {
    //         graphics.moveTo(obstructions[i][0].x, obstructions[i][0].y);
    //         graphics.lineTo(obstructions[i][1].x, obstructions[i][1].y);
    //     }
    //
    //     Egg.renderer.clearBeforeRender = false;
    //     Egg.renderer.render(graphics);
    //     Egg.renderer.clearBeforeRender = true;
    // }

    // obstruction utils
    // http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
    function sqr(x) { return x * x }
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

}

module.exports = SimpleQuest;
