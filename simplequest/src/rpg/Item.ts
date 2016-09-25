namespace RPG {
    export class ItemDef {
        key:string;
        sort:number;
        name:string;
        price:number;
        sellable:boolean;
        icon:string;
        iconFrame:number[];
        description:string;
        useEffect:any;
        canStack:boolean;
        equipSlot:string;
        equipEffect:any;

        constructor(key:string, data:any) {
            this.key = key;
            this.sort = data.sort;

            this.icon = Egg.File.urlPath(data.icon);
            this.iconFrame = data.icon_frame;
            this.name = data.name;
            this.description = data.description;
            this.canStack = !!data.canStack;

            this.price = data.price || 1;
            this.sellable = _.has(data, 'sellable') ? data.sellable : true;

            this.equipSlot = data.slot;
            this.equipEffect = data.equip;
            this.useEffect = data.use;
        }

        get iconHTML():string {
            var style = `background-image:url(${this.icon});`;
            style += this.iconFrame ? `background-position: -${this.iconFrame[0]}px -${this.iconFrame[1]}px` : '';
            return `<span class="item-icon" style="${style}"></span>`
        }
    }

    export class Item {
        public static library:{[key:string]:ItemDef} = {};

        static load(items:any) {
            _.each(items, (def:any, key:string) => {
                Item.library[key] = new ItemDef(key, def);
            });
        }

        static make(key:string):Item {
            return new Item(Item.library[key]);
        }

        private def:ItemDef;
        private overrides:Dict<any>;
        private id_:string;
        public location:any;
        constructor(def:ItemDef) {
            this.id_ = Egg.uniqueID();
            this.location = null;
            this.def = def;
            this.overrides = null;
        }

        getAttr(key:string):any {
            if (this.overrides && _.has(this.overrides, key)) return this.overrides[key];
            return this.def[key];
        }

        get id():string             { return this.id_; }

        get key():string            { return this.getAttr('key'); }
        get sort():number           { return this.getAttr('sort'); }
        get name():string           { return this.getAttr('name'); }
        get price():number          { return this.getAttr('price'); }
        get sellable():boolean      { return this.getAttr('sellable'); }
        get icon():string           { return this.getAttr('icon'); }
        get iconFrame():number[]    { return this.getAttr('iconFrame'); }
        get description():string    { return this.getAttr('description'); }
        get useEffect():any         { return this.getAttr('useEffect'); }
        get canStack():boolean      { return this.getAttr('canStack'); }
        get equipSlot():string      { return this.getAttr('equipSlot'); }
        get equipEffect():any       { return this.getAttr('equipEffect'); }
        get iconHTML():string       { return this.getAttr('iconHTML'); }

        override(key:string, value:any):void {
            if (this.overrides === null) this.overrides = {};
            this.overrides[key] = value;
        }

        hasOverrides():boolean {
            return this.overrides === null;
        }

        makeIcon(element:HTMLElement) {
            element.style.backgroundImage = "url(" + this.icon + ")";
            if (this.def.iconFrame) {
                element.style.backgroundPosition = "-" + this.def.iconFrame[0] + "px -" + this.def.iconFrame[1] + "px";
            }
        }

        canUse(character:RPG.Character, target:RPG.Character) {
            if (!this.def.useEffect) return false;
            switch (this.def.useEffect._target) {
                case 'self':
                    return true;
                // TODO
            }

            return false;
        }

        canEquip(character:RPG.Character, slot:string) {
            if (this.equipSlot !== slot) return false;
            if (this.location !== character && this.location !== RPG.Party.inventory) return false;
            return true;
        }

        activate(character:RPG.Character) {
            if (!this.def.useEffect) return;
            _.each(this.def.useEffect, (params:any, effect:string) => {
                if (effect === '_target') return;

                if (RPG.Effect[effect]) {
                    var args = params.slice(0);
                    args.unshift(character);
                    args.unshift(this);

                    if (RPG.Effect[effect].apply(this, args)) {
                        Party.inventory.remove(this);
                    }
                } else {
                    console.warn("! Bad effect", effect, "triggered from", this.def.key);
                }
            })
        }
    }
}
