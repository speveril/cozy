module RPG {
    export class Scene {
        static currentScene:Scene;

        private promise:Promise<any> = null;
        private restoreControls:RPG.ControlMode;

        constructor() {
            this.promise = new Promise(function(resolve, reject) {
                this.restoreControls = RPG.controls;
                RPG.controls = RPG.ControlMode.Scene
                Scene.currentScene = this;
                resolve();
            }.bind(this));
        }

        then(success, failure?) {
            return this.promise.then(success, failure);
        }

        finish() {
            RPG.controls = this.restoreControls;
            Scene.currentScene = null;
        }
    }
}
