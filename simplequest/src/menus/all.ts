///<reference path="Boot.ts"/>
///<reference path="Main.ts"/>
///<reference path="Shop.ts"/>

module SimpleQuest {
    export module Menu {
        export function quitGame() {
            RPG.Scene.do(function*() {
                yield* RPG.Scene.waitFadeTo("black", 1.0);
                Cozy.quit();
            }.bind(this));
        }
    }
}
