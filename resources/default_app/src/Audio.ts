module Egg {
    export class Sound {
        buffer:AudioBuffer;
        source:AudioBufferSourceNode;

        constructor(fileName:string) {
            var contents = Egg.File.readBinary(fileName);
            Audio.context.decodeAudioData(contents, function(buffer) {
                this.buffer = buffer;
            }.bind(this), function() {
                console.log("Couldn't load sound file '" + fileName + "'.");
            });
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
        }
    }
}
