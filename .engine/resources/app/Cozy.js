var Egg;
(function (Egg) {
    class Sound {
        constructor(fileName) {
            this.loadedPromise = new Promise((resolve, reject) => {
                Egg.gameDir.file(fileName).readAsync('binary')
                    .then((fileContents) => {
                    Audio.context.decodeAudioData(fileContents, (decoded) => {
                        this.buffer = decoded;
                        resolve();
                    }, () => {
                        console.warn("Couldn't load sound file '" + fileName + "'.");
                        reject();
                    });
                }, (error) => {
                    console.warn("Failed to load '" + fileName + "'. " + error);
                    reject();
                });
            });
        }
        loaded() {
            return this.loadedPromise;
        }
        play() {
            this.source = Audio.context.createBufferSource();
            this.source.buffer = this.buffer;
            this.source.connect(Audio.sfxGain);
            this.source.start(0);
        }
    }
    Egg.Sound = Sound;
    class Music {
        constructor(def) {
            this.tracks = def.tracks;
            this.buffers = {};
            this.loadedPromise = new Promise((resolve, reject) => {
                var trackResolve = _.after(def.tracks.length - 1, resolve);
                _.each(def.tracks, (fileName) => {
                    Egg.gameDir.file(fileName).readAsync('binary')
                        .then((fileContents) => {
                        Audio.context.decodeAudioData(fileContents, (decoded) => {
                            this.buffers[fileName] = decoded;
                            trackResolve();
                        }, () => {
                            console.log("Couldn't load sound file '" + fileName + "' for song.");
                            reject();
                        });
                    });
                });
            });
        }
        loaded() {
            return this.loadedPromise;
        }
        start() {
            if (Audio.currentMusic) {
                Audio.currentMusic.stop();
            }
            Audio.currentMusic = this;
            this.source = Audio.context.createBufferSource();
            this.source.buffer = this.buffers[this.tracks[0]];
            this.source.connect(Audio.musicGain);
            this.source.loop = true;
            this.source.start(0);
        }
        stop() {
            this.source.stop();
            this.source.disconnect();
        }
    }
    Egg.Music = Music;
    class Audio {
        static init() {
            this.context = new AudioContext();
            this.musicGain = this.context.createGain();
            this.musicGain.connect(this.context.destination);
            this.sfxGain = this.context.createGain();
            this.sfxGain.connect(this.context.destination);
            this.musicVolume = 0.5;
            this.sfxVolume = 0.5;
            this.unmute();
        }
        static mute() {
            this.musicGain.gain.value = 0;
            this.sfxGain.gain.value = 0;
        }
        static unmute() {
            this.musicGain.gain.value = this.musicVolume;
            this.sfxGain.gain.value = this.sfxVolume;
        }
        static setSFXVolume(v) {
            this.sfxVolume = v;
            this.unmute();
        }
        static setMusicVolume(v) {
            this.musicVolume = v;
            this.unmute();
        }
    }
    Audio.currentMusic = null;
    Egg.Audio = Audio;
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    class Component {
        constructor(args) {
            this.owner = null;
            Component.lookup[this.constructor['name']] = Component.lookup[this.constructor['name']] || [];
            Component.lookup[this.constructor['name']].push(this);
            if (args) {
                _.each(args, (v, k) => this[k] = v);
            }
        }
        added() { }
        update(dt) { }
        render() { }
    }
    Component.lookup = [];
    Egg.Component = Component;
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    var Components;
    (function (Components) {
        class Position extends Egg.Component {
        }
    })(Components = Egg.Components || (Egg.Components = {}));
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    var Components;
    (function (Components) {
        class Renderer extends Egg.Component {
            constructor(_args) {
                super(_args);
                var args = _args || {};
                this.renderer = new PIXI.WebGLRenderer(Egg.config['width'], Egg.config['height'], { transparent: true });
                this.renderer.backgroundColor = args.renderBackground === undefined ? 'rgba(0, 0, 0, 0)' : args.renderBackground;
                this.container = new PIXI.Container();
                this.HTMLcontainer = document.createElement('div');
                this.HTMLcontainer.className = `renderer ${args.className || ''}`;
                this.HTMLcontainer.appendChild(this.renderer.view);
                document.body.insertBefore(this.HTMLcontainer, args.before);
            }
            addLayer(layer) {
                this.container.addChild(layer.innerContainer);
            }
            render() {
                this.renderer.render(this.container);
            }
        }
        Components.Renderer = Renderer;
    })(Components = Egg.Components || (Egg.Components = {}));
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    var Components;
    (function (Components) {
        class Sprite extends Egg.Component {
            constructor(args) {
                super(args);
            }
            added() {
                this.owner.getNearest(Components.SpriteLayer).add(this);
            }
        }
        Components.Sprite = Sprite;
    })(Components = Egg.Components || (Egg.Components = {}));
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    var Components;
    (function (Components) {
        class SpriteLayer extends Egg.Component {
            constructor(args) {
                super(args);
                this.innerContainer = new PIXI.Container();
            }
            added() {
                this.owner.getNearest(Components.Renderer).addLayer(this);
            }
            add(thing) {
                if (thing instanceof Components.Sprite) {
                    thing.s.layer = this;
                    this.innerContainer.addChild(thing.s.innerSprite);
                }
            }
        }
        Components.SpriteLayer = SpriteLayer;
    })(Components = Egg.Components || (Egg.Components = {}));
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    class Entity {
        constructor(parent, components) {
            this.parent = null;
            this.children = [];
            this.components = {};
            this.parent = parent;
            if (components) {
                components.forEach((c) => this.addComponent(c));
            }
        }
        addChild(child) {
            var ch;
            if (child && child instanceof Array) {
                ch = new Entity(this, child);
            }
            else if (child) {
                ch = child;
                if (ch.parent)
                    ch.parent.removeChild(child);
                ch.parent = this;
            }
            else {
                ch = new Entity(this);
            }
            this.children.push(ch);
            return ch;
        }
        removeChild(child) {
            this.children.splice(this.children.indexOf(child), 1);
            return child;
        }
        addComponent(component) {
            component.owner = this;
            this.components[component.constructor['name']] = component;
            component.added();
            return component;
        }
        hasComponent(name) {
            return _.has(this.components, name);
        }
        has(t) {
            return _.has(this.components, t['name']);
        }
        getComponent(name) {
            return this.components[name];
        }
        get(t) {
            return this.components[t['name']];
        }
        getNearest(t) {
            var e = this;
            while (e && !e.has(t))
                e = e.parent;
            return e ? e.get(t) : null;
        }
        update(dt) {
            _.each(this.components, (c) => c.update(dt));
            this.children.forEach((e) => e.update(dt));
        }
        render() {
            _.each(this.components, (c) => c.render());
            this.children.forEach((e) => e.render());
        }
    }
    Egg.Entity = Entity;
})(Egg || (Egg = {}));
var fs = require('fs');
var path = require('path');
var Egg;
(function (Egg) {
    class Directory {
        constructor(f) {
            if (!fs.existsSync(f))
                throw new Error("Couldn't open path, " + f + ".");
            this.root = path.resolve(f);
        }
        get path() {
            return this.root;
        }
        buildList(list) {
            var found = [];
            _.each(list, (f) => {
                var fullpath = path.join(this.root, f);
                var stats = fs.statSync(fullpath);
                if (stats.isDirectory()) {
                    found.push(new Directory(fullpath));
                }
                else {
                    found.push(new File(fullpath));
                }
            });
            return found;
        }
        read() {
            return this.buildList(fs.readdirSync(this.root));
        }
        find(p) {
            var stats = fs.statSync(path.join(this.root, p));
            if (stats.isDirectory())
                return new Directory(path.join(this.root, p));
            return new File(path.join(this.root, p));
        }
        file(p) {
            return new File(path.join(this.root, p));
        }
        subdir(p, createIfDoesNotExist) {
            var fullpath = path.join(this.root, p);
            if (createIfDoesNotExist && !fs.existsSync(fullpath))
                fs.mkdirSync(fullpath);
            return new Directory(path.join(this.root, p));
        }
        glob(pattern, opts) {
            return this.buildList(window['glob'].sync(pattern, opts));
        }
    }
    Egg.Directory = Directory;
    class File {
        constructor(f) {
            this.filepath = path.resolve(f);
        }
        get extension() { return path.extname(this.filepath); }
        get name() { return path.basename(this.filepath); }
        get path() { return this.filepath; }
        get exists() { return fs.existsSync(this.filepath); }
        get url() { return this.relativePath(Egg.engineDir).replace(/\\/g, "/"); }
        stat() {
            return fs.statSync(this.filepath);
        }
        relativePath(dir) {
            return path.relative(dir.path, this.path);
        }
        read(format) {
            switch (format) {
                case 'json':
                    return JSON.parse(fs.readFileSync(this.filepath, { encoding: 'UTF-8' }));
                case 'binary':
                    return fs.readFileSync(this.filepath).buffer;
                default:
                    return fs.readFileSync(this.filepath, { encoding: 'UTF-8' });
            }
        }
        readAsync(format) {
            return new Promise((resolve, reject) => {
                switch (format) {
                    case 'json':
                        fs.readFile(this.filepath, {}, (err, data) => err ? reject(err) : resolve(JSON.parse(data)));
                        break;
                    case 'binary':
                        fs.readFile(this.filepath, {}, (err, data) => err ? reject(err) : resolve(data.buffer));
                        break;
                    default:
                        fs.readFile(this.filepath, { encoding: 'UTF-8' }, (err, data) => err ? reject(err) : resolve(data));
                        break;
                }
            });
        }
        write(data, format) {
            switch (format) {
                case 'json':
                    return fs.writeFileSync(this.filepath, JSON.stringify(data), { encoding: 'UTF-8' });
                case 'binary':
                    return fs.writeFileSync(this.filepath, data);
                default:
                    return fs.writeFileSync(this.filepath, data, { encoding: 'UTF-8' });
            }
        }
    }
    Egg.File = File;
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    var ButtonState;
    (function (ButtonState) {
        ButtonState[ButtonState["UP"] = 0] = "UP";
        ButtonState[ButtonState["DOWN"] = 1] = "DOWN";
        ButtonState[ButtonState["IGNORED"] = 2] = "IGNORED";
    })(ButtonState || (ButtonState = {}));
    ;
    class Device {
        constructor(buttonMap, axisMap) {
            this.buttonMap = {};
            this.axisMap = {};
            if (buttonMap) {
                _.each(buttonMap, (ids, button) => {
                    _.each(ids, (id) => {
                        if (!_.has(this.buttonMap, id.toString()))
                            this.buttonMap[id] = [];
                        this.buttonMap[id].push(button);
                    });
                });
            }
            if (axisMap) {
                _.each(axisMap, (ids, axis) => {
                    _.each(ids, (id) => {
                        if (!_.has(this.axisMap, id.toString()))
                            this.axisMap[id] = [];
                        this.axisMap[id].push(axis);
                    });
                });
            }
        }
        getButtonState() { return {}; }
        getAxisState() { return {}; }
    }
    class KeyboardDevice extends Device {
        constructor(buttonMap) {
            super(buttonMap);
            this.pressed = {};
            this.keys = {};
            window.addEventListener('keydown', (e) => this.onKeyDown(e));
            window.addEventListener('keyup', (e) => this.onKeyUp(e));
        }
        onKeyDown(event) {
            var keyCode = event.keyCode;
            if (this.keys[keyCode])
                return;
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
        getButtonState() {
            return _.mapObject(this.pressed, () => {
                return 1.0;
            });
        }
    }
    class GamepadDevice extends Device {
        constructor(index, buttonMap, axisMap) {
            super(buttonMap, axisMap);
            this.index = index;
            console.log(navigator.getGamepads()[this.index]);
        }
        getButtonState() {
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
        getAxisState() {
            var pad = navigator.getGamepads()[this.index];
            var state = {};
            var count = {};
            _.each(pad.axes, (d, axisIndex) => {
                if (Math.abs(d) < Input.deadzone)
                    return;
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
    class Input {
        static init(controls) {
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
            if (!document.hasFocus())
                return;
            var buttonState = {};
            var axisState = {};
            _.each(Input.devices, (device) => {
                buttonState = _.extend(buttonState, device.getButtonState());
                _.each(device.getAxisState(), (d, id) => {
                    axisState[id] = axisState[id] || [];
                    axisState[id].push(d);
                });
            });
            _.each(_.keys(this.axes), (a) => {
                if (axisState[a]) {
                    this.axes[a] = _.reduce(axisState[a], (acc, x) => acc + x) / axisState[a].length;
                    buttonState[`${a}+`] = this.axes[a] > 0 ? 1 : 0;
                    buttonState[`${a}-`] = this.axes[a] < 0 ? 1 : 0;
                }
                else {
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
                }
                else if (state !== ButtonState.UP && (!buttonState[b] || buttonState[b] < Input.deadzone)) {
                    this.button[b] = ButtonState.UP;
                    var eventInfo = { button: b, pressed: false };
                    this.triggerCallbacks(b, eventInfo);
                    this.triggerCallbacks(b + ".up", eventInfo);
                    clearTimeout(this.buttonTimeouts[b]);
                }
            });
        }
        static on(eventName, cb, ctx) {
            var events = eventName.split(' ');
            _.each(events, (e) => {
                if (!this.callbacks[e])
                    this.callbacks[e] = [];
                this.callbacks[e].push({ callback: cb, context: ctx }) - 1;
            });
        }
        static off(eventName, cb, ctx) {
            var clearEvent = (name) => {
                this.callbacks[name] = _.filter(this.callbacks[name], (ev) => {
                    if (ev.context === ctx && (cb === undefined || ev.callback === cb)) {
                        return false;
                    }
                    return true;
                });
            };
            if (eventName === undefined) {
                _.each(_.keys(this.callbacks), (n) => clearEvent(n));
            }
            else {
                var events = eventName.split(' ');
                _.each(events, clearEvent);
            }
        }
        static addKeyboard() {
            var b, buttons = this.controlConfig['keyboard'];
            if (buttons) {
                b = _.mapObject(buttons, (v) => typeof v === 'number' ? [v] : v);
            }
            else {
                b = {
                    "left": [37],
                    "up": [38],
                    "right": [39],
                    "down": [40],
                    "confirm": [32, 88],
                    "cancel": [18, 90],
                    "menu": [27]
                };
            }
            _.each(_.keys(b), (buttonName) => {
                if (!_.has(this.button, buttonName)) {
                    this.button[buttonName] = ButtonState.UP;
                }
            });
            this.devices.push(new KeyboardDevice(b));
        }
        static addGamepad(index) {
            var a;
            var b;
            b = {
                "left": [14],
                "up": [12],
                "right": [15],
                "down": [13],
                "confirm": [0, 2],
                "cancel": [1],
                "menu": [3, 9]
            };
            _.each(_.keys(b), (buttonName) => {
                if (!_.has(this.button, buttonName)) {
                    this.button[buttonName] = ButtonState.UP;
                }
            });
            a = {
                "horizontal": [0, 2],
                "vertical": [1, 3]
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
        static triggerCallbacks(eventName, eventInfo) {
            if (!this.callbacks[eventName])
                return;
            _.each(this.callbacks[eventName], (ev) => {
                ev.callback(eventInfo);
            });
        }
        static pressed(name) {
            return (this.button[name] === ButtonState.DOWN);
        }
        static axis(name) {
            return this.axes[name];
        }
        static debounce(names, duration) {
            var nameList = names.split(" ");
            _.each(nameList, (name) => {
                if (this.button[name] === ButtonState.DOWN) {
                    this.button[name] = ButtonState.IGNORED;
                    if (duration !== undefined) {
                        this.buttonTimeouts[name] = setTimeout(function () {
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
    Input.deadzone = 0.25;
    Egg.Input = Input;
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    class Layer {
        constructor() {
            this.sprites = [];
            this.innerContainer = new PIXI.Container();
        }
        update(dt) {
            this.sprites.forEach(function (s) {
                s.update(dt);
            });
        }
        offset(x, y) {
            this.innerContainer.position.x = Math.floor(x);
            this.innerContainer.position.y = Math.floor(y);
        }
        getOffset() {
            return _.clone(this.innerContainer.position);
        }
        add(thing) {
            if (thing instanceof Egg.Sprite) {
                this.sprites.push(thing);
                thing.layer = this;
                this.innerContainer.addChild(thing.innerSprite);
            }
        }
        remove(sp) {
            var index = this.sprites.indexOf(sp);
            if (index !== -1) {
                this.sprites.splice(index, 1);
            }
            this.innerContainer.removeChild(sp.innerSprite);
        }
        sortSprites(f) {
            this.innerContainer.children.sort(f);
        }
        clear() {
            this.sprites.forEach(function () {
                this.innerContainer.removeChild(this.sprites[0].innerSprite);
            }.bind(this));
        }
    }
    Egg.Layer = Layer;
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    class Map {
    }
    Egg.Map = Map;
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    class Plane {
        constructor(args) {
            this.container = document.createElement('div');
            document.body.insertBefore(this.container, args.before);
            this.container.className = "plane " + args.className;
        }
        show() {
            this.container.style.display = '';
        }
        hide() {
            this.container.style.display = 'none';
        }
        bringToFront() {
            document.body.appendChild(this.container);
        }
        update(dt) { }
        render() { }
        clear() { }
        resize(mult) { }
    }
    Egg.Plane = Plane;
    class RenderPlane extends Plane {
        constructor(args) {
            super(args);
            this.renderer = new PIXI.WebGLRenderer(Egg.config['width'], Egg.config['height'], { transparent: true });
            this.renderer.backgroundColor = args.renderBackground === undefined ? 'rgba(0, 0, 0, 0)' : args.renderBackground;
            this.container.appendChild(this.renderer.view);
            this.layers = [];
            this.layerContainer = new PIXI.Container();
        }
        render() {
            if (this.renderer) {
                this.renderer.render(this.layerContainer);
            }
        }
        update(dt) {
            _.each(this.layers, function (layer) {
                layer.update(dt);
            }.bind(this));
        }
        setBackground(color) {
            this.renderer.backgroundColor = color;
        }
        addRenderLayer(index) {
            var lyr = new Egg.Layer();
            if (index === undefined) {
                this.layers.push(lyr);
            }
            else {
                this.layers.splice(index, 0, lyr);
            }
            this.layerContainer.addChild(lyr.innerContainer);
            return lyr;
        }
        clear() {
            this.layers = [];
            this.layerContainer.removeChildren();
        }
        resize(mult) {
            this.renderer.resolution = mult;
            this.renderer.resize(Egg.config['width'], Egg.config['height']);
        }
    }
    Egg.RenderPlane = RenderPlane;
    class UiPlane extends Plane {
        constructor(args) {
            super(args);
            this.container.className += ' ui';
            this.root = new Egg.UiComponent({});
            this.container.appendChild(this.root.element);
        }
        update(dt) {
            this.root.update(dt);
        }
        addHTML(file) {
            var container = document.createElement('div');
            container.innerHTML = Egg.gameDir.find(file).read();
            this.container.appendChild(container);
            return container;
        }
        addChild(child) {
            this.root.addChild(child);
        }
        clear() {
            while (this.container.lastChild) {
                this.container.removeChild(this.container.lastChild);
            }
        }
        resize(mult) {
            this.container.style.transform = "scale(" + mult + ")";
            this.container.style.width = Egg.config['width'];
            this.container.style.height = Egg.config['height'];
        }
    }
    Egg.UiPlane = UiPlane;
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    class Sprite {
        constructor(args) {
            if (typeof args === "string") {
                args = Egg.gameDir.file(args).read('json');
            }
            if (!args.texture)
                throw new Error("Sprite must be instantiated with a 'texture'");
            args.hotspot = args.hotspot || {};
            args.position = args.position || {};
            args.frameSize = args.frameSize || {};
            if (typeof args.texture === 'string') {
                args.texture = Egg.getTexture(args.texture);
            }
            this.texture = new PIXI.Texture(args.texture.innerTexture);
            this.innerSprite = new PIXI.Sprite(this.texture);
            this.hotspot = new PIXI.Point(args.hotspot.x || 0, args.hotspot.y || 0);
            this.position = new PIXI.Point(args.position.x || 0, args.position.y || 0);
            this.frameSize = new PIXI.Point(args.frameSize.x || args.texture.width, args.frameSize.y || args.texture.height);
            this.textureFrame = new PIXI.Rectangle(0, 0, this.frameSize.x, this.frameSize.y);
            this.frame_ = 0;
            this.frameBank = args.frameBank ? new PIXI.Rectangle(args.frameBank.x, args.frameBank.y, args.frameBank.width, args.frameBank.height) : new PIXI.Rectangle(0, 0, this.texture.width, this.texture.height);
            this.frameCounts = new PIXI.Point(Math.floor(this.frameBank.width / this.frameSize.x), Math.floor(this.frameBank.height / this.frameSize.y));
            this.clip = new PIXI.Rectangle(0, 0, this.frameSize.x, this.frameSize.y);
            this.updateTextureFrame();
            this.animations = args.animations || {};
            this.frameRate = args.frameRate || 60;
            if (args.currentAnimation) {
                this.animation = args.currentAnimation;
            }
            this.positionInnerSprite();
        }
        set frame(f) {
            this.frame_ = f;
            this.updateTextureFrame();
        }
        get frame() {
            return this.frame_;
        }
        set animation(anim) {
            if (this.animations[anim]) {
                if (this.animations[anim] == this.currentAnimation)
                    return;
                this.currentAnimation = this.animations[anim];
                this.animationScratch = {
                    counter: 0,
                    currentFrame: null,
                    name: anim
                };
            }
            else {
                this.currentAnimation = null;
                this.animationScratch = null;
            }
        }
        get animation() {
            if (this.currentAnimation) {
                return this.animationScratch['name'];
            }
            else {
                return undefined;
            }
        }
        setClip(x, y, w, h) {
            this.clip.x = x;
            this.clip.y = y;
            this.clip.width = w;
            this.clip.height = h;
            this.updateTextureFrame();
        }
        updateTextureFrame() {
            this.textureFrame.x = this.frameSize.x * (this.frame % this.frameCounts.x) + this.clip.x + this.frameBank.x;
            this.textureFrame.y = this.frameSize.y * Math.floor(this.frame / this.frameCounts.x) + this.clip.y + this.frameBank.y;
            this.texture.frame.width = Math.max(Math.min(this.frameSize.x, this.clip.width), 0);
            this.texture.frame.height = Math.max(Math.min(this.frameSize.y, this.clip.height), 0);
            this.texture.frame = this.textureFrame;
        }
        quake(t, range, decay) {
            this.currentQuake = {
                remaining: t,
                range: range,
                decay: decay,
                offset: {
                    x: Math.random() * 2 * (range.x) - range.x,
                    y: Math.random() * 2 * (range.y) - range.y,
                }
            };
        }
        update(dt) {
            if (this.currentAnimation) {
                var f = this.animationScratch['currentFrame'] || 0;
                this.animationScratch['counter'] += dt;
                while (this.animationScratch['counter'] > this.currentAnimation['frames'][f][1]) {
                    this.animationScratch['counter'] -= this.currentAnimation['frames'][f][1];
                    f++;
                    if (f >= this.currentAnimation['frames'].length) {
                        if (!this.currentAnimation['loop']) {
                            this.animation = null;
                        }
                        else {
                            f = 0;
                        }
                    }
                }
                if (this.animationScratch['currentFrame'] !== f) {
                    this.frame = this.currentAnimation['frames'][f][0];
                    this.animationScratch['currentFrame'] = f;
                }
            }
            if (this.currentQuake) {
                this.currentQuake['remaining'] -= dt;
                if (this.currentQuake['remaining'] < 0) {
                    this.currentQuake = null;
                }
                else {
                    if (this.currentQuake['decay']) {
                        this.currentQuake['range'].x = Math.max(0, this.currentQuake['range'].x - this.currentQuake['decay'].x * dt);
                        this.currentQuake['range'].y = Math.max(0, this.currentQuake['range'].y - this.currentQuake['decay'].y * dt);
                    }
                    this.currentQuake['offset'] = {
                        x: Math.random() * 2 * (this.currentQuake['range'].x) - this.currentQuake['range'].x,
                        y: Math.random() * 2 * (this.currentQuake['range'].y) - this.currentQuake['range'].y,
                    };
                }
                this.positionInnerSprite();
            }
        }
        setPosition(x, y) {
            this.position.x = x;
            this.position.y = y;
            this.positionInnerSprite();
        }
        adjustPosition(x, y) {
            this.position.x += x;
            this.position.y += y;
            this.positionInnerSprite();
        }
        overlaps(sp) {
            var me = {
                left: this.innerSprite.position.x,
                right: this.innerSprite.position.x + this.innerSprite.width,
                top: this.innerSprite.position.y,
                bottom: this.innerSprite.position.y + this.innerSprite.height
            };
            var them = {
                left: sp.innerSprite.position.x,
                right: sp.innerSprite.position.x + sp.innerSprite.width,
                top: sp.innerSprite.position.y,
                bottom: sp.innerSprite.position.y + sp.innerSprite.height
            };
            return (me.left < them.right
                && me.right > them.left
                && me.top < them.bottom
                && me.bottom > them.top);
        }
        positionInnerSprite() {
            this.innerSprite.x = Math.floor(this.position.x - this.hotspot.x);
            this.innerSprite.y = Math.floor(this.position.y - this.hotspot.y);
            if (this.currentQuake) {
                this.innerSprite.x += Math.floor(this.currentQuake['offset'].x);
                this.innerSprite.y += Math.floor(this.currentQuake['offset'].y);
            }
        }
    }
    Egg.Sprite = Sprite;
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    class Texture {
        constructor(inner) {
            this.innerTexture = inner;
        }
        get width() { return this.innerTexture.width; }
        get height() { return this.innerTexture.height; }
    }
    Egg.Texture = Texture;
})(Egg || (Egg = {}));
var Egg;
(function (Egg) {
    class UiComponent {
        constructor(args) {
            this.tag = args.tag || this.tag || 'div';
            this.children = [];
            this.element = document.createElement(this.tag);
            var html = args.html || this.html || '';
            this.element.innerHTML = Egg.fixHTML(html);
            if (args.className)
                this.element.className = args.className;
        }
        setParent(parent, parentElement) {
            this.remove();
            this.parent = parent;
            this.parent.children.push(this);
            var el;
            if (parentElement === undefined) {
                el = parent.element;
            }
            else if (typeof parentElement === 'string') {
                el = parent.find(parentElement);
            }
            else {
                el = parentElement;
            }
            el.appendChild(this.element);
        }
        addChild(child, parentElement) {
            child.setParent(this, parentElement);
            return child;
        }
        find(selector) {
            return this.element.querySelector(selector);
        }
        findAll(selector) {
            var list = [];
            var nodeList = this.element.querySelectorAll(selector);
            for (var i = 0; i < nodeList.length; i++) {
                list.push(nodeList[i]);
            }
            return list;
        }
        remove() {
            if (this.parent) {
                var i = this.parent.children.indexOf(this);
                this.parent.children.splice(i, 1);
            }
            this.element.remove();
        }
        update(dt) {
            this.children.forEach((child) => child.update(dt));
        }
    }
    Egg.UiComponent = UiComponent;
})(Egg || (Egg = {}));
var Trig;
(function (Trig) {
    function sqr(x) { return x * x; }
    Trig.sqr = sqr;
    function dist(v, w) { return Math.sqrt(dist2(v, w)); }
    Trig.dist = dist;
    function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y); }
    Trig.dist2 = dist2;
    function closestPointOnLine(p, v, w) {
        var len = dist2(v, w);
        if (len === 0)
            return v;
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / len;
        if (t < 0)
            return v;
        if (t > 1)
            return w;
        return {
            x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y)
        };
    }
    Trig.closestPointOnLine = closestPointOnLine;
    function distToSegmentSquared(p, v, w) { return dist2(p, closestPointOnLine(p, v, w)); }
    Trig.distToSegmentSquared = distToSegmentSquared;
    function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }
    Trig.distToSegment = distToSegment;
})(Trig || (Trig = {}));
var Electron = require('electron');
var Egg;
(function (Egg) {
    var enginePath;
    var paused;
    var sizeMultiplier;
    var lastTime;
    function setup(opts) {
        console.log("Creating Egg Object...", opts);
        this.config = opts;
        this.debug = !!opts.debug;
        this.gameName = opts.game;
        this.browserWindow = Electron.remote.getCurrentWindow();
        if (this.debug) {
            this.browserWindow.webContents.once('devtools-opened', () => {
                this.browserWindow.focus();
            });
            this.browserWindow.openDevTools({
                mode: 'detach'
            });
        }
        var userdataStem = process.env.APPDATA + '\\' || (process.platform == 'darwin' ? process.env.HOME + 'Library/Application Support/' : process.env.HOME + "/.");
        this.engineDir = new Egg.Directory(path.join(process.cwd(), opts.enginePath, "resources", "app"));
        this.gameDir = new Egg.Directory(path.join(process.cwd(), this.gameName));
        if (!this.config.userdata) {
            this.config.userdata = this.gameName;
            console.warn("No 'userdata' key found in config. This will be a problem when you export -- be sure to set it to something.");
        }
        this.userdataDir = new Egg.Directory(userdataStem).subdir(this.config.userdata, true);
        this.textures = {};
        this.paused = true;
    }
    Egg.setup = setup;
    function run() {
        process.chdir(this.gameDir.path);
        Egg.Input.init(this.config['controls']);
        var multX = screen.availWidth / this.config['width'], multY = screen.availHeight / this.config['height'], mult = Math.floor(Math.min(multX, multY));
        this.browserWindow.setMinimumSize(this.config['width'], this.config['height']);
        this.browserWindow.setContentSize(this.config['width'] * mult, this.config['height'] * mult);
        this.browserWindow.center();
        window.addEventListener('resize', (e) => this.onResize(e));
        if (this.debug) {
            window.addEventListener('onkeydown', (e) => {
                if (e['keyCode'] === 192) {
                    Egg.browserWindow['toggleDevTools']();
                }
            });
        }
        PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
        Egg.planes = [];
        Egg.Audio.init();
        if (Egg.config['volume']) {
            if (Egg.config['volume']['sfx'] !== undefined) {
                Egg.Audio.setSFXVolume(Egg.config['volume']['sfx']);
            }
            if (Egg.config['volume']['music'] !== undefined) {
                Egg.Audio.setMusicVolume(Egg.config['volume']['music']);
            }
        }
        var styles = [];
        _.each(this.config['css'], (path) => {
            _.each(this.gameDir.glob(path), (f) => {
                Egg.addStyleSheet(f);
            });
        });
        document['fonts'].ready
            .then(function () {
            this.Game = require(this.gameDir.file("main.js").path);
            this.Game.start();
            this.onResize();
            this.lastTime = Date.now();
            this.frame();
        }.bind(this));
    }
    Egg.run = run;
    function frame() {
        requestAnimationFrame(this.frame.bind(this));
        var dt = Date.now() - this.lastTime;
        this.lastTime += dt;
        dt /= 1000;
        Egg.Input.update(dt);
        if (this.paused) {
            return;
        }
        _.each(this.planes, function (plane) {
            plane.update(dt);
        }.bind(this));
        if (this.scene) {
            this.scene.update(dt);
        }
        if (this.Game && this.Game.frame) {
            this.Game.frame(dt);
        }
        _.each(this.planes, function (plane) {
            plane.render();
        }.bind(this));
        if (this.scene) {
            this.scene.render();
        }
        if (this.Game && this.Game.postRender) {
            this.Game.postRender(dt);
        }
    }
    Egg.frame = frame;
    function setScene(e) {
        this.scene = e;
    }
    Egg.setScene = setScene;
    function addPlane(Type, args) {
        if (!(Type.prototype instanceof Egg.Plane)) {
            throw new TypeError("Type passed to addPlane() must inherit from Plane.");
        }
        var plane = new Type(args || {});
        this.planes.push(plane);
        plane.resize(this.sizeMultiplier);
        return plane;
    }
    Egg.addPlane = addPlane;
    function pause() {
        this.paused = true;
    }
    Egg.pause = pause;
    function unpause() {
        this.paused = false;
    }
    Egg.unpause = unpause;
    function onResize(event) {
        var newSize = this.browserWindow.getContentSize(), multX = newSize[0] / this.config['width'], multY = newSize[1] / this.config['height'], mult = Math.min(multX, multY);
        if (mult > 1) {
            mult = Math.floor(mult);
        }
        this.sizeMultiplier = mult;
        _.each(this.planes, function (plane) {
            plane.resize(this.sizeMultiplier);
        }.bind(this));
        document.body.style.margin = "" + Math.floor((newSize[1] - mult * this.config['height']) / 2) + "px " + Math.floor((newSize[0] - mult * this.config['width']) / 2) + "px";
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
    }
    Egg.onResize = onResize;
    function getCurrentZoom() {
        return this.sizeMultiplier;
    }
    Egg.getCurrentZoom = getCurrentZoom;
    function setTitle(title) {
        this.browserWindow.setTitle(title);
    }
    Egg.setTitle = setTitle;
    function quit() {
        this.browserWindow.close();
    }
    Egg.quit = quit;
    function loadTextures(assets) {
        return new Promise((resolve, reject) => {
            if (assets.length < 1) {
                resolve();
            }
            _.each(assets, (file, name) => {
                PIXI.loader.add(name, file.path);
            });
            PIXI.loader.load((loader, resources) => {
                _.each(resources, (resource) => {
                    this.textures[resource['name'].replace(/\\/g, "/")] = new Egg.Texture(resource['texture']);
                });
                this.textures = _.extend(this.textures, Egg.textures);
                resolve();
            });
        });
    }
    Egg.loadTextures = loadTextures;
    function getTexture(f) {
        return Egg.textures[f.replace(/\\/g, "/")];
    }
    Egg.getTexture = getTexture;
    function addStyleSheet(file) {
        var el = document.createElement('link');
        el.rel = "stylesheet";
        el.type = "text/css";
        el.href = file.url;
        document.head.appendChild(el);
    }
    Egg.addStyleSheet = addStyleSheet;
    function captureScreenshot(width, height) {
        return new Promise((resolve, reject) => {
            this.browserWindow.capturePage((image) => {
                var opts = {
                    quality: "best"
                };
                if (width !== undefined)
                    opts['width'] = width;
                if (height !== undefined)
                    opts['height'] = height;
                resolve(image.resize(opts));
            });
        });
    }
    Egg.captureScreenshot = captureScreenshot;
    function saveImageToFile(image) {
        var filename = `${(new Date()).toISOString().replace(/[-T:Z\.]/g, "")}.png`;
        var file = Egg.userdataDir.subdir('screenshots', true).file(filename);
        file.write(image.toPng(), 'binary');
        return file;
    }
    Egg.saveImageToFile = saveImageToFile;
    function fixHTML(html) {
        var el = document.createElement('div');
        el.innerHTML = html;
        var fixElements = [].concat(Array.prototype.slice.call(el.getElementsByTagName('link')), Array.prototype.slice.call(el.getElementsByTagName('img')), Array.prototype.slice.call(el.getElementsByTagName('a')));
        _.each(fixElements, (element) => {
            _.each(['src', 'href'], (attr) => {
                if (element.getAttribute(attr)) {
                    if (element.getAttribute(attr).indexOf('data') === 0)
                        return;
                    element[attr] = this.gameDir.file(element.getAttribute(attr)).url;
                }
            });
        });
        return el.innerHTML;
    }
    Egg.fixHTML = fixHTML;
    function wrap(n, range) {
        while (n < 0)
            n += range;
        n %= range;
        return n;
    }
    Egg.wrap = wrap;
    let lastID = -1;
    function uniqueID() {
        return (++lastID).toString();
    }
    Egg.uniqueID = uniqueID;
})(Egg || (Egg = {}));
//# sourceMappingURL=Cozy.js.map