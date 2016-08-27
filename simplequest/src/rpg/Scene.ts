module RPG {
    enum WaitType { Time, Button, FadeOut, FadeIn };
    class Wait {
        type:WaitType;
        promise:Promise<any>;
        args:any;
        resolve:any;

        constructor(type:WaitType, args:any) {
            this.type = type;
            this.args = args;

            this.promise = new Promise(function(resolver, rejecter) {
                this.resolve = resolver;
            }.bind(this));
        }
    }

    export class Scene {
        static scenes:Array<any> = [];

        private static promise:Promise<any> = null;
        private static restoreControls:RPG.ControlMode;
        private static waits:Wait[] = [];
        private static fadeLayer:HTMLElement;

        static get currentScene():any {
            return Scene.scenes[Scene.scenes.length - 1];
        }

        static do(sceneFunc) {
            if (!this.fadeLayer) {
                this.fadeLayer = document.createElement('div');
                this.fadeLayer.style.height = "100%";
                this.fadeLayer.style.position = "absolute"
                this.fadeLayer.style.top = "0px";
                this.fadeLayer.style.left = "0px";
                this.fadeLayer.style.width = "100%";
                this.fadeLayer.style.height = "100%";
                this.fadeLayer.style.zIndex = "100";
                this.fadeLayer.style.opacity = '0';
                RPG.uiPlane.container.appendChild(this.fadeLayer);
            }

            var wrapper = function*() {
                console.log(" > START SCENE", sceneFunc);
                if (RPG.player && RPG.player.sprite) {
                    RPG.player.sprite.animation = "stand_" + RPG.player.dir;
                }

                RPG.controlStack.push(RPG.ControlMode.Scene);
                yield* sceneFunc();
                console.log(" > END SCENE", sceneFunc);
            }

            console.log("PUSHING SCENE", sceneFunc);
            this.scenes.push([wrapper.call(this)]);
            this.currentScene[1] = this.currentScene[0].next(0);
        }

        static update(dt:number) {
            if (this.currentScene) {
                this.currentScene[1] = this.currentScene[0].next(dt);
                console.log(this.scenes);
                while (this.currentScene && this.currentScene[1].done) {
                    console.log("POPPING SCENE", this.currentScene[0]);

                    if (this.scenes.length === 1) {
                        this.fadeLayer.style.opacity = '0';
                    }
                    RPG.controlStack.pop();
                    this.scenes.pop();
                }
            }
        }

        static *waitButton(b:string) {
            while (true) {
                if (Egg.Input.pressed(b)) {
                    return;
                }
                yield;
            }
        }

        static *waitFadeTo(color:string, duration:number) {
            this.fadeLayer.style.opacity = '0';
            this.fadeLayer.style.backgroundColor = color;

            var len = duration;
            var elapsed = 0;
            while(elapsed < duration) {
                elapsed += yield;
                this.fadeLayer.style.opacity = Math.min(1, elapsed / duration).toString();
            }
        }

        static *waitFadeFrom(color:string, duration:number) {
            this.fadeLayer.style.opacity = '1';
            this.fadeLayer.style.backgroundColor = color;

            var elapsed = 0;
            while(elapsed < duration) {
                elapsed += yield;
                this.fadeLayer.style.opacity = Math.max(0, 1 - (elapsed / duration)).toString();
            }
        }

        static *waitTime(duration:number) {
            var elapsed = 0;
            while (elapsed < duration) {
                elapsed += yield;
            }
        }

    }
}
