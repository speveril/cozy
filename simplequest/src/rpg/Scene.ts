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
        static currentScene:any;

        private static promise:Promise<any> = null;
        private static restoreControls:RPG.ControlMode;
        private static waits:Wait[] = [];
        private static fadeLayer:HTMLElement;

        static do(sceneFunc) {
            function* wrapper() {
                if (!this.fadeLayer) {
                    this.fadeLayer = document.createElement('div');
                    this.fadeLayer.style.height = "100%";
                    this.fadeLayer.style.position = "absolute"
                    this.fadeLayer.style.top = "0px";
                    this.fadeLayer.style.left = "0px";
                    this.fadeLayer.style.width = "100%";
                    this.fadeLayer.style.height = "100%";
                    this.fadeLayer.style.opacity = '0';
                }
                RPG.uiPlane.container.appendChild(this.fadeLayer);

                if (RPG.player) {
                    RPG.player.sprite.animation = "stand_" + RPG.player.dir;
                }

                var restoreControls = RPG.controls;

                RPG.controls = RPG.ControlMode.Scene
                yield* sceneFunc();

                // only restore controls if something in the scene didn't change them
                if (RPG.controls === RPG.ControlMode.Scene) {
                    RPG.controls = restoreControls;
                }

                this.fadeLayer.style.opacity = '0';
                this.fadeLayer.remove();
            }

            this.currentScene = wrapper.call(this);
            this.currentScene.next(0);
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

        static start() {
            if (!this.fadeLayer) {
                this.fadeLayer = document.createElement('div');
                this.fadeLayer.style.height = "100%";
                this.fadeLayer.style.position = "absolute"
                this.fadeLayer.style.top = "0px";
                this.fadeLayer.style.left = "0px";
                this.fadeLayer.style.width = "100%";
                this.fadeLayer.style.height = "100%";
                this.fadeLayer.style.opacity = '0';
            }
            RPG.uiPlane.container.appendChild(this.fadeLayer);

            this.promise = new Promise(function(resolve, reject) {
                if (RPG.player) {
                    RPG.player.sprite.animation = "stand_" + RPG.player.dir;
                }
                this.restoreControls = RPG.controls;
                RPG.controls = RPG.ControlMode.Scene
                resolve();
            }.bind(this));
            return this.promise;
        }

        static finish() {
            RPG.controls = this.restoreControls;
            this.waits = [];

            this.fadeLayer.style.opacity = '0';
            this.fadeLayer.remove();
        }

        static update(dt:number) {
            if (this.currentScene) {
                if (this.currentScene.next(dt).done) {
                    this.currentScene = null;
                }
            }

            var remove:number[] = [];
            _.each(this.waits, function(wait:Wait, index:number):void {
                switch(wait.type) {
                    case WaitType.Time:
                        wait.args.passed += dt;
                        if (wait.args.passed >= wait.args.delay) {
                            wait.resolve();
                            remove.push(index);
                        }
                        break;
                    case WaitType.Button:
                        if (Egg.Input.pressed(wait.args.which)) {
                            Egg.Input.debounce(wait.args.which);
                            wait.resolve();
                            remove.push(index);
                        }
                        break;
                    case WaitType.FadeOut:
                        wait.args.passed += dt;
                        if (wait.args.passed >= wait.args.delay) {
                            this.fadeLayer.style.opacity = '1';
                            wait.resolve();
                            remove.push(index);
                        } else {
                            this.fadeLayer.style.opacity = '' + (wait.args.passed / wait.args.delay);
                        }
                        break;
                    case WaitType.FadeIn:
                        wait.args.passed += dt;
                        if (wait.args.passed >= wait.args.delay) {
                            this.fadeLayer.style.opacity = '0';
                            wait.resolve();
                            remove.push(index);
                        } else {
                            this.fadeLayer.style.opacity = '' + (1 - (wait.args.passed / wait.args.delay));
                        }
                        break;
                }
            }.bind(this));
            _.each(remove.reverse(), function(index:number) {
                this.waits.splice(index, 1);
            }.bind(this));
        }

        private static addWait(type:WaitType, args:any) {
            var w = new Wait(type,args);
            this.waits.push(w);
            return w.promise;
        }

        static waitForTime(t:number) {
            return this.addWait(WaitType.Time, { passed:0, delay:t });
        }

        static waitForButton(b:string) {
            return this.addWait(WaitType.Button, { which:b })
        }

        static waitForFadeOut(duration:number, color?:string) {
            this.fadeLayer.style.opacity = '0';
            this.fadeLayer.style.backgroundColor = color || "black";
            return this.addWait(WaitType.FadeOut, { passed:0, delay:duration });
        }

        static waitForFadeIn(duration:number, color?:string) {
            this.fadeLayer.style.opacity = '1';
            this.fadeLayer.style.backgroundColor = color || "black";
            return this.addWait(WaitType.FadeIn, { passed:0, delay:duration });
        }
    }
}
