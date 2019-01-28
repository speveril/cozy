import * as Engine from './Engine';
import { Layer } from './Layer';
import { dist } from './Trig';

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
        this.linecolor = args.hasOwnProperty('linecolor') ? args.linecolor : 0xFFFFFF;
        this.linewidth = args.hasOwnProperty('linewidth') ? args.linewidth : 2;
        this.linealpha = args.hasOwnProperty('linealpha') ? args.linealpha : 1;
        this.fillcolor = args.hasOwnProperty('fillcolor') ? args.fillcolor : 0xFFFFFF;
        this.fillalpha = args.hasOwnProperty('fillalpha') ? args.fillalpha : 0.5;

        if (args.hasOwnProperty('closed')) this.closed = args.closed;
        if (args.hasOwnProperty('center')) this.center = new PIXI.Point(args.center.x, args.center.y);
        if (args.hasOwnProperty('radius')) this.radius = args.radius;

        if (args.hasOwnProperty('points')) {
            // "rewind" the polygon to be clockwise, if necessary
            let sum = (args.points[0] - args.points[args.points.length - 2]) * (args.points[1] + args.points[args.points.length - 1]);
            for (let i = 0; i < args.points.length - 2; i += 2) {
                sum += (args.points[i + 2] - args.points[i]) * (args.points[i + 3] + args.points[i + 1]);
            }
            if (sum > 0) {
                this.points = [];
                for (let i = args.points.length - 2; i >= 0; i -= 2) {
                    this.points.push(args.points[i], args.points[i+1]);
                }
            } else {
                this.points = args.points.slice(0);
            }
        }

        this.graphics = new PIXI.Graphics();

        this.onChange();
    }

    onChange() {
        this.draw();
    }

    isOnEdge(_x:number|PIXI.Point, _y?:number) {
        let pt;
        if (_x instanceof PIXI.Point) {
            pt = _x;
        } else {
            pt = { x: _x, y: _y };
        }

        switch (this.type) {
            case ShapeType.Polygon:
                const length = this.points.length;
                for (let i = 0, j = length - 1; i < length; j = i++) {
                    const p1 = { x:this.points[i][0], y: this.points[i][1] };
                    const p2 = { x:this.points[j][0], y: this.points[j][1] };
                    if (dist(pt, p1) + dist(pt, p2) === dist(p1, p2)) {
                        return [p2, p1];
                    }
                }
                break;
            case ShapeType.Circle:
                if (dist(pt, this.center) === this.radius) {
                    return pt;
                }
        }
        return null;
    }

    // based on contains() from PIXI's Polygon, with augmentation to edge check
    contains(_x:number|PIXI.ObservablePoint|PIXI.Point, _y?:number) {
        let pt;
        if (_x instanceof PIXI.Point || _x instanceof PIXI.ObservablePoint) {
            pt = _x;
        } else {
            pt = { x: _x, y: _y };
        }

        let inside = false;

        switch (this.type) {
            case ShapeType.Polygon:
                // use some raycasting to test hits
                // https://github.com/substack/point-in-polygon/blob/master/index.js
                const length = this.points.length;

                for (let i = 0, j = length - 1; i < length; j = i++) {
                    let p1 = { x:this.points[i][0], y: this.points[i][1] };
                    let p2 = { x:this.points[j][0], y: this.points[j][1] };

                    // return true immediately if the point is ON this edge
                    if (dist(pt, p1) + dist(pt, p2) === dist(p1, p2)) {
                      return true;
                    }

                    // const intersect = ((p1.y > pt.y) !== (p2.y > pt.y)) && (pt.x < ((p2.x - p1.x) * ((pt.y - p1.y) / (p2.y - p1.y))) + p1.x);
                    const intersect = ((p1.y > pt.y) !== (p2.y > pt.y)) && (pt.x < ((p2.x - p1.x) * ((pt.y - p1.y) / (p2.y - p1.y))) + p1.x);

                    if (intersect) {
                      inside = !inside;
                    }
                }
                break;
            case ShapeType.Circle:
                if (dist(pt, this.center) <= this.radius) {
                    inside = true;
                }
                break;
        }

        return inside;
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
