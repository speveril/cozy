import * as Engine from './Engine';
import { Layer } from './Layer';
import { Sprite } from './Sprite';
import { UiComponent } from './UiComponent';

export class Plane {
    container:HTMLElement;

    constructor(args:any) {
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

    update(dt):void {}
    render(dt):void {}
    clear():void {}
    resize(w, h, mult):void {}
}

export class RenderPlane extends Plane {
    renderer:PIXI.WebGLRenderer;
    layers:Layer[];
    layerContainer:PIXI.Container;

    constructor(args:any) {
        super(args);
        this.renderer = new PIXI.WebGLRenderer({
            width: Engine.config['width'],
            height: Engine.config['height'],
            transparent: true,
            clearBeforeRender: true,
        });
        this.container.appendChild(this.renderer.view);
        this.layers = [];
        this.layerContainer = new PIXI.Container();
    }

    render():void {
        if (this.renderer) {
            this.renderer.render(this.layerContainer);
        }
    }

    update(dt):void {
        for (let layer of this.layers) layer.update(dt);
    }

    addRenderLayer(index?:number):Layer {
        var lyr = new Layer();
        if (index === undefined) {
            this.layers.push(lyr);
        } else {
            this.layers.splice(index, 0, lyr);
        }
        this.layerContainer.addChild(lyr.innerContainer);
        return lyr;
    }

    clear():void {
        this.layers = []
        this.layerContainer.removeChildren();
    }

    resize(w, h, mult):void {
        // this.renderer.resolution = mult;
        this.renderer.resize(w, h);
        this.renderer.view.style.transform = 'scale(' + mult + ')';
    }
}

export class UiPlane extends Plane {
    private root: UiComponent;

    constructor(args:any) {
        super(args);
        this.container.classList.add('ui');
        this.clear();
    }

    update(dt):void {
        this.root.update(dt);
    }

    addHTML(file) {
        var container = document.createElement('div');
        this.container.appendChild(container);
        var f = Engine.gameDir().file(file);
        container.innerHTML = f.getData('text');
        return container;
    }

    addChild(child:UiComponent) {
        this.root.addChild(child);
    }

    clear():void {
        if (this.root) {
            this.root.remove();
        }
        while (this.container.lastChild) {
            this.container.removeChild(this.container.lastChild);
        }
        this.root = new UiComponent({});
        this.container.appendChild(this.root.element);
    }

    resize(w, h, mult):void {
        this.container.style.transform = "scale(" + mult + ")";
        this.container.style.width = w;
        this.container.style.height = h;
    }
}
