///<reference path="Main-Equip-Slot.ts"/>

module SimpleQuest {
    export module Menu {
        var html:string = `
            <section class="layout-row title-row">Equip</section>
            <section class="layout-row slots-row">
                <ul class="slots selections">
                </ul>
            </section>
            <section class="layout-row items-row">
                <ul class="items">
                </ul>
            </section>
            <section class="layout-row description-row"></section>
        `;
        export class Main_EquipSubmenu extends RPG.Menu {
            character:RPG.Character;

            constructor() {
                super({ html: html, cancelable: true });
                this.element.classList.add('panel','equip-submenu','layout-column');

                // TODO character select
                this.character = RPG.characters['hero'];

                var listContainer = this.find('.slots');
                _.each(RPG.equipSlots, (slot:string) => {
                    this.addChild(new Main_EquipSlot(this.character, slot), listContainer);
                });
                this.setupSelections(this.find('.slots'));
            }

            rerenderItemList() {
                if (this.selections.length < 1) return;

                var listItem = this.selections[this.selectionIndex];
                var selectedSlot = listItem.getAttribute('data-value');
                console.log(this.selectionIndex, listItem, selectedSlot);

                var listContainer = this.find('ul.items');
                while(listContainer.firstChild) { listContainer.removeChild(listContainer.lastChild); }
                RPG.Party.getInventory((item) => { return item.equipSlot === selectedSlot }).forEach((it:RPG.InventoryEntry) => {
                    this.addChild(new Main_ItemListElement(it), listContainer);
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
                this.rerenderItemList();
            }

            // fixScroll() {
            //     super.fixScroll();
            //
            //     if (document.contains(this.element)) {
            //         this.firstFixScroll = true;
            //         var itemsRow = this.find('.items-row');
            //         var st = this.selectionContainer.scrollTop;
            //         var sh = this.selectionContainer.scrollHeight;
            //         var ch = this.selectionContainer.clientHeight;
            //
            //         if (ch < sh) {
            //             st > 0 ? itemsRow.classList.add('can-scroll-up') : itemsRow.classList.remove('can-scroll-up');
            //             st < sh - ch ? itemsRow.classList.add('can-scroll-down') : itemsRow.classList.remove('can-scroll-down');
            //         }
            //     }
            // }
            //
            // activate(element:HTMLElement) {
            //     var itemKey = element.getAttribute('data-item');
            //     var item = RPG.Item.lookup(itemKey);
            //
            //     // TODO target selection
            //     item.activate(RPG.Party.members[0].character);
            //     this.rerenderItemList();
            // }
        }
    }
}
