module Egg {
    export class Sound {
        buffer:AudioBuffer;
        source:AudioBufferSourceNode;
        loadedPromise:Promise<any>;

        constructor(fileName:string) {
            this.loadedPromise = new Promise(function(resolve, reject) {
                Egg.File.readBinaryAsync(fileName)
                    .then(function(fileContents:ArrayBuffer) {
                        var decode = function() {
                            Audio.context.decodeAudioData(fileContents, function(decoded) {
                                this.buffer = decoded;
                                clearInterval(interval);
                                resolve();
                            }.bind(this), function() {
                                console.log("Couldn't load sound file '" + fileName + "'.");
                                clearInterval(interval);
                                reject();
                            }.bind(this));
                        }.bind(this);
                        var interval = setInterval(decode, 2500);
                        decode();
                    }.bind(this), function(error) {
                        console.log("Failed to load '" + fileName + "'. " + error);
                    }.bind(this));
            }.bind(this));
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

            this.tracks = def.tracks;
            this.buffers = {};

            this.loadedPromise = new Promise(function(resolve, reject) {
                var trackResolve = _.after(def.tracks.length - 1, resolve);

                _.each(def.tracks, function(fileName:string):void {
                    Egg.File.readBinaryAsync(fileName)
                        .then(function(fileContents:ArrayBuffer) {
                            Audio.context.decodeAudioData(fileContents, function(decoded) {
                                this.buffers[fileName] = decoded;
                                trackResolve();
                            }.bind(this), function() {
                                console.log("Couldn't load sound file '" + fileName + "' for song.");
                                reject();
                            }.bind(this));
                        }.bind(this));

                }.bind(this));
            }.bind(this));
        }

        loaded():Promise<any> {
            return this.loadedPromise;
        }

        start():void {
            if (Audio.currentMusic) {
                Audio.currentMusic.stop();
            }

            Audio.currentMusic = this;
            this.source = Audio.context.createBufferSource();
            this.source.buffer = this.buffers[this.tracks[0]];
            this.source.connect(Audio.musicGain);
            this.source.loop = true;
            this.source.start(0);
        }

        stop():void {
            this.source.stop();
            this.source.disconnect();
        }
    }

    export class Audio {
        static context:AudioContext;
        static currentMusic:Music = null;
        static musicGain:GainNode;
        static sfxGain:GainNode;

        static musicVolume:number;
        static sfxVolume:number;

        static init():void {
            this.context = new AudioContext();

            this.musicGain = this.context.createGain();
            this.musicGain.connect(this.context.destination);

            this.sfxGain = this.context.createGain();
            this.sfxGain.connect(this.context.destination);

            this.musicVolume = 0.5;
            this.sfxVolume = 0.5;
            this.unmute();
        }

        static mute() {
            this.musicGain.gain.value = 0;
            this.sfxGain.gain.value = 0;
        }

        static unmute() {
            this.musicGain.gain.value = this.musicVolume;
            this.sfxGain.gain.value = this.sfxVolume;
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
}
