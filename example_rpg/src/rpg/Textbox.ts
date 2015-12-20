module RPG {
    export class Textbox {
        private static sprite:Egg.Sprite;
        private static message:string;

        private static box:HTMLElement;

        static show(text:string) {
            if (this.box) {
                this.hide();
            }

            this.box = document.createElement('div');
            this.box.className = "textbox";
            this.setText(text);

            RPG.uiPlane.ui.appendChild(this.box);
        }

        static setText(text:string) {
            if (this.box) {
                this.box.innerHTML = text;
            }
        }

        static hide() {
            if (this.box) {
                this.box.remove();
            }
        }
    }
}
