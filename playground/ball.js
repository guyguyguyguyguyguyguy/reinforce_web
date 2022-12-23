class Pos {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    move() {
        this.x -= 3;
    }

    add(change) {
        this.x += change;
        return this;
    }
}

let path = new Array();
path.push = function () {
    if (this.length >= 120) {
        this.shift();
    }
    return Array.prototype.push.apply(this, arguments);
};

class Ball {
    constructor(
        xin,
        yin,
        din,
        p = p5.instance,
        gravity = 0.29,
        strength = 0.5
    ) {
        this.ground = yin;
        this.x = xin;
        this.y = yin;
        this.v = 0;
        this.diameter = din;
        this.path = path;
        this.p = p;
        this.gravity = gravity;
        this.strength = strength;
    }

    move() {
        this.v += this.gravity;
        this.y += this.v;
        if (this.y >= this.ground) {
            this.y = this.ground;
            this.v = 0;
        }
        this.path.push(new Pos(this.x, this.y));
    }

    lift() {
        this.v -= this.strength;
    }

    lift_volume(vol) {
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

export { Ball };
