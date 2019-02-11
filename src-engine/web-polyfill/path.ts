// implement (some of) NodeJS's path library for the fake web filesystem

export const sep = "/";

export function dirname(p) {
    return join.apply(this, p.split('/').slice(0, -1));
}

export function extname(p) {
    p = normalize(p);
    let lastslash = p.lastIndexOf('/');
    let lastdot = p.lastIndexOf('.');
    if (lastdot > lastslash) {
        return p.slice(lastdot);
    }
    return '';
}

export function join(...args) {
    return args.join('/').replace(/\/+/g, "/");
}

export function normalize(p) {
    let pieces = p.split('/');
    let outputPieces = [];

    for (let pc of pieces) {
        if (pc === '.') {
            continue;
        } else if (pc === '..') {
            if (outputPieces.length < 1) {
                throw new Error("resolve error TODO");
            }
            outputPieces.pop();
        } else {
            outputPieces.push(pc);
        }
    }

    return join.apply(this, outputPieces);
}

export function relative(from, to) {
    let frompieces = normalize(from).split('/');
    let topieces = normalize(to).split('/');
    let relativepieces = [];

    while (frompieces.length > 0 && topieces.length > 0) {
        if (frompieces[0] !== topieces[0]) break;
        frompieces.shift();
        topieces.shift();
    }

    for (let i = 0; i < frompieces.length - i; i++) {
        relativepieces.push("..");
    }
    relativepieces = relativepieces.concat(topieces);

    return join.apply(this, relativepieces);
}

export function resolve(...args) {
    return normalize(join.apply(this, args));
}
