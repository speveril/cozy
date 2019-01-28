import * as Engine from './Engine';

// This file is a bit of a mess.
// I need the file system to behave quite differently running locally in Electron vs. running on
// the web in a browser, but I don't want to have to write conditionals in the games themselves.
// So, this sets up a sort of "virtual file system" for web, and uses real files for Electron.
// UNFORTUNATELY because of TypeScript/ES6 modules I haven't figured out yet how to conditionally
// use one or another file in the build because of course nothing good can ever happen. So, just
// mash it all together into one big mess.


// these imports happen conditionally if we're not targetting web
let fs = null;
let fsPromises = null;
let path = null;
let process = null;

const TARGET = global ? global['COMPILE_TARGET'] : window['COMPILE_TARGET'];

let fileManifest = {};
let userdataStem = null;
const fileCache = {};

/// Initialization functions /////////////////////////////////////////////////

function fetch(url):Promise<string> {
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();

        req.addEventListener('load', (evt) => {
            console.log("fetch loaded...", this, evt);
        });

        req.addEventListener('error', (evt) => {
            console.log("fetch failed...", this, evt);
        });

        req.open('GET', url, true);
    });
}

async function local_initFileSystem(gamePath:string, userdataPath:string):Promise<void> {
    [ fs, path, process ] = await Promise.all([
        import("fs"),
        // import("path"),
        // import("process")
    ]);
    // fsPromises = fs.promises;

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
}

async function web_initFileSystem(gamePath:string, userdataPath:string):Promise<void> {
    let manifestData = await fetch('manifest.json');
    console.log("manifestData????", manifestData);
}

export function initFileSystem(gamePath:string, userdataPath:string):Promise<void> {
    if (TARGET === 'web') {
        return web_initFileSystem(gamePath, userdataPath);
    } else {
        return local_initFileSystem(gamePath, userdataPath);
    }
}

/// User Data ////////////////////////////////////////////////////////////////

export class UserdataFile {
    static glob(pattern:string, opts?:any):Array<UserdataFile> {
        let found = [];

        if (TARGET === 'web') {
            // TODO
        } else {
            let o = Object.assign({
                cwd: userdataStem
            }, opts);

            let files = window['glob'].sync(pattern, o);

            for (let f of files) {
                let fullpath = path.join(userdataStem, f);
                let stats = fs.statSync(fullpath);
                if (!stats.isDirectory()) {
                    found.push(new UserdataFile(f));
                }
            };
        }

        return found;
    }

    private realpath:string;
    private _name:string;
    private data:Buffer;

    constructor(name:string) {
        this._name = name;

        if (TARGET === 'web') {
            // TODO
        } else {
            this.realpath = path.resolve(userdataStem, name);
            if (this.realpath.indexOf(userdataStem) !== 0) {
                throw new Error("UserdataFile path must not use .. to escape userdata dir.");
            }
        }

        this.data = null;
    }

    get name():string { return this._name; }
    get ready():boolean {
        return this.data !== null;
    }

    stat():any {
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

        if (TARGET === 'web') {
            // TODO
        } else {
            return fsPromises.readFile(this.realpath)
                .then((data) => {
                    this.data = data;
                    return Promise.resolve(this);
                }, (err) => {
                    throw new Error(err);
                });
        }
    }

    write():Promise<void> {
        if (TARGET === 'web') {
            // TODO 
            return new Promise((resolve, reject) => {
                resolve()
            });
        } else {
            try {
                fs.mkdirSync(path.dirname(this.realpath), { recursive: true });
            } catch (e) {
                console.log(e);
            }
            return fsPromises.writeFile(this.realpath, this.data);
        }
    }
}

/// Directory ////////////////////////////////////////////////////////////////

export class Directory {
    root:string;

    constructor(f:string) {
        if (TARGET === 'web') {
            // TODO
        } else {
            if (!fs.existsSync(f)) throw new Error("Couldn't open path, " + f + ".");
            this.root = path.resolve(f);
        }
    }

    get path():string {
        return this.root;
    }

    buildList(list:Array<string>):Array<Directory|File> {
        var found = [];
        if (TARGET === 'web') {
            // TODO
        } else {
            for (let f of list) {
                var fullpath = path.join(this.root, f);
                var stats = fs.statSync(fullpath);
                if (stats.isDirectory()) {
                    found.push(new Directory(fullpath));
                } else {
                    found.push(File.get(fullpath));
                }
            };
        }
        return found;
    }

    read():Array<Directory|File> {
        if (TARGET === 'web') {
            // TODO
            return [];
        } else {
            return this.buildList(fs.readdirSync(this.root));
        }
    }

    find(p:string):Directory|File {
        if (TARGET === 'web') {
            // TODO
            return null;
        } else {
            var stats = fs.statSync(path.join(this.root, p));
            if (stats.isDirectory()) return new Directory(path.join(this.root, p));
            return File.get(path.join(this.root, p));
        }
    }

    file(p:string):File {
        if (TARGET === 'web') {
            // TODO
            return null;
        } else {
            return File.get(path.join(this.root, p));
        }
    }

    subdir(p:string):Directory {
        if (TARGET === 'web') {
            // TODO
            return null;
        } else {
            var fullpath = path.normalize(path.join(this.root, p));
            if (!fs.existsSync(fullpath)) {
                throw new Error("Directory " + p + " does not exist.");
            }
            return new Directory(path.join(this.root, p));
        }
    }

    glob(pattern:string, opts?:any):Array<Directory|File> {
        if (TARGET === 'web') {
            // TODO
            return [];
        } else {
            let o = Object.assign({
                cwd: this.path
            }, opts);
            return this.buildList(window['glob'].sync(pattern, o));
        }
    }
}

/// File /////////////////////////////////////////////////////////////////////

export class File {
    // windows url looks like file:///c:/foo/bar and we want c:/foo/bar, mac looks like file:///foo/bar
    // and we want /foo/bar
    // TODO -- won't work in web
    static documentRoot:Directory = new Directory(window.location.href.replace("file://" + (process.platform === 'darwin' ? '' : '/'), "").replace(/game.html(\?.*)?/, ""));
    static root:string;

    private filepath:string;
    private data:Buffer = null;

    // TODO files that are in kits
    // TODO make sure you can't load things outside of the game directory

    static get(f:string):File {
        let fullpath;
        if (TARGET === 'web') {
            // TODO
        } else {
            f = path.normalize(f);
            fullpath = path.resolve(f);
        }
        if (!fileCache[fullpath]) {
            fileCache[fullpath] = new File(f);
        }
        return fileCache[fullpath];
    }

    constructor(f:string) {
        if (TARGET === 'web') {
            // TODO
        } else {
            this.filepath = path.resolve(f);
        }
    }

    get ready():boolean {
        return this.data !== null;
    }

    load():Promise<File> {
        if (this.data) {
            return Promise.resolve(this);
        }

        if (TARGET === 'web') {
            // TODO
            return new Promise((resolve, reject) => {
                resolve(null);
            });
        } else {
            return fsPromises.readFile(this.filepath)
                .then((data) => {
                    this.data = data;
                    return Promise.resolve(this);
                }, (err) => {
                    throw new Error(err);
                });
        }
    }

    getData(format?:string):any {
        if (!this.ready) {
            throw new Error(`File ${this.relativePath(Engine.gameDir())} isn't ready for use.`);
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

    get extension():string { 
        if (TARGET === 'web') {
            // TODO
        } else {
            return path.extname(this.filepath); 
        }
    }

    get name():string {
        if (TARGET === 'web') {
            // TODO
        } else {
            return path.basename(this.filepath);
        }
    }

    get dirname():string {
        if (TARGET === 'web') {
            // TODO
        } else {
            return path.dirname(this.filepath);
        }
    }

    get dir():Directory {
        if (TARGET === 'web') {
            // TODO
        } else {
            return new Directory(this.dirname);
        }
    }

    get path():string { 
        return this.filepath;
    }
    get url():string {
        if (TARGET === 'web') {
            // TODO
        } else {
            return "file:///" + this.path.replace(/\\/g, "/");
        }
    }

    exists():Promise<boolean> {
        if (TARGET === 'web') {
            // TODO
            return new Promise((resolve, reject) => {
                resolve();
            });
        } else {
            return fsPromises.access(fs.constants.F_OK)
                .then((err) => {
                    return !err;
                });
        }
    }

    stat():any {
        if (TARGET === 'web') {
            // TODO
        } else {
            return fs.statSync(this.filepath);
        }
    }

    relativePath(dir:Directory):string {
        if (TARGET === 'web') {
            // TODO
        } else {
            return path.relative(dir.path, this.path);
        }
    }
}
