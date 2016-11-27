///<reference path="src/VisualNovelKit.ts"/>
///<reference path="src/pages.ts"/>

module VisualNovel {
    export function start() {
        console.log(getPages());
        var p = VN.start({
            sfx:    {},
            music:  {
                bgmusic:  { tracks: ['audio/712184_LazyTown---We-Are-Number-O.mp3'] }
            },
            pages: getPages()
        });
        p.then(startGame);
    }

    export function startGame() {
        VN.music['bgmusic'].start();

        VN.reset();
        VN.showPage('start');
        
        Cozy.unpause();
    }

    export function frame(dt) {
        // this will run every frame
        // - dt is the number of seconds that have passed since the last frame
    }


}

module.exports = VisualNovel;
