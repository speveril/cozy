module RPG {
    export class SavedGame {
        static _directory:Cozy.Directory;

        static get directory():Cozy.Directory {
            if (!SavedGame._directory) SavedGame._directory = Cozy.userdataDir.subdir("saves", true /* create if does not exists */);
            return SavedGame._directory;
        }

        static set directory(dir:Cozy.Directory) {
            SavedGame._directory = dir;
        }

        static count():number {
            return SavedGame.getList().length;
        }

        static getList():Array<SavedGame> {
            var files:Array<Cozy.File> = [];
            _.each(SavedGame.directory.read(), (f:Cozy.File) => {
                files.push(f);
            });

            // reverse sort by modification time
            files.sort((a,b) => {
                return a.stat().mtime > b.stat().mtime ? -1 : 1;
            });

            return _.map(files, (f:Cozy.File):SavedGame => new SavedGame(f, f.read('json')));
        }

        static fromFile(f:Cozy.File) {
            return new SavedGame(f, f.read('json'));
        }

        static fromState():Promise<SavedGame> {
            RPG.uiPlane.hide();
            return Cozy.captureScreenshot(64)
                .then((image) => {
                    RPG.uiPlane.show();

                    var next = 1;
                    _.each(SavedGame.directory.read(), (f:Cozy.File) => {
                        var m = f.name.match(/save-(\d+)/);
                        var i = parseInt(m[1], 10);
                        if (i >= next) next = i + 1;
                    });

                    var file = SavedGame.directory.file("save-" + next.toString() + ".json");
                    var data = {
                        image:          image.toDataURL(),
                        name:           RPG.map.displayName,
                        map:            RPG.mapkey,
                        mapPersistent:  RPG.Map.Map.persistent,
                        party:          RPG.Party.serialize(),
                        characters:     _.mapObject(RPG.characters, (ch) => ch.serialize()),
                        playerLocation: {
                            x: (RPG.player.position.x / RPG.map.tileSize.x) | 0,
                            y: (RPG.player.position.y / RPG.map.tileSize.y) | 0
                        }
                    };
                    console.log(data);
                    return new SavedGame(file, data);
                });
        }

        // ---

        file:Cozy.File;
        data:any;

        constructor(file:Cozy.File, data:any) {
            this.file = file;
            this.data = data;
        }

        applyToState() {
            // TODO there may be implications here of not doing deep-clones

            _.each(this.data.party.inventory, (k:string) => RPG.Party.inventory.add(k));
            RPG.characters = _.mapObject(this.data.characters, (def) => new Character(def));
            _.each(this.data.party.members, (k:string) => RPG.Party.add(RPG.characters[k]));

            RPG.player = RPG.Party.members[0].makeEntity();

            if (this.data.mapPersistent) RPG.Map.Map.persistent = this.data.mapPersistent;
            RPG.startMap(this.data.map, this.data.playerLocation.x, this.data.playerLocation.y);
        }

        writeToDisk() {
            this.file.write(this.data, 'json');
        }
    }
}
