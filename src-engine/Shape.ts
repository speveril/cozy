import * as PIXI from 'pixi.js';
import * as Engine from './Engine';
import { Layer } from './Layer';

export enum ShapeType { Polygon, Circle };
export class Shape {
    layer:Layer;
    type:ShapeType;
    graphics:PIXI.Graphics;
    linecolor:number;
    linewidth:number;
    linealpha:number;
    fillcolor:number;
    fillalpha:number;

    // for Polygon
    points:Array<Array<number>>;

    // for Circle
    center:PIXI.Point;
    radius:number;

    closed:boolean;

    constructor(type:ShapeType, args?:any) {
        this.type = type;
        this.linecolor = args.linecolor || 0xFFFFFF;
        this.linewidth = args.linewidth || 2;
        this.linealpha = args.linealpha || 1;
        this.fillcolor = args.fillcolor || 0xFFFFFF;
        this.fillalpha = args.fillalpha || 0.5;

        if (args.hasOwnProperty('points')) this.points = args.points;
        if (args.hasOwnProperty('closed')) this.closed = args.closed;
        if (args.hasOwnProperty('center')) this.center = new PIXI.Point(args.center.x, args.center.y);
        if (args.hasOwnProperty('radius')) this.radius = args.radius;

        this.graphics = new PIXI.Graphics();

        this.onChange();
    }

    onChange() {
        this.draw();
    }

    private draw() {
        this.graphics.clear();
        switch(this.type) {
            case ShapeType.Polygon:
                this.graphics.beginFill(this.fillcolor, this.fillalpha);
                this.graphics.lineStyle(this.linewidth, this.linecolor, this.linealpha);

                // TODO this.graphics.drawPolygon ?
                this.graphics.moveTo.apply(this.graphics, this.points[0]);
                for (let i = 1; i < this.points.length; i++) {
                    this.graphics.lineTo.apply(this.graphics, this.points[i]);
                }
                if (this.closed) {
                    this.graphics.lineTo.apply(this.graphics, this.points[0]);
                }
                this.graphics.endFill();
                break;
            case ShapeType.Circle:
                this.graphics.beginFill(this.fillcolor, this.fillalpha);
                this.graphics.lineStyle(this.linewidth, this.linecolor, this.linealpha);
                this.graphics.drawCircle(this.center.x, this.center.y, this.radius);
                this.graphics.endFill();
                break;
            default:
                console.error("Tried to draw a Shape with a bad type.");
        }
    }
}
