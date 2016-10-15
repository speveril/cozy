module Egg {
    /**
    See Entity.
    **/
    export class Component {
        static lookup:Array<Array<Component>> = [];
        owner:Entity                          = null;

        constructor(args?:any) {
            Component.lookup[this.constructor['name']] = Component.lookup[this.constructor['name']] || [];
            Component.lookup[this.constructor['name']].push(this);
            if (args) {
                _.each(args, (v,k) => this[k] = v);
            }
        }

        added() {}
        update(dt:number) {}
        render() {}
    }
}
