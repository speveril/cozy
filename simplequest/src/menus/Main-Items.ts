///<reference path="ItemComponent.ts"/>

module SimpleQuest {
    export module Menu {
        export class Main_ItemsSubmenu extends RPG.Menu {
            // firstFixScroll:boolean = false;
            itemList:Array<Array<RPG.Item>>;

            constructor() {
                super({
                    cancelable: true,
                    className: 'panel items-submenu layout-column',
                    html: `
                        <section class="layout-row title-row">Items</section>
                        <section class="layout-row items-row">
                            <ul class="items selections">
                            </ul>
                        </section>
                        <section class="layout-row description-row"></section>
                    `
                });
                this.rerenderItemList();
            }

            rerenderItemList() {
                var resetSelection = this.selectionIndex || 0;
                var listContainer = this.find('ul.items');

                this.itemList = RPG.Party.inventory.stacked();

                while(listContainer.firstChild) { listContainer.removeChild(listContainer.lastChild); }
                this.itemList.forEach((row:Array<RPG.Item>) => {
                    var el = this.addChild(new ItemComponent({
                        icon: row[0].iconHTML,
                        name: row[0].name,
                        count: row.length
                    }), listContainer);

                    if (row[0].canUse(RPG.Party.members[0].character, RPG.Party.members[0].character)) {
                        el.element.setAttribute('data-menu', 'choose');
                        el.element.setAttribute('data-item', row[0].key);
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
                this.find('.description-row').innerHTML = this.itemList[this.selectionIndex][0].description;
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
                // TODO target selection
                this.itemList[this.selectionIndex][0].activate(RPG.Party.members[0].character);
                this.rerenderItemList();
            }
        }
    }
}
