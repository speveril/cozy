module EntityTests {
    var root:Cozy.Entity;
    var mainLayer:Cozy.Entity;
    var player:Cozy.Entity;

    export function start() {
        Cozy.loadTextures({
            "sprites/monsters.png": "sprites/monsters.png"
        }).then(go);
    }

    function go() {
        root = new Cozy.Entity(null, [
            new Cozy.Components.Renderer()
        ]);
        Cozy.setScene(root);

        mainLayer = root.addChild([
            new Cozy.Components.SpriteLayer()
        ]);

        player = mainLayer.addChild([
            new Cozy.Components.Sprite({
                s: new Cozy.Sprite('sprites/monster_skeleton.sprite')
            })
        ]);

        Cozy.unpause();
    }

    export function frame(dt) {
        root.update(dt);
    }
}

module.exports = EntityTests;
