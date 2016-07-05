module SimpleQuest {
    export module Menu {
        var html:string = `
            <span class="item-icon"></span>
            <span class="name"></span>
            <span class="count"></span>
        `;
        export class Main_ItemListElement extends Egg.UiComponent {
            constructor(entry:RPG.InventoryEntry) {
                super({ html: html, tag: 'li' });
                this.element.classList.add('item');

                var item = entry.item;
                if (item.useEffect) {
                    this.element.setAttribute('data-menu', 'activate')
                    this.element.setAttribute('data-item', item.key)
                } else {
                    this.element.setAttribute('data-menu', '@disabled')
                }
                this.find('.name').innerText = item.name;
                item.makeIcon(this.find('.item-icon'));
                this.find('.count').innerText = entry.count.toString();
            }
        }
    }
}
