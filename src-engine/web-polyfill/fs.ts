import { Buffer } from './Buffer';

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


export function statSync(p) {
    p = normalize(p);

    let entry = manifest.find((x) => x.name === p);

    if (!entry) {
        throw new Error("Could not stat file " + p + "; file not found in manifest.");
    }

    let o = {};
    o['isDirectory'] = entry.type === 'directory' ? () => true : () => false;
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

export const promises = {
    readFile(p) {
        p = normalize(p);
        if (!existsSync(p)) {
            // TODO actual fs style errors; ENOEXIST or whatever
            throw new Error("Couldn't read " + p + ", does not exist.");
        }
        return fetch(p);
    }
};
