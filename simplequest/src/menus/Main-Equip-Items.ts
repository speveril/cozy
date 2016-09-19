///<reference path="ItemComponent.ts"/>

module SimpleQuest {
    export module Menu {
        export class Main_EquipItemsSubmenu extends RPG.Menu {
            firstFixScroll:boolean = false;
            chooseCB:any;
            filterCB:any;
            items:Array<RPG.InventoryEntry>;

            constructor() {
                super({
                    cancelable: true,
                    className: 'items-submenu layout-column',
                    html: `
                        <ul class="items selections"></ul>
                    `
                });
            }

            selectItem(inv:RPG.InventoryEntry) {
                if (inv) {
                    var index = _.indexOf(this.items, inv);
                    if (index > -1) {
                        this.setSelection(index);
                        return;
                    }
                }

                this.setSelection(0);
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
                    this.items[index] = it;

                    var el = this.addChild(new ItemComponent({
                        icon: it.item.iconHTML,
                        name: it.item.name,
                        count: it.count
                    }), listContainer);

                    el.element.setAttribute('data-menu', 'choose');
                    el.element.setAttribute('data-index', index);
                });

                this.selections = [];
                this.setupSelections(listContainer);
                this.selectionIndex = 0; //Math.min(this.selections.length - 1, resetSelection);
            }

            setSelection(index:number) {
                super.setSelection(index);

                if (this.selections.length < 1) return;
                if (!this.firstFixScroll) this.fixScroll();

                (<Main_EquipSubmenu>this.parent).updatePreview(this.items[this.selectionIndex].item);
            }

            fixScroll() {
                super.fixScroll();

                if (document.contains(this.element)) {
                    this.firstFixScroll = true;
                    var itemsRow = this.find('.items');
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
                this.chooseCB(this.items[element.getAttribute('data-index')]);
            }
        }
    }
}
