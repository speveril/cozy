module VN {
    export class Page extends Cozy.UiComponent {
        actions:{[key:string]:Function} = {};

        constructor(args?:any) {
            super({
                className: 'page',
                html: `
                    <div class="content"></div>
                    <div class="overlay"></div>
                `
            });

            this.find('.content').addEventListener('click', (e) => this.onClick(e));
        }

        setContent(def) {
            var content = this.find('.content');
            content.innerHTML = '';

            this.actions = def.actions;

            content.style.backgroundImage = `url(${Cozy.gameDir.file('gfx/'+ def.bg).url})`;
            _.each(def.text, (block) => {
                var div = document.createElement('div');
                div.className = 'text-block';
                div.style.left = block['x'] + 'px';
                div.style.top = block['y'] + 'px';
                div.style.width = block['w'] + 'px';

                div.innerHTML = block['text'];

                content.appendChild(div);
            });
        }

        onClick(e) {
            var target = e.target;
            if (target.tagName === 'LI') {
                var action = this.actions[target.getAttribute('data-action')];
                action(VN);
            }
        }
    }
}
