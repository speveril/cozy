'use strict';
const FS = require('fs');
const Child = require('child_process');
const Path = require('path');
const Process = require('process');
const Remote = require('remote');

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
        this.gameList = $('#game-list ul')[0];
        this.outputContainer = $('#output')[0];
        this.engineStatus = $('#engine-status')[0];
        this.recompileInterval = null;

        var dir = FS.readdirSync(".");
        dir.forEach((f) => {
            if (f[0] === '.') return;

            var config = Path.join(f, "config.json");

            var stat = FS.statSync(f);
            if (stat.isDirectory() && FS.existsSync(config)) {
                this.addGame(f)
            }
        });

        this.setEngineStatus('ready');

        var lastCompilation = 0;
        var eggJS = Path.join("engine", "resources", "app", "Egg.js")
        if (FS.existsSync(eggJS)) {
            lastCompilation = FS.statSync(eggJS).mtime.getTime();
        }
        var srcFiles = [ Path.join("engine", "src") ];
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

        var engineWatch = FS.watch(Path.join("engine", "src"), { persistent: true, recursive: true }, (e, filename) => {
            if (this.engineStatus.className !== 'compiling') {
                this.setEngineStatus('dirty');
            }

            if (this.recompileInterval) {
                clearInterval(this.recompileInterval);
            }

            this.recompileInterval = setInterval(() => this.recompileEngine(), 3000);
        });

        this.engineStatus.onclick = () => this.recompileEngine();

        this.gameList.onclick = (e) => {
            var target = e.target;
            while (target && target.tagName.toLowerCase() !== 'li') {
                target = target.parentNode;
            }
            if (!target) return;

            var path = target.getAttribute('data-path');

            target.classList.add('compiling');

            this.output("");
            this.output("Playing " + path + "...");
            this.build(path, 'main.js')
                .then(() => {
                    target.classList.remove('compiling');
                    electron.ipcRenderer.send('control-message', {
                        command: 'play',
                        path: path
                    });
                });
        }

        document.onkeydown = (e) => {
            var keyCode = e.which;
            if (keyCode === 192 || keyCode === 122) { // ~ key or f11, opens console
                Remote.getCurrentWindow().toggleDevTools();
            }
        };

        this.output("Egg project browser loaded.");
    },

    addGame: function(path) {
        var config = JSON.parse(FS.readFileSync(Path.join(path, "config.json")));

        var title = config.title || Path.basename(path);

        var li = document.createElement('li');
        li.setAttribute('data-path', path);
        li.innerHTML = '<div class="title">' + title + '</div>' +
            '<div class="author">' + (config.author || '') + '</div>' +
            '<div class="info">' + (config.width && config.height ? config.width + ' x ' + config.height : '') + '</div>' +
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
        this.build(Path.join("engine", "src"), Path.join('..', 'resources', 'app', 'Egg.js'))
            .then(() => {
                return this.doc(Path.join("engine", "src", "Egg.ts"), Path.join("engine", "docs"))
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
            //     var contents = fs.readFileSync(__dirname + "/" + filename, { encoding: 'UTF-8' });
            //     fs.writeFileSync(gamePath + "/" + filename, contents);
            // });

            var tsc = Child.fork(Path.join('engine', 'src', 'typescript', 'tsc.js'), [
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

            var typedoc = Child.fork(Path.join('engine', 'resources', 'app', 'builddoc'), [
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

    // play: function(path) {
    //     return new Promise((resolve, reject) => {
    //         this.output("<span style='color:white'>[ Launching " + path + " ]</span>");
    //
    //         var game = Child.fork(Path.join('engine', 'resources', 'app', 'launch.js'), [
    //             path, '--debug'
    //         ], { silent: true, env: {"ATOM_SHELL_INTERNAL_RUN_AS_NODE":"0"} });
    //
    //         game.stdout.on('data', this.output.bind(this));
    //         game.stderr.on('data', this.output.bind(this));
    //
    //         game.on('exit', (returnCode) => {
    //             if (!returnCode) {
    //                 this.output("<span style='color:#0f0'>[ Finished successfully ]</span>");
    //                 resolve();
    //             } else {
    //                 this.output("<span style='color:red'>[ Exited with error code: " + returnCode + " ]</span>");
    //                 reject();
    //             }
    //         });
    //     });
    //
    //
    //     try {
    //         params = JSON.parse(fs.readFileSync(path.join(gamePath, "config.json")));
    //     } catch(e) {
    //         buildMessage("Couldn't load config.json in " + path.join(process.cwd(), gamePath) + ". " + e);
    //         next();
    //     }
    //     params['width'] = params['width'] || 320;
    //     params['height'] = params['height'] || 240;
    //
    //     var window = new BrowserWindow({
    //       'width':              params['width'],
    //       'height':             params['height'],
    //       'title':              params['title'] || 'Egg',
    //       'fullscreen':         params['fullscreen'] || false,
    //       'autoHideMenuBar':    true,
    //       'useContentSize':     true
    //     });
    //     window.once('close', function() {
    //         next();
    //     });
    //
    //     params.game = gamePath;
    //     if (options.debug) params.debug = true
    //     if (options.console) window.toggleDevTools();
    //
    //     window.loadURL("file://" + __dirname + "/game.html");
    //     window.webContents.once('did-finish-load', () => {
    //         window.webContents.send('start', params);
    //     });
    // }
};
