include('test.js');

module.exports = {
    start: function() {
        var tex = Egg.loadTexture("res/sprite/lance-vodwin.png");
        this.sprite = Egg.makeSprite(tex);
        Egg.stage.addChild(this.sprite);
    },

    frame: function(dt) {
        if (Egg.keys[37]) { // left
            this.sprite.position.x--;
        }
        if (Egg.keys[38]) { // up
            this.sprite.position.y--;
        }
        if (Egg.keys[39]) { // right
            this.sprite.position.x++;
        }
        if (Egg.keys[40]) { // down
            this.sprite.position.y++;
        }
    }
}
