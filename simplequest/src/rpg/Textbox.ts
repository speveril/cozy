module RPG {
    export class Textbox extends Egg.UiComponent {
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
        private textSpeed = 100;
        private textPos = 0;
        private cursors:Array<HTMLElement>;

        constructor(args?:any) {
            super(_.extend(args || {}, {
                html: `
                    <div class="textbox">
                        <div class="inner-text"></div>
                    </div>
                `
            }));
            this.inner = this.find('.inner-text');
            this.cursors = [];
        }

        setParent(parent:Egg.UiComponent, parentElement?:HTMLElement|string):void {
            super.setParent(parent, parentElement);
        }

        setText(text:string) {
            this.inner.innerHTML = '';
            this.appendText(text);
            this.inner.scrollTop = -2;
        }

        appendText(text:string) {
            if (this.cursors.length < 1) {
                this.inner.appendChild(this.pushCursor());
            }

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
                } else if (ch.nodeName.toLowerCase() === 'img') {
                    ch.classList.add('__ch');
                } else {
                    children.push.apply(children, ch.childNodes);
                }
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

            var cursor = this.topCursor();

            while (charsToAdvance > 0) {
                var sibl = <HTMLElement>cursor.nextSibling;

                if (sibl === null) {
                    cursor = this.popCursor();
                } else {
                    sibl.nextSibling ? sibl.parentNode.insertBefore(cursor, sibl.nextSibling) : sibl.parentNode.appendChild(cursor);
                    if (sibl.classList.contains('__ch')) {
                        charsToAdvance--;
                    } else if (sibl.classList.contains('__ws')) {
                        if (!this.skipWhitespace) charsToAdvance--;
                    } else if (sibl.hasChildNodes()) {
                        cursor = this.pushCursor();
                        sibl.insertBefore(cursor, sibl.childNodes[0]);
                    }
                }

                if (cursor) {
                    for (var i = this.cursors.length; i >= 0; i--) {
                        if (cursor.previousSibling) {
                            (<HTMLElement>cursor.previousSibling).scrollIntoView(false);
                            break;
                        }
                    }
                    this.inner.scrollTop += 1;
                    if (this.inner.scrollTop === 1) this.inner.scrollTop = -2; // sigh.
                } else {
                    this.paused = true;
                    break;
                }
            }
        }

        private pushCursor() {
            var cursor = document.createElement('span');
            cursor.classList.add('cursor');
            this.cursors.push(cursor);
            return cursor;
        }

        private topCursor() {
            return this.cursors[this.cursors.length - 1];
        }

        private popCursor() {
            this.cursors.pop().remove();
            return this.topCursor();
        }
    }
}
