///<reference path="Main-Status.ts"/>
///<reference path="Main-Save.ts"/>
///<reference path="Main-Items.ts"/>
///<reference path="Main-Equip.ts"/>

module SimpleQuest {
    export module Menu {
        export class Main extends RPG.Menu {
            statusPanel:Main_StatusPanel = null;
            submenus:{ [key:string]:any };

            constructor() {
                super({
                    className: 'menu main-menu',
                    cancelable: true,
                    html: `
                        <div class="main-area">
                        </div>

                        <div class="right-column">
                            <ul class="selections">
                                <li data-menu="resume">Resume</li>
                                <li data-menu="items">Items</li>
                                <li data-menu="equip">Equip</li>
                                <li data-menu="save">Save</li>
                                <li data-menu="exit">Exit</li>
                            </ul>

                            <div class="overview">
                                <div class="money-container"><span class="money"></span></div>
                            </div>
                        </div>
                    `
                });

                var moneyField = this.find('span.money');
                moneyField.innerHTML = RPG.Party.money.toString() + RPG.moneyName;

                this.submenus = {
                    items: Main_ItemsSubmenu,
                    equip: Main_EquipSubmenu,
                    save: Main_SaveSubmenu
                };

                this.statusPanel = new Main_StatusPanel();
                this.addChild(this.statusPanel, '.main-area');
                this.setupSelections(this.find('.selections'));
            }

            pause() {
                super.pause();
                this.statusPanel.remove();
            }

            unpause() {
                super.unpause();
                this.addChild(this.statusPanel, '.main-area');
                this.statusPanel.updateFields();
            }

            stop() {
                super.stop();
                this.remove();
            }

            showSubmenu(key) {
                if (this.submenus[key]) {
                    RPG.Menu.push(new this.submenus[key]());
                    this.addChild(RPG.Menu.currentMenu, '.main-area');
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
