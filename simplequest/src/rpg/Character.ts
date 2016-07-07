module RPG {
    export class Character {
        name:string = '';
        private _xp:number = 0;
        private _level:number = 1;
        hp:number = 1;
        maxhp:number = 1;
        attack:number = 1;
        defense:number = 1;
        critical:number = 0;
        evade:number = 0;
        sprite:string = null;
        treasure:any = {};

        levels:number[] = [];
        equipped:{ [key:string]: Item } = {};

        constructor(args:any) {
            _.each(args, function(v, k) {
                if (typeof v === 'function') {
                    this[k] = v();
                } else {
                    this[k] = v;
                }
            }.bind(this));

            if (args.hp === undefined) {
                this.hp = this.maxhp;
            }
        }

        adjust(stats:any):void {
            _.each(stats, function(v, k) {
                this[k] += v;
            }.bind(this));
        }

        levelUp(level:number):void {
            this._level = level;
        }

        equipItem(itemKey:string, slot:string) {
            var invEntry = Party.hasItem(itemKey);
            if (!invEntry) return false;

            var item = invEntry.item;
            if (item.equipSlot !== slot) return false;

            this.equipped[slot] = item;
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
