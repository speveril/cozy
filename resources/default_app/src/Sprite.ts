module Egg {
    export class Sprite {
        innerSprite: PIXI.Sprite;
        hotspot: PIXI.Point;
        position: PIXI.Point;

        constructor(args) {
            /**
                args: {
                    - required -
                    texture: <Texture>

                    - optional -
                    hotspot: { x: <Number>, y: <Number> },
                    position: { x: <Number>, y: <Number> }
                }
            **/

            args.hotspot = args.hotspot || {};
            args.position = args.position || {};

            this.innerSprite = new PIXI.Sprite(args.texture.innerTexture);

            this.hotspot = new PIXI.Point(args.hotspot.x || 0, args.hotspot.y || 0);
            this.position = new PIXI.Point(args.position.x || 0, args.position.y || 0 );
            this.positionInnerSprite();
        }

        setPosition(x, y) {
            this.position.x = x;
            this.position.y = y;
            this.positionInnerSprite();
        }

        adjustPosition(x, y) {
            this.position.x += x;
            this.position.y += y;
            this.positionInnerSprite();
        }

        private positionInnerSprite() {
            this.innerSprite.x = this.position.x - this.hotspot.x;
            this.innerSprite.y = this.position.y - this.hotspot.y;
        }
    }
}
