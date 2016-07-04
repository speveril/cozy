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
        iconFrame:any;

        constructor(key:string, def:any) {
            this.key = key;
            this.icon = Egg.File.urlPath(def.icon);
            this.iconFrame = def.icon_frame;
            this.name = def.name;
        }

        makeIcon(element:HTMLElement) {
            element.style.backgroundImage = "url(" + this.icon + ")";
            if (this.iconFrame) {
                element.style.backgroundPosition = "-" + this.iconFrame.x + "px -" + this.iconFrame.y + "px";
            }
        }
    }
}
