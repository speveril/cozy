module RPG {
    export class InventoryEntry {
        public item:Item;
        public count:number;
        public equipped:number;

        constructor(item, count) {
            this.item = item;
            this.count = count;
            this.equipped = 0;
        }
    }

    export class PartyMember {
        character:Character;
        entity:Entity;

        constructor(ch) {
            this.character = ch;
            this.entity = null;
        }

        makeEntity() {
            return new RPG.Entity({
                sprite: this.character.sprite,
                speed: 64,
                triggersEvents: true,
                respectsObstructions: true
            });
        }
    }

    export class Party {
        static members:Array<PartyMember> = [];
        static inventory:Array<InventoryEntry> = [];
        static money:number = 0;

        static add(ch:Character) {
            var pm = new PartyMember(ch);
            this.members.push(pm);
        }

        static each(f:(ch:Character)=>void) {
            for (var i = 0; i < this.members.length; i++) {
                f(this.members[i].character);
            }
        }

        static getInventory(filterFunc?) {
            if (filterFunc) {
                return _.filter(Party.inventory, (entry) => filterFunc(entry.item));
            } else {
                return Party.inventory.slice(0);
            }
        }

        static addItem(itemKey:string, count?:number):Array<InventoryEntry> {
            if (count === undefined) count = 1;

            var item = Item.lookup(itemKey);
            var inv:Array<InventoryEntry> = [];

            if (item.canStack) {
                var existingEntry = Party.hasItem(itemKey);
                if (existingEntry) {
                    inv.push(existingEntry);
                    existingEntry.count += count;
                } else {
                    inv.push(new InventoryEntry(item, count));
                    Party.inventory.push(inv[0]);
                }
            } else {
                _.times(count, () => {
                    var i = new InventoryEntry(item, 1);
                    inv.push(i);
                    Party.inventory.push(i)
                });
            }

            Party.inventory.sort((a,b) => {
                if (a.item.sort === b.item.sort) {
                    return a.item.name < b.item.name ? -1 : 1;
                }
                return a.item.sort - b.item.sort;
            });

            return inv;
        }

        static hasItem(itemKey:string) {
            return _.find(Party.inventory, (e) => e.item.key === itemKey);
        }

        static removeItem(inv:InventoryEntry, count?:number) {
            if (count === undefined) count = 1;

            if (inv.count > count) {
                inv.count -= count;
            } else if (inv) {
                Party.inventory.splice(_.indexOf(Party.inventory, inv), 1);
            }
            // TODO throw error if insufficient to remove?
        }
    }
}
