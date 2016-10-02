const fs = require('fs-extra');
const path = require('path');
const UiComponent = require('../UiComponent');
const PanelComponent = require('./PanelComponent');

class TableComponent extends UiComponent {
    constructor(name) {
        super({
            tag: 'button',
            className: 'table-entry',
            html: name
        });
        this.element.setAttribute('data-table', name);
    }
}

class ObjectComponent extends UiComponent {
    constructor(index, id) {
        super({
            className: 'object-entry selection-list-item',
            html: `<span class="object-index">${index}:</span> ${id}`
        });
        this.element.setAttribute('data-object', id);
    }
}


class DataEditPanel extends PanelComponent {
    constructor (f) {
        super({
            className: 'data-edit-panel',
            html: `
                <div class="tabbar">
                    <div class="filename">${f}</div>
                    <div class="table-list"></div>
                </div>
                <div class="panel-body">
                    <div class="sidebar">
                        <div class="object-list selection-list"></div>
                        <button class="schema">Edit Types</button>
                        <button class="save">Save</button>
                        <button class="done">&lt;&lt; Back</button>
                    </div>
                    <div class="workarea">
                        [ workarea ]
                    </div>
                </div>
            `
        });
        this.fileName = f;

        this.find('button.done').addEventListener('click', () => Editor.popPanel());

        this.tableList = this.find('.table-list');
        this.tableList.addEventListener('click', (evt) => this.clickTables(evt));

        this.objectList = this.find('.object-list');
        this.objectList.addEventListener('click', (evt) => this.clickObjects(evt));

        this.data = JSON.parse(fs.readFileSync(path.join(Editor.gamePath, this.fileName)));
        _.keys(this.data).forEach((k) => {
            if (k === '.schema') return;
            this.addTable(k, false);
        });
        this.sortTables();

    }

    addTable(t, nosort) {
        this.addChild(new TableComponent(t), this.tableList);
        if (!nosort) this.sortTables();
    }

    sortTables() {
        var p = this.tableList.parentElement;
        var r = document.createElement('div');

        p.replaceChild(r, this.tableList);
        var nodes = _.toArray(this.tableList.childNodes);
        nodes.sort((a,b) => a.getAttribute('data-table').localeCompare(b.getAttribute('data-table')));
        nodes.forEach((n) => this.tableList.appendChild(n));

        p.replaceChild(this.tableList, r);
    }

    clickTables(evt) {
        var clicked = evt.toElement;
        if (clicked === this.tableList) return;

        var table = clicked.getAttribute('data-table');
        this.data[table].forEach((o, index) => {
            this.addChild(new ObjectComponent(index, o.id), this.objectList);
        });
    }

    clickObjects(evt) {
        var clicked = evt.toElement;
        if (clicked === this.objectList) return;


    }
}

module.exports = DataEditPanel;
