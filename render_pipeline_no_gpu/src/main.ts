import { Cube, load, rotateX, rotateY, rotZ as rotateZ, transform, translate } from "./models";

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
    console.log({ width: canvas.width, height: canvas.height })

    context.translate(canvas.width / 2, canvas.height / 2);
    const scale = 0.4;
    context.scale(canvas.width * scale, canvas.height * scale);
    context.fillRect(-1, -1, 2, 2);
    context.scale(1, -1);
    renderLoop(canvas, context);
});

function renderLoop(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const timestamp = Date.now();
    
    let vectors = load(Cube);
    const phiDeg = timestamp / 100 % 360;
    const phiRad = rad(phiDeg);
    vectors = transform(vectors, translate(-0.5, -0.5, -0.5));
    vectors = transform(vectors, rotateY(phiRad));

    context.clearRect(-2, -2, 4, 4);

    for (let i = 0; i < vectors.length; i += 3) {
        context.strokeStyle = "black";
        context.lineWidth = 0.01;
        
        context.beginPath();
        context.moveTo(vectors[i][0], vectors[i][1]);
        context.lineTo(vectors[i+1][0], vectors[i+1][1]);
        context.lineTo(vectors[i+2][0], vectors[i+2][1]);
        context.closePath();
        context.stroke();
    }

    drawCrossbarWindow(context);
    
    window.setTimeout(() => renderLoop(canvas, context), 100);
}

function rad(deg : number) : number{
    return deg / 360 * Math.PI * 2;
}

function drawCrossbarWindow(context: CanvasRenderingContext2D) {
    context.strokeStyle = "rgb(200, 200, 200)";
    context.strokeRect(-1, -1, 2, 2);
    context.beginPath();
    context.moveTo(-1, 0);
    context.lineTo(1, 0);
    context.moveTo(0, -1);
    context.lineTo(0, 1);
    context.stroke();
}
