module SimpleQuest {
    export module Menu {
        export class Boot extends RPG.Menu {
            constructor() {
                super({
                    className: 'menu boot-menu',
                    html: `
                        <h1>Simple Quest</h1>
                        <ul class="selections">
                            <li data-menu="newGame">New Game</li>
                            <li data-menu="@disabled">Load Game</li>
                            <li data-menu="exit">Exit</li>
                        </ul>
                    `
                });
                this.setupSelections(this.find('.selections'));
            }

            newGame() {
                this.pause();
                RPG.Scene.do(function*() {
                    sfx['menu_newgame'].play();
                    yield* RPG.Scene.waitFadeTo("black", 1.0);
                    RPG.Menu.pop();
                    SimpleQuest.newGame();
                }.bind(this))
            }

            loadGame() { console.log("not yet"); }

            exit() {
                SimpleQuest.Menu.quitGame();
            }
        }
    }
}
