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

class ObjectListComponent extends UiComponent {
    constructor() {
        super({
            className: 'object-list selection-list'
        });
    }
}

class ObjectComponent extends UiComponent {
    constructor(index, id) {
        super({
            className: 'object-entry selection-list-item',
            html: `<span class="object-index">${index}:</span> ${id}`
        });
        this.element.setAttribute('data-object', id);
        this.element.setAttribute('data-index', index);
    }
}

class RowType {
    constructor(def) {
        // TODO other types:
        //   dict, Type, imageframe, arrays

        this.fields = [];
        this.fieldLookup = {};

        _.each(def, (fieldDef) => {
            var attr = {};

            attr.key = fieldDef.key;
            attr.optional = fieldDef.optional ? true : false;

            var matches = fieldDef.type.match(/^(\w+)(?:<(\d*)(?:,(\d*))?>)?$/);
            if (!matches) throw new Error("Bad type in RowType field: " + fieldDef.type);

            attr.type = matches[1];
            if (matches[1] === 'int' || matches[1] === 'number') {
                attr.min = matches[2] ? parseInt(matches[2],10) : -Infinity;
                attr.max = matches[3] ? parseInt(matches[3],10) : Infinity;
            } else if (fieldDef.type === 'string' || fieldDef.type === 'text') {
                attr.max = matches[2] ? parseInt(matches[2],10) : Infinity;
            }

            this.fields.push(attr);
            this.fieldLookup[attr.key] = attr;
        });
    }

    parseValue(fieldKey, val) {
        var field = typeof fieldKey === 'string' ? this.fieldLookup[fieldKey] : fieldKey;

        switch (field.type) {
            case 'int':       return (parseInt(val, 10) | 0);
            case 'number':    return (parseInt(val, 10));
            default:          return val;
        }
    }

    validate(fieldKey, val) {
        var v;
        var field = typeof fieldKey === 'string' ? this.fieldLookup[fieldKey] : fieldKey;

        switch (field.type) {
            case 'string':
            case 'text':
                if (field.max && val.length > field.max) return false;
                break;
            case 'number':
                v = parseInt(val, 10);
                if (v < field.min || v > field.max) return false;
                break;
            case 'int':
                v = parseInt(val, 10);
                if (v | 0 !== v) return false;
                if (v < field.min || v > field.max) return false;
                break;
        }

        return true;
    }
}

class WorkArea extends UiComponent {
    constructor() {
        super({
            className: 'workarea'
        });
    }

    clear() {
        this.element.innerHTML = '';
    }

    setupObjectEditing(type, data) {
        var el;

        this.clear();

        el = document.createElement('div');
        el.className = 'field-row';
        el.innerHTML = `
            <div class="label">id</div>
            <div class="value"><input type="text" name="id" value="${data['id']}"></div>
        `;
        this.element.appendChild(el);

        _.each(type.fields, (field) => {
            el = document.createElement('div');
            el.className = 'field-row ' + field.type;
            el.innerHTML = `
                <div class="label">${field.key}</div>
                <div class="value"></div>
            `;
            this.element.appendChild(el);

            el = el.querySelector('.value');
            switch(field.type) {
                case 'string':
                    el.innerHTML = `
                        <input type="text"
                            name="${field.key}"
                            value="${data[field.key]}"
                            ${field.max !== Infinity ? 'maxlength="'+field.max+'"' : ''}
                        >`;
                    break;
                case 'int':
                case 'number':
                    el.innerHTML = `
                        <input type="number"
                            name="${field.key}"
                            value="${data[field.key] === undefined ? 0 : data[field.key]}"
                            ${field.max !== Infinity ? 'max="'+field.max+'"' : ''}
                            ${field.min !== -Infinity ? 'min="'+field.min+'"' : ''}
                        >
                    `;
                    break;
                case 'boolean':
                    el.innerHTML = `<input type="checkbox" ${data[field.key] ? 'checked' : ''}>`;
                    break;
                case 'text':
                    el.innerHTML = `<textarea name="${field.key}">${data[field.key]}</textarea>`;
                    break;
                default:
                    el.innerHTML = data[field.key];
                    break;
            }
            el.addEventListener('change', (evt) => {
                var key = evt.srcElement.getAttribute('name');
                if (type.validate(field, evt.srcElement.value)) {
                    data[field.key] = type.parseValue(field, evt.srcElement.value);
                }
            });
        });
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
                    <div class="add-table">
                        <button data-action="add-table">+</button>
                    </div>
                </div>
                <div class="panel-body">
                    <div class="sidebar">
                        <button data-action="edit-schema">Edit Types</button>
                        <button data-action="save">Save</button>
                        <button data-action="done">&lt;&lt; Back</button>
                    </div>
                </div>
            `
        });
        this.fileName = f;

        var sidebar = this.find('.sidebar');
        this.objectList = this.addChild(new ObjectListComponent(), sidebar);
        sidebar.insertBefore(this.objectList.element, sidebar.childNodes[0]);

        this.workarea = this.addChild(new WorkArea(), this.find('.panel-body'));

        this.find('button[data-action=add-table]').addEventListener('click', () => this.clickAddTable());
        this.find('button[data-action=edit-schema]').addEventListener('click', () => this.clickEditSchema());
        this.find('button[data-action=save]').addEventListener('click', () => this.clickSave());
        this.find('button[data-action=done]').addEventListener('click', () => Editor.popPanel());

        this.tableList = this.find('.table-list');
        this.tableList.addEventListener('click', (evt) => this.clickTables(evt));

        this.objectList.element.addEventListener('click', (evt) => this.clickObjects(evt));

        this.data = JSON.parse(fs.readFileSync(path.join(Editor.gamePath, this.fileName)));
        _.keys(this.data).forEach((k) => {
            if (k === '.schema') return;
            this.addTable(k, false);
        });
        this.sortTables();

        this.table = null;

        console.log("Data", this.data);

        this.schema = {};
        if (this.data['.schema']) {
            _.each(this.data['.schema'], (def, typeName) => {
                this.schema[typeName] = new RowType(def);
            });
            console.log("schema", this.schema);
        }
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

        if (this.table === this.data[clicked.getAttribute('data-table')]) return;

        this.objectList.empty();
        this.workarea.clear();
        this.table = this.data[clicked.getAttribute('data-table')];
        this.table.rows.forEach((o, index) => {
            this.objectList.addChild(new ObjectComponent(index, o.id));
        });
    }

    clickObjects(evt) {
        var clicked = evt.toElement;
        if (clicked === this.objectList.element) return;

        var object = this.table.rows[clicked.getAttribute('data-index')];
        var type = this.schema[this.table.type];
        if (!type) throw new Error("Data includes an undefined Type:", type);

        this.workarea.setupObjectEditing(type, object);
    }

    clickAddTable() {
        console.log("TODO add table");
    }

    clickEditSchema() {
        console.log("TODO edit schema");
    }

    clickSave() {
        var fullPath = path.join(Editor.gamePath, this.fileName);
        console.log(fullPath);
        fs.writeFileSync(fullPath, JSON.stringify(this.data));
    }
}

module.exports = DataEditPanel;
