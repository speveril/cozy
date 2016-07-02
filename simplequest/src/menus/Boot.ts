module SimpleQuest {
    export module Menu {
        var html:string = `
            <link rel="stylesheet" type="text/css" href="ui/boot-menu.css">

            <h1>Simple Quest</h1>
            <ul class="selections">
            <li data-menu="newGame">New Game</li>
            <li data-menu="loadGame">Load Game</li>
            <li data-menu="exit">Exit</li>
            </ul>
        `;

        export class Boot extends RPG.Menu {

            constructor() {
                super({ html: html });
                this.element.classList.add("menu","boot-menu");
            }

            newGame() {
                RPG.Scene.start()
                    .then(function() {
                        sfx['start'].play();
                        return RPG.Scene.waitForFadeOut(1.0, "#000000");
                    })
                    .then(function() {
                        RPG.Scene.finish();
                        SimpleQuest.newGame();
                        RPG.Menu.pop();
                    });
            }

            loadGame() { console.log("not yet"); }

            exit() { SimpleQuest.Menu.quitGame(); }
        }
    }
}
