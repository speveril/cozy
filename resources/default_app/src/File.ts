var fs = require('fs');
var path = require('path');

module Egg {
    export class File {
        static read(f) { return fs.readFileSync(f, { encoding: 'UTF-8' }); }
        static write(f, contents) { return fs.writeFileSync(f, contents); }
        static stat(f) { return fs.statSync(f); }
        static extension(f) { return path.extname(f); }
    }

    export class Directory {
        static read(f) { return fs.readdirSync(f); }
    }
}
