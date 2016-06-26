module Invaders {
    export class Player extends Egg.Sprite {
        constructor(args:any) {
            console.log("Create Player ->", Egg.textures['player'].width);
            args = _.extend({
                texture: Egg.textures['player'],
                hotspot: { x: Egg.textures['player'].width / 2, y: Egg.textures['player'].height / 2 }
            }, args);
            super(args);
        }
    }
}
