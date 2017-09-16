"use strict";

css('EngineStatus.css');

module.exports = {
    add: function(parent) {
        let el = document.createElement('div');
        el.id = 'engine-status';
        el.className = 'checking';
        el.innerHTML = `
            <span class="message"></span>
            <span class="icon"></span>
        `;
        parent.appendChild(el);
        return el;
    }
};
