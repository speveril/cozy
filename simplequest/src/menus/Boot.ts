///<reference path="Boot-Load.ts"/>
///<reference path="Boot-Options.ts"/>

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
                            <li class="options"   data-menu="options">Options</li>
                            <li class="credits"   data-menu="credits">Credits</li>
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
                    yield* RPG.Scene.waitFadeOut(1.0);
                    RPG.Menu.pop();
                    this.remove();
                    SimpleQuest.startGame(gameData);
                }.bind(this));
            }

            unpause() {
                super.unpause();
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

            credits() {
                RPG.Scene.do(function*() {
                    this.element.style.display = 'none';
                    yield *SimpleQuest.waitOnCredits();
                    this.element.style.display = '';
                    RPG.music['overworld'].start();
                }.bind(this));
            }

            options() {
                this.submenu = new Boot_Options();
                this.addChild(this.submenu);
                RPG.Menu.push(this.submenu);
            }

            exit() {
                SimpleQuest.Menu.quitGame();
            }
        }
    }
}
