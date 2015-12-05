var fs = require('fs');
var path = require('path');

module Egg {
    export class File {
        static read(f:string):string { return fs.readFileSync(f, { encoding: 'UTF-8' }); }
        static readBinary(f:string):ArrayBuffer { return fs.readFileSync(f).buffer; }
        static write(f:string, contents:string):void { return fs.writeFileSync(f, contents); }
        static stat(f:string) { return fs.statSync(f); }
        static extension(f):string { return path.extname(f); }
        static filename(f):string { return path.basename(f); }
        static pathname(f):string { return path.dirname(f); }
        static relative(from, to):string { return path.relative(from, to); }
        static stripProtocol(f):string { return f.replace("/^.*?:[/\\]{2}/",""); }

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

        static projectFile(f):string { return Egg.gameDir + "/" + f; }
    }

    export class Directory {
        static read(f) { return fs.readdirSync(f); }
    }
}
