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

        setPosition(x:number, y:number) {
            this.position.x = x;
            this.position.y = y;
            this.positionInnerSprite();
        }

        adjustPosition(x:number, y:number) {
            this.position.x += x;
            this.position.y += y;
            this.positionInnerSprite();
        }

        private positionInnerSprite() {
            this.innerSprite.x = this.position.x - this.hotspot.x;
            this.innerSprite.y = this.position.y - this.hotspot.y;
        }

        overlaps(sp:Sprite) {
            var me = {
                left: this.innerSprite.position.x,
                right: this.innerSprite.position.x + this.innerSprite.width,
                top: this.innerSprite.position.y,
                bottom: this.innerSprite.position.y + this.innerSprite.height
            };
            var them = {
                left: sp.innerSprite.position.x,
                right: sp.innerSprite.position.x + sp.innerSprite.width,
                top: sp.innerSprite.position.y,
                bottom: sp.innerSprite.position.y + sp.innerSprite.height
            }

            return (
                me.left < them.right
                && me.right > them.left
                && me.top < them.bottom
                && me.bottom > them.top
            );
        }
    }
}
