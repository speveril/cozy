module SimpleQuest {
    function quitGame() {
        RPG.Scene.start()
            .then(function() {
                return RPG.Scene.waitForFadeOut(1.0, "#000000");
            })
            .then(function() {
                Egg.quit();
                RPG.Scene.finish();
            });
    }

    export class Menu_Boot extends RPG.Menu {
        constructor() {
            super({ html: "ui/boot-menu.html" });
            this.container.className = "menu boot-menu";
        }
        newGame() {
            RPG.Scene.start()
                .then(function() {
                    return RPG.Scene.waitForFadeOut(1.0, "#000000");
                })
                .then(function() {
                    RPG.Scene.finish();
                    SimpleQuest.newGame();
                    RPG.Menu.pop();
                });
        }
        loadGame() { console.log("not yet"); }
        exit() { quitGame(); }
    }

    export class Menu_Main extends RPG.Menu {
        cancelable:boolean = true;
        
        constructor() {
            super({ html: "ui/main-menu.html" });
            this.container.className = "menu main-menu";
        }
        exit() { quitGame(); }
    }
}
