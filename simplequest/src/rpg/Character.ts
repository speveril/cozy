module RPG {
    export class Character {
        static attributes:string[] = ["damage","critical","dodge","block","defense"];
        static attributeAbbr:string[] = ["DMG","CRT","DOD","BLK","DEF"];

        name:string = '';

        private _xp:number = 0;
        private _level:number = 0;
        private _hp:number;
        maxhp:number;
        sprite:string;
        treasure:any;
        portrait:string;
        title:string;
        actions:Array<any>;

        private baseAttribute:{ [key:string]:number } = {};
        private effectiveAttribute:{ [key:string]:number } = {};
        private traits:Array<string> = [];
        private effectiveTraits:Array<string> = [];

        levels:Array<any>;
        equipped:{ [key:string]: Item } = {};

        constructor(args:any) {
            this.name        = args.name;
            this.sprite      = args.sprite;
            this.levels      = args.levels || [];
            this.treasure    = _.clone(args.treasure);

            Character.attributes.forEach((attribute) => this.baseAttribute[attribute] = 0);
            if (_.has(args, 'attributes')) {
                this.adjust(args.attributes);
            }

            if (args.levels && this.levels[0] !== null) { // correct for 1-based level table
                this.levels.unshift(null);
            }

            this.maxhp       = _.has(args, 'maxhp') ? args.maxhp : args.hp;
            this.xp          = args.xp || 0;
            this.portrait    = args.portrait || '';
            this.title       = args.title || '';
            this.traits      = args.traits ? _.clone(args.traits) : [];

            this.recalcAttributes();

            if (args.equipped) {
                _.each(args.equipped, (itemKey:string, slotKey:string) => {
                    var itm = RPG.Party.inventory.has(itemKey);
                    this.equipItem(itm, slotKey);
                });
            }

            this.hp = _.has(args, 'hp') ? args.hp : this.maxhp;
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
                    case "baseAttribute":
                        data["attributes"] = this[k];
                        break;
                    case "effectiveAttribute":
                        // skip this one
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
            this.effectiveTraits = _.clone(this.traits);
            _.each(this.equipped, (item:Item, slot:string) => {
                if (!item) return;

                if (item.equipEffect && item.equipEffect.attributes) {
                    _.each(item.equipEffect.attributes, (v:number, k:string) => {
                        if (Character.attributes.indexOf(k) !== -1) {
                            this.effectiveAttribute[k] += v;
                            console.log("   ", item.name, k, v);
                        } else {
                            throw new Error("Tried to adjust bad attribute '" + k + "'");
                        }
                    });
                    _.each(item.equipEffect.traits, (t:string) => {
                        this.effectiveTraits.push(t);
                    })
                }
            });
        }

        levelUp(level:number):void {
            this._level = level;

            let lv = this.levels[this._level];
            Character.attributes.forEach((attribute) => this.baseAttribute[attribute] = lv[attribute] || this.baseAttribute[attribute]);

            if (lv.hp) {
                let gain = lv.hp - this.maxhp;
                this.maxhp = lv.hp;
                this.hp += gain;
            }

            this.recalcAttributes();

            // TODO same way of gaining abilities, but SimpleQuest doesn't have them yet, so TBD
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

        hasTrait(key:string):boolean {
            if (key.indexOf("*") === -1) {
                return (this.effectiveTraits.indexOf(key) !== -1);
            }
            // TODO add wildcard look up
        }

        modifiedDamage(amount:number, type:string):number {
            let damage = amount;
            if (this.hasTrait('vulnerable:' + type)) {
                damage *= 2;
            }
            if (this.hasTrait('resist:' + type)) {
                damage *= 0.5;
            }
            if (this.hasTrait('immune:' + type)) {
                damage = 0;
            }
            if (this.hasTrait('absorb:' + type)) {
                damage = -damage;
            }
            return Math.round(damage);
        }

        get xp():number { return this._xp; }
        get level():number { return this._level; }
        get hp():number { return this._hp; }

        set xp(n:number) {
            this._xp = n;
            while (this.levels[this.level + 1] && this._xp >= this.levels[this.level + 1].xp) {
                this.levelUp(this.level + 1);
            }
        }

        set hp(n:number) {
            // TODO events? then battle systems could just respond to those instead of checking all the time...
            this._hp = Math.min(this.maxhp, Math.max(0, n));
        }
    }
}
