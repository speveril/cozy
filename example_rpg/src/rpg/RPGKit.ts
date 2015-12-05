///<reference path="Entity.ts"/>
///<reference path="Map.ts"/>
///<reference path="Menu.ts"/>
///<reference path="Scene.ts"/>
///<reference path="Textbox.ts"/>

module RPG {
    export var player:Entity;
    export var map:Map;
    export var UILayer:Egg.Layer;
    export var loadSkip:Array<string> = [];
    export var cameraHalf:PIXI.Point;
    export enum ControlMode { None, Scene, Menu, Map };
    export var controls:ControlMode;
    export var renderPlane:Egg.Plane;
    export var uiPlane:Egg.Plane;

    export function start(loaded:Function) {
        Egg.addStyleSheet("src/rpg/rpg.css");

        RPG.renderPlane = Egg.addPlane({
            className: 'render-plane',
            renderable: true
        });
        RPG.uiPlane = Egg.addPlane({
            className: 'overlay'
        });

        Menu.init();

        var textures = {};
        var fonts = [];
        var directories = ['.'];
        cameraHalf = new PIXI.Point(Egg.config['width'] / 2, Egg.config['height'] / 2);

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
        map.update(dt);

        if (controls === ControlMode.Map && map && player) {
            // handle movement
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
                player.sprite.setPosition(Math.round(player.position.x), Math.round(player.position.y));
            }

            player.move(dx, dy);

            // handle other input
            if (Egg.button('confirm')) {
                Egg.debounce('confirm');
                var tx = player.position.x;
                var ty = player.position.y;
                switch (player.dir) {
                    case 'u': ty -= map.tileSize.y; break;
                    case 'd': ty += map.tileSize.y; break;
                    case 'l': tx -= map.tileSize.x; break;
                    case 'r': tx += map.tileSize.x; break;
                }
                var trigger = player.layer.getTriggerByPoint(tx, ty);
                if (trigger) {
                    player.layer.map[trigger.name]({
                        entity: player,
                        trigger: trigger,
                        x: tx, y: ty,
                        tx: Math.floor(tx / map.tileSize.x), ty: Math.floor(ty / map.tileSize.y)
                    });
                }

                _.each(player.layer.entities, function(entity) {
                    if (Math.sqrt(dist2({x:tx, y:ty}, entity.position)) < entity.radius && player.layer.map[entity.name]) {
                        player.layer.map[entity.name]({
                            entity: player,
                            target: entity,
                            x: tx, y: ty,
                            tx: Math.floor(tx / map.tileSize.x), ty: Math.floor(ty / map.tileSize.y)
                        });
                    }
                });
            }

            if (Egg.button('menu')) {
                Egg.debounce('menu');
                Menu.push(new Menu({
                    html: "ui/main-menu.html"
                }));
            }

            RPG.centerCameraOn(player.position);
        } else if (controls === ControlMode.Scene && Scene.currentScene) {
            Scene.update(dt);
        } else if (controls === ControlMode.Menu && Menu.currentMenu) {
            Menu.currentMenu.update(dt);
        }
    }

    export function centerCameraOn(pt:PIXI.Point) {
        var cx = pt.x;
        var cy = pt.y;
        var cameraBox = new PIXI.Rectangle(0, 0, map.size.x * map.tileSize.x, map.size.y * map.tileSize.y);

        if (cameraBox.width <= Egg.config['width']) {
            cx = cameraBox.x + cameraBox.width / 2;
        } else {
            cx = Math.max(cameraBox.x + cameraHalf.x, cx);
            cx = Math.min(cameraBox.x + cameraBox.width - cameraHalf.x, cx);
        }

        if (cameraBox.height <= Egg.config['height']) {
            cy = cameraBox.y + cameraBox.height / 2;
        } else {
            cy = Math.max(cameraBox.y + cameraHalf.y, cy);
            cy = Math.min(cameraBox.y + cameraBox.height - cameraHalf.y, cy);
        }

        _.each(map.layers, function(layer) {
            layer.displayLayer.offset(-cx + cameraHalf.x, -cy + cameraHalf.y);
        });
    }

    export function startMap(newMap:Map|string, x?:number, y?:number, layerName?:string) {
        if (typeof newMap === 'string') {
            map = new Map(newMap);
        } else {
            map = newMap;
        }
        map.open();
        UILayer = Egg.addLayer();

        player.place((x + 0.5) * map.tileSize.x, (y + 0.5) * map.tileSize.y, map.getLayerByName(layerName || '#spritelayer'));
        RPG.centerCameraOn(player.position);
    }
}
