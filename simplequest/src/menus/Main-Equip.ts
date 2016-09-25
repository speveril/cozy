///<reference path="Main-Equip-Slot.ts"/>
///<reference path="Main-Equip-Items.ts"/>

module SimpleQuest {
    export module Menu {
        export class Main_EquipSubmenu extends RPG.Menu {
            character:RPG.Character;
            itemMenu:Main_EquipItemsSubmenu;
            slotChildren:any;
            selectedSlot:string;

            constructor() {
                super({
                    cancelable: true,
                    className: 'panel equip-submenu layout-column',
                    html: `
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
                    `
                });

                // TODO character select
                this.character = RPG.Party.members[0].character;

                this.slotChildren = {};
                var listContainer = this.find('.slots');
                _.each(RPG.equipSlots, (slot:string) => {
                    this.slotChildren[slot] = this.addChild(new Main_EquipSlot(this.character, slot), listContainer);
                });

                this.itemMenu = new Main_EquipItemsSubmenu({
                    character: this.character
                });

                this.updateEquipInfo();
                this.setupSelections(this.find('.slots'));
            }

            updateEquipInfo() {
                _.each(RPG.equipSlots, (slot:string) => {
                    this.slotChildren[slot].rerender();
                });
                this.findAll('.stats-column .layout-row').forEach((row) => {
                    var stat = row.getAttribute('data-stat');
                    (<HTMLElement>row.querySelector('.value')).classList.remove('better', 'worse');
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
                this.itemMenu.setFilter((item) => item.equipSlot === selectedSlot);
            }

            clearPreview() {
                this.updateEquipInfo();
            }

            updatePreview(it:RPG.Item) {
                if (it) {
                    this.find('.description-row').innerHTML = it.description;
                }

                var tryDict:{[slot:string]:RPG.Item} = {};
                tryDict[this.selectedSlot] = it;
                var other = this.character.tryOn(tryDict);

                this.findAll('.stats-column .layout-row').forEach((row) => {
                    var stat = row.getAttribute('data-stat');
                    var current = this.character.get(stat);

                    (<HTMLElement>row.querySelector('.value')).classList.remove('better', 'worse');
                    (<HTMLElement>row.querySelector('.value')).innerText = other[stat];
                    if (other[stat] > current) (<HTMLElement>row.querySelector('.value')).classList.add('better');
                    if (other[stat] < current) (<HTMLElement>row.querySelector('.value')).classList.add('worse');
                });
            }

            slot(which:any) {
                if (this.itemMenu.items.length > 0) {
                    this.selectedSlot = which.getAttribute('data-value');
                    this.itemMenu.setChooseCallback((item:RPG.Item) => {
                        this.character.equipItem(item, this.selectedSlot);
                        this.updateEquipInfo();
                        this.selectedSlot = null;
                        RPG.Menu.pop();
                    });

                    RPG.Menu.push(this.itemMenu, this, '.items-row');

                    this.itemMenu.selectItem(this.character.equipped[this.selectedSlot]);
                } else {
                    SimpleQuest.sfx['menu_bad'].play();
                    return false;
                }
            }
        }
    }
}
