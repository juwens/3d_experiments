import { Triangle, Vec3, Vector3, mean, median } from "./math";
import { Cube, Teapot_150k, Teapot_19k, Teapot_3k, rotateX, rotateY, rotZ as rotateZ, scale, transform, translate } from "./models";
import { delay } from "./util";

new EventSource('/esbuild').addEventListener('change', () => location.reload());

document.addEventListener("DOMContentLoaded", event => {
    const appElm = document.getElementById("app");
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const context: CanvasRenderingContext2D = canvas.getContext("2d")!;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = "black";
    context.fillStyle = "hotpink";
    context.lineWidth = 1;

    context.translate(canvas.width / 2, canvas.height / 2);
    const scale = 0.45;
    context.scale(canvas.width * scale, canvas.height * scale);
    context.fillRect(-1, -1, 2, 2);
    renderLoop(canvas, context);
});

class PerformanceCounter {
    #frametimes: { time: number, timestamp: number }[] = [];
    #maxIdx: number = 100;

    constructor() { }

    addFrameTime(frmDuration: number) {
        this.#frametimes.push({ time: frmDuration, timestamp: performance.now() });
        while (this.#frametimes.length > 30) {
            this.#frametimes.shift();
        }
    }

    mean() {
        return mean(this.#frametimes.map(x => x.time));
    }

    median() {
        return median(this.#frametimes.map(x => x.time));
    }

    fps() {
        const now = performance.now()
        const prevSecond = now - 1000;
        const entries = this.#frametimes.map(x => x.timestamp).filter(x => x >= prevSecond);
        return entries.length * 1000 / (now - entries[0]);
    }
}

const perf = new PerformanceCounter();

let loadedVectors: Vec3[] = [];


//Cube()
    Teapot_3k()
    .then(x => {
        loadedVectors = [...x];
    });

const halfPi = Math.PI / 2;
const quaterPi = Math.PI / 4;
const frameCap = 30;
const minFrameDuration = 1000 / frameCap;

async function renderLoop(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const lightDirection = Vector3.create([-1, -1, 1]);
    const viewingDirection = Vector3.create([0, 0, 1]);

    while (true) {
        const start = performance.now();
        render(context, viewingDirection, lightDirection, { wireframe: false });
        const duration = performance.now() - start;
        await delay(Math.max(0, minFrameDuration - duration));
    }
}

function render(context: CanvasRenderingContext2D, viewingDirection: Vector3, lightDirection: Vector3, options: { wireframe: boolean }) {
    const start = performance.now();

    let vectors = [...loadedVectors];
    const phiDeg = Date.now() / 100 % 360;
    const phiRad = rad(phiDeg);
    vectors = transform(vectors, scale(1, -1, 1));
    vectors = transform(vectors, rotateY(phiRad));
    //vectors = transform(vectors, rotateX(phiRad + 0.5));
    //vectors = transform(vectors, rotateZ(phiRad + 0.1));
    vectors = transform(vectors, rotateX(-0.3));
    vectors = transform(vectors, rotateZ(0));

    context.clearRect(-2, -2, 4, 4);

    for (let i = 0; i < vectors.length; i += 3) {

        const v1 = vectors[i];
        const v2 = vectors[i + 1];
        const v3 = vectors[i + 2];

        const tr = Triangle.create(v1, v2, v3);
        const angleToView = tr.normal().angle(viewingDirection);

        // culling
        if (!options.wireframe && angleToView < halfPi) {
            continue;
        }

        const brightness = tr.normal().angle(lightDirection) / Math.PI / 2;

        context.fillStyle = `hsl(48deg 100% ${(brightness * 130)}%)`;

        context.beginPath();
        context.moveTo(vectors[i][0], vectors[i][1]);
        context.lineTo(vectors[i + 1][0], vectors[i + 1][1]);
        context.lineTo(vectors[i + 2][0], vectors[i + 2][1]);
        context.closePath();
        if (!!options.wireframe) {
            context.lineWidth = 0.01;
            context.stroke();
        } else {
            context.fill();
        }
    }

    drawCrossbarWindow(context);

    const duration = performance.now() - start;
    perf.addFrameTime(duration);

    drawPerfStats(context);
}

function drawPerfStats(context: CanvasRenderingContext2D) {
    context.fillStyle = "black";
    const lineHeight = 0.1;
    context.font = `${lineHeight}px sans-serif`;
    writeRightBound("FPS: " + perf.fps().toFixed(0), 0);
    writeRightBound("ms:" + perf.mean().toFixed(1), 1);

    function writeRightBound(text: string, line: number) {
        const metrics = context.measureText(text);
        context.fillText(text, 1 - metrics.width - 0.05, -1 + (lineHeight * line));
    }
}

function rad(deg: number): number {
    return deg / 360 * Math.PI * 2;
}

function deg(rad: number): number {
    return rad / Math.PI / 2 * 360;
}

function drawCrossbarWindow(context: CanvasRenderingContext2D) {
    context.lineWidth = 0.01;
    context.strokeStyle = "rgb(200, 200, 200)";
    context.strokeRect(-1, -1, 2, 2);
    context.beginPath();
    context.moveTo(-1, 0);
    context.lineTo(1, 0);
    context.moveTo(0, -1);
    context.lineTo(0, 1);
    context.stroke();
}