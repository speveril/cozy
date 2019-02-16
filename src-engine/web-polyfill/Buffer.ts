// TODO this is far from complete

export class Buffer {
    static from(src:any):Buffer {
        if (src instanceof ArrayBuffer) {
            return new Buffer(src);
        } else if (src.buffer && src.buffer instanceof ArrayBuffer) {
            return new Buffer(src.buffer);
        } else {
            if (typeof src === 'object') {
                throw new Error("Tried to construct a Buffer from a " + (src.prototype.name));
            } else {
                throw new Error("Tried to construct a Buffer from a " + (typeof src));
            }
        }
    }

    public buffer;
    constructor(arraybuf:ArrayBuffer) {
        this.buffer = arraybuf;
    }

    toString() {
        return new TextDecoder().decode(this.buffer);
    }
}