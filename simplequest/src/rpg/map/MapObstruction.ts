module RPG.Map {
    export class MapObstruction {
        a:PIXI.Point;
        b:PIXI.Point;
        active:boolean;
        name:string;

        constructor(a:PIXI.Point, b:PIXI.Point, name?:string) {
            this.a = a;
            this.b = b;
            this.active = true;
            this.name = name || null;
        }
    }
}
