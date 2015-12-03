module RPG {
    export class Menu {
        static menuStack:Menu[];
        static get currentMenu():Menu {
            return Menu.menuStack[Menu.menuStack.length - 1] || null;
        }

        static push(m:Menu):void {
            if (Menu.menuStack.length > 0) {
                Menu.currentMenu.pause();
            }
            Menu.menuStack.push(m);
            m.start();
        }

        static pop():void {
            if (Menu.menuStack.length < 1) {
                throw new Error("Tried to pop with nothing in the menu stack.");
            }
            Menu.menuStack.pop();
            if (Menu.menuStack.length > 0) {
                Menu.currentMenu.unpause();
            }
        }

        static replace(m:Menu):void {
            if (Menu.menuStack.length < 1) {
                throw new Error("Tried to pop with nothing in the menu stack.");
            }
            Menu.pop();
            Menu.push(m);
        }


        constructor(def) {

        }

        start() {}
        pause() {}
        unpause() {}
        update(dt) {}
    }
}
