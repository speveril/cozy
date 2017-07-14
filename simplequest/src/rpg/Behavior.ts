module RPG {
    export module Behavior {
        export function *stun(entity:RPG.Entity, time:number, returnBehavior:any = null) {
            let behavior = returnBehavior || entity.behavior;
            let counter = 0;
            entity.sprite.flash(3);

            while (counter < time) {
                let dt = yield;
                counter += dt;
            }

            entity.sprite.flash(0);
            return behavior;
        }

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

        export function *path(entity:RPG.Entity, path:Array<any>) {
            console.log("PATH>", entity, path);
            let dt:number;
            let dx:number, dy:number;
            let tx:number, ty:number;
            let px:number, py:number;
            let step:any;
            let framedist:number, dist:number;

            dist = 0;

            for (let i = 0; i < path.length; i++) {
                step = path[i];

                if (step[1] === undefined || step[1] === 0) {
                    entity.dir = step[0];
                    continue;
                }

                dx = Math.cos(PIXI.DEG_TO_RAD * step[0]);
                dy = Math.sin(PIXI.DEG_TO_RAD * step[0]);

                while (dist < step[1]) {
                    dt = yield;
                    framedist = entity.speed * dt;

                    if (dist + framedist > step[1]) {
                        framedist = step[1] - dist;
                    }

                    dist += framedist;

                    entity.move(framedist * dx, framedist * dy);

                    if (dx > 0 && entity.position.x > tx) entity.position.x = tx;
                    if (dx < 0 && entity.position.x < tx) entity.position.x = tx;
                    if (dy > 0 && entity.position.y > ty) entity.position.y = ty;
                    if (dy < 0 && entity.position.y < ty) entity.position.y = ty;
                }
            }
        }

        let guardMutex = null;
        export function *guard(entity:RPG.Entity, direction:number) {
            entity.dir = direction;
            entity.sprite.animation = 'stand';

            let origin = {x:entity.position.x, y:entity.position.y, d:entity.dir};

            var map = <SimpleQuest.Map>RPG.map;
            var visionDistance:number = entity.params.vision || 3;
            var visionEnd:PIXI.Point = new PIXI.Point(
                entity.position.x + Math.cos(entity.dir * PIXI.DEG_TO_RAD) * visionDistance * map.tileSize.x,
                entity.position.y + Math.sin(entity.dir * PIXI.DEG_TO_RAD) * visionDistance * map.tileSize.y
            );
            let movement = [];
            _.times(visionDistance, () => movement.push(direction));

            while (true) {
                let dt = yield;
                if (Trig.distToSegment(RPG.player.position, entity.position, visionEnd) < RPG.player.radius) {
                    RPG.ControlStack.push(RPG.ControlMode.None);

                    if (entity.params.notice && _.has(map, entity.params.notice)) {
                        map[entity.params.notice]();
                    } else {
                        RPG.player.sprite.animation = 'stand';

                        let exclamation = entity.params.exclamation || '';

                        entity.emote("!");
                        RPG.sfx['alert'].play();

                        while (guardMutex) {
                            dt = yield;
                        }
                        guardMutex = true;

                        yield *Scene.waitEntityMove(entity, movement);
                        if (exclamation !== '') {
                            yield *Scene.waitTextbox(null, [exclamation]);
                        }
                        entity.clearEmote();

                        yield *map.waitFight(entity);
                        guardMutex = null;
                        RPG.ControlStack.pop();

                        if (!entity.destroyed) {
                            console.log("returning entity to its place...");
                            let dist = Trig.dist(origin, entity.position);
                            let dir = Math.atan2(origin.y - entity.position.y, origin.x - entity.position.x) * PIXI.RAD_TO_DEG;
                            yield *Behavior.path(entity, [ [dir,dist] ]);
                            entity.sprite.animation = 'stand';
                            entity.dir = origin.d;
                        }
                    }
                }
            }
        }

        export function *guard_right(entity:RPG.Entity) {
            yield *guard(entity, 0);
        }

        export function *guard_down(entity:RPG.Entity) {
            yield *guard(entity, 90);
        }

        export function *guard_left(entity:RPG.Entity) {
            yield *guard(entity, 180);
        }

        export function *guard_up(entity:RPG.Entity) {
            yield *guard(entity, 270);
        }

        export function *fight_wander(entity:RPG.Entity) {
            let direction = 4, dist = 0, dx, dy;
            let map = <SimpleQuest.Map>RPG.map;
            let visionDistance:number = (entity.params.vision || 2) * map.tileSize.x,
                visionDistance2 = visionDistance * visionDistance;

            while (true) {
                let dt = yield;
                if (Trig.dist2(RPG.player.position, entity.position) <= visionDistance2) {
                    let movement = [];
                    RPG.ControlStack.push(RPG.ControlMode.None);

                    if (entity.params.notice && _.has(map, entity.params.notice)) {
                        map[entity.params.notice]();
                    } else {
                        RPG.player.sprite.animation = 'stand';

                        let exclamation = entity.params.exclamation || '';

                        entity.emote("!");
                        RPG.sfx['alert'].play();

                        while (guardMutex) {
                            dt = yield;
                        }
                        guardMutex = true;

                        entity.respectsObstructions = false;
                        entity.speed = 100;
                        while (Trig.dist(RPG.player.position, entity.position) - RPG.player.radius - entity.radius > 0) {
                            dt = yield;

                            entity.dir = PIXI.RAD_TO_DEG * Math.atan2(RPG.player.position.y - entity.position.y, RPG.player.position.x - entity.position.x);
                            dx = Math.cos(PIXI.DEG_TO_RAD * entity.dir) * entity.speed * dt;
                            dy = Math.sin(PIXI.DEG_TO_RAD * entity.dir) * entity.speed * dt;
                            entity.move(dx, dy);
                        }

                        if (exclamation !== '') {
                            yield *Scene.waitTextbox(null, [exclamation]);
                        }
                        entity.clearEmote();

                        yield *map.waitFight(entity);

                        guardMutex = null;
                        RPG.ControlStack.pop();
                    }
                } else {
                    let x = entity.position.x, y = entity.position.y;
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

                    if (dist <= 0) {
                        direction = Math.floor(Math.random() * 5);
                        dist = (Math.random() * 3 + 1) * RPG.map.tileSize.x;
                    }
                }
            }
        }

        export function *guard_wander(entity:RPG.Entity) {
            let direction = 4, dist = 0;
            var map = <SimpleQuest.Map>RPG.map;
            var visionDistance:number = entity.params.vision || 3;

            while (true) {
                let dt = yield;
                var visionEnd:PIXI.Point = new PIXI.Point(
                    entity.position.x + Math.cos(entity.dir * PIXI.DEG_TO_RAD) * visionDistance * map.tileSize.x,
                    entity.position.y + Math.sin(entity.dir * PIXI.DEG_TO_RAD) * visionDistance * map.tileSize.y
                );
                if (Trig.distToSegment(RPG.player.position, entity.position, visionEnd) < RPG.player.radius) {
                    let movement = [];
                    _.times(visionDistance, () => movement.push(entity.dir));

                    RPG.ControlStack.push(RPG.ControlMode.None);

                    if (entity.params.notice && _.has(map, entity.params.notice)) {
                        map[entity.params.notice]();
                    } else {
                        RPG.player.sprite.animation = 'stand';

                        let exclamation = entity.params.exclamation || '';

                        entity.emote("!");
                        RPG.sfx['alert'].play();

                        while (guardMutex) {
                            dt = yield;
                        }
                        guardMutex = true;

                        entity.respectsObstructions = false;
                        entity.speed = 100;
                        yield *Scene.waitEntityMove(entity, movement);
                        if (exclamation !== '') {
                            yield *Scene.waitTextbox(null, [exclamation]);
                        }
                        entity.clearEmote();

                        yield *map.waitFight(entity);

                        guardMutex = null;
                        RPG.ControlStack.pop();
                    }
                } else {
                    let x = entity.position.x, y = entity.position.y;
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

                    if (dist <= 0) {
                        direction = Math.floor(Math.random() * 5);
                        dist = (Math.random() * 3 + 1) * RPG.map.tileSize.x;
                    }
                }
            }
        }
    }
}
