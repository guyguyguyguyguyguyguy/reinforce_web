// ported from: http://gamma.cs.unc.edu/SEIDEL/

class Point {
  constructor(
    public x: number = 0,
    public y: number = 0,
  ) {}
}

class Segment {
  constructor(
    public v0: Point = new Point(), 
    public v1: Point = new Point(),
    public isInserted: boolean = false,
    public root0: number = 0,
    public root1: number = 0,
    public next: number = 0,
    public prev: number = 0,
  ) {}
}

class Trap {
  constructor(
    public lseg: number = 0,
    public rseg: number = 0,
    public hi: Point = new Point(),
    public lo: Point = new Point(),
    public u0: number = 0,
    public u1: number = 0,
    public d0: number = 0,
    public d1: number = 0,
    public sink: number = 0,
    public uSave: number = 0;
    public uSide: number = 0;
    public state: number = 0,
  ) {}
}

class NodeT{
  constructor(
    public nodeType: number = 0,
    public segnum: number = 0,
    public yVal: Point = new Point(),
    public trNum: number = 0,
    public paren: number = 0,
    public left: number = 0,
    public right: number = 0
  ) {}
}

const QSIZE: number = 8*100;
const TRSIZE: number = 4*100;
const SEGSIZE: number = 200;
const C_EPS: number = 1e-7;

const T_X: number = 1
const T_Y: number = 2;
const T_SINK: number = 3

const ST_VALID = 1;
const ST_INVALID = 2;

const FIRSTPT = 1;
const LASTPT = 2;

const S_LEFT = 1;
const S_RIGHT = 2;

let FP_EQUAL = (s: number, t: number): boolean => {return Math.abs(s-t) <= C_EPS}
let CROSS = (v0: Point, v1: Point, v2: Point) => {return ((v1.x - v0.x) * (v2.y - v0.y) - (v1.y - v0.y) * (v2.x - v0.x)) }

let qIdx;
let trIdx;

function _max(v0: Point, v1: Point): Point {
  if (v0.y > v1.y + C_EPS) {
    return v0;
  } else if (FP_EQUAL(v0.y, v1.y)) {
    if (v0.x > v1.x + C_EPS) {
      return v0;
    } else {
      return v1;
    }
  }
    
  return v1;
}

function _min(v0: Point, v1: Point): Point {
  if (v0.y < v1.y - C_EPS) {
    return v0;
  } else if (FP_EQUAL(v0.y, v1.y)) {
    if (v0.x < v1.x) {
      return v0;
    } else {
      return v1;
    }
  } 

  return v1;
}

function _greaterThan(v0: Point, v1: Point): boolean {
  if (v0.y > v1.y + C_EPS) {
    return true
  } else if (v0.y < v1.y - C_EPS) {
    return false;
  } 

  return v0.x > v1.x;
}

function _greaterThanEqualTo(v0: Point, v1: Point): boolean {
  if (v0.y > v1.y + C_EPS) {
    return true
  } else if (v0.y < v1.y - C_EPS) {
    return false;
  } 

  return v0.x => v1.x;
}

function _equalTo(v0: Point, v1: Point): boolean {
  return FP_EQUAL(v0.y, v1.y) && FP_EQUAL(v0.x, v1.x);
}

function _isLeftOf(s: Segment, v: Point): boolean {
  let area;
  if (_greaterThan(s.v1, s.v0)) {
    if (FP_EQUAL(s.v1.y, v.y)) {
      if (v.x < s.v1.x) {
        area = 1;
      } else {
        area = -1
      }
    } else if (FP_EQUAL(s.v0.y, v.y)) {
      if (v.x < s.v0.x) {
        area = 1; 
      } else {
        area = -1;
      }
    } else {
      area = CROSS(s.v0, s.v1, v);
    }
  } else {
    if (FP_EQUAL(s.v1.y, v.y)) {
      if (v.x < s.v1.x) {
        area = 1;
      } else {
        area = -1;
      }
    } else if (FP_EQUAL(s.v0.y, v.y)) {
      if(v.x < s.v0.x) {
        area = 1;
      } else {
        area = -1;
      }
    } else {
      area = CROSS(s.v1, s.v0, v);
    }
  }

  if (area > 0) {
    return true;
  }

  return false;
}

function* getRandSeg(nseg: number): Generator<number> {
  let arr = [...Array(nseg).keys()];
  let currIdx = nseg;
  let randIdx; 

  while(currIdx != 0) {
    randIdx = Math.floor(Math.random() * currIdx);
    currIdx--;
    [arr[currIdx], arr[randIdx]] = [arr[randIdx], arr[currIdx]];
  }

  for (let i = 0; i < nseg; ++i) {
    yield arr[i];
  }
}

function logStar(n: number): number {
  let v = n;
  let i
  for (i = 0; v >= 1; ++i) {
    v = Math.log(v);
  }

  return i - 1;
}

// Why do this?
function mathN(n: number, h: number): number {
  let v = n;
  for(let i = 0; i < h; ++i) {
    v = Math.log(v);
  }

  return Math.ceil(n/v);
}

class Trapezoidate {

  public QS: Array<NodeT>;
  public TR: Array<Trap>;
  public SEG: Array<Segment>;

  private nextSeg: Generator<number>;
  private qIdx: number;
  private trIdx: number;

  constructor(verts: Array<Point>) {
    this.QS = Array.from({length: QSIZE}, () => new NodeT());
    this.TR = Array.from({length: TRSIZE}, () => new Trap());
    this.SEG = Array.from({length: SEGSIZE}, () => new Segment());

    this.qIdx = 1;
    this.trIdx = 1;

    this.nextSeg = getRandSeg(verts.length);
    this.readSegments(verts);

  }
 j
  // Initialise SEG to contain each segment in the polygon 
  // including the vertices that make up the segment and a reference to the previous/next segments
  readSegments(verts: Array<Point>) {
    let last = verts.length -1;

    for(let i = 0; i < verts.length; ++i) {
      console.log(verts[i].x, verts[i].y);
      this.SEG[i].v0.x = verts[i].x;
      this.SEG[i].v0.y = verts[i].y;

      if (i == 0) {
        this.SEG[i].next = i +1;
        this.SEG[i].prev = last;
        this.SEG[last].v1 = this.SEG[i].v0;
      } else if (i == last) {
        this.SEG[i].next = 0;
        this.SEG[i].prev = i - 1;
        this.SEG[i-1].v1 = this.SEG[i].v0;
      } else {
        this.SEG[i].prev = i -1;
        this.SEG[i].next = i + 1;
        this.SEG[i-1].v1 = this.SEG[i].v0;
      }

      this.SEG[i].isInserted = false;
    }
  }

  constructTrapezoids(nseg: number) {
    let i;

    let root = this.initQueryStructure(this.nextSeg.next().value);

    for (i = 1; i <= nseg; ++i) {
      this.SEG[i].root0 = this.SEG[i].root1 = root;
    }

    for (let h = 1; h <= logStar(nseg); ++h) {
      for (i = mathN(nseg, h-1) + 1; i <= mathN(nseg, h); ++i) {
        this.addSeg(this.nextSeg.next().value);
      }
    }
  }
  
  // get Id of next node/vertex
  newNode(): number {
    if (this.qIdx < QSIZE) {
      return this.qIdx++;
    } else {
      throw new Error("Query table overflow");
    }
  }

  // Create new trapezoid
  newTrap(): number {
    if (this.trIdx < TRSIZE) {
      this.TR[this.trIdx].lseg = -1;
      this.TR[this.trIdx].rseg = -1;
      this.TR[this.trIdx].state = ST_VALID;

      return this.trIdx++;
    } else {
      throw new Error("Trap table overflow");
    }
  }

  // initialise query tree
  initQueryStructure(segnum: number): number {
   let i1: number, i2: number, i3: number, i4: number, i5: number, i6: number, i7:number, root: number;
   let t1: number, t2: number, t3: number, t4: number;
  
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

  inserted(s: number, pt: number): boolean {
    if (pt == FIRSTPT) {
      return this.SEG[this.SEG[s].prev].isInserted;
  } 
    return this.SEG[this.SEG[s].next].isInserted;
  }

  locateEndpoint(v: Point, vo: Point, r: number): number {
    switch (this.QS[r].nodeType) {
      case T_SINK:
        return this.QS[r].trNum;
      case T_Y:
        if(_greaterThan(v, this.QS[r].yVal)) {
          return this.locateEndpoint(v, vo, this.QS[r].right);
        } else if (_equalTo(v, this.QS[r].yVal)) {
          if (_greaterThan(vo, this.QS[r].yVal)) {
            return this.locateEndpoint(v, vo, this.QS[r].right);
          } else {
            return this.locateEndpoint(v, vo, this.QS[r].left);
          }
        } else {
          return this.locateEndpoint(v, vo, this.QS[r].left);
        }
      case T_X:
        if(_equalTo(v, this.SEG[this.QS[r].segnum].v0) || _equalTo(v, this.SEG[this.QS[r].segnum].v1)) {
        if (FP_EQUAL(v.y, vo.y)) {
          if (vo.x < v.x) {
            return this.locateEndpoint(v, vo, this.QS[r].left);
          } else {
            return this.locateEndpoint(v, vo, this.QS[r].right);
          }
          } else if (_isLeftOf(this.SEG[this.QS[r].segnum], vo)) {
            return this.locateEndpoint(v, vo, this.QS[r].left);   
          } else {
            return this.locateEndpoint(v, vo, this.QS[r].right);
          }
        } else if (_isLeftOf(this.SEG[this.QS[r].segnum], v)) {
          return  this.locateEndpoint(v, vo, this.QS[r].left);
        } else {
          this.locateEndpoint(v, vo, this.QS[r].right);
        }

      default: 
        throw new Error("wot?");
        break;
    }
  }

  addSeg(s: number) {
    let isSwapped: boolean = false;
    let tFirst: number 0;
    let tLast: number = 0 ;
    let triTop: number = 0;
    let triBot: number = 0;
    let i1: number, i2: number, sk: number;

    if (_greaterThan(this.SEG[s].v1, this.SEG[s].v0)) {
      [this.SEG[s].v0, this.SEG[s].v1] = [this.SEG[s].v1, this.SEG[s].v0];
      [this.SEG[s].root0, this.SEG[s].root1] = [this.SEG[s].root1, this.SEG[s].root0];
      isSwapped = true;
    } 

    if((isSwapped) ? !this.inserted(s, LASTPT) : !this.inserted(s, FIRSTPT)) {
      let tu = this.locateEndpoint(this.SEG[s].v0, this.SEG[s].v1, this.SEG[s].root0);  
      let tl = this.newTrap();
      this.TR[tl].state = ST_VALID; // swap with line below?
      this.TR[tl] = this.TR[tu];
      this.TR[tu].lo.y = this.TR[tl].hi.y = this.SEG[s].v0.y;
      this.TR[tu].lo.x = this.TR[tl].hi.x = this.SEG[s].v0.x;
      this.TR[tu].d0 = tl;
      this.TR[tu].d1 = 0;
      this.TR[tl].u0 = tr;
      this.TR[tl].u1 = 0;

      let tmpD = this.TR[tl].d0;
      if(tmpD > 0 && this.TR[tmpD].u0 == tu) {
        this.TR[tmpD].u0 = tl;
      }
      if(tmpD > 0 && this.TR[tmpD].u1 == tu) {
        this.TR[tmpD].u1 = tl;
      }
      tmpD = this.TR[tl].d1;
      if(tmpD > 0 && this.TR[tmpD].u0 == tu) {
        this.TR[tmpD].u0 = tl;
      }
      if(tmpD > 0 && this.TR[tmpD].u1 == tu) {
        this.TR[tmpD].u1 = tl;
      }

      i1 = this.newNode();
      i2 = this.newNode();
      sk = this.TR[tu].sink;

      this.QS[sk].nodeType = T_Y;
      this.QS[sk].yVal = this.SEG[s].v0;
      this.QS[sk].segnum = s;
      this.QS[sk].left = i2;
      this.QS[sk].right = i1;

      this.QS[i1].nodeType = T_SINK;
      this.QS[i1].trNum = tu;
      this.QS[i1].paren = sk;

      this.QS[i2].nodeType = T_SINK;
      this.QS[i2].trNum = tl;
      this.QS[i2].paren = sk;

      this.TR[tu].sink = i1;
      this.TR[tl].sink = i2;
      tFirst = tl;
    } else {
      tFirst = this.locateEndpoint(this.SEG[s].v0, this.SEG[s].v1, this.SEG[s].root0);
      trTop = 1;
    }
    
    if((isSwapped) ? !this.inserted(s, FIRSTPT) : !this.inserted(s, LASTPT)) {
      let tu = this.locateEndpoint(this.SEG[s].v1, this.SEG[s].v0, this.SEG[s].root1);

      let tl = this.newNode();
      this.TR[tl].state = ST_VALID; //swap with line below?
      this.TR[tl] = this.TR[tu];
      this.TR[tu].lo.y = this.TR[tl].hi.y = this.SEG[s].v1.y;
      this.TR[tu].lo.x = this.TR[tl].hi.x = this.SEG[s].v1.x;
      this.TR[tu].d0 = tl;
      this.TR[tu].d1 = 0;
      this.TR[tl].u0 = tu;
      this.TR[tl].u1 = 0;

      let tmpD = this.TR[tl].d0;
      if(tmpD > 0 && this.TR[tmpD].u0 == tu) {
        this.TR[tmpD].u0 = tl;
      }
      if(tmpD > 0 && this.TR[tmpD].u1 == tu) {
        this.TR[tmpD].u1 = tl;
      }
      tmpD = this.TR[tl].d1;
      if(tmpD > 0 && this.TR[tmpD].u0 == tu) {
        this.TR[tmpD].u0 = tl;
      }
      if(tmpD > 0 && this.TR[tmpD].u1 == tu) {
        this.TR[tmpD].u1 = tl;
      }

      i1 = this.newNode();
      i2 = this.newNode();
      sk = this.TR[tu].sink;

      this.QS[sk].nodeType = T_Y;
      this.QS[sk].yVal = this.SEG[s].v1;
      this.QS[sk].segnum = s;
      this.QS[sk].left = i2;
      this.QS[sk].right = i1;

      this.QS[i1].nodeType = T_SINK;
      this.QS[i1].trNum = tu;
      this.QS[i1].paren = sk;

      this.QS[i2].nodeType = T_SINK;
      this.QS[i2].trNum = tl;
      this.QS[i2].paren = sk;

      this.TR[tu].sink = i1;
      this.TR[tl].sink = i2;
      tFirst = tu;
    } else {
      tLast = this.locateEndpoint(this.SEG[s].v1, this.SEG[s].v0, this.SEG[s].root1);
      triBot = 1;
    }


    let t = tFirst;

    let tFirstR: number;
    let tLastR: number;
    let tn: number;

    while (t > 0 && _greaterThanEqualTo(this.TR[t].lo, this.TR[tLast].lo)) {
      let tSav: number;
      let tnSav: number;

      sk = this.TR[t].sink;
      i1 = this.newNode();
      i2 = this.newNode();

      this.QS[sk].nodeType = T_X;
      this.QS[sk].segnum = s;
      this.QS[sk].left = i1;
      this.QS[sk].right = i2;

      this.QS[i1].nodeType = T_SINK;
      this.QS[i1].trNum = t;
      this.QS[i1].paren = sk;
      
      this.QS[i2].nodeType = T_SINK;
      this.QS[i2].trNum = tn = this.newTrap();
      this.QS[tn].state = ST_VALID;
      this.QS[i2].paren = sk;


      if (t == tFirst) {
        tFirstR = tn;
      }
      if (_eqaulTo(this.TR[t].lo, this.TR[tLast].lo)) {
        tLastR = tn;
      }

      this.TR[tn] = this.TR[t];
      this.TR[t].sink = i1
      this.TR[tn].sink = i2;
      tSav = t;
      tnSav = tn;

      if (this.TR[t].d0 <= 0 && this.TR[t].d1 <= 0) {
        throw new Error("adding segment error");
      } else if (this.TR[t].d0 > 0 && this.TR[t].d1 <= 0) {
        if (this.TR[t].u0 > 0 && this.TR[t].u1 > 0) {
          if (this.TR[t].uSave > 0) {
            if (this.TR[t].uSide == S_LEFT) {
              this.TR[tn].u0 = this.TR[t].u1;
              this.TR[t].u1 = -1;
              this.TR[tn].u1 = this.TR[t].uSave;

              this.TR[this.TR[t].u0].d0 = t;
              this.TR[this.TR[tn].u0].d0 = tn;
              this.TR[this.TR[tn].u1].d0 = tn;
            } else {
              this.TR[tn].u1 = -1;
              this.TR[tn].u0 = this.TR[t].u1;
              this.TR[t].u1 = this.TR[t].u0;
              this.TR[t].u0 = this.TR[t].uSave;

              this.TR[this.TR[t].u0].d0 = t;
              this.TR[this.TR[t].u1].d0 = t;
              this.TR[this.TR[tn].u0].d0 = tn;
            }

            this.TR[t].uSave = this.TR[tn].uSave = 0;
          } else {
            this.TR[tn].u0 = this.TR[t].u1;
            this.TR[tn].u1 = -1;
            this.TR[t].u1 = -1;
            this.TR[this.TR[tn].u0].d0 = tn;
          }
        } else {
          let tmpU = this.TR[t].u0;
          let td0 = this.TR[tmpU].d0;
          let td1 = this.TR[tmpU].d1;

          if (td0 > 0 && td1 > 0) {
            if (this.TR[td0].rseg > 0 && !_isLeftOf(this.TR[td0].rseg, this.SEG[s].v1)) {
              this.TR[t].u0 = this.TR[t].u1 = this.TR[tn].u1 = -1;
              this.TR[this.TR[tn].u0].d1] = tn;
            } else {
              this.TR[tn].u0 = this.TR[tn].u1 = this.TR[t].u1 = -1;
              this.TR[this.TR[t].u0].d0 = t;
            }
        } else {
          this.TR[this.TR[t].u0].d0 = t;
          this.TR[this.TR[t].u0].d1 = tn;
      }
    }

    if(FP_EQAUL(this.TR[t].lo.y, this.TR[tLast].lo.y) && FP_EQUAL(this.TR[t].lo.x, this.TR[tLast].lo.x)) {
      this.TR[this.TR[t].d0] = t;
      this.TR[this.TR[t].d0] = -1;
      this.TR[this.TR[t].d1] = tn;
      this.TR[this.TR[t].d1] = -1;
    }
  }

}


let verts = [new Point(0, 0), new Point(0, 6), new Point(6, 6), new Point(6, 0)];

let T = new Trapezoidate(verts);
T.initQueryStructure(0)

// console.log(T.SEG.slice(0, verts.length));
