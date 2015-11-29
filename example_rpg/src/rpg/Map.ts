module RPG {
    export class MapLayer {
        // break this out into child classes, TileLayer and EntityLayer?
        map:Map = null;
        tiles:Array<number>;
        tileLookup:Array<MapTile>;
        obstructions:Array<MapObstruction>;
        events:Array<MapEvent>;
        triggers:Array<MapTrigger>;
        displayLayer:Egg.Layer;
        entities:Array<any>;

        getTile(x:number, y:number):number {
            return this.tiles[x + (this.map.size.x * y)];
        }

        setTile(x:number, y:number, t:number):void {
            var i = x + (this.map.size.x * y);

            var tileInfo = this.map.lookupTileInfo(t);
            if (tileInfo && Egg.textures[tileInfo.texture]) {
                if (!this.tileLookup[i]) {
                    var spr = new MapTile({
                        texture: tileInfo['texture'],
                        position: { x: x * this.map.tileSize.x, y: y * this.map.tileSize.y },
                        frameSize: this.map.tileSize,
                        animations: tileInfo.animations
                    });
                    spr.frame = tileInfo.frame;
                    if (tileInfo.animations[tileInfo.frame]) {
                        spr.animation = tileInfo.frame;
                    }
                    this.displayLayer.add(spr);
                    this.tileLookup[i] = spr;
                } else {
                    this.tileLookup[i].frame = tileInfo.frame;
                    if (tileInfo.animations[tileInfo.frame]) {
                        this.tileLookup[i].animation = tileInfo.frame;
                    }
                }
            } else {
                if (this.tileLookup[i]) {
                    this.displayLayer.remove(this.tileLookup[i]);
                    this.tileLookup[i] = null;
                }
            }

            this.tiles[i] = t;
        }

        getTriggerByPoint(x:number, y:number):MapTrigger {
            return <MapTrigger>(_.find(this.triggers, function(trigger) {
                return (trigger.rect.contains(x, y) && this.map[trigger.name]);
            }.bind(this)));
        }

        getTriggersByName(name:string):MapTrigger[] {
            return _.where(this.triggers, { name: name });
        }

        getObstructionsByName(name:string):MapObstruction[] {
            return _.where(this.obstructions, { name: name });
        }
    }

    export class MapObstruction {
        a:PIXI.Point;
        b:PIXI.Point;
        active:boolean;
        name:string;

        constructor(a:PIXI.Point, b:PIXI.Point, name?:string) {
            this.a = a;
            this.b = b;
            this.active = true;
            this.name = name || null;
        }
    }

    export class MapEvent {
        name:string;
        rect:PIXI.Rectangle;
    }

    export class MapTrigger {
        name:string;
        rect:PIXI.Rectangle;
        obstructions:Array<MapObstruction>;
        private _solid:boolean = true;

        get solid():boolean {
            return this._solid;
        }

        set solid(v:boolean) {
            this._solid = v;
            _.each(this.obstructions, function(o) {
                o.active = v;
            });
        }
    }

    export class MapTileset {
        static registry:{ [name:string]: MapTileset } = {};
        index:number;
        texture:string;
        animations:{ [name:string]: any } = {};

        static loadFromTSX(path:string, file:string) {
            var fullpath = path + file;
            if (!MapTileset.registry[path]) {
                var ts = new MapTileset();
                var parser = new DOMParser();
                var data = parser.parseFromString(Egg.File.read(fullpath), "text/xml");
                ts.texture = path + data.getElementsByTagName('image')[0].getAttribute('source');
                _.each(data.getElementsByTagName('tile'), function(tile:HTMLElement) {
                    _.each(tile.getElementsByTagName('animation'), function(animData:HTMLElement) {
                        var animation = [];
                        _.each(animData.getElementsByTagName('frame'), function(frameData:HTMLElement) {
                            animation.push([
                                parseInt(frameData.getAttribute('tileid'),10),
                                parseInt(frameData.getAttribute('duration'),10)/1000
                            ]);
                        });
                        ts.animations[tile.getAttribute("id")] = {
                            loop: true,
                            frames: animation
                        };
                    });
                });

                MapTileset.registry[fullpath] = ts;
            }
            return MapTileset.registry[fullpath];
        }
    }

    export class MapTile extends Egg.Sprite {}

    export class Map {
        layers:Array<MapLayer>;
        layerLookup:{ [name:string]: MapLayer };
        size:PIXI.Point;
        tileSize:PIXI.Point;
        tilesets:Array<MapTileset>;
        filename:string = null;

        loadFromTMX(path:string) {
            this.filename = path;
            var parser = new DOMParser();
            var dataDirectory = path.substr(0, path.lastIndexOf('/') + 1);

            var data = parser.parseFromString(Egg.File.read(path), "text/xml");
            var mapEl = data.getElementsByTagName('map')[0];

            this.size = new PIXI.Point(parseInt(mapEl.getAttribute('width'), 10), parseInt(mapEl.getAttribute('height'), 10));
            this.tileSize = new PIXI.Point(parseInt(mapEl.getAttribute('tilewidth'), 10), parseInt(mapEl.getAttribute('tileheight'), 10));

            _.each(mapEl.children, function(el:HTMLElement) {
                switch (el.tagName) {
                    case "tileset":
                        if (el.getAttribute('source')) {
                            var ts = MapTileset.loadFromTSX(dataDirectory, el.getAttribute('source'));
                            this.addTileSet(parseInt(el.getAttribute('firstgid'), 10), ts);
                        }
                        // TODO support non-external tilesets; not sure what they look like yet

                        break;
                    case "layer":
                        // TODO this assumes encoding="csv" but that may not be true
                        var dataEl:HTMLElement = <HTMLElement>el.getElementsByTagName('data')[0];
                        var tileString = dataEl.innerHTML.replace(/\s/g, '');

                        var layer = new MapLayer();
                        this.addLayer(layer);
                        this.layerLookup[el.getAttribute("name")] = layer;
                        layer.map = this;
                        layer.tiles = [];
                        layer.tileLookup = [];
                        _.each(tileString.split(','), function(x) {
                            layer.tiles.push(parseInt(x, 10));
                        });
                        break;
                    case "objectgroup":
                        var layer = new MapLayer();
                        this.addLayer(layer);
                        this.layerLookup[el.getAttribute("name")] = layer;
                        layer.map = this;
                        layer.obstructions = [];
                        layer.events = [];
                        layer.triggers = [];
                        layer.entities = [];
                        _.each(el.children, function(objectEl:HTMLElement) {
                            var x = parseInt(objectEl.getAttribute('x'), 10),
                                y = parseInt(objectEl.getAttribute('y'), 10);

                            switch(objectEl.getAttribute('type')) {
                                case "event":
                                    var w = parseInt(objectEl.getAttribute('width'), 10),
                                        h = parseInt(objectEl.getAttribute('height'), 10),
                                        ev = new MapEvent();
                                    ev.name = objectEl.getAttribute('name');
                                    ev.rect = new PIXI.Rectangle(x, y, w, h);
                                    layer.events.push(ev);
                                    break;
                                case "trigger":
                                    var w = parseInt(objectEl.getAttribute('width'), 10),
                                        h = parseInt(objectEl.getAttribute('height'), 10),
                                        tr = new MapTrigger();
                                    tr.name = objectEl.getAttribute('name');
                                    tr.rect = new PIXI.Rectangle(x, y, w, h);
                                    if (objectEl.hasAttribute('solid')) {
                                        tr.solid = (objectEl.getAttribute('solid') === 'true' || objectEl.getAttribute('solid') === '1');
                                    }

                                    tr.obstructions = [];
                                    var o:MapObstruction = new MapObstruction(new PIXI.Point(x,y), new PIXI.Point(x+w,y));
                                    layer.obstructions.push(o);
                                    tr.obstructions.push(o);
                                    o = new MapObstruction(new PIXI.Point(x,y), new PIXI.Point(x,y+h));
                                    layer.obstructions.push(o);
                                    tr.obstructions.push(o);
                                    o = new MapObstruction(new PIXI.Point(x,y+h), new PIXI.Point(x+w,y+h))
                                    layer.obstructions.push(o);
                                    tr.obstructions.push(o);
                                    o = new MapObstruction(new PIXI.Point(x+w,y), new PIXI.Point(x+w,y+h));
                                    layer.obstructions.push(o);
                                    tr.obstructions.push(o);

                                    layer.triggers.push(tr);
                                    break;
                                case "entity":
                                    var x = parseInt(objectEl.getAttribute('x')) + parseInt(objectEl.getAttribute('width'), 10) / 2,
                                        y = parseInt(objectEl.getAttribute('y')) + parseInt(objectEl.getAttribute('height'), 10) / 2,
                                        propertiesEl = <HTMLElement>objectEl.children[0],
                                        args = {};
                                    if (propertiesEl) {
                                        _.each(propertiesEl.children, function(property) {
                                            args[property.getAttribute('name')] = property.getAttribute('value');
                                        });
                                    }
                                    layer.entities.push([new Entity(args), x, y]);
                                    break;
                                default:
                                    var name = objectEl.hasAttribute('name') ? objectEl.getAttribute('name') : null;
                                    if (objectEl.hasAttribute('width') && objectEl.hasAttribute('height')) {
                                        var w = parseInt(objectEl.getAttribute('width'), 10),
                                            h = parseInt(objectEl.getAttribute('height'), 10);
                                        layer.obstructions.push(new MapObstruction(new PIXI.Point(x,y), new PIXI.Point(x+w,y), name));
                                        layer.obstructions.push(new MapObstruction(new PIXI.Point(x,y), new PIXI.Point(x,y+h), name));
                                        layer.obstructions.push(new MapObstruction(new PIXI.Point(x,y+h), new PIXI.Point(x+w,y+h), name));
                                        layer.obstructions.push(new MapObstruction(new PIXI.Point(x+w,y), new PIXI.Point(x+w,y+h), name));
                                    } else {
                                        _.each(objectEl.children, function(defEl:HTMLElement) {
                                            switch(defEl.tagName) {
                                                case 'polyline':
                                                    var points = defEl.getAttribute('points').split(" ");
                                                    var last_pt:PIXI.Point = null;
                                                    _.each(points, function(pt) {
                                                        pt = pt.split(",");
                                                        pt = new PIXI.Point(parseInt(pt[0], 10) + x, parseInt(pt[1], 10) + y );
                                                        if (last_pt !== null) {
                                                            layer.obstructions.push(new MapObstruction(last_pt, pt, name));
                                                        }
                                                        last_pt = pt;
                                                    }.bind(this));
                                                    break;
                                            }
                                        }.bind(this));
                                    }
                            }
                        }.bind(this));
                        break;
                    default:
                        console.log("Got a '" + el.tagName + "' in the map, not sure what to do with it so I'm ignoring it.");
                }
            }.bind(this));
        }

        constructor(args) {
            this.layers = [];
            this.tilesets = [];
            this.layerLookup = {};

            if (typeof args === 'string') {
                this.loadFromTMX(args);
            } else {
                this.size = new PIXI.Point(args.width || 0, args.height || 0);
                this.tileSize = new PIXI.Point(args.tileWidth || 16, args.tileHeight || 16);
            }
        }

        open():void {
            Egg.clearLayers();

            _.each(this.layers, function(mapLayer) {
                var layer = Egg.addLayer();
                mapLayer.displayLayer = layer;
                var x = 0,
                    y = 0;

                _.each(mapLayer.tiles, function(tileIndex) {
                    mapLayer.setTile(x, y, tileIndex);

                    x++;
                    if (x >= this.size.x) {
                        x = 0;
                        y++;
                    }
                }.bind(this));

                _.each(mapLayer.entities, function(entity:Entity) {
                    entity[0].place(entity[1], entity[2], mapLayer);
                }.bind(this));
            }.bind(this));
        }

        setSize(x:number, y:number):void {
            this.size.x = x;
            this.size.y = y;
        }

        addLayer(lyr:MapLayer, index?:number):void {
            if (index === undefined) {
                this.layers.push(lyr);
            } else {
                this.layers.splice(index, 0, lyr);
            }
        }

        addTileSet(firstIndex:number, ts:MapTileset):void {
            ts.index = firstIndex;
            this.tilesets.push(ts);
        }

        lookupTileInfo(index:number):any {
            if (index === 0) return null;
            for (var i:number = this.tilesets.length - 1; i >= 0; i--) {
                if (index >= this.tilesets[i].index) return {
                    texture: this.tilesets[i].texture,
                    frame: index - this.tilesets[i].index,
                    animations: this.tilesets[i].animations
                };
            }
            return null;
        }

        getLayerByName(name:string):MapLayer {
            return this.layerLookup[name];
        }
    }
}
