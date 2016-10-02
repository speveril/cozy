const UiComponent = require('../UiComponent');

class NavButtonComponent extends UiComponent {
    constructor(text, cb) {
        super({
            tag: 'button',
            className: 'nav-button',
            html: `${text}`
        });
        this.element.addEventListener('click', cb);
    }
}

class NavComponent extends UiComponent {
    constructor() {
        super({
            className: 'nav-bar',
        });

        this.addChild(new NavButtonComponent("Config", () => Editor.open('config')));
        this.addChild(new NavButtonComponent("Database", () => Editor.open('data')));
    }
}

module.exports = NavComponent;
