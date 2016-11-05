module RPG.BattleSystem.SoloFrontView {
    export class uiBattleScreen extends Egg.UiComponent {
        private actionMenu:uiActionMenu;

        constructor() {
            super({
                className: 'battle-screen',
                html: `
                    <div class="box left-sidebar">
                        <div><span class="name"></span></div>
                        <div>HP <span class="hp"></span></div>
                        <div class="right-align">/<span class="maxhp"></span></div>
                    </div>

                    <div class="box right-sidebar"></div>
                `
            });

            this.actionMenu = new uiActionMenu();
            this.addChild(this.actionMenu, '.right-sidebar');
        }

        updateFields(player:RPG.Character):void {
            var fields = ['name', 'hp', 'maxhp'];
            for (var i = 0; i < fields.length; i++) {
                this.find('.left-sidebar .' + fields[i]).innerHTML = player[fields[i]];
            }
        }

        get menu():uiActionMenu { return this.actionMenu; }
    }

    class uiActionMenu extends RPG.Menu {
        constructor() {
            super({
                className: 'menu action-menu selections',
                tagName: 'ul',
                html: `
                    <li data-menu="fight">Fight</li>
                    <li data-menu="skill">Skill</li>
                    <li data-menu="item">Item</li>
                    <li data-menu="flee">Flee</li>
                `
            });
        }

        get result():string {
            return this.selections[this.selectionIndex].getAttribute('data-menu');
        }

        fight() {
            RPG.Menu.pop();
        }

        skill() {
            RPG.Textbox.box.appendText("\nYou can't use skills yet!");
        }

        item() {
            RPG.Textbox.box.appendText("\nYou can't use items yet!");
        }

        flee() {
            RPG.Menu.pop();
        }
    }
}
