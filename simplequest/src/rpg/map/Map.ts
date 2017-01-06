///<reference path="Loader.ts"/>
///<reference path="MapLayer.ts"/>
///<reference path="MapObstruction.ts"/>
///<reference path="Tileset.ts"/>

module RPG.Map {
    class MapRect {
        name:string;
        rect:PIXI.Rectangle;
        properties:any;
        active:boolean = true;
        tileSize:any;

        constructor(tileSize) {
            this.tileSize = tileSize;
        }

        get tx():number {
            return Math.floor(this.rect.x / this.tileSize.x);
        }

        get ty():number {
            return Math.floor(this.rect.y / this.tileSize.y);
        }

        get tw():number {
            return Math.floor(this.rect.width / this.tileSize.x);
        }

        get th():number {
            return Math.floor(this.rect.height / this.tileSize.y);
        }
    }

    export class MapEvent extends MapRect {}
    export class MapTrigger extends MapRect {
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

    export class Map {
        public static persistent = { global: {} };

        size:PIXI.Point                   = null;
        tileSize:PIXI.Point               = null;
        filename:string                   = null;
        layers:Array<MapLayer>            = [];
        tilesets:Array<MapTileset>        = [];
        cameraBoxes:Array<PIXI.Rectangle> = [];
        layerLookup:Dict<MapLayer>        = {};
        displayName:string                = '';

        constructor(args) {
            if (typeof args === 'string') {
                // TODO get rid of this, always go through Loader directly
                RPG.Map.Loader.TMX(args, this);
            } else {
                this.size = new PIXI.Point(args.width || 0, args.height || 0);
                this.tileSize = new PIXI.Point(args.tileWidth || 16, args.tileHeight || 16);
            }
        }

        open():void {
            RPG.renderPlane.clear();
            _.each(this.layers, (mapLayer:MapLayer, i:number) => {
                var x = 0, y = 0,
                    layer = RPG.renderPlane.addRenderLayer();

                mapLayer.displayLayer = layer;
                _.each(mapLayer.tiles, (tileIndex) => {
                    mapLayer.setTile(x, y, tileIndex);

                    x++;
                    if (x >= this.size.x) {
                        x = 0;
                        y++;
                    }
                });
                _.each(mapLayer.entities, (entity:Entity) => entity.place(entity.spawn.x, entity.spawn.y, mapLayer));
                this.sortSprites(mapLayer);
            });
        }

        /**
        Override for setup stuff on this map.
        **/
        start() {}

        /**
        Override for clean up stuff on this map.
        **/
        finish() {}

        update(dt):void {
            this.layers.forEach((layer) => {
                if (layer.dirty || layer.entities.length > 0) {
                    layer.dirty = false;
                    this.sortSprites(layer);
                }
                layer.entities.forEach((e) => e.update(dt));
            });
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
            this.layerLookup[lyr.name] = lyr;
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

        getAllTriggersByName(name:string):MapTrigger[] {
            return _.flatten(_.map(this.layers, (lyr) => lyr.getTriggersByName(name)));
        }

        getAllObstructionsByName(name:string):MapObstruction[] {
            return _.flatten(_.map(this.layers, (lyr) => lyr.getObstructionsByName(name)));
        }

        getAllEntitiesByName(name:string):Array<Entity> {
            return _.flatten(_.map(this.layers, (lyr) => lyr.getEntitiesByName(name)));
        }

        private sortSprites(layer?:MapLayer) {
            if (!layer) {
                _.each(this.layers, (lyr) => this.sortSprites(lyr));
            } else {
                layer.displayLayer.sortSprites((a, b) => {
                    if (a.position.y === b.position.y) {
                        return 0;
                    } else {
                        return a.position.y < b.position.y ? -1 : 1;
                    }
                });
            }
        }
    }
}
