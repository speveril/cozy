var fs = require('fs');
var path = require('path');

module Egg {
    export class File {
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

        /**
        Set up the File handler's two necessary internal paths. Called as part of setup; there
        shouldn't be any reason to call it again.
        @param eggPath      Path containing the Egg executable.
        @param gamePath     Path containing the game's config.json.
        **/
        static setPaths(eggPath, gamePath) {
            File.eggPath = eggPath;
            File.gamePath = gamePath;
            console.log("Paths:", eggPath, gamePath);
        }
    }

    export class Directory {
        static read(f) { return fs.readdirSync(f); }
    }
}
