import P5 from "p5";

const PRESSURE: number = 10;
const MASS: number = 1;

//TODO: USe p5.vectors

class Point {
    public x: number;
    public y: number;
    public vx: number;
    public vy: number;
    public fx: number;
    public fy: number;
    constructor(p: Array<number>, v?: Array<number>, f?: Array<number>) {
        [this.x, this.y] = p;
        [this.vx, this.vy] = [0, 0];
        [this.fx, this.fy] = [0, 0];
    }
}

class Spring {
    public p1: number;
    public p2: number;
    public nx: number;
    public ny: number;
    constructor(ps: Array<number>, public len: number, nv?: Array<number>) {
        [this.p1, this.p2] = ps;
        [this.nx, this.ny] = [0, 0];
    }
}

class Shape {
    verts: number;
    ks: number;
    kd: number;
    public points: Array<Point>;
    springs: Array<Spring>;
    constructor(
        private p: P5,
        public cx: number,
        public cy: number,
        public rad: number,
        private oCircles: Array<Shape>
    ) {
        this.verts = p.int(p.random(2, 50));
        this.ks = p.random();
        this.kd = p.random();
        this.points = [];
        this.springs = [];
        this.createShape();
    }

    createShape() {
        const { p } = this;

        for (let i = 0; i < this.verts; ++i) {
            let x = this.cx + this.rad * p.cos((i / this.verts) * 2 * p.PI);
            let y = this.cy + this.rad * p.sin((i / this.verts) * 2 * p.PI);
            this.points[i] = new Point([x, y]);
        }
        let i = 1;
        for (i; i < this.verts - 1; ++i) {
            this.addSpring(i, i, i + 1);
        }
        this.addSpring(i - 1, i - 1, 1);
    }

    addSpring(pi: number, i: number, j: number) {
        const { p } = this;

        let sLen = p.dist(
            this.points[i].x,
            this.points[i].y,
            this.points[j].x,
            this.points[j].y
        );
        this.springs[pi] = new Spring([i, j], sLen);
    }

    springForce() {
        const { p } = this;

        for (let s of this.springs) {
            let x1 = this.points[s.p1].x;
            let y1 = this.points[s.p1].y;
            let x2 = this.points[s.p2].x;
            let y2 = this.points[s.p2].y;

            let r12d = p.sq(p.dist(x1, y1, x2, y2));
            if (r12d !== 0) {
                let vx12 = this.points[s.p1].vx - this.points[s.p2].vx;
                let vy12 = this.points[s.p1].vy - this.points[s.p2].vy;

                let f =
                    (r12d - s.len) * this.ks +
                    ((vx12 * (x1 - x2) + vy12 * (y1 - y2)) * this.kd) / r12d;

                let Fx = ((x1 - x2) / r12d) * f;
                let Fy = ((y1 - y2) / r12d) * f;

                this.points[s.p1].fx -= Fx;
                this.points[s.p1].fy -= Fy;

                this.points[s.p2].fx += Fx;
                this.points[s.p2].fy += Fy;
            }

            s.nx = (y1 - y2) / r12d;
            s.ny = -(x1 - x2) / r12d;
        }
    }

    getVolume(): number {
        const { p } = this;

        let volume: number = 0;

        for (let s of this.springs) {
            let x1 = this.points[s.p1].x;
            let y1 = this.points[s.p1].y;
            let x2 = this.points[s.p2].x;
            let y2 = this.points[s.p2].y;

            let r12d = p.sq(p.dist(x1, y1, x2, y2));

            volume += 0.5 * p.abs(x1 - x2) * p.abs(s.nx) * r12d;
        }
        return volume;
    }

    pressureForce() {
        const { p } = this;

        let volume = this.getVolume();
        for (let s of this.springs) {
            let x1 = this.points[s.p1].x;
            let y1 = this.points[s.p1].y;
            let x2 = this.points[s.p2].x;
            let y2 = this.points[s.p2].y;

            let r12d = p.sq(p.dist(x1, y1, x2, y2));

            let pressureV = r12d * PRESSURE * (1 / volume);

            this.points[s.p1].fx += s.nx * pressureV;
            this.points[s.p1].fy += s.ny * pressureV;
            this.points[s.p2].fx += s.nx * pressureV;
            this.points[s.p2].fy += s.ny * pressureV;
        }
    }

    #integrateEuler() {
        const { p } = this;

        let dry: number = 0;
        const DT: number = 1 / p.frameRate();

        for (let pt of this.points) {
            pt.vx += (pt.fx / MASS) * DT;
            pt.x += pt.vx * DT;

            pt.vy += pt.fy * DT;
            let dry = pt.vy * DT;

            if (pt.y + dry < p.windowWidth) {
                dry = p.windowWidth - pt.y;
                pt.vy *= -0.1;
            }

            pt.y += dry;
        }
    }

    #integrateHeun() {}
}

export default function sketch(p: P5) {
    let shapes: Array<Shape> = [];

    p.setup = () => {
        let height: number = p.windowHeight;
        let width: number = p.windowWidth;
        p.createCanvas(width, height - 58);
        for (let i = 0; i < 20; i++) {
            let c = new Shape(
                p,
                p.random(0, width),
                p.random(0, height - 58),
                p.random(0, 100),
                shapes
            );
            shapes.push(c);
        }
    };

    p.draw = () => {
        p.background(225);
        p.stroke(10);
        p.strokeWeight(1);
        for (let s of shapes) {
            p.fill(235);
            p.beginShape();
            for (let ps of s.points) {
                p.vertex(ps.x, ps.y);
            }
            p.endShape(p.CLOSE);
        }
        p.noLoop();
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight - 58);
    };
}

new P5(sketch);
