class UiComponent {
    constructor(args) {
        this.children = [];
        this.element = document.createElement(args.tag || 'div');
        this.element.className = args.className || '';
        this.element.innerHTML = args.html || '';
    }

    setParent(parent, parentElement) {
        this.remove();

        this.parent = parent;
        if (this.parent) this.parent.children.push(this);

        var el;

        if (parentElement === undefined) {
            el = parent.element;
        } else if (typeof parentElement === 'string') {
            el = parent.find(parentElement);
        } else {
            el = parentElement;
        }

        el.appendChild(this.element);
    }

    addChild(child, parentElement) {
        child.setParent(this, parentElement);
        return child;
    }

    find(selector) {
        return this.element.querySelector(selector);
    }

    findAll(selector) {
        var list = [];
        var nodeList = this.element.querySelectorAll(selector);
        for (var i = 0; i < nodeList.length; i++) {
            list.push(nodeList[i]);
        }
        return list;
    }

    remove() {
        if (this.parent) {
            var i = this.parent.children.indexOf(this);
            this.parent.children.splice(i, 1);
        }
        this.element.remove();
    }

    empty() {
        while (this.children.length > 0) {
            this.children[this.children.length - 1].remove();
        }
    }
}

module.exports = UiComponent;
