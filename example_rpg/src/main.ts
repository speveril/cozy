///<reference path="../../resources/default_app/Egg.d.ts" />

module SimpleQuest {
    var sershaSprite:Egg.Sprite;

    // -- start up --
    export function start() {
        // scrape all images under the project
        var textures = {};
        var directories = ['.'];

        var skip = ["src_image"];
        while (directories.length > 0) {
            var dir = directories.shift();
            var files = Egg.Directory.read(dir);
            _.each(files, function(f) {
                var fullPath = dir + "/" + f;
                var stats = Egg.File.stat(fullPath);
                if (stats.isDirectory()) {
                    if (_.contains(skip, f)) return;
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
        var layer1 = Egg.addLayer();

        sershaSprite = new Egg.Sprite({
            texture: 'sprites/sersha.png',
            position: { x:10*16, y:7*16 },
            frameSize: { x:16, y:16 },
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
        layer1.add(sershaSprite);

        // var layer2 = Egg.addLayer();
        // var textboxSprite = new Egg.Sprite({
        //     texture: 'sprites/textbox.png',
        //     position: { x:0, y:190 }
        // })
        // layer2.add(textboxSprite);

        Egg.unpause();
    }

    // -- per-frame funcs --
    export function frame(dt) {
        var speed = 64,
            dx = 0,
            dy = 0;

        if (Egg.button('up')) dy -= speed * dt;
        if (Egg.button('down')) dy += speed * dt;
        if (Egg.button('left')) dx -= speed * dt;
        if (Egg.button('right')) dx += speed * dt;

        if (dy !== 0 || dx !== 0) {
            if (dx < 0) sershaSprite.animation = "walk_l";
            if (dx > 0) sershaSprite.animation = "walk_r";
            if (dy < 0) sershaSprite.animation = "walk_u";
            if (dy > 0) sershaSprite.animation = "walk_d";

            sershaSprite.adjustPosition(dx, dy);
        } else {
            sershaSprite.animation = sershaSprite.animation.replace('walk', 'stand');
        }
    }

}

module.exports = SimpleQuest;
