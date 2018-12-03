'use strict';

css('Library.css');

const FS = require('fs-extra');
const Path = require('path');

class Library {
    constructor(p) {
        this.path = p;
        this.games = [];

        this.el = $create(`
            <div class="game-library">
                <header>
                    <span>${p}</span>
                    <button data-action="open-folder" disabled>
                        <svg class="icon"><use xlink:href="../img/sprite.svg#folder"></use></svg>
                    </button>
                    <button data-action="add-game">
                        <svg class="icon"><use xlink:href="../img/sprite.svg#plus"></use></svg>
                    </button>
                    <button data-action="refresh">
                        <svg class="icon"><use xlink:href="../img/sprite.svg#reload"></use></svg>
                    </button>
                    <button data-action="remove">
                        <svg class="icon"><use xlink:href="../img/sprite.svg#x"></use></svg>
                    </button>
                </header>
                <ul class="games"></ul>
            </div>
        `);

        // TODO a force-refresh

        this.headerEl = this.el.querySelector('header');
        this.gamesEl = this.el.querySelector('.games');

        this.headerEl.onclick = (e) => {
            let target = e.target;
            let action = target.getAttribute('data-action');
            switch (action) {
                case 'refresh':
                    this.rebuild();
                    break;
                case 'remove':
                    if (window.confirm("Are you sure you want to remove this library from the game list? (No files will be deleted)")) {
                        Manager.removeLibrary(this);
                    }
                    break;
                case 'add-game':
                    Manager.newGame(this.path);
                    break;
                case 'open-folder':
                default:
                    break;
            }
        }

        if (this.rebuild()) {
            FS.watch(p, { persistent: true, recursive: false }, (e, filename) => {
                this.rebuild();
            });
        };
    }

    getEl() {
        return this.el;
    }

    rebuild() {
        if (!FS.existsSync(this.path)) {
            this.el.classList.add('not-found');
            this.gamesEl.innerHTML = 'Could not load this library.';
            return false;
        }

        this.el.classList.remove('not-found');

        while (this.gamesEl.lastChild) {
            this.gamesEl.removeChild(this.gamesEl.lastChild);
        }

        let proc = (root) => {
            let games = [];
            let subdirgames = [];

            let config = Path.join(root, "config.json");
            if (FS.existsSync(config)) {
                games.push(root);
            }

            FS.readdirSync(root).sort().forEach((f) => {
                let fullpath = Path.join(root, f);

                if (f[0] === '.' && f !== '.') return;
                // if (f === ENGINEDIR) return;

                let stat = FS.statSync(fullpath);
                if (stat.isDirectory()) {
                    let config = Path.join(fullpath, "config.json");
                    if (FS.existsSync(config)) {
                        games.push(fullpath);
                    } else {
                        subdirgames = subdirgames.concat(proc(Path.join(root, f)));
                    }
                }
            });
            return subdirgames.concat(games);
        };

        let games = proc(this.path);
        let activePath = Manager.activeGame ? Manager.activeGame.getAttribute('data-path') : null;

        games.forEach((path) => {
            let el = this.addGame(path, this.gamesEl);
            if (path === activePath) {
                el.classList.add('active');
                Manager.activeGame = el;
            }
        });

        return true;
    }

    addGame(path, parent) {
        let config;

        try {
            config = JSON.parse(FS.readFileSync(Path.join(path, "config.json")));
        } catch (e) {
            Manager.output("<span style='color:red'>Found, but failed to parse " + Path.join(path, "config.json") + ":", e, "</span>");
            config = {};
        }

        let icon = config.icon ? scrub(Path.join(path, config.icon)) : ''; // TODO default project icon
        let title = config.title ? scrub(config.title) : Path.basename(path);
        let author = config.author ? scrub(config.author) : 'no author';
        // let info = config.width && config.height ? scrub(config.width) + ' x ' + scrub(config.height) : '';
        let relativepath = Path.relative(this.path, path).split(Path.sep).slice(0, -1).join('/');

        let li = $create(`
            <li class="game" data-path="${path}">
                <div class="icon"><img src="${icon}"></div>
                <div class="title"><span class="subpath">${relativepath ? relativepath + '/' : ''}</span>${title}</div>
                <div class="author">${author}</div>
                <div class="extra">
                    <span class="run">&rarr; Compile and Run</span>
                    <span class="edit">&rarr; Edit</span>
                    <span class="export">&rarr; Export... <input class="directory-picker" type="file" webkitdirectory></span>
                </div>
            </li>
        `);
        // <div class="info">${info}</div>

        li.querySelector('.extra > .run').onclick = (e) => { e.stopPropagation(); Manager.clickCompileAndRun(li, path); };
        li.querySelector('.extra > .edit').onclick = (e) => { e.stopPropagation(); Manager.clickEdit(li, path); };
        li.querySelector('.extra > .export').onclick = (e) => { e.stopPropagation(); Manager.clickExport(li, path); };
        parent.appendChild(li);

        return li;
    }
}

module.exports = Library;
