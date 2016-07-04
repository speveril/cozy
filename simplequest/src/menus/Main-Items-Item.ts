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
                this.element.setAttribute('data-menu', item.key)
                this.find('.name').innerText = item.name;
                item.makeIcon(this.find('.item-icon'));
                this.find('.count').innerText = entry.count.toString();
            }
        }
    }
}
