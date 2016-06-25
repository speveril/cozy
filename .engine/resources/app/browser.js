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
    'error': "Engine compilation failed. See output window below for details."
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
                    electron.ipcRenderer.send('control-message', { command: 'view-docs' });
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

            var path = target.getAttribute('data-path');

            target.classList.add('compiling');

            this.output("");
            this.build(path, 'main.js')
                .then(() => {
                    target.classList.remove('compiling');
                    electron.ipcRenderer.send('control-message', {
                        command: 'play',
                        path: path,
                        debug: true
                    });
                }, () => {
                    target.classList.remove('compiling');
                });
        }

        document.querySelector('#game-list header .force-refresh').onclick = (e) => this.rebuildGameList();

        this.newGameFooter.onclick = () => this.newGame();

        this.output("Egg project browser loaded.");
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

        var games = [];
        var files = GAMELIBDIRS;
        var f;

        while (f = files.shift()) {
            this.output("->", f);
            if (f[0] === '.' && f !== '.') continue;
            if (f === ENGINEDIR) continue;

            var config = Path.join(f, "config.json");

            var stat = FS.statSync(f);
            if (stat.isDirectory()) {
                this.output(" (dir)");
                if (FS.existsSync(config)) {
                    // this.addGame(f)
                    games.push(f);
                } else {
                    FS.readdirSync(f).sort().forEach((sub) => {
                        files.push(Path.join(f, sub));
                    });
                }
            }
        }

        games.sort().forEach((g) => {
            this.addGame(g);
        });
    },

    addGame: function(path) {
        var config;
        try {
            config = JSON.parse(FS.readFileSync(Path.join(path, "config.json")));
        } catch (e) {
            this.output("<span style='color:red'>Found, but failed to parse " + Path.join(path, "config.json") + ":", e, "</span>");
            config = {};
        }

        function scrub(text) {
            var scrubber = document.createElement('span');
            scrubber.innerText = text;
            var s = scrubber.innerHTML;
            s = s.replace('"', '&quot;');
            s = s.replace("'", '&apos;');
            return s;
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

        this.gameList.appendChild(li);
    },

    output: function(/* ... */) {
        var s = '';
        for (let i in arguments) {
            if (i > 0) s += " ";
            s += arguments[i].toString();
        }
        s = s.trim() + "\n";
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
        this.output("Building engine...");
        this.build(Path.join(ENGINEDIR, "src"), Path.join('..', 'resources', 'app', 'Egg.js'))
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

    build: function(buildPath, outputFile) {
        return new Promise((resolve, reject) => {
            this.output("<span style='color:white'>[ Building " + buildPath + " ]</span>")

            // TODO copy all the stuff we need into a lib/ directory in the game
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

            var tsc = Child.fork(Path.join(ENGINEDIR, 'src', 'typescript', 'tsc.js'), [
                '--project', buildPath,
                '--out', Path.join(buildPath, outputFile)
            ], { silent: true, env: {"ATOM_SHELL_INTERNAL_RUN_AS_NODE":"0"} });

            tsc.stdout.on('data', this.output.bind(this));
            tsc.stderr.on('data', this.output.bind(this));

            tsc.on('exit', (returnCode) => {
                if (!returnCode) {
                    this.output(" - Built " + Path.join(buildPath, outputFile));
                    this.output("<span style='color:#0f0'>[ Success ]</span>");
                    resolve();
                } else {
                    this.output("<span style='color:red'>[ FAILURE (code: " + returnCode + ") ]</span>");
                    reject();
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
                '--target', 'ES5',
                '--name', 'Egg Engine',
                srcPath
            ], { silent: true, env: {"ATOM_SHELL_INTERNAL_RUN_AS_NODE":"0"} });

            typedoc.stdout.on('data', this.output.bind(this));
            typedoc.stderr.on('data', this.output.bind(this));

            typedoc.on('exit', (returnCode) => {
                if (!returnCode) {
                    this.output("<span style='color:#0f0'>[ Success ]</span>");
                    resolve();
                } else {
                    this.output("<span style='color:red'>[ FAILURE (code: " + returnCode + ") ]</span>");
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
        this.prompt("Enter a name for the new project")
            .then((name) => {
                this.copyTemplate(name);
            }, (e) => {
                if (e) {
                    this.output('<span style="color:red">Error: ' + e.toString() + '</span>');
                }
            });
    },

    copyTemplate: function(name) {
        var path = name.replace(/\W+/g, '');
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
