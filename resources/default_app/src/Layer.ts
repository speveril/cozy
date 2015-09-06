module Egg {
    export class Layer {
        innerContainer: PIXI.Container;
        sprites: Array<Egg.Sprite>;

        constructor() {
            this.sprites = [];
            this.innerContainer = new PIXI.Container();
        }

        add(sp:Sprite) {
            this.sprites.push(sp);
            this.innerContainer.addChild(sp.innerSprite);
        }

        remove(sp:Sprite) {
            var index = this.sprites.indexOf(sp);
            if (index !== -1) {
                this.sprites.splice(index, 1);
            }
            this.innerContainer.removeChild(sp.innerSprite);
        }

        clear() {
            this.sprites.forEach(function() {
                this.innerContainer.removeChild(this.sprites[0].innerSprite);
            }.bind(this));
        }
    }
}
