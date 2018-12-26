import * as Engine from './Engine';
import { File } from './FileSystem';

// ---------------------------------------------------------------------------

class Sound {
    public file:File = null;
    public opts:any = {};
    public BasicSound:BasicSound = null;
    public ModuleSound:ModuleSound = null;

    theSound:any;
    loadedPromise:Promise<any>;

    constructor(filename:string, opts:any) {
        this.file = Engine.gameDir().file(filename);
        this.opts = opts;

        let generator:any = BasicSound;
        let varname:string = 'BasicSound';
        this.loadedPromise = new Promise((resolve, reject) => {
            switch(this.file.extension.toLowerCase()) {
                case '.mod':
                case '.it':
                case '.mo3':
                case '.s3m':
                case '.xm':
                    // TODO all of the OpenMPT file formats...
                    generator = ModuleSound;
                    varname = 'ModuleSound';
                    break;
            }
            generator.make(this)
                .then((sound) => {
                    this.theSound = sound;
                    this[varname] = this.theSound;
                    resolve();
                }, reject);
        });
    }

    loaded():Promise<any> {
        return this.loadedPromise;
    }

    play() { this.theSound.play(); }
    pause() { this.theSound.pause(); }
    stop() { this.theSound.stop(); }
}

class BasicSound {
    static make(container:Sound) {
        return new Promise((resolve, reject) => {
            container.file.load()
                .then((file) => {
                    let fileContents = file.getData('arraybuffer');
                    console.log("successfully loaded", container.file.path);
                    Audio.context.decodeAudioData(
                        fileContents,
                        (decoded) => {
                            console.log("successfully decoded", container.file.path);
                            resolve(new BasicSound(container, decoded));
                        }, () => {
                            console.warn("Couldn't decode basic sound file '" + container.file.path + "'.");
                            reject();
                        }
                    );
                }, (error) => {
                    console.warn("Failed to load '" + container.file.path + "'. " + error);
                    reject();
                });
        });
    }

    container:Sound;
    buffer:AudioBuffer;
    source:AudioBufferSourceNode;

    constructor(container:Sound, buffer:any) {
        this.container = container;
        this.buffer = buffer;
    }

    play():void {
        this.source = Audio.context.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(this.container.opts.gain);
        if (this.container.opts.loop) {
             this.source.loop = true;
        }
        this.source.start(0);
    }
    pause():void { /* TODO */ }
    stop():void {
        this.source.stop();
        this.source.disconnect();
    }
}


// Based on code from Cowbell
// https://github.com/demozoo/cowbell/blob/master/cowbell/
let libopenmpt = window['libopenmpt'];
let maxFramesPerChunk = 4096;
class ModuleSound {
    static make(container:Sound) {
        return new Promise((resolve, reject) => {
            container.file.load()
                .then((file) => {
                    let fileContents = file.getData('arraybuffer');
                    resolve(new ModuleSound(container, fileContents));
                }, (error) => {
                    console.warn("Failed to load '" + container.file.path + "'. " + error);
                    reject();
                });
        });
    }

    container:Sound;
    duration:number;
    modulePtr:any;
    leftBufferPtr:any;
    rightBufferPtr:any;
    scriptNode:any;

    constructor(container:Sound, buffer:any) {
        this.container = container;

        let byteArray = new Int8Array(buffer);
        let filePtr = libopenmpt._malloc(byteArray.byteLength);
        libopenmpt.HEAPU8.set(byteArray, filePtr);

        this.modulePtr = libopenmpt._openmpt_module_create_from_memory(filePtr, byteArray.byteLength, 0, 0, 0);
        this.leftBufferPtr = libopenmpt._malloc(4 * maxFramesPerChunk);
        this.rightBufferPtr = libopenmpt._malloc(4 * maxFramesPerChunk);
        this.duration = libopenmpt._openmpt_module_get_duration_seconds(this.modulePtr);
        libopenmpt._openmpt_module_set_repeat_count(this.modulePtr, (container.opts.loop ? -1 : 1));
    }

    play():void {
        this.scriptNode = Audio.context.createScriptProcessor(maxFramesPerChunk, 0, 2)
        libopenmpt._openmpt_module_set_position_seconds(this.modulePtr, 0); // this is how you seek; 0 is the position here
        this.scriptNode.onaudioprocess = (buf) => this.generate(buf);
        this.scriptNode.connect(this.container.opts.gain);
    }

    pause():void { /* TODO */ }
    stop():void {
        // this.scriptNode.stop();
        this.scriptNode.disconnect(0);
    }

    private generate(ev:AudioProcessingEvent) {
        let outputBuffer = ev.outputBuffer;
        let outputL = outputBuffer.getChannelData(0);
        let outputR = outputBuffer.getChannelData(1);
        let framesToRender = outputBuffer.length;

        let framesRendered = 0;
        let ended = false;
        while (framesToRender > 0) {
            let framesPerChunk = Math.min(framesToRender, maxFramesPerChunk);
            let actualFramesPerChunk = libopenmpt._openmpt_module_read_float_stereo(this.modulePtr, Audio.context.sampleRate, framesPerChunk, this.leftBufferPtr, this.rightBufferPtr);
            let rawAudioLeft = libopenmpt.HEAPF32.subarray(this.leftBufferPtr / 4, this.leftBufferPtr / 4 + actualFramesPerChunk);
            let rawAudioRight = libopenmpt.HEAPF32.subarray(this.rightBufferPtr / 4, this.rightBufferPtr / 4 + actualFramesPerChunk);
            for (let i = 0; i < actualFramesPerChunk; ++i) {
                outputL[framesRendered + i] = rawAudioLeft[i];
                outputR[framesRendered + i] = rawAudioRight[i];
            }
            framesToRender -= actualFramesPerChunk;
            framesRendered += actualFramesPerChunk;
            if (actualFramesPerChunk < framesPerChunk) {
                break;
            }
        }

        if (framesRendered < 0) {
            this.pause();
            // if (this.onended) this.onended();
            // seek(0);
        } else if (framesRendered < maxFramesPerChunk) {
            for (let chan = 0; chan < outputBuffer.numberOfChannels; chan++) {
                let channelData = outputBuffer.getChannelData(chan);
                for (let i = framesRendered; i < outputBuffer.length; i++) {
                    channelData[i] = 0;
                }
            }
        }
    }
}


// ---------------------------------------------------------------------------

export class SFX {
    private internalSound:Sound;

    constructor(filename:string) {
        this.internalSound = new Sound(filename, {
            loop: false,
            gain: Audio.sfxGain
        });
    }

    loaded():Promise<any> {
        return this.internalSound.loadedPromise;
    }

    play():void {
        this.internalSound.play();
    }
}

export class Music {
    private internalSound:Sound;
    constructor(filename:string) {
        this.internalSound = new Sound(filename, {
            loop: true,
            gain: Audio.musicGain
        });
    }

    loaded():Promise<any> {
        return this.internalSound.loadedPromise;
    }

    start(fade?:number):void {
        if (Audio.currentMusic) {
            Audio.currentMusic.stop();
        }

        this.internalSound.play();

        // TODO add fading back in
        // if (fade > 0) {
        //     Audio.musicFade = {
        //         progress: 0,
        //         direction: +1,
        //         duration: fade
        //     };
        // }

        Audio.currentMusic = this;
    }

    pause(fade?:number):void {
        // TODO add fading back in
        this.internalSound.pause();
    }

    stop(fade?:number):void {
        // TODO add fading back in
        this.internalSound.stop();

        // if (fade > 0) {
        //     Audio.musicFade = {
        //         progress: 1,
        //         direction: -1,
        //         duration: fade
        //     };
        // }
    }
}

// ---------------------------------------------------------------------------

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
