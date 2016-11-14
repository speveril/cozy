var fs = require('fs');
var path = require('path');

module Egg {
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
            _.each(list, (f:string) => {
                var fullpath = path.join(this.root, f);
                var stats = fs.statSync(fullpath);
                if (stats.isDirectory()) {
                    found.push(new Directory(fullpath));
                } else {
                    found.push(new File(fullpath));
                }
            });
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
            var fullpath = path.join(this.root, p);
            if (createIfDoesNotExist && !fs.existsSync(fullpath)) fs.mkdirSync(fullpath);
            return new Directory(path.join(this.root, p));
        }

        glob(pattern:string, opts?:any):Array<Directory|File> {
            return this.buildList(window['glob'].sync(pattern, opts));
        }
    }

    export class File {
        filepath:string;

        constructor(f:string) {
            this.filepath = path.resolve(f);
        }

        get extension():string                  { return path.extname(this.filepath); }
        get path():string                       { return this.filepath; }
        get url():string                        { return this.relativePath(Egg.engineDir).replace(/\\/g, "/"); }
        get exists():boolean                    { return fs.existsSync(this.filepath); }

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

/*
    export class Directory_ {
        static appDataPath(appName?:string):string {
            var identifier = appName || Egg.gameName;

            // see
            //    http://stackoverflow.com/a/26227660
            //    https://developer.apple.com/library/content/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html
            var stem = process.env.APPDATA + '\\' || (process.platform == 'darwin' ? process.env.HOME + 'Library/Application Support/' : process.env.HOME + "/.");
            return stem + identifier;
        }

        static read(f) { return fs.readdirSync(f); }
        static exists(f) { return fs.existsSync(f); }
        static ensureExists(path) {
            if (!Directory.exists(path)) fs.mkdirSync(path);
        }

        static get(f:string):Directory {
            return new Directory(f);
        }
        static makeAndGet(f:string):Directory {
            if (!fs.existsSync(f)) fs.mkdirSync(f);
            return Directory.get(f);
        }

        // ---

        root:string;

        constructor(f:string) {
            if (!fs.existsSync(path)) throw new Error("Couldn't open path, " + f + ".");
            this.root = f;
        }

        relativePath(f:string):string               { return path.join(this.root, f); }

        read(f:string)                              { return fs.readdirSync(this.relativePath(f)); }
        each(f:string, cb:any)                      { return _.each(this.read(f), cb); }
        glob(f:string, opts?:any):Array<string>     { return window['glob'].sync(this.relativePath(f), opts); }

        readFile(f:string):string                   { return fs.readFileSync(this.relativePath(f), { encoding: 'UTF-8'}); }
        readBinary(f:string):ArrayBuffer            { return fs.readFileSync(this.relativePath(f)).buffer; }
        readHTML(f):string                          { return this.fixHTML(this.readFile(f)); }
        readJSON(f):any                             { return JSON.parse(this.readFile(f)); }

        writeFile(f:string, contents:string):void   { return fs.writeFileSync(this.relativePath(f), contents); }
        // TODO writeBinary(f:string, contents:ArrayBuffer):void {}
        //  etc.

        stat(f:string)                              { return fs.statSync(this.relativePath(f)); }
        extension(f):string                         { return path.extname(this.relativePath(f)); }
        filename(f):string                          { return path.basename(this.relativePath(f)); }
        pathname(f):string                          { return path.dirname(this.relativePath(f)); }

        fixHTML(html):string {
            var el = document.createElement('div');
            el.innerHTML = html;

            var fixElements = [].concat(
                Array.prototype.slice.call(el.getElementsByTagName('link')),
                Array.prototype.slice.call(el.getElementsByTagName('img')),
                Array.prototype.slice.call(el.getElementsByTagName('a'))
            );

            _.each(fixElements, function(element) {
                if (element.getAttribute('src')) {
                    element.src = path + "/" + element.getAttribute('src');
                }
                if (element.getAttribute('href')) {
                    element.href = path + "/" + element.getAttribute('href');
                }
            }.bind(this));

            return el.innerHTML;
        }

        static urlPath(f):string {
            var basePath = File.relative(File.eggPath, File.gamePath);
            return path.join(basePath, f).replace(/\\/g, "/");
        }
    }

    export class File_ {
        static eggPath:string;
        static gamePath:string;

        static read(f:string):string { return fs.readFileSync(this.projectFile(f), { encoding: 'UTF-8' }); }
        static readBinary(f:string):ArrayBuffer { return fs.readFileSync(this.projectFile(f)).buffer; }
        static write(f:string, contents:string):void { return fs.writeFileSync(this.projectFile(f), contents); }
        static stat(f:string) { return fs.statSync(this.projectFile(f)); }
        static extension(f):string { return path.extname(this.projectFile(f)); }
        static filename(f):string { return path.basename(this.projectFile(f)); }
        static pathname(f):string { return path.dirname(this.projectFile(f)); }
        static relative(from, to):string { return path.relative(from, to); }
        static stripProtocol(f):string { return f.replace("/^.*?:[/\\]{2}/",""); }

        static glob(f:string, opts?:any):Array<string> {
            return window['glob'].sync(f, opts);
        }

        static readHTML(f):string {
            return Egg.File.fixHTML(Egg.File.read(Egg.File.projectFile(f)), Egg.File.pathname(f));
        }

        static fixHTML(html, path = Egg.File.gamePath):string {
            var el = document.createElement('div');
            el.innerHTML = html;

            var fixElements = [].concat(
                Array.prototype.slice.call(el.getElementsByTagName('link')),
                Array.prototype.slice.call(el.getElementsByTagName('img')),
                Array.prototype.slice.call(el.getElementsByTagName('a'))
            );

            _.each(fixElements, function(element) {
                if (element.getAttribute('src')) {
                    element.src = path + "/" + element.getAttribute('src');
                }
                if (element.getAttribute('href')) {
                    element.href = path + "/" + element.getAttribute('href');
                }
            }.bind(this));

            return el.innerHTML;
        }

        static readAsync(f:string):Promise<string> {
            return new Promise(function(resolve, reject) {
                fs.readFile(this.projectFile(f), { encoding: 'UTF-8' }, function(err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        }
        static readBinaryAsync(f:string):Promise<ArrayBuffer> {
            return new Promise(function(resolve, reject) {
                fs.readFile(f, function(err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data.buffer);
                    }
                });
            });
        }

        static projectFile(f):string { return path.join(File.gamePath, f); }
        static urlPath(f):string {
            var basePath = File.relative(File.eggPath, File.gamePath);
            return path.join(basePath, f).replace(/\\/g, "/");
        }
*/
        /**
        Set up the File handler's two necessary internal paths. Called as part of setup; there
        shouldn't be any reason to call it again.
        @param eggPath      Path containing the Egg executable.
        @param gamePath     Path containing the game's config.json.
        **/
        // static setPaths(eggPath, gamePath) {
        //     File.eggPath = eggPath;
        //     File.gamePath = gamePath;
        //     console.log("Paths:", eggPath, gamePath);
        // }
    // }
}
