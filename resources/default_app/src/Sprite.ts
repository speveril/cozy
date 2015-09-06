module Egg {
    export class Sprite {
        texture: PIXI.Texture;
        textureFrame: PIXI.Rectangle;
        innerSprite: PIXI.Sprite;
        hotspot: PIXI.Point;
        position: PIXI.Point;
        frameSize: PIXI.Point;
        frameCounts: PIXI.Point;

        constructor(args) {
            /**
                args: {
                    - required -
                    texture: <Texture>

                    - optional -
                    hotspot: { x: <Number>, y: <Number> },
                    position: { x: <Number>, y: <Number> },
                    frameSize: { x: <Number>, y: <Number> }
                }
            **/

            args.hotspot = args.hotspot || {};
            args.position = args.position || {};
            args.frameSize = args.frameSize || {};

            this.texture = new PIXI.Texture(args.texture.innerTexture);
            this.innerSprite = new PIXI.Sprite(this.texture);

            this.hotspot = new PIXI.Point(args.hotspot.x || 0, args.hotspot.y || 0);
            this.position = new PIXI.Point(args.position.x || 0, args.position.y || 0 );
            this.frameSize = new PIXI.Point(args.frameSize.x || args.texture.width, args.frameSize.y || args.texture.height);
            this.textureFrame = new PIXI.Rectangle(0, 0, this.frameSize.x, this.frameSize.y);
            this.frameCounts = new PIXI.Point(Math.floor(this.texture.width / this.frameSize.x), Math.floor(this.texture.height / this.frameSize.y));
            this.texture.frame = this.textureFrame;

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
            this.innerSprite.x = Math.floor(this.position.x - this.hotspot.x);
            this.innerSprite.y = Math.floor(this.position.y - this.hotspot.y);
        }

        set frame(f:number) {
            this.textureFrame.x = this.frameSize.x * (f % this.frameCounts.x);
            this.textureFrame.y = this.frameSize.y *  Math.floor(f / this.frameCounts.y);
            this.texture.frame = this.textureFrame;
            console.log(this.texture.crop);
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
