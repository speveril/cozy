module SimpleQuest {
    export module Menu {
        export class Boot extends RPG.Menu {
            constructor() {
                super({ html: "ui/boot-menu.html" });
                this.element.className = "menu boot-menu";
            }
            newGame() {
                RPG.Scene.start()
                    .then(function() {
                        sfx['start'].play();
                        return RPG.Scene.waitForFadeOut(1.0, "#000000");
                    })
                    .then(function() {
                        RPG.Scene.finish();
                        SimpleQuest.newGame();
                        RPG.Menu.pop();
                    });
            }
            loadGame() { console.log("not yet"); }
            exit() { SimpleQuest.Menu.quitGame(); }
        }
    }
}
