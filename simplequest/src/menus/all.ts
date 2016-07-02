///<reference path="Boot.ts"/>
///<reference path="Main.ts"/>

module SimpleQuest {
    export module Menu {
        export function quitGame() {
            RPG.Scene.start()
                .then(function() {
                    return RPG.Scene.waitForFadeOut(1.0, "#000000");
                })
                .then(function() {
                    RPG.Scene.finish();
                    Egg.quit();
                });
        }
    }
}
