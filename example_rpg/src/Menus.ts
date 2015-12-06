module SimpleQuest {
    export class Menu_Main extends RPG.Menu {
        constructor() {
            super({ html: "ui/main-menu.html" });
        }

        exit() { Egg.quit(); }
    }
}
