var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Invaders;
(function (Invaders) {
    var Player = (function (_super) {
        __extends(Player, _super);
        function Player(args) {
            console.log("Create Player ->", Egg.textures['player'].width);
            args = _.extend({
                texture: Egg.textures['player'],
                hotspot: { x: Egg.textures['player'].width / 2, y: Egg.textures['player'].height / 2 }
            }, args);
            _super.call(this, args);
        }
        return Player;
    })(Egg.Sprite);
    Invaders.Player = Player;
})(Invaders || (Invaders = {}));
var Invaders;
(function (Invaders) {
    var Alien = (function (_super) {
        __extends(Alien, _super);
        function Alien(args) {
            var variant = args.variant || '1';
            args = _.extend({
                texture: Egg.textures['alien_' + variant],
                hotspot: { x: Egg.textures['alien_' + variant].width / 2, y: Egg.textures['alien_' + variant].width / 2 }
            }, args);
            _super.call(this, args);
            this.destroyed = false;
            this.direction = 1;
            this.speed = args.speed || 35;
            this.value = args.value || 100;
            this.bounds = {
                left: args.bounds.left,
                right: args.bounds.right
            };
        }
        Alien.prototype.update = function (dt) {
            this.adjustPosition(this.speed * dt * this.direction, 0);
            if (this.direction === 1 && this.position.x > this.bounds.right) {
                this.direction = -1;
                this.adjustPosition(this.bounds.right - this.position.x, 5);
            }
            if (this.direction === -1 && this.position.x < this.bounds.left) {
                this.direction = 1;
                this.adjustPosition(this.bounds.left - this.position.x, 5);
            }
        };
        return Alien;
    })(Egg.Sprite);
    Invaders.Alien = Alien;
})(Invaders || (Invaders = {}));
var Invaders;
(function (Invaders) {
    var Barrier = (function (_super) {
        __extends(Barrier, _super);
        function Barrier() {
            _super.apply(this, arguments);
        }
        return Barrier;
    })(Egg.Sprite);
    Invaders.Barrier = Barrier;
})(Invaders || (Invaders = {}));
///<reference path="Player.ts"/>
///<reference path="Alien.ts"/>
///<reference path="Barrier.ts"/>
var Invaders;
(function (Invaders) {
    var plane;
    var stage;
    var player;
    var playerShot = null;
    var aliens;
    var score;
    function start() {
        Egg.loadTextures({
            player: "gfx/player.png",
            shot: "gfx/shot.png",
            alien_1: "gfx/alien01.png",
            alien_2: "gfx/alien02.png",
            alien_3: "gfx/alien03.png"
        }).then(function () {
            _.each(Egg.textures, function (v, k) {
                console.log(k, v);
            });
            plane = Egg.addPlane(Egg.RenderPlane, {
                renderable: true
            });
            stage = plane.addRenderLayer();
            plane.setBackground(0x303040);
            resetGame();
            Egg.unpause();
        });
    }
    Invaders.start = start;
    function frame(dt) {
        // this will run every frame
        // - dt is the number of seconds that have passed since the last frame
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
        if (playerShot) {
            playerShot.adjustPosition(0, -300 * dt);
            if (playerShot.position.y < -20) {
                stage.remove(playerShot);
                playerShot = null;
            }
        }
        var won = true;
        var lost = false;
        var speedup = 0;
        aliens.forEach(function (alien) {
            if (alien.destroyed) {
                return;
            }
            alien.update(dt);
            if (playerShot && playerShot.overlaps(alien)) {
                stage.remove(alien);
                alien.destroyed = true;
                score += alien.value;
                stage.remove(playerShot);
                playerShot = null;
                speedup = Math.random() * 5;
                ;
            }
            if (!alien.destroyed) {
                won = false;
                if (alien.position.y > Egg.config['height'] - 32) {
                    lost = true;
                }
            }
        });
        if (speedup > 0) {
            aliens.forEach(function (alien) { alien.speed += speedup; });
        }
        if (won) {
            alert("You won!");
            Egg.quit();
        }
        else if (lost) {
            alert("You lost. :(");
            Egg.quit();
        }
    }
    Invaders.frame = frame;
    function resetGame() {
        console.log("resetGame");
        stage.clear();
        score = 0;
        player = new Invaders.Player({
            position: { x: Egg.config['width'] / 2, y: Egg.config['height'] - 25 }
        });
        stage.add(player);
        var alienPattern = [
            'xxxxxxxx',
            'xxxxxxxx',
            'xxxxxxxx',
            'xxxxxxxx',
            'xxxxxxxx',
            'xxxxxxxx',
        ];
        var widest = _.max(alienPattern, function (x) { return x.length; }).length;
        console.log(widest);
        aliens = [];
        var y = 32;
        _.each(alienPattern, function (row) {
            var rowWidth = row.length;
            var left = Egg.config['width'] / 2 - rowWidth * 16;
            var leftBorder = 8 + (widest - rowWidth) * 16;
            var rightBorder = 292 - (widest - rowWidth) * 16;
            _.each(row, function (variant, i) {
                if (variant === ' ')
                    return;
                if (variant === 'x')
                    variant = Math.floor(Math.random() * 3);
                aliens.push(new Invaders.Alien({
                    variant: variant,
                    position: { x: left + 32 * i, y: y },
                    bounds: { left: leftBorder + 32 * i, right: rightBorder - 32 * (row.length - i - 1) }
                }));
            });
            y += 20;
        }.bind(this));
        aliens.forEach(function (alien) { stage.add(alien); });
        playerShot = null;
    }
    function playerShoot() {
        if (!playerShot) {
            playerShot = new Egg.Sprite({
                texture: Egg.textures['shot'],
                hotspot: { x: 2, y: 2 },
                position: { x: player.position.x, y: player.position.y - 15 }
            });
            stage.add(playerShot);
        }
    }
})(Invaders || (Invaders = {}));
module.exports = Invaders;
//# sourceMappingURL=main.js.map