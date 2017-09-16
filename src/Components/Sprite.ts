module Cozy.Components {
    export class Sprite extends Cozy.Component {
        s:Cozy.Sprite;

        constructor(args?:any) {
            super(args);
        }

        added():void {
            this.owner.getNearest(SpriteLayer).add(this);
        }
    }
}
