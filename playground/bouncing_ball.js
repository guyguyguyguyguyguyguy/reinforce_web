import { Ball } from "./ball.js";

const min = 0;
const max = 2;
const normalise = (v) => (max - min) * ((v - 0) / (1)) + min;
const round2 = (v) => Math.round(v * 100) / 100;
const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

export default function sketch(p) {
    let vol; // : int 
    let mic; // : p5.AudioIn
    let maxV = 0;
    let mp = false;
    let ball = new Ball(p.windowWidth / 2, p.windowHeight / 2, 90, p);

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight - 58);
        p.noStroke();
        p.fill(255, 255);

        p.stroke(126);
        p.line(p.windowWidth / 2 - 50, p.windowHeight / 2, p.windowWidth / 2 + 50, p.windowHeight / 2)

        p.textSize(17);

        mic = new p5.AudioIn();
        mic.start();
    };

    p.draw = () => {
        p.background(225);
        p.stroke(256);
        p.strokeWeight(4);
        p.line(p.windowWidth / 2 - 100, p.windowHeight / 2 + 45, p.windowWidth / 2 + 100, p.windowHeight / 2 + 45)

        // Doesn't work;
        vol = mic.getLevel();
        maxV = vol > maxV ? vol : maxV;

        p.noStroke();
        p.text(round2(normalise(vol)), 10, p.windowHeight - 80);
        p.text(round2(normalise(maxV)), p.windowWidth - 50, p.windowHeight - 80);

        if (mp) {
            ball.lift();
        } else {
            ball.lift_volume(normalise(vol));
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
