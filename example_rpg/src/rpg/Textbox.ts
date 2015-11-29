module RPG {
    export class Textbox {
        private static sprite:Egg.Sprite;
        private static message:string;
        // private static text:PIXI.Text;
        // public static style:any = {
        //     font: 'normal 10px PressStart',
        //     fill: "#ffffff",
        //     stroke: "#000000",
        //     strokeThickness: 1,
        //     align: "left",
        //     wordWrap: false,
        //     wordWrapWidth: 320,
        //     dropShadow: true,
        //     dropShadowColor: "#000000",
        //     dropShadowAngle: Math.PI / 4,
        //     dropShadowDistance: 1
        // };

        private static box:HTMLElement;

        static show(text:string) {
            if (this.box) {
                this.hide();
            }

            this.box = document.createElement('div');
            this.box.innerHTML = text;
            this.box.style.position = "absolute";
            this.box.style.bottom = "0px";
            this.box.style.left = "0px";
            this.box.style.fontFamily = "PressStart";
            this.box.style.fontSize = "8px";
            this.box.style.lineHeight = "180%";
            this.box.style.width = "320px";
            this.box.style.height = "50px";
            this.box.style.boxSizing = "border-box";
            this.box.style.backgroundImage = "url(../../example_rpg/sprites/textbox.png)";
            this.box.style.color = "white";
            this.box.style.textShadow = "1px 1px 0px rgba(0, 0, 0, 1)";
            this.box.style.padding = "5px";
            this.box.style.whiteSpace = "pre-wrap";


            Egg.overlay.appendChild(this.box);

            // if (this.sprite || this.text) {
            //     this.hide();
            // }
            //
            // this.message = text;
            // this.sprite = new Egg.Sprite({
            //     texture: 'sprites/textbox.png',
            //     position: { x:0, y:190 }
            // })
            // RPG.UILayer.add(this.sprite);
            //
            // // TODO clean up, move into Egg
            // this.text = new PIXI.Text(this.message, this.style);
            // this.text.position.x = 7;
            // this.text.position.y = 195;
            //
            // RPG.UILayer.innerContainer.addChild(this.text);
        }

        static hide() {
            this.box.remove();

            // RPG.UILayer.remove(this.sprite);
            // RPG.UILayer.innerContainer.removeChild(this.text);
            //
            // this.sprite = null;
            // this.text = null;
        }
    }
}
