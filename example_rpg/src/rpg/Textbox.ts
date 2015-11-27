module RPG {
    export class Textbox {
        private static sprite:Egg.Sprite;
        private static text:PIXI.Text;
        private static message:string;
        public static style:Object = {
            font: "normal 9pt Calibri",
            fill: "#ffffff",
            // stroke: "#444444",
            align: "left",
            wordWrap: false,
            wordWrapWidth: 320,
            dropShadow: true,
            dropShadowColor: "#000000",
            dropShadowAngle: Math.PI / 4,
            dropShadowDistance: 1
        };

        static show(text:string) {
            if (this.sprite || this.text) {
                this.hide();
            }

            this.message = text;
            this.sprite = new Egg.Sprite({
                texture: 'sprites/textbox.png',
                position: { x:0, y:190 }
            })
            RPG.UILayer.add(this.sprite);

            // TODO clean up, move into Egg
            this.text = new PIXI.Text(this.message, this.style);
            this.text.position.x = 10;
            this.text.position.y = 195;
            RPG.UILayer.innerContainer.addChild(this.text);
        }

        static hide() {
            RPG.UILayer.remove(this.sprite);
            RPG.UILayer.innerContainer.removeChild(this.text);

            this.sprite = null;
            this.text = null;
        }
    }
}
