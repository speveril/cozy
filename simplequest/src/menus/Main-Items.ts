///<reference path="ItemComponent.ts"/>

module SimpleQuest {
    export module Menu {
        var html:string = `
            <section class="layout-row title-row">Items</section>
            <section class="layout-row items-row">
                <ul class="items selections">
                </ul>
            </section>
            <section class="layout-row description-row"></section>
        `;
        export class Main_ItemsSubmenu extends RPG.Menu {
            firstFixScroll:boolean = false;

            constructor() {
                super({ html: html, cancelable: true });
                this.element.classList.add('panel','items-submenu','layout-column');
                this.rerenderItemList();
            }

            rerenderItemList() {
                var resetSelection = this.selectionIndex || 0;
                var listContainer = this.find('ul.items');

                while(listContainer.firstChild) { listContainer.removeChild(listContainer.lastChild); }
                RPG.Party.getInventory().forEach((it:RPG.InventoryEntry) => {
                    var el = this.addChild(new ItemComponent({
                        icon: it.item.iconHTML,
                        name: it.item.name,
                        count: it.count
                    }), listContainer);

                    if (it.item.canUse(RPG.Party.members[0].character, RPG.Party.members[0].character)) {
                        el.element.setAttribute('data-menu', 'choose');
                        el.element.setAttribute('data-item', it.item.key);
                    } else {
                        el.element.setAttribute('data-menu', '@disabled');
                    }
                });

                this.selections = [];
                this.setupSelections(listContainer);
                this.setSelection(Math.min(this.selections.length, resetSelection));
            }

            setSelection(index:number) {
                super.setSelection(index);

                if (this.selections.length < 1) return;
                // if (!this.firstFixScroll) this.fixScroll();
                var entry = RPG.Party.inventory[this.selectionIndex];
                this.find('.description-row').innerHTML = entry.item.description;
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

            choose(element:HTMLElement) {
                var itemKey = element.getAttribute('data-item');
                var item = RPG.Item.lookup(itemKey);

                // TODO target selection
                item.activate(RPG.Party.members[0].character);
                this.rerenderItemList();
            }
        }
    }
}
