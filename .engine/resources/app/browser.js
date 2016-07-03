'use strict';
const FS = require('fs');
const Child = require('child_process');
const Path = require('path');
const Process = require('process');

const GAMELIBDIRS = ['.'];
const ENGINEDIR = '.engine'

const $ = (q) => {
    return document.querySelectorAll(q);
}

const statusText = {
    'ready': "Engine is ready",
    'dirty': "Engine needs to be recompiled.",
    'compiling': "Engine is compiling...",
    'error': "Engine compilation failed. See output above for details."
}

function scrub(text) {
    var scrubber = document.createElement('span');
    scrubber.innerText = text;
    var s = scrubber.innerHTML;
    s = s.replace('"', '&quot;');
    s = s.replace("'", '&apos;');
    return s;
}

var Browser = {
    start: function() {
        this.controls = $('#controls')[0];
        this.gameList = $('#game-list ul')[0];
        this.newGameFooter = $('#game-list footer')[0];
        this.outputContainer = $('#output')[0];
        this.engineStatus = $('#engine-status')[0];
        this.dialogContainer = $('#dialogs')[0];
        this.recompileInterval = null;

        this.rebuildGameList();

        this.setEngineStatus('ready');

        var lastCompilation = 0;
        var eggJS = Path.join(ENGINEDIR, "resources", "app", "Egg.js")
        if (FS.existsSync(eggJS)) {
            lastCompilation = FS.statSync(eggJS).mtime.getTime();
        }
        var srcFiles = [ Path.join(ENGINEDIR, "src") ];
        var f, stat;
        while(srcFiles.length > 0) {
            f = srcFiles.shift();
            stat = FS.statSync(f);
            if (stat.isDirectory()) {
                FS.readdirSync(f).forEach((ff) => {
                    srcFiles.push(Path.join(f, ff));
                });
            } else {
                if (stat.mtime.getTime() > lastCompilation) {
                    this.recompileEngine();
                    break;
                }
            }
        }

        FS.watch(Path.join(ENGINEDIR, "src"), { persistent: true, recursive: true }, (e, filename) => {
            if (this.engineStatus.className !== 'compiling') {
                this.setEngineStatus('dirty');
            }
            if (this.recompileInterval) {
                clearInterval(this.recompileInterval);
            }
            this.recompileInterval = setInterval(() => this.recompileEngine(), 3000);
        });
        FS.watch(".", { persistent: true, recursive: false }, (e, filename) => {
            this.rebuildGameList();
        });

        this.engineStatus.onclick = () => this.recompileEngine();

        this.controls.onclick = (e) => {
            var target = e.target;
            var action = target.getAttribute('data-action');
            switch (action) {
                case 'docs':
                    Electron.ipcRenderer.send('control-message', { command: 'view-docs' });
                    break;
                case 'newgame':
                    this.newGame();
                    break;
                default:
                    this.output("Unknown control action", action);
            }
        };

        this.gameList.onclick = (e) => {
            var target = e.target;
            while (target && target.tagName.toLowerCase() !== 'li') {
                target = target.parentNode;
            }
            if (!target) return;

            if (target.parentNode.parentNode.classList.contains('folder') && target.previousSibling === null) {
                target.parentNode.parentNode.classList.toggle('closed');
            } else {
                var path = target.getAttribute('data-path');

                target.classList.add('compiling');

                this.output("");
                this.buildGame(path)
                    .then(() => {
                        target.classList.remove('compiling');
                        Electron.ipcRenderer.send('control-message', {
                            command: 'play',
                            path: path,
                            debug: true
                        });
                    }, () => {
                        target.classList.remove('compiling');
                    });
            }
        }

        document.querySelector('#game-list header .force-refresh').onclick = (e) => this.rebuildGameList();

        this.newGameFooter.onclick = () => this.newGame();

        this.output("Egg project browser loaded.\n");
    },

    newGameDialog: function() {
        return new Promise((resolve, reject) => {
            var dialog = document.createElement('form');
            dialog.innerHTML =
                '<div class="text">New Game</div>' +
                'Folder: <input type="text" name="path">' +
                'Name: <input type="text" name="name">' +
                '<div class="buttons">' +
                    '<button class="confirm">OK</button>' +
                    '<button class="cancel">Cancel</button>' +
                '</div>';
            dialog.onsubmit = (e) => {
                e.preventDefault();
            };
            dialog.querySelector('button.confirm').onclick = () => {
                var values = Array.prototype.reduce.call(dialog.querySelectorAll('input'), (accum, input) => {
                    accum[input.getAttribute('name')] = input.value;
                    return accum;
                }, {});
                resolve(values);
                this.dialogContainer.removeChild(dialog);
            }
            dialog.querySelector('button.cancel').onclick = () => {
                reject();
                this.dialogContainer.removeChild(dialog);
            }

            this.dialogContainer.appendChild(dialog);

            dialog.querySelector('input[name=path]').focus();
        });
    },

    prompt: function(text) {
        return new Promise((resolve, reject) => {
            var dialog = document.createElement('form');
            dialog.innerHTML =
                '<div class="text">' + text + '</div>' +
                '<input type="text">' +
                '<div class="buttons">' +
                    '<button class="confirm">OK</button>' +
                    '<button class="cancel">Cancel</button>' +
                '</div>';
            dialog.onsubmit = (e) => {
                e.preventDefault();
            };
            dialog.querySelector('button.confirm').onclick = () => {
                resolve(dialog.querySelector('input').value);
                this.dialogContainer.removeChild(dialog);
            }
            dialog.querySelector('button.cancel').onclick = () => {
                reject();
                this.dialogContainer.removeChild(dialog);
            }

            this.dialogContainer.appendChild(dialog);

            dialog.querySelector('input').focus();
        });
    },

    rebuildGameList: function() {
        while (this.gameList.lastChild) {
            this.gameList.removeChild(this.gameList.lastChild);
        }

        var games = {};
        var f;

        var proc = (root, list) => {
            var games = [];
            FS.readdirSync(root).sort().forEach((f) => {
                var fullpath = Path.join(root, f);

                if (f[0] === '.' && f !== '.') return;
                if (f === ENGINEDIR) return;

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
            games.forEach((path) => {
                this.addGame(path, list);
            });
        };

        GAMELIBDIRS.forEach((f) => {
            proc(f, this.gameList);
        });
    },

    addGame: function(path, parent) {
        var config;
        try {
            config = JSON.parse(FS.readFileSync(Path.join(path, "config.json")));
        } catch (e) {
            this.output("<span style='color:red'>Found, but failed to parse " + Path.join(path, "config.json") + ":", e, "</span>");
            config = {};
        }

        var li = document.createElement('li');
        li.setAttribute('data-path', path);

        var icon = config.icon ? scrub(Path.join(Process.cwd(), path, config.icon)) : ''; // TODO default project icon
        var title = config.title ? scrub(config.title) : Path.basename(path);
        var author = config.author ? scrub(config.author) : 'no author';
        var info = config.width && config.height ? scrub(config.width) + ' x ' + scrub(config.height) : '';

        li.innerHTML =
            '<div class="icon"><img src="' + icon + '"></div>' +
            '<div class="title">' + title + '</div>' +
            '<div class="author">' + author + '</div>' +
            '<div class="info">' + info + '</div>' +
            '<div class="recompile" title="Game will be rebuilt when run"></div>';

        parent.appendChild(li);
    },

    addGameFolder: function(path, parent) {
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
    },

    output: function(/* ... */) {
        var s = '';
        for (let i in arguments) {
            if (i > 0) s += " ";
            s += arguments[i].toString();
        }
        s = s + "\n";
        this.outputContainer.innerHTML = (this.outputContainer.innerHTML || "") + s;
        this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
    },

    recompileEngine: function() {
        if (this.engineStatus.className === 'compiling') return;
        if (this.recompileInterval) {
            clearTimeout(this.recompileInterval);
            this.recompileInterval = null;
        }

        this.setEngineStatus('compiling');

        this.output("");
        this.buildEngine()
            .then(() => {
                return this.doc(Path.join(ENGINEDIR, "src", "Egg.ts"), Path.join(ENGINEDIR, "docs"))
            }, () => {
                if (this.recompileInterval) {
                    this.setEngineStatus('dirty');
                } else {
                    this.setEngineStatus('error');
                }
            })
            .then(() => {
                if (this.recompileInterval !== null) {
                    this.setEngineStatus('dirty');
                } else {
                    this.setEngineStatus('ready');
                }
            }, () => {
                if (this.recompileInterval !== null) {
                    this.setEngineStatus('dirty');
                } else {
                    this.setEngineStatus('error');
                }
            });
    },

    buildGame: function(buildPath) {
        // TODO ?? copy all the stuff we need into a lib/ directory in the game
        //   - need to add the d.ts files for PIXI, node, etc
        // var filesToCopy = [
        //     'Egg.js',
        //     'Egg.js.map',
        //     'Egg.d.ts'
        // ];
        // filesToCopy.forEach(function(filename) {
        //     var contents = FS.readFileSync(__dirname + "/" + filename, { encoding: 'UTF-8' });
        //     FS.writeFileSync(gamePath + "/" + filename, contents);
        // });

        var config;
        try {
            config = JSON.parse(FS.readFileSync(Path.join(buildPath, "config.json")));
        } catch(e) {
            this.output("<span style='color:red'>[ ERROR (" + e.toString() + ") ]</span>\n");
            return Promise.reject();
        }

        var srcRoot = Path.join(buildPath, config.main || 'main.ts');
        var displayName = scrub(config.title ? config.title + " (" + buildPath + ")" : buildPath);

        var params = [
            '.engine/resources/app/Egg.d.ts', srcRoot,
            '--out', Path.join(buildPath, 'main.js')
        ];

        this.output("<hr>\n<span style='color:white'>[ Building " + displayName + " ]</span>")
        return this.build(params)
            .then(() => {
                this.output(" - Built " + Path.join(buildPath, 'main.js'));
                this.output("<span style='color:#0f0'>[ Success ]</span>\n");
                return Promise.resolve();
            }, (code) => {
                this.output("<span style='color:red'>[ FAILURE (code: " + code + ") ]</span>\n");
                return Promise.reject();
            });
    },

    buildEngine: function() {
        var params = [
            '--project', Path.join(ENGINEDIR, "src"),
            '--out', Path.join(ENGINEDIR, 'resources', 'app', 'Egg.js')
        ];

        this.output("<hr>\n<span style='color:white'>[ Building core engine ]</span>")
        return this.build(params)
            .then(() => {
                this.output(" - Built engine");
                this.output("<span style='color:#0f0'>[ Success ]</span>\n");
                return Promise.resolve();
            }, (code) => {
                this.output("<span style='color:red'>[ FAILURE (code: " + code + ") ]</span>\n");
                return Promise.reject();
            });
    },

    build: function(buildParams) { //buildPath, outputFile) {
        buildParams.push('--target', 'ES6');

        return new Promise((resolve, reject) => {
            var tsc = Child.fork(Path.join(ENGINEDIR, 'resources', 'app', 'node_modules', 'typescript', 'bin', 'tsc'), buildParams, { silent: true, env: {"ATOM_SHELL_INTERNAL_RUN_AS_NODE":"0"} });

            tsc.stdout.on('data', this.output.bind(this));
            tsc.stderr.on('data', this.output.bind(this));

            tsc.on('exit', (returnCode) => {
                if (!returnCode) {
                    resolve();
                } else {
                    reject(returnCode);
                }
            });
        });
    },

    doc: function(srcPath, outputPath) {
        return new Promise((resolve, reject) => {
            this.output(
                "<span style='color:white'>[ Generating documentation ]</span>\n" +
                " - source:      " + srcPath + "\n" +
                " - destination: " + outputPath
            );

            var typedoc = Child.fork(Path.join(ENGINEDIR, 'resources', 'app', 'builddoc'), [
                '--out', outputPath,
                '--mode', 'file',
                '--target', 'ES6',
                '--name', 'Egg Engine',
                srcPath
            ], { silent: true, env: {"ATOM_SHELL_INTERNAL_RUN_AS_NODE":"0"} });

            // do some trimming because typedoc likes its newlines
            typedoc.stdout.on('data', (s) => this.output(s.toString().trim()));
            typedoc.stderr.on('data', (s) => this.output(s.toString().trim()));

            typedoc.on('exit', (returnCode) => {
                if (!returnCode) {
                    this.output("<span style='color:#0f0'>[ Success ]</span>\n");
                    resolve();
                } else {
                    this.output("<span style='color:red'>[ FAILURE (code: " + returnCode + ") ]</span>\n");
                    reject();
                }
            });
        });
    },

    setEngineStatus: function(status) {
        this.engineStatus.className = status;
        this.engineStatus.querySelector('.message').innerHTML = statusText[status];
    },

    newGame: function() {
        this.newGameDialog()
            .then((values) => {
                this.copyTemplate(values);
            }, (e) => {
                if (e) {
                    this.output('<span style="color:red">Error: ' + e.toString() + '</span>\n');
                }
            });
    },

    copyTemplate: function(args) {
        var name = args.name;
        var path = args.path;

        return new Promise((resolve, reject) => {
            this.output('');
            this.output('<strong>[ Creating new game, ' + name + ']')
            var templateDir = Path.join(ENGINEDIR, "resources", "app", "game_template");

            if (!FS.existsSync(path)) {
                this.output("Creating", Path.join(Process.cwd(), path));
                FS.mkdirSync(path);
            }

            if (FS.existsSync(Path.join(path, "config.json"))) {
                this.output("<span style='color:red'>Cannot initialize a game at " + Path.join(Process.cwd(), path) + ", there's already one there!</span>");
                reject();
            } else {
                var filesToCopy = FS.readdirSync(templateDir);
                filesToCopy.forEach((filename) => {
                    var contents = FS.readFileSync(Path.join(templateDir, filename), { encoding: 'UTF-8' });
                    contents = contents.replace(/\$GAMENAME\$/g, name);
                    contents = contents.replace(/\$GAMEPATH\$/g, path);
                    FS.writeFileSync(Path.join(path, filename), contents);
                    this.output("&nbsp; ->", Path.join(Process.cwd(), path, filename));
                });
                resolve();
            }
        });
    }
};
