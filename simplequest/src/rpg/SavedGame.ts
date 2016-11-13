module RPG {
    export class SavedGame {
        static count():number {
            return SavedGame.getList().length;
        }

        static getList():Array<SavedGame> {
            var directory = Egg.userdataDir.subdir("saves");
            var games:Array<SavedGame> = [];

            // Egg.Directory.ensureExists(directory);
            // _.each(Egg.Directory.read(directory), (f:string) => {
            //     games.push(SavedGame.fromFile(f));
            // });

            return games;
        }

        // static fromFile(f) {
        //     return new SavedGame(f, Egg.File.read(f));
        // }
        //
        // static fromState() {
        //     var f = "save-" + (SavedGame.count() + 1) + ".json";
        //     var data = {
        //         name: "Saved Game"
        //     };
        //     // TODO fill data
        //     return new SavedGame(f, data);
        // }

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
