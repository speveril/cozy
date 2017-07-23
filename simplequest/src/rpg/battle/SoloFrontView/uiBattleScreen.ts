module RPG.BattleSystem.SoloFrontView {
    export class uiBattleScreen extends Cozy.UiComponent {
        private actionMenu:uiActionMenu;
        private player:Character;
        private monster:Character;
        private prevAttributes:any;

        constructor(player, monster, opts) {
            super({
                className: 'battle-screen hide',
                html: `
                    <div class="box left-sidebar">
                        <div><span class="name">${player.name}</span></div>
                        <div class="hp-row"><span>HP</span><span class="hp"></span></div>
                        <div><meter class="hp"></meter></div>
                    </div>

                    <div class="box right-sidebar"></div>
                `
            });

            this.player = player;
            this.monster = monster;
            this.actionMenu = new uiActionMenu(player, monster, opts);
            this.addChild(this.actionMenu, '.right-sidebar');
            this.prevAttributes = {};
        }

        update(dt:number):void {
            super.update(dt);

            if (this.player['hp'] !== this.prevAttributes['hp']) {
                this.prevAttributes['hp'] = this.player['hp'];

                this.find('.left-sidebar meter.hp').setAttribute('value', (this.player['hp'] / this.player['maxhp']).toString());
                this.find('.left-sidebar span.hp').innerHTML = this.player['hp'].toString();
            }

        }

        go():void {
            this.element.classList.remove('hide');
        }

        shake():void {
            this.element.classList.remove('shake');
            this.element.clientWidth; // force recalc
            this.element.classList.add('shake');
        }

        get menu():uiActionMenu { return this.actionMenu; }
    }

    class uiActionMenu extends RPG.Menu {
        private player:Character;
        private monster:Character;
        private _result:any;

        constructor(player, monster, opts) {
            super({
                className: 'menu action-menu selections',
                tagName: 'ul',
                html: `
                    <li data-menu="fight">Fight</li>
                    <li data-menu="item">Item</li>
                    <li data-menu="flee" class="flee">Flee</li>
                `
            });

            if (opts.noFlee) {
                this.find('.flee').setAttribute('data-menu', '@disabled');
            }

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
                    <div class="title">Choose an item...</div>
                    <ul class="selections scrollable"></ul>
                    <div class="description"></div>
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

        setSelection(index:number) {
            super.setSelection(index);

            if (this.selections.length < 1) return false;
            this.find('.description').innerHTML = this.itemList[this.selectionIndex][0].description;
            return true;
        }
    }

    export class uiItemRow extends Cozy.UiComponent {
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
