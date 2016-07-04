module RPG {
    export class Menu extends Egg.UiComponent {
        static menuStack:Menu[] = [];
        static blip:Egg.Sound = null;
        static choose:Egg.Sound = null;

        static get currentMenu():Menu {
            return Menu.menuStack[Menu.menuStack.length - 1] || null;
        }

        static push(m:Menu, parentComponent?:Egg.UiComponent, parentElement?:HTMLElement|string):void {
            if (Menu.menuStack.length > 0) {
                Menu.currentMenu.pause();
            }
            RPG.controls = RPG.ControlMode.Menu;
            Menu.menuStack.push(m);

            if (parentComponent) {
                parentComponent.addChild(m, parentElement);
            } else {
                RPG.uiPlane.addChild(m);
            }
        }

        static pop():void {
            if (Menu.menuStack.length < 1) {
                throw new Error("Tried to pop with nothing in the menu stack.");
            }
            Menu.menuStack.pop().stop();
            if (Menu.menuStack.length > 0) {
                Menu.currentMenu.unpause();
            } else {
                RPG.controls = RPG.ControlMode.Map;
            }
        }

        static replace(m:Menu):void {
            if (Menu.menuStack.length < 1) {
                throw new Error("Tried to replace with nothing in the menu stack.");
            }
            Menu.pop();
            Menu.push(m);
        }

        static update(dt:number):void {
            Menu.currentMenu.update(dt);
        }

        selectionIndex:number;
        selectionContainer:HTMLElement;
        selections:HTMLElement[];

        constructor(args) {
            super(args);

            this.element.classList.add("rpg-menu");

            this.setupSelections(args.selectionContainer || this.element);

            // TODO have a UiComponent activation system to handle this "if Menu.currentMenu !== this" stuff

            if (args.cancelable) {
                let cb = () => {
                    console.log("!cancel!", Menu.currentMenu, this);
                    if (Menu.currentMenu !== this) return;

                    Egg.Input.debounce('menu');
                    Egg.Input.debounce('cancel');
                    Menu.pop();
                };
                Egg.Input.on('menu.down', cb);
                Egg.Input.on('cancel.down', cb);
            }

            Egg.Input.on('up.down', () => {
                if (Menu.currentMenu !== this) return;

                Egg.Input.debounce('up', 0.2);
                this.moveSelection(-1);
                if (Menu.blip) {
                    Menu.blip.play();
                }
            });
            Egg.Input.on('down.down', () => {
                if (Menu.currentMenu !== this) return;

                Egg.Input.debounce('down', 0.2);
                this.moveSelection(+1);
                if (Menu.blip) {
                    Menu.blip.play();
                }
            });
            Egg.Input.on('confirm.down', () => {
                if (Menu.currentMenu !== this) return;

                Egg.Input.debounce('confirm');
                this.confirmSelection();
                if (Menu.choose) {
                    Menu.choose.play();
                }
            });
        }

        setupSelections(parent) {
            this.selections = [];
            _.each(parent.getElementsByTagName('*'), (element:HTMLElement) => {
                if (element.getAttribute('data-menu')) {
                    this.selections.push(element);
                }
            });
            this.setSelection(0);
        }

        start() {
            this.setSelection(0);
        }

        pause() {}
        unpause() {}

        stop() {
            this.remove();
        }

        update(dt) {}

        confirmSelection() {
            if (this.selections.length < 1) return;
            var currentMenuSelection = this.selections[this.selectionIndex].getAttribute('data-menu');
            if (this[currentMenuSelection]) {
                this[currentMenuSelection]();
            }
        }

        setSelection(index:number) {
            if (this.selections.length < 1) return;
            if (this.selectionIndex !== undefined) {
                this.selections[this.selectionIndex].classList.remove('active');
            }
            this.selectionIndex = Egg.wrap(index, this.selections.length);
            this.selections[this.selectionIndex].classList.add('active');
        }

        moveSelection(delta:number) {
            if (this.selections.length < 1) return;
            this.selections[this.selectionIndex].classList.remove('active');
            this.selectionIndex = Egg.wrap(this.selectionIndex + delta, this.selections.length);
            this.selections[this.selectionIndex].classList.add('active');
        }
    }
}
