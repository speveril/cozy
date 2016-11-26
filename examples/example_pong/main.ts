class Ball extends Cozy.Sprite {
    velocity: number;
    angle: number;

    radius: number;

    constructor(args) {
        super(args);
        this.velocity = 0;
        this.angle = 0;
        this.radius = args.hotspot.x;
    }

    step(dt) {
        this.adjustPosition(
            Math.sin(this.angle) * this.velocity * dt,
            -Math.cos(this.angle) * this.velocity * dt
        );
    }

    normalizeAngle() {
        while (this.angle < 0) this.angle += (Math.PI * 2);
        while (this.angle >= Math.PI * 2) this.angle -= (Math.PI * 2);
    }

    bounce() {
        if (
            this.position.x - this.radius < player1.innerSprite.position.x + player1.width &&
            this.position.x + this.radius > player1.innerSprite.position.x
        ) {
            if (this.position.y + this.radius >= player1.innerSprite.position.y && this.position.y - this.radius <= player1.innerSprite.position.y + player1.height) {
                this.setPosition(player1.innerSprite.position.x + this.radius + player1.width, this.position.y);
                this.angle = (Math.PI / 4) + (Math.PI / 2) * ((this.position.y - player1.innerSprite.position.y) / (player1.height + 2 * this.radius));
                this.normalizeAngle();
                this.velocity *= 1 + Math.random() * 0.3;
            }
        }

        if (
            this.position.x - this.radius < player2.innerSprite.position.x + player2.width &&
            this.position.x + this.radius > player2.innerSprite.position.x
        ) {
            if (this.position.y + this.radius >= player2.innerSprite.position.y && this.position.y - this.radius <= player2.innerSprite.position.y + player2.height) {
                this.setPosition(player2.innerSprite.position.x - this.radius, this.position.y);
                this.angle = -(Math.PI / 4) - (Math.PI / 2) * ((this.position.y - player2.innerSprite.position.y) / (player2.height + 2 * this.radius));
                this.normalizeAngle();
                this.velocity += 1 + Math.random() * 0.3;
            }
        }

        if (this.position.x < -this.radius) {
            player2.score++;
            resetBall();
        }
        if (this.position.x >= Cozy.config['width'] + this.radius) {
            player1.score++;
            resetBall();
        }

        if (this.position.y < this.radius) {
            this.angle = (3 * Math.PI / 2) + (3 * Math.PI / 2 - this.angle);
            this.normalizeAngle();
            this.velocity += 1 + Math.random() * 0.3;
        }
        if (this.position.y >= Cozy.config['height'] -this.radius) {
            this.angle = (Math.PI / 2) + (Math.PI / 2 - this.angle);
            this.normalizeAngle();
            this.velocity += 1 + Math.random() * 0.3;
        }
    }
}

class Player extends Cozy.Sprite {
    score: number;
    speed: number;
    width: number;
    height: number;
    scoreDisplay: any;

    constructor(args) {
        super(args);
        this.score = 0;
        this.height = 48;
        this.width = 6;
        this.speed = 250;
    }
}

class ScoreComponent extends Cozy.UiComponent {
    player: Player;

    constructor(args) {
        super(args);

        this.element.style.fontSize = '40px';
        this.element.style.fontFamily = 'Calibri, sans-serif';
        this.element.style.color = 'white';
        this.element.style.position = 'absolute';
        this.element.style.top = '5px';
        this.element.style[args.side] = '5px';

        this.player = args.player;
    }

    update(dt) {
        super.update(dt);
        this.setScore(this.player.score);
    }

    setScore(score):void {
        this.element.innerText = score;
    }
}

var player1: Player;
var player2: Player;

var ball: Ball;
var renderPlane: Cozy.RenderPlane;
var uiPlane: Cozy.UiPlane;
var stage: Cozy.Layer;

function start() {
    Cozy.loadTextures({
        "ball": "ball.png",
        "paddle": "paddle.png"
    }).then(beginGame);
}

function beginGame() {
    renderPlane = <Cozy.RenderPlane>Cozy.addPlane(Cozy.RenderPlane);
    renderPlane.setBackground(0x223322);
    stage = renderPlane.addRenderLayer();

    ball = new Ball({
        texture: Cozy.textures['ball'],
        hotspot: { x: 6, y: 6 }
    });
    stage.add(ball);

    player1 = new Player({
        texture: Cozy.textures['paddle'],
        hotspot: { x: 3, y: 24 },
        position: { x: 6 * 3, y: Cozy.config['height'] / 2 - 48 / 2 }
    });

    stage.add(player1);

    player2 = new Player({
        texture: Cozy.textures['paddle'],
        hotspot: { x: 3, y: 24 },
        position: { x: Cozy.config['width'] - 6 * 3 - 1, y: Cozy.config['height'] / 2 - 48 / 2 }
    });

    stage.add(player2);

    uiPlane = <Cozy.UiPlane>Cozy.addPlane(Cozy.UiPlane);

    player1.scoreDisplay = new ScoreComponent({ side: 'left', player: player1 });
    uiPlane.addChild(player1.scoreDisplay);

    player2.scoreDisplay = new ScoreComponent({ side: 'right', player: player2 });
    uiPlane.addChild(player2.scoreDisplay);

    resetBall();

    Cozy.unpause();
}

function frame(dt) {
    if (Cozy.Input.pressed('exit')) {
        Cozy.quit();
    }

    ball.step(dt);
    ball.bounce();

    if (Cozy.Input.pressed('p1_up')) {
        player1.innerSprite.position.y -= player1.speed * dt;
    }
    if (Cozy.Input.pressed('p1_down')) {
        player1.innerSprite.position.y += player1.speed * dt;
    }

    if (Cozy.Input.pressed('p2_up')) {
        player2.innerSprite.position.y -= player2.speed * dt;
    }
    if (Cozy.Input.pressed('p2_down')) {
        player2.innerSprite.position.y += player2.speed * dt;
    }
}

function resetBall() {
    ball.setPosition(Cozy.config['width'] / 2, Cozy.config['height'] / 2);
    ball.velocity = 250;
    ball.angle = Math.random() * (Math.PI / 2);
    if (Math.random() < 0.5) {
        ball.angle += Math.PI / 4;
    } else {
        ball.angle -= 3 * Math.PI / 4;
    }
    ball.normalizeAngle();
}

module.exports = {
    start: start,
    frame: frame
};
