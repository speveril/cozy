module Invaders {
    export class Alien extends Cozy.Sprite {
        speed:number;
        direction:number;
        destroyed:Boolean;
        value:number;
        bounds:any;

        constructor(args:any) {
            var variant = args.variant || '1';
            args = _.extend({
                texture: Cozy.textures['alien_' + variant],
                hotspot: { x: Cozy.textures['alien_' + variant].width / 2, y: Cozy.textures['alien_' + variant].width / 2 }
            }, args);
            super(args);

            this.destroyed = false;
            this.direction = 1;
            this.speed = args.speed || 35;
            this.value = args.value || 100;

            this.bounds = {
                left:  args.bounds.left,
                right:  args.bounds.right
            };
        }

        update(dt:number) {
            this.adjustPosition(this.speed * dt * this.direction, 0);

            if (this.direction === 1 && this.position.x > this.bounds.right) {
                this.direction = -1;
                this.adjustPosition(this.bounds.right - this.position.x, 5);
            }
            if (this.direction === -1 && this.position.x < this.bounds.left) {
                this.direction = 1;
                this.adjustPosition(this.bounds.left - this.position.x, 5);
            }
        }
    }
}
