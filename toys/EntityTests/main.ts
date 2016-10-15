module EntityTests {
    var root:Egg.Entity;
    var mainLayer:Egg.Entity;
    var player:Egg.Entity;

    export function start() {
        Egg.loadTextures({
            "sprites/monsters.png": "sprites/monsters.png"
        }).then(go);
    }

    function go() {
        root = new Egg.Entity(null, [
            new Egg.Components.Renderer()
        ]);
        Egg.setScene(root);

        mainLayer = root.addChild([
            new Egg.Components.SpriteLayer()
        ]);

        player = mainLayer.addChild([
            new Egg.Components.Sprite({
                s: new Egg.Sprite('sprites/monster_skeleton.sprite')
            })
        ]);

        Egg.unpause();
    }

    export function frame(dt) {
        root.update(dt);
    }
}

module.exports = EntityTests;
