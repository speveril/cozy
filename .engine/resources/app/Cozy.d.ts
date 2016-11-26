/// <reference path="../../src/typescript/github-electron.d.ts" />
/// <reference path="../../src/typescript/node.d.ts" />
/// <reference path="../../src/typescript/pixi.js.d.ts" />
/// <reference path="../../src/typescript/underscore.d.ts" />
declare module Cozy {
    class Sound {
        buffer: AudioBuffer;
        source: AudioBufferSourceNode;
        loadedPromise: Promise<any>;
        constructor(fileName: string);
        loaded(): Promise<any>;
        play(): void;
    }
    class Music {
        loadedPromise: Promise<any>;
        tracks: string[];
        buffers: {
            [filename: string]: AudioBuffer;
        };
        source: AudioBufferSourceNode;
        constructor(def: any);
        loaded(): Promise<any>;
        start(): void;
        stop(): void;
    }
    class Audio {
        static context: AudioContext;
        static currentMusic: Music;
        static musicGain: GainNode;
        static sfxGain: GainNode;
        static musicVolume: number;
        static sfxVolume: number;
        static init(): void;
        static mute(): void;
        static unmute(): void;
        static setSFXVolume(v: number): void;
        static setMusicVolume(v: number): void;
    }
}
declare module Cozy {
    class Component {
        static lookup: Array<Array<Component>>;
        owner: Entity;
        constructor(args?: any);
        added(): void;
        update(dt: number): void;
        render(): void;
    }
}
declare module Cozy.Components {
}
declare module Cozy.Components {
    class Renderer extends Component {
        private HTMLcontainer;
        private renderer;
        private container;
        constructor(_args?: any);
        addLayer(layer: SpriteLayer): void;
        render(): void;
    }
}
declare module Cozy.Components {
    class Sprite extends Cozy.Component {
        s: Cozy.Sprite;
        constructor(args?: any);
        added(): void;
    }
}
declare module Cozy.Components {
    class SpriteLayer extends Cozy.Component {
        innerContainer: PIXI.Container;
        constructor(args?: any);
        added(): void;
        add(thing: any): void;
    }
}
declare module Cozy {
    class Entity {
        parent: Entity;
        children: Array<Entity>;
        components: Dict<Component>;
        constructor(parent?: Entity, components?: Array<Component>);
        addChild(child?: Entity | Array<Component>): Entity;
        removeChild(child: Entity): Entity;
        addComponent(component: Component): Component;
        hasComponent(name: string): boolean;
        has<T extends Component>(t: {
            new (): T;
        }): boolean;
        getComponent(name: string): Component;
        get<T extends Component>(t: {
            new (): T;
        }): T;
        getNearest<T extends Component>(t: {
            new (): T;
        }): T;
        update(dt: number): void;
        render(): void;
    }
}
declare var fs: any;
declare var path: any;
declare module Cozy {
    class Directory {
        root: string;
        constructor(f: string);
        path: string;
        buildList(list: Array<string>): Array<Directory | File>;
        read(): Array<Directory | File>;
        find(p: string): Directory | File;
        file(p: string): File;
        subdir(p: string, createIfDoesNotExist?: boolean): Directory;
        glob(pattern: string, opts?: any): Array<Directory | File>;
    }
    class File {
        filepath: string;
        constructor(f: string);
        extension: string;
        name: string;
        path: string;
        exists: boolean;
        url: string;
        stat(): any;
        relativePath(dir: Directory): string;
        read(format?: string): any;
        readAsync(format?: string): Promise<any>;
        write(data: any, format?: string): any;
    }
}
declare module Cozy {
    class Input {
        static deadzone: number;
        private static buttonMap;
        private static button;
        private static axes;
        private static buttonTimeouts;
        private static callbacks;
        private static devices;
        private static controlConfig;
        static init(controls?: {
            [name: string]: any;
        }): void;
        static update(dt: any): void;
        static on(eventName: any, cb: any, ctx: any): void;
        static off(eventName: any, cb: any, ctx: any): void;
        private static addKeyboard();
        private static addGamepad(index);
        private static triggerCallbacks(eventName, eventInfo);
        static pressed(name: any): Boolean;
        static axis(name: any): number;
        static debounce(names: string, duration?: number): void;
    }
}
declare module Cozy {
    class Layer {
        innerContainer: PIXI.Container;
        sprites: Array<Cozy.Sprite>;
        constructor();
        update(dt: number): void;
        offset(x: number, y: number): void;
        getOffset(): PIXI.Point;
        add(thing: any): void;
        remove(sp: Sprite): void;
        sortSprites(f: (a: any, b: any) => number): void;
        clear(): void;
    }
}
declare module Cozy {
    class Map {
    }
}
declare module Cozy {
    class Plane {
        container: HTMLElement;
        constructor(args: any);
        show(): void;
        hide(): void;
        bringToFront(): void;
        update(dt: any): void;
        render(): void;
        clear(): void;
        resize(mult: any): void;
    }
    class RenderPlane extends Plane {
        renderer: PIXI.WebGLRenderer;
        layers: Layer[];
        layerContainer: PIXI.Container;
        constructor(args: any);
        render(): void;
        update(dt: any): void;
        setBackground(color: any): void;
        addRenderLayer(index?: number): Cozy.Layer;
        clear(): void;
        resize(mult: any): void;
    }
    class UiPlane extends Plane {
        private root;
        constructor(args: any);
        update(dt: any): void;
        addHTML(file: any): HTMLDivElement;
        addChild(child: UiComponent): void;
        clear(): void;
        resize(mult: any): void;
    }
}
declare module Cozy {
    class Sprite {
        texture: PIXI.Texture;
        textureFrame: PIXI.Rectangle;
        clip: PIXI.Rectangle;
        innerSprite: PIXI.Sprite;
        hotspot: PIXI.Point;
        position: PIXI.Point;
        frameBank: PIXI.Rectangle;
        frameSize: PIXI.Point;
        frameCounts: PIXI.Point;
        layer: Cozy.Layer;
        frame_: number;
        animations: {};
        currentAnimation: {};
        animationScratch: {};
        frameRate: number;
        currentQuake: {};
        constructor(args: any);
        frame: number;
        animation: string;
        setClip(x: number, y: number, w: number, h: number): void;
        private updateTextureFrame();
        quake(t: number, range: any, decay?: any): void;
        update(dt: any): void;
        setPosition(x: number, y: number): void;
        adjustPosition(x: number, y: number): void;
        overlaps(sp: Sprite): Boolean;
        private positionInnerSprite();
    }
}
declare module Cozy {
    class Texture {
        innerTexture: PIXI.Texture;
        constructor(inner: any);
        width: number;
        height: number;
    }
}
declare module Cozy {
    class UiComponent {
        element: HTMLElement;
        protected parent: UiComponent;
        protected children: UiComponent[];
        protected tag: string;
        protected html: string;
        constructor(args: any);
        setParent(parent: UiComponent, parentElement?: HTMLElement | string): void;
        addChild(child: UiComponent, parentElement?: HTMLElement | string): UiComponent;
        find(selector: string): HTMLElement;
        findAll(selector: string): HTMLElement[];
        remove(): void;
        update(dt: Number): void;
    }
}
declare module Trig {
    function sqr(x: any): number;
    function dist(v: any, w: any): number;
    function dist2(v: any, w: any): number;
    function closestPointOnLine(p: any, v: any, w: any): any;
    function distToSegmentSquared(p: any, v: any, w: any): number;
    function distToSegment(p: any, v: any, w: any): number;
}
declare var Electron: any;
declare var FontFace: any;
declare type Dict<T> = {
    [key: string]: T;
};
declare module Cozy {
    var Game: any;
    var debug: boolean;
    var config: Object;
    var textures: {}[];
    var planes: Plane[];
    var browserWindow: GitHubElectron.BrowserWindow;
    var scene: Entity;
    var gameName: string;
    var engineDir: Cozy.Directory;
    var gameDir: Cozy.Directory;
    var userdataDir: Cozy.Directory;
    function setup(opts: any): void;
    function run(): void;
    function frame(): void;
    function setScene(e: Entity): void;
    function addPlane(Type: any, args?: any): Plane;
    function pause(): void;
    function unpause(): void;
    function onResize(event?: any): void;
    function getCurrentZoom(): any;
    function setTitle(title: any): void;
    function quit(): void;
    function loadTextures(assets: any): Promise<{}>;
    function getTexture(f: any): {};
    function addStyleSheet(file: File): void;
    function captureScreenshot(width?: number, height?: number): Promise<any>;
    function saveImageToFile(image: any): File;
    function fixHTML(html: string): string;
    function wrap(n: number, range: number): number;
    function uniqueID(): string;
}
