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

        export function *guard(entity:RPG.Entity) {
            var map = <SimpleQuest.Map>RPG.map;
            var visionDistance:number = entity.params.vision || 3;
            var visionEnd:PIXI.Point = new PIXI.Point(
                entity.position.x + Math.cos(entity.dir * PIXI.DEG_TO_RAD) * visionDistance * map.tileSize.x,
                entity.position.y + Math.sin(entity.dir * PIXI.DEG_TO_RAD) * visionDistance * map.tileSize.y
            );

            while (true) {
                var dt = yield;
                if (Trig.distToSegment(RPG.player.position, entity.position, visionEnd) < RPG.player.radius) {
                    RPG.controlStack.push(RPG.ControlMode.Scene);
                    yield *map.waitTextbox(null, ["Hey! You!"]);
                    yield *map.waitFight(entity);
                    RPG.controlStack.pop();
                }
            }
        }

        export function *guard_right(entity:RPG.Entity) {
            entity.dir = 0;
            entity.sprite.animation = 'stand';
            yield *guard(entity);
        }

        export function *guard_down(entity:RPG.Entity) {
            entity.dir = 90;
            entity.sprite.animation = 'stand';
            yield *guard(entity);
        }

        export function *guard_left(entity:RPG.Entity) {
            entity.dir = 180;
            entity.sprite.animation = 'stand';
            yield *guard(entity);
        }

        export function *guard_up(entity:RPG.Entity) {
            entity.dir = 270;
            entity.sprite.animation = 'stand';
            yield *guard(entity);
        }
    }
}
