///<reference path="ItemComponent.ts"/>

module SimpleQuest {
    export module Menu {
        export class ShopMenu extends RPG.Menu {
            priceMultiplier:number;
            products:RPG.Item[];

            constructor(args) {
                super({
                    className: 'menu shop-menu',
                    cancelable: true,
                    direction: RPG.MenuDirection.HORIZONTAL,
                    html: `
                        <div class="main-area">
                            <div class="shop-name">${args.shopName}</div>
                            <ul class="info selections">
                                <li data-menu="buy">Buy</li>
                                <li class="sell" data-menu="sell">Sell</li>
                                <li data-menu="resume">Leave</li>
                                <li class="money">${RPG.Party.money}${RPG.moneyName}</li>
                            </ul>
                            <div class="items-container"></div>
                            <div class="description"></div>
                        </div>
                    `
                });

                this.priceMultiplier = args.priceMultiplier || 1;
                this.products = _.sortBy(_.map(args.products, (i:string) => RPG.Item.lookup(i)), (p:RPG.Item) => p.sort);

                this.setupSelections(this.find('.info.selections'));
            }

            unpause() {
                super.unpause();
                this.updateDescription('');
                if (RPG.Party.inventory.length < 1) {
                    this.find('.selections .sell').setAttribute('data-menu', '@disabled');
                } else {
                    this.find('.selections .sell').setAttribute('data-menu', 'sell');
                }
            }

            buy() {
                RPG.Menu.push(new BuyMenu({
                    parent: this,
                    products: this.products,
                    priceMultiplier: this.priceMultiplier
                }), this, this.find('.items-container'));
            }

            sell() {
                RPG.Menu.push(new SellMenu({
                    parent: this,
                }), this, this.find('.items-container'));
            }

            updateMoney() {
                this.find('.money').innerHTML = `${RPG.Party.money}${RPG.moneyName}`;
            }

            updateDescription(desc) {
                this.find('.description').innerHTML = desc;
            }

            resume() { RPG.Menu.pop(); }
        }

        class BuyMenu extends RPG.Menu {
            parent:ShopMenu;
            priceMultiplier:number;
            products:RPG.Item[];

            constructor(args) {
                super({
                    className: 'menu buy-menu items selections',
                    cancelable: true
                });

                this.products = args.products;
                this.priceMultiplier = args.priceMultiplier;

                this.products.forEach((item:RPG.Item) => {
                    var price = Math.ceil(item.price * this.priceMultiplier);
                    var el = this.addChild(new ItemComponent({
                        icon: item.iconHTML,
                        name: item.name,
                        price: price
                    }));

                    el.element.setAttribute('data-item', item.key);
                    el.element.setAttribute('data-price', price.toString());
                    el.element.setAttribute('data-menu', price <= RPG.Party.money ? 'choose' : '@disabled');
                });

                this.setupSelections(this.element);
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

            setSelection(index:number) {
                super.setSelection(index);

                if (this.selections.length < 1) return;
                this.parent.updateDescription(this.products[this.selectionIndex].description);
            }

            choose(el) {
                var itemKey = el.getAttribute('data-item');
                var price = parseInt(el.getAttribute('data-price'), 10);

                if (price <= RPG.Party.money) {
                    RPG.Party.money -= price;
                    RPG.Party.addItem(itemKey);
                }

                this.updateEnabled();
                this.parent.updateMoney();
            }
        }

        class SellMenu extends RPG.Menu {
            parent:ShopMenu;
            itemComponents:ItemComponent[] = [];

            constructor(args) {
                super({
                    className: 'menu sell-menu items selections',
                    cancelable: true
                });

                RPG.Party.getInventory((i) => i.sellable).forEach((inv:RPG.InventoryEntry) => {
                    var item = inv.item;
                    var price = Math.ceil(item.price * 0.2);
                    var el = this.addChild(new ItemComponent({
                        icon: item.iconHTML,
                        name: item.name,
                        price: price
                    }));

                    el.element.setAttribute('data-item', item.key);
                    el.element.setAttribute('data-price', price.toString());
                    el.element.setAttribute('data-menu', inv.equipped < inv.count && inv.count > 0 ? 'choose' : '@disabled');
                    console.log(inv);

                    this.itemComponents.push(<ItemComponent>el);
                });

                this.setupSelections(this.element);
            }

            updateList() {
                var toDelete = [];
                _.each(this.itemComponents, (ic:ItemComponent, index:number) => {
                    var itemKey = ic.element.getAttribute('data-item');
                    var inv = RPG.Party.hasItem(itemKey);
                    if (!inv) {
                        ic.remove();
                        toDelete.unshift(index);
                    }
                });

                _.each(toDelete, (i:number) => {
                    this.itemComponents.splice(i, 1);
                });

                if (toDelete.length > 0) {
                    this.setupSelections(this.element);
                }
            }

            setSelection(index:number) {
                super.setSelection(index);

                if (this.selections.length < 1) return;
                this.parent.updateDescription(RPG.Party.hasItem(this.findAll('.item')[this.selectionIndex].getAttribute('data-item')).item.description);
            }

            pause() {
                this.element.style.display = 'none';
            }

            unpause() {
                this.updateList();
                this.parent.updateMoney();

                if (RPG.Party.inventory.length < 1) {
                    RPG.Menu.pop();
                    return;
                }

                this.element.style.display = '';
            }

            choose(el) {
                var itemKey = el.getAttribute('data-item');
                var price = parseInt(el.getAttribute('data-price'), 10);

                var m = new ConfirmSellMenu({
                    item: itemKey,
                    price: price
                });
                RPG.Menu.push(m, this, <HTMLElement>this.element.parentNode);
            }
        }

        class ConfirmSellMenu extends RPG.Menu {
            itemKey:string;
            itemPrice:number;
            owned_:number;
            count_:number;
            equipped_:number;
            price:number;
            itemComponent:ItemComponent;
            inventoryEntry:RPG.InventoryEntry;

            constructor(args) {
                super({
                    className: 'menu confirm-sell-menu',
                    cancelable: true,
                    direction: RPG.MenuDirection.GRID,
                    selectionContainer: '.selections',
                    html: `
                        <div class="item-container"></div>
                        <ul class="sell-container selections">
                            <li><span class="label" data-menu="confirm">Sell</span> <span class="count"></span></li>
                        </div>
                        <div class="other-info">
                            <div class="owned-container">
                                <span class="label">Owned</span> <span class="count"></span>
                            </div>
                            <div class="equipped-container">
                                <span class="label">Equipped</span> <span class="count"></span>
                            </div>
                        </div>
                    `
                });

                this.itemKey = args.item;
                this.price = args.price;

                this.inventoryEntry = RPG.Party.hasItem(this.itemKey);
                var item = this.inventoryEntry.item;

                this.itemComponent = new ItemComponent({
                    icon: item.iconHTML,
                    name: item.name,
                    price: args.price
                });
                this.addChild(this.itemComponent, this.find('.item-container'));

                this.owned = this.inventoryEntry.count;
                this.count = 1;

                if (!item.equipSlot) {
                    this.find('.equipped-container').style.display = 'none';
                }
                this.equipped = this.inventoryEntry.equipped;
            }

            // TODO: make this pattern easier?
            get count():number { return this.count_; }
            set count(x:number) {
                this.count_ = x;
                this.find('.sell-container .count').innerText = x.toString();
                this.itemComponent.setPrice(this.price * this.count_);
            }

            get owned():number { return this.owned_; }
            set owned(x:number) {
                this.owned_ = x;
                this.find('.owned-container .count').innerText = x.toString();
            }

            get equipped():number { return this.equipped_; }
            set equipped(x:number) {
                this.equipped_ = x;
                this.find('.equipped-container .count').innerText = x.toString();
            }

            moveSelection(delta:number, direction:RPG.MenuDirection) {
                var d = delta;
                if (direction === RPG.MenuDirection.VERTICAL) d *= -10;
                this.count = Math.max(0, Math.min(this.owned - this.equipped, this.count + d));
            }

            confirm() {
                RPG.Party.money += this.price * this.count;
                RPG.Party.removeItem(this.inventoryEntry, this.count);
                RPG.Menu.pop();
            }
        }

    }
}
