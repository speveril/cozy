///<reference path="SavedGameComponent.ts"/>

module SimpleQuest {
    export module Menu {
        export class Main_SaveSubmenu extends RPG.Menu {
            constructor() {
                super({
                    cancelable: true,
                    className: 'panel save',
                    tag: 'div',
                    html: `
                        <div class="title">Save Game</div>
                        <ul class="selections scrollable"></ul>
                    `
                });

                var savedGames = RPG.SavedGame.getList();

                this.addChild(new SavedGameComponent({
                    id: '@new',
                    img: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // transparent 1 pixel gif
                    name: 'New Saved Game',
                    time: '-'
                }))

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

            choose(e) {
                var confirmation = this.find('.confirm');
                if (confirmation) {
                    RPG.SavedGame.fromState()
                        .then((saveGame) => {
                            var filename = e.getAttribute('data-id');
                            if (filename !== '@new') saveGame.file = new Egg.File(filename);
                            saveGame.writeToDisk();
                            // TODO tell the player it worked
                            RPG.Menu.pop();
                        });
                } else {
                    e.classList.add('confirm');
                }
            }

            cancel() {
                var confirmation = this.find('.confirm');
                if (!confirmation) return super.cancel();
                confirmation.classList.remove('confirm');
            }

            setSelection(index) {
                var confirmation = this.find('.confirm');
                if (!confirmation) return super.setSelection(index);
                return false;
            }
        }
    }
}
