module Egg {
    export class Texture {
        innerTexture: PIXI.Texture;

        constructor(inner) {
            this.innerTexture = inner;
        }

        get width():number { return this.innerTexture.width; }
        get height():number { return this.innerTexture.width; }
    }
}
