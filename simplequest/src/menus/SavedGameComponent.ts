module SimpleQuest {
    export module Menu {
        export class SavedGameComponent extends Egg.UiComponent {
            constructor(args:any) {
                super({
                    tag: 'li',
                    className: 'saved-game',
                    html: `
                        <span class="game-name">${args.name}</span>
                        <span class="game-time">${args.time}</span>
                    `
                });
            }
        }
    }
}
