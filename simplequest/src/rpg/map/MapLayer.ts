module RPG.Map {
    export class MapLayer {
        // TODO break this out into child classes, TileLayer and EntityLayer?
        map:Map                            = null;
        displayLayer:Cozy.Layer            = null;
        dirty:boolean                      = false;
        tiles:Array<number>                = [];
        tileLookup:Array<MapTile>          = [];
        obstructions:Array<MapObstruction> = [];
        events:Array<MapEvent>             = [];
        triggers:Array<MapTrigger>         = [];
        entities:Array<Entity>             = [];
        _name:string                       = '';

        get name():string { return this._name; }

        constructor(name:string) {
            this._name = name;
        }

        getTile(x:number, y:number):number {
            return this.tiles[x + (this.map.size.x * y)];
        }

        setTile(x:number, y:number, t:number):void {
            var i = x + (this.map.size.x * y);
            var tileInfo = this.map.lookupTileInfo(t);

            if (tileInfo && Cozy.getTexture(tileInfo.texture)) {
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
                    } else {
                        this.tileLookup[i].animation = null;
                    }
                }
                this.dirty = true;
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
                return trigger.active && trigger.rect.contains(x, y) && this.map[trigger.name];
            }.bind(this)));
        }

        getTriggersByName(name:string):MapTrigger[] {
            return _.where(this.triggers, { name: name });
        }

        getObstructionsByName(name:string):MapObstruction[] {
            return _.where(this.obstructions, { name: name });
        }

        getEntitiesByName(name:string):Array<Entity> {
            return _.where(this.entities, { name: name });
        }
    }
}
