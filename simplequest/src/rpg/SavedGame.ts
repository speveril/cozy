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
            var file = SavedGame.directory.file("save-" + (SavedGame.count() + 1) + ".json");
            var data = {
                name:       "Saved Game",
                map:        RPG.map.filename,

            };
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

        }

        writeToDisk() {
            this.file.write(this.data, 'json');
        }
    }
}
