// obstruction utils
// http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment

export function sqr(x) { return x * x }
export function dist(v, w) { return Math.sqrt(dist2(v, w)); }
export function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
export function distA(v, w) { return Math.sqrt(distA2(v, w)); }
export function distA2(v, w) { return sqr(v[0] - w[0]) + sqr(v[1] - w[1]) }
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
export function AABBcollide(coordsA, coordsB) {
    // normalize box arrays to [left, top, right, bottom]
    let boxA = [
        coordsA[0] < coordsA[2] ? coordsA[0] : coordsA[2],
        coordsA[1] < coordsA[3] ? coordsA[1] : coordsA[3],
        coordsA[0] < coordsA[2] ? coordsA[2] : coordsA[0],
        coordsA[1] < coordsA[3] ? coordsA[3] : coordsA[1]
    ];
    let boxB = [
        coordsB[0] < coordsB[2] ? coordsB[0] : coordsB[2],
        coordsB[1] < coordsB[3] ? coordsB[1] : coordsB[3],
        coordsB[0] < coordsB[2] ? coordsB[2] : coordsB[0],
        coordsB[1] < coordsB[3] ? coordsB[3] : coordsB[1]
    ];

    if (boxA[0] <= boxB[2] && boxA[2] >= boxB[0] && boxA[1] <= boxB[3] && boxA[3] >= boxB[1]) {
        return true;
    }
    return false;
}
export function lineIntersection(a, b, v, w) {
    let collisions = [];
    // console.log("     lineIntersect", JSON.stringify(a), JSON.stringify(b), JSON.stringify(v), JSON.stringify(w));
    // quick AABB check on the lines
    if (!AABBcollide([a[0],a[1],b[0],b[1]], [v[0],v[1],w[0],w[1]])) {
        // console.log("         earlyexit, no AABB collision");
        return collisions;
    }

    // https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
    let s1 = [b[0] - a[0], b[1] - a[1]];
    let s2 = [w[0] - v[0], w[1] - v[1]];
    // console.log("         >>>", s1, s2);

    let denom = (-s2[0] * s1[1] + s1[0] * s2[1]);
    if (denom === 0) {
        // lines are parallel; determine if they are colinear
        // console.log("         parallel!");
        let lengthA = distA(a,b);
        let lengthB = distA(w,v);
        // console.log("         line A", lengthA);
        // console.log("         line B", lengthB);
        // console.log("         a on B", distA(a,v), distA(a,w), distA(a,v) + distA(a,w));
        if (distA(a,v) + distA(a,w) === lengthB) {
            // console.log("         pt a on line B");
            collisions.push([a[0],a[1]]);
        }
        // console.log("         b on B", distA(b,v), distA(b,w), distA(b,v) + distA(b,w));
        if (distA(b,v) + distA(b,w) === lengthB) {
            // console.log("         pt b on line B");
            collisions.push([b[0],b[1]]);
        }
        // console.log("         w on A", distA(w,a), distA(w,b), distA(w,a) + distA(w,b));
        if (distA(w,a) + distA(w,b) === lengthA) {
            // console.log("         pt w on line A");
            collisions.push([w[0],w[1]]);
        }
        // console.log("         v on A", distA(v,a), distA(v,b), distA(v,a) + distA(v,b));
        if (distA(v,a) + distA(v,b) === lengthA) {
            // console.log("         pt v on line A");
            collisions.push([v[0],v[1]]);
        }
    } else {
        let s = (-s1[1] * (a[0] - v[0]) + s1[0] * (a[1] - v[1])) / denom;
        let t = (s2[0] * (a[1] - v[1]) - s2[1] * (a[0] - v[0])) / denom;

        // console.log("         ??:", s, t);
        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            collisions.push([a[0] + (t * s1[0]), a[1] + (t * s1[1])]);
        }
    }

    // console.log("         =>", collisions);
    return collisions;
}
