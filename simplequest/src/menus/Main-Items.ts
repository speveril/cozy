///<reference path="Main-Items-Item.ts"/>

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
            listContainer:HTMLElement;

            constructor() {
                super({ html: html, cancelable: true });
                this.element.classList.add('panel','items-submenu','layout-column');

                this.listContainer = this.find('ul.items');

                this.rerenderItemList();
            }

            rerenderItemList() {
                RPG.Party.getInventory().forEach((it:RPG.InventoryEntry) => {
                    this.addChild(new Main_ItemListElement(it), this.listContainer);
                });

                this.setupSelections(this.listContainer);
            }

            update() {
                if (this.selections.length < 1) return;
                var entry = RPG.Party.inventory[this.selectionIndex];
                this.find('.description-row').innerHTML = entry.item.description;
            }
        }
    }
}
