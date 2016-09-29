namespace RPG {
    export class Inventory {
        private items:Array<Item> = [];
        private counts:Dict<number> = {};

        constructor() {}

        get(filterFunc?:any):Array<Item> {
            if (filterFunc && typeof filterFunc === 'string') {
                let key:string = filterFunc;
                return _.filter(this.items, (i) => i.key === key);
            } else if (filterFunc) {
                return _.filter(this.items, filterFunc);
            } else {
                return _.values(this.items);
            }
        }

        stacked(filterFunc?:any):Array<Array<Item>> {
            var list = [],
                row;

            var f = null;
            if (filterFunc && typeof filterFunc === 'string') f = ((i) => i.key === filterFunc);
            else if (filterFunc) f = filterFunc;

            _.each(this.items, (item:Item) => {
                if (f && !f(item)) return;

                if (!row || !item.canStack || item.key !== row[0].key) {
                    row = [];
                    list.push(row);
                }
                row.push(item);
            });

            return list;
        }

        has(key:string):Item {
            return _.find(this.items, (e) => e.key === key);
        }

        count(key?:string):number {
            if (key === undefined) {
                return this.items.length;
            } else {
                return this.counts[key];
            }
        }

        add(key:string, count?:number):Array<Item> {
            var n = (count === undefined ? 1 : count);
            var items:Array<Item> = [];

            _.times(n, () => {
                let i = Item.make(key);
                i.location = this;
                this.items.push(i);
                items.push(i);
            });

            this.counts[key] += n;

            this.items.sort((a,b) => {
                if (a.sort !== b.sort) return a.sort - b.sort;
                if (a.name !== b.name) return a.name < b.name ? -1 : 1;
                return a.id.localeCompare(b.id);
            });

            return items;
        }

        remove(items:Array<Item>|Item):void {
            let its:any = items;
            if (items instanceof Item) its = [<Item>its];

            _.each(its, (item:Item) => {
                let i = _.indexOf(this.items, item);
                if (i < 0) {
                    throw new Error("Tried to remove an item not in this inventory.");
                } else {
                    var item = this.items.splice(i, 1)[0];
                    item.location = null;
                }
            });
        }
    }
}
