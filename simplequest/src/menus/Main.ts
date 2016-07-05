///<reference path="Main-Status.ts"/>
///<reference path="Main-Items.ts"/>

module SimpleQuest {
    export module Menu {
        var html:string = `
            <link rel="stylesheet" type="text/css" href="ui/main-menu.css">

            <div class="main-area">
            </div>

            <div class="right-column">
                <ul class="selections">
                    <li data-menu="resume">Resume</li>
                    <li data-menu="items">Items</li>
                    <li data-menu="@disabled">Equip</li>
                    <li data-menu="@disabled">Save</li>
                    <li data-menu="exit">Exit</li>
                </ul>

                <div class="overview">
                    <div class="money-container"><span class="money"></span></div>
                </div>
            </div>
        `;

        export class Main extends RPG.Menu {
            statusPanel:Egg.UiComponent = null;
            submenus:{ [key:string]:any };

            constructor() {
                super({ html: html, cancelable: true });
                this.element.classList.add("menu","main-menu");

                var moneyField = <HTMLElement>(this.element.querySelector('span.money'));
                if (moneyField) {
                    moneyField.innerHTML = RPG.Party.money.toString() + RPG.moneyName;
                }

                this.submenus = {
                    items: Main_ItemsSubmenu
                };

                this.statusPanel = new Main_StatusPanel();
                this.addChild(this.statusPanel, '.main-area');
            }

            pause() {
                super.pause();
                this.statusPanel.remove();
            }

            unpause() {
                super.unpause();
                this.addChild(this.statusPanel, '.main-area');
            }

            showSubmenu(key) {
                if (this.submenus[key]) {
                    RPG.Menu.push(new this.submenus[key](), this, '.main-area');
                } else {
                    console.warn("! Tried to show bad submenu", key);
                }
            }

            resume() { RPG.Menu.pop(); }
            items() { this.showSubmenu('items'); }
            equip() { this.showSubmenu('equip'); }
            save() { this.showSubmenu('save'); }
            exit() { SimpleQuest.Menu.quitGame(); } // TODO confirmation
        }
    }
}
