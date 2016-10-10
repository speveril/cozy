module RPG.Map {
    export class MapTileset {
        index:number;
        texture:string;
        animations:{ [name:string]: any } = {};
    }

    export class MapTile extends Egg.Sprite {}
}
