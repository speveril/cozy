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
                    `
                });
            }

            setCount(n:number):void {
                this.find('.count').innerText = n.toString();
            }
        }
    }
}
