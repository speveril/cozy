ball = {
    velocity: 0,
    angle: 0,
    radius: 6,
    sprite: null,
    position: { x: 0, y: 0},

    setPosition: function(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.correctPosition();
    },

    adjustPosition: function(x, y) {
        this.position.x += x;
        this.position.y += y;
        this.correctPosition();
    },

    correctPosition: function() {
        this.sprite.x = this.position.x - this.radius;
        this.sprite.y = this.position.y - this.radius;
    },

    normalizeAngle: function() {
        while (this.angle < 0) {
            this.angle += (Math.PI * 2);
        }

        while (this.angle >= Math.PI * 2) {
            this.angle -= (Math.PI * 2);
        }
    },

    step: function(dt) {
        this.adjustPosition(
            Math.sin(this.angle) * this.velocity * dt,
            -Math.cos(this.angle) * this.velocity * dt
        );
    },

    bounce: function() {
        if (
            this.position.x - this.radius < player1.sprite.position.x + player1.width &&
            this.position.x + this.radius > player1.sprite.position.x
        ) {
            if (this.position.y + this.radius >= player1.sprite.position.y && this.position.y - this.radius <= player1.sprite.position.y + player1.height) {
                this.angle = (Math.PI) + (Math.PI - this.angle);
                this.normalizeAngle();
                this.velocity *= 1 + Math.random() * 0.1;
            }
        }

        if (
            this.position.x - this.radius < player2.sprite.position.x + player2.width &&
            this.position.x + this.radius > player2.sprite.position.x
        ) {
            if (this.position.y + this.radius >= player2.sprite.position.y && this.position.y - this.radius <= player2.sprite.position.y + player2.height) {
                this.angle = -this.angle;
                this.normalizeAngle();
                this.velocity += 1 + Math.random() * 0.1;
            }
        }

        if (this.position.x < -this.radius) {
            player2.score++;
            updateScores();
            resetBall();
        }
        if (this.position.x >= Egg.config.width +this.radius) {
            player1.score++;
            updateScores();
            resetBall();
        }

        if (this.position.y < this.radius) {
            this.angle = (3 * Math.PI / 2) + (3 * Math.PI / 2 - this.angle);
            this.normalizeAngle();
            this.velocity += 1 + Math.random() * 0.1
        }
        if (this.position.y >= Egg.config.height -this.radius) {
            this.angle = (Math.PI / 2) + (Math.PI / 2 - this.angle);
            this.normalizeAngle();
            this.velocity += 1 + Math.random() * 0.1;
        }
    }
};

player1 = {
    score: 0,
    height: 48,
    width: 6,
    speed: 200
};
player2 = {
    score: 0,
    height: 48,
    width: 6,
    speed: 200
};

function start() {
    Egg.setBackground(0x223322);

    var ballTex = Egg.loadTexture("ball.png");
    ball.sprite = Egg.makeSprite(ballTex);
    Egg.stage.addChild(ball.sprite);

    var paddleTex = Egg.loadTexture("paddle.png");

    player1.sprite = Egg.makeSprite(paddleTex);
    player1.sprite.position.x = player1.width * 3;
    player1.sprite.position.y = Egg.config.height / 2 - player1.height / 2;
    Egg.stage.addChild(player1.sprite);

    player2.sprite = Egg.makeSprite(paddleTex);
    player2.sprite.position.x = Egg.config.width - player2.width * 3 - 1;
    player2.sprite.position.y = Egg.config.height / 2 - player2.height / 2;
    Egg.stage.addChild(player2.sprite);

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
}

function frame(dt) {
    if (Egg.button['exit']) {
        Egg.quit();
    }

    ball.step(dt);
    ball.bounce();

    if (Egg.button['p1_up']) {
        player1.sprite.position.y -= player1.speed * dt;
    }
    if (Egg.button['p1_down']) {
        player1.sprite.position.y += player1.speed * dt;
    }

    if (Egg.button['p2_up']) {
        player2.sprite.position.y -= player2.speed * dt;
    }
    if (Egg.button['p2_down']) {
        player2.sprite.position.y += player2.speed * dt;
    }
}

function resetBall() {
    ball.setPosition(Egg.config.width / 2, Egg.config.height / 2);
    ball.velocity = 150;
    ball.angle = Math.random() * (Math.PI / 2);
    if (Math.random() < 0.5) {
        ball.angle += Math.PI / 4;
    } else {
        ball.angle -= 3 * Math.PI / 4;
    }
    ball.normalizeAngle();
    console.log("resetBall", ball);
}

function updateScores() {
    player1.scoreDisplay.innerText = player1.score;
    player2.scoreDisplay.innerText = player2.score;
}

module.exports = {
    start: start,
    frame: frame
};
