///<reference path="Boot-Load.ts"/>

module SimpleQuest {
    export module Menu {
        export class Boot extends RPG.Menu {
            submenu:any;

            constructor() {
                super({
                    className: 'menu boot-menu',
                    html: `
                        <h1>Simple Quest</h1>
                        <ul class="main selections">
                            <li class="loadLast"  data-menu="loadLast">Continue</li>
                            <li class="new"       data-menu="newGame">New Game</li>
                            <li class="load"      data-menu="loadGame">Load Game</li>
                            <li class="options"   data-menu="@disabled">Options</li>
                            <li class="exit"      data-menu="exit">Exit</li>
                        </ul>
                    `
                });

                if (RPG.SavedGame.count() < 1) {
                    this.find('li.loadLast').remove();
                    this.find('li.load').remove();
                }

                this.setupSelections(this.find('.selections'));
            }

            beginGame(gameData:RPG.SavedGame) {
                this.pause();
                RPG.Scene.do(function*() {
                    RPG.sfx['menu_newgame'].play();
                    yield* RPG.Scene.waitFadeTo("black", 1.0);
                    RPG.Menu.pop();
                    this.remove();
                    SimpleQuest.startGame(gameData);
                }.bind(this))
            }

            unpause() {
                super.unpause();
                console.log(this.submenu, this.submenu.choice);
                if (this.submenu && this.submenu.choice) {
                    this.beginGame(this.submenu.choice);
                }
            }

            newGame() {
                this.beginGame(SimpleQuest.newGameData());
            }

            loadLast() {
                this.beginGame(RPG.SavedGame.getList()[0]);
            }

            loadGame() {
                this.submenu = new Boot_Load();
                this.addChild(this.submenu);
                RPG.Menu.push(this.submenu);
            }

            options() {
                alert("TODO open options menu");
            }

            exit() {
                SimpleQuest.Menu.quitGame();
            }
        }
    }
}
