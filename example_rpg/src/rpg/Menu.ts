module RPG {
    export class Menu {
        static menuStack:Menu[];

        static get currentMenu():Menu {
            return Menu.menuStack[Menu.menuStack.length - 1] || null;
        }

        static init():void {
            this.menuStack = [];
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
            Menu.menuStack.pop().destroy();
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
        constructor(def) {
            this.container = document.createElement('div');

            this.container.className = "menu";
            console.log(def);

            var htmlFile:string = Egg.File.projectFile(def.html);
            this.container.innerHTML = Egg.File.read(htmlFile);
            _.each(this.container.getElementsByTagName('img'), function(img) {
                img.src = Egg.File.pathname(htmlFile) + "/" + img.getAttribute('src');
            });
            _.each(this.container.getElementsByTagName('link'), function(link) {
                link.href = Egg.File.pathname(htmlFile) + "/" + link.getAttribute('href');
            });
        }
        destroy() {
            this.container.remove();
        }

        start() {
            RPG.uiPlane.ui.appendChild(this.container);
        }
        pause() {
            this.container.style.display = "none";
        }
        unpause() {
            this.container.style.display = "";
        }
        update(dt) {
            if (Egg.button('menu')) {
                Egg.debounce('menu');
                Menu.pop();
            }
        }
    }
}
