'use strict';

const FS = require('fs-extra');
const Child = require('child_process');
const Path = require('path');
const Process = require('process');
const glob = require('glob');

global.ARTIFACTDIR = Path.resolve('../build');
global.IDEDIR = Path.resolve('.');
global.PLAYERDIR = Path.resolve('player');
global.ENGINEDIR = Path.resolve('..', 'src-engine')


let gameLibraries = JSON.parse(localStorage.getItem('gameLibraries')) || [
    Path.resolve(global.IDEDIR, 'examples')
];
let libPaths = localStorage.getItem('libs');
if (!libPaths) {
    localStorage.setItem('libs', JSON.stringify([
        Path.resolve('kits'),
    ]));
}

const EngineStatus = require('./EngineStatus');
const Library = require('./Library');
const GameOverlay = require('./GameOverlay');

const exportDesktop = require('./export-desktop');
const exportWeb = require('./export-web');

require('module').globalPaths.push(IDEDIR);

let taskQueue = [];

window.Manager = {
    export: exportDesktop.export,
    exportToWeb: exportWeb.export,

    start: function() {
        css('manager.css');

        let controlsArea = $('#controls');
        let engineSrcExists = false;

        this.controls = $('#controls');
        this.gameList = $('#game-list');
        this.outputContainer = $('#output');
        this.dialogContainer = $('#dialogs');
        this.recompileInterval = null;
        this.activeGame = null;
        this.override = null;
        this.loadOverrides();

        // set up engine src watch...

        try {
            FS.accessSync(ENGINEDIR);
            engineSrcExists = true;
        } catch (e) {
            console.log("->", e);
            // this just means we're running in 'shipped' mode (or something has happened to src-engine)
        }

        if (engineSrcExists) {
            EngineStatus.add(controlsArea, () => this.recompileEngine());
            EngineStatus.set('checking');

            var lastCompilation = 0;
            var cozyJS = Path.join(PLAYERDIR, "Cozy.js")
            if (FS.existsSync(cozyJS)) {
                lastCompilation = FS.statSync(cozyJS).mtime.getTime();
            }
            var srcFiles = [ ENGINEDIR ];
            var f, stat;
            this.recompileNeeded = false;
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
                EngineStatus.set('ready');
            }

            FS.watch(ENGINEDIR, { persistent: true, recursive: true }, (e, filename) => {
                if (EngineStatus.get() !== 'compiling') {
                    EngineStatus.set('dirty');
                }
                if (this.recompileInterval) {
                    clearInterval(this.recompileInterval);
                }
                this.recompileInterval = setInterval(() => this.recompileEngine(), 3000);
            });
        }

        this.controls.onclick = (e) => {
            var target = e.target;
            var action = target.getAttribute('data-action');
            switch (action) {
                case 'docs':
                    Electron.ipcRenderer.send('control-message', { command: 'view-docs' });
                    break;
                case 'addlibrary':
                    this.addLibrary();
                    break;
                case 'settings':
                    this.settingsDialog();
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

        // TODO move into Library.js?
        this.gameList.onclick = (e) => {
            var target = e.target;
            while (target && target !== this.gameList && target.tagName.toLowerCase() !== 'li') {
                target = target.parentNode;
            }
            if (!target || target === this.gameList) return;

            GameOverlay.show(target.getAttribute('data-path'));

            // if (this.activeGame && this.activeGame === target) {
            //     this.activeGame.classList.remove('active');
            //     this.activeGame = null;
            // } else {
            //     if (this.activeGame) {
            //         this.activeGame.classList.remove('active');
            //     }
            //     target.classList.add('active');
            //     this.activeGame = target;
            // }
        }

        this.pumpQueue();

        this.output("Cozy Project Manager loaded.\n");
    },

    queueTask: function(f) {
        taskQueue.push({
            func: f
        });
    },

    pumpQueue: function() {
        window.requestAnimationFrame(this.pumpQueue.bind(this));
        if (taskQueue.length > 0) {
            if (!taskQueue[0].promise) {
                try {
                    taskQueue[0].promise = taskQueue[0].func();
                } catch(e) {
                    this.output("<span style='color:red'>[ ERROR (" + e.toString() + ") ]</span>");
                    this.output("<span style='color:red'>Aborting all queued tasks.</span>\n");
                    taskQueue = [];
                }
                taskQueue[0].promise.then(() => {
                    taskQueue.shift();
                }, () => {
                    this.output("Aborting all queued tasks.");
                    this.output("<span style='color:red'>Aborting all queued tasks.</span>\n");
                    taskQueue = [];
                });
            }
        }
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

    removeLibrary: function(lib) {
        let index = gameLibraries.findIndex((e) => e === lib.path);
        if (index > -1) {
            this.gameList.removeChild(lib.getEl());
            gameLibraries.splice(index, 1);
            localStorage.setItem('gameLibraries', JSON.stringify(gameLibraries));
        }
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

    newGameDialog: function(library) {
        return new Promise((resolve, reject) => {
            var dialog = document.createElement('form');
            dialog.innerHTML = `
                <div class="text">New Game in ${library}</div>
                Folder: <input type="text" name="path">
                Name: <input type="text" name="name">
                <div class="buttons">
                    <button class="confirm">OK</button>
                    <button class="cancel">Cancel</button>
                </div>
            `;
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

    settingsDialog() {
        return new Promise((resolve, reject) => {
            let dialog = document.createElement('form');
            let libs = localStorage.getItem('libs') || '[]';
            dialog.innerHTML = `
                <div class="text">Library Paths</div>
                <textarea name="libs" rows="10" cols="40">${JSON.parse(libs).join("\n")}</textarea>
                <div class="text">One directory per line.</div>
                <div class="buttons">
                    <button class="confirm">OK</button>
                    <button class="cancel">Cancel</button>
                </div>
            `;
            dialog.onsubmit = (e) => {
                e.preventDefault();
            };
            dialog.querySelector('button.confirm').onclick = () => {
                let libValue = dialog.querySelector('textarea[name=libs]').value.split("\n");
                console.log(">>>>", dialog.querySelector('textarea[name=libs]').value);
                localStorage.setItem('libs', JSON.stringify(libValue));
                this.dialogContainer.removeChild(dialog);
                resolve();
            }
            dialog.querySelector('button.cancel').onclick = () => {
                this.dialogContainer.removeChild(dialog);
                reject();
            }

            this.dialogContainer.appendChild(dialog);

            dialog.querySelector('textarea[name=libs]').focus();
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
        if (this.recompileInterval) {
            clearTimeout(this.recompileInterval);
            this.recompileInterval = null;
        }
        this.queueTask(() => {
            EngineStatus.set('compiling');

            this.output("");
            return this.buildEngine()
                .then(() => {
                    return this.doc(Path.join(ENGINEDIR, "Cozy.ts"), Path.join("docs"))
                }, () => {
                    if (this.recompileInterval) {
                        return this.recompileEngine();
                    } else {
                        EngineStatus.set('error');
                        return Promise.reject();
                    }
                })
                .then(() => {
                    if (this.recompileInterval !== null) {
                        return this.recompileEngine();
                    } else {
                        EngineStatus.set('ready');
                    }
                }, () => {
                    if (this.recompileInterval !== null) {
                        return this.recompileEngine();
                    } else {
                        EngineStatus.set('error');
                    }
                });
        });
    },

    fork: function(cmd, params, fparams) {
        return new Promise((resolve, reject) => {
            let forkparams = {
                env: {
                    'ELECTRON_RUN_AS_NODE':true
                },
                stdio: [ 'ignore', 'pipe', 'pipe', 'ipc' ]
            };
            Object.assign(forkparams, fparams);

            let childproc = Child.fork(cmd, params, forkparams);

            childproc.stdout.on('data', (s) => this.output(s.toString().trim()));
            childproc.stderr.on('data', (s) => this.output(s.toString().trim()));
            childproc.on('exit', (returnCode) => returnCode ? reject(returnCode) : resolve());
        })
    },

    buildGame: function(buildPath, target) {
        let gameconfig;
        try {
            gameconfig = JSON.parse(FS.readFileSync(Path.join(buildPath, "config.json")));
        } catch(e) {
            this.output("<span style='color:red'>[ ERROR (" + e.toString() + ") ]</span>\n");
            return Promise.reject();
        }

        let srcRoot = Path.join(buildPath, gameconfig.main || 'main.ts');
        let displayName = scrub(gameconfig.title ? gameconfig.title + " (" + buildPath + ")" : buildPath);
        this.output("<hr>\n<span style='color:white'>[ Building " + displayName + " ]</span>")

        let tsconfig = {
            compileOnSave: false,
            compilerOptions: {
                removeComments: true,
                sourceMap: false,
                declaration: false,
                target: "ES2017",
                module: "commonjs",
                moduleResolution: "Node",
                baseUrl: ".",
                paths: {
                    "Cozy": [Path.resolve(Path.join(IDEDIR, "Cozy" + (target ? '-' + target : '') + ".js"))]
                }
            },
            files: [
                // Path.resolve(Path.join(IDEDIR, "..", "node_modules", "electron", "electron.d.ts")), // TODO remove?
                Path.resolve(Path.join(PLAYERDIR, "Cozy.d.ts")),
                Path.resolve(srcRoot)
            ]
        };

        let wpconfig = {
            entry: [
                srcRoot
            ],
            externals: {
                Cozy: 'Cozy'
            },
            output: {
                path: Path.resolve(buildPath),
                filename: 'main.js',
                library: 'compiledGame',
                libraryTarget: target === 'web' ? 'window' : 'global',
                umdNamedDefine: true
            },
            resolve: {
                alias: {},
                extensions: ['.js','.json','.ts']
            }
        };

        // if (target === 'web') {
        //     wpconfig.__TSCOMPILEROPTIONS = {
        //         paths: {
        //             FileSystemImplementation: [ Path.resolve(Path.join(IDEDIR, "..", 'FileSystem-Web.ts')) ]
        //         }
        //     };
        //     wpconfig.__RESOLVEALIASES = {
        //         FileSystemImplementation$: Path.resolve(Path.join(IDEDIR, "..", 'FileSystem-Web.ts'))
        //     }
        // }
        
        if (gameconfig.lib) {
            let availableLibs = (JSON.parse(localStorage.getItem('libs')) || []).reduce((list, root) => {
                console.log("[root]:", root);
                let libs = glob.sync("**/lib.json", { cwd: root });
                for (let lib of libs) {
                    let libconfig;
                    try {
                        libconfig = JSON.parse(FS.readFileSync(Path.join(root, lib)));
                    } catch(e) {
                        this.output("<span style='color:red'>[ ERROR (" + e.toString() + ") ]</span>\n");
                    }
                    console.log("->", libconfig);
                    list[libconfig.id] = [Path.join(root, Path.dirname(lib)), Path.join(root, Path.dirname(lib), libconfig.main)];
                }
                return list;
            }, {});
            console.log(">>>", availableLibs);

            for (let key of gameconfig.lib) {
                console.log("->", key);
                tsconfig.compilerOptions.paths[key] = [availableLibs[key][1]];
                wpconfig.resolve.alias[key + '$'] = availableLibs[key][1];
                wpconfig.resolve.alias[key] = availableLibs[key][0];
            }
        }

        console.log('tsconfig', tsconfig);
        console.log('wpconfig', wpconfig);

        let tsconfigPath = Path.join(buildPath, "tsconfig.json");
        FS.writeFileSync(tsconfigPath, JSON.stringify(tsconfig));

        return this.fork(Path.join(IDEDIR, 'pack'), [ JSON.stringify(wpconfig) ])
            .then(() => {
                this.output(" - Built " + Path.join(buildPath, 'main.js'));
                try {
                    FS.unlinkSync(tsconfigPath);
                    this.output("<span style='color:#0f0'>[ Success ]</span>\n");
                } catch (e) {
                    this.output(e);
                    this.output("<span style='color:red'>[ CLEANUP FAILURE ]</span>\n");
                    return Promise.reject();
                }
                return Promise.resolve();
            }, (errorCode) => {
                if (errorCode === 2) {
                    this.output("Webpack failed to start!");
                }
                this.output("<span style='color:red'>[ BUILD FAILURE ]</span>\n");
                return Promise.reject();
            });
    },

    buildEngine: function(target) {
        this.output("<hr>\n<span style='color:white'>[ Building core engine ]</span>")

        let electronCfg = {
            // devtool: 'source-map',
            entry: Path.resolve(ENGINEDIR, 'Cozy.ts'),
            target: 'electron-renderer',
            output: {
                path: ARTIFACTDIR,
                library: 'Cozy',
                filename: 'cozy-electron.js',
                libraryTarget: 'global',
                umdNamedDefine: true
            },
            plugins: {
                DTSBundle: {
                    name: 'Cozy',
                    main: 'build/Cozy.d.ts',
                    out: 'cozy-build.d.ts',
                }
            },
        };

        let webCfg = {
            // devtool: 'source-map',
            entry: Path.resolve(ENGINEDIR, 'Cozy.ts'),
            target: 'web',
            output: {
                path: ARTIFACTDIR,
                library: 'Cozy',
                filename: 'cozy-web.js',
                libraryTarget: 'window',
                umdNamedDefine: true
            },
            plugins: {
                DTSBundle: {
                    name: 'Cozy',
                    main: Path.resolve(ARTIFACTDIR, 'Cozy.d.ts'),
                    out: 'cozy-build.d.ts',
                }
            },
            __TSCOMPILEROPTIONS: {
                paths: {
                    'pixi.js': [ Path.resolve(PLAYERDIR, 'lib/pixi.min.js') ],
                    fs: [ './web-polyfill/fs.ts' ],
                    path: [ './web-polyfill/path.ts' ],
                    process: [ './web-polyfill/process.ts' ]
                }
            },
            __RESOLVEALIASES: {
                'pixi.js$': Path.resolve(PLAYERDIR, 'lib/pixi.min.js'),
                fs$: './web-polyfill/fs.ts',
                path$: './web-polyfill/path.ts',
                process$: './web-polyfill/process.ts'
            },
        };

        let buildPromises = [
            this.fork(Path.join(IDEDIR, 'pack'), [ JSON.stringify(webCfg) ]),
            this.fork(Path.join(IDEDIR, 'pack'), [ JSON.stringify(electronCfg) ]),
        ];

        return Promise.all(buildPromises)
            .then(() => {
                this.output(" - Built engine");
                try {
                    FS.renameSync(Path.join(ARTIFACTDIR, 'cozy-electron.js'), Path.join(PLAYERDIR, 'Cozy.js'));
                    FS.renameSync(Path.join(ARTIFACTDIR, 'cozy-web.js'), Path.join(PLAYERDIR, 'Cozy-web.js'));
                    FS.renameSync(Path.join(ARTIFACTDIR, 'cozy-build.d.ts'), Path.join(PLAYERDIR, 'Cozy.d.ts'));
                    // FS.renameSync(Path.join(PLAYERDIR, 'cozy-build.js.map'), Path.join(PLAYERDIR, 'Cozy.js.map'))
                    this.output("<span style='color:#0f0'>[ Success ]</span>\n");
                } catch (e) {
                    this.output(e);
                    this.output("<span style='color:red'>[ CLEANUP FAILURE ]</span>\n");
                    return Promise.reject();
                }
                return Promise.resolve();
            }, (errorCode) => {
                if (errorCode === 2) {
                    this.output("Webpack failed to start!");
                }
                this.output("<span style='color:red'>[ BUILD FAILURE ]</span>\n");
                return Promise.reject();
            });
    },

    build: function(buildParams) {
        buildParams.push('--target', 'ES6');
        return this.fork(Path.join('node_modules', 'typescript', 'bin', 'tsc'), buildParams);
    },

    doc: function(srcPath, outputPath) {
        return new Promise((resolve, reject) => {
            this.output(
                "<span style='color:white'>[ Generating documentation ]</span>\n" +
                " - source:      " + srcPath + "\n" +
                " - destination: " + outputPath
            );

            this.fork(
                Path.join(IDEDIR, 'builddoc'), [
                    '--out', outputPath,
                    '--mode', 'file',
                    '--target', 'ES6',
                    '--name', 'Cozy Engine',
                    // '--includeDeclarations',
                    srcPath, 'node_modules/electron/electron.d.ts'
                ]
            ).then(() => {
                this.output("<span style='color:#0f0'>[ Success ]</span>\n");
                resolve();
            }, (code) => {
                this.output("<span style='color:red'>[ FAILURE (code: " + code + ") ]</span>\n");
                reject(code)
            });
        });
    },

    newGame: function(library) {
        this.newGameDialog(library)
            .then((values) => {
                this.copyTemplate(library, values);
            }, (e) => {
                if (e) {
                    this.output('<span style="color:red">Error: ' + e.toString() + '</span>\n');
                }
            });
    },

    copyTemplate: function(root, args) {
        var name = args.name;
        var path = Path.join(root, args.path);

        return new Promise((resolve, reject) => {
            this.output('');
            this.output('<strong>[ Creating new game, ' + name + ']')
            var templateDir = Path.join(IDEDIR, "game_template");

            if (!FS.existsSync(path)) {
                this.output("Creating", path);
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
                    contents = contents.replace(/\$GAMEPATH\$/g, args.path);
                    FS.writeFileSync(Path.join(path, filename), contents);
                    this.output("&nbsp; ->", Path.join(path, filename));
                });
                resolve();
            }
        });
    }
};
