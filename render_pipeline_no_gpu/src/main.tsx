import React, { FormEvent, FormEventHandler, useEffect, useState } from "react";
import { Mat4, Vertex, VertexEx, Vec4, Vector, Vector3, cameraProjection, mean, median, mul as multiMul, noopProjection, rad, rotateX, rotateY, rotateZ, scale, transformEx, translate, angle, RGBA } from "./math";
import * as myMath from "./math";
import { Cube_old, Plane, Sphere, Teapot_150k, Teapot_19k, Teapot_3k, Triangle, vec } from "./models";
import { delay } from "./util";
import { createRoot } from 'react-dom/client';
import * as uuid from "uuid";

enum Models {
    Cube,
    TeapotLow,
    TeapotMid,
    TeapotHigh,
    Plane,
    Sphere,
    Triangle
}

const runRenderLoop = false;

const modelOptions = new Map<Models, { label: string, vectors: () => Promise<VertexEx[]> }>();
modelOptions.set(Models.Triangle, { label: 'Triangle', vectors: Triangle });
modelOptions.set(Models.Cube, { label: 'Cube', vectors: Cube_old });
// modelOptions.set(Models.Plane, { label: 'Plane', vectors: Plane });
modelOptions.set(Models.Sphere, { label: 'Sphere', vectors: Sphere });
modelOptions.set(Models.TeapotLow, { label: 'Teapot low (3.5k triangles)', vectors: Teapot_3k });
modelOptions.set(Models.TeapotMid, { label: 'Teapot mid (19k triangles)', vectors: Teapot_19k });
modelOptions.set(Models.TeapotHigh, { label: 'Teapot high (150k triangles)', vectors: Teapot_150k });

class RenderOptions {
    constructor(public readonly initialModel: Models) {
        modelOptions.get(initialModel)!
            .vectors()
            .then((x: VertexEx[]) => {
                this.loadedVectors = x;
            });
    }
    wireframe: boolean = false;
    light: VertexEx = {
        position: vec(0, 0, 0),
        normal: vec(-1, -1, 0.5)
    };
    view: VertexEx = {
        position: vec(0, 0, -3),
        normal: vec(0, 0, 1),
    };
    loadedVectors: VertexEx[] = [];
    z = 0;
    x = 0;
    rotationHorizontal = 0;
    rotationVertical = 0;
}

const renderOpts = new RenderOptions(Models.Cube);

function renderFrame() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    render(ctx, renderOpts);
}

document.addEventListener("keydown", event => {
    //console.log("keydown: ", event);

    const angleStep = Math.PI / 20
    const step = 0.05;

    if (event.key === "ArrowRight") {
        renderOpts.rotationHorizontal += angleStep;
        renderFrame();
        return;
    }

    if (event.key === "ArrowLeft") {
        renderOpts.rotationHorizontal -= angleStep;
        renderFrame();
        return;
    }

    if (event.key === "ArrowUp") {
        renderOpts.rotationVertical += angleStep;
        renderFrame();
        return;
    }

    if (event.key === "ArrowDown") {
        renderOpts.rotationVertical -= angleStep;
        renderFrame();
        return;
    }

    if (event.key === "w") {
        renderOpts.z -= step;
        renderFrame();
        return;
    }

    if (event.key === "s") {
        renderOpts.z += step;
        renderFrame();
        return;
    }

    if (event.key === "a") {
        renderOpts.x += step;
        renderFrame();
        return;
    }

    if (event.key === "d") {
        renderOpts.x -= step;
        renderFrame();
        return;
    }
});


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
                <input name="wireframe" type="checkbox" onChange={function (e) {
                    renderOpts.wireframe = !renderOpts.wireframe;
                    renderFrame();
                }} />
            </label>
            <hr />
            <ModelSelect />
        </div>
    </>);
}

function ModelSelect() {
    const [model, SetModel] = useState(renderOpts.initialModel);

    function onModelSelected(event) {
        const value = Number.parseInt(event.target.value);
        SetModel(value);
        const item = modelOptions.get(value)!;
        item.vectors().then(function (x) {
                renderOpts.loadedVectors = x;
                renderFrame();
            });
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

    const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = "black";
    ctx.fillStyle = "hotpink";
    ctx.lineWidth = 1;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    const scale = 0.45;
    ctx.scale(canvas.width * scale, canvas.height * scale);
    ctx.fillRect(-1, -1, 2, 2);
    renderLoop(canvas, ctx);
}

async function renderLoop(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    do {
        const start = performance.now();
        render(context, renderOpts);
        const duration = performance.now() - start;
        await delay(Math.max(0, minFrameDuration - duration));
    }
    while (runRenderLoop)
}

function render(ctx: CanvasRenderingContext2D, options: RenderOptions) {
    const start = performance.now();

    ctx.clearRect(-2, -2, 4, 4);

    const camProjection = noopProjection();
    const modelViewProj = noopProjection();

    let vectors = options.loadedVectors;
    const phiDeg = Date.now() / 100 % 360;
    const phiRad = rad(phiDeg);
    // // vectors = transformEx(vectors, scale(2, 2, 2));
    // //vectors = transform(vectors, rotateY(phiRad*3));
    // vectors = transformEx(vectors, rotateY(renderOpts.rotationHorizontal));
    // vectors = transformEx(vectors, rotateX(renderOpts.rotationVertical));
    // //vectors = transform(vectors, rotateX(phiRad + 0.5));
    // //vectors = transform(vectors, rotateZ(phiRad + 0.1));
    // // vectors = transform(vectors, rotateX(-0.3));
    // // vectors = transform(vectors, rotateZ(0));
    // // vectors = transformEx(vectors, translate(0, 0, -3))
    // vectors = transformEx(vectors, translate(renderOpts.x, 0, renderOpts.z));

    vectors = vectors.map(x => {
        return multiMul([
            scale(0.5, 0.5, 0.5),
            rotateY(renderOpts.rotationHorizontal),
            rotateX(renderOpts.rotationVertical),
            translate(renderOpts.x, 0, renderOpts.z),
            //cameraProjection()
        ], x);
    });
    
    const light: VertexEx = transformEx([options.light], camProjection)[0];

    const transformations = [
        scale(0.2, 0.2, 0.2),
        rotateY(phiRad * 3),
        camProjection,
        modelViewProj
    ];

    const vertexShaderOut: VertexEx[] = [];

    for (const v_in of vectors) {
        const v_out = vertexShader(v_in, camProjection, modelViewProj);
        vertexShaderOut.push(v_out);
    }

    for (let i = 0; i < vertexShaderOut.length; i += 3) {
        const [v1, v2, v3] = vertexShaderOut.slice(i, i + 3);

        const angleToView = angle(v1.normal, options.view.normal);

        //console.log(`${angleToView.toFixed(6)}`, v1.position, v1.normal, options.view.normal);

        // culling
        if (!options.wireframe && angleToView < halfPi) {
            continue;
        }

        //const brightness = angle(vec.normal, light.normal) / Math.PI / 2;
        // context.fillStyle = `hsl(48deg 100% ${(brightness * 130)}%)`;

        ctx.beginPath();
        ctx.moveTo(v1.position.x, -v1.position.y);
        ctx.lineTo(v2.position.x, -v2.position.y);
        ctx.lineTo(v3.position.x, -v3.position.y);
        ctx.closePath();

        // if (v1.color !== undefined && v2.color !== undefined){
        //     const gradient = context.createConicGradient(v1.position.x, -v1.position.y, v2.position.x, -v2.position.y);
        //     const c1 = v1.color;
        //     gradient.addColorStop(0, `rgb(${v1.color[0]}, ${v1.color[1]}, ${v1.color[2]})`);
        //     gradient.addColorStop(1, `rgb(${v2.color![0] ?? "hotpink"}, ${v2.color![1]  ?? "hotpink"}, ${v2.color![2]  ?? "hotpink"})`);
        //     context.strokeStyle = context.fillStyle = gradient;
        // } else {
        //     // context.strokeStyle = context.fillStyle = `rgb(${Math.abs(v2.position.x) * 255}, ${Math.abs(v2.normal.y * 255)}, ${Math.abs(v2.normal.z * 255)})`;
        //     context.strokeStyle = context.fillStyle = "hotpink";
        // }

        ctx.globalCompositeOperation = "source-over";

        const gradient = false;
        if (!!options.wireframe) {
            ctx.strokeStyle = "darkgray";
            ctx.lineWidth = 0.01;
            ctx.stroke();
        } else if(gradient) {

            // fill with black
            ctx.fillStyle = "black";
            ctx.fill();

            ctx.globalCompositeOperation = "lighter";

            const radius = myMath.length(myMath.sub(v1.position, v2.position));
            const grd1 = ctx.createRadialGradient(v1.position.x, -v1.position.y, 0, v1.position.x, -v1.position.y, radius);
            grd1.addColorStop(0, toRgb(v1.color, 1));
            grd1.addColorStop(1, toRgb(v1.color, 0));
    
            const grd2 = ctx.createRadialGradient(v2.position.x, -v2.position.y, 0, v2.position.x, -v2.position.y, radius);
            grd2.addColorStop(0, toRgb(v2.color, 1));
            grd2.addColorStop(1, toRgb(v2.color, 0));
    
            const grd3 = ctx.createRadialGradient(v3.position.x, -v3.position.y, 0, v3.position.x, -v3.position.y, radius);
            grd3.addColorStop(0, toRgb(v3.color, 1));
            grd3.addColorStop(1, toRgb(v3.color, 0));

            ctx.fillStyle = grd1;
            ctx.fill();

            ctx.fillStyle = grd2;
            ctx.fill();

            ctx.fillStyle = grd3;
            ctx.fill();
        } else {
            const lightAngle = angle(v1.normal, light.normal)
            ctx.fillStyle = `hsl(48 100% ${lightAngle/Math.PI * 100}%)`;
            ctx.fill();
        }
    }

    drawCrossbarWindow(ctx);

    const duration = performance.now() - start;
    perf.addFrameTime(duration);

    drawPerfStats(ctx);

    function toRgb(c: RGBA | undefined, alpha) {
        if (c === undefined) {
            return "hotpink";
        }
        return `rgb(${c[0]} ${c[1]} ${c[2]} / ${alpha * 100}%)`
    }
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

function drawCrossbarWindow(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = 0.01;
    ctx.strokeStyle = "rgb(200, 200, 200)";
    ctx.strokeRect(-1, -1, 2, 2);
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.lineTo(1, 0);
    ctx.moveTo(0, -1);
    ctx.lineTo(0, 1);
    ctx.stroke();
}

function vertexShader(vec: VertexEx, projectionMatrix: Mat4, modelViewMatrix: Mat4): VertexEx {
    const res = multiMul([projectionMatrix, modelViewMatrix], vec);
    return {
        position: res.position,
        normal: myMath.unit(vec.normal),
        color: vec.color
    };
}
