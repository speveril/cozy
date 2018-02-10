import * as PIXI from 'pixi.js';
import { Sprite } from './Sprite';
import { Shape } from './Shape';

export class Layer {
    innerContainer: PIXI.Container;
    sprites: Array<Sprite>;
    shapes: Array<Shape>;
    spriteLookup: { [key:string]: Sprite };

    constructor() {
        this.sprites = [];
        this.spriteLookup = {};
        this.shapes = [];
        this.innerContainer = new PIXI.Container();
    }

    update(dt:number):void {
        for (let s of this.sprites) {
            s.update(dt);
        }
    }

    offset(x:number, y:number) {
        this.innerContainer.position.x = Math.floor(x);
        this.innerContainer.position.y = Math.floor(y);
    }

    getOffset():PIXI.Point {
        let p = new PIXI.Point();
        p.copy(this.innerContainer.position);
        return p;
    }

    add(thing:any) {
        if (thing instanceof Sprite) {
            this.sprites.push(thing);
            this.spriteLookup[thing.innerSprite['uid']] = thing;
            thing.layer = this;
            this.innerContainer.addChild(thing.innerSprite);
        } else if (thing instanceof Shape) {
            this.shapes.push(thing);
            // TODO shapeLookup?
            thing.layer = this;
            // thing.onChange();
            this.innerContainer.addChild(thing.graphics);
        }

        return thing;
    }

    remove(thing:any) {
        if (thing instanceof Sprite) {
            let index = this.sprites.indexOf(thing);
            if (index !== -1) {
                this.sprites.splice(index, 1);
            }
            thing.layer = null;
            this.innerContainer.removeChild(thing.innerSprite);
        } else if (thing instanceof Shape) {
            let i = this.shapes.indexOf(thing);
            if (i !== -1) {
                this.shapes.splice(i, 1);
            }
            thing.layer = null;
            this.innerContainer.removeChild(thing.graphics)
        }
    }

    sortSprites(f:(a:any, b:any) => number) {
        // this.innerContainer.children.sort(f);
        this.innerContainer.children.sort((a:any, b:any) => {
            return f(this.spriteLookup[a['uid']], this.spriteLookup[b['uid']]);
        });
        // TODO keep this.sprites in sync with the innerContainer children
    }

    clear() {
        for (let sp of this.sprites) {
            this.innerContainer.removeChild(sp.innerSprite);
            sp.layer = null;
        }
        this.sprites = [];

        for (let sh of this.shapes) {
            this.innerContainer.removeChild(sh.graphics);
            // sh.graphics.clear();
            sh.layer = null;
        }
        this.shapes = [];
    }
}
