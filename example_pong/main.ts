///<reference path="../egg/resources/default_app/Egg.d.ts" />

class Ball extends Egg.Sprite {
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
            updateScores();
            resetBall();
        }
        if (this.position.x >= Egg.config['width'] + this.radius) {
            player1.score++;
            updateScores();
            resetBall();
        }

        if (this.position.y < this.radius) {
            this.angle = (3 * Math.PI / 2) + (3 * Math.PI / 2 - this.angle);
            this.normalizeAngle();
            this.velocity += 1 + Math.random() * 0.3;
        }
        if (this.position.y >= Egg.config['height'] -this.radius) {
            this.angle = (Math.PI / 2) + (Math.PI / 2 - this.angle);
            this.normalizeAngle();
            this.velocity += 1 + Math.random() * 0.3;
        }
    }
}

class Player extends Egg.Sprite {
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

var player1:Player;
var player2:Player;

var ball;
var stage;
var plane;

function start() {
    Egg.loadTextures({
        "ball": "ball.png",
        "paddle": "paddle.png"
    }, beginGame);
}

function beginGame() {
    plane = Egg.addPlane({
        renderable: true
    });
    plane.setBackground(0x223322);
    stage = plane.addRenderLayer();

    ball = new Ball({
        texture: Egg.textures['ball'],
        hotspot: { x: 6, y: 6 }
    });
    stage.add(ball);

    player1 = new Player({
        texture: Egg.textures['paddle'],
        hotspot: { x: 3, y: 24 },
        position: { x: 6 * 3, y: Egg.config['height'] / 2 - 48 / 2 }
    });

    stage.add(player1);

    player2 = new Player({
        texture: Egg.textures['paddle'],
        hotspot: { x: 3, y: 24 },
        position: { x: Egg.config['width'] - 6 * 3 - 1, y: Egg.config['height'] / 2 - 48 / 2 }
    });

    stage.add(player2);

    player1.scoreDisplay = window.document.createElement('div');
    player1.scoreDisplay.style.fontSize = '40px';
    player1.scoreDisplay.style.fontFamily = 'Calibri, sans-serif';
    player1.scoreDisplay.style.color = 'white';
    player1.scoreDisplay.style.position = 'absolute';
    player1.scoreDisplay.style.left = '5px';
    player1.scoreDisplay.style.top = '5px';
    window.document.body.appendChild(player1.scoreDisplay);

    player2.scoreDisplay = window.document.createElement('div');
    player2.scoreDisplay.style.fontSize = '40px';
    player2.scoreDisplay.style.fontFamily = 'Calibri, sans-serif';
    player2.scoreDisplay.style.color = 'white';
    player2.scoreDisplay.style.position = 'absolute';
    player2.scoreDisplay.style.right = '5px';
    player2.scoreDisplay.style.top = '5px';
    window.document.body.appendChild(player2.scoreDisplay);

    updateScores();

    resetBall();

    Egg.unpause();
}

function frame(dt) {
    if (Egg.button('exit')) {
        Egg.quit();
    }

    ball.step(dt);
    ball.bounce();

    if (Egg.button('p1_up')) {
        player1.innerSprite.position.y -= player1.speed * dt;
    }
    if (Egg.button('p1_down')) {
        player1.innerSprite.position.y += player1.speed * dt;
    }

    if (Egg.button('p2_up')) {
        player2.innerSprite.position.y -= player2.speed * dt;
    }
    if (Egg.button('p2_down')) {
        player2.innerSprite.position.y += player2.speed * dt;
    }
}

function resetBall() {
    ball.setPosition(Egg.config['width'] / 2, Egg.config['height'] / 2);
    ball.velocity = 250;
    ball.angle = Math.random() * (Math.PI / 2);
    if (Math.random() < 0.5) {
        ball.angle += Math.PI / 4;
    } else {
        ball.angle -= 3 * Math.PI / 4;
    }
    ball.normalizeAngle();
}

function updateScores() {
    player1.scoreDisplay.innerText = player1.score;
    player2.scoreDisplay.innerText = player2.score;
}

module.exports = {
    start: start,
    frame: frame
};
