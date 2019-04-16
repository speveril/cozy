const FS = require('fs-extra');
const Path = require('path');
const glob = require('glob');

module.exports = {
    export: function(srcPath, outPath) {
        let config = JSON.parse(FS.readFileSync(Path.join(srcPath, "config.json")));
        let exportConfig = config.export || {};
        delete config.export;

        outPath = Path.join(outPath, config.title + '-' + config.version + '-web');

        let displayName = scrub(config.title ? `${config.title} (${srcPath})` : srcPath);

        let fail = (e) => {
            this.output(e);
            this.output("<span style='color:red'>[ FAILURE ]</span>\n");
            throw e;
        }

        let cp = (src, dest, filt) => {
            this.output(`Copy ${src} -> ${dest}`);
            FS.copySync(src, dest, {
                clobber: false,
                preserveTimestamps: true,
                filter: filt
            });
        };

        let cp_rewrite = (src, dest, rewrites) => {
            try {
                let filedata = FS.readFileSync(src).toString();
                if (rewrites) {
                    for (let k of Object.getOwnPropertyNames(rewrites)) {
                        filedata = filedata.replace(k, rewrites[k]);
                    }
                }
                FS.writeFileSync(dest, filedata);
            } catch (e) {
                fail(e);
            }
        }

        let filter = (patterns, cwd) => {
            let exclude = [
                '*.ts', '*.js.map', '.*', './config.json',
            ].concat(exportConfig.exclude);

            let excludedFiles = new Set();
            for (let e of exclude) {
                if (e === undefined) continue; // with no/empty exclude you sometimes get these undefineds
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

        this.output(`<hr>\n<span style="color:white">[ Exporting ${displayName} for web ]</span>`);

        FS.ensureDirSync(outPath);
        FS.ensureDirSync(Path.join(outPath, "lib"));
        FS.ensureDirSync(Path.join(outPath, "g"));

        // just straight copies of some files...
        let files = [
            'game.css',
            Path.join('lib', 'libopenmpt.js'),
            Path.join('lib', 'libopenmpt.js.mem'),
            Path.join('lib', 'glob-web.js'),
            Path.join('lib', 'html2canvas.min.js'),
        ];
        files.forEach((f) => {
            cp(Path.join(PLAYERDIR, f), Path.join(outPath, f.replace(".min.", ".")));
        });

        // copy over files that are just copies, but renamed
        cp(Path.join(PLAYERDIR, 'Cozy-Web.js'), Path.join(outPath, 'Cozy.js'));

        let icon = config.icon;
        if (!icon) {
            icon = 'cozy.ico';
        } else {
            icon = Path.join(srcPath, icon);
        }
        cp(icon, Path.join(outPath, 'favicon.ico'));

        config['width'] = config['width'] || 320;
        config['height'] = config['height'] || 240;
        config['title'] = config['title'] || 'Cozy';
        config['fullscreen'] = config['fullscreen'] || false;
        config['libRoots'] = '["lib/"]';
        config['game'] = 'g';
        cp_rewrite(Path.join(PLAYERDIR, 'xweb_game.html'), Path.join(outPath, 'index.html'), {
            '$$_PARAMS_$$': JSON.stringify(config),
            '$$_FAVICON_$$': 'favicon.ico',
        });

        // copy over game itself
        var exclude = exportConfig.exclude || [];
        exclude.push('tsconfig.json');
        cp(srcPath, Path.join(outPath, "g"), filter(exclude, srcPath));

        try {
            FS.accessSync(Path.join(outPath, "g", "loading.html"));
        } catch (e) {
            // assume that we get into the catch block because loading.html doesn't exist...
            cp(Path.join(PLAYERDIR, 'loading.html'), Path.join(outPath, "g", "loading.html"));
        }

        // copy over libs
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
                cp(availableLibs[key].__path, Path.join(outPath, 'lib', key), filter(availableLibs[key].exclude, availableLibs[key].__path));
            }
        }

        // prune empty directories in output
        let paths = glob.sync(outPath + '/**/', { dot: true });
        
        paths = paths.sort().reverse();
        for (let p of paths) {
            let children = FS.readdirSync(p);
            if (children.length === 0) {
                FS.rmdirSync(p);
            }
        }

        // build file manifest
        let filemanifest = [];
        for (let f of glob.sync("**", { cwd:outPath })) {
            let stat = FS.statSync(Path.join(outPath, f));
            filemanifest.push({
                name: f,
                type: stat.isDirectory() ? 'directory' : 'file',
                mtime: stat.mtime,
            });
        }
        FS.writeFileSync(Path.join(outPath, 'filemanifest.json'), JSON.stringify(filemanifest));

        this.output("-- Done copying.");

        // TODO more steps?
        //  - uglifyjs
        //  - concat css
        //  - definable steps

        this.output(`\nSuccessfully exported to ${outPath}`);
        this.output("<span style='color:#0f0'>[ Success ]</span>\n");

        return Promise.resolve();
   },
}