"use strict";

css('EngineStatus.css');

const statusText = {
    'checking':     ["Checking engine state...", 'loop-circular'],
    'ready':        ["Engine is ready", 'check'],
    'dirty':        ["Engine needs to be recompiled.", 'loop-circular'],
    'compiling':    ["Engine is compiling...", 'loop-circular'],
    'error':        ["Engine compilation failed. See output for details.", 'warning']
}
let el;

module.exports = {
    add: function(parent, cb) {
        el = document.createElement('div');
        el.id = 'engine-status';
        el.className = 'checking';
        el.innerHTML = `
            <span class="message"></span>
            <span class="icon-container"></span>
        `;
        el.onclick = cb;
        parent.appendChild(el);
    },

    set: function(status) {
        el.className = status;
        el.querySelector('.message').innerHTML = statusText[status][0];
        el.querySelector('.icon-container').innerHTML = `<svg class="icon ${statusText[status][1]}"><use xlink:href="../img/sprite.svg#${statusText[status][1]}"></use></svg>`;
    },

    get: function() {
        return el.className;
    }
};
