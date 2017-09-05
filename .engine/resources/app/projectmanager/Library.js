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
            this.rebuildGameList();
        });
    }

    getEl() {
        return this.el;
    }

    rebuild() {
        // while (this.gameList.lastChild) {
        //     this.gameList.removeChild(this.gameList.lastChild);
        // }

        var games = {};
        var f;

        var proc = (root, list) => {
            var games = [];
            FS.readdirSync(root).sort().forEach((f) => {
                var fullpath = Path.join(root, f);

                if (f[0] === '.' && f !== '.') return;
                // if (f === ENGINEDIR) return;

                var config = Path.join(fullpath, "config.json");
                var stat = FS.statSync(fullpath);
                if (stat.isDirectory()) {
                    if (FS.existsSync(config)) {
                        games.push(fullpath);
                    } else {
                        proc(Path.join(root, f), this.addGameFolder(f, list));
                    }
                }
            });

            console.log("--",games);

            let i = 0, j = 0;
            // while (i < games.length || j < games.length) {
            //
            // }
            games.forEach((path) => {
                this.addGame(path, list);
            });
        };

        proc(this.path, this.gamesEl);
    }

    addGame(path, parent) {
        var config;
        try {
            config = JSON.parse(FS.readFileSync(Path.join(path, "config.json")));
        } catch (e) {
            Manager.output("<span style='color:red'>Found, but failed to parse " + Path.join(path, "config.json") + ":", e, "</span>");
            config = {};
        }

        var li = document.createElement('li');
        li.setAttribute('data-path', path);

        var icon = config.icon ? scrub(Path.join(path, config.icon)) : ''; // TODO default project icon
        var title = config.title ? scrub(config.title) : Path.basename(path);
        var author = config.author ? scrub(config.author) : 'no author';
        var info = config.width && config.height ? scrub(config.width) + ' x ' + scrub(config.height) : '';

        li.innerHTML = `
            <div class="icon"><img src="${icon}"></div>
            <div class="title">${title}</div>
            <div class="author">${author}</div>
            <div class="info">${info}</div>
            <div class="extra">
                <span class="run">&rarr; Compile and Run</span>
                <span class="edit">&rarr; Edit</span>
                <span class="export">&rarr; Export... <input class="directory-picker" type="file" webkitdirectory></span>
            </div>
        `;

        li.querySelector('.extra > .run').onclick = (e) => { e.stopPropagation(); this.clickCompileAndRun(li, path); };
        li.querySelector('.extra > .edit').onclick = (e) => { e.stopPropagation(); this.clickEdit(li, path); };
        li.querySelector('.extra > .export').onclick = (e) => { e.stopPropagation(); this.clickExport(li, path); };
        parent.appendChild(li);

        return li;
    }

    addGameFolder(path, parent) {
        var container = document.createElement('li');
        container.classList.add('folder', 'closed');
        container.setAttribute('data-path', path);

        var ul = document.createElement('ul');
        container.appendChild(ul);

        var li = document.createElement('li');
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
