module Cozy.Components {
    export class SpriteLayer extends Cozy.Component {
        innerContainer:PIXI.Container; // should be private, but Renderer needs to access it

        constructor(args?:any) {
            super(args);
            this.innerContainer = new PIXI.Container();
        }

        added():void {
            this.owner.getNearest(Renderer).addLayer(this);
        }

        add(thing:any):void {
            if (thing instanceof Sprite) {
                // this.sprites.push(thing);
                // thing.s.layer = <Layer>this;
                this.innerContainer.addChild(thing.s.innerSprite);
            }
        }
    }
}
