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
///<reference path="SavedGame.ts"/>
///<reference path="Scene.ts"/>
///<reference path="Textbox.ts"/>

///<reference path="battle/Battle.ts"/>

module RPG {
    export enum ControlMode { None, Scene, Menu, Map, Battle };

    export var characters:{[key:string]:Character} = {};
    export var loadSkip:Array<string>              = [];
    export var controlStack:Array<ControlMode>     = [];
    export var player:Entity                       = null;
    export var map:Map.Map                         = null;
    export var mapkey:string                       = '';
    export var mapLookup:{ [name:string]: Array<any> } = {};

    export var cameraSpeed:number                  = 750;
    export var cameraHalf:PIXI.Point;
    export var cameraFocus:PIXI.Point;

    export var renderPlane:Cozy.RenderPlane;
    export var uiPlane:Cozy.UiPlane;
    export var battleSystem:any;
    export var mainMenuClass:any;

    export var equipSlots                          = ["weapon", "shield", "armor", "accessory"];
    export var moneyName:string                    = "G";
    export var sfx:{ [name:string]: Cozy.Sound }    = {};
    export var music:{ [name:string]: Cozy.Music }  = {};

    export function start(config:any):Promise<any> {
        console.log("RPGKit start");

        RPG.renderPlane = <Cozy.RenderPlane>Cozy.addPlane(Cozy.RenderPlane, { className: 'render-plane' });
        RPG.uiPlane = <Cozy.UiPlane>Cozy.addPlane(Cozy.UiPlane, { className: 'overlay' });

        if (config.sfx) {
            _.each(config.sfx, (args:string, name:string) => this.sfx[name] = new Cozy.Sound(args));
        }
        if (config.music) {
            _.each(config.music, (args:any, name:string) => this.music[name] = new Cozy.Music(args));
        }
        if (config.battleSystem) {
            this.battleSystem = new config.battleSystem['System'](config.battleSystemConfig || {});
        }
        this.loadSkip             = config.loadSkip || [];
        this.mainMenuClass        = config.mainMenuClass || null;
        this.mapLookup            = config.maps || {};

        RPG.Item.load(config.items || {});

        cameraHalf = new PIXI.Point(Cozy.config['width'] / 2, Cozy.config['height'] / 2);
        cameraFocus = new PIXI.Point(0, 0);

        // scrape all images under the project
        var textures = {};
        _.each(Cozy.gameDir.glob("**/*.{png,jpg,gif}"), (f) => {
            if (f instanceof Cozy.File) {
                if (_.reduce(loadSkip, (memo, ignore:string) => memo || f.path.indexOf(ignore) === 0, false)) return;
                textures[(<Cozy.File>f).relativePath(Cozy.gameDir)] = f;
            }
        });

        RPG.Menu.init();

        var promises = [ Cozy.loadTextures(textures) ];
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
            if (cameraBox.width <= Cozy.config['width']) {
                cx = cameraBox.x + cameraBox.width / 2;
            } else {
                cx = Math.max(cameraBox.x + cameraHalf.x, cx);
                cx = Math.min(cameraBox.x + cameraBox.width - cameraHalf.x, cx);
            }

            if (cameraBox.height <= Cozy.config['height']) {
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

    export function startMap(newMap:string, x?:number, y?:number, layerName?:string, options?:any) {
        var opts = options || {};
        Scene.do(function*() {
            if (!opts.noFadeOut)
                yield* Scene.waitFadeTo("black", 0.2);

            if (map) {
                map.finish();
            }

            mapkey = newMap;

            var mapArgs = _.clone(mapLookup[mapkey]);
            var mapType = mapArgs.shift();
            map = new mapType(mapArgs);
            map.open();

            player.place((x + 0.5) * map.tileSize.x, (y + 0.5) * map.tileSize.y, map.getLayerByName(layerName || '#spritelayer'));
            RPG.centerCameraOn(player.position, true);

            if (!opts.noFadeIn)
                yield* RPG.Scene.waitFadeFrom("black", 0.2);

            map.start();
        });
    }
}
