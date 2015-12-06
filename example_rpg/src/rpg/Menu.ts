module RPG {
    export class Menu {
        static menuStack:Menu[] = [];

        static get currentMenu():Menu {
            return Menu.menuStack[Menu.menuStack.length - 1] || null;
        }

        static push(m:Menu):void {
            if (Menu.menuStack.length > 0) {
                Menu.currentMenu.pause();
            }
            RPG.controls = RPG.ControlMode.Menu;
            Menu.menuStack.push(m);
            m.start();
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
                throw new Error("Tried to pop with nothing in the menu stack.");
            }
            Menu.pop();
            Menu.push(m);
        }

        container:HTMLElement;
        selectionIndex:number;
        selections:HTMLElement[];

        constructor(def) {
            this.container = document.createElement('div');

            this.container.className = "menu";

            var htmlFile:string = Egg.File.projectFile(def.html);
            this.container.innerHTML = Egg.File.read(htmlFile);
            this.selections = [];

            _.each(this.container.getElementsByTagName('*'), function(element) {
                if (element.getAttribute('src')) {
                    element.src = Egg.File.pathname(htmlFile) + "/" + element.getAttribute('src');
                }
                if (element.getAttribute('href')) {
                    element.href = Egg.File.pathname(htmlFile) + "/" + element.getAttribute('href');
                }
                if (element.getAttribute('data-menu')) {
                    this.selections.push(element);
                }
            }.bind(this));
        }

        start() {
            RPG.uiPlane.ui.appendChild(this.container);
            this.setSelection(0);
        }
        pause() {
            this.container.style.display = "none";
        }
        unpause() {
            this.container.style.display = "";
        }
        stop() {
            this.container.remove();
        }
        update(dt) {}

        confirmSelection() {
            var currentMenuSelection = this.selections[this.selectionIndex].getAttribute('data-menu');
            if (this[currentMenuSelection]) {
                this[currentMenuSelection]();
            }
        }

        setSelection(index:number) {
            if (this.selectionIndex !== undefined) {
                this.selections[this.selectionIndex].className = '';
            }
            this.selectionIndex = index;
            this.fixSelectionIndex();

            this.selections[this.selectionIndex].className = 'active';
        }

        moveSelection(delta:number) {
            this.selections[this.selectionIndex].className = '';
            this.selectionIndex += delta;
            this.fixSelectionIndex();
            this.selections[this.selectionIndex].className = 'active';
        }

        private fixSelectionIndex() {
            while (this.selectionIndex < 0) this.selectionIndex += this.selections.length;
            this.selectionIndex %= this.selections.length;
        }
    }
}
