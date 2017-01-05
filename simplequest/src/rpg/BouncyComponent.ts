module RPG {
    export class BouncyComponent extends Cozy.UiComponent {
        constructor() {
            super({
                className: 'bouncy',
                html: ''
            });
        }

        show(s:string):void {
            _.each(s, (ch, i) => {
                let digit = document.createElement('span');
                digit.className = 'digit';
                digit.innerText = ch;
                this.element.appendChild(digit);

                window.setTimeout(() => {
                    digit.classList.add('bouncing');
                }, i * 30);
                window.setTimeout(() => {
                    digit.classList.remove('bouncing');
                    this.element.removeChild(digit);
                }, i * 30 + 1500);
            });
        }

    }
}
