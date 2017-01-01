module SimpleQuest {
    export module Menu {
        export class Main_ExitSubmenu extends RPG.Menu {
            constructor() {
                super({
                    className: 'panel exit',
                    cancelable: true,
                    html: `
                        <div class="title">Exit Game</div>
                        <ul class="selections">
                            <li data-menu="mainmenu">Quit to Main Menu</li>
                            <li data-menu="desktop">Quit to Desktop</li>
                            <li data-menu="cancel">Cancel</li>
                        </ul>
                        <div class="note">Any progress since your last save will be lost.</div>
                    `
                });

                this.setupSelections(this.find('ul.selections'));
            }

            mainmenu() {
                RPG.Scene.do(function*() {
                    yield* RPG.Scene.waitFadeTo("black", 1.0);
                    RPG.Menu.pop();
                    this.remove();
                    SimpleQuest.bootSequence();
                    yield 1;
                }.bind(this))
            }

            desktop() {
                SimpleQuest.Menu.quitGame();
            }

            cancel() {
                RPG.Menu.pop();
                this.remove();
            }
        }
    }
}
