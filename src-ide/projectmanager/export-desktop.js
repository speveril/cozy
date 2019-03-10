// TODO this is kind of messy; this function could only ever work put into the Manager object

const FS = require('fs-extra');
const os = require('os');
const Path = require('path');
const packager = require('electron-packager');
const process = require('process');
const glob = require('glob');
const png2icons = require('png2icons');

const PLAYERDIR = Path.resolve('src-player');

module.exports = { 
    export(srcPath, outPath) {
        var config = JSON.parse(FS.readFileSync(Path.join(srcPath, "config.json")));
        var exportConfig = config.export || {};

        delete config.export;

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
            ].concat(patterns || []);

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

        let icon = config.icon;
        if (!icon) {
            icon = 'cozy.ico';
        } else {
            if (icon.match(/.png$/)) {
                let pngsrc = FS.readFileSync(Path.join(srcPath, icon));
                let iconsrc = null;
                let iconout = os.tmpdir() + 'cozy-output-icon';
                if (process.platform === 'darwin') {
                    iconsrc = png2icons.createICNS(pngsrc, png2icons.BILINEAR, 0);
                    iconout += '.icns';
                } else if (process.platform === 'win32') {
                    iconsrc = png2icons.createICO(pngsrc, png2icons.BILINEAR, 0, true);
                    iconout += '.ico';
                }

                if (iconsrc) {
                    FS.writeFileSync(iconout, iconsrc);
                    icon = iconout;
                }
            }
        }

        let packageConfig = {
            dir: PLAYERDIR,
            out: outPath,
            electronVersion: process.versions.electron,
            name: (config.title ? config.title : 'Untitled Cozy Game') + '-' + config.version,
            executableName: exportConfig.executable ? exportConfig.executable : 'game',
            icon: icon,
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
                    cp(srcPath, Path.join(buildPath, 'g'), filter(exportConfig.exclude, srcPath));

                    let libRoots = JSON.parse(localStorage.getItem('libs')) || [];
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

                    // TODO clean up any generated ico or icns

                    // write game.html
                    let gameHTML = FS.readFileSync(Path.join(PLAYERDIR, 'x_game.html')).toString();
                    // TODO processing on gameHTML?
                    FS.writeFileSync(Path.join(buildPath, 'game.html'), gameHTML);

                    callback();
                }
            ],
        };

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
    }
};