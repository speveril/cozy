module Egg {
    export class Entity {
        parent:Entity              = null;
        children:Array<Entity>     = [];
        components:Dict<Component> = {};

        constructor(components?:Array<Component>) {
            if (components) {
                components.forEach((c:Component) => this.addComponent(c));
            }
        }

        addChild(child?:Entity|Array<Component>):Entity {
            var ch:any;
            if (child && child instanceof Array) {
                ch = new Entity(<Array<Component>>child);
            } else if (child) {
                ch = child;
            } else {
                ch = new Entity();
            }
            if (ch.parent) ch.parent.removeChild(child);
            ch.parent = this;
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
            this.components[component.constructor.name] = component;
            return component;
        }

        getComponent(name:string):Component {
            return this.components[name];
        }

        update(dt:number):void {
            _.each(this.components, (c:any) => c.update(dt));
            this.children.forEach((e:Entity) => e.update(dt));
        }
    }

    export class Component {
        owner:Entity;
        update(dt:number) {}
    }
}
