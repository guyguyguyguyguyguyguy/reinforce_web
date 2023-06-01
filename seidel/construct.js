// ported from: http://gamma.cs.unc.edu/SEIDEL/
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
const FIRSTPT = 1;
const LASTPT = 2;
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
    for (let i = 0; i < nseg; ++i) {
        yield arr[i];
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
        let i;
        let root = this.initQueryStructure(this.nextSeg.next().value);
        for (i = 1; i <= nseg; ++i) {
            this.SEG[i].root0 = this.SEG[i].root1 = root;
        }
        for (let h = 1; h <= logStar(nseg); ++h) {
            for (i = mathN(nseg, h - 1) + 1; i <= mathN(nseg, h); ++i) {
                this.addSeg(this.nextSeg.next().value);
            }
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
            this.TR[this.trIdx].state = ST_VALID;
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
        this.QS[i1].nodeType = T_Y;
        this.QS[i1].yVal = _max(this.SEG[segnum].v0, this.SEG[segnum].v1);
        root = i1;
        // Set right branch of root to be a sink
        this.QS[i1].right = i2 = this.newNode();
        this.QS[i2].nodeType = T_SINK;
        this.QS[i2].paren = i1;
        // Set the third vertex to be the lower vertex of the randomly selected first segment
        // This is placed as the left branch of the root in the query tree
        this.QS[i1].left = i3 = this.newNode();
        this.QS[i3].nodeType = T_Y;
        this.QS[i3].yVal = _min(this.SEG[segnum].v0, this.SEG[segnum].v1);
        this.QS[i3].paren = i1;
        // Set left branch of i3 to be a sink
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
        // Create 4 new trapezoids 
        t1 = this.newTrap();
        t2 = this.newTrap();
        t3 = this.newTrap();
        t4 = this.newTrap();
        // Trapezoids 1 and 2 are either side of the starting segment, left and right respectively
        // Trapezoid 4 is above the segment 
        // Trapezoid 3 is below the segment
        this.TR[t1].hi = this.TR[t2].hi = this.TR[t4].lo = this.QS[i1].yVal;
        this.TR[t1].lo = this.TR[t2].lo = this.TR[t3].hi = this.QS[i3].yVal;
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
        this.TR[t1].state = this.TR[t2].state = ST_VALID;
        this.TR[t3].state = this.TR[t4].state = ST_VALID;
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
        switch (this.QS[r].nodeType) {
            case T_SINK:
                return this.QS[r].trNum;
            case T_Y:
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
            case T_X:
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
                throw new Error("wot?");
                break;
        }
    }
    addSeg(s) {
        let isSwapped = false;
        if (_greaterThan(this.SEG[s].v1, this.SEG[s].v0)) {
            [this.SEG[s].v0, this.SEG[s].v1] = [this.SEG[s].v1, this.SEG[s].v0];
            [this.SEG[s].root0, this.SEG[s].root1] = [this.SEG[s].root1, this.SEG[s].root0];
            isSwapped = true;
        }
        if ((isSwapped) ? !this.inserted(s, LASTPT) : !this.inserted(s, FIRSTPT)) {
            let tu = this.locateEndpoint(this.SEG[s].v0, this.SEG[s].v1, this.SEG[s].root0);
        }
    }
}
let verts = [new Point(0, 0), new Point(0, 6), new Point(6, 6), new Point(6, 0)];
let T = new Trapezoidate(verts);
T.initQueryStructure(0);
// console.log(T.SEG.slice(0, verts.length));
//# sourceMappingURL=construct.js.map