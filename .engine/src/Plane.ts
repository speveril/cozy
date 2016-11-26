module Cozy {
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
        render():void {}
        clear():void {}
        resize(mult):void {}
    }

    export class RenderPlane extends Plane {
        renderer:PIXI.WebGLRenderer;
        layers:Layer[];
        layerContainer:PIXI.Container;

        constructor(args:any) {
            super(args);
            this.renderer = new PIXI.WebGLRenderer(Cozy.config['width'], Cozy.config['height'], { transparent: true });
            this.renderer.backgroundColor = args.renderBackground === undefined ? 'rgba(0, 0, 0, 0)' : args.renderBackground;
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
            _.each(this.layers, function(layer) {
                layer.update(dt);
            }.bind(this));
        }

        setBackground(color) {
            this.renderer.backgroundColor = color;
        }

        addRenderLayer(index?:number):Cozy.Layer {
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

        resize(mult):void {
            this.renderer.resolution = mult;
            this.renderer.resize(Cozy.config['width'], Cozy.config['height']);
        }
    }

    export class UiPlane extends Plane {
        private root: UiComponent;

        constructor(args:any) {
            super(args);
            this.container.className += ' ui';

            this.root = new UiComponent({});
            this.container.appendChild(this.root.element);
        }

        update(dt):void {
            this.root.update(dt);
        }

        addHTML(file) {
            var container = document.createElement('div');
            container.innerHTML = Cozy.gameDir.find(file).read();
            this.container.appendChild(container);
            return container;
        }

        addChild(child:UiComponent) {
            this.root.addChild(child);
        }

        clear():void {
            while(this.container.lastChild) {
                this.container.removeChild(this.container.lastChild);
            }
        }

        resize(mult):void {
            this.container.style.transform = "scale(" + mult + ")";
            this.container.style.width = Cozy.config['width'];
            this.container.style.height = Cozy.config['height'];
        }
    }
}
