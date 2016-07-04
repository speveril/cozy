///<reference path="Main-Items-Item.ts"/>

module SimpleQuest {
    export module Menu {
        var html:string = `
            <section>Inventory</section>
            <section class="layout-row layout-flow">
                <ul class="items">
                </ul>
            </section>
        `;
        export class Main_ItemsSubmenu extends RPG.Menu {
            listContainer:HTMLElement;

            constructor() {
                super({ html: html, cancelable: true });
                this.element.classList.add('items-submenu');

                this.listContainer = this.find('ul.items');

                this.rerenderItemList();
            }

            rerenderItemList() {
                RPG.Party.getInventory().forEach((it:RPG.InventoryEntry) => {
                    this.addChild(new Main_ItemListElement(it), this.listContainer);
                });

                this.setupSelections(this.listContainer);
            }
        }
    }
}
