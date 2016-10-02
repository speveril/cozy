const UiComponent = require('../UiComponent');

class PanelComponent extends UiComponent {
    constructor(args) {
        super({
            className: 'panel ' + (args.className || ''),
            html: args.html
        });
    }
}

module.exports = PanelComponent;
