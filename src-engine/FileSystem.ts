import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import * as Engine from './Engine';

const fsPromises = require('fs').promises; // gross
let fileManifest = {};

/// TODO
// Change things around so I'm not, in general, just loading files directly; instead, require an explicit
// "load" step which then makes the file available to the engine. Then, map loaders, sprite loaders, etc
// etc etc should just pull stuff from that cache, rather than loading things up on-demand. If something
// needs to be loaded that isn't in the cache, it should be an explicit asynchronous call. Then, all that
// data is available synchronously later. This is *already* how stuff like fonts and textures work; just
// expand that to all other file types.

let userdataStem = null;
const fileCache = {};

export function initFileSystem(gamePath:string, userdataPath:string):Promise<void> {
    // see
    //  http://stackoverflow.com/a/26227660
    //  https://developer.apple.com/library/content/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html

    if (process.platform === 'darwin') { // MacOS
        userdataStem = process.env.HOME + '/Library/Application Support/';
    } else if (process.env.APPDATA) { // Windows
        userdataStem = process.env.APPDATA + '\\';
    } else { // Linux
        userdataStem = process.env.HOME + "/.";
    }
    userdataStem += userdataPath;

    fileManifest = {};

    File.root = gamePath;

    return new Promise((resolve, reject) => {
        resolve();
    });
}

export class UserdataFile {
    static glob(pattern:string, opts?:any):Array<UserdataFile> {
        let o = Object.assign({
            cwd: userdataStem
        }, opts);

        let files = window['glob'].sync(pattern, o);

        let found = [];
        for (let f of files) {
            let fullpath = path.join(userdataStem, f);
            let stats = fs.statSync(fullpath);
            if (!stats.isDirectory()) {
                found.push(new UserdataFile(f));
            }
        };

        return found;
    }

    private realpath:string;
    private _name:string;
    private data:Buffer;

    constructor(name:string) {
        this._name = name;
        this.realpath = path.resolve(userdataStem, name);
        if (this.realpath.indexOf(userdataStem) !== 0) {
            throw new Error("UserdataFile path must not use .. to escape userdata dir.");
        }

        this.data = null;
    }

    get name():string { return this._name; }
    get ready():boolean {
        return this.data !== null;
    }

    stat():fs.Stats {
        return fs.statSync(this.realpath);
    }

    getData(format?:string):any {
        if (!this.ready) {
            throw new Error(`File ${this.name} isn't ready for use.`);
        }

        switch (format) {
            case 'text':
                return this.data.toString();
            case 'json':
                return JSON.parse(this.data.toString());
            case 'xml':
                let parser = new DOMParser();
                return parser.parseFromString(this.data.toString(), "text/xml");
            case 'arraybuffer':
                return this.data.buffer;
            default:
                return this.data;
        }
    }

    setData(d:Buffer|string):void {
        if (d instanceof Buffer) {
            this.data = d;
        } else {
            this.data = Buffer.from(d, 'utf8');
        }
    }

    load():Promise<UserdataFile> {
        if (this.data) {
            return Promise.resolve(this);
        }

        return fsPromises.readFile(this.realpath)
            .then((data) => {
                this.data = data;
                return Promise.resolve(this);
            }, (err) => {
                throw new Error(err);
            });
    }

    write():Promise<void> {
        return fsPromises.writeFile(this.realpath, this.data);
    }
}

export class Directory {
    root:string;

    constructor(f:string) {
        if (!fs.existsSync(f)) throw new Error("Couldn't open path, " + f + ".");
        this.root = path.resolve(f);
    }

    get path():string {
        return this.root;
    }

    buildList(list:Array<string>):Array<Directory|File> {
        var found = [];
        for (let f of list) {
            var fullpath = path.join(this.root, f);
            var stats = fs.statSync(fullpath);
            if (stats.isDirectory()) {
                found.push(new Directory(fullpath));
            } else {
                found.push(File.get(fullpath));
            }
        };
        return found;
    }

    read():Array<Directory|File> {
        return this.buildList(fs.readdirSync(this.root));
    }

    find(p:string):Directory|File {
        var stats = fs.statSync(path.join(this.root, p));
        if (stats.isDirectory()) return new Directory(path.join(this.root, p));
        return File.get(path.join(this.root, p));
    }

    file(p:string):File {
        return File.get(path.join(this.root, p));
    }

    subdir(p:string, createIfDoesNotExist?:boolean):Directory {
        var fullpath = path.normalize(path.join(this.root, p));
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

    glob(pattern:string, opts?:any):Array<Directory|File> {
        let o = Object.assign({
            cwd: this.path
        }, opts);
        return this.buildList(window['glob'].sync(pattern, o));
    }
}


export class File {
    // windows url looks like file:///c:/foo/bar and we want c:/foo/bar, mac looks like file:///foo/bar
    // and we want /foo/bar
    static documentRoot:Directory = new Directory(window.location.href.replace("file://" + (process.platform === 'darwin' ? '' : '/'), "").replace(/game.html(\?.*)?/, ""));
    static root:string;

    private filepath:string;
    private data:Buffer = null;

    // TODO files that are in kits
    // TODO make sure you can't load things outside of the game directory

    static get(f:string):File {
        if (!fileCache[f]) {
            fileCache[f] = new File(f);
        }
        return fileCache[f];
    }

    constructor(f:string) {
        this.filepath = path.resolve(f);
    }

    get ready():boolean {
        return this.data !== null;
    }

    load():Promise<File> {
        if (this.data) {
            return Promise.resolve(this);
        }

        return fsPromises.readFile(this.filepath)
            .then((data) => {
                this.data = data;
                return Promise.resolve(this);
            }, (err) => {
                throw new Error(err);
            });
    }

    getData(format?:string):any {
        if (!this.ready) {
            throw new Error(`File ${this.name} isn't ready for use.`);
        }

        switch (format) {
            case 'text':
                return this.data.toString();
            case 'json':
                return JSON.parse(this.data.toString());
            case 'xml':
                let parser = new DOMParser();
                return parser.parseFromString(this.data.toString(), "text/xml");
            case 'arraybuffer':
                return this.data.buffer;
            default:
                return this.data;
        }
    }

    // TODO -- do I want/need these? --

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

    stat():Promise<fs.Stats> {
        return fsPromises.stat(this.filepath);
    }

    relativePath(dir:Directory):string {
        return path.relative(dir.path, this.path);
    }
}
