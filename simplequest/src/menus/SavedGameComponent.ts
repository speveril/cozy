module SimpleQuest {
    export module Menu {
        export class SavedGameComponent extends Egg.UiComponent {
            constructor(args:any) {
                super({
                    tag: 'li',
                    className: 'saved-game',
                    html: `
                        <div class="image">
                            <img src="${args.img || ''}">
                        </div>
                        <div class="info">
                            <div class="game-name">${args.name}</div>
                            <div class="game-time">${args.time}</div>
                            <div class="confirmation">Save over this slot?</div>
                        </div>
                    `
                });
                this.element.setAttribute('data-id', args.id);
                this.element.setAttribute('data-menu', 'choose');
            }
        }
    }
}
