///<reference path="Map.ts"/>
///<reference path="Entity.ts"/>
///<reference path="Textbox.ts"/>

module RPG {
    export var player:Entity;
    export var map:Map;
    export var UILayer:Egg.Layer;
    export var loadSkip = [];

    export function start(loaded:Function) {
        var textures = {};
        var directories = ['.'];

        // scrape all images under the project
        while (directories.length > 0) {
            var dir = directories.shift();
            var files = Egg.Directory.read(dir);
            _.each(files, function(f) {
                var fullPath = dir + "/" + f;
                if (_.contains(loadSkip, fullPath)) return;

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

    export function frame(dt) {
        var dx = 0, dy = 0;
        if (Egg.button('up')) dy -= RPG.player.speed * dt;
        if (Egg.button('down')) dy += RPG.player.speed * dt;
        if (Egg.button('left')) dx -= RPG.player.speed * dt;
        if (Egg.button('right')) dx += RPG.player.speed * dt;

        // diagonal movement should only be as fast as cardinal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
            // correct for shuddering on diagonal movement; I kind of hate this hack
            RPG.player.sprite.setPosition(Math.round(RPG.player.sprite.position.x), Math.round(RPG.player.sprite.position.y));
        }

        RPG.player.move(dx, dy);
    }

    export function startMap(newMap:Map|string, x?:number, y?:number, layerName?:string) {
        if (typeof newMap === 'string') {
            map = new Map(newMap);
        } else {
            map = newMap;
        }
        map.open();
        player.place((x + 0.5) * 16, (y + 0.5) * 16, map.getLayerByName(layerName || '#spritelayer'));

        UILayer = new Egg.Layer();
    }
}
