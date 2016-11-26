module Cozy {
    export class Sprite {
        texture: PIXI.Texture;
        textureFrame: PIXI.Rectangle;
        clip: PIXI.Rectangle;
        innerSprite: PIXI.Sprite;
        hotspot: PIXI.Point;
        position: PIXI.Point;
        frameBank: PIXI.Rectangle;
        frameSize: PIXI.Point;
        frameCounts: PIXI.Point;
        layer: Cozy.Layer;
        frame_:number;

        animations: {};
        currentAnimation: {};
        animationScratch: {};
        frameRate: number;
        currentQuake: {};

        /**
            constructor args: {
                - required -
                texture: <Texture>/<string>

                - optional -
                hotspot: { x: <Number>, y: <Number> },
                position: { x: <Number>, y: <Number> },
                frameSize: { x: <Number>, y: <Number> },
                animations: { <key>: <animationDef>, ... },
                currentAnimation: <string>,
                frameRate: <number>
            }
        **/

        constructor(args) {
            if (typeof args === "string") {
                args = Cozy.gameDir.file(args).read('json');
            }

            if (!args.texture) throw new Error("Sprite must be instantiated with a 'texture'");

            args.hotspot = args.hotspot || {};
            args.position = args.position || {};
            args.frameSize = args.frameSize || {};

            if (typeof args.texture === 'string') {
                args.texture = Cozy.getTexture(args.texture);
            }
            this.texture = new PIXI.Texture(args.texture.innerTexture);
            this.innerSprite = new PIXI.Sprite(this.texture);

            this.hotspot = new PIXI.Point(args.hotspot.x || 0, args.hotspot.y || 0);
            this.position = new PIXI.Point(args.position.x || 0, args.position.y || 0 );
            this.frameSize = new PIXI.Point(args.frameSize.x || args.texture.width, args.frameSize.y || args.texture.height);
            this.textureFrame = new PIXI.Rectangle(0, 0, this.frameSize.x, this.frameSize.y);
            this.frame_ = 0;
            this.frameBank = args.frameBank ? new PIXI.Rectangle(args.frameBank.x, args.frameBank.y, args.frameBank.width, args.frameBank.height) : new PIXI.Rectangle(0, 0, this.texture.width, this.texture.height);
            this.frameCounts = new PIXI.Point(Math.floor(this.frameBank.width / this.frameSize.x), Math.floor(this.frameBank.height / this.frameSize.y));
            this.clip = new PIXI.Rectangle(0, 0, this.frameSize.x, this.frameSize.y);

            this.updateTextureFrame();

            this.animations = args.animations || {};
            this.frameRate = args.frameRate || 60;
            if (args.currentAnimation) {
                this.animation = args.currentAnimation;
            }

            this.positionInnerSprite();
        }

        set frame(f:number) {
            this.frame_ = f;
            this.updateTextureFrame();
        }

        get frame() {
            return this.frame_;
        }

        set animation(anim:string) {
            if (this.animations[anim]) {
                if (this.animations[anim] == this.currentAnimation) return;
                this.currentAnimation = this.animations[anim];
                this.animationScratch = {
                    counter: 0,
                    currentFrame: null,
                    name: anim
                };
            } else {
                this.currentAnimation = null;
                this.animationScratch = null;
            }
        }

        get animation():string {
            if (this.currentAnimation) {
                return this.animationScratch['name'];
            } else {
                return undefined;
            }
        }

        setClip(x:number, y:number, w:number, h:number) {
            this.clip.x = x;
            this.clip.y = y;
            this.clip.width = w;
            this.clip.height = h;
            this.updateTextureFrame();
        }

        private updateTextureFrame() {
            this.textureFrame.x = this.frameSize.x * (this.frame % this.frameCounts.x) + this.clip.x + this.frameBank.x;
            this.textureFrame.y = this.frameSize.y *  Math.floor(this.frame / this.frameCounts.x) + this.clip.y + this.frameBank.y;
            this.texture.frame.width = Math.max(Math.min(this.frameSize.x, this.clip.width), 0);
            this.texture.frame.height = Math.max(Math.min(this.frameSize.y, this.clip.height), 0);
            this.texture.frame = this.textureFrame;
        }

        quake(t:number, range:any, decay?:any): void {
            this.currentQuake = {
                remaining: t,
                range: range,
                decay: decay,
                offset: {
                    x: Math.random() * 2 * (range.x) - range.x,
                    y: Math.random() * 2 * (range.y) - range.y,
                }
            };
        }

        update(dt):void {
            if (this.currentAnimation) {
                var f = this.animationScratch['currentFrame'] || 0;

                this.animationScratch['counter'] += dt;

                while (this.animationScratch['counter'] > this.currentAnimation['frames'][f][1]) {
                    this.animationScratch['counter'] -= this.currentAnimation['frames'][f][1];
                    f++;

                    if (f >= this.currentAnimation['frames'].length) {
                        if (!this.currentAnimation['loop']) {
                            this.animation = null;
                        } else {
                            f = 0;
                        }
                    }
                }

                if (this.animationScratch['currentFrame'] !== f) {
                    this.frame = this.currentAnimation['frames'][f][0];
                    this.animationScratch['currentFrame'] = f;
                }
            }

            if (this.currentQuake) {
                this.currentQuake['remaining'] -= dt;
                if (this.currentQuake['remaining'] < 0) {
                    this.currentQuake = null;
                } else {
                    if (this.currentQuake['decay']) {
                        this.currentQuake['range'].x = Math.max(0, this.currentQuake['range'].x - this.currentQuake['decay'].x * dt);
                        this.currentQuake['range'].y = Math.max(0, this.currentQuake['range'].y - this.currentQuake['decay'].y * dt);
                    }
                    this.currentQuake['offset'] = {
                        x: Math.random() * 2 * (this.currentQuake['range'].x) - this.currentQuake['range'].x,
                        y: Math.random() * 2 * (this.currentQuake['range'].y) - this.currentQuake['range'].y,
                    }
                }
                this.positionInnerSprite();
            }
        }

        setPosition(x:number, y:number):void {
            this.position.x = x;
            this.position.y = y;
            this.positionInnerSprite();
        }

        adjustPosition(x:number, y:number):void {
            this.position.x += x;
            this.position.y += y;
            this.positionInnerSprite();
        }

        overlaps(sp:Sprite):Boolean {
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

        private positionInnerSprite():void {
            this.innerSprite.x = Math.floor(this.position.x - this.hotspot.x);
            this.innerSprite.y = Math.floor(this.position.y - this.hotspot.y);
            if (this.currentQuake) {
                this.innerSprite.x +=  Math.floor(this.currentQuake['offset'].x)
                this.innerSprite.y +=  Math.floor(this.currentQuake['offset'].y)
            }
        }
    }
}
