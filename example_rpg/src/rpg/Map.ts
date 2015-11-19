module RPG {
    export class MapLayer {
        map:Map = null;
        tiles:Array<number>;
        obstructions:Array<any>; // actually point pairs
        events:Array<MapEvent>;
        displayLayer:Egg.Layer;


        getTile(x:number, y:number):number {
            return this.tiles[x + (this.map.size.x * y)];
        }

        setTile(x:number, y:number, t:number):void {
            // do nothing right now
        }

    }

    export class MapEvent {
        name:string;
        rect:PIXI.Rectangle;
    }

    export class MapTileset {
        static registry:{ [name:string]: MapTileset } = {};
        index:number;
        texture:string;

        static loadFromFile(path:string) {
            if (!MapTileset.registry[path]) {
                MapTileset.registry[path] = new MapTileset();
                // TODO finish this; I'll need it for animation
            }
            return MapTileset.registry[path];
        }
    }

    export class MapTile extends Egg.Sprite {}

    export class Map {
        layers:Array<MapLayer>;
        layerLookup:{ [name:string]: MapLayer };
        size:PIXI.Point;
        tileSize:PIXI.Point;
        tilesets:Array<MapTileset>;

        loadFromFile(path:string) {
            var parser = new DOMParser();
            var dataDirectory = path.substr(0, path.lastIndexOf('/') + 1);

            var data = parser.parseFromString(Egg.File.read(path), "text/xml");
            var mapEl = data.getElementsByTagName('map')[0];

            this.size.x = parseInt(mapEl.getAttribute('width'), 10);
            this.size.y = parseInt(mapEl.getAttribute('height'), 10);
            this.tileSize.x = parseInt(mapEl.getAttribute('tilewidth'), 10);
            this.tileSize.x = parseInt(mapEl.getAttribute('tileheight'), 10);

            _.each(mapEl.children, function(el:HTMLElement) {
                switch (el.tagName) {
                    case "tileset":
                        var firstgid, image;
                        if (el.getAttribute('source')) {
                            var TSXparser = new DOMParser();
                            var TSXdata = parser.parseFromString(Egg.File.read(dataDirectory + el.getAttribute('source')), "text/xml");
                            image = TSXdata.getElementsByTagName('image')[0].getAttribute('source');
                            firstgid = el.getAttribute('firstgid');
                            // TODO load an actual MapTileset here, with animations!
                        }

                        // TODO support non-external tilesets; not sure what they look like yet

                        this.addTileSet(parseInt(firstgid, 10), dataDirectory + image);
                        break;
                    case "layer":
                        // TODO this assumes encoding="csv" but that may not be true
                        var dataEl:HTMLElement = <HTMLElement>el.getElementsByTagName('data')[0];
                        var tileString = dataEl.innerHTML.replace(/\s/g, '');

                        var layer = new MapLayer();
                        layer.map = this;
                        layer.tiles = [];
                        _.each(tileString.split(','), function(x) {
                            layer.tiles.push(parseInt(x, 10));
                        });
                        this.addLayer(layer);
                        break;
                    case "objectgroup":
                        var layer = new MapLayer();
                        layer.map = this;
                        layer.obstructions = [];
                        layer.events = [];
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
                                    // TODO
                                    break;
                                default:
                                    if (objectEl.hasAttribute('width') && objectEl.hasAttribute('height')) {
                                        var w = parseInt(objectEl.getAttribute('width'), 10),
                                            h = parseInt(objectEl.getAttribute('height'), 10);
                                        layer.obstructions.push([{x:x, y:y},{x:x+w,y:y}]);
                                        layer.obstructions.push([{x:x, y:y},{x:x,y:y+h}]);
                                        layer.obstructions.push([{x:x, y:y+h},{x:x+w,y:y+h}]);
                                        layer.obstructions.push([{x:x+h, y:y},{x:x+w,y:y+h}]);
                                    } else {
                                        _.each(objectEl.children, function(defEl:HTMLElement) {
                                            switch(defEl.tagName) {
                                                case 'polyline':
                                                    var points = defEl.getAttribute('points').split(" ");
                                                    var last_pt = null;
                                                    _.each(points, function(pt) {
                                                        pt = pt.split(",");
                                                        pt = { x:parseInt(pt[0], 10) + x, y:parseInt(pt[1], 10) + y };
                                                        if (last_pt !== null) {
                                                            layer.obstructions.push([last_pt, pt]);
                                                        }
                                                        last_pt = pt;
                                                    }.bind(this));
                                                    break;
                                            }
                                        }.bind(this));
                                    }
                            }
                        }.bind(this));
                        this.addLayer(layer);
                        this.layerLookup[el.getAttribute("name")] = layer;
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

            this.size = new PIXI.Point(args.width || 0, args.height || 0);
            this.tileSize = new PIXI.Point(args.tileWidth || 16, args.tileHeight || 16);

            if (!!args.file) {
                this.loadFromFile(args.file);
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
                    if (tileIndex > 0) {
                        var tileInfo = this.lookupTileInfo(tileIndex);
                        if (tileInfo && Egg.textures[tileInfo.texture]) {
                            var spr = new MapTile({
                                texture: tileInfo['texture'],
                                position: { x: x * this.tileSize.x, y: y * this.tileSize.y },
                                frameSize: this.tileSize
                            });
                            spr.frame = tileInfo.frame;
                            layer.add(spr);
                        }
                    }

                    x++;
                    if (x >= this.size.x) {
                        x = 0;
                        y++;
                    }
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

        addTileSet(firstIndex:number, textureName:string):void {
            var tileset = new MapTileset();
            tileset.index = firstIndex;
            tileset.texture = textureName;
            this.tilesets.push(tileset);
        }

        private lookupTileInfo(index:number):any {
            if (index === 0) return null;
            for (var i:number = this.tilesets.length - 1; i >= 0; i--) {
                if (index >= this.tilesets[i].index) return {
                    texture: this.tilesets[i].texture,
                    frame: index - this.tilesets[i].index
                };
            }
            return null;
        }

        getLayerByName(name:string):MapLayer {
            return this.layerLookup[name];
        }
    }
}
