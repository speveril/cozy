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
        this.mode = null;
    }

    setActive(el) {
        this.findAll('.active').forEach((e) => e.classList.remove('active'));
        if (el)
            el.classList.add('active');
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

class SchemaComponent extends UiComponent {
    constructor(key) {
        super({
            className: 'object-entry selection-list-item',
            html: `${key}`
        });
        this.element.setAttribute('data-type', key);
    }
}
class RowType {
    constructor(def) {
        // TODO other types:
        //   dict, Type, imageframe, arrays

        this.fields = [];
        this.fieldLookup = {};

        _.each(def, (fieldDef) => {
            var field = {};

            field.key = fieldDef.key;
            field.optional = fieldDef.optional ? true : false;

            var matches = fieldDef.type.match(/^(\w+)(?:<(\d*)(?:,(\d*))?>)?$/);
            if (!matches) throw new Error("Bad type in RowType field: " + fieldDef.type);

            field.type = matches[1];
            if (matches[1] === 'boolean') {
                // no constraints on booleans, but they are allowed
            } else if (matches[1] === 'int' || matches[1] === 'number') {
                field.min = matches[2] ? parseInt(matches[2],10) : -Infinity;
                field.max = matches[3] ? parseInt(matches[3],10) : Infinity;
            } else if (matches[1] === 'string' || matches[1] === 'text') {
                field.max = matches[2] ? parseInt(matches[2],10) : Infinity;
            } else {
                console.log("LOAD ERROR: Bad field def -", fieldDef);
            }

            this.fields.push(field);
            this.fieldLookup[field.key] = field;
        });
    }

    serializeTypes() {
        var schema = [];
        this.fields.forEach((field) => {
            var f = { key: field.key, optional: field.optional, type: field.type };

            switch (field.type) {
                case 'int':
                case 'number':
                    if (field.min !== -Infinity || field.max !== Infinity) {
                        f.type += `<${field.min !== -Infinity ? field.min : ''},${field.max !== Infinity ? field.max : ''}>`;
                    }
                    break;
                case 'string':
                case 'text':
                    if (field.max !== Infinity) {
                        f.type += "<" + field.max + ">";
                    }
                    break;
            }
            schema.push(f);
        });
        return schema;
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

    setupSchemaEditing(type) {
        var el;

        this.clear();

        // TODO reordering controls

        var updateFunc = (evt, forceUpdate) => {
            var parent = evt.currentTarget;
            var f = type.fields[parseInt(parent.getAttribute('data-index'), 10)];
            var select = parent.querySelector('.type select');
            var constraints = parent.querySelector('.constraints');
            var constraintDiv = constraints.querySelector('.' + select.value);

            if (select.value !== f.type || forceUpdate) {
                var currentActive = constraints.querySelectorAll('.active');
                if (currentActive) currentActive.forEach((e) => e.classList.remove('active'));

                if (constraintDiv) {
                    constraintDiv.classList.add('active');
                    if (constraintDiv.querySelector('input[name=max]') && f.max !== Infinity)
                        constraintDiv.querySelector('input[name=max]').value = f.max;
                    if (constraintDiv.querySelector('input[name=min]') && f.min !== -Infinity)
                        constraintDiv.querySelector('input[name=min]').value = f.min;
                }
            }

            f.key = parent.querySelector('input[name=key]').value;
            f.type = select.value;

            if (constraintDiv) {
                var minInput = constraintDiv.querySelector('input[name=min]');
                var maxInput = constraintDiv.querySelector('input[name=max]');
                if (maxInput) {
                    f.max = maxInput.value === '' ? f.max = Infinity : parseInt(maxInput.value, 10);
                }
                if (minInput) {
                    f.min = minInput.value === '' ? f.min = -Infinity : parseInt(minInput.value, 10);
                }
            }
            console.log(f);
        };

        var makeRow = (field, index) => {
            el = document.createElement('div');
            el.className = 'field-row';
            el.innerHTML = `
                <div class="label"><input type="text" name="key" value="${field.key}"></div>
                <div class="type">
                    <select name="type">
                        <option value="boolean">Boolean</option>
                        <option value="string">String</option>
                        <option value="text">Text</option>
                        <option value="int">Integer</option>
                        <option value="number">Number</option>
                        <option disabled>-------</option>
                    </select>
                </div>
                <div class="constraints">
                    <div class="int number">
                        <span>Range:</span> <input type="number" name="min">
                        <span>to</span> <input type="number" name="max">
                    </div>
                    <div class="text string">
                        <span>Length:</span> <input type="number" name="max">
                    </div>
                </div>
            `;
            el.setAttribute('data-index', index);

            el.querySelector('.type select option[value='+field.type+']').setAttribute('selected','selected');
            el.addEventListener('change', updateFunc);
            updateFunc({ currentTarget: el }, true);

            this.element.appendChild(el);
            return el;
        }

        _.each(type.fields, makeRow);

        this.addButton = document.createElement('div');
        this.addButton.className = 'field-row';
        this.addButton.innerHTML = `
            <button>+ Add property</button>
        `;
        this.addButton.querySelector('button').addEventListener('click', () => {
            type.fields.push({ key:'', type:'boolean' });
            var row = makeRow(type.fields[type.fields.length - 1], type.fields.length - 1);
            row.querySelector('input[name=key]').focus();
            this.element.appendChild(this.addButton);
        });
        this.element.appendChild(this.addButton);
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
                            value="${data[field.key] === undefined ? '' : data[field.key]}"
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
                    el.innerHTML = `<textarea name="${field.key}">${data[field.key] === undefined ? '' : data[field.key]}</textarea>`;
                    break;
                default:
                    el.innerHTML = data[field.key];
                    break;
            }
            el.addEventListener('change', (evt) => {
                var key = evt.srcElement.getAttribute('name');
                if (type.validate(field, evt.srcElement.value)) {
                    data[field.key] = type.parseValue(field, evt.srcElement.value);
                } else {
                    console.log("Value", evt.srcElement.value, "failed validation for type", type.key);
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

        this.clickEditSchema();
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

        this.objectList.mode = 'table';
        this.objectList.empty();
        this.workarea.clear();
        this.table = this.data[clicked.getAttribute('data-table')];
        this.table.rows.forEach((o, index) => {
            this.objectList.addChild(new ObjectComponent(index, o.id));
        });
    }

    clickAddTable() {
        console.log("TODO add table");
    }

    clickEditSchema() {
        var i = 0;

        this.table = null;
        this.objectList.mode = 'schema';
        this.objectList.empty();
        this.workarea.clear();
        _.each(this.schema, (type, key) => {
            this.objectList.addChild(new SchemaComponent(key));
        });
    }

    clickObjects(evt) {
        var clicked = evt.toElement;
        if (clicked === this.objectList.element) return;

        if (this.objectList.mode === 'table') {
            var object = this.table.rows[clicked.getAttribute('data-index')];
            var type = this.schema[this.table.type];
            if (!type) throw new Error("Data includes an undefined Type:", this.table.type);

            this.workarea.setupObjectEditing(type, object);
        } else if (this.objectList.mode === 'schema') {
            var type = this.schema[clicked.getAttribute('data-type')];
            if (!type) throw new Error("Tried to edit an unrecognized Type:", clicked.getAttribute('data-type'));

            this.workarea.setupSchemaEditing(type, object);
        }

        this.objectList.setActive(clicked);
    }

    clickSave() {
        // TODO full validate before save

        this.data['.schema'] = _.mapObject(this.schema, (type) => {
            return type.serializeTypes();
        });

        var fullPath = path.join(Editor.gamePath, this.fileName);
        fs.writeFileSync(fullPath, JSON.stringify(this.data));
    }
}

module.exports = DataEditPanel;
