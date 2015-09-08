module SimpleQuest {
    export class MapLayer {
        tiles:Array<number>;
        obstructions:Array<any>; // really it stores shapes
    }

    export class MapTile extends Egg.Sprite {}

    export class Map {
        layers:Array<MapLayer>;
        size:PIXI.Point;
        tileSize:PIXI.Point;
        tilesets:Array<any>;

        static loadFromFile(path:string) {
            var data = JSON.parse(Egg.File.read(path));
            var dataDirectory = path.substr(0, path.lastIndexOf('/') + 1);
            var map = new Map({
                width: data['width'],
                height: data['height'],
                tileWidth: data['tilewidth'],
                tileHeight: data['tileheight'],
            });

            _.each(data['tilesets'], function(tilesetData) {
                map.addTileSet(tilesetData['firstgid'], dataDirectory + tilesetData['image']);
            });

            _.each(data['layers'], function(layerData) {
                if (layerData['type'] === 'tilelayer') {
                    var layer = new MapLayer();
                    layer.tiles = layerData['data'];
                    map.addLayer(layer);
                } // TODO support other types
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
            this.tilesets.push({ index:firstIndex, texture:textureName });
        }



        private lookupTileInfo(index:number):any {
            if (index === 0) return null;
            for (var i:number = this.tilesets.length - 1; i >= 0; i--) {
                if (index >= this.tilesets[i]['index']) return {
                    texture: this.tilesets[i]['texture'],
                    frame: index - this.tilesets[i]['index']
                };
            }
            return null;
        }
    }
}
