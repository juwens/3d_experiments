import { Triangle, Vec3, Vector3 } from "./math";
import { Cube, Teapot_145620_triangles, Teapot_19480_triangles, Teapot_3488_triangles, rotateX, rotateY, rotZ as rotateZ, scale, transform, translate } from "./models";
import { hslToRgb } from "./color";

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
    // context.scale(1/100, 1/100);
    //console.log({ width: canvas.width, height: canvas.height })

    context.translate(canvas.width / 2, canvas.height / 2);
    const scale = 0.45;
    context.scale(canvas.width * scale, canvas.height * scale);
    context.fillRect(-1, -1, 2, 2);
    //context.scale(1, -1);
    renderLoop(canvas, context);
});

class PerformanceCounter {
    #frametimes: number[] = [];
    #currentIdx: number = 0;
    #maxIdx: number = 30;

    addFrameTime(duration: number) {
        if (this.#currentIdx === this.#maxIdx) {
            this.#currentIdx = 0;
        }
        this.#frametimes[this.#currentIdx] = duration;
        this.#currentIdx++;
    }

    mean() {
        const sum = this.#frametimes.reduce((a, b) => a + b, 0);
        return sum / this.#frametimes.length;
    }

    median() {
        const sorted = this.#frametimes.sort();
        return sorted[Math.floor(sorted.length / 2)];
    }

    fps() {
        return 1000 / this.mean();
    }

    constructor() { }
}

const perf = new PerformanceCounter();

let loadedVectors: Vec3[] = [];


Teapot_3488_triangles()
    //Teapot_19480_triangles()
    //Teapot_145620_triangles()
    .then(x => {
        loadedVectors = [...x];
    });

const halfPi = Math.PI / 2;
const quaterPi = Math.PI / 4;
async function renderLoop(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const start = performance.now();
    const wireframe = false;
    const lightDirection = Vector3.create([-1, -1, 1]);
    const viewingDirection = Vector3.create([0, 0, 1]);

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
        if (!wireframe && angleToView < halfPi) {
            continue;
        }

        const brightness = tr.normal().angle(lightDirection) / Math.PI / 2;

        context.fillStyle = `hsl(48deg 100% ${(brightness * 130)}%)`

        context.beginPath();
        context.moveTo(vectors[i][0], vectors[i][1]);
        context.lineTo(vectors[i + 1][0], vectors[i + 1][1]);
        context.lineTo(vectors[i + 2][0], vectors[i + 2][1]);
        context.closePath();
        if (wireframe) {
            context.lineWidth = 0.01;
            context.stroke();
        } else {
            context.fill();
        }
    }

    drawCrossbarWindow(context);

    const duration = performance.now() - start;
    perf.addFrameTime(duration);

    drawFps(context);
    setTimeout(() => renderLoop(canvas, context));
}

function drawFps(context: CanvasRenderingContext2D) {
    const fps = perf.fps().toFixed(0);

    context.fillStyle = "black";
    const lineHeight = 0.2;
    context.font = `${lineHeight}px sans-serif`;
    const metrics = context.measureText(fps);
    context.fillText(fps, 1 - metrics.width - 0.05, -1 + lineHeight);
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