///<reference path="ItemComponent.ts"/>

module SimpleQuest {
    export module Menu {
        export class ShopMenu extends RPG.Menu {
            priceMultiplier:number;
            products:RPG.ItemDef[];

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
                this.products = _.map(args.products, (i:string) => RPG.Item.library[i]);

                this.setupSelections(this.find('.info.selections'));
            }

            unpause() {
                super.unpause();
                this.updateDescription('');
                if (RPG.Party.inventory.count() < 1) {
                    this.find('.selections .sell').setAttribute('data-menu', '@disabled');
                } else {
                    this.find('.selections .sell').setAttribute('data-menu', 'sell');
                }
            }

            buy() {
                var m = new BuyMenu({
                    parent: this,
                    products: this.products,
                    priceMultiplier: this.priceMultiplier
                });
                this.addChild(m, '.items-container');
                RPG.Menu.push(m);
            }

            sell() {
                var m = new SellMenu({
                    parent: this,
                });
                this.addChild(m, '.items-container');
                RPG.Menu.push(m);
            }

            updateMoney() {
                this.find('.money').innerHTML = `${RPG.Party.money}${RPG.moneyName}`;
            }

            updateDescription(desc) {
                this.find('.description').innerHTML = desc;
            }

            resume() { RPG.Menu.pop().remove(); }
        }

        class BuyMenu extends RPG.Menu {
            parent:ShopMenu;
            priceMultiplier:number;
            products:Array<RPG.ItemDef>;

            constructor(args) {
                super({
                    className: 'menu buy-menu items selections',
                    cancelable: true
                });

                this.products = args.products;
                this.priceMultiplier = args.priceMultiplier;

                this.products.forEach((itemDef:RPG.ItemDef) => {
                    let price = Math.ceil(itemDef.price * this.priceMultiplier);
                    let el = this.addChild(new ItemComponent({
                        icon: itemDef.iconHTML,
                        name: itemDef.name,
                        price: price
                    }));

                    el.element.setAttribute('data-item', itemDef.key);
                    el.element.setAttribute('data-price', price.toString());
                    el.element.setAttribute('data-menu', price <= RPG.Party.money ? 'choose' : '@disabled');
                });

                this.setupSelections(this.element);
            }

            updateEnabled() {
                _.each(this.findAll('li.item'), (el:HTMLElement) => {
                    var item = RPG.Item.library[el.getAttribute('data-item')];
                    el.setAttribute(
                        'data-menu',
                        item.price * this.priceMultiplier <= RPG.Party.money ? 'choose' : '@disabled'
                    );
                });
            }

            setSelection(index:number) {
                super.setSelection(index);

                if (this.selections.length < 1) return false;
                this.parent.updateDescription(this.products[this.selectionIndex].description);
                return true;
            }

            choose(el) {
                var itemKey = el.getAttribute('data-item');
                var price = parseInt(el.getAttribute('data-price'), 10);

                if (price <= RPG.Party.money) {
                    RPG.Party.money -= price;
                    RPG.Party.inventory.add(itemKey);
                }

                this.updateEnabled();
                this.parent.updateMoney();
            }

            stop() {
                super.stop();
                this.remove();
            }
        }

        class SellMenu extends RPG.Menu {
            parent:ShopMenu;
            items:Array<Array<RPG.Item>>;

            constructor(args) {
                super({
                    className: 'menu sell-menu items selections',
                    cancelable: true
                });

                this.rebuildList();
            }

            rebuildList():void {
                this.items = RPG.Party.inventory.stacked((item) => item.sellable);
                this.element.innerHTML = '';

                this.items.forEach((stack:Array<RPG.Item>) => {
                    var price = Math.ceil(stack[0].price * 0.2);
                    var el = this.addChild(new ItemComponent({
                        icon: stack[0].iconHTML,
                        name: stack[0].name,
                        price: price
                    }));

                    var sellable = _.findIndex(stack, (item) => item.location === RPG.Party.inventory) !== -1;

                    el.element.setAttribute('data-item', stack[0].key);
                    el.element.setAttribute('data-price', price.toString());
                    el.element.setAttribute('data-menu', sellable ? 'choose' : '@disabled');
                });

                this.setupSelections(this.element);
            }

            setSelection(index:number) {
                super.setSelection(index);

                if (this.selections.length < 1) return false;
                this.parent.updateDescription(this.items[this.selectionIndex][0].description);
                return true;
            }

            pause() {
                super.pause();
                this.element.style.display = 'none';
            }

            unpause() {
                super.unpause();
                this.rebuildList();
                this.parent.updateMoney();

                if (RPG.Party.inventory.count() < 1) {
                    RPG.Menu.pop().remove();
                    return;
                }

                this.element.style.display = '';
            }

            choose(el) {
                var m = new ConfirmSellMenu({
                    stack: this.items[this.selectionIndex]
                });
                this.addChild(m, <HTMLElement>this.element.parentNode);
                RPG.Menu.push(m);
            }
        }

        class ConfirmSellMenu extends RPG.Menu {
            owned_:number;
            count_:number;
            equipped_:number;
            price:number;
            itemComponent:ItemComponent;
            stack:Array<RPG.Item>;

            constructor(args) {
                super({
                    className: 'menu confirm-sell-menu',
                    cancelable: true,
                    direction: RPG.MenuDirection.GRID,
                    selectionContainer: '.selections',
                    html: `
                        <div class="item-container"></div>
                        <div class="sell-info">
                            <div class="owned-container">
                                <span class="label">Owned</span> <span class="count"></span>
                            </div>
                            <div class="equipped-container">
                                <span class="label">Equipped</span> <span class="count"></span>
                            </div>

                            <ul class="sell-container selections">
                                <li data-menu="confirm"><span class="label">Sell</span> <span class="count"></span></li>
                            </ul>
                            <div class="total-container">
                                <span class="label">Total</span> <span class="total"></span>
                            </div>
                        </div>
                    `
                });

                this.stack = args.stack;
                this.price = this.stack[0].price * 0.2;

                this.itemComponent = new ItemComponent({
                    icon: this.stack[0].iconHTML,
                    name: this.stack[0].name,
                    price: this.price
                });
                this.addChild(this.itemComponent, this.find('.item-container'));

                this.owned = this.stack.length;
                this.count = 1;

                if (!this.stack[0].equipSlot) {
                    this.find('.equipped-container').style.display = 'none';
                    this.equipped = 0;
                } else {
                    this.equipped = _.reduce(this.stack, (n:number, item:RPG.Item) => n += (item.location === RPG.Party.inventory ? 1 : 0), 0);
                }
            }

            // TODO: make this pattern easier?
            get count():number { return this.count_; }
            set count(x:number) {
                this.count_ = x;

                var countSpan = this.find('.sell-container .count');
                countSpan.innerText = x.toString();
                countSpan.classList.toggle('floor', this.count_ === 0);
                countSpan.classList.toggle('ceil', this.count_ === this.owned - this.equipped);

                var totalSpan = this.find('.total-container .total');
                totalSpan.innerText = (this.price * this.count_).toString() + RPG.moneyName;
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
                return true;
            }

            stop() {
                super.stop();
                this.remove();
            }

            confirm() {
                RPG.Party.money += this.price * this.count;

                var toSell = [];
                _.times(this.count, (i:number) => {
                    if (toSell.length >= this.count) return;
                    if (this.stack[i].location === RPG.Party.inventory) {
                        toSell.push(this.stack[i]);
                    }
                });

                RPG.Party.inventory.remove(toSell);
                RPG.Menu.pop();
            }
        }

    }
}
