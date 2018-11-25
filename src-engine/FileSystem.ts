var fs = require('fs');
var path = require('path');
const process = require('process');

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
                found.push(new File(fullpath));
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
        return new File(path.join(this.root, p));
    }

    file(p:string):File {
        return new File(path.join(this.root, p));
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
    get exists():boolean                    { return fs.existsSync(this.filepath); }
    get url():string                        { return "file:///" + this.path.replace(/\\/g, "/"); }

    stat():any {
        return fs.statSync(this.filepath);
    }

    relativePath(dir:Directory):string {
        return path.relative(dir.path, this.path);
    }

    read(format?:string):any {
        switch(format) {
            case 'json':
                return JSON.parse(fs.readFileSync(this.filepath, { encoding: 'UTF-8'}));
            case 'binary':
                return fs.readFileSync(this.filepath).buffer;
            default:
                return fs.readFileSync(this.filepath, { encoding: 'UTF-8'});
        }
    }

    readAsync(format?:string):Promise<any> {
        return new Promise((resolve, reject) => {
            switch(format) {
                case 'json':
                    fs.readFile(this.filepath, {}, (err, data) => err ? reject(err) : resolve(JSON.parse(data)));
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

    write(data:any, format?:string) {
        switch(format) {
            case 'json':
                return fs.writeFileSync(this.filepath, JSON.stringify(data), { encoding: 'UTF-8' });
            case 'binary':
                return fs.writeFileSync(this.filepath, data);
            default:
                return fs.writeFileSync(this.filepath, data, { encoding: 'UTF-8' });
        }
    }
}
