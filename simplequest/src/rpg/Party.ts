module RPG {
    export class InventoryEntry {
        public item:Item;
        public count:number;

        constructor(item, count) {
            this.item = item;
            this.count = count;
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
        static members:PartyMember[] = [];
        static inventory:InventoryEntry[] = [];
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

        static getInventory() {
            return Party.inventory;
        }

        static addItem(itemKey:string, count?:number) {
            if (count === undefined) count = 1;

            var existingEntry = Party.hasItem(itemKey);
            if (existingEntry) {
                existingEntry.count += count;
            } else {
                Party.inventory.push(new InventoryEntry(Item.lookup(itemKey), count));
            }
            Party.inventory.sort((a,b) => {
                if (a.item.sort === b.item.sort) {
                    return a.item.name < b.item.name ? -1 : 1;
                }
                return a.item.sort - b.item.sort;
            });
        }

        static hasItem(itemKey:string) {
            return _.find(Party.inventory, (e) => e.item.key === itemKey);
        }

        static removeItem(itemKey:string, count?:number) {
            if (count === undefined) count = 1;

            var existingEntry = Party.hasItem(itemKey);
            if (existingEntry && existingEntry.count > count) {
                existingEntry.count -= count;
            } else if (existingEntry) {
                Party.inventory.splice(_.indexOf(Party.inventory, existingEntry), 1);
            }
            // TODO throw error if insufficient to remove?
        }
    }
}
