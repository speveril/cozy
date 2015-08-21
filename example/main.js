include('test.js');

module.exports = {
    start: function() {
        var tex = Egg.loadTexture("res/sprite/lance-vodwin.png");
        this.sprite = Egg.makeSprite(tex);
        Egg.stage.addChild(this.sprite);
    },

    frame: function(dt) {
        if (Egg.button['left']) this.sprite.position.x--;
        if (Egg.button['right']) this.sprite.position.x++;
        if (Egg.button['up']) this.sprite.position.y--;
        if (Egg.button['down']) this.sprite.position.y++;
    }
}
