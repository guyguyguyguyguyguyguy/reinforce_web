// ported from: http://gamma.cs.unc.edu/SEIDEL/
class Point {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    static from(o) {
        return new Point(o.x, o.y);
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
    constructor(lseg = 0, rseg = 0, hi = new Point(), lo = new Point(), u0 = 0, u1 = 0, d0 = 0, d1 = 0, sink = 0, uSave = 0, uSide = 0, stat = 0) {
        this.lseg = lseg;
        this.rseg = rseg;
        this.hi = hi;
        this.lo = lo;
        this.u0 = u0;
        this.u1 = u1;
        this.d0 = d0;
        this.d1 = d1;
        this.sink = sink;
        this.uSave = uSave;
        this.uSide = uSide;
        this.stat = stat;
    }
    static from(o) {
        return new Trap(o.lseg, o.rseg, Point.from(o.hi), Point.from(o.lo), o.u0, o.u1, o.d0, o.d1, o.sink, o.uSave, o.uSide, o.stat);
    }
}
// TODO: need to deep copy all times that yVal or Trap.hi or Trap.lo or Segment.v0 or Segment.v1 are assigned  to some point from a different instance
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
var nType;
(function (nType) {
    nType[nType["T_X"] = 1] = "T_X";
    nType[nType["T_Y"] = 2] = "T_Y";
    nType[nType["T_SINK"] = 3] = "T_SINK";
})(nType || (nType = {}));
const ST_VALID = 1;
const ST_INVALID = 2;
const FIRSTPT = 1;
const LASTPT = 2;
const S_LEFT = 1;
const S_RIGHT = 2;
let FP_EQUAL = (s, t) => { return Math.abs(s - t) <= C_EPS; };
let CROSS = (v0, v1, v2) => { return ((v1.x - v0.x) * (v2.y - v0.y) - (v1.y - v0.y) * (v2.x - v0.x)); };
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
    return v1;
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
    return v1;
}
function _greaterThan(v0, v1) {
    if (v0.y > v1.y + C_EPS) {
        return true;
    }
    else if (v0.y < v1.y - C_EPS) {
        return false;
    }
    return v0.x > v1.x;
}
function _greaterThanEqualTo(v0, v1) {
    if (v0.y > v1.y + C_EPS) {
        return true;
    }
    else if (v0.y < v1.y - C_EPS) {
        return false;
    }
    return v0.x >= v1.x;
}
function _lessThan(v0, v1) {
    if (v0.y < v1.y - C_EPS) {
        return true;
    }
    else if (v0.y > v1.y + C_EPS) {
        return false;
    }
    return v0.x < v1.x;
}
function _equalTo(v0, v1) {
    return FP_EQUAL(v0.y, v1.y) && FP_EQUAL(v0.x, v1.x);
}
function _isLeftOf(s, v) {
    let area;
    if (_greaterThan(s.v1, s.v0)) {
        if (FP_EQUAL(s.v1.y, v.y)) {
            if (v.x < s.v1.x) {
                area = 1;
            }
            else {
                area = -1;
            }
        }
        else if (FP_EQUAL(s.v0.y, v.y)) {
            if (v.x < s.v0.x) {
                area = 1;
            }
            else {
                area = -1;
            }
        }
        else {
            area = CROSS(s.v0, s.v1, v);
        }
    }
    else {
        if (FP_EQUAL(s.v1.y, v.y)) {
            if (v.x < s.v1.x) {
                area = 1;
            }
            else {
                area = -1;
            }
        }
        else if (FP_EQUAL(s.v0.y, v.y)) {
            if (v.x < s.v0.x) {
                area = 1;
            }
            else {
                area = -1;
            }
        }
        else {
            area = CROSS(s.v1, s.v0, v);
        }
    }
    if (area > 0) {
        return true;
    }
    return false;
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
    for (let i = 1; i < nseg; ++i) {
        // yield arr[i];
        yield i;
    }
}
function logStar(n) {
    let v = n;
    let i;
    for (i = 0; v >= 1; ++i) {
        v = Math.log(v);
    }
    return i - 1;
}
// Why do this?
function mathN(n, h) {
    let v = n;
    for (let i = 0; i < h; ++i) {
        v = Math.log(v);
    }
    return Math.ceil(n / v);
}
class Trapezoidate {
    constructor(verts) {
        this.QS = Array.from({ length: QSIZE }, () => new NodeT());
        this.TR = Array.from({ length: TRSIZE }, () => new Trap());
        this.SEG = Array.from({ length: SEGSIZE }, () => new Segment());
        this.qIdx = 1;
        this.trIdx = 1;
        this.nextSeg = getRandSeg(verts.length);
        this.readSegments(verts);
    }
    // Initialise SEG to contain each segment in the polygon 
    // including the vertices that make up the segment and a reference to the previous/next segments
    readSegments(verts) {
        let last = verts.length;
        for (let i = 1; i < verts.length + 1; ++i) {
            console.log(verts[i - 1].x, verts[i - 1].y);
            this.SEG[i].v0.x = verts[i - 1].x;
            this.SEG[i].v0.y = verts[i - 1].y;
            if (i == 0) {
                this.SEG[i].next = i + 1;
                this.SEG[i].prev = last;
                this.SEG[last].v1 = Point.from(this.SEG[i].v0);
            }
            else if (i == last) {
                this.SEG[i].next = 0;
                this.SEG[i].prev = i - 1;
                this.SEG[i - 1].v1 = Point.from(this.SEG[i].v0);
            }
            else {
                this.SEG[i].prev = i - 1;
                this.SEG[i].next = i + 1;
                this.SEG[i - 1].v1 = Point.from(this.SEG[i].v0);
            }
            this.SEG[i].isInserted = false;
        }
    }
    constructTrapezoids(nseg) {
        let i;
        let root = this.initQueryStructure(this.nextSeg.next().value);
        for (i = 1; i <= nseg; ++i) {
            this.SEG[i].root0 = this.SEG[i].root1 = root;
        }
        for (let h = 1; h <= logStar(nseg); ++h) {
            for (i = mathN(nseg, h - 1) + 1; i <= mathN(nseg, h); ++i) {
                this.addSeg(this.nextSeg.next().value);
            }
            console.log("Add seg1 done");
            for (i = 1; i <= nseg; ++i) {
                this.findNewRoots(i);
            }
        }
        for (i = mathN(nseg, logStar(nseg) + 1); i <= nseg; ++i) {
            this.addSeg(this.nextSeg.next().value);
        }
    }
    // get Id of next node/vertex
    newNode() {
        if (this.qIdx < QSIZE) {
            return this.qIdx++;
        }
        else {
            throw new Error("Query table overflow");
        }
    }
    // Create new trapezoid
    newTrap() {
        if (this.trIdx < TRSIZE) {
            this.TR[this.trIdx].lseg = -1;
            this.TR[this.trIdx].rseg = -1;
            this.TR[this.trIdx].stat = ST_VALID;
            return this.trIdx++;
        }
        else {
            throw new Error("Trap table overflow");
        }
    }
    // initialise query tree
    initQueryStructure(segnum) {
        let i1, i2, i3, i4, i5, i6, i7, root;
        let t1, t2, t3, t4;
        // Starting node is initialised as the higher vertex of the randomly selected first segment 
        // Set this node to be the root
        i1 = this.newNode();
        this.QS[i1].nodeType = nType.T_Y;
        this.QS[i1].yVal = _max(this.SEG[segnum].v0, this.SEG[segnum].v1);
        root = i1;
        // Set right branch of root to be a sink
        this.QS[i1].right = i2 = this.newNode();
        this.QS[i2].nodeType = nType.T_SINK;
        this.QS[i2].paren = i1;
        // Set the third vertex to be the lower vertex of the randomly selected first segment
        // This is placed as the left branch of the root in the query tree
        this.QS[i1].left = i3 = this.newNode();
        this.QS[i3].nodeType = nType.T_Y;
        this.QS[i3].yVal = _min(this.SEG[segnum].v0, this.SEG[segnum].v1);
        this.QS[i3].paren = i1;
        // Set left branch of i3 to be a sink
        this.QS[i3].left = i4 = this.newNode();
        this.QS[i4].nodeType = nType.T_SINK;
        this.QS[i4].paren = i3;
        this.QS[i3].right = i5 = this.newNode();
        this.QS[i5].nodeType = nType.T_X;
        this.QS[i5].segnum = segnum;
        this.QS[i5].paren = i3;
        this.QS[i5].left = i6 = this.newNode();
        this.QS[i6].nodeType = nType.T_SINK;
        this.QS[i6].paren = i5;
        this.QS[i5].right = i7 = this.newNode();
        this.QS[i7].nodeType = nType.T_SINK;
        this.QS[i7].paren = i5;
        // Create 4 new trapezoids 
        t1 = this.newTrap();
        t2 = this.newTrap();
        t3 = this.newTrap();
        t4 = this.newTrap();
        // Trapezoids 1 and 2 are either side of the starting segment, left and right respectively
        // Trapezoid 4 is above the segment 
        // Trapezoid 3 is below the segment
        this.TR[t1].hi = Point.from(this.QS[i1].yVal);
        this.TR[t2].hi = Point.from(this.QS[i1].yVal);
        this.TR[t4].lo = Point.from(this.QS[i1].yVal);
        this.TR[t1].lo = Point.from(this.QS[i3].yVal);
        this.TR[t2].lo = Point.from(this.QS[i3].yVal);
        this.TR[t3].hi = Point.from(this.QS[i3].yVal);
        this.TR[t4].hi.y = Infinity;
        this.TR[t4].hi.x = Infinity;
        this.TR[t3].lo.y = -Infinity;
        this.TR[t3].lo.x = -Infinity;
        this.TR[t1].rseg = this.TR[t2].lseg = segnum;
        this.TR[t1].u0 = this.TR[t2].u0 = t4; // set above for t1/2
        this.TR[t1].d0 = this.TR[t2].d0 = t3; // set below for t1/2
        this.TR[t4].d0 = this.TR[t3].u0 = t1; // set above (t3) /below (t4) left
        this.TR[t4].d1 = this.TR[t3].u1 = t2; // set above (t3) /below (t4) right
        // Position of trap in QS, T_SINK represents that the node in tree is pointing to a trap
        this.TR[t1].sink = i6;
        this.TR[t2].sink = i7;
        this.TR[t3].sink = i4;
        this.TR[t4].sink = i2;
        this.TR[t1].stat = this.TR[t2].stat = ST_VALID;
        this.TR[t3].stat = this.TR[t4].stat = ST_VALID;
        // Again a reference to the trap represented by the T_SINKs
        this.QS[i2].trNum = t4;
        this.QS[i4].trNum = t3;
        this.QS[i6].trNum = t2;
        this.QS[i7].trNum = t1;
        this.SEG[segnum].isInserted = true;
        return root;
    }
    /* Add in the new segment into the trapezoidation and update Q and T
   * structures. First locate the two endpoints of the segment in the
   * Q-structure. Then start from the topmost trapezoid and go down to
   * the  lower trapezoid dividing all the trapezoids in between .
   */
    inserted(s, pt) {
        if (pt == FIRSTPT) {
            return this.SEG[this.SEG[s].prev].isInserted;
        }
        return this.SEG[this.SEG[s].next].isInserted;
    }
    locateEndpoint(v, vo, r) {
        switch (+this.QS[r].nodeType) {
            case nType.T_SINK:
                return this.QS[r].trNum;
            case nType.T_Y:
                if (_greaterThan(v, this.QS[r].yVal)) {
                    return this.locateEndpoint(v, vo, this.QS[r].right);
                }
                else if (_equalTo(v, this.QS[r].yVal)) {
                    if (_greaterThan(vo, this.QS[r].yVal)) {
                        return this.locateEndpoint(v, vo, this.QS[r].right);
                    }
                    else {
                        return this.locateEndpoint(v, vo, this.QS[r].left);
                    }
                }
                else {
                    return this.locateEndpoint(v, vo, this.QS[r].left);
                }
            case nType.T_X:
                if (_equalTo(v, this.SEG[this.QS[r].segnum].v0) || _equalTo(v, this.SEG[this.QS[r].segnum].v1)) {
                    if (FP_EQUAL(v.y, vo.y)) {
                        if (vo.x < v.x) {
                            return this.locateEndpoint(v, vo, this.QS[r].left);
                        }
                        else {
                            return this.locateEndpoint(v, vo, this.QS[r].right);
                        }
                    }
                    else if (_isLeftOf(this.SEG[this.QS[r].segnum], vo)) {
                        return this.locateEndpoint(v, vo, this.QS[r].left);
                    }
                    else {
                        return this.locateEndpoint(v, vo, this.QS[r].right);
                    }
                }
                else if (_isLeftOf(this.SEG[this.QS[r].segnum], v)) {
                    return this.locateEndpoint(v, vo, this.QS[r].left);
                }
                else {
                    this.locateEndpoint(v, vo, this.QS[r].right);
                }
            default:
                console.log(r);
                throw new Error("wot?");
                break;
        }
    }
    addSeg(s) {
        let isSwapped = false;
        let tFirst = 0;
        let tLast = 0;
        let triTop = 0;
        let triBot = 0;
        let i1, i2, sk;
        let tmpTriSeg;
        console.log("segnum: ", s);
        console.log(this.SEG[s]);
        if (_greaterThan(this.SEG[s].v1, this.SEG[s].v0)) {
            [this.SEG[s].v0, this.SEG[s].v1] = [this.SEG[s].v1, this.SEG[s].v0];
            [this.SEG[s].root0, this.SEG[s].root1] = [this.SEG[s].root1, this.SEG[s].root0];
            isSwapped = true;
        }
        console.log("root0: ", this.SEG[s].root0);
        if ((isSwapped) ? !this.inserted(s, LASTPT) : !this.inserted(s, FIRSTPT)) {
            let tu = this.locateEndpoint(this.SEG[s].v0, this.SEG[s].v1, this.SEG[s].root0);
            let tl = this.newTrap();
            this.TR[tl].stat = ST_VALID; // swap with line below?
            this.TR[tl] = Trap.from(this.TR[tu]);
            this.TR[tu].lo.y = this.SEG[s].v0.y;
            this.TR[tl].hi.y = this.SEG[s].v0.y;
            this.TR[tu].lo.x = this.SEG[s].v0.x;
            this.TR[tl].hi.x = this.SEG[s].v0.x;
            this.TR[tu].d0 = tl;
            this.TR[tu].d1 = 0;
            this.TR[tl].u0 = tu;
            this.TR[tl].u1 = 0;
            let tmpD = this.TR[tl].d0;
            if (tmpD > 0 && this.TR[tmpD].u0 == tu) {
                this.TR[tmpD].u0 = tl;
            }
            if (tmpD > 0 && this.TR[tmpD].u1 == tu) {
                this.TR[tmpD].u1 = tl;
            }
            tmpD = this.TR[tl].d1;
            if (tmpD > 0 && this.TR[tmpD].u0 == tu) {
                this.TR[tmpD].u0 = tl;
            }
            if (tmpD > 0 && this.TR[tmpD].u1 == tu) {
                this.TR[tmpD].u1 = tl;
            }
            i1 = this.newNode();
            i2 = this.newNode();
            sk = this.TR[tu].sink;
            this.QS[sk].nodeType = nType.T_Y;
            this.QS[sk].yVal = Point.from(this.SEG[s].v0);
            this.QS[sk].segnum = s;
            this.QS[sk].left = i2;
            this.QS[sk].right = i1;
            this.QS[i1].nodeType = nType.T_SINK;
            this.QS[i1].trNum = tu;
            this.QS[i1].paren = sk;
            this.QS[i2].nodeType = nType.T_SINK;
            this.QS[i2].trNum = tl;
            this.QS[i2].paren = sk;
            this.TR[tu].sink = i1;
            this.TR[tl].sink = i2;
            tFirst = tl;
        }
        else {
            tFirst = this.locateEndpoint(this.SEG[s].v0, this.SEG[s].v1, this.SEG[s].root0);
            triTop = 1;
            console.log("tFirst: ", this.SEG[s].v0, this.SEG[s].v1, this.SEG[s].root0);
        }
        if ((isSwapped) ? !this.inserted(s, FIRSTPT) : !this.inserted(s, LASTPT)) {
            let tu = this.locateEndpoint(this.SEG[s].v1, this.SEG[s].v0, this.SEG[s].root1);
            let tl = this.newNode();
            this.TR[tl] = this.TR[tu];
            this.TR[tl].stat = ST_VALID; //swap with line above?
            this.TR[tu].lo.y = this.SEG[s].v1.y;
            this.TR[tl].hi.y = this.SEG[s].v1.y;
            this.TR[tu].lo.x = this.SEG[s].v1.x;
            this.TR[tl].hi.x = this.SEG[s].v1.x;
            this.TR[tu].d0 = tl;
            this.TR[tu].d1 = 0;
            this.TR[tl].u0 = tu;
            this.TR[tl].u1 = 0;
            let tmpD = this.TR[tl].d0;
            if (tmpD > 0 && this.TR[tmpD].u0 == tu) {
                this.TR[tmpD].u0 = tl;
            }
            if (tmpD > 0 && this.TR[tmpD].u1 == tu) {
                this.TR[tmpD].u1 = tl;
            }
            tmpD = this.TR[tl].d1;
            if (tmpD > 0 && this.TR[tmpD].u0 == tu) {
                this.TR[tmpD].u0 = tl;
            }
            if (tmpD > 0 && this.TR[tmpD].u1 == tu) {
                this.TR[tmpD].u1 = tl;
            }
            i1 = this.newNode();
            i2 = this.newNode();
            sk = this.TR[tu].sink;
            this.QS[sk].nodeType = nType.T_Y;
            this.QS[sk].yVal = Point.from(this.SEG[s].v1);
            this.QS[sk].segnum = s;
            this.QS[sk].left = i2;
            this.QS[sk].right = i1;
            this.QS[i1].nodeType = nType.T_SINK;
            this.QS[i1].trNum = tu;
            this.QS[i1].paren = sk;
            this.QS[i2].nodeType = nType.T_SINK;
            this.QS[i2].trNum = tl;
            this.QS[i2].paren = sk;
            this.TR[tu].sink = i1;
            this.TR[tl].sink = i2;
            tLast = tu;
        }
        else {
            tLast = this.locateEndpoint(this.SEG[s].v1, this.SEG[s].v0, this.SEG[s].root1);
            triBot = 1;
        }
        let t = tFirst;
        let tFirstR;
        let tLastR;
        let tFirstL = 0;
        let tLastL = 0;
        let tn;
        while (t > 0 && _greaterThanEqualTo(this.TR[t].lo, this.TR[tLast].lo)) {
            let tSav = 0;
            let tnSav = 0;
            sk = this.TR[t].sink;
            i1 = this.newNode();
            i2 = this.newNode();
            this.QS[sk].nodeType = nType.T_X;
            this.QS[sk].segnum = s;
            this.QS[sk].left = i1;
            this.QS[sk].right = i2;
            this.QS[i1].nodeType = nType.T_SINK;
            this.QS[i1].trNum = t;
            this.QS[i1].paren = sk;
            this.QS[i2].nodeType = nType.T_SINK;
            this.QS[i2].trNum = tn = this.newTrap();
            this.TR[tn].stat = ST_VALID;
            this.QS[i2].paren = sk;
            if (t == tFirst) {
                tFirstR = tn;
            }
            if (_equalTo(this.TR[t].lo, this.TR[tLast].lo)) {
                tLastR = tn;
            }
            this.TR[tn] = this.TR[t];
            this.TR[t].sink = i1;
            this.TR[tn].sink = i2;
            tSav = t;
            tnSav = tn;
            if (this.TR[t].d0 <= 0 && this.TR[t].d1 <= 0) {
                throw new Error("adding segment error");
            }
            else if (this.TR[t].d0 > 0 && this.TR[t].d1 <= 0) {
                if (this.TR[t].u0 > 0 && this.TR[t].u1 > 0) {
                    if (this.TR[t].uSave > 0) {
                        if (this.TR[t].uSide == S_LEFT) {
                            this.TR[tn].u0 = this.TR[t].u1;
                            this.TR[t].u1 = -1;
                            this.TR[tn].u1 = this.TR[t].uSave;
                            this.TR[this.TR[t].u0].d0 = t;
                            this.TR[this.TR[tn].u0].d0 = tn;
                            this.TR[this.TR[tn].u1].d0 = tn;
                        }
                        else {
                            this.TR[tn].u1 = -1;
                            this.TR[tn].u0 = this.TR[t].u1;
                            this.TR[t].u1 = this.TR[t].u0;
                            this.TR[t].u0 = this.TR[t].uSave;
                            this.TR[this.TR[t].u0].d0 = t;
                            this.TR[this.TR[t].u1].d0 = t;
                            this.TR[this.TR[tn].u0].d0 = tn;
                        }
                        this.TR[t].uSave = this.TR[tn].uSave = 0;
                    }
                    else {
                        this.TR[tn].u0 = this.TR[t].u1;
                        this.TR[tn].u1 = -1;
                        this.TR[t].u1 = -1;
                        this.TR[this.TR[tn].u0].d0 = tn;
                    }
                }
                else {
                    let tmpU = this.TR[t].u0;
                    let td0 = this.TR[tmpU].d0;
                    let td1 = this.TR[tmpU].d1;
                    if (td0 > 0 && td1 > 0) {
                        if (this.TR[td0].rseg > 0 && !_isLeftOf(this.SEG[this.TR[td0].rseg], this.SEG[s].v1)) {
                            this.TR[t].u0 = this.TR[t].u1 = this.TR[tn].u1 = -1;
                            this.TR[this.TR[tn].u0].d1 = tn;
                        }
                        else {
                            this.TR[tn].u0 = this.TR[tn].u1 = this.TR[t].u1 = -1;
                            this.TR[this.TR[t].u0].d0 = t;
                        }
                    }
                    else {
                        this.TR[this.TR[t].u0].d0 = t;
                        this.TR[this.TR[t].u0].d1 = tn;
                    }
                }
                if (FP_EQUAL(this.TR[t].lo.y, this.TR[tLast].lo.y) && FP_EQUAL(this.TR[t].lo.x, this.TR[tLast].lo.x) && triBot) {
                    let tmpSeg = 0;
                    tmpTriSeg = isSwapped ? this.SEG[s].prev : this.SEG[s].next;
                    if (tmpTriSeg > 0 && _isLeftOf(this.SEG[tmpTriSeg], this.SEG[s].v0)) {
                        this.TR[this.TR[t].d0].u0 = t;
                        this.TR[tn].d0 = this.TR[tn].d1 = -1;
                    }
                    else {
                        this.TR[this.TR[tn].d0].u1 = tn;
                        this.TR[t].d0 = this.TR[t].d1 = -1;
                    }
                }
                else {
                    if (this.TR[this.TR[t].d0].u0 > 0 && this.TR[this.TR[t].d0].u1 > 0) {
                        if (this.TR[this.TR[t].d0].u0 == t) {
                            this.TR[this.TR[t].d0].uSave = this.TR[this.TR[t].d0].u1;
                            this.TR[this.TR[t].d0].uSide = S_LEFT;
                        }
                        else {
                            this.TR[this.TR[t].d0].uSave = this.TR[this.TR[t].d0].u0;
                            this.TR[this.TR[t].d0].uSide = S_RIGHT;
                        }
                    }
                    this.TR[this.TR[t].d0].u0 = t;
                    this.TR[this.TR[t].d0].u1 = tn;
                }
                t = this.TR[t].d0;
            }
            else if (this.TR[t].d0 <= 0 && this.TR[t].d1 > 0) {
                if (this.TR[t].u0 > 0 && this.TR[t].u1 > 0) {
                    if (this.TR[t].uSave > 0) {
                        if (this.TR[t].uSide == S_LEFT) {
                            this.TR[tn].u0 = this.TR[t].u1;
                            this.TR[t].u1 = -1;
                            this.TR[tn].u1 = this.TR[t].uSave;
                            this.TR[this.TR[t].u0].d0 = t;
                            this.TR[this.TR[tn].u0].d0 = tn;
                            this.TR[this.TR[tn].u1].d0 = tn;
                        }
                        else {
                            this.TR[tn].u1 = t - 1;
                            this.TR[tn].u0 = this.TR[t].u1;
                            this.TR[t].u1 = this.TR[t].u0;
                            this.TR[t].u0 = this.TR[t].uSave;
                            this.TR[this.TR[t].u0].d0 = t;
                            this.TR[this.TR[t].u1].d0 = t;
                            this.TR[this.TR[tn].u0].d0 = tn;
                        }
                        this.TR[t].uSave = this.TR[tn].uSave = 0;
                    }
                    else {
                        this.TR[tn].u0 = this.TR[t].u1;
                        this.TR[t].u1 = this.TR[tn].u1 = -1;
                        this.TR[this.TR[tn].u0].d0 = tn;
                    }
                }
                else {
                    let tmpU = this.TR[t].u0;
                    let td0 = this.TR[tmpU].d0;
                    let td1 = this.TR[tmpU].d1;
                    if (td0 > 0 && td1 > 0) {
                        if (this.TR[td0].rseg > 0 && !_isLeftOf(this.SEG[this.TR[td0].rseg], this.SEG[s].v1)) {
                            this.TR[t].u0 = this.TR[t].u1 = this.TR[tn].u1 = -1;
                            this.TR[this.TR[tn].u0].d1 = tn;
                        }
                        else {
                            this.TR[tn].u0 = this.TR[tn].u1 = this.TR[t].u1 = -1;
                            this.TR[this.TR[t].u0].d0 = t;
                        }
                    }
                    else {
                        this.TR[this.TR[t].u0].d0 = t;
                        this.TR[this.TR[t].u0].d1 = tn;
                    }
                }
                if (FP_EQUAL(this.TR[t].lo.y, this.TR[tLast].lo.y) && FP_EQUAL(this.TR[t].lo.x, this.TR[tLast].lo.x) && triBot) {
                    let tmpSeg = 0;
                    if (isSwapped) {
                        tmpTriSeg = this.SEG[s].prev;
                    }
                    else {
                        tmpTriSeg = this.SEG[s].next;
                    }
                    if (tmpSeg > 0 && _isLeftOf(this.SEG[tmpSeg], this.SEG[s].v0)) {
                        this.TR[this.TR[t].d1].u0 = t;
                        this.TR[tn].d0 = this.TR[tn].d1 = -1;
                    }
                    else {
                        this.TR[this.TR[tn].d1].u1 = tn;
                        this.TR[t].d0 = this.TR[t].d1 = -1;
                    }
                }
                else {
                    if (this.TR[this.TR[t].d1].u0 > 0 && this.TR[this.TR[t].d1].u1 > 0) {
                        if (this.TR[this.TR[t].d1].u0 == t) {
                            this.TR[this.TR[t].d1].uSave = this.TR[this.TR[t].d1].u1;
                            this.TR[this.TR[t].d1].uSide = S_LEFT;
                        }
                        else {
                            this.TR[this.TR[t].d1].uSave = this.TR[this.TR[t].d1].u0;
                            this.TR[this.TR[t].d1].uSide = S_RIGHT;
                        }
                    }
                    this.TR[this.TR[t].d1].u0 = t;
                    this.TR[this.TR[t].d1].u1 = tn;
                }
                t = this.TR[t].d1;
            }
            else {
                let tmpSeg = this.TR[this.TR[t].d0].rseg;
                let iD0 = false;
                let iD1 = false;
                let y0, yt;
                let tNext = 0;
                if (FP_EQUAL(this.TR[t].lo.y, this.SEG[s].v0.y)) {
                    if (this.TR[t].lo.x > this.SEG[s].v0.x) {
                        iD0 = true;
                    }
                    else {
                        iD1 = true;
                    }
                }
                else {
                    let tmpPt = new Point();
                    tmpPt.y = y0 = this.TR[t].lo.y;
                    yt = (y0 - this.SEG[s].v0.y) / (this.SEG[s].v1.y - this.SEG[s].v0.y);
                    tmpPt.x = this.SEG[s].v0.x + yt * (this.SEG[s].v1.x - this.SEG[s].v0.x);
                    if (_lessThan(tmpPt, this.TR[t].lo)) {
                        iD0 = true;
                    }
                    else {
                        iD1 = true;
                    }
                }
                if (this.TR[t].u0 > 0 && this.TR[t].u1 > 0) {
                    if (this.TR[t].uSave > 0) {
                        if (this.TR[t].uSide == S_LEFT) {
                            this.TR[tn].u0 = this.TR[t].u1;
                            this.TR[t].u1 = -1;
                            this.TR[tn].u1 = this.TR[t].uSave;
                            this.TR[this.TR[t].u0].d0 = t;
                            this.TR[this.TR[tn].u0].d0 = tn;
                            this.TR[this.TR[tn].u1].d0 = tn;
                        }
                        else {
                            this.TR[tn].u1 = -1;
                            this.TR[tn].u0 = this.TR[t].u1;
                            this.TR[t].u1 = this.TR[t].u0;
                            this.TR[t].u0 = this.TR[t].uSave;
                            this.TR[this.TR[t].u0].d0 = t;
                            this.TR[this.TR[t].u1].d0 = t;
                            this.TR[this.TR[tn].u0].d0 = tn;
                        }
                        this.TR[t].uSave = this.TR[tn].uSave = 0;
                    }
                    else {
                        this.TR[tn].u0 = this.TR[t].u1;
                        this.TR[tn].u1 = -1;
                        this.TR[t].u1 = -1;
                        this.TR[this.TR[tn].u0].d0 = tn;
                    }
                }
                else {
                    let tmpU = this.TR[t].u0;
                    let tD0 = this.TR[tmpU].d0;
                    let tD1 = this.TR[tmpU].d1;
                    if (tD0 > 0 && tD1 > 0) {
                        if (this.TR[tD0].rseg > 0 && !_isLeftOf(this.SEG[this.TR[tD0].rseg], this.SEG[s].v1)) {
                            this.TR[t].u0 = this.TR[t].u1 = this.TR[tn].u1 = -1;
                            this.TR[this.TR[tn].u0].d1 = tn;
                        }
                        else {
                            this.TR[tn].u0 = this.TR[tn].u1 = this.TR[t].u1 = -1;
                            this.TR[this.TR[t].u0].d0 = t;
                        }
                    }
                    else {
                        this.TR[this.TR[t].u0].d0 = t;
                        this.TR[this.TR[t].u0].d1 = tn;
                    }
                }
                if (FP_EQUAL(this.TR[t].lo.y, this.TR[tLast].lo.y) && FP_EQUAL(this.TR[t].lo.x, this.TR[tLast].lo.x) && triBot) {
                    this.TR[this.TR[t].d0].u0 = t;
                    this.TR[this.TR[t].d0].u1 = -1;
                    this.TR[this.TR[t].d1].u0 = tn;
                    this.TR[this.TR[t].d1].u1 = -1;
                    this.TR[tn].d0 = this.TR[t].d1;
                    this.TR[t].d1 = this.TR[tn].d1 = -1;
                    tNext = this.TR[t].d1;
                }
                else if (iD0) {
                    this.TR[this.TR[t].d0].u0 = t;
                    this.TR[this.TR[t].d0].u1 = tn;
                    this.TR[this.TR[t].d1].u0 = tn;
                    this.TR[this.TR[t].d1].u1 = -1;
                    this.TR[t].d1 = -1;
                    tNext = this.TR[t].d0;
                }
                else {
                    this.TR[this.TR[t].d0].u0 = t;
                    this.TR[this.TR[t].d0].u1 = -1;
                    this.TR[this.TR[t].d1].u0 = t;
                    this.TR[this.TR[t].d1].u1 = tn;
                    this.TR[t].d0 = this.TR[t].d1;
                    tNext = this.TR[t].d1;
                }
                t = tNext;
            }
            this.TR[tSav].rseg = this.TR[tnSav].lseg = s;
            console.log("t ", t, "tn ", tn);
        }
        tFirstL = tFirst;
        tLastL = tLast;
        console.log("s: ", s, "tfirsL: ", tFirstL, "tlastl: ", tLastL, "tfirstr: ", tFirstR, "tlastr: ", tLastR);
        this.mergeTrapezoids(s, tFirstL, tLastL, S_LEFT);
        this.mergeTrapezoids(s, tFirstR, tLastR, S_RIGHT);
        this.SEG[s].isInserted = true;
    }
    mergeTrapezoids(s, tFirst, tLast, side) {
        let tNext, ptNext;
        let cond = false;
        let t = tFirst;
        while (t > 0 && _greaterThanEqualTo(this.TR[t].lo, this.TR[tLast].lo)) {
            if (side == S_LEFT) {
                tNext = this.TR[t].d0;
                let tmp = tNext > 0 && this.TR[tNext].rseg == s;
                tNext = this.TR[t].d1;
                let tmp2 = tNext > 0 && this.TR[tNext].rseg == s;
                cond = tmp || tmp2;
            }
            else {
                tNext = this.TR[t].d0;
                let tmp = tNext > 0 && this.TR[tNext].lseg == s;
                tNext = this.TR[t].d1;
                let tmp2 = tNext > 0 && this.TR[tNext].lseg == s;
                cond = tmp || tmp2;
            }
            if (cond) {
                if (this.TR[t].lseg == this.TR[tNext].lseg && this.TR[t].rseg == this.TR[tNext].rseg) {
                    ptNext = this.QS[this.TR[tNext].sink].paren;
                    if (this.QS[ptNext].left == this.TR[tNext].sink) {
                        this.QS[ptNext].left = this.TR[t].sink;
                    }
                    else {
                        this.QS[ptNext].right = this.TR[t].sink;
                    }
                    if ((this.TR[t].d0 = this.TR[tNext].d0) > 0) {
                        if (this.TR[this.TR[t].d0].u0 == tNext) {
                            this.TR[this.TR[t].d0].u0 = t;
                        }
                        else if (this.TR[this.TR[t].d0].u1 == tNext) {
                            this.TR[this.TR[t].d0].u1 = t;
                        }
                    }
                    if ((this.TR[t].d1 = this.TR[tNext].d1) > 0) {
                        if (this.TR[this.TR[t].d1].u0 == tNext) {
                            this.TR[this.TR[t].d1].u0 = t;
                        }
                        else if (this.TR[this.TR[t].d1].u1 == tNext) {
                            this.TR[this.TR[t].d1].u1 = t;
                        }
                    }
                    this.TR[t].lo = Point.from(this.TR[tNext].lo);
                    this.TR[tNext].stat = ST_VALID;
                }
                else {
                    t = tNext;
                }
            }
            else {
                t = tNext;
            }
        }
    }
    findNewRoots(s) {
        if (this.SEG[s].isInserted) {
            return;
        }
        this.SEG[s].root0 = this.locateEndpoint(this.SEG[s].v0, this.SEG[s].v1, this.SEG[s].root0);
        this.SEG[s].root0 = this.TR[this.SEG[s].root0].sink;
        this.SEG[s].root1 = this.locateEndpoint(this.SEG[s].v1, this.SEG[s].v0, this.SEG[s].root1);
        this.SEG[s].root1 = this.TR[this.SEG[s].root1].sink;
    }
}
let verts = [new Point(0, 0), new Point(6, 0), new Point(6, 6), new Point(0, 6)];
let T = new Trapezoidate(verts);
T.constructTrapezoids(verts.length);
for (let i = 0; i < 2; ++i) {
    console.log("trap #", i, ": ", T.TR[i].u0, T.TR[i].u1);
}
// console.log(T.SEG.slice(0, verts.length));
//# sourceMappingURL=construct.js.map