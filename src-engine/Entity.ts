///<reference path="Component.ts"/>
///<reference path="Components/all.ts"/>

module Cozy {
    /**
    Entity class. Pairs with Component. Intended as an eventual ECS-style structure, either as a replacement or an
    alternative to the Object hierarchy. Not currently finished -- your mileage may vary.
    **/
    export class Entity {
        parent:Entity              = null;
        children:Array<Entity>     = [];
        components:Dict<Component> = {};
        //tags:Dict<string>          = {}; // TODO

        constructor(parent?:Entity, components?:Array<Component>) {
            this.parent = parent;
            if (components) {
                components.forEach((c:Component) => this.addComponent(c));
            }
        }

        addChild(child?:Entity|Array<Component>):Entity {
            var ch:any;
            if (child && child instanceof Array) {
                ch = new Entity(this, <Array<Component>>child);
            } else if (child) {
                ch = child;
                if (ch.parent) ch.parent.removeChild(child);
                ch.parent = this;
                // TODO re-add components
            } else {
                ch = new Entity(this);
            }
            this.children.push(ch);
            return ch;
        }

        removeChild(child:Entity):Entity {
            this.children.splice(this.children.indexOf(child), 1);
            return child;
        }

        addComponent(component:Component) {
            // TODO removeComponent?
            component.owner = this;
            this.components[component.constructor['name']] = component;
            component.added();
            return component;
        }

        hasComponent(name:string):boolean {
            return _.has(this.components, name);
        }
        has<T extends Component>(t:{new():T}):boolean {
            return _.has(this.components, t['name']);
        }

        getComponent(name:string):Component {
            return this.components[name];
        }
        get<T extends Component>(t:{new():T}):T {
            return <T>this.components[t['name']];
        }

        getNearest<T extends Component>(t:{new():T}):T {
            var e:Entity = this;
            while (e && !e.has(t)) e = e.parent;
            return e ? e.get(t) : null;
        }

        update(dt:number):void {
            _.each(this.components, (c:any) => c.update(dt));
            this.children.forEach((e:Entity) => e.update(dt));
        }

        render():void {
            _.each(this.components, (c:any) => c.render());
            this.children.forEach((e:Entity) => e.render());
        }
    }
}
