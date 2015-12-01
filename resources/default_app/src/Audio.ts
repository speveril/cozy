module Egg {
    export class Sound {
        buffer:AudioBuffer;
        source:AudioBufferSourceNode;
        loadedPromise:Promise<any>;

        constructor(fileName:string) {
            this.loadedPromise = new Promise(function(resolve, reject) {
                var contents:ArrayBuffer = Egg.File.readBinary(fileName);

                Audio.context.decodeAudioData(contents, function(decoded) {
                    this.buffer = decoded;
                    resolve();
                }.bind(this), function() {
                    console.log("Couldn't load sound file '" + fileName + "'.");
                    reject();
                }.bind(this));
            }.bind(this));
        }

        loaded():Promise<any> {
            return this.loadedPromise;
        }

        play():void {
            this.source = Audio.context.createBufferSource();
            this.source.buffer = this.buffer;
            this.source.connect(Audio.context.destination);
            this.source.start(0);
        }
    }

    export class Audio {
        static context:AudioContext;

        static init():void {
            console.log("Initializing Audio");
            this.context = new AudioContext();
            console.log(this.context);
            this.context.sampleRate = 44100;
        }
    }
}
