module Cozy {
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
                _.each(axisMap, (ids, axis) => {
                    _.each(ids, (id) => {
                        if (!_.has(this.axisMap, id.toString())) this.axisMap[id] = [];
                        this.axisMap[id].push(axis);
                    })
                });
            }
        }

        // override for each device
        getButtonState():{[name:string]:number} { return {}; }
        getAxisState():{[name:string]:number} { return {}; }
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

        getButtonState():{[name:string]:number} {
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
            console.log(navigator.getGamepads()[this.index]);
        }

        getButtonState():{[name:string]:number} {
            var pad = navigator.getGamepads()[this.index];
            var state:{[name:string]:number} = {};
            _.each(pad.buttons, (button, id) => {
                if (button.pressed && _.has(this.buttonMap, id.toString())) {
                    _.each(this.buttonMap[id], (b) => {
                        state[b] = Math.max(state[b] || 0, button.value);
                    });
                }
            });
            return state;
        }

        getAxisState():{[name:string]:number} {
            var pad = navigator.getGamepads()[this.index];
            var state:{[name:string]:number} = {};
            var count:{[name:string]:number} = {};

            _.each(pad.axes, (d, axisIndex) => {
                if (Math.abs(d) < Input.deadzone) return;
                if (_.has(this.axisMap, axisIndex.toString())) {
                    _.each(this.axisMap[axisIndex], (axisName) => {
                        count[axisName] = (count[axisName] || 0) + 1;
                        state[axisName] = (state[axisName] || 0) + d;
                    });
                }
            });
            return _.mapObject(state, (d, name) => {
                return d / count[name];
            });
        }
    }

    export class Input {
        public static deadzone:number = 0.25;
        private static buttonMap: { [key:number]:string[] };
        private static button:Dict<ButtonState>;
        private static axes:Dict<number>;
        private static buttonTimeouts:Dict<number>;
        private static callbacks:Dict<Array<any>>;
        private static devices:Array<Device>;
        private static controlConfig:Dict<any>;

        static init(controls?:{ [name:string]: any }) {
            this.axes = {};
            this.button = {};
            this.buttonMap = {};
            this.buttonTimeouts = {};
            this.callbacks = {};
            this.devices = [];

            window.addEventListener("gamepadconnected", (evt) => {
                var gamepad = navigator.getGamepads()[evt['gamepad'].index];
                console.log("CONNECTED ->", evt['gamepad'], gamepad);
                if (gamepad && gamepad.connected && gamepad.id.match(/XInput STANDARD GAMEPAD/)) {
                    this.addGamepad(gamepad.index);
                }
            });

            window.addEventListener('gamepaddisconnected', (evt) => {
                var gamepad = evt['gamepad'];
                console.log("Lost gamepad.", gamepad);
            });

            this.controlConfig = controls || {};
            this.addKeyboard();
        }

        static update(dt) {
            if (!document.hasFocus()) return;

            var buttonState = {};
            var axisState = {};

            _.each(Input.devices, (device) => {
                buttonState = _.extend(buttonState, device.getButtonState());
                _.each(device.getAxisState(), (d:number, id:string) => {
                    axisState[id] = axisState[id] || [];
                    axisState[id].push(d);
                });
            });

            _.each(_.keys(this.axes), (a) => {
                if (axisState[a]) {
                    this.axes[a] = _.reduce(axisState[a], (acc:number, x:number) => acc + x) / axisState[a].length;
                    buttonState[`${a}+`] = this.axes[a] > 0 ? 1 : 0;
                    buttonState[`${a}-`] = this.axes[a] < 0 ? 1 : 0;
                } else {
                    this.axes[a] = 0.0;
                    buttonState[`${a}+`] = 0;
                    buttonState[`${a}-`] = 0;
                }
            });

            _.each(this.button, (state, b) => {
                if (state !== ButtonState.IGNORED && buttonState[b] > Input.deadzone) {
                    this.button[b] = ButtonState.DOWN;
                    var eventInfo = { button: b, pressed: true };
                    this.triggerCallbacks(b, eventInfo);
                    this.triggerCallbacks(b + ".down", eventInfo);
                } else if (state !== ButtonState.UP && (!buttonState[b] || buttonState[b] < Input.deadzone)) {
                    this.button[b] = ButtonState.UP;
                    var eventInfo = { button: b, pressed: false };
                    this.triggerCallbacks(b, eventInfo);
                    this.triggerCallbacks(b + ".up", eventInfo);
                    clearTimeout(this.buttonTimeouts[b]);
                }
            });


        }

        static on(eventName, cb, ctx) {
            var events:Array<string> = eventName.split(' ');
            _.each(events, (e) => {
                if (!this.callbacks[e]) this.callbacks[e] = [];
                this.callbacks[e].push({ callback: cb, context: ctx }) - 1;
            })
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
                var events = eventName.split(' ');
                _.each(events, clearEvent);
            }
        }

        private static addKeyboard() {
            var b, buttons = this.controlConfig['keyboard'];

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
                "menu": [3, 9] // Y, "start"
            };

            _.each(_.keys(b), (buttonName) => {
                if (!_.has(this.button, buttonName)) {
                    this.button[buttonName] = ButtonState.UP;
                }
            });

            a = {
                "horizontal": [0, 2], // left-stick horiz, right-stick horiz
                "vertical": [1, 3] //left-stick vert, right-stick vert
            };

            _.each(_.keys(a), (axisName) => {
                if (!_.has(this.axes, axisName)) {
                    this.axes[axisName] = 0.0;
                    this.button[`${axisName}+`] = ButtonState.UP;
                    this.button[`${axisName}-`] = ButtonState.UP;
                }
            });

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

        static axis(name):number {
            return this.axes[name];
        }

        static debounce(names:string, duration?:number) {
            var nameList:Array<string> = names.split(" ");
            _.each(nameList, (name) => {
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
            });
        }


    }
}
