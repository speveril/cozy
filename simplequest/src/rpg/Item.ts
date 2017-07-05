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

            this.icon = data.icon ? Cozy.gameDir.file(data.icon).url : '';
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
            this.id_ = Cozy.uniqueID();
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

        canUse(character:RPG.Character, targets:Array<RPG.Character>) {
            if (!this.def.useEffect) return false;

            var context = _.has(this.def.useEffect, '_context') ? this.def.useEffect._context : 'any';

            if (context === 'combat' && !Battle.active) return false;
            if (context === 'menu' && Battle.active) return false;

            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                switch (this.def.useEffect._target) {
                    case 'self':
                        return true;
                    case 'ally':
                        if (Party.isInParty(target)) return true;
                        break;
                    case 'enemy':
                        if (Battle.isCombatant(target) && !Party.isInParty(target)) return true;
                        break;
                    default:
                        // nothing
                }
            }

            return false;
        }

        canEquip(character:RPG.Character, slot:string) {
            if (this.equipSlot !== slot) return false;
            if (this.location !== character && this.location !== RPG.Party.inventory) return false;
            return true;
        }

        activate(character:RPG.Character, opts:any={}) {
            if (!this.def.useEffect) return;

            var result:any = {};
            _.each(this.def.useEffect, (params:any, effect:string) => {
                if (effect[0] === '_') return;
                var r = RPG.Effect.do(effect, this, character, params);
                _.each(r, (v, k:string) => {
                    if (k === 'success') result[k] = result[k] || v;
                    else result[k] = result[k] ? result[k] + v : v;
                });
            });

            if (result.success) {
                if (!opts.silent && this.def.useEffect['_sound']) {
                    RPG.sfx[this.def.useEffect['_sound']].play();
                }
                Party.inventory.remove(this);
            }

            return result;
        }
    }
}
