import * as Engine from './Engine';

export class Sound {
    buffer:AudioBuffer;
    source:AudioBufferSourceNode;
    loadedPromise:Promise<any>;

    constructor(fileName:string) {
        console.log("Sound constructor", fileName);
        this.loadedPromise = new Promise((resolve, reject) => {
            Engine.gameDir().file(fileName).readAsync('binary')
            .then(
                (fileContents:ArrayBuffer) => {
                    console.log("successfully loaded", fileName);
                    Audio.context.decodeAudioData(
                        fileContents,
                        (decoded) => {
                            console.log("successfully decoded", fileName);
                            this.buffer = decoded;
                            console.log("set buffer <" + fileName + ">");
                            resolve();
                        },
                        () => {
                            console.warn("Couldn't load sound file '" + fileName + "'.");
                            reject();
                        }
                    );
                },
                (error) => {
                    console.warn("Failed to load '" + fileName + "'. " + error);
                    reject();
                }
            );
        });
    }

    loaded():Promise<any> {
        return this.loadedPromise;
    }

    play():void {
        this.source = Audio.context.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(Audio.sfxGain);
        this.source.start(0);
    }
}

export class Music {
    loadedPromise:Promise<any>;
    tracks:string[];
    buffers:{[filename:string]: AudioBuffer};
    source:AudioBufferSourceNode;

    constructor(def:any) {
        // TODO if def is a string load a file

        console.log("Music constructor", def);
        this.tracks = def.tracks;
        this.buffers = {};

        this.loadedPromise = new Promise((resolve, reject) => {
            var trackResolve = Engine.after(def.tracks.length, resolve);

            def.tracks.forEach((fileName:string):void => {
                Engine.gameDir().file(fileName).readAsync('binary')
                    .then((fileContents:ArrayBuffer) => {
                        console.log("successfully loaded", fileName);
                        Audio.context.decodeAudioData(fileContents, (decoded) => {
                            console.log("successfully decoded", fileName);
                            try {
                                this.buffers[fileName] = decoded;
                            } catch (e) {
                                console.error(e);
                            }
                            trackResolve();
                        }, () => {
                            console.log("Couldn't load sound file '" + fileName + "' for song.");
                            reject();
                        });
                    });
            });
        });
    }

    loaded():Promise<any> {
        return this.loadedPromise;
    }

    start(fade?:number):void {
        if (Audio.currentMusic) {
            Audio.currentMusic.stop();
        }

        if (fade > 0) {
            Audio.musicFade = {
                progress: 0,
                direction: +1,
                duration: fade
            };
        }

        Audio.currentMusic = this;
        this.source = Audio.context.createBufferSource();
        this.source.buffer = this.buffers[this.tracks[0]];
        this.source.connect(Audio.musicGain);
        this.source.loop = true;
        this.source.start(0);
    }

    stop(fade?:number):void {
        if (fade > 0) {
            Audio.musicFade = {
                progress: 1,
                direction: -1,
                duration: fade
            };
        } else {
            this.source.stop();
            this.source.disconnect();
        }
    }
}

export class Audio {
    static context:AudioContext;
    static currentMusic:Music = null;
    static musicGain:GainNode;
    static sfxGain:GainNode;
    static musicFade:any;

    static musicVolume:number;
    static sfxVolume:number;

    static NOSFX:boolean;
    static NOMUSIC:boolean;

    static init(opts?:any):void {
        this.context = new AudioContext();

        this.musicFade = null;

        this.musicGain = this.context.createGain();
        this.musicGain.connect(this.context.destination);

        this.sfxGain = this.context.createGain();
        this.sfxGain.connect(this.context.destination);

        console.log(opts);
        if (opts.NOSFX) this.NOSFX = true;
        if (opts.NOMUSIC) this.NOMUSIC = true;

        this.musicVolume = 0.5;
        this.sfxVolume = 0.5;
        this.unmute();
    }

    static update(dt) {
        if (this.musicFade) {
            this.musicFade.progress += dt * this.musicFade.direction / this.musicFade.duration;

            if (this.musicFade.progress < 0) {
                this.musicFade = null;
                if (!this.NOMUSIC) this.musicGain.gain.value = this.musicVolume;
                this.currentMusic.stop();
            } else if (this.musicFade.progress > 1) {
                this.musicFade = null;
                if (!this.NOMUSIC) this.musicGain.gain.value = this.musicVolume;
            } else {
                if (!this.NOMUSIC) this.musicGain.gain.value = this.musicVolume * this.musicFade.progress;
            }
        }
    }

    static mute() {
        this.musicGain.gain.value = 0;
        this.sfxGain.gain.value = 0;
    }

    static unmute() {
        if (!this.NOMUSIC) {
            this.musicGain.gain.value = this.musicVolume;
        } else {
            this.musicGain.gain.value = 0;
        }
        if (!this.NOSFX){
            this.sfxGain.gain.value = this.sfxVolume;
        } else {
            this.sfxGain.gain.value = 0;
        }
    }

    static setSFXVolume(v:number) {
        this.sfxVolume = v;
        this.unmute();
    }

    static setMusicVolume(v:number) {
        this.musicVolume = v;
        this.unmute();
    }
}
