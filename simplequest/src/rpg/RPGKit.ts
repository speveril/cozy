///<reference path="Battle.ts"/>
///<reference path="Behavior.ts"/>
///<reference path="Character.ts"/>
///<reference path="Dice.ts"/>
///<reference path="Effect.ts"/>
///<reference path="Entity.ts"/>
///<reference path="Item.ts"/>
///<reference path="Inventory.ts"/>
///<reference path="map/Map.ts"/>
///<reference path="MapMode.ts"/>
///<reference path="Menu.ts"/>
///<reference path="Party.ts"/>
///<reference path="Scene.ts"/>
///<reference path="Textbox.ts"/>

module RPG {
    export enum ControlMode { None, Scene, Menu, Map, Battle };

    export var characters:{[key:string]:Character} = {};
    export var items:{[key:string]:Item}           = {};
    export var loadSkip:Array<string>              = [];
    export var controlStack:Array<ControlMode>     = [];
    export var player:Entity                       = null;
    export var map:Map.Map                         = null;

    export var cameraSpeed:number                  = 750;
    export var cameraHalf:PIXI.Point;
    export var cameraFocus:PIXI.Point;

    export var renderPlane:Egg.RenderPlane;
    export var uiPlane:Egg.UiPlane;
    export var battleSystem:any;
    export var mainMenuClass:any;

    export var equipSlots                          = ["weapon", "shield", "armor", "accessory"];
    export var moneyName:string                    = "G";
    export var sfx:{ [name:string]: Egg.Sound }    = {};
    export var music:{ [name:string]: Egg.Music }  = {};

    export function start(config:any):Promise<any> {
        RPG.renderPlane = <Egg.RenderPlane>Egg.addPlane(Egg.RenderPlane, { className: 'render-plane' });
        RPG.uiPlane = <Egg.UiPlane>Egg.addPlane(Egg.UiPlane, { className: 'overlay' });

        if (config.battleSystem) {
            this.battleSystem = new config.battleSystem(config.battleSystemConfig || {});
        }
        if (config.sfx) {
            _.each(config.sfx, (args:string, name:string) => this.sfx[name] = new Egg.Sound(args));
        }
        if (config.music) {
            _.each(config.music, (args:any, name:string) => this.music[name] = new Egg.Music(args));
        }
        this.loadSkip             = config.loadSkip || [];
        this.mainMenuClass        = config.mainMenuClass || null;

        RPG.Item.load(config.items || {});

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

        var promises = [ Egg.loadTextures(textures) ];
        _.each(sfx, function(s) { promises.push(s.loaded()); })
        _.each(music, function(m) { promises.push(m.loaded()); })
        return Promise.all(promises);
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
        // } else if (controls === ControlMode.Battle && Battle.currentBattle) {
        //     Battle.update(dt);
        } else {
            switch(controls) {
                case ControlMode.Map:
                    console.log("bad controls [map]: >>",map,player); break;
                case ControlMode.Scene:
                    console.log("bad controls [scene]: >>",Scene.currentScene); break;
                case ControlMode.Menu:
                    console.log("bad controls [menu]: >>",Menu.currentMenu); break;
                // case ControlMode.Battle:
                //     console.log("bad controls [battle]: >>",Battle.active); break;
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

    export function startMap(newMap:Map.Map|string, x?:number, y?:number, layerName?:string, options?:any) {
        var opts = options || {};
        Scene.do(function*() {
            if (!opts.noFadeOut)
                yield* Scene.waitFadeTo("black", 0.2);

            if (map) {
                map.finish();
            }

            if (typeof newMap === 'string') {
                map = Map.Loader.load(newMap);
            } else {
                map = newMap;
            }

            map.open();

            player.place((x + 0.5) * map.tileSize.x, (y + 0.5) * map.tileSize.y, map.getLayerByName(layerName || '#spritelayer'));
            RPG.centerCameraOn(player.position, true);

            if (!opts.noFadeIn)
                yield* RPG.Scene.waitFadeFrom("black", 0.2);

            map.start();
        });
    }
}
