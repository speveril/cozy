///<reference path="Map.ts"/>
///<reference path="Entity.ts"/>
///<reference path="Textbox.ts"/>

module RPG {
    export var player:Entity;
    export var map:Map;
    export var UILayer:Egg.Layer;
    export var loadSkip:Array<string> = [];
    export var cameraHalfSize:PIXI.Point;

    export function start(loaded:Function) {
        var textures = {};
        var directories = ['.'];
        cameraHalfSize = new PIXI.Point(Egg.config['width'] / 2, Egg.config['height'] / 2);

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

        // position camera
        var cx = RPG.player.sprite.position.x - cameraHalfSize.x;
        var cy = RPG.player.sprite.position.y - cameraHalfSize.y;
        var cameraBox = new PIXI.Rectangle(0, 0, map.size.x * map.tileSize.x, map.size.y * map.tileSize.y);

        cx = Math.max(cameraBox.x, cx);
        cx = Math.min(cameraBox.x + cameraBox.width - cameraHalfSize.x * 2, cx);

        cy = Math.max(cameraBox.y, cy);
        cy = Math.min(cameraBox.y + cameraBox.height - cameraHalfSize.y * 2, cy);

        _.each(map.layers, function(layer) {
            layer.displayLayer.offset(-cx, -cy);
        });
    }

    export function startMap(newMap:Map|string, x?:number, y?:number, layerName?:string) {
        if (typeof newMap === 'string') {
            map = new Map(newMap);
        } else {
            map = newMap;
        }
        map.open();
        player.place((x + 0.5) * map.tileSize.x, (y + 0.5) * map.tileSize.y, map.getLayerByName(layerName || '#spritelayer'));

        UILayer = new Egg.Layer();
    }
}
