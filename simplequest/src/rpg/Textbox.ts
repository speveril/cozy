module RPG {
    export class Textbox extends Egg.UiComponent {
        public static box:Textbox;

        static show(text:string) {
            if (this.box) {
                this.hide();
            }

            this.box = new Textbox({
                text: text
            });
            RPG.uiPlane.addChild(this.box);
        }

        static hide() {
            if (this.box) {
                this.box.remove();
            }
        }


        private paused:Boolean = false;
        private inner:HTMLElement;
        private textCursor:HTMLElement;
        private cursorPosition:HTMLElement;
        private textSize:Number;
        private boxHeight:Number;
        private textSpeed = 100;
        private textPos = 0;

        constructor(args:any) {
            super(args);
            this.element.innerHTML = `
                <div class="textbox">
                    <div class="inner-text"></div>
                </div>
                <span class="cursor"><span class="position">&nbsp;</span><span class="spacer"></span></span>
            `;

            this.inner = this.find('.inner-text');
            this.textCursor = this.find('.cursor');
            this.cursorPosition = this.find('.cursor .position');

            this.textCursor.remove();
            this.setText(args.text);
        }

        setParent(parent:Egg.UiComponent, parentElement?:HTMLElement|string):void {
            super.setParent(parent, parentElement);
            this.textSize = parseInt(window.getComputedStyle(this.inner).fontSize, 10);
            this.boxHeight = this.inner.clientHeight;
        }

        setText(text:string) {
            this.inner.innerHTML = text;
            this.inner.insertBefore(this.textCursor, this.inner.firstChild);
        }

        appendText(text:string) {
            var newElement = <HTMLElement>(document.createElement('div'));
            newElement.innerHTML = text;
            while (newElement.firstChild) {
                this.inner.appendChild(newElement.firstChild);
            }
            this.paused = false;
        }

        update(dt) {
            if (this.paused) return;

            var currentPos = this.textPos;
            this.textPos += dt * this.textSpeed;
            var charsToAdvance = (this.textPos | 0) - (currentPos | 0);
            var i = 0;
            while (i < charsToAdvance) {
                if (!this.textCursor.parentNode) {
                    return;
                }
                var nextSibling = this.textCursor.nextSibling;
                if (nextSibling === null) {
                    var parent = this.textCursor.parentNode;
                    var sibling = null;
                    while (sibling === null && parent !== this.inner.parentNode) {
                        sibling = parent.nextSibling;
                        parent = parent.parentNode;
                    }

                    if (parent === this.inner.parentNode) {
                        this.paused = true;
                        break;
                    } else {
                        parent.insertBefore(this.textCursor, sibling);
                    }
                } else if (nextSibling.nodeName === '#text') {
                    if (this.textCursor.previousSibling === null || this.textCursor.previousSibling.nodeName !== '#text') {
                        this.textCursor.parentNode.insertBefore(document.createTextNode(""), this.textCursor);
                    }
                    this.textCursor.previousSibling.nodeValue += nextSibling.nodeValue[0];
                    nextSibling.nodeValue = nextSibling.nodeValue.slice(1);
                    if (nextSibling.nodeValue === '') {
                        nextSibling.parentNode.removeChild(nextSibling);
                    }
                    i++;
                } else {
                    nextSibling.insertBefore(this.textCursor, nextSibling.firstChild);
                }
                this.cursorPosition.scrollIntoView(false);
                this.inner.scrollTop += 1;
            }
        }
    }
}
