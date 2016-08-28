module Egg {
    enum ButtonState { UP, DOWN, IGNORED };

    class Device {
        public buttonMap: { [key:number]:string[] } = {};
        public axisMap: { [key:number]:string[] } = {};

        constructor(buttonMap?:{[name:string]:Array<number>}, axisMap?:{[name:string]:Array<number>}) {
            if (buttonMap) {
                _.each(buttonMap, (ids, button) => {
                    _.each(ids, (id) => {
                        if (!_.has(this.buttonMap, id.toString())) this.buttonMap[id] = [];
                        this.buttonMap[id].push(button);
                    })
                });
            }
            if (axisMap) {
                // TODO
            }
        }

        getSnapshot() {
            // override for each device
        }
    }

    class KeyboardDevice extends Device {
        private pressed:any;
        private keys:any;

        constructor(buttonMap:{[name:string]:Array<number>}) {
            super(buttonMap);
            this.pressed = {};
            this.keys = {};

            window.addEventListener('keydown', (e) => this.onKeyDown(e));
            window.addEventListener('keyup', (e) => this.onKeyUp(e));
        }

        onKeyDown(event) {
            var keyCode = event.keyCode;

            if (this.keys[keyCode]) return;

            this.keys[keyCode] = true;

            if (_.has(this.buttonMap, keyCode)) {
                _.each(this.buttonMap[keyCode], (b) => {
                    this.pressed[b] = this.pressed[b] ? this.pressed[b] + 1 : 1;
                });
            }
        }

        onKeyUp(event) {
            var keyCode = event.keyCode;
            this.keys[keyCode] = false;

            if (_.has(this.buttonMap, keyCode)) {
                _.each(this.buttonMap[keyCode], (b) => {
                    this.pressed[b]--;
                    if (this.pressed[b] === 0) {
                        delete this.pressed[b];
                    }
                });
            }
        }

        getSnapshot() {
            return _.mapObject(this.pressed, () => {
                return 1.0;
            });
        }
    }

    class GamepadDevice extends Device {
        index:number;

        constructor(index:number, buttonMap?:{[name:string]:Array<number>}, axisMap?:{[name:string]:Array<number>}) {
            super(buttonMap, axisMap);
            this.index = index;
        }

        getSnapshot() {
            var pad = navigator.getGamepads()[this.index];
            var state = {};
            _.each(pad.buttons, (button, id) => {
                if (button.pressed && _.has(this.buttonMap, id.toString())) {
                    _.each(this.buttonMap[id], (b) => {
                        state[b] = Math.max(state[b] || 0, button.value);
                    });
                }
            });
            return state;
        }
    }

    export class Input {
        private static buttonMap: { [key:number]:string[] };
        private static button: { [name:string]:ButtonState };
        private static buttonTimeouts: { [name:string]:number };
        private static callbacks: { [name:string]:any[] };
        private static devices:Array<Device>;

        static init(controls?:{ [name:string]: any }) {
            this.button = {};
            this.buttonMap = {};
            this.buttonTimeouts = {};
            this.callbacks = {};
            this.devices = [];

            var b:{[name:string]: number[]};

            window.addEventListener("gamepadconnected", (evt) => {
                var gamepad = navigator.getGamepads()[evt['gamepad'].index];
                if (gamepad.connected && gamepad.id.match(/XInput STANDARD GAMEPAD/)) {
                    this.addGamepad(gamepad.index);
                }
            });

            window.addEventListener('gamepaddisconnected', (evt) => {
                var gamepad = evt['gamepad'];
                console.log("Lost gamepad.", gamepad);
            });

            if (controls && controls['keyboard']) {
                this.addKeyboard(controls['keyboard']);
            } else {
                this.addKeyboard(null);
            }
        }

        static update(dt) {
            var deviceState = {};
            _.each(Input.devices, (device) => {
                deviceState = _.extend(deviceState, device.getSnapshot())
            });

            _.each(this.button, (state, b) => {
                if (state !== ButtonState.IGNORED && deviceState[b] > 0.15) {
                    this.button[b] = ButtonState.DOWN;
                    var eventInfo = { button: b, pressed: true };
                    this.triggerCallbacks(b, eventInfo);
                    this.triggerCallbacks(b + ".down", eventInfo);
                } else if (state !== ButtonState.UP && (!deviceState[b] || deviceState[b] < 0.15)) {
                    this.button[b] = ButtonState.UP;
                    var eventInfo = { button: b, pressed: false };
                    this.triggerCallbacks(b, eventInfo);
                    this.triggerCallbacks(b + ".up", eventInfo);
                    clearTimeout(this.buttonTimeouts[b]);
                }
            });
        }

        static on(eventName, cb, ctx) {
            if (!this.callbacks[eventName]) {
                this.callbacks[eventName] = [];
            }
            return this.callbacks[eventName].push({ callback: cb, context: ctx }) - 1;
        }

        static off(eventName, cb, ctx) {
            var clearEvent = (name) => {
                this.callbacks[name] = _.filter(this.callbacks[name], (ev) => {
                    if (ev.context === ctx && (cb === undefined || ev.callback === cb)) {
                        return false;
                    }
                    return true;
                });
            }

            if (eventName === undefined) {
                _.each(_.keys(this.callbacks), (n) => clearEvent(n));
            } else {
                clearEvent(eventName);
            }
        }

        private static addKeyboard(buttons) {
            var b;

            if (buttons) {
                b = _.mapObject(buttons, (v) => typeof v === 'number' ? [v] : v);
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

            _.each(_.keys(b), (buttonName) => {
                if (!_.has(this.button, buttonName)) {
                    this.button[buttonName] = ButtonState.UP;
                }
            });

            this.devices.push(new KeyboardDevice(b));
        }

        private static addGamepad(index) {
            var a:{[name:string]: number[]};
            var b:{[name:string]: number[]};

            b = {
                "left": [14], // d-pad left
                "up": [12], // d-pad up
                "right": [15], // d-pad right
                "down": [13], // d-pad down

                "confirm": [0, 2], // A, X
                "cancel": [1], // B
                "menu": [3, 9] // X, Y, "start"
            };

            _.each(_.keys(b), (buttonName) => {
                if (!_.has(this.button, buttonName)) {
                    this.button[buttonName] = ButtonState.UP;
                }
            });

            a = {
                "left-right": [0, 2], // left-stick horiz, right-stick horiz
                "up-down": [1, 3] //left-stick vert, right-stick vert
            };

            this.devices.push(new GamepadDevice(index, b, a));
        }

        private static triggerCallbacks(eventName, eventInfo) {
            if (!this.callbacks[eventName]) return;
            _.each(this.callbacks[eventName], (ev) => {
                ev.callback(eventInfo);
            });
        }

        static pressed(name):Boolean {
            return (this.button[name] === ButtonState.DOWN);
        }

        static debounce(name, duration?:number) {
            if (this.button[name] === ButtonState.DOWN) {
                this.button[name] = ButtonState.IGNORED;
                if (duration !== undefined) {
                    this.buttonTimeouts[name] = setTimeout(function() {
                        this.button[name] = ButtonState.DOWN;

                        var eventInfo = { button: name, pressed: true };
                        this.triggerCallbacks(name, eventInfo);
                        this.triggerCallbacks(name + ".down", eventInfo);
                    }.bind(this), duration * 1000);
                }
            }
        }


    }
}
