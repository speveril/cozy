module RPG {
    export module Behavior {
        export function *wander(entity:RPG.Entity) {
            var direction, dist = 0;

            while (true) {
                while (dist > 0) {
                    var dt = yield;
                    var x = entity.position.x, y = entity.position.y;
                    switch(direction) {
                        case 0: // N
                            entity.move(0, -entity.speed * dt);
                            break;
                        case 1: // E
                            entity.move(entity.speed * dt, 0)
                            break;
                        case 2: // S
                            entity.move(0, entity.speed * dt);
                            break;
                        case 3: // W
                            entity.move(-entity.speed * dt, 0);
                            break;
                        case 4: // wait
                            entity.move(0, 0);
                            break;
                    }

                    if (x - entity.position.x === 0 && y - entity.position.y === 0 && direction !== 4) {
                        if (Math.random() < 0.5) {
                            direction = 4;
                        } else {
                            dist = 0;
                        }
                    } else {
                        dist -= (entity.speed * dt);
                    }
                }

                direction = Math.floor(Math.random() * 5);
                dist = (Math.random() * 3 + 1) * RPG.map.tileSize.x;
            }
        }
    }
}
