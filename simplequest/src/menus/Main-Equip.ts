///<reference path="Main-Equip-Slot.ts"/>
///<reference path="Main-Equip-Items.ts"/>

module SimpleQuest {
    export module Menu {
        var html:string = `
            <section class="layout-row title-row">Equip</section>
            <section class="layout-row equip-info-row">
                <section class="layout-column stats-column">
                    <section class="layout-row" data-stat="attack">
                        <span class="label">ATK</span>
                        <span class="value">0</span>
                    </section>
                    <section class="layout-row" data-stat="defense">
                        <span class="label">DEF</span>
                        <span class="value">0</span>
                    </section>
                    <section class="layout-row" data-stat="critical">
                        <span class="label">CRT</span>
                        <span class="value">0</span>
                    </section>
                    <section class="layout-row" data-stat="evade">
                        <span class="label">EVD</span>
                        <span class="value">0</span>
                    </section>
                </section>
                <section class="layout-column slots-column">
                    <ul class="slots selections">
                    </ul>
                </section>
            </section>
            <section class="layout-row items-row"></section>
            <section class="layout-row description-row"></section>
        `;
        export class Main_EquipSubmenu extends RPG.Menu {
            character:RPG.Character;
            itemMenu:Main_EquipItemsSubmenu;
            slotChildren:any;

            constructor() {
                super({ html: html, cancelable: true });
                this.element.classList.add('panel','equip-submenu','layout-column');

                // TODO character select
                this.character = RPG.characters['hero'];

                this.slotChildren = {};
                var listContainer = this.find('.slots');
                _.each(RPG.equipSlots, (slot:string) => {
                    this.slotChildren[slot] = this.addChild(new Main_EquipSlot(this.character, slot), listContainer);
                });

                this.itemMenu = new Main_EquipItemsSubmenu();
                this.addChild(this.itemMenu, '.items-row');

                this.updateEquipInfo();
                this.setupSelections(this.find('.slots'));
            }

            updateEquipInfo() {
                _.each(RPG.equipSlots, (slot:string) => {
                    this.slotChildren[slot].rerender();
                });
                this.findAll('.stats-column .layout-row').forEach((row) => {
                    var stat = row.getAttribute('data-stat');
                    (<HTMLElement>row.querySelector('.value')).innerText = this.character.get(stat);
                });
            }

            setSelection(index:number) {
                super.setSelection(index);

                if (this.selections.length < 1) return;
                var listItem = this.selections[this.selectionIndex];
                var selectedSlot = listItem.getAttribute('data-value');
                if (this.character.equipped[selectedSlot]) {
                    this.find('.description-row').innerHTML = this.character.equipped[selectedSlot].description;
                } else {
                    this.find('.description-row').innerHTML = '';
                }
                this.itemMenu.setFilter((item) => { return item.equipSlot === selectedSlot });
            }

            slot(which:any) {
                var slot = which.getAttribute('data-value');
                if (this.find('ul.items').children.length > 0) {
                    this.itemMenu.setChooseCallback((itemKey) => {
                        console.log("equipping", this.character, "with", itemKey, "in", slot);
                        this.character.equipItem(itemKey, slot);
                        this.updateEquipInfo();
                        RPG.Menu.pop();
                    });

                    RPG.Menu.push(this.itemMenu, this, '.items-row');
                } else {
                    SimpleQuest.sfx['menu_bad'].play();
                    return false;
                }
            }
        }
    }
}
