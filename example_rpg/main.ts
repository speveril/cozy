///<reference path="../resources/default_app/Egg.d.ts" />

module SimpleQuest {
    export var sershaSprite:Egg.Sprite;
    var debug:number;

    // -- start up --
    export function start() {
        // scrape all images under the project
        var textures = {};
        var directories = ['.'];

        while (directories.length > 0) {
            var dir = directories.shift();
            var files = Egg.Directory.read(dir);
            _.each(files, function(f) {
                var fullPath = dir + "/" + f;
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
        var layer1 = Egg.addLayer();
        console.log(Egg.textures);
        sershaSprite = new Egg.Sprite({
            texture: Egg.textures['sprites/sersha.png'],
            position: { x:0.5, y:0.5 },
            frameSize: { x:16, y:16 }
        });
        layer1.add(sershaSprite);

        var layer2 = Egg.addLayer();
        var textboxSprite = new Egg.Sprite({
            texture: Egg.textures['sprites/textbox.png'],
            position: { x:0, y:190 }
        })
        layer2.add(textboxSprite);

        debug = 0;
        Egg.unpause();
    }

    // -- per-frame funcs --
    export function frame(dt) {
        debug += dt;

        if (Math.floor(debug - dt) !== Math.floor(debug))
            sershaSprite.frame = 1 + (Math.floor(debug) % 4);
    }

}

module.exports = SimpleQuest;
