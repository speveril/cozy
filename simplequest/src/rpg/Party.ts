module RPG {
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
                speed: 80,
                triggersEvents: true,
                respectsObstructions: 'true'
            });
        }
    }

    export class Party {
        static members:Array<PartyMember> = [];
        static inventory:Inventory = new Inventory();
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

        static characters():Array<Character> {
            return _.pluck(this.members, "character");
        }

        static isInParty(ch:Character):boolean {
            return Party.characters().indexOf(ch) !== -1;
        }

        static serialize():any {
            return {
                members:        _.map(this.members, (m:PartyMember) => _.find(_.keys(RPG.characters), (k) => RPG.characters[k] === m.character)),
                inventory:      _.map(this.inventory.get(), (i:Item) => i.key),
                money:          this.money
            };
        }
    }
}
