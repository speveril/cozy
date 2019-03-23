#!/usr/bin/env node

const child_process = require('child_process');
const fs = require('fs-extra');
const packager = require('electron-packager');
const path = require('path');
const process = require('process');


process.chdir(__dirname);



function printUsageAndExit(code) {
    console.log(`\
Usage: node build.js [BUILD_CONFIG]
  Build config can either be a JSON object (be sure to wrap it in quotes and
  escape characters properly) or a path to a JSON file. If config is not
  provided, the default is 'build.json' in the current directory.
  
  Configuration Options:
    output      Directory where the exported engine should go.
    examples    Local location of the example games to include.
    kits        Local location of the kits to include.
  
  Example games: https://github.com/speveril/cozy-examples/
  Kits: (to be determined)
`);
    process.exit(code || 0);
}

let [nodeExe, thisScript, config] = process.argv;

// TODO better parsing; allow for more normal flag-based command line config?
if (!config || config[0] !== '{') {
    let configFile = config || 'build.json';

    try {
        config = JSON.parse(fs.readFileSync(configFile));
    } catch(e) {
        console.log("Could not read config: " + e + ".\n");
        printUsageAndExit(1);
    }
} else {
    try {
        config = JSON.parse(config);
    } catch(e) {
        console.log("Could not read config: " + e + ".\n");
        printUsageAndExit(1);
    }
}

// check for missing config keys
for (let k of ['output','examples','kits']) {
    if (!config[k]) {
        console.log(`Missing "${k}" configuration key.\n`);
        printUsageAndExit(1);
    }
}

// check for missing paths
for (let k of ['output','examples','kits']) {
    try {
        fs.accessSync(path.resolve(config[k]));
    } catch (e) {
        console.log(`Could not find path for "${k}", ${path.resolve(config[k])}. Path does not exist or is inaccessible.\n`);
        printUsageAndExit(1);
    }
}


console.log("Building Cozy for distribution.");
const packageInfo = JSON.parse(child_process.execSync('npm list --json --depth=0'));

console.log(" > Cozy version:    ", packageInfo.version);
console.log(" > Electron version:", packageInfo.dependencies.electron.version);

const outputDir = path.resolve(config.output);

// TODO webpack the ide first?

let packageConfig = {
    dir: 'src-ide/',
    out: outputDir,
    electronVersion: packageInfo.dependencies.electron.version,
    name: `cozy-${packageInfo.version}`,
    executableName: 'cozy',
    icon: path.resolve('src-ide', 'cozy.ico'),
    ignore: [],
    appVersion: packageInfo.version,
    appCopyright: 'Copyright (C) 2019 Shamus Peveril. All rights reserved.',
    extraResource: [
        'LICENSE',
        'LICENSES.chromium.html',

        // since the structure of the repo has src-ide has a subdir, the node_modules need to be copied over here;
        // if that structure changes, this may no longer be necessary
        'node_modules',
    ],
    afterCopy: [
        (buildPath, electronVersion, platform, arch, callback) => {
            let examplesPath = path.resolve(config.examples);

            // can't use withFileTypes in readdir yet :(
            for (let sub of fs.readdirSync(examplesPath)) {
                if (sub.indexOf('.git') === 0) continue;

                let stats = fs.statSync(path.resolve(examplesPath, sub));
                if (!stats.isDirectory()) continue;
                fs.copySync(path.resolve(examplesPath, sub), path.resolve(buildPath, 'examples', sub));
            }

            let kitsPath = path.resolve(config.kits);

            for (let sub of fs.readdirSync(kitsPath, { withFileTypes: true })) {
                if (sub.indexOf('.git') === 0) continue;

                let stats = fs.statSync(path.resolve(kitsPath, sub));
                if (!stats.isDirectory()) continue;
                fs.copySync(path.resolve(kitsPath, sub), path.resolve(buildPath, 'kits', sub));
            }

            callback();
        }
    ],
};

process.noAsar = true;
packager(packageConfig).then((appPaths) => {
    process.noAsar = false;
    console.log("Built.");
    process.exit(0);
});

