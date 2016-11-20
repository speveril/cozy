///<reference path="SavedGameComponent.ts"/>

module SimpleQuest {
    export module Menu {
        export class Boot_Load extends RPG.Menu {
            choice:RPG.SavedGame;

            constructor() {
                super({
                    cancelable: true,
                    className: 'boot-load-menu box',
                    tag: 'div',
                    html: `
                        <div class="title">Load Game</div>
                        <ul class="selections scrollable"></ul>
                    `
                });

                this.choice = null;

                var savedGames = RPG.SavedGame.getList();

                _.each(savedGames, (game:RPG.SavedGame) => {
                    this.addChild(new SavedGameComponent({
                        id: game.file.path,
                        img: game.data.image,
                        name: game.data.name,
                        time: game.file.stat().mtime.toLocaleString('en-GB')
                    }), 'ul.selections');
                });

                this.setupSelections(this.find('ul.selections'));
            }

            stop() {
                super.stop();
                this.remove();
            }

            choose() {
                this.choice = RPG.SavedGame.getList()[this.selectionIndex];
                RPG.Menu.pop();
            }
        }
    }
}
