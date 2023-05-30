import P5 from "p5";
import 'p5/lib/addons/p5.sound';

declare global {
    interface Array<T> {
        limited_push(o: T): T[];
    }
}

Array.prototype.limited_push = function (o: Pos) {
    this.push(o);
    return (this.length >= 120) ? this.shift() : this;
}

class Pos {
    constructor(
        public x: number,
        public y: number
    ) { }

    move() {
        this.x -= 3;
    }

    add(change: number) {
        this.x += change;
        return this;
    }
}

class Ball {
    private ground: number;
    private v: number;
    public path: Array<Pos>
    private gravity: number;
    private strength: number;
    constructor(
        private p: P5,
        public x: number,
        public y: number,
        private diameter: number,
    ) {
        this.ground = y;
        this.v = 0;
        this.gravity = 0.27;
        this.strength = 0.5;
        this.path = [];
    }

    move() {
        this.v += this.gravity;
        this.y += this.v;
        if (this.y >= this.ground) {
            this.y = this.ground;
            this.v = 0;
        }
        this.path.limited_push(new Pos(this.x, this.y));
    }

    lift() {
        this.v -= this.strength;
    }

    lift_volume(vol: number) {
        this.v -= vol;
    }

    display() {
        const { p } = this;

        let c = p.color(110);
        p.fill(c);
        p.noStroke();
        p.ellipse(this.x, this.y, this.diameter, this.diameter);

        let c2 = this.p.color(140);
        p.fill(c2);
        p.noStroke();
        this.path.forEach((pos) => {
            pos.move();
            p.ellipse(pos.x, pos.y, 10, 10);
        });
    }
}

class FunDraw {
    public path: Array<number>;
    private func: Function;
    private step: number;
    constructor(
        public len: number,
    ) {
        this.func = this.generateFunc();
        this.step = len;
        this.path = Array(this.len).fill(0).map((_, i) => this.func(i));
    }

    generateFunc(): Function {
        return (x: number): number => { return 605 };
    }

    updatePath() {
        this.path.push(this.func(++this.step));
        this.path.shift();
    }
}

const normalise = (max: number, v: number) => max != 0 ? (v / max) * 0.6 : 0;
const round2 = (v: number) => Math.round(v * 100) / 100;
const average = (arr: Array<number>) => arr.reduce((a, b) => a + b, 0) / arr.length;

export default function sketch(p: P5) {
    let vol: number;
    let mic: P5.AudioIn;
    let maxV: number = 0;
    let mp: boolean = false;
    let ball: Ball = new Ball(p, p.windowWidth / 2, p.windowHeight / 2, 90);
    let og: number = p.int((p.windowWidth / 2) - 100);
    let target: FunDraw = new FunDraw(og);

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight - 58);
        p.noStroke();
        p.fill(255, 255);

        p.stroke(126);
        p.line(p.windowWidth / 2 - 50, p.windowHeight / 2, p.windowWidth / 2 + 50, p.windowHeight / 2)

        p.textSize(17);

        mic = new P5.AudioIn();
        mic.start();
    };

    p.draw = () => {
        p.background(225);
        p.stroke(256);
        p.strokeWeight(4);
        p.line(p.windowWidth / 2 - 100, p.windowHeight / 2 + 45, p.windowWidth / 2 + 100, p.windowHeight / 2 + 45)

        let n = (p.windowWidth / 2 < og + 100) ? (p.windowWidth / 2 - 100) : og;
        for (let i = 0; i < n - 1; ++i) {
            p.line(i + 54 + p.windowWidth / 2, target.path[i], i + 55 + p.windowWidth / 2, target.path[i + 1]);
        }
        target.updatePath();

        vol = mic.getLevel() * 1000;
        maxV = vol > maxV ? vol : maxV;

        p.noStroke();
        p.text(round2(vol), 10, p.windowHeight - 80);
        p.text(round2(maxV), p.windowWidth - 50, p.windowHeight - 80);

        if (mp) {
            ball.lift();
        } else {
            ball.lift_volume(normalise(maxV, vol));
        }


        ball.move();
        ball.display();
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight - 58);
        let prevX = ball.x;
        ball.x = p.windowWidth / 2;
        ball.path.forEach((p) => p.add(ball.x - prevX));
    };

    p.mousePressed = () => {
        mp = true;
    };

    p.mouseReleased = () => {
        mp = false;
    };
}

new P5(sketch);
