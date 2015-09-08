module SimpleQuest {
    export class MapLayer {
        tiles:Array<number>;
        obstructions:Array<any>; // really it stores shapes
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
        size:PIXI.Point;
        tileSize:PIXI.Point;
        tilesets:Array<MapTileset>;

        static loadFromFile(path:string) {
            var parser = new DOMParser();
            var dataDirectory = path.substr(0, path.lastIndexOf('/') + 1);

            var data = parser.parseFromString(Egg.File.read(path), "text/xml");
            var mapEl = data.getElementsByTagName('map')[0];

            var map = new Map({
                width: parseInt(mapEl.getAttribute('width'), 10),
                height: parseInt(mapEl.getAttribute('height'), 10),
                tileWidth: parseInt(mapEl.getAttribute('tilewidth'), 10),
                tileHeight: parseInt(mapEl.getAttribute('tileheight'), 10)
            });

            _.each(mapEl.getElementsByTagName('tileset'), function(tilesetEl:HTMLElement) {
                var firstgid, image;
                if (tilesetEl.getAttribute('source')) {
                    var TSXparser = new DOMParser();
                    var TSXdata = parser.parseFromString(Egg.File.read(dataDirectory + tilesetEl.getAttribute('source')), "text/xml");
                    image = TSXdata.getElementsByTagName('image')[0].getAttribute('source');
                    firstgid = tilesetEl.getAttribute('firstgid');
                    // TODO load an actual MapTileset here, with animations!
                }

                // TODO support non-external tilesets; not sure what they look like yet

                map.addTileSet(parseInt(firstgid, 10), dataDirectory + image);
            });

            _.each(mapEl.getElementsByTagName('layer'), function(layerEl:HTMLElement) {
                // TODO this assumes encoding="csv" but that may not be true
                var dataEl:HTMLElement = <HTMLElement>layerEl.getElementsByTagName('data')[0];
                var tileString = dataEl.innerHTML.replace(/\s/g, '');

                var layer = new MapLayer();
                layer.tiles = [];
                _.each(tileString.split(','), function(x) {
                    layer.tiles.push(parseInt(x, 10));
                });
                map.addLayer(layer);
            });

            return map;
        }

        constructor(args) {
            this.layers = [];
            this.tilesets = [];

            this.size = new PIXI.Point(args.width || 0, args.height || 0);
            this.tileSize = new PIXI.Point(args.tileWidth || 16, args.tileHeight || 16);
            console.log(this.tileSize);
        }

        open():void {
            Egg.clearLayers();

            _.each(this.layers, function(mapLayer) {
                var layer = Egg.addLayer();
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
    }
}
