'use strict';


const FS = require('fs-extra');
const Child = require('child_process');
const Path = require('path');
const Process = require('process');

let gameLibraries = JSON.parse(localStorage.getItem('gameLibraries')) || []; // [Process.cwd(), Path.join(Process.cwd(), '..', 'examples')]; // TODO pull from LocalStorage or something!
const ENGINEDIR = '.engine'

const statusText = {
    'checking':     "Checking engine state...",
    'ready':        "Engine is ready",
    'dirty':        "Engine needs to be recompiled.",
    'compiling':    "Engine is compiling...",
    'error':        "Engine compilation failed. See output for details."
}

const EngineStatus = require('./EngineStatus');
const Library = require('./Library');

window.Manager = {
    start: function() {
        css('manager.css');

        let controlsArea = $('#controls');
        this.engineStatus = EngineStatus.add(controlsArea);

        this.controls = $('#controls');
        this.gameList = $('#game-list');
        this.outputContainer = $('#output');
        this.dialogContainer = $('#dialogs');
        this.recompileInterval = null;
        this.activeGame = null;
        this.override = null;

        this.loadOverrides();
        // this.rebuildGameList();

        this.setEngineStatus('checking');

        var lastCompilation = 0;
        var cozyJS = Path.join(ENGINEDIR, "resources", "app", "Cozy.js")
        if (FS.existsSync(cozyJS)) {
            lastCompilation = FS.statSync(cozyJS).mtime.getTime();
        }
        var srcFiles = [ Path.join(ENGINEDIR, "src") ];
        var f, stat;
        let recompileNeeded = false;
        while(srcFiles.length > 0) {
            f = srcFiles.shift();
            stat = FS.statSync(f);
            if (stat.isDirectory()) {
                FS.readdirSync(f).forEach((ff) => {
                    srcFiles.push(Path.join(f, ff));
                });
            } else {
                if (stat.mtime.getTime() > lastCompilation) {
                    this.recompileNeeded = true;
                    break;
                }
            }
        }

        if (this.recompileNeeded) {
            this.recompileEngine();
        } else {
            this.setEngineStatus('ready');
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
                case 'addlibrary':
                    this.addLibrary();
                    break;
                case 'NOSFX':
                case 'NOMUSIC':
                    if (target.classList.contains('off')) {
                        this.setOverride(action, null);
                    } else {
                        this.setOverride(action, true);
                    }
                    break;
            }
        };

        gameLibraries.forEach((d) => {
            let lib = new Library(d);
            this.gameList.appendChild(lib.getEl());
        });
        if (gameLibraries.length === 0) {
            let el = $create(`
                <div class="no-libraries">
                    <p>You haven't added any game libraries yet!</p>
                    <p>Click here to add one!</p>
                </div>
            `);
            el.onclick = () => this.addLibrary();
            this.gameList.appendChild(el);
        }

        // TODO move into Library.js
        this.gameList.onclick = (e) => {
            var target = e.target;
            while (target && target !== this.gameList && target.tagName.toLowerCase() !== 'li') {
                target = target.parentNode;
            }
            if (!target || target === this.gameList) return;

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

        this.output("Cozy project Manager loaded.\n");
    },

    addLibrary: function() {
        let dp = $create('<input class="directory-picker hidden" type="file" webkitdirectory>');
        dp.onchange = () => {
            let newpath = dp.files[0].path;
            if (gameLibraries.indexOf(newpath) !== -1) {
                alert("You've already got that library loaded!");
                return;
            }
            gameLibraries.push(newpath);
            localStorage.setItem('gameLibraries', JSON.stringify(gameLibraries));

            let lib = new Library(newpath);
            this.gameList.appendChild(lib.getEl());

            if (this.gameList.querySelector('.no-libraries')) {
                this.gameList.removeChild($('.no-libraries'));
            }
        };
        dp.click();
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
            case 'NOMUSIC':
            case 'NOSFX':
                el = $('#controls button[data-action=' + k + ']');
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

    output: function(...args) {
        var s = '';
        for (let i in args) {
            if (i > 0) s += " ";
            if (args[i] === null) {
                s += "<null>";
            } else if (args[i] === undefined) {
                s += "<undefined>";
            } else if (typeof args[i] === "Object") {
                s += JSON.stringify(args[i]);
            } else {
                s += args[i].toString();
            }
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
                    return Promise.reject();
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
            '--out', Path.join(ENGINEDIR, 'resources', 'app', 'cozy-build.js')
        ];

        this.output("<hr>\n<span style='color:white'>[ Building core engine ]</span>")
        return this.build(params)
            .then(() => {
                FS.renameSync(Path.join(ENGINEDIR, 'resources', 'app', 'cozy-build.js'), Path.join(ENGINEDIR, 'resources', 'app', 'Cozy.js'))
                FS.renameSync(Path.join(ENGINEDIR, 'resources', 'app', 'cozy-build.js.map'), Path.join(ENGINEDIR, 'resources', 'app', 'Cozy.js.map'))
                FS.renameSync(Path.join(ENGINEDIR, 'resources', 'app', 'cozy-build.d.ts'), Path.join(ENGINEDIR, 'resources', 'app', 'Cozy.d.ts'))
                this.output(" - Built engine");
                this.output("<span style='color:#0f0'>[ Success ]</span>\n");
            }, (code) => {
                FS.unlinkSync(Path.join(ENGINEDIR, 'resources', 'app', 'cozy-build.js'));
                FS.unlinkSync(Path.join(ENGINEDIR, 'resources', 'app', 'cozy-build.js.map'));
                FS.unlinkSync(Path.join(ENGINEDIR, 'resources', 'app', 'cozy-build.d.ts'));
                this.output("<span style='color:red'>[ BUILD FAILURE (code: " + code + ") ]</span>\n");
                return Promise.reject();
            });
    },

    build: function(buildParams) {
        buildParams.push('--target', 'ES6');
        return this.fork(Path.join(ENGINEDIR, 'resources', 'app', 'node_modules', 'typescript', 'bin', 'tsc'), buildParams);
    },

    export: function(srcPath, outPath) {
        var config = JSON.parse(FS.readFileSync(Path.join(srcPath, "config.json")));
        var exportConfig = config.export || {};

        delete config.export;

        var displayName = scrub(config.title ? `${config.title} (${srcPath})` : srcPath);

        return new Promise((resolve, reject) => {
            let fail = (e) => {
                this.output(e);
                this.output("<span style='color:red'>[ FAILURE ]</span>\n");
                reject(e);
                throw e;
            }

            var cp = (src, dest, filt) => {
                this.output(`Copy ${src} -> ${dest}`);
                try {
                    FS.copySync(src, dest, {
                        clobber: true,
                        preserveTimestamps: true,
                        filter: filt
                    });
                } catch (e) {
                    fail(e);
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

            // TODO put stuff into the package information; name, version, etc
            cp(Path.join(appPath, 'x_package.json'), Path.join(outAppPath, 'package.json'));

            try {
                config['width'] = config['width'] || 320;
                config['height'] = config['height'] || 240;
                config['title'] = config['title'] || 'Cozy';
                config['fullscreen'] = config['fullscreen'] || false;

                let launchJS = FS.readFileSync(Path.join(appPath, 'x_launch.js')).toString();
                launchJS = launchJS.replace('$$_PARAMS_$$', JSON.stringify(config));
                FS.writeFileSync(Path.join(outAppPath, 'launch.js'), launchJS);
            } catch(e) {
                fail(e);
            }

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

            let gameexec = (exportConfig.executable ? exportConfig.executable : 'cozy') + '.exe';
            let editcommands = [
                ['--set-version-string', '"OriginalFilename"', `"${gameexec}"`]
            ];

            if (config.icon) editcommands.push(['--set-icon', Path.join(srcPath, config.icon)]);
            if (exportConfig.copyright) editcommands.push(['--set-version-string', '"LegalCopyright"', `"${exportConfig.copyright}"`]);
            if (config.title) {
                editcommands.push(['--set-version-string', '"ProductName"', `"${config.title}"`]);
                editcommands.push(['--set-version-string', '"FileDescription"', `"${config.title}"`]);
            }
            if (config.version) {
                editcommands.push(['--set-product-version', `"${config.version}"`]);
                editcommands.push(['--set-file-version', `"${config.version}"`]);
            }


            let gameexecpath = Path.join(outPath, gameexec);
            let rcedit = Path.join(ENGINEDIR, 'tool', 'rcedit.exe');
            let command = 0;

            // I'd use execFileSync but you can't capture stderr with that because everything is garbage.
            let doNext = () => {
                if (command >= editcommands.length) {
                    this.output("<span style='color:#0f0'>[ Success ]</span>\n");
                    resolve();
                    return;
                }

                let params = editcommands[command++];
                this.output(`\n> ${rcedit} "${gameexecpath}" ${params.join(' ')}`);
                Child.exec(`"${rcedit}" "${gameexecpath}" ${params.join(' ')}`, (error, stdout, stderr) => {
                    if (stdout) this.output(stdout);
                    if (stderr) this.output(stderr);
                    if (!error) {
                        doNext();
                    } else {
                        fail(error);
                    }
                });
            };
            doNext();
        });
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
