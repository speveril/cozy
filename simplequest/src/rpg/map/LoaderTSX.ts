module RPG.Map.Loader {
    var TSXcache:{ [name:string]: MapTileset } = {};

    export function TSX(path:string, file:string) {
        var fullpath = path + file;
        if (!TSXcache[path]) {
            var ts = new MapTileset();
            var parser = new DOMParser();
            var data = parser.parseFromString(Egg.gameDir.file(fullpath).read(), "text/xml");
            ts.texture = path + data.getElementsByTagName('image')[0].getAttribute('source');
            _.each(data.getElementsByTagName('tile'), function(tile:HTMLElement) {
                _.each(tile.getElementsByTagName('animation'), function(animData:HTMLElement) {
                    var animation = [];
                    _.each(animData.getElementsByTagName('frame'), function(frameData:HTMLElement) {
                        animation.push([
                            parseInt(frameData.getAttribute('tileid'),10),
                            parseInt(frameData.getAttribute('duration'),10)/1000
                        ]);
                    });
                    ts.animations[tile.getAttribute("id")] = {
                        loop: true,
                        frames: animation
                    };
                });
            });

            TSXcache[fullpath] = ts;
        }
        return TSXcache[fullpath];
    }
}
