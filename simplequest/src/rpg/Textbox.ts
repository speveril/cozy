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
        private textCursor:HTMLElement;
        private cursorPosition:HTMLElement;
        private textSize:Number;
        private boxHeight:Number;
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
            this.textSize = parseInt(window.getComputedStyle(this.inner).fontSize, 10);
            this.boxHeight = this.inner.clientHeight;
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

            var cursor = this.cursors[this.cursors.length - 1];

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

/*
var textbox, inner, cursors, accum, paused = true, breakpoint;

function doScrolling(str) {
  paused = true;
  textbox = $('.textbox')[0];
    textbox.innerHTML = '';
  cursors = [];
  inner = document.createElement('div');
    inner.classList.add('inner');
    inner.innerHTML = str;

  var children = [],
      ch, charspan;
  children.push.apply(children, inner.childNodes);

  while (children.length > 0) {
    ch = children.shift();
    if (ch.nodeName === '#text') {
      _.each(ch.nodeValue.split(''), (c) => {
        charspan = document.createElement('span');
          charspan.classList.add('__ch');
          charspan.innerText = c;
        ch.parentNode.insertBefore(charspan, ch);
      })
      ch.remove();
    } else if (ch.nodeName.toLowerCase() === 'img') {
      ch.classList.add('__ch');
    } else {
      children.push.apply(children, ch.childNodes);
    }
  }

  cursors.push(makeCursor());
  inner.insertBefore(cursors[0], inner.childNodes[0]);

  textbox.appendChild(inner);
  accum = 0;
  breakpoint = inner.scrollTop + inner.clientHeight;
  paused = false;
}

function makeCursor() {
  var cursor = document.createElement('span');
  cursor.classList.add('cursor');
  return cursor;
}

function advance(dt) {
  // console.log('advance(' + dt + ')');
  if (paused || !cursors || cursors.length < 1) return;

  var last = Math.floor(accum);
  accum += (dt / 100);
  var adv = Math.floor(accum - last);

  var c = cursors[cursors.length - 1],
      s;

  while (adv > 0 && cursors.length > 0) {
    s = c.nextSibling;

    if (s === null) {
      c.remove();
      cursors.pop();
      c = cursors[cursors.length - 1];
    } else {
      s.nextSibling ? s.parentNode.insertBefore(c, s.nextSibling) : s.parentNode.appendChild(c);
      if (s.classList.contains('__ch')) {
        if (s.innerText !== ' ')
          adv--;
      } else if (s.hasChildNodes()) {
        cursors.push(makeCursor())
        c = cursors[cursors.length - 1];
        if (!c) break;
        s.insertBefore(c, s.childNodes[0]);
      }
    }

    if (c) {
      if (c.offsetTop - inner.offsetTop > breakpoint) {
        paused = true;
        breakpoint += inner.clientHeight;
      } else {
        c.scrollIntoView(false);
      }
    }
  }
}

(function() {
  var lt = window.performance.now();
  var dt;

  var loop = (t) => {
    dt = t - lt;
    lt = t;

    advance(dt);
    window.requestAnimationFrame(loop);
  };

  window.requestAnimationFrame(loop);
})();

$('button.go').on('click', () => {
  if (paused && cursors && cursors.length > 0) {
    paused = false;
  } else {
    doScrolling(`<span class="speaker">Shamus:</span> This is some text. <span class="item"><img src="http://bismuth.kildorf.com/junk/FFIII_Icon_Item.png"> Longer Item!</span> Hopefully I can make it \"scroll\" properly. <strong>SO LET'S MAKE THIS WORK</strong>
<strong>There</strong> are some <strong><em>interesting</em> tags</strong> inside. But there are also too many lines.`);
  }
});
$('button.stop').on('click', () => {
  _.each(cursors, (c) => {
    cursors.pop();
  })
});
*/
