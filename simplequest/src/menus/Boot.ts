module SimpleQuest {
    export module Menu {
        export class Boot extends RPG.Menu {
            constructor() {
                super({
                    className: 'menu boot-menu',
                    html: `
                        <h1>Simple Quest</h1>
                        <ul class="selections">
                            <li class="new"  data-menu="newGame">New Game</li>
                            <li class="load" data-menu="${RPG.SavedGame.count() < 1 ? '@disabled' : 'loadGame'}">Load Game</li>
                            <li class="exit" data-menu="exit">Exit</li>
                        </ul>
                    `
                });

                this.setupSelections(this.find('.selections'));
            }

            newGame() {
                this.pause();
                RPG.Scene.do(function*() {
                    RPG.sfx['menu_newgame'].play();
                    yield* RPG.Scene.waitFadeTo("black", 1.0);
                    RPG.Menu.pop();
                    this.remove();
                    SimpleQuest.newGame();
                }.bind(this))
            }

            loadGame() {
                console.log("k");
            }

            exit() {
                SimpleQuest.Menu.quitGame();
            }
        }
    }
}
