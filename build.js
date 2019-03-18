#!/usr/bin/env node

const child_process = require('child_process');
const fs = require('fs-extra');
const packager = require('electron-packager');
const path = require('path');
const process = require('process');



process.chdir(__dirname);

// TODO real arg parsing
if (process.argv.length !== 3) {
    console.log('Usage: node build.js <output-dir>');
    process.exit(0);
}

let [nodeExe, thisScript, outputDir] = process.argv;
outputDir = path.resolve(outputDir);

console.log("Building Cozy for distribution.");
const packageInfo = JSON.parse(child_process.execSync('npm list --json --depth=0'));

console.log(" > Cozy version:    ", packageInfo.version);
console.log(" > Electron version:", packageInfo.dependencies.electron.version);


try {
    fs.accessSync(outputDir);
} catch (e) {
    console.log(`Could not find output directory, ${outputDir}. Please create it first.`);
    process.exit(1);
}

// outputDir = path.resolve(outputDir, `cozy-${process.platform}-${packageInfo.version}`);

// try {
//     fs.accessSync(outputDir);
//     console.log(`Building would overwrite existing directory, ${outputDir}. Please either update the version in package.json, or delete the output directory, and try again.`);
//     process.exit(1);
// } catch (e) {
//     // this is what we want
// }

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

