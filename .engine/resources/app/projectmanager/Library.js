css('Library.css');

const FS = require('fs-extra');
const Path = require('path');

class Library {
    constructor(p) {
        this.path = p;
        this.games = [];

        this.el = document.createElement('div');
        this.el.className = "game-library";
        this.el.innerHTML = `
            <header>${p}</header>
            <ul class="games"></ul>
        `;
        // TODO a force-refresh

        this.headerEl = this.el.querySelector('header');
        this.gamesEl = this.el.querySelector('.games');

        this.rebuild();

        FS.watch(p, { persistent: true, recursive: false }, (e, filename) => {
            this.rebuild();
        });
    }

    getEl() {
        return this.el;
    }

    rebuild() {
        while (this.gamesEl.lastChild) {
            this.gamesEl.removeChild(this.gamesEl.lastChild);
        }

        let proc = (root) => {
            let games = [];
            let subdirgames = [];
            FS.readdirSync(root).sort().forEach((f) => {
                let fullpath = Path.join(root, f);

                if (f[0] === '.' && f !== '.') return;
                // if (f === ENGINEDIR) return;

                let config = Path.join(fullpath, "config.json");
                let stat = FS.statSync(fullpath);
                if (stat.isDirectory()) {
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

        li.querySelector('.extra > .run').onclick = (e) => { e.stopPropagation(); this.clickCompileAndRun(li, path); };
        li.querySelector('.extra > .edit').onclick = (e) => { e.stopPropagation(); this.clickEdit(li, path); };
        li.querySelector('.extra > .export').onclick = (e) => { e.stopPropagation(); this.clickExport(li, path); };
        parent.appendChild(li);

        return li;
    }

    addGameFolder(path, parent) {
        let container = document.createElement('li');
        container.classList.add('folder', 'closed');
        container.setAttribute('data-path', path);

        let ul = document.createElement('ul');
        container.appendChild(ul);

        let li = document.createElement('li');
        li.classList.add('folder-header');
        li.setAttribute('data-path', path);
        li.innerHTML =
            '<div class="icon"></div>' +
            '<div class="title">' + scrub(path) + '/</div>';
        ul.appendChild(li);

        parent.appendChild(container);
        return ul;
    }
}

module.exports = Library;
