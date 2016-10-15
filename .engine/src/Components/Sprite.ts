module Egg.Components {
    export class Sprite extends Egg.Component {
        s:Egg.Sprite;

        constructor(args?:any) {
            super(args);
        }

        added():void {
            this.owner.getNearest(SpriteLayer).add(this);
        }
    }
}
