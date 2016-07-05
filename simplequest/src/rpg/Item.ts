namespace RPG {
    export class Item {
        static load(items:any) {
            _.each(items, (def:any, key:string) => {
                RPG.items[key] = new Item(key, def);
            });
        }

        static lookup(key:string) {
            if (RPG.items[key]) {
                return RPG.items[key];
            }
            console.warn("! Tried to look up bad item '" + key + "'");
        }

        key:string;
        sort:number;
        name:string;
        icon:string;
        iconFrame:any;
        description:string;
        useEffect:any;

        constructor(key:string, def:any) {
            this.key = key;
            this.sort = def.sort;

            this.icon = Egg.File.urlPath(def.icon);
            this.iconFrame = def.icon_frame;
            this.name = def.name;
            this.description = def.description;

            this.useEffect = def.use;
        }

        makeIcon(element:HTMLElement) {
            element.style.backgroundImage = "url(" + this.icon + ")";
            if (this.iconFrame) {
                element.style.backgroundPosition = "-" + this.iconFrame.x + "px -" + this.iconFrame.y + "px";
            }
        }

        activate(character:RPG.Character) {
            if (RPG.Effect[this.useEffect.effect]) {
                var args = this.useEffect.effect_params.slice(0);
                args.unshift(character);
                args.unshift(this);
                if (RPG.Effect[this.useEffect.effect].apply(undefined, args)) {
                    Party.removeItem(this.key, 1);
                }
            } else {
                console.warn("! Bad effect", this.useEffect.effect, "triggered from", this.key);
            }
        }
    }
}
