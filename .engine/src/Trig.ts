// obstruction utils
// http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment

module Trig {
    export function sqr(x) { return x * x }
    export function dist(v, w) { return Math.sqrt(dist2(v, w)); }
    export function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
    export function closestPointOnLine(p, v, w) {
        var len = dist2(v, w);
        if (len === 0) return v;
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / len;
        if (t < 0) return v;
        if (t > 1) return w;
        return {
            x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y)
        };
    }
    export function distToSegmentSquared(p, v, w) { return dist2(p, closestPointOnLine(p, v, w)); }
    export function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }
}
