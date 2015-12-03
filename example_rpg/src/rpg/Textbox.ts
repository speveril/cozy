module RPG {
    export class Textbox {
        private static sprite:Egg.Sprite;
        private static message:string;

        private static box:HTMLElement;

        static show(text:string) {
            if (this.box) {
                this.hide();
            }

            // TODO allow games to import style sheets?
            this.box = document.createElement('div');
            this.box.className = "textbox";
            this.box.innerHTML = text;

            Egg.overlay.ui.appendChild(this.box);
        }

        static hide() {
            if (this.box) {
                this.box.remove();
            }
        }
    }
}
