///<reference path="ItemComponent.ts"/>

module SimpleQuest {
    export module Menu {
        export class Shop extends RPG.Menu {
            priceMultiplier:number;

            constructor(args) {
                super({
                    className: 'menu shop-menu',
                    cancelable: true,
                    html: `
                        <link rel="stylesheet" type="text/css" href="ui/menu-shop.css">

                        <div class="main-area">
                            <div class="shop-name">${args.shopName}</div>
                            <ul class="items selections"></ul>
                            <div class="description"></div>
                        </div>
                    `
                });

                console.log("SHOP>", args);

                var listContainer = this.find('.selections');

                var resumeElement = document.createElement('li');
                resumeElement.setAttribute('data-menu', 'resume');
                resumeElement.innerHTML = 'Leave'
                listContainer.appendChild(resumeElement);

                this.priceMultiplier = args.priceMultiplier || 1;

                var products = _.map(args.products, (i:string) => RPG.Item.lookup(i));
                products = _.sortBy(products, (p:RPG.Item) => p.sort);

                products.forEach((item:RPG.Item) => {
                    var price = Math.ceil(item.price * this.priceMultiplier);
                    var el = this.addChild(new ItemComponent({
                        icon: item.iconHTML,
                        name: item.name,
                        count: price
                    }), listContainer);

                    el.element.setAttribute('data-item', item.key);
                    el.element.setAttribute('data-price', price.toString());
                    el.element.setAttribute('data-menu', price <= RPG.Party.money ? 'choose' : '@disabled');
                });

                this.setupSelections(listContainer);
            }

            updateEnabled() {
                _.each(this.findAll('li.item'), (el:HTMLElement) => {
                    var item = RPG.Item.lookup(el.getAttribute('data-item'));
                    el.setAttribute(
                        'data-menu',
                        item.price * this.priceMultiplier <= RPG.Party.money ? 'choose' : '@disabled'
                    );
                });
            }

            choose(el) {
                var itemKey = el.getAttribute('data-item');
                var price = parseInt(el.getAttribute('data-price'), 10);

                if (price <= RPG.Party.money) {
                    RPG.Party.money -= price;
                    RPG.Party.addItem(itemKey);
                }
                
                this.updateEnabled();
            }

            resume() { RPG.Menu.pop(); }
        }
    }
}
