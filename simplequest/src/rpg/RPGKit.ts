///<reference path="Battle.ts"/>
///<reference path="Behavior.ts"/>
///<reference path="Character.ts"/>
///<reference path="Dice.ts"/>
///<reference path="Effect.ts"/>
///<reference path="Entity.ts"/>
///<reference path="Item.ts"/>
///<reference path="Inventory.ts"/>
///<reference path="Map.ts"/>
///<reference path="MapMode.ts"/>
///<reference path="Menu.ts"/>
///<reference path="Party.ts"/>
///<reference path="Scene.ts"/>
///<reference path="Textbox.ts"/>

module RPG {
    export enum ControlMode { None, Scene, Menu, Map, Battle };

    export var player:Entity;
    export var map:Map;
    export var UILayer:Egg.Layer;
    export var loadSkip:Array<string> = [];
    export var cameraHalf:PIXI.Point;
    export var cameraFocus:PIXI.Point;
    export var cameraSpeed:number = 750;
    export var controlStack:Array<ControlMode> = [];
    export var renderPlane:Egg.RenderPlane;
    export var battleRenderPlane:Egg.RenderPlane;
    export var battleUiPlane:Egg.UiPlane;
    export var uiPlane:Egg.UiPlane;
    export var mainMenuClass:any;
    export var characters:{[key:string]:Character} = {};
    export var items:{[key:string]:Item} = {};

    export var equipSlots = ["weapon", "shield", "armor", "accessory"];
    export var moneyName:string = "G";

    export function start():Promise<any> {
        Egg.addStyleSheet("src/rpg/rpg.css");

        RPG.renderPlane = <Egg.RenderPlane>Egg.addPlane(Egg.RenderPlane, { className: 'render-plane' });
        RPG.battleRenderPlane = <Egg.RenderPlane>Egg.addPlane(Egg.RenderPlane, { className: 'battle-render' });
        RPG.battleUiPlane = <Egg.UiPlane>Egg.addPlane(Egg.UiPlane, { className: 'battle-ui' });
        RPG.uiPlane = <Egg.UiPlane>Egg.addPlane(Egg.UiPlane, { className: 'overlay' });

        RPG.battleRenderPlane.hide();
        RPG.battleUiPlane.hide();

        var textures = {};
        var fonts = [];
        var directories = ['.'];
        cameraHalf = new PIXI.Point(Egg.config['width'] / 2, Egg.config['height'] / 2);
        cameraFocus = new PIXI.Point(0, 0);

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

        RPG.Menu.init();

        return Egg.loadTextures(textures);
    }

    export function frame(dt) {
        if (map) {
            map.update(dt);
        }

        if (controlStack.length < 1) {
            throw new Error("Control stack got emptied");
        }

        var controls = controlStack[controlStack.length - 1];
        if (controls === ControlMode.Map && map && player) {
            RPG.frameMapMode(dt);
        } else if (controls === ControlMode.Scene && Scene.currentScene) {
            Scene.update(dt);
        } else if (controls === ControlMode.Menu && Menu.currentMenu) {
            Menu.update(dt);
        } else if (controls === ControlMode.Battle && Battle.active) {
            Battle.update(dt);
        } else {
            switch(controls) {
                case ControlMode.Map:
                    console.log("bad controls [map]: >>",map,player); break;
                case ControlMode.Scene:
                    console.log("bad controls [scene]: >>",Scene.currentScene); break;
                case ControlMode.Menu:
                    console.log("bad controls [menu]: >>",Menu.currentMenu); break;
                case ControlMode.Battle:
                    console.log("bad controls [battle]: >>",Battle.active); break;
            }
        }

        if (player && player.layer) {
            var offs = player.layer.displayLayer.getOffset(),
                dx = (cameraFocus.x) - (-offs.x + cameraHalf.x),
                dy = (cameraFocus.y) - (-offs.y + cameraHalf.y),
                dd = Math.sqrt(dx * dx + dy * dy),
                maxDist = cameraSpeed * dt;

            if (dd > maxDist) {
                dx *= (maxDist / dd);
                dy *= (maxDist / dd);
            }

            _.each(map.layers, (layer) => {
                layer.displayLayer.offset(offs.x - dx, offs.y - dy);
            });
        }
    }

    export function centerCameraOn(pt:PIXI.Point, snap?:boolean) {
        var cx = pt.x;
        var cy = pt.y;
        var cameraBox = _.find(map.cameraBoxes, (box) => box.contains(cx, cy));

        if (cameraBox) {
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
        }

        cameraFocus.x = cx;
        cameraFocus.y = cy;

        if (snap) {
            _.each(map.layers, (layer) => {
                layer.displayLayer.offset(-cx + cameraHalf.x, -cy + cameraHalf.y);
            });
        }
    }

    export function startMap(newMap:Map|string, x?:number, y?:number, layerName?:string, options?:any) {
        var opts = options || {};
        Scene.do(function*() {
            if (!opts.noFadeOut)
                yield* Scene.waitFadeTo("black", 0.2);

            if (map) {
                map.finish();
            }

            if (typeof newMap === 'string') {
                map = new Map(newMap);
            } else {
                map = newMap;
            }

            map.open();

            UILayer = renderPlane.addRenderLayer();

            player.place((x + 0.5) * map.tileSize.x, (y + 0.5) * map.tileSize.y, map.getLayerByName(layerName || '#spritelayer'));
            RPG.centerCameraOn(player.position, true);

            if (!opts.noFadeIn)
                yield* RPG.Scene.waitFadeFrom("black", 0.2);

            map.start();
        });
    }
}
