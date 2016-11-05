module SimpleQuest {
    export module Menu {
        export class ItemComponent extends Egg.UiComponent {
            constructor(args:any) {
                super({
                    tag: 'li',
                    className: 'item',
                    html: `
                        <span class="item-icon">${args.icon}</span>
                        <span class="name">${args.name}</span>
                        <span class="count">${args.count}</span>
                        <span class="price">${args.price}${RPG.moneyName}</span>
                    `
                });

                if (!args.count) this.find('.count').remove();
                if (!args.price) this.find('.price').remove();
            }

            setPrice(n:number):void {
                this.find('.price').innerText = n.toString() + RPG.moneyName;
            }

            setCount(n:number):void {
                this.find('.count').innerText = n.toString();
            }
        }
    }
}
