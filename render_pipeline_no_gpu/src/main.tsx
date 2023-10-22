import React, { FormEvent, FormEventHandler, useEffect, useState } from "react";
import { Triangle, Vec3, Vec4, Vector, cameraProjection, mean, median, rad, rotateX, rotateY, rotateZ, scale, transform, translate } from "./math";
import { Cube, Teapot_150k, Teapot_19k, Teapot_3k } from "./models";
import { delay } from "./util";
import { createRoot } from 'react-dom/client';
import * as uuid from "uuid";

enum Models{
    Cube,
    TeapotLow,
    TeapotMid,
    TeapotHigh
}

const modelOptions = new Map();
modelOptions.set(Models.Cube, { label: 'Cube', vectors: Cube });
modelOptions.set(Models.TeapotLow, { label: 'Teapot low (3.5k triangles)', vectors: Teapot_3k });
modelOptions.set(Models.TeapotMid, { label: 'Teapot mid (19k triangles)', vectors: Teapot_19k });
modelOptions.set(Models.TeapotHigh, { label: 'Teapot high (150k triangles)', vectors: Teapot_150k });

class RenderOptions {
    constructor(public readonly initialModel : Models){
        modelOptions.get(initialModel)
            .vectors()
            .then((x: Vec3[]) => this.loadedVectors = x);
    }
    wireframe: boolean = false;
    lightDirection = Vector.create4([-1, -1, 1, 1]);
    viewingDirection = Vector.create4([0, 0, 1, 1]);
    loadedVectors: Vec3[] = [];
}

const renderOpts = new RenderOptions(Models.TeapotLow);

new EventSource('/esbuild').addEventListener('change', () => location.reload());

document.addEventListener("DOMContentLoaded", event => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.width = 600;
    canvas.height = 600;
    canvas.style.border = "2px black solid";
    startRender(canvas);

    const root = createRoot(document.getElementById("app") as HTMLDivElement);
    root.render(<>
        <MyApp />
    </>);
});

function MyApp() {
    return (<>
        <div style={{ width: 400 }}>
            <label>
                wireframe:
                <input name="wireframe" type="checkbox" onChange={e => renderOpts.wireframe = !renderOpts.wireframe} />
            </label>
            <hr />
            <ModelSelect />
        </div>
    </>);
}

function ModelSelect(){
    const [model, SetModel] = useState(renderOpts.initialModel);

    function onModelSelected(event){
        const value = Number.parseInt(event.target.value);
        SetModel(value);
        const item = modelOptions.get(value);
        item.vectors().then(x => renderOpts.loadedVectors = x);
    }

    return (
        <label>model:
        <select
            value={model}
            onChange={onModelSelected}>
            {[...modelOptions].map(x => (
                <option key={uuid.v4()} value={x[0]}>{x[1].label}</option>
            ))}
        </select>
    </label>
    )
}

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

const halfPi = Math.PI / 2;
const quaterPi = Math.PI / 4;
const frameCap = 30;
const minFrameDuration = 1000 / frameCap;

function startRender(canvas: HTMLCanvasElement) {
    console.log("startRender()", canvas);

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
}

async function renderLoop(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    while (true) {
        const start = performance.now();
        render(context, renderOpts);
        const duration = performance.now() - start;
        await delay(Math.max(0, minFrameDuration - duration));
    }
}

function render(context: CanvasRenderingContext2D, options: RenderOptions) {
    const start = performance.now();

    let vectors = options.loadedVectors;
    const phiDeg = Date.now() / 100 % 360;
    const phiRad = rad(phiDeg);
    vectors = transform(vectors, scale(1, 1, 1));
    vectors = transform(vectors, rotateY(phiRad*3));
    //vectors = transform(vectors, rotateX(phiRad + 0.5));
    //vectors = transform(vectors, rotateZ(phiRad + 0.1));
    vectors = transform(vectors, rotateX(-0.3));
    vectors = transform(vectors, rotateZ(0));
    vectors = transform(vectors, translate(0, 0, 2))
    vectors = transform(vectors, cameraProjection());

    context.clearRect(-2, -2, 4, 4);

    for (let i = 0; i < vectors.length; i += 3) {
        const tr = Triangle.create(
            vectors[i], 
            vectors[i + 1], 
            vectors[i + 2]);
        const angleToView = tr.normal().angle(options.viewingDirection);

        // culling
        if (!options.wireframe && angleToView < halfPi) {
            continue;
        }

        const brightness = tr.normal().angle(options.lightDirection) / Math.PI / 2;

        context.fillStyle = `hsl(48deg 100% ${(brightness * 130)}%)`;

        context.beginPath();
        context.moveTo(tr.v1.x, -tr.v1.y);
        context.lineTo(tr.v2.x, -tr.v2.y);
        context.lineTo(tr.v3.x, -tr.v3.y);
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