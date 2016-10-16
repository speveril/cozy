// Map formats
///<reference path="LoaderTMX.ts"/>

// Tileset formats
///<reference path="LoaderTSX.ts"/>


module RPG.Map.Loader {
    /**
    Magic loader. Tries to figure out what kind of map it is an load appropriately.
    @param path              Path to the file.
    **/
    export function load(path:string):RPG.Map.Map {
        // Currently just look at the extension. TMX is the only format we understand right now.
        var extension = Egg.File.extension(path).toLowerCase();
        switch (extension) {
            case 'tmx': return TMX(path);
        }
    }
}
