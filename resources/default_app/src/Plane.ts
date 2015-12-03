module Egg {
    export class Plane {
        container:HTMLElement;
        renderer:PIXI.WebGLRenderer;
        ui:HTMLElement;
        layers:Layer[];
        layerContainer:PIXI.Container;

        constructor(args:any) {
            this.container = document.createElement('div');
            document.body.insertBefore(this.container, args.before);

            this.container.className = "plane " + args.className;
            if (args.renderable) {
                this.renderer = new PIXI.WebGLRenderer(Egg.config['width'], Egg.config['height']);
                this.renderer.backgroundColor = args.renderBackground === undefined ? 0x888888 : args.renderBackground;
                this.container.appendChild(this.renderer.view);
            }
            this.layers = [];
            this.layerContainer = new PIXI.Container();

            this.ui = document.createElement('div');
            this.ui.className = 'ui';
            this.container.appendChild(this.ui);
        }

        addRenderLayer(index?:number):Egg.Layer {
            var lyr = new Layer();
            if (index === undefined) {
                this.layers.push(lyr);
            } else {
                this.layers.splice(index, 0, lyr);
            }
            this.layerContainer.addChild(lyr.innerContainer);
            return lyr;
        }

        update(dt):void {
            _.each(this.layers, function(layer) {
                layer.update(dt);
            }.bind(this));
        }

        render():void {
            if (this.renderer) {
                this.renderer.render(this.layerContainer);
            }
        }

        clear():void {
            this.layers = []
            this.layerContainer.removeChildren();

            while(this.ui.lastChild) {
                this.container.removeChild(this.container.lastChild);
            }
            if (this.renderer) {
                this.container.appendChild(this.renderer.view);
            }
        }
    }
}
