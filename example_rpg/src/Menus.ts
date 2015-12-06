module SimpleQuest {
    export class Menu_Boot extends RPG.Menu {
        constructor() {
            super({ html: "ui/boot-menu.html" });
            this.container.className = "menu boot-menu";
        }
        newGame() { SimpleQuest.newGame(); RPG.Menu.pop(); }
        loadGame() { console.log("not yet"); }
        exit() { Egg.quit(); }
    }

    export class Menu_Main extends RPG.Menu {
        constructor() {
            super({ html: "ui/main-menu.html" });
            this.container.className = "menu main-menu";
        }
        exit() { Egg.quit(); }
    }
}
