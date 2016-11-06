module RPG.BattleSystem.SoloFrontView {
    export class uiBattleScreen extends Egg.UiComponent {
        private actionMenu:uiActionMenu;
        private player:Character;
        private monster:Character;

        constructor(player, monster) {
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

            this.player = player;
            this.monster = monster;
            this.actionMenu = new uiActionMenu(player, monster);
            this.addChild(this.actionMenu, '.right-sidebar');
        }

        update(dt:number):void {
            super.update(dt);

            var fields = ['name', 'hp', 'maxhp'];
            for (var i = 0; i < fields.length; i++) {
                this.find('.left-sidebar .' + fields[i]).innerHTML = this.player[fields[i]];
            }
        }

        get menu():uiActionMenu { return this.actionMenu; }
    }

    class uiActionMenu extends RPG.Menu {
        private player:Character;
        private monster:Character;
        private _result:any;

        constructor(player, monster) {
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

            this._result = {};
            this.player = player;
            this.monster = monster;
        }

        get result():any {
            return this._result;
        }

        fight() {
            this._result.action = this.selections[this.selectionIndex].getAttribute('data-menu');
            RPG.Menu.pop();
        }

        skill() {
            RPG.Textbox.box.appendText("\nYou can't use skills yet!");
        }

        item() {
            var itemMenu = new uiItemMenu(this.player, this.monster, (item:RPG.Item) => {
                this._result.action = this.selections[this.selectionIndex].getAttribute('data-menu');
                this._result.item = item;
                RPG.Menu.pop();
            });
            this.addChild(itemMenu);
            RPG.Menu.push(itemMenu);
        }

        flee() {
            this._result.action = this.selections[this.selectionIndex].getAttribute('data-menu');
            RPG.Menu.pop();
        }
    }

    class uiItemMenu extends RPG.Menu {
        private itemList:Array<Array<Item>>;
        private completion:any;

        constructor(player, monster, callback) {
            super({
                className: 'menu item-menu box',
                tagName: 'div',
                cancelable: true,
                html: `
                    <ul class="selections"></ul>
                `
            });

            this.completion = callback;

            var listContainer = this.find('.selections');

            this.itemList = RPG.Party.inventory.stacked();
            this.itemList.forEach((row:Array<RPG.Item>) => {
                if (row[0].canUse(player, [player, monster])) {
                    var el = this.addChild(new uiItemRow({
                        icon: row[0].iconHTML,
                        name: row[0].name,
                        count: row.length
                    }), listContainer);
                    el.element.setAttribute('data-menu', 'choose');
                    el.element.setAttribute('data-item', row[0].key);
                }
            });

            this.setupSelections(listContainer);
        }

        choose() {
            RPG.Menu.pop();
            this.completion(this.itemList[this.selectionIndex][0]);
        }

        stop() {
            super.stop();
            this.remove();
        }
    }

    export class uiItemRow extends Egg.UiComponent {
        constructor(args:any) {
            super({
                tag: 'li',
                className: 'item-row',
                html: `
                    <span class="item-icon">${args.icon}</span>
                    <span class="name">${args.name}</span>
                    <span class="count">${args.count}</span>
                `
            });
        }
    }
}
