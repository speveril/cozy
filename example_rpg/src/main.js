include("lib/Class.js");
include("Map.js");
include("MapScripts.js");
include("Textbox.js");

var TILE_SIZE = 16;
var HALF_TILE = TILE_SIZE/2;
var direction = { DOWN: 0, UP: 1, RIGHT: 2, LEFT: 3, SOUTH: 0, NORTH: 1, EAST: 2, WEST: 3 };

var playerSprite;
var map;
var frameTimer = 0;
var worldFrame = 0;
var textLayer = null;
var camera_options = {
    follow: false,
    bounds: { n: 0, e: 0, w: 0, s: 0 }
};

function main() {
    Input.registerKey("exit", Input.key.ESCAPE);

    Input.registerKey("up", Input.key.UP);
    Input.registerKey("up", Input.key.KP_8);
    Input.registerKey("down", Input.key.DOWN);
    Input.registerKey("down", Input.key.KP_2);
    Input.registerKey("left", Input.key.LEFT);
    Input.registerKey("left", Input.key.KP_4);
    Input.registerKey("right", Input.key.RIGHT);
    Input.registerKey("right", Input.key.KP_6);
    Input.registerKey("act", Input.key.SPACE);

    Textbox.config(new Font("font/prstartk.ttf", 8), new Sprite("image/textbox.png", Textbox.width, Textbox.height));

    setUpdateCallback(update);

    mapSwitch("map/town.json", 8, 9, direction.RIGHT, true);
}

function mapSwitch(mapfile, x, y, dir, first) {
    if (!first) popMode();
    if (dir === undefined) {
        dir = playerSprite.dir;
    }

    var mode = new Mode();
    pushMode(mode);
    map = new Map(mapfile);
    map.show(mode, new Camera());

    camera_options.bounds = {
        n: 0, w: 0, e: map.mapWidth * map.tileWidth, s: map.mapHeight * map.tileHeight
    };

    playerSprite = new Sprite("image/sersha.png", TILE_SIZE, TILE_SIZE);
    playerSprite.x = TILE_SIZE * x + HALF_TILE;
    playerSprite.y = TILE_SIZE * y + HALF_TILE;
    playerSprite.originX = HALF_TILE;
    playerSprite.originY = HALF_TILE;
    map.spritelayer.add(playerSprite);
    playerSprite.dir = dir;

    Textbox.init(mode);
}

function px_to_t(n) {
    return Math.floor(n / TILE_SIZE);
}


var ignore_act = false;

function update(dt) {
    if (Input.pressed("exit")) exit();

    var tx = Math.floor(playerSprite.x / TILE_SIZE);
    var ty = Math.floor(playerSprite.y / TILE_SIZE);

    if (!Textbox.showing) {
        var dx = 0, dy = 0, v = dt * (8 * HALF_TILE / 1000);
        if (Input.pressed("left")) { dx -= v; playerSprite.dir = direction.LEFT; }
        if (Input.pressed("right")) { dx += v; playerSprite.dir = direction.RIGHT; }
        if (Input.pressed("up")) { dy -= v; playerSprite.dir = direction.UP; }
        if (Input.pressed("down")) { dy += v; playerSprite.dir = direction.DOWN; }

        var animating = false;

        if (dx < 0) {
            var topLeftBlocked = map.checkObs(px_to_t(playerSprite.x + dx - (HALF_TILE)), px_to_t(playerSprite.y - (HALF_TILE)));
            var middleLeftBlocked = map.checkObs(px_to_t(playerSprite.x + dx - (HALF_TILE)), px_to_t(playerSprite.y));
            var bottLeftBlocked = map.checkObs(px_to_t(playerSprite.x + dx - (HALF_TILE)), px_to_t(playerSprite.y + (HALF_TILE - 1)));
            if (topLeftBlocked || bottLeftBlocked) {
                dx = 0;
                if (!middleLeftBlocked && dy == 0) {
                    if (topLeftBlocked) dy += v;
                    if (bottLeftBlocked) dy -= v;
                }
            }
        } else if (dx > 0) {
            var topRightBlocked = map.checkObs(px_to_t(playerSprite.x + dx + (HALF_TILE - 1)), px_to_t(playerSprite.y - (HALF_TILE)));
            var middleRightBlocked = map.checkObs(px_to_t(playerSprite.x + dx + (HALF_TILE - 1)), px_to_t(playerSprite.y));
            var bottRightBlocked = map.checkObs(px_to_t(playerSprite.x + dx + (HALF_TILE - 1)), px_to_t(playerSprite.y + (HALF_TILE - 1)));
            if (topRightBlocked || bottRightBlocked) {
                dx = 0;
                if (!middleRightBlocked && dy == 0) {
                    if (topRightBlocked) dy += v;
                    if (bottRightBlocked) dy -= v;
                }
            }
        }

        if (dy < 0) {
            var topLeftBlocked = map.checkObs(px_to_t(playerSprite.x - (HALF_TILE)), px_to_t(playerSprite.y + dy - (HALF_TILE)));
            var topMiddleBlocked = map.checkObs(px_to_t(playerSprite.x), px_to_t(playerSprite.y + dy - (HALF_TILE)));
            var topRightBlocked = map.checkObs(px_to_t(playerSprite.x + (HALF_TILE - 1)), px_to_t(playerSprite.y + dy - (HALF_TILE)));
            if (topLeftBlocked || topRightBlocked) {
                dy = 0;
                if (!topMiddleBlocked && dx == 0) {
                    if (topLeftBlocked) dx += v;
                    if (topRightBlocked) dx -= v;
                }
            }
        } else if (dy > 0) {
            var bottLeftBlocked = map.checkObs(px_to_t(playerSprite.x - (HALF_TILE)), px_to_t(playerSprite.y + dy + (HALF_TILE - 1)));
            var bottMiddleBlocked = map.checkObs(px_to_t(playerSprite.x), px_to_t(playerSprite.y + dy + (HALF_TILE - 1)));
            var bottRightBlocked = map.checkObs(px_to_t(playerSprite.x + (HALF_TILE - 1)), px_to_t(playerSprite.y + dy + (HALF_TILE - 1)));
            if (bottLeftBlocked || bottRightBlocked) {
                dy = 0;
                if (!bottMiddleBlocked && dx == 0) {
                    if (bottLeftBlocked) dx += v;
                    if (bottRightBlocked) dx -= v;
                }
            }
        }

        animating = (dx != 0 || dy != 0);

        dx = Math.max(-v, Math.min(v, dx));
        dy = Math.max(-v, Math.min(v, dy));

        playerSprite.x += dx;
        playerSprite.y += dy;
    }

    frameTimer += dt;


    var f = playerSprite.dir * 5;

    if (animating || Input.pressed("down")) {
        f += 1 + Math.floor(frameTimer % 600 / 150);
    }

    playerSprite.setFrame(f);
    if (camera_options.follow) {
        var x = playerSprite.x;
        var y = playerSprite.y;

        if (x > camera_options.bounds.e - 160) x = camera_options.bounds.e - 160;
        if (x < camera_options.bounds.w + 160) x = camera_options.bounds.w + 160;
        if (y > camera_options.bounds.s - 120) y = camera_options.bounds.s - 120;
        if (y < camera_options.bounds.n + 120) y = camera_options.bounds.n + 120;

        map.camera.setTarget(x, y);
    }

    // TODO super hacky tile animation; need to do this right, in the engine
    if (Math.floor(frameTimer / 100) > worldFrame) {
        worldFrame = Math.floor(frameTimer / 100);
        for (var y = 0; y < map.mapHeight; y++) {
            for (var x = 0; x < map.mapWidth; x++) {
                var t = map.layers[1].getTile(x,y);
                switch(t) {
                    case 6:  case 7:  // door opening
                    case 22: case 23: // metal door opening
                    case 38: case 39: // chest opening
                    case 54: case 55: // smashing pot
                    case 81: case 82: // fireplaces
                    case 97: case 98:
                    case 113: case 114:
                    case 206: case 207:  // torches
                    case 222: case 223:
                    case 238: case 239:
                    case 254: case 255:
                        map.layers[1].setTile(x,y,t+1); break;
                    case 83: case 99: case 115:
                    case 208: case 224: case 240: case 256: // torches, last frame
                        map.layers[1].setTile(x,y,t-2); break;
                }

                // quarter-speed animations
                if (worldFrame % 4 == 0) {
                    switch(t) {
                        case 127: map.layers[1].setTile(x,y,128); break; // water cycle
                        case 128: map.layers[1].setTile(x,y,127); break;
                        case 88: map.layers[1].setTile(x,y,89); break; // lava cycle
                        case 89: map.layers[1].setTile(x,y,88); break;
                    }
                }
            }
        }
    }

    var txNew = Math.floor(playerSprite.x / TILE_SIZE);
    var tyNew = Math.floor(playerSprite.y / TILE_SIZE);

    if ((tx != txNew || ty != tyNew) && map.checkEvent(txNew, tyNew)) {
        var e = map.checkEvent(txNew, tyNew);
        if (e.type == "event") {
            f = eval(e.script);
            f({ x: txNew, y: tyNew });
            return;
        }
    }

    if (Input.pressed("act")) {
        if (!ignore_act) {
            ignore_act = true;

            if (Textbox.showing) {
                Textbox.hide();
            } else {
                var txAct = txNew;
                var tyAct = tyNew;
                switch (playerSprite.dir) {
                    case direction.UP: tyAct--; break;
                    case direction.DOWN: tyAct++; break;
                    case direction.LEFT: txAct--; break;
                    case direction.RIGHT: txAct++; break;
                }

                var e = map.checkEvent(txAct, tyAct);
                if (e && e.type == "trigger") {
                    f = eval(e.script);
                    f({ x: txAct, y: tyAct, act: true });
                    return;
                }
            }
        }
    } else {
        ignore_act = false;
    }
}
