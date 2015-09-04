///<reference path="../resources/default_app/Egg.d.ts"/>
///<reference path="Player.ts"/>
///<reference path="Alien.ts"/>
///<reference path="Barrier.ts"/>

module Invaders {
    var stage:Egg.Layer;

    var player:Player;
    var playerShot:Egg.Sprite = null;
    var aliens:Array<Alien>;

    var score:number;

    export function start() {
        Egg.loadTextures({
            player:   "gfx/player.png",
            shot:     "gfx/shot.png",
            alien_1:  "gfx/alien01.png",
            alien_2:  "gfx/alien02.png",
            alien_3:  "gfx/alien03.png"
        }, complete);

        function complete() {
            _.each(Egg.textures, function(v,k) {
                console.log(k,v);
            });

            Egg.setBackground(0x303040);
            stage = Egg.addLayer();

            resetGame();
            Egg.unpause();
        }
    }

    export function frame(dt:number) {
        // this will run every frame
        // - dt is the number of seconds that have passed since the last frame

        // -- process input --

        if (Egg.button('menu')) {
            Egg.quit();
        }

        if (Egg.button('left')) {
            player.setPosition(Math.max(7, player.position.x - 200 * dt), player.position.y);
        }
        if (Egg.button('right')) {
            player.setPosition(Math.min(Egg.config['width'] - 8, player.position.x + 200 * dt), player.position.y);
        }

        if (Egg.button('confirm') || Egg.button('cancel')) {
            playerShoot();
        }

        // -- step world --

        if (playerShot) {
            playerShot.adjustPosition(0, -300 * dt);
            if (playerShot.position.y < -20) {
                stage.removeSprite(playerShot);
                playerShot = null;
            }
        }

        var won:boolean      = true;
        var lost:boolean     = false;
        var speedup:number   = 0;

        aliens.forEach(function(alien) {
            if (alien.destroyed) {
                return;
            }

            alien.update(dt);

            if (playerShot && playerShot.overlaps(alien)) {
                stage.removeSprite(alien);
                alien.destroyed = true;
                score += alien.value;

                stage.removeSprite(playerShot);
                playerShot = null;
                speedup = Math.random() * 5;;
            }

            if (!alien.destroyed) {
                won = false;
                if (alien.position.y > Egg.config['height'] - 32) {
                    lost = true;
                }
            }
        });

        if (speedup > 0) {
            aliens.forEach(function(alien) { alien.speed += speedup; });
        }

        if (won) {
            alert("You won!");
            Egg.quit();
        } else if (lost) {
            alert("You lost. :(");
            Egg.quit();
        }
    }


    function resetGame() {
        console.log("resetGame");
        stage.clear();

        score = 0;

        player = new Player({
            position: { x: Egg.config['width'] / 2, y: Egg.config['height'] - 25 }
        });
        stage.addSprite(player);

        var alienPattern = [
            'xxxxxxxx',
            'xxxxxxxx',
            'xxxxxxxx',
            'xxxxxxxx',
            'xxxxxxxx',
            'xxxxxxxx',
        ];
        var widest = _.max(alienPattern, function(x) { return x.length; }).length;
        console.log(widest);

        aliens = [];

        var y = 32;
        _.each(alienPattern, function(row) {
            var rowWidth = row.length;
            var left = Egg.config['width'] / 2 - rowWidth * 16;
            var leftBorder = 8 + (widest - rowWidth) * 16;
            var rightBorder = 292 - (widest - rowWidth) * 16;

            _.each(row, function(variant, i) {
                if (variant === ' ') return;
                if (variant === 'x') variant = Math.floor(Math.random() * 3);

                aliens.push(new Alien({
                    variant: variant,
                    position: { x: left + 32 * i, y: y },
                    bounds: { left: leftBorder + 32 * i, right: rightBorder - 32 * (row.length - i - 1) }
                }));
            });
            y += 20;
        }.bind(this));

        aliens.forEach(function(alien) { stage.addSprite(alien); });

        playerShot = null;
    }

    function playerShoot() {
        if (!playerShot) {
            playerShot = new Egg.Sprite({
                texture: Egg.textures['shot'],
                hotspot: { x: 2, y: 2 },
                position: { x: player.position.x, y: player.position.y - 15 }
            });
            stage.addSprite(playerShot);
        }
    }
}

module.exports = Invaders;
