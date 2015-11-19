///<reference path="../../resources/default_app/Egg.d.ts" />
///<reference path="Map.ts"/>
///<reference path="Entity.ts"/>

module SimpleQuest {
    var sershaSprite:Egg.Sprite;
    var map:Map;
    var spriteLayer:MapLayer;
    var graphics:PIXI.Graphics;
    var player:Entity;

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

        player = new Entity({
            sprite: "sprites/sersha.sprite",
            speed: 64
        });
        player.place(10.5 * 16, 7.5 * 16, map.getLayerByName('#spritelayer'));

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
        var dx = 0, dy = 0;
        if (Egg.button('up')) dy -= player.speed * dt;
        if (Egg.button('down')) dy += player.speed * dt;
        if (Egg.button('left')) dx -= player.speed * dt;
        if (Egg.button('right')) dx += player.speed * dt;

        // diagonal movement should only be as fast as cardinal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
            // correct for shuddering on diagonal movement; I kind of hate this hack
            player.sprite.setPosition(Math.round(player.sprite.position.x), Math.round(player.sprite.position.y));
        }

        player.move(dx, dy);
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


}

module.exports = SimpleQuest;
