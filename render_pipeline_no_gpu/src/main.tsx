import React, { useEffect, useState } from "react";
import { Mat4, VertexEx, mean, median, mul as multiMul, noopProjection, deg2rad, rotateX, rotateY, scale, transformEx, translate, angle, RGBA, round3 } from "./math";
import * as myMath from "./math";
import { Cube_from_mdn, Cube_old, Sphere, Teapot_150k, Teapot_19k, Teapot_3k, Triangle, vec, vecF4 } from "./modelLoader";
import { delay } from "./util";
import { createRoot } from 'react-dom/client';
import * as uuid from "uuid";
import * as wgr from "./webglRender"
import { Models, RenderOptions, ModelsMap, nullRefError, useRenderParamsStore as useRenderParamsStore, Float16 } from "./common";
import * as inHdlr from "./inputHandler"
import { MDN } from "./MDN";

const runRenderLoop = false;

const modelOptions = new ModelsMap();
modelOptions.set(Models.Triangle, { label: 'Triangle', vectors: Triangle });
modelOptions.set(Models.Cube, { label: 'Cube (MDN)', vectors: Cube_from_mdn });
// modelOptions.set(Models.Plane, { label: 'Plane', vectors: Plane });
modelOptions.set(Models.Sphere, { label: 'Sphere', vectors: Sphere });
modelOptions.set(Models.TeapotLow, { label: 'Teapot low (3.5k triangles)', vectors: Teapot_3k });
modelOptions.set(Models.TeapotMid, { label: 'Teapot mid (19k triangles)', vectors: Teapot_19k });
modelOptions.set(Models.TeapotHigh, { label: 'Teapot high (150k triangles)', vectors: Teapot_150k });

useRenderParamsStore.setState({
    x: 0,
    y: 0,
    z: -30,
    fov: Math.PI * 0.5,
    rotX: Math.PI / 4,
    rotY: Math.PI / 4,
    near: 1,
    far: 200,
});

useRenderParamsStore.subscribe(x => {
    drawFrame();
});

inHdlr.setupInputHandler();

const renderParams = new RenderOptions(Models.Cube, modelOptions, useRenderParamsStore);
let mdnRenderer: wgr.CubeDemo;

function drawFrame() {
    setTimeout(() => {
        mdnRenderer.draw();
    });

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    draw(ctx, renderParams);
}

new EventSource('/esbuild').addEventListener('change', () => location.reload());

document.addEventListener("DOMContentLoaded", event => {
    {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        canvas.width = 400;
        canvas.height = 400;
        canvas.style.border = "2px black solid";
        startRender(canvas);
    }
    {
        const canvas = (document.getElementById("webgl-canvas") ?? nullRefError()) as HTMLCanvasElement;
        canvas.width = 400;
        canvas.height = 400;
        canvas.style.border = "2px black solid";
        mdnRenderer = new wgr.CubeDemo(canvas.getContext("webgl") ?? nullRefError(), renderParams);
    }

    drawFrame();

    const root = createRoot(document.getElementById("app") as HTMLDivElement);
    root.render(<>
        <MyApp />
    </>);
});

function MyApp() {
    const setX = useRenderParamsStore(state => state.setX);
    const setY = useRenderParamsStore(state => state.setY);
    const setZ = useRenderParamsStore(state => state.setZ);
    const setRotX = useRenderParamsStore(state => state.setRotX);
    const setRotY = useRenderParamsStore(state => state.setRotY);
    const setRotZ = useRenderParamsStore(state => state.setRotZ);
    const setFov = useRenderParamsStore(state => state.setFov);
    const setNear = useRenderParamsStore(state => state.setNear);
    const setFar = useRenderParamsStore(state => state.setFar);

    const x = useRenderParamsStore(state => state.x);
    const y = useRenderParamsStore(state => state.y);
    const z = useRenderParamsStore(state => state.z);
    const rotX = useRenderParamsStore((state) => state.rotX);
    const rotY = useRenderParamsStore((state) => state.rotY);
    const fov = useRenderParamsStore((state) => state.fov);
    const near = useRenderParamsStore((state) => state.near);
    const far = useRenderParamsStore((state) => state.far);

    const sliderWidth = 300;
    return (<>
        <div style={{ width: 400 }}>
            <label>
                wireframe:
                <input name="wireframe" type="checkbox" onChange={function (e) {
                    renderParams.wireframe = !renderParams.wireframe;
                    drawFrame();
                }} />
            </label>
            <hr />
            <ModelSelect />
            <hr />
            <label>x: {x}</label>
            <hr />
            <label>y: {y}</label>
            <hr />
            <label>z: {z}<br />
                <input type="range" value={z}
                    min={-100} max={100}
                    onChange={e => setZ(Number.parseFloat(e.target.value))}
                    style={{ width: sliderWidth }} />
            </label>
            <hr />
            <label>rotX: {rotX.toFixed(3)}</label>
            <hr />
            <label>rotY: {rotY.toFixed(3)}</label>
            <hr />
            <div>
                <span style={{ width: 300, display: "inline-block" }}>
                    fov: {myMath.rad2deg(fov).toFixed(1)}°
                    (
                    rad: {(fov).toFixed(3)},
                    π: {(fov / Math.PI).toFixed(3)}
                    )
                </span>
                <input type="range" value={myMath.rad2deg(fov)}
                    min={10} max={120}
                    onChange={(e) => setFov(deg2rad(Number.parseFloat(e.target.value)))}
                    style={{ width: sliderWidth }} />
            </div>
            <hr />
            <label>
                near clip: {near} <br />
                <input type="range" value={near}
                    onChange={e => setNear(Number.parseFloat(e.target.value))} min={-10} max={50}
                    style={{ width: sliderWidth }} />
            </label>
            <hr />
            <label>far clip: {far} <br />
                <input type="range" value={far}
                    onChange={e => setFar(Number.parseFloat(e.target.value))}
                    min={-100} max={200}
                    style={{ width: sliderWidth }} />
            </label>
        </div>
    </>);
}

function ModelSelect() {
    const [model, SetModel] = useState(renderParams.initialModel);

    function onModelSelected(event) {
        const value = Number.parseInt(event.target.value);
        SetModel(value);
        const item = modelOptions.get(value)!;
        item.vectors().then(function (x) {
            renderParams.loadedVectors = x;
            drawFrame();
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
    renderLoop(ctx);
}

async function renderLoop(context: CanvasRenderingContext2D) {
    do {
        const start = performance.now();
        draw(context, renderParams);
        const duration = performance.now() - start;
        await delay(Math.max(0, minFrameDuration - duration));
    }
    while (runRenderLoop)
}

function draw(ctx: CanvasRenderingContext2D, options: RenderOptions) {
    const start = performance.now();

    ctx.clearRect(-2, -2, 4, 4);

    const state = renderParams.state;

    const modelTransform = MDN.multiplyArrayOfMatrices([
        MDN.translateMatrix(state.x, state.y, state.z), // step 4
        MDN.rotateYMatrix(state.rotY), // step 3
        MDN.rotateXMatrix(state.rotX), // step 2
        MDN.scaleMatrix(5, 5, 5)     // step 1
    ]);

    const perspectiveProjection = MDN.perspectiveMatrix(state.fov, 1, state.near, state.far);

    //console.log(vectors.map(x => x.position));
    //console.log(JSON.stringify(options.loadedVectors.map(x => x.position)));

    const vertexShaderOut: VertexEx[] = [];

    for (const v_in of options.loadedVectors) {
        const v_out = vertexShader(v_in, perspectiveProjection, modelTransform);
        vertexShaderOut.push(v_out);
    }

    const viewProjected = vertexShader(options.view, perspectiveProjection, modelTransform);
    console.log(viewProjected);
    for (let i = 0; i < vertexShaderOut.length; i += 3) {
        const [v1, v2, v3] = vertexShaderOut.slice(i, i + 3);

        const angleToView = angle(v1.normal, viewProjected.normal);
        console.log(v1, v2,v3, angleToView);

        // culling
        if (!options.wireframe && angleToView < halfPi) {
            continue;
        }

        ctx.beginPath();
        ctx.moveTo(v1.position.x, -v1.position.y);
        ctx.lineTo(v2.position.x, -v2.position.y);
        ctx.lineTo(v3.position.x, -v3.position.y);
        ctx.closePath();

        ctx.globalCompositeOperation = "source-over";

        const gradient = false;
        if (!!options.wireframe) {
            ctx.strokeStyle = "darkgray";
            ctx.lineWidth = 0.01;
            ctx.stroke();
        } else if (gradient) {
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
            // const lightAngle = angle(v1.normal, light.normal)
            ctx.fillStyle = `rgb(${v1.color?.[0]} ${v1.color?.[1]} ${v1.color?.[2]})`;
            ctx.fill();
        }
    }

    drawCrossbarWindow(ctx);

    const duration = performance.now() - start;
    perf.addFrameTime(duration);

    drawPerfStats(ctx);

    function toRgb(c: RGBA | undefined | null, alpha: number | null | undefined) {
        if (Array.isArray(c)) {
            return `rgb(${c[0]} ${c[1]} ${c[2]} / ${(alpha ?? 1) * 100}%)`
        }

        return "hotpink";
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

function vertexShader(vec_in: VertexEx, projectionMatrix: Float16, modelViewMatrix: Float16): VertexEx {
    const mat = MDN.multiplyMatrices(projectionMatrix, modelViewMatrix);
    const p_in = vec_in.position;
    const p_out = MDN.multiplyPoint(mat, [p_in.x, p_in.y, p_in.z, 1]);
    const n_in = vec_in.normal;
    const n_out = MDN.multiplyPoint(mat, [n_in.x, n_in.y, n_in.z, 1]);
    //console.log("vertexShader: in -> out", [p_in.x, p_in.y, p_in.z].map(round3), p_out.map(round3));
    return {
        position: vecF4(p_out),
        normal: myMath.unit(vecF4(n_out)),
        color: vec_in.color
    };
}