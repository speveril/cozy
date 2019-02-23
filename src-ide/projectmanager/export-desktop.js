// TODO this is kind of messy; this function could only ever work put into the Manager object

const FS = require('fs-extra');
const Path = require('path');
const packager = require('electron-packager');
const process = require('process');
const glob = require('glob');

const PLAYERDIR = Path.resolve('src-player');

module.exports = { 
    export(srcPath, outPath) {
        var config = JSON.parse(FS.readFileSync(Path.join(srcPath, "config.json")));
        var exportConfig = config.export || {};

        delete config.export;

        var displayName = scrub(config.title ? `${config.title} (${srcPath})` : srcPath);

        var cp = (src, dest, filt) => {
            this.output(`Copy ${src} -> ${dest}`);
            FS.copySync(src, dest, {
                clobber: true,
                preserveTimestamps: true,
                filter: filt
            });
        };

        let filter = (patterns, cwd) => {
            let exclude = [
                '*.ts', '*.js.map', '.*', './config.json',
            ].concat(exportConfig.exclude);

            let excludedFiles = new Set();
            for (let e of exclude) {
                for (let f of glob.sync(e, { 
                    cwd: cwd,
                    matchBase: true,
                })) {
                    // change / -> \ on Windows...
                    let proced = f.replace(/\//g, Path.sep);
                    if (proced.slice(-1) === Path.sep) proced = proced.slice(0, -1);
                    excludedFiles.add(proced);
                }
            }
            return (f) => {
                let localf = Path.relative(cwd, f);
                if (excludedFiles.has(localf)) {
                    return false;
                }

                let pathpcs = localf.split(Path.sep);
                pathpcs.pop(); // only care about the path at this point so pop off the filename

                if (pathpcs.length !== 0) {
                    let path = '';
                    for (let i = 0; i < pathpcs.length; i++) {
                        path += Path.join(path, pathpcs[i]);
                        if (excludedFiles.has(path)) {
                            return false;
                        }
                    }
                } 
                return true;
            }
        };

        let packageConfig = {
            dir: PLAYERDIR,
            out: outPath,
            electronVersion: process.versions.electron,
            name: config.title ? config.title : 'Untitled Cozy Game',
            executableName: exportConfig.executable ? exportConfig.executable : 'game',
            icon: Path.join(srcPath, config.icon),
            ignore: [
                /\.d\.ts$/,
                '.DS_Store',
                'Cozy-web.js',
                'launch.js',
                'package.json',
                'x_game.html',
                'xweb_game.html',
            ],
            // asar: true, // TODO? can't chdir to inside an asar, so need to rethink cwd for Cozy...
            afterCopy: [
                (buildPath, electronVersion, platform, arch, callback) => {
                    console.log("afterCopy->", buildPath);
                    cp(srcPath, Path.join(buildPath, 'g'), filter(exportConfig.exclude, srcPath));

                    let libRoots = JSON.parse(localStorage.getItem('libs')) || [];
                    let libJSONs = [];
                    let availableLibs = {};

                    for (let root of libRoots) {
                        for (let filepath of glob.sync(root + "/**/lib.json")) {
                            let data = JSON.parse(FS.readFileSync(filepath, { encoding: 'utf8' }));
                            availableLibs[data.id] = data;
                            availableLibs[data.id].__path = Path.dirname(filepath);
                        }
                    }

                    if (config['lib']) {
                        for (let key of config['lib']) {
                            if (!availableLibs[key]) {
                                throw new Error("Couldn't find required library '" + key + "'.");
                            }
                            this.output(`Including library <strong>${key}</strong>`);
                            cp(availableLibs[key].__path, Path.join(buildPath, 'lib', key), filter(availableLibs[key].exclude, availableLibs[key].__path));
                        }
                    }

                    // prune empty directories in output
                    let paths = glob.sync(buildPath + '/**/', { dot: true });
                    
                    paths = paths.sort().reverse();
                    for (let p of paths) {
                        let children = FS.readdirSync(p);
                        if (children.length === 0) {
                            FS.rmdirSync(p);
                        }
                    }

                    // TODO put stuff into the package information; name, version, etc
                    cp(Path.join(PLAYERDIR, 'x_package.json'), Path.join(buildPath, 'package.json'));

                    // write launch.js
                    config['width'] = config['width'] || 320;
                    config['height'] = config['height'] || 240;
                    config['title'] = config['title'] || 'Cozy';
                    config['fullscreen'] = config['fullscreen'] || false;
                    config['libRoots'] = '["lib/"]';
                    let launchJS = FS.readFileSync(Path.join(PLAYERDIR, 'x_launch.js')).toString();
                    launchJS = launchJS.replace('$$_PARAMS_$$', JSON.stringify(config));
                    FS.writeFileSync(Path.join(buildPath, 'launch.js'), launchJS);

                    // write game.html
                    let gameHTML = FS.readFileSync(Path.join(PLAYERDIR, 'x_game.html')).toString();
                    // TODO processing on gameHTML?
                    FS.writeFileSync(Path.join(buildPath, 'game.html'), gameHTML);

                    callback();
                }
            ],
        };

        if (config.icon) {
            // TODO convert to the appropriate format, and
            //packageConfig.icon = iconpath;
        }

        if (process.platform === 'darwin') {
            // TODO
            //packageConfig.osxSign = ;
        }
        if (process.platform === 'win32') {
            // TODO
            //packageConfig.win32metadata = ;
        }

        process.noAsar = true;
        return packager(packageConfig).then((appPaths) => {
            process.noAsar = false;
            this.output(`\nSuccessfully exported to ${appPaths[0]}`);
            this.output("<span style='color:#0f0'>[ Success ]</span>\n");
            // TODO post-export script?
            // TODO open up Explorer/Finder?
        });

        // return new Promise((resolve, reject) => {
        //     let fail = (e) => {
        //         this.output(e);
        //         this.output("<span style='color:red'>[ FAILURE ]</span>\n");
        //         reject(e);
        //         throw e;
        //     }

        //     var cp = (src, dest, filt) => {
        //         this.output(`Copy ${src} -> ${dest}`);
        //         try {
        //             FS.copySync(src, dest, {
        //                 clobber: true,
        //                 preserveTimestamps: true,
        //                 filter: filt
        //             });
        //         } catch (e) {
        //             fail(e);
        //         }
        //     }

        //     this.output(`<hr>\n<span style="color:white">[ Exporting ${displayName}]</span>`);

        //     var paths = [
        //         Path.join(outPath, "resources"),
        //         Path.join(outPath, "resources", "app"),
        //         Path.join(outPath, "resources", "app", "lib"),
        //         Path.join(outPath, "resources", "app", "g")
        //     ];

        //     paths.forEach((p) => {
        //         FS.ensureDir(p)
        //     });

        //     FS.readdirSync(ENGINEDIR).forEach((f) => {
        //         if (!FS.statSync(Path.join(ENGINEDIR, f)).isDirectory()) {
        //             if (f === 'cozy.exe' && exportConfig.executable) {
        //                 cp(Path.join(ENGINEDIR, f), Path.join(outPath, exportConfig.executable + '.exe'));
        //             } else {
        //                 cp(Path.join(ENGINEDIR, f), Path.join(outPath, f));
        //             }
        //         }
        //     });

        //     process.noAsar = true; // turn off asar support so it will copy these as files
        //     FS.readdirSync(Path.join(ENGINEDIR, "resources")).forEach((f) => {
        //         if (f.match(/.asar$/)) {
        //             cp(Path.join(ENGINEDIR, "resources", f), Path.join(outPath, "resources", f));
        //         }
        //     });
        //     process.noAsar = false;

        //     var appPath = Path.join(ENGINEDIR, "resources", "app");
        //     var outAppPath = Path.join(outPath, "resources", "app");

        //     var files = [
        //         'Cozy.js', 'game.css', 'game.html',
        //         Path.join('lib','glob.js'),
        //         Path.join('lib','pixi.min.js'),
        //     ];

        //     files.forEach((f) => cp(Path.join(appPath, f), Path.join(outAppPath, f.replace(".min.", "."))));

        //     // TODO put stuff into the package information; name, version, etc
        //     cp(Path.join(appPath, 'x_package.json'), Path.join(outAppPath, 'package.json'));

        //     try {
        //         config['width'] = config['width'] || 320;
        //         config['height'] = config['height'] || 240;
        //         config['title'] = config['title'] || 'Cozy';
        //         config['fullscreen'] = config['fullscreen'] || false;

        //         let launchJS = FS.readFileSync(Path.join(appPath, 'x_launch.js')).toString();
        //         launchJS = launchJS.replace('$$_PARAMS_$$', JSON.stringify(config));
        //         FS.writeFileSync(Path.join(outAppPath, 'launch.js'), launchJS);
        //     } catch(e) {
        //         fail(e);
        //     }

        //     var exclude = exportConfig.exclude || [];
        //     exclude.push(".ts$", ".js.map$");
        //     for (var i = 0; i < exclude.length; i++) {
        //         exclude[i] = new RegExp(exclude[i]);
        //     }

        //     cp(srcPath, Path.join(outAppPath, "g"), (f) => {
        //         for (var i = 0; i < exclude.length; i++) {
        //             if (f.match(exclude[i])) return false;
        //         }
        //         return true;
        //     });

        //     this.output("-- Done copying.");

        //     // TODO more steps?
        //     //  - uglifyjs
        //     //  - concat css
        //     //  - definable steps

        //     let gameexec = (exportConfig.executable ? exportConfig.executable : 'cozy') + '.exe';
        //     let editcommands = [
        //         ['--set-version-string', '"OriginalFilename"', `"${gameexec}"`]
        //     ];

        //     if (config.icon) editcommands.push(['--set-icon', Path.join(srcPath, config.icon)]);
        //     if (exportConfig.copyright) editcommands.push(['--set-version-string', '"LegalCopyright"', `"${exportConfig.copyright}"`]);
        //     if (config.title) {
        //         editcommands.push(['--set-version-string', '"ProductName"', `"${config.title}"`]);
        //         editcommands.push(['--set-version-string', '"FileDescription"', `"${config.title}"`]);
        //     }
        //     if (config.version) {
        //         editcommands.push(['--set-product-version', `"${config.version}"`]);
        //         editcommands.push(['--set-file-version', `"${config.version}"`]);
        //     }


        //     let gameexecpath = Path.join(outPath, gameexec);
        //     let rcedit = Path.join(ENGINEDIR, 'tool', 'rcedit.exe');
        //     let command = 0;

        //     // I'd use execFileSync but you can't capture stderr with that because everything is garbage.
        //     let doNext = () => {
        //         if (command >= editcommands.length) {
        //             this.output("<span style='color:#0f0'>[ Success ]</span>\n");
        //             resolve();
        //             return;
        //         }

        //         let params = editcommands[command++];
        //         this.output(`\n> ${rcedit} "${gameexecpath}" ${params.join(' ')}`);
        //         Child.exec(`"${rcedit}" "${gameexecpath}" ${params.join(' ')}`, (error, stdout, stderr) => {
        //             if (stdout) this.output(stdout);
        //             if (stderr) this.output(stderr);
        //             if (!error) {
        //                 doNext();
        //             } else {
        //                 fail(error);
        //             }
        //         });
        //     };
        //     doNext();
        // });
    }
};