///<reference path="ItemComponent.ts"/>

module SimpleQuest {
    export module Menu {
        var html:string = `
            <ul class="items selections"></ul>
        `;
        export class Main_EquipItemsSubmenu extends RPG.Menu {
            firstFixScroll:boolean = false;
            chooseCB:any;
            filterCB:any;
            items:RPG.Item[];

            constructor() {
                super({ html: html, cancelable: true });
                this.element.classList.add('panel','items-submenu','layout-column');
            }

            setChooseCallback(chooseCB:any) {
                this.chooseCB = chooseCB;
            }

            setFilter(filterCB:any) {
                this.filterCB = filterCB;
                this.rerenderItemList();
            }

            stop() {
                (<Main_EquipSubmenu>this.parent).clearPreview();
            }

            rerenderItemList() {
                var listContainer = this.find('ul.items');
                while(listContainer.firstChild) { listContainer.removeChild(listContainer.lastChild); }

                var resetSelection = this.selectionIndex || 0;
                this.items = [];

                RPG.Party.getInventory(this.filterCB).forEach((it:RPG.InventoryEntry, index) => {
                    this.items[index] = it.item;

                    var el = this.addChild(new ItemComponent({
                        icon: it.item.iconHTML,
                        name: it.item.name,
                        count: it.count
                    }), listContainer);

                    el.element.setAttribute('data-menu', 'choose');
                    el.element.setAttribute('data-item', it.item.key);
                });

                this.selections = [];
                this.setupSelections(listContainer);
                this.selectionIndex = Math.min(this.selections.length, resetSelection);
            }

            setSelection(index:number) {
                super.setSelection(index);

                if (this.selections.length < 1) return;
                if (!this.firstFixScroll) this.fixScroll();

                (<Main_EquipSubmenu>this.parent).updatePreview(this.items[this.selectionIndex]);
            }

            fixScroll() {
                super.fixScroll();

                if (document.contains(this.element)) {
                    this.firstFixScroll = true;
                    var itemsRow = this.find('.items-row');
                    var st = this.selectionContainer.scrollTop;
                    var sh = this.selectionContainer.scrollHeight;
                    var ch = this.selectionContainer.clientHeight;

                    if (ch < sh) {
                        st > 0 ? itemsRow.classList.add('can-scroll-up') : itemsRow.classList.remove('can-scroll-up');
                        st < sh - ch ? itemsRow.classList.add('can-scroll-down') : itemsRow.classList.remove('can-scroll-down');
                    }
                }
            }

            choose(element:HTMLElement) {
                var itemKey = element.getAttribute('data-item');
                this.chooseCB(itemKey);
            }
        }
    }
}
