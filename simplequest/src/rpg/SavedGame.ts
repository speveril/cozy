module RPG {
    export class SavedGame {
        static _directory:Egg.Directory;

        static get directory():Egg.Directory {
            if (!SavedGame._directory) SavedGame._directory = Egg.userdataDir.subdir("saves", true /* create if does not exists */);
            return SavedGame._directory;
        }

        static set directory(dir:Egg.Directory) {
            SavedGame._directory = dir;
        }

        static count():number {
            return SavedGame.getList().length;
        }

        static getList():Array<SavedGame> {
            var files:Array<Egg.File> = [];
            _.each(SavedGame.directory.read(), (f:Egg.File) => {
                files.push(f);
            });

            // reverse sort by modification time
            files.sort((a,b) => {
                return a.stat().mtime > b.stat().mtime ? -1 : 1;
            });

            return _.map(files, (f:Egg.File):SavedGame => new SavedGame(f, f.read('json')));
        }

        static fromFile(f:Egg.File) {
            return new SavedGame(f, f.read('json'));
        }

        static fromState() {
            // TODO better way of naming the files; what if one gets deleted?
            var file = SavedGame.directory.file("save-" + (SavedGame.count() + 1) + ".json");
            var data = {
                name:           "Saved Game",
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
        }

        // ---

        file:Egg.File;
        data:any;

        constructor(file:Egg.File, data:any) {
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
