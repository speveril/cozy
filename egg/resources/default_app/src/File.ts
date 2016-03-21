var fs = require('fs');
var path = require('path');

module Egg {
    export class File {
        static eggPath:string;
        static gamePath:string;

        static read(f:string):string { return fs.readFileSync(f, { encoding: 'UTF-8' }); }
        static readBinary(f:string):ArrayBuffer { return fs.readFileSync(f).buffer; }
        static write(f:string, contents:string):void { return fs.writeFileSync(f, contents); }
        static stat(f:string) { return fs.statSync(f); }
        static extension(f):string { return path.extname(f); }
        static filename(f):string { return path.basename(f); }
        static pathname(f):string { return path.dirname(f); }
        static relative(from, to):string { return path.relative(from, to); }
        static stripProtocol(f):string { return f.replace("/^.*?:[/\\]{2}/",""); }

        static readHTML(f):string {
            var htmlFile = Egg.File.projectFile(f);
            var el = document.createElement('div');
            el.innerHTML = Egg.File.read(htmlFile);

            _.each(el.getElementsByTagName('*'), function(element) {
                if (element.getAttribute('src')) {
                    element.src = Egg.File.pathname(htmlFile) + "/" + element.getAttribute('src');
                }
                if (element.getAttribute('href')) {
                    element.href = Egg.File.pathname(htmlFile) + "/" + element.getAttribute('href');
                }
            }.bind(this));

            return el.innerHTML;
        }

        static readAsync(f:string):Promise<string> {
            return new Promise(function(resolve, reject) {
                fs.readFile(f, { encoding: 'UTF-8' }, function(err, data) {
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
            return path.join(basePath, f);
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
        }
    }

    export class Directory {
        static read(f) { return fs.readdirSync(f); }
    }
}
