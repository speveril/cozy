module Invaders {
    export class Player extends Cozy.Sprite {
        constructor(args:any) {
            console.log("Create Player ->", Cozy.textures['player'].width);
            args = _.extend({
                texture: Cozy.textures['player'],
                hotspot: { x: Cozy.textures['player'].width / 2, y: Cozy.textures['player'].height / 2 }
            }, args);
            super(args);
        }
    }
}
