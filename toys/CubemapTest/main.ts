module CubemapTest {
    let maplayout = [
        [[1, 1, 1], [1, 1, 1], [1, 0, 1]],
        [[1, 0, 0], [1, 0, 0], [0, 0, 0]],
        [[1, 1, 0], [0, 0, 0], [0, 0, 0]],
    ];
    let mapsize = [3, 3, 3];
    let playerPosition = [ 0.5, 0.5, 1 ];
    let playerSprite;
    let plane:Cozy.RenderPlane;
    let layer:Cozy.Layer;

    export function start() {
        Cozy.loadTextures({
            cube_1:             new Cozy.File('assets/cube-big-001.png'),
            sprite_kiel:        new Cozy.File('assets/sprite-kiel.png')
        }).then(setup);
    }

    export function frame(dt) {
        if (playerSprite) {
            let dx = 0, dy = 0, dz = 0;
            if (Cozy.Input.pressed('up')) { dx--; dy--; }
            if (Cozy.Input.pressed('right')) { dx++; dy--; }
            if (Cozy.Input.pressed('down')) { dx++; dy++; }
            if (Cozy.Input.pressed('left')) { dx--; dy++; }
            if (Cozy.Input.pressed('confirm')) { dz++; }
            if (Cozy.Input.pressed('cancel')) { dz--; }

            playerPosition[0] += dx * dt;
            playerPosition[1] += dy * dt;
            playerPosition[2] += dz * dt;

            playerSprite['3dpos'] = playerPosition;
            playerSprite.setPosition(
                playerPosition[0] * 60 - playerPosition[1] * 60,
                playerPosition[0] * 45 + playerPosition[1] * 45 - playerPosition[2] * 60
            );
        }

        layer.sortSprites((a,b) => {
            return (a['3dpos'][0] + a['3dpos'][1] + a['3dpos'][2] * 0.000001) - (b['3dpos'][0] + b['3dpos'][1] + b['3dpos'][2] * 0.000001);
        });
    }

    function setup() {
        plane = <Cozy.RenderPlane>Cozy.addPlane(Cozy.RenderPlane);
        layer = plane.addRenderLayer()
        layer.offset(960, 540);

        let x = 0, y = 0, z = 0;

        playerSprite = new Cozy.Sprite({
            texture: Cozy.textures['sprite_kiel'],
            hotspot: { x: 60, y: 100 },
            position: {
                x: playerPosition[0] * 60 - playerPosition[1] * 60,
                y: playerPosition[0] * 45 + playerPosition[1] * 45 - playerPosition[2] * 60
            }
        });
        layer.add(playerSprite);

        while (true) {
            z++;
            if (z >= mapsize[2]) {
                z = 0;
                y--;
                if (y < 0) {
                    y = x + 1;
                    x = 0;
                } else {
                    x++;
                }
            }

            if (y >= mapsize[1] + mapsize[0]) {
                break;
            }
            if (x >= mapsize[0] || y >= mapsize[1])  {
                continue;
            }

            // console.log(x,y,z);
            let tile = maplayout[z][y][x];
            if (tile !== 0) {
                let s = new Cozy.Sprite({
                    texture: Cozy.textures['cube_' + tile],
                    hotspot: { x: 60, y: 150 },
                    position: {
                        x: (x + 0.5) * 60 - (y + 0.5) * 60,
                        y: (x + 0.5) * 45 + (y + 0.5) * 45 - (z + 0.5) * 60
                    }
                });
                s['3dpos'] = [x + 0.5, y + 0.5, z];
                s['sortKey'] =
                layer.add(s);
            }
        }

        Cozy.unpause();
    }
}

module.exports = CubemapTest;
