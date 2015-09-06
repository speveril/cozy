var Textbox = {
    height: 50,
    width: 320,
    padding: 8,

    config: function(font, sprite) {
        this.font = font;

        this.bg = sprite;
        this.bg.x = 0;
        this.bg.y = 240 - this.height;

        this.textBlock = new TextSprite(this.font, "", this.width - this.padding * 2, this.height - this.padding * 2);
        this.textBlock.x = this.padding;
        this.textBlock.y = 240 - this.height + this.padding;

        this.camera = new Camera();

        this.layer = new SpriteLayer();
        this.layer.add(this.bg);
        this.layer.add(this.textBlock);
        this.layer.setCamera(this.camera);

        this.hide();
    },

    init: function(mode) {
        mode.addLayer(this.layer);
    },

    show: function(text) {
        this.textBlock.text = text;
        this.camera.setTarget(160, 120);
        this.showing = true;
    },

    hide: function() {
        this.camera.setTarget(160, - 120);
        this.showing = false;
    },
};