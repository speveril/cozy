module RPG {
    export class SavedGame {
        public static directory:Egg.Directory;

        static count():number {
            return SavedGame.getList().length;
        }

        static getList():Array<SavedGame> {
            if (!SavedGame.directory) SavedGame.directory = Egg.userdataDir.subdir("saves", true /* create if does not exists */);

            var files:Array<Egg.File> = [];
            _.each(SavedGame.directory.read(), (f:Egg.File) => {
                files.push(f);
            });

            // reverse sort by modification time
            files.sort((a,b) => {
                return a.stat().mtime > b.stat().mtime ? -1 : 1;
            });

            return _.map(files, (f:Egg.File):SavedGame => new SavedGame(f.path, f.read('json')));
        }

        static fromFile(f:Egg.File) {
            return new SavedGame(f.path, f.read('json'));
        }

        static fromState() {
            var filename = "save-" + (SavedGame.count() + 1) + ".json";
            var data = {
                name: "Saved Game"
                // TODO fill data
            };
            return new SavedGame(filename, data);
        }

        // ---

        filename:string;
        data:any;

        constructor(filename:string, data:any) {
            this.filename = filename;
            this.data = data;
        }

        applyToState() {

        }

        writeToDisk() {

        }
    }
}
