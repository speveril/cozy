module CubemapTest {
    var maplayout = [
        [[1, 1, 1], [1, 1, 1], [1, 0, 1]],
        [[1, 1, 0], [1, 0, 0], [0, 0, 0]],
        [[1, 1, 0], [0, 0, 0], [0, 0, 0]],
    ];
    var mapsize = [3, 3, 3];


    export function start() {
        Egg.loadTextures({
            cube_1: 'assets/cube1.png'
        }).then(setup);
    }

    export function frame(dt) {
    }

    function setup() {
        var plane:Egg.RenderPlane = <Egg.RenderPlane>Egg.addPlane(Egg.RenderPlane);
        var layer:Egg.Layer = plane.addRenderLayer();

        layer.offset(960, 540);

        var x = 0, y = 0, z = 0;

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

            console.log(x,y,z);
            var tile = maplayout[z][y][x];
            if (tile !== 0) {
                layer.add(new Egg.Sprite({
                    texture: Egg.textures['cube_' + tile],
                    hotspot: { x: 48, y: 54 },
                    position: {
                        x: x * 48 - y * 48,
                        y: x * 24 + y * 24 - z * 30
                    }
                }))
            }
        }

        Egg.unpause();
    }
}

module.exports = CubemapTest;
