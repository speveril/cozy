module SimpleQuest {
    export module Menu {
        var html:string = `
            <link rel="stylesheet" type="text/css" href="ui/boot-menu.css">

            <h1>Simple Quest</h1>
            <ul class="selections">
                <li data-menu="newGame">New Game</li>
                <li data-menu="@disabled">Load Game</li>
                <li data-menu="exit">Exit</li>
            </ul>
        `;

        export class Boot extends RPG.Menu {

            constructor() {
                super({ html: html });
                this.element.classList.add("menu","boot-menu");
            }

            newGame() {
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
