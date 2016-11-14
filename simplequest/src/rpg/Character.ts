module RPG {
    export class Character {
        static attributes:string[] = ["attack","damage","critical","evade","defense"];
        static attributeAbbr:string[] = ["ATK","DMG","CRT","EVD","DEF"];

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
            this.treasure = _.clone(args.treasure);
            this.xp       = args.xp || 0;
            this.levels   = args.levels;

            if (this.treasure && this.treasure['money']) {
                this.treasure['money'] = new RPG.Dice(this.treasure['money']);
            }

            Character.attributes.forEach((attribute) => this.baseAttribute[attribute] = 0);
            this.adjust(args.attributes);

            this.hp = this.maxhp;
        }

        serialize():any {
            var data = {};
            _.each(_.keys(this), (k) => {
                if (typeof this[k] === 'function') return;

                var data_k = k.replace(/^_/,'');

                switch (k) {
                    case "equipped":
                        data[data_k] = _.mapObject(this[k], (vv:Item, kk:string) => vv.key);
                        break;
                    default:
                        data[data_k] = this[k];
                }
            });
            return data;
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
                if (!item) return;

                if (item.equipEffect && item.equipEffect.attributes) {
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

        equipItem(item:Item, slot:string) {
            if (item.equipSlot !== slot) return false;

            let current = this.equipped[slot];
            if (current) {
                current.location = Party.inventory;
            }

            if (item === null) {
                this.equipped[slot] = null;
            } else {
                this.equipped[slot] = item;
                item.location = this;
            }

            this.recalcAttributes();

            return true;
        }

        tryOn(items:{ [slot:string]:RPG.Item }) {
            let stats = {};

            Character.attributes.forEach((attribute) => {
                stats[attribute] = this.baseAttribute[attribute];
            });
            _.each(RPG.equipSlots, (slot:string) => {
                let item = this.equipped[slot];
                if (_.has(items, slot)) {
                    item = items[slot];
                }

                if (!item || !item.equipEffect) return;

                _.each(item.equipEffect.attributes, (v:number, k:string) => {
                    if (Character.attributes.indexOf(k) !== -1) {
                        stats[k] += v;
                    } else {
                        throw new Error("Tried to adjust bad attribute '" + k + "'");
                    }
                });
            });

            return stats;
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
