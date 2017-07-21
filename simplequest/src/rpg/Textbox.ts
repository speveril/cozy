module RPG {
    export class Textbox extends Cozy.UiComponent {
        public static box:Textbox;

        static show(text:string) {
            if (this.box) {
                this.hide();
            }

            this.box = new Textbox();
            this.box.setText(text);
            RPG.uiPlane.addChild(this.box);
        }

        static hide() {
            if (this.box) {
                this.box.remove();
            }
        }


        public skipWhitespace:boolean = true;

        private paused:Boolean = false;
        private inner:HTMLElement;
        private innerDisplay:HTMLElement;
        private textSpeed = 100;
        private textPos = 0;
        private cursors:Array<HTMLElement>;

        constructor(args?:any) {
            super(_.extend(args || {}, {
                className: 'textbox',
                html: `
                    <div class="inner-text"></div>
                `
            }));
            // this.inner = <HTMLElement>(document.createElement('div'));
            this.inner = this.find('.inner-text');
            this.cursors = [];
        }

        setText(text:string) {
            this.inner.innerHTML = '';
            this.appendText(text);
            this.inner.scrollTop = -2;
        }

        appendText(text:string) {
            var newElement = <HTMLElement>(document.createElement('div'));
            var children = [], ch, charspan;

            newElement.innerHTML = text;
            children.push.apply(children, newElement.childNodes);

            while (children.length > 0) {
                ch = children.shift();
                if (ch.nodeName === '#text') {
                    _.each(ch.nodeValue.split(''), (c:string) => {
                        charspan = document.createElement('span');
                        charspan.innerText = c;
                        charspan.classList.add(c.match(/\S/) ? '__ch' : '__ws');
                        ch.parentNode.insertBefore(charspan, ch);
                    })
                    ch.remove();
                } else if (ch.nodeName.toLowerCase() === 'img' || ch.nodeName.toLowerCase() === 'span') {
                    ch.classList.add('__ch');
                } else {
                    children.push.apply(children, ch.childNodes);
                }
            }

            if (this.cursors.length < 1) {
                this.pushCursor(newElement);
            }

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

            let cursor;
            while (charsToAdvance > 0) {
                cursor = this.topCursor();
                if (cursor.classList.contains('__ch')) {
                    // console.log('>>', cursor.innerText, '('+charsToAdvance+')')
                    cursor.classList.remove('__ch');
                    charsToAdvance--;
                    cursor = this.advanceCursor();
                } else if (cursor.classList.contains('__ws')) {
                    // console.log('>>', cursor.innerText, '('+charsToAdvance+')')
                    cursor.classList.remove('__ws');
                    if (!this.skipWhitespace) charsToAdvance--;
                    cursor = this.advanceCursor();
                } else if (cursor.hasChildNodes()) {
                    // console.log('-->', cursor);
                    cursor = this.pushCursor(cursor);
                }

                if (!cursor) {
                    this.paused = true;
                    break;
                }
            }

            if (!cursor) {
                cursor = this.inner.childNodes[this.inner.childNodes.length - 1];
            }
            for (var i = this.cursors.length; i >= 0; i--) {
                if (cursor.previousSibling) {
                    (<HTMLElement>cursor.previousSibling).scrollIntoView(false);
                    break;
                }
            }
            this.inner.scrollTop += 1;
            if (this.inner.scrollTop === 1) this.inner.scrollTop = -2; // sigh.
        }

        private pushCursor(parent) {
            // var cursor = document.createElement('span');
            let cursor = parent.childNodes[0];
            // cursor.classList.add('cursor');
            this.cursors.push(cursor);
            return cursor;
        }

        private advanceCursor() {
            let c = this.cursors[this.cursors.length - 1];
            c = <HTMLElement>c.nextSibling;
            while (!c) {
                c = this.popCursor();
                if (c) c = <HTMLElement>c.nextSibling;
                if (!c) break;
            }
            this.cursors[this.cursors.length - 1] = c;
            return c;
        }

        private topCursor() {
            return this.cursors[this.cursors.length - 1];
        }

        private popCursor() {
            // this.cursors.pop().remove();
            this.cursors.pop();
            return this.topCursor();
        }
    }
}
