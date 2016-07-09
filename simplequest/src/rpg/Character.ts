module RPG {
    export class Character {
        static attributes:string[] = ["attack","defense","critical","evade"];

        name:string = '';

        private _xp:number = 0;
        private _level:number = 1;
        hp:number;
        maxhp:number;
        sprite:string;
        treasure:any;

        private baseAttribute:{ [key:string]:number } = {};
        private effectiveAttribute:{ [key:string]:number } = {};

        levels:number[] = [];
        equipped:{ [key:string]: Item } = {};

        constructor(args:any) {
            this.name     = args.name;
            this.sprite   = args.sprite;
            this.maxhp    = args.hp;
            this.treasure = args.treasure;
            this.levels   = args.levels;

            Character.attributes.forEach((attribute) => this.baseAttribute[attribute] = 0);
            this.adjust(args.attributes);

            this.hp = this.maxhp;
        }

        adjust(stats:{ [attribute:string]:number }):void {
            _.each(stats, (v:number, k:string) => {
                if (Character.attributes.indexOf(k) !== -1) {
                    this.baseAttribute[k] += v;
                } else {
                    throw new Error("Tried to adjust bad attribute '" + k + "'");
                }
            });
            this.recalcAttributes();
        }

        get(attribute:string):any {
            if (Character.attributes.indexOf(attribute) !== -1) {
                return this.effectiveAttribute[attribute];
            }
            throw new Error("Tried to get bad attribute '" + attribute + "'");
        }

        getBase(attribute:string):any {
            if (Character.attributes.indexOf(attribute) !== -1) {
                return this.baseAttribute[attribute];
            }
            throw new Error("Tried to get bad base attribute '" + attribute + "'");
        }

        private recalcAttributes():void {
            Character.attributes.forEach((attribute) => {
                this.effectiveAttribute[attribute] = this.baseAttribute[attribute];
            });
            _.each(this.equipped, (item:Item, slot:string) => {
                if (item && item.equipEffect && item.equipEffect.attributes) {
                    _.each(item.equipEffect.attributes, (v:number, k:string) => {
                        if (Character.attributes.indexOf(k) !== -1) {
                            this.effectiveAttribute[k] += v;
                        } else {
                            throw new Error("Tried to adjust bad attribute '" + k + "'");
                        }
                    });
                }
            })
        }

        levelUp(level:number):void {
            this._level = level;
        }

        equipItem(itemKey:string, slot:string) {
            if (itemKey === null) {
                this.equipped[slot] = null;
            } else {
                var invEntry = Party.hasItem(itemKey);
                if (!invEntry) return false;

                var item = invEntry.item;
                if (item.equipSlot !== slot) return false;

                this.equipped[slot] = item;
            }

            this.recalcAttributes();

            return true;
        }

        get xp():number { return this._xp; }
        get level():number { return this._level; }

        set xp(n:number) {
            this._xp = n;
            while (this._xp >= this.levels[this.level]) {
                this.levelUp(this.level + 1);
            }
        }
    }
}
