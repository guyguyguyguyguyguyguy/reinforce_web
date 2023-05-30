class Point {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}
class Segment {
    constructor(v0 = new Point(), v1 = new Point(), isInserted = false, root0 = 0, root1 = 0, next = 0, prev = 0) {
        this.v0 = v0;
        this.v1 = v1;
        this.isInserted = isInserted;
        this.root0 = root0;
        this.root1 = root1;
        this.next = next;
        this.prev = prev;
    }
}
class Trap {
    constructor(lseg = 0, rseg = 0, hi = new Point(), lo = new Point(), u0 = 0, u1 = 0, d0 = 0, d1 = 0, sink = 0, state = 0) {
        this.lseg = lseg;
        this.rseg = rseg;
        this.hi = hi;
        this.lo = lo;
        this.u0 = u0;
        this.u1 = u1;
        this.d0 = d0;
        this.d1 = d1;
        this.sink = sink;
        this.state = state;
    }
}
class NodeT {
    constructor(nodeType = 0, segnum = 0, yVal = new Point(), trNum = 0, paren = 0, left = 0, right = 0) {
        this.nodeType = nodeType;
        this.segnum = segnum;
        this.yVal = yVal;
        this.trNum = trNum;
        this.paren = paren;
        this.left = left;
        this.right = right;
    }
}
const QSIZE = 8 * 100;
const TRSIZE = 4 * 100;
const SEGSIZE = 200;
const C_EPS = 1e-7;
const T_X = 1;
const T_Y = 2;
const T_SINK = 3;
const ST_VALID = 1;
const ST_INVALID = 2;
// let QS = Array(QSIZE).fill(new NodeT());
// let TR = Array(TRSIZE).fill(new Trap());
// let SEG = Array(SEGSIZE).fill(new Segment());
//
let FP_EQUAL = (s, t) => { return Math.abs(s - t) <= C_EPS; };
let qIdx;
let trIdx;
function _max(v0, v1) {
    if (v0.y > v1.y + C_EPS) {
        return v0;
    }
    else if (FP_EQUAL(v0.y, v1.y)) {
        if (v0.x > v1.x + C_EPS) {
            return v0;
        }
        else {
            return v1;
        }
    }
    else {
        return v1;
    }
}
function _min(v0, v1) {
    if (v0.y < v1.y - C_EPS) {
        return v0;
    }
    else if (FP_EQUAL(v0.y, v1.y)) {
        if (v0.x < v1.x) {
            return v0;
        }
        else {
            return v1;
        }
    }
    else {
        return v1;
    }
}
function* getRandSeg(nseg) {
    let arr = [...Array(nseg).keys()];
    let currIdx = nseg;
    let randIdx;
    while (currIdx != 0) {
        randIdx = Math.floor(Math.random() * currIdx);
        currIdx--;
        [arr[currIdx], arr[randIdx]] = [arr[randIdx], arr[currIdx]];
    }
    for (let i = 0; i < nseg; ++i) {
        yield arr[i];
    }
}
class Trapezoidate {
    constructor(verts) {
        this.QS = Array.from({ length: QSIZE }, () => new NodeT());
        this.TR = Array.from({ length: TRSIZE }, () => new Trap());
        this.SEG = Array.from({ length: SEGSIZE }, () => new Segment());
        this.nextSeg = getRandSeg(verts.length);
        this.readSegments(verts);
    }
    // Initialise segments to contain each segment in the polygon 
    readSegments(verts) {
        let last = verts.length - 1;
        for (let i = 0; i < verts.length; ++i) {
            console.log(verts[i].x, verts[i].y);
            this.SEG[i].v0.x = verts[i].x;
            this.SEG[i].v0.y = verts[i].y;
            if (i == 0) {
                this.SEG[i].next = i + 1;
                this.SEG[i].prev = last;
                this.SEG[last].v1 = this.SEG[i].v0;
            }
            else if (i == last) {
                this.SEG[i].next = 0;
                this.SEG[i].prev = i - 1;
                this.SEG[i - 1].v1 = this.SEG[i].v0;
            }
            else {
                this.SEG[i].prev = i - 1;
                this.SEG[i].next = i + 1;
                this.SEG[i - 1].v1 = this.SEG[i].v0;
            }
            this.SEG[i].isInserted = false;
        }
    }
    constructTrapezoids(nseg) {
        let root = this.initQueryStructure(this.nextSeg.next().value);
    }
    initialise(n) {
        // generate_random_ordering(n);
    }
    newNode() {
        if (qIdx < QSIZE) {
            let tmp = qIdx;
            return qIdx++;
        }
        else {
            return -1;
        }
    }
    newTrap() {
        if (trIdx < TRSIZE) {
            this.TR[trIdx].lseg = -1;
            this.TR[trIdx].rseg = -1;
            this.TR[trIdx].state = ST_VALID;
            return trIdx++;
        }
        else {
            throw new Error("Trap table overflow");
        }
    }
    // initialise query tree
    initQueryStructure(segnum) {
        let i1, i2, i3, i4, i5, i6, i7, root;
        let t1, t2, t3, t4;
        let qIdx = 1;
        let trIdx = 1;
        i1 = this.newNode();
        this.QS[i1].nodeType = T_Y;
        this.QS[i1].yVal = _max(this.SEG[segnum].v0, this.SEG[segnum].v1);
        root = i1;
        this.QS[i1].right = i2 = this.newNode();
        this.QS[i2].nodeType = T_SINK;
        this.QS[i2].paren = i1;
        this.QS[i1].left = i3 = this.newNode();
        this.QS[i3].nodeType = T_Y;
        this.QS[i3].yVal = _min(this.SEG[segnum].v0, this.SEG[segnum].v1);
        this.QS[i3].paren = i1;
        this.QS[i3].left = i4 = this.newNode();
        this.QS[i4].nodeType = T_SINK;
        this.QS[i4].paren = i3;
        this.QS[i3].right = i5 = this.newNode();
        this.QS[i5].nodeType = T_X;
        this.QS[i5].segnum = segnum;
        this.QS[i5].paren = i3;
        this.QS[i5].left = i6 = this.newNode();
        this.QS[i6].nodeType = T_SINK;
        this.QS[i6].paren = i5;
        this.QS[i5].right = i7 = this.newNode();
        this.QS[i7].nodeType = T_SINK;
        this.QS[i7].paren = i5;
        t1 = this.newTrap();
        t2 = this.newTrap();
        t3 = this.newTrap();
        t4 = this.newTrap();
        this.TR[t1].hi = this.TR[t2].hi = this.TR[t4].lo = this.QS[i1].yVal;
        this.TR[t1].lo = this.TR[t2].lo = this.TR[t3].hi = this.QS[i3].yVal;
        this.TR[t4].hi.y = Infinity;
        this.TR[t4].hi.x = Infinity;
        this.TR[t3].lo.y = -Infinity;
        this.TR[t3].lo.x = -Infinity;
        this.TR[t1].rseg = this.TR[t2].lseg = segnum;
        this.TR[t1].u0 = this.TR[t2].u0 = t4;
        this.TR[t1].d0 = this.TR[t2].d0 = t3;
        this.TR[t4].d0 = this.TR[t3].u0 = t1;
        this.TR[t4].d1 = this.TR[t3].u1 = t2;
        this.TR[t1].sink = i6;
        this.TR[t2].sink = i7;
        this.TR[t3].sink = i4;
        this.TR[t4].sink = i2;
        this.TR[t1].state = this.TR[t2].state = ST_VALID;
        this.TR[t3].state = this.TR[t4].state = ST_VALID;
        this.QS[i2].trNum = t4;
        this.QS[i4].trNum = t3;
        this.QS[i6].trNum = t2;
        this.QS[i7].trNum = t1;
        this.SEG[segnum].isInserted = true;
        return root;
    }
}
let verts = [new Point(0, 0), new Point(0, 6), new Point(6, 6), new Point(6, 0)];
let T = new Trapezoidate(verts);
console.log(T.SEG.slice(0, verts.length));
//# sourceMappingURL=construct.js.map