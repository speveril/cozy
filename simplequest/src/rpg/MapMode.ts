module RPG {
    export function frameMapMode(dt) {
        // handle movement
        var dx = 0, dy = 0;
        var movex = Egg.Input.axis('horizontal') || 0,
            movey = Egg.Input.axis('vertical') || 0;

        if (Egg.Input.pressed('up')) movey -= 1;
        if (Egg.Input.pressed('down')) movey += 1;
        if (Egg.Input.pressed('left')) movex -= 1;
        if (Egg.Input.pressed('right')) movex += 1;

        var move = Trig.dist({x:0,y:0}, {x:movex, y:movey});
        if (Math.abs(move) < Egg.Input.deadzone) {
            movex = 0;
            movey = 0;
        } else if (move > 1 ) {
            movex *= (1 / move);
            movey *= (1 / move);
        }

        dx = movex * player.speed * dt;
        dy = movey * player.speed * dt;

        player.move(dx, dy);

        // handle other input
        if (Egg.Input.pressed('confirm')) {
            Egg.Input.debounce('confirm');
            var tx = player.position.x;
            var ty = player.position.y;
            switch (player.dir) {
                case 'u': ty -= map.tileSize.y; break;
                case 'd': ty += map.tileSize.y; break;
                case 'l': tx -= map.tileSize.x; break;
                case 'r': tx += map.tileSize.x; break;
            }
            var trigger = player.layer.getTriggerByPoint(tx, ty);
            if (trigger) {
                player.layer.map[trigger.name]({
                    entity: player,
                    trigger: trigger,
                    x: tx, y: ty,
                    tx: Math.floor(tx / map.tileSize.x), ty: Math.floor(ty / map.tileSize.y)
                });
            }

            _.each(player.layer.entities, function(entity) {
                if (player.layer.map[entity.name] && Math.sqrt(Trig.dist2({x:tx, y:ty}, entity.position)) < entity.radius) {
                    player.layer.map[entity.name]({
                        entity: player,
                        target: entity,
                        x: tx, y: ty,
                        tx: Math.floor(tx / map.tileSize.x), ty: Math.floor(ty / map.tileSize.y)
                    });
                }
            });
        }

        if (Egg.Input.pressed('menu') && RPG.mainMenuClass) {
            Egg.Input.debounce('menu');
            Egg.Input.debounce('cancel');
            // TODO instantiate this once and show/hide it rather than re-creating
            var menu = new RPG.mainMenuClass();
            RPG.uiPlane.addChild(menu);
            Menu.push(menu);
        }

        RPG.centerCameraOn(player.position);
    }
}
