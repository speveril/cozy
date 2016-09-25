///<reference path="ItemComponent.ts"/>

module SimpleQuest {
    export module Menu {
        export class Main_EquipItemsSubmenu extends RPG.Menu {
            character:RPG.Character;
            firstFixScroll:boolean = false;
            chooseCB:any;
            filterCB:any;
            items:Array<Array<RPG.Item>>;

            constructor(args:any) {
                super({
                    cancelable: true,
                    className: 'items-submenu layout-column',
                    html: `
                        <ul class="items selections"></ul>
                    `
                });
                this.character = args.character;
            }

            selectItem(item:RPG.Item) {
                var index = _.findIndex(this.items, (stack:Array<RPG.Item>) => {
                    return _.indexOf(stack, item) !== -1;
                });
                this.setSelection(index < 0 ? 0 : index);
            }

            setChooseCallback(chooseCB:any) {
                this.chooseCB = chooseCB;
            }

            setFilter(filterCB:any) {
                this.filterCB = filterCB;
                this.rerenderItemList();
            }

            stop() {
                super.stop();
                (<Main_EquipSubmenu>this.parent).clearPreview();
            }

            rerenderItemList() {
                var listContainer = this.find('ul.items');
                while(listContainer.firstChild) { listContainer.removeChild(listContainer.lastChild); }

                var resetSelection = this.selectionIndex || 0;

                this.items = RPG.Party.inventory.stacked(this.filterCB);
                this.items.forEach((stack:Array<RPG.Item>, index:number) => {
                    var el = this.addChild(new ItemComponent({
                        icon: stack[0].iconHTML,
                        name: stack[0].name,
                        count: stack.length
                    }), listContainer);

                    var equippable = _.findIndex(stack, (item) => item.canEquip(this.character, item.equipSlot)) !== -1;

                    el.element.setAttribute('data-menu', equippable ? 'choose' : '@disabled');
                });

                this.selections = [];
                this.setupSelections(listContainer);
                this.selectionIndex = 0; //Math.min(this.selections.length - 1, resetSelection);
            }

            setSelection(index:number) {
                super.setSelection(index);

                if (this.selections.length < 1) return;
                if (!this.firstFixScroll) this.fixScroll();

                (<Main_EquipSubmenu>this.parent).updatePreview(this.items[this.selectionIndex][0]);
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
                var stack = this.items[this.selectionIndex];
                this.chooseCB(_.find(stack, (item) => item.canEquip(this.character, item.equipSlot)));
            }
        }
    }
}
