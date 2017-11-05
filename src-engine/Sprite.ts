import * as PIXI from 'pixi.js';
import * as Engine from './Engine';
import { Layer } from './Layer';

export class Sprite {
    texture: PIXI.Texture;
    textureFrame: PIXI.Rectangle;
    clip: PIXI.Rectangle;
    hotspot: PIXI.Point;
    offset: PIXI.Point;
    position: PIXI.Point;
    frameBank: PIXI.Rectangle;
    frameSize: PIXI.Point;
    frameCounts: PIXI.Point;
    layer: Layer;
    direction_: number;
    frame_: number;
    innerSprite: PIXI.Sprite;
    layers: Array<PIXI.Sprite>;

    animations: {};
    currentAnimation: Array<any>;
    animationScratch: {};
    currentQuake: {};
    currentFlashing: {};

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
        }
    **/

    constructor(f) {
        let args;
        if (typeof f === "string") {
            args = Engine.gameDir().file(f).read('json');
        } else {
            args = Object.assign({}, f);
        }

        while (args['.derive']) {
            let path = args['.derive'];
            delete args['.derive'];

            args = Object.assign({}, Engine.gameDir().file(path).read('json'), args);
        }

        if (!args.texture) throw new Error("Sprite must be instantiated with a 'texture'. args:" + JSON.stringify(args));

        args.hotspot = args.hotspot || {};
        args.position = args.position || {};
        args.frameSize = args.frameSize || {};

        if (typeof args.texture === 'string') {
            args.texture = Engine.getTexture(args.texture);
        }
        this.texture = new PIXI.Texture(args.texture.innerTexture);
        this.innerSprite = new PIXI.Sprite(this.texture);
        this.innerSprite['uid'] = Engine.uniqueID();

        this.offset = args.offset ? new PIXI.Point(args.offset.x, args.offset.y) : new PIXI.Point(0, 0);
        this.hotspot = new PIXI.Point(args.hotspot.x || 0, args.hotspot.y || 0);
        this.position = new PIXI.Point(args.position.x || 0, args.position.y || 0 );
        this.frameSize = new PIXI.Point(args.frameSize.x || args.texture.width, args.frameSize.y || args.texture.height);
        this.textureFrame = new PIXI.Rectangle(0, 0, this.frameSize.x, this.frameSize.y);
        this.frame_ = 0;
        this.frameBank = args.frameBank ? new PIXI.Rectangle(args.frameBank.x, args.frameBank.y, args.frameBank.width, args.frameBank.height) : new PIXI.Rectangle(0, 0, this.texture.width, this.texture.height);
        this.frameCounts = new PIXI.Point(Math.floor(this.frameBank.width / this.frameSize.x), Math.floor(this.frameBank.height / this.frameSize.y));
        this.clip = new PIXI.Rectangle(0, 0, this.frameSize.x, this.frameSize.y);
        this.direction = args.direction || 0;

        this.updateTextureFrame();

        this.animations = args.animations || {};
        this.positionInnerSprite();

        this.animation = args.currentAnimation;
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
                subAnimation: '',
                counter: 0,
                currentFrame: null,
                name: anim
            };
            this.direction = this.direction; // fire the code that reconciles animation and direction
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

    set direction(d:number) {
        // TODO this is wasteful; it runs through the subanimations every single time direction is set
        this.direction_ = d;
        if (this.currentAnimation) {
            var currentSub = this.animationScratch['subAnimation'];
            this.animationScratch['subAnimation'] = this.currentAnimation.findIndex((a:any) => {
                return !(a.angle) || (this.direction >= a.angle[0] && this.direction <= a.angle[1]);
            });
            if (this.animationScratch['subAnimation'] < 0) this.animationScratch['subAnimation'] = 0;
            if (currentSub !== this.animationScratch['subAnimation'] && this.animationScratch['currentFrame'] !== null) {
                this.animationScratch['currentFrame'] = 0;
                this.animationScratch['counter'] = 0;
                this.frame = this.currentAnimation[this.animationScratch['subAnimation']]['frames'][this.animationScratch['currentFrame']][0];
            }
        }
    }

    get direction():number {
        while (this.direction_ < 0) this.direction_ += 360;
        while (this.direction_ >= 360) this.direction_ -= 360;
        return this.direction_;
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

    flash(freq:number):void {
        if (!freq) {
            this.currentFlashing = {
                clear: true
            };
        } else {
            this.currentFlashing = {
                frequency: freq,
                counter: 0,
                framelength: 0.5/freq,
                hidden: false
            };
        }
    }

    update(dt):void {
        if (this.currentAnimation) {
            var f = this.animationScratch['currentFrame'] || 0;

            this.animationScratch['counter'] += dt;

            while (this.animationScratch['counter'] > this.currentAnimation[this.animationScratch['subAnimation']]['frames'][f][1]) {
                this.animationScratch['counter'] -= this.currentAnimation[this.animationScratch['subAnimation']]['frames'][f][1];
                f++;

                if (f >= this.currentAnimation[this.animationScratch['subAnimation']]['frames'].length) {
                    if (!this.currentAnimation[this.animationScratch['subAnimation']]['loop']) {
                        this.animation = null;
                    } else {
                        f = 0;
                    }
                }
            }

            if (this.animationScratch['currentFrame'] !== f) {
                this.frame = this.currentAnimation[this.animationScratch['subAnimation']]['frames'][f][0];
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

        if (this.currentFlashing) {
            if (this.currentFlashing['clear']) {
                this.currentFlashing = null;
                this.innerSprite.visible = true;
            } else {
                this.currentFlashing['counter'] += dt;
                while (this.currentFlashing['counter'] > this.currentFlashing['framelength']) {
                    this.currentFlashing['hidden'] = !this.currentFlashing['hidden'];
                    this.currentFlashing['counter'] -= this.currentFlashing['framelength'];
                }
                this.innerSprite.visible = !this.currentFlashing['hidden'];
            }
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

    setOffset(x:number, y:number):void {
        this.offset.x = x;
        this.offset.y = y;
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
        this.innerSprite.x = Math.floor(this.position.x - this.hotspot.x + this.offset.x);
        this.innerSprite.y = Math.floor(this.position.y - this.hotspot.y + this.offset.y);
        if (this.currentQuake) {
            this.innerSprite.x +=  Math.floor(this.currentQuake['offset'].x)
            this.innerSprite.y +=  Math.floor(this.currentQuake['offset'].y)
        }
    }
}
