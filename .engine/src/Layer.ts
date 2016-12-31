module Cozy {
    export class Layer {
        innerContainer: PIXI.Container;
        sprites: Array<Cozy.Sprite>;
        spriteLookup: { [key:string]: Cozy.Sprite };

        constructor() {
            this.sprites = [];
            this.spriteLookup = {};
            this.innerContainer = new PIXI.Container();
        }

        update(dt:number):void {
            this.sprites.forEach(function(s) {
                s.update(dt);
            });
        }

        offset(x:number, y:number) {
            this.innerContainer.position.x = Math.floor(x);
            this.innerContainer.position.y = Math.floor(y);
        }

        getOffset() {
            return _.clone(this.innerContainer.position);
        }

        add(thing:any) {
            if (thing instanceof Sprite) {
                this.sprites.push(thing);
                this.spriteLookup[thing.innerSprite['uid']] = thing;
                thing.layer = this;
                this.innerContainer.addChild(thing.innerSprite);
            }
        }

        remove(sp:Sprite) {
            var index = this.sprites.indexOf(sp);
            if (index !== -1) {
                this.sprites.splice(index, 1);
            }
            this.innerContainer.removeChild(sp.innerSprite);
        }

        sortSprites(f:(a:any, b:any) => number) {
            // this.innerContainer.children.sort(f);
            this.innerContainer.children.sort((a:any, b:any) => {
                return f(this.spriteLookup[a['uid']], this.spriteLookup[b['uid']]);
            });
            // TODO keep this.sprites in sync with the innerContainer children
        }

        clear() {
            this.sprites.forEach(function() {
                this.innerContainer.removeChild(this.sprites[0].innerSprite);
            }.bind(this));
        }
    }
}
