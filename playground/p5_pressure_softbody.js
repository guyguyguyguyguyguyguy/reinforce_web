//TODO: Colour by volume / pressure? vim
//
// Frames per second
let FPS = 120;

let NUM_POINTS = 60; // 20 by default, 50 works also

let NUM_SPRINGS = NUM_POINTS;

let LENGTH = 75;

let WIDTH = 0.95 * window.innerWidth;
let HEIGHT = 0.9 * window.innerHeight;
let RAD = Math.min(390.0, WIDTH / 2 - 1);
let R2 = Math.pow(RAD, 2);

let MASS = 1.0;
let BALL_RADIUS = 0.516; // 0.516 by default

// Spring constants
let KS = 500.0; // 755 by default
let KD = 45.0; // 35.0 by default

// Gravity force and user applied force
let G_MAGNITUDE = 0.0; // 110.0 by default
let GY = G_MAGNITUDE;
let GX = 0.0;

// Time interval for numeric integration
let DT = 0.01; // 0.005 by default

// Pressure to be reached before ball is at full capacity
let FINAL_PRESSURE = 130000; // 70000 by default

// Tangential and normal damping factors
let TDF = 0; // 0.95 by default, 1.0 works, 1.01 is cool
// A TDF of 1.0 means frictionless boundaries.
// If some energy were not lost due to the ball's
// spring-damping, the ball could continue
// traveling forever without any force.

let NDF = 0.5; // 0.1  by default

let pressure = 0;
let vol;
let close_idx;
let max_vol = 0;
let start = 1;

let myPoints;
let mySprings;

let mouseP = false;

class Points {
    constructor(n_pts) {
        this.x = new Array(n_pts).fill(0);
        this.y = new Array(n_pts).fill(0);
        this.vx = new Array(n_pts).fill(0);
        this.vy = new Array(n_pts).fill(0);
        this.fx = new Array(n_pts).fill(0);
        this.fy = new Array(n_pts).fill(0);
    }
}

class Springs {
    constructor(n_springs) {
        this.spring1 = new Array(n_springs).fill(0);
        this.spring2 = new Array(n_springs).fill(0);
        this.length = new Array(n_springs).fill(0);
        this.nx = new Array(n_springs).fill(0);
        this.ny = new Array(n_springs).fill(0);
    }
}

/**************************************************
 * Initialize the applet by declaring new objects
 * of type Points and Springs.
 *
 * Also, set things up for an animation.
 **************************************************/
function setup() {
    createCanvas(WIDTH, HEIGHT);
    frameRate(60);

    myPoints = new Points(NUM_POINTS);
    mySprings = new Springs(NUM_SPRINGS);

    createBall();
    idle();
}

function handleOrientation(gamma) {
    GY = G_MAGNITUDE * cos((gamma / 180.0) * PI);
    GX = G_MAGNITUDE * sin((gamma / 180.0) * PI);
}

normalise = (v) => {
    return (230 * v) / max_vol;
};

function draw() {
    fill(255);
    background(255);

    stroke(0);
    // ellipse(WIDTH / 2, HEIGHT / 2, 2 * RAD, 2 * RAD);

    // fill("#FF0000"); // pure red
    fill(normalise(vol));
    noStroke();
    beginShape();
    for (let i = 0; i < myPoints.x.length; i++) {
        vertex(myPoints.x[i], myPoints.y[i]);
    }
    endShape(CLOSE);

    idle();
    idle(); // get 2 bits of work done for 1 frame
    // better than just increasing DT, since we still converge

    stroke(0);
    if (mouseP) {
        line(mouseX, mouseY, myPoints.x[close_idx], myPoints.y[close_idx]);
    }

    text(frameRate(), 10, 30);
}

function mousePressed() {
    mouseP = true;
}

function mouseReleased() {
    mouseP = false;
}

function addSpring(i, j, k) {
    mySprings.spring1[i] = j;
    mySprings.spring2[i] = k;

    mySprings.length[i] = sqrt(
        (myPoints.x[j] - myPoints.x[k]) * (myPoints.x[j] - myPoints.x[k]) +
            (myPoints.y[j] - myPoints.y[k]) * (myPoints.y[j] - myPoints.y[k])
    );
}

/**************************************************
 * Simple function to lay out the points of the
 * ball in a circle, then create springs between
 * these points.
 **************************************************/
function createBall() {
    for (let i = 0; i < NUM_POINTS; i++) {
        myPoints.x[i] =
            BALL_RADIUS * cos((i * 2 * PI) / NUM_POINTS) + WIDTH / 2;
        myPoints.y[i] =
            BALL_RADIUS * sin((i * 2 * PI) / NUM_POINTS) + HEIGHT / 2;
    }

    for (let i = 0; i < NUM_POINTS - 1; i++) {
        addSpring(i, i, i + 1);
    }
    addSpring(NUM_POINTS - 1, NUM_POINTS - 1, 0);
}

function accumulateForces() {
    let x1, x2, y1, y2;
    let r12d;
    let vx12;
    let vy12;
    let f;
    let fx0, fy0;
    let pressurev;

    vol = 0;

    /**************************************************
     * Check for keyboard inputs and add gravitational
     * force.
     **************************************************/
    for (let i = 0; i < NUM_POINTS; i++) {
        // myPoints.fx[i] = pressure >= FINAL_PRESSURE ? GX * MASS : 0;
        // myPoints.fy[i] = pressure >= FINAL_PRESSURE ? GY * MASS : 0;

        myPoints.fx[i] = 0;
        myPoints.fy[i] = 0;
    }
    

    /**************************************************
     * Check for mouse inputs.
     **************************************************/
    if (mouseP) {
        x2 = mouseX;
        y2 = mouseY;

        let distt = Infinity;
        for (let i = 0; i < NUM_POINTS; ++i) {
            let d = dist(myPoints.x[i], myPoints.y[i], x2, y2);
            if (d < distt) {
                distt = d;
                close_idx = i;
            }
        }
        x1 = myPoints.x[close_idx];
        y1 = myPoints.y[close_idx];

        r12d = sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
        f =
            (r12d - 2.2) * 22 +
            (myPoints.vx[0] * (x1 - x2) + myPoints.vy[0] * (y1 - y2)) *
                (54 / r12d);

        fx0 = ((x1 - x2) / r12d) * f;
        fy0 = ((y1 - y2) / r12d) * f;

        myPoints.fx[close_idx] -= fx0;
        myPoints.fy[close_idx] -= fy0;
    }
    
    if (start == 0) {
      myPoints.fx[0] -= 1000000 * random();
      myPoints.fy[0] -= 1000000 * random();
      start += 1;
    }

    /**************************************************
     * Calculate force due to each spring.
     **************************************************/
    for (let i = 0; i < NUM_SPRINGS; i++) {
        x1 = myPoints.x[mySprings.spring1[i]];
        x2 = myPoints.x[mySprings.spring2[i]];
        y1 = myPoints.y[mySprings.spring1[i]];
        y2 = myPoints.y[mySprings.spring2[i]];

        // Find the distance between each spring:
        r12d = sqrt(pow(x1 - x2, 2) + pow(y1 - y2, 2));

        // Accumulate spring forces:
        if (r12d !== 0) {
            vx12 =
                myPoints.vx[mySprings.spring1[i]] -
                myPoints.vx[mySprings.spring2[i]];
            vy12 =
                myPoints.vy[mySprings.spring1[i]] -
                myPoints.vy[mySprings.spring2[i]];

            f =
                (r12d - mySprings.length[i]) * KS +
                (vx12 * (x1 - x2) + vy12 * (y1 - y2)) * (KD / r12d);

            fx0 = ((x1 - x2) / r12d) * f;
            fy0 = ((y1 - y2) / r12d) * f;

            myPoints.fx[mySprings.spring1[i]] -= fx0;
            myPoints.fy[mySprings.spring1[i]] -= fy0;

            myPoints.fx[mySprings.spring2[i]] += fx0;
            myPoints.fy[mySprings.spring2[i]] += fy0;
        }

        // Calculate normal vectors for use with finding pressure force:
        mySprings.nx[i] = -(y1 - y2) / r12d;
        mySprings.ny[i] = (x1 - x2) / r12d;
    }

    /**************************************************
     * This uses the divergence theorem (2d version)
     * to calculate the vol (area) of the body (which is
     * why we needed to calculate the normal vectors
     * previously), and then uses that to calculate
     * pressure (since P * V = constant?).
     *
     * TODO: rewrite this using Green's theorem /
     * surveyor's formula for area
     **************************************************/
    for (let i = 0; i < NUM_SPRINGS; i++) {
        x1 = myPoints.x[mySprings.spring1[i]];
        x2 = myPoints.x[mySprings.spring2[i]];
        y1 = myPoints.y[mySprings.spring1[i]];
        y2 = myPoints.y[mySprings.spring2[i]];

        r12d = sqrt(pow(x1 - x2, 2) + pow(y1 - y2, 2));

        vol += 0.5 * abs(x1 - x2) * abs(mySprings.nx[i]) * r12d;
    }

    max_vol = vol > max_vol ? vol : max_vol;

    for (let i = 0; i < NUM_SPRINGS; i++) {
        x1 = myPoints.x[mySprings.spring1[i]];
        x2 = myPoints.x[mySprings.spring2[i]];
        y1 = myPoints.y[mySprings.spring1[i]];
        y2 = myPoints.y[mySprings.spring2[i]];

        r12d = sqrt(pow(x1 - x2, 2) + pow(y1 - y2, 2));

        pressurev = r12d * pressure * (1.0 / vol);

        myPoints.fx[mySprings.spring1[i]] += mySprings.nx[i] * pressurev;
        myPoints.fy[mySprings.spring1[i]] += mySprings.ny[i] * pressurev;
        myPoints.fx[mySprings.spring2[i]] += mySprings.nx[i] * pressurev;
        myPoints.fy[mySprings.spring2[i]] += mySprings.ny[i] * pressurev;
    }
}

function integrateHeun() {
    let drx, dry;

    let fxsaved = new Array(NUM_POINTS);
    let fysaved = new Array(NUM_POINTS);

    let vxsaved = new Array(NUM_POINTS);
    let vysaved = new Array(NUM_POINTS);

    for (let i = 0; i < NUM_POINTS; i++) {
        fxsaved[i] = myPoints.fx[i];
        fysaved[i] = myPoints.fy[i];

        vxsaved[i] = myPoints.vx[i];
        vysaved[i] = myPoints.vy[i];

        myPoints.vx[i] += (myPoints.fx[i] / MASS) * DT;
        drx = myPoints.vx[i] * DT;

        myPoints.x[i] += drx;

        myPoints.vy[i] += (myPoints.fy[i] / MASS) * DT;
        dry = myPoints.vy[i] * DT;

        myPoints.y[i] += dry;
    }

    accumulateForces();

    for (let i = 0; i < NUM_POINTS; i++) {
        myPoints.vx[i] =
            vxsaved[i] + (((myPoints.fx[i] + fxsaved[i]) / MASS) * DT) / 2;
        drx = myPoints.vx[i] * DT;

        myPoints.x[i] += drx;

        myPoints.vy[i] =
            vysaved[i] + (((myPoints.fy[i] + fysaved[i]) / MASS) * DT) / 2;
        dry = myPoints.vy[i] * DT;

        myPoints.y[i] += dry;
      
      
        // Boundary checking
        myPoints.x[i] = min(myPoints.x[i], WIDTH / 2 + RAD);
        myPoints.x[i] = max(myPoints.x[i], WIDTH / 2 - RAD);

        myPoints.y[i] = min(myPoints.y[i], HEIGHT / 2 + RAD);
        myPoints.y[i] = max(myPoints.y[i], HEIGHT / 2 - RAD);

        if (
            myPoints.x[i] + drx >
                sqrt(R2 - pow(myPoints.y[i] - HEIGHT / 2, 2)) + WIDTH / 2 ||
            myPoints.x[i] + drx <
                -sqrt(R2 - pow(myPoints.y[i] - HEIGHT / 2, 2)) + WIDTH / 2
        ) {
            drx *= -1;
            dry *= -1;

            let vx0 = myPoints.vx[i];
            let vy0 = myPoints.vy[i];

            let sinTheta = (myPoints.y[i] - HEIGHT / 2) / RAD;
            let cosTheta = (myPoints.x[i] - WIDTH / 2) / RAD;

            myPoints.vx[i] = -vx0;
            myPoints.vy[i] = -vy0;
            myPoints.vx[i] =
                vy0 *
                    (-TDF * sinTheta * cosTheta - NDF * sinTheta * cosTheta) +
                vx0 * (TDF * sinTheta * sinTheta - NDF * cosTheta * cosTheta);
            myPoints.vy[i] =
                vy0 * (TDF * cosTheta * cosTheta - NDF * sinTheta * sinTheta) +
                vx0 * (-TDF * sinTheta * cosTheta - NDF * sinTheta * cosTheta);
        }

        if (myPoints.y[i] > HEIGHT / 2 + RAD / 2) {
            myPoints.y[i] = min(
                myPoints.y[i],
                sqrt(abs(R2 - pow(myPoints.x[i] - WIDTH / 2, 2))) + HEIGHT / 2
            );
        }

        if (myPoints.y[i] < HEIGHT / 2 - RAD / 2) {
            myPoints.y[i] = max(
                myPoints.y[i],
                -sqrt(abs(R2 - pow(myPoints.x[i] - WIDTH / 2, 2))) + HEIGHT / 2
            );
        }

        if (myPoints.x[i] > WIDTH / 2 + RAD / 2) {
            myPoints.x[i] = min(
                myPoints.x[i],
                sqrt(abs(R2 - pow(myPoints.y[i] - HEIGHT / 2, 2))) + WIDTH / 2
            );
        }

        if (myPoints.x[i] < WIDTH / 2 - RAD / 2) {
            myPoints.x[i] = max(
                myPoints.x[i],
                -sqrt(abs(R2 - pow(myPoints.y[i] - HEIGHT / 2, 2))) + WIDTH / 2
            );
        }
    }
}

function idle() {
    accumulateForces();
    integrateHeun();

    if (pressure < FINAL_PRESSURE) {
        pressure += FINAL_PRESSURE / 300;
    }
}

