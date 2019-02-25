import { Buffer } from './Buffer';
import * as path from './path';

function fetch(url):Promise<Buffer> {
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
        req.responseType = 'arraybuffer';

        req.addEventListener('load', (evt) => {
            resolve(Buffer.from(req.response));
        });

        req.addEventListener('error', (evt) => {
            reject('Failed to fetch file: ' + url);
        });

        req.open('GET', url);
        req.send();
    });
}

function normalize(fname) {
    if (fname[0] === '/') fname = fname.slice(1);
    if (fname[fname.length - 1] === '/') fname = fname.slice(0, -1);
    return fname;
}


let manifest = null;
export function setManifest(m) {
    manifest = m;
}

let db = null;
export function setUserdataDB(d) {
    db = d;
}


export function statSync(p) {
    p = normalize(p);

    let entry = manifest.find((x) => x.name === p);

    if (!entry) {
        throw new Error("Could not stat file " + p + "; file not found in manifest.");
    }

    let o = {};
    o['isDirectory'] = entry.type === 'directory' ? () => true : () => false;
    o['mtime'] = new Date(entry.mtime);
    return o;
}

export function existsSync(p) {
    if (p === '') return true;
    
    p = normalize(p);
    for (let e of manifest) {
        if (e.name === p) return true;
    }
    return false;
}

export function mkdirSync(p, opts) {
    // not sure this actually matters, really

    if (existsSync(p)) {
        throw new Error("Tried to make a directory that already exists!");
    }
    if (!opts.recursive && !existsSync(path.dirname(p))) {
        throw new Error("Tried to make a directory in a parent that doesn't exist!");
    }

    if (opts.recursive) {
        let dirs = p.split('/');
        let accum = '';
        for (let d of dirs) {
            accum += d + "/";
            if (!existsSync(d)) {
                manifest.push({ name: normalize(accum), type: 'directory', mtime: new Date().toISOString() });
            }
        }
    } else {
        manifest.push({ name: normalize(p), type: 'directory' });
    }
}

export const promises = {
    readFile(p) {
        p = normalize(p);
        if (!existsSync(p)) {
            // TODO actual fs style errors; ENOEXIST or whatever
            throw new Error("Couldn't read " + p + ", does not exist.");
        }
        if (p.indexOf('$$userdata/') === 0) {
            return new Promise((resolve, reject) => {
                let req = db.transaction('files').objectStore('files').get(p).onsuccess = (evt) => {
                    console.log("success loading userdata file", p + ":", evt.target['result']);
                    resolve(Buffer.from(evt.target['result'].data));
                };
            });
        } else {
            return fetch(p);
        }
    },

    writeFile(p, data, opts) {
        p = normalize(p);
        return new Promise((resolve, reject) => {
            let mtime = new Date().toISOString();
            let t = db.transaction('files', 'readwrite').objectStore('files').put({
                mtime: mtime,
                data: data,
            }, p);
            
            t.onsuccess = (evt) => {
                let manifestEntry = manifest.find((x) => x.name === p);
                if (!manifestEntry) {
                    manifestEntry = {
                        name: p,
                        type: 'file',
                    };
                    manifest.push(manifestEntry);
                }
                manifestEntry.mtime = mtime;

                resolve();
            };
            t.onerror = (evt) => {
                reject(evt.target['result']);
            };
        });
    }
};
