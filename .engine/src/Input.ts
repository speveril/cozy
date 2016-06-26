module Egg {
    export enum ButtonState { UP, DOWN, IGNORED };

    export class Input {
        public static key: Object;

        static buttonMap: { [key:number]:string[] };
        static button: { [name:string]:Egg.ButtonState };
        static buttonTimeouts: { [name:string]:number };
        static callbacks: { [name:string]:any[] };

        static init(buttons?:{ [name:string]: any }) {
            this.key = {};
            this.button = {};
            this.buttonMap = {};
            this.buttonTimeouts = {};
            this.callbacks = {};

            var b:{[name:string]: number[]};

            if (buttons) {
                _.each(buttons, (v, k) => {
                    if (typeof v === 'number') {
                        b[k] = [v];
                    } else {
                        b[k] = v;
                    }
                });
            } else {
                b = {
                    "left": [37],        // left arrow
                    "up": [38],          // up arrow
                    "right": [39],       // right arrow
                    "down": [40],        // down arrow

                    "confirm": [32,88],  // space, x
                    "cancel": [18,90],   // alt, z
                    "menu": [27]         // esc
                };
            }

            _.each(b, (keys, button) => {
                _.each(keys, (key) => {
                    if (!_.has(this.buttonMap, key.toString())) this.buttonMap[key] = [];
                    this.buttonMap[key].push(button);
                })
            });
        }

        static on(eventName, cb) {
            if (!this.callbacks[eventName]) {
                this.callbacks[eventName] = [];
            }
            this.callbacks[eventName].push(cb);
        }

        private static triggerCallbacks(eventName, eventInfo) {
            if (!this.callbacks[eventName]) return;
            _.each(this.callbacks[eventName], (cb) => {
                cb(eventInfo);
            });
        }

        static onKeyDown(event) {
            var keyCode = event.keyCode;

            this.key[keyCode] = true;

            if (_.has(this.buttonMap, keyCode)) {
                _.each(this.buttonMap[keyCode], (b) => {
                    if (this.button[b] !== Egg.ButtonState.IGNORED) {
                        this.button[b] = Egg.ButtonState.DOWN;

                        var eventInfo = { button: b, pressed: true };
                        this.triggerCallbacks(b, eventInfo);
                        this.triggerCallbacks(b + ".down", eventInfo);
                    }
                });
            }
        }

        static onKeyUp(event) {
            var keyCode = event.keyCode;

            // console.log(keyCode);

            this.key[keyCode] = false;

            if (_.has(this.buttonMap, keyCode)) {
                _.each(this.buttonMap[keyCode], function(b) {
                    this.button[b] = Egg.ButtonState.UP;
                    clearTimeout(this.buttonTimeouts[b]);

                    var eventInfo = { button: b, pressed: false };
                    this.triggerCallbacks(b, eventInfo);
                    this.triggerCallbacks(b + ".up", eventInfo);
                }.bind(this));
            }

            // DEBUGGING KEYS
            if (Egg.debug && keyCode === 192) { // ~ key, opens console
                Egg.browserWindow['toggleDevTools']();
            }
        }

        static pressed(name):Boolean {
            return (this.button[name] === Egg.ButtonState.DOWN);
        }

        static debounce(name, duration?:number) {
            this.button[name] = Egg.ButtonState.IGNORED;
            if (duration !== undefined) {
                this.buttonTimeouts[name] = setTimeout(function() {
                    this.button[name] = Egg.ButtonState.DOWN;

                    var eventInfo = { button: name, pressed: true };
                    this.triggerCallbacks(name, eventInfo);
                    this.triggerCallbacks(name + ".down", eventInfo);
                }.bind(this), duration * 1000);
            }
        }


    }
}
