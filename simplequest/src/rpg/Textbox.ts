module RPG {
    export class Textbox {
        private static sprite:Egg.Sprite;
        private static message:string;

        private static box:HTMLElement;

        private static inner;
        private static textSpeed = 100;
        private static textPos = 0;
        private static textPaused = false;
        private static textStart;
        private static textCursor;
        private static cursorPosition;
        private static textSize;
        private static boxHeight;

        static show(text:string) {
            if (this.box) {
                this.hide();
            }


            this.box = document.createElement('div');
            this.box.className = "textbox";
            this.inner = document.createElement('div');
            this.inner.className = "inner-text";
            this.box.appendChild(this.inner);
            this.textCursor = document.createElement('span');
            this.textCursor.className = 'cursor';
            this.cursorPosition = document.createElement('span');
            this.cursorPosition.className = 'position';
            this.cursorPosition.innerHTML = '&nbsp;';
            this.textCursor.appendChild(this.cursorPosition);
            var cursorSpacer = document.createElement('span');
            cursorSpacer.className = 'spacer';
            this.textCursor.appendChild(cursorSpacer);

            this.setText(text);

            this.textPaused = false;

            RPG.uiPlane.ui.appendChild(this.box);
            this.textSize = parseInt(window.getComputedStyle(this.inner).fontSize, 10);
            this.boxHeight = this.inner.clientHeight;
        }

        static setText(text:string) {
            if (this.box && this.inner) {
                this.inner.innerHTML = text;
                this.inner.insertBefore(this.textCursor, this.inner.firstChild);
            }
        }

        static appendText(text:string) {
            if (this.box && this.inner) {
                var newElement = <HTMLElement>(document.createElement('div'));
                newElement.innerHTML = text;
                while (newElement.firstChild) {
                    this.inner.appendChild(newElement.firstChild);
                }
                this.textPaused = false;
            }
        }

        static hide() {
            if (this.box) {
                this.box.remove();
            }
        }

        static update(dt) {
            if (!this.box) return;
            if (this.textPaused) return;

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
                        this.textPaused = true;
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
