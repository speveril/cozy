"use strict";

css('GameOverlay.css');
const Dialog = require('electron').remote.dialog;
const FS = require('fs-extra');
const Path = require('path');
const EngineStatus = require('./EngineStatus');

let element = document.querySelector('#game-overlay');
let gamepath = null;
let gameconfig = null;

let GameOverlay = {
    show: function(game) {
        gamepath = game;

        try {
            gameconfig = JSON.parse(FS.readFileSync(Path.join(gamepath, "config.json")));
        } catch(e) {
            Manager.output("<span style='color:red'>[ ERROR (" + e.toString() + ") ]</span>\n");
            GameOverlay.hide();
            return;
        }

        element.classList.add('open');
        element.innerHTML = `
            <div class="content">
                <div class="banner">
                    <div class="title">
                        ${scrub(gameconfig.title)}
                        <div class="version">v${scrub(gameconfig.version)}</div>
                    </div>
                    <div class="author">by ${scrub(gameconfig.author)}</div>
                </div>

                <ul class="main actions">
                    <li class="primary" data-action="compileAndRun" title="Play (F5)">
                        <svg class="icon"><use xlink:href="../img/sprite.svg#play-circle"></use></svg>
                        Play
                    </li>
                    <li data-action="compile" title="Compile (F7)">
                        <svg class="icon"><use xlink:href="../img/sprite.svg#aperture"></use></svg>
                        Compile
                    </li>
                    <li data-action="export" title="Export">
                        <svg class="icon"><use xlink:href="../img/sprite.svg#share-boxed"></use></svg>
                        Export
                    </li>
                    <li data-action="exportweb" title="Export (Web)">
                        <svg class="icon"><use xlink:href="../img/sprite.svg#share-boxed"></use></svg>
                        Export (Web)
                    </li>
                    <!--<li data-action="editData" title="Edit Data">
                        <svg class="icon"><use xlink:href="../img/sprite.svg#pencil"></use></svg>
                        Edit Data
                    </li>-->
                </ul>

                <div class="info"></div>
            </div>
        `;

        // prevent clicks in the content area from closing the overlay
        element.querySelector('.content').addEventListener('click', (e) => e.stopPropagation());
        element.querySelector('ul.actions').addEventListener('click', (e) => {
            let action = e.target.getAttribute('data-action');
            if (this[action]) {
                this[action]();
            }
        });
        document.addEventListener('keydown', GameOverlay.keyHandler);
        element.querySelector('.info').innerHTML = "<strong>config.json:</strong>\n\n" + JSON.stringify(gameconfig, null, 4);
    },

    keyHandler: function(evt) {
        // console.log(evt.which);
        switch (evt.which) {
            case 116: // F5
                GameOverlay.compileAndRun();
                break;
            case 118: // F7
                GameOverlay.compile();
                break;
            case 27: // Esc
                GameOverlay.hide();
                break;
        }
    },

    hide: function() {
        gamepath = null;
        gameconfig = null;
        document.removeEventListener('keypress', GameOverlay.keyHandler);
        element.classList.remove('open');
    },

    compile: function(target) {
        if (EngineStatus.get() === 'dirty') {
            Manager.recompileEngine();
        }
        return Manager.queueTask(() => {
            Manager.output("");
            return Manager.buildGame(gamepath);
        });
    },

    compileAndRun: function() {
        GameOverlay.compile();
        Manager.queueTask(() => {
            return new Promise((resolve, reject) => {
                Electron.ipcRenderer.once('play-done', (event) => {
                    resolve();
                });
                Electron.ipcRenderer.send('control-message', {
                    command: 'play',
                    path: gamepath,
                    debug: true,
                    override: Manager.override,
                    libRoots: localStorage.getItem('libs') || '[]',
                });
            });
        });
    },

    editData: function() {
        Electron.ipcRenderer.send('control-message', {
            command: 'edit',
            path: gamepath,
        });
    },

    export: function() {
        Dialog.showOpenDialog({
            title: "Choose export location",
            properties: ["openDirectory","promptToCreate","createDirectory"]
        }, (paths) => {
            var outputPath = paths[0];

            GameOverlay.compile();
            Manager.queueTask(() => {
                Manager.output("");
                return Manager.export(gamepath, outputPath);
            });
        });
    },

    exportweb: function() {
        Dialog.showOpenDialog({
            title: "Choose export location",
            properties: ["openDirectory","promptToCreate","createDirectory"]
        }, (paths) => {
            var outputPath = paths[0];

            GameOverlay.compile('web')
            Manager.queueTask(() => {
                Manager.output("");
                return Manager.exportToWeb(gamepath, outputPath);
            });
        });
    }
};

element.addEventListener('click', GameOverlay.hide);

module.exports = GameOverlay;
