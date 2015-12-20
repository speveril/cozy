module RPG {
    export class Character {
        name:string;
        hp:number;
        maxhp:number;
        attack:number;
        defense:number;
        critical:number;
        evade:number;
        sprite:string;

        constructor(args:any) {
            _.each(args, function(v, k) {
                this[k] = v;
            }.bind(this));
        }
    }
}
