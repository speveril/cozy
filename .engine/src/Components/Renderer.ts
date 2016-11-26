module Cozy.Components {
    export class Renderer extends Component {
        private HTMLcontainer;
        private renderer:PIXI.WebGLRenderer;
        private container:PIXI.Container;

        constructor(_args?:any) {
            super(_args);

            var args = _args || {};

            this.renderer = new PIXI.WebGLRenderer(Cozy.config['width'], Cozy.config['height'], { transparent: true });
            this.renderer.backgroundColor = args.renderBackground === undefined ? 'rgba(0, 0, 0, 0)' : args.renderBackground;

            this.container = new PIXI.Container();

            this.HTMLcontainer = document.createElement('div');
            this.HTMLcontainer.className = `renderer ${args.className || ''}`;
            this.HTMLcontainer.appendChild(this.renderer.view);
            document.body.insertBefore(this.HTMLcontainer, args.before);
        }

        addLayer(layer:SpriteLayer):void {
            this.container.addChild(layer.innerContainer);
        }

        render():void {
            this.renderer.render(this.container);
        }
    }
}
