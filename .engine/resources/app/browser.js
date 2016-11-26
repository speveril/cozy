'use strict';
const FS = require('fs-extra');
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
        this.activeGame = null;
        this.override = null;

        this.loadOverrides();
        this.rebuildGameList();

        this.setEngineStatus('ready');

        var lastCompilation = 0;
        var cozyJS = Path.join(ENGINEDIR, "resources", "app", "Cozy.js")
        if (FS.existsSync(cozyJS)) {
            lastCompilation = FS.statSync(cozyJS).mtime.getTime();
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
                case 'sfx':
                case 'music':
                    if (target.classList.contains('off')) {
                        this.setOverride(action, null);
                    } else {
                        this.setOverride(action, 0.0);
                    }
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
                if (this.activeGame && this.activeGame === target) {
                    this.activeGame.classList.remove('active');
                    this.activeGame = null;
                } else {
                    if (this.activeGame) {
                        this.activeGame.classList.remove('active');
                    }
                    target.classList.add('active');
                    this.activeGame = target;
                }
            }
        }

        document.querySelector('#game-list header .force-refresh').onclick = (e) => this.rebuildGameList();

        this.newGameFooter.onclick = () => this.newGame();

        this.output("Cozy project browser loaded.\n");
    },

    loadOverrides: function() {
        this.override = JSON.parse(localStorage.getItem('override')) || {};
        for (var k in this.override) {
            this.setOverride(k, this.override[k]);
        }
    },

    setOverride: function(k, v) {
        if (v === null) {
            delete this.override[k];
        } else {
            this.override[k] = v;
        }

        localStorage.setItem('override', JSON.stringify(this.override));

        // reconcile UI
        var el;
        switch (k) {
            case 'music':
            case 'sfx':
                el = document.querySelector('#controls button[data-action=' + k + ']');
                v === null ? el.classList.remove('off') : el.classList.add('off');
                break;
            default:
                break;
        }
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
                // TODO keep active game open
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
    },

    clickCompileAndRun: function(li, path) {
        li.classList.add('compiling');

        this.output("");
        this.buildGame(path)
            .then(() => {
                li.classList.remove('compiling');

                Electron.ipcRenderer.send('control-message', {
                    command: 'play',
                    path: path,
                    debug: true,
                    override: this.override
                });
            }, () => {
                li.classList.remove('compiling');
            });
    },

    clickEdit: function(li, path) {
        Electron.ipcRenderer.send('control-message', {
            command: 'edit',
            path: path,
        });
    },

    clickExport: function(li, path) {
        // TODO check for engine dirty flag, wait for that to compile?
        // maybe buildGame should just do that?

        var dirSelector = li.querySelector('input.directory-picker');

        dirSelector.onchange = () => {
            var outputPath = dirSelector.files[0].path;
            var existingFiles = FS.readdirSync(outputPath);

            dirSelector.onchange = null;
            dirSelector.value = null;

            if (existingFiles.length > 0) {
                if (!confirm(outputPath + " isn't empty, and some files may be overwritten. Continue?")) {
                    return;
                }
            }

            li.classList.add('compiling');

            this.output("");
            this.buildGame(path)
                .then(() => {
                    return this.export(path, outputPath);
                }).then(() => {
                    li.classList.remove('compiling');
                }, (e) => {
                    li.classList.remove('compiling');
                });
        }

        dirSelector.click();
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
                return this.doc(Path.join(ENGINEDIR, "src", "Cozy.ts"), Path.join(ENGINEDIR, "docs"))
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

    fork: function(cmd, params) {
        return new Promise((resolve, reject) => {
            var childproc = Child.fork(cmd, params, { silent: true, env: {"ATOM_SHELL_INTERNAL_RUN_AS_NODE":"0"} });
            childproc.stdout.on('data', (s) => this.output(s.toString().trim()));
            childproc.stderr.on('data', (s) => this.output(s.toString().trim()));
            childproc.on('exit', (returnCode) => returnCode ? reject(returnCode) : resolve());
        })
    },

    buildGame: function(buildPath) {
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
            '.engine/resources/app/Cozy.d.ts', srcRoot,
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
            '--out', Path.join(ENGINEDIR, 'resources', 'app', 'Cozy.js')
        ];

        this.output("<hr>\n<span style='color:white'>[ Building core engine ]</span>")
        return this.build(params)
            .then(() => {
                this.output(" - Built engine");
                this.output("<span style='color:#0f0'>[ Success ]</span>\n");
            }, (code) => {
                this.output("<span style='color:red'>[ BUILD FAILURE (code: " + code + ") ]</span>\n");
                return Promise.reject();
            });
    },

    build: function(buildParams) { //buildPath, outputFile) {
        buildParams.push('--target', 'ES6');
        return this.fork(Path.join(ENGINEDIR, 'resources', 'app', 'node_modules', 'typescript', 'bin', 'tsc'), buildParams);
    },

    export: function(srcPath, outPath) {
        var config = JSON.parse(FS.readFileSync(Path.join(srcPath, "config.json")));
        var exportConfig = config.export || {};
        var displayName = scrub(config.title ? `${config.title} (${srcPath})` : srcPath);

        return new Promise((resolve, reject) => {
            var cp = (src, dest, filt) => {
                this.output(`Copy ${src} -> ${dest}`);
                try {
                    FS.copySync(src, dest, {
                        clobber: true,
                        preserveTimestamps: true,
                        filter: filt
                    });
                } catch (e) {
                    this.output(e);
                    this.output("<span style='color:red'>[ FAILURE ]</span>\n");
                    reject(error);
                }
            }

            this.output(`<hr>\n<span style="color:white">[ Exporting ${displayName}]</span>`);

            var paths = [
                Path.join(outPath, "resources"),
                Path.join(outPath, "resources", "app"),
                Path.join(outPath, "resources", "app", "lib"),
                Path.join(outPath, "resources", "app", "g")
            ];

            paths.forEach((p) => {
                FS.ensureDir(p)
            });

            FS.readdirSync(ENGINEDIR).forEach((f) => {
                if (!FS.statSync(Path.join(ENGINEDIR, f)).isDirectory()) {
                    if (f === 'cozy.exe' && exportConfig.executable) {
                        cp(Path.join(ENGINEDIR, f), Path.join(outPath, exportConfig.executable + '.exe'));
                    } else {
                        cp(Path.join(ENGINEDIR, f), Path.join(outPath, f));
                    }
                }
            });

            process.noAsar = true; // turn off asar support so it will copy these as files
            FS.readdirSync(Path.join(ENGINEDIR, "resources")).forEach((f) => {
                if (f.match(/.asar$/)) {
                    cp(Path.join(ENGINEDIR, "resources", f), Path.join(outPath, "resources", f));
                }
            });
            process.noAsar = false;

            var appPath = Path.join(ENGINEDIR, "resources", "app");
            var outAppPath = Path.join(outPath, "resources", "app");

            var files = [
                'Cozy.js', 'game.css', 'game.html',
                Path.join('lib','glob.js'),
                Path.join('lib','pixi.min.js'),
                Path.join('lib','underscore.min.js')
            ];

            files.forEach((f) => cp(Path.join(appPath, f), Path.join(outAppPath, f.replace(".min.", "."))));

            cp(Path.join(appPath, 'x_launch.js'), Path.join(outAppPath, 'launch.js'));
            cp(Path.join(appPath, 'x_package.json'), Path.join(outAppPath, 'package.json'));

            var exclude = exportConfig.exclude || [];
            exclude.push(".ts$", ".js.map$");
            for (var i = 0; i < exclude.length; i++) {
                exclude[i] = new RegExp(exclude[i]);
            }

            cp(srcPath, Path.join(outAppPath, "g"), (f) => {
                for (var i = 0; i < exclude.length; i++) {
                    if (f.match(exclude[i])) return false;
                }
                return true;
            });

            this.output("-- Done copying.");

            // TODO more steps?
            //  - uglifyjs
            //  - concat css
            //  - definable steps

            var rceditParams = [
                Path.join(outPath, exportConfig.executable ? exportConfig.executable + '.exe' : 'cozy.exe')
            ];

            if (config.icon) rceditParams.push('--set-icon', Path.join(outAppPath, 'g', config.icon));
            if (config.title) rceditParams.push('--set-version-string', 'FileDescription', config.title);

            if (rceditParams.length < 2) {
                this.output("<span style='color:#0f0'>[ Success ]</span>\n");
                resolve();
                return;
            }

            this.output(`\n$ ${Path.join(ENGINEDIR, 'tool', 'rcedit.exe')} ${rceditParams.join(' ')}`);
            Child.execFile(Path.join(ENGINEDIR, 'tool', 'rcedit.exe'), rceditParams, (error, stdout, stderr) => {
                if (stdout) this.output(stdout);
                if (stderr) this.output(stderr);
                if (!error) {
                    this.output("<span style='color:#0f0'>[ Success ]</span>\n");
                    resolve();
                } else {
                    this.output("<span style='color:red'>[ FAILURE ]</span>\n");
                    reject(error);
                }
            });
        })
    },

    doc: function(srcPath, outputPath) {
        return new Promise((resolve, reject) => {
            this.output(
                "<span style='color:white'>[ Generating documentation ]</span>\n" +
                " - source:      " + srcPath + "\n" +
                " - destination: " + outputPath
            );

            this.fork(
                Path.join(ENGINEDIR, 'resources', 'app', 'builddoc'), [
                    '--out', outputPath,
                    '--mode', 'file',
                    '--target', 'ES6',
                    '--name', 'Cozy Engine',
                    srcPath
                ]
            ).then(() => {
                this.output("<span style='color:#0f0'>[ Success ]</span>\n");
                resolve();
            }, (code) => {
                this.output("<span style='color:red'>[ FAILURE (code: " + returnCode + ") ]</span>\n");
                reject(code)
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
