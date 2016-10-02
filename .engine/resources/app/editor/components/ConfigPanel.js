const PanelComponent = require('./PanelComponent');

class ConfigPanel extends PanelComponent {
    constructor () {
        super({
            className: 'config-panel',
            html: ``
        });
    }
}

module.exports = ConfigPanel;
