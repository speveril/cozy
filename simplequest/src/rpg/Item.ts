namespace RPG {
    export class Item {
        static items:any = {};

        static load(items:any) {
            _.each(items, (def:any, key:string) => {
                console.log(" item ->", key, def);
                Item.items[key] = new Item(key, def);
            });
            console.log(Item.items);
        }

        static lookup(key:string) {
            if (Item.items[key]) {
                return Item.items[key];
            }
            throw new Error("Tried to look up bad item '" + key + "'");
        }

        key:string;
        name:string;
        icon:string;

        constructor(key:string, def:any) {
            this.key = key;
            this.icon = Egg.File.urlPath(def.icon);
            this.name = def.name;
        }
    }
}
