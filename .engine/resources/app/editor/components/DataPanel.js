const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const UiComponent = require('../UiComponent');
const PanelComponent = require('./PanelComponent');
const DataEditPanel = require('./DataEditPanel');

class FileComponent extends UiComponent {
    constructor(f) {
        super({
            className: 'selection-list-item',
            html: f
        });
        this.element.setAttribute('data-file', f);
    }
}

class DataPanel extends PanelComponent {
    constructor () {
        super({
            className: 'data-panel',
            html: `
                <div class="sidebar">
                    <button class="new">New</button>
                </div>
                <div class="file-list selection-list"></div>
            `
        });

        this.fileList = this.find('.file-list');
        this.fileList.addEventListener('click', (evt) => this.clickFiles(evt));

        _.each(glob.sync(`${Editor.gamePath}/**/*.json`), (f) => {
            if (f === `${Editor.gamePath}/config.json`) return;
            this.addFile(f.replace(Editor.gamePath + "/", ''), true);
        });
        this.sortFiles();
    }

    addFile(f, nosort) {
        this.addChild(new FileComponent(f), this.fileList);
        if (!nosort) this.sortFiles();
    }

    sortFiles() {
        var p = this.fileList.parentElement;
        var r = document.createElement('div');

        p.replaceChild(r, this.fileList);
        var nodes = _.toArray(this.fileList.childNodes);
        nodes.sort((a,b) => a.getAttribute('data-file').localeCompare(b.getAttribute('data-file')));
        nodes.forEach((n) => this.fileList.appendChild(n));

        p.replaceChild(this.fileList, r);
    }

    clickFiles(evt) {
        var clicked = evt.toElement;
        if (clicked === this.fileList) return;

        Editor.pushPanel(new DataEditPanel(clicked.getAttribute('data-file')));
    }
}

module.exports = DataPanel;
