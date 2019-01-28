import * as Engine from './Engine';

/*
TODO:
    - write a file manifest at build time, include it in the web version; this will describe
      all of the files that the pretend file system knows about
    - load manifest at initialization
    - write glob, Directory.read, etc etc to use the file manifest table rather than
      actually searching directories (since we can't list a directory's contents over
      http(s))
    - how to deal with writing files, creating subdirs? store in indexdb, and add that to
      the manifest??
*/

let userdataKeyPrefix = '';
let virtualPath = '';

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

export function initFileSystem(gamePath:string, userdataPath:string):Promise<void> {
    virtualPath = gamePath;
    userdataKeyPrefix = userdataPath;

    return fetch('manifest.json')
        .then(() => {

        });
}


export class UserdataFile {
    static glob(pattern:string, opts?:any):Array<UserdataFile> {
        // let o = Object.assign({
        //     cwd: userdataStem
        // }, opts);

        // let files = window['glob'].sync(pattern, o);

        let found = [];
        // for (let f of files) {
        //     let fullpath = path.join(userdataStem, f);
        //     let stats = fs.statSync(fullpath);
        //     if (!stats.isDirectory()) {
        //         found.push(new UserdataFile(f));
        //     }
        // };

        return found;
    }

    private realpath:string;
    private _name:string;
    private data:Buffer;

    constructor(name:string) {
        this._name = name;
        // this.realpath = path.resolve(userdataStem, name);
        // if (this.realpath.indexOf(userdataStem) !== 0) {
        //     throw new Error("UserdataFile path must not use .. to escape userdata dir.");
        // }

        this.data = null;
    }

    get name():string { return this._name; }
    get ready():boolean {
        return this.data !== null;
    }

    stat():any {
    // stat():fs.Stats {
    //     return fs.statSync(this.realpath);
        return {};
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
        // if (this.data) {
        //     return Promise.resolve(this);
        // }

        // return fsPromises.readFile(this.realpath)
        //     .then((data) => {
        //         this.data = data;
        //         return Promise.resolve(this);
        //     }, (err) => {
        //         throw new Error(err);
        //     });
        return new Promise((resolve, reject) => {
            reject();
        });
    }

    write():Promise<void> {
        // try {
        //     fs.mkdirSync(path.dirname(this.realpath), { recursive: true });
        // } catch (e) {
        //     console.log(e);
        // }
        // return fsPromises.writeFile(this.realpath, this.data);
        return new Promise((resolve, reject) => {
            reject();
        });
    }
}

export class Directory {
    root:string;

    constructor(f:string) {
        // if (!fs.existsSync(f)) throw new Error("Couldn't open path, " + f + ".");
        // this.root = path.resolve(f);
    }

    get path():string {
        return this.root;
    }

    buildList(list:Array<string>):Array<Directory|File> {
        var found = [];
        // for (let f of list) {
        //     var fullpath = path.join(this.root, f);
        //     var stats = fs.statSync(fullpath);
        //     if (stats.isDirectory()) {
        //         found.push(new Directory(fullpath));
        //     } else {
        //         found.push(File.get(fullpath));
        //     }
        // };
        return found;
    }

    read():Array<Directory|File> {
        // return this.buildList(fs.readdirSync(this.root));
        return [];
    }

    find(p:string):Directory|File {
        // var stats = fs.statSync(path.join(this.root, p));
        // if (stats.isDirectory()) return new Directory(path.join(this.root, p));
        // return File.get(path.join(this.root, p));
        return null;
    }

    file(p:string):File {
        // return File.get(path.join(this.root, p));
        return null;
    }

    subdir(p:string):Directory {
        // var fullpath = path.normalize(path.join(this.root, p));
        // if (!fs.existsSync(fullpath)) {
        //     throw new Error("Directory " + p + " does not exist.");
        // }
        // return new Directory(path.join(this.root, p));
        return null;
    }

    glob(pattern:string, opts?:any):Array<Directory|File> {
        // let o = Object.assign({
        //     cwd: this.path
        // }, opts);
        // return this.buildList(window['glob'].sync(pattern, o));
        return [];
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
        // f = path.normalize(f);
        // let fullpath = path.resolve(f);
        // if (!fileCache[fullpath]) {
        //     fileCache[fullpath] = new File(f);
        // }
        // return fileCache[fullpath];
        return null;
    }

    constructor(f:string) {
        // this.filepath = path.resolve(f);
    }

    get ready():boolean {
        return this.data !== null;
    }

    load():Promise<File> {
        if (this.data) {
            return Promise.resolve(this);
        }

        // return fsPromises.readFile(this.filepath)
        //     .then((data) => {
        //         this.data = data;
        //         return Promise.resolve(this);
        //     }, (err) => {
        //         throw new Error(err);
        //     });
        return Promise.reject('not implemented');
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

    get extension():string                  { return ''; } //return path.extname(this.filepath); }
    get name():string                       { return ''; } //return path.basename(this.filepath); }
    get dirname():string                    { return ''; } //return path.dirname(this.filepath); }
    get dir():Directory                     { return null; } //return new Directory(this.dirname);  }
    get path():string                       { return this.filepath; }
    get url():string                        { return this.path.replace(/\\/g, "/"); }

    exists():Promise<boolean> {
        // return fsPromises.access(fs.constants.F_OK)
        //     .then((err) => {
        //         return !err;
        //     });
        return Promise.reject('not implemented');
    }

    // stat():fs.Stats {
    stat():any {
        // return fs.statSync(this.filepath);
        return {};
    }

    relativePath(dir:Directory):string {
        // return path.relative(dir.path, this.path);
        return '';
    }
}
