module RPG {
    export function frameMapMode(dt) {
        // handle movement
        var dx = 0, dy = 0;
        if (Egg.Input.pressed('up')) dy -= player.speed * dt;
        if (Egg.Input.pressed('down')) dy += player.speed * dt;
        if (Egg.Input.pressed('left')) dx -= player.speed * dt;
        if (Egg.Input.pressed('right')) dx += player.speed * dt;

        // diagonal movement should only be as fast as cardinal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
            // correct for shuddering on diagonal movement; I kind of hate this hack
            player.sprite.setPosition(Math.round(player.position.x), Math.round(player.position.y));
        }

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
                if (Math.sqrt(dist2({x:tx, y:ty}, entity.position)) < entity.radius && player.layer.map[entity.name]) {
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
            Menu.push(new RPG.mainMenuClass());
        }

        RPG.centerCameraOn(player.position);
    }
}
