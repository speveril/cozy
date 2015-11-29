module RPG {
    export class Textbox {
        private static sprite:Egg.Sprite;
        private static message:string;

        private static box:HTMLElement;

        static show(text:string) {
            if (this.box) {
                this.hide();
            }

            // TODO clean this mess up, allow games to import style sheets?
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
        }

        static hide() {
            if (this.box) {
                this.box.remove();
            }
        }
    }
}
