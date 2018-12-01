var fs = require('fs');
var fsPromises = fs.promises;
var path = require('path');
const process = require('process');

import * as FS from "fs"; // this imports type information, require() doesn't.


/// TODO
// Change things around so I'm not, in general, just loading files directly; instead, require an explicit
// "load" step which then makes the file available to the engine. Then, map loaders, sprite loaders, etc
// etc etc should just pull stuff from that cache, rather than loading things up on-demand. If something
// needs to be loaded that isn't in the cache, it should be an explicit asynchronous call. Then, all that
// data is available synchronously later. This is *already* how stuff like fonts and textures work; just
// expand that to all other file types.

export class Directory {
    private root:string;

    constructor(f:string) {
        this.root = path.resolve(f);
    }

    get path():string {
        return this.root;
    }

    exists():Promise<boolean> {
        return fsPromises.access(fs.constants.F_OK)
            .then((err) => {
                return !err;
            });
    }

    buildList(list:Array<string>):Promise<Array<Directory|File>> {
        interface PathStatPair {
            path:string,
            stats:FS.Stats
        };

        let pending = [];
        for (let f of list) {
            let fullpath = path.join(this.root, f);
            pending.push(fsPromises.stat(fullpath, {})
                .then((stats:FS.Stats) => {
                    return {path:fullpath, stats:stats};
                })
            );
        };

        return Promise.all(pending)
            .then((values:Array<PathStatPair>) => {
                let files:Array<Directory|File> = [];
                for (let value of values) {
                    if (value.stats.isDirectory()) {
                        files.push(new Directory(value.path));
                    } else {
                        files.push(new File(value.path));
                    }
                }
                return files;
            });
    }

    read():Promise<Array<Directory|File>> {
        return fsPromises.readdir(this.root)
            .then((rootfiles) => {
                return this.buildList(rootfiles);
            });
    }

    find(p:string):Promise<Directory|File> {
        return fsPromises.stat(path.join(this.root, p))
            .then((stats) => {
                if (stats.isDirectory()) return new Directory(path.join(this.root, p));
                return new File(path.join(this.root, p));
            });
    }

    file(p:string):File {
        return new File(path.join(this.root, p));
    }

    subdir(p:string, createIfDoesNotExist?:boolean):Directory {
        let fullpath = path.normalize(path.join(this.root, p));

        // TODO figure out how this works asynchronously
        if (createIfDoesNotExist && !fs.existsSync(fullpath)) {
            let pathPieces = fullpath.split(path.sep);
            let p = pathPieces[0];
            for (let i = 1; i < pathPieces.length; i++) {
                p += path.sep + pathPieces[i];
                if (!fs.existsSync(p)) {
                    fs.mkdirSync(p);
                }
            }
        }
        return new Directory(path.join(this.root, p));
    }

    glob(pattern:string, opts?:any):Promise<Array<Directory|File>> {
        return new Promise((resolve, reject) => {
            let o = Object.assign({
                cwd: this.path
            }, opts);
            window['glob'](pattern, o, (err, files) => {
                if (err) {
                    reject();
                } else {
                    return this.buildList(files);
                }
            });
        });
    }
}

export class File {
    // windows url looks like file:///c:/foo/bar and we want c:/foo/bar, mac looks like file:///foo/bar
    // and we want /foo/bar
    static documentRoot = new Directory(window.location.href.replace("file://" + (process.platform === 'darwin' ? '' : '/'), "").replace(/game.html(\?.*)?/, ""));
    filepath:string;

    constructor(f:string) {
        this.filepath = path.resolve(f);
    }

    get extension():string                  { return path.extname(this.filepath); }
    get name():string                       { return path.basename(this.filepath); }
    get dirname():string                    { return path.dirname(this.filepath); }
    get dir():Directory                     { return new Directory(this.dirname);  }
    get path():string                       { return this.filepath; }
    get url():string                        { return "file:///" + this.path.replace(/\\/g, "/"); }

    exists():Promise<boolean> {
        return fsPromises.access(fs.constants.F_OK)
            .then((err) => {
                return !err;
            });
    }

    stat():any {
        return fs.stat(this.filepath);
    }

    relativePath(dir:Directory):string {
        return path.relative(dir.path, this.path);
    }

    // TODO consider splitting binary format out into its own readBinary, so this can always
    //      return a Promise<string>, and it can return an ArrayBuffer
    read(format?:string):Promise<any> {
        return new Promise((resolve, reject) => {
            switch(format) {
                case 'json':
                    fs.readFile(this.filepath, { encoding: 'UTF-8' }, (err, data) => err ? reject(err) : resolve(JSON.parse(data)));
                    break;
                case 'binary':
                    fs.readFile(this.filepath, {}, (err, data) => err ? reject(err) : resolve(data.buffer));
                    break;
                default:
                    fs.readFile(this.filepath, { encoding: 'UTF-8' }, (err, data) => err ? reject(err) : resolve(data));
                    break;
            }
        });
    }

    // TODO like read(), consider splitting out a writeBinary()
    write(data:any, format?:string):Promise<void> {
        switch(format) {
            case 'json':
                return fsPromises.writeFile(this.filepath, JSON.stringify(data), { encoding: 'UTF-8' });
            case 'binary':
                return fsPromises.writeFile(this.filepath, data);
            default:
                return fsPromises.writeFile(this.filepath, data, { encoding: 'UTF-8' });
        }
    }
}
