include('test.js');

module.exports = {
    start: function() {
        var tex = new Egg.Texture("res/sprite/lance-vodwin.png");
        this.sprite = new Egg.Sprite({
            texture: tex
        });
        Egg.stage.addChild(this.sprite.innerSprite);
    },

    frame: function(dt) {
        if (Egg.button['left']) this.sprite.adjustPosition(-1, 0);
        if (Egg.button['right']) this.sprite.adjustPosition(+1, 0);
        if (Egg.button['up']) this.sprite.adjustPosition(0, -1);
        if (Egg.button['down']) this.sprite.adjustPosition(0, 1);
    }
}
