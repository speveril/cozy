///<reference path="../resources/default_app/Egg.d.ts" />

module SimpleQuest {
    // -- start up --
    export function start() {
        // scrape all images under the project
        var textures = {};
        var directories = ['.'];

        while (directories.length > 0) {
            var dir = directories.shift();
            var files = Egg.Directory.read(dir);
            _.each(files, function(f) {
                f = dir + "/" + f;
                var stats = Egg.File.stat(f);
                if (stats.isDirectory()) {
                    directories.push(f);
                    return;
                }

                var ext = Egg.File.extension(f).toLowerCase();
                if (ext == '.png' || ext == '.jpg' || ext == '.gif') {
                    textures[f] = f;
                }
            }.bind(this));
        }

        Egg.loadTextures(textures, loaded);
    }

    function loaded() {
        
    }

    // -- per-frame funcs --
    export function frame(dt) {
    }

}

module.exports = SimpleQuest;
