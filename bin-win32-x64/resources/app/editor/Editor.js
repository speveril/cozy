'use strict';

const fs = require('fs-extra');
const UiComponent = require('./UiComponent');
const components = require('./components');

var modeTable = {
    config:         components.ConfigPanel,
    data:           components.DataPanel
}

class Editor {
    static go(args) {
        window.Editor = this;

        this.enginePath = args.enginePath;
        this.gamePath = args.gamePath;
        this.gameConfig = args.config;

        this.setTitle();

        this.root = new UiComponent({ className: 'root' });
        this.root.setParent(null, document.body);
        this.root.addChild(new components.NavComponent());

        this.current = '';
        this.panelContainer = this.root.addChild(new components.PanelContainerComponent());
    }

    static open(key) {
        if (this.current === key) return;

        if (this.current) {
            // TODO give panel a chance to prevent (to save, etc)
            this.panelContainer.empty();
        }

        this.current = key;
        this.pushPanel(new modeTable[key]());
    }

    static pushPanel(p) {
        this.panelContainer.addChild(p);
    }

    static popPanel() {
        this.panelContainer.children[this.panelContainer.children.length - 1].remove();
    }

    static setTitle(extra) {
        document.title = `Cozy Editor - ${this.gameConfig.title || 'untitled'}${extra ? ' - ' + extra : ''}`;
    }
}

module.exports = Editor;
