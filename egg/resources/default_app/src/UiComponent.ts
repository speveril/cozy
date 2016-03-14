module Egg {
    export class UiComponent {
        public element:HTMLElement;

        protected parent:UiComponent;
        protected children:UiComponent[];
        protected tag:string = 'div';

        private template:string;

        constructor(args:any) {
            this.tag = args.tag || this.tag;
            this.template = args.template;

            this.children = [];
            this.element = document.createElement(this.tag);
        }

        setParent(parent:UiComponent, parentElement?:HTMLElement|string):void {
            if (this.parent) {
                var i = this.parent.children.indexOf(this);
                this.parent.children.splice(i, 1);
            }
            this.parent = parent;
            this.parent.children.push(this);

            var el:HTMLElement;

            if (parentElement === undefined) {
                el = parent.element;
            } else if (typeof parentElement === 'string') {
                el = parent.find(parentElement);
            } else {
                el = parentElement;
            }

            el.appendChild(this.element);
        }

        addChild(child:UiComponent, parentElement?:HTMLElement|string) {
            child.setParent(this, parentElement);
        }

        find(selector:string):HTMLElement {
            return <HTMLElement>this.element.querySelector(selector);
        }

        findAll(selector:string):HTMLElement[] {
            var list: HTMLElement[] = [];
            var nodeList = this.element.querySelectorAll(selector);
            for (var i = 0; i < nodeList.length; i++) {
                list.push(<HTMLElement>nodeList[i]);
            }
            return list;
        }

        /**
        Called each frame.
        @param dt       Number of seconds that has passed since last frame.
        **/
        update(dt:Number):void {
            this.children.forEach((child) => child.update(dt));
        }
    }
}
